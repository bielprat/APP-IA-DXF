"use client";

import { getGroup, renderCatalog } from "@cr/catalog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotesField } from "@/components/flow/NotesField";
import { buttonStyles } from "@/components/ui/button-styles";
import { Dropzone } from "@/components/ui/Dropzone";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { RENDER_ACCEPT, useRenderFlow } from "../RenderFlowProvider";
import { generateBlockedReason, referenceImages } from "../state";
import { ImagePreview } from "./ImagePreview";
import { RenderSummary } from "./RenderSummary";
import { UploadErrors } from "@/components/ui/UploadErrors";

const FIDELITY = renderCatalog.fidelity.groups[0];
const PURPOSE = getGroup("referencies.finalitat");
const TAKE = getGroup("referencies.aprofitar");

export function GenerateStep() {
  const { state, dispatch, addImages, uploadErrors } = useRenderFlow();
  const router = useRouter();
  const blocked = generateBlockedReason(state);
  const references = referenceImages(state);

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
        <Panel>
          <OptionGroup
            group={FIDELITY}
            headingLevel="h2"
            minCardWidth={240}
            selected={[state.fidelity]}
            onChange={(selected) => dispatch({ type: "setFidelity", id: selected[0] })}
          />
        </Panel>

        <Panel aria-labelledby="references-title">
          <h2 id="references-title" className="text-base font-semibold">
            Referències <span className="font-normal text-text-muted">· opcional</span>
          </h2>
          {references.map((image) => (
            <div key={image.id} className="flex flex-wrap gap-4 border-b border-border pb-5">
              <div className="h-[110px] w-[180px] shrink-0 overflow-hidden rounded-[10px] bg-bg-page">
                <ImagePreview url={image.url} alt="" />
              </div>
              <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                <p className="truncate font-mono text-[13px]">{image.name}</p>
                <OptionGroup
                  group={PURPOSE}
                  selected={image.purpose ? [image.purpose] : []}
                  onChange={(selected) => dispatch({ type: "setPurpose", id: image.id, purpose: selected[0] })}
                />
                <OptionGroup group={TAKE} selected={image.take} onChange={(take) => dispatch({ type: "setTake", id: image.id, take })} />
              </div>
            </div>
          ))}
          <Dropzone compact label="Afegir imatge de referència" accept={RENDER_ACCEPT} onFiles={(files) => addImages(files)} />
          <UploadErrors errors={uploadErrors} />
        </Panel>

        <NotesField value={state.notes} onChange={(notes) => dispatch({ type: "setNotes", notes })} />
      </div>

      <aside aria-label="Resum" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 md:sticky md:top-6 md:max-w-[380px]">
        <Panel>
          <RenderSummary />
          {blocked && (
            <p id="generate-blocked" className="text-sm font-medium">
              {blocked}
            </p>
          )}
          <button
            type="button"
            className={buttonStyles.generate}
            disabled={Boolean(blocked)}
            aria-describedby={blocked ? "generate-blocked" : undefined}
            onClick={() => router.push("/render/result/draft")}
          >
            Generar
          </button>
        </Panel>
        <Link href="/render/details" className={buttonStyles.secondary}>
          Enrere
        </Link>
      </aside>
    </div>
  );
}
