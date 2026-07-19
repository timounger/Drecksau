/**
 * Whose turn it is to act, by phase.
 *
 * @module
 * @remarks
 * One source of truth for "who may act now", used by both the online referee
 * (which seat's move it accepts) and the board UI (whether the viewer may act).
 */
import type { GameState } from "./state";
import { trickWinnerIndex } from "./tricks";

/**
 * The player index that may act in the current phase, or null if none.
 *
 * @param game - the game state
 * @returns the acting player index
 * @remarks
 * Bidding and trick play follow the player on turn; a full trick waits to be
 * collected by its winner; the exchange (discard then trump) and melding belong
 * to the declarer; between rounds the forehand (left of the dealer) advances to
 * the next deal. At the match's end nobody acts.
 */
export function actingIndex(game: GameState): number | null {
  let index: number | null;
  switch (game.phase) {
    case "bidding":
      index = game.currentPlayerIndex;
      break;
    case "trick":
      index =
        game.currentTrick.length === game.players.length
          ? trickWinnerIndex(game.currentTrick, game.trump)
          : game.currentPlayerIndex;
      break;
    case "exchange":
    case "melding":
      index = game.declarerIndex;
      break;
    case "roundEnd":
      index = (game.dealerIndex + 1) % game.players.length;
      break;
    default:
      index = null; // matchEnd - nobody acts
  }
  return index;
}
