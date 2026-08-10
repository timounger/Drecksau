/**
 * Plugs "Das politische Talent" into the shared online layer.
 *
 * @module
 * @remarks
 * Three kinds of secret sit on this table, and they are hidden in three
 * different places.
 *
 * What belongs to **one party** - its opposition cards, the scandals still
 * lying face down, the two candidates it is choosing between - travels on that
 * seat's private channel and is blanked in the shared snapshot. What belongs to
 * **nobody** - the candidate and scandal draw piles - travels in the host
 * vault, so a client taking over as host can carry on dealing from the same
 * pile. And what everybody may see - seats, points, orientation, promises in
 * hand, uncovered scandals - simply stays in the snapshot.
 *
 * Blanked cards keep their slot: the arrays stay the same length, so everyone
 * can still see **how many** cards a party holds. Only the id becomes
 * {@link HIDDEN}, which is why no real card carries that id.
 */
import { aiMove } from "@/games/politik/engine/ai";
import { applyMove, seatOnTurn } from "@/games/politik/engine/moves";
import { isPolitikGame } from "@/games/politik/engine/serialization";
import { createGame, type PolitikSeat } from "@/games/politik/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type PolitikGame,
  type PolitikMove,
} from "@/games/politik/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const POLITIK_GAME_ID = "politik";

/** The id a hidden card is published as; the real one stays with the host. */
const HIDDEN = 0;

/**
 * How long a coalition may be haggled over before the computer steps in.
 *
 * @remarks
 * Longer than a normal turn on purpose: picking partners and handing out four
 * offices is the one screen where a player genuinely has to think, and being
 * timed out halfway through building a government is the most annoying thing
 * this game could do to somebody.
 */
const COALITION_TIMEOUT_MS = 90_000;

/**
 * This game has nothing to choose before it starts.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type PolitikOptions = object;

/**
 * What travels on a private channel.
 *
 * @remarks
 * The online layer uses one type for both a seat's own data and the host
 * vault, so this covers both. A **seat** fills the first three fields; the
 * **vault** fills the last two, and that copy only ever reaches a client that
 * is taking over as host.
 */
export type PolitikHand = {
  /** This seat's opposition cards. */
  readonly opposition?: readonly number[];
  /** This seat's scandals, in slot order - uncovered ones are public anyway. */
  readonly scandals?: readonly number[];
  /** The two candidates this seat is choosing between, if it is choosing. */
  readonly offer?: readonly number[];
  /** Vault only: the candidate draw pile. */
  readonly candidateDeck?: readonly number[];
  /** Vault only: the scandal draw pile. */
  readonly scandalDeck?: readonly number[];
};

/** The adapter the online layer drives this game through. */
export const politikAdapter: OnlineAdapter<
  PolitikGame,
  PolitikMove,
  PolitikHand,
  PolitikOptions
> = {
  gameId: POLITIK_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): PolitikGame {
    const table: PolitikSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): PolitikGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): PolitikMove | null {
    return aiMove(game);
  },

  turnTimeoutMs(game, configuredMs): number | null {
    return game.phase === "coalition" && configuredMs !== null
      ? Math.max(configuredMs, COALITION_TIMEOUT_MS)
      : configuredMs;
  },

  redact(game): PolitikGame {
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        opposition: player.opposition.map(() => HIDDEN),
        scandals: player.scandals.map((held) =>
          held.revealed ? held : { ...held, cardId: HIDDEN },
        ),
      })),
      offer:
        game.offer === null
          ? null
          : { ...game.offer, cardIds: game.offer.cardIds.map(() => HIDDEN) },
      candidateDeck: game.candidateDeck.map(() => HIDDEN),
      scandalDeck: game.scandalDeck.map(() => HIDDEN),
    };
  },

  privateHands(game): readonly PolitikHand[] {
    return game.players.map((player, seat) => ({
      opposition: player.opposition,
      scandals: player.scandals.map((held) => held.cardId),
      // Only the seat that is actually choosing gets to see the two cards.
      offer:
        game.offer !== null && game.offer.seat === seat
          ? game.offer.cardIds
          : undefined,
    }));
  },

  withOwnHand(game, seatIndex, hand): PolitikGame {
    return {
      ...restoreSeat(game, seatIndex, hand),
      offer:
        game.offer !== null &&
        game.offer.seat === seatIndex &&
        hand.offer !== undefined
          ? { ...game.offer, cardIds: [...hand.offer] }
          : game.offer,
    };
  },

  withAllHands(game, hands): PolitikGame {
    const restored = hands.reduce<PolitikGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restoreSeat(state, seat, hand),
      game,
    );
    const offerHand =
      game.offer === null ? undefined : hands[game.offer.seat]?.offer;
    return {
      ...restored,
      offer:
        game.offer === null || offerHand === undefined
          ? restored.offer
          : { ...game.offer, cardIds: [...offerHand] },
    };
  },

  vault(game): PolitikHand {
    return {
      candidateDeck: game.candidateDeck,
      scandalDeck: game.scandalDeck,
    };
  },

  applyVault(game, vault): PolitikGame {
    return {
      ...game,
      candidateDeck: isIdList(vault.candidateDeck)
        ? [...vault.candidateDeck]
        : game.candidateDeck,
      scandalDeck: isIdList(vault.scandalDeck)
        ? [...vault.scandalDeck]
        : game.scandalDeck,
    };
  },

  effectFor(): { readonly type: string } | null {
    // Every roll and every vote is already on screen with its result; there is
    // nothing left for a separate animation to announce.
    return null;
  },

  isGameState(value): value is PolitikGame {
    return isPolitikGame(value);
  },

  isHand(value): value is PolitikHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is PolitikMove {
    return isPolitikMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = [
  "chooseCandidate",
  "duel",
  "propose",
  "vote",
  "act",
];

/** Puts one seat's own cards back into a redacted snapshot. */
function restoreSeat(
  game: PolitikGame,
  seat: number,
  hand: PolitikHand,
): PolitikGame {
  const player = game.players[seat];
  return player === undefined
    ? game
    : {
        ...game,
        players: game.players.map((entry, at) =>
          at !== seat
            ? entry
            : {
                ...entry,
                opposition: isIdList(hand.opposition)
                  ? [...hand.opposition]
                  : entry.opposition,
                scandals: isIdList(hand.scandals)
                  ? entry.scandals.map((held, index) => ({
                      ...held,
                      cardId: hand.scandals?.[index] ?? held.cardId,
                    }))
                  : entry.scandals,
              },
        ),
      };
}

/** Checks an untrusted value is a move. */
function isPolitikMove(value: unknown): value is PolitikMove {
  const move = value as { kind?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind)
  );
}

/** Whether a value read off the wire is a list of card ids. */
function isIdList(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((id) => Number.isInteger(id));
}
