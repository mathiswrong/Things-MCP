# Setup through existing clients

There is no companion app, custom setup window, or menu-bar application. Local installation uses a standard MCPB package and native extension settings. Browser access uses the provider's secure MCP tunnel and the same registered connector used by the desktop plugin.

## Owner installation

The owner's account now has a private tunnel associated with its workspace, a connected ChatGPT plugin, and an installed personal desktop plugin. An ordinary browser conversation successfully called `things_health`, reporting Things running and writes disabled. No task contents were read by that check.

The macOS background connection uses the official tunnel client, supervised by a user LaunchAgent. Its runtime credential has only tunnel Read and Use permissions and lives in the login Keychain. The launcher obtains it at startup, removes it from the MCP child's environment, and opens no public listening port. The Mac must be awake, online, and logged in with Things available. Stop and reinstall have been checked; an actual logout/login cycle remains untested.

The local extension provides two native switches, both initially off: **Allow changes** for the local connection and **Allow changes from ChatGPT** for the shared remote connector. The latter applies to desktop and browser use of that connector. Save restarts the local server and applies the selected grants. These are trusted local settings, not MCP tools.

All connections share the same state directory, filesystem lease, request journal, revision checks, and read-back verification. Every mutation rechecks its connection's grant. Global revocation turns every grant off and survives a restart with unchanged native settings. Reauthorization requires turning the relevant native switch off and saving, then on and saving. Installing or reconnecting never creates test data.

## Scope of completion

The owner can select the connected Things MCP plugin in ChatGPT and test it without editing configuration or keeping Terminal open. The local extension package contains its dependencies and uses the host's runtime. The desktop plugin references the registered account connector instead of installing a second transport.

First-time provisioning on another Mac is still an operator workflow: install the provider transport, create the tunnel and restricted runtime key in its existing settings, store the key in Keychain, install the local runtime and background service, then create and connect the plugin. That workflow is documented for maintainers; it is not yet a distributed, self-service installer. No public distribution or license grant is authorized.

The native package installer and client tool calls require separate verification. A standard MCP client smoke test cannot establish that every desktop application's conversation flow works. Verification records distinguish these results in `VERIFICATION.md`.

## Maintainer lifecycle

After `npm run build` and `npm run install:local`, store the restricted runtime key as a generic password in the login Keychain with service `Things MCP Tunnel` and account `runtime`. Never pass the key on a command line or place it in a source file.

Run `npm run tunnel -- install <tunnel-id>` to configure the provider profile and install the LaunchAgent. The tunnel ID is nonsecret but machine-specific and stays outside source control. `npm run tunnel -- status` reports health and readiness without reading task contents. `npm run tunnel -- stop` disables automatic startup and stops the connection while preserving Things data and the remote tunnel. Reinstall re-enables startup. Removing an account plugin does not remove local data or the background service.

Generate the desktop package with `npm run package:plugin -- <registered-app-id>`. Output stays outside the repository. Install it through the host's supported personal plugin workflow. Registered IDs and marketplace configuration belong to the owner installation, not the source distribution.

## References

- [Native extension installation](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [MCPB specification](https://github.com/modelcontextprotocol/mcpb)
- [Plugins](https://developers.openai.com/plugins/build/plugins)
- [Secure MCP tunnels](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
- [Official tunnel client](https://github.com/openai/tunnel-client)
