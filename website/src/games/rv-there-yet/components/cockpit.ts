/**
 * The view from the driver's seat: the road ahead, through the windscreen.
 *
 * @module
 * @remarks
 * The world stays what it always was - a line of heights along one axis. What
 * changes here is only where it is looked at from: instead of watching the
 * motorhome from the side, the camera sits **in** it, and the same height
 * profile is projected into the distance.
 *
 * The projection is the oldest trick in racing games: a point `d` metres ahead
 * is drawn `focal / d` times its size, so the road narrows towards a vanishing
 * point and a hill ahead rises into view long before it is reached. There is no
 * steering in this game, so the road runs dead straight and only its **profile**
 * moves - which is exactly the thing the driver needs to judge.
 */
import {
  heightAt,
  routeLength,
  snowShare,
} from "@/games/rv-there-yet/engine/terrain";
import { blend } from "@/games/rv-there-yet/components/palette";
import {
  SLENDER,
  SLENDER_INK,
  slenderShowing,
  summitShare,
} from "@/games/rv-there-yet/components/render";
import { within } from "@/games/rv-there-yet/engine/engine";
import {
  gearAt,
  KMH_PER_MS,
  GOAL_MARGIN,
  type GameState,
  type Route,
} from "@/games/rv-there-yet/engine/types";

/** How the view is set up. */
const VIEW = {
  /** How high the driver's eyes are above the ground, in metres. */
  eye: 2.3,
  /** Pixels per metre at one metre distance - the lens, in effect. */
  focal: 300,
  /** How far ahead the road is drawn, in metres. */
  sight: 260,
  /** How far apart the road is sampled near the bonnet, in metres. */
  nearStep: 1.5,
  /** How much wider each following sample is - detail near, speed far. */
  spread: 1.06,
  /** The nearest the road is drawn, in metres (the bonnet is in the way). */
  bonnet: 3.5,
  /** Half the width of the track, in metres. */
  roadHalf: 3.2,
  /** Half the width of the verge beside it, in metres. */
  vergeHalf: 7,
  /** How long one stripe of the road surface is, in metres. */
  stripe: 6,
  /** Where the horizon sits, as a share of the canvas height. */
  horizon: 0.44,
  /** How tall the dashboard is, as a share of the canvas height. */
  dash: 0.22,
  /** How thick the lighter lip along its top edge is, in pixels. */
  dashLip: 7,
  /** A tree, in metres. */
  treeSide: 5.5,
  treeTrunk: 3,
  treeCrown: 2.6,
  /** The goal flag, in metres. */
  flagPole: 5,
  flagWide: 2.6,
  flagTall: 1.6,
  /** What things on the road are drawn at, in metres. */
  itemSize: 1.2,
  bearSize: 2.2,
  bearHead: 0.28,
  /**
   * The bridge as it looks down the road, in metres.
   *
   * @remarks
   * From the seat a bridge is its **rails**: two rows of posts running away to
   * the vanishing point, one to each side of the road. The deck itself is the
   * road, and the road is already drawn. The warning sign stands on the verge
   * before it, the same side as the section markers.
   */
  railSide: 4,
  railHigh: 1.1,
  railThick: 0.14,
  postEvery: 4,
  signBefore: 9,
  signHigh: 2.4,
  signWide: 1.7,
  signPost: 0.16,
  /** A section marker, in metres, standing on the left verge. */
  markPole: 3.6,
  markWide: 1.8,
  markTall: 1.1,
  markSide: -5.5,
  /**
   * The steering wheel, as shares of the canvas.
   *
   * @remarks
   * Most of it is below the bottom edge on purpose - that is where a wheel sits
   * when you are looking over it at the road. It is big enough that the
   * speedometer stands **inside** it, the way the instruments of a real vehicle
   * are read through the wheel and not beside it. Only the rim and the top of
   * two spokes show; the hub is off the bottom of the picture.
   */
  wheelWide: 0.3,
  wheelTall: 0.55,
  wheelLine: 11,
  wheelRim: 14,
  wheelHub: 0.03,
  /**
   * How far the two visible spokes stand off the horizontal, as shares of a
   * half turn - so a small number puts them out to the sides, near ten and two.
   */
  wheelSpoke: 0.17,
  /**
   * The instruments, as shares of the canvas.
   *
   * @remarks
   * Between the hands, where a driver's eyes go without leaving the road: the
   * speedometer straight ahead, the gear beside it.
   *
   * The speedometer is an arch rather than a circle - wide and low, like the
   * half-moon instrument of a van, so that it fits in the space a steering
   * wheel leaves and the whole scale is one sweep of the eye.
   */
  dialWide: 0.155,
  dialTall: 0.15,
  dialAt: 0.925,
  dialTicks: 6,
  dialTickIn: 0.72,
  dialLine: 2,
  needleLine: 3,
  /**
   * Where the needle begins and ends, as shares of the way out to the rim.
   *
   * @remarks
   * It does not reach the middle. On a round dial the needle turns about a hub
   * and the middle is its own; on an arch the middle is the only piece of face
   * that stays clear, and that is where the figures go. So the needle is a bar
   * out at the scale - which is where it is read anyway - and the pivot is a
   * dot beneath it.
   */
  needleFrom: 0.5,
  needleTo: 0.95,
  needleHub: 0.06,
  /**
   * The shift gate, as shares of the canvas.
   *
   * @remarks
   * A gate rather than a letter in a box: you see **where** the lever sits, the
   * way you do in a vehicle, and the gear next to it is one slot away rather
   * than a number away.
   */
  gateWide: 0.1,
  gateTall: 0.17,
  /**
   * Where the gate sits: to the **right** of the wheel, not in front of it.
   *
   * @remarks
   * Far enough out that the wheel's rim passes between it and the speedometer,
   * which is where the lever of a van is - beside the driver's right hand, off
   * the instruments. It has its own height rather than the dial's: the dial
   * moved down onto the dashboard when it became an arch, and the lever had no
   * reason to follow it there.
   */
  gateAt: 0.36,
  gateY: 0.84,
  gateRound: 8,
  gateLine: 5,
  /** How far the plate reaches past the slots sideways, in slot widths. */
  gateEdge: 2,
  /** How much room the plate leaves above and below for the labels. */
  gatePadY: 0.07,
  gateLabel: 0.055,
  knobR: 0.011,
  knobLine: 2,
  /** The fastest the speedometer reads, in metres per second. */
  /**
   * What the dial reads at the end of its sweep, in km/h.
   *
   * @remarks
   * A round number so the labels come out round: six ticks of ten. Top gear
   * runs to about 59 km/h, so the needle nearly fills the dial and still has
   * somewhere to go downhill.
   */
  dialTop: 60,
  /** How far in the tick numbers sit, as a share of the radius. */
  dialLabelIn: 0.62,
  /** How big the tick numbers and the digital reading are, in canvas shares. */
  dialLabel: 0.028,
  dialRead: 0.034,
  /**
   * How far **above** the pivot the digital reading sits, as a share of the
   * arch's height.
   *
   * @remarks
   * Inside the arch, under its apex: an arch is hollow in the middle and that
   * hollow is the one place on the instrument where no tick, no number and no
   * needle ever goes.
   */
  dialReadUp: 0.34,
  /** Where the unit sits under the number, as a share of the arch's height. */
  dialUnitUp: 0.12,
  /** How big the unit is written, as a share of the canvas height. */
  dialUnit: 0.026,
  /**
   * The face of the dial, as shares of a half turn.
   *
   * @remarks
   * Left to right over the top: half a turn exactly, so the needle rises and
   * falls again like the hand of a rev counter in a van and never doubles back
   * under itself.
   */
  dialFrom: 1,
  dialSweep: 1,
  /**
   * How far the scale is held back from each end of the face, as a share of a
   * half turn.
   *
   * @remarks
   * The face is the whole arch; the scale is not. The 0 and the 60 sat right
   * on the two corners, where an arch has no room left above them and a number
   * looks pushed off the edge. Held back a little, the instrument has ends of
   * its own again and the scale sits **on** it rather than against its rim.
   */
  dialInset: 0.09,
  /** How far the wheel's centre sits below the bottom edge, as a share of it. */
  wheelDrop: 0.3,
  /** The passenger's side of the dashboard: a glove box and a grab handle. */
  boxWide: 0.26,
  boxTall: 0.11,
  boxAt: 0.06,
  /** How round the corners of the glove box are, as a share of its height. */
  boxRound: 0.25,
  handleWide: 0.2,
  handleTall: 0.022,
  handleAt: 0.02,
  handleRound: 0.011,
  /**
   * The mountains on the horizon, in pixels.
   *
   * @remarks
   * Small: from a seat this low the distance flattens everything. But they are
   * summits, they are landmarks, and they go past - which is the whole reason
   * for them.
   */
  ridgeSpacing: 130,
  ridgeHeight: 34,
  ridgeDrift: 0.25,
  /**
   * The fog seen through the windscreen, as shares of the windscreen.
   *
   * @remarks
   * Thickest at the horizon and clearing towards the bonnet, which is what fog
   * on a road actually looks like from inside a vehicle: the next few metres
   * are there, everything beyond them is a wall of grey. The road still runs
   * up and down underneath it - you simply cannot see which.
   */
  fogTo: 0.62,
  fogThick: 0.97,
  /** How high a summit stands before it carries snow, and how much is white. */
  ridgeSnowFrom: 0.66,
  ridgeSnowShare: 0.34,
} as const;

/** The colours of the view ahead. */
const PAINT = {
  skyTop: "#9ed4f2",
  skyLow: "#e8f5fd",
  ridge: "#9fbcae",
  ridgeSnow: "#eef4fa",
  fog: "#d8dee3",
  snow: "#eef4fa",
  snowDark: "#cddbe8",
  snowRoad: "#c6d5e4",
  snowRoadDark: "#adbfd2",
  verge: "#759c58",
  vergeDark: "#5e8244",
  road: "#b09265",
  roadDark: "#8f7446",
  trunk: "#6b4a2f",
  crown: "#2f7d46",
  crownNear: "#7ddc8f",
  flag: "#d94f3d",
  flagPole: "#555555",
  markPole: "#4a5a6b",
  markFlag: "#3f7fd0",
  rail: "#7d6142",
  chasm: "#20262d",
  signPost: "#6e6a64",
  signFace: "#f5efe2",
  signEdge: "#c0392b",
  signMark: "#2b2b2b",
  thing: {
    hammer: "#8a5a2b",
    tyres: "#2b2b2b",
    spray: "#c0392b",
    bear: "#4a3527",
  } as Readonly<Record<string, string>>,
  can: "#c4562a",
  canDark: "#9c421f",
  rim: "#e8dcc2",
  hammerHead: "#5a5f66",
  sprayCap: "#f0f0f0",
  dial: "#141210",
  dialFace: "#e8e2d6",
  dialTick: "#3a342e",
  needle: "#d94f3d",
  gatePlate: "#141210",
  gateSlot: "#4b443c",
  gateLabel: "#c9c0b2",
  knob: "#d9d2c6",
  knobEdge: "#141210",
  dash: "#241f1c",
  dashLip: "#3c352f",
  wheel: "#5b524a",
  gloveBox: "#332c26",
  gloveEdge: "#4b433b",
  grabHandle: "#6b6058",
} as const;

/**
 * Paints the view through the windscreen.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the map being driven
 * @param candidate - the tree the rope would reach, or -1
 * @param driving - whether this seat is the one with the wheel in front of it
 */
export function drawCockpit(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  candidate: number,
  driving: boolean,
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const eye = heightAt(route, state.rv.x) + VIEW.eye;
  const horizon = height * VIEW.horizon;

  drawSky(ctx, width, height, horizon);
  drawUnderfoot(ctx, state, route, { width, height, horizon, eye });
  drawRidge(ctx, width, horizon, state.rv.x);
  drawRoad(ctx, state, route, { width, height, horizon, eye });
  drawTrees(ctx, state, route, candidate, { width, height, horizon, eye });
  drawSectionFlags(ctx, state, route, { width, height, horizon, eye });
  drawBridges(ctx, state, route, { width, height, horizon, eye });
  drawChasm(ctx, state, route, { width, height, horizon, eye });
  drawThings(ctx, state, route, { width, height, horizon, eye });
  drawFlag(ctx, state, route, { width, height, horizon, eye });
  drawFog(ctx, state, route, { width, height, horizon, eye });
  drawSlender(ctx, state, route, { width, height, horizon, eye });
  drawDashboard(ctx, width, height);
  if (driving) {
    drawSteeringWheel(ctx, width, height);
    drawInstruments(ctx, width, height, state);
  } else {
    drawPassengerSide(ctx, width, height);
  }
}

/** What every projection needs to know. */
type Screen = {
  readonly width: number;
  readonly height: number;
  readonly horizon: number;
  readonly eye: number;
};

/** One projected point of the road. */
type Slice = {
  readonly y: number;
  readonly road: number;
  readonly verge: number;
};

/**
 * Projects a point `ahead` metres down the road.
 *
 * @param screen - canvas size, horizon and eye height
 * @param ground - how high the ground is there, in metres
 * @param ahead - how far away it is, in metres
 * @returns where it lands on the canvas and how wide things are there
 */
function project(screen: Screen, ground: number, ahead: number): Slice {
  const scale = VIEW.focal / ahead;
  return {
    y: screen.horizon + (screen.eye - ground) * scale,
    road: VIEW.roadHalf * scale,
    verge: VIEW.vergeHalf * scale,
  };
}

/** Sky, brighter towards the horizon. */
function drawSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizon: number,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, PAINT.skyTop);
  sky.addColorStop(1, PAINT.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

/**
 * The mountains on the horizon, drifting slowly with the drive.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param horizon - where the horizon lies, in pixels
 * @param travelled - how far the motorhome has come, in metres
 * @remarks
 * Summits rather than a wave, and for the same reason as in the side view: a
 * smooth line looks identical everywhere, so nothing on the horizon tells you
 * whether you are getting anywhere. The skyline is the **same** one, so the two
 * pictures are of one world - a summit you walk past is the summit you then see
 * through the windscreen.
 */
function drawRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizon: number,
  travelled: number,
): void {
  const shift = travelled * VIEW.ridgeDrift;
  const first = Math.floor(shift / VIEW.ridgeSpacing) - 1;
  const last = first + Math.ceil(width / VIEW.ridgeSpacing) + 2;

  ctx.fillStyle = PAINT.ridge;
  ctx.beginPath();
  ctx.moveTo(-VIEW.ridgeSpacing, horizon);
  for (let peak = first; peak <= last; peak++) {
    const px = peak * VIEW.ridgeSpacing - shift;
    ctx.lineTo(px - VIEW.ridgeSpacing / 2, horizon);
    ctx.lineTo(px, horizon - VIEW.ridgeHeight * summitShare(peak));
  }
  ctx.lineTo(width + VIEW.ridgeSpacing, horizon);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAINT.ridgeSnow;
  for (let peak = first; peak <= last; peak++) {
    const share = summitShare(peak);
    if (share < VIEW.ridgeSnowFrom) {
      continue;
    }
    const px = peak * VIEW.ridgeSpacing - shift;
    const top = horizon - VIEW.ridgeHeight * share;
    const cap = VIEW.ridgeHeight * share * VIEW.ridgeSnowShare;
    const wide = (VIEW.ridgeSpacing / 2) * VIEW.ridgeSnowShare;
    ctx.beginPath();
    ctx.moveTo(px, top);
    ctx.lineTo(px + wide, top + cap);
    ctx.lineTo(px - wide, top + cap);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Ground under everything below the horizon.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * The road is drawn as a row of bands between sampled points, and a band only
 * covers the ground it actually stands on. Over a crest, or heading down into
 * a dip, the nearest band starts well below the horizon and everything above
 * it was **sky** - a pale gap in the middle of the picture that reads as
 * seeing straight through the world.
 *
 * So the whole lower half is earth before anything else is drawn on it. The
 * bands then paint road, verge and snow over the top, and where they leave a
 * gap there is ground behind it rather than a hole.
 */
function drawUnderfoot(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const white = snowShare(heightAt(route, state.rv.x));
  ctx.fillStyle = blend(PAINT.vergeDark, PAINT.snowDark, white);
  ctx.fillRect(0, screen.horizon, screen.width, screen.height - screen.horizon);
}

/**
 * The road itself, drawn from far to near in bands.
 *
 * @remarks
 * Each band is a slice of ground between two sample distances, so a rise in the
 * profile becomes a rise on the screen. The bands alternate in shade with the
 * distance **already travelled**, which is what makes the road appear to rush
 * past rather than sit still.
 */
function drawRoad(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const bands = sampleAhead();
  for (let index = bands.length - 1; index > 0; index--) {
    const far = bands[index];
    const near = bands[index - 1];
    const ground = heightAt(route, state.rv.x + far);
    const a = project(screen, ground, far);
    const b = project(screen, heightAt(route, state.rv.x + near), near);
    const dark = Math.floor((state.rv.x + far) / VIEW.stripe) % 2 === 0;
    const white = snowShare(ground);

    ctx.fillStyle = blend(
      dark ? PAINT.vergeDark : PAINT.verge,
      dark ? PAINT.snowDark : PAINT.snow,
      white,
    );
    band(ctx, middle, a.y, a.verge, b.y, b.verge);
    ctx.fill();
    ctx.fillStyle = blend(
      dark ? PAINT.roadDark : PAINT.road,
      dark ? PAINT.snowRoadDark : PAINT.snowRoad,
      white,
    );
    band(ctx, middle, a.y, a.road, b.y, b.road);
    ctx.fill();
  }
}

/** One four-cornered slice of ground, far edge first. */
function band(
  ctx: CanvasRenderingContext2D,
  middle: number,
  farY: number,
  farHalf: number,
  nearY: number,
  nearHalf: number,
): void {
  ctx.beginPath();
  ctx.moveTo(middle - farHalf, farY);
  ctx.lineTo(middle + farHalf, farY);
  ctx.lineTo(middle + nearHalf, nearY);
  ctx.lineTo(middle - nearHalf, nearY);
  ctx.closePath();
}

/**
 * The distances the road is sampled at.
 *
 * @returns the distances, nearest first
 * @remarks
 * Not evenly spaced: close up every metre and a half counts, far away nobody
 * can tell one band from the next. Growing the step keeps the detail where it
 * is looked at and the count where a browser can draw it sixty times a second.
 */
function sampleAhead(): number[] {
  const bands: number[] = [];
  let ahead = VIEW.bonnet;
  let step = VIEW.nearStep;
  while (ahead < VIEW.sight) {
    bands.push(ahead);
    ahead += step;
    step *= VIEW.spread;
  }
  return bands;
}

/** The trees the rope could be hooked to, standing beside the road. */
function drawTrees(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  candidate: number,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const seen = route.anchors
    .map((anchor, index) => ({ anchor, index, gap: anchor.x - state.rv.x }))
    .filter((each) => each.gap > VIEW.bonnet && each.gap < VIEW.sight)
    .sort((a, b) => b.gap - a.gap);

  for (const { anchor, index, gap } of seen) {
    const foot = project(screen, anchor.y, gap);
    const scale = VIEW.focal / gap;
    const at = middle + VIEW.treeSide * scale;
    const top = foot.y - VIEW.treeTrunk * scale;
    ctx.strokeStyle = PAINT.trunk;
    ctx.lineWidth = Math.max(1, scale / VIEW.wheelLine);
    ctx.beginPath();
    ctx.moveTo(at, foot.y);
    ctx.lineTo(at, top);
    ctx.stroke();
    ctx.fillStyle = index === candidate ? PAINT.crownNear : PAINT.crown;
    ctx.beginPath();
    ctx.arc(at, top, VIEW.treeCrown * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The section flags standing along the way, on the other verge.
 *
 * @remarks
 * Opposite the trees on purpose: one side of the road is what you hook a rope
 * to, the other is what tells you where you are.
 */
function drawSectionFlags(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const seen = route.sections
    .map((at) => ({ at, gap: at - state.rv.x }))
    .filter((each) => each.gap > VIEW.bonnet && each.gap < VIEW.sight)
    .sort((a, b) => b.gap - a.gap);

  for (const { at, gap } of seen) {
    const foot = project(screen, heightAt(route, at), gap);
    const scale = VIEW.focal / gap;
    const post = middle + VIEW.markSide * scale;
    const top = foot.y - VIEW.markPole * scale;
    ctx.strokeStyle = PAINT.markPole;
    ctx.lineWidth = Math.max(1, scale / VIEW.wheelLine);
    ctx.beginPath();
    ctx.moveTo(post, foot.y);
    ctx.lineTo(post, top);
    ctx.stroke();
    ctx.fillStyle = PAINT.markFlag;
    ctx.fillRect(post, top, VIEW.markWide * scale, VIEW.markTall * scale);
  }
}

/**
 * Every bridge ahead, seen from the seat: its rails and its warning sign.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * The deck needs no drawing - it **is** the road, and the road is already
 * there. What says "bridge" from behind a windscreen is the rail running away
 * on both sides, and what says "old bridge" is the sign before it.
 *
 * Posts are drawn far to near so the near ones stand in front, and only over
 * the stretch of the bridge that is actually ahead: half a rail hanging in the
 * air behind the bonnet would be worse than none.
 */
function drawBridges(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  for (const bridge of route.bridges) {
    for (
      let at = bridge.to;
      at >= bridge.from - VIEW.postEvery / 2;
      at -= VIEW.postEvery
    ) {
      const gap = at - state.rv.x;
      if (gap <= VIEW.bonnet || gap >= VIEW.sight) {
        continue;
      }
      const foot = project(screen, heightAt(route, at), gap);
      const scale = VIEW.focal / gap;
      ctx.fillStyle = PAINT.rail;
      for (const side of [-1, 1]) {
        ctx.fillRect(
          middle + side * VIEW.railSide * scale,
          foot.y - VIEW.railHigh * scale,
          VIEW.railThick * scale,
          VIEW.railHigh * scale,
        );
      }
    }
    drawWarningSign(ctx, state, route, screen, bridge.from - VIEW.signBefore);
  }
}

/**
 * The chasm ahead, seen from the seat: the road simply stops.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * Painted over the road rather than cut out of it: from here what a hole in
 * the road looks like is a dark band across it, and the far lip standing up
 * beyond the dark. Once the tree is down the same band is timber - which is
 * exactly what has changed about that stretch of road.
 */
function drawChasm(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  for (const chasm of route.chasms) {
    const near = chasm.from - state.rv.x;
    const far = chasm.to - state.rv.x;
    if (far <= VIEW.bonnet || near >= VIEW.sight) {
      continue;
    }
    const lip = project(
      screen,
      heightAt(route, chasm.from),
      Math.max(near, VIEW.bonnet),
    );
    const back = project(
      screen,
      heightAt(route, chasm.to),
      Math.max(far, VIEW.bonnet),
    );
    // Once the tree is down the same band is timber rather than nothing: the
    // trunk is what you drive over, and it is the road for that stretch.
    ctx.fillStyle = state.felled ? PAINT.rail : PAINT.chasm;
    ctx.beginPath();
    ctx.moveTo(middle - lip.verge, lip.y);
    ctx.lineTo(middle + lip.verge, lip.y);
    ctx.lineTo(middle + back.verge, back.y);
    ctx.lineTo(middle - back.verge, back.y);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * The warning sign before a bridge, on the verge.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @param at - where the sign stands, in metres
 * @remarks
 * A red-bordered triangle, which reads as a warning at any size. What it warns
 * of is on the heads-up line: a sentence painted this small is a smudge.
 */
function drawWarningSign(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
  at: number,
): void {
  const gap = at - state.rv.x;
  if (gap <= VIEW.bonnet || gap >= VIEW.sight) {
    return;
  }
  const foot = project(screen, heightAt(route, at), gap);
  const scale = VIEW.focal / gap;
  const post = screen.width / 2 + VIEW.markSide * scale;
  ctx.fillStyle = PAINT.signPost;
  ctx.fillRect(
    post - (VIEW.signPost * scale) / 2,
    foot.y - VIEW.signHigh * scale,
    VIEW.signPost * scale,
    VIEW.signHigh * scale,
  );
  const top = foot.y - VIEW.signHigh * scale;
  const half = (VIEW.signWide * scale) / 2;
  ctx.beginPath();
  ctx.moveTo(post, top);
  ctx.lineTo(post + half, top + half * 2);
  ctx.lineTo(post - half, top + half * 2);
  ctx.closePath();
  ctx.fillStyle = PAINT.signFace;
  ctx.fill();
  ctx.strokeStyle = PAINT.signEdge;
  ctx.lineWidth = Math.max(1, scale / VIEW.wheelLine);
  ctx.lineJoin = "round";
  ctx.stroke();
}

/**
 * What lies on the road ahead, and whatever is standing on it.
 *
 * @remarks
 * The bear above all: being stopped by something you cannot see reads as a
 * broken game, and a bear is exactly the kind of thing a driver wants to spot
 * early.
 */
function drawThings(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const ahead: { at: number; kind: string }[] = route.items
    .filter(
      (item) =>
        !state.people.some((person) => person.carrying.includes(item.kind)),
    )
    .map((item) => ({ at: item.at, kind: String(item.kind) }));
  // Where it **is**, not where the map put it: from the seat you want to see
  // the thing coming, and by then it has left its spot.
  if (state.bear !== null && !state.bear.gone) {
    ahead.push({ at: state.bear.at, kind: "bear" });
  }

  for (const thing of ahead
    .map((each) => ({ ...each, gap: each.at - state.rv.x }))
    .filter((each) => each.gap > VIEW.bonnet && each.gap < VIEW.sight)
    .sort((a, b) => b.gap - a.gap)) {
    const foot = project(screen, heightAt(route, thing.at), thing.gap);
    const scale = VIEW.focal / thing.gap;
    if (thing.kind === "bear") {
      drawBearAhead(ctx, middle, foot.y, scale);
    } else {
      ctx.save();
      ctx.translate(middle, foot.y);
      thingShape(ctx, thing.kind, scale);
      ctx.restore();
    }
  }
}

/**
 * One thing lying in the road, drawn so it can be told apart from the others.
 *
 * @param ctx - the canvas to paint on, already at the thing's feet
 * @param kind - what it is
 * @param scale - how many pixels a metre is at that distance
 * @remarks
 * Every one of them used to be a coloured ball, which said "there is
 * something there" and nothing else - and the jerrycan, having no colour of
 * its own in this view, was a **black** ball. From the seat these are the
 * things you have to decide about while there is still road left to stop in,
 * so each one is drawn as itself: a can with a spout, a hammer with a head, a
 * pair of wheels, a spray with a cap, an axe with a blade.
 *
 * Two or three shapes each, no more. At this distance a fourth is a smudge.
 */
function thingShape(
  ctx: CanvasRenderingContext2D,
  kind: string,
  scale: number,
): void {
  const box = (
    colour: string,
    from: number,
    to: number,
    low: number,
    high: number,
  ) => {
    ctx.fillStyle = colour;
    ctx.fillRect(
      from * scale,
      -high * scale,
      (to - from) * scale,
      (high - low) * scale,
    );
  };
  const disc = (colour: string, at: number, up: number, wide: number) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(at * scale, -up * scale, wide * scale, 0, Math.PI * 2);
    ctx.fill();
  };
  const it = SHAPE[kind] ?? SHAPE.can;
  for (const part of it.boxes) {
    box(part.paint, part.from, part.to, part.low, part.high);
  }
  for (const part of it.discs) {
    disc(part.paint, part.at, part.up, part.wide);
  }
}

/**
 * What each thing is built of, in metres, standing on the road.
 *
 * @remarks
 * Two or three parts each and no more: at the distance these are read from, a
 * fourth is a smudge. What each one needs is the **one** feature that tells it
 * apart - the can's spout, the hammer's head, the second wheel, the pale cap,
 * the blade.
 */
const SHAPE: Readonly<
  Record<
    string,
    {
      readonly boxes: readonly {
        readonly paint: string;
        readonly from: number;
        readonly to: number;
        readonly low: number;
        readonly high: number;
      }[];
      readonly discs: readonly {
        readonly paint: string;
        readonly at: number;
        readonly up: number;
        readonly wide: number;
      }[];
    }
  >
> = {
  can: {
    boxes: [
      { paint: PAINT.can, from: -0.3, to: 0.3, low: 0, high: 1.1 },
      { paint: PAINT.canDark, from: -0.3, to: 0.3, low: 0.55, high: 0.7 },
      { paint: PAINT.can, from: 0.2, to: 0.42, low: 0.95, high: 1.25 },
    ],
    discs: [],
  },
  hammer: {
    boxes: [
      { paint: PAINT.thing.hammer, from: -0.06, to: 0.06, low: 0, high: 1 },
      { paint: PAINT.hammerHead, from: -0.3, to: 0.3, low: 0.85, high: 1.1 },
    ],
    discs: [],
  },
  tyres: {
    boxes: [],
    // Each one a black ring round a pale rim. Two filled discs were two black
    // blobs; what makes a wheel read as a wheel at any size is the hole in
    // the middle of it.
    discs: [
      { paint: PAINT.thing.tyres, at: -0.34, up: 0.5, wide: 0.5 },
      { paint: PAINT.rim, at: -0.34, up: 0.5, wide: 0.22 },
      { paint: PAINT.thing.tyres, at: 0.34, up: 0.5, wide: 0.5 },
      { paint: PAINT.rim, at: 0.34, up: 0.5, wide: 0.22 },
    ],
  },
  spray: {
    boxes: [
      { paint: PAINT.thing.spray, from: -0.22, to: 0.22, low: 0, high: 0.85 },
      { paint: PAINT.sprayCap, from: -0.14, to: 0.14, low: 0.85, high: 1.05 },
    ],
    discs: [],
  },
  axe: {
    boxes: [
      { paint: PAINT.thing.hammer, from: -0.06, to: 0.06, low: 0, high: 1 },
      { paint: PAINT.hammerHead, from: 0.06, to: 0.45, low: 0.7, high: 1.05 },
    ],
    discs: [],
  },
};

/**
 * The bear ahead: a brown mass with a head and two ears.
 *
 * @param ctx - the canvas to paint on
 * @param middle - the middle of the road on screen
 * @param ground - where its feet are, on screen
 * @param scale - how many pixels a metre is at that distance
 * @remarks
 * Without the head it reads as a boulder somebody rolled into the road, and
 * being stopped by a boulder that turns out to be alive is worse than being
 * stopped by a bear.
 */
function drawBearAhead(
  ctx: CanvasRenderingContext2D,
  middle: number,
  ground: number,
  scale: number,
): void {
  const size = VIEW.bearSize * scale;
  ctx.fillStyle = PAINT.thing.bear;
  ctx.beginPath();
  ctx.ellipse(middle, ground - size / 2, size / 2, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  const head = size * VIEW.bearHead;
  ctx.beginPath();
  ctx.arc(middle, ground - size, head, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      middle + side * head,
      ground - size - head,
      head / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/**
 * The figure that comes for whoever stands still in the fog, seen from the cab.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * The same figure as in the side view and the same proportions, projected down
 * the road instead of drawn from the side. Sitting in the vehicle is no way out
 * of the rule, so it must be no way out of the warning either: a driver who
 * only ever saw the number counting up would be told **that** something is
 * wrong without ever being told **what**.
 *
 * Drawn after the fog and before the dashboard, so the grey is between him and
 * the windscreen but he is not behind the instruments.
 */
function drawSlender(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const showing = slenderShowing(state, route, state.rv.x);
  if (showing <= 0) {
    return;
  }
  const at = state.rv.x + SLENDER.ahead;
  const foot = project(screen, heightAt(route, at), SLENDER.ahead);
  const scale = VIEW.focal / SLENDER.ahead;
  /** A box given in metres, standing on the road at the figure's feet. */
  const box = (from: number, to: number, low: number, high: number) =>
    ctx.fillRect(
      from * scale,
      foot.y - high * scale,
      (to - from) * scale,
      (high - low) * scale,
    );

  ctx.save();
  ctx.globalAlpha = showing;
  ctx.translate(screen.width / 2, 0);
  ctx.fillStyle = SLENDER_INK;
  box(-SLENDER.wide / 2, SLENDER.wide / 2, 0, SLENDER.tall);
  for (const side of [-1, 1]) {
    const out = side * SLENDER.armOut;
    const end = out + side * SLENDER.armWide;
    box(
      Math.min(out, end),
      Math.max(out, end),
      SLENDER.tall * SLENDER.armAt - SLENDER.arm,
      SLENDER.tall * SLENDER.armAt,
    );
  }
  ctx.beginPath();
  ctx.arc(
    0,
    foot.y - (SLENDER.tall + SLENDER.head / 2) * scale,
    SLENDER.head * scale,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** The flag at the end of the map, once it is in sight. */
function drawFlag(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const at = routeLength(route) + GOAL_MARGIN;
  const gap = at - state.rv.x;
  if (gap <= VIEW.bonnet || gap >= VIEW.sight) {
    return;
  }
  const foot = project(screen, heightAt(route, at), gap);
  const scale = VIEW.focal / gap;
  const middle = screen.width / 2;
  const top = foot.y - VIEW.flagPole * scale;
  ctx.strokeStyle = PAINT.flagPole;
  ctx.lineWidth = Math.max(1, scale / VIEW.wheelLine);
  ctx.beginPath();
  ctx.moveTo(middle, foot.y);
  ctx.lineTo(middle, top);
  ctx.stroke();
  ctx.fillStyle = PAINT.flag;
  ctx.fillRect(middle, top, VIEW.flagWide * scale, VIEW.flagTall * scale);
}

/**
 * The fog over the road ahead, once the drive is inside it.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * Drawn over the road but **under** the dashboard, so the instruments stay
 * readable - which is the point of the section. The speedometer is the only
 * thing left that says whether the ground is rising: the needle falling away
 * on level throttle means a climb, and nothing on the windscreen will tell you
 * that.
 */
function drawFog(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  if (route.fog === null || !within(route.fog, state.rv.x)) {
    return;
  }
  const to = screen.horizon + screen.height * VIEW.fogTo;
  const wall = ctx.createLinearGradient(0, screen.horizon, 0, to);
  wall.addColorStop(0, PAINT.fog);
  wall.addColorStop(1, "#d8dee300");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, screen.width, to);
  // Above the horizon there is nothing to see through: solid.
  ctx.globalAlpha = VIEW.fogThick;
  ctx.fillStyle = PAINT.fog;
  ctx.fillRect(0, 0, screen.width, screen.horizon);
  ctx.globalAlpha = 1;
}

/**
 * The dashboard, so the view has somewhere to sit.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param height - the canvas height
 * @remarks
 * Only a quarter of the screen, because the road is what the player is here
 * for. A cockpit that takes up half the windscreen is a cockpit you resent.
 */
function drawDashboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const top = height * (1 - VIEW.dash);
  ctx.fillStyle = PAINT.dash;
  ctx.fillRect(0, top, width, height - top);
  ctx.fillStyle = PAINT.dashLip;
  ctx.fillRect(0, top, width, VIEW.dashLip);
}

/**
 * The steering wheel, for the seat that has one.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param height - the canvas height
 * @remarks
 * Mostly cut off by the bottom edge, the way a wheel looks from behind it, and
 * wide enough that the speedometer sits inside the rim rather than beside it.
 * The hub is off the picture, so what shows is the top of the rim and the two
 * spokes running down to it out of sight.
 */
function drawSteeringWheel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const middle = width / 2;
  const centre = height + height * VIEW.wheelTall * VIEW.wheelDrop;
  const across = width * VIEW.wheelWide;
  const down = height * VIEW.wheelTall;

  ctx.strokeStyle = PAINT.wheel;
  ctx.lineWidth = VIEW.wheelRim;
  ctx.beginPath();
  ctx.ellipse(middle, centre, across, down, 0, 0, Math.PI * 2);
  ctx.stroke();

  // The two upper spokes, out of the hub below the edge. Without them the rim
  // reads as an arch drawn on the dashboard rather than as something held.
  ctx.lineWidth = VIEW.wheelLine;
  for (const side of [-1, 1]) {
    const angle =
      side < 0
        ? Math.PI * (1 + VIEW.wheelSpoke)
        : Math.PI * (2 - VIEW.wheelSpoke);
    ctx.beginPath();
    ctx.moveTo(middle, centre);
    ctx.lineTo(
      middle + Math.cos(angle) * across,
      centre + Math.sin(angle) * down,
    );
    ctx.stroke();
  }
  ctx.fillStyle = PAINT.wheel;
  ctx.beginPath();
  ctx.arc(middle, centre, width * VIEW.wheelHub, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The passenger's side of the cab: no wheel, no dials, nothing to hold.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param height - the canvas height
 * @remarks
 * The whole point is what is **missing**. A passenger who still saw a wheel
 * and a speedometer would keep pressing the pedals and wondering why nothing
 * happens; an empty dashboard says "not yours" before any label does. A glove
 * box and a grab handle keep it from reading as a drawing that failed to
 * finish - and the handle is the honest furniture of the seat: the thing a
 * passenger actually holds on a mountain track.
 */
function drawPassengerSide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const top = height * (1 - VIEW.dash);
  const middle = width / 2;

  // The glove box, low and in front of the seat.
  const boxWide = width * VIEW.boxWide;
  const boxTall = height * VIEW.boxTall;
  const boxTop = top + height * VIEW.boxAt;
  ctx.fillStyle = PAINT.gloveBox;
  ctx.beginPath();
  ctx.roundRect(
    middle - boxWide / 2,
    boxTop,
    boxWide,
    boxTall,
    boxTall * VIEW.boxRound,
  );
  ctx.fill();
  ctx.strokeStyle = PAINT.gloveEdge;
  ctx.lineWidth = VIEW.dialLine;
  ctx.stroke();

  // The grab handle on the dashboard, just under its lip - where a passenger
  // reaches for it, not floating in the windscreen.
  const handleWide = width * VIEW.handleWide;
  const handleTall = height * VIEW.handleTall;
  const handleTop = top + height * VIEW.handleAt;
  ctx.fillStyle = PAINT.grabHandle;
  ctx.beginPath();
  ctx.roundRect(
    middle - handleWide / 2,
    handleTop,
    handleWide,
    handleTall,
    height * VIEW.handleRound,
  );
  ctx.fill();
}

/**
 * The instruments between the hands: an analogue speedometer and the gear.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param height - the canvas height
 * @param state - the world as it is
 * @remarks
 * A needle rather than a number, because a needle is read without looking: how
 * far round it has swung says enough while the eyes stay on the road. The gear
 * sits beside it, because it is the one thing in this vehicle a driver has to
 * choose and can get wrong.
 *
 * The speedometer is an arch, wide and low - the half-moon instrument of a van
 * rather than the round clock of a car. It has to live inside a steering wheel
 * without either of them hiding the other, and an arch is what fits there.
 */
function drawInstruments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
): void {
  const middle = width / 2;
  const pivot = height * VIEW.dialAt;
  const across = width * VIEW.dialWide;
  const down = height * VIEW.dialTall;

  /** A point on the arch, at an angle and a share of the way out to the rim. */
  const on = (angle: number, out: number) => ({
    x: middle + Math.cos(angle) * across * out,
    y: pivot + Math.sin(angle) * down * out,
  });

  // The dome, and its face inset by the width of its own rim. It spans exactly
  // the sweep the scale is drawn along, so face and scale cannot part company:
  // a face drawn to its own angles would one day carry ticks off its edge.
  const opens = Math.PI * VIEW.dialFrom;
  const shuts = Math.PI * (VIEW.dialFrom + VIEW.dialSweep);
  /** Where a reading of `share` of the top speed sits on the scale. */
  const along = (share: number) =>
    opens +
    Math.PI * VIEW.dialInset +
    (shuts - opens - Math.PI * VIEW.dialInset * 2) * share;
  ctx.fillStyle = PAINT.dial;
  ctx.beginPath();
  ctx.ellipse(middle, pivot, across, down, 0, opens, shuts);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.dialFace;
  ctx.beginPath();
  ctx.ellipse(
    middle,
    pivot,
    across - VIEW.dialLine * 2,
    down - VIEW.dialLine * 2,
    0,
    opens,
    shuts,
  );
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let tick = 0; tick <= VIEW.dialTicks; tick++) {
    const at = along(tick / VIEW.dialTicks);
    const inner = on(at, VIEW.dialTickIn);
    const outer = on(at, 1);
    ctx.strokeStyle = PAINT.dialTick;
    ctx.lineWidth = VIEW.dialLine;
    ctx.beginPath();
    ctx.moveTo(inner.x, inner.y);
    ctx.lineTo(outer.x, outer.y);
    ctx.stroke();
    // Every second tick carries its number, so the needle says how fast and
    // not merely how far round it has swung. All of them would be a wall of
    // digits on a dial this size.
    if (tick % 2 === 0) {
      const label = on(at, VIEW.dialLabelIn);
      ctx.fillStyle = PAINT.dialTick;
      ctx.font = `${Math.round(height * VIEW.dialLabel)}px sans-serif`;
      ctx.fillText(
        String(Math.round((VIEW.dialTop * tick) / VIEW.dialTicks)),
        label.x,
        label.y,
      );
    }
  }

  // The needle reads how fast, not which way - reversing is still speed.
  const kmh = Math.abs(state.rv.v) * KMH_PER_MS;
  const share = Math.min(1, kmh / VIEW.dialTop);
  const at = along(share);
  const tail = on(at, VIEW.needleFrom);
  const tip = on(at, VIEW.needleTo);
  ctx.strokeStyle = PAINT.needle;
  ctx.lineWidth = VIEW.needleLine;
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  // The dot it turns about, on the pivot line where the arch springs from.
  ctx.fillStyle = PAINT.needle;
  ctx.beginPath();
  ctx.arc(middle, pivot, down * VIEW.needleHub, 0, Math.PI * 2);
  ctx.fill();

  // And the same number in figures, for the moments when "about two thirds
  // round" is not what you want to know. Under the apex, inside the arch: the
  // scale runs round the outside, so the middle is the one clear place left.
  ctx.fillStyle = PAINT.dialTick;
  ctx.font = `${Math.round(height * VIEW.dialRead)}px sans-serif`;
  ctx.fillText(String(Math.round(kmh)), middle, pivot - down * VIEW.dialReadUp);
  ctx.font = `${Math.round(height * VIEW.dialUnit)}px sans-serif`;
  ctx.fillText("km/h", middle, pivot - down * VIEW.dialUnitUp);

  drawShiftGate(ctx, width, height, gearAt(state.gear).label);
}

/**
 * Where each gear sits in the gate: three slots, and the bar between them.
 *
 * @remarks
 * The usual five-speed pattern - odd gears up, even gears down, reverse next to
 * fifth - so anybody who has driven one already knows where to look.
 */
const GATE: Readonly<
  Record<string, { readonly col: number; readonly row: number }>
> = {
  "1": { col: 0, row: 0 },
  "2": { col: 0, row: 2 },
  "3": { col: 1, row: 0 },
  "4": { col: 1, row: 2 },
  "5": { col: 2, row: 0 },
  R: { col: 2, row: 2 },
  N: { col: 1, row: 1 },
};

/** How many columns and rows the gate has, counted from zero. */
const GATE_SPAN = 2;

/**
 * The shift gate beside the speedometer, with the lever in the engaged slot.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param height - the canvas height
 * @param label - the engaged gear, as it is written on the gate
 */
function drawShiftGate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  label: string,
): void {
  const across = width * VIEW.gateWide;
  const down = height * VIEW.gateTall;
  const left = width / 2 + width * VIEW.gateAt - across / 2;
  const top = height * VIEW.gateY - down / 2;
  const at = (col: number) => left + (across * col) / GATE_SPAN;
  const rowY = (row: number) => top + (down * row) / GATE_SPAN;

  // The plate reaches past the slots far enough for the numbers to sit on it -
  // labels floating on the road ahead would read as part of the scenery.
  const padX = VIEW.gateLine * VIEW.gateEdge;
  const padY = height * VIEW.gatePadY;
  ctx.fillStyle = PAINT.gatePlate;
  ctx.beginPath();
  ctx.roundRect(
    left - padX,
    top - padY,
    across + padX * 2,
    down + padY * 2,
    VIEW.gateRound,
  );
  ctx.fill();

  // The H itself: a slot per column, and the bar that joins them.
  ctx.strokeStyle = PAINT.gateSlot;
  ctx.lineWidth = VIEW.gateLine;
  ctx.lineCap = "round";
  for (let col = 0; col <= GATE_SPAN; col++) {
    ctx.beginPath();
    ctx.moveTo(at(col), rowY(0));
    ctx.lineTo(at(col), rowY(GATE_SPAN));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(at(0), rowY(1));
  ctx.lineTo(at(GATE_SPAN), rowY(1));
  ctx.stroke();

  ctx.fillStyle = PAINT.gateLabel;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(height * VIEW.gateLabel)}px sans-serif`;
  for (const [name, slot] of Object.entries(GATE)) {
    if (name !== "N") {
      const away = slot.row === 0 ? -1 : 1;
      ctx.fillText(name, at(slot.col), rowY(slot.row) + (away * padY) / 2);
    }
  }

  const slot = GATE[label] ?? GATE.N;
  ctx.fillStyle = PAINT.knob;
  ctx.strokeStyle = PAINT.knobEdge;
  ctx.lineWidth = VIEW.knobLine;
  ctx.beginPath();
  ctx.arc(at(slot.col), rowY(slot.row), width * VIEW.knobR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
