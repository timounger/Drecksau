/**
 * Draws one frame of a drive: the ground from the side, and what stands on it.
 *
 * @module
 * @remarks
 * A side view, so the canvas is the world seen from a passing car: `x` runs
 * along the route, `y` is height, and the camera follows the motorhome. Nothing
 * here decides anything - it only paints the state the engine handed over.
 *
 * Height and length use the **same** scale on purpose. A slope that looks
 * gentle but stalls the engine would make the game feel broken, so what the
 * player sees has to be what the physics feels.
 *
 * This is the view **on foot**. Behind the wheel the world is drawn looking
 * forward instead - see {@link ./cockpit}.
 */
import {
  heightAt,
  routeLength,
  slopeAt,
  snowShare,
} from "@/games/rv-there-yet/engine/terrain";
import { blend } from "@/games/rv-there-yet/components/palette";
import {
  GOAL_MARGIN,
  PICKUP_REACH,
  type GameState,
  type Person,
  type Route,
} from "@/games/rv-there-yet/engine/types";
import { drawCockpit } from "@/games/rv-there-yet/components/cockpit";

/** The canvas the drive is painted on, in pixels. */
export const CANVAS_W = 960;
export const CANVAS_H = 420;

/** Everything about how it looks, so no number stands unexplained. */
const LOOK = {
  /** Pixels per metre, for both directions. */
  scale: 13,
  /** How far from the left edge the motorhome sits, in pixels. */
  driverX: 250,
  /** How far above the bottom edge the ground under it sits, in pixels. */
  driverY: 150,
  /** How many pixels apart the ground is sampled when drawn. */
  groundStep: 4,
  /** How far each column overlaps the next, in pixels. */
  seam: 1,
  /** How far past both ends of the route the ground is still drawn, in metres. */
  overhang: 120,
  /** A tree, in metres. */
  treeTrunk: 2.6,
  treeCrown: 2.4,
  /** The goal flag, in metres. */
  flagPole: 5,
  flagWidth: 2.6,
  flagHeight: 1.6,
  /** A section marker, in metres - smaller than the goal, and blue. */
  markPole: 3.6,
  markWidth: 1.8,
  markHeight: 1.1,
  /** Line widths, in pixels. */
  ropeWidth: 2,
  outline: 1.5,
  /** How far the background ridge lags behind, as a share of the camera. */
  parallax: 0.35,
  /** The background ridge, in pixels. */
  ridgeHeight: 90,
  ridgeWave: 260,
  ridgeBase: 250,
  /** How thick the track on top of the ground is drawn, in pixels. */
  trackWidth: 5,
  /** How much of a hint an anchor in reach gets. */
  glowRadius: 13,
  /** The things lying about, in metres. */
  tyreR: 0.55,
  /** The ring around a thing within reach: how wide, and how high off the ground. */
  glowWide: 1.6,
  glowUp: 0.7,
  sprayWide: 0.34,
  sprayTall: 0.6,
  sprayCap: 0.16,
  /** The bear, in metres. */
  bearLong: 2.2,
  bearHigh: 1.5,
  bearLegs: 0.55,
  bearLeg: 0.4,
  bearHead: 0.5,
  bearEar: 0.2,
  bearRound: 0.5,
  /** The hammer where it lies, in metres. */
  hammerShaft: 0.9,
  hammerHead: 0.42,
  hammerThick: 0.16,
  /** The smoke over a wrecked motorhome, in metres. */
  smokeR: 0.5,
  smokeUp: 4.4,
  smokeApart: 1.1,
} as const;

/**
 * The motorhome itself, in metres, measured from the point where the wheels
 * touch the ground: `x` runs forward (it drives to the right), `y` upwards.
 *
 * @remarks
 * A classic alcove camper - the box with the bed that juts out over the driver's
 * cab. Every measurement here is a real one, so the vehicle sits in the same
 * scale as the ground it drives on.
 */
const RV = {
  /** Bumper to bumper. */
  length: 7.2,
  /** Where the wheels sit, and how big they are. */
  rearAxle: -2.1,
  frontAxle: 2.0,
  wheel: 0.62,
  hub: 0.34,
  /**
   * The off-road tyres, once they are fitted.
   *
   * @remarks
   * Bigger than the road tyres, and that is the whole point: they have to be
   * recognisable across the width of the screen. The vehicle rides the
   * difference higher, exactly as a real one on oversized rubber does - which
   * is a second, quieter way of saying "these are on".
   */
  offRoad: 0.86,
  offRoadHub: 0.4,
  /** How far the tread blocks stand out, and how many go round. */
  tread: 0.11,
  treadCount: 14,
  /** Floor and roof of the living box. */
  floor: 0.72,
  roof: 3.35,
  /** The brown skirt along the bottom, and the thin stripe above it. */
  skirt: 0.55,
  stripeAt: 1.9,
  stripeThick: 0.12,
  /** How round the corners of the box are. */
  corner: 0.35,
  /** How round a window is - far less, or a small pane looks like a porthole. */
  glassCorner: 0.12,
  /** The alcove: roof runs almost to the nose, then falls to its tip. */
  alcoveRoofTo: 3.35,
  alcoveTipHigh: 3.05,
  /** The underside of the alcove - the cab lives below this. */
  alcoveUnder: 2.25,
  /**
   * The cab, tucked back under the alcove so the bed juts out over it.
   *
   * @remarks
   * `cabBackX` is where the alcove's underside ends; from there the front of
   * the cab leans forward and down to `bonnetX`. The overhang between the two
   * is the whole point of an alcove camper.
   */
  cabBackX: 3.2,
  bonnetX: 3.45,
  bonnetY: 1.1,
  /**
   * The driver's side window.
   *
   * @remarks
   * Not the windscreen: seen from the side that one stands almost edge-on and
   * would be a sliver two pixels wide. What a passer-by actually sees is the
   * window of the cab door.
   */
  cabWindowFrom: 2.45,
  cabWindowTo: 3.1,
  cabWindowLow: 1.5,
  cabWindowHigh: 2.15,
  /** The side window of the living area. */
  sideFrom: -3.0,
  sideTo: -0.9,
  sideLow: 2.15,
  sideHigh: 2.95,
  /** The door, with its own little window. */
  doorFrom: -0.5,
  doorTo: 0.9,
  doorLow: 1.32,
  doorHigh: 2.95,
  doorPaneInset: 0.18,
  doorPaneLow: 2.05,
  /** The window of the bed in the alcove. */
  alcoveWindowFrom: 2.35,
  alcoveWindowTo: 3.25,
  alcoveWindowLow: 2.55,
  alcoveWindowHigh: 3.08,
} as const;

/**
 * The driver, in metres, measured from the ground up.
 *
 * @remarks
 * A stout fellow in a flat cap and round sunglasses, shirt sleeves and a
 * rust-coloured waistcoat. Small on screen - about twenty pixels - so what has
 * to carry is the silhouette: cap, glasses, round middle, short legs.
 */
const WALKER = {
  height: 1.78,
  /** The body, as a barrel from the hips to the shoulders. */
  bodyLow: 0.72,
  bodyHigh: 1.42,
  bodyWide: 0.8,
  /** How round the shirt and the cap are drawn. */
  bodyRound: 0.22,
  capRound: 0.12,
  brimRound: 0.05,
  /** The head, and the brim that sticks out over its face. */
  headR: 0.29,
  headAt: 1.58,
  capLow: 1.66,
  capHigh: 1.82,
  capWide: 0.62,
  brimFrom: 0.06,
  brimTo: 0.46,
  brimLow: 1.62,
  brimHigh: 1.7,
  /** The sunglasses. */
  glassR: 0.11,
  glassAt: 1.56,
  glassFrom: 0.08,
  /**
   * The walk.
   *
   * @remarks
   * `strideLength` is how far the driver walks per full step cycle, so the
   * legs swing with the ground covered rather than with the clock: stop, and
   * the feet stop mid-air-free, on the ground, where they belong.
   */
  strideLength: 1.5,
  stepReach: 0.3,
  stepLift: 0.09,
  bob: 0.045,
  armSwing: 0.16,
  /** Where the hammer sits in the hand, in metres. */
  handAt: 0.34,
  handHigh: 1.12,
  /** Sleeves, legs and shoes. */
  sleeveLow: 0.98,
  sleeveHigh: 1.3,
  sleeveWide: 0.38,
  legLow: 0,
  legHigh: 0.74,
  legWide: 0.24,
  legApart: 0.36,
  shoeHigh: 0.14,
  shoeWide: 0.34,
} as const;

/** The colours, light and friendly - it is a holiday, after all. */
const PAINT = {
  skyTop: "#bfe3f7",
  skyBottom: "#eaf6fd",
  ridge: "#b9cfc0",
  ground: "#7ba05b",
  groundDeep: "#5c7a42",
  track: "#a68a5b",
  snow: "#eef4fa",
  snowDeep: "#a9bccf",
  snowTrack: "#8ea4bb",
  rock: "#8d8677",
  trunk: "#6b4a2f",
  crown: "#2f7d46",
  crownNear: "#4fae63",
  crownReady: "#7ddc8f",
  rope: "#d9d9d9",
  hook: "#f4b400",
  body: "#efe4cb",
  bodyRoof: "#f8f2e4",
  bodyStripe: "#8a4a2b",
  bodySkirt: "#7a4025",
  window: "#b7cfd8",
  windowDark: "#8fa9b4",
  wheel: "#2b2b2b",
  rim: "#e8dcc2",
  takeGlow: "#ffd75e88",
  flagPole: "#555555",
  flag: "#d94f3d",
  markPole: "#4a5a6b",
  markFlag: "#3f7fd0",
  markFlagPassed: "#6d8bab",
  outline: "#2b2b2b",
  skin: "#f0c9a4",
  shirt: "#f4f1e8",
  vest: "#a8552c",
  cap: "#8a4a2b",
  trousers: "#6d4326",
  shoe: "#3a2a1c",
  glasses: "#22252a",
  hammerHead: "#5a5f66",
  hammerShaft: "#8a5a2b",
  smoke: "#6f6f6f",
  spray: "#c0392b",
  sprayCap: "#f0f0f0",
  bear: "#4a3527",
} as const;

/**
 * Paints the whole scene.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param candidate - the anchor the rope is long enough for, or -1
 * @param ready - the anchor the driver is standing at, or -1
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  candidate: number,
  ready: number,
  me = 0,
): void {
  const mine = state.people[me] ?? state.people[0];
  // Two views of one world: from the seat, or from the side. Behind the wheel
  // what matters is the road ahead; on foot it is where you and the motorhome
  // stand in relation to each other, and no windscreen shows you that.
  if (mine.inside) {
    // Only one of the two seats has a wheel in front of it, and which one you
    // are in is not a detail: it decides whether the pedals answer to you.
    drawCockpit(ctx, state, route, candidate, state.driver === me);
    return;
  }
  const camera = cameraOf(mine, state, route);
  drawSky(ctx);
  drawRidge(ctx, camera);
  drawGround(ctx, route, camera);
  drawItems(ctx, state, route, camera);
  drawSectionFlags(ctx, state, route, camera);
  drawAnchors(ctx, route, camera, candidate, ready);
  drawGoal(ctx, route, camera);
  drawRope(ctx, state, route, camera);
  drawRv(ctx, state, route, camera);
  // Everybody who is out of the cab, so two players can see each other.
  for (const person of state.people) {
    if (!person.inside) {
      drawWalker(ctx, person, state, route, camera);
    }
  }
}

/** Where the world sits on the canvas. */
type Camera = { readonly x: number; readonly y: number };

/**
 * Puts whoever the player is steering at their place on screen.
 *
 * @remarks
 * The camera follows the **driver**, not the vehicle: while they are off
 * fetching the rope, what matters is where they are walking, and a camera
 * nailed to a parked motorhome would leave them off the edge.
 */
function cameraOf(mine: Person, state: GameState, route: Route): Camera {
  const focus = mine.inside ? state.rv.x : mine.at;
  return {
    x: focus - LOOK.driverX / LOOK.scale,
    y: heightAt(route, focus) - (CANVAS_H - LOOK.driverY) / LOOK.scale,
  };
}

/** Turns a point of the world into a point on the canvas. */
function toScreen(camera: Camera, x: number, y: number) {
  return {
    px: (x - camera.x) * LOOK.scale,
    py: CANVAS_H - (y - camera.y) * LOOK.scale,
  };
}

/** The sky, a little brighter towards the ground. */
function drawSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, PAINT.skyTop);
  sky.addColorStop(1, PAINT.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

/** A far ridge that drifts by more slowly, so the drive has depth. */
function drawRidge(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const shift = camera.x * LOOK.scale * LOOK.parallax;
  ctx.fillStyle = PAINT.ridge;
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_H);
  for (let px = 0; px <= CANVAS_W; px += LOOK.groundStep) {
    const wave = Math.sin((px + shift) / LOOK.ridgeWave);
    ctx.lineTo(px, LOOK.ridgeBase - wave * LOOK.ridgeHeight);
  }
  ctx.lineTo(CANVAS_W, CANVAS_H);
  ctx.closePath();
  ctx.fill();
}

/**
 * The ground itself, sampled across the visible width.
 *
 * @remarks
 * Column by column rather than as one filled shape, because the colour is not
 * one colour: where the ground rises past the snow line it fades to white, so
 * the plateau at the start and the passes later on are snowed in while the
 * valleys stay green.
 */
function drawGround(
  ctx: CanvasRenderingContext2D,
  route: Route,
  camera: Camera,
): void {
  // The map ends where it ends, and so does the ground: past the start there
  // is a drop, not more plateau. Drawing ground nobody may walk on would be a
  // small lie told sixty times a second.
  const edge = Math.max(0, toScreen(camera, 0, 0).px);
  for (let px = edge; px <= CANVAS_W; px += LOOK.groundStep) {
    const left = camera.x + px / LOOK.scale;
    const right = camera.x + (px + LOOK.groundStep) / LOOK.scale;
    const leftY = toScreen(camera, left, groundAt(route, left)).py;
    const rightY = toScreen(camera, right, groundAt(route, right)).py;
    const white = snowShare(
      (groundAt(route, left) + groundAt(route, right)) / 2,
    );

    const fill = ctx.createLinearGradient(0, leftY, 0, CANVAS_H);
    fill.addColorStop(0, blend(PAINT.ground, PAINT.snow, white));
    fill.addColorStop(1, blend(PAINT.groundDeep, PAINT.snowDeep, white));
    ctx.fillStyle = fill;
    // A hair wider than the step: on fractional pixel edges two neighbouring
    // columns otherwise leave a seam, and a hillside full of seams looks like
    // corduroy.
    ctx.beginPath();
    ctx.moveTo(px, leftY);
    ctx.lineTo(px + LOOK.groundStep + LOOK.seam, rightY);
    ctx.lineTo(px + LOOK.groundStep + LOOK.seam, CANVAS_H);
    ctx.lineTo(px, CANVAS_H);
    ctx.closePath();
    ctx.fill();

    // A worn track on the surface. Without it the ground is one flat mass and
    // it is hard to tell at a glance how steep what lies ahead actually is.
    ctx.strokeStyle = blend(PAINT.track, PAINT.snowTrack, white);
    ctx.lineWidth = LOOK.trackWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px, leftY);
    ctx.lineTo(px + LOOK.groundStep + LOOK.seam, rightY);
    ctx.stroke();
  }
}

/** The height outside the route, so the road does not end in mid-air. */
function groundAt(route: Route, x: number): number {
  const end = routeLength(route);
  if (x < -LOOK.overhang || x > end + LOOK.overhang) {
    return heightAt(route, Math.min(end, Math.max(0, x)));
  }
  return heightAt(route, x);
}

/**
 * The trees the rope can be hooked to.
 *
 * @remarks
 * Two levels of hint, because there are two questions: the tree the rope would
 * be long enough for glows softly ("walk over there"), and the one the driver
 * is actually standing at glows brightly ("press it now").
 */
function drawAnchors(
  ctx: CanvasRenderingContext2D,
  route: Route,
  camera: Camera,
  candidate: number,
  ready: number,
): void {
  route.anchors.forEach((anchor, index) => {
    const foot = toScreen(camera, anchor.x, anchor.y);
    if (foot.px < -LOOK.glowRadius || foot.px > CANVAS_W + LOOK.glowRadius) {
      return;
    }
    const top = foot.py - LOOK.treeTrunk * LOOK.scale;
    ctx.strokeStyle = PAINT.trunk;
    ctx.lineWidth = LOOK.outline * 2;
    ctx.beginPath();
    ctx.moveTo(foot.px, foot.py);
    ctx.lineTo(foot.px, top);
    ctx.stroke();

    ctx.fillStyle = crownColour(index, candidate, ready);
    ctx.beginPath();
    ctx.arc(foot.px, top, LOOK.treeCrown * LOOK.scale, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** How bright a tree's crown is: standing at it, worth walking to, or neither. */
function crownColour(index: number, candidate: number, ready: number): string {
  if (index === ready) {
    return PAINT.crownReady;
  }
  return index === candidate ? PAINT.crownNear : PAINT.crown;
}

/**
 * Whether anybody on foot is close enough to pick a thing up.
 *
 * @param state - the world as it is
 * @param at - where the thing lies, in metres
 * @returns true while somebody could take it
 */
function reachable(state: GameState, at: number): boolean {
  return state.people.some(
    (person) => !person.inside && Math.abs(person.at - at) <= PICKUP_REACH,
  );
}

/**
 * The things lying about on the route, and the bear standing in the way.
 *
 * @remarks
 * Each is drawn only while nobody has picked it up, which is the whole feedback
 * for having done so - the thing is gone from the ground and in somebody's hand
 * instead. One within reach gets a ring, so that it is plain **before** the key
 * is pressed rather than only in the line of text.
 */
function drawItems(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  for (const item of route.items) {
    if (state.people.some((person) => person.carrying.includes(item.kind))) {
      continue;
    }
    const foot = toScreen(camera, item.at, heightAt(route, item.at));
    if (foot.px < 0 || foot.px > CANVAS_W) {
      continue;
    }
    ctx.save();
    ctx.translate(foot.px, foot.py);
    // A ring the moment somebody is close enough to take it. Without it the
    // only sign is a line of text, and a player looking at the road walks
    // straight past a thing they are standing on.
    if (reachable(state, item.at)) {
      ctx.fillStyle = PAINT.takeGlow;
      ctx.beginPath();
      ctx.arc(0, -m(LOOK.glowUp), m(LOOK.glowWide), 0, Math.PI * 2);
      ctx.fill();
    }
    if (item.kind === "hammer") {
      hammerShape(ctx, 0);
    } else if (item.kind === "tyres") {
      tyreShape(ctx);
    } else {
      sprayShape(ctx);
    }
    ctx.restore();
  }
  drawBear(ctx, state, route, camera);
}

/** A pair of chunky off-road tyres, leaning against each other. */
function tyreShape(ctx: CanvasRenderingContext2D): void {
  for (const side of [-1, 1]) {
    ctx.fillStyle = PAINT.wheel;
    ctx.beginPath();
    ctx.arc(
      m((side * LOOK.tyreR) / 2),
      -m(LOOK.tyreR),
      m(LOOK.tyreR),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = PAINT.rim;
    ctx.beginPath();
    ctx.arc(
      m((side * LOOK.tyreR) / 2),
      -m(LOOK.tyreR),
      m(LOOK.tyreR / 2),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** A can of bear spray: a red tin with a white cap. */
function sprayShape(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PAINT.spray;
  boxPath(ctx, -LOOK.sprayWide / 2, LOOK.sprayWide / 2, 0, LOOK.sprayTall);
  ctx.fill();
  ctx.fillStyle = PAINT.sprayCap;
  boxPath(
    ctx,
    -LOOK.sprayWide / 2,
    LOOK.sprayWide / 2,
    LOOK.sprayTall,
    LOOK.sprayTall + LOOK.sprayCap,
  );
  ctx.fill();
}

/** The bear, until somebody with a can walks up to it. */
function drawBear(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  const bear = state.bear;
  // Carrying the can does nothing any more - only a bear that has been driven
  // off is off the map.
  if (bear === null || bear.gone) {
    return;
  }
  const foot = toScreen(camera, bear.at, heightAt(route, bear.at));
  if (foot.px < 0 || foot.px > CANVAS_W) {
    return;
  }
  ctx.save();
  ctx.translate(foot.px, foot.py);
  ctx.fillStyle = PAINT.bear;
  boxPath(
    ctx,
    -LOOK.bearLong / 2,
    LOOK.bearLong / 2,
    LOOK.bearLegs,
    LOOK.bearHigh,
    LOOK.bearRound,
  );
  ctx.fill();
  for (const side of [-1, 1]) {
    boxPath(
      ctx,
      (side * LOOK.bearLong) / 2 - LOOK.bearLeg / 2,
      (side * LOOK.bearLong) / 2 + LOOK.bearLeg / 2,
      0,
      LOOK.bearLegs + LOOK.bearLeg,
    );
    ctx.fill();
  }
  // Head at the front, with an ear on top, so it reads as an animal and not a
  // boulder.
  ctx.beginPath();
  ctx.arc(
    m(LOOK.bearLong / 2),
    -m(LOOK.bearHigh),
    m(LOOK.bearHead),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    m(LOOK.bearLong / 2 + LOOK.bearHead / 2),
    -m(LOOK.bearHigh + LOOK.bearHead),
    m(LOOK.bearEar),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

/**
 * A hammer, lying flat: a shaft and a head across its end.
 *
 * @param ctx - the canvas to paint on
 * @param lift - how high off the ground it is held, in metres
 */
function hammerShape(ctx: CanvasRenderingContext2D, lift: number): void {
  const low = lift;
  const high = lift + LOOK.hammerThick;
  ctx.fillStyle = PAINT.hammerShaft;
  boxPath(ctx, -LOOK.hammerShaft / 2, LOOK.hammerShaft / 2, low, high);
  ctx.fill();
  ctx.fillStyle = PAINT.hammerHead;
  boxPath(
    ctx,
    LOOK.hammerShaft / 2 - LOOK.hammerThick,
    LOOK.hammerShaft / 2 + LOOK.hammerThick,
    low - LOOK.hammerHead / 2 + LOOK.hammerThick / 2,
    high + LOOK.hammerHead / 2 - LOOK.hammerThick / 2,
  );
  ctx.fill();
}

/**
 * A small blue flag on every section.
 *
 * @remarks
 * The ones already behind you are faded, so a glance says both "this is a
 * section" and "you have had this one". Blue and small, so the red goal
 * flag stays the one that means the end.
 */
function drawSectionFlags(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  route.sections.forEach((at, index) => {
    const foot = toScreen(camera, at, heightAt(route, at));
    if (foot.px < -LOOK.glowRadius || foot.px > CANVAS_W + LOOK.glowRadius) {
      return;
    }
    const top = foot.py - LOOK.markPole * LOOK.scale;
    ctx.strokeStyle = PAINT.markPole;
    ctx.lineWidth = LOOK.outline * 2;
    ctx.beginPath();
    ctx.moveTo(foot.px, foot.py);
    ctx.lineTo(foot.px, top);
    ctx.stroke();
    ctx.fillStyle =
      index <= state.section ? PAINT.markFlagPassed : PAINT.markFlag;
    ctx.fillRect(
      foot.px,
      top,
      LOOK.markWidth * LOOK.scale,
      LOOK.markHeight * LOOK.scale,
    );
  });
}

/** The flag at the end of the route. */
function drawGoal(
  ctx: CanvasRenderingContext2D,
  route: Route,
  camera: Camera,
): void {
  const x = routeLength(route) + GOAL_MARGIN;
  const foot = toScreen(camera, x, heightAt(route, x));
  const top = foot.py - LOOK.flagPole * LOOK.scale;
  ctx.strokeStyle = PAINT.flagPole;
  ctx.lineWidth = LOOK.outline * 2;
  ctx.beginPath();
  ctx.moveTo(foot.px, foot.py);
  ctx.lineTo(foot.px, top);
  ctx.stroke();
  ctx.fillStyle = PAINT.flag;
  ctx.fillRect(
    foot.px,
    top,
    LOOK.flagWidth * LOOK.scale,
    LOOK.flagHeight * LOOK.scale,
  );
}

/** The rope, while it is on a hook. */
function drawRope(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  if (state.hooked < 0) {
    return;
  }
  const anchor = route.anchors[state.hooked];
  // The rope hangs on the front bumper, and the bumper leans with the slope -
  // measured flat it would float in mid-air on every climb.
  const angle = Math.atan(slopeAt(route, state.rv.x));
  const reach = RV.length / 2;
  const from = toScreen(
    camera,
    state.rv.x + reach * Math.cos(angle),
    heightAt(route, state.rv.x) + reach * Math.sin(angle) + RV.wheel,
  );
  const to = toScreen(camera, anchor.x, anchor.y + LOOK.treeTrunk);
  ctx.strokeStyle = PAINT.rope;
  ctx.lineWidth = LOOK.ropeWidth;
  ctx.beginPath();
  ctx.moveTo(from.px, from.py);
  ctx.lineTo(to.px, to.py);
  ctx.stroke();
  ctx.fillStyle = PAINT.hook;
  ctx.beginPath();
  ctx.arc(to.px, to.py, LOOK.ropeWidth * 2, 0, Math.PI * 2);
  ctx.fill();
}

/** The motorhome, lying along the slope it stands on. */
function drawRv(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  const foot = toScreen(camera, state.rv.x, heightAt(route, state.rv.x));
  const angle = Math.atan(slopeAt(route, state.rv.x));

  ctx.save();
  ctx.translate(foot.px, foot.py);
  ctx.rotate(-angle);
  // Bigger tyres lift the whole vehicle: the body is drawn from the ground up,
  // so raising it by the difference is what keeps the wheels on the ground.
  const lift = state.tyres ? RV.offRoad - RV.wheel : 0;
  ctx.translate(0, -m(lift));
  ctx.lineWidth = LOOK.outline;
  ctx.strokeStyle = PAINT.outline;

  drawWheels(ctx, state.tyres);
  drawShell(ctx);
  drawTrim(ctx);
  drawGlass(ctx);
  if (state.damaged) {
    drawSmoke(ctx, state.time);
  }

  ctx.restore();
}

/**
 * Three puffs of smoke over a wrecked motorhome.
 *
 * @remarks
 * The state line says it in words, but a vehicle that looks perfectly fine and
 * refuses to move reads as a bug rather than as a wreck.
 */
function drawSmoke(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = PAINT.smoke;
  ctx.globalAlpha = SMOKE_ALPHA;
  for (const puff of [-1, 0, 1]) {
    const drift = Math.sin(time + puff) * LOOK.smokeApart;
    ctx.beginPath();
    ctx.arc(
      m(puff * LOOK.smokeApart + drift),
      -m(LOOK.smokeUp + puff * LOOK.smokeApart),
      m(LOOK.smokeR),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** How solid the smoke is drawn. */
const SMOKE_ALPHA = 0.35;

/** Metres into pixels, inside the motorhome's own frame. */
function m(metres: number): number {
  return metres * LOOK.scale;
}

/** A rectangle given in metres, with `y` counted upwards from the ground. */
function boxPath(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  low: number,
  high: number,
  radius = 0,
): void {
  ctx.beginPath();
  ctx.roundRect(m(from), -m(high), m(to - from), m(high - low), m(radius));
}

/**
 * Both wheels, with the pale rims of the photograph.
 *
 * @param ctx - the canvas to draw on, already at the vehicle
 * @param offRoad - whether the off-road tyres are fitted
 * @remarks
 * The two are meant to be told apart at a glance: the road tyre is a plain
 * black disc, the off-road one is bigger and has tread blocks standing out all
 * the way round. Size alone would be too quiet - on a small screen a wheel a
 * third bigger is just a wheel - so the knobbly silhouette does the talking.
 */
function drawWheels(ctx: CanvasRenderingContext2D, offRoad: boolean): void {
  const radius = offRoad ? RV.offRoad : RV.wheel;
  const hub = offRoad ? RV.offRoadHub : RV.hub;
  for (const axle of [RV.rearAxle, RV.frontAxle]) {
    ctx.fillStyle = PAINT.wheel;
    if (offRoad) {
      drawTread(ctx, m(axle), -m(radius), m(radius));
    }
    ctx.beginPath();
    ctx.arc(m(axle), -m(radius), m(radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAINT.rim;
    ctx.beginPath();
    ctx.arc(m(axle), -m(radius), m(hub), 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The tread blocks standing out around a tyre.
 *
 * @param ctx - the canvas to draw on
 * @param cx - the centre of the wheel, in pixels
 * @param cy - the centre of the wheel, in pixels
 * @param radius - the tyre's radius, in pixels
 * @remarks
 * Drawn **under** the tyre itself, so only the part that sticks out past the
 * rubber shows. That way the blocks cannot smear across the face of the wheel
 * however many of them there are.
 */
function drawTread(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  const block = m(RV.tread);
  ctx.save();
  ctx.translate(cx, cy);
  for (let n = 0; n < RV.treadCount; n++) {
    ctx.save();
    ctx.rotate((n / RV.treadCount) * Math.PI * 2);
    ctx.beginPath();
    ctx.roundRect(-block, -radius - block, block * 2, block * 2, block / 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * The body: living box, cab and the alcove that juts out over it.
 *
 * @remarks
 * One outline rather than three boxes, so the alcove reads as part of the
 * vehicle instead of a crate strapped to its nose.
 */
function drawShell(ctx: CanvasRenderingContext2D): void {
  const nose = RV.length / 2;
  const tail = -RV.length / 2;
  ctx.fillStyle = PAINT.body;
  ctx.beginPath();
  ctx.moveTo(m(tail), -m(RV.floor));
  ctx.lineTo(m(tail), -m(RV.roof - RV.corner));
  ctx.quadraticCurveTo(m(tail), -m(RV.roof), m(tail + RV.corner), -m(RV.roof));
  ctx.lineTo(m(RV.alcoveRoofTo), -m(RV.roof));
  // The alcove: forward to its tip, then straight down to its underside - the
  // overhang is what makes it read as a camper rather than a delivery van.
  ctx.lineTo(m(nose), -m(RV.alcoveTipHigh));
  ctx.lineTo(m(nose), -m(RV.alcoveUnder));
  // Back along the underside of the alcove, then down the front of the cab.
  ctx.lineTo(m(RV.cabBackX), -m(RV.alcoveUnder));
  ctx.lineTo(m(RV.bonnetX), -m(RV.bonnetY));
  ctx.lineTo(m(RV.bonnetX), -m(RV.floor));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // A lighter roof, so the box does not look flat.
  ctx.fillStyle = PAINT.bodyRoof;
  boxPath(ctx, tail + RV.corner, RV.alcoveRoofTo, RV.roof - RV.corner, RV.roof);
  ctx.fill();
}

/** The brown skirt and the stripe that runs the length of the vehicle. */
function drawTrim(ctx: CanvasRenderingContext2D): void {
  const tail = -RV.length / 2;
  ctx.fillStyle = PAINT.bodySkirt;
  boxPath(ctx, tail, RV.bonnetX, RV.floor, RV.floor + RV.skirt);
  ctx.fill();
  ctx.fillStyle = PAINT.bodyStripe;
  boxPath(ctx, tail, RV.cabBackX, RV.stripeAt, RV.stripeAt + RV.stripeThick);
  ctx.fill();
}

/** Windscreen, side window, door and the little window of the bed. */
function drawGlass(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PAINT.window;
  boxPath(
    ctx,
    RV.cabWindowFrom,
    RV.cabWindowTo,
    RV.cabWindowLow,
    RV.cabWindowHigh,
    RV.glassCorner,
  );
  ctx.fill();
  ctx.stroke();

  boxPath(ctx, RV.sideFrom, RV.sideTo, RV.sideLow, RV.sideHigh, RV.glassCorner);
  ctx.fill();
  ctx.stroke();

  boxPath(
    ctx,
    RV.alcoveWindowFrom,
    RV.alcoveWindowTo,
    RV.alcoveWindowLow,
    RV.alcoveWindowHigh,
    RV.glassCorner,
  );
  ctx.fill();
  ctx.stroke();

  // The door: an outline with its own pane, as on the photograph.
  ctx.fillStyle = PAINT.body;
  boxPath(ctx, RV.doorFrom, RV.doorTo, RV.doorLow, RV.doorHigh, RV.glassCorner);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAINT.windowDark;
  boxPath(
    ctx,
    RV.doorFrom + RV.doorPaneInset,
    RV.doorTo - RV.doorPaneInset,
    RV.doorPaneLow,
    RV.doorHigh - RV.doorPaneInset,
    RV.glassCorner,
  );
  ctx.fill();
}

/**
 * The driver, once out of the cab.
 *
 * @remarks
 * Drawn in the same metre-based frame as the motorhome, so the two stand
 * side by side in one scale - a person who came out a head taller than the
 * door would give the whole picture away.
 */
function drawWalker(
  ctx: CanvasRenderingContext2D,
  person: Person,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  const foot = toScreen(camera, person.at, heightAt(route, person.at));
  ctx.save();
  ctx.translate(foot.px, foot.py);
  ctx.lineWidth = LOOK.outline;
  ctx.strokeStyle = PAINT.outline;

  // Everything is drawn facing right and mirrored when walking the other way,
  // so cap brim, glasses and sleeve always point where the driver is going.
  ctx.scale(person.facing, 1);
  // Standing still means standing still: feet together, no bobbing. Freezing
  // the cycle mid-stride would leave the driver posing on one leg at the tree
  // for as long as it takes to tie the rope.
  const cycle = (person.stride / WALKER.strideLength) * Math.PI * 2;
  const swing = person.walking ? Math.sin(cycle) : 0;
  const bob = person.walking ? Math.abs(Math.cos(cycle)) : 0;
  ctx.translate(0, m(bob * WALKER.bob));

  drawLegs(ctx, swing);
  drawTorso(ctx, swing);
  drawHead(ctx);
  if (person.carrying.includes("hammer")) {
    drawCarriedHammer(ctx, state);
  }

  ctx.restore();
}

/**
 * The hammer in the driver's hand - swung while they are mending.
 *
 * @remarks
 * The swing is driven by the progress of the repair rather than by a clock, so
 * it beats while the key is held and stops the moment it is let go. Watching it
 * is how you know that holding the key is doing something.
 */
function drawCarriedHammer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const beat = state.repair > 0 ? Math.sin(state.repair * HAMMER_BEATS) : 0;
  ctx.save();
  ctx.translate(m(WALKER.handAt), -m(WALKER.handHigh));
  ctx.rotate(-Math.abs(beat) * HAMMER_SWING);
  hammerShape(ctx, 0);
  ctx.restore();
}

/** How fast the hammer beats while mending, and how far it swings. */
const HAMMER_BEATS = 12;
const HAMMER_SWING = 1.1;

/**
 * Trousers and shoes, swinging with the walk.
 *
 * @param ctx - the canvas to paint on
 * @param swing - -1 to 1, where in the step cycle the legs are
 */
function drawLegs(ctx: CanvasRenderingContext2D, swing: number): void {
  ctx.fillStyle = PAINT.trousers;
  // One leg forward while the other is back, and the forward one lifted a
  // little - two boxes are enough to read as walking at this size.
  for (const side of [-1, 1]) {
    const step = swing * side * WALKER.stepReach;
    const lift = Math.max(0, swing * side) * WALKER.stepLift;
    const at = (side * WALKER.legApart) / 2 + step;
    boxPath(
      ctx,
      at - WALKER.legWide / 2,
      at + WALKER.legWide / 2,
      WALKER.legLow + lift,
      WALKER.legHigh,
    );
    ctx.fill();
    ctx.fillStyle = PAINT.shoe;
    boxPath(
      ctx,
      at - WALKER.shoeWide / 2,
      at + WALKER.shoeWide / 2,
      WALKER.legLow + lift,
      WALKER.shoeHigh + lift,
    );
    ctx.fill();
    ctx.fillStyle = PAINT.trousers;
  }
}

/**
 * The waistcoat, and the shirt sleeve in front of it.
 *
 * @remarks
 * Round the other way from what one would expect: the rust waistcoat is most
 * of what you see, and the white shirt is only the sleeve. That is what makes
 * the silhouette read as this particular fellow rather than as any old figure.
 */
function drawTorso(ctx: CanvasRenderingContext2D, swing: number): void {
  ctx.fillStyle = PAINT.vest;
  boxPath(
    ctx,
    -WALKER.bodyWide / 2,
    WALKER.bodyWide / 2,
    WALKER.bodyLow,
    WALKER.bodyHigh,
    WALKER.bodyRound,
  );
  ctx.fill();
  ctx.stroke();

  // The arm swings against the legs, as arms do.
  const arm = -swing * WALKER.armSwing;
  ctx.fillStyle = PAINT.shirt;
  boxPath(
    ctx,
    arm - WALKER.sleeveWide / 2,
    arm + WALKER.sleeveWide / 2,
    WALKER.sleeveLow,
    WALKER.sleeveHigh,
    WALKER.bodyRound,
  );
  ctx.fill();
}

/** Head, flat cap and the round dark glasses. */
function drawHead(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(0, -m(WALKER.headAt), m(WALKER.headR), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = PAINT.glasses;
  ctx.beginPath();
  ctx.arc(
    m(WALKER.glassFrom),
    -m(WALKER.glassAt),
    m(WALKER.glassR),
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = PAINT.cap;
  boxPath(
    ctx,
    -WALKER.capWide / 2,
    WALKER.capWide / 2,
    WALKER.capLow,
    WALKER.capHigh,
    WALKER.capRound,
  );
  ctx.fill();
  boxPath(
    ctx,
    WALKER.brimFrom,
    WALKER.brimTo,
    WALKER.brimLow,
    WALKER.brimHigh,
    WALKER.brimRound,
  );
  ctx.fill();
}
