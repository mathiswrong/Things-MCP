---
title: "Permissions And Authorization"
summary: "Permissions and authorization define the planned layers that decide who may read, write, delete, or expose Things data through Things-MCP."
topics: [architecture, permissions, security]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Permissions And Authorization

Permissions and authorization are the planned control layers that protect Things data before any MCP request reads, writes, deletes, or exposes task content. This is design documentation, not a description of running code, because the repository currently has no application source and `PLAN.md` states that the server is proposed and untested [@plan]. The planned model combines local Mac enforcement, remote read-only defaults, operation-specific grants, trusted approvals for destructive actions, OAuth for public HTTP access, and optional project or area allowlists [@plan].

## Service Boundary

The planned service enforces permissions on the Mac for every request, including direct calls and batches [@plan]. Authentication must precede reading task data, so permission checks are part of both read and write paths rather than a write-only safeguard [@plan]. This connects authorization to the [Task Data Boundary](../concepts/task-data-boundary), because a read can disclose task titles, notes, dates, and project structure even when it changes nothing.

Local service protection starts below the MCP tools. The proposed Mac service runs as the current macOS user, uses a user-owned Unix socket with restrictive directory and socket permissions, and does not run as root [@plan]. Secrets belong in Keychain, settings in restrictive local files, and diagnostics must be redacted [@plan].

## Permission Levels

The planned permission model separates read, ordinary write, destructive operations, and local UI access [@plan]. Remote grants default to read-only during setup, after which the user may enable ordinary writes once [@plan]. Destructive actions such as permanent deletion, emptying Trash, and large cascades require explicit trusted approval bound to the operation [@plan].

An LLM-provided `confirm: true` is not enough for trusted approval [@plan]. Approval must come through the local settings UI or another trusted authorization flow, which keeps conversational text from becoming a permission grant [@plan]. The same boundary supports [No Generic Execution Tools](../decisions/no-generic-execution-tools), because generic script, shell, SQL, raw Apple Event, or arbitrary URL tools would be difficult to authorize safely at a task-operation level.

## Allowlists And Scoped Access

Optional project or area allowlists are planned for restricted grants [@plan]. The allowlist applies to reads, writes, move destinations, and all descendants touched by cascades, and global operations are unavailable to restricted grants [@plan]. This matters for both privacy and safety: a client allowed to manage one work area should not be able to search the full personal library or move tasks into an unauthorized destination.

The project rules require private task data, credentials, machine-specific configuration, private conversation history, screenshots, and disposable builds to stay out of source control [@agents]. They also require synthetic fixtures and portable configuration, so contributors should not need the owner's private task library, credentials, signing identity, telemetry project, or hosted infrastructure to build and test the source [@agents].

## Remote Authorization

Public HTTP access is planned to use MCP-compatible OAuth with protected-resource and authorization-server discovery, PKCE, exact redirect checks, short-lived tokens, audience validation, revocation, and compatible client registration [@plan]. The plan calls for reusing a maintained authorization component instead of implementing cryptography or token issuance from scratch [@plan].

Transport handling is part of authorization. The plan requires Origin and Host validation where applicable, forwarded-header restrictions to the configured proxy, payload and batch-size caps, and request rate limits [@plan]. Stdio should emit protocol messages only, with diagnostics sent to stderr, so protocol traffic does not leak local diagnostic detail into client-visible output [@plan].

## Mutation Interaction

Authorization does not replace mutation reconciliation. The service still needs stable Things IDs, explicit changed fields, request IDs, stale-preview rejection, and read-apply-read verification for writes [@plan]. [Mutation Reconciliation](mutation-reconciliation) covers those write-safety mechanics; this page covers who may request the operation and under what scope.

The planned result is layered defense. A request must be authenticated, authorized for its operation class, scoped to allowed projects or areas when a restricted grant is active, validated against the typed tool contract, executed through a supported adapter, and verified after application before the server reports success [@plan].
