# Maintaining Things MCP

The repository is maintained by [mathiswrong](https://github.com/mathiswrong). Changes go through pull requests. Contributors retain copyright in their contributions and contribute under the project license. A contribution does not grant repository administration or commit access.

## Repository protections

Keep the `main` ruleset active: require a pull request, a passing `check` job from GitHub Actions, resolved review conversations, and an up-to-date branch. Block branch deletion and force pushes. The maintainer can merge their own pull request after checks pass; a second approval is not required for a repository with one maintainer. External contributors cannot merge or push directly.

Protect `v*` tags against changes and deletion. Correct release errors with a new version instead of moving a published tag. Keep Actions tokens read-only by default and disable workflow approval of pull requests. Require approval for workflows from all external contributors. Pin third-party actions to full commit IDs, and never run untrusted pull-request code in a privileged `pull_request_target` workflow.

Enable secret scanning and push protection, Dependabot alerts and security updates, and private vulnerability reporting. The CodeQL workflow analyzes source on pull requests, main pushes, and a weekly schedule. Dependabot proposes weekly dependency and action updates; review and test them before merging. CI never publishes or merges automatically.

Repository settings are separate from source control. After changing visibility or transferring the repository, recheck rulesets, Actions permissions, Security settings, and private reporting. A clean automated scan does not replace review of public prose and package contents.

## Triage and support

Use issues for reproducible bugs and bounded feature requests. Ask for versions and synthetic reproduction steps, never credentials or a user's database. Route vulnerability reports to Security advisories. Support is best effort with no response-time guarantee. There is no paid support tier.

When proposing a Things feature, identify its public interface first. An action missing from this server is not necessarily missing from Things. Record that distinction in the capability guide and full-scope inventory.

## Funding and releases

`.github/FUNDING.yml` uses GitHub's native Buy Me a Coffee provider. The Sponsor button links to the same optional support page as the README. Donations do not unlock features or change the license. GitHub Sponsors enrollment and payout setup are separate and are not required.

Follow [the release procedure](RELEASING.md). Preserve project and dependency licenses in every package, publish a checksum with each archive, and verify anonymous downloads after publishing.
