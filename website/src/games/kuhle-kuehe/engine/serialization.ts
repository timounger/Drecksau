/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A game where somebody holds thirty cards is
 * not this module's problem: the referee never produced it, and no move will
 * make it worse.
 */
import { BREEDS, PARTS, type Card } from "./cards";
import type { Cow, KuhleKueheGame, Player } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = [
  "draw",
  "trade",
  "play",
  "defend",
  "gameOver",
];

/**
 * Checks an unknown value really is a game of Kuhle Kühe.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isKuhleKueheGame(value: unknown): value is KuhleKueheGame {
  const game = value as KuhleKueheGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isSeat(game.active, game.players.length) &&
    isCards(game.draw) &&
    isCards(game.discard) &&
    isAwards(game.awards, game.players.length) &&
    isPending(game.pending, game.players.length) &&
    (game.emptiedBy === null || isSeat(game.emptiedBy, game.players.length)) &&
    (game.crossing === null || Number.isInteger(game.crossing)) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isCards(player.hand) &&
    Array.isArray(player.herd) &&
    player.herd.every(isCow) &&
    isCards(player.calves) &&
    (player.trade === null ||
      (Array.isArray(player.trade) &&
        player.trade.every((id) => typeof id === "string")))
  );
}

/** Whether this is a cow lying in a herd. */
function isCow(value: unknown): value is Cow {
  const cow = value as Cow;
  return (
    isObject(value) &&
    typeof cow.id === "string" &&
    isCard(cow.head) &&
    isCards(cow.middles) &&
    isCard(cow.rear) &&
    (cow.guard === null || isCard(cow.guard))
  );
}

/** Whether this is a list of cards. */
function isCards(value: unknown): value is readonly Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Whether this is a card. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  let ok = false;
  if (isObject(value) && typeof card.id === "string") {
    if (card.kind === "cow") {
      ok =
        PARTS.includes(card.part) &&
        (card.breed === null || BREEDS.includes(card.breed));
    } else if (card.kind === "action") {
      ok = typeof card.action === "string";
    } else {
      ok = card.kind === "calf" || card.kind === "hidden";
    }
  }
  return ok;
}

/** Whether the ribbons name real seats or nobody. */
function isAwards(value: unknown, seats: number): boolean {
  const awards = value as KuhleKueheGame["awards"];
  const holder = (who: number | null) => who === null || isSeat(who, seats);
  return (
    isObject(value) &&
    holder(awards.firstCow) &&
    holder(awards.biggestHerd) &&
    holder(awards.longestCow)
  );
}

/** Whether a waiting attack makes sense. */
function isPending(value: unknown, seats: number): boolean {
  const pending = value as NonNullable<KuhleKueheGame["pending"]>;
  return (
    value === null ||
    (isObject(value) &&
      isSeat(pending.by, seats) &&
      isSeat(pending.target, seats) &&
      isCard(pending.card) &&
      (pending.cowId === null || typeof pending.cowId === "string"))
  );
}

/** Whether this is a seat number at this table. */
function isSeat(value: unknown, seats: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
