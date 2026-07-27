/**
 * Matching a typed guess against the secret term.
 *
 * @module
 * @remarks
 * Guessing should feel forgiving: case, spaces, punctuation and the German
 * umlaut spellings all wash out, so "GRAUer bär", "graubaer" and "Graubär" all
 * count the same. A single-letter typo is accepted for longer words, so a near
 * miss still lands.
 */

/** From this many letters up, a guess one edit away from the term counts. */
const FUZZY_MIN_LENGTH = 5;

/** The largest edit distance still treated as a correct guess. */
const FUZZY_MAX_DISTANCE = 1;

/**
 * Normalises a term or guess to its comparable core.
 *
 * @param text - the raw term or guess
 * @returns lower-case letters and digits only, umlauts folded to ae/oe/ue/ss
 */
export function normalizeGuess(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Whether a guess should be accepted as the term.
 *
 * @param guess - the raw text the player typed
 * @param term - the secret term
 * @returns true if the normalised forms match, or are one typo apart (longer words)
 */
export function isCorrectGuess(guess: string, term: string): boolean {
  const a = normalizeGuess(guess);
  const b = normalizeGuess(term);
  let correct: boolean;
  if (a.length === 0) {
    correct = false;
  } else if (a === b) {
    correct = true;
  } else if (b.length >= FUZZY_MIN_LENGTH) {
    correct = editDistance(a, b) <= FUZZY_MAX_DISTANCE;
  } else {
    correct = false;
  }
  return correct;
}

/**
 * The Levenshtein edit distance between two strings.
 *
 * @param a - the first string
 * @param b - the second string
 * @returns the fewest single-character insertions, deletions or substitutions
 */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current.push(
        Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost),
      );
    }
    previous = current;
  }
  return previous[b.length];
}
