/**
 * The four town musicians, standing on one another at the start of section 5.
 *
 * @module
 * @remarks
 * A donkey with a dog on its back, a cat on the dog and a cockerel on the cat:
 * the one thing everybody in this country can draw from memory. They stand at
 * the top of the section that begins with a bear on the road, which is the
 * only stretch of the drive where somebody else is already in the business of
 * frightening things away.
 *
 * Scenery only: no rule knows about them, nothing can be driven into them and
 * they do not move. Where they stand comes from the **section** rather than
 * from a metre count, so if the map is ever re-cut they move with its start.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** Which section they stand at the start of, counted from the first. */
const SECTION = 4;

/** Where they stand, in metres. */
const SPOT = {
  /** How far past the start of the section, clear of its flag and its board. */
  after: 16,
  /** How far out from the middle of the road. */
  out: 7.5,
} as const;

/** Where the tower of them stands. */
export type Band = {
  /** Where along the route, in metres. */
  readonly at: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
};

/** How long each of them is and how high its back stands, in metres. */
const BEAST = {
  donkeyLong: 2.6,
  donkeyTall: 1.8,
  dogLong: 1.5,
  dogTall: 1,
  catLong: 1,
  catTall: 0.62,
  cockLong: 0.95,
  cockTall: 1.15,
} as const;

/** How high the whole tower reaches, for the sight lines. */
export const BAND_REACH =
  BEAST.donkeyTall + BEAST.dogTall + BEAST.catTall + BEAST.cockTall;

/**
 * Where the four of them stand on this route, if anywhere.
 *
 * @param sections - where the sections of the route begin, in metres
 * @returns the one place, or nothing on a route that short
 */
export function bandPlaces(sections: readonly number[]): Band[] {
  const start = sections[SECTION];
  if (start === undefined) {
    return [];
  }
  return [{ at: start + SPOT.after, out: SPOT.out }];
}

/** The donkey, in shares of how long he is. */
const DONKEY = {
  /** Half the depth of his barrel, and how thick the legs under it are. */
  deep: 0.145,
  legs: 0.33,
  legThick: 0.08,
  /** The neck up to the head, and the head itself. */
  neck: 0.34,
  neckThick: 0.16,
  head: 0.26,
  headDeep: 0.13,
  /** The ears, which are the whole of the joke. */
  ear: 0.3,
  earThick: 0.045,
  earApart: 0.05,
  /** The mane down the neck, the tail behind, and the tuft on its end. */
  mane: 0.05,
  tail: 0.22,
  tailThick: 0.03,
  tuft: 0.07,
  /** The eye, and the muzzle at the end of the head. */
  eye: 0.02,
  muzzle: 0.07,
} as const;

/** The dog on his back, in shares of how long he is. */
const DOG = {
  deep: 0.145,
  legs: 0.34,
  legThick: 0.09,
  neck: 0.26,
  neckThick: 0.2,
  head: 0.24,
  muzzle: 0.16,
  muzzleDeep: 0.1,
  ear: 0.16,
  earDeep: 0.22,
  tail: 0.24,
  tailThick: 0.06,
  eye: 0.03,
} as const;

/** The cat on the dog, in shares of how long she is. */
const CAT = {
  deep: 0.14,
  legs: 0.3,
  legThick: 0.08,
  head: 0.24,
  ear: 0.12,
  earApart: 0.1,
  tail: 0.3,
  tailThick: 0.06,
  eye: 0.035,
} as const;

/** The cockerel on top, in shares of how long he is. */
const COCK = {
  /** The body, and how high above his feet it sits. */
  body: 0.5,
  bodyDeep: 0.42,
  legs: 0.3,
  legThick: 0.06,
  /** The neck and head over it. */
  neck: 0.26,
  head: 0.26,
  /** The comb, the wattle and the beak. */
  comb: 0.3,
  wattle: 0.16,
  beak: 0.28,
  eye: 0.05,
  /** The sickle of tail feathers behind him. */
  tail: 0.5,
  tailThick: 0.14,
} as const;

/**
 * The finer proportions, as shares of the parts they belong to.
 *
 * @remarks
 * All of them are "how far along that piece", which is why they live together
 * rather than each carrying a name three words long.
 */
const PART = {
  /** Where the shading of a flank starts, and how far up the belly it goes. */
  shadeFrom: 0.35,
  /** Where along the back the front and the hind legs stand. */
  front: 0.76,
  hind: 0.14,
  /** How far the neck leans forward over the shoulder. */
  lean: 0.3,
  /** How far back on the head an ear sits, and how far it leans. */
  earBack: 0.4,
  earLean: 0.35,
  /** Where the eye sits in a head, along and up. */
  eyeOn: 0.4,
  eyeUp: 0.25,
  /** How far the tail lifts, and where its tuft begins. */
  tailUp: 0.4,
  tuftFrom: 0.75,
} as const;

/** Donkey grey, dog brown, cat ginger, cockerel red. */
const PAINT = {
  donkey: "#9aa0a6",
  donkeyDeep: "#6d7278",
  donkeyPale: "#d9dcdf",
  dog: "#a9743f",
  dogDeep: "#7a5027",
  dogPale: "#e2c8a4",
  cat: "#d98b34",
  catDeep: "#a8621f",
  cock: "#b8442e",
  cockDeep: "#8a2f1f",
  cockTail: "#2f3a4a",
  comb: "#d43a2b",
  beak: "#e8b53a",
  hoof: "#3b332c",
  eye: "#20241f",
} as const;

/** How much darker a shaded flank is. */
const SHADE = 0.3;

/** A whole turn, for the arcs, and the smallest thing worth drawing. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/** Where the tower is drawn: the donkey's hooves, and the pixels a metre is. */
export type Place = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/**
 * Draws the four of them, one on top of the other.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the donkey's hooves are, and the pixels a metre is
 * @param facing - which way they look, -1 back down the road or 1 along it
 * @remarks
 * From the side and from the bottom up, so that each of them stands on the
 * back of the one below rather than in front of it. Facing the way the road
 * comes from: four animals on a plinth all look the same way, and this way
 * whoever drives up gets the faces.
 */
export function drawBand(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const { x, y, scale } = place;
  const donkeyBack = y - BEAST.donkeyTall * scale;
  const dogBack = donkeyBack - BEAST.dogTall * scale;
  const catBack = dogBack - BEAST.catTall * scale;
  drawDonkey(ctx, { x, y, scale }, facing);
  drawDog(ctx, { x, y: donkeyBack, scale }, facing);
  drawCat(ctx, { x, y: dogBack, scale }, facing);
  drawCock(ctx, { x, y: catBack, scale }, facing);
}

/**
 * A four-legged body: the barrel, its shaded underside and the four legs.
 *
 * @param ctx - the canvas to paint on
 * @param place - where its feet are
 * @param how - the sizes, the colours and which way it looks
 */
function drawBarrel(
  ctx: CanvasRenderingContext2D,
  place: Place,
  how: {
    readonly long: number;
    readonly tall: number;
    readonly deep: number;
    readonly legs: number;
    readonly legThick: number;
    readonly coat: string;
    readonly dark: string;
    readonly facing: number;
  },
): void {
  const { x, y } = place;
  // The back line is where whatever stands on him puts its feet, so the top
  // of the barrel has to be exactly there and the legs carry the rest.
  const back = y - how.tall;
  const middle = back + how.long * how.deep;
  ctx.fillStyle = how.dark;
  const legThick = Math.max(1, how.long * how.legThick);
  for (const along of [PART.front, PART.hind]) {
    for (const step of [-1, 1]) {
      const at =
        x + how.facing * how.long * (along - THIN) + step * legThick * THIN;
      ctx.fillRect(at - legThick / 2, middle, legThick, y - middle);
    }
  }
  ctx.fillStyle = how.coat;
  ctx.beginPath();
  ctx.ellipse(x, middle, how.long * THIN, how.long * how.deep, 0, 0, FULL);
  ctx.fill();
  ctx.fillStyle = blend(how.coat, how.dark, SHADE);
  ctx.beginPath();
  ctx.ellipse(
    x,
    middle,
    how.long * THIN,
    how.long * how.deep * PART.shadeFrom,
    0,
    0,
    Math.PI,
  );
  ctx.fill();
}

/**
 * The donkey at the bottom, who is carrying the other three.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his hooves are
 * @param facing - which way he looks
 */
function drawDonkey(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const long = BEAST.donkeyLong * place.scale;
  const tall = BEAST.donkeyTall * place.scale;
  const { x, y } = place;
  const back = y - tall;
  // The tail first, so it hangs behind the barrel.
  ctx.strokeStyle = PAINT.donkeyDeep;
  ctx.lineWidth = Math.max(1, long * DONKEY.tailThick);
  ctx.lineCap = "round";
  const rump = x - facing * long * THIN;
  ctx.beginPath();
  ctx.moveTo(rump, back + long * DONKEY.deep * THIN);
  ctx.lineTo(
    rump - facing * long * DONKEY.tail * PART.tailUp,
    back + long * (DONKEY.deep + DONKEY.tail * THIN),
  );
  ctx.stroke();
  ctx.fillStyle = PAINT.donkeyDeep;
  ctx.beginPath();
  ctx.arc(
    rump - facing * long * DONKEY.tail * PART.tailUp,
    back + long * (DONKEY.deep + DONKEY.tail * THIN),
    long * DONKEY.tuft * THIN,
    0,
    FULL,
  );
  ctx.fill();
  drawBarrel(ctx, place, {
    long,
    tall,
    deep: DONKEY.deep,
    legs: DONKEY.legs,
    legThick: DONKEY.legThick,
    coat: PAINT.donkey,
    dark: PAINT.donkeyDeep,
    facing,
  });
  // The neck and the long head on the end of it.
  const withers = { x: x + facing * long * PART.front * THIN, y: back };
  const poll = {
    x: withers.x + facing * long * DONKEY.neck * PART.lean * 2,
    y: back - long * DONKEY.neck,
  };
  ctx.fillStyle = PAINT.donkey;
  ctx.beginPath();
  ctx.moveTo(withers.x - long * DONKEY.neckThick * THIN, withers.y);
  ctx.lineTo(withers.x + long * DONKEY.neckThick * THIN, withers.y);
  ctx.lineTo(poll.x + long * DONKEY.neckThick * THIN, poll.y);
  ctx.lineTo(poll.x - long * DONKEY.neckThick * THIN, poll.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    poll.x + facing * long * DONKEY.head * PART.eyeOn,
    poll.y,
    long * DONKEY.head * THIN,
    long * DONKEY.headDeep,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.donkeyPale;
  ctx.beginPath();
  ctx.arc(
    poll.x + facing * long * DONKEY.head * PART.tuftFrom,
    poll.y + long * DONKEY.headDeep * THIN,
    long * DONKEY.muzzle * THIN,
    0,
    FULL,
  );
  ctx.fill();
  // The ears, which is what tells a donkey from a horse at any size.
  ctx.fillStyle = PAINT.donkey;
  for (const step of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      poll.x -
        facing * long * DONKEY.head * PART.earBack +
        step * long * DONKEY.earApart,
      poll.y - long * DONKEY.ear * THIN,
      long * DONKEY.earThick,
      long * DONKEY.ear * THIN,
      -facing * PART.earLean,
      0,
      FULL,
    );
    ctx.fill();
  }
  ctx.fillStyle = PAINT.eye;
  ctx.beginPath();
  ctx.arc(
    poll.x + facing * long * DONKEY.head * PART.eyeOn,
    poll.y - long * DONKEY.headDeep * PART.eyeUp,
    Math.max(THIN, long * DONKEY.eye),
    0,
    FULL,
  );
  ctx.fill();
}

/**
 * The dog standing on the donkey's back.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his paws are
 * @param facing - which way he looks
 */
function drawDog(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const long = BEAST.dogLong * place.scale;
  const tall = BEAST.dogTall * place.scale;
  const { x, y } = place;
  const back = y - tall;
  ctx.strokeStyle = PAINT.dogDeep;
  ctx.lineWidth = Math.max(1, long * DOG.tailThick);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - facing * long * THIN, back + long * DOG.deep * THIN);
  ctx.lineTo(
    x - facing * long * (THIN + DOG.tail * PART.tailUp),
    back - long * DOG.tail * THIN,
  );
  ctx.stroke();
  drawBarrel(ctx, place, {
    long,
    tall,
    deep: DOG.deep,
    legs: DOG.legs,
    legThick: DOG.legThick,
    coat: PAINT.dog,
    dark: PAINT.dogDeep,
    facing,
  });
  // The head, carried high, with a floppy ear and a pale muzzle.
  const head = {
    x: x + facing * long * (THIN + DOG.head * PART.lean),
    y: back + long * DOG.deep - long * DOG.neck * THIN,
  };
  ctx.fillStyle = PAINT.dog;
  ctx.beginPath();
  ctx.arc(head.x, head.y, long * DOG.head, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.dogPale;
  ctx.beginPath();
  ctx.ellipse(
    head.x + facing * long * DOG.muzzle * THIN,
    head.y + long * DOG.muzzleDeep * THIN,
    long * DOG.muzzle * THIN,
    long * DOG.muzzleDeep * THIN,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.dogDeep;
  ctx.beginPath();
  ctx.ellipse(
    head.x - facing * long * DOG.head * PART.earBack,
    head.y + long * DOG.earDeep * THIN,
    long * DOG.ear * THIN,
    long * DOG.earDeep * THIN,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.eye;
  ctx.beginPath();
  ctx.arc(
    head.x + facing * long * DOG.head * PART.eyeOn,
    head.y - long * DOG.head * PART.eyeUp,
    Math.max(THIN, long * DOG.eye),
    0,
    FULL,
  );
  ctx.fill();
}

/**
 * The cat standing on the dog.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her paws are
 * @param facing - which way she looks
 */
function drawCat(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const long = BEAST.catLong * place.scale;
  const tall = BEAST.catTall * place.scale;
  const { x, y } = place;
  const back = y - tall;
  // The tail, standing up behind her the way a cat carries it.
  ctx.strokeStyle = PAINT.catDeep;
  ctx.lineWidth = Math.max(1, long * CAT.tailThick);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - facing * long * THIN, back + long * CAT.deep * THIN);
  ctx.quadraticCurveTo(
    x - facing * long * (THIN + CAT.tail * PART.tailUp),
    back - long * CAT.tail * THIN,
    x - facing * long * THIN,
    back - long * CAT.tail,
  );
  ctx.stroke();
  drawBarrel(ctx, place, {
    long,
    tall,
    deep: CAT.deep,
    legs: CAT.legs,
    legThick: CAT.legThick,
    coat: PAINT.cat,
    dark: PAINT.catDeep,
    facing,
  });
  const head = {
    x: x + facing * long * (THIN + CAT.head * PART.lean),
    y: back + long * CAT.deep - long * CAT.head * THIN,
  };
  ctx.fillStyle = PAINT.cat;
  ctx.beginPath();
  ctx.arc(head.x, head.y, long * CAT.head, 0, FULL);
  ctx.fill();
  for (const step of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(
      head.x + step * long * CAT.earApart - long * CAT.ear * THIN,
      head.y - long * CAT.head * THIN,
    );
    ctx.lineTo(
      head.x + step * long * CAT.earApart + long * CAT.ear * THIN,
      head.y - long * CAT.head * THIN,
    );
    ctx.lineTo(
      head.x + step * long * CAT.earApart,
      head.y - long * (CAT.head * THIN + CAT.ear),
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PAINT.eye;
  ctx.beginPath();
  ctx.arc(
    head.x + facing * long * CAT.head * PART.eyeOn,
    head.y,
    Math.max(THIN, long * CAT.eye),
    0,
    FULL,
  );
  ctx.fill();
}

/**
 * The cockerel on the top, who is the one everybody looks for.
 *
 * @param ctx - the canvas to paint on
 * @param place - where his feet are
 * @param facing - which way he looks
 */
function drawCock(
  ctx: CanvasRenderingContext2D,
  place: Place,
  facing: number,
): void {
  const long = BEAST.cockLong * place.scale;
  const tall = BEAST.cockTall * place.scale;
  const { x, y } = place;
  // The legs, then the sickle of tail feathers, then the body over both.
  ctx.strokeStyle = PAINT.beak;
  ctx.lineWidth = Math.max(1, long * COCK.legThick);
  ctx.lineCap = "round";
  for (const step of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + step * long * COCK.legThick, y);
    ctx.lineTo(x + step * long * COCK.legThick, y - tall * COCK.legs);
    ctx.stroke();
  }
  ctx.fillStyle = PAINT.cockTail;
  ctx.beginPath();
  ctx.moveTo(x - facing * long * COCK.body * THIN, y - tall * COCK.legs);
  ctx.quadraticCurveTo(
    x - facing * long * (COCK.body * THIN + COCK.tail),
    y - tall * (COCK.legs + COCK.tail * THIN),
    x - facing * long * COCK.body * THIN,
    y - tall * (COCK.legs + COCK.tail),
  );
  ctx.quadraticCurveTo(
    x - facing * long * COCK.tail * THIN,
    y - tall * (COCK.legs + COCK.tail * THIN),
    x - facing * long * COCK.body * THIN,
    y - tall * COCK.legs,
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.cock;
  ctx.beginPath();
  ctx.ellipse(
    x,
    y - tall * (COCK.legs + COCK.bodyDeep * THIN),
    long * COCK.body,
    tall * COCK.bodyDeep,
    0,
    0,
    FULL,
  );
  ctx.fill();
  // The head, with the comb over it and the wattle under the beak.
  const head = {
    x: x + facing * long * COCK.body * THIN,
    y: y - tall * (COCK.legs + COCK.neck + COCK.head),
  };
  ctx.beginPath();
  ctx.arc(head.x, head.y, long * COCK.head, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.comb;
  ctx.beginPath();
  ctx.arc(
    head.x,
    head.y - long * COCK.head * THIN,
    long * COCK.comb * THIN,
    Math.PI,
    FULL,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    head.x + facing * long * COCK.head * THIN,
    head.y + long * COCK.head,
    long * COCK.wattle * THIN,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.beak;
  ctx.beginPath();
  ctx.moveTo(head.x + facing * long * COCK.head * THIN, head.y);
  ctx.lineTo(
    head.x + facing * long * (COCK.head * THIN + COCK.beak),
    head.y + long * COCK.beak * THIN,
  );
  ctx.lineTo(
    head.x + facing * long * COCK.head * THIN,
    head.y + long * COCK.beak * THIN,
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.eye;
  ctx.beginPath();
  ctx.arc(
    head.x + facing * long * COCK.head * PART.eyeOn,
    head.y - long * COCK.head * PART.eyeUp,
    Math.max(THIN, long * COCK.eye),
    0,
    FULL,
  );
  ctx.fill();
}
