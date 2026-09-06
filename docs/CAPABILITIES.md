# Capability reference

Version 0.1 exposes ten MCP tools. The server uses Things' supported AppleScript interface through fixed JXA and AppleScript files. It does not use a private database API.

| Tool | Inputs and behavior |
|---|---|
| `things_health` | App version, running status, Mac timezone, and this connection's ordinary-write and Trash permissions. Does not read tasks. |
| `things_capabilities` | Implementation and verification status for each operation family. |
| `things_find_items` | Item kind, case-insensitive text in title or notes, optional status, built-in list or project/area parent, offset, and limit. Notes are omitted from results by default. |
| `things_get_item` | One kind and stable ID. Returns fields, revision, and a Things link. |
| `things_create_item` | Kind, title, optional notes, and unique UUID request ID. To-do and project creation are verified. Areas and tags are experimental. |
| `things_update_item` | Kind and ID, current revision, unique request ID, and supported changed fields. |
| `things_schedule_item` | To-do or project ID, current revision, unique request ID, and a calendar date. |
| `things_move_item` | Move a to-do/project to a supported list or parent, or detach its parent. Requires current revision and a unique request ID. |
| `things_trash_item` | Move one to-do and its checklist to Trash. Requires current revision, a unique request ID, ordinary writes and the separate Trash grant. Never permanently deletes. |
| `things_request_status` | A mutation's UUID request ID. Returns its durable local receipt or pending/unknown status. |

## Item fields

To-dos and projects expose title, notes, status, deadline, scheduled date, area membership, and tag names. To-dos also expose project membership. Both expose whether they are in Trash. Areas expose title and tag names. Tags expose title, parent tag ID, and keyboard shortcut. Exposing a field for reading does not make it writable.

To-do and project updates accept title, notes, status, and deadline. Area and tag updates accept title only. Omitted fields remain unchanged; a deadline of `null` clears that deadline. Status is `open`, `completed`, or `canceled`. A create cannot set a project, area, tags, dates, or status in the same request.

Titles are trimmed, nonempty, and limited to 4,000 characters. Notes are limited to 10,000 characters. Areas and tags cannot have notes. Dates must be real calendar dates in `YYYY-MM-DD` format and are interpreted in the Mac's timezone. Scheduling does not set a reminder, choose Evening, clear a scheduled date, or create a repeat rule.

## Search limits

The default page size is 25, with a maximum of 100. Text filters are limited to 500 characters. A search scans at most 5,000 objects. `scanComplete: false` means it stopped after filling a page or reaching that cap. Follow `nextOffset` only when provided; otherwise narrow the query. The search is not a snapshot: concurrent edits can change the order between pages.

Search can match notes while omitting notes from returned content. Always fetch the chosen item before editing it. Search accepts a built-in `list` (Inbox, Today, Anytime, Upcoming, Someday, Logbook, or Trash), or a `parent` reference for an area or project. These filters apply to to-dos and projects and cannot be combined. Unscoped searches exclude Trash. Deadline and tag filters are not implemented.

## Verification and unavailable operations

Live to-do checks cover create, Unicode title and notes edits, deadline set and clear, scheduling, completion, cancellation, and reopening. Project creation and empty-project completion are also verified. To-do moves to Inbox, Today, Anytime, Someday, into a project and out of a project, and individual to-do Trash are live verified. Area moves and Logbook moves remain experimental. Area and tag mutations remain experimental. See [the verification record](../VERIFICATION.md) for evidence and limits.

Moves and individual to-do Trash are implemented. Projects can move into areas but not other projects or Inbox. List moves support Inbox, Today, Anytime, Someday, and Logbook; Upcoming requires the scheduling tool. Moving to Logbook can complete an item. Existing Trash items cannot be edited, moved, or trashed again through these tools. Revisions cover exposed fields; they do not cover hidden checklist content or native repeat templates.

Container deletion, permanent deletion, empty Trash, restoration, duplication, tag assignment/hierarchy editing, history navigation, type conversion, reminders, batch changes, and general undo are not implemented. Full heading/checklist access requires Apple Shortcuts, which is excluded. The URL scheme offers narrower checklist writes without a read-back query. Native repeat-rule editing and arbitrary ordering have no established supported route and are excluded. See [Full scope](FULL-SCOPE.md) for the complete inventory.

The service exposes local stdio. The optional secure tunnel carries that protocol for remote clients; there is no standalone public HTTP server or generic OAuth endpoint in this release.
