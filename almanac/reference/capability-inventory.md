---
title: "Capability Inventory"
topics: [reference, capability-audit, coverage]
sources:
  - id: server
    type: file
    path: src/server.ts
  - id: registry
    type: file
    path: src/capabilities.ts
  - id: scope
    type: file
    path: docs/FULL-SCOPE.md
---

# Capability Inventory

The server exposes twenty tools. The capability registry groups related operations and separately records limited or unavailable families, so its row count is not a tool count [@server] [@registry].

| Family | Delivered behavior |
|---|---|
| Discovery and reads | Health, capabilities, find/get, existence, count, selection, tags/date filters, sorted results and scan continuations. |
| Native changes | Create/edit to-dos, projects, areas and tags; status, supported timestamps, tags, hierarchy, calendar scheduling and supported placement. |
| Project moves | Verified descendant preservation and a durable observation summary with full returned-task counts and bounded changed-ID detail. |
| Recovery and deletion | Open-item restoration, separate open-to-do Trash and previewed container deletion with independent grants and native gates. |
| URL changes | Structured templates, checklist replacement/clearing/append/prepend, heading placement, reminders, Evening, When clearing and duplication. |
| Navigation | Show/edit items, Quick Entry, built-in views and search on the Mac. |

These families are implemented by the registered tools; URL results certify dispatch only [@server] [@registry]. Exact inputs are documented in the public [capability reference](../../docs/CAPABILITIES.md).

Repeat-rule editing, full checklist/heading reads, arbitrary native ordering and general undo are absent. Whole-library maintenance remains disabled for verification reasons. [Known Capability Limits](known-capability-limits.md) separates these from interface exclusions [@scope].
