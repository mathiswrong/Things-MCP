---
title: "Known Capability Limits"
topics: [reference, capability-audit, automation-boundary, safety]
sources:
  - id: scope
    type: file
    path: docs/FULL-SCOPE.md
  - id: registry
    type: file
    path: src/capabilities.ts
  - id: service
    type: file
    path: src/service.ts
  - id: verification
    type: file
    path: VERIFICATION.md
---

# Known Capability Limits

Limits belong to three categories: missing supported interfaces, server verification gates and untested environments. None implies universal parity with the Things UI [@scope].

## Interface limits

Native repeat-rule editing, full checklist/heading read-back, stable-ID editing of existing checklist rows, in-place heading editing, arbitrary ordering, lossless type conversion and general undo have no established supported route in the selected interfaces. The server uses no Apple Shortcuts bridge, replacement scheduler or direct Things Cloud account API [@scope].

## Verification and execution gates

Project Anytime membership, direct Logbook movement, closed-task deletion and closed-item restoration remain restricted after native verification gaps. Empty Trash and Log Completed are public commands but remain disabled because they affect the entire library. Trashed project children cannot be completely enumerated through the selected collection [@scope] [@registry].

URL-only fields return dispatch receipts. Successful project move summaries compare exposed child fields, not every inherited effect. Their detail list is capped at twenty IDs, while counts include every returned task. Failed reads cannot produce a successful move receipt [@service].

## Environment limits

Large reads can exceed native time/output bounds, and scan continuations are not atomic snapshots. Fresh-account consent, every host version, physical sleep/wake and actual logout/login are not certified. Initial browser setup still requires operator commands [@scope] [@verification]. See [Capability Inventory](capability-inventory.md).
