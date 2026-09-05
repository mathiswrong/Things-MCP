# Native verification

On 5 September 2026, Things 3.23.3 on macOS in America/Vancouver passed ten sequential writes to one newly created synthetic to-do. The library owner explicitly authorized small single-item checks in the real library. Existing tasks were not modified.

| Step | Verified result |
|---|---|
| Create | Returned stable ID; title and notes matched on read-back |
| Edit title | Unicode title matched |
| Edit notes | Multiline Unicode, quotes, and shell-like literal text matched |
| Set deadline | Calendar date matched |
| Clear deadline | Deadline read back as null |
| Schedule | Activation date matched the requested calendar date |
| Complete | Status read back as completed |
| Reopen | Status read back as open |
| Cancel | Status read back as canceled |
| Finish | Status read back as completed |

Each invocation performed one mutation through `ThingsService` and `NativeAdapter`, retaining the normal shared state directory, filesystem lease, durable request journal, revision checks, and read-back verification. Before each edit, the fixture revision had to match the preceding read. Request intents and results were saved in owner-only files outside the repository. No uncertain operation was retried.

Authorization was limited to the trusted local verification process by overriding its state instance's write-permission check. Production service code and local client settings were not changed to grant permission. Normal client access was checked as read-only before and after each mutation. This is a development verification technique, not an MCP permission or a shipped bypass. Local same-user code is already a trusted boundary.

The synthetic fixture remains completed in Things. No global log, trash, delete, or cleanup operation was used. The native adapter needed no changes for these checks.

These results cover to-dos only. They do not verify project, area, or tag writes, dates across DST transitions, remote connections, actual assistant UI flows, headings, checklists, deletion, or full application coverage. The automatic suite continues to use synthetic adapters and cannot perform these live writes.
# Installation package checkpoint

On September 5, 2026, the read-only MCPB preview passed official manifest validation, archive creation and extraction, checksum verification, launch from a path containing spaces, eight-tool discovery, capability reporting, and two consecutive connect/close cycles. With ordinary writes enabled only in an isolated synthetic settings directory, the package still rejected creation and left those settings unchanged. Live health passed through the extracted package without reading task contents or making native changes.

The synthetic suite now has 29 passing tests, including a new service-level check that creation, editing, and scheduling remain denied through a restricted connection as shared permissions change. Typecheck, lint, and bundle build pass. Actual host installation, Automation consent identity, and user acceptance remain unverified. Browser transport and the client-owned write control remain unfinished.
