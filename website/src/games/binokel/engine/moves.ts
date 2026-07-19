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
import { dealSizes } from "./setup";
import type { BinokelPlayer, GameState, GameType } from "./state";
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
  const base = { ...state, players, highestBid };

  const stillBidding = players.filter((player) => player.bidding);
  let next: GameState;
  if (stillBidding.length === 0) {
    // Everyone passed without a bid - the forehand is forced at the minimum.
    const forehand = (state.dealerIndex + 1) % players.length;
    next = enterExchange({ ...base, highestBid: MIN_BID }, forehand);
  } else if (stillBidding.length === 1 && stillBidding[0].bid !== null) {
    // Only the highest bidder is left - they win the auction.
    next = enterExchange(
      base,
      players.findIndex((player) => player.bidding),
    );
  } else {
    // The auction goes on - this also gives a lone survivor who has not bid yet
    // (usually the human, who never passes on their own) a turn to bid or pass.
    next = { ...base, currentPlayerIndex: nextBiddingIndex(players, index) };
  }
  return next;
}

/** Hands the Dabb to the winning bidder and opens the exchange phase. */
function enterExchange(state: GameState, winner: number): GameState {
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

/**
 * Base hand size for the current table and deck.
 *
 * @param state - the game state
 * @returns cards per player once the declarer has discarded
 */
export function baseHandSize(state: GameState): number {
  return dealSizes(state.players.length, state.withSevens, state.withDabb)
    .handSize;
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
 * The declarer commits to a normal game or a Durch and trick play begins.
 *
 * @param state - a state in the melding phase
 * @param gameType - "normal" or "durch"
 * @returns the state in the trick phase, the declarer to lead
 * @throws if it is not the melding phase
 */
export function declareGame(state: GameState, gameType: GameType): GameState {
  const index = state.declarerIndex;
  if (state.phase !== "melding" || index === null) {
    throw new Error("not ready to declare the game");
  }
  return {
    ...state,
    gameType,
    phase: "trick",
    leaderIndex: index,
    currentPlayerIndex: index,
    currentTrick: [],
  };
}

/**
 * The declarer concedes at melding rather than playing - they go off.
 *
 * @param state - a state in the melding phase
 * @returns the scored state, in the roundEnd or matchEnd phase
 * @throws if it is not the melding phase
 * @remarks
 * Going off costs the declarer double the bid; nobody else scores. See the
 * "geht ab" ruling in `docs/games/binokel/game-rules.md`.
 */
export function concede(state: GameState): GameState {
  if (state.phase !== "melding" || state.declarerIndex === null) {
    throw new Error("nothing to concede here");
  }
  return finishRound({ ...state, conceded: true });
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
  if (
    state.phase !== "trick" ||
    state.currentTrick.length >= state.players.length
  ) {
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

  // A full trick stays on the table until collectTrick is called, so the last
  // card can be seen before the trick is gathered up.
  return trick.length < state.players.length
    ? {
        ...state,
        players,
        currentTrick: trick,
        currentPlayerIndex: (index + 1) % state.players.length,
      }
    : { ...state, players, currentTrick: trick };
}

/**
 * Gathers a full trick to its winner and scores the round if it was the last.
 *
 * @param state - a trick state with a full trick on the table
 * @returns the state in the next trick, or in scoring if the hands are empty
 * @throws if there is no full trick to collect
 * @remarks
 * Split from {@link playCard} so the completed trick can be shown before it is
 * gathered; the UI (or the AI) calls this when the players have seen it.
 */
export function collectTrick(state: GameState): GameState {
  if (
    state.phase !== "trick" ||
    state.currentTrick.length < state.players.length
  ) {
    throw new Error("no full trick to collect");
  }
  const trick = state.currentTrick;
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
  const { handSize, dabbSize } = dealSizes(
    state.players.length,
    state.withSevens,
    state.withDabb,
  );
  const shuffled = shuffle(createDeck(state.withSevens), state.random);
  const cards = [...shuffled.items];
  const dealerIndex = (state.dealerIndex + 1) % state.players.length;

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
  const forehand = (dealerIndex + 1) % state.players.length;

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
    gameType: null,
    conceded: false,
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
    index = (index + 1) % players.length;
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
