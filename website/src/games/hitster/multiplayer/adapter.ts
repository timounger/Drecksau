/**
 * Plugs Hitster into the shared online layer.
 *
 * @module
 * @remarks
 * Everybody hears the song on their own device: each table screen embeds the
 * same video and plays it when its player presses play. Nothing is secret
 * that the table would hide at a real game - the timelines lie open - so the
 * whole game travels in the shared snapshot. The song's year is in it too,
 * as it is printed on the back of the card in the box; the screens never show
 * it before the card is turned over.
 *
 * **Computers can fill the table.** They are players of the game behind the
 * human seats; while one is on turn the room is told the host's seat is, with
 * a short time limit, so the shared layer's own auto-play makes its move on
 * the host's device. Guests never compute a move.
 */
import { aiMove } from "@/games/hitster/engine/ai";
import {
  applyMove,
  createGame,
  playerOnTurn,
} from "@/games/hitster/engine/rules";
import { isHitsterGame } from "@/games/hitster/engine/serialization";
import {
  DEFAULT_TARGET,
  MAX_PLAYERS,
  TARGETS,
  type Difficulty,
  type HitsterGame,
  type HitsterMove,
} from "@/games/hitster/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const HITSTER_GAME_ID = "hitster";

/**
 * What an online game is set up with.
 *
 * @remarks
 * An object type and not an index signature: the online layer adds its own
 * auto-play setting on top of a game's options.
 */
export type HitsterOptions = {
  readonly target: number;
  readonly computers: number;
  readonly difficulty: Difficulty;
};

/** Nothing travels privately: the table has no secrets. */
export type HitsterHand = object;

/** How long the computer seems to think online, in ms. */
const COMPUTER_MOVE_MS = 1500;

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = [
  "place",
  "skip",
  "broken",
  "buy",
  "challenge",
  "pass",
  "next",
];

/** The adapter the online layer drives Hitster through. */
export const hitsterAdapter: OnlineAdapter<
  HitsterGame,
  HitsterMove,
  HitsterHand,
  HitsterOptions
> = {
  gameId: HITSTER_GAME_ID,
  // One person can play: the computers fill the table.
  minPlayers: 1,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): HitsterGame {
    const computers = Math.max(
      seats.length < 2 ? 1 : 0,
      Math.min(options.computers, MAX_PLAYERS - seats.length),
    );
    return createGame(
      [
        ...seats.map((seat) => ({ name: seat.name, isBot: false })),
        ...Array.from({ length: computers }, (unused, index) => ({
          name: `Computer ${String(index + 1)}`,
          isBot: true,
        })),
      ],
      TARGETS.includes(options.target) ? options.target : DEFAULT_TARGET,
      options.difficulty,
      seed,
    );
  },

  seatIndexOnTurn(game): number | null {
    const player = playerOnTurn(game);
    // The computer's turn is played on the host's device, seat 0.
    return player === null ? null : game.players[player]?.isBot ? 0 : player;
  },

  applyMove(game, seatIndex, move): HitsterGame | null {
    const player = playerOnTurn(game);
    const allowed =
      player !== null &&
      (game.players[player]?.isBot === true
        ? seatIndex === 0
        : seatIndex === player);
    return allowed && player !== null ? applyMove(game, player, move) : null;
  },

  isFinished(game): boolean {
    return game.phase === "over";
  },

  aiMove(game): HitsterMove | null {
    return aiMove(game);
  },

  turnTimeoutMs(game, configuredMs): number | null {
    const player = playerOnTurn(game);
    return player !== null && game.players[player]?.isBot === true
      ? COMPUTER_MOVE_MS
      : configuredMs;
  },

  redact(game): HitsterGame {
    return game;
  },

  privateHands(game): readonly HitsterHand[] {
    return game.players.filter((player) => !player.isBot).map(() => ({}));
  },

  withOwnHand(game): HitsterGame {
    return game;
  },

  withAllHands(game): HitsterGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    return null;
  },

  isGameState(value): value is HitsterGame {
    return isHitsterGame(value);
  },

  isHand(value): value is HitsterHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is HitsterMove {
    const move = value as { kind?: unknown } | null;
    return (
      typeof move === "object" &&
      move !== null &&
      typeof move.kind === "string" &&
      MOVE_KINDS.includes(move.kind)
    );
  },
};
