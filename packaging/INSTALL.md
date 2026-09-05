# Things MCP installation preview

This package lets you test installation and read access in Claude Desktop on macOS. It cannot change tasks, even when another connection has write permission. It is a private local test build, not a public release.

1. Open Things 3 and leave it running.
2. Open the `.mcpb` file with Claude Desktop, then select **Install**. You can also drag the file into **Settings > Extensions**.
3. Start a new conversation and ask: **Use Things MCP to check the connection. Do not read or change any tasks.**
4. If macOS asks whether to allow control of Things, approve it to use the connection.
5. To test reading, ask: **Use Things MCP to show up to five incomplete to-dos without their notes.**

The package uses the client's built-in Node runtime. There are no configuration files to edit, commands to enter, or account credentials to provide. The health result should report `writesEnabled: false`. Eight tools are listed for compatibility, but mutation tools always reject requests in this preview.

Task information requested through the tools is sent to the connected client and its provider. The package has no telemetry destination. It uses the shared Things MCP coordination directory; it does not contain or copy your Things database.

Disconnect or remove the extension through **Settings > Extensions**. Removing it leaves Things data intact. Local coordination receipts remain available for other connections.

Browser access and a client-owned write permission control remain under development. This package does not establish either one. No open-source license has been granted for project code; bundled third-party notices apply only to their named dependencies.
