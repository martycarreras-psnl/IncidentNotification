# ADR-0004 — recharts is the charting library

- **Status:** Accepted
- **Date:** 2026-06-22
- **Phase:** P0
- **Deciders:** CHOA safety platform team (handoff D6)

## Context

The dashboard (Phase P8) must render six metric families: submission volume over time,
status distribution, remediation pace (time-to-close / aging), severity Pareto (1–5),
specialty-tag Pareto, and SSE counts & trend. This needs line, bar, and Pareto-style
composed charts.

Fluent UI v9 — the mandated component library for this Code App — does not ship a
general-purpose charting library. The team needs a React-native, declarative,
well-maintained option that composes cleanly with Fluent layout primitives.

## Decision

Use **recharts** as the charting library. It is added as a project dependency. All
dashboard visualizations are built with recharts components (`LineChart`, `BarChart`,
`ComposedChart`, etc.), wrapped in app components that pull aggregated data from the
incident columns and the specialty-tag table.

## Consequences

- `recharts` is a new runtime dependency.
- Chart theming is aligned to the Fluent v9 design tokens (color, type) by passing
  token-derived values into recharts props, so charts read as part of the app.
- Aggregation happens in the app/hook layer (over live Dataverse data), not in recharts.
- Alternatives (Fluent Charting/`@fluentui/react-charting`, victory, visx) were not
  selected; recharts is the locked choice to avoid bikeshedding mid-build.
