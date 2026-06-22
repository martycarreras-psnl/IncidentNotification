# ADR-0002 — Tables are `UserOwned` now to enable BU/owner-team security later

- **Status:** Accepted
- **Date:** 2026-06-22
- **Phase:** P0
- **Deciders:** CHOA safety platform team (handoff D10)

## Context

Safety-incident data is sensitive and legally protected. Today the safety team needs
open visibility across all incidents to triage and investigate. In the future, CHOA may
need to scope visibility by business unit (e.g. a service line sees only its own events)
or by owner team (e.g. Child Protection events restricted to that team).

Dataverse ownership type is fixed at table creation: `UserOwned` tables support
business-unit, owner-team, and row-level sharing security; `OrganizationOwned` tables do
not. Converting ownership type after creation is not supported in place.

## Decision

All 7 IRMA tables (`msftirma_incident`, `msftirma_incidentspecialtytag`,
`msftirma_incidentdetail`, `msftirma_incidentaudit`, `msftirma_specialty`,
`msftirma_investigationactivity`, `msftirma_remediationaction`) are created as
**`UserOwned`**. For v1, visibility stays **open** to the safety team (no restricting
roles applied). The security model (business units, owner teams, role mappings) is a
later phase — the ownership type is set up now precisely so that phase does not require a
rebuild.

## Consequences

- Every table carries an `ownerid` and participates in Dataverse's owner-based security
  model from day one.
- v1 ships with permissive access; restriction is additive later (no schema change).
- Even the reference table `msftirma_specialty` is `UserOwned` for consistency, though it
  is effectively shared configuration data.
- Row-level security enforcement is explicitly out of scope for v1 (handoff §7).
