---
title: "Client Connections"
topics: [architecture, clients, mcp]
sources:
  - id: cli
    type: file
    path: src/cli.ts
  - id: package
    type: file
    path: scripts/package-extension.mjs
  - id: tunnel
    type: file
    path: scripts/tunnel.mjs
  - id: setup
    type: file
    path: SETUP-PLAN.md
---

# Client Connections

Local and remote clients reach the same stdio implementation and shared state. The native extension bundles the runtime; the optional account tunnel uses a separately installed runtime. Updating the extension alone does not update that tunnel [@package] [@tunnel].

## Local and remote launch

The extension supplies trusted settings through its launch environment. A managed tunnel process reads the existing browser grant instead of provisioning it on every launch [@cli]. The tunnel credential comes from Keychain and is removed from the child server's environment [@tunnel].

The server has no public HTTP listener or built-in OAuth service. Remote access is supplied by the selected tunnel provider, not by an additional project-operated backend [@cli] [@setup]. The local core remains usable without that provider.

## Updating clients

Use the native extension installer for the local package. Rebuild, install the local runtime and reinstall the existing tunnel for remote updates. Refresh the client tool catalogue and start a new conversation if it retains stale definitions. The Mac must remain available for remote requests [@setup]. See [Setup and Diagnostics](../guides/setup-and-diagnostics.md).
