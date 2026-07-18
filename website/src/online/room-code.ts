/**
 * Short, shareable room codes.
 *
 * @module
 * @remarks
 * Codes are typed and read aloud between friends, so the alphabet leaves out
 * the pairs that are easy to confuse - no O/0, no I/1. Four characters give
 * about a million rooms, plenty for private games and short enough to dictate.
 */

/** The 32 unambiguous characters a code is built from. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** How many characters a code has. */
const CODE_LENGTH = 4;

/**
 * Draws a fresh random room code.
 *
 * @returns a code like "K7QF"
 * @remarks
 * Uses the crypto generator, and 32 is a divisor of 2^32, so the modulo below
 * picks every character with equal probability - no bias toward the start of
 * the alphabet.
 */
export function generateRoomCode(): string {
  const values = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(values);

  let code = "";
  for (const value of values) {
    code += ALPHABET[value % ALPHABET.length];
  }
  return code;
}

/**
 * Cleans up a code a player typed or pasted from a link.
 *
 * @param input - the raw text
 * @returns the code in the canonical form used as the room key
 */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((character) => ALPHABET.includes(character))
    .join("");
}

/**
 * Tells whether a code is complete and well formed.
 *
 * @param code - a normalized code
 * @returns true if it has the right length
 */
export function isValidRoomCode(code: string): boolean {
  return code.length === CODE_LENGTH;
}
