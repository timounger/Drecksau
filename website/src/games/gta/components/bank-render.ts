/**
 * Drawing the inside of a bank: the counter, the clerks, the vault.
 *
 * @module
 * @remarks
 * The same tilted picture as the city, the jail and the printing works, and the
 * same bargain: this reads the state and paints, and changes nothing. The floor
 * is a fixed plan of squares, so the ground, the walls and the furniture come
 * out of one loop over it, north to south, with the people of each row painted
 * with it.
 *
 * Two things are drawn that are not furniture: the ring round whoever has not
 * got his hands up yet, and the bar along the bottom with the bag, the clock
 * and the alarm. A hold-up is won or lost on those three numbers, and a robber
 * who has to guess at them is a robber who is guessing.
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
import { drawActions } from "@/games/gta/components/gta-actions";
import {
  PLAN_HIGH,
  PLAN_WIDE,
  inTheHouse,
  leftInBank,
  markOf,
  taskLine,
  slotAt,
  tillSpots,
  type Slot,
} from "@/games/gta/engine/bank";
import {
  SLAB,
  type BankState,
  type Clerk,
  type GameState,
  type Inmate,
  type Vec,
} from "@/games/gta/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how high a counter stands, how wide a till is, how
   dark the vault is. They are shapes and colours, not arithmetic. */

/** What each square of the plan is painted in. */
const GROUND: Readonly<Record<Slot, string>> = {
  wall: "#44403c",
  hall: "#d6d3d1",
  floor: "#a8a29e",
  counter: "#a8a29e",
  gate: "#a8a29e",
  till: "#a8a29e",
  desk: "#a8a29e",
  door: "#78716c",
  vaultDoor: "#57534e",
  vault: "#3f3f46",
  alarm: "#44403c",
  free: "#27272a",
};

/** What lies past the edge of the plan. */
const BEYOND = "#18181b";

/** How high the outer walls stand, in screen pixels. */
const WALL_HIGH = 46;

/** And a counter, which one can see over. */
const COUNTER_HIGH = 16;

/** How solid a wall is painted while the player stands behind it. */
const SEE_THROUGH = 0.3;

/** How wide a person's shadow is. */
const FOOTPRINT = 4.6;

/** The robber: his own clothes, and a black balaclava over the lot. */
const ROBBER: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#4ade80",
  trousers: "#1e293b",
  skin: "#f2c9a0",
  hair: "#1c1917",
};

/** And the people who work here. */
const CLERK: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#e2e8f0",
  trousers: "#334155",
  skin: "#e0ac69",
  hair: "#3f3f46",
};

/**
 * Paints one frame of the hold-up.
 *
 * @param ctx - what to paint on
 * @param state - the game, with a hold-up under way
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @param zoom - how close the camera stands
 */
export function drawBank(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  zoom: number,
): void {
  const bank = state.bank;
  if (bank !== null) {
    const view = cameraFor(bank.hero, width, height, zoom);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-view.width / 2, -view.height / 2);
    drawFloor(ctx, view, bank);
    drawMark(ctx, view, bank);
    drawRows(ctx, view, bank);
    ctx.restore();
    drawPanel(ctx, bank, width, height);
    drawActions(ctx, state, width, height);
  }
}

/* -------------------------------------------------------------- the floor */

/** Every square in sight, painted flat. */
function drawFloor(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
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
      const kind = slotAt(col, row);
      const at = project(view, col * SLAB, row * SLAB);
      ctx.fillStyle = inside ? GROUND[kind] : BEYOND;
      ctx.fillRect(at.x, at.y, SLAB + 1, deep);
      if (inside && (kind === "hall" || kind === "floor")) {
        // The marble floor of a banking hall: the join between the slabs is
        // what says "bank" rather than "shop".
        ctx.strokeStyle = "rgba(0,0,0,0.10)";
        ctx.lineWidth = 1;
        ctx.strokeRect(at.x, at.y, SLAB, deep - 1);
      }
      if (inside && kind === "vaultDoor" && bank.vault >= 1) {
        // Standing open: the doorway is a hole rather than a slab of steel.
        ctx.fillStyle = "#27272a";
        ctx.fillRect(at.x + 4, at.y, SLAB - 7, deep);
      }
    }
  }
}

/* ------------------------------------------------------------ what stands */

/** One person in the bank, and which sort. */
type Folk = {
  readonly at: Inmate;
  readonly kind: "hero" | "clerk" | "held";
};

/** Everybody in the room. */
function everybody(bank: BankState): readonly Folk[] {
  return [
    ...bank.staff.map((one: Clerk) => ({
      at: one,
      kind: one.held ? ("held" as const) : ("clerk" as const),
    })),
    { at: bank.hero, kind: "hero" as const },
  ];
}

/** The rows of the plan, north to south, with the people standing in them. */
function drawRows(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
): void {
  const seen = seenArea(view);
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB) - 1);
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB) + 1);
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB) - 1);
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB) + 1);
  const folk = everybody(bank);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      drawSquare(ctx, view, bank, col, row);
    }
    for (const one of folk) {
      if (Math.floor(one.at.y / SLAB) === row) {
        paintPerson(ctx, view, one);
      }
    }
  }
}

/** One person: their shadow, and the three sprites over it. */
function paintPerson(
  ctx: CanvasRenderingContext2D,
  view: View,
  who: Folk,
): void {
  const hero = who.kind === "hero";
  const worn = hero ? ROBBER : CLERK;
  const look: Figure = {
    ...worn,
    facing: who.at.heading,
    heading: who.at.heading,
    walked: who.at.walked,
    // The little worlds keep no speed for anybody, so their figures get the
    // still pose: no lean, no sway. It is a room, not a street.
    pace: 0,
    time: 0,
    // Hands up for anybody who has given in; the man with the gun holds it out.
    arms: who.kind === "held" ? "hold" : hero ? "hold" : "swing",
    hand: "right",
    style: hero ? "hooded" : "plain",
    holds: hero ? "pistol" : undefined,
  };
  shadow(ctx, view, who.at, FOOTPRINT, FOOTPRINT * 0.8, 0, 0.55);
  drawFigure(ctx, view, who.at, look, 1);
}

/** Whatever stands on one square: a wall, a counter, a till, a door. */
function drawSquare(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  const kind = slotAt(col, row);
  switch (kind) {
    case "wall":
      block(ctx, view, bank, col, row, WALL_HIGH, "#57534e", "#44403c");
      break;
    case "counter":
      block(ctx, view, bank, col, row, COUNTER_HIGH, "#92400e", "#b45309");
      break;
    case "till":
      drawTill(ctx, view, bank, col, row);
      break;
    case "desk":
      block(ctx, view, bank, col, row, 13, "#78716c", "#a8a29e");
      break;
    case "vaultDoor":
      drawVault(ctx, view, bank, col, row);
      break;
    case "alarm":
      drawButton(ctx, view, bank, col, row);
      break;
    default:
      break;
  }
}

/** One till on the counter: a drawer, open or shut. */
function drawTill(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  block(ctx, view, bank, col, row, 20, "#57534e", "#78716c");
  const at = tillSpots().findIndex(
    (spot) => Math.abs(spot.x - (col + 0.5) * SLAB) < SLAB,
  );
  const done = at >= 0 && (bank.tills[at]?.open ?? false);
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  ctx.fillStyle = done ? "#1c1917" : "#22c55e";
  ctx.fillRect(foot.x + 8, foot.y - 18, SLAB - 16, 4);
}

/** The vault door: a slab of steel with a wheel on it, or a way in. */
function drawVault(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  const shut = bank.vault < 1;
  if (shut) {
    block(ctx, view, bank, col, row, 40, "#94a3b8", "#cbd5e1");
    const foot = project(view, col * SLAB, (row + 1) * SLAB);
    // The wheel, and how far round it has come.
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(foot.x + SLAB / 2, foot.y - 22, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(
      foot.x + SLAB / 2,
      foot.y - 22,
      7,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * bank.vault,
    );
    ctx.stroke();
  }
}

/** The alarm button on the east wall: small, red, and worth everything. */
function drawButton(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  block(ctx, view, bank, col, row, WALL_HIGH, "#57534e", "#44403c");
  const foot = project(view, col * SLAB, (row + 1) * SLAB);
  ctx.fillStyle = bank.alarm ? "#facc15" : "#ef4444";
  ctx.beginPath();
  ctx.arc(foot.x + SLAB / 2, foot.y - WALL_HIGH / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** A box on a square, see-through when the player is behind it. */
function block(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
  high: number,
  face: string,
  top: string,
): void {
  const left = col * SLAB;
  const foot = project(view, left, (row + 1) * SLAB);
  const back = project(view, left, row * SLAB, high);
  ctx.globalAlpha = hides(view, bank, col, row, high) ? SEE_THROUGH : 1;
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
  bank: BankState,
  col: number,
  row: number,
  high: number,
): boolean {
  const mark = markOf(bank);
  const watched: readonly Vec[] =
    mark === null ? [bank.hero] : [bank.hero, mark];
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
  bank: BankState,
): void {
  const mark = markOf(bank);
  if (mark !== null) {
    const beat = 1 + Math.sin(bank.time * 4) * 0.12;
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

/**
 * The bar along the bottom: the bag, the clock and the button.
 *
 * @remarks
 * Drawn into the picture for the same reason the others are: in fullscreen
 * there is no page, and the only three things a robber needs to know are how
 * much he has, how long he has and whether anybody rang.
 */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  bank: BankState,
  width: number,
  height: number,
): void {
  const wide = Math.min(560, width - 40);
  const high = 68;
  const left = (width - wide) / 2;
  const top = height - high - 56;
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
  ctx.fillText(taskLine(bank), left + 12, top + 16);
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.fillStyle = "#86efac";
  ctx.fillText(`${String(Math.round(bank.taken))} €`, left + 12, top + 42);
  // What is left in the room, so that leaving early is a decision.
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "#d6d3d1";
  ctx.fillText(
    `von ${String(inTheHouse(bank))} € im Haus`,
    left + 110,
    top + 42,
  );
  // The clock, and the alarm.
  ctx.textAlign = "right";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillStyle = bank.alarm ? "#fca5a5" : "#fef3c7";
  ctx.fillText(
    `${String(Math.ceil(leftInBank(bank)))} s`,
    left + wide - 12,
    top + 42,
  );
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = bank.alarm ? "#fca5a5" : "#bbf7d0";
  ctx.fillText(
    bank.alarm ? "Stiller Alarm ist raus" : "Noch ist es ruhig",
    left + wide - 12,
    top + 16,
  );
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
