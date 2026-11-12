/**
 * The message log: what happened, newest last.
 *
 * @module
 */
import type { Game, Message } from "./types";

/** Lines kept. */
const KEPT = 30;

/**
 * Adds a line to the log.
 *
 * @param game - the game, changed
 * @param text - the line
 * @param tone - how it is coloured
 */
export function pushMessage(
  game: Game,
  text: string,
  tone: Message["tone"] = "info",
): void {
  game.messages.push({ text, tone, at: game.time });
  if (game.messages.length > KEPT) {
    game.messages.splice(0, game.messages.length - KEPT);
  }
}
