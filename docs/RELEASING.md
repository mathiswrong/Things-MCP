# Release checklist

> [!IMPORTANT]
> **Open Things 3 before launching your LLM client.**
>
> Things must already be running on the Mac hosting Things MCP before you open your AI app or browser conversation. Otherwise, you may see **“unable to connect to server”**. Keep Things running while you use the connection.
>
> **Already seeing the error?** Open Things, fully quit and reopen your desktop client (or reload your browser client), then start a new conversation and check the connection.

This startup order applies to live connections. Automated builds and tests do not require Things or an LLM client.

This procedure prepares a reviewable release. It does not authorize publication. The maintainer authorizes each release; ordinary development does not authorize publishing.

## Verify the source and assets

1. Confirm the release commit and version from GitHub. Review every open pull request for features intended for this release; an unmerged branch is not part of the published package. Check for concurrent changes and preserve them. Match the tested source tree to the merged commit before tagging.
2. Run `npm ci`, `npm run check`, `npm run smoke`, `npm run package:extension`, `npm run smoke:extension`, and `npm audit --audit-level=high` from a clean checkout.
3. Open Things 3 on the Mac before launching the LLM client. Then install the resulting package through the native host UI. Check health, grant ordinary writes deliberately, and create/read back one synthetic task. Verify a supported edit. Run the browser workflow separately when advertising remote support.
4. Update the capability registry, user reference, verification record, maintained wiki, repository description and release notes. Inspect the archive manifest, license, third-party notices, and documentation. Check its SHA-256 file against the archive. The package must contain no machine-specific configuration, account connector ID, task data, credential, or telemetry destination.
5. Scan all reachable Git history with a maintained secret scanner, for example `gitleaks git --redact --log-opts='--all'`. Review names, emails, file paths, comments, commit messages, PR text, and assets manually as well. Automated scans cannot prove that arbitrary private prose is absent.
6. Keep audit reports, screenshots, and release builds in an external Downloads directory. Commit generator scripts and portable documentation only.

## Prepare GitHub

- Include the selected project license at the repository root, in package metadata, and in the distributed archive. Preserve dependency notices. Keep `private: true` in package.json if distribution is through release assets; that flag prevents accidental npm publishing and does not control GitHub visibility.
- Apply the protections in [Maintaining](MAINTAINING.md). Enable private vulnerability reporting once the repository is public. Verify the Security tab's report link. Do not use public issues for sensitive reports.
- The checked-in `.github/FUNDING.yml` uses GitHub's native Buy Me a Coffee support. It becomes effective when it is on the default branch. The README also has a direct support link. No paid feature gate is involved.
- Include a prominent startup warning in release installation instructions: open Things 3 before launching the LLM client, or the client may report “unable to connect to server”. Explain how to reopen the client after Things is running.
- Draft release notes that name the supported workflows, installation route, version requirements, and actual limitations. A draft release can be reviewed while the repository is private.
- Attach the `.mcpb` and its checksum to the release. GitHub's source archives are not substitutes for the installable package. Do not upload a personal desktop plugin manifest or tunnel configuration.

## Final approval and publication

Prepare the exact source commit, project license, release notes, assets, and remaining limitations before publication. Proceed within the maintainer's explicit release authorization; ask only for an unresolved decision or an action outside that authorization. Check that other open branches and pull requests do not expose private content when visibility changes.

After approval, merge the reviewed work, publish the approved release assets from the reviewed commit, and verify the repository and downloads while signed out. Confirm the license, README links, Sponsor button, and private security-reporting entry point. A private-repository success does not prove anonymous download access.

Public release is difficult to reverse: copies, forks, and cached history may remain after a visibility change. Keep that final decision separate from ordinary development commits.
