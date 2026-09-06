export const capabilities = [
  {
    operation: "health",
    state: "implemented",
    adapter: "applescript",
    validation: "live_read_verified_3.23.3",
  },
  {
    operation: "find_items",
    state: "implemented",
    adapter: "applescript",
    limitation:
      "Built-in list and project/area filters supported. Trash excluded by default. Bounded scan of 5000 objects; pagination is not a snapshot.",
  },
  { operation: "get_item", state: "implemented", adapter: "applescript" },
  {
    operation: "create_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_live_write_verified_3.23.3",
    limitation:
      "Local write permission required. To-do and project creation verified; area and tag creation remain unverified.",
  },
  {
    operation: "update_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_live_write_verified_3.23.3",
    limitation:
      "To-do title, notes, status and deadline set/clear verified. Other item types remain unverified. Read revision required.",
  },
  {
    operation: "schedule_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_live_write_verified_3.23.3",
    limitation:
      "To-do calendar-date scheduling verified; projects remain unverified. Clearing, Evening and reminders are not implemented.",
  },
  {
    operation: "move_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_lists_project_and_detach_live_verified_3.23.3",
    limitation:
      "Inbox, Today, Anytime, Someday, project placement and project detachment verified. Area placement and Logbook moves remain experimental. No headings, reordering, or Trash restoration.",
  },
  {
    operation: "trash_item",
    state: "implemented",
    adapter: "applescript",
    validation: "single_todo_live_write_verified_3.23.3",
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
