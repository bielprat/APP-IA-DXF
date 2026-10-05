import type { RenderPromptInput } from "@cr/prompt-engine";
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
  id: string;
  name: string;
  size: number;
  /** Object URL; only valid for this browser tab. */
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
  images: RenderImage[];
  improvements: string[];
  details: Selection;
  fidelity: string;
  notes: string;
};

export const initialRenderState: RenderFlowState = {
  images: [],
  improvements: [...IMPROVEMENTS.default],
  details: {},
  fidelity: FIDELITY.default[0],
  notes: "",
};

export type NewImage = Pick<RenderImage, "id" | "name" | "size" | "url">;

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
    case "removeImage":
      return { ...state, images: state.images.filter((image) => image.id !== action.id) };
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

/** What survives a reload: choices, never client images (they are not uploaded until phase 3). */
export function persistableRenderState(state: RenderFlowState): Partial<RenderFlowState> {
  return { improvements: state.improvements, details: state.details, fidelity: state.fidelity, notes: state.notes };
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

/** Restores persisted choices, dropping anything the current catalog no longer knows. */
export function restoreRenderState(raw: unknown): Partial<RenderFlowState> {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const restored: Partial<RenderFlowState> = {};
  if (Array.isArray(value.improvements)) restored.improvements = value.improvements.filter(isKnownOption);
  if (isKnownOption(value.fidelity) && FIDELITY.options.some((option) => option.id === value.fidelity)) restored.fidelity = value.fidelity;
  if (typeof value.notes === "string") restored.notes = value.notes.slice(0, 1000);
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
