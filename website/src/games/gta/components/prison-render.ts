/**
 * Drawing the inside of the jail: the yard, the wing, the men in it.
 *
 * @module
 * @remarks
 * The same bargain as everywhere else - this reads the state and paints, and
 * changes nothing - and the same picture as the bank: seen **straight down**,
 * {@link FLAT}, no tilt, every square as square on screen as it is on the
 * plan, and no line drawn round a square just because it is a square. Only the
 * people keep their tilt, because a figure flattened is a coat on the floor.
 *
 * What one is looking at is a prison yard as one would see it from outside the
 * wall: the court painted on the asphalt with the benches round it, the block
 * along the south side, the tower on the wall. Everything a prisoner is
 * supposed to learn by looking - where a warder's eyes reach, which bench has
 * the loose screw, how long the walk from the yard to his own cell takes when
 * the tannoy goes - has to be *visible*, and that is the whole job of this
 * module.
 */
import {
  FLAT,
  cameraFor,
  project,
  seenArea,
  type View,
} from "@/games/gta/components/projection";
import {
  BENCH_WOOD,
  CONVICT_HAIR,
  CONVICT_SHIRT,
  CONVICT_SKIN,
  CONVICT_TROUSERS,
  BOARD_BACK,
  BOARD_EDGE,
  BOARD_INK,
  SHED_NAME,
  COURT_BOARD,
  COURT_DEEP,
  COURT_KEY,
  COURT_PAINT,
  COURT_RING,
  HOOP_EDGE,
  HOOP_STEEL,
  WORN_EARTH,
  WORN_GONE,
  WORN_SOLID,
  WORN_WIDE,
  YARD_GRASS,
  drawFigure,
  drawStatus,
  shadow,
  type Figure,
} from "@/games/gta/components/render";
import {
  PLAN_HIGH,
  PLAN_WIDE,
  escortOf,
  gangOf,
  hunting,
  markOf,
  past,
  searching,
  slabAt,
  taskLine,
  untilCount,
} from "@/games/gta/engine/prison";
import {
  CATCHES,
  COUNT_WARN,
  SLAB,
  WATCH_RANGE,
  WATCH_WIDE,
  type GameState,
  type Inmate,
  type PrisonState,
  type Slab,
  type Vec,
  type Warder,
} from "@/games/gta/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how wide a bench slat is, where the free-throw line
   is painted, how far a pair of bars stand apart. They are shapes and colours,
   not arithmetic. */

/** What each square of the plan is painted in. */
const GROUND: Readonly<Record<Slab, string>> = {
  wall: "#57534e",
  floor: "#a8a29e",
  cell: "#9ca3af",
  bars: "#9ca3af",
  gate: "#9ca3af",
  // **The yard is grass, and the court is worn into it** - the same ground the
  // city paints when one drives past the place, down to the colour: see
  // yardFloor in ./render. A prisoner and a passer-by are looking at one
  // building, and it would be a strange one that changed its surface
  // depending on which side of the wall you stood on.
  yard: YARD_GRASS,
  court: YARD_GRASS,
  bench: YARD_GRASS,
  works: "#6b7280",
  // Inside the workshop: a concrete floor with oil on it.
  worksFloor: "#7b7975",
  table: "#7b7975",
  door: "#8a8580",
  locked: "#6b6560",
  // The sick bay: lino, and it is the one room in here that is kept clean.
  ward: "#cfd8d6",
  bed: "#cfd8d6",
  myGate: "#9ca3af",
  hardWall: "#57534e",
  loo: "#9ca3af",
  myLoo: "#9ca3af",
  bunk: "#9ca3af",
  stones: "#78716c",
  // Under the yard: earth, and the floor of it walked smooth.
  tunnel: "#3b332c",
  shaft: "#4a4038",
  window: "#52525b",
  cable: "#3f3f46",
  tower: "#57534e",
  // Outside the wall is the street the prison stands on, not a meadow.
  free: "#3f3f46",
};

/** What lies past the edge of the plan. */
const BEYOND = "#3f3f46";

/** The line round a thing standing in a room, as opposed to the room itself. */
const OUTLINE = "rgba(0,0,0,0.35)";

/** How far a piece of furniture is drawn inside its square. */
const INSET = 4;

/** How faint a warder's look is painted on the ground. */
const CONE_FADE = 0.18;

/** How wide a person's shadow is. */
const FOOTPRINT = 4.6;

/** The prisoners: everybody in here wears the same. */
const SUIT: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  // **The same kit the street sees.** Drive past this place and the men in
  // the yard are in black and white stripes; walk about inside it and they
  // have to be the same men. The colours come from ./render, where the city
  // dresses them, rather than from a second opinion here.
  shirt: CONVICT_SHIRT,
  trousers: CONVICT_TROUSERS,
  skin: CONVICT_SKIN,
  hair: CONVICT_HAIR,
};

/** And the men with the keys. */
const UNIFORM: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#1e3a8a",
  trousers: "#111827",
  skin: "#f2c9a0",
  hair: "#3f3f46",
};

/**
 * The gang in the yard.
 *
 * @remarks
 * **Everybody in here wears the same suit**, because a prison issues one
 * suit - so what tells these three apart is not the cloth but the men: darker
 * hair, darker faces, and the fact that there are three of them standing
 * together with their backs to a wall.
 */
const GANG_SUIT: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: CONVICT_SHIRT,
  trousers: CONVICT_TROUSERS,
  skin: "#8d5524",
  hair: "#0f172a",
};

/** The governor, who is the only man in here in a suit rather than a kit. */
const GOVERNOR: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#1f2937",
  trousers: "#111827",
  skin: "#f2c9a0",
  hair: "#e5e7eb",
};

/** And the man one hires - same stripes, grey head, and a ring round him. */
const MUSCLE_SUIT: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: CONVICT_SHIRT,
  trousers: CONVICT_TROUSERS,
  skin: "#f2c9a0",
  hair: "#d6d3d1",
};

/**
 * Paints one frame of the escape.
 *
 * @param ctx - what to paint on
 * @param state - the game, with an escape under way
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @param zoom - how close the camera stands
 */
export function drawPrison(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  zoom: number,
): void {
  const prison = state.prison;
  if (prison !== null) {
    const view: View = {
      ...cameraFor(prison.hero, width, height, zoom),
      squash: FLAT,
    };
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-view.width / 2, -view.height / 2);
    drawFloor(ctx, view, prison);
    drawPaths(ctx, view);
    drawCourt(ctx, view);
    drawIndoors(ctx, view, prison);
    drawWorks(ctx, view, prison, prison.time);
    drawWard(ctx, view, prison);
    drawCones(ctx, view, prison);
    drawMark(ctx, view, prison);
    drawRows(ctx, view, prison);
    drawCable(ctx, view, prison);
    ctx.restore();
    drawTask(ctx, prison, width, height);
    drawStatus(ctx, state, width, false);
  }
}

/* --------------------------------------------------------------- the floor */

/**
 * Every square in sight, painted flat.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @remarks
 * Flat colour and nothing else - no line round each square, because a wall
 * drawn that way is a row of blocks and the whole place reads as the graph
 * paper it was laid out on. What tells one floor from another is the colour
 * and the grain over it: asphalt in the yard, a painted court in the middle of
 * it, screed in the block, earth in the crawl space.
 */
function drawFloor(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const seen = seenArea(view);
  const fromCol = Math.floor(seen.left / SLAB);
  const fromRow = Math.floor(seen.top / SLAB);
  const toCol = Math.ceil(seen.right / SLAB);
  const toRow = Math.ceil(seen.bottom / SLAB);
  ctx.fillStyle = BEYOND;
  ctx.fillRect(0, 0, view.width, view.height);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const inside = col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH;
      const kind = slabAt(col, row);
      const at = project(view, col * SLAB, row * SLAB);
      ctx.fillStyle = inside ? GROUND[kind] : BEYOND;
      ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
    }
  }
  // The joints of the block floor: long lines down the corridor, which is the
  // one thing in here that is worth looking along.
  grainOf(ctx, view, seen, ["floor", "cell", "loo", "myLoo", "bunk", "bars"]);
  if (past(prison.stage, "dig2")) {
    // Once the wall is open the crawl space is a place rather than a rumour,
    // so it gets its own grain: the courses of brick along the foot of it.
    grainOf(ctx, view, seen, ["tunnel", "window"]);
  }
}

/**
 * The joints of one sort of floor, struck across the whole of it in one go.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param seen - the stretch of jail the picture covers
 * @param kinds - which squares this floor is laid on
 */
function grainOf(
  ctx: CanvasRenderingContext2D,
  view: View,
  seen: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  },
  kinds: readonly Slab[],
): void {
  const patch = new Path2D();
  let any = false;
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB));
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB));
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB));
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB));
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      if (kinds.includes(slabAt(col, row))) {
        const at = project(view, col * SLAB, row * SLAB);
        patch.rect(at.x, at.y, SLAB + 1, SLAB + 1);
        any = true;
      }
    }
  }
  if (!any) {
    return;
  }
  ctx.save();
  ctx.clip(patch);
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = SLAB * 1.5;
  const first = Math.floor(seen.top / step) * step;
  for (let line = first; line <= seen.bottom; line += step) {
    const at = project(view, seen.left, line);
    const to = project(view, seen.right, line);
    ctx.moveTo(at.x, at.y + 0.5);
    ctx.lineTo(to.x, to.y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * The tracks worn across the grass, from the block door to the workshop.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @remarks
 * **Men walk the same line twice a day for years.** The yard between the
 * block and the works is grass everywhere one has no reason to be, and bare
 * earth along the one route everybody takes: out of the door, up the west
 * side of the court, along the front of the shed. It is the cheapest detail
 * in the place and the one that makes the yard look used rather than mown.
 */
function drawPaths(ctx: CanvasRenderingContext2D, view: View): void {
  const runs: readonly (readonly Vec[])[] = [
    // Block door, up the west side of the court, along to the workshop.
    [
      { x: 10.5, y: 15.5 },
      { x: 10.5, y: 7.6 },
      { x: 4.5, y: 7.6 },
      { x: 4.5, y: 6.5 },
    ],
    // And the few steps off it to the corner of the court.
    [
      { x: 10.5, y: 11 },
      { x: 11.4, y: 11 },
    ],
  ];
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Twice over: the grass thinning out either side of it, and the bare earth
  // down the middle where the boots actually go.
  for (const pass of [
    { paint: "rgba(126,110,70,0.45)", wide: SLAB * 0.78 },
    { paint: "rgba(150,124,84,0.75)", wide: SLAB * 0.42 },
  ]) {
    ctx.strokeStyle = pass.paint;
    ctx.lineWidth = pass.wide;
    for (const run of runs) {
      ctx.beginPath();
      run.forEach((step, turn) => {
        const at = project(view, step.x * SLAB, step.y * SLAB);
        if (turn === 0) {
          ctx.moveTo(at.x, at.y);
        } else {
          ctx.lineTo(at.x, at.y);
        }
      });
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * The basketball court worn into the yard.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @remarks
 * **The same court the city paints from outside the wall** - see `yardFloor`
 * in ./render, whose colours and proportions this borrows rather than invents:
 * grass, the ground walked bare under each basket and fading back into the
 * green, white lines over the top of both, and a basket standing off each
 * baseline. A yard that looked one way from the street and another from inside
 * would be two different prisons.
 *
 * And it **stands up the yard**, basket to basket, because that is the way one
 * plays and the way the exterior has it. Drawn wide and shallow it reads as a
 * tennis court with the net missing.
 *
 * All of it in one picture over the squares it covers, not square by square: a
 * centre circle assembled out of quarter-squares is not a circle.
 */
function drawCourt(ctx: CanvasRenderingContext2D, view: View): void {
  const box = courtBox();
  if (box === null) {
    return;
  }
  const from = project(view, box.left, box.top);
  const to = project(view, box.right, box.bottom);
  const across = to.x - from.x;
  const down = to.y - from.y;
  ctx.save();

  // The ground under each basket, walked bare and fading back into the grass.
  for (const end of [0, 1]) {
    const line = from.y + down * end;
    const into = end === 0 ? 1 : -1;
    const spot = { x: from.x + across / 2, y: line + into * down * 0.1 };
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
    ctx.arc(spot.x, spot.y, reach, 0, Math.PI * 2);
    ctx.fill();
  }

  // The lines, painted straight onto whatever is under them.
  ctx.strokeStyle = COURT_PAINT;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(from.x, from.y, across, down);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y + down / 2);
  ctx.lineTo(from.x + across, from.y + down / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    from.x + across / 2,
    from.y + down / 2,
    across * COURT_RING,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  for (const end of [0, 1]) {
    const line = from.y + down * end;
    const into = end === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.rect(
      from.x + across * (0.5 - COURT_KEY / 2),
      line,
      across * COURT_KEY,
      down * COURT_DEEP * into,
    );
    ctx.stroke();
    basket(ctx, from.x + across / 2, line, across * 0.3, into);
    ctx.strokeStyle = COURT_PAINT;
  }
  ctx.restore();
}

/**
 * One basket: the post behind the line, the board on it, the ring.
 *
 * @param ctx - what to paint on
 * @param x - the middle of the baseline, on screen
 * @param y - and the line itself
 * @param wide - how wide the board is
 * @param into - which way the court lies from here, 1 or -1
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
  // The post behind the line and the arm out to the board.
  ctx.fillStyle = HOOP_STEEL;
  ctx.fillRect(x - 2, y + back * 7 - 2, 4, 4);
  ctx.fillRect(x - 1, y + Math.min(0, back * 7), 2, 7);
  // The board, with the target square on it.
  ctx.fillStyle = HOOP_EDGE;
  ctx.fillRect(x - wide / 2, y - 1.5, wide, 3);
  ctx.fillStyle = COURT_BOARD;
  ctx.fillRect(x - wide / 2 + 1, y - 1, wide - 2, 2);
  // And the ring, standing into the court.
  ctx.strokeStyle = "#e2603c";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y + into * 3.4, 3.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** The stretch of plan the court is painted on, in jail pixels. */
function courtBox(): Box | null {
  return boxOf("court");
}

/** A rectangle of the plan, in jail pixels. */
type Box = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

/**
 * Everything of one kind or another, as the one rectangle it covers.
 *
 * @param kinds - which squares count
 * @returns the rectangle round them, or null where there are none
 * @remarks
 * What a court and a works have in common: both are **one thing** laid over a
 * handful of squares, and both are drawn as one picture rather than square by
 * square. A roof painted per square has a seam every forty pixels; a centre
 * circle assembled out of quarter-squares is not a circle.
 */
function boxOf(...kinds: readonly Slab[]): Box | null {
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (let row = 0; row < PLAN_HIGH; row += 1) {
    for (let col = 0; col < PLAN_WIDE; col += 1) {
      if (kinds.includes(slabAt(col, row))) {
        left = Math.min(left, col * SLAB);
        top = Math.min(top, row * SLAB);
        right = Math.max(right, (col + 1) * SLAB);
        bottom = Math.max(bottom, (row + 1) * SLAB);
      }
    }
  }
  return left === Number.POSITIVE_INFINITY
    ? null
    : { left, top, right, bottom };
}

/**
 * The workshop in the corner of the yard.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands, for where the player is standing
 * @param now - the clock, for the smoke
 * @remarks
 * **The same shed the city puts in this yard**, seen from above instead of
 * from the street: a flat roof with its ridge lights down the middle, a board
 * screwed to the wall facing the yard with the name on it, and a chimney at
 * the far corner with smoke going up out of it. The smoke is what says the
 * place is working rather than standing empty - and a works where the men of
 * this wing spend their day is the reason there is anybody in the yard at all.
 *
 * **The roof comes off when one walks in.** From the yard the place has to be
 * the building one sees from the street; from inside it has to be a room one
 * can dig a hole in. Both, and the switch between them is which side of the
 * door the player is standing.
 */
function drawWorks(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  now: number,
): void {
  const box = SHOP_ROOM;
  if (box === null || inside(box, prison.hero)) {
    return;
  }
  const from = project(view, box.left, box.top);
  const to = project(view, box.right, box.bottom);
  const wide = to.x - from.x;
  const deep = to.y - from.y;
  ctx.save();
  // The roof, and the darker band round the edge of it: from above a building
  // is a lid, and what tells one that it has walls is the shadow it casts on
  // its own parapet.
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(from.x, from.y, wide, deep);
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 3;
  ctx.strokeRect(from.x + 1.5, from.y + 1.5, wide - 3, deep - 3);
  // Ridge lights down the middle of it.
  ctx.fillStyle = "#9ca3af";
  for (const run of [0.3, 0.55, 0.8]) {
    ctx.fillRect(from.x + wide * 0.18, from.y + deep * run, wide * 0.64, 5);
  }
  // The chimney at the far corner, and the smoke off it.
  const stack = { x: from.x + wide * 0.86, y: from.y + deep * 0.14 };
  ctx.fillStyle = "#44403c";
  ctx.beginPath();
  ctx.arc(stack.x, stack.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(226,232,240,0.5)";
  for (const puff of [0, 1, 2]) {
    const age = (((now * 0.35 + puff / 3) % 1) + 1) % 1;
    ctx.globalAlpha = 0.45 * (1 - age);
    ctx.beginPath();
    ctx.arc(stack.x + age * 9, stack.y - age * 6, 3 + age * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The board on the yard side, with the name across it.
  const board = {
    x: from.x + wide * 0.12,
    y: to.y - 13,
    w: wide * 0.76,
    h: 11,
  };
  ctx.fillStyle = BOARD_BACK;
  ctx.fillRect(board.x, board.y, board.w, board.h);
  ctx.strokeStyle = BOARD_EDGE;
  ctx.lineWidth = 1;
  ctx.strokeRect(board.x, board.y, board.w, board.h);
  ctx.fillStyle = BOARD_INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 8;
  ctx.font = `bold ${String(size)}px system-ui, sans-serif`;
  while (ctx.measureText(SHED_NAME).width > board.w - 4 && size > 5) {
    size -= 1;
    ctx.font = `bold ${String(size)}px system-ui, sans-serif`;
  }
  ctx.fillText(SHED_NAME, board.x + board.w / 2, board.y + board.h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

/** The workshop, walls and all - worked out once, because the plan is fixed. */
const SHOP_ROOM = roomOf("worksFloor", "table");

/** And the sick bay. */
const WARD_ROOM = roomOf("ward", "bed");

/**
 * Whether one is standing in the room a piece of furniture is in.
 *
 * @param prison - the jail as it stands
 * @param room - the room in question, or null if the plan has none
 * @returns true when that room's fittings are to be painted
 * @remarks
 * **A roof hides what is under it.** The squares are painted after the roofs,
 * so a bed or a bench drawn regardless would stand on top of the slates of
 * the very building it is inside. Outside, the room is a roof; inside, it is
 * furniture, and nothing is both.
 */
function indoors(prison: PrisonState, room: Box | null): boolean {
  return room !== null && inside(room, prison.hero);
}

/**
 * Whether somebody is in a room the player is not in.
 *
 * @param prison - the jail as it stands
 * @param who - the man in question
 * @returns true when he is under a roof one cannot see under
 * @remarks
 * The same rule as the furniture, for the same reason: a warder doing his
 * round inside the workshop, drawn while one is standing in the yard, is a
 * warder walking about on the roof of it.
 */
function outOfSight(prison: PrisonState, who: Vec): boolean {
  return [SHOP_ROOM, WARD_ROOM].some(
    (room) => room !== null && inside(room, who) && !inside(room, prison.hero),
  );
}

/**
 * The rectangle a room covers, walls and all.
 *
 * @param kinds - the squares of the floor inside it
 * @returns the room with its walls, or null where there is no such room
 * @remarks
 * A room is its floor grown by the wall round it - to the sides and the
 * bottom, but not upwards: the north wall of this jail carries the tower and
 * the sick bay window, and a roof laid over those would hide the two things
 * out there worth looking at.
 */
function roomOf(...kinds: readonly Slab[]): Box | null {
  const box = boxOf(...kinds);
  return box === null
    ? null
    : {
        left: box.left - SLAB,
        top: box.top,
        right: box.right + SLAB,
        bottom: box.bottom + SLAB,
      };
}

/** Whether somebody is standing in that rectangle. */
function inside(box: Box, who: Vec): boolean {
  return (
    who.x >= box.left &&
    who.x <= box.right &&
    who.y >= box.top &&
    who.y <= box.bottom
  );
}

/**
 * The sick bay roof, which comes off the same way the workshop's does.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @remarks
 * Slates, a rooflight along the ridge and a cross painted on it, because from
 * the yard this has to be a building and not a hole in the wing. One comes up
 * through its floor out of the tunnel, and at that moment the roof is gone and
 * it is four beds and a window.
 */
function drawWard(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const box = WARD_ROOM;
  if (box === null || inside(box, prison.hero)) {
    return;
  }
  const from = project(view, box.left, box.top);
  const to = project(view, box.right, box.bottom);
  const wide = to.x - from.x;
  const deep = to.y - from.y;
  ctx.save();
  ctx.fillStyle = "#64748b";
  ctx.fillRect(from.x, from.y, wide, deep);
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 3;
  ctx.strokeRect(from.x + 1.5, from.y + 1.5, wide - 3, deep - 3);
  // The rooflight down the middle.
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(
    from.x + wide * 0.44,
    from.y + deep * 0.16,
    wide * 0.12,
    deep * 0.68,
  );
  // And the cross, which is the one thing that says what is under it.
  ctx.fillStyle = "#dc2626";
  const arm = Math.min(wide, deep) * 0.1;
  const mid = { x: from.x + wide * 0.76, y: from.y + deep * 0.3 };
  ctx.fillRect(mid.x - arm, mid.y - arm / 3, arm * 2, (arm * 2) / 3);
  ctx.fillRect(mid.x - arm / 3, mid.y - arm, (arm * 2) / 3, arm * 2);
  ctx.restore();
}

/**
 * What stands about in the two rooms one can walk into.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @remarks
 * **A room with nothing in it is a floor.** The workshop is where the men of
 * this wing spend the day, so it has machines along the north wall, a rack of
 * tools and oil trodden into the concrete; the sick bay is the one clean room
 * in the place, so it has a cabinet, a trolley and a green line down the lino.
 * None of it is in the way - the two things one has to reach in here are the
 * table and the window, and furniture one has to walk round would only make
 * those harder to find.
 */
function drawIndoors(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  if (indoors(prison, SHOP_ROOM)) {
    drawShopKit(ctx, view);
  }
  if (indoors(prison, WARD_ROOM)) {
    drawWardKit(ctx, view);
  }
}

/** The machines in the workshop, along the wall the player never digs at. */
function drawShopKit(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.save();
  // Oil trodden into the floor, worst where the men stand.
  ctx.fillStyle = "rgba(24,24,27,0.16)";
  for (const spot of [
    { col: 3, row: 2.6 },
    { col: 5.4, row: 3.2 },
    { col: 6.2, row: 4.6 },
  ]) {
    const at = project(view, spot.col * SLAB, spot.row * SLAB);
    ctx.beginPath();
    ctx.ellipse(at.x, at.y, 13, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Three machines with their backs to the north wall: a lathe, a press and a
  // grinder. From above each is a bed with something turning on top of it.
  for (const shop of [
    { col: 2, wheel: "#9ca3af" },
    { col: 4, wheel: "#fbbf24" },
    { col: 6, wheel: "#9ca3af" },
  ]) {
    const at = project(view, shop.col * SLAB, 2 * SLAB);
    ctx.fillStyle = "#3f4650";
    ctx.fillRect(at.x + 3, at.y + 6, SLAB * 2 - 6, SLAB - 14);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x + 3, at.y + 6, SLAB * 2 - 6, SLAB - 14);
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(at.x + 8, at.y + 10, SLAB * 2 - 16, SLAB - 24);
    ctx.fillStyle = shop.wheel;
    ctx.beginPath();
    ctx.arc(at.x + SLAB * 1.5, at.y + SLAB / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
  // The rack of tools on the east wall, with the shadows of them on the board.
  const rack = project(view, 7 * SLAB, 2 * SLAB);
  ctx.fillStyle = "#8a6a45";
  ctx.fillRect(rack.x + SLAB - 12, rack.y + 4, 9, SLAB * 2 - 8);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(rack.x + SLAB - 12, rack.y + 4, 9, SLAB * 2 - 8);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let tool = 0; tool < 5; tool += 1) {
    const y = rack.y + 10 + tool * 13;
    ctx.moveTo(rack.x + SLAB - 10, y);
    ctx.lineTo(rack.x + SLAB - 5, y + 6);
  }
  ctx.stroke();
  ctx.restore();
}

/** And the fittings of the sick bay. */
function drawWardKit(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.save();
  // The green line down the middle of the lino, which every such room has.
  const line = project(view, 17 * SLAB, 2.5 * SLAB);
  ctx.strokeStyle = "rgba(22,163,74,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(line.x, line.y);
  ctx.lineTo(line.x + SLAB * 5, line.y);
  ctx.stroke();
  // The cabinet against the west wall, with its glass doors.
  const press = project(view, 17 * SLAB, 4 * SLAB);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(press.x + 4, press.y + 6, SLAB - 12, SLAB - 12);
  ctx.fillStyle = "#93c5fd";
  ctx.fillRect(press.x + 7, press.y + 9, SLAB - 18, SLAB - 20);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(press.x + 4, press.y + 6, SLAB - 12, SLAB - 12);
  // And a trolley in the middle, with a tray on it.
  const cart = project(view, 19 * SLAB, 4.5 * SLAB);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(cart.x + 6, cart.y - 8, SLAB - 16, 17);
  ctx.strokeStyle = OUTLINE;
  ctx.strokeRect(cart.x + 6, cart.y - 8, SLAB - 16, 17);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(cart.x + 10, cart.y - 4, SLAB - 24, 9);
  ctx.restore();
}

/* ------------------------------------------------------------ what stands */

/** The rows of the plan, north to south, with the people standing in them. */
function drawRows(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const seen = seenArea(view);
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB) - 1);
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB) + 1);
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB) - 1);
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB) + 1);
  const folk = everybody(prison);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      drawSquare(ctx, view, prison, col, row);
    }
    for (const one of folk) {
      if (Math.floor(one.at.y / SLAB) === row && !outOfSight(prison, one.at)) {
        paintPerson(ctx, view, prison, one);
      }
    }
  }
}

/** One person in the jail, and which sort. */
type PrisonFolk = {
  readonly at: Inmate;
  readonly kind:
    "hero" | "mate" | "idle" | "warder" | "gang" | "muscle" | "foe" | "boss";
};

/** Everybody in the place, in the order they stand in. */
function everybody(prison: PrisonState): readonly PrisonFolk[] {
  const helper = prison.helper;
  const foe = prison.foe;
  const escort = escortOf(prison);
  return [
    ...gangOf(prison).map((one) => ({ at: one, kind: "gang" as const })),
    ...prison.idle.map((one) => ({ at: one, kind: "idle" as const })),
    ...prison.mates.map((one) => ({ at: one, kind: "mate" as const })),
    ...(helper === null ? [] : [{ at: helper, kind: "muscle" as const }]),
    ...(foe === null ? [] : [{ at: foe, kind: "foe" as const }]),
    ...(escort === null
      ? []
      : [
          {
            at: escort.at,
            kind:
              escort.staff === "boss" ? ("boss" as const) : ("warder" as const),
          },
        ]),
    ...prison.warders.map((one: Warder) => ({
      at: one,
      kind: "warder" as const,
    })),
    { at: prison.hero, kind: "hero" as const },
  ];
}

/** One person: their shadow, and the figure over it. */
function paintPerson(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  who: PrisonFolk,
): void {
  const warder = who.kind === "warder";
  // **Everybody in the yard is in the same stripes**, which is what a prison
  // looks like: the gang are three dark heads standing together, the man one
  // hires is the grey one by the block, and the cellmate in the new cell is
  // another man in the same suit, which is the point of him. Who matters is
  // said by the ring (`markOf`), not by the cloth.
  const worn = warder
    ? UNIFORM
    : who.kind === "boss"
      ? GOVERNOR
      : who.kind === "gang"
        ? GANG_SUIT
        : who.kind === "muscle"
          ? MUSCLE_SUIT
          : SUIT;
  const look: Figure = {
    ...worn,
    facing: who.at.heading,
    heading: who.at.heading,
    walked: who.at.walked,
    // The little worlds keep no speed for anybody, so their figures get the
    // still pose: no lean, no sway.
    pace: 0,
    time: prison.time,
    arms: "swing",
    hand: "right",
    style: warder ? "cop" : "convict",
    holds: warder ? "baton" : undefined,
  };
  shadow(ctx, view, who.at, FOOTPRINT, FOOTPRINT * 0.8, 0, 0.55);
  drawFigure(ctx, view, who.at, look, 1);
}

/** Whatever stands on one square: a wall, a bench, a bunk, a set of bars. */
function drawSquare(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  const kind = slabAt(col, row);
  switch (kind) {
    case "wall":
      fill(ctx, view, col, row, "#57534e", 0);
      break;
    case "tower":
      drawTower(ctx, view, col, row);
      break;
    case "bench":
      drawBench(ctx, view, col, row);
      break;
    case "bars":
      drawBars(ctx, view, col, row);
      break;
    case "myGate":
      // One's own door, which the governor locks behind him.
      if (prison.stage === "moved") {
        drawBars(ctx, view, col, row);
      }
      break;
    case "table":
      if (indoors(prison, SHOP_ROOM)) {
        drawTable(ctx, view, prison, col, row);
      }
      break;
    case "hardWall":
      drawHardWall(ctx, view, prison, col, row);
      break;
    case "bed":
      if (indoors(prison, WARD_ROOM)) {
        drawBed(ctx, view, col, row);
      }
      break;
    case "locked":
      if (indoors(prison, WARD_ROOM)) {
        drawLocked(ctx, view, col, row);
      }
      break;
    case "bunk":
      drawBunk(ctx, view, col, row);
      break;
    case "loo":
      drawLoo(ctx, view, col, row, "fixed");
      break;
    case "myLoo":
      // One pan, one place: bolted to the wall until it comes off, then
      // either over the hole a square further on or standing loose beside it.
      drawLoo(
        ctx,
        view,
        col,
        row,
        !past(prison.stage, "loo")
          ? "fixed"
          : panOnHole(prison)
            ? "gone"
            : "loose",
      );
      break;
    case "stones":
      drawStones(ctx, view, prison, col, row);
      break;
    case "shaft":
      drawShaft(ctx, view, col, row);
      break;
    case "window":
      drawWindow(ctx, view, prison, col, row);
      break;
    default:
      break;
  }
}

/**
 * A bench beside the court: a slab with its slats and a shadow under it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - the square it stands on
 * @param row - and the row
 * @remarks
 * The same bench the city draws outside the wall, in the same wood, and turned
 * the same way: **along the touchline**, so whoever sits on it is looking at
 * the game rather than across it. There are six of them, three a side, with a
 * gap between each - a yard one cannot walk out of is a fence, not furniture.
 */
function drawBench(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(at.x + 12, at.y + 5, 20, SLAB - 8);
  // **A bench, not a pallet.** The seat is three slats along the touchline;
  // what says which way one sits on it is the back rail behind them and the
  // two iron ends the whole thing is bolted to.
  ctx.fillStyle = "#52525b";
  ctx.fillRect(at.x + 9, at.y + 2, 22, 3);
  ctx.fillRect(at.x + 9, at.y + SLAB - 5, 22, 3);
  ctx.fillStyle = BENCH_WOOD;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  for (const slat of [0, 1, 2]) {
    ctx.fillRect(at.x + 11 + slat * 6, at.y + 3, 4.6, SLAB - 6);
    ctx.strokeRect(at.x + 11 + slat * 6, at.y + 3, 4.6, SLAB - 6);
  }
  // The back rail, set off the seat the way a back is.
  ctx.fillStyle = "#6b4f32";
  ctx.fillRect(at.x + 30, at.y + 4, 4, SLAB - 8);
  ctx.strokeRect(at.x + 30, at.y + 4, 4, SLAB - 8);
  ctx.restore();
}

/** The bars along the front of a cell, with the gate standing open. */
function drawBars(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(at.x, at.y + SLAB * 0.4, SLAB + 1, SLAB * 0.2);
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let bar = 0; bar <= 4; bar += 1) {
    const x = at.x + 3 + (bar * (SLAB - 6)) / 4;
    ctx.moveTo(x, at.y + SLAB * 0.36);
    ctx.lineTo(x, at.y + SLAB * 0.64);
  }
  ctx.stroke();
  ctx.restore();
}

/** A bunk against the back wall of a cell. */
function drawBunk(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#52525b";
  ctx.fillRect(at.x + 2, at.y + INSET, SLAB - 4, SLAB - INSET * 2);
  // The mattress and the folded blanket at the foot of it.
  ctx.fillStyle = "#d6d3d1";
  ctx.fillRect(at.x + 4, at.y + INSET + 2, SLAB - 8, SLAB - INSET * 2 - 4);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(at.x + 4, at.y + SLAB - INSET - 12, SLAB - 8, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 2.5, at.y + INSET + 0.5, SLAB - 5, SLAB - INSET * 2);
  ctx.restore();
}

/** Where the pan is: bolted to the wall, standing loose, or not here. */
type PanMode = "fixed" | "loose" | "gone";

/**
 * The pan in the corner of a cell, bolted to the wall it drains into.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - the square it stands in
 * @param row - and the row
 * @param mode - bolted down, standing loose beside it, or somewhere else
 * @remarks
 * **A lavatory is part of the wall, not furniture standing near one.** The
 * soil pipe goes back into the brickwork, so the cistern sits flush against
 * the south wall of every cell, the pan sticks out into the room in front of
 * it, and a short spur joins the two. Drawn free-standing in the middle of
 * the floor - which is how it was - it reads as a bucket somebody left out.
 *
 * That it faces the wall matters twice over: the wall it is bolted to is the
 * one the player digs through, so the pan, the pipe and the hole are all the
 * same corner of the same cell.
 *
 * Off the wall it is the **same object**, stood to one side at an angle,
 * because that is what one does with a lavatory one has unbolted: it does not
 * vanish and it does not become a puddle. What is left on the brickwork is
 * the bare flange, which is the one thing in this cell that says somebody has
 * been at it.
 */
function drawLoo(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
  mode: PanMode,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  if (mode !== "fixed") {
    // The bare flange it was bolted to, left on the wall.
    ctx.fillStyle = "#57534e";
    ctx.beginPath();
    ctx.arc(at.x + SLAB / 2, at.y + SLAB - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (mode === "fixed") {
    panShape(ctx, at.x, at.y);
  } else if (mode === "loose") {
    ctx.translate(at.x + SLAB * 0.78, at.y + SLAB * 0.52);
    ctx.rotate(0.55);
    panShape(ctx, -SLAB / 2, -SLAB / 2);
  }
  ctx.restore();
}

/**
 * The pan itself, drawn into one square of the plan.
 *
 * @param ctx - what to paint on
 * @param x - the left of the square it is drawn in
 * @param y - and the top of it
 * @remarks
 * One shape, drawn twice: bolted to a wall and standing loose beside the hole
 * are the same lavatory, and drawing them separately is how the two end up
 * looking like two different things.
 */
function panShape(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const middle = x + SLAB / 2;
  ctx.save();
  // The shadow it throws into the corner.
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(middle + 2, y + 23, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  // The cistern, flush against the wall, with the flush plate on top of it.
  ctx.fillStyle = "#d4d4d8";
  ctx.fillRect(middle - 11, y + SLAB - 11, 22, 10);
  ctx.strokeRect(middle - 11, y + SLAB - 11, 22, 10);
  ctx.fillStyle = "#a1a1aa";
  ctx.fillRect(middle - 4, y + SLAB - 8, 8, 4);
  // The spur from it to the pan.
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(middle - 3.5, y + SLAB - 16, 7, 6);
  ctx.strokeRect(middle - 3.5, y + SLAB - 16, 7, 6);
  // The pan, sticking out into the cell.
  ctx.beginPath();
  ctx.ellipse(middle, y + 21, 9.5, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The seat ring, and the water in it.
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(middle, y + 21, 6.6, 5.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#bcd2dd";
  ctx.beginPath();
  ctx.ellipse(middle, y + 21, 4.4, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * The stones under the pan: a patch of floor, then a hole in the wall.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @param col - the square they are in
 * @param row - and the row
 * @remarks
 * Three states one has to be able to tell apart from across the cell: bricked
 * up and nothing to see, being worked on (the mortar coming out between them),
 * and out - which is a black hole with the stones stacked beside it.
 */
function drawStones(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  // Until the pan comes off the wall there is nothing here but the foot of
  // the wall: a corner that showed where it was weak would be a corner with
  // the answer written on it.
  ctx.fillStyle = "#57534e";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
  if (past(prison.stage, "loo")) {
    // **The hole is always there to see.** Broken concrete round the shaft,
    // the dark of it, the stones one lifted out lying where a man kneeling
    // would have put them - and over the top of it either the pan or nothing.
    // A lid that hid the hole from the player as well as from the warders
    // would leave one guessing what one's own cell looks like.
    ctx.fillStyle = "#6b5b4b";
    ctx.beginPath();
    ctx.ellipse(
      at.x + SLAB / 2,
      at.y + SLAB / 2,
      SLAB * 0.48,
      SLAB * 0.46,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.ellipse(
      at.x + SLAB / 2,
      at.y + SLAB / 2 + 1,
      SLAB * 0.3,
      SLAB * 0.28,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#8d857c";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    for (const stone of [
      { x: 5, y: 6, turn: 0.3 },
      { x: SLAB - 7, y: 9, turn: -0.5 },
      { x: 11, y: SLAB - 5, turn: 0.9 },
    ]) {
      ctx.save();
      ctx.translate(at.x + stone.x, at.y + stone.y);
      ctx.rotate(stone.turn);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (digStage(prison) && prison.work > 0) {
      // How far down one has got, round the rim of it.
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(
        at.x + SLAB / 2,
        at.y + SLAB / 2,
        SLAB * 0.4,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, prison.work),
      );
      ctx.stroke();
    }
  }
  ctx.restore();
  if (panOnHole(prison)) {
    drawLoo(ctx, view, col, row, "fixed");
  }
}

/** Whether the player is at one of the two rungs that dig this hole. */
function digStage(prison: PrisonState): boolean {
  return prison.stage === "dig" || prison.stage === "dig2";
}

/**
 * Whether the pan is standing over the hole rather than beside it.
 *
 * @param prison - the jail as it stands
 * @returns true while it is shoved back into place
 * @remarks
 * One pan, two places it can be, and the flag that says which is the same one
 * the warders care about. After the crawl space turns out to be a dead end it
 * goes back over the hole by itself: nobody walks out of a hole in his own
 * floor and leaves it gaping behind him.
 */
function panOnHole(prison: PrisonState): boolean {
  return past(prison.stage, "loo") && prison.covered;
}

/**
 * A way up out of the tunnel: a hole in the roof of it with a ladder in it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - the square it is in
 * @param row - and the row
 * @remarks
 * Both ends of the long tunnel look the same, because they are the same
 * thing: the one at the west is where one drops in out of the workshop and
 * the one at the east is where one climbs out under the sick bay. A tunnel
 * whose ends are not marked is a corridor one walks up and down twice.
 */
function drawShaft(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  // The daylight coming down it.
  ctx.fillStyle = "rgba(226,232,240,0.14)";
  ctx.fillRect(at.x + 5, at.y + 4, SLAB - 10, SLAB - 8);
  // And the ladder standing in it.
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const side of [-6, 6]) {
    ctx.moveTo(at.x + SLAB / 2 + side, at.y + 6);
    ctx.lineTo(at.x + SLAB / 2 + side, at.y + SLAB - 6);
  }
  for (let rung = 0; rung < 4; rung += 1) {
    const y = at.y + 9 + rung * 7;
    ctx.moveTo(at.x + SLAB / 2 - 6, y);
    ctx.lineTo(at.x + SLAB / 2 + 6, y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * The sick bay window, shut or swung open with the cable in reach.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @param col - the square it sits in
 * @param row - and the row
 * @remarks
 * It sits in the north wall, so from above one sees a sill, four panes and
 * the bars over them. Open, the sash stands out into the street and the panes
 * are gone: from the far side of the room that difference is the whole of the
 * news, so it is drawn big enough to read at a glance.
 */
function drawWindow(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const open = past(prison.stage, "window");
  ctx.save();
  // The wall it is cut into, and the stone sill along the inside of it.
  ctx.fillStyle = "#57534e";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
  ctx.fillStyle = "#a8a29e";
  ctx.fillRect(at.x + 3, at.y + SLAB - 9, SLAB - 6, 7);
  const box = {
    x: at.x + 4,
    y: at.y + 5,
    w: SLAB - 8,
    h: SLAB - 16,
  };
  if (open) {
    // Nothing in the opening any more, and the sash hanging out over the
    // street on its hinge.
    ctx.fillStyle = "#111827";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = "rgba(191,219,254,0.5)";
    ctx.save();
    ctx.translate(box.x + box.w, box.y);
    ctx.rotate(-0.5);
    ctx.fillRect(0, -3, box.w * 0.8, 5);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -3, box.w * 0.8, 5);
    ctx.restore();
  } else {
    // Glass, four panes of it, with the bars sitting over the outside.
    ctx.fillStyle = "#b9d0d8";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x + box.w / 2, box.y);
    ctx.lineTo(box.x + box.w / 2, box.y + box.h);
    ctx.moveTo(box.x, box.y + box.h / 2);
    ctx.lineTo(box.x + box.w, box.y + box.h / 2);
    ctx.stroke();
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let bar = 1; bar < 4; bar += 1) {
      const x = box.x + (bar * box.w) / 4;
      ctx.moveTo(x, box.y);
      ctx.lineTo(x, box.y + box.h);
    }
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (prison.stage === "window" && prison.work > 0) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(at.x + 4, at.y + SLAB - 3);
      ctx.lineTo(
        at.x + 4 + (SLAB - 8) * Math.min(1, prison.work),
        at.y + SLAB - 3,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * The workshop table, and the hole under it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @param col - the square it stands on
 * @param row - and the row
 * @remarks
 * Three states, like the pan in the cell: standing over the floor, pushed
 * aside with the hole open, and gone through. What one is looking for at a
 * glance is whether anything is showing.
 */
function drawTable(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const open = past(prison.stage, "works");
  ctx.save();
  if (open || !prison.covered) {
    // Broken concrete round the shaft, the dark of it, and the table shoved
    // off to one side - the same hole as the one in the cell, so that the two
    // of them read as one job done twice.
    ctx.fillStyle = "#5d574f";
    ctx.beginPath();
    ctx.ellipse(
      at.x + SLAB / 2,
      at.y + SLAB / 2,
      SLAB * 0.46,
      SLAB * 0.44,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.ellipse(
      at.x + SLAB / 2,
      at.y + SLAB / 2 + 1,
      SLAB * 0.3,
      SLAB * 0.28,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#8d857c";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    for (const lump of [
      { x: 6, y: 7, turn: 0.4 },
      { x: SLAB - 8, y: SLAB - 8, turn: -0.6 },
    ]) {
      ctx.save();
      ctx.translate(at.x + lump.x, at.y + lump.y);
      ctx.rotate(lump.turn);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (!open) {
      workBench(ctx, at.x + SLAB * 0.66, at.y + 4, SLAB * 0.5);
      // How far down one has got, along the near edge of the hole.
      if (prison.stage === "works" && prison.work > 0) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(at.x + 4, at.y + SLAB - 4);
        ctx.lineTo(
          at.x + 4 + (SLAB - 8) * Math.min(1, prison.work),
          at.y + SLAB - 4,
        );
        ctx.stroke();
      }
    }
  } else {
    workBench(ctx, at.x + 2, at.y + 4, SLAB - 4);
  }
  ctx.restore();
}

/** The bench itself: a top, its planks, and the vice on the end of it. */
function workBench(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wide: number,
): void {
  ctx.save();
  ctx.fillStyle = "#8a6a45";
  ctx.fillRect(x, y, wide, SLAB - 8);
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let plank = 1; plank < 3; plank += 1) {
    const at = y + (plank * (SLAB - 8)) / 3;
    ctx.moveTo(x, at);
    ctx.lineTo(x + wide, at);
  }
  ctx.stroke();
  ctx.strokeStyle = OUTLINE;
  ctx.strokeRect(x, y, wide, SLAB - 8);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(x + wide - 9, y + (SLAB - 8) / 2 - 4, 8, 8);
  ctx.restore();
}

/**
 * The wall at the end of the crawl space, and the rock behind it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @param col - the square it stands on
 * @param row - and the row
 */
function drawHardWall(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const through = past(prison.stage, "wall");
  ctx.save();
  ctx.fillStyle = through ? "#231f1c" : "#6b5b4b";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
  if (!through) {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let course = 1; course < 4; course += 1) {
      const y = at.y + (course * SLAB) / 4;
      ctx.moveTo(at.x, y);
      ctx.lineTo(at.x + SLAB, y);
    }
    ctx.stroke();
    if (prison.stage === "wall" && prison.work > 0) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(
        at.x + SLAB / 2,
        at.y + SLAB / 2,
        SLAB * 0.3,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, prison.work),
      );
      ctx.stroke();
    }
  } else {
    // Broken through, and behind it the rock that ends this way out.
    ctx.fillStyle = "#4b4540";
    for (const lump of [
      { x: 6, y: 8 },
      { x: 22, y: 14 },
      { x: 12, y: 26 },
    ]) {
      ctx.beginPath();
      ctx.ellipse(at.x + lump.x, at.y + lump.y, 7, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The locked door of the sick bay: steel, with a hatch and no handle. */
function drawLocked(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(at.x + 2, at.y + 6, SLAB - 4, SLAB - 12);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 2, at.y + 6, SLAB - 4, SLAB - 12);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(at.x + SLAB / 2 - 7, at.y + SLAB / 2 - 3, 14, 6);
  ctx.strokeRect(at.x + SLAB / 2 - 7, at.y + SLAB / 2 - 3, 14, 6);
  ctx.restore();
}

/** A bed in the sick bay: a frame, a mattress and a folded sheet. */
function drawBed(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(at.x + 4, at.y + 2, SLAB - 8, SLAB - 4);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(at.x + 6, at.y + 4, SLAB - 12, SLAB - 8);
  ctx.fillStyle = "#bfdbfe";
  ctx.fillRect(at.x + 6, at.y + SLAB - 16, SLAB - 12, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 4.5, at.y + 2.5, SLAB - 9, SLAB - 5);
  ctx.restore();
}

/** The tower on the wall: a platform with a rail round it. */
function drawTower(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#44403c";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
  ctx.fillStyle = "#78716c";
  ctx.fillRect(at.x + 3, at.y + 3, SLAB - 6, SLAB - 6);
  ctx.strokeStyle = "#e7e5e4";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(at.x + 5.5, at.y + 5.5, SLAB - 11, SLAB - 11);
  // The lamp on the rail, which is what the tower is for at night.
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(at.x + SLAB / 2, at.y + SLAB / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** One square painted flat, with a line round it only if it is a thing. */
function fill(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
  paint: string,
  inset: number,
): void {
  const at = project(view, col * SLAB + inset, row * SLAB + inset);
  const side = SLAB - inset * 2;
  ctx.fillStyle = paint;
  ctx.fillRect(at.x, at.y, side + 1, side + 1);
  if (inset > 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x + 0.5, at.y + 0.5, side, side);
  }
}

/* ----------------------------------------------------------- what is seen */

/**
 * What each warder can see, drawn on the floor.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @remarks
 * The single most important thing in the picture. Timing a round is the whole
 * game in here, and a look one cannot see is indistinguishable from bad luck -
 * so the cone is on the floor, and it turns red exactly when being in it would
 * cost something. While the search is on it is both wider and longer, which is
 * what a missed roll-call looks like from the inside.
 */
function drawCones(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const hot = hunting(prison);
  const hunt = searching(prison);
  const paint = hot ? "#ef4444" : "#fbbf24";
  for (const warder of prison.warders) {
    if (outOfSight(prison, warder)) {
      continue;
    }
    ctx.save();
    ctx.beginPath();
    const middle = project(view, warder.x, warder.y);
    ctx.moveTo(middle.x, middle.y);
    const wide = WATCH_WIDE * (hunt ? 1.5 : 1);
    for (let step = 0; step <= 12; step += 1) {
      const angle = warder.heading - wide + (step / 12) * wide * 2;
      const edge = cornerOf(view, warder, angle, hunt);
      ctx.lineTo(edge.x, edge.y);
    }
    ctx.closePath();
    ctx.globalAlpha = CONE_FADE;
    ctx.fillStyle = paint;
    ctx.fill();
    ctx.globalAlpha = CONE_FADE * 2.4;
    ctx.strokeStyle = paint;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

/** Where one edge of a warder's look reaches, on the screen. */
function cornerOf(
  view: View,
  warder: Warder,
  angle: number,
  hunt: boolean,
): Vec {
  const far = WATCH_RANGE * (hunt ? 1.5 : 1);
  return project(
    view,
    warder.x + Math.cos(angle) * far,
    warder.y + Math.sin(angle) * far,
  );
}

/** A ring round whatever the task in hand is. */
function drawMark(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const mark = markOf(prison);
  if (mark !== null) {
    const beat = 1 + Math.sin(prison.time * 4) * 0.12;
    const spot = project(view, mark.x, mark.y);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * beat, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * The cable from the grate over the wall.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param prison - the jail as it stands
 * @remarks
 * Drawn only once there is a reason for it to be there. Before the grate is
 * off it is a cable lying along the wall like any other cable; after it, it is
 * the way out, and it is drawn taut and pale so that one can see where it goes
 * from the far end of the crawl space.
 */
function drawCable(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const line = cableLine();
  if (line === null) {
    return;
  }
  const from = project(view, line.from.x, line.from.y);
  const to = project(view, line.to.x, line.to.y);
  const live = past(prison.stage, "window");
  ctx.save();
  ctx.strokeStyle = live ? "#fde68a" : "#57534e";
  ctx.lineWidth = live ? 2.6 : 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Where the cable runs, in jail pixels.
 *
 * @returns the two ends of it, or null if the plan has no cable on it
 * @remarks
 * It starts at the window, because that is where one grabs it, and ends at
 * the far side of the last square of it. Taking the window as the first end
 * saves the line stopping short of the one place the player is looking.
 */
function cableLine(): { readonly from: Vec; readonly to: Vec } | null {
  let from: Vec | null = null;
  let to: Vec | null = null;
  for (let row = 0; row < PLAN_HIGH; row += 1) {
    for (let col = 0; col < PLAN_WIDE; col += 1) {
      const kind = slabAt(col, row);
      const spot = { x: (col + 0.5) * SLAB, y: (row + 0.5) * SLAB };
      if (kind === "window") {
        from = spot;
      } else if (kind === "cable") {
        from = from ?? spot;
        to = spot;
      }
    }
  }
  return from === null || to === null ? null : { from, to };
}

/* --------------------------------------------------------------- the page */

/**
 * The bar along the bottom: the task, the job in hand, the count, the catches.
 *
 * @param ctx - what to paint on
 * @param prison - the jail as it stands
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @remarks
 * Four things, and the third is new: **when the next count is**. A jail that
 * counts its men without telling anybody when would be a jail one loses to a
 * stopwatch one is not allowed to see. The clock turns red inside the warning,
 * which is exactly as much notice as the tannoy gives.
 */
function drawTask(
  ctx: CanvasRenderingContext2D,
  prison: PrisonState,
  width: number,
  height: number,
): void {
  const wide = Math.min(560, width - 40);
  const high = 58;
  const left = (width - wide) / 2;
  const top = height - high - 16;
  const due = untilCount(prison);
  ctx.save();
  ctx.fillStyle = "rgba(12,10,9,0.78)";
  ctx.fillRect(left, top, wide, high);
  ctx.strokeStyle = "rgba(250,250,249,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, wide, high);
  ctx.fillStyle = "#fafaf9";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(taskLine(prison), left + 12, top + 17);
  // The bar of the job in hand.
  const barWide = wide - 24;
  ctx.fillStyle = "rgba(250,250,249,0.18)";
  ctx.fillRect(left + 12, top + 32, barWide, 8);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(left + 12, top + 32, barWide * Math.min(1, prison.work), 8);
  // The count, and the catches left.
  ctx.textAlign = "right";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = searching(prison)
    ? "#fca5a5"
    : due <= COUNT_WARN
      ? "#fbbf24"
      : "#bbf7d0";
  ctx.fillText(
    searching(prison)
      ? "Durchsuchung"
      : `Zählappell in ${String(Math.ceil(due))} s`,
    left + wide - 12,
    top + 47,
  );
  for (let mark = 0; mark < CATCHES; mark += 1) {
    ctx.fillStyle = mark < CATCHES - prison.caught ? "#4ade80" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(left + wide - 16 - mark * 14, top + 17, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
