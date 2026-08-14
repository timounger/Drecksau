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
import { drawTree } from "@/games/rv-there-yet/components/tree";
import {
  drawNotice,
  NOTICE_AFTER,
  NOTICE_SIDE,
} from "@/games/rv-there-yet/components/notice";
import {
  conifersBetween,
  drawConifer,
} from "@/games/rv-there-yet/components/wood";
import {
  GOAT_TALL,
  drawGoat,
  goatsBetween,
} from "@/games/rv-there-yet/components/goat";
import {
  HEIDI_REACH,
  drawHeidi,
  heidiPlaces,
} from "@/games/rv-there-yet/components/heidi";
import {
  PETER_LONG,
  PETER_OUT,
  drawPeter,
  hoverOver,
  peterPlaces,
} from "@/games/rv-there-yet/components/peter";
import {
  RED_TALL,
  WOLF_TALL,
  drawRed,
  drawWolf,
  redPlaces,
} from "@/games/rv-there-yet/components/red";
import {
  DWARF_TALL,
  SNOW_TALL,
  drawDwarf,
  drawSnow,
  dwarfPlaces,
  snowPlaces,
} from "@/games/rv-there-yet/components/dwarfs";
import {
  BAND_REACH,
  bandPlaces,
  drawBand,
} from "@/games/rv-there-yet/components/band";
import {
  SPIDER_TALL,
  WIZARD_TALL,
  drawSpider,
  drawWizard,
  duelPlaces,
  fogLeft,
} from "@/games/rv-there-yet/components/duel";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";
import {
  CANVAS_H,
  CANVAS_W,
  SLENDER,
  SLENDER_INK,
  slenderShowing,
  summitShare,
} from "@/games/rv-there-yet/components/render";
import { woodShare } from "@/games/rv-there-yet/engine/map";
import { within } from "@/games/rv-there-yet/engine/engine";
import {
  gearAt,
  KMH_PER_MS,
  GOAL_MARGIN,
  type GameState,
  type Person,
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
  /**
   * How far ahead a thing standing beside the road is still drawn, in metres.
   *
   * @remarks
   * Much less far than the road itself. The road has to run to the horizon or
   * there is no distance to judge; the trees, markers and items along it do
   * not - out at two hundred metres they are three pixels each, and all they
   * do is show what the whole rest of the section holds before it is driven.
   * Half the point of a bend or a rise is not knowing yet.
   */
  thingSight: 160,
  /** Over how many of the last of those metres it fades out, in metres. */
  thingFade: 25,
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
  /**
   * The hillside beyond the verge: how far it reaches and what shape it has.
   *
   * @remarks
   * Built as a **curve** rather than a handful of steps. The cross-section is
   * a parabola - level at the shoulder of the road and steepening with every
   * metre away from it, which is the shape water cuts and therefore the shape
   * a hillside has. Enough steps that the silhouette reads as round instead of
   * as three folds of cardboard, few enough that each one is still one fill.
   *
   * `flankOut` is how far out it goes, `flankCurve` how much of the local
   * relief the outermost edge has fallen away by, and `flankSpread` bunches
   * the steps up near the road, where they are seen widest and need the most
   * detail.
   */
  flankSteps: 7,
  flankOut: 110,
  flankCurve: 3.4,
  flankSpread: 1.7,
  /** How hard the light from the left tells the two sides of the road apart. */
  flankLight: 0.45,
  /** How much relief counts as a hillside in full, in metres. */
  flankFull: 7,
  /**
   * How much a snowy flank is shaded before any relief is counted at all.
   *
   * @remarks
   * Snow has no grain, no verge and no colour of its own: the light is the
   * only thing that gives it shape. Half the shading is therefore there on
   * the flattest of snowfields, and the relief adds the rest.
   */
  snowShade: 0.5,
  /**
   * How far to either side the ground is measured to decide ridge or valley.
   *
   * @remarks
   * Several distances rather than one, and each one further out than the last,
   * so that neither a single pothole nor a single hummock decides the shape of
   * a whole hillside.
   */
  reliefFrom: 24,
  reliefSteps: 4,
  reliefSpread: 1.7,
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
   * The other player, walking the road ahead, in metres.
   *
   * @remarks
   * Head-on rather than in profile: from the seat you see their back going
   * away from you or their face coming towards you, never their side. The
   * height is the same 1.78 m the figure beside the motorhome is drawn to, so
   * somebody who walks out of the door does not change size on the way.
   */
  mateTall: 1.78,
  mateWide: 0.5,
  mateHip: 0.78,
  mateLegWide: 0.17,
  mateLegAt: 0.12,
  mateHeadR: 0.16,
  mateCapHigh: 0.11,
  /** How far the shoulders swing up and down over one stride, in metres. */
  mateBob: 0.045,
  /** How far one stride carries them, in metres - the legs swing with it. */
  mateStride: 1.5,
  /** How far each leg swings out to the side while walking, in metres. */
  mateSwing: 0.09,
  /** How round the shoulders of the jacket are, as a share of its width. */
  mateRound: 0.28,
  /** The eyes, when they are walking towards you. */
  mateEyeR: 0.035,
  mateEyeAt: 0.1,
  /** How far below the middle of the head the eyes sit, in metres. */
  mateEyeDrop: 0.03,
  /**
   * The one in the other seat, as shares of the canvas.
   *
   * @remarks
   * Head and shoulders only, and well out towards the edge: from your own seat
   * the person beside you is at the corner of your eye, not in the middle of
   * the windscreen. Anything more would be a passenger sitting on the bonnet.
   */
  seatMateOut: 0.3,
  seatMateHeadAt: 0.575,
  seatMateHeadR: 0.031,
  seatMateShoulderWide: 0.135,
  seatMateShoulderAt: 0.655,
  seatMateShoulderRound: 0.3,
  /** The band of the cap, and the ear on the side turned towards you. */
  seatMateCapHigh: 0.014,
  seatMateEarAt: 0.45,
  seatMateEarR: 0.005,
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
  /**
   * The gap the bridge stands over: how far out it reaches and how deep it is.
   *
   * @remarks
   * Deeper than it is wide, so that looking along the deck the two walls of it
   * run away and meet the water rather than the horizon. Anything shallower
   * reads as a ditch beside the road.
   */
  gapOut: 26,
  gapDeep: 13,
  /** Where in that gap the rock stops and the water starts. */
  gapWet: 10,
  gapWetAt: 0.78,
  railThick: 0.14,
  postEvery: 4,
  signBefore: 9,
  signHigh: 2.4,
  signWide: 1.7,
  signPost: 0.16,
  /** How high the notice board at the start of a section reaches, in metres. */
  noticeTop: 4.1,
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
  flankLit: "#86ad63",
  flankDeep: "#3d5a33",
  ridgeSnow: "#eef4fa",
  fog: "#d8dee3",
  snow: "#eef4fa",
  snowDark: "#cddbe8",
  /** The shadow side of snow: blue, and a good deal deeper than snowDark. */
  snowDeep: "#a4bcd6",
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
  /** The water at the bottom of the gap the bridge stands over. */
  river: "#3d6d8c",
  chasm: "#20262d",
  mud: "#5a4630",
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
  /** The other player, head-on - the same colours the side view dresses them in. */
  mateSkin: "#f0c9a4",
  mateVest: "#a8552c",
  mateCap: "#8a4a2b",
  mateTrousers: "#6d4326",
  mateEyes: "#22252a",
  /** The bear head-on: the coat, its shaded side, the muzzle and the nose. */
  bear: "#4a3527",
  bearDark: "#33241a",
  bearMuzzle: "#8a6a4e",
  bearNose: "#1d1512",
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
  me: number,
): void {
  // The logical grid, not what the canvas happens to have: on a large screen
  // it is drawn on rather more pixels than that (see fit-canvas.ts), and a
  // view laid out in those would put the horizon somewhere else entirely.
  const width = CANVAS_W;
  const height = CANVAS_H;
  const eye = heightAt(route, state.rv.x) + VIEW.eye;
  const horizon = height * VIEW.horizon;

  drawSky(ctx, width, height, horizon);
  drawUnderfoot(ctx, state, route, { width, height, horizon, eye });
  drawRidge(ctx, width, horizon, state.rv.x);
  drawRoad(ctx, state, route, { width, height, horizon, eye });
  drawTrees(ctx, state, route, candidate, { width, height, horizon, eye });
  drawWoodside(ctx, state, route, { width, height, horizon, eye });
  drawHerd(ctx, state, route, { width, height, horizon, eye });
  drawHeidiAhead(ctx, state, route, { width, height, horizon, eye });
  drawPeterAhead(ctx, state, route, { width, height, horizon, eye });
  drawRedAhead(ctx, state, route, { width, height, horizon, eye });
  drawDwarfsAhead(ctx, state, route, { width, height, horizon, eye });
  drawBandAhead(ctx, state, route, { width, height, horizon, eye });
  drawDuelAhead(ctx, state, route, { width, height, horizon, eye });
  drawSectionFlags(ctx, state, route, { width, height, horizon, eye });
  drawBridges(ctx, state, route, { width, height, horizon, eye });
  drawMud(ctx, state, route, { width, height, horizon, eye });
  drawChasm(ctx, state, route, { width, height, horizon, eye });
  drawThings(ctx, state, route, { width, height, horizon, eye });
  // After the things lying on the road, so somebody standing over a can is in
  // front of it rather than inside it.
  drawMatesAhead(ctx, state, route, { width, height, horizon, eye }, me);
  drawFlag(ctx, state, route, { width, height, horizon, eye });
  drawFog(ctx, state, route, { width, height, horizon, eye });
  // After the fog, not before it: the one section that begins **inside** the
  // fog is the one whose board says "do not stop", and a board nobody can read
  // is worse than no fog at all. Everywhere else there is no fog to be over.
  drawNotices(ctx, state, route, { width, height, horizon, eye });
  drawSlender(ctx, state, route, { width, height, horizon, eye });
  // Before the dashboard, so it cuts them off at the chest the way a
  // dashboard does. Drawn over it they would be sitting on the bonnet.
  if (state.people.some((person, seat) => seat !== me && person.inside)) {
    drawMateAboard(ctx, width, height, driving);
  }
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
  const wood = woodShare(travelled);
  if (wood >= 1) {
    return;
  }
  ctx.globalAlpha = 1 - wood;
  drawRange(ctx, width, horizon, travelled);
  ctx.globalAlpha = 1;
}

/**
 * The range of summits that fills the far view in the first half.
 *
 * @remarks
 * In the second half nothing takes its place: a row of trees out there stood
 * behind the wood along the road, barely moved with it and said nothing the
 * trees going past the window had not already said.
 *
 * @param ctx - the canvas to paint on
 * @param width - how wide the canvas is
 * @param horizon - where the range stands
 * @param travelled - how far along the route the motorhome is, in metres
 */
function drawRange(
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
  // The hillside first: the road and its verge are painted on top of it.
  drawFlanks(ctx, state, route, screen);
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

/**
 * The hillside to the left and right of the road, all the way ahead.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * The map is a **line** of heights and says nothing about what lies beside the
 * road, so the flanks are worked out from the road itself: how high each spot
 * stands compared with the ground around it. On a ridge the land falls away to
 * both sides, in a valley it climbs - which is what a driver sees out of the
 * side windows, and what was missing while everything either side of the road
 * was one flat colour.
 *
 * Each step outwards is **one** long strip rather than a quad per band. Made
 * of separate quads the seams between them showed as a lattice of hairlines
 * all down the hillside; as one path there are no seams to show.
 *
 * Drawn outermost first, so each step lies over the one beyond it.
 */
function drawFlanks(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const bands = sampleAhead();
  const white = snowShare(heightAt(route, state.rv.x));
  const lift = reliefAt(route, state.rv.x);

  for (let step = VIEW.flankSteps; step >= 1; step--) {
    const out = flankStep(step);
    const inner = flankStep(step - 1);
    for (const side of [-1, 1]) {
      ctx.fillStyle = shadeOf(out, lift, side, white);
      ctx.beginPath();
      // Out along the far edge of the hillside, back along the near one.
      bands.forEach((gap, index) => {
        const point = flankPoint(state, route, screen, gap, side, out);
        if (index === 0) {
          ctx.moveTo(point.px, point.py);
        } else {
          ctx.lineTo(point.px, point.py);
        }
      });
      for (let index = bands.length - 1; index >= 0; index--) {
        const point = flankPoint(
          state,
          route,
          screen,
          bands[index],
          side,
          inner,
        );
        ctx.lineTo(point.px, point.py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

/**
 * One step of the hillside: how far out it lies and how far it has fallen.
 *
 * @param step - which step, from 0 at the verge to `flankSteps` at the edge
 * @returns where the edge of that step lies and how steeply it lies there
 * @remarks
 * The two curves that make the shape. Sideways the steps bunch up near the
 * road, where the hillside is seen widest and the faces of it want to be
 * smallest. Downwards each step falls further than the one before it, so the
 * ground eases away at the shoulder and drops harder the further out it goes -
 * a hillside rather than the straight wedge a single drop per step would
 * make.
 */
function flankStep(step: number): Face {
  const share = step / VIEW.flankSteps;
  return {
    out:
      VIEW.vergeHalf +
      (VIEW.flankOut - VIEW.vergeHalf) * share ** VIEW.flankSpread,
    fall: VIEW.flankCurve * share ** 2,
    tilt: share ** 2,
  };
}

/**
 * What colour a face of the hillside is, given how steeply it lies.
 *
 * @param out - the outer edge of the face
 * @param lift - the relief here: positive on a ridge, negative in a valley
 * @param side - -1 for the left of the road, 1 for the right
 * @param snow - how much of the ground here is under snow, 0 to 1
 * @returns the colour to fill it with
 * @remarks
 * This is what turns a fan of green wedges into ground you can read. The
 * further down the hillside a face lies the darker it is, and how much darker
 * depends on how much hillside there is: flat country stays one colour,
 * because there is nothing there to catch the light at an angle, and the
 * deeper the valley the harder the contrast between the top of its walls and
 * the bottom of them.
 *
 * The light comes from up and to the **left**, so the two sides of the road
 * are never the same shade. Lighting both alike is what makes a hillside look
 * like a paper cut-out: it is the difference between the two that says the
 * ground has a shape at all.
 *
 * @param side - -1 for the left of the road, 1 for the right
 */
function shadeOf(out: Face, lift: number, side: number, snow: number): string {
  // How far down the hillside this face lies, and how much hillside there is
  // for it to be down: on level ground nothing is shaded at all, because there
  // is nothing there to catch the light at an angle.
  const depth = out.tilt;
  const strength = Math.min(1, Math.abs(lift) / VIEW.flankFull);
  // The light comes from one side, so a ridge is bright on its left flank and
  // dark on its right - and a valley, whose walls face the other way, the
  // other way about.
  const across = side * Math.sign(lift) * VIEW.flankLight;
  const lit = Math.max(0, Math.min(1, 1 - depth * strength * (1 - across)));
  // Snow is shaded harder, and shaded **even where the ground is flat**. On
  // grass the road, the verge and the grain of the bands give a level field
  // its shape; snow has none of that. Everything is one white, and without a
  // little modelling of its own the whole picture is a blank sheet with a
  // road drawn on it - which is exactly what it looked like.
  const always = VIEW.snowShade + strength * (1 - VIEW.snowShade);
  const cold = Math.max(0, Math.min(1, 1 - depth * always * (1 - across)));
  const green = blend(PAINT.flankDeep, PAINT.flankLit, lit);
  const white = blend(PAINT.snowDeep, PAINT.snow, cold);
  return blend(green, white, snow);
}

/**
 * One edge of the hillside, at one step out from the road.
 *
 * @remarks
 * `out` is in metres beside the road and `fall` is the share of the relief it
 * has fallen by there, so the same face serves for a ridge and for a valley -
 * the relief carries the sign. `tilt` is how far down the hillside it lies,
 * nought at the shoulder and one at the outer edge, and it is what the shading
 * is made of.
 */
type Face = {
  readonly out: number;
  readonly fall: number;
  readonly tilt: number;
};

/** Where one point of a hillside step lands on the canvas. */
function flankPoint(
  state: GameState,
  route: Route,
  screen: Screen,
  gap: number,
  side: number,
  step: Face,
): { readonly px: number; readonly py: number } {
  const at = state.rv.x + gap;
  const ground = heightAt(route, at) - reliefAt(route, at) * step.fall;
  return {
    px: screen.width / 2 + (side * step.out * VIEW.focal) / gap,
    py: project(screen, ground, gap).y,
  };
}

/**
 * How much higher a place stands than the ground around it, in metres.
 *
 * @param route - the route being driven
 * @param x - the place, in metres
 * @returns positive on a ridge, negative in a valley, zero on the flat
 * @remarks
 * The only thing the map can say about the shape of the land to the side: a
 * spot that stands above its surroundings is a ridge, and a ridge falls away
 * on both sides. One that lies below them is a valley, and a valley climbs.
 */
function reliefAt(route: Route, x: number): number {
  let around = 0;
  let away = VIEW.reliefFrom;
  for (let step = 0; step < VIEW.reliefSteps; step++) {
    around += heightAt(route, x - away) + heightAt(route, x + away);
    away *= VIEW.reliefSpread;
  }
  return heightAt(route, x) - around / (VIEW.reliefSteps * 2);
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

/**
 * Something standing on the road ahead.
 *
 * @remarks
 * Everything the land can hide is one of these: how far off it is, how high
 * the ground is where it stands, and how far above that it reaches.
 */
type Standing = {
  readonly gap: number;
  readonly foot: number;
  readonly tall: number;
  /** How much of it to show at all, for things that fade in with the country. */
  readonly fade?: number;
};

/**
 * The lowest a thing `gap` metres ahead can be and still be seen over the land.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @param gap - how far ahead the thing stands, in metres
 * @returns that height in metres
 * @remarks
 * A line of sight, worked out in metres rather than in pixels. Every rise
 * between here and there hides everything below the line from the eye over
 * that rise and on to the thing; the highest of those lines is the one that
 * counts. On the level it comes out at the ground itself, so nothing is hidden
 * that should not be.
 *
 * Sampled at the same distances the ground is drawn at, on purpose: what is
 * hidden is then exactly what the painted land covers, and a tree cannot come
 * out from behind a hill that is still on the screen.
 */
function seenOver(state: GameState, route: Route, gap: number): number {
  const eye = heightAt(route, state.rv.x) + VIEW.eye;
  let over = Number.NEGATIVE_INFINITY;
  for (const ahead of sampleAhead()) {
    if (ahead >= gap) {
      break;
    }
    const rise = heightAt(route, state.rv.x + ahead) - eye;
    over = Math.max(over, eye + (rise * gap) / ahead);
  }
  return over;
}

/**
 * How much of a thing that far off is still shown, from one to nothing.
 *
 * @param gap - how far ahead it stands, in metres
 * @returns its share, one near to and nothing beyond {@link VIEW.thingSight}
 * @remarks
 * Faded rather than cut off, so that nothing pops into being out of clear air
 * - by the time it starts to fade it is a few pixels across anyway.
 */
function showingAt(gap: number): number {
  const past = gap - (VIEW.thingSight - VIEW.thingFade);
  return past <= 0 ? 1 : Math.max(0, 1 - past / VIEW.thingFade);
}

/**
 * Draws something standing ahead, as far as the land and the distance allow.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @param thing - where it stands and how tall it is
 * @param paint - what to draw, if any of it can be seen
 * @remarks
 * Behind a rise it is left out; standing in one it is cut off at the crest,
 * which is what a hill does to a tree. Without this everything the section
 * still holds is on the screen from the start, hills or no hills.
 */
function drawStanding(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
  thing: Standing,
  paint: () => void,
): void {
  const showing = showingAt(thing.gap) * (thing.fade ?? 1);
  if (showing <= 0) {
    return;
  }
  const over = seenOver(state, route, thing.gap);
  if (thing.foot + thing.tall <= over) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = showing;
  if (over > thing.foot) {
    ctx.beginPath();
    ctx.rect(0, 0, screen.width, project(screen, over, thing.gap).y);
    ctx.clip();
  }
  paint();
  ctx.restore();
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
    const stands = {
      gap,
      foot: anchor.y,
      tall: VIEW.treeTrunk + VIEW.treeCrown,
    };
    drawStanding(ctx, state, route, screen, stands, () => {
      drawTree(ctx, {
        x: middle + VIEW.treeSide * scale,
        y: foot.y,
        scale,
        trunk: VIEW.treeTrunk,
        crown: VIEW.treeCrown,
        tone: index === candidate ? PAINT.crownNear : PAINT.crown,
        bark: PAINT.trunk,
        seed: index,
      });
    });
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
    const ground = heightAt(route, at);
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const post = middle + VIEW.markSide * scale;
    const top = foot.y - VIEW.markPole * scale;
    const stands = { gap, foot: ground, tall: VIEW.markPole };
    drawStanding(ctx, state, route, screen, stands, () => {
      ctx.strokeStyle = PAINT.markPole;
      ctx.lineWidth = Math.max(1, scale / VIEW.wheelLine);
      ctx.beginPath();
      ctx.moveTo(post, foot.y);
      ctx.lineTo(post, top);
      ctx.stroke();
      ctx.fillStyle = PAINT.markFlag;
      ctx.fillRect(post, top, VIEW.markWide * scale, VIEW.markTall * scale);
    });
  }
}

/**
 * The wood along both verges, in the second half of the drive.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * A treeline on the horizon says there is a forest somewhere; trees going past
 * the window say you are in one. Drawn furthest first, so the near ones stand
 * in front, and each of them through the same rules as everything else that
 * stands beside the road: gone behind a rise, gone past the far limit.
 *
 * Faded in with the country itself, so the wood arrives with the treeline
 * rather than springing up at one line across the road.
 */
function drawWoodside(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const from = state.rv.x + VIEW.bonnet;
  const trees = conifersBetween(from, state.rv.x + VIEW.thingSight, [
    ...route.bridges,
    ...route.chasms,
  ]);
  for (const tree of trees.reverse()) {
    const share = woodShare(tree.at);
    if (share <= 0) {
      continue;
    }
    const gap = tree.at - state.rv.x;
    const ground = heightAt(route, tree.at);
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const stands = { gap, foot: ground, tall: tree.tall, fade: share };
    drawStanding(ctx, state, route, screen, stands, () => {
      drawConifer(ctx, {
        x: middle + tree.side * tree.out * scale,
        y: foot.y,
        scale,
        tall: tree.tall,
      });
    });
  }
}

/**
 * The goats grazing along the first section, seen from the seat.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * Through the same rules as everything else standing beside the road: behind a
 * rise they are gone, past the far limit they are gone, and the furthest is
 * drawn first so the nearest stands in front.
 */
function drawHerd(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const herd = goatsBetween(
    state.rv.x + VIEW.bonnet,
    state.rv.x + VIEW.thingSight,
    route.sections,
  );
  for (const goat of herd.reverse()) {
    const gap = goat.at - state.rv.x;
    const ground = heightAt(route, goat.at);
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const stands = { gap, foot: ground, tall: GOAT_TALL * goat.size };
    drawStanding(ctx, state, route, screen, stands, () => {
      drawGoat(ctx, {
        x: middle + goat.side * goat.out * scale,
        y: foot.y,
        scale,
        goat,
      });
    });
  }
}

/**
 * The girl with the kid, standing where the climb begins.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 */
function drawHeidiAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  for (const heidi of heidiPlaces(route.mud)) {
    for (const stands of [
      { at: heidi.at, out: heidi.out, tall: HEIDI_REACH, kid: null },
      {
        at: heidi.kid.at,
        out: heidi.kid.out,
        tall: GOAT_TALL * heidi.kid.size,
        kid: heidi.kid,
      },
    ]) {
      const gap = stands.at - state.rv.x;
      if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
        continue;
      }
      const ground = heightAt(route, stands.at);
      const foot = project(screen, ground, gap);
      const scale = VIEW.focal / gap;
      const there = { gap, foot: ground, tall: stands.tall };
      drawStanding(ctx, state, route, screen, there, () => {
        const x = middle + stands.out * scale;
        if (stands.kid === null) {
          drawHeidi(ctx, { x, y: foot.y, scale });
        } else {
          drawGoat(ctx, { x, y: foot.y, scale, goat: stands.kid });
        }
      });
    }
  }
}

/**
 * The boy with the wand and the spider, halfway through the sixth section.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * The spider first, so the boy stands in front of it rather than inside it.
 */
function drawDuelAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  for (const duel of duelPlaces(route.sections)) {
    for (const one of [
      { spot: duel.spider, tall: SPIDER_TALL, boy: false },
      { spot: duel.boy, tall: WIZARD_TALL, boy: true },
    ]) {
      const gap = one.spot.at - state.rv.x;
      if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
        continue;
      }
      const ground = heightAt(route, one.spot.at);
      const foot = project(screen, ground, gap);
      const scale = VIEW.focal / gap;
      const there = { gap, foot: ground, tall: one.tall };
      drawStanding(ctx, state, route, screen, there, () => {
        const at = { x: middle + one.spot.out * scale, y: foot.y, scale };
        if (one.boy) {
          drawWizard(ctx, at, 1);
        } else {
          drawSpider(ctx, at, -1);
        }
      });
    }
  }
}

/**
 * The four town musicians, at the start of the fifth section.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 */
function drawBandAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  for (const band of bandPlaces(route.sections)) {
    const gap = band.at - state.rv.x;
    if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
      continue;
    }
    const ground = heightAt(route, band.at);
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const there = { gap, foot: ground, tall: BAND_REACH };
    drawStanding(ctx, state, route, screen, there, () => {
      drawBand(
        ctx,
        { x: screen.width / 2 + band.out * scale, y: foot.y, scale },
        -1,
      );
    });
  }
}

/**
 * The seven dwarfs, walking up the climb of the fourth section.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * Far ones first, so that the column overlaps the way a column does: each of
 * them stands a little in front of the one behind him. At the top of the same
 * rise waits the one they are walking home to, waving back down at them.
 */
function drawDwarfsAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  const walking = dwarfPlaces(route.sections, route.heights);
  for (const dwarf of [...walking].reverse()) {
    const gap = dwarf.at - state.rv.x;
    if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
      continue;
    }
    const ground = heightAt(route, dwarf.at);
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const there = { gap, foot: ground, tall: DWARF_TALL };
    drawStanding(ctx, state, route, screen, there, () => {
      drawDwarf(
        ctx,
        { x: middle + dwarf.out * scale, y: foot.y, scale },
        dwarf,
      );
    });
  }
  for (const waiting of snowPlaces(route.sections, route.heights)) {
    const gap = waiting.at - state.rv.x;
    if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
      continue;
    }
    const ground = heightAt(route, waiting.at);
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const there = { gap, foot: ground, tall: SNOW_TALL };
    drawStanding(ctx, state, route, screen, there, () => {
      drawSnow(ctx, { x: middle + waiting.out * scale, y: foot.y, scale }, -1);
    });
  }
}

/**
 * The girl in the red hood and the wolf, on the last stretch before the chasm.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 */
function drawRedAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  for (const meeting of redPlaces(route.sections, route.chasms)) {
    for (const stands of [
      { spot: meeting.girl, tall: RED_TALL, wolf: false },
      { spot: meeting.wolf, tall: WOLF_TALL, wolf: true },
    ]) {
      const gap = stands.spot.at - state.rv.x;
      if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
        continue;
      }
      const ground = heightAt(route, stands.spot.at);
      const foot = project(screen, ground, gap);
      const scale = VIEW.focal / gap;
      const there = { gap, foot: ground, tall: stands.tall };
      drawStanding(ctx, state, route, screen, there, () => {
        const at = { x: middle + stands.spot.out * scale, y: foot.y, scale };
        if (stands.wolf) {
          drawWolf(ctx, at, -1);
        } else {
          drawRed(ctx, at);
        }
      });
    }
  }
}

/**
 * The flying boy and his fairy, hanging over the ditch.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * Through the same sight lines as everything else, only reckoned from where he
 * **hangs** rather than from the ground: a boy in the air over a hole is still
 * hidden by a rise between here and there, but he clears one that would hide
 * anything standing on the road.
 */
function drawPeterAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  for (const flying of peterPlaces(route.pits)) {
    const gap = flying.at - state.rv.x;
    if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
      continue;
    }
    const up = hoverOver(flying, [
      heightAt(route, flying.rim[0]),
      heightAt(route, flying.rim[1]),
    ]);
    const scale = VIEW.focal / gap;
    const stands = { gap, foot: up, tall: PETER_LONG };
    drawStanding(ctx, state, route, screen, stands, () => {
      drawPeter(ctx, {
        x: screen.width / 2 + PETER_OUT * scale,
        y: project(screen, up, gap).y,
        scale,
      });
    });
  }
}

/**
 * The notice board at the start of each section, on the left verge.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * On the **left**, where a driver looking over the wheel has it square in
 * front of them for the length of the run-up to it, and far enough out that it
 * does not sit on top of the section marker.
 */
function drawNotices(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const boards = route.sections
    .map((section, index) => ({
      at: section + NOTICE_AFTER,
      words: RV_TEXTS.sectionHints[index] ?? "",
    }))
    .map((board) => ({ ...board, gap: board.at - state.rv.x }))
    .filter(
      (board) =>
        board.words !== "" &&
        board.gap > VIEW.bonnet &&
        board.gap < VIEW.thingSight,
    )
    .sort((a, b) => b.gap - a.gap);

  for (const board of boards) {
    const ground = heightAt(route, board.at);
    const foot = project(screen, ground, board.gap);
    const scale = VIEW.focal / board.gap;
    const stands = { gap: board.gap, foot: ground, tall: VIEW.noticeTop };
    drawStanding(ctx, state, route, screen, stands, () => {
      drawNotice(ctx, {
        x: screen.width / 2 + NOTICE_SIDE * scale,
        y: foot.y,
        scale,
        words: board.words,
      });
    });
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
    drawUnderTheBridge(ctx, state, route, screen, bridge);
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
 * The mud ahead, seen from the seat: a dark wet band across the road.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @remarks
 * On the road rather than instead of it - the motorhome goes through, it just
 * arrives at the far side with no speed left. Seeing it coming is the point:
 * a driver who knows it is there stops arguing with the throttle and reaches
 * for the rope instead.
 */
function drawMud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
): void {
  const middle = screen.width / 2;
  for (const patch of route.mud) {
    const near = patch.from - state.rv.x;
    const far = patch.to - state.rv.x;
    if (far <= VIEW.bonnet || near >= VIEW.sight) {
      continue;
    }
    const lip = project(
      screen,
      heightAt(route, patch.from),
      Math.max(near, VIEW.bonnet),
    );
    const back = project(
      screen,
      heightAt(route, patch.to),
      Math.max(far, VIEW.bonnet),
    );
    ctx.fillStyle = PAINT.mud;
    ctx.beginPath();
    ctx.moveTo(middle - lip.road, lip.y);
    ctx.lineTo(middle + lip.road, lip.y);
    ctx.lineTo(middle + back.road, back.y);
    ctx.lineTo(middle - back.road, back.y);
    ctx.closePath();
    ctx.fill();
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
 * What is beside and under a bridge: the drop, and the water at the bottom.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @param bridge - the bridge being driven towards
 * @remarks
 * From the seat, rails alone made a bridge look like a fenced-off stretch of
 * road. What says bridge is that the **ground beside it is gone**: past the
 * edge of the deck the hillside stops, there is a drop, and a long way down
 * there is a river running under you.
 *
 * Painted per side over the hillside, from the near end of the bridge to the
 * far one: first the rock wall falling away from the edge of the deck, then
 * the water beyond and below it. Per side and not as one band across, or the
 * water would be painted over the road you are driving on.
 */
function drawUnderTheBridge(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
  bridge: { readonly from: number; readonly to: number },
): void {
  const middle = screen.width / 2;
  const near = Math.max(bridge.from - state.rv.x, VIEW.bonnet);
  const far = Math.max(bridge.to - state.rv.x, VIEW.bonnet);
  if (bridge.to - state.rv.x <= VIEW.bonnet || near >= VIEW.sight) {
    return;
  }
  const lip = (at: number, gap: number) => {
    const scale = VIEW.focal / gap;
    return {
      y: project(screen, heightAt(route, at), gap).y,
      deck: VIEW.railSide * scale,
      // Where the water is: further out and further down than the deck edge.
      wet: VIEW.gapWet * scale,
      wetY: VIEW.gapDeep * VIEW.gapWetAt * scale,
      out: VIEW.gapOut * scale,
      down: VIEW.gapDeep * scale,
    };
  };
  const one = lip(bridge.from, near);
  const two = lip(bridge.to, far);
  // Nothing of the gorge is seen nearer than the edge one is standing on: the
  // ground in front of the near lip is in the way, and without this the wall
  // and the water sweep up towards the bonnet and it looks as though one were
  // seeing **through** the bridge. Once out on the deck the near end is the
  // bonnet itself, and the line drops off the bottom of the picture.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, screen.width, one.y);
  ctx.clip();
  for (const side of [-1, 1]) {
    // The wall of the gorge on this side: from the edge of the deck down and
    // out to where the water begins.
    ctx.fillStyle = PAINT.chasm;
    ctx.beginPath();
    ctx.moveTo(middle + side * one.deck, one.y);
    ctx.lineTo(middle + side * two.deck, two.y);
    ctx.lineTo(middle + side * two.wet, two.y + two.wetY);
    ctx.lineTo(middle + side * one.wet, one.y + one.wetY);
    ctx.closePath();
    ctx.fill();
    // And the water beyond it, which is the whole reason for the bridge.
    ctx.fillStyle = PAINT.river;
    ctx.beginPath();
    ctx.moveTo(middle + side * one.wet, one.y + one.wetY);
    ctx.lineTo(middle + side * two.wet, two.y + two.wetY);
    ctx.lineTo(middle + side * two.out, two.y + two.down);
    ctx.lineTo(middle + side * one.out, one.y + one.down);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
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
  const ground = heightAt(route, at);
  const foot = project(screen, ground, gap);
  const scale = VIEW.focal / gap;
  const post = screen.width / 2 + VIEW.markSide * scale;
  const stands = { gap, foot: ground, tall: VIEW.signHigh };
  drawStanding(ctx, state, route, screen, stands, () => {
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
  });
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
    const bear = thing.kind === "bear";
    const ground = heightAt(route, thing.at);
    const foot = project(screen, ground, thing.gap);
    const scale = VIEW.focal / thing.gap;
    const stands = {
      gap: thing.gap,
      foot: ground,
      tall: bear ? VIEW.bearSize : VIEW.itemSize,
    };
    drawStanding(ctx, state, route, screen, stands, () => {
      if (bear) {
        drawBearAhead(ctx, middle, foot.y, scale);
      } else {
        ctx.save();
        ctx.translate(middle, foot.y);
        thingShape(ctx, thing.kind, scale);
        ctx.restore();
      }
    });
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
  drawBearForelegs(ctx, middle, ground, size);
  drawBearChest(ctx, middle, ground, size);
  drawBearFace(ctx, middle, ground - size * BEAR.headAt, size);
}

/**
 * The other player, out of the cab and somewhere up the road.
 *
 * @param ctx - the canvas to paint on
 * @param state - the world as it is
 * @param route - the route being driven
 * @param screen - canvas size, horizon and eye height
 * @param me - the seat this windscreen belongs to
 * @remarks
 * The side view has drawn everybody who is out of the cab since co-op existed;
 * from the seat they were simply missing, so the one player who had got out to
 * run ahead was invisible to the one who had to avoid running them over.
 *
 * Only those **ahead**: the windscreen shows the road in front of it, and
 * somebody who walked round the back is behind you whether you would like to
 * see them or not. Whoever is riding on the roof is not drawn either - they
 * stand at the same metre as the motorhome, which is nearer than the bonnet.
 */
function drawMatesAhead(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  route: Route,
  screen: Screen,
  me: number,
): void {
  const middle = screen.width / 2;
  state.people.forEach((person, seat) => {
    const gap = person.at - state.rv.x;
    if (seat === me || person.inside) {
      return;
    }
    if (gap <= VIEW.bonnet || gap >= VIEW.thingSight) {
      return;
    }
    const ground = heightAt(route, person.at) + person.lift;
    const foot = project(screen, ground, gap);
    const scale = VIEW.focal / gap;
    const there = { gap, foot: ground, tall: VIEW.mateTall };
    drawStanding(ctx, state, route, screen, there, () => {
      drawMate(ctx, person, middle, foot.y, scale);
    });
  });
}

/**
 * One person on the road, seen from the seat.
 *
 * @param ctx - the canvas to paint on
 * @param person - them, as they are
 * @param middle - the middle of the road on screen
 * @param ground - where their boots are, on screen
 * @param scale - how many pixels a metre is at that distance
 * @remarks
 * Legs, body, head and cap - no more, because at any distance worth drawing
 * them at this is thirty pixels tall. What it does have to say is which way
 * they are going, and that is what the eyes are for: coming towards you they
 * have a face, going away from you they do not. Somebody walking **at** the
 * motorhome is the one thing a driver has to notice.
 */
function drawMate(
  ctx: CanvasRenderingContext2D,
  person: Person,
  middle: number,
  ground: number,
  scale: number,
): void {
  // The legs swing with the ground covered rather than with the clock, so they
  // stop where the feet stop - the same rule the figure beside the vehicle
  // follows. Head-on a stride reads as the legs parting, not as one going by.
  const cycle = (person.stride / VIEW.mateStride) * Math.PI * 2;
  const walking = person.walking && person.lift <= 0;
  const swing = walking ? Math.sin(cycle) * VIEW.mateSwing * scale : 0;
  const bob = walking ? Math.abs(Math.cos(cycle)) * VIEW.mateBob * scale : 0;
  const top = ground - bob;

  ctx.fillStyle = PAINT.mateTrousers;
  for (const side of [-1, 1]) {
    const wide = VIEW.mateLegWide * scale;
    ctx.beginPath();
    ctx.roundRect(
      middle + side * (VIEW.mateLegAt * scale + Math.abs(swing)) - wide / 2,
      top - VIEW.mateHip * scale,
      wide,
      VIEW.mateHip * scale + bob,
      wide / 2,
    );
    ctx.fill();
  }

  const wide = VIEW.mateWide * scale;
  ctx.fillStyle = PAINT.mateVest;
  ctx.beginPath();
  ctx.roundRect(
    middle - wide / 2,
    top - (VIEW.mateTall - VIEW.mateHeadR * 2) * scale,
    wide,
    (VIEW.mateTall - VIEW.mateHeadR * 2 - VIEW.mateHip) * scale,
    wide * VIEW.mateRound,
  );
  ctx.fill();

  const headR = VIEW.mateHeadR * scale;
  const headY = top - (VIEW.mateTall - VIEW.mateHeadR) * scale;
  ctx.fillStyle = PAINT.mateSkin;
  ctx.beginPath();
  ctx.arc(middle, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // The cap sits on top and is drawn last, so it covers the crown of the head.
  ctx.fillStyle = PAINT.mateCap;
  ctx.beginPath();
  ctx.arc(middle, headY, headR, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(
    middle - headR,
    headY - VIEW.mateCapHigh * scale,
    headR * 2,
    VIEW.mateCapHigh * scale,
  );

  // Facing left is facing back down the road - that is somebody looking at you.
  if (person.facing < 0) {
    ctx.fillStyle = PAINT.mateEyes;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        middle + side * VIEW.mateEyeAt * scale,
        headY + VIEW.mateEyeDrop * scale,
        VIEW.mateEyeR * scale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

/**
 * The two forelegs, planted either side of the chest.
 *
 * @param ctx - the canvas to paint on
 * @param middle - the middle of the bear across the canvas
 * @param ground - where it stands
 * @param size - how tall the whole animal is, in pixels
 */
function drawBearForelegs(
  ctx: CanvasRenderingContext2D,
  middle: number,
  ground: number,
  size: number,
): void {
  const wide = size * BEAR.legWide;
  for (const side of [-1, 1]) {
    // The near foreleg is the one on the lit side; the other stands in the
    // shadow of the chest, which is what stops the two reading as one block.
    ctx.fillStyle = side < 0 ? PAINT.bear : PAINT.bearDark;
    ctx.beginPath();
    ctx.roundRect(
      middle + side * size * BEAR.legAt - wide / 2,
      ground - size * BEAR.legHigh,
      wide,
      size * BEAR.legHigh,
      wide / 2,
    );
    ctx.fill();
  }
}

/**
 * The chest and shoulders, with the far side of them in shade.
 *
 * @param ctx - the canvas to paint on
 * @param middle - the middle of the bear across the canvas
 * @param ground - where it stands
 * @param size - how tall the whole animal is, in pixels
 * @remarks
 * Head-on a bear is mostly shoulder. The shading is not decoration: a flat
 * brown blob has no front and no sides, and the one thing this shape has to
 * say from two hundred metres is "that is a body, and it is facing you".
 */
function drawBearChest(
  ctx: CanvasRenderingContext2D,
  middle: number,
  ground: number,
  size: number,
): void {
  const mid = ground - size * BEAR.chestAt;
  ctx.fillStyle = PAINT.bear;
  ctx.beginPath();
  ctx.ellipse(
    middle,
    mid,
    size * BEAR.chestWide,
    size * BEAR.chestTall,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = PAINT.bearDark;
  ctx.fillRect(
    middle + size * BEAR.chestWide * BEAR.shade,
    mid - size,
    size,
    size * 2,
  );
  ctx.restore();
}

/**
 * The head: skull, ears, muzzle, nose and two eyes.
 *
 * @param ctx - the canvas to paint on
 * @param middle - the middle of the bear across the canvas
 * @param at - where the middle of the skull sits on the canvas
 * @param size - how tall the whole animal is, in pixels
 * @remarks
 * Round ears set wide apart, and a pale blunt muzzle in the middle of the
 * face: those two together are what nobody mistakes for a boulder. The eyes
 * are two dark dots, small on purpose - any bigger and it is a teddy.
 */
function drawBearFace(
  ctx: CanvasRenderingContext2D,
  middle: number,
  at: number,
  size: number,
): void {
  const skull = size * BEAR.skull;
  for (const side of [-1, 1]) {
    ctx.fillStyle = side < 0 ? PAINT.bear : PAINT.bearDark;
    ctx.beginPath();
    ctx.arc(
      middle + side * skull * BEAR.earAt,
      at - skull * BEAR.earUp,
      skull * BEAR.ear,
      0,
      FULL,
    );
    ctx.fill();
  }
  ctx.fillStyle = PAINT.bear;
  ctx.beginPath();
  ctx.arc(middle, at, skull, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.bearMuzzle;
  ctx.beginPath();
  ctx.ellipse(
    middle,
    at + skull * BEAR.muzzleLow,
    skull * BEAR.muzzleWide,
    skull * BEAR.muzzleTall,
    0,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.bearNose;
  ctx.beginPath();
  ctx.ellipse(
    middle,
    at + skull * BEAR.noseLow,
    skull * BEAR.nose,
    skull * BEAR.nose * BEAR.noseFlat,
    0,
    0,
    FULL,
  );
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      middle + side * skull * BEAR.eyeAt,
      at - skull * BEAR.eyeUp,
      skull * BEAR.eye,
      0,
      FULL,
    );
    ctx.fill();
  }
}

/** A whole turn, for the arcs. */
const FULL = Math.PI * 2;

/** The bear head-on, as shares of how tall it is, or of its skull. */
const BEAR = {
  /** The forelegs: how far out they stand, how thick, how long. */
  legAt: 0.26,
  legWide: 0.19,
  legHigh: 0.44,
  /** The chest: where its middle sits and how big it is. */
  chestAt: 0.55,
  chestWide: 0.42,
  chestTall: 0.4,
  /** Where the shading starts across it, of its half-width. */
  shade: 0.1,
  /** The head: how high it is carried and how big the skull is. */
  headAt: 1.06,
  skull: 0.29,
  /** The ears, as shares of the skull. */
  ear: 0.36,
  earAt: 0.92,
  earUp: 0.62,
  /** The muzzle and the nose on the end of it, as shares of the skull. */
  muzzleLow: 0.34,
  muzzleWide: 0.52,
  muzzleTall: 0.42,
  noseLow: 0.22,
  nose: 0.22,
  noseFlat: 0.72,
  /** The eyes, as shares of the skull. */
  eye: 0.11,
  eyeAt: 0.42,
  eyeUp: 0.2,
} as const;

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
  const ground = heightAt(route, at);
  const foot = project(screen, ground, gap);
  const scale = VIEW.focal / gap;
  const middle = screen.width / 2;
  const top = foot.y - VIEW.flagPole * scale;
  const stands = { gap, foot: ground, tall: VIEW.flagPole };
  drawStanding(ctx, state, route, screen, stands, () => {
    ctx.strokeStyle = PAINT.flagPole;
    ctx.lineWidth = Math.max(1, scale / VIEW.wheelLine);
    ctx.beginPath();
    ctx.moveTo(middle, foot.y);
    ctx.lineTo(middle, top);
    ctx.stroke();
    ctx.fillStyle = PAINT.flag;
    ctx.fillRect(middle, top, VIEW.flagWide * scale, VIEW.flagTall * scale);
  });
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
  // Thinner where the boy and the spider are, or nobody ever sees them.
  const left = fogLeft(route.sections, state.rv.x);
  const to = screen.horizon + screen.height * VIEW.fogTo;
  const wall = ctx.createLinearGradient(0, screen.horizon, 0, to);
  wall.addColorStop(0, PAINT.fog);
  wall.addColorStop(1, "#d8dee300");
  ctx.globalAlpha = left;
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, screen.width, to);
  // Above the horizon there is nothing to see through: solid.
  ctx.globalAlpha = VIEW.fogThick * left;
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
 * The other player, in the seat next to yours.
 *
 * @param ctx - the canvas to paint on
 * @param width - the canvas width
 * @param height - the canvas height
 * @param driving - whether this seat is the one with the wheel in front of it
 * @remarks
 * Whether you are alone in the cab is not a detail: it decides whether the
 * winch has anybody to work it, whether the bridge will hold, and whether
 * getting out leaves the motorhome unattended. Until now the only way to find
 * out was to get out and look.
 *
 * Which **side** they sit on says the rest without a word: the wheel is on the
 * left, so a driver sees their passenger to the right and a passenger sees the
 * driver to the left. Head and shoulders only, cut off by the edge of the
 * frame - that is as much of somebody beside you as anybody ever sees from
 * their own seat.
 */
function drawMateAboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  driving: boolean,
): void {
  // The wheel is on the left: sitting at it, the other seat is to the right.
  const side = driving ? 1 : -1;
  const x = width / 2 + side * width * VIEW.seatMateOut;
  const headY = height * VIEW.seatMateHeadAt;
  const headR = width * VIEW.seatMateHeadR;

  // Shoulders first, so the head sits on them rather than behind them.
  const wide = width * VIEW.seatMateShoulderWide;
  ctx.fillStyle = PAINT.mateVest;
  ctx.beginPath();
  ctx.roundRect(
    x - wide / 2,
    height * VIEW.seatMateShoulderAt,
    wide,
    height - height * VIEW.seatMateShoulderAt,
    wide * VIEW.seatMateShoulderRound,
  );
  ctx.fill();

  ctx.fillStyle = PAINT.mateSkin;
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // The cap over the crown. No peak: at this size a peak is a stick poking
  // out of somebody's head, and the dome already says "cap".
  ctx.fillStyle = PAINT.mateCap;
  ctx.beginPath();
  ctx.arc(x, headY, headR, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(
    x - headR,
    headY - height * VIEW.seatMateCapHigh,
    headR * 2,
    height * VIEW.seatMateCapHigh,
  );

  // One ear, on the side turned towards you - a head in profile without one
  // reads as the back of a head, and then nobody is looking anywhere.
  ctx.fillStyle = PAINT.mateEyes;
  ctx.beginPath();
  // Minus the side, not plus: the ear you can see is the one on the cheek
  // turned your way, and their seat is out towards the edge from yours.
  ctx.arc(
    x - side * headR * VIEW.seatMateEarAt,
    headY + headR * VIEW.seatMateEarAt,
    width * VIEW.seatMateEarR,
    0,
    Math.PI * 2,
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
