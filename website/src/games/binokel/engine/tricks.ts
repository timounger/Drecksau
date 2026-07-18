/**
 * Trick play: which card wins, which cards are legal, how many Augen a trick is.
 *
 * @module
 * @remarks
 * Pure functions over a trick (the cards played so far) and the trump suit, so
 * they test without any surrounding game state. The obligations follow the
 * rules doc: follow suit, head the trick if you can, otherwise trump, and
 * overtrump if a trump is already down.
 */
import { cardStrength, cardValue, type Card, type Suit } from "./cards";
import type { TrickCard } from "./state";

/**
 * Tells whether one card beats another, given the trump.
 *
 * @param candidate - the card that might win
 * @param best - the card currently winning
 * @param trump - the trump suit, or null before it is set
 * @returns true if the candidate would take the lead from best
 * @remarks
 * On a tie between two identical cards the one already down keeps the trick, so
 * a tie returns false.
 */
export function beats(
  candidate: Card,
  best: Card,
  trump: Suit | null,
): boolean {
  const candidateTrump = candidate.suit === trump;
  const bestTrump = best.suit === trump;
  let result: boolean;

  if (candidateTrump && !bestTrump) {
    result = true;
  } else if (!candidateTrump && bestTrump) {
    result = false;
  } else if (candidate.suit === best.suit) {
    // Same suit (both trump, or both the led suit): higher strength wins.
    result = cardStrength(candidate) > cardStrength(best);
  } else {
    // A different non-trump suit can never beat the current winner.
    result = false;
  }
  return result;
}

/**
 * Finds the winning card of a (possibly partial) trick.
 *
 * @param trick - the cards played so far, in order
 * @param trump - the trump suit, or null
 * @returns the winning trick card
 * @throws if the trick is empty
 */
export function trickWinner(
  trick: readonly TrickCard[],
  trump: Suit | null,
): TrickCard {
  if (trick.length === 0) {
    throw new Error("cannot find the winner of an empty trick");
  }
  let best = trick[0];
  for (const played of trick.slice(1)) {
    if (beats(played.card, best.card, trump)) {
      best = played;
    }
  }
  return best;
}

/**
 * The player index that wins a completed trick.
 *
 * @param trick - the trick
 * @param trump - the trump suit
 * @returns the winning player's index
 */
export function trickWinnerIndex(
  trick: readonly TrickCard[],
  trump: Suit | null,
): number {
  return trickWinner(trick, trump).playerIndex;
}

/**
 * Sum of Augen in a trick.
 *
 * @param trick - the trick
 * @returns the point total
 */
export function trickPoints(trick: readonly TrickCard[]): number {
  return trick.reduce((sum, played) => sum + cardValue(played.card), 0);
}

/**
 * The cards a player may legally play into the current trick.
 *
 * @param hand - the player's hand
 * @param trick - the cards already in the trick (empty when leading)
 * @param trump - the trump suit, or null
 * @returns the subset of the hand that is legal to play
 * @remarks
 * Leading, anything goes. Otherwise: follow the led suit and beat the trick if
 * you can; if you cannot follow, trump and overtrump if you can; if you can do
 * neither, any card.
 */
export function legalPlays(
  hand: readonly Card[],
  trick: readonly TrickCard[],
  trump: Suit | null,
): Card[] {
  let legal: Card[];

  if (trick.length === 0) {
    legal = [...hand];
  } else {
    const ledSuit = trick[0].card.suit;
    const ledCards = hand.filter((card) => card.suit === ledSuit);

    if (ledCards.length > 0) {
      legal = mustHead(ledCards, trick, trump);
    } else {
      const trumpCards =
        trump === null ? [] : hand.filter((card) => card.suit === trump);
      legal =
        trumpCards.length > 0 ? mustHead(trumpCards, trick, trump) : [...hand];
    }
  }
  return legal;
}

/**
 * Narrows a set of candidate cards to those that head the trick, if any do.
 *
 * @param candidates - cards of the required suit (led suit or trump)
 * @param trick - the current trick
 * @param trump - the trump suit
 * @returns the winning candidates, or all of them if none can win
 */
function mustHead(
  candidates: readonly Card[],
  trick: readonly TrickCard[],
  trump: Suit | null,
): Card[] {
  const best = trickWinner(trick, trump).card;
  const winning = candidates.filter((card) => beats(card, best, trump));
  return winning.length > 0 ? winning : [...candidates];
}
