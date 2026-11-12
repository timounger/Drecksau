/**
 * The buildings and defences, seen from above with a little height:
 * shadows, walls, snowy roofs, turning turrets, building sites and damage.
 *
 * @module
 */
import { STRUCTURES } from "@/games/frost-fortress/engine/structures";
import { TILE } from "@/games/frost-fortress/engine/map";
import type {
  Structure,
  StructureKind,
} from "@/games/frost-fortress/engine/types";

/** What changes a structure's picture besides its kind. */
export type StructureLook = {
  readonly level: number;
  /** Where the turret points. */
  readonly aim: number;
  /** Real seconds, for animation. */
  readonly clock: number;
  /** Seconds the weapon has been firing. */
  readonly firing: number;
  /** Share of hit points left. */
  readonly health: number;
  /** Mines left, for minefields. */
  readonly charges: number;
  /** How dark it is, for lit windows. */
  readonly dark: number;
  /** Seconds since the last hit, for the flash. */
  readonly hitAgo: number;
};

/** Walls next to a wall, as bits: right 1, down 2, left 4, up 8. */
export type WallLinks = number;

/** Below this share of hit points a structure smokes. */
const SMOKING = 0.5;

/** Colour of the level pips. */
const PIP = "#facc15";

/**
 * Paints a structure at its place (world transform set).
 *
 * @param ctx - the canvas
 * @param structure - the structure
 * @param look - its state
 * @param links - for walls, which neighbours are walls too
 */
export function drawStructure(
  ctx: CanvasRenderingContext2D,
  structure: Structure,
  look: StructureLook,
  links: WallLinks,
): void {
  const def = STRUCTURES[structure.kind];
  const x = structure.col * TILE;
  const y = structure.row * TILE;
  const w = def.width * TILE;
  const h = def.height * TILE;
  if (!structure.built) {
    drawSite(ctx, structure.kind, x, y, w, h, structure.progress, look);
  } else {
    drawShape(ctx, structure.kind, x, y, w, h, look, links);
    if (structure.upgrading) {
      drawScaffold(ctx, x, y, w, h, structure.progress, look.clock);
    }
    if (
      look.health < SMOKING &&
      structure.kind !== "wall" &&
      structure.kind !== "minefield"
    ) {
      drawDamage(ctx, x, y, w, h, look);
    }
  }
}

/**
 * Paints a kind of structure as finished, e.g. for the placement ghost or a
 * menu icon.
 *
 * @param ctx - the canvas
 * @param kind - which structure
 * @param x - left edge, world units
 * @param y - top edge, world units
 * @param look - its state
 */
export function drawKind(
  ctx: CanvasRenderingContext2D,
  kind: StructureKind,
  x: number,
  y: number,
  look: StructureLook,
): void {
  const def = STRUCTURES[kind];
  drawShape(ctx, kind, x, y, def.width * TILE, def.height * TILE, look, 0);
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the drawings:
   proportions and colours of every building */

/** The finished picture of a kind. */
function drawShape(
  ctx: CanvasRenderingContext2D,
  kind: StructureKind,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
  links: WallLinks,
): void {
  const flash = look.hitAgo < 0.12;
  switch (kind) {
    case "hq":
      drawHq(ctx, x, y, w, h, look);
      break;
    case "warehouse":
      drawHouse(ctx, x, y, w, h, "#7c5a3a", "#a97c50", look);
      crates(ctx, x + w * 0.62, y + h * 0.58);
      break;
    case "barracks":
      drawHouse(ctx, x, y, w, h, "#4d5a36", "#6b7a46", look);
      flag(ctx, x + w * 0.8, y + h * 0.18, "#2563eb", look.clock);
      stripes(ctx, x + w * 0.2, y + h * 0.45, w * 0.6);
      break;
    case "workshop":
      drawHouse(ctx, x, y, w, h, "#7a4e2d", "#9a6a43", look);
      gear(ctx, x + w * 0.42, y + h * 0.48, 8, look.clock);
      chimney(ctx, x + w * 0.76, y + h * 0.2, look.clock);
      break;
    case "generator":
      drawGenerator(ctx, x, y, w, h, look);
      break;
    case "mine":
      drawMine(ctx, x, y, w, h, look);
      break;
    case "lumberCamp":
      drawLumber(ctx, x, y, w, h, look);
      break;
    case "lab":
      drawLab(ctx, x, y, w, h, look);
      break;
    case "infirmary":
      drawHouse(ctx, x, y, w, h, "#d6dde6", "#f1f5f9", look);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(x + w / 2 - 4, y + h * 0.42 - 11, 8, 22);
      ctx.fillRect(x + w / 2 - 11, y + h * 0.42 - 4, 22, 8);
      break;
    case "wall":
      drawWall(ctx, x, y, w, h, look.level, links);
      break;
    case "minefield":
      drawMinefield(ctx, x, y, w, h, look);
      break;
    default:
      drawTower(ctx, kind, x, y, w, h, look);
  }
  if (flash) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }
  if (kind !== "wall" && kind !== "minefield") {
    pips(ctx, x + 4, y + h - 6, look.level);
  }
}

/** A drop shadow to the lower right. */
function shadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = "rgba(40,60,90,0.22)";
  ctx.fillRect(x + 6, y + 6, w - 4, h - 4);
}

/** A plain building: walls, a snowy roof, lit windows at night. */
function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  wall: string,
  roof: string,
  look: StructureLook,
): void {
  shadow(ctx, x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = wall;
  ctx.fillRect(x + 4, y + 8, w - 8, h - 12);
  ctx.fillStyle = roof;
  ctx.fillRect(x + 3, y + 4, w - 6, h * 0.62);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(x + 3, y + 4 + h * 0.31, w - 6, h * 0.31);
  ctx.fillStyle = "rgba(250,252,255,0.9)";
  ctx.fillRect(x + 3, y + 4, w - 6, 5);
  ctx.fillRect(x + 3, y + 4 + h * 0.31 - 2, w - 6, 3);
  const glow = 0.35 + look.dark * 0.6;
  ctx.fillStyle = `rgba(255,214,120,${glow})`;
  for (let index = 0; index < 3; index += 1) {
    ctx.fillRect(x + 10 + index * ((w - 26) / 2), y + h * 0.72, 6, 5);
  }
}

/** The headquarters: a fortified hall with a tower, a flag and an antenna. */
function drawHq(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  shadow(ctx, x, y, w, h);
  ctx.fillStyle = "#3f4a5c";
  ctx.fillRect(x + 4, y + 6, w - 8, h - 10);
  ctx.fillStyle = "#5b6b82";
  ctx.fillRect(x + 6, y + 6, w - 12, h * 0.55);
  ctx.fillStyle = "rgba(250,252,255,0.92)";
  ctx.fillRect(x + 6, y + 6, w - 12, 7);
  // Corner bastions.
  for (const [cx, cy] of [
    [x + 8, y + 8],
    [x + w - 8, y + 8],
    [x + 8, y + h - 10],
    [x + w - 8, y + h - 10],
  ]) {
    ctx.fillStyle = "#2f3847";
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(250,252,255,0.9)";
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Central keep.
  ctx.fillStyle = "#263040";
  ctx.fillRect(x + w / 2 - 14, y + h / 2 - 18, 28, 30);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(x + w / 2 - 12, y + h / 2 - 20, 24, 14);
  ctx.fillStyle = "rgba(250,252,255,0.95)";
  ctx.fillRect(x + w / 2 - 12, y + h / 2 - 20, 24, 4);
  const glow = 0.4 + look.dark * 0.6;
  ctx.fillStyle = `rgba(255,214,120,${glow})`;
  for (let index = 0; index < 4; index += 1) {
    ctx.fillRect(x + 16 + index * ((w - 38) / 3), y + h * 0.74, 6, 6);
  }
  ctx.fillRect(x + w / 2 - 3, y + h / 2 - 2, 6, 8);
  // Antenna with a blinking light.
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 8, y + h / 2 - 18);
  ctx.lineTo(x + w / 2 + 8, y + h / 2 - 34);
  ctx.stroke();
  ctx.fillStyle = Math.sin(look.clock * 4) > 0 ? "#ef4444" : "#7f1d1d";
  ctx.beginPath();
  ctx.arc(x + w / 2 + 8, y + h / 2 - 35, 2.5, 0, Math.PI * 2);
  ctx.fill();
  flag(ctx, x + w / 2 - 8, y + h / 2 - 20, "#38bdf8", look.clock);
}

/** The generator: a box with a spinning turbine. */
function drawGenerator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  shadow(ctx, x, y, w, h);
  ctx.fillStyle = "#475569";
  ctx.fillRect(x + 4, y + 6, w - 8, h - 10);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(x + 4, y + 4, w - 8, h * 0.5);
  ctx.fillStyle = "rgba(250,252,255,0.9)";
  ctx.fillRect(x + 4, y + 4, w - 8, 4);
  const cx = x + w * 0.36;
  const cy = y + h * 0.46;
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 3;
  for (let blade = 0; blade < 3; blade += 1) {
    const angle = look.clock * 9 + (blade * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 11, cy + Math.sin(angle) * 11);
    ctx.stroke();
  }
  // Lightning sign.
  ctx.fillStyle = "#facc15";
  const lx = x + w * 0.74;
  const ly = y + h * 0.36;
  ctx.beginPath();
  ctx.moveTo(lx + 2, ly - 9);
  ctx.lineTo(lx - 5, ly + 1);
  ctx.lineTo(lx, ly + 1);
  ctx.lineTo(lx - 2, ly + 9);
  ctx.lineTo(lx + 5, ly - 1);
  ctx.lineTo(lx, ly - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(250,204,21,${0.25 + 0.2 * Math.sin(look.clock * 6)})`;
  ctx.beginPath();
  ctx.arc(lx, ly, 12, 0, Math.PI * 2);
  ctx.fill();
}

/** The mine: a pit, a headframe and an ore cart. */
function drawMine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  shadow(ctx, x, y, w, h);
  ctx.fillStyle = "#57534e";
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = "#292524";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.4, y + h * 0.6, w * 0.22, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Headframe.
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, y + h * 0.66);
  ctx.lineTo(x + w * 0.4, y + h * 0.16);
  ctx.lineTo(x + w * 0.58, y + h * 0.66);
  ctx.stroke();
  ctx.fillStyle = "#1c1917";
  ctx.beginPath();
  ctx.arc(x + w * 0.4, y + h * 0.18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d6d3d1";
  ctx.lineWidth = 1;
  const angle = look.clock * 5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.4, y + h * 0.18);
  ctx.lineTo(
    x + w * 0.4 + Math.cos(angle) * 5,
    y + h * 0.18 + Math.sin(angle) * 5,
  );
  ctx.stroke();
  // Cart with ore.
  ctx.fillStyle = "#44403c";
  ctx.fillRect(x + w * 0.66, y + h * 0.56, 14, 9);
  ctx.fillStyle = "#c2683a";
  ctx.beginPath();
  ctx.arc(x + w * 0.66 + 7, y + h * 0.56, 6, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "rgba(250,252,255,0.85)";
  ctx.fillRect(x + 4, y + 4, w - 8, 4);
}

/** The lumber camp: a log hut, a woodpile and a saw. */
function drawLumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  drawHouse(ctx, x, y, w * 0.62, h, "#6b4a2e", "#8b6239", look);
  shadow(ctx, x + w * 0.6, y + h * 0.3, w * 0.38, h * 0.55);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3 - row; col += 1) {
      const lx = x + w * 0.68 + col * 7 + row * 3.5;
      const ly = y + h * 0.72 - row * 7;
      ctx.fillStyle = "#92673f";
      ctx.beginPath();
      ctx.arc(lx, ly, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e3c08f";
      ctx.beginPath();
      ctx.arc(lx, ly, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.save();
  ctx.translate(x + w * 0.8, y + h * 0.28);
  ctx.rotate(look.clock * 8);
  ctx.fillStyle = "#cbd5e1";
  ctx.beginPath();
  for (let tooth = 0; tooth < 10; tooth += 1) {
    const angle = (tooth / 10) * Math.PI * 2;
    ctx.lineTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
    ctx.lineTo(Math.cos(angle + 0.3) * 5, Math.sin(angle + 0.3) * 5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The research centre: a dome with a dish and a blinking light. */
function drawLab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  shadow(ctx, x, y, w, h);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(x + 4, y + 8, w - 8, h - 12);
  const cx = x + w * 0.42;
  const cy = y + h * 0.48;
  const dome = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, 20);
  dome.addColorStop(0, "#f0fdfa");
  dome.addColorStop(1, "#5eead4");
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(cx, cy, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(15,118,110,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 19, 0, Math.PI * 2);
  ctx.moveTo(cx - 19, cy);
  ctx.lineTo(cx + 19, cy);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + w * 0.78, y + h * 0.3);
  ctx.rotate(Math.sin(look.clock * 0.7) * 0.8);
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.fillRect(-1, -1, 8, 2);
  ctx.restore();
  ctx.fillStyle = Math.sin(look.clock * 3) > 0.3 ? "#22d3ee" : "#155e75";
  ctx.beginPath();
  ctx.arc(cx, cy - 19, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/** A tower: platform plus the turret of its kind, turned to its aim. */
function drawTower(
  ctx: CanvasRenderingContext2D,
  kind: StructureKind,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  shadow(ctx, x + 2, y + 2, w - 4, h - 4);
  // Octagonal concrete platform.
  ctx.fillStyle = "#6b7280";
  octagon(ctx, cx, cy, w * 0.47);
  ctx.fill();
  ctx.fillStyle = "#9ca3af";
  octagon(ctx, cx, cy - 2, w * 0.42);
  ctx.fill();
  ctx.fillStyle = "rgba(250,252,255,0.75)";
  octagon(ctx, cx - 2, cy - 5, w * 0.3);
  ctx.fill();
  ctx.save();
  ctx.translate(cx, cy - 2);
  switch (kind) {
    case "machineGun":
      turretMg(ctx, look);
      break;
    case "cannon":
      turretCannon(ctx, look);
      break;
    case "sniper":
      turretSniper(ctx, look);
      break;
    case "tesla":
      turretTesla(ctx, look);
      break;
    case "flamethrower":
      turretFlame(ctx, look);
      break;
    default:
      break;
  }
  ctx.restore();
}

/** Twin machine guns. */
function turretMg(ctx: CanvasRenderingContext2D, look: StructureLook): void {
  ctx.rotate(look.aim);
  ctx.fillStyle = "#3f4d3a";
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f2937";
  const recoil = look.firing > 0 ? 2 : 0;
  ctx.fillRect(6 - recoil, -5, 17, 3);
  ctx.fillRect(6 - recoil, 2, 17, 3);
  ctx.fillStyle = "#55664d";
  ctx.fillRect(-7, -7, 12, 14);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(-6, -6, 10, 3);
}

/** A heavy cannon. */
function turretCannon(
  ctx: CanvasRenderingContext2D,
  look: StructureLook,
): void {
  ctx.rotate(look.aim);
  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  const recoil = look.firing > 1.4 ? 4 : 0;
  ctx.fillStyle = "#111827";
  ctx.fillRect(4 - recoil, -4.5, 22, 9);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(22 - recoil, -6, 5, 12);
  ctx.fillStyle = "#4b5563";
  ctx.beginPath();
  ctx.arc(-2, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(-4, -3, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** A long rifle with a scope that glints. */
function turretSniper(
  ctx: CanvasRenderingContext2D,
  look: StructureLook,
): void {
  ctx.fillStyle = "#4b5d45";
  ctx.fillRect(-12, -12, 24, 24);
  ctx.fillStyle = "rgba(250,252,255,0.85)";
  ctx.fillRect(-12, -12, 24, 6);
  ctx.rotate(look.aim);
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(0, -1.6, 30, 3.2);
  ctx.fillStyle = "#57534e";
  ctx.fillRect(-6, -4, 14, 8);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(4, -5.5, 9, 3);
  if (Math.sin(look.clock * 2.3) > 0.92) {
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(13, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A Tesla coil with rings and a crackling top. */
function turretTesla(ctx: CanvasRenderingContext2D, look: StructureLook): void {
  ctx.fillStyle = "#1e3a5f";
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.strokeStyle = ring === 2 ? "#7dd3fc" : "#94a3b8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -ring * 3, 10 - ring * 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  const pulse = 0.5 + 0.5 * Math.sin(look.clock * 7);
  const glow = ctx.createRadialGradient(0, -8, 0, 0, -8, 14);
  glow.addColorStop(0, `rgba(186,230,253,${0.6 + pulse * 0.4})`);
  glow.addColorStop(1, "rgba(56,189,248,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -8, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(224,242,254,${pulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const angle = look.clock * 13;
  ctx.moveTo(0, -8);
  ctx.lineTo(Math.cos(angle) * 9, -8 + Math.sin(angle) * 9);
  ctx.stroke();
}

/** A flamethrower with its tank and a pilot flame. */
function turretFlame(ctx: CanvasRenderingContext2D, look: StructureLook): void {
  ctx.rotate(look.aim);
  ctx.fillStyle = "#7c2d12";
  ctx.beginPath();
  ctx.arc(-4, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ea580c";
  ctx.beginPath();
  ctx.arc(-6, -4, 6, 0, Math.PI * 2);
  ctx.arc(-6, 5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#292524";
  ctx.fillRect(2, -3, 18, 6);
  const flicker = 2 + Math.random() * 2;
  ctx.fillStyle = look.firing > 0 ? "#fde047" : "#60a5fa";
  ctx.beginPath();
  ctx.arc(22, 0, flicker, 0, Math.PI * 2);
  ctx.fill();
}

/** A minefield: a patch of disturbed snow with small mines. */
function drawMinefield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  ctx.strokeStyle = "rgba(180,83,9,0.55)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.setLineDash([]);
  const spots = [
    [0.28, 0.3],
    [0.7, 0.28],
    [0.5, 0.55],
    [0.25, 0.75],
    [0.74, 0.74],
    [0.5, 0.22],
  ];
  for (let index = 0; index < spots.length; index += 1) {
    const armed = index < look.charges;
    const sx = x + w * spots[index][0];
    const sy = y + h * spots[index][1];
    ctx.fillStyle = armed ? "#3f3f46" : "rgba(63,63,70,0.25)";
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    if (armed && Math.sin(look.clock * 3 + index) > 0.7) {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
  }
  ctx.fillStyle = "#b45309";
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.fillText("⚠", x + 3, y + 11);
}

/** A wall block, joined to its neighbours; the level changes the material. */
function drawWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  level: number,
  links: WallLinks,
): void {
  const faces = ["#9ca3af", "#78716c", "#64748b", "#7dd3fc"];
  const tops = ["#d1d5db", "#a8a29e", "#94a3b8", "#bae6fd"];
  const face = faces[Math.min(faces.length - 1, level - 1)];
  const top = tops[Math.min(tops.length - 1, level - 1)];
  ctx.fillStyle = "rgba(40,60,90,0.25)";
  ctx.fillRect(x + 5, y + 7, w - 6, h - 6);
  const inset = 5;
  let left = x + inset;
  let right = x + w - inset;
  let upper = y + inset;
  let lower = y + h - inset;
  if (links & 1) right = x + w;
  if (links & 4) left = x;
  if (links & 8) upper = y;
  if (links & 2) lower = y + h;
  ctx.fillStyle = face;
  ctx.fillRect(left, upper + 3, right - left, lower - upper - 3);
  ctx.fillStyle = top;
  ctx.fillRect(left, upper, right - left, lower - upper - 5);
  ctx.fillStyle = "rgba(250,252,255,0.9)";
  ctx.fillRect(left, upper, right - left, 3);
  if (level >= 2) {
    ctx.fillStyle = "rgba(30,41,59,0.55)";
    ctx.fillRect(x + w / 2 - 1, upper, 2, lower - upper - 5);
  }
  if (level >= 3) {
    ctx.fillStyle = "#334155";
    ctx.fillRect(x + w / 2 - 3, y + h / 2 - 3, 6, 6);
  }
}

/** A building site: outline, foundation, scaffold and the progress bar. */
function drawSite(
  ctx: CanvasRenderingContext2D,
  kind: StructureKind,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  look: StructureLook,
): void {
  ctx.fillStyle = "rgba(120,100,80,0.35)";
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.save();
  ctx.globalAlpha = 0.25 + progress * 0.6;
  ctx.beginPath();
  ctx.rect(x, y + h * (1 - progress), w, h * progress + 2);
  ctx.clip();
  drawShape(ctx, kind, x, y, w, h, look, 0);
  ctx.restore();
  ctx.strokeStyle = "#f59e0b";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.setLineDash([]);
  if (w > TILE) {
    drawScaffold(ctx, x, y, w, h, progress, look.clock);
  } else {
    bar(ctx, x + 2, y + h - 5, w - 4, progress, "#f59e0b");
  }
}

/** Scaffolding with a crane and a progress bar. */
function drawScaffold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  clock: number,
): void {
  ctx.strokeStyle = "rgba(180,120,40,0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h - 4);
  ctx.lineTo(x + 4, y + 6);
  ctx.lineTo(x + w * 0.5, y + 6);
  ctx.moveTo(x + 4, y + h * 0.5);
  ctx.lineTo(x + 14, y + 6);
  ctx.stroke();
  const swing = Math.sin(clock * 1.5) * 4;
  ctx.strokeStyle = "rgba(30,41,59,0.8)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.42 + swing, y + 6);
  ctx.lineTo(x + w * 0.42 + swing, y + 18);
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x + w * 0.42 + swing - 3, y + 18, 6, 4);
  bar(ctx, x + 6, y + h - 8, w - 12, progress, "#f59e0b");
}

/** Smoke and fire on a badly damaged structure. */
function drawDamage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  look: StructureLook,
): void {
  const strength = 1 - look.health / 0.5;
  for (let index = 0; index < 3; index += 1) {
    const t = (look.clock * 0.6 + index / 3) % 1;
    ctx.fillStyle = `rgba(60,60,70,${0.45 * (1 - t) * (0.4 + strength)})`;
    ctx.beginPath();
    ctx.arc(
      x + w * (0.3 + index * 0.2) + t * 6,
      y + h * 0.4 - t * 26,
      5 + t * 9,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  if (look.health < 0.25) {
    ctx.fillStyle = Math.random() > 0.5 ? "#fb923c" : "#fde047";
    ctx.beginPath();
    ctx.arc(x + w * 0.45, y + h * 0.42, 3 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A small bar, for hit points and progress.
 *
 * @param ctx - the canvas
 * @param x - left
 * @param y - top
 * @param w - full width
 * @param share - filled share
 * @param color - fill colour
 */
export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  share: number,
  color: string,
): void {
  ctx.fillStyle = "rgba(15,23,42,0.7)";
  ctx.fillRect(x - 1, y - 1, w + 2, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, share)), 3);
}

/** The level as little gold pips. */
function pips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
): void {
  for (let index = 0; index < level; index += 1) {
    ctx.fillStyle = "rgba(15,23,42,0.6)";
    ctx.fillRect(x + index * 6 - 1, y - 1, 5, 5);
    ctx.fillStyle = PIP;
    ctx.fillRect(x + index * 6, y, 3, 3);
  }
}

/** A waving flag on a pole. */
function flag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  clock: number,
): void {
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  const wave = Math.sin(clock * 5) * 2;
  ctx.quadraticCurveTo(x + 6, y - 20 + wave, x + 12, y - 16 + wave);
  ctx.lineTo(x + 12, y - 10 + wave);
  ctx.quadraticCurveTo(x + 6, y - 14 + wave, x, y - 11);
  ctx.closePath();
  ctx.fill();
}

/** A stack of crates. */
function crates(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  for (const [dx, dy] of [
    [0, 0],
    [9, 2],
    [4, -7],
  ]) {
    ctx.fillStyle = "#b7884f";
    ctx.fillRect(x + dx, y + dy, 9, 8);
    ctx.strokeStyle = "#6b4a2b";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + dx, y + dy, 9, 8);
  }
}

/** Camouflage stripes on the barracks roof. */
function stripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
): void {
  ctx.fillStyle = "rgba(30,40,20,0.45)";
  for (let index = 0; index < 3; index += 1) {
    ctx.fillRect(x + index * (w / 3), y - 10, w / 6, 3);
  }
}

/** A turning gear. */
function gear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  clock: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(clock * 1.5);
  ctx.fillStyle = "#d4d4d8";
  ctx.beginPath();
  for (let tooth = 0; tooth < 8; tooth += 1) {
    const angle = (tooth / 8) * Math.PI * 2;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.lineTo(
      Math.cos(angle + 0.25) * radius * 0.7,
      Math.sin(angle + 0.25) * radius * 0.7,
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#52525b";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A chimney with a little smoke. */
function chimney(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  clock: number,
): void {
  ctx.fillStyle = "#44403c";
  ctx.fillRect(x - 3, y - 4, 7, 10);
  for (let index = 0; index < 3; index += 1) {
    const t = (clock * 0.5 + index / 3) % 1;
    ctx.fillStyle = `rgba(120,120,130,${0.4 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(x + t * 8, y - 6 - t * 20, 3 + t * 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** An eight-sided outline. */
function octagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.beginPath();
  for (let side = 0; side < 8; side += 1) {
    const angle = (side / 8) * Math.PI * 2 + Math.PI / 8;
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
