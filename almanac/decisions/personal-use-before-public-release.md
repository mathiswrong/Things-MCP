---
title: "Personal Use Before Public Release"
topics: [release-boundary, open-source, product-scope]
sources:
  - id: license
    type: file
    path: LICENSE
  - id: verification
    type: file
    path: VERIFICATION.md
  - id: release
    type: file
    path: docs/RELEASING.md
---

# Personal Use Before Public Release

The personal-first approach led to a public MIT release after native and client verification. The license is settled; future maintainers must not treat historical private-preview language as the current repository state [@license] [@verification].

## Continuing constraints

Public distribution still needs explicit release authorization. Builds and tests must remain portable, private fixture data must stay out of source control, and published capabilities must distinguish verified results from limitations [@release].

A release is not proof of every environment. Existing-account client checks and native fixture observations are recorded separately from fresh-Mac consent and system lifecycle gaps [@verification]. See [Release Readiness](../guides/release-readiness.md).
