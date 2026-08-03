/**
 * Mixing colours, so both views can fade ground into snow the same way.
 *
 * @module
 * @remarks
 * Tiny on purpose. The alternative - a second set of colours for snowy ground
 * in each of the two renderers - is how two views of one world start to
 * disagree about where the snow line is.
 */

/** How many characters one colour channel takes in `#rrggbb`. */
const CHANNEL = 2;

/** Where each channel starts in `#rrggbb`, after the hash. */
const CHANNELS = [1, 1 + CHANNEL, 1 + CHANNEL * 2] as const;

/** Base sixteen, for reading the pairs of hex digits. */
const HEX = 16;

/**
 * Mixes two colours.
 *
 * @param from - the colour at `share` zero, as `#rrggbb`
 * @param to - the colour at `share` one, as `#rrggbb`
 * @param share - how much of the second one, from 0 to 1
 * @returns the mixed colour as `#rrggbb`
 */
export function blend(from: string, to: string, share: number): string {
  const t = Math.min(1, Math.max(0, share));
  const parts = CHANNELS.map((at) => {
    const a = Number.parseInt(from.slice(at, at + CHANNEL), HEX);
    const b = Number.parseInt(to.slice(at, at + CHANNEL), HEX);
    return Math.round(a + (b - a) * t)
      .toString(HEX)
      .padStart(CHANNEL, "0");
  });
  return `#${parts.join("")}`;
}
