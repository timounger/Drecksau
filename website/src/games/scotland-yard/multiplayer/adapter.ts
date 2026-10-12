/**
 * Plugs Scotland Yard into the shared online layer.
 *
 * @module
 * @remarks
 * **Where Mister X is never travels to the detectives.** The shared snapshot
 * every seat reads is the redacted game: his position and the stations of his
 * log are gone, except where he showed himself. Only his own seat gets them,
 * on its private channel, and the host keeps a copy in the vault so the game
 * survives a change of host. Nothing in the snapshot can rebuild his start
 * either - the seed is not kept in the game.
 *
 * The host's own device holds the whole game, as the shared layer works. The
 * table screen shows it only through `viewFor`, so a detective hosting does not
 * see Mister X; a determined one could still find him in the browser's
 * developer tools - which is why Mister X is the host by default.
 *
 * **The computer can play Mister X** for a table of detectives. It is not a
 * seat of the room: it sits behind the human seats as a player of the game, and
 * while it is on turn the room is told the host's seat is, with a short time
 * limit, so the shared layer's own auto-play makes its move on the host's
 * device. Guests never compute a move.
 */
import { aiMove } from "@/games/scotland-yard/engine/ai";
import { applyMove, playerOnTurn } from "@/games/scotland-yard/engine/moves";
import { isScotlandYardGame } from "@/games/scotland-yard/engine/serialization";
import { createGame } from "@/games/scotland-yard/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  MISTER_X_NAMES,
  type Player,
  type ScotlandYardGame,
  type ScotlandYardMove,
  type Variant,
} from "@/games/scotland-yard/engine/state";
import { redact } from "@/games/scotland-yard/engine/view";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";
import { createRandom, randomInt } from "@/games/scotland-yard/engine/random";

/** Namespaces this game's rooms in the shared database. */
export const SCOTLAND_YARD_GAME_ID = "scotland-yard";

/** Who plays Mister X at an online table. */
export type MisterXSeat = "host" | "random" | "computer";

/**
 * What an online game is set up with.
 *
 * @remarks
 * An object type and not an index signature: the online layer adds its own
 * auto-play setting on top of a game's options.
 */
export type ScotlandYardOptions = {
  readonly variant: Variant;
  readonly misterX: MisterXSeat;
  readonly misterXName: string;
};

/** What travels on a seat's private channel: Mister X's secret, for his seat. */
export type ScotlandYardHand = {
  readonly position?: number;
  /** The station of every move of his log, in order. */
  readonly stations?: readonly number[];
};

/** How long the computer seems to think as Mister X online, in ms. */
const COMPUTER_MOVE_MS = 900;

/** The adapter the online layer drives Scotland Yard through. */
export const scotlandYardAdapter: OnlineAdapter<
  ScotlandYardGame,
  ScotlandYardMove,
  ScotlandYardHand,
  ScotlandYardOptions
> = {
  gameId: SCOTLAND_YARD_GAME_ID,
  // One person can play: the computer then runs as Mister X.
  minPlayers: 1,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): ScotlandYardGame {
    return createGame(
      tableFor(seats, options, seed),
      {
        variant: options.variant === "intro" ? "intro" : "standard",
        misterXName: MISTER_X_NAMES.includes(options.misterXName)
          ? options.misterXName
          : MISTER_X_NAMES[0],
      },
      seed,
    );
  },

  seatIndexOnTurn(game): number | null {
    const player = playerOnTurn(game);
    // The computer's turn is played on the host's device, seat 0.
    return player === null ? null : game.players[player]?.isBot ? 0 : player;
  },

  applyMove(game, seatIndex, move): ScotlandYardGame | null {
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

  aiMove(game): ScotlandYardMove | null {
    return aiMove(game);
  },

  turnTimeoutMs(game, configuredMs): number | null {
    const player = playerOnTurn(game);
    return player !== null && game.players[player]?.isBot === true
      ? COMPUTER_MOVE_MS
      : configuredMs;
  },

  redact(game): ScotlandYardGame {
    // Once it is over, everybody may see where he was.
    return game.phase === "over" ? game : redact(game);
  },

  privateHands(game): readonly ScotlandYardHand[] {
    return game.players
      .filter((player) => !player.isBot)
      .map((unused, seat) =>
        seat === game.misterX.controller ? secretOf(game) : {},
      );
  },

  withOwnHand(game, seatIndex, hand): ScotlandYardGame {
    return seatIndex === game.misterX.controller ? restore(game, hand) : game;
  },

  withAllHands(game, hands): ScotlandYardGame {
    const own = hands[game.misterX.controller];
    return own === undefined ? game : restore(game, own);
  },

  vault(game): ScotlandYardHand | null {
    return game.hidden ? null : secretOf(game);
  },

  applyVault(game, vault): ScotlandYardGame {
    return restore(game, vault);
  },

  effectFor(): { readonly type: string } | null {
    return null;
  },

  isGameState(value): value is ScotlandYardGame {
    return isScotlandYardGame(value);
  },

  isHand(value): value is ScotlandYardHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is ScotlandYardMove {
    return isScotlandYardMove(value);
  },
};

/**
 * The players of an online game from the room's seats.
 *
 * @param seats - the people in the room, the host first
 * @param options - who plays Mister X
 * @param seed - picks Mister X when it is to be random
 * @returns the players in seat order, the computer behind them if it plays
 */
function tableFor(
  seats: readonly SeatSetup[],
  options: ScotlandYardOptions,
  seed: number,
): readonly Player[] {
  // A full table has no chair left for the computer; a lone player needs it.
  const computer =
    (options.misterX === "computer" || seats.length < MIN_PLAYERS) &&
    seats.length < MAX_PLAYERS;
  const misterX = computer
    ? seats.length
    : options.misterX === "random"
      ? randomInt(createRandom(seed ^ RANDOM_SALT), seats.length)
      : 0;
  const humans: Player[] = seats.map((seat, index) => ({
    name: seat.name,
    isBot: false,
    role: index === misterX ? "misterX" : "detectives",
  }));
  return computer
    ? [...humans, { name: "Computer", isBot: true, role: "misterX" }]
    : humans;
}

/** Keeps the draw for Mister X apart from the draw of the start cards. */
const RANDOM_SALT = 0x5f3759df;

/** Mister X's secret: where he is and what his log really says. */
function secretOf(game: ScotlandYardGame): ScotlandYardHand {
  return {
    position: game.misterX.position ?? undefined,
    stations: game.log.map((entry) => entry.station ?? 0),
  };
}

/**
 * Puts Mister X's secret back into a redacted game.
 *
 * @remarks
 * Only where the log still matches. A secret sent before his latest move is
 * left out rather than put back stale; the next snapshot brings the new one.
 */
function restore(
  game: ScotlandYardGame,
  hand: ScotlandYardHand,
): ScotlandYardGame {
  const stations = hand.stations;
  return hand.position === undefined ||
    stations === undefined ||
    stations.length !== game.log.length
    ? game
    : {
        ...game,
        misterX: { ...game.misterX, position: hand.position },
        log: game.log.map((entry, index) => ({
          ...entry,
          station: stations[index] ?? entry.station,
        })),
        hidden: false,
      };
}

/** Checks an untrusted value is a move. */
function isScotlandYardMove(value: unknown): value is ScotlandYardMove {
  const move = value as Partial<Record<string, unknown>> | null;
  return (
    typeof move === "object" &&
    move !== null &&
    (move.kind === "misterX" || move.kind === "detective") &&
    typeof move.to === "number" &&
    typeof move.ticket === "string"
  );
}
