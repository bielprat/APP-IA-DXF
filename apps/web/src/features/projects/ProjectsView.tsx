"use client";

import { projectsCatalog, type Selection } from "@cr/catalog";
import { useState } from "react";
import { FilterBar } from "@/components/ui/FilterBar";
import { Panel } from "@/components/ui/Panel";
import { ScrollRegion } from "@/components/ui/ScrollRegion";

export function ProjectsView() {
  const [filters, setFilters] = useState<Selection>({});
  return (
    <>
      <Panel aria-label="Filtres">
        <FilterBar groups={projectsCatalog.filters.groups} value={filters} onChange={setFilters} />
      </Panel>
      <Panel aria-labelledby="projects-list-title">
        <h2 id="projects-list-title" className="text-xl font-semibold">
          Projectes
        </h2>
        <ScrollRegion label="Taula de projectes">
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-border text-xs tracking-wider text-text-muted uppercase">
                <th scope="col" className="py-3 font-medium">Projecte</th>
                <th scope="col" className="py-3 font-medium">Tipus</th>
                <th scope="col" className="py-3 font-medium">Última versió</th>
                <th scope="col" className="py-3 font-medium">Estat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-6 text-text-muted">
                  Encara no hi ha projectes. Es creen automàticament quan es genera un render o un model.
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollRegion>
      </Panel>
    </>
  );
}
