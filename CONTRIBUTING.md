# Contributing

The project is in private feasibility development. No public license has been granted yet.

Use Node.js 24 or later, run `npm ci`, then `npm run check` and `npm run smoke`. These checks use synthetic fixtures and do not require Things, credentials, Sentry, a signing identity, or hosted infrastructure. Set `THINGS_MCP_BUILD_DIR` to an external build directory if the default Downloads location does not suit the environment.

Work in a feature worktree and a neutral `feat/` or `fix/` branch. Open a pull request with the problem, resulting behavior, and exact validation. Keep commit messages and source comments technical and free of generation attribution or automated co-author trailers. Do not commit credentials, task data, personal paths, screenshots, logs, or temporary build artifacts. Keep generated output outside the repository. Preserve required third-party notices.

Use maintained platform libraries and supported Things interfaces. Do not introduce private app APIs, database access, shell execution tools, or automatic retries of uncertain writes. Every advertised capability needs a verified postcondition or an explicit limitation. New UI needs reviewed design work before implementation.

New mutations must include failure-path tests, permission enforcement, bounded inputs, shared coordination, durable request handling, and read-back verification. Default real mutation tests to a separate macOS user with a disposable Things library. A library owner may explicitly authorize testing in their real library: use a labeled synthetic fixture, make one single-item write at a time, read it back, and preserve the shared lock and journal. That authorization does not enable ordinary writes for connected clients. Public automation is not transactional; report uncertainty instead of fabricating rollback.

Consult `almanac/README.md` for project context. Treat the wiki as read-only during ordinary implementation; use the maintenance workflow for durable knowledge changes. Current code is authoritative for implementation behavior.

The SDK and other dependency versions are locked. Update dependencies deliberately, rerun compatibility tests, check security advisories, and preserve license obligations. Native SDK/library checks should not be replaced by source-code-only assertions.

For packaging changes, run `npm run package:extension` and `npm run smoke:extension` after the normal checks. Both work without Things, credentials, or a signing identity. The latter extracts the built archive and starts it from a path containing spaces, with only a minimal environment and isolated test state. The explicit `--live-health` option requires macOS and Things; CI does not use it. See `packaging/DEPENDENCIES.md` for the development dependency override and bundled notice handling.

Publishing a package, changing repository visibility, distributing installers, and applying a license require the owner's separate authorization. No CI workflow in this repository deploys or publishes software.
