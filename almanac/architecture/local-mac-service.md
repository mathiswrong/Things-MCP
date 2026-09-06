---
title: "Local Mac Service"
summary: "The local Mac service is the proposed user-session process that owns Things-MCP validation, authorization, adapters, and serialized writes."
topics: [architecture, local-service, mcp]
sources:
  - id: plan
    type: file
    path: PLAN.md
---

# Local Mac Service

The local Mac service is the planned center of the Things-MCP architecture: a small process started at login as the current macOS user, with a thin stdio command for local MCP clients and shared access to Things through supported adapters [@plan]. This page describes intended architecture rather than implemented behavior, because `PLAN.md` says the design is proposed and not an implemented or tested server [@plan]. Its shape matters because every client route is meant to share the same permission policy, mutation queue, retry journal, validation, and adapter execution path instead of each client talking to Things independently [@plan].

## Process Boundary

The service is planned to run as the logged-in macOS user, not as root [@plan]. Its local control surface is a user-owned Unix socket protected by restrictive directory and socket permissions, while a thin stdio adapter exposes the same tools to desktop clients that expect stdio MCP servers [@plan]. That split keeps the MCP transport wrapper separate from the core service logic.

The proposed module layout reinforces that boundary. `domain/` would contain types and validation, `capabilities/` the operation registry, `adapters/` Things access, `service/` authorization and execution, `mcp/` transport wrappers, `cli/` setup and diagnostics, `shortcuts/` reviewed workflows, and `tests/` fixtures and compatibility scenarios [@plan]. No such application source exists yet, so these names are design anchors for future implementation rather than current directories [@plan].

## Shared Execution Path

All clients are planned to converge on the same Mac service. Local clients call through stdio, ChatGPT may use a Secure MCP Tunnel to the local stdio adapter, and public remote clients may use HTTPS with OAuth, but the request eventually reaches the same permission, validation, and execution layer before touching Things [@plan]. [Client Connections](client-connections) describes those routes; this page describes what they share once a request reaches the Mac.

Writes are serialized across connected clients through one mutation queue [@plan]. The service also persists a small local operation journal that records request fingerprints, status, and resulting IDs, rejects a reused request ID with different arguments, and returns `OUTCOME_UNKNOWN` when a timed-out create may already have committed [@plan]. The details belong with [Mutation Reconciliation](mutation-reconciliation), but the local service owns the invariant that retries cannot bypass the shared write path.

## Adapter Ownership

The Mac service owns the planned adapters to Things. AppleScript handles public object access and faithful operations, Shortcuts fills coverage gaps through reviewed versioned workflows, and typed Things URL commands cover documented URL capabilities such as project construction and heading placement [@plan]. Those adapters are intentionally replaceable behind the service boundary, which supports the decision captured in [Local Core With Replaceable Remote Access](../decisions/local-core-with-replaceable-remote-access).

The service must not embed a model, require model API keys for the core server, or build a second task-management database [@plan]. It is a local integration layer over Things automation, not a hosted task store or model runtime.

## Host Availability

Remote access does not remove the Mac as the host. The plan requires the Mac to be awake, online for remote use, and running a usable signed-in macOS session; screen lock, sleep/wake, and restart are explicit acceptance cases [@plan]. When the host is unavailable, the service should return `HOST_UNAVAILABLE` instead of silently queuing writes to run hours later [@plan].

This behavior is part of the service's safety model. If a write cannot execute under current local conditions, the client receives an availability result rather than a promise that may later mutate the user's task library out of context [@plan].
