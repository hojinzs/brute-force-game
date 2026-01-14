/**
 * Charset utilities for frontend display
 */

export type CharsetType = "lowercase" | "uppercase" | "alphanumeric" | "symbols";

export const CHARSET_LABELS: Record<CharsetType, { short: string; full: string }> = {
  lowercase: { short: "a-z", full: "Lowercase (a-z)" },
  uppercase: { short: "A-Z", full: "Uppercase (A-Z)" },
  alphanumeric: { short: "0-9", full: "Numbers (0-9)" },
  symbols: { short: "!@#", full: "Symbols (!@#$...)" },
};

export const ALL_CHARSET_TYPES: CharsetType[] = [
  "lowercase",
  "uppercase",
  "alphanumeric",
  "symbols",
];

/**
 * Formats charset array for compact display
 * @example formatCharsetDisplay(['lowercase', 'alphanumeric']) => 'a-z, 0-9'
 */
export function formatCharsetDisplay(charset: CharsetType[]): string {
  return charset
    .map((type) => CHARSET_LABELS[type]?.short || type)
    .join(", ");
}

/**
 * Formats charset array for detailed display
 * @example formatCharsetDisplayFull(['lowercase', 'alphanumeric']) => 'Lowercase (a-z), Numbers (0-9)'
 */
export function formatCharsetDisplayFull(charset: CharsetType[]): string {
  return charset
    .map((type) => CHARSET_LABELS[type]?.full || type)
    .join(", ");
}

/**
 * Checks if a charset type is included in the array
 */
export function isCharsetEnabled(charset: CharsetType[], type: CharsetType): boolean {
  return charset.includes(type);
}
