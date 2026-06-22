# Handoff — Incident Report Management App (IRMA companion)

> **Purpose of this document.** This is the build-ready handoff for the **Incident Report
> Management App** for Children's Healthcare of Atlanta (CHOA). It captures every decision
> locked during planning so a fresh session can start building immediately. Read it top to
> bottom before writing any code. The canonical working notes also live in session memory
> (`/memories/session/plan.md`).

---

## 1. What we're building

A Power Apps **Code App** for CHOA's safety team that is the management surface for the
**IRMA** intake agent (a Copilot Studio agent that elicits safety-incident stories, detects
specialty tags, recommends severity/escalation, and today posts to Teams). IRMA will now
**also write each incident to Dataverse**; this app reads that Dataverse data and lets the
safety team:

1. **See all incident submissions** (filterable list + detail).
2. **Drive each incident through an investigation lifecycle** (triage → investigation →
   review → remediation → close), including re-classification, root cause, remediation
   actions, an audit trail, and closing the loop back to the reporter.
3. **Monitor trends** on a statistical dashboard (volume, status mix, remediation pace,
   severity Pareto, specialty Pareto, SSE trend).

**Source context** (in `~/Downloads/choa-ons-agent-deliverables/`):
- `childrens-ons-agent-workshop-open.html` — workshop themes, challenges, principles.
- `ons-intake-agent-architecture.html` — how the agent detects tags/severity/escalation.
- `pediatric-incident-routing-taxonomy.xlsx` — the **32 specialty tags**, severity rubric,
  and suggested routing path/owner per tag. **Parse this with the `xlsx` skill** to seed the
  specialty reference table.
- `ons-intake-agent-skills/shared/dataverse-mapping.md` and `output-schema.md` — the agent's
  current Dataverse contract (uses the illustrative prefix `choa_`). **We update these in the
  final phase** so the agent and this app stay in sync.

---

## 2. Current repository state (already done)

- Initialized PACAF Code App. `power.config.json`: `appDisplayName: "IRMA"`, `appId` and
  `environmentId` already set (prod environment provisioned).
- **Publisher prefix: `msftirma_`** (this is canonical — see decision D1).
- Only placeholder scaffold present: a sample `ProjectRequest` table in
  `dataverse/planning-payload.json`, mirrored through `src/types/domain-models.ts`,
  `src/services/*`, `src/hooks/usePrototypeData.ts`, `src/prototypeManifest.ts`. **All of this
  placeholder content gets replaced.**
- `src/main.tsx` already wires **HashRouter** + react-query + FluentProvider (do not change).
- `src/pages/` and `src/components/` and `src/generated/` are **empty**.
- Both required plugins are installed: **Dataverse-skills** (`dv-*`) and **Code Apps**
  (`code-apps-preview`). A live `dv-connect` + Python SDK check is still required at build start.

---

## 3. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | Canonical publisher prefix | **`msftirma_`** — agent MD files get realigned from `choa_` → `msftirma_` |
| D2 | Build sequence | **Provision Dataverse + wire live data now** (not mock-first). Keep the provider seam regardless |
| D3 | App scope | **Manage + manual-create fallback** (agent is the primary intake path; app allows manual entry) |
| D4 | Investigation lifecycle | `Submitted → Triaged → Under Investigation → Pending Review → SSE Committee (conditional) → Remediation → Closed` |
| D5 | Dashboard metrics | Submission volume over time · status distribution (open/closed) · remediation pace (time-to-close / aging) · severity Pareto (1–5) · specialty-tag Pareto · SSE counts & trend |
| D6 | Charts library | **recharts** (add dependency) |
| D7 | Owner / assignment fields | **Lookup to `systemuser` now** (people picker UI; domain model stores `{ id, name }`) |
| D8 | Sample data | **Seed ~30–50 realistic sample incidents** via `dv-data` for dashboard/list dev. Keep mock provider for tests |
| D9 | Re-classification | **Editable + audited** — investigators can change severity, specialty tags, escalation post-submit; every change writes an audit row (from/to/who/when) |
| D10 | Table ownership | **All tables Owner/Team-owned (`UserOwned`)** so Dataverse BU/owner-team security can scope data later. v1 visibility stays open to the safety team (ADR: ownership-now-restrict-later) |
| D11 | Reporter identity & feedback | **Identified reporter + notify now** — `reporter` lookup to `systemuser`; "close the loop" sends feedback immediately. **Reverses the agent's de-identification rule** (document in final phase) |
| D12 | SSE Committee trigger | **Manual flag, rule-suggested** — app auto-suggests the SSE track when severity = 5 OR a never-event/mandatory-report flag is set; a reviewer confirms |
| D13 | Mandatory-report clock | **Surface a 24-hr countdown / overdue indicator** on incident detail and in the list (not a dashboard chart) |
| D14 | Agent Teams post | **Keep both** — agent continues posting to Teams AND adds a Dataverse create. No change to Teams behavior |
| D15 | Notification channel | **Office 365 Outlook email** (`shared_office365`) to the reporter. Changeable to Teams at build start if preferred |

---

## 4. Target Dataverse schema (prefix `msftirma_`, all `UserOwned`)

Author this as the full source of truth in `dataverse/planning-payload.json`, then provision
with the `dv-metadata` skill. Secure `mrn` / PHI columns with column-level security.

### 4.1 `msftirma_incident` (primary)
Intake fields (from the agent's `output-schema.md` / `dataverse-mapping.md`):
`sourcemodality`, `status`, `narrative`, `reporterrole` (text), `wantsfeedback`,
`patientinvolved`, `mrn` (secured), `encounterid`, `ageband`, `location`, `eventdatetime`,
`reachedpatient`, `harmobserved`, `immediateactions`, `ongoinghazard` (+ `ongoinghazarddetail`),
`severitylevel` (1–5), `severitysource` (AI/Submitter), `severityrationale`,
`escalationpath` (S1–S5), `extreportrequired`, `extreporttype`, `extreportclockhrs`,
`followupcount`, `mode` (Minimal/Thorough), `airecommended`, `humanconfirmed`.

Investigation + new fields (this app):
- `investigationstatus` — choice, the full D4 lifecycle (drives the management workflow)
- `reporter` — **Lookup → `systemuser`** (D11; keep `reporterrole` text alongside)
- `assignedto` — **Lookup → `systemuser`** (D7; was text in agent MD)
- `routingowner` — **Lookup → `systemuser`** (D7; was text in agent MD)
- `triagedon`, `investigationstartedon`, `closedon` — DateTimes (remediation-pace math)
- `rootcause` — multiline
- `ssesuggested` — yes/no (set by D12 rule), `ssereview` — yes/no (manual confirm),
  `sseoutcome` — choice
- `servicenowref` — text
- `reporterfeedbacksent` — yes/no, `reporterfeedbacktext` — multiline, `feedbacksenton` — DateTime

### 4.2 `msftirma_incidentspecialtytag` (N:1 → incident)
`tag` (Lookup → `msftirma_specialty`), `role` (Primary/Secondary), `confidence` (decimal),
`source` (AI/Submitter), `evidence` (text). Editable post-submit (D9) with audit.

### 4.3 `msftirma_incidentdetail` (N:1 → incident) — EAV
`fieldid` (text), `fieldvalue` (multiline), `specialty` (text), `tier` (1/2),
`source` (AI-extracted/Submitter/Epic). Avoids a column-per-specialty explosion.

### 4.4 `msftirma_incidentaudit` (N:1 → incident)
`path` (text), `fromvalue` (text), `tovalue` (text), `author` (Lookup → `systemuser`),
`occurredon` (DateTime). Captures both submitter overrides and **investigator
re-classifications** (D9).

### 4.5 `msftirma_specialty` (reference, `UserOwned`)
The **32 tags** + `owner` + reportable flags + suggested routing path. **Seed from the
taxonomy XLSX.** Shared canonical tag list for the agent, the routing matrix, and this app.

### 4.6 `msftirma_investigationactivity` (N:1 → incident) — NEW
`activitytype` (choice), `note` (multiline), `author` (Lookup → `systemuser`),
`occurredon` (DateTime). Powers the detail-page timeline and pace metrics.

### 4.7 `msftirma_remediationaction` (N:1 → incident) — NEW
`description` (multiline), `owner` (Lookup → `systemuser`), `duedate` (DateTime),
`status` (Open/InProgress/Done), `completedon` (DateTime).

### 4.8 Global option sets
`investigationstatus`, `severitylevel` (1–5), `escalationpath` (S1–S5), `sourcemodality`,
`reachedpatient`, `harmobserved`, `ageband`, `tagrole`, `provenance`, `questionmode`,
`remediationstatus`, `activitytype`, `sseoutcome`.

---

## 5. Build phases

> Honor the repo's instruction set throughout: `src/generated/**` is read-only (wrap it in
> provider adapters under `src/services/`); three-layer architecture (components render, hooks
> orchestrate, services expose contracts); HashRouter only; port 3000; Fluent UI v9 only;
> `base: './'` for production builds. Use the **`DataverseFieldLabel`** metadata-backed label
> pattern (instruction 09) on **every** editable Dataverse-bound field.

- **P0 — Lock & verify.** Run `dv-connect` to confirm the Dataverse MCP server + Python SDK are
  live against the provisioned env. Confirm the notification channel (D15). Parse the taxonomy
  XLSX (`xlsx` skill) for per-tag owner/reportable/routing. Write ADRs: prefix immutability,
  ownership-now-restrict-later, EAV detail pattern, charts library.
- **P1 — Author schema.** Rewrite `dataverse/planning-payload.json` with all 7 tables, columns,
  13 option sets, relationships, and `ownership: UserOwned`. *(Blocks P2.)*
- **P2 — Provision + seed.** `dv-metadata` creates tables/columns/option sets/relationships.
  `dv-data` seeds `msftirma_specialty` (32 rows) + ~30–50 sample incidents with child tag/detail
  rows. *(Depends on P1.)*
- **P3 — Register data sources + provider seam.** `pac code add-data-source` per table →
  `src/generated` (read-only). Regenerate `src/types/domain-models.ts`,
  `src/services/data-contracts.ts` (one repository interface per entity + `NotificationService`),
  `src/services/real-data-provider.ts` (adapters over generated services), `providerFactory.ts`,
  and per-entity react-query hooks. Add the notification connector
  (`pac code add-data-source -a shared_office365 -c <connId>`). Scaffold the
  `FieldMetadataRepository` / `DataverseFieldLabel` / `toDataverseFieldName` trio +
  `fieldMetadataServiceRegistry`. *(Depends on P2.)*
- **P4 — App shell.** Replace placeholder `src/App.tsx`; add `src/router.tsx` (HashRouter:
  `/dashboard`, `/incidents`, `/incidents/:id`, `/incidents/new`) + nav layout.
- **P5 — Incidents list.** Grid + filter bar (specialty, severity, status, escalation, date
  range, narrative search). `StatusBadge`, `SeverityBadge`, `SpecialtyTagChips`,
  `MandatoryReportCountdown` components.
- **P6 — Incident detail + investigation.** Header; narrative/event facts; specialty tags
  (editable + audited); grouped EAV details; investigation panel (advance `investigationstatus`,
  assign `systemuser`, root cause, ServiceNow ref, SSE flag w/ rule suggestion); activity
  timeline; remediation-action CRUD; reporter people-picker; **"Send feedback to reporter"**
  action → `NotificationService`; audit (AI vs human). `DataverseFieldLabel` on every editable
  field; guard `ApplicationRequired` client-side.
- **P7 — Manual create form (D3).** New incident form using `DataverseFieldLabel` +
  `toDataverseFieldName`.
- **P8 — Dashboard.** The six D5 metrics with recharts; aggregations from incident columns +
  tag table.
- **P9 — Update agent MD skill files.** In `~/Downloads/choa-ons-agent-deliverables/ons-intake-agent-skills/shared/`:
  rename `choa_` → `msftirma_`; mark agent-owned vs app-owned columns; document that `reporter`
  is now an identified `systemuser` lookup (reverses de-identification); document `assignedto`/
  `routingowner` as `systemuser` lookups; describe the agent's new Dataverse create payload
  (incl. `reporter`). **Deliver a reconciliation note so the user can update the intake agent.**
- **P10 — Tests + deploy.** vitest unit + `App.test` smoke; Playwright e2e; `npm run lint`
  (max-warnings 0); `npm run build`; `pac code push`. Verify in the Power Apps host.

---

## 6. Verification checkpoints

1. After **P2**: `dv-metadata` `list_tables` / `describe_table` show all 7 tables + option sets;
   `msftirma_specialty` has 32 rows; sample incidents present.
2. After **P3**: `npm run typecheck` passes; generated services exist; `npm run test:smoke` green.
3. After **P5–P8**: `npm run dev` (port 3000) — filters work, detail advances status and writes
   activity/audit rows, "send feedback" calls the connector, dashboard renders all six metrics
   from live data.
4. Final: `npm run lint` + `npm run test` + `npm run test:e2e` clean, then `npm run build` +
   `pac code push` deploy cleanly; smoke-test in the Power Apps host.

---

## 7. Out of scope (v1)

- Changing the IRMA intake agent itself (the user applies the documented MD edits from P9).
- Active surveillance / reading notes to detect errors proactively (separate, larger effort).
- Row-level security enforcement (ownership is set up now; restriction is a later phase).
- Deeper Epic integration beyond what the agent already passes through.

---

## 8. ADRs to write in P0 (`docs/adr/`)

1. Publisher prefix `msftirma_` is immutable once data exists.
2. Tables are `UserOwned` now to enable BU/owner-team security later, though v1 visibility is open.
3. Variable per-specialty fields use an EAV `msftirma_incidentdetail` table, not a column per specialty.
4. recharts is the charting library (Fluent v9 ships none).
5. Reporter is identified (`systemuser` lookup), reversing the agent's de-identification rule, to enable closing the loop.
