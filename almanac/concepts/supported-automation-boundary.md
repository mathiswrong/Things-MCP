---
title: "Supported Automation Boundary"
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
  - id: server
    type: file
    path: src/server.ts
---

# Supported Automation Boundary

The allowed integration routes are public AppleScript/JXA and typed, documented Things URL operations. Native commands run fixed scripts, while URL inputs pass through operation-specific schemas [@adapter] [@urls]. Tools describe tasks and navigation rather than accepting executable code [@server].

## Exclusions

Database writes, private APIs, Things Cloud credentials, generic script execution, Apple Shortcuts and substitute recurrence workflows are excluded. A visible feature in Things does not automatically become a supported MCP action [@rules].

No stable UI-clicking fallback is used to conceal a missing API. Read [Things Automation Surfaces](things-automation-surfaces.md) for the two implemented routes and [Known Capability Limits](../reference/known-capability-limits.md) for the distinction between interface limits and failed verification.
