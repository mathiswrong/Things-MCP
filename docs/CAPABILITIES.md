# Capability reference

This reference describes version 1.0.0-dev.0, which is in development. The published release is 0.83. Development completion and native evidence are tracked in [the acceptance record](V1-READINESS.md).

The development server exposes sixteen MCP tools through fixed JXA and AppleScript commands. It does not accept caller scripts, access the Things database, or use Apple Shortcuts.

| Tool | Behavior |
|---|---|
| `things_health` | App version, running status, Mac timezone, connection grants and native verification gates. Does not read tasks. |
| `things_capabilities` | Implementation and verification status of each operation family. |
| `things_find_items` | Search by kind, title/notes text, status, tag ID, deadline or scheduled-date range, selected items, built-in list or parent. Optional result sorting. Notes omitted by default. |
| `things_get_item` | Read one kind and stable ID, with exposed fields, revision and Things link. Active-project revisions include exposed child snapshots. A trashed project cannot enumerate its children and omits child count/revision. A known child of a trashed project reports inherited Trash membership through its live parent reference. |
| `things_count_items` | Count matching objects within a scan segment. Continue until `scanComplete` for a full count. |
| `things_exists` | Check a kind and ID. A missing item returns false; permission or native failures remain errors. |
| `things_create_item` | Create a to-do, project, area or tag with supported initial properties. |
| `things_update_item` | Replace or increment supported fields using the current revision. |
| `things_schedule_item` | Set a to-do or project's calendar start date. |
| `things_move_item` | Move to supported lists or parents, or detach a parent. |
| `things_restore_item` | Restore an open to-do to Inbox or an open project to Today, with current revision, normal writes and verified root read-back. |
| `things_trash_item` | Move one open to-do and its checklist to Trash, with the separate Trash grant. |
| `things_navigate` | Show an item/list, open an item for editing, or open Quick Entry on the Mac. |
| `things_preview_destructive` | Development preview of exposed objects affected by a container deletion or global maintenance command. Returns a scope revision. |
| `things_apply_destructive` | Development implementation with independent grants and stale-scope checks. Open-project, area and tag-hierarchy deletion are native verified. Global-command gates remain disabled pending separate checks. |
| `things_request_status` | Read a durable mutation receipt or pending/unknown status by request ID. |

## Fields and edits

To-dos and projects expose title, notes, status, deadline, scheduled date, area, tag names/IDs, creation/modification/completion/cancellation timestamps and Trash membership. To-dos expose project membership. Areas expose title, tag names/IDs and collapsed state. Tags expose title, parent tag ID and keyboard shortcut.

Updates accept fields appropriate to the kind. Use `appendTitle`, `prependTitle`, `appendNotes` or `prependNotes` for text increments. Replacement and increment modes cannot be combined for the same field. Use `tagIds` to replace or clear assignments, or `addTagIds`/`removeTagIds` for incremental changes. Tag IDs must exist; names that the public tag-name setter cannot represent unambiguously are rejected. This does not claim a separate inherited-tag editing API.

Use `parentTagId: null` to detach a tag, `keyboardShortcut: ""` to clear its shortcut, and `deadline: null` to clear a deadline. Completion and cancellation timestamps accept null. Creation and modification timestamps cannot be cleared. Renaming a tag changes the shared object wherever it is used. Hierarchy cycles are rejected.

Creation accepts initial status, deadline, supported timestamps, tags and either a project or area placement where applicable. A project cannot belong to another project. Area and tag creation accept only their own supported properties.

Titles are trimmed, nonempty and limited to 4,000 characters; notes to 10,000 characters; tag lists to 100 unique IDs. Calendar dates use `YYYY-MM-DD` in the Mac's timezone. Timestamps require an explicit timezone and are normalized to UTC. Scheduling does not set a reminder, choose Evening, clear a start date or create a repeat rule.

Completing or canceling a project closes its open children. Reopening the project leaves completed/canceled children closed. The service checks exposed child content and status after project mutations. Public automation is not transactional: a failed read-back can follow a successful change and does not mean it was undone.

## Search and count limits

The default page size is 25, maximum 100. Each segment examines at most 5,000 objects and yields a continuation after approximately five seconds of item processing. Materializing native collections can take additional time. Follow `nextScanOffset`, with `offset` left at zero, until `scanComplete` is true. An empty page can still have a continuation. The older `offset`/`nextOffset` interface remains available within its 0 through 4,999 window. Count results apply to one segment; sum them while following continuations.

Sorting changes response order, not Things order. Title sorting works for all kinds; date sorting applies to to-dos and projects. Null dates sort last. Pagination and counts are not snapshots; native edits between requests can shift results. Things may materialize or sort a full collection before the bounded scan. Large histories can exceed the 60-second native read allowance or output-size limit.

Choose one scope: a built-in list, project/area parent, or current selection. Project children include logged completed items that the normal open-project collection omits. Project Inbox/Anytime queries are rejected because the destination collection does not provide the required verified membership. Unscoped searches use the active native collection and exclude Trash. Use the explicit Logbook scope for history; completed projects are identified by typed ID lookup because the active project collection omits them. Fetch the selected result before editing it.

## Writes and verification

Every mutation needs normal local authorization and a unique UUID request ID. Item edits require a current revision. Shared locking, persistent receipts and precondition checks apply across clients. Never retry an uncertain mutation under a new request ID until its result has been inspected.

Task-changing tools verify the affected exposed fields or list membership. `things_navigate` instead returns `verification: "command_accepted"`: Things accepted a UI command. It does not certify that a task was created, the user submitted Quick Entry, or a remote screen changed.

Quick Entry opening and dismissal were checked in the native UI. Things can retain a prior draft; the tool does not clear it or submit it.

Area deletion previews label each effect. Open projects and their children move to Trash. Already logged projects and their children stay in Logbook with their area association removed. The area itself is deleted. Project restoration recovers its children; it does not recreate a deleted area.

Individual to-do Trash requires its own grant. Development container deletion, global Empty Trash and global Log Completed each have another independent grant, default off. Native gates are independent: open-project, area and tag-hierarchy deletion passed, while global commands remain disabled until their own checks pass. Global commands affect the whole library; they are not substitutes for a targeted fixture test.

## Remaining limits

To-dos can move to Inbox, Today, Anytime, Someday, projects and areas. Projects can move to Today, Someday and areas. Upcoming uses scheduling. Project Anytime and direct Logbook moves previously failed verification and remain rejected. Existing Trash items cannot be edited. Closed-task deletion returned -1728 in native checks and is rejected before writing. The restore tool supports open to-dos returning to Inbox; open projects restore to Today. Closed items remain under investigation.

Duplication, broader restoration, reminders, Evening, explicit start-date clearing, structured project templates and URL checklist writes remain development work. The URL interface can write checklist text and create structured projects, but cannot read back all checklist/heading fields. Full checklist queries and checked-row editing require the excluded Shortcuts route. A navigation acceptance receipt is not a precedent for silently claiming those task changes were verified.

Native repeat-rule editing, general undo, lossless type conversion, arbitrary reordering and direct Things Cloud account access have no established supported route. Private experimental commands and substitute schedulers are excluded. Missing server work is recorded separately from vendor limits in [Full scope](FULL-SCOPE.md).

## Supported interfaces

The [Things AppleScript interface](https://culturedcode.com/things/support/articles/4562654/) supplies the collections, properties and commands used here. The [documented URL interface](https://culturedcode.com/things/support/articles/2803573/) provides additional write operations under evaluation. Things itself handles cloud synchronization.

The server uses standard local MCP stdio. An optional private tunnel carries it to the configured account. No standalone public HTTP listener or generic OAuth endpoint is included. Client installation and wider environment verification are separate from native command verification.
