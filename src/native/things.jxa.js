ObjC.import("Foundation");

// biome-ignore lint/correctness/noUnusedVariables: Entry point invoked by osascript.
function run() {
  function fail(code) {
    throw new Error(code);
  }
  try {
    const data = $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFile;
    const text = ObjC.unwrap(
      $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding),
    );
    const request = JSON.parse(text);
    const app = Application("com.culturedcode.ThingsMac");
    if (!app.running()) fail("APP_UNAVAILABLE");

    function collection(kind) {
      switch (kind) {
        case "todo":
          return app.toDos;
        case "project":
          return app.projects;
        case "area":
          return app.areas;
        case "tag":
          return app.tags;
        default:
          return fail("INVALID_INPUT");
      }
    }
    function resolve(reference) {
      const item = collection(reference.kind).byId(reference.id);
      if (!item.exists()) fail("NOT_FOUND");
      if (reference.kind === "todo" && app.projects.byId(reference.id).exists())
        fail("INVALID_INPUT");
      return item;
    }
    function dateOnly(value) {
      if (!value?.getFullYear || !Number.isFinite(value.getTime())) return null;
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }
    function localDate(value) {
      const parts = value.split("-").map(Number);
      const date = new Date(0);
      date.setFullYear(parts[0], parts[1] - 1, parts[2]);
      date.setHours(12, 0, 0, 0);
      return date;
    }
    function parentId(property) {
      const parent = property();
      if (!parent) return null;
      return parent.id() || null;
    }
    function serialize(item, kind) {
      const result = { kind: kind, id: item.id(), title: item.name() };
      if (kind === "todo" || kind === "project") {
        result.notes = item.notes() || "";
        result.status = item.status();
        result.deadline = dateOnly(item.dueDate());
        result.scheduledDate = dateOnly(item.activationDate());
        result.areaId = parentId(item.area);
        if (kind === "todo") result.projectId = parentId(item.project);
        result.tagNames = item.tagNames() || "";
      } else if (kind === "area") {
        result.tagNames = item.tagNames() || "";
      } else {
        result.parentTagId = parentId(item.parentTag);
        result.keyboardShortcut = item.keyboardShortcut() || "";
      }
      return result;
    }
    let result;
    const input = request.input;
    switch (request.operation) {
      case "health":
        result = {
          version: app.version(),
          running: true,
          timezone: ObjC.unwrap($.NSTimeZone.localTimeZone.name),
        };
        break;
      case "get":
        result = serialize(resolve(input), input.kind);
        break;
      case "find": {
        const objects = collection(input.kind)();
        const projectIds = input.kind === "todo" ? app.projects.id() : [];
        const targetCount = input.offset + input.limit + 1;
        const matches = [];
        let scanned = 0;
        for (; scanned < Math.min(objects.length, 5000); scanned++) {
          const object = objects[scanned];
          if (input.kind === "todo" && projectIds.indexOf(object.id()) >= 0)
            continue;
          const item = serialize(object, input.kind);
          if (input.status && item.status !== input.status) continue;
          const searchable = `${item.title}\n${item.notes || ""}`.toLowerCase();
          if (input.text && searchable.indexOf(input.text.toLowerCase()) < 0)
            continue;
          matches.push(item);
          if (matches.length >= targetCount) {
            scanned++;
            break;
          }
        }
        const hasMore = matches.length > input.offset + input.limit;
        result = {
          items: matches.slice(input.offset, input.offset + input.limit),
          hasMore: hasMore,
          scanComplete: scanned >= objects.length,
          nextOffset: hasMore ? input.offset + input.limit : null,
        };
        break;
      }
      case "create": {
        const properties = { name: input.title };
        if (input.notes !== undefined) properties.notes = input.notes;
        let item;
        switch (input.kind) {
          case "todo":
            item = app.ToDo(properties);
            break;
          case "project":
            item = app.Project(properties);
            break;
          case "area":
            item = app.Area(properties);
            break;
          case "tag":
            item = app.Tag(properties);
            break;
          default:
            fail("INVALID_INPUT");
        }
        collection(input.kind).push(item);
        result = { kind: input.kind, id: item.id() };
        break;
      }
      case "update": {
        const item = resolve(input.target);
        const changes = input.changes;
        if (changes.title !== undefined) item.name = changes.title;
        if (changes.notes !== undefined) item.notes = changes.notes;
        if (changes.status !== undefined) item.status = changes.status;
        if (changes.deadline !== undefined) {
          if (changes.deadline === null) app.delete(item.dueDate);
          else item.dueDate = localDate(changes.deadline);
        }
        result = input.target;
        break;
      }
      case "schedule":
        app.schedule(resolve(input.target), { for: localDate(input.date) });
        result = input.target;
        break;
      default:
        fail("INVALID_INPUT");
    }
    return JSON.stringify({ ok: true, result: result });
  } catch (error) {
    const allowed = ["APP_UNAVAILABLE", "NOT_FOUND", "INVALID_INPUT"];
    const code =
      Number(error.errorNumber) === -1743
        ? "AUTOMATION_DENIED"
        : allowed.indexOf(error.message) >= 0
          ? error.message
          : "NATIVE_FAILURE";
    return JSON.stringify({ ok: false, code: code });
  }
}
