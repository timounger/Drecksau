/**
 * The pause screen's inventory page: where its slots sit on the picture,
 * moving the cursor with the stick or the mouse, putting tools on A and B,
 * saving, and flipping over to the map.
 *
 * @module
 * @remarks
 * The layout lives here rather than with the drawing because the mouse needs
 * it too: a click is matched against the same rectangles the page is drawn
 * in, so the two can never drift apart.
 */
import { BOTTLE_IDS, GRID_ITEMS, canEquip, equipOn, isBottle } from "./gear";
import type {
  EquipId,
  GameState,
  Input,
  ScreenPoint,
  StepReport,
} from "./types";

/** A rectangle on the 240 x 160 picture. */
export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/** Columns of the tool grid. */
export const GRID_COLUMNS = 4;

/** The first bottle's slot number, right after the twelve tools. */
export const FIRST_BOTTLE = GRID_ITEMS.length;

/** The slot number of the save button, after the bottles. */
export const SAVE_SLOT = FIRST_BOTTLE + BOTTLE_IDS.length;

/** How many slots the cursor can visit. */
const SLOT_COUNT = SAVE_SLOT + 1;

/** Rows the cursor moves through: three of tools, one of bottles and save. */
const CURSOR_ROWS = GRID_ITEMS.length / GRID_COLUMNS + 1;

/** Seconds the "saved" note stays in the name bar. */
const SAVED_NOTE = 2;

/** A stick pushed this far counts as a direction press in the menu. */
const STICK_PRESS = 0.5;

/** Where the parts of the inventory page sit, in screen pixels. */
export const INVENTORY = {
  /** The tool grid: first tile, tile size and the step between tiles. */
  gridX: 31,
  gridY: 27,
  cellW: 40,
  cellH: 22,
  stepX: 46,
  stepY: 25,
  /** The bottle row under the grid. */
  bottleX: 31,
  bottleY: 103,
  bottleW: 22,
  bottleH: 20,
  bottleStep: 24,
  /** The save button at the end of the bottle row. */
  save: { x: 133, y: 103, w: 76, h: 20 },
  /** The frame round grid and bottles. */
  frame: { x: 22, y: 22, w: 196, h: 105 },
  /** The close button in the top left corner, on both pages. */
  close: { x: 2, y: 4, w: 15, h: 15 },
  /** The title plate beside it. */
  title: { x: 20, y: 4, w: 76, h: 15 },
  /** The name bar at the bottom. */
  nameBar: { x: 6, y: 131, w: 228, h: 25 },
  /** The arrow tabs on both edges that flip to the other page. */
  leftTab: { x: 2, y: 62, w: 14, h: 26 },
  rightTab: { x: 224, y: 62, w: 14, h: 26 },
  /** The small A and B slots top right. */
  bSlot: { x: 186, y: 2, w: 22, h: 18 },
  aSlot: { x: 212, y: 2, w: 22, h: 18 },
} as const;

/**
 * Where a slot of the inventory page sits.
 *
 * @param slot - 0 to 11 the tools, then the four bottles, then save
 * @returns its rectangle on the picture
 */
export function slotRect(slot: number): Rect {
  let rect: Rect;
  if (slot < FIRST_BOTTLE) {
    rect = {
      x: INVENTORY.gridX + (slot % GRID_COLUMNS) * INVENTORY.stepX,
      y: INVENTORY.gridY + Math.floor(slot / GRID_COLUMNS) * INVENTORY.stepY,
      w: INVENTORY.cellW,
      h: INVENTORY.cellH,
    };
  } else if (slot < SAVE_SLOT) {
    rect = {
      x: INVENTORY.bottleX + (slot - FIRST_BOTTLE) * INVENTORY.bottleStep,
      y: INVENTORY.bottleY,
      w: INVENTORY.bottleW,
      h: INVENTORY.bottleH,
    };
  } else {
    rect = INVENTORY.save;
  }
  return rect;
}

/**
 * What sits in a slot of the inventory page.
 *
 * @param slot - the slot number
 * @returns the tool or bottle, or null for the save button
 */
export function slotEquip(slot: number): EquipId | null {
  let equip: EquipId | null = null;
  if (slot < FIRST_BOTTLE) {
    equip = GRID_ITEMS[slot];
  } else if (slot < SAVE_SLOT) {
    equip = BOTTLE_IDS[slot - FIRST_BOTTLE];
  }
  return equip;
}

/**
 * Which slot a point on the picture lies in.
 *
 * @param point - screen pixels
 * @returns the slot number, or null between the slots
 */
export function slotAt(point: ScreenPoint): number | null {
  let found: number | null = null;
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    if (inside(point, slotRect(slot))) {
      found = slot;
    }
  }
  return found;
}

/**
 * Opens the pause screen on the inventory, the cursor on the A tool.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function openMenu(state: GameState, report: StepReport): void {
  state.menu = { cursor: slotOf(state.inv.aItem), page: "items", saved: 0 };
  state.player.charge = 0;
  state.player.shieldUp = false;
  report.events.push("menu");
}

/**
 * One step of the open pause screen: the cursor, the buttons, the mouse.
 *
 * @param state - the game
 * @param input - this step's buttons and mouse
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepMenu(
  state: GameState,
  input: Input,
  report: StepReport,
  dt: number,
): void {
  const menu = state.menu;
  const prev = state.prev;
  const pressed = {
    a: input.a && !prev.a,
    b: input.b && !prev.b,
    r: input.r && !prev.r,
    start: input.start && !prev.start,
  };
  if (menu !== null) {
    menu.saved = Math.max(0, menu.saved - dt);
    const click = input.click;
    const tab =
      click !== null &&
      (inside(click, INVENTORY.leftTab) || inside(click, INVENTORY.rightTab));
    if (click !== null && inside(click, INVENTORY.close)) {
      state.menu = null;
      report.events.push("menu");
    } else if (pressed.r || tab) {
      menu.page = menu.page === "items" ? "map" : "items";
      report.events.push("text");
    } else if (pressed.start) {
      state.menu = null;
      report.events.push("menu");
    } else if (menu.page === "items") {
      hoverCursor(state, input, report);
      moveCursor(state, input, report);
      if (click !== null) {
        clickSlot(state, click.button, slotAt(click), report);
      } else if (pressed.a || pressed.b) {
        choose(state, pressed.a ? "a" : "b", menu.cursor, report);
      }
    }
  }
}

/** The slot a tool or bottle sits in. */
function slotOf(equip: EquipId): number {
  return isBottle(equip)
    ? FIRST_BOTTLE + BOTTLE_IDS.indexOf(equip)
    : GRID_ITEMS.indexOf(equip);
}

/** The mouse moving over a slot puts the cursor there. */
function hoverCursor(state: GameState, input: Input, report: StepReport): void {
  const menu = state.menu;
  const hover = input.hover;
  const before = state.prev.hover;
  const moved =
    hover !== null &&
    (before === null || before.x !== hover.x || before.y !== hover.y);
  const slot = moved ? slotAt(hover) : null;
  if (menu !== null && slot !== null && slot !== menu.cursor) {
    menu.cursor = slot;
    report.events.push("text");
  }
}

/** Arrow keys or the stick walk the cursor round the slots. */
function moveCursor(state: GameState, input: Input, report: StepReport): void {
  const menu = state.menu;
  const prev = state.prev;
  if (menu !== null) {
    const right = input.moveX > STICK_PRESS && prev.moveX <= STICK_PRESS;
    const left = input.moveX < -STICK_PRESS && prev.moveX >= -STICK_PRESS;
    const down = input.moveY > STICK_PRESS && prev.moveY <= STICK_PRESS;
    const up = input.moveY < -STICK_PRESS && prev.moveY >= -STICK_PRESS;
    let { row, col } = cellOf(menu.cursor);
    if (right) {
      col = (col + 1) % rowWidth(row);
    } else if (left) {
      col = (col + rowWidth(row) - 1) % rowWidth(row);
    } else if (down || up) {
      row = (row + (down ? 1 : CURSOR_ROWS - 1)) % CURSOR_ROWS;
      col = Math.min(col, rowWidth(row) - 1);
    }
    const cursor = slotFromCell(row, col);
    if (cursor !== menu.cursor) {
      menu.cursor = cursor;
      report.events.push("text");
    }
  }
}

/** Row and column of a slot in the cursor's walk. */
function cellOf(slot: number): { row: number; col: number } {
  return slot < FIRST_BOTTLE
    ? { row: Math.floor(slot / GRID_COLUMNS), col: slot % GRID_COLUMNS }
    : { row: CURSOR_ROWS - 1, col: slot - FIRST_BOTTLE };
}

/** How many slots a row of the cursor's walk has. */
function rowWidth(row: number): number {
  return row < CURSOR_ROWS - 1 ? GRID_COLUMNS : SLOT_COUNT - FIRST_BOTTLE;
}

/** The slot at a row and column of the cursor's walk. */
function slotFromCell(row: number, col: number): number {
  return row < CURSOR_ROWS - 1 ? row * GRID_COLUMNS + col : FIRST_BOTTLE + col;
}

/** A click on a slot: a tool goes on A (left) or B (right); save saves. */
function clickSlot(
  state: GameState,
  button: "a" | "b",
  slot: number | null,
  report: StepReport,
): void {
  const menu = state.menu;
  const equip = slot === null ? null : slotEquip(slot);
  const usable = equip !== null && canEquip(state, equip);
  if (menu !== null && slot !== null && (slot === SAVE_SLOT || usable)) {
    menu.cursor = slot;
    choose(state, button, slot, report);
  }
}

/** A or B on a slot: put its tool on that button - or save. */
function choose(
  state: GameState,
  button: "a" | "b",
  slot: number,
  report: StepReport,
): void {
  const menu = state.menu;
  const equip = slotEquip(slot);
  if (menu !== null && equip === null) {
    menu.saved = SAVED_NOTE;
    report.events.push("save");
  } else if (equip !== null && equipOn(state, button, equip)) {
    report.events.push("item");
  }
}

/** Whether a point lies in a rectangle. */
function inside(point: ScreenPoint, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x < rect.x + rect.w &&
    point.y < rect.y + rect.h
  );
}
