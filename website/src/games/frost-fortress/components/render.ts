/**
 * One frame of Frost Fortress: the camera, the snowfield, structures,
 * figures, effects, the night with its lights, the blizzard and the
 * placement preview.
 *
 * @module
 * @remarks
 * Only what is in view is drawn. The darkness is painted at a quarter of the
 * screen's resolution and stretched - soft light needs no sharp pixels, and
 * it is the most expensive layer otherwise.
 */
import { placeProblem } from "@/games/frost-fortress/engine/build";
import { centreOf } from "@/games/frost-fortress/engine/combat";
import { siteYield } from "@/games/frost-fortress/engine/economy";
import {
  hqCentre,
  MAP_COLS,
  MAP_ROWS,
  TILE,
} from "@/games/frost-fortress/engine/map";
import {
  buildRadius,
  darkness,
  gloom,
  maxHp,
  weaponStats,
} from "@/games/frost-fortress/engine/modifiers";
import { soldierHp } from "@/games/frost-fortress/engine/combat";
import { runtimeOf, structureAt } from "@/games/frost-fortress/engine/runtime";
import {
  LUMBER_REACH,
  STRUCTURES,
} from "@/games/frost-fortress/engine/structures";
import type {
  Game,
  Structure,
  StructureKind,
} from "@/games/frost-fortress/engine/types";
import { PLACE_PROBLEMS } from "@/games/frost-fortress/i18n/texts";
import type { Effects } from "./effects";
import { drawBadge, showsBadge } from "./upgrade-badge";
import {
  createTerrainCache,
  drawTerrain,
  type TerrainCache,
} from "./render-terrain";
import {
  drawKind,
  drawStructure,
  type StructureLook,
} from "./render-structures";
import {
  drawDefender,
  drawDrop,
  drawEnemy,
  drawProjectile,
} from "./render-units";

/** Where the camera looks: the world point in the middle, and the zoom. */
export type Camera = { x: number; y: number; zoom: number };

/** Everything besides the game that a frame needs. */
export type FrameState = {
  readonly camera: Camera;
  /** Size of the canvas in CSS pixels. */
  readonly width: number;
  readonly height: number;
  /** Device pixels per CSS pixel. */
  readonly dots: number;
  /** The tile under the pointer, or null. */
  readonly hover: { col: number; row: number } | null;
  /** What is about to be placed, or null. */
  readonly placing: StructureKind | null;
  /** The level it is to be built at. */
  readonly placingLevel: number;
  /** The site being moved, or 0. */
  readonly moving: number;
  /** The selected structure, or 0. */
  readonly selected: number;
  /** Real seconds, for animation. */
  readonly clock: number;
};

/** A painter keeps what lasts between frames. */
export type Painter = {
  readonly draw: (
    ctx: CanvasRenderingContext2D,
    game: Game,
    frame: FrameState,
    effects: Effects,
  ) => void;
};

/** Smallest and largest zoom. */
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 2.2;

/** The light layer is this much coarser than the screen. */
const LIGHT_SCALE = 4;

/** Snowflakes on screen at calm and at full blizzard. */
const FLAKES_CALM = 90;
const FLAKES_STORM = 420;

/** Longest step of the snowfall, seconds. */
const LONGEST_STEP = 0.1;

/** A gate is shown this many seconds before its wave. */
const GATE_WARNING = 60;

/** A snowflake in screen space. */
type Flake = {
  x: number;
  y: number;
  speed: number;
  size: number;
  drift: number;
};

/**
 * Creates the painter for one map.
 *
 * @param seed - the map's seed
 * @returns the painter
 */
export function createPainter(seed: number): Painter {
  const terrain: TerrainCache = createTerrainCache(seed);
  const light = document.createElement("canvas");
  const flakes: Flake[] = Array.from({ length: FLAKES_STORM }, () =>
    newFlake(),
  );
  const order: Structure[] = [];
  let lastClock = 0;

  const draw = (
    ctx: CanvasRenderingContext2D,
    game: Game,
    frame: FrameState,
    effects: Effects,
  ): void => {
    const { camera, width, height, dots } = frame;
    const dt = Math.min(LONGEST_STEP, Math.max(0, frame.clock - lastClock));
    lastClock = frame.clock;
    ctx.setTransform(dots, 0, 0, dots, 0, 0);
    ctx.fillStyle = "#b8c7d9";
    ctx.fillRect(0, 0, width, height);
    const left = camera.x - width / 2 / camera.zoom;
    const top = camera.y - height / 2 / camera.zoom;
    const right = left + width / camera.zoom;
    const bottom = top + height / camera.zoom;
    ctx.setTransform(
      dots * camera.zoom,
      0,
      0,
      dots * camera.zoom,
      -left * dots * camera.zoom,
      -top * dots * camera.zoom,
    );
    drawTerrain(ctx, terrain, left, top, right, bottom);
    drawEdge(ctx);
    drawGates(ctx, game, frame.clock);
    if (frame.placing !== null || frame.moving !== 0) {
      drawBuildArea(ctx, game);
    }
    drawStructures(ctx, game, frame, order, left, top, right, bottom);
    for (const drop of game.drops) {
      if (inView(drop.x, drop.y, left, top, right, bottom)) {
        drawDrop(ctx, drop, frame.clock);
      }
    }
    const runtime = runtimeOf(game);
    for (const unit of game.defenders) {
      if (inView(unit.x, unit.y, left, top, right, bottom)) {
        const home = runtime.byId.get(unit.home);
        drawDefender(
          ctx,
          unit,
          home === undefined ? 1 : unit.hp / soldierHp(home),
          camera.zoom,
        );
      }
    }
    for (const enemy of game.enemies) {
      if (enemy.alive && inView(enemy.x, enemy.y, left, top, right, bottom)) {
        drawEnemy(ctx, enemy, camera.zoom, frame.clock);
      }
    }
    for (const shell of game.projectiles) {
      drawProjectile(ctx, shell);
    }
    effects.draw(ctx, camera.zoom);
    if (frame.placing === null && frame.moving === 0) {
      for (const structure of order) {
        if (showsBadge(game, structure)) {
          drawBadge(ctx, structure, camera.zoom, frame.clock);
        }
      }
    }
    drawSelection(ctx, game, frame);
    drawPreview(ctx, game, frame);
    // Screen-space layers.
    ctx.setTransform(dots, 0, 0, dots, 0, 0);
    drawLight(ctx, light, game, frame, left, top);
    drawSnow(ctx, flakes, game.weather.storm, width, height, dt, frame.clock);
  };

  return { draw };
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the painting:
   colours, alphas and sizes of overlays */

/** A random snowflake. */
function newFlake(): Flake {
  return {
    x: Math.random(),
    y: Math.random(),
    speed: 0.04 + Math.random() * 0.08,
    size: 1 + Math.random() * 2,
    drift: Math.random() * Math.PI * 2,
  };
}

/** Whether a point is in view, with a margin. */
function inView(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
): boolean {
  const margin = TILE * 2;
  return (
    x > left - margin &&
    x < right + margin &&
    y > top - margin &&
    y < bottom + margin
  );
}

/** A dark rim around the map. */
function drawEdge(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(30,41,59,0.35)";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, MAP_COLS * TILE, MAP_ROWS * TILE);
}

/** The gates of the coming or running wave, pulsing red. */
function drawGates(
  ctx: CanvasRenderingContext2D,
  game: Game,
  clock: number,
): void {
  const due = game.wave.active || game.wave.countdown < GATE_WARNING;
  if (due) {
    const pulse = 0.5 + 0.5 * Math.sin(clock * 4);
    for (const gate of game.wave.gates) {
      const x = gate.col * TILE + TILE / 2;
      const y = gate.row * TILE + TILE / 2;
      const glow = ctx.createRadialGradient(x, y, 4, x, y, TILE * 3);
      glow.addColorStop(0, `rgba(239,68,68,${0.45 + pulse * 0.3})`);
      glow.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, TILE * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(185,28,28,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, TILE * (1 + pulse * 0.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#7f1d1d";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", x, y + 8);
    }
  }
}

/** The dashed circle of where building is allowed. */
function drawBuildArea(ctx: CanvasRenderingContext2D, game: Game): void {
  const centre = hqCentre();
  const x = centre.col * TILE + TILE / 2;
  const y = centre.row * TILE + TILE / 2;
  ctx.fillStyle = "rgba(56,189,248,0.06)";
  ctx.beginPath();
  ctx.arc(x, y, buildRadius(game) * TILE, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(14,116,144,0.6)";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
}

/** All structures in view, flat ones first, then from back to front. */
function drawStructures(
  ctx: CanvasRenderingContext2D,
  game: Game,
  frame: FrameState,
  order: Structure[],
  left: number,
  top: number,
  right: number,
  bottom: number,
): void {
  order.length = 0;
  for (const structure of game.structures) {
    const centre = centreOf(structure);
    if (inView(centre.x, centre.y, left, top, right, bottom)) {
      order.push(structure);
    }
  }
  order.sort((a, b) => layer(a) - layer(b) || a.row - b.row);
  const dark = darkness(game);
  for (const structure of order) {
    if (structure.id !== frame.moving) {
      const look: StructureLook = {
        level: structure.level,
        aim: structure.aim,
        clock: frame.clock,
        firing: structure.firing,
        health: structure.hp / maxHp(game, structure),
        charges: structure.charges,
        dark,
        hitAgo: structure.hitAgo,
      };
      drawStructure(
        ctx,
        structure,
        look,
        structure.kind === "wall" ? wallLinks(game, structure) : 0,
      );
      const share = look.health;
      if (structure.built && share < 0.999 && structure.kind !== "minefield") {
        const def = STRUCTURES[structure.kind];
        const w = def.width * TILE;
        ctx.fillStyle = "rgba(15,23,42,0.7)";
        ctx.fillRect(
          structure.col * TILE + 3,
          structure.row * TILE - 3,
          w - 6,
          4,
        );
        ctx.fillStyle =
          share > 0.5 ? "#22c55e" : share > 0.25 ? "#f59e0b" : "#ef4444";
        ctx.fillRect(
          structure.col * TILE + 4,
          structure.row * TILE - 2,
          (w - 8) * share,
          2,
        );
        if (structure.repairing > 0) {
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 11px system-ui, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(
            "\u{1F527}",
            structure.col * TILE + w - 12,
            structure.row * TILE + 10,
          );
        }
      }
    }
  }
}

/** Minefields and walls lie lowest. */
function layer(structure: Structure): number {
  return structure.kind === "minefield" ? 0 : structure.kind === "wall" ? 1 : 2;
}

/** Which neighbours of a wall are walls. */
function wallLinks(game: Game, wall: Structure): number {
  const isWall = (col: number, row: number) =>
    structureAt(game, col, row)?.kind === "wall";
  return (
    (isWall(wall.col + 1, wall.row) ? 1 : 0) |
    (isWall(wall.col, wall.row + 1) ? 2 : 0) |
    (isWall(wall.col - 1, wall.row) ? 4 : 0) |
    (isWall(wall.col, wall.row - 1) ? 8 : 0)
  );
}

/** The selected structure's outline and its reach. */
function drawSelection(
  ctx: CanvasRenderingContext2D,
  game: Game,
  frame: FrameState,
): void {
  const structure =
    frame.selected === 0 ? undefined : runtimeOf(game).byId.get(frame.selected);
  if (structure !== undefined && structure.id !== frame.moving) {
    const def = STRUCTURES[structure.kind];
    const centre = centreOf(structure);
    ctx.strokeStyle = "rgba(250,204,21,0.95)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -frame.clock * 20;
    ctx.strokeRect(
      structure.col * TILE - 2,
      structure.row * TILE - 2,
      def.width * TILE + 4,
      def.height * TILE + 4,
    );
    ctx.setLineDash([]);
    const reach =
      def.weapon !== undefined
        ? weaponStats(game, structure).range
        : (def.aura ?? 0);
    if (reach > 0) {
      circle(
        ctx,
        centre.x,
        centre.y,
        reach * TILE,
        def.weapon !== undefined ? "rgba(250,204,21," : "rgba(56,189,248,",
      );
    }
  }
}

/** A filled, outlined circle. */
function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: string,
): void {
  ctx.fillStyle = `${rgb}0.08)`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `${rgb}0.7)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** The ghost of what is being placed or moved, green where it fits, red where not. */
function drawPreview(
  ctx: CanvasRenderingContext2D,
  game: Game,
  frame: FrameState,
): void {
  const moved =
    frame.moving === 0 ? undefined : runtimeOf(game).byId.get(frame.moving);
  const kind = moved?.kind ?? frame.placing;
  if (kind !== null && kind !== undefined && frame.hover !== null) {
    const def = STRUCTURES[kind];
    const col = frame.hover.col - Math.floor((def.width - 1) / 2);
    const row = frame.hover.row - Math.floor((def.height - 1) / 2);
    const level = moved?.level ?? frame.placingLevel;
    const problem = placeProblem(game, kind, col, row, frame.moving, level);
    const ok = problem === null;
    const x = col * TILE;
    const y = row * TILE;
    const w = def.width * TILE;
    const h = def.height * TILE;
    ctx.globalAlpha = 0.6;
    drawKind(ctx, kind, x, y, {
      level,
      aim: -Math.PI / 2,
      clock: frame.clock,
      firing: 0,
      health: 1,
      charges: 3,
      dark: 0,
      hitAgo: 9,
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = ok ? "rgba(34,197,94,0.32)" : "rgba(239,68,68,0.38)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = ok ? "rgba(21,128,61,0.95)" : "rgba(185,28,28,0.95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;
    if (def.weapon !== undefined) {
      const probe = { ...(moved ?? makeProbe(kind)), col, row };
      circle(
        ctx,
        cx,
        cy,
        weaponStats(game, probe).range * TILE,
        ok ? "rgba(34,197,94," : "rgba(239,68,68,",
      );
    } else if (def.aura !== undefined) {
      circle(ctx, cx, cy, def.aura * TILE, "rgba(56,189,248,");
    } else if (kind === "lumberCamp") {
      circle(ctx, cx, cy, LUMBER_REACH * TILE, "rgba(34,120,80,");
    }
    let label = problem === null ? "" : PLACE_PROBLEMS[problem];
    if (ok && (kind === "lumberCamp" || kind === "mine")) {
      const site = siteYield(game.seed, kind, col, row);
      label =
        kind === "lumberCamp"
          ? `${Math.round(site.wood * 100)} %`
          : `Fe ${Math.round(site.iron * 100)} % · St ${Math.round(site.stone * 100)} %`;
    }
    if (label !== "") {
      ctx.font = `bold ${Math.round(12 / Math.max(0.7, frame.camera.zoom))}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 4 / Math.max(0.7, frame.camera.zoom);
      ctx.strokeStyle = "rgba(15,23,42,0.85)";
      ctx.strokeText(label, cx, y + h + 16);
      ctx.fillStyle = ok ? "#bbf7d0" : "#fecaca";
      ctx.fillText(label, cx, y + h + 16);
    }
  }
}

/** A stand-in structure, for the reach of something not yet placed. */
function makeProbe(kind: StructureKind): Structure {
  return {
    id: -1,
    kind,
    col: 0,
    row: 0,
    level: 1,
    hp: 1,
    built: true,
    progress: 1,
    upgrading: false,
    cooldown: 0,
    target: 0,
    aim: 0,
    charges: 0,
    repairing: 0,
    firing: 0,
    hitAgo: 9,
  };
}

/** The night and the blizzard: darkness with holes where there is light. */
function drawLight(
  ctx: CanvasRenderingContext2D,
  light: HTMLCanvasElement,
  game: Game,
  frame: FrameState,
  left: number,
  top: number,
): void {
  const amount = gloom(game);
  if (amount > 0.02) {
    const lw = Math.ceil(frame.width / LIGHT_SCALE);
    const lh = Math.ceil(frame.height / LIGHT_SCALE);
    if (light.width !== lw || light.height !== lh) {
      light.width = lw;
      light.height = lh;
    }
    const lctx = light.getContext("2d") as CanvasRenderingContext2D;
    lctx.globalCompositeOperation = "source-over";
    lctx.clearRect(0, 0, lw, lh);
    const storm = game.weather.storm;
    const night = darkness(game);
    lctx.fillStyle = `rgba(${Math.round(12 + storm * 150)},${Math.round(22 + storm * 160)},${Math.round(52 + storm * 160)},${Math.min(0.86, amount * 0.9)})`;
    lctx.fillRect(0, 0, lw, lh);
    lctx.globalCompositeOperation = "destination-out";
    const scale = frame.camera.zoom / LIGHT_SCALE;
    for (const structure of game.structures) {
      const def = STRUCTURES[structure.kind];
      const firing =
        structure.firing > 0 &&
        (structure.kind === "tesla" || structure.kind === "flamethrower");
      const radius = (def.light + (firing ? 2 : 0)) * TILE * scale;
      if (radius > 0) {
        const centre = centreOf(structure);
        const sx = (centre.x - left) * scale;
        const sy = (centre.y - top) * scale;
        if (
          sx > -radius &&
          sy > -radius &&
          sx < lw + radius &&
          sy < lh + radius
        ) {
          const glow = lctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
          glow.addColorStop(0, "rgba(0,0,0,0.95)");
          glow.addColorStop(0.6, "rgba(0,0,0,0.6)");
          glow.addColorStop(1, "rgba(0,0,0,0)");
          lctx.fillStyle = glow;
          lctx.beginPath();
          lctx.arc(sx, sy, radius, 0, Math.PI * 2);
          lctx.fill();
        }
      }
    }
    for (const shell of game.projectiles) {
      const sx = (shell.x - left) * scale;
      const sy = (shell.y - top) * scale;
      lctx.fillStyle = "rgba(0,0,0,0.5)";
      lctx.beginPath();
      lctx.arc(sx, sy, TILE * scale, 0, Math.PI * 2);
      lctx.fill();
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(light, 0, 0, frame.width, frame.height);
    if (night > 0.5) {
      // A warm tint where the lights are, so lit windows glow.
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

/** Falling snow, many more flakes and sideways in a blizzard. */
function drawSnow(
  ctx: CanvasRenderingContext2D,
  flakes: Flake[],
  storm: number,
  width: number,
  height: number,
  dt: number,
  clock: number,
): void {
  const count = Math.round(FLAKES_CALM + (FLAKES_STORM - FLAKES_CALM) * storm);
  const wind = 0.02 + storm * 0.5;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let index = 0; index < count; index += 1) {
    const flake = flakes[index];
    flake.y += flake.speed * dt * (1 + storm * 2);
    flake.x += (wind + Math.sin(clock + flake.drift) * 0.01) * dt;
    if (flake.y > 1) {
      flake.y -= 1;
      flake.x = Math.random();
    }
    if (flake.x > 1) {
      flake.x -= 1;
    }
    const size = flake.size * (1 + storm * 0.6);
    if (storm > 0.3) {
      ctx.fillRect(flake.x * width, flake.y * height, size * 3, size * 0.7);
    } else {
      ctx.fillRect(flake.x * width, flake.y * height, size, size);
    }
  }
  if (storm > 0.01) {
    ctx.fillStyle = `rgba(235,242,250,${storm * 0.22})`;
    ctx.fillRect(0, 0, width, height);
  }
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
