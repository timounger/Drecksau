/**
 * The puzzles of "Sherlock Holmes – Rätselsammlung": what one is made of.
 *
 * @module
 */

/** The four parts of the book, easiest first. */
export type Part = "elementary" | "straightforward" | "cunning" | "fiendish";

/** A picture that belongs to a puzzle - a letter grid on a note, say. */
export type PuzzleImage = {
  /** Path under `public/`, e.g. "/sherlock/wordknot-1.png". */
  readonly src: string;
  /** What it shows, in German, for screen readers. */
  readonly alt: string;
};

/** One puzzle of the book, with its solution. */
export type Puzzle = {
  /** Unique, kebab-case, from the English title (e.g. "on-the-strand"). */
  readonly id: string;
  /** Running number across the whole book, 1 to 118. */
  readonly number: number;
  readonly part: Part;
  /** The German title. */
  readonly title: string;
  /** The English title as printed - shown small, and found by the search. */
  readonly original: string;
  /** The puzzle in German, one string per paragraph. */
  readonly text: readonly string[];
  /** Pictures that are needed to solve it, in order. */
  readonly images?: readonly PuzzleImage[];
  /** The solution in German, one string per paragraph. */
  readonly solution: readonly string[];
  /**
   * Whether it is a riddle about English words or letters (a Wordknot, a
   * Camouflage, a letter code) - its words stay English, the rest is German.
   */
  readonly english?: true;
};
