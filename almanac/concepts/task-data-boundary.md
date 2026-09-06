---
title: "Task Data Boundary"
topics: [privacy, tasks, safety]
sources:
  - id: state
    type: file
    path: src/state.ts
  - id: service
    type: file
    path: src/service.ts
  - id: telemetry
    type: file
    path: src/telemetry.ts
  - id: privacy
    type: file
    path: docs/PRIVACY.md
---

# Task Data Boundary

Task content returned to a connected client leaves the local bridge and follows that client's data handling. Local execution does not make a cloud conversation local-only [@privacy]. Persistent bridge receipts intentionally contain operation metadata rather than task titles and notes [@state].

## Stored and returned information

Receipts retain request and item IDs, changed field names and verification status. Project move summaries add descendant IDs and counts, without field values. IDs still describe the user's library and belong in protected local state [@state] [@service]. Search omits notes unless requested; explicit reads can return more content [@service].

## Diagnostics

Optional error reporting starts only with a locally supplied destination. The scrubber retains a generic failure message and an error code, dropping task text, raw exceptions and breadcrumbs. No destination is bundled for users [@telemetry]. Credentials and private configuration remain outside source control [@privacy]. See [Permissions](../architecture/permissions-and-authorization.md).
