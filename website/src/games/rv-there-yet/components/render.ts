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
  FUEL_SECONDS,
  GOAL_MARGIN,
  STILL_SECONDS,
  PICKUP_REACH,
  type GameState,
  type Person,
  type Route,
} from "@/games/rv-there-yet/engine/types";
import { within } from "@/games/rv-there-yet/engine/engine";
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
  /**
   * Where the ground under the motorhome sits, in pixels from the **top**.
   *
   * @remarks
   * Half the canvas, so the road runs across the middle of the frame and the
   * picture has as much sky over it as hillside under it. It used to sit a
   * third of the way down, which left the drive up in the top corner and a
   * great deal of empty green below it.
   */
  driverY: CANVAS_H / 2,
  /**
   * The bridge and the sign that warns about it, in metres.
   *
   * @remarks
   * Old timber over a gap: a deck you can see the thickness of, a post at each
   * end going down out of the picture, and a rail along both sides so it reads
   * as something you drive **on** rather than a stripe painted on the ground.
   *
   * The sign stands a little before the near end, where a sign belongs - far
   * enough back to be read while there is still time to stop.
   */
  deckThick: 0.45,
  railHigh: 1.1,
  railThick: 0.12,
  postEvery: 4,
  postThick: 0.22,
  pierThick: 0.5,
  pierDeep: 26,
  gorgeDeep: 26,
  gorgeLean: 5,
  /** And never more than this share of the width per side. */
  gorgeLeanMost: 0.33,
  signBefore: 9,
  signHigh: 2.4,
  signWide: 1.7,
  signPost: 0.16,
  signEdge: 3,
  /**
   * The tree that is felled across the chasm, in metres.
   *
   * @remarks
   * Bigger than the rope trees: it has to look like something that would
   * **reach**, and once it is down it is the road. Lying, it is drawn as a
   * plain trunk from the far lip to the near one, because that is what it is.
   */
  fellTall: 9,
  fellThick: 0.8,
  fellCrown: 3.4,
  fellLie: 0.9,
  /** How far the felled trunk lands past the near lip, in metres. */
  fellOver: 1.2,
  /** The ladder on the back of the motorhome, in metres. */
  ladderHigh: 3.35,
  ladderWide: 0.5,
  ladderRungs: 5,
  ladderThick: 0.09,
  /** How far an axe lying in the grass leans over, in radians. */
  axeLean: 0.35,
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
  /**
   * The two mountain ranges behind the drive, in pixels.
   *
   * @remarks
   * Two of them, at different speeds, because **one** background that slides
   * past at one rate is only half a reference. The far range barely moves and
   * the near one keeps up better, and between them the eye can tell whether it
   * is the world moving or you.
   *
   * The peaks are what make it work at all. The old backdrop was a single sine
   * wave: smooth, endless and identical everywhere, so a bear walking towards
   * you looked exactly like you walking towards the bear. A skyline needs
   * landmarks - summits you can pick out and watch go by.
   */
  ranges: [
    { parallax: 0.12, spacing: 210, foot: 10, height: 132, snow: true },
    { parallax: 0.38, spacing: 150, foot: 22, height: 74, snow: false },
  ],
  /**
   * The three waves the skyline is mixed from: how fast each turns and how
   * much of the height it contributes.
   *
   * @remarks
   * Their periods share no common multiple, so the line of summits never
   * visibly repeats however far anybody drives.
   */
  skyline: [
    { turn: 1.7, share: 0.3 },
    { turn: 0.61, share: 0.24 },
    { turn: 2.9, share: 0.16 },
  ],
  /** The height a summit has before the waves are added, and its floor. */
  summitMiddle: 0.6,
  summitLowest: 0.2,
  /** How high up a summit has to be before it carries snow, as a share. */
  snowCap: 0.62,
  /** How much of a snowed summit is white, as a share of its height. */
  snowShare: 0.3,
  /**
   * The fog, in metres and in shares.
   *
   * @remarks
   * Clear out to `fogClear` - about a vehicle's length, so what is beside you
   * stays readable - then thickening to `fogThick` of full grey by `fogGone`,
   * which is barely two lengths. Anything gentler and you could still read the
   * profile of the next hill, and then the section is not about feel at all.
   * Drawn in strips rather than as one wash, because the point is not "it is
   * grey" but "you cannot see far".
   */
  fogClear: 8,
  fogGone: 26,
  fogThick: 0.97,
  fogStep: 6,
  /** How thick the track on top of the ground is drawn, in pixels. */
  trackWidth: 5,
  /** How much of a hint an anchor in reach gets. */
  glowRadius: 13,
  /** The things lying about, in metres. */
  tyreR: 0.55,
  /** The ring around a thing within reach: how wide, and how high off the ground. */
  glowWide: 1.6,
  glowUp: 0.7,
  /** The jerrycan, in metres. */
  canWide: 0.42,
  canTall: 0.62,
  canSpout: 0.14,
  canHandle: 0.1,
  /** How wide the handle is compared with the can, and how round the corners. */
  canHandleShare: 0.5,
  canRound: 0.06,
  canRoundSmall: 0.04,
  canRoundTiny: 0.03,
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
  /**
   * The attack: a paw, swung.
   *
   * @remarks
   * `pawBeats` strikes a second. The arc runs from `pawRaise` radians up and
   * back, down through `pawSwing` to just below level, so the blow travels
   * **at** whoever it is dealing with rather than down at the ground - a paw
   * that ended pointing at its own feet read as stamping, not as striking.
   *
   * The body leans a little with each strike - not a lunge across the ground,
   * just the weight going into the swing.
   */
  maulBeats: 2.2,
  maulLean: 0.16,
  pawRaise: 1.25,
  pawSwing: 1.6,
  /** The paw itself, in metres: where it hangs, how long and how thick. */
  pawAt: 0.45,
  pawHigh: 1.15,
  pawLong: 1.3,
  pawThick: 0.34,
  pawClaw: 0.13,
  /** How far apart the claws sit, as a share of the paw's thickness. */
  pawClawSpread: 0.32,
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
  /** Where a carried thing sits in the hand, in metres. */
  handAt: 0.34,
  handHigh: 1.12,
  /** The tyre being fitted: how big it is, and how deep the fitter crouches. */
  tyreR: 0.36,
  tyreHub: 0.16,
  tyreTread: 0.07,
  tyreTreadCount: 10,
  crouch: 0.14,
  /** How big a carried jerrycan is drawn against the one on the ground. */
  canScale: 0.75,
  /**
   * The winch remote, in metres: a handset with a stub of an aerial.
   *
   * @remarks
   * Bigger than the thing would really be. At thirteen pixels to the metre a
   * true-to-life handset came out three pixels across, with a lamp too small
   * to have a colour at all - and a lamp nobody can see is not a signal.
   */
  remoteWide: 0.38,
  remoteTall: 0.62,
  remoteLamp: 0.15,
  remoteLampAt: 0.42,
  /** How round the corners of the handset are, as a share of its width. */
  remoteRound: 0.25,
  /** The bear spray in the hand, and the mist it throws, in metres. */
  sprayScale: 1.15,
  mistFrom: 0.7,
  mistStep: 0.6,
  mistPuffs: 3,
  mistR: 0.22,
  mistGrow: 0.14,
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

/**
 * The figure in the fog: how far off he stands and how he is built, in metres,
 * and from what share of the count he starts to show.
 *
 * @remarks
 * He fades in from `from` of the five seconds, not at the end of them.
 * Appearing only at the moment of losing would be a trick; a shape thickening
 * out of the grey while a number counts up is a warning, and the player still
 * has two seconds to move.
 *
 * Built to be read as a silhouette: head and shoulders taller than the
 * motorhome, arms held clear of the body so they are arms and not an outline,
 * and no face - a first draft that hugged its arms to its sides came out as a
 * fence post.
 *
 * Shared with the driver's view, which draws the same figure at its own scale.
 * Two sets of proportions would be two different figures, and whichever seat
 * you were in you would be told a different story.
 */
export const SLENDER = {
  from: 0.4,
  ahead: 19,
  tall: 4.2,
  wide: 0.5,
  head: 0.3,
  arm: 2.2,
  armAt: 0.82,
  armOut: 0.5,
  armWide: 0.17,
} as const;

/** The black he is painted in, head and all. */
export const SLENDER_INK = "#1b1d20";

/**
 * How solid the figure stands, from a point of view.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @param here - where the one looking stands, in metres
 * @returns nothing to draw at 0, and all of him at 1
 * @remarks
 * He belongs to the fog. The count only ever runs up in it, but this says so
 * on its own rather than trusting the world to have kept the rule.
 */
export function slenderShowing(
  state: GameState,
  route: Route,
  here: number,
): number {
  if (route.fog === null || !within(route.fog, here)) {
    return 0;
  }
  const share = state.still / STILL_SECONDS;
  // Below `from` this comes out negative, which is the same "nothing to draw"
  // as the fog test above - so there is one gate here and not two.
  return Math.max(0, Math.min(1, (share - SLENDER.from) / (1 - SLENDER.from)));
}

/**
 * The exclamation mark on the warning sign, as shares of the sign.
 *
 * @remarks
 * Down the middle: the bar three tenths of the way from the top, the dot below
 * it with a gap between. A triangle has less room low down than high, so the
 * whole mark sits in its upper two thirds where there is width for it.
 */
const MARK = {
  wide: 0.25,
  barFrom: 0.3,
  barTall: 0.35,
  dotFrom: 0.72,
  dotTall: 0.12,
} as const;

/** The weathered timber of the bridge, and the gap it stands over. */
const BRIDGE_PAINT = {
  deck: "#8a6d4b",
  timber: "#6b5236",
  rail: "#7d6142",
  rim: "#6b6257",
  gorge: "#20262d",
  signPost: "#6e6a64",
  signFace: "#f5efe2",
  signEdge: "#c0392b",
  signMark: "#2b2b2b",
} as const;

/** The colours, light and friendly - it is a holiday, after all. */
const PAINT = {
  fog: "#d8dee3",
  skyTop: "#bfe3f7",
  skyBottom: "#eaf6fd",
  rangeFar: "#a9c2d8",
  rangeNear: "#93ae9b",
  rangeSnow: "#eef4fa",
  ground: "#7ba05b",
  groundDeep: "#5c7a42",
  track: "#a68a5b",
  snow: "#eef4fa",
  snowDeep: "#a9bccf",
  snowTrack: "#8ea4bb",
  rock: "#8d8677",
  trunk: "#6b4a2f",
  axeHead: "#b8bec4",
  ladder: "#8d8578",
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
  can: "#c4562a",
  canDark: "#8f3a1c",
  sprayCap: "#f0f0f0",
  bear: "#4a3527",
  bearPaw: "#6b4d38",
  bearClaw: "#e8e0d2",
  remote: "#2f3438",
  remoteLampOn: "#ff5a3c",
  remoteLampOff: "#5a4038",
  mist: "#ffffffb0",
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
  drawMountains(ctx, camera);
  drawGround(ctx, route, camera);
  drawBridges(ctx, route, camera);
  drawChasms(ctx, route, camera);
  drawFellTree(ctx, state, route, camera);
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
  // Last of all, so it closes over the whole picture and not merely the ground.
  drawFog(ctx, state, route, camera, mine);
  // And he stands **in** the fog, so the grey is between him and you.
  drawSlender(ctx, state, route, camera, mine);
}

/**
 * Every bridge on the route, with the gap under it and its warning sign.
 *
 * @param ctx - the canvas to paint on
 * @param route - the route being driven
 * @param camera - where the view sits
 * @remarks
 * Drawn straight after the ground and before anything that stands on the road,
 * so the motorhome crosses **over** the deck rather than behind it.
 *
 * The gap is painted over the hillside rather than cut out of it: the map is a
 * line of heights and knows nothing about what is under the road, so a bridge
 * is a stretch of road that is **drawn** as a bridge. That is enough - what the
 * player has to understand is that the timber is old and will not take the two
 * of them at once, and that is a matter of the sign and the rule, not of the
 * hole being genuine.
 */
function drawBridges(
  ctx: CanvasRenderingContext2D,
  route: Route,
  camera: Camera,
): void {
  for (const bridge of route.bridges) {
    const left = toScreen(camera, bridge.from, heightAt(route, bridge.from));
    const right = toScreen(camera, bridge.to, heightAt(route, bridge.to));
    if (right.px < 0 || left.px > CANVAS_W) {
      continue;
    }
    drawGorge(ctx, left, right);
    drawDeck(ctx, left, right);
    drawSign(ctx, route, camera, bridge.from - LOOK.signBefore);
  }
}

/**
 * The gap the bridge stands over, painted over the hillside behind it.
 *
 * @param ctx - the canvas to paint on
 * @param left - the near end of the deck, on screen
 * @param right - the far end of it
 * @remarks
 * Narrowing as it goes down and darkening with it, so it reads as a ravine
 * rather than a hole somebody cut in the hillside with scissors. It runs past
 * the bottom edge of the canvas on purpose: a gorge with a visible floor is a
 * ditch, and a ditch is something you could climb out of.
 */
function drawGorge(
  ctx: CanvasRenderingContext2D,
  left: { px: number; py: number },
  right: { px: number; py: number },
): void {
  const deep = m(LOOK.gorgeDeep);
  // Never more than a third of the width per side, or a narrow gap closes to
  // a point a few metres down and reads as a crack rather than a drop.
  const lean = Math.min(
    m(LOOK.gorgeLean),
    (right.px - left.px) * LOOK.gorgeLeanMost,
  );
  const wall = ctx.createLinearGradient(0, left.py, 0, left.py + deep);
  wall.addColorStop(0, BRIDGE_PAINT.rim);
  wall.addColorStop(1, BRIDGE_PAINT.gorge);
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.moveTo(left.px, left.py);
  ctx.lineTo(right.px, right.py);
  ctx.lineTo(right.px - lean, right.py + deep);
  ctx.lineTo(left.px + lean, left.py + deep);
  ctx.closePath();
  ctx.fill();
}

/** The deck, its two piers and the rail along both sides. */
function drawDeck(
  ctx: CanvasRenderingContext2D,
  left: { px: number; py: number },
  right: { px: number; py: number },
): void {
  // The piers first, so the deck lies on top of them.
  ctx.fillStyle = BRIDGE_PAINT.timber;
  for (const foot of [left, right]) {
    ctx.fillRect(
      foot.px - m(LOOK.pierThick) / 2,
      foot.py,
      m(LOOK.pierThick),
      m(LOOK.pierDeep),
    );
  }
  ctx.fillStyle = BRIDGE_PAINT.deck;
  ctx.fillRect(left.px, left.py, right.px - left.px, m(LOOK.deckThick));

  // Rail posts along it, and a rail across their tops.
  ctx.fillStyle = BRIDGE_PAINT.rail;
  const span = (right.px - left.px) / m(LOOK.postEvery);
  for (let post = 0; post <= span; post++) {
    const at = left.px + post * m(LOOK.postEvery);
    ctx.fillRect(
      at - m(LOOK.postThick) / 2,
      left.py - m(LOOK.railHigh),
      m(LOOK.postThick),
      m(LOOK.railHigh),
    );
  }
  ctx.fillRect(
    left.px,
    left.py - m(LOOK.railHigh),
    right.px - left.px,
    m(LOOK.railThick),
  );
}

/**
 * The warning sign on the verge before a bridge.
 *
 * @param ctx - the canvas to paint on
 * @param route - the route being driven
 * @param camera - where the view sits
 * @param at - where the sign stands, in metres
 * @remarks
 * A triangle with a red border, which is what a warning looks like on any road
 * anywhere. What it warns **of** is a sentence, and a sentence at thirteen
 * pixels to the metre is a grey smudge - so the words are on the heads-up line
 * and the sign only has to say "read that line".
 */
function drawSign(
  ctx: CanvasRenderingContext2D,
  route: Route,
  camera: Camera,
  at: number,
): void {
  const foot = toScreen(camera, at, heightAt(route, at));
  ctx.fillStyle = BRIDGE_PAINT.signPost;
  ctx.fillRect(
    foot.px - m(LOOK.signPost) / 2,
    foot.py - m(LOOK.signHigh),
    m(LOOK.signPost),
    m(LOOK.signHigh),
  );

  const top = foot.py - m(LOOK.signHigh);
  const half = m(LOOK.signWide) / 2;
  const tall = m(LOOK.signWide);
  ctx.beginPath();
  ctx.moveTo(foot.px, top);
  ctx.lineTo(foot.px + half, top + tall);
  ctx.lineTo(foot.px - half, top + tall);
  ctx.closePath();
  ctx.fillStyle = BRIDGE_PAINT.signFace;
  ctx.fill();
  ctx.strokeStyle = BRIDGE_PAINT.signEdge;
  ctx.lineWidth = LOOK.signEdge;
  ctx.lineJoin = "round";
  ctx.stroke();

  // The bar and dot of an exclamation mark, upright in the middle of it.
  ctx.fillStyle = BRIDGE_PAINT.signMark;
  const wide = half * MARK.wide;
  ctx.fillRect(
    foot.px - wide / 2,
    top + tall * MARK.barFrom,
    wide,
    tall * MARK.barTall,
  );
  ctx.fillRect(
    foot.px - wide / 2,
    top + tall * MARK.dotFrom,
    wide,
    tall * MARK.dotTall,
  );
}

/**
 * Every chasm on the route: a hole in the road with no bottom.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param camera - where the view sits
 * @remarks
 * The same gorge the bridge stands over, and for the same reason - the map is
 * a line of heights and knows nothing about what is under the road, so a gap
 * is a stretch of road that is **drawn** as a gap.
 *
 * Drawn whether or not the tree is down: the gap does not go away, it gets a
 * trunk over it. A hole that vanished the moment it was bridged would leave
 * the player wondering what they had just crossed.
 */
function drawChasms(
  ctx: CanvasRenderingContext2D,
  route: Route,
  camera: Camera,
): void {
  for (const chasm of route.chasms) {
    const left = toScreen(camera, chasm.from, heightAt(route, chasm.from));
    const right = toScreen(camera, chasm.to, heightAt(route, chasm.to));
    if (right.px < 0 || left.px > CANVAS_W) {
      continue;
    }
    drawGorge(ctx, left, right);
  }
}

/**
 * The tree beside the chasm: standing while it stands, lying once it is down.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param camera - where the view sits
 * @remarks
 * Lying, it is drawn from where it stood **back across** the gap, which is
 * both what a felled tree does and what the rule says has happened: the chasm
 * is road from then on, and the road you can see is the trunk.
 */
function drawFellTree(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
): void {
  const at = route.fellTree;
  if (at === null) {
    return;
  }
  const foot = toScreen(camera, at, heightAt(route, at));
  if (foot.px < -CANVAS_W || foot.px > CANVAS_W * 2) {
    return;
  }
  if (!state.felled) {
    ctx.fillStyle = PAINT.trunk;
    ctx.fillRect(
      foot.px - m(LOOK.fellThick) / 2,
      foot.py - m(LOOK.fellTall),
      m(LOOK.fellThick),
      m(LOOK.fellTall),
    );
    ctx.fillStyle = PAINT.crown;
    ctx.beginPath();
    ctx.arc(
      foot.px,
      foot.py - m(LOOK.fellTall),
      m(LOOK.fellCrown),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }
  // Down: the trunk reaches from where it stood back across the gap and onto
  // the far lip - measured off the chasm rather than by its own length, so it
  // is a bridge that plainly **lands** on both sides.
  const gap = route.chasms.find((chasm) => chasm.to <= at);
  const back = toScreen(
    camera,
    gap === undefined ? at - LOOK.fellTall : gap.from - LOOK.fellOver,
    heightAt(route, at),
  );
  ctx.fillStyle = PAINT.trunk;
  ctx.beginPath();
  ctx.roundRect(
    back.px,
    foot.py - m(LOOK.fellLie),
    foot.px - back.px,
    m(LOOK.fellLie),
    m(LOOK.fellLie) / 2,
  );
  ctx.fill();
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

/**
 * The mountains behind everything, two ranges deep.
 *
 * @param ctx - the canvas to paint on
 * @param camera - where the view sits
 * @remarks
 * Drawn far range first, so the near one stands in front of it. Both are built
 * from the same deterministic skyline, so the same stretch of road always shows
 * the same mountains - a landmark that moved about would be worse than none.
 */
function drawMountains(ctx: CanvasRenderingContext2D, camera: Camera): void {
  LOOK.ranges.forEach((range, index) => {
    drawRange(
      ctx,
      camera,
      range,
      index === 0 ? PAINT.rangeFar : PAINT.rangeNear,
    );
  });
}

/** One range of the skyline. */
type Range = (typeof LOOK.ranges)[number];

/**
 * Paints one range of summits.
 *
 * @param ctx - the canvas to paint on
 * @param camera - where the view sits
 * @param range - how far back it stands and how it is shaped
 * @param colour - what it is painted in
 */
function drawRange(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  range: Range,
  colour: string,
): void {
  const shift = camera.x * LOOK.scale * range.parallax;
  const first = Math.floor(shift / range.spacing) - 1;
  // Their feet sit just **below** the line the ground runs along under the
  // camera, so the ground hides the bases and only the summits stand against
  // the sky. A fixed place on the canvas would put them behind the terrain
  // entirely on the plateau, where the ground fills most of the picture.
  const base = LOOK.driverY + range.foot;
  const last = first + Math.ceil(CANVAS_W / range.spacing) + 2;

  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(-range.spacing, CANVAS_H);
  for (let peak = first; peak <= last; peak++) {
    const x = peak * range.spacing - shift;
    ctx.lineTo(x - range.spacing / 2, base);
    ctx.lineTo(x, base - range.height * summitShare(peak));
  }
  ctx.lineTo(CANVAS_W + range.spacing, base);
  ctx.lineTo(CANVAS_W + range.spacing, CANVAS_H);
  ctx.closePath();
  ctx.fill();

  if (!range.snow) {
    return;
  }
  // A white cap on whatever stands high enough to hold snow, which is the one
  // thing that makes a grey triangle read as a mountain.
  ctx.fillStyle = PAINT.rangeSnow;
  for (let peak = first; peak <= last; peak++) {
    const share = summitShare(peak);
    if (share < LOOK.snowCap) {
      continue;
    }
    const x = peak * range.spacing - shift;
    const top = base - range.height * share;
    const cap = range.height * share * LOOK.snowShare;
    const wide = (range.spacing / 2) * (cap / (range.height * share));
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + wide, top + cap);
    ctx.lineTo(x - wide, top + cap);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * How tall the summit with that number is, from 0 to 1.
 *
 * @param peak - which summit, counted along the range
 * @returns its height as a share of the range's own
 * @remarks
 * Three waves that do not share a period, so the skyline never visibly repeats
 * and every summit is its own shape - and the **same** shape every time, which
 * is what makes it a landmark rather than scenery.
 */
export function summitShare(peak: number): number {
  const mixed = LOOK.skyline.reduce(
    (sum, wave) => sum + Math.sin(peak * wave.turn) * wave.share,
    0,
  );
  return Math.min(1, Math.max(LOOK.summitLowest, LOOK.summitMiddle + mixed));
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
 * The figure that comes for whoever stands still in the fog.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param camera - where the view sits
 * @param mine - the person this screen belongs to
 * @remarks
 * Tall, thin and faceless, and he thickens out of the grey as the count runs
 * up rather than arriving all at once. Drawn **after** the fog and not behind
 * it: a shape that the fog then covered would be a shape nobody ever saw.
 *
 * He stands ahead of whoever is being followed, on the ground, at a distance
 * where the fog is already thick - close enough to make out, far enough that
 * he is a silhouette and not a portrait.
 */
function drawSlender(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
  mine: Person,
): void {
  const here = mine.inside ? state.rv.x : mine.at;
  const showing = slenderShowing(state, route, here);
  if (showing <= 0) {
    return;
  }
  const at = here + SLENDER.ahead;
  const foot = toScreen(camera, at, heightAt(route, at));

  ctx.save();
  ctx.globalAlpha = showing;
  ctx.translate(foot.px, foot.py);
  ctx.fillStyle = SLENDER_INK;
  boxPath(ctx, -SLENDER.wide / 2, SLENDER.wide / 2, 0, SLENDER.tall);
  ctx.fill();
  // Arms far too long, hanging straight down and held clear of the body: the
  // one line that says at a glance that this is not a person in the road.
  for (const side of [-1, 1]) {
    const out = side * SLENDER.armOut;
    boxPath(
      ctx,
      Math.min(out, out + side * SLENDER.armWide),
      Math.max(out, out + side * SLENDER.armWide),
      SLENDER.tall * SLENDER.armAt - SLENDER.arm,
      SLENDER.tall * SLENDER.armAt,
    );
    ctx.fill();
  }
  // The head is the same black as the rest of him. A pale one would be truer
  // to the stories and invisible here - white on grey, in a fog, is nothing.
  ctx.beginPath();
  ctx.arc(
    0,
    -m(SLENDER.tall + SLENDER.head / 2),
    m(SLENDER.head),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
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
    } else if (item.kind === "can") {
      canShape(ctx);
    } else if (item.kind === "axe") {
      axeShape(ctx);
    } else {
      sprayShape(ctx);
    }
    ctx.restore();
  }
  drawBear(ctx, state, route, camera);
}

/**
 * An axe lying on the ground, head down.
 *
 * @param ctx - the canvas to paint on, already at the thing
 * @remarks
 * Leaning rather than flat: at thirteen pixels to the metre a haft lying in
 * the grass is a twig, and the head is what says "axe" - so it stands where
 * it can be seen against the ground.
 */
function axeShape(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.rotate(LOOK.axeLean);
  ctx.fillStyle = PAINT.hammerShaft;
  boxPath(ctx, -AXE.handleThick / 2, AXE.handleThick / 2, 0, AXE.handleLong);
  ctx.fill();
  ctx.fillStyle = PAINT.axeHead;
  ctx.beginPath();
  ctx.moveTo(0, -m(AXE.handleLong));
  ctx.lineTo(m(AXE.headLong), -m(AXE.handleLong));
  ctx.lineTo(m(AXE.headLong), -m(AXE.handleLong - AXE.headWide));
  ctx.lineTo(0, -m(AXE.handleLong - AXE.headWide / 2));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * The fog, laid over everything once the drive is inside it.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param camera - where the view sits
 * @param mine - the person this screen belongs to
 * @remarks
 * Thickening with distance from whoever is being followed, so what is right
 * beside you stays readable and everything else goes. That is the whole
 * section: the ground ahead is there, it simply cannot be seen, and the only
 * thing left that says "this is a climb" is the needle losing speed.
 *
 * Drawn in strips of a few pixels each. A single wash of one grey would dim
 * the picture without hiding anything, and the profile of a hill is exactly
 * what has to go.
 */
function drawFog(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  camera: Camera,
  mine: Person,
): void {
  const fog = route.fog;
  if (fog === null) {
    return;
  }
  const here = mine.inside ? state.rv.x : mine.at;
  if (!within(fog, here)) {
    return;
  }
  for (let px = 0; px < CANVAS_W; px += LOOK.fogStep) {
    const away = Math.abs(px + LOOK.fogStep / 2 - LOOK.driverX) / LOOK.scale;
    const share = Math.min(
      1,
      Math.max(0, (away - LOOK.fogClear) / (LOOK.fogGone - LOOK.fogClear)),
    );
    if (share <= 0) {
      continue;
    }
    ctx.globalAlpha = share * LOOK.fogThick;
    ctx.fillStyle = PAINT.fog;
    ctx.fillRect(px, 0, LOOK.fogStep + 1, CANVAS_H);
  }
  ctx.globalAlpha = 1;
}

/**
 * Which way the bear is looking: towards whoever is on foot, else onwards.
 *
 * @param state - the world as it is
 * @param at - where the bear stands, in metres
 * @returns 1 while it looks to the right, -1 to the left
 */
function bearFacing(state: GameState, at: number): number {
  const prey = state.people.find((person) => !person.inside);
  if (prey === undefined) {
    return 1;
  }
  return prey.at >= at ? 1 : -1;
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

/**
 * A jerrycan: a squat can with a handle on top and a spout on one side.
 *
 * @param ctx - the canvas to paint on, standing on the ground
 * @remarks
 * Drawn standing on its base, so the same shape can simply be tipped over when
 * it is being poured - a can that had to be re-drawn upside down would be two
 * drawings to keep in step.
 */
function canShape(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PAINT.can;
  boxPath(
    ctx,
    -LOOK.canWide / 2,
    LOOK.canWide / 2,
    0,
    LOOK.canTall,
    LOOK.canRound,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.canDark;
  // The handle across the top and the spout leaning out of one shoulder.
  const handle = (LOOK.canWide * LOOK.canHandleShare) / 2;
  boxPath(
    ctx,
    -handle,
    handle,
    LOOK.canTall,
    LOOK.canTall + LOOK.canHandle,
    LOOK.canRoundSmall,
  );
  ctx.fill();
  boxPath(
    ctx,
    LOOK.canWide / 2 - LOOK.canSpout / 2,
    LOOK.canWide / 2 + LOOK.canSpout,
    LOOK.canTall - LOOK.canSpout,
    LOOK.canTall + LOOK.canSpout / 2,
    LOOK.canRoundTiny,
  );
  ctx.fill();
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
  // It looks at whoever it is dealing with, so "it is coming for me" is plain
  // from the shape alone.
  const facing = bearFacing(state, bear.at);
  // While it has somebody it swings a paw at them, over and over. A bear that
  // simply stood there while a number counted up would read as a bug, not as
  // four seconds you have left.
  const striking = bear.hold > 0;
  const beat = striking
    ? (Math.sin(state.time * LOOK.maulBeats * Math.PI * 2) + 1) / 2
    : 0;

  ctx.save();
  ctx.translate(foot.px + beat * m(LOOK.maulLean) * facing, foot.py);
  ctx.scale(facing, 1);
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
  if (striking) {
    drawPaw(ctx, beat);
  }
  ctx.restore();
}

/**
 * The front paw, swung at whoever the bear has hold of.
 *
 * @param ctx - the canvas to paint on, already at the bear and facing right
 * @param beat - where in the swing it is, from 0 (raised) to 1 (struck)
 * @remarks
 * Hung from the shoulder and turned, rather than drawn at each position: one
 * limb, one angle, and the claws come along for the ride. Drawn last, so the
 * paw passes **in front of** the head - a swipe that vanished behind its own
 * face would look like a glitch.
 */
function drawPaw(ctx: CanvasRenderingContext2D, beat: number): void {
  ctx.save();
  ctx.translate(m(LOOK.bearLong / 2 - LOOK.pawAt), -m(LOOK.pawHigh));
  ctx.rotate(-LOOK.pawRaise + LOOK.pawSwing * beat);
  // A shade lighter than the body: the swing passes across the bear's own
  // flank, and a paw painted in the body's colour simply disappeared into it.
  ctx.fillStyle = PAINT.bearPaw;
  const thick = m(LOOK.pawThick);
  ctx.beginPath();
  ctx.roundRect(0, -thick / 2, m(LOOK.pawLong), thick, thick / 2);
  ctx.fill();
  // Three claws at the end, so it reads as a blow and not as a stick.
  ctx.fillStyle = PAINT.bearClaw;
  for (const claw of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.arc(
      m(LOOK.pawLong),
      claw * thick * LOOK.pawClawSpread,
      m(LOOK.pawClaw),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = PAINT.bear;
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
  drawLadder(ctx);
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
 * The ladder on the back door, which is the way onto the roof.
 *
 * @param ctx - the canvas to draw on, already at the vehicle
 * @remarks
 * Every motorhome has one, and this one has a job: the roof is the only place
 * high enough to leap the chasm from, and a roof you cannot see a way onto is
 * a puzzle with a missing piece.
 */
function drawLadder(ctx: CanvasRenderingContext2D): void {
  const back = -RV.length / 2;
  ctx.fillStyle = PAINT.ladder;
  for (const side of [0, LOOK.ladderWide]) {
    boxPath(
      ctx,
      back + side,
      back + side + LOOK.ladderThick,
      0,
      LOOK.ladderHigh,
    );
    ctx.fill();
  }
  for (let rung = 1; rung <= LOOK.ladderRungs; rung++) {
    const at = (LOOK.ladderHigh * rung) / (LOOK.ladderRungs + 1);
    boxPath(ctx, back, back + LOOK.ladderWide, at, at + LOOK.ladderThick);
    ctx.fill();
  }
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
  // Off the ground while jumping: the whole figure goes up, legs and all.
  const foot = toScreen(
    camera,
    person.at,
    heightAt(route, person.at) + person.lift,
  );
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
  // In the air the legs stop walking and stretch out: a figure pedalling
  // along a metre above the road would look like a mistake, not a jump.
  const airborne = person.lift > 0;
  const swing = person.walking && !airborne ? Math.sin(cycle) : 0;
  const bob = person.walking && !airborne ? Math.abs(Math.cos(cycle)) : 0;
  // Bent over the wheel while fitting: standing bolt upright with a tyre
  // spinning in mid-air would read as juggling rather than as work.
  const fitting = state.repair > 0 && person.holding === "tyres";
  ctx.translate(0, m(bob * WALKER.bob) + (fitting ? m(WALKER.crouch) : 0));

  drawLegs(ctx, swing);
  drawTorso(ctx, swing);
  drawHead(ctx);
  // What is **in the hand**, not what is in the bag: a hammer nobody has taken
  // out is not being swung at anything.
  if (person.holding === "hammer") {
    drawCarriedHammer(ctx, state);
  }
  if (person.holding === "tyres") {
    drawCarriedTyre(ctx, state);
  }
  if (person.holding === "can") {
    drawCarriedCan(ctx, state);
  }
  if (person.holding === "remote") {
    drawCarriedRemote(ctx, state);
  }
  if (person.holding === "spray") {
    drawCarriedSpray(ctx, state);
  }
  if (person.holding === "axe") {
    drawCarriedAxe(ctx, state);
  }

  ctx.restore();
}

/**
 * The axe in the driver's hand - swung while they are felling the tree.
 *
 * @param ctx - the canvas to paint on, already at the walker
 * @param state - the world as it is
 * @remarks
 * The same swing as the hammer and driven by the same thing: the progress of
 * the work rather than a clock, so it beats while the key is held and stops
 * dead when it is let go. Watching it is how you know something is happening.
 */
function drawCarriedAxe(ctx: CanvasRenderingContext2D, state: GameState): void {
  const beat = state.repair > 0 ? Math.sin(state.repair * HAMMER_BEATS) : 0;
  ctx.save();
  ctx.translate(m(WALKER.handAt), -m(WALKER.handHigh));
  ctx.rotate(-Math.abs(beat) * HAMMER_SWING);
  ctx.fillStyle = PAINT.hammerShaft;
  boxPath(ctx, 0, AXE.handleThick, 0, AXE.handleLong);
  ctx.fill();
  // A head that is wider at its edge than at its eye, which is what makes it
  // an axe rather than a mallet on a stick.
  ctx.fillStyle = PAINT.axeHead;
  ctx.beginPath();
  ctx.moveTo(m(AXE.handleThick), -m(AXE.handleLong));
  ctx.lineTo(m(AXE.handleThick + AXE.headLong), -m(AXE.handleLong));
  ctx.lineTo(
    m(AXE.handleThick + AXE.headLong),
    -m(AXE.handleLong - AXE.headWide),
  );
  ctx.lineTo(m(AXE.handleThick), -m(AXE.handleLong - AXE.headWide / 2));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The axe in the hand, in metres. */
const AXE = {
  handleLong: 0.8,
  handleThick: 0.07,
  headLong: 0.26,
  headWide: 0.3,
} as const;

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

/** How fast the lamp on the remote blinks while the winch runs, per second. */
const LAMP_BLINKS = 4;

/**
 * The winch remote in the driver's hand.
 *
 * @param ctx - the canvas to paint on, already at the walker
 * @param state - the world as it is
 * @remarks
 * A handset with one big lamp: it blinks while the winch is actually running
 * and sits dark when it is not. No aerial, no buttons - at thirteen pixels to
 * the metre anything that small is a smudge, and the lamp is the whole message
 * anyway. The remote is the one tool whose work happens somewhere else -
 * the rope moves over there, the hand does nothing visible - so without the
 * lamp a player holding the key has no way of telling whether it is doing
 * anything at all.
 */
function drawCarriedRemote(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  ctx.save();
  ctx.translate(m(WALKER.handAt), -m(WALKER.handHigh));
  ctx.fillStyle = PAINT.remote;
  boxPath(
    ctx,
    -WALKER.remoteWide / 2,
    WALKER.remoteWide / 2,
    -WALKER.remoteTall / 2,
    WALKER.remoteTall / 2,
    WALKER.remoteWide * WALKER.remoteRound,
  );
  ctx.fill();
  const lit =
    state.winch !== 0 && Math.sin(state.time * LAMP_BLINKS * Math.PI * 2) > 0;
  ctx.fillStyle = lit ? PAINT.remoteLampOn : PAINT.remoteLampOff;
  ctx.beginPath();
  ctx.arc(0, -m(WALKER.remoteLampAt), m(WALKER.remoteLamp), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * The bear spray in the driver's hand, and the mist while it is being used.
 *
 * @param ctx - the canvas to paint on, already at the walker
 * @param state - the world as it is
 * @remarks
 * The mist is drawn only while the can is actually going off at a bear, and it
 * grows with how much has been sprayed - so the puffs say the same thing the
 * percentage says, without anybody having to read it while a bear closes in.
 */
function drawCarriedSpray(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  ctx.save();
  ctx.translate(m(WALKER.handAt), -m(WALKER.handHigh));
  ctx.save();
  ctx.scale(WALKER.sprayScale, WALKER.sprayScale);
  ctx.translate(0, m(LOOK.sprayTall) / 2);
  sprayShape(ctx);
  ctx.restore();

  const going = state.bear !== null && state.bear.sprayed > 0;
  if (!going) {
    ctx.restore();
    return;
  }
  ctx.fillStyle = PAINT.mist;
  for (let puff = 0; puff < WALKER.mistPuffs; puff++) {
    ctx.beginPath();
    ctx.arc(
      m(WALKER.mistFrom + puff * WALKER.mistStep),
      -m(LOOK.sprayTall * WALKER.sprayScale),
      m(WALKER.mistR + puff * WALKER.mistGrow),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** How fast the tyre turns in the hands while it is being fitted. */
const TYRE_SPIN = 5;

/** How far over the can tips while pouring, and how much it wobbles. */
const CAN_TIP = 2;
const CAN_WOBBLE = 0.12;
const CAN_BEATS = 9;

/**
 * The jerrycan in the driver's hands - tipped over while the tank is filling.
 *
 * @param ctx - the canvas to paint on, already at the walker
 * @param state - the world as it is
 * @remarks
 * Carried upright, poured upside down, and the tipping is driven by the
 * progress of the job rather than by a clock - hold the key and it goes over,
 * let go and it comes back up. The small wobble on top is what keeps a tipped
 * can from looking like a picture somebody forgot to finish.
 */
function drawCarriedCan(ctx: CanvasRenderingContext2D, state: GameState): void {
  const done = Math.min(1, state.repair / FUEL_SECONDS);
  const wobble = done > 0 ? Math.sin(state.repair * CAN_BEATS) * CAN_WOBBLE : 0;
  ctx.save();
  ctx.translate(m(WALKER.handAt), -m(WALKER.handHigh));
  ctx.rotate(done * CAN_TIP + wobble);
  ctx.scale(WALKER.canScale, WALKER.canScale);
  canShape(ctx);
  ctx.restore();
}

/**
 * The off-road tyre in the driver's hands - turned while it is being fitted.
 *
 * @param ctx - the canvas to paint on, already at the walker
 * @param state - the world as it is
 * @remarks
 * Turned rather than merely held, and driven by the progress of the job rather
 * than by a clock, so it turns while the key is held and stops the moment it is
 * let go - the same bargain as the hammer. The tread is what makes the turning
 * visible at all: a plain black disc spinning looks exactly like a plain black
 * disc standing still.
 */
function drawCarriedTyre(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  ctx.save();
  ctx.translate(m(WALKER.handAt), -m(WALKER.handHigh));
  ctx.rotate(state.repair * TYRE_SPIN);
  ctx.fillStyle = PAINT.wheel;
  for (let block = 0; block < WALKER.tyreTreadCount; block++) {
    ctx.save();
    ctx.rotate((block / WALKER.tyreTreadCount) * Math.PI * 2);
    ctx.beginPath();
    ctx.roundRect(
      -m(WALKER.tyreTread),
      -m(WALKER.tyreR + WALKER.tyreTread),
      m(WALKER.tyreTread) * 2,
      m(WALKER.tyreTread) * 2,
      m(WALKER.tyreTread) / 2,
    );
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, m(WALKER.tyreR), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAINT.rim;
  ctx.beginPath();
  ctx.arc(0, 0, m(WALKER.tyreHub), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

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
