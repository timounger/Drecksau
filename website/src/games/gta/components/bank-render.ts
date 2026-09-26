/**
 * Drawing the inside of a bank: the counter, the staff, the vault, the money.
 *
 * @module
 * @remarks
 * The same bargain as everywhere else - this reads the state and paints, and
 * changes nothing - and the same picture as the other rooms: seen **straight
 * down**, {@link FLAT}, no tilt, every square as square on screen as it is on
 * the plan. Only the people keep their tilt, because a figure flattened is a
 * coat on the floor.
 *
 * What is different about this room is that most of what one looks at is
 * **people**, and every one of them is in one of four states one has to be
 * able to read at a glance: loose, hands up, tied, or on the floor. That is
 * what the poses and the ring round the job in hand are for. The rest is the
 * furniture of a bank hall: a marble floor in long strips rather than square
 * tiles, a counter with three windows in it, a vault lined with boxes, and the
 * director's office on the other side.
 */
import {
  FLAT,
  cameraFor,
  project,
  seenArea,
  type View,
} from "@/games/gta/components/projection";
import {
  drawFigure,
  drawStatus,
  shadow,
  type Figure,
} from "@/games/gta/components/render";
import { drawActions } from "@/games/gta/components/gta-actions";
import {
  PLAN_HIGH,
  PLAN_WIDE,
  buttonSpot,
  leftInBank,
  markOf,
  slotAt,
  taskLine,
  tellerSpot,
  underTheGun,
  type Slot,
} from "@/games/gta/engine/bank";
import {
  FLASH_SECONDS,
  KEY_SHARE,
  SLAB,
  type BankFolk,
  type BankState,
  type GameState,
  type Inmate,
} from "@/games/gta/engine/types";
import { type WeaponKind } from "@/games/gta/engine/weapons";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how wide a marble strip is, how big a box door is,
   how far a pair of raised hands stands from a head. They are shapes and
   colours, not arithmetic. */

/** What each square of the plan is painted in. */
const GROUND: Readonly<Record<Slot, string>> = {
  wall: "#44403c",
  hall: "#d6d3d1",
  floor: "#cbc9c6",
  vaultFloor: "#71717a",
  office: "#7c5236",
  counter: "#a8a29e",
  teller: "#a8a29e",
  gate: "#cbc9c6",
  desk: "#7c5236",
  door: "#78716c",
  officeDoor: "#7c5236",
  vaultDoor: "#57534e",
  box: "#52525b",
  free: "#27272a",
};

/** What lies past the edge of the plan. */
const BEYOND = "#18181b";

/** How far a piece of furniture is drawn inside its square. */
const INSET = 3;

/** What the line round a piece of furniture is drawn in. */
const OUTLINE = "rgba(0,0,0,0.35)";

/** The robber: his own clothes, and a black balaclava over the lot. */
const ROBBER: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#4ade80",
  trousers: "#1e293b",
  skin: "#f2c9a0",
  hair: "#1c1917",
};

/** The three women behind the counter, one outfit each. */
const CLERKS: readonly Pick<Figure, "shirt" | "trousers" | "skin" | "hair">[] =
  [
    { shirt: "#f8fafc", trousers: "#1e293b", skin: "#f2c9a0", hair: "#3b1f0b" },
    { shirt: "#fbcfe8", trousers: "#334155", skin: "#e0ac69", hair: "#0f172a" },
    { shirt: "#bfdbfe", trousers: "#1e293b", skin: "#f7d7b5", hair: "#a16207" },
  ];

/** The director: a short wide man in a good suit. */
const BOSS: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#1e293b",
  trousers: "#0f172a",
  skin: "#e0ac69",
  hair: "#57534e",
};

/** And whoever happened to be in the bank this morning. */
const GUESTS: readonly Pick<Figure, "shirt" | "trousers" | "skin" | "hair">[] =
  [
    { shirt: "#0ea5e9", trousers: "#334155", skin: "#e0ac69", hair: "#1c1917" },
    { shirt: "#84cc16", trousers: "#1f2937", skin: "#f2c9a0", hair: "#78350f" },
    { shirt: "#a78bfa", trousers: "#111827", skin: "#c68642", hair: "#0f172a" },
  ];

/** How wide a person's shadow is. */
const FOOTPRINT = 4.6;

/** How much wider the director is drawn than everybody else. */
const BOSS_BUILD = 1.22;

/**
 * Paints one frame of the hold-up.
 *
 * @param ctx - what to paint on
 * @param state - the game, with a hold-up under way
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @param zoom - how close the camera stands, as everywhere else in the city
 * @remarks
 * **The camera is the city's**, over the robber's head and at whatever the
 * player has set. Fitting the whole bank into the picture instead was worth
 * trying and wrong: it made a room one walks around in look like a floor plan
 * one hovers over, and everybody in it the size of a coin. One sees as much of
 * the bank as one would see of a street, and the rest by walking.
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
    drawMoney(ctx, view, bank);
    drawRows(ctx, view, bank, state.player.weapon);
    drawFired(ctx, view, bank);
    drawAim(ctx, view, bank);
    ctx.restore();
    drawPanel(ctx, bank, width, height);
    // **The same corner panel as the street**, because in here what is in
    // one's hand decides whether a deposit box opens in a second, in six, or
    // not at all - and the wheel that changes it works in the vault too.
    drawStatus(ctx, state, width, false);
    drawActions(ctx, state, width, height);
  }
}

/* -------------------------------------------------------------- the floor */

/**
 * Every square in sight, painted flat - and then the strips over it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @remarks
 * **A floor in strips, not in squares.** A grid of square tiles reads as graph
 * paper, and graph paper is the one thing a room must not look like from
 * above: it flattens the whole picture into a plan of a building rather than a
 * place one is standing in. Real halls are laid in long strips, so the joints
 * run the length of the room and there are none across it - which, as a bonus,
 * is a line that points at the counter.
 *
 * Three floors, three grains: marble down the hall, boards across the office,
 * bare screed in the vault.
 */
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
  ctx.fillStyle = BEYOND;
  ctx.fillRect(0, 0, view.width, view.height);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const inside = col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH;
      const kind = slotAt(col, row);
      const at = project(view, col * SLAB, row * SLAB);
      ctx.fillStyle = inside ? GROUND[kind] : BEYOND;
      ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
      if (inside && kind === "vaultDoor" && bank.vault >= 1) {
        // Standing open: the doorway is a hole rather than a slab of steel.
        ctx.fillStyle = "#3f3f46";
        ctx.fillRect(at.x + 3, at.y, SLAB - 5, SLAB + 1);
      }
    }
  }
  grainOf(ctx, view, seen, "hall");
  grainOf(ctx, view, seen, "floor");
  grainOf(ctx, view, seen, "office");
  grainOf(ctx, view, seen, "vaultFloor");
}

/** Which way the strips of one floor run, and how wide they are. */
const GRAIN: Readonly<
  Partial<
    Record<
      Slot,
      { readonly wide: number; readonly down: boolean; readonly ink: string }
    >
  >
> = {
  // Marble, in strips as long as the hall and a square and a half wide.
  hall: { wide: SLAB * 1.5, down: true, ink: "rgba(0,0,0,0.13)" },
  floor: { wide: SLAB * 1.5, down: true, ink: "rgba(0,0,0,0.13)" },
  // Boards across the office, narrow, the way a floor is laid.
  office: { wide: SLAB * 0.5, down: false, ink: "rgba(0,0,0,0.22)" },
  // Screed, with the joints of the pour: wide, and only just there.
  vaultFloor: { wide: SLAB * 2, down: false, ink: "rgba(0,0,0,0.18)" },
};

/**
 * The joints of one sort of floor, drawn across the whole of it in one go.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param seen - the stretch of room the picture covers
 * @param kind - which floor this is
 * @remarks
 * Clipped to the squares that floor is laid on and then struck across in one
 * go, so a joint runs from wall to wall without a break. Drawn per square it
 * would be a grid again, which is exactly what this is here to avoid.
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
  kind: Slot,
): void {
  const grain = GRAIN[kind];
  if (grain === undefined) {
    return;
  }
  const patch = new Path2D();
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB));
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB));
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB));
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB));
  let any = false;
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      if (slotAt(col, row) === kind) {
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
  ctx.strokeStyle = grain.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (grain.down) {
    const first = Math.floor(seen.left / grain.wide) * grain.wide;
    for (let line = first; line <= seen.right; line += grain.wide) {
      const at = project(view, line, seen.top);
      const to = project(view, line, seen.bottom);
      ctx.moveTo(at.x + 0.5, at.y);
      ctx.lineTo(to.x + 0.5, to.y);
    }
  } else {
    const first = Math.floor(seen.top / grain.wide) * grain.wide;
    for (let line = first; line <= seen.bottom; line += grain.wide) {
      const at = project(view, seen.left, line);
      const to = project(view, seen.right, line);
      ctx.moveTo(at.x, at.y + 0.5);
      ctx.lineTo(to.x, to.y + 0.5);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------ what stands */

/** The rows of the plan, north to south, with the people standing in them. */
function drawRows(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  carried: WeaponKind,
): void {
  const seen = seenArea(view);
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB) - 1);
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB) + 1);
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB) - 1);
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB) + 1);
  const folk: readonly {
    readonly at: Inmate;
    readonly who: BankFolk | null;
  }[] = [
    ...bank.folk.map((one) => ({ at: one, who: one })),
    { at: bank.hero, who: null },
  ];
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      drawSquare(ctx, view, bank, col, row);
    }
    for (const one of folk) {
      if (Math.floor(one.at.y / SLAB) === row) {
        paintPerson(ctx, view, bank, one.at, one.who, carried);
      }
    }
  }
}

/** Whatever stands on one square: a wall, a counter, a box, a door. */
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
      fill(ctx, view, col, row, "#92400e", 0);
      break;
    case "teller":
      drawTeller(ctx, view, bank, col, row);
      break;
    case "desk":
      fill(ctx, view, col, row, "#5b3a21", INSET);
      break;
    case "box":
      drawBox(ctx, view, bank, col, row);
      break;
    case "vaultDoor":
      drawVault(ctx, view, bank, col, row);
      break;
    default:
      break;
  }
}

/**
 * One teller window: a gap in the counter with a screen over it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @param col - the square it stands on
 * @param row - and the row
 * @remarks
 * The window is where the two halves of the room meet, so it is drawn as what
 * it is: a slot through the wood with a tray in it and a glass screen standing
 * over the top. One of the three has the alarm button behind it, and that one
 * gets the little red square on the staff side - the only way to know which
 * woman to point the gun at first is to look.
 */
function drawTeller(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  fill(ctx, view, col, row, "#78350f", 0);
  const at = project(view, col * SLAB, row * SLAB);
  // The tray through the counter.
  ctx.fillStyle = "#292524";
  ctx.fillRect(at.x + 8, at.y + 12, SLAB - 16, SLAB - 24);
  // The glass over it, on the hall side where a screen actually stands.
  ctx.fillStyle = "rgba(191,219,254,0.5)";
  ctx.fillRect(at.x + 3, at.y + SLAB - 9, SLAB - 6, 5);
  ctx.strokeStyle = "rgba(15,23,42,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 3.5, at.y + SLAB - 8.5, SLAB - 7, 4);
  // And the button, on whichever window has it.
  const mine = tellerSpot(bank.button);
  if (Math.abs(mine.x - (col + 0.5) * SLAB) < 1) {
    const spot = buttonSpot(bank);
    const dot = project(view, spot.x, spot.y);
    ctx.fillStyle = bank.alarm ? "#facc15" : "#ef4444";
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

/**
 * One safe-deposit box in the wall of the vault.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @param col - the square it is set into
 * @param row - and the row
 * @remarks
 * Shut, it is a steel door with a hinge down one side and the **two** little
 * brass locks every safe-deposit box has, because the bank keeps one key and
 * the customer keeps the other. Broken open, the door hangs off it and what is
 * left is a black hole. The state is meant to read from across the room:
 * whoever is doing this against a clock needs to see at a glance which side of
 * the vault he has already been down.
 */
function drawBox(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  const box = bank.boxes.find((each) => each.col === col && each.row === row);
  fill(ctx, view, col, row, "#3f3f46", 0);
  if (box === undefined) {
    return;
  }
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.translate(at.x + SLAB / 2, at.y + SLAB / 2);
  // Turned so that local x points **into the room** - which is what makes the
  // two sizes below mean what their names say whichever wall the box is in.
  ctx.rotate(box.facing);
  // **Narrow along the wall**, because that is the axis one counts them on: a
  // deposit box is a letterbox in a wall of letterboxes, not a locker. The
  // other size is how far the door stands out of the wall, and that one may be
  // generous - it is the face one shoots at.
  const along = SLAB * 0.34;
  const deep = SLAB * 0.5;
  if (box.open) {
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-deep / 2, -along / 2, deep, along);
    // The door, hanging off its hinge and swung into the room.
    ctx.fillStyle = "#a1a1aa";
    ctx.save();
    ctx.translate(deep / 2, -along / 2);
    ctx.rotate(-0.9);
    ctx.fillRect(0, 0, deep * 0.9, 2.6);
    ctx.restore();
  } else {
    ctx.fillStyle = "#a1a1aa";
    ctx.fillRect(-deep / 2, -along / 2, deep, along);
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1.1;
    ctx.strokeRect(-deep / 2, -along / 2, deep, along);
    // The two brass locks side by side: the bank keeps one key, the customer
    // keeps the other.
    ctx.fillStyle = "#fcd34d";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(deep * 0.18, side * along * 0.24, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // The hinge, down the side that is still in the wall.
    ctx.fillStyle = "#52525b";
    ctx.fillRect(-deep / 2, -along / 2, 2.2, along);
    if (box.work > 0) {
      // How far it has been worked on: a bar across the face of the door.
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(-deep / 2, along / 2 - 2.4, deep * box.work, 2.4);
    }
  }
  ctx.restore();
}

/**
 * The vault door: a slab of steel with a wheel and a lock on it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @param col - the square it stands on
 * @param row - and the row
 * @remarks
 * **The wheel turns because somebody is turning it.** The director's progress
 * through the ritual is the angle of it: nothing while he walks over, the key
 * in the lock for the first third - see {@link KEY_SHARE} - and after that two
 * and a half turns of the wheel, which is the part one can watch from across
 * the room. That is the whole reason the door is not a key press: a bar
 * filling up says a job is being done, a wheel going round says *who* is doing
 * it and how much of it is left.
 */
function drawVault(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  col: number,
  row: number,
): void {
  if (bank.vault >= 1) {
    return;
  }
  fill(ctx, view, col, row, "#94a3b8", 0);
  // **The doorway is two squares wide and has one wheel**, not one each - and
  // it is drawn on the *second* of them, not the first. The squares are
  // painted in order across the row, so a wheel drawn on the left square had
  // the right one laid over the top of it: a wheel with a quarter missing.
  if (slotAt(col - 1, row) !== "vaultDoor") {
    return;
  }
  const boss = bank.folk.find((one) => one.role === "boss");
  const done = boss?.opens ?? 0;
  const at = project(view, col * SLAB, row * SLAB);
  const middle = { x: at.x, y: at.y + SLAB / 2 };

  // The lock plate, on the hall side of the door where a man can reach it.
  const lock = { x: middle.x + SLAB * 0.62, y: middle.y + SLAB * 0.3 };
  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.arc(lock.x, lock.y, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(lock.x - 0.6, lock.y - 2.4, 1.2, 4.8);

  if (done > 0 && done < KEY_SHARE) {
    // The key, in the lock and turning: a shaft with a bow on the end of it.
    const turn = (done / KEY_SHARE) * (Math.PI / 2);
    ctx.save();
    ctx.translate(lock.x, lock.y);
    ctx.rotate(turn);
    ctx.strokeStyle = "#fcd34d";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 8.6, 2.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // The wheel, and how far round it has come.
  const spun =
    done <= KEY_SHARE
      ? 0
      : ((done - KEY_SHARE) / (1 - KEY_SHARE)) * Math.PI * 5;
  ctx.save();
  ctx.translate(middle.x, middle.y);
  ctx.rotate(spun);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  for (let spoke = 0; spoke < 5; spoke += 1) {
    const round = (spoke * Math.PI * 2) / 5;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(round) * 10, Math.sin(round) * 10);
  }
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * One square painted flat.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param col - square across
 * @param row - and down
 * @param paint - what colour it is
 * @param inset - how far inside its square to keep, or nought to fill it
 * @remarks
 * **No line round it unless it is a thing.** Every square of this room used to
 * be outlined, and a wall drawn that way is not a wall - it is a row of
 * blocks, and the whole room reads as the graph paper it is laid out on. A
 * wall, a counter, a floor: those run into their neighbours without a seam. A
 * desk or a deposit box is a *thing standing in a room*, so it keeps its line
 * and its inset - which is now the only thing a line means in here.
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
  if (inset > 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x + 0.5, at.y + 0.5, side, side);
  }
}

/* ------------------------------------------------------------- the people */

/**
 * One person: their shadow, and whatever they are doing about the robbery.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @param at - where this one is standing
 * @param who - which of the people, or null for the player
 * @remarks
 * **Four poses, and they have to be told apart at a glance.** Loose is an
 * ordinary figure; hands up is the same figure with a pair of hands over the
 * head; tied is sitting on the floor with a rope across the wrists; dead is
 * flat on the boards. Nothing else in this room matters as much as being able
 * to count, from the door of the vault, how many people behind you can still
 * walk to a button.
 */
function paintPerson(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
  at: Inmate,
  who: BankFolk | null,
  carried: WeaponKind,
): void {
  if (who !== null && who.mood === "dead") {
    lyingDown(ctx, view, who);
    return;
  }
  const worn = dressOf(who);
  const still = who !== null && who.mood !== "loose";
  const look: Figure = {
    ...worn,
    facing: at.heading,
    heading: at.heading,
    walked: at.walked,
    // The little worlds keep no speed for anybody, so their figures get the
    // still pose: no lean, no sway. It is a room, not a street.
    pace: 0,
    time: bank.time,
    arms: who === null || still ? "hold" : "swing",
    hand: "right",
    style: who === null ? "hooded" : who.role === "boss" ? "posh" : "plain",
    // What is in the hand is what the wheel is on: the same corner panel is
    // drawn over this picture, and the two must not disagree.
    holds: who === null ? carried : undefined,
    sits: who !== null && who.mood === "tied",
  };
  shadow(ctx, view, at, FOOTPRINT, FOOTPRINT * 0.8, 0, 0.55);
  // The director is drawn a fifth wider than everybody else: short, round and
  // in a good suit is the whole of what one has to recognise him by.
  const build = who !== null && who.role === "boss" ? BOSS_BUILD : 1;
  const spot = project(view, at.x, at.y);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.scale(build, build);
  ctx.translate(-spot.x, -spot.y);
  drawFigure(ctx, view, at, look, 1);
  ctx.restore();
  if (who !== null && who.mood === "tied") {
    ropeOn(ctx, view, at);
  } else if (who !== null && who.mood === "held") {
    handsUp(ctx, view, at);
  }
}

/** What this one is wearing. */
function dressOf(
  who: BankFolk | null,
): Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> {
  let worn: Pick<Figure, "shirt" | "trousers" | "skin" | "hair">;
  if (who === null) {
    worn = ROBBER;
  } else if (who.role === "boss") {
    worn = BOSS;
  } else if (who.role === "clerk") {
    worn = CLERKS[who.look % CLERKS.length] ?? CLERKS[0];
  } else {
    worn = GUESTS[who.look % GUESTS.length] ?? GUESTS[0];
  }
  return worn;
}

/** Two hands over a head, so that hands up reads as hands up from above. */
function handsUp(ctx: CanvasRenderingContext2D, view: View, at: Inmate): void {
  const spot = project(view, at.x, at.y, 15);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.rotate(at.heading);
  ctx.fillStyle = "#f2c9a0";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 0.8;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(-1, side * 4.2, 1.9, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** The rope across a pair of tied wrists. */
function ropeOn(ctx: CanvasRenderingContext2D, view: View, at: Inmate): void {
  const spot = project(view, at.x, at.y, 9);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.rotate(at.heading);
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3.6, -3.2);
  ctx.lineTo(-3.6, 3.2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Somebody on the floor.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param who - which of them it was
 * @remarks
 * Not the standing figure lying down - there is no such pose - but the shape
 * one actually sees from above: a body along the floor with the head at one
 * end of it and a stain under the lot. Drawn flat on the ground rather than at
 * a person's height, which is what makes it read as *down* from across the
 * room.
 */
function lyingDown(
  ctx: CanvasRenderingContext2D,
  view: View,
  who: BankFolk,
): void {
  const worn = dressOf(who);
  const spot = project(view, who.x, who.y);
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.rotate(who.heading);
  ctx.fillStyle = "rgba(127,29,29,0.5)";
  ctx.beginPath();
  ctx.ellipse(-1, 0, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = worn.trousers;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(-7.5, 0, 4.4, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = worn.shirt;
  ctx.beginPath();
  ctx.ellipse(-1, 0, 7, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = worn.hair;
  ctx.beginPath();
  ctx.ellipse(6.4, 0, 2.6, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/* ---------------------------------------------------------------- the gun */

/**
 * The shot that has just been fired, for the moment it is in the air.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @remarks
 * There is no list of rounds in here and there does not need to be: the bank
 * already remembers **when** the last one left the barrel, and where it went
 * is where the gun was pointing. A line and a flash for a twentieth of a
 * second is the whole of it - and without them a clerk simply falls over.
 */
function drawFired(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
): void {
  if (bank.time - bank.shotAt > FLASH_SECONDS) {
    return;
  }
  // From the muzzle, not from the middle of him: see the same note in
  // ./mint-render.
  const turn = Math.atan2(bank.aim.y - bank.hero.y, bank.aim.x - bank.hero.x);
  const from = project(
    view,
    bank.hero.x + Math.cos(turn) * MUZZLE,
    bank.hero.y + Math.sin(turn) * MUZZLE,
  );
  const to = project(view, bank.aim.x, bank.aim.y);
  ctx.save();
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(from.x, from.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** How far in front of somebody the end of their barrel is, in pixels. */
const MUZZLE = 15;

/**
 * The crosshair, and the ring round whoever is under it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @remarks
 * The whole opening of the job is *where the gun is pointing*, so it is drawn:
 * a thin cross where the mouse is, a dashed line from the hand to it, and a
 * ring round the person it has found, filling as her hands go up. Without the
 * ring one cannot tell whether one is covering the woman at the button or the
 * wall beside her, and that is the difference between a quiet bank and a
 * siren.
 */
function drawAim(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
): void {
  const under = underTheGun(bank);
  const aim = project(view, bank.aim.x, bank.aim.y);
  const hand = project(view, bank.hero.x, bank.hero.y);
  ctx.save();
  ctx.strokeStyle = "rgba(248,250,252,0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(aim.x, aim.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = under === null ? "rgba(248,250,252,0.7)" : "#f87171";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(aim.x, aim.y, 5, 0, Math.PI * 2);
  for (const arm of [
    { x: -9, y: 0, to: { x: -2, y: 0 } },
    { x: 9, y: 0, to: { x: 2, y: 0 } },
    { x: 0, y: -9, to: { x: 0, y: -2 } },
    { x: 0, y: 9, to: { x: 0, y: 2 } },
  ]) {
    ctx.moveTo(aim.x + arm.x, aim.y + arm.y);
    ctx.lineTo(aim.x + arm.to.x, aim.y + arm.to.y);
  }
  ctx.stroke();
  if (under !== null) {
    const spot = project(view, under.x, under.y);
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(
      spot.x,
      spot.y,
      13,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, under.work),
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * What has been tipped out of the boxes and not picked up yet.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param bank - the bank as it stands
 * @remarks
 * **The same two notes and a coin the street drops**, because it is the same
 * thing: money lying on the ground that goes into the pocket of whoever walks
 * over it. A bank robbery that paid out into a counter would be a different
 * game - one would never have to leave the vault.
 */
function drawMoney(
  ctx: CanvasRenderingContext2D,
  view: View,
  bank: BankState,
): void {
  for (const drop of bank.loot) {
    const at = project(view, drop.x, drop.y);
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.restore();
  }
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
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * beat, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* --------------------------------------------------------------- the page */

/**
 * The bar along the bottom: the bag, the room and the button.
 *
 * @remarks
 * Drawn into the picture for the same reason the others are: in fullscreen
 * there is no page. Four numbers, and the fourth one only exists once somebody
 * has rung - **a bank nobody has reported has no clock on it**, and the bar
 * says so in as many words, because that is the rule the whole job is played
 * against.
 */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  bank: BankState,
  width: number,
  height: number,
): void {
  const wide = Math.min(620, width - 40);
  const high = 68;
  const left = (width - wide) / 2;
  const top = height - high - 56;
  const ticking = leftInBank(bank);
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
  // **And not a word about what is left.** A number counting down the boxes
  // would turn the vault into a shopping list: one would work until it read
  // nought and leave. Nobody robbing a bank knows what is in the next door
  // along, and that not knowing is the whole of the decision about when to
  // stop.
  // The clock, and only when there is one.
  ctx.textAlign = "right";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillStyle = ticking === null ? "#bbf7d0" : "#fca5a5";
  ctx.fillText(
    ticking === null ? "keine Uhr" : `${String(Math.ceil(ticking))} s`,
    left + wide - 12,
    top + 42,
  );
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = bank.alarm ? "#fca5a5" : "#bbf7d0";
  ctx.fillText(
    bank.alarm ? "Stiller Alarm ist raus" : "Noch hat keiner gedrückt",
    left + wide - 12,
    top + 16,
  );
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
