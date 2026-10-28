/**
 * The villagers: where they stand, what they say as the story moves on, and
 * the little shop with its wares on the counter.
 *
 * @module
 */
import { TILE, tileCentre } from "./tiles";
import type { AreaId, GameState } from "./types";
import { NPC_TEXTS } from "@/games/zelda/i18n/texts";

/** Who lives in the village. */
export type NpcId = "elder" | "shopkeeper" | "guard" | "kid" | "farmer";

/** One villager in the world. */
export type Npc = {
  readonly id: NpcId;
  readonly area: AreaId;
  readonly x: number;
  readonly y: number;
};

/** What the shop sells. */
export type WareId =
  "heart" | "arrows" | "bombs" | "bottle" | "potion" | "piece";

/** One ware lying on the counter. */
export type Ware = {
  readonly id: WareId;
  readonly price: number;
  readonly tx: number;
  readonly ty: number;
};

/** Half width of a villager's body. */
export const NPC_HW = 6;

/** Half height of a villager's body. */
export const NPC_HH = 4;

/** The elder has told Link about the stolen sun stone. */
export const STORY_ELDER = "story:elder";

/** The sun stone is back in the village. */
export const STORY_DONE = "story:done";

/** The sun stone has been won from the temple. */
export const SUNSTONE_FLAG = "item:sunstone";

/** The shop's heart piece has been bought. */
export const SHOP_PIECE_FLAG = "piece:shop";

/** The shop's bottle has been bought. */
export const SHOP_BOTTLE_FLAG = "bottle:shop";

/** How far the guard steps aside once the elder has spoken, in tiles. */
const GUARD_STEP = 2;

/* eslint-disable @typescript-eslint/no-magic-numbers -- where the villagers
   stand and the wares lie, in tiles, and the prices in rupees */
/** Everyone, at home. */
const NPCS: readonly Npc[] = [
  { id: "elder", area: "houses", ...tileCentre(9, 5) },
  { id: "shopkeeper", area: "houses", ...tileCentre(22, 3) },
  { id: "guard", area: "overworld", ...tileCentre(40.5, 15) },
  { id: "kid", area: "overworld", ...tileCentre(24, 24) },
  { id: "farmer", area: "overworld", ...tileCentre(37, 32) },
];

/** The wares on the shop counter. */
export const WARES: readonly Ware[] = [
  { id: "heart", price: 10, tx: 19, ty: 4 },
  { id: "arrows", price: 20, tx: 20, ty: 4 },
  { id: "bombs", price: 25, tx: 21, ty: 4 },
  { id: "bottle", price: 30, tx: 23, ty: 4 },
  { id: "potion", price: 20, tx: 24, ty: 4 },
  { id: "piece", price: 80, tx: 25, ty: 4 },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The villagers in Link's area, where they stand right now.
 *
 * @param state - the game
 * @returns the villagers present
 */
export function npcsHere(state: GameState): readonly Npc[] {
  return NPCS.filter((npc) => npc.area === state.area).map((npc) =>
    npc.id === "guard" && state.flags.has(STORY_ELDER)
      ? { ...npc, x: npc.x + GUARD_STEP * TILE }
      : npc,
  );
}

/**
 * The wares still for sale.
 *
 * @param state - the game
 * @returns the wares on the counter
 */
export function waresHere(state: GameState): readonly Ware[] {
  return state.area === "houses"
    ? WARES.filter(
        (ware) =>
          (ware.id !== "piece" || !state.flags.has(SHOP_PIECE_FLAG)) &&
          (ware.id !== "bottle" || !state.flags.has(SHOP_BOTTLE_FLAG)),
      )
    : [];
}

/**
 * What a villager says now - and what hearing it changes.
 *
 * @param state - the game; story flags may be set
 * @param id - who is spoken to
 * @returns the text, pages split by "|"
 */
export function talkTo(state: GameState, id: NpcId): string {
  const flags = state.flags;
  const back = flags.has(SUNSTONE_FLAG);
  let text: string;
  switch (id) {
    case "elder":
      if (back && !flags.has(STORY_DONE)) {
        text = NPC_TEXTS.elderReturn;
        flags.add(STORY_DONE);
      } else if (back) {
        text = NPC_TEXTS.elderDone;
      } else if (flags.has(STORY_ELDER)) {
        text = NPC_TEXTS.elderAgain;
      } else {
        text = NPC_TEXTS.elderQuest;
        flags.add(STORY_ELDER);
      }
      break;
    case "shopkeeper":
      text = NPC_TEXTS.shopkeeper;
      break;
    case "guard":
      text = back
        ? NPC_TEXTS.guardAfter
        : flags.has(STORY_ELDER)
          ? NPC_TEXTS.guardOpen
          : NPC_TEXTS.guardClosed;
      break;
    case "kid":
      text = NPC_TEXTS.kid;
      break;
    default:
      text = back ? NPC_TEXTS.farmerAfter : NPC_TEXTS.farmer;
  }
  return text;
}
