import { z } from "zod";
import { dateSchema, referenceSchema } from "./domain.js";

const text = z.string().max(4000);
const title = text.min(1);
const id = z.string().min(1).max(200);
const taskRef = referenceSchema.extend({ kind: z.enum(["todo", "project"]) });
const when = z
  .string()
  .max(40)
  .refine((value) => {
    if (
      ["", "today", "tomorrow", "evening", "anytime", "someday"].includes(value)
    )
      return true;
    const parts = value.split("@");
    if (parts.length > 2) return false;
    if (
      !["today", "tomorrow", "evening"].includes(parts[0] ?? "") &&
      !dateSchema.safeParse(parts[0]).success
    )
      return false;
    return (
      parts.length === 1 || /^([01]\d|2[0-3]):[0-5]\d$/.test(parts[1] ?? "")
    );
  }, "Use a calendar date or supported list, optionally followed by @HH:MM.");
const checklistRow = z.strictObject({
  title,
  completed: z.boolean().optional(),
  canceled: z.boolean().optional(),
});
const common = {
  title,
  notes: z.string().max(10000).optional(),
  when: when.optional(),
  deadline: dateSchema.optional(),
  tags: z.array(title).max(100).optional(),
  completed: z.boolean().optional(),
  canceled: z.boolean().optional(),
};
const todo = z.strictObject({
  kind: z.literal("todo"),
  ...common,
  checklist: z.array(checklistRow).max(100).optional(),
});
const heading = z.strictObject({
  kind: z.literal("heading"),
  title,
  archived: z.boolean().optional(),
});
export const templateSchema = z
  .strictObject({
    requestId: z.uuid(),
    item: z.discriminatedUnion("kind", [
      todo.extend({
        list: referenceSchema
          .extend({ kind: z.enum(["area", "project"]) })
          .optional(),
        heading: title.optional(),
      }),
      z.strictObject({
        kind: z.literal("project"),
        ...common,
        areaId: id.optional(),
        items: z
          .array(z.discriminatedUnion("kind", [todo, heading]))
          .max(100)
          .optional(),
      }),
    ]),
  })
  .refine(
    (value) =>
      !(
        "heading" in value.item &&
        value.item.heading &&
        value.item.list?.kind !== "project"
      ),
    "A heading requires a project.",
  );
const revision = {
  requestId: z.uuid(),
  target: taskRef,
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
};
export const urlEditSchema = z
  .strictObject({
    ...revision,
    changes: z
      .strictObject({
        when: when.optional(),
        checklist: z.array(checklistRow).max(100).optional(),
        appendChecklist: z
          .array(title.refine((value) => !/[\r\n]/.test(value)))
          .min(1)
          .max(100)
          .optional(),
        prependChecklist: z
          .array(title.refine((value) => !/[\r\n]/.test(value)))
          .min(1)
          .max(100)
          .optional(),
        heading: title.optional(),
        projectId: id.optional(),
      })
      .refine((value) => Object.keys(value).length > 0, "Provide a change.")
      .refine(
        (value) =>
          [
            value.checklist,
            value.appendChecklist,
            value.prependChecklist,
          ].filter((value) => value !== undefined).length <= 1,
        "Use one checklist operation.",
      ),
  })
  .refine(
    (value) =>
      value.target.kind === "todo" ||
      Object.keys(value.changes).every((key) => key === "when"),
    "Project URL edits support scheduling only.",
  )
  .refine(
    (value) => !value.changes.projectId || !!value.changes.heading,
    "Project placement here requires a heading.",
  );
export const duplicateSchema = z.strictObject({
  ...revision,
  title: title.optional(),
});
export const urlNavigateSchema = z
  .strictObject({
    requestId: z.uuid(),
    view: z.enum([
      "search",
      "inbox",
      "today",
      "anytime",
      "upcoming",
      "someday",
      "logbook",
      "tomorrow",
      "deadlines",
      "repeating",
      "all-projects",
      "logged-projects",
    ]),
    query: text.optional(),
    tags: z
      .array(title.refine((value) => !value.includes(",")))
      .max(100)
      .optional(),
  })
  .refine(
    (value) => (value.view === "search" ? !value.tags : !value.query),
    "Search accepts a query; lists accept tag filters.",
  );
export const urlActionSchema = z.discriminatedUnion("action", [
  templateSchema.safeExtend({ action: z.literal("template") }),
  urlEditSchema.safeExtend({ action: z.literal("edit") }),
  duplicateSchema.extend({ action: z.literal("duplicate") }),
  urlNavigateSchema.safeExtend({ action: z.literal("navigate") }),
]);
export type UrlAction = z.infer<typeof urlActionSchema>;
export type UrlCommand = {
  command: "json" | "update" | "update-project" | "show" | "search";
  parameters: Record<string, string>;
};
function attributes(item: z.infer<typeof todo>) {
  const { kind: _kind, checklist, ...fields } = item;
  return {
    ...fields,
    ...(checklist
      ? {
          "checklist-items": checklist.map((attributes) => ({
            type: "checklist-item",
            attributes,
          })),
        }
      : {}),
  };
}
export function urlCommand(input: UrlAction): UrlCommand {
  if (input.action === "template") {
    const item = input.item;
    let fields: Record<string, unknown>;
    if (item.kind === "todo") {
      const { list, heading, ...task } = item;
      fields = {
        ...attributes(task),
        ...(list ? { "list-id": list.id } : {}),
        ...(heading ? { heading } : {}),
      };
    } else {
      const { kind: _kind, areaId, items, ...project } = item;
      fields = {
        ...project,
        ...(areaId ? { "area-id": areaId } : {}),
        ...(items
          ? {
              items: items.map((item) =>
                item.kind === "heading"
                  ? {
                      type: "heading",
                      attributes: {
                        title: item.title,
                        ...(item.archived !== undefined
                          ? { archived: item.archived }
                          : {}),
                      },
                    }
                  : { type: "to-do", attributes: attributes(item) },
              ),
            }
          : {}),
      };
    }
    return {
      command: "json",
      parameters: {
        data: JSON.stringify([
          {
            type: item.kind === "todo" ? "to-do" : "project",
            attributes: fields,
          },
        ]),
      },
    };
  }
  if (input.action === "navigate")
    return {
      command: input.view === "search" ? "search" : "show",
      parameters:
        input.view === "search"
          ? { query: input.query ?? "" }
          : {
              id: input.view,
              ...(input.tags ? { filter: input.tags.join(",") } : {}),
            },
    };
  if (input.action === "duplicate")
    return {
      command: input.target.kind === "todo" ? "update" : "update-project",
      parameters: {
        id: input.target.id,
        duplicate: "true",
        ...(input.title ? { title: input.title } : {}),
      },
    };
  const {
    when,
    checklist,
    appendChecklist,
    prependChecklist,
    heading,
    projectId,
  } = input.changes;
  if (checklist === undefined)
    return {
      command: input.target.kind === "todo" ? "update" : "update-project",
      parameters: {
        id: input.target.id,
        ...(when !== undefined ? { when } : {}),
        ...(appendChecklist
          ? { "append-checklist-items": appendChecklist.join("\n") }
          : {}),
        ...(prependChecklist
          ? { "prepend-checklist-items": prependChecklist.join("\n") }
          : {}),
        ...(heading ? { heading } : {}),
        ...(projectId ? { "list-id": projectId } : {}),
      },
    };
  const fields = {
    ...(when !== undefined ? { when } : {}),
    ...(checklist
      ? {
          "checklist-items": checklist.map((attributes) => ({
            type: "checklist-item",
            attributes,
          })),
        }
      : {}),
    ...(appendChecklist
      ? { "append-checklist-items": appendChecklist.join("\n") }
      : {}),
    ...(prependChecklist
      ? { "prepend-checklist-items": prependChecklist.join("\n") }
      : {}),
    ...(heading ? { heading } : {}),
    ...(projectId ? { "list-id": projectId } : {}),
  };
  return {
    command: "json",
    parameters: {
      data: JSON.stringify([
        {
          type: input.target.kind === "todo" ? "to-do" : "project",
          operation: "update",
          id: input.target.id,
          attributes: fields,
        },
      ]),
    },
  };
}
