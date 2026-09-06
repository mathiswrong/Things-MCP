# Connection architecture

Things MCP uses the existing clients' extension and plugin interfaces. There is no companion app, custom setup window, or menu-bar application.

## Local extension

The MCPB package bundles the server, fixed Things automation script, and required notices. The host supplies Node.js. Native extension settings provide separate local and remote write grants. The host starts the local server with its trusted configuration; MCP calls cannot grant permission.

All clients for the same Things library share a state directory, filesystem lease, request journal, revision checks, and read-back verification. Every mutation rechecks its grant. Global revocation disables all grants and survives restarting unchanged native settings. Deliberately switching the relevant control off and saving, then on and saving, grants access again.

## Remote connection

The optional provider tunnel connects a registered account plugin to the same Mac-side server. The desktop plugin package references that account connector; it does not install a second transport. Account-specific IDs and credentials remain outside source control.

A user LaunchAgent supervises the official tunnel client. A restricted runtime credential lives in the login Keychain and is removed from the MCP child's environment. A named owner-only executable launcher makes macOS register the background item as **Things MCP**. It immediately replaces itself with the existing runtime through `exec`, without an app bundle or additional long-running shell. Apple's [service management guidance](https://developer.apple.com/documentation/servicemanagement/updating-helper-executables-from-earlier-versions-of-macos) documents executable-name fallback for legacy agents.

The Mac must be awake, online, and signed in. The transport exposes no public listening port. Stopping disables future automatic startup; reinstalling enables it. Neither action deletes Things data or the shared request journal.

## Installation scope

The packaged local route needs no configuration editing, commands, or separate runtime installation. A new Mac's ChatGPT tunnel still requires operator provisioning. The initial public package must not be described as a one-click browser setup or as supporting every Things operation.

See [installation](packaging/INSTALL.md), [ChatGPT setup](docs/CHATGPT.md), [other MCP clients](docs/OTHER-CLIENTS.md), and [verification](VERIFICATION.md). SDK smoke tests, native client installation, actual conversational tool calls, and system lifecycle checks are distinct evidence; one does not establish the others.
