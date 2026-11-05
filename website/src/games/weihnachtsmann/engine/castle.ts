/**
 * The snow castle building site in the south land: carry snow blocks from
 * the heap to the marked plots, and the castle grows - first the wall, then
 * two towers, at last the flag on top. A while later it melts away again.
 *
 * @module
 * @remarks
 * The talk key at the heap hands over a block ({@link pickUp}, carried like a
 * letter); at the site it is set on the next plot. Four blocks make the wall,
 * four more the two towers, and with free hands the talk key raises the
 * flag. A finished castle stands for a few minutes, one left half built
 * melts sooner; then it melts down block by block. Nothing of it is saved.
 */
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { carries, pickUp } from "./carry";
import { poof, say, snowPuff, spawn, SPARKLE_TINTS } from "./effects";
import { TILE, footprint } from "./map";
import { CASTLE_SITE } from "./places-data";
import { pick, randomIn } from "./random";
import type { CastleState, Character, GameState } from "./types";

/** Blocks for the wall, and for the wall and both towers. */
export const WALL_BLOCKS = 4;
export const CASTLE_BLOCKS = 8;

/** Seconds a finished castle stands, and a half-built one waits for more. */
const STANDS = 150;
const WAITS = 120;

/** Seconds between two blocks melting away. */
const DRIP = 1.2;

/** Sparkles over the finished castle, and how fast they fly. */
const FLAG_SPARKLES = 12;
const FLAG_SPRAY = 24;

/** How high over the site's foot the sparkles start, map px. */
const FLAG_HIGH = 56;

/**
 * The site on a new visit: only the marks on the snow.
 *
 * @returns its state
 */
export function createCastle(): CastleState {
  return { blocks: 0, flag: false, meltIn: 0, melting: false, dripIn: 0 };
}

/**
 * The talk key at the heap: a snow block into the hands.
 *
 * @param state - the game
 * @param char - who takes one
 */
export function takeBlock(state: GameState, char: Character): void {
  if (char.form !== null) {
    say(char, PLACES_TEXTS.blockAnimal);
  } else if (carries(char, "snowBlock")) {
    say(char, PLACES_TEXTS.blockHave);
  } else if (pickUp(char, "snowBlock")) {
    say(char, pick(state, PLACES_TEXTS.blockTaken));
    state.sounds.push("blockSet");
  }
}

/**
 * The talk key at the site: a carried block goes on the next plot; with the
 * wall and towers done and free hands, up goes the flag.
 *
 * @param state - the game
 * @param char - who builds
 */
export function buildCastle(state: GameState, char: Character): void {
  const castle = state.world.places.castle;
  if (castle.melting) {
    say(char, PLACES_TEXTS.castleMelting);
  } else if (carries(char, "snowBlock") && castle.blocks < CASTLE_BLOCKS) {
    char.carry = null;
    castle.blocks += 1;
    castle.meltIn = WAITS;
    const at = plotPoint(castle.blocks - 1);
    snowPuff(state, "outdoors", at.x, at.y);
    state.sounds.push("blockSet");
    let line: string = pick(state, PLACES_TEXTS.blockSet);
    if (castle.blocks === WALL_BLOCKS) {
      line = PLACES_TEXTS.wallDone;
    } else if (castle.blocks === CASTLE_BLOCKS) {
      line = PLACES_TEXTS.towersDone;
    }
    say(char, line);
  } else if (castle.blocks >= CASTLE_BLOCKS && !castle.flag) {
    raiseFlag(state, char);
  } else if (castle.flag) {
    say(char, PLACES_TEXTS.castleDone);
  } else {
    say(char, PLACES_TEXTS.castleNeedBlock);
  }
}

/**
 * Lets the castle stand a while, then melt down block by block.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateCastle(state: GameState, dt: number): void {
  const castle = state.world.places.castle;
  if (castle.melting) {
    castle.dripIn -= dt;
    if (castle.dripIn <= 0) {
      castle.dripIn = DRIP;
      const at = plotPoint(Math.max(0, castle.blocks - 1));
      if (castle.flag) {
        castle.flag = false;
      } else {
        castle.blocks = Math.max(0, castle.blocks - 1);
      }
      snowPuff(state, "outdoors", at.x, at.y);
      snowPuff(state, "outdoors", at.x, at.y - TILE / 2);
      if (castle.blocks <= 0) {
        castle.melting = false;
      }
    }
  } else if (castle.blocks > 0) {
    castle.meltIn -= dt;
    if (castle.meltIn <= 0) {
      castle.melting = true;
      castle.dripIn = 0;
    }
  }
}

/**
 * Where each plot of the site lies, in the order the blocks are set: the
 * wall's four pieces left to right, then the two towers low and high.
 *
 * @param index - the block, 0 first
 * @returns the plot's foot, map px
 */
export function plotPoint(index: number): { x: number; y: number } {
  const size = footprint(CASTLE_SITE.kind);
  const left = CASTLE_SITE.tx * TILE;
  const bottom = (CASTLE_SITE.ty + size.rows) * TILE;
  const width = size.cols * TILE;
  const piece = width / (WALL_BLOCKS + 2);
  let x: number;
  let y = bottom;
  if (index < WALL_BLOCKS) {
    // The wall's pieces sit between the towers, one plot in from each end.
    x = left + piece * (index + 1 + 1 / 2);
  } else {
    // Towers stand at both ends, low block first, then the high one.
    const tower = (index - WALL_BLOCKS) % 2;
    x = tower === 0 ? left + piece / 2 : left + width - piece / 2;
    y = bottom - (index >= WALL_BLOCKS + 2 ? TILE : 0);
  }
  return { x, y };
}

/** Up goes the flag: the castle is done, the achievement won. */
function raiseFlag(state: GameState, char: Character): void {
  const castle = state.world.places.castle;
  castle.flag = true;
  castle.meltIn = STANDS;
  const size = footprint(CASTLE_SITE.kind);
  const x = (CASTLE_SITE.tx + size.cols / 2) * TILE;
  const y = (CASTLE_SITE.ty + size.rows) * TILE - FLAG_HIGH;
  poof(state, "outdoors", x, y);
  for (let k = 0; k < FLAG_SPARKLES; k += 1) {
    spawn(
      state,
      "sparkle",
      "outdoors",
      x,
      y,
      randomIn(state, -FLAG_SPRAY, FLAG_SPRAY),
      randomIn(state, -FLAG_SPRAY, 0),
      k % SPARKLE_TINTS,
    );
  }
  say(char, pick(state, PLACES_TEXTS.flagUp));
  state.sounds.push("collect");
  if (steered(state, char)) {
    unlock(state, "snowCastle");
  }
}
