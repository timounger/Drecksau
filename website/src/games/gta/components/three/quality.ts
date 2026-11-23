/**
 * How much the 3D view draws: two levels, picked by the device.
 *
 * @module
 * @remarks
 * IMPERAVIS lets the player choose between three levels. Here there is no
 * menu for it - a phone gets the light level, everything else the full one -
 * because the setting that matters to a player is 3D or 2D, and a second knob
 * next to it would mostly be a way to make the game slower.
 */

/** What one level draws. */
export type Quality3d = {
  /** Which level this is. */
  readonly level: "low" | "high";
  /** The finest device pixel ratio drawn. */
  readonly pixelRatio: number;
  /** Whether the edges are smoothed. */
  readonly antialias: boolean;
  /** Side of the sun's shadow map, texels. */
  readonly shadowSize: number;
  /** Half the width of the patch of city the shadow map covers, pixels. */
  readonly shadowReach: number;
  /** Whether trees and lamps throw shadows as well as houses and cars. */
  readonly smallShadows: boolean;
  /** Texels a ground tile is painted with. */
  readonly tileTexels: number;
  /** How many ground tiles are kept painted. */
  readonly tiles: number;
  /** How many ground tiles may be painted in one frame. */
  readonly paintsPerFrame: number;
  /** How far from the camera's target anything that moves is drawn, pixels. */
  readonly reach: number;
  /** Share of the trees planted, nought to one. */
  readonly trees: number;
  /** Glow round lights at night. */
  readonly bloom: boolean;
};

/** The two levels. */
export const QUALITY_3D: Readonly<Record<Quality3d["level"], Quality3d>> = {
  low: {
    level: "low",
    pixelRatio: 1.5,
    antialias: false,
    shadowSize: 1024,
    shadowReach: 520,
    smallShadows: false,
    tileTexels: 256,
    tiles: 16,
    paintsPerFrame: 1,
    reach: 1100,
    trees: 0.55,
    bloom: false,
  },
  high: {
    level: "high",
    pixelRatio: 2,
    antialias: true,
    shadowSize: 2048,
    shadowReach: 760,
    smallShadows: true,
    tileTexels: 512,
    tiles: 30,
    paintsPerFrame: 2,
    reach: 1700,
    trees: 1,
    bloom: true,
  },
};

/** Narrower than this, a screen counts as a phone's. */
const PHONE_WIDE = 820;

/**
 * Which level this device gets.
 *
 * @returns low on anything touched with a finger or this narrow, high
 *   everywhere else
 */
export function pickQuality(): Quality3d {
  const finger =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < PHONE_WIDE;
  return finger || narrow ? QUALITY_3D.low : QUALITY_3D.high;
}
