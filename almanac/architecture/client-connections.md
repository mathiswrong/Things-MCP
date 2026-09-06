---
title: "Client Connections"
summary: "Client connections describe the planned routes by which local and remote MCP clients reach the same Things-MCP Mac service."
topics: [architecture, clients, mcp]
sources:
  - id: plan
    type: file
    path: PLAN.md
---

# Client Connections

Client connections are the planned MCP routes from desktop, tunnel, HTTPS, and other MCP hosts into the same local Things-MCP service. The repository does not yet contain an implemented or tested server, so these routes are a proposed connection design and acceptance target, not current runtime behavior [@plan]. The important architectural point is that clients differ at the transport edge, while tool definitions, permissions, validation, mutation ordering, and Things adapter execution are intended to remain shared inside the [Local Mac Service](local-mac-service) [@plan].

## Local Stdio

Local desktop clients are planned to connect through a thin stdio adapter [@plan]. The stdio process exposes MCP tools while forwarding work to the user-session Mac service, so local clients do not each own separate Things state, permission rules, or retry behavior [@plan].

The plan names Claude Desktop as the first local acceptance target and expects packaging as a desktop extension [@plan]. Other local MCP hosts may use stdio or Streamable HTTP, but each host still needs real compatibility testing because protocol support does not guarantee that every tool, annotation, or UI behavior works the same way [@plan].

## Secure Tunnel

ChatGPT is planned to use either Secure MCP Tunnel to the local stdio adapter or authenticated public HTTPS [@plan]. The preferred personal route in the plan is the tunnel, but developer-mode access, account eligibility, tunnel provisioning, credentials, revocation, and actual read/write behavior remain early verification work [@plan].

This route is optional. The plan explicitly keeps other clients independent of the OpenAI-specific connection path, which protects the local core from depending on one hosted provider [@plan].

## Public HTTPS And OAuth

For cross-provider remote access, the planned route is a maintained HTTPS tunnel or reverse proxy plus an established OAuth implementation [@plan]. Only the MCP route and necessary authorization metadata should be forwarded, while local administration stays private [@plan]. The plan rejects router port forwarding, custom relay protocols, and publicly accessible unauthenticated MCP endpoints [@plan].

Public HTTP access also brings protocol-level authorization requirements. The plan calls for MCP-compatible OAuth with protected-resource and authorization-server discovery, PKCE, exact redirect checks, short-lived tokens, audience validation, revocation, and compatible client registration [@plan]. These requirements connect client routing directly to [Permissions And Authorization](permissions-and-authorization).

## Client Limits

A model alone does not connect to the Mac; it needs an MCP-capable application or agent [@plan]. Remote connectors also depend on the Mac being awake, online, and running a usable signed-in macOS session, because the planned service still executes on that Mac [@plan]. If the Mac is unavailable, the intended response is `HOST_UNAVAILABLE`, not delayed background mutation [@plan].

Setup and troubleshooting for these routes are planned as product features. The repository plan includes future `things-mcp setup`, `doctor`, `status`, `connect`, and `uninstall` commands with generated client configuration and readable errors, which are covered by [Setup And Diagnostics](../guides/setup-and-diagnostics) [@plan].
