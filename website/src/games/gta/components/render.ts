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
import { cellUnder, doorsOf } from "@/games/gta/engine/city";
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
  GARAGE_OPEN,
  HELI_FALL,
  HELI_HEIGHT,
  GARAGE_SHUT,
  MAX_STARS,
  STAR_FLASH,
  PLAYER_HEALTH,
  STRIDE,
  TILE,
  type Bullet,
  type Car,
  type Cell,
  type Animal,
  type Cop,
  type GameState,
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
import { buildingAt, type Building } from "@/games/gta/engine/buildings";
import { VEHICLES } from "@/games/gta/engine/vehicles";
import {
  VEHICLE_MARGIN,
  tiersOf,
  turretSprite,
  TURRET_SIZE,
  vehicleSprite,
  vehicleWall,
  type VehicleFace,
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
};

/** The paint jobs cars come in. */
const CAR_PAINT: readonly string[] = [
  "#dc2626",
  "#2563eb",
  "#facc15",
  "#16a34a",
  "#f97316",
  "#a855f7",
  "#e5e7eb",
  "#0f172a",
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

/** How wide the dashes down the middle of a street are. */
const LANE_DASH = 10;

/** How big the map in the corner is, in pixels. */
const MAP_SIZE = 170;

/** What the city looks like on that map: light streets on dark blocks. */
const MAP_GROUND: Readonly<Record<Cell, string>> = {
  road: "#d4d4d8",
  // Pavement is drawn as part of the block: two pixels wide it would only
  // fray the edge of every block and turn the map into a mesh.
  walk: "#3f3f46",
  building: "#3f3f46",
  park: "#4d7c0f",
  water: "#1e3a8a",
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
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  zoom: number = ZOOM,
): void {
  // The city is drawn through the zoom, the corners of the screen are not: a
  // map and a row of numbers that grew with the lens would eat the picture.
  const view = cameraFor(state.player, width, height, zoom);
  const seen = seenArea(view);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-view.width / 2, -view.height / 2);
  drawGround(ctx, state, view, seen);
  drawMarkers(ctx, state, view);
  drawPickups(ctx, state, view, seen);
  drawScene(ctx, state, view, seen);
  drawBlasts(ctx, state, view);
  ctx.restore();
  drawMinimap(ctx, state, height);
  drawStatus(ctx, state, width);
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
  drawLanes(ctx, view, fromCol, fromRow, toCol, toRow);
}

/** The dashes down the middle of every street. */
function drawLanes(
  ctx: CanvasRenderingContext2D,
  view: View,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
): void {
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.setLineDash([LANE_DASH, LANE_DASH]);
  ctx.beginPath();
  for (let col = fromCol; col <= toCol; col += 1) {
    if (col % BLOCK_TILES === 0) {
      const x = col * TILE + TILE / 2;
      line(
        ctx,
        project(view, x, fromRow * TILE),
        project(view, x, toRow * TILE),
      );
    }
  }
  for (let row = fromRow; row <= toRow; row += 1) {
    if (row % BLOCK_TILES === 0) {
      const y = row * TILE + TILE / 2;
      line(
        ctx,
        project(view, fromCol * TILE, y),
        project(view, toCol * TILE, y),
      );
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

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
  // Shut by default, up when the owner comes near - and down again while the
  // work is being done, which is the only sign that anything happened.
  const working =
    state.garageAt !== null && state.time < state.garageAt + GARAGE_SHUT;
  const open =
    !working &&
    Math.hypot(
      state.player.x - state.garage.x,
      state.player.y - state.garage.y,
    ) < GARAGE_OPEN;
  const spot = project(view, state.garage.x, state.garage.y);
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
  garageDoor(ctx, open);
  ctx.restore();
}

/**
 * The door itself, in the wall at the back of the apron.
 *
 * @param open - true while it is rolled up
 * @remarks
 * A roller door: a frame, and inside it either the slats or the dark of the
 * garage with the rolled-up door as a bar across the top. The frame stays
 * whatever it does, so that the place still reads as a garage from across the
 * street with the door shut.
 */
function garageDoor(ctx: CanvasRenderingContext2D, open: boolean): void {
  const top = -GARAGE_DEEP / 2 - GARAGE_DOOR;
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
    ctx.fillRect(-3, top + GARAGE_DOOR - 3.5, 6, 1.6);
  }
}

/** How thick the rolled-up door is above the opening. */
const GARAGE_ROLL = 3.5;

/** How wide the garage apron is, in pixels. */
const GARAGE_WIDE = 54;

/** How far it reaches out into the street. */
const GARAGE_DEEP = 34;

/** And how deep the door itself is. */
const GARAGE_DOOR = 12;

/** How many slats the shut door has. */
const GARAGE_SLATS = 4;

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
        paint: (fade) => drawPerson(ctx, person, view, fade),
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
        paint: (fade) => drawCop(ctx, cop, view, fade),
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
        paint: (fade) => drawCar(ctx, car, view, mine, state.time, fade),
      });
    }
  }
  if (state.player.car === null) {
    movers.push({
      depth: state.player.y,
      at: state.player,
      mine: true,
      paint: (fade) => drawWalker(ctx, state, view, fade),
    });
  }
  for (const shot of state.bullets) {
    movers.push({
      depth: shot.y,
      at: null,
      paint: () => drawShot(ctx, shot, view),
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
    const spot = project(view, heli.x, heli.y, HELI_HEIGHT * up);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.scale(1, DEPTH);
    // Coming down it slews round its own nose, which is what a machine with no
    // tail rotor left does.
    ctx.rotate(heli.angle + gone * FALL_SLEW);
    // The tail boom and fin.
    ctx.fillStyle = "#1e3a8a";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    const tail = new Path2D();
    tail.roundRect(-HELI_LONG / 2, -2.4, HELI_LONG * 0.6, 4.8, 2);
    ctx.fill(tail);
    ctx.stroke(tail);
    const fin = new Path2D();
    fin.roundRect(-HELI_LONG / 2, -7, 3.4, 10, 1.4);
    ctx.fill(fin);
    ctx.stroke(fin);
    // The cabin, with the windscreen at the nose.
    const body = new Path2D();
    body.ellipse(4, 0, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill(body);
    ctx.stroke(body);
    const glass = new Path2D();
    glass.ellipse(10, 0, 5.4, 5.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill(glass);
    ctx.stroke(glass);
    // The skids, seen from straight above as two lines under it.
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(-4, side * 10);
      ctx.lineTo(12, side * 10);
    }
    ctx.stroke();
    // And the rotor, turning.
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let blade = 0; blade < ROTOR_BLADES; blade += 1) {
      const turn = heli.spin + (blade * Math.PI * 2) / ROTOR_BLADES;
      ctx.moveTo(4 - Math.cos(turn) * ROTOR_SPAN, -Math.sin(turn) * ROTOR_SPAN);
      ctx.lineTo(4 + Math.cos(turn) * ROTOR_SPAN, Math.sin(turn) * ROTOR_SPAN);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Burning: smoke off the tail and flame at the engine, growing as it goes.
    if (heli.fallAt !== null) {
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
    }
    ctx.restore();
  }
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
      depth: state.garage.y,
      at: state.garage,
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
      // The houses of a block sit inside its ring of pavement: cells two to
      // four of the six a block is wide.
      const left = (blockX * BLOCK_TILES + 2) * TILE;
      const top = (blockY * BLOCK_TILES + 2) * TILE;
      const right = left + 3 * TILE;
      const bottom = top + 3 * TILE;
      const middle = cellUnder(
        state.cells,
        (left + right) / 2,
        (top + bottom) / 2,
      );
      if (middle === "building") {
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
};

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
  driven: boolean,
  now: number,
  fade: number,
): void {
  const shape = VEHICLES[car.body];
  const police = car.kind === "police";
  const paint = police ? "#0f172a" : CAR_PAINT[car.colour % CAR_PAINT.length];
  const long = shape.length;
  const wide = shape.width;
  const tiers = tiersOf(car.body);
  const soot = car.health <= 0 ? SOOT : 0;
  const sheet = vehicleSprite(car.body, paint, police);
  shadow(ctx, view, car, long / 2, wide / 2, car.angle, fade);

  // The body: wheels, doors and bumpers on the walls, with the bonnet and the
  // boot laid flat on top of them.
  panels(
    ctx,
    view,
    boxCorners(car, car.angle, long / 2, wide / 2),
    { base: 0, top: tiers.belt, fade, soot },
    (face) => vehicleWall(car.body, paint, police, face, false),
  );
  stampTop(ctx, view, car, tiers.belt, { sheet, cabin: null, fade, soot });

  // And the cabin standing on it, which is what makes it a car and not a box.
  // The tank is the exception: its upper storey turns on its own, so it is a
  // picture laid on top rather than a second box.
  if (car.body === "tank") {
    drawTurret(ctx, view, car, tiers.tall, fade, soot);
  } else {
    const middle = (tiers.cabinBack + tiers.cabinFront) / 2;
    const hub = {
      x: car.x + Math.cos(car.angle) * middle,
      y: car.y + Math.sin(car.angle) * middle,
    };
    panels(
      ctx,
      view,
      boxCorners(
        hub,
        car.angle,
        (tiers.cabinFront - tiers.cabinBack) / 2,
        tiers.cabinWide / 2,
      ),
      { base: tiers.belt, top: tiers.tall, fade, soot },
      (face) => vehicleWall(car.body, paint, police, face, true),
    );
    stampTop(ctx, view, car, tiers.tall, { sheet, cabin: tiers, fade, soot });
  }

  if (driven) {
    // The green frame around the thing you are in, so it is never a guess.
    const roof = project(view, car.x, car.y, tiers.tall);
    ctx.save();
    ctx.translate(roof.x, roof.y);
    ctx.scale(1, DEPTH);
    ctx.rotate(car.angle);
    ctx.globalAlpha = fade;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.strokeRect(-long / 2 - 4, -wide / 2 - 4, long + 8, wide + 8);
    ctx.restore();
  }
  drawDamage(ctx, view, car, now, fade);
}

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

/** How dark a burnt-out wreck is painted over. */
const SOOT = 0.55;

/** Which wall each edge of a box is, in {@link boxCorners} order. */
const FACES: readonly VehicleFace[] = ["flank", "nose", "flank", "tail"];

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
  storey: Storey,
  sheetFor: (face: VehicleFace) => HTMLCanvasElement | null,
): void {
  for (let at = 0; at < corners.length; at += 1) {
    const from = corners[at];
    const to = corners[(at + 1) % corners.length];
    if (to.x >= from.x) {
      continue;
    }
    const footFrom = project(view, from.x, from.y);
    const footTo = project(view, to.x, to.y);
    const quad = new Path2D();
    quad.moveTo(footFrom.x, footFrom.y - storey.base);
    quad.lineTo(footTo.x, footTo.y - storey.base);
    quad.lineTo(footTo.x, footTo.y - storey.top);
    quad.lineTo(footFrom.x, footFrom.y - storey.top);
    quad.closePath();

    const sheet = sheetFor(FACES[at]);
    ctx.save();
    ctx.globalAlpha = storey.fade;
    if (sheet === null) {
      ctx.fillStyle = "#334155";
      ctx.fill(quad);
    } else {
      ctx.transform(
        (footTo.x - footFrom.x) / sheet.width,
        (footTo.y - footFrom.y) / sheet.width,
        0,
        (storey.top - storey.base) / sheet.height,
        footFrom.x,
        footFrom.y - storey.top,
      );
      if (at === BACKWARDS) {
        // That edge runs nose to tail, so the picture goes on the other way
        // round - otherwise the bonnet would be at the back of one flank.
        ctx.translate(sheet.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(sheet, 0, 0);
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

/** The one edge of the box whose picture has to be turned round. */
const BACKWARDS = 2;

/** What a picture laid flat on a vehicle needs to know. */
type Lid = {
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
    if (cabin !== null) {
      const only = new Path2D();
      only.rect(
        cabin.cabinBack,
        -cabin.cabinWide / 2,
        cabin.cabinFront - cabin.cabinBack,
        cabin.cabinWide,
      );
      ctx.clip(only);
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
  };
  return styles[kind] ?? "plain";
}

/** Somebody on the pavement: walking, sitting at a wall, or flat out. */
function drawPerson(
  ctx: CanvasRenderingContext2D,
  person: Person,
  view: View,
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

/** A policeman on foot: dark blue, and always facing the player. */
function drawCop(
  ctx: CanvasRenderingContext2D,
  cop: Cop,
  view: View,
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
  shadow(ctx, view, player, FOOTPRINT, FOOTPRINT * 0.8, 0, fade * 0.55);
  drawFigure(
    ctx,
    view,
    player,
    {
      // A lighter green than the gang's, so that at a glance the bright one in
      // the middle of the screen is you and the darker ones are your people.
      shirt: "#4ade80",
      trousers: "#1e293b",
      skin: "#f2c9a0",
      hair: "#1c1917",
      // The body turns with the mouse, the legs go where the keys send them.
      // That is what makes walking backwards away from a patrol car look like
      // walking backwards rather than like a turn.
      facing: player.angle,
      heading: player.heading,
      walked: player.walked,
      arms: poseOf(state, player.weapon),
      // Fists alternate, blow by blow; anything carried stays in the hand that
      // carries it.
      hand:
        player.weapon === "fist" && player.punches % 2 === 1 ? "left" : "right",
      style: "player",
      holds: player.weapon,
    },
    fade,
  );
}

/** How a figure is dressed, which way it is pointed, and where in its step. */
type Figure = {
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
 */
function drawFigure(
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
  const bob = down ? 0 : Math.abs(Math.cos(phase)) * 1.7;
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
    at,
    look.facing,
    SHOULDER * low + bob,
    BODY_SIZE,
  );
  if (look.holds !== undefined) {
    inHand(ctx, view, at, look, frame, SHOULDER * low + bob);
  }
  stamp(
    ctx,
    headSprite(worn),
    view,
    at,
    look.facing,
    PERSON_HEIGHT * low + bob,
    HEAD_SIZE,
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
function boxCorners(
  at: Vec,
  angle: number,
  halfLong: number,
  halfWide: number,
): readonly Vec[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corner = (long: number, wide: number): Vec => ({
    x: at.x + long * cos - wide * sin,
    y: at.y + long * sin + wide * cos,
  });
  return [
    corner(-halfLong, -halfWide),
    corner(halfLong, -halfWide),
    corner(halfLong, halfWide),
    corner(-halfLong, halfWide),
  ];
}

/** The dark patch a thing throws on the road under it. */
function shadow(
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
  ctx.globalAlpha = 0.28 * fade;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(0, 0, halfLong, halfWide, 0, 0, Math.PI * 2);
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
  home(ctx, at(state.garage));
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
): void {
  const player = state.player;
  const gun = WEAPONS[player.weapon];
  const left = width - PANEL_WIDTH - 12;
  const top = 12;
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
  cityImage = sheet;
  return sheet;
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How many stars are shown as filled, for the HUD. */
export function starsShown(state: GameState): readonly boolean[] {
  return Array.from(
    { length: MAX_STARS },
    (unused, at) => at < state.player.stars,
  );
}
