/**
 * Plugs Kuhle Kühe into the shared online layer.
 *
 * @module
 * @remarks
 * This game has real secrets - your hand and the draw pile - so the snapshot on
 * the wire is a redacted one and each seat gets its own cards on a private
 * channel. The host is the only place that ever holds the whole truth.
 *
 * The herds, the discard pile and the ribbons are all public, and stay public:
 * they lie face up on a real table, and hiding them would make the game harder
 * to follow rather than fairer.
 */
import { aiMove } from "@/games/kuhle-kuehe/engine/ai";
import { applyMove, seatOnTurn } from "@/games/kuhle-kuehe/engine/moves";
import { hiddenCard, type Card } from "@/games/kuhle-kuehe/engine/cards";
import { isKuhleKueheGame } from "@/games/kuhle-kuehe/engine/serialization";
import {
  createGame,
  type KuhleKueheSeat,
} from "@/games/kuhle-kuehe/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type KuhleKueheGame,
  type KuhleKueheMove,
} from "@/games/kuhle-kuehe/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const KUHLE_KUEHE_GAME_ID = "kuhle-kuehe";

/** Kuhle Kühe has nothing to choose before a game. */
export type KuhleKueheOptions = object;

/** What travels on a seat's private channel: that seat's own cards. */
export type KuhleKueheHand = {
  readonly cards?: readonly Card[];
};

/** The adapter the online layer drives the game through. */
export const kuhleKueheAdapter: OnlineAdapter<
  KuhleKueheGame,
  KuhleKueheMove,
  KuhleKueheHand,
  KuhleKueheOptions
> = {
  gameId: KUHLE_KUEHE_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): KuhleKueheGame {
    const table: KuhleKueheSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // The phase belongs in the key: a turn here is two halves and can be
    // interrupted twice over. Keyed on the seat alone, a player who dawdled
    // over drawing would eat the time for laying their cards out.
    return `${game.phase}-${seatOnTurn(game) ?? -1}`;
  },

  applyMove(game, seatIndex, move): KuhleKueheGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): KuhleKueheMove | null {
    // Must be the seat seatIndexOnTurn names - that is the seat the layer
    // applies the move as, and here it is often not the active player.
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): KuhleKueheGame {
    // Hands become the right number of card backs, the deck becomes its own
    // depth. Both counts are public at a real table; the faces are not.
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        hand: player.hand.map((unused, at) => hiddenCard(at)),
      })),
      draw: game.draw.map((unused, at) => hiddenCard(at)),
    };
  },

  privateHands(game): readonly KuhleKueheHand[] {
    return game.players.map((player) => ({ cards: player.hand }));
  },

  withOwnHand(game, seatIndex, hand): KuhleKueheGame {
    return restore(game, seatIndex, hand);
  },

  withAllHands(game, hands): KuhleKueheGame {
    return hands.reduce<KuhleKueheGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restore(state, seat, hand),
      game,
    );
  },

  effectFor(): { readonly type: string } | null {
    // Cards landing on the table are already the loudest thing on screen.
    return null;
  },

  isGameState(value): value is KuhleKueheGame {
    return isKuhleKueheGame(value);
  },

  isHand(value): value is KuhleKueheHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is KuhleKueheMove {
    return isKuhleKueheMove(value);
  },
};

/**
 * Puts one seat's own cards back into a redacted snapshot.
 *
 * @remarks
 * Only where the count still matches. A hand that has changed since the private
 * copy was sent - somebody drew while it was in flight - is left face down
 * rather than filled with stale cards; the next snapshot fixes it, and a card
 * back is honest about not knowing.
 */
function restore(
  game: KuhleKueheGame,
  seat: number,
  hand: KuhleKueheHand,
): KuhleKueheGame {
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

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = [
  "drawTwo",
  "takeDiscard",
  "trade",
  "pass",
  "layCow",
  "layCalf",
  "action",
  "defend",
  "letThrough",
  "endTurn",
];

/** Checks an untrusted value is a move. */
function isKuhleKueheMove(value: unknown): value is KuhleKueheMove {
  const move = value as {
    kind?: unknown;
    cardId?: unknown;
    cardIds?: unknown;
    discardIds?: unknown;
    target?: unknown;
    cowId?: unknown;
    middleId?: unknown;
  };
  const ids = (list: unknown) =>
    list === undefined ||
    (Array.isArray(list) && list.every((id) => typeof id === "string"));
  const id = (one: unknown) => one === undefined || typeof one === "string";
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    id(move.cardId) &&
    id(move.cowId) &&
    id(move.middleId) &&
    ids(move.cardIds) &&
    ids(move.discardIds) &&
    (move.target === undefined || Number.isInteger(move.target))
  );
}
