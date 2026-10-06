"use client";

import { projectsCatalog, type Selection } from "@cr/catalog";
import { useState } from "react";
import { FilterBar } from "@/components/ui/FilterBar";
import { Panel } from "@/components/ui/Panel";
import type { ProjectRow } from "@/server/projects";
import { ProjectTable } from "./ProjectTable";

const TYPE_FILTER: Record<string, ProjectRow["type"]> = { "projectes.render": "render", "projectes.model": "cad" };
const STATUS_FILTER: Record<string, ProjectRow["status"]> = {
  "projectes.en-curs": "in_progress",
  "projectes.aprovat": "approved",
  "projectes.lliurat": "delivered",
};

export function filterProjects(rows: ProjectRow[], filters: Selection): ProjectRow[] {
  const types = (filters["projectes.tipus"] ?? []).map((id) => TYPE_FILTER[id]);
  const statuses = (filters["projectes.estat"] ?? []).map((id) => STATUS_FILTER[id]);
  return rows.filter((row) => (types.length === 0 || types.includes(row.type)) && (statuses.length === 0 || statuses.includes(row.status)));
}

export function ProjectsView({ rows }: { rows: ProjectRow[] }) {
  const [filters, setFilters] = useState<Selection>({});
  const visible = filterProjects(rows, filters);
  return (
    <>
      <Panel aria-label="Filtres">
        <FilterBar groups={projectsCatalog.filters.groups} value={filters} onChange={setFilters} />
      </Panel>
      <Panel aria-labelledby="projects-list-title">
        <h2 id="projects-list-title" className="text-xl font-semibold">
          Projectes
        </h2>
        <ProjectTable
          rows={visible}
          empty={rows.length === 0 ? "Encara no hi ha projectes. Es creen automàticament quan es puja un render o un model." : "Cap projecte coincideix amb els filtres."}
        />
      </Panel>
    </>
  );
}
