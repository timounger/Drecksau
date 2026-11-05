/**
 * Today's three little tasks: every calendar day of the device picks three
 * from the things one does anyway - feed reindeer, throw snowballs, ride the
 * train ... - and counts them as they happen. A day with all three done
 * counts towards an achievement.
 *
 * @module
 * @remarks
 * The modules where things happen call {@link noteTask}; only the character
 * steered counts. The day comes from the screen (`GameState.today` and
 * `GameState.now`, so `?datum=` changes it too); the progress is saved with
 * the day it belongs to and starts afresh on a new one.
 */
import { addCount, steered } from "./achievements";
import { say } from "./effects";
import type { Character, GameState } from "./types";
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";

/** The kinds of little tasks. */
export type TaskKind =
  | "feed"
  | "snowball"
  | "toy"
  | "letter"
  | "carousel"
  | "train"
  | "sled"
  | "lamp"
  | "photo"
  | "kid"
  | "wrap"
  | "chat";

/** One task: what, and how many times. */
export type TaskDef = { readonly kind: TaskKind; readonly goal: number };

/** A task of today with how far it has come, for the screen. */
export type TaskView = TaskDef & { readonly done: number };

/** Every task one can get. */
export const TASKS: readonly TaskDef[] = [
  { kind: "feed", goal: 2 },
  { kind: "snowball", goal: 5 },
  { kind: "toy", goal: 3 },
  { kind: "letter", goal: 3 },
  { kind: "carousel", goal: 1 },
  { kind: "train", goal: 1 },
  { kind: "sled", goal: 1 },
  { kind: "lamp", goal: 3 },
  { kind: "photo", goal: 1 },
  { kind: "kid", goal: 1 },
  { kind: "wrap", goal: 2 },
  { kind: "chat", goal: 3 },
];

/** Tasks per day. */
export const TASKS_PER_DAY = 3;

/** Days with all tasks done it takes for the achievement. */
export const DAILY_GOAL = 3;

/** Multiplier and step of the little random generator picking the tasks. */
const HASH_MUL = 31;
const LCG_MUL = 1103515245;
const LCG_ADD = 12345;
const LCG_MOD = 2147483648;
const HIGH_BITS = 65536;

/** Width of the month and day in the day's name. */
const PAD = 2;

/**
 * The day the tasks are for, from the screen's date.
 *
 * @param state - the game
 * @returns "YYYY-MM-DD", or "" before the screen has told the date
 */
export function dayKey(state: GameState): string {
  let key = "";
  if (state.now > 0) {
    const year = new Date(state.now).getFullYear();
    key = `${String(year)}-${String(state.today.month).padStart(PAD, "0")}-${String(state.today.day).padStart(PAD, "0")}`;
  }
  return key;
}

/**
 * The tasks of a day: three different ones, the same all day long.
 *
 * @param day - the day's name
 * @returns indexes into {@link TASKS}
 */
export function tasksOf(day: string): number[] {
  let seed = 0;
  for (const char of day) {
    seed = (seed * HASH_MUL + char.charCodeAt(0)) % LCG_MOD;
  }
  const picked: number[] = [];
  while (picked.length < TASKS_PER_DAY) {
    seed = (seed * LCG_MUL + LCG_ADD) % LCG_MOD;
    // The low bits of this generator repeat quickly: use the high ones.
    const index = Math.floor(seed / HIGH_BITS) % TASKS.length;
    if (!picked.includes(index)) {
      picked.push(index);
    }
  }
  return picked;
}

/**
 * Starts afresh when the day has changed.
 *
 * @param state - the game
 */
export function syncDay(state: GameState): void {
  const day = dayKey(state);
  const daily = state.keep.daily;
  if (day !== "" && daily.day !== day) {
    daily.day = day;
    daily.done.length = 0;
    daily.done.push(...tasksOf(day).map(() => 0));
  }
}

/**
 * Counts something done towards today's tasks, if it is one of them.
 *
 * @param state - the game
 * @param char - who did it; only the character steered counts
 * @param kind - what was done
 */
export function noteTask(
  state: GameState,
  char: Character,
  kind: TaskKind,
): void {
  syncDay(state);
  const daily = state.keep.daily;
  if (steered(state, char) && daily.day !== "") {
    const tasks = tasksOf(daily.day);
    const before = allDone(daily.done, tasks);
    tasks.forEach((index, slot) => {
      const task = TASKS[index];
      if (task.kind === kind) {
        daily.done[slot] = Math.min(task.goal, (daily.done[slot] ?? 0) + 1);
      }
    });
    if (!before && allDone(daily.done, tasks)) {
      say(char, EXTRA_TEXTS.dailyDone);
      state.sounds.push("ding");
      addCount(state, "dailyDays", "dailyTasks");
    }
  }
}

/**
 * Today's tasks and how far they are, for the screen.
 *
 * @param state - the game
 * @returns the three tasks, or none before the date is known
 */
export function todayView(state: GameState): TaskView[] {
  const daily = state.keep.daily;
  const day = dayKey(state);
  const fresh = day !== daily.day;
  return day === ""
    ? []
    : tasksOf(day).map((index, slot) => ({
        ...TASKS[index],
        done: fresh ? 0 : (daily.done[slot] ?? 0),
      }));
}

/** Whether every task of the day has reached its goal. */
function allDone(done: readonly number[], tasks: readonly number[]): boolean {
  return tasks.every((index, slot) => (done[slot] ?? 0) >= TASKS[index].goal);
}
