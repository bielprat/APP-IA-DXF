export type UploadRules = {
  /** Lower-case extensions including the dot. */
  extensions: readonly string[];
  maxBytes: number;
  maxCount: number;
};

export type UploadCheck = { accepted: File[]; errors: string[] };

const formatMb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/**
 * Client-side pre-check for friendly messages. The server re-validates real MIME type,
 * size and pixel count when files are stored (phase 3).
 */
export function checkUploads(files: readonly File[], existingCount: number, rules: UploadRules): UploadCheck {
  const accepted: File[] = [];
  const errors: string[] = [];
  for (const file of files) {
    if (!rules.extensions.includes(extensionOf(file.name))) {
      errors.push(`«${file.name}» no és un format acceptat (${rules.extensions.join(", ")}).`);
    } else if (file.size === 0) {
      errors.push(`«${file.name}» és buit.`);
    } else if (file.size > rules.maxBytes) {
      errors.push(`«${file.name}» supera la mida màxima de ${formatMb(rules.maxBytes)}.`);
    } else if (existingCount + accepted.length >= rules.maxCount) {
      errors.push(`Com a màxim es poden pujar ${rules.maxCount} fitxers.`);
      break;
    } else {
      accepted.push(file);
    }
  }
  return { accepted, errors };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
