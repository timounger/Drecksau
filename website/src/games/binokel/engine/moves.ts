/**
 * The round state machine: bidding, exchange, melding, trick play, scoring.
 *
 * @module
 * @remarks
 * Pure transitions over {@link GameState}. Each function checks the move is
 * legal for the current phase and player and returns a new state. The UI and
 * the AI only ever call legal moves; an illegal one throws, as a safety net.
 * The rules are in `docs/games/binokel/game-rules.md`.
 */
import { createDeck, SUITS, type Suit } from "./cards";
import { findMelds } from "./melds";
import { shuffle } from "./random";
import { roundResult } from "./scoring";
import { PLAYER_COUNT } from "./setup";
import type { BinokelPlayer, GameState } from "./state";
import { legalPlays, trickWinnerIndex } from "./tricks";

/** Smallest bid a player may make. */
export const MIN_BID = 150;

/** Bids go up in steps of this. */
export const BID_STEP = 10;

/** What a bidder does on their turn. */
export type BidAction = { readonly kind: "pass" } | { readonly kind: "bid" };

/**
 * The value the current bidder would bid if they raise.
 *
 * @param state - the game state
 * @returns the next legal bid amount
 */
export function nextBidValue(state: GameState): number {
  return Math.max(state.highestBid + BID_STEP, MIN_BID);
}

/**
 * Applies a bid or a pass from the current bidder.
 *
 * @param state - a state in the bidding phase
 * @param action - raise or pass
 * @returns the state after the action; may move on to the exchange phase
 * @throws if it is not the bidding phase or the player has already passed
 */
export function applyBid(state: GameState, action: BidAction): GameState {
  const index = state.currentPlayerIndex;
  if (state.phase !== "bidding" || !state.players[index].bidding) {
    throw new Error("no bid is expected here");
  }

  const value = nextBidValue(state);
  const players =
    action.kind === "bid"
      ? patch(state.players, index, { bid: value, bidding: true })
      : patch(state.players, index, { bidding: false });
  const highestBid = action.kind === "bid" ? value : state.highestBid;

  const stillBidding = players.filter((player) => player.bidding);
  let next: GameState;
  if (stillBidding.length <= 1) {
    next = enterExchange({ ...state, players, highestBid });
  } else {
    next = {
      ...state,
      players,
      highestBid,
      currentPlayerIndex: nextBiddingIndex(players, index),
    };
  }
  return next;
}

/** Hands the Dabb to the winning bidder and opens the exchange phase. */
function enterExchange(state: GameState): GameState {
  const declarerIndex = state.players.findIndex((player) => player.bidding);
  const winner = declarerIndex >= 0 ? declarerIndex : state.currentPlayerIndex;
  const highestBid = Math.max(state.highestBid, MIN_BID);

  const players = patch(state.players, winner, {
    hand: [...state.players[winner].hand, ...state.dabb],
  });
  return {
    ...state,
    players,
    dabb: [],
    takenDabb: [...state.dabb],
    declarerIndex: winner,
    highestBid,
    phase: "exchange",
    currentPlayerIndex: winner,
  };
}

/** Hand size per player with Sevens. */
const HAND_WITH_SEVENS = 15;
/** Hand size per player without Sevens. */
const HAND_WITHOUT_SEVENS = 12;
/** Dabb size with Sevens. */
const DABB_WITH_SEVENS = 3;
/** Dabb size without Sevens. */
const DABB_WITHOUT_SEVENS = 4;

/**
 * Base hand size for the current deck.
 *
 * @param state - the game state
 * @returns cards per player once the declarer has discarded
 */
export function baseHandSize(state: GameState): number {
  return state.withSevens ? HAND_WITH_SEVENS : HAND_WITHOUT_SEVENS;
}

/**
 * The declarer discards the extra cards taken from the Dabb.
 *
 * @param state - a state in the exchange phase, before the trump is set
 * @param cardIds - the cards to discard, as many as were taken
 * @returns the state with the cards set aside (they count as the declarer's)
 * @throws if the count is wrong or a card is not in hand
 * @remarks
 * The discarded cards go straight to the declarer's won pile, as in Binokel
 * their Augen belong to the declarer.
 */
export function discard(
  state: GameState,
  cardIds: readonly string[],
): GameState {
  const index = state.declarerIndex;
  if (state.phase !== "exchange" || index === null) {
    throw new Error("no discard is expected here");
  }
  const declarer = state.players[index];
  const need = declarer.hand.length - baseHandSize(state);
  const chosen = declarer.hand.filter((card) => cardIds.includes(card.id));
  if (need <= 0 || chosen.length !== need || cardIds.length !== need) {
    throw new Error(`must discard exactly ${need} cards`);
  }

  const players = patch(state.players, index, {
    hand: declarer.hand.filter((card) => !cardIds.includes(card.id)),
    won: [...declarer.won, ...chosen],
  });
  // The discard step is over - the picked-up Dabb no longer shows apart.
  return { ...state, players, takenDabb: [] };
}

/**
 * The declarer names the trump; every player's melds are then counted.
 *
 * @param state - a state in the exchange phase with the hand at base size
 * @param trump - the trump suit
 * @returns the state in the melding phase, melds tallied
 * @throws if the declarer has not discarded yet or trump is already set
 */
export function chooseTrump(state: GameState, trump: Suit): GameState {
  const index = state.declarerIndex;
  if (
    state.phase !== "exchange" ||
    index === null ||
    state.trump !== null ||
    state.players[index].hand.length !== baseHandSize(state)
  ) {
    throw new Error("cannot set the trump now");
  }

  const players = state.players.map((player) => ({
    ...player,
    meldPoints: findMelds(player.hand, trump, state.withSevens).total,
  }));
  return { ...state, players, trump, phase: "melding" };
}

/**
 * Moves from showing the melds into trick play.
 *
 * @param state - a state in the melding phase
 * @returns the state in the trick phase, the declarer to lead
 * @throws if it is not the melding phase
 */
export function beginTricks(state: GameState): GameState {
  const index = state.declarerIndex;
  if (state.phase !== "melding" || index === null) {
    throw new Error("not ready for tricks");
  }
  return {
    ...state,
    phase: "trick",
    leaderIndex: index,
    currentPlayerIndex: index,
    currentTrick: [],
  };
}

/**
 * Plays a card into the current trick.
 *
 * @param state - a state in the trick phase
 * @param cardId - the card the current player plays
 * @returns the state after the card, resolving the trick and round as needed
 * @throws if the card is not the current player's or not a legal play
 */
export function playCard(state: GameState, cardId: string): GameState {
  const index = state.currentPlayerIndex;
  if (state.phase !== "trick") {
    throw new Error("no card is expected here");
  }
  const actor = state.players[index];
  const card = actor.hand.find((candidate) => candidate.id === cardId);
  const legal = legalPlays(actor.hand, state.currentTrick, state.trump);
  if (card === undefined || !legal.some((c) => c.id === cardId)) {
    throw new Error("that card cannot be played");
  }

  const players = patch(state.players, index, {
    hand: actor.hand.filter((c) => c.id !== cardId),
  });
  const trick = [...state.currentTrick, { playerIndex: index, card }];

  let next: GameState;
  if (trick.length < PLAYER_COUNT) {
    next = {
      ...state,
      players,
      currentTrick: trick,
      currentPlayerIndex: (index + 1) % PLAYER_COUNT,
    };
  } else {
    next = resolveTrick({ ...state, players }, trick);
  }
  return next;
}

/** Awards a completed trick and, if the hands are empty, scores the round. */
function resolveTrick(
  state: GameState,
  trick: GameState["currentTrick"],
): GameState {
  const winner = trickWinnerIndex(trick, state.trump);
  const wonCards = trick.map((played) => played.card);
  const players = patch(state.players, winner, {
    won: [...state.players[winner].won, ...wonCards],
    hasTrick: true,
  });

  const afterTrick: GameState = {
    ...state,
    players,
    currentTrick: [],
    leaderIndex: winner,
    currentPlayerIndex: winner,
  };

  const handsEmpty = players.every((player) => player.hand.length === 0);
  return handsEmpty ? finishRound(afterTrick) : afterTrick;
}

/** Applies the round's scores and decides whether the match is over. */
function finishRound(state: GameState): GameState {
  const result = roundResult(state);
  const players = state.players.map((player, index) => ({
    ...player,
    score: player.score + result.perPlayer[index].delta,
  }));

  const leader = players.reduce((best, player) =>
    player.score > best.score ? player : best,
  );
  const over = leader.score >= state.targetScore;

  return {
    ...state,
    players,
    phase: over ? "matchEnd" : "roundEnd",
    matchWinnerId: over ? leader.id : null,
  };
}

/**
 * Deals the next round, keeping the scores and moving the deal on.
 *
 * @param state - a state in the roundEnd phase
 * @returns a fresh bidding state for the next round
 * @throws if the round is not over
 */
export function nextRound(state: GameState): GameState {
  if (state.phase !== "roundEnd") {
    throw new Error("the round is not over");
  }
  const handSize = baseHandSize(state);
  const dabbSize = state.withSevens ? DABB_WITH_SEVENS : DABB_WITHOUT_SEVENS;
  const shuffled = shuffle(createDeck(state.withSevens), state.random);
  const cards = [...shuffled.items];
  const dealerIndex = (state.dealerIndex + 1) % PLAYER_COUNT;

  const players: BinokelPlayer[] = state.players.map((player) => ({
    ...player,
    hand: cards.splice(0, handSize),
    won: [],
    meldPoints: 0,
    hasTrick: false,
    bid: null,
    bidding: true,
  }));
  const dabb = cards.splice(0, dabbSize);
  const forehand = (dealerIndex + 1) % PLAYER_COUNT;

  return {
    ...state,
    players,
    dealerIndex,
    phase: "bidding",
    dabb,
    takenDabb: [],
    currentPlayerIndex: forehand,
    highestBid: 0,
    declarerIndex: null,
    trump: null,
    currentTrick: [],
    leaderIndex: forehand,
    random: shuffled.state,
    matchWinnerId: null,
  };
}

/** The next player who is still bidding, going round the table. */
function nextBiddingIndex(
  players: readonly BinokelPlayer[],
  from: number,
): number {
  let index = from;
  do {
    index = (index + 1) % PLAYER_COUNT;
  } while (!players[index].bidding);
  return index;
}

/** Returns a copy of the players with one player patched. */
function patch(
  players: readonly BinokelPlayer[],
  index: number,
  changes: Partial<BinokelPlayer>,
): BinokelPlayer[] {
  return players.map((player, i) =>
    i === index ? { ...player, ...changes } : player,
  );
}

/** The trump suits a declarer may choose from. */
export const TRUMP_CHOICES: readonly Suit[] = SUITS;
