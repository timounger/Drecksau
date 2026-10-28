/**
 * Loading the pictures the game is drawn from - plain or at a finer pixel
 * density - and blitting sprites off the sheet.
 *
 * @module
 * @remarks
 * All pictures are original pixel art made for this game by a generator:
 * `world.png` is the whole overworld drawn out once (grass, paths, water,
 * cliffs, trees, houses), `dungeon.png`, `interior.png` and `mini.png` the
 * temple, the two houses and the root world, `map.png` the little map of the
 * pause screen, and `sprites.png` holds everything that moves or changes.
 * Drawing the static map as one picture keeps the soft edges of the grass
 * patches and the shadows of the trees, which a grid of repeated tiles could
 * only approximate.
 *
 * Each picture also comes drawn at two and three times the pixels (`-2x`,
 * `-3x`): the same layout with finer outlines, light and texture. A set of
 * pictures knows its density, and {@link drawSprite} takes its source
 * rectangles that many times larger while the caller keeps working in the
 * 240 x 160 logical pixels of the game.
 */
import dungeon2x from "@/games/zelda/assets/dungeon-2x.png";
import dungeon3x from "@/games/zelda/assets/dungeon-3x.png";
import dungeonImage from "@/games/zelda/assets/dungeon.png";
import interior2x from "@/games/zelda/assets/interior-2x.png";
import interior3x from "@/games/zelda/assets/interior-3x.png";
import interiorImage from "@/games/zelda/assets/interior.png";
import map2x from "@/games/zelda/assets/map-2x.png";
import map3x from "@/games/zelda/assets/map-3x.png";
import mapImage from "@/games/zelda/assets/map.png";
import mini2x from "@/games/zelda/assets/mini-2x.png";
import mini3x from "@/games/zelda/assets/mini-3x.png";
import miniImage from "@/games/zelda/assets/mini.png";
import sheet2x from "@/games/zelda/assets/sprites-2x.png";
import sheet3x from "@/games/zelda/assets/sprites-3x.png";
import sheetImage from "@/games/zelda/assets/sprites.png";
import world2x from "@/games/zelda/assets/world-2x.png";
import world3x from "@/games/zelda/assets/world-3x.png";
import worldImage from "@/games/zelda/assets/world.png";
import { SPRITES, type SpriteName } from "./sprite-atlas";

/** Pixels of art per logical pixel: the plain art, or twice or three times as fine. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the three densities the art is drawn at
export type Density = 1 | 2 | 3;

/** The pictures, by name. */
type Pictures = {
  readonly sheet: HTMLImageElement;
  readonly world: HTMLImageElement;
  readonly dungeon: HTMLImageElement;
  readonly interior: HTMLImageElement;
  readonly mini: HTMLImageElement;
  /** The small overworld map of the pause screen. */
  readonly map: HTMLImageElement;
};

/** The loaded pictures and how finely they are drawn. */
export type Art = Pictures & {
  readonly density: Density;
};

/** Where the pictures of each density come from. */
const SOURCES: Readonly<
  Record<Density, Readonly<Record<keyof Pictures, { readonly src: string }>>>
> = {
  1: {
    sheet: sheetImage,
    world: worldImage,
    dungeon: dungeonImage,
    interior: interiorImage,
    mini: miniImage,
    map: mapImage,
  },
  2: {
    sheet: sheet2x,
    world: world2x,
    dungeon: dungeon2x,
    interior: interior2x,
    mini: mini2x,
    map: map2x,
  },
  3: {
    sheet: sheet3x,
    world: world3x,
    dungeon: dungeon3x,
    interior: interior3x,
    mini: mini3x,
    map: map3x,
  },
};

/**
 * Starts loading the pictures of one density.
 *
 * @param density - plain (1) or finer art (2, 3)
 * @returns the images; they draw nothing until loaded
 */
export function loadArt(density: Density = 1): Art {
  const from = SOURCES[density];
  return {
    sheet: image(from.sheet.src),
    world: image(from.world.src),
    dungeon: image(from.dungeon.src),
    interior: image(from.interior.src),
    mini: image(from.mini.src),
    map: image(from.map.src),
    density,
  };
}

/**
 * Whether every picture has arrived.
 *
 * @param art - the pictures
 * @returns true once they can be drawn
 */
export function artReady(art: Art): boolean {
  return [
    art.sheet,
    art.world,
    art.dungeon,
    art.interior,
    art.mini,
    art.map,
  ].every((picture) => picture.complete && picture.naturalWidth > 0);
}

/**
 * Draws one sprite with its top-left corner at a point.
 *
 * @param ctx - where to draw
 * @param art - the pictures
 * @param name - which sprite
 * @param x - left edge, screen px
 * @param y - top edge, screen px
 * @param mirror - flip it left to right
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  art: Art,
  name: SpriteName,
  x: number,
  y: number,
  mirror = false,
): void {
  const [sx, sy, w, h] = SPRITES[name];
  const k = art.density;
  const left = Math.round(x);
  const top = Math.round(y);
  if (mirror) {
    ctx.save();
    ctx.translate(left + w, top);
    ctx.scale(-1, 1);
    ctx.drawImage(art.sheet, sx * k, sy * k, w * k, h * k, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(art.sheet, sx * k, sy * k, w * k, h * k, left, top, w, h);
  }
}

/**
 * Draws part of a big picture (an area's map) given in logical pixels.
 *
 * @param ctx - where to draw
 * @param art - the pictures, for their density
 * @param picture - which picture
 * @param sx - left edge on the picture, logical px
 * @param sy - top edge on the picture, logical px
 * @param w - width, logical px
 * @param h - height, logical px
 */
export function drawPicture(
  ctx: CanvasRenderingContext2D,
  art: Art,
  picture: HTMLImageElement,
  sx: number,
  sy: number,
  w: number,
  h: number,
): void {
  const k = art.density;
  ctx.drawImage(picture, sx * k, sy * k, w * k, h * k, 0, 0, w, h);
}

/**
 * The size of a sprite.
 *
 * @param name - which sprite
 * @returns width and height in pixels
 */
export function spriteSize(name: SpriteName): {
  readonly w: number;
  readonly h: number;
} {
  const rect = SPRITES[name];
  return { w: rect[2], h: rect[3] };
}

/** One picture, loading. */
function image(src: string): HTMLImageElement {
  const picture = new Image();
  picture.src = src;
  return picture;
}
