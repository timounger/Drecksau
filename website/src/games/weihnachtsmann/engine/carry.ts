/**
 * Carrying things about: a carrot for the reindeer, a letter to sort, dough
 * and baking trays, and the lost present from the gift store.
 *
 * @module
 * @remarks
 * Everybody can carry one thing at a time ({@link Character.carry}); it is
 * drawn over the head. Going through a door leaves it behind - only the lost
 * present and the felled fir go along (they have to reach the workshop), and
 * an errand's lost thing or treat. Nothing carried is saved.
 */
import { TOWN_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { poof, say } from "./effects";
import type { Character, CarryKind, GameState } from "./types";

/**
 * What goes along through a door: the lost present and the felled fir have
 * to reach the workshop, and an errand's lost thing or treat its owner.
 */
const THROUGH_DOORS: ReadonlySet<CarryKind> = new Set<CarryKind>([
  "present",
  "fir",
  "found",
  "treat",
]);

/** How far above the feet the poof of a thing left behind sits, map px. */
const POOF_LIFT = 20;

/**
 * Hands somebody a thing, if the hands are free.
 *
 * @param char - who takes it
 * @param kind - what
 * @param tint - for a letter, its continent
 * @returns true when taken; otherwise the character says the hands are full
 */
export function pickUp(char: Character, kind: CarryKind, tint = 0): boolean {
  const free = char.carry === null;
  if (free) {
    char.carry = { kind, tint };
  } else {
    say(char, TOWN_TEXTS.handsFull);
  }
  return free;
}

/**
 * Whether somebody carries a certain thing.
 *
 * @param char - the character
 * @param kind - what
 * @returns true when that is in the hands
 */
export function carries(char: Character, kind: CarryKind): boolean {
  return char.carry?.kind === kind;
}

/**
 * What somebody carries is left behind on the way through a door - all but
 * the lost present.
 *
 * @param state - the game
 * @param char - who goes through
 */
export function leaveAtDoor(state: GameState, char: Character): void {
  if (char.carry !== null && !THROUGH_DOORS.has(char.carry.kind)) {
    char.carry = null;
    poof(state, char.area, char.x, char.y - POOF_LIFT);
  }
}
