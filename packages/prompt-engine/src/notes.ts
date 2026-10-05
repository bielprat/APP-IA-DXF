export const USER_NOTES_MAX_LENGTH = 1000;

// Attempts to switch off the corporate rules. The sentence is removed and the user is warned.
const OVERRIDE_PATTERNS = [
  /\b(ignore|disregard|forget|override|bypass)\b[^.!?\n]{0,40}\b(instruction|instructions|rules?|prompt|above|previous|system)\b/i,
  /\b(ignora|ignoreu|oblida|obvia|salta(?:'t)?|anul·la|anula)\b[^.!?\n]{0,40}\b(instrucci[oó]ns?|regles?|normes?|prompt|anteriors?)\b/i,
  /\b(ignora|olvida|omite)\b[^.!?\n]{0,40}\b(instrucciones|reglas|prompt|anteriores)\b/i,
  /\bsystem prompt\b/i,
];

export type SanitizedNotes = { text: string; truncated: boolean; removedSentences: number };

/** Cleans free text so it can be quoted inside the prompt without breaking out of it. */
export function sanitizeUserNotes(raw: string | null | undefined): SanitizedNotes {
  let text = (raw ?? "")
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex -- strip control characters except newlines and tabs
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\t/g, " ")
    .replace(/"{3,}/g, '"')
    .replace(/[ \u00A0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  let removedSentences = 0;
  const sentences = text.split(/(?<=[.!?\n])\s*/).filter(Boolean);
  const kept = sentences.filter((sentence) => {
    const malicious = OVERRIDE_PATTERNS.some((pattern) => pattern.test(sentence));
    if (malicious) removedSentences += 1;
    return !malicious;
  });
  if (removedSentences > 0) text = kept.join(" ").trim();

  const truncated = text.length > USER_NOTES_MAX_LENGTH;
  if (truncated) text = text.slice(0, USER_NOTES_MAX_LENGTH).trimEnd();
  return { text, truncated, removedSentences };
}
