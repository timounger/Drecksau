/**
 * Drawing one picture of the place on screen: ground or room, everything
 * standing on it sorted by depth (the Advent gates among it), the characters,
 * lights, sparkles, smoke and falling snow, the shows of the abilities, the
 * fade between places - and the speech bubbles and gate hints on top in sharp
 * text.
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
import { hopLift } from "@/games/weihnachtsmann/engine/shows";
import { isRiding } from "@/games/weihnachtsmann/engine/sleigh";
import { inBalloon } from "@/games/weihnachtsmann/engine/aboard";
import { openAir } from "@/games/weihnachtsmann/engine/sky";
import { lampLit, smallLook } from "@/games/weihnachtsmann/engine/world";
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
import { collectWorld, drawRepair, drawToast } from "./render-world";
import {
  collectFloaters,
  drawDizzy,
  drawFloatShadows,
  drawLens,
  drawSpyCaption,
  drawWishLabels,
  drawWishes,
  floatLifts,
  shakeOffset,
  showFrame,
} from "./render-shows";
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
import { BUILDINGS, type BuildingName } from "./building-atlas";
import { OUTDOOR, type OutdoorName } from "./outdoor-atlas";
import {
  collectEast,
  drawEastProp,
  drawEastTexts,
  drawErrandArrow,
  drawLightStrings,
  eastLights,
  eastPicture,
  riderLift,
} from "./render-east";
import {
  collectJetskis,
  drawJetskiSigns,
  jetskiLift,
  jetskiLights,
} from "./render-jetski";
import { drawNight, drawSky, lightBoost } from "./render-sky";
import {
  collectTown,
  drawReading,
  drawTownLabels,
  drawTownProp,
  pileLook,
  townLights,
} from "./render-town";
import { drawOverview, drawOverviewLabels } from "./render-overview";
import { PLACE_ART, type PlaceArtName } from "./places-atlas";
import { EXTRA_ART, type ExtraArtName } from "./extras-atlas";
import {
  collectExtras,
  drawExtraProp,
  drawExtrasAbove,
  drawExtrasGround,
  drawExtrasNight,
  drawExtrasSky,
  drawExtrasTexts,
  extrasLights,
} from "./render-extras";
import {
  collectPlaces,
  drawAerial,
  drawBeam,
  drawPlaceProp,
  drawPlaceShadows,
  drawPlaceSigns,
  drawTrack,
  hiddenAboard,
  placeLift,
  placeLights,
  riderDepth,
} from "./render-places";
import { blit, snap, type Art } from "./sprites";

/** Half a cell, map px. */
const HALF = TILE / 2;

/** A carousel rider is drawn just in front of its horse, map px deeper. */
const RIDER_DEPTH = 0.2;

/** Extra rows below the view whose tall trees still reach into it. */
const TALL_ROWS = 4;

/** Which sheet a picture is on. */
type SheetName = "world" | "buildings" | "outdoor" | "places" | "extras";

/** A picture of the map: its sheet, where it sits there, and a nudge down. */
type Picture = {
  readonly sheet: SheetName;
  readonly rect: SpriteRect;
  readonly dy: number;
};

/**
 * A picture on the world sheet.
 *
 * @param name - its name in the atlas
 * @param dy - how far it stands lower than its foot line, map px
 * @returns the picture
 */
function world(name: ObjectName, dy = 0): Picture {
  return { sheet: "world", rect: OBJECTS[name], dy };
}

/**
 * A picture on the buildings sheet.
 *
 * @param name - its name in the atlas
 * @param dy - how far it stands lower than its foot line, map px
 * @returns the picture
 */
function town(name: BuildingName, dy = 0): Picture {
  return { sheet: "buildings", rect: BUILDINGS[name], dy };
}

/**
 * A picture on the outdoor sheet.
 *
 * @param name - its name in the atlas
 * @param dy - how far it stands lower than its foot line, map px
 * @returns the picture
 */
function outdoor(name: OutdoorName, dy = 0): Picture {
  return { sheet: "outdoor", rect: OUTDOOR[name], dy };
}

/**
 * A picture on the places sheet.
 *
 * @param name - its name in the atlas
 * @param dy - how far it stands lower than its foot line, map px
 * @returns the picture
 */
function place(name: PlaceArtName, dy = 0): Picture {
  return { sheet: "places", rect: PLACE_ART[name], dy };
}

/**
 * A picture on the extras sheet of part B.
 *
 * @param name - its name in the atlas
 * @param dy - how far it stands lower than its foot line, map px
 * @returns the picture
 */
function extra(name: ExtraArtName, dy = 0): Picture {
  return { sheet: "extras", rect: EXTRA_ART[name], dy };
}

/** How each small object is placed in its cell: picture and nudge down. */
const SMALL_ART: Readonly<Record<SmallObjectKind, Picture>> = {
  tree: world("tree", 1),
  smallTree: world("smallTree", 1),
  rock: world("rock", 1),
  drift: world("drift", 1),
  snowman: world("snowman"),
  lamp: world("lamp"),
  gifts: world("gifts"),
  deadBush: world("deadBush", 1),
  crookedSign: world("crookedSign"),
  parcels: town("parcels0"),
  parcelGap: town("parcelGap"),
  flag: outdoor("flagRed"),
  lightPole: outdoor("lightPole"),
};

/** The slalom flags on the slope, one picked per cell. */
const FLAG_ART: readonly Picture[] = [outdoor("flagRed"), outdoor("flagBlue")];

/** A felled young fir: its stump. */
const STUMP = outdoor("stump", 1);

/** The parcel stacks of the gift store, one picked per cell. */
const PARCEL_ART: readonly Picture[] = [
  town("parcels0"),
  town("parcels1"),
  town("parcels2"),
  town("parcels3"),
];

/** What a small object looks like once changed: a dark lamp, a heap, a flat drift. */
const CHANGED_ART: Readonly<Partial<Record<SmallObjectKind, ObjectName>>> = {
  lamp: "lampOff",
  snowman: "snowmanHeap",
  drift: "driftFlat",
};

/** The picture of each big object; the sleigh stands a little low. */
const BIG_ART: Readonly<Record<BigObjectKind, Picture>> = {
  dome: world("dome"),
  paintedTree: world("paintedTree"),
  sleigh: world("sleigh", 2),
  grantelMain: world("grantelMain"),
  grantelWing: world("grantelWing"),
  toyMachine: world("toyMachine"),
  workbench: world("workbench"),
  toyShelf: world("toyShelf"),
  toyShelfLadder: world("toyShelfLadder"),
  armchair: world("armchair"),
  fireplace: world("fireplace"),
  wishBoard: world("wishBoard"),
  ampStack: world("ampStack"),
  drumKit: world("drumKit"),
  guitarStand: world("guitarStand"),
  organ: world("organ"),
  candelabra: world("candelabra"),
  creepyChair: world("creepyChair"),
  cinema: world("cinema"),
  stableHouse: town("stableHouse"),
  postHouse: town("postHouse"),
  bakeryHouse: town("bakeryHouse"),
  observatory: town("observatory"),
  storeHouse: town("storeHouse"),
  stableGate: town("stableGate"),
  carrotTrough: town("carrotTrough"),
  strawBed: town("strawBed"),
  hayBales: town("hayBales"),
  sortShelf: town("sortShelf"),
  letterPile: town("letterPile3"),
  postDesk: town("postDesk"),
  mailSacks: town("mailSacks"),
  oven: town("oven"),
  doughTable: town("doughTable"),
  trayTable: town("trayTable"),
  coolRack: town("coolRack"),
  flourSacks: town("flourSacks"),
  bigTelescope: town("bigTelescope"),
  starDesk: town("starDesk"),
  globe: town("globe"),
  bookshelf: town("bookshelf"),
  stallPunch: outdoor("stallPunch"),
  stallGinger: outdoor("stallGinger"),
  stallChestnut: outdoor("stallChestnut"),
  carousel: outdoor("carouselBase"),
  waterfall: outdoor("waterfall"),
  sledStack: outdoor("sledStack"),
  startBanner: outdoor("startBanner"),
  finishBanner: outdoor("finishBanner"),
  target: outdoor("target"),
  mailbox: outdoor("mailbox"),
  treeStand: outdoor("treeStand"),
  crystalBig: outdoor("crystalBig"),
  crystalSmall: outdoor("crystalSmall"),
  crystalViolet: outdoor("crystalViolet"),
  hockeyGoalLeft: place("goalLeft", 2),
  hockeyGoalRight: place("goalRight", 2),
  hockeyBench: place("bench", 2),
  blockHeap: place("blockHeap", 2),
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the marks lie a little low
  castleSite: place("castleSite", 4),
  balloonPad: place("balloonPad", 2),
  valleyStation: place("valleyStation", 2),
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- its foot sinks into the snow
  mountain: place("mountain", 8),
  summitStation: place("summitStation", 2),
  panoramaScope: place("panoramaScope", 1),
  skiRack: place("skiRack", 1),
  lighthouse: place("lighthouse", 2),
  stationHouse: place("stationHouse", 2),
  stage: extra("stage"),
  magicBasket: extra("magicBasket", 2),
  schoolSign: extra("schoolSign", 2),
  postBoard: extra("postBoard", 2),
  angelSign: extra("angelSign", 2),
  contestSign: extra("contestSign", 2),
  photoPost: extra("photoPost", 2),
  ballPile: extra("ballPile", 2),
  carrotBox: extra("carrotBox", 2),
  hatStand: extra("hatStand", 2),
  scarfRack: extra("scarfRack", 2),
  snowmanPlot: extra("plot", 2),
  jury: extra("jury", 2),
  packTable: extra("packTable", 2),
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- its foot sinks into the snow
  giftTree: extra("giftTree", 4),
};

/** The heap of letters by how many are left: empty basket up to a mountain. */
const PILE_ART: readonly Picture[] = [
  town("letterPile0"),
  town("letterPile1"),
  town("letterPile2"),
  town("letterPile3"),
];

/** The room picture of each place indoors; outside is drawn from tiles. */
const ROOMS: Readonly<Partial<Record<AreaId, Picture>>> = {
  workshop: world("workshopRoom"),
  grantelHouse: world("grantelRoom"),
  stable: town("stableRoom"),
  postOffice: town("postRoom"),
  bakery: town("bakeryRoom"),
  observatory: town("observatoryRoom"),
  giftStore: town("storeRoom"),
  iceCave: outdoor("iceCaveRoom"),
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

/** Sprinkle colours on flung cookies. */
const SPRINKLES: readonly string[] = [
  "#ff6a8a",
  "#6ad0ff",
  "#fff2a0",
  "#ffffff",
];

/**
 * Spray colours behind a jetski: snow (shaded, to show on the white), ice
 * dust, water.
 */
const SPRAY_COLORS: readonly string[] = ["#bccce6", "#ffffff", "#e8f8ff"];

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
  const { cx, cy } = viewCorner(state);
  ctx.save();
  ctx.translate(-cx, -cy);
  const view = state.view;
  const map = state.maps[state.viewArea];
  const glow: GlowFn = (x, y, radius, rgb, strength) => {
    glowAt(ctx, x, y, radius, rgb, strength);
  };
  const shown = state.chars.filter(
    (char) =>
      char.area === state.viewArea &&
      !isRiding(state, char) &&
      !hiddenAboard(state, char),
  );
  const outside = openAir(map.area);
  drawGround(ctx, map, art, cx, cy, view);
  for (const object of map.objects) {
    if (FLAT_OBJECTS.has(object.kind)) {
      drawBig(ctx, art, state, object);
    }
  }
  drawTrack(ctx, state, map, cx, cy, view);
  drawExtrasGround(ctx, state, map, art);
  drawPlaceShadows(ctx, state, map);
  for (const char of shown) {
    if (!inBalloon(state, char)) {
      drawShadow(ctx, char, state.chars[state.active] === char);
    }
  }
  drawFloatShadows(ctx, state);
  const ride = state.sleigh;
  if (ride !== null && map.area === "outdoors") {
    drawSleighShadow(ctx, ride.x, ride.y);
  }
  const items: Drawable[] = [];
  collectMap(ctx, state, map, art, cx, cy, view, items);
  collectGates(ctx, state, map, art, items);
  collectWorld(ctx, state, map, art, items);
  collectTown(ctx, state, map, art, items);
  collectEast(ctx, state, map, art, items);
  collectJetskis(ctx, state, map, art, items);
  collectPlaces(ctx, state, map, art, items);
  collectExtras(ctx, state, map, art, items);
  collectFloaters(ctx, state, art, items);
  const sky = map.rows * TILE;
  for (const char of shown) {
    const lift =
      riderLift(state, char) + jetskiLift(state, char) + placeLift(state, char);
    const seated = riderDepth(state, char);
    items.push({
      depth:
        seated ??
        (char.altitude > 1
          ? char.y + sky
          : char.y + (lift > 0 ? RIDER_DEPTH : 0)),
      draw: () => {
        drawCharacter(ctx, char, art, state.time, lift);
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
  drawLightStrings(ctx, state);
  drawAerial(ctx, state, art);
  drawExtrasAbove(ctx, state, art);
  drawFlyingToys(ctx, art, state);
  drawRepair(ctx, state, art);
  if (map.shade !== null) {
    ctx.fillStyle = map.shade;
    ctx.fillRect(cx, cy, view.w, view.h);
  }
  drawNight(ctx, state, cx, cy);
  drawGlows(ctx, state, map, cx, cy, view);
  drawBeam(ctx, state);
  drawExtrasNight(ctx, state);
  for (const particle of state.particles) {
    if (particle.area === state.viewArea) {
      drawParticle(ctx, particle, art);
    }
  }
  drawWishes(ctx, state, art, glow);
  drawReading(ctx, state, art);
  drawDizzy(ctx, state, art);
  drawMarker(ctx, state, art);
  ctx.restore();
  if (outside) {
    drawSnowfall(ctx, state.time, cx, cy, view);
    drawSky(ctx, state, cx, cy);
  }
  drawExtrasSky(ctx, state);
  drawErrandArrow(ctx, state, cx, cy);
  drawLens(ctx, state, view);
  drawOverview(ctx, state, art);
  const dark = fadeDarkness(state);
  if (dark > 0) {
    ctx.fillStyle = `rgba(6, 4, 12, ${String(dark)})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }
}

/**
 * Draws the speech bubbles, the gate hints and the banner of an achievement
 * onto the visible canvas, at its full resolution so the letters are sharp.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per logical pixel
 * @param art - the sheets, for the achievement's badge
 */
export function drawBubbles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  art: Art,
): void {
  const { cx, cy } = viewCorner(state);
  drawWishLabels(ctx, state, scale, cx, cy);
  ctx.save();
  ctx.font = `bold ${String(Math.round(BUBBLE_FONT * scale))}px system-ui, sans-serif`;
  ctx.textBaseline = "top";
  const ride = state.sleigh;
  for (const char of state.chars) {
    if (
      char.bubble !== null &&
      state.fade === null &&
      state.overview === null &&
      char.area === state.viewArea
    ) {
      const height = currentProfile(char).height;
      let x = (char.x - cx) * scale;
      const seat = jetskiLift(state, char) + placeLift(state, char);
      let y =
        (char.y - char.altitude - seat - height - HEAD_GAP * 2 - cy) * scale;
      if (ride !== null && isRiding(state, char)) {
        // In the sleigh: the words come from the sleigh.
        x = (ride.x - cx) * scale;
        y = (ride.y - ride.altitude - height - cy) * scale;
      }
      bubble(ctx, char.bubble.text, x, y, scale);
    }
  }
  if (state.spy === null && state.overview === null) {
    drawKeyHint(ctx, state, scale, cx, cy);
  }
  drawGateHints(ctx, state, scale, cx, cy);
  drawTownLabels(ctx, state, scale, cx, cy);
  drawJetskiSigns(ctx, state, scale, cx, cy);
  drawPlaceSigns(ctx, state, scale, cx, cy);
  const speak = (text: string, x: number, y: number): void => {
    ctx.font = `bold ${String(Math.round(BUBBLE_FONT * scale))}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    bubble(ctx, text, x, y, scale);
  };
  drawExtrasTexts(ctx, state, scale, cx, cy, speak);
  drawEastTexts(ctx, state, scale, cx, cy, speak);
  ctx.restore();
  drawOverviewLabels(ctx, state, scale);
  drawSpyCaption(ctx, state, scale);
  drawToast(ctx, state, art, scale);
}

/** The top left of the view, map px: the camera, shaken by a loud guitar. */
function viewCorner(state: GameState): { cx: number; cy: number } {
  const shake = shakeOffset(state);
  return {
    cx: snap(state.camera.x) + shake.x,
    cy: snap(state.camera.y) + shake.y,
  };
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
    blit(ctx, art[room.sheet], room.rect, 0, 0);
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
  const lifts = floatLifts(state);
  for (let ty = ty0; ty <= ty1; ty += 1) {
    for (let tx = tx0; tx <= tx1; tx += 1) {
      const index = ty * map.cols + tx;
      const small = map.small[index];
      const bits = map.fence[index];
      if (small !== null) {
        const look = smallLook(state, map.area, index, small);
        const changed = look === "changed" ? CHANGED_ART[small] : undefined;
        const felled = look === "changed" && small === "smallTree";
        const place = smallPicture(small, changed, felled, tx, ty);
        const rect = place.rect;
        const sheet = art[place.sheet];
        const bottom = (ty + 1) * TILE;
        const lift = lifts.get(index) ?? 0;
        items.push({
          depth: bottom,
          draw: () => {
            blit(
              ctx,
              sheet,
              rect,
              tx * TILE + HALF - rect[2] / 2,
              bottom - rect[3] + place.dy - lift,
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

/**
 * The picture of a small object in a cell: as built, changed, a stack, a
 * flag of either colour, or the stump of a felled fir.
 */
function smallPicture(
  small: SmallObjectKind,
  changed: ObjectName | undefined,
  felled: boolean,
  tx: number,
  ty: number,
): Picture {
  let picture = SMALL_ART[small];
  if (felled) {
    picture = STUMP;
  } else if (changed !== undefined) {
    picture = world(changed, picture.dy);
  } else if (small === "parcels") {
    picture = PARCEL_ART[hash(tx, ty) % PARCEL_ART.length];
  } else if (small === "flag") {
    picture = FLAG_ART[hash(tx, ty) % FLAG_ART.length];
  }
  return picture;
}

/** One big object: its picture centred on its footprint, and what moves on it. */
function drawBig(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  object: PlacedObject,
): void {
  const size = footprint(object.kind);
  const place = bigPicture(state, object);
  const rect = place.rect;
  const left = object.tx * TILE + (size.cols * TILE - rect[2]) / 2;
  const bottom = (object.ty + size.rows) * TILE + place.dy;
  blit(ctx, art[place.sheet], rect, left, bottom - rect[3]);
  drawProp(ctx, art, state, object.kind, left, bottom);
  drawTownProp(ctx, art, state, object.kind, left, bottom);
  drawEastProp(ctx, art, state, object.kind, left, bottom);
  drawPlaceProp(ctx, art, state, object.kind, left, bottom);
  drawExtraProp(ctx, art, state, object.kind, left, bottom);
}

/**
 * The picture of a big object right now: the heap of letters shrinks, the
 * mailbox raises its flag, a target wobbles, the tree stand holds a tree.
 */
function bigPicture(state: GameState, object: PlacedObject): Picture {
  let picture = BIG_ART[object.kind];
  const east = eastPicture(state, object);
  if (object.kind === "letterPile") {
    picture = PILE_ART[pileLook(state)];
  } else if (east !== null) {
    picture = { ...picture, rect: east };
  }
  return picture;
}

/** Where a big object's picture has its bottom left corner. */
function bigCorner(object: PlacedObject): { x: number; y: number } {
  const size = footprint(object.kind);
  const place = BIG_ART[object.kind];
  const rect = place.rect;
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
  lift: number,
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
  } else if (char.moving && lift <= 0) {
    // Seated on a horse or a jetski the legs keep still.
    frames = poses.walk;
    index = Math.floor(char.stride) % WALK_FRAMES;
  }
  const rect = showFrame(char, poses, time) ?? frames[index % frames.length];
  if (char.show?.kind === "nap") {
    // Curled up in the straw instead of standing.
    const sleep = BUILDINGS.rudolfSleep;
    blit(ctx, art.buildings, sleep, char.x - sleep[2] / 2, char.y - sleep[3]);
  } else {
    drawStanding(ctx, char, art, time, figure.anchor, rect, lift);
  }
}

/** One character standing, walking or flying, Rudolf's nose aglow. */
function drawStanding(
  ctx: CanvasRenderingContext2D,
  char: Character,
  art: Art,
  time: number,
  anchor: readonly [number, number],
  rect: SpriteRect,
  lift: number,
): void {
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
    char.x - anchor[0],
    char.y - anchor[1] - char.altitude - hopLift(char) - lift,
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
  // Outside the lights are faint by day and bright at night.
  const boost = lightBoost(state);
  const glow: GlowFn = (x, y, size, rgb, power) => {
    const radius = size * boost.reach;
    if (
      x > cx - radius &&
      x < cx + view.w + radius &&
      y > cy - radius &&
      y < cy + view.h + radius
    ) {
      glowAt(ctx, x, y, radius, rgb, Math.min(1, power * boost.strength));
    }
  };
  for (const object of map.objects) {
    const corner = bigCorner(object);
    propLights(glow, state.time, object.kind, corner.x, corner.y);
  }
  drawPortraitEyes(ctx, state);
  townLights(glow, state);
  eastLights(glow, state);
  jetskiLights(glow, state);
  placeLights(glow, state);
  extrasLights(glow, state);
  const lamp = OBJECTS.lamp;
  const flicker = 1 + Math.sin(state.time * LAMP_FLICKER) * LAMP_FLICKER_SIZE;
  for (let ty = 0; ty < map.rows; ty += 1) {
    for (let tx = 0; tx < map.cols; tx += 1) {
      const cell = ty * map.cols + tx;
      if (
        map.small[cell] === "lamp" &&
        (map.area !== "outdoors" || lampLit(state, cell))
      ) {
        const x = tx * TILE + HALF;
        const y = (ty + 1) * TILE - lamp[3] + LAMP_LIGHT;
        if (
          x > cx - LAMP_GLOW &&
          x < cx + view.w + LAMP_GLOW &&
          y > cy - LAMP_GLOW &&
          y < cy + view.h + LAMP_GLOW
        ) {
          glow(x, y, LAMP_GLOW * flicker, "255, 190, 80", LAMP_STRENGTH);
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
    case "soot": {
      const radius = 1.5 + t * 5;
      ctx.fillStyle = `rgba(60, 52, 60, ${String(0.7 * (1 - t))})`;
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
    case "cookie": {
      ctx.fillStyle = "#6a3e1e";
      ctx.fillRect(snap(particle.x - 1.5), snap(particle.y - 1.5), 3, 3);
      ctx.fillStyle = "#d8964a";
      ctx.fillRect(snap(particle.x - 1), snap(particle.y - 1), 2, 2);
      ctx.fillStyle = SPRINKLES[particle.tint % SPRINKLES.length];
      ctx.fillRect(snap(particle.x - 0.5), snap(particle.y - 1), 0.5, 0.5);
      break;
    }
    case "flour": {
      const radius = 2 + t * 6;
      ctx.fillStyle = `rgba(252, 248, 240, ${String(0.75 * (1 - t))})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "zzz": {
      // A little "z" that grows as it rises.
      const size = 2 + t * 2;
      const x = snap(particle.x + Math.sin(particle.age * 3) * 2);
      const y = snap(particle.y);
      ctx.globalAlpha = Math.min(1, (1 - t) * 2);
      ctx.fillStyle = "#f4f0ff";
      ctx.fillRect(x, y, size, 0.5);
      ctx.fillRect(x, y + size, size, 0.5);
      for (let k = 0; k < size * 2; k += 1) {
        ctx.fillRect(snap(x + size - (k + 1) / 2), snap(y + k / 2), 0.5, 0.5);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "spray": {
      // Snow, ice dust or water thrown up behind a jetski.
      ctx.fillStyle = SPRAY_COLORS[particle.tint % SPRAY_COLORS.length];
      ctx.globalAlpha = Math.min(1, (1 - t) * 2);
      ctx.fillRect(snap(particle.x - 0.5), snap(particle.y - 0.5), 1.5, 1.5);
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
    case "heart": {
      // A small pixel heart of joy, fading as it rises.
      const x = snap(particle.x - 2.5);
      const y = snap(particle.y - 2);
      ctx.globalAlpha = Math.min(1, (1 - t) * 2);
      ctx.fillStyle = "#8a1a3a";
      ctx.fillRect(x, y, 2, 1.5);
      ctx.fillRect(x + 3, y, 2, 1.5);
      ctx.fillRect(x - 0.5, y + 0.5, 6, 2);
      ctx.fillRect(x + 0.5, y + 2.5, 4, 1);
      ctx.fillRect(x + 1.5, y + 3.5, 2, 1);
      ctx.fillStyle = "#ff5a7a";
      ctx.fillRect(x + 0.5, y + 0.5, 1, 1);
      ctx.fillRect(x + 3.5, y + 0.5, 1, 1);
      ctx.fillRect(x, y + 1, 5, 1.5);
      ctx.fillRect(x + 1, y + 2.5, 3, 1);
      ctx.fillRect(x + 2, y + 3.5, 1, 0.5);
      ctx.globalAlpha = 1;
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
  let y =
    char.y - char.altitude - jetskiLift(state, char) - placeLift(state, char);
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
