---
title: "Use Supported Things Interfaces Only"
topics: [automation-boundary, things-integration, safety]
sources:
  - id: rules
    type: file
    path: AGENTS.md
  - id: adapter
    type: file
    path: src/adapter.ts
  - id: urls
    type: file
    path: src/url-domain.ts
---

# Use Supported Things Interfaces Only

The accepted boundary is public AppleScript/JXA plus typed documented Things URLs. Both are implemented, with fixed native execution and operation-specific schemas [@adapter] [@urls].

## Decision and consequences

Earlier plans for a Shortcuts bridge are superseded. Apple Shortcuts, database access, private experimental APIs, Things Cloud credentials and replacement recurrence workflows are excluded [@rules]. Missing supported mechanisms remain documented limits, even when the app UI offers the feature.

This reduces maintenance dependencies and makes the advertised contract testable. It also means URL-only fields cannot gain full read-back through an unapproved alternate adapter. See [Things Automation Surfaces](../concepts/things-automation-surfaces.md) and [Known Capability Limits](../reference/known-capability-limits.md).
