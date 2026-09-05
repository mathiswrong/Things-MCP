import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  type FileHandle,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import lockfile from "proper-lockfile";
import { z } from "zod";
import { BridgeError } from "./errors.js";

export const receiptSchema = z.strictObject({
  requestId: z.uuid(),
  target: z.strictObject({
    kind: z.enum(["todo", "project", "area", "tag"]),
    id: z.string(),
  }),
  changedFields: z.array(z.string()),
  verification: z.literal("read_back"),
});
export type Receipt = z.infer<typeof receiptSchema>;
const recordSchema = z.strictObject({
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum(["pending", "completed", "unknown"]),
  receipt: receiptSchema.optional(),
});
export type OperationRecord = z.infer<typeof recordSchema>;
export const clientIdSchema = z.enum([
  "desktop-extension",
  "desktop-plugin",
  "browser",
]);
export type ClientId = z.infer<typeof clientIdSchema>;
const settingsSchema = z.strictObject({
  allowWrites: z.boolean(),
  clients: z
    .partialRecord(
      clientIdSchema,
      z.strictObject({
        configured: z.boolean(),
        enabled: z.boolean(),
      }),
    )
    .optional(),
});
export interface Lease {
  signal: AbortSignal;
  assertOwned(): Promise<void>;
}
export class State {
  constructor(
    public readonly directory: string,
    private readonly permitWrites = true,
    private readonly clientId?: ClientId,
  ) {}
  async initialize() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const stat = await lstat(this.directory);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (stat.mode & 0o077) !== 0 ||
      (process.getuid && stat.uid !== process.getuid())
    )
      throw new BridgeError("UNSAFE_STATE");
  }
  private async read(name: string): Promise<unknown | undefined> {
    let file: FileHandle | undefined;
    try {
      file = await open(
        join(this.directory, name),
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
      const stat = await file.stat();
      if (
        !stat.isFile() ||
        (stat.mode & 0o077) !== 0 ||
        stat.size > 65536 ||
        (process.getuid && stat.uid !== process.getuid())
      )
        throw new BridgeError("UNSAFE_STATE");
      return JSON.parse(await file.readFile("utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      if (error instanceof BridgeError) throw error;
      throw new BridgeError("STATE_FAILURE");
    } finally {
      await file?.close();
    }
  }
  private async write(name: string, value: unknown, lease?: Lease) {
    const temporary = join(this.directory, `.${randomUUID()}.tmp`);
    try {
      const file = await open(temporary, "wx", 0o600);
      try {
        await file.writeFile(JSON.stringify(value));
        await file.sync();
      } finally {
        await file.close();
      }
      await lease?.assertOwned();
      await rename(temporary, join(this.directory, name));
      const directory = await open(this.directory, "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
    } catch (error) {
      if (error instanceof BridgeError) throw error;
      throw new BridgeError("STATE_FAILURE");
    } finally {
      await rm(temporary, { force: true });
    }
  }
  async writesEnabled() {
    if (!this.permitWrites) return false;
    const settings = await this.settings();
    return this.clientId
      ? settings.clients?.[this.clientId]?.enabled === true
      : settings.allowWrites;
  }
  private async settings() {
    const value = await this.read("settings.json");
    if (value === undefined)
      return { allowWrites: false } as z.infer<typeof settingsSchema>;
    const result = settingsSchema.safeParse(value);
    if (!result.success) throw new BridgeError("STATE_FAILURE");
    return result.data;
  }
  async configureClient(enabled: boolean) {
    if (!this.clientId) throw new BridgeError("INVALID_INPUT");
    const id = this.clientId;
    await this.exclusive(async (lease) => {
      const settings = await this.settings();
      if (settings.clients?.[id]?.configured === enabled) return;
      await this.write(
        "settings.json",
        {
          ...settings,
          clients: {
            ...settings.clients,
            [id]: { configured: enabled, enabled },
          },
        },
        lease,
      );
    });
  }
  async setWrites(enabled: boolean) {
    await this.exclusive(async (lease) => {
      const settings = await this.settings();
      if (!enabled && settings.clients) {
        for (const grant of Object.values(settings.clients))
          grant.enabled = false;
      }
      await this.write(
        "settings.json",
        { ...settings, allowWrites: enabled },
        lease,
      );
    });
  }
  async exclusive<T>(action: (lease: Lease) => Promise<T>): Promise<T> {
    await this.initialize();
    let release: () => Promise<void>;
    const controller = new AbortController();
    const lockPath = `${await realpath(this.directory)}.lock`;
    try {
      release = await lockfile.lock(this.directory, {
        stale: 120000,
        update: 10000,
        retries: 0,
        onCompromised: () => {
          controller.abort();
        },
      });
    } catch {
      throw new BridgeError("BUSY");
    }
    const identity = await lstat(lockPath);
    try {
      const lease: Lease = {
        signal: controller.signal,
        assertOwned: async () => {
          try {
            const current = await lstat(lockPath);
            if (
              controller.signal.aborted ||
              current.ino !== identity.ino ||
              current.dev !== identity.dev ||
              current.birthtimeMs !== identity.birthtimeMs ||
              Date.now() - current.mtimeMs > 120000
            ) {
              throw new Error("Lock ownership changed");
            }
          } catch {
            controller.abort();
            throw new BridgeError("OUTCOME_UNKNOWN");
          }
        },
      };
      await lease.assertOwned();
      const result = await action(lease);
      await lease.assertOwned();
      return result;
    } finally {
      const current = await lstat(lockPath).catch(() => undefined);
      if (
        current?.ino === identity.ino &&
        current.dev === identity.dev &&
        current.birthtimeMs === identity.birthtimeMs
      ) {
        await release().catch(() => undefined);
      }
    }
  }
  async operation(id: string): Promise<OperationRecord | undefined> {
    if (!z.uuid().safeParse(id).success) throw new BridgeError("INVALID_INPUT");
    const value = await this.read(`request-${id}.json`);
    if (value === undefined) return undefined;
    const parsed = recordSchema.safeParse(value);
    if (!parsed.success) throw new BridgeError("STATE_FAILURE");
    return parsed.data;
  }
  async record(id: string, record: OperationRecord, lease?: Lease) {
    if (!z.uuid().safeParse(id).success) throw new BridgeError("INVALID_INPUT");
    await this.write(`request-${id}.json`, recordSchema.parse(record), lease);
  }
  async checkCapacity() {
    if (
      (await readdir(this.directory)).filter((name) =>
        name.startsWith("request-"),
      ).length >= 10000
    ) {
      throw new BridgeError("STATE_FAILURE");
    }
  }
}
