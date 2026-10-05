"use client";

import { cadCatalog } from "@cr/catalog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotesField } from "@/components/flow/NotesField";
import { buttonStyles } from "@/components/ui/button-styles";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { useCadFlow } from "../CadFlowProvider";
import { formatSelection, generateBlockedReason, isReview } from "../state";
import { CadSummary } from "./CadSummary";

export function GenerateStep() {
  const { state, dispatch } = useCadFlow();
  const router = useRouter();
  const blocked = generateBlockedReason(state);
  const review = isReview(state);
  const dwg = formatSelection(state, "cad-format.format")[0] === "cad-format.dwg";

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
        {review ? (
          <Notice title="Revisar la documentació">
            Es revisaran les fonts per detectar contradiccions, ambigüitats, dades que falten i riscos. No es generarà cap fitxer.
          </Notice>
        ) : (
          <Panel>
            {cadCatalog.format.groups.map((group) => (
              <OptionGroup
                key={group.id}
                group={group}
                headingLevel="h2"
                minCardWidth={200}
                selected={formatSelection(state, group.id)}
                onChange={(selected) => dispatch({ type: "setFormat", groupId: group.id, selected })}
              />
            ))}
            {dwg && (
              <Notice variant="warning">
                El DWG només es lliura si es pot convertir i verificar. Si no, es lliura un DXF 3D compatible i s&apos;explica com convertir-lo amb AutoCAD o
                Allplan.
              </Notice>
            )}
          </Panel>
        )}
        <NotesField value={state.notes} onChange={(notes) => dispatch({ type: "setNotes", notes })} />
      </div>

      <aside aria-label="Resum" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 md:sticky md:top-6 md:max-w-[380px]">
        <Panel>
          <CadSummary />
          {!review && (
            <div className="flex flex-col gap-1 rounded-xl bg-bg-page p-3 text-sm">
              <p className="font-semibold">Abans de lliurar</p>
              <p className="text-text-muted">
                Es revisen geometria, unitats, coordenades, capes i colors. S&apos;adjunta una nota amb les capes, els elements pendents i les mesures estimades.
              </p>
            </div>
          )}
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
            onClick={() => router.push("/cad/result/draft")}
          >
            {review ? "Revisar la documentació" : "Generar model"}
          </button>
        </Panel>
        <Link href="/cad/parameters" className={buttonStyles.secondary}>
          Enrere
        </Link>
      </aside>
    </div>
  );
}
