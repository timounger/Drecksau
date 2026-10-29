/**
 * Drawing what the characters can change and take: the lost present on the
 * dome, the fish jumping in the pond with its ripples, the wrench over the
 * machine while an elf repairs it - and the banner of an achievement just
 * unlocked, with its badge and a little confetti.
 *
 * @module
 */
import { TOAST_SECONDS } from "@/games/weihnachtsmann/engine/achievements";
import { TILE, footprint } from "@/games/weihnachtsmann/engine/map";
import type {
  AchievementId,
  GameMap,
  GameState,
} from "@/games/weihnachtsmann/engine/types";
import {
  FISH_JUMP,
  REPAIR_SECONDS,
  fishSpot,
  giftSpot,
  machineCorner,
} from "@/games/weihnachtsmann/engine/world";
import { ACHIEVEMENT_TEXTS, WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import {
  EFFECTS,
  OBJECTS,
  SHEET_DENSITY,
  type EffectName,
} from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** The badge of every achievement, on the figures sheet. */
export const BADGES: Readonly<Record<AchievementId, EffectName>> = {
  fish: "badgeFish",
  roofGift: "badgeRoofGift",
  rudolfLap: "badgeRudolfLap",
  wishesAll: "badgeWishesAll",
  machineBroken: "badgeMachineBroken",
  machineFixed: "badgeMachineFixed",
  grantelConcert: "badgeGrantelConcert",
  spyWorkshop: "badgeSpyWorkshop",
  spySleigh: "badgeSpySleigh",
  levitateSnowman: "badgeLevitateSnowman",
  balboIce: "badgeBalboIce",
  balboTen: "badgeBalboTen",
  balboSnowman: "badgeBalboSnowman",
  mouseFence: "badgeMouseFence",
  bearDrift: "badgeBearDrift",
  birdChimney: "badgeBirdChimney",
  hareRace: "badgeHareRace",
  foxDig: "badgeFoxDig",
  sleighRide: "badgeSleighRide",
  lampFirst: "badgeLampFirst",
  lampsAll: "badgeLampsAll",
  snowmanDown: "badgeSnowmanDown",
  snowmanBuilt: "badgeSnowmanBuilt",
  instruments: "badgeInstruments",
  toys10: "badgeToys10",
  grantelVisit: "badgeGrantelVisit",
  allInWorkshop: "badgeAllInWorkshop",
  firstGate: "badgeFirstGate",
  allGates: "badgeAllGates",
};

/** The present sits a hair in front of the dome, so it is drawn on top. */
const ON_TOP = 0.5;

/** How the present bobs on the dome: speed (radians per second) and height. */
const GIFT_BOB_SPEED = 2.5;
const GIFT_BOB = 0.5;

/** The fish's two frames: nose up, nose down. */
const FISH_FRAMES = [OBJECTS.fish0, OBJECTS.fish1] as const;

/** How high the fish jumps, map px. */
const FISH_HEIGHT = 12;

/** How fast the ripples spread, per second, and how wide they get, map px. */
const RIPPLE_SPEED = 0.8;
const RIPPLE_WIDE = 7;

/** How the wrench swings while an elf repairs: speed and angle, radians. */
const WRENCH_SPEED = 14;
const WRENCH_SWING = 0.6;

/** Where the wrench hangs over the machine's picture, map px. */
const WRENCH_AT = { x: 64, y: -60 } as const;

/** How long the banner slides in and out, seconds. */
const TOAST_SLIDE = 0.4;

/** The banner's size and look, map px at the canvas scale. */
const TOAST_W = 150;
const TOAST_H = 26;
const TOAST_TOP = 4;
const TOAST_PAD = 5;
const TOAST_ICON = 16;
const TOAST_SMALL = 5.5;
const TOAST_BIG = 7.5;
const TOAST_BORDER = 0.8;
const TOAST_ROUND = 4;

/** Where the two lines of the banner sit, as shares of its height. */
const TOAST_LINE_SMALL = 0.42;
const TOAST_LINE_BIG = 0.8;

/** Confetti pieces round the banner, and how long they fall, seconds. */
const CONFETTI = 28;
const CONFETTI_SECONDS = 1.8;

/** The confetti colours. */
const CONFETTI_COLORS: readonly string[] = [
  "#ff5a5a",
  "#ffd84a",
  "#5ad0ff",
  "#7aff8a",
  "#ff8ae0",
];

/**
 * Adds the present on the dome and the fish in the pond to what is drawn in
 * depth order.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 * @param items - what is drawn, sorted later
 */
export function collectWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  if (map.area === "outdoors") {
    const gift = giftSpot(state);
    const dome = map.objects.find((object) => object.kind === "dome");
    if (gift !== null && dome !== undefined && state.world.giftAway <= 0) {
      const rect = OBJECTS.roofGift;
      const bob = Math.sin(state.time * GIFT_BOB_SPEED) * GIFT_BOB;
      items.push({
        depth: (dome.ty + footprint("dome").rows) * TILE + ON_TOP,
        draw: () => {
          blit(
            ctx,
            art.world,
            rect,
            gift.x - rect[2] / 2,
            gift.y - rect[3] + bob,
          );
        },
      });
    }
    const fish = fishSpot(state);
    if (fish !== null) {
      items.push({
        depth: fish.y,
        draw: () => {
          drawFish(ctx, state, art, fish.x, fish.y);
        },
      });
    }
  }
}

/**
 * The wrench swinging over the machine while an elf repairs it.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 */
export function drawRepair(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const machine = state.world.machine;
  const corner = machineCorner(state.maps.workshop);
  if (state.viewArea === "workshop" && machine.repair > 0 && corner !== null) {
    const rect = OBJECTS.wrench;
    const x = corner.x + WRENCH_AT.x;
    const y = corner.y + WRENCH_AT.y;
    const angle =
      Math.sin((REPAIR_SECONDS - machine.repair) * WRENCH_SPEED) * WRENCH_SWING;
    ctx.save();
    ctx.translate(snap(x), snap(y));
    ctx.rotate(angle);
    blit(ctx, art.world, rect, -rect[2] / 2, -rect[3] / 2);
    ctx.restore();
  }
}

/**
 * The banner of the achievement just unlocked, sliding down from the top of
 * the picture, onto the visible canvas at full resolution.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param art - the sheets, for the badge
 * @param scale - canvas pixels per logical pixel
 */
export function drawToast(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  scale: number,
): void {
  const toast = state.toasts.at(0);
  if (toast !== undefined) {
    const t = toast.age;
    const slide = Math.min(
      1,
      t / TOAST_SLIDE,
      (TOAST_SECONDS - t) / TOAST_SLIDE,
    );
    const w = TOAST_W * scale;
    const h = TOAST_H * scale;
    const left = Math.round((ctx.canvas.width - w) / 2);
    const top = Math.round(
      (TOAST_TOP + (slide - 1) * (TOAST_H + TOAST_TOP)) * scale,
    );
    const pad = TOAST_PAD * scale;
    ctx.save();
    drawConfetti(ctx, t, left + w / 2, top + h, scale);
    ctx.fillStyle = "rgba(40, 18, 30, 0.92)";
    ctx.strokeStyle = "#f4cf4a";
    ctx.lineWidth = Math.max(1, scale * TOAST_BORDER);
    ctx.beginPath();
    ctx.roundRect(left, top, w, h, scale * TOAST_ROUND);
    ctx.fill();
    ctx.stroke();
    const icon = TOAST_ICON * scale;
    const badge = EFFECTS[BADGES[toast.id]];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      art.figures,
      badge[0] * SHEET_DENSITY,
      badge[1] * SHEET_DENSITY,
      badge[2] * SHEET_DENSITY,
      badge[3] * SHEET_DENSITY,
      left + pad,
      top + (h - icon) / 2,
      icon,
      icon,
    );
    const textX = left + pad * 2 + icon;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f4cf4a";
    ctx.font = `bold ${String(Math.round(TOAST_SMALL * scale))}px system-ui, sans-serif`;
    ctx.fillText(
      WM_TEXTS.achievementUnlocked,
      textX,
      top + h * TOAST_LINE_SMALL,
    );
    ctx.fillStyle = "#fffdf6";
    ctx.font = `bold ${String(Math.round(TOAST_BIG * scale))}px system-ui, sans-serif`;
    ctx.fillText(
      ACHIEVEMENT_TEXTS[toast.id].title,
      textX,
      top + h * TOAST_LINE_BIG,
      w - (textX - left) - pad,
    );
    ctx.restore();
  }
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- shape and fade of
   the ripples, the jump and the confetti, picked by eye */
/** The fish: rings on the water, and now and then a leap out of it. */
function drawFish(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  x: number,
  y: number,
): void {
  const fish = state.world.fish;
  for (let k = 0; k < 2; k += 1) {
    const phase = (state.time * RIPPLE_SPEED + k / 2) % 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${String(0.7 * (1 - phase))})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(
      snap(x),
      snap(y),
      2 + phase * RIPPLE_WIDE,
      (2 + phase * RIPPLE_WIDE) * 0.4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  if (fish.jump >= 0) {
    const t = fish.jump / FISH_JUMP;
    const rect = FISH_FRAMES[t < 0.5 ? 0 : 1];
    const lift = Math.sin(Math.PI * t) * FISH_HEIGHT;
    blit(
      ctx,
      art.world,
      rect,
      x - rect[2] / 2 + (t - 0.5) * 6,
      y - rect[3] - lift,
    );
  } else {
    // A dark shape under the surface.
    ctx.fillStyle = "rgba(20, 40, 70, 0.45)";
    ctx.beginPath();
    ctx.ellipse(
      snap(x + Math.sin(state.time * 1.3) * 2),
      snap(y),
      3,
      1.2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** Confetti bursting from the banner and fluttering down. */
function drawConfetti(
  ctx: CanvasRenderingContext2D,
  age: number,
  x: number,
  y: number,
  scale: number,
): void {
  if (age < CONFETTI_SECONDS) {
    const t = age / CONFETTI_SECONDS;
    for (let k = 0; k < CONFETTI; k += 1) {
      // A fixed random direction and speed per piece.
      const seed = Math.sin(k * 91.7) * 10000;
      const r = seed - Math.floor(seed);
      const angle = Math.PI * (0.1 + 0.8 * ((k + r) / CONFETTI));
      const speed = 40 + r * 50;
      const px = x + Math.cos(angle) * speed * age * scale * (k % 2 ? 1 : -1);
      const py =
        y + (-Math.sin(angle) * speed * age * 0.6 + 60 * age * age) * scale;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = CONFETTI_COLORS[k % CONFETTI_COLORS.length];
      const flip = Math.abs(Math.sin(age * 10 + k)) * 2 + 0.5;
      ctx.fillRect(px, py, scale * 1.5, scale * flip);
    }
    ctx.globalAlpha = 1;
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
