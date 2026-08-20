/**
 * Plugs Jammerlappen into the shared online layer.
 *
 * @module
 * @remarks
 * This game has two kinds of secret and they are not kept the same way.
 *
 * A **hand** is secret from the others but not from its owner, so it travels on
 * that seat's private channel and is merged back in on arrival - the ordinary
 * arrangement, the one Kuhle Kühe and Binokel use.
 *
 * A **covered table card** is secret from everybody, its owner included. That
 * is the whole of what those three cards are for: "die verdeckten Karten müssen
 * immer blind gespielt werden und dürfen vorher nicht betrachtet werden." A
 * client that received its own covered cards - even to draw them face down -
 * would be holding the answer in memory, and a browser console is not a
 * difficult place to look. So they go nowhere near a client. They are stashed
 * in the host-only vault, which exists exactly for state that belongs to the
 * table rather than to a seat, and a new host restores them on failover.
 *
 * Everything else is public and stays public: the pot, the open rows, how many
 * cards each seat holds. Those lie face up on a real table, and hiding them
 * would only make the game harder to follow.
 */
import { aiMove } from "@/games/jammerlappen/engine/ai";
import { hiddenCard, type Card } from "@/games/jammerlappen/engine/cards";
import { applyMove, seatOnTurn } from "@/games/jammerlappen/engine/moves";
import { isJammerlappenGame } from "@/games/jammerlappen/engine/serialization";
import {
  createGame,
  type JammerlappenSeat,
} from "@/games/jammerlappen/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type JammerlappenGame,
  type JammerlappenMove,
} from "@/games/jammerlappen/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const JAMMERLAPPEN_GAME_ID = "jammerlappen";

/** Jammerlappen has nothing to choose before a game. */
export type JammerlappenOptions = object;

/** What travels off the public snapshot - a seat's hand, or the table's vault. */
export type JammerlappenHand = {
  /** One seat's own hand cards, on that seat's private channel. */
  readonly cards?: readonly Card[];
  /** Every seat's covered row, in seat order - the host-only vault. */
  readonly down?: readonly (readonly (Card | null)[])[];
};

/** The adapter the online layer drives the game through. */
export const jammerlappenAdapter: OnlineAdapter<
  JammerlappenGame,
  JammerlappenMove,
  JammerlappenHand,
  JammerlappenOptions
> = {
  gameId: JAMMERLAPPEN_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): JammerlappenGame {
    const table: JammerlappenSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // The phase belongs in the key, because the swap at the start is a turn
    // everybody takes at once. Keyed on the seat alone, the clock would keep
    // restarting as each player answered and the last one would never be
    // hurried at all.
    return `${game.phase}-${seatOnTurn(game) ?? -1}`;
  },

  applyMove(game, seatIndex, move): JammerlappenGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): JammerlappenMove | null {
    // Must be the seat seatIndexOnTurn names - that is the seat the layer
    // applies the move as. Never a Zwischenschmeiß: taking over a seat means
    // playing its turns, not racing the table on its behalf.
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): JammerlappenGame {
    // Hands and the covered rows become the right number of card backs, the
    // draw pile becomes its own depth. Every one of those counts is public at a
    // real table; none of the faces is.
    return {
      ...game,
      players: game.players.map((player, seat) => ({
        ...player,
        hand: player.hand.map((unused, at) => hiddenCard(at)),
        down: player.down.map((card, slot) =>
          card === null ? null : hiddenCard(seat * player.down.length + slot),
        ),
      })),
      draw: game.draw.map((unused, at) => hiddenCard(at)),
    };
  },

  privateHands(game): readonly JammerlappenHand[] {
    return game.players.map((player) => ({ cards: player.hand }));
  },

  vault(game): JammerlappenHand | null {
    return { down: game.players.map((player) => player.down) };
  },

  applyVault(game, vault): JammerlappenGame {
    const rows = vault.down;
    return rows === undefined || rows.length !== game.players.length
      ? game
      : {
          ...game,
          players: game.players.map((player, seat) => ({
            ...player,
            down: [...rows[seat]],
          })),
        };
  },

  withOwnHand(game, seatIndex, hand): JammerlappenGame {
    return restore(game, seatIndex, hand);
  },

  withAllHands(game, hands): JammerlappenGame {
    return hands.reduce<JammerlappenGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restore(state, seat, hand),
      game,
    );
  },

  effectFor(): { readonly type: string } | null {
    // Cards landing on the pot are already the loudest thing on screen.
    return null;
  },

  isGameState(value): value is JammerlappenGame {
    return isJammerlappenGame(value);
  },

  isHand(value): value is JammerlappenHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is JammerlappenMove {
    return isJammerlappenMove(value);
  },
};

/**
 * Puts one seat's own hand back into a redacted snapshot.
 *
 * @remarks
 * Only where the count still matches. A hand that has changed since the private
 * copy was sent - somebody drew while it was in flight - is left face down
 * rather than filled with stale cards; the next snapshot fixes it, and a card
 * back is honest about not knowing.
 */
function restore(
  game: JammerlappenGame,
  seat: number,
  hand: JammerlappenHand,
): JammerlappenGame {
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
  "swap",
  "ready",
  "play",
  "playDown",
  "takePot",
];

/** Checks an untrusted value is a move. */
function isJammerlappenMove(value: unknown): value is JammerlappenMove {
  const move = value as {
    kind?: unknown;
    handId?: unknown;
    upId?: unknown;
    cardIds?: unknown;
    slot?: unknown;
  };
  const id = (one: unknown) => one === undefined || typeof one === "string";
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    id(move.handId) &&
    id(move.upId) &&
    (move.cardIds === undefined ||
      (Array.isArray(move.cardIds) &&
        move.cardIds.every((entry) => typeof entry === "string"))) &&
    (move.slot === undefined || Number.isInteger(move.slot))
  );
}
