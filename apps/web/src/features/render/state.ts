import type { RenderPromptInput } from "@cr/prompt-engine";
import { regionSchema, type GenerateInput, type Region } from "./jobRequest";
import { detailsFor, getGroup, getOption, isGroupValid, renderCatalog, resolveGroup, toggleOption, type CatalogCategory, type Selection } from "@cr/catalog";

export const ROLE_BASE = "rols-imatge.base";
export const ROLE_REFERENCE = "rols-imatge.referencia";
export const ROLE_PERSPECTIVE = "rols-imatge.perspectiva";
export const PURPOSE_VEGETATION = "referencies.per-vegetacio";
export const PURPOSE_PERSPECTIVE = "referencies.per-perspectiva";

const IMPROVEMENTS = renderCatalog.improvements.groups[0];
const FIDELITY = renderCatalog.fidelity.groups[0];
const PURPOSE_GROUP = getGroup("referencies.finalitat");
const TAKE_GROUP = getGroup("referencies.aprofitar");
const VEGETATION_COPY_GROUP = getGroup("vegetacio.copiar");

export type RenderImage = {
  /** Asset id on the server. */
  id: string;
  name: string;
  /** Authenticated URL served by /api/assets/[id]. */
  url: string;
  role: string;
  /** «Aquesta referència és per a» (single option id). */
  purpose: string | null;
  /** «Què vols aprofitar?» */
  take: string[];
  /** Added from the vegetation tab: «Què vols copiar d'aquesta referència?» */
  vegetationCopy: string[] | null;
};

export type RenderFlowState = {
  /** Created by the first upload. */
  projectId: string | null;
  images: RenderImage[];
  /** Logos and signs the user marked on the base image. */
  protectedRegions: Region[];
  improvements: string[];
  details: Selection;
  fidelity: string;
  notes: string;
};

export const initialRenderState: RenderFlowState = {
  projectId: null,
  images: [],
  protectedRegions: [],
  improvements: [...IMPROVEMENTS.default],
  details: {},
  fidelity: FIDELITY.default[0],
  notes: "",
};

export type NewImage = Pick<RenderImage, "id" | "name" | "url">;

export type RenderAction =
  | { type: "addImages"; images: NewImage[] }
  | { type: "addVegetationReference"; image: NewImage }
  | { type: "removeImage"; id: string }
  | { type: "setRole"; id: string; role: string }
  | { type: "toggleImprovement"; id: string }
  | { type: "setDetail"; groupId: string; selected: string[] }
  | { type: "setFidelity"; id: string }
  | { type: "setPurpose"; id: string; purpose: string }
  | { type: "setTake"; id: string; take: string[] }
  | { type: "setVegetationCopy"; id: string; copy: string[] }
  | { type: "setNotes"; notes: string }
  | { type: "setProject"; projectId: string }
  | { type: "addRegion"; region: Region }
  | { type: "removeRegion"; index: number }
  | { type: "reset" }
  | { type: "hydrate"; state: Partial<RenderFlowState> };

function defaultPurpose(role: string): string | null {
  return role === ROLE_PERSPECTIVE ? PURPOSE_PERSPECTIVE : null;
}

function makeImage(image: NewImage, role: string): RenderImage {
  return { ...image, role, purpose: defaultPurpose(role), take: [...TAKE_GROUP.default], vegetationCopy: null };
}

export function renderReducer(state: RenderFlowState, action: RenderAction): RenderFlowState {
  switch (action.type) {
    case "addImages": {
      let hasBase = state.images.some((image) => image.role === ROLE_BASE);
      const added = action.images.map((image) => {
        const role = hasBase ? ROLE_REFERENCE : ROLE_BASE;
        hasBase = true;
        return makeImage(image, role);
      });
      return { ...state, images: [...state.images, ...added] };
    }
    case "addVegetationReference": {
      const image = { ...makeImage(action.image, ROLE_REFERENCE), purpose: PURPOSE_VEGETATION, vegetationCopy: [] };
      return { ...state, images: [...state.images, image] };
    }
    case "removeImage": {
      const removed = state.images.find((image) => image.id === action.id);
      const images = state.images.filter((image) => image.id !== action.id);
      // Regions belong to the base image: drop them if it is removed.
      return { ...state, images, protectedRegions: removed?.role === ROLE_BASE ? [] : state.protectedRegions };
    }
    case "setRole": {
      getOption(action.role);
      return {
        ...state,
        images: state.images.map((image) => {
          if (image.id === action.id) {
            return { ...image, role: action.role, purpose: action.role === ROLE_BASE ? null : (image.purpose ?? defaultPurpose(action.role)) };
          }
          // Only one base image: the previous one becomes a reference.
          if (action.role === ROLE_BASE && image.role === ROLE_BASE) return { ...image, role: ROLE_REFERENCE };
          return image;
        }),
        protectedRegions: action.role === ROLE_BASE ? [] : state.protectedRegions,
      };
    }
    case "toggleImprovement":
      return { ...state, improvements: toggleOption(state.improvements, IMPROVEMENTS, action.id) };
    case "setDetail":
      return { ...state, details: { ...state.details, [action.groupId]: action.selected } };
    case "setFidelity":
      return { ...state, fidelity: toggleOption([state.fidelity], FIDELITY, action.id)[0] };
    case "setPurpose":
      return { ...state, images: state.images.map((image) => (image.id === action.id ? { ...image, purpose: action.purpose } : image)) };
    case "setTake":
      return { ...state, images: state.images.map((image) => (image.id === action.id ? { ...image, take: action.take } : image)) };
    case "setVegetationCopy":
      return { ...state, images: state.images.map((image) => (image.id === action.id ? { ...image, vegetationCopy: action.copy } : image)) };
    case "setNotes":
      return { ...state, notes: action.notes };
    case "setProject":
      return { ...state, projectId: action.projectId };
    case "addRegion":
      return { ...state, protectedRegions: [...state.protectedRegions, action.region].slice(0, 30) };
    case "removeRegion":
      return { ...state, protectedRegions: state.protectedRegions.filter((_, index) => index !== action.index) };
    case "reset":
      return initialRenderState;
    case "hydrate":
      return { ...state, ...action.state };
  }
}

// ── Selectors ────────────────────────────────────────────────────────────────

export function baseImage(state: RenderFlowState): RenderImage | undefined {
  return state.images.find((image) => image.role === ROLE_BASE);
}

/** General references (vegetation references are configured in the «Detalls» tab instead). */
export function referenceImages(state: RenderFlowState): RenderImage[] {
  return state.images.filter((image) => image.role !== ROLE_BASE && image.vegetationCopy === null);
}

export function vegetationReferences(state: RenderFlowState): RenderImage[] {
  return state.images.filter((image) => image.vegetationCopy !== null);
}

/** Detail tabs only for the selected improvement categories (§4.2 step 3). */
export function detailTabs(state: RenderFlowState): CatalogCategory[] {
  return state.improvements.map(detailsFor).filter((item): item is CatalogCategory => item !== undefined);
}

export function detailSelection(state: RenderFlowState, groupId: string): string[] {
  return resolveGroup(state.details, getGroup(groupId));
}

export function invalidDetailTabs(state: RenderFlowState): string[] {
  return detailTabs(state)
    .filter((tab) => {
      const groupsValid = tab.groups
        .filter((group) => group.id !== VEGETATION_COPY_GROUP.id)
        .every((group) => isGroupValid(resolveGroup(state.details, group), group));
      const copyValid =
        tab.category !== "vegetacio" ||
        vegetationReferences(state).every((image) => isGroupValid(image.vegetationCopy ?? [], { ...VEGETATION_COPY_GROUP, min: 1 }));
      return !(groupsValid && copyValid);
    })
    .map((tab) => tab.category);
}

export function uploadBlockedReason(state: RenderFlowState): string | null {
  return baseImage(state) ? null : "Puja el render i marca'l com a «Imatge base».";
}

export function improveBlockedReason(state: RenderFlowState): string | null {
  return state.improvements.length > 0 ? null : "Tria almenys una millora.";
}

export function detailsBlockedReason(state: RenderFlowState): string | null {
  return invalidDetailTabs(state).length === 0 ? null : "Completa les pestanyes marcades amb «!».";
}

export function generateBlockedReason(state: RenderFlowState): string | null {
  if (!baseImage(state)) return "Falta la imatge base.";
  if (improveBlockedReason(state)) return improveBlockedReason(state);
  if (detailsBlockedReason(state)) return "Revisa els detalls de les millores.";
  for (const image of referenceImages(state)) {
    if (!image.purpose || !isGroupValid([image.purpose], PURPOSE_GROUP)) return `Indica per a què serveix «${image.name}».`;
    if (!isGroupValid(image.take, TAKE_GROUP)) return `Indica què vols aprofitar de «${image.name}».`;
  }
  return null;
}

/** Human summary for the side panel, e.g. ["Fotorealisme general", "Il·luminació · 16:00 h"]. */
export function summarizeRender(state: RenderFlowState): string[] {
  return state.improvements.map((id) => {
    const label = getOption(id).label;
    const details = detailsFor(id);
    if (!details) return label;
    const chosen = details.groups
      .filter((group) => group.id !== VEGETATION_COPY_GROUP.id)
      .flatMap((group) => resolveGroup(state.details, group))
      .map((optionId) => getOption(optionId).label);
    return chosen.length > 0 ? `${label} · ${chosen.join(", ")}` : label;
  });
}

/** Everything survives a reload of the tab: images are already stored on the server. */
export function persistableRenderState(state: RenderFlowState): Partial<RenderFlowState> {
  return state;
}

/** Body of POST /api/render/jobs for a new generation. */
export function toGenerateInput(state: RenderFlowState): GenerateInput {
  const base = baseImage(state);
  if (!base) throw new Error("Missing base image");
  const prompt = toPromptInput(state);
  return {
    baseAssetId: base.id,
    references: referenceImages(state).map((image) => ({ assetId: image.id, purpose: image.purpose, take: image.take })),
    vegetationReferences: vegetationReferences(state).map((image) => ({ assetId: image.id, copy: image.vegetationCopy ?? [] })),
    improvements: prompt.improvements as string[],
    details: prompt.details,
    fidelity: prompt.fidelity,
    notes: state.notes,
    protectedRegions: state.protectedRegions,
  };
}

const isKnownOption = (id: unknown): id is string => {
  if (typeof id !== "string") return false;
  try {
    getOption(id);
    return true;
  } catch {
    return false;
  }
};

function isRestorableImage(value: unknown): value is RenderImage {
  if (!value || typeof value !== "object") return false;
  const image = value as Record<string, unknown>;
  return (
    typeof image.id === "string" &&
    typeof image.name === "string" &&
    typeof image.url === "string" &&
    image.url === `/api/assets/${image.id}` &&
    [ROLE_BASE, ROLE_REFERENCE, ROLE_PERSPECTIVE].includes(image.role as string) &&
    (image.purpose === null || isKnownOption(image.purpose)) &&
    Array.isArray(image.take) &&
    image.take.every(isKnownOption) &&
    (image.vegetationCopy === null || (Array.isArray(image.vegetationCopy) && image.vegetationCopy.every(isKnownOption)))
  );
}

/** Restores persisted choices, dropping anything the current catalog no longer knows. */
export function restoreRenderState(raw: unknown): Partial<RenderFlowState> {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const restored: Partial<RenderFlowState> = {};
  if (Array.isArray(value.improvements)) restored.improvements = value.improvements.filter(isKnownOption);
  if (isKnownOption(value.fidelity) && FIDELITY.options.some((option) => option.id === value.fidelity)) restored.fidelity = value.fidelity;
  if (typeof value.notes === "string") restored.notes = value.notes.slice(0, 1000);
  if (typeof value.projectId === "string" && value.projectId.length <= 40) restored.projectId = value.projectId;
  if (Array.isArray(value.images)) restored.images = value.images.filter(isRestorableImage);
  if (Array.isArray(value.protectedRegions)) {
    restored.protectedRegions = value.protectedRegions.flatMap((region) => {
      const parsed = regionSchema.safeParse(region);
      return parsed.success ? [parsed.data] : [];
    });
  }
  if (value.details && typeof value.details === "object") {
    const details: Selection = {};
    for (const [groupId, selected] of Object.entries(value.details as Record<string, unknown>)) {
      try {
        const group = getGroup(groupId);
        if (Array.isArray(selected)) details[groupId] = selected.filter((id) => group.options.some((option) => option.id === id));
      } catch {
        // Unknown group: ignore.
      }
    }
    restored.details = details;
  }
  return restored;
}

/**
 * Input for the prompt engine. Images are attached to the generation in this order:
 * base image, general references, vegetation references — matching the engine's numbering.
 */
export function toPromptInput(state: RenderFlowState, projectType: string | null = null): RenderPromptInput {
  const details: Selection = {};
  for (const tab of detailTabs(state)) {
    for (const group of tab.groups) {
      if (group.id !== VEGETATION_COPY_GROUP.id) details[group.id] = resolveGroup(state.details, group);
    }
  }
  return {
    projectType,
    improvements: state.improvements,
    details,
    fidelity: state.fidelity,
    references: referenceImages(state).map((image) => ({ purpose: image.purpose, take: image.take })),
    vegetationReferences: vegetationReferences(state).map((image) => ({ copy: image.vegetationCopy ?? [] })),
    userNotes: state.notes,
  };
}
