/**
 * Plugs Heckmeck into the shared online layer.
 *
 * @module
 * @remarks
 * Short, and for a good reason: **nothing in Heckmeck is secret.** The dice are
 * on the table, the grill is in the middle and every pile is face up. So there
 * is no redaction, no private channel and no host vault - the shared snapshot
 * is simply the game.
 *
 * One player acts at a time, and everybody knows which - so `seatIndexOnTurn`
 * can name them without giving anything away, and the layer can play a
 * dropped-out seat's turn for them.
 */
import { aiMove } from "@/games/heckmeck/engine/ai";
import { applyMove, seatOnTurn } from "@/games/heckmeck/engine/moves";
import { isHeckmeckGame } from "@/games/heckmeck/engine/serialization";
import { createGame, type HeckmeckSeat } from "@/games/heckmeck/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type HeckmeckGame,
  type HeckmeckMove,
} from "@/games/heckmeck/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const HECKMECK_GAME_ID = "qwixx";

/**
 * Heckmeck has nothing to choose before a game.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type HeckmeckOptions = object;

/**
 * Nothing travels privately.
 *
 * @remarks
 * The layer wants a hand type, so it gets an empty one. There is no
 * information in this game that one player has and another does not.
 */
export type HeckmeckHand = object;

/** The adapter the online layer drives Qwixx through. */
export const heckmeckAdapter: OnlineAdapter<
  HeckmeckGame,
  HeckmeckMove,
  HeckmeckHand,
  HeckmeckOptions
> = {
  gameId: HECKMECK_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): HeckmeckGame {
    const table: HeckmeckSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): HeckmeckGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): HeckmeckMove | null {
    // Only ever asked for the active seat, which is the only one that may act.
    return aiMove(game);
  },

  redact(game): HeckmeckGame {
    // Everything is on the table already.
    return game;
  },

  privateHands(game): readonly HeckmeckHand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): HeckmeckGame {
    return game;
  },

  withAllHands(game): HeckmeckGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    // The dice and the crosses are already the loudest thing on screen.
    return null;
  },

  isGameState(value): value is HeckmeckGame {
    return isHeckmeckGame(value);
  },

  isHand(value): value is HeckmeckHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is HeckmeckMove {
    return isHeckmeckMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = ["pick", "roll", "take", "steal"];

/** Checks an untrusted value is a move. */
function isHeckmeckMove(value: unknown): value is HeckmeckMove {
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
