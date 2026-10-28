/**
 * The moving and glowing bits of the places: the toy machine's gears, lamps,
 * belt and toys, the flames in the fireplace and on the candles, the blinking
 * amplifiers, the portrait's eyes, the lights in and around the houses and
 * the flying sleigh.
 *
 * @module
 * @remarks
 * Places on a picture are counted in map px from its bottom left corner, y
 * upwards as negative - the same corner the picture stands on.
 */
import { MACHINE_PARTS } from "@/games/weihnachtsmann/engine/interior-data";
import {
  machineCorner,
  toyPosition,
} from "@/games/weihnachtsmann/engine/interact";
import type {
  BigObjectKind,
  GameState,
  ToyKind,
} from "@/games/weihnachtsmann/engine/types";
import {
  FIGURES,
  OBJECTS,
  type ObjectName,
  type SpriteRect,
} from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** A light round a picture: place, radius (map px), colour and strength. */
type PropLight = {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly rgb: string;
  readonly strength: number;
  /** How much it flickers, 0 (steady) to about 0.2. */
  readonly flicker: number;
};

/** Draws a glow; handed in by the caller so both files share one look. */
export type GlowFn = (
  x: number,
  y: number,
  radius: number,
  rgb: string,
  strength: number,
) => void;

/** Frames of the gears, the fireplace flames and the toys. */
const GEARS_BIG: readonly ObjectName[] = [
  "gearBig0",
  "gearBig1",
  "gearBig2",
  "gearBig3",
];
const GEARS_SMALL: readonly ObjectName[] = [
  "gearSmall0",
  "gearSmall1",
  "gearSmall2",
  "gearSmall3",
];
const FLAMES: readonly ObjectName[] = ["flame0", "flame1", "flame2"];
const TOY_ART: Readonly<Record<ToyKind, ObjectName>> = {
  teddy: "toyTeddy",
  train: "toyTrain",
  doll: "toyDoll",
  ball: "toyBall",
  present: "toyPresent",
};
const BELT_TOYS: readonly ObjectName[] = Object.values(TOY_ART);

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the
   pictures, speeds and colours of the animations, picked by eye */
/** Where things sit on the machine's picture. */
const MACHINE = {
  gearBig: [14, -22],
  gearSmall: [22, -31],
  lampsX: 24,
  lampsY: -36,
  lampGap: 4,
  lamps: 6,
} as const;

/** How fast the gears turn and the lamps blink, frames per second. */
const GEAR_FPS = 6;
const LAMP_FPS = 4;

/** Teeth of the big and the small gear: the small one turns faster. */
const GEAR_RATIO = 10 / 7;

/** The lamp colours. */
const LAMP_COLORS: readonly string[] = [
  "#ff5050",
  "#60ff80",
  "#ffe060",
  "#60c0ff",
];

/** Belt speed, map px per second, and the gap between two toys on it. */
const BELT_SPEED = 9;
const BELT_GAP = 13;

/** Flame frames per second. */
const FLAME_FPS = 8;

/** Where the fireplace flames stand. */
const FIRE_AT = [14, -21] as const;

/** Candle tips on the candelabra and the organ. */
const CANDLES: Readonly<
  Partial<Record<BigObjectKind, readonly (readonly [number, number])[]>>
> = {
  candelabra: [
    [2, -37.5],
    [8, -39.5],
    [14, -37.5],
  ],
  organ: [
    [5.5, -52],
    [58.5, -52],
  ],
};

/** The amplifier lamp is lit while a sine wave stays above this. */
const AMP_DUTY = -0.4;

/** One art pixel: half a map px. */
const HALF_PX = 0.5;

/** Radius of the bright core of Rudolf's nose, map px. */
const NOSE_CORE = 3;

/** The red lamp on each amplifier head. */
const AMP_LED = [27, -55] as const;

/** Lights belonging to each kind of picture. */
const LIGHTS: Readonly<Partial<Record<BigObjectKind, readonly PropLight[]>>> = {
  dome: [
    {
      x: 80,
      y: -40,
      radius: 80,
      rgb: "255, 190, 90",
      strength: 0.16,
      flicker: 0,
    },
    {
      x: 80,
      y: -14,
      radius: 34,
      rgb: "255, 200, 110",
      strength: 0.35,
      flicker: 0.04,
    },
  ],
  grantelMain: [
    {
      x: 14,
      y: -25,
      radius: 16,
      rgb: "230, 70, 100",
      strength: 0.3,
      flicker: 0.08,
    },
    {
      x: 59,
      y: -25,
      radius: 16,
      rgb: "180, 90, 230",
      strength: 0.3,
      flicker: 0.08,
    },
  ],
  grantelWing: [
    {
      x: 24,
      y: -27,
      radius: 22,
      rgb: "230, 80, 110",
      strength: 0.3,
      flicker: 0.1,
    },
  ],
  fireplace: [
    {
      x: 24,
      y: -12,
      radius: 52,
      rgb: "255, 140, 50",
      strength: 0.4,
      flicker: 0.12,
    },
  ],
  toyMachine: [
    {
      x: 35,
      y: -34,
      radius: 24,
      rgb: "140, 255, 170",
      strength: 0.14,
      flicker: 0.1,
    },
  ],
  candelabra: [
    {
      x: 8,
      y: -38,
      radius: 36,
      rgb: "255, 170, 70",
      strength: 0.5,
      flicker: 0.15,
    },
  ],
  organ: [
    {
      x: 32,
      y: -52,
      radius: 40,
      rgb: "255, 170, 70",
      strength: 0.35,
      flicker: 0.15,
    },
  ],
  ampStack: [
    {
      x: 27,
      y: -55,
      radius: 8,
      rgb: "255, 40, 40",
      strength: 0.35,
      flicker: 0.2,
    },
  ],
};

/** The portrait's eyes on Grantelbart's wall, map px in the room. */
const PORTRAIT_EYES: readonly (readonly [number, number])[] = [
  [173, 29],
  [179, 29],
];

/** How far the pupils move, map px: sideways and up or down. */
const PUPIL_X = 1;
const PUPIL_Y = 0.5;

/** How far away one has to be for the pupils to turn fully, map px. */
const TILE_SPAN = 24;

/** The sleigh picture: where its runners' middle is, from its top left. */
const SLEIGH_ANCHOR = [18, 24] as const;

/** Santa in the sleigh: behind its middle, and how deep he sits. */
const SANTA_SEAT = { x: -6, y: -9 } as const;

/** Rudolf ahead of the sleigh, and where the harness meets him. */
const RUDOLF_LEAD = { x: 34, y: -6 } as const;
const HARNESS_FROM = { x: 14, y: -14 } as const;
const HARNESS_TO = { x: 26, y: -20 } as const;

/** Rudolf's nose while pulling, from his feet. */
const PULL_NOSE = { x: 14, y: -19 } as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Draws what moves on a picture, right after the picture itself.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 * @param kind - which picture
 * @param left - its left edge, map px
 * @param bottom - its bottom edge, map px
 */
export function drawProp(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  kind: BigObjectKind,
  left: number,
  bottom: number,
): void {
  const time = state.time;
  switch (kind) {
    case "toyMachine":
      drawMachine(ctx, art, time, left, bottom);
      break;
    case "fireplace": {
      const frame = FLAMES[Math.floor(time * FLAME_FPS) % FLAMES.length];
      blit(
        ctx,
        art.world,
        OBJECTS[frame],
        left + FIRE_AT[0],
        bottom + FIRE_AT[1],
      );
      break;
    }
    case "ampStack":
      if (Math.sin(time * Math.PI * 2) > AMP_DUTY) {
        ctx.fillStyle = "#ff3030";
        ctx.fillRect(snap(left + AMP_LED[0]), snap(bottom + AMP_LED[1]), 1, 1);
      }
      break;
    default:
      break;
  }
  for (const [x, y] of CANDLES[kind] ?? []) {
    candleFlame(ctx, left + x, bottom + y, time + x);
  }
}

/**
 * The lights round a picture.
 *
 * @param glow - draws one light
 * @param time - seconds, for the flicker
 * @param kind - which picture
 * @param left - its left edge, map px
 * @param bottom - its bottom edge, map px
 */
export function propLights(
  glow: GlowFn,
  time: number,
  kind: BigObjectKind,
  left: number,
  bottom: number,
): void {
  for (const light of LIGHTS[kind] ?? []) {
    // Two waves of different speed make a restless, candle-like flicker.
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- flicker speeds, radians per second
    const wave = Math.sin(time * 7 + left) * 0.6 + Math.sin(time * 13.3) * 0.4;
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
 * The toys the machine just made, flying into the sack.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 */
export function drawFlyingToys(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
): void {
  const corner = machineCorner(state.maps.workshop);
  if (state.viewArea === "workshop" && corner !== null) {
    for (const toy of state.toys) {
      const at = toyPosition(corner, toy);
      const rect = OBJECTS[TOY_ART[toy.kind]];
      blit(ctx, art.world, rect, at.x - rect[2] / 2, at.y - rect[3] / 2);
    }
  }
}

/**
 * The portrait's eyes, following the character the player steers.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 */
export function drawPortraitEyes(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  if (state.viewArea === "grantelHouse") {
    const char = state.chars[state.active];
    ctx.fillStyle = "#2a1a24";
    for (const [ex, ey] of PORTRAIT_EYES) {
      const ox = Math.max(
        -PUPIL_X,
        Math.min(PUPIL_X, (char.x - ex) / TILE_SPAN),
      );
      const oy = char.y - ey > TILE_SPAN ? PUPIL_Y : 0;
      ctx.fillRect(snap(ex - HALF_PX + ox), snap(ey - HALF_PX + oy), 1, 1);
    }
  }
}

/**
 * The sleigh up in the air, Santa in it and Rudolf pulling ahead.
 *
 * @param ctx - the buffer, in map px
 * @param art - the sheets
 * @param state - the game
 * @param glow - draws a light, for Rudolf's nose
 */
export function drawFlyingSleigh(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  glow: GlowFn,
): void {
  const ride = state.sleigh;
  if (ride !== null) {
    const ahead = ride.dir === "right" ? 1 : -1;
    const mirror = ride.dir === "left";
    const x = ride.x;
    const y = ride.y - ride.altitude;
    if (ride.riders.includes("santa")) {
      const santa = FIGURES.santa;
      blit(
        ctx,
        art.figures,
        santa.side.idle[0],
        x + SANTA_SEAT.x * ahead - santa.anchor[0],
        y + SANTA_SEAT.y - santa.anchor[1],
        mirror,
      );
    }
    const sleigh = OBJECTS.sleigh;
    blit(
      ctx,
      art.world,
      sleigh,
      mirror ? x - (sleigh[2] - SLEIGH_ANCHOR[0]) : x - SLEIGH_ANCHOR[0],
      y - SLEIGH_ANCHOR[1],
      mirror,
    );
    if (ride.riders.includes("rudolf")) {
      drawPuller(ctx, art, state, x, y, ahead, glow);
    }
  }
}

/** Rudolf flying ahead of the sleigh on his harness. */
function drawPuller(
  ctx: CanvasRenderingContext2D,
  art: Art,
  state: GameState,
  x: number,
  y: number,
  ahead: number,
  glow: GlowFn,
): void {
  const rudolf = FIGURES.rudolf;
  const frames: readonly SpriteRect[] = rudolf.side.fly;
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- flapping speed, frames per second
  const frame = frames[Math.floor(state.time * 8) % frames.length];
  const rx = x + RUDOLF_LEAD.x * ahead;
  const ry = y + RUDOLF_LEAD.y;
  ctx.strokeStyle = "#e8b830";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(snap(x + HARNESS_FROM.x * ahead), snap(y + HARNESS_FROM.y));
  ctx.lineTo(snap(x + HARNESS_TO.x * ahead), snap(y + HARNESS_TO.y));
  ctx.stroke();
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- nose glow size and strength, as on the ground
  glow(rx + PULL_NOSE.x * ahead, ry + PULL_NOSE.y, 18, "255, 40, 40", 0.5);
  blit(
    ctx,
    art.figures,
    frame,
    rx - rudolf.anchor[0],
    ry - rudolf.anchor[1],
    ahead < 0,
  );
  glow(
    rx + PULL_NOSE.x * ahead,
    ry + PULL_NOSE.y,
    NOSE_CORE,
    "255, 240, 220",
    1,
  );
}

/** The lamps, belt and gears of the machine, and toys riding its belt. */
function drawMachine(
  ctx: CanvasRenderingContext2D,
  art: Art,
  time: number,
  left: number,
  bottom: number,
): void {
  const gearFrame = Math.floor(time * GEAR_FPS);
  const big = OBJECTS[GEARS_BIG[gearFrame % GEARS_BIG.length]];
  const small =
    OBJECTS[
      GEARS_SMALL[
        GEARS_SMALL.length -
          1 -
          (Math.floor(time * GEAR_FPS * GEAR_RATIO) % GEARS_SMALL.length)
      ]
    ];
  blit(
    ctx,
    art.world,
    big,
    left + MACHINE.gearBig[0] - big[2] / 2,
    bottom + MACHINE.gearBig[1] - big[3] / 2,
  );
  blit(
    ctx,
    art.world,
    small,
    left + MACHINE.gearSmall[0] - small[2] / 2,
    bottom + MACHINE.gearSmall[1] - small[3] / 2,
  );
  const blink = Math.floor(time * LAMP_FPS);
  for (let k = 0; k < MACHINE.lamps; k += 1) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- every fourth beat a lamp is dark
    const on = (k * 3 + blink) % 4 !== 0;
    ctx.fillStyle = on
      ? LAMP_COLORS[(k + blink) % LAMP_COLORS.length]
      : "#3a3a4a";
    ctx.fillRect(
      snap(left + MACHINE.lampsX + k * MACHINE.lampGap),
      snap(bottom + MACHINE.lampsY),
      2,
      2,
    );
  }
  const beltY = bottom + MACHINE_PARTS.beltY;
  const length = MACHINE_PARTS.beltTo - MACHINE_PARTS.beltFrom;
  const shift = (time * BELT_SPEED) % 2;
  ctx.fillStyle = "#1e1e26";
  for (let x = 0; x < length; x += 2) {
    ctx.fillRect(
      snap(left + MACHINE_PARTS.beltFrom + x + shift),
      snap(beltY + 1),
      HALF_PX,
      1,
    );
  }
  const lap = length + BELT_GAP;
  const fall = MACHINE_PARTS.sack[0] - MACHINE_PARTS.beltTo;
  for (let k = 0; k * BELT_GAP < lap; k += 1) {
    const run = time * BELT_SPEED + k * BELT_GAP;
    const along = run % lap;
    const rect =
      OBJECTS[BELT_TOYS[(k + Math.floor(run / lap)) % BELT_TOYS.length]];
    const over = along - length;
    if (over < fall) {
      // Off the end of the belt it drops into the sack.
      const drop = over > 0 ? (over * over) / 2 : 0;
      blit(
        ctx,
        art.world,
        rect,
        left + MACHINE_PARTS.beltFrom + along - rect[2] / 2,
        beltY - rect[3] + drop,
      );
    }
  }
}

/** A small flickering candle flame. */
function candleFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- flicker speed and height
  const tall = Math.sin(time * 11) > 0 ? 2.5 : 2;
  ctx.fillStyle = "#ff9a30";
  ctx.fillRect(snap(x - HALF_PX), snap(y - tall), 1, tall);
  ctx.fillStyle = "#fff2a0";
  ctx.fillRect(snap(x - HALF_PX), snap(y - 1), 1, 1);
}
