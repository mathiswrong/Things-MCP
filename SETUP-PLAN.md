# Setup through the clients

The owner requires no companion app. There will be no separate Things MCP setup window, settings app, or menu-bar application. The previous custom-window proposal is withdrawn.

The owner must be able to install, connect, choose access, and run a first test through supported client interfaces without editing configuration, entering commands, installing a language runtime, or keeping Terminal open. Both ChatGPT desktop and ordinary browser chats are required from the start. Manual commands remain contributor documentation only.

## Installation routes to verify

- Claude Desktop: package the existing server as an MCPB extension. Use the client's installation dialog and extension settings. Bundle dependencies and verify the host runtime and Automation permission identity. Leave final installation to the owner for the usability test.
- ChatGPT desktop Work: verify the supported local plugin packaging and installation flow in the actual client. Local MCP support does not establish ordinary browser-chat support. Avoid private client APIs and hand-edited configuration.
- ChatGPT browser: verify a supported remote connection with setup in the client's existing interfaces. Secure MCP Tunnel currently documents a tunnel identity, runtime credential, workspace association, and developer-mode access. How to package and manage that background transport without a companion app or manual commands remains unresolved. Do not describe this route as easy or complete until the owner can perform it independently. Do not expose an unauthenticated public endpoint to remove setup steps.

## Permissions and lifecycle

Start read-only. Use trusted client-owned configuration controls to select ordinary write access, preserving enforcement at the service boundary. Define and test how each client's control interacts with shared permission revocation before implementing it. MCP calls cannot grant themselves permission.

Retain a shared state directory, filesystem lease, durable request journal, revision checks, and read-back verification across all connections. A different client package must not create an independent coordination directory for the same Things library.

Report Connected only after the actual client successfully calls a tool. Health checks must not read task contents or create tasks. A separately requested test may create and verify one labeled Inbox item. Installing the package must not enable writes or create test data silently.

Disconnect and uninstall must preserve Things data and unrelated client settings. Keep remote credentials out of source and logs, using the platform's secure credential storage when needed. Background components may be necessary for browser access, but must be managed through supported installation and lifecycle mechanisms without a separate application UI.

## Acceptance

1. Install through supported client controls with no configuration syntax, commands, or runtime installation.
2. Discover all eight tools and run a read-only health check from the actual client.
3. Select ordinary write access through a trusted existing settings surface, then request and verify one Inbox test item.
4. Quit and reopen the client. Confirm reconnect, permission revocation, disconnect, and uninstall.
5. Repeat independently in the other desktop client and in ordinary ChatGPT browser conversations. A desktop-only result is incomplete.

No companion-app artboard approval is pending. Public distribution and license selection still require separate authorization. The packaging and browser-connection work are not complete.

## Sources

- [Desktop extension installation](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [MCPB packaging specification](https://github.com/modelcontextprotocol/mcpb)
- [Local MCP in the desktop app](https://learn.chatgpt.com/docs/extend/mcp)
- [Plugin installation](https://learn.chatgpt.com/docs/plugins)
- [Secure MCP Tunnel requirements](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
