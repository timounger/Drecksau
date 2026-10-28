/**
 * How each character and each of Jordi's animals moves, and which ability it
 * has - the data the engine runs on.
 *
 * @module
 * @remarks
 * Abilities are data: a character names its {@link AbilityKind} and the
 * engine looks the handler up (`abilities.ts`). Giving somebody a new trick
 * later means adding a kind and its handler, not touching the characters.
 */
import type { AnimalId, CharacterId, Terrain } from "./types";

/** What the ability key does for somebody. */
export type AbilityKind = "fly" | "transform" | "none";

/** How a figure gets about. */
export type MoveProfile = {
  /** Walking speed on snow, map px per second. */
  readonly speed: number;
  /** Terrain besides snow, path and ice it may enter. */
  readonly passes: readonly Terrain[];
  /** Up in the air: passes over everything. */
  readonly flies: boolean;
  /** How firmly it stands on ice, 0 (slides about) to 1 (no sliding). */
  readonly grip: number;
  /** Speed on ice, as a multiple of {@link speed}. */
  readonly iceSpeed: number;
  /** Speed in open water, as a multiple of {@link speed} - for swimmers. */
  readonly waterSpeed: number;
  /** The box round the feet that bumps into things, map px. */
  readonly footW: number;
  readonly footH: number;
  /** How tall the figure stands, map px - for the marker and the bubble. */
  readonly height: number;
};

/** One of the eight characters. */
export type CharacterDef = {
  readonly ability: AbilityKind;
  /** On foot. */
  readonly walk: MoveProfile;
  /** In the air, for those who fly. */
  readonly air: MoveProfile | null;
};

/** How high a flyer is drawn above its shadow, map px. */
export const FLY_HEIGHT = 18;

/** How high the bird flies, map px. */
export const BIRD_HEIGHT = 10;

/* eslint-disable @typescript-eslint/no-magic-numbers -- speeds, boxes and
   heights of the figures, tuned by eye to the art */
/** Nothing but the plain ground. */
const NO_EXTRA: readonly Terrain[] = [];

/** Every character by id. */
export const CAST: Readonly<Record<CharacterId, CharacterDef>> = {
  santa: { ability: "none", walk: walker(52, 14, 29), air: null },
  balbo: {
    ability: "none",
    // A polar bear is at home on ice.
    walk: { ...walker(50, 14, 28), grip: 0.6 },
    air: null,
  },
  jordi: { ability: "transform", walk: walker(60, 8, 24), air: null },
  trixi: { ability: "fly", walk: walker(62, 8, 22), air: flyer(88, 8, 22) },
  gilfi: { ability: "none", walk: walker(46, 8, 26), air: null },
  grantelbart: { ability: "none", walk: walker(46, 16, 31), air: null },
  gugor: { ability: "none", walk: walker(50, 9, 30), air: null },
  rudolf: {
    ability: "fly",
    walk: { ...walker(66, 16, 32), grip: 0.3 },
    air: flyer(100, 16, 32),
  },
};

/** Jordi's animals and what makes each one special. */
export const ANIMALS: Readonly<Record<AnimalId, MoveProfile>> = {
  // Fast, hops along.
  hase: { ...walker(96, 8, 13), grip: 0.25 },
  // Flies over everything.
  vogel: { ...flyer(80, 6, 10) },
  // Slow waddler on snow, a rocket on ice, and it swims.
  pinguin: {
    ...walker(36, 8, 13),
    grip: 0.5,
    iceSpeed: 3.4,
    waterSpeed: 1.4,
    passes: ["water"],
  },
  // Normal speed, sure-footed: no sliding on ice.
  fuchs: { ...walker(70, 10, 11), grip: 1, iceSpeed: 1 },
  // Tiny and quick, slips between the fence slats.
  maus: {
    ...walker(104, 4, 6),
    footH: 3,
    grip: 0.3,
    passes: ["fence"],
  },
  // Slow but strong: ploughs through snow drifts.
  baer: { ...walker(38, 18, 16), grip: 0.5, passes: ["drift"] },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * How a character moves right now: as itself, in the air, or as an animal.
 *
 * @param id - the character
 * @param flying - whether it is in the air
 * @param form - Jordi's animal, or null
 * @returns the profile in force
 */
export function profileOf(
  id: CharacterId,
  flying: boolean,
  form: AnimalId | null,
): MoveProfile {
  const def = CAST[id];
  let profile = def.walk;
  if (form !== null) {
    profile = ANIMALS[form];
  } else if (flying && def.air !== null) {
    profile = def.air;
  }
  return profile;
}

/** A person on foot: slips about on ice. */
function walker(speed: number, footW: number, height: number): MoveProfile {
  return {
    speed,
    passes: NO_EXTRA,
    flies: false,
    grip: 0.12,
    iceSpeed: 1.1,
    waterSpeed: 0,
    footW,
    footH: 5,
    height,
  };
}

/** A flyer in the air: over everything, quicker, steady. */
function flyer(speed: number, footW: number, height: number): MoveProfile {
  return {
    speed,
    passes: NO_EXTRA,
    flies: true,
    grip: 1,
    iceSpeed: 1,
    waterSpeed: 1,
    footW,
    footH: 5,
    height,
  };
}
