import {
  CATALOG_VERSION,
  detailsFor,
  getGroup,
  getOption,
  isGroupValid,
  renderCatalog,
  type CatalogGroup,
  type CatalogOption,
  type Selection,
} from "@cr/catalog";
import { getFragment, hasFragment } from "@cr/catalog/prompts";
import { sanitizeUserNotes } from "./notes";

/** Bump when the composition logic changes; stored with every job for reproducibility. */
export const ENGINE_VERSION = "1.0.0";

export const PROJECT_TYPES = [
  "comercial",
  "industrial",
  "residencial",
  "equipament",
  "oficines",
  "estacio-servei",
  "concessionari",
  "altres",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type ReferenceInput = { purpose: string | null; take: readonly string[] };
export type VegetationReferenceInput = { copy: readonly string[] };

export type RenderPromptInput = {
  /** Detected by the VisionLLM analysis; unknown or missing → "altres". */
  projectType?: string | null;
  improvements: readonly string[];
  /** Selected option ids per detail group. Missing groups use the catalog default. */
  details: Selection;
  fidelity: string;
  /** General references, in the order their images are attached after the base image. */
  references?: readonly ReferenceInput[];
  /** Vegetation references from the «Detalls» tab, attached after the general references. */
  vegetationReferences?: readonly VegetationReferenceInput[];
  userNotes?: string | null;
};

/** single: one generation. general + vegetation: the two-pass vegetation process (§5.3.4). */
export type PromptPass = "single" | "general" | "vegetation";

export type Section =
  | "base"
  | "project-type"
  | "improvements"
  | "specific"
  | "lighting"
  | "fidelity"
  | "references"
  | "user-notes"
  | "control";

export type UsedFragment = { id: string; section: Section };
export type PromptWarning = { code: string; message: string; optionId?: string };

export type BuiltPrompt = {
  prompt: string;
  usedFragments: UsedFragment[];
  warnings: PromptWarning[];
  pass: PromptPass;
  engineVersion: string;
  catalogVersion: string;
};

const FIDELITY_MAX = "fidelitat.maxima";
const VEGETATION_IMPROVEMENT = "millores.vegetacio";
const LIGHTING_CATEGORY = "illuminacio";
const VEGETATION_CATEGORY = "vegetacio";
const ENVIRONMENT_CATEGORY = "entorn";
const VEGETATION_COPY_GROUP = "vegetacio.copiar";
const VEGETATION_ACTIONS_GROUP = "vegetacio.accions";
const GUIDE_ONLY = "referencies.guia-visual";
const PURPOSE_VEGETATION = "referencies.per-vegetacio";
/** Specific options order required by §5.2 (lighting has its own section). */
const SPECIFIC_ORDER = [VEGETATION_CATEGORY, "vidres", "materials", ENVIRONMENT_CATEGORY];

const ALTERS_LABELS: Record<string, string> = {
  geometry: "la geometria",
  logos: "els logos",
  materials: "els materials",
  composition: "la composició",
};

class Composer {
  readonly sections = new Map<Section, string[]>();
  readonly used: UsedFragment[] = [];
  readonly warnings: PromptWarning[] = [];

  add(section: Section, id: string, text: string) {
    const list = this.sections.get(section) ?? [];
    list.push(text);
    this.sections.set(section, list);
    this.used.push({ id, section });
  }

  addOption(section: Section, option: CatalogOption) {
    if (!hasFragment(option.id)) {
      this.warn("missing-fragment", `L'opció «${option.label}» no té text definit i no s'aplica.`, option.id);
      return;
    }
    this.add(section, option.id, getFragment(option.id));
  }

  addFragment(section: Section, id: string) {
    this.add(section, id, getFragment(id));
  }

  warn(code: string, message: string, optionId?: string) {
    this.warnings.push(optionId ? { code, message, optionId } : { code, message });
  }

  render(): string {
    const order: Section[] = ["base", "project-type", "improvements", "specific", "lighting", "fidelity", "references", "user-notes", "control"];
    return order
      .map((section) => this.sections.get(section))
      .filter((parts): parts is string[] => parts !== undefined && parts.length > 0)
      .map((parts) => parts.join("\n"))
      .join("\n\n");
  }
}

function lookupOption(id: string): CatalogOption | null {
  try {
    return getOption(id);
  } catch {
    return null;
  }
}

/** Max fidelity discards anything that may alter geometry, logos, materials or composition (§5.2). */
function discardedByFidelity(option: CatalogOption, fidelity: string, composer: Composer): boolean {
  if (fidelity !== FIDELITY_MAX || option.alters.length === 0) return false;
  const what = option.alters.map((item) => ALTERS_LABELS[item]).join(" i ");
  composer.warn("max-fidelity-discarded", `«${option.label}» no s'aplica amb Màxima fidelitat perquè pot alterar ${what}.`, option.id);
  return true;
}

/** Returns a valid selection for a group: known ids, exclusivity enforced, default as fallback. */
function normalizeGroup(group: CatalogGroup, requested: readonly string[] | undefined, composer: Composer): string[] {
  if (requested === undefined) return [...group.default];
  const known = requested.filter((id, index) => requested.indexOf(id) === index && group.options.some((option) => option.id === id));
  if (known.length !== requested.length) composer.warn("unknown-option", `S'han ignorat opcions desconegudes de «${group.title}».`);

  const exclusive = known.find((id) => getOption(id).exclusive);
  let selection = exclusive && known.length > 1 ? [exclusive] : known;
  if (exclusive && known.length > 1) {
    composer.warn("exclusive-applied", `«${getOption(exclusive).label}» exclou la resta d'opcions de «${group.title}».`, exclusive);
  }
  if (group.mode === "single" && selection.length > 1) selection = selection.slice(0, 1);
  if (!isGroupValid(selection, group)) {
    composer.warn("default-applied", `«${group.title}» no tenia una selecció vàlida; s'aplica l'opció per defecte.`);
    selection = [...group.default];
  }
  return selection;
}

function applyGroup(section: Section, group: CatalogGroup, requested: readonly string[] | undefined, fidelity: string, composer: Composer) {
  let selection = normalizeGroup(group, requested, composer).map(getOption);
  const kept = selection.filter((option) => !discardedByFidelity(option, fidelity, composer));
  if (kept.length === 0 && selection.length > 0) {
    // Fall back to the safe default (e.g. «Mantenir estil original») when it does not alter anything.
    const fallback = group.default.map(getOption).filter((option) => option.alters.length === 0);
    selection = fallback;
  } else {
    selection = kept;
  }
  for (const option of selection) {
    if (group.id.startsWith(`${ENVIRONMENT_CATEGORY}.`) && option.unlocks.length > 0) {
      // Environment options must never unlock urban geometry (§5.2).
      composer.warn("environment-unlock-ignored", `«${option.label}» no pot desbloquejar altres opcions.`, option.id);
    }
    composer.addOption(section, option);
  }
}

function vegetationIsKept(input: RenderPromptInput): boolean {
  const group = getGroup(VEGETATION_ACTIONS_GROUP);
  const selected = input.details[VEGETATION_ACTIONS_GROUP] ?? group.default;
  return selected.length === 1 && selected[0] === "vegetacio.mantenir";
}

/** The pipeline runs two passes when vegetation is improved (not kept as is). */
export function planRenderPasses(input: RenderPromptInput): PromptPass[] {
  return input.improvements.includes(VEGETATION_IMPROVEMENT) && !vegetationIsKept(input) ? ["general", "vegetation"] : ["single"];
}

function addReferences(input: RenderPromptInput, pass: PromptPass, fidelity: string, composer: Composer) {
  const lines: { text: string; used: string[] }[] = [];
  const references = input.references ?? [];
  const purposeGroup = getGroup("referencies.finalitat");
  const takeGroup = getGroup("referencies.aprofitar");

  references.forEach((reference, index) => {
    const imageNumber = index + 1;
    const purpose = reference.purpose ? lookupOption(reference.purpose) : null;
    if (!purpose || !purposeGroup.options.some((option) => option.id === purpose.id)) {
      composer.warn("reference-without-purpose", `La referència ${imageNumber} no indica per a què serveix i no s'utilitza.`);
      return;
    }
    const forVegetation = purpose.id === PURPOSE_VEGETATION;
    if ((pass === "general" && forVegetation) || (pass === "vegetation" && !forVegetation)) return;

    let takes = normalizeGroup(takeGroup, reference.take, composer)
      .map(getOption)
      .filter((option) => !discardedByFidelity(option, fidelity, composer));
    if (takes.length === 0) takes = [getOption(GUIDE_ONLY)];
    lines.push({
      text: [`Reference image ${imageNumber}:`, getFragment(purpose.id), ...takes.map((option) => getFragment(option.id))].join(" "),
      used: [purpose.id, ...takes.map((option) => option.id)],
    });
  });

  if (pass !== "general") {
    const copyGroup = getGroup(VEGETATION_COPY_GROUP);
    (input.vegetationReferences ?? []).forEach((reference, index) => {
      const copies = normalizeGroup(copyGroup, reference.copy, composer).map(getOption);
      if (copies.length === 0) {
        composer.warn("vegetation-reference-unused", `La referència de vegetació ${index + 1} no indica què s'ha de copiar i no s'utilitza.`);
        return;
      }
      lines.push({
        text: [`Reference image ${references.length + index + 1} (vegetation):`, ...copies.map((option) => getFragment(option.id))].join(" "),
        used: copies.map((option) => option.id),
      });
    });
  }

  if (lines.length === 0) return;
  composer.addFragment("references", "referencies.marc");
  for (const line of lines) {
    composer.sections.get("references")!.push(line.text);
    for (const id of line.used) composer.used.push({ id, section: "references" });
  }
}

function addUserNotes(raw: string | null | undefined, composer: Composer) {
  const notes = sanitizeUserNotes(raw);
  if (notes.removedSentences > 0) {
    composer.warn("notes-override-removed", "S'han eliminat frases de les indicacions que intentaven anul·lar les regles de l'empresa.");
  }
  if (notes.truncated) composer.warn("notes-truncated", "Les indicacions s'han retallat a 1.000 caràcters.");
  if (!notes.text) return;
  composer.addFragment("user-notes", "notes.marc");
  composer.sections.get("user-notes")!.push(`"""\n${notes.text}\n"""`);
}

function resolveProjectType(value: string | null | undefined): ProjectType {
  return PROJECT_TYPES.includes(value as ProjectType) ? (value as ProjectType) : "altres";
}

/**
 * Builds the image-editing prompt for a render (§5.2). Pure and deterministic: the same input
 * always produces the same output.
 */
export function buildRenderPrompt(input: RenderPromptInput, pass: PromptPass = "single"): BuiltPrompt {
  const composer = new Composer();
  const fidelityGroup = renderCatalog.fidelity.groups[0];
  const fidelity = fidelityGroup.options.some((option) => option.id === input.fidelity) ? input.fidelity : fidelityGroup.default[0];
  if (fidelity !== input.fidelity) composer.warn("default-applied", "Nivell de fidelitat desconegut; s'aplica Màxima fidelitat.");

  // 1 · Corporate base.
  composer.addFragment("base", "base.corporatiu");

  // 2 · Project type.
  composer.addFragment("project-type", `tipologia.${resolveProjectType(input.projectType)}`);

  // 3 · Improvement cards.
  const improvementsGroup = renderCatalog.improvements.groups[0];
  const improvements = normalizeGroup(improvementsGroup, input.improvements, composer)
    .map(getOption)
    .filter((option) => {
      if (pass === "vegetation") return option.id === VEGETATION_IMPROVEMENT;
      if (pass === "general") return option.id !== VEGETATION_IMPROVEMENT;
      return true;
    })
    .filter((option) => !discardedByFidelity(option, fidelity, composer));
  for (const option of improvements) composer.addOption("improvements", option);

  // Details for categories the user did not select are ignored.
  const requestedCategories = new Set(input.improvements.map((id) => lookupOption(id)?.detailsCategory).filter(Boolean));
  const ignored = new Set(
    Object.keys(input.details)
      .map((groupId) => groupId.split(".")[0])
      .filter((category) => renderCatalog.details.some((item) => item.category === category) && !requestedCategories.has(category)),
  );
  for (const category of ignored) composer.warn("details-ignored", `S'han ignorat opcions de «${category}» perquè aquesta millora no s'ha triat.`);
  const selectedCategories = new Set(improvements.map((option) => option.detailsCategory).filter(Boolean));

  // 4 · Specific options and 5 · lighting.
  for (const categoryId of [...SPECIFIC_ORDER, LIGHTING_CATEGORY]) {
    if (!selectedCategories.has(categoryId)) continue;
    const category = detailsFor(improvements.find((option) => option.detailsCategory === categoryId)!.id)!;
    const section: Section = categoryId === LIGHTING_CATEGORY ? "lighting" : "specific";
    for (const group of category.groups) {
      if (group.id === VEGETATION_COPY_GROUP) continue;
      applyGroup(section, group, input.details[group.id], fidelity, composer);
    }
  }
  if (pass === "general" && input.improvements.includes(VEGETATION_IMPROVEMENT)) composer.addFragment("specific", "vegetacio-proces.fase-1");
  if (pass === "vegetation") composer.addFragment("specific", "vegetacio-proces.fase-2");

  // 6 · Fidelity.
  composer.addOption("fidelity", getOption(fidelity));

  // 7 · References.
  addReferences(input, pass, fidelity, composer);

  // 8 · User notes.
  addUserNotes(input.userNotes, composer);

  // 9 · Final control.
  composer.addFragment("control", "control.final");

  return {
    prompt: composer.render(),
    usedFragments: composer.used,
    warnings: composer.warnings,
    pass,
    engineVersion: ENGINE_VERSION,
    catalogVersion: CATALOG_VERSION,
  };
}

export type CorrectionPromptInput = {
  projectType?: string | null;
  corrections: readonly string[];
  /** True when the user drew the area for «Millorar només aquesta zona». */
  hasMask?: boolean;
  userNotes?: string | null;
};

/** Prompt for «Fer una correcció» and quick corrections: only the listed scope may change (§5.3.8). */
export function buildCorrectionPrompt(input: CorrectionPromptInput): BuiltPrompt {
  const composer = new Composer();
  composer.addFragment("base", "base.corporatiu");
  composer.addFragment("project-type", `tipologia.${resolveProjectType(input.projectType)}`);
  composer.addFragment("improvements", "correccio.abast");

  const group = renderCatalog.corrections.groups[0];
  const corrections = normalizeGroup(group, input.corrections, composer);
  if (corrections.length === 0 && !sanitizeUserNotes(input.userNotes).text) {
    composer.warn("empty-correction", "Tria almenys una correcció o escriu què cal corregir.");
  }
  for (const id of corrections) composer.addOption("specific", getOption(id));
  if (corrections.includes("correccions.nomes-aquesta-zona") && !input.hasMask) {
    composer.warn("mask-required", "Marca la zona que vols millorar abans de generar la correcció.", "correccions.nomes-aquesta-zona");
  }

  addUserNotes(input.userNotes, composer);
  composer.addFragment("control", "control.final");

  return {
    prompt: composer.render(),
    usedFragments: composer.used,
    warnings: composer.warnings,
    pass: "single",
    engineVersion: ENGINE_VERSION,
    catalogVersion: CATALOG_VERSION,
  };
}
