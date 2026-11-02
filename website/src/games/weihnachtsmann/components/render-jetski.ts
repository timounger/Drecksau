/**
 * Drawing the snow jetskis: each in the colour of its home, seen from the
 * side, the front or behind, its rider seated in it, a wobble after a bounce,
 * a bob on open water, a headlight at night - and the sign beside one that
 * waits for a rider.
 *
 * @module
 * @remarks
 * Every view comes in two pictures (`jetski-atlas.ts`): the whole jetski,
 * drawn just behind the rider, and its front part alone, drawn just in front
 * of the rider so the hull hides the legs. The rider is drawn lifted onto the
 * seat by {@link jetskiLift}.
 */
import {
  JETSKI_BUMP,
  jetskiDir,
  jetskiOf,
} from "@/games/weihnachtsmann/engine/jetski";
import { terrainUnder } from "@/games/weihnachtsmann/engine/map";
import { darkness } from "@/games/weihnachtsmann/engine/sky";
import type {
  Character,
  GameMap,
  GameState,
  Jetski,
} from "@/games/weihnachtsmann/engine/types";
import { JETSKI_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { JETSKI_ART } from "./jetski-atlas";
import type { GlowFn } from "./render-props";
import { sign } from "./render-town";
import type { SpriteRect } from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the
   pictures, sizes and speeds of the drawing, picked by eye */
/** How high the rider sits above the runners, map px. */
const SEAT = 6;

/** The whole jetski behind the rider, its front part over the rider. */
const BACK_DEPTH = 0.1;
const FRONT_DEPTH = 0.3;

/**
 * Where each picture sits on the jetski's point (the middle of its runners):
 * how far left and up its top left corner lies, map px; the side view looks
 * right, mirrored for left.
 */
const PLACES = {
  side: { left: 16, up: 17 },
  down: { left: 14, up: 22 },
  up: { left: 14, up: 20 },
} as const;

/** The shadow under it: half width and half height, side and end on. */
const SHADOW_SIDE = { rx: 17, ry: 3.5 } as const;
const SHADOW_END = { rx: 12, ry: 5 } as const;
const SHADOW = "rgba(70, 90, 140, 0.28)";

/** The wobble after a bounce: speed, radians per second, and size, map px. */
const WOBBLE_SPEED = 70;
const WOBBLE = 1.5;

/** The bob on open water: speed, radians per second, and size, map px. */
const BOB_SPEED = 3;
const BOB = 0.5;

/** The headlight: where it starts ahead of the middle, its spots and colour. */
const LAMP_AHEAD = 18;
const LAMP_HIGH = 6;
const BEAM: readonly (readonly [number, number, number])[] = [
  [0, 10, 0.8],
  [18, 16, 0.5],
  [38, 22, 0.35],
];
const LAMP_RGB = "255, 244, 200";

/** How near the steered character must be for the sign, map px. */
const SIGN_NEAR = 34;

/**
 * Where the sign hangs, map px from the jetski's point: below it, or - when
 * the character stands below - above it, so it covers nobody.
 */
const SIGN_BELOW = 8;
const SIGN_ABOVE = 44;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Adds every jetski on the map to what is drawn in depth order: the shadow
 * and the whole picture just behind its rider, the front part just in front.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 * @param items - what is drawn, sorted later
 */
export function collectJetskis(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  if (map.area === "outdoors") {
    for (const jet of state.world.jetskis) {
      const place = placeOf(state, map, jet);
      items.push({
        depth: jet.y + BACK_DEPTH,
        draw: () => {
          drawShadow(ctx, jet);
          blit(ctx, art.jetski, place.back, place.x, place.y, place.mirror);
        },
      });
      items.push({
        depth: jet.y + FRONT_DEPTH,
        draw: () => {
          blit(ctx, art.jetski, place.front, place.x, place.y, place.mirror);
        },
      });
    }
  }
}

/**
 * How high somebody on a jetski sits over the ground.
 *
 * @param state - the game
 * @param char - the character
 * @returns map px, 0 for anybody on foot
 */
export function jetskiLift(state: GameState, char: Character): number {
  return jetskiOf(state, char) === null ? 0 : SEAT;
}

/**
 * The headlights of the jetskis ridden, shining ahead at night.
 *
 * @param glow - draws one soft light
 * @param state - the game
 */
export function jetskiLights(glow: GlowFn, state: GameState): void {
  const dark = state.viewArea === "outdoors" ? darkness(state) : 0;
  if (dark > 0) {
    for (const jet of state.world.jetskis) {
      if (jet.rider >= 0) {
        const fx = Math.cos(jet.heading);
        const fy = Math.sin(jet.heading);
        for (const [ahead, radius, strength] of BEAM) {
          const reach = LAMP_AHEAD + ahead;
          glow(
            jet.x + fx * reach,
            jet.y - LAMP_HIGH + fy * reach,
            radius,
            LAMP_RGB,
            strength * dark,
          );
        }
      }
    }
  }
}

/**
 * The sign beside a jetski waiting for a rider, when the character steered
 * stands near on foot.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawJetskiSigns(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
): void {
  const char = state.chars[state.active];
  const show =
    state.fade === null &&
    state.overview === null &&
    state.viewArea === "outdoors" &&
    char.area === "outdoors" &&
    char.altitude < 1 &&
    char.bubble === null &&
    jetskiOf(state, char) === null;
  if (show) {
    for (const jet of state.world.jetskis) {
      if (
        jet.rider < 0 &&
        Math.hypot(jet.x - char.x, jet.y - char.y) < SIGN_NEAR
      ) {
        sign(
          ctx,
          JETSKI_TEXTS.name,
          JETSKI_TEXTS.board,
          (jet.x - cx) * scale,
          (jet.y + (char.y > jet.y ? -SIGN_ABOVE : SIGN_BELOW) - cy) * scale,
          scale,
        );
      }
    }
  }
}

/** Which pictures a jetski shows right now, where, and whether mirrored. */
function placeOf(
  state: GameState,
  map: GameMap,
  jet: Jetski,
): {
  back: SpriteRect;
  front: SpriteRect;
  x: number;
  y: number;
  mirror: boolean;
} {
  const pictures = JETSKI_ART[jet.home % JETSKI_ART.length];
  const dir = jetskiDir(jet);
  const mirror = dir === "left";
  let back = pictures.side;
  let front = pictures.sideFront;
  let place: { readonly left: number; readonly up: number } = PLACES.side;
  if (dir === "down") {
    back = pictures.down;
    front = pictures.downFront;
    place = PLACES.down;
  } else if (dir === "up") {
    back = pictures.up;
    front = pictures.upFront;
    place = PLACES.up;
  }
  const left = mirror ? back[2] - place.left : place.left;
  const wobble =
    jet.bump > 0
      ? Math.sin(state.time * WOBBLE_SPEED) * WOBBLE * (jet.bump / JETSKI_BUMP)
      : 0;
  const bob =
    terrainUnder(map, jet.x, jet.y - 1) === "water"
      ? Math.sin(state.time * BOB_SPEED + jet.home) * BOB
      : 0;
  return {
    back,
    front,
    x: jet.x - left + wobble,
    y: jet.y - place.up + snap(bob),
    mirror,
  };
}

/** The soft shadow under a jetski, long from the side, short end on. */
function drawShadow(ctx: CanvasRenderingContext2D, jet: Jetski): void {
  const dir = jetskiDir(jet);
  const size = dir === "left" || dir === "right" ? SHADOW_SIDE : SHADOW_END;
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.ellipse(
    snap(jet.x),
    snap(jet.y + 1),
    size.rx,
    size.ry,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}
