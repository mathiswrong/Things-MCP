---
title: "Release Readiness"
topics: [release-readiness, open-source, security]
sources:
  - id: release
    type: file
    path: docs/RELEASING.md
  - id: maintain
    type: file
    path: docs/MAINTAINING.md
  - id: verification
    type: file
    path: VERIFICATION.md
  - id: license
    type: file
    path: LICENSE
---

# Release Readiness

Things MCP is publicly released under MIT. Further releases still require a maintainer's explicit decision, a tested source commit and verified distributable assets [@license] [@release]. Publication is not implied by a passing local build.

1. Inspect every open pull request and its intended release contents. A feature on an unmerged branch is not present in the published package. Match the tested tree to the merge commit before tagging [@release].
2. Run clean dependency installation, the complete check suite, stdio smoke, extension packaging, extracted-package smoke and dependency audit. Separate native fixture and client evidence from synthetic tests [@release] [@verification].
3. Update the capabilities, installation, verification record, changelog and maintained wiki. Preserve explicit dispatch-only and environment limits [@verification].
4. Scan source, reachable history, public text and extracted assets for credentials, private content and provenance signatures. Preserve required dependency notices [@release].
5. Merge through protected checks, publish a new immutable version with MCPB and checksum assets, and verify signed-out access and checksum agreement [@release] [@maintain].

The release procedure does not certify every client or a fresh Mac. Keep those limits in the evidence record, and never move an existing protected tag to conceal a correction [@verification] [@maintain]. See [Personal Use Before Public Release](../decisions/personal-use-before-public-release.md).
