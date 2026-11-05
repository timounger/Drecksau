/**
 * Grantelbart's concert: when he plays his guitar (the ability) on the
 * stage in the south land, everybody nobody steers comes and dances in
 * front of it - lights, notes and riffs for a few bars, then applause.
 *
 * @module
 * @remarks
 * Only the player's Grantelbart starts it, on foot on the stage floor. He
 * stays in his guitar pose while it lasts; switching to somebody else ends
 * it at once. The crowd comes through `gather.ts`.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { unlock } from "./achievements";
import { notes, say } from "./effects";
import { AUDIENCE, STAGE_FLOOR, STAGE_MIDDLE } from "./extras-data";
import { arrivedCount, callTogether, endGather } from "./gather";
import { moveCharacter } from "./movement";
import { areaMap } from "./map";
import { pick } from "./random";
import type { Character, GameState } from "./types";

/** How long a concert lasts, seconds. */
export const CONCERT_SECONDS = 16;

/** Seconds between two riffs. */
const RIFF_EVERY = 2.2;

/** Seconds before Grantelbart can start the next concert. */
const ENCORE_PAUSE = 1.5;

/** Dancers it takes for the achievement. */
const CROWD = 4;

/** How far above his feet the notes come out, map px. */
const NOTE_LIFT = 22;

/**
 * Whether somebody stands on the stage's floor, on foot.
 *
 * @param char - the character
 * @returns true on the boards
 */
export function onStage(char: Character): boolean {
  return (
    char.area === "outdoors" &&
    char.altitude < 1 &&
    char.x > STAGE_FLOOR.left &&
    char.x < STAGE_FLOOR.right &&
    char.y > STAGE_FLOOR.top &&
    char.y < STAGE_FLOOR.bottom
  );
}

/**
 * Starts the concert when the player's Grantelbart plays on the stage, and
 * runs it on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateConcert(state: GameState, dt: number): void {
  const extras = state.world.extras;
  const concert = extras.concert;
  const char = state.chars[state.active];
  if (
    concert === null &&
    char.id === "grantelbart" &&
    char.show?.kind === "guitar" &&
    char.form === null &&
    extras.eve === null &&
    onStage(char)
  ) {
    extras.concert = { who: state.active, elapsed: 0, riffIn: RIFF_EVERY };
    endGather(state);
    callTogether(state, "concert", AUDIENCE, STAGE_MIDDLE, new Set());
    say(char, pick(state, EXTRA_TEXTS.concertStart));
  } else if (concert !== null) {
    concert.elapsed += dt;
    concert.riffIn -= dt;
    const player = state.chars[concert.who];
    if (state.active !== concert.who || player.area !== "outdoors") {
      stopConcert(state, false);
    } else if (concert.elapsed >= CONCERT_SECONDS) {
      stopConcert(state, true);
    } else if (concert.riffIn <= 0) {
      concert.riffIn = RIFF_EVERY;
      state.sounds.push("riff");
      notes(state, "outdoors", player.x, player.y - NOTE_LIFT);
    }
  }
}

/**
 * Holds Grantelbart in his pose while he rocks: he stands, the guitar goes
 * on.
 *
 * @param state - the game
 * @param char - the character
 * @param index - its index
 * @param dt - seconds
 * @returns true while the concert holds him
 */
export function holdRocker(
  state: GameState,
  char: Character,
  index: number,
  dt: number,
): boolean {
  const concert = state.world.extras.concert;
  const held = concert !== null && concert.who === index;
  if (held) {
    if (char.show === null) {
      char.show = { kind: "guitar", elapsed: 0, tickIn: 0 };
    }
    moveCharacter(areaMap(state, char), char, 0, 0, dt);
  }
  return held;
}

/** Ends the concert: applause when it was played to the end. */
function stopConcert(state: GameState, full: boolean): void {
  const extras = state.world.extras;
  const concert = extras.concert;
  if (concert !== null) {
    const crowd = arrivedCount(state);
    const gather = extras.gather;
    if (full && gather !== null) {
      state.sounds.push("cheer");
      for (const index of gather.arrived) {
        say(state.chars[index], pick(state, EXTRA_TEXTS.concertCheer));
      }
      say(state.chars[concert.who], EXTRA_TEXTS.concertThanks);
      if (crowd >= CROWD) {
        unlock(state, "stageRock");
      }
    }
    // He puts the guitar down; the next concert needs a fresh riff.
    const rocker = state.chars[concert.who];
    rocker.show = null;
    rocker.cooldown = Math.max(rocker.cooldown, ENCORE_PAUSE);
    extras.concert = null;
    endGather(state);
  }
}
