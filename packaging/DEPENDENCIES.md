# Packaging dependencies

The MCPB builder and validator are pinned to `@anthropic-ai/mcpb` 2.1.2. They run only during development and are excluded from the installed runtime. The `tmp` override pins 0.2.7 because the builder's interactive-editor dependency otherwise resolves a vulnerable version. Recheck the override when updating the builder.

The MCP client is pinned to 2.3.1, which includes the released OAuth credential binding fix for [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h). This project's clients use stdio and do not supply OAuth credentials.

The builder's `node-forge` dependency has no published fix for [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Its override pins the archive of upstream [patch #1152](https://github.com/digitalbazaar/forge/pull/1152) at commit `ceba34402e329f0365134f23fe19898756527d65`, with archive integrity recorded in the lockfile. The patch validates the nested DigestAlgorithm element count. `tests/dependencies.test.ts` verifies that the installed dependency accepts a valid native signature and rejects the malformed nested structure. Source archives are not covered by npm's registry advisory matching, so this regression check is required alongside the unchanged dependency audit. Replace the override with a published patched release when one becomes available. The signature library remains excluded from the installed runtime.

The runtime build derives third-party notices from the dependencies reported by esbuild, preserving their license and notice files. A missing notice fails the build. The SDK's MIT notices and Apache-2.0 dependency notices remain in the package. No project license is granted by these third-party notices.

The Sentry 11.12.0 archives for `@sentry/server-utils` and `@sentry/server-runtime-injection` include their MIT license and a separate `build/THIRD-PARTY-LICENSES.txt` for bundled dependencies. The build includes both files for each package.
