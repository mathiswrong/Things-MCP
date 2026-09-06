# Operation scope

This is the version 1.0 scope. Availability follows the current code, the installed Things public scripting dictionary and the [documented Things URL commands](https://culturedcode.com/things/support/articles/2803573/). A command appearing in a dictionary is not proof that it executes successfully.

## Implemented native operations

- Read/search to-dos, projects, areas and tags; read selection; count and test existence; filter by parent, built-in list, tags and dates; sort returned results; continue scans beyond 5,000 objects.
- Create to-dos, projects, areas and tags. Set supported initial placement, status, deadlines, tags and timestamps.
- Edit or increment title and notes; complete, cancel or reopen; schedule calendar dates; clear deadlines; set exposed timestamps; assign/remove tags; manage tag hierarchy and shortcuts; collapse/expand areas.
- Move to supported lists or parents and detach parents. To-dos support Inbox, Today, Anytime and Someday. Projects support Today, Someday and areas.
- Move an open to-do to Trash. Restore open to-dos to Inbox and open projects to Today.
- Preview and delete open projects, areas and tag hierarchies with separate permission and scope checks. Area deletion keeps archived projects in Logbook while clearing their area association.
- Show/edit items and open Quick Entry. Navigation receipts acknowledge a command, not a newly created task.

Native mutations verify exposed fields. Project revisions include exposed child snapshots. Things' UI and sync can still change data between reads; this is not a transaction or an automatic undo facility.

## Implemented URL operations

- Create structured projects with initial headings and to-dos, or individual to-dos with checklist rows. Initial checklist rows can carry completion/cancellation state.
- Replace/clear checklist rows, append/prepend checklist text, move a task to an existing heading, set reminders and Evening, or clear When.
- Duplicate a non-repeating task or project, optionally naming the copy.
- Open additional built-in views and search, optionally filtering views by tags.

These use typed fields, the shared permissions and journal, and Keychain authorization where required. Their receipts confirm **dispatch only**. They do not return newly created IDs or verify hidden fields. See [URL operations](URL-OPERATIONS.md).

## Things interface limits

| Operation | Reason it is unavailable |
|---|---|
| Create or edit native repeat rules | No supported public editing mechanism in the selected interfaces. No replacement scheduler is included. |
| Full checklist/heading reads or editing an existing row by stable ID | Not exposed by AppleScript or the documented URL read surface. Apple Shortcuts is excluded from this product. |
| Create a heading independently or edit it in place | Documented heading creation is part of a new project template. |
| Arbitrary native ordering, lossless task/project conversion, general undo | No established supported mechanism; private experimental commands are excluded. |
| Direct Things Cloud account integration | No public account API used here. The installed Things app owns cloud synchronization. |

## Verification limits retained in the server

These are server limitations, not claims that Things' own UI cannot do the operation.

- **Project Anytime membership:** the native command cleared the start date, but its destination collection did not expose the project. Verified native moves/queries remain rejected. URL scheduling is a separately labeled dispatch route.
- **Direct Logbook movement and closed-task deletion:** native commands failed live checks. Complete/cancel and let Things apply its normal logging behavior; the server does not recreate that behavior.
- **Closed-item restoration:** only open to-dos and open projects passed targeted restoration checks.
- **Empty Trash and Log Completed Now:** public commands exist, but affect the whole library. Execution remains disabled because targeted fixtures cannot verify them safely in a nonempty library. Their installer switches are omitted.
- **Trashed project child enumeration:** the selected collections cannot enumerate these children. Known child IDs report inherited Trash membership; restoration recovers the children through Things.
- **Very large collections:** bounded native reads can time out or exceed output limits. Scan continuations are not stable snapshots across external edits.

Printing, window geometry, app quitting and legacy contact commands are outside task management scope. The bridge does not automate these application controls.

## Installation limits

The local MCPB extension uses native host installation and settings. Browser access needs an account-owned private tunnel; first-time setup requires developer commands. Other MCP clients use standard local stdio but their installation flows vary. There is no companion app or project-operated service.

Current verification covers the tested Mac and packaged/runtime processes. Fresh-account consent, every client version, physical sleep/wake and actual logout/login are not certified. The Mac must be awake, online and signed in for remote access. See [Verification](../VERIFICATION.md).
