/**
 * Drawing the east land and the extras across the map: the carousel turning
 * with its horses and riders, the strings of lights over the market, the
 * sled under its rider, snowballs, the wild animals, the golden bells, the
 * errand's lost thing and its arrow, the ice curtain and the fox's hole, the
 * crystals of the ice cave and the decorated tree in the workshop - and the
 * speech of the animals, the errand and the sled clock in sharp text.
 *
 * @module
 * @remarks
 * Places on a picture are counted in map px from its bottom left corner, y
 * upwards as negative, as in `render-props.ts`.
 */
import { BELLS } from "@/games/weihnachtsmann/engine/east-data";
import {
  CAROUSEL,
  ISLAND,
  LIGHT_STRINGS,
  RINK,
  STALLS,
  TREE_STAND,
} from "@/games/weihnachtsmann/engine/east-data";
import { bellPoint, bellShows } from "@/games/weihnachtsmann/engine/bells";
import { curtainLook, holePoint } from "@/games/weihnachtsmann/engine/cave";
import {
  errandGoal,
  errandText,
  letterWaiting,
} from "@/games/weihnachtsmann/engine/errands";
import { TILE, footprint } from "@/games/weihnachtsmann/engine/map";
import {
  SEATS,
  carouselMiddle,
  seatPoint,
} from "@/games/weihnachtsmann/engine/market";
import {
  sledTenths,
  sledTime,
  sledding,
} from "@/games/weihnachtsmann/engine/sled";
import { darkness } from "@/games/weihnachtsmann/engine/sky";
import { snowballHeight } from "@/games/weihnachtsmann/engine/snowball";
import type {
  BigObjectKind,
  Character,
  Critter,
  GameMap,
  GameState,
  PlacedObject,
} from "@/games/weihnachtsmann/engine/types";
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { OUTDOOR, type OutdoorName } from "./outdoor-atlas";
import type { GlowFn } from "./render-props";
import type { SpriteRect } from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** Draws a speech bubble in sharp text over a point of the canvas. */
export type BubbleFn = (text: string, x: number, y: number) => void;
/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the
   pictures, sizes, speeds and colours of the drawing, picked by eye */
/** The horses of the carousel, by seat: two frames each. */
const HORSES: readonly (readonly [OutdoorName, OutdoorName])[] = [
  ["horseWhite0", "horseWhite1"],
  ["horseBrown0", "horseBrown1"],
];

/** How high the roof's fringe hangs over the footprint's bottom, map px. */
const ROOF_TOP = 100;

/** How high a rider sits above the horse's feet, and the horses' bob. */
const SADDLE = 9;
const HORSE_BOB = 1.5;

/** Where the bell hangs under the roof's front, above the footprint's bottom. */
const BELL_HANG = 54;

/** The light strings: how far they sag, the gap between bulbs, map px. */
const SAG = 7;
const BULB_GAP = 6;
const POLE_TOP = 37;

/** The bulbs' colours. */
const BULBS: readonly string[] = ["#ff4a4a", "#ffd84a", "#4ad86a", "#4aa8ff"];
const BULB_RGB: readonly string[] = [
  "255, 90, 80",
  "255, 216, 90",
  "90, 220, 120",
  "90, 170, 255",
];

/** Where the crystals of the ice cave catch the light, from their pictures. */
const FACETS: Readonly<
  Partial<Record<BigObjectKind, readonly (readonly [number, number])[]>>
> = {
  crystalBig: [
    [9, -30],
    [18, -36],
    [24, -20],
  ],
  crystalSmall: [[8, -18]],
  crystalViolet: [[7, -22]],
};

/** Where the lights on the decorated tree twinkle, from its picture's bottom left. */
const TREE_LIGHTS: readonly (readonly [number, number])[] = [
  [20, -60],
  [14, -42],
  [27, -36],
  [11, -24],
  [30, -20],
  [20, -30],
];

/** The errand arrow: its size and how far from the edge, map px. */
const ARROW = 5;
const ARROW_EDGE = 12;

/** Sharp text: size of the errand and clock lines, map px, and padding. */
const LINE_FONT = 5.5;
const LINE_PAD = 2.5;

/**
 * The picture of a big object of the east land right now: the mailbox with
 * its flag up, a target just hit, the tree stand with the decorated tree.
 *
 * @param state - the game
 * @param object - the object
 * @returns the picture's rectangle on the outdoor sheet, or null for others
 */
export function eastPicture(
  state: GameState,
  object: PlacedObject,
): SpriteRect | null {
  const east = state.world.east;
  let name: OutdoorName | null = null;
  switch (object.kind) {
    case "mailbox":
      name = letterWaiting(state) ? "mailboxFlag" : "mailbox";
      break;
    case "target":
      name = east.targetsHit.has(
        object.ty * state.maps.outdoors.cols + object.tx,
      )
        ? "targetHit"
        : "target";
      break;
    case "treeStand":
      name = east.xmasTree > 0 ? "xmasTree" : "treeStand";
      break;
    default:
      name = null;
  }
  return name === null ? null : OUTDOOR[name];
}

/**
 * What moves on a big picture of the east land: the ice curtain over the
 * cave's mouth, broken, growing back or whole.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 * @param kind - which picture
 * @param left - its left edge, map px
 * @param bottom - its bottom edge, map px
 */
export function drawEastProp(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  kind: BigObjectKind,
  left: number,
  bottom: number,
): void {
  if (kind === "waterfall") {
    const look = curtainLook(state);
    const curtain = OUTDOOR.curtain;
    const x = left + (OUTDOOR.waterfall[2] - curtain[2]) / 2;
    if (look === "closed") {
      blit(ctx, art.outdoor, curtain, x, bottom - curtain[3]);
    } else if (look === "thin") {
      blit(ctx, art.outdoor, OUTDOOR.curtainThin, x, bottom - curtain[3]);
    } else {
      const shards = OUTDOOR.shards;
      blit(
        ctx,
        art.outdoor,
        shards,
        left + (OUTDOOR.waterfall[2] - shards[2]) / 2,
        bottom - shards[3] / 2,
      );
    }
  }
}

/**
 * Adds the moving things of the east land to what is drawn in depth order.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 * @param items - what is drawn, sorted later
 */
export function collectEast(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  if (map.area === "outdoors") {
    collectCarousel(ctx, state, art, items);
    collectSled(ctx, state, art, items);
    collectSnowballs(ctx, state, items);
    for (const critter of state.world.east.critters) {
      items.push({
        depth: critter.altitude > 2 ? critter.y + map.rows * TILE : critter.y,
        draw: () => {
          drawCritter(ctx, state, art, critter);
        },
      });
    }
    collectGround(ctx, state, art, items);
  }
  if (map.area === "iceCave") {
    collectFacets(ctx, state, map, items);
  }
  collectBells(ctx, state, map, art, items);
}

/**
 * The strings of lights over the market, drawn over everybody.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 */
export function drawLightStrings(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  if (state.viewArea === "outdoors") {
    ctx.strokeStyle = "#3a2a2a";
    ctx.lineWidth = 0.5;
    LIGHT_STRINGS.forEach((string, index) => {
      const points = stringPoints(string);
      ctx.beginPath();
      points.forEach((point, k) => {
        if (k === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      points.forEach((point, k) => {
        const on = Math.floor(state.time * 2 + k + index) % 5 !== 0;
        ctx.fillStyle = on ? BULBS[(k + index) % BULBS.length] : "#5a4a4a";
        ctx.fillRect(snap(point.x - 0.5), snap(point.y), 1, 1.5);
      });
    });
  }
}

/**
 * The lights of the east land: booths, carousel, strings of lights, the
 * night bell, the ice lights over the lake at night, the crystals of the ice
 * cave and the decorated tree.
 *
 * @param glow - draws one soft light
 * @param state - the game
 */
export function eastLights(glow: GlowFn, state: GameState): void {
  const dark = darkness(state);
  if (state.viewArea === "outdoors") {
    for (const stall of STALLS) {
      glow(
        (stall.tx + 1.5) * TILE,
        (stall.ty + 2) * TILE - 14,
        22,
        "255, 190, 90",
        0.3,
      );
    }
    const middle = carouselMiddle();
    glow(middle.x, middle.y - 40, 44, "255, 214, 120", 0.22);
    if (dark > 0.2) {
      LIGHT_STRINGS.forEach((string, index) => {
        stringPoints(string).forEach((point, k) => {
          if ((k + index) % 3 === 0) {
            glow(point.x, point.y + 1, 7, BULB_RGB[(k + index) % 4], 0.35);
          }
        });
      });
    }
    if (dark > 0.5) {
      iceLights(glow, state);
    }
    const night = BELLS.find((bell) => bell.need === "night");
    if (night !== undefined && bellShows(state, night)) {
      const at = bellPoint(state, night);
      glow(at.x, at.y - 5, 14, "255, 220, 90", 0.45);
    }
  }
  if (state.viewArea === "iceCave") {
    for (const object of state.maps.iceCave.objects) {
      const size = footprint(object.kind);
      const pulse = 0.5 + Math.sin(state.time * 1.7 + object.tx) * 0.5;
      glow(
        (object.tx + size.cols / 2) * TILE,
        (object.ty + size.rows) * TILE - 16,
        30,
        object.kind === "crystalViolet" ? "190, 120, 255" : "120, 230, 255",
        0.18 + pulse * 0.2,
      );
    }
    // Reflections drifting over the icy floor.
    for (let k = 0; k < 4; k += 1) {
      glow(
        160 + Math.sin(state.time * 0.4 + k * 1.7) * 120,
        120 + Math.cos(state.time * 0.3 + k * 2.3) * 50,
        20,
        "200, 240, 255",
        0.16,
      );
    }
  }
  if (state.viewArea === "workshop" && state.world.east.xmasTree > 0) {
    const left = TREE_STAND.tx * TILE + TILE / 2 - OUTDOOR.xmasTree[2] / 2;
    const bottom = (TREE_STAND.ty + 1) * TILE;
    TREE_LIGHTS.forEach(([x, y], k) => {
      const on = Math.sin(state.time * 3 + k * 1.3) > -0.3;
      if (on) {
        glow(left + x, bottom + y, 6, BULB_RGB[k % 4], 0.5);
      }
    });
    glow(left + 20, bottom - 62, 12, "255, 230, 120", 0.5);
  }
}

/**
 * The errand's arrow: bobbing over the goal when it is in view, at the edge
 * of the picture pointing to it when not.
 *
 * @param ctx - the buffer, in map px, view corner at 0, 0
 * @param state - the game
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawErrandArrow(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cx: number,
  cy: number,
): void {
  const goal = errandGoal(state);
  const view = state.view;
  if (goal !== null && state.overview === null && state.fade === null) {
    let x = goal.x;
    let y = goal.y;
    const map = state.maps[state.viewArea];
    if (goal.area !== state.viewArea) {
      // Into the house the goal is in, or out of the room one is in.
      const door =
        state.viewArea === "outdoors"
          ? map.doors.find((candidate) => candidate.to === goal.area)
          : map.doors.at(0);
      x = door === undefined ? x : (door.tx + door.w / 2) * TILE;
      y = door === undefined ? y : (door.ty + 1) * TILE;
    }
    const sx = x - cx;
    const sy = y - cy;
    const bob = Math.sin(state.time * 6) * 2;
    if (sx > 0 && sx < view.w && sy > 0 && sy < view.h) {
      arrow(ctx, sx, sy - TILE * 2 + bob, Math.PI / 2);
    } else {
      const angle = Math.atan2(sy - view.h / 2, sx - view.w / 2);
      const ex = Math.max(
        ARROW_EDGE,
        Math.min(view.w - ARROW_EDGE, view.w / 2 + Math.cos(angle) * view.w),
      );
      const ey = Math.max(
        ARROW_EDGE,
        Math.min(view.h - ARROW_EDGE, view.h / 2 + Math.sin(angle) * view.h),
      );
      arrow(ctx, ex, ey, angle);
    }
  }
}

/**
 * The animals' speech, the errand and the sled's clock, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 * @param bubble - draws a speech bubble
 */
export function drawEastTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
  bubble: BubbleFn,
): void {
  if (state.viewArea === "outdoors" && state.overview === null) {
    for (const critter of state.world.east.critters) {
      if (critter.bubble !== null) {
        bubble(
          critter.bubble.text,
          (critter.x - cx) * scale,
          (critter.y - critter.altitude - 18 - cy) * scale,
        );
      }
    }
  }
  const lines: string[] = [];
  const errand = state.world.east.errand;
  if (errand !== null) {
    lines.push(`${EAST_TEXTS.errand}: ${errandText(errand)}`);
  }
  const run = sledTenths(state);
  if (run !== null) {
    const best = state.counts.sledBest;
    lines.push(
      `${EAST_TEXTS.sledTime}: ${sledTime(run)}${best > 0 ? ` - ${EAST_TEXTS.sledRecord} ${sledTime(best)}` : ""}`,
    );
  }
  if (state.overview === null) {
    lines.forEach((line, index) => {
      textLine(ctx, line, scale, index);
    });
  }
}

/**
 * How high a rider on the carousel sits over the ground.
 *
 * @param state - the game
 * @param char - the character
 * @returns map px, 0 for anybody not riding
 */
export function riderLift(state: GameState, char: Character): number {
  const who = state.chars.indexOf(char);
  const rider = state.world.east.riders.find(
    (candidate) => candidate.who === who,
  );
  return rider === undefined ? 0 : SADDLE + horseBob(state, rider.seat);
}

/** The carousel's horses, riders' bell, pole and roof. */
function collectCarousel(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  items: Drawable[],
): void {
  const middle = carouselMiddle();
  const bottom = (CAROUSEL.ty + footprint(CAROUSEL.kind).rows) * TILE;
  const roofTop = bottom - ROOF_TOP;
  for (let seat = 0; seat < SEATS; seat += 1) {
    const at = seatPoint(state, seat);
    const next = seatPoint(state, seat, 1 / 2);
    const frames = HORSES[seat % HORSES.length];
    const rect = OUTDOOR[frames[Math.floor(state.time * 4 + seat) % 2]];
    const lift = horseBob(state, seat);
    items.push({
      depth: at.y,
      draw: () => {
        const top = at.y - rect[3] + 2 - lift;
        ctx.fillStyle = "#e8b830";
        ctx.fillRect(
          snap(at.x - 0.5),
          snap(roofTop + OUTDOOR.carouselRoof[3] - 2),
          1,
          top - roofTop - OUTDOOR.carouselRoof[3] + 3,
        );
        blit(ctx, art.outdoor, rect, at.x - rect[2] / 2, top, next.x < at.x);
      },
    });
  }
  const pole = OUTDOOR.carouselPole;
  items.push({
    depth: middle.y,
    draw: () => {
      blit(ctx, art.outdoor, pole, middle.x - pole[2] / 2, middle.y - pole[3]);
    },
  });
  const roof = OUTDOOR.carouselRoof;
  items.push({
    depth: bottom + 1 / 2,
    draw: () => {
      blit(ctx, art.outdoor, roof, middle.x - roof[2] / 2, roofTop);
      const bell = BELLS.find((candidate) => candidate.need === "carousel");
      if (bell !== undefined && !state.progress.bells.has(bell.id)) {
        const rect = OUTDOOR.bell;
        const swing = Math.sin(state.time * 2) * 1;
        blit(
          ctx,
          art.outdoor,
          rect,
          middle.x - rect[2] / 2 + swing,
          bottom - BELL_HANG,
        );
      }
    },
  });
}

/** The sled under its rider. */
function collectSled(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  items: Drawable[],
): void {
  for (const char of state.chars) {
    if (char.area === "outdoors" && sledding(state, char)) {
      const rect = OUTDOOR.sled;
      items.push({
        depth: char.y + 1 / 2,
        draw: () => {
          blit(
            ctx,
            art.outdoor,
            rect,
            char.x - rect[2] / 2,
            char.y - rect[3] + 3,
          );
        },
      });
    }
  }
}

/** Snowballs in flight, each with its shadow. */
function collectSnowballs(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  items: Drawable[],
): void {
  for (const ball of state.world.east.snowballs) {
    const x = ball.x;
    const y = ball.y;
    const high = snowballHeight(ball.age);
    items.push({
      depth: y,
      draw: () => {
        ctx.fillStyle = "rgba(70, 90, 140, 0.25)";
        ctx.fillRect(snap(x - 1), snap(y - 1), 2, 1);
        ctx.fillStyle = "#9ab0d0";
        ctx.beginPath();
        ctx.arc(x, y - high, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x - 0.4, y - high - 0.4, 1.4, 0, Math.PI * 2);
        ctx.fill();
      },
    });
  }
}

/** One wild animal: hopping, waddling, perched or flying. */
function drawCritter(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  critter: Critter,
): void {
  const step = Math.floor(state.time * (critter.kind === "hare" ? 6 : 4));
  let name: OutdoorName;
  switch (critter.kind) {
    case "hare":
      name = critter.moving && step % 2 === 0 ? "hareHop" : "hareSit";
      break;
    case "penguin":
      name = critter.moving && step % 2 === 0 ? "penguin1" : "penguin0";
      break;
    case "owl":
      name =
        critter.altitude > 2
          ? step % 2 === 0
            ? "owlFly0"
            : "owlFly1"
          : "owlSit";
      break;
  }
  const rect = OUTDOOR[name];
  if (critter.altitude <= 2) {
    ctx.fillStyle = "rgba(70, 90, 140, 0.25)";
    ctx.beginPath();
    ctx.ellipse(critter.x, critter.y - 1, rect[2] / 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  blit(
    ctx,
    art.outdoor,
    rect,
    critter.x - rect[2] / 2,
    critter.y - rect[3] - critter.altitude,
    !critter.right,
  );
}

/** What lies flat on the snow: the fox's hole and the errand's lost thing. */
function collectGround(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  items: Drawable[],
): void {
  if (state.world.east.hole > 0) {
    const at = holePoint();
    const rect = OUTDOOR.foxHole;
    items.push({
      depth: at.y - TILE,
      draw: () => {
        blit(ctx, art.outdoor, rect, at.x - rect[2] / 2, at.y - rect[3] - 1);
      },
    });
  }
  const errand = state.world.east.errand;
  if (errand?.kind === "deliver" && !errand.picked) {
    const names: readonly OutdoorName[] = ["mitten", "scarf", "glasses"];
    const rect = OUTDOOR[names[errand.item % names.length]];
    const bob = Math.abs(Math.sin(state.time * 3)) * 1.5;
    items.push({
      depth: errand.y,
      draw: () => {
        blit(
          ctx,
          art.outdoor,
          rect,
          errand.x - rect[2] / 2,
          errand.y - rect[3] - bob,
        );
      },
    });
  }
}

/** The golden bells still to be found in this place. */
function collectBells(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  const rect = OUTDOOR.bell;
  for (const bell of BELLS) {
    if (bell.area === map.area && bellShows(state, bell)) {
      const at = bellPoint(state, bell);
      const inTree = bell.need === "fir" && state.world.east.bellDown <= 0;
      items.push({
        depth: inTree ? (bell.ty + 1) * TILE + 1 : at.y,
        draw: () => {
          const swing = Math.sin(state.time * 2.5 + bell.tx) * 0.8;
          blit(
            ctx,
            art.outdoor,
            rect,
            at.x - rect[2] / 2 + swing,
            at.y - rect[3],
          );
          if (Math.floor(state.time * 1.5 + bell.ty) % 4 === 0) {
            ctx.fillStyle = "#fffbe0";
            ctx.fillRect(snap(at.x + 1), snap(at.y - rect[3] + 2), 1, 1);
            ctx.fillRect(snap(at.x + 0.5), snap(at.y - rect[3] + 2.5), 2, 0.5);
          }
        },
      });
    }
  }
}

/** Sparkles on the crystals of the ice cave. */
function collectFacets(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  items: Drawable[],
): void {
  for (const object of map.objects) {
    const facets = FACETS[object.kind] ?? [];
    const size = footprint(object.kind);
    const left = object.tx * TILE;
    const bottom = (object.ty + size.rows) * TILE;
    facets.forEach(([fx, fy], k) => {
      const t = Math.sin(state.time * 3.1 + k * 2.1 + object.tx * 0.7);
      if (t > 1 / 2) {
        items.push({
          depth: bottom + 1,
          draw: () => {
            const r = (t - 1 / 2) * 2 * 2;
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillRect(snap(left + fx - r), snap(bottom + fy), r * 2, 0.5);
            ctx.fillRect(snap(left + fx), snap(bottom + fy - r), 0.5, r * 2);
          },
        });
      }
    });
  }
}

/** Ice lights drifting over the lake at night. */
function iceLights(glow: GlowFn, state: GameState): void {
  for (let k = 0; k < 7; k += 1) {
    const x =
      (ISLAND.x + Math.sin(state.time * 0.23 + k * 2.4) * (RINK.w / 2 - 2)) *
      TILE;
    const y =
      (ISLAND.y + Math.cos(state.time * 0.19 + k * 1.9) * (RINK.h / 2 - 3)) *
        TILE -
      10 -
      Math.sin(state.time * 1.3 + k) * 3;
    glow(x, y, 8, "170, 240, 255", 0.5);
    glow(x, y, 2, "255, 255, 255", 0.9);
  }
}

/** The points of a string of lights, sagging between its poles. */
function stringPoints(
  string: readonly [number, number, number, number],
): { x: number; y: number }[] {
  const [ax, ay, bx, by] = string;
  const x0 = (ax + 1 / 2) * TILE;
  const y0 = (ay + 1) * TILE - POLE_TOP;
  const x1 = (bx + 1 / 2) * TILE;
  const y1 = (by + 1) * TILE - POLE_TOP;
  const length = Math.hypot(x1 - x0, y1 - y0);
  const count = Math.max(2, Math.round(length / BULB_GAP));
  const points: { x: number; y: number }[] = [];
  for (let k = 0; k <= count; k += 1) {
    const t = k / count;
    points.push({
      x: x0 + (x1 - x0) * t,
      y: y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * SAG,
    });
  }
  return points;
}

/** How far a horse bobs up right now, map px. */
function horseBob(state: GameState, seat: number): number {
  return (Math.sin(state.time * 4 + seat * 1.6) + 1) * HORSE_BOB;
}

/** A golden arrow pointing along an angle, its tip at a point. */
function arrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#2a1a24";
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(-ARROW * 2 - 1, -ARROW - 1);
  ctx.lineTo(-ARROW * 2 - 1, ARROW + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffd84a";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-ARROW * 2, -ARROW);
  ctx.lineTo(-ARROW * 2, ARROW);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** One line of sharp text on a dark pill at the top of the picture. */
function textLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  scale: number,
  index: number,
): void {
  ctx.save();
  ctx.font = `bold ${String(Math.round(LINE_FONT * scale))}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const width = ctx.measureText(text).width + LINE_PAD * 2 * scale;
  const height = (LINE_FONT + LINE_PAD * 2) * scale;
  const x = ctx.canvas.width / 2;
  const y = (LINE_PAD + index * (LINE_FONT + LINE_PAD * 3)) * scale;
  ctx.fillStyle = "rgba(20, 14, 34, 0.78)";
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = "#ffe9a8";
  ctx.fillText(text, x, y + height / 2);
  ctx.restore();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
