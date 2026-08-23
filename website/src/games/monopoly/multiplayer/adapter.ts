/**
 * Plugs Monopoly into the shared online layer.
 *
 * @module
 * @remarks
 * **Almost nothing in this game is secret, and that is Monopoly.** Everybody's
 * money is on the table, everybody's deeds are face up, and the whole point of
 * the middle game is knowing exactly how much the player on your orange group
 * can afford. All of that goes out in the shared snapshot untouched.
 *
 * The one secret is **the order of the two card piles**. It belongs to nobody -
 * not even to the host, in the sense that nobody may look at it - so it goes
 * into the host-only vault rather than onto anybody's private channel. The
 * public snapshot keeps the piles' **lengths**, because how many cards are left
 * is something you can see across a table, and fills them with a placeholder.
 *
 * A card being read is a different thing: {@link MonopolyGame.drawn} is face up
 * and goes out in full, because at that moment everybody is looking at it.
 */
import { aiMove } from "@/games/monopoly/engine/ai";
import { isOwnable } from "@/games/monopoly/engine/board";
import { applyMove, seatOnTurn } from "@/games/monopoly/engine/moves";
import { isMonopolyGame } from "@/games/monopoly/engine/serialization";
import { createGame, type MonopolySeat } from "@/games/monopoly/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type MonopolyGame,
  type MonopolyMove,
} from "@/games/monopoly/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const MONOPOLY_GAME_ID = "monopoly";

/** Monopoly has nothing to choose before a game. */
export type MonopolyOptions = object;

/** What travels off the public snapshot: the two piles, host-only. */
export type MonopolyHand = {
  readonly vault?: {
    readonly ereignis: readonly number[];
    readonly gemeinschaft: readonly number[];
  };
};

/**
 * What a face-down card looks like in the shared snapshot.
 *
 * @remarks
 * A real index, because the guard that reads a snapshot off the wire insists on
 * one - and any real index is a lie of the same size, since the whole pile is
 * replaced by it. What survives redaction is the **count**, which is the only
 * thing about a face-down pile anybody is entitled to.
 */
const FACE_DOWN = 0;

/** The adapter the online layer drives the game through. */
export const monopolyAdapter: OnlineAdapter<
  MonopolyGame,
  MonopolyMove,
  MonopolyHand,
  MonopolyOptions
> = {
  gameId: MONOPOLY_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): MonopolyGame {
    const table: MonopolySeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // A turn is a dozen moves, so the clock must not restart on each of them.
    // The interruptions get their own budget, because an auction and a debt are
    // separate jobs that can fall to somebody whose turn it is not.
    return [
      game.active,
      game.phase,
      game.drawn === null ? "" : "c",
      game.auction === null ? "" : `a${game.auction.turn}`,
      game.offer === null ? "" : `o${game.offer.to}`,
      game.debt === null ? "" : "d",
    ].join("-");
  },

  applyMove(game, seatIndex, move): MonopolyGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): MonopolyMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): MonopolyGame {
    return {
      ...game,
      ereignis: game.ereignis.map(() => FACE_DOWN),
      gemeinschaft: game.gemeinschaft.map(() => FACE_DOWN),
    };
  },

  privateHands(game): readonly MonopolyHand[] {
    // Nobody holds anything nobody else may see.
    return game.players.map(() => ({}));
  },

  withOwnHand(game): MonopolyGame {
    return game;
  },

  withAllHands(game): MonopolyGame {
    return game;
  },

  vault(game): MonopolyHand | null {
    return {
      vault: { ereignis: game.ereignis, gemeinschaft: game.gemeinschaft },
    };
  },

  applyVault(game, stashed): MonopolyGame {
    const kept = stashed.vault;
    return kept === undefined
      ? game
      : { ...game, ereignis: kept.ereignis, gemeinschaft: kept.gemeinschaft };
  },

  effectFor(): { readonly type: string } | null {
    // A token moving and a card turning over are already the loudest things on
    // the screen.
    return null;
  },

  isGameState(value): value is MonopolyGame {
    return isMonopolyGame(value);
  },

  isHand(value): value is MonopolyHand {
    return isMonopolyHand(value);
  },

  isMove(value): value is MonopolyMove {
    return isMonopolyMove(value);
  },
};

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = [
  "pickToken",
  "roll",
  "payBail",
  "usePardon",
  "buy",
  "decline",
  "bid",
  "pass",
  "takeCard",
  "build",
  "sell",
  "mortgage",
  "redeem",
  "offer",
  "accept",
  "reject",
  "settle",
  "resign",
  "endTurn",
];

/** Checks an untrusted value is a move. */
function isMonopolyMove(value: unknown): value is MonopolyMove {
  const move = value as {
    kind?: unknown;
    at?: unknown;
    amount?: unknown;
    token?: unknown;
    to?: unknown;
    give?: unknown;
    want?: unknown;
    cash?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.at === undefined || isPlace(move.at)) &&
    (move.amount === undefined || Number.isInteger(move.amount)) &&
    (move.token === undefined || Number.isInteger(move.token)) &&
    (move.to === undefined || Number.isInteger(move.to)) &&
    (move.cash === undefined || Number.isInteger(move.cash)) &&
    (move.give === undefined || isPlaces(move.give)) &&
    (move.want === undefined || isPlaces(move.want))
  );
}

/** Whether a field named in a move is one that can be owned. */
function isPlace(value: unknown): boolean {
  return Number.isInteger(value) && isOwnable(value as number);
}

/** Whether a list of fields named in a move is one. */
function isPlaces(value: unknown): boolean {
  return Array.isArray(value) && value.every(isPlace);
}

/** Checks an untrusted value is the host's vault. */
function isMonopolyHand(value: unknown): value is MonopolyHand {
  const hand = value as {
    vault?: { ereignis?: unknown; gemeinschaft?: unknown };
  };
  return (
    typeof value === "object" &&
    value !== null &&
    (hand.vault === undefined ||
      (typeof hand.vault === "object" &&
        hand.vault !== null &&
        isCards(hand.vault.ereignis) &&
        isCards(hand.vault.gemeinschaft)))
  );
}

/** Whether this is a pile of card indexes. */
function isCards(value: unknown): boolean {
  return Array.isArray(value) && value.every((card) => Number.isInteger(card));
}
