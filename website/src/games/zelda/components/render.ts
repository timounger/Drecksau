/**
 * Drawing the game at the Game Boy Advance's 240 x 160 pixels: the area's
 * picture, its changing tiles, monsters, villagers, Link and everything
 * flying about. The heads-up display, the text box and the menus are drawn
 * on top by {@link ./render-ui}.
 *
 * @module
 * @remarks
 * Two passes. {@link drawFrame} paints the pixel picture into a small buffer
 * that is later blown up by a whole number; {@link drawTexts} then writes the
 * words straight onto the big canvas at full resolution, so the letters stay
 * sharp while everything else stays honest pixels.
 */
import {
  chestVisible,
  isCleared,
  shutterOpen,
  tileFlag,
} from "@/games/zelda/engine/clearing";
import { VIEW_H, VIEW_W } from "@/games/zelda/engine/enemies";
import { fadeAmount } from "@/games/zelda/engine/engine";
import {
  AHEAD,
  BODY_LIFT,
  BOMB_FUSE,
  CARRY_LIFT,
  CHARGE_TIME,
  EIGHTHS,
  SLASH_TIME,
  SPIN_TIME,
  swordPose,
} from "@/games/zelda/engine/items";
import { npcsHere, waresHere, type NpcId } from "@/games/zelda/engine/npcs";
import { hopHeight } from "@/games/zelda/engine/physics";
import { ROLL_TIME } from "@/games/zelda/engine/player";
import { DIVE_SPOTS, DIVE_TIME, diveFlag } from "@/games/zelda/engine/swim";
import { DIG_SPOTS, digFlag } from "@/games/zelda/engine/tools";
import {
  ROOM_ROWS,
  TILE,
  TILE_CHARS,
  tileAt,
  tileIndex,
} from "@/games/zelda/engine/tiles";
import type {
  AreaId,
  Dir,
  Effect,
  Enemy,
  GameState,
  Pickup,
  Treasure,
} from "@/games/zelda/engine/types";
import { drawUi, drawUiTexts, equipIcon } from "./render-ui";
import { shadow } from "./render-kit";
import type { SpriteName } from "./sprite-atlas";
import { drawPicture, drawSprite, spriteSize, type Art } from "./sprites";

/** Logical screen size. */
export const SCREEN_W = VIEW_W;
export const SCREEN_H = VIEW_H;

/** Which picture each area is painted from. */
const AREA_PICTURE: Readonly<
  Record<AreaId, "world" | "dungeon" | "interior" | "mini">
> = {
  overworld: "world",
  dungeon: "dungeon",
  houses: "interior",
  mini: "mini",
};

/** One sprite-sheet frame per facing: down / up / side. */
const FACING_ROW: Readonly<Record<Dir, "Down" | "Up" | "Side">> = {
  down: "Down",
  up: "Up",
  left: "Side",
  right: "Side",
};

/** Beetle sprite per facing. */
const BEETLE_ROW: Readonly<Record<Dir, "Down" | "Up" | "Left" | "Right">> = {
  down: "Down",
  up: "Up",
  left: "Left",
  right: "Right",
};

/** The villagers' sprite names. */
const NPC_SPRITE: Readonly<Record<NpcId, string>> = {
  elder: "npcElder",
  shopkeeper: "npcShop",
  guard: "npcGuard",
  kid: "npcKid",
  farmer: "npcFarmer",
};

/** The sprite of each find held up or shown. */
export const TREASURE_ICON: Readonly<Record<Treasure, SpriteName>> = {
  key: "keySmall",
  bigKey: "keyBig",
  map: "mapIcon",
  compass: "compassIcon",
  gloves: "gloves",
  piece: "heartPiece",
  container: "heartContainer",
  rupees: "rupeeRed0",
  sunstone: "sunstone",
  lantern: "lantern",
  boots: "boots",
  fireRod: "fireRod",
  hookshot: "hookshot",
  shovel: "shovel",
  feather: "feather",
  bottle: "bottleEmpty",
};

/** The hookshot's tip per facing (quarter turns counter-clockwise from right). */
const HOOK_TIP: Readonly<Record<Dir, SpriteName>> = {
  right: "hookTip0",
  up: "hookTip1",
  left: "hookTip2",
  down: "hookTip3",
};

/** Arrow sprite per facing (quarter turns counter-clockwise from right). */
const ARROW_SPRITE: Readonly<Record<Dir, SpriteName>> = {
  right: "arrow0",
  up: "arrow1",
  left: "arrow2",
  down: "arrow3",
};

/** Spear sprite per facing. */
const SPEAR_SPRITE: Readonly<Record<Dir, SpriteName>> = {
  right: "spear0",
  up: "spear1",
  left: "spear2",
  down: "spear3",
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here down: sprite
   offsets, animation rates and pixel layouts, all in screen pixels and
   seconds. Each number places one picture; naming them all would only move
   the same numbers into a list nobody reads beside the drawing. */

/** Walk cycle: stand, step, stand, other step. */
const WALK_CYCLE = [1, 0, 2, 0] as const;

/** Walk animation speed, frames per second. */
const WALK_FPS = 8;

/** Things on the screen to draw in order of their feet. */
type Drawable = { readonly y: number; readonly draw: () => void };

/**
 * Paints one frame of the pixel picture.
 *
 * @param ctx - the buffer, scaled so that one unit is one logical pixel
 * @param state - the game
 * @param art - the pictures
 * @param clock - seconds since the page opened, for idle animations
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  clock: number,
): void {
  const shake =
    state.shake > 0
      ? Math.round(Math.sin(clock * 90) * 2 * Math.min(1, state.shake * 4))
      : 0;
  const camX = Math.round(state.camX) + shake;
  const camY = Math.round(state.camY);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#08080f";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  drawPicture(
    ctx,
    art,
    art[AREA_PICTURE[state.area]],
    camX,
    camY,
    SCREEN_W,
    SCREEN_H,
  );
  drawTiles(ctx, state, art, camX, camY, clock);

  const list: Drawable[] = [];
  for (const pickup of state.pickups) {
    list.push({
      y: pickup.y,
      draw: () => drawPickup(ctx, art, pickup, camX, camY, clock),
    });
  }
  for (const block of state.blocks) {
    list.push({
      y: block.y + TILE,
      draw: () => drawSprite(ctx, art, "block", block.x - camX, block.y - camY),
    });
  }
  for (const npc of npcsHere(state)) {
    list.push({
      y: npc.y,
      draw: () => {
        shadow(ctx, npc.x - camX, npc.y - camY + 3, 6);
        const frame = Math.floor(clock * 1.6 + npc.x) % 2;
        drawSprite(
          ctx,
          art,
          `${NPC_SPRITE[npc.id]}${frame}` as SpriteName,
          npc.x - camX - 8,
          npc.y - camY - 20,
        );
      },
    });
  }
  for (const bomb of state.bombs) {
    list.push({
      y: bomb.y,
      draw: () => {
        shadow(ctx, bomb.x - camX, bomb.y - camY, 6);
        const flash =
          bomb.fuse < BOMB_FUSE * 0.3 && Math.floor(clock * 16) % 2 === 0;
        const name: SpriteName = flash
          ? "bombFlash"
          : Math.floor(clock * 10) % 2
            ? "bomb1"
            : "bomb0";
        drawSprite(ctx, art, name, bomb.x - camX - 7, bomb.y - camY - 12);
      },
    });
  }
  for (const enemy of state.enemies) {
    list.push({
      y: enemy.y,
      draw: () => drawEnemy(ctx, art, enemy, camX, camY, clock),
    });
  }
  list.push({
    y: state.player.y,
    draw: () => drawLink(ctx, state, art, camX, camY, clock),
  });
  list.sort((a, b) => a.y - b.y);
  for (const item of list) {
    item.draw();
  }

  drawShots(ctx, state, art, camX, camY, clock);
  drawHook(ctx, state, art, camX, camY);
  for (const rock of state.rocks) {
    const fall = Math.max(0, 1 - rock.z / 150);
    shadow(ctx, rock.x - camX, rock.y - camY, 2 + fall * 5);
    drawSprite(
      ctx,
      art,
      "boulder",
      rock.x - camX - 7,
      rock.y - camY - 10 - rock.z,
    );
  }
  for (const effect of state.effects) {
    drawEffect(ctx, art, effect, camX, camY);
  }

  drawUi(ctx, state, art, clock);
  const dark = fadeAmount(state);
  if (dark > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${dark})`;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }
}

/**
 * Writes the words of the frame onto the big canvas.
 *
 * @param ctx - the visible canvas, already holding the blown-up picture
 * @param state - the game
 * @param scale - canvas pixels per logical pixel
 */
export function drawTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  if (fadeAmount(state) < 0.5) {
    drawUiTexts(ctx, state, scale);
  }
}

/** The tiles that change: bushes, rocks, doors, chests, torches, plates. */
function drawTiles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  camX: number,
  camY: number,
  clock: number,
): void {
  const area = state.area;
  const tx0 = Math.floor(camX / TILE);
  const ty0 = Math.floor(camY / TILE);
  const glint = Math.floor(clock * 3);
  const flame = Math.floor(clock * 8) % 2 === 0 ? "torch1" : "torch2";
  for (let ty = ty0; ty <= ty0 + SCREEN_H / TILE + 1; ty++) {
    for (let tx = tx0; tx <= tx0 + SCREEN_W / TILE + 1; tx++) {
      const letter = tileAt(area, tx, ty);
      const index = tileIndex(area, tx, ty);
      const x = tx * TILE - camX;
      const y = ty * TILE - camY;
      const across = ty % ROOM_ROWS === 0 || ty % ROOM_ROWS === ROOM_ROWS - 1;
      switch (letter) {
        case TILE_CHARS.bush:
          if (!state.cut.has(index)) {
            drawSprite(ctx, art, "bush", x, y);
          }
          break;
        case TILE_CHARS.tallGrass:
          if (!state.cut.has(index)) {
            drawSprite(ctx, art, "tallGrass", x, y + 2);
          }
          break;
        case TILE_CHARS.crackedRock:
          if (!isCleared(state, tx, ty)) {
            drawSprite(ctx, art, "crackedRock", x, y);
          }
          break;
        case TILE_CHARS.crackedWall:
          if (!isCleared(state, tx, ty)) {
            drawSprite(ctx, art, "crackWall", x, y);
          }
          break;
        case TILE_CHARS.heavyRock:
          if (!state.cut.has(index)) {
            shadow(ctx, x + 8, y + 13, 7);
            drawSprite(ctx, art, "heavyRock", x, y);
          }
          break;
        case TILE_CHARS.lockedDoor:
          if (!isCleared(state, tx, ty)) {
            drawSprite(ctx, art, across ? "doorLockH" : "doorLockV", x, y);
          }
          break;
        case TILE_CHARS.bossDoor:
          if (!isCleared(state, tx, ty)) {
            drawSprite(ctx, art, across ? "doorBossH" : "doorBossV", x, y);
          }
          break;
        case TILE_CHARS.shutter:
          if (!shutterOpen(state, tx, ty)) {
            drawSprite(ctx, art, across ? "shutterH" : "shutterV", x, y);
          }
          break;
        case TILE_CHARS.chest:
          if (chestVisible(state, tx, ty)) {
            const open = state.flags.has(tileFlag("chest", area, tx, ty));
            drawSprite(ctx, art, open ? "chestOpen" : "chestClosed", x, y);
          }
          break;
        case TILE_CHARS.torch: {
          const lit = state.flags.has(tileFlag("torch", area, tx, ty));
          drawSprite(ctx, art, lit ? flame : "torch0", x, y);
          break;
        }
        case TILE_CHARS.brazier:
          drawSprite(ctx, art, flame, x, y);
          break;
        case TILE_CHARS.hookPost:
          drawSprite(ctx, art, "hookPost", x, y);
          break;
        case TILE_CHARS.plate: {
          const down =
            state.flags.has(`switch:${state.room}`) ||
            state.blocks.some(
              (block) => block.x === tx * TILE && block.y === ty * TILE,
            );
          drawSprite(ctx, art, down ? "switchDown" : "switchUp", x, y);
          break;
        }
        case TILE_CHARS.current:
          drawCurrent(ctx, area, tx, ty, x, y, clock);
          break;
        case TILE_CHARS.water:
          if ((index * 7 + glint) % 19 === 0) {
            const gx = x + ((index * 5) % 11) + 2;
            const gy = y + ((index * 3) % 9) + 3;
            ctx.fillStyle = "#e8f6ff";
            ctx.fillRect(gx, gy, 3, 1);
            ctx.fillRect(gx + 1, gy - 1, 1, 3);
          }
          break;
        default:
          break;
      }
      if (state.dug.has(index)) {
        drawSprite(ctx, art, "dugHole", x, y);
      }
    }
  }
  if (area === "overworld") {
    for (const spot of DIG_SPOTS) {
      const index = tileIndex(area, spot.tx, spot.ty);
      if (!state.flags.has(digFlag(spot)) && !state.dug.has(index)) {
        drawSprite(
          ctx,
          art,
          "digSpot",
          spot.tx * TILE - camX,
          spot.ty * TILE - camY,
        );
      }
    }
  }
  if (area === "overworld") {
    for (const spot of DIVE_SPOTS) {
      if (!state.flags.has(diveFlag(spot))) {
        drawDiveSpot(ctx, spot.tx * TILE - camX, spot.ty * TILE - camY, clock);
      }
    }
  }
  for (const ware of waresHere(state)) {
    const x = ware.tx * TILE - camX;
    const y = ware.ty * TILE - camY;
    const icon = WARE_ICON[ware.id];
    const size = spriteSize(icon);
    drawSprite(ctx, art, icon, x + 8 - size.w / 2, y + 6 - size.h / 2);
    drawPrice(ctx, art, ware.price, x + 8, y + 12);
  }
}

/** How far the current's darker water keeps off the shore, px. */
const SHORE = 4;

/** Middle of the island the current swirls round, in tiles. */
const ISLAND = { tx: 49, ty: 38.5 } as const;

/**
 * One tile of the strong current: darker, churning water with streaks of
 * foam that race round the island.
 */
function drawCurrent(
  ctx: CanvasRenderingContext2D,
  area: AreaId,
  tx: number,
  ty: number,
  x: number,
  y: number,
  clock: number,
): void {
  // The darker water stays clear of the shore on sides that meet land.
  const wet = (dx: number, dy: number) =>
    "~c".includes(tileAt(area, tx + dx, ty + dy));
  const left = wet(-1, 0) ? 0 : SHORE;
  const top = wet(0, -1) ? 0 : SHORE;
  const right = wet(1, 0) ? 0 : SHORE;
  const bottom = wet(0, 1) ? 0 : SHORE;
  ctx.fillStyle = "rgba(16, 32, 104, 0.38)";
  ctx.fillRect(x + left, y + top, TILE - left - right, TILE - top - bottom);
  // The flow runs round the island, anticlockwise.
  const ax = tx + 0.5 - ISLAND.tx;
  const ay = ty + 0.5 - ISLAND.ty;
  const length = Math.hypot(ax, ay) || 1;
  const fx = -ay / length;
  const fy = ax / length;
  for (let k = 0; k < 3; k++) {
    const seed = (tx * 37 + ty * 91 + k * 53) % 97;
    const run = (clock * 1.6 + seed / 97) % 1;
    const sx = x + 2 + ((seed * 5) % 12) + fx * (run * 16 - 8);
    const sy = y + 2 + ((seed * 7) % 12) + fy * (run * 16 - 8);
    const fade = Math.sin(run * Math.PI);
    ctx.fillStyle = `rgba(220, 240, 255, ${0.85 * fade})`;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(Math.round(sx - fx * i), Math.round(sy - fy * i), 1, 1);
    }
  }
  if ((tx + ty + Math.floor(clock * 4)) % 5 === 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(x + 6, y + 7, 4, 1);
  }
}

/** A dive spot: a glint on the water and a bubble now and then. */
function drawDiveSpot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  clock: number,
): void {
  const cycle = (clock * 0.8 + x * 0.013) % 1;
  if (cycle < 0.5) {
    const rise = cycle * 2;
    const r = 1 + Math.round(rise);
    ctx.fillStyle = `rgba(230, 248, 255, ${0.9 - rise * 0.6})`;
    ctx.fillRect(x + 7, Math.round(y + 11 - rise * 7), r, r);
    ctx.fillRect(x + 10, Math.round(y + 12 - rise * 5), 1, 1);
  }
  if (Math.floor(clock * 2.5) % 3 === 0) {
    ctx.fillStyle = "#fff8c0";
    ctx.fillRect(x + 5, y + 6, 3, 1);
    ctx.fillRect(x + 6, y + 5, 1, 3);
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fillRect(x + 4, y + 13, 8, 1);
}

/** The sprite of each ware on the counter. */
const WARE_ICON = {
  heart: "heartFull",
  arrows: "arrowPickup",
  bombs: "bomb0",
  bottle: "bottleEmpty",
  potion: "bottlePotion",
  piece: "heartPiece",
} as const satisfies Record<string, SpriteName>;

/** A price under a ware, in small digits. */
function drawPrice(
  ctx: CanvasRenderingContext2D,
  art: Art,
  price: number,
  cx: number,
  y: number,
): void {
  const digits = String(price);
  const left = cx - digits.length * 2;
  for (let i = 0; i < digits.length; i++) {
    drawSprite(ctx, art, `small${digits[i]}` as SpriteName, left + i * 4, y);
  }
}

/** Arrows, rocks, fireballs, thrown boulders and the boomerang. */
function drawShots(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  camX: number,
  camY: number,
  clock: number,
): void {
  for (const shot of state.shots) {
    const x = shot.x - camX;
    const y = shot.y - camY;
    switch (shot.kind) {
      case "arrow":
        drawSprite(ctx, art, ARROW_SPRITE[shot.facing], x - 8, y - 8);
        if (shot.fire) {
          drawSprite(
            ctx,
            art,
            Math.floor(clock * 20) % 2 ? "fireball0" : "fireball1",
            x - 5,
            y - 5,
          );
        }
        break;
      case "fireball":
        drawSprite(
          ctx,
          art,
          Math.floor(clock * 14) % 2 ? "fireball0" : "fireball1",
          x - 5,
          y - 5,
        );
        break;
      case "boulder":
        shadow(ctx, x, y + BODY_LIFT + 3, 6);
        drawSprite(ctx, art, "heavyRock", x - 8, y - 12);
        break;
      case "flame":
        shadow(ctx, x, y + BODY_LIFT, 3);
        drawSprite(
          ctx,
          art,
          Math.floor(clock * 16) % 2 ? "flame0" : "flame1",
          x - 5,
          y - 7,
        );
        break;
      default:
        shadow(ctx, x, y + 6, 3);
        drawSprite(ctx, art, "rockShot", x - 4, y - 4);
    }
  }
  const boomerang = state.boomerang;
  if (boomerang !== null) {
    shadow(ctx, boomerang.x - camX, boomerang.y - camY + BODY_LIFT + 2, 4);
    const frame = Math.floor(boomerang.t * 18) % 4;
    drawSprite(
      ctx,
      art,
      `boomerang${frame}` as SpriteName,
      boomerang.x - camX - 6,
      boomerang.y - camY - 6,
    );
    for (const pickup of boomerang.carried) {
      drawSprite(
        ctx,
        art,
        pickupSprite(pickup, clock),
        boomerang.x - camX - 4,
        boomerang.y - camY - 4,
      );
    }
  }
}

/** The hookshot's chain from Link's hand to its tip. */
function drawHook(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  camX: number,
  camY: number,
): void {
  const hook = state.hook;
  if (hook !== null) {
    const player = state.player;
    const handX = player.x;
    const handY = player.y - BODY_LIFT / 2;
    const length = Math.hypot(hook.x - handX, hook.y - handY);
    const links = Math.floor(length / 6);
    for (let i = 1; i < links; i++) {
      const k = i / links;
      drawSprite(
        ctx,
        art,
        "chain",
        Math.round(handX + (hook.x - handX) * k - camX) - 3,
        Math.round(handY + (hook.y - handY) * k - camY) - 3,
      );
    }
    const tip = HOOK_TIP[hook.facing];
    const size = spriteSize(tip);
    drawSprite(
      ctx,
      art,
      tip,
      Math.round(hook.x - camX - size.w / 2),
      Math.round(hook.y - camY - size.h / 2),
    );
  }
}

/** Link, his shield, and the sword, item, rock or find he is holding. */
function drawLink(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  camX: number,
  camY: number,
  clock: number,
): void {
  const player = state.player;
  const x = Math.round(player.x - camX);
  const y = Math.round(player.y - camY);
  const flicker = player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 1;
  const tiny = player.small && state.area !== "mini";
  const lift = hopHeight(player);
  if (!player.swimming) {
    shadow(ctx, x, y + 3, tiny ? 3 : 6 - lift / 4);
  }
  if (player.swimming) {
    drawSwimmer(ctx, state, art, x, y, clock, flicker);
  } else if (flicker) {
    // Blinking after a hit: every other frame Link is not drawn at all.
  } else if (tiny) {
    const row = FACING_ROW[player.facing];
    const walking = player.moving && player.action.kind === "idle";
    const frame = walking ? Math.floor(player.walk * WALK_FPS) % 2 : 0;
    drawSprite(
      ctx,
      art,
      `tiny${row}${frame}` as SpriteName,
      x - 5,
      y - 10,
      player.facing === "left",
    );
  } else if (player.action.kind === "hold") {
    drawHolding(ctx, state, art, x, y);
  } else {
    drawFullLink(ctx, state, art, camX, camY, clock);
  }
}

/**
 * Link in the water: only head and shoulders above the surface, arms
 * paddling, rings spreading - or, under water, a dark shape and bubbles.
 */
function drawSwimmer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  x: number,
  y: number,
  clock: number,
  flicker: boolean,
): void {
  const player = state.player;
  // How far the body sinks below the surface line at the feet.
  const sink = 3;
  const surface = y - 3;
  if (player.diveT > 0) {
    const deep = Math.min(1, (DIVE_TIME - player.diveT) * 5, player.diveT * 5);
    ctx.fillStyle = `rgba(12, 28, 72, ${0.25 + 0.3 * deep})`;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(12, 28, 72, ${0.2 + 0.2 * deep})`;
    ctx.beginPath();
    ctx.ellipse(x, y - 6, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawRipples(ctx, x, surface, clock, player.moving);
    if (!flicker) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 14, y - 40, 28, surface - (y - 40));
      ctx.clip();
      const holding = player.action.kind === "hold";
      const row = FACING_ROW[player.facing];
      const bob = Math.sin(clock * 5) > 0 ? 1 : 0;
      drawSprite(
        ctx,
        art,
        holding ? "linkHold" : (`link${row}0` as SpriteName),
        x - 8,
        y - 20 + sink + bob,
        player.facing === "left" && !holding,
      );
      ctx.restore();
      if (holding) {
        const item = state.hold?.item;
        if (item !== undefined) {
          const icon = TREASURE_ICON[item];
          const size = spriteSize(icon);
          drawSprite(ctx, art, icon, x - size.w / 2, y - 22 + sink - size.h);
        }
      } else {
        drawArms(ctx, player.facing, x, surface, player.walk, player.strokeT);
      }
    }
    // The surface line across the body.
    ctx.fillStyle = "rgba(232, 246, 255, 0.85)";
    ctx.fillRect(x - 6, surface, 12, 1);
    ctx.fillStyle = "rgba(40, 80, 170, 0.5)";
    ctx.fillRect(x - 5, surface + 1, 10, 1);
  }
}

/** Rings on the water round a swimmer; they spread faster when he moves. */
function drawRipples(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  clock: number,
  moving: boolean,
): void {
  const speed = moving ? 1.6 : 0.9;
  for (let k = 0; k < 2; k++) {
    const part = (clock * speed + k / 2) % 1;
    const r = 6 + part * 7;
    ctx.fillStyle = `rgba(220, 240, 255, ${0.7 * (1 - part)})`;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      ctx.fillRect(
        Math.round(x + Math.cos(a) * r),
        Math.round(y + 1 + Math.sin(a) * r * 0.4),
        1,
        1,
      );
    }
  }
}

/** Two arms paddling at the surface, in turn - or both at once in a stroke. */
function drawArms(
  ctx: CanvasRenderingContext2D,
  facing: Dir,
  x: number,
  y: number,
  walk: number,
  stroke: number,
): void {
  const beat = stroke > 0 ? 1 : Math.sin(walk * 9);
  const reach = 3 + Math.round(Math.abs(beat) * 3);
  let sides: readonly number[] = [beat > 0 ? -1 : 1];
  if (stroke > 0) {
    sides = [-1, 1];
  } else if (facing === "left" || facing === "right") {
    sides = [facing === "left" ? -1 : 1];
  }
  for (const side of sides) {
    const hx = Math.round(x + side * (5 + reach / 2));
    const hy = y - 1 - (facing === "up" ? 1 : 0);
    ctx.fillStyle = "#282038";
    ctx.fillRect(hx - 2, hy - 1, 4, 3);
    ctx.fillStyle = "#f8c8a0";
    ctx.fillRect(hx - 1, hy, 2, 1);
    ctx.fillStyle = "rgba(232, 246, 255, 0.9)";
    ctx.fillRect(hx - 2, hy + 2, 4, 1);
  }
}

/** Link with both arms up, his find shining over his head. */
function drawHolding(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  x: number,
  y: number,
): void {
  drawSprite(ctx, art, "linkHold", x - 8, y - 20);
  const item = state.hold?.item;
  if (item !== undefined) {
    const icon = TREASURE_ICON[item];
    const size = spriteSize(icon);
    drawSprite(ctx, art, icon, x - size.w / 2, y - 22 - size.h);
  }
}

/** Link at full size: walking, rolling, swinging, carrying. */
function drawFullLink(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  camX: number,
  camY: number,
  clock: number,
): void {
  const player = state.player;
  const x = Math.round(player.x - camX);
  // A hop lifts the whole of Link; his shadow stays on the ground.
  const y = Math.round(player.y - camY - hopHeight(player));
  const action = player.action;
  const row = FACING_ROW[player.facing];
  const mirror = player.facing === "left";
  const walking =
    (player.moving && action.kind === "idle") ||
    action.kind === "dash" ||
    action.kind === "leap" ||
    (action.kind === "hook" && state.hook?.phase === "pull");
  const pose = swordPose(state);
  const lift = Math.round(hopHeight(player));
  const behind = player.facing === "up";
  // The shield only shows while it is raised.
  if (behind && player.shieldUp) {
    drawShield(ctx, art, player.facing, x, y);
    if (pose !== null) {
      drawSword(
        ctx,
        art,
        state,
        pose.k,
        pose.x - camX,
        pose.y - camY - lift,
        clock,
      );
    }
  }
  if (action.kind === "roll") {
    const frame = Math.min(3, Math.floor((action.t / ROLL_TIME) * 4));
    const turn = player.facing === "left" ? 3 - frame : frame;
    drawSprite(ctx, art, `linkRoll${turn}` as SpriteName, x - 8, y - 13);
  } else {
    const frame =
      walking || state.transition?.kind === "scroll"
        ? WALK_CYCLE[Math.floor(player.walk * WALK_FPS) % WALK_CYCLE.length]
        : 0;
    const lean =
      action.kind === "slash" ||
      action.kind === "use" ||
      action.kind === "dash" ||
      player.pushT > 0.1
        ? 1
        : 0;
    const lx =
      player.facing === "right" ? lean : player.facing === "left" ? -lean : 0;
    const ly =
      player.facing === "down" ? lean : player.facing === "up" ? -lean : 0;
    drawSprite(
      ctx,
      art,
      player.carrying ? "linkHold" : (`link${row}${frame}` as SpriteName),
      x - 8 + lx,
      y - 20 + ly,
      mirror && !player.carrying,
    );
  }
  if (player.carrying) {
    drawSprite(ctx, art, "heavyRock", x - 8, y - CARRY_LIFT - 14);
  }
  if (!behind) {
    if (player.shieldUp && action.kind !== "roll" && !player.carrying) {
      drawShield(ctx, art, player.facing, x, y);
    }
    if (pose !== null) {
      drawSword(
        ctx,
        art,
        state,
        pose.k,
        pose.x - camX,
        pose.y - camY - lift,
        clock,
      );
    }
  }
  drawSwoosh(ctx, state, x, y);
  if (action.kind === "use" && action.item !== null && !player.carrying) {
    if (action.item === "bow") {
      drawBow(ctx, art, player.facing, x, y);
    } else if (action.item !== "bombs" && action.item !== "boomerang") {
      drawHeldTool(
        ctx,
        art,
        equipIcon(state, action.item),
        player.facing,
        x,
        y,
      );
    }
  }
}

/** A tool held out in front of Link while he uses it. */
function drawHeldTool(
  ctx: CanvasRenderingContext2D,
  art: Art,
  icon: SpriteName,
  facing: Dir,
  x: number,
  y: number,
): void {
  const reach: Readonly<Record<Dir, readonly [number, number]>> = {
    left: [-11, -10],
    right: [11, -10],
    up: [4, -22],
    down: [-2, -4],
  };
  const [ox, oy] = reach[facing];
  const size = spriteSize(icon);
  drawSprite(
    ctx,
    art,
    icon,
    Math.round(x + ox - size.w / 2),
    Math.round(y + oy - size.h / 2),
    facing === "left",
  );
}

/**
 * The white arc the blade leaves: a quarter sweep for a swing, a full ring
 * for the spin - drawn pixel by pixel to stay crisp.
 */
function drawSwoosh(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number,
): void {
  const player = state.player;
  const action = player.action;
  let from = 0;
  let to = 0;
  let fade = 0;
  if (action.kind === "slash" && action.t > SLASH_TIME * 0.2) {
    const k = Math.min(1, (action.t - SLASH_TIME * 0.2) / (SLASH_TIME * 0.5));
    const ahead = (AHEAD[player.facing] / EIGHTHS) * Math.PI * 2;
    const side = player.facing === "down" || player.facing === "left" ? 1 : -1;
    from = ahead + side * (Math.PI / 2);
    to = from - side * (Math.PI / 2) * k;
    fade = 1 - Math.max(0, (action.t - SLASH_TIME * 0.7) / (SLASH_TIME * 0.3));
  } else if (action.kind === "spin") {
    const k = action.t / SPIN_TIME;
    const ahead = (AHEAD[player.facing] / EIGHTHS) * Math.PI * 2;
    from = ahead;
    to = ahead - Math.PI * 2 * k;
    fade = 1 - Math.max(0, k - 0.75) * 4;
  }
  if (fade > 0 && from !== to) {
    const steps = Math.ceil(Math.abs(to - from) * 14);
    ctx.fillStyle = `rgba(240, 250, 255, ${0.85 * fade})`;
    for (let i = 0; i <= steps; i++) {
      const a = from + ((to - from) * i) / steps;
      for (const r of [15, 17]) {
        ctx.fillRect(
          Math.round(x + Math.cos(a) * r),
          Math.round(y - BODY_LIFT - Math.sin(a) * r),
          1,
          1,
        );
      }
    }
  }
}

/** The shield raised in front of Link - he only holds it while it is up. */
function drawShield(
  ctx: CanvasRenderingContext2D,
  art: Art,
  facing: Dir,
  x: number,
  y: number,
): void {
  switch (facing) {
    case "down":
      drawSprite(ctx, art, "shieldFront", x - 5, y - 14);
      break;
    case "up":
      drawSprite(ctx, art, "shieldSide", x - 8, y - 13);
      break;
    case "right":
      drawSprite(ctx, art, "shieldSide", x + 6, y - 16);
      break;
    default:
      drawSprite(ctx, art, "shieldSide", x - 10, y - 16);
  }
}

/** The sword at its angle, with a glint once the spin is charged. */
function drawSword(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  k: number,
  x: number,
  y: number,
  clock: number,
): void {
  drawSprite(ctx, art, `sword${k}` as SpriteName, x - 8, y - 8);
  const charged =
    state.player.charge >= CHARGE_TIME && state.player.action.kind === "idle";
  if (charged && Math.floor(clock * 12) % 2 === 0) {
    const angle = (k / 8) * Math.PI * 2;
    drawSprite(
      ctx,
      art,
      "spark",
      x + Math.cos(angle) * 7 - 4,
      y - Math.sin(angle) * 7 - 4,
    );
  }
}

/** The bow, held out the way Link faces. */
function drawBow(
  ctx: CanvasRenderingContext2D,
  art: Art,
  facing: Dir,
  x: number,
  y: number,
): void {
  // The bow is drawn bulging left; quarter turns point it anywhere.
  const turns: Readonly<Record<Dir, number>> = {
    left: 0,
    down: 1,
    right: 2,
    up: 3,
  };
  const reach: Readonly<Record<Dir, readonly [number, number]>> = {
    left: [-10, -8],
    right: [10, -8],
    up: [0, -18],
    down: [0, 2],
  };
  const [ox, oy] = reach[facing];
  ctx.save();
  ctx.translate(x + ox, y + oy);
  ctx.rotate((turns[facing] * Math.PI) / 2);
  drawSprite(ctx, art, "bow", -8, -8);
  ctx.restore();
}

/** One monster with its shadow, flash and gear. */
function drawEnemy(
  ctx: CanvasRenderingContext2D,
  art: Art,
  enemy: Enemy,
  camX: number,
  camY: number,
  clock: number,
): void {
  const x = Math.round(enemy.x - camX);
  const y = Math.round(enemy.y - camY);
  const z = Math.round(enemy.z);
  const big = enemy.kind === "moblin" || enemy.kind === "darknut";
  const huge = enemy.kind === "golem" || enemy.kind === "beetle";
  shadow(
    ctx,
    x,
    y + 3,
    huge ? 14 - Math.min(6, z / 12) : big ? 8 : Math.max(3, 6 - z / 4),
  );
  const step = Math.floor(enemy.anim * 6) % 2;
  const row = FACING_ROW[enemy.facing];
  const mirror = enemy.facing === "left";
  let name: SpriteName;
  switch (enemy.kind) {
    case "octorok":
      name = `octorok${row}${enemy.mode === "walk" ? step : 0}` as SpriteName;
      break;
    case "chuchu":
      name =
        enemy.mode === "hop" || Math.floor(enemy.anim * 4) % 2 === 0
          ? "chuchu0"
          : "chuchu1";
      break;
    case "keese":
      name =
        enemy.mode === "fly"
          ? Math.floor(enemy.anim * 10) % 2 === 0
            ? "keese0"
            : "keese1"
          : "keese1";
      break;
    case "tektite":
      name = enemy.mode === "jump" ? "tektite1" : "tektite0";
      break;
    case "moblin":
      name =
        `moblin${row}${enemy.mode === "patrol" || enemy.mode === "charge" ? step : 0}` as SpriteName;
      break;
    case "beetle": {
      const legs =
        enemy.mode === "charge"
          ? Math.floor(enemy.anim * 16) % 2
          : enemy.mode === "dazed"
            ? 0
            : step;
      name = `beetle${BEETLE_ROW[enemy.facing]}${legs}` as SpriteName;
      break;
    }
    case "golem":
      name =
        enemy.mode === "stunned"
          ? "golemHurt"
          : enemy.mode === "aim"
            ? "golemOpen"
            : "golemClosed";
      break;
    default:
      name = `darknut${row}${enemy.mode === "walk" ? step : 0}` as SpriteName;
  }
  const size = spriteSize(name);
  const left = x - size.w / 2;
  const top =
    y + 3 - size.h - z + (huge && enemy.kind === "beetle" ? size.h / 2 - 4 : 0);
  const wobble = enemy.kind === "golem" && enemy.mode === "crouch" ? 2 : 0;
  const gearBehind = enemy.facing === "up";
  if (gearBehind) {
    drawGear(ctx, art, enemy, x, y - z);
  }
  drawSprite(ctx, art, name, left, top + wobble, mirror && !huge);
  if (enemy.hurt > 0 && Math.floor(enemy.hurt * 30) % 2 === 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawSprite(ctx, art, name, left, top + wobble, mirror && !huge);
    ctx.restore();
  }
  if (!gearBehind) {
    drawGear(ctx, art, enemy, x, y - z);
  }
  const dizzy =
    enemy.stun > 0 || enemy.mode === "dazed" || enemy.mode === "stunned";
  if (dizzy && Math.floor(clock * 6) % 2 === 0) {
    drawSprite(ctx, art, "spark", x - 4, top - 6);
  }
  if (
    (enemy.kind === "moblin" && enemy.mode === "alert") ||
    (enemy.kind === "beetle" && enemy.mode === "aim")
  ) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 1, top - 9, 2, 5);
    ctx.fillRect(x - 1, top - 3, 2, 2);
  }
}

/** A moblin's spear, or the black knight's shield and sword. */
function drawGear(
  ctx: CanvasRenderingContext2D,
  art: Art,
  enemy: Enemy,
  x: number,
  y: number,
): void {
  if (enemy.kind === "moblin") {
    const spot: Readonly<Record<Dir, readonly [number, number]>> = {
      right: [6, -8],
      left: [-6, -8],
      down: [8, -4],
      up: [-8, -14],
    };
    const [ox, oy] = spot[enemy.facing];
    drawSprite(ctx, art, SPEAR_SPRITE[enemy.facing], x + ox - 10, y + oy - 10);
  } else if (enemy.kind === "darknut") {
    const shieldSpot: Readonly<Record<Dir, readonly [number, number]>> = {
      down: [-5, -14],
      up: [-5, -22],
      right: [3, -17],
      left: [-13, -17],
    };
    const [sx, sy] = shieldSpot[enemy.facing];
    const attacking = enemy.mode === "windup" || enemy.mode === "lunge";
    if (attacking) {
      const k = AHEAD[enemy.facing];
      const angle = (k / 8) * Math.PI * 2;
      drawSprite(
        ctx,
        art,
        `sword${k}` as SpriteName,
        x + Math.cos(angle) * 13 - 8,
        y - 10 - Math.sin(angle) * 13 - 8,
      );
    }
    drawSprite(ctx, art, "darkShield", x + sx, y + sy);
  }
}

/** A pickup lying on the ground (blinking before it vanishes). */
function drawPickup(
  ctx: CanvasRenderingContext2D,
  art: Art,
  pickup: Pickup,
  camX: number,
  camY: number,
  clock: number,
): void {
  const blink =
    pickup.life !== null && pickup.life < 3 && Math.floor(clock * 10) % 2 === 0;
  if (!blink) {
    const name = pickupSprite(pickup, clock);
    const size = spriteSize(name);
    const bob = pickup.spot !== null ? Math.round(Math.sin(clock * 3)) : 0;
    shadow(ctx, pickup.x - camX, pickup.y - camY + 3, size.w / 2 - 1);
    drawSprite(
      ctx,
      art,
      name,
      pickup.x - camX - size.w / 2,
      pickup.y - camY + 3 - size.h - pickup.z + bob,
    );
  }
}

/** Which sprite shows a pickup. */
function pickupSprite(pickup: Pickup, clock: number): SpriteName {
  const shine = Math.floor(clock * 2.5 + pickup.id) % 4 === 0 ? 1 : 0;
  let name: SpriteName;
  switch (pickup.kind) {
    case "rupee1":
      name = `rupeeGreen${shine}` as SpriteName;
      break;
    case "rupee5":
      name = `rupeeBlue${shine}` as SpriteName;
      break;
    case "rupee20":
      name = `rupeeRed${shine}` as SpriteName;
      break;
    case "heart":
      name = "heartFull";
      break;
    case "arrows":
      name = "arrowPickup";
      break;
    case "bombs":
      name = "bomb0";
      break;
    case "piece":
      name = "heartPiece";
      break;
    default:
      name = "heartContainer";
  }
  return name;
}

/** A puff, spark, leaf, explosion, dust cloud, shock ring or twinkle. */
function drawEffect(
  ctx: CanvasRenderingContext2D,
  art: Art,
  effect: Effect,
  camX: number,
  camY: number,
): void {
  const x = effect.x - camX;
  const y = effect.y - camY;
  const part = effect.t / effect.life;
  switch (effect.kind) {
    case "poof":
      drawSprite(
        ctx,
        art,
        `poof${Math.min(2, Math.floor(part * 3))}` as SpriteName,
        x - 8,
        y - 12,
      );
      break;
    case "explosion":
      drawSprite(
        ctx,
        art,
        `explosion${Math.min(2, Math.floor(part * 3))}` as SpriteName,
        x - 16,
        y - 22,
      );
      break;
    case "spark":
      drawSprite(ctx, art, "spark", x - 4, y - 4);
      break;
    case "leaf":
      drawSprite(ctx, art, "leaf", x - 1, y - 6 + part * 6);
      break;
    case "dust": {
      const r = 1 + part * 3;
      ctx.fillStyle = `rgba(240, 230, 210, ${0.8 * (1 - part)})`;
      ctx.fillRect(
        Math.round(x - r),
        Math.round(y - r - part * 4),
        Math.round(r * 2),
        Math.round(r * 2),
      );
      break;
    }
    case "ring": {
      const r = 6 + part * 34;
      ctx.fillStyle = `rgba(255, 250, 220, ${1 - part})`;
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        ctx.fillRect(
          Math.round(x + Math.cos(a) * r),
          Math.round(y + Math.sin(a) * r * 0.5),
          2,
          1,
        );
      }
      break;
    }
    case "twinkle":
      ctx.fillStyle = `rgba(200, 250, 255, ${1 - part})`;
      ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
      ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
      break;
    case "flame":
      drawSprite(
        ctx,
        art,
        part < 0.5 ? "flame0" : "flame1",
        x - 5,
        y - 9 - part * 6,
      );
      break;
    case "dirt": {
      const fall = part * part * 20;
      ctx.fillStyle = "#8a5a3c";
      ctx.fillRect(Math.round(x), Math.round(y + fall), 2, 2);
      break;
    }
    case "glow": {
      const r = 6 + part * 14;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, r);
      glow.addColorStop(0, `rgba(255, 240, 160, ${0.7 * (1 - part)})`);
      glow.addColorStop(1, "rgba(255, 200, 80, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(Math.round(x - r), Math.round(y - r), r * 2, r * 2);
      break;
    }
    case "splash": {
      const fall = part * part * 34;
      ctx.fillStyle = `rgba(220, 242, 255, ${1 - part * 0.6})`;
      ctx.fillRect(Math.round(x), Math.round(y + fall), 1, 2);
      break;
    }
    case "bubble": {
      const r = part < 0.7 ? 1 : 2;
      ctx.fillStyle = `rgba(230, 248, 255, ${0.9 - part * 0.5})`;
      ctx.fillRect(Math.round(x + Math.sin(part * 12)), Math.round(y), r, r);
      break;
    }
    default:
      drawSprite(ctx, art, "grassBit", x - 1, y - 4 + part * 4);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
