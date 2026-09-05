---
title: "Local Core With Replaceable Remote Access"
summary: "Things-MCP will keep its core local and account-free while treating tunnel and OAuth routes as replaceable client-connection options."
topics: [local-first, remote-access, client-connections]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Local Core With Replaceable Remote Access

Things-MCP will put the authoritative service on the user's Mac and keep remote access as an optional, replaceable connection layer. The plan calls for one local Mac service, started as the current macOS user, with local stdio, Secure MCP Tunnel, or authenticated HTTPS/OAuth routes connecting clients to the same operations and permissions [@plan]. The project rules add that the core must remain usable without an account or hosted service operated by this project [@agents].

## Context

Things 3 automation runs on the Mac where Things is installed, so the planned bridge needs a local host to reach AppleScript, Shortcuts, and Things URL commands [@plan]. The plan describes a Mac service protected by a user-owned Unix socket and restrictive permissions, with all clients sharing one mutation queue, permission policy, and retry journal [@plan]. This repository has no implemented service yet, so these details are design commitments from the plan rather than current runtime behavior [@plan].

Remote client support still matters. The plan lists local desktop clients, ChatGPT through Secure MCP Tunnel or authenticated public HTTPS, Claude web or mobile through public HTTPS with OAuth, and other MCP hosts through stdio or Streamable HTTP as planned connection routes to verify [@plan]. It also says protocol support does not guarantee every host will support every tool or UI behavior [@plan].

## Decision

The project will build the core as a local Mac service and thin MCP-facing connection adapters around it. Local operation must not require a model API key, a hosted application backend, the owner's credentials, the owner's signing identity, or project-operated infrastructure [@plan] [@agents].

Remote access may be added through replaceable tunnel or HTTPS/OAuth options. The plan permits Secure MCP Tunnel for a personal ChatGPT installation and a maintained HTTPS tunnel or reverse proxy with established OAuth for cross-provider remote access, but provider choice remains an implementation decision after connection proof [@plan]. This keeps [Client Connections](../architecture/client-connections) separate from [Local Mac Service](../architecture/local-mac-service).

## Consequences

This decision gives every client the same local authority boundary. Whether a request arrives through stdio, a tunnel, or public HTTPS, it should reach the same Mac-side permission checks, validation, operation queue, and Things adapters [@plan]. That matters for [Task Data Boundary](../concepts/task-data-boundary), because task titles and notes are private local data until a chosen client or remote route receives them.

The local-first choice also makes host availability an explicit behavior. The plan says the Mac must be awake, online for remote use, and running a usable signed-in macOS session, and it should return `HOST_UNAVAILABLE` rather than silently queueing writes to run hours later [@plan].

The tradeoff is operational complexity for remote use. Remote mode can introduce tunnel or identity-provider accounts, possible fees, authorization checks, revocation, and client compatibility risks [@plan]. The project rules therefore require remote connection options to remain replaceable and forbid making the owner's accounts, telemetry project, signing identity, or infrastructure necessary for ordinary builds and tests [@agents].
