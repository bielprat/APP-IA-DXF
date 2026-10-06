"use client";

import { renderCatalog } from "@cr/catalog";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { ChipButton } from "@/components/ui/ChipButton";
import { Dropzone } from "@/components/ui/Dropzone";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";
import { RENDER_ACCEPT, useRenderFlow } from "../RenderFlowProvider";
import { baseImage, uploadBlockedReason } from "../state";
import { ImagePreview } from "./ImagePreview";
import { UploadErrors } from "@/components/ui/UploadErrors";

const ROLES = renderCatalog.imageRoles.groups[0].options;

export function UploadStep() {
  const { state, dispatch, addImages, uploading, uploadErrors } = useRenderFlow();
  const base = baseImage(state);

  return (
    <>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <Panel aria-labelledby="upload-title">
            <h2 id="upload-title" className="text-xl font-semibold">
              Puja el render que vols millorar
            </h2>
            {base ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-bg-page">
                <ImagePreview url={base.url} alt={`Vista prèvia de ${base.name}`} />
                <span className="absolute top-4 left-4 rounded-full bg-brand-orange px-3 py-1 text-[13px] font-semibold">Imatge base</span>
              </div>
            ) : (
              <Dropzone label="Arrossega el render aquí o selecciona'l" hint="PNG · JPG" accept={RENDER_ACCEPT} onFiles={(files) => addImages(files)} />
            )}
            {uploading && (
              <p role="status" className="text-[15px] font-medium">
                Pujant imatges…
              </p>
            )}
            <UploadErrors errors={uploadErrors} />
          </Panel>

          {state.images.length > 0 && (
            <section aria-labelledby="uploaded-title" className="flex flex-col gap-3">
              <h2 id="uploaded-title" className="text-base font-semibold">
                Imatges pujades
              </h2>
              <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {state.images.map((image) => (
                  <li key={image.id} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3">
                    <div className="h-[110px] overflow-hidden rounded-[10px] bg-bg-page">
                      <ImagePreview url={image.url} alt="" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-[13px]" title={image.name}>
                        {image.name}
                      </p>
                      <button
                        type="button"
                        aria-label={`Treure ${image.name}`}
                        onClick={() => dispatch({ type: "removeImage", id: image.id })}
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-bg-page"
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                    <div role="group" aria-label={`Rol de ${image.name}`} className="flex flex-wrap gap-1.5">
                      {ROLES.map((role) => (
                        <ChipButton
                          key={role.id}
                          label={role.label}
                          selected={image.role === role.id}
                          onClick={() => dispatch({ type: "setRole", id: image.id, role: role.id })}
                        />
                      ))}
                    </div>
                  </li>
                ))}
                <li>
                  <Dropzone compact label="Arrossega aquí una altra imatge" accept={RENDER_ACCEPT} onFiles={(files) => addImages(files)} />
                </li>
              </ul>
            </section>
          )}
        </div>

        <aside aria-label="Ajuda" className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 md:max-w-[360px]">
          <Panel aria-labelledby="roles-help">
            <h2 id="roles-help" className="text-base font-semibold">
              Per a què serveix cada imatge
            </h2>
            {ROLES.map((role) => (
              <div key={role.id} className="flex flex-col gap-1">
                <p className="text-[15px] font-semibold">{role.label}</p>
                <p className="text-sm leading-snug text-text-muted">{role.description}</p>
              </div>
            ))}
          </Panel>
        </aside>
      </div>

      <FlowFooter
        status={state.images.length === 0 ? undefined : `${state.images.length} ${state.images.length === 1 ? "imatge" : "imatges"}${base ? "" : " · cap imatge base"}`}
        nextHref="/render/improve"
        blockedReason={uploading ? "Espera que acabin de pujar les imatges." : uploadBlockedReason(state)}
      />
    </>
  );
}
