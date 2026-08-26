/**
 * Plugs Bohnanza into the shared online layer.
 *
 * @module
 * @remarks
 * **The fields are public and the hands are not**, which is exactly how the
 * game sits on a table. Everything anybody could see by looking travels in the
 * shared snapshot untouched: every field with its sort and its height, the
 * cards lying crosswise, the two face-up cards, the discard pile, each
 * Talerstapel, and how many cards each player is holding. A Bohnanza player who
 * cannot read the other fields is not playing Bohnanza - deciding who to offer
 * a Sojabohne to *is* reading them.
 *
 * Three things are hidden, in the two ways the online layer has for it:
 *
 * - A **hand** is secret from the others and not from its owner, so it rides
 *   that seat's private channel. What goes out publicly is a row of face-down
 *   cards of the right length, because at a table everyone can count an
 *   opponent's cards and nobody can read them - and here the *number* is more
 *   than trivia, since it is how close somebody is to being forced to plant.
 * - The **draw pile** is secret from everybody, its owner included, so it goes
 *   into the host-only vault. Its composition can be worked out from the
 *   face-up cards by anybody willing to; its **order** cannot, and the order is
 *   what the next two reveals are.
 * - The **Talerstapel** cards lie face down, so which beans have left the game
 *   is nobody's business either. They ride the vault with the deck. Only how
 *   many there are is public, and that is a plain number on each player.
 *
 * One thing that looks secret and is not: an offered card. Putting a card into
 * a proposal is showing it - "Ich biete neben der aufgedeckten Sojabohne
 * zusätzlich eine Feuerbohne aus meiner Hand" - so the offer carries whole
 * cards and is never redacted. The card stays in the hand it came from until
 * the trade is done, which is why blanking the hand does not blank the offer.
 */
import { aiMove } from "@/games/bohnanza/engine/ai";
import {
  BEANS,
  faceDownCard,
  type Bean,
  type Card,
} from "@/games/bohnanza/engine/beans";
import { applyMove, seatOnTurn } from "@/games/bohnanza/engine/moves";
import { isBohnanzaGame } from "@/games/bohnanza/engine/serialization";
import { createGame, type BohnanzaSeat } from "@/games/bohnanza/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type BohnanzaGame,
  type BohnanzaMove,
} from "@/games/bohnanza/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const BOHNANZA_GAME_ID = "bohnanza";

/** Bohnanza has nothing to choose before a game - the table size decides. */
export type BohnanzaOptions = object;

/** What travels off the public snapshot. */
export type BohnanzaHand = {
  /** One seat's own hand, in order, on that seat's private channel. */
  readonly hand?: readonly Card[];
  /** The draw pile and the spent Taler cards - the host's vault. */
  readonly vault?: {
    readonly deck: readonly Card[];
    readonly spent: readonly Card[];
  };
};

/** The adapter the online layer drives the game through. */
export const bohnanzaAdapter: OnlineAdapter<
  BohnanzaGame,
  BohnanzaMove,
  BohnanzaHand,
  BohnanzaOptions
> = {
  gameId: BOHNANZA_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): BohnanzaGame {
    const table: BohnanzaSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // A turn here is a dozen moves through four phases, so the clock must not
    // restart on each of them - but it must restart when the move passes to
    // somebody else, and in this game it does that constantly: a proposal is
    // answered by whoever it was made to, and Phase 3 goes round the table.
    // Their thinking time is their own rather than borrowed from the turn.
    return `${game.turn}-${game.phase}-${seatOnTurn(game) ?? -1}-${game.offers}`;
  },

  applyMove(game, seatIndex, move): BohnanzaGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): BohnanzaMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): BohnanzaGame {
    return {
      ...game,
      players: game.players.map((player, seat) => ({
        ...player,
        hand: blank(player.hand.length, `h${seat}`),
      })),
      deck: blank(game.deck.length, "d"),
      spent: blank(game.spent.length, "s"),
    };
  },

  privateHands(game): readonly BohnanzaHand[] {
    return game.players.map((player) => ({ hand: player.hand }));
  },

  withOwnHand(game, seatIndex, hand): BohnanzaGame {
    return hand.hand === undefined
      ? game
      : {
          ...game,
          players: game.players.map((player, at) =>
            at === seatIndex
              ? { ...player, hand: hand.hand ?? player.hand }
              : player,
          ),
        };
  },

  withAllHands(game, hands): BohnanzaGame {
    return {
      ...game,
      players: game.players.map((player, at) => ({
        ...player,
        hand: hands[at]?.hand ?? player.hand,
      })),
    };
  },

  vault(game): BohnanzaHand | null {
    return { vault: { deck: game.deck, spent: game.spent } };
  },

  applyVault(game, stashed): BohnanzaGame {
    const kept = stashed.vault;
    return kept === undefined
      ? game
      : { ...game, deck: kept.deck, spent: kept.spent };
  },

  effectFor(_pre, _seatIndex, move): { readonly type: string } | null {
    // A harvest is the one thing worth marking: it is the only move that pays
    // anybody, it can happen on somebody else's turn, and it is easy to miss.
    // A planted card lands on a field the screen is already showing.
    return move.kind === "harvest" ? { type: "harvest" } : null;
  },

  isGameState(value): value is BohnanzaGame {
    return isBohnanzaGame(value);
  },

  isHand(value): value is BohnanzaHand {
    return isBohnanzaHand(value);
  },

  isMove(value): value is BohnanzaMove {
    return isBohnanzaMove(value);
  },
};

/**
 * A row of face-down cards.
 *
 * @param count - how many
 * @param tag - what makes their ids unique in the snapshot
 * @returns cards that say nothing but how many there are
 * @remarks
 * Built through {@link faceDownCard} rather than made up here, because the
 * screen has to be able to recognise one. Your own hand rides a private channel
 * that lands a moment after this snapshot does, and until it arrives these are
 * what the table has to draw - as card backs, and never as beans you do not
 * hold.
 */
function blank(count: number, tag: string): readonly Card[] {
  return Array.from({ length: count }, (unused, at) => faceDownCard(tag, at));
}

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = [
  "plant",
  "done",
  "harvest",
  "offer",
  "answer",
  "withdraw",
  "endTrade",
  "settle",
];

/** Checks an untrusted value is a move. */
function isBohnanzaMove(value: unknown): value is BohnanzaMove {
  const move = value as {
    kind?: unknown;
    field?: unknown;
    to?: unknown;
    give?: unknown;
    want?: unknown;
    yes?: unknown;
    cards?: unknown;
    card?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.field === undefined || Number.isInteger(move.field)) &&
    (move.to === undefined || Number.isInteger(move.to)) &&
    (move.yes === undefined || typeof move.yes === "boolean") &&
    (move.card === undefined || typeof move.card === "string") &&
    isIdList(move.give) &&
    isIdList(move.cards) &&
    (move.want === undefined ||
      (Array.isArray(move.want) &&
        move.want.every((bean) => BEANS.includes(bean as Bean))))
  );
}

/** Whether a field naming cards names them the way a move may. */
function isIdList(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((id) => typeof id === "string"))
  );
}

/** Checks an untrusted value is a hand or the vault. */
function isBohnanzaHand(value: unknown): value is BohnanzaHand {
  const held = value as { hand?: unknown; vault?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    (held.hand === undefined || isCardList(held.hand)) &&
    (held.vault === undefined || isVault(held.vault))
  );
}

/** Whether the host's stash is the host's stash. */
function isVault(value: unknown): boolean {
  const vault = value as { deck?: unknown; spent?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    isCardList(vault.deck) &&
    isCardList(vault.spent)
  );
}

/** Whether a value is a list of cards. */
function isCardList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((card) => {
      const one = card as Card;
      return (
        typeof one === "object" &&
        one !== null &&
        typeof one.id === "string" &&
        BEANS.includes(one.bean)
      );
    })
  );
}
