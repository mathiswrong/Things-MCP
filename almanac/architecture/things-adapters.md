---
title: "Things Adapters"
topics: [architecture, adapters, things]
sources:
  - id: adapter
    type: file
    path: src/adapter.ts
  - id: native
    type: file
    path: src/native/things.jxa.js
  - id: transport
    type: file
    path: src/url-transport.ts
  - id: urls
    type: file
    path: src/url-domain.ts
---

# Things Adapters

The native adapter runs fixed scripts with structured input, bounded subprocess execution and schema-checked output. Callers never supply script source. Longer allowances for native collection reads remain finite, so large libraries may fail instead of returning a fabricated complete result [@adapter].

## Native reads and mutations

Project reads add `childCount` and a fingerprint of exposed child data. Child queries include logged tasks omitted by the ordinary open-project collection. Built-in list moves use the dedicated fixed helper; other edits use the main native dispatcher [@adapter] [@native]. These details matter for revisions and descendant preservation.

## URL boundary

The URL transport retrieves the existing authorization token from Keychain under service `Things MCP URLs`, account `default`. Only typed operations become URLs; callers cannot select arbitrary callback destinations or execute scripts [@transport] [@urls]. URLs complement native reads, but do not provide complete checklist, heading or reminder read-back. See [Mutation Reconciliation](mutation-reconciliation.md) for the resulting receipt distinction.
