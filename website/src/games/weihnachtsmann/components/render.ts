/**
 * Drawing one picture of the place on screen: ground or room, everything
 * standing on it sorted by depth (the Advent gates among it), the characters,
 * lights, sparkles, smoke and falling snow, the fade between places - and the
 * speech bubbles and gate hints on top in sharp text.
 *
 * @module
 */
import { fadeDarkness } from "@/games/weihnachtsmann/engine/doors";
import { spotInReach } from "@/games/weihnachtsmann/engine/interact";
import {
  FLAT_OBJECTS,
  TILE,
  footprint,
} from "@/games/weihnachtsmann/engine/map";
import {
  currentProfile,
  WALK_FRAMES,
} from "@/games/weihnachtsmann/engine/movement";
import { isRiding } from "@/games/weihnachtsmann/engine/sleigh";
import type {
  AreaId,
  BigObjectKind,
  Character,
  GameMap,
  GameState,
  Ground,
  Particle,
  PlacedObject,
  SmallObjectKind,
} from "@/games/weihnachtsmann/engine/types";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import {
  drawFlyingSleigh,
  drawFlyingToys,
  drawPortraitEyes,
  drawProp,
  propLights,
  type GlowFn,
} from "./render-props";
import { collectGates, drawGateHints } from "./render-gates";
import {
  EFFECTS,
  FENCE_TILES,
  FIGURES,
  ICE_TILES,
  OBJECTS,
  PATH_TILES,
  SNOW_TILES,
  WATER_TILES,
  type EffectName,
  type Facing,
  type PoseFrames,
  type ObjectName,
  type SpriteRect,
} from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Half a cell, map px. */
const HALF = TILE / 2;

/** Extra rows below the view whose tall trees still reach into it. */
const TALL_ROWS = 4;

/** How each small object is placed in its cell: sprite and nudge down. */
const SMALL_ART: Readonly<
  Record<SmallObjectKind, { readonly sprite: ObjectName; readonly dy: number }>
> = {
  tree: { sprite: "tree", dy: 1 },
  smallTree: { sprite: "smallTree", dy: 1 },
  rock: { sprite: "rock", dy: 1 },
  drift: { sprite: "drift", dy: 1 },
  snowman: { sprite: "snowman", dy: 0 },
  lamp: { sprite: "lamp", dy: 0 },
  gifts: { sprite: "gifts", dy: 0 },
  deadBush: { sprite: "deadBush", dy: 1 },
  crookedSign: { sprite: "crookedSign", dy: 0 },
};

/** The picture of each big object; the sleigh stands a little low. */
const BIG_ART: Readonly<
  Record<BigObjectKind, { readonly sprite: ObjectName; readonly dy: number }>
> = {
  dome: { sprite: "dome", dy: 0 },
  paintedTree: { sprite: "paintedTree", dy: 0 },
  sleigh: { sprite: "sleigh", dy: 2 },
  grantelMain: { sprite: "grantelMain", dy: 0 },
  grantelWing: { sprite: "grantelWing", dy: 0 },
  toyMachine: { sprite: "toyMachine", dy: 0 },
  workbench: { sprite: "workbench", dy: 0 },
  toyShelf: { sprite: "toyShelf", dy: 0 },
  toyShelfLadder: { sprite: "toyShelfLadder", dy: 0 },
  armchair: { sprite: "armchair", dy: 0 },
  fireplace: { sprite: "fireplace", dy: 0 },
  wishBoard: { sprite: "wishBoard", dy: 0 },
  ampStack: { sprite: "ampStack", dy: 0 },
  drumKit: { sprite: "drumKit", dy: 0 },
  guitarStand: { sprite: "guitarStand", dy: 0 },
  organ: { sprite: "organ", dy: 0 },
  candelabra: { sprite: "candelabra", dy: 0 },
  creepyChair: { sprite: "creepyChair", dy: 0 },
};

/** The room picture of each place indoors; outside is drawn from tiles. */
const ROOMS: Readonly<Partial<Record<AreaId, ObjectName>>> = {
  workshop: "workshopRoom",
  grantelHouse: "grantelRoom",
};

/** What shows round a room that is smaller than the view. */
const ROOM_SURROUND = "#0b0814";

/** Size of the key hint's letter, map px, and its padding. */
const HINT_FONT = 6;
const HINT_PAD = 2;

/** Fence pieces stand this far above the middle of their cell, map px. */
const FENCE_RISE = 19;

/** Where the light of a lamp sits below the top of its sprite, map px. */
const LAMP_LIGHT = 8;

/** Radius of a lamp's glow, map px, and how strong it is, 0 to 1. */
const LAMP_GLOW = 22;
const LAMP_STRENGTH = 0.3;

/** Lamps flicker this fast (radians per second) and by this share. */
const LAMP_FLICKER = 3;
const LAMP_FLICKER_SIZE = 0.05;

/** Radius of Rudolf's nose glow and of its bright core, map px. */
const NOSE_GLOW = 20;
const NOSE_CORE = 3.5;

/** How strong the red light is, 0 to 1. */
const NOSE_STRENGTH = 0.55;

/** The glow pulses this fast (radians per second) and by this share. */
const NOSE_PULSE = 6;
const NOSE_PULSE_SIZE = 0.12;

/** Where Rudolf's nose sits relative to his feet: side and front view. */
const NOSE_SIDE = { x: 14, y: -19 } as const;
const NOSE_FRONT = { x: 0, y: -14.5 } as const;

/** Sparkle sprites by tint. */
const SPARKLES: readonly (readonly [EffectName, EffectName])[] = [
  ["sparkleYellow0", "sparkleYellow1"],
  ["sparklePink0", "sparklePink1"],
  ["sparkleCyan0", "sparkleCyan1"],
  ["sparkleWhite0", "sparkleWhite1"],
];

/** Radius of the shimmer round a sparkle, map px. */
const SPARKLE_HALO = 3;

/** Poof frames. */
const POOF: readonly EffectName[] = ["poof0", "poof1", "poof2"];

/** The two music notes. */
const NOTES: readonly EffectName[] = ["note0", "note1"];

/** Idle breathing and flapping speeds, frames per second. */
const IDLE_FPS = 1.6;
const FLY_FPS = 8;

/** Sparkles twinkle this fast, frames per second. */
const TWINKLE_FPS = 10;

/** The marker bobs this fast (radians per second) and this far (map px). */
const MARKER_SPEED = 5;
const MARKER_BOB = 1.5;

/** Gap between a head and the marker or bubble, map px. */
const HEAD_GAP = 3;

/** Falling snowflakes. */
const FLAKES = 70;

/** Shadow colours: on the ground, and of somebody high up. */
const SHADOW = "rgba(70, 90, 140, 0.28)";
const SHADOW_HIGH = "rgba(70, 90, 140, 0.18)";

/** The golden ring under the character the player steers. */
const RING = "rgba(255, 210, 60, 0.55)";

/** Size of a speech bubble's text, map px. */
const BUBBLE_FONT = 6.5;

/** Padding inside a bubble, map px. */
const BUBBLE_PAD = 3;

/** Widest a bubble's text runs before it wraps, map px. */
const BUBBLE_WRAP = 120;

/** The size of the visible part of the map, map px. */
type View = { readonly w: number; readonly h: number };

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/**
 * Draws the whole picture into a buffer scaled to logical pixels.
 *
 * @param ctx - the buffer
 * @param state - the game
 * @param art - the sheets
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const cx = snap(state.camera.x);
  const cy = snap(state.camera.y);
  ctx.save();
  ctx.translate(-cx, -cy);
  const view = state.view;
  const map = state.maps[state.viewArea];
  const glow: GlowFn = (x, y, radius, rgb, strength) => {
    glowAt(ctx, x, y, radius, rgb, strength);
  };
  const shown = state.chars.filter(
    (char) => char.area === state.viewArea && !isRiding(state, char),
  );
  drawGround(ctx, map, art, cx, cy, view);
  for (const object of map.objects) {
    if (FLAT_OBJECTS.has(object.kind)) {
      drawBig(ctx, art, state, object);
    }
  }
  for (const char of shown) {
    drawShadow(ctx, char, state.chars[state.active] === char);
  }
  const ride = state.sleigh;
  if (ride !== null && map.area === "outdoors") {
    drawSleighShadow(ctx, ride.x, ride.y);
  }
  const items: Drawable[] = [];
  collectMap(ctx, state, map, art, cx, cy, view, items);
  collectGates(ctx, state, map, art, items);
  const sky = map.rows * TILE;
  for (const char of shown) {
    items.push({
      depth: char.altitude > 1 ? char.y + sky : char.y,
      draw: () => {
        drawCharacter(ctx, char, art, state.time);
      },
    });
  }
  if (ride !== null && map.area === "outdoors") {
    items.push({
      depth: ride.altitude > 1 ? ride.y + sky : ride.y,
      draw: () => {
        drawFlyingSleigh(ctx, art, state, glow);
      },
    });
  }
  items.sort((a, b) => a.depth - b.depth);
  for (const item of items) {
    item.draw();
  }
  drawFlyingToys(ctx, art, state);
  if (map.shade !== null) {
    ctx.fillStyle = map.shade;
    ctx.fillRect(cx, cy, view.w, view.h);
  }
  drawGlows(ctx, state, map, cx, cy, view);
  for (const particle of state.particles) {
    if (particle.area === state.viewArea) {
      drawParticle(ctx, particle, art);
    }
  }
  drawMarker(ctx, state, art);
  ctx.restore();
  if (map.area === "outdoors") {
    drawSnowfall(ctx, state.time, cx, cy, view);
  }
  const dark = fadeDarkness(state);
  if (dark > 0) {
    ctx.fillStyle = `rgba(6, 4, 12, ${String(dark)})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }
}

/**
 * Draws the speech bubbles and the gate hints onto the visible canvas, at its
 * full resolution so the letters are sharp.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per logical pixel
 */
export function drawBubbles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  const cx = snap(state.camera.x);
  const cy = snap(state.camera.y);
  ctx.save();
  ctx.font = `bold ${String(Math.round(BUBBLE_FONT * scale))}px system-ui, sans-serif`;
  ctx.textBaseline = "top";
  const ride = state.sleigh;
  for (const char of state.chars) {
    if (
      char.bubble !== null &&
      state.fade === null &&
      char.area === state.viewArea
    ) {
      const height = currentProfile(char).height;
      let x = (char.x - cx) * scale;
      let y = (char.y - char.altitude - height - HEAD_GAP * 2 - cy) * scale;
      if (ride !== null && isRiding(state, char)) {
        // In the sleigh: the words come from the sleigh.
        x = (ride.x - cx) * scale;
        y = (ride.y - ride.altitude - height - cy) * scale;
      }
      bubble(ctx, char.bubble.text, x, y, scale);
    }
  }
  drawKeyHint(ctx, state, scale, cx, cy);
  drawGateHints(ctx, state, scale, cx, cy);
  ctx.restore();
}

/**
 * A little key cap beside the head of the character steered when the talk
 * key would use something.
 */
function drawKeyHint(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
): void {
  const char = state.chars[state.active];
  if (char.bubble === null && spotInReach(state) !== null) {
    const height = currentProfile(char).height;
    const size = (HINT_FONT + HINT_PAD * 2) * scale;
    const x = (char.x - cx + HEAD_GAP * 2) * scale;
    const y = (char.y - char.altitude - height - HEAD_GAP - cy) * scale - size;
    ctx.font = `bold ${String(Math.round(HINT_FONT * scale))}px system-ui, sans-serif`;
    ctx.fillStyle = "#fffdf6";
    ctx.strokeStyle = "#2a2230";
    ctx.lineWidth = Math.max(1, scale / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, scale * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2a2230";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(WM_TEXTS.useKey, x + size / 2, y + size / 2 + scale / 2);
  }
}

/**
 * Snow, then path, ice and water as round-edged layers over it - or, indoors,
 * the room picture.
 */
function drawGround(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  art: Art,
  cx: number,
  cy: number,
  view: View,
): void {
  const room = ROOMS[map.area];
  if (room !== undefined) {
    ctx.fillStyle = ROOM_SURROUND;
    ctx.fillRect(cx, cy, view.w, view.h);
    blit(ctx, art.world, OBJECTS[room], 0, 0);
  } else {
    drawSnow(ctx, map, art, cx, cy, view);
  }
}

/** The snowy ground with its dual-grid layers. */
function drawSnow(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  art: Art,
  cx: number,
  cy: number,
  view: View,
): void {
  const tx0 = Math.floor(cx / TILE);
  const ty0 = Math.floor(cy / TILE);
  const tx1 = Math.ceil((cx + view.w) / TILE);
  const ty1 = Math.ceil((cy + view.h) / TILE);
  for (let ty = ty0; ty <= ty1; ty += 1) {
    for (let tx = tx0; tx <= tx1; tx += 1) {
      const variant = SNOW_TILES[hash(tx, ty) % SNOW_TILES.length];
      blit(ctx, art.world, variant, tx * TILE, ty * TILE);
    }
  }
  const layers: readonly (readonly [
    readonly SpriteRect[],
    (ground: Ground) => boolean,
  ])[] = [
    [PATH_TILES, (ground) => ground === "path"],
    [ICE_TILES, (ground) => ground === "ice" || ground === "water"],
    [WATER_TILES, (ground) => ground === "water"],
  ];
  for (const [tiles, has] of layers) {
    for (let ty = ty0; ty <= ty1 + 1; ty += 1) {
      for (let tx = tx0; tx <= tx1 + 1; tx += 1) {
        const mask =
          (groundIs(map, tx - 1, ty - 1, has) ? 1 : 0) |
          (groundIs(map, tx, ty - 1, has) ? 2 : 0) |
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- corner bits of the dual grid
          (groundIs(map, tx - 1, ty, has) ? 4 : 0) |
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- corner bits of the dual grid
          (groundIs(map, tx, ty, has) ? 8 : 0);
        if (mask !== 0) {
          blit(ctx, art.world, tiles[mask], tx * TILE - HALF, ty * TILE - HALF);
        }
      }
    }
  }
}

/** Whether a cell's ground passes a test; outside the map never does. */
function groundIs(
  map: GameMap,
  tx: number,
  ty: number,
  has: (ground: Ground) => boolean,
): boolean {
  return (
    tx >= 0 &&
    ty >= 0 &&
    tx < map.cols &&
    ty < map.rows &&
    has(map.ground[ty * map.cols + tx])
  );
}

/** Gathers the trees, fences, buildings and furniture in view. */
function collectMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  cx: number,
  cy: number,
  view: View,
  items: Drawable[],
): void {
  const tx0 = Math.max(0, Math.floor(cx / TILE) - 1);
  const ty0 = Math.max(0, Math.floor(cy / TILE));
  const tx1 = Math.min(map.cols - 1, Math.ceil((cx + view.w) / TILE));
  const ty1 = Math.min(
    map.rows - 1,
    Math.ceil((cy + view.h) / TILE) + TALL_ROWS,
  );
  for (let ty = ty0; ty <= ty1; ty += 1) {
    for (let tx = tx0; tx <= tx1; tx += 1) {
      const index = ty * map.cols + tx;
      const small = map.small[index];
      const bits = map.fence[index];
      if (small !== null) {
        const place = SMALL_ART[small];
        const rect = OBJECTS[place.sprite];
        const bottom = (ty + 1) * TILE;
        items.push({
          depth: bottom,
          draw: () => {
            blit(
              ctx,
              art.world,
              rect,
              tx * TILE + HALF - rect[2] / 2,
              bottom - rect[3] + place.dy,
            );
          },
        });
      } else if (bits >= 0) {
        const middle = ty * TILE + HALF;
        items.push({
          depth: middle,
          draw: () => {
            blit(
              ctx,
              art.world,
              FENCE_TILES[bits],
              tx * TILE,
              middle - FENCE_RISE,
            );
          },
        });
      }
    }
  }
  for (const object of map.objects) {
    // The sleigh is off on its round while it flies.
    const away = object.kind === "sleigh" && state.sleigh !== null;
    if (!FLAT_OBJECTS.has(object.kind) && !away) {
      items.push({
        depth: (object.ty + footprint(object.kind).rows) * TILE,
        draw: () => {
          drawBig(ctx, art, state, object);
        },
      });
    }
  }
}

/** One big object: its picture centred on its footprint, and what moves on it. */
function drawBig(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  object: PlacedObject,
): void {
  const size = footprint(object.kind);
  const place = BIG_ART[object.kind];
  const rect = OBJECTS[place.sprite];
  const left = object.tx * TILE + (size.cols * TILE - rect[2]) / 2;
  const bottom = (object.ty + size.rows) * TILE + place.dy;
  blit(ctx, art.world, rect, left, bottom - rect[3]);
  drawProp(ctx, art, state, object.kind, left, bottom);
}

/** Where a big object's picture has its bottom left corner. */
function bigCorner(object: PlacedObject): { x: number; y: number } {
  const size = footprint(object.kind);
  const place = BIG_ART[object.kind];
  const rect = OBJECTS[place.sprite];
  return {
    x: object.tx * TILE + (size.cols * TILE - rect[2]) / 2,
    y: (object.ty + size.rows) * TILE + place.dy,
  };
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- size of the
   sleigh's shadow, picked by eye */
/** The shadow of the flying sleigh on the snow. */
function drawSleighShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.fillStyle = SHADOW_HIGH;
  ctx.beginPath();
  ctx.ellipse(snap(x), snap(y - 1), 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of the
   shadow and the ring, picked by eye */
/** The soft shadow under somebody, and the ring under the one steered. */
function drawShadow(
  ctx: CanvasRenderingContext2D,
  char: Character,
  active: boolean,
): void {
  const profile = currentProfile(char);
  const high = char.altitude > 1;
  const w = Math.max(3, profile.footW * (high ? 0.45 : 0.62));
  ctx.fillStyle = high ? SHADOW_HIGH : SHADOW;
  ctx.beginPath();
  ctx.ellipse(snap(char.x), snap(char.y - 1), w, w * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = RING;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      snap(char.x),
      snap(char.y - 1),
      w + 3,
      (w + 3) * 0.42,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One character in its current pose and frame. */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  char: Character,
  art: Art,
  time: number,
): void {
  const figure = FIGURES[char.form ?? char.id];
  const side = char.dir === "left" || char.dir === "right";
  const view: Facing = side ? "side" : char.dir === "up" ? "up" : "down";
  const poses: PoseFrames = figure[view];
  const profile = currentProfile(char);
  // Each character breathes at its own moment, so they do not move in step.
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- any spread of phases will do
  const phase = (char.id.length * 0.37 + char.x * 0.01) % 1;
  let frames: readonly SpriteRect[] = poses.idle;
  let index = Math.floor((time + phase) * IDLE_FPS);
  const fly = poses.fly;
  const slide = poses.slide;
  if (profile.flies && fly !== undefined) {
    frames = fly;
    index = Math.floor((time + phase) * FLY_FPS);
  } else if (slide !== undefined && char.onIce && char.moving) {
    frames = slide;
  } else if (char.moving) {
    frames = poses.walk;
    index = Math.floor(char.stride) % WALK_FRAMES;
  }
  const rect = frames[index % frames.length];
  const nose = noseOf(char);
  if (nose !== null) {
    // The red light falls round him, under the sprite ...
    const pulse = 1 + Math.sin(time * NOSE_PULSE) * NOSE_PULSE_SIZE;
    glowAt(
      ctx,
      nose.x,
      nose.y,
      NOSE_GLOW * pulse,
      "255, 40, 40",
      NOSE_STRENGTH,
    );
  }
  blit(
    ctx,
    art.figures,
    rect,
    char.x - figure.anchor[0],
    char.y - figure.anchor[1] - char.altitude,
    char.dir === "left",
  );
  if (nose !== null) {
    // ... and the nose itself shines on top.
    glowAt(ctx, nose.x, nose.y, NOSE_CORE, "255, 240, 220", 1);
  }
}

/**
 * Where Rudolf's nose shines, while he flies and looks anywhere but away.
 *
 * @param char - the character
 * @returns the nose, map px, or null when there is no glow to draw
 */
function noseOf(char: Character): { x: number; y: number } | null {
  let nose: { x: number; y: number } | null = null;
  if (char.id === "rudolf" && char.altitude > 1 && char.dir !== "up") {
    const side = char.dir === "left" || char.dir === "right";
    const offset = side ? NOSE_SIDE : NOSE_FRONT;
    nose = {
      x: char.x + offset.x * (char.dir === "left" ? -1 : 1),
      y: char.y + offset.y - char.altitude,
    };
  }
  return nose;
}

/** Warm light round the lamps, the houses, the fires and the candles. */
function drawGlows(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  cx: number,
  cy: number,
  view: View,
): void {
  // Plain blending, not additive: added light vanishes on white snow, a
  // warm or red tint shows.
  const glow: GlowFn = (x, y, radius, rgb, strength) => {
    if (
      x > cx - radius &&
      x < cx + view.w + radius &&
      y > cy - radius &&
      y < cy + view.h + radius
    ) {
      glowAt(ctx, x, y, radius, rgb, strength);
    }
  };
  for (const object of map.objects) {
    const corner = bigCorner(object);
    propLights(glow, state.time, object.kind, corner.x, corner.y);
  }
  drawPortraitEyes(ctx, state);
  const lamp = OBJECTS.lamp;
  const flicker = 1 + Math.sin(state.time * LAMP_FLICKER) * LAMP_FLICKER_SIZE;
  for (let ty = 0; ty < map.rows; ty += 1) {
    for (let tx = 0; tx < map.cols; tx += 1) {
      if (map.small[ty * map.cols + tx] === "lamp") {
        const x = tx * TILE + HALF;
        const y = (ty + 1) * TILE - lamp[3] + LAMP_LIGHT;
        if (
          x > cx - LAMP_GLOW &&
          x < cx + view.w + LAMP_GLOW &&
          y > cy - LAMP_GLOW &&
          y < cy + view.h + LAMP_GLOW
        ) {
          glowAt(ctx, x, y, LAMP_GLOW * flicker, "255, 190, 80", LAMP_STRENGTH);
        }
      }
    }
  }
}

/** A soft round light. */
function glowAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: string,
  strength: number,
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb}, ${String(strength)})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- fades and sizes of
   the particles, picked by eye */
/** One sparkle, puff of smoke or poof. */
function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  art: Art,
): void {
  const t = particle.age / particle.life;
  switch (particle.kind) {
    case "sparkle": {
      // A soft yellow shimmer behind each sparkle, like a fairy-dust trail.
      ctx.fillStyle = `rgba(255, 228, 90, ${String(0.35 * (1 - t))})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, SPARKLE_HALO, 0, Math.PI * 2);
      ctx.fill();
      const pair = SPARKLES[particle.tint % SPARKLES.length];
      const rect = EFFECTS[pair[Math.floor(particle.age * TWINKLE_FPS) % 2]];
      ctx.globalAlpha = Math.min(1, (1 - t) * 2);
      blit(
        ctx,
        art.figures,
        rect,
        particle.x - rect[2] / 2,
        particle.y - rect[3] / 2,
      );
      ctx.globalAlpha = 1;
      break;
    }
    case "poof": {
      const rect =
        EFFECTS[POOF[Math.min(POOF.length - 1, Math.floor(t * POOF.length))]];
      blit(
        ctx,
        art.figures,
        rect,
        particle.x - rect[2] / 2,
        particle.y - rect[3] / 2,
      );
      break;
    }
    case "smoke": {
      const radius = 1.5 + t * 3.5;
      ctx.fillStyle = `rgba(232, 236, 246, ${String(0.75 * (1 - t))})`;
      ctx.beginPath();
      ctx.arc(
        particle.x + Math.sin(particle.age * 2) * 2,
        particle.y,
        radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }
    case "snowPuff": {
      ctx.fillStyle = `rgba(255, 255, 255, ${String(1 - t)})`;
      ctx.fillRect(snap(particle.x), snap(particle.y), 1, 1);
      break;
    }
    case "note": {
      const rect = EFFECTS[NOTES[particle.tint % NOTES.length]];
      ctx.globalAlpha = Math.min(1, (1 - t) * 2.5);
      blit(
        ctx,
        art.figures,
        rect,
        particle.x +
          Math.sin(particle.age * 6 + particle.tint) * 2 -
          rect[2] / 2,
        particle.y - rect[3] / 2,
      );
      ctx.globalAlpha = 1;
      break;
    }
    case "steam": {
      const radius = 1.5 + t * 4;
      ctx.fillStyle = `rgba(250, 250, 255, ${String(0.6 * (1 - t))})`;
      ctx.beginPath();
      ctx.arc(
        particle.x + Math.sin(particle.age * 3) * 1.5,
        particle.y,
        radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The bouncing arrow over the character the player steers. */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const char = state.chars[state.active];
  let x = char.x;
  let y = char.y - char.altitude;
  const ride = state.sleigh;
  if (ride !== null && isRiding(state, char)) {
    x = ride.x;
    y = ride.y - ride.altitude;
  }
  const height = currentProfile(char).height;
  const rect =
    EFFECTS[Math.sin(state.time * MARKER_SPEED) > 0 ? "marker0" : "marker1"];
  const bob = Math.sin(state.time * MARKER_SPEED) * MARKER_BOB;
  if (char.area === state.viewArea) {
    blit(
      ctx,
      art.figures,
      rect,
      x - rect[2] / 2,
      y - height - rect[3] - HEAD_GAP + bob,
    );
  }
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- drift of the flakes,
   picked by eye */
/** Snow falling in front of everything, drifting with the camera a little. */
function drawSnowfall(
  ctx: CanvasRenderingContext2D,
  time: number,
  cx: number,
  cy: number,
  view: View,
): void {
  for (let k = 0; k < FLAKES; k += 1) {
    const near = k % 3 === 0;
    const parallax = near ? 1.2 : 0.6;
    const fall = 10 + (k % 7) * 2 + (near ? 8 : 0);
    const x = mod(
      k * 73.3 + Math.sin(time * 0.8 + k) * 6 + time * 4 - cx * parallax,
      view.w,
    );
    const y = mod(k * 41.7 + time * fall - cy * parallax, view.h);
    ctx.fillStyle = near
      ? "rgba(255, 255, 255, 0.95)"
      : "rgba(255, 255, 255, 0.7)";
    const size = near ? 1 : 0.5;
    ctx.fillRect(snap(x), snap(y), size, size);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- shape of the bubble
   and its tail, in map px times the scale */
/** A rounded speech bubble with a little tail, centred over a point. */
function bubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
): void {
  const lines = wrap(ctx, text, BUBBLE_WRAP * scale);
  const lineH = BUBBLE_FONT * scale * 1.2;
  const pad = BUBBLE_PAD * scale;
  const w =
    Math.max(...lines.map((line) => ctx.measureText(line).width)) + pad * 2;
  const h = lines.length * lineH + pad * 2;
  const canvasW = ctx.canvas.width;
  const left = Math.max(2, Math.min(canvasW - w - 2, x - w / 2));
  const top = Math.max(2, y - h);
  const r = 3 * scale;
  ctx.fillStyle = "#fffdf6";
  ctx.strokeStyle = "#2a2230";
  ctx.lineWidth = Math.max(1, scale * 0.6);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, r);
  ctx.fill();
  ctx.stroke();
  const tail = 2.5 * scale;
  const tx = Math.max(left + r + tail, Math.min(left + w - r - tail, x));
  ctx.beginPath();
  ctx.moveTo(tx - tail, top + h - ctx.lineWidth / 2);
  ctx.lineTo(tx, top + h + tail * 1.4);
  ctx.lineTo(tx + tail, top + h - ctx.lineWidth / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(
    tx - tail + ctx.lineWidth,
    top + h - ctx.lineWidth * 1.5,
    tail * 2 - ctx.lineWidth * 2,
    ctx.lineWidth * 2,
  );
  ctx.fillStyle = "#2a2230";
  lines.forEach((line, i) => {
    ctx.fillText(line, left + pad, top + pad + i * lineH);
  });
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Splits text into lines no wider than a limit. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  limit: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line === "" ? word : `${line} ${word}`;
    if (ctx.measureText(next).width > limit && line !== "") {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);
  return lines;
}

/** A cell's fixed random number. */
function hash(tx: number, ty: number): number {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- hashing primes
  return Math.abs((tx * 73856093) ^ (ty * 19349663));
}

/** Remainder that is never negative. */
function mod(value: number, by: number): number {
  return ((value % by) + by) % by;
}
