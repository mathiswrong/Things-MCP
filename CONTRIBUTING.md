# Contributing

Use a feature branch and open a pull request with the problem, resulting behavior, and relevant validation. Keep examples synthetic and changes focused. Public contributors do not need sibling rulebooks, a Things license, a provider account, or a signing identity to build and run the automatic tests.

## Build and test

Install Node.js 24 or later and Git, then:

```sh
git clone https://github.com/mathiswrong/Things-MCP.git
cd Things-MCP
npm ci
npm run check
npm run smoke
npm run package:extension
npm run smoke:extension
npm audit --audit-level=high
```

`check` runs typechecking, lint, tests, and the runtime build. The smoke tests launch the real bundled process through the official MCP client. They use isolated synthetic permission state and cannot make native writes. The extension smoke test validates the checksum, extracts the archive, resolves native settings with the official manifest library, launches from a path containing spaces, discovers the tools, rejects unauthorized writes, and reconnects.

Builds default to `~/Downloads/Things-MCP-builds/<version>`. Set `THINGS_MCP_BUILD_DIR` to another absolute directory outside the repository when needed. Tests create disposable directories under Downloads and remove them. Do not put screenshots, logs, personal configuration, disposable output, or packaged binaries in the source tree.

On a Mac with Things running, `npm start -- doctor` checks app health. `npm run smoke:extension -- --live-health` checks native health without reading tasks. `npm run smoke -- --live-read` additionally performs bounded reads; use it only with the library owner's consent. Normal CI uses no native app or provider credentials.

## Changing behavior

Use supported Things interfaces and maintained dependencies. Never add database access, private app APIs, arbitrary script execution, or automatic retries of uncertain writes. Inputs must remain bounded and validated. Keep every connection to a library on the same state directory.

New mutations need permission enforcement, failure-path tests, shared locking, durable request handling, revision checks where applicable, and verified read-back. Every advertised capability needs evidence or a clear limitation. Public automation is not transactional; report uncertainty instead of claiming rollback.

Real write tests belong in a disposable Things library by default. A library owner may explicitly authorize single-item checks in their library. Use a clearly labeled synthetic item, perform one mutation at a time, and read it back before continuing. Ordinary client write grants require their own explicit authorization. Never test destructive operations on a personal library.

Keep comments and commit messages technical. Do not add provenance signatures or automated co-author trailers. Preserve dependency copyright and license notices. Product names belong only in compatibility documentation and necessary integration configuration.

Use native client installation and settings controls. There is no companion app. New UI needs an approved design before implementation. Consult the read-only `almanac/` knowledge tree for historical decisions, but use current code as implementation truth; some pages describe earlier plans.

## Dependencies and packaging

Dependency versions are exact and locked. Update them deliberately, review advisories, rerun checks, and preserve required notices. Runtime notice generation uses the actual bundle inputs and fails when a required dependency notice is missing. See [packaging dependencies](packaging/DEPENDENCIES.md).

The optional desktop plugin generator accepts a registered app ID and writes account-specific metadata outside the repository:

```sh
npm run package:plugin -- asdk_app_synthetic_fixture
```

Use your actual app ID only for a private local installation. The tunnel is a separate advanced setup described in [ChatGPT setup](docs/CHATGPT.md). Never log credentials or raw provider requests.

## Release preparation

Follow [the release checklist](docs/RELEASING.md). Publishing, changing repository visibility, and merging require a maintainer's explicit release decision. CI checks pull requests and never publishes automatically. Keep the release notes focused on what works, how to install it, and known limits.

License selection is pending. Do not distribute project code until the project license is approved and included. Third-party notices apply only to their named dependencies.
