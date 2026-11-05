/**
 * Drawing the new places: the railway's track, platforms, barriers and the
 * little train with its riders, the hockey puck, the snow castle growing on
 * its site, the balloon with its rider and shadow, the cable with its
 * gondola, the skis under a skier, the lighthouse's sweeping beam at night,
 * the secret on the gift store's roof seen from the balloon - and the signs
 * and lines of text in sharp letters.
 *
 * @module
 * @remarks
 * Everything standing on the ground goes into the depth-sorted list like the
 * rest of the map; the cable, the gondola and the roof's secret are drawn
 * over everything, high in the air. The track and the platforms lie flat on
 * the ground and are drawn right after it, from plain shapes - cheap enough
 * for every frame.
 */
import {
  inBalloon,
  inGondola,
  skiing,
  trainSeat,
  vehicleOf,
} from "@/games/weihnachtsmann/engine/aboard";
import {
  BASKET_FLOOR,
  HIGH,
  burnerFlame,
} from "@/games/weihnachtsmann/engine/balloon";
import {
  gondolaPoint,
  gondolaShare,
  skiTenths,
} from "@/games/weihnachtsmann/engine/cablecar";
import {
  CASTLE_BLOCKS,
  WALL_BLOCKS,
  plotPoint,
} from "@/games/weihnachtsmann/engine/castle";
import { carries } from "@/games/weihnachtsmann/engine/carry";
import { lampPoint } from "@/games/weihnachtsmann/engine/lighthouse";
import { TILE, footprint } from "@/games/weihnachtsmann/engine/map";
import {
  CASTLE_SITE,
  CROSSINGS,
  PLACE_SIGNS,
  ROOF_SECRET,
  STATIONS,
  SUMMIT_SIGNS,
  type Crossing,
  type PlaceSign,
} from "@/games/weihnachtsmann/engine/places-data";
import {
  TRACK_CELLS,
  barrierDown,
  nextStop,
  platformAt,
  trainCars,
  type TrainCar,
} from "@/games/weihnachtsmann/engine/railway";
import { darkness } from "@/games/weihnachtsmann/engine/sky";
import type {
  BigObjectKind,
  Character,
  GameMap,
  GameState,
} from "@/games/weihnachtsmann/engine/types";
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { PLACE_ART, type PlaceArtName } from "./places-atlas";
import type { GlowFn } from "./render-props";
import { sign } from "./render-town";
import type { SpriteRect } from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** The size of the visible part of the map, map px. */
type View = { readonly w: number; readonly h: number };

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the
   pictures, sizes, speeds and colours of the drawing, picked by eye */
/** Rails, sleepers and the planks of a crossing. */
const RAIL = "#7a8294";
const RAIL_HI = "#c4ccd8";
const SLEEPER = "#7a5a3c";
const BED = "rgba(120, 110, 120, 0.22)";
const PLANK = "#a8885a";

/** Where the two rails lie across a cell, map px from its edge. */
const RAIL_A = 5;
const RAIL_B = 11;

/** Sleepers: every how many px, how wide. */
const SLEEPER_EVERY = 4;
const SLEEPER_W = 2;

/** The platforms' stone and edge. */
const PLATFORM = "#b8b4c4";
const PLATFORM_EDGE = "#f0e8a8";
const PLATFORM_DARK = "#8a869a";

/** How far below the track's line the cars stand, and the riders' seat height. */
const CAR_DROP = 6;
export const SEAT_LIFT = 3;

/** The car's back picture just behind the riders, its front just before. */
const BACK_DEPTH = 0.1;
const RIDER_DEPTH = 0.2;
const FRONT_DEPTH = 0.3;

/** The barriers: post height, arm reach and stripe length. */
const POST_H = 12;
const ARM_STRIPE = 3;

/** The puck's look. */
const PUCK_RX = 2.5;
const PUCK_RY = 1.3;

/** How near the steered character must be for a platform's sign, map px. */
const PLATFORM_NEAR = 30;

/** Where a sign hangs below its point, map px. */
const SIGN_BELOW = 4;

/** The lighthouse beam: reach, half width, strength and colour. */
const BEAM_REACH = 340;
const BEAM_HALF = 0.13;
const BEAM_STRENGTH = 0.42;
const BEAM_RGB = "255, 246, 200";

/** The balloon: how far the envelope floats over the basket, and the shadow. */
const ENVELOPE_GAP = 16;
const SHADOW = "rgba(70, 90, 140, 0.24)";

/** Snowfall over the roof's secret fades in between these heights, map px. */
const SECRET_FADE = 20;

/** The cable: how many pieces it is drawn of, and its colour. */
const CABLE_STEPS = 24;
const CABLE = "#3a3442";

/** The skis under a skier. */
const SKI_LONG = 9;
const SKI_APART = 3;
const SKI = "#e8343a";

/** The windows that glow at night, map px from the left and bottom of each picture. */
const WINDOWS: Readonly<
  Partial<Record<BigObjectKind, readonly (readonly [number, number])[]>>
> = {
  stationHouse: [
    [12, 20],
    [40, 20],
    [26, 18],
  ],
  valleyStation: [
    [17, 23],
    [64, 23],
    [40, 18],
  ],
  summitStation: [
    [16, 18],
    [80, 18],
  ],
};

/** The widths of the pictures with windows. */
const WINDOW_WIDTHS: Readonly<Partial<Record<BigObjectKind, number>>> = {
  stationHouse: PLACE_ART.stationHouse[2],
  valleyStation: PLACE_ART.valleyStation[2],
  summitStation: PLACE_ART.summitStation[2],
};

/**
 * Lays the track, the planks of the crossings and the platforms on the
 * ground, under everybody.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 * @param view - size of the view, map px
 */
export function drawTrack(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  cx: number,
  cy: number,
  view: View,
): void {
  if (map.area === "outdoors") {
    for (const station of STATIONS) {
      const box = station.platform;
      if (
        inView(
          box.tx * TILE,
          box.ty * TILE,
          box.w * TILE,
          box.h * TILE,
          cx,
          cy,
          view,
        )
      ) {
        drawPlatform(
          ctx,
          box.tx * TILE,
          box.ty * TILE,
          box.w * TILE,
          box.h * TILE,
        );
      }
    }
    for (const cell of TRACK_CELLS) {
      const x = cell.tx * TILE;
      const y = cell.ty * TILE;
      if (inView(x, y, TILE, TILE, cx, cy, view)) {
        const path = map.ground[cell.ty * map.cols + cell.tx] === "path";
        drawRails(ctx, x, y, cell.bits, path);
      }
    }
  }
}

/**
 * The shadows of the balloon and the gondola on the snow.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 */
export function drawPlaceShadows(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
): void {
  if (map.area === "outdoors") {
    const balloon = state.world.places.balloon;
    const size = Math.max(6, 16 - balloon.altitude / 10);
    ctx.fillStyle = SHADOW;
    ctx.beginPath();
    ctx.ellipse(
      snap(balloon.x),
      snap(balloon.y - 1),
      size,
      size * 0.4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    const share = gondolaShare(state);
    if (share > 0.04 && share < 0.96) {
      const at = gondolaPoint(share);
      ctx.beginPath();
      ctx.ellipse(snap(at.x), snap(at.y), 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Adds the moving things of the new places to what is drawn in depth order.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 * @param items - what is drawn, sorted later
 */
export function collectPlaces(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  const sky = map.rows * TILE;
  if (map.area === "outdoors") {
    for (const car of trainCars(state)) {
      collectCar(ctx, art, car, items);
    }
    for (const crossing of CROSSINGS) {
      collectBarriers(ctx, state, crossing, items);
    }
    const puck = state.world.places.hockey.puck;
    items.push({
      depth: puck.y,
      draw: () => {
        drawPuck(ctx, puck.x, puck.y);
      },
    });
    collectBalloon(ctx, state, art, sky, items);
  }
  for (const char of state.chars) {
    if (char.area === map.area && skiing(state, char)) {
      items.push({
        depth: char.y - BACK_DEPTH,
        draw: () => {
          drawSkis(ctx, char);
        },
      });
    }
  }
}

/**
 * What moves on a big picture of the new places: the castle's blocks,
 * towers and flag on its site, and the next plot marked.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 * @param kind - which picture
 * @param left - its left edge, map px
 * @param bottom - its bottom edge, map px
 */
export function drawPlaceProp(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  kind: BigObjectKind,
  left: number,
  bottom: number,
): void {
  if (kind === "castleSite") {
    drawCastle(ctx, art, state, left, bottom);
  }
}

/**
 * The cable with the gondola, and the secret on the roof for the one in the
 * balloon - over everything.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 */
export function drawAerial(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  if (state.viewArea === "outdoors") {
    drawCable(ctx);
    const at = gondolaPoint(gondolaShare(state));
    const rect = PLACE_ART.gondola;
    blit(ctx, art.places, rect, at.x - rect[2] / 2, at.y - at.altitude - 2);
    drawRoofSecret(ctx, state);
  }
}

/**
 * How high somebody on the train sits over the track.
 *
 * @param state - the game
 * @param char - the character
 * @returns map px, 0 for anybody not riding
 */
export function placeLift(state: GameState, char: Character): number {
  return trainSeat(state, char) === null ? 0 : SEAT_LIFT;
}

/**
 * The depth a train rider is drawn at: between its wagon's back and front.
 *
 * @param state - the game
 * @param char - the character
 * @returns the depth, or null for anybody not on the train
 */
export function riderDepth(state: GameState, char: Character): number | null {
  const seat = trainSeat(state, char);
  let depth: number | null = null;
  if (inBalloon(state, char)) {
    // In the basket: between the balloon and the basket's front, up high.
    const balloon = state.world.places.balloon;
    depth = balloon.y + state.maps.outdoors.rows * TILE + RIDER_DEPTH;
  } else if (seat !== null) {
    const wagon = Math.floor(seat.seat / 2);
    const car = trainCars(state).find((candidate) => candidate.wagon === wagon);
    depth = car === undefined ? null : car.y + RIDER_DEPTH;
  }
  return depth;
}

/**
 * Whether somebody is out of sight: hidden in the gondola's cabin.
 *
 * @param state - the game
 * @param char - the character
 * @returns true while not to be drawn
 */
export function hiddenAboard(state: GameState, char: Character): boolean {
  return inGondola(state, char);
}

/**
 * The lights of the new places at night: windows, the lighthouse's lamp, the
 * engine's headlamp and the balloon's burner.
 *
 * @param glow - draws one soft light
 * @param state - the game
 */
export function placeLights(glow: GlowFn, state: GameState): void {
  const map = state.maps[state.viewArea];
  for (const object of map.objects) {
    const windows = WINDOWS[object.kind];
    if (windows !== undefined) {
      const corner = pictureCorner(object.kind, object.tx, object.ty);
      for (const [x, y] of windows) {
        glow(corner.x + x, corner.y - y, 16, "255, 200, 110", 0.3);
      }
    }
  }
  if (state.viewArea === "outdoors") {
    const light = state.world.places.lighthouse;
    if (light.on > 0) {
      const lamp = lampPoint();
      glow(lamp.x, lamp.y, 26, "255, 240, 170", 0.75);
    }
    const engine = trainCars(state)[0];
    const [fx, fy] = ahead(engine.dir);
    glow(engine.x + fx * 20, engine.y - 4 + fy * 20, 18, "255, 244, 200", 0.45);
    const flame = burnerFlame(state);
    if (flame > 0) {
      const balloon = state.world.places.balloon;
      glow(
        balloon.x,
        balloon.y - balloon.altitude - 20,
        24,
        "255, 160, 60",
        flame * 0.8,
      );
    }
  }
}

/**
 * The lighthouse's beam sweeping round at night, over the night's dark.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 */
export function drawBeam(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const light = state.world.places.lighthouse;
  const dark = state.viewArea === "outdoors" ? darkness(state) : 0;
  if (light.on > 0 && dark > 0) {
    const lamp = lampPoint();
    const gradient = ctx.createRadialGradient(
      lamp.x,
      lamp.y,
      0,
      lamp.x,
      lamp.y,
      BEAM_REACH,
    );
    const strength = BEAM_STRENGTH * dark;
    gradient.addColorStop(0, `rgba(${BEAM_RGB}, ${String(strength)})`);
    gradient.addColorStop(0.6, `rgba(${BEAM_RGB}, ${String(strength * 0.45)})`);
    gradient.addColorStop(1, `rgba(${BEAM_RGB}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(lamp.x, lamp.y);
    // The beam lies flat over the land: squeezed from above.
    const squeeze = 0.62;
    for (const side of [-BEAM_HALF, 0, BEAM_HALF]) {
      const angle = light.angle + side;
      ctx.lineTo(
        lamp.x + Math.cos(angle) * BEAM_REACH,
        lamp.y + Math.sin(angle) * BEAM_REACH * squeeze,
      );
    }
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * The signs at the new places and on the platforms, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawPlaceSigns(
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
    char.area === state.viewArea &&
    char.altitude < 1 &&
    char.bubble === null &&
    vehicleOf(state, char) === null;
  if (show) {
    const signs: readonly PlaceSign[] =
      char.area === "summit"
        ? SUMMIT_SIGNS
        : char.area === "outdoors"
          ? PLACE_SIGNS
          : [];
    for (const place of signs) {
      const x = place.x * TILE;
      const y = place.y * TILE;
      if (Math.hypot(char.x - x, char.y - y) < place.near * TILE) {
        const [name, hint] = PLACES_TEXTS.signs[place.id];
        sign(
          ctx,
          name,
          hint,
          (x - cx) * scale,
          (y + SIGN_BELOW - cy) * scale,
          scale,
        );
      }
    }
    if (char.area === "outdoors") {
      platformSign(ctx, state, char, scale, cx, cy);
      balloonSign(ctx, state, char, scale, cx, cy);
    }
  }
}

/**
 * The lines of text at the top for the new places: the hockey score, the ski
 * clock, the train's next stop, the balloon's keys, the castle's blocks.
 *
 * @param state - the game
 * @returns the lines, perhaps none
 */
export function placeLines(state: GameState): string[] {
  const lines: string[] = [];
  const char = state.chars[state.active];
  const match = state.world.places.hockey.match;
  if (match !== null) {
    lines.push(
      PLACES_TEXTS.hockeyScore
        .replace("{a}", String(match.score[0]))
        .replace("{b}", String(match.score[1])),
    );
  }
  const run = skiTenths(state);
  if (run !== null) {
    const best = state.counts.skiBest;
    lines.push(
      `${PLACES_TEXTS.skiTime}: ${seconds(run)}${best > 0 ? ` - ${PLACES_TEXTS.skiRecord} ${seconds(best)}` : ""}`,
    );
  }
  const seat = trainSeat(state, char);
  if (seat !== null) {
    const train = state.world.places.train;
    const name = PLACES_TEXTS.stationNames[STATIONS[nextStop(state)].id];
    const text =
      train.stop >= 0 ? PLACES_TEXTS.trainWaiting : PLACES_TEXTS.trainNext;
    lines.push(
      `${text.replace("{name}", name)}${seat.alight ? ` - ${PLACES_TEXTS.trainGettingOff}` : ""}`,
    );
  }
  if (inBalloon(state, char)) {
    lines.push(PLACES_TEXTS.balloonLine);
  }
  const castle = state.world.places.castle;
  if (
    carries(char, "snowBlock") ||
    (castle.blocks > 0 && !castle.flag && nearCastle(char))
  ) {
    lines.push(PLACES_TEXTS.castleCount.replace("{n}", String(castle.blocks)));
  }
  return lines;
}

/** Whether a box of map px reaches into the view. */
function inView(
  x: number,
  y: number,
  w: number,
  h: number,
  cx: number,
  cy: number,
  view: View,
): boolean {
  return x + w > cx && x < cx + view.w && y + h > cy && y < cy + view.h;
}

/** A platform: grey stone with a yellow edge towards the track. */
function drawPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = PLATFORM_DARK;
  ctx.fillRect(x + 1, y + 2, w - 2, h - 2);
  ctx.fillStyle = PLATFORM;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 3);
  ctx.fillStyle = PLATFORM_DARK;
  for (let k = x + 4; k < x + w - 2; k += 6) {
    ctx.fillRect(k, y + 1, 0.5, h - 3);
  }
  ctx.fillStyle = PLATFORM_EDGE;
  if (w > h) {
    ctx.fillRect(x + 1, y + 1, w - 2, 1);
  } else {
    ctx.fillRect(x + 1, y + 1, 1, h - 3);
  }
}

/** One cell of track: half a track towards each neighbour it joins. */
function drawRails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bits: number,
  path: boolean,
): void {
  const half = TILE / 2;
  // Pieces from the middle to an edge: up, right, down, left.
  const pieces: readonly (readonly [
    number,
    number,
    number,
    number,
    boolean,
  ])[] = [
    [x, y, TILE, half, true],
    [x + half, y, half, TILE, false],
    [x, y + half, TILE, half, true],
    [x, y, half, TILE, false],
  ];
  ctx.fillStyle = path ? PLANK : BED;
  pieces.forEach(([px, py, pw, ph, upright], index) => {
    if ((bits & (1 << index)) !== 0) {
      const bx = upright ? x + RAIL_A - 2 : px;
      const by = upright ? py : y + RAIL_A - 2;
      ctx.fillRect(
        bx,
        by,
        upright ? RAIL_B - RAIL_A + 5 : pw,
        upright ? ph : RAIL_B - RAIL_A + 5,
      );
    }
  });
  pieces.forEach(([px, py, pw, ph, upright], index) => {
    if ((bits & (1 << index)) !== 0) {
      ctx.fillStyle = SLEEPER;
      if (upright) {
        for (let k = py; k < py + ph; k += SLEEPER_EVERY) {
          ctx.fillRect(x + RAIL_A - 2, k, RAIL_B - RAIL_A + 5, SLEEPER_W / 2);
        }
      } else {
        for (let k = px; k < px + pw; k += SLEEPER_EVERY) {
          ctx.fillRect(k, y + RAIL_A - 2, SLEEPER_W / 2, RAIL_B - RAIL_A + 5);
        }
      }
    }
  });
  pieces.forEach(([px, py, pw, ph, upright], index) => {
    if ((bits & (1 << index)) !== 0) {
      for (const rail of [RAIL_A, RAIL_B]) {
        ctx.fillStyle = RAIL;
        if (upright) {
          ctx.fillRect(x + rail, py, 1, ph);
          ctx.fillStyle = RAIL_HI;
          ctx.fillRect(x + rail, py, 0.5, ph);
        } else {
          ctx.fillRect(px, y + rail, pw, 1);
          ctx.fillStyle = RAIL_HI;
          ctx.fillRect(px, y + rail, pw, 0.5);
        }
      }
    }
  });
}

/** One car of the train: its back picture behind the riders, its front before. */
function collectCar(
  ctx: CanvasRenderingContext2D,
  art: Art,
  car: TrainCar,
  items: Drawable[],
): void {
  const back = carArt(car, false);
  const front = car.engine ? null : carArt(car, true);
  const mirror = car.dir === "left";
  const x = car.x - back[2] / 2;
  const y = car.y + CAR_DROP - back[3];
  items.push({
    depth: car.y + BACK_DEPTH,
    draw: () => {
      blit(ctx, art.places, back, x, y, mirror);
    },
  });
  if (front !== null) {
    items.push({
      depth: car.y + FRONT_DEPTH,
      draw: () => {
        blit(ctx, art.places, front, x, y, mirror);
      },
    });
  }
}

/** The picture of a car for the way it goes. */
function carArt(car: TrainCar, front: boolean): SpriteRect {
  let name: PlaceArtName;
  if (car.engine) {
    name =
      car.dir === "down"
        ? "engineDown"
        : car.dir === "up"
          ? "engineUp"
          : "engineSide";
  } else {
    const view =
      car.dir === "down"
        ? "wagonDown"
        : car.dir === "up"
          ? "wagonUp"
          : "wagonSide";
    name = front ? (`${view}Front` as PlaceArtName) : view;
  }
  return PLACE_ART[name];
}

/** The two barriers of a crossing, down while the train is near. */
function collectBarriers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  crossing: Crossing,
  items: Drawable[],
): void {
  const down = barrierDown(state, crossing);
  const blink = down && Math.floor(state.time * 3) % 2 === 0;
  // Posts stand on the path's edge, either side of the track.
  const posts: readonly (readonly [number, number])[] = crossing.across
    ? [
        [crossing.x - 1.4, crossing.y - 1.05],
        [crossing.x + 1.4, crossing.y + 1.05],
      ]
    : [
        [crossing.x - 1.05, crossing.y - 1.4],
        [crossing.x + 1.05, crossing.y + 1.4],
      ];
  posts.forEach(([px, py], index) => {
    const x = px * TILE;
    const y = py * TILE;
    items.push({
      depth: y,
      draw: () => {
        drawBarrier(ctx, x, y, crossing.across, index === 0, down, blink);
      },
    });
  });
}

/** One barrier: a post with its lamp, the striped arm across the path or raised. */
function drawBarrier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  across: boolean,
  first: boolean,
  down: boolean,
  blink: boolean,
): void {
  ctx.fillStyle = "#4a4a5a";
  ctx.fillRect(snap(x - 1), snap(y - POST_H), 2, POST_H);
  ctx.fillStyle = blink ? "#ff3a3a" : "#7a2a2a";
  ctx.fillRect(snap(x - 1.5), snap(y - POST_H - 2), 3, 2);
  const reach = 2 * TILE + 2;
  const top = y - POST_H + 3;
  if (down) {
    // Lying across the path: down the picture, or across it.
    const sx = across ? 0 : first ? 1 : -1;
    const sy = across ? (first ? 1 : -1) : 0;
    for (let k = 0; k < reach; k += ARM_STRIPE) {
      ctx.fillStyle =
        Math.floor(k / ARM_STRIPE) % 2 === 0 ? "#e8343a" : "#ffffff";
      const len = Math.min(ARM_STRIPE, reach - k);
      ctx.fillRect(
        snap(x + sx * k - (sx < 0 ? len : 0) - (across ? 0.75 : 0)),
        snap(top + sy * k - (sy < 0 ? len : 0) - (across ? 0 : 0.75)),
        across ? 1.5 : len,
        across ? len : 1.5,
      );
    }
  } else {
    for (let k = 0; k < reach; k += ARM_STRIPE) {
      ctx.fillStyle =
        Math.floor(k / ARM_STRIPE) % 2 === 0 ? "#e8343a" : "#ffffff";
      ctx.fillRect(snap(x - 0.75), snap(top - k - ARM_STRIPE), 1.5, ARM_STRIPE);
    }
  }
}

/** The puck: a little black disc with a glint. */
function drawPuck(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "rgba(70, 90, 140, 0.3)";
  ctx.beginPath();
  ctx.ellipse(
    snap(x),
    snap(y + 0.5),
    PUCK_RX + 0.5,
    PUCK_RY + 0.3,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = "#16141c";
  ctx.beginPath();
  ctx.ellipse(snap(x), snap(y - 0.5), PUCK_RX, PUCK_RY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a5a6a";
  ctx.fillRect(snap(x - 1), snap(y - 1.5), 1, 0.5);
}

/** The balloon: envelope and basket behind its rider, the basket's front before. */
function collectBalloon(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  sky: number,
  items: Drawable[],
): void {
  const balloon = state.world.places.balloon;
  const aloft = balloon.rider >= 0 || balloon.altitude + BASKET_FLOOR > 1;
  const depth = balloon.y + (aloft ? sky : 0);
  const basket = PLACE_ART.basket;
  const envelope = PLACE_ART.envelope;
  const x = balloon.x - basket[2] / 2;
  const y = balloon.y - balloon.altitude - basket[3];
  items.push({
    depth: depth + BACK_DEPTH,
    draw: () => {
      blit(
        ctx,
        art.places,
        envelope,
        balloon.x - envelope[2] / 2,
        y - envelope[3] - ENVELOPE_GAP,
      );
      drawRopes(ctx, balloon.x, y);
      drawFlame(ctx, state, balloon.x, y - ENVELOPE_GAP);
      blit(ctx, art.places, basket, x, y);
    },
  });
  items.push({
    depth: depth + FRONT_DEPTH,
    draw: () => {
      blit(ctx, art.places, PLACE_ART.basketFront, x, y);
    },
  });
}

/** The ropes from the envelope's mouth down to the basket's corners. */
function drawRopes(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
): void {
  ctx.strokeStyle = "#5a4a3a";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(x + side * 6, top - ENVELOPE_GAP);
    ctx.lineTo(x + side * 9, top + 1);
  }
  ctx.stroke();
}

/** The burner's flame in the envelope's mouth. */
function drawFlame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  top: number,
): void {
  const flame = burnerFlame(state);
  if (flame > 0) {
    const tall = 4 + flame * 6 + Math.sin(state.time * 40) * 1.5;
    ctx.fillStyle = "#ffb43a";
    ctx.beginPath();
    ctx.moveTo(x - 2.5, top - 2);
    ctx.lineTo(x, top - 2 - tall);
    ctx.lineTo(x + 2.5, top - 2);
    ctx.fill();
    ctx.fillStyle = "#fff2a0";
    ctx.fillRect(snap(x - 0.5), snap(top - 2 - tall / 2), 1, tall / 2);
  }
}

/** The castle on its site: as many blocks as are set, the flag, the next plot. */
function drawCastle(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  left: number,
  bottom: number,
): void {
  const castle = state.world.places.castle;
  const lift = 4;
  const order = [...Array(castle.blocks).keys()].sort(
    (a, b) => plotPoint(a).y - plotPoint(b).y || a - b,
  );
  for (const index of order) {
    const at = plotPoint(index);
    let rect = PLACE_ART.wallPiece;
    if (index >= WALL_BLOCKS) {
      rect =
        index >= WALL_BLOCKS + 2 ? PLACE_ART.towerHigh : PLACE_ART.towerLow;
    }
    blit(ctx, art.places, rect, at.x - rect[2] / 2, at.y - lift - rect[3]);
  }
  if (castle.flag) {
    const flag = PLACE_ART.castleFlag;
    const size = footprint(CASTLE_SITE.kind);
    blit(
      ctx,
      art.places,
      flag,
      left + (size.cols * TILE) / 2 - 3,
      bottom - lift - 20 - flag[3],
    );
  }
  const char = state.chars[state.active];
  if (
    castle.blocks < CASTLE_BLOCKS &&
    !castle.melting &&
    carries(char, "snowBlock") &&
    Math.floor(state.time * 3) % 2 === 0
  ) {
    const at = plotPoint(castle.blocks);
    ctx.strokeStyle = "#ffd84a";
    ctx.lineWidth = 1;
    ctx.strokeRect(snap(at.x - 7), snap(at.y - lift - 14), 14, 12);
  }
}

/** The skis under a skier's feet. */
function drawSkis(ctx: CanvasRenderingContext2D, char: Character): void {
  ctx.fillStyle = SKI;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      snap(char.x + side * SKI_APART - 0.5),
      snap(char.y - SKI_LONG + 3),
      1.5,
      SKI_LONG,
    );
  }
}

/** The cable from the valley station to the summit, sagging a little. */
function drawCable(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = CABLE;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  for (let k = 0; k <= CABLE_STEPS; k += 1) {
    const at = gondolaPoint(k / CABLE_STEPS);
    const y = at.y - at.altitude;
    if (k === 0) {
      ctx.moveTo(at.x, y);
    } else {
      ctx.lineTo(at.x, y);
    }
  }
  ctx.stroke();
}

/** The golden arrow and bell painted on the gift store's roof, seen from the balloon. */
function drawRoofSecret(ctx: CanvasRenderingContext2D, state: GameState): void {
  const char = state.chars[state.active];
  const balloon = state.world.places.balloon;
  const share = inBalloon(state, char)
    ? Math.max(
        0,
        Math.min(1, (balloon.altitude - HIGH + SECRET_FADE) / SECRET_FADE),
      )
    : 0;
  if (share > 0) {
    const x = ROOF_SECRET.x;
    const y = ROOF_SECRET.y;
    ctx.globalAlpha = share;
    ctx.fillStyle = "#ffd84a";
    ctx.fillRect(snap(x - 14), snap(y - 1.5), 18, 3);
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 6);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x + 4, y + 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 20, y - 1, 4, Math.PI, 0);
    ctx.lineTo(x - 15, y + 3);
    ctx.lineTo(x - 25, y + 3);
    ctx.fill();
    ctx.fillStyle = "#c89020";
    ctx.fillRect(snap(x - 21), snap(y + 3), 2, 1.5);
    ctx.globalAlpha = 1;
  }
}

/** The sign at a platform the character steered stands on or near. */
function platformSign(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  char: Character,
  scale: number,
  cx: number,
  cy: number,
): void {
  const on = platformAt(char);
  STATIONS.forEach((station, index) => {
    const box = station.platform;
    const x = (box.tx + box.w / 2) * TILE;
    const y = (box.ty + box.h) * TILE;
    if (on === index || Math.hypot(char.x - x, char.y - y) < PLATFORM_NEAR) {
      sign(
        ctx,
        PLACES_TEXTS.stationNames[station.id],
        PLACES_TEXTS.platformHint,
        (x - cx) * scale,
        (y + SIGN_BELOW - cy) * scale,
        scale,
      );
    }
  });
}

/** The sign beside the balloon while it waits on the ground. */
function balloonSign(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  char: Character,
  scale: number,
  cx: number,
  cy: number,
): void {
  const balloon = state.world.places.balloon;
  if (
    balloon.rider < 0 &&
    balloon.altitude < 1 &&
    Math.hypot(char.x - balloon.x, char.y - balloon.y) < PLATFORM_NEAR
  ) {
    sign(
      ctx,
      PLACES_TEXTS.balloonName,
      PLACES_TEXTS.balloonBoard,
      (balloon.x - cx) * scale,
      (balloon.y + SIGN_BELOW * 2 - cy) * scale,
      scale,
    );
  }
}

/** Whether somebody stands by the castle's site. */
function nearCastle(char: Character): boolean {
  const size = footprint(CASTLE_SITE.kind);
  const x = (CASTLE_SITE.tx + size.cols / 2) * TILE;
  const y = (CASTLE_SITE.ty + size.rows) * TILE;
  return (
    char.area === "outdoors" && Math.hypot(char.x - x, char.y - y) < 4 * TILE
  );
}

/** A time in tenths of a second as shown, one decimal with a comma. */
function seconds(tenths: number): string {
  return `${(tenths / 10).toFixed(1).replace(".", ",")} ${PLACES_TEXTS.seconds}`;
}

/** Where a picture of the new places has its bottom left corner. */
function pictureCorner(
  kind: BigObjectKind,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const size = footprint(kind);
  const width = WINDOW_WIDTHS[kind] ?? size.cols * TILE;
  return {
    x: tx * TILE + (size.cols * TILE - width) / 2,
    y: (ty + size.rows) * TILE,
  };
}

/** The unit step of a facing. */
function ahead(dir: string): readonly [number, number] {
  const steps: Readonly<Record<string, readonly [number, number]>> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };
  return steps[dir] ?? [1, 0];
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
