/**
 * Reading a puzzle aloud, the part without the browser: what is spoken, cut
 * into short pieces that remember where they stand in the text, the words
 * of a text, and which voice reads it.
 *
 * @module
 */
import type { Puzzle } from "@/games/sherlock/engine/types";
import { titleOf } from "@/games/sherlock/i18n/texts";

/**
 * The longest piece spoken in one go, in characters. Chrome stops some long
 * utterances after about fifteen seconds; this is well below.
 */
const MAX_PIECE = 220;

/** Parts of names that mark the better German voices, best first. */
const GOOD_VOICES: readonly string[] = [
  "natural",
  "online",
  "google deutsch",
  "katja",
  "hedda",
  "conrad",
  "amala",
];

/** A word that ends a sentence - its quotes and brackets may follow. */
const SENTENCE_END = /[.!?:;…]["'“”„«»)]*$/;

/** A word that ends a clause. */
const CLAUSE_END = /^-$|,["'“”„«»)]*$/;

/** The id prefix of the solution's segments. */
const SOLUTION = "solution";

/** The speeds to choose from - slower, normal, faster. */
export const RATES = { slow: 0.8, normal: 1, fast: 1.2 } as const;

/** The speed a reader starts with. */
export const DEFAULT_RATE: number = RATES.normal;

/** What a voice is to the choice of one - just enough of SpeechSynthesisVoice. */
export type VoiceLike = {
  readonly name: string;
  readonly lang: string;
  readonly voiceURI: string;
  readonly default?: boolean;
};

/**
 * One block of what is read: a paragraph shown word by word, or something
 * spoken differently from how it is shown (the title, a picture).
 */
export type Segment = {
  /** Unique on the page: "title", "text-2", "image-0", "solution-1". */
  readonly id: string;
  /** The text as shown - its words can be highlighted and clicked. */
  readonly text: string;
  /** What is spoken instead, when it differs from the text; then it is read whole. */
  readonly spoken?: string;
};

/** One word of a text: where it starts and ends. */
export type Word = { readonly start: number; readonly end: number };

/** Where reading starts: a word of a segment. */
export type Spot = { readonly segment: string; readonly word: number };

/** One utterance, and where it stands in the text. */
export type Piece = {
  readonly segment: string;
  /** What is said. */
  readonly text: string;
  /** The first and last word of the segment it covers - -1 when it is spoken differently. */
  readonly from: number;
  readonly to: number;
  /** Where the piece starts in the segment's text, for the spoken position. */
  readonly offset: number;
};

/**
 * The blocks read for a puzzle: its title, the paragraphs and what its
 * pictures show, with letter groups spelled out.
 *
 * @param puzzle - the puzzle
 * @returns the segments, in reading order
 */
export function puzzleSegments(puzzle: Puzzle): readonly Segment[] {
  return [
    {
      id: "title",
      text: titleOf(puzzle),
      spoken: `Rätsel ${String(puzzle.number)}: ${puzzle.title}.`,
    },
    ...puzzle.text.map((text, at) => ({ id: `text-${String(at)}`, text })),
    ...(puzzle.images ?? []).map((image, at) => ({
      id: `image-${String(at)}`,
      text: "",
      spoken: spelled(image.alt),
    })),
  ];
}

/**
 * The blocks read for a puzzle's solution.
 *
 * @param puzzle - the puzzle
 * @returns the segments, in reading order
 */
export function solutionSegments(puzzle: Puzzle): readonly Segment[] {
  return [
    { id: `${SOLUTION}-title`, text: "Lösung", spoken: "Lösung." },
    ...puzzle.solution.map((text, at) => ({
      id: `${SOLUTION}-${String(at)}`,
      text,
    })),
  ];
}

/**
 * Whether a segment belongs to the solution.
 *
 * @param segment - the segment's id
 * @returns true for the solution's segments
 */
export function isSolution(segment: string): boolean {
  return segment.startsWith(SOLUTION);
}

/**
 * The words of a text - everything between spaces, so quotes and
 * punctuation stay with their word.
 *
 * @param text - the text
 * @returns each word's start and end
 */
export function wordsOf(text: string): readonly Word[] {
  return [...text.matchAll(/\S+/g)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
}

/**
 * The word a position in a text falls into.
 *
 * @param words - the text's words
 * @param at - the position, in characters
 * @returns the word's index, or -1 before the first word
 */
export function wordAt(words: readonly Word[], at: number): number {
  return words.findLastIndex((word) => word.start <= at);
}

/**
 * The pieces to speak, from a starting word on (or from the beginning),
 * each short enough to be spoken in one go and cut at sentence ends where
 * it can be.
 *
 * @param segments - what there is to read
 * @param start - where to begin; null for the beginning
 * @returns the pieces, in order
 */
export function piecesFrom(
  segments: readonly Segment[],
  start: Spot | null,
): readonly Piece[] {
  const first = Math.max(
    0,
    segments.findIndex((one) => one.id === start?.segment),
  );
  return segments.slice(first).flatMap((segment, at) => {
    const fromWord = at === 0 && start !== null ? start.word : 0;
    return segment.spoken === undefined
      ? piecesOf(segment, fromWord)
      : [
          {
            segment: segment.id,
            text: segment.spoken,
            from: -1,
            to: -1,
            offset: 0,
          },
        ];
  });
}

/**
 * The German voices, the better ones first.
 *
 * @param voices - every voice the browser has
 * @returns the German ones, ranked
 */
export function germanVoices<V extends VoiceLike>(
  voices: readonly V[],
): readonly V[] {
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("de"))
    .toSorted((left, right) => rank(left) - rank(right));
}

/**
 * The voice to read with: the chosen one while it exists, else the best
 * German voice, else none - then the browser picks one for German.
 *
 * @param voices - every voice the browser has
 * @param chosen - the voiceURI chosen in the settings, if any
 * @returns the voice, or null
 */
export function pickVoice<V extends VoiceLike>(
  voices: readonly V[],
  chosen: string | null,
): V | null {
  const german = germanVoices(voices);
  return german.find((voice) => voice.voiceURI === chosen) ?? german[0] ?? null;
}

/**
 * Letter groups spelled out, so "1. CDP" is read as "1: C D P" and not as a
 * word.
 *
 * @param text - a text with groups of capitals
 * @returns the text with each group's letters apart
 */
export function spelled(text: string): string {
  return text
    .replace(/(\d+)\.\s/g, "$1: ")
    .replace(/\b[A-Z]{2,}\b/g, (group) => group.split("").join(" "));
}

/**
 * A paragraph cut into pieces from one of its words on: as many words as
 * fit, cut after the last sentence end that fits, else after the last
 * clause, else where it is full.
 */
function piecesOf(segment: Segment, fromWord: number): Piece[] {
  const words = wordsOf(segment.text);
  const pieces: Piece[] = [];
  let first = Math.min(Math.max(fromWord, 0), words.length);
  while (first < words.length) {
    let last = first;
    let sentence = -1;
    let clause = -1;
    let full = false;
    while (last + 1 < words.length && !full) {
      const word = segment.text.slice(words[last].start, words[last].end);
      sentence = SENTENCE_END.test(word) ? last : sentence;
      clause = CLAUSE_END.test(word) ? last : clause;
      full = words[last + 1].end - words[first].start > MAX_PIECE;
      last = full ? last : last + 1;
    }
    const end = full ? cutAt(last, sentence, clause) : last;
    pieces.push({
      segment: segment.id,
      text: segment.text.slice(words[first].start, words[end].end),
      from: first,
      to: end,
      offset: words[first].start,
    });
    first = end + 1;
  }
  return pieces;
}

/**
 * Where a full piece ends: at a sentence end if there is one, else at a
 * clause, else at the last word that fits.
 */
function cutAt(last: number, sentence: number, clause: number): number {
  let result = last;
  if (sentence !== -1) {
    result = sentence;
  } else if (clause !== -1) {
    result = clause;
  }
  return result;
}

/**
 * How good a voice sounds: lower is better - a known good name first, then
 * the browser's default, then the rest.
 */
function rank(voice: VoiceLike): number {
  const name = voice.name.toLowerCase();
  const good = GOOD_VOICES.findIndex((part) => name.includes(part));
  const fallback =
    voice.default === true ? GOOD_VOICES.length : GOOD_VOICES.length + 1;
  return good === -1 ? fallback : good;
}
