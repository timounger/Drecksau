/**
 * Saved games: the one that saves itself, and the ten one names.
 *
 * @module
 * @remarks
 * A city this size is not a round one plays in five minutes, so the game keeps
 * itself: every few seconds the state goes to the browser, and starting the
 * page picks it up again. Beside that there are ten slots one fills on purpose,
 * each with a name and the day it was written.
 *
 * **The floor is not saved.** It is eight thousand pixels of city and it comes
 * out of the plan every time exactly as it went in, so what goes to disk is
 * everything except {@link GameState.cells} - and the garages are cut out of it
 * again on the way back. That is the difference between a save of forty
 * kilobytes and one of four hundred.
 */
import {
  createCity,
  myHouses,
  openBay,
  setGarage,
} from "@/games/gta/engine/city";
import { newAcks, newChopper } from "@/games/gta/engine/setup";
import type { GameState } from "@/games/gta/engine/types";
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";

/** One of the ten slots, as the list shows it. */
export type SaveSlot = {
  /** Which slot, from zero up. */
  readonly at: number;
  /** What the player called it. */
  readonly name: string;
  /** When it was written, as milliseconds since 1970. */
  readonly savedAt: number;
};

/** How many slots there are. */
export const MAX_SAVES = 10;

/**
 * The schema version: old saves are dropped rather than guessed at.
 *
 * @remarks
 * Two, since San Andreas got its countryside. A game saved on the old map has
 * its player standing in what is now the sea and its train on a line that no
 * longer runs there - that is not a save to patch up, it is a save from a
 * different city.
 */
const VERSION = 2;

/** Everything of a game except the floor, which is rebuilt. */
type Stored = Omit<GameState, "cells">;

/** One entry of the list on disk. */
type Entry = SaveSlot & { readonly game: Stored };

/**
 * Writes the game that carries on when the page is opened again.
 *
 * @param state - the game as it stands
 */
export function autoSave(state: GameState): void {
  writeStored(autoKey(), VERSION, strip(state));
}

/**
 * The game the page was last left in.
 *
 * @returns it, or null when there is nothing to carry on from
 */
export function readAuto(): GameState | null {
  const stored = readStored<Stored>(autoKey(), VERSION, isGame);
  return stored === null ? null : rebuild(stored);
}

/**
 * The ten slots, newest first.
 *
 * @returns what is in them, without the games themselves
 */
export function listSaves(): readonly SaveSlot[] {
  return [...entries()]
    .map((entry) => ({
      at: entry.at,
      name: entry.name,
      savedAt: entry.savedAt,
    }))
    .sort((one, other) => other.savedAt - one.savedAt);
}

/**
 * Saves the game under a name.
 *
 * @param name - what to call it
 * @param state - the game as it stands
 * @returns the slots afterwards
 * @remarks
 * Eleven saves would be one too many, so the oldest goes. Somebody who wanted
 * to keep it would have kept it.
 */
export function saveAs(name: string, state: GameState): readonly SaveSlot[] {
  const kept = [...entries()].sort((one, other) => other.savedAt - one.savedAt);
  const room = kept.slice(0, MAX_SAVES - 1);
  const taken = new Set(room.map((entry) => entry.at));
  let at = 0;
  while (taken.has(at)) {
    at += 1;
  }
  const entry: Entry = {
    at,
    name: name.trim() === "" ? "Ohne Namen" : name.trim(),
    savedAt: Date.now(),
    game: strip(state),
  };
  // A browser with no room left says so rather than pretending: what comes
  // back is what is actually on the disk.
  writeStored(slotsKey(), VERSION, [...room, entry]);
  return listSaves();
}

/**
 * Reads one slot back.
 *
 * @param at - which slot
 * @returns the game, or null when the slot is empty
 */
export function loadSave(at: number): GameState | null {
  const entry = entries().find((each) => each.at === at);
  return entry === undefined ? null : rebuild(entry.game);
}

/**
 * Throws one slot away.
 *
 * @param at - which slot
 * @returns the slots afterwards
 */
export function dropSave(at: number): readonly SaveSlot[] {
  writeStored(
    slotsKey(),
    VERSION,
    entries().filter((each) => each.at !== at),
  );
  return listSaves();
}

/** Forgets the game in progress, so the next start is a fresh city. */
export function clearAuto(): void {
  removeStored(autoKey());
}

/* --------------------------------------------------------------- the disk */

/** Where the game in progress lives. */
function autoKey(): string {
  return storageKey("gta", "auto");
}

/** And the ten named ones. */
function slotsKey(): string {
  return storageKey("gta", "saves");
}

/** What is in the slots right now. */
function entries(): readonly Entry[] {
  return readStored<readonly Entry[]>(slotsKey(), VERSION, isList) ?? [];
}

/**
 * The game without its floor, and without half its decimals.
 *
 * @param state - the game as it stands
 * @returns what goes to disk
 * @remarks
 * Nine hundred people and three hundred cars, each carrying a handful of
 * numbers like `2092.3847273846`, come to a quarter of a megabyte - and ten
 * slots of that is most of what a browser will store. Two decimals is a
 * fortieth of a pixel: nobody can see it, and it halves the file.
 */
function strip(state: GameState): Stored {
  const { cells, ...rest } = state;
  void cells;
  return short(rest) as Stored;
}

/** The same thing with every number rounded to two decimals. */
function short(value: unknown): unknown {
  let out: unknown;
  if (typeof value === "number") {
    out = Math.round(value * PLACES) / PLACES;
  } else if (Array.isArray(value)) {
    out = value.map(short);
  } else if (typeof value === "object" && value !== null) {
    out = Object.fromEntries(
      Object.entries(value).map(([key, each]) => [key, short(each)]),
    );
  } else {
    out = value;
  }
  return out;
}

/** How finely a number is kept: hundredths of a pixel. */
const PLACES = 100;

/**
 * The floor, laid again under a saved game.
 *
 * @param stored - what came back off the disk
 * @returns a game that can be stepped
 * @remarks
 * The plan is the same every time, so this is not a guess: the same three
 * garages are cut out of the same three houses, and whichever door was open
 * when the game was saved is opened again.
 */
function rebuild(stored: Stored): GameState {
  // **The garages come from the plan, not from the file.** They are a formula
  // over a city that is itself a formula - one house per island, the one
  // nearest the middle of it - so a stand written before the plan changed can
  // simply be given today's answer. And it has to be: the prison grew to four
  // blocks, and the house one of these was cut into ended up **inside** it,
  // which put the player's own garage door through the prison wall. Nothing is
  // lost by recomputing them, because nothing in the game ever moves one.
  const homes = myHouses();
  let floor = createCity();
  for (const home of homes) {
    floor = openBay(floor, home);
  }
  const open = stored.garageOpen;
  const garage = open === null ? undefined : homes[open];
  return {
    ...stored,
    garages: homes,
    // A stand written before the train learned to accelerate has no speed in
    // it, and a train at undefined pixels a second goes nowhere at all.
    // A stand written before cars could slide has no sideways speed in it,
    // and a car at undefined pixels a second goes nowhere sensible.
    cars: stored.cars.map((car) => ({
      ...car,
      slip: car.slip ?? 0,
      braking: car.braking ?? false,
      seats: car.seats ?? 0,
      // A stand written before the wheels turned has no mileage on it, and a
      // wheel at undefined radians is not drawn at all.
      rolled: car.rolled ?? 0,
      locked: car.locked ?? false,
      wakeAt: car.wakeAt ?? 0,
      // A stand written before drivers steered rather than snapped has no
      // wanted heading on it; the one the car is pointing is the right guess.
      want: car.want ?? car.angle,
      lean: car.lean ?? 0,
    })),
    // Skid marks are weather, not history: they fade on their own and nobody
    // comes back to a saved game for them.
    marks: [],
    markAt: 0,
    // Everybody on foot gained a pace; a stand written before that has none,
    // and a figure leaning forward by NaN pixels is not drawn at all.
    player: {
      ...stored.player,
      pace: stored.player.pace ?? 0,
      // A stand written before the jetpack had a flame has no switch for it,
      // and it is off: nobody is saved mid-climb.
      thrust: stored.player.thrust ?? false,
      // Nobody is saved standing in a prison yard with the lights on him: a
      // stand written before the towers watched has no alarm to restore.
      spotted: stored.player.spotted ?? null,
      // A stand written before the tank had a machine gun on it has no clock
      // for it, and a gun that may next fire at undefined never fires.
      gunAt: stored.player.gunAt ?? 0,
      // Nobody is halfway into a car in a saved game: a stand written mid-walk
      // comes back with him standing beside it, which is where the key left
      // him anyway.
      boarding: stored.player.boarding ?? null,
    },
    people: stored.people.map((one) => ({ ...one, pace: one.pace ?? 0 })),
    cops: stored.cops.map((one) => ({ ...one, pace: one.pace ?? 0 })),
    train: { ...stored.train, speed: stored.train.speed ?? 0 },
    // A stand written before there was a helicopter has none; it belongs on
    // its pad, which is where a new one starts.
    chopper: stored.chopper ?? newChopper(),
    ackAt: stored.ackAt ?? 0,
    acks: stored.acks ?? newAcks(),
    cells: garage === undefined ? floor : setGarage(floor, garage, true),
  };
}

/** Whether something off the disk looks like a game at all. */
function isGame(value: unknown): value is Stored {
  const game = value as Partial<Stored> | null;
  return (
    typeof game === "object" &&
    game !== null &&
    typeof game.time === "number" &&
    typeof game.phase === "string" &&
    Array.isArray(game.garages) &&
    Array.isArray(game.cars) &&
    game.player !== undefined
  );
}

/** And whether something looks like the list of slots. */
function isList(value: unknown): value is readonly Entry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry: unknown) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as Entry).at === "number" &&
        typeof (entry as Entry).name === "string" &&
        typeof (entry as Entry).savedAt === "number" &&
        isGame((entry as Entry).game),
    )
  );
}
