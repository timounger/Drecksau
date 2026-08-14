/**
 * Plugs Qwixx into the shared online layer.
 *
 * @module
 * @remarks
 * The shortest adapter in the collection, and for a good reason: **nothing in
 * Qwixx is secret.** Every sheet lies face up, the dice are in the middle of
 * the table, and the only thing anybody has to decide is what to do with what
 * they can already see. So there is no redaction, no private channel and no
 * host vault - the shared snapshot is simply the game.
 *
 * The one thing worth saying is about turns. `seatIndexOnTurn` names the active
 * player, which is public knowledge, and the layer uses it to hurry them along
 * or to play for somebody who left. During the **white** step the other seats
 * may act as well, and they can: the layer hands every move to the referee
 * without checking who sent it, and the referee knows whose answer is still
 * outstanding.
 */
import { aiMove } from "@/games/qwixx/engine/ai";
import { applyMove, seatOnTurn } from "@/games/qwixx/engine/moves";
import { isQwixxGame } from "@/games/qwixx/engine/serialization";
import { createGame, type QwixxSeat } from "@/games/qwixx/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROWS,
  type QwixxGame,
  type QwixxMove,
  type Row,
} from "@/games/qwixx/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const QWIXX_GAME_ID = "qwixx";

/**
 * Qwixx has nothing to choose before a game.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type QwixxOptions = object;

/**
 * Nothing travels privately.
 *
 * @remarks
 * The layer wants a hand type, so it gets an empty one. There is no
 * information in this game that one player has and another does not.
 */
export type QwixxHand = object;

/** The adapter the online layer drives Qwixx through. */
export const qwixxAdapter: OnlineAdapter<
  QwixxGame,
  QwixxMove,
  QwixxHand,
  QwixxOptions
> = {
  gameId: QWIXX_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): QwixxGame {
    const table: QwixxSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): QwixxGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): QwixxMove | null {
    // Only ever asked for the seat the layer thinks is on turn, which is the
    // active player. During the white step the others answer for themselves.
    return aiMove(game, game.active);
  },

  redact(game): QwixxGame {
    // Everything is on the table already.
    return game;
  },

  privateHands(game): readonly QwixxHand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): QwixxGame {
    return game;
  },

  withAllHands(game): QwixxGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    // The dice and the crosses are already the loudest thing on screen.
    return null;
  },

  isGameState(value): value is QwixxGame {
    return isQwixxGame(value);
  },

  isHand(value): value is QwixxHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is QwixxMove {
    return isQwixxMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = ["white", "colour", "pass"];

/** Checks an untrusted value is a move. */
function isQwixxMove(value: unknown): value is QwixxMove {
  const move = value as { kind?: unknown; row?: unknown; white?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.row === undefined || ROWS.includes(move.row as Row)) &&
    (move.white === undefined || Number.isInteger(move.white))
  );
}
