/**
 * The Drecksau binding for the shared online layer.
 *
 * @module
 * @remarks
 * Everything the game-agnostic online core needs from Drecksau lives here: how
 * to deal a game, referee a move, run the computer, hide opponents' hands, and
 * validate anything read off the wire. The core ({@link @/online/room},
 * {@link @/online/use-online-room}) drives the game only through this adapter,
 * so it never touches the Drecksau engine directly.
 *
 * Hiding hands: the host holds every player's real hand but must not reveal it -
 * seeing an opponent's cards would be the online version of the cheating the
 * computer players are kept from. So {@link redact} replaces each card's type
 * with a decoy, keeping only its id and count, and the real hand travels to its
 * owner on a private channel.
 */
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";
import { chooseAiMove } from "@/games/drecksau/engine/ai";
import type { Card } from "@/games/drecksau/engine/cards";
import { applyMove } from "@/games/drecksau/engine/engine";
import { isLegalMove } from "@/games/drecksau/engine/moves";
import { isGameState } from "@/games/drecksau/engine/serialization";
import {
  createGame,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "@/games/drecksau/engine/setup";
import type { GameState, Move } from "@/games/drecksau/engine/state";
import { loadSettings } from "@/games/drecksau/settings/app-settings";

/** The deck choices a Drecksau host makes when starting a game. */
export type DrecksauOptions = {
  readonly withExpansion: boolean;
  readonly withDefense: boolean;
};

/**
 * The card type a hidden card is shown as.
 *
 * @remarks
 * A redacted hand keeps each card's id (so references like the Glücksvogel's
 * pending ids stay valid) but replaces its type with this decoy. Opponents'
 * hands are only ever rendered as a count, never as cards, so the decoy is
 * never seen; it exists so the redacted card still passes {@link isGameState}.
 */
const DECOY_CARD_TYPE = "mud";

/**
 * Redacts every player's hand down to its size.
 *
 * @param state - the authoritative game state
 * @returns a copy in which no hand reveals its cards, only how many there are
 */
export function redactHands(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: player.hand.map((card) => ({ id: card.id, type: DECOY_CARD_TYPE })),
    })),
  };
}

/**
 * Puts a player's real hand back into a shared, redacted state.
 *
 * @param state - the shared state with redacted hands
 * @param playerIndex - the seat/player index whose hand to restore
 * @param hand - that player's real cards
 * @returns a copy showing the player their own hand and others' only as counts
 */
export function withOwnHand(
  state: GameState,
  playerIndex: number,
  hand: readonly Card[],
): GameState {
  return {
    ...state,
    players: state.players.map((player, index) =>
      index === playerIndex ? { ...player, hand: [...hand] } : player,
    ),
  };
}

/**
 * Puts every seat's real hand back into a shared, redacted state.
 *
 * @param state - the shared state with redacted hands
 * @param hands - each seat's real cards, in seat order (may be missing)
 * @returns a copy with real hands, for a new host to referee from
 */
export function withAllHands(
  state: GameState,
  hands: readonly (readonly Card[] | undefined)[],
): GameState {
  return {
    ...state,
    players: state.players.map((player, index) => ({
      ...player,
      hand: [...(hands[index] ?? [])],
    })),
  };
}

/** Checks a single card of a private hand. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) && isNonEmptyString(card.id) && isNonEmptyString(card.type)
  );
}

/**
 * Checks an untrusted value is a list of cards (a private hand).
 *
 * @param value - the value read from the transport
 * @returns true if every element looks like a card
 */
export function isHand(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Checks an untrusted move against the shape of a {@link Move}. */
export function isMove(value: unknown): value is Move {
  const move = value as Move;
  let valid: boolean;

  if (!isObject(value) || typeof move.kind !== "string") {
    valid = false;
  } else {
    switch (move.kind) {
      case "playCard":
        valid =
          isNonEmptyString(move.cardId) &&
          (move.targetPigId === undefined ||
            isNonEmptyString(move.targetPigId));
        break;
      case "discardCard":
        valid = isNonEmptyString(move.cardId);
        break;
      case "redrawHand":
        valid = true;
        break;
      default:
        valid = false;
    }
  }

  return valid;
}

/** A string with content. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** A plain object, not null. */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/** The Drecksau adapter for the shared online layer. */
export const drecksauAdapter: OnlineAdapter<
  GameState,
  Move,
  Card[],
  DrecksauOptions
> = {
  gameId: "drecksau",
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): GameState {
    return createGame(
      seats.map((seat) => ({ name: seat.name, isHuman: true })),
      {
        seed,
        withExpansion: options.withExpansion,
        withDefense: options.withDefense,
      },
    );
  },

  seatIndexOnTurn(game): number | null {
    return game.currentPlayerIndex;
  },

  applyMove(game, seatIndex, move): GameState | null {
    if (game.currentPlayerIndex !== seatIndex || !isLegalMove(game, move)) {
      return null;
    }
    return applyMove(game, move);
  },

  isFinished(game): boolean {
    return game.winnerId !== null;
  },

  aiMove(game): Move | null {
    return chooseAiMove(game, loadSettings().difficulty);
  },

  redact(game): GameState {
    return redactHands(game);
  },

  privateHands(game): readonly Card[][] {
    return game.players.map((player) => [...player.hand]);
  },

  withOwnHand(game, seatIndex, hand): GameState {
    return withOwnHand(game, seatIndex, hand);
  },

  withAllHands(game, hands): GameState {
    return withAllHands(game, hands);
  },

  effectFor(pre, seatIndex, move): { readonly type: string } | null {
    let effect: { readonly type: string } | null = null;
    if (move.kind === "playCard") {
      const card = pre.players[seatIndex]?.hand.find(
        (candidate) => candidate.id === move.cardId,
      );
      if (card !== undefined) {
        effect = { type: card.type };
      }
    }
    return effect;
  },

  isGameState(value): value is GameState {
    return isGameState(value);
  },

  isMove(value): value is Move {
    return isMove(value);
  },

  isHand(value): value is Card[] {
    return isHand(value);
  },
};
