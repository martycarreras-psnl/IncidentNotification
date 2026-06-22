#!/usr/bin/env python
"""
seed_data.py — Seed IRMA reference + sample data (handoff D8, P2).

1. msftirma_specialty: the 32 canonical specialty tags (owner / reportable /
   suggested-path / Teams channel / domain) parsed from the routing taxonomy.
2. ~40 realistic sample incidents across severity/status/specialty, each with a
   few child specialty-tag and EAV detail rows, for dashboard/list development.

Idempotent: specialties are upserted by tag key; sample incidents are only
created if fewer than the target count already exist (keyed by a seed marker in
the title).

Run: .venv/bin/python scripts/seed_data.py
"""
import sys, os, random, datetime as dt
sys.path.insert(0, os.path.dirname(__file__))
from auth import get_client

client = get_client("dv-data")
SEED_MARK = "[seed]"
random.seed(42)

# ---------------------------------------------------------------------------
# 32 specialty tags: (name, tagkey, owner, reportable[1=No,2=Conditional,3=Yes],
#                     suggested_path[1-5], teams_channel, domain)
# ---------------------------------------------------------------------------
CLINICAL = "Clinical Care and Patient Safety"
SPECIALTIES = [
    ("Pharmacy / Medication", "medication", "Pharmacy / Med Safety", 2, 2, "Medication and Pharmacy", "Medication & Pharmacy"),
    ("Critical Care (PICU/CICU/NICU)", "neonatal-pediatric-critical-care", "Critical Care / NICU", 2, 2, "Neonatal and Pediatric Critical Care", "Neonatal & Pediatric Critical Care"),
    ("General & Subspecialty Surgery", "surgery-procedures-sedation", "Perioperative (+Risk)", 2, 2, "Surgery - Procedures - Anesthesia - Sedation", "Surgery / Procedures / Anesthesia / Sedation"),
    ("Anesthesiology", "anesthesiology", "Perioperative (+Risk)", 2, 2, "Surgery - Procedures - Anesthesia - Sedation", "Surgery / Procedures / Anesthesia / Sedation"),
    ("Pathology / Laboratory", "laboratory-pathology", "Laboratory", 2, 1, "Laboratory and Pathology", "Laboratory & Pathology"),
    ("Radiology", "imaging-radiation", "Radiology / RSO", 2, 2, "Imaging and Radiation Safety", "Imaging & Radiation Safety"),
    ("Behavioral Health / Psychiatry", "behavioral-mental-health", "Behavioral Health + Safety", 2, 2, "Behavioral and Mental Health", "Behavioral & Mental Health"),
    ("Child Abuse Pediatrics", "child-protection", "Child Protection + SW + Legal", 3, 3, "Child Protection and Family Safety", "Child Protection & Family Safety"),
    ("Cardiology / Cardiac Surgery", "cardiology-cardiac", "Cardiac service-line", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Hematology-Oncology", "hematology-oncology", "Heme-Onc", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Neurology / Neurosurgery", "neurology-neurosurgery", "Neuro service-line", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Orthopedics / Sports Medicine", "orthopedics-sports", "Ortho", 1, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Pulmonology", "pulmonology", "Pulmonology", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Nephrology", "nephrology", "Nephrology", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Gastroenterology", "gastroenterology", "GI", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Endocrinology / Diabetes", "endocrinology-diabetes", "Endocrinology", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Emergency Medicine", "emergency-medicine", "ED Leadership", 2, 2, "Emergency, Urgent Care and Transport", "Emergency, Urgent Care & Transport"),
    ("Neonatology", "neonatology", "Neonatology", 2, 2, "Neonatal and Pediatric Critical Care", "Neonatal & Pediatric Critical Care"),
    ("Rehabilitation (PT/OT/Speech)", "rehabilitation", "Rehab", 1, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Transplant", "transplant", "Transplant", 2, 2, CLINICAL, "Clinical Care & Patient Safety"),
    ("Genetics / Metabolic", "genetics-metabolic", "Genetics", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Infectious Disease", "infectious-disease", "Infectious Disease / IPC", 3, 2, "Infection Prevention and Control", "Infection Prevention & Control"),
    ("Urology", "urology", "Urology", 1, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Ophthalmology", "ophthalmology", "Ophthalmology", 1, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("ENT / Otolaryngology", "ent-otolaryngology", "ENT", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Dermatology", "dermatology", "Dermatology", 1, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Dental / Oral Surgery", "dental-oral-surgery", "Dental", 2, 2, "Surgery - Procedures - Anesthesia - Sedation", "Surgery / Procedures / Anesthesia / Sedation"),
    ("Pain Management", "pain-management", "Pain", 2, 2, "Medication and Pharmacy", "Medication & Pharmacy"),
    ("Palliative Care", "palliative-care", "Palliative", 1, 1, "Patient and Family Experience, Rights and Ethics", "Patient & Family Experience, Rights & Ethics"),
    ("Trauma", "trauma", "Trauma", 2, 2, CLINICAL, "Clinical Care & Patient Safety"),
    ("Adolescent Medicine", "adolescent-medicine", "Adolescent Medicine", 2, 1, CLINICAL, "Clinical Care & Patient Safety"),
    ("Maternal-Fetal / Newborn Nursery", "maternal-fetal-newborn", "MFM / Nursery", 2, 2, "Neonatal and Pediatric Critical Care", "Neonatal & Pediatric Critical Care"),
]

def upsert_specialties():
    print("=== Seeding msftirma_specialty (32 tags) ===")
    existing = {r.data.get("msftirma_tagkey"): r.data.get("msftirma_specialtyid")
                for r in client.records.list("msftirma_specialty", select=["msftirma_tagkey"])}
    tagkey_to_id = {}
    for i, (name, key, owner, reportable, path, channel, domain) in enumerate(SPECIALTIES):
        body = {
            "msftirma_name": name, "msftirma_tagkey": key,
            "msftirma_owningteam": owner, "msftirma_reportable": reportable,
            "msftirma_suggestedpath": path, "msftirma_teamschannel": channel,
            "msftirma_domain": domain, "msftirma_sortorder": i + 1, "msftirma_active": True,
        }
        if key in existing and existing[key]:
            client.records.update("msftirma_specialty", existing[key], body)
            tagkey_to_id[key] = existing[key]
            action = "update"
        else:
            rid = client.records.create("msftirma_specialty", body)
            tagkey_to_id[key] = rid if isinstance(rid, str) else getattr(rid, "id", None) or rid.data.get("msftirma_specialtyid")
            action = "create"
    print(f"  {len(SPECIALTIES)} specialties upserted.")
    # re-fetch ids to be safe
    tagkey_to_id = {r.data.get("msftirma_tagkey"): r.data.get("msftirma_specialtyid")
                    for r in client.records.list("msftirma_specialty", select=["msftirma_tagkey"])}
    return tagkey_to_id


# ---------------------------------------------------------------------------
# Sample incidents
# ---------------------------------------------------------------------------
USERS = [
    "636d0773-5511-f111-8341-000d3a329841",  # Dieter De Cock
    "5ebf8f84-0344-f111-bec6-000d3a33649a",  # Sunny Eltepu
    "1a149fcb-4c6e-f111-ab0d-000d3a34006b",  # Bethany Franklin
    "b9a36fcf-4c6e-f111-ab0d-000d3a340cec",  # kristi Martin
    "67cc53b0-3234-f111-88b4-000d3a34125a",  # Chris Lohret
    "99189370-5511-f111-8341-000d3a353fa5",  # James Papadimitriou
    "42d7ed9c-b40f-f111-8342-000d3a5aab88",  # Marty Carreras
]

# investigationstatus: 1 Submitted, 2 Triaged, 3 Under Investigation, 4 Pending Review,
#                      5 SSE Committee, 6 Remediation, 7 Closed
LOCATIONS = ["PICU", "NICU", "CICU", "ED", "4 West Med/Surg", "OR 3", "Radiology", "Oncology Clinic",
             "Cardiology Floor", "Pharmacy", "Lab - Core", "Pre-Op", "PACU", "5 East", "Behavioral Health Unit"]
AGE = [1, 2, 3, 4]  # neonate/infant/child/adolescent
REACHED = [1, 2, 3, 4]
HARM = [1, 2, 3, 4]
MODALITY = [1, 2, 3, 4]

# (narrative, primary_tagkey, [secondary_tagkeys], severity, escalation, ext_required, detail_rows[(fieldid,value,specialty,tier,source)])
SCENARIOS = [
    ("Potassium recheck was missed in the PICU; a dose that likely should have been held was given. Caught on rounds, no harm.",
     "laboratory-pathology", ["medication", "neonatal-pediatric-critical-care"], 2, 2, False,
     [("lab.stage", "reporting/follow-up", "laboratory-pathology", 1, 1), ("lab.test_specimen", "potassium", "laboratory-pathology", 1, 1),
      ("clin.med_involved", "scheduled antihypertensive (name unknown)", "medication", 1, 2), ("npcc.care_area", "PICU", "neonatal-pediatric-critical-care", 1, 1)]),
    ("Insulin drip rate programmed at 10x intended on the pump. Nurse caught discrepancy before harm; pump reprogrammed.",
     "medication", ["endocrinology-diabetes"], 3, 2, False,
     [("med.high_alert_class", "insulin", "medication", 1, 2), ("med.pump_involved", "yes - smart pump override", "medication", 2, 2),
      ("med.process_stage", "administer", "medication", 1, 1)]),
    ("Wrong-site marking discrepancy noticed during pre-op timeout for an orthopedic procedure. Procedure paused and corrected.",
     "surgery-procedures-sedation", ["orthopedics-sports"], 2, 2, False,
     [("surg.timeout_status", "discrepancy caught at timeout", "surgery-procedures-sedation", 1, 1), ("surg.site_side", "left vs right knee", "surgery-procedures-sedation", 1, 1)]),
    ("Mislabeled blood specimen detected in lab; two patients' tubes swapped at collection. Recollected before result released.",
     "laboratory-pathology", [], 2, 1, False,
     [("lab.stage", "collection", "laboratory-pathology", 1, 1), ("lab.labeling_status", "mislabeled - swapped", "laboratory-pathology", 1, 1)]),
    ("Contrast administered to a patient with documented prior reaction; mild urticaria, treated and resolved.",
     "imaging-radiation", ["medication"], 3, 2, False,
     [("img.contrast", "iodinated contrast", "imaging-radiation", 1, 1), ("med.allergy_relevant", "prior contrast reaction in chart", "medication", 1, 2)]),
    ("Adolescent elopement risk on the behavioral health unit; patient attempted to leave, redirected by staff. No harm.",
     "behavioral-mental-health", ["adolescent-medicine"], 2, 2, False,
     [("bmh.risk_type", "elopement", "behavioral-mental-health", 1, 1), ("bmh.safety_measures", "1:1 observation initiated", "behavioral-mental-health", 1, 2)]),
    ("Suspected non-accidental trauma identified on imaging for an infant. Child protection and social work consulted; mandatory report filed.",
     "child-protection", ["trauma", "imaging-radiation"], 4, 3, True,
     [("cpfs.concern_type", "suspected physical abuse", "child-protection", 1, 1), ("cpfs.mandatory_report_status", "filed", "child-protection", 1, 2),
      ("trauma.mechanism", "inconsistent history", "trauma", 1, 1)]),
    ("Central line associated bloodstream infection suspected in oncology patient; cultures drawn, IPC notified.",
     "infectious-disease", ["hematology-oncology"], 4, 2, True,
     [("id.event_type", "CLABSI suspected", "infectious-disease", 1, 1), ("onc.immunocompromised", "yes - neutropenic", "hematology-oncology", 1, 2)]),
    ("Chemotherapy nearly administered via wrong route; intrathecal vs IV confusion caught at bedside verification.",
     "hematology-oncology", ["medication"], 5, 3, True,
     [("onc.chemo_involved", "vincristine - intrathecal flagged", "hematology-oncology", 1, 1), ("med.five_rights_gap", "right route", "medication", 1, 2)]),
    ("Delayed recognition of deteriorating respiratory status on the floor; rapid response called, patient transferred to PICU.",
     "pulmonology", ["neonatal-pediatric-critical-care"], 4, 2, False,
     [("pulm.airway_support", "escalated to HFNC then PICU", "pulmonology", 1, 1)]),
    ("NG tube misplacement suspected; feeding held pending x-ray confirmation. No harm.",
     "gastroenterology", [], 2, 1, False,
     [("gi.tube_type", "NG", "gastroenterology", 1, 1), ("gi.tube_event", "malposition suspected", "gastroenterology", 1, 1)]),
    ("Hypoglycemia event in a diabetic adolescent; insulin dosing relative to carb intake questioned. Treated, recovered.",
     "endocrinology-diabetes", ["medication"], 3, 1, False,
     [("endo.glucose_value", "42 mg/dL", "endocrinology-diabetes", 1, 1), ("endo.insulin_involved", "yes", "endocrinology-diabetes", 1, 1)]),
    ("EMTALA concern raised about a transfer from an outside ED; documentation review underway.",
     "emergency-medicine", [], 3, 4, True,
     [("em.emtala_concern", "transfer appropriateness", "emergency-medicine", 1, 1)]),
    ("Wrong breastmilk nearly given to a NICU infant; barcode scan mismatch stopped administration.",
     "neonatology", ["neonatal-pediatric-critical-care"], 2, 2, False,
     [("npcc.milk_feeding", "wrong breastmilk - caught at scan", "neonatal-pediatric-critical-care", 1, 1)]),
    ("Shunt malfunction concern in a neurosurgery patient; imaging ordered, neurosurgery consulted.",
     "neurology-neurosurgery", [], 4, 1, False,
     [("neuro.device", "VP shunt", "neurology-neurosurgery", 1, 1), ("neuro.neuro_status_change", "increased lethargy", "neurology-neurosurgery", 1, 1)]),
    ("Sentinel: unrecognized esophageal intubation during sedation led to severe hypoxia; resuscitated, ICU admission. RCA initiated.",
     "anesthesiology", ["surgery-procedures-sedation", "neonatal-pediatric-critical-care"], 5, 3, True,
     [("surg.anesthesia_sedation", "procedural sedation", "surgery-procedures-sedation", 1, 1)]),
    ("Pressure injury identified on a long-stay rehab patient; staging and wound care initiated.",
     "rehabilitation", [], 2, 1, False,
     [("rehab.discipline", "PT/OT", "rehabilitation", 1, 1)]),
    ("Transplant immunosuppression dose omission overnight; caught at morning reconciliation, levels monitored.",
     "transplant", ["medication"], 3, 2, False,
     [("tx.organ", "kidney", "transplant", 1, 1), ("tx.immunosuppression_involved", "tacrolimus dose missed", "transplant", 1, 1)]),
    ("Catheter-associated UTI suspected in a urology patient; cultures sent, IPC informed.",
     "urology", ["infectious-disease"], 3, 1, False,
     [("uro.catheter_involved", "indwelling foley", "urology", 1, 1)]),
    ("MRI safety screen gap: patient brought to scanner with possible implant not fully cleared. Stopped before scan.",
     "imaging-radiation", [], 2, 2, False,
     [("img.mri_safety_screen", "incomplete screen", "imaging-radiation", 1, 1)]),
]

def make_title(scn, i):
    return f"{SEED_MARK} {scn[1].replace('-', ' ').title()} — {scn[0][:48]}…"

def seed_incidents(tag_ids, target=40):
    print("=== Seeding sample incidents ===")
    existing = list(client.records.list("msftirma_incident", filter=f"contains(msftirma_name,'{SEED_MARK}')", select=["msftirma_name"]))
    have = len(existing)
    if have >= target:
        print(f"  {have} seed incidents already present (>= {target}). Skipping.")
        return
    to_create = target - have
    now = dt.datetime.now(dt.timezone.utc)
    created = 0
    for n in range(to_create):
        scn = SCENARIOS[n % len(SCENARIOS)]
        narrative, primary_key, secondary_keys, sev, esc, ext_req = scn[0], scn[1], scn[2], scn[3], scn[4], scn[5]
        details = scn[6]
        days_ago = random.randint(0, 120)
        event_dt = now - dt.timedelta(days=days_ago, hours=random.randint(0, 23))
        # lifecycle status weighted toward earlier stages, some closed
        inv_status = random.choices([1, 2, 3, 4, 5, 6, 7], weights=[18, 16, 18, 10, 4, 12, 22])[0]
        reporter = random.choice(USERS)
        assigned = random.choice(USERS) if inv_status >= 2 else None
        routing = random.choice(USERS)
        sse_suggested = sev == 5 or ext_req
        body = {
            "msftirma_name": make_title(scn, n),
            "msftirma_narrative": narrative,
            "msftirma_sourcemodality": random.choice(MODALITY),
            "msftirma_status": 2,  # Submitted
            "msftirma_investigationstatus": inv_status,
            "msftirma_reporterrole": random.choice(["RN", "MD", "Pharmacist", "RT", "Resident", "Charge RN"]),
            "msftirma_wantsfeedback": random.random() < 0.7,
            "msftirma_patientinvolved": True,
            "msftirma_ageband": random.choice(AGE),
            "msftirma_location": random.choice(LOCATIONS),
            "msftirma_eventdatetime": event_dt.isoformat(),
            "msftirma_reachedpatient": random.choice(REACHED),
            "msftirma_harmobserved": min(sev, 5) if sev <= 4 else random.choice(HARM),
            "msftirma_immediateactions": "Immediate mitigation performed; team notified.",
            "msftirma_ongoinghazard": random.random() < 0.2,
            "msftirma_severitylevel": sev,
            "msftirma_severitysource": random.choice([1, 2]),
            "msftirma_severityrationale": "Severity recommended from harm + vulnerability + hazard persistence judgment flags.",
            "msftirma_escalationpath": esc,
            "msftirma_extreportrequired": ext_req,
            "msftirma_extreporttype": "State-reportable event" if ext_req else None,
            "msftirma_extreportclockhrs": 24 if ext_req else None,
            "msftirma_followupcount": random.randint(2, 6),
            "msftirma_mode": random.choice([1, 2]),
            "msftirma_airecommended": True,
            "msftirma_humanconfirmed": inv_status >= 2,
            "msftirma_ssesuggested": sse_suggested,
            "msftirma_ssereview": sse_suggested and inv_status >= 4,
            "msftirma_Reporter@odata.bind": f"/systemusers({reporter})",
            "msftirma_RoutingOwner@odata.bind": f"/systemusers({routing})",
        }
        if assigned:
            body["msftirma_AssignedTo@odata.bind"] = f"/systemusers({assigned})"
        # lifecycle timestamps
        if inv_status >= 2:
            body["msftirma_triagedon"] = (event_dt + dt.timedelta(hours=random.randint(1, 12))).isoformat()
        if inv_status >= 3:
            body["msftirma_investigationstartedon"] = (event_dt + dt.timedelta(days=random.randint(1, 3))).isoformat()
        if inv_status == 7:
            body["msftirma_closedon"] = (event_dt + dt.timedelta(days=random.randint(4, 30))).isoformat()
            body["msftirma_rootcause"] = "Contributing factors identified; process gap addressed via remediation actions."
            if body["msftirma_wantsfeedback"]:
                body["msftirma_reporterfeedbacksent"] = True
                body["msftirma_reporterfeedbacktext"] = "Thank you for reporting. Here is what we changed as a result."
                body["msftirma_feedbacksenton"] = body["msftirma_closedon"]

        incident_id = client.records.create("msftirma_incident", body)
        iid = incident_id if isinstance(incident_id, str) else getattr(incident_id, "id", None)
        if not iid:
            # fetch back by title
            back = list(client.records.list("msftirma_incident", filter=f"msftirma_name eq '{make_title(scn, n)}'", select=["msftirma_incidentid"], top=1))
            iid = back[0].data.get("msftirma_incidentid") if back else None

        # child specialty tags
        for role, key in [(1, primary_key)] + [(2, k) for k in secondary_keys]:
            tid = tag_ids.get(key)
            tag_body = {
                "msftirma_name": f"{key} ({'primary' if role == 1 else 'secondary'})",
                "msftirma_Incident@odata.bind": f"/msftirma_incidents({iid})",
                "msftirma_role": role,
                "msftirma_confidence": round(random.uniform(0.62, 0.98), 2),
                "msftirma_source": 1,
                "msftirma_evidence": "Detected from narrative cues.",
            }
            if tid:
                tag_body["msftirma_Tag@odata.bind"] = f"/msftirma_specialties({tid})"
            client.records.create("msftirma_incidentspecialtytag", tag_body)

        # child EAV detail rows
        for fid, val, spec, tier, src in details:
            client.records.create("msftirma_incidentdetail", {
                "msftirma_name": fid,
                "msftirma_Incident@odata.bind": f"/msftirma_incidents({iid})",
                "msftirma_fieldid": fid, "msftirma_fieldvalue": val,
                "msftirma_specialty": spec, "msftirma_tier": tier, "msftirma_source": src,
            })

        # a couple of activity rows + maybe a remediation action for advanced incidents
        client.records.create("msftirma_investigationactivity", {
            "msftirma_name": "Intake received",
            "msftirma_Incident@odata.bind": f"/msftirma_incidents({iid})",
            "msftirma_activitytype": 1, "msftirma_note": "Incident received from IRMA intake agent.",
            "msftirma_Author@odata.bind": f"/systemusers({routing})",
            "msftirma_occurredon": event_dt.isoformat(),
        })
        if inv_status >= 6:
            client.records.create("msftirma_remediationaction", {
                "msftirma_name": "Process update",
                "msftirma_Incident@odata.bind": f"/msftirma_incidents({iid})",
                "msftirma_description": "Update workflow / double-check step to prevent recurrence.",
                "msftirma_ActionOwner@odata.bind": f"/systemusers({assigned or routing})",
                "msftirma_status": 3 if inv_status == 7 else 2,
                "msftirma_duedate": (event_dt + dt.timedelta(days=21)).isoformat(),
            })
            if inv_status == 7:
                pass
        created += 1
        if created % 10 == 0:
            print(f"  …{created}/{to_create} incidents")
    print(f"  {created} sample incidents created (with child tags/details/activities).")


if __name__ == "__main__":
    tag_ids = upsert_specialties()
    seed_incidents(tag_ids, target=40)
    print("Done. Seed complete.")
