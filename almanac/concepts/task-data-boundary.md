---
title: "Task Data Boundary"
summary: "The task data boundary defines what Things-MCP may read, store, log, transmit, and test when handling private Things task content."
topics: [privacy, security, tasks]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Task Data Boundary

The task data boundary is the privacy and safety line around Things task contents, credentials, diagnostics, fixtures, logs, and cloud-connected clients. In the current repository it is a planned product constraint, not implemented runtime behavior: `PLAN.md` states that the design is proposed and not an implemented or tested server, and no application source exists yet [@plan]. The boundary matters because the proposed service would expose a personal Things library to MCP clients while still keeping task titles, notes, secrets, local diagnostics, and test data under user control [@plan].

## What Counts As Task Data

Task data includes the contents of the Things library that a client can read or mutate. The plan names task titles, notes, project and area membership, descendants affected by cascades, checklist rows, tags, dates, reminders, logged items, and operation before-images as data the service may need to handle [@plan]. These values can contain private personal information, so the system design treats them differently from structural metadata such as tool names, capability status, or adapter availability [@plan].

The project rules extend the boundary beyond the Things library. Personal task data, credentials, machine-specific configuration, private conversation history, screenshots, and disposable builds must stay out of source control, and public-release preparation must scan staged changes and repository history for secrets and personal data [@agents]. Tests must use synthetic fixtures and, for destructive integration coverage, a disposable Things library rather than the owner's personal task library [@plan].

## Credentials And Local Secrets

The proposed URL adapter keeps the Things URL authorization token in Keychain and injects it inside the adapter, which keeps callers from supplying raw tokens or arbitrary URLs [@plan]. Diagnostics must redact that token, and the project rules forbid collecting Things Cloud credentials or requiring the owner's private credentials to build and test the source [@plan] [@agents].

This boundary also shapes future public work. The core must remain usable without an account or hosted service operated by this project, and remote providers must be replaceable rather than baked into the local task-management core [@agents]. That rule connects this concept to [Local Core With Replaceable Remote Access](../decisions/local-core-with-replaceable-remote-access), where remote access is optional plumbing around a local service rather than the owner of task data.

## Client Exposure

The planned architecture includes local MCP clients, Secure MCP Tunnel, and public HTTPS/OAuth routes, but task content returned to a cloud LLM leaves the Mac even when the MCP server itself runs locally [@plan]. That distinction is the core of the data boundary: local execution does not make every connected client local. The service therefore needs server-side search, field selection, payload caps, batch limits, and permission checks to avoid sending the whole task library when a smaller result is enough [@plan].

The boundary is enforced through planned authorization layers described in [Permissions And Authorization](../architecture/permissions-and-authorization). Authentication must happen before task data is read, remote grants default to read-only during setup, and optional project or area allowlists apply to reads, writes, move destinations, and descendants touched by cascades [@plan].

## Diagnostics, Logs, And Recovery Images

The planned diagnostic posture is metadata-first. The service keeps a small local operation journal with request fingerprints, status, and resulting IDs, while default audit logs are metadata-only [@plan]. Optional local before-images can help recover supported field edits, but they contain private task data and therefore need explicit user settings, protection, expiry, and clear limits; they are not a full Things backup [@plan].

Release work must preserve the same line. [Release Readiness](../guides/release-readiness) depends on this concept because a public-ready repository must provide synthetic tests, portable configuration, security-reporting instructions, dependency notices, and history scans without disclosing the owner's task library or credentials [@agents].
