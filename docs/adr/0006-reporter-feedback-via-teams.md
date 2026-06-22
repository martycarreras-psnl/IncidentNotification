# ADR-0006 — Reporter "close-the-loop" feedback is delivered via Microsoft Teams

- **Status:** Accepted
- **Date:** 2026-06-22
- **Phase:** P0
- **Deciders:** CHOA safety platform team (handoff D15, build-start confirmation)

## Context

When an investigation closes, the safety team "closes the loop" with the identified
reporter (ADR-0005) by sending feedback. Handoff decision D15 set Office 365 Outlook
email (`shared_office365`) as the default channel, but explicitly marked it
**changeable to Teams at build start if preferred**.

At build start the team confirmed they prefer **Microsoft Teams**. The IRMA intake agent
already operates in Teams (it posts incidents to specialty channels, tenant
`d92190b9-98e7-46da-8b11-580e06c7d15d`, group `856d6389-af22-42d4-a0ad-f961fc1de577`),
so reporters already live in that surface and feedback-in-Teams keeps the loop in one
place.

## Decision

Reporter feedback is delivered via **Microsoft Teams** (`shared_teams` connector), not
Office 365 Outlook. The app's `NotificationService` abstraction exposes a single
`sendReporterFeedback(...)` contract; its concrete implementation posts a Teams message
to the reporter's identity. The connector registered in Phase P3 is **`shared_teams`**.

The `NotificationService` seam is kept channel-agnostic so the channel can be swapped
(back to email, or to both) without touching the investigation UI.

## Consequences

- Phase P3 registers `shared_teams` (not `shared_office365`):
  `pac code add-data-source -a shared_teams -c <connectionId>`.
- The "Send feedback to reporter" action on the incident detail page (P6) calls
  `NotificationService` → Teams.
- Feedback delivery depends on the reporter being reachable in the CHOA Teams tenant.
- Because the contract is abstracted, reverting to email or adding email-as-well is an
  implementation change behind `NotificationService`, not a UI change.
- `reporterfeedbacksent` / `reporterfeedbacktext` / `feedbacksenton` columns on
  `msftirma_incident` record the outcome regardless of channel.
