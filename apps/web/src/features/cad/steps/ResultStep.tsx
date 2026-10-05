"use client";

import { cadCatalog, getOption } from "@cr/catalog";
import { useState } from "react";
import { ChipButton } from "@/components/ui/ChipButton";
import { buttonStyles } from "@/components/ui/button-styles";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { ScrollRegion } from "@/components/ui/ScrollRegion";
import { PlaceholderBox } from "@/features/render/steps/ImagePreview";
import { useCadFlow } from "../CadFlowProvider";
import { deliveryFileName, dimensionRows, formatSelection, isReview, layersFor } from "../state";
import { CadSummary } from "./CadSummary";

const CORRECTIONS = cadCatalog.corrections.groups[0];
const VIEWS = ["Perspectiva", "Planta", "Alçat"] as const;
const QC_CHECKS = [
  "Unitats i coordenades conservades",
  "Dimensions inferides marcades com a estimades",
  "Sense cares degenerades ni duplicats",
  "Topografia i urbanització com a entitats separades",
  "Logos: forma i nombre d'elements",
];
const ACTIONS: { label: string; icon: IconName }[] = [
  { label: "Descarregar DXF", icon: "download" },
  { label: "Nota tècnica", icon: "file" },
  { label: "Aprovar", icon: "check" },
  { label: "Tornar a generar", icon: "refresh" },
  { label: "Fer una correcció", icon: "edit" },
];
const REVIEW_SECTIONS = ["Contradiccions", "Ambigüitats", "Dades que falten", "Riscos"];

function ReviewReport() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="grid min-w-0 flex-[999_1_520px] gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {REVIEW_SECTIONS.map((section) => (
          <Panel key={section} aria-label={section}>
            <h2 className="text-base font-semibold">{section}</h2>
            <p className="text-sm text-text-muted">Pendent d&apos;analitzar.</p>
          </Panel>
        ))}
      </div>
      <aside className="min-w-0 flex-[1_1_300px] md:max-w-[380px]">
        <Panel>
          <CadSummary title="Documentació revisada" />
        </Panel>
      </aside>
    </div>
  );
}

export function ResultStep() {
  const { state } = useCadFlow();
  const [view, setView] = useState<(typeof VIEWS)[number]>("Perspectiva");
  const [hidden, setHidden] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<string[]>([]);
  const layers = layersFor(state);
  const units = getOption(formatSelection(state, "cad-format.unitats")[0]);
  const origin = getOption(formatSelection(state, "cad-format.coordenades")[0]);
  const dwg = formatSelection(state, "cad-format.format")[0] === "cad-format.dwg";
  const visible = layers.filter((layer) => !hidden.includes(layer.name)).length;

  return (
    <>
      <Notice variant="warning" title="La generació del model encara no està connectada">
        Aquesta pantalla mostra la configuració triada. El fitxer, el visor 3D i el control de qualitat apareixeran quan s&apos;activi el servei CAD.
      </Notice>

      {isReview(state) ? (
        <ReviewReport />
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
            <Panel>
              <div className="aspect-video overflow-hidden rounded-xl">
                <PlaceholderBox label={`Visor 3D · ${view} · encara no hi ha cap model generat`} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Vista" className="flex flex-wrap gap-2">
                  {VIEWS.map((item) => (
                    <ChipButton key={item} label={item} selected={view === item} onClick={() => setView(item)} />
                  ))}
                </div>
                <p className="font-mono text-sm text-text-muted">
                  Unitats: {units.short} · {visible} de {layers.length} capes visibles
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <button key={action.label} type="button" disabled className={buttonStyles.secondary}>
                    <Icon name={action.icon} />
                    {action.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel aria-labelledby="cad-corrections-title">
              <div className="flex flex-col gap-1">
                <h2 id="cad-corrections-title" className="text-base font-semibold">
                  Correccions ràpides
                </h2>
                <p className="text-sm text-text-muted">Tria què cal ajustar i només es corregeix això. La resta del model es manté.</p>
              </div>
              <OptionGroup group={CORRECTIONS} title="Què cal ajustar?" selected={corrections} onChange={setCorrections} />
            </Panel>

            <Panel aria-labelledby="dimensions-title">
              <h2 id="dimensions-title" className="text-base font-semibold">
                Dimensions i origen de cada dada
              </h2>
              <ScrollRegion label="Taula de dimensions">
                <table className="w-full min-w-[480px] text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-border text-xs tracking-wider text-text-muted uppercase">
                      <th scope="col" className="py-2 font-medium">Element</th>
                      <th scope="col" className="py-2 font-medium">Valor</th>
                      <th scope="col" className="py-2 font-medium">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensionRows(state).map((row) => (
                      <tr key={row.element} className="border-b border-border last:border-b-0">
                        <td className="py-3">{row.element}</td>
                        <td className="py-3 font-mono">{row.value}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${row.origin === "Estimat" ? "bg-tint-orange" : "bg-tint-gray"}`}>{row.origin}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
              <Notice>Les contradiccions entre fonts es mostraran aquí quan s&apos;analitzin els fitxers.</Notice>
            </Panel>
          </div>

          <aside aria-label="Capes, control i lliurament" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 md:max-w-[380px]">
            <Panel aria-labelledby="layers-title">
              <h2 id="layers-title" className="text-base font-semibold">
                Capes
              </h2>
              <ul className="flex flex-col gap-1">
                {layers.map((layer) => {
                  const on = !hidden.includes(layer.name);
                  return (
                    <li key={layer.name}>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${layer.label} (${layer.name}): ${on ? "visible" : "amagada"}`}
                        onClick={() => setHidden((current) => (on ? [...current, layer.name] : current.filter((name) => name !== layer.name)))}
                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-bg-page"
                      >
                        <span aria-hidden="true" className="size-4 shrink-0 rounded border border-border-strong" style={{ background: layer.displayColor }} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={`text-[15px] ${on ? "" : "text-text-muted line-through"}`}>{layer.label}</span>
                          <span className="font-mono text-xs text-text-muted">{layer.name}</span>
                        </span>
                        <Icon name={on ? "eye" : "eye-off"} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel aria-labelledby="qc-title">
              <h2 id="qc-title" className="text-base font-semibold">
                Control de qualitat
              </h2>
              <ul className="flex flex-col gap-2 text-[15px]">
                {QC_CHECKS.map((check) => (
                  <li key={check} className="flex items-start justify-between gap-3">
                    <span>{check}</span>
                    <span className="shrink-0 rounded-full bg-tint-gray px-2.5 py-0.5 text-xs font-medium">Pendent</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel aria-labelledby="delivery-title">
              <h2 id="delivery-title" className="text-base font-semibold">
                Lliurament
              </h2>
              <p className="font-mono text-[15px] break-all">{deliveryFileName(state)}</p>
              <p className="text-sm text-text-muted">
                DXF 3D editable · unitats {units.short} · {origin.label.toLowerCase()}. Inclou una nota amb capes, elements pendents i comprovacions fetes.
              </p>
              {dwg && <p className="text-sm text-text-muted">Si el DWG no es pot verificar, es lliura un DXF compatible i es recomana convertir-lo amb AutoCAD o Allplan.</p>}
            </Panel>
          </aside>
        </div>
      )}
    </>
  );
}
