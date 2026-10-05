import {
  cadCatalog,
  getGroup,
  getOption,
  isGroupValid,
  resolveGroup,
  toggleOption,
  type CadLayer,
  type CatalogGroup,
  type Selection,
  type SelectionContext,
} from "@cr/catalog";
import { extensionOf } from "@/features/shared/uploads";

export const MODE_APPROXIMATE = "cad-modes.aproximat";
export const MODE_PRECISE = "cad-modes.precis";
export const MODE_REVIEW = "cad-modes.revisio";

const MODES = cadCatalog.modes.groups[0];
const ELEMENTS = cadCatalog.elements.groups[0];
const SOURCE_TYPES = cadCatalog.sourceTypes.groups[0];
const PARAMETER_GROUPS = cadCatalog.parameters.tabs.flatMap((tab) => tab.groups);
const FORMAT_GROUPS = cadCatalog.format.groups;

export type CadFile = { id: string; name: string; size: number; sourceType: string | null };

export type CadFlowState = {
  mode: string;
  files: CadFile[];
  /** null until the user touches the step: the catalog default applies. */
  elements: string[] | null;
  params: Selection;
  format: Selection;
  notes: string;
};

export const initialCadState: CadFlowState = {
  mode: MODES.default[0],
  files: [],
  elements: null,
  params: {},
  format: {},
  notes: "",
};

export type CadAction =
  | { type: "setMode"; mode: string }
  | { type: "addFiles"; files: Omit<CadFile, "sourceType">[] }
  | { type: "removeFile"; id: string }
  | { type: "setSourceType"; id: string; sourceType: string }
  | { type: "toggleElement"; id: string }
  | { type: "setParam"; groupId: string; selected: string[] }
  | { type: "setFormat"; groupId: string; selected: string[] }
  | { type: "setNotes"; notes: string }
  | { type: "hydrate"; state: Partial<CadFlowState> };

/** Pre-fills the file type; the user sees it and can change it. */
export function guessSourceType(name: string): string | null {
  const extension = extensionOf(name);
  if ([".png", ".jpg", ".jpeg"].includes(extension)) return "cad-fonts.imatge";
  if ([".dwg", ".dxf", ".pdf"].includes(extension)) return "cad-fonts.planol-2d";
  return null;
}

export function cadReducer(state: CadFlowState, action: CadAction): CadFlowState {
  switch (action.type) {
    case "setMode":
      return { ...state, mode: toggleOption([state.mode], MODES, action.mode)[0] };
    case "addFiles":
      return { ...state, files: [...state.files, ...action.files.map((file) => ({ ...file, sourceType: guessSourceType(file.name) }))] };
    case "removeFile":
      return { ...state, files: state.files.filter((file) => file.id !== action.id) };
    case "setSourceType":
      getOption(action.sourceType);
      return { ...state, files: state.files.map((file) => (file.id === action.id ? { ...file, sourceType: action.sourceType } : file)) };
    case "toggleElement":
      return { ...state, elements: toggleOption(effectiveElements(state), ELEMENTS, action.id) };
    case "setParam":
      return { ...state, params: { ...state.params, [action.groupId]: action.selected } };
    case "setFormat":
      return { ...state, format: { ...state.format, [action.groupId]: action.selected } };
    case "setNotes":
      return { ...state, notes: action.notes };
    case "hydrate":
      return { ...state, ...action.state };
  }
}

// ── Selectors ────────────────────────────────────────────────────────────────

export function effectiveElements(state: CadFlowState): string[] {
  return state.elements ?? [...ELEMENTS.default];
}

export function selectionContext(state: CadFlowState): SelectionContext {
  return { mode: state.mode, elements: effectiveElements(state) };
}

export function paramSelection(state: CadFlowState, groupId: string): string[] {
  return resolveGroup(state.params, getGroup(groupId), selectionContext(state));
}

export function formatSelection(state: CadFlowState, groupId: string): string[] {
  return resolveGroup(state.format, getGroup(groupId));
}

export function isReview(state: CadFlowState): boolean {
  return state.mode === MODE_REVIEW;
}

export function hasTechnicalSources(state: CadFlowState): boolean {
  return state.files.some((file) => file.sourceType !== null && getOption(file.sourceType).technical === true);
}

export function uploadBlockedReason(state: CadFlowState): string | null {
  if (state.files.length === 0) return "Puja almenys un fitxer.";
  const untyped = state.files.find((file) => !file.sourceType || !isGroupValid([file.sourceType], SOURCE_TYPES));
  return untyped ? `Indica el tipus de «${untyped.name}».` : null;
}

export function elementsBlockedReason(state: CadFlowState): string | null {
  return effectiveElements(state).length > 0 ? null : "Tria almenys un element.";
}

const groupValid = (state: CadFlowState, group: CatalogGroup) => isGroupValid(resolveGroup(state.params, group, selectionContext(state)), group);

export function invalidParamTabs(state: CadFlowState): string[] {
  return cadCatalog.parameters.tabs.filter((tab) => !tab.groups.every((group) => groupValid(state, group))).map((tab) => tab.id);
}

export function parametersBlockedReason(state: CadFlowState): string | null {
  if (isReview(state)) return null;
  return invalidParamTabs(state).length === 0 ? null : "Completa les pestanyes marcades amb «!».";
}

export function generateBlockedReason(state: CadFlowState): string | null {
  return (
    uploadBlockedReason(state) ??
    elementsBlockedReason(state) ??
    parametersBlockedReason(state) ??
    (FORMAT_GROUPS.every((group) => isGroupValid(formatSelection(state, group.id), group)) ? null : "Revisa el format.")
  );
}

const label = (id: string) => getOption(id).label;

/** Short description of how a dimension will be obtained. */
function dimensionOrigin(optionId: string): "Cota del plànol" | "Estimat" | "Triat per l'usuari" | "Segons fonts" {
  const option = getOption(optionId);
  if (option.value !== undefined) return "Triat per l'usuari";
  if (optionId.endsWith("-plans")) return "Cota del plànol";
  if (optionId.endsWith("-estimar")) return "Estimat";
  return "Segons fonts";
}

export type DimensionRow = { element: string; value: string; origin: string };

/** Pre-generation view of «Dimensions i origen de cada dada»: what was chosen and where each value will come from. */
export function dimensionRows(state: CadFlowState): DimensionRow[] {
  const rows: [string, string][] = [
    ["Alçada de planta", "cad-parametres.alcada-planta"],
    ["Parapet de coberta", "cad-parametres.parapet"],
    ["Gruix de mur exterior", "cad-parametres.gruix-murs"],
    ["Gruix de forjats i coberta", "cad-parametres.gruix-forjats"],
  ];
  return rows.map(([element, groupId]) => {
    const optionId = paramSelection(state, groupId)[0];
    const option = getOption(optionId);
    return { element, value: option.value !== undefined ? option.label : "Pendent de generar", origin: dimensionOrigin(optionId) };
  });
}

const WALL_COLORS: Record<string, string | undefined> = Object.fromEntries(
  getGroup("cad-parametres.color-parets").options.map((option) => [option.id, option.swatch]),
);

export type LayerView = CadLayer & { displayColor: string };

/** Layers of the selected construction systems, colored with the chosen scheme. */
export function layersFor(state: CadFlowState): LayerView[] {
  const elements = new Set(effectiveElements(state));
  const scheme = paramSelection(state, "cad-parametres.esquema")[0];
  const wallColor = WALL_COLORS[paramSelection(state, "cad-parametres.color-parets")[0]];
  const environment = paramSelection(state, "cad-parametres.entorn");
  const wantsEnvironment = environment.some((id) => id !== "cad-parametres.nomes-edifici");

  return cadCatalog.layers
    .filter((layer) => elements.has(layer.element) || ((layer.name === "CR_TOPOGRAFIA" || layer.name === "CR_URBANITZACIO") && wantsEnvironment))
    .map((layer) => {
      if (scheme === "cad-parametres.esquema-grisos") return { ...layer, displayColor: layer.grayscale };
      if (layer.name === "CR_PARETS" && wallColor) return { ...layer, displayColor: wallColor };
      return { ...layer, displayColor: layer.color };
    });
}

export function deliveryFileName(state: CadFlowState): string {
  const source = state.files[0]?.name ?? "model";
  const stem = source.replace(/\.[^.]+$/, "");
  const slug = stem
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "model"}-3d.dxf`;
}

export function summarizeCad(state: CadFlowState): { label: string; value: string }[] {
  const lines = [
    { label: "Mode", value: label(state.mode) },
    { label: "Fonts", value: state.files.length === 1 ? "1 fitxer" : `${state.files.length} fitxers` },
    { label: "Elements", value: effectiveElements(state).map(label).join(", ") },
  ];
  if (!isReview(state)) {
    lines.push({ label: "Alçada", value: label(paramSelection(state, "cad-parametres.alcada-planta")[0]) });
    lines.push({ label: "Format", value: label(formatSelection(state, "cad-format.format")[0]) });
  }
  return lines;
}

export function persistableCadState(state: CadFlowState): Partial<CadFlowState> {
  return { mode: state.mode, elements: state.elements, params: state.params, format: state.format, notes: state.notes };
}

function restoreSelection(raw: unknown): Selection {
  const result: Selection = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [groupId, selected] of Object.entries(raw as Record<string, unknown>)) {
    try {
      const group = getGroup(groupId);
      if (Array.isArray(selected)) result[groupId] = selected.filter((id) => group.options.some((option) => option.id === id));
    } catch {
      // Unknown group: ignore.
    }
  }
  return result;
}

export function restoreCadState(raw: unknown): Partial<CadFlowState> {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const restored: Partial<CadFlowState> = {
    params: restoreSelection(value.params),
    format: restoreSelection(value.format),
  };
  if (typeof value.mode === "string" && MODES.options.some((option) => option.id === value.mode)) restored.mode = value.mode;
  if (Array.isArray(value.elements)) restored.elements = value.elements.filter((id) => ELEMENTS.options.some((option) => option.id === id));
  if (typeof value.notes === "string") restored.notes = value.notes.slice(0, 1000);
  return restored;
}

export { PARAMETER_GROUPS };
