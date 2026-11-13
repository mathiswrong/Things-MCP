# Packaging dependencies

The MCPB builder and validator are pinned to `@anthropic-ai/mcpb` 2.1.2. They run only during development and are excluded from the installed runtime. The `tmp` override pins 0.2.7 because the builder's interactive-editor dependency otherwise resolves a vulnerable version. Recheck the override when updating the builder.

The MCP client is pinned to 2.4.0, which includes the released OAuth credential binding fix for [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h). This project's clients use stdio and do not supply OAuth credentials.

The extension builder uses the published `node-forge` 1.4.3 package. The override pins that version for its TLS and Ed25519 security fixes. The [RSA regression test](../tests/dependencies.test.ts) checks that Forge accepts a valid signature and rejects extra elements in the nested `DigestAlgorithm` structure. Forge is a development dependency used only by the packaging toolchain. See the [upstream changelog](https://github.com/digitalbazaar/forge/blob/936b24d939dc7261ee37982576f9cf2b410084ee/CHANGELOG.md).

The runtime build derives third-party notices from the dependencies reported by esbuild, preserving their license and notice files. A missing notice fails the build. The SDK's MIT notices and Apache-2.0 dependency notices remain in the package. No project license is granted by these third-party notices.

The Sentry 11.12.0 archives for `@sentry/server-utils` and `@sentry/server-runtime-injection` include their MIT license and a separate `build/THIRD-PARTY-LICENSES.txt` for bundled dependencies. The build includes both files for each package.
