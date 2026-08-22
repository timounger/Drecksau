/**
 * Plugs Risiko into the shared online layer.
 *
 * @module
 * @remarks
 * **Almost everything in this game is public, and that is the point of it.** The
 * board is on the table: who holds what, how many units stand where, which
 * continents are finished. All of that goes out in the shared snapshot
 * unchanged, because a Risk player who cannot count an opponent's border is not
 * playing Risk.
 *
 * Two things are not public, and they are kept in the two different ways the
 * online layer has for it:
 *
 * - A **hand of cards** is secret from the others and not from its owner, so it
 *   rides that seat's private channel. The public snapshot carries the right
 *   number of face-down cards, because how many cards somebody is sitting on is
 *   itself public - "sparen Sie Ihre Karten für einen großen Umtausch" is a
 *   threat you are meant to be able to see coming.
 * - The **draw pile** is secret from everybody, its owner included, and so are
 *   the three cards buried under each neutral army in the two-player game.
 *   Those go into the host-only vault, which exists for exactly this: state
 *   belonging to the table rather than to a seat. A new host restores them on
 *   failover.
 *
 * The truce card is in that pile, and hiding the pile hides **when** it will
 * come - which is the whole of what that card does.
 */
import { aiMove } from "@/games/risiko/engine/ai";
import { HIDDEN_CARD } from "@/games/risiko/engine/cards";
import { territoryOf } from "@/games/risiko/engine/map";
import { applyMove, seatOnTurn } from "@/games/risiko/engine/moves";
import { isRisikoGame } from "@/games/risiko/engine/serialization";
import { createGame, type RisikoSeat } from "@/games/risiko/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type RisikoGame,
  type RisikoMove,
  type Variant,
} from "@/games/risiko/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const RISIKO_GAME_ID = "risiko";

/** What the host chose before dealing. */
export type RisikoOptions = {
  /** Which of the box's three games; the host's setting. */
  readonly variant?: Variant;
};

/** What travels off the public snapshot. */
export type RisikoHand = {
  /** One seat's own cards, on that seat's private channel. */
  readonly cards?: readonly string[];
  /** The draw pile, and every neutral army's buried three - the host's vault. */
  readonly vault?: {
    readonly deck: readonly string[];
    readonly discard: readonly string[];
    /** Each seat's real hand, so a new host can rebuild the neutral stashes. */
    readonly stashes: readonly (readonly string[])[];
  };
};

/** The adapter the online layer drives the game through. */
export const risikoAdapter: OnlineAdapter<
  RisikoGame,
  RisikoMove,
  RisikoHand,
  RisikoOptions
> = {
  gameId: RISIKO_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): RisikoGame {
    const table: RisikoSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    // Two people get the two-player game with its neutral armies, because the
    // box has no basic game for two. More than two get whatever the host chose.
    const wanted =
      table.length === MIN_PLAYERS
        ? "zweispieler"
        : (options?.variant ?? "grundspiel");
    return createGame(table, wanted, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // A turn is a dozen moves through four phases, so the clock must not
    // restart on every one of them - otherwise a player who keeps attacking is
    // never hurried at all. The phase is in the key because the four are
    // genuinely separate jobs and each deserves its own budget.
    return `${game.active}-${game.phase}`;
  },

  applyMove(game, seatIndex, move): RisikoGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): RisikoMove | null {
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): RisikoGame {
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        cards: player.cards.map(() => HIDDEN_CARD),
      })),
      deck: game.deck.map(() => HIDDEN_CARD),
      discard: game.discard.map(() => HIDDEN_CARD),
    };
  },

  privateHands(game): readonly RisikoHand[] {
    return game.players.map((player) => ({ cards: player.cards }));
  },

  withOwnHand(game, seatIndex, hand): RisikoGame {
    return hand.cards === undefined
      ? game
      : {
          ...game,
          players: game.players.map((player, at) =>
            at === seatIndex ? { ...player, cards: hand.cards ?? [] } : player,
          ),
        };
  },

  withAllHands(game, hands): RisikoGame {
    return {
      ...game,
      players: game.players.map((player, at) => ({
        ...player,
        cards: hands[at]?.cards ?? player.cards,
      })),
    };
  },

  vault(game): RisikoHand | null {
    return {
      vault: {
        deck: game.deck,
        discard: game.discard,
        stashes: game.players.map((player) => player.cards),
      },
    };
  },

  applyVault(game, stashed): RisikoGame {
    const kept = stashed.vault;
    return kept === undefined
      ? game
      : {
          ...game,
          deck: kept.deck,
          discard: kept.discard,
          players: game.players.map((player, at) => ({
            ...player,
            // Only the armies nobody plays: a real player's hand comes back on
            // their own channel, and the vault's copy of it may be a turn old.
            cards: player.isNeutral ? (kept.stashes[at] ?? []) : player.cards,
          })),
        };
  },

  effectFor(_pre, _seatIndex, move): { readonly type: string } | null {
    // Dice landing is the one thing worth an animation; everything else on this
    // board is a counter moving, which the board already shows.
    return move.kind === "attack" ? { type: "attack" } : null;
  },

  isGameState(value): value is RisikoGame {
    return isRisikoGame(value);
  },

  isHand(value): value is RisikoHand {
    return isRisikoHand(value);
  },

  isMove(value): value is RisikoMove {
    return isRisikoMove(value);
  },
};

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = [
  "claim",
  "place",
  "trade",
  "attack",
  "advance",
  "boost",
  "done",
  "fortify",
  "endTurn",
];

/** Checks an untrusted value is a move. */
function isRisikoMove(value: unknown): value is RisikoMove {
  const move = value as {
    kind?: unknown;
    to?: unknown;
    from?: unknown;
    count?: unknown;
    units?: unknown;
    cards?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    isPlace(move.to) &&
    isPlace(move.from) &&
    (move.count === undefined || Number.isInteger(move.count)) &&
    (move.units === undefined || Number.isInteger(move.units)) &&
    (move.cards === undefined || isCardList(move.cards))
  );
}

/** Whether a field naming a territory names one. */
function isPlace(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "string" && territoryOf(value) !== null)
  );
}

/** Whether a field naming cards names cards. */
function isCardList(value: unknown): boolean {
  return (
    Array.isArray(value) && value.every((card) => typeof card === "string")
  );
}

/** Checks an untrusted value is a hand or a vault. */
function isRisikoHand(value: unknown): value is RisikoHand {
  const hand = value as { cards?: unknown; vault?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    (hand.cards === undefined || isCardList(hand.cards)) &&
    (hand.vault === undefined || isVault(hand.vault))
  );
}

/** Whether the host's stash is the host's stash. */
function isVault(value: unknown): boolean {
  const vault = value as {
    deck?: unknown;
    discard?: unknown;
    stashes?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    isCardList(vault.deck) &&
    isCardList(vault.discard) &&
    Array.isArray(vault.stashes) &&
    vault.stashes.every(isCardList)
  );
}
