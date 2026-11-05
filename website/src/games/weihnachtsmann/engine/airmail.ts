/**
 * Trixi's air mail: at the board beside the post office she takes an order
 * of three parcels; golden rings mark the roofs to deliver to, and flying
 * over a marked roof drops its parcel. The clock runs from the order to the
 * last parcel; the best time is kept.
 *
 * @module
 * @remarks
 * Only the player's Trixi delivers. Switching to somebody else, going
 * indoors or taking too long cancels the order. The best time is saved in
 * tenths of a second as `counts.postBest`.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { unlock } from "./achievements";
import { carries } from "./carry";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { ROOFS } from "./extras-data";
import { TILE } from "./map";
import { nextRandom, pick } from "./random";
import type { Character, GameState } from "./types";

/** Parcels in one order. */
export const PARCELS = 3;

/** The longest an order may take, seconds. */
export const MAIL_SECONDS = 120;

/** Tenths in a second, for the best time. */
const TENTHS = 10;

/** How far round a roof's footprint a flyer still delivers, map px. */
const ROOF_SLACK = 6;

/** Sparkles of a delivery. */
const DROP_SPARKLES = 8;
const DROP_SPRAY = 24;

/**
 * The talk key at the air mail board: Trixi takes an order; anybody else is
 * told it is her job.
 *
 * @param state - the game
 * @param char - who is at the board
 */
export function useBoard(state: GameState, char: Character): void {
  const extras = state.world.extras;
  if (char.id !== "trixi") {
    say(char, EXTRA_TEXTS.mailOnlyTrixi);
  } else if (extras.airMail !== null) {
    say(char, EXTRA_TEXTS.mailRunning);
  } else if (char.carry !== null) {
    say(char, EXTRA_TEXTS.mailHandsFull);
  } else {
    const roofs: number[] = [];
    while (roofs.length < PARCELS) {
      const index = Math.floor(nextRandom(state) * ROOFS.length);
      if (!roofs.includes(index)) {
        roofs.push(index);
      }
    }
    extras.airMail = {
      who: state.chars.indexOf(char),
      roofs,
      done: new Set(),
      time: 0,
    };
    char.carry = { kind: "parcel", tint: 0 };
    state.sounds.push("paper");
    say(char, EXTRA_TEXTS.mailStart);
  }
}

/**
 * Runs the order on: the clock, deliveries by flying over a marked roof,
 * the end.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateAirMail(state: GameState, dt: number): void {
  const mail = state.world.extras.airMail;
  if (mail !== null) {
    const char = state.chars[mail.who];
    mail.time += dt;
    if (char.flying && char.area === "outdoors") {
      for (const index of mail.roofs) {
        const roof = ROOFS[index];
        if (
          !mail.done.has(index) &&
          char.x > roof.tx * TILE - ROOF_SLACK &&
          char.x < (roof.tx + roof.w) * TILE + ROOF_SLACK &&
          char.y > roof.ty * TILE - ROOF_SLACK &&
          char.y < (roof.ty + roof.h) * TILE + ROOF_SLACK
        ) {
          deliver(state, char, index);
        }
      }
    }
    if (mail.done.size >= mail.roofs.length) {
      finish(state, char);
    } else if (
      state.active !== mail.who ||
      char.area !== "outdoors" ||
      mail.time > MAIL_SECONDS
    ) {
      say(char, pick(state, EXTRA_TEXTS.mailAbort));
      drop(state);
    }
  }
}

/**
 * The time of the running order, for the line at the top.
 *
 * @param state - the game
 * @returns tenths of a second, or null with no order
 */
export function mailTenths(state: GameState): number | null {
  const mail = state.world.extras.airMail;
  return mail === null ? null : Math.floor(mail.time * TENTHS);
}

/** One parcel dropped onto its roof. */
function deliver(state: GameState, char: Character, index: number): void {
  const mail = state.world.extras.airMail;
  if (mail !== null) {
    mail.done.add(index);
    const roof = ROOFS[index];
    for (let k = 0; k < DROP_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        "outdoors",
        (roof.tx + roof.w / 2) * TILE,
        roof.ty * TILE,
        ((k / DROP_SPARKLES) * 2 - 1) * DROP_SPRAY,
        -DROP_SPRAY,
        k % SPARKLE_TINTS,
      );
    }
    state.sounds.push("ding");
    say(
      char,
      EXTRA_TEXTS.mailDropped
        .replace("{n}", String(mail.done.size))
        .replace("{of}", String(mail.roofs.length)),
    );
  }
}

/** All delivered: the time, a new best, the achievement. */
function finish(state: GameState, char: Character): void {
  const mail = state.world.extras.airMail;
  if (mail !== null) {
    const tenths = Math.max(1, Math.round(mail.time * TENTHS));
    const best = state.counts.postBest;
    if (best === 0 || tenths < best) {
      state.counts.postBest = tenths;
    }
    say(
      char,
      `${EXTRA_TEXTS.mailDone} ${(tenths / TENTHS).toFixed(1)} s${best === 0 || tenths < best ? ` - ${EXTRA_TEXTS.mailBest}` : ""}`,
    );
    state.sounds.push("cheer");
    unlock(state, "airMail");
    drop(state);
  }
}

/** The order is over: the parcel goes. */
function drop(state: GameState): void {
  const mail = state.world.extras.airMail;
  if (mail !== null) {
    const char = state.chars[mail.who];
    if (carries(char, "parcel")) {
      char.carry = null;
    }
    state.world.extras.airMail = null;
  }
}
