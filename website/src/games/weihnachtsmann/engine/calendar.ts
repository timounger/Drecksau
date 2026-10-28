/**
 * The Advent calendar's dates: in December gate n opens on the n-th, one after
 * the other; the rest of the year every gate is open.
 *
 * @module
 * @remarks
 * The engine never reads the clock itself - the screen sets
 * {@link GameState.today} from the device's date, so a test can set any day.
 */
import type { CalendarDay, GameState } from "./types";

/** December, as a month number 1 to 12. */
const DECEMBER = 12;

/** A day on which every gate is open: the screen sets the real one. */
export const ANY_DAY: CalendarDay = { month: 1, day: 1 };

/**
 * Today on the device.
 *
 * @param now - the moment
 * @returns its month and day of the month
 */
export function calendarDay(now: Date): CalendarDay {
  return { month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * Whether a gate may be entered: always outside December, in December from
 * its own day on.
 *
 * @param today - the day
 * @param number - the gate, 1 to 26
 * @returns true when it is open
 */
export function gateUnlocked(today: CalendarDay, number: number): boolean {
  return today.month !== DECEMBER || today.day >= number;
}

/**
 * Whether a gate of the game is shut for today.
 *
 * @param state - the game
 * @param number - the gate
 * @returns true when it is still locked
 */
export function gateLocked(state: GameState, number: number): boolean {
  return !gateUnlocked(state.today, number);
}
