/**
 * Plugs The Mind into the shared online layer.
 *
 * @module
 * @remarks
 * This game has **no turns**, and the shared layer turns out not to mind: it
 * asks the adapter who is on turn only to decide who to hurry along and whose
 * seat to play for them, and it hands every incoming move to the referee
 * without checking who sent it. So {@link seatOnTurn} answers null - honestly -
 * and any seat may play at any moment, which is the game.
 *
 * That answer is also the only safe one. Anything else would be a broadcast of
 * whose card is lowest, and that is the single fact the whole game is built on
 * not knowing.
 *
 * What is hidden is simply **the cards**. Every hand but your own is published
 * as a row of zeros of the right length, so the table can see how many cards
 * somebody holds - which is public at a real table - and nothing else.
 */
import { aiMove } from "@/games/the-mind/engine/ai";
import { applyMove, seatOnTurn } from "@/games/the-mind/engine/moves";
import { isMindGame } from "@/games/the-mind/engine/serialization";
import { createGame, type MindSeat } from "@/games/the-mind/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type MindGame,
  UNKNOWN_CARD,
  type MindMove,
} from "@/games/the-mind/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const THE_MIND_GAME_ID = "the-mind";

/**
 * The Mind has nothing to choose before a game.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type MindOptions = object;

/** What travels on a seat's private channel: that seat's own cards. */
export type MindHand = {
  readonly cards?: readonly number[];
};

/** The adapter the online layer drives The Mind through. */
export const theMindAdapter: OnlineAdapter<
  MindGame,
  MindMove,
  MindHand,
  MindOptions
> = {
  gameId: THE_MIND_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): MindGame {
    const table: MindSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(): number | null {
    return seatOnTurn();
  },

  applyMove(game, seatIndex, move): MindGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(): MindMove | null {
    return aiMove();
  },

  redact(game): MindGame {
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        hand: player.hand.map(() => UNKNOWN_CARD),
      })),
    };
  },

  privateHands(game): readonly MindHand[] {
    return game.players.map((player) => ({ cards: player.hand }));
  },

  withOwnHand(game, seatIndex, hand): MindGame {
    return restore(game, seatIndex, hand);
  },

  withAllHands(game, hands): MindGame {
    return hands.reduce<MindGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restore(state, seat, hand),
      game,
    );
  },

  effectFor(): { readonly type: string } | null {
    // A card landing is already the loudest thing on the screen.
    return null;
  },

  isGameState(value): value is MindGame {
    return isMindGame(value);
  },

  isHand(value): value is MindHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is MindMove {
    return isMindMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = ["play", "shuriken", "nextLevel"];

/**
 * Puts one seat's own cards back into a redacted snapshot.
 *
 * @remarks
 * Only where the count still matches. A hand that has changed since the
 * private copy was sent - somebody played while it was in flight - is left
 * blanked rather than filled with stale numbers; the next snapshot fixes it.
 */
function restore(game: MindGame, seat: number, hand: MindHand): MindGame {
  const own = hand.cards;
  const player = game.players[seat];
  return player === undefined ||
    own === undefined ||
    own.length !== player.hand.length
    ? game
    : {
        ...game,
        players: game.players.map((entry, at) =>
          at === seat ? { ...entry, hand: [...own] } : entry,
        ),
      };
}

/** Checks an untrusted value is a move. */
function isMindMove(value: unknown): value is MindMove {
  const move = value as { kind?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind)
  );
}
