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
  /** A section marker, in metres, standing on the left verge. */
  markPole: 3.6,
  markWide: 1.8,
  markTall: 1.1,
  markSide: -5.5,
  /**
   * The steering wheel, as shares of the canvas.
   *
   * @remarks
   * Half of it is below the bottom edge on purpose - that is where a wheel sits
   * when you are looking over it at the road.
   */
  wheelWide: 0.17,
  wheelTall: 0.2,
  wheelLine: 11,
  wheelHub: 0.03,
  /**
   * The instruments, as shares of the canvas.
   *
   * @remarks
   * Between the hands, where a driver's eyes go without leaving the road: the
   * speedometer straight ahead, the gear beside it.
   */
  dialR: 0.075,
  dialAt: 0.84,
  dialTicks: 6,
  dialTickIn: 0.72,
  dialLine: 2,
  needleLine: 3,
  needleBack: 0.18,
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
  gateAt: 0.21,
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
   * How far **above** the middle of the dial the digital reading sits.
   *
   * @remarks
   * Above, because the sweep starts and ends at the bottom: the 0 and the 60
   * live down there, and a reading placed between them sat on top of both.
   */
  dialReadUp: 0.62,
  /**
   * The sweep of the dial, as shares of a half turn.
   *
   * @remarks
   * Zero at the lower left, full at the lower right - the way a speedometer has
   * looked since long before anybody drew one on a screen.
   */
  dialFrom: 0.75,
  dialSweep: 1.5,
  /** How far the wheel's centre sits below the bottom edge, as a share of it. */
  wheelDrop: 0.35,
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
  /** The distant ridge, in pixels. */
  ridgeHeight: 26,
  ridgeWave: 220,
  /** How finely the ridge is drawn, in pixels. */
  ridgeStep: 12,
} as const;

/** The colours of the view ahead. */
const PAINT = {
  skyTop: "#9ed4f2",
  skyLow: "#e8f5fd",
  ridge: "#9fbcae",
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
  thing: {
    hammer: "#8a5a2b",
    tyres: "#2b2b2b",
    spray: "#c0392b",
    bear: "#4a3527",
  } as Readonly<Record<string, string>>,
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
  drawRidge(ctx, width, horizon, state.rv.x);
  drawRoad(ctx, state, route, { width, height, horizon, eye });
  drawTrees(ctx, state, route, candidate, { width, height, horizon, eye });
  drawSectionFlags(ctx, state, route, { width, height, horizon, eye });
  drawThings(ctx, state, route, { width, height, horizon, eye });
  drawFlag(ctx, state, route, { width, height, horizon, eye });
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

/** A far ridge on the horizon, drifting slowly with the drive. */
function drawRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizon: number,
  travelled: number,
): void {
  ctx.fillStyle = PAINT.ridge;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let px = 0; px <= width; px += VIEW.ridgeStep) {
    const wave = Math.sin((px + travelled) / VIEW.ridgeWave);
    ctx.lineTo(px, horizon - (VIEW.ridgeHeight * (1 + wave)) / 2);
  }
  ctx.lineTo(width, horizon);
  ctx.closePath();
  ctx.fill();
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
    const size =
      (thing.kind === "bear" ? VIEW.bearSize : VIEW.itemSize) * scale;
    ctx.fillStyle = PAINT.thing[thing.kind] ?? PAINT.thing.tyres;
    ctx.beginPath();
    ctx.ellipse(
      middle,
      foot.y - size / 2,
      size / 2,
      size / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    if (thing.kind === "bear") {
      // A head and two ears, so the brown mass in the road reads as an animal
      // and not as a boulder somebody rolled there.
      const head = size * VIEW.bearHead;
      ctx.beginPath();
      ctx.arc(middle, foot.y - size, head, 0, Math.PI * 2);
      ctx.fill();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(
          middle + side * head,
          foot.y - size - head,
          head / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
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
 * Half cut off by the bottom edge, the way a wheel looks from behind it.
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
  ctx.lineWidth = VIEW.wheelLine;
  ctx.beginPath();
  ctx.ellipse(middle, centre, across, down, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Two spokes and a hub, which is all of a wheel that shows from up here.
  ctx.beginPath();
  ctx.moveTo(middle - across, centre);
  ctx.lineTo(middle + across, centre);
  ctx.stroke();
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
 */
function drawInstruments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
): void {
  const middle = width / 2;
  const centre = height * VIEW.dialAt;
  const radius = width * VIEW.dialR;

  ctx.fillStyle = PAINT.dial;
  ctx.beginPath();
  ctx.arc(middle, centre, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAINT.dialFace;
  ctx.beginPath();
  ctx.arc(middle, centre, radius - VIEW.dialLine * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let tick = 0; tick <= VIEW.dialTicks; tick++) {
    const at =
      Math.PI * (VIEW.dialFrom + (VIEW.dialSweep * tick) / VIEW.dialTicks);
    ctx.strokeStyle = PAINT.dialTick;
    ctx.lineWidth = VIEW.dialLine;
    ctx.beginPath();
    ctx.moveTo(
      middle + Math.cos(at) * radius * VIEW.dialTickIn,
      centre + Math.sin(at) * radius * VIEW.dialTickIn,
    );
    ctx.lineTo(middle + Math.cos(at) * radius, centre + Math.sin(at) * radius);
    ctx.stroke();
    // Every second tick carries its number, so the needle says how fast and
    // not merely how far round it has swung. All of them would be a wall of
    // digits on a dial this size.
    if (tick % 2 === 0) {
      ctx.fillStyle = PAINT.dialTick;
      ctx.font = `${Math.round(height * VIEW.dialLabel)}px sans-serif`;
      ctx.fillText(
        String(Math.round((VIEW.dialTop * tick) / VIEW.dialTicks)),
        middle + Math.cos(at) * radius * VIEW.dialLabelIn,
        centre + Math.sin(at) * radius * VIEW.dialLabelIn,
      );
    }
  }

  // The needle reads how fast, not which way - reversing is still speed.
  const kmh = Math.abs(state.rv.v) * KMH_PER_MS;
  const share = Math.min(1, kmh / VIEW.dialTop);
  const at = Math.PI * (VIEW.dialFrom + VIEW.dialSweep * share);
  ctx.strokeStyle = PAINT.needle;
  ctx.lineWidth = VIEW.needleLine;
  ctx.beginPath();
  ctx.moveTo(
    middle - Math.cos(at) * radius * VIEW.needleBack,
    centre - Math.sin(at) * radius * VIEW.needleBack,
  );
  ctx.lineTo(
    middle + Math.cos(at) * radius * VIEW.dialTickIn,
    centre + Math.sin(at) * radius * VIEW.dialTickIn,
  );
  ctx.stroke();

  // And the same number in figures, for the moments when "about two thirds
  // round" is not what you want to know.
  ctx.fillStyle = PAINT.dialTick;
  ctx.font = `${Math.round(height * VIEW.dialRead)}px sans-serif`;
  ctx.fillText(
    `${Math.round(kmh)} km/h`,
    middle,
    centre - radius * VIEW.dialReadUp,
  );

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
  const top = height * VIEW.dialAt - down / 2;
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
