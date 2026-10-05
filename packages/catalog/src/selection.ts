import type { CatalogGroup } from "./schema";

/** Selected option ids per group id. Groups the user never touched are absent. */
export type Selection = Record<string, string[]>;

export type SelectionContext = {
  /** Selected CAD mode option id (e.g. "cad-modes.precis"). */
  mode?: string;
  /** Selected CAD element option ids. */
  elements?: readonly string[];
};

/**
 * Applies a click on an option:
 * - single: the option replaces the current choice.
 * - multi: toggles; an exclusive option ("Mantenir original", "Cap") clears the others and
 *   choosing any other option removes the exclusive one.
 */
export function toggleOption(current: readonly string[], group: CatalogGroup, optionId: string): string[] {
  const option = group.options.find((item) => item.id === optionId);
  if (!option) throw new Error(`Unknown option ${optionId} in group ${group.id}`);

  if (group.mode === "single") return [optionId];

  if (current.includes(optionId)) return current.filter((id) => id !== optionId);
  if (option.exclusive) return [optionId];

  const exclusiveIds = new Set(group.options.filter((item) => item.exclusive).map((item) => item.id));
  const blocked = new Set(option.exclusiveWith);
  return [...current.filter((id) => !exclusiveIds.has(id) && !blocked.has(id)), optionId];
}

export function groupDefault(group: CatalogGroup, context: SelectionContext = {}): string[] {
  if (group.defaultIfElement && context.elements?.includes(group.defaultIfElement.element)) {
    return [...group.defaultIfElement.default];
  }
  if (context.mode && group.defaultByMode?.[context.mode]) return [...group.defaultByMode[context.mode]];
  return [...group.default];
}

/** Effective selection: what the user chose, or the default for the current context. */
export function resolveGroup(selection: Selection, group: CatalogGroup, context: SelectionContext = {}): string[] {
  return selection[group.id] ?? groupDefault(group, context);
}

export function isGroupValid(selected: readonly string[], group: CatalogGroup): boolean {
  const known = new Set(group.options.map((option) => option.id));
  if (!selected.every((id) => known.has(id))) return false;
  if (new Set(selected).size !== selected.length) return false;
  if (group.mode === "single" && selected.length > 1) return false;
  if (selected.length < group.min) return false;
  const exclusive = group.options.filter((option) => option.exclusive && selected.includes(option.id));
  return exclusive.length === 0 || selected.length === 1;
}
