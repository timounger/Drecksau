/**
 * The upgrade arrow over a structure that could be upgraded right now - drawn
 * on the map and hit by a click.
 *
 * @module
 * @remarks
 * The arrow keeps its size on screen whatever the zoom, so it stays easy to
 * hit when zoomed out. Walls get none: a wall line would be all arrows.
 */
import { upgradeReady } from "@/games/frost-fortress/engine/build";
import { TILE } from "@/games/frost-fortress/engine/map";
import { STRUCTURES } from "@/games/frost-fortress/engine/structures";
import type { Game, Structure } from "@/games/frost-fortress/engine/types";

/** Radius of the arrow's disc on screen, CSS pixels. */
const BADGE_PX = 11;

/** A click this much farther out still counts, as a share of the radius. */
const HIT_SLACK = 1.3;

/**
 * Whether a structure shows the arrow.
 *
 * @param game - the game
 * @param structure - the structure
 * @returns true if it can be upgraded now and is no wall
 */
export function showsBadge(game: Game, structure: Structure): boolean {
  return structure.kind !== "wall" && upgradeReady(game, structure);
}

/**
 * Where the arrow of a structure sits and how big it is, world units.
 *
 * @param structure - the structure
 * @param zoom - the camera zoom
 * @returns its centre and radius
 */
export function badgeSpot(
  structure: Structure,
  zoom: number,
): { x: number; y: number; r: number } {
  const def = STRUCTURES[structure.kind];
  const r = BADGE_PX / zoom;
  return {
    x: (structure.col + def.width) * TILE - r * HALF,
    y: structure.row * TILE + r * HALF,
    r,
  };
}

/** Half, to tuck the disc into the corner. */
const HALF = 0.5;

/**
 * The structure whose arrow is under a point, if any.
 *
 * @param game - the game
 * @param x - world x
 * @param y - world y
 * @param zoom - the camera zoom
 * @returns the structure, or undefined
 */
export function badgeAt(
  game: Game,
  x: number,
  y: number,
  zoom: number,
): Structure | undefined {
  return game.structures.find((structure) => {
    const spot = badgeSpot(structure, zoom);
    return (
      Math.hypot(x - spot.x, y - spot.y) <= spot.r * HIT_SLACK &&
      showsBadge(game, structure)
    );
  });
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the painting */

/**
 * Draws the arrow of one structure.
 *
 * @param ctx - the context, in world units
 * @param structure - the structure
 * @param zoom - the camera zoom
 * @param clock - real seconds, for the gentle bounce
 */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  structure: Structure,
  zoom: number,
  clock: number,
): void {
  const { x, r } = badgeSpot(structure, zoom);
  const y =
    badgeSpot(structure, zoom).y - Math.abs(Math.sin(clock * 3)) * r * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#16a34a";
  ctx.fill();
  ctx.lineWidth = r * 0.18;
  ctx.strokeStyle = "#f0fdf4";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.6);
  ctx.lineTo(x + r * 0.5, y - r * 0.05);
  ctx.lineTo(x + r * 0.2, y - r * 0.05);
  ctx.lineTo(x + r * 0.2, y + r * 0.55);
  ctx.lineTo(x - r * 0.2, y + r * 0.55);
  ctx.lineTo(x - r * 0.2, y - r * 0.05);
  ctx.lineTo(x - r * 0.5, y - r * 0.05);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
