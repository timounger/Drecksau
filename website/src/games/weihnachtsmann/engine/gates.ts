/**
 * The Advent gates: walking into one opens its minigame, a won minigame
 * marks the gate, and which gate is next.
 *
 * @module
 * @remarks
 * The engine only knows that a gate was entered: at the darkest moment of the
 * fade it sets {@link GameState.gateOpen}, and the screen runs the minigame
 * while the map waits. Coming back, the fade brightens again and the gate
 * stays shut until the push towards it is let go.
 */
import { gateLocked, gateUnlocked } from "./calendar";
import { startFade } from "./doors";
import { say } from "./effects";
import { TILE, areaMap, inBox } from "./map";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import type {
  CalendarDay,
  CellBox,
  Character,
  Dir,
  Gate,
  GameState,
  Input,
} from "./types";

/** How many gates the Advent calendar has. */
export const GATE_COUNT = 26;

/** How firmly one has to push up into a gate, 0 to 1. */
const PUSH = 0.5;

/**
 * The doorway of a gate: the cell below the middle of its footprint.
 *
 * @param gate - the gate
 * @returns the cell to stand in
 */
export function gateDoor(gate: Gate): CellBox {
  return { tx: gate.tx + 1, ty: gate.ty + 1, w: 1, h: 1 };
}

/**
 * Starts the fade into a gate when the character steered stands in its
 * doorway and pushes up; lets go of the latch once the push stops.
 *
 * @param state - the game
 * @param char - the character steered
 * @param input - the held controls
 */
export function checkGates(
  state: GameState,
  char: Character,
  input: Input,
): void {
  const pushing = input.moveY < -PUSH;
  if (state.gateLatch && !pushing) {
    state.gateLatch = false;
  }
  if (state.fade === null && !state.gateLatch && pushing) {
    const gate = areaMap(state, char).gates.find((candidate) =>
      inBox(gateDoor(candidate), char.x, char.y - 1),
    );
    if (gate !== undefined && gateLocked(state, gate.number)) {
      // Shut until its day: say so once per push.
      say(char, lockedText(gate.number));
      state.gateLatch = true;
    } else if (gate !== undefined) {
      startFade(state, null, state.active, gate.number);
      state.sounds.push("gate");
    }
  }
}

/**
 * Which way the character steered would have to push to go through the door
 * or into the gate it stands in - for the touch button "Hinein".
 *
 * @param state - the game
 * @returns the direction, or null when it stands in no doorway or cannot go
 */
export function entryAt(state: GameState): Dir | null {
  const char = state.chars[state.active];
  const map = areaMap(state, char);
  let dir: Dir | null = null;
  if (state.fade === null && state.menu === null && state.sleigh === null) {
    const door = map.doors.find((candidate) =>
      inBox(candidate, char.x, char.y - 1),
    );
    const gate = map.gates.find(
      (candidate) =>
        inBox(gateDoor(candidate), char.x, char.y - 1) &&
        !gateLocked(state, candidate.number),
    );
    if (door !== undefined) {
      dir = door.dir;
    } else if (gate !== undefined) {
      dir = "up";
    }
  }
  return dir;
}

/**
 * Back from a gate's minigame: the map goes on, the fade brightens, and the
 * gate waits until the push towards it is let go.
 *
 * @param state - the game
 * @param won - whether the minigame was won on this visit
 * @param number - the gate
 */
export function leaveGate(
  state: GameState,
  won: boolean,
  number: number,
): void {
  if (won) {
    state.gatesDone.add(number);
  }
  state.gateOpen = null;
  state.gateLatch = true;
}

/**
 * What a shut gate says: the day it opens.
 *
 * @param number - the gate
 * @returns the German line
 */
export function lockedText(number: number): string {
  return `${WM_TEXTS.gateLabel} ${String(number)} ${WM_TEXTS.gateLockedFrom} ${String(number)}. ${WM_TEXTS.december}!`;
}

/**
 * The gate to do next: the lowest number not yet won that is open today.
 *
 * @param done - the numbers won
 * @param today - the day, for the December locks
 * @returns its number, or null when none is left for today
 */
export function nextGate(
  done: ReadonlySet<number>,
  today: CalendarDay,
): number | null {
  let next: number | null = null;
  for (let number = GATE_COUNT; number >= 1; number -= 1) {
    if (!done.has(number) && gateUnlocked(today, number)) {
      next = number;
    }
  }
  return next;
}

/**
 * Where a gate's doorway is, for pointing the way to it.
 *
 * @param gate - the gate
 * @returns the middle of its doorway, map px
 */
export function gateFront(gate: Gate): { x: number; y: number } {
  const door = gateDoor(gate);
  return { x: (door.tx + 1 / 2) * TILE, y: (door.ty + 1 / 2) * TILE };
}

/**
 * Keeps only real gate numbers, each once.
 *
 * @param numbers - numbers as read from a save
 * @returns a set of numbers from 1 to {@link GATE_COUNT}
 */
export function cleanGates(numbers: readonly number[]): Set<number> {
  return new Set(
    numbers.filter(
      (number) =>
        Number.isInteger(number) && number >= 1 && number <= GATE_COUNT,
    ),
  );
}
