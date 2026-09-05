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
    limitation: "Bounded scan of 5000 objects; pagination is not a snapshot.",
  },
  { operation: "get_item", state: "implemented", adapter: "applescript" },
  {
    operation: "create_item",
    state: "implemented",
    adapter: "applescript",
    validation: "todo_live_write_verified_3.23.3",
    limitation:
      "Local write permission required. Project, area and tag creation remain unverified.",
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
    operation: "request_status",
    state: "implemented",
    adapter: "local_journal",
  },
  {
    operation: "headings",
    state: "unavailable",
    adapter: "shortcuts",
    limitation:
      "A reviewed, installed Shortcuts bridge is required; not included yet.",
  },
  {
    operation: "checklists",
    state: "unavailable",
    adapter: "shortcuts",
    limitation:
      "Lossless checklist round trips must be proven before enabling writes.",
  },
  {
    operation: "move_duplicate_tags_history",
    state: "unavailable",
    adapter: "applescript",
    limitation: "Public routes identified; implementation pending.",
  },
  {
    operation: "trash_delete_restore",
    state: "unavailable",
    adapter: "applescript",
    limitation:
      "Cascades and permanent area deletion require explicit safety controls.",
  },
  {
    operation: "repeat_rules",
    state: "unavailable",
    limitation: "No supported public editing interface established.",
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
