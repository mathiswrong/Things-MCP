# Capability reference

Version 0.1 exposes eight MCP tools. The server uses Things' supported AppleScript interface through a fixed JXA script. It does not use a private database API.

| Tool | Inputs and behavior |
|---|---|
| `things_health` | App version, running status, Mac timezone, and this connection's write permission. Does not read tasks. |
| `things_capabilities` | Implementation and verification status for each operation family. |
| `things_find_items` | Item kind, case-insensitive text in title or notes, optional status, offset, and limit. Notes are omitted from results by default. |
| `things_get_item` | One kind and stable ID. Returns fields, revision, and a Things link. |
| `things_create_item` | Kind, title, optional notes, and unique UUID request ID. To-do creation is verified. Other kinds are experimental. |
| `things_update_item` | Kind and ID, current revision, unique request ID, and supported changed fields. |
| `things_schedule_item` | To-do or project ID, current revision, unique request ID, and a calendar date. |
| `things_request_status` | A mutation's UUID request ID. Returns its durable local receipt or pending/unknown status. |

## Item fields

To-dos and projects expose title, notes, status, deadline, scheduled date, area membership, and tag names. To-dos also expose project membership. Areas expose title and tag names. Tags expose title, parent tag ID, and keyboard shortcut. Exposing a field for reading does not make it writable.

To-do and project updates accept title, notes, status, and deadline. Area and tag updates accept title only. Omitted fields remain unchanged; a deadline of `null` clears that deadline. Status is `open`, `completed`, or `canceled`. A create cannot set a project, area, tags, dates, or status in the same request.

Titles are trimmed, nonempty, and limited to 4,000 characters. Notes are limited to 10,000 characters. Areas and tags cannot have notes. Dates must be real calendar dates in `YYYY-MM-DD` format and are interpreted in the Mac's timezone. Scheduling does not set a reminder, choose Evening, clear a scheduled date, or create a repeat rule.

## Search limits

The default page size is 25, with a maximum of 100. Text filters are limited to 500 characters. A search scans at most 5,000 objects. `scanComplete: false` means it stopped after filling a page or reaching that cap. Follow `nextOffset` only when provided; otherwise narrow the query. The search is not a snapshot: concurrent edits can change the order between pages.

Search can match notes while omitting notes from returned content. Always fetch the chosen item before editing it. Search does not currently filter by Inbox, Today, area, project, deadline, or tag.

## Verification and unavailable operations

Live to-do checks cover create, Unicode title and notes edits, deadline set and clear, scheduling, completion, cancellation, and reopening. Project, area, and tag reads are verified; their mutations remain experimental. See [the verification record](../VERIFICATION.md) for evidence and limits.

Headings, checklists, move/duplicate, tag assignment and hierarchy editing, history navigation, Trash, delete/restore, type conversion, reminders, batch changes, and a general undo operation are not implemented. Supported repeat-rule editing and exact ordering have not been established. Unsupported actions must be reported as unavailable, never approximated by deleting and recreating data.

The service exposes local stdio. The optional secure tunnel carries that protocol for remote clients; there is no standalone public HTTP server or generic OAuth endpoint in this release.
