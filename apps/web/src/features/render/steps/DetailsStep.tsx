"use client";

import { getGroup, resolveGroup, type CatalogCategory } from "@cr/catalog";
import { useState } from "react";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { Dropzone } from "@/components/ui/Dropzone";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { RENDER_ACCEPT, useRenderFlow } from "../RenderFlowProvider";
import { detailTabs, detailsBlockedReason, invalidDetailTabs, vegetationReferences } from "../state";
import { ImagePreview } from "./ImagePreview";
import { UploadErrors } from "@/components/ui/UploadErrors";

const COPY_GROUP = getGroup("vegetacio.copiar");

function VegetationReferences() {
  const { state, dispatch, addImages, uploadErrors } = useRenderFlow();
  const references = vegetationReferences(state);

  return (
    <>
      <Panel aria-labelledby="suggested-title">
        <h3 id="suggested-title" className="text-base font-semibold">
          Referències suggerides
        </h3>
        <p className="text-sm text-text-muted">Se&apos;n trien automàticament entre 1 i 3 de la biblioteca de l&apos;empresa.</p>
        <Notice>La biblioteca de vegetació encara no té referències. La selecció automàtica s&apos;activa a la fase 4.</Notice>
      </Panel>

      <Panel aria-labelledby="own-reference-title">
        <h3 id="own-reference-title" className="text-base font-semibold">
          La teva referència de vegetació
        </h3>
        {references.map((image) => (
          <div key={image.id} className="flex flex-wrap gap-4 border-b border-border pb-4 last:border-b-0">
            <div className="h-[110px] w-[180px] shrink-0 overflow-hidden rounded-[10px] bg-bg-page">
              <ImagePreview url={image.url} alt={`Referència de vegetació ${image.name}`} />
            </div>
            <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-mono text-[13px]">{image.name}</p>
                <button
                  type="button"
                  aria-label={`Treure ${image.name}`}
                  onClick={() => dispatch({ type: "removeImage", id: image.id })}
                  className="flex size-11 items-center justify-center rounded-lg hover:bg-bg-page"
                >
                  <Icon name="trash" />
                </button>
              </div>
              <OptionGroup
                group={{ ...COPY_GROUP, min: 1 }}
                selected={image.vegetationCopy ?? []}
                onChange={(copy) => dispatch({ type: "setVegetationCopy", id: image.id, copy })}
              />
            </div>
          </div>
        ))}
        <Dropzone compact multiple={false} label="Afegir referència de vegetació" accept={RENDER_ACCEPT} onFiles={(files) => addImages(files, "vegetation")} />
        <UploadErrors errors={uploadErrors} />
      </Panel>
    </>
  );
}

function CategoryTab({ category }: { category: CatalogCategory }) {
  const { state, dispatch } = useRenderFlow();
  return (
    <>
      {category.groups
        .filter((group) => group.id !== COPY_GROUP.id)
        .map((group) => (
          <OptionGroup
            key={group.id}
            group={group}
            selected={resolveGroup(state.details, group)}
            onChange={(selected) => dispatch({ type: "setDetail", groupId: group.id, selected })}
          />
        ))}
      {category.note && <Notice>{category.note}</Notice>}
      {category.category === "vegetacio" && <VegetationReferences />}
    </>
  );
}

export function DetailsStep() {
  const { state } = useRenderFlow();
  const tabs = detailTabs(state);
  const invalid = invalidDetailTabs(state);
  const [active, setActive] = useState<string | null>(null);
  const current = tabs.some((tab) => tab.category === active) ? active! : tabs[0]?.category;

  return (
    <>
      {tabs.length === 0 ? (
        <Notice>Les millores que has triat no necessiten més detalls. Pots continuar.</Notice>
      ) : (
        <Panel>
          <Tabs
            label="Categories triades"
            value={current ?? ""}
            onValueChange={setActive}
            items={tabs.map((tab) => ({
              id: tab.category,
              label: tab.label,
              incomplete: invalid.includes(tab.category),
              content: <CategoryTab category={tab} />,
            }))}
          />
        </Panel>
      )}
      <FlowFooter backHref="/render/improve" nextHref="/render/generate" blockedReason={detailsBlockedReason(state)} />
    </>
  );
}
