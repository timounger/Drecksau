/**
 * Drawing the jail: the yard, the cells, the passage and the cable.
 *
 * @module
 * @remarks
 * The same tilted picture as the city - {@link ./projection} squashes depth and
 * lifts height - and the same bargain: everything here reads the state and
 * paints, nothing here changes it. What is different is the floor: the jail is
 * a fixed plan of squares rather than a generated grid, so the ground, the
 * walls and the furniture all come out of one loop over the plan.
 *
 * Rows are painted from north to south, and the people standing in a row are
 * painted with it. That is the whole of the depth sorting: a warder in the
 * corridor is drawn after the wall he is standing behind and before the wall
 * he is standing in front of.
 */
import {
  DEPTH,
  PERSON_HEIGHT,
  cameraFor,
  project,
  seenArea,
  type View,
} from "@/games/gta/components/projection";
import { drawFigure, shadow, type Figure } from "@/games/gta/components/render";
import {
  PLAN_HIGH,
  PLAN_WIDE,
  hunting,
  markOf,
  past,
  slabAt,
  slabUnder,
  taskLine,
} from "@/games/gta/engine/prison";
import {
  CABLE_HEIGHT,
  CATCHES,
  SLAB,
  TOWER_HEIGHT,
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
   numbers are the drawing: how high a wall stands, where the seat of a bench
   is, how dark the passage behind the cells is. They are shapes and colours,
   not arithmetic. */

/** What each square of the plan is painted in. */
const GROUND: Readonly<Record<Slab, string>> = {
  wall: "#57534e",
  floor: "#9ca3af",
  cell: "#8b93a1",
  bars: "#8b93a1",
  gate: "#8b93a1",
  yard: "#8a8378",
  bench: "#8a8378",
  loo: "#8b93a1",
  myLoo: "#8b93a1",
  bunk: "#8b93a1",
  stones: "#57534e",
  tunnel: "#3b2f28",
  ward: "#a7bfae",
  window: "#57534e",
  cable: "#8a8378",
  tower: "#57534e",
  free: "#4d7c3f",
};

/** What lies past the edge of the plan, where there is no jail at all. */
const BEYOND = "#1c1917";

/** How high the walls of the block stand, in screen pixels. */
const WALL_HIGH = 34;

/** How high the wall around the whole place stands. */
const OUTER_HIGH = 56;

/** How high a run of bars stands. */
const BARS_HIGH = 30;

/** Which row of the plan the outer wall is. */
const OUTER_ROW = 23;

/** How solid a wall is painted while the player stands behind it. */
const SEE_THROUGH = 0.3;

/** How solid a warder's look is painted on the floor. */
const CONE_FADE = 0.18;

/** How wide a person is on the ground, in jail pixels. */
const FOOTPRINT = 4.6;

/** The prison suit: white, with the stripes drawn on by ./figure-art. */
const SUIT: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#f8fafc",
  trousers: "#eceae7",
  skin: "#c68642",
  hair: "#1c1917",
};

/** What a warder wears. */
const UNIFORM: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#1e293b",
  trousers: "#0f172a",
  skin: "#e0ac69",
  hair: "#3f3f46",
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
    const view = cameraFor(prison.hero, width, height, zoom);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-view.width / 2, -view.height / 2);
    drawFloor(ctx, view);
    drawCones(ctx, view, prison);
    drawMark(ctx, view, prison);
    drawRows(ctx, view, prison);
    drawCable(ctx, view, prison);
    ctx.restore();
    drawTask(ctx, prison, width, height);
  }
}

/* -------------------------------------------------------------- the floor */

/** Every square in sight, painted flat. */
function drawFloor(ctx: CanvasRenderingContext2D, view: View): void {
  const seen = seenArea(view);
  const fromCol = Math.floor(seen.left / SLAB);
  const fromRow = Math.floor(seen.top / SLAB);
  const toCol = Math.ceil(seen.right / SLAB);
  const toRow = Math.ceil(seen.bottom / SLAB);
  const deep = SLAB * DEPTH + 1;
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(0, 0, view.width, view.height);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const inside = col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH;
      const kind = slabAt(col, row);
      const at = project(view, col * SLAB, row * SLAB);
      // Past the edge of the plan there is nothing - and nothing is painted as
      // nothing, not as the grass that happens to lie south of the wall.
      ctx.fillStyle = inside ? GROUND[kind] : BEYOND;
      ctx.fillRect(at.x, at.y, SLAB + 1, deep);
      if (inside && (kind === "ward" || kind === "floor" || kind === "cell")) {
        // A tiled floor indoors: the line between the squares is what tells
        // the eye it is walking along a corridor rather than over a field.
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(at.x, at.y, SLAB, deep - 1);
      }
    }
  }
}

/* ------------------------------------------------------------ what stands */

/**
 * The rows of the plan, north to south, with the people standing in them.
 *
 * @remarks
 * One pass, and the order inside it is the whole depth sorting. Anything with
 * height is drawn when its own row comes up, and everybody standing in that
 * row is drawn straight after - so a man in the corridor is in front of the
 * cell wall behind him and behind the wall in front of him, without a sort.
 */
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
      if (Math.floor(one.at.y / SLAB) === row) {
        paintPerson(ctx, view, one);
      }
    }
  }
}

/** Everybody in the jail, with what they are wearing. */
function everybody(prison: PrisonState): readonly PrisonFolk[] {
  return [
    ...prison.idle.map((one) => ({ at: one, kind: "idle" as const })),
    // Whoever is out over the wall hangs there: the player and, right behind
    // him, the queue of men who came through the hole with him.
    ...prison.mates.map((one) => ({
      at: one,
      kind: "mate" as const,
      lift: liftOf(one),
    })),
    ...prison.warders.map((one) => ({
      at: one,
      kind: "warder" as const,
      lift: one.high ? TOWER_HEIGHT : 0,
    })),
    { at: prison.hero, kind: "hero" as const, lift: liftOf(prison.hero) },
  ];
}

/** How far off the ground somebody is: on the cable, or nowhere. */
function liftOf(who: Inmate): number {
  return slabUnder(who.x, who.y) === "cable" ? CABLE_HEIGHT : 0;
}

/** One person in the jail, and which sort. */
type PrisonFolk = {
  readonly at: Inmate;
  readonly kind: "hero" | "mate" | "warder" | "idle";
  /** How high over the ground they are drawn, in screen pixels. */
  readonly lift?: number;
};

/** One person: their shadow, and the three sprites over it. */
function paintPerson(
  ctx: CanvasRenderingContext2D,
  view: View,
  who: PrisonFolk,
): void {
  const warder = who.kind === "warder";
  const worn = warder ? UNIFORM : SUIT;
  const lift = who.lift ?? 0;
  const look: Figure = {
    ...worn,
    // Everybody in here wears the same striped suit; the men who are staying
    // put wear a greyer one, so that the queue behind the player reads as the
    // queue behind the player.
    shirt: who.kind === "idle" ? "#d6d3d1" : worn.shirt,
    facing: who.at.heading,
    heading: who.at.heading,
    walked: who.at.walked,
    arms: warder ? "hold" : "swing",
    hand: "right",
    style: warder ? "cop" : "convict",
  };
  ctx.save();
  if (lift > 0) {
    // Height in this picture is a shift up the screen and nothing else, so one
    // translate puts a man on a cable or on a tower platform.
    ctx.translate(0, -lift);
  } else {
    shadow(ctx, view, who.at, FOOTPRINT, FOOTPRINT * 0.8, 0, 0.55);
  }
  drawFigure(ctx, view, who.at, look, 1);
  ctx.restore();
}

/** Whatever stands on one square: a wall, a bunk, a pan, a bench. */
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
      block(
        ctx,
        view,
        prison,
        col,
        row,
        row === OUTER_ROW ? OUTER_HIGH : WALL_HIGH,
        "#a8a29e",
        "#d6d3d1",
      );
      break;
    case "stones":
      drawStones(ctx, view, prison, col, row);
      break;
    case "window":
      drawWindow(ctx, view, prison, col, row);
      break;
    case "bars":
      drawBars(ctx, view, col, row);
      break;
    case "bench":
      drawBench(ctx, view, col, row);
      break;
    case "loo":
    case "myLoo":
      drawLoo(ctx, view, prison, col, row, kind === "myLoo");
      break;
    case "bunk":
      drawBunk(ctx, view, col, row);
      break;
    case "tower":
      drawTower(ctx, view, prison, col, row);
      break;
    default:
      break;
  }
}

/**
 * A square of wall, as a box with a face and a top.
 *
 * @remarks
 * See-through when the player is behind it, the same trick the city plays with
 * its houses: a jail is all walls, and a wall one cannot see past is a wall
 * one is lost behind.
 */
function block(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
  high: number,
  face: string,
  top: string,
): void {
  const left = col * SLAB;
  const foot = project(view, left, (row + 1) * SLAB);
  const back = project(view, left, row * SLAB, high);
  const fade = hides(view, prison, col, row, high) ? SEE_THROUGH : 1;
  ctx.globalAlpha = fade;
  ctx.fillStyle = top;
  ctx.fillRect(back.x, back.y, SLAB + 1, foot.y - high - back.y + 1);
  ctx.fillStyle = face;
  ctx.fillRect(foot.x, foot.y - high, SLAB + 1, high);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(foot.x, foot.y - high, SLAB, high);
  ctx.globalAlpha = 1;
}

/**
 * Whether this box would be standing in front of something one has to see.
 *
 * @remarks
 * Asked in screen pixels rather than in squares, because that is the actual
 * question: does the painted box land on top of the thing. A wall two rows
 * south hides it at one height and not at another, and counting rows would
 * have to guess which.
 *
 * Two things count: the player, and whatever the task points at. The pan in
 * the corner of the cell and the hole under it both stand against the south
 * wall of the block, so without the second one the whole middle of the escape
 * would happen behind a grey band.
 */
function hides(
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
  high: number,
): boolean {
  const mark = markOf(prison);
  const watched: readonly Vec[] =
    mark === null ? [prison.hero] : [prison.hero, mark];
  return watched.some((spot) => covers(view, spot, col, row, high));
}

/** Whether the box on this square is painted over that point. */
function covers(
  view: View,
  spot: Vec,
  col: number,
  row: number,
  high: number,
): boolean {
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  const back = project(view, col * SLAB, row * SLAB, high);
  const at = project(view, spot.x, spot.y, PERSON_HEIGHT);
  return (
    spot.y < row * SLAB &&
    at.x >= foot.x &&
    at.x <= foot.x + SLAB &&
    at.y >= back.y &&
    at.y <= foot.y
  );
}

/** The loose stones: a wall with a hole in it once they are out. */
function drawStones(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  const open = past(prison.stage, "stones");
  if (open) {
    // A dark mouth in the wall, with what came out of it lying about.
    const foot = project(view, col * SLAB, (row + 1) * SLAB);
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(foot.x + 4, foot.y - WALL_HIGH, SLAB - 7, WALL_HIGH);
    ctx.fillStyle = "#78716c";
    for (let stone = 0; stone < 4; stone += 1) {
      ctx.fillRect(foot.x + 6 + stone * 8, foot.y + 2 + (stone % 2) * 4, 7, 5);
    }
  } else {
    block(ctx, view, prison, col, row, WALL_HIGH, "#8d857f", "#d6d3d1");
    // The mortar the screw is going to come out of, drawn as it is: bricks.
    const foot = project(view, col * SLAB, (row + 1) * SLAB);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    for (let line = 1; line < 4; line += 1) {
      const y = foot.y - WALL_HIGH + (line * WALL_HIGH) / 4;
      ctx.beginPath();
      ctx.moveTo(foot.x, y);
      ctx.lineTo(foot.x + SLAB, y);
      ctx.stroke();
    }
  }
}

/** The window of the sick bay: barred, and open once the cable is in hand. */
function drawWindow(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  block(ctx, view, prison, col, row, WALL_HIGH, "#a8a29e", "#d6d3d1");
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  const open = past(prison.stage, "window");
  ctx.fillStyle = open ? "#0f172a" : "#7dd3fc";
  ctx.fillRect(foot.x + 6, foot.y - WALL_HIGH + 6, SLAB - 12, WALL_HIGH - 14);
  if (!open) {
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    for (let bar = 1; bar < 3; bar += 1) {
      const x = foot.x + 6 + ((SLAB - 12) * bar) / 3;
      ctx.beginPath();
      ctx.moveTo(x, foot.y - WALL_HIGH + 6);
      ctx.lineTo(x, foot.y - 8);
      ctx.stroke();
    }
  }
}

/** A run of bars between a cell and the corridor. */
function drawBars(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 2.5;
  for (let bar = 0; bar <= 4; bar += 1) {
    const x = foot.x + 3 + bar * ((SLAB - 6) / 4);
    ctx.beginPath();
    ctx.moveTo(x, foot.y);
    ctx.lineTo(x, foot.y - BARS_HIGH);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y - BARS_HIGH);
  ctx.lineTo(foot.x + SLAB, foot.y - BARS_HIGH);
  ctx.stroke();
}

/** A bench in the yard - and the screw under its seat. */
function drawBench(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const foot = project(view, col * SLAB, (row + 1) * SLAB - 6);
  const high = 13;
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(foot.x + 4, foot.y - 4, 4, 6);
  ctx.fillRect(foot.x + SLAB - 8, foot.y - 4, 4, 6);
  ctx.fillStyle = "#a97c50";
  ctx.fillRect(foot.x, foot.y - high, SLAB, high - 4);
  ctx.fillStyle = "#8a6440";
  ctx.fillRect(foot.x, foot.y - high, SLAB, 3);
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(foot.x, foot.y - high, SLAB, high - 4);
  // The bolt heads along the underside: what the whole escape starts with.
  ctx.fillStyle = "#d6d3d1";
  ctx.beginPath();
  ctx.arc(foot.x + 9, foot.y - 6, 2, 0, Math.PI * 2);
  ctx.arc(foot.x + SLAB - 9, foot.y - 6, 2, 0, Math.PI * 2);
  ctx.fill();
}

/** A lavatory pan in the corner of a cell. */
function drawLoo(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
  mine: boolean,
): void {
  const foot = project(view, (col + 0.5) * SLAB, (row + 0.7) * SLAB);
  const gone = mine && past(prison.stage, "loo");
  if (gone) {
    // Off the floor and standing beside the hole it used to cover.
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.ellipse(foot.x + 15, foot.y - 6, 8, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y - 5, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(foot.x - 7, foot.y - 18, 14, 12);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y - 5, 9, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y - 6, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A bunk against the cell wall. */
function drawBunk(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const foot = project(view, col * SLAB, (row + 1) * SLAB - 4);
  const high = 11;
  ctx.fillStyle = "#52525b";
  ctx.fillRect(foot.x + 2, foot.y - high, SLAB - 4, high - 3);
  ctx.fillStyle = "#3f6212";
  ctx.fillRect(foot.x + 2, foot.y - high, SLAB - 4, 5);
  ctx.fillStyle = "#e7e5e4";
  ctx.fillRect(foot.x + 4, foot.y - high, 10, 5);
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(foot.x + 2, foot.y - high, SLAB - 4, high - 3);
}

/* ------------------------------------------------------------- the extras */

/**
 * The watchtower on the outer wall: a shaft, a platform and a railing.
 *
 * @remarks
 * Drawn from the same box as a wall, only taller, and with the platform lipped
 * out over it - the man up there has to look as though he is standing above
 * the cable rather than beside it, because that is exactly the difference the
 * last stretch of the escape turns on.
 */
function drawTower(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
  col: number,
  row: number,
): void {
  block(ctx, view, prison, col, row, TOWER_HEIGHT, "#78716c", "#57534e");
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  // A little over the height the man on it is drawn at, so that he stands on
  // his platform rather than hovering over it.
  const deck = foot.y - TOWER_HEIGHT + 7;
  // The platform: a slab a little wider than the shaft, with a dark underside.
  ctx.fillStyle = "#44403c";
  ctx.fillRect(foot.x - 3, deck - 2, SLAB + 7, 5);
  ctx.fillStyle = "#a8a29e";
  ctx.fillRect(foot.x - 3, deck - 16, SLAB + 7, 14);
  // A railing round it, posts and all.
  ctx.strokeStyle = "#292524";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(foot.x - 3, deck - 16, SLAB + 7, 14);
  ctx.beginPath();
  for (let post = 0; post <= 3; post += 1) {
    const x = foot.x - 3 + (post * (SLAB + 7)) / 3;
    ctx.moveTo(x, deck - 16);
    ctx.lineTo(x, deck - 2);
  }
  ctx.stroke();
}

/**
 * What each warder can see, drawn on the floor.
 *
 * @remarks
 * The single most important thing in the picture. Timing a round is the whole
 * game in here, and a look one cannot see is indistinguishable from bad luck -
 * so the cone is on the floor, and it turns red exactly when being in it would
 * cost something.
 */
function drawCones(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const hot = hunting(prison);
  const paint = hot ? "#ef4444" : "#fbbf24";
  for (const warder of prison.warders) {
    ctx.save();
    ctx.beginPath();
    const middle = project(view, warder.x, warder.y);
    ctx.moveTo(middle.x, middle.y);
    for (let step = 0; step <= 12; step += 1) {
      const angle = warder.heading - WATCH_WIDE + (step / 12) * WATCH_WIDE * 2;
      const edge = cornerOf(view, warder, angle);
      ctx.lineTo(edge.x, edge.y);
    }
    ctx.closePath();
    ctx.globalAlpha = CONE_FADE;
    ctx.fillStyle = paint;
    ctx.fill();
    // An edge to it as well: a patch of light with a rim reads as a look in a
    // direction, and a patch without one reads as fog over the yard.
    ctx.globalAlpha = CONE_FADE * 2.4;
    ctx.strokeStyle = paint;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

/** Where one edge of a warder's look reaches, on the screen. */
function cornerOf(view: View, warder: Warder, angle: number): Vec {
  return project(
    view,
    warder.x + Math.cos(angle) * WATCH_RANGE,
    warder.y + Math.sin(angle) * WATCH_RANGE,
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
    ctx.scale(1, DEPTH);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * beat, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * The cable out of the window and over the wall.
 *
 * @remarks
 * Drawn high above the ground it crosses, and drawn whether or not the player
 * has got to it: the way out has to be visible from the sick bay, or nobody
 * would think of climbing through a window.
 */
function drawCable(
  ctx: CanvasRenderingContext2D,
  view: View,
  prison: PrisonState,
): void {
  const line = cableLine();
  if (line !== null) {
    const from = project(view, line.from.x, line.from.y, CABLE_HEIGHT);
    const to = project(view, line.to.x, line.to.y, CABLE_HEIGHT);
    // Its shadow on the ground under it, first. A line in the air that throws
    // nothing reads as a line painted on the tarmac; the shadow beside it is
    // what says the thing is up there.
    const under = project(view, line.from.x, line.from.y);
    const shade = project(view, line.to.x, line.to.y);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(under.x, under.y);
    ctx.lineTo(shade.x, shade.y);
    ctx.stroke();
    // The mast on the far side, out on the grass.
    ctx.strokeStyle = "#44403c";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(shade.x, shade.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    // The cable itself, bowed a little to one side so that it does not read as
    // a pole standing in the middle of the wall.
    const bow = 9;
    const draw = () => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(
        (from.x + to.x) / 2 + bow,
        (from.y + to.y) / 2,
        to.x,
        to.y,
      );
      ctx.stroke();
    };
    ctx.strokeStyle = "#292524";
    ctx.lineWidth = 3;
    draw();
    ctx.strokeStyle = past(prison.stage, "window") ? "#facc15" : "#57534e";
    ctx.lineWidth = 1.5;
    draw();
  }
}

/** The two ends of the cable, found on the plan. */
function cableLine(): { readonly from: Vec; readonly to: Vec } | null {
  let top: Vec | null = null;
  let low: Vec | null = null;
  for (let row = 0; row < PLAN_HIGH; row += 1) {
    for (let col = 0; col < PLAN_WIDE; col += 1) {
      if (slabAt(col, row) === "cable") {
        const spot = { x: (col + 0.5) * SLAB, y: (row + 0.5) * SLAB };
        top = top ?? spot;
        low = spot;
      }
    }
  }
  return top === null || low === null ? null : { from: top, to: low };
}

/* ---------------------------------------------------------------- the bar */

/**
 * The task, how far it has got, and how often they have had you.
 *
 * @remarks
 * Drawn into the picture rather than left to the page around it, for the same
 * reason the money and the health are: while one is holding the mouse on a
 * screw and listening for boots, the eyes are on the canvas.
 */
function drawTask(
  ctx: CanvasRenderingContext2D,
  prison: PrisonState,
  width: number,
  height: number,
): void {
  const wide = Math.min(520, width - 40);
  const high = 54;
  const left = (width - wide) / 2;
  const top = height - high - 16;
  ctx.save();
  ctx.fillStyle = "rgba(12,10,9,0.78)";
  ctx.fillRect(left, top, wide, high);
  ctx.strokeStyle = "rgba(250,250,249,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, wide, high);
  ctx.fillStyle = "#fafaf9";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(taskLine(prison), left + 12, top + 17);
  // The bar of the job in hand.
  const barWide = wide - 24;
  ctx.fillStyle = "rgba(250,250,249,0.18)";
  ctx.fillRect(left + 12, top + 30, barWide, 8);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(left + 12, top + 30, barWide * Math.min(1, prison.work), 8);
  // One dot per catch left.
  for (let mark = 0; mark < CATCHES; mark += 1) {
    ctx.fillStyle = mark < CATCHES - prison.caught ? "#4ade80" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(left + wide - 16 - mark * 14, top + 17, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
