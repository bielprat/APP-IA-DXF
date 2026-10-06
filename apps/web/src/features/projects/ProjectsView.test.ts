import { describe, expect, it } from "vitest";
import type { ProjectRow } from "@/server/projects";
import { filterProjects } from "./ProjectsView";

const row = (id: string, type: ProjectRow["type"], status: ProjectRow["status"]): ProjectRow => ({ id, name: id, type, status, latestVersion: 1, updatedAt: "", href: "" });
const rows = [row("a", "render", "in_progress"), row("b", "render", "approved"), row("c", "cad", "delivered")];

describe("filterProjects", () => {
  it("returns everything without filters and combines type and status", () => {
    expect(filterProjects(rows, {}).map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(filterProjects(rows, { "projectes.tipus": ["projectes.render"] }).map((item) => item.id)).toEqual(["a", "b"]);
    expect(filterProjects(rows, { "projectes.tipus": ["projectes.render"], "projectes.estat": ["projectes.aprovat"] }).map((item) => item.id)).toEqual(["b"]);
  });
});
