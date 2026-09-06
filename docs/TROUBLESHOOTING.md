# Troubleshooting

Start with: **Use Things MCP to check the connection without reading or changing tasks.** The result reports whether Things is running and whether this connection can write.

| Symptom | What to do |
|---|---|
| The package opens in the wrong application | In Claude Desktop, use Settings > Extensions > Advanced settings > Install extension and select the `.mcpb` file. |
| The tools do not appear | Check that Things MCP is enabled in extension settings. Start a new conversation and select the extension or plugin. If only some tools load after an update, disable and re-enable this extension, then start a new conversation. |
| `APP_UNAVAILABLE` | Open Things on the Mac running the bridge. Remote clients also need that Mac awake and online. |
| `AUTOMATION_DENIED` | Open macOS System Settings > Privacy & Security > Automation and allow the requesting host or runtime to control Things. The process name depends on how you installed it. |
| `READ_ONLY` | In Things MCP's native extension settings, turn on the appropriate Allow changes switch and Save. Local and remote grants are separate. Then request a fresh health check. |
| A switch is on but health still reports read-only | Save and wait for the host to apply the configuration. If access was globally revoked, switch it off, Save, switch it on, and Save again. |
| `STALE_ITEM` | Read the item again and review the intended edit. It changed after the previous read. |
| `URL_AUTH_REQUIRED` | Save the Things URL token in login Keychain using [URL setup](URL-OPERATIONS.md). Never paste it into a conversation. |
| `url_dispatched` | macOS accepted the URL for delivery; this is not verified completion. Inspect Things before another change. Reuse the same request ID only to retrieve its saved receipt. |
| `BUSY` | Another operation is running. Retry the same request later. |
| `OUTCOME_UNKNOWN` or `VERIFICATION_FAILED` | Inspect the affected item and its request receipt before making another change. Do not blindly recreate it or use a new request ID. |
| `STATE_FAILURE` or `UNSAFE_STATE` | Stop making writes. Report the error code without including your journal. Do not delete or move the state folder as a workaround. |
| ChatGPT cannot reach the Mac | Check the plugin connection, workspace association, Mac availability, and whether Things MCP is allowed under Login Items. See the tunnel diagnostics in the ChatGPT guide. |
| An expected Things feature is missing | Check the capability reference. Not every Things action has a supported tool. |

## Restart and update

Use the host's extension enable/disable control to restart the local connection. This preserves Things data and receipts. When updating, download the new release package and use the same extension installer. Recheck your permission switches and run a health check before editing tasks.

Remote runtime updates are separate from updating the local extension. The ChatGPT guide explains how an operator installs the new runtime and reconnects the background service.

## Reporting a problem

Include your macOS version, Things version, client version, Things MCP version, connection type, and the error code. Give a small example using invented task text. Avoid screenshots of your library, full logs, account credentials, request journals, and database files. A private security report is appropriate when an issue could expose or modify data without permission; see SECURITY.md.
