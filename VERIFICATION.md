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

These results cover to-dos only. They do not verify project, area, or tag writes, dates across DST transitions, headings, checklists, deletion, or full application coverage. The automatic suite continues to use synthetic adapters and cannot perform these live writes.
# Installation package checkpoint

On September 5, 2026, the read-only MCPB preview passed official manifest validation, archive creation and extraction, checksum verification, launch from a path containing spaces, eight-tool discovery, capability reporting, and two consecutive connect/close cycles. With ordinary writes enabled only in an isolated synthetic settings directory, the package still rejected creation and left those settings unchanged. Live health passed through the extracted package without reading task contents or making native changes.

The synthetic suite now has 29 passing tests, including a new service-level check that creation, editing, and scheduling remain denied through a restricted connection as shared permissions change. Typecheck, lint, and bundle build pass. Actual host installation, Automation consent identity, and user acceptance remain unverified. Browser transport and the client-owned write control remain unfinished.


# Connected installation verification

On September 5, 2026, the native desktop extension installed through the client's extension installer. Its Configure screen showed separate local and browser write switches, both off, and all eight tools. An actual conversation called `things_health` after one-time tool approval and reported Things 3.23.3 running with writes disabled. No new Automation consent prompt appeared, so a fresh-account consent flow remains untested.

The owner's private tunnel and account plugin were provisioned through the provider's existing settings. An ordinary ChatGPT browser conversation called `things_health` successfully. After stopping and reinstalling the background service, a second call confirmed reconnection with writes still disabled. Tool request and response details were inspected in the clients. These checks read health only and made no native mutations.

The personal desktop plugin passed the host's plugin validator and installed through its supported plugin CLI. Its manifest references the same connected account app. A separate tool call from that desktop host has not been verified; browser success is not presented as a desktop conversation test.

The updated suite has 30 passing synthetic tests. Client grants are isolated, ordinary writes remain denied without a grant, global revocation affects an already-open service, unchanged settings cannot regrant permission after restart, and a deliberate off/on configuration change grants again. Package smoke checks resolve native settings using the official manifest library, reject invalid configuration before any permission file is written, discover eight tools, deny mutations with isolated legacy writes enabled, and reconnect twice. Live extracted-package health, typecheck, lint, bundle build, standard stdio smoke, official archive validation, and the full dependency audit pass. The audit reports zero vulnerabilities.

The background LaunchAgent passed plist validation. Stop reported unhealthy and not ready; reinstall reported healthy and ready. Stop disables startup at future logins, while reinstall enables it. The service uses a stable supported runtime path and loads the restricted runtime credential from the login Keychain without printing it or passing it to the MCP child. All normal write grants remained disabled throughout this session.

Still unverified: a real logout/login or sleep/wake cycle, a fresh Mac's consent prompts, native UI write-toggle changes against the real library, account disconnect/reconnect and uninstall after enabling writes, and the other desktop host's conversation flow. Another Mac still needs operator provisioning; there is no distributed self-service installer. Remaining unsupported Things operations are unchanged.

# Background item name

On September 5, 2026, macOS background-task diagnostics identified the existing tunnel LaunchAgent as `node`. After installing a named executable launcher, the same agent was recorded as `Things MCP`, enabled and allowed. The LaunchAgent plist and launcher shell syntax passed validation, and the tunnel returned healthy and ready. The launcher uses `exec` to run the existing runtime, preserving signal handling without an extra long-running shell, an app bundle, or a runtime copy. Lint passed. This verifies the current system registration; previously delivered notification text is not rewritten.
