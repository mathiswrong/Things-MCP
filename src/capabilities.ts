export const capabilities = [
  {
    operation: "health",
    state: "implemented",
    adapter: "applescript",
    validation: "live_read_verified_3.23.4",
  },
  {
    operation: "find_items",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Built-in list and project/area filters supported. Project Inbox/Anytime queries and project parents for projects are rejected. Trash excluded by default. Each scan examines up to 5000 objects. Follow nextScanOffset to continue. Tag/date filters, selection, sorting, counts and existence are implemented; pagination is not a snapshot.",
  },
  { operation: "get_item", state: "implemented", adapter: "applescript" },
  {
    operation: "create_item",
    state: "implemented",
    adapter: "applescript",
    validation: "native_write_verified_3.23.4",
    limitation:
      "Creation and renaming of to-dos, projects, areas and tags verified. Local write permission required.",
  },
  {
    operation: "update_item",
    state: "implemented",
    adapter: "applescript",
    validation: "native_write_verified_3.23.4",
    limitation:
      "Title/notes replacement and increments, status, deadlines, public timestamps, tag assignment, tag hierarchy/shortcuts and area collapse are implemented. Project revisions include exposed child fields. Completing or canceling a project closes open children; reopening does not reopen them. Read revision required.",
  },
  {
    operation: "schedule_item",
    state: "implemented",
    adapter: "applescript",
    validation: "native_write_verified_3.23.4",
    limitation:
      "To-do and populated-project calendar-date scheduling verified. Clearing, Evening and reminders use the separate URL extras tool with unverified dispatch receipts.",
  },
  {
    operation: "move_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_and_populated_project_moves_live_verified_3.23.4",
    limitation:
      "To-do Inbox, Today, Anytime, Someday, project placement and detachment verified. Area placement/detachment and populated-project Today/Someday verified. Project Anytime and direct Logbook moves are rejected after failed native verification. Populated-project area movement and descendant preservation passed native checks. Project move receipts include descendantImpact counts and up to 20 changed task IDs with exposed field names; unchanged fields do not prove no inherited effect. No headings, reordering, or Trash restoration.",
  },
  {
    operation: "trash_item",
    state: "implemented",
    adapter: "applescript",
    validation: "single_native_write_verified_3.23.4",
    limitation:
      "Requires separate per-connection Trash permission plus ordinary writes. Moves one open to-do and its checklist to Trash. Closed-task deletion failed native checks and is rejected before writing. Container deletion is a separate operation. No per-item permanent deletion is enabled; restore is a separate tool.",
  },
  {
    operation: "restore_item",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Open to-do restoration to Inbox passed native read-back. Requires normal writes and the current revision. Open projects restore to Today. Both routes passed native read-back. Closed items are not enabled; trashed project child enumeration is unavailable before restoration.",
  },
  {
    operation: "request_status",
    state: "implemented",
    adapter: "local_journal",
  },
  {
    operation: "count_items",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Count each scan segment and follow nextScanOffset until scanComplete. Not an atomic library snapshot.",
  },
  { operation: "item_exists", state: "implemented", adapter: "applescript" },
  {
    operation: "navigate",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Show an item/list, edit an item, or open Quick Entry on this Mac. Requires writes and a request ID. Receipt means command accepted, not that a task was created or a remote device changed view. Show/edit and selected-item read-back were native checked. Quick Entry opening and dismissal were checked in the UI; Things may retain a previous draft.",
  },
  {
    operation: "preview_destructive",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Reads affected exposed objects and returns a scope revision. Checklist, heading and repeat-template internals are not exposed. Global execution remains disabled.",
  },
  {
    operation: "apply_destructive",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Open-project, area and tag-hierarchy deletion passed native checks. Requires the separate container grant and a current scope preview. Area previews distinguish Trash movement from archived projects retained in Logbook. Whole-library commands remain disabled pending their checks. Health reports each native gate independently.",
  },
  {
    operation: "headings",
    state: "limited",
    adapter: "url_scheme",
    limitation:
      "Initial headings in project templates and task placement under existing headings are available. No full heading read-back or in-place heading edits. URL receipts confirm dispatch only.",
  },
  {
    operation: "checklists",
    state: "limited",
    adapter: "url_scheme",
    limitation:
      "Create or replace rows with checked/canceled state, clear rows, append or prepend text. No existing row IDs or full read-back. Replacement affects every row. Maximum 100 rows. URL receipts confirm dispatch only.",
  },
  {
    operation: "duplicate",
    state: "implemented",
    adapter: "url_scheme",
    limitation:
      "Duplicate a to-do or project with the local Keychain token and current revision. Repeating items cannot be duplicated. Receipt identifies the source and confirms dispatch only; the new ID is not returned.",
  },
  {
    operation: "create_from_template",
    state: "implemented",
    adapter: "url_scheme",
    limitation:
      "Create one structured to-do or project with up to 100 project entries and bounded payload size. No token needed. Receipt confirms dispatch only and has no created ID.",
  },
  {
    operation: "edit_extras",
    state: "implemented",
    adapter: "url_scheme",
    limitation:
      "Checklist edits, heading placement, reminders, Evening and When clearing require the local Keychain token and a current revision. Unexposed fields cannot participate in revision checks. Receipt confirms dispatch only.",
  },
  {
    operation: "show_view",
    state: "implemented",
    adapter: "url_scheme",
    limitation:
      "Open search or built-in views with optional tag filters. Changes only the Mac view. Requires ordinary writes; receipt confirms URL dispatch only.",
  },
  {
    operation: "permanent_delete",
    state: "unavailable",
    adapter: "applescript",
    limitation:
      "Per-item permanent deletion is not enabled. The public whole-library Empty Trash command exists but remains disabled pending isolated-library verification. Open-item restoration is available through restore_item.",
  },
  {
    operation: "repeat_rules",
    state: "unavailable",
    limitation:
      "Excluded: no supported public editing interface. No replacement scheduler.",
  },
  {
    operation: "exact_ordering",
    state: "unavailable",
    limitation: "Private experimental reorder commands are excluded.",
  },
  {
    operation: "remote_http",
    state: "unavailable",
    limitation:
      "The core exposes stdio and starts no public HTTP listener. Remote access is available through the optional private provider tunnel, which launches this same stdio server.",
  },
] as const;
