"use client";

import { libraryCatalog, type Selection } from "@cr/catalog";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button-styles";
import { FilterBar } from "@/components/ui/FilterBar";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";

export function VegetationLibraryView() {
  const [filters, setFilters] = useState<Selection>({});
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={buttonStyles.primary} disabled aria-describedby="add-reference-note">
          <Icon name="plus" />
          Afegir referència
        </button>
        <p id="add-reference-note" className="text-sm text-text-muted">
          La càrrega de referències s&apos;activa a la fase 4.
        </p>
      </div>
      <Panel aria-label="Filtres">
        <FilterBar groups={libraryCatalog.vegetation.groups} value={filters} onChange={setFilters} />
      </Panel>
      <Panel aria-labelledby="library-grid-title">
        <h2 id="library-grid-title" className="text-xl font-semibold">
          Referències
        </h2>
        <p className="text-[15px] text-text-muted">La biblioteca encara no té cap referència.</p>
      </Panel>
    </>
  );
}
