/**
 * The crocodile in the river, and the captain balancing on its jaws.
 *
 * @module
 * @remarks
 * A boy who can fly hangs over the ditch two sections back; under the bridge
 * waits the other half of that story. The crocodile rears out of the water
 * with its mouth open, and on the tip of its snout stands a man in a red coat
 * and a plumed hat, sword up, hook out, having a very bad afternoon.
 *
 * Scenery only: no rule knows about them, nothing can be driven into them and
 * they do not move. Where they are comes from the **bridge** rather than from
 * a metre count, so if the crossing ever moves they go with it. A route with
 * no bridge has no crocodile in it.
 *
 * Both are drawn bigger than life, as the flying boy is: the water runs ten
 * metres below the road, and at that distance a life-size man is four pixels
 * of red.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** A stretch of the route, as the bridges are given. */
export type Span = { readonly from: number; readonly to: number };

/** Where the pair are, in metres along the route. */
export type Lurking = {
  /** Where along the route they are. */
  readonly at: number;
};

/** How long the crocodile is from tail to snout, in metres. */
export const CROC_LONG = 8;

/**
 * How tall the captain is, in metres.
 *
 * @remarks
 * Twice the size of a man, and the crocodile with him, for the same reason the
 * flying boy is: the water runs ten metres below the road. Big enough to read
 * from up there, small enough that his hat stays clear of the arch.
 */
export const HOOK_TALL = 3;

/** Where along the span they wait, as a share of it. */
const ALONG = 0.5;

/**
 * Where the crocodile lies on this route, if anywhere.
 *
 * @param bridges - the bridges of the route
 * @returns one place per bridge, in the order they come
 * @remarks
 * In the middle of the span, which is the one place down there that no pier
 * stands in: the two of them hold the deck at a third and two thirds across.
 */
export function hookPlaces(bridges: readonly Span[]): Lurking[] {
  return bridges.map((bridge) => ({
    at: bridge.from + (bridge.to - bridge.from) * ALONG,
  }));
}

/** The crocodile, in shares of how long it is. */
const CROC = {
  /** The body in the water: how far back and forward of the neck, and how high. */
  back: 0.42,
  front: 0.08,
  high: 0.17,
  /** The tail behind it, and how far it lifts out of the water. */
  tail: 0.34,
  tailHigh: 0.13,
  tailThin: 0.05,
  /** The ridges along the back: how many, how big. */
  ridges: 5,
  ridge: 0.035,
  /** The neck rearing up out of the water to the hinge of the jaws. */
  neck: 0.17,
  neckThick: 0.13,
  /** The jaws: how long, how thick, and how wide they gape. */
  jaw: 0.36,
  jawThick: 0.075,
  gape: 0.52,
  /** The teeth along them: how many and how long. */
  teeth: 5,
  tooth: 0.028,
  /** The eye on top of the head, and the nostril at the snout. */
  eye: 0.03,
  eyeOn: 0.1,
  eyeUp: 0.07,
  /** How the water is disturbed around it: how wide the rings go. */
  rings: 3,
  ring: 0.3,
  ringDeep: 0.035,
} as const;

/**
 * Which way things point, in turns of a circle.
 *
 * @remarks
 * The head rears back over the body and the two jaws open away from it, which
 * is three angles that only mean anything together.
 */
const TURN = {
  /** Where a closed snout would point: up and forward, out over the water. */
  head: -0.155,
  /** How far the upper jaw lifts off that line, and the lower drops below it. */
  upper: -0.115,
  lower: 0.135,
} as const;

/** The captain, in shares of how tall he is. */
const MAN = {
  /** The boots, and the breeches above them. */
  boot: 0.14,
  bootWide: 0.16,
  leg: 0.3,
  legThick: 0.08,
  legApart: 0.07,
  /** The coat: where its hem hangs, how wide there and at the shoulders. */
  coat: 0.62,
  hem: 0.34,
  waist: 0.24,
  trim: 0.04,
  /** The collar, and the head over it. */
  collar: 0.06,
  head: 0.1,
  headUp: 0.76,
  /** The hair falling behind, and the moustache in front. */
  hair: 0.12,
  hairDown: 0.16,
  tash: 0.06,
  /** The hat: how wide the brim, how high the crown, and the plume over it. */
  brim: 0.38,
  brimThick: 0.08,
  crown: 0.17,
  plume: 0.3,
  plumeThin: 0.035,
  /** The arms: how long, how thick, and where they leave the shoulders. */
  arm: 0.26,
  armThick: 0.07,
  shoulder: 0.66,
  /** The sword in the raised one, and the hook on the other. */
  sword: 0.5,
  swordThin: 0.03,
  hilt: 0.07,
  hook: 0.09,
  hookThin: 0.045,
} as const;

/**
 * The finer proportions, as shares of the parts they belong to.
 *
 * @remarks
 * All of them are "how far along that piece", which is why they live together
 * rather than each carrying a name three words long.
 */
const PART = {
  /** How far along the jaws the teeth start, and how far in they sit. */
  teethFrom: 0.18,
  teethTo: 0.94,
  /** How far back into the jaws the pink of the mouth reaches. */
  gullet: 0.86,
  /** Where the captain stands along the upper jaw. */
  stands: 0.6,
  /** How far the tail lifts along its length, and where it thins to a point. */
  tailUp: 0.7,
  /** How far down the body the ridges run, and how deep the water rings sit. */
  ridgeFrom: 0.15,
  ridgeTo: 0.85,
  /** Where the coat's shading starts, and how much of the front the trim takes. */
  shadeFrom: 0.2,
  trimFrom: 0.55,
  /** The hat: where it sits on the head, how round the crown, how deep the brim. */
  hatOn: 0.55,
  crownTall: 1.15,
  brimUnder: 0.55,
  /** Where the plume ends up behind him. */
  plumeEnd: 0.2,
  /** Where the sword and the hook leave the hands. */
  swordUp: 0.75,
  swordOut: 0.55,
  hookDown: 0.3,
} as const;

/** Swamp green, pirate red, and the rest of what the pair are made of. */
const PAINT = {
  croc: "#6f9e4a",
  crocDeep: "#4a6f31",
  belly: "#c9d68c",
  mouth: "#d8737a",
  tooth: "#fdf6e4",
  eye: "#f6f2e0",
  pupil: "#20261c",
  coat: "#c62b2b",
  coatDeep: "#8d1c1c",
  trim: "#e8c34a",
  shirt: "#f7f1e2",
  skin: "#f0c39c",
  hair: "#1d1a19",
  boot: "#221f1d",
  steel: "#d7dde2",
  water: "#5f9cbd",
} as const;

/** How much darker a shaded side is. */
const SHADE = 0.3;

/** A whole turn, for the arcs and the angles, and the thinnest line worth it. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/** How far a quadratic curve falls short of the point it is pulled towards. */
const ARCH = 4;

/** Where something is drawn: the water line under it, and the pixels a metre is. */
export type Place = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/**
 * Draws the crocodile and the captain on its snout.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the water line is, and how many pixels a metre is
 * @remarks
 * From the side, because that is the only way this reads at all: a crocodile
 * seen head on is a log. The tail and the body lie in the water, the neck
 * rears out of it, and the open jaws carry the man - which is the picture
 * everybody already has in their head.
 */
export function drawHook(ctx: CanvasRenderingContext2D, place: Place): void {
  const long = CROC_LONG * place.scale;
  drawRings(ctx, place, long);
  drawTail(ctx, place, long);
  drawBody(ctx, place, long);
  drawHead(ctx, place, long);
}

/**
 * The rings on the water around it, which say the water is water.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the water line is
 * @param long - how long the crocodile came out, in pixels
 */
function drawRings(
  ctx: CanvasRenderingContext2D,
  place: Place,
  long: number,
): void {
  ctx.strokeStyle = PAINT.water;
  ctx.lineWidth = Math.max(1, long * CROC.ringDeep * THIN);
  for (let ring = 1; ring <= CROC.rings; ring++) {
    const wide = long * CROC.ring * ring;
    ctx.beginPath();
    ctx.ellipse(
      place.x,
      place.y,
      wide,
      long * CROC.ringDeep * ring,
      0,
      0,
      FULL,
    );
    ctx.stroke();
  }
}

/**
 * The tail, lying back along the water and lifting at the tip.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the water line is
 * @param long - how long the crocodile came out, in pixels
 */
function drawTail(
  ctx: CanvasRenderingContext2D,
  place: Place,
  long: number,
): void {
  const from = place.x - long * CROC.back;
  const tip = from - long * CROC.tail;
  ctx.fillStyle = PAINT.crocDeep;
  ctx.beginPath();
  ctx.moveTo(from, place.y - long * CROC.high * PART.tailUp);
  ctx.quadraticCurveTo(
    (from + tip) / 2,
    place.y - long * CROC.tailHigh,
    tip,
    place.y - long * CROC.tailHigh * PART.tailUp,
  );
  ctx.lineTo(
    tip,
    place.y - long * CROC.tailHigh * PART.tailUp + long * CROC.tailThin,
  );
  ctx.quadraticCurveTo(
    (from + tip) / 2,
    place.y + long * CROC.tailThin,
    from,
    place.y,
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * The body in the water, with the ridges along its back.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the water line is
 * @param long - how long the crocodile came out, in pixels
 */
function drawBody(
  ctx: CanvasRenderingContext2D,
  place: Place,
  long: number,
): void {
  const from = place.x - long * CROC.back;
  const to = place.x + long * CROC.front;
  ctx.fillStyle = PAINT.croc;
  ctx.beginPath();
  ctx.moveTo(from, place.y);
  ctx.quadraticCurveTo(
    (from + to) / 2,
    place.y - long * CROC.high * 2,
    to,
    place.y,
  );
  ctx.closePath();
  ctx.fill();
  // The ridges: a row of little peaks, which is what says crocodile and not
  // hippopotamus at this size.
  ctx.fillStyle = PAINT.crocDeep;
  for (let ridge = 0; ridge < CROC.ridges; ridge++) {
    const share =
      PART.ridgeFrom +
      ((PART.ridgeTo - PART.ridgeFrom) * ridge) / (CROC.ridges - 1);
    const at = from + (to - from) * share;
    // Where the curve of the back actually runs: a quadratic only reaches
    // half of the point it is pulled towards, so the ridges would otherwise
    // hang in the air above the crocodile.
    const high = place.y - long * CROC.high * ARCH * share * (1 - share);
    ctx.beginPath();
    ctx.moveTo(at - long * CROC.ridge, high + long * CROC.ridge);
    ctx.lineTo(at, high - long * CROC.ridge);
    ctx.lineTo(at + long * CROC.ridge, high + long * CROC.ridge);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * The neck, the open jaws, and the captain standing on the upper one.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the water line is
 * @param long - how long the crocodile came out, in pixels
 */
function drawHead(
  ctx: CanvasRenderingContext2D,
  place: Place,
  long: number,
): void {
  const hinge = {
    x: place.x + long * CROC.front,
    y: place.y - long * CROC.neck,
  };
  // The neck out of the water up to the hinge of the jaws.
  ctx.fillStyle = PAINT.croc;
  ctx.beginPath();
  ctx.moveTo(place.x - long * CROC.neckThick, place.y);
  ctx.lineTo(hinge.x - long * CROC.neckThick * THIN, hinge.y);
  ctx.lineTo(hinge.x + long * CROC.neckThick * THIN, hinge.y);
  ctx.lineTo(place.x + long * CROC.front, place.y);
  ctx.closePath();
  ctx.fill();
  // The gape: the two jaws open away from where a shut snout would point,
  // with the mouth itself as a pink wedge between them.
  const upper = (TURN.head + TURN.upper * CROC.gape) * FULL;
  const lower = (TURN.head + TURN.lower * CROC.gape) * FULL;
  ctx.fillStyle = PAINT.mouth;
  ctx.beginPath();
  ctx.moveTo(hinge.x, hinge.y);
  ctx.arc(hinge.x, hinge.y, long * CROC.jaw * PART.gullet, upper, lower);
  ctx.closePath();
  ctx.fill();
  drawJaw(ctx, hinge, long, upper, 1);
  drawJaw(ctx, hinge, long, lower, -1);
  // The eye, sitting on the head behind the hinge, away from the mouth.
  const eye = {
    x: hinge.x - Math.cos(upper) * long * CROC.eyeOn,
    y: hinge.y - Math.sin(upper) * long * CROC.eyeOn - long * CROC.eyeUp,
  };
  ctx.fillStyle = PAINT.eye;
  ctx.beginPath();
  ctx.arc(eye.x, eye.y, long * CROC.eye, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.pupil;
  ctx.beginPath();
  ctx.arc(eye.x, eye.y, long * CROC.eye * THIN, 0, FULL);
  ctx.fill();
  drawCaptain(ctx, hinge, long, upper, place);
}

/**
 * One jaw, with its teeth along the inside.
 *
 * @param ctx - the canvas to paint on
 * @param hinge - where the two jaws meet, on the canvas
 * @param long - how long the crocodile came out, in pixels
 * @param turn - which way this jaw points, in radians
 * @param inside - which side of it the mouth is on, 1 or -1
 */
function drawJaw(
  ctx: CanvasRenderingContext2D,
  hinge: { readonly x: number; readonly y: number },
  long: number,
  turn: number,
  inside: number,
): void {
  ctx.save();
  ctx.translate(hinge.x, hinge.y);
  ctx.rotate(turn);
  const jaw = long * CROC.jaw;
  const thick = long * CROC.jawThick;
  // The jaw itself lies on the far side of the gum line from the mouth, and
  // tapers to the snout, which is what a crocodile's jaw does.
  ctx.fillStyle = PAINT.croc;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(jaw, 0);
  ctx.lineTo(jaw, -thick * inside * THIN);
  ctx.lineTo(0, -thick * inside);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.tooth;
  for (let tooth = 0; tooth < CROC.teeth; tooth++) {
    const share =
      PART.teethFrom +
      ((PART.teethTo - PART.teethFrom) * tooth) / (CROC.teeth - 1);
    const at = jaw * share;
    ctx.beginPath();
    ctx.moveTo(at - long * CROC.tooth * THIN, 0);
    ctx.lineTo(at + long * CROC.tooth * THIN, 0);
    ctx.lineTo(at, long * CROC.tooth * inside);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The captain, balancing on the tip of the upper jaw.
 *
 * @param ctx - the canvas to paint on
 * @param hinge - where the two jaws meet, on the canvas
 * @param long - how long the crocodile came out, in pixels
 * @param turn - which way the upper jaw points, in radians
 * @param place - how many pixels a metre is
 * @remarks
 * Upright rather than tipped along the jaw, because a man balancing keeps
 * himself upright - that is what balancing is.
 */
function drawCaptain(
  ctx: CanvasRenderingContext2D,
  hinge: { readonly x: number; readonly y: number },
  long: number,
  turn: number,
  place: Place,
): void {
  const stand = {
    x: hinge.x + Math.cos(turn) * long * CROC.jaw * PART.stands,
    y: hinge.y + Math.sin(turn) * long * CROC.jaw * PART.stands,
  };
  const tall = HOOK_TALL * place.scale;
  const { x } = stand;
  const y = stand.y;
  // Boots and breeches.
  ctx.fillStyle = PAINT.boot;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * MAN.legApart - (tall * MAN.bootWide) / 2,
      y - tall * MAN.boot,
      tall * MAN.bootWide,
      tall * MAN.boot,
    );
    ctx.fillRect(
      x + side * tall * MAN.legApart - (tall * MAN.legThick) / 2,
      y - tall * MAN.leg,
      tall * MAN.legThick,
      tall * MAN.leg,
    );
  }
  drawCoat(ctx, stand, tall);
  drawArms(ctx, stand, tall);
  drawFace(ctx, stand, tall);
}

/**
 * The red coat with its gold trim.
 *
 * @param ctx - the canvas to paint on
 * @param stand - where his boots are
 * @param tall - how tall he came out, in pixels
 */
function drawCoat(
  ctx: CanvasRenderingContext2D,
  stand: { readonly x: number; readonly y: number },
  tall: number,
): void {
  const { x, y } = stand;
  ctx.fillStyle = PAINT.coat;
  ctx.beginPath();
  ctx.moveTo(x - (tall * MAN.hem) / 2, y - tall * (MAN.coat - MAN.hem));
  ctx.lineTo(x + (tall * MAN.hem) / 2, y - tall * (MAN.coat - MAN.hem));
  ctx.lineTo(x + (tall * MAN.waist) / 2, y - tall * MAN.headUp);
  ctx.lineTo(x - (tall * MAN.waist) / 2, y - tall * MAN.headUp);
  ctx.closePath();
  ctx.fill();
  // The shaded half, so the coat is a body and not a red card.
  ctx.fillStyle = blend(PAINT.coat, PAINT.coatDeep, SHADE);
  ctx.beginPath();
  ctx.moveTo(x - (tall * MAN.hem) / 2, y - tall * (MAN.coat - MAN.hem));
  ctx.lineTo(
    x - tall * MAN.hem * PART.shadeFrom,
    y - tall * (MAN.coat - MAN.hem),
  );
  ctx.lineTo(x - tall * MAN.waist * PART.shadeFrom, y - tall * MAN.headUp);
  ctx.lineTo(x - (tall * MAN.waist) / 2, y - tall * MAN.headUp);
  ctx.closePath();
  ctx.fill();
  // The gold down the front of it, and the white at the throat.
  ctx.fillStyle = PAINT.trim;
  ctx.fillRect(
    x + tall * MAN.waist * PART.trimFrom - tall * MAN.trim,
    y - tall * MAN.headUp,
    tall * MAN.trim,
    tall * (MAN.headUp - MAN.coat + MAN.hem),
  );
  ctx.fillStyle = PAINT.shirt;
  ctx.fillRect(
    x - (tall * MAN.collar) / 2,
    y - tall * MAN.headUp,
    tall * MAN.collar,
    tall * MAN.collar,
  );
}

/**
 * The two arms: the sword in one, the hook where the other hand was.
 *
 * @param ctx - the canvas to paint on
 * @param stand - where his boots are
 * @param tall - how tall he came out, in pixels
 */
function drawArms(
  ctx: CanvasRenderingContext2D,
  stand: { readonly x: number; readonly y: number },
  tall: number,
): void {
  const { x, y } = stand;
  const shoulder = y - tall * MAN.shoulder;
  const thick = Math.max(1, tall * MAN.armThick);
  // The raised arm, and the sword going on where it stops.
  ctx.strokeStyle = PAINT.coat;
  ctx.lineWidth = thick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, shoulder);
  ctx.lineTo(x + tall * MAN.arm, shoulder - tall * MAN.arm * PART.swordUp);
  ctx.stroke();
  ctx.strokeStyle = PAINT.trim;
  ctx.lineWidth = Math.max(1, tall * MAN.swordThin * 2);
  ctx.beginPath();
  ctx.moveTo(
    x + tall * MAN.arm - tall * MAN.hilt,
    shoulder - tall * MAN.arm * PART.swordUp + tall * MAN.hilt,
  );
  ctx.lineTo(
    x + tall * MAN.arm + tall * MAN.hilt,
    shoulder - tall * MAN.arm * PART.swordUp - tall * MAN.hilt,
  );
  ctx.stroke();
  ctx.strokeStyle = PAINT.steel;
  ctx.lineWidth = Math.max(1, tall * MAN.swordThin);
  ctx.beginPath();
  ctx.moveTo(x + tall * MAN.arm, shoulder - tall * MAN.arm * PART.swordUp);
  ctx.lineTo(
    x + tall * (MAN.arm + MAN.sword * PART.swordOut),
    shoulder - tall * (MAN.arm * PART.swordUp + MAN.sword),
  );
  ctx.stroke();
  // The other arm, ending in the hook.
  ctx.strokeStyle = PAINT.coat;
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.moveTo(x, shoulder);
  ctx.lineTo(x - tall * MAN.arm, shoulder + tall * MAN.arm * PART.hookDown);
  ctx.stroke();
  ctx.strokeStyle = PAINT.steel;
  ctx.lineWidth = Math.max(1, tall * MAN.hookThin);
  ctx.beginPath();
  ctx.arc(
    x - tall * (MAN.arm + MAN.hook * THIN),
    shoulder + tall * MAN.arm * PART.hookDown + tall * MAN.hook,
    tall * MAN.hook,
    -Math.PI * THIN,
    Math.PI * THIN,
  );
  ctx.stroke();
}

/**
 * The head: hair, moustache, and the plumed hat over the lot.
 *
 * @param ctx - the canvas to paint on
 * @param stand - where his boots are
 * @param tall - how tall he came out, in pixels
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  stand: { readonly x: number; readonly y: number },
  tall: number,
): void {
  const head = { x: stand.x, y: stand.y - tall * (MAN.headUp + MAN.head) };
  // The long black hair, hanging behind the shoulders.
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.ellipse(
    head.x - tall * MAN.head * THIN,
    head.y + tall * MAN.hairDown * THIN,
    tall * MAN.hair,
    tall * MAN.hairDown,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * MAN.head, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.hair;
  ctx.fillRect(
    head.x,
    head.y + tall * MAN.head * THIN,
    tall * MAN.tash,
    Math.max(THIN, tall * MAN.tash * THIN),
  );
  drawHat(ctx, head, tall);
}

/**
 * The hat: a wide brim, a round crown on it, and the plume trailing back.
 *
 * @param ctx - the canvas to paint on
 * @param head - the middle of his face on the canvas
 * @param tall - how tall he came out, in pixels
 * @remarks
 * The one thing about him that has to survive being ten metres down a gorge.
 * A brim wider than his shoulders with a white plume off the back reads as a
 * pirate at any size; a pointed cap would read as a garden gnome.
 */
function drawHat(
  ctx: CanvasRenderingContext2D,
  head: { readonly x: number; readonly y: number },
  tall: number,
): void {
  const sits = head.y - tall * MAN.head * PART.hatOn;
  // The plume first, so it comes out from behind the crown.
  ctx.strokeStyle = PAINT.shirt;
  ctx.lineWidth = Math.max(1, tall * MAN.plumeThin * 2);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x, sits - tall * MAN.crown);
  ctx.quadraticCurveTo(
    head.x - tall * MAN.plume,
    sits - tall * (MAN.crown + MAN.plume),
    head.x - tall * MAN.plume,
    sits - tall * MAN.crown * PART.plumeEnd,
  );
  ctx.stroke();
  // The crown, then the brim across its foot, then the shade under the brim.
  ctx.fillStyle = PAINT.coat;
  ctx.beginPath();
  ctx.ellipse(
    head.x,
    sits,
    tall * MAN.crown,
    tall * MAN.crown * PART.crownTall,
    0,
    Math.PI,
    FULL,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    head.x,
    sits,
    (tall * MAN.brim) / 2,
    tall * MAN.brimThick,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = blend(PAINT.coat, PAINT.coatDeep, SHADE);
  ctx.beginPath();
  ctx.ellipse(
    head.x,
    sits,
    (tall * MAN.brim) / 2,
    tall * MAN.brimThick * PART.brimUnder,
    0,
    0,
    Math.PI,
  );
  ctx.fill();
}
