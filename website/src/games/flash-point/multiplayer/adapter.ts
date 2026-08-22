/**
 * Plugs Flash Point into the shared online layer.
 *
 * @module
 * @remarks
 * The simplest adapter in the collection, and for a reason worth naming:
 * **nothing here is secret from one player and not another.** The points of
 * interest lie face down for everybody at once - that is the game's one unknown
 * and it belongs to the table, not to a seat. So {@link redact} hands the state
 * over unchanged and {@link privateHands} has nothing to hand out.
 *
 * Compare Sky Team, where the whole adapter exists to make sure the other
 * side's dice never leave the host. Here the opposite is true: everybody is
 * meant to see everything and talk about it, because that is what a cooperative
 * firefight is.
 */
import { aiMove } from "@/games/flash-point/engine/ai";
import { applyMove, seatOnTurn } from "@/games/flash-point/engine/moves";
import { isFlashPointGame } from "@/games/flash-point/engine/serialization";
import {
  MAX_PLAYERS,
  createGame,
  type FlashPointSeat,
} from "@/games/flash-point/engine/setup";
import type {
  FlashPointGame,
  FlashPointMove,
} from "@/games/flash-point/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const FLASH_POINT_GAME_ID = "flash-point";

/**
 * The smallest crew an online room will start with.
 *
 * @remarks
 * Two rather than the one the offline game allows: a room for a single player
 * is a room nobody else can join, and the offline screen is right there.
 */
export const ONLINE_MIN_PLAYERS = 2;

/**
 * Flash Point has nothing to choose before a call-out.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type FlashPointOptions = object;

/**
 * What travels on a seat's private channel: nothing.
 *
 * @remarks
 * The type exists because the shared layer asks for one. There is no hand in
 * this game - what is on the board is on the board.
 */
export type FlashPointHand = object;

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = [
  "move",
  "door",
  "extinguish",
  "chop",
  "carry",
  "endTurn",
];

/** The adapter the online layer drives Flash Point through. */
export const flashPointAdapter: OnlineAdapter<
  FlashPointGame,
  FlashPointMove,
  FlashPointHand,
  FlashPointOptions
> = {
  gameId: FLASH_POINT_GAME_ID,
  minPlayers: ONLINE_MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], unusedOptions, seed): FlashPointGame {
    const crew: FlashPointSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(crew, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): FlashPointGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.stage === "won" || game.stage === "lost";
  },

  aiMove(game): FlashPointMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): FlashPointGame {
    // Nothing to hide. See the note at the top of this file.
    return game;
  },

  privateHands(game): readonly FlashPointHand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): FlashPointGame {
    return game;
  },

  withAllHands(game): FlashPointGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    // The fire spreading is already the loudest thing on the screen.
    return null;
  },

  isGameState(value): value is FlashPointGame {
    return isFlashPointGame(value);
  },

  isHand(value): value is FlashPointHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is FlashPointMove {
    return isFlashPointMove(value);
  },
};

/** Checks an untrusted value is a move. */
function isFlashPointMove(value: unknown): value is FlashPointMove {
  const move = value as { kind?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind)
  );
}
