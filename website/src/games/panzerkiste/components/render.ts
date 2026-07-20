/**
 * Draws a {@link GameState} onto a 2D canvas in a tilted 2.5D view.
 *
 * @module
 * @remarks
 * Pure drawing only. The world is a flat grid; {@link ./projection} tilts it so
 * walls and tanks become boxes with a visible top and front face. Everything is
 * drawn back to front (painter's order) so nearer things overlap farther ones.
 */
import {
  MINE_RADIUS,
  TANK_RADIUS,
  TILE,
  type Bullet,
  type Explosion,
  type GameState,
  type Mine,
  type Tank,
  type TankKind,
  type Trail,
} from "@/games/panzerkiste/engine/types";
import {
  BODY_HEIGHT,
  BULLET_HEIGHT,
  DEPTH,
  project,
  WALL_HEIGHT,
} from "@/games/panzerkiste/components/projection";

/** How many directions the chassis can face: the sides plus the diagonals. */
const CHASSIS_DIRECTIONS = 8;

/** The lit top face colour of each tank kind. */
const TANK_TOP: Readonly<Record<TankKind, string>> = {
  player: "#3b82f6",
  brown: "#c2740c",
  grey: "#64748b",
  teal: "#0d9488",
};

/** The shaded front face colour of each tank kind. */
const TANK_SIDE: Readonly<Record<TankKind, string>> = {
  player: "#1e40af",
  brown: "#7c4a06",
  grey: "#3f4a5a",
  teal: "#0a6a60",
};

/** Colours and sizes of the arena, blocks, tanks, shells, mines and blasts. */
const RENDER = {
  floor: "#dbe1e8",
  grid: "#c7d0dc",
  holeRim: "#9aa4b2",
  holeFill: "#c1c8d3",
  holeRadius: 15,
  holeRimWidth: 2,
  wallTop: "#475569",
  wallSide: "#2b3646",
  crateTop: "#b45309",
  crateSide: "#7c4a06",
  crateLine: "#5c2c0c",
  outline: "#0f172a",
  hullHalfX: 7,
  hullHalfY: 11,
  trackHalfX: 3.5,
  trackHalfY: 14,
  trackInset: 10.5,
  trackHeight: 6,
  trackTop: "#3f4653",
  trackSide: "#1f2530",
  tread: "#0b1220",
  treadCount: 6,
  treadCenter: 0.5,
  turretRadius: 7,
  turretRise: 5,
  barrelLen: 22,
  barrelWidth: 5,
  muzzleRadius: 3,
  bulletRadius: 4,
  bullet: "#111827",
  bulletRing: "#f8fafc",
  bulletRingWidth: 1.5,
  shadow: "rgba(15, 23, 42, 0.22)",
  mineCore: "#eab308",
  mineBlink: "#dc2626",
  mineRadius: 8,
  mineBlinkLead: 1,
  mineBlinkHz: 10,
  blast: "#f59e0b",
  blastCore: "#fde68a",
  fadeSpeed: 3,
  aim: "#3b82f6",
  aimWidth: 2,
  cursorSize: 9,
  cursorGap: 4.5,
  cursorDot: 2,
  cursorWidth: 2.5,
  mark: "#ffffff",
  markEdge: "rgba(15, 23, 42, 0.35)",
  markSize: 11,
  markWidth: 3,
  markEdgeWidth: 5,
  trail: "rgba(30, 41, 59, 0.30)",
  trailWidth: 3,
} as const;

/** Dash pattern of a tread trail: pixels drawn, then pixels skipped. */
const TRAIL_DASH_ON = 3;
const TRAIL_DASH_OFF = 5;

/** Dash pattern of the aim line: pixels drawn, then pixels skipped. */
const AIM_DASH_ON = 3;
const AIM_DASH_OFF = 12;

/** One thing to draw, tagged with its depth for back-to-front ordering. */
type Item = {
  readonly depth: number;
  readonly draw: () => void;
};

/** A world-space aim point (the mouse projected onto the floor), or none. */
type Pointer = { readonly x: number; readonly y: number } | null;

/**
 * Paints the whole scene.
 *
 * @param ctx - the 2D context of the game canvas
 * @param state - the state to draw
 * @param pointer - the aim point to mark with a cursor, or null to hide it
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pointer: Pointer,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawFloor(ctx, state);
  drawHoles(ctx, state);
  drawTrails(ctx, state);
  drawMarks(ctx, state);

  // Everything raised off the floor is drawn back (small y) to front (large y).
  const items: Item[] = [];
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const index = row * state.cols + col;
      if (state.walls[index]) {
        const crate = state.breakable[index];
        items.push({
          depth: (row + 1) * TILE,
          draw: () => drawBlock(ctx, col, row, crate),
        });
      }
    }
  }
  for (const mine of state.mines) {
    items.push({ depth: mine.y, draw: () => drawMine(ctx, mine, state.time) });
  }
  for (const blast of state.explosions) {
    items.push({
      depth: blast.y,
      draw: () => drawExplosion(ctx, blast, state.time),
    });
  }
  for (const bullet of state.bullets) {
    items.push({ depth: bullet.y, draw: () => drawBullet(ctx, bullet) });
  }
  for (const tank of state.tanks) {
    if (tank.alive) {
      items.push({
        depth: tank.y + TANK_RADIUS,
        draw: () => drawTank(ctx, tank),
      });
    }
  }

  items.sort((a, b) => a.depth - b.depth);
  for (const item of items) {
    item.draw();
  }

  if (pointer !== null) {
    drawAim(ctx, state, pointer);
  }
}

/** The aim helper: a dotted line from the player to a blue X cursor. */
function drawAim(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pointer: { readonly x: number; readonly y: number },
): void {
  const player = state.tanks.find((tank) => tank.id === "player" && tank.alive);
  const cursor = project(pointer.x, pointer.y, 0);

  if (player !== undefined) {
    const from = project(player.x, player.y, BODY_HEIGHT + RENDER.turretRise);
    ctx.save();
    ctx.strokeStyle = RENDER.aim;
    ctx.lineWidth = RENDER.aimWidth;
    ctx.setLineDash([AIM_DASH_ON, AIM_DASH_OFF]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(cursor.x, cursor.y);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = RENDER.aim;
  ctx.fillStyle = RENDER.aim;
  ctx.lineWidth = RENDER.cursorWidth;
  ctx.lineCap = "round";
  // Only the four outer tips of an X, leaving a gap open around the centre.
  const diagonals = [
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ] as const;
  ctx.beginPath();
  for (const [sx, sy] of diagonals) {
    ctx.moveTo(
      cursor.x + sx * RENDER.cursorGap,
      cursor.y + sy * RENDER.cursorGap,
    );
    ctx.lineTo(
      cursor.x + sx * RENDER.cursorSize,
      cursor.y + sy * RENDER.cursorSize,
    );
  }
  ctx.stroke();
  // A small round dot marks the exact aim point in the middle.
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, RENDER.cursorDot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The tilted floor rectangle with a faint grid. */
function drawFloor(ctx: CanvasRenderingContext2D, state: GameState): void {
  const width = state.cols * TILE;
  const top = project(0, 0).y;
  const bottom = project(0, state.rows * TILE).y;

  ctx.fillStyle = RENDER.floor;
  ctx.fillRect(0, top, width, bottom - top);

  ctx.strokeStyle = RENDER.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 1; col < state.cols; col++) {
    ctx.moveTo(col * TILE, top);
    ctx.lineTo(col * TILE, bottom);
  }
  for (let row = 1; row < state.rows; row++) {
    const y = project(0, row * TILE).y;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

/** The holes: round pits, drawn tilted so they clearly sink into the floor. */
function drawHoles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      if (state.holes[row * state.cols + col]) {
        drawHole(ctx, col, row);
      }
    }
  }
}

/** One hole: a flat round patch on the floor, a touch darker than the floor. */
function drawHole(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
): void {
  const center = project(col * TILE + TILE / 2, row * TILE + TILE / 2, 0);
  const radiusX = RENDER.holeRadius;
  const radiusY = radiusX * DEPTH;
  const full = Math.PI * 2;

  ctx.fillStyle = RENDER.holeFill;
  ctx.strokeStyle = RENDER.holeRim;
  ctx.lineWidth = RENDER.holeRimWidth;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, full);
  ctx.fill();
  ctx.stroke();
}

/** The dashed tread trails every tank leaves along the lane it drove. */
function drawTrails(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Group the breadcrumbs per tank, keeping their order, into one path each.
  const byTank = new Map<string, Trail[]>();
  for (const point of state.trails) {
    const path = byTank.get(point.id) ?? [];
    path.push(point);
    byTank.set(point.id, path);
  }

  ctx.save();
  ctx.strokeStyle = RENDER.trail;
  ctx.lineWidth = RENDER.trailWidth;
  ctx.lineCap = "butt";
  ctx.setLineDash([TRAIL_DASH_ON, TRAIL_DASH_OFF]);
  const sides = [-1, 1] as const;
  for (const path of byTank.values()) {
    for (const dir of sides) {
      drawTrackLine(ctx, path, dir);
    }
  }
  ctx.restore();
}

/** One side's tread line: the breadcrumbs offset to that track, projected. */
function drawTrackLine(
  ctx: CanvasRenderingContext2D,
  path: readonly Trail[],
  dir: number,
): void {
  ctx.beginPath();
  path.forEach((point, index) => {
    const angle = snapChassis(point.heading);
    const acrossX = -Math.sin(angle);
    const acrossY = Math.cos(angle);
    const screen = project(
      point.x + acrossX * dir * RENDER.trackInset,
      point.y + acrossY * dir * RENDER.trackInset,
      0,
    );
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });
  ctx.stroke();
}

/** The white X wreck marks left on the floor where enemies were destroyed. */
function drawMarks(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const mark of state.marks) {
    const p = project(mark.x, mark.y, 0);
    // A dark halo first, then white on top, so it reads on the light floor.
    drawCross(ctx, p, RENDER.markEdge, RENDER.markEdgeWidth);
    drawCross(ctx, p, RENDER.mark, RENDER.markWidth);
  }
}

/** One X centred at a screen point, squashed onto the tilted floor. */
function drawCross(
  ctx: CanvasRenderingContext2D,
  p: { readonly x: number; readonly y: number },
  color: string,
  width: number,
): void {
  const armX = RENDER.markSize;
  const armY = RENDER.markSize * DEPTH;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p.x - armX, p.y - armY);
  ctx.lineTo(p.x + armX, p.y + armY);
  ctx.moveTo(p.x + armX, p.y - armY);
  ctx.lineTo(p.x - armX, p.y + armY);
  ctx.stroke();
}

/** A raised box centred on a world point, with a top and a front face. */
function drawBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfX: number,
  halfY: number,
  height: number,
  top: string,
  side: string,
): void {
  const topBL = project(cx - halfX, cy + halfY, height);
  const topBR = project(cx + halfX, cy + halfY, height);
  const topTR = project(cx + halfX, cy - halfY, height);
  const topTL = project(cx - halfX, cy - halfY, height);
  const baseBL = project(cx - halfX, cy + halfY, 0);
  const baseBR = project(cx + halfX, cy + halfY, 0);

  // Front (south) face.
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(baseBL.x, baseBL.y);
  ctx.lineTo(baseBR.x, baseBR.y);
  ctx.lineTo(topBR.x, topBR.y);
  ctx.lineTo(topBL.x, topBL.y);
  ctx.closePath();
  ctx.fill();

  // Top face.
  ctx.fillStyle = top;
  ctx.strokeStyle = RENDER.outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(topTL.x, topTL.y);
  ctx.lineTo(topTR.x, topTR.y);
  ctx.lineTo(topBR.x, topBR.y);
  ctx.lineTo(topBL.x, topBL.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** One wall cell as a block; destructible ones as wooden crates. */
function drawBlock(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  crate: boolean,
): void {
  const cx = col * TILE + TILE / 2;
  const cy = row * TILE + TILE / 2;
  drawBox(
    ctx,
    cx,
    cy,
    TILE / 2,
    TILE / 2,
    WALL_HEIGHT,
    crate ? RENDER.crateTop : RENDER.wallTop,
    crate ? RENDER.crateSide : RENDER.wallSide,
  );
  if (crate) {
    ctx.strokeStyle = RENDER.crateLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    line(
      ctx,
      project(cx - TILE / 2, cy, WALL_HEIGHT),
      project(cx + TILE / 2, cy, WALL_HEIGHT),
    );
    line(
      ctx,
      project(cx, cy - TILE / 2, WALL_HEIGHT),
      project(cx, cy + TILE / 2, WALL_HEIGHT),
    );
    ctx.stroke();
  }
}

/**
 * One tank: a shadow, two caterpillar tracks and a coloured hull that all turn
 * to face the driving direction, topped by a round turret whose barrel aims on
 * its own. The chassis angle snaps to eight directions (the four sides and the
 * four diagonals), like the driving in Wii Play.
 */
function drawTank(ctx: CanvasRenderingContext2D, tank: Tank): void {
  drawShadow(ctx, tank.x, tank.y, TANK_RADIUS);
  const chassis = snapChassis(tank.heading);
  drawTracks(ctx, tank, chassis);
  drawOrientedBox(
    ctx,
    tank.x,
    tank.y,
    RENDER.hullHalfX,
    RENDER.hullHalfY,
    chassis,
    BODY_HEIGHT,
    TANK_TOP[tank.kind],
    TANK_SIDE[tank.kind],
  );
  drawTurret(ctx, tank);
  drawBarrel(ctx, tank);
}

/** The two side tracks as low dark blocks with tread rungs, turned with the hull. */
function drawTracks(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  angle: number,
): void {
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const acrossX = -Math.sin(angle);
  const acrossY = Math.cos(angle);
  const sides = [-1, 1] as const;
  for (const dir of sides) {
    const cx = tank.x + acrossX * dir * RENDER.trackInset;
    const cy = tank.y + acrossY * dir * RENDER.trackInset;
    drawOrientedBox(
      ctx,
      cx,
      cy,
      RENDER.trackHalfX,
      RENDER.trackHalfY,
      angle,
      RENDER.trackHeight,
      RENDER.trackTop,
      RENDER.trackSide,
    );
    // Tread rungs run across the track, spaced along its length.
    ctx.strokeStyle = RENDER.tread;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < RENDER.treadCount; i++) {
      const along =
        (((i + RENDER.treadCenter) / RENDER.treadCount) * 2 - 1) *
        RENDER.trackHalfY;
      const mx = cx + forwardX * along;
      const my = cy + forwardY * along;
      line(
        ctx,
        project(
          mx + acrossX * RENDER.trackHalfX,
          my + acrossY * RENDER.trackHalfX,
          RENDER.trackHeight,
        ),
        project(
          mx - acrossX * RENDER.trackHalfX,
          my - acrossY * RENDER.trackHalfX,
          RENDER.trackHeight,
        ),
      );
    }
    ctx.stroke();
  }
}

/** Snaps a chassis angle to the nearest of eight compass directions. */
function snapChassis(angle: number): number {
  const step = (Math.PI * 2) / CHASSIS_DIRECTIONS;
  return Math.round(angle / step) * step;
}

/** The four world corners of a rectangle (across x along) rotated by `angle`. */
function rectCorners(
  cx: number,
  cy: number,
  halfAcross: number,
  halfAlong: number,
  angle: number,
): { x: number; y: number }[] {
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const acrossX = -Math.sin(angle);
  const acrossY = Math.cos(angle);
  return [
    {
      x: cx + forwardX * halfAlong + acrossX * halfAcross,
      y: cy + forwardY * halfAlong + acrossY * halfAcross,
    },
    {
      x: cx + forwardX * halfAlong - acrossX * halfAcross,
      y: cy + forwardY * halfAlong - acrossY * halfAcross,
    },
    {
      x: cx - forwardX * halfAlong - acrossX * halfAcross,
      y: cy - forwardY * halfAlong - acrossY * halfAcross,
    },
    {
      x: cx - forwardX * halfAlong + acrossX * halfAcross,
      y: cy - forwardY * halfAlong + acrossY * halfAcross,
    },
  ];
}

/**
 * A rotated block: its footprint is drawn at the floor in the side colour and
 * again raised by `height` in the top colour, so the sliver left uncovered on
 * the near side reads as the front face - at any turn angle.
 */
function drawOrientedBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfAcross: number,
  halfAlong: number,
  angle: number,
  height: number,
  top: string,
  side: string,
): void {
  const corners = rectCorners(cx, cy, halfAcross, halfAlong, angle);
  fillFace(ctx, corners, 0, side);
  fillFace(ctx, corners, height, top, RENDER.outline);
}

/** Fills the projected polygon of world `corners` at height `z`. */
function fillFace(
  ctx: CanvasRenderingContext2D,
  corners: readonly { x: number; y: number }[],
  z: number,
  fill: string,
  stroke?: string,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  corners.forEach((corner, index) => {
    const p = project(corner.x, corner.y, z);
    if (index === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  });
  ctx.closePath();
  ctx.fill();
  if (stroke !== undefined) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** The round turret sitting on the hull, drawn as a short cylinder. */
function drawTurret(ctx: CanvasRenderingContext2D, tank: Tank): void {
  const radiusX = RENDER.turretRadius;
  const radiusY = RENDER.turretRadius * DEPTH;
  const foot = project(tank.x, tank.y, BODY_HEIGHT);
  const crown = project(tank.x, tank.y, BODY_HEIGHT + RENDER.turretRise);

  // Cylinder wall: the darker side colour between the two rims.
  ctx.fillStyle = TANK_SIDE[tank.kind];
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(crown.x - radiusX, crown.y, radiusX * 2, foot.y - crown.y);

  // Lit top face.
  ctx.fillStyle = TANK_TOP[tank.kind];
  ctx.strokeStyle = RENDER.outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(crown.x, crown.y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** The gun barrel from the turret crown, with a muzzle cap. */
function drawBarrel(ctx: CanvasRenderingContext2D, tank: Tank): void {
  const height = BODY_HEIGHT + RENDER.turretRise;
  const base = project(tank.x, tank.y, height);
  const tip = project(
    tank.x + Math.cos(tank.turret) * RENDER.barrelLen,
    tank.y + Math.sin(tank.turret) * RENDER.barrelLen,
    height,
  );
  ctx.strokeStyle = RENDER.outline;
  ctx.lineWidth = RENDER.barrelWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  ctx.fillStyle = RENDER.outline;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, RENDER.muzzleRadius, 0, Math.PI * 2);
  ctx.fill();
}

/** One shell: a shadow and a small dark ball floating above the floor. */
function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
  drawShadow(ctx, bullet.x, bullet.y, RENDER.bulletRadius);
  const p = project(bullet.x, bullet.y, BULLET_HEIGHT);
  ctx.fillStyle = RENDER.bullet;
  ctx.strokeStyle = RENDER.bulletRing;
  ctx.lineWidth = RENDER.bulletRingWidth;
  ctx.beginPath();
  ctx.arc(p.x, p.y, RENDER.bulletRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * A ticking mine: a yellow disc that blinks red/yellow in its final second.
 *
 * @remarks
 * No danger ring is drawn - the blast radius is deliberately not shown.
 */
function drawMine(
  ctx: CanvasRenderingContext2D,
  mine: Mine,
  time: number,
): void {
  const untilBlast = mine.explodeAt - time;
  const flashing =
    untilBlast <= RENDER.mineBlinkLead &&
    Math.floor(time * RENDER.mineBlinkHz) % 2 === 0;
  const p = project(mine.x, mine.y, 1);
  ctx.fillStyle = flashing ? RENDER.mineBlink : RENDER.mineCore;
  ctx.strokeStyle = RENDER.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(
    p.x,
    p.y,
    RENDER.mineRadius,
    RENDER.mineRadius * DEPTH,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
}

/** A fading blast on the floor. */
function drawExplosion(
  ctx: CanvasRenderingContext2D,
  blast: Explosion,
  time: number,
): void {
  const life = Math.max(0, blast.until - time);
  const alpha = Math.min(1, life * RENDER.fadeSpeed);
  const p = project(blast.x, blast.y, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.scale(1, DEPTH);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, MINE_RADIUS);
  gradient.addColorStop(0, RENDER.blastCore);
  gradient.addColorStop(1, RENDER.blast);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, MINE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A soft shadow ellipse on the floor under a raised object. */
function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  const p = project(x, y, 0);
  ctx.fillStyle = RENDER.shadow;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, radius, radius * DEPTH, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Adds a line segment between two screen points to the current path. */
function line(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
): void {
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
}
