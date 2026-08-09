/**
 * The boy with the wand and the spider, halfway through the sixth section.
 *
 * @module
 * @remarks
 * The sixth section is the one that runs through the fog, which is the only
 * stretch of this drive that looks like a forest nobody should be in. Halfway
 * along it, off the road, a boy in a black robe with round glasses holds up a
 * lit wand against a spider the size of a small car.
 *
 * Scenery only: no rule knows about them, nothing can be driven into them and
 * they do not move. Where they stand comes from the **section** rather than
 * from a metre count, so the pair sit in the middle of whatever length that
 * section has.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** Which section they are halfway along, counted from the first. */
const SECTION = 5;

/** Where the two of them stand, in metres. */
const SPOT = {
  /** How far out from the middle of the road the boy stands. */
  out: 6.5,
  /** How much further along and further out the spider is. */
  apart: 7,
  spiderOut: 12,
} as const;

/** Where one of them stands. */
export type Standing = {
  /** Where along the route, in metres. */
  readonly at: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
};

/** The two of them, facing each other. */
export type Duel = {
  /** The boy, nearer the road and nearer the start of the section. */
  readonly boy: Standing;
  /** The spider, out in the trees and further along. */
  readonly spider: Standing;
};

/** How tall the boy is, in metres - bigger than life, like all the rest. */
export const WIZARD_TALL = 2.1;

/** How wide the spider is across the legs, and how high it stands. */
export const SPIDER_WIDE = 6;
export const SPIDER_TALL = 3.2;

/**
 * Where the pair stand on this route, if anywhere.
 *
 * @param sections - where the sections of the route begin, in metres
 * @returns the one duel, or nothing on a route that short
 * @remarks
 * Halfway along the section rather than at a fixed metre, so the two of them
 * stay in the middle of it however long it is cut.
 */
export function duelPlaces(sections: readonly number[]): Duel[] {
  const from = sections[SECTION];
  const to = sections[SECTION + 1];
  if (from === undefined || to === undefined) {
    return [];
  }
  const at = (from + to) / 2;
  return [
    {
      boy: { at, out: SPOT.out },
      spider: { at: at + SPOT.apart, out: SPOT.spiderOut },
    },
  ];
}

/** How the fog thins out around them, in metres and in shares. */
const CLEAR = {
  /** How far either side of the boy the fog is touched at all. */
  half: 26,
  /** Over how many of those metres it thins, so it does not switch on. */
  fade: 14,
  /** How much of the fog is left in the middle of the clearing. */
  left: 0.22,
} as const;

/**
 * How much of the fog is left at a point of the route, from one to nothing.
 *
 * @param sections - where the sections of the route begin, in metres
 * @param here - where the viewer is, in metres
 * @returns the share of the usual fog to paint there
 * @remarks
 * A hole in the weather around the two of them. Without it the whole fight
 * happens behind a grey wall: the fog of that section is thick enough that
 * anything off the road is a rumour, and a fight nobody can see is not worth
 * drawing. It thins over a good dozen metres rather than switching on, because
 * fog that changes between one frame and the next reads as a bug.
 */
export function fogLeft(sections: readonly number[], here: number): number {
  const duel = duelPlaces(sections)[0];
  if (duel === undefined) {
    return 1;
  }
  const away = Math.abs(here - duel.boy.at);
  if (away >= CLEAR.half) {
    return 1;
  }
  const inside = Math.min(1, (CLEAR.half - away) / CLEAR.fade);
  return 1 - inside * (1 - CLEAR.left);
}

/** The boy, in shares of how tall he is. */
const BOY = {
  /** The legs under the robe, and the shoes on them. */
  leg: 0.2,
  legThick: 0.07,
  legApart: 0.08,
  shoe: 0.05,
  /** The robe: where the hem hangs, how wide there and at the shoulders. */
  robe: 0.78,
  hem: 0.4,
  waist: 0.26,
  /** The scarf at the throat, how far it hangs, and the stripe across it. */
  scarf: 0.12,
  scarfDown: 0.16,
  scarfBar: 0.02,
  /** The arm holding the wand up, and the wand itself. */
  arm: 0.26,
  armThick: 0.06,
  shoulder: 0.7,
  wand: 0.34,
  wandThin: 0.025,
  spark: 0.07,
  /** The head, the hair over it and the glasses in front. */
  head: 0.12,
  headUp: 0.84,
  hair: 0.15,
  hairUp: 0.05,
  glass: 0.045,
  glassApart: 0.055,
} as const;

/** The spider, in shares of how wide it is across the legs. */
const SPIDER = {
  /** The abdomen behind and the head end in front, and how high they ride. */
  body: 0.19,
  bodyDeep: 0.14,
  head: 0.11,
  headOn: 0.2,
  ride: 0.32,
  /** The legs: how many a side, how far they reach and how high they arch. */
  legs: 4,
  reach: 0.46,
  arch: 0.3,
  legThin: 0.022,
  /** How far apart the two sides of legs are drawn. */
  side: 0.03,
  /** The eyes on the front of the head, and the fangs under them. */
  eye: 0.014,
  eyeApart: 0.05,
  fang: 0.07,
  fangThin: 0.02,
} as const;

/**
 * The finer proportions, as shares of the parts they belong to.
 *
 * @remarks
 * All of them are "how far along that piece", which is why they live together
 * rather than each carrying a name three words long.
 */
const PART = {
  /** Where the shading of the robe and of the spider's body starts. */
  shadeFrom: 0.25,
  /** How far the wand arm rises, and how far out it reaches. */
  wandUp: 1.05,
  wandOut: 0.85,
  /** Where down the scarf its stripe sits. */
  barAt: 0.55,
  /** Where on the front body the legs are rooted. */
  legRoot: 0.6,
  /** How much shorter and flatter each next pair of legs is. */
  legStep: 0.3,
  archStep: 0.25,
  /** How far the eyes sit up the head, and where the fangs hang from. */
  eyeUp: 0.3,
  fangDown: 0.7,
} as const;

/** Black robe, house red, and the grey-black of the spider. */
const PAINT = {
  robe: "#23252b",
  robeDeep: "#101216",
  scarf: "#8c1c22",
  scarfBar: "#e0c060",
  skin: "#f0c39c",
  hair: "#241a16",
  glass: "#d8dde2",
  wand: "#6b4c2f",
  spark: "#fdf6c8",
  spider: "#3a3630",
  spiderDeep: "#211f1b",
  spiderHair: "#57503f",
  eye: "#d8d2c0",
  fang: "#cdbf9a",
} as const;

/** How much darker a shaded side is. */
const SHADE = 0.3;

/** A whole turn, for the arcs, and the smallest thing worth drawing. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/** Where something is drawn: its feet, and how many pixels a metre is. */
export type Place = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/**
 * Draws the boy with the wand.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his feet are, and how many pixels a metre is
 * @param facing - which way he faces, 1 up the road or -1 back down it
 * @remarks
 * Front on but with the wand arm out towards what he is pointing it at, so
 * that the two of them read as facing each other. The black robe, the round
 * glasses and the lit tip of the wand are the whole of the likeness.
 */
export function drawWizard(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const tall = WIZARD_TALL * place.scale;
  const { x, y } = place;
  ctx.fillStyle = PAINT.robe;
  const legThick = Math.max(1, tall * BOY.legThick);
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * BOY.legApart - legThick / 2,
      y - tall * BOY.leg,
      legThick,
      tall * BOY.leg,
    );
  }
  ctx.fillStyle = PAINT.robeDeep;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * BOY.legApart - legThick,
      y - tall * BOY.shoe,
      legThick * 2,
      tall * BOY.shoe,
    );
  }
  // The robe: a wedge from the shoulders down to a wide hem.
  ctx.fillStyle = PAINT.robe;
  ctx.beginPath();
  ctx.moveTo(x - (tall * BOY.hem) / 2, y - tall * (BOY.leg - BOY.shoe));
  ctx.lineTo(x + (tall * BOY.hem) / 2, y - tall * (BOY.leg - BOY.shoe));
  ctx.lineTo(x + (tall * BOY.waist) / 2, y - tall * BOY.robe);
  ctx.lineTo(x - (tall * BOY.waist) / 2, y - tall * BOY.robe);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blend(PAINT.robe, PAINT.robeDeep, SHADE);
  ctx.beginPath();
  ctx.moveTo(
    x + tall * BOY.hem * PART.shadeFrom,
    y - tall * (BOY.leg - BOY.shoe),
  );
  ctx.lineTo(x + (tall * BOY.hem) / 2, y - tall * (BOY.leg - BOY.shoe));
  ctx.lineTo(x + (tall * BOY.waist) / 2, y - tall * BOY.robe);
  ctx.lineTo(x + tall * BOY.waist * PART.shadeFrom, y - tall * BOY.robe);
  ctx.closePath();
  ctx.fill();
  // The scarf, which is the only colour on him.
  ctx.fillStyle = PAINT.scarf;
  ctx.fillRect(
    x - (tall * BOY.scarf) / 2,
    y - tall * BOY.robe,
    tall * BOY.scarf,
    tall * BOY.scarfDown,
  );
  ctx.fillStyle = PAINT.scarfBar;
  ctx.fillRect(
    x - (tall * BOY.scarf) / 2,
    y - tall * (BOY.robe - BOY.scarfDown * PART.barAt),
    tall * BOY.scarf,
    tall * BOY.scarfBar,
  );
  drawWand(ctx, place, tall, facing);
  drawFace(ctx, place, tall);
}

/**
 * The arm, the wand in it and the light on its tip.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his feet are
 * @param tall - how tall he came out, in pixels
 * @param facing - which way he points it
 */
function drawWand(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
  facing: number,
): void {
  const { x, y } = place;
  const shoulder = y - tall * BOY.shoulder;
  ctx.strokeStyle = PAINT.skin;
  ctx.lineWidth = Math.max(1, tall * BOY.armThick);
  ctx.lineCap = "round";
  const hand = {
    x: x + facing * tall * BOY.arm * PART.wandOut,
    y: shoulder - tall * BOY.arm * THIN,
  };
  ctx.beginPath();
  ctx.moveTo(x, shoulder);
  ctx.lineTo(hand.x, hand.y);
  ctx.moveTo(x, shoulder);
  ctx.lineTo(x - facing * tall * BOY.arm * THIN, shoulder + tall * BOY.arm);
  ctx.stroke();
  const tip = {
    x: hand.x + facing * tall * BOY.wand,
    y: hand.y - tall * BOY.wand * PART.wandUp * THIN,
  };
  ctx.strokeStyle = PAINT.wand;
  ctx.lineWidth = Math.max(1, tall * BOY.wandThin);
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  // The light on the end of it, which is what says this is a fight.
  ctx.fillStyle = PAINT.spark;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, tall * BOY.spark * THIN, 0, FULL);
  ctx.fill();
}

/**
 * His head: hair, face and the round glasses.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his feet are
 * @param tall - how tall he came out, in pixels
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
): void {
  const head = { x: place.x, y: place.y - tall * BOY.headUp };
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.arc(head.x, head.y - tall * BOY.hairUp, tall * BOY.hair, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * BOY.head, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.arc(head.x, head.y - tall * BOY.hairUp, tall * BOY.hair, Math.PI, FULL);
  ctx.fill();
  // The glasses: two rings, which is the whole of who he is.
  ctx.strokeStyle = PAINT.glass;
  ctx.lineWidth = Math.max(1, tall * BOY.wandThin);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      head.x + side * tall * BOY.glassApart,
      head.y,
      tall * BOY.glass,
      0,
      FULL,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(head.x - tall * (BOY.glassApart - BOY.glass), head.y);
  ctx.lineTo(head.x + tall * (BOY.glassApart - BOY.glass), head.y);
  ctx.stroke();
}

/**
 * Draws the spider.
 *
 * @param ctx - the canvas to paint on
 * @param place - where its feet are, and how many pixels a metre is
 * @param facing - which way it faces, -1 back down the road or 1 along it
 * @remarks
 * From the side, with the legs arching up over the body: a spider drawn from
 * above is a stain, and what makes this one frightening is that its knees are
 * higher than the boy's head.
 */
export function drawSpider(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const wide = SPIDER_WIDE * place.scale;
  const { x, y } = place;
  const ride = y - SPIDER_TALL * place.scale * SPIDER.ride;
  // The legs: four to a side, two reaching forward and two back, the far
  // side darker so that eight legs read as eight and not as four.
  ctx.lineWidth = Math.max(1, wide * SPIDER.legThin);
  ctx.lineCap = "round";
  const half = SPIDER.legs / 2;
  const root = x + facing * wide * SPIDER.headOn * PART.legRoot;
  for (let leg = 0; leg < SPIDER.legs; leg++) {
    const ahead = leg < half ? 1 : -1;
    const rank = leg % half;
    const span = wide * SPIDER.reach * (1 - rank * PART.legStep);
    const high = wide * SPIDER.arch * (1 - rank * PART.archStep);
    for (const step of [-1, 1]) {
      ctx.strokeStyle = step > 0 ? PAINT.spider : PAINT.spiderDeep;
      const from = root + step * wide * SPIDER.side;
      const foot = from + facing * ahead * span;
      ctx.beginPath();
      ctx.moveTo(from, ride);
      ctx.quadraticCurveTo((from + foot) * THIN, ride - high, foot, y);
      ctx.stroke();
    }
  }
  // The abdomen behind, then the head end in front of it.
  ctx.fillStyle = PAINT.spider;
  ctx.beginPath();
  ctx.ellipse(
    x - facing * wide * SPIDER.body * THIN,
    ride,
    wide * SPIDER.body,
    wide * SPIDER.bodyDeep,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = blend(PAINT.spider, PAINT.spiderDeep, SHADE);
  ctx.beginPath();
  ctx.ellipse(
    x - facing * wide * SPIDER.body * THIN,
    ride,
    wide * SPIDER.body,
    wide * SPIDER.bodyDeep * PART.shadeFrom,
    0,
    0,
    Math.PI,
  );
  ctx.fill();
  const head = { x: x + facing * wide * SPIDER.headOn, y: ride };
  ctx.fillStyle = PAINT.spiderHair;
  ctx.beginPath();
  ctx.arc(head.x, head.y, wide * SPIDER.head, 0, FULL);
  ctx.fill();
  // The eyes in a row, and the fangs under them.
  ctx.fillStyle = PAINT.eye;
  for (const step of [-1, 1]) {
    for (const row of [0, 1]) {
      ctx.beginPath();
      ctx.arc(
        head.x +
          facing * wide * SPIDER.head * THIN +
          step * wide * SPIDER.eyeApart * THIN,
        head.y - wide * SPIDER.head * PART.eyeUp + row * wide * SPIDER.eye * 2,
        Math.max(THIN, wide * SPIDER.eye),
        0,
        FULL,
      );
      ctx.fill();
    }
  }
  ctx.strokeStyle = PAINT.fang;
  ctx.lineWidth = Math.max(1, wide * SPIDER.fangThin);
  for (const step of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(
      head.x + facing * wide * SPIDER.head * THIN,
      head.y + wide * SPIDER.head * PART.fangDown,
    );
    ctx.lineTo(
      head.x + facing * wide * (SPIDER.head * THIN + SPIDER.fang * THIN),
      head.y +
        wide * (SPIDER.head * PART.fangDown + SPIDER.fang) +
        step * wide * SPIDER.eye,
    );
    ctx.stroke();
  }
}
