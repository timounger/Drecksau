/**
 * Computer opponents: bidding, discarding, trump choice and card play.
 *
 * @module
 * @remarks
 * Deliberately simple heuristics - enough to play a correct, watchable game.
 * The AI never looks at other players' hands. Stronger play can come later.
 */
import { cardStrength, cardValue, SUITS, type Card, type Suit } from "./cards";
import { DEFAULT_DIFFICULTY, type Difficulty } from "./difficulty";
import { findMelds } from "./melds";
import { nextBidValue, type BidAction } from "./moves";
import { createRandom, nextRandom } from "./random";
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
 * How far the AI's hand estimate must clear the next bid before it raises.
 *
 * @remarks
 * A positive margin makes it timid (it lets the game go), a negative one bold
 * (it competes even on a slightly short hand). This is the main knob for how
 * hard the opponents fight over who plays.
 */
const BID_MARGIN: Readonly<Record<Difficulty, number>> = {
  leicht: 30,
  mittel: 0,
  schwer: -10,
};

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
 * @param difficulty - how boldly to bid; defaults to the middle level
 * @returns the bid action
 */
export function chooseBid(
  state: GameState,
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
): BidAction {
  const hand = state.players[state.currentPlayerIndex].hand;
  const estimate = estimateHand(hand, state.withSevens);
  const threshold = nextBidValue(state) + BID_MARGIN[difficulty];
  return estimate >= threshold ? { kind: "bid" } : { kind: "pass" };
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
 * @param difficulty - how well to play; defaults to the middle level
 * @returns the id of the card to play
 * @remarks
 * The legal set already forces a player to head the trick when they can, so the
 * cheapest legal card ("mittel") wins tricks cheaply when winning is required
 * and sheds a low card otherwise. "leicht" plays a random legal card, throwing
 * away winners; "schwer" additionally cashes its winners by leading its
 * strongest card to pull trumps and take points.
 */
export function chooseCard(
  state: GameState,
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
): string {
  const actor = state.players[state.currentPlayerIndex];
  const legal = legalPlays(actor.hand, state.currentTrick, state.trump);

  if (difficulty === "leicht") {
    return randomCard(state, legal).id;
  }
  if (difficulty === "schwer" && state.currentTrick.length === 0) {
    // On lead there is no card to beat, so cash the strongest one.
    return legal.reduce((best, card) =>
      beatsForLead(card, best) ? card : best,
    ).id;
  }
  return legal.reduce((best, card) => (cheaper(card, best) ? card : best)).id;
}

/** Whether the first card is the cheaper shed - lower value, then weaker. */
function cheaper(card: Card, best: Card): boolean {
  return (
    cardValue(card) < cardValue(best) ||
    (cardValue(card) === cardValue(best) &&
      cardStrength(card) < cardStrength(best))
  );
}

/** Whether the first card is the stronger lead - higher value, then stronger. */
function beatsForLead(card: Card, best: Card): boolean {
  return (
    cardValue(card) > cardValue(best) ||
    (cardValue(card) === cardValue(best) &&
      cardStrength(card) > cardStrength(best))
  );
}

/**
 * A legal card chosen at random - the easy level's weak play.
 *
 * @remarks
 * The generator is not advanced by playing a card, so the seed is mixed with
 * how many cards have already been played this round; that varies the pick from
 * trick to trick while staying deterministic for a given deal.
 */
function randomCard(state: GameState, legal: readonly Card[]): Card {
  const played =
    state.currentTrick.length +
    state.players.reduce((sum, player) => sum + player.won.length, 0);
  const draw = nextRandom(createRandom(state.random.seed + played));
  return legal[Math.floor(draw.value * legal.length)];
}
