/**
 * The shape of a game of Hitster and the numbers from the box.
 *
 * @module
 */

/** How well the computer knows its music. */
export type Difficulty = "easy" | "medium" | "hard";

/** One person at the table, or a computer in their place. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  /** The songs on the timeline, by index into the deck's songs, oldest first. */
  readonly timeline: readonly number[];
  readonly tokens: number;
};

/** A token laid on the active player's timeline by somebody calling "HITSTER". */
export type Challenge = {
  readonly player: number;
  /** The gap on the active player's timeline, 0 before the first card. */
  readonly slot: number;
};

/** What happened to the last song, for the screen to show. */
export type Outcome = {
  readonly song: number;
  readonly player: number;
  readonly slot: number;
  readonly right: boolean;
  /** Whether the active player named title and artist. */
  readonly named: boolean;
  /** Whether that earned a token (not when already at the maximum). */
  readonly earned: boolean;
  /** Who took the card when the active player was wrong, if anybody. */
  readonly stolenBy: number | null;
  readonly challenges: readonly Challenge[];
};

/** One line of the game's history. */
export type HistoryEntry =
  /** A song placed and turned over. */
  | { readonly kind: "placed"; readonly outcome: Outcome }
  /** A song skipped - for a token, or because it would not play. */
  | {
      readonly kind: "skipped";
      readonly player: number;
      readonly paid: boolean;
    }
  /** A card bought for three tokens. */
  | { readonly kind: "bought"; readonly player: number; readonly song: number };

/**
 * Where a turn stands.
 *
 * - `place`: the song plays, the active player puts it on the timeline.
 * - `challenge`: the others may lay a token where they think it belongs.
 * - `reveal`: the card is turned over; the active player moves on.
 * - `over`: somebody has their full timeline.
 */
export type Phase = "place" | "challenge" | "reveal" | "over";

/** A whole game of Hitster. */
export type HitsterGame = {
  readonly players: readonly Player[];
  /** The songs still to draw, by index into the songs, the next one first. */
  readonly deck: readonly number[];
  /** The song playing now. */
  readonly song: number;
  /** Whose turn it is. */
  readonly active: number;
  readonly phase: Phase;
  /** Where the active player put the song, once they have. */
  readonly slot: number | null;
  /** What the active player said the song is, once they have. */
  readonly guess: { readonly title: string; readonly artist: string } | null;
  readonly challenges: readonly Challenge[];
  /** Who decides next whether to challenge, during the challenge phase. */
  readonly asking: number | null;
  readonly outcome: Outcome | null;
  /** How many cards a timeline needs to win. */
  readonly target: number;
  readonly difficulty: Difficulty;
  readonly winner: number | null;
  /** How many songs have been played, for the screens. */
  readonly turns: number;
  /** Everything that happened so far, oldest first; missing in games saved before. */
  readonly history?: readonly HistoryEntry[];
};

/** A move. */
export type HitsterMove =
  /** Put the song in a gap of one's timeline, naming it or not. */
  | {
      readonly kind: "place";
      readonly slot: number;
      readonly title: string;
      readonly artist: string;
    }
  /** Pay a token for another song. */
  | { readonly kind: "skip" }
  /** Draw another song for free, because this one will not play. */
  | { readonly kind: "broken" }
  /** Pay three tokens for a card laid straight on the timeline. */
  | { readonly kind: "buy" }
  /** Lay a token in a gap of the active player's timeline. */
  | { readonly kind: "challenge"; readonly slot: number }
  /** Let the song go by. */
  | { readonly kind: "pass" }
  /** Turn to the next player once the card is revealed. */
  | { readonly kind: "next" };

/** The fewest people at the table. */
export const MIN_PLAYERS = 2;

/** The most people at the table. */
export const MAX_PLAYERS = 8;

/** The tokens everybody starts with. */
export const START_TOKENS = 2;

/** The most tokens anybody may hold. */
export const MAX_TOKENS = 5;

/** What a card bought from the deck costs. */
export const BUY_COST = 3;

/** How many cards win in the box. */
export const DEFAULT_TARGET = 10;

/** The targets there are to choose from. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the choices themselves
export const TARGETS: readonly number[] = [5, 10, 15];
