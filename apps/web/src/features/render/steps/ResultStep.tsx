"use client";

import { renderCatalog } from "@cr/catalog";
import { useState } from "react";
import { CompareSlider } from "@/components/flow/CompareSlider";
import { buttonStyles } from "@/components/ui/button-styles";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { useRenderFlow } from "../RenderFlowProvider";
import { baseImage } from "../state";
import { ImagePreview, PlaceholderBox } from "./ImagePreview";
import { RenderSummary } from "./RenderSummary";

const CORRECTIONS = renderCatalog.corrections.groups[0];

const ACTIONS: { label: string; icon: IconName }[] = [
  { label: "Descarregar", icon: "download" },
  { label: "Aprovar", icon: "check" },
  { label: "Tornar a generar", icon: "refresh" },
  { label: "Fer una correcció", icon: "edit" },
  { label: "Tornar a l'original", icon: "undo" },
];

export function ResultStep() {
  const { state } = useRenderFlow();
  const base = baseImage(state);
  const [corrections, setCorrections] = useState<string[]>([]);

  return (
    <>
      <Notice variant="warning" title="La generació encara no està connectada">
        Aquesta pantalla mostra l&apos;original i la configuració triada. El resultat apareixerà quan s&apos;activi la generació d&apos;imatges.
      </Notice>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <Panel>
            <CompareSlider
              before={base ? <ImagePreview url={base.url} alt={`Original: ${base.name}`} /> : <PlaceholderBox label="Torna a pujar el render original" />}
              after={<PlaceholderBox label="Encara no hi ha cap resultat generat" />}
            />
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <button key={action.label} type="button" disabled className={buttonStyles.secondary}>
                  <Icon name={action.icon} />
                  {action.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel aria-labelledby="corrections-title">
            <div className="flex flex-col gap-1">
              <h2 id="corrections-title" className="text-base font-semibold">
                Correccions ràpides
              </h2>
              <p className="text-sm text-text-muted">Tria què no t&apos;agrada i es corregeix només això. No cal escriure res.</p>
            </div>
            <OptionGroup group={CORRECTIONS} title="Què vols corregir?" selected={corrections} onChange={setCorrections} />
          </Panel>
        </div>

        <aside aria-label="Versions i configuració" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 md:max-w-[380px]">
          <Panel aria-labelledby="versions-title">
            <h2 id="versions-title" className="text-base font-semibold">
              Versions
            </h2>
            <p className="text-sm text-text-muted">Encara no hi ha versions generades.</p>
          </Panel>
          <Panel>
            <RenderSummary title="Configuració aplicada" />
          </Panel>
        </aside>
      </div>
    </>
  );
}
