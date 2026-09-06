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

# Normal-use authorization and release preparation

Later on September 5, 2026, the library owner requested normal write access. Both native extension switches were enabled and saved. Their shared settings were checked as enabled, while the legacy unscoped grant remained disabled. This supersedes the earlier verification-only restriction for these two client connections.

An ordinary browser conversation checked `writesEnabled: true`, created exactly one labeled synthetic to-do, and read back its returned ID. A separate direct read through supported Things automation confirmed the expected title, notes, and open status. A second request read that same item, completed it using its current revision, and read it back. An independent native read confirmed completion. No existing user tasks were edited. Both packaged client grants remained enabled after reinstalling the remote runtime and reconnecting the tunnel.

The 30-test suite, typecheck, lint, runtime build, packaged extraction and live health checks, and dependency audit passed. Documentation links were checked locally. The installed archive passed credential, attribution-signature, and personal-configuration scans. A maintained secret scanner found no leaks in all reachable history. A separate history review found no generation-credit signatures or automated co-author trailers. The only path-pattern match was an intentionally synthetic path in a privacy test. Compatibility names and required dependency notices are retained.

The new installation, capability, troubleshooting, other-client, remote setup, and release guides describe the actual supported scope. The sponsor configuration uses the existing Buy Me a Coffee username. License choice, public visibility, and release publication remain separate pending decisions. No claim is made that all Things operations or command-free browser provisioning on a new Mac are complete.


## Expanded supported-interface coverage, September 5, 2026

The expanded build exposes ten tools. Local type checking, lint, 37 synthetic tests, runtime build, MCPB packaging, packaged extension restart/permission checks, live read-only smoke, and the production dependency audit passed. The runtime adds no dependency and no Apple Shortcuts bridge.

Ten successful single-item mutations were verified against Things 3.23.3: create a synthetic to-do; move it to Someday, Today, Anytime and Inbox; create a synthetic project; move the to-do into that project; detach the project; move the to-do to Trash; complete the empty project. List and parent queries returned the expected fixture after the relevant moves. The to-do remains in Trash and the empty synthetic project is completed. Private fixture IDs and receipts remain outside the repository.

The first list-move attempt failed with a native type-conversion error. Read-back confirmed the item remained in Inbox, and the uncertain request was not replayed. The fixed AppleScript command file then passed the list moves. A subsequent search timed out because full item serialization preceded text filtering. Bulk filter fields now narrow candidates before full serialization, and the previously failing query passed.

Client writes were temporarily revoked during these checks and the previously enabled grants were restored afterward. Both new Trash grants remain disabled. Trash permissions use a separate owner-only state file so older installed clients can continue reading their existing settings.

Area moves, project moves between built-in lists, Logbook moves, and populated-project cascades have not been live verified. No permanent deletion, container deletion, recurrence, heading mutation, or checklist mutation was performed. Revisions cover the public fields returned by the adapter, not hidden checklist or repeat-template content.

The updated native extension was installed through the host's package installer. Its Configure screen listed five read tools and five write/delete tools, including move and Trash, plus four permission switches. Existing ordinary-write settings were restored; Trash remained off. The remote runtime was updated and its background connection returned healthy and ready after restart. One initial installer bootstrap failed; a direct retry succeeded.

A fresh browser Work conversation called health and capabilities without reading task content. Ordinary writes were enabled and Trash was disabled. It reported move and Trash as implemented but not callable because the saved account tool catalog still contained eight tools. The connection's visible management screen did not offer Refresh. The expanded ChatGPT tool catalog remains an unresolved client acceptance check, not a completed verification.

The updated source and reachable commit messages contained no generation-credit signatures, automated co-author trailers, private fixture IDs, or owner-specific paths. The maintained secret scanner reported no leaks in ten reachable commits. Functional compatibility names and third-party legal notices remain.

## Refreshed account catalog and desktop verification

On September 5, 2026, reloading the plugin directory refreshed stale account state and restored the Refresh control in the personal plugin management screen. Refresh discovered all ten tools, including move and Trash, and the updated list/parent search schema. No replacement account connection was needed. This resolves the earlier missing-control and eight-tool-catalog findings.

A fresh ordinary browser Chat called health and capabilities and confirmed that both new tools were callable. The desktop plugin also successfully called health and capabilities from its actual conversation tools. Both reported Things 3.23.3 running, ordinary writes enabled, and Trash disabled. These checks did not retrieve task contents or change tasks. Existing conversations may retain old descriptors and should be replaced with a new conversation after refresh.

The fresh browser Chat then invoked both newly exposed tools using a deliberately nonexistent synthetic identifier. Move returned `ITEM_NOT_FOUND`; Trash returned `TRASH_DISABLED`. The client presented a one-time approval for the Trash call, its exact arguments were reviewed, and no blanket permission was granted. Neither request created a mutation journal record or changed an item.

The tunnel installer now retries macOS bootstrap error 5 at most four times after the initial attempt, with bounded delays totaling 2.5 seconds. Other errors still fail immediately. A real reinstall completed successfully; transport health and readiness were true and a subsequent desktop plugin health call succeeded. Lint passed. The transient failure itself was not reproduced in this verification.
