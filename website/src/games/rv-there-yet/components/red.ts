/**
 * The girl in the red hood and the wolf, on the last stretch of road.
 *
 * @module
 * @remarks
 * The last section runs through the wood to the chasm, and somewhere along
 * that road stands a girl in a red hood with a basket - and a few metres on,
 * watching her, a grey wolf. Neither of them is going to do anything about it
 * while anybody is looking, which is the joke: the pair have been standing
 * like that in every picture book ever printed.
 *
 * Scenery only: no rule knows about them, nothing can be driven into them and
 * they do not move. Where they stand comes from the **road** rather than from
 * a metre count - between the start of the last section and the lip of the
 * chasm - so if either of those moves, the two of them move with it.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** A stretch of the route, as the chasm is given. */
export type Span = { readonly from: number; readonly to: number };

/** Where one of them stands. */
export type Standing = {
  /** Where along the route, in metres. */
  readonly at: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
};

/** The pair, and which way round they are. */
export type Meeting = {
  /** The girl, nearer the start of the section. */
  readonly girl: Standing;
  /** The wolf, a few paces further on, looking back at her. */
  readonly wolf: Standing;
};

/** How tall she is, in metres - a child, but a good deal bigger than life. */
export const RED_TALL = 1.9;

/** How long and how tall the wolf is, in metres. */
export const WOLF_LONG = 2.4;
export const WOLF_TALL = 1.5;

/** Where along the last stretch they stand. */
const SPOT = {
  /** How far along from the start of the section towards the chasm. */
  share: 0.4,
  /** How much further on the wolf waits, and how far off the road both are. */
  apart: 9,
  out: 7.5,
} as const;

/**
 * Where the pair stand on this route, if anywhere.
 *
 * @param sections - where the sections of the route begin, in metres
 * @param chasms - the chasms of the route
 * @returns the one meeting, or nothing where there is no last stretch
 * @remarks
 * Tied to the two ends of that stretch rather than to a metre count: the last
 * section begins at one and the chasm ends it at the other, and standing four
 * tenths of the way along keeps them clear of both the notice board at the
 * start and the edge at the finish.
 */
export function redPlaces(
  sections: readonly number[],
  chasms: readonly Span[],
): Meeting[] {
  const last = sections[sections.length - 1];
  const edge = chasms[0];
  if (last === undefined || edge === undefined || edge.from <= last) {
    return [];
  }
  const at = last + (edge.from - last) * SPOT.share;
  return [
    {
      girl: { at, out: SPOT.out },
      wolf: { at: at + SPOT.apart, out: SPOT.out },
    },
  ];
}

/** The girl, in shares of how tall she is. */
const GIRL = {
  /** The legs, the white socks on them and the shoes under those. */
  leg: 0.28,
  legThick: 0.075,
  legApart: 0.08,
  sock: 0.16,
  shoe: 0.05,
  /** The skirt: where the hem hangs, how wide there and at the waist. */
  skirt: 0.5,
  hem: 0.4,
  waist: 0.24,
  /** The white underskirt showing beneath it, and the belt over it. */
  under: 0.05,
  belt: 0.04,
  /** The blouse above the belt, and the lacing down its front. */
  blouse: 0.72,
  laces: 3,
  lace: 0.05,
  /** The arms, one of them raised in a wave. */
  arm: 0.26,
  armThick: 0.07,
  shoulder: 0.66,
  /** The head, and the fringe of fair hair under the hood. */
  head: 0.13,
  headUp: 0.8,
  hair: 0.14,
  /** The hood and the cape hanging from it. */
  hood: 0.17,
  hoodUp: 0.05,
  cape: 0.44,
  capeDown: 0.34,
  /** The eyes in her face. */
  eye: 0.018,
  eyeApart: 0.045,
  /** The basket on the raised arm's side. */
  basket: 0.09,
  basketDeep: 0.07,
} as const;

/** The wolf, in shares of how long he is. */
const WOLF = {
  /** The body: how deep it is and how high the back stands. */
  body: 0.56,
  deep: 0.15,
  back: 0.62,
  /** The legs, front and back, and how thick. */
  leg: 0.44,
  legThick: 0.07,
  legApart: 0.11,
  /** The neck and the head, carried low the way a prowling wolf carries it. */
  neck: 0.16,
  head: 0.15,
  headDown: 0.12,
  /** The muzzle out in front of it, and the black nose on the end. */
  muzzle: 0.19,
  muzzleThick: 0.08,
  nose: 0.035,
  /** The ears standing up, and the eye between them. */
  ear: 0.08,
  earApart: 0.05,
  eye: 0.022,
  /** The tail: how long, how bushy, and how far it droops. */
  tail: 0.34,
  tailThick: 0.055,
  tailDown: 0.45,
} as const;

/**
 * The finer proportions, as shares of the parts they belong to.
 *
 * @remarks
 * All of them are "how far along that piece", which is why they live together
 * rather than each carrying a name three words long.
 */
const PART = {
  /** Where the shading of the cape and of the wolf's flank starts. */
  shadeFrom: 0.25,
  /** How far the waving arm rises, and how far out it reaches. */
  waveUp: 1.05,
  waveOut: 0.95,
  /** Where the hood sits behind her head, and how far the cape hangs out. */
  hoodBack: 0.25,
  capeOut: 0.55,
  /** How far the bush of the tail swings out under itself. */
  tailBush: 0.45,
  /** Where along the body the wolf's legs stand. */
  frontLeg: 0.78,
  backLeg: 0.12,
  /** Where the muzzle leaves the head, and how far the ears sit back. */
  muzzleUp: 0.15,
  earBack: 0.55,
} as const;

/** Signal red, wolf grey, and the rest of what the pair are made of. */
const PAINT = {
  cape: "#c0201f",
  capeDeep: "#8a1414",
  skirt: "#cf2a24",
  linen: "#f6f1e4",
  belt: "#241f1c",
  lace: "#241f1c",
  hair: "#e8c15c",
  skin: "#f3c7a0",
  eye: "#2b3a4a",
  shoe: "#a81f1f",
  basket: "#b6803f",
  wolf: "#8d949b",
  wolfDeep: "#5f676e",
  wolfPale: "#d7dbde",
  nose: "#1d1a19",
  glare: "#c0392b",
} as const;

/** How much darker a shaded side is. */
const SHADE = 0.28;

/** A whole turn, for the arcs, and the smallest dot worth drawing. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/** Where something is drawn: its feet, and how many pixels a metre is. */
export type Place = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/**
 * Draws the girl in the red hood.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are, and how many pixels a metre is
 * @remarks
 * Front on, waving, because that is what somebody at the roadside does when
 * something comes up the road. The red hood and cape over a white blouse are
 * the whole of the likeness - at this size the face is two dots.
 */
export function drawRed(ctx: CanvasRenderingContext2D, place: Place): void {
  const tall = RED_TALL * place.scale;
  const { x, y } = place;
  // Legs in white socks, with the red shoes under them.
  ctx.fillStyle = PAINT.skin;
  const legThick = Math.max(1, tall * GIRL.legThick);
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * GIRL.legApart - legThick / 2,
      y - tall * GIRL.leg,
      legThick,
      tall * GIRL.leg,
    );
  }
  ctx.fillStyle = PAINT.linen;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * GIRL.legApart - legThick / 2,
      y - tall * GIRL.sock,
      legThick,
      tall * GIRL.sock,
    );
  }
  ctx.fillStyle = PAINT.shoe;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * GIRL.legApart - legThick,
      y - tall * GIRL.shoe,
      legThick * 2,
      tall * GIRL.shoe,
    );
  }
  drawFrock(ctx, place, tall);
  // The hood and its cape before the arms: the cape hangs over her shoulders,
  // and an arm behind it is an arm nobody can see waving.
  drawHood(ctx, place, tall);
  drawArms(ctx, place, tall);
}

/**
 * The white underskirt, the red skirt over it, the belt and the laced blouse.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are
 * @param tall - how tall she came out, in pixels
 */
function drawFrock(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
): void {
  const { x, y } = place;
  const hem = y - tall * (GIRL.skirt - GIRL.hem);
  ctx.fillStyle = PAINT.linen;
  ctx.fillRect(
    x - (tall * GIRL.hem) / 2,
    hem,
    tall * GIRL.hem,
    tall * GIRL.under,
  );
  ctx.fillStyle = PAINT.skirt;
  ctx.beginPath();
  ctx.moveTo(x - (tall * GIRL.hem) / 2, hem);
  ctx.lineTo(x + (tall * GIRL.hem) / 2, hem);
  ctx.lineTo(x + (tall * GIRL.waist) / 2, y - tall * GIRL.skirt);
  ctx.lineTo(x - (tall * GIRL.waist) / 2, y - tall * GIRL.skirt);
  ctx.closePath();
  ctx.fill();
  // The blouse, and the black lacing crossing down its front.
  ctx.fillStyle = PAINT.linen;
  ctx.fillRect(
    x - (tall * GIRL.waist) / 2,
    y - tall * GIRL.blouse,
    tall * GIRL.waist,
    tall * (GIRL.blouse - GIRL.skirt),
  );
  ctx.strokeStyle = PAINT.lace;
  ctx.lineWidth = Math.max(1, tall * GIRL.lace * THIN);
  for (let lace = 0; lace < GIRL.laces; lace++) {
    const from = y - tall * (GIRL.skirt + GIRL.lace * (lace + 1) * 2);
    ctx.beginPath();
    ctx.moveTo(x - tall * GIRL.lace, from);
    ctx.lineTo(x + tall * GIRL.lace, from - tall * GIRL.lace);
    ctx.moveTo(x + tall * GIRL.lace, from);
    ctx.lineTo(x - tall * GIRL.lace, from - tall * GIRL.lace);
    ctx.stroke();
  }
  ctx.fillStyle = PAINT.belt;
  ctx.fillRect(
    x - (tall * GIRL.waist) / 2,
    y - tall * (GIRL.skirt + GIRL.belt),
    tall * GIRL.waist,
    tall * GIRL.belt,
  );
}

/**
 * Her arms: one hanging with the basket, one up and waving.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are
 * @param tall - how tall she came out, in pixels
 */
function drawArms(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
): void {
  const { x, y } = place;
  const shoulder = y - tall * GIRL.shoulder;
  ctx.strokeStyle = PAINT.skin;
  ctx.lineWidth = Math.max(1, tall * GIRL.armThick);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, shoulder);
  ctx.lineTo(
    x - tall * GIRL.arm * PART.waveOut,
    shoulder - tall * GIRL.arm * PART.waveUp,
  );
  ctx.moveTo(x, shoulder);
  ctx.lineTo(x + tall * GIRL.arm, shoulder + tall * GIRL.arm);
  ctx.stroke();
  // The basket hanging off the low hand.
  ctx.fillStyle = PAINT.basket;
  ctx.fillRect(
    x + tall * GIRL.arm - (tall * GIRL.basket) / 2,
    shoulder + tall * GIRL.arm,
    tall * GIRL.basket,
    tall * GIRL.basketDeep,
  );
}

/**
 * The hood, the cape hanging from it, and the face inside.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are
 * @param tall - how tall she came out, in pixels
 */
function drawHood(
  ctx: CanvasRenderingContext2D,
  place: Place,
  tall: number,
): void {
  const { x, y } = place;
  const head = { x, y: y - tall * GIRL.headUp };
  // The cape first: it hangs behind everything else she has on.
  ctx.fillStyle = PAINT.cape;
  ctx.beginPath();
  ctx.moveTo(x - (tall * GIRL.cape) / 2, y - tall * (GIRL.headUp - GIRL.cape));
  ctx.lineTo(x + (tall * GIRL.cape) / 2, y - tall * (GIRL.headUp - GIRL.cape));
  ctx.lineTo(x + tall * GIRL.cape * PART.capeOut, y - tall * GIRL.capeDown);
  ctx.lineTo(x - tall * GIRL.cape * PART.capeOut, y - tall * GIRL.capeDown);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blend(PAINT.cape, PAINT.capeDeep, SHADE);
  ctx.beginPath();
  ctx.moveTo(
    x + tall * GIRL.cape * PART.shadeFrom,
    y - tall * (GIRL.headUp - GIRL.cape),
  );
  ctx.lineTo(x + (tall * GIRL.cape) / 2, y - tall * (GIRL.headUp - GIRL.cape));
  ctx.lineTo(x + tall * GIRL.cape * PART.capeOut, y - tall * GIRL.capeDown);
  ctx.lineTo(x + tall * GIRL.cape * PART.shadeFrom, y - tall * GIRL.capeDown);
  ctx.closePath();
  ctx.fill();
  // The fair hair, then the face over it, then the hood around the lot.
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * GIRL.hair, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.cape;
  ctx.beginPath();
  ctx.arc(
    head.x,
    head.y - tall * GIRL.hoodUp,
    tall * GIRL.hood,
    Math.PI,
    FULL * PART.hoodBack,
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * GIRL.head, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.eye;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      head.x + side * tall * GIRL.eyeApart,
      head.y,
      Math.max(THIN, tall * GIRL.eye),
      0,
      FULL,
    );
    ctx.fill();
  }
}

/**
 * Draws the wolf.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his paws are, and how many pixels a metre is
 * @param facing - which way he looks, 1 forward along the road or -1 back
 * @remarks
 * From the side and prowling, head carried low: a wolf seen head on is a grey
 * cushion. The pale muzzle and the bush of a tail are what make him a wolf and
 * not somebody's dog.
 */
export function drawWolf(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const long = WOLF_LONG * place.scale;
  const tall = WOLF_TALL * place.scale;
  const { x, y } = place;
  const nose = x + facing * long * WOLF.body * THIN;
  // The legs first, so the body lies over their tops.
  ctx.fillStyle = PAINT.wolfDeep;
  const legThick = Math.max(1, long * WOLF.legThick);
  for (const along of [PART.frontLeg, PART.backLeg]) {
    for (const step of [-1, 1]) {
      const at =
        x -
        facing * long * WOLF.body * THIN +
        facing * long * WOLF.body * along +
        step * long * WOLF.legApart * THIN;
      ctx.fillRect(
        at - legThick / 2,
        y - tall * WOLF.leg,
        legThick,
        tall * WOLF.leg,
      );
    }
  }
  // The tail, a bush hanging off the back end.
  ctx.fillStyle = PAINT.wolf;
  const root = {
    x: x - facing * long * WOLF.body * THIN,
    y: y - tall * WOLF.back,
  };
  ctx.beginPath();
  ctx.moveTo(root.x, root.y - long * WOLF.tailThick);
  ctx.quadraticCurveTo(
    root.x - facing * long * WOLF.tail,
    root.y - long * WOLF.tailThick,
    root.x - facing * long * WOLF.tail,
    root.y + tall * WOLF.tailDown,
  );
  ctx.quadraticCurveTo(
    root.x - facing * long * WOLF.tail * PART.tailBush,
    root.y + long * WOLF.tailThick * 2,
    root.x,
    root.y + long * WOLF.tailThick,
  );
  ctx.closePath();
  ctx.fill();
  // The body: a long back, deeper at the shoulder than at the hip.
  ctx.beginPath();
  ctx.ellipse(
    x,
    y - tall * WOLF.back,
    long * WOLF.body * THIN,
    long * WOLF.deep,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = blend(PAINT.wolf, PAINT.wolfDeep, SHADE);
  ctx.beginPath();
  ctx.ellipse(
    x,
    y - tall * (WOLF.back - WOLF.deep * PART.shadeFrom),
    long * WOLF.body * THIN,
    long * WOLF.deep * PART.shadeFrom * 2,
    0,
    0,
    Math.PI,
  );
  ctx.fill();
  drawWolfHead(ctx, place, { long, tall, facing, nose });
}

/**
 * The wolf's neck, head, muzzle and ears.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his paws are
 * @param how - the sizes he came out at, which way he looks, and where his
 *   shoulder ends
 */
function drawWolfHead(
  ctx: CanvasRenderingContext2D,
  place: Place,
  how: {
    readonly long: number;
    readonly tall: number;
    readonly facing: number;
    readonly nose: number;
  },
): void {
  const { long, tall, facing, nose } = how;
  const head = {
    x: nose + facing * long * WOLF.neck,
    y: place.y - tall * (WOLF.back - WOLF.headDown),
  };
  ctx.fillStyle = PAINT.wolf;
  ctx.beginPath();
  ctx.moveTo(nose, place.y - tall * WOLF.back - long * WOLF.deep * THIN);
  ctx.lineTo(head.x, head.y - long * WOLF.head);
  ctx.lineTo(head.x, head.y + long * WOLF.head);
  ctx.lineTo(nose, place.y - tall * WOLF.back + long * WOLF.deep * THIN);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(head.x, head.y, long * WOLF.head, 0, FULL);
  ctx.fill();
  // The ears, standing up off the back of the skull.
  for (const step of [-1, 1]) {
    const at = head.x - facing * long * WOLF.head * PART.earBack;
    ctx.beginPath();
    ctx.moveTo(at + step * long * WOLF.earApart, head.y - long * WOLF.head);
    ctx.lineTo(
      at + step * long * WOLF.earApart + facing * long * WOLF.ear * THIN,
      head.y - long * (WOLF.head + WOLF.ear),
    );
    ctx.lineTo(
      at + step * long * WOLF.earApart + facing * long * WOLF.ear,
      head.y - long * WOLF.head,
    );
    ctx.closePath();
    ctx.fill();
  }
  // The pale muzzle, the black nose on the end of it, and the eye above.
  ctx.fillStyle = PAINT.wolfPale;
  ctx.beginPath();
  ctx.moveTo(head.x, head.y - long * WOLF.head * PART.muzzleUp);
  ctx.lineTo(
    head.x + facing * long * WOLF.muzzle,
    head.y + long * WOLF.muzzleThick * THIN,
  );
  ctx.lineTo(
    head.x + facing * long * WOLF.muzzle,
    head.y + long * WOLF.muzzleThick,
  );
  ctx.lineTo(head.x, head.y + long * WOLF.head * PART.muzzleUp * 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.nose;
  ctx.beginPath();
  ctx.arc(
    head.x + facing * long * WOLF.muzzle,
    head.y + long * WOLF.muzzleThick * THIN,
    long * WOLF.nose,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.glare;
  ctx.beginPath();
  ctx.arc(
    head.x + facing * long * WOLF.head * THIN,
    head.y - long * WOLF.head * PART.muzzleUp * 2,
    Math.max(THIN, long * WOLF.eye),
    0,
    FULL,
  );
  ctx.fill();
}
