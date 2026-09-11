/**
 * One game of Dog, as one object - and the moves that change it.
 *
 * @module
 * @remarks
 * Four players, two teams, and a hand that gets shorter every round: six cards,
 * then five, four, three, two, and back to six. Everything a referee needs sits
 * in one state so a game can be saved, sent over the wire and checked by
 * anybody - the pack included, because the deal is part of the game rather than
 * something a host makes up.
 *
 * The one thing that is **not** in here is anything about pictures. Where a
 * field lies on screen is the board component's business; where a piece stands
 * is {@link Spot} in ./board.
 */
import type { Card, Rank } from "./cards";
import { MAX_SEATS, MIN_SEATS, type Piece } from "./board";

/**
 * How few may sit at the table, and how many.
 *
 * @remarks
 * Two to six, as the rulebook has it: four and six are the partner games, and
 * two, three and five play the variant where everybody is on their own. The
 * online layer asks a game for a range, and this is it.
 */
export const MIN_PLAYERS = MIN_SEATS;

/** And the most. */
export const MAX_PLAYERS = MAX_SEATS;

/** What the table is waiting for. */
export type Phase = "passing" | "playing" | "gameOver";

/** Every phase, so a stored game can be checked against the list. */
const PHASE_SET: Readonly<Record<Phase, true>> = {
  passing: true,
  playing: true,
  gameOver: true,
};

/** The phases, for the guard that reads a game back. */
export const PHASES: readonly Phase[] = Object.keys(PHASE_SET) as Phase[];

/** One player at the table. */
export type DogPlayer = {
  readonly name: string;
  readonly isBot: boolean;
  /** What they are holding. */
  readonly hand: readonly Card[];
};

/**
 * How many cards are dealt, round by round.
 *
 * @remarks
 * Straight out of the rules, and it is what gives the game its rhythm: the
 * first round is comfortable, the fifth is two cards and a prayer. After the
 * last it starts at six again.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the rule is this list:
   six cards, then five, four, three, two, and round again. */
export const DEAL_SIZES: readonly number[] = [6, 5, 4, 3, 2];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One piece of a seven, which is split over as many pieces as one likes. */
export type Step = {
  /** Which piece walks. */
  readonly piece: number;
  /** How many fields of the seven it takes. */
  readonly steps: number;
  /** Whether it turns into its home at its own start field. */
  readonly home: boolean;
};

/** What a card actually does when it is played. */
export type Act =
  /** Out of the kennel and onto the start field. */
  | { readonly kind: "start"; readonly piece: number }
  /** So many fields along the ring, or into the home at the end of them. */
  | {
      readonly kind: "walk";
      readonly piece: number;
      readonly steps: number;
      readonly backwards: boolean;
      /** Whether it turns off into its home rather than going round again. */
      readonly home: boolean;
    }
  /** One of ours for one of theirs. */
  | { readonly kind: "swap"; readonly piece: number; readonly other: number }
  /** The seven, split over any number of our own pieces. */
  | { readonly kind: "seven"; readonly parts: readonly Step[] }
  /**
   * Nothing at all.
   *
   * @remarks
   * Only the swap card: with nobody to swap with it is laid down without
   * effect, which the rules say in so many words. Every other card that can do
   * nothing is simply not playable.
   */
  | { readonly kind: "none" };

/** A move of the game. */
export type DogMove =
  /** The card handed to the partner, face down, before the round starts. */
  | { readonly kind: "give"; readonly card: number }
  /** A card played, and what it is made to do. */
  | {
      readonly kind: "play";
      readonly card: number;
      /** What the card counts as - its own rank, or the joker's choice. */
      readonly as: Rank;
      readonly act: Act;
    }
  /**
   * Out for this round.
   *
   * @remarks
   * Only legal when nothing else is, and only in a partner game: a player who
   * cannot move drops their hand and sits the rest of the round out.
   */
  | { readonly kind: "fold" }
  /**
   * One card away, one card back - the way out of a dead hand on a table
   * where everybody plays for themselves.
   *
   * @remarks
   * "Kann ein Spieler mit seinen Handkarten keine Figur ziehen, so muss er eine
   * seiner Karten abwerfen und darf eine neue Karte nachziehen. Wenn er nun mit
   * dieser Karte auch nicht ziehen kann, so muss er eine seiner Handkarten
   * abwerfen." So: the first one draws, the second one does not - which is what
   * {@link DogGame.redrew} remembers.
   */
  | { readonly kind: "redraw"; readonly card: number };

/** One game of Dog. */
export type DogGame = {
  readonly phase: Phase;
  /** How many sit at this table - two to six. */
  readonly seats: number;
  /** The four seats, clockwise. Seats nought and two are one team. */
  readonly players: readonly DogPlayer[];
  /** Every piece on the board. */
  readonly pieces: readonly Piece[];
  /** What is left of the pack. */
  readonly deck: readonly Card[];
  /** What has been played, and what the pack is shuffled back out of. */
  readonly pile: readonly Card[];
  /** Whose turn it is. */
  readonly turn: number;
  /** Who dealt this round; the seat to their left begins. */
  readonly dealer: number;
  /** How many cards were dealt this round. */
  readonly handSize: number;
  /** Which round this is, counted from one. */
  readonly round: number;
  /** The card each seat has pushed over to its partner, while that is open. */
  readonly given: readonly (number | null)[];
  /** Which seats are out for this round, having had nothing to play. */
  readonly out: readonly boolean[];
  /**
   * Whether the seat on turn has already swapped a dead card this turn.
   *
   * @remarks
   * Only the first swap of a turn draws a card back; a second one is a plain
   * discard, so that everybody keeps the same number of cards.
   */
  readonly redrew: boolean;
  /** The generator's cursor. */
  readonly rng: number;
  /** What happened, newest last. */
  readonly log: readonly string[];
  /** The seats of the winning team, once there is one. */
  readonly winners: readonly number[];
};

/** How many lines of the log are kept. */
export const LOG_LINES = 40;
