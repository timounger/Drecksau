/**
 * Solving a Murdle case: every way the weapons, places and motives could be
 * handed out, and the ones the clues and statements leave standing.
 *
 * @module
 */
import type {
  Accusation,
  Case,
  Draft,
  Location,
  Motive,
  Scene,
  Suspect,
  Weapon,
  World,
} from "./types";

/** The empty accusation form. */
export const NO_DRAFT: Draft = {
  suspect: "",
  weapon: "",
  location: "",
  motive: "",
};

/** One way it could have been, and who did it then. */
export type Solution = {
  readonly world: World;
  readonly murderer: string;
};

/**
 * Every way the case can be solved.
 *
 * @param kase - the case
 * @returns the solutions - exactly one for a sound case
 */
export function solve(kase: Case): readonly Solution[] {
  const suspects = kase.suspects.map((one) => one.id);
  const weaponOrders = permutations(kase.weapons.map((one) => one.id));
  const locationOrders = permutations(kase.locations.map((one) => one.id));
  const motiveOrders =
    kase.motives === undefined
      ? [null]
      : permutations(kase.motives.map((one) => one.id));
  const found: Solution[] = [];
  for (const weapons of weaponOrders) {
    for (const locations of locationOrders) {
      for (const motives of motiveOrders) {
        const world: World = Object.fromEntries(
          suspects.map((id, at) => [
            id,
            motives === null
              ? { weapon: weapons[at], location: locations[at] }
              : {
                  weapon: weapons[at],
                  location: locations[at],
                  motive: motives[at],
                },
          ]),
        );
        for (const murderer of murderersOf(kase, world)) {
          found.push({ world, murderer });
        }
      }
    }
  }
  return found;
}

/**
 * The suspects who could be the murderer in one way it could have been:
 * every clue holds, the murderer was where the body was found, and of the
 * statements exactly the murderer's is false.
 *
 * @param kase - the case
 * @param world - one way it could have been
 * @returns the possible murderers - none when the world breaks a clue
 */
export function murderersOf(kase: Case, world: World): readonly string[] {
  const scene = sceneOf(kase, world);
  const fits = kase.clues.every((clue) => clue.holds(scene));
  const candidates =
    kase.body === undefined
      ? kase.suspects.map((one) => one.id)
      : [
          "location" in kase.body
            ? scene.at(kase.body.location).id
            : scene.holder(kase.body.weapon).id,
        ];
  return fits
    ? candidates.filter((murderer) =>
        (kase.statements ?? []).every(
          (statement) => statement.holds(scene) === (statement.by !== murderer),
        ),
      )
    : [];
}

/**
 * One way it could have been, with the questions a clue asks of it.
 *
 * @param kase - the case
 * @param world - who had what where
 * @returns the scene
 */
export function sceneOf(kase: Case, world: World): Scene {
  const ids = Object.keys(world);
  const suspect = (id: string): Suspect => find(kase.suspects, id);
  const by = (pick: (id: string) => string | undefined, value: string) =>
    suspect(ids.find((id) => pick(id) === value) ?? "");
  return {
    world,
    suspect,
    holder: (weapon) => by((id) => world[id].weapon, weapon),
    at: (location) => by((id) => world[id].location, location),
    driven: (motive) => by((id) => world[id].motive, motive),
    weaponOf: (id): Weapon => find(kase.weapons, world[id].weapon),
    locationOf: (id): Location => find(kase.locations, world[id].location),
    motiveOf: (id): Motive | null => {
      const motive = world[id].motive;
      return motive === undefined || kase.motives === undefined
        ? null
        : find(kase.motives, motive);
    },
  };
}

/**
 * The accusation that solves the case.
 *
 * @param kase - the case
 * @returns the murderer with weapon, place and, where asked, motive
 */
export function answerOf(kase: Case): Accusation {
  const own = kase.solution[kase.murderer];
  return {
    suspect: kase.murderer,
    weapon: own.weapon,
    location: own.location,
    ...(own.motive === undefined ? {} : { motive: own.motive }),
  };
}

/**
 * The accusation form filled in with the right answer.
 *
 * @param kase - the case
 * @returns every field as it should be - the motive empty in a case without
 */
export function solvedDraft(kase: Case): Draft {
  const answer = answerOf(kase);
  return {
    suspect: answer.suspect,
    weapon: answer.weapon,
    location: answer.location,
    motive: answer.motive ?? "",
  };
}

/**
 * Whether an accusation is the right one.
 *
 * @param kase - the case
 * @param accusation - who, with what, where and why
 * @returns whether every part is right
 */
export function isRight(kase: Case, accusation: Accusation): boolean {
  const answer = answerOf(kase);
  return (
    accusation.suspect === answer.suspect &&
    accusation.weapon === answer.weapon &&
    accusation.location === answer.location &&
    accusation.motive === answer.motive
  );
}

/**
 * Every order of some items.
 *
 * @param items - the items
 * @returns each order once
 */
function permutations(items: readonly string[]): readonly string[][] {
  return items.length <= 1
    ? [[...items]]
    : items.flatMap((first, at) =>
        permutations(items.filter((_, other) => other !== at)).map((rest) => [
          first,
          ...rest,
        ]),
      );
}

/**
 * An item of a case by its id.
 *
 * @param items - the items of one category
 * @param id - the one looked for
 * @returns it
 * @throws when the case has no such item - a typo in a case's data
 */
function find<T extends { readonly id: string }>(
  items: readonly T[],
  id: string,
): T {
  const found = items.find((one) => one.id === id);
  if (found === undefined) {
    throw new Error(`No item "${id}" in this case`);
  }
  return found;
}
