/**
 * Charset utilities for frontend display
 */

import { z } from "zod";

export type CharsetType =
  | "lowercase"
  | "uppercase"
  | "alphanumeric"
  | "symbols";

export const CHARSET_LABELS: Record<
  CharsetType,
  { short: string; full: string }
> = {
  lowercase: { short: "a-z", full: "Lowercase (a-z)" },
  uppercase: { short: "A-Z", full: "Uppercase (A-Z)" },
  alphanumeric: { short: "0-9", full: "Numbers (0-9)" },
  symbols: { short: "!@#", full: "Symbols (!@#$...)" },
};

/**
 * Maps charset types to their actual character strings
 */
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
export function isCharsetEnabled(
  charset: CharsetType[],
  type: CharsetType
): boolean {
  return charset.includes(type);
}

/**
 * Builds a combined charset string from an array of charset types
 * @example buildCharset(['lowercase', 'alphanumeric']) => 'abcdefghijklmnopqrstuvwxyz0123456789'
 */
export function buildCharset(charsetTypes: CharsetType[]): string {
  return charsetTypes.map((type) => CHARSET_MAP[type]).join("");
}

/**
 * Checks if a character is allowed based on the charset types
 */
export function isCharAllowed(
  char: string,
  charsetTypes: CharsetType[]
): boolean {
  const allowedChars = buildCharset(charsetTypes);
  return allowedChars.includes(char);
}

/**
 * Filters a string to only include allowed characters
 */
export function filterAllowedChars(
  value: string,
  charsetTypes: CharsetType[]
): string {
  const allowedChars = buildCharset(charsetTypes);
  return value
    .split("")
    .filter((char) => allowedChars.includes(char))
    .join("");
}

/**
 * Creates a Zod schema for password validation based on charset and length
 */
export function createPasswordSchema(
  charsetTypes: CharsetType[],
  length: number
) {
  const allowedChars = buildCharset(charsetTypes);
  const regex = new RegExp(`^[${escapeRegex(allowedChars)}]{${length}}$`);

  return z
    .string()
    .length(length, { message: `Password must be exactly ${length} characters` })
    .regex(regex, {
      message: `Password can only contain characters from: ${formatCharsetDisplay(charsetTypes)}`,
    });
}

/**
 * Escapes special regex characters for use in RegExp
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
