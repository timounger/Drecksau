/**
 * The card design themes the player can choose from.
 *
 * @module
 * @remarks
 * No image imports here on purpose: this module is pulled in by the settings,
 * which are also exercised in the plain-node test runner. The actual pictures
 * live in {@link ./card-images}, keyed by these theme ids.
 */

/** A card design. Add a new id here and a folder of images to match. */
export type CardTheme = "modern" | "klassisch" | "benjamin";

/** All themes, in the order they appear in the settings. */
export const CARD_THEMES: readonly CardTheme[] = [
  "modern",
  "klassisch",
  "benjamin",
];

/** The theme new visitors see. */
export const DEFAULT_CARD_THEME: CardTheme = "modern";

/**
 * Tells whether a value is a known theme.
 *
 * @param value - the value to check, e.g. from storage
 * @returns true if it names a theme this version ships
 */
export function isCardTheme(value: unknown): value is CardTheme {
  return typeof value === "string" && CARD_THEMES.includes(value as CardTheme);
}
