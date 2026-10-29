/**
 * What the ability and talk keys do: fly, turn into an animal, or put on a
 * show (read wishes, play guitar, look through the telescope, make things
 * float, fall over).
 *
 * @module
 * @remarks
 * One handler per {@link AbilityKind}, looked up from the character's data.
 * A new ability is a new kind in `cast.ts` and one more entry here; a show
 * also gets its handlers in `shows.ts`.
 */
import {
  ANIMAL_TEXTS,
  BUBBLE_TEXTS,
  CHARACTER_TEXTS,
} from "@/games/weihnachtsmann/i18n/texts";
import { ANIMALS, CAST, type AbilityKind } from "./cast";
import { poof, say, snowPuff } from "./effects";
import { areaMap, fits } from "./map";
import { pick } from "./random";
import { startShow } from "./shows";
import {
  ANIMAL_IDS,
  type AnimalId,
  type Character,
  type GameState,
} from "./types";

/** How far above the feet the poof sits, map px. */
const POOF_LIFT = 8;

/** What each kind of ability does when its key is pressed. */
const HANDLERS: Readonly<
  Record<AbilityKind, (state: GameState, char: Character) => void>
> = {
  fly: toggleFlight,
  transform: transform,
  wishes: (state, char) => {
    startShow(state, char, "wishes");
  },
  guitar: (state, char) => {
    startShow(state, char, "guitar");
  },
  telescope: (state, char) => {
    startShow(state, char, "telescope");
  },
  levitate: (state, char) => {
    startShow(state, char, "levitate");
  },
  fall: (state, char) => {
    startShow(state, char, "fall");
  },
};

/**
 * Uses the ability of the character the player steers.
 *
 * @param state - the game
 */
export function applyAbility(state: GameState): void {
  const char = state.chars[state.active];
  HANDLERS[CAST[char.id].ability](state, char);
}

/**
 * Lets the character the player steers say something.
 *
 * @param state - the game
 */
export function talk(state: GameState): void {
  const char = state.chars[state.active];
  say(char, pick(state, linesOf(char)));
}

/**
 * Something a character might say, for itself or in its animal shape.
 *
 * @param char - who speaks
 * @returns the lines it can choose from
 */
export function linesOf(char: Character): readonly string[] {
  return char.form === null
    ? CHARACTER_TEXTS[char.id].lines
    : BUBBLE_TEXTS.animalLines[char.form];
}

/**
 * Turns Jordi into an animal, or closes the choice without one.
 *
 * @param state - the game; the animal choice is closed
 * @param animal - the animal, or null to stay Jordi
 */
export function chooseAnimal(state: GameState, animal: AnimalId | null): void {
  const char = state.chars[state.active];
  state.menu = null;
  if (animal !== null && char.form === null) {
    if (ANIMALS[animal].flies && char.area !== "outdoors") {
      say(char, BUBBLE_TEXTS.cannotFlyInside);
    } else if (fits(areaMap(state, char), ANIMALS[animal], char.x, char.y)) {
      char.form = animal;
      char.flying = false;
      poof(state, char.area, char.x, char.y - POOF_LIFT);
      say(
        char,
        `${ANIMAL_TEXTS[animal].name}! ${pick(state, BUBBLE_TEXTS.animalLines[animal])}`,
      );
    } else {
      say(char, BUBBLE_TEXTS.cannotChange);
    }
  }
}

/**
 * Moves the cursor of the animal choice.
 *
 * @param state - the game
 * @param delta - steps to the right, negative to the left
 */
export function moveMenu(state: GameState, delta: number): void {
  if (state.menu !== null) {
    const count = ANIMAL_IDS.length;
    state.menu.cursor = (state.menu.cursor + delta + count) % count;
  }
}

/** Trixi and Rudolf: up into the air, or down again where there is room. */
function toggleFlight(state: GameState, char: Character): void {
  if (!char.flying && char.area !== "outdoors") {
    say(char, BUBBLE_TEXTS.cannotFlyInside);
  } else if (!char.flying) {
    char.flying = true;
    snowPuff(state, char.area, char.x, char.y);
  } else if (fits(areaMap(state, char), CAST[char.id].walk, char.x, char.y)) {
    char.flying = false;
    snowPuff(state, char.area, char.x, char.y);
  } else {
    say(char, BUBBLE_TEXTS.cannotLand);
  }
}

/** Jordi: open the animal choice, or turn back into himself. */
function transform(state: GameState, char: Character): void {
  if (char.form === null) {
    state.menu = { cursor: 0 };
  } else if (fits(areaMap(state, char), CAST[char.id].walk, char.x, char.y)) {
    char.form = null;
    poof(state, char.area, char.x, char.y - POOF_LIFT);
  } else {
    say(char, BUBBLE_TEXTS.cannotChange);
  }
}
