/**
 * The seven dwarfs on the climb, and the one waiting for them at the top.
 *
 * @module
 * @remarks
 * The fourth section is the one that goes up the mountain, and anybody who has
 * ever heard a story knows who walks up a mountain in single file: seven small
 * men with beards and pointed hats, each one carrying his pick, on their way
 * home from the pit.
 *
 * Scenery only: no rule knows about them, nothing can be driven into them and
 * they do not move. Where they walk comes from the **hill** rather than from a
 * metre count: the module looks for the longest rising run inside that section
 * and strings the seven of them along it, so if the ground is ever redrawn the
 * line of them climbs whatever slope is there instead. Where the rise levels
 * off stands a girl in a blue bodice and a yellow skirt, waving back down the
 * hill at them - a column of seven walking home is a column walking home to
 * somebody.
 */
import { blend } from "@/games/rv-there-yet/components/palette";
import { ROUTE_STEP } from "@/games/rv-there-yet/engine/types";

/** How many of them there are, which is not a number anybody may change. */
export const DWARF_COUNT = 7;

/** Which section they climb, counted from the first. */
const SECTION = 3;

/** How tall one of them is, in metres - bigger than life, like all the rest. */
export const DWARF_TALL = 1.5;

/** How they are strung out along the slope. */
const WALK = {
  /** How far out from the middle of the road the line of them passes. */
  out: 7,
  /** How much of the rise they take up, and where along it the first one is. */
  spread: 0.82,
  first: 0.09,
  /** How much taller or shorter one of them may come out. */
  vary: 0.16,
} as const;

/** One of them, on his way up. */
export type Dwarf = {
  /** Where along the route he walks, in metres. */
  readonly at: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
  /** Which of the seven he is, which decides his hat and his size. */
  readonly index: number;
};

/**
 * Where the seven of them are walking on this route, if anywhere.
 *
 * @param sections - where the sections of the route begin, in metres
 * @param heights - the ground of the route, one point every step
 * @returns the seven, from the last one up to the leader
 * @remarks
 * Strung out over the climb rather than bunched: a queue of seven with gaps
 * between them reads as a column on the march, and seven of them shoulder to
 * shoulder reads as a hedge.
 */
export function dwarfPlaces(
  sections: readonly number[],
  heights: readonly number[],
): Dwarf[] {
  const from = sections[SECTION];
  const to = sections[SECTION + 1];
  if (from === undefined || to === undefined) {
    return [];
  }
  const hill = climbIn(heights, from, to);
  if (hill === null) {
    return [];
  }
  const long = hill.to - hill.from;
  return Array.from({ length: DWARF_COUNT }, (_, index) => ({
    at:
      hill.from +
      long * WALK.first +
      (long * WALK.spread * index) / (DWARF_COUNT - 1),
    out: WALK.out,
    index,
  }));
}

/** How tall the one at the top is, in metres. */
export const SNOW_TALL = 1.9;

/** Where she waits, past the last of the rise. */
const CREST = {
  /** How far beyond the top of the climb she stands, in metres. */
  past: 6,
  /** How far out from the middle of the road. */
  out: 7,
} as const;

/**
 * Where she waits on this route, if anywhere.
 *
 * @param sections - where the sections of the route begin, in metres
 * @param heights - the ground of the route, one point every step
 * @returns the one place, or nothing where nothing climbs
 * @remarks
 * At the **top** of the same rise the seven of them are on, because that is
 * what she is doing there: waiting for them to arrive.
 */
export function snowPlaces(
  sections: readonly number[],
  heights: readonly number[],
): { readonly at: number; readonly out: number }[] {
  const from = sections[SECTION];
  const to = sections[SECTION + 1];
  if (from === undefined || to === undefined) {
    return [];
  }
  const hill = climbIn(heights, from, to);
  if (hill === null) {
    return [];
  }
  return [{ at: hill.to + CREST.past, out: CREST.out }];
}

/**
 * The longest stretch of rising ground inside a section.
 *
 * @param heights - the ground of the route, one point every step
 * @param from - where the section begins, in metres
 * @param to - where it ends, in metres
 * @returns the climb, or nothing if the section only goes down
 */
function climbIn(
  heights: readonly number[],
  from: number,
  to: number,
): { readonly from: number; readonly to: number } | null {
  const first = Math.max(0, Math.ceil(from / ROUTE_STEP));
  const last = Math.min(heights.length - 1, Math.floor(to / ROUTE_STEP));
  let best = { from: 0, to: 0 };
  let start = first;
  for (let at = first; at < last; at++) {
    if (heights[at + 1] <= heights[at]) {
      start = at + 1;
      continue;
    }
    if (at + 1 - start > best.to - best.from) {
      best = { from: start, to: at + 1 };
    }
  }
  if (best.to === best.from) {
    return null;
  }
  return { from: best.from * ROUTE_STEP, to: best.to * ROUTE_STEP };
}

/** The shape of one of them, in shares of how tall he is. */
const SHAPE = {
  /** The boots and the legs over them. */
  boot: 0.09,
  bootWide: 0.14,
  leg: 0.24,
  legThick: 0.09,
  stride: 0.11,
  /** The smock: where its hem hangs, how wide there and at the shoulders. */
  smock: 0.56,
  hem: 0.42,
  waist: 0.3,
  belt: 0.05,
  /** The beard, which is most of him. */
  beard: 0.26,
  /** The head, the nose in it and the hat over it. */
  head: 0.13,
  headUp: 0.66,
  nose: 0.05,
  hat: 0.19,
  hatUp: 0.36,
  hatBrim: 0.06,
  /** The arm on this side, and the pick over his shoulder. */
  arm: 0.15,
  armThick: 0.07,
  pick: 0.44,
  pickThin: 0.05,
} as const;

/**
 * The finer proportions, as shares of the parts they belong to.
 *
 * @remarks
 * All of them are "how far along that piece", which is why they live together
 * rather than each carrying a name three words long.
 */
const PART = {
  /** Where the shading of the smock starts. */
  shadeFrom: 0.2,
  /** How far the hat leans back, and how far the brim stands out. */
  hatBack: 0.35,
  brimOut: 1.25,
  /** Where the pick sits on the shoulder, and how far its head reaches. */
  pickFrom: 0.4,
  pickHead: 0.3,
  /** How far the nose sticks out of the beard. */
  noseOut: 0.9,
} as const;

/** A hat each, so seven of them are seven and not one man seven times. */
const HATS = [
  "#c0392b",
  "#2f6fa8",
  "#e0a020",
  "#4f8a3d",
  "#7a4fa0",
  "#b85a2a",
  "#3aa6a0",
] as const;

/** The smock under each hat, in the same order. */
const SMOCKS = [
  "#6b7f9e",
  "#8a6b4a",
  "#5f7a52",
  "#94572f",
  "#4a6172",
  "#7c6a92",
  "#7d6b3f",
] as const;

/** Beard white, boot brown, and the rest of what they are made of. */
const PAINT = {
  beard: "#ece7dd",
  skin: "#e8b98f",
  nose: "#d99f76",
  boot: "#4a3524",
  belt: "#3b2c1e",
  haft: "#8a6238",
  steel: "#b9c2c8",
  dark: "#2b2520",
} as const;

/** How much darker the shaded side of a smock is. */
const SHADE = 0.3;

/** A whole turn, for the arcs, and the smallest thing worth drawing. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/** Where one of them is drawn: his boots, and how many pixels a metre is. */
export type Place = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/**
 * Draws one dwarf, walking.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his boots are, and how many pixels a metre is
 * @param dwarf - which of the seven he is
 * @remarks
 * Three quarters on and mid-stride, with the pick over one shoulder. At this
 * size the hat and the beard are the whole of him - a face would be a smudge,
 * and the beard is where a face would go anyway.
 */
export function drawDwarf(
  ctx: CanvasRenderingContext2D,
  place: Place,
  dwarf: Dwarf,
): void {
  const step = dwarf.index % 2 === 0 ? 1 : -1;
  const tall = DWARF_TALL * place.scale * (1 + step * WALK.vary * THIN);
  const { x, y } = place;
  // The legs, one forward and one back, so the column is on the march.
  ctx.fillStyle = PAINT.boot;
  const legThick = Math.max(1, tall * SHAPE.legThick);
  for (const side of [-1, 1]) {
    const along = x + side * step * tall * SHAPE.stride;
    ctx.fillRect(
      along - legThick / 2,
      y - tall * SHAPE.leg,
      legThick,
      tall * SHAPE.leg,
    );
    ctx.fillRect(
      along - (tall * SHAPE.bootWide) / 2,
      y - tall * SHAPE.boot,
      tall * SHAPE.bootWide,
      tall * SHAPE.boot,
    );
  }
  drawSmock(ctx, place, tall, dwarf);
  drawPick(ctx, place, tall);
  drawBeard(ctx, place, tall, dwarf);
}

/**
 * The smock and the belt over it.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his boots are
 * @param tall - how tall he came out, in pixels
 * @param dwarf - which of the seven he is, for the colour
 */
function drawSmock(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
  dwarf: Dwarf,
): void {
  const { x, y } = place;
  const smock = SMOCKS[dwarf.index % SMOCKS.length];
  ctx.fillStyle = smock;
  ctx.beginPath();
  ctx.moveTo(x - (tall * SHAPE.hem) / 2, y - tall * (SHAPE.smock - SHAPE.hem));
  ctx.lineTo(x + (tall * SHAPE.hem) / 2, y - tall * (SHAPE.smock - SHAPE.hem));
  ctx.lineTo(x + (tall * SHAPE.waist) / 2, y - tall * SHAPE.smock);
  ctx.lineTo(x - (tall * SHAPE.waist) / 2, y - tall * SHAPE.smock);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blend(smock, PAINT.dark, SHADE);
  ctx.beginPath();
  ctx.moveTo(
    x + tall * SHAPE.hem * PART.shadeFrom,
    y - tall * (SHAPE.smock - SHAPE.hem),
  );
  ctx.lineTo(x + (tall * SHAPE.hem) / 2, y - tall * (SHAPE.smock - SHAPE.hem));
  ctx.lineTo(x + (tall * SHAPE.waist) / 2, y - tall * SHAPE.smock);
  ctx.lineTo(x + tall * SHAPE.waist * PART.shadeFrom, y - tall * SHAPE.smock);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.belt;
  ctx.fillRect(
    x - (tall * SHAPE.hem) / 2,
    y - tall * (SHAPE.smock - SHAPE.hem + SHAPE.belt),
    tall * SHAPE.hem,
    tall * SHAPE.belt,
  );
}

/**
 * The pick over his shoulder, which is what says he is walking home from work.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his boots are
 * @param tall - how tall he came out, in pixels
 */
function drawPick(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
): void {
  const { x, y } = place;
  const hold = { x: x + (tall * SHAPE.waist) / 2, y: y - tall * SHAPE.smock };
  ctx.strokeStyle = PAINT.haft;
  ctx.lineWidth = Math.max(1, tall * SHAPE.pickThin);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hold.x + tall * SHAPE.pick * PART.pickFrom, hold.y);
  ctx.lineTo(
    hold.x - tall * SHAPE.pick * (1 - PART.pickFrom),
    hold.y - tall * SHAPE.pick,
  );
  ctx.stroke();
  ctx.strokeStyle = PAINT.steel;
  ctx.beginPath();
  ctx.moveTo(
    hold.x -
      tall * SHAPE.pick * (1 - PART.pickFrom) -
      tall * SHAPE.pick * PART.pickHead,
    hold.y - tall * SHAPE.pick * (1 - PART.pickHead),
  );
  ctx.lineTo(
    hold.x -
      tall * SHAPE.pick * (1 - PART.pickFrom) +
      tall * SHAPE.pick * PART.pickHead,
    hold.y - tall * SHAPE.pick,
  );
  ctx.stroke();
  // The arm holding it, over the smock.
  ctx.strokeStyle = PAINT.skin;
  ctx.lineWidth = Math.max(1, tall * SHAPE.armThick);
  ctx.beginPath();
  ctx.moveTo(x, y - tall * SHAPE.smock);
  ctx.lineTo(hold.x, hold.y + tall * SHAPE.arm * THIN);
  ctx.stroke();
}

/**
 * The beard, the face over it and the hat over that.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his boots are
 * @param tall - how tall he came out, in pixels
 * @param dwarf - which of the seven he is, for the hat
 */
function drawBeard(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
  dwarf: Dwarf,
): void {
  const { x, y } = place;
  const head = { x, y: y - tall * SHAPE.headUp };
  // The beard: a broad wedge from under the nose down over the chest.
  ctx.fillStyle = PAINT.beard;
  ctx.beginPath();
  ctx.moveTo(x - tall * SHAPE.head, head.y);
  ctx.lineTo(x + tall * SHAPE.head, head.y);
  ctx.lineTo(
    x + tall * SHAPE.beard * THIN,
    y - tall * (SHAPE.headUp - SHAPE.beard),
  );
  ctx.lineTo(
    x - tall * SHAPE.beard * THIN,
    y - tall * (SHAPE.headUp - SHAPE.beard),
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * SHAPE.head, Math.PI, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.nose;
  ctx.beginPath();
  ctx.arc(
    head.x + tall * SHAPE.head * PART.noseOut,
    head.y,
    tall * SHAPE.nose,
    0,
    FULL,
  );
  ctx.fill();
  // The hat: a brim over the eyes and a long point leaning back.
  ctx.fillStyle = HATS[dwarf.index % HATS.length];
  ctx.beginPath();
  ctx.ellipse(
    head.x,
    head.y - tall * SHAPE.head * THIN,
    tall * SHAPE.hat * PART.brimOut * THIN,
    tall * SHAPE.hatBrim,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(
    head.x - tall * SHAPE.hat * THIN,
    head.y - tall * SHAPE.head * THIN,
  );
  ctx.lineTo(
    head.x + tall * SHAPE.hat * THIN,
    head.y - tall * SHAPE.head * THIN,
  );
  ctx.lineTo(
    head.x - tall * SHAPE.hat * PART.hatBack,
    head.y - tall * SHAPE.hatUp,
  );
  ctx.closePath();
  ctx.fill();
}

/** The one at the top, in shares of how tall she is. */
const LADY = {
  /** The legs and the shoes under the hem. */
  leg: 0.16,
  legThick: 0.07,
  legApart: 0.07,
  shoe: 0.05,
  /** The skirt: where it starts, how wide at the hem and at the waist. */
  skirt: 0.5,
  hem: 0.42,
  waist: 0.22,
  /** The bodice above it, and the white collar at the throat. */
  bodice: 0.74,
  collar: 0.09,
  /** The puffed sleeves standing off the shoulders. */
  sleeve: 0.075,
  sleeveUp: 0.68,
  /** The arms: one raised and waving, one hanging. */
  arm: 0.24,
  armThick: 0.055,
  waveUp: 1.1,
  /** The head, the black bob over it and the bow in that. */
  head: 0.12,
  headUp: 0.84,
  hair: 0.15,
  hairDown: 0.045,
  bow: 0.06,
  bowUp: 0.12,
  /** The eyes and the cheeks in her face. */
  eye: 0.018,
  eyeApart: 0.045,
  cheek: 0.03,
  cheekApart: 0.085,
} as const;

/** Her colours: blue bodice, red sleeves, yellow skirt, and a red bow. */
const DRESS = {
  bodice: "#2f5fa8",
  bodiceDeep: "#20406f",
  sleeve: "#c0392b",
  skirt: "#f0c419",
  skirtDeep: "#c39a10",
  collar: "#f7f2e6",
  skin: "#f6d3b4",
  hair: "#1d1a19",
  bow: "#c0392b",
  cheek: "#e8806c",
  shoe: "#3b2c1e",
} as const;

/**
 * Draws the one waiting at the top, waving down the hill.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are, and how many pixels a metre is
 * @param facing - which way she waves, -1 back down the road or 1 on along it
 * @remarks
 * Front on with one arm up, because that is what waiting at the top of a path
 * and waving looks like. Blue bodice, red sleeves, yellow skirt and a black
 * bob with a red bow are the whole of the likeness; at this size a face is two
 * dots and two cheeks.
 */
export function drawSnow(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const tall = SNOW_TALL * place.scale;
  const { x, y } = place;
  // Legs and shoes under the hem.
  ctx.fillStyle = DRESS.skin;
  const legThick = Math.max(1, tall * LADY.legThick);
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * LADY.legApart - legThick / 2,
      y - tall * LADY.leg,
      legThick,
      tall * LADY.leg,
    );
  }
  ctx.fillStyle = DRESS.shoe;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * LADY.legApart - legThick,
      y - tall * LADY.shoe,
      legThick * 2,
      tall * LADY.shoe,
    );
  }
  // The yellow skirt, with its shaded side.
  ctx.fillStyle = DRESS.skirt;
  ctx.beginPath();
  ctx.moveTo(x - (tall * LADY.hem) / 2, y - tall * (LADY.skirt - LADY.hem));
  ctx.lineTo(x + (tall * LADY.hem) / 2, y - tall * (LADY.skirt - LADY.hem));
  ctx.lineTo(x + (tall * LADY.waist) / 2, y - tall * LADY.skirt);
  ctx.lineTo(x - (tall * LADY.waist) / 2, y - tall * LADY.skirt);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blend(DRESS.skirt, DRESS.skirtDeep, SHADE);
  ctx.beginPath();
  ctx.moveTo(
    x + tall * LADY.hem * PART.shadeFrom,
    y - tall * (LADY.skirt - LADY.hem),
  );
  ctx.lineTo(x + (tall * LADY.hem) / 2, y - tall * (LADY.skirt - LADY.hem));
  ctx.lineTo(x + (tall * LADY.waist) / 2, y - tall * LADY.skirt);
  ctx.lineTo(x + tall * LADY.waist * PART.shadeFrom, y - tall * LADY.skirt);
  ctx.closePath();
  ctx.fill();
  // The blue bodice over it, and the white collar at the throat.
  ctx.fillStyle = DRESS.bodice;
  ctx.fillRect(
    x - (tall * LADY.waist) / 2,
    y - tall * LADY.bodice,
    tall * LADY.waist,
    tall * (LADY.bodice - LADY.skirt),
  );
  ctx.fillStyle = blend(DRESS.bodice, DRESS.bodiceDeep, SHADE);
  ctx.fillRect(
    x + tall * LADY.waist * PART.shadeFrom,
    y - tall * LADY.bodice,
    tall * LADY.waist * PART.shadeFrom,
    tall * (LADY.bodice - LADY.skirt),
  );
  ctx.fillStyle = DRESS.collar;
  ctx.fillRect(
    x - (tall * LADY.collar) / 2,
    y - tall * LADY.bodice,
    tall * LADY.collar,
    tall * LADY.collar * THIN,
  );
  drawWave(ctx, place, tall, facing);
  drawBob(ctx, place, tall);
}

/**
 * Her arms and the puffed sleeves they come out of.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are
 * @param tall - how tall she came out, in pixels
 * @param facing - which way she waves
 */
function drawWave(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
  facing: number,
): void {
  const { x, y } = place;
  const shoulder = y - tall * LADY.sleeveUp;
  ctx.strokeStyle = DRESS.skin;
  ctx.lineWidth = Math.max(1, tall * LADY.armThick);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, shoulder);
  ctx.lineTo(
    x + facing * tall * LADY.arm,
    shoulder - tall * LADY.arm * LADY.waveUp,
  );
  ctx.moveTo(x, shoulder);
  ctx.lineTo(x - facing * tall * LADY.arm * THIN, shoulder + tall * LADY.arm);
  ctx.stroke();
  ctx.fillStyle = DRESS.sleeve;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      x + side * tall * LADY.waist * THIN,
      shoulder,
      tall * LADY.sleeve,
      0,
      FULL,
    );
    ctx.fill();
  }
}

/**
 * Her head: the black bob, the face in it, and the bow on top.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are
 * @param tall - how tall she came out, in pixels
 */
function drawBob(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
): void {
  const head = { x: place.x, y: place.y - tall * LADY.headUp };
  ctx.fillStyle = DRESS.hair;
  ctx.beginPath();
  ctx.ellipse(
    head.x,
    head.y + tall * LADY.hairDown * THIN,
    tall * LADY.hair,
    tall * (LADY.hair + LADY.hairDown),
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = DRESS.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * LADY.head, 0, FULL);
  ctx.fill();
  // The fringe: the bob comes back down over the top of the face.
  ctx.fillStyle = DRESS.hair;
  ctx.beginPath();
  ctx.arc(
    head.x,
    head.y - tall * LADY.hairDown * THIN,
    tall * LADY.hair,
    Math.PI,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = DRESS.cheek;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      head.x + side * tall * LADY.cheekApart,
      head.y + tall * LADY.eyeApart,
      tall * LADY.cheek,
      0,
      FULL,
    );
    ctx.fill();
  }
  ctx.fillStyle = DRESS.hair;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      head.x + side * tall * LADY.eyeApart,
      head.y,
      Math.max(THIN, tall * LADY.eye),
      0,
      FULL,
    );
    ctx.fill();
  }
  // The bow, sitting on the side of the bob.
  ctx.fillStyle = DRESS.bow;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      head.x + side * tall * LADY.bow,
      head.y - tall * (LADY.hair + LADY.bowUp * THIN),
      tall * LADY.bow * THIN,
      0,
      FULL,
    );
    ctx.fill();
  }
}
