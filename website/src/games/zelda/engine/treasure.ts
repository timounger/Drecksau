/**
 * Finds and purchases: what lies in each chest, what a key, a map or a piece
 * of heart does once held up, and the shop's counter.
 *
 * @module
 */
import { tileFlag } from "./clearing";
import { holdUp, openDialog } from "./dialog";
import { MAX_BOTTLES } from "./gear";
import {
  SHOP_BOTTLE_FLAG,
  SHOP_PIECE_FLAG,
  SUNSTONE_FLAG,
  type Ware,
} from "./npcs";
import { TILE_CHARS, findTiles } from "./tiles";
import type { AreaId, GameState, ItemId, StepReport, Treasure } from "./types";
import {
  HALVES_PER_HEART,
  MAX_ARROWS,
  MAX_BOMBS,
  MAX_RUPEES,
  PIECES_PER_HEART,
} from "./world";
import { MESSAGES, TREASURE_TEXTS } from "@/games/zelda/i18n/texts";

/** Flag of an owned item, by treasure. */
export const ITEM_FLAG = {
  bigKey: "item:bigKey",
  map: "item:map",
  compass: "item:compass",
  gloves: "item:gloves",
} as const;

/** The finds that are tools for the inventory grid. */
const TOOL_FINDS: Readonly<Partial<Record<Treasure, ItemId>>> = {
  gloves: "gloves",
  lantern: "lantern",
  boots: "boots",
  fireRod: "fireRod",
  hookshot: "hookshot",
  shovel: "shovel",
  feather: "feather",
};

/** Rupees in a rupee chest. */
const CHEST_RUPEES = 50;

/** Arrows in one purchase. */
const SHOP_ARROWS = 10;

/** Bombs in one purchase. */
const SHOP_BOMBS = 5;

/** Half hearts one bought heart heals. */
const SHOP_HEART = 2;

/**
 * What lies in each chest of an area, in reading order of the map.
 *
 * @remarks
 * The maps place the chests; this list says what is in them, in the order
 * they appear row by row - so a chest added to a map needs a line here.
 */
const CHEST_CONTENTS: Readonly<Record<AreaId, readonly Treasure[]>> = {
  dungeon: ["key", "gloves", "bigKey", "map", "compass", "lantern", "key"],
  overworld: [
    "bottle",
    "fireRod",
    "hookshot",
    "boots",
    "shovel",
    "bottle",
    "piece",
  ],
  mini: ["piece", "feather"],
  houses: [],
};

/** The treasures that get the long jingle. */
const BIG_FINDS: ReadonlySet<Treasure> = new Set<Treasure>([
  "bigKey",
  "gloves",
  "container",
  "sunstone",
  "map",
  "compass",
  "lantern",
  "boots",
  "fireRod",
  "hookshot",
  "shovel",
  "feather",
  "bottle",
]);

/**
 * What a chest holds.
 *
 * @param area - which map
 * @param tx - tile column of the chest
 * @param ty - tile row of the chest
 * @returns the treasure
 */
export function chestContent(area: AreaId, tx: number, ty: number): Treasure {
  const index = findTiles(area, TILE_CHARS.chest).findIndex(
    (tile) => tile.tx === tx && tile.ty === ty,
  );
  return CHEST_CONTENTS[area][index] ?? "rupees";
}

/**
 * Opens a chest and lets Link hold up what was inside.
 *
 * @param state - the game
 * @param tx - tile column of the chest
 * @param ty - tile row of the chest
 * @param report - where to note what happened
 */
export function openChest(
  state: GameState,
  tx: number,
  ty: number,
  report: StepReport,
): void {
  state.flags.add(tileFlag("chest", state.area, tx, ty));
  report.events.push("chest");
  give(state, chestContent(state.area, tx, ty), report);
}

/**
 * Gives Link a treasure: into the bag, held up, explained.
 *
 * @param state - the game
 * @param item - what he gets
 * @param report - where to note what happened
 */
export function give(
  state: GameState,
  item: Treasure,
  report: StepReport,
): void {
  const player = state.player;
  let text: string = TREASURE_TEXTS[item];
  switch (item) {
    case "key":
      state.inv.keys += 1;
      break;
    case "piece":
      state.inv.heartPieces += 1;
      if (state.inv.heartPieces >= PIECES_PER_HEART) {
        state.inv.heartPieces = 0;
        player.maxHearts += 1;
        player.hp = player.maxHearts * HALVES_PER_HEART;
        text = MESSAGES.pieceFull;
      } else {
        text = `${text} ${MESSAGES.pieceCount[state.inv.heartPieces]}`;
      }
      break;
    case "container":
      player.maxHearts += 1;
      player.hp = player.maxHearts * HALVES_PER_HEART;
      break;
    case "rupees":
      state.inv.rupees = Math.min(MAX_RUPEES, state.inv.rupees + CHEST_RUPEES);
      report.rupees += CHEST_RUPEES;
      break;
    case "sunstone":
      state.flags.add(SUNSTONE_FLAG);
      break;
    case "bottle":
      if (state.inv.bottles.length < MAX_BOTTLES) {
        state.inv.bottles.push("empty");
      }
      break;
    case "bigKey":
    case "map":
    case "compass":
      state.flags.add(ITEM_FLAG[item]);
      break;
    default:
      ownTool(state, item);
  }
  holdUp(state, item, text, report, BIG_FINDS.has(item));
}

/** Puts a found tool into the inventory grid. */
function ownTool(state: GameState, item: Treasure): void {
  const tool = TOOL_FINDS[item];
  if (tool !== undefined) {
    state.inv.owned.add(tool);
  }
  if (item === "gloves") {
    state.flags.add(ITEM_FLAG.gloves);
  }
}

/**
 * Buys a ware from the counter, if the purse allows.
 *
 * @param state - the game
 * @param ware - what Link points at
 * @param report - where to note what happened
 */
export function buy(state: GameState, ware: Ware, report: StepReport): void {
  const inv = state.inv;
  const player = state.player;
  const empty = inv.bottles.indexOf("empty");
  const full =
    (ware.id === "arrows" && inv.arrows >= MAX_ARROWS) ||
    (ware.id === "bombs" && inv.bombs >= MAX_BOMBS) ||
    (ware.id === "heart" && player.hp >= player.maxHearts * HALVES_PER_HEART) ||
    (ware.id === "bottle" && inv.bottles.length >= MAX_BOTTLES) ||
    (ware.id === "potion" && inv.bottles.length > 0 && empty < 0);
  if (full) {
    openDialog(state, MESSAGES.shopFull);
    report.events.push("error");
  } else if (ware.id === "potion" && inv.bottles.length === 0) {
    openDialog(state, MESSAGES.shopNoBottle);
    report.events.push("error");
  } else if (inv.rupees < ware.price) {
    openDialog(state, MESSAGES.shopPoor);
    report.events.push("error");
  } else {
    inv.rupees -= ware.price;
    report.events.push("buy");
    switch (ware.id) {
      case "heart":
        player.hp = Math.min(
          player.maxHearts * HALVES_PER_HEART,
          player.hp + SHOP_HEART,
        );
        openDialog(state, MESSAGES.boughtHeart);
        break;
      case "arrows":
        inv.arrows = Math.min(MAX_ARROWS, inv.arrows + SHOP_ARROWS);
        openDialog(state, MESSAGES.boughtArrows);
        break;
      case "bombs":
        inv.bombs = Math.min(MAX_BOMBS, inv.bombs + SHOP_BOMBS);
        openDialog(state, MESSAGES.boughtBombs);
        break;
      case "potion":
        inv.bottles[empty] = "potion";
        openDialog(state, MESSAGES.boughtPotion);
        break;
      case "bottle":
        state.flags.add(SHOP_BOTTLE_FLAG);
        give(state, "bottle", report);
        break;
      default:
        state.flags.add(SHOP_PIECE_FLAG);
        give(state, "piece", report);
    }
  }
}
