# Capability reference

Version 0.83 exposes ten MCP tools. The server uses Things' supported AppleScript interface through fixed JXA and AppleScript files. It does not use a private database API.

| Tool | Inputs and behavior |
|---|---|
| `things_health` | App version, running status, Mac timezone, and this connection's ordinary-write and Trash permissions. Does not read tasks. |
| `things_capabilities` | Implementation and verification status for each operation family. |
| `things_find_items` | Item kind, case-insensitive text in title or notes, optional status, built-in list or project/area parent, offset, and limit. Notes are omitted from results by default. |
| `things_get_item` | One kind and stable ID. Returns fields, revision, and a Things link. |
| `things_create_item` | Kind, title, optional notes, and unique UUID request ID. Creation of all four kinds is native verified. |
| `things_update_item` | Kind and ID, current revision, unique request ID, and supported changed fields. |
| `things_schedule_item` | To-do or project ID, current revision, unique request ID, and a calendar date. |
| `things_move_item` | Move a to-do/project to a supported list or parent, or detach its parent. Requires current revision and a unique request ID. |
| `things_trash_item` | Move one to-do and its checklist to Trash. Requires current revision, a unique request ID, ordinary writes and the separate Trash grant. Never permanently deletes. |
| `things_request_status` | A mutation's UUID request ID. Returns its durable local receipt or pending/unknown status. |

## Item fields

To-dos and projects expose title, notes, status, deadline, scheduled date, area membership, and tag names. To-dos also expose project membership. Both expose whether they are in Trash. Areas expose title and tag names. Tags expose title, parent tag ID, and keyboard shortcut. Exposing a field for reading does not make it writable.

To-do and project updates accept title, notes, status, and deadline. Area and tag updates accept title only. Renaming a tag changes that shared tag wherever it is used. Omitted fields remain unchanged; a deadline of `null` clears that deadline. Status is `open`, `completed`, or `canceled`. A create cannot set a project, area, tags, dates, or status in the same request.

Titles are trimmed, nonempty, and limited to 4,000 characters. Notes are limited to 10,000 characters. Areas and tags cannot have notes. Dates must be real calendar dates in `YYYY-MM-DD` format and are interpreted in the Mac's timezone. Scheduling does not set a reminder, choose Evening, clear a scheduled date, or create a repeat rule.

## Search limits

The default page size is 25, with a maximum of 100. Offsets range from 0 through 4,999. Text filters are limited to 500 characters. A search considers at most 5,000 objects, although Things may materialize its full collection before filtering. Logbook queries allow up to 60 seconds for large histories; other native calls allow 20 seconds. A large library can still exceed those bounds. `scanComplete: false` means it stopped after filling a page or reaching that cap. Follow `nextOffset` only when provided; otherwise narrow the query. The search is not a snapshot: concurrent edits can change the order between pages.

Search can match notes while omitting notes from returned content. Always fetch the chosen item before editing it. Search accepts a built-in `list` (Inbox, Today, Anytime, Upcoming, Someday, Logbook, or Trash), or a `parent` reference for an area or project. These filters apply to to-dos and projects and cannot be combined. Projects accept an area parent, not a project parent. Project queries for Inbox or Anytime are rejected; the public Anytime collection did not return the verified fixture project. Use an unscoped project query or area filter to find it. Unscoped searches exclude Trash. Deadline and tag filters are not implemented.

## Verification and unavailable operations

Live checks cover creation and renaming of all four kinds. To-dos and empty projects passed notes edits, deadline set and clear, scheduling, completion, cancellation, and reopening. To-do moves to Inbox, Today, Anytime, Someday, into a project and out of a project are verified. To-dos and empty projects passed area placement and detachment; empty projects passed Today and Someday moves. Individual to-do Trash was verified on Things 3.23.3 and 3.23.4. See [the verification record](../VERIFICATION.md) for evidence and limits.

Moves and individual to-do Trash are implemented. Projects can move into areas but not other projects or Inbox. To-do list moves support Inbox, Today, Anytime, and Someday. Projects support Today and Someday. Direct Logbook moves failed native checks and are rejected before writing. Use completion/cancellation for lifecycle changes; Things controls logging according to its own settings. Project moves to Anytime are rejected before writing: the public list collection did not expose the project for destination verification in native checks. Upcoming requires the scheduling tool. Existing Trash items cannot be edited, moved, or trashed again through these tools. Revisions cover exposed fields; they do not cover hidden checklist content or native repeat templates.

Container deletion, permanent deletion, empty Trash, restoration, duplication, tag assignment/hierarchy editing, history navigation, type conversion, reminders, batch changes, and general undo are not implemented. Full heading/checklist access requires Apple Shortcuts, which is excluded. The URL scheme offers narrower checklist writes without a read-back query. Native repeat-rule editing and arbitrary ordering have no established supported route and are excluded. See [Full scope](FULL-SCOPE.md) for the complete inventory.

The service exposes local stdio. The optional secure tunnel carries that protocol for remote clients; there is no standalone public HTTP server or generic OAuth endpoint in this release.

## Why these actions are available

The ten tools use public item collections, properties, and commands from Things' [AppleScript interface](https://culturedcode.com/things/support/articles/4562654/). Fixed scripts receive validated data; callers cannot submit scripts. Creation and editing verify exposed fields. Scheduling verifies the returned calendar date. Parent moves verify membership fields, and list moves and Trash verify collection membership. Health reads app metadata; request status reads the local journal. The capability tool reports this server's supported scope.

Missing operations fall into three groups:

| Reason | Examples | What it means |
|---|---|---|
| No supported route identified | Native repeat-rule editing, lossless type conversion, arbitrary ordering, general undo, Things Cloud account access | The server cannot provide these through its supported interfaces. |
| Available through a route this server excludes | Full checklist and heading queries via Shortcuts; limited checklist and structured-project writes via URL scheme | Things supports parts of these workflows, but this server does not use Shortcuts or provide URL writes without verifiable read-back. |
| Supported by Things, not implemented or not sufficiently verified here | Tag assignment and hierarchy, duplication, navigation, reminders via URL scheme, container deletion, project Anytime and direct Logbook moves | These are server limitations. They must not be described as missing Things features. |

The [full-scope inventory](FULL-SCOPE.md) lists the remaining operations and their individual reasons. Populated-project cascades, hidden checklist changes, and repeating templates are outside the verified coverage. Completing or moving a project can affect its descendants even though the receipt only verifies exposed project fields.
