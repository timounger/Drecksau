/**
 * The snowfield painted once into tiles of 16 by 16 fields and then only
 * copied - snow, drifts, ice, rock, forest, ore and quarries.
 *
 * @module
 * @remarks
 * The terrain never changes during a game, so each chunk is drawn the first
 * time it comes into view and kept. A frame then costs a handful of
 * `drawImage` calls however far one zooms out.
 */
import { hash2 } from "@/games/frost-fortress/engine/random";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE,
  terrainOf,
} from "@/games/frost-fortress/engine/map";
import { Terrain } from "@/games/frost-fortress/engine/types";

/** Fields per chunk side. */
const CHUNK = 16;

/** Chunks across and down. */
const CHUNKS_X = Math.ceil(MAP_COLS / CHUNK);
const CHUNKS_Y = Math.ceil(MAP_ROWS / CHUNK);

/** Pixels of a chunk side. */
const CHUNK_PX = CHUNK * TILE;

/** The painted chunks of one map. */
export type TerrainCache = {
  readonly seed: number;
  readonly chunks: (HTMLCanvasElement | null)[];
};

/**
 * An empty cache for a map.
 *
 * @param seed - the map's seed
 * @returns the cache
 */
export function createTerrainCache(seed: number): TerrainCache {
  return {
    seed,
    chunks: new Array<HTMLCanvasElement | null>(CHUNKS_X * CHUNKS_Y).fill(null),
  };
}

/**
 * Draws the visible part of the terrain (the world transform is set).
 *
 * @param ctx - the canvas
 * @param cache - the painted chunks
 * @param left - visible area, world units
 * @param top - visible area, world units
 * @param right - visible area, world units
 * @param bottom - visible area, world units
 */
export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  cache: TerrainCache,
  left: number,
  top: number,
  right: number,
  bottom: number,
): void {
  const fromX = Math.max(0, Math.floor(left / CHUNK_PX));
  const toX = Math.min(CHUNKS_X - 1, Math.floor(right / CHUNK_PX));
  const fromY = Math.max(0, Math.floor(top / CHUNK_PX));
  const toY = Math.min(CHUNKS_Y - 1, Math.floor(bottom / CHUNK_PX));
  for (let cy = fromY; cy <= toY; cy += 1) {
    for (let cx = fromX; cx <= toX; cx += 1) {
      const index = cy * CHUNKS_X + cx;
      let chunk = cache.chunks[index];
      if (chunk === null) {
        chunk = paintChunk(cache.seed, cx, cy);
        cache.chunks[index] = chunk;
      }
      ctx.drawImage(chunk, cx * CHUNK_PX, cy * CHUNK_PX);
    }
  }
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the painting:
   colours, offsets and sizes of the snowfield */

/** Paints one chunk. */
function paintChunk(seed: number, cx: number, cy: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CHUNK_PX;
  canvas.height = CHUNK_PX;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const tiles = terrainOf(seed);
  const at = (col: number, row: number): Terrain =>
    col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS
      ? Terrain.Rock
      : (tiles[row * MAP_COLS + col] as Terrain);
  // Snow ground everywhere first, with soft unevenness.
  ctx.fillStyle = "#eaf1f8";
  ctx.fillRect(0, 0, CHUNK_PX, CHUNK_PX);
  for (let r = 0; r < CHUNK; r += 1) {
    for (let c = 0; c < CHUNK; c += 1) {
      const col = cx * CHUNK + c;
      const row = cy * CHUNK + r;
      const x = c * TILE;
      const y = r * TILE;
      const shade = hash2(col, row, seed);
      ctx.fillStyle = `rgba(${200 + shade * 30},${215 + shade * 25},${235 + shade * 15},0.14)`;
      ctx.fillRect(x, y, TILE, TILE);
      paintGround(ctx, at(col, row), x, y, col, row, seed, at);
    }
  }
  // Second pass for what stands up (trees, boulders), so it may overlap.
  for (let r = 0; r < CHUNK; r += 1) {
    for (let c = 0; c < CHUNK; c += 1) {
      const col = cx * CHUNK + c;
      const row = cy * CHUNK + r;
      const terrain = at(col, row);
      if (terrain === Terrain.Forest) {
        paintTrees(ctx, c * TILE, r * TILE, col, row, seed);
      } else if (terrain === Terrain.Rock) {
        paintRock(ctx, c * TILE, r * TILE, col, row, seed);
      }
    }
  }
  // Sparkles in the snow.
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let index = 0; index < 90; index += 1) {
    const sx = hash2(index, cx * 31 + cy, seed + 5) * CHUNK_PX;
    const sy = hash2(index, cy * 17 + cx, seed + 9) * CHUNK_PX;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  return canvas;
}

/** The flat part of a tile. */
function paintGround(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  x: number,
  y: number,
  col: number,
  row: number,
  seed: number,
  at: (col: number, row: number) => Terrain,
): void {
  const h = hash2(col, row, seed + 3);
  switch (terrain) {
    case Terrain.DeepSnow: {
      // A soft drift: bright crest, faint blue shadow on the lee side.
      const drift = ctx.createRadialGradient(
        x + 14,
        y + 14,
        2,
        x + 16,
        y + 16,
        24,
      );
      drift.addColorStop(0, "rgba(255,255,255,0.7)");
      drift.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = drift;
      ctx.fillRect(x - 8, y - 8, TILE + 16, TILE + 16);
      if (h > 0.55) {
        ctx.strokeStyle = "rgba(150,175,210,0.28)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 22 + h * 4);
        ctx.quadraticCurveTo(x + 16, y + 14 + h * 4, x + 28, y + 22 + h * 4);
        ctx.stroke();
      }
      break;
    }
    case Terrain.Ice: {
      ctx.fillStyle = "#bfe1f0";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x + h * 20, y + 4 + h * 10, 10, 2);
      ctx.strokeStyle = "rgba(120,170,200,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + h * TILE, y);
      ctx.lineTo(x + 16, y + 16);
      ctx.lineTo(x + TILE, y + h * TILE);
      ctx.stroke();
      // A snowy rim where the ice meets the shore.
      ctx.fillStyle = "rgba(240,248,255,0.85)";
      if (at(col, row - 1) !== Terrain.Ice) ctx.fillRect(x, y, TILE, 4);
      if (at(col, row + 1) !== Terrain.Ice)
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
      if (at(col - 1, row) !== Terrain.Ice) ctx.fillRect(x, y, 4, TILE);
      if (at(col + 1, row) !== Terrain.Ice)
        ctx.fillRect(x + TILE - 4, y, 4, TILE);
      break;
    }
    case Terrain.IronOre:
    case Terrain.StoneOre: {
      const iron = terrain === Terrain.IronOre;
      ctx.fillStyle = iron ? "rgba(120,72,48,0.35)" : "rgba(120,124,135,0.35)";
      ctx.fillRect(x, y, TILE, TILE);
      for (let index = 0; index < 4; index += 1) {
        const ox = hash2(col * 4 + index, row, seed + 13) * 24 + 4;
        const oy = hash2(col, row * 4 + index, seed + 17) * 24 + 4;
        const size = 3 + hash2(col + index, row - index, seed) * 4;
        ctx.fillStyle = iron ? "#7c3f22" : "#6b7280";
        ctx.beginPath();
        ctx.moveTo(x + ox - size, y + oy + size * 0.6);
        ctx.lineTo(x + ox, y + oy - size);
        ctx.lineTo(x + ox + size, y + oy + size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = iron ? "#d97745" : "#cbd5e1";
        ctx.fillRect(x + ox - 1, y + oy - size * 0.4, 2, 2);
      }
      break;
    }
    case Terrain.Forest:
      ctx.fillStyle = "rgba(205,220,232,0.6)";
      ctx.fillRect(x, y, TILE, TILE);
      break;
    case Terrain.Rock:
      ctx.fillStyle = "#b4bfcd";
      ctx.fillRect(x, y, TILE, TILE);
      break;
    default:
      if (h > 0.93) {
        // A tiny tuft of dry grass sticking out of the snow.
        ctx.strokeStyle = "rgba(120,110,80,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 20);
        ctx.lineTo(x + 8, y + 13);
        ctx.moveTo(x + 12, y + 20);
        ctx.lineTo(x + 13, y + 12);
        ctx.stroke();
      }
  }
}

/** One or two snowy pines on a forest tile. */
function paintTrees(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  seed: number,
): void {
  const count = hash2(col, row, seed + 21) > 0.5 ? 2 : 1;
  for (let index = 0; index < count; index += 1) {
    const tx = x + 8 + hash2(col + index * 7, row, seed + 23) * 16;
    const ty = y + 15 + hash2(col, row + index * 7, seed + 29) * 9;
    const size = 9 + hash2(col - index, row + index, seed + 31) * 3;
    ctx.fillStyle = "rgba(60,80,110,0.18)";
    ctx.beginPath();
    ctx.ellipse(
      tx + 5,
      ty + size * 0.6,
      size * 0.8,
      size * 0.35,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#5b4636";
    ctx.fillRect(tx - 1.5, ty + size * 0.3, 3, size * 0.4);
    for (let layer = 0; layer < 3; layer += 1) {
      const w = size * (1 - layer * 0.25);
      const top = ty - size * 0.9 + layer * size * 0.35;
      ctx.fillStyle =
        layer === 0 ? "#21463a" : layer === 1 ? "#2c5a4a" : "#376b58";
      ctx.beginPath();
      ctx.moveTo(tx, top - size * 0.35);
      ctx.lineTo(tx - w * 0.7, top + size * 0.55);
      ctx.lineTo(tx + w * 0.7, top + size * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(248,252,255,0.92)";
      ctx.beginPath();
      ctx.moveTo(tx, top - size * 0.35);
      ctx.lineTo(tx - w * 0.45, top + size * 0.2);
      ctx.lineTo(tx + w * 0.1, top + size * 0.12);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** Two or three boulders of different size, each with a snow cap. */
function paintRock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  seed: number,
): void {
  const count = 2 + Math.floor(hash2(col, row, seed + 43) * 2);
  for (let index = 0; index < count; index += 1) {
    const h = hash2(col * 3 + index, row * 5 - index, seed + 41);
    const size = 0.45 + hash2(col - index, row + index * 3, seed + 47) * 0.45;
    const cx = x + 6 + hash2(col + index * 11, row, seed + 53) * 20;
    const cy = y + 8 + hash2(col, row + index * 13, seed + 59) * 18;
    boulder(ctx, cx, cy, size, h);
  }
}

/** One boulder, scaled, with a lit and a shaded face. */
function boulder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  h: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size, size * (0.85 + h * 0.3));
  ctx.fillStyle = "rgba(50,60,80,0.25)";
  ctx.beginPath();
  ctx.ellipse(4, 8, 17, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = h > 0.5 ? "#64748b" : "#57606f";
  ctx.beginPath();
  ctx.moveTo(-17, 8);
  ctx.lineTo(-12 - h * 3, -9);
  ctx.lineTo(-2 + h * 4, -15);
  ctx.lineTo(12, -10 + h * 3);
  ctx.lineTo(17, 6);
  ctx.lineTo(4, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.moveTo(2, -3);
  ctx.lineTo(12, -10 + h * 3);
  ctx.lineTo(17, 6);
  ctx.lineTo(4, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(250,252,255,0.95)";
  ctx.beginPath();
  ctx.moveTo(-12 - h * 3, -8);
  ctx.lineTo(-2 + h * 4, -15);
  ctx.lineTo(11, -10 + h * 3);
  ctx.lineTo(4, -4);
  ctx.lineTo(-6, -3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
