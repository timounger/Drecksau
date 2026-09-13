/**
 * Drawing Los Santos onto the canvas.
 *
 * @module
 * @remarks
 * The camera follows the player, and only what is on screen is drawn - the city
 * is 3000 pixels across and most of it is behind you. Everything here reads the
 * state and paints; nothing here changes it.
 *
 * The picture is tilted: {@link ./projection} squashes depth and lifts height,
 * so houses, cars and people are boxes with a roof and a wall facing you rather
 * than flat rectangles. Everything that stands up off the road is collected
 * first and painted back to front, or a car would drive through the house in
 * front of it instead of behind it.
 */
import {
  STATIONS,
  cellUnder,
  roadLines,
  doorsOf,
  garageBay,
  garageMouth,
  railAngle,
  railLine,
  carPark,
  builtPlot,
  platformBox,
  motorwayLine,
  lightAt,
  lightColour,
  type LightColour,
} from "@/games/gta/engine/city";
import { drawActions } from "@/games/gta/components/gta-actions";
import { trainCars, trainDue } from "@/games/gta/engine/train";
import { builtBlock, inCity } from "@/games/gta/engine/city";
import { carOf } from "@/games/gta/engine/engine";
import {
  BLAST_SECONDS,
  BURN_SECONDS,
  FIRE_STAGE,
  FUMES_STAGE,
  SMOKE_STAGE,
  BLOCK_TILES,
  CITY_TILES,
  CITY_SIZE,
  AIRPORT,
  BASE,
  BASE_HUTS,
  ACK_FLOOR,
  ACK_HEALTH,
  DAY_HOURS,
  FARMS,
  FIELDS,
  HOUR_MINUTES,
  MOUNTAIN,
  MINUTES_PER_SECOND,
  START_HOUR,
  CHOP_CEILING,
  HELI_FALL,
  HELI_HEIGHT,
  JET_CEILING,
  PIERS,
  ROOF_HEIGHT,
  SLIP_SMOKE,
  RUNWAY,
  MARK_LIFE,
  MAX_STARS,
  STAR_FLASH,
  PLAYER_HEALTH,
  STRIDE,
  TILE,
  TRAIN_LONG,
  TRAIN_WIDE,
  type Ack,
  type Bullet,
  type Car,
  type Cell,
  type Charge,
  type Animal,
  type Cop,
  type GameState,
  type Player,
  type Person,
  type Pickup,
  type Vec,
} from "@/games/gta/engine/types";
import {
  BLAST_RADIUS,
  WEAPONS,
  slotOf,
  type WeaponKind,
} from "@/games/gta/engine/weapons";
import {
  BODY_SIZE,
  HEAD_SIZE,
  LEGS_SIZE,
  SWING_FRAMES,
  bodySprite,
  handAt,
  headSprite,
  legsSprite,
  downSprite,
  DOWN_SIZE,
  type ArmPose,
  type FigureLook,
  type FigureStyle,
  type Hand,
} from "@/games/gta/components/figure-art";
import {
  ANIMAL_BODY_SIZE,
  ANIMAL_HEAD_SIZE,
  TROT_FRAMES,
  animalBody,
  animalHead,
} from "@/games/gta/components/animal-art";
import { buildingAt } from "@/games/gta/engine/city";
import type { Building } from "@/games/gta/engine/buildings";
import { VEHICLES, type VehicleBody } from "@/games/gta/engine/vehicles";
import {
  STEEL,
  VEHICLE_MARGIN,
  bodyOutline,
  cabinOutline,
  wallFaces,
  tiersOf,
  turretSprite,
  TURRET_SIZE,
  vehicleSprite,
  vehicleWall,
  type VehicleFace,
  type VehicleSide,
  type VehicleTiers,
} from "@/games/gta/components/vehicle-art";
import {
  CAR_HEIGHT,
  DEPTH,
  ZOOM,
  cameraFor,
  LOOK_AT,
  HOUSE_HIGH,
  HOUSE_LOW,
  PERSON_HEIGHT,
  SHOT_HEIGHT,
  project,
  seenArea,
  type Screen,
  type View,
} from "@/games/gta/components/projection";

/** What each kind of ground looks like. */
const GROUND: Readonly<Record<Cell, string>> = {
  road: "#3f3f46",
  walk: "#a1a1aa",
  building: "#57534e",
  park: "#4d7c0f",
  water: "#1d4ed8",
  // The ballast between the sleepers. The rails and the sleepers themselves
  // are drawn on top of it - see drawTrack.
  rail: "#6b6259",
  // The three landscapes between the cities, and the concrete of the two
  // places that are neither city nor country.
  sand: "#dcc38b",
  forest: "#2f6b34",
  dock: "#a8a29e",
  runway: "#4b4b53",
  // The ground under the wire is the desert it stands in; the wire itself is
  // painted on top of it - see drawFence.
  fence: "#cbb07a",
  // The mountain, the farm track and the ploughed fields. The stone is shaded
  // by height on top of this - see drawStone.
  rock: "#7a7268",
  dirt: "#a98d62",
  field: "#9a7b3f",
};

/** The yellow of a taxi, and of nothing else on four wheels. */
const TAXI_PAINT = "#facc15";

/** The near-white that would otherwise be mistaken for bare steel. */
const PALE_PAINT = "#e5e7eb";

/** The paint jobs cars come in. */
const CAR_PAINT: readonly string[] = [
  "#dc2626",
  "#2563eb",
  TAXI_PAINT,
  "#16a34a",
  "#f97316",
  "#a855f7",
  PALE_PAINT,
  "#0f172a",
];

/**
 * What an ordinary car or off-roader may be painted.
 *
 * @remarks
 * Everything except the two colours that mean something. A yellow saloon in
 * the traffic is a taxi one runs after for nothing, and a white one is a
 * DMC-12 one has already found - the two vehicles worth spotting from across
 * a junction are exactly the two that must not have company.
 */
const PLAIN_PAINT: readonly string[] = CAR_PAINT.filter(
  (paint) => paint !== TAXI_PAINT && paint !== PALE_PAINT,
);

/** The shirts people wear. */
const SHIRTS: readonly string[] = [
  "#f472b6",
  "#38bdf8",
  "#fde047",
  "#4ade80",
  "#fb923c",
  "#e2e8f0",
];

/** The trousers people wear. */
const TROUSERS: readonly string[] = [
  "#1e293b",
  "#3f3f46",
  "#44403c",
  "#312e81",
  "#4c1d95",
];

/** The tones people come in. */
const SKINS: readonly string[] = ["#f2c9a0", "#d8a678", "#a1663c", "#6b4226"];

/** What is on their heads, seen from above. */
const HAIR: readonly string[] = [
  "#1c1917",
  "#78350f",
  "#a16207",
  "#525252",
  "#0f172a",
];

/**
 * What lies beyond the city limits.
 *
 * @remarks
 * Nothing you can drive on, and not the sea either: the sea is a place in this
 * city, in the south, and painting the whole outside blue made every edge of
 * the map look like a beach that had been forgotten.
 */
const BEYOND = "#1c2a17";

/** How tall the clock over the panel is, in pixels. */
const CLOCK_HIGH = 26;

/** How big the map in the corner is, in pixels. */
const MAP_SIZE = 170;

/** And the through routes, which are the only black thing on the map. */
const MAP_MAIN = "#0a0a0a";

/** What the city looks like on that map: light streets on dark blocks. */
const MAP_GROUND: Readonly<Record<Cell, string>> = {
  road: "#d4d4d8",
  // Pavement is drawn as part of the block: two pixels wide it would only
  // fray the edge of every block and turn the map into a mesh.
  walk: "#3f3f46",
  building: "#3f3f46",
  park: "#4d7c0f",
  water: "#1e3a8a",
  rail: "#991b1b",
  sand: "#cbb384",
  forest: "#265c2b",
  dock: "#9ca3af",
  runway: "#52525b",
  // On the map the base is what matters, not the ground: a hard grey square
  // in the middle of the desert, which is exactly how it should read.
  fence: "#e5e7eb",
  rock: "#78716c",
  dirt: "#b59a6d",
  field: "#8a6f39",
};

/**
 * The city floor of the map, painted once at one pixel per cell.
 *
 * @remarks
 * The city never changes - createCity takes no seed - so the four thousand
 * squares are worth painting once and stamping sixty times a second rather
 * than painting sixty times a second.
 */
let cityImage: HTMLCanvasElement | null = null;

/** How much of a flight the camera comes along for. */
const CAMERA_LIFT = 0.55;

/** How solid something behind a house is drawn on top of it. */
const GHOST = 0.85;

/** How solid a house is drawn while something stands behind it. */
const SEE_THROUGH = 0.5;

/**
 * How solid a house is drawn while the *player* stands behind it.
 *
 * @remarks
 * Thinner than for anybody else. Losing a passer-by behind a roof for a moment
 * costs nothing; losing yourself costs the game.
 */
const SEE_THROUGH_ME = 0.25;

/** Something standing up off the road, and how far into the picture it is. */
type Standing = {
  /** City y of its front edge - what the back-to-front order goes by. */
  readonly depth: number;
  /** Where it stands, for working out whether a house swallows it. */
  readonly at: Vec | null;
  /** True for the one thing the player must never lose sight of: himself. */
  readonly mine?: boolean;
  /** Paints it, as solid as it is asked to be. */
  readonly paint: (fade: number) => void;
};

/** A house waiting to be painted, and the patch of screen it covers. */
type House = {
  readonly wall: Wall;
  readonly paint: (fade: number) => void;
};

/** A house as it covers the screen, for working out what it hides. */
type Wall = {
  /** City y of the house front, so it is clear what stands behind it. */
  readonly depth: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

/** The stretch of city a frame covers. */
type Seen = ReturnType<typeof seenArea>;

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are coordinates on a canvas: where a windscreen sits on a bonnet,
   how thick a kerb is drawn. They are drawing, not arithmetic, and naming each
   one would say less than the line it stands in. */

/**
 * Paints one frame.
 *
 * @param ctx - the canvas to paint on
 * @param state - the city as it stands
 * @param width - the canvas width in view pixels
 * @param height - the canvas height in view pixels
 * @param zoom - how close the camera stands, from the settings
 * @param day - whether the clock runs and the city gets dark at night
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  zoom: number = ZOOM,
  day = false,
): void {
  // The city is drawn through the zoom, the corners of the screen are not: a
  // map and a row of numbers that grew with the lens would eat the picture.
  // The camera comes up with a man on a jetpack, though not all the way: it
  // follows a little over half the climb, so the figure drifts up the picture
  // while the ground slides down under him and his shadow stays in sight.
  const eye = {
    ...state.player,
    y: state.player.y - (state.player.height / DEPTH) * CAMERA_LIFT,
  };
  const view = cameraFor(eye, width, height, zoom);
  const seen = seenArea(view);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-view.width / 2, -view.height / 2);
  drawGround(ctx, state, view, seen);
  drawMarkers(ctx, state, view);
  drawPickups(ctx, state, view, seen);
  drawCharges(ctx, state, view);
  drawScene(ctx, state, view, seen);
  drawChargeLights(ctx, state, view);
  drawBlasts(ctx, state, view);
  ctx.restore();
  // The light goes over the city and under everything one reads: a dashboard
  // that dimmed at dusk would be a dashboard nobody can use at dusk.
  drawLight(ctx, state, width, height, day);
  drawMinimap(ctx, state, height);
  drawStatus(ctx, state, width, day);
  drawActions(ctx, state, width, height);
}

/**
 * What time it is in San Andreas.
 *
 * @param time - the simulation clock, in seconds
 * @returns minutes since midnight, from nought to one day
 * @remarks
 * One second is one minute, so a whole day is twenty-four real minutes. Short
 * enough to see two sunsets in an evening's play, long enough that driving
 * across the map does not land in a different hour than setting off did.
 */
export function clockAt(time: number): number {
  const day = DAY_HOURS * HOUR_MINUTES;
  const gone = START_HOUR * HOUR_MINUTES + time * MINUTES_PER_SECOND;
  return ((gone % day) + day) % day;
}

/** The clock as a string, `hh:mm`. */
function clockText(time: number): string {
  const minutes = Math.floor(clockAt(time));
  const hour = Math.floor(minutes / HOUR_MINUTES);
  const past = minutes % HOUR_MINUTES;
  return `${String(hour).padStart(2, "0")}:${String(past).padStart(2, "0")}`;
}

/**
 * One stop in the day: what the light is like at that hour.
 *
 * @remarks
 * Between two of them the colour and the strength are mixed, so the sky slides
 * rather than switches. Dawn and dusk have stops of their own - orange over a
 * blue city is the picture everybody knows from the hour either side of the
 * sun, and it is what makes a clock worth having on the screen.
 */
type Sky = {
  /** The hour it belongs to. */
  readonly hour: number;
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  /** How much of it is laid over the city, from nought to one. */
  readonly weight: number;
};

/** The day, as five stops and their mirror images. */
const SKY: readonly Sky[] = [
  { hour: 0, red: 8, green: 14, blue: 44, weight: 0.62 },
  { hour: 4.5, red: 8, green: 14, blue: 44, weight: 0.62 },
  { hour: 6, red: 244, green: 114, blue: 60, weight: 0.26 },
  { hour: 7.5, red: 255, green: 214, blue: 150, weight: 0.08 },
  { hour: 9, red: 255, green: 255, blue: 255, weight: 0 },
  { hour: 17.5, red: 255, green: 255, blue: 255, weight: 0 },
  { hour: 19, red: 251, green: 146, blue: 60, weight: 0.24 },
  { hour: 20.5, red: 190, green: 80, blue: 90, weight: 0.38 },
  { hour: 22, red: 8, green: 14, blue: 44, weight: 0.62 },
  { hour: 24, red: 8, green: 14, blue: 44, weight: 0.62 },
];

/** The light of the hour, laid over the whole picture. */
function drawLight(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  day: boolean,
): void {
  if (!day) {
    return;
  }
  const hour = clockAt(state.time) / HOUR_MINUTES;
  let before = SKY[0] ?? null;
  let after = SKY[SKY.length - 1] ?? null;
  for (const stop of SKY) {
    if (stop.hour <= hour) {
      before = stop;
    }
  }
  for (let at = SKY.length - 1; at >= 0; at -= 1) {
    const stop = SKY[at];
    if (stop !== undefined && stop.hour >= hour) {
      after = stop;
    }
  }
  if (before !== null && after !== null && before.weight + after.weight > 0) {
    const span = after.hour - before.hour;
    const part = span <= 0 ? 0 : (hour - before.hour) / span;
    const mix = (one: number, other: number) =>
      Math.round(one + (other - one) * part);
    const weight = before.weight + (after.weight - before.weight) * part;
    ctx.save();
    ctx.globalAlpha = weight;
    ctx.fillStyle = `rgb(${String(mix(before.red, after.red))},${String(
      mix(before.green, after.green),
    )},${String(mix(before.blue, after.blue))})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

/** The floor: one squashed rectangle per visible cell, plus the lane markings. */
function drawGround(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
): void {
  const fromCol = Math.floor(seen.left / TILE);
  const fromRow = Math.floor(seen.top / TILE);
  const toCol = Math.ceil(seen.right / TILE);
  const toRow = Math.ceil(seen.bottom / TILE);
  ctx.fillStyle = BEYOND;
  ctx.fillRect(0, 0, view.width, view.height);
  const deep = TILE * DEPTH + 1;
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const outside =
        col < 0 || row < 0 || col >= CITY_TILES || row >= CITY_TILES;
      const cell = cellUnder(state.cells, col * TILE, row * TILE);
      ctx.fillStyle = outside ? BEYOND : GROUND[cell];
      const at = project(view, col * TILE, row * TILE);
      ctx.fillRect(at.x, at.y, TILE + 1, deep);
    }
  }
  drawCountryRoads(ctx, view, seen);
  drawMarks(ctx, state, view, seen);
  drawScenery(ctx, state, view, fromCol, fromRow, toCol, toRow);
}

/**
 * The black marks left by tyres that were dragged rather than rolled.
 *
 * @param ctx - what to paint on
 * @param state - the city, for the marks and the clock
 * @param view - where the camera is
 * @param seen - the patch of city on screen
 * @remarks
 * Straight onto the road, under everything else: a skid mark is on the tarmac,
 * not on the cars that drive over it afterwards. Each is a short dark capsule
 * along the way the tyre was pointing, and successive ones overlap into a
 * continuous line at any speed worth skidding at.
 *
 * They fade with age rather than vanishing, which is the whole reason the time
 * is kept with them.
 */
function drawMarks(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = MARK_WIDE;
  for (const mark of state.marks) {
    const near =
      mark.x > seen.left - TILE &&
      mark.x < seen.right + TILE &&
      mark.y > seen.top - TILE &&
      mark.y < seen.bottom + TILE;
    if (near) {
      const age = (state.time - mark.at) / MARK_LIFE;
      ctx.globalAlpha = Math.max(0, MARK_DARK * (1 - age));
      const from = project(
        view,
        mark.x - Math.cos(mark.angle) * MARK_LONG,
        mark.y - Math.sin(mark.angle) * MARK_LONG,
      );
      const to = project(
        view,
        mark.x + Math.cos(mark.angle) * MARK_LONG,
        mark.y + Math.sin(mark.angle) * MARK_LONG,
      );
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** How wide one mark is drawn, in pixels. */
const MARK_WIDE = 5;

/** And how far it reaches either side of where the tyre was. */
const MARK_LONG = 14;

/** How dark a fresh one is. */
const MARK_DARK = 0.5;

/**
 * The roads between the cities, drawn as the curves they are.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param seen - the patch of city on screen, so a road off it costs nothing
 * @remarks
 * The floor knows a road as squares, because squares are what a car asks when
 * it wants to know whether it is on tarmac. But a curve laid into squares of
 * forty-eight pixels is a staircase, and a staircase is what a road is not.
 *
 * So this strokes the **same curve the squares were laid from** - one path,
 * round joins, round caps - a shade wider than the squares underneath. The
 * steps vanish under the line, the edges come out smooth, and nothing about
 * where one may drive has changed: the squares still answer that, and they
 * answer it for a road slightly narrower than the one on the screen, so the
 * tarmac one can see is always tarmac one can use.
 */
function drawCountryRoads(
  ctx: CanvasRenderingContext2D,
  view: View,
  seen: Seen,
): void {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const road of roadLines()) {
    const near = road.points.some(
      (point) =>
        point.x * TILE > seen.left - ROAD_MARGIN &&
        point.x * TILE < seen.right + ROAD_MARGIN &&
        point.y * TILE > seen.top - ROAD_MARGIN &&
        point.y * TILE < seen.bottom + ROAD_MARGIN,
    );
    if (near) {
      const wide = (road.wide + ROAD_COVER) * TILE;
      // The verge first, a little wider: it hides the last of the steps and
      // gives the road an edge to sit in rather than floating on the grass.
      // Only out in the country - a road through a city has kerbs, and a strip
      // of dust drawn across a junction is a strip of dust on a junction.
      strokeVerge(ctx, view, road.points, wide + VERGE);
      strokeRoad(
        ctx,
        view,
        road.points,
        wide,
        road.dirt ? GROUND.dirt : GROUND.road,
      );
    }
  }
  ctx.restore();
}

/** How far off screen a road still counts as worth drawing, in pixels. */
const ROAD_MARGIN = 400;

/** How much wider than its squares a road is painted, in squares. */
const ROAD_COVER = 1.1;

/** How far the verge stands out past the tarmac, in pixels. */
const VERGE = 14;

/** What that verge is painted in: the dust a road throws onto its own edge. */
const VERGE_PAINT = "#6b6357";

/**
 * The dusty edge of a road, drawn only where a road has one.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param points - the road, in squares
 * @param wide - how wide to stroke it
 * @remarks
 * Segment by segment, because a country road that runs into a city stops
 * having verges at the first kerb - and a brown stripe painted across a
 * junction reads as somebody spilt something, not as a road.
 */
function strokeVerge(
  ctx: CanvasRenderingContext2D,
  view: View,
  points: readonly Vec[],
  wide: number,
): void {
  ctx.strokeStyle = VERGE_PAINT;
  ctx.lineWidth = wide;
  ctx.beginPath();
  points.forEach((point, at) => {
    const next = points[at + 1];
    if (next !== undefined) {
      const middle = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
      if (!inCity(Math.floor(middle.x), Math.floor(middle.y))) {
        const from = project(view, point.x * TILE, point.y * TILE);
        const to = project(view, next.x * TILE, next.y * TILE);
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
      }
    }
  });
  ctx.stroke();
}

/** One road, as one stroked path. */
function strokeRoad(
  ctx: CanvasRenderingContext2D,
  view: View,
  points: readonly Vec[],
  wide: number,
  paint: string,
): void {
  ctx.strokeStyle = paint;
  ctx.lineWidth = wide;
  ctx.beginPath();
  points.forEach((point, at) => {
    const spot = project(view, point.x * TILE, point.y * TILE);
    if (at === 0) {
      ctx.moveTo(spot.x, spot.y);
    } else {
      ctx.lineTo(spot.x, spot.y);
    }
  });
  ctx.stroke();
}

/**
 * What grows and what floats: trees in the wood, boats at the quay, aeroplanes
 * on the apron.
 *
 * @remarks
 * All of it is painted flat on the floor rather than put in the standing list.
 * A wood is thousands of trees; giving every one of them a place in the
 * back-to-front order would cost more than the whole rest of the frame, and
 * from above a tree is a green circle either way.
 */
function drawScenery(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
): void {
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const cell = cellUnder(state.cells, col * TILE, row * TILE);
      if (
        cell === "forest" &&
        spread(col, row) > TREE_SHARE &&
        rooted(state.cells, col, row)
      ) {
        drawTree(ctx, view, col, row);
      }
      if (cell === "road") {
        drawSignals(ctx, view, state, col, row);
      }
      if (cell === "fence") {
        drawFence(ctx, view, col, row);
      }
      if (cell === "rock" && spread(col + 5, row + 11) > 0.84) {
        drawBoulder(ctx, view, col, row);
      }
      if (cell === "field") {
        drawFurrows(ctx, view, col, row);
      }
    }
  }
  drawCarParks(ctx, view, fromCol, fromRow, toCol, toRow);
  drawTrack(ctx, view, fromCol, fromRow, toCol, toRow);
  drawBase(ctx, state, view);
  drawRunway(ctx, view);
  drawPlanes(ctx, view);
  drawBoats(ctx, view);
  drawPlatforms(ctx, state, view);
}

/** The two aeroplanes parked on the apron, so the airfield reads as one. */
function drawPlanes(ctx: CanvasRenderingContext2D, view: View): void {
  for (let at = 0; at < PLANES; at += 1) {
    const x = (AIRPORT.left + 5 + at * 9) * TILE;
    const y = (AIRPORT.top + 3.5) * TILE;
    drawPlane(ctx, view, { x, y });
  }
}

/** How many of them there are. */
const PLANES = 2;

/** One of them, from above: a tube, two wings and a tail. */
function drawPlane(ctx: CanvasRenderingContext2D, view: View, at: Vec): void {
  const long = TILE * 4.2;
  const body = TILE * 0.75;
  const span = TILE * 3.4;
  const spot = project(view, at.x, at.y, 14);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.fillStyle = "#e5e7eb";
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5;
  // Wings first, then the fuselage over them.
  ctx.beginPath();
  ctx.moveTo(-long * 0.05, -span / 2);
  ctx.lineTo(long * 0.16, -span / 2);
  ctx.lineTo(long * 0.2, span / 2);
  ctx.lineTo(-long * 0.05, span / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-long * 0.44, -body * 0.6);
  ctx.lineTo(-long * 0.44, body * 0.6);
  ctx.lineTo(long * 0.3, body * 0.5);
  ctx.lineTo(long * 0.5, 0);
  ctx.lineTo(long * 0.3, -body * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(-long * 0.44, -body * 0.25, long * 0.16, body * 0.5);
  ctx.restore();
}

/**
 * The three station platforms, beside the track.
 *
 * @remarks
 * Painted rather than built: a platform is a slab of concrete with a yellow
 * line on it and a roof over part of it, and none of that has to be anything
 * the floor knows about. What matters is that it is where the train stops.
 */
function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  STATIONS.forEach((stop, which) => {
    // The plan knows where the concrete goes - it keeps the houses off it.
    const box = platformBox(stop);
    const down = Math.abs(Math.cos(railAngle(stop.col, stop.row))) > HALF_TILE;
    const across = (box.right - box.left) * TILE;
    const deep = (box.bottom - box.top) * TILE;
    const corner = project(view, box.left * TILE, box.top * TILE);
    ctx.fillStyle = "#d6d3d1";
    ctx.fillRect(corner.x, corner.y, across, deep * DEPTH);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(
      corner.x,
      corner.y,
      down ? across : 4,
      down ? 4 : deep * DEPTH,
    );
    // On the far side of the platform from the track: in the middle it would
    // be under the feet of everybody waiting.
    const x = (box.left + box.right) / 2;
    const y = (box.top + box.bottom) / 2;
    const board = {
      x: x * TILE + (down ? 0 : BOARD_OFF),
      y: y * TILE + (down ? BOARD_OFF : 0),
    };
    drawDueBoard(ctx, view, board, trainDue(state.train, state.time, which));
  });
}

/**
 * The board on the platform: how long until the train gets here.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - the middle of the platform, in city pixels
 * @param due - seconds until it arrives, or zero while it stands here
 * @remarks
 * Painted flat on the concrete rather than hung on a post: in a picture seen
 * from above a sign on a pole is a pole, and the one thing anybody waiting on
 * a platform wants to read is the number.
 */
function drawDueBoard(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  due: number,
): void {
  const spot = project(view, at.x, at.y);
  const says = due <= 0 ? "Zug hält" : `Zug in ${String(Math.ceil(due))} s`;
  const wide = 34;
  const high = 11;
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(spot.x - wide / 2, spot.y - high / 2, wide, high);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(spot.x - wide / 2, spot.y - high / 2, wide, high);
  ctx.fillStyle = due <= 0 ? "#4ade80" : "#facc15";
  ctx.font = "bold 6.5px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(says, spot.x, spot.y + 0.5);
  ctx.restore();
}

/** How far the board stands from the middle of the platform, in pixels. */
const BOARD_OFF = 46;

/** The middle of a square, as a share of its width. */
const HALF_TILE = 0.5;

/**
 * One square of railway: sleepers across it and two steel rails along it.
 *
 * @remarks
 * Which way it runs comes from the loop rather than from the neighbours - the
 * line is a rectangle, so the two upright sides are the two columns of it and
 * everything else runs east to west. At a corner both are true and the upright
 * wins, which is what a corner of track looks like from above anyway.
 */
function drawTrack(
  ctx: CanvasRenderingContext2D,
  view: View,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
): void {
  const line = railLine();
  const rails = [new Path2D(), new Path2D()];
  let running = false;
  ctx.fillStyle = "#4a3b2c";
  line.forEach((point, at) => {
    const next = line[(at + 1) % line.length] ?? point;
    const seen =
      point.x >= fromCol - 1 &&
      point.x <= toCol + 1 &&
      point.y >= fromRow - 1 &&
      point.y <= toRow + 1;
    if (!seen) {
      running = false;
    } else {
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const long = Math.hypot(dx, dy) || 1;
      const spot = project(view, point.x * TILE, point.y * TILE);
      // A sleeper every other step, laid across the line.
      if (at % TIE_EVERY === 0) {
        ctx.save();
        ctx.translate(spot.x, spot.y);
        ctx.scale(1, DEPTH);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.fillRect(-TIE_THICK / 2, -TIE_LONG / 2, TIE_THICK, TIE_LONG);
        ctx.restore();
      }
      // And the two rails, offset to either side of the line and squashed the
      // same way the ground is.
      rails.forEach((rail, side) => {
        const hand = side === 0 ? 1 : -1;
        // The step is measured in squares, so the unit normal is the step
        // divided by its own length - and the rail sits half a gauge along it,
        // in pixels.
        const off = (hand * GAUGE) / 2 / long;
        const to = {
          x: spot.x - dy * off,
          y: spot.y + dx * off * DEPTH,
        };
        if (running) {
          rail.lineTo(to.x, to.y);
        } else {
          rail.moveTo(to.x, to.y);
        }
      });
      running = true;
    }
  });
  ctx.strokeStyle = "#b8bcc2";
  ctx.lineWidth = RAIL_THICK;
  for (const rail of rails) {
    ctx.stroke(rail);
  }
}

/** Every how many points of the line a sleeper is laid. */
const TIE_EVERY = 2;

/** How thick a rail is drawn, in pixels. */
const RAIL_THICK = 3;

/** How long one of them is, across the track. */
const TIE_LONG = 30;

/** And how thick, along it. */
const TIE_THICK = 7;

/** How far apart the two rails are. */
const GAUGE = 20;

/**
 * One square of the fence round the military base.
 *
 * @remarks
 * Posts and wire rather than a wall, because that is what it is: one can see
 * the tank from outside and stand there looking at it. What stops anybody is
 * the floor underneath saying no, and the ten men behind it saying it louder.
 */
function drawFence(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const upright = col === BASE.left || col === BASE.right;
  const at = project(view, col * TILE, row * TILE);
  const across = TILE;
  const deep = TILE * DEPTH;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.strokeStyle = "rgba(203,213,225,0.75)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  // The mesh: a few strands each way, which at this size reads as wire.
  for (let strand = 1; strand < MESH; strand += 1) {
    const part = strand / MESH;
    if (upright) {
      ctx.moveTo(across / 2 - WIRE_WIDE / 2, part * deep);
      ctx.lineTo(across / 2 + WIRE_WIDE / 2, part * deep);
    } else {
      ctx.moveTo(part * across, deep / 2 - (WIRE_WIDE * DEPTH) / 2);
      ctx.lineTo(part * across, deep / 2 + (WIRE_WIDE * DEPTH) / 2);
    }
  }
  ctx.stroke();
  // And the posts, one to a square.
  ctx.fillStyle = "#57534e";
  if (upright) {
    ctx.fillRect(across / 2 - 2, 0, 4, deep);
  } else {
    ctx.fillRect(0, deep / 2 - 2 * DEPTH, across, 4 * DEPTH);
  }
  ctx.restore();
}

/** How many strands of wire are drawn across one square. */
const MESH = 4;

/** How tall the wire stands, in pixels. */
const WIRE_WIDE = 16;

/**
 * The mountain.
 *
 * @param ctx - what to paint on
 * @param state - the city, for which squares are stone
 * @param view - where the camera is
 * @remarks
 * **A lit slope, not a contour map.** There is no height in this picture, so
 * the mountain was drawn the way an atlas draws one: a wash that grows lighter
 * towards the middle with rings on it. It read as a beige dinner plate.
 *
 * What an engine does instead is what this does now: a height field, and light
 * on it. `heightAt` is the shape of the hill - a cone with ridges running down
 * it and noise on top - and every pixel is shaded by how its own patch of
 * slope is tilted against a light from the north west. Slopes facing the light
 * come out pale, slopes facing away go dark, and the ridges and gullies appear
 * of their own accord because that is what shading *is*. Nothing about it is a
 * picture of a mountain; it is a mountain lit.
 *
 * **Cut out to fit the ground.** Every pixel asks the floor whether it is
 * standing on stone, smoothed between square centres, and fades out where it is
 * not. That is what keeps the foot of the hill off the road round it - the wash
 * used to be one big ellipse and simply lay over the tarmac - and it is also
 * what carves the dirt track into the hillside, because the squares of the
 * track are not stone either.
 *
 * Worked out once into a picture. It is thousands of square roots, and the
 * mountain never moves.
 */
function drawMountain(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  const sheet = mountainSprite(state);
  if (sheet !== null) {
    const span = (MOUNTAIN.radius + MOUNTAIN_EDGE) * 2;
    const corner = project(
      view,
      (MOUNTAIN.x - MOUNTAIN.radius - MOUNTAIN_EDGE) * TILE,
      (MOUNTAIN.y - MOUNTAIN.radius - MOUNTAIN_EDGE) * TILE,
    );
    ctx.drawImage(sheet, corner.x, corner.y, span * TILE, span * TILE * DEPTH);
  }
}

/** How many squares of margin the picture keeps round the stone. */
const MOUNTAIN_EDGE = 2;

/** How many pixels of the picture one square of the mountain gets. */
const MOUNTAIN_GRAIN = 12;

/** The mountain, worked out once. */
let mountainImage: HTMLCanvasElement | null = null;

/**
 * The mountain as a picture, lit from the north west.
 *
 * @param state - the city, for which squares are stone
 * @returns the picture, or null where the browser gives no canvas
 */
function mountainSprite(state: GameState): HTMLCanvasElement | null {
  if (mountainImage !== null) {
    return mountainImage;
  }
  const span = (MOUNTAIN.radius + MOUNTAIN_EDGE) * 2;
  const wide = span * MOUNTAIN_GRAIN;
  const sheet = document.createElement("canvas");
  sheet.width = wide;
  sheet.height = wide;
  const paint = sheet.getContext("2d");
  if (paint === null) {
    return null;
  }
  const shot = paint.createImageData(wide, wide);
  const from = {
    x: MOUNTAIN.x - MOUNTAIN.radius - MOUNTAIN_EDGE,
    y: MOUNTAIN.y - MOUNTAIN.radius - MOUNTAIN_EDGE,
  };
  // The height of every pixel first, once. The shading needs the height of the
  // four points round each pixel as well, and working those out again on the
  // spot is the same sum five times over - which for a hill this size is ten
  // million sines and a visible stutter the first time one drives past it.
  const field = new Float32Array(wide * wide);
  for (let down = 0; down < wide; down += 1) {
    for (let across = 0; across < wide; across += 1) {
      field[down * wide + across] = heightAt(
        from.x + across / MOUNTAIN_GRAIN,
        from.y + down / MOUNTAIN_GRAIN,
      );
    }
  }
  const step = Math.max(1, Math.round(SLOPE_STEP * MOUNTAIN_GRAIN));
  const height = (across: number, down: number): number =>
    field[
      Math.min(wide - 1, Math.max(0, down)) * wide +
        Math.min(wide - 1, Math.max(0, across))
    ] ?? 0;
  for (let down = 0; down < wide; down += 1) {
    for (let across = 0; across < wide; across += 1) {
      const col = from.x + across / MOUNTAIN_GRAIN;
      const row = from.y + down / MOUNTAIN_GRAIN;
      const stone = stoneAt(state, col, row);
      const at = (down * wide + across) * PIXEL_PARTS;
      if (stone > 0) {
        const high = height(across, down) * stone;
        // The tilt of this patch of hillside, against a light from over the
        // left shoulder. The steeper the slope faces away, the darker it goes.
        // Read over a quarter of a square rather than from one pixel to the
        // next: what is wanted is the lie of the slope, not the difference
        // between two grains of it.
        const nx = height(across - step, down) - height(across + step, down);
        const ny = height(across, down - step) - height(across, down + step);
        const lit = Math.max(
          0,
          Math.min(1, HALF_LIT + (nx * LIGHT_X + ny * LIGHT_Y) * LIGHT_GAIN),
        );
        const tint = rockTint(high);
        // A little grain on top of the shading. Stone is not a smooth surface,
        // and without it the lit side of a slope is a wash.
        const grain = 1 + (spread(across, down) - HALF_TILE) * ROCK_GRAIN;
        const shade = (DARKEST + lit * (BRIGHTEST - DARKEST)) * grain;
        shot.data[at] = Math.min(FULL, tint.red * shade);
        shot.data[at + 1] = Math.min(FULL, tint.green * shade);
        shot.data[at + 2] = Math.min(FULL, tint.blue * shade);
        shot.data[at + 3] = Math.round(stone * FULL);
      } else {
        shot.data[at + 3] = 0;
      }
    }
  }
  paint.putImageData(shot, 0, 0);
  mountainImage = sheet;
  return sheet;
}

/** How many numbers one pixel of an image takes. */
const PIXEL_PARTS = 4;

/** The largest a colour goes. */
const FULL = 255;

/** How lit a flat patch of ground is, before any slope is counted. */
const HALF_LIT = 0.5;

/** Where the light comes from, across. */
const LIGHT_X = -0.7;

/** And down. */
const LIGHT_Y = -0.7;

/** How hard the slope is read: the whole of how craggy the hill looks. */
const LIGHT_GAIN = 9;

/** How much the stone speckles, as a share of its brightness. */
const ROCK_GRAIN = 0.11;

/** How dark the shaded side goes. */
const DARKEST = 0.58;

/** And how pale the lit side. */
const BRIGHTEST = 1.22;

/**
 * How much of a square is stone, smoothed between square centres.
 *
 * @param state - the city
 * @param col - the point, in squares
 * @param row - the point, in squares
 * @returns nothing off the rock, one well inside it, and a slope between
 * @remarks
 * Read from the floor rather than from the circle the floor was laid from, so
 * that whatever cuts into the stone - the track up it, a road round its foot -
 * cuts into the picture as well. Smoothed, because the floor is squares of
 * forty eight pixels and a mountain with a staircase for an outline is a
 * mountain nobody believes.
 */
function stoneAt(state: GameState, col: number, row: number): number {
  const left = Math.floor(col - HALF_TILE);
  const top = Math.floor(row - HALF_TILE);
  const alongX = col - HALF_TILE - left;
  const alongY = row - HALF_TILE - top;
  const rock = (x: number, y: number): number =>
    cellUnder(state.cells, x * TILE + TILE / 2, y * TILE + TILE / 2) === "rock"
      ? 1
      : 0;
  const upper = rock(left, top) * (1 - alongX) + rock(left + 1, top) * alongX;
  const lower =
    rock(left, top + 1) * (1 - alongX) + rock(left + 1, top + 1) * alongX;
  return upper * (1 - alongY) + lower * alongY;
}

/**
 * How high the hill stands at a point, from nothing at the foot to one at the
 * top.
 *
 * @param col - the point, in squares
 * @param row - the point, in squares
 * @returns the height, roughly between zero and one
 * @remarks
 * A cone, with ridges running down it and two octaves of noise on top. The
 * ridges are what make one side of a hill different from the other; the noise
 * is what stops the slope from being a smooth funnel.
 */
function heightAt(col: number, row: number): number {
  const acrossFrom = col - MOUNTAIN.x;
  const downFrom = row - MOUNTAIN.y;
  const away = Math.hypot(acrossFrom, downFrom) / MOUNTAIN.radius;
  const cone = Math.max(0, 1 - away);
  const turn = Math.atan2(downFrom, acrossFrom);
  // The ridges grow with the radius, and that is not a matter of taste. A wave
  // that goes round the hill has a slope of its own size divided by the
  // distance from the middle - so held at full height it is infinitely steep at
  // the summit, and the shading drew a starburst there. Fading it in from the
  // top outwards makes the slope of the wave roughly the same all the way down.
  const ridges =
    Math.sin(turn * RIDGES + Math.cos(turn * (RIDGES + 1))) *
    RIDGE_DEEP *
    Math.min(1, away);
  const rough =
    bumps(col * ROUGH_ONE, row * ROUGH_ONE) * ROUGH_DEEP +
    bumps(col * ROUGH_TWO, row * ROUGH_TWO) * (ROUGH_DEEP / 2) +
    bumps(col * ROUGH_THREE, row * ROUGH_THREE) * (ROUGH_DEEP / 4);
  return Math.max(0, cone * cone * (1 + ridges) + cone * rough);
}

/** How far apart the two points a slope is measured from are, in squares. */
const SLOPE_STEP = 0.25;

/** How many ridges run down the hill. */
const RIDGES = 5;

/** How deep the gullies between them are. */
const RIDGE_DEEP = 0.3;

/** How coarse the first layer of roughness is. */
const ROUGH_ONE = 0.3;

/** And the second, which is finer. */
const ROUGH_TWO = 0.85;

/** And a third, which is the gravel. */
const ROUGH_THREE = 2.2;

/** How much roughness there is at all. */
const ROUGH_DEEP = 0.14;

/** Smooth noise: the corner hash, interpolated. */
function bumps(x: number, y: number): number {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const alongX = smoothed(x - left);
  const alongY = smoothed(y - top);
  const upper =
    spread(left, top) * (1 - alongX) + spread(left + 1, top) * alongX;
  const lower =
    spread(left, top + 1) * (1 - alongX) + spread(left + 1, top + 1) * alongX;
  return upper * (1 - alongY) + lower * alongY - HALF_TILE;
}

/** An S curve, so the noise has no creases along the lattice. */
function smoothed(along: number): number {
  return along * along * (3 - 2 * along);
}

/**
 * What the rock is made of at a given height.
 *
 * @param high - how far up the hill, from nothing to one
 * @returns the colour of the ground there
 * @remarks
 * Mixed between the bands rather than stepped through them. Stepped, the
 * roughness carries whole patches of hillside over a boundary at once and the
 * hill comes out in flat islands of colour, which is a contour map again.
 */
function rockTint(high: number): {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
} {
  const last = ROCK_BANDS.length - 1;
  const along = Math.max(0, Math.min(1, high)) * last;
  const step = Math.min(last - 1, Math.floor(along));
  const into = along - step;
  const from = ROCK_BANDS[step] ?? ROCK_BANDS[0];
  const to = ROCK_BANDS[step + 1] ?? from;
  return from === undefined || to === undefined
    ? { red: 0, green: 0, blue: 0 }
    : {
        red: from.red + (to.red - from.red) * into,
        green: from.green + (to.green - from.green) * into,
        blue: from.blue + (to.blue - from.blue) * into,
      };
}

/**
 * The rock, in bands from the foot to the summit.
 *
 * @remarks
 * Earth and scree at the bottom, stone in the middle, bare pale rock at the
 * top. Bands rather than a gradient, because a hillside is made of different
 * stuff at different heights and the lines between them are what says so.
 */
const ROCK_BANDS: readonly {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}[] = [
  { red: 104, green: 92, blue: 66 },
  { red: 120, green: 108, blue: 86 },
  { red: 132, green: 122, blue: 106 },
  { red: 150, green: 142, blue: 128 },
  { red: 174, green: 167, blue: 154 },
  { red: 208, green: 202, blue: 190 },
];

/** One boulder on the mountain, where the scatter said there is one. */
function drawBoulder(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, (col + 0.5) * TILE, (row + 0.5) * TILE, 6);
  ctx.fillStyle = "#5b5349";
  ctx.beginPath();
  ctx.ellipse(at.x, at.y, TILE * 0.17, TILE * 0.13, 0, 0, TURN);
  ctx.fill();
}

/** One square of a ploughed field: the furrows across it. */
function drawFurrows(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * TILE, row * TILE);
  // Which way the plough went is a property of the field, not of the square,
  // so it comes out of the field's own corner and every square agrees.
  const field = FIELDS.find(
    (one) =>
      col >= one.left &&
      col <= one.right &&
      row >= one.top &&
      row <= one.bottom,
  );
  const down = field !== undefined && (field.left + field.top) % 2 === 0;
  ctx.save();
  ctx.strokeStyle = "rgba(90,66,28,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let line = 1; line < FURROWS; line += 1) {
    const part = line / FURROWS;
    if (down) {
      ctx.moveTo(at.x + part * TILE, at.y);
      ctx.lineTo(at.x + part * TILE, at.y + TILE * DEPTH);
    } else {
      ctx.moveTo(at.x, at.y + part * TILE * DEPTH);
      ctx.lineTo(at.x + TILE, at.y + part * TILE * DEPTH);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** How many furrows are drawn across one square of field. */
const FURROWS = 4;

/**
 * Whether a tree here would keep its branches off the tarmac.
 *
 * @param cells - the city floor
 * @param col - the square, across
 * @param row - the square, down
 * @returns true only where the ground all round is green as well
 * @remarks
 * A tree is drawn a third of a square wide, thrown about within its square and
 * lifted a good half square up the screen for its height - so a tree on the
 * last square of a wood hangs out over whatever is next to it, and what was
 * next to it was usually a road. Trees grow where the landscape is green; the
 * edge of a wood is where they stop.
 */
function rooted(cells: readonly Cell[], col: number, row: number): boolean {
  return AROUND.every((step) =>
    GREEN_GROUND.has(
      cellUnder(cells, (col + step.x) * TILE, (row + step.y) * TILE),
    ),
  );
}

/** The four squares a tree could lean over. */
const AROUND: readonly Vec[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

/** What counts as landscape rather than as town. */
const GREEN_GROUND = new Set<Cell>(["forest", "park", "field", "sand", "dirt"]);

/**
 * The traffic lights on the approaches to a junction, from above.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param time - the clock, which is what the lights run on
 * @param col - the square, across
 * @param row - the square, down
 * @remarks
 * Asked of every square of road on the screen rather than kept in a list:
 * a square that is not a junction but touches one is an approach, and an
 * approach gets a stop line and a lamp on the kerb beside it. There is nothing
 * to store and nothing to keep in step with the map.
 *
 * The lamp is on the driver right, where a lamp is, and the stop line is
 * white, because a stop line is - the colour that matters is in the lamp.
 */
function drawSignals(
  ctx: CanvasRenderingContext2D,
  view: View,
  state: GameState,
  col: number,
  row: number,
): void {
  const junction = lightAt(col, row);
  for (const way of APPROACHES) {
    if (!junction && lightAt(col + way.x, row + way.y)) {
      const upright = way.y !== 0;
      const colour = lightColour(state.time, upright);
      // The lamp stands on the kerb to the driver right, and there is one of
      // it - not one per lane. The stop line is the thing that runs the whole
      // width of the road.
      const kerb =
        cellUnder(
          state.cells,
          (col - way.y + HALF_TILE) * TILE,
          (row + way.x + HALF_TILE) * TILE,
        ) !== "road";
      const middle = project(
        view,
        (col + HALF_TILE + way.x * STOP_LINE) * TILE,
        (row + HALF_TILE + way.y * STOP_LINE) * TILE,
      );
      ctx.save();
      ctx.translate(middle.x, middle.y);
      ctx.scale(1, DEPTH);
      ctx.rotate(Math.atan2(way.y, way.x));
      // The line across the road, and the lamp on the kerb to the right of it.
      ctx.fillStyle = "#e7e5e4";
      ctx.fillRect(-STOP_THICK / 2, -TILE / 2, STOP_THICK, TILE);
      if (kerb) {
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(-LAMP_BOX / 2, TILE / 2, LAMP_BOX, LAMP_BOX);
        ctx.fillStyle = LIGHT_BULBS[colour];
        ctx.beginPath();
        ctx.arc(0, TILE / 2 + LAMP_BOX / 2, LAMP_DOT, 0, TURN);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

/** The four squares a junction could be in from here. */
const APPROACHES: readonly Vec[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

/** What each of the three shows. */
const LIGHT_BULBS: Readonly<Record<LightColour, string>> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

/** How far from the middle of the square the stop line is, in squares. */
const STOP_LINE = 0.42;

/** How thick that line is, in pixels. */
const STOP_THICK = 3;

/** How big the lamp on the kerb is, in pixels. */
const LAMP_BOX = 9;

/** And the lit part of it. */
const LAMP_DOT = 2.6;

/**
 * The bays painted on the supermarket car parks in view.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param fromCol - the leftmost square in view
 * @param fromRow - the topmost
 * @param toCol - the rightmost
 * @param toRow - the bottom one
 * @remarks
 * What makes a square of concrete read as a car park is the white lines on it.
 * They are painted per block rather than per square, because a bay is wider
 * than a square and two of them do not line up with the grid.
 */
function drawCarParks(
  ctx: CanvasRenderingContext2D,
  view: View,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
): void {
  const span = BLOCK_TILES;
  ctx.strokeStyle = "#d6d3d1";
  ctx.lineWidth = 1.5;
  for (
    let blockY = Math.floor(fromRow / span);
    blockY <= Math.floor(toRow / span);
    blockY += 1
  ) {
    for (
      let blockX = Math.floor(fromCol / span);
      blockX <= Math.floor(toCol / span);
      blockX += 1
    ) {
      const lot = carPark(blockX, blockY);
      if (lot !== null) {
        const plot = builtPlot(blockX, blockY);
        ctx.beginPath();
        for (let row = lot.top; row < lot.bottom; row += 1) {
          for (let col = lot.left; col < lot.right; col += 1) {
            const inside =
              col >= plot.left &&
              col < plot.right &&
              row >= plot.top &&
              row < plot.bottom;
            // One line between one bay and the next. The bays run along the
            // ring, so the line across a bay lies the other way round on the
            // sides of the shop than it does at the front.
            if (!inside) {
              const upright = col < plot.left || col >= plot.right;
              const from = project(
                view,
                col * TILE + (upright ? BAY_EDGE : 0),
                row * TILE + (upright ? 0 : BAY_EDGE),
              );
              const to = project(
                view,
                (col + (upright ? 1 : 0)) * TILE - (upright ? BAY_EDGE : 0),
                (row + (upright ? 0 : 1)) * TILE - (upright ? 0 : BAY_EDGE),
              );
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
            }
          }
        }
        ctx.stroke();
      }
    }
  }
}

/** How far the lines stop short of the edge of the tarmac, in pixels. */
const BAY_EDGE = 6;

/** One tree, where the wood said there is one. */
function drawTree(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const jitter = spread(col + 7, row + 3);
  const x = (col + 0.2 + jitter * 0.6) * TILE;
  const y = (row + 0.2 + spread(col + 1, row + 9) * 0.6) * TILE;
  const wide = TILE * (0.17 + jitter * 0.13);
  const foot = project(view, x, y);
  const at = project(view, x, y, TREE_HIGH);
  // The shadow on the ground, then the trunk standing in it, then the crown on
  // top. Three things at three heights, which is the same rule everything else
  // in this picture follows - and the reason a tree now reads as standing up
  // rather than as a green circle lying on the grass.
  const shade = ctx.createRadialGradient(
    foot.x,
    foot.y,
    0,
    foot.x,
    foot.y,
    wide,
  );
  shade.addColorStop(0, "rgba(12,32,14,0.42)");
  shade.addColorStop(0.65, "rgba(12,32,14,0.3)");
  shade.addColorStop(1, "rgba(12,32,14,0)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y, wide, wide * DEPTH, 0, 0, TURN);
  ctx.fill();
  ctx.strokeStyle = "#4a3524";
  ctx.lineWidth = Math.max(1.8, wide * 0.22);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(at.x, at.y + wide * 0.2);
  ctx.stroke();
  const sheet = treeSprite(Math.floor(jitter * TREE_SORTS) % TREE_SORTS);
  if (sheet !== null) {
    const span = wide * 2 * TREE_OVER;
    ctx.drawImage(sheet, at.x - span / 2, at.y - span / 2, span, span);
  }
}

/** How many different trees there are. */
const TREE_SORTS = 4;

/** How far the picture reaches past the width the wood asked for. */
const TREE_OVER = 1.15;

/** The crowns, drawn once each. */
const TREE_SHEETS: (HTMLCanvasElement | null)[] = [];

/**
 * One sort of treetop, as a picture.
 *
 * @param sort - which of them
 * @returns the picture, or null where the browser gives no canvas
 * @remarks
 * Cached like everything else that is drawn more than once: a wood is
 * thousands of trees, and building a crown out of a dozen blobs on every frame
 * for every one of them would cost more than the rest of the picture put
 * together. Four sorts is enough - past that nobody counts, and the wood has
 * its own scatter in where they stand and how big they are.
 */
function treeSprite(sort: number): HTMLCanvasElement | null {
  const known = TREE_SHEETS[sort];
  if (known !== undefined) {
    return known;
  }
  const sheet = document.createElement("canvas");
  sheet.width = TREE_GRAIN;
  sheet.height = TREE_GRAIN;
  const paint = sheet.getContext("2d");
  const made = paint === null ? null : sheet;
  if (paint !== null) {
    paint.translate(TREE_GRAIN / 2, TREE_GRAIN / 2);
    paint.scale(TREE_GRAIN / 2, TREE_GRAIN / 2);
    paintCrown(paint, sort);
  }
  TREE_SHEETS[sort] = made;
  return made;
}

/** How many pixels across one crown picture is. */
const TREE_GRAIN = 96;

/**
 * A treetop seen from above.
 *
 * @param ctx - what to paint on, scaled so the crown is one across
 * @param sort - which of the four
 * @remarks
 * A tree from above is not a disc, it is a heap of clumps: the light catches
 * the top of each one and the gaps between them go almost black. So that is
 * what this draws - an uneven outline, then a dozen clumps of leaves over it,
 * lighter the further towards the light they sit. The dark side is the same
 * side for every tree in the city, which is what makes a wood look lit rather
 * than speckled.
 */
function paintCrown(ctx: CanvasRenderingContext2D, sort: number): void {
  const look = TREE_LOOKS[sort] ?? TREE_LOOKS[0];
  if (look === undefined) {
    return;
  }
  // The outline: a circle pushed in and out, so no two trees are the same
  // round blob and none of them has a compass edge.
  ctx.beginPath();
  for (let step = 0; step <= TREE_EDGES; step += 1) {
    const turn = (step / TREE_EDGES) * TURN;
    const out =
      1 - look.ragged * (0.5 + 0.5 * Math.sin(turn * look.lobes + look.turn));
    const spot = { x: Math.cos(turn) * out, y: Math.sin(turn) * out * 0.94 };
    if (step === 0) {
      ctx.moveTo(spot.x, spot.y);
    } else {
      ctx.lineTo(spot.x, spot.y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = look.dark;
  ctx.fill();
  // The clumps. Their middles sit on two rings, and how light each one is
  // depends on how far towards the light it stands.
  for (let clump = 0; clump < TREE_CLUMPS; clump += 1) {
    const turn = (clump / TREE_CLUMPS) * TURN + look.turn;
    const out = clump % 2 === 0 ? 0.44 : 0.2;
    const spot = { x: Math.cos(turn) * out, y: Math.sin(turn) * out };
    const lit = (spot.x * -1 + spot.y * -1) / 1.4;
    ctx.fillStyle = lit > 0.16 ? look.light : lit > -0.1 ? look.mid : look.dark;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, look.clump, look.clump * 0.9, turn, 0, TURN);
    ctx.fill();
  }
  // And the one bright clump at the very top of the tree.
  ctx.fillStyle = look.top;
  ctx.beginPath();
  ctx.ellipse(-0.1, -0.13, look.clump * 0.62, look.clump * 0.55, 0, 0, TURN);
  ctx.fill();
}

/** How many straight bits the wobbly outline of a crown is made of. */
const TREE_EDGES = 36;

/** And how many clumps of leaves sit on it. */
const TREE_CLUMPS = 9;

/** One sort of tree: its greens and how ragged it is. */
type TreeLook = {
  readonly dark: string;
  readonly mid: string;
  readonly light: string;
  readonly top: string;
  /** How deeply the outline is notched, as a share of the radius. */
  readonly ragged: number;
  /** How many notches go round it. */
  readonly lobes: number;
  /** Which way the whole thing is turned. */
  readonly turn: number;
  /** How big one clump of leaves is. */
  readonly clump: number;
};

/**
 * The four of them.
 *
 * @remarks
 * Two broadleaves, a pine and a scrubby one. What tells them apart at this
 * size is not the shape of a leaf - it is the green, how deeply the outline is
 * notched and how big the clumps are: a pine is dark, nearly round and finely
 * broken up, a poplar is light and lumpy.
 */
const TREE_LOOKS: readonly TreeLook[] = [
  {
    dark: "#1c4722",
    mid: "#2a6b2c",
    light: "#3d8a3a",
    top: "#59a64a",
    ragged: 0.18,
    lobes: 5,
    turn: 0.4,
    clump: 0.42,
  },
  {
    dark: "#17351a",
    mid: "#1f4d22",
    light: "#2d6b2c",
    top: "#3f8437",
    ragged: 0.1,
    lobes: 9,
    turn: 1.9,
    clump: 0.3,
  },
  {
    dark: "#22521f",
    mid: "#357a2c",
    light: "#4e9a3c",
    top: "#6fb84e",
    ragged: 0.24,
    lobes: 4,
    turn: 2.8,
    clump: 0.46,
  },
  {
    dark: "#1a3d1c",
    mid: "#285c26",
    light: "#3a7d33",
    top: "#4f9640",
    ragged: 0.14,
    lobes: 7,
    turn: 0.9,
    clump: 0.36,
  },
];

/**
 * How high a treetop sits over the ground it grows out of.
 *
 * @remarks
 * Low enough that the trunk under it reads as a trunk. At twenty six the crown
 * floated a long way above its own shadow and the tree looked like a lollipop.
 */
const TREE_HIGH = 17;

/** How many squares of wood actually have a tree drawn on them. */
const TREE_SHARE = 0.62;

/** A whole circle, which this file needs rather a lot of. */
const TURN = Math.PI * 2;

/**
 * The military base: three sheds inside the wire, four launchers outside it.
 *
 * @remarks
 * The sheds are walls in the floor plan like any house, but they belong to no
 * city block, so nothing deals them a roof - this does. The launchers are the
 * other way round: no wall at all, and they still decide whether the flight
 * over the base is a good idea.
 */
function drawBase(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  for (const hut of BASE_HUTS) {
    const across = (hut.right - hut.left + 1) * TILE;
    const deep = (hut.bottom - hut.top + 1) * TILE;
    const at = project(view, hut.left * TILE, hut.top * TILE, HUT_HIGH);
    // The front wall, then the roof over it: two rectangles, which at this
    // tilt is all a flat-roofed shed is.
    ctx.fillStyle = "#556b2f";
    ctx.fillRect(at.x, at.y + deep * DEPTH, across, HUT_HIGH);
    ctx.fillStyle = "#6b7f3a";
    ctx.fillRect(at.x, at.y, across, deep * DEPTH);
    ctx.strokeStyle = "#3f4f22";
    ctx.lineWidth = 2;
    ctx.strokeRect(at.x, at.y, across, deep * DEPTH);
    // A door on the front, so that a shed reads as a building rather than a
    // green rectangle somebody forgot to finish.
    ctx.fillStyle = "#3f4f22";
    ctx.fillRect(
      at.x + across / 2 - TILE * 0.6,
      at.y + deep * DEPTH,
      TILE * 1.2,
      HUT_HIGH,
    );
  }
  for (const site of state.acks) {
    drawAck(ctx, view, site, state);
  }
  drawFarms(ctx, view);
  drawMountain(ctx, state, view);
}

/**
 * The barns and farmhouses of the north-west.
 *
 * @remarks
 * Same trick as the sheds on the military base: they are walls in the floor
 * plan and belong to no city block, so the roof is painted here. Red boards
 * and a dark roof, because that is what a barn looks like from the air even to
 * somebody who has never seen one.
 */
function drawFarms(ctx: CanvasRenderingContext2D, view: View): void {
  for (const farm of FARMS) {
    const across = (farm.right - farm.left + 1) * TILE;
    const deep = (farm.bottom - farm.top + 1) * TILE;
    const at = project(view, farm.left * TILE, farm.top * TILE, BARN_HIGH);
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(at.x, at.y + deep * DEPTH, across, BARN_HIGH);
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(at.x, at.y, across, deep * DEPTH);
    ctx.strokeStyle = "#450a0a";
    ctx.lineWidth = 2;
    ctx.strokeRect(at.x, at.y, across, deep * DEPTH);
    // The ridge down the middle of the roof, and the doors on the front.
    ctx.strokeStyle = "#f5f5f4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(at.x, at.y + (deep * DEPTH) / 2);
    ctx.lineTo(at.x + across, at.y + (deep * DEPTH) / 2);
    ctx.stroke();
    ctx.fillStyle = "#292524";
    ctx.fillRect(
      at.x + across / 2 - TILE * 0.7,
      at.y + deep * DEPTH,
      TILE * 1.4,
      BARN_HIGH,
    );
  }
}

/** How tall a barn stands, in pixels. */
const BARN_HIGH = 40;

/** How tall a shed on the base stands, in pixels. */
const HUT_HIGH = 34;

/**
 * One anti-aircraft launcher.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param site - where it stands, in squares
 * @param state - the city, for what the barrels are pointing at
 */
function drawAck(
  ctx: CanvasRenderingContext2D,
  view: View,
  site: Ack,
  state: GameState,
): void {
  const at = { x: site.x, y: site.y };
  const wrecked = site.backAt !== null;
  const up = state.player.height >= ACK_FLOOR && !wrecked;
  const aim = up
    ? Math.atan2(state.player.y - at.y, state.player.x - at.x)
    : -Math.PI / 2;
  const spot = project(view, at.x, at.y, 10);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  // The concrete it stands on.
  ctx.fillStyle = "#a8a29e";
  ctx.beginPath();
  ctx.arc(0, 0, TILE * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(aim);
  // A wreck is drawn burnt rather than left out: the crater is what says the
  // gun is off the board, and how long for.
  ctx.globalAlpha = wrecked ? 0.9 : 1;
  // The tracked carriage.
  ctx.fillStyle = wrecked ? "#292524" : "#3f4f22";
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 1.6;
  const hull = new Path2D();
  hull.roundRect(-16, -12, 30, 24, 3);
  ctx.fill(hull);
  ctx.stroke(hull);
  // The box of missiles, and the four tubes out of the front of it.
  ctx.fillStyle = wrecked ? "#1c1917" : "#4b5320";
  const box = new Path2D();
  box.roundRect(-6, -9, 16, 18, 2);
  ctx.fill(box);
  ctx.stroke(box);
  ctx.fillStyle = "#1c1917";
  for (const tube of [-6, -2, 2, 6]) {
    ctx.fillRect(8, tube - 1.2, 16, 2.4);
  }
  // And the dish on the back, which is what makes it a system rather than a
  // gun: it is looking at you.
  ctx.fillStyle = wrecked ? "#57534e" : "#d6d3d1";
  ctx.beginPath();
  ctx.ellipse(-12, 0, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // What is left of one: a bar of how much bodywork it still has, and smoke.
  if (!wrecked && site.health < ACK_HEALTH) {
    ctx.rotate(-aim);
    ctx.fillStyle = "#450a0a";
    ctx.fillRect(-14, -20, 28, 4);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(-14, -20, 28 * (site.health / ACK_HEALTH), 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** The white dashes down the middle of the strip. */
function drawRunway(ctx: CanvasRenderingContext2D, view: View): void {
  const middle = ((RUNWAY.top + RUNWAY.bottom + 1) / 2) * TILE;
  ctx.save();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 22]);
  ctx.beginPath();
  line(
    ctx,
    project(view, (RUNWAY.left + 1) * TILE, middle),
    project(view, RUNWAY.right * TILE, middle),
  );
  ctx.stroke();
  ctx.restore();
}

/** The boats tied up along the piers of the harbour. */
function drawBoats(ctx: CanvasRenderingContext2D, view: View): void {
  for (const pier of PIERS) {
    for (let at = 0; at < BOATS_PER_PIER; at += 1) {
      const x = (pier.right - 1 - at * 1.8) * TILE;
      const y = (pier.bottom + 1.2) * TILE;
      drawBoat(ctx, view, { x, y }, spread(pier.left + at, pier.top));
    }
  }
}

/** How many lie along each of them. */
const BOATS_PER_PIER = 3;

/** One of them: a hull, a deck and a little wheelhouse. */
function drawBoat(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  tint: number,
): void {
  const long = TILE * 1.25;
  const wide = TILE * 0.45;
  const spot = project(view, at.x, at.y, 6);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.fillStyle = tint > 0.5 ? "#e2e8f0" : "#cbd5f5";
  ctx.beginPath();
  ctx.moveTo(-long / 2, -wide / 2);
  ctx.lineTo(long / 2 - wide * 0.6, -wide / 2);
  ctx.lineTo(long / 2, 0);
  ctx.lineTo(long / 2 - wide * 0.6, wide / 2);
  ctx.lineTo(-long / 2, wide / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tint > 0.5 ? "#1d4ed8" : "#b91c1c";
  ctx.fillRect(-long * 0.34, -wide * 0.28, long * 0.3, wide * 0.56);
  ctx.restore();
}

/**
 * A number between nought and one that is always the same for a square.
 *
 * @param across - the square, across
 * @param down - the square, down
 * @returns the scatter of the trees and the colour of the boats
 */
function spread(across: number, down: number): number {
  const mixed = Math.sin(across * 12.9898 + down * 78.233) * 43758.5453;
  return mixed - Math.floor(mixed);
}

/** Where the gun shops are - the city is fixed, so this is worked out once. */
const SHOP_DOORS = doorsOf("guns");

/** And the bank. There is one. */
const BANK_DOORS = doorsOf("bank");

/** And the printing works, of which there is also exactly one. */
const MINT_DOORS = doorsOf("mint");

/** One leg of a path, from screen point to screen point. */
function line(ctx: CanvasRenderingContext2D, from: Screen, to: Screen): void {
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
}

/** The job markers and the spray shop, flat on the road. */
function drawMarkers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  const job = state.job;
  if (job !== null) {
    const at = job.loaded ? job.to : job.from;
    marker(ctx, at, view, job.loaded ? "#22c55e" : "#facc15");
  }
  // The two counters in the city are marked wherever one is in sight: a shop
  // one cannot find is a shop that is not there.
  for (const door of SHOP_DOORS) {
    marker(ctx, door, view, "#f59e0b");
  }
  for (const door of BANK_DOORS) {
    marker(ctx, door, view, "#38bdf8");
  }
  for (const door of MINT_DOORS) {
    marker(ctx, door, view, "#eab308");
  }
  drawGarage(ctx, state, view);
}

/**
 * The player's own garage: an apron on the road and a door in the wall.
 *
 * @remarks
 * Not a ring on the tarmac like the job markers. This is a place rather than a
 * destination - it is a house that belongs to you, and a house with a garage
 * looks like a house with a garage. The door shuts behind whoever drives in
 * and stands shut while the work is done, which is the only sign the player
 * gets that anything happened besides the line in the log.
 */
function drawGarage(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  for (const garage of state.garages) {
    drawOneGarage(ctx, view, garage);
  }
}

/** The apron and the dark bay of one of the three houses. */
function drawOneGarage(
  ctx: CanvasRenderingContext2D,
  view: View,
  garage: Vec,
): void {
  const spot = project(view, garage.x, garage.y);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  // The concrete apron in front of it, edged in the same blue the map marks
  // the house with, so that the way in is obvious from a moving car.
  ctx.fillStyle = "#94a3b8";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(-GARAGE_WIDE / 2, -GARAGE_DEEP / 2, GARAGE_WIDE, GARAGE_DEEP);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // And the floor of the bay itself, which is the square of the house one
  // drives into: dark, because that is what the inside of a garage looks like
  // from the street once the door is up.
  const bay = project(view, garage.x, garageBay(garage).y);
  ctx.save();
  ctx.translate(bay.x, bay.y);
  ctx.scale(1, DEPTH);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(-TILE / 2, -TILE / 2, TILE, TILE * 2);
  ctx.restore();
}

/**
 * The door of the garage, standing in the wall of the house.
 *
 * @param ctx - what to paint on
 * @param state - the game, for where the door is and whether it is up
 * @param view - the camera
 * @remarks
 * Drawn with the scene rather than with the markings on the road, and **after**
 * the house it sits in: a door painted before the wall is a door one can see
 * the windows through. It is solid in both senses - while it is down the square
 * behind it is part of the house, and the car shut in there is behind it.
 */
export function drawGarageDoor(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  at: number,
): void {
  const garage = state.garages[at];
  if (garage !== undefined) {
    const mouth = project(view, garage.x, garageMouth(garage).y + TILE / 2);
    ctx.save();
    ctx.translate(mouth.x, mouth.y);
    garageDoor(ctx, state.garageOpen === at);
    ctx.restore();
  }
}

/** Where one of the doors stands, for the depth sort. */
export function garageDoorDepth(state: GameState, at: number): number {
  const garage = state.garages[at];
  return garage === undefined ? 0 : garageMouth(garage).y + TILE / 2;
}

/**
 * The door itself, standing in the wall at the back of the apron.
 *
 * @param open - true while it is rolled up
 * @remarks
 * A roller door: a frame, and inside it either the slats or the dark of the
 * garage with the rolled-up door as a bar across the top. The frame stays
 * whatever it does, so that the place still reads as a garage from across the
 * street with the door shut.
 *
 * Drawn in screen pixels straight up from the point it is given, because the
 * one thing this has to say is how tall it is: it is the door of a building,
 * and next to a car it should look like one.
 */
function garageDoor(ctx: CanvasRenderingContext2D, open: boolean): void {
  const top = -GARAGE_DOOR;
  const wide = GARAGE_WIDE;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#78716c";
  ctx.fillRect(-wide / 2 - 3, top - 3, wide + 6, GARAGE_DOOR + 6);
  ctx.strokeRect(-wide / 2 - 3, top - 3, wide + 6, GARAGE_DOOR + 6);
  if (open) {
    // The way in, and the door itself rolled into the lintel above it.
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-wide / 2, top, wide, GARAGE_DOOR);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-wide / 2, top, wide, GARAGE_ROLL);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.strokeRect(-wide / 2, top, wide, GARAGE_ROLL);
  } else {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-wide / 2, top, wide, GARAGE_DOOR);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let slat = 1; slat < GARAGE_SLATS; slat += 1) {
      const y = top + (slat / GARAGE_SLATS) * GARAGE_DOOR;
      ctx.moveTo(-wide / 2, y);
      ctx.lineTo(wide / 2, y);
    }
    ctx.stroke();
    // A handle, so that a shut door is a door and not a wall.
    ctx.fillStyle = "#64748b";
    ctx.fillRect(-5, top + GARAGE_DOOR - 7, 10, 2.4);
  }
}

/** How thick the rolled-up door is above the opening. */
const GARAGE_ROLL = 7;

/** How wide the garage apron is, in pixels. */
const GARAGE_WIDE = 54;

/** How far it reaches out into the street. */
const GARAGE_DEEP = 34;

/**
 * And how high the door itself stands, in screen pixels.
 *
 * @remarks
 * Higher than a car and about as high as the wall of a house, because it is
 * one. What it was before - a dozen pixels squashed into the ground plane -
 * was the right size for a letterbox.
 */
const GARAGE_DOOR = 38;

/** How many slats the shut door has. */
const GARAGE_SLATS = 6;

/** The mark for a railway station on the map: a little carriage. */
function station(ctx: CanvasRenderingContext2D, spot: Screen): void {
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.fillStyle = "#fde68a";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.rect(-4.5, -3.5, 9, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-3, -2, 6, 2.4);
  ctx.restore();
}

/**
 * The mark for the player's own house on the map.
 *
 * @remarks
 * A little house rather than a dot, for the same reason the night club is a
 * glass: the two places worth driving to on purpose should be the two things
 * on the map that are not round.
 */
function home(ctx: CanvasRenderingContext2D, spot: Screen): void {
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.fillStyle = "#38bdf8";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(5, -1);
  ctx.lineTo(5, 5);
  ctx.lineTo(-5, 5);
  ctx.lineTo(-5, -1);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

/** One ring on the ground - an ellipse now, because the ground is tilted. */
function marker(
  ctx: CanvasRenderingContext2D,
  at: Vec,
  view: View,
  colour: string,
): void {
  const spot = project(view, at.x, at.y);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(spot.x, spot.y, 22, 22 * DEPTH, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Everything that stands up, painted from the back of the picture forwards.
 *
 * @remarks
 * The order is the whole trick of a tilted view: a car north of a house is
 * hidden by it, a car south of it drives past in front. Sorting by the front
 * edge of each thing gets that right for houses, cars and people alike without
 * anybody having to know about anybody else.
 */
function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
): void {
  const movers: Standing[] = [];
  for (const person of state.people) {
    if (inPicture(person, seen)) {
      movers.push({
        depth: person.y,
        at: person,
        paint: (fade) => drawPerson(ctx, person, view, state.time, fade),
      });
    }
  }
  for (const beast of state.animals) {
    if (inPicture(beast, seen)) {
      movers.push({
        depth: beast.y,
        at: beast,
        paint: (fade) => drawAnimal(ctx, beast, view, fade),
      });
    }
  }
  for (const cop of state.cops) {
    if (inPicture(cop, seen)) {
      movers.push({
        depth: cop.y,
        at: cop,
        paint: (fade) => drawCop(ctx, cop, view, state.time, fade),
      });
    }
  }
  const driven = carOf(state);
  for (const car of state.cars) {
    if (inPicture(car, seen)) {
      const mine = car.id === driven?.id;
      movers.push({
        depth: car.y,
        at: car,
        mine,
        paint: (fade) => drawCar(ctx, car, view, state.time, fade),
      });
    }
  }
  if (state.player.car === null && !state.player.flying) {
    movers.push({
      // Over the roofs he belongs in front of everything: the whole point of
      // being up there is seeing the block, and a roof painted over him would
      // make the flight look like a fall.
      depth:
        state.player.height >= ROOF_HEIGHT
          ? Number.MAX_SAFE_INTEGER
          : state.player.y,
      at: state.player,
      mine: true,
      paint: (fade) => drawWalker(ctx, state, view, fade),
    });
  }
  for (const tractor of state.cars) {
    const load =
      tractor.hitched === null
        ? undefined
        : state.cars.find((car) => car.id === tractor.hitched);
    if (load !== undefined) {
      movers.push({
        depth: (tractor.y + load.y) / 2,
        at: null,
        paint: () => drawTowBar(ctx, view, tractor, load),
      });
    }
  }
  for (const shot of state.bullets) {
    movers.push({
      depth: shot.y,
      at: null,
      paint: () => drawShot(ctx, shot, view),
    });
  }

  movers.push({
    depth: state.chopper.y,
    at: { x: state.chopper.x, y: state.chopper.y },
    mine: state.player.flying,
    paint: () => drawChopper(ctx, state, view),
  });
  // The train, before the list is read rather than after it: pushed in later
  // it was in no list at all, and a train nobody paints is a train nobody sees.
  for (const wagon of trainCars(state.train)) {
    movers.push({
      depth: wagon.at.y,
      at: wagon.at,
      paint: (fade) => drawWagon(ctx, view, wagon.at, wagon.angle, fade),
    });
  }

  // Anything a house could swallow: everything that moves, and the rings on
  // the road, which are just as easy to lose under a roof.
  const behind: readonly Standing[] = [...movers, ...ringsOf(ctx, state, view)];
  const houses = collectHouses(ctx, state, view, seen);
  const walls = houses.map((house) => house.wall);
  const standing: Standing[] = [
    ...movers,
    ...houses.map((house) => {
      const hiding = behind.filter(
        (thing) =>
          thing.at !== null &&
          thing.depth < house.wall.depth &&
          covers(house.wall, project(view, thing.at.x, thing.at.y, LOOK_AT)),
      );
      const fade = hiding.some((thing) => thing.mine === true)
        ? SEE_THROUGH_ME
        : hiding.length > 0
          ? SEE_THROUGH
          : 1;
      return {
        depth: house.wall.depth,
        at: null,
        paint: () => house.paint(fade),
      };
    }),
  ];
  // The garage doors: over the house each is cut into, under anything standing
  // in front of it. Half a pixel past the wall settles the order.
  state.garages.forEach((unused, at) => {
    standing.push({
      depth: garageDoorDepth(state, at) + DOOR_OVER,
      at: null,
      paint: () => drawGarageDoor(ctx, state, view, at),
    });
  });
  standing.sort((one, other) => one.depth - other.depth);
  for (const thing of standing) {
    thing.paint(1);
  }
  // And once more, over the roof, for whatever the house still swallowed. Two
  // halves of one answer: the house goes see-through so you can tell what is
  // going on around it, and what stands behind it comes back on top so you can
  // tell exactly where it is.
  for (const thing of behind) {
    if (
      thing.mine !== true &&
      thing.at !== null &&
      hidden(view, walls, thing.depth, thing.at)
    ) {
      thing.paint(GHOST);
    }
  }
  drawHeli(ctx, state, view);
  // And you, always, whether anything is in the way or not.
  //
  // No test decides this one. Being able to see where you are is not a nicety
  // that may fall through a gap in a rectangle check - it is the game. Painting
  // the figure twice when nothing covers it costs one draw and nothing else.
  const me = movers.find((thing) => thing.mine === true);
  if (me !== undefined && me.at !== null) {
    me.paint(1);
  }
  // With one exception: a shut door in front of one's own car. The rule above
  // paints the player over everything so that he is never lost - but a car in
  // a locked garage is not lost, it is inside, and a door one can see one's
  // own bonnet through is exactly what a door is not.
  const shutIn = state.garages.findIndex(
    (garage, at) => state.garageOpen !== at && inBay(state, garage),
  );
  if (shutIn >= 0) {
    drawGarageDoor(ctx, state, view, shutIn);
  }
}

/** Whether the player is in that garage rather than out in the street. */
function inBay(state: GameState, garage: Vec): boolean {
  const bay = garageBay(garage);
  return (
    Math.abs(state.player.x - bay.x) < TILE &&
    Math.abs(state.player.y - bay.y) < TILE &&
    state.player.y < garageMouth(garage).y + TILE / 2
  );
}

/** How far past the house wall the door is sorted, in world pixels. */
const DOOR_OVER = 0.5;

/**
 * One carriage, from above.
 *
 * @remarks
 * A long box with a dark roof and a window band down each side. It is drawn
 * flat on the rails rather than as a standing box like a car: a train at this
 * scale is a shape sliding along a line, and a tall box would hide half a
 * street every time one went past.
 */
function drawWagon(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  angle: number,
  fade: number,
): void {
  const spot = project(view, at.x, at.y);
  shadow(ctx, view, at, TRAIN_LONG / 2, TRAIN_WIDE / 2, angle, fade);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.rotate(angle);
  ctx.fillStyle = "#b91c1c";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  const body = new Path2D();
  body.roundRect(-TRAIN_LONG / 2, -TRAIN_WIDE / 2, TRAIN_LONG, TRAIN_WIDE, 4);
  ctx.fill(body);
  ctx.stroke(body);
  // The roof, and the windows along the flanks.
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(
    -TRAIN_LONG / 2 + 5,
    -TRAIN_WIDE / 2 + 4,
    TRAIN_LONG - 10,
    TRAIN_WIDE - 8,
  );
  ctx.fillStyle = "#1e293b";
  for (const side of [-1, 1]) {
    for (let at2 = -TRAIN_LONG / 2 + 8; at2 < TRAIN_LONG / 2 - 10; at2 += 9) {
      ctx.fillRect(at2, side * (TRAIN_WIDE / 2 - 3) - 1.5, 6, 3);
    }
  }
  ctx.restore();
}

/**
 * The police helicopter, well above the roofs.
 *
 * @remarks
 * Drawn after everything else and after the houses: nothing in this city is
 * taller than it is, so nothing can hide it. The shadow on the road is what
 * says how high it is - without one it would read as a very odd car.
 */
function drawHeli(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  const heli = state.heli;
  if (heli !== null) {
    // How much of the sky it has left. One while it flies; from the moment it
    // is hit it sinks towards the road, and the shadow grows to meet it.
    const gone =
      heli.fallAt === null ? 0 : (state.time - heli.fallAt) / HELI_FALL;
    const up = Math.max(0, 1 - gone);
    shadow(
      ctx,
      view,
      heli,
      (HELI_LONG / 2) * (1 - up * 0.4),
      HELI_WIDE * (1 - up * 0.4),
      heli.angle,
      0.3 + (1 - up) * 0.3,
    );
    paintHeli(
      ctx,
      project(view, heli.x, heli.y, HELI_HEIGHT * up),
      heli.angle + gone * FALL_SLEW,
      heli.spin,
      POLICE_PAINT,
    );
    // Burning: smoke off the tail and flame at the engine, growing as it goes.
    if (heli.fallAt !== null) {
      const spot = project(view, heli.x, heli.y, HELI_HEIGHT * up);
      ctx.save();
      ctx.translate(spot.x, spot.y);
      ctx.scale(1, DEPTH);
      ctx.rotate(heli.angle + gone * FALL_SLEW);
      for (let puff = 0; puff < FALL_SMOKE; puff += 1) {
        ctx.globalAlpha = 0.4 - puff * 0.08;
        ctx.fillStyle = "#4b5563";
        ctx.beginPath();
        ctx.ellipse(
          -HELI_LONG / 2 - puff * 9,
          Math.sin(state.time * 6 + puff) * 4,
          5 + puff * 3,
          5 + puff * 3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.ellipse(-2, 0, 7 + gone * 5, 6 + gone * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.ellipse(-2, 0, 3.6 + gone * 3, 3.2 + gone * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

/** What a helicopter is painted in: body, glass and the line round it. */
type HeliPaint = {
  readonly body: string;
  readonly trim: string;
  readonly glass: string;
};

/** The police machine: dark blue, like everything else they own. */
const POLICE_PAINT: HeliPaint = {
  body: "#1e3a8a",
  trim: "#0f172a",
  glass: "#1e293b",
};

/** And the one on the pad at the base: olive, with a black nose. */
const ARMY_PAINT: HeliPaint = {
  body: "#4b5320",
  trim: "#1c1917",
  glass: "#0f172a",
};

/**
 * One helicopter, from above.
 *
 * @param ctx - what to paint on
 * @param spot - where it is on the screen, height already taken off
 * @param angle - which way the nose points
 * @param spin - where the rotor is in its turn
 * @param paint - whose machine it is
 * @remarks
 * A Black Hawk rather than a bubble: a long squared-off cabin, stub wings over
 * the doors, a tail boom that tapers to a swept fin with the tail rotor on the
 * side of it, and four blades on top. Both machines in the game are this one -
 * the police fly it in blue, the army in olive - because there is only one
 * helicopter in San Andreas and it is the same aircraft either way.
 */
function paintHeli(
  ctx: CanvasRenderingContext2D,
  spot: Screen,
  angle: number,
  spin: number,
  paint: HeliPaint,
): void {
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.rotate(angle);
  ctx.fillStyle = paint.body;
  ctx.strokeStyle = paint.trim;
  ctx.lineWidth = 1.5;

  // The tail boom, tapering, with the fin swept up at the end of it.
  const boom = new Path2D();
  boom.moveTo(-2, -4.6);
  boom.lineTo(-HELI_LONG * 0.46, -2.2);
  boom.lineTo(-HELI_LONG * 0.46, 2.2);
  boom.lineTo(-2, 4.6);
  boom.closePath();
  ctx.fill(boom);
  ctx.stroke(boom);
  const fin = new Path2D();
  fin.moveTo(-HELI_LONG * 0.46, -2.6);
  fin.lineTo(-HELI_LONG / 2 - 2, -8.5);
  fin.lineTo(-HELI_LONG / 2 + 1.5, -9);
  fin.lineTo(-HELI_LONG * 0.42, 2.6);
  fin.closePath();
  ctx.fill(fin);
  ctx.stroke(fin);
  // The tailplane, across the boom.
  const plane = new Path2D();
  plane.roundRect(-HELI_LONG * 0.44, -7.5, 5, 15, 1.2);
  ctx.fill(plane);
  ctx.stroke(plane);

  // The cabin: square-shouldered, with a nose that comes to a point.
  const cabin = new Path2D();
  cabin.moveTo(-3, -8.4);
  cabin.lineTo(9, -8.4);
  cabin.lineTo(15, -4.6);
  cabin.lineTo(16.5, 0);
  cabin.lineTo(15, 4.6);
  cabin.lineTo(9, 8.4);
  cabin.lineTo(-3, 8.4);
  cabin.closePath();
  ctx.fill(cabin);
  ctx.stroke(cabin);

  // Stub wings over the doors, and the engine deck between them.
  ctx.fillStyle = paint.trim;
  for (const side of [-1, 1]) {
    const wing = new Path2D();
    wing.roundRect(-1.5, side * 8.4 - (side > 0 ? 0 : 3.4), 9, 3.4, 1.2);
    ctx.fill(wing);
  }
  const deck = new Path2D();
  deck.roundRect(-3.5, -5, 7, 10, 2);
  ctx.fill(deck);

  // The windscreen and the two door windows.
  ctx.fillStyle = paint.glass;
  const glass = new Path2D();
  glass.moveTo(9.4, -7.4);
  glass.lineTo(14.4, -4.2);
  glass.lineTo(15.6, 0);
  glass.lineTo(14.4, 4.2);
  glass.lineTo(9.4, 7.4);
  glass.closePath();
  ctx.fill(glass);
  ctx.stroke(glass);
  for (const side of [-1, 1]) {
    ctx.fillRect(2, side * 8.4 - (side > 0 ? 2.6 : 0), 5.5, 2.6);
  }

  // The skids.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(-3, side * 10.5);
    ctx.lineTo(12, side * 10.5);
  }
  ctx.stroke();

  // The tail rotor, on the left of the fin and turning the other way.
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let blade = 0; blade < TAIL_BLADES; blade += 1) {
    const turn = -spin * 1.6 + (blade * Math.PI * 2) / TAIL_BLADES;
    ctx.moveTo(-HELI_LONG / 2, -6.5 - Math.sin(turn) * TAIL_SPAN);
    ctx.lineTo(-HELI_LONG / 2, -6.5 + Math.sin(turn) * TAIL_SPAN);
  }
  ctx.stroke();

  // And the main rotor: four blades and the disc they sweep.
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(4, 0, ROTOR_SPAN, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let blade = 0; blade < ROTOR_BLADES; blade += 1) {
    const turn = spin + (blade * Math.PI * 2) / ROTOR_BLADES;
    ctx.moveTo(4, 0);
    ctx.lineTo(4 + Math.cos(turn) * ROTOR_SPAN, Math.sin(turn) * ROTOR_SPAN);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** How many blades the tail rotor has. */
const TAIL_BLADES = 4;

/** And how long they are. */
const TAIL_SPAN = 5.5;

/**
 * The helicopter on the pad at the base, and whoever is flying it.
 *
 * @param ctx - what to paint on
 * @param state - the city
 * @param view - where the camera is
 * @remarks
 * The same aircraft as the police one, in olive, with its shadow on the ground
 * under it. The shadow is the altimeter: how far it is from the machine is how
 * high the machine is.
 */
function drawChopper(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  const chopper = state.chopper;
  const up = chopper.height / CHOP_CEILING;
  shadow(
    ctx,
    view,
    chopper,
    (HELI_LONG / 2) * (1 - up * 0.35),
    HELI_WIDE * (1 - up * 0.35),
    chopper.angle,
    0.45 - up * 0.2,
  );
  paintHeli(
    ctx,
    project(view, chopper.x, chopper.y, chopper.height),
    chopper.angle,
    chopper.spin,
    ARMY_PAINT,
  );
}

/** How far a falling helicopter slews round, in radians over the whole fall. */
const FALL_SLEW = 2.6;

/** How many puffs of smoke trail behind it. */
const FALL_SMOKE = 4;

/** How long the helicopter is, in city pixels. */
const HELI_LONG = 46;

/** And how wide across the cabin. */
const HELI_WIDE = 9;

/** How many blades the rotor has. */
const ROTOR_BLADES = 2;

/** How far they reach from the mast. */
const ROTOR_SPAN = 26;

/** The job marker and the spray shop, as things a house can hide. */
function ringsOf(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): readonly Standing[] {
  const job = state.job;
  const rings: Standing[] = [
    {
      // All three aprons in one entry: they are decals on the road, and three
      // of them scattered over a map this size never overlap anything.
      depth: state.garages[0]?.y ?? 0,
      at: state.garages[0] ?? null,
      paint: (fade: number) => {
        ctx.globalAlpha = fade;
        drawGarage(ctx, state, view);
        ctx.globalAlpha = 1;
      },
    },
  ];
  if (job !== null) {
    const at = job.loaded ? job.to : job.from;
    const colour = job.loaded ? "#22c55e" : "#facc15";
    rings.push({
      depth: at.y,
      at,
      paint: (fade: number) => {
        ctx.globalAlpha = fade;
        marker(ctx, at, view, colour);
        ctx.globalAlpha = 1;
      },
    });
  }
  return rings;
}

/** Whether a house drawn later covers this spot. */
function hidden(
  view: View,
  walls: readonly Wall[],
  depth: number,
  at: Vec,
): boolean {
  const spot = project(view, at.x, at.y, LOOK_AT);
  return walls.some((wall) => wall.depth > depth && covers(wall, spot));
}

/** Whether a house is painted over this point of the screen. */
function covers(wall: Wall, spot: Screen): boolean {
  return (
    spot.x > wall.left &&
    spot.x < wall.right &&
    spot.y > wall.top &&
    spot.y < wall.bottom
  );
}

/** Whether something is close enough to the picture to bother drawing. */
function inPicture(at: Vec, seen: Seen): boolean {
  return (
    at.x > seen.left - TILE &&
    at.x < seen.right + TILE &&
    at.y > seen.top - TILE &&
    at.y < seen.bottom + TILE
  );
}

/* ---------------------------------------------------------------- houses */

/**
 * Every block of houses in view, as one box each.
 *
 * @remarks
 * One box per block, not one per cell: a block is nine building squares in a
 * ring of pavement, and drawing nine boxes would put seams and shadows through
 * the middle of what is meant to be one house.
 */
function collectHouses(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
): readonly House[] {
  const houses: House[] = [];
  const span = BLOCK_TILES * TILE;
  const fromBlockX = Math.floor(seen.left / span) - 1;
  const toBlockX = Math.ceil(seen.right / span);
  const fromBlockY = Math.floor(seen.top / span) - 1;
  const toBlockY = Math.ceil(seen.bottom / span);
  for (let blockY = fromBlockY; blockY <= toBlockY; blockY += 1) {
    for (let blockX = fromBlockX; blockX <= toBlockX; blockX += 1) {
      // The houses of a block sit inside its ring of pavement - and inside the
      // motorway, where one runs past. Asked of the plan, not assumed.
      const box = builtPlot(blockX, blockY);
      const left = box.left * TILE;
      const top = box.top * TILE;
      const right = box.right * TILE;
      const bottom = box.bottom * TILE;
      // Asked of the plan, not of the floor: the player's own house has a
      // garage cut out of its middle square, and a house with a garage in it
      // is still a house.
      if (builtBlock(blockX, blockY)) {
        const look = scatter(blockX, blockY);
        // What it is comes from the table, so that the city and the picture
        // always agree about which corner holds the night club.
        const sort = buildingAt(blockX, blockY);
        const height = houseHeight(blockX, blockY, look) * sort.rise;
        const plot = { left, top, right, bottom };
        const foot = project(view, left, bottom);
        const roof = project(view, left, top, height);
        houses.push({
          wall: {
            depth: bottom,
            left: foot.x,
            right: foot.x + (right - left),
            top: roof.y,
            bottom: foot.y,
          },
          paint: (fade) => drawHouse(ctx, view, plot, height, look, sort, fade),
        });
      }
    }
  }
  return houses;
}

/**
 * A number between 0 and 1 that is always the same for the same block.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns that block's own private dice roll
 */
function scatter(blockX: number, blockY: number): number {
  const spun = Math.sin(blockX * 12.9898 + blockY * 78.233) * 43758.5453;
  return spun - Math.floor(spun);
}

/**
 * How tall the houses of a block are.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @param look - that block's dice roll
 * @returns the height in screen pixels
 * @remarks
 * Tall in the middle of town, low towards the edges and the sea - that is what
 * makes a skyline read as a city rather than as a warehouse estate. The dice
 * roll only decides how far towards the local maximum a block goes.
 */
function houseHeight(blockX: number, blockY: number, look: number): number {
  const blocks = CITY_TILES / BLOCK_TILES;
  const away = Math.hypot(blockX + 0.5 - blocks / 2, blockY + 0.5 - blocks / 2);
  const downtown = Math.max(0, 1 - away / (blocks / 2));
  return HOUSE_LOW + (HOUSE_HIGH - HOUSE_LOW) * downtown * (0.35 + 0.65 * look);
}

/**
 * One block: one house, a pair, a row of them, or a place with a name.
 *
 * @remarks
 * The shape comes out of the table in ./buildings. A block cut into two or into
 * a row is drawn as two or five narrower houses with a gap of shadow between
 * them, which is the whole difference between a terrace and a warehouse at this
 * size. Anything with a name gets its own colours and the name over the door.
 */
function drawHouse(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  height: number,
  look: number,
  sort: Building,
  fade: number,
): void {
  const wide = plot.right - plot.left;
  const parts = sort.shape === "two" ? 2 : sort.shape === "row" ? 5 : 1;
  const gap = parts === 1 ? 0 : 2;
  const each = (wide - gap * (parts - 1)) / parts;
  for (let part = 0; part < parts; part += 1) {
    // Each house of a pair or a row sits a little lower or higher than its
    // neighbour, the same way every time.
    const own =
      height * (1 + (scatter(part * 13, Math.round(look * 90)) - 0.5) * 0.22);
    const from = plot.left + part * (each + gap);
    houseBox(ctx, view, plot, from, each, own, look, sort, fade);
  }
  if (sort.name !== "") {
    signOver(ctx, view, plot, height, sort, fade);
  }
}

/** One house of a block: its wall, its windows and its roof. */
function houseBox(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  from: number,
  wide: number,
  height: number,
  look: number,
  sort: Building,
  fade: number,
): void {
  const foot = project(view, from, plot.bottom);
  const back = project(view, from, plot.top, height);
  ctx.globalAlpha = fade;
  // The wall facing the camera. Only the south one is ever seen: the view is
  // tilted, not turned, so the east and west walls project to nothing.
  ctx.fillStyle = sort.wall;
  ctx.fillRect(foot.x, foot.y - height, wide, height);
  drawWindows(ctx, foot, wide, height, look, fade);

  // The roof, and the line where it meets the wall.
  ctx.globalAlpha = fade;
  ctx.fillStyle = sort.roof;
  ctx.fillRect(back.x, back.y, wide, foot.y - height - back.y);
  ctx.strokeStyle = "#292524";
  ctx.lineWidth = 1;
  ctx.strokeRect(back.x, back.y, wide, foot.y - back.y);
  ctx.beginPath();
  line(
    ctx,
    { x: foot.x, y: foot.y - height },
    { x: foot.x + wide, y: foot.y - height },
  );
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * The sign over the door of a place with a name.
 *
 * @remarks
 * On the wall rather than on the roof: it is meant to be read from the street,
 * and a name lying flat on a roof reads as graffiti. Shrunk to fit if the name
 * is longer than the front is wide.
 */
function signOver(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  height: number,
  sort: Building,
  fade: number,
): void {
  const foot = project(view, plot.left, plot.bottom);
  const wide = plot.right - plot.left;
  const band = 13;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(foot.x + 4, foot.y - height - band + 2, wide - 8, band);
  ctx.fillStyle = sort.sign;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 11;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  while (ctx.measureText(sort.name).width > wide - 14 && size > 6) {
    size -= 1;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
  }
  ctx.fillText(sort.name, foot.x + wide / 2, foot.y - height - band / 2 + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Windows down the front of a house, lit or dark and always the same ones. */
function drawWindows(
  ctx: CanvasRenderingContext2D,
  foot: Screen,
  wide: number,
  height: number,
  look: number,
  fade: number,
): void {
  const across = Math.max(2, Math.round(wide / 30));
  const floors = Math.max(1, Math.floor((height - 8) / 18));
  const gap = wide / across;
  for (let column = 0; column < across; column += 1) {
    for (let floor = 0; floor < floors; floor += 1) {
      const lit = scatter(column * 7 + floor, Math.round(look * 100)) > 0.55;
      ctx.fillStyle = lit ? "#fde68a" : "#3f3f46";
      ctx.globalAlpha = (lit ? 0.8 : 0.55) * fade;
      ctx.fillRect(
        foot.x + column * gap + gap / 2 - 5,
        foot.y - 12 - floor * 18,
        10,
        9,
      );
    }
  }
  ctx.globalAlpha = fade;
}

/**
 * The weapons and vests lying about, and what each one looks like.
 *
 * @remarks
 * Flat on the road rather than standing up: they are part of the floor, and a
 * box that stood up would be one more thing to lose behind a house. The gentle
 * pulse is the only thing that says "this is not paint".
 */
function drawPickups(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
): void {
  for (const drop of state.pickups) {
    if (drop.backAt === null && inPicture(drop, seen)) {
      const spot = project(view, drop.x, drop.y);
      const beat = 1 + Math.sin(state.time * 4 + drop.id) * 0.12;
      ctx.save();
      ctx.translate(spot.x, spot.y);
      ctx.scale(1, DEPTH);
      // The glow on the ground, the way this sort of game marks a drop.
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = drop.holds === "armour" ? "#38bdf8" : "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 13 * beat, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      drawKit(ctx, spot, drop.holds, 1);
    }
  }
}

/**
 * One weapon, drawn small: the same picture in the street and in the corner.
 *
 * @param at - where the middle of it sits, on screen
 * @param holds - which weapon, or the vest
 * @param size - how big, one being street size
 * @remarks
 * Everything points **east**, the way every other drawing in this game does,
 * because the same picture is turned to the aim angle when it is in a hand.
 * All of them live inside about twelve pixels of the middle: bigger than that
 * and the icon runs out of its box in the corner panel.
 *
 * A table rather than a chain of tests. Ten weapons is past the point where
 * `else if` reads, and each of them is a little drawing that has nothing to
 * say to the others.
 */
function drawKit(
  ctx: CanvasRenderingContext2D,
  at: Screen,
  holds: Pickup["holds"],
  size: number,
): void {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(size, size);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  (KIT[holds] ?? KIT.fist)(ctx);
  ctx.lineCap = "butt";
  ctx.restore();
}

/** Fills a shape and puts the usual dark line round it. */
function part(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  fill: string,
  wide = 1.1,
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = KIT_INK;
  ctx.lineWidth = wide;
  ctx.fill(path);
  ctx.stroke(path);
}

/** The line round every part of every weapon. */
const KIT_INK = "#0f172a";

/** Which little drawing belongs to which thing that can be carried. */
const KIT: Readonly<
  Record<Pickup["holds"], (ctx: CanvasRenderingContext2D) => void>
> = {
  cash: (ctx) => {
    // Two notes, one behind the other, with a coin on top.
    ctx.fillStyle = "#15803d";
    ctx.strokeStyle = "#052e16";
    ctx.lineWidth = 1;
    for (const note of [-1.5, 1.5]) {
      const bill = new Path2D();
      bill.roundRect(-9 + note, -5 + note, 18, 10, 1.5);
      ctx.fill(bill);
      ctx.stroke(bill);
    }
    ctx.fillStyle = "#bbf7d0";
    ctx.beginPath();
    ctx.arc(1.5, 1.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },
  armour: (ctx) => {
    const vest = new Path2D();
    vest.moveTo(0, -8);
    vest.lineTo(6, -5);
    vest.lineTo(6, 3);
    vest.lineTo(0, 9);
    vest.lineTo(-6, 3);
    vest.lineTo(-6, -5);
    vest.closePath();
    part(ctx, vest, "#38bdf8");
  },

  // A clenched fist, knuckles forward: the back of the hand, four knuckle
  // ridges along the leading edge and the thumb folded across the front.
  fist: (ctx) => {
    const cuff = new Path2D();
    cuff.roundRect(-11, -4.6, 4.4, 9.2, 1.4);
    part(ctx, cuff, "#475569");
    const hand = new Path2D();
    hand.roundRect(-7.4, -6.2, 13.4, 12.4, 4.2);
    part(ctx, hand, "#f2c9a0");
    ctx.strokeStyle = "#c98f5f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const across of [-3.6, -0.6, 2.4]) {
      ctx.moveTo(3.4, across);
      ctx.lineTo(5.6, across);
    }
    ctx.stroke();
    const thumb = new Path2D();
    thumb.roundRect(-1.6, 3.4, 7, 4, 2);
    part(ctx, thumb, "#f2c9a0");
  },

  // Brass knuckles, seen face on: four finger holes in a row with the grip
  // bar under them. The holes are what makes it that and not a spanner.
  knuckles: (ctx) => {
    const body = new Path2D();
    body.roundRect(-10, -5.4, 20, 8.6, 4);
    part(ctx, body, "#cbd5e1");
    const grip = new Path2D();
    grip.roundRect(-5.4, 1.4, 10.8, 5.4, 2.4);
    part(ctx, grip, "#94a3b8");
    for (const hole of [-6.8, -2.3, 2.3, 6.8]) {
      const eye = new Path2D();
      eye.ellipse(hole, -1.2, 2.1, 2.3, 0, 0, Math.PI * 2);
      part(ctx, eye, "#334155", 0.9);
    }
  },

  // A straight baton: a black shaft with a ribbed grip at the near end.
  baton: (ctx) => {
    const shaft = new Path2D();
    shaft.roundRect(-3, -1.7, 14.6, 3.4, 1.7);
    part(ctx, shaft, "#1f2937");
    const grip = new Path2D();
    grip.roundRect(-11.4, -2.6, 8.8, 5.2, 2.4);
    part(ctx, grip, "#334155");
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const rib of [-9.4, -7.6, -5.8, -4]) {
      ctx.moveTo(rib, -2.2);
      ctx.lineTo(rib, 2.2);
    }
    ctx.stroke();
  },

  // A knife: a leaf blade with a spine line, a small guard, a wooden grip.
  knife: (ctx) => {
    const blade = new Path2D();
    blade.moveTo(-1, -3.2);
    blade.lineTo(6, -3);
    blade.quadraticCurveTo(11.8, -1.6, 12, 0.4);
    blade.quadraticCurveTo(7, 3.2, -1, 2.6);
    blade.closePath();
    part(ctx, blade, "#e2e8f0");
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -1.4);
    ctx.lineTo(9.4, -0.4);
    ctx.stroke();
    const guard = new Path2D();
    guard.roundRect(-2.4, -4.6, 2.4, 9.2, 1);
    part(ctx, guard, "#94a3b8");
    const grip = new Path2D();
    grip.roundRect(-10.6, -2.8, 8.4, 5.6, 2);
    part(ctx, grip, "#5b3a21");
    ctx.fillStyle = "#a8a29e";
    for (const rivet of [-8.4, -5.4]) {
      ctx.beginPath();
      ctx.ellipse(rivet, 0, 0.8, 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // A pistol: slide over the frame, trigger guard under it, grip raked back.
  pistol: (ctx) => {
    const grip = new Path2D();
    grip.moveTo(-4.4, 0);
    grip.lineTo(-1.2, 0);
    grip.lineTo(-2.6, 8.4);
    grip.lineTo(-6.6, 8);
    grip.closePath();
    part(ctx, grip, "#94a3b8");
    const guard = new Path2D();
    guard.moveTo(-1.2, 1);
    guard.quadraticCurveTo(3.4, 1.2, 3.4, 4.6);
    guard.quadraticCurveTo(0.6, 5.6, -1.6, 4.2);
    guard.closePath();
    part(ctx, guard, "#94a3b8", 0.9);
    const slide = new Path2D();
    slide.roundRect(-6.8, -4.4, 18.6, 4.6, 1.2);
    part(ctx, slide, "#cbd5e1");
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-5.4, -2.2);
    ctx.lineTo(9.6, -2.2);
    ctx.stroke();
    const hole = new Path2D();
    hole.ellipse(11, -2.1, 1, 1.4, 0, 0, Math.PI * 2);
    part(ctx, hole, "#334155", 0.7);
  },

  // A carbine: stock, receiver with the carry handle, magazine, handguard and
  // a long barrel with the front sight on it.
  mg: (ctx) => {
    const stock = new Path2D();
    stock.moveTo(-12, -2.6);
    stock.lineTo(-6.6, -2.8);
    stock.lineTo(-6.6, 2.2);
    stock.lineTo(-12, 3.4);
    stock.closePath();
    part(ctx, stock, "#3f3f46");
    const grip = new Path2D();
    grip.moveTo(-5.6, 1);
    grip.lineTo(-2.6, 1);
    grip.lineTo(-3.6, 7.6);
    grip.lineTo(-7, 7);
    grip.closePath();
    part(ctx, grip, "#27272a");
    const mag = new Path2D();
    mag.moveTo(-1.6, 1);
    mag.quadraticCurveTo(1.2, 5.6, 0.6, 9.4);
    mag.lineTo(-3.2, 8.8);
    mag.quadraticCurveTo(-3.4, 4.6, -4.6, 1);
    mag.closePath();
    part(ctx, mag, "#3f3f46");
    const body = new Path2D();
    body.roundRect(-7, -3.4, 12, 5, 1);
    part(ctx, body, "#52525b");
    const handle = new Path2D();
    handle.roundRect(-5.4, -6.6, 6.6, 2.2, 0.8);
    part(ctx, handle, "#3f3f46", 0.9);
    const wood = new Path2D();
    wood.roundRect(4.4, -3, 5.6, 4.2, 1);
    part(ctx, wood, "#3f3f46");
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const rib of [5.6, 6.8, 8, 9.2]) {
      ctx.moveTo(rib, -2.6);
      ctx.lineTo(rib, 0.8);
    }
    ctx.stroke();
    const barrel = new Path2D();
    barrel.roundRect(9.6, -2.2, 5.2, 2, 0.8);
    part(ctx, barrel, "#27272a", 0.8);
    const sight = new Path2D();
    sight.moveTo(9.2, -3);
    sight.lineTo(10.8, -3);
    sight.lineTo(10.2, -6.4);
    sight.lineTo(9.8, -6.4);
    sight.closePath();
    part(ctx, sight, "#27272a", 0.8);
  },

  // A flamethrower: the fuel bottle at the back, the gun over it, and the
  // nozzle out in front with the pilot light burning at the tip.
  flamer: (ctx) => {
    const bottle = new Path2D();
    bottle.roundRect(-12, -2.4, 6.6, 10.4, 2.6);
    part(ctx, bottle, "#9a3412");
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-11.4, 3);
    ctx.lineTo(-6, 3);
    ctx.stroke();
    const grip = new Path2D();
    grip.moveTo(-4.6, 0.6);
    grip.lineTo(-1.6, 0.6);
    grip.lineTo(-2.6, 7);
    grip.lineTo(-5.8, 6.4);
    grip.closePath();
    part(ctx, grip, "#3f3f46");
    const body = new Path2D();
    body.roundRect(-8, -3.4, 15, 4.4, 1.2);
    part(ctx, body, "#52525b");
    const hopper = new Path2D();
    hopper.moveTo(-6.4, -3.6);
    hopper.lineTo(-0.6, -3.6);
    hopper.lineTo(-1.6, -7.8);
    hopper.lineTo(-5.4, -7.8);
    hopper.closePath();
    part(ctx, hopper, "#3f3f46", 0.9);
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const rib of [1.4, 2.8, 4.2, 5.6]) {
      ctx.moveTo(rib, -3);
      ctx.lineTo(rib, 0.6);
    }
    ctx.stroke();
    const nozzle = new Path2D();
    nozzle.roundRect(6.6, -3.2, 4.4, 4, 1.2);
    part(ctx, nozzle, "#27272a", 0.8);
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(11, -2.6);
    ctx.lineTo(13.4, -1.2);
    ctx.lineTo(11, 0.2);
    ctx.closePath();
    ctx.fill();
  },

  // A launcher off a photograph rather than a green bar with a triangle: the
  // tube, the blast cone flaring at the back, the wooden shield over the
  // middle, a pistol grip under it, the little sight on top, and the pointed
  // warhead sticking out of the front.
  rpg: (ctx) => {
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(-8, -1.7, 12, 3.4);
    ctx.beginPath();
    ctx.moveTo(-8, -1.7);
    ctx.lineTo(-11.5, -3.4);
    ctx.lineTo(-11.5, 3.4);
    ctx.lineTo(-8, 1.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-6.4, -2.1, 1, 4.2);
    ctx.fillRect(2.4, -2.1, 1, 4.2);
    ctx.fillStyle = "#8a6a45";
    ctx.fillRect(-4.6, -2.3, 5.4, 4.6);
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(-1.8, 2, 2, 4.4);
    ctx.fillRect(2.6, 2, 1.4, 2.8);
    ctx.fillRect(-3.4, -4, 1.6, 1.8);
    ctx.fillStyle = "#65803a";
    ctx.beginPath();
    ctx.moveTo(4.5, -1.7);
    ctx.lineTo(6.2, -2.6);
    ctx.lineTo(7.4, -2.4);
    ctx.lineTo(11.5, 0);
    ctx.lineTo(7.4, 2.4);
    ctx.lineTo(6.2, 2.6);
    ctx.lineTo(4.5, 1.7);
    ctx.closePath();
    ctx.fill();
  },

  grenade: (ctx) => {
    const body = new Path2D();
    body.ellipse(0, 1, 5, 5.6, 0, 0, Math.PI * 2);
    part(ctx, body, "#4d7c0f");
    ctx.strokeStyle = "#3f6212";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const line of [-2, 0.6, 3.2]) {
      ctx.moveTo(-4.4, line);
      ctx.lineTo(4.4, line);
    }
    ctx.stroke();
    const neck = new Path2D();
    neck.roundRect(-2, -6, 4, 2.4, 0.8);
    part(ctx, neck, "#a8a29e", 0.8);
    const pin = new Path2D();
    pin.ellipse(4, -6, 1.8, 1.8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.2;
    ctx.stroke(pin);
  },

  // The handset, not the charge: a black box with a red button under the
  // thumb and a stub of aerial. What one carries is the button - the charges
  // are what one leaves behind, and they are drawn where they lie.
  remote: (ctx) => {
    const aerial = new Path2D();
    aerial.moveTo(3.4, -3.6);
    aerial.lineTo(7.4, -8.4);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.3;
    ctx.stroke(aerial);
    const knob = new Path2D();
    knob.ellipse(7.6, -8.8, 1.2, 1.2, 0, 0, Math.PI * 2);
    part(ctx, knob, "#94a3b8", 0.8);
    const box = new Path2D();
    box.roundRect(-5.4, -4.4, 10.8, 9.6, 1.6);
    part(ctx, box, "#1f2937");
    const face = new Path2D();
    face.roundRect(-3.8, -2.8, 7.6, 3, 0.8);
    part(ctx, face, "#334155", 0.7);
    const button = new Path2D();
    button.ellipse(0, 2.4, 2.4, 2.2, 0, 0, Math.PI * 2);
    part(ctx, button, "#dc2626", 0.9);
    const shine = new Path2D();
    shine.ellipse(-0.7, 1.7, 0.9, 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fca5a5";
    ctx.fill(shine);
  },
};

/**
 * The charges lying about, each with its light going.
 *
 * @remarks
 * Painted with the pickups rather than with everything that stands up: a
 * charge is flat on the road, and a thing on the road that a car can drive
 * over has to be drawn under the car. The blinking red light is the whole of
 * its interface - it is what tells you the line you laid is still live.
 */
function drawCharges(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  for (const charge of state.charges) {
    const spot = project(view, charge.x, charge.y);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.scale(1, DEPTH);
    const box = new Path2D();
    box.roundRect(-5, -3.4, 10, 6.8, 1.4);
    ctx.fillStyle = "#1c1917";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.fill(box);
    ctx.stroke(box);
    const tape = new Path2D();
    tape.rect(-5, -1.2, 10, 2.4);
    ctx.fillStyle = "#b45309";
    ctx.fill(tape);
    const lit = chargeLit(state, charge);
    ctx.fillStyle = lit ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(3, -2.4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    if (lit) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(3, -2.4, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

/**
 * Whether a charge's light is on this frame.
 *
 * @remarks
 * Two rhythms out of one clock. A charge just put down blinks quickly for a
 * second - that is the receipt for the button press - and after that it falls
 * in with all the others: the slow blink runs off the world clock rather than
 * off each charge's own, so a line of them pulses as one thing. They are one
 * weapon, and they should look like one.
 */
function chargeLit(state: GameState, charge: Charge): boolean {
  const since = state.time - charge.at;
  return since < FRESH_CHARGE
    ? since % QUICK_BLINK < QUICK_BLINK / 2
    : state.time % SLOW_BLINK < SLOW_BLINK / 2;
}

/** How long a charge blinks quickly after being put down, in seconds. */
const FRESH_CHARGE = 1;

/** That quick blink, in seconds. */
const QUICK_BLINK = 0.24;

/** And the slow one they all share afterwards. */
const SLOW_BLINK = 1;

/**
 * The lights of the charges, over everything else.
 *
 * @remarks
 * The charge itself is drawn on the road and a car parked on it hides it -
 * which is exactly what one wants of a trap. The light is drawn over the top
 * of the whole picture instead, because the one thing the player must never
 * lose is the answer to "where did I put them".
 */
function drawChargeLights(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  for (const charge of state.charges) {
    if (chargeLit(state, charge)) {
      const spot = project(view, charge.x, charge.y);
      ctx.save();
      ctx.translate(spot.x, spot.y);
      ctx.scale(1, DEPTH);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 0, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fca5a5";
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------- cars and people */

/**
 * One vehicle: its shadow, the walls that face the camera, and its picture.
 *
 * @remarks
 * The picture comes from ./vehicle-art, painted once per body and colour. What
 * stays here is what cannot be baked into it: the shadow it throws, the walls
 * of the box that give it height in a tilted view, the green frame around the
 * one being driven, and the smoke of a wreck.
 */
function drawCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  view: View,
  now: number,
  fade: number,
): void {
  const shape = VEHICLES[car.body];
  // Under the car, before it: rubber going up is the one thing that says a
  // corner was taken too fast, and it belongs on the road, not on the roof.
  drawSkid(ctx, car, view, now, fade);
  const police = car.kind === "police";
  const paint = paintOf(car);
  const long = shape.length;
  const wide = shape.width;
  const tiers = tiersOf(car.body);
  const soot = car.health <= 0 ? SOOT : 0;
  const sheet = vehicleSprite(car.body, paint, police);
  shadow(ctx, view, car, long / 2, wide / 2, car.angle, fade);
  beam(ctx, view, car, fade);

  // The wheels first, and on the road where they belong.
  stampTop(ctx, view, car, 0, {
    part: "ring",
    sheet,
    cabin: null,
    fade,
    soot,
  });
  // Then the body: doors and bumpers on the walls, with the bonnet and the
  // boot laid flat on top of them.
  const body = bodyOutline(car.body);
  panels(
    ctx,
    view,
    placed(body, car, car.angle),
    wallFaces(body),
    { base: 0, top: tiers.belt, fade, soot, paint, lean: null },
    (face) => vehicleWall(car.body, paint, police, face, false),
  );
  stampTop(ctx, view, car, tiers.belt, {
    part: "body",
    sheet,
    cabin: null,
    fade,
    soot,
  });

  // And the cabin standing on it, which is what makes it a car and not a box.
  // The tank is the exception: its upper storey turns on its own, so it is a
  // picture laid on top rather than a second box.
  if (car.body === "tank") {
    drawTurret(ctx, view, car, tiers.tall, fade, soot);
  } else {
    // The cabin, whose walls lean: a windscreen that slopes back takes the
    // roof with it, so the top of the wall is the outline the roof is clipped
    // to rather than the one it stands on.
    const cabin = cabinOutline(car.body);
    panels(
      ctx,
      view,
      placed(cabin, car, car.angle),
      wallFaces(cabin),
      {
        base: tiers.belt,
        top: tiers.tall,
        fade,
        soot,
        // The bevels of the greenhouse are pillars, not bodywork. Painted in
        // the colour of the car they put a coloured strip between the
        // windscreen and the door glass, and a Golf has no such thing -
        // the glass runs round the corner in one piece.
        paint: PILLAR,
        lean: placed(leaning(cabin, tiers), car, car.angle),
      },
      (face) => vehicleWall(car.body, paint, police, face, true),
    );
    stampTop(ctx, view, car, tiers.tall, {
      part: "all",
      sheet,
      cabin: tiers,
      fade,
      soot,
    });
  }

  // No frame round the one being driven. The camera sits on it, so which car
  // that is was never in doubt - and a box drawn round a vehicle is the one
  // thing on the screen that could not be part of the city.
  lamps(ctx, view, car, tiers, fade);
  drawDamage(ctx, view, car, now, fade);
}

/**
 * Where a vehicle's lamps sit across it, as shares of half its width.
 *
 * @remarks
 * A pair front and back for anything with four wheels; one down the middle for
 * the two-wheelers; none at all on a tank, which has headlamps in real life and
 * would look like a taxi with them here.
 */
const LAMP_SIDES: Readonly<Partial<Record<VehicleBody, readonly number[]>>> = {
  bike: [0],
  cycle: [0],
  tank: [],
};

/** What everything else carries. */
const BOTH_LAMPS: readonly number[] = [-0.7, 0.7];

/**
 * The lamps of one vehicle, lit.
 *
 * @param ctx - what to draw on
 * @param view - the camera
 * @param car - the vehicle
 * @param tiers - how high it stands, for where the lamps hang
 * @param fade - how much of it a house in front lets through
 * @remarks
 * Every car in the city drives with its lights on. That is not realism - it is
 * legibility: two white points and two red ones say which end of a dark shape
 * is the front, from far enough away that the shape itself is four pixels.
 * They are drawn rather than painted into the sprite because a lamp is light,
 * and light adds to what is under it: `lighter` is what makes a headlamp look
 * lit instead of looking like a white sticker.
 *
 * A wreck has none of it. The one thing a burnt-out car should not look is
 * ready to drive.
 */
function lamps(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  tiers: VehicleTiers,
  fade: number,
): void {
  const sides = LAMP_SIDES[car.body] ?? BOTH_LAMPS;
  if (car.health > 0 && sides.length > 0) {
    const shape = VEHICLES[car.body];
    const long = shape.length / 2;
    const wide = shape.width / 2;
    // How far up the bodywork the lamps hang. The Cybertruck wears its light
    // bar along the very top edge of the panel; everything else has its lamps
    // about halfway up.
    const head = tiers.belt * (LAMP_HIGH_OF[car.body] ?? LAMP_HIGH);
    const rear = tiers.belt * (LAMP_BACK_OF[car.body] ?? LAMP_BACK);
    ctx.save();
    ctx.globalAlpha = fade;
    // A lamp pointing away from the camera is behind its own car. The picture
    // has no depth test - the glow is laid over everything - so a car driving
    // away showed its headlamps through its own roof, and one coming towards
    // you its tail lamps.
    const into = Math.sin(car.angle);
    for (const side of sides) {
      if (into > -LAMP_FACING) {
        lamp(
          ctx,
          view,
          car,
          { along: long - 1.5, across: side * wide, high: head },
          { glass: HEAD_GLASS, halo: HEAD_HALO, size: HEAD_GLOW },
        );
      }
      if (into < LAMP_FACING) {
        lamp(
          ctx,
          view,
          car,
          { along: -long + 1, across: side * wide, high: rear },
          {
            glass: car.braking ? BRAKE_GLASS : TAIL_GLASS,
            halo: TAIL_HALO,
            size: car.braking ? BRAKE_GLOW : TAIL_GLOW,
          },
        );
      }
    }
    ctx.restore();
  }
}

/** One lamp: a point of colour that fades out into nothing. */
function lamp(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  seat: {
    readonly along: number;
    readonly across: number;
    readonly high: number;
  },
  bulb: {
    readonly glass: string;
    readonly halo: string;
    readonly size: number;
  },
): void {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const spot = project(
    view,
    car.x + cos * seat.along - sin * seat.across,
    car.y + sin * seat.along + cos * seat.across,
    seat.high,
  );
  // The glass first, painted **over** whatever is under it. A lamp drawn
  // purely as light added to the bodywork comes out white however red it is:
  // adding a red with any green and blue in it to a colour that already has
  // some of both saturates all three channels, and three saturated channels
  // are white. A tail lamp one cannot tell from a headlamp is worse than no
  // lamp at all.
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = bulb.glass;
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, bulb.size * LAMP_GLASS, 0, Math.PI * 2);
  ctx.fill();
  // And then the halo round it, which is light and does add.
  ctx.globalCompositeOperation = "lighter";
  const light = ctx.createRadialGradient(
    spot.x,
    spot.y,
    0,
    spot.x,
    spot.y,
    bulb.size,
  );
  light.addColorStop(0, `rgba(${bulb.halo},0.5)`);
  light.addColorStop(LAMP_CORE, `rgba(${bulb.halo},0.28)`);
  light.addColorStop(1, `rgba(${bulb.halo},0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, bulb.size, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * How far round a lamp may point before it is out of sight, as a sine.
 *
 * @remarks
 * Well past a right angle, because the lamps of this car wrap round its
 * corners on to the flank: from the side one sees both ends lit, which is
 * right, and only nose on or tail on does the far pair disappear.
 */
const LAMP_FACING = 0.62;

/** How much of a lamp is the glass itself rather than the glow round it. */
const LAMP_GLASS = 0.34;

/** The glass of a headlamp, and the light it throws. */
const HEAD_GLASS = "#fff6dc";

/** Its halo, which is warm white. */
const HEAD_HALO = "255,240,200";

/** The glass of a tail lamp. */
const TAIL_GLASS = "#e01b12";

/** And with the brake on, which is the same lamp turned up. */
const BRAKE_GLASS = "#ff2a16";

/**
 * The halo of a tail lamp: red, and almost nothing else.
 *
 * @remarks
 * A softer red would be truer to a tail lamp lens and comes out pink, because
 * this is added to what is underneath. Whatever green and blue it carries is
 * added to the green and blue already there - so the halo has to be nearly
 * pure red for the light to read as red at all.
 */
const TAIL_HALO = "255,24,12";

/**
 * The pool of light a pair of headlamps throws on the road in front.
 *
 * @remarks
 * On the ground and under the car, so the bonnet covers where it starts - a
 * beam that begins in mid-air in front of the bumper reads as a puddle rather
 * than as light. Faint: the city is not dark, and the point is to say which way
 * the thing is pointing, not to light the street.
 */
function beam(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  fade: number,
): void {
  const sides = LAMP_SIDES[car.body] ?? BOTH_LAMPS;
  if (car.health > 0 && sides.length > 0) {
    const shape = VEHICLES[car.body];
    const reach = shape.length * BEAM_REACH;
    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);
    const spot = project(view, car.x + cos * reach, car.y + sin * reach);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.scale(1, DEPTH);
    ctx.rotate(car.angle);
    ctx.scale(reach, shape.width * BEAM_SPREAD);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    pool.addColorStop(0, "rgba(255,238,190,0.1)");
    pool.addColorStop(1, "rgba(255,240,200,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = fade;
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** How far up the bodywork the headlamps hang, as a share of the belt line. */
const LAMP_HIGH = 0.55;

/** And the ones that hang somewhere else. */
const LAMP_HIGH_OF: Readonly<Partial<Record<VehicleBody, number>>> = {
  car: 0.64,
  suv: 0.86,
};

/**
 * The same for the tail lamps, which are not at the same height.
 *
 * @remarks
 * On the Golf they sit **right under the glass**, half a bodyside higher than
 * the headlamps do, and the glow has to sit where the lamp is painted or the
 * car looks like it is leaking light out of the boot lid.
 */
const LAMP_BACK = 0.55;

/** And the ones that hang somewhere else. */
const LAMP_BACK_OF: Readonly<Partial<Record<VehicleBody, number>>> = {
  car: 0.88,
  suv: 0.86,
};

/** How far a headlamp's glow reaches, in screen pixels. */
const HEAD_GLOW = 4;

/**
 * A tail lamp, which is dimmer.
 *
 * @remarks
 * Dimmer than it was, too. The lamp painted on the tailgate is a wing that
 * tapers inboard and the shut line crosses it - and none of that can be seen
 * through a blob of light twice its size.
 */
const TAIL_GLOW = 2.2;

/** And a tail lamp with the brake on. */
const BRAKE_GLOW = 5.2;

/** Where the bright middle of a lamp ends and the halo begins. */
const LAMP_CORE = 0.35;

/** How far ahead of the nose the light pool sits, in vehicle lengths. */
const BEAM_REACH = 0.6;

/** And how wide it spreads, in vehicle widths. */
const BEAM_SPREAD = 0.5;

/**
 * The tank's turret, laid on the hull and turned where the gun points.
 *
 * @remarks
 * Its own angle, its own picture. Everything else in this city points where it
 * drives, which is why one sprite per vehicle was enough - a turret is the one
 * part that looks somewhere else, and where it looks is where the shell lands.
 */
function drawTurret(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  height: number,
  fade: number,
  soot: number,
): void {
  const sheet = turretSprite();
  if (sheet !== null) {
    const spot = project(view, car.x, car.y, height);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.scale(1, DEPTH);
    ctx.rotate(car.turret);
    // Dimmed rather than painted over: a black square the size of the picture
    // would be a black square, and most of this picture is empty.
    ctx.globalAlpha = fade * (soot > 0 ? 1 - soot : 1);
    ctx.drawImage(
      sheet,
      -TURRET_SIZE / 2,
      -TURRET_SIZE / 2,
      TURRET_SIZE,
      TURRET_SIZE,
    );
    ctx.restore();
  }
}

/**
 * What one vehicle is painted.
 *
 * @param car - the vehicle in question
 * @returns the colour of its bodywork
 * @remarks
 * Three of them never had a choice - a police car is dark blue, a DMC-12 is
 * bare steel, a tractor is green - and a taxi is yellow because a taxi one
 * cannot pick out of the traffic is not worth having in it. What is left is
 * the palette, minus those last two colours for the bodies that would be
 * confused with them.
 */
function paintOf(car: Car): string {
  let paint: string;
  switch (car.body) {
    case "dmc":
      paint = STEEL;
      break;
    case "tractor":
      paint = TRACTOR_GREEN;
      break;
    case "taxi":
      paint = TAXI_PAINT;
      break;
    case "car":
    case "suv":
      paint = PLAIN_PAINT[car.colour % PLAIN_PAINT.length] ?? "#dc2626";
      break;
    default:
      paint = CAR_PAINT[car.colour % CAR_PAINT.length] ?? "#dc2626";
  }
  return car.kind === "police" ? "#0f172a" : paint;
}

/** The one colour a tractor is ever painted in. */
const TRACTOR_GREEN = "#3f6212";

/** Below this much area a wall is edge on and worth nothing, in square pixels. */
const WALL_THIN = 1;

/** What the corners of a greenhouse are made of: blacked out pillar. */
const PILLAR = "#1b2432";

/** How dark a burnt-out wreck is painted over. */
const SOOT = 0.55;

/**
 * A vehicle's own outline, put where the vehicle is.
 *
 * @param outline - the corners in car-local pixels, nose to the east
 * @param at - where the vehicle stands
 * @param angle - which way it points
 * @returns the same corners in city pixels
 */
function placed(
  outline: readonly Vec[],
  at: Vec,
  angle: number,
): readonly Vec[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return outline.map((point) => ({
    x: at.x + point.x * cos - point.y * sin,
    y: at.y + point.x * sin + point.y * cos,
  }));
}

/**
 * The same outline, with every edge pushed out by a little.
 *
 * @param points - the corners
 * @param by - how far out each edge goes, in city pixels
 * @returns the corners of the wider outline
 * @remarks
 * Stretched about its own middle rather than walked edge by edge, which for a
 * shape as plain as a car comes to the same thing: the four long edges are
 * straight and square to the axes, so each of them moves out by exactly this
 * much and the chamfers between them follow.
 */
function grown(points: readonly Vec[], by: number): readonly Vec[] {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const halfX = (Math.max(...xs) - Math.min(...xs)) / 2;
  const halfY = (Math.max(...ys) - Math.min(...ys)) / 2;
  const outX = halfX > 0 ? (halfX + by) / halfX : 1;
  const outY = halfY > 0 ? (halfY + by) / halfY : 1;
  return points.map((point) => ({
    x: midX + (point.x - midX) * outX,
    y: midY + (point.y - midY) * outY,
  }));
}

/** How far outside the bodywork the ring starts, in city pixels. */
const RING_BITE = 0.7;

/** A closed path through a set of corners. */
function outlineOf(points: readonly Vec[]): Path2D {
  const path = new Path2D();
  points.forEach((point, at) => {
    if (at === 0) {
      path.moveTo(point.x, point.y);
    } else {
      path.lineTo(point.x, point.y);
    }
  });
  path.closePath();
  return path;
}

/**
 * A cabin outline with both screens leaned back.
 *
 * @param outline - the cabin at the belt line
 * @param tiers - the vehicle, for how far its windscreen leans
 * @returns the outline of the roof, which stops short of the screen
 * @remarks
 * Only the front. The back window leans as well, but it is drawn leaning on
 * the side panels - trimming the roof there too left a notch at the rear
 * corner where the wall's top edge and the roof no longer met.
 */
function leaning(outline: readonly Vec[], tiers: VehicleTiers): readonly Vec[] {
  const front = tiers.cabinFront - tiers.rake;
  return outline.map((point) => ({
    x: Math.min(point.x, front),
    y: point.y,
  }));
}

/**
 * Which part of the top-down picture a stamp lays down.
 *
 * @remarks
 * The picture of a car from above carries more than the roof: wheels and
 * mirrors stick out past the bodywork. Drawn in one go at the height of the
 * bodywork, the wheels on the far side end up floating over the roof - which
 * is what made every vehicle look lopsided from anywhere but straight on.
 *
 * So it goes down in two passes at two heights: the ring of wheels **on the
 * road**, the bodywork **on top of the walls**. A game engine gets this for
 * nothing, because there a wheel is a thing at a height rather than a few
 * pixels in a picture.
 */
type LidPart = "all" | "ring" | "body";

/** How high a stack of walls goes, and how it is painted. */
type Storey = {
  /** Where it starts, off the road. */
  readonly base: number;
  /** And where it ends. */
  readonly top: number;
  /** How much of it a house in front lets through. */
  readonly fade: number;
  /** How black it is painted over, for a wreck. */
  readonly soot: number;
  /** What the bevels between the walls are painted, since they get no picture. */
  readonly paint: string;
  /**
   * The outline the top of the walls follows, where it is not the bottom one.
   *
   * @remarks
   * A windscreen leans. The roof of the cabin is therefore shorter than the
   * floor of it, and the wall between them is not upright - it slopes back
   * from the bottom edge to the top. Drawn upright, as every wall used to be,
   * the roof ended a few pixels short of the top of its own wall and one could
   * see daylight through the gap, from whichever angle happened to look into
   * it. This is that lean.
   */
  readonly lean: readonly Vec[] | null;
};

/**
 * The walls of a vehicle's box that face the camera, with pictures on them.
 *
 * @param corners - the four ground corners, as {@link boxCorners} gives them
 * @param storey - how high this stack of walls goes
 * @param sheetFor - the picture for one wall, or null to fall back to paint
 * @remarks
 * Only the two walls that face the camera are painted. The corners run
 * clockwise on a screen whose y points down, so the outward side of the edge
 * from one corner to the next points south exactly when the next corner lies
 * to the west; that is never true of more than two of the four, and the other
 * two would only show through the roof.
 *
 * A wall of a car is not a flat colour. The picture is stamped onto the
 * parallelogram the wall makes on screen: across it along the ground edge, up
 * it by the height. That is an ordinary affine transform, which is why one
 * `drawImage` can put a row of wheels onto a car standing at any angle.
 */
function panels(
  ctx: CanvasRenderingContext2D,
  view: View,
  corners: readonly Vec[],
  walls: readonly VehicleSide[],
  storey: Storey,
  sheetFor: (face: VehicleFace) => HTMLCanvasElement | null,
): void {
  // **Every** wall, furthest first. Throwing away the ones facing away is the
  // obvious optimisation and it is the wrong one here: the roof of a storey is
  // drawn as its own picture at its own height, so where a rear wall was culled
  // there was nothing at all between the roof above and the bodywork below -
  // a slot of daylight through the car, on whichever side happened to face
  // away. Painted back to front they simply lie under what covers them.
  const lean = storey.lean;
  const shown = corners.map((from, at) => {
    const to = corners[(at + 1) % corners.length] ?? from;
    return { at, from, to, depth: (from.y + to.y) / 2 };
  });
  shown.sort((one, other) => one.depth - other.depth);
  for (const wall of shown) {
    const at = wall.at;
    const side = walls[at];
    const face = side?.face ?? null;
    // The top edge of this wall. An end wall follows the lean; a flank does
    // not, because the picture on a flank has the slope of both screens drawn
    // into it already and leaning it as well would count the slope twice.
    const upper =
      lean === null || face === "flank" || face === null
        ? { from: wall.from, to: wall.to }
        : {
            from: lean[at] ?? wall.from,
            to: lean[(at + 1) % corners.length] ?? wall.to,
          };
    const footFrom = project(view, wall.from.x, wall.from.y);
    const footTo = project(view, wall.to.x, wall.to.y);
    const capFrom = project(view, upper.from.x, upper.from.y);
    const capTo = project(view, upper.to.x, upper.to.y);
    const quad = new Path2D();
    quad.moveTo(footFrom.x, footFrom.y - storey.base);
    quad.lineTo(footTo.x, footTo.y - storey.base);
    quad.lineTo(capTo.x, capTo.y - storey.top);
    quad.lineTo(capFrom.x, capFrom.y - storey.top);
    quad.closePath();

    // A wall one is looking at edge on. **Its area, not its width**: this
    // projection leaves x alone and squashes y, so the two corners of a nose
    // are the same distance apart on screen whichever way the car points - it
    // is the parallelogram between them that collapses. Drawn anyway, all one
    // sees of the wall is a squeezed stripe of whatever its picture is darkest
    // at: a black line standing on the road at the nose of every car seen from
    // the side, and another at its tail. It hides nothing either - the roof
    // above it and the bodywork below it meet without its help.
    const along = { x: capTo.x - capFrom.x, y: capTo.y - capFrom.y };
    const down = {
      x: footFrom.x - capFrom.x,
      y: footFrom.y - storey.base - (capFrom.y - storey.top),
    };
    const flat = Math.abs(along.x * down.y - along.y * down.x) < WALL_THIN;
    const sheet = face === null ? null : sheetFor(face);
    if (flat) {
      continue;
    }
    ctx.save();
    ctx.globalAlpha = storey.fade;
    if (sheet === null) {
      // A bevel between two walls: too narrow for a picture, so it takes the
      // colour of the bodywork and reads as the highlight round a corner.
      ctx.fillStyle = storey.paint;
      ctx.fill(quad);
    } else {
      // **The slice of the picture this edge is**, laid on the parallelogram
      // the wall makes: across it along the top edge, down it to the bottom.
      // Not the whole picture - the chamfers at the corners of an outline face
      // the same way the long edges do, and a whole car squeezed into the two
      // pixels of a chamfer is a black bar standing on the road at each end.
      const first = side?.start ?? 0;
      const last = side?.end ?? 1;
      const from = Math.round(first * sheet.width);
      const wide = Math.max(1, Math.round((last - first) * sheet.width));
      ctx.transform(
        along.x / wide,
        along.y / wide,
        down.x / sheet.height,
        down.y / sheet.height,
        capFrom.x,
        capFrom.y - storey.top,
      );
      if (side?.flip === true) {
        // That edge runs nose to tail, so the picture goes on the other way
        // round - otherwise the bonnet would be at the back of one flank.
        ctx.translate(wide, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        sheet,
        from,
        0,
        wide,
        sheet.height,
        0,
        0,
        wide,
        sheet.height,
      );
    }
    ctx.restore();
    if (storey.soot > 0) {
      ctx.globalAlpha = storey.soot * storey.fade;
      ctx.fillStyle = "#111827";
      ctx.fill(quad);
      ctx.globalAlpha = 1;
    }
  }
}

/** One edge of an outline: which wall it is, and which way its picture goes. */
/** What a picture laid flat on a vehicle needs to know. */
type Lid = {
  /** Which part of the picture to lay down. */
  readonly part: LidPart;
  /** The view from above, or null where none could be made. */
  readonly sheet: HTMLCanvasElement | null;
  /** The cabin, when only the roof of it is wanted. */
  readonly cabin: VehicleTiers | null;
  readonly fade: number;
  readonly soot: number;
};

/**
 * The view from above, laid flat at some height on the vehicle.
 *
 * @param height - how far off the road to lay it
 * @param lid - the picture, and how much of it to show
 * @remarks
 * Twice per car, out of one picture. Once low down, where it is the bonnet and
 * the boot, and once on top of the cabin, clipped to the cabin, where it is the
 * roof. That is the whole trick behind the stepped shape: the same drawing, cut
 * in two by the box it is laid on.
 */
function stampTop(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  height: number,
  lid: Lid,
): void {
  const outer = lid.part === "ring";
  const sheet = lid.sheet;
  if (sheet !== null) {
    const shape = VEHICLES[car.body];
    const across = shape.length + VEHICLE_MARGIN;
    const deep = shape.width + VEHICLE_MARGIN;
    const spot = project(view, car.x, car.y, height);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.scale(1, DEPTH);
    ctx.rotate(car.angle);
    ctx.globalAlpha = lid.fade;
    const cabin = lid.cabin;
    const body = outlineOf(bodyOutline(car.body));
    if (cabin !== null) {
      // The roof ends where the screens end, not where the cabin stands on the
      // body: a windscreen that leans back takes the front of the roof with
      // it. Without this the roof juts out over the glass.
      ctx.clip(outlineOf(leaning(cabinOutline(car.body), cabin)));
    } else if (outer) {
      // Everything the picture carries *outside* the bodywork: wheels, mirrors,
      // the lot. The margin with the silhouette cut out of it by the even-odd
      // rule - the silhouette, not a rectangle, or the tapered nose of the
      // bonnet would be left lying on the road.
      // The hole is cut a shade **wider** than the bodywork. The picture draws
      // the silhouette with a pen that straddles its edge, and the half of
      // that line lying outside it is the only thing the ring has left to
      // stamp: a black outline of the car laid flat on the road, which seen
      // from the side is a straight line on the ground under the sills.
      const ring = new Path2D();
      ring.rect(-across / 2, -deep / 2, across, deep);
      ring.addPath(outlineOf(grown(bodyOutline(car.body), RING_BITE)));
      ctx.clip(ring, "evenodd");
    } else if (lid.part === "body") {
      ctx.clip(body);
    }
    ctx.drawImage(sheet, -across / 2, -deep / 2, across, deep);
    if (lid.soot > 0) {
      // Only the bodywork goes black, not the margin the picture carries for
      // wheels and mirrors - that much soot reads as a stain on the road.
      ctx.globalAlpha = lid.soot * lid.fade;
      ctx.fillStyle = "#111827";
      ctx.fillRect(
        -shape.length / 2,
        -shape.width / 2,
        shape.length,
        shape.width,
      );
    }
    ctx.restore();
  }
}

/**
 * What a wreck gives off, in the seconds it has left.
 *
 * @remarks
 * Nothing at all while there is bodywork left - that is what the bar in the
 * corner is for. The smoke starts when the bar empties, and from then on it is
 * a countdown you can read from across the street: a wisp, a black plume,
 * flames, and then the bang. Each stage is a chance to get out.
 */
function drawDamage(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  now: number,
  fade: number,
): void {
  if (car.fireAt === null) {
    return;
  }
  const age = now - car.fireAt;
  const burning = age >= FIRE_STAGE;
  const thick = burning || age >= FUMES_STAGE;
  const at = project(view, car.x, car.y, CAR_HEIGHT);
  ctx.save();
  ctx.translate(at.x, at.y);
  if (burning) {
    ctx.globalAlpha = fade;
    const flames: readonly number[] = [0, 2.1, 4.2];
    for (const seed of flames) {
      const flick = 0.6 + Math.abs(Math.sin(car.fireAt * 3 + seed * 2)) * 0.4;
      const wobble = Math.sin(seed * 3) * 8;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.ellipse(wobble, -6 * flick, 7 * flick, 11 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.ellipse(
        wobble,
        -4 * flick,
        3.5 * flick,
        6 * flick,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  // The smoke: thin and grey at first, black and thick once it is serious, a
  // proper column once it is alight - and higher the closer the bang is.
  const grown = Math.min(1, age / BURN_SECONDS);
  const puffs = burning ? 4 : thick ? 3 : age >= SMOKE_STAGE ? 2 : 1;
  ctx.fillStyle = thick ? "#292524" : "#a8a29e";
  for (let puff = 0; puff < puffs; puff += 1) {
    const rise = 14 + puff * 11;
    ctx.globalAlpha = (0.4 - puff * 0.06) * (0.5 + grown / 2) * fade;
    ctx.beginPath();
    ctx.arc(
      Math.sin(puff * 2.3) * (4 + puff * 2),
      -rise,
      5 + puff * 3.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * What each sort of person wears.
 *
 * @remarks
 * The clothes are the only thing that says who somebody is, so they have to
 * carry it at eighteen pixels tall. The two gangs get the loudest pair going -
 * green and orange - because those two must be told apart across a street; the
 * rest is texture: a dark suit, a torn coat, a bright dress.
 */
function outfit(person: Person): {
  readonly shirt: string;
  readonly trousers: string;
  readonly skin: string;
  readonly hair: string;
} {
  const skin =
    person.kind === "night"
      ? // Fair, as the reference asks - and one tone for all of them, because
        // what makes her recognisable is the outfit, not the face.
        "#f7d7b5"
      : (SKINS[(person.look * 3) % SKINS.length] ?? "#f2c9a0");
  // Bleached blonde for the night crowd, whatever the rest of the head would
  // have been: it is the second thing you see after the dress.
  const hair =
    person.kind === "night"
      ? "#fde68a"
      : (HAIR[(person.look * 7) % HAIR.length] ?? "#1c1917");
  const worn: Readonly<Record<string, readonly [string, string]>> = {
    mine: ["#16a34a", "#14532d"],
    rival: ["#ea580c", "#7c2d12"],
    posh: ["#1e293b", "#0f172a"],
    bum: ["#78716c", "#57534e"],
    // The same white suit they had on inside - the stripes are drawn on by
    // the figure style, not by the colour.
    convict: ["#f8fafc", "#eceae7"],
    // And the red overall of the printing works, which is one colour from
    // collar to ankle: that is what an overall is.
    robber: ["#dc2626", "#b91c1c"],
    // A bikini in deep rose over bare skin - deep rose rather than the pink in
    // the shirt palette, because two people in the same colour would be two of
    // the same person, and this one is meant to be recognised.
    night: ["#e11d48", skin],
  };
  const pair = worn[person.kind] ?? [
    SHIRTS[person.look % SHIRTS.length] ?? "#38bdf8",
    TROUSERS[(person.look * 5) % TROUSERS.length] ?? "#1e293b",
  ];
  return { shirt: pair[0], trousers: pair[1], skin, hair };
}

/**
 * Which set of clothes a sort of person wears.
 *
 * @param kind - what sort of person
 * @returns the style the figure is drawn in
 * @remarks
 * Both gangs share one style and are told apart by colour alone: green shirt
 * and green cap, orange shirt and orange cap. Two styles that differed in cut
 * as well would say "two kinds of people" where the city means "two sides".
 */
function styleOf(kind: Person["kind"]): FigureStyle {
  const styles: Readonly<Record<string, FigureStyle>> = {
    posh: "posh",
    bum: "bum",
    night: "night",
    mine: "gang",
    rival: "gang",
    convict: "convict",
    robber: "robber",
  };
  return styles[kind] ?? "plain";
}

/** Somebody on the pavement: walking, sitting at a wall, or flat out. */
function drawPerson(
  ctx: CanvasRenderingContext2D,
  person: Person,
  view: View,
  now: number,
  fade: number,
): void {
  const worn = outfit(person);
  if (person.mood === "down" || person.mood === "floored") {
    lyingDown(
      ctx,
      view,
      person,
      { ...worn, style: styleOf(person.kind), arms: "swing", hand: "right" },
      fade,
    );
  } else {
    shadow(ctx, view, person, FOOTPRINT, FOOTPRINT * 0.8, 0, fade * 0.55);
    drawFigure(
      ctx,
      view,
      person,
      {
        ...worn,
        facing: person.heading,
        heading: person.heading,
        walked: person.walked,
        pace: person.pace,
        time: now,
        // Whoever carries something holds it out; everybody else walks with
        // their hands where hands go.
        arms: person.holds === null ? "swing" : "hold",
        hand: "right",
        style: styleOf(person.kind),
        holds: person.holds ?? undefined,
        sits: person.mood === "sitting",
      },
      fade,
    );
  }
}

/**
 * A body on the road, laid flat where it fell.
 *
 * @remarks
 * No height at all: the picture goes straight onto the tarmac with the tilt
 * and the heading and nothing else. That is the whole difference between this
 * and everybody else on the street - a figure standing up is three sprites at
 * three heights, a figure lying down is one, flat.
 */
function lyingDown(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec & { readonly heading?: number; readonly angle?: number },
  look: FigureLook,
  fade: number,
): void {
  const sheet = downSprite(look);
  if (sheet !== null) {
    const spot = project(view, at.x, at.y);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.scale(1, DEPTH);
    ctx.rotate(at.heading ?? at.angle ?? 0);
    ctx.globalAlpha = fade;
    ctx.drawImage(sheet, -DOWN_SIZE / 2, -DOWN_SIZE / 2, DOWN_SIZE, DOWN_SIZE);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

/**
 * One cat or dog: body and head, the same way people are drawn.
 *
 * @remarks
 * Two sprites at two heights, because that gap is what makes an animal stand
 * on the road rather than lie printed on it. The legs are clocked by how far
 * it has actually trotted, so a cat that stops has its feet under it.
 */
function drawAnimal(
  ctx: CanvasRenderingContext2D,
  beast: Animal,
  view: View,
  fade: number,
): void {
  const cat = beast.kind === "cat";
  const coat =
    (cat ? CATS[beast.id % CATS.length] : DOGS[beast.id % DOGS.length]) ??
    "#78716c";
  const frame =
    Math.round((beast.walked / ANIMAL_STRIDE) * TROT_FRAMES) % TROT_FRAMES;
  const back = cat ? CAT_BACK : DOG_BACK;
  shadow(
    ctx,
    view,
    beast,
    cat ? 6 : 8,
    cat ? 3.4 : 4.6,
    beast.heading,
    fade * 0.5,
  );
  ctx.globalAlpha = fade;
  stamp(
    ctx,
    animalBody(beast.kind, coat, (frame + TROT_FRAMES) % TROT_FRAMES),
    view,
    beast,
    beast.heading,
    back,
    ANIMAL_BODY_SIZE,
  );
  // The head sits forward of the shoulders as well as above them.
  const nose = {
    x: beast.x + Math.cos(beast.heading) * (cat ? 5 : 7),
    y: beast.y + Math.sin(beast.heading) * (cat ? 5 : 7),
  };
  stamp(
    ctx,
    animalHead(beast.kind, coat),
    view,
    nose,
    beast.heading,
    back + (cat ? 1.6 : 2.2),
    ANIMAL_HEAD_SIZE,
  );
  ctx.globalAlpha = 1;
}

/** How high a cat carries its back, in screen pixels. */
const CAT_BACK = 4;

/** And a dog. */
const DOG_BACK = 6;

/** How far an animal trots between two poses of the legs, in pixels. */
const ANIMAL_STRIDE = 16;

/** The colours cats come in. */
const CATS: readonly string[] = ["#1c1917", "#e7e5e4", "#a16207", "#57534e"];

/** The colours dogs come in. */
const DOGS: readonly string[] = ["#78350f", "#292524", "#d6d3d1", "#a8a29e"];

/**
 * The bar between a tractor and whatever it is dragging.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param tractor - the one doing the pulling
 * @param load - the one being pulled
 */
function drawTowBar(
  ctx: CanvasRenderingContext2D,
  view: View,
  tractor: Car,
  load: Car,
): void {
  const from = project(view, tractor.x, tractor.y, TOW_HIGH);
  const to = project(view, load.x, load.y, TOW_HIGH);
  ctx.save();
  ctx.strokeStyle = "#57534e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.strokeStyle = "#d6d3d1";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/** How high off the road the tow bar is drawn, in pixels. */
const TOW_HIGH = 8;

/**
 * The smoke off the tyres of a car that is sliding.
 *
 * @param ctx - what to paint on
 * @param car - the vehicle, for how far sideways it is going
 * @param view - where the camera is
 * @param now - the clock, so the puffs shift rather than sit still
 * @param fade - how solid to paint them
 * @remarks
 * Nothing is remembered: no skid marks lying on the road afterwards, because
 * that would mean a list of marks to keep, trim and save. Two puffs at the
 * back wheels for as long as the slide lasts say the same thing and cost
 * nothing once it is over.
 */
function drawSkid(
  ctx: CanvasRenderingContext2D,
  car: Car,
  view: View,
  now: number,
  fade: number,
): void {
  const across = Math.abs(car.slip);
  if (across < SLIP_SMOKE) {
    return;
  }
  const shape = VEHICLES[car.body];
  const hard = Math.min(1, (across - SLIP_SMOKE) / SLIP_SMOKE);
  const back = -shape.length * 0.3;
  const side = shape.width * 0.42;
  ctx.save();
  ctx.globalAlpha = fade * (0.25 + hard * 0.4);
  ctx.fillStyle = "#d6d3d1";
  for (const wheel of [-1, 1]) {
    // A little way behind where the tyre is, and drifting further back the
    // harder the car is sliding.
    for (let puff = 0; puff < SMOKE_PUFFS; puff += 1) {
      const trail = back - puff * 9 * (0.6 + hard);
      const wobble = Math.sin(now * 9 + puff * 2 + wheel) * 3;
      const at = project(
        view,
        car.x +
          Math.cos(car.angle) * trail -
          Math.sin(car.angle) * (side * wheel + wobble),
        car.y +
          Math.sin(car.angle) * trail +
          Math.cos(car.angle) * (side * wheel + wobble),
        3,
      );
      ctx.beginPath();
      ctx.ellipse(
        at.x,
        at.y,
        5 + puff * 3.5,
        (5 + puff * 3.5) * DEPTH,
        0,
        0,
        TURN,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

/** How many puffs trail off one sliding tyre. */
const SMOKE_PUFFS = 3;

/** A policeman on foot: dark blue, and always facing the player. */
function drawCop(
  ctx: CanvasRenderingContext2D,
  cop: Cop,
  view: View,
  now: number,
  fade: number,
): void {
  const worn = {
    shirt: "#1d4ed8",
    trousers: "#0f172a",
    skin: "#e8b98d",
    hair: "#1e293b",
    style: "cop" as const,
  };
  if (cop.health <= 0) {
    // A policeman dies the same way anybody else does, and lies there the same
    // way: the uniform is the only difference, and that is in the outfit.
    lyingDown(ctx, view, cop, { ...worn, arms: "swing", hand: "right" }, fade);
  } else {
    shadow(ctx, view, cop, FOOTPRINT, FOOTPRINT * 0.8, 0, fade * 0.55);
    drawFigure(
      ctx,
      view,
      cop,
      {
        ...worn,
        facing: cop.angle,
        heading: cop.angle,
        walked: cop.walked,
        pace: cop.pace,
        time: now,
        arms: "hold",
        hand: "right",
        holds: cop.holds,
      },
      fade,
    );
  }
}

/**
 * What the player's arms are doing this frame.
 *
 * @param state - the city, for the clock and the reload
 * @param weapon - what is in the hand
 * @returns the pose to draw
 * @remarks
 * A gun is held out because that is what aiming looks like. Fists are not: a
 * man walking down the street with his fist out is a man about to fall over.
 * The blow itself lasts exactly as long as the weapon needs to be ready again,
 * so the reload doubles as the length of the animation - no second clock, and
 * the picture always agrees with what the engine will let you do next.
 */
function poseOf(state: GameState, weapon: WeaponKind): ArmPose {
  const melee = WEAPONS[weapon].way === "swing";
  let pose: ArmPose;
  if (!melee) {
    pose = "hold";
  } else {
    pose = state.time < state.player.reloadAt ? "punch" : "swing";
  }
  return pose;
}

/** The player on foot: the same figure in green, with the arm he aims with. */
function drawWalker(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  fade: number,
): void {
  const player = state.player;
  if (state.time < player.floorUntil) {
    // Run over: flat on the road until the clock runs out, and the same
    // picture everybody else gets when they go down.
    lyingDown(
      ctx,
      view,
      { x: player.x, y: player.y, heading: player.heading },
      {
        shirt: "#4ade80",
        trousers: "#1e293b",
        skin: "#f2c9a0",
        hair: "#1c1917",
        style: "player",
        arms: "swing",
        hand: "right",
      },
      fade,
    );
    return;
  }
  // The shadow stays on the road while he does not: that gap is the only thing
  // on screen that says how high a man in a tilted picture is.
  const high = player.height;
  const shrink = 1 - (high / JET_CEILING) * 0.35;
  shadow(
    ctx,
    view,
    player,
    FOOTPRINT * shrink,
    FOOTPRINT * 0.8 * shrink,
    0,
    fade * 0.55 * shrink,
  );
  // Lifting is the same trick the camera uses: a step up the screen is a step
  // back along the road, so the figure is simply drawn from further up the
  // picture and nothing else in it has to know.
  const up = { x: player.x, y: player.y - high / DEPTH };
  if (high > 0) {
    thrust(ctx, view, up, state.time, fade);
  }
  drawFigure(
    ctx,
    view,
    up,
    {
      // A lighter green than the gang's, so that at a glance the bright one in
      // the middle of the screen is you and the darker ones are your people -
      // unless you have just come over a prison wall, in which case you are
      // wearing what you came over it in.
      shirt: dressed(player, "#f8fafc", "#dc2626", "#4ade80"),
      trousers: dressed(player, "#eceae7", "#b91c1c", "#1e293b"),
      skin: "#f2c9a0",
      hair: "#1c1917",
      // The body turns with the mouse, the legs go where the keys send them.
      // That is what makes walking backwards away from a patrol car look like
      // walking backwards rather than like a turn.
      facing: player.angle,
      heading: player.heading,
      walked: player.walked,
      pace: player.pace,
      time: state.time,
      arms: poseOf(state, player.weapon),
      // Fists alternate, blow by blow; anything carried stays in the hand that
      // carries it.
      hand:
        player.weapon === "fist" && player.punches % 2 === 1 ? "left" : "right",
      style: dressStyle(player),
      holds: player.weapon,
    },
    fade,
  );
}

/**
 * The two flames out of the jetpack, under a player who is off the ground.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - where the figure is drawn, already lifted
 * @param time - the clock, so the flame flickers
 * @param fade - how solid to paint it
 */
function thrust(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  time: number,
  fade: number,
): void {
  const flicker = 0.7 + Math.abs(Math.sin(time * 22)) * 0.5;
  ctx.save();
  ctx.globalAlpha = fade;
  for (const side of [-1, 1]) {
    const spot = project(view, at.x + side * 4.5, at.y + 2, 8);
    const flame = ctx.createRadialGradient(
      spot.x,
      spot.y,
      0,
      spot.x,
      spot.y,
      9 * flicker,
    );
    flame.addColorStop(0, "#fef3c7");
    flame.addColorStop(0.45, "#fb923c");
    flame.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, 5, 10 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Which figure the player is drawn as.
 *
 * @param player - the player, whose last job decides what he is wearing
 * @returns the style: prison stripes, red overall, balaclava or his own coat
 * @remarks
 * The order is the order the clothes came on in. A man who broke out of jail
 * and then robbed a bank is wearing a balaclava over prison stripes, and the
 * stripes are what the street reads first.
 */
function dressStyle(player: Player): FigureStyle {
  let style: FigureStyle;
  if (player.striped) {
    style = "convict";
  } else if (player.masked) {
    style = "robber";
  } else if (player.hooded) {
    style = "hooded";
  } else {
    style = "player";
  }
  return style;
}

/**
 * Which of three outfits the player has on.
 *
 * @param player - the player, whose last job decides what he is wearing
 * @param striped - the colour for the prison suit
 * @param masked - the colour for the red overall
 * @param own - the colour for his own clothes
 * @returns whichever of the three applies
 * @remarks
 * Two flags, three answers, and the order matters: a man who breaks out of jail
 * in a red overall is still in prison stripes when he gets outside, because the
 * stripes are what they gave him on the way in.
 */
function dressed(
  player: Player,
  striped: string,
  masked: string,
  own: string,
): string {
  return player.striped ? striped : player.masked ? masked : own;
}

/** How a figure is dressed, which way it is pointed, and where in its step. */
/**
 * Everything the picture needs about one person on their feet.
 *
 * @remarks
 * Exported because the jail draws its people with the same three sprites - see
 * ./prison-render. The city and the jail share no state at all, but a warder
 * walks the same way a policeman does, and that is worth one type.
 */
export type Figure = {
  readonly shirt: string;
  readonly trousers: string;
  readonly skin: string;
  readonly hair: string;
  /** Which way the shoulders and the head point. */
  readonly facing: number;
  /** Which way the feet are going. */
  readonly heading: number;
  /** How far this figure has walked, which is the clock of the step. */
  readonly walked: number;
  /**
   * How fast they are going, as a share of an ordinary walk.
   *
   * @remarks
   * Nought standing, one strolling, three at a run. Everything that tells a
   * walk from a run is scaled by it - the lean, the sway, the bounce - because
   * the pictures themselves cannot change: they are cached sprites, one set
   * per outfit, and a second set for running would double the memory of every
   * person in the city.
   */
  readonly pace: number;
  /** The clock, for the small motion of somebody standing still. */
  readonly time: number;
  /** What the arms are doing: swinging, holding a gun out, or striking. */
  readonly arms: ArmPose;
  /** Which hand is working. */
  readonly hand: Hand;
  /** Which set of extras to add: a tie, a torn coat, a cap. */
  readonly style: FigureStyle;
  /** What the carrying hand holds, if anything. */
  readonly holds?: WeaponKind;
  /** Whether this one is sitting on the ground rather than standing. */
  readonly sits?: boolean;
};

/**
 * The shortest way round from one angle to another.
 *
 * @param from - where it is now, in radians
 * @param to - where it is going
 * @returns the difference, between minus half a turn and half a turn
 */
function turnGap(from: number, to: number): number {
  const whole = Math.PI * 2;
  const raw = ((to - from) % whole) + whole;
  const wrapped = raw % whole;
  return wrapped > Math.PI ? wrapped - whole : wrapped;
}

/** How fast a figure can be going before the lean stops growing. */
const PACE_CAP = 3;

/** How far the body bounces with each footfall, in screen pixels. */
const BOB = 1.3;

/** How far the body swings across the line of travel, in screen pixels. */
const SWAY = 1.1;

/** How far a figure leans into its own direction, in city pixels. */
const LEAN = 1.5;

/** How much of the way to the eyes the shoulders come round. */
const SHOULDER_TURN = 0.78;

/** How fast somebody standing still breathes, in radians a second. */
const BREATH = 2.2;

/** And how far, in screen pixels. */
const BREATH_DEEP = 0.32;

/** How wide a head is against a pair of shoulders. */
const HEAD_SHARE = 0.82;

/** How high the shoulders sit above the road, in screen pixels. */
const SHOULDER = 9;

/**
 * How high the legs are drawn above the road, in screen pixels.
 *
 * @remarks
 * Not at nought. The trunk sits at {@link SHOULDER} and the head above that, so
 * legs painted flat on the tarmac hang under the figure like a separate object
 * once the camera is close. Halfway up, the trunk overlaps them and the whole
 * thing reads as one person.
 */
const LEG_RISE = 4.5;

/**
 * How much road a figure stands on, in city pixels.
 *
 * @remarks
 * Smaller than the figure looks, and lighter than a car's: a person casts a
 * patch about the size of their feet, and the further the camera is zoomed in
 * the more a shadow the size of the whole body reads as a hole in the tarmac.
 */
const FOOTPRINT = 4.6;

/**
 * One walking figure: legs drawn here, body and head stamped from ./figure-art.
 *
 * @remarks
 * The split is deliberate. **Legs** stay code: they follow the keys while the
 * body follows the mouse, so they are the one part that cannot be baked into a
 * picture of the whole person. **Body and head** are two cached sprites - all
 * the detail lives there, and detail is affordable exactly because it is
 * painted once per outfit rather than forty paths per person per frame.
 *
 * Two sprites rather than one, because they sit at different heights: shoulders
 * at {@link SHOULDER}, the head at {@link PERSON_HEIGHT}. That gap is what
 * makes a figure stand up in a tilted picture instead of lying on the road.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - where they stand, in city pixels
 * @param look - who they are and what their arms are doing
 * @param fade - how solid to paint them, from zero to one
 */
export function drawFigure(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  look: Figure,
  fade: number,
): void {
  const phase = (look.walked / STRIDE) * Math.PI * 2;
  const down = look.sits === true;
  // Sitting is the same figure, lower: shoulders and head come down towards
  // the road, and the legs are swapped for a cross-legged pair. Nothing else
  // changes, which is why it is one number and one extra sprite.
  const low = down ? SEAT : 1;
  // How much of a walk this is. Held a little above nought so that a figure
  // that has just stopped does not lose its weight between one frame and the
  // next, and capped so the cheat does not fold anybody double.
  const going = down ? 0 : Math.min(look.pace, PACE_CAP);
  // Two footfalls to a stride, so the bounce runs at twice the cycle. It does
  // **not** grow with the pace: a body that bounces higher the faster it goes
  // reads as hopping rather than running. What speeds up is the arms and the
  // legs, and they are in the sprites.
  const moving = Math.min(going, 1);
  const bob = down
    ? 0
    : Math.abs(Math.cos(phase)) * BOB * moving +
      Math.sin(look.time * BREATH) * (going > 0.05 ? 0 : BREATH_DEEP);
  // Weight goes from foot to foot, so the body swings across the line of
  // travel once per stride - the thing that makes a walk read as a walk from
  // above rather than as a sprite sliding along. Capped at a walk for the same
  // reason as the bounce.
  const sway = down ? 0 : Math.sin(phase) * SWAY * moving;
  // And the whole figure leans into where it is going. This one may grow with
  // the pace - it is an offset that sits still, not something that wobbles.
  const lean = down ? 0 : LEAN * going;
  const ahead = {
    x: at.x + Math.cos(look.heading) * lean - Math.sin(look.heading) * sway,
    y: at.y + Math.sin(look.heading) * lean + Math.cos(look.heading) * sway,
  };
  // The shoulders do not snap round to where the eyes look: they come most of
  // the way and the head does the rest, which is how anybody turns to look at
  // something while walking somewhere else.
  const shoulders =
    look.heading + turnGap(look.heading, look.facing) * SHOULDER_TURN;
  const frame =
    Math.round((look.walked / STRIDE) * SWING_FRAMES) % SWING_FRAMES;
  const worn = {
    shirt: look.shirt,
    trousers: look.trousers,
    skin: look.skin,
    hair: look.hair,
    style: look.style,
    arms: look.arms,
    hand: look.hand,
  };
  ctx.globalAlpha = fade;
  // The feet stay on the ground where the figure actually is; everything above
  // the waist leans and sways.
  stamp(
    ctx,
    legsSprite(worn, (frame + SWING_FRAMES) % SWING_FRAMES, down),
    view,
    at,
    look.heading,
    LEG_RISE * low,
    LEGS_SIZE,
  );
  stamp(
    ctx,
    bodySprite(worn, (frame + SWING_FRAMES) % SWING_FRAMES),
    view,
    ahead,
    shoulders,
    SHOULDER * low + bob,
    BODY_SIZE,
  );
  if (look.holds !== undefined) {
    inHand(ctx, view, ahead, look, frame, SHOULDER * low + bob);
  }
  // A head is narrower than a pair of shoulders. It used to be drawn the same
  // width, which is what made everybody look like a toy.
  stamp(
    ctx,
    headSprite(worn),
    view,
    ahead,
    look.facing,
    PERSON_HEIGHT * low + bob,
    HEAD_SIZE * HEAD_SHARE,
  );
  ctx.globalAlpha = 1;
}

/** How much of their height somebody sitting on the ground still has. */
const SEAT = 0.52;

/**
 * Whatever the outstretched hand is holding, drawn where the hand is.
 *
 * @remarks
 * The same little picture that lies in the street when the thing is a pickup,
 * so that what you walked over is visibly what you now carry. It is drawn
 * separately from the body sprite because the body is one picture per outfit
 * and the weapon changes with a turn of the wheel.
 */
function inHand(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  look: Figure,
  frame: number,
  rise: number,
): void {
  const held = look.holds;
  if (held === undefined || held === "fist" || held === "knuckles") {
    // A bare hand is already part of the body sprite; a knuckleduster at this
    // size would be three grey dots on it.
    return;
  }
  const hand = handAt(look.arms, frame, look.hand);
  const spot = project(view, at.x, at.y, rise);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.rotate(look.facing);
  // Small: the same picture as the one lying in the street, but held rather
  // than dropped, and a dropped one is drawn at street size.
  drawKit(ctx, { x: hand.ahead, y: hand.aside }, held, IN_HAND_SIZE);
  ctx.restore();
}

/** How big a weapon is in a hand, against the size it has on the road. */
const IN_HAND_SIZE = 0.42;

/**
 * Puts one sprite on the road, lying flat and turned to face somewhere.
 *
 * @param sheet - the picture, or null when it could not be built
 * @param span - how many city pixels across the picture stands for
 */
function stamp(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement | null,
  view: View,
  at: Vec,
  angle: number,
  rise: number,
  span: number,
): void {
  if (sheet === null) {
    return;
  }
  const spot = project(view, at.x, at.y, rise);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.rotate(angle);
  ctx.drawImage(sheet, -span / 2, -span / 2, span, span);
  ctx.restore();
}

/**
 * Whatever is in the air, drawn as what it is.
 *
 * @remarks
 * Four things share one loop in the engine and four looks here, because what
 * the player needs to read off a glance is not "something is flying" but "how
 * long have I got": a tracer is already past, a rocket can be stepped out of,
 * a grenade on the ground is a decision.
 */
function drawShot(
  ctx: CanvasRenderingContext2D,
  shot: Bullet,
  view: View,
): void {
  const head = project(view, shot.x, shot.y, SHOT_HEIGHT);
  if (shot.shape === "flame") {
    // Fire spreads as it goes and dies out at the end of its reach.
    const spent = 1 - shot.left / WEAPONS.flamer.range;
    const size = 4 + spent * 11;
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.scale(1, DEPTH);
    ctx.globalAlpha = Math.max(0, 1 - spent);
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }
  if (shot.shape === "grenade") {
    ctx.fillStyle = "#3f6212";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (shot.shape === "rocket") {
    const tail = project(
      view,
      shot.x - Math.cos(shot.angle) * 22,
      shot.y - Math.sin(shot.angle) * 22,
      SHOT_HEIGHT,
    );
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    line(ctx, head, tail);
    ctx.stroke();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 4;
    ctx.beginPath();
    line(
      ctx,
      head,
      project(
        view,
        shot.x - Math.cos(shot.angle) * 9,
        shot.y - Math.sin(shot.angle) * 9,
        SHOT_HEIGHT,
      ),
    );
    ctx.stroke();
    ctx.lineCap = "butt";
    return;
  }
  const tail = project(
    view,
    shot.x - Math.cos(shot.angle) * 10,
    shot.y - Math.sin(shot.angle) * 10,
    SHOT_HEIGHT,
  );
  ctx.strokeStyle = shot.from === "police" ? "#f8fafc" : "#fde047";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  line(ctx, head, tail);
  ctx.stroke();
  ctx.lineCap = "butt";
}

/**
 * Explosions, for the half second they last.
 *
 * @remarks
 * Drawn after everything else and over it: a blast that a roof could hide
 * would leave the player wondering what killed him.
 */
function drawBlasts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
): void {
  for (const flash of state.blasts) {
    const age = (state.time - flash.at) / BLAST_SECONDS;
    if (age >= 0 && age <= 1) {
      const spot = project(view, flash.x, flash.y);
      const size = BLAST_RADIUS * (0.4 + age * 0.8);
      ctx.save();
      ctx.translate(spot.x, spot.y);
      ctx.scale(1, DEPTH);
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

/* -------------------------------------------------------------- the box */

/** The four corners of a rotated rectangle, in city coordinates. */

/**
 * The dark patch a thing throws on the road under it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - the point on the road it stands on
 * @param halfLong - half the patch along its heading
 * @param halfWide - half the patch across it
 * @param angle - which way the thing points
 * @param fade - how solid to paint it, from zero to one
 */
export function shadow(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  halfLong: number,
  halfWide: number,
  angle: number,
  fade: number,
): void {
  const spot = project(view, at.x, at.y);
  ctx.save();
  ctx.translate(spot.x, spot.y + 2);
  ctx.scale(1, DEPTH);
  ctx.rotate(angle);
  // Soft, not a disc. A hard-edged ellipse under a car cuts straight across
  // the wheels standing on it, and a wheel with a dark band across its bottom
  // looks like a wheel with no air in it.
  ctx.scale(halfLong, halfWide);
  const dark = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  dark.addColorStop(0, "rgba(0,0,0,0.32)");
  dark.addColorStop(0.6, "rgba(0,0,0,0.24)");
  dark.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = fade;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* -------------------------------------------------------------- the map */

/**
 * The map in the corner: the whole city, and the dot that is you.
 *
 * @remarks
 * The whole city on purpose. The first version showed a patch around the player
 * roughly the size of the view - which made it a smaller copy of the screen and
 * told nobody anything. A map is for what you *cannot* see: which quarter you
 * are in, how far the job still is, from which side the police are coming.
 *
 * Flat, unlike the picture around it: a tilted map would be a picture of a map.
 * At this size a street is two pixels wide, so the city is stamped from the
 * cell grid and everything else is a dot.
 *
 * Bottom left, out of the way of the corner the eye goes to for the numbers.
 */
function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  height: number,
): void {
  const left = 12;
  const top = height - MAP_SIZE - 12;
  const scale = MAP_SIZE / CITY_SIZE;
  const at = (point: Vec) => ({
    x: left + Math.max(0, Math.min(CITY_SIZE, point.x)) * scale,
    y: top + Math.max(0, Math.min(CITY_SIZE, point.y)) * scale,
  });
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(left, top, MAP_SIZE, MAP_SIZE);

  const sheet = cityMap(state);
  if (sheet !== null) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, left, top, MAP_SIZE, MAP_SIZE);
    ctx.imageSmoothingEnabled = true;
  }

  // The cut between the four quarters, so a name in the bar has a place.
  ctx.strokeStyle = "#e2e8f0";
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(left + MAP_SIZE / 2, top);
  ctx.lineTo(left + MAP_SIZE / 2, top + MAP_SIZE);
  ctx.moveTo(left, top + MAP_SIZE / 2);
  ctx.lineTo(left + MAP_SIZE, top + MAP_SIZE / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Full strength from here: the city underneath may be half transparent, the
  // dots on top of it may not - a muted white dot on a light street is gone.
  ctx.globalAlpha = 1;

  const dot = (point: Vec, colour: string, size: number) => {
    const spot = at(point);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, size, 0, Math.PI * 2);
    ctx.fill();
  };
  for (const drop of state.pickups) {
    if (drop.backAt === null) {
      dot(drop, drop.holds === "armour" ? "#38bdf8" : "#facc15", 1.5);
    }
  }
  for (const car of state.cars) {
    if (car.kind === "police") {
      dot(car, "#2563eb", 2.5);
    }
  }
  for (const cop of state.cops) {
    dot(cop, "#60a5fa", 2);
  }
  // The night clubs, so the one place people gather can be found on purpose.
  for (const door of CLUBS) {
    club(ctx, at(door));
  }
  // And the two there is only one of. Without these, the single bank in a city
  // of four thousand blocks is a building one finds by accident or never.
  for (const door of BANK_DOORS) {
    bankMark(ctx, at(door));
  }
  for (const door of MINT_DOORS) {
    mintMark(ctx, at(door));
  }
  for (const garage of state.garages) {
    home(ctx, at(garage));
  }
  // Where the train is, so that waiting for it is a decision rather than a
  // hope: five dots, one per carriage, on the dark red line.
  for (const wagon of trainCars(state.train)) {
    dot(wagon.at, "#ef4444", 2.2);
  }
  // Three stations on a line that goes round the whole map: without a mark,
  // waiting for a train is standing on a rail and hoping.
  for (const stop of STATIONS) {
    station(
      ctx,
      at({ x: (stop.col + 0.5) * TILE, y: (stop.row + 0.5) * TILE }),
    );
  }
  if (state.heli !== null) {
    dot(state.heli, "#93c5fd", 3);
  }
  const job = state.job;
  if (job !== null) {
    dot(
      job.loaded ? job.to : job.from,
      job.loaded ? "#22c55e" : "#facc15",
      3.5,
    );
  }

  const me = at(state.player);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(me.x, me.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, MAP_SIZE, MAP_SIZE);
  ctx.restore();
}

/**
 * The corner that says how you are doing: weapon, health, vest, money.
 *
 * @remarks
 * Top right, all four in one block, because they are read together: what is in
 * my hand, how much of me is left, and can I afford the spray shop. The weapon
 * is drawn rather than named twice - the same little picture that lies in the
 * street, so what you walked over is what you now hold.
 */
function drawStatus(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  day: boolean,
): void {
  const player = state.player;
  const gun = WEAPONS[player.weapon];
  const left = width - PANEL_WIDTH - 12;
  // With the clock switched off the panel sits where it always did; with it on
  // everything moves down by the height of the little box over it.
  const top = day ? 12 + CLOCK_HIGH + 6 : 12;
  if (day) {
    // The time, in its own box over the panel: above the health, where one
    // looks anyway.
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(left, 12, PANEL_WIDTH, CLOCK_HIGH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(left, 12, PANEL_WIDTH, CLOCK_HIGH);
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 17px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      clockText(state.time),
      left + PANEL_WIDTH / 2,
      12 + CLOCK_HIGH / 2 + 1,
    );
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(left, top, PANEL_WIDTH, PANEL_HEIGHT);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, PANEL_WIDTH, PANEL_HEIGHT);

  // The weapon in the hand, in its own box on the left of the panel.
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(left + 8, top + 8, 46, 46);
  drawKit(ctx, { x: left + 31, y: top + 31 }, player.weapon, 1.5);
  const rounds = player.ammo[slotOf(player.weapon)] ?? 0;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  // The cheat hands out everything for ever, so it says so rather than showing
  // a number that never falls.
  const endless = rounds < 0 || player.god;
  ctx.fillText(endless ? "∞" : String(rounds), left + 31, top + 68);
  // How many charges are lying out there, on the corner of the weapon box.
  // The number under it is what is left in the pouch; this one is what is
  // still live, and while any of it is, that is the number that matters.
  const live = player.weapon === "remote" ? state.charges.length : 0;
  if (live > 0) {
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(left + 50, top + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef2f2";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillText(String(live), left + 50, top + 16);
  }
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 11px system-ui, sans-serif";

  // Health, vest, and - while driving - what is left of the bodywork. Three
  // bars in the order they matter: you, your vest, your way out.
  const barLeft = left + 64;
  const barWide = PANEL_WIDTH - 76;
  bar(
    ctx,
    barLeft,
    top + 10,
    barWide,
    12,
    player.health / PLAYER_HEALTH,
    "#22c55e",
  );
  bar(
    ctx,
    barLeft,
    top + 26,
    barWide,
    8,
    player.armour / PLAYER_HEALTH,
    "#38bdf8",
  );
  const seat = carOf(state);
  if (seat !== null) {
    const shape = VEHICLES[seat.body];
    const left7 = seat.health / shape.health;
    bar(
      ctx,
      barLeft,
      top + 38,
      barWide,
      8,
      left7,
      left7 > 0.35 ? "#f59e0b" : "#ef4444",
    );
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 12px system-ui, sans-serif";
  // While driving, the name of what you are driving: the weapon is out of
  // reach anyway, and what matters is the thing with the bar under it.
  ctx.fillText(
    seat === null ? gun.name : VEHICLES[seat.body].name,
    barLeft,
    top + 52,
  );
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillStyle = "#fde047";
  ctx.fillText(`${Math.round(player.money)} €`, barLeft, top + 68);

  if (player.god) {
    ctx.fillStyle = "#f472b6";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("CHEAT", left + PANEL_WIDTH - 8, top + 68);
  }
  ctx.textAlign = "left";
  ctx.restore();
  drawStars(ctx, state, left, top + PANEL_HEIGHT + 8);
}

/**
 * The wanted level, under the panel: six slots, and the ones you have lit.
 *
 * @param left - the left edge of the panel above
 * @param top - where the row starts
 * @remarks
 * Nothing at all while the coast is clear - an empty row of grey stars is a
 * row of things to worry about that are not there. The moment there is one,
 * **all six** show, so that the size of the trouble is read off how much of the
 * row is lit rather than off counting. A new star sets the whole row flashing
 * three times, which is the only thing on the screen that moves on its own and
 * therefore the one thing that catches the eye during a chase.
 */
function drawStars(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  left: number,
  top: number,
): void {
  const player = state.player;
  if (player.stars > 0) {
    const since = state.time - player.starAt;
    // Three on-off beats over the flash, and lit in between.
    const blink =
      since < STAR_FLASH
        ? Math.floor((since / STAR_FLASH) * STAR_BEATS) % 2 === 1
        : false;
    ctx.save();
    for (let slot = 0; slot < MAX_STARS; slot += 1) {
      star(
        ctx,
        left + STAR_STEP / 2 + slot * STAR_STEP,
        top + STAR_SIZE,
        STAR_SIZE,
        slot < player.stars && !blink,
      );
    }
    ctx.restore();
  }
}

/** One five-pointed star: a grey outline, filled yellow when it is earned. */
function star(
  ctx: CanvasRenderingContext2D,
  at: number,
  middle: number,
  size: number,
  lit: boolean,
): void {
  const path = new Path2D();
  for (let point = 0; point < STAR_POINTS * 2; point += 1) {
    const turn = (point * Math.PI) / STAR_POINTS - Math.PI / 2;
    const out = point % 2 === 0 ? size : size * STAR_WAIST;
    const x = at + Math.cos(turn) * out;
    const y = middle + Math.sin(turn) * out;
    if (point === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  path.closePath();
  ctx.fillStyle = lit ? "#fde047" : "#1e293b";
  ctx.strokeStyle = lit ? "#a16207" : "#64748b";
  ctx.lineWidth = 1.5;
  ctx.fill(path);
  ctx.stroke(path);
}

/** How many on-off beats the flash has: three flashes, six beats. */
const STAR_BEATS = 6;

/** How far across the middle of a star reaches, in pixels. */
const STAR_SIZE = 9;

/** How far apart their middles sit. */
const STAR_STEP = 22;

/** How many points a star has. */
const STAR_POINTS = 5;

/** How far in the notches between the points go. */
const STAR_WAIST = 0.44;

/** How wide the corner panel is, in pixels. */
const PANEL_WIDTH = 210;

/** How tall it is. */
const PANEL_HEIGHT = 78;

/** One bar of the panel: a dark trough with a coloured fill. */
function bar(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  wide: number,
  high: number,
  share: number,
  colour: string,
): void {
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(left, top, wide, high);
  ctx.fillStyle = colour;
  ctx.fillRect(left, top, wide * Math.max(0, Math.min(1, share)), high);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, wide, high);
}

/** Where the night clubs are - the city plan never changes, so nor does this. */
const CLUBS: readonly Vec[] = doorsOf("club");

/**
 * The bank on the little map: a pediment on three columns.
 *
 * @param ctx - where to paint
 * @param spot - where on the map it goes
 * @remarks
 * A building rather than a letter. At eight pixels a "B" is a smudge, but a
 * roof over columns is a shape one recognises without reading it - and it is
 * the same blue as the ring round the door out in the street.
 */
function bankMark(ctx: CanvasRenderingContext2D, spot: Screen): void {
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.fillStyle = "#38bdf8";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.2;
  const roof = new Path2D();
  roof.moveTo(0, -5.5);
  roof.lineTo(5.5, -1.5);
  roof.lineTo(-5.5, -1.5);
  roof.closePath();
  ctx.stroke(roof);
  ctx.fill(roof);
  // Three columns and the step they stand on.
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-4.6, 5);
  ctx.lineTo(4.6, 5);
  ctx.stroke();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const column of [-3, 0, 3]) {
    ctx.moveTo(column, -1);
    ctx.lineTo(column, 4.4);
  }
  ctx.moveTo(-4.6, 5);
  ctx.lineTo(4.6, 5);
  ctx.stroke();
  ctx.restore();
}

/**
 * The printing works: a banknote with a face on it.
 *
 * @param ctx - where to paint
 * @param spot - where on the map it goes
 * @remarks
 * Gold, like the sign over its door, and deliberately nothing like the bank -
 * the two landmarks are the two ends of the same trade and the player has to
 * tell them apart out of the corner of an eye.
 */
function mintMark(ctx: CanvasRenderingContext2D, spot: Screen): void {
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.fillStyle = "#eab308";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.2;
  const note = new Path2D();
  note.rect(-6, -4, 12, 8);
  ctx.stroke(note);
  ctx.fill(note);
  // The head in the middle of it, which is what makes a rectangle a note.
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(0, 0, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * The mark for a night club on the map.
 *
 * @remarks
 * A dot would be one more dot. This is a little glass: unmistakable at six
 * pixels, and the only thing on the map that is not round.
 */
function club(ctx: CanvasRenderingContext2D, spot: Screen): void {
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.lineTo(3, -4);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 4);
  ctx.moveTo(-2.4, 4);
  ctx.lineTo(2.4, 4);
  ctx.stroke();
  ctx.strokeStyle = "#f472b6";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.lineTo(3, -4);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * The city floor as a picture, one pixel per cell.
 *
 * @param state - the city, for its cells
 * @returns the cached picture, or null if the browser gives no context
 */
function cityMap(state: GameState): HTMLCanvasElement | null {
  if (cityImage !== null) {
    return cityImage;
  }
  const sheet = document.createElement("canvas");
  sheet.width = CITY_TILES;
  sheet.height = CITY_TILES;
  const paint = sheet.getContext("2d");
  if (paint === null) {
    return null;
  }
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      paint.fillStyle =
        MAP_GROUND[state.cells[row * CITY_TILES + col] ?? "building"];
      paint.fillRect(col, row, 1, 1);
    }
  }
  mainRoads(paint);
  cityImage = sheet;
  return sheet;
}

/**
 * The through routes, drawn on the map as one thin black line each.
 *
 * @param paint - the map picture, one pixel to the square
 * @remarks
 * **The line one follows across the country.** Everything else on this map is
 * a shade of the ground it is made of, and a motorway painted over its whole
 * five squares is simply a slightly wider grey - one cannot pick it out, which
 * is the only thing a map in the corner of the screen is for.
 *
 * One pixel, down the middle. And not only in the cities: the roads **between**
 * them are the same sort of road for the person reading the map, so the country
 * routes get the same line. The dirt track up the mountain does not - it is not
 * a way of getting anywhere.
 */
function mainRoads(paint: CanvasRenderingContext2D): void {
  paint.fillStyle = MAP_MAIN;
  for (let at = 0; at < CITY_TILES; at += 1) {
    if (motorwayLine(at)) {
      for (let along = 0; along < CITY_TILES; along += 1) {
        if (inCity(at, along)) {
          paint.fillRect(at, along, 1, 1);
        }
        if (inCity(along, at)) {
          paint.fillRect(along, at, 1, 1);
        }
      }
    }
  }
  paint.strokeStyle = MAP_MAIN;
  paint.lineWidth = 1;
  paint.lineJoin = "round";
  for (const road of roadLines()) {
    if (!road.dirt) {
      paint.beginPath();
      road.points.forEach((point, at) => {
        if (at === 0) {
          paint.moveTo(point.x, point.y);
        } else {
          paint.lineTo(point.x, point.y);
        }
      });
      paint.stroke();
    }
  }
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How many stars are shown as filled, for the HUD. */
export function starsShown(state: GameState): readonly boolean[] {
  return Array.from(
    { length: MAX_STARS },
    (unused, at) => at < state.player.stars,
  );
}
