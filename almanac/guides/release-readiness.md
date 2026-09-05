---
title: "Release Readiness"
summary: "Release readiness defines the gates that must pass before this private personal Things MCP project can become a public, maintainable release."
topics: [release-readiness, open-source, security]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Release Readiness

Release readiness is the set of gates that must pass before this repository moves from a private, personal Things MCP project to a public release. The settled direction is personal use first and possible free open source later, but publication requires explicit authorization, a license decision, dependency notices, contributor documentation, reproducible builds, security reporting, artifact signing, and scans for secrets, personal data, and prohibited attribution [@plan]. This guide exists so future agents do not mistake a working local build for permission to publish.

## Start From Product Status

Do not begin release work until the personal workflow has proved useful. The project rules say to prove the owner's daily workflow before broad distribution while keeping the architecture suitable for a future free open-source release [@agents]. That direction is recorded in [Personal Use Before Public Release](../decisions/personal-use-before-public-release).

The plan separates personal usefulness, reliable behavior, straightforward fresh installation, and public packaging [@plan]. A local build can be useful before public readiness, but public release waits until advertised operations have verified postconditions or accepted limitations, unauthorized writes fail at the service boundary, retries do not duplicate tasks blindly, and a new user can install and diagnose the connection without editing scripts [@plan].

## License And Notices

Choose the project license with the owner before public release. The repository rules forbid publishing the repository or applying a license grant without explicit authorization [@agents]. The plan also requires a dependency license audit and required notices before release [@plan].

Do not redistribute Things itself or proprietary vendor assets [@agents]. Compatibility documentation may name integrations where needed for configuration, but the project rules prohibit assistant or model attribution in commits, PR text, source comments, docstrings, and branch names [@agents].

## Contributor Independence

A public release needs contributor instructions that stand on their own. The repository rules require reproducible build instructions, capability documentation, synthetic tests, and a self-contained contributor guide before public release [@agents]. Public contributors must not need the owner's sibling rulebooks, secrets, signing identity, paid infrastructure, or private services to build and test the source [@agents].

Keep this gate tied to [Capability Audit](../concepts/capability-audit). The plan says every advertised operation needs either a verified postcondition or an explicit accepted limitation [@plan]. Contributor docs should explain how to run ordinary domain tests with fake adapters and how real integration tests are separated into a dedicated macOS user with synthetic Things data [@plan].

## Privacy And History Scan

Release cannot proceed until the full repository history has been scanned for secrets, personal data, private task data, machine-specific configuration, screenshots, disposable builds, and prohibited attribution [@plan]. The repository rules put the same boundary on source control: keep personal task data, credentials, private conversation history, screenshots, and disposable builds out of the repository [@agents].

The [Task Data Boundary](../concepts/task-data-boundary) also applies to telemetry and diagnostics. The plan allows metadata-only audit logs by default, treats optional before-images as private data with protection and expiry needs, and says task content returned to a cloud client leaves the Mac even when the MCP server is local [@plan]. Release diagnostics, examples, fixtures, and screenshots must use synthetic data.

## Security And Remote Access

Public release requires security reporting instructions and a clear remote-access posture. The plan requires MCP-compatible OAuth for public HTTP use, exact redirect checks, short-lived tokens, audience validation, revocation, and maintained authorization components rather than homegrown cryptography [@plan]. It also requires Origin and Host validation, forwarded-header restrictions, payload and batch-size caps, rate limits, and stderr-only diagnostics for stdio transport [@plan].

Remote connection providers must stay replaceable. The repository rules say the core must remain usable without an account or hosted service operated by this project [@agents]. The plan permits tunnel or identity-provider operations for remote mode, but provider selection, pricing, credentials, revocation, and account availability are implementation and acceptance checks rather than release assumptions [@plan].

## Packaging, Signing, And Rollback

Public packaging follows the personal CLI, desktop extension package, and eventually a signed and notarized Mac installer with a small status or settings menu [@plan]. Release artifacts should be signed, accompanied by release notes, and paired with rollback to the previous package [@plan].

Shortcut workflows and tool contracts must be versioned together. Before release, the installer and diagnostics should detect missing or changed workflows, document repair steps, and disable incompatible capabilities instead of leaving users with partial hidden failures [@plan]. A native helper should only be added if the project has proved it is needed for stable permission identity, Keychain access, or URL callbacks [@plan].

## Final Gate

Release readiness is met only when public distribution, project visibility, and license grant have all been explicitly authorized, and the repository passes the product, security, privacy, documentation, packaging, and capability gates above. Free project software does not imply that Things, an assistant subscription, or an optional connection provider is free [@plan].

If any gate fails, keep the repository private and record the blocker as release work. Do not weaken the [Capability Audit](../concepts/capability-audit), skip the history scan, or replace unsupported Things automation with private APIs to make the release appear complete.
