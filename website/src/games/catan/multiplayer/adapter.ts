/**
 * Plugs CATAN into the shared online layer.
 *
 * @module
 * @remarks
 * **The island is public and the hands are not**, which is exactly how it sits
 * on a table. Where every settlement, road and city stands, which number every
 * landscape carries, where the robber is, who holds which special tile - all of
 * that goes out in the shared snapshot untouched, because a Catan player who
 * cannot read the board is not playing Catan.
 *
 * Three things are hidden, in the two ways the online layer has for it:
 *
 * - A **hand of resource cards** is secret from the others and not from its
 *   owner, so it rides that seat's private channel. What travels in the public
 *   snapshot is the *count* - `CatanPlayer.cards` - because at a table everyone
 *   can count an opponent's cards and nobody can read them. That is not a
 *   detail: it is what tells you whether a seven will hurt somebody, and it is
 *   why the count is a stored field rather than something derived from a hand
 *   the wire has blanked.
 * - **Development cards** are secret the same way, and their *number* is public
 *   too. Played knights are public and stay public, because the Größte
 *   Rittermacht is decided by cards lying face up.
 * - The **development stack** is secret from everybody, its owner included, so
 *   it goes into the host-only vault. A new host restores it on failover.
 *
 * The one moment all of it comes out is the end. "Du deckst sie erst auf, wenn
 * du mindestens 10 Punkte erreicht hast" - so once the game is over, nothing is
 * redacted at all, and the closing table can show where every point came from.
 */
import { aiMove } from "@/games/catan/engine/ai";
import { applyMove, seatOnTurn } from "@/games/catan/engine/moves";
import { isCatanGame } from "@/games/catan/engine/serialization";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  createGame,
  type CatanSeat,
} from "@/games/catan/engine/setup";
import { NO_GOODS, type Goods } from "@/games/catan/engine/knights";
import { isPointCard, type Progress } from "@/games/catan/engine/progress";
import {
  NO_CARDS,
  RESOURCES,
  type CatanGame,
  type CatanMove,
  type DevKind,
  type Hand,
  type Mode,
  type Variant,
} from "@/games/catan/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const CATAN_GAME_ID = "catan";

/**
 * What a hidden development card looks like on the wire.
 *
 * @remarks
 * A real card rather than a placeholder kind, so nothing downstream has to know
 * about a sixth sort that is not in the box. It is unrevealing on purpose: the
 * only thing anybody reads off a foreign deck is how long it is, and a deck of
 * knights reports no victory points, which is precisely what must stay hidden.
 */
const FACE_DOWN: DevKind = "ritter";

/**
 * What a Fortschrittskarte looks like from the other side of the table.
 *
 * @remarks
 * A real card rather than a ninth invented one, for the same reason as
 * {@link FACE_DOWN}: nothing downstream has to know about a card that is not in
 * the box. Nothing ever reads it - a redacted card is only ever counted.
 */
const FACE_DOWN_CARD: Progress = "bergbau";

/** What the host chose before dealing. */
export type CatanOptions = {
  /** Siegpunkte needed to win; the printed game asks ten. */
  readonly target?: number;
  /** Which variants of *Händler & Barbaren* the host switched on. */
  readonly variants?: readonly Variant[];
  /** Which game the host chose - the printed one, or Städte & Ritter. */
  readonly mode?: Mode;
};

/** What travels off the public snapshot. */
export type CatanHand = {
  /** One seat's own cards, on that seat's private channel. */
  readonly hand?: Hand;
  readonly deck?: readonly DevKind[];
  readonly fresh?: readonly DevKind[];
  /** *Städte & Ritter*: the Handelswaren and Fortschrittskarten of one seat. */
  readonly goods?: Goods;
  readonly progress?: readonly Progress[];
  /** The undrawn development cards - the host's vault. */
  readonly vault?: {
    readonly stack: readonly DevKind[];
  };
};

/** The adapter the online layer drives the game through. */
export const catanAdapter: OnlineAdapter<
  CatanGame,
  CatanMove,
  CatanHand,
  CatanOptions
> = {
  gameId: CATAN_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): CatanGame {
    const table: CatanSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(
      table,
      seed,
      options?.target,
      options?.variants ?? [],
      options?.mode ?? "klassisch",
    );
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // A turn is a dozen moves through several phases, so the clock must not
    // restart on every one of them. The phase is in the key because a seven and
    // an offer hand the move to somebody who is not the active player at all,
    // and their thinking time is their own rather than borrowed.
    return `${game.active}-${game.phase}-${game.offer === null ? "" : "offer"}`;
  },

  applyMove(game, seatIndex, move): CatanGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): CatanMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): CatanGame {
    return game.phase === "gameOver"
      ? game
      : {
          ...game,
          players: game.players.map((player) => ({
            ...player,
            hand: NO_CARDS,
            deck: player.deck.map(() => FACE_DOWN),
            fresh: player.fresh.map(() => FACE_DOWN),
            // Städte & Ritter. Handelswaren are cards in hand and just as
            // secret; the count survives, the sorts do not. The Fortschritt
            // cards go face down **except** the two Siegpunkt ones, which the
            // rulebook lays open the moment they are drawn - and which the
            // standings would give away anyway.
            goods: NO_GOODS,
            progress: player.progress.map((card) =>
              isPointCard(card) ? card : FACE_DOWN_CARD,
            ),
          })),
          stack: game.stack.map(() => FACE_DOWN),
          decks: {
            wissenschaft: game.decks.wissenschaft.map(() => FACE_DOWN_CARD),
            handel: game.decks.handel.map(() => FACE_DOWN_CARD),
            politik: game.decks.politik.map(() => FACE_DOWN_CARD),
          },
        };
  },

  privateHands(game): readonly CatanHand[] {
    return game.players.map((player) => ({
      hand: player.hand,
      deck: player.deck,
      fresh: player.fresh,
      goods: player.goods,
      progress: player.progress,
    }));
  },

  withOwnHand(game, seatIndex, hand): CatanGame {
    return hand.hand === undefined
      ? game
      : {
          ...game,
          players: game.players.map((player, at) =>
            at === seatIndex
              ? {
                  ...player,
                  hand: hand.hand ?? player.hand,
                  deck: hand.deck ?? player.deck,
                  fresh: hand.fresh ?? player.fresh,
                  goods: hand.goods ?? player.goods,
                  progress: hand.progress ?? player.progress,
                }
              : player,
          ),
        };
  },

  withAllHands(game, hands): CatanGame {
    return {
      ...game,
      players: game.players.map((player, at) => ({
        ...player,
        hand: hands[at]?.hand ?? player.hand,
        deck: hands[at]?.deck ?? player.deck,
        fresh: hands[at]?.fresh ?? player.fresh,
      })),
    };
  },

  vault(game): CatanHand | null {
    return { vault: { stack: game.stack } };
  },

  applyVault(game, stashed): CatanGame {
    const kept = stashed.vault;
    return kept === undefined ? game : { ...game, stack: kept.stack };
  },

  effectFor(_pre, _seatIndex, move): { readonly type: string } | null {
    // The dice are the one thing worth an animation: they decide what everybody
    // at the table gets. Everything else is a piece appearing on the board,
    // which the board already shows.
    return move.kind === "roll" ? { type: "roll" } : null;
  },

  isGameState(value): value is CatanGame {
    return isCatanGame(value);
  },

  isHand(value): value is CatanHand {
    return isCatanHand(value);
  },

  isMove(value): value is CatanMove {
    return isCatanMove(value);
  },
};

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = [
  "town",
  "road",
  "city",
  "roll",
  "discard",
  "robber",
  "rob",
  "buy",
  "play",
  "choose",
  "bank",
  "offer",
  "answer",
  "deal",
  "withdraw",
  "endTurn",
];

/** The development cards a client may name. */
const CARD_KINDS: readonly string[] = [
  "ritter",
  "siegpunkt",
  "monopol",
  "strassenbau",
  "erfindung",
];

/** Checks an untrusted value is a move. */
function isCatanMove(value: unknown): value is CatanMove {
  const move = value as {
    kind?: unknown;
    at?: unknown;
    seat?: unknown;
    card?: unknown;
    sort?: unknown;
    give?: unknown;
    want?: unknown;
    cards?: unknown;
    yes?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.at === undefined || Number.isInteger(move.at)) &&
    (move.seat === undefined || Number.isInteger(move.seat)) &&
    (move.card === undefined || CARD_KINDS.includes(move.card as string)) &&
    (move.sort === undefined || isSort(move.sort)) &&
    (move.yes === undefined || typeof move.yes === "boolean") &&
    (move.cards === undefined || isHand(move.cards)) &&
    isGift(move.give) &&
    isGift(move.want)
  );
}

/**
 * Whether a field naming a trade's two sides names one.
 *
 * @remarks
 * The bank trade gives a single sort and the table offer gives a whole hand, so
 * both fields have to accept either shape.
 */
function isGift(value: unknown): boolean {
  return value === undefined || isSort(value) || isHand(value);
}

/** Whether a value names one of the five resources. */
function isSort(value: unknown): boolean {
  return typeof value === "string" && RESOURCES.includes(value as never);
}

/** Whether a value is a hand of resource cards. */
function isHand(value: unknown): boolean {
  const hand = value as Hand;
  return (
    typeof value === "object" &&
    value !== null &&
    RESOURCES.every((sort) => Number.isInteger(hand[sort]))
  );
}

/** Whether a value is a list of development cards. */
function isCardList(value: unknown): boolean {
  return (
    Array.isArray(value) && value.every((card) => CARD_KINDS.includes(card))
  );
}

/** Checks an untrusted value is a hand or a vault. */
function isCatanHand(value: unknown): value is CatanHand {
  const held = value as {
    hand?: unknown;
    deck?: unknown;
    fresh?: unknown;
    vault?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    (held.hand === undefined || isHand(held.hand)) &&
    (held.deck === undefined || isCardList(held.deck)) &&
    (held.fresh === undefined || isCardList(held.fresh)) &&
    (held.vault === undefined || isVault(held.vault))
  );
}

/** Whether the host's stash is the host's stash. */
function isVault(value: unknown): boolean {
  const vault = value as { stack?: unknown };
  return typeof value === "object" && value !== null && isCardList(vault.stack);
}
