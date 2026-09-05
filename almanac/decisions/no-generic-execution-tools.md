---
title: "No Generic Execution Tools"
summary: "Things-MCP will expose typed Things tools instead of generic script, SQL, Apple Event, shell, or arbitrary URL execution."
topics: [tool-contract, safety, automation-boundary]
sources:
  - id: plan
    type: file
    path: PLAN.md
---

# No Generic Execution Tools

Things-MCP will not expose generic execution tools through MCP. The planned tool surface uses typed Things operations such as finding items, creating to-dos, updating projects, moving items, changing status, managing checklists, and managing tags, while explicitly rejecting `run_script`, SQL, raw Apple Events, generic shell execution, arbitrary URLs, and caller-selected callback destinations [@plan]. This decision is a safety boundary for [Planned Tool Contract](../reference/planned-tool-contract) and for the broader [Supported Automation Boundary](../concepts/supported-automation-boundary).

## Context

The bridge is meant to let compatible clients operate Things, not run arbitrary commands on the user's Mac. The plan requires task-oriented MCP tools with small enums where appropriate, separate read and mutation operations, runtime validation, stable Things IDs for mutations, request IDs, explicit changed fields, and structured results with verification status [@plan].

Generic execution would cut across those requirements. If a caller could send raw scripts, raw Apple Events, SQL, shell commands, or arbitrary Things URLs, the service could no longer reliably enforce operation-specific permissions, validate field and type combinations, redact secrets, or describe side effects before applying changes [@plan].

## Decision

The MCP surface will consist of typed task-management tools and typed adapter operations, not generic execution primitives [@plan]. Model-provided data must never become executable script source, the Things URL token must be injected inside the adapter, and the server must not accept arbitrary URLs or caller-selected callback destinations [@plan].

Larger edits should use a bounded preview/apply workflow. The preview records the affected IDs, expected current values, intended changes, and cascading effects; apply rejects stale previews instead of trusting a generic confirmation flag or arbitrary execution payload [@plan].

## Consequences

This decision makes authorization and auditing possible. The plan requires separate permissions for read, ordinary write, destructive operations, and local UI, with remote grants defaulting to read-only during setup [@plan]. [Permissions And Authorization](../architecture/permissions-and-authorization) depends on tools being specific enough that each request has a known permission, side effect, and validation path.

The decision also limits escape hatches. Future agents cannot add a broad `run_script` or `open_url` tool to reach unsupported Things behavior faster. Unsupported operations must be routed through the capability audit and returned as limited, unavailable, or unverified when no supported typed path exists [@plan].

The tradeoff is that some advanced local automation remains manual or unimplemented until a safe typed contract exists. That is consistent with the planned mutation contract, which requires affected IDs, Things links, changed fields, warnings, and verification status instead of reporting success because an opaque command executed [@plan].
