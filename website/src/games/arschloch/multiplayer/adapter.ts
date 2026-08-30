/**
 * Plugs Arschloch into the shared online layer.
 *
 * @module
 * @remarks
 * **The hands are the whole secret, and there is no second one.** Nothing is
 * face down on this table: no draw pile, no stock, no talon. Everything is
 * dealt in one go, so once the hands ride each seat's private channel there is
 * nothing left for the host-only vault.
 *
 * What the public snapshot keeps is the **number** of cards each player holds,
 * because that is the one thing everybody watches: whoever is down to two cards
 * is about to be Praesident. The cards themselves are replaced by a placeholder
 * that is a card of the pack in shape only, so a client can count them without
 * learning a single rank.
 *
 * The pile on the table is public and stays public - it is lying face up in the
 * middle - and so are the titles, the scores and whose turn it is.
 */
import { aiMove } from "@/games/arschloch/engine/ai";
import { applyMove, seatOnTurn } from "@/games/arschloch/engine/moves";
import {
  isArschlochGame,
  isArschlochMove,
} from "@/games/arschloch/engine/serialization";
import { createGame, type ArschlochSeat } from "@/games/arschloch/engine/setup";
import {
  DEFAULT_ROUNDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_COUNTS,
  type ArschlochGame,
  type ArschlochMove,
} from "@/games/arschloch/engine/state";
import type { Card } from "@/games/arschloch/engine/cards";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const ARSCHLOCH_GAME_ID = "arschloch";

/** What the host chose before dealing. */
export type ArschlochOptions = {
  /**
   * How many rounds the room plays - the host's setting.
   *
   * @remarks
   * Optional, so a room opened by an older client still starts: it then gets
   * the same number of rounds the settings page defaults to.
   */
  readonly rounds?: number;
};

/** What travels off the public snapshot: one seat's cards. */
export type ArschlochHand = {
  readonly cards?: readonly Card[];
};

/**
 * The card a hidden card is shown as.
 *
 * @remarks
 * A card of the pack in shape and of no pack in fact: the id says what it is,
 * so a snapshot that ever reached a screen unredacted would be obvious rather
 * than subtle.
 */
const FACE_DOWN: Card = { id: "verdeckt", suit: "kreuz", rank: "sieben" };

/** The adapter the online layer drives the game through. */
export const arschlochAdapter: OnlineAdapter<
  ArschlochGame,
  ArschlochMove,
  ArschlochHand,
  ArschlochOptions
> = {
  gameId: ARSCHLOCH_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): ArschlochGame {
    const table: ArschlochSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    const rounds = options?.rounds ?? DEFAULT_ROUNDS;
    return createGame(
      table,
      seed,
      ROUND_COUNTS.includes(rounds) ? rounds : DEFAULT_ROUNDS,
    );
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // One card is one move, and a trick is many of them - but each of those is
    // a decision of its own, so every move may have the full clock.
    return `${game.round}-${game.phase}-${game.active}-${game.log.length}`;
  },

  applyMove(game, seatIndex, move): ArschlochGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): ArschlochMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): ArschlochGame {
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        hand: player.hand.map(() => FACE_DOWN),
      })),
    };
  },

  privateHands(game): readonly ArschlochHand[] {
    return game.players.map((player) => ({ cards: player.hand }));
  },

  withOwnHand(game, seatIndex, hand): ArschlochGame {
    return hand.cards === undefined
      ? game
      : {
          ...game,
          players: game.players.map((player, at) =>
            at === seatIndex ? { ...player, hand: hand.cards ?? [] } : player,
          ),
        };
  },

  withAllHands(game, hands): ArschlochGame {
    return {
      ...game,
      players: game.players.map((player, at) => ({
        ...player,
        hand: hands[at]?.cards ?? player.hand,
      })),
    };
  },

  vault(): ArschlochHand | null {
    // Nothing lies face down that belongs to the table rather than to a seat.
    return null;
  },

  effectFor(): { readonly type: string } | null {
    // A card landing on the pile is the loudest thing on the screen already.
    return null;
  },

  isGameState(value): value is ArschlochGame {
    return isArschlochGame(value);
  },

  isHand(value): value is ArschlochHand {
    return isHand(value);
  },

  isMove(value): value is ArschlochMove {
    return isArschlochMove(value);
  },
};

/** Checks an untrusted value is one seat's hand. */
function isHand(value: unknown): value is ArschlochHand {
  const hand = value as { cards?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    (hand.cards === undefined ||
      (Array.isArray(hand.cards) &&
        hand.cards.every((card) => isCardish(card))))
  );
}

/** Whether a value has the shape of a card. */
function isCardish(value: unknown): boolean {
  const card = value as { id?: unknown; suit?: unknown; rank?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof card.id === "string" &&
    typeof card.suit === "string" &&
    typeof card.rank === "string"
  );
}
