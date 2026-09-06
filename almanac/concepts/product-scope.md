---
title: "Product Scope"
topics: [concepts, product-scope, local-first, release-boundary]
sources:
  - id: rules
    type: file
    path: AGENTS.md
  - id: server
    type: file
    path: src/server.ts
  - id: license
    type: file
    path: LICENSE
---

# Product Scope

Things MCP provides task management through Things' supported Mac automation. The shipped server has twenty tools; it is free software under the MIT license [@server] [@license]. Local operation requires no project-operated account or hosted service [@rules].

## Settled product boundaries

There is no companion app, setup window, menu-bar app or Apple Shortcuts bridge. Installation and permission controls use existing client interfaces. Things itself owns cloud synchronization; the bridge does not collect Things Cloud credentials or write to its database [@rules].

Unsupported repeat-rule editing stays excluded, without a replacement scheduler or substitute workflow. Browser access remains optional and replaceable. These choices keep the core small and constrain future expansion [@rules]. See [Supported Automation Boundary](supported-automation-boundary.md) and [Client Connections](../architecture/client-connections.md).
