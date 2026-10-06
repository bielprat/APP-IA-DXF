"use client";

import { renderCatalog } from "@cr/catalog";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CompareSlider } from "@/components/flow/CompareSlider";
import { NotesField } from "@/components/flow/NotesField";
import { RegionEditor } from "@/components/flow/RegionEditor";
import { buttonStyles } from "@/components/ui/button-styles";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { apiFetch, postJson } from "@/lib/client/api";
import type { Region } from "../jobRequest";
import { ACTIVE_JOB_STATUSES, JOB_STATUS_LABELS, type QcCheckView, type RenderProjectView, type VersionView } from "../projectView";
import { useRenderFlow } from "../RenderFlowProvider";
import { ImagePreview, PlaceholderBox } from "./ImagePreview";

const CORRECTIONS = renderCatalog.corrections.groups[0];
const ZONE = "correccions.nomes-aquesta-zona";
const POLL_MS = 1500;

const QC_STATUS: Record<QcCheckView["status"], { label: string; className: string }> = {
  ok: { label: "Correcte", className: "bg-tint-gray" },
  deviation: { label: "Desviació", className: "bg-brand-orange font-semibold" },
  unsure: { label: "No verificat", className: "bg-tint-orange" },
};

function versionLabel(version: VersionView): string {
  if (version.kind === "restore") return "original";
  if (version.kind === "correction") return version.parentNumber ? `correcció de V${version.parentNumber}` : "correcció";
  return "generació";
}

function QualityPanel({ version }: { version: VersionView }) {
  if (!version.qc) return null;
  const { status, checks } = version.qc;
  return (
    <Panel aria-labelledby="qc-title">
      <h2 id="qc-title" className="text-base font-semibold">
        Control de qualitat · V{version.number}
      </h2>
      {status === "warning" && (
        <Notice variant="warning" title="S'han detectat desviacions">
          Revisa les comprovacions marcades i, si cal, fes una correcció de la zona afectada.
        </Notice>
      )}
      {status === "unverified" && (
        <Notice variant="warning" title="No s'ha pogut verificar tot">
          Algunes comprovacions no s&apos;han pogut fer. Revisa el resultat abans d&apos;aprovar-lo.
        </Notice>
      )}
      <ul className="flex flex-col gap-2 text-[15px]">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start justify-between gap-3">
            <span className="flex flex-col">
              <span>{check.label}</span>
              {check.detail && <span className="text-sm text-text-muted">{check.detail}</span>}
            </span>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${QC_STATUS[check.status].className}`}>{QC_STATUS[check.status].label}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function RenderResultView({ initial }: { initial: RenderProjectView }) {
  const router = useRouter();
  const { dispatch } = useRenderFlow();
  const [view, setView] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.versions.at(-1)?.id ?? null);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [area, setArea] = useState<Region | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const active = view.latestJob !== null && ACTIVE_JOB_STATUSES.includes(view.latestJob.status);
  const selected = view.versions.find((version) => version.id === selectedId) ?? view.versions.at(-1) ?? null;

  const refresh = useCallback(async () => {
    const next = await apiFetch<RenderProjectView>(`/api/render/projects/${view.id}`);
    setView((previous) => {
      if (next.versions.length > previous.versions.length) setSelectedId(next.versions.at(-1)!.id);
      return next;
    });
  }, [view.id]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No s'ha pogut completar l'operació.");
    } finally {
      setBusy(false);
    }
  };

  const correctionBlocked =
    corrections.length === 0 && !notes.trim() ? "Tria què vols corregir." : corrections.includes(ZONE) && !area ? "Marca la zona que vols millorar." : null;
  const disabled = busy || active;

  const submitCorrection = () =>
    run(async () => {
      await postJson("/api/render/jobs", {
        kind: "correction",
        projectId: view.id,
        input: { sourceVersionId: selected!.id, corrections, notes, area: corrections.includes(ZONE) ? area : null },
      });
      setCorrections([]);
      setNotes("");
      setArea(null);
    });

  return (
    <>
      {active && view.latestJob && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-orange bg-tint-orange px-5 py-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="size-5 animate-spin rounded-full border-[3px] border-brand-black border-t-transparent" />
            <span className="text-[17px] font-semibold">
              {view.latestJob.kind === "correction" ? "Corregint" : view.latestJob.kind === "restore" ? "Restaurant" : "Generant"} · {JOB_STATUS_LABELS[view.latestJob.status]}
            </span>
          </div>
          <button type="button" className={buttonStyles.secondary} onClick={() => run(() => postJson(`/api/render/jobs/${view.latestJob!.id}/cancel`))}>
            Cancel·lar
          </button>
        </div>
      )}

      {view.latestJob?.status === "failed" && (
        <Notice variant="warning" title="No s'ha pogut generar">
          <div className="flex flex-col gap-3">
            <p>{view.latestJob.error ?? "Error desconegut."}</p>
            <button type="button" className={`${buttonStyles.primary} self-start`} disabled={busy} onClick={() => run(() => postJson(`/api/render/jobs/${view.latestJob!.id}/retry`))}>
              Reintentar
            </button>
          </div>
        </Notice>
      )}

      {selected?.mock && (
        <Notice variant="warning" title="Resultat de prova (mock)">
          Aquesta versió l&apos;ha generada el proveïdor de proves: és la imatge original marcada amb franges, no una millora real.
        </Notice>
      )}

      {actionError && (
        <p role="alert" className="rounded-xl bg-tint-orange px-4 py-3 text-[15px]">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <Panel>
            <CompareSlider
              before={view.original ? <ImagePreview url={view.original.url} alt="Render original" /> : <PlaceholderBox label="Sense imatge original" />}
              after={selected ? <ImagePreview url={selected.url} alt={`Resultat V${selected.number}`} /> : <PlaceholderBox label={active ? "Generant…" : "Encara no hi ha cap resultat"} />}
              afterLabel={selected ? `RESULTAT · V${selected.number}` : "RESULTAT"}
            />
            <div className="flex flex-wrap gap-2">
              {selected ? (
                <a href={`${selected.url}?download=${encodeURIComponent(`${view.name}-V${selected.number}.png`)}`} className={buttonStyles.secondary}>
                  <Icon name="download" />
                  Descarregar
                </a>
              ) : (
                <button type="button" disabled className={buttonStyles.secondary}>
                  <Icon name="download" />
                  Descarregar
                </button>
              )}
              <button
                type="button"
                disabled={disabled || !selected || selected.approved}
                className={buttonStyles.secondary}
                onClick={() => run(() => postJson(`/api/render/versions/${selected!.id}/approve`))}
              >
                <Icon name="check" />
                {selected?.approved ? "Aprovada" : "Aprovar"}
              </button>
              <button
                type="button"
                disabled={disabled || !selected}
                className={buttonStyles.secondary}
                onClick={() => run(() => postJson("/api/render/jobs", { kind: "regenerate", projectId: view.id, sourceVersionId: selected!.id }))}
              >
                <Icon name="refresh" />
                Tornar a generar
              </button>
              <button
                type="button"
                disabled={disabled || !view.original}
                className={buttonStyles.secondary}
                onClick={() => run(() => postJson("/api/render/jobs", { kind: "restore", projectId: view.id }))}
              >
                <Icon name="undo" />
                Tornar a l&apos;original
              </button>
            </div>
          </Panel>

          <Panel aria-labelledby="corrections-title">
            <div className="flex flex-col gap-1">
              <h2 id="corrections-title" className="text-base font-semibold">
                Correccions ràpides
              </h2>
              <p className="text-sm text-text-muted">
                Tria què no t&apos;agrada i es corregeix només això{selected ? `, a partir de la V${selected.number}` : ""}. No cal escriure res.
              </p>
            </div>
            <OptionGroup group={CORRECTIONS} title="Què vols corregir?" selected={corrections} onChange={setCorrections} />
            {corrections.includes(ZONE) && selected && (
              <RegionEditor
                imageUrl={selected.url}
                imageAlt={`Versió V${selected.number} per marcar la zona`}
                regions={area ? [area] : []}
                labelPrefix="Zona a millorar"
                max={1}
                onAdd={setArea}
                onRemove={() => setArea(null)}
              />
            )}
            <NotesField value={notes} onChange={setNotes} />
            {correctionBlocked && selected && <p className="text-sm text-text-muted">{correctionBlocked}</p>}
            <button type="button" className={`${buttonStyles.primary} self-start`} disabled={disabled || !selected || Boolean(correctionBlocked)} onClick={submitCorrection}>
              <Icon name="edit" />
              Fer una correcció
            </button>
          </Panel>
        </div>

        <aside aria-label="Versions i control" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 md:max-w-[400px]">
          <Panel aria-labelledby="versions-title">
            <h2 id="versions-title" className="text-base font-semibold">
              Versions
            </h2>
            {view.versions.length === 0 ? (
              <p className="text-sm text-text-muted">{active ? "La primera versió s'està generant." : "Encara no hi ha versions."}</p>
            ) : (
              <div role="group" aria-label="Versions" className="flex flex-wrap gap-2">
                {view.versions.map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    aria-pressed={version.id === selected?.id}
                    onClick={() => setSelectedId(version.id)}
                    className={`flex min-h-11 flex-col items-start rounded-xl border px-3 py-1.5 text-left text-sm ${
                      version.id === selected?.id ? "border-brand-orange bg-tint-orange font-semibold" : "border-border-chip bg-surface hover:bg-bg-page"
                    }`}
                  >
                    <span>
                      V{version.number}
                      {version.approved ? " · aprovada" : ""}
                    </span>
                    <span className="text-xs font-normal text-text-muted">
                      {versionLabel(version)}
                      {version.mock ? " · mock" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {selected && <QualityPanel version={selected} />}

          {selected && (
            <Panel aria-labelledby="config-title">
              <h2 id="config-title" className="text-base font-semibold">
                Configuració aplicada · V{selected.number}
              </h2>
              <ul className="flex flex-col gap-1.5 text-[15px]">
                {selected.summary.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-orange" />
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={() => {
              dispatch({ type: "reset" });
              router.push("/render/upload");
            }}
          >
            <Icon name="plus" />
            Nou render
          </button>
        </aside>
      </div>
    </>
  );
}

/** «Resultat» from the stepper without a project yet: go to the current project if there is one. */
export function DraftResult() {
  const { state } = useRenderFlow();
  const router = useRouter();
  useEffect(() => {
    if (state.projectId) router.replace(`/render/result/${state.projectId}`);
  }, [router, state.projectId]);
  return <Notice>Encara no has generat cap render. Puja una imatge i tria què vols millorar.</Notice>;
}
