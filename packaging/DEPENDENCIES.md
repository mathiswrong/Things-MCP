# Packaging dependencies

The MCPB builder and validator are pinned to `@anthropic-ai/mcpb` 2.1.2. They run only during development and are excluded from the installed runtime. The `tmp` override pins 0.2.7 because the builder's interactive-editor dependency otherwise resolves a vulnerable version. Recheck the override when updating the builder.

The runtime build derives third-party notices from the dependencies reported by esbuild, preserving their license and notice files. A missing notice fails the build. The SDK's MIT notices and Apache-2.0 dependency notices remain in the package. No project license is granted by these third-party notices.

The published `@sentry/server-utils` 10.73.0 and 10.75.0 packages omit their monorepo license file. `notices/sentry-10.73.0.txt` and `notices/sentry-10.75.0.txt` preserve the license from [the corresponding upstream versions](https://github.com/getsentry/sentry-javascript/blob/10.75.0/LICENSE). The build exception is restricted to those package versions and the MIT license identifier. Updating it requires reviewing the upstream notice again.
