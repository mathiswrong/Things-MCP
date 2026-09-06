---
title: "No Generic Execution Tools"
topics: [tool-contract, safety, automation-boundary]
sources:
  - id: server
    type: file
    path: src/server.ts
  - id: domain
    type: file
    path: src/domain.ts
  - id: urls
    type: file
    path: src/url-domain.ts
  - id: rules
    type: file
    path: AGENTS.md
---

# No Generic Execution Tools

The MCP surface exposes typed task operations rather than scripts, SQL, raw Apple Events, arbitrary URLs or shell commands. This keeps validation and authorization tied to an explicit action and target [@server] [@domain] [@urls].

## Enforcement

Fixed adapters own executable code. Caller-provided titles, notes and identifiers stay data; they do not become source. A future feature must extend a bounded task schema and preserve supported-interface restrictions rather than adding a generic escape hatch [@rules].

See [Tool Contract](../reference/planned-tool-contract.md) and [Things Adapters](../architecture/things-adapters.md).
