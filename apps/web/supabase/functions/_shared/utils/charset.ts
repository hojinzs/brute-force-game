/**
 * Charset utilities for password generation
 */

export type CharsetType = "lowercase" | "uppercase" | "alphanumeric" | "symbols";

export const CHARSET_MAP: Record<CharsetType, string> = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export const ALL_CHARSET_TYPES: CharsetType[] = [
  "lowercase",
  "uppercase",
  "alphanumeric",
  "symbols",
];

/**
 * Converts charset type array to actual character string
 * @example buildCharset(['lowercase', 'alphanumeric']) => 'abcdefghijklmnopqrstuvwxyz0123456789'
 */
export function buildCharset(types: CharsetType[]): string {
  if (!types || types.length === 0) {
    throw new Error("Charset types cannot be empty");
  }
  return types.map((t) => CHARSET_MAP[t]).filter(Boolean).join("");
}

/**
 * Validates charset configuration
 */
export function validateCharset(charset: unknown): charset is CharsetType[] {
  if (!Array.isArray(charset) || charset.length === 0) {
    return false;
  }
  return charset.every((c) => c in CHARSET_MAP);
}

/**
 * Returns human-readable description of charset types
 */
export function describeCharset(types: CharsetType[]): string {
  const descriptions: Record<CharsetType, string> = {
    lowercase: "lowercase letters (a-z)",
    uppercase: "uppercase letters (A-Z)",
    alphanumeric: "numbers (0-9)",
    symbols: "symbols (!@#$...)",
  };
  return types.map((t) => descriptions[t]).join(", ");
}
