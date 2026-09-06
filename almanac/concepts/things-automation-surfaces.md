---
title: "Things Automation Surfaces"
topics: [things-integration, adapters, automation-boundary]
sources:
  - id: adapter
    type: file
    path: src/adapter.ts
  - id: native
    type: file
    path: src/native/things.jxa.js
  - id: urls
    type: file
    path: src/url-domain.ts
  - id: state
    type: file
    path: src/state.ts
  - id: rules
    type: file
    path: AGENTS.md
---

# Things Automation Surfaces

Things MCP uses native scripting for readable object fields and documented URL commands for selected fields absent from native read-back. This split determines the evidence a receipt can provide [@adapter] [@urls] [@state].

## Native objects

The fixed native helper reads and edits to-dos, projects, areas and tags. Project reads include exposed child snapshots. Open-project child enumeration supplements the ordinary collection with logged children; closed projects use their retained collection [@native] [@adapter].

## URL operations

Typed URL inputs cover templates, checklist edits, heading placement, reminders, Evening, duplication and view navigation. Their receipt uses `url_dispatched`, because launching the command cannot establish complete result fields or a newly created ID [@urls] [@state].

Apple Shortcuts is explicitly excluded. Earlier proposals involving imported workflows are superseded and must not be reintroduced as an installation dependency [@rules]. See [Things Adapters](../architecture/things-adapters.md).
