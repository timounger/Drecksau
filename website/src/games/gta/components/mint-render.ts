/**
 * Drawing the printing works: the hall, the presses, the doors and the hole.
 *
 * @module
 * @remarks
 * The same tilted picture as the city and the jail - {@link ./projection}
 * squashes depth and lifts height - and the same bargain: everything here reads
 * the state and paints, nothing here changes it. The floor is a fixed plan of
 * squares, so the ground, the walls and the machines all come out of one loop
 * over it, north to south, with the people standing in each row painted with it.
 *
 * Two things are drawn that are not objects at all: the bars over the three
 * ways in, and the panel along the bottom. Both are there because the job is
 * won or lost on numbers the player cannot see by looking - how much is piled
 * against a door, how far the tunnel has got - and a siege one has to guess at
 * is a siege one loses for reasons one never learns.
 */
import {
  DEPTH,
  PERSON_HEIGHT,
  cameraFor,
  project,
  seenArea,
  type View,
} from "@/games/gta/components/projection";
import { drawActions } from "@/games/gta/components/gta-actions";
import { drawFigure, shadow, type Figure } from "@/games/gta/components/render";
import {
  PLAN_HIGH,
  PLAN_WIDE,
  gateName,
  lit,
  markOf,
  pressSpots,
  running,
  taskLine,
  tileAt,
} from "@/games/gta/engine/mint";
import {
  SLAB,
  type GameState,
  type Gate,
  type Inmate,
  type MintState,
  type Tile,
  type Vec,
} from "@/games/gta/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how high a wall stands, how deep the paper trays of
   a press are, how dark the cellar is. They are shapes and colours, not
   arithmetic. */

/** What each square of the plan is painted in. */
const GROUND: Readonly<Record<Tile, string>> = {
  wall: "#3f3f46",
  hall: "#a1a1aa",
  works: "#8b8b93",
  press: "#8b8b93",
  pallet: "#8b8b93",
  desk: "#a1a1aa",
  door: "#3f3f46",
  gate: "#3f3f46",
  window: "#3f3f46",
  cellar: "#6b6560",
  dig: "#44403c",
  tunnel: "#3b2f28",
  out: "#3b2f28",
  free: "#27272a",
};

/** What lies past the edge of the plan, where there is no building at all. */
const BEYOND = "#18181b";

/** How high an inside wall stands, in screen pixels. */
const WALL_HIGH = 36;

/** And the outside walls of the building. */
const OUTER_HIGH = 54;

/** How solid a wall is painted while the player stands behind it. */
const SEE_THROUGH = 0.3;

/** How wide a person's shadow is. */
const FOOTPRINT = 4.6;

/** The red overall and the mask: what everybody who came in is wearing. */
const OVERALL: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#dc2626",
  trousers: "#b91c1c",
  skin: "#f8fafc",
  hair: "#1c1917",
};

/** And what the people who work here have on. */
const CLERK: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#e2e8f0",
  trousers: "#334155",
  skin: "#e0ac69",
  hair: "#3f3f46",
};

/**
 * Paints one frame of the job.
 *
 * @param ctx - what to paint on
 * @param state - the game, with a job under way inside the works
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @param zoom - how close the camera stands
 */
export function drawMint(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  zoom: number,
): void {
  const mint = state.mint;
  if (mint !== null) {
    const view = cameraFor(mint.hero, width, height, zoom);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-view.width / 2, -view.height / 2);
    drawFloor(ctx, view, mint);
    drawMark(ctx, view, mint);
    drawRows(ctx, view, mint);
    ctx.restore();
    if (!lit(mint)) {
      drawDark(ctx, width, height);
    }
    drawPanel(ctx, mint, width, height);
    drawActions(ctx, state, width, height);
  }
}

/* -------------------------------------------------------------- the floor */

/** Every square in sight, painted flat. */
function drawFloor(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const seen = seenArea(view);
  const fromCol = Math.floor(seen.left / SLAB);
  const fromRow = Math.floor(seen.top / SLAB);
  const toCol = Math.ceil(seen.right / SLAB);
  const toRow = Math.ceil(seen.bottom / SLAB);
  const deep = SLAB * DEPTH + 1;
  ctx.fillStyle = BEYOND;
  ctx.fillRect(0, 0, view.width, view.height);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const inside = col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH;
      const kind = tileAt(col, row);
      const at = project(view, col * SLAB, row * SLAB);
      ctx.fillStyle = inside ? GROUND[kind] : BEYOND;
      ctx.fillRect(at.x, at.y, SLAB + 1, deep);
      if (inside && (kind === "hall" || kind === "works")) {
        // A tiled floor: the line between the squares is what tells the eye it
        // is walking down a hall rather than over a field.
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(at.x, at.y, SLAB, deep - 1);
      }
      if (inside && kind === "tunnel" && mint.tunnel >= 1) {
        // Once it is through, the tunnel is a lit hole rather than earth.
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(at.x + 8, at.y, SLAB - 15, deep);
      }
    }
  }
}

/* ------------------------------------------------------------ what stands */

/**
 * The rows of the plan, north to south, with the people standing in them.
 *
 * @remarks
 * One pass, and the order inside it is the whole depth sorting - the same as
 * the jail. Anything with height is drawn when its row comes up and everybody
 * standing in that row straight after it.
 */
function drawRows(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const seen = seenArea(view);
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB) - 1);
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB) + 1);
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB) - 1);
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB) + 1);
  const folk = everybody(mint);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      drawSquare(ctx, view, mint, col, row);
    }
    for (const one of folk) {
      if (Math.floor(one.at.y / SLAB) === row) {
        paintPerson(ctx, view, one);
      }
    }
  }
}

/** One person in the works, and which sort. */
type Folk = {
  readonly at: Inmate;
  readonly kind: "hero" | "crew" | "clerk" | "hostage";
};

/** Everybody in the building, with what they are wearing. */
function everybody(mint: MintState): readonly Folk[] {
  return [
    ...mint.staff.map((one) => ({
      at: one,
      kind: one.taken ? ("hostage" as const) : ("clerk" as const),
    })),
    ...mint.crew.map((one) => ({ at: one, kind: "crew" as const })),
    { at: mint.hero, kind: "hero" as const },
  ];
}

/** One person: their shadow, and the three sprites over it. */
function paintPerson(
  ctx: CanvasRenderingContext2D,
  view: View,
  who: Folk,
): void {
  const masked = who.kind === "hero" || who.kind === "crew";
  const worn = masked ? OVERALL : CLERK;
  const look: Figure = {
    ...worn,
    // The hired men are a shade darker than the man who hired them, so that
    // the bright overall in the middle of the screen is always the player.
    shirt: who.kind === "crew" ? "#b91c1c" : worn.shirt,
    facing: who.at.heading,
    heading: who.at.heading,
    walked: who.at.walked,
    // The little worlds keep no speed for anybody, so their figures get the
    // still pose: no lean, no sway. It is a room, not a street.
    pace: 0,
    time: 0,
    // Hands up for anybody who has been taken; everybody else has their arms
    // where they were.
    arms: who.kind === "hostage" ? "hold" : "swing",
    hand: "right",
    style: masked ? "robber" : "plain",
  };
  shadow(ctx, view, who.at, FOOTPRINT, FOOTPRINT * 0.8, 0, 0.55);
  drawFigure(ctx, view, who.at, look, 1);
}

/** Whatever stands on one square: a wall, a press, a pallet, a door. */
function drawSquare(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  const kind = tileAt(col, row);
  switch (kind) {
    case "wall":
      block(
        ctx,
        view,
        mint,
        col,
        row,
        wallHigh(col, row),
        "#52525b",
        "#3f3f46",
      );
      break;
    case "press":
      drawPress(ctx, view, mint, col, row);
      break;
    case "pallet":
      block(ctx, view, mint, col, row, 22, "#a16207", "#ca8a04");
      break;
    case "desk":
      block(ctx, view, mint, col, row, 14, "#78716c", "#a8a29e");
      break;
    case "door":
    case "gate":
    case "window":
      drawWayIn(ctx, view, mint, col, row, kind);
      break;
    case "dig":
      drawHatch(ctx, view, mint, col, row);
      break;
    default:
      break;
  }
}

/** How high the wall on this square stands: the shell, or a partition. */
function wallHigh(col: number, row: number): number {
  const edge =
    col === 0 || row === 0 || col === PLAN_WIDE - 1 || row === PLAN_HIGH - 1;
  const outer =
    tileAt(col - 1, row) === "free" ||
    tileAt(col + 1, row) === "free" ||
    tileAt(col, row - 1) === "free" ||
    tileAt(col, row + 1) === "free";
  return edge || outer ? OUTER_HIGH : WALL_HIGH;
}

/**
 * One printing press.
 *
 * @remarks
 * A dark machine with a tray of paper on the near side, and a light that comes
 * on when somebody is running it. The light is the only thing in the room that
 * says which machines are earning - four presses and one man is a picture of a
 * job that is going too slowly, and it should read as one from the door.
 */
function drawPress(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  block(ctx, view, mint, col, row, 26, "#3f3f46", "#52525b");
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  const press = pressSpots().findIndex(
    (spot) => Math.abs(spot.x - (col + 0.5) * SLAB) < SLAB * 1.2,
  );
  const on = press >= 0 && running(mint, press);
  ctx.fillStyle = on ? "#4ade80" : "#7f1d1d";
  ctx.beginPath();
  ctx.arc(foot.x + SLAB / 2, foot.y - 22, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // The tray of fresh notes on the near side.
  ctx.fillStyle = on ? "#bbf7d0" : "#a8a29e";
  ctx.fillRect(foot.x + 8, foot.y - 6, SLAB - 16, 4);
}

/**
 * One of the three ways in, with what is piled against it.
 *
 * @remarks
 * Three states in one square, and the player has to be able to tell them apart
 * from the far end of the building: the door itself, the brown pile in front of
 * it that he built, and the red bar over it that is how far through they are.
 */
function drawWayIn(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
  kind: Tile,
): void {
  const gate = gateOn(mint, col, row);
  block(
    ctx,
    view,
    mint,
    col,
    row,
    kind === "window" ? 30 : OUTER_HIGH,
    "#7c2d12",
    "#9a3412",
  );
  if (gate !== null) {
    const foot = project(view, col * SLAB, (row + 1) * SLAB);
    const high = kind === "window" ? 30 : OUTER_HIGH;
    // What is piled against it grows up the face of the door.
    ctx.fillStyle = "#a16207";
    ctx.fillRect(
      foot.x + 4,
      foot.y - 6 - 20 * gate.barricade,
      SLAB - 8,
      20 * gate.barricade,
    );
    // And how far through they are runs across the top of it.
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(foot.x + 4, foot.y - high - 8, SLAB - 8, 5);
    ctx.fillStyle = gate.busy ? "#ef4444" : "#f59e0b";
    ctx.fillRect(foot.x + 4, foot.y - high - 8, (SLAB - 8) * gate.push, 5);
  }
}

/** Which of the three ways in stands on this square, if any. */
function gateOn(mint: MintState, col: number, row: number): Gate | null {
  return (
    mint.gates.find(
      (gate) =>
        Math.floor(gate.at.x / SLAB) === col &&
        Math.floor(gate.at.y / SLAB) === row,
    ) ?? null
  );
}

/**
 * The hatch in the cellar floor, and the hole it becomes.
 *
 * @remarks
 * Earth with a spade in it while they dig, and a black opening once it is
 * through. How far they have got is a ring round it rather than a number, so
 * that the man standing over it can see the job without looking away from it.
 */
function drawHatch(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  const at = project(view, (col + 0.5) * SLAB, (row + 0.5) * SLAB);
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(1, DEPTH);
  ctx.fillStyle = mint.tunnel >= 1 ? "#0c0a09" : "#44403c";
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * mint.tunnel);
  ctx.stroke();
  ctx.restore();
}

/**
 * A box on a square, see-through when the player is behind it.
 *
 * @remarks
 * The same trick the city plays with its houses and the jail with its walls: a
 * building seen from above is all walls, and a wall one cannot see past is a
 * wall one is lost behind.
 */
function block(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
  high: number,
  face: string,
  top: string,
): void {
  const left = col * SLAB;
  const foot = project(view, left, (row + 1) * SLAB);
  const back = project(view, left, row * SLAB, high);
  ctx.globalAlpha = hides(view, mint, col, row, high) ? SEE_THROUGH : 1;
  ctx.fillStyle = top;
  ctx.fillRect(back.x, back.y, SLAB + 1, foot.y - high - back.y + 1);
  ctx.fillStyle = face;
  ctx.fillRect(foot.x, foot.y - high, SLAB + 1, high);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(foot.x, foot.y - high, SLAB, high);
  ctx.globalAlpha = 1;
}

/** Whether this box would stand in front of something one has to see. */
function hides(
  view: View,
  mint: MintState,
  col: number,
  row: number,
  high: number,
): boolean {
  const mark = markOf(mint);
  const watched: readonly Vec[] =
    mark === null ? [mint.hero] : [mint.hero, mark];
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

/** The ring round whatever the job in hand is. */
function drawMark(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const mark = markOf(mint);
  if (mark !== null) {
    const beat = 1 + Math.sin(mint.time * 4) * 0.12;
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

/* --------------------------------------------------------------- the page */

/** The whole picture, dimmed, while the mains are off. */
function drawDark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(8,8,12,0.55)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * The bar along the bottom: what to do, what is in the bag, and the doors.
 *
 * @remarks
 * Drawn into the picture rather than left to the page around it, for the same
 * reason the escape is: in fullscreen there is no page, and while one is
 * running from a door to a hatch the eyes are on the canvas.
 */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  mint: MintState,
  width: number,
  height: number,
): void {
  const wide = Math.min(560, width - 40);
  const high = 76;
  const left = (width - wide) / 2;
  const top = height - high - 16;
  ctx.save();
  ctx.fillStyle = "rgba(12,10,9,0.8)";
  ctx.fillRect(left, top, wide, high);
  ctx.strokeStyle = "rgba(250,250,249,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, wide, high);
  ctx.fillStyle = "#fafaf9";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(taskLine(mint), left + 12, top + 16);
  // What the presses have run off, and how far the tunnel has got.
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.fillStyle = "#86efac";
  ctx.fillText(`${String(Math.round(mint.printed))} €`, left + 12, top + 40);
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "#fafaf9";
  ctx.fillText("Tunnel", left + 130, top + 40);
  ctx.fillStyle = "rgba(250,250,249,0.18)";
  ctx.fillRect(left + 178, top + 35, 120, 9);
  ctx.fillStyle = mint.tunnel >= 1 ? "#4ade80" : "#facc15";
  ctx.fillRect(left + 178, top + 35, 120 * Math.min(1, mint.tunnel), 9);
  // And one little bar per way in, so that a door being worked on is a thing
  // one sees from the far end of the cellar.
  mint.gates.forEach((gate, at) => {
    const x = left + 12 + at * 122;
    const y = top + 58;
    ctx.fillStyle = gate.busy ? "#fca5a5" : "rgba(250,250,249,0.7)";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillText(gateName(gate.kind), x, y);
    ctx.fillStyle = "rgba(250,250,249,0.18)";
    ctx.fillRect(x + 62, y - 4, 48, 8);
    ctx.fillStyle = "#a16207";
    ctx.fillRect(x + 62, y - 4, 48 * gate.barricade, 8);
    ctx.fillStyle = gate.busy ? "#ef4444" : "#f59e0b";
    ctx.fillRect(x + 62, y - 4, 48 * gate.push, 3);
  });
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
