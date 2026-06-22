# ADR-0005 — Reporter is identified (`systemuser` lookup), reversing the agent's de-identification rule

- **Status:** Accepted
- **Date:** 2026-06-22
- **Phase:** P0
- **Deciders:** CHOA safety platform team (handoff D11)

## Context

The IRMA intake agent's `output-schema.md` enforces a **de-identification rule**: capture
roles, not names (`reporter.role`, `core.people_involved` are roles only). This protects
reporters in the intake/Teams-posting context.

This management app, however, needs to **close the loop** with the reporter — send
feedback ("here's what we did about what you reported") when an investigation concludes.
"Close the loop" is impossible without knowing who the reporter is. The team has decided
reporters are identified within the secured management surface and want feedback sent
immediately on close.

## Decision

In the IRMA Dataverse schema and this app, the reporter is **identified**:
`msftirma_incident.reporter` is a **Lookup → `systemuser`**. The original
`reporterrole` (text) is **kept alongside** for routing and display continuity. The
"Send feedback to reporter" action uses this identity to notify via the configured
channel (Office 365 Outlook — see D15 / ADR-0006-pending).

This **reverses the agent's de-identification rule** for the management context. The
reversal is documented back to the agent owners in Phase P9 so the intake agent can be
updated to populate `reporter` as an identified `systemuser` reference in its Dataverse
create payload.

## Consequences

- Reporter identity is PHI-adjacent and lives in a `UserOwned`, access-controlled table;
  `mrn` and other PHI columns are additionally secured with column-level security.
- The agent contract changes: its create payload must supply a `systemuser` reference for
  `reporter` (P9 reconciliation note covers this).
- Feedback can be sent immediately on investigation close (D11), enabling the close-the-
  loop workflow that is core to v1.
- This is a deliberate, documented divergence from the agent's published privacy posture;
  it must be re-reviewed if the management surface's access controls change.
