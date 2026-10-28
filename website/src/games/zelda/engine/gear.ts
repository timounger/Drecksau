/**
 * What Link carries on his two buttons: the tools he owns, his bottles,
 * putting a tool on A or B, and which button holds what.
 *
 * @module
 */
import type { BottleId, EquipId, GameState, Input, ItemId } from "./types";

/** The tools of the inventory grid, row by row: four across, three down. */
export const GRID_ITEMS: readonly ItemId[] = [
  "sword",
  "shield",
  "bow",
  "bombs",
  "boomerang",
  "lantern",
  "fireRod",
  "hookshot",
  "shovel",
  "feather",
  "boots",
  "gloves",
];

/** The four bottle slots, in order. */
export const BOTTLE_IDS: readonly BottleId[] = [
  "bottle0",
  "bottle1",
  "bottle2",
  "bottle3",
];

/** Most bottles Link can carry. */
export const MAX_BOTTLES = BOTTLE_IDS.length;

/** The tools a new adventure starts with. */
export const START_KIT: readonly ItemId[] = [
  "sword",
  "shield",
  "bow",
  "bombs",
  "boomerang",
];

/** Tools that work by themselves and never sit on a button. */
const PASSIVE: ReadonlySet<ItemId> = new Set<ItemId>(["gloves"]);

/** Every tool and bottle, for checking a save. */
export const EQUIP_IDS: readonly EquipId[] = [...GRID_ITEMS, ...BOTTLE_IDS];

/**
 * Whether something is one of the bottle slots.
 *
 * @param equip - a tool or bottle
 * @returns true for a bottle
 */
export function isBottle(equip: EquipId): equip is BottleId {
  return (BOTTLE_IDS as readonly EquipId[]).includes(equip);
}

/**
 * The number of a bottle slot.
 *
 * @param id - the bottle
 * @returns 0 to 3
 */
export function bottleIndex(id: BottleId): number {
  return BOTTLE_IDS.indexOf(id);
}

/**
 * Whether Link has a tool - or has found the bottle of that slot.
 *
 * @param state - the game
 * @param equip - a tool or bottle
 * @returns true when it is his
 */
export function owns(state: GameState, equip: EquipId): boolean {
  return isBottle(equip)
    ? bottleIndex(equip) < state.inv.bottles.length
    : state.inv.owned.has(equip);
}

/**
 * Whether something can be put on a button: owned and not passive.
 *
 * @param state - the game
 * @param equip - a tool or bottle
 * @returns true when it may go on A or B
 */
export function canEquip(state: GameState, equip: EquipId): boolean {
  return owns(state, equip) && (isBottle(equip) || !PASSIVE.has(equip));
}

/**
 * Puts a tool or bottle on a button. If it sat on the other button, the two
 * buttons swap.
 *
 * @param state - the game
 * @param button - "a" or "b"
 * @param equip - what to put there
 * @returns true when it went on the button
 */
export function equipOn(
  state: GameState,
  button: "a" | "b",
  equip: EquipId,
): boolean {
  const inv = state.inv;
  const allowed = canEquip(state, equip);
  if (allowed) {
    const before = button === "a" ? inv.aItem : inv.bItem;
    if (button === "a") {
      if (inv.bItem === equip) {
        inv.bItem = before;
      }
      inv.aItem = equip;
    } else {
      if (inv.aItem === equip) {
        inv.aItem = before;
      }
      inv.bItem = equip;
    }
  }
  return allowed;
}

/**
 * Which button a tool or bottle sits on.
 *
 * @param state - the game
 * @param equip - a tool or bottle
 * @returns "a", "b", or null when it is on neither
 */
export function buttonOf(state: GameState, equip: EquipId): "a" | "b" | null {
  let button: "a" | "b" | null = null;
  if (state.inv.aItem === equip) {
    button = "a";
  } else if (state.inv.bItem === equip) {
    button = "b";
  }
  return button;
}

/**
 * Whether the button carrying a tool is held this step.
 *
 * @param state - the game
 * @param input - this step's buttons
 * @param equip - a tool or bottle
 * @returns true while its button is down
 */
export function isHeld(
  state: GameState,
  input: Input,
  equip: EquipId,
): boolean {
  const button = buttonOf(state, equip);
  return (button === "a" && input.a) || (button === "b" && input.b);
}
