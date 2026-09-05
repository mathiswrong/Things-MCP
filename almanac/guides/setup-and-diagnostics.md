---
title: "Setup And Diagnostics"
summary: "Setup and diagnostics are planned product work for installing the local Things MCP service, connecting clients, and verifying harmless operation without hiding macOS permission steps."
topics: [setup, diagnostics, client-connections]
sources:
  - id: plan
    type: file
    path: PLAN.md
---

# Setup And Diagnostics

Setup and diagnostics are part of the planned product, not an afterthought. The repository intends to guide a user through installing a local Mac service, granting Things automation access, importing bundled Shortcuts, connecting an MCP client, and running a harmless verification scenario [@plan]. Current setup commands are design targets, so this guide describes the intended workflow and diagnostic expectations rather than commands that are already guaranteed to exist.

## What Setup Must Achieve

The successful end state is a Mac service running as the current macOS user, a client connected through an approved MCP route, and a verified harmless interaction with Things [@plan]. The service must not run as root, and local access is planned around a user-owned Unix socket with restrictive directory and socket permissions [@plan]. That local-first shape follows the repository's [Product Scope](../concepts/product-scope): personal use first, with future release readiness kept possible but not assumed.

macOS permissions and Shortcut imports remain real user actions. The plan says onboarding must include those prompts rather than claiming invisible installation [@plan]. A setup flow should therefore make each required external step visible and then verify it with a minimal read or no-op-style scenario.

## Planned Installation Flow

The planned setup flow has five user-facing stages [@plan]:

1. Install the package.
2. Grant Things automation access in macOS.
3. Import the bundled Shortcuts.
4. Connect a client.
5. Run a harmless verification scenario.

The plan names future commands such as `things-mcp setup`, `doctor`, `status`, `connect`, and `uninstall` [@plan]. Treat those names as intended command surfaces until the CLI implementation and tests exist. A future setup command should generate client configuration where possible, but it still needs to explain the user-controlled steps that macOS and Shortcuts require.

## Permissions And Shortcuts

Automation permission is a prerequisite for any adapter that asks Things to read or change task data. When permission is missing, diagnostics should tell the user to allow automation access to Things in macOS Privacy & Security settings; the plan treats readable errors as part of setup, not as an implementation detail [@plan].

Shortcuts are a versioned part of the planned tool contract. The plan says the project should distribute reviewed workflows with defined JSON input and output, detect missing or changed workflows, document repair steps, and disable affected capabilities when versions are incompatible [@plan]. Setup should therefore record the installed shortcut version and diagnostics should distinguish "Shortcut missing" from "Things automation denied" and from "operation unsupported."

## Client Connection

Use [Client Connections](../architecture/client-connections) to choose the route being tested. The plan's first local target is Claude Desktop through stdio, while ChatGPT may use Secure MCP Tunnel to the local stdio adapter or authenticated public HTTPS after account and workspace behavior is verified [@plan]. Claude web or mobile and other remote clients are later compatibility targets, not prerequisites for the first personal setup [@plan].

Every connection route must still end at the same Mac service. That keeps writes, permissions, and retry state shared across clients [@plan]. A setup tool that writes separate client configuration should not create separate mutation paths or separate state directories unless the architecture has explicitly changed.

## Harmless Verification

The verification scenario should prove the connection without risking real task data. Start with discovery or health, then perform a bounded read against synthetic data or a known disposable item. If ordinary writes are being enabled for the first time, use a synthetic create and read-back check rather than a destructive operation.

The expected result shape should match the [Planned Tool Contract](../reference/planned-tool-contract): affected IDs for writes, Things links, changed fields, warnings, and verification status [@plan]. A setup tool should not report success merely because a URL was launched; the plan requires mutation success to be based on read-back verification where a write occurs [@plan].

## Diagnostic Flow

Diagnostics should answer four questions in order:

1. Is the local service installed and running as the current macOS user?
2. Is Things reachable on this Mac, and has macOS granted automation access?
3. Are the expected Shortcuts installed at compatible versions?
4. Can the selected MCP client call the server and receive a structured result?

When the Mac is asleep, offline for a remote path, not running a signed-in session, or Things is unavailable, the planned server should return `HOST_UNAVAILABLE` instead of silently queuing writes for later [@plan]. When a remote tunnel or identity provider is part of setup, diagnostics should keep recurring costs and account requirements external until the provider is selected and current pricing is verified [@plan].

## Recovery Notes

If setup fails at the operating-system boundary, fix the local permission or installation state before retrying client configuration. If setup fails at the client boundary, leave the local service unchanged and regenerate only the affected client configuration. If a Shortcut has changed or disappeared, disable the capabilities that depend on it until repair is complete [@plan].

Uninstall should remove the package, generated client configuration, and local service registration without deleting a user's Things data. Local operation requires no hosted backend operated by this project, so uninstall should not depend on project-owned cloud infrastructure [@plan].
