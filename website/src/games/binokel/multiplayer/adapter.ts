/**
 * The Binokel binding for the shared online layer.
 *
 * @module
 * @remarks
 * Binokel has more phases than a plain trick game, so a move carries which kind
 * of action it is (`bid`, `pass`, `discard`, `trump`, `declareGame`, `concede`,
 * `playCard`, `collectTrick`, `nextRound`), and the referee checks each one comes
 * from the seat that may act in the current phase before handing it to the engine.
 *
 * Hidden information: every player's hand is redacted from the shared snapshot
 * (replaced by decoy cards keeping only ids and counts) and delivered to its
 * owner privately, exactly as in Drecksau. The face-down Dabb belongs to no
 * seat, so it travels in the host vault so a taking-over host can restore it.
 */
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";
import {
  chooseBid,
  chooseCard,
  chooseDiscard,
  chooseTrumpSuit,
} from "@/games/binokel/engine/ai";
import { type Card, SUITS, type Suit } from "@/games/binokel/engine/cards";
import {
  applyBid,
  baseHandSize,
  chooseTrump,
  collectTrick,
  concede,
  declareGame,
  discard,
  nextRound,
  playCard,
} from "@/games/binokel/engine/moves";
import { isGameState } from "@/games/binokel/engine/serialization";
import {
  createGame,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "@/games/binokel/engine/setup";
import type { GameState, GameType } from "@/games/binokel/engine/state";
import { actingIndex } from "@/games/binokel/engine/turn";

/** The options a Binokel host chooses when starting a game. */
export type BinokelOptions = {
  /** True for the 48-card deck (with sevens), false for 40 cards. */
  readonly withSevens: boolean;
  /** Whether a Dabb (widow) is played. Defaults to true. */
  readonly withDabb?: boolean;
  /** Whether two teams play (four or six players). Defaults to false. */
  readonly teams?: boolean;
  /** Points that end the match. */
  readonly targetScore: number;
};

/** A player action, sent by a guest and refereed by the host. */
export type BinokelMove =
  | { readonly kind: "bid" }
  | { readonly kind: "pass" }
  | { readonly kind: "discard"; readonly cardIds: readonly string[] }
  | { readonly kind: "trump"; readonly suit: Suit }
  | { readonly kind: "declareGame"; readonly gameType: GameType }
  | { readonly kind: "concede" }
  | { readonly kind: "playCard"; readonly cardId: string }
  | { readonly kind: "collectTrick" }
  | { readonly kind: "nextRound" };

/** The suit and rank a decoy (hidden) card shows; never rendered face-up. */
const DECOY_SUIT: Suit = "eichel";
const DECOY_RANK = "sieben" as const;

/** The suits a value may name as trump. */
const SUIT_SET: ReadonlySet<string> = new Set(SUITS);

/** Replaces a card with a face-down decoy, keeping its id so it stays unique. */
function decoy(card: Card): Card {
  return { id: card.id, suit: DECOY_SUIT, rank: DECOY_RANK };
}

/** Checks a single card of a private hand. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) &&
    isNonEmptyString(card.id) &&
    typeof card.suit === "string" &&
    typeof card.rank === "string"
  );
}

/**
 * Checks an untrusted value is a list of cards (a private hand or the vault).
 *
 * @param value - the value read from the transport
 * @returns true if every element looks like a card
 */
export function isHand(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/**
 * Checks an untrusted value is a Binokel move.
 *
 * @param value - the value read from the transport
 * @returns true if it is a well-formed move
 */
export function isMove(value: unknown): value is BinokelMove {
  const move = value as BinokelMove;
  let valid: boolean;
  if (!isObject(value) || typeof move.kind !== "string") {
    valid = false;
  } else {
    switch (move.kind) {
      case "bid":
      case "pass":
      case "concede":
      case "collectTrick":
      case "nextRound":
        valid = true;
        break;
      case "declareGame":
        valid = move.gameType === "normal" || move.gameType === "durch";
        break;
      case "discard":
        valid =
          Array.isArray(move.cardIds) && move.cardIds.every(isNonEmptyString);
        break;
      case "trump":
        valid = typeof move.suit === "string" && SUIT_SET.has(move.suit);
        break;
      case "playCard":
        valid = isNonEmptyString(move.cardId);
        break;
      default:
        valid = false;
    }
  }
  return valid;
}

/** The computer's move for the current actor, or null if none is due. */
function aiMove(game: GameState): BinokelMove | null {
  let move: BinokelMove | null = null;
  switch (game.phase) {
    case "bidding":
      move =
        chooseBid(game).kind === "bid" ? { kind: "bid" } : { kind: "pass" };
      break;
    case "exchange": {
      const declarer = game.players[game.declarerIndex ?? 0];
      if (declarer.hand.length > baseHandSize(game)) {
        const need = declarer.hand.length - baseHandSize(game);
        move = { kind: "discard", cardIds: chooseDiscard(game, need) };
      } else {
        move = { kind: "trump", suit: chooseTrumpSuit(game) };
      }
      break;
    }
    case "melding":
      // The computer declarer always plays a normal game.
      move = { kind: "declareGame", gameType: "normal" };
      break;
    case "trick":
      move =
        game.currentTrick.length === game.players.length
          ? { kind: "collectTrick" }
          : { kind: "playCard", cardId: chooseCard(game) };
      break;
    case "roundEnd":
      move = { kind: "nextRound" };
      break;
    default:
      move = null; // matchEnd
  }
  return move;
}

/** A fixed 3-minute timeout for the slower discard and end-of-round screens. */
const SLOW_PHASE_TIMEOUT_MS = 180_000;

/**
 * The auto-play timeout for the current turn, given the host's chosen value.
 *
 * @param game - the game state on some seat's turn
 * @param configuredMs - the host's timeout in ms, or null when auto-play is off
 * @returns the timeout in ms for this turn, or null for no auto-play
 * @remarks
 * The host's value governs the fast phases - bidding ("Reizen") and trick play.
 * The slower discard ("Dabb drücken", the exchange phase) and the end-of-round
 * tricks display (roundEnd) get a fixed 3 minutes instead, so nobody is rushed
 * there but the table still cannot hang. With auto-play off, no turn is played.
 */
export function binokelTurnTimeoutMs(
  game: GameState,
  configuredMs: number | null,
): number | null {
  if (configuredMs === null || configuredMs <= 0) {
    return null;
  }
  return game.phase === "exchange" || game.phase === "roundEnd"
    ? SLOW_PHASE_TIMEOUT_MS
    : configuredMs;
}

/** A string with content. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** A plain object, not null. */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/** The Binokel adapter for the shared online layer. */
export const binokelAdapter: OnlineAdapter<
  GameState,
  BinokelMove,
  Card[],
  BinokelOptions
> = {
  gameId: "binokel",
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): GameState {
    return createGame(
      seats.map((seat) => ({ name: seat.name, isHuman: true })),
      {
        seed,
        withSevens: options.withSevens,
        withDabb: options.withDabb ?? true,
        teams: options.teams ?? false,
        targetScore: options.targetScore,
      },
    );
  },

  seatIndexOnTurn(game): number | null {
    return actingIndex(game);
  },

  applyMove(game, seatIndex, move): GameState | null {
    if (seatIndex !== actingIndex(game)) {
      return null;
    }
    let next: GameState | null = null;
    try {
      switch (move.kind) {
        case "bid":
          next =
            game.phase === "bidding" ? applyBid(game, { kind: "bid" }) : null;
          break;
        case "pass":
          next =
            game.phase === "bidding" ? applyBid(game, { kind: "pass" }) : null;
          break;
        case "discard":
          next = game.phase === "exchange" ? discard(game, move.cardIds) : null;
          break;
        case "trump":
          next =
            game.phase === "exchange" ? chooseTrump(game, move.suit) : null;
          break;
        case "declareGame":
          next =
            game.phase === "melding" ? declareGame(game, move.gameType) : null;
          break;
        case "concede":
          next = game.phase === "melding" ? concede(game) : null;
          break;
        case "playCard":
          next = game.phase === "trick" ? playCard(game, move.cardId) : null;
          break;
        case "collectTrick":
          next = game.phase === "trick" ? collectTrick(game) : null;
          break;
        case "nextRound":
          next = game.phase === "roundEnd" ? nextRound(game) : null;
          break;
        default:
          next = null;
      }
    } catch {
      next = null; // the engine rejects illegal moves by throwing
    }
    return next;
  },

  isFinished(game): boolean {
    return game.phase === "matchEnd";
  },

  aiMove(game): BinokelMove | null {
    return aiMove(game);
  },

  turnTimeoutMs(game, configuredMs): number | null {
    return binokelTurnTimeoutMs(game, configuredMs);
  },

  redact(game): GameState {
    // Melds are announced openly, so during melding every hand is shown to all
    // players (each client then computes and displays everyone's melds). The
    // rest of the time each hand is hidden behind decoys, size only.
    if (game.phase === "melding") {
      return game;
    }
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        hand: player.hand.map(decoy),
      })),
      dabb: game.dabb.map(decoy),
      takenDabb: game.takenDabb.map(decoy),
    };
  },

  privateHands(game): readonly Card[][] {
    return game.players.map((player) => [...player.hand]);
  },

  withOwnHand(game, seatIndex, hand): GameState {
    return {
      ...game,
      players: game.players.map((player, index) =>
        index === seatIndex ? { ...player, hand: [...hand] } : player,
      ),
    };
  },

  withAllHands(game, hands): GameState {
    return {
      ...game,
      players: game.players.map((player, index) => ({
        ...player,
        hand: [...(hands[index] ?? [])],
      })),
    };
  },

  effectFor(): { readonly type: string } | null {
    // Played cards show up in the trick area on their own; no overlay needed.
    return null;
  },

  vault(game): Card[] | null {
    // The face-down Dabb is only secret while it still holds cards (bidding).
    return game.dabb.length > 0 ? game.dabb.map((card) => ({ ...card })) : null;
  },

  applyVault(game, dabb): GameState {
    return { ...game, dabb: [...dabb] };
  },

  isGameState(value): value is GameState {
    return isGameState(value);
  },

  isMove(value): value is BinokelMove {
    return isMove(value);
  },

  isHand(value): value is Card[] {
    return isHand(value);
  },
};
