"use client";

import { cadCatalog } from "@cr/catalog";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { Dropzone } from "@/components/ui/Dropzone";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { UploadErrors } from "@/components/ui/UploadErrors";
import { CAD_ACCEPT, useCadFlow } from "../CadFlowProvider";
import { MODE_PRECISE, hasTechnicalSources, isReview, uploadBlockedReason } from "../state";

const MODES = cadCatalog.modes.groups[0];
const SOURCE_TYPES = cadCatalog.sourceTypes.groups[0];

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

export function UploadStep() {
  const { state, dispatch, addFiles, uploadErrors } = useCadFlow();
  const technical = hasTechnicalSources(state);

  return (
    <>
      <section aria-labelledby="mode-title" className="flex flex-col gap-3">
        <h2 id="mode-title" className="text-base font-semibold">
          {MODES.title}
        </h2>
        <div role="group" aria-labelledby="mode-title" className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
          {MODES.options.map((mode) => (
            <CategoryCard
              key={mode.id}
              title={mode.label}
              description={mode.description}
              icon={mode.icon}
              selected={state.mode === mode.id}
              onSelect={() => dispatch({ type: "setMode", mode: mode.id })}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Panel aria-labelledby="sources-title" className="min-w-0 flex-[999_1_520px]">
          <h2 id="sources-title" className="text-xl font-semibold">
            Fonts del projecte
          </h2>
          <Dropzone compact={state.files.length > 0} label="Arrossega plànols, imatges o topografia aquí" hint="DWG · DXF · PDF · PNG · JPG" accept={CAD_ACCEPT} onFiles={addFiles} />
          <UploadErrors errors={uploadErrors} />
          {state.files.length > 0 && (
            <ul className="flex flex-col gap-3">
              {state.files.map((file) => (
                <li key={file.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon name="file" />
                      <p className="truncate font-mono text-[14px]" title={file.name}>
                        {file.name}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-text-muted">{formatSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Treure ${file.name}`}
                      onClick={() => dispatch({ type: "removeFile", id: file.id })}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-bg-page"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                  <OptionGroup
                    group={SOURCE_TYPES}
                    title={`Tipus de «${file.name}»`}
                    selected={file.sourceType ? [file.sourceType] : []}
                    onChange={(selected) => dispatch({ type: "setSourceType", id: file.id, sourceType: selected[0] })}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <aside aria-label="Avisos" className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 md:max-w-[380px]">
          {state.files.length > 0 && !technical && (
            <Notice variant="warning" title="Sense plànols ni cotes">
              {state.mode === MODE_PRECISE
                ? "Per a un model precís calen plànols, alçats o seccions. Amb només imatges, el model serà aproximat i les mesures inferides s'etiquetaran com a estimades."
                : "Es pot modelar igualment a partir d'imatges. El model serà aproximat i totes les mesures inferides s'etiquetaran com a estimades."}
            </Notice>
          )}
          <Notice title="Si hi ha cotes escrites">
            Les cotes escrites manen sobre les mesures gràfiques. Si dues fonts es contradiuen, t&apos;ho direm abans de modelar.
          </Notice>
          {isReview(state) && <Notice title="Mode revisió">Només es genera un informe de la documentació. No es crea cap fitxer DXF.</Notice>}
        </aside>
      </div>

      <FlowFooter
        status={state.files.length === 0 ? undefined : state.files.length === 1 ? "1 fitxer" : `${state.files.length} fitxers`}
        nextHref="/cad/elements"
        blockedReason={uploadBlockedReason(state)}
      />
    </>
  );
}
