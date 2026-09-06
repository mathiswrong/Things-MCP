---
title: "Planned Tool Contract"
summary: "The tool contract records the current scaffolded MCP tools and the planned mutation, permission, and preview/apply behavior that remains to be completed."
topics: [reference, mcp, tool-contracts, mutations]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: server
    type: file
    path: src/server.ts
  - id: domain
    type: file
    path: src/domain.ts
  - id: service
    type: file
    path: src/service.ts
  - id: state
    type: file
    path: src/state.ts
  - id: capabilities
    type: file
    path: src/capabilities.ts
  - id: tests
    type: file
    path: tests/core.test.ts
---

# Planned Tool Contract

The tool contract describes the MCP surface Things-MCP exposes in the current scaffold and the fuller contract it intends to expose after more implementation. The current server registers task-oriented tools for capabilities, health, find, get, create, update, schedule, and request status [@server]. The remaining design keeps callers at the task-operation level, connects mutations to [Mutation Reconciliation](../architecture/mutation-reconciliation), and keeps adapter details inside [Things Adapters](../architecture/things-adapters) instead of exposing raw automation primitives [@plan].

## Current Scaffold Tool Surface

| Tool | Current purpose |
|---|---|
| `things_capabilities` | Returns the operation-family implementation and verification status from `src/capabilities.ts` [@server] [@capabilities]. |
| `things_health` | Checks local Things connection details, timezone, and ordinary-write permission [@server]. |
| `things_find_items` | Finds typed items by title or notes text and optional status, with bounded pagination and optional note inclusion [@server] [@domain]. |
| `things_get_item` | Reads one typed item by stable ID and returns the revision needed for editing [@server] [@domain]. |
| `things_create_item` | Creates a to-do, project, area, or tag behind local write permission; capability metadata still marks native writes unverified [@server] [@capabilities]. |
| `things_update_item` | Edits supported fields with a current revision and request ID; the schema limits area and tag updates to title only [@server] [@domain]. |
| `things_schedule_item` | Schedules a to-do or project on one calendar date; reminders, repeating rules, clearing, and Evening are not implemented [@server] [@domain] [@capabilities]. |
| `things_request_status` | Looks up the local receipt state for a mutation request ID [@server] [@state]. |

Read operations and mutation tools are separate in the current scaffold and in the planned surface [@server] [@plan]. Tool clients should not receive `run_script`, SQL, raw Apple Events, generic shell execution, arbitrary URL launchers, or caller-selected callback destinations; the design records that boundary as part of [No Generic Execution Tools](../decisions/no-generic-execution-tools) [@plan].

## Planned Tool Surface

The plan calls for additional task-oriented tools such as `things_create_todo`, `things_update_todo`, `things_create_project`, `things_move_items`, `things_set_status`, `things_update_checklist`, and `things_manage_tags` [@plan]. The current scaffold does not register those exact specialized tools; instead it registers generic typed item create, update, and schedule tools plus request-status lookup [@server]. Additional typed tools may cover the remaining registry entries, with small enums where appropriate [@plan].

## Capability Metadata

Every planned registry entry should identify what it can do and how that claim was verified. The plan requires each entry to declare inputs, output schema, supported object types, implementation adapter, required permission, side effects, version requirements, verification method, and test coverage [@plan].

The planned `things_capabilities` response is expected to classify operations as `supported`, `limited`, `unavailable`, or `unverified`, with reasons [@plan]. The current scaffold returns capability entries with `implemented`, `unverified`, and `unavailable` states [@capabilities]. A public dictionary declaration is only evidence to investigate, not a passing runtime test, and hidden or private experimental dictionary members are excluded from the stable server [@plan].

## Mutation Inputs

Each planned mutation takes stable Things IDs, explicit changed fields, and a request ID [@plan]. The current create, update, schedule, and request-status schemas require UUID request IDs; update and schedule require an expected revision, and invalid field and type combinations are rejected by strict Zod schemas [@domain]. Missing fields mean "leave unchanged"; explicit clear operations mean remove the value; invalid field and type combinations are rejected [@plan].

The request ID also participates in retry control. The service fingerprints the operation and input, records pending/completed/unknown records, returns completed receipts on identical replay, rejects reuse with different arguments, and returns `OUTCOME_UNKNOWN` for pending or unknown prior attempts [@service] [@state]. Tests cover completed replay, conflicting reuse, pending entries, and uncertain write outcomes that block automatic re-execution [@tests].

## Mutation Results

Mutation results should report affected IDs, Things links, changed fields, warnings, and verification status [@plan]. The current receipt schema records request ID, target, changed fields, and `read_back` verification; it does not yet include warnings or Things links in the stored receipt [@state]. The service reads back created, updated, and scheduled items before issuing a completed receipt and turns verification mismatch into an error [@service].

Batch results distinguish completed, failed, and unattempted operations [@plan]. The planned contract does not imply automatic rollback for partial failure [@plan].

## Preview And Apply

For larger edits, the planned workflow is `things_preview_changes` followed by `things_apply_changes` [@plan]. A preview records exact affected IDs, expected current values, intended changes, and cascading effects, and apply rejects stale previews [@plan]. The current scaffold does not register preview/apply tools [@server].

This workflow is bounded. Normal authorized single-item changes should take one tool call, while larger or riskier edits use preview/apply to make consequences explicit [@plan].

## Permissions And Annotations

The planned permission classes are read, ordinary write, destructive operations, and local UI [@plan]. The current state layer stores a local `allowWrites` setting, and the service checks it before adapter mutation access [@state] [@service]. Tests verify that ordinary writes are denied by default before adapter access and that revoking writes affects an existing service on the next request [@tests].

The service should return structured results plus concise text for clients with basic rendering, and it should annotate read-only and destructive tools accurately [@plan]. Those annotations help clients but do not enforce security; enforcement belongs at the service boundary for every request [@plan].
