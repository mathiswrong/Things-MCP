# Easy setup proposal

Status: design proposal for owner review. No connection is installed or enabled by this proposal.

The owner requires both ChatGPT desktop and ordinary browser chats from the first usable setup. A desktop-only package does not satisfy this milestone.

The setup acceptance test is that the owner can install, connect, choose access, and run a first test without editing configuration, entering a command, installing a language runtime, or keeping Terminal open. The installer must do that work. Manual developer instructions remain contributor documentation only.

## Recommended personal setup

Use a small native Mac setup and settings app, backed by the existing service. One window shows Things availability, the available client connections, the shared permission for task changes, and a connection test. Use native buttons, checkbox, progress, and file handling. Keep the default read-only. Let the owner perform the final client installation and permission approvals while testing onboarding.

Package the existing local server as an MCPB desktop extension for the first local client. Open the bundle in its native installation flow; do not ask the owner to edit JSON. Bundle dependencies and use the supported host runtime. Confirm the runtime version, Automation permission identity, and installation on the actual client before claiming completion. No global installation or account is needed for this route.

For ChatGPT desktop Work, investigate the supported local plugin installation path first. Official documentation establishes local MCP support; the exact plugin import experience and account support still need verification. Do not represent it as ordinary browser-chat support. Use a packaged local plugin or supported registration API; do not hand-edit TOML or depend on automating private client UI.

For ordinary ChatGPT browser chats, the current documented route requires remote access, such as Secure MCP Tunnel. The desktop helper must handle installation, process management, restart, diagnostics, and local secret storage. The documented tunnel flow still requires a tunnel identity, runtime credential, workspace association, and developer-mode access. The proposed first flow opens the official account setup page, accepts the connection ID and API key in ordinary native fields, saves the key to Keychain, and completes local configuration. These are credential inputs, never JSON, shell commands, or an editable configuration file. Clearly explain the account step before the user starts. A seamless browser sign-in that provisions everything has not been established. Do not promise it or expose an unauthenticated public endpoint to simplify setup.

## Window behavior

- At first launch, check Things availability without reading task contents. Missing app, closed app, and denied Automation access each get one specific recovery action.
- Offer each client as a row with Connect or Manage. Report Connected only after a tool call from that client succeeds. A saved configuration or launched app is not proof.
- Offer Allow task changes as one local control. State explicitly that it applies to all bridge connections. Keep lock, journal, permission checks, and revision checks shared.
- Check connection is read-only. A separate Test a to-do action states that it creates one labeled item in Inbox and verifies it. Never create a task during installation without that action.
- Disconnect and uninstall remove only this project's integration and runtime, preserving Things data, unrelated client settings, and request receipts unless the owner explicitly removes them.
- Local operation should use no remote credentials. If the browser route is selected, keep its secrets in Keychain and its helper outside the repository.

## Acceptance

1. Open one installable artifact and complete setup with standard controls.
2. Connect a desktop client without typing paths, commands, or structured configuration.
3. Discover all eight tools and run a read-only health check from the actual client.
4. Choose ordinary write access with a visible local control, then create and verify one Inbox test item.
5. Quit and reopen the client. Confirm it reconnects. Test permission revocation, disconnect, and uninstall.
6. Test the other selected client independently, preserving the same coordination and permission state. Both ChatGPT desktop and ordinary browser conversations must pass; do not mark setup complete based on desktop success alone.

Artifacts are personal test builds until the owner authorizes public distribution, license selection, signing, and release. The attached native artboards show proposed empty and connected states, not live connection results. Only macOS has a setup surface in this milestone; phone and tablet client access is a separate remote-connection requirement.

## Sources

- [Desktop extension installation](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [MCPB packaging specification](https://github.com/modelcontextprotocol/mcpb)
- [Local MCP in the desktop app](https://learn.chatgpt.com/docs/extend/mcp)
- [Plugin installation](https://learn.chatgpt.com/docs/plugins)
- [Secure MCP Tunnel requirements](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)

## Design review

Use `scripts/render-setup-artboards.swift` to render the proposed native controls in Cream and Ink. Output goes to Downloads. The browser setup artboard exposes the current account requirement instead of hiding it behind an unverified sign-in claim. The renderer is a design artifact generator; it cannot install a connection, change permission, read Things, or write a task.
