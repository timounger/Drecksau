/**
 * What the player can carry, and what it does.
 *
 * @module
 * @remarks
 * Seven of them, in the order they are cycled through, and each one is a row in
 * a table rather than a branch in the code: how fast it goes off, how much it
 * takes off, how far it reaches, and which of four ways it leaves the hand -
 * a swing, a bullet, a jet of fire or something that goes off where it lands.
 * Adding an eighth should be a row, not a rewrite.
 */

/** Everything the player can hold. */
export type WeaponKind =
  | "fist"
  | "knuckles"
  | "baton"
  | "knife"
  | "pistol"
  | "mg"
  | "flamer"
  | "rpg"
  | "grenade"
  | "remote";

/**
 * How a weapon reaches what it is aimed at.
 *
 * @remarks
 * `planted` is the odd one: it does not reach anything when it leaves the
 * hand. It is put down where the player stands and waits there until the
 * button is pressed - the aim has nothing to do with it.
 */
export type WeaponWay = "swing" | "shot" | "flame" | "blast" | "planted";

/** One weapon, as numbers. */
export type Weapon = {
  readonly kind: WeaponKind;
  /** What it is called on screen. */
  readonly name: string;
  readonly way: WeaponWay;
  /** Seconds between two goes. */
  readonly reload: number;
  /** What one hit takes off. */
  readonly damage: number;
  /** How far it reaches, in pixels. */
  readonly range: number;
  /** How fast what it fires travels, in pixels a second. Melee: unused. */
  readonly speed: number;
  /** How far off straight a shot can go, in radians. */
  readonly spread: number;
  /**
   * How many goes one pickup gives, or below zero for a weapon that never runs
   * out once it has been found - a knife does not have ammunition.
   */
  readonly rounds: number;
};

/** The order the mouse wheel walks through them. */
export const WEAPON_ORDER: readonly WeaponKind[] = [
  "fist",
  "knuckles",
  "baton",
  "knife",
  "pistol",
  "mg",
  "flamer",
  "rpg",
  "grenade",
  "remote",
];

/**
 * The weapons that are in the game at present.
 *
 * @remarks
 * **Taken out, not deleted.** The knuckleduster and the baton are not in this
 * city any more - they do not lie about, the shops do not sell them, nobody
 * carries one and the cheat does not hand one out. Everything else about them
 * is exactly where it was: the row in {@link WEAPONS}, the price, the slot in
 * {@link WEAPON_ORDER}, the picture of the thing in the hand. Taking a name
 * out of this list is all it takes to have it back.
 *
 * The slot is deliberately left in place. The belt is an array indexed by
 * {@link WEAPON_ORDER}, and every stand ever saved is indexed the same way:
 * shortening that order would quietly hand everybody somebody else's
 * ammunition.
 */
export const SHELVED: readonly WeaponKind[] = ["knuckles", "baton"];

/**
 * Whether a weapon is one this city has at all.
 *
 * @param kind - the weapon
 * @returns false for the ones on the shelf - see {@link SHELVED}
 */
export function inTheGame(kind: WeaponKind): boolean {
  return !SHELVED.includes(kind);
}

/** How much of a blast something at the very centre of it takes. */
export const BLAST_RADIUS = 90;

/** How long the fuse on a thrown grenade is, in seconds. */
export const GRENADE_FUSE = 1.6;

/** Every weapon, by what it is. */
export const WEAPONS: Readonly<Record<WeaponKind, Weapon>> = {
  fist: {
    kind: "fist",
    name: "Faust",
    way: "swing",
    reload: 0.42,
    damage: 8,
    range: 24,
    speed: 0,
    spread: 0,
    rounds: -1,
  },
  knuckles: {
    kind: "knuckles",
    name: "Schlagring",
    way: "swing",
    reload: 0.36,
    damage: 16,
    range: 24,
    speed: 0,
    spread: 0,
    rounds: -1,
  },
  baton: {
    kind: "baton",
    name: "Schlagstock",
    way: "swing",
    reload: 0.44,
    damage: 22,
    range: 34,
    speed: 0,
    spread: 0,
    rounds: -1,
  },
  knife: {
    kind: "knife",
    name: "Messer",
    way: "swing",
    reload: 0.38,
    damage: 26,
    range: 28,
    speed: 0,
    spread: 0,
    rounds: -1,
  },
  pistol: {
    kind: "pistol",
    name: "Pistole",
    way: "shot",
    reload: 0.32,
    damage: 12,
    range: 520,
    speed: 760,
    spread: 0.02,
    rounds: 24,
  },
  mg: {
    kind: "mg",
    name: "Maschinengewehr",
    way: "shot",
    reload: 0.09,
    damage: 9,
    range: 480,
    speed: 820,
    spread: 0.07,
    rounds: 90,
  },
  flamer: {
    kind: "flamer",
    name: "Flammenwerfer",
    way: "flame",
    reload: 0.04,
    damage: 3,
    range: 120,
    speed: 260,
    spread: 0.3,
    rounds: 200,
  },
  rpg: {
    kind: "rpg",
    name: "Panzerfaust",
    way: "blast",
    reload: 1.4,
    damage: 90,
    range: 900,
    speed: 420,
    spread: 0,
    rounds: 3,
  },
  grenade: {
    kind: "grenade",
    name: "Granate",
    way: "blast",
    reload: 0.9,
    damage: 80,
    range: 260,
    speed: 240,
    spread: 0,
    rounds: 5,
  },
  remote: {
    kind: "remote",
    name: "Fernzünder",
    way: "planted",
    // The wait between two presses of the button, not between two charges:
    // putting them down is the right button and has its own pace.
    reload: 0.5,
    // What a single charge does is CHARGE_FORCE in ./types - this row is only
    // what the belt needs to know. Nothing is fired, so nothing reaches.
    damage: 0,
    range: 0,
    speed: 0,
    spread: 0,
    rounds: 10,
  },
};

/**
 * What the gun shop charges, and what the vest costs.
 *
 * @remarks
 * Set against what the city pays: a job is worth two to four hundred, so a
 * pistol is an afternoon's work and the rocket launcher is a week of them. The
 * fist is free because nobody sells one, and the shop shows it as owned.
 */
export const PRICES: Readonly<Record<WeaponKind | "armour", number>> = {
  fist: 0,
  knuckles: 150,
  baton: 220,
  knife: 260,
  pistol: 600,
  mg: 1500,
  flamer: 2200,
  rpg: 4200,
  grenade: 900,
  remote: 2600,
  armour: 400,
};

/**
 * What it costs to fill a weapon back up, as a share of buying it.
 *
 * @remarks
 * A quarter. Somebody who has the rocket launcher should be able to keep it
 * fed without buying it again, and somebody who has not should still want to.
 */
const REFILL_SHARE = 0.25;

/**
 * What a shop charges to fill one weapon up again.
 *
 * @param kind - the weapon in question
 * @returns the price of one more pickup's worth of rounds
 */
export function refillPrice(kind: WeaponKind): number {
  return Math.round(PRICES[kind] * REFILL_SHARE);
}

/**
 * Which weapons a shop keeps on the wall.
 *
 * @returns everything that can be bought, in the order of the belt
 */
export function forSale(): readonly WeaponKind[] {
  return WEAPON_ORDER.filter((kind) => PRICES[kind] > 0 && inTheGame(kind));
}

/**
 * Where a weapon sits in the belt.
 *
 * @param kind - the weapon
 * @returns its place in {@link WEAPON_ORDER}
 */
export function slotOf(kind: WeaponKind): number {
  return WEAPON_ORDER.indexOf(kind);
}

/**
 * Whether a weapon can be used at all.
 *
 * @param ammo - the belt: rounds left per slot
 * @param kind - the weapon in question
 * @returns true when it has been found and is not empty
 * @remarks
 * One number per slot says both things at once. Zero is "not in the belt or
 * shot dry", a count is what is left, and below zero is a weapon that was
 * found and never runs out. Only the fist starts below zero; the knife gets
 * there by being picked up.
 */
export function carried(ammo: readonly number[], kind: WeaponKind): boolean {
  return (ammo[slotOf(kind)] ?? 0) !== 0;
}

/**
 * The belt after picking a weapon up.
 *
 * @param ammo - the belt as it was
 * @param kind - what was found
 * @returns the belt with that weapon in it
 */
export function tookUp(
  ammo: readonly number[],
  kind: WeaponKind,
): readonly number[] {
  const slot = slotOf(kind);
  const gain = WEAPONS[kind].rounds;
  const had = ammo[slot] ?? 0;
  const now = gain < 0 ? -1 : had < 0 ? had : had + gain;
  return ammo.map((left, at) => (at === slot ? now : left));
}

/**
 * The belt after a shot was fired.
 *
 * @param ammo - the belt as it was
 * @param kind - what was fired
 * @returns the belt one round lighter, if that weapon counts rounds
 */
export function firedOne(
  ammo: readonly number[],
  kind: WeaponKind,
): readonly number[] {
  const slot = slotOf(kind);
  return ammo.map((left, at) => (at === slot && left > 0 ? left - 1 : left));
}

/**
 * The next weapon the wheel should land on.
 *
 * @param ammo - rounds left per slot
 * @param from - what is in the hand now
 * @param step - which way the wheel turned, one notch at a time
 * @returns the next weapon that is actually carried
 * @remarks
 * Empty slots are skipped rather than shown greyed out: a wheel that stops on
 * something unusable makes the player turn it twice.
 */
export function nextWeapon(
  ammo: readonly number[],
  from: WeaponKind,
  step: number,
): WeaponKind {
  const count = WEAPON_ORDER.length;
  const way = step > 0 ? 1 : -1;
  let at = slotOf(from);
  for (let tried = 0; tried < count; tried += 1) {
    at = (at + way + count) % count;
    const kind = WEAPON_ORDER[at] ?? "fist";
    if (carried(ammo, kind)) {
      return kind;
    }
  }
  return "fist";
}

/** An empty belt: the fist, and nothing else found yet. */
export function emptyBelt(): readonly number[] {
  return WEAPON_ORDER.map((kind) => (kind === "fist" ? -1 : 0));
}

/** How many pickups' worth of everything the cheat hands out. */
const CHEAT_STOCK = 3;

/** A belt with everything in it, for the cheat. */
export function fullBelt(): readonly number[] {
  return WEAPON_ORDER.map((kind) => {
    let rounds: number;
    if (!inTheGame(kind)) {
      rounds = 0;
    } else if (WEAPONS[kind].rounds < 0) {
      rounds = -1;
    } else {
      rounds = WEAPONS[kind].rounds * CHEAT_STOCK;
    }
    return rounds;
  });
}
