/**
 * Smooth value noise for the terrain: coastlines, hills, forests.
 *
 * @module
 * @remarks
 * Value noise on an integer lattice, interpolated with a smoothstep curve,
 * summed over a few octaves. Pure functions of position and seed, so the
 * world can be rebuilt from its seed alone.
 */
import { hash2 } from "./random";

/** Each octave doubles the frequency... */
const LACUNARITY = 2;

/** ...and halves the weight. */
const GAIN = 0.5;

/** Spreads the seed per octave so octaves do not line up. */
const OCTAVE_SALT = 1013;

/** Smoothstep factors (3t^2 - 2t^3). */
const SMOOTH_A = 3;

/**
 * Value noise at one point.
 *
 * @param x - position
 * @param y - position
 * @param seed - which noise
 * @returns a value from 0 to 1
 */
export function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (SMOOTH_A - 2 * fx);
  const sy = fy * fy * (SMOOTH_A - 2 * fy);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

/**
 * Fractal noise: several octaves of value noise.
 *
 * @param x - position
 * @param y - position
 * @param seed - which noise
 * @param octaves - how many layers
 * @returns a value from 0 to 1
 */
export function fbm(
  x: number,
  y: number,
  seed: number,
  octaves: number,
): number {
  let sum = 0;
  let weight = 1;
  let total = 0;
  let frequency = 1;
  for (let octave = 0; octave < octaves; octave += 1) {
    sum +=
      valueNoise(x * frequency, y * frequency, seed + octave * OCTAVE_SALT) *
      weight;
    total += weight;
    weight *= GAIN;
    frequency *= LACUNARITY;
  }
  return sum / total;
}
