# ADR-0001 — Publisher prefix `msftirma_` is immutable once data exists

- **Status:** Accepted
- **Date:** 2026-06-22
- **Phase:** P0
- **Deciders:** CHOA safety platform team (handoff D1)

## Context

The Incident Report Management App (IRMA) shares a Dataverse schema with the IRMA
Copilot Studio intake agent. The agent's current skill files (`dataverse-mapping.md`,
`output-schema.md`) use the illustrative prefix `choa_`. The provisioned environment
(`carremacodeapps.crm.dynamics.com`) was scaffolded with publisher prefix `msftirma`.

A Dataverse publisher prefix is baked into every table and column logical/schema name
at creation time. Changing it after tables hold data requires dropping and recreating
every entity — losing all rows, lookups, audit history, and any agent write integration
already pointed at the old names.

## Decision

The canonical publisher prefix is **`msftirma_`**. It is treated as **immutable** once
any table in the IRMA solution holds data. The agent's MD skill files are realigned
`choa_` → `msftirma_` in Phase P9 so the agent and this app stay in sync; no parallel or
transitional prefix is introduced.

## Consequences

- All 7 tables and every column use `msftirma_` (e.g. `msftirma_incident`,
  `msftirma_severitylevel`).
- The agent's Dataverse "Create row" action must be updated to the `msftirma_` names
  (delivered as the P9 reconciliation note).
- Renaming the prefix later is effectively a rebuild; treat it as a one-way door.
- `.env` records `PUBLISHER_PREFIX=msftirma` as the single source of truth for tooling.
