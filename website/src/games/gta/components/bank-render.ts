/**
 * Drawing the inside of a bank: the counter, the clerks, the vault.
 *
 * @module
 * @remarks
 * The same bargain as everywhere else - this reads the state and paints, and
 * changes nothing - but **not** the same picture. A room is seen straight down:
 * {@link FLAT}, no tilt, no walls leaning towards the camera, every square as
 * square on screen as it is on the plan. That is what one wants of an inside -
 * the whole room at once, the counter as a line one is either in front of or
 * behind, and no wall standing in front of the man one is aiming at.
 *
 * The **people** keep their tilt. A figure is drawn from the crown down with a
 * body under it - see ./render - and flattening that leaves a coat on the
 * floor, so they are painted exactly as they are in the city and the room is
 * flattened around them. From above the room is a plan; the people on it are
 * still people.
 *
 * The floor is a fixed plan of squares, so the ground, the walls and the
 * furniture come out of one loop over it, north to south, with the people of
 * each row painted with it.
 *
 * Two things are drawn that are not furniture: the ring round whoever has not
 * got his hands up yet, and the bar along the bottom with the bag, the clock
 * and the alarm. A hold-up is won or lost on those three numbers, and a robber
 * who has to guess at them is a robber who is guessing.
 */
import {
  FLAT,
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
  vaultDoor,
  type Slot,
} from "@/games/gta/engine/bank";
import {
  SLAB,
  type BankState,
  type Clerk,
  type GameState,
  type Inmate,
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

/**
 * How far a piece of furniture is drawn inside its square.
 *
 * @remarks
 * A wall fills its square, because a wall *is* the square. Everything one could
 * walk round - a desk, a drawer - is drawn a little smaller than the ground it
 * stands on, which from above is the whole difference between a thing in a room
 * and a patch of a different colour.
 */
const INSET = 3;

/** What the line round a piece of furniture is drawn in. */
const OUTLINE = "rgba(0,0,0,0.35)";

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
    // Straight down on the room: see the note at the top of this module.
    const view: View = {
      ...cameraFor(bank.hero, width, height, zoom),
      squash: FLAT,
    };
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
  // A square square: nothing is squashed in here, so a slab is a slab.
  const deep = SLAB + 1;
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
      fill(ctx, view, col, row, "#57534e", 0);
      break;
    case "counter":
      // Wood, and darker than the tills behind it: from above the counter is
      // the line the room is divided by, so it has to be the strongest thing
      // on the floor.
      fill(ctx, view, col, row, "#92400e", 0);
      break;
    case "till":
      drawTill(ctx, view, bank, col, row);
      break;
    case "desk":
      // Darker than the ground it stands on. Painted in the colour of the
      // floor it was nothing but an outline: seen from above, a thing is only
      // a thing if it is a different colour from what it stands on.
      fill(ctx, view, col, row, "#78716c", INSET);
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
  fill(ctx, view, col, row, "#78716c", 0);
  const at = tillSpots().findIndex(
    (spot) => Math.abs(spot.x - (col + 0.5) * SLAB) < SLAB,
  );
  const done = at >= 0 && (bank.tills[at]?.open ?? false);
  const top = project(view, col * SLAB, row * SLAB);
  // The drawer, seen from above: shut and full, or pulled out and empty.
  ctx.fillStyle = "#57534e";
  ctx.fillRect(top.x + 4, top.y + 5, SLAB - 8, SLAB - 10);
  ctx.fillStyle = done ? "#1c1917" : "#22c55e";
  ctx.fillRect(top.x + 7, top.y + SLAB / 2 - 2, SLAB - 14, 4);
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
    fill(ctx, view, col, row, "#94a3b8", 0);
    // The doorway is two squares wide and has one wheel, not one each: it is
    // drawn on whichever of them the door itself is reckoned to be at.
    const hub = Math.abs((col + 0.5) * SLAB - vaultDoor().x) < SLAB / 2;
    if (hub) {
      wheel(ctx, view, col, row, bank.vault);
    }
  }
}

/**
 * The wheel on the vault door, and how far round it has come.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - the square it is drawn on
 * @param row - and the row
 * @param turned - how far the door is open, from nought to one
 */
function wheel(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
  turned: number,
): void {
  const top = project(view, col * SLAB, row * SLAB);
  const middle = { x: top.x + SLAB, y: top.y + SLAB / 2 };
  // A round wheel, not an oval one: there is nothing tilted in this room to
  // squash it.
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(middle.x, middle.y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(
    middle.x,
    middle.y,
    7,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * turned,
  );
  ctx.stroke();
}

/** The alarm button on the east wall: small, red, and worth everything. */
function drawButton(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  fill(ctx, view, col, row, "#57534e", 0);
  const top = project(view, col * SLAB, row * SLAB);
  ctx.fillStyle = bank.alarm ? "#facc15" : "#ef4444";
  ctx.beginPath();
  ctx.arc(top.x + SLAB / 2, top.y + SLAB / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * One square painted flat, with a line round it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - square across
 * @param row - square down
 * @param paint - what colour it is
 * @param inset - how far inside its square to keep, {@link INSET} or nought
 * @remarks
 * What used to stand here drew a box: a top, a face towards the camera, and a
 * rule for painting it half through while the player stood behind it. Seen
 * straight down there is no face to draw and nothing to be behind, so all that
 * is left is the square itself - and a room full of squares needs the line
 * round each of them, or a wall and the counter beside it become one shape.
 */
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
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 0.5, at.y + 0.5, side, side);
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
