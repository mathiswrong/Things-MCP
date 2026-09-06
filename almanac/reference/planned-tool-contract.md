---
title: "Tool Contract"
topics: [reference, mcp, tool-contracts, mutations]
sources:
  - id: server
    type: file
    path: src/server.ts
  - id: domain
    type: file
    path: src/domain.ts
  - id: urls
    type: file
    path: src/url-domain.ts
  - id: state
    type: file
    path: src/state.ts
  - id: service
    type: file
    path: src/service.ts
---

# Tool Contract

The current contract has twenty named tools with strict structured inputs. The path of this page is retained for existing links; it describes the shipped contract, not a proposed tool list [@server].

## Tools

| Purpose | Names |
|---|---|
| Discovery | `things_capabilities`, `things_health` |
| Reading | `things_find_items`, `things_get_item`, `things_exists`, `things_count_items` |
| Native writes | `things_create_item`, `things_update_item`, `things_schedule_item`, `things_move_item`, `things_trash_item`, `things_restore_item` |
| Destructive scope | `things_preview_destructive`, `things_apply_destructive` |
| Navigation and status | `things_navigate`, `things_request_status` |
| URL operations | `things_create_from_template`, `things_edit_extras`, `things_duplicate_item`, `things_show_view` |

The server registers these exact names and returns structured content alongside JSON text [@server]. Item references carry kind and stable ID. Mutations require UUID request IDs; edits require the appropriate current revision, and destructive apply uses a scope revision [@domain] [@urls].

## Receipts

Native receipts contain request ID, target, changed field names and `read_back` or `command_accepted` verification. Successful project moves also carry `descendantImpact`: before/after counts, coverage flags, compared/changed/unchanged counts, at most twenty changed IDs with field names, truncation and limitations. Older receipts can omit it [@state].

URL receipts carry operation, request ID and `url_dispatched`; they do not return a created object ID. Request status exposes `pending`, `completed`, `unknown` or `dispatched`, or `not_seen` when no record exists. Replaying a completed request preserves its receipt; it is not a fresh location/revision read [@state] [@service]. See [Mutation Reconciliation](../architecture/mutation-reconciliation.md).
