/**
 * The whole game at one instant, and how well the team is doing.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state goes to storage and over the wire, and the
 * referee in `moves.ts` is the only thing that changes it.
 *
 * Two fields are worth reading together. {@link TheGame.placed} counts what the
 * player on turn has laid down **this turn**, which is the only thing standing
 * between them and the end of the game - the rules end it the moment somebody
 * on turn cannot reach the minimum. And {@link TheGame.hints} is the game's
 * conversation: see the note on {@link Hint}.
 */
import { DECK_SIZE, PILE_COUNT, type Pile } from "./cards";

/** Where the table stands. */
export type Phase =
  /** Somebody is laying cards down. */
  | "playing"
  /** All 98 cards are on the rows. The game is beaten. */
  | "won"
  /** Somebody on turn could not reach the minimum. */
  | "lost";

/**
 * What one player is asking of one row, without saying a number.
 *
 * @remarks
 * This is the game's only rule about talking, and it is a strict one: "Konkrete
 * Zahlenwerte in jeglicher Form sind tabu! Ansonsten ist jede Kommunikation
 * erlaubt, z.B. 'Bitte nicht auf den unteren Stapel legen' oder 'Auf diesem
 * Stapel bitte nur noch einen ganz kleinen Sprung machen'."
 *
 * Those two sentences are the whole vocabulary, so they are the whole type. A
 * marker cannot leak a number the way a chat message can, which makes it the
 * one form of this conversation that keeps the rule for you rather than asking
 * you to keep it. The voice and text chat stay open beside it - the rule is an
 * agreement between people, and a program should not be the one gagging them.
 */
export type Hint =
  /** "Bitte nicht auf diesen Stapel legen" - I am keeping it for something. */
  | "keep"
  /** "Hier bitte nur einen ganz kleinen Sprung." */
  | "small";

/** A player. */
export type TheGamePlayer = {
  readonly name: string;
  readonly isBot: boolean;
  /** Their hand, sorted; face down to everybody else. */
  readonly hand: readonly number[];
};

/** A move a seat can make. */
export type TheGameMove =
  /** Lay one card from your hand onto one row. */
  | { readonly kind: "play"; readonly card: number; readonly pile: number }
  /** Stop, draw back up, and pass on. */
  | { readonly kind: "endTurn" }
  /** Put a request on a row, or take yours off it. Anyone, at any time. */
  | {
      readonly kind: "hint";
      readonly pile: number;
      readonly hint: Hint | null;
    };

/** The whole game. */
export type TheGame = {
  readonly phase: Phase;
  readonly players: readonly TheGamePlayer[];
  /** Whose turn it is. */
  readonly active: number;
  /** The four rows, two ascending and two descending. */
  readonly piles: readonly Pile[];
  /** The face-down draw pile; hidden from everybody, the host included. */
  readonly draw: readonly number[];
  /** How many cards the player on turn has laid down this turn. */
  readonly placed: number;
  /** How many cards each player holds while the draw pile lasts. */
  readonly handSize: number;
  /** How many must be laid down per turn: two, or three in the pro variant. */
  readonly minPerTurn: number;
  /** Every player's request per row, keyed by {@link hintKey}. */
  readonly hints: Readonly<Record<string, Hint>>;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** Fewest players: one, because the box has a solo variant. */
export const MIN_PLAYERS = 1;

/** Most players the box seats. */
export const MAX_PLAYERS = 5;

/** Fewest players an online room can start with - strangers, not solitaire. */
export const ONLINE_MIN_PLAYERS = 2;

/** How hard the team wants it. */
export type Variant =
  /** The rules as printed: two cards a turn. */
  | "normal"
  /** "Jeder Spieler muss nun 3 (statt 2) Karten pro Runde ausspielen." */
  | "profi"
  /** The above, and "die Anzahl der Handkarten um 1 verringern". */
  | "profiPlus";

/** Cards per turn while the draw pile lasts, by variant. */
const PER_TURN: Readonly<Record<Variant, number>> = {
  normal: 2,
  profi: 3,
  profiPlus: 3,
};

/** How many fewer cards each player holds, by variant. */
const HAND_PENALTY: Readonly<Record<Variant, number>> = {
  normal: 0,
  profi: 0,
  profiPlus: 1,
};

/** Hand sizes from the rulebook, by how many are playing. */
const HAND_SIZES: Readonly<Record<number, number>> = {
  1: 8,
  2: 7,
  3: 6,
  4: 6,
  5: 6,
};

/** What a table of this size holds when nothing else is known. */
const DEFAULT_HAND = 6;

/** Below this many cards left over, the rulebook calls the result "super". */
export const GOOD_RESULT = 10;

/**
 * How many cards each player holds.
 *
 * @param players - how many are playing
 * @param variant - how hard they want it
 * @returns the hand size, at least one card
 */
export function handSizeFor(players: number, variant: Variant): number {
  const base = HAND_SIZES[players] ?? DEFAULT_HAND;
  return Math.max(1, base - HAND_PENALTY[variant]);
}

/**
 * How many cards must be laid down per turn while the draw pile lasts.
 *
 * @param variant - how hard they want it
 * @returns two, or three in the pro variant
 */
export function perTurnFor(variant: Variant): number {
  return PER_TURN[variant];
}

/**
 * How many cards the player on turn still has to lay down.
 *
 * @param game - the game
 * @returns the minimum for this turn, less whatever is already down
 * @remarks
 * The minimum itself drops to one the moment the draw pile runs out: "Von nun
 * an ist es jedem Spieler gestattet, in seinem Spielzug nur noch eine einzige
 * Karte (oder beliebig mehr) abzulegen."
 */
export function stillOwed(game: TheGame): number {
  return Math.max(0, requiredThisTurn(game) - game.placed);
}

/**
 * How many cards this turn demands in total.
 *
 * @param game - the game
 * @returns the minimum, before counting what is already down
 */
export function requiredThisTurn(game: TheGame): number {
  return game.draw.length > 0 ? game.minPerTurn : 1;
}

/**
 * How many cards never made it onto a row.
 *
 * @param game - the game
 * @returns every hand card plus whatever is left of the draw pile
 * @remarks
 * The rulebook's score, and the only one there is: "die verbliebenen Handkarten
 * aller Spieler plus die gegebenenfalls verbliebenen Karten des Zugstapels".
 * Lower is better and zero is the whole game beaten.
 */
export function cardsLeft(game: TheGame): number {
  const inHands = game.players.reduce(
    (total, player) => total + player.hand.length,
    0,
  );
  return inHands + game.draw.length;
}

/**
 * How many cards the team got onto the rows.
 *
 * @param game - the game
 * @returns the count, out of 98
 */
export function cardsPlaced(game: TheGame): number {
  return DECK_SIZE - cardsLeft(game);
}

/**
 * The key one player's request on one row is stored under.
 *
 * @param seat - the player asking
 * @param pile - the row they are asking about
 * @returns the key into {@link TheGame.hints}
 * @remarks
 * A flat record rather than a nested array, so the state stays plain JSON that
 * a database and a JSON round trip both leave alone - an array of arrays comes
 * back from Firebase with its holes turned into nulls.
 */
export function hintKey(seat: number, pile: number): string {
  return `${seat}:${pile}`;
}

/**
 * Every request standing on one row.
 *
 * @param game - the game
 * @param pile - the row
 * @returns one entry per player who has asked something, with their seat
 */
export function hintsOn(
  game: TheGame,
  pile: number,
): readonly { readonly seat: number; readonly hint: Hint }[] {
  return game.players
    .map((unused, seat) => ({ seat, hint: game.hints[hintKey(seat, pile)] }))
    .filter(
      (each): each is { seat: number; hint: Hint } => each.hint !== undefined,
    );
}

/**
 * Whether a row index is one of the four.
 *
 * @param pile - the index to check
 * @returns true if it names a row
 */
export function isPileIndex(pile: number): boolean {
  return Number.isInteger(pile) && pile >= 0 && pile < PILE_COUNT;
}
