/**
 * The cinema on the map: walking (or talking) into it, coming back out, and
 * the episodes of the series it shows.
 *
 * @module
 * @remarks
 * Like an Advent gate, the engine only knows that the cinema was entered: at
 * the darkest moment of the fade it sets {@link GameState.cinemaOpen}, and the
 * screen shows the cinema while the map waits. Coming back, the fade
 * brightens again and the door stays shut until the push towards it is let
 * go. Which episode is picked and played is the screen's business; starting
 * one unlocks the "movieNight" achievement there.
 */
import { startFade } from "./doors";
import { inBox } from "./map";
import { CINEMA_DOOR } from "./map-data";
import type { Character, GameState, Input } from "./types";

/** How firmly one has to push up into the door, 0 to 1. */
const PUSH = 0.5;

/** One episode of the series, as the cinema shows it. */
export type Episode = {
  /** Its number in the series, 1 to 26. */
  readonly number: number;
  /** The video on the official YouTube channel. */
  readonly video: string;
};

/** Where every episode starts, seconds into its video: just past the intro. */
export const SHOW_FROM = 64;

/** Where every episode stops, seconds into its video: before the credits. */
export const SHOW_UNTIL = 1384;

/** How long the part shown runs, seconds. */
export const SHOW_LENGTH = SHOW_UNTIL - SHOW_FROM;

/**
 * The 26 episodes, in the order of the series, from the official playlist of
 * the TOGGO channel. The German titles are in `i18n/texts.ts`.
 */
export const EPISODES: readonly Episode[] = [
  { number: 1, video: "nxskfhynIZI" },
  { number: 2, video: "Qz8-m1m6bAA" },
  { number: 3, video: "TuPdc5mloWc" },
  { number: 4, video: "o5cmM_i4QJc" },
  { number: 5, video: "vaGfpsWBSZ8" },
  { number: 6, video: "Z_kN8sKtw9o" },
  { number: 7, video: "I1zPdo89fn4" },
  { number: 8, video: "2NpaOTIvmBs" },
  { number: 9, video: "ki8sQe86Ifc" },
  { number: 10, video: "NzQANo4ERQE" },
  { number: 11, video: "UXYJoSspWgU" },
  { number: 12, video: "sZX5l1Z-90M" },
  { number: 13, video: "ruoqdwJRTfs" },
  { number: 14, video: "4lBazGM7uR4" },
  { number: 15, video: "kw9GfwIEmJ0" },
  { number: 16, video: "Rgc1sS57gKQ" },
  { number: 17, video: "Q0EppFyijhw" },
  { number: 18, video: "5hnimgpJ2wA" },
  { number: 19, video: "rjA4YnEAtfQ" },
  { number: 20, video: "bWHr42GdSag" },
  { number: 21, video: "7UZjipgxVMc" },
  { number: 22, video: "kLX7Dx5BB5k" },
  { number: 23, video: "STj-PPDUkHQ" },
  { number: 24, video: "cp7N1MAMb3c" },
  { number: 25, video: "v2_rtV1yYPg" },
  { number: 26, video: "vV6bdzXH5TY" },
];

/**
 * Starts the fade into the cinema when the character steered stands in its
 * doorway and pushes up.
 *
 * @param state - the game
 * @param char - the character steered
 * @param input - the held controls
 */
export function checkCinema(
  state: GameState,
  char: Character,
  input: Input,
): void {
  if (
    state.fade === null &&
    !state.gateLatch &&
    input.moveY < -PUSH &&
    atCinemaDoor(char)
  ) {
    enterCinema(state);
  }
}

/**
 * Whether somebody stands in the cinema's doorway, on the ground outside.
 *
 * @param char - the character
 * @returns true when a push up would go in
 */
export function atCinemaDoor(char: Character): boolean {
  return (
    char.area === "outdoors" &&
    char.altitude < 1 &&
    inBox(CINEMA_DOOR, char.x, char.y - 1)
  );
}

/**
 * Goes into the cinema: the picture fades, and at its darkest the cinema
 * opens.
 *
 * @param state - the game
 */
export function enterCinema(state: GameState): void {
  if (state.fade === null && !state.cinemaOpen) {
    startFade(state, null, state.active, null, true);
    state.sounds.push("door");
  }
}

/**
 * Back out of the cinema: the map goes on, the fade brightens, and the door
 * waits until the push towards it is let go.
 *
 * @param state - the game
 */
export function leaveCinema(state: GameState): void {
  state.cinemaOpen = false;
  state.gateLatch = true;
}
