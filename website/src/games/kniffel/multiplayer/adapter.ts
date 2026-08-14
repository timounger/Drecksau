/**
 * Plugs Kniffel into the shared online layer.
 *
 * @module
 * @remarks
 * Short, and for a good reason: **nothing in Kniffel is secret.** The dice are
 * on the table, the grill is in the middle and every pile is face up. So there
 * is no redaction, no private channel and no host vault - the shared snapshot
 * is simply the game.
 *
 * One player acts at a time, and everybody knows which - so `seatIndexOnTurn`
 * can name them without giving anything away, and the layer can play a
 * dropped-out seat's turn for them.
 */
import { aiMove } from "@/games/kniffel/engine/ai";
import { applyMove, seatOnTurn } from "@/games/kniffel/engine/moves";
import { isKniffelGame } from "@/games/kniffel/engine/serialization";
import { createGame, type KniffelSeat } from "@/games/kniffel/engine/setup";
import {
  MAX_PLAYERS,
  type KniffelGame,
  type KniffelMove,
} from "@/games/kniffel/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const KNIFFEL_GAME_ID = "qwixx";

/**
 * Kniffel has nothing to choose before a game.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type KniffelOptions = object;

/**
 * Nothing travels privately.
 *
 * @remarks
 * The layer wants a hand type, so it gets an empty one. There is no
 * information in this game that one player has and another does not.
 */
export type KniffelHand = object;

/**
 * The fewest players an online room seats.
 *
 * @remarks
 * Two, although the game itself seats one. Kniffel alone is a real way to play
 * and the engine allows it - but a room of one is not a room, it is the
 * single-player screen with extra steps.
 */
const ONLINE_MIN_PLAYERS = 2;

/** The adapter the online layer drives Kniffel through. */
export const kniffelAdapter: OnlineAdapter<
  KniffelGame,
  KniffelMove,
  KniffelHand,
  KniffelOptions
> = {
  gameId: KNIFFEL_GAME_ID,
  minPlayers: ONLINE_MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): KniffelGame {
    const table: KniffelSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): KniffelGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): KniffelMove | null {
    // Only ever asked for the active seat, which is the only one that may act.
    return aiMove(game);
  },

  redact(game): KniffelGame {
    // Everything is on the table already.
    return game;
  },

  privateHands(game): readonly KniffelHand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): KniffelGame {
    return game;
  },

  withAllHands(game): KniffelGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    // The dice and the crosses are already the loudest thing on screen.
    return null;
  },

  isGameState(value): value is KniffelGame {
    return isKniffelGame(value);
  },

  isHand(value): value is KniffelHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is KniffelMove {
    return isKniffelMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = ["pick", "roll", "take", "steal"];

/** Checks an untrusted value is a move. */
function isKniffelMove(value: unknown): value is KniffelMove {
  const move = value as { kind?: unknown; face?: unknown; seat?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.face === undefined || Number.isInteger(move.face)) &&
    (move.seat === undefined || Number.isInteger(move.seat))
  );
}
