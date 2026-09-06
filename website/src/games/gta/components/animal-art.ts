/**
 * The cats and the dogs, drawn properly - and drawn once.
 *
 * @module
 * @remarks
 * The same bargain as ./figure-art and ./vehicle-art: shapes with outlines
 * instead of a stack of ellipses, painted once into an offscreen canvas and
 * from then on stamped.
 *
 * Two sprites per animal rather than one, for the same reason people have
 * three: the body lies close to the ground and the head is carried above it,
 * and that gap is what makes a dog stand up in a tilted picture instead of
 * lying flat on the tarmac like a rug. Everything is drawn from above, facing
 * east, in city pixels.
 */
import type { AnimalKind } from "@/games/gta/engine/types";

/** How many poses of the trot are kept. */
export const TROT_FRAMES = 4;

/** How many pixels of sprite stand for one city pixel. */
const GRAIN = 8;

/** How many city pixels across a body sprite covers. */
const BODY_SPAN = 24;

/** How many city pixels across a head sprite covers. */
const HEAD_SPAN = 12;

/** How many city pixels across the body sprite stands for. */
export const ANIMAL_BODY_SIZE = BODY_SPAN;

/** How many city pixels across the head sprite stands for. */
export const ANIMAL_HEAD_SIZE = HEAD_SPAN;

/** Every sprite built so far, by what it shows. */
const drawn = new Map<string, HTMLCanvasElement>();

/**
 * The body of an animal: back, legs and tail, seen from above.
 *
 * @param kind - a cat or a dog
 * @param coat - the colour of its fur
 * @param frame - which pose of the trot, 0 to {@link TROT_FRAMES} - 1
 * @returns the sprite, or null where no canvas can be made
 */
export function animalBody(
  kind: AnimalKind,
  coat: string,
  frame: number,
): HTMLCanvasElement | null {
  return sprite(`b|${kind}|${coat}|${frame}`, BODY_SPAN, (ctx) => {
    paintBody(ctx, kind, coat, frame);
  });
}

/**
 * The head of an animal: skull, ears, muzzle and eyes.
 *
 * @param kind - a cat or a dog
 * @param coat - the colour of its fur
 * @returns the sprite, or null where no canvas can be made
 */
export function animalHead(
  kind: AnimalKind,
  coat: string,
): HTMLCanvasElement | null {
  return sprite(`h|${kind}|${coat}`, HEAD_SPAN, (ctx) => {
    paintHead(ctx, kind, coat);
  });
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
  let sheet = drawn.get(key) ?? null;
  if (sheet === null) {
    const made = document.createElement("canvas");
    made.width = span * GRAIN;
    made.height = span * GRAIN;
    const ctx = made.getContext("2d");
    if (ctx !== null) {
      ctx.translate(made.width / 2, made.height / 2);
      ctx.scale(GRAIN, GRAIN);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      paint(ctx);
      drawn.set(key, made);
      sheet = made;
    }
  }
  return sheet;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: where a paw falls, how far an ear sticks out. They
   are shapes, not arithmetic. */

/** The outline every part gets. */
const INK = "#1c1917";

/** How thick that outline is, in city pixels. */
const PEN = 0.5;

/** How each sort is built, so that one drawing serves both. */
const SHAPE: Readonly<
  Record<
    AnimalKind,
    {
      /** Half the length of the back. */
      readonly long: number;
      /** Half the width across the ribs. */
      readonly wide: number;
      /** How far the legs reach out from the body. */
      readonly leg: number;
      /** How long the tail is. */
      readonly tail: number;
      /** How far the tail sweeps as it trots. */
      readonly wag: number;
      /** Half the width of the skull. */
      readonly skull: number;
      /** How pointed the ears are. */
      readonly ear: number;
    }
  >
> = {
  cat: {
    long: 5,
    wide: 2.6,
    leg: 2.2,
    // Not longer than the sprite: a tail that runs out of the picture reads
    // as a plank, which is what the first attempt looked like.
    tail: 6.4,
    wag: 4,
    skull: 2.6,
    ear: 2.4,
  },
  dog: {
    long: 7,
    wide: 3.6,
    leg: 2.8,
    tail: 6,
    wag: 2,
    skull: 3.4,
    ear: 1.6,
  },
};

/**
 * The back, the four legs and the tail.
 *
 * @remarks
 * The legs are what makes it an animal rather than a loaf: two on each side,
 * swinging opposite ways, and drawn **under** the body so that only the paws
 * show past the fur. That is what one sees of a dog from above.
 */
function paintBody(
  ctx: CanvasRenderingContext2D,
  kind: AnimalKind,
  coat: string,
  frame: number,
): void {
  const shape = SHAPE[kind];
  const swing = Math.sin((frame / TROT_FRAMES) * Math.PI * 2);

  // The tail first, so the body lies over where it joins.
  ctx.strokeStyle = INK;
  ctx.lineWidth = kind === "cat" ? 2.4 : 3;
  ctx.beginPath();
  ctx.moveTo(-shape.long, 0);
  ctx.quadraticCurveTo(
    -shape.long - shape.tail * 0.6,
    swing * shape.wag,
    -shape.long - shape.tail,
    swing * shape.wag * 2,
  );
  ctx.stroke();
  ctx.strokeStyle = coat;
  ctx.lineWidth = kind === "cat" ? 1.4 : 2;
  ctx.stroke();

  // The legs: front pair and back pair, one side ahead of the other.
  for (const side of [-1, 1]) {
    for (const [at, phase] of [
      [shape.long * 0.55, 1],
      [-shape.long * 0.55, -1],
    ]) {
      const reach = swing * phase * side * 1.6;
      const paw = new Path2D();
      paw.roundRect(
        at + reach - 1.2,
        side * (shape.wide + shape.leg * 0.4) - 0.9,
        2.4,
        1.8,
        0.9,
      );
      ctx.fillStyle = coat;
      ctx.strokeStyle = INK;
      ctx.lineWidth = PEN;
      ctx.fill(paw);
      ctx.stroke(paw);
    }
  }

  // The back: broader at the shoulders than at the hips.
  const back = new Path2D();
  back.moveTo(shape.long, -shape.wide * 0.8);
  back.quadraticCurveTo(shape.long + 1.4, 0, shape.long, shape.wide * 0.8);
  back.quadraticCurveTo(0, shape.wide * 1.2, -shape.long, shape.wide * 0.7);
  back.quadraticCurveTo(-shape.long - 1.2, 0, -shape.long, -shape.wide * 0.7);
  back.quadraticCurveTo(0, -shape.wide * 1.2, shape.long, -shape.wide * 0.8);
  back.closePath();
  ctx.fillStyle = coat;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 1.4;
  ctx.fill(back);
  ctx.stroke(back);

  // A line down the spine, which is what one actually sees of the fur.
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-shape.long * 0.7, 0);
  ctx.lineTo(shape.long * 0.7, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** The skull, with the ears on it and the muzzle out in front. */
function paintHead(
  ctx: CanvasRenderingContext2D,
  kind: AnimalKind,
  coat: string,
): void {
  const shape = SHAPE[kind];

  // The ears first, so the skull covers where they meet it.
  ctx.fillStyle = coat;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  for (const side of [-1, 1]) {
    const ear = new Path2D();
    if (kind === "cat") {
      // Pricked and triangular: from above that is most of a cat's head.
      ear.moveTo(-0.6, side * (shape.skull - 0.6));
      ear.lineTo(1.4, side * (shape.skull + shape.ear));
      ear.lineTo(-1.8, side * (shape.skull + 0.9));
    } else {
      ear.ellipse(
        -0.8,
        side * (shape.skull + 0.4),
        1.5,
        shape.ear,
        0,
        0,
        Math.PI * 2,
      );
    }
    ear.closePath();
    ctx.fill(ear);
    ctx.stroke(ear);
  }

  const skull = new Path2D();
  skull.ellipse(0, 0, shape.skull + 0.4, shape.skull, 0, 0, Math.PI * 2);
  ctx.lineWidth = PEN * 1.4;
  ctx.fill(skull);
  ctx.stroke(skull);

  // The muzzle: short and blunt on a cat, longer on a dog.
  const nose = new Path2D();
  const snout = kind === "cat" ? 1.6 : 3;
  nose.roundRect(shape.skull - 0.6, -1.1, snout, 2.2, 1);
  ctx.lineWidth = PEN;
  ctx.fill(nose);
  ctx.stroke(nose);
  ctx.fillStyle = "#3f2a26";
  ctx.beginPath();
  ctx.ellipse(shape.skull - 0.8 + snout, 0, 0.6, 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Two eyes, which is the difference between an animal and a bread roll.
  ctx.fillStyle = "#0f172a";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(0.9, side * 1.3, 0.6, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
