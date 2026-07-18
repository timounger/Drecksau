/**
 * Computer opponents: bidding, discarding, trump choice and card play.
 *
 * @module
 * @remarks
 * Deliberately simple heuristics - enough to play a correct, watchable game.
 * The AI never looks at other players' hands. Stronger play can come later.
 */
import { cardStrength, cardValue, SUITS, type Card, type Suit } from "./cards";
import { findMelds } from "./melds";
import { nextBidValue, type BidAction } from "./moves";
import type { GameState } from "./state";
import { legalPlays } from "./tricks";

/** How much a Ten is worth to the bid estimate (less than its face value). */
const TEN_WEIGHT = 6;
/** How much each trump adds to the estimate. */
const TRUMP_WEIGHT = 4;
/** Rounding of the estimate. */
const ESTIMATE_STEP = 10;
/** Score bump so trumps are kept over anything else when discarding. */
const KEEP_TRUMP = 1000;
/** Weight of each card in a suit when picking the trump. */
const SUIT_LENGTH_WEIGHT = 100;
/** Points an Ace contributes to the bid estimate. */
const ACE_POINTS = 11;

/**
 * The suit that makes the best trump for a hand - most cards, then most points.
 *
 * @param hand - the hand
 * @returns the strongest suit
 */
export function bestTrump(hand: readonly Card[]): Suit {
  let best: Suit = SUITS[0];
  let bestScore = -1;
  for (const suit of SUITS) {
    const cards = hand.filter((card) => card.suit === suit);
    const score =
      cards.length * SUIT_LENGTH_WEIGHT +
      cards.reduce((s, c) => s + cardValue(c), 0);
    if (score > bestScore) {
      bestScore = score;
      best = suit;
    }
  }
  return best;
}

/**
 * Roughly what a hand is worth for bidding: melds plus likely trick points.
 *
 * @param hand - the hand
 * @param withSevens - whether the deck has Sevens
 * @returns an estimate, rounded down to a bid step
 */
export function estimateHand(
  hand: readonly Card[],
  withSevens: boolean,
): number {
  const trump = bestTrump(hand);
  const meld = findMelds(hand, trump, withSevens).total;
  const aces = hand.filter((card) => card.rank === "daus").length * ACE_POINTS;
  const tens = hand.filter((card) => card.rank === "zehn").length * TEN_WEIGHT;
  const trumps =
    hand.filter((card) => card.suit === trump).length * TRUMP_WEIGHT;
  const raw = meld + aces + tens + trumps;
  return Math.floor(raw / ESTIMATE_STEP) * ESTIMATE_STEP;
}

/**
 * Whether the current AI bidder raises or passes.
 *
 * @param state - a state in the bidding phase
 * @returns the bid action
 */
export function chooseBid(state: GameState): BidAction {
  const hand = state.players[state.currentPlayerIndex].hand;
  const estimate = estimateHand(hand, state.withSevens);
  return estimate >= nextBidValue(state) ? { kind: "bid" } : { kind: "pass" };
}

/**
 * The trump the AI declarer announces.
 *
 * @param state - a state where the AI is the declarer
 * @returns the chosen trump suit
 */
export function chooseTrumpSuit(state: GameState): Suit {
  const index = state.declarerIndex ?? state.currentPlayerIndex;
  return bestTrump(state.players[index].hand);
}

/**
 * The cards the AI declarer discards from an oversized hand.
 *
 * @param state - a state in the exchange phase where the AI is the declarer
 * @param need - how many cards to discard
 * @returns the ids of the cards to discard - the weakest low cards
 */
export function chooseDiscard(state: GameState, need: number): string[] {
  const declarer =
    state.players[state.declarerIndex ?? state.currentPlayerIndex];
  const trump = bestTrump(declarer.hand);
  const ranked = [...declarer.hand].sort(
    (a, b) => keepScore(a, trump) - keepScore(b, trump),
  );
  return ranked.slice(0, need).map((card) => card.id);
}

/** How much the AI wants to keep a card - trumps and high cards score high. */
function keepScore(card: Card, trump: Suit): number {
  return card.suit === trump ? KEEP_TRUMP + cardValue(card) : cardValue(card);
}

/**
 * The card the AI plays into the current trick.
 *
 * @param state - a state in the trick phase
 * @returns the id of the card to play
 * @remarks
 * Picks the cheapest legal card. Because the legal set already forces a player
 * to head the trick when they can, this wins tricks cheaply when winning is
 * required and throws a low card away otherwise.
 */
export function chooseCard(state: GameState): string {
  const actor = state.players[state.currentPlayerIndex];
  const legal = legalPlays(actor.hand, state.currentTrick, state.trump);
  const cheapest = legal.reduce((best, card) =>
    cardValue(card) < cardValue(best) ||
    (cardValue(card) === cardValue(best) &&
      cardStrength(card) < cardStrength(best))
      ? card
      : best,
  );
  return cheapest.id;
}
