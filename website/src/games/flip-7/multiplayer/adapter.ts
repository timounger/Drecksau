/**
 * Plugs Flip 7 into the shared online layer.
 *
 * @module
 * @remarks
 * The simplest adapter in the collection, and for a good reason: **every card
 * in this game is face up.** There is no hand, no key, no hidden row - what is
 * in front of you is in front of everybody, which is exactly what makes the odds
 * countable and the game what it is. So there is nothing to redact and no
 * private channel to send anything down.
 *
 * The one thing that is hidden is the order of the draw pile, and that is hidden
 * from everybody including the host, in the sense that nobody may look at it.
 * It rides in the shared snapshot because the alternative - a vault - would
 * protect it from nobody: the host would still hold it either way.
 */
import { aiMove } from "@/games/flip-7/engine/ai";
import { applyMove, seatOnTurn } from "@/games/flip-7/engine/moves";
import { isFlip7Game } from "@/games/flip-7/engine/serialization";
import { createGame, type Flip7Seat } from "@/games/flip-7/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Flip7Game,
  type Flip7Move,
} from "@/games/flip-7/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const FLIP7_GAME_ID = "flip-7";

/** Flip 7 has nothing to choose before a game. */
export type Flip7Options = object;

/** Nobody holds anything nobody else can see, so this carries nothing. */
export type Flip7Hand = object;

/** The adapter the online layer drives the game through. */
export const flip7Adapter: OnlineAdapter<
  Flip7Game,
  Flip7Move,
  Flip7Hand,
  Flip7Options
> = {
  gameId: FLIP7_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): Flip7Game {
    const table: Flip7Seat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // What counts as one turn changes shape here: pointing an action card and
    // turning over the three of a Dreimal are separate jobs, often done by
    // separate people, and each deserves its own budget of thinking time.
    return `${game.stage}-${seatOnTurn(game) ?? -1}-${game.pending === null ? "" : "p"}-${game.forced?.left ?? ""}`;
  },

  applyMove(game, seatIndex, move): Flip7Game | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.stage === "gameOver";
  },

  aiMove(game): Flip7Move | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): Flip7Game {
    // Everything is on the table already.
    return game;
  },

  privateHands(game): readonly Flip7Hand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): Flip7Game {
    return game;
  },

  withAllHands(game): Flip7Game {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    // A card landing in a row is already the loudest thing on the screen.
    return null;
  },

  isGameState(value): value is Flip7Game {
    return isFlip7Game(value);
  },

  isHand(value): value is Flip7Hand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is Flip7Move {
    return isFlip7Move(value);
  },
};

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = ["hit", "stay", "target", "flip", "next"];

/** Checks an untrusted value is a move. */
function isFlip7Move(value: unknown): value is Flip7Move {
  const move = value as { kind?: unknown; at?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.at === undefined || Number.isInteger(move.at))
  );
}
