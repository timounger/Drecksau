/**
 * Drawing the village: the reindeer in their boxes (hungry ones dream of a
 * carrot), the oven glowing with a tray inside, cookies on the rack, the heap
 * of letters, the lost present glinting in the maze, whatever somebody
 * carries over the head, the Weihnachtsmann reading a letter - and the warm
 * light in and round the five buildings, the signs at the doors and the
 * continents over the sorting shelf in sharp text.
 *
 * @module
 * @remarks
 * Places on a picture are counted in map px from its bottom left corner, y
 * upwards as negative, as in `render-props.ts`.
 */
import {
  STABLE_BOXES,
  STABLE_GATE_ROW,
  SORT_ROW,
  SORT_SLOTS,
} from "@/games/weihnachtsmann/engine/building-data";
import { doorUsable } from "@/games/weihnachtsmann/engine/cave";
import { TILE, footprint, inBox } from "@/games/weihnachtsmann/engine/map";
import { currentProfile } from "@/games/weihnachtsmann/engine/movement";
import { PILE_MAX } from "@/games/weihnachtsmann/engine/post";
import { presentPoint } from "@/games/weihnachtsmann/engine/store";
import type {
  BigObjectKind,
  CarryKind,
  Character,
  GameMap,
  GameState,
} from "@/games/weihnachtsmann/engine/types";
import { BUILDING_NAMES, TOWN_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { BUILDINGS, OVEN_MOUTH, RACK_SHELVES } from "./building-atlas";
import { OUTDOOR } from "./outdoor-atlas";
import type { GlowFn } from "./render-props";
import { EFFECTS, type EffectName, type SpriteRect } from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw, at the depth of its foot line. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** A light: where on a picture, how wide, what colour, how strong, how restless. */
type Light = {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly rgb: string;
  readonly strength: number;
  readonly flicker: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the
   pictures, sizes, speeds and colours, picked by eye */
/** Warm windows and lanterns of the five buildings, outside. */
const HOUSE_LIGHTS: Readonly<Partial<Record<BigObjectKind, readonly Light[]>>> =
  {
    stableHouse: [
      {
        x: 20,
        y: -30,
        radius: 16,
        rgb: "255, 190, 90",
        strength: 0.3,
        flicker: 0.05,
      },
      {
        x: 76,
        y: -30,
        radius: 16,
        rgb: "255, 190, 90",
        strength: 0.3,
        flicker: 0.05,
      },
      {
        x: 48,
        y: -12,
        radius: 30,
        rgb: "255, 200, 110",
        strength: 0.25,
        flicker: 0.08,
      },
    ],
    postHouse: [
      {
        x: 16,
        y: -30,
        radius: 16,
        rgb: "255, 200, 110",
        strength: 0.3,
        flicker: 0.04,
      },
      {
        x: 64,
        y: -30,
        radius: 16,
        rgb: "255, 200, 110",
        strength: 0.3,
        flicker: 0.04,
      },
      {
        x: 40,
        y: -60,
        radius: 14,
        rgb: "255, 230, 160",
        strength: 0.25,
        flicker: 0.03,
      },
    ],
    bakeryHouse: [
      {
        x: 25,
        y: -40,
        radius: 26,
        rgb: "255, 170, 70",
        strength: 0.35,
        flicker: 0.1,
      },
      {
        x: 79,
        y: -21,
        radius: 14,
        rgb: "255, 190, 90",
        strength: 0.3,
        flicker: 0.06,
      },
      {
        x: 61,
        y: -10,
        radius: 22,
        rgb: "255, 180, 80",
        strength: 0.25,
        flicker: 0.08,
      },
    ],
    observatory: [
      {
        x: 40,
        y: -100,
        radius: 12,
        rgb: "255, 214, 120",
        strength: 0.3,
        flicker: 0.05,
      },
      {
        x: 48,
        y: -70,
        radius: 12,
        rgb: "255, 214, 120",
        strength: 0.3,
        flicker: 0.05,
      },
      {
        x: 55,
        y: -140,
        radius: 18,
        rgb: "120, 160, 255",
        strength: 0.25,
        flicker: 0.1,
      },
    ],
    storeHouse: [
      {
        x: 18,
        y: -40,
        radius: 18,
        rgb: "255, 200, 110",
        strength: 0.3,
        flicker: 0.05,
      },
      {
        x: 110,
        y: -40,
        radius: 18,
        rgb: "255, 200, 110",
        strength: 0.3,
        flicker: 0.05,
      },
      {
        x: 64,
        y: -60,
        radius: 26,
        rgb: "255, 214, 90",
        strength: 0.2,
        flicker: 0.04,
      },
    ],
  };

/** Light inside each building, map px in the room. */
const ROOM_LIGHTS: Readonly<Partial<Record<string, readonly Light[]>>> = {
  stable: [
    {
      x: 40,
      y: 50,
      radius: 60,
      rgb: "255, 190, 90",
      strength: 0.22,
      flicker: 0.08,
    },
    {
      x: 280,
      y: 50,
      radius: 60,
      rgb: "255, 190, 90",
      strength: 0.22,
      flicker: 0.08,
    },
    {
      x: 160,
      y: 140,
      radius: 90,
      rgb: "255, 200, 120",
      strength: 0.12,
      flicker: 0.04,
    },
  ],
  postOffice: [
    {
      x: 160,
      y: 100,
      radius: 110,
      rgb: "255, 220, 150",
      strength: 0.16,
      flicker: 0.03,
    },
    {
      x: 270,
      y: 120,
      radius: 40,
      rgb: "255, 200, 110",
      strength: 0.2,
      flicker: 0.06,
    },
  ],
  bakery: [
    {
      x: 160,
      y: 120,
      radius: 120,
      rgb: "255, 220, 160",
      strength: 0.12,
      flicker: 0.03,
    },
  ],
  observatory: [
    {
      x: 144,
      y: 20,
      radius: 60,
      rgb: "150, 180, 255",
      strength: 0.25,
      flicker: 0.06,
    },
    {
      x: 56,
      y: 100,
      radius: 30,
      rgb: "255, 180, 80",
      strength: 0.35,
      flicker: 0.15,
    },
  ],
  giftStore: [
    {
      x: 96,
      y: 24,
      radius: 90,
      rgb: "255, 214, 120",
      strength: 0.22,
      flicker: 0.05,
    },
    {
      x: 224,
      y: 24,
      radius: 90,
      rgb: "255, 214, 120",
      strength: 0.22,
      flicker: 0.05,
    },
    {
      x: 352,
      y: 24,
      radius: 90,
      rgb: "255, 214, 120",
      strength: 0.22,
      flicker: 0.05,
    },
  ],
};

/** The glow of the oven's mouth while it bakes, from the oven's picture. */
const OVEN_GLOW = { radius: 46, rgb: "255, 130, 40", strength: 0.45 } as const;

/** Where the oven stands in the bakery, its picture's bottom left, map px. */
const OVEN_CORNER = { x: 128, y: 80 } as const;

/** What each carried thing looks like. */
const CARRY_ART: Readonly<
  Record<
    Exclude<CarryKind, "letter" | "found" | "treat">,
    readonly ["figures" | "buildings" | "outdoor", SpriteRect]
  >
> = {
  fir: ["outdoor", OUTDOOR.firCarried],
  carrot: ["figures", EFFECTS.wishCarrot],
  dough: ["buildings", BUILDINGS.dough],
  trayRaw: ["buildings", BUILDINGS.trayRaw],
  trayBaked: ["buildings", BUILDINGS.trayBaked],
  trayBurnt: ["buildings", BUILDINGS.trayBurnt],
  present: ["buildings", BUILDINGS.lostGift],
};

/** The lost things of the errands, and the treats of the three booths. */
const FOUND_ART: readonly SpriteRect[] = [
  OUTDOOR.mitten,
  OUTDOOR.scarf,
  OUTDOOR.glasses,
];
const TREAT_ART: readonly SpriteRect[] = [
  OUTDOOR.punchCup,
  OUTDOOR.gingerHeart,
  OUTDOOR.chestnutBag,
];

/** The colours of the five continents' letters and compartments. */
export const CONTINENT_COLORS: readonly string[] = [
  "#3a6ad8",
  "#d83a3a",
  "#e8c030",
  "#3ab84a",
  "#9a4ad8",
];

/** The wish pictures of the letters, in the order of their texts. */
const LETTER_ICONS: readonly EffectName[] = [
  "wishTeddy",
  "wishTrain",
  "wishBall",
  "wishFish",
  "wishPillow",
  "wishGuitar",
  "wishCarrot",
];

/** How far over a reindeer's feet the thought cloud floats, map px. */
const REINDEER_HEAD = 30;

/** Where a reindeer's feet are inside its frame. */
const REINDEER_ANCHOR = [20, 38] as const;

/** How far the reindeer stand back behind their gates, map px. */
const REINDEER_BACK = 2;

/** Breathing and munching speeds, frames per second. */
const IDLE_FPS = 1.4;
const MUNCH_FPS = 7;

/** Where a carried thing is held: beside the head, map px, and its bob. */
const CARRY_BESIDE = { x: 9, y: 8 } as const;
const CARRY_BOB = 0.6;

/** How the present glints: speed of its little bob. */
const GIFT_BOB = 2;

/** How near the steered character must be to a door for its sign, map px. */
const SIGN_NEAR = 34;

/** How far below the doorway the sign hangs, map px: under the feet. */
const SIGN_BELOW = 6;

/** Sharp text: sign and label sizes, map px. */
const SIGN_FONT = 6;
const SIGN_PAD = 3;
const SLOT_FONT = 4.5;

/** Stack of the thought cloud over Santa reading. */
const CLOUD_ICON = { x: 5, y: 1 } as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- sizes of the marks
   and flicker speeds on the panel, picked by eye */
/**
 * Which picture of the heap of letters fits how many are left.
 *
 * @param state - the game
 * @returns 0 (empty basket) to 3 (a mountain)
 */
export function pileLook(state: GameState): number {
  const pile = state.world.post.pile;
  return pile <= 0
    ? 0
    : Math.min(3, 1 + Math.floor(((pile - 1) * 3) / PILE_MAX));
}

/**
 * What moves on a village picture: the tray in the oven, the cookies on the
 * rack.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 * @param kind - which picture
 * @param left - its left edge, map px
 * @param bottom - its bottom edge, map px
 */
export function drawTownProp(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  kind: BigObjectKind,
  left: number,
  bottom: number,
): void {
  const bakery = state.world.bakery;
  if (kind === "oven" && bakery.oven !== "empty") {
    const top = bottom - BUILDINGS.oven[3];
    const tray =
      bakery.oven === "burnt"
        ? BUILDINGS.trayBurnt
        : bakery.oven === "done"
          ? BUILDINGS.trayBaked
          : BUILDINGS.trayRaw;
    if (bakery.oven === "baking") {
      // Embers behind the tray, flickering.
      ctx.globalAlpha = 0.75 + Math.sin(state.time * 13) * 0.2;
      ctx.fillStyle = "#ff7a2a";
      ctx.fillRect(
        snap(left + OVEN_MOUTH.x + 1),
        snap(top + OVEN_MOUTH.y + OVEN_MOUTH.h / 2),
        OVEN_MOUTH.w - 2,
        OVEN_MOUTH.h / 2 - 1,
      );
      ctx.globalAlpha = 1;
    }
    blit(
      ctx,
      art.buildings,
      tray,
      left + OVEN_MOUTH.x + (OVEN_MOUTH.w - tray[2]) / 2,
      top + OVEN_MOUTH.y + OVEN_MOUTH.h - tray[3] - 1,
    );
  } else if (kind === "coolRack") {
    const top = bottom - BUILDINGS.coolRack[3];
    const tray = BUILDINGS.trayBaked;
    for (let k = 0; k < bakery.rack; k += 1) {
      blit(
        ctx,
        art.buildings,
        tray,
        left + (BUILDINGS.coolRack[2] - tray[2]) / 2,
        top + RACK_SHELVES[k] - tray[3] + 2,
      );
    }
  }
}

/**
 * Adds the reindeer, the lost present and what everybody carries to what is
 * drawn in depth order.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place on screen
 * @param art - the sheets
 * @param items - what is drawn, sorted later
 */
export function collectTown(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  if (map.area === "stable") {
    collectReindeer(ctx, state, art, items, map.rows * TILE);
  }
  const gift = map.area === "giftStore" ? presentPoint(state) : null;
  if (gift !== null) {
    const rect = BUILDINGS.lostGift;
    const bob = Math.abs(Math.sin(state.time * GIFT_BOB));
    items.push({
      depth: gift.y,
      draw: () => {
        blit(
          ctx,
          art.buildings,
          rect,
          gift.x - rect[2] / 2,
          gift.y - rect[3] - bob,
        );
      },
    });
  }
  for (const char of state.chars) {
    const carry = char.carry;
    if (carry !== null && char.area === map.area && char.show?.kind !== "nap") {
      items.push({
        depth: char.altitude > 1 ? char.y + map.rows * TILE + 1 : char.y + 1,
        draw: () => {
          drawCarried(ctx, state, art, char, carry.kind, carry.tint);
        },
      });
    }
  }
}

/**
 * The thought cloud over the Weihnachtsmann while he reads a letter, with the
 * wish in it.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param art - the sheets
 */
export function drawReading(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
): void {
  const reading = state.world.post.reading;
  const santa = state.chars.find((char) => char.id === "santa");
  if (
    reading !== null &&
    santa !== undefined &&
    santa.area === state.viewArea
  ) {
    const cloud = EFFECTS.thought;
    const left = santa.x - cloud[2] - 2;
    const top = santa.y - currentProfile(santa).height - cloud[3] - 2;
    blit(ctx, art.figures, cloud, left, top);
    blit(
      ctx,
      art.figures,
      EFFECTS[LETTER_ICONS[reading.wish % LETTER_ICONS.length]],
      left + CLOUD_ICON.x,
      top + CLOUD_ICON.y,
    );
  }
}

/**
 * The light of the five buildings: windows outside, lamps, oven and stars
 * inside.
 *
 * @param glow - draws one light
 * @param state - the game
 */
export function townLights(glow: GlowFn, state: GameState): void {
  const map = state.maps[state.viewArea];
  for (const object of map.objects) {
    const lights = HOUSE_LIGHTS[object.kind];
    if (lights !== undefined) {
      const size = footprint(object.kind);
      const rect = houseRect(object.kind);
      const left = object.tx * TILE + (size.cols * TILE - rect[2]) / 2;
      const bottom = (object.ty + size.rows) * TILE;
      shine(glow, state.time, lights, left, bottom);
    }
  }
  shine(glow, state.time, ROOM_LIGHTS[state.viewArea] ?? [], 0, 0);
  const oven = state.world.bakery.oven;
  if (state.viewArea === "bakery" && oven !== "empty") {
    const top = OVEN_CORNER.y - BUILDINGS.oven[3];
    glow(
      OVEN_CORNER.x + OVEN_MOUTH.x + OVEN_MOUTH.w / 2,
      top + OVEN_MOUTH.y + OVEN_MOUTH.h / 2,
      OVEN_GLOW.radius,
      oven === "burnt" ? "120, 80, 60" : OVEN_GLOW.rgb,
      OVEN_GLOW.strength,
    );
  }
}

/**
 * The signs at the doors outside, the continents over the sorting shelf and
 * the wish Santa reads, in sharp text.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawTownLabels(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
): void {
  const char = state.chars[state.active];
  const map = state.maps[state.viewArea];
  if (state.fade === null && state.overview === null) {
    if (
      map.area === "outdoors" &&
      char.area === "outdoors" &&
      char.altitude < 1 &&
      char.bubble === null
    ) {
      for (const door of map.doors) {
        const x = (door.tx + door.w / 2) * TILE;
        const y = (door.ty + 1 / 2) * TILE;
        if (
          door.to !== "outdoors" &&
          doorUsable(state, door) &&
          (inBox(door, char.x, char.y - 1, SIGN_NEAR / 2) ||
            Math.hypot(x - char.x, y - char.y) < SIGN_NEAR)
        ) {
          sign(
            ctx,
            BUILDING_NAMES[door.to],
            TOWN_TEXTS.enter,
            (x - cx) * scale,
            ((door.ty + 1) * TILE + SIGN_BELOW - cy) * scale,
            scale,
          );
        }
      }
    }
    if (map.area === "postOffice") {
      slotNames(ctx, scale, cx, cy);
    }
    readingLabel(ctx, state, scale, cx, cy);
  }
}

/** The four reindeer behind their gates, and the carrot they dream of. */
function collectReindeer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  items: Drawable[],
  sky: number,
): void {
  const stable = state.world.stable;
  STABLE_BOXES.forEach((tx, index) => {
    const x = (tx + 3 / 2) * TILE;
    const y = STABLE_GATE_ROW * TILE + REINDEER_BACK;
    const munching = stable.munch[index] > 0;
    const light = index % 2 === 1;
    const frames = light
      ? [BUILDINGS.reindeerLight0, BUILDINGS.reindeerLight1]
      : [BUILDINGS.reindeer0, BUILDINGS.reindeer1];
    const frame =
      frames[
        Math.floor(
          (state.time + index * 0.7) * (munching ? MUNCH_FPS : IDLE_FPS),
        ) % 2
      ];
    const nod = munching ? Math.floor(state.time * MUNCH_FPS) % 2 : 0;
    items.push({
      depth: y,
      draw: () => {
        blit(
          ctx,
          art.buildings,
          frame,
          x - REINDEER_ANCHOR[0],
          y - REINDEER_ANCHOR[1] + nod,
        );
      },
    });
    if (stable.full[index] <= 0) {
      const cloud = EFFECTS.thought;
      const bob = Math.sin(state.time * 3 + index) * 1;
      items.push({
        depth: sky + 1,
        draw: () => {
          const left = x + 6;
          const top = y - REINDEER_HEAD - cloud[3] / 2 + bob;
          blit(ctx, art.figures, cloud, left, top);
          blit(
            ctx,
            art.figures,
            EFFECTS.wishCarrot,
            left + CLOUD_ICON.x,
            top + CLOUD_ICON.y,
          );
        },
      });
    }
  });
}

/** One carried thing over somebody's head; a letter shows its continent's colour. */
function drawCarried(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  char: Character,
  kind: CarryKind,
  tint: number,
): void {
  // Held up beside the head, clear of the marker over it.
  const top =
    char.y - char.altitude - currentProfile(char).height + CARRY_BESIDE.y;
  const cx = char.x + CARRY_BESIDE.x;
  const bob = Math.sin(state.time * Math.PI) * CARRY_BOB;
  if (kind === "letter") {
    const rect = BUILDINGS.letter;
    const left = cx - rect[2] / 2;
    const y = top - rect[3] + bob;
    blit(ctx, art.buildings, rect, left, y);
    ctx.fillStyle = CONTINENT_COLORS[tint % CONTINENT_COLORS.length];
    ctx.fillRect(snap(left + rect[2] - 3.5), snap(y + 1), 2, 2);
  } else if (kind === "found" || kind === "treat") {
    const list = kind === "found" ? FOUND_ART : TREAT_ART;
    const rect = list[tint % list.length];
    blit(ctx, art.outdoor, rect, cx - rect[2] / 2, top - rect[3] + bob);
  } else {
    const [sheet, rect] = CARRY_ART[kind];
    blit(ctx, art[sheet], rect, cx - rect[2] / 2, top - rect[3] + bob);
  }
}

/** The picture of a building outside, for its size. */
function houseRect(kind: BigObjectKind): SpriteRect {
  const rects: Readonly<Partial<Record<BigObjectKind, SpriteRect>>> = {
    stableHouse: BUILDINGS.stableHouse,
    postHouse: BUILDINGS.postHouse,
    bakeryHouse: BUILDINGS.bakeryHouse,
    observatory: BUILDINGS.observatory,
    storeHouse: BUILDINGS.storeHouse,
  };
  return rects[kind] ?? BUILDINGS.stableHouse;
}

/** Shines a list of lights, flickering, from a corner. */
function shine(
  glow: GlowFn,
  time: number,
  lights: readonly Light[],
  left: number,
  bottom: number,
): void {
  for (const light of lights) {
    const wave =
      Math.sin(time * 7 + light.x) * 0.6 + Math.sin(time * 13.3) * 0.4;
    glow(
      left + light.x,
      bottom + light.y,
      light.radius * (1 + wave * light.flicker),
      light.rgb,
      light.strength,
    );
  }
}

/**
 * A dark sign with a gold edge: a name and a hint, centred under a point.
 *
 * @param ctx - the visible canvas
 * @param text - the name, in bold
 * @param hint - the line below it
 * @param x - the middle, canvas px
 * @param below - the top edge, canvas px
 * @param scale - canvas pixels per map px
 */
export function sign(
  ctx: CanvasRenderingContext2D,
  text: string,
  hint: string,
  x: number,
  below: number,
  scale: number,
): void {
  const font = SIGN_FONT * scale;
  const pad = SIGN_PAD * scale;
  ctx.font = `bold ${String(Math.round(font))}px system-ui, sans-serif`;
  const w =
    Math.max(ctx.measureText(text).width, ctx.measureText(hint).width) +
    pad * 2;
  const h = font * 2 + pad * 2 + scale;
  const left = Math.max(2, Math.min(ctx.canvas.width - w - 2, x - w / 2));
  const y = Math.min(ctx.canvas.height - h - 2, below);
  ctx.fillStyle = "rgba(30, 14, 30, 0.86)";
  ctx.strokeStyle = "#e8b830";
  ctx.lineWidth = Math.max(1, scale / 2);
  ctx.beginPath();
  ctx.roundRect(left, y, w, h, scale * 2);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffe9a8";
  ctx.fillText(text, left + w / 2, y + pad);
  ctx.font = `${String(Math.round(font))}px system-ui, sans-serif`;
  ctx.fillStyle = "#f4f0ff";
  ctx.fillText(hint, left + w / 2, y + pad + font + scale);
}

/** The continents' names on the plates of the sorting shelf. */
function slotNames(
  ctx: CanvasRenderingContext2D,
  scale: number,
  cx: number,
  cy: number,
): void {
  ctx.font = `bold ${String(Math.round(SLOT_FONT * scale))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, scale);
  SORT_SLOTS.forEach((tx, index) => {
    const x = ((tx + 1) * TILE - cx) * scale;
    const y = ((SORT_ROW + 1) * TILE - BUILDINGS.sortShelf[3] + 1 - cy) * scale;
    ctx.strokeStyle = "#1a1210";
    ctx.fillStyle = CONTINENT_COLORS[index];
    ctx.strokeText(TOWN_TEXTS.continents[index], x, y);
    ctx.fillStyle = "#fffdf6";
    ctx.fillText(TOWN_TEXTS.continents[index], x, y);
  });
}

/** Who wrote the letter Santa reads, and what they wish for. */
function readingLabel(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
): void {
  const reading = state.world.post.reading;
  const santa = state.chars.find((char) => char.id === "santa");
  if (
    reading !== null &&
    santa !== undefined &&
    santa.area === state.viewArea
  ) {
    const cloud = EFFECTS.thought;
    const text = `${TOWN_TEXTS.letterSenders[reading.from % TOWN_TEXTS.letterSenders.length]} ${TOWN_TEXTS.letterWish} ${TOWN_TEXTS.letterWishes[reading.wish % TOWN_TEXTS.letterWishes.length]}`;
    const x = (santa.x - 2 - cloud[2] / 2 - cx) * scale;
    const y =
      (santa.y - currentProfile(santa).height - cloud[3] - 3 - cy) * scale;
    ctx.font = `bold ${String(Math.round(SLOT_FONT * scale))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, scale);
    ctx.strokeStyle = "#2a2230";
    ctx.fillStyle = "#ffe9a8";
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
