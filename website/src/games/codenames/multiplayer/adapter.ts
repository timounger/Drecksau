/**
 * Plugs Codenames into the shared online layer.
 *
 * @module
 * @remarks
 * One secret, and it is not a hand of cards - it is a **fact about the table**
 * that four of the eight seats know and the other four have to work out. So the
 * redaction here is unlike every other game of the collection: the host
 * publishes a board with the owners stripped off every face-down word, and then
 * sends the **same** full board privately to the two spymasters.
 *
 * That is what the per-seat channel is for, even though nobody here holds a
 * hand. A spymaster's private data is the key; an operative's is nothing at
 * all.
 *
 * Everything else is public and stays public: which words are already turned
 * over and what they turned out to be, whose turn it is, the clue, and how many
 * agents each side still has to find. All of that lies face up on a real table.
 */
import { aiMove } from "@/games/codenames/engine/ai";
import { applyMove, seatOnTurn } from "@/games/codenames/engine/moves";
import { isCodenamesGame } from "@/games/codenames/engine/serialization";
import { assignSeats, createGame } from "@/games/codenames/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Card,
  type CodenamesGame,
  type CodenamesMove,
} from "@/games/codenames/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const CODENAMES_GAME_ID = "codenames";

/** Codenames has nothing to choose before a game. */
export type CodenamesOptions = object;

/** What travels off the public snapshot: the key, for the two who may see it. */
export type CodenamesKey = {
  /** The board with every owner on it, or absent for an operative. */
  readonly board?: readonly Card[];
};

/** The adapter the online layer drives the game through. */
export const codenamesAdapter: OnlineAdapter<
  CodenamesGame,
  CodenamesMove,
  CodenamesKey,
  CodenamesOptions
> = {
  gameId: CODENAMES_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): CodenamesGame {
    return createGame(
      assignSeats(seats.map((seat) => ({ name: seat.name, isBot: false }))),
      seed,
    );
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // The phase belongs in the key: giving a clue and guessing are two separate
    // jobs done by two different people, and a spymaster who thought for a long
    // time must not eat the clock meant for their team's guesses.
    return `${game.phase}-${game.turn}`;
  },

  applyMove(game, seatIndex, move): CodenamesGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): CodenamesMove | null {
    // Must be the seat seatIndexOnTurn names - that is the seat the layer
    // applies the move as.
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): CodenamesGame {
    // Every face-down word loses its owner. A word already turned over keeps
    // it - that is public the moment it is touched, and it is how both teams
    // keep score.
    return {
      ...game,
      board: game.board.map((card) =>
        card.revealed ? card : { ...card, owner: null },
      ),
    };
  },

  privateHands(game): readonly CodenamesKey[] {
    return game.seats.map((seat) =>
      seat.role === "spymaster" ? { board: game.board } : {},
    );
  },

  vault(game): CodenamesKey | null {
    // The key belongs to the table rather than to any one seat, and a host that
    // quit would take it with it - the game would go on with nobody able to
    // give a clue. So it is stashed for whoever takes over.
    return { board: game.board };
  },

  applyVault(game, vault): CodenamesGame {
    return restore(game, vault);
  },

  withOwnHand(game, _seatIndex, key): CodenamesGame {
    return restore(game, key);
  },

  withAllHands(game, keys): CodenamesGame {
    // Any one spymaster's copy is the whole key, so the first one that arrived
    // is enough to rebuild the table.
    const full = keys.find((key) => key?.board !== undefined);
    return full === undefined ? game : restore(game, full);
  },

  effectFor(): { readonly type: string } | null {
    // A word turning over is already the loudest thing on the screen.
    return null;
  },

  isGameState(value): value is CodenamesGame {
    return isCodenamesGame(value);
  },

  isHand(value): value is CodenamesKey {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is CodenamesMove {
    return isCodenamesMove(value);
  },
};

/**
 * Puts the owners back onto a redacted board.
 *
 * @remarks
 * Only where the words still line up. A key that arrived for a different deal -
 * the host dealt again while it was in flight - is dropped rather than laid
 * over the wrong words, which would tell a spymaster the confident opposite of
 * the truth. The next snapshot fixes it.
 */
function restore(game: CodenamesGame, key: CodenamesKey): CodenamesGame {
  const full = key.board;
  const fits =
    full !== undefined &&
    full.length === game.board.length &&
    full.every((card, at) => card.word === game.board[at].word);
  return fits
    ? {
        ...game,
        board: game.board.map((card, at) => ({
          ...card,
          owner: full[at].owner,
        })),
      }
    : game;
}

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = ["clue", "guess", "stop"];

/** Checks an untrusted value is a move. */
function isCodenamesMove(value: unknown): value is CodenamesMove {
  const move = value as {
    kind?: unknown;
    word?: unknown;
    count?: unknown;
    tag?: unknown;
    at?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.word === undefined || typeof move.word === "string") &&
    (move.tag === undefined || typeof move.tag === "string") &&
    (move.count === undefined || Number.isInteger(move.count)) &&
    (move.at === undefined || Number.isInteger(move.at))
  );
}
