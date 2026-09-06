/**
 * The tilted 2.5D view: flat city coordinates in, screen coordinates out.
 *
 * @module
 * @remarks
 * The city itself stays flat - a grid of cells seen from directly above, which
 * is what every collision, every chase and every parked car is computed in.
 * Only the picture is tilted, the same way Panzerkiste tilts its field: depth
 * (city y) is squashed by {@link DEPTH}, and height (z, up off the road) lifts
 * a point straight up the screen. Houses and cars then have a roof and a wall
 * facing the camera instead of being coloured rectangles.
 *
 * The renderer and the input hook share this module, so that the shot goes
 * where the crosshair sits: the mouse is a screen point and has to be put back
 * on the road with {@link unprojectFloor} before the engine ever sees it.
 */
import { DEPTH, type Vec } from "@/games/gta/engine/types";

/**
 * How wide the picture is, in view pixels - not in screen pixels.
 *
 * @remarks
 * This is the size everything is *drawn* in: how much of the city fits on
 * screen, how big a car is, where the map in the corner sits. How many real
 * pixels that becomes is a different question, answered once per frame by the
 * canvas: on a sharp display the same picture is painted onto twice as many
 * pixels. Keeping the two apart is what lets the picture be crisp without
 * anybody having to think in device pixels while drawing a bonnet.
 */
export const VIEW_WIDTH = 960;

/** How tall the picture is, in view pixels. */
export const VIEW_HEIGHT = 600;

/**
 * How much closer the city is drawn than one city pixel per view pixel.
 *
 * @remarks
 * Life size was too far away to read: a person is eighteen pixels tall and a
 * street two fingers wide. Closer costs field of view, and that is the whole
 * of the trade - the camera sees less city in each direction, so driving fast
 * means seeing less of what is coming. Speeds are unchanged: the city did not
 * shrink, the lens came closer.
 *
 * Which is why it is a setting rather than a number - see
 * ../settings/app-settings. This one is only the fallback for anything that
 * draws without asking, and the middle of what the settings page offers.
 */
export const ZOOM = 3;

/**
 * How much depth is squashed on screen - the tilt.
 *
 * @remarks
 * Defined with the rules rather than here, because the rules need it too: a
 * helicopter is drawn above where it stands, and deciding whether a shot aimed
 * at it hits is arithmetic on this number.
 */
export { DEPTH };

/** How tall a car stands, in screen pixels. */
export const CAR_HEIGHT = 13;

/** How tall a person stands. */
export const PERSON_HEIGHT = 15;

/**
 * How high off the road to ask "is this behind a house?".
 *
 * @remarks
 * Half a person: at the feet a figure is behind a house one step sooner than
 * its head is, and the head is what one looks for.
 */
export const LOOK_AT = 8;

/** How high above the road a shot flies. */
export const SHOT_HEIGHT = 9;

/** The lowest a house is built, in screen pixels. */
export const HOUSE_LOW = 26;

/** The tallest a house is built - downtown, and only there. */
export const HOUSE_HIGH = 74;

/** What the camera looks at, and how big the picture is. */
export type View = {
  /** The city point in the middle of the screen. */
  readonly at: Vec;
  /** Canvas width in pixels. */
  readonly width: number;
  /** Canvas height in pixels. */
  readonly height: number;
};

/** A point on the canvas. */
export type Screen = {
  readonly x: number;
  readonly y: number;
};

/**
 * The camera for a canvas of this size.
 *
 * @param at - the city point in the middle of the screen
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @returns the view, which covers a {@link ZOOM}th of that in each direction
 */
export function cameraFor(
  at: Vec,
  width: number,
  height: number,
  zoom: number = ZOOM,
): View {
  return { at, width: width / zoom, height: height / zoom };
}

/**
 * A point on the canvas, put back on the road through the zoom and the tilt.
 *
 * @param at - where the camera is pointed
 * @param width - canvas width in view pixels
 * @param height - canvas height in view pixels
 * @param sx - canvas x, in view pixels
 * @param sy - canvas y, in view pixels
 * @returns the city point under it
 */
export function worldAt(
  at: Vec,
  width: number,
  height: number,
  sx: number,
  sy: number,
  zoom: number = ZOOM,
): Vec {
  const view = cameraFor(at, width, height, zoom);
  return unprojectFloor(
    view,
    (sx - width / 2) / zoom + view.width / 2,
    (sy - height / 2) / zoom + view.height / 2,
  );
}

/**
 * Puts a city point on the screen.
 *
 * @param view - where the camera is
 * @param x - city x, in pixels
 * @param y - city y, the depth into the picture
 * @param z - height above the road, default 0
 * @returns where that lands on the canvas
 */
export function project(view: View, x: number, y: number, z = 0): Screen {
  return {
    x: view.width / 2 + (x - view.at.x),
    y: view.height / 2 + (y - view.at.y) * DEPTH - z,
  };
}

/**
 * Puts a screen point back on the road - the other way round from
 * {@link project} for anything lying flat.
 *
 * @param view - where the camera is
 * @param sx - canvas x
 * @param sy - canvas y
 * @returns the city point under it
 */
export function unprojectFloor(view: View, sx: number, sy: number): Vec {
  return {
    x: view.at.x + sx - view.width / 2,
    y: view.at.y + (sy - view.height / 2) / DEPTH,
  };
}

/**
 * The stretch of city the picture covers, with room for what leans into it.
 *
 * @param view - where the camera is
 * @returns the city rectangle to draw, in pixels
 * @remarks
 * Wider at the top than the screen is: a tower standing well north of the top
 * edge still has its roof in the picture, because height is drawn upwards.
 */
export function seenArea(view: View): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  const topLeft = unprojectFloor(view, 0, -HOUSE_HIGH);
  const bottomRight = unprojectFloor(view, view.width, view.height);
  return {
    left: topLeft.x,
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
  };
}
