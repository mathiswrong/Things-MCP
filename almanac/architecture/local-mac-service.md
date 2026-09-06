---
title: "Local Mac Service"
topics: [architecture, local-service, mcp]
sources:
  - id: cli
    type: file
    path: src/cli.ts
  - id: state
    type: file
    path: src/state.ts
  - id: tunnel
    type: file
    path: scripts/tunnel.mjs
---

# Local Mac Service

Each client can launch a stdio server process. The processes coordinate through shared local state and a filesystem lease; there is no separate socket daemon or private task database [@cli] [@state]. The default state directory is the current user's `Library/Application Support/Things MCP` [@cli].

## Shared ownership

Every process uses the same request journal and permission files for one library. State must be owner-controlled, non-symlinked and restrictively permissioned. Writes use temporary files, synchronization and atomic rename; the lease is checked before durable completion [@state]. Pointing clients at different state directories would break cross-client replay and serialization.

## Background connection

Only optional remote access needs a user LaunchAgent. Its named Things MCP executable starts the tunnel runner, which launches the same installed stdio implementation. Stop disables automatic startup; reinstall re-enables it. The service runs in the user's session, not as root [@tunnel]. See [Client Connections](client-connections.md) and [Mutation Reconciliation](mutation-reconciliation.md).
