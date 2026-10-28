/**
 * Everything drawn over the play field: hearts, the A / B / R buttons, the
 * rupee and key counters, the text box typing itself out, and the pause
 * screen with its two pages - the tools and the map.
 *
 * @module
 */
import {
  BOSS_FLAG,
  chestVisible,
  tileFlag,
} from "@/games/zelda/engine/clearing";
import { DIALOG_OPEN } from "@/games/zelda/engine/dialog";
import {
  bottleIndex,
  buttonOf,
  isBottle,
  owns,
} from "@/games/zelda/engine/gear";
import {
  FIRST_BOTTLE,
  INVENTORY,
  SAVE_SLOT,
  slotEquip,
  slotRect,
  type Rect,
} from "@/games/zelda/engine/menu";
import { interaction } from "@/games/zelda/engine/player";
import {
  AREAS,
  ROOM_COLS,
  ROOM_ROWS,
  TILE,
  TILE_CHARS,
  findTiles,
  roomAt,
} from "@/games/zelda/engine/tiles";
import { ITEM_FLAG } from "@/games/zelda/engine/treasure";
import type { EquipId, GameState, ItemId } from "@/games/zelda/engine/types";
import { HALVES_PER_HEART } from "@/games/zelda/engine/world";
import { SUNSTONE_FLAG } from "@/games/zelda/engine/npcs";
import {
  BOTTLE_HINTS,
  BOTTLE_NAMES,
  ITEM_HINTS,
  ITEM_NAMES,
  ZELDA_TEXTS,
} from "@/games/zelda/i18n/texts";
import {
  INK,
  cursor,
  drawNumber,
  panel,
  roundRect,
  text,
  wrap,
} from "./render-kit";
import type { SpriteName } from "./sprite-atlas";
import { drawSprite, spriteSize, type Art } from "./sprites";

/** Logical screen size. */
const SCREEN_W = 240;
const SCREEN_H = 160;

/** The sprite of each tool in the HUD and the inventory. */
const TOOL_ICON: Readonly<Record<ItemId, SpriteName>> = {
  sword: "iconSword",
  shield: "iconShield",
  bow: "bow",
  bombs: "bomb0",
  boomerang: "boomerang0",
  lantern: "lantern",
  boots: "boots",
  fireRod: "fireRod",
  hookshot: "hookshot",
  shovel: "shovel",
  feather: "feather",
  gloves: "gloves",
};

/** Colours of the inventory page. */
const PAGE = {
  backdrop: "#f2e2a2",
  dots: "#e2cc80",
  frame: "#3c5aa8",
  rim: "#f8f0d8",
  tile: "#e4ecf8",
  tileEdge: "#7c8cc0",
  emptyTile: "#5a76c0",
  emptyEdge: "#324c94",
  title: "#2f62d0",
  close: "#c83c3c",
  nameBar: "rgba(24, 28, 64, 0.95)",
} as const;

/** The R button's label for each thing it can do. */
const R_LABEL = {
  sign: ZELDA_TEXTS.read,
  npc: ZELDA_TEXTS.talk,
  chest: ZELDA_TEXTS.open,
  ware: ZELDA_TEXTS.buy,
  lift: ZELDA_TEXTS.lift,
  throw: ZELDA_TEXTS.throw,
} as const;

/** Rooms of the temple map, across and down. */
const TEMPLE_COLS = AREAS.dungeon.cols / ROOM_COLS;
const TEMPLE_ROWS = AREAS.dungeon.rowCount / ROOM_ROWS;

/** Where the boss waits, as a room number. */
const BOSS_ROOM = 1;

/** The temple's chests. */
const TEMPLE_CHESTS = findTiles("dungeon", TILE_CHARS.chest);

/** Rooms that exist in the temple (have floor). */
const TEMPLE_ROOMS = Array.from(
  { length: TEMPLE_COLS * TEMPLE_ROWS },
  (_, room) => room,
).filter((room) => {
  const tx = (room % TEMPLE_COLS) * ROOM_COLS + 1;
  const ty = Math.floor(room / TEMPLE_COLS) * ROOM_ROWS + 1;
  return AREAS.dungeon.rows[ty][tx] !== "0";
});

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here down: the
   map markers' places in tiles, and the layout of the HUD, the text box and
   the pause screen, in screen pixels. */

/** Where the overworld map's markers sit, by place. */
const PLACE_ON_MAP = {
  houses: [
    { x: 18.5 * TILE, y: 21 * TILE },
    { x: 32.5 * TILE, y: 28 * TILE },
  ],
  mini: { x: 26 * TILE, y: 43.5 * TILE },
  temple: { x: 41 * TILE, y: 14 * TILE },
} as const;

/** Where the HUD's parts sit. */
const HUD = {
  heartX: 6,
  heartY: 5,
  heartStep: 8,
  heartsPerRow: 10,
  slotY: 13,
  bSlotX: SCREEN_W - 52,
  aSlotX: SCREEN_W - 27,
  rTabX: SCREEN_W - 56,
  rTabY: 2,
  rTabW: 52,
  rTabH: 10,
  rupeeX: SCREEN_W - 38,
  rupeeY: SCREEN_H - 14,
  keyY: SCREEN_H - 26,
} as const;

/** The text box: low on the screen, three lines. */
const DIALOG = { x: 8, y: SCREEN_H - 52, w: SCREEN_W - 16, h: 46 } as const;

/** The map page's panel. */
const MENU = {
  x: 10,
  y: 8,
  w: SCREEN_W - 20,
  h: SCREEN_H - 16,
} as const;

/** The overworld map picture inside the panel. */
const MAP_VIEW = { x: 24, y: 26, w: 192, h: 106 } as const;

/** One room on the temple map. */
const ROOM_CELL = { w: 30, h: 20 } as const;

/**
 * Paints the HUD and whatever box or screen is open.
 *
 * @param ctx - the 240 x 160 buffer
 * @param state - the game
 * @param art - the pictures
 * @param clock - seconds, for blinking
 */
export function drawUi(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  drawHud(ctx, state, art, clock);
  if (state.banner !== null) {
    panel(ctx, 24, 40, SCREEN_W - 48, 18, "rgba(32, 24, 64, 0.88)");
  }
  const dialog = state.dialog;
  if (dialog !== null) {
    const open = Math.min(1, dialog.t / DIALOG_OPEN);
    const h = Math.max(6, Math.round(DIALOG.h * open));
    const y = DIALOG.y + Math.round((DIALOG.h - h) / 2);
    panel(ctx, DIALOG.x, y, DIALOG.w, h, "rgba(16, 16, 32, 0.94)", "#d8d8e8");
    const page = dialog.pages[dialog.page];
    const done = open >= 1 && dialog.shown >= page.length;
    if (done && Math.floor(clock * 3) % 2 === 0) {
      const ax = DIALOG.x + DIALOG.w - 12;
      const ay = DIALOG.y + DIALOG.h - 8;
      ctx.fillStyle = "#f8d040";
      ctx.fillRect(ax, ay, 5, 1);
      ctx.fillRect(ax + 1, ay + 1, 3, 1);
      ctx.fillRect(ax + 2, ay + 2, 1, 1);
    }
  }
  if (state.menu !== null) {
    drawMenu(ctx, state, art, clock);
  }
}

/**
 * Writes the HUD's, the text box's and the menu's words on the big canvas.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per logical pixel
 */
export function drawUiTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  ctx.save();
  ctx.textBaseline = "middle";
  if (state.menu === null) {
    text(
      ctx,
      rLabel(state),
      HUD.rTabX + 5,
      HUD.rTabY + HUD.rTabH / 2 + 0.5,
      scale,
      7,
      "left",
    );
  }
  if (state.banner !== null) {
    text(ctx, state.banner.text, SCREEN_W / 2, 49, scale, 7.5, "center");
  }
  const dialog = state.dialog;
  if (dialog !== null && dialog.t >= DIALOG_OPEN) {
    const page = dialog.pages[dialog.page];
    // Wrap the whole page, then show the typed part, so words never jump.
    const lines = wrap(ctx, page, DIALOG.w - 18, scale, 8);
    let left = Math.floor(dialog.shown);
    lines.slice(0, 3).forEach((line, i) => {
      const part = line.slice(0, Math.max(0, left));
      left -= line.length + 1;
      if (part !== "") {
        text(ctx, part, DIALOG.x + 9, DIALOG.y + 11 + i * 12, scale, 8, "left");
      }
    });
  }
  if (state.menu !== null) {
    if (state.menu.page === "items") {
      menuTexts(ctx, state, scale);
    } else {
      mapTexts(ctx, state, scale);
    }
  }
  ctx.restore();
}

/** What R would do right now. */
function rLabel(state: GameState): string {
  const thing = interaction(state);
  let label: string = ZELDA_TEXTS.roll;
  if (state.player.swimming) {
    label = ZELDA_TEXTS.dive;
  } else if (thing !== null) {
    label =
      thing.kind === "stump"
        ? state.player.small
          ? ZELDA_TEXTS.grow
          : ZELDA_TEXTS.shrink
        : R_LABEL[thing.kind];
  }
  return label;
}

/** Hearts, the A / B / R buttons, keys and the rupee counter. */
function drawHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  const player = state.player;
  const low = player.hp <= HALVES_PER_HEART && Math.floor(clock * 4) % 2 === 0;
  for (let i = 0; i < player.maxHearts; i++) {
    const halves = player.hp - i * HALVES_PER_HEART;
    const name: SpriteName =
      halves >= 2 ? "heartFull" : halves === 1 ? "heartHalf" : "heartEmpty";
    const pulse =
      low && i === Math.ceil(player.hp / HALVES_PER_HEART) - 1 ? -1 : 0;
    drawSprite(
      ctx,
      art,
      name,
      HUD.heartX + (i % HUD.heartsPerRow) * HUD.heartStep,
      HUD.heartY + Math.floor(i / HUD.heartsPerRow) * 8 + pulse,
    );
  }

  ctx.fillStyle = INK;
  roundRect(ctx, HUD.rTabX - 1, HUD.rTabY - 1, HUD.rTabW + 2, HUD.rTabH + 2, 4);
  ctx.fillStyle = "#c8c8d8";
  roundRect(ctx, HUD.rTabX, HUD.rTabY, HUD.rTabW, HUD.rTabH, 3);
  ctx.fillStyle = "#9898b0";
  ctx.fillRect(HUD.rTabX + 2, HUD.rTabY + HUD.rTabH - 2, HUD.rTabW - 4, 1);
  drawSprite(ctx, art, "letterR", HUD.rTabX + HUD.rTabW - 9, HUD.rTabY);

  for (const [x, equip, letter, letterX] of [
    [HUD.bSlotX, state.inv.bItem, "letterB", HUD.bSlotX - 4],
    [HUD.aSlotX, state.inv.aItem, "letterA", HUD.aSlotX + 15],
  ] as const) {
    drawSprite(ctx, art, "slot", x, HUD.slotY);
    const icon = equipIcon(state, equip);
    const size = spriteSize(icon);
    drawSprite(
      ctx,
      art,
      icon,
      x + 11 - Math.round(size.w / 2),
      HUD.slotY + 11 - Math.round(size.h / 2),
    );
    drawSprite(ctx, art, letter, letterX, HUD.slotY + 14);
    const ammo = ammoOf(state, equip);
    if (ammo !== null) {
      drawNumber(ctx, art, ammo, 2, x + 8, HUD.slotY + 17, "small");
    }
  }

  if (state.area === "dungeon") {
    drawSprite(ctx, art, "keyHud", HUD.rupeeX, HUD.keyY);
    drawNumber(
      ctx,
      art,
      state.inv.keys,
      2,
      HUD.rupeeX + 9,
      HUD.keyY - 1,
      "digit",
    );
  }
  const rupeeFrame = Math.floor(clock * 2) % 6 === 0 ? 1 : 0;
  drawSprite(
    ctx,
    art,
    `rupeeGreen${rupeeFrame}` as SpriteName,
    HUD.rupeeX - 2,
    HUD.rupeeY - 1,
  );
  drawNumber(
    ctx,
    art,
    state.inv.rupees,
    3,
    HUD.rupeeX + 9,
    HUD.rupeeY,
    "digit",
  );
}

/**
 * The sprite of a tool or bottle.
 *
 * @param state - the game, for what a bottle holds
 * @param equip - the tool or bottle
 * @returns its icon
 */
export function equipIcon(state: GameState, equip: EquipId): SpriteName {
  let icon: SpriteName;
  if (isBottle(equip)) {
    icon =
      state.inv.bottles[bottleIndex(equip)] === "potion"
        ? "bottlePotion"
        : "bottleEmpty";
  } else {
    icon = TOOL_ICON[equip];
  }
  return icon;
}

/** The ammunition shown beside a tool, or null if it needs none. */
function ammoOf(state: GameState, equip: EquipId): number | null {
  let ammo: number | null = null;
  if (equip === "bow") {
    ammo = state.inv.arrows;
  } else if (equip === "bombs") {
    ammo = state.inv.bombs;
  }
  return ammo;
}

/** The pause screen: the tools page, or the map. */
function drawMenu(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  const menu = state.menu;
  if (menu !== null) {
    if (menu.page === "items") {
      drawItemPage(ctx, state, art, clock);
    } else {
      ctx.fillStyle = "rgba(16, 12, 32, 0.6)";
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      panel(
        ctx,
        MENU.x,
        MENU.y,
        MENU.w,
        MENU.h,
        "rgba(64, 60, 52, 0.97)",
        "#c8c0a8",
      );
      ctx.fillStyle = "#f0d070";
      ctx.fillRect(MENU.x + 8, MENU.y + 16, MENU.w - 16, 1);
      if (state.area === "dungeon") {
        drawTempleMap(ctx, state, art, clock);
      } else {
        drawWorldMap(ctx, state, art, clock);
      }
    }
    drawTabs(ctx, art, clock);
  }
}

/** The arrow tabs on both edges that flip to the other page. */
function drawTabs(
  ctx: CanvasRenderingContext2D,
  art: Art,
  clock: number,
): void {
  const nudge = Math.floor(clock * 3) % 2;
  for (const [tab, arrow, dx] of [
    [INVENTORY.leftTab, "menuArrowLeft", -nudge],
    [INVENTORY.rightTab, "menuArrowRight", nudge],
  ] as const) {
    panel(ctx, tab.x, tab.y, tab.w, tab.h, PAGE.title, PAGE.rim);
    const size = spriteSize(arrow);
    drawSprite(
      ctx,
      art,
      arrow,
      tab.x + Math.round((tab.w - size.w) / 2) + dx,
      tab.y + Math.round((tab.h - size.h) / 2),
    );
  }
  drawClose(ctx);
}

/** The close button: a red tile with a white cross, pixel by pixel. */
function drawClose(ctx: CanvasRenderingContext2D): void {
  const box = INVENTORY.close;
  panel(ctx, box.x, box.y, box.w, box.h, PAGE.close, PAGE.rim);
  const arm = 7;
  const left = box.x + Math.floor((box.w - arm) / 2);
  const top = box.y + Math.floor((box.h - arm) / 2);
  ctx.fillStyle = PAGE.rim;
  for (let i = 0; i < arm; i++) {
    ctx.fillRect(left + i, top + i, 2, 1);
    ctx.fillRect(left + arm - 1 - i, top + i, 2, 1);
  }
}

/**
 * The tools page: title plate, A and B, the twelve tool tiles, the bottles,
 * the save button and the name bar.
 */
function drawItemPage(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  const menu = state.menu;
  ctx.fillStyle = PAGE.backdrop;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.fillStyle = PAGE.dots;
  for (let y = 2; y < SCREEN_H; y += 8) {
    for (let x = (y / 8) % 2 === 0 ? 2 : 6; x < SCREEN_W; x += 8) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const title = INVENTORY.title;
  panel(ctx, title.x, title.y, title.w, title.h, PAGE.title, PAGE.rim);
  for (const [box, equip, letter] of [
    [INVENTORY.bSlot, state.inv.bItem, "letterB"],
    [INVENTORY.aSlot, state.inv.aItem, "letterA"],
  ] as const) {
    panel(ctx, box.x, box.y, box.w, box.h, PAGE.tile, PAGE.rim);
    drawIcon(ctx, art, equipIcon(state, equip), box, 2);
    drawSprite(ctx, art, letter, box.x - 3, box.y + box.h - 7);
  }
  const frame = INVENTORY.frame;
  panel(ctx, frame.x, frame.y, frame.w, frame.h, PAGE.frame, PAGE.rim);
  for (let slot = 0; slot <= SAVE_SLOT; slot++) {
    drawSlot(ctx, state, art, slot);
  }
  if (menu !== null) {
    const rect = slotRect(menu.cursor);
    cursor(ctx, rect.x, rect.y, rect.w, rect.h, clock);
  }
  const bar = INVENTORY.nameBar;
  panel(ctx, bar.x, bar.y, bar.w, bar.h, PAGE.nameBar, PAGE.rim);
  const pieces = `pieces${state.inv.heartPieces}` as SpriteName;
  drawSprite(ctx, art, pieces, bar.x + bar.w - 22, bar.y + 5);
  if (state.flags.has(SUNSTONE_FLAG)) {
    drawSprite(ctx, art, "sunstone", bar.x + bar.w - 34, bar.y + 9);
  }
}

/** One tile of the tools page: a tool, a bottle or the save button. */
function drawSlot(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  slot: number,
): void {
  const rect = slotRect(slot);
  const equip = slotEquip(slot);
  const have = equip === null || owns(state, equip);
  ctx.fillStyle = INK;
  roundRect(ctx, rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2, 3);
  ctx.fillStyle = have ? PAGE.tileEdge : PAGE.emptyEdge;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 2);
  ctx.fillStyle = have ? PAGE.tile : PAGE.emptyTile;
  roundRect(ctx, rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 3, 2);
  if (equip !== null && have) {
    drawIcon(ctx, art, equipIcon(state, equip), rect, 0);
    const ammo = ammoOf(state, equip);
    if (ammo !== null) {
      drawNumber(
        ctx,
        art,
        ammo,
        2,
        rect.x + rect.w - 10,
        rect.y + rect.h - 8,
        "small",
      );
    }
    const button = buttonOf(state, equip);
    if (button !== null && slot < FIRST_BOTTLE) {
      drawSprite(
        ctx,
        art,
        button === "a" ? "letterA" : "letterB",
        rect.x + 2,
        rect.y + 2,
      );
    } else if (button !== null) {
      drawSprite(
        ctx,
        art,
        button === "a" ? "letterA" : "letterB",
        rect.x - 3,
        rect.y - 3,
      );
    }
  }
}

/** An icon in the middle of a box. */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  art: Art,
  icon: SpriteName,
  box: Rect,
  inset: number,
): void {
  const size = spriteSize(icon);
  drawSprite(
    ctx,
    art,
    icon,
    box.x + Math.round((box.w - size.w) / 2),
    box.y + Math.round((box.h - size.h) / 2) - (inset > 0 ? 1 : 0),
  );
}

/** The overworld map with a blinking Link where he is. */
function drawWorldMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  const map = art.map;
  ctx.fillStyle = "#e8d8a8";
  ctx.fillRect(MAP_VIEW.x - 2, MAP_VIEW.y - 2, MAP_VIEW.w + 4, MAP_VIEW.h + 4);
  // The map picture is 4:3, the window wider - show the band around Link.
  const scale = MAP_VIEW.w / map.naturalWidth;
  const where = linkOnWorld(state);
  const bandH = MAP_VIEW.h / scale;
  const top = Math.min(
    map.naturalHeight - bandH,
    Math.max(
      0,
      (where.y / AREAS.overworld.height) * map.naturalHeight - bandH / 2,
    ),
  );
  ctx.drawImage(
    map,
    0,
    top,
    map.naturalWidth,
    bandH,
    MAP_VIEW.x,
    MAP_VIEW.y,
    MAP_VIEW.w,
    MAP_VIEW.h,
  );
  const px = (x: number) =>
    MAP_VIEW.x + (x / AREAS.overworld.width) * MAP_VIEW.w;
  const py = (y: number) =>
    MAP_VIEW.y +
    ((y / AREAS.overworld.height) * map.naturalHeight - top) * scale;
  if (!state.flags.has(BOSS_FLAG)) {
    const t = PLACE_ON_MAP.temple;
    ctx.fillStyle = Math.floor(clock * 2) % 2 === 0 ? "#e83030" : "#ffffff";
    ctx.fillRect(Math.round(px(t.x)) - 2, Math.round(py(t.y)) - 2, 5, 5);
  }
  if (Math.floor(clock * 4) % 2 === 0) {
    drawSprite(
      ctx,
      art,
      "tinyDown0",
      Math.round(px(where.x)) - 5,
      Math.round(py(where.y)) - 10,
    );
  }
}

/** Where Link is on the overworld - for houses and the root world, their door. */
function linkOnWorld(state: GameState): { x: number; y: number } {
  const player = state.player;
  let where = { x: player.x, y: player.y };
  if (state.area === "houses") {
    where = { ...PLACE_ON_MAP.houses[state.room === 0 ? 0 : 1] };
  } else if (state.area === "mini") {
    where = { ...PLACE_ON_MAP.mini };
  }
  return where;
}

/** The temple's rooms: all of them with the map, chests and guardian with the compass. */
function drawTempleMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  const hasMap = state.flags.has(ITEM_FLAG.map);
  const hasCompass = state.flags.has(ITEM_FLAG.compass);
  const left = SCREEN_W / 2 - (TEMPLE_COLS * ROOM_CELL.w) / 2;
  const top = MENU.y + 26;
  for (const room of TEMPLE_ROOMS) {
    const seen = state.visited.has(room);
    if (seen || hasMap) {
      const x = left + (room % TEMPLE_COLS) * ROOM_CELL.w;
      const y = top + Math.floor(room / TEMPLE_COLS) * ROOM_CELL.h;
      ctx.fillStyle = INK;
      ctx.fillRect(x, y, ROOM_CELL.w - 1, ROOM_CELL.h - 1);
      ctx.fillStyle = seen ? "#78b0a0" : "#4a6a60";
      ctx.fillRect(x + 1, y + 1, ROOM_CELL.w - 3, ROOM_CELL.h - 3);
      if (room === state.room && Math.floor(clock * 4) % 2 === 0) {
        drawSprite(ctx, art, "tinyDown0", x + ROOM_CELL.w / 2 - 5, y + 3);
      }
    }
  }
  if (hasCompass) {
    for (const chest of TEMPLE_CHESTS) {
      const room = roomAt("dungeon", chest.tx * TILE, chest.ty * TILE);
      const open = state.flags.has(
        tileFlag("chest", "dungeon", chest.tx, chest.ty),
      );
      const shown =
        chestVisible(state, chest.tx, chest.ty) || room === BOSS_ROOM;
      if (!open && shown) {
        const x =
          left +
          (room % TEMPLE_COLS) * ROOM_CELL.w +
          ((chest.tx % ROOM_COLS) / ROOM_COLS) * ROOM_CELL.w;
        const y =
          top +
          Math.floor(room / TEMPLE_COLS) * ROOM_CELL.h +
          ((chest.ty % ROOM_ROWS) / ROOM_ROWS) * ROOM_CELL.h;
        ctx.fillStyle = "#f8d040";
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
    }
    if (!state.flags.has(BOSS_FLAG)) {
      const x =
        left + (BOSS_ROOM % TEMPLE_COLS) * ROOM_CELL.w + ROOM_CELL.w / 2;
      const y =
        top +
        Math.floor(BOSS_ROOM / TEMPLE_COLS) * ROOM_CELL.h +
        ROOM_CELL.h / 2;
      ctx.fillStyle = Math.floor(clock * 2) % 2 === 0 ? "#e83030" : "#801818";
      ctx.fillRect(x - 3, y - 2, 6, 5);
    }
  }
  // What the temple has given so far, under the map.
  const row: SpriteName[] = [];
  if (hasMap) {
    row.push("mapIcon");
  }
  if (hasCompass) {
    row.push("compassIcon");
  }
  if (state.flags.has(ITEM_FLAG.bigKey)) {
    row.push("keyBig");
  }
  row.forEach((icon, i) => {
    drawSprite(ctx, art, icon, MENU.x + 14 + i * 18, MENU.y + MENU.h - 32);
  });
  drawSprite(ctx, art, "keyHud", MENU.x + MENU.w - 40, MENU.y + MENU.h - 30);
  drawNumber(
    ctx,
    art,
    state.inv.keys,
    2,
    MENU.x + MENU.w - 31,
    MENU.y + MENU.h - 31,
    "digit",
  );
}

/** The words of the tools page. */
function menuTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  const menu = state.menu;
  if (menu !== null) {
    const title = INVENTORY.title;
    text(
      ctx,
      ZELDA_TEXTS.inventory,
      title.x + title.w / 2,
      title.y + title.h / 2 + 0.5,
      scale,
      8,
      "center",
    );
    text(
      ctx,
      ZELDA_TEXTS.inventoryHintA,
      title.x + title.w + 6,
      7,
      scale,
      5,
      "left",
    );
    text(
      ctx,
      ZELDA_TEXTS.inventoryHintB,
      title.x + title.w + 6,
      15,
      scale,
      5,
      "left",
    );
    const save = INVENTORY.save;
    text(
      ctx,
      ZELDA_TEXTS.saveButton,
      save.x + save.w / 2,
      save.y + save.h / 2,
      scale,
      7,
      "center",
    );
    const bar = INVENTORY.nameBar;
    const label = slotLabel(state, menu.cursor);
    const name = menu.saved > 0 ? ZELDA_TEXTS.saved : label.name;
    text(ctx, name, bar.x + 8, bar.y + 8, scale, 8, "left");
    text(ctx, label.hint, bar.x + 8, bar.y + 18, scale, 5.5, "left");
  }
}

/** The name and the short help of what sits in a slot. */
function slotLabel(
  state: GameState,
  slot: number,
): { readonly name: string; readonly hint: string } {
  const equip = slotEquip(slot);
  let label: { name: string; hint: string } = {
    name: "",
    hint: ZELDA_TEXTS.emptySlot,
  };
  if (equip === null) {
    label = { name: ZELDA_TEXTS.saveButton, hint: ZELDA_TEXTS.saveHint };
  } else if (owns(state, equip) && isBottle(equip)) {
    const content = state.inv.bottles[bottleIndex(equip)];
    label = { name: BOTTLE_NAMES[content], hint: BOTTLE_HINTS[content] };
  } else if (owns(state, equip) && !isBottle(equip)) {
    label = { name: ITEM_NAMES[equip], hint: ITEM_HINTS[equip] };
  }
  return label;
}

/** The words of the map page. */
function mapTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  const temple = state.area === "dungeon";
  const title = temple
    ? ZELDA_TEXTS.templeName
    : state.area === "mini"
      ? `${ZELDA_TEXTS.overworldName} - ${ZELDA_TEXTS.rootName}`
      : ZELDA_TEXTS.overworldName;
  text(
    ctx,
    `${ZELDA_TEXTS.map}: ${title}`,
    SCREEN_W / 2,
    MENU.y + 9,
    scale,
    8,
    "center",
  );
  if (temple && !state.flags.has(ITEM_FLAG.map)) {
    text(
      ctx,
      ZELDA_TEXTS.noMap,
      SCREEN_W / 2,
      MENU.y + MENU.h - 18,
      scale,
      5.5,
      "center",
    );
  }
  text(
    ctx,
    ZELDA_TEXTS.mapHint,
    MENU.x + 12,
    MENU.y + MENU.h - 7,
    scale,
    5.5,
    "left",
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
