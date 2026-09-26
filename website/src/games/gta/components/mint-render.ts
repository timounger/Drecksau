/**
 * Drawing the printing works: the hall, the presses, the siege outside.
 *
 * @module
 * @remarks
 * **Flat, straight down on the building**, like the bank and the jail: the
 * camera squashes nothing ({@link FLAT}) and nothing has a height. A works
 * hall seen at a tilt is a row of grey boxes with their backs to one another,
 * and the whole of this job is knowing at a glance which machine is running,
 * which door is being pushed and where one's own men are standing.
 *
 * **And the street is drawn too.** Half of this job happens outside: they come
 * up the road, block it, put men behind their cars, pitch a tent across it and
 * in the end drive a tank up to the front of the building. A siege one only
 * learns about from a bar under the picture is a bar, not a siege - so the
 * plan covers the road all the way round and everything on it is painted.
 *
 * The same bargain as everywhere else: everything here reads the state and
 * paints, nothing here changes it.
 */
import {
  FLAT,
  cameraFor,
  project,
  seenArea,
  type View,
} from "@/games/gta/components/projection";
import { drawActions } from "@/games/gta/components/gta-actions";
import {
  drawFigure,
  drawShot,
  drawStatus,
  lyingDown,
  shadow,
  type Figure,
} from "@/games/gta/components/render";
import {
  PLAN_HIGH,
  PLAN_WIDE,
  foodSpot,
  gateName,
  lit,
  markOf,
  phoneSpot,
  postSpots,
  pressSpots,
  ready,
  running,
  taskLine,
  tileAt,
  underTheGun,
  waiting,
} from "@/games/gta/engine/mint";
import { type WeaponKind } from "@/games/gta/engine/weapons";
import {
  SLAB,
  type GameState,
  type Gate,
  type Inmate,
  type MintState,
  type Tile,
} from "@/games/gta/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how deep the paper trays of a press are, how wide
   a pallet of notes is, how dark the cellar is. They are shapes and colours,
   not arithmetic. */

/** What each square of the plan is painted in. */
const GROUND: Readonly<Record<Tile, string>> = {
  wall: "#3f3f46",
  // The office hall at the front: a pale floor that has been polished.
  hall: "#a8a6a1",
  // And the shop floor: bare concrete, darker and older.
  works: "#8b8983",
  press: "#8b8983",
  pallet: "#8b8983",
  desk: "#a8a6a1",
  // The director's office: carpet, because he is the director.
  office: "#6b5344",
  phone: "#6b5344",
  // The strongroom: bare screed and steel.
  vault: "#7a7570",
  vaultDoor: "#52525b",
  door: "#3f3f46",
  shutter: "#3f3f46",
  gate: "#3f3f46",
  window: "#3f3f46",
  cellar: "#6b6560",
  dig: "#4a4038",
  tunnel: "#3b2f28",
  out: "#3b2f28",
  // Outside: the road round the building and the pavement along the front.
  street: "#35353b",
  kerb: "#5f5f66",
  tent: "#1e3a8a",
  free: "#27272a",
};

/** What lies past the edge of the plan, where there is no building at all. */
const BEYOND = "#18181b";

/** How far inside its square a piece of furniture stands. */
const INSET = 3;

/** The line round everything that stands on the floor. */
const OUTLINE = "rgba(0,0,0,0.38)";

/** How wide a person's shadow is. */
const FOOTPRINT = 4.6;

/** The red overall and the mask: what everybody who came in is wearing. */
const OVERALL: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#dc2626",
  trousers: "#7f1d1d",
  skin: "#f2c9a0",
  hair: "#1c1917",
};

/** And what the people who work here have on. */
const CLERK: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#e2e8f0",
  trousers: "#1e293b",
  skin: "#e0ac69",
  hair: "#44403c",
};

/** The director, who is the only man in the building in a suit. */
const BOSS: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#1f2937",
  trousers: "#111827",
  skin: "#f2c9a0",
  hair: "#d6d3d1",
};

/** And the men outside. */
const UNIFORM: Pick<Figure, "shirt" | "trousers" | "skin" | "hair"> = {
  shirt: "#1e3a8a",
  trousers: "#111827",
  skin: "#f2c9a0",
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
    // Straight down on the building: see the note at the top of this module.
    const view: View = {
      ...cameraFor(mint.hero, width, height, zoom),
      squash: FLAT,
    };
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-view.width / 2, -view.height / 2);
    drawFloor(ctx, view, mint);
    drawFittings(ctx, view, mint);
    drawOutside(ctx, view, mint);
    drawMark(ctx, view, mint);
    drawRows(ctx, view, mint, state.player.weapon);
    drawShots(ctx, view, mint);
    drawAim(ctx, view, mint);
    ctx.restore();
    if (!lit(mint)) {
      drawDark(ctx, width, height);
    }
    drawPanel(ctx, mint, width, height);
    // **The same corner panel as the street**, because what is in one's hand
    // decides whether the thing at the door is a problem or a target.
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
 * @param mint - the works as they stand
 */
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
  ctx.fillStyle = BEYOND;
  ctx.fillRect(0, 0, view.width, view.height);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const inside = col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH;
      const kind = tileAt(col, row);
      const at = project(view, col * SLAB, row * SLAB);
      ctx.fillStyle = inside ? GROUND[kind] : BEYOND;
      ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
      if (inside && kind === "tunnel") {
        drawTunnel(ctx, view, mint, col, row);
      }
      if (inside && kind === "out") {
        // Daylight at the far end of it, which is the whole point of digging.
        ctx.fillStyle = mint.tunnel >= 1 ? "#cbd5e1" : "#1c1917";
        ctx.fillRect(at.x + 6, at.y + 6, SLAB - 12, SLAB - 12);
      }
    }
  }
  grainOf(ctx, view, seen, "hall");
  grainOf(ctx, view, seen, "works");
  grainOf(ctx, view, seen, "cellar");
  roadLines(ctx, view, seen);
  bayLines(ctx, view, seen);
}

/** Which way the strips of one floor run, and how wide they are. */
const GRAIN: Readonly<
  Partial<
    Record<
      Tile,
      { readonly wide: number; readonly down: boolean; readonly ink: string }
    >
  >
> = {
  // Boards down the hall, from the door towards the works.
  hall: { wide: SLAB * 1.2, down: true, ink: "rgba(0,0,0,0.15)" },
  // The pour of the shop floor: wide bays, joints across the hall.
  works: { wide: SLAB * 2, down: false, ink: "rgba(0,0,0,0.2)" },
  // Screed in the cellar, poured the other way.
  cellar: { wide: SLAB * 2.5, down: true, ink: "rgba(0,0,0,0.25)" },
};

/** The stretch of building one picture covers. */
type Patch = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

/**
 * The joints of one sort of floor, drawn across the whole of it in one go.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param seen - the stretch of building the picture covers
 * @param kind - which floor this is
 * @remarks
 * Clipped to the squares that floor is laid on and then struck across in one
 * go, so a joint runs from wall to wall without a break. Drawn per square it
 * would be a grid again, which is exactly what this is here to avoid.
 */
function grainOf(
  ctx: CanvasRenderingContext2D,
  view: View,
  seen: Patch,
  kind: Tile,
): void {
  const grain = GRAIN[kind];
  if (grain === undefined) {
    return;
  }
  const patch = patchOf(view, seen, (one) => one === kind);
  if (patch === null) {
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

/**
 * The squares one sort of floor covers, as one shape to clip to.
 *
 * @param view - where the camera is
 * @param seen - the stretch of building the picture covers
 * @param want - which tiles belong to it
 * @returns the shape, or null where none of them are in sight
 */
function patchOf(
  view: View,
  seen: Patch,
  want: (kind: Tile) => boolean,
): Path2D | null {
  const patch = new Path2D();
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB));
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB));
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB));
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB));
  let any = false;
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      if (want(tileAt(col, row))) {
        const at = project(view, col * SLAB, row * SLAB);
        patch.rect(at.x, at.y, SLAB + 1, SLAB + 1);
        any = true;
      }
    }
  }
  return any ? patch : null;
}

/**
 * The white line down the middle of the road outside.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param seen - the stretch of building the picture covers
 */
function roadLines(
  ctx: CanvasRenderingContext2D,
  view: View,
  seen: Patch,
): void {
  const patch = patchOf(view, seen, (kind) => kind === "street");
  if (patch === null) {
    return;
  }
  ctx.save();
  ctx.clip(patch);
  ctx.strokeStyle = "rgba(226,232,240,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  for (const run of [20.5, 1.5]) {
    const from = project(view, seen.left, run * SLAB);
    const to = project(view, seen.right, run * SLAB);
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * The yellow bay painted round the machines.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param seen - the stretch of building the picture covers
 */
function bayLines(
  ctx: CanvasRenderingContext2D,
  view: View,
  seen: Patch,
): void {
  const patch = patchOf(view, seen, (kind) => kind === "works");
  if (patch === null) {
    return;
  }
  ctx.save();
  ctx.clip(patch);
  ctx.strokeStyle = "rgba(250,204,21,0.5)";
  ctx.lineWidth = 3;
  for (const spot of pressSpots()) {
    const at = project(view, spot.x - SLAB * 2, spot.y - SLAB * 1.8);
    const to = project(view, spot.x + SLAB * 2, spot.y + SLAB * 0.6);
    ctx.strokeRect(at.x, at.y, to.x - at.x, to.y - at.y);
  }
  ctx.restore();
}

/**
 * The tunnel: earth, and the timbers holding it up.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @param col - the square it is in
 * @param row - and the row
 */
function drawTunnel(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const through = mint.tunnel >= 1;
  ctx.save();
  ctx.fillStyle = through ? "#1c1917" : "#2a221c";
  ctx.fillRect(at.x + 7, at.y, SLAB - 14, SLAB + 1);
  ctx.fillStyle = "#6b4f32";
  ctx.fillRect(at.x + 5, at.y + 4, 3, SLAB - 8);
  ctx.fillRect(at.x + SLAB - 8, at.y + 4, 3, SLAB - 8);
  ctx.fillStyle = "rgba(107,79,50,0.75)";
  ctx.fillRect(at.x + 5, at.y + SLAB / 2 - 2, SLAB - 10, 3);
  ctx.restore();
}

/* ------------------------------------------------------------ the fittings */

/**
 * Everything that stands about in the building without being on the plan.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @remarks
 * **A hall with nothing in it is a floor.** The plan has room for the things
 * one uses and nothing for the things one walks past, which is most of what a
 * working building is made of: drums of ink against the wall, reels of paper,
 * a fork-lift by the loading gate, pillars in the cellar, the name of the
 * place across the floor of the entrance hall. None of it is solid.
 */
function drawFittings(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  drawHallKit(ctx, view);
  drawWorksKit(ctx, view);
  drawCellarKit(ctx, view);
  drawOffice(ctx, view, mint);
  drawVault(ctx, view);
}

/** The entrance hall: the name across the floor and a mat inside the door. */
function drawHallKit(ctx: CanvasRenderingContext2D, view: View): void {
  const middle = project(view, 16 * SLAB, 14.7 * SLAB);
  ctx.save();
  ctx.fillStyle = "rgba(63,63,70,0.5)";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LA CASA DE PAPEL", middle.x, middle.y);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const mat = project(view, 12 * SLAB, 17.4 * SLAB);
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(mat.x + 4, mat.y, SLAB * 3 - 8, 14);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(mat.x + 4, mat.y, SLAB * 3 - 8, 14);
  ctx.restore();
}

/** The shop floor: ink, paper, a fork-lift and the ducts overhead. */
function drawWorksKit(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.save();
  for (const drum of [5, 6.2, 7.4]) {
    const at = project(view, drum * SLAB, 8.6 * SLAB);
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.arc(at.x, at.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = "rgba(226,232,240,0.5)";
    ctx.beginPath();
    ctx.arc(at.x, at.y, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const reel of [
    { col: 19.5, row: 8.6 },
    { col: 21, row: 8.6 },
    { col: 20.2, row: 9.6 },
  ]) {
    const at = project(view, reel.col * SLAB, reel.row * SLAB);
    ctx.fillStyle = "#e7e5e4";
    ctx.beginPath();
    ctx.arc(at.x, at.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(at.x, at.y, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  const lift = project(view, 20.5 * SLAB, 11.2 * SLAB);
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(lift.x - 12, lift.y - 9, 24, 18);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(lift.x - 12, lift.y - 9, 24, 18);
  ctx.fillStyle = "#27272a";
  ctx.fillRect(lift.x - 6, lift.y - 5, 12, 10);
  ctx.fillStyle = "#71717a";
  ctx.fillRect(lift.x + 12, lift.y - 6, 12, 3);
  ctx.fillRect(lift.x + 12, lift.y + 3, 12, 3);
  ctx.strokeStyle = "rgba(24,24,27,0.18)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (const run of [8.2, 12.3]) {
    const from = project(view, 4 * SLAB, run * SLAB);
    const to = project(view, 22 * SLAB, run * SLAB);
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  ctx.stroke();
  ctx.restore();
}

/** And the cellar: pillars, crates and the drain in the floor. */
function drawCellarKit(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.save();
  for (const pillar of [
    { col: 11.5, row: 5.5 },
    { col: 14.5, row: 5.5 },
  ]) {
    const at = project(view, pillar.col * SLAB, pillar.row * SLAB);
    ctx.fillStyle = "#4b4b52";
    ctx.fillRect(at.x - 13, at.y - 13, 26, 26);
    ctx.fillStyle = "#5c5c63";
    ctx.fillRect(at.x - 9, at.y - 9, 18, 18);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x - 13, at.y - 13, 26, 26);
  }
  for (const crate of [
    { col: 12.5, row: 4.5 },
    { col: 14, row: 4.5 },
    { col: 10.5, row: 6.5 },
  ]) {
    const at = project(view, crate.col * SLAB, crate.row * SLAB);
    ctx.fillStyle = "#6b5b4b";
    ctx.fillRect(at.x - 13, at.y - 11, 26, 22);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x - 13, at.y - 11, 26, 22);
  }
  const drain = project(view, 9.5 * SLAB, 6.4 * SLAB);
  ctx.fillStyle = "#3f3f46";
  ctx.beginPath();
  ctx.arc(drain.x, drain.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a1a1aa";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const bar of [-4, 0, 4]) {
    ctx.moveTo(drain.x - 6, drain.y + bar);
    ctx.lineTo(drain.x + 6, drain.y + bar);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * The director's office, and the telephone in it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @remarks
 * **The telephone is drawn twice the size it would be.** It is a handset on a
 * table, and it decides the job: one has to be able to see from the hall
 * whether the man in the suit has got to it. Once it is shot out it is a black
 * lump and the office is just a room.
 */
function drawOffice(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const phone = phoneSpot();
  const at = project(view, phone.x, phone.y);
  ctx.save();
  // The table it stands on.
  ctx.fillStyle = "#4b3621";
  ctx.fillRect(at.x - 15, at.y - 12, 30, 24);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x - 15, at.y - 12, 30, 24);
  // And the telephone: a base, a handset across it, and a light on it.
  ctx.fillStyle = mint.phone ? "#e2e8f0" : "#3f3f46";
  ctx.fillRect(at.x - 9, at.y - 7, 18, 14);
  ctx.strokeRect(at.x - 9, at.y - 7, 18, 14);
  ctx.fillStyle = mint.phone ? "#1f2937" : "#27272a";
  ctx.fillRect(at.x - 11, at.y - 3, 22, 6);
  if (mint.phone) {
    ctx.fillStyle = mint.boss.called ? "#ef4444" : "#4ade80";
    ctx.beginPath();
    ctx.arc(at.x + 6, at.y - 4, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // The desk he sits at, on the far side of the office.
  const desk = project(view, 7 * SLAB, 16.5 * SLAB);
  ctx.fillStyle = "#4b3621";
  ctx.fillRect(desk.x - 18, desk.y - 10, 36, 20);
  ctx.strokeRect(desk.x - 18, desk.y - 10, 36, 20);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(desk.x - 8, desk.y - 6, 14, 8);
  ctx.restore();
}

/**
 * The strongroom: steel shelves with the finished notes on them.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 */
function drawVault(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.save();
  for (const shelf of [4.5, 6.5]) {
    const at = project(view, 17 * SLAB, shelf * SLAB);
    ctx.fillStyle = "#52525b";
    ctx.fillRect(at.x, at.y - 12, SLAB * 4.6, 24);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x, at.y - 12, SLAB * 4.6, 24);
    for (let brick = 0; brick < 6; brick += 1) {
      ctx.fillStyle = "#d9d3a8";
      ctx.fillRect(at.x + 6 + brick * 30, at.y - 8, 22, 16);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(at.x + 6 + brick * 30, at.y - 2, 22, 4);
    }
  }
  ctx.restore();
}

/* -------------------------------------------------------------- the siege */

/**
 * The street: the cars, the tent, the tank and the van with the food.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @remarks
 * **One has to be able to watch them arrive.** For the first minute and a
 * quarter nothing happens to the doors at all and everything happens out
 * here: the cars come up the road, men get out behind them, the tent goes up
 * across the street. Drawn, that minute is the calm before something; left
 * out, it is a minute in which the game appears to have forgotten about one.
 */
function drawOutside(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  drawTent(ctx, view, mint);
  drawCars(ctx, view, mint);
  if (waiting(mint)) {
    drawFoodVan(ctx, view);
  }
  drawTank(ctx, view, mint);
}

/** Their tent across the road, once they have had time to put it up. */
function drawTent(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const up = Math.min(1, Math.max(0, (mint.time - mint.settleAt + 30) / 30));
  if (up <= 0) {
    return;
  }
  const at = project(view, 10 * SLAB, 22 * SLAB);
  const wide = SLAB * 6;
  const deep = SLAB * 1.6;
  ctx.save();
  ctx.globalAlpha = up;
  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(at.x, at.y, wide, deep);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.strokeRect(at.x, at.y, wide, deep);
  ctx.strokeStyle = "rgba(226,232,240,0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(at.x, at.y + deep / 2);
  ctx.lineTo(at.x + wide, at.y + deep / 2);
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.font = "bold 10px system-ui, sans-serif";
  ctx.fillText("EINSATZLEITUNG", at.x + wide / 2, at.y + deep / 2 - 5);
  ctx.textAlign = "left";
  ctx.restore();
}

/** The cars they blocked the road with. */
function drawCars(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const here = Math.min(1, Math.max(0, (mint.time - mint.settleAt + 60) / 45));
  if (here <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = here;
  for (const car of [
    { col: 7.5, row: 21 },
    { col: 12, row: 21 },
    { col: 16.5, row: 21 },
  ]) {
    const at = project(view, car.col * SLAB, car.row * SLAB);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(at.x, at.y, SLAB * 2.2, SLAB * 0.9);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x, at.y, SLAB * 2.2, SLAB * 0.9);
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(at.x, at.y + SLAB * 0.3, SLAB * 2.2, SLAB * 0.3);
    // The bar on the roof, blue one side and red the other.
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(at.x + SLAB * 0.8, at.y + 4, 14, 6);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(at.x + SLAB * 1.2, at.y + 4, 14, 6);
  }
  ctx.restore();
}

/** The van with the food, standing at the kerb. */
function drawFoodVan(ctx: CanvasRenderingContext2D, view: View): void {
  const spot = foodSpot();
  const at = project(view, spot.x, spot.y);
  ctx.save();
  ctx.fillStyle = "#e7e5e4";
  ctx.fillRect(at.x - SLAB, at.y - 14, SLAB * 2, 28);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x - SLAB, at.y - 14, SLAB * 2, 28);
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(at.x - 10, at.y - 8, 20, 16);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ESSEN", at.x, at.y + 24);
  ctx.textAlign = "left";
  ctx.restore();
}

/**
 * The tank, square on to the shutter.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @remarks
 * From above it is a hull, a turret and a barrel pointing at the door - and
 * once it has been stopped, a black hull with smoke coming off it. The barrel
 * is drawn long on purpose: it is the one thing outside that has to be read
 * from the far end of the press room.
 */
function drawTank(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const tank = mint.tank;
  if (tank === null) {
    return;
  }
  const at = project(view, tank.x, tank.y);
  const dead = tank.health <= 0;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(tank.heading);
  ctx.fillStyle = dead ? "#1c1917" : "#27272a";
  ctx.fillRect(-34, -22, 68, 10);
  ctx.fillRect(-34, 12, 68, 10);
  ctx.fillStyle = dead ? "#292524" : "#3f5130";
  ctx.fillRect(-32, -16, 64, 32);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-32, -16, 64, 32);
  ctx.fillStyle = dead ? "#1c1917" : "#4a5f3a";
  ctx.beginPath();
  ctx.arc(-4, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(10, -4, 40, 8);
  ctx.strokeRect(10, -4, 40, 8);
  ctx.restore();
  if (dead) {
    // Smoke, so that a stopped tank does not look like a parked one.
    ctx.save();
    ctx.fillStyle = "rgba(120,113,108,0.45)";
    for (const puff of [0, 1, 2]) {
      ctx.beginPath();
      ctx.arc(
        at.x + puff * 6,
        at.y - 10 - puff * 9,
        8 + puff * 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ------------------------------------------------------------ what stands */

/**
 * The rows of the plan, north to south, with the people standing in them.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 */
function drawRows(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  weapon: WeaponKind,
): void {
  const seen = seenArea(view);
  const fromRow = Math.max(0, Math.floor(seen.top / SLAB) - 1);
  const toRow = Math.min(PLAN_HIGH - 1, Math.ceil(seen.bottom / SLAB) + 1);
  const fromCol = Math.max(0, Math.floor(seen.left / SLAB) - 1);
  const toCol = Math.min(PLAN_WIDE - 1, Math.ceil(seen.right / SLAB) + 1);
  const folk = everybody(mint);
  const held = underTheGun(mint);
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      drawSquare(ctx, view, mint, col, row);
    }
    for (const one of folk) {
      if (Math.floor(one.at.y / SLAB) === row) {
        paintPerson(
          ctx,
          view,
          one,
          held !== null && sameSpot(one.at, held),
          weapon,
        );
      }
    }
  }
}

/** Whether two people are standing in the same place, to a pixel. */
function sameSpot(
  one: { readonly x: number; readonly y: number },
  two: { readonly x: number; readonly y: number },
): boolean {
  return one.x === two.x && one.y === two.y;
}

/** One person in the works, and which sort. */
type Folk = {
  readonly at: Inmate;
  readonly kind: "hero" | "crew" | "clerk" | "hostage" | "boss" | "cop";
  /** Whether they are lying on the floor. */
  readonly down: boolean;
  /** Whether they are working rather than standing about. */
  readonly busy: boolean;
};

/** Everybody in the building and outside it, in the order they stand in. */
function everybody(mint: MintState): readonly Folk[] {
  return [
    ...mint.cops.map((one) => ({
      at: { x: one.x, y: one.y, heading: one.heading, walked: one.walked },
      kind: "cop" as const,
      down: false,
      busy: false,
    })),
    ...mint.staff.map((one) => ({
      at: one,
      kind: one.taken ? ("hostage" as const) : ("clerk" as const),
      down: !one.alive,
      busy:
        one.alive &&
        !one.slacking &&
        !one.led &&
        (one.press !== null || one.digging),
    })),
    {
      at: mint.boss,
      kind: "boss" as const,
      down: !mint.boss.alive,
      busy: false,
    },
    ...mint.crew.map((one) => ({
      at: one,
      kind: "crew" as const,
      down: false,
      busy: one.post !== null,
    })),
    { at: mint.hero, kind: "hero" as const, down: false, busy: false },
  ];
}

/** One person: their shadow, the figure, and whatever is over their head. */
function paintPerson(
  ctx: CanvasRenderingContext2D,
  view: View,
  who: Folk,
  held: boolean,
  weapon: WeaponKind,
): void {
  const masked = who.kind === "hero" || who.kind === "crew";
  const worn =
    who.kind === "boss"
      ? BOSS
      : who.kind === "cop"
        ? UNIFORM
        : masked
          ? OVERALL
          : CLERK;
  const look: Figure = {
    ...worn,
    // The hired men are a shade darker than the man who hired them, so that
    // the bright overall in the middle of the screen is always the player.
    shirt: who.kind === "crew" ? "#b91c1c" : worn.shirt,
    facing: who.at.heading,
    heading: who.at.heading,
    walked: who.at.walked,
    pace: 0,
    time: 0,
    arms: who.kind === "hostage" && !who.busy ? "hold" : "swing",
    hand: "right",
    style: masked ? "robber" : who.kind === "cop" ? "cop" : "plain",
    // **What is in the hand is drawn in the hand.** The player carries
    // whatever the wheel is on, his men carry pistols and the police carry
    // batons - a room in which nobody is visibly holding anything is a room
    // in which nobody has any reason to put their hands up.
    holds:
      who.kind === "hero"
        ? weapon
        : who.kind === "crew"
          ? "pistol"
          : who.kind === "cop"
            ? "baton"
            : undefined,
  };
  if (who.down) {
    // **Flat on the floor, exactly as the street lays them out.** The same
    // drawing the city uses for a body on the road: one sprite, no height, the
    // heading it fell with. Anything else in here would be a second sort of
    // dead person in the same game.
    const at = project(view, who.at.x, who.at.y);
    ctx.save();
    ctx.fillStyle = "rgba(127,29,29,0.5)";
    ctx.beginPath();
    ctx.ellipse(at.x, at.y + 2, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    lyingDown(ctx, view, who.at, look, 1);
    return;
  }
  shadow(ctx, view, who.at, FOOTPRINT, FOOTPRINT * 0.8, 0, 0.55);
  drawFigure(ctx, view, who.at, look, 1);
  const at = project(view, who.at.x, who.at.y);
  if (held) {
    // The ring that says the gun is on this one and nobody else.
    ctx.save();
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(at.x, at.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (who.busy) {
    // A little bar over anybody who is actually working, so that a room of
    // hostages can be read at a glance rather than counted.
    ctx.save();
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(at.x - 7, at.y - 22, 14, 3);
    ctx.restore();
  }
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
      drawWall(ctx, view, col, row);
      break;
    case "press":
      drawPress(ctx, view, mint, col, row);
      break;
    case "pallet":
      drawPallet(ctx, view, col, row);
      break;
    case "desk":
      drawDesk(ctx, view, col, row);
      break;
    case "vaultDoor":
      drawVaultDoor(ctx, view, col, row);
      break;
    case "shutter":
      drawShutter(ctx, view, mint, col, row);
      break;
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

/** One square of wall, flat. */
function drawWall(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const shell =
    tileAt(col - 1, row) === "street" ||
    tileAt(col + 1, row) === "street" ||
    tileAt(col, row - 1) === "street" ||
    tileAt(col, row + 1) === "street" ||
    tileAt(col, row + 1) === "kerb";
  ctx.fillStyle = shell ? "#2e2e33" : "#4b4b52";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
}

/**
 * One printing press, seen from above.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @param col - the square it stands on
 * @param row - and the row
 */
function drawPress(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const middle = pressSpots().findIndex(
    (spot) => Math.abs(spot.x - (col + 0.5) * SLAB) < SLAB * 1.6,
  );
  const on = middle >= 0 && running(mint, middle);
  const part =
    tileAt(col - 1, row) === "press"
      ? tileAt(col + 1, row) === "press"
        ? "middle"
        : "out"
      : "in";
  ctx.save();
  ctx.fillStyle = "#3f434b";
  ctx.fillRect(at.x, at.y + INSET, SLAB + 1, SLAB - INSET * 2);
  ctx.fillStyle = "#52565f";
  ctx.fillRect(at.x, at.y + INSET + 3, SLAB + 1, SLAB - INSET * 2 - 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(at.x, at.y + INSET + 0.5);
  ctx.lineTo(at.x + SLAB + 1, at.y + INSET + 0.5);
  ctx.moveTo(at.x, at.y + SLAB - INSET + 0.5);
  ctx.lineTo(at.x + SLAB + 1, at.y + SLAB - INSET + 0.5);
  ctx.stroke();
  if (part === "in") {
    ctx.fillStyle = "#e7e5e4";
    ctx.beginPath();
    ctx.ellipse(
      at.x + SLAB * 0.4,
      at.y + SLAB / 2,
      9,
      SLAB * 0.3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  } else if (part === "middle") {
    ctx.fillStyle = "#71717a";
    for (const along of [0.3, 0.7]) {
      ctx.fillRect(at.x + SLAB * along - 5, at.y + INSET + 4, 10, SLAB - 14);
      ctx.strokeStyle = OUTLINE;
      ctx.strokeRect(at.x + SLAB * along - 5, at.y + INSET + 4, 10, SLAB - 14);
    }
    ctx.fillStyle = on ? "#166534" : "#3f3f46";
    ctx.fillRect(at.x + 4, at.y + SLAB - INSET - 7, SLAB - 8, 4);
  } else {
    ctx.fillStyle = "#27272a";
    ctx.fillRect(at.x + SLAB * 0.45, at.y + INSET + 2, SLAB * 0.4, 11);
    ctx.fillStyle = on ? "#4ade80" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(at.x + SLAB * 0.55, at.y + INSET + 7.5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = on ? "#bbf7d0" : "#a8a29e";
    ctx.fillRect(at.x + SLAB * 0.4, at.y + SLAB - INSET - 12, SLAB * 0.5, 8);
    ctx.strokeStyle = OUTLINE;
    ctx.strokeRect(at.x + SLAB * 0.4, at.y + SLAB - INSET - 12, SLAB * 0.5, 8);
  }
  ctx.restore();
}

/** A pallet of finished notes. */
function drawPallet(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#8a6a45";
  ctx.fillRect(at.x + 1, at.y + 1, SLAB - 1, SLAB - 1);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 1, at.y + 1, SLAB - 1, SLAB - 1);
  for (const brick of [
    { x: 4, y: 4 },
    { x: SLAB / 2 + 1, y: 4 },
    { x: 4, y: SLAB / 2 + 1 },
    { x: SLAB / 2 + 1, y: SLAB / 2 + 1 },
  ]) {
    ctx.fillStyle = "#d9d3a8";
    ctx.fillRect(at.x + brick.x, at.y + brick.y, SLAB / 2 - 6, SLAB / 2 - 6);
    ctx.strokeRect(at.x + brick.x, at.y + brick.y, SLAB / 2 - 6, SLAB / 2 - 6);
    ctx.fillStyle = "#b45309";
    ctx.fillRect(
      at.x + brick.x,
      at.y + brick.y + (SLAB / 2 - 6) / 2 - 1.5,
      SLAB / 2 - 6,
      3,
    );
  }
  ctx.restore();
}

/** A desk in the front hall. */
function drawDesk(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#6b5b4b";
  ctx.fillRect(at.x + 1, at.y + 6, SLAB - 1, SLAB - 12);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + 1, at.y + 6, SLAB - 1, SLAB - 12);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(at.x + 5, at.y + 10, 12, 7);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(at.x + 21, at.y + 11, 10, 8);
  ctx.strokeRect(at.x + 21, at.y + 11, 10, 8);
  ctx.restore();
}

/** The door of the strongroom: steel, with a wheel on it. */
function drawVaultDoor(
  ctx: CanvasRenderingContext2D,
  view: View,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  ctx.save();
  ctx.fillStyle = "#71717a";
  ctx.fillRect(at.x, at.y + 2, SLAB + 1, SLAB - 4);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(at.x, at.y + 2, SLAB + 1, SLAB - 4);
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(at.x + SLAB / 2, at.y + SLAB / 2, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (const spoke of [0, 1, 2, 3]) {
    const turn = (spoke * Math.PI) / 2 + 0.4;
    ctx.moveTo(at.x + SLAB / 2, at.y + SLAB / 2);
    ctx.lineTo(
      at.x + SLAB / 2 + Math.cos(turn) * 9,
      at.y + SLAB / 2 + Math.sin(turn) * 9,
    );
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * The shutter over the front door, at whatever height it is at.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @param col - the square it is in
 * @param row - and the row
 * @remarks
 * **The one door in the building that the player works himself**, so it has
 * to read at a glance: shut it is a ribbed steel curtain across the whole
 * opening, open it is a gap with daylight in it. In between it is a band that
 * shrinks, which is what a shutter going up looks like from above.
 */
function drawShutter(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const open = Math.min(1, Math.max(0, mint.shutter));
  const gate = mint.gates.find((one) => one.kind === "door") ?? null;
  ctx.save();
  // The opening itself: daylight from the street.
  ctx.fillStyle = "#6b6a66";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
  // The curtain, as deep as it is down.
  const deep = (SLAB + 1) * (1 - open);
  ctx.fillStyle = "#71717a";
  ctx.fillRect(at.x, at.y, SLAB + 1, deep);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let rib = 4; rib < deep; rib += 5) {
    ctx.moveTo(at.x, at.y + rib);
    ctx.lineTo(at.x + SLAB + 1, at.y + rib);
  }
  ctx.stroke();
  if (gate !== null) {
    drawPush(ctx, at, gate);
  }
  ctx.restore();
}

/**
 * One of the other two ways in, with what is piled against it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @param col - the square it is in
 * @param row - and the row
 * @param kind - the loading gate or the window
 */
function drawWayIn(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
  kind: Tile,
): void {
  const at = project(view, col * SLAB, row * SLAB);
  const gate = gateOn(mint, col, row);
  ctx.save();
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(at.x, at.y, SLAB + 1, SLAB + 1);
  ctx.fillStyle = kind === "window" ? "#9dbcc7" : "#7c2d12";
  ctx.fillRect(at.x + SLAB * 0.3, at.y + 2, SLAB * 0.4, SLAB - 3);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(at.x + SLAB * 0.3, at.y + 2, SLAB * 0.4, SLAB - 3);
  if (gate !== null) {
    const pile = Math.max(0, Math.min(1, gate.barricade));
    if (pile > 0) {
      ctx.fillStyle = "#8a6a45";
      ctx.fillRect(
        at.x + SLAB * 0.62,
        at.y + 4,
        (SLAB - 8) * pile * 0.6,
        SLAB - 8,
      );
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.strokeRect(
        at.x + SLAB * 0.62,
        at.y + 4,
        (SLAB - 8) * pile * 0.6,
        SLAB - 8,
      );
    }
    drawPush(ctx, at, gate);
  }
  ctx.restore();
}

/** The bar across a way in: how far through them they are. */
function drawPush(
  ctx: CanvasRenderingContext2D,
  at: { readonly x: number; readonly y: number },
  gate: Gate,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(at.x + 3, at.y + 3, SLAB - 6, 5);
  ctx.fillStyle = gate.busy ? "#ef4444" : "#f59e0b";
  ctx.fillRect(at.x + 3, at.y + 3, (SLAB - 6) * Math.min(1, gate.push), 5);
  if (gate.barricade > 0) {
    ctx.fillStyle = "#a16207";
    ctx.fillRect(
      at.x + 3,
      at.y + SLAB - 8,
      (SLAB - 6) * Math.min(1, gate.barricade),
      4,
    );
  }
}

/** Which of the three ways in stands on this square, if any. */
function gateOn(mint: MintState, col: number, row: number): Gate | null {
  return (
    mint.gates.find(
      (gate) =>
        Math.abs(gate.at.x - (col + 0.5) * SLAB) < SLAB * 2.2 &&
        Math.abs(gate.at.y - (row + 0.5) * SLAB) < SLAB,
    ) ?? null
  );
}

/** The hatch in the cellar floor, and the hole it becomes. */
function drawHatch(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
  col: number,
  row: number,
): void {
  const at = project(view, (col + 0.5) * SLAB, (row + 0.5) * SLAB);
  const through = mint.tunnel >= 1;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.fillStyle = "#6b5b4b";
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = through ? "#0c0a09" : "#2a221c";
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  if (through) {
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const side of [-4, 4]) {
      ctx.moveTo(side, -11);
      ctx.lineTo(side, 11);
    }
    for (const rung of [-7, -1, 5]) {
      ctx.moveTo(-4, rung);
      ctx.lineTo(4, rung);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = "#8a6a45";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.lineTo(4, 2);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.beginPath();
    ctx.ellipse(3, 4, 3.5, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = through ? "#4ade80" : "#facc15";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    19,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * Math.min(1, mint.tunnel),
  );
  ctx.stroke();
  ctx.restore();
}

/** The ring round whatever the job in hand is, and round every post. */
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
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 20 * beat, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // And a ring on every station one of one's own men is standing over, so
  // that "who is being watched" is a thing one sees rather than remembers.
  ctx.save();
  ctx.strokeStyle = "rgba(74,222,128,0.5)";
  ctx.lineWidth = 2;
  for (const man of mint.crew) {
    const post = man.post;
    if (post !== null) {
      const spot = postSpots()[post];
      const at = project(view, spot.x, spot.y);
      ctx.beginPath();
      ctx.arc(at.x, at.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Everything in the air, drawn the way the street draws it.
 *
 * @param ctx - what to paint on
 * @param view - where the camera is
 * @param mint - the works as they stand
 * @remarks
 * **The same picture as outside**, from the same function: a round out of the
 * same pistol looks the same on both sides of the door, the flamethrower
 * throws flames in here too, and the rocket that stops the tank is the rocket
 * one knows from the street.
 */
function drawShots(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  for (const shot of mint.shots) {
    drawShot(ctx, shot, view, mint.time);
  }
}

/** The crosshair, where the gun is pointing. */
function drawAim(
  ctx: CanvasRenderingContext2D,
  view: View,
  mint: MintState,
): void {
  const at = project(view, mint.aim.x, mint.aim.y);
  ctx.save();
  ctx.strokeStyle = "rgba(248,250,252,0.8)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(at.x - 9, at.y);
  ctx.lineTo(at.x - 3, at.y);
  ctx.moveTo(at.x + 3, at.y);
  ctx.lineTo(at.x + 9, at.y);
  ctx.moveTo(at.x, at.y - 9);
  ctx.lineTo(at.x, at.y - 3);
  ctx.moveTo(at.x, at.y + 3);
  ctx.lineTo(at.x, at.y + 9);
  ctx.stroke();
  ctx.restore();
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
 * @param ctx - what to paint on
 * @param mint - the works as they stand
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
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
  ctx.fillText(taskLine(mint), left + 12, top + 16);
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.fillStyle = "#86efac";
  ctx.fillText(`${String(Math.round(mint.printed))} €`, left + 12, top + 40);
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "#fafaf9";
  ctx.fillText("Tunnel", left + 120, top + 40);
  ctx.fillStyle = "rgba(250,250,249,0.18)";
  ctx.fillRect(left + 168, top + 35, 100, 9);
  ctx.fillStyle = mint.tunnel >= 1 ? "#4ade80" : "#facc15";
  ctx.fillRect(left + 168, top + 35, 100 * Math.min(1, mint.tunnel), 9);
  // **The clock before the siege**, which is the most useful number in the
  // first minute and meaningless after it.
  if (ready(mint)) {
    ctx.fillStyle = mint.shutter > 0.5 ? "#fca5a5" : "rgba(250,250,249,0.7)";
    ctx.fillText(
      mint.shutter > 0.5 ? "Tor offen" : "Tor zu",
      left + 290,
      top + 40,
    );
  } else {
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(
      `Polizei stellt sich auf: ${String(Math.max(0, Math.ceil(mint.settleAt - mint.time)))} s`,
      left + 290,
      top + 40,
    );
  }
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
