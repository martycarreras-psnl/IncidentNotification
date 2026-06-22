#!/usr/bin/env python
"""
provision_schema.py — Provision the IRMA Dataverse schema from dataverse/planning-payload.json.

Idempotent: re-running skips components that already exist. Phased to avoid
metadata lock contention (all option sets -> all tables -> wait -> all columns ->
wait -> all lookups -> field security).

Uses the Dataverse Web API for full control over OwnershipType (UserOwned),
global option sets, column formats/precision, and column-level security, and the
Python SDK for lookup relationships.

Run: .venv/bin/python scripts/provision_schema.py
"""
import sys, os, json, time, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(__file__))
from auth import get_client, get_token, load_env

load_env()
BASE = os.environ["DATAVERSE_URL"].rstrip("/") + "/api/data/v9.2"
SOLUTION = os.environ.get("SOLUTION_NAME", "IRMA")
TOKEN = get_token()
client = get_client("dv-metadata")

def H(extra=None):
    h = {
        "Authorization": f"Bearer {TOKEN}",
        "OData-MaxVersion": "4.0", "OData-Version": "4.0",
        "Accept": "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "MSCRM.SolutionUniqueName": SOLUTION,
    }
    if extra:
        h.update(extra)
    return h

def label(text):
    return {"@odata.type": "Microsoft.Dynamics.CRM.Label",
            "LocalizedLabels": [{"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                                 "Label": text, "LanguageCode": 1033}]}

def req(method, path, body=None, headers=None):
    url = path if path.startswith("http") else BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers=headers or H())
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {}), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace"), dict(e.headers)

def retry(fn, tries=5, delay=5):
    for i in range(tries):
        code, body, hdrs = fn()
        if isinstance(body, str) and any(x in body for x in ["0x80040216", "0x80060891", "another customization", "0x80072322"]):
            print(f"   transient ({i+1}/{tries}), waiting {delay}s…")
            time.sleep(delay)
            continue
        return code, body, hdrs
    return code, body, hdrs

# ---- load schema ----
payload = json.load(open(os.path.join(os.path.dirname(__file__), "..", "dataverse", "planning-payload.json")))
gsets = payload["globalOptionSets"]
tables = payload["tables"]
rels = payload["relationships"]
colsec = payload["columnSecurity"]

ODATA = {
    "String": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "Memo": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
    "Boolean": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
    "Integer": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
    "Decimal": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
    "DateTime": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
    "Picklist": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
}

# =====================================================================
# Phase 1 — Global option sets
# =====================================================================
print("\n=== Phase 1: Global option sets ===")
optionset_ids = {}
# Pre-list existing global option sets -> {Name: MetadataId}
_existing = req("GET", "/GlobalOptionSetDefinitions?$select=Name")[1].get("value", [])
existing_sets = {o.get("Name"): o.get("MetadataId") for o in _existing if o.get("Name")}

def entityid_from_headers(hdrs):
    loc = hdrs.get("OData-EntityId") or hdrs.get("odata-entityid") or ""
    if "(" in loc and ")" in loc:
        return loc[loc.rfind("(") + 1:loc.rfind(")")]
    return None

for g in gsets:
    name = g["name"]
    if name in existing_sets:
        optionset_ids[name] = existing_sets[name]
        print(f"  reuse  {name}")
        continue
    osbody = {
        "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
        "Name": name, "DisplayName": label(g["displayName"]),
        "Description": label(g.get("description", "")),
        "OptionSetType": "Picklist", "IsGlobal": True,
        "Options": [{"@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata",
                     "Value": o["value"], "Label": label(o["label"])} for o in g["options"]],
    }
    code, body, hdrs = retry(lambda: req("POST", "/GlobalOptionSetDefinitions", osbody))
    if code in (200, 201, 204):
        mid = entityid_from_headers(hdrs)
        if not mid:
            relist = req("GET", "/GlobalOptionSetDefinitions?$select=Name")[1].get("value", [])
            mid = next((o.get("MetadataId") for o in relist if o.get("Name") == name), None)
        optionset_ids[name] = mid
        print(f"  create {name}  ({mid})")
    else:
        print(f"  FAIL   {name}: {body}")
        sys.exit(1)

# =====================================================================
# Phase 2 — Tables (with primary name attribute), UserOwned
# =====================================================================
print("\n=== Phase 2: Tables (UserOwned) ===")
existing_defs = req("GET", "/EntityDefinitions?$select=LogicalName")[1]["value"]
existing_logical = {d["LogicalName"] for d in existing_defs}
for t in tables:
    logical = t["logicalName"]
    if logical in existing_logical:
        print(f"  reuse  {logical}")
        continue
    pn = t["primaryName"]
    ent = {
        "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
        "SchemaName": t["schemaName"],
        "DisplayName": label(t["displayName"]),
        "DisplayCollectionName": label(t["displayCollectionName"]),
        "Description": label(t.get("description", "")),
        "OwnershipType": "UserOwned",
        "HasActivities": bool(t.get("hasActivities", False)),
        "HasNotes": bool(t.get("hasNotes", False)),
        "IsActivity": False,
        "PrimaryNameAttribute": pn["schemaName"].lower(),
        "Attributes": [{
            "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
            "SchemaName": pn["schemaName"],
            "DisplayName": label(pn["displayName"]),
            "Description": label(pn.get("description", "")),
            "RequiredLevel": {"Value": pn.get("requiredLevel", "None")},
            "MaxLength": pn.get("maxLength", 200),
            "FormatName": {"Value": "Text"},
            "IsPrimaryName": True,
        }],
    }
    code, body, _ = retry(lambda: req("POST", "/EntityDefinitions", ent))
    if code in (200, 201, 204):
        print(f"  create {logical}")
    else:
        print(f"  FAIL   {logical}: {body}")
        sys.exit(1)

print("  …waiting 25s for table metadata propagation")
time.sleep(25)

# =====================================================================
# Phase 3 — Non-lookup columns
# =====================================================================
print("\n=== Phase 3: Columns ===")
def build_attr(col):
    t = col["type"]
    a = {"@odata.type": ODATA[t], "SchemaName": col["schemaName"],
         "DisplayName": label(col["displayName"]),
         "RequiredLevel": {"Value": col.get("requiredLevel", "None")}}
    if col.get("$comment"):
        a["Description"] = label(col["$comment"])
    if t == "String":
        a["MaxLength"] = col.get("maxLength", 200); a["FormatName"] = {"Value": "Text"}
    elif t == "Memo":
        a["MaxLength"] = col.get("maxLength", 4000); a["Format"] = "TextArea"
    elif t == "Boolean":
        a["OptionSet"] = {"@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
                          "TrueOption": {"@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata", "Value": 1, "Label": label("Yes")},
                          "FalseOption": {"@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata", "Value": 0, "Label": label("No")}}
        if col.get("defaultValue") is True:
            a["DefaultValue"] = True
    elif t == "Integer":
        a["MinValue"] = col.get("minValue", -2147483648); a["MaxValue"] = col.get("maxValue", 2147483647); a["Format"] = "None"
    elif t == "Decimal":
        a["MinValue"] = col.get("minValue", 0); a["MaxValue"] = col.get("maxValue", 100000000); a["Precision"] = col.get("precision", 2)
    elif t == "DateTime":
        a["Format"] = col.get("format", "DateAndTime"); a["DateTimeBehavior"] = {"Value": "UserLocal"}
    elif t == "Picklist":
        if "globalOptionSetName" in col:
            a["GlobalOptionSet@odata.bind"] = f"/GlobalOptionSetDefinitions({optionset_ids[col['globalOptionSetName']]})"
        else:
            los = col["localOptionSet"]
            a["OptionSet"] = {"@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
                              "IsGlobal": False, "OptionSetType": "Picklist", "Name": los["name"],
                              "Options": [{"@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata",
                                           "Value": o["value"], "Label": label(o["label"])} for o in los["options"]]}
        if "defaultValue" in col:
            a["DefaultFormValue"] = col["defaultValue"]
    return a

for t in tables:
    logical = t["logicalName"]
    existing_cols = {c["LogicalName"] for c in req("GET", f"/EntityDefinitions(LogicalName='{logical}')/Attributes?$select=LogicalName")[1]["value"]}
    for col in t["columns"]:
        if col["type"] == "Lookup":
            continue
        clog = col["schemaName"].lower()
        if clog in existing_cols:
            print(f"  reuse  {logical}.{clog}")
            continue
        code, body, _ = retry(lambda: req("POST", f"/EntityDefinitions(LogicalName='{logical}')/Attributes", build_attr(col)))
        if code in (200, 201, 204):
            print(f"  create {logical}.{clog}")
        else:
            print(f"  FAIL   {logical}.{clog}: {body}")
            sys.exit(1)

print("  …waiting 25s for column metadata propagation")
time.sleep(25)

# =====================================================================
# Phase 4 — Lookups / relationships (SDK)
# =====================================================================
print("\n=== Phase 4: Lookups & relationships ===")
for r in rels:
    referencing = r["referencingEntity"]
    referenced = r["referencedEntity"]
    field = r["lookupSchemaName"]
    flog = field.lower()
    existing_cols = {c["LogicalName"] for c in req("GET", f"/EntityDefinitions(LogicalName='{referencing}')/Attributes?$select=LogicalName")[1]["value"]}
    if flog in existing_cols:
        print(f"  reuse  {referencing}.{flog} -> {referenced}")
        continue
    cascade = "Cascade" if r.get("cascade") == "parental" else "RemoveLink"
    if referenced.startswith("msftirma_"):
        # SDK auto-names the relationship with the referencing (msftirma_) prefix — OK.
        try:
            client.tables.create_lookup_field(
                referencing_table=referencing, lookup_field_name=field,
                referenced_table=referenced, display_name=r["lookupDisplayName"],
                cascade_delete=cascade, solution=SOLUTION,
            )
            print(f"  create {referencing}.{flog} -> {referenced} ({cascade})")
            time.sleep(3)
        except Exception as e:
            print(f"  FAIL   {referencing}.{flog} -> {referenced}: {e}")
            sys.exit(1)
    else:
        # Referenced is an OOB table (systemuser): SDK auto-name would be rejected
        # (must start with publisher prefix). Use Web API with explicit schema name.
        rel_name = f"msftirma_{referencing.replace('msftirma_', '')}_{flog.replace('msftirma_', '')}"
        relbody = {
            "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
            "SchemaName": rel_name,
            "ReferencedEntity": referenced,
            "ReferencingEntity": referencing,
            "CascadeConfiguration": {"Assign": "NoCascade", "Delete": "RemoveLink",
                                      "Merge": "NoCascade", "Reparent": "NoCascade",
                                      "Share": "NoCascade", "Unshare": "NoCascade"},
            "Lookup": {
                "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
                "SchemaName": field, "DisplayName": label(r["lookupDisplayName"]),
                "RequiredLevel": {"Value": "None"},
            },
        }
        code, body, _ = retry(lambda: req("POST", "/RelationshipDefinitions", relbody))
        if code in (200, 201, 204):
            print(f"  create {referencing}.{flog} -> {referenced} (Web API: {rel_name})")
            time.sleep(3)
        else:
            print(f"  FAIL   {referencing}.{flog} -> {referenced}: {body}")
            sys.exit(1)

# =====================================================================
# Phase 5 — Column-level security
# =====================================================================
print("\n=== Phase 5: Column security ===")
for cs in colsec:
    tbl, colname = cs["table"], cs["column"]
    code, body, _ = req("GET", f"/EntityDefinitions(LogicalName='{tbl}')/Attributes(LogicalName='{colname}')?$select=MetadataId,IsSecured")
    if code != 200:
        print(f"  FAIL   lookup {tbl}.{colname}: {body}"); sys.exit(1)
    if body.get("IsSecured"):
        print(f"  reuse  {tbl}.{colname} already secured"); continue
    mid = body["MetadataId"]
    cast = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
    patch = {"@odata.type": "Microsoft.Dynamics.CRM." + "StringAttributeMetadata", "IsSecured": True}
    code, b2, _ = retry(lambda: req("PATCH", f"/EntityDefinitions(LogicalName='{tbl}')/Attributes({mid})/{cast}", patch,
                                     headers=H({"MSCRM.MergeLabels": "true"})))
    if code in (200, 204):
        print(f"  secure {tbl}.{colname}")
    else:
        print(f"  FAIL   secure {tbl}.{colname}: {b2}")

# =====================================================================
# Publish
# =====================================================================
print("\n=== Publishing customizations ===")
req("POST", "/PublishAllXml", {})
print("Done. Schema provisioned.")
