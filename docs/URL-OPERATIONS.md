# Things URL operations

The native tools cover fields that Things can read back. Four additional tools use Things' [documented URL interface](https://culturedcode.com/things/support/articles/2803573/) for features outside that read-back surface.

| Tool | Use |
|---|---|
| `things_create_from_template` | Create one to-do with checklist rows, or one project containing headings and to-dos. Checklist rows can start open, completed or canceled. |
| `things_edit_extras` | Replace, clear, append or prepend checklist rows; move a to-do to an existing heading; set a date, reminder or Evening; clear its When field. |
| `things_duplicate_item` | Duplicate a to-do or project, optionally naming the copy. Repeating items cannot be duplicated. |
| `things_show_view` | Open search or a built-in view, including Deadlines, Repeating and logged projects, with optional tag filters. |

## Set up once on your Mac

Creating templates and opening views need Things URLs enabled. Editing existing items and duplication also require a token. This is a local Things automation token, not a Things Cloud password or a provider API key.

1. Open **Things > Settings > General** and enable **Things URLs**.
2. Select **Manage** and copy the existing authentication token. Avoid Generate New Token unless you intend to revoke other integrations using it.
3. Open Apple's **Keychain Access**, select the **login** keychain, and choose **File > New Password Item** or the Add Item button. If prompted to use Passwords, choose **Continue** to stay in Keychain Access.
4. Set **Keychain Item Name** to `Things MCP URLs`, **Account Name** to `default`, and **Password** to the token. Select **Add**.
5. Enable ordinary changes for the desired connection in the extension's settings. This grant is shared with the native editing tools. The token alone does not enable writes.

Both local and tunnel connections on this Mac use that Keychain item. No configuration-file editing or token in a chat is needed. If macOS prompts for Keychain access, authorize the expected local process. Never select unrestricted access for every application.

## Read the receipt correctly

These tools return `verification: "url_dispatched"` and the journal state `dispatched`. The message says **“Sent to Things; result not verified.”** This confirms that macOS accepted the URL for delivery. It does not confirm that Things accepted every field or completed the operation. Things may show an error dialog, ignore an unsupported field or reject edits to repeating templates.

The server does not use a callback listener or collect returned IDs. A template receipt has no target ID. A duplication receipt identifies the source, not the copy. Find the resulting item and inspect it in Things before making another change. Never repeat an uncertain operation with a new request ID. Reusing the same ID returns the saved dispatch receipt without sending another URL.

Revisions cover exposed fields only. Changes to a checklist, heading or reminder cannot reliably be detected by a revision check. URL dispatch is asynchronous; the shared lock serializes dispatch but cannot lock Things' own UI or cloud sync. The server does not automatically chain another mutation after a URL operation.

## Examples

- “Create a project called Weekend trip with Planning and Packing headings, and a packing task with a checklist.”
- “Read this task first, then append Passport and Charger to its checklist. Tell me whether the result was verified.”
- “Set this task for 2026-10-01 at 09:30.” The typed value is `2026-10-01@09:30`; times use the Mac's timezone.
- “Move this task under the existing Packing heading in this project.”
- “Duplicate this project and name the copy Next trip.”

Checklist replacement replaces all rows. Append/prepend preserve the existing rows, but the server cannot read the total row count. Things allows up to 100 checklist rows. Templates accept one root, up to 100 project entries, and bounded payload size. A heading applies to subsequent project entries until the next heading. Headings cannot be created independently or edited in place by these tools.

## Revoke or troubleshoot

Remove the `Things MCP URLs` Keychain item to stop authenticated URL calls from this bridge. Disable Things URLs in Things to disable the entire URL scheme. Rotate the token in Things to revoke every integration using the old token, then update Keychain if continuing to use this bridge.

A missing or inaccessible token returns `URL_AUTH_REQUIRED` before dispatch. A failed or interrupted dispatch remains uncertain and is never replayed automatically. Inspect Things for a result or error dialog. The server does not log URLs or tokens.
