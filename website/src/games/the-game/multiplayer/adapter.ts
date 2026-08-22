/**
 * Plugs Das Spiel into the shared online layer.
 *
 * @module
 * @remarks
 * Two kinds of secret here, and they are not kept the same way.
 *
 * A **hand** is secret from the others but not from its owner, so it rides that
 * seat's private channel and is merged back in on arrival. The public snapshot
 * carries the right number of zeros instead - {@link ./engine/cards.HIDDEN},
 * a value no real card has - so everybody can see how many cards you hold,
 * which they could at a real table too.
 *
 * The **draw pile** is secret from everybody, its owner included, and that is
 * the interesting one. Knowing what is coming would be worth more in this game
 * than seeing a hand: half the skill is guessing whether a row is worth saving
 * for something that may never arrive. So it does not go to any client. It is
 * stashed in the host-only vault - the place that exists for state belonging to
 * the table rather than to a seat - and a new host restores it on failover.
 *
 * Everything else is public and stays public: the four rows, whose turn it is,
 * how many cards each player still owes this turn, and the markers on the rows.
 * All of that lies face up on a real table.
 *
 * The **markers are moves like any other**, which is why a player can set one
 * while somebody else is thinking: the referee lets a hint through from any
 * seat, on turn or not. See {@link ./engine/moves.applyMove}.
 */
import { aiMove } from "@/games/the-game/engine/ai";
import { HIDDEN } from "@/games/the-game/engine/cards";
import { applyMove, seatOnTurn } from "@/games/the-game/engine/moves";
import { isTheGame } from "@/games/the-game/engine/serialization";
import { createGame, type TheGameSeat } from "@/games/the-game/engine/setup";
import {
  MAX_PLAYERS,
  ONLINE_MIN_PLAYERS,
  isPileIndex,
  type TheGame,
  type TheGameMove,
  type Variant,
} from "@/games/the-game/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const THE_GAME_ID = "the-game";

/** What the host chose before dealing. */
export type TheGameOptions = {
  /** How hard the table plays; the host's setting. */
  readonly variant?: Variant;
};

/** What travels off the public snapshot. */
export type TheGameHand = {
  /** One seat's own cards, on that seat's private channel. */
  readonly cards?: readonly number[];
  /** The face-down draw pile - the host-only vault. */
  readonly draw?: readonly number[];
};

/** The adapter the online layer drives the game through. */
export const theGameAdapter: OnlineAdapter<
  TheGame,
  TheGameMove,
  TheGameHand,
  TheGameOptions
> = {
  gameId: THE_GAME_ID,
  minPlayers: ONLINE_MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): TheGame {
    const table: TheGameSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, options?.variant ?? "normal", seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // A turn is several cards, so the clock must not restart on each of them -
    // otherwise somebody laying card after card is never hurried at all. The
    // seat alone is the turn, and the cards inside it share its budget.
    return `${game.active}-${game.phase}`;
  },

  applyMove(game, seatIndex, move): TheGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase !== "playing";
  },

  aiMove(game): TheGameMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): TheGame {
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        hand: player.hand.map(() => HIDDEN),
      })),
      draw: game.draw.map(() => HIDDEN),
    };
  },

  privateHands(game): readonly TheGameHand[] {
    return game.players.map((player) => ({ cards: player.hand }));
  },

  withOwnHand(game, seatIndex, hand): TheGame {
    return hand.cards === undefined
      ? game
      : {
          ...game,
          players: game.players.map((player, at) =>
            at === seatIndex ? { ...player, hand: hand.cards ?? [] } : player,
          ),
        };
  },

  withAllHands(game, hands): TheGame {
    return {
      ...game,
      players: game.players.map((player, at) => ({
        ...player,
        hand: hands[at]?.cards ?? player.hand,
      })),
    };
  },

  vault(game): TheGameHand | null {
    return { draw: game.draw };
  },

  applyVault(game, vault): TheGame {
    return vault.draw === undefined ? game : { ...game, draw: vault.draw };
  },

  effectFor(): { readonly type: string } | null {
    // A card landing on a row is already the loudest thing on the screen.
    return null;
  },

  isGameState(value): value is TheGame {
    return isTheGame(value);
  },

  isHand(value): value is TheGameHand {
    return isTheGameHand(value);
  },

  isMove(value): value is TheGameMove {
    return isTheGameMove(value);
  },
};

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = ["play", "endTurn", "hint"];

/** The requests a client may put on a row. */
const HINTS: readonly string[] = ["keep", "small"];

/** Checks an untrusted value is a move. */
function isTheGameMove(value: unknown): value is TheGameMove {
  const move = value as {
    kind?: unknown;
    card?: unknown;
    pile?: unknown;
    hint?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.card === undefined || Number.isInteger(move.card)) &&
    (move.pile === undefined ||
      (Number.isInteger(move.pile) && isPileIndex(move.pile as number))) &&
    (move.hint === undefined ||
      move.hint === null ||
      (typeof move.hint === "string" && HINTS.includes(move.hint)))
  );
}

/** Checks an untrusted value is a hand or a vault. */
function isTheGameHand(value: unknown): value is TheGameHand {
  const hand = value as { cards?: unknown; draw?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    (hand.cards === undefined || isNumbers(hand.cards)) &&
    (hand.draw === undefined || isNumbers(hand.draw))
  );
}

/** Whether this is a list of card values. */
function isNumbers(value: unknown): boolean {
  return Array.isArray(value) && value.every((card) => Number.isInteger(card));
}
