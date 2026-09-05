---
title: "Personal Use Before Public Release"
summary: "Things-MCP will prove the owner's daily workflow before broad distribution while keeping the repository ready for a later authorized free open-source release."
topics: [product-scope, release-boundary, local-first]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Personal Use Before Public Release

Things-MCP is planned as a personal-first project: it should make the owner's daily Things workflow work reliably before the project invests in broad packaging, distribution, or public contributor support. At the same time, the repository must stay suitable for a possible later free open-source release, and public release requires explicit authorization, release preparation, and a license choice with the owner [@plan] [@agents]. This decision is the release-order policy behind [Product Scope](../concepts/product-scope).

## Context

The implementation plan states that Things-MCP is a proposed design, not an implemented or tested server [@plan]. It also states that the agreed direction is personal use first, then a possible free, open-source release, with the repository private until explicitly authorized otherwise [@plan]. That sequence matters because the current risk is not marketing reach; it is proving that the Mac service, Things adapters, permissions, and target clients can complete real daily task workflows safely.

The project working rules reinforce the same order. They direct future work to prove the owner's daily workflow before investing in broad distribution, while keeping the architecture and repository suitable for a future free open-source release from the beginning [@agents]. They also require reproducible build instructions, capability documentation, synthetic tests, and a self-contained contributor guide before public release [@agents].

## Decision

The project will optimize first for a working personal local build. Early milestones should prove key Things read and write operations, run harmless verification scenarios, and test the initial accepted clients before spending effort on public packaging polish [@plan].

The project will still keep open-source readiness in view during private development. Configuration must be portable, fixtures must be synthetic, public contributors must not need the owner's private services or sibling rulebooks, and source control must not include personal task data, credentials, private conversation history, screenshots, disposable builds, proprietary vendor assets, or the owner's signing and telemetry setup [@agents]. [Release Readiness](../guides/release-readiness) records the later gates that must be satisfied before any public distribution.

## Consequences

This decision gives future agents a priority order. The first useful proof is an end-to-end daily workflow in the target personal clients, not a generic public launch checklist [@plan]. The plan names Claude Desktop and ChatGPT as initial acceptance targets and leaves broader remote access optional until those paths work [@plan].

The release boundary stays explicit. The project rules say not to publish the repository, apply a license grant, or change visibility without explicit authorization, and they require the owner to choose the license before public release [@agents]. Future release work also needs dependency notices, security-reporting instructions, history scans, reproducible builds, and contributor documentation [@agents].

The tradeoff is that some infrastructure useful for broad distribution may wait while the personal workflow is being proved. That is intentional. [Local Core With Replaceable Remote Access](local-core-with-replaceable-remote-access) keeps the core account-free and local, which lets personal use advance without committing the project to a hosted business or a specific remote provider [@plan] [@agents].
