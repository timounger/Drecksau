/**
 * Alles, was ein Spieler behält: Punkte, Ausbau und gemeisterte Gewässer.
 *
 * @module
 * @remarks
 * One object in localStorage, and every rule about it is a function here - so
 * the map, the upgrade board and the dive cannot disagree about what is
 * unlocked or what is still affordable.
 *
 * **What is stored is what was earned, never what is left.** Points spent are
 * worked out from the upgrades themselves ({@link spentOn}), which is why
 * putting everything back is one line and can never leak or invent points:
 * hand out fresh levels and the whole sum is free again.
 *
 * localStorage does not exist during the prerender, so none of this may be
 * read before hydration.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { LEVELS, LEVEL_COUNT } from "@/games/uboot/engine/levels";
import {
  DEFAULT_GRADE,
  TOP_GRADE,
  heldGrade,
} from "@/games/uboot/engine/grades";
import {
  NO_UPGRADES,
  UPGRADES,
  gearFrom,
  nextCost,
  spentOn,
  topLevel,
  type Gear,
  type UpgradeId,
} from "@/games/uboot/engine/upgrades";

/** Schema version of the stored value - raise it on breaking changes. */
const PROFILE_VERSION = 1;

/** Where it lives. */
const PROFILE_KEY = storageKey("uboot", "profile");

/**
 * What a course pays when it is dived again, as a share of the first time.
 *
 * @remarks
 * A quarter: enough that a water you like is worth going back to, little
 * enough that grinding the harbour is plainly the slow way round. Nothing is
 * ever locked away for good - it is only ever further off.
 */
export const REDIVE_SHARE = 0.25;

/** Everything a player keeps between visits. */
export type Profile = {
  /** Every point ever earned. What is left is this minus what is in the boat. */
  readonly xp: number;
  /** How far each track has been taken. */
  readonly upgrades: Readonly<Record<UpgradeId, number>>;
  /** Which courses have been finished, by their number from zero. */
  readonly done: readonly number[];
  /** Auf welcher Schwierigkeit gerade gefahren wird. */
  readonly grade: number;
  /**
   * Die höchste Schwierigkeit, auf der jedes Gewässer geschafft wurde.
   *
   * @remarks
   * Nach Gewässernummer, `-1` für noch nie. **Nur das Höchste wird behalten:**
   * Wer ein Gewässer auf "Unmöglich" hatte und es danach auf "Leicht" noch
   * einmal fährt, hat es trotzdem auf "Unmöglich" geschafft - eine Leistung
   * nimmt man niemandem wieder weg.
   */
  readonly best: readonly number[];
};

/** A player who has just arrived. */
export const NEW_PROFILE: Profile = {
  xp: 0,
  upgrades: NO_UPGRADES,
  done: [],
  grade: DEFAULT_GRADE,
  best: [],
};

/** Was in {@link Profile.best} steht, solange ein Gewässer offen ist. */
export const NEVER = -1;

/**
 * What this browser remembers.
 *
 * @returns the profile, or a fresh one when there is nothing usable stored
 */
export function loadProfile(): Profile {
  const stored = readStored(PROFILE_KEY, PROFILE_VERSION, isProfile);
  return stored === null ? NEW_PROFILE : cleaned(stored);
}

/**
 * Writes a profile back.
 *
 * @param profile - the one to keep
 */
export function saveProfile(profile: Profile): void {
  writeStored(PROFILE_KEY, PROFILE_VERSION, profile);
}

/**
 * Points that are not tied up in the boat.
 *
 * @param profile - the player
 * @returns what may still be spent
 */
export function free(profile: Profile): number {
  return profile.xp - spentOn(profile.upgrades);
}

/**
 * Whether a course may be dived.
 *
 * @param profile - the player
 * @param level - the course, counted from zero
 * @returns true when everything before it is finished
 * @remarks
 * Everything **before** it, not simply the one before: a player who somehow
 * skipped a water - an old save, a number typed into storage by hand - still
 * has to go back for it.
 */
export function canPlay(profile: Profile, level: number): boolean {
  let open = level >= 0 && level < LEVEL_COUNT;
  for (let before = 0; before < level && open; before += 1) {
    open = profile.done.includes(before);
  }
  return open;
}

/**
 * Whether a course has been mastered.
 *
 * @param profile - the player
 * @param level - the course, counted from zero
 * @returns true when it has been finished at least once
 */
export function isDone(profile: Profile, level: number): boolean {
  return profile.done.includes(level);
}

/**
 * Auf welcher Schwierigkeit ein Gewässer schon geschafft wurde.
 *
 * @param profile - der Spieler
 * @param level - das Gewässer, von null an
 * @returns die höchste geschaffte Stufe, oder {@link NEVER}
 */
export function bestOf(profile: Profile, level: number): number {
  return profile.best[level] ?? NEVER;
}

/**
 * Das Profil mit einer anderen gewählten Schwierigkeit.
 *
 * @param profile - der Spieler
 * @param grade - die neue Stufe, von null an
 * @returns das neue Profil
 */
export function withGrade(profile: Profile, grade: number): Profile {
  return { ...profile, grade: heldGrade(grade) };
}

/**
 * The first course that is still open, for the "carry on" button.
 *
 * @param profile - the player
 * @returns the course to offer, counted from zero
 */
export function nextOpen(profile: Profile): number {
  let next = LEVEL_COUNT - 1;
  for (let level = 0; level < LEVEL_COUNT; level += 1) {
    if (!isDone(profile, level)) {
      next = level;
      break;
    }
  }
  return next;
}

/**
 * The profile after a course has been finished.
 *
 * @param profile - the player as they were
 * @param level - the course they got through
 * @returns the new profile and what it paid
 */
export function withMastered(
  profile: Profile,
  level: number,
  grade: number,
): { readonly profile: Profile; readonly gained: number } {
  const course = LEVELS[level];
  const first = !isDone(profile, level);
  const worth =
    course === undefined
      ? 0
      : Math.round(course.reward * (first ? 1 : REDIVE_SHARE));
  // **Nur so viel, wie noch in den Tank passt.** Ausgezahlt wird, was unter
  // dem Deckel Platz hat - und das ist auch die Zahl, die das Siegblatt zeigt.
  // Eine Belohnung anzukündigen, die nicht ankommt, wäre gelogen.
  const gained = Math.min(worth, Math.max(0, XP_CAP - profile.xp));
  const best = [...gradesOf(profile)];
  best[level] = Math.max(best[level] ?? NEVER, heldGrade(grade));
  return {
    profile: {
      ...profile,
      xp: profile.xp + gained,
      done: first ? [...profile.done, level] : profile.done,
      best,
    },
    gained,
  };
}

/** Die Bestleistungen als vollständige Liste, eine je Gewässer. */
function gradesOf(profile: Profile): readonly number[] {
  return LEVELS.map((_, level) => bestOf(profile, level));
}

/**
 * The profile after one step of one track has been bought.
 *
 * @param profile - the player
 * @param id - which track
 * @returns the new profile, or the old one when it cannot be afforded
 */
export function withBought(profile: Profile, id: UpgradeId): Profile {
  const level = profile.upgrades[id] ?? 0;
  const cost = nextCost(id, level);
  const can = cost !== null && cost <= free(profile);
  return can
    ? { ...profile, upgrades: { ...profile.upgrades, [id]: level + 1 } }
    : profile;
}

/**
 * Was der komplette Ausbau von hier aus noch kostet.
 *
 * @param profile - der Spieler
 * @returns die Summe aller Stufen, die ihm noch fehlen
 */
export function restCost(profile: Profile): number {
  return spentOn(FULL_UPGRADES) - spentOn(profile.upgrades);
}

/**
 * Ob die freien Punkte für alles Fehlende reichen.
 *
 * @param profile - der Spieler
 * @returns true, wenn ein einziger Klick das ganze Boot ausbauen könnte
 */
export function canBuyAll(profile: Profile): boolean {
  const rest = restCost(profile);
  return rest > 0 && free(profile) >= rest;
}

/**
 * Das Profil mit allem ausgebaut.
 *
 * @param profile - der Spieler
 * @returns jede Bahn auf ihrer höchsten Stufe, oder unverändert
 * @remarks
 * Nur, wenn es auch bezahlbar ist - sonst passiert nichts. Weil das Ausgegebene
 * aus den Stufen selbst gerechnet wird ({@link spentOn}), stimmt der
 * Punktestand danach von allein, und **einmal alles** kostet exakt so viel wie
 * jede Stufe einzeln zu kaufen.
 */
export function withAll(profile: Profile): Profile {
  return canBuyAll(profile) ? { ...profile, upgrades: FULL_UPGRADES } : profile;
}

/**
 * Alles offen: jedes Gewässer, jede Stufe, und Punkte übrig.
 *
 * @param profile - der Spieler
 * @returns ein Spielstand, in dem nichts mehr verschlossen ist
 * @remarks
 * Der Knopf aus den Einstellungen. Die Punkte sind genau der volle Ausbau -
 * mehr gibt es nicht, auch hier nicht: Der Deckel gilt für die Abkürzung wie
 * für den ehrlichen Weg.
 */
export function withEverythingOpen(profile: Profile): Profile {
  return {
    ...profile,
    xp: XP_CAP,
    upgrades: FULL_UPGRADES,
    done: LEVELS.map((_, level) => level),
    // "Alles freischalten" heißt alles: auch die Bestleistungen, sonst bliebe
    // ausgerechnet die Tafel halb grau.
    best: LEVELS.map(() => TOP_GRADE),
  };
}

/**
 * The profile with the boat stripped back and every point free again.
 *
 * @param profile - the player
 * @returns the new profile - points earned and courses mastered are untouched
 */
export function withStripped(profile: Profile): Profile {
  return { ...profile, upgrades: NO_UPGRADES };
}

/**
 * Every track at the top of its ladder.
 *
 * @remarks
 * Built from the table rather than typed out, so a sixth track or a fourth
 * step is in here the moment it exists.
 */
export const FULL_UPGRADES: Readonly<Record<UpgradeId, number>> =
  Object.fromEntries(
    UPGRADES.map((track) => [track.id, track.steps.length]),
  ) as Record<UpgradeId, number>;

/**
 * Mehr Punkte, als das ganze Boot kostet, kann niemand haben.
 *
 * @remarks
 * **Der Deckel ist der Vollausbau.** Punkte sind in diesem Spiel kein
 * Guthaben, sondern die Frage, welches Boot man fährt - und diese Frage ist
 * beantwortet, sobald alles gekauft werden kann. Was darüber hinausginge,
 * wäre eine Zahl, die nur noch wächst, und die erste Fahrt, bei der sie
 * wächst, ohne dass sich etwas ändert, ist eine Fahrt zu viel.
 *
 * Alle zehn Gewässer bringen beim ersten Mal weniger ein, als der Vollausbau
 * kostet. Wiederholungen zahlen ein Viertel - der Rest ist also erfahrbar, nur
 * eben nicht beliebig oft.
 *
 * Aus der Tabelle gerechnet und nicht hingeschrieben: Eine siebte Bahn
 * verschiebt den Deckel von allein.
 */
export const XP_CAP = spentOn(FULL_UPGRADES);

/**
 * The profile with everything open and enough points for the whole boat.
 *
 * @param profile - the player as they were
 * @returns a player with every water mastered and the full build affordable
 * @remarks
 * The cheat, and deliberately not "set every upgrade to its top": what it
 * hands out is **points**, so the boat is still a decision - it is just no
 * longer one that has to be earned first. Points already tied up in upgrades
 * are added on top, so pressing it twice cannot take anything away.
 */
export function withEverything(profile: Profile): Profile {
  return {
    ...profile,
    xp: XP_CAP,
    done: LEVELS.map((_, level) => level),
    best: LEVELS.map((_, level) => Math.max(bestOf(profile, level), 0)),
  };
}

/**
 * The boat this profile dives in.
 *
 * @param profile - the player
 * @returns the numbers the engine needs
 */
export function gearOf(profile: Profile): Gear {
  return gearFrom(profile.upgrades);
}

/** Whether a stored value has the shape of a profile. */
function isProfile(value: unknown): value is Profile {
  const one = value as Partial<Profile> | null;
  return (
    typeof one === "object" &&
    one !== null &&
    typeof one.xp === "number" &&
    Number.isFinite(one.xp) &&
    typeof one.upgrades === "object" &&
    one.upgrades !== null &&
    Array.isArray(one.done)
  );
}

/**
 * A stored profile held inside what the game now has.
 *
 * @remarks
 * A track that has since been shortened, a course that no longer exists, a
 * number somebody typed in by hand: none of them may reach the rest of the
 * game. What comes out of here is always dive-able.
 */
function cleaned(stored: Profile): Profile {
  const upgrades = { ...NO_UPGRADES };
  for (const id of Object.keys(NO_UPGRADES) as UpgradeId[]) {
    const held = Math.floor(stored.upgrades[id] ?? 0);
    upgrades[id] = Math.max(0, Math.min(topLevel(id), held));
  }
  const done = [...new Set(stored.done)]
    .filter((level) => Number.isInteger(level))
    .filter((level) => level >= 0 && level < LEVEL_COUNT);
  // **Ein alter Spielstand kennt die Schwierigkeit noch nicht.** Was damals
  // geschafft wurde, war genau das heutige "Mittel" - also steht es als
  // "Mittel" da und nicht als nichts.
  const kept = Array.isArray(stored.best) ? stored.best : [];
  const best = LEVELS.map((_, level) => {
    const seen = kept[level];
    const had = done.includes(level) ? DEFAULT_GRADE : NEVER;
    return typeof seen === "number" && seen >= 0 ? heldGrade(seen) : had;
  });
  return {
    // Auch hier der Deckel: Ein Spielstand von früher - oder einer, in den
    // jemand von Hand eine große Zahl geschrieben hat - kommt beschnitten
    // heraus. Was durch diese Tür geht, ist immer spielbar.
    xp: Math.max(0, Math.min(XP_CAP, Math.floor(stored.xp))),
    upgrades,
    done,
    grade: heldGrade(stored.grade ?? DEFAULT_GRADE),
    best,
  };
}
