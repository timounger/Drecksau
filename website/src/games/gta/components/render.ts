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
  districtAt,
  villaBlock,
  VILLA_KERB,
  villaCell,
  VILLA_MAIN,
  villaGrounds,
  villaTook,
  villaYard,
  villaPlot,
  roadLines,
  doorsOf,
  garageBay,
  garageMouth,
  railAngle,
  railLine,
  carPark,
  builtPlot,
  prisonPlot,
  prisonHut,
  prisonUnder,
  prisonGate,
  prisonTowers,
  PRISON_FENCE,
  PRISON_SHED,
  PRISON_WING,
  houseHeight,
  roofAt,
  scatter,
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
  LEAN_MOST,
  MARK_LIFE,
  TRACK_LIFE,
  WALK_SPEED,
  type Island,
  type Mark,
  type Tread,
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
import {
  VEHICLES,
  twoWheeled,
  type VehicleBody,
} from "@/games/gta/engine/vehicles";
import {
  POLICE_PAINT as PATROL_SILVER,
  STEEL,
  VEHICLE_MARGIN,
  bodyOutline,
  cabinOutline,
  wallFaces,
  wheelStep,
  tiersOf,
  turretSprite,
  TURRET_SIZE,
  vehicleSprite,
  VAN_PAINT,
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
 * The seven colours an Opel Corsa F is sold in, in the order Opel lists them.
 *
 * @remarks
 * Power Orange, Schnee Weiß, Karbon Schwarz, Grafik Grau, Kardio Rot, Voltaik
 * Blau and Quarz Silber. All three Corsas share them: the trim level decides
 * the roof, the badge and the wheels, never the colour of the car.
 */
const CORSA_PAINT: readonly string[] = [
  "#e8541b",
  "#f1f2f4",
  "#1b1b1f",
  "#6a7079",
  "#c2102c",
  "#1f4fd8",
  "#b6bcc4",
];

/**
 * The nine colours a Golf VIII is sold in.
 *
 * @remarks
 * Off the price list rather than out of the box of crayons the rest of the
 * traffic is painted from, and it changes the look of a street: real cars are
 * grey, white and black far more often than they are red, and a row of parked
 * Golfs in these colours reads as a row of cars rather than as a paint chart.
 *
 * Three of them are pale, which is the one thing the old palette was careful
 * to avoid - a white car could be taken for the DMC-12, the only vehicle in
 * the city worth crossing a junction for. None of them is the DMC's bare steel
 * though, and a hatchback is not a wedge with gullwing doors, so the two are
 * still told apart by everything except a glance at the colour.
 */
const GOLF_PAINT: readonly string[] = [
  // Uranograu
  "#6c7175",
  // Pure White
  "#f0f1ef",
  // Anemonenblau Metallic
  "#2a4260",
  // Crystal Ice Blue Metallic
  "#aebfc8",
  // Delfingrau Metallic
  "#565c62",
  // Grenadillschwarz Metallic
  "#1e2124",
  // Kings Red Metallic
  "#8f1b22",
  // Oyster Silver Metallic
  "#c3c7c8",
  // Oryxweiss Perlmutteffekt
  "#f8f8f4",
];

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
  drawPickups(ctx, state, view, seen, zoom);
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
 * not on the cars that drive over it afterwards.
 *
 * **One line per tyre, not one dash per moment.** Each mark used to be drawn
 * on its own as a short capsule along the way its tyre was pointing, and in a
 * corner that is a row of tangents: every dash sticking out past the curve at
 * both ends, and the curve itself nowhere. So the marks of one tyre are
 * strung together instead and the line is run from each to the next - which is
 * the path the tyre took, and therefore the mark it left.
 *
 * Segment by segment rather than as one long path, because they fade with age
 * and the near end of a skid is darker than the far end. Round caps at the
 * joins make the segments read as one line: consecutive marks are a few pixels
 * apart and the line is five wide.
 *
 * **Two sorts of mark go down here**, and they look nothing like each other.
 * Rubber is what a tyre leaves when it is dragged: narrow, black, only out of
 * a corner taken far too fast. A tank's tracks are what sixty tons standing on
 * two strips of steel leaves everywhere it goes: as wide as the track, the
 * colour of the ground it churned, and printed the whole way along with the
 * ladder its cleats press in. Which of the two a mark is, it carries itself.
 */
function drawMarks(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
): void {
  // Gathered by tyre, in the order they were laid - which is the order they
  // are in, because the list is only ever appended to.
  const trails = new Map<string, Mark[]>();
  for (const mark of state.marks) {
    const key = `${String(mark.car)}|${String(mark.lane)}`;
    const trail = trails.get(key);
    if (trail === undefined) {
      trails.set(key, [mark]);
    } else {
      trail.push(mark);
    }
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const trail of trails.values()) {
    // **One stroke per stretch**, not one per pair of marks. Stroked pair by
    // pair, every round cap lands on the next one and the line comes out
    // beaded. A whole stretch as a single path is one smooth line.
    let piece: Mark[] = [];
    const lay = (): void => {
      const head = piece[0];
      const tail = piece[piece.length - 1];
      if (head === undefined || tail === undefined) {
        return;
      }
      const near = piece.some(
        (mark) =>
          mark.x > seen.left - TILE &&
          mark.x < seen.right + TILE &&
          mark.y > seen.top - TILE &&
          mark.y < seen.bottom + TILE,
      );
      if (near) {
        const skin = TREADS[head.tread];
        // The whole stretch at one darkness: it covers a second of skidding
        // against a fade that runs for twenty, so the difference across it is
        // a few per cent and not worth a seam.
        const age = (state.time - (head.at + tail.at) / 2) / skin.life;
        const line = new Path2D();
        piece.forEach((mark, at) => {
          const spot = project(view, mark.x, mark.y);
          if (at === 0) {
            line.moveTo(spot.x, spot.y);
          } else {
            line.lineTo(spot.x, spot.y);
          }
        });
        if (piece.length === 1) {
          // On its own it is a dot, which is what a tyre chirping once leaves.
          const spot = project(view, head.x, head.y);
          line.lineTo(spot.x, spot.y);
        }
        ctx.globalAlpha = Math.max(0, skin.dark * (1 - age));
        ctx.strokeStyle = skin.ink;
        ctx.lineWidth = skin.wide;
        ctx.stroke(line);
        if (skin.cleat) {
          // **The ladder.** A track is not a smear, it is a row of steel
          // plates, and what it leaves in the ground is every one of them
          // printed in turn. A dashed line over the band draws exactly that,
          // and it follows the curve because it is the same path.
          // **Square ends on the rungs.** The band is stroked with round caps
          // so that one stretch runs into the next without a notch, and a
          // dash an eighth as long as the line is wide, capped round, is a
          // circle either end of nothing: the dashes swell into each other
          // and what one gets back is the plain band again.
          ctx.lineCap = "butt";
          ctx.setLineDash([...TRACK_RUNG]);
          ctx.strokeStyle = TRACK_CLEAT;
          ctx.lineWidth = skin.wide * TRACK_BITE;
          ctx.stroke(line);
          ctx.setLineDash([]);
          ctx.lineCap = "round";
        }
      }
      // The next stretch starts where this one ended, or there is a gap in the
      // line where one stretch hands over to the next.
      piece = [tail];
    };
    for (const mark of trail) {
      const last = piece[piece.length - 1];
      // **A gap ends the line.** Two skids seconds apart, or a tyre that
      // stopped marking and started again round the next corner, are two
      // marks on the road and not one line from here to there.
      const joins =
        last !== undefined &&
        mark.at - last.at < MARK_JOIN &&
        Math.hypot(mark.x - last.x, mark.y - last.y) < MARK_REACH;
      if (last !== undefined && !joins) {
        lay();
        piece = [];
      } else if (last !== undefined && mark.at - piece[0].at > MARK_STEP) {
        lay();
      }
      piece.push(mark);
    }
    lay();
  }
  ctx.restore();
}

/** What a skid mark is made of. */
const MARK_INK = "#1c1917";

/** How long a gap in time still counts as the same skid, in seconds. */
const MARK_JOIN = 0.2;

/** And how far apart two marks may be and still be joined, in pixels. */
const MARK_REACH = 40;

/** How much of a skid goes down as one stroke, in seconds. */
const MARK_STEP = 1;

/** How wide one mark is drawn, in pixels. */
const MARK_WIDE = 5;

/** How dark a fresh one is. */
const MARK_DARK = 0.5;

/** What a track pressed into the ground looks like: scuffed earth, not rubber. */
const TRACK_INK = "#4b443c";

/** And the cleat marks printed along it, which are deeper and darker. */
const TRACK_CLEAT = "#27231d";

/** How wide the band is - the width of the track that made it, in pixels. */
const TRACK_WIDE = 8;

/** How dark a fresh one is: fainter than rubber, because it is a dent. */
const TRACK_DARK = 0.42;

/** The plate and the gap between plates, in pixels along the trail. */
const TRACK_RUNG: readonly number[] = [1.8, 3.4];

/** How much of the band's width a cleat prints across. */
const TRACK_BITE = 0.94;

/**
 * How each sort of mark is drawn and how long it takes to go.
 *
 * @remarks
 * The numbers are what the two things are. Rubber is narrow, nearly black and
 * lasts; a track is the width of the steel that pressed it, the colour of
 * scuffed ground rather than of tyre, fainter because it is a dent and not a
 * stain, and gone in a third of the time - which is as much about keeping a
 * tank's endless trail inside the mark budget as about how long mud lasts.
 */
const TREADS: Readonly<Record<Tread, MarkSkin>> = {
  rubber: {
    ink: MARK_INK,
    wide: MARK_WIDE,
    dark: MARK_DARK,
    life: MARK_LIFE,
    cleat: false,
  },
  track: {
    ink: TRACK_INK,
    wide: TRACK_WIDE,
    dark: TRACK_DARK,
    life: TRACK_LIFE,
    cleat: true,
  },
};

/** How one sort of mark is drawn. */
type MarkSkin = {
  /** What it is coloured. */
  readonly ink: string;
  /** How wide the band is, in pixels. */
  readonly wide: number;
  /** How dark a fresh one is. */
  readonly dark: number;
  /** And how long it takes to fade away, in seconds. */
  readonly life: number;
  /** Whether the cleats of a track are printed along it. */
  readonly cleat: boolean;
};

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
      // Two sorts of wire in this city and the same picture for both: round
      // the military base, and round a prison - which gets barbs on top of it,
      // because a prison fence is there to keep people in.
      //
      // **The gate is drawn whether or not the floor is still wire.** Opening
      // the prison turns that one square into open ground, so asking the floor
      // what to draw there would have the barrier and its two posts vanish at
      // the moment they are most worth looking at. The gate is a place, not a
      // sort of square, and the plan knows where it is.
      const gaol = prisonUnder(col, row);
      const plot = gaol === null ? null : prisonPlot(gaol.x, gaol.y);
      const way = plot === null ? null : prisonGate(plot);
      const atGate = way !== null && col === way.x && row === way.y;
      if (cell === "fence" || atGate) {
        drawFence(
          ctx,
          view,
          col,
          row,
          plot === null
            ? BASE
            : {
                left: plot.left,
                top: plot.top,
                right: plot.right - 1,
                bottom: plot.bottom - 1,
              },
          plot !== null,
          atGate,
          atGate && state.jailbreak !== null,
        );
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
 * One square of wire: round the military base, or round a prison.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - the square, across
 * @param row - the square, down
 * @param box - the rectangle the fence runs round, in squares
 * @param barbed - whether it carries barbed wire and stands on gravel
 * @param gate - whether this square is the way in
 * @remarks
 * Posts and wire rather than a wall, because that is what it is: one can see
 * the tank from outside and stand there looking at it. What stops anybody is
 * the floor underneath saying no, and the ten men behind it saying it louder.
 *
 * **Laid flat**, as a line on the ground, and not stood up. A fence is the one
 * upright thing here that is better drawn as a plan: a run of it going away
 * from the camera has no face to show - this projection squashes depth and
 * leaves width alone - so half of any standing fence comes out as a bare line
 * anyway, and the two halves never look like the same fence.
 *
 * **And the corner is a corner.** Which way a square ran used to be decided by
 * one question - is this the left or the right column? - so a corner square,
 * which is a column **and** a row, came out as an upright run only and the run
 * along the top stopped a square short at each end. Both questions are asked
 * now; and a corner square draws each of its two runs only from the middle
 * outwards, in the direction that run carries on, so the two meet in an L at
 * the corner post and neither is drawn over the other.
 */
function drawFence(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
  box: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  },
  barbed: boolean,
  gate = false,
  lifted = false,
): void {
  const at = project(view, col * TILE, row * TILE);
  const across = TILE;
  const deep = TILE * DEPTH;
  // Which runs this square carries. A corner carries two, and drawing both is
  // the whole of closing it.
  const west = col === box.left;
  const east = col === box.right;
  const north = row === box.top;
  const south = row === box.bottom;
  const upright = west || east;
  const flat = north || south;
  const corner = upright && flat;
  ctx.save();
  ctx.translate(at.x, at.y);
  if (barbed) {
    // **The sterile strip.** The ground under the wire round the base is
    // desert, and the same sand round a prison in the middle of a city is a
    // beach. What is actually kept clear between a prison fence and its wall
    // is raked gravel, so that is what this one stands on.
    ctx.fillStyle = STRIP_GRAVEL;
    ctx.fillRect(0, 0, across, deep);
  }
  if (gate) {
    // **The way in.** No wire across this square: a pair of posts and a
    // barrier over the gap, which is what the front of a prison has - one
    // drives up to it and somebody decides. It is down, like everything else
    // on the way in here.
    ctx.fillStyle = GATE_POST;
    for (const post of [0, across - GATE_POST_WIDE]) {
      ctx.fillRect(
        post,
        deep / 2 - GATE_POST_WIDE,
        GATE_POST_WIDE,
        GATE_POST_WIDE * 2,
      );
    }
    // **Down across the gap, or standing up beside its post.** A barrier that
    // is up is not a barrier that has gone: it is the same striped pole, hinged
    // at the left post and swung through a right angle, so from overhead it is
    // the same length of stripes lying **along** the square instead of across
    // it. Which is the one way this projection can show an upright pole at all.
    const from = lifted ? GATE_POST_WIDE : GATE_POST_WIDE;
    const span = lifted
      ? deep - GATE_POST_WIDE * 2
      : across - GATE_POST_WIDE * 2;
    for (let band = 0; band < BARRIER_BANDS; band += 1) {
      ctx.fillStyle = band % 2 === 0 ? BARRIER_RED : BARRIER_WHITE;
      if (lifted) {
        ctx.fillRect(
          GATE_POST_WIDE - BARRIER_THICK / 2,
          from + (span / BARRIER_BANDS) * band,
          BARRIER_THICK,
          span / BARRIER_BANDS,
        );
      } else {
        ctx.fillRect(
          from + (span / BARRIER_BANDS) * band,
          deep / 2 - BARRIER_THICK / 2,
          span / BARRIER_BANDS,
          BARRIER_THICK,
        );
      }
    }
    ctx.restore();
    return;
  }
  // Where each run starts and stops inside this square. A run through the
  // middle of a side crosses the whole square; a run that ends at a corner
  // stops at the corner post, which is the middle of the square.
  const alongFrom = corner ? (west ? across / 2 : 0) : 0;
  const alongTo = corner ? (west ? across : across / 2) : across;
  const downFrom = corner ? (north ? deep / 2 : 0) : 0;
  const downTo = corner ? (north ? deep : deep / 2) : deep;
  if (flat) {
    fenceRun(ctx, { from: alongFrom, to: alongTo }, deep / 2, false, barbed);
  }
  if (upright) {
    fenceRun(ctx, { from: downFrom, to: downTo }, across / 2, true, barbed);
  }
  // The post. On a corner it stands where the two runs meet; on a straight it
  // stands across the middle of the square.
  ctx.fillStyle = FENCE_POST;
  if (corner) {
    ctx.fillRect(
      across / 2 - POST_WIDE,
      deep / 2 - POST_WIDE,
      POST_WIDE * 2,
      POST_WIDE * 2,
    );
  } else if (upright) {
    ctx.fillRect(across / 2 - POST_WIDE, 0, POST_WIDE * 2, deep);
  } else {
    ctx.fillRect(
      0,
      deep / 2 - POST_WIDE * DEPTH,
      across,
      POST_WIDE * 2 * DEPTH,
    );
  }
  ctx.restore();
}

/**
 * One run of wire inside a square: the mesh, and the barbs along it.
 *
 * @param ctx - what to paint on, with the square's corner at the origin
 * @param span - where along the square the run starts and stops
 * @param at - how far across the square the line of it lies
 * @param upright - true where the run goes up and down rather than across
 * @param barbed - whether it carries barbed wire
 */
function fenceRun(
  ctx: CanvasRenderingContext2D,
  span: { readonly from: number; readonly to: number },
  at: number,
  upright: boolean,
  barbed: boolean,
): void {
  const thick = upright ? WIRE_WIDE : WIRE_WIDE * DEPTH;
  ctx.strokeStyle = FENCE_WIRE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  // The mesh: a few strands across the width of the wire, which at this size
  // reads as something one can see through.
  for (let strand = 1; strand < MESH; strand += 1) {
    const over = at - thick / 2 + (thick * strand) / MESH;
    if (upright) {
      ctx.moveTo(over, span.from);
      ctx.lineTo(over, span.to);
    } else {
      ctx.moveTo(span.from, over);
      ctx.lineTo(span.to, over);
    }
  }
  ctx.stroke();
  if (barbed) {
    // The barbs: a brighter strand down the middle with a tick every so often,
    // which is what a coil of it looks like from overhead.
    ctx.strokeStyle = BARB_WIRE;
    ctx.beginPath();
    for (let barb = 0; barb <= BARBS; barb += 1) {
      const part = span.from + ((span.to - span.from) * barb) / BARBS;
      if (upright) {
        ctx.moveTo(at - BARB_OUT, part);
        ctx.lineTo(at + BARB_OUT, part);
      } else {
        ctx.moveTo(part, at - BARB_OUT * DEPTH);
        ctx.lineTo(part, at + BARB_OUT * DEPTH);
      }
    }
    if (upright) {
      ctx.moveTo(at, span.from);
      ctx.lineTo(at, span.to);
    } else {
      ctx.moveTo(span.from, at);
      ctx.lineTo(span.to, at);
    }
    ctx.stroke();
  }
}

/** How many strands of wire are drawn across one run. */
const MESH = 4;

/** How wide the wire is drawn, in pixels. */
const WIRE_WIDE = 16;

/** What the mesh is drawn in. */
const FENCE_WIRE = "rgba(203,213,225,0.75)";

/** The posts. */
const FENCE_POST = "#57534e";

/** How thick one is, in pixels. */
const POST_WIDE = 2;

/** What barbed wire is drawn in. */
const BARB_WIRE = "#e2e8f0";

/** How many barbs there are to a square. */
const BARBS = 3;

/** And how far each one sticks out, in pixels. */
const BARB_OUT = 2.5;

/** What the ground between a prison fence and its wall is. */
const STRIP_GRAVEL = "#6e6a63";

/** The two posts the barrier swings between. */
const GATE_POST = "#3f3f46";

/** How thick one of them is, in pixels. */
const GATE_POST_WIDE = 4;

/** How many red and white bands the barrier pole is painted in. */
const BARRIER_BANDS = 6;

/** The red of them. */
const BARRIER_RED = "#dc2626";

/** And the white. */
const BARRIER_WHITE = "#f8fafc";

/** How thick the pole is drawn, in pixels. */
const BARRIER_THICK = 3;

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
    drawHut(ctx, view, hut);
  }
  for (const site of state.acks) {
    drawAck(ctx, view, site, state);
  }
  drawFarms(ctx, view);
  drawMountain(ctx, state, view);
}

/**
 * One barrack block on the base.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param hut - which squares of the plan it stands on
 * @remarks
 * It used to be two rectangles and a doorway: a flat green slab for the roof,
 * a darker strip for the front wall, and a black oblong in the middle of it.
 * At this scale that is a shape, not a building - and it sat on the one patch
 * of the map one has to cross on foot to get at a tank, where it is looked at
 * more closely than anything else outside the city.
 *
 * So it is built the way the thing is built, from the ground up:
 *
 * - **A concrete apron** round the foot of it, because a hut on a base stands
 *   on a poured slab rather than on the dirt, and the slab is what makes it
 *   look planted rather than laid on.
 * - **A pitched roof with a ridge down the long axis.** The two slopes get
 *   their own greens, the near one lighter because it faces the sky the camera
 *   is behind, and the seams between the roof sheets run down the fall line.
 *   Which axis is the long one decides which way the ridge goes, so the little
 *   hut at the gate is not a shrunken copy of the big one.
 * - **Vents along the ridge**, which is the detail that says army hut rather
 *   than shed: a row of them, evenly spaced, drawn as little boxes standing
 *   proud of the ridge cap.
 * - **A front wall with windows in it.** Sash windows either side of the door,
 *   as many as the frontage will take, with a frame and a sill; a plinth
 *   course along the bottom; and the shadow the eaves throw along the top.
 * - **A door with a canopy over it and a step under it**, in the middle, where
 *   the old black oblong was.
 */
function drawHut(ctx: CanvasRenderingContext2D, view: View, hut: Island): void {
  const across = (hut.right - hut.left + 1) * TILE;
  const deep = (hut.bottom - hut.top + 1) * TILE;
  const at = project(view, hut.left * TILE, hut.top * TILE, HUT_HIGH);
  const roof = deep * DEPTH;
  // Where the roof stops and the front wall begins, and where the wall meets
  // the ground.
  const eaves = at.y + roof;
  const ground = eaves + HUT_HIGH;

  // The slab it stands on, which reaches a little past it on every side.
  ctx.fillStyle = HUT_APRON;
  ctx.fillRect(
    at.x - HUT_SLAB,
    at.y - HUT_SLAB * DEPTH,
    across + HUT_SLAB * 2,
    roof + HUT_HIGH + HUT_SLAB * 2 * DEPTH,
  );

  // The front wall.
  ctx.fillStyle = HUT_WALL;
  ctx.fillRect(at.x, eaves, across, HUT_HIGH);
  // The plinth course along the bottom of it, and the eaves shadow along the
  // top: two bands that between them say which way is up.
  ctx.fillStyle = HUT_PLINTH;
  ctx.fillRect(at.x, ground - HUT_HIGH * 0.16, across, HUT_HIGH * 0.16);
  ctx.fillStyle = HUT_SHADOW;
  ctx.fillRect(at.x, eaves, across, HUT_HIGH * 0.12);

  // The windows: as many pairs as the frontage will take, with the door in the
  // middle of them.
  const bay = TILE * 0.82;
  const bays = Math.max(2, Math.floor(across / bay));
  const step = across / bays;
  const middle = Math.floor(bays / 2);
  const sill = eaves + HUT_HIGH * 0.3;
  const tall = HUT_HIGH * 0.42;
  for (let bayAt = 0; bayAt < bays; bayAt += 1) {
    if (bayAt === middle) {
      continue;
    }
    const left = at.x + bayAt * step + step * 0.28;
    const wide = step * 0.44;
    ctx.fillStyle = HUT_FRAME;
    ctx.fillRect(left - 1.5, sill - 1.5, wide + 3, tall + 3);
    ctx.fillStyle = HUT_GLASS;
    ctx.fillRect(left, sill, wide, tall);
    // The bar across the middle of the sash, and the sill under it.
    ctx.fillStyle = HUT_FRAME;
    ctx.fillRect(left, sill + tall / 2 - 0.8, wide, 1.6);
    ctx.fillStyle = HUT_SILL;
    ctx.fillRect(left - 2.5, sill + tall + 1.5, wide + 5, 2);
  }

  // The door, its canopy and its step.
  const doorWide = Math.min(step * 0.5, TILE * 0.5);
  const doorLeft = at.x + across / 2 - doorWide / 2;
  const doorTop = eaves + HUT_HIGH * 0.24;
  ctx.fillStyle = HUT_DOOR;
  ctx.fillRect(doorLeft, doorTop, doorWide, ground - doorTop);
  ctx.fillStyle = HUT_FRAME;
  ctx.fillRect(doorLeft - 1.5, doorTop - 1.5, doorWide + 3, 1.5);
  ctx.fillStyle = HUT_HANDLE;
  ctx.fillRect(
    doorLeft + doorWide * 0.78,
    doorTop + (ground - doorTop) * 0.52,
    2,
    2,
  );
  ctx.fillStyle = HUT_CANOPY;
  ctx.fillRect(doorLeft - 4, doorTop - 4.5, doorWide + 8, 3);
  ctx.fillStyle = HUT_APRON;
  ctx.fillRect(doorLeft - 3, ground, doorWide + 6, 3);

  // **The roof.** Which way the ridge runs is which way the hut is longer: a
  // pitched roof runs along the building, and a hut that is wider than it is
  // deep has its ridge across the picture rather than up and down it.
  const along = across >= deep;
  ctx.fillStyle = HUT_ROOF_BACK;
  ctx.fillRect(at.x, at.y, across, roof);
  ctx.fillStyle = HUT_ROOF_FRONT;
  if (along) {
    ctx.fillRect(at.x, at.y + roof / 2, across, roof / 2);
  } else {
    ctx.fillRect(at.x + across / 2, at.y, across / 2, roof);
  }
  // The seams between the roof sheets, which run down the fall of it - across
  // the ridge, not along it.
  ctx.strokeStyle = HUT_SEAM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (along) {
    for (let seam = at.x + bay / 2; seam < at.x + across; seam += bay / 2) {
      ctx.moveTo(seam, at.y);
      ctx.lineTo(seam, at.y + roof);
    }
  } else {
    const fall = (bay / 2) * DEPTH;
    for (let seam = at.y + fall; seam < at.y + roof; seam += fall) {
      ctx.moveTo(at.x, seam);
      ctx.lineTo(at.x + across, seam);
    }
  }
  ctx.stroke();
  // The ridge cap, and the vents standing on it.
  ctx.fillStyle = HUT_RIDGE;
  if (along) {
    ctx.fillRect(at.x, at.y + roof / 2 - 2, across, 4);
  } else {
    ctx.fillRect(at.x + across / 2 - 2, at.y, 4, roof);
  }
  ctx.fillStyle = HUT_VENT;
  ctx.strokeStyle = HUT_SEAM;
  const vents = Math.max(2, Math.floor((along ? across : deep) / TILE));
  for (let vent = 0; vent < vents; vent += 1) {
    const share = (vent + 0.5) / vents;
    const spot = along
      ? { x: at.x + across * share - 4, y: at.y + roof / 2 - 5 }
      : { x: at.x + across / 2 - 5, y: at.y + roof * share - 4 };
    ctx.fillRect(spot.x, spot.y, 9, 9);
    ctx.strokeRect(spot.x, spot.y, 9, 9);
  }

  ctx.strokeStyle = HUT_EDGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(at.x, at.y, across, roof);
}

/** The concrete slab a hut stands on. */
const HUT_APRON = "#8e8e80";

/** How far that slab reaches past the walls, in pixels. */
const HUT_SLAB = 7;

/** The paint on the walls. */
const HUT_WALL = "#556b2f";

/** The plinth course along the bottom of them. */
const HUT_PLINTH = "#454f28";

/** And the shadow the eaves throw along the top. */
const HUT_SHADOW = "#3d4c22";

/** The far slope of the roof. */
const HUT_ROOF_BACK = "#5f7333";

/** And the near one, which faces the light. */
const HUT_ROOF_FRONT = "#71873f";

/** The cap along the ridge. */
const HUT_RIDGE = "#8a9c52";

/** The seams between the roof sheets. */
const HUT_SEAM = "#46552a";

/** A vent standing on the ridge. */
const HUT_VENT = "#6e7462";

/** The line round the whole roof. */
const HUT_EDGE = "#3f4f22";

/** A window frame. */
const HUT_FRAME = "#3f4f22";

/** What is behind it. */
const HUT_GLASS = "#93a7ba";

/** The sill under it. */
const HUT_SILL = "#9a9a8c";

/** The door. */
const HUT_DOOR = "#38451d";

/** The canopy over it. */
const HUT_CANOPY = "#9a9a8c";

/** And the handle on it. */
const HUT_HANDLE = "#c9cdb0";

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
    // **Not the men in a prison yard.** Everything that moves is painted here
    // and sorted by how far down the screen it is, and a whole prison counts
    // as one thing standing at the front of its own block - so anybody inside
    // the walls is painted first and then covered by the building he is
    // standing in the middle of. That is why the convicts are drawn by
    // `drawPrison` rather than here, and the warders go with them.
    const inside =
      prisonUnder(Math.floor(cop.x / TILE), Math.floor(cop.y / TILE)) !== null;
    if (!inside && inPicture(cop, seen)) {
      movers.push({
        depth: cop.y,
        at: cop,
        paint: (fade) => drawCop(ctx, cop, view, state.time, fade),
      });
    }
  }
  const driven = carOf(state);
  // Which vehicle is standing there with its driver's door open, if any: the
  // one the player has walked up to and is climbing into.
  const board = state.player.boarding;
  const opened = board !== null && board.openAt !== null ? board.car : null;
  for (const car of state.cars) {
    if (inPicture(car, seen)) {
      const mine = car.id === driven?.id;
      movers.push({
        depth: car.y,
        at: car,
        mine,
        paint: (fade) =>
          drawCar(ctx, car, view, state.time, fade, car.id === opened),
      });
    }
  }
  if (state.player.car === null && !state.player.flying) {
    // Whatever he is standing on, if he is standing on anything.
    const under = roofAt(state.cells, state.player.x, state.player.y);
    movers.push({
      // Over the roofs he belongs in front of everything: the whole point of
      // being up there is seeing the block, and a roof painted over him would
      // make the flight look like a fall. **And on one**, for the plainer
      // reason that a man standing on a roof is on top of it - painted at his
      // own depth he would be inside the house he is standing on.
      //
      // Climbing past a house over the street he is not: down there he is
      // between the buildings like everybody else, and one of them being in
      // front of him is the picture working.
      depth:
        state.player.height >= ROOF_HEIGHT ||
        (under > 0 && state.player.height >= under)
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
  // **The shots, over everything.** A round in the air is a mark on the city
  // rather than a thing standing in it - the same sort of thing as a pickup -
  // and a mark that goes behind a wall is a mark one stops being able to read.
  // Sorted in with the buildings it was worse than that: a whole prison counts
  // as one thing standing at the front of its own block, so every round fired
  // inside the yard was painted first and then covered by the building it was
  // fired in. One shot in a gunfight one could not see.
  for (const shot of state.bullets) {
    drawShot(ctx, shot, view);
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
 * **A Sikorsky UH-60, drawn to the maker's numbers.** The fuselage is 15,25 m
 * long and 2,36 m across, so from above it is a **long, narrow pod with a boom
 * on the back of it** - a shape one would recognise before any detail on it.
 * Everything else here is that ratio times {@link HELI_LONG}:
 *
 * | | metres | share of the length | drawn |
 * | --- | --- | --- | --- |
 * | fuselage width | 2,36 | 0,155 | 7,1 |
 * | main rotor | 16,36 across | 1,07 | 24,7 radius |
 * | tail rotor | 3,35 across | 0,22 | 5,1 radius |
 * | stabilator | 4,40 across | 0,29 | 6,6 either side |
 * | wheel track | 2,97 | 0,19 | 4,5 either side |
 *
 * The details that say UH-60 rather than "a helicopter":
 *
 * - **Four blades on each rotor.** The main one had two, which is a Huey.
 * - **The tail rotor is on the right of the fin and canted twenty degrees**,
 *   which is a Black Hawk's and nobody else's - the cant is there to buy some
 *   lift out of it. Seen from above, a tail rotor disc is a **line running
 *   fore and aft**, not across the aircraft, and the cant opens that line into
 *   a thin ellipse. It used to be drawn across.
 * - **Wheels, not skids.** It has a tricycle undercarriage: two main wheels
 *   under the cabin and a tail wheel a good way up the boom, not at the end of
 *   it.
 * - **Two engine cowlings** either side of the rotor head, with the exhausts
 *   turned out and back.
 * - **A stabilator** across the boom ahead of the fin, and it is wide - most
 *   of the width of the stub wings.
 *
 * Both machines in the game are this one - the police fly it in blue, the army
 * in olive - because there is one helicopter in San Andreas and it is the same
 * aircraft either way.
 */
function paintHeli(
  ctx: CanvasRenderingContext2D,
  spot: Screen,
  angle: number,
  spin: number,
  paint: HeliPaint,
): void {
  const long = HELI_LONG / 2;
  const wide = HELI_LONG * HAWK_WIDE;
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(1, DEPTH);
  ctx.rotate(angle);
  ctx.lineJoin = "round";
  ctx.fillStyle = paint.body;
  ctx.strokeStyle = paint.trim;
  ctx.lineWidth = 1.2;

  // The boom, tapering from the back of the cabin to the foot of the fin.
  const boom = new Path2D();
  boom.moveTo(-long * HAWK_CABIN, -wide * 0.86);
  boom.lineTo(-long * HAWK_FIN, -wide * 0.34);
  boom.lineTo(-long * HAWK_FIN, wide * 0.34);
  boom.lineTo(-long * HAWK_CABIN, wide * 0.86);
  boom.closePath();
  ctx.fill(boom);
  ctx.stroke(boom);

  // The stabilator: a wing across the boom, well ahead of the fin.
  const tailplane = new Path2D();
  tailplane.roundRect(
    -long * HAWK_STAB - 1.4,
    -HELI_LONG * HAWK_SPAN,
    2.8,
    HELI_LONG * HAWK_SPAN * 2,
    0.8,
  );
  ctx.fill(tailplane);
  ctx.stroke(tailplane);

  // The fin, swept back off the end of the boom. From above it is a sliver on
  // the centre line - it is a blade standing on edge.
  const fin = new Path2D();
  fin.moveTo(-long * HAWK_FIN, -wide * 0.34);
  fin.lineTo(-long, -wide * 0.2);
  fin.lineTo(-long, wide * 0.2);
  fin.lineTo(-long * HAWK_FIN, wide * 0.34);
  fin.closePath();
  ctx.fill(fin);
  ctx.stroke(fin);

  // The cabin: a long box with a nose drawn out to a round point.
  const cabin = new Path2D();
  cabin.moveTo(-long * HAWK_CABIN, -wide);
  cabin.lineTo(long * HAWK_SHOULDER, -wide);
  cabin.quadraticCurveTo(long * 0.92, -wide * 0.82, long, -wide * 0.2);
  cabin.quadraticCurveTo(long * 1.02, 0, long, wide * 0.2);
  cabin.quadraticCurveTo(long * 0.92, wide * 0.82, long * HAWK_SHOULDER, wide);
  cabin.lineTo(-long * HAWK_CABIN, wide);
  cabin.closePath();
  ctx.fill(cabin);
  ctx.stroke(cabin);

  // The two engine cowlings either side of the rotor head, and the exhausts
  // turned out of the back of them.
  ctx.fillStyle = paint.trim;
  for (const side of [-1, 1]) {
    const pod = new Path2D();
    pod.roundRect(
      -long * 0.06,
      side > 0 ? wide * 0.46 : -wide * 0.96,
      long * 0.34,
      wide * 0.5,
      1.2,
    );
    ctx.fill(pod);
    const pipe = new Path2D();
    pipe.roundRect(
      -long * 0.06,
      side * wide * 0.74 - 0.7,
      long * 0.1,
      1.4,
      0.6,
    );
    ctx.fill(pipe);
  }

  // The stub wings over the doors, which carry the tanks.
  for (const side of [-1, 1]) {
    const wing = new Path2D();
    wing.roundRect(
      long * 0.02,
      side > 0 ? wide : -HELI_LONG * HAWK_WING,
      long * 0.2,
      HELI_LONG * HAWK_WING - wide,
      0.8,
    );
    ctx.fill(wing);
  }

  // The glass: two windscreen panes with the post between them, and a window
  // in each of the sliding doors.
  ctx.fillStyle = paint.glass;
  ctx.lineWidth = 0.6;
  for (const side of [-1, 1]) {
    const pane = new Path2D();
    pane.moveTo(long * HAWK_SHOULDER, side * wide * 0.86);
    pane.quadraticCurveTo(
      long * 0.9,
      side * wide * 0.7,
      long * 0.97,
      side * wide * 0.18,
    );
    pane.lineTo(long * 0.97, side * 0.4);
    pane.lineTo(long * HAWK_SHOULDER, side * 0.4);
    pane.closePath();
    ctx.fill(pane);
    ctx.stroke(pane);
    const door = new Path2D();
    door.roundRect(
      -long * 0.12,
      side > 0 ? wide * 0.5 : -wide * 0.94,
      long * 0.26,
      wide * 0.44,
      0.5,
    );
    ctx.fill(door);
  }

  // The undercarriage: two main wheels under the cabin and a tail wheel on the
  // boom, which is what this one has instead of skids.
  ctx.fillStyle = HAWK_TYRE;
  for (const side of [-1, 1]) {
    const wheel = new Path2D();
    wheel.roundRect(
      long * HAWK_AXLE - 1.6,
      side * HELI_LONG * HAWK_TRACK - 1,
      3.2,
      2,
      0.9,
    );
    ctx.fill(wheel);
  }
  const tail = new Path2D();
  tail.roundRect(-long * HAWK_STAB - 1.2, -0.9, 2.4, 1.8, 0.8);
  ctx.fill(tail);

  // **The tail rotor.** On the right of the fin, and canted: from above its
  // disc is a line running fore and aft, opened into a thin ellipse by the
  // twenty degrees it leans over.
  const hub = { x: -long * HAWK_ROTOR, y: wide * 0.5 };
  const lean = Math.sin((HAWK_CANT * Math.PI) / 180);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = HAWK_BLADE;
  ctx.beginPath();
  ctx.ellipse(hub.x, hub.y, TAIL_SPAN, TAIL_SPAN * lean, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = HAWK_BLADE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let blade = 0; blade < TAIL_BLADES; blade += 1) {
    const turn = -spin * 1.6 + (blade * Math.PI * 2) / TAIL_BLADES;
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(
      hub.x + Math.cos(turn) * TAIL_SPAN,
      hub.y + Math.sin(turn) * TAIL_SPAN * lean,
    );
  }
  ctx.stroke();

  // And the main rotor: four blades and the disc they sweep.
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = HAWK_BLADE;
  ctx.beginPath();
  ctx.arc(long * HAWK_MAST, 0, ROTOR_SPAN, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = HAWK_BLADE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let blade = 0; blade < ROTOR_BLADES; blade += 1) {
    const turn = spin + (blade * Math.PI * 2) / ROTOR_BLADES;
    ctx.moveTo(long * HAWK_MAST, 0);
    ctx.lineTo(
      long * HAWK_MAST + Math.cos(turn) * ROTOR_SPAN,
      Math.sin(turn) * ROTOR_SPAN,
    );
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Half the width of the fuselage, as a share of its length.
 *
 * @remarks
 * 2,36 m of 15,25 is 0,077, and it is drawn a hair over that: at forty six
 * pixels long the true ratio is seven pixels across, and seven pixels of olive
 * with two black engine decks on it leaves a fuselage one can barely see. This
 * is the one place the numbers are rounded in the machine's favour.
 */
const HAWK_WIDE = 0.088;

/** Where the cabin ends and the boom begins, as a share of half the length. */
const HAWK_CABIN = 0.08;

/** Where the shoulder of the cabin turns into the nose, the same way. */
const HAWK_SHOULDER = 0.58;

/** Where the boom ends and the fin begins. */
const HAWK_FIN = 0.9;

/** Where the stabilator and the tail wheel sit. */
const HAWK_STAB = 0.74;

/** And where the tail rotor turns. */
const HAWK_ROTOR = 0.95;

/** Where the mast stands, as a share of half the length. */
const HAWK_MAST = 0.22;

/** Where the main wheels are. */
const HAWK_AXLE = 0.26;

/** Half the stabilator span, as a share of the length: 4,40 m of 15,25. */
const HAWK_SPAN = 0.144;

/** Half the wheel track, the same way: 2,97 m of 15,25. */
const HAWK_TRACK = 0.097;

/** And half the span over the stub wings. */
const HAWK_WING = 0.164;

/** How far the tail rotor leans off the vertical, in degrees. */
const HAWK_CANT = 20;

/** What a rotor blade is drawn in. */
const HAWK_BLADE = "#e2e8f0";

/** And a tyre. */
const HAWK_TYRE = "#1c1917";

/** How many blades the tail rotor has. */
const TAIL_BLADES = 4;

/** And how long they are: 3,35 m across of a 15,25 m aircraft. */
const TAIL_SPAN = 5.1;

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

/** How many blades the rotor has - four, the way a Black Hawk's does. */
const ROTOR_BLADES = 4;

/** How far they reach from the mast: 16,36 m across of a 15,25 m aircraft. */
const ROTOR_SPAN = 24.7;

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
      // Asked of the plan, not of the floor: the player's own house has a
      // garage cut out of its middle square, and a house with a garage in it
      // is still a house.
      // **A prison swallows its neighbours.** It stands on four blocks, and
      // the three it is not anchored on must not put their own houses up
      // inside it - the floor there is prison, so a house drawn on it would
      // be a house one cannot walk into standing in a yard one cannot reach.
      const covering = prisonUnder(
        blockX * BLOCK_TILES + BLOCK_MIDDLE,
        blockY * BLOCK_TILES + BLOCK_MIDDLE,
      );
      // **And the villa swallows the block next door**, for the same reason:
      // the floor there is lawn and car park now, so a house drawn on it
      // would be a house standing on somebody's tarmac.
      const swallowed =
        (covering !== null &&
          (covering.x !== blockX || covering.y !== blockY)) ||
        villaTook(blockX, blockY);
      if (builtBlock(blockX, blockY) && !swallowed) {
        const look = scatter(blockX, blockY);
        // What it is comes from the table, so that the city and the picture
        // always agree about which corner holds the night club.
        const sort = buildingAt(blockX, blockY);
        const gaol = covering !== null;
        // **One of the three houses is yours.** It is the one with the garage
        // cut into it, so that is how it is recognised - no flag, no field,
        // just the fact that the plan put a bay here.
        //
        // **Except the villa's, which is not on the villa's block.** Its
        // property is two blocks wide and its garage is cut out of the wing,
        // three columns in from the left of a house five columns long - which
        // on this block lands the other side of the boundary. Asked by block,
        // the villa came out as an ordinary house and the plain house next
        // door as the villa's - which is to say as nothing at all, that block
        // being swallowed and never drawn. So the villa's own ground is asked
        // instead of the grid.
        const grand = villaBlock();
        const mine = grand !== null && grand.x === blockX && grand.y === blockY;
        const land = mine ? villaGrounds(blockX, blockY) : null;
        const home = state.garages.find((bay) =>
          land === null
            ? Math.floor(bay.x / span) === blockX &&
              Math.floor(bay.y / span) === blockY
            : bay.x >= land.left * TILE &&
              bay.x < land.right * TILE &&
              bay.y >= land.top * TILE &&
              bay.y < land.bottom * TILE,
        );
        // The houses of a block sit inside its ring of pavement - and inside
        // the motorway, where one runs past. Asked of the plan, not assumed.
        // A prison is the one that is built over the pavement as well, and
        // both the floor and this take that shape from the same function.
        // **The villa stands on more ground than an ordinary house.** It
        // takes the block next door as well, and the floor says the same - see
        // `villaPlot`, which both of them read.
        const box = gaol
          ? prisonPlot(blockX, blockY)
          : mine
            ? villaPlot(blockX, blockY)
            : builtPlot(blockX, blockY);
        const left = box.left * TILE;
        const top = box.top * TILE;
        const right = box.right * TILE;
        const bottom = box.bottom * TILE;
        const height = houseHeight(blockX, blockY, look) * sort.rise;
        const plot = { left, top, right, bottom };
        const foot = project(view, left, bottom);
        // **What a prison can hide is its near range, not its yard.** This
        // rectangle is what the picture asks "is the player behind this?" of,
        // and for an ordinary house the whole footprint is the right answer:
        // it is solid from front to back. A prison is not - it is a wall round
        // a hole - so the box that reaches from the front wall to the far side
        // of the block swallowed the yard as well, and a man standing in the
        // middle of the yard, in the open, with nothing whatever in front of
        // him, turned the whole prison see-through.
        //
        // So for a prison the box stops at the back of the **near range**: it
        // covers whoever is behind that wall, which is exactly who it hides,
        // and nobody in the yard beyond it.
        const capTop = gaol ? bottom - PRISON_WING * TILE : top;
        const roof = project(view, left, capTop, height);
        houses.push({
          wall: {
            depth: bottom,
            left: foot.x,
            right: foot.x + (right - left),
            top: roof.y,
            bottom: foot.y,
          },
          paint: (fade) =>
            home !== undefined
              ? drawHome(ctx, view, plot, height, sort, home, fade)
              : gaol
                ? drawPrison(
                    ctx,
                    view,
                    plot,
                    height,
                    sort,
                    state.time,
                    hunted(state, plot),
                    state.jailbreak,
                    state.cops.filter(
                      (cop) =>
                        cop.x >= plot.left &&
                        cop.x < plot.right &&
                        cop.y >= plot.top &&
                        cop.y < plot.bottom,
                    ),
                    fade,
                  )
                : drawHouse(
                    ctx,
                    view,
                    state.cells,
                    plot,
                    height,
                    look,
                    sort,
                    fade,
                  ),
        });
      }
    }
  }
  return houses;
}

/**
 * The prison: a square of cell blocks with a yard inside it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param plot - the four blocks it stands on, in city pixels
 * @param height - how tall the ranges are
 * @param sort - its colours and its name
 * @param now - the clock, for the men in the yard
 * @param fade - how solid to paint it
 * @remarks
 * It was one box the size of a house with GEFÄNGNIS written over the door,
 * which is a prison in the way a shed with BANK on it is a bank. What a prison
 * looks like from above is a **shape**, and the shape is the whole of what one
 * recognises:
 *
 * - **A range of cell blocks the whole way round**, two squares thick, closed
 *   at every corner. No gate, no gap, nothing to see through.
 * - **A watchtower on each of the four corners**, standing half as high again
 *   as the range, with a glazed cabin on top and a warder in it.
 * - **The yard in the middle**: concrete, a basketball court painted on it,
 *   benches round the edge and a hut in the middle.
 * - **And men in it.** They walk their circuits, which is what a yard is for.
 *
 * It is drawn **north to south** rather than as one box, because it has an
 * inside: the far range and its towers go down first, then the floor of the
 * yard and everything standing on it, then the near range last of all - so the
 * wall between the camera and the yard covers the yard, as a wall does.
 */
function drawPrison(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  height: number,
  sort: Building,
  now: number,
  alarm: Alarm | null,
  broken: number | null,
  warders: readonly Cop[],
  fade: number,
): void {
  const wing = PRISON_WING * TILE;
  // The building stands a square in from the footprint; the square it leaves
  // is the wire and the sterile strip inside it, which the ground pass draws.
  const wired = PRISON_FENCE * TILE;
  const walls = {
    left: plot.left + wired,
    top: plot.top + wired,
    right: plot.right - wired,
    bottom: plot.bottom - wired,
  };
  const yard = {
    left: walls.left + wing,
    top: walls.top + wing,
    right: walls.right - wing,
    bottom: walls.bottom - wing,
  };
  const range = {
    high: height,
    wall: sort.wall,
    roof: sort.roof,
    bars: true,
    tower: false,
  };
  const wall = { ...range, bars: false };

  // The far range first, then the yard, then the near one.
  prisonBox(ctx, view, { ...walls, bottom: walls.top + wing }, range, fade);
  prisonBox(
    ctx,
    view,
    {
      left: walls.left,
      top: walls.top + wing,
      right: walls.left + wing,
      bottom: walls.bottom - wing,
    },
    wall,
    fade,
  );
  prisonBox(
    ctx,
    view,
    {
      left: walls.right - wing,
      top: walls.top + wing,
      right: walls.right,
      bottom: walls.bottom - wing,
    },
    wall,
    fade,
  );
  towerAt(ctx, view, walls.left, walls.top, height, fade);
  towerAt(ctx, view, walls.right - TILE, walls.top, height, fade);

  yardFloor(ctx, view, yard, fade);
  // **The lights go out with the last man.** A swept yard over a yard full of
  // bodies is a building claiming something its own ground denies.
  if (broken === null) {
    searchlights(ctx, view, plot, yard, now, alarm, fade);
  }
  // What stands in the yard, north to south: the hut, then the men, then the
  // benches along the near edge. The hut is on the square the floor made
  // solid, which is a rounding both sides have to do the same way.
  const cell = prisonHut({
    left: plot.left / TILE,
    top: plot.top / TILE,
    right: plot.right / TILE,
    bottom: plot.bottom / TILE,
  });
  const shed = {
    left: cell.x * TILE,
    top: cell.y * TILE,
    right: (cell.x + PRISON_SHED) * TILE,
    bottom: (cell.y + PRISON_SHED) * TILE,
  };
  const shedHigh = height * HUT_RISE;
  prisonBox(ctx, view, shed, { ...wall, high: shedHigh }, fade);
  workshop(ctx, view, shed, shedHigh, now, fade);
  yardFolk(ctx, view, yard, walls, now, broken, fade);

  prisonBox(ctx, view, { ...walls, top: walls.bottom - wing }, range, fade);
  gateway(ctx, view, walls, height, broken !== null, fade);
  towerAt(ctx, view, walls.left, walls.bottom - TILE, height, fade);
  towerAt(ctx, view, walls.right - TILE, walls.bottom - TILE, height, fade);

  // **And the men who are paid to be there**, on the same ground and in the
  // same pass as the men who are not. They are ordinary policemen out of
  // `state.cops` - the six who hold the yard, and whoever else has walked in
  // through the gate since it was opened - drawn here rather than with the
  // rest of the city's traffic because the building would otherwise be painted
  // straight over them, and drawn **last** so that the near range and the two
  // towers standing in front of them cannot do it either.
  //
  // **All six of them on the grass, and nobody at a window.** The cabins used
  // to have a figure painted into each of them, and that figure was the
  // trouble: it looked like the man who was shooting and it could not be shot
  // back at. A man drawn in a tower stands on a square of building, and a wall
  // stops every round fired at whoever is behind it - measured, a man on the
  // tower square took nothing at all from twelve seconds of machine-gun fire
  // from ten yards away.
  //
  // Drawing him in the cabin and leaving his hitbox on the grass below fixes
  // the shooting and breaks the picture instead: aiming here is flat, so he
  // came out hovering over the yard a good yard clear of his own tower. So the
  // cabins are empty and the four of them stand at the feet of their towers,
  // where one can see them and hit them. What says a tower is manned is its
  // searchlight, and that goes out with the last of them.
  for (const cop of warders) {
    drawCop(ctx, cop, view, now, fade);
  }

  // And its name over the middle of the near range, like every other place
  // with one - over the middle of it rather than across the whole front,
  // because the front is six hundred pixels wide and a sign that long is a
  // hoarding.
  const middle = (walls.left + walls.right) / 2;
  const board = ((walls.right - walls.left) * SIGN_SHARE) / 2;
  signOver(
    ctx,
    view,
    { ...walls, left: middle - board, right: middle + board },
    height,
    sort,
    fade,
  );
}

/** How much of the front the name board takes up. */
const SIGN_SHARE = 0.34;

/** The middle square of a block, for asking what stands on it. */
const BLOCK_MIDDLE = BLOCK_TILES / 2;

/** Half of anything, which the yard markings need rather a lot of. */
const HALF = 0.5;

/**
 * The floor of the yard: grass, the court worn into it, and the benches.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param yard - the open ground inside the ranges, in city pixels
 * @param fade - how solid to paint it
 * @remarks
 * **A yard is a field with a court worn into it**, not a concrete apron. It
 * was concrete, and concrete has no history in it: every square foot of it
 * looks the same whether a thousand men have walked there or none.
 *
 * So the ground is grass, and what the men have done to it shows. Under each
 * basket - where everybody stands, turns and lands, all day, every day - the
 * grass is gone and the bare earth is through, and it fades back into the
 * green rather than stopping at a line, because that is what worn ground does.
 * The lines of the court are painted straight onto that.
 *
 * All of it flat on the ground, so all of it is one shape after another in the
 * same projection the road markings use.
 */
function yardFloor(
  ctx: CanvasRenderingContext2D,
  view: View,
  yard: { left: number; top: number; right: number; bottom: number },
  fade: number,
): void {
  const wide = yard.right - yard.left;
  const deep = yard.bottom - yard.top;
  const at = project(view, yard.left, yard.top);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = YARD_GRASS;
  ctx.fillRect(at.x, at.y, wide, deep * DEPTH);

  // **The court stands up the yard, not across it.** A basketball court is
  // nearly twice as long as it is wide, and the long way of it is the way one
  // plays: basket to basket. Laid the other way round - wide and shallow - it
  // reads as a tennis court with the net missing. It sits in the middle of the
  // yard, with the workshop up in one corner and the benches either side of
  // it.
  const court = {
    left: yard.left + wide * (COURT_IN + COURT_OVER),
    right: yard.right - wide * (COURT_IN - COURT_OVER),
    top: yard.top + deep * COURT_TOP,
    bottom: yard.top + deep * COURT_LOW,
  };
  const box = project(view, court.left, court.top);
  const across = court.right - court.left;
  const down = (court.bottom - court.top) * DEPTH;

  // The ground under each basket, walked bare and fading back into the grass.
  for (const end of [0, 1]) {
    const line = box.y + down * end;
    const into = end === 0 ? 1 : -1;
    const spot = { x: box.x + across / 2, y: line + into * down * WORN_IN };
    const reach = across * WORN_WIDE;
    const worn = ctx.createRadialGradient(
      spot.x,
      spot.y,
      0,
      spot.x,
      spot.y,
      reach,
    );
    worn.addColorStop(0, WORN_EARTH);
    worn.addColorStop(WORN_SOLID, WORN_EARTH);
    worn.addColorStop(1, WORN_GONE);
    ctx.fillStyle = worn;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, reach, reach * DEPTH, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // The lines, painted straight onto whatever is under them.
  ctx.strokeStyle = COURT_PAINT;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(box.x, box.y, across, down);
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + down / 2);
  ctx.lineTo(box.x + across, box.y + down / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    box.x + across / 2,
    box.y + down / 2,
    across * COURT_RING,
    across * COURT_RING * DEPTH,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  for (const end of [0, 1]) {
    const line = box.y + down * end;
    const into = end === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.rect(
      box.x + across * (HALF - COURT_KEY / 2),
      line,
      across * COURT_KEY,
      down * COURT_DEEP * into,
    );
    ctx.stroke();
    basket(ctx, box.x + across / 2, line, across * COURT_POST, into);
    ctx.strokeStyle = COURT_PAINT;
  }

  // The benches: a pair down each side of the court, standing on end so they
  // face it. Laid across, as they were, one sits with one own back to the game.
  for (const side of [-1, 1]) {
    for (let seat = 0; seat < BENCHES; seat += 1) {
      bench(ctx, view, benchAt(yard, side, seat), fade);
    }
  }
  ctx.restore();
}

/**
 * One basket, seen from above.
 *
 * @param ctx - what to paint on
 * @param x - the middle of the end line, on screen
 * @param y - the end line itself
 * @param wide - how wide the backboard is, in pixels
 * @param into - which way the court lies from it: 1 for the far end, -1 near
 * @remarks
 * It was an orange circle. A basket is four things, and from above one can see
 * all four: the **post** and the arm that carries it out over the line, the
 * **backboard** with its target square painted on it, the **ring** bolted to
 * the front of that, and the **net** hanging inside the ring - which from
 * overhead is the one thing that makes the ring read as a hoop rather than as
 * a painted circle, because one looks straight down through it.
 *
 * Everything is drawn from the end line outwards, so the same routine does
 * both ends: `into` is the way the court goes, and the post is always the
 * other way.
 */
function basket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wide: number,
  into: number,
): void {
  const back = -into;
  ctx.save();
  // The post, behind the line, and the arm out to the board.
  ctx.fillStyle = HOOP_STEEL;
  ctx.fillRect(
    x - HOOP_POST / 2,
    y + back * HOOP_STAND - HOOP_POST / 2,
    HOOP_POST,
    HOOP_POST,
  );
  ctx.fillRect(
    x - HOOP_ARM / 2,
    y + Math.min(0, back * HOOP_STAND),
    HOOP_ARM,
    HOOP_STAND,
  );
  // The backboard, and the target square on it.
  ctx.fillStyle = HOOP_EDGE;
  ctx.fillRect(x - wide / 2, y - HOOP_BOARD / 2, wide, HOOP_BOARD);
  ctx.fillStyle = COURT_BOARD;
  ctx.fillRect(
    x - wide / 2 + 1,
    y - HOOP_BOARD / 2 + 0.5,
    wide - 2,
    HOOP_BOARD - 1,
  );
  ctx.fillStyle = HOOP_TARGET;
  ctx.fillRect(
    x - wide * HOOP_SQUARE,
    y - HOOP_BOARD / 2 + 0.5,
    wide * HOOP_SQUARE * 2,
    1,
  );
  // The ring, out in front of the board, and the net hanging in it.
  const ring = { x, y: y + into * HOOP_OUT };
  ctx.strokeStyle = COURT_HOOP;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(ring.x, ring.y, HOOP_RING, HOOP_RING * DEPTH, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = HOOP_NET;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let cord = 0; cord < HOOP_CORDS; cord += 1) {
    const way = (cord / HOOP_CORDS) * Math.PI * 2;
    ctx.moveTo(
      ring.x + Math.cos(way) * HOOP_RING,
      ring.y + Math.sin(way) * HOOP_RING * DEPTH,
    );
    ctx.lineTo(
      ring.x + Math.cos(way) * HOOP_RING * HOOP_TUCK,
      ring.y + Math.sin(way) * HOOP_RING * HOOP_TUCK * DEPTH,
    );
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    ring.x,
    ring.y,
    HOOP_RING * HOOP_TUCK,
    HOOP_RING * HOOP_TUCK * DEPTH,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.restore();
}

/** How thick the backboard is, in pixels. */
const HOOP_BOARD = 3;

/** How far behind the line the post stands. */
const HOOP_STAND = 7;

/** How thick the post is. */
const HOOP_POST = 4;

/** And the arm out to the board. */
const HOOP_ARM = 2;

/** How wide the target square on the board is, as a share of it. */
const HOOP_SQUARE = 0.22;

/** How far the ring stands out in front of the board, in pixels. */
const HOOP_OUT = 4;

/** How big the ring is. */
const HOOP_RING = 3.4;

/** How many cords the net has. */
const HOOP_CORDS = 8;

/** And how far in they draw before the net closes, as a share of the ring. */
const HOOP_TUCK = 0.5;

/** What the post and the arm are made of. */
const HOOP_STEEL = "#6b7280";

/** The line round the backboard. */
const HOOP_EDGE = "#4b5563";

/** The square painted on it. */
const HOOP_TARGET = "#dc2626";

/** And what the net is. */
const HOOP_NET = "#f1f5f9";

/**
 * Where one of the benches stands.
 *
 * @param yard - the open ground, in city pixels
 * @param side - which side of the court: negative for the left
 * @param seat - which bench down that side
 * @returns its top left corner
 * @remarks
 * Its own function because two things want the answer: the floor of the yard,
 * which draws them, and the two men who are sitting down, who have to be
 * sitting on one rather than beside it.
 */
function benchAt(
  yard: { left: number; top: number; right: number; bottom: number },
  side: number,
  seat: number,
): Vec {
  const wide = yard.right - yard.left;
  const deep = yard.bottom - yard.top;
  return {
    x:
      side < 0
        ? yard.left + wide * (COURT_IN + COURT_OVER) - BENCH_OFF - BENCH_WIDE
        : yard.right - wide * (COURT_IN - COURT_OVER) + BENCH_OFF,
    y: yard.top + deep * (BENCH_FROM + BENCH_STEP * seat),
  };
}

/**
 * One bench, standing on end: a slab with its slats and the shadow under it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - its top left corner, in city pixels
 * @param fade - how solid to paint it
 * @remarks
 * Turned a quarter round from how they used to lie. A bench beside a court
 * runs **along** the touchline, so that whoever is on it is looking at the
 * game; laid across it, one sits with one shoulder to the play. The slats turn
 * with it, because slats run the length of a bench.
 */
function bench(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  fade: number,
): void {
  const spot = project(view, at.x, at.y);
  const long = BENCH_LONG * DEPTH;
  ctx.globalAlpha = fade;
  ctx.fillStyle = BENCH_SHADE;
  ctx.fillRect(spot.x + 1, spot.y + 1, BENCH_WIDE, long);
  ctx.fillStyle = BENCH_WOOD;
  ctx.fillRect(spot.x, spot.y, BENCH_WIDE, long);
  ctx.strokeStyle = BENCH_SEAM;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let slat = 1; slat < BENCH_SLATS; slat += 1) {
    const over = spot.x + (BENCH_WIDE * slat) / BENCH_SLATS;
    ctx.moveTo(over, spot.y);
    ctx.lineTo(over, spot.y + long);
  }
  ctx.stroke();
}

/**
 * The men in the yard.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param yard - the open ground, in city pixels
 * @param now - the clock
 * @param fade - how solid to paint them
 * @remarks
 * **Weather, not history.** Nobody can reach the yard on foot - the ring has
 * no way through it - so nothing in the game ever touches these men and none
 * of them needs to be in the state: where each one is comes out of the clock
 * and of where his own prison stands, the same way a traffic light's colour
 * does. That costs nothing per frame and saves carrying a dozen people per
 * prison through every save file for the sake of a yard one looks at over a
 * wall.
 *
 * Each walks his own slow ellipse round the hut at his own pace, which is what
 * an exercise yard looks like from above; two of them sit on the benches,
 * because in any yard somebody is sitting.
 */
function yardFolk(
  ctx: CanvasRenderingContext2D,
  view: View,
  yard: { left: number; top: number; right: number; bottom: number },
  walls: { left: number; top: number; right: number; bottom: number },
  now: number,
  broken: number | null,
  fade: number,
): void {
  const wide = yard.right - yard.left;
  const deep = yard.bottom - yard.top;
  const middle = {
    x: (yard.left + yard.right) / 2,
    y: (yard.top + yard.bottom) / 2,
  };
  // **The clock stops at the break.** Everything in this yard is worked out
  // from the time of day, which is what keeps it free of saved state - but a
  // man who is walking out cannot still be going round his circuit as well. So
  // once the gate is open the circuit is frozen at the moment it opened, and
  // where each man goes from there is measured off the same number.
  const clock = broken ?? now;
  const away = broken === null ? null : now - broken;
  const gate = { x: (walls.left + walls.right) / 2, y: walls.bottom };
  for (let man = 0; man < YARD_MEN; man += 1) {
    // His own dice roll, from where his prison stands, so that two prisons do
    // not have the same dozen men walking in step.
    const own = scatter(Math.round(yard.left) + man * 31, Math.round(yard.top));
    const spin = scatter(
      Math.round(yard.top) + man * 17,
      Math.round(yard.left),
    );
    const rx = wide * (WALK_IN + WALK_OUT * own);
    const ry = deep * (WALK_IN + WALK_OUT * spin);
    const pace = YARD_SLOW + (YARD_QUICK - YARD_SLOW) * own;
    const round = (spin < HALF ? -1 : 1) * (pace / ((rx + ry) / 2));
    const turn = clock * round + own * Math.PI * 2;
    const at = {
      x: middle.x + Math.cos(turn) * rx,
      y: middle.y + Math.sin(turn) * ry,
    };
    const way = Math.atan2(
      Math.sign(round) * ry * Math.cos(turn),
      -Math.sign(round) * rx * Math.sin(turn),
    );
    const leaving = walkOut(at, gate, away, man);
    if (leaving === null) {
      continue;
    }
    drawFigure(
      ctx,
      view,
      leaving.at,
      {
        shirt: CONVICT_SHIRT,
        trousers: CONVICT_TROUSERS,
        skin: CONVICT_SKIN,
        hair: CONVICT_HAIR,
        facing: leaving.gone ? leaving.way : way,
        heading: leaving.gone ? leaving.way : way,
        walked: now * (leaving.gone ? OUT_PACE : pace),
        pace: (leaving.gone ? leaving.pace : pace) / WALK_SPEED,
        time: now,
        arms: "swing",
        hand: "right",
        style: "convict",
      },
      fade,
    );
  }

  // And the two who were sitting, one on a bench down each side, each facing
  // across the court at the game - until the gate opens, when they get up and
  // go with the rest.
  for (const side of [-1, 1]) {
    const spot = benchAt(yard, side, 0);
    const sat = { x: spot.x + BENCH_WIDE / 2, y: spot.y + BENCH_LONG / 2 };
    const leaving = walkOut(sat, gate, away, side < 0 ? 0 : YARD_MEN);
    if (leaving === null) {
      continue;
    }
    drawFigure(
      ctx,
      view,
      leaving.at,
      {
        shirt: CONVICT_SHIRT,
        trousers: CONVICT_TROUSERS,
        skin: CONVICT_SKIN,
        hair: CONVICT_HAIR,
        facing: leaving.gone ? leaving.way : side < 0 ? 0 : Math.PI,
        heading: leaving.gone ? leaving.way : side < 0 ? 0 : Math.PI,
        walked: now * OUT_PACE,
        pace: leaving.pace / WALK_SPEED,
        time: now + side,
        arms: "swing",
        hand: "right",
        style: "convict",
        sits: leaving.gone ? false : away === null,
      },
      fade,
    );
  }
}

/**
 * Where one man in the yard is once the gate has been opened.
 *
 * @param from - where he was standing when it happened
 * @param gate - the doorway through the near range, in city pixels
 * @param away - how long the gate has been open, or null while it is shut
 * @param queue - his place in the line, so they do not all set off at once
 * @returns where to draw him and how, or null once he is out of sight
 * @remarks
 * **Two legs and a queue.** He crosses the yard to the gate and then walks
 * straight out of it down the road, and he sets off a moment after the man in
 * front of him - four hundred men trying to fit through one doorway at the
 * same instant is a crowd, and a crowd at this scale is a smear. A queue is
 * what a prison emptying actually looks like from above.
 *
 * Past {@link OUT_GONE} he is simply not drawn any more. He has gone; the
 * picture does not follow people home, and a yard that empties and then has
 * twelve men standing in the street outside it forever is a yard that has not
 * emptied at all.
 */
function walkOut(
  from: Vec,
  gate: Vec,
  away: number | null,
  queue: number,
): { at: Vec; way: number; pace: number; gone: boolean } | null {
  let out: { at: Vec; way: number; pace: number; gone: boolean } | null = {
    at: from,
    way: 0,
    pace: 0,
    gone: false,
  };
  const since = away === null ? null : away - queue * OUT_WAIT;
  if (since !== null && since > 0) {
    const across = Math.hypot(gate.x - from.x, gate.y - from.y);
    const legOne = across / OUT_PACE;
    if (since < legOne) {
      const part = since / legOne;
      out = {
        at: {
          x: from.x + (gate.x - from.x) * part,
          y: from.y + (gate.y - from.y) * part,
        },
        way: Math.atan2(gate.y - from.y, gate.x - from.x),
        pace: OUT_PACE,
        gone: true,
      };
    } else {
      const down = (since - legOne) * OUT_PACE;
      out =
        down > OUT_GONE
          ? null
          : {
              at: { x: gate.x, y: gate.y + down },
              way: Math.PI / 2,
              pace: OUT_PACE,
              gone: true,
            };
    }
  }
  return out;
}

/**
 * How long each man waits behind the one in front, in seconds.
 *
 * @remarks
 * Long enough that the yard empties over half a minute rather than in five
 * seconds. A prison letting go of everybody in it at once is a puff of smoke;
 * one man at a time through one doorway is something one stands and watches.
 */
const OUT_WAIT = 1.6;

/** How fast a man walks out, in pixels a second. */
const OUT_PACE = 62;

/** And how far past the gate he gets before he is out of the picture. */
const OUT_GONE = 520;

/** Whoever the searchlights of one prison have, and for how long. */
type Alarm = {
  /** Where he is, in city pixels. */
  readonly at: Vec;
  /** How long the lights have had him, in seconds. */
  readonly since: number;
};

/**
 * Whether this prison has somebody inside it, for the picture.
 *
 * @param state - the city
 * @param plot - the prison's footprint, in city pixels
 * @returns where he is and how long they have had him, or null
 * @remarks
 * The engine keeps one number for the whole alarm - {@link Player.spotted} -
 * and this is the picture reading it. Asked per prison rather than globally,
 * because there is no reason the lights of one should swing at a man standing
 * in another.
 */
function hunted(
  state: GameState,
  plot: { left: number; top: number; right: number; bottom: number },
): Alarm | null {
  const seen = state.player.spotted;
  const inside =
    state.player.x >= plot.left &&
    state.player.x < plot.right &&
    state.player.y >= plot.top &&
    state.player.y < plot.bottom;
  return seen === null || !inside
    ? null
    : {
        at: { x: state.player.x, y: state.player.y },
        since: state.time - seen,
      };
}

/**
 * The four searchlights, sweeping the yard - or all four on one man.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param plot - the prison's footprint, in city pixels
 * @param yard - the open ground inside it
 * @param now - the clock
 * @param alarm - whoever is inside, or null
 * @param fade - how solid to paint it
 * @remarks
 * **A yard nobody is watching is a lawn.** Each tower throws a beam across the
 * grass and each sweeps on its own slow arc, out of step with the others,
 * which is what makes the place look manned from the street.
 *
 * And when somebody is in there, all four swing onto him and stay. The swing
 * takes {@link LIGHT_SWING} - long enough to see it happen, short enough to be
 * a warning rather than a spectacle - and it is the only notice one gets
 * before the towers open fire, which they do {@link PRISON_AIM} after the
 * lights find him. The beams and the shots leave from the same four corners,
 * because both come out of `prisonTowers`.
 *
 * Clipped to the yard: a searchlight is a pool of light on the ground, and a
 * pool of light lying over the roof of the range it is mounted on is a lamp
 * somebody has pointed at the ceiling.
 */
function searchlights(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  yard: { left: number; top: number; right: number; bottom: number },
  now: number,
  alarm: Alarm | null,
  fade: number,
): void {
  const towers = prisonTowers({
    left: plot.left / TILE,
    top: plot.top / TILE,
    right: plot.right / TILE,
    bottom: plot.bottom / TILE,
  });
  const middle = {
    x: (yard.left + yard.right) / 2,
    y: (yard.top + yard.bottom) / 2,
  };
  const corner = project(view, yard.left, yard.top);
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    corner.x,
    corner.y,
    yard.right - yard.left,
    (yard.bottom - yard.top) * DEPTH,
  );
  ctx.clip();
  towers.forEach((tower, at) => {
    // Where it would be looking on its own, and where it is looking now.
    const base = Math.atan2(middle.y - tower.y, middle.x - tower.x);
    const sweep =
      base + Math.sin(now * SWEEP_RATE + at * SWEEP_APART) * SWEEP_ARC;
    let angle = sweep;
    let lit = BEAM_DARK;
    if (alarm !== null) {
      const onto = Math.atan2(alarm.at.y - tower.y, alarm.at.x - tower.x);
      const over = Math.min(1, alarm.since / LIGHT_SWING);
      angle = sweep + turnGap(sweep, onto) * over;
      lit = BEAM_DARK + (BEAM_LIT - BEAM_DARK) * over;
    }
    const tip = {
      x: tower.x + Math.cos(angle) * BEAM_LONG,
      y: tower.y + Math.sin(angle) * BEAM_LONG,
    };
    const side = angle + Math.PI / 2;
    const from = project(view, tower.x, tower.y);
    const one = project(
      view,
      tip.x + Math.cos(side) * BEAM_WIDE,
      tip.y + Math.sin(side) * BEAM_WIDE,
    );
    const two = project(
      view,
      tip.x - Math.cos(side) * BEAM_WIDE,
      tip.y - Math.sin(side) * BEAM_WIDE,
    );
    const end = project(view, tip.x, tip.y);
    const glow = ctx.createLinearGradient(from.x, from.y, end.x, end.y);
    glow.addColorStop(0, `rgba(254,243,199,${String(lit)})`);
    glow.addColorStop(1, "rgba(254,243,199,0)");
    ctx.globalAlpha = fade;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(one.x, one.y);
    ctx.lineTo(two.x, two.y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

/** How fast a lamp sweeps its arc, in radians a second. */
const SWEEP_RATE = 0.35;

/** How far out of step the four of them are. */
const SWEEP_APART = 1.7;

/** And how far each one swings either side of the middle of the yard. */
const SWEEP_ARC = 0.5;

/** How long the four take to come round onto somebody, in seconds. */
const LIGHT_SWING = 0.7;

/** How bright a beam is while it is only sweeping. */
const BEAM_DARK = 0.13;

/** And once it has somebody. */
const BEAM_LIT = 0.42;

/** How far a beam reaches, in pixels. */
const BEAM_LONG = 520;

/** And how wide the pool at the end of it is. */
const BEAM_WIDE = 30;

/**
 * One watchtower: the shaft, the cabin on top of it, and the warder in it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param x - the corner of the prison it stands on
 * @param y - the same, down
 * @param height - how tall the ranges are
 * @param fade - how solid to paint it
 * @param now - the clock, for the man standing in it
 * @remarks
 * **A tower is a room on a stalk**, and the room is the point of it: a plain
 * taller box on the corner is a chimney. So the shaft goes up, a cabin a good
 * deal wider than the shaft sits on top of it, its walls are glass the whole
 * way round - that is what one of these is, a glasshouse one can see out of in
 * every direction - and a warder stands inside it looking out over the wall.
 *
 * The cabin overhangs the shaft on every side, which is what makes the
 * silhouette read as a watchtower from across the block rather than as the
 * corner of the building being a bit taller than the rest of it.
 */
function towerAt(
  ctx: CanvasRenderingContext2D,
  view: View,
  corner: number,
  down: number,
  height: number,
  fade: number,
): void {
  // **On the corner of the building, not hanging off it.** Both boxes used to
  // be laid out from the corner point itself, so half of each stood out over
  // the ground outside the prison and the cabin overhung further still: four
  // turrets bolted to the outside of the wall. They are now centred on the
  // corner **square** of the range, and both fit inside it.
  const x = corner + TILE / 2;
  const y = down + TILE / 2;
  const shaft = TILE * TOWER_SHAFT;
  const cabin = TILE * TOWER_CABIN;
  const high = height * TOWER_RISE;
  prisonBox(
    ctx,
    view,
    { left: x - shaft, top: y - shaft, right: x + shaft, bottom: y + shaft },
    { high, wall: TOWER_WALL, roof: TOWER_ROOF, bars: false, tower: false },
    fade,
  );
  prisonBox(
    ctx,
    view,
    { left: x - cabin, top: y - cabin, right: x + cabin, bottom: y + cabin },
    {
      base: high,
      high: high + TILE * TOWER_ROOM,
      wall: TOWER_GLASS,
      roof: TOWER_LID,
      bars: false,
      tower: true,
    },
    fade,
  );
}

/**
 * The gate in the front of the prison.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param walls - the building, in city pixels
 * @param high - how tall its range is
 * @param fade - how solid to paint it
 * @remarks
 * **A way in that is shut.** Every prison has one place where a van goes in,
 * and it is the one thing a blank wall of cell windows does not say. So the
 * middle of the front range is an archway with a pair of steel doors across
 * it: braced, studded, and closed - the ring stays sealed, which is what the
 * floor underneath it says too.
 *
 * It lines up with the barrier in the wire out in front of it, because both
 * take their place from {@link prisonGate}: a gate one drives up to and a wall
 * behind it would be a joke at the driver's expense.
 */
function gateway(
  ctx: CanvasRenderingContext2D,
  view: View,
  walls: { left: number; top: number; right: number; bottom: number },
  high: number,
  open: boolean,
  fade: number,
): void {
  const foot = project(view, walls.left, walls.bottom);
  const middle = foot.x + (walls.right - walls.left) / 2;
  const wide = TILE * GATE_WIDE;
  const tall = high * GATE_TALL;
  ctx.save();
  ctx.globalAlpha = fade;

  // The arch: the opening cut into the wall, and the stonework round it.
  ctx.fillStyle = GATE_SURROUND;
  ctx.fillRect(
    middle - wide / 2 - GATE_JAMB,
    foot.y - tall - GATE_JAMB,
    wide + GATE_JAMB * 2,
    tall + GATE_JAMB,
  );
  ctx.fillStyle = GATE_DARK;
  ctx.fillRect(middle - wide / 2, foot.y - tall, wide, tall);

  // **The two leaves - shut, or folded back against the jambs.** A gate that
  // is open is not a gate that has vanished: both doors are still there, they
  // are simply standing flat against the wall either side of the hole, and
  // what one sees between them is the dark of the archway. Which is also the
  // only way this projection can show it, an east-facing door being a door
  // with no face to the camera at all.
  const leafWide = open ? GATE_SHUT * (wide / 2) : wide / 2;
  for (const leaf of [-1, 1]) {
    const from = leaf < 0 ? middle - wide / 2 : middle + wide / 2 - leafWide;
    ctx.fillStyle = GATE_STEEL;
    ctx.fillRect(
      from + GATE_GAP,
      foot.y - tall + GATE_GAP,
      leafWide - GATE_GAP * 2,
      tall - GATE_GAP,
    );
    // The bracing: two rails across each leaf and the studs along them.
    ctx.fillStyle = GATE_BRACE;
    for (const rail of [GATE_RAIL_LOW, GATE_RAIL_HIGH]) {
      ctx.fillRect(
        from + GATE_GAP,
        foot.y - tall * rail,
        leafWide - GATE_GAP * 2,
        GATE_BRACE_THICK,
      );
    }
  }
  // The lamp over it, which is the one light on this wall.
  ctx.fillStyle = GATE_LAMP;
  ctx.fillRect(
    middle - GATE_LAMP_WIDE / 2,
    foot.y - tall - GATE_JAMB - 1,
    GATE_LAMP_WIDE,
    2,
  );
  ctx.restore();
}

/** How much of its own width a leaf is left when it is folded back. */
const GATE_SHUT = 0.22;

/** How wide the gateway is, in squares. */
const GATE_WIDE = 1.5;

/** And how far up the wall it reaches, as a share of its height. */
const GATE_TALL = 0.82;

/** How far the stonework stands out round it, in pixels. */
const GATE_JAMB = 3;

/** The gap between a leaf and the jamb. */
const GATE_GAP = 1.5;

/** What is behind the doors. */
const GATE_DARK = "#0c0a09";

/** The stonework round the opening. */
const GATE_SURROUND = "#6b655d";

/** What the doors are made of. */
const GATE_STEEL = "#3f4650";

/** The rails braced across them. */
const GATE_BRACE = "#242a33";

/** How thick one of those is, in pixels. */
const GATE_BRACE_THICK = 2;

/** Where the lower one sits, as a share of the height of the gate. */
const GATE_RAIL_LOW = 0.3;

/** And the upper. */
const GATE_RAIL_HIGH = 0.72;

/** The lamp over the gate. */
const GATE_LAMP = "#fde68a";

/** How wide it is, in pixels. */
const GATE_LAMP_WIDE = 10;

/**
 * One block of the prison: its south wall and its roof.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param box - what it stands on, in city pixels
 * @param look - how tall, what it is painted, and what its wall carries
 * @param fade - how solid to paint it
 */
function prisonBox(
  ctx: CanvasRenderingContext2D,
  view: View,
  box: { left: number; top: number; right: number; bottom: number },
  look: {
    /** How high off the ground the wall starts: nought for anything standing
     * on it, and the top of the shaft for the cabin of a watchtower. */
    readonly base?: number;
    readonly high: number;
    readonly wall: string;
    readonly roof: string;
    readonly bars: boolean;
    readonly tower: boolean;
  },
  fade: number,
): void {
  const high = look.high;
  const base = look.base ?? 0;
  const foot = project(view, box.left, box.bottom);
  const back = project(view, box.left, box.top, high);
  const wide = box.right - box.left;
  ctx.globalAlpha = fade;
  ctx.fillStyle = look.wall;
  ctx.fillRect(foot.x, foot.y - high, wide, high - base);
  if (look.bars) {
    // **Windows with grilles over them**, not a row of scratches. Each one is
    // a reveal cut into the wall, the dark of the cell behind it, and a grille
    // of three uprights and a transom across the middle - which is the one
    // thing on the front of a building that says prison and nothing else. They
    // used to be three pixels wide with a single line down them, and at that
    // size a row of them reads as a fence painted on the wall.
    const sill = foot.y - high * CELL_SILL;
    const tall = high * CELL_TALL;
    for (
      let at = foot.x + CELL_STEP;
      at < foot.x + wide - CELL_WIDE;
      at += CELL_STEP
    ) {
      ctx.fillStyle = CELL_FRAME;
      ctx.fillRect(at - 1, sill - 1, CELL_WIDE + 2, tall + 2);
      ctx.fillStyle = CELL_GLASS;
      ctx.fillRect(at, sill, CELL_WIDE, tall);
      ctx.fillStyle = CELL_BAR;
      for (let bar = 1; bar < CELL_BARS; bar += 1) {
        ctx.fillRect(at + (CELL_WIDE * bar) / CELL_BARS - HALF, sill, 1, tall);
      }
      ctx.fillRect(at, sill + tall / 2 - HALF, CELL_WIDE, 1);
    }
  }
  ctx.fillStyle = look.roof;
  ctx.fillRect(back.x, back.y, wide, foot.y - high - back.y);
  ctx.strokeStyle = PRISON_EDGE;
  ctx.lineWidth = 1;
  ctx.strokeRect(back.x, back.y, wide, foot.y - back.y);
  ctx.beginPath();
  line(
    ctx,
    { x: foot.x, y: foot.y - high },
    { x: foot.x + wide, y: foot.y - high },
  );
  ctx.stroke();
  if (look.tower) {
    // The frame of the glasshouse: a post at each corner of the front, which
    // is what stops the glass reading as a hole in the tower.
    ctx.fillStyle = TOWER_POST;
    for (const post of [0, wide - TOWER_FRAME]) {
      ctx.fillRect(foot.x + post, foot.y - high, TOWER_FRAME, high - base);
    }
  } else {
    // The wire along the top of the wall, a pale line just inside the edge of
    // the roof, which is what one sees of it at this size.
    ctx.strokeStyle = WIRE_LINE;
    ctx.beginPath();
    line(
      ctx,
      { x: foot.x + 1, y: foot.y - high - 1.5 },
      { x: foot.x + wide - 1, y: foot.y - high - 1.5 },
    );
    ctx.stroke();
  }
}

/** How far the shaft of a tower reaches from the middle of its square. */
const TOWER_SHAFT = 0.34;

/** And the cabin on top of it, which overhangs it - but not the building. */
const TOWER_CABIN = 0.5;

/** How much taller than the range the shaft stands, as a share. */
const TOWER_RISE = 1.3;

/**
 * How tall the cabin on top of that is, in squares.
 *
 * @remarks
 * **A room, not a letterbox.** It may not get any wider - it has to stay
 * inside the corner square of the range, which is what stops the tower hanging
 * off the outside of the building - so what it can be given is height, and
 * height is most of what one sees of it anyway: the glass is a band across the
 * front of the tower, and a band twice as deep is a cabin one can see a man
 * standing up in.
 */
const TOWER_ROOM = 0.86;

/** How wide a corner post of the cabin is, in pixels. */
const TOWER_FRAME = 2.5;

/** What a watchtower shaft is painted. */
const TOWER_WALL = "#3f3a36";

/** And its roof. */
const TOWER_ROOF = "#4b4540";

/** The glass of the cabin on top. */
const TOWER_GLASS = "#33404f";

/**
 * Its lid - and it is a roof, which is why it is a colour of its own.
 *
 * @remarks
 * Dark red, so that the four corners read as towers from across the block
 * rather than as four more grey boxes on a grey building. It is the only
 * colour anywhere on the prison, and the eye goes straight to the four things
 * that matter about it.
 */
const TOWER_LID = "#7f1d1d";

/** And the posts at its corners. */
const TOWER_POST = "#2f2b28";

/**
 * The workshop in the yard: its name board, its chimney and the smoke off it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param shed - what the building stands on, in city pixels
 * @param high - how tall it is
 * @param now - the clock, for the smoke
 * @param fade - how solid to paint it
 * @remarks
 * **The name is on a board on the wall.** It used to be lettering floating in
 * the air over the roof, which is a label rather than a sign - what a works
 * has is a painted board screwed to the front of it, and at this size the
 * board is what one reads first: a pale rectangle on a dark wall, with the
 * name across it.
 *
 * And a **chimney beside it, smoking**, because that is what says the place is
 * working rather than standing empty. The smoke is four puffs off the clock,
 * each higher, wider and fainter than the one below it - the same plume the
 * burning cars use, drawn small.
 */
function workshop(
  ctx: CanvasRenderingContext2D,
  view: View,
  shed: { left: number; top: number; right: number; bottom: number },
  high: number,
  now: number,
  fade: number,
): void {
  const foot = project(view, shed.left, shed.bottom);
  const wide = shed.right - shed.left;
  ctx.save();
  ctx.globalAlpha = fade;

  // The door in the middle of the front and a window either side of it,
  // which is what a workshop has and what makes it a building rather than a
  // block with a name on it.
  ctx.fillStyle = WORKS_DOOR;
  ctx.fillRect(
    foot.x + wide * (HALF - WORKS_DOOR_WIDE / 2),
    foot.y - high * WORKS_DOOR_TALL,
    wide * WORKS_DOOR_WIDE,
    high * WORKS_DOOR_TALL,
  );
  ctx.fillStyle = WORKS_HANDLE;
  ctx.fillRect(
    foot.x + wide * (HALF + WORKS_DOOR_WIDE / 2) - 2.5,
    foot.y - high * WORKS_DOOR_TALL * HALF,
    1.5,
    1.5,
  );
  for (const side of [-1, 1]) {
    const at =
      foot.x +
      wide * (HALF + side * WORKS_WIN_OUT) -
      (wide * WORKS_WIN_WIDE) / 2;
    ctx.fillStyle = WORKS_FRAME;
    ctx.fillRect(
      at - 1,
      foot.y - high * WORKS_WIN_TOP - 1,
      wide * WORKS_WIN_WIDE + 2,
      high * WORKS_WIN_TALL + 2,
    );
    ctx.fillStyle = WORKS_GLASS;
    ctx.fillRect(
      at,
      foot.y - high * WORKS_WIN_TOP,
      wide * WORKS_WIN_WIDE,
      high * WORKS_WIN_TALL,
    );
  }

  // The board, up under the eaves, with the name across it.
  const board = {
    x: foot.x + wide * (HALF - BOARD_WIDE / 2),
    y: foot.y - high * BOARD_UP,
    w: wide * BOARD_WIDE,
    h: high * BOARD_TALL,
  };
  ctx.fillStyle = BOARD_BACK;
  ctx.fillRect(board.x, board.y, board.w, board.h);
  ctx.strokeStyle = BOARD_EDGE;
  ctx.lineWidth = 1;
  ctx.strokeRect(board.x, board.y, board.w, board.h);
  ctx.fillStyle = BOARD_INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = SHED_TEXT;
  ctx.font = `bold ${String(size)}px system-ui, sans-serif`;
  while (ctx.measureText(SHED_NAME).width > board.w - 4 && size > SHED_SMALL) {
    size -= 1;
    ctx.font = `bold ${String(size)}px system-ui, sans-serif`;
  }
  ctx.fillText(SHED_NAME, board.x + board.w / 2, board.y + board.h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // The chimney, on the far corner of the roof, and the smoke going up out of
  // it. Both are drawn from the corner of the building rather than beside it:
  // a stack standing on the grass is a pipe, a stack on the roof is a works.
  const stack = project(
    view,
    shed.right - TILE * STACK_IN,
    shed.top + TILE * STACK_IN,
    high,
  );
  ctx.fillStyle = STACK_BRICK;
  ctx.fillRect(
    stack.x - STACK_WIDE / 2,
    stack.y - STACK_HIGH,
    STACK_WIDE,
    STACK_HIGH,
  );
  ctx.fillStyle = STACK_LIP;
  ctx.fillRect(stack.x - STACK_WIDE / 2, stack.y - STACK_HIGH, STACK_WIDE, 1.5);
  for (let puff = 0; puff < STACK_PUFFS; puff += 1) {
    // Each puff drifts up and to one side on its own turn of the clock, so
    // the plume leans and breathes instead of pulsing on the spot.
    const age = (((now * STACK_RATE + puff / STACK_PUFFS) % 1) + 1) % 1;
    const up = STACK_HIGH + age * STACK_RISE;
    const size = STACK_SMALL + age * STACK_GROW;
    ctx.globalAlpha = fade * STACK_DARK * (1 - age);
    ctx.fillStyle = STACK_GREY;
    ctx.beginPath();
    ctx.ellipse(
      stack.x + Math.sin(age * Math.PI + puff) * STACK_LEAN,
      stack.y - up,
      size,
      size * DEPTH,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** What is written on the board on the workshop. */
const SHED_NAME = "Prison Industry";

/** How big, in pixels, and how small it may shrink to fit the board. */
const SHED_TEXT = 8;

/** The floor of that. */
const SHED_SMALL = 5;

/** How wide the board is, as a share of the front of the building. */
const BOARD_WIDE = 0.86;

/** How tall, as a share of its height. */
const BOARD_TALL = 0.26;

/** And how far up the wall the top of it sits, the same way. */
const BOARD_UP = 0.97;

/** How wide the door is, as a share of the front. */
const WORKS_DOOR_WIDE = 0.16;

/** And how far up it reaches, as a share of the height. */
const WORKS_DOOR_TALL = 0.55;

/** What it is painted. */
const WORKS_DOOR = "#2a2f38";

/** And the handle on it. */
const WORKS_HANDLE = "#cbd5e1";

/** How far either side of the door the windows are, as a share of the front. */
const WORKS_WIN_OUT = 0.28;

/** How wide one is, the same way. */
const WORKS_WIN_WIDE = 0.18;

/** How far up the wall its top is, as a share of the height. */
const WORKS_WIN_TOP = 0.56;

/** And how deep it is. */
const WORKS_WIN_TALL = 0.24;

/** What is behind it. */
const WORKS_GLASS = "#20303f";

/** And the frame round it. */
const WORKS_FRAME = "#7a736a";

/** What the board is painted. */
const BOARD_BACK = "#0f172a";

/** The line round it. */
const BOARD_EDGE = "#64748b";

/** And the name on it. */
const BOARD_INK = "#f8fafc";

/** How far in from the corner of the roof the chimney stands, in squares. */
const STACK_IN = 0.3;

/** How wide it is, in pixels. */
const STACK_WIDE = 5;

/** And how high it stands off the roof. */
const STACK_HIGH = 13;

/** What it is built of. */
const STACK_BRICK = "#6b4b3a";

/** And the cap on it. */
const STACK_LIP = "#3f2f26";

/** How many puffs are in the plume at once. */
const STACK_PUFFS = 5;

/** How many plumes a second go up. */
const STACK_RATE = 0.4;

/** How far one climbs before it is gone, in pixels. */
const STACK_RISE = 26;

/** How far it leans off the stack on the way. */
const STACK_LEAN = 4;

/** How big a fresh puff is. */
const STACK_SMALL = 2.4;

/** And how much it swells. */
const STACK_GROW = 4.5;

/** How dark the thickest of it is. */
const STACK_DARK = 0.55;

/** What it is made of. */
const STACK_GREY = "#d6d3d1";

/** How tall the workshop in the yard is, as a share of the range. */
const HUT_RISE = 0.82;

/** The grass of the yard. */
const YARD_GRASS = "#4a6b23";

/** The bare earth under the baskets, where it has been walked through. */
const WORN_EARTH = "#6e5a3c";

/** And the same with nothing left of it, for the edge of the patch. */
const WORN_GONE = "rgba(110,90,60,0)";

/** How far the bare ground reaches, as a share of the width of the court. */
const WORN_WIDE = 0.42;

/** How much of that is bare through before it starts to fade. */
const WORN_SOLID = 0.45;

/** How far in from the end line its middle sits, as a share of the court. */
const WORN_IN = 0.1;

/** The line round every part of the building. */
const PRISON_EDGE = "#292524";

/** And the wire along the top of it. */
const WIRE_LINE = "#b6b2a8";

/** What is behind a cell window. */
const CELL_GLASS = "#1f2937";

/** The bar down the middle of it. */
const CELL_BAR = "#9ca3af";

/** The reveal cut into the wall round one. */
const CELL_FRAME = "#57534e";

/** How wide one is, in pixels. */
const CELL_WIDE = 7;

/** How many uprights the grille over it has. */
const CELL_BARS = 3;

/** How far apart the windows are. */
const CELL_STEP = 16;

/** How far down the wall they start, as a share of its height. */
const CELL_SILL = 0.76;

/** And how tall they are, the same way. */
const CELL_TALL = 0.4;

/** The lines painted on it. */
const COURT_PAINT = "#e8e6df";

/** A backboard. */
const COURT_BOARD = "#d6d3cc";

/** And the hoop under it. */
const COURT_HOOP = "#ea580c";

/** How far in from the side of the yard the court starts, as a share. */
const COURT_IN = 0.33;

/**
 * And how far over to the right of the middle it sits, the same way.
 *
 * @remarks
 * The workshop is up in the left hand corner, so the ground on that side is
 * spoken for and the ground on the right is not. Dead centre the court sat
 * with its touchline a pace from the shed and half the yard empty beyond it;
 * moved over, the space either side of it is the same.
 */
const COURT_OVER = 0.16;

/** Where its top edge is, down the yard. */
const COURT_TOP = 0.09;

/** And its bottom edge. */
const COURT_LOW = 0.87;

/** How wide the centre circle is, as a share of the court's width. */
const COURT_RING = 0.19;

/** How wide the key is, the same way. */
const COURT_KEY = 0.52;

/** And how far into the court it reaches, as a share of its depth. */
const COURT_DEEP = 0.15;

/** How wide a backboard is, as a share of the court. */
const COURT_POST = 0.3;

/** How many benches stand down each side of the court. */
const BENCHES = 2;

/** Where the first one is, down the yard. */
const BENCH_FROM = 0.42;

/** And how far apart they are, the same way. */
const BENCH_STEP = 0.26;

/** How far clear of the touchline they stand, in pixels. */
const BENCH_OFF = 9;

/** How long one is. */
const BENCH_LONG = 26;

/** And how deep. */
const BENCH_WIDE = 7;

/** How many slats it has. */
const BENCH_SLATS = 3;

/** What it is made of. */
const BENCH_WOOD = "#9a7b52";

/** The line between two slats. */
const BENCH_SEAM = "#6b5535";

/** And the shadow under it. */
const BENCH_SHADE = "#6d6d68";

/** How many men are walking the yard. */
const YARD_MEN = 7;

/** How slowly the slowest of them goes, in pixels a second. */
const YARD_SLOW = 22;

/** And the quickest. */
const YARD_QUICK = 44;

/** How far in from the middle the tightest circuit runs, as a share. */
const WALK_IN = 0.16;

/** And how much wider the widest one is. */
const WALK_OUT = 0.22;

/** What a convict wears. */
const CONVICT_SHIRT = "#f8fafc";

/** The trousers of it. */
const CONVICT_TROUSERS = "#eceae7";

/** What colour the men in the yard are. */
const CONVICT_SKIN = "#f2c9a0";

/** And their hair. */
const CONVICT_HAIR = "#1c1917";

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
  cells: readonly Cell[],
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
  // **The drives, before anything is built on the plot.** Plenty of houses
  // here have one, which is the other half of what a house in a city with two
  // hundred cars in it is: somewhere off the street to leave one. They go on
  // the ground in front, so they are all laid before any wall goes up -
  // otherwise the house next door would be standing behind its neighbour's
  // tarmac.
  //
  // **One per house, not one per plot.** A terrace is five houses on one
  // block, and a single bay drawn across the block would belong to whichever
  // two of the five it happened to land in front of. Each asks the dice for
  // itself, so a row comes out with a bay in front of some of them.
  if (sort.name === "") {
    for (let part = 0; part < parts; part += 1) {
      const dice = scatter(Math.round(look * 71), 13 + part * 29);
      const from = plot.left + part * (each + gap);
      // **Only where there is pavement to lay it on.** A block that fronts
      // straight onto a motorway has no kerb and no verge - the tarmac starts
      // where the wall stops - and a bay drawn there is a bay in the fast
      // lane. So the plan is asked what is actually in front of this house
      // before anything is painted on it.
      const kerb = cellUnder(cells, from + each / 2, plot.bottom + TILE / 2);
      if (dice < DRIVE_SHARE && kerb === "walk") {
        drive(ctx, view, plot.bottom, from, each, dice, fade);
      }
    }
  }
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

/**
 * The player's own house: the one with the garage in it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param plot - the ground it stands on, in city pixels
 * @param height - how tall it is
 * @param sort - the block's colours, for the roof
 * @param garage - the pavement outside its bay
 * @param fade - how solid to paint it
 * @remarks
 * **It was one of four thousand.** Three houses in this city are yours, and
 * the only thing that said so was a roller door in the middle of an ordinary
 * terrace - one drove home to a building one could not pick out of the street
 * it stood in. A place one keeps things is a place one should be able to find.
 *
 * So it is built as the good house on the street: stone rather than render,
 * quoins up the corners, a cornice under the eaves, a **portico** on two
 * columns over the front door with a lamp either side of it, and two rows of
 * tall windows. In front of the garage there is a **parking space** marked out
 * on the pavement, which is the other half of what a house of one's own is
 * for: somewhere to leave the car that nobody else is entitled to.
 *
 * The one thing it must not do is draw over its own garage door - that is its
 * own picture, laid on afterwards - so the windows are dealt out across the
 * front and any that fall in the mouth of the bay are left out.
 */
function drawHome(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  height: number,
  sort: Building,
  garage: Vec,
  fade: number,
): void {
  // **Three houses, and one of them is not the same house.** The one in the
  // south-east quarter is a villa off a photograph - see {@link drawVilla} -
  // and which it is comes off the plan rather than out of a flag: whichever
  // quarter of town the garage stands in is the quarter the house is in.
  if (districtAt(garage.x, garage.y) === "vagos") {
    drawVilla(ctx, view, plot, height, garage, fade);
    return;
  }
  const foot = project(view, plot.left, plot.bottom);
  const back = project(view, plot.left, plot.top, height);
  const wide = plot.right - plot.left;
  ctx.save();
  ctx.globalAlpha = fade;

  // **The parking space**, on the pavement in front of the bay: an apron of
  // concrete with the bay painted on it.
  const apron = project(view, garage.x - TILE / 2, garage.y - TILE / 2);
  ctx.fillStyle = HOME_APRON;
  ctx.fillRect(apron.x, apron.y, TILE, TILE * DEPTH);
  ctx.strokeStyle = HOME_BAY;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(apron.x + BAY_IN, apron.y);
  ctx.lineTo(apron.x + BAY_IN, apron.y + TILE * DEPTH - BAY_IN);
  ctx.lineTo(apron.x + TILE - BAY_IN, apron.y + TILE * DEPTH - BAY_IN);
  ctx.lineTo(apron.x + TILE - BAY_IN, apron.y);
  ctx.stroke();

  // The front wall, its plinth and its cornice.
  ctx.fillStyle = HOME_WALL;
  ctx.fillRect(foot.x, foot.y - height, wide, height);
  ctx.fillStyle = HOME_PLINTH;
  ctx.fillRect(foot.x, foot.y - height * PLINTH_UP, wide, height * PLINTH_UP);
  ctx.fillStyle = HOME_STONE;
  ctx.fillRect(
    foot.x,
    foot.y - height,
    wide,
    Math.max(2, height * CORNICE_TALL),
  );
  // The quoins: stone blocks up both corners, alternating, which is most of
  // what says stone house rather than rendered box.
  for (const side of [0, wide - QUOIN_WIDE]) {
    for (let block = 0; block * QUOIN_TALL < height; block += 1) {
      if (block % 2 === 0) {
        ctx.fillStyle = HOME_STONE;
        ctx.fillRect(
          foot.x + side,
          foot.y - height + block * QUOIN_TALL,
          QUOIN_WIDE,
          QUOIN_TALL,
        );
      }
    }
  }

  // The windows: two rows across the front, less whatever the garage mouth
  // takes out of the lower one.
  const mouth = foot.x + (garage.x - plot.left);
  for (let bay = 0; bay < HOME_BAYS; bay += 1) {
    const at = foot.x + wide * ((bay + 1) / (HOME_BAYS + 1));
    for (const row of [WIN_LOW, WIN_HIGH]) {
      const clear =
        row === WIN_HIGH || Math.abs(at - mouth) > TILE * MOUTH_KEEP;
      if (clear) {
        homeWindow(ctx, at, foot.y - height * row, height);
      }
    }
  }

  // The portico: two columns, a pediment over them, the door under it, and a
  // lamp either side.
  const porch = foot.x + wide * PORCH_AT;
  const tall = height * PORCH_TALL;
  ctx.fillStyle = HOME_DOOR;
  ctx.fillRect(
    porch - DOOR_WIDE / 2,
    foot.y - tall * DOOR_SHARE,
    DOOR_WIDE,
    tall * DOOR_SHARE,
  );
  ctx.fillStyle = HOME_BRASS;
  ctx.fillRect(
    porch + DOOR_WIDE / 2 - 2,
    foot.y - tall * DOOR_SHARE * HALF,
    1.5,
    1.5,
  );
  ctx.fillStyle = HOME_STONE;
  for (const post of [-1, 1]) {
    ctx.fillRect(
      porch + post * PORCH_SPAN - COLUMN / 2,
      foot.y - tall,
      COLUMN,
      tall,
    );
  }
  ctx.beginPath();
  ctx.moveTo(porch - PORCH_SPAN - COLUMN, foot.y - tall);
  ctx.lineTo(porch + PORCH_SPAN + COLUMN, foot.y - tall);
  ctx.lineTo(porch, foot.y - tall - PEDIMENT);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HOME_LAMP;
  for (const post of [-1, 1]) {
    ctx.fillRect(porch + post * PORCH_SPAN - 1, foot.y - tall * LAMP_UP, 2, 2);
  }

  // And the roof over the lot.
  ctx.fillStyle = sort.roof;
  ctx.fillRect(back.x, back.y, wide, foot.y - height - back.y);
  ctx.strokeStyle = HOME_EDGE;
  ctx.lineWidth = 1;
  ctx.strokeRect(back.x, back.y, wide, foot.y - back.y);
  ctx.beginPath();
  line(
    ctx,
    { x: foot.x, y: foot.y - height },
    { x: foot.x + wide, y: foot.y - height },
  );
  ctx.stroke();
  ctx.restore();
}

/**
 * The villa in the south-east: two storeys of white stucco under red tiles.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param plot - the ground it stands on, in city pixels
 * @param height - how tall its main block is
 * @param garage - the bay cut into it
 * @param fade - how solid to paint it
 * @remarks
 * Drawn off a photograph rather than invented, and it is a different sort of
 * building from everything else in this city: a Spanish villa. Four things
 * carry that and nothing else has to:
 *
 * - **The roof is tile, and it is what one mostly sees.** Terracotta, laid in
 *   courses, with a ridge along the top and the eaves standing out past the
 *   wall all the way round. From above that roof is nine tenths of the house.
 * - **Two masses, not one box.** The main block is two storeys and takes the
 *   left of the plot; to the right of it a single-storey wing runs forward
 *   under its own lower roof, and the far end of that wing is open - a
 *   carport, which is where the second car lives.
 * - **Arches.** The ground floor of both is a loggia: round-headed openings
 *   in deep shade, with the front door in the middle of them and a flight of
 *   steps down to the drive.
 * - **And a balcony** over the door with an iron rail and pots along it,
 *   which is the one thing at first-floor level that says somebody lives here.
 *
 * The garden is on the pavement in front, because the plot itself is all
 * building: a paved forecourt with the bay marked on it, clipped hedge either
 * side, a row of cypresses up the left and agaves in the gravel. Everything in
 * the photograph that could be got in at three squares across.
 */
function drawVilla(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  height: number,
  garage: Vec,
  fade: number,
): void {
  const foot = project(view, plot.left, plot.bottom);
  const wide = plot.right - plot.left;
  // **The wing is where the garage is**, and how much of the house it takes
  // comes off the plan rather than off the door: `VILLA_MAIN` squares of
  // two-storey block, the rest wing, and the bay cut out of the middle of the
  // wing. Worked out from the door instead, the wing ended up starting exactly
  // where the door did and the door sat on the corner of it.
  const mouth = {
    from: garage.x - TILE / 2 - plot.left,
    to: garage.x + TILE / 2 - plot.left,
  };
  const split = TILE * VILLA_MAIN;
  const low = height * VILLA_LOW;
  const back = project(view, plot.left, plot.top, height);
  const backLow = project(view, plot.left, plot.top, low);
  ctx.save();
  ctx.globalAlpha = fade;

  garden(ctx, view, plot, garage);

  // **The wing first, then the main block.** The tall one is drawn over the
  // low one where they meet, which is what a two-storey wall does to the roof
  // of the single-storey thing built against it.
  villaRoof(
    ctx,
    backLow.x + split,
    backLow.y,
    wide - split,
    foot.y - low - backLow.y,
  );
  ctx.fillStyle = VILLA_WALL;
  ctx.fillRect(foot.x + split, foot.y - low, wide - split, low);
  ctx.fillStyle = VILLA_SHADE;
  ctx.fillRect(
    foot.x + split,
    foot.y - low * VILLA_SKIRT,
    wide - split,
    low * VILLA_SKIRT,
  );
  // The carport: the opening the car drives into, over the bay itself.
  ctx.fillStyle = VILLA_DARK;
  ctx.fillRect(
    foot.x + mouth.from,
    foot.y - low * VILLA_PORT_TALL,
    mouth.to - mouth.from,
    low * VILLA_PORT_TALL,
  );
  // And an arch in whatever wing wall is left either side of the opening.
  for (const bay of [
    { from: split, to: mouth.from },
    { from: mouth.to, to: wide },
  ]) {
    if (bay.to - bay.from > TILE * PORT_ARCH) {
      archRow(
        ctx,
        foot.x + bay.from + 2,
        foot.y,
        bay.to - bay.from - 4,
        low,
        VILLA_WING_ARCHES,
      );
    }
  }

  villaRoof(ctx, back.x, back.y, split, foot.y - height - back.y);
  // **The two-storey wall stands above the wing's roof**, which is what makes
  // the wing read as built against the house rather than beside it: a strip of
  // stucco up the join, from the wing's ridge to the eaves of the big roof.
  ctx.fillStyle = VILLA_WALL;
  ctx.fillRect(
    foot.x + split,
    backLow.y,
    JOIN_WIDE,
    foot.y - height - backLow.y,
  );
  ctx.fillStyle = VILLA_SHADE;
  ctx.fillRect(
    foot.x + split + JOIN_WIDE,
    backLow.y,
    1.5,
    foot.y - height - backLow.y,
  );
  ctx.fillStyle = VILLA_WALL;
  ctx.fillRect(foot.x, foot.y - height, split, height);
  ctx.fillStyle = VILLA_SHADE;
  ctx.fillRect(
    foot.x,
    foot.y - height * VILLA_SKIRT,
    split,
    height * VILLA_SKIRT,
  );

  // The front of the main block: a loggia of arches with the door in the
  // middle of it, two shuttered windows over it and the balcony between them.
  // Nothing has to dodge the garage door any more - that is round the corner
  // in the wing, which is the point of putting it there.
  const middle = foot.x + split / 2;
  for (const side of [-1, 1]) {
    villaWindow(
      ctx,
      middle + side * split * VILLA_PANE_AT,
      foot.y - height * VILLA_UPPER,
      height * VILLA_PANE,
    );
  }
  balcony(ctx, middle, foot.y - height * VILLA_RAIL, split * VILLA_BALCONY);
  archRow(
    ctx,
    foot.x + 2,
    foot.y,
    split - 4,
    height * VILLA_GROUND,
    VILLA_ARCHES,
  );
  // The door fills the middle arch, so it is told how wide one is.
  frontDoor(
    ctx,
    middle,
    foot.y,
    height * VILLA_GROUND,
    ((split - 4) / VILLA_ARCHES) * ARCH_SHARE,
  );

  // **The gable over the left end.** On the photograph the left of the house
  // is a wing of its own that comes forward under a pitched roof, and what one
  // sees of it from the street is a triangle. It is the one thing about this
  // house that is not a flat-topped box, so it is worth the dozen lines.
  gable(ctx, foot.x, foot.y - height, split * GABLE_SHARE, back.y);

  // **The chimney, up on the roof rather than on the eaves.** It used to sit
  // at the very front edge of the tiles, half off the house; a stack comes out
  // of the middle of a roof. This one stands about two thirds of the way back
  // down the slope of the big roof and in the middle of it across, which on
  // the photograph is where the smoke is coming from.
  const stack = {
    x: foot.x + split * CHIMNEY_AT - CHIMNEY_WIDE / 2,
    y: back.y + (foot.y - height - back.y) * CHIMNEY_BACK,
  };
  ctx.fillStyle = VILLA_SHADE;
  ctx.fillRect(stack.x, stack.y, CHIMNEY_WIDE, CHIMNEY_UP + CHIMNEY_TALL);
  ctx.fillStyle = VILLA_WALL;
  ctx.fillRect(
    stack.x,
    stack.y,
    CHIMNEY_WIDE - CHIMNEY_SIDE,
    CHIMNEY_UP + CHIMNEY_TALL,
  );
  // The vent slots under the cap, which is where the smoke goes sideways out.
  ctx.fillStyle = VILLA_TRIM;
  ctx.fillRect(stack.x + 1, stack.y + 1, CHIMNEY_WIDE - 2, CHIMNEY_SLOT);
  // And the cap on top of it.
  ctx.fillStyle = VILLA_DARK;
  ctx.fillRect(
    stack.x - CHIMNEY_LIP,
    stack.y - CHIMNEY_CAP,
    CHIMNEY_WIDE + CHIMNEY_LIP * 2,
    CHIMNEY_CAP,
  );
  ctx.restore();
}

/** And how much of that is needed before an arch is worth putting in it. */
const PORT_ARCH = 0.8;

/**
 * The pitched end of the villa: a ridge over it and a triangle under it.
 *
 * @param ctx - what to paint on
 * @param left - where the gabled part starts on screen
 * @param eave - the top of the wall, which is where the triangle stands
 * @param wide - how wide the gabled part is
 * @param back - the far edge of the roof
 * @remarks
 * **Two halves and a line between them.** A pitched roof seen from overhead is
 * two slopes meeting at a ridge, and the only thing that says so at this size
 * is that the two are not quite the same colour: the half the sun is on is a
 * shade lighter than the half it is not, and the ridge runs down the join.
 *
 * Under it, on the wall, the triangle - the gable end itself. That is the part
 * one actually recognises from the street, and it is drawn in the wall colour
 * with the tiles carried down its two slopes, because that is what the verge
 * of a tiled roof looks like from the front.
 */
function gable(
  ctx: CanvasRenderingContext2D,
  left: number,
  eave: number,
  wide: number,
  back: number,
): void {
  const middle = left + wide / 2;
  // The two slopes, over the roof plan the flat roof has already laid.
  ctx.fillStyle = GABLE_SUN;
  ctx.fillRect(left, back, wide / 2, eave - back);
  ctx.fillStyle = GABLE_SHADE;
  ctx.fillRect(middle, back, wide / 2, eave - back);
  ctx.fillStyle = VILLA_RIDGE;
  ctx.fillRect(middle - RIDGE_THICK / 2, back, RIDGE_THICK, eave - back);

  // The triangle on the wall, and the tiles down its two verges.
  const peak = eave - wide * GABLE_PITCH;
  ctx.fillStyle = VILLA_WALL;
  ctx.beginPath();
  ctx.moveTo(left, eave);
  ctx.lineTo(middle, peak);
  ctx.lineTo(left + wide, eave);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = VILLA_EAVE;
  ctx.lineWidth = VERGE_THICK;
  ctx.beginPath();
  ctx.moveTo(left - VERGE_OUT, eave);
  ctx.lineTo(middle, peak - VERGE_OUT);
  ctx.lineTo(left + wide + VERGE_OUT, eave);
  ctx.stroke();
  // A round window in it, which is what is in the gable of a house like this.
  ctx.fillStyle = VILLA_DARK;
  ctx.beginPath();
  ctx.ellipse(middle, eave - EYE_UP, EYE_WIDE, EYE_WIDE, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = VILLA_TRIM;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** How much of the two-storey block is gabled. */
const GABLE_SHARE = 0.52;

/** How steep the gable is, as a share of its width. */
const GABLE_PITCH = 0.34;

/** The slope of it the sun is on. */
const GABLE_SUN = "#d27f45";

/** And the one it is not. */
const GABLE_SHADE = "#b3672f";

/** How thick the tiles along the verge are drawn. */
const VERGE_THICK = 2;

/** And how far they stand out past the wall. */
const VERGE_OUT = 1.5;

/** How far up the gable the round window sits, in pixels. */
const EYE_UP = 5;

/** And how big it is. */
const EYE_WIDE = 2.2;

/**
 * One roof of the villa: tiles in courses, a ridge, and eaves round it.
 *
 * @param ctx - what to paint on
 * @param x - its left edge on screen
 * @param y - its back edge
 * @param wide - how wide it is
 * @param deep - and how far it comes forward
 */
function villaRoof(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wide: number,
  deep: number,
): void {
  ctx.fillStyle = VILLA_TILE;
  ctx.fillRect(x, y, wide, deep);
  // **The courses, and not too many of them.** A line every four pixels came
  // out as corrugated sheeting; at seven, and in a colour only a shade off the
  // tile, they read as what they are - rows of pantiles running down a slope.
  ctx.strokeStyle = VILLA_COURSE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (
    let course = y + TILE_COURSE;
    course < y + deep - 2;
    course += TILE_COURSE
  ) {
    ctx.moveTo(x, course);
    ctx.lineTo(x + wide, course);
  }
  ctx.stroke();
  // The ridge along the back, the hips down the two ends, and the eaves
  // standing out past the wall. The hips are what tell one roof from the one
  // built against it.
  ctx.fillStyle = VILLA_RIDGE;
  ctx.fillRect(x, y, wide, RIDGE_THICK);
  ctx.fillRect(x, y, RIDGE_THICK, deep);
  ctx.fillRect(x + wide - RIDGE_THICK, y, RIDGE_THICK, deep);
  ctx.fillStyle = VILLA_EAVE;
  ctx.fillRect(x, y + deep - EAVE_THICK, wide, EAVE_THICK);
}

/**
 * A run of round-headed openings along the foot of a wall.
 *
 * @param ctx - what to paint on
 * @param x - where the run starts on screen
 * @param foot - the pavement line
 * @param wide - how far it runs
 * @param high - how tall the storey is
 * @param count - how many openings
 */
function archRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  foot: number,
  wide: number,
  high: number,
  count: number,
): void {
  const each = wide / count;
  const span = each * ARCH_SHARE;
  const tall = high * ARCH_TALL;
  for (let at = 0; at < count; at += 1) {
    const middle = x + each * (at + HALF);
    ctx.fillStyle = VILLA_DARK;
    ctx.beginPath();
    ctx.moveTo(middle - span / 2, foot);
    ctx.lineTo(middle - span / 2, foot - tall + span / 2);
    ctx.quadraticCurveTo(
      middle,
      foot - tall - span / 4,
      middle + span / 2,
      foot - tall + span / 2,
    );
    ctx.lineTo(middle + span / 2, foot);
    ctx.closePath();
    ctx.fill();
  }
}

/** One shuttered window of the upper floor. */
function villaWindow(
  ctx: CanvasRenderingContext2D,
  at: number,
  sill: number,
  tall: number,
): void {
  ctx.fillStyle = VILLA_DARK;
  ctx.fillRect(at - VILLA_PANE_WIDE / 2, sill, VILLA_PANE_WIDE, tall);
  ctx.fillStyle = VILLA_SHUTTER;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      at + (side * VILLA_PANE_WIDE) / 2 - (side < 0 ? SHUTTER : 0),
      sill,
      SHUTTER,
      tall,
    );
  }
  ctx.fillStyle = VILLA_TRIM;
  ctx.fillRect(
    at - VILLA_PANE_WIDE / 2 - SHUTTER,
    sill + tall,
    VILLA_PANE_WIDE + SHUTTER * 2,
    1.5,
  );
}

/** The balcony over the door: a slab, an iron rail and the pots on it. */
function balcony(
  ctx: CanvasRenderingContext2D,
  middle: number,
  at: number,
  span: number,
): void {
  ctx.fillStyle = VILLA_TRIM;
  ctx.fillRect(middle - span / 2, at, span, SLAB_THICK);
  ctx.strokeStyle = VILLA_IRON;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(middle - span / 2, at - RAIL_TALL);
  ctx.lineTo(middle + span / 2, at - RAIL_TALL);
  for (let bar = 0; bar <= RAIL_BARS; bar += 1) {
    const over = middle - span / 2 + (span * bar) / RAIL_BARS;
    ctx.moveTo(over, at - RAIL_TALL);
    ctx.lineTo(over, at);
  }
  ctx.stroke();
  // The pots along it, which is what is actually on this balcony.
  ctx.fillStyle = VILLA_POT;
  for (const pot of [-1, 0, 1]) {
    ctx.fillRect(
      middle + (pot * span) / 3 - POT_WIDE / 2,
      at - POT_TALL,
      POT_WIDE,
      POT_TALL,
    );
  }
  ctx.fillStyle = VILLA_LEAF;
  for (const pot of [-1, 0, 1]) {
    ctx.fillRect(
      middle + (pot * span) / 3 - POT_WIDE / 2,
      at - POT_TALL - 1.5,
      POT_WIDE,
      1.5,
    );
  }
}

/** The way in: a dark opening, its surround, and the steps down to the drive. */
function frontDoor(
  ctx: CanvasRenderingContext2D,
  at: number,
  foot: number,
  high: number,
  span: number,
): void {
  const tall = high * ARCH_TALL;
  const wide = span * DOOR_FILLS;
  const leaf = wide / 2;
  // **The opening, not a plank stuck on the wall.** The door is what is in the
  // middle arch of the loggia, so it is as wide as that arch is: a stone
  // surround, the round head of the arch over it, and two leaves filling the
  // whole of it. Seven pixels of timber in the middle of a twenty-pixel arch
  // was a cat flap in a cathedral.
  ctx.fillStyle = VILLA_TRIM;
  ctx.beginPath();
  ctx.moveTo(at - wide / 2 - DOOR_JAMB, foot);
  ctx.lineTo(at - wide / 2 - DOOR_JAMB, foot - tall + wide / 2);
  ctx.quadraticCurveTo(
    at,
    foot - tall - wide / 4,
    at + wide / 2 + DOOR_JAMB,
    foot - tall + wide / 2,
  );
  ctx.lineTo(at + wide / 2 + DOOR_JAMB, foot);
  ctx.closePath();
  ctx.fill();

  // The two leaves, with the shut line between them and the fanlight over.
  ctx.fillStyle = VILLA_TIMBER;
  ctx.beginPath();
  ctx.moveTo(at - wide / 2, foot);
  ctx.lineTo(at - wide / 2, foot - tall + wide / 2);
  ctx.quadraticCurveTo(at, foot - tall, at + wide / 2, foot - tall + wide / 2);
  ctx.lineTo(at + wide / 2, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = VILLA_DARK;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(at, foot);
  ctx.lineTo(at, foot - tall + wide / 2);
  // The panels: two down each leaf, which is what a pair of timber doors has.
  for (const side of [-1, 1]) {
    for (const panel of [0, 1]) {
      const from = foot - DOOR_PANEL_UP - panel * DOOR_PANEL_TALL;
      ctx.rect(
        at + (side < 0 ? -leaf + DOOR_PANEL_IN : DOOR_PANEL_IN),
        from - DOOR_PANEL_TALL + DOOR_PANEL_IN,
        leaf - DOOR_PANEL_IN * 2,
        DOOR_PANEL_TALL - DOOR_PANEL_IN * 2,
      );
    }
  }
  ctx.stroke();
  // The fanlight in the head of the arch, which is where the light in a hall
  // like this actually comes from.
  ctx.fillStyle = VILLA_GLASS_LIT;
  ctx.beginPath();
  ctx.moveTo(at - wide / 2 + 1, foot - tall + wide / 2);
  ctx.quadraticCurveTo(
    at,
    foot - tall + 1,
    at + wide / 2 - 1,
    foot - tall + wide / 2,
  );
  ctx.closePath();
  ctx.fill();
  // Two handles where the leaves meet.
  ctx.fillStyle = VILLA_BRASS;
  for (const side of [-1, 1]) {
    ctx.fillRect(at + side * DOOR_GRIP, foot - tall * HALF, 1.2, 1.6);
  }

  // The steps, three of them, spreading a little as they come down.
  ctx.fillStyle = VILLA_STEP;
  for (let step = 0; step < STEPS; step += 1) {
    const out = wide + 3 + step * 3;
    ctx.fillRect(at - out / 2, foot + step * STEP_DEEP, out, STEP_DEEP);
  }
  // A lamp either side of it.
  ctx.fillStyle = VILLA_LAMP;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      at + side * (wide / 2 + DOOR_JAMB + 2),
      foot - tall * 0.78,
      1.6,
      2.4,
    );
  }
}

/** How much of its arch the front door fills. */
const DOOR_FILLS = 0.82;

/** How far the stone surround stands out past it, in pixels. */
const DOOR_JAMB = 1.5;

/** How far up a leaf the lower panel starts. */
const DOOR_PANEL_UP = 3;

/** How tall one panel is. */
const DOOR_PANEL_TALL = 5;

/** And how far in from the edge of the leaf it sits. */
const DOOR_PANEL_IN = 1.2;

/** How far either side of the shut line the handles are. */
const DOOR_GRIP = 1;

/** The fanlight over the door, which is lit. */
const VILLA_GLASS_LIT = "#f3d9a4";

/**
 * What is planted round the villa, on the pavement in front of it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param plot - the ground the house stands on
 * @param garage - the bay cut into it
 * @remarks
 * The plot is all house, so the garden is the strip of pavement between the
 * front wall and the kerb - which is where the photograph has it too. Left to
 * right: the paved forecourt with the bay marked on it, hedge either side of
 * the opening, a row of cypresses up the left, and agaves in the gravel.
 */
function garden(
  ctx: CanvasRenderingContext2D,
  view: View,
  plot: { left: number; top: number; right: number; bottom: number },
  garage: Vec,
): void {
  const block = villaBlock();
  if (block === null) {
    return;
  }
  // **Everything here is in the property's own coordinates, not the house's.**
  // The house is one corner of a lawn twelve squares across now; a hedge laid
  // round the house is a hedge through the middle of the garden.
  const grounds = villaGrounds(block.x, block.y);
  const yard = villaYard(block.x, block.y);
  const edge = project(view, grounds.left * TILE, grounds.top * TILE);
  const down = (grounds.bottom - grounds.top) * TILE * DEPTH;
  const kerb = project(view, plot.left, plot.bottom);
  const deep = (grounds.bottom * TILE - plot.bottom) * DEPTH;

  // **And flowers in the grass.** Not scattered at random: every clump comes
  // out of `scatter` on the square it stands on, so the same border is in the
  // same place every time one comes home. Only on the lawn - the plan is asked
  // what is under each one rather than the corners of the property being
  // guessed at, so nothing grows out of the roof.
  //
  // And **before** the drive and the yard are laid, not after: the drive is
  // painted over squares the plan still calls lawn, so flowers put down last
  // came up through the tarmac.
  for (let row = grounds.top; row < grounds.bottom; row += 1) {
    for (let col = grounds.left; col < grounds.right; col += 1) {
      if (villaCell(col, row) === "park") {
        flowers(ctx, view, col, row);
      }
    }
  }

  // **The drive, and only the drive, is paved.** The rest of the strip in
  // front of the house is lawn, which the floor itself lays - it is park
  // there, so the ground pass has already painted grass and this only has to
  // put the hard standing on it. Clamped to the property: the bay is cut out
  // of the last column of the house, so a drive laid a square either side of
  // it runs out past the hedge and on to the public pavement.
  const drive = {
    from: Math.max(garage.x - TILE, grounds.left * TILE),
    to: Math.min(garage.x + TILE, grounds.right * TILE),
  };
  ctx.fillStyle = VILLA_PAVE;
  ctx.fillRect(
    kerb.x + drive.from - plot.left,
    kerb.y,
    drive.to - drive.from,
    deep,
  );
  ctx.strokeStyle = VILLA_JOINT;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  // Courses across the drive rather than down it: laid the other way they
  // read as decking, and nobody decks a forecourt.
  for (
    let joint = kerb.y + PAVE_STEP;
    joint < kerb.y + deep;
    joint += PAVE_STEP
  ) {
    ctx.moveTo(kerb.x + drive.from - plot.left, joint);
    ctx.lineTo(kerb.x + drive.to - plot.left, joint);
  }
  ctx.stroke();

  // The bay in front of the garage door.
  const bay = project(view, garage.x - TILE / 2, garage.y - TILE / 2);
  ctx.strokeStyle = VILLA_BAY;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bay.x + BAY_IN, bay.y);
  ctx.lineTo(bay.x + BAY_IN, bay.y + TILE * DEPTH - BAY_IN);
  ctx.lineTo(bay.x + TILE - BAY_IN, bay.y + TILE * DEPTH - BAY_IN);
  ctx.lineTo(bay.x + TILE - BAY_IN, bay.y);
  ctx.stroke();

  // **The yard is paved, not marked out.** Bays painted on it made it a
  // supermarket car park; what belongs beside a villa is a cobbled forecourt
  // one leaves the cars on wherever they end up. The stones are a pattern
  // built once and laid from the **corner of the yard**, so they stay put on
  // the ground instead of crawling about as the camera moves.
  const lot = project(view, yard.left * TILE, yard.top * TILE);
  const wide = (yard.right - yard.left) * TILE;
  const tall = (yard.bottom - yard.top) * TILE * DEPTH;
  const stones = cobbles(ctx);
  if (stones !== null) {
    ctx.save();
    ctx.translate(lot.x, lot.y);
    ctx.fillStyle = stones;
    ctx.fillRect(0, 0, wide, tall);
    ctx.restore();
  }

  // **The hedge is the line between the pavement and the garden**, not the
  // line between the garden and the street: it stands **inside** the footway
  // that runs down either side of the property, so one walks past the villa on
  // paving with a hedge at one's elbow.
  //
  // **Three sides, not four.** Down both sides and along the back, and nothing
  // at all along the front - a house one cannot see from the road is a house
  // with a hedge in front of it, and the whole of this one is worth looking
  // at. The front is open lawn to the kerb, with the drive across it.
  const inner = project(view, (grounds.left + VILLA_KERB) * TILE, 0).x;
  const outer = project(view, (grounds.right - VILLA_KERB) * TILE, 0).x;
  hedgeRun(ctx, edge.y, edge.y + down, inner, true);
  hedgeRun(ctx, edge.y, edge.y + down, outer - HEDGE_DEEP, true);
  hedgeRun(ctx, inner, outer, edge.y, false);
}

/**
 * What is growing on one square of the villa's lawn.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - the square, across
 * @param row - the square, down
 * @remarks
 * A handful of clumps a square, each one a few petals round a middle, in
 * whichever of the bedding colours its own dice roll picks. Dice that are not
 * dice: the square's coordinates, so the garden is the same garden every time
 * and nothing has to be written down.
 */
function flowers(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  for (let clump = 0; clump < BEDS; clump += 1) {
    const own = scatter(col * 7 + clump, row * 13 + clump * 5);
    const spin = scatter(row * 11 + clump * 3, col * 17 + clump);
    if (own < BED_BARE) {
      continue;
    }
    const at = project(
      view,
      (col + BED_IN + own * (1 - BED_IN * 2)) * TILE,
      (row + BED_IN + spin * (1 - BED_IN * 2)) * TILE,
    );
    ctx.fillStyle = BED_LEAF;
    ctx.fillRect(at.x - 1, at.y, 2, 2);
    ctx.fillStyle = BEDS_IN[Math.floor(spin * BEDS_IN.length)] ?? BED_LEAF;
    for (const petal of [-1, 1]) {
      ctx.fillRect(
        at.x + petal * PETAL - PETAL / 2,
        at.y - PETAL,
        PETAL,
        PETAL,
      );
      ctx.fillRect(at.x - PETAL / 2, at.y - PETAL * (1 + petal), PETAL, PETAL);
    }
    ctx.fillStyle = BED_HEART;
    ctx.fillRect(at.x - PETAL / 2, at.y - PETAL, PETAL, PETAL);
  }
}

/** How many clumps of flowers one square of lawn may hold. */
const BEDS = 3;

/** Below this the clump is not there at all, so the lawn is not a meadow. */
const BED_BARE = 0.42;

/** How far in from the edge of a square one may stand, as a share of it. */
const BED_IN = 0.18;

/** How big one petal is drawn, in pixels. */
const PETAL = 1.6;

/** The stalk and the leaves. */
const BED_LEAF = "#2f6b2a";

/** What is in the middle of a flower. */
const BED_HEART = "#fde68a";

/** And what they come in. */
const BEDS_IN: readonly string[] = [
  "#e879a0",
  "#f0b429",
  "#dc5a4a",
  "#f5f0e6",
  "#a86ed6",
];

/**
 * One run of clipped hedge.
 *
 * @param ctx - what to paint on
 * @param from - where it starts on screen
 * @param to - and where it stops
 * @param at - the other coordinate: the line it runs along
 * @param down - true for a run down the screen rather than across it
 */
function hedgeRun(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  at: number,
  down: boolean,
): void {
  if (to <= from) {
    return;
  }
  // **Three tones and a lumpy top.** A hedge from up here is a long low mound:
  // dark where the ground is, its own colour up the body, and a line of
  // clipped tops catching the light down the side the sun is on. Flat green
  // with a scallop on it was a snooker cushion; what makes it a hedge is that
  // the three do not line up - each lump sits a shade off where the last one
  // did, because nobody clips one straight.
  ctx.fillStyle = VILLA_HEDGE_DARK;
  if (down) {
    ctx.fillRect(at, from, HEDGE_DEEP, to - from);
  } else {
    ctx.fillRect(from, at, to - from, HEDGE_DEEP);
  }
  ctx.fillStyle = VILLA_HEDGE;
  if (down) {
    ctx.fillRect(at, from, HEDGE_DEEP - HEDGE_SHADE, to - from);
  } else {
    ctx.fillRect(from, at, to - from, HEDGE_DEEP - HEDGE_SHADE);
  }
  for (let lump = from; lump < to; lump += HEDGE_LUMP) {
    const along = Math.min(lump + HEDGE_LUMP / 2, to);
    const own = scatter(Math.round(lump), Math.round(at));
    const fat = HEDGE_LUMP / 2 - 0.4 + own;
    const off = (own - HALF) * HEDGE_ROUGH;
    ctx.fillStyle = own < HALF ? VILLA_HEDGE_TOP : VILLA_HEDGE_LIT;
    ctx.beginPath();
    ctx.ellipse(
      down ? at + HEDGE_DEEP * HEDGE_CREST + off : along,
      down ? along : at + HEDGE_DEEP * HEDGE_CREST + off,
      down ? HEDGE_DEEP * HEDGE_TOP : fat,
      down ? fat : HEDGE_DEEP * HEDGE_TOP,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** How wide the strip of two-storey wall above the wing's roof is. */
const JOIN_WIDE = 3;

/** How tall the single-storey wing is against it. */
const VILLA_LOW = 0.72;

/** And how far up the wing the opening goes. */
const VILLA_PORT_TALL = 0.78;

/** How many arches the wing carries, and how many the main block does. */
const VILLA_WING_ARCHES = 1;

/** And the loggia of the main block. */
const VILLA_ARCHES = 3;

/** How much of a storey an arched opening takes. */
const ARCH_TALL = 0.72;

/** And how much of its bay it is wide. */
const ARCH_SHARE = 0.62;

/** How far up the wall the darker skirt reaches. */
const VILLA_SKIRT = 0.1;

/** Where the upper windows sit, as a share of the height. */
const VILLA_UPPER = 0.86;

/** How tall one is. */
const VILLA_PANE = 0.2;

/** Where the balcony slab sits. */
const VILLA_RAIL = 0.68;

/** And how much of the front it spans. */
const VILLA_BALCONY = 0.44;

/** How much of a storey the ground floor is. */
const VILLA_GROUND = 0.66;

/** Where the upper windows sit either side of the balcony. */
const VILLA_PANE_AT = 0.34;

/** How many steps come down from it. */
const STEPS = 3;

/** And how deep one is drawn. */
const STEP_DEEP = 1.6;

/** How far apart the courses of tiles are drawn, in pixels. */
const TILE_COURSE = 7;

/** How thick the ridge along the top is. */
const RIDGE_THICK = 2;

/** And the eaves along the bottom. */
const EAVE_THICK = 2;

/** How wide a chimney is. */
const CHIMNEY_WIDE = 9;

/** How much of that is the shaded side of it. */
const CHIMNEY_SIDE = 3;

/** How far above the roof it starts. */
const CHIMNEY_UP = 11;

/** How tall its shaft is. */
const CHIMNEY_TALL = 4;

/** And the cap on it. */
const CHIMNEY_CAP = 3;

/** How far the cap stands out past the shaft, in pixels. */
const CHIMNEY_LIP = 1.5;

/** How deep the vent slots under it are. */
const CHIMNEY_SLOT = 2;

/** Where it stands across the two-storey block, as a share of it. */
const CHIMNEY_AT = 0.5;

/** And how far back down the roof, as a share of its depth. */
const CHIMNEY_BACK = 0.62;

/** How wide an upper window is. */
const VILLA_PANE_WIDE = 5;

/** And how wide a shutter beside it is. */
const SHUTTER = 1.5;

/** How thick the balcony slab is. */
const SLAB_THICK = 1.5;

/** How tall its rail is. */
const RAIL_TALL = 4;

/** How many uprights that rail has. */
const RAIL_BARS = 6;

/** How wide a pot on it is. */
const POT_WIDE = 2.5;

/** And how tall. */
const POT_TALL = 2;

/** How far apart the joints in the paving are. */
const PAVE_STEP = 9;

/** How deep the hedge along the kerb is. */
const HEDGE_DEEP = 9;

/** How much of that is the shaded side of it. */
const HEDGE_SHADE = 2.5;

/** Where along its width the clipped tops sit, as a share of its depth. */
const HEDGE_CREST = 0.36;

/** And how fat one of them is, the same way. */
const HEDGE_TOP = 0.3;

/** How far a lump may wander off the line, in pixels. */
const HEDGE_ROUGH = 1.6;

/**
 * The cobbles of the villa's yard, as a pattern.
 *
 * @param ctx - the canvas the pattern is for
 * @returns it, or null where no canvas can be made
 * @remarks
 * Built once and kept: a courtyard three squares by four is a hundred and
 * fifty stones, and drawing each of them every frame is a hundred and fifty
 * rectangles a frame for a piece of ground nobody looks at twice.
 *
 * Laid in courses with every other one offset by half a stone, which is how
 * setts are actually laid and is also the only thing that stops a grid of
 * rectangles reading as tiling. Four tones, picked off the stone's place in
 * the pattern rather than at random, so the yard is the same yard every time.
 */
function cobbles(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (SETTS === undefined) {
    const sheet = document.createElement("canvas");
    sheet.width = SETT_WIDE * 2;
    sheet.height = SETT_TALL * 2;
    const paint = sheet.getContext("2d");
    if (paint === null) {
      SETTS = null;
    } else {
      paint.fillStyle = SETT_JOINT;
      paint.fillRect(0, 0, sheet.width, sheet.height);
      for (let row = 0; row < 2; row += 1) {
        for (let stone = -1; stone < 2; stone += 1) {
          const over = stone * SETT_WIDE + (row % 2 === 0 ? 0 : SETT_WIDE / 2);
          paint.fillStyle =
            SETT_STONES[(row * 2 + stone + 4) % SETT_STONES.length] ??
            SETT_JOINT;
          paint.fillRect(
            over,
            row * SETT_TALL,
            SETT_WIDE - SETT_GAP,
            SETT_TALL - SETT_GAP,
          );
        }
      }
      SETTS = ctx.createPattern(sheet, "repeat");
    }
  }
  return SETTS;
}

/** The pattern, built once. */
let SETTS: CanvasPattern | null | undefined = undefined;

/** How wide one sett is, in pixels. */
const SETT_WIDE = 7;

/** And how deep, which is less because the ground is squashed. */
const SETT_TALL = 4;

/** How much of that is the joint between two of them. */
const SETT_GAP = 1;

/** What is between the stones. */
const SETT_JOINT = "#6f6a63";

/** And the stones themselves, which are not all the same colour. */
const SETT_STONES: readonly string[] = [
  "#9a948a",
  "#8e887e",
  "#a49d92",
  "#948d83",
];

/** How wide one clipped lump along the top of the hedge is. */
const HEDGE_LUMP = 7;

/** The stucco of the villa. */
const VILLA_WALL = "#e7ded0";

/** The shade along the foot of it. */
const VILLA_SHADE = "#cdc2b1";

/** What is inside an arch, which is nothing one can see. */
const VILLA_DARK = "#2a2521";

/** The tiles. */
const VILLA_TILE = "#c8753a";

/** The line between two courses of them. */
const VILLA_COURSE = "#b96a33";

/** The ridge along the top. */
const VILLA_RIDGE = "#d98a4e";

/** And the eaves, which are in their own shadow. */
const VILLA_EAVE = "#7a4523";

/** The stone round a window or under a balcony. */
const VILLA_TRIM = "#d8cdba";

/** The shutters. */
const VILLA_SHUTTER = "#4a3c2c";

/** The ironwork. */
const VILLA_IRON = "#2b2b2b";

/** A pot on the balcony. */
const VILLA_POT = "#b1795a";

/** And what is growing out of it. */
const VILLA_LEAF = "#4e7a3a";

/** The front door. */
const VILLA_TIMBER = "#5b3a24";

/** Its handle. */
const VILLA_BRASS = "#d4af37";

/** The steps down to the drive. */
const VILLA_STEP = "#ddd2bf";

/** The lamps either side of the door. */
const VILLA_LAMP = "#fde68a";

/** What the forecourt is paved with. */
const VILLA_PAVE = "#b98c6a";

/** The joints in it. */
const VILLA_JOINT = "#9a7051";

/** And the bay painted on it. */
const VILLA_BAY = "#e8ddc8";

/** The clipped hedge along the kerb. */
const VILLA_HEDGE = "#3f6b2f";

/** The light along the top of it. */
const VILLA_HEDGE_TOP = "#5c8a3f";

/** The shade along the foot of it. */
const VILLA_HEDGE_DARK = "#2c4d21";

/** And the tops the sun is actually on. */
const VILLA_HEDGE_LIT = "#6d9c49";

/** One window of it: a frame, its glass and the sill under it. */
function homeWindow(
  ctx: CanvasRenderingContext2D,
  at: number,
  sill: number,
  height: number,
): void {
  const wide = WIN_WIDE;
  const tall = height * WIN_TALL;
  ctx.fillStyle = HOME_FRAME;
  ctx.fillRect(at - wide / 2 - 1, sill - 1, wide + 2, tall + 2);
  ctx.fillStyle = HOME_GLASS;
  ctx.fillRect(at - wide / 2, sill, wide, tall);
  // The glazing bars: one up, one across, which is a sash window at this size.
  ctx.fillStyle = HOME_FRAME;
  ctx.fillRect(at - HALF, sill, 1, tall);
  ctx.fillRect(at - wide / 2, sill + tall / 2 - HALF, wide, 1);
  ctx.fillStyle = HOME_STONE;
  ctx.fillRect(at - wide / 2 - 2, sill + tall + 1, wide + 4, 1.5);
}

/** The stone the good house is built of. */
const HOME_WALL = "#c8bda6";

/** The dressed stone of its quoins, cornice and pediment. */
const HOME_STONE = "#e6ddc8";

/** The plinth course along the bottom. */
const HOME_PLINTH = "#8d8471";

/** How far up the wall that reaches, as a share of its height. */
const PLINTH_UP = 0.12;

/** How deep the cornice band under the eaves is, the same way. */
const CORNICE_TALL = 0.07;

/** How wide a quoin block is, in pixels. */
const QUOIN_WIDE = 5;

/** And how tall. */
const QUOIN_TALL = 5;

/** How many window bays the front is dealt into. */
const HOME_BAYS = 5;

/** Where the lower row sits, as a share of the height. */
const WIN_LOW = 0.56;

/** And the upper. */
const WIN_HIGH = 0.9;

/** How wide one is, in pixels. */
const WIN_WIDE = 7;

/** And how tall, as a share of the wall. */
const WIN_TALL = 0.2;

/** How far either side of the garage mouth is kept clear, in squares. */
const MOUTH_KEEP = 0.6;

/** Where along the front the porch stands, as a share of it. */
const PORCH_AT = 0.2;

/** How tall it is, as a share of the wall. */
const PORCH_TALL = 0.52;

/** How much of that the door itself is. */
const DOOR_SHARE = 0.86;

/** How wide the door is, in pixels. */
const DOOR_WIDE = 9;

/** How far out the columns stand either side of it. */
const PORCH_SPAN = 8;

/** How thick one is. */
const COLUMN = 3;

/** How high the pediment rises above them. */
const PEDIMENT = 5;

/** Where the lamps hang, as a share of the porch. */
const LAMP_UP = 0.72;

/** What the front door is made of. */
const HOME_DOOR = "#4a2f1c";

/** The handle on it. */
const HOME_BRASS = "#fcd34d";

/** And the lamps either side. */
const HOME_LAMP = "#fde68a";

/** A window frame. */
const HOME_FRAME = "#f8fafc";

/** What is behind it. */
const HOME_GLASS = "#25405c";

/** The line round the house. */
const HOME_EDGE = "#292524";

/** The concrete of the parking space. */
const HOME_APRON = "#b6b2a8";

/** And the bay painted on it. */
const HOME_BAY = "#f8fafc";

/** How far in from the edge of the square that marking runs, in pixels. */
const BAY_IN = 5;

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
  // **The way in first, the windows round it.** A veranda post through the
  // middle of a window is the one thing worse than no veranda at all, and with
  // the door in the middle of the front and the windows spread evenly across
  // it there is nothing stopping the two landing in the same place. So the
  // entrance is drawn first and says how much of the wall it wants; the
  // windows then skip whichever of their columns falls inside that.
  const clear = frontage(ctx, foot, wide, height, look, sort, fade);
  drawWindows(ctx, foot, wide, height, look, fade, clear);

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

/**
 * What a building has at street level: a door, a step, and sometimes a porch.
 *
 * @param ctx - what to paint on
 * @param foot - the bottom left corner of the front wall, on screen
 * @param wide - how wide it is
 * @param height - how tall
 * @param look - the block's own dice roll
 * @param sort - what sort of building it is
 * @param fade - how solid to paint it
 * @returns how much of the wall, across, the entrance has taken for itself
 * @remarks
 * **A wall with lit windows in it is a warehouse.** Every building in the city
 * was one flat panel with a grid of glowing squares on it and nothing else -
 * no way in, nothing at the height a person stands at, nothing to tell a house
 * from an office block from the side of a multi-storey car park.
 *
 * Three things fix that and all three are at the bottom, which is where one
 * looks:
 *
 * - **A door**, in the middle, with its frame and a step out onto the
 *   pavement. Every building gets one: whatever else it is, somebody goes in.
 * - **A course of stone** along the foot of the wall, which is what stops the
 *   panel reading as a panel.
 * - **And a veranda** on some of the houses - a roof across the front on two
 *   posts, with the door under it. Not on a bank and not on a fire station;
 *   the plain houses only, and not all of them, because a street on which
 *   every house has the same porch is the same warehouse again.
 */
function frontage(
  ctx: CanvasRenderingContext2D,
  foot: Screen,
  wide: number,
  height: number,
  look: number,
  sort: Building,
  fade: number,
): { from: number; to: number } {
  const plain = sort.name === "";
  const middle = foot.x + wide / 2;
  const tall = Math.min(height * FRONT_UP, FRONT_MOST);
  const leaf = Math.min(wide * FRONT_SHARE, FRONT_WIDEST);
  ctx.save();
  ctx.globalAlpha = fade;

  // The course along the foot of the wall.
  ctx.fillStyle = FOOT_STONE;
  ctx.fillRect(foot.x, foot.y - height * FOOT_UP, wide, height * FOOT_UP);

  // A veranda on some of the houses: a roof band across the front of it and a
  // post at each end, with the door under the middle of it.
  const porch = plain && scatter(Math.round(look * 97), 31) < PORCH_SHARE;
  const span = Math.max(
    leaf + PORCH_ROOM,
    Math.min(wide * PORCH_SHARE_WIDE, PORCH_WIDEST),
  );
  const took = porch ? span : leaf + PORCH_ROOM;
  if (porch) {
    ctx.fillStyle = PORCH_ROOF;
    ctx.fillRect(middle - span / 2, foot.y - tall * PORCH_UP, span, PORCH_DEEP);
    ctx.fillStyle = PORCH_POST;
    for (const post of [-1, 1]) {
      ctx.fillRect(
        middle + (post * span) / 2 - PORCH_POST_WIDE / 2,
        foot.y - tall * PORCH_UP,
        PORCH_POST_WIDE,
        tall * PORCH_UP,
      );
    }
  }

  // The door: its frame, the leaf, a handle and the step out to the pavement.
  ctx.fillStyle = FRONT_FRAME;
  ctx.fillRect(middle - leaf / 2 - 1, foot.y - tall - 1, leaf + 2, tall + 1);
  ctx.fillStyle = plain ? FRONT_WOOD : FRONT_GLASS;
  ctx.fillRect(middle - leaf / 2, foot.y - tall, leaf, tall);
  if (!plain) {
    // A shop front is two leaves of glass with the mullion between them.
    ctx.fillStyle = FRONT_FRAME;
    ctx.fillRect(middle - 0.5, foot.y - tall, 1, tall);
  }
  ctx.fillStyle = FRONT_HANDLE;
  ctx.fillRect(middle + leaf * FRONT_GRIP, foot.y - tall * HALF, 1.5, 1.5);
  ctx.fillStyle = FOOT_STONE;
  ctx.fillRect(middle - leaf / 2 - 2, foot.y - 1, leaf + 4, 2);
  ctx.restore();
  return { from: middle - took / 2, to: middle + took / 2 };
}

/**
 * The drive in front of a house.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param front - where the front wall of the house stands, in city pixels
 * @param from - the left edge of this one house, the same way
 * @param each - how wide it is
 * @param look - this house's own dice roll
 * @param fade - how solid to paint it
 * @remarks
 * Flat on the pavement, off to one side of the front door so that the two do
 * not fight over the same yard of kerb, with the bay painted on it. Which side
 * comes out of the same dice roll everything else about the block does, so a
 * street does not have every drive on the same side of every house.
 */
function drive(
  ctx: CanvasRenderingContext2D,
  view: View,
  front: number,
  from: number,
  each: number,
  look: number,
  fade: number,
): void {
  const side = look < HALF ? DRIVE_IN : 1 - DRIVE_IN - DRIVE_WIDE;
  const left = from + each * side;
  const at = project(view, left, front);
  const wide = each * DRIVE_WIDE;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = DRIVE_SLAB;
  ctx.fillRect(at.x, at.y, wide, DRIVE_DEEP * DEPTH);
  ctx.strokeStyle = DRIVE_BAY;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(at.x + 2, at.y);
  ctx.lineTo(at.x + 2, at.y + DRIVE_DEEP * DEPTH - 2);
  ctx.lineTo(at.x + wide - 2, at.y + DRIVE_DEEP * DEPTH - 2);
  ctx.lineTo(at.x + wide - 2, at.y);
  ctx.stroke();
  ctx.restore();
}

/** How far up the wall a door reaches, as a share of its height. */
const FRONT_UP = 0.34;

/** And the most it may be, in pixels, so a tower block has a door not a gate. */
const FRONT_MOST = 15;

/** How wide it is, as a share of the front. */
const FRONT_SHARE = 0.11;

/** And the most that may be. */
const FRONT_WIDEST = 11;

/** Where the handle sits across the leaf, as a share of it. */
const FRONT_GRIP = 0.3;

/** The frame round it. */
const FRONT_FRAME = "#3f3f46";

/** What the door of a house is made of. */
const FRONT_WOOD = "#5b3a24";

/** And of anything with a name over it. */
const FRONT_GLASS = "#1e3a5f";

/** The handle. */
const FRONT_HANDLE = "#e2e8f0";

/** The stone course along the foot of a wall. */
const FOOT_STONE = "#57534e";

/** How far up the wall it goes, as a share of its height. */
const FOOT_UP = 0.08;

/** How many of the plain houses have a veranda. */
const PORCH_SHARE = 0.4;

/** How wide it is, as a share of the front. */
const PORCH_SHARE_WIDE = 0.3;

/** And at the least, how much wall it wants either side of the door. */
const PORCH_ROOM = 9;

/** And the most that may be, in pixels. */
const PORCH_WIDEST = 46;

/** How far above the door its roof sits, as a share of the door. */
const PORCH_UP = 1.3;

/** How thick that roof is drawn. */
const PORCH_DEEP = 3;

/** What it is made of. */
const PORCH_ROOF = "#8a7a67";

/** The posts under it. */
const PORCH_POST = "#6b5d4d";

/** How thick one is, in pixels. */
const PORCH_POST_WIDE = 2.5;

/** How many of the plain houses have a drive. */
const DRIVE_SHARE = 0.7;

/** How far in from the edge of the plot it sits, as a share of the front. */
const DRIVE_IN = 0.08;

/** How wide it is, the same way. */
const DRIVE_WIDE = 0.42;

/** And how far out onto the pavement it reaches, in pixels. */
const DRIVE_DEEP = 22;

/** What it is paved with. */
const DRIVE_SLAB = "#9a968e";

/** And the bay painted on it. */
const DRIVE_BAY = "#d6d3d1";

/**
 * Windows down the front of a house, lit or dark and always the same ones.
 *
 * @param ctx - what to paint on
 * @param foot - the bottom left corner of the front wall, on screen
 * @param wide - how wide it is
 * @param height - how tall
 * @param look - the block's own dice roll
 * @param fade - how solid to paint it
 * @param clear - the stretch of wall the front door has taken, on screen
 */
function drawWindows(
  ctx: CanvasRenderingContext2D,
  foot: Screen,
  wide: number,
  height: number,
  look: number,
  fade: number,
  clear: { readonly from: number; readonly to: number },
): void {
  const across = Math.max(2, Math.round(wide / 30));
  const floors = Math.max(1, Math.floor((height - 8) / 18));
  const gap = wide / across;
  for (let column = 0; column < across; column += 1) {
    for (let floor = 0; floor < floors; floor += 1) {
      const lit = scatter(column * 7 + floor, Math.round(look * 100)) > 0.55;
      const top = foot.y - PANE_UP - floor * FLOOR_UP;
      // The ground floor gives way to the door and its veranda; the floors
      // above it are over the roof of that and carry on as they were. A window
      // that would land on the entrance is **moved aside**, not thrown away:
      // a front with a door and no windows at all is as odd as one with a
      // veranda post through the glass. Only where a house is too narrow to
      // hold both does the window go.
      const under =
        floor === 0 && top + PANE_TALL > foot.y - height * FOOT_ROOM;
      const even = foot.x + column * gap + gap / 2 - PANE_WIDE / 2;
      const left = under ? beside(foot, wide, clear, column, across) : even;
      if (left === null) {
        continue;
      }
      // The frame first, a shade darker than the wall whatever the wall is,
      // then the glass inside it. A pane with a line round it reads as a hole
      // in a wall; a pane without one reads as a sticker on it.
      ctx.globalAlpha = fade;
      ctx.fillStyle = PANE_FRAME;
      ctx.fillRect(
        left - PANE_EDGE,
        top - PANE_EDGE,
        PANE_WIDE + PANE_EDGE * 2,
        PANE_TALL + PANE_EDGE * 2,
      );
      ctx.fillStyle = lit ? PANE_LIT : PANE_DARK;
      ctx.globalAlpha = (lit ? 0.8 : 0.55) * fade;
      ctx.fillRect(left, top, PANE_WIDE, PANE_TALL);
      // The glazing bars: one up, one across. Four small panes rather than one
      // big one, which is the difference between a window and a windscreen.
      ctx.globalAlpha = fade;
      ctx.fillStyle = PANE_FRAME;
      ctx.fillRect(
        left + PANE_WIDE / 2 - PANE_BAR / 2,
        top,
        PANE_BAR,
        PANE_TALL,
      );
      ctx.fillRect(
        left,
        top + PANE_TALL / 2 - PANE_BAR / 2,
        PANE_WIDE,
        PANE_BAR,
      );
      // And the sill under it, which is the bit that catches the light and
      // tells one at a glance which way up the building is.
      ctx.fillStyle = PANE_SILL;
      ctx.fillRect(
        left - PANE_OUT,
        top + PANE_TALL + PANE_EDGE,
        PANE_WIDE + PANE_OUT * 2,
        PANE_EDGE * 2,
      );
    }
  }
  ctx.globalAlpha = fade;
}

/**
 * Where a ground-floor window goes once the front door has had its say.
 *
 * @param foot - the bottom left corner of the front wall, on screen
 * @param wide - how wide it is
 * @param clear - the stretch of wall the door and its veranda have taken
 * @param column - which window of the row this is
 * @param across - how many there are
 * @returns the left edge of the pane, or null where there is no room for it
 * @remarks
 * **Two stretches of wall, not one.** The windows of a floor are spread evenly
 * across the front, which is right everywhere above the door and wrong at the
 * door: a pane there lands on the veranda posts. The first fix was to shove
 * each offending pane out to the edge of the entrance, and that made its own
 * mess - two panes shoved the same way ended up touching, which is a shop
 * window, not a pair of house windows.
 *
 * So the ground floor is laid out in the two pieces of wall the entrance
 * leaves: the windows that belong to the left of it are spread evenly down the
 * left piece, and those that belong to the right down the right piece. Every
 * pane keeps its neighbours and its spacing, and nothing lands on the door.
 * A piece with no room for even one pane gives its windows up.
 */
function beside(
  foot: Screen,
  wide: number,
  clear: { readonly from: number; readonly to: number },
  column: number,
  across: number,
): number | null {
  // Which side of the entrance this window belongs to: the one it would have
  // stood on had the door not been there.
  const gap = wide / across;
  const even = foot.x + column * gap + gap / 2;
  const west = even < (clear.from + clear.to) / 2;
  const from = west ? foot.x : clear.to;
  const to = west ? clear.from : foot.x + wide;
  // How many share that side, and which of them this one is.
  let mine = 0;
  let count = 0;
  for (let other = 0; other < across; other += 1) {
    const at = foot.x + other * gap + gap / 2;
    if (at < (clear.from + clear.to) / 2 === west) {
      if (other < column) {
        mine += 1;
      }
      count += 1;
    }
  }
  const room = to - from;
  const edge = PANE_OUT + PANE_EDGE;
  return room < PANE_WIDE + edge * 2
    ? null
    : from + (room * (mine + HALF)) / count - PANE_WIDE / 2;
}

/** How wide one pane is drawn, in pixels. */
const PANE_WIDE = 10;

/** And how tall. */
const PANE_TALL = 9;

/** How far above the pavement the ground floor sits. */
const PANE_UP = 12;

/** And how far apart the floors are. */
const FLOOR_UP = 18;

/** How thick the frame round a pane is. */
const PANE_EDGE = 1;

/** How thick the glazing bars across it are. */
const PANE_BAR = 1;

/** How far the sill stands out past the frame on each side. */
const PANE_OUT = 1.5;

/** How far up the wall the front door and its veranda may reach. */
const FOOT_ROOM = 0.75;

/** What the frame and the bars are drawn in. */
const PANE_FRAME = "#27272a";

/** The sill, which is stone wherever the wall is not. */
const PANE_SILL = "#a8a29e";

/** Glass with a light on behind it. */
const PANE_LIT = "#fde68a";

/** And glass with nobody home. */
const PANE_DARK = "#3f3f46";

/**
 * The weapons and vests lying about, and what each one looks like.
 *
 * @param zoom - how close the camera stands
 * @remarks
 * Flat on the road rather than standing up: they are part of the floor, and a
 * box that stood up would be one more thing to lose behind a house. The gentle
 * pulse is the only thing that says "this is not paint".
 *
 * **The same size on the screen at every zoom.** Everything else in the city
 * is drawn through the lens, and rightly: a car twice as far away should look
 * half as big. A pickup is not part of the city, it is a **mark on it** - the
 * same sort of thing as the icon of it in the corner panel - and a mark that
 * shrinks with the lens is a mark one stops being able to read exactly when
 * one has zoomed out to look for it. So it is drawn at one over the zoom,
 * which cancels the lens and leaves it the size it always is.
 */
function drawPickups(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  seen: Seen,
  zoom: number,
): void {
  const flat = 1 / zoom;
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
      ctx.arc(0, 0, 13 * beat * flat, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      drawKit(ctx, spot, drop.holds, flat);
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
  open = false,
): void {
  const shape = VEHICLES[car.body];
  // Under the car, before it: rubber going up is the one thing that says a
  // corner was taken too fast, and it belongs on the road, not on the roof.
  drawSkid(ctx, car, view, now, fade);
  // A patrol car wears its stripes whoever is at the wheel: the police keep
  // the paint when the player steals one, and so does the picture.
  const police = car.kind === "police" || onDuty(car.body);
  const paint = paintOf(car);
  const long = shape.length;
  const wide = shape.width;
  const tiers = tiersOf(car.body);
  const soot = car.health <= 0 ? SOOT : 0;
  // Where the wheels stand this frame. Read off how far the car has rolled, so
  // it is the same on every machine and comes back with a saved game.
  const spin = wheelStep(car.body, car.rolled, car.speed);
  // The picture from above, which for a tank depends on that too: its tracks
  // are on the roof of it, not on its walls.
  const sheet = vehicleSprite(car.body, paint, police, car.driven, spin);
  // **Leaning into the corner.** Only a two-wheeler does it, and it is done by
  // shifting the machine and its rider sideways over the wheels rather than by
  // turning anything: this view has no way to tip a picture over, but a rider
  // two pixels to the inside of his own tyres reads as a rider leaning, which
  // is the whole of what one sees of a bike in a corner from up here.
  const heel = twoWheeled(car.body) ? car.lean : 0;
  const heeled = (share: number): Car => ({
    ...car,
    x: car.x + Math.cos(car.angle + Math.PI / 2) * heel * share,
    y: car.y + Math.sin(car.angle + Math.PI / 2) * heel * share,
  });
  // **It tips rather than slides.** A machine leaning over pivots about where
  // its tyres meet the road, so the further up the bike one looks the further
  // across it has gone: the wheels and the sills barely move, the rider goes
  // the whole way. Shifting every storey by the same amount instead reads as a
  // bike sliding sideways with the rider sitting bolt upright on it.
  const low = heeled(LEAN_FOOT);
  const over = heeled(1);
  // **And it gets narrower as it goes over.** A motorbike on its side shows
  // less of itself to somebody looking down at it than one standing upright
  // does, and that narrowing is half of what makes a lean read as a lean
  // rather than as a machine sliding sideways with the rider still sat bolt
  // upright on it. Only the top of it: at the belt line the thing is as wide
  // as it ever was, and it draws in from there up.
  const tip = heel === 0 ? 0 : Math.min(1, Math.abs(heel) / LEAN_MOST);
  const squash = 1 - LEAN_NARROW * tip;
  shadow(ctx, view, car, long / 2, wide / 2, car.angle, fade);
  beam(ctx, view, car, fade);
  // **The open door, and which side of the car it is on.** There is no depth
  // test in this picture, so a door on the far side has to go down before the
  // bodywork and one on the near side after it - otherwise a car pointing east
  // stands there with its door drawn through its own roof. The driver's side is
  // the car's **left**, which faces the camera when the nose points west.
  const near = Math.cos(car.angle) < 0;
  if (open && !near) {
    swungDoor(ctx, view, car, tiers, paint, fade);
  }

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
    // The wheels are on the road where the road is; the sills above them have
    // already started to go over. That is what a tip is - every storey further
    // across than the one under it - and it is why this wall has a top outline
    // of its own on a two-wheeler and none on anything else.
    placed(body, car, car.angle),
    wallFaces(body),
    {
      base: 0,
      top: tiers.belt,
      fade,
      soot,
      paint,
      single: car.body === "cycle",
      lean: heel === 0 ? null : placed(body, low, car.angle),
    },
    (face, mirror) =>
      vehicleWall(
        car.body,
        paint,
        police,
        face,
        false,
        spin,
        car.locked,
        mirror,
        car.driven,
      ),
  );
  stampTop(ctx, view, low, tiers.belt, {
    part: "body",
    sheet,
    cabin: null,
    fade,
    soot,
  });

  // And the cabin standing on it, which is what makes it a car and not a box.
  // The tank is the exception: its upper storey turns on its own.
  if (car.body === "tank") {
    // **It is still a box.** The turret used to be laid on as a flat picture
    // at roof height with nothing at all underneath it, so between the deck of
    // the hull and the turret sitting on it there were seven pixels of open
    // air - one could look straight through a tank at the place where its
    // armour is thickest. So it gets walls like everything else here; what is
    // different about it is only that they are placed at the angle of the gun
    // rather than the angle of the tracks, and they are the one set of walls
    // in the city that turns while the vehicle under them stands still.
    const turret = cabinOutline(car.body);
    panels(
      ctx,
      view,
      placed(turret, car, car.turret),
      wallFaces(turret),
      {
        base: tiers.belt,
        top: tiers.tall,
        fade,
        soot,
        paint,
        lean: null,
      },
      (face, mirror) =>
        vehicleWall(
          car.body,
          paint,
          police,
          face,
          true,
          spin,
          car.locked,
          mirror,
          car.driven,
        ),
    );
    drawTurret(ctx, view, car, tiers.tall, fade, soot);
  } else {
    // The cabin, whose walls lean: a windscreen that slopes back takes the
    // roof with it, so the top of the wall is the outline the roof is clipped
    // to rather than the one it stands on.
    const cabin = cabinOutline(car.body);
    const drawn =
      squash === 1
        ? cabin
        : cabin.map((point) => ({ x: point.x, y: point.y * squash }));
    panels(
      ctx,
      view,
      placed(cabin, low, car.angle),
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
        single: car.body === "cycle",
        // The top of this wall is where the roof is: fully over, and drawn in.
        lean: placed(leaning(drawn, tiers), over, car.angle),
      },
      (face, mirror) =>
        vehicleWall(
          car.body,
          paint,
          police,
          face,
          true,
          spin,
          car.locked,
          mirror,
          car.driven,
        ),
    );
    stampTop(ctx, view, over, tiers.tall, {
      part: "all",
      sheet,
      cabin: tiers,
      fade,
      soot,
      squash,
    });
  }

  if (open && near) {
    swungDoor(ctx, view, car, tiers, paint, fade);
  }

  if (car.body === "taxi") {
    taxiSign(ctx, view, car, tiers, fade);
  }

  if (police && LAMP_SIDES[car.body] === undefined) {
    beacon(ctx, view, car, tiers, fade, now);
  } else if (police && twoWheeled(car.body)) {
    // **Two wheels, not "everything without a light bar".** The tank is in
    // that second list as well - it has no roof to stand a bar on either - and
    // it was being given the motorbike's three blue lamps: sixty tons of
    // tracked steel flashing away at the traffic like a squad car. The army
    // does not run a blue light on one, and neither does this one.
    //
    // A bike has no roof to stand a light bar on. It carries three lamps
    // instead - one beside each grip and one in the middle of the tail - and
    // they keep the same left-then-right beat the bar does, the tail lamp
    // going with the left.
    const shape = VEHICLES[car.body];
    const nose = shape.length / 2;
    ctx.save();
    ctx.globalAlpha = fade;
    for (const seat of [
      { along: nose - BIKE_BLUES, across: -BIKE_APART },
      { along: nose - BIKE_BLUES, across: BIKE_APART },
      { along: -nose + BIKE_TAIL, across: 0 },
    ]) {
      if (!onCall(car, now, seat.across)) {
        continue;
      }
      lamp(
        ctx,
        view,
        car,
        { along: seat.along, across: seat.across, high: tiers.tall * 0.9 },
        { glass: BLUE_GLASS, halo: BLUE_HALO, size: GRILLE_GLOW },
      );
    }
    ctx.restore();
  }

  // No frame round the one being driven. The camera sits on it, so which car
  // that is was never in doubt - and a box drawn round a vehicle is the one
  // thing on the screen that could not be part of the city.
  lamps(ctx, view, car, tiers, fade);
  drawDamage(ctx, view, car, now, fade);
}

/**
 * The light bar on the roof of a patrol car.
 *
 * @param ctx - what to draw on
 * @param view - the camera
 * @param car - the vehicle
 * @param tiers - how high it stands, for where the roof is
 * @param fade - how much of it a house in front lets through
 * @remarks
 * **A box, not a rectangle.** It used to be painted flat into the roof
 * picture, and a rectangle of colour lying in the paint reads as a sticker -
 * it has no thickness, it does not catch the light from the side, and from a
 * low angle it disappears into the roof altogether. This one is built the way
 * the rest of the city is: an outline raised to a height, its walls painted
 * back to front and a lid on top. Three boxes, in fact - a blue lamp at each
 * end and the dark control box between them, which is what one of these
 * actually looks like from ten metres away.
 *
 * It sits at the **front** of the roof, just behind the top of the windscreen,
 * which is where the roof begins: further back and it rides the middle of the
 * car like a taxi sign.
 */
function beacon(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  tiers: VehicleTiers,
  fade: number,
  now: number,
): void {
  const wide = (tiers.cabinWide / 2) * BAR_WIDE;
  const front = tiers.cabinFront - tiers.rake - BAR_BACK;
  const back = front - BAR_LONG;
  const foot = tiers.tall;
  const lid = foot + BAR_TALL;
  ctx.save();
  ctx.globalAlpha = fade;
  // The far lamp, the box, the near lamp: painted in that order so that the
  // nearer ones cover the further, whichever way the car is pointing.
  const cut = wide * BAR_LAMP;
  const parts: readonly { readonly from: number; readonly to: number }[] = [
    { from: -wide, to: -cut },
    { from: -cut, to: cut },
    { from: cut, to: wide },
  ];
  const seen = parts
    .map((part) => ({
      part,
      lamp: Math.abs(part.from) === wide || Math.abs(part.to) === wide,
      depth: Math.sin(car.angle) * ((part.from + part.to) / 2),
    }))
    .sort((one, other) => one.depth - other.depth);
  for (const each of seen) {
    const corners = placed(
      [
        { x: back, y: each.part.from },
        { x: front, y: each.part.from },
        { x: front, y: each.part.to },
        { x: back, y: each.part.to },
      ],
      car,
      car.angle,
    );
    // Each half of the bar asks for itself, because the two halves do not fire
    // together: the middle box is never lit either way.
    const lens = each.lamp && onCall(car, now, each.part.from + each.part.to);
    boxOnRoof(
      ctx,
      view,
      corners,
      foot,
      lid,
      each.lamp ? (lens ? BAR_LAMP_SIDE : BAR_DARK_SIDE) : BAR_BOX,
      each.lamp ? (lens ? BAR_LAMP_LID : BAR_DARK_LID) : BAR_BOX_LID,
    );
  }
  ctx.restore();
  // And the light itself, which is the point of the whole thing: the two on
  // the roof, and the pair buried in the grille that go off with them. Those
  // are invisible until they fire - there is nothing painted on the nose for
  // them, which is what makes an unmarked flash out of a silver radiator
  // grille worth having. Each side keeps its own beat here too, so the grille
  // lamp fires with the roof lamp above it and not with the other one.
  const long = VEHICLES[car.body].length / 2;
  ctx.save();
  ctx.globalAlpha = fade;
  for (const side of [-1, 1]) {
    if (!onCall(car, now, side)) {
      continue;
    }
    lamp(
      ctx,
      view,
      car,
      {
        along: (front + back) / 2,
        across: side * wide * BAR_GLOW,
        high: lid,
      },
      { glass: BLUE_GLASS, halo: BLUE_HALO, size: BLUE_GLOW },
    );
    lamp(
      ctx,
      view,
      car,
      {
        along: long - 1,
        across: side * GRILLE_ACROSS,
        high: tiers.belt * GRILLE_HIGH,
      },
      { glass: BLUE_GLASS, halo: BLUE_HALO, size: GRILLE_GLOW },
    );
  }
  ctx.restore();
}

/**
 * The sign on a taxi's roof.
 *
 * @param ctx - what to draw on
 * @param view - the camera
 * @param car - the taxi
 * @param tiers - how high it stands
 * @param fade - how much of it a house in front lets through
 * @remarks
 * **A little box with the word on its two big faces**, which is what a taxi
 * sign is: wide across the car, only a couple of pixels deep, and tall enough
 * to carry four letters. So TAXI goes on the face that looks forward and on
 * the face that looks back, not on the lid - one reads it from in front of the
 * taxi or from behind it, the way one does on the street, rather than from
 * directly overhead where nobody stands.
 *
 * That also means the word shows when the taxi is pointing up or down the
 * screen and not when it is pointing across it, which is not a bug: this view
 * has no perspective in it, so a face turned east or west collapses to a line.
 * What one sees of such a taxi is the yellow box, which is enough.
 *
 * And it sits where it sits on a real one: **forward on the roof and over the
 * driver**, not in the middle of it.
 */
function taxiSign(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  tiers: VehicleTiers,
  fade: number,
): void {
  const along = tiers.cabinFront - tiers.rake - SIGN_BACK;
  const across = -SIGN_ASIDE;
  const foot = tiers.tall;
  const lid = foot + SIGN_TALL;
  const feet = placed(
    [
      { x: along - SIGN_LONG, y: across - SIGN_WIDE },
      { x: along + SIGN_LONG, y: across - SIGN_WIDE },
      { x: along + SIGN_LONG, y: across + SIGN_WIDE },
      { x: along - SIGN_LONG, y: across + SIGN_WIDE },
    ],
    car,
    car.angle,
  ).map((corner) => project(view, corner.x, corner.y));

  // The four walls, furthest first, so the near ones cover the far ones. The
  // two that run the width of the sign - the first and the third edge - are
  // the faces with the word on them.
  const walls = feet.map((from, at) => {
    const to = feet[(at + 1) % feet.length] ?? from;
    return { at, from, to, depth: (from.y + to.y) / 2 };
  });
  walls.sort((one, other) => one.depth - other.depth);
  ctx.save();
  ctx.globalAlpha = fade;
  for (const wall of walls) {
    const quad = new Path2D();
    quad.moveTo(wall.from.x, wall.from.y - foot);
    quad.lineTo(wall.to.x, wall.to.y - foot);
    quad.lineTo(wall.to.x, wall.to.y - lid);
    quad.lineTo(wall.from.x, wall.from.y - lid);
    quad.closePath();
    ctx.fillStyle = SIGN_SIDE;
    ctx.fill(quad);
    if (wall.at % 2 === 1) {
      signWord(ctx, wall.from, wall.to, foot, lid);
    }
  }
  const top = new Path2D();
  feet.forEach((spot, at) => {
    if (at === 0) {
      top.moveTo(spot.x, spot.y - lid);
    } else {
      top.lineTo(spot.x, spot.y - lid);
    }
  });
  top.closePath();
  ctx.fillStyle = SIGN_LID;
  ctx.fill(top);
  ctx.restore();
}

/**
 * The word across one face of the sign.
 *
 * @param ctx - what to draw on
 * @param from - one bottom corner of the face, on screen
 * @param to - the other
 * @param foot - how high the bottom of the face is
 * @param lid - and its top
 * @remarks
 * The face is a parallelogram: it runs along the edge on the ground and
 * straight up from it, so the word is laid on with the same shear - along the
 * edge across, and straight down the wall for its height.
 *
 * **Turned about where the edge points left**, which is the same trick the
 * lettering on a patrol car's doors uses: printed one way round it would read
 * backwards from one end of the street, and a taxi that says IXAT from behind
 * is worse than one that says nothing.
 */
function signWord(
  ctx: CanvasRenderingContext2D,
  from: Vec,
  to: Vec,
  foot: number,
  lid: number,
): void {
  const run = { x: to.x - from.x, y: to.y - from.y };
  // A face turned east or west collapses to a line in this view, and a word
  // squeezed into a line is a smudge.
  if (Math.abs(run.x) < SIGN_EDGE) {
    return;
  }
  const turn = run.x < 0 ? -1 : 1;
  const span = SIGN_WIDE * 2;
  ctx.save();
  ctx.transform(
    (run.x * turn) / span,
    (run.y * turn) / span,
    0,
    1,
    (from.x + to.x) / 2,
    (from.y + to.y) / 2 - (foot + lid) / 2,
  );
  ctx.fillStyle = SIGN_INK;
  ctx.font = `700 ${String(SIGN_TALL * SIGN_TEXT)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TAXI", 0, 0);
  ctx.restore();
}

/** How far the sign reaches along the roof, from its middle. */
const SIGN_LONG = 0.9;

/** And across it, which is the way the word runs. */
const SIGN_WIDE = 3.2;

/** How high it stands off the roof - tall enough to carry four letters. */
const SIGN_TALL = 2.4;

/** How far back from the front of the roof it is bolted on. */
const SIGN_BACK = 3;

/** And how far over towards the driver's door, which is the left one. */
const SIGN_ASIDE = 3;

/** Below this much width on screen a face is edge on, in pixels. */
const SIGN_EDGE = 2;

/** What its sides are painted. */
const SIGN_SIDE = "#eab308";

/** And its top, which is the lit face. */
const SIGN_LID = "#fde047";

/** What is written on the two big faces of it. */
const SIGN_INK = "#1c1917";

/**
 * How tall the letters are, as a share of the sign.
 *
 * @remarks
 * Four bold capitals come out about two and a half times as wide as they are
 * tall, so a sign six pixels across carries letters of about two and a half -
 * which is most of the height of this one and exactly the point of building it
 * tall rather than flat.
 */
const SIGN_TEXT = 0.85;

/**
 * Whether this car's blue lights are burning at this instant.
 *
 * @param car - the vehicle
 * @param now - the time on the city clock, in seconds
 * @returns true on the two short flashes of each half second
 * @remarks
 * **Only when it is on a call.** A patrol car that is simply driving about -
 * and most of them are, which is why one rolls in ordinary traffic - has its
 * lights off, and that is the difference between the police being around and
 * the police being after you. The ones the station sends out when the player
 * has stars are the ones that flash; one the player has taken for himself does
 * not, because at that point nobody is on a call.
 *
 * The rhythm is the German one and it is not a slow pulse: **two short flashes
 * close together, and better than twice a second**. The two sides are one
 * flash apart, which gives the whole bar three beats out of two double
 * flashes: **the left alone, then both together, then the right alone.** That
 * is what a real bar does, and it is what makes one read as a bar of lamps
 * rather than as one lamp the width of a roof.
 *
 * @param side - which half of the bar is being asked: negative or nought for
 *   the left, positive for the right.
 * @remarks
 * **And no two vehicles are in step.** Every machine gets its own offset off
 * its id, so a street with four of them on it flickers rather than pulsing;
 * two of them landing on the same beat is possible and looks like what it is,
 * a coincidence.
 */
function onCall(car: Car, now: number, side = 0): boolean {
  // The right-hand lamps **lag** the left by one flash, so the offset is taken
  // off the clock rather than added to it - added, the right would arrive
  // first and the pattern would come out as both, left, right.
  const lag = side > 0 ? FLASH_OVER - BLUE_APART : 0;
  const beat = (now + ownBeat(car) + lag) % FLASH_OVER;
  return (
    car.kind === "police" &&
    !car.driven &&
    (beat < FLASH_LIT ||
      (beat >= FLASH_AGAIN && beat < FLASH_AGAIN + FLASH_LIT))
  );
}

/**
 * Where in the round one vehicle's lights start.
 *
 * @param car - the vehicle
 * @returns an offset in seconds, somewhere inside one round
 * @remarks
 * Off the id and nothing else: it has to be the same every frame, the same
 * after a saved game is loaded, and different from its neighbour's. An
 * irrational-looking multiplier keeps consecutive ids from landing a neat
 * fraction apart, which would be a pattern rather than a crowd.
 */
function ownBeat(car: Car): number {
  return ((car.id * 0.6180339887) % 1) * FLASH_OVER;
}

/** How long one round of the blue lights lasts, in seconds. */
const FLASH_OVER = 0.42;

/** How long each of its two flashes burns. */
const FLASH_LIT = 0.06;

/** And how far into the round the second one comes. */
const FLASH_AGAIN = 0.12;

/**
 * How far the right-hand lamps lag the left, in seconds.
 *
 * @remarks
 * **Exactly one flash.** That is what makes the pattern read as a pattern:
 * the left fires, then the left's second flash and the right's first land
 * together, then the right fires alone. Left, both, right - three beats out of
 * two double flashes, and none of the three has to be written down.
 */
const BLUE_APART = FLASH_AGAIN;

/** How far out the hidden grille lights sit, in city pixels. */
const GRILLE_ACROSS = 3.4;

/** And how far up the nose, as a share of the bodyside. */
const GRILLE_HIGH = 0.6;

/** How far their flash reaches, in screen pixels. */
const GRILLE_GLOW = 2.8;

/** How far back from the nose a patrol bike carries its front blue lights. */
const BIKE_BLUES = 12;

/** And how far out from the middle, which is beside the grips. */
const BIKE_APART = 3.6;

/** The third one sits this far forward of the tail. */
const BIKE_TAIL = 2;

/**
 * One little box standing on a roof: its walls, then its lid.
 *
 * @param ctx - what to draw on
 * @param view - the camera
 * @param corners - the four corners of its footprint, already placed
 * @param foot - how high off the road it stands
 * @param lid - and how high its top is
 * @param wall - what its sides are painted
 * @param face - and its top
 * @remarks
 * The same trick as {@link panels} and for the same reason: every wall, back
 * to front, no culling. At this size that is four little quadrilaterals, and
 * working out which two of them face the camera costs more than drawing all
 * four.
 */
function boxOnRoof(
  ctx: CanvasRenderingContext2D,
  view: View,
  corners: readonly Vec[],
  foot: number,
  lid: number,
  wall: string,
  face: string,
): void {
  const feet = corners.map((corner) => project(view, corner.x, corner.y));
  const walls = feet.map((from, at) => {
    const to = feet[(at + 1) % feet.length] ?? from;
    return { from, to, depth: (from.y + to.y) / 2 };
  });
  walls.sort((one, other) => one.depth - other.depth);
  ctx.fillStyle = wall;
  for (const side of walls) {
    const quad = new Path2D();
    quad.moveTo(side.from.x, side.from.y - foot);
    quad.lineTo(side.to.x, side.to.y - foot);
    quad.lineTo(side.to.x, side.to.y - lid);
    quad.lineTo(side.from.x, side.from.y - lid);
    quad.closePath();
    ctx.fill(quad);
  }
  const top = new Path2D();
  feet.forEach((spot, at) => {
    if (at === 0) {
      top.moveTo(spot.x, spot.y - lid);
    } else {
      top.lineTo(spot.x, spot.y - lid);
    }
  });
  top.closePath();
  ctx.fillStyle = face;
  ctx.fill(top);
}

/**
 * How far across the light bar reaches, as a share of half the **roof**.
 *
 * @remarks
 * Of the roof, not of the car: a light bar runs from one roof rail to the
 * other, and measured against the whole width of the car it came out barely
 * half as wide as it should be - a little blue box sitting in the middle of a
 * lot of silver.
 */
const BAR_WIDE = 0.92;

/** How far behind the top of the windscreen it starts, in city pixels. */
const BAR_BACK = 0.6;

/** How long it is from front to back. */
const BAR_LONG = 1.8;

/** And how high it stands off the roof. */
const BAR_TALL = 1.5;

/** Where the blue ends stop and the dark box between them starts. */
const BAR_LAMP = 0.42;

/** The side of a blue lamp, which is darker than its lens. */
const BAR_LAMP_SIDE = "#1d4ed8";

/** And the lens itself, seen from above. */
const BAR_LAMP_LID = "#3b82f6";

/** The side of a blue lamp with nothing behind it. */
const BAR_DARK_SIDE = "#172554";

/** And its lens, unlit. */
const BAR_DARK_LID = "#1e3a8a";

/** The side of the control box between the two lamps. */
const BAR_BOX = "#0f172a";

/** And its lid. */
const BAR_BOX_LID = "#1e293b";

/** How far out the glow sits, as a share of the bar's half width. */
const BAR_GLOW = 0.72;

/** What a blue lamp is made of. */
const BLUE_GLASS = "#93c5fd";

/** And what it throws, as red, green and blue. */
const BLUE_HALO = "40,110,255";

/** How far that reaches, in screen pixels. */
const BLUE_GLOW = 3.4;

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
  patrolbike: [0],
  // **A bicycle has no lights at all** - no headlamp, no tail lamp and no
  // brake light, because it has no battery and nothing to switch one on with.
  // An empty list turns off the glass, the glow, the brake and the pool of
  // light on the road in one go: they all ask this first.
  cycle: [],
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
          backBulb(car),
        );
      }
    }
    ctx.restore();
  }
}

/**
 * What the back of a vehicle is showing.
 *
 * @param car - the vehicle
 * @returns the colour of the glass, what it throws, and how far
 * @remarks
 * Three states, and every vehicle in the city has all three:
 *
 * - **Reversing**, which is white and bright. A reversing lamp is the one
 *   light on a car that means something other than "here I am" - it says the
 *   thing is about to come backwards at you - so it wins over the other two.
 *   Read off the speed rather than off a flag, because a car rolling backwards
 *   down a hill with the engine off is still reversing as far as anybody
 *   behind it is concerned. **Nothing on two wheels has one**: no reverse
 *   gear, no reversing lamp.
 * - **Braking**, which is the same red only harder.
 * - **Neither**, which is the tail lamp every car here drives with lit.
 */
function backBulb(car: Car): {
  readonly glass: string;
  readonly halo: string;
  readonly size: number;
} {
  let bulb;
  if (car.speed < -BACKING_UP && !twoWheeled(car.body)) {
    bulb = { glass: BACK_GLASS, halo: BACK_HALO, size: BACK_GLOW };
  } else if (car.braking) {
    bulb = { glass: BRAKE_GLASS, halo: TAIL_HALO, size: BRAKE_GLOW };
  } else {
    bulb = { glass: TAIL_GLASS, halo: TAIL_HALO, size: TAIL_GLOW };
  }
  return bulb;
}

/** How fast backwards a vehicle counts as reversing, in pixels a second. */
const BACKING_UP = 4;

/** What a reversing lamp is made of. */
const BACK_GLASS = "#ffffff";

/** And what it throws, as red, green and blue. */
const BACK_HALO = "255,255,245";

/** How far, in screen pixels. */
const BACK_GLOW = 4.2;

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
 * The driver's door, standing open.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param car - the vehicle it belongs to
 * @param tiers - how high its bodywork stands
 * @param paint - what it is painted in
 * @param fade - how solid the vehicle is drawn this frame
 * @remarks
 * A door is a piece of wall, so it is drawn as one: a panel hinged at its
 * front edge, swung out by {@link DOOR_SWING}, standing from just above the
 * sill to the belt line. Nothing is cut out of the car where it used to be -
 * at this size the doorway would be two pixels of shadow and the panel already
 * says what has happened.
 *
 * A motorbike has no door and gets none. One does not open a motorbike; one
 * swings a leg over it, and the pause while that happens is the same pause.
 */
function swungDoor(
  ctx: CanvasRenderingContext2D,
  view: View,
  car: Car,
  tiers: VehicleTiers,
  paint: string,
  fade: number,
): void {
  if (twoWheeled(car.body) || car.body === "tank") {
    return;
  }
  const shape = VEHICLES[car.body];
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const hinge = shape.length * DOOR_HINGE;
  const leaf = shape.length * DOOR_LEAF;
  // The driver's door is the left one, and left is the negative side of a car
  // whose nose runs along its own x axis in a picture with y pointing down.
  const side = -shape.width / 2;
  // The hinge on the flank, and the far edge swung out from it.
  const corners: readonly {
    readonly along: number;
    readonly across: number;
  }[] = [
    { along: hinge, across: side },
    {
      along: hinge - Math.cos(DOOR_SWING) * leaf,
      across: side - Math.sin(DOOR_SWING) * leaf,
    },
  ];
  const foot = tiers.belt * DOOR_SILL;
  const spot = (
    at: { readonly along: number; readonly across: number },
    high: number,
  ): Vec =>
    project(
      view,
      car.x + cos * at.along - sin * at.across,
      car.y + sin * at.along + cos * at.across,
      high,
    );
  const panel = new Path2D();
  const first = corners[0];
  const second = corners[1];
  if (first === undefined || second === undefined) {
    return;
  }
  const a = spot(first, foot);
  const b = spot(second, foot);
  const c = spot(second, tiers.belt);
  const d = spot(first, tiers.belt);
  panel.moveTo(a.x, a.y);
  panel.lineTo(b.x, b.y);
  panel.lineTo(c.x, c.y);
  panel.lineTo(d.x, d.y);
  panel.closePath();
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = paint;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;
  ctx.lineJoin = "round";
  ctx.fill(panel);
  ctx.stroke(panel);
  // The glass in the top of it, so the panel reads as a door and not a flap.
  const glass = new Path2D();
  const up = (at: Vec, low: Vec, share: number): Vec => ({
    x: low.x + (at.x - low.x) * share,
    y: low.y + (at.y - low.y) * share,
  });
  const e = up(d, a, DOOR_GLASS);
  const f = up(c, b, DOOR_GLASS);
  glass.moveTo(e.x, e.y);
  glass.lineTo(f.x, f.y);
  glass.lineTo(c.x, c.y);
  glass.lineTo(d.x, d.y);
  glass.closePath();
  ctx.fillStyle = DOOR_PANE;
  ctx.fill(glass);
  ctx.restore();
}

/** What the window in a door is: the same dark blue the screens are. */
const DOOR_PANE = "#1e293b";

/** How far forward on the body the driver's door is hinged, as a share. */
const DOOR_HINGE = 0.1;

/** And how long the door itself is, the same way. */
const DOOR_LEAF = 0.27;

/** How far out it swings, in radians. */
const DOOR_SWING = 1.1;

/** How far above the road the bottom of it sits, as a share of the belt. */
const DOOR_SILL = 0.1;

/** Where the glass in it starts, as a share of the way up the panel. */
const DOOR_GLASS = 0.74;

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
  // On a tractor the lamps are up on the corners of the bonnet and on the cab
  // roof, not down by the axle - it is a machine one is meant to see over a
  // hedge, and a lamp halfway up its bodyside would be behind the wheel.
  tractor: 0.88,
  car: 0.64,
  patrol: 0.64,
  corsa: 0.64,
  corsaelegance: 0.64,
  corsaultimate: 0.64,
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
  // Right at the top of the wings, where a tractor carries them. Halfway up
  // put them behind the back wheel, which is two thirds of the bodyside.
  tractor: 0.98,
  car: 0.88,
  patrol: 0.88,
  corsa: 0.88,
  corsaelegance: 0.88,
  corsaultimate: 0.88,
  suv: 0.86,
};

/**
 * How much of a two-wheeler's lean the bodywork below the belt line takes.
 *
 * @remarks
 * Not none, or the machine would be a rider leaning off a bike that stayed
 * upright under him; not all of it, or the tyres would leave the line they are
 * running on. Somewhere under half, which is a bike tipped over on its contact
 * patches with the rider further over still.
 */
const LEAN_FOOT = 0.32;

/**
 * How much narrower a two-wheeler is drawn at full lean, as a share.
 *
 * @remarks
 * A third of its width gone. Seen from above a machine on its side shows its
 * flank rather than its saddle, and while this view cannot actually turn one
 * over, it can draw the top of it narrower - which, with the rider carried out
 * to the side at the same time, is what somebody hanging off a bike in a
 * corner looks like from a helicopter.
 */
const LEAN_NARROW = 0.34;

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
    // One firm, one livery: a parcel van that came in seven colours would be a
    // van, not a parcel van.
    case "transporter":
      paint = VAN_PAINT;
      break;
    case "tractor":
      paint = TRACTOR_GREEN;
      break;
    case "taxi":
      paint = TAXI_PAINT;
      break;
    case "car":
      paint = GOLF_PAINT[car.colour % GOLF_PAINT.length] ?? "#6c7175";
      break;
    case "corsa":
    case "corsaelegance":
    case "corsaultimate":
      paint = CORSA_PAINT[car.colour % CORSA_PAINT.length] ?? "#e8541b";
      break;
    case "patrol":
    case "patrolbike":
      paint = PATROL_SILVER;
      break;
    case "bike":
      paint = BIKE_PAINT[car.colour % BIKE_PAINT.length] ?? "#166534";
      break;
    case "suv":
      paint = CYBER_STEEL;
      break;
    default:
      paint = CAR_PAINT[car.colour % CAR_PAINT.length] ?? "#dc2626";
  }
  return car.kind === "police" || onDuty(car.body) ? PATROL_SILVER : paint;
}

/**
 * Whether this body is a police machine whoever happens to be on it.
 *
 * @param body - the sort of vehicle
 * @returns true for the patrol car and the patrol bike
 * @remarks
 * The livery belongs to the machine, not to the driver. A patrol car the
 * player has taken is still a patrol car - that is the point of taking one -
 * and one simply driving about in ordinary traffic is one too.
 */
function onDuty(body: VehicleBody): boolean {
  return body === "patrol" || body === "patrolbike";
}

/**
 * The two colours an ordinary motorbike comes in.
 *
 * @remarks
 * Green or black, and nothing else. It is the same machine as the patrol bike
 * under the stripes, so it needs a paint that could not be mistaken for the
 * livery - and two dark colours do that better than a boxful of bright ones.
 */
const BIKE_PAINT: readonly string[] = ["#166534", "#18181b"];

/**
 * The one colour a Cybertruck comes in.
 *
 * @remarks
 * **It is not painted at all.** The body is bare stainless steel - there is no
 * paint shop in the factory for it - so there is one of them and one only: a
 * cold light grey with almost no colour in it, the way rolled aluminium or
 * steel looks in daylight. A red one is not a rare one, it is a different
 * vehicle.
 */
const CYBER_STEEL = "#c6cbd1";

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
 * The front on everything. The back window of a saloon leans as well, but it
 * is drawn leaning on the side panels and the roof is left alone - trimming
 * the roof there too left a notch at the rear corner where the wall's top edge
 * and the roof no longer met.
 *
 * `rakeBack` is the exception, and only the Cybertruck has one: on that body
 * the back is not a window in a roof, it is the roof coming down, and its own
 * flank picture draws exactly the same slope - so the two meet and there is no
 * notch to leave.
 */
function leaning(outline: readonly Vec[], tiers: VehicleTiers): readonly Vec[] {
  const front = tiers.cabinFront - tiers.rake;
  const back = tiers.cabinBack + (tiers.rakeBack ?? 0);
  return outline.map((point) => ({
    x: Math.min(Math.max(point.x, back), front),
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
   * Whether only the flank facing the camera is painted.
   *
   * @remarks
   * For the two-wheelers, and for nothing else. Every wall of a car is drawn,
   * far ones first, because there is a car's worth of volume between the two
   * flanks and the near one covers the far one - leave the far one out and a
   * slot of daylight opens between the roof and the bodywork.
   *
   * A bicycle has no such volume, and nothing solid to hide anything behind
   * either: it is a set of tubes and two rings one can see straight through.
   * Both flanks therefore landed in plain sight a few pixels apart, and what
   * one saw was **four** wheels - two on the road and two floating above them.
   * Only the bicycle: a motorbike has bodywork, its far flank is covered by
   * its own machine, and taking that flank away opens daylight through it.
   */
  readonly single?: boolean;
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
  sheetFor: (face: VehicleFace, mirror: boolean) => HTMLCanvasElement | null,
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
  const middle =
    corners.reduce((sum, point) => sum + point.y, 0) /
    Math.max(1, corners.length);
  for (const wall of shown) {
    const at = wall.at;
    const side = walls[at];
    const face = side?.face ?? null;
    if (storey.single === true && face === "flank" && wall.depth < middle) {
      continue;
    }
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
    // Which way round the writing on this wall has to be drawn. **Not the same
    // question as `flip`**: that one says how the picture maps on to the edge
    // in the car's own coordinates, and it is the same whichever way the car
    // is pointing. What a word needs to know is which way it ends up running
    // across the **screen**, and that turns with the car - both flanks at
    // once, since they turn together. The picture's own x axis lands on screen
    // along `along`, or against it where the edge is flipped, so the writing is
    // mirrored whenever that comes out pointing left.
    const reads = (side?.flip === true ? -along.x : along.x) < 0;
    const sheet = face === null ? null : sheetFor(face, reads);
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
  /**
   * How wide across the vehicle to draw it, as a share of its own width.
   *
   * @remarks
   * One for everything that is standing up straight, which is everything on
   * four wheels. Below one for a two-wheeler in a corner: see `LEAN_NARROW`.
   * The clip goes through the same squeeze, so the roof and the shape it is
   * cut to stay the same size as each other.
   */
  readonly squash?: number;
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
    ctx.scale(1, lid.squash ?? 1);
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
  // **A bicycle raises none.** There is not enough weight on those two thin
  // tyres to burn anything off them: a bicycle that loses grip slides, and
  // that is all it does.
  const tyres =
    car.body === "cycle" ? [] : twoWheeled(car.body) ? [0] : [-1, 1];
  if (across < SLIP_SMOKE || tyres.length === 0) {
    return;
  }
  const shape = VEHICLES[car.body];
  const hard = Math.min(1, (across - SLIP_SMOKE) / SLIP_SMOKE);
  const back = -shape.length * 0.3;
  const side = shape.width * 0.42;
  ctx.save();
  // **Smoke, not confetti.** Three flat discs of one grey read as three discs;
  // what a burning tyre actually does is put up a plume that leaves the road
  // where the rubber is, climbs, spreads and thins out to nothing behind the
  // car. So each puff along the trail is bigger than the one in front of it,
  // higher off the road, and fainter - and every one of them is a soft edge
  // rather than a hard one, which is the whole difference between smoke and a
  // circle drawn in pale grey.
  for (const wheel of tyres) {
    for (let puff = 0; puff < SMOKE_PUFFS; puff += 1) {
      const age = puff / Math.max(1, SMOKE_PUFFS - 1);
      const trail = back - puff * SMOKE_BACK * (0.6 + hard);
      // It churns as it goes: the further back a puff is, the further it has
      // wandered off the line the tyre took.
      const wobble =
        Math.sin(now * 6 + puff * 1.7 + wheel * 2.3) * (1 + puff * 1.2);
      const spot = project(
        view,
        car.x +
          Math.cos(car.angle) * trail -
          Math.sin(car.angle) * (side * wheel + wobble),
        car.y +
          Math.sin(car.angle) * trail +
          Math.cos(car.angle) * (side * wheel + wobble),
        SMOKE_FOOT + puff * SMOKE_RISE,
      );
      const size = SMOKE_SEED + puff * SMOKE_GROW;
      const thick = fade * (0.1 + hard * 0.2) * (1 - age * 0.8);
      const cloud = ctx.createRadialGradient(
        spot.x,
        spot.y,
        0,
        spot.x,
        spot.y,
        size,
      );
      cloud.addColorStop(0, `rgba(${SMOKE_TINT},${String(thick)})`);
      cloud.addColorStop(
        SMOKE_CORE,
        `rgba(${SMOKE_TINT},${String(thick * 0.55)})`,
      );
      cloud.addColorStop(1, `rgba(${SMOKE_TINT},0)`);
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y, size, size * DEPTH, 0, 0, TURN);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** How many puffs trail off one sliding tyre. */
const SMOKE_PUFFS = 7;

/** What tyre smoke is made of, as red, green and blue. */
const SMOKE_TINT = "216,213,206";

/** How far apart the puffs sit along the trail, in city pixels. */
const SMOKE_BACK = 7;

/** How far off the road the first one leaves the tyre. */
const SMOKE_FOOT = 2;

/** And how much higher each one after it climbs. */
const SMOKE_RISE = 2.4;

/** How big the first puff is, in screen pixels. */
const SMOKE_SEED = 4.5;

/** And how much each one after it has spread. */
const SMOKE_GROW = 3.4;

/** How far out a puff holds its body before it fades away, as a share. */
const SMOKE_CORE = 0.45;

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
  // **The pack is on while he is in the air and off once he is down.** He
  // wears it when he is flying with it, and the moment he lands - on the road
  // or on a roof - he is walking about again and it is not on his back any
  // more. Off the ground is the whole test: above whatever is under him, he is
  // flying; level with it, he is standing on it.
  //
  // It goes on **before** the figure, so what shows of it is what stands proud
  // of his shoulders rather than a box across his chest.
  if (player.jetpack && high > roofAt(state.cells, player.x, player.y)) {
    jetpack(ctx, view, up, player.angle, fade);
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
  // And the flames **after** him, because they come out under his feet and
  // anything drawn there before the figure is drawn behind his legs. A flame
  // over a boot reads as a flame; a flame hidden behind one reads as nothing.
  if (player.thrust) {
    thrust(ctx, view, up, player.angle, state.time, fade);
  }
}

/**
 * The jetpack on the player's back.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - where the figure is drawn, already lifted
 * @param angle - which way he is facing
 * @param fade - how solid to paint it
 * @remarks
 * Two steel bottles strapped between his shoulders, standing a little proud of
 * them - which from above is the whole of it: one sees the tops of the
 * cylinders and a strip of frame between them. On his **back**, so it sits
 * opposite the way he is facing and turns with him; a pack painted in the
 * middle of the figure is a rucksack seen from directly overhead, and there is
 * no angle in this view from which that reads as anything at all.
 *
 * It is drawn at shoulder height rather than on the ground so that it hangs on
 * him rather than beside him, and the figure is painted **after** it: what one
 * should see is a man with two bottles showing behind his shoulders, not a man
 * with a box in front of his chest.
 */
function jetpack(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  angle: number,
  fade: number,
): void {
  const back = angle + Math.PI;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = PACK_EDGE;
  for (const side of [-1, 1]) {
    const spot = project(
      view,
      at.x + Math.cos(back) * PACK_BACK - Math.sin(back) * side * PACK_APART,
      at.y + Math.sin(back) * PACK_BACK + Math.cos(back) * side * PACK_APART,
      PACK_HIGH,
    );
    const bottle = new Path2D();
    bottle.ellipse(
      spot.x,
      spot.y,
      PACK_FAT,
      PACK_FAT * DEPTH,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = PACK_STEEL;
    ctx.fill(bottle);
    ctx.stroke(bottle);
    const cap = new Path2D();
    cap.ellipse(
      spot.x,
      spot.y,
      PACK_FAT * 0.45,
      PACK_FAT * 0.45 * DEPTH,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = PACK_CAP;
    ctx.fill(cap);
  }
  ctx.restore();
}

/**
 * How far behind the middle of the figure the pack sits, in city pixels.
 *
 * @remarks
 * Far enough back that **both** bottles clear his shoulders. Closer in, the
 * one on the near side of him disappeared under the figure and what one saw
 * was a man with a single canister growing out of one shoulder.
 */
const PACK_BACK = 4.6;

/** And how far either side of his spine. */
const PACK_APART = 2.8;

/** How fat one bottle is. */
const PACK_FAT = 2.4;

/** How high up him it is strapped. */
const PACK_HIGH = 12;

/**
 * And how high the nozzles under it are.
 *
 * @remarks
 * Down by his heels, which is where the flame of one of these comes out: the
 * bottles are on his shoulders and the pipes run down his back. Drawn at the
 * height of the bottles the flame came out of his ears.
 */
const PACK_FOOT = 2;

/** What it is made of. */
const PACK_STEEL = "#94a3b8";

/** The cap on top of each bottle. */
const PACK_CAP = "#475569";

/** And the line round it. */
const PACK_EDGE = "#1e293b";

/**
 * The two flames out of the jetpack, under a player who is pushing on it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param at - where the figure is drawn, already lifted
 * @param angle - which way he is facing, for where the nozzles are
 * @param time - the clock, so the flame flickers
 * @param fade - how solid to paint it
 * @remarks
 * **Short, and pointing down.** They come out of the bottom of the bottles,
 * which are behind his shoulders, and they go straight at the road - so in
 * this view they hang below the pack and a little towards the camera, since
 * down the screen is what down is here. They used to be two soft plumes the
 * size of the man, in the middle of him, burning whenever he was off the
 * ground - including all the way down, which is a jetpack nobody switched off.
 */
function thrust(
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  angle: number,
  time: number,
  fade: number,
): void {
  const back = angle + Math.PI;
  const flicker = FLAME_LOW + Math.abs(Math.sin(time * FLAME_BEAT)) * FLAME_WAG;
  ctx.save();
  ctx.globalAlpha = fade;
  for (const side of [-1, 1]) {
    const spot = project(
      view,
      at.x + Math.cos(back) * PACK_BACK - Math.sin(back) * side * PACK_APART,
      at.y + Math.sin(back) * PACK_BACK + Math.cos(back) * side * PACK_APART,
      PACK_FOOT,
    );
    // The soft part first, then the bright core inside it: a flame is a
    // gradient with a white middle, and at this size the middle is two pixels.
    const glow = ctx.createRadialGradient(
      spot.x,
      spot.y + FLAME_LONG * flicker * 0.4,
      0,
      spot.x,
      spot.y + FLAME_LONG * flicker * 0.4,
      FLAME_LONG * flicker,
    );
    glow.addColorStop(0, "rgba(251,146,60,0.85)");
    glow.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(
      spot.x,
      spot.y + FLAME_LONG * flicker * 0.4,
      FLAME_WIDE,
      FLAME_LONG * flicker,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = FLAME_CORE;
    ctx.beginPath();
    ctx.ellipse(
      spot.x,
      spot.y + FLAME_LONG * flicker * 0.3,
      FLAME_WIDE * 0.4,
      FLAME_LONG * flicker * 0.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** How long a flame is at its shortest, as a share of its full length. */
const FLAME_LOW = 0.7;

/** And how much more it reaches at the top of the flicker. */
const FLAME_WAG = 0.5;

/** How fast it flickers, in radians a second. */
const FLAME_BEAT = 22;

/**
 * How far it reaches down the screen, in pixels.
 *
 * @remarks
 * A jet, not a bonfire. Two thirds of the length of the man above it is a
 * rocket taking off; this is about a third, which is what one of these puts
 * out to hold somebody up.
 */
const FLAME_LONG = 3.8;

/** And how wide it is. */
const FLAME_WIDE = 1.8;

/** The white middle of it. */
const FLAME_CORE = "#fef3c7";

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
  // **Nobody who is after you is on your map.** A patrol standing at a kerb is
  // worth marking - it is a car one might want - but the moment it is hunting,
  // a live blue dot creeping up the street behind one turns a chase into a
  // board game: one drives by the corner of the screen and never looks up.
  // Being followed should be something one notices in the mirror.
  const hunted = state.player.stars > 0;
  for (const car of state.cars) {
    if (car.kind === "police" && !(hunted && car.crew > 0)) {
      dot(car, "#2563eb", 2.5);
    }
  }
  for (const cop of state.cops) {
    // The men on the military base are not chasing anybody; they are standing
    // where they always stand, and that is worth knowing before one flies in.
    if (!(hunted && (cop.guards ?? null) === null)) {
      dot(cop, "#60a5fa", 2);
    }
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
