/**
 * The people, drawn properly - and drawn once.
 *
 * @module
 * @remarks
 * Two things at the same time.
 *
 * The first is the drawing itself: shapes with outlines instead of stacked
 * ellipses. Shoulders that taper to a chest, arms with a sleeve and a cuff, a
 * head with a parting, brows, eyes with pupils, a nose and ears - and per sort
 * of person the things that say who they are: lapels and a tie, a torn coat, a
 * cap worn backwards, a peaked cap with a badge.
 *
 * The second is that none of that is drawn per frame. Each figure is painted
 * once into a small offscreen canvas and from then on stamped, which is what
 * makes the detail affordable: a hundred people on screen cost a hundred
 * `drawImage` calls rather than a hundred times forty paths. The cache is
 * filled lazily, so only the outfits actually on screen are ever built.
 *
 * Two sprites per person, not one: the body sits at shoulder height and the
 * head a little higher, and keeping them apart is what gives the figure its
 * depth in a tilted view. The legs stay in the renderer - they follow the keys
 * rather than the mouse, and that separation is worth more than a third sprite.
 */

/** What a figure is wearing, which decides both the shapes and the cache key. */
export type FigureLook = {
  readonly shirt: string;
  readonly trousers: string;
  readonly skin: string;
  readonly hair: string;
  /** Which set of extras: a tie, a torn coat, a cap. */
  readonly style: FigureStyle;
  /** What the arms are doing. */
  readonly arms: ArmPose;
  /** Which hand is doing it - the one holding something, or this blow's fist. */
  readonly hand: Hand;
};

/**
 * Which of the two hands a pose belongs to.
 *
 * @remarks
 * Anything carried is carried in the right hand and swung with it; a bare fist
 * fight alternates, because that is what a fist fight looks like.
 */
export type Hand = "left" | "right";

/**
 * What the arms are doing.
 *
 * @remarks
 * Three poses, and the difference between the first two is the whole of what a
 * weapon looks like from above: somebody with a pistol holds it out in front,
 * somebody with their fists walks like anybody else. The third is the moment of
 * the blow itself, and it lasts exactly as long as the weapon takes to be ready
 * again - which is why it needs no clock of its own.
 */
export type ArmPose = "swing" | "hold" | "punch";

/** The sorts of people the city draws. */
export type FigureStyle =
  "plain" | "posh" | "bum" | "night" | "gang" | "cop" | "player";

/** How many poses of the arm swing are kept. */
export const SWING_FRAMES = 6;

/** How many pixels of sprite stand for one city pixel. */
const GRAIN = 8;

/** How many city pixels across a body sprite covers. */
const BODY_SPAN = 20;

/** How many city pixels across a head sprite covers. */
const HEAD_SPAN = 14;

/** How many city pixels across a legs sprite covers. */
const LEGS_SPAN = 22;

/**
 * How many city pixels across the picture of somebody lying down covers.
 *
 * @remarks
 * Half as much again as a standing figure needs. Somebody on their feet is a
 * head and a pair of shoulders seen from above; somebody flat out is their
 * whole length, arms and all.
 */
const DOWN_SPAN = 30;

/** Every sprite built so far, by what it shows. */
const drawn = new Map<string, HTMLCanvasElement>();

/**
 * The body of a figure: shoulders, arms, hands and the clothes on them.
 *
 * @param look - who is wearing what
 * @param frame - which pose of the arm swing, 0 to {@link SWING_FRAMES} - 1
 * @returns the sprite, or null where no canvas can be made
 */
export function bodySprite(
  look: FigureLook,
  frame: number,
): HTMLCanvasElement | null {
  return sprite(`b|${keyOf(look)}|${frame}`, BODY_SPAN, (ctx) => {
    paintBody(ctx, look, frame);
  });
}

/**
 * The head of a figure: hair, face and hat.
 *
 * @param look - who is wearing what
 * @returns the sprite, or null where no canvas can be made
 */
export function headSprite(look: FigureLook): HTMLCanvasElement | null {
  return sprite(`h|${keyOf(look)}`, HEAD_SPAN, (ctx) => {
    paintHead(ctx, look);
  });
}

/** How many city pixels across the body sprite stands for. */
export const BODY_SIZE = BODY_SPAN;

/** How many city pixels across the head sprite stands for. */
export const HEAD_SIZE = HEAD_SPAN;

/** How many city pixels across a legs sprite stands for. */
export const LEGS_SIZE = LEGS_SPAN;

/** How many city pixels across the picture of a body on the road stands for. */
export const DOWN_SIZE = DOWN_SPAN;

/**
 * Somebody lying on the road: the whole of them, in one picture.
 *
 * @param look - who is wearing what
 * @returns the sprite, or null where no canvas can be made
 * @remarks
 * One picture rather than the usual three, because none of the reasons for
 * splitting them apply any more: nothing is at shoulder height, nothing turns
 * with the mouse, nothing is mid-stride. What is left is a shape, and a shape
 * is one sprite.
 *
 * The pose does not depend on the arms or the hand, so those are left out of
 * the key: a man face down on the tarmac is the same man whatever he was
 * holding a second ago.
 */
export function downSprite(look: FigureLook): HTMLCanvasElement | null {
  const key = [
    "d",
    look.style,
    look.shirt,
    look.trousers,
    look.skin,
    look.hair,
  ].join("|");
  return sprite(key, DOWN_SPAN, (ctx) => {
    paintDown(ctx, look);
  });
}

/**
 * The legs of a figure, mid-stride or folded under a sitting one.
 *
 * @param look - who is wearing what
 * @param frame - which pose of the stride, 0 to {@link SWING_FRAMES} - 1
 * @param seated - true for cross-legged, which ignores the frame
 * @returns the sprite, or null where no canvas can be made
 * @remarks
 * Their own picture because they turn with the keys while the body turns with
 * the mouse: they are the one part of a figure that does not share an angle
 * with the rest of it.
 */
export function legsSprite(
  look: FigureLook,
  frame: number,
  seated = false,
): HTMLCanvasElement | null {
  return sprite(
    `l|${look.trousers}|${look.style}|${seated ? "sit" : frame}`,
    LEGS_SPAN,
    (ctx) => {
      if (seated) {
        paintSitting(ctx, look);
      } else {
        paintLegs(ctx, look, frame);
      }
    },
  );
}

/** What makes two figures the same picture. */
function keyOf(look: FigureLook): string {
  return [
    look.style,
    look.shirt,
    look.trousers,
    look.skin,
    look.hair,
    look.arms,
    look.hand,
  ].join(",");
}

/**
 * A sprite from the cache, painted on first use.
 *
 * @param key - what the picture shows
 * @param span - how many city pixels across it stands for
 * @param paint - draws it, in city pixels, centred on the origin, facing east
 * @returns the canvas, or null if the browser gives no context
 */
function sprite(
  key: string,
  span: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement | null {
  const had = drawn.get(key);
  if (had !== undefined) {
    return had;
  }
  const size = span * GRAIN;
  const sheet = document.createElement("canvas");
  sheet.width = size;
  sheet.height = size;
  const ctx = sheet.getContext("2d");
  if (ctx === null) {
    return null;
  }
  ctx.translate(size / 2, size / 2);
  ctx.scale(GRAIN, GRAIN);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  paint(ctx);
  drawn.set(key, sheet);
  return sheet;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: where a lapel sits on a chest, how far a cuff is
   from a shoulder. They are shapes, not arithmetic. */

/** How dark the outline around every part is. */
const INK = "#1c1917";

/** How thick that outline is, in city pixels. */
const PEN = 0.5;

/** The pose of the arms at one frame of the swing. */
function swingAt(frame: number): number {
  return Math.sin((frame / SWING_FRAMES) * Math.PI * 2);
}

/**
 * Where the hand that carries something is, in city pixels from the middle.
 *
 * @param arms - what the arms are doing
 * @param frame - which pose of the swing, for a hand that is swinging
 * @returns the point to draw a weapon at, facing east
 * @remarks
 * The weapon is not baked into the sprite - it changes with a turn of the
 * wheel, the shirt does not - so the renderer needs to know where the hand
 * ended up in each pose.
 */
export function handAt(
  arms: ArmPose,
  frame: number,
  hand: Hand,
): { readonly ahead: number; readonly aside: number } {
  const side = hand === "right" ? 1 : -1;
  if (arms === "hold") {
    return { ahead: 9.5, aside: side * 2.6 };
  }
  if (arms === "punch") {
    return { ahead: 10.4, aside: side * 1 };
  }
  const swing = swingAt(frame);
  return { ahead: 2 + swing * 3.2, aside: side * 6.5 };
}

/**
 * The body, facing east, centred on the origin.
 *
 * @remarks
 * Built back to front: the arm that is behind, then the trunk with whatever the
 * style puts on it, then the arm in front. Each part is a closed path with an
 * outline, which is the whole difference to a stack of ellipses - a silhouette
 * you can read at a glance instead of a blob.
 */
function paintBody(
  ctx: CanvasRenderingContext2D,
  look: FigureLook,
  frame: number,
): void {
  const swing = swingAt(frame);
  const bare = look.style === "night";
  const sleeve = bare ? look.skin : look.shirt;
  const busy = look.hand === "right" ? 1 : -1;
  const idle = -busy;
  // The arm that is doing nothing goes first, so the working one lies over the
  // shoulders rather than under them. While a blow is out, the other is pulled
  // back - a punch that leaves both arms forward is a man falling over.
  arm(ctx, look, sleeve, idle, look.arms === "swing" ? -swing * busy : -1);
  trunk(ctx, look);
  extras(ctx, look);
  if (look.arms === "hold") {
    reachArm(ctx, look, sleeve, busy, false);
  } else if (look.arms === "punch") {
    reachArm(ctx, look, sleeve, busy, true);
  } else {
    arm(ctx, look, sleeve, busy, swing * busy);
  }
}

/**
 * Two legs and two shoes, mid-stride, facing east.
 *
 * @remarks
 * Seen from above a leg is a thigh going forward and a shoe on the end of it,
 * and the whole of the walk is that one is in front while the other is behind.
 * Drawn as shapes with outlines like the rest, so that at a close zoom they are
 * legs rather than two dark spots under the body.
 */
function paintLegs(
  ctx: CanvasRenderingContext2D,
  look: FigureLook,
  frame: number,
): void {
  const swing = swingAt(frame);
  for (const side of [-1, 1]) {
    const reach = side * swing * 4.6;
    const aside = side * 1.9;
    const leg = new Path2D();
    leg.moveTo(reach + 2.6, aside - 1.5);
    leg.quadraticCurveTo(reach + 3.4, aside, reach + 2.6, aside + 1.5);
    leg.lineTo(reach - 3.2, aside + 1.7);
    leg.quadraticCurveTo(reach - 4, aside, reach - 3.2, aside - 1.7);
    leg.closePath();
    ctx.fillStyle = look.trousers;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN;
    ctx.fill(leg);
    ctx.stroke(leg);
    if (look.style === "night") {
      // Boots to the knee: the leg itself is light, so the boot has to be the
      // dark part rather than a dot on the end.
      const boot = new Path2D();
      boot.moveTo(reach + 3.6, aside - 1.4);
      boot.quadraticCurveTo(reach + 4.6, aside, reach + 3.6, aside + 1.4);
      boot.lineTo(reach - 1.4, aside + 1.6);
      boot.lineTo(reach - 1.4, aside - 1.6);
      boot.closePath();
      ctx.fillStyle = "#f1f5f9";
      ctx.lineWidth = PEN * 0.8;
      ctx.fill(boot);
      ctx.stroke(boot);
    } else {
      const shoe = new Path2D();
      shoe.ellipse(reach + 3.4, aside, 1.9, 1.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#292524";
      ctx.lineWidth = PEN * 0.8;
      ctx.fill(shoe);
      ctx.stroke(shoe);
    }
  }
  if (look.style === "night") {
    // Bikini briefs over the top of both legs, and nothing else: the legs
    // themselves are drawn in the skin tone.
    const briefs = new Path2D();
    briefs.moveTo(2.2, -3.4);
    briefs.quadraticCurveTo(3, 0, 2.2, 3.4);
    briefs.quadraticCurveTo(-1.6, 4, -2.6, 0);
    briefs.quadraticCurveTo(-1.6, -4, 2.2, -3.4);
    briefs.closePath();
    ctx.fillStyle = look.shirt;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.8;
    ctx.fill(briefs);
    ctx.stroke(briefs);
  }
}

/** The trunk: shoulders tapering to a chest, with a collar at the neck. */
function trunk(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  const wide = look.style === "night" ? 6.6 : 6;
  const path = new Path2D();
  // Seen from above: broad across the shoulders, narrower at the chest, and
  // rounded at the back.
  path.moveTo(3.6, -3.4);
  path.bezierCurveTo(4.6, -2, 4.6, 2, 3.6, 3.4);
  path.bezierCurveTo(1.5, 4.6, -1.5, wide - 1.2, -3.6, wide - 2.4);
  path.bezierCurveTo(-5.4, 2.6, -5.4, -2.6, -3.6, -(wide - 2.4));
  path.bezierCurveTo(-1.5, -(wide - 1.2), 1.5, -4.6, 3.6, -3.4);
  path.closePath();
  // For the beach crowd the trunk is skin and the swimwear is drawn on top;
  // for everybody else it is the shirt.
  ctx.fillStyle = look.style === "night" ? look.skin : look.shirt;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(path);
  ctx.stroke(path);
  // A seam down the middle, so the two halves of the back read as a back.
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-4.4, 0);
  ctx.lineTo(2.6, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // The collar of the shirt, not the neck inside it. A patch of skin in the
  // middle of a chest reads from above as a bare belly, which is nobody's
  // idea of a passer-by.
  const collar = new Path2D();
  collar.moveTo(3.4, -2.2);
  collar.quadraticCurveTo(4.4, 0, 3.4, 2.2);
  collar.quadraticCurveTo(2.4, 0, 3.4, -2.2);
  collar.closePath();
  ctx.fillStyle = shade(look.shirt);
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.8;
  ctx.fill(collar);
  ctx.stroke(collar);
}

/** One arm: upper arm, sleeve cuff and hand. */
function arm(
  ctx: CanvasRenderingContext2D,
  look: FigureLook,
  sleeve: string,
  side: number,
  swing: number,
): void {
  const from = { x: 1.2, y: side * 3.6 };
  const to = { x: 1.2 + swing * 3.2, y: side * 6.2 };
  const path = new Path2D();
  path.moveTo(from.x + 1.4, from.y);
  path.quadraticCurveTo(to.x + 1.6, to.y - side * 0.6, to.x + 1.2, to.y);
  path.quadraticCurveTo(to.x - 1.6, to.y + side * 1.4, from.x - 1.6, from.y);
  path.closePath();
  ctx.fillStyle = sleeve;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(path);
  ctx.stroke(path);
  const hand = new Path2D();
  hand.ellipse(to.x + 0.8, to.y + side * 0.3, 1.5, 1.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = look.skin;
  ctx.lineWidth = PEN * 0.8;
  ctx.fill(hand);
  ctx.stroke(hand);
}

/**
 * The arm that is doing something: holding a gun out, or throwing a punch.
 *
 * @param side - +1 for the right hand, -1 for the left
 * @param blow - true for a punch, which reaches further and ends in a fist
 * @remarks
 * One shape for both, mirrored to whichever hand is working. A punch reaches
 * further than a raised gun and the hand at the end of it is bigger: at this
 * size the silhouette is the whole of the animation.
 */
function reachArm(
  ctx: CanvasRenderingContext2D,
  look: FigureLook,
  sleeve: string,
  side: number,
  blow: boolean,
): void {
  const path = new Path2D();
  if (blow) {
    path.moveTo(2.2, side * 2.8);
    path.quadraticCurveTo(7.4, side * 3, 9.4, side * 1.8);
    path.quadraticCurveTo(9.8, side * 0.4, 8.2, 0);
    path.quadraticCurveTo(4.8, side * 0.2, 2, side * 0.8);
  } else {
    path.moveTo(2.4, side * 4.2);
    path.quadraticCurveTo(6.4, side * 4.6, 8.2, side * 3.4);
    path.quadraticCurveTo(8.6, side * 2, 7, side * 1.6);
    path.quadraticCurveTo(4.4, side * 1.8, 2.2, side * 2.4);
  }
  path.closePath();
  ctx.fillStyle = sleeve;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(path);
  ctx.stroke(path);
  const fist = new Path2D();
  if (blow) {
    fist.ellipse(9.9, side * 1, 2, 1.8, 0, 0, Math.PI * 2);
  } else {
    fist.ellipse(8.4, side * 2.6, 1.6, 1.4, 0, 0, Math.PI * 2);
  }
  ctx.fillStyle = look.skin;
  ctx.lineWidth = PEN * 0.8;
  ctx.fill(fist);
  ctx.stroke(fist);
}

/**
 * The legs of somebody sitting cross-legged, from above.
 *
 * @remarks
 * Knees out to the sides, shins crossing in front, each foot tucked under the
 * other knee - from straight above that is a wide diamond, and it has to reach
 * well past the trunk in both directions or the body sprite simply covers it
 * and the man reads as a bundle. Drawn as two strokes, a dark one and a
 * narrower one in the trousers over it, because a bent leg of even thickness is
 * one line and not an outline plus a filling.
 */
function paintSitting(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  const bare = look.style === "night";
  for (const side of [-1, 1]) {
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass === 0 ? INK : bare ? look.skin : look.trousers;
      ctx.lineWidth = pass === 0 ? 4.4 : 3.2;
      ctx.beginPath();
      ctx.moveTo(-1.4, side * 2.6);
      ctx.quadraticCurveTo(3.6, side * 6.2, 7, -side * 1.2);
      ctx.stroke();
    }
  }
  // The feet, at the far end of each shin, under the other knee.
  for (const side of [-1, 1]) {
    const shoe = new Path2D();
    shoe.ellipse(7.2, -side * 1.3, 1.9, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = bare ? "#f1f5f9" : "#292524";
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.8;
    ctx.fill(shoe);
    ctx.stroke(shoe);
  }
}

/**
 * Where the arms and legs of a body on the road lie.
 *
 * @remarks
 * Written out rather than mirrored. A corpse with two matching sides looks
 * laid out; the two halves of somebody who has fallen never agree. One leg is
 * pulled up further than the other, one arm is flung back and the other lies
 * across the chest.
 */
const DOWN_LIMBS = [
  // A knee pulled right up towards the chest, and the other leg left trailing.
  { at: [-3.6, 1.6], joint: [-8.8, 4.8], to: [-3.4, 7.6], leg: true },
  { at: [-3.6, -1.6], joint: [-9.4, -3.6], to: [-6.4, -8.2], leg: true },
  // One arm flung back over the head, the other folded across the chest.
  { at: [2.2, 3.2], joint: [-1.8, 6.8], to: [1.4, 9.6], leg: false },
  { at: [2.2, -3.2], joint: [3.8, -6.8], to: [8.2, -5.4], leg: false },
];

/** How far the trunk is turned against the line of the body. */
const SLUMP = 0.16;

/** And the head, rolled to one side. */
const LOLL = -0.5;

/**
 * Somebody dead on the road, seen from above.
 *
 * @remarks
 * The old version was an ellipse with a circle at one end, and it read as a
 * bin bag. What makes it a person is that the four limbs are there and bent:
 * knees drawn up, one arm back, the head rolled over. Limbs and head come
 * first, the trunk lies over where they meet it - which is also the order the
 * standing figure is built in.
 */
function paintDown(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  const bare = look.style === "night";
  const sleeve = bare ? look.skin : look.shirt;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const part of DOWN_LIMBS) {
    // Two straight pieces with the joint between them, not one smooth curve:
    // an elbow and a knee are what make a heap of limbs read as a body.
    const path = new Path2D();
    path.moveTo(part.at[0], part.at[1]);
    path.lineTo(part.joint[0], part.joint[1]);
    path.lineTo(part.to[0], part.to[1]);
    limb(ctx, path, part.leg ? look.trousers : sleeve, part.leg ? 2.8 : 2.2);
    const end = new Path2D();
    end.ellipse(part.to[0], part.to[1], 1.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = part.leg ? (bare ? "#f1f5f9" : "#292524") : look.skin;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.8;
    ctx.fill(end);
    ctx.stroke(end);
  }

  // The trunk, with whatever the sort wears on it, turned a little against the
  // line of the legs.
  ctx.save();
  ctx.translate(-0.6, 0.4);
  ctx.rotate(SLUMP);
  trunk(ctx, look);
  extras(ctx, look);
  ctx.restore();

  // A neck, so that the head is beside the shoulders and not on the chest.
  const neck = new Path2D();
  neck.roundRect(3.6, -0.6, 3.4, 2.6, 1.2);
  ctx.fillStyle = look.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.8;
  ctx.fill(neck);
  ctx.stroke(neck);

  // And the head, past it and rolled over.
  ctx.save();
  ctx.translate(8.8, 1.4);
  ctx.rotate(LOLL);
  paintHead(ctx, look);
  ctx.restore();
}

/**
 * One bent limb: a thick dark stroke with a narrower coloured one over it.
 *
 * @param path - the line the limb follows
 * @param colour - the sleeve or the trouser leg
 * @param thick - how thick the limb is, in city pixels
 * @remarks
 * At this size an arm is a line of even thickness, and drawing a line twice is
 * cheaper and rounder than building an outline round a filling.
 */
function limb(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  colour: string,
  thick: number,
): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = thick + 1.1;
  ctx.stroke(path);
  ctx.strokeStyle = colour;
  ctx.lineWidth = thick;
  ctx.stroke(path);
}

/** Whatever the style puts on the front of the trunk. */
function extras(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  if (look.style === "posh") {
    // Lapels and a tie between them.
    const left = new Path2D();
    left.moveTo(3.4, -2.6);
    left.lineTo(0.4, -3.2);
    left.lineTo(1.4, -0.6);
    left.closePath();
    const right = new Path2D();
    right.moveTo(3.4, 2.6);
    right.lineTo(0.4, 3.2);
    right.lineTo(1.4, 0.6);
    right.closePath();
    ctx.fillStyle = "#f8fafc";
    ctx.fill(left);
    ctx.stroke(left);
    ctx.fill(right);
    ctx.stroke(right);
    const tie = new Path2D();
    tie.moveTo(2.6, -0.5);
    tie.lineTo(2.6, 0.5);
    tie.lineTo(-0.6, 1);
    tie.lineTo(-0.6, -1);
    tie.closePath();
    ctx.fillStyle = "#b91c1c";
    ctx.fill(tie);
    ctx.stroke(tie);
  } else if (look.style === "bum") {
    // A coat with pieces missing, and a strap across it.
    ctx.fillStyle = "#a8a29e";
    for (const patch of [
      { x: -1.4, y: 2.6, r: 1.3 },
      { x: 1.6, y: -2.4, r: 1 },
      { x: -3, y: -0.6, r: 0.9 },
    ]) {
      const torn = new Path2D();
      torn.ellipse(
        patch.x,
        patch.y,
        patch.r,
        patch.r * 0.8,
        0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill(torn);
      ctx.stroke(torn);
    }
  } else if (look.style === "cop") {
    // A vest with a badge and a radio on the shoulder.
    const vest = new Path2D();
    vest.moveTo(2.8, -3);
    vest.quadraticCurveTo(-3.6, -3.6, -3.8, 0);
    vest.quadraticCurveTo(-3.6, 3.6, 2.8, 3);
    vest.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.fill(vest);
    ctx.stroke(vest);
    const badge = new Path2D();
    badge.ellipse(1.4, -1.6, 0.7, 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fde047";
    ctx.fill(badge);
    const radio = new Path2D();
    radio.rect(0.4, 2.4, 1.4, 1.2);
    ctx.fillStyle = "#292524";
    ctx.fill(radio);
    ctx.stroke(radio);
  } else if (look.style === "gang" || look.style === "player") {
    // An open jacket over the shirt: two panels with a gap down the middle.
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    const jacket = new Path2D();
    jacket.moveTo(2.6, -3.2);
    jacket.quadraticCurveTo(-4, -4, -4.2, 0);
    jacket.quadraticCurveTo(-4, 4, 2.6, 3.2);
    jacket.lineTo(2.2, 1.2);
    jacket.quadraticCurveTo(-2.4, 2.4, -2.4, 0);
    jacket.quadraticCurveTo(-2.4, -2.4, 2.2, -1.2);
    jacket.closePath();
    ctx.fill(jacket);
    ctx.globalAlpha = 1;
  } else if (look.style === "night") {
    // A bikini top: a band across the chest and a strap over each shoulder.
    const top = new Path2D();
    top.moveTo(2.8, -3.4);
    top.quadraticCurveTo(1.2, 0, 2.8, 3.4);
    top.lineTo(0.8, 3.6);
    top.quadraticCurveTo(-0.6, 0, 0.8, -3.6);
    top.closePath();
    ctx.fillStyle = look.shirt;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(top);
    ctx.stroke(top);
    ctx.strokeStyle = look.shirt;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(2.4, -2.8);
    ctx.lineTo(-1.6, -3.2);
    ctx.moveTo(2.4, 2.8);
    ctx.lineTo(-1.6, 3.2);
    ctx.stroke();
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(1.6, 3);
    ctx.lineTo(-2.4, 5.4);
    ctx.stroke();
    const bag = new Path2D();
    bag.roundRect(-3.8, 4.4, 3, 2.2, 0.6);
    ctx.fillStyle = "#a16207";
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(bag);
    ctx.stroke(bag);
  }
}

/**
 * The head, facing east: hair with a parting, a face, and a hat if worn.
 *
 * @remarks
 * From almost straight above, most of a head is hair - so the face is a wedge
 * at the front, and everything on it sits where it would be seen from here:
 * brows and eyes near the front edge, the nose in front of them, the mouth only
 * just on the picture, ears at the sides.
 */
function paintHead(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  // The ears first, so the head covers where they meet it.
  ctx.fillStyle = look.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const side of [-1, 1]) {
    const ear = new Path2D();
    ear.ellipse(0.4, side * 4.1, 0.9, 1.1, 0, 0, Math.PI * 2);
    ctx.fill(ear);
    ctx.stroke(ear);
  }
  // The skull.
  const skull = new Path2D();
  skull.ellipse(0, 0, 4.5, 4.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = look.skin;
  ctx.lineWidth = PEN;
  ctx.fill(skull);
  ctx.stroke(skull);
  if (look.style === "night") {
    // Long hair, which from above is most of what there is to see of her: two
    // curtains down past the shoulders with the parting between them.
    const mane = new Path2D();
    mane.moveTo(1.4, -4.2);
    mane.quadraticCurveTo(-1, -7.6, -5.4, -5.4);
    mane.quadraticCurveTo(-7.4, -2.4, -6.4, 0);
    mane.quadraticCurveTo(-7.4, 2.4, -5.4, 5.4);
    mane.quadraticCurveTo(-1, 7.6, 1.4, 4.2);
    mane.quadraticCurveTo(2.4, 0, 1.4, -4.2);
    mane.closePath();
    ctx.fillStyle = look.hair;
    ctx.fill(mane);
    ctx.stroke(mane);
    // A parting, and a strand either side of it.
    ctx.strokeStyle = shade(look.hair);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(0.6, 0);
    ctx.lineTo(-5.6, 0);
    ctx.moveTo(-1, -2.6);
    ctx.lineTo(-5, -3.6);
    ctx.moveTo(-1, 2.6);
    ctx.lineTo(-5, 3.6);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN;
  } else {
    // The hair over the back two thirds, with a fringe that dips at the middle.
    const hair = new Path2D();
    hair.moveTo(1.6, -4);
    hair.quadraticCurveTo(2.6, -2, 1.9, 0);
    hair.quadraticCurveTo(2.6, 2, 1.6, 4);
    hair.quadraticCurveTo(-2.6, 4.6, -4.4, 1.6);
    hair.quadraticCurveTo(-5, 0, -4.4, -1.6);
    hair.quadraticCurveTo(-2.6, -4.6, 1.6, -4);
    hair.closePath();
    ctx.fillStyle = look.hair;
    ctx.fill(hair);
    ctx.stroke(hair);
  }
  face(ctx, look);
  hat(ctx, look);
}

/** Brows, eyes, nose and mouth on the front wedge of the head. */
function face(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  if (look.style === "night") {
    // Sunglasses after dark, which is the point of them: one dark bar across
    // where the eyes would be, and at this size that is the whole face.
    const shades = new Path2D();
    shades.moveTo(2.5, -2.4);
    shades.quadraticCurveTo(3.9, -2.6, 4, -0.9);
    shades.lineTo(3.6, -0.4);
    shades.lineTo(3.6, 0.4);
    shades.lineTo(4, 0.9);
    shades.quadraticCurveTo(3.9, 2.6, 2.5, 2.4);
    shades.quadraticCurveTo(2.2, 0, 2.5, -2.4);
    shades.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.25;
    ctx.fill(shades);
    ctx.stroke(shades);
    // A red mouth under them.
    ctx.strokeStyle = "#be123c";
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(4.2, -0.7);
    ctx.quadraticCurveTo(4.5, 0, 4.2, 0.7);
    ctx.stroke();
    return;
  }
  for (const side of [-1, 1]) {
    // A brow above each eye: two strokes that give the face an expression.
    ctx.strokeStyle = look.hair;
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    ctx.moveTo(2.4, side * 0.7);
    ctx.lineTo(3, side * 2);
    ctx.stroke();
    const white = new Path2D();
    white.ellipse(3.1, side * 1.5, 0.85, 0.7, side * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.25;
    ctx.fill(white);
    ctx.stroke(white);
    const pupil = new Path2D();
    pupil.ellipse(3.35, side * 1.55, 0.42, 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1c1917";
    ctx.fill(pupil);
  }
  // The nose: a small wedge that catches the light on one side.
  const nose = new Path2D();
  nose.moveTo(3.4, -0.5);
  nose.quadraticCurveTo(4.5, 0, 3.4, 0.5);
  nose.closePath();
  ctx.fillStyle = shade(look.skin);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.22;
  ctx.fill(nose);
  ctx.stroke(nose);
  if (look.style === "bum") {
    // A beard over the chin, which from here is the front edge.
    const beard = new Path2D();
    beard.ellipse(3.4, 0, 1.1, 2.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#a8a29e";
    ctx.lineWidth = 0.3;
    ctx.fill(beard);
    ctx.stroke(beard);
  } else {
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(4.1, -0.7);
    ctx.quadraticCurveTo(4.4, 0, 4.1, 0.7);
    ctx.stroke();
  }
}

/** The cap or hat the style wears, over the hair. */
function hat(ctx: CanvasRenderingContext2D, look: FigureLook): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.8;
  if (look.style === "cop") {
    const cap = new Path2D();
    cap.ellipse(-0.4, 0, 3.9, 3.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill(cap);
    ctx.stroke(cap);
    const peak = new Path2D();
    peak.moveTo(2.6, -2.6);
    peak.quadraticCurveTo(5.2, 0, 2.6, 2.6);
    peak.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.fill(peak);
    ctx.stroke(peak);
    const badge = new Path2D();
    badge.ellipse(1.4, 0, 0.8, 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fde047";
    ctx.fill(badge);
    ctx.stroke(badge);
  } else if (look.style === "gang") {
    const cap = new Path2D();
    cap.ellipse(-0.5, 0, 3.7, 3.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = look.shirt;
    ctx.fill(cap);
    ctx.stroke(cap);
    // Worn backwards: the peak sticks out at the back.
    const peak = new Path2D();
    peak.moveTo(-3.2, -2.2);
    peak.quadraticCurveTo(-5.6, 0, -3.2, 2.2);
    peak.closePath();
    ctx.fill(peak);
    ctx.stroke(peak);
  } else if (look.style === "posh") {
    const brim = new Path2D();
    brim.ellipse(0, 0, 4.6, 4.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1c1917";
    ctx.fill(brim);
    ctx.stroke(brim);
    const crown = new Path2D();
    crown.ellipse(0.2, 0, 2.8, 2.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#292524";
    ctx.fill(crown);
    ctx.stroke(crown);
  }
}

/**
 * A darker version of a colour: the shade under a nose, the fold of a collar.
 *
 * @param colour - any of the palette colours, as `#rrggbb`
 * @returns the same colour with a third taken off each channel
 * @remarks
 * Computed rather than looked up, because every shirt, every skin tone and
 * every future colour needs one, and a table would have to grow with them.
 */
function shade(colour: string): string {
  const hex = colour.replace("#", "");
  if (hex.length !== 6) {
    return colour;
  }
  const darker = [0, 2, 4].map((at) => {
    const part = Number.parseInt(hex.slice(at, at + 2), 16);
    return Math.round(part * 0.68)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${darker.join("")}`;
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
