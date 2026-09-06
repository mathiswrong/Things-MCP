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
      "Built-in list and project/area filters supported. Project Inbox/Anytime queries and project parents for projects are rejected. Trash excluded by default. Bounded scan of 5000 objects; pagination is not a snapshot.",
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
      "To-do and empty-project title, notes, status and deadline set/clear verified; area and tag renaming verified. Populated-project cascades are unverified. Read revision required.",
  },
  {
    operation: "schedule_item",
    state: "implemented",
    adapter: "applescript",
    validation: "native_write_verified_3.23.4",
    limitation:
      "To-do and empty-project calendar-date scheduling verified. Clearing, Evening and reminders are not implemented.",
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
      "Requires separate per-connection Trash permission plus ordinary writes. Moves one to-do and its checklist to Trash. No container deletion, permanent deletion, or restore.",
  },
  {
    operation: "request_status",
    state: "implemented",
    adapter: "local_journal",
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
    operation: "duplicate_tags_history",
    state: "unavailable",
    adapter: "applescript",
    limitation: "Public routes identified; implementation pending.",
  },
  {
    operation: "container_delete_permanent_delete_restore",
    state: "unavailable",
    adapter: "applescript",
    limitation:
      "Cascades and permanent area deletion require explicit safety controls.",
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
