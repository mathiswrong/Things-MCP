---
title: "Local Core With Replaceable Remote Access"
topics: [local-first, remote-access, architecture]
sources:
  - id: rules
    type: file
    path: AGENTS.md
  - id: cli
    type: file
    path: src/cli.ts
  - id: tunnel
    type: file
    path: scripts/tunnel.mjs
---

# Local Core With Replaceable Remote Access

The local stdio core works without a project-operated account or hosted service. Remote access is an optional provider boundary and must remain replaceable [@rules] [@cli].

## Implementation consequence

The tunnel runner installs and supervises the selected provider client, retrieves its credential locally and starts the same stdio server. Provider IDs and credentials are local configuration rather than repository content [@tunnel].

No public HTTP listener or custom OAuth issuer is built into the core. Future provider work must preserve the shared permission and request state instead of creating a second independent mutation path [@cli] [@rules]. See [Client Connections](../architecture/client-connections.md).
