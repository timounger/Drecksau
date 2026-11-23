/**
 * The small things every part of the 3D view shares: the scale of heights,
 * the water level, a bin for what has to be freed, colours and dice.
 *
 * @module
 * @remarks
 * The 3D city is the 2D city stood up. City x is three's x, city y is three's
 * z, and three's y is up - all in city pixels, so a car is as long here as the
 * engine thinks it is and nothing has to be converted on the way in. Only the
 * heights are stretched: see {@link HEIGHT_SCALE}.
 */
import * as THREE from "three";

/**
 * How much taller everything that is a *height* in the engine is drawn.
 *
 * @remarks
 * The engine's heights were made for a squashed picture: a house of 26 pixels
 * is a bungalow there and a garden shed here, next to a man of fifteen. Twice
 * as tall reads as storeys. It is applied to every height the engine knows -
 * roofs, the jetpack, the helicopters - and to nothing that is a *size*, so a
 * man who lands on a roof at the engine's roof height lands on the roof one
 * sees.
 */
export const HEIGHT_SCALE = 2;

/** Where the sea lies, in pixels below the road. */
export const WATER_LEVEL = -3;

/** How tall a person stands, in city pixels. */
export const PERSON_TALL = 15;

/**
 * The height shots fly at, and the plane the mouse is put on.
 *
 * @remarks
 * Chest height. The engine's shots are flat; the 3D picture draws them at
 * this height and puts the mouse back on the city at the same height, so a
 * round goes through exactly the point under the crosshair - and a crosshair
 * laid on somebody's chest aims at where he stands, not at the road behind
 * him.
 */
export const AIM_HEIGHT = 9;

/** Everything made on the GPU, so it can be freed in one go. */
export class Bin {
  /** What is held. */
  private readonly held = new Set<{ dispose: () => void }>();

  /**
   * Keeps one thing for later freeing.
   *
   * @param thing - a geometry, a material, a texture or a target
   * @returns the same thing, for chaining
   */
  keep<T extends { dispose: () => void }>(thing: T): T {
    this.held.add(thing);
    return thing;
  }

  /** Frees everything held. */
  empty(): void {
    for (const thing of this.held) {
      thing.dispose();
    }
    this.held.clear();
  }
}

/**
 * A CSS colour as a three colour number.
 *
 * @param css - `#rrggbb`, `#rgb` or any colour three can read
 * @returns the colour as a number
 */
export function hex(css: string): number {
  return new THREE.Color(css).getHex();
}

/**
 * A number between nought and one that is always the same for two numbers.
 *
 * @param across - anything
 * @param down - anything else
 * @returns their hash
 */
export function dice(across: number, down: number): number {
  /* eslint-disable @typescript-eslint/no-magic-numbers -- the usual shader
     hash constants: what makes the result spread evenly */
  const mixed = Math.sin(across * 127.1 + down * 311.7) * 43758.5453;
  /* eslint-enable @typescript-eslint/no-magic-numbers */
  return mixed - Math.floor(mixed);
}

/**
 * The rotation about the vertical that points a model's nose along a city
 * angle.
 *
 * @param angle - the heading in the city, radians, nought pointing east
 * @returns the three rotation about y
 * @remarks
 * The city's y runs south and so does three's z, so a heading of a quarter
 * turn - due south - has to turn the model's +x onto +z, which about three's
 * y is a negative turn.
 */
export function yawOf(angle: number): number {
  return -angle;
}
