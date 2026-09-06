---
title: "Known Capability Limits"
summary: "Known capability limits records current scaffold limits and planned Things-MCP limitations that must stay visible until public automation proves otherwise."
topics: [reference, capability-audit, automation-boundary, safety]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: capabilities
    type: file
    path: src/capabilities.ts
  - id: server
    type: file
    path: src/server.ts
  - id: domain
    type: file
    path: src/domain.ts
  - id: service
    type: file
    path: src/service.ts
  - id: tests
    type: file
    path: tests/core.test.ts
---

# Known Capability Limits

Known capability limits are constraints that current and future Things-MCP tools must report instead of hiding. The current scaffold exposes a bounded local stdio tool surface, while `PLAN.md` still defines the broader product limitations that must be audited before release [@server] [@plan]. These limits define what the current design already knows about the [Supported Automation Boundary](../concepts/supported-automation-boundary), and they qualify the [Capability Inventory](capability-inventory) until runtime audits prove more precise behavior.

## Current Scaffold Limits

The current scaffold is local stdio only. `things_capabilities` marks remote HTTP unavailable and says no public HTTP listener is started in this build [@capabilities]. The registered MCP tools cover capabilities, health, find, get, create, update, schedule, and request status; they do not include preview/apply, move, duplicate, tag management, history, trash/delete/restore, headings, checklists, repeat rules, or exact ordering tools [@server] [@capabilities].

Writes are disabled by local state unless setup enables ordinary writes, and create, update, and schedule are still marked unverified because real mutations need isolated-library verification [@service] [@capabilities]. The test suite verifies read-only blocking, strict schema rejection, stale revision rejection, request replay and conflict behavior, and uncertain-outcome blocking with synthetic adapters rather than live Things data [@tests].

The current schemas also narrow supported edits. Update accepts only title, notes, status, and deadline, with area and tag updates limited to title-only changes; schedule accepts only to-do or project targets and one calendar date [@domain]. Capability metadata further says schedule clearing, Evening, and reminders are not implemented [@capabilities].

## Shortcuts Limits

Shortcuts queries return at most 500 items according to the planning evidence [@plan]. Future retrieval tools therefore need narrowed query partitions, verified AppleScript enumeration, or an incomplete-results status when completeness cannot be established [@plan].

Deleting a heading or project through the documented Shortcuts actions also deletes its contents [@plan]. Area duplication and area deletion are not supported by those Shortcuts actions [@plan]. These facts make destructive previews mandatory for affected operations and prevent future tools from presenting those operations as ordinary edits.

Checklist data is represented as text rather than a documented stable-ID collection [@plan]. The plan requires checklist rewrites to preserve checked state and ordering, and to refuse operations when a lossless read is unavailable [@plan].

## Destructive And Recovery Limits

The planned design does not promise a general undo operation. Things Shortcuts editing does not provide general undo, and the capability inventory marks restore from Trash and previous-field restoration as routes that must be verified rather than assumed [@plan].

Permanent deletion, emptying Trash, and large cascades require explicit trusted approval bound to the operation [@plan]. An LLM-provided `confirm: true` is not enough for that approval [@plan]. The design also says optional local before-images may help recover supported field edits, but they contain private data, need protection and expiry, and are not a full Things backup [@plan].

## Unsupported Or Unverified Feature Areas

Repeat rules, repeat templates, and skipping an occurrence have no documented automation route established in the current plan [@plan]. Settings, sync controls, recurrence settings, account controls, and general preferences also have no supported automation route established and are assigned to manual handling [@plan].

Exact ordering remains uncertain across arbitrary task, heading, project, area, tag, and Today ordering [@plan]. Each ordering case requires audit, and private reorder commands must not be used [@plan]. Type conversions such as to-do to project, project to to-do, checklist to task, and other UI conversions are unverified; delete-and-recreate behavior is not an acceptable substitute without explicit disclosure [@plan].

## UI And Automation Boundaries

The stable server has no automatic UI-clicking fallback [@plan]. When public automation cannot express an operation, the planned result is a precise limitation plus a Things deep link for manual completion [@plan]. That limit follows the same decision captured by [Use Supported Things Interfaces Only](../decisions/use-supported-things-interfaces-only).

Application controls such as public window properties, close, print, and quit are optional local advanced tools after verification [@plan]. UI helper tools that reveal items, search in the app, inspect selected items, open Quick Entry, or edit an item must report their foreground or UI effects [@plan].

## Concurrency And Completeness Limits

Things and Things sync can race with the service, so public automation does not provide database transactions or a universal atomic compare-and-swap [@plan]. The planned mutation flow reads current values, applies a change, reads back, and returns discrepancies [@plan].

Timed-out creates also have uncertain outcomes because the Things action may already have committed [@plan]. The planned service returns `OUTCOME_UNKNOWN` and reconciles instead of blindly retrying the create [@plan].
