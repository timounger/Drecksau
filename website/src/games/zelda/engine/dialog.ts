/**
 * The text box: typing a message out letter by letter, page by page - and
 * Link holding a find over his head before the box explains it.
 *
 * @module
 * @remarks
 * Timed like the handheld: the box unfolds in a blink, the letters run at
 * about fifty a second with a soft tick, A finishes the page at once or turns
 * to the next one, and a find is held up for a moment, with its jingle,
 * before any words appear.
 */
import type { GameState, StepReport, Treasure } from "./types";

/** Letters typed per second. */
const TYPE_SPEED = 50;

/** A tick sounds every so many letters. */
const TICK_EVERY = 3;

/** Seconds the box takes to unfold. */
export const DIALOG_OPEN = 0.12;

/** Seconds Link holds a find up before the text box opens. */
const HOLD_SHOW = 0.9;

/** Pages of a text are split by this mark. */
const PAGE_MARK = "|";

/**
 * Opens the text box.
 *
 * @param state - the game
 * @param text - the message, pages split by "|"
 */
export function openDialog(state: GameState, text: string): void {
  state.dialog = {
    pages: text.split(PAGE_MARK).map((page) => page.trim()),
    page: 0,
    shown: 0,
    t: 0,
  };
}

/**
 * Types on, turns pages, closes the box.
 *
 * @param state - the game
 * @param confirm - a button went down this step
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepDialog(
  state: GameState,
  confirm: boolean,
  report: StepReport,
  dt: number,
): void {
  const dialog = state.dialog;
  if (dialog !== null) {
    dialog.t += dt;
    const page = dialog.pages[dialog.page];
    if (dialog.t >= DIALOG_OPEN) {
      const before = Math.floor(dialog.shown);
      dialog.shown = Math.min(page.length, dialog.shown + TYPE_SPEED * dt);
      const after = Math.floor(dialog.shown);
      if (
        Math.floor(after / TICK_EVERY) > Math.floor(before / TICK_EVERY) &&
        page[after - 1] !== " "
      ) {
        report.events.push("type");
      }
    }
    if (confirm && dialog.t >= DIALOG_OPEN) {
      if (dialog.shown < page.length) {
        dialog.shown = page.length;
      } else if (dialog.page < dialog.pages.length - 1) {
        dialog.page += 1;
        dialog.shown = 0;
        report.events.push("text");
      } else {
        state.dialog = null;
        report.events.push("menu");
      }
    }
  }
}

/**
 * Lets Link hold a find up, then explains it.
 *
 * @param state - the game
 * @param item - what he found
 * @param text - what the box says about it
 * @param report - where to note what happened
 * @param big - a big find, with the long jingle
 */
export function holdUp(
  state: GameState,
  item: Treasure,
  text: string,
  report: StepReport,
  big: boolean,
): void {
  state.hold = { item, text, t: 0, told: false };
  state.player.action = { kind: "hold", t: 0 };
  state.player.facing = "down";
  state.player.charge = 0;
  state.player.vx = 0;
  state.player.vy = 0;
  report.events.push(big ? "fanfare" : "smallItem");
}

/**
 * Moves the holding pose on: the text after a moment, the end with the text.
 *
 * @param state - the game
 * @param dt - seconds since the last step
 * @returns true while Link is still holding something up
 */
export function stepHold(state: GameState, dt: number): boolean {
  const hold = state.hold;
  if (hold !== null) {
    hold.t += dt;
    if (!hold.told && hold.t >= HOLD_SHOW) {
      hold.told = true;
      openDialog(state, hold.text);
    } else if (hold.told && state.dialog === null) {
      state.hold = null;
      state.player.action = { kind: "idle" };
    }
  }
  return state.hold !== null;
}
