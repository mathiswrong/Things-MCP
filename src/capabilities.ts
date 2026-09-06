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
      "To-do and populated-project calendar-date scheduling verified. Clearing, Evening and reminders are not implemented.",
  },
  {
    operation: "move_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_and_empty_project_moves_live_verified_3.23.4",
    limitation:
      "To-do Inbox, Today, Anytime, Someday, project placement and detachment verified. Area placement/detachment and empty-project Today/Someday verified. Project Anytime and direct Logbook moves are rejected after failed native verification. Populated-project effects remain unverified. No headings, reordering, or Trash restoration.",
  },
  {
    operation: "trash_item",
    state: "implemented",
    adapter: "applescript",
    validation: "single_native_write_verified_3.23.4",
    limitation:
      "Requires separate per-connection Trash permission plus ordinary writes. Moves one open to-do and its checklist to Trash. Closed-task deletion failed native checks and is rejected before writing. Container deletion is a separate development operation. No per-item permanent deletion is enabled; restore is a separate tool.",
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
      "Show an item/list, edit an item, or open empty Quick Entry on this Mac. Requires writes and a request ID. Receipt means command accepted, not that a task was created or a remote device changed view. Show/edit and selected-item read-back were native checked; Quick Entry still needs a UI check.",
  },
  {
    operation: "preview_destructive",
    state: "development",
    adapter: "applescript",
    limitation:
      "Reads affected exposed objects and returns a scope revision. Native completeness checks are in progress.",
  },
  {
    operation: "apply_destructive",
    state: "development",
    adapter: "applescript",
    limitation:
      "Open-project deletion passed native checks and requires the separate container grant plus a current scope preview. Tag-hierarchy deletion and assignment removal passed native checks. Area deletion and whole-library commands remain disabled pending their checks. Health reports each native gate independently.",
  },
  {
    operation: "headings",
    state: "unavailable",
    adapter: "shortcuts",
    limitation:
      "Excluded: Apple Shortcuts dependencies are not part of this product.",
  },
  {
    operation: "checklists",
    state: "unavailable",
    adapter: "shortcuts",
    limitation:
      "Full checklist queries and checked-row editing are unavailable without Apple Shortcuts, which is excluded. URL writes do not supply a read-back interface.",
  },
  {
    operation: "duplicate",
    state: "unavailable",
    adapter: "applescript",
    limitation:
      "The native command returned -1717 and is not registered as a tool. The documented URL duplication route remains implementation work.",
  },
  {
    operation: "permanent_delete_restore",
    state: "unavailable",
    adapter: "applescript",
    limitation:
      "Restoration beyond open to-dos returning to Inbox is under investigation. The public whole-library empty Trash command is distinct from per-item permanent deletion.",
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
      "This build exposes local stdio only. No public HTTP listener is started.",
  },
] as const;
