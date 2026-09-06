---
title: "Getting Started"
topics: [orientation, product-scope, capability-audit]
sources:
  - id: package
    type: file
    path: package.json
  - id: server
    type: file
    path: src/server.ts
  - id: verification
    type: file
    path: VERIFICATION.md
---

# Getting Started

Things MCP is a released, MIT-licensed local server for Things 3 on macOS. It exposes twenty task-oriented MCP tools through standard input/output; the optional browser connection reaches that same implementation through a private tunnel. The package version is authoritative for the current distribution [@package] [@server].

## Read by task

- For supported actions and limits, read [Capability Inventory](reference/capability-inventory.md) and [Known Capability Limits](reference/known-capability-limits.md).
- For requests, receipts and project descendants, read [Tool Contract](reference/planned-tool-contract.md) and [Mutation Reconciliation](architecture/mutation-reconciliation.md).
- For process ownership, read [Local Mac Service](architecture/local-mac-service.md), [Client Connections](architecture/client-connections.md) and [Permissions](architecture/permissions-and-authorization.md).
- For installation or publication, read [Setup and Diagnostics](guides/setup-and-diagnostics.md) and [Release Readiness](guides/release-readiness.md).

## Evidence boundaries

The release record separates automated tests, native fixture observations, installed client checks and unverified environments. A passing synthetic suite does not certify a fresh Mac, every client, sleep/wake or every inherited Things effect [@verification]. Current code takes precedence over wiki descriptions.
