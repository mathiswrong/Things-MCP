---
title: "Capability Inventory"
summary: "The capability inventory lists current scaffold operation status and the remaining planned Things-MCP audit obligations."
topics: [reference, capability-audit, things-integration]
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

# Capability Inventory

The capability inventory is the lookup table for Things-MCP operation status. The current worktree contains an initial TypeScript scaffold whose MCP server exposes `things_capabilities`, health, find, get, create, update, schedule, and request-status tools [@server]. The broader plan still defines the full audit obligation for [Capability Audit](../concepts/capability-audit): every public Things operation and writable property must eventually be implemented, limited, unavailable, or unverified with an explicit reason [@plan].

## Audit Status Meaning

The plan defines the inventory as an implementation target, where "target" means implement and verify rather than claim current support [@plan]. The current scaffold uses the states `implemented`, `unverified`, and `unavailable` in `src/capabilities.ts` [@capabilities]. Future full registry entries are still expected to align with the planned `supported`, `limited`, `unavailable`, or `unverified` vocabulary, with reasons, before release [@plan].

Each future entry should declare inputs, output schema, supported object types, implementation adapter, required permission, side effects, version requirements, verification method, and test coverage [@plan]. The scaffold currently places input schemas in `src/domain.ts`, service behavior in `src/service.ts`, registered tool schemas in `src/server.ts`, and selected core behavior tests in `tests/core.test.ts` [@domain] [@service] [@server] [@tests]. The feasibility milestone in [Feasibility Audit](../guides/feasibility-audit) remains the route for turning planned rows into verified or explicitly limited capabilities.

## Current Scaffold Status

| Operation family | Current state | Evidence and limits |
|---|---|---|
| `health` | `implemented` | Registered as `things_health`; capability metadata still says live validation is pending [@server] [@capabilities]. |
| `find_items` | `implemented` | Registered as `things_find_items`; query inputs are bounded by type, text, status, limit, offset, and `includeNotes`, and the service omits notes unless requested [@server] [@domain] [@service]. |
| `get_item` | `implemented` | Registered as `things_get_item`; references use typed item kind and stable ID validation [@server] [@domain]. |
| `create_item` | `unverified` | Registered as `things_create_item`; capability metadata says real mutations require isolated-library verification and writes are behind local permission [@server] [@capabilities]. |
| `update_item` | `unverified` | Registered as `things_update_item`; schema allows title, notes, status, and deadline changes, requires a current revision, and rejects unsupported type-specific edits [@server] [@domain]. |
| `schedule_item` | `unverified` | Registered as `things_schedule_item`; schema accepts only to-do or project targets and one calendar date, and capability metadata excludes clearing, Evening, and reminders [@server] [@domain] [@capabilities]. |
| `request_status` | `implemented` | Registered as `things_request_status`; state records pending, completed, and unknown mutation outcomes by UUID request ID [@server] [@service]. |
| Headings and checklists | `unavailable` | Capability metadata requires a reviewed Shortcuts bridge for headings and lossless checklist round trips before checklist writes [@capabilities]. |
| Move, duplicate, tags, history | `unavailable` | Capability metadata says public routes are identified but implementation is pending [@capabilities]. |
| Trash, delete, restore | `unavailable` | Capability metadata says cascades and permanent area deletion need explicit safety controls [@capabilities]. |
| Repeat rules and exact ordering | `unavailable` | Capability metadata says no supported repeat-rule editing interface is established and private experimental reorder commands are excluded [@capabilities]. |
| Remote HTTP | `unavailable` | Capability metadata says this build exposes local stdio only and starts no public HTTP listener [@capabilities]. |

The tests are synthetic core tests, not live Things integration tests. They verify read-only default blocking, strict inputs, request replay and conflict handling, stale revision protection, read-back receipts, uncertain outcome blocking, note omission by default in search, and state-file safety behavior [@tests].

## Planned Inventory

| Area | Operations to account for | Planned route or disposition |
|---|---|---|
| Discovery | Versions, health, capability details, object types | Core service plus public AppleScript [@plan] |
| Retrieval | Get by ID, existence checks, counts, title and notes search, filters, bounded lists | AppleScript plus Shortcuts [@plan] |
| Navigation lists | Inbox, Today, Upcoming, Anytime, Someday, Logbook, and other built-in views | Retrieval must be verified separately from opening a view [@plan] |
| To-dos | Create, edit title and notes, complete, cancel, reopen, duplicate | AppleScript plus Shortcuts [@plan] |
| Dates | Schedule, unschedule, deadline, completion date, cancellation date | AppleScript plus URL commands, with clear semantics still to verify [@plan] |
| Planning | Today, Evening, future start, reminder time, Anytime, Someday | URL commands plus Shortcuts [@plan] |
| Projects | Create, update, move into area, status, duplicate, nested project templates | AppleScript plus URL JSON [@plan] |
| Areas | List, create, rename, tags, collapsed state, deletion behavior | Public AppleScript; destructive semantics require proof [@plan] |
| Headings | Find, create, rename, duplicate, status, delete | Shortcuts; every permitted property needs verification [@plan] |
| Placement | Move tasks between containers, assign a heading | AppleScript plus documented URL placement [@plan] |
| Checklists | Read, set, append, prepend, check, uncheck, remove, reorder rows | Shortcuts plus URL support, with lossless round trips required [@plan] |
| Tags | List, create, rename, delete, parent hierarchy, keyboard shortcut | Public AppleScript [@plan] |
| Tag assignment | Add, remove, or replace direct tags; distinguish inherited tags | AppleScript plus Shortcuts [@plan] |
| History | Read logged items, log completed items, exposed timestamps | Public AppleScript; global operations must be marked clearly [@plan] |
| Deletion | Trash items, permanently delete, empty Trash, cascades | Shortcuts plus AppleScript; elevated permission [@plan] |
| Recovery | Restore from Trash, restore previous field values | Supported route must be verified; there is no universal undo promise [@plan] |
| UI helpers | Reveal item or list, search in app, selected items, Quick Entry, edit item | Supported interfaces with foreground or UI effects reported [@plan] |
| Templates and bulk edits | Create structured projects, bounded multi-item edits | Core orchestration plus supported adapters [@plan] |
| Repetition | Read or edit repeat rules, create repeat templates, skip occurrence | No documented route established; manual handoff unless proven [@plan] |
| Exact ordering | Arbitrary ordering for tasks, headings, projects, areas, tags, and Today | Each case requires audit; private reorder commands are excluded [@plan] |
| Type conversions | To-do to project, project to to-do, checklist to task, other UI conversions | Unverified; delete and recreate is not a substitute without disclosure [@plan] |
| Application controls | Public window properties, close, print, quit | Optional local advanced tools after verification [@plan] |
| Legacy dictionary surface | Contacts, assignment, Quicksilver input parser | Runtime support must be audited, and modern collaboration support must not be implied [@plan] |
| Settings and sync | Recurrence settings, account or sync controls, general preferences | No supported automation route is established; manual handling [@plan] |

## Reading This Reference

Rows in this table are audit obligations. They should not be cited as implemented capability until code and tests exist. Known planned constraints, including Shortcuts result limits, destructive cascades, checklist representation, recurrence gaps, and ordering uncertainty, are recorded in [Known Capability Limits](known-capability-limits) [@plan].
