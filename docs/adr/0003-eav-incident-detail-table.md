# ADR-0003 — Variable per-specialty fields use an EAV `msftirma_incidentdetail` table

- **Status:** Accepted
- **Date:** 2026-06-22
- **Phase:** P0
- **Deciders:** CHOA safety platform team (handoff §4.3); inherited from the agent's `dataverse-mapping.md`

## Context

The IRMA intake agent collects a different set of facts depending on which specialty
tags are detected. The investigation data dictionary defines a large, growing registry
of `field_id`s — CORE/SHARED facts plus dozens of specialty-specific ids across 32 tags
(`med.high_alert_class`, `lab.stage`, `npcc.care_area`, `surg.timeout_status`, …). Any
given incident populates only a small subset.

Modeling each possible `field_id` as its own column on `msftirma_incident` would produce
a very wide, mostly-null table that must be altered every time the agent adds a fact —
coupling schema migrations to agent content changes.

## Decision

Variable, per-specialty facts are stored as rows in an **Entity-Attribute-Value (EAV)**
child table, **`msftirma_incidentdetail`** (N:1 → `msftirma_incident`), with columns:
`fieldid` (text), `fieldvalue` (multiline), `specialty` (text — owning tag or
"core"/"shared"), `tier` (1/2), and `source` (AI-extracted / Submitter / Epic). One row
per collected `field_id`.

Stable, high-value, queryable facts that drive the management workflow and dashboards
(status, severity, escalation, harm, dates, lookups) remain **first-class columns** on
`msftirma_incident` — EAV is only for the open-ended specialty long tail.

## Consequences

- Adding a new agent `field_id` requires no schema change — it is just a new detail row.
- The detail UI groups rows by `specialty`/`tier` rather than rendering fixed fields.
- EAV values are not strongly typed and are awkward to aggregate; this is acceptable
  because dashboard metrics key off the first-class columns, not EAV rows.
- Detail rows are read-mostly in this app (the agent writes them at intake); the app
  surfaces them grouped and read-only in v1.
