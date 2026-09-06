---
title: "Setup and Diagnostics"
topics: [setup, diagnostics, client-connections]
sources:
  - id: install
    type: file
    path: packaging/INSTALL.md
  - id: cli
    type: file
    path: src/cli.ts
  - id: tunnel
    type: file
    path: scripts/tunnel.mjs
  - id: verification
    type: file
    path: VERIFICATION.md
---

# Setup and Diagnostics

Install the local extension through the client's native installer. Browser access uses a separately installed account tunnel. These are two deployment paths for the same service; neither requires a companion app [@install].

1. Keep Things running, install the MCPB package and begin with read-only access. Enable the relevant ordinary-write setting deliberately; Trash and container deletion have separate controls [@install].
2. Ask for health and capabilities. For a source checkout, `npm start -- doctor` checks the native connection without enabling writes [@cli].
3. Provision optional remote access using the public setup guide. After updates, install the new local runtime and reinstall the existing tunnel. `npm run tunnel -- status` checks readiness [@tunnel].
4. Refresh stale client catalogues and use a new conversation. Test only a labeled synthetic item when authorized; read it back before continuing [@install] [@verification].

Uninstalling the local extension does not stop the separate tunnel. Revoke remote writes and stop that connection separately. Neither uninstall route deletes Things data [@install]. See [Client Connections](../architecture/client-connections.md).
