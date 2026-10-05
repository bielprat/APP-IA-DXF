import capesJson from "../cad/capes.json";
import cadCorrectionsJson from "../cad/correccions.json";
import elementsJson from "../cad/elements.json";
import formatJson from "../cad/format.json";
import modesJson from "../cad/modes.json";
import parametresJson from "../cad/parametres.json";
import sourceTypesJson from "../cad/tipus-font.json";
import vegetationLibraryJson from "../library/vegetacio.json";
import projectFiltersJson from "../projects/filtres.json";
import renderCorrectionsJson from "../render/correccions.json";
import entornJson from "../render/entorn.json";
import fidelitatJson from "../render/fidelitat.json";
import illuminacioJson from "../render/illuminacio.json";
import materialsJson from "../render/materials.json";
import milloresJson from "../render/millores.json";
import referenciesJson from "../render/referencies.json";
import rolsJson from "../render/rols-imatge.json";
import vegetacioJson from "../render/vegetacio.json";
import vidresJson from "../render/vidres.json";
import {
  categorySchema,
  layersSchema,
  tabbedCategorySchema,
  type CatalogCategory,
  type CatalogGroup,
  type CatalogOption,
} from "./schema";

export * from "./schema";
export * from "./selection";

/** Bump when option ids or texts change; stored with every job for reproducibility (§7). */
export const CATALOG_VERSION = "2026-10-05.1";

const category = (data: unknown) => categorySchema.parse(data);

export const renderCatalog = {
  improvements: category(milloresJson),
  /** Detail categories in the order of the "Detalls" tabs. */
  details: [vegetacioJson, vidresJson, illuminacioJson, materialsJson, entornJson].map(category),
  fidelity: category(fidelitatJson),
  references: category(referenciesJson),
  imageRoles: category(rolsJson),
  corrections: category(renderCorrectionsJson),
} as const;

export const cadCatalog = {
  modes: category(modesJson),
  sourceTypes: category(sourceTypesJson),
  elements: category(elementsJson),
  parameters: tabbedCategorySchema.parse(parametresJson),
  format: category(formatJson),
  corrections: category(cadCorrectionsJson),
  layers: layersSchema.parse(capesJson).layers,
} as const;

export const libraryCatalog = { vegetation: category(vegetationLibraryJson) } as const;
export const projectsCatalog = { filters: category(projectFiltersJson) } as const;

export function allCategories(): CatalogCategory[] {
  return [
    renderCatalog.improvements,
    ...renderCatalog.details,
    renderCatalog.fidelity,
    renderCatalog.references,
    renderCatalog.imageRoles,
    renderCatalog.corrections,
    cadCatalog.modes,
    cadCatalog.sourceTypes,
    cadCatalog.elements,
    { category: cadCatalog.parameters.category, label: cadCatalog.parameters.label, groups: cadCatalog.parameters.tabs.flatMap((tab) => tab.groups) },
    cadCatalog.format,
    cadCatalog.corrections,
    libraryCatalog.vegetation,
    projectsCatalog.filters,
  ];
}

export function allGroups(): CatalogGroup[] {
  return allCategories().flatMap((item) => item.groups);
}

const optionIndex = new Map<string, CatalogOption>(allGroups().flatMap((group) => group.options.map((option) => [option.id, option])));
const groupIndex = new Map<string, CatalogGroup>(allGroups().map((group) => [group.id, group]));

export function getOption(id: string): CatalogOption {
  const option = optionIndex.get(id);
  if (!option) throw new Error(`Unknown catalog option ${id}`);
  return option;
}

export function getGroup(id: string): CatalogGroup {
  const group = groupIndex.get(id);
  if (!group) throw new Error(`Unknown catalog group ${id}`);
  return group;
}

/** Options whose content still has to be reviewed by Colomer-Rifà (docs/pendent-revisio.md). */
export function pendingReviewOptions(): CatalogOption[] {
  return [...optionIndex.values()].filter((option) => option.status === "PENDENT_REVISIO");
}

/** Detail category for an improvement option, if it has a "Detalls" tab. */
export function detailsFor(improvementId: string): CatalogCategory | undefined {
  const target = getOption(improvementId).detailsCategory;
  return renderCatalog.details.find((item) => item.category === target);
}
