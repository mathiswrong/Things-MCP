import { createHash } from "node:crypto";
import { z } from "zod";

export const kindSchema = z.enum(["todo", "project", "area", "tag"]);
export type Kind = z.infer<typeof kindSchema>;
export const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Use an actual calendar date in YYYY-MM-DD format.");
export const statusSchema = z.enum(["open", "completed", "canceled"]);
export const referenceSchema = z.strictObject({
  kind: kindSchema,
  id: idSchema,
});
export type Reference = z.infer<typeof referenceSchema>;
export const itemSchema = z.strictObject({
  kind: kindSchema,
  id: idSchema,
  title: z.string(),
  notes: z.string().optional(),
  status: statusSchema.optional(),
  deadline: dateSchema.nullable().optional(),
  scheduledDate: dateSchema.nullable().optional(),
  projectId: idSchema.nullable().optional(),
  areaId: idSchema.nullable().optional(),
  tagNames: z.string().optional(),
  parentTagId: idSchema.nullable().optional(),
  keyboardShortcut: z.string().optional(),
});
export type Item = z.infer<typeof itemSchema>;
export const querySchema = z.strictObject({
  kind: kindSchema.default("todo"),
  text: z.string().max(500).default(""),
  status: statusSchema.optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).max(4900).default(0),
  includeNotes: z.boolean().default(false),
});
export type Query = z.infer<typeof querySchema>;
export const createSchema = z
  .strictObject({
    requestId: z.uuid(),
    kind: z.enum(["todo", "project", "area", "tag"]),
    title: z.string().trim().min(1).max(4000),
    notes: z.string().max(10000).optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.kind === "area" || value.kind === "tag") &&
      value.notes !== undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "Only to-dos and projects have notes.",
      });
    }
  });
export type Create = z.infer<typeof createSchema>;
export const updateSchema = z
  .strictObject({
    requestId: z.uuid(),
    target: referenceSchema,
    expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    changes: z
      .strictObject({
        title: z.string().trim().min(1).max(4000).optional(),
        notes: z.string().max(10000).optional(),
        status: statusSchema.optional(),
        deadline: dateSchema.nullable().optional(),
      })
      .refine(
        (value) => Object.keys(value).length > 0,
        "Supply at least one changed field.",
      ),
  })
  .superRefine((value, context) => {
    if (
      (value.target.kind === "area" || value.target.kind === "tag") &&
      Object.keys(value.changes).some((key) => key !== "title")
    ) {
      context.addIssue({
        code: "custom",
        message: "Only title editing is available for this item type.",
      });
    }
  });
export type Update = z.infer<typeof updateSchema>;
export const scheduleSchema = z.strictObject({
  requestId: z.uuid(),
  target: z.strictObject({ kind: z.enum(["todo", "project"]), id: idSchema }),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
  date: dateSchema,
});
export type Schedule = z.infer<typeof scheduleSchema>;
export const queryResultSchema = z.strictObject({
  items: z.array(itemSchema),
  hasMore: z.boolean(),
  scanComplete: z.boolean(),
  nextOffset: z.number().int().nonnegative().nullable(),
});
export const healthSchema = z.strictObject({
  version: z.string(),
  running: z.boolean(),
  timezone: z.string(),
});
export interface Adapter {
  health(): Promise<z.infer<typeof healthSchema>>;
  get(reference: Reference, signal?: AbortSignal): Promise<Item>;
  find(query: Query): Promise<z.infer<typeof queryResultSchema>>;
  create(input: Create, signal?: AbortSignal): Promise<Reference>;
  update(input: Update, signal?: AbortSignal): Promise<Reference>;
  schedule(input: Schedule, signal?: AbortSignal): Promise<Reference>;
}
export function fingerprint(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input !== null && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, val]) => [key, canonical(val)]),
      );
    }
    return input;
  };
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
export function present(item: Item) {
  return {
    ...item,
    revision: fingerprint(item),
    url: `things:///show?id=${encodeURIComponent(item.id)}`,
  };
}
