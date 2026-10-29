/**
 * Drawing the shows: the ability poses, Santa's thought bubbles with
 * everybody's wish and his golden shimmer, the shaking picture while
 * Grantelbart rocks, the telescope lens and its caption, what Gilfi makes
 * float, and the stars round Balbo's head.
 *
 * @module
 */
import {
  FALL_GETUP,
  FALL_IMPACT,
  FLOAT_HEIGHT,
  floatLift,
  hopLift,
} from "@/games/weihnachtsmann/engine/shows";
import { SHOWS } from "@/games/weihnachtsmann/engine/cast";
import { currentProfile } from "@/games/weihnachtsmann/engine/movement";
import { isRiding } from "@/games/weihnachtsmann/engine/sleigh";
import { LOOK_UP, spyLens } from "@/games/weihnachtsmann/engine/spyglass";
import type {
  Character,
  CharacterId,
  GameState,
  ToyKind,
} from "@/games/weihnachtsmann/engine/types";
import { SPY_CAPTION, WISH_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import type { GlowFn } from "./render-props";
import {
  EFFECTS,
  OBJECTS,
  type EffectName,
  type ObjectName,
  type PoseFrames,
  type SpriteRect,
} from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** The size of the visible part of the map, map px. */
type View = { readonly w: number; readonly h: number };

/** The wish each character thinks of, as a picture. */
const WISH_ICONS: Readonly<Record<Exclude<CharacterId, "santa">, EffectName>> =
  {
    balbo: "wishFish",
    jordi: "wishTrain",
    trixi: "wishTeddy",
    gilfi: "wishPillow",
    grantelbart: "wishGuitar",
    gugor: "wishBall",
    rudolf: "wishCarrot",
  };

/** The picture of each toy Gilfi conjures. */
const TOY_ART: Readonly<Record<ToyKind, ObjectName>> = {
  teddy: "toyTeddy",
  train: "toyTrain",
  doll: "toyDoll",
  ball: "toyBall",
  present: "toyPresent",
};

/** Strumming and waving speeds, frames per second. */
const STRUM_FPS = 8;
const WAVE_FPS = 4;

/** Share of {@link LOOK_UP} the telescope takes to reach the eye. */
const RAISE_SHARE = 0.6;

/** How fast thought bubbles fade in and out, seconds, and pop one by one. */
const WISH_FADE_IN = 0.3;
const WISH_FADE_OUT = 0.4;
const WISH_STAGGER = 0.08;

/** Where the thought bubble sits: its tail by the head, map px. */
const CLOUD_LEFT = 1;
const CLOUD_GAP = 1;

/** Where the wish picture sits inside the bubble, map px. */
const ICON_IN = { x: 5, y: 1 } as const;

/** Thought bubbles bob this fast (radians per second) and this far (map px). */
const CLOUD_BOB_SPEED = 3;
const CLOUD_BOB = 0.5;

/** Santa's golden glow: radius, strength, pulse speed and size. */
const SHIMMER_GLOW = 30;
const SHIMMER_STRENGTH = 0.38;
const SHIMMER_PULSE = 5;
const SHIMMER_PULSE_SIZE = 0.12;

/** Size of a wish label's text, map px. */
const LABEL_FONT = 4.5;

/** How hard the picture shakes while Grantelbart plays, map px, and how long. */
const SHAKE = 1;
const SHAKE_SECONDS = 1.4;

/** Shake frequencies across and up, radians per second. */
const SHAKE_X = 47;
const SHAKE_Y = 61;

/** The lens: radius as a share of the shorter view side, and its middle. */
const LENS_SHARE = 0.42;
const LENS_RISE = 4;

/** Outside the lens, and the brass rim. */
const LENS_DARK = "rgba(8, 6, 16, 0.94)";
const RIM = "#b8902e";
const RIM_LIGHT = "#f4d880";
const RIM_WIDTH = 2.5;

/** The light catching the rim, top left, radians. */
const GLINT_FROM = Math.PI;
const GLINT_TO = Math.PI + Math.PI / 2;

/** Size of the caption's text, map px, its padding and how far from the bottom. */
const CAPTION_FONT = 6.5;
const CAPTION_PAD = 3;
const CAPTION_LOW = 6;

/** Where Balbo's head lies when he is flat, from his feet, map px. */
const FLAT_HEAD = { x: 13, y: -15 } as const;

/** The stars round his head: how many, how fast, how wide. */
const DIZZY_STARS = 3;
const DIZZY_SPEED = 6;
const DIZZY_RX = 6;
const DIZZY_RY = 2;

/** Sparkles twinkle this fast, frames per second. */
const TWINKLE_FPS = 10;

/** A floater's shadow: widest, and how much it shrinks high up. */
const FLOAT_SHADOW = 4;
const FLOAT_SHADOW_SHRINK = 0.4;

/** Below this lift a conjured toy is still see-through, map px. */
const CONJURE_SOLID = 5;

/** Shadow colour of a floater. */
const SHADOW = "rgba(70, 90, 140, 0.25)";

/**
 * The frame of somebody's ability pose, while its show runs.
 *
 * @param char - the character
 * @param poses - its frames for the facing drawn
 * @param time - seconds since the game began, for the strumming and waving
 * @returns the frame, or null when it shows no ability pose
 */
export function showFrame(
  char: Character,
  poses: PoseFrames,
  time: number,
): SpriteRect | null {
  const show = char.show;
  const act = poses.act;
  let frame: SpriteRect | null = null;
  if (show !== null && act !== undefined && char.form === null) {
    const t = show.elapsed;
    const seconds = SHOWS[show.kind].seconds;
    let index = 0;
    switch (show.kind) {
      case "guitar":
        index = Math.floor(time * STRUM_FPS);
        break;
      case "levitate":
        index = Math.floor(time * WAVE_FPS);
        break;
      case "telescope":
        index =
          t > LOOK_UP * RAISE_SHARE && t < seconds - LOOK_UP * RAISE_SHARE
            ? 1
            : 0;
        break;
      case "fall":
        index = t >= FALL_IMPACT && t < seconds - FALL_GETUP ? 1 : 0;
        break;
      case "wishes":
        break;
    }
    frame = act[index % act.length];
  }
  return frame;
}

/**
 * How far the picture is pushed by Grantelbart's guitar right now.
 *
 * @param state - the game
 * @returns the offset, map px, snapped to art pixels
 */
export function shakeOffset(state: GameState): { x: number; y: number } {
  const loud = state.chars.some(
    (char) =>
      char.show?.kind === "guitar" &&
      char.show.elapsed < SHAKE_SECONDS &&
      char.area === state.viewArea,
  );
  const amp = loud && state.fade === null ? SHAKE : 0;
  return {
    x: snap(Math.sin(state.time * SHAKE_X) * amp),
    y: snap((Math.cos(state.time * SHAKE_Y) * amp) / 2),
  };
}

/**
 * Santa's golden shimmer and a thought bubble with a wish over everybody in
 * view while he reads their wishes.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 * @param glow - draws a soft light
 */
export function drawWishes(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  glow: GlowFn,
): void {
  const santa = wishReader(state);
  if (santa !== null && santa.show !== null) {
    const t = santa.show.elapsed;
    const fade = wishFade(t, 0);
    const pulse = 1 + Math.sin(state.time * SHIMMER_PULSE) * SHIMMER_PULSE_SIZE;
    glow(
      santa.x,
      santa.y - santa.altitude - currentProfile(santa).height / 2,
      SHIMMER_GLOW * pulse,
      "255, 214, 90",
      SHIMMER_STRENGTH * fade,
    );
    const cloud = EFFECTS.thought;
    wishers(state, santa).forEach(({ char, id }, order) => {
      const alpha = wishFade(t, order);
      if (alpha > 0) {
        const bob = Math.sin(state.time * CLOUD_BOB_SPEED + order) * CLOUD_BOB;
        const left = char.x - CLOUD_LEFT;
        const top = headTop(char) - cloud[3] - CLOUD_GAP + bob;
        ctx.globalAlpha = alpha;
        blit(ctx, art.figures, cloud, left, top);
        blit(
          ctx,
          art.figures,
          EFFECTS[WISH_ICONS[id]],
          left + ICON_IN.x,
          top + ICON_IN.y,
        );
        ctx.globalAlpha = 1;
      }
    });
  }
}

/**
 * The wish written small over each thought bubble, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawWishLabels(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
): void {
  const santa = wishReader(state);
  if (santa !== null && santa.show !== null && state.fade === null) {
    const t = santa.show.elapsed;
    const cloud = EFFECTS.thought;
    ctx.save();
    ctx.font = `bold ${String(Math.round(LABEL_FONT * scale))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, scale);
    ctx.strokeStyle = "#2a2230";
    ctx.fillStyle = "#ffe9a8";
    wishers(state, santa).forEach(({ char, id }, order) => {
      const alpha = wishFade(t, order);
      if (alpha > 0 && char.bubble === null) {
        const x = (char.x - CLOUD_LEFT + cloud[2] / 2 - cx) * scale;
        const y = (headTop(char) - cloud[3] - CLOUD_GAP - cy) * scale;
        ctx.globalAlpha = alpha;
        ctx.strokeText(WISH_TEXTS[id], x, y);
        ctx.fillText(WISH_TEXTS[id], x, y);
      }
    });
    ctx.restore();
  }
}

/**
 * The round telescope lens over the picture while Gugor looks through it.
 *
 * @param ctx - the buffer, in view px (no camera)
 * @param state - the game
 * @param view - the visible part of the map, map px
 */
export function drawLens(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  const open = spyLens(state);
  const lens = Math.min(view.w, view.h) * LENS_SHARE;
  const full = Math.hypot(view.w, view.h) / 2 + RIM_WIDTH;
  const radius = open <= 1 ? lens * open : lens + (open - 1) * (full - lens);
  if (state.spy !== null && radius < full) {
    const x = view.w / 2;
    const y = view.h / 2 - LENS_RISE;
    ctx.fillStyle = LENS_DARK;
    ctx.beginPath();
    ctx.rect(0, 0, view.w, view.h);
    ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2);
    ctx.fill("evenodd");
    if (radius > RIM_WIDTH) {
      ctx.lineWidth = RIM_WIDTH;
      ctx.strokeStyle = RIM;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1 / 2;
      ctx.strokeStyle = RIM_LIGHT;
      ctx.beginPath();
      ctx.arc(x, y, radius - 1, GLINT_FROM, GLINT_TO);
      ctx.stroke();
    }
  }
}

/**
 * The caption under the lens while Gugor watches, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 */
export function drawSpyCaption(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
): void {
  if (state.spy?.watching === true) {
    ctx.save();
    ctx.font = `bold ${String(Math.round(CAPTION_FONT * scale))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const pad = CAPTION_PAD * scale;
    const w = ctx.measureText(SPY_CAPTION).width + pad * 2;
    const h = CAPTION_FONT * scale + pad * 2;
    const x = ctx.canvas.width / 2;
    const bottom = ctx.canvas.height - CAPTION_LOW * scale;
    ctx.fillStyle = "rgba(20, 14, 30, 0.85)";
    ctx.strokeStyle = RIM;
    ctx.lineWidth = Math.max(1, scale / 2);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, bottom - h, w, h, pad);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = RIM_LIGHT;
    ctx.fillText(SPY_CAPTION, x, bottom - pad);
    ctx.restore();
  }
}

/**
 * Stars circling over Balbo's head while he lies in the snow.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 */
export function drawDizzy(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  for (const char of state.chars) {
    const show = char.show;
    if (
      show?.kind === "fall" &&
      char.area === state.viewArea &&
      show.elapsed >= FALL_IMPACT &&
      show.elapsed < SHOWS.fall.seconds - FALL_GETUP
    ) {
      const side = char.dir === "left" ? -1 : 1;
      const hx = char.x + FLAT_HEAD.x * side;
      const hy = char.y + FLAT_HEAD.y;
      for (let k = 0; k < DIZZY_STARS; k += 1) {
        const angle =
          state.time * DIZZY_SPEED + (k / DIZZY_STARS) * Math.PI * 2;
        const twinkle = Math.floor(state.time * TWINKLE_FPS + k) % 2;
        const rect =
          EFFECTS[twinkle === 0 ? "sparkleYellow0" : "sparkleYellow1"];
        blit(
          ctx,
          art.figures,
          rect,
          hx + Math.cos(angle) * DIZZY_RX - rect[2] / 2,
          hy + Math.sin(angle) * DIZZY_RY - rect[3] / 2,
        );
      }
    }
  }
}

/**
 * How high each lifted map object floats, by its cell.
 *
 * @param state - the game
 * @returns the lift, map px, of every lifted cell in the place on screen
 */
export function floatLifts(state: GameState): ReadonlyMap<number, number> {
  const lifts = new Map<number, number>();
  for (const floater of state.floats) {
    if (floater.cell >= 0 && floater.area === state.viewArea) {
      lifts.set(floater.cell, floatLift(floater));
    }
  }
  return lifts;
}

/**
 * The shadows of whatever floats, on the ground below it.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 */
export function drawFloatShadows(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  ctx.fillStyle = SHADOW;
  for (const floater of state.floats) {
    const lift = floatLift(floater);
    if (floater.area === state.viewArea && lift > 1 / 2) {
      const w =
        FLOAT_SHADOW * (1 - (lift / FLOAT_HEIGHT) * FLOAT_SHADOW_SHRINK);
      ctx.beginPath();
      ctx.ellipse(
        snap(floater.x),
        snap(floater.y - 1),
        w,
        w / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

/**
 * Gathers the toys Gilfi conjured, to be drawn at their depth.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 * @param items - where they go
 */
export function collectFloaters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  items: Drawable[],
): void {
  for (const floater of state.floats) {
    const toy = floater.toy;
    if (toy !== null && floater.area === state.viewArea && floater.age > 0) {
      items.push({
        depth: floater.y,
        draw: () => {
          const lift = floatLift(floater);
          const rect = OBJECTS[TOY_ART[toy]];
          ctx.globalAlpha = Math.min(1, lift / CONJURE_SOLID);
          blit(
            ctx,
            art.world,
            rect,
            floater.x - rect[2] / 2,
            floater.y - rect[3] - lift,
          );
          ctx.globalAlpha = 1;
        },
      });
    }
  }
}

/** The Weihnachtsmann reading wishes in the place on screen, or null. */
function wishReader(state: GameState): Character | null {
  return (
    state.chars.find(
      (char) =>
        char.show?.kind === "wishes" &&
        char.area === state.viewArea &&
        !isRiding(state, char),
    ) ?? null
  );
}

/** Everybody in view whose wish Santa sees, in a fixed order. */
function wishers(
  state: GameState,
  santa: Character,
): { char: Character; id: Exclude<CharacterId, "santa"> }[] {
  const found: { char: Character; id: Exclude<CharacterId, "santa"> }[] = [];
  for (const char of state.chars) {
    const id = char.id;
    if (
      id !== "santa" &&
      char.area === santa.area &&
      !isRiding(state, char) &&
      onScreen(state, char)
    ) {
      found.push({ char, id });
    }
  }
  return found;
}

/** Whether somebody stands in the visible part of the map. */
function onScreen(state: GameState, char: Character): boolean {
  const { x, y } = state.camera;
  return (
    char.x > x &&
    char.x < x + state.view.w &&
    char.y > y &&
    char.y - currentProfile(char).height < y + state.view.h
  );
}

/** How visible the n-th thought bubble is, 0 to 1. */
function wishFade(elapsed: number, order: number): number {
  const t = elapsed - order * WISH_STAGGER;
  const left = SHOWS.wishes.seconds - elapsed;
  return Math.max(0, Math.min(1, t / WISH_FADE_IN, left / WISH_FADE_OUT));
}

/** The top of somebody's head, map px, as drawn right now. */
function headTop(char: Character): number {
  return char.y - char.altitude - hopLift(char) - currentProfile(char).height;
}
