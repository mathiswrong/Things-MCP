# Project working rules

> [!IMPORTANT]
> **Open Things 3 before launching your LLM client.**
>
> Things must already be running on the Mac hosting Things MCP before you open your AI app or browser conversation. Otherwise, you may see **“unable to connect to server”**. Keep Things running while you use the connection.
>
> **Already seeing the error?** Open Things, fully quit and reopen your desktop client (or reload your browser client), then start a new conversation and check the connection.

This startup order applies to live connections. Automated builds and tests do not require Things or an LLM client.

- Follow `CONTRIBUTING.md` for portable build, verification, and contribution requirements. In the owner's Projects workspace, also read the Projects-root `DEV-RULEBOOK.md` and `SUPER-SIMPLE-DESIGN.md`. Public contributors do not need those private files.
- Use neutral `feat/` or `fix/` branches. Keep commit messages, pull requests, comments, and docstrings technical and free of provenance signatures or automated co-author trailers. Name integrations only where needed for compatibility or required configuration. Preserve legally required third-party notices.
- Keep credentials, task data, personal configuration, private conversations, screenshots, disposable outputs, and builds out of source control. Scan the tree, reachable history, release assets, and pull-request text before publication.
- Use only supported Things automation. Never write to its database, use private experimental APIs, collect Things Cloud credentials, or expose generic script execution.
- No Apple Shortcuts dependency, bridge, or installation. Keep the server lightweight. If Things has no supported mechanism for an operation, document the limit and omit it; do not implement substitute schedulers or workflows. Native repeat-rule editing is excluded on that basis.
- Retain shared state, locking, durable request IDs, revision checks, and read-back verification across clients. Never retry an uncertain mutation automatically.
- New installations default to read-only. Enable a library owner's normal client grants only when they request write access. For authorized live verification, mutate one clearly labeled synthetic item at a time and read it back before continuing. Destructive tests require a disposable library.
- Keep the local core usable without a project-operated account or hosted service. Optional remote providers must remain replaceable. Builds and tests must not require personal credentials, signing identities, or private services.
- Use maintained dependencies and preserve redistribution requirements. Do not redistribute Things or proprietary vendor assets.
- Product planning precedes implementation. New UI requires approved designs. There is no companion app, custom setup window, or menu-bar app. Prefer existing client installation and settings controls. Document advanced setup honestly when a command-free installation is unavailable.
- Run appropriate local checks and update the pull request. Do not merge, change visibility, publish packages, or grant a license without the owner's explicit authorization.
- Consult `almanac/` for architecture and historical decisions. Current code takes precedence over historical descriptions. Treat the wiki as read-only during ordinary development; use its maintenance workflow for wiki changes.
