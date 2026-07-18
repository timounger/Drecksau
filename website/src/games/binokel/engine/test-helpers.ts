/**
 * Small builders for hand-crafted Binokel test states.
 *
 * @module
 */
import type { Card, Rank, Suit } from "./cards";
import type { TrickCard } from "./state";

/**
 * Builds one card.
 *
 * @param suit - the suit
 * @param rank - the rank
 * @param copy - which of the two copies (0 or 1)
 * @returns the card
 */
export function card(suit: Suit, rank: Rank, copy = 0): Card {
  return { id: `${suit}-${rank}-${copy}`, suit, rank };
}

/**
 * Builds a trick entry.
 *
 * @param playerIndex - who played the card
 * @param played - the card
 * @returns the trick card
 */
export function trickCard(playerIndex: number, played: Card): TrickCard {
  return { playerIndex, card: played };
}
