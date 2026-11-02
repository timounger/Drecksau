/**
 * Santa's mailbox by the workshop: now and then a letter lies in it with a
 * little errand - bring a lost thing to somebody, pay somebody a visit, or
 * fetch a treat from the market. An arrow shows the way; done is done with
 * sparkles and a thank-you, and every errand counts.
 *
 * @module
 */
import { CHARACTER_TEXTS, EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered } from "./achievements";
import { carries, pickUp } from "./carry";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { FIND_SPOTS, MAILBOX, STALLS } from "./east-data";
import { TILE } from "./map";
import { pick, randomIn } from "./random";
import { rest } from "./wander";
import type {
  AreaId,
  Character,
  CharacterId,
  Errand,
  GameState,
} from "./types";

/** Seconds until the next letter after an errand is done. */
const NEXT_MIN = 20;
const NEXT_MAX = 45;

/** How near one has to come to a lost thing or somebody, map px. */
const PICK_REACH = 12;
const MEET_REACH = 26;

/** How near one has to come for the one waiting to stand still, map px, and how long. */
const WAIT_REACH = 90;
const WAIT_SECONDS = 1;

/** Sparkles when an errand is done, and how fast they fly. */
const SPARKLES = 10;
const SPRAY = 22;

/** The kinds of errand, drawn at random. */
const KINDS: readonly Errand["kind"][] = ["deliver", "visit", "fetch"];

/** The lost things one can find. */
export const ITEM_COUNT = 3;

/**
 * The talk key at the mailbox: a new errand, if a letter is waiting.
 *
 * @param state - the game
 * @param char - who opens it
 */
export function useMailbox(state: GameState, char: Character): void {
  const east = state.world.east;
  if (east.errand !== null) {
    say(char, `${EAST_TEXTS.mailboxBusy} ${errandText(east.errand)}`);
  } else if (east.letterIn > 0) {
    say(char, EAST_TEXTS.mailboxEmpty);
  } else {
    east.errand = newErrand(state, char);
    say(char, `${EAST_TEXTS.errand}: ${errandText(east.errand)}`);
    state.sounds.push("paper");
  }
}

/**
 * Whether a letter waits in the mailbox: its flag is up.
 *
 * @param state - the game
 * @returns true while one waits
 */
export function letterWaiting(state: GameState): boolean {
  const east = state.world.east;
  return east.errand === null && east.letterIn <= 0;
}

/**
 * Brings the next letter, and sees whether the errand is done.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateErrands(state: GameState, dt: number): void {
  const east = state.world.east;
  const errand = east.errand;
  const char = state.chars[state.active];
  if (errand === null) {
    east.letterIn = Math.max(0, east.letterIn - dt);
  } else if (errand.kind === "deliver") {
    if (
      !errand.picked &&
      char.carry === null &&
      char.area === "outdoors" &&
      Math.hypot(char.x - errand.x, char.y - errand.y) < PICK_REACH
    ) {
      pickUp(char, "found", errand.item);
      errand.picked = true;
      say(char, EAST_TEXTS.itemFound);
      state.sounds.push("collect");
    } else if (
      errand.picked &&
      carries(char, "found") &&
      meets(state, char, errand.to)
    ) {
      char.carry = null;
      say(target(state, errand.to), pick(state, EAST_TEXTS.errandThanks));
      done(state, char);
    }
  } else if (errand.kind === "visit") {
    if (meets(state, char, errand.to)) {
      say(target(state, errand.to), pick(state, EAST_TEXTS.errandVisit));
      done(state, char);
    }
  } else if (
    carries(char, "treat") &&
    char.carry?.tint === errand.stall &&
    char.area === "outdoors" &&
    Math.hypot(char.x - mailboxPoint().x, char.y - mailboxPoint().y) <
      MEET_REACH
  ) {
    char.carry = null;
    done(state, char);
  }
}

/**
 * What an errand asks for, in words.
 *
 * @param errand - the errand
 * @returns the line shown on screen
 */
export function errandText(errand: Errand): string {
  let text: string;
  switch (errand.kind) {
    case "deliver":
      text = EAST_TEXTS.errandDeliver
        .replace("{item}", EAST_TEXTS.itemNames[errand.item])
        .replace("{who}", CHARACTER_TEXTS[errand.to].name);
      break;
    case "visit":
      text = EAST_TEXTS.errandVisitText.replace(
        "{who}",
        CHARACTER_TEXTS[errand.to].name,
      );
      break;
    case "fetch":
      text = EAST_TEXTS.errandFetch.replace(
        "{stall}",
        EAST_TEXTS.stallNames[errand.stall],
      );
      break;
  }
  return text;
}

/**
 * Where the errand's arrow points: the lost thing, the one to visit or
 * bring it to, the booth or back to the mailbox.
 *
 * @param state - the game
 * @returns the place and the point, map px, or null without an errand
 */
export function errandGoal(
  state: GameState,
): { area: AreaId; x: number; y: number } | null {
  const errand = state.world.east.errand;
  const char = state.chars[state.active];
  let goal: { area: AreaId; x: number; y: number } | null = null;
  if (errand !== null) {
    switch (errand.kind) {
      case "deliver":
        goal =
          errand.picked && carries(char, "found")
            ? whereIs(state, errand.to)
            : errand.picked
              ? null
              : { area: "outdoors", x: errand.x, y: errand.y };
        break;
      case "visit":
        goal = whereIs(state, errand.to);
        break;
      case "fetch": {
        const stall = STALLS[errand.stall];
        goal = carries(char, "treat")
          ? { area: "outdoors", ...mailboxPoint() }
          : {
              area: "outdoors",
              x: (stall.tx + 1 + 1 / 2) * TILE,
              y: (stall.ty + 2) * TILE,
            };
        break;
      }
    }
  }
  return goal;
}

/**
 * The foot of the mailbox, map px.
 *
 * @returns the point in front of it
 */
export function mailboxPoint(): { x: number; y: number } {
  return { x: (MAILBOX.tx + 1 / 2) * TILE, y: (MAILBOX.ty + 1) * TILE };
}

/** A fresh errand, never for the one who opens the mailbox. */
function newErrand(state: GameState, char: Character): Errand {
  const others = state.chars
    .filter((other) => other !== char)
    .map((other) => other.id);
  const to: CharacterId = pick(state, others);
  const kind = pick(state, KINDS);
  let errand: Errand;
  switch (kind) {
    case "deliver": {
      const [tx, ty] = pick(state, FIND_SPOTS);
      errand = {
        kind,
        item: Math.floor(randomIn(state, 0, ITEM_COUNT)),
        x: (tx + 1 / 2) * TILE,
        y: (ty + 1 / 2) * TILE,
        picked: false,
        to,
      };
      break;
    }
    case "visit":
      errand = { kind, to };
      break;
    case "fetch":
      errand = { kind, stall: Math.floor(randomIn(state, 0, STALLS.length)) };
      break;
  }
  return errand;
}

/**
 * Whether the character steered stands right by somebody else; somebody
 * expecting a visit waits for whoever comes near.
 */
function meets(state: GameState, char: Character, id: CharacterId): boolean {
  const other = target(state, id);
  if (
    other !== char &&
    other.area === char.area &&
    Math.hypot(other.x - char.x, other.y - char.y) < WAIT_REACH
  ) {
    rest(other, WAIT_SECONDS);
  }
  return (
    other !== char &&
    other.area === char.area &&
    Math.hypot(other.x - char.x, other.y - char.y) < MEET_REACH
  );
}

/** The character of an id. */
function target(state: GameState, id: CharacterId): Character {
  return state.chars.find((char) => char.id === id) ?? state.chars[0];
}

/** Where somebody is: the place and the feet. */
function whereIs(
  state: GameState,
  id: CharacterId,
): { area: AreaId; x: number; y: number } {
  const other = target(state, id);
  return { area: other.area, x: other.x, y: other.y };
}

/** The errand is done: sparkles, thanks, counted, and a new letter later. */
function done(state: GameState, char: Character): void {
  const east = state.world.east;
  east.errand = null;
  east.letterIn = randomIn(state, NEXT_MIN, NEXT_MAX);
  for (let k = 0; k < SPARKLES; k += 1) {
    spawn(
      state,
      "sparkle",
      char.area,
      char.x,
      char.y - TILE,
      randomIn(state, -SPRAY, SPRAY),
      randomIn(state, -SPRAY, 0),
      k % SPARKLE_TINTS,
    );
  }
  state.sounds.push("collect");
  if (steered(state, char)) {
    addCount(state, "errands", "errands5");
    say(char, pick(state, EAST_TEXTS.errandDone));
  }
}
