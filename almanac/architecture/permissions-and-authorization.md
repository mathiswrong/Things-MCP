---
title: "Permissions and Authorization"
topics: [architecture, permissions, security]
sources:
  - id: cli
    type: file
    path: src/cli.ts
  - id: state
    type: file
    path: src/state.ts
  - id: service
    type: file
    path: src/service.ts
  - id: scope
    type: file
    path: docs/FULL-SCOPE.md
---

# Permissions and Authorization

New installations default to read-only. Normal writes, individual to-do Trash and container deletion have separate per-connection grants. The service checks those grants before native or URL mutation work; tool text cannot grant itself access [@cli] [@state] [@service].

## Grant and operation boundaries

Trusted extension settings configure local and browser permissions independently. `--managed-client` uses an existing grant. Global revocation persists across unchanged settings; a deliberate off/save/on/save cycle can authorize the connection again [@cli] [@state].

Container deletion additionally needs a fresh scope preview and its revision. Native execution gates remain independent of grants: enabling a setting cannot make an unverified operation available. Empty Trash and Log Completed remain disabled [@service] [@scope]. Navigation uses ordinary write permission because it changes the Mac's view [@service].

## Trust boundary

The server does not implement project/area read allowlists or separate public HTTP authentication. A connected read-only client can request library data through exposed read tools. The trusted boundary includes processes running as the same macOS user [@cli] [@state]. See [Task Data Boundary](../concepts/task-data-boundary.md) and [Client Connections](client-connections.md).
