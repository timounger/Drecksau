/**
 * The goods of IMPERAVIS (the ResourceManager's data): what each is worth,
 * weighs and how much room it takes.
 *
 * @module
 */
import type { GoodDef, GoodId } from "./types";

/** Every good, in the order lists show them. */
export const GOODS: readonly GoodDef[] = [
  {
    id: "wood",
    category: "raw",
    value: 4,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "planks",
    category: "material",
    value: 9,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "stone",
    category: "material",
    value: 8,
    weight: 4,
    volume: 1,
    storable: true,
  },
  {
    id: "clay",
    category: "raw",
    value: 4,
    weight: 3,
    volume: 1,
    storable: true,
  },
  {
    id: "bricks",
    category: "material",
    value: 11,
    weight: 3,
    volume: 1,
    storable: true,
  },
  {
    id: "ore",
    category: "raw",
    value: 10,
    weight: 4,
    volume: 1,
    storable: true,
  },
  {
    id: "coal",
    category: "raw",
    value: 8,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "iron",
    category: "intermediate",
    value: 22,
    weight: 4,
    volume: 1,
    storable: true,
  },
  {
    id: "tools",
    category: "material",
    value: 36,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "fish",
    category: "food",
    value: 6,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "grain",
    category: "raw",
    value: 5,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "flour",
    category: "intermediate",
    value: 9,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "bread",
    category: "food",
    value: 18,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "wool",
    category: "raw",
    value: 7,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "cloth",
    category: "food",
    value: 16,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "clothing",
    category: "food",
    value: 32,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "malt",
    category: "intermediate",
    value: 9,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "beer",
    category: "food",
    value: 24,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "grapes",
    category: "raw",
    value: 9,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "wine",
    category: "luxury",
    value: 44,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "quartz",
    category: "raw",
    value: 7,
    weight: 3,
    volume: 1,
    storable: true,
  },
  {
    id: "glass",
    category: "luxury",
    value: 40,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "instruments",
    category: "luxury",
    value: 90,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "tobacco",
    category: "raw",
    value: 12,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "cigars",
    category: "luxury",
    value: 60,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "pearls",
    category: "raw",
    value: 30,
    weight: 1,
    volume: 1,
    storable: true,
  },
  {
    id: "jewelry",
    category: "luxury",
    value: 140,
    weight: 1,
    volume: 1,
    storable: true,
  },
  // Arms: muskets and bayonets for the troops, cannons for warships and the
  // artillery, steam engines for the late ships.
  {
    id: "weapons",
    category: "material",
    value: 48,
    weight: 2,
    volume: 1,
    storable: true,
  },
  {
    id: "cannons",
    category: "material",
    value: 110,
    weight: 6,
    volume: 1,
    storable: true,
  },
  {
    id: "engines",
    category: "material",
    value: 260,
    weight: 8,
    volume: 1,
    storable: true,
  },
];

/** The ids alone, in list order. */
export const GOOD_IDS: readonly GoodId[] = GOODS.map((good) => good.id);

/** Looking a good up by id. */
export const GOOD: Readonly<Record<GoodId, GoodDef>> = Object.fromEntries(
  GOODS.map((good) => [good.id, good]),
) as Record<GoodId, GoodDef>;

/**
 * A record with the same number for every good.
 *
 * @param value - the number
 * @returns the record
 */
export function perGood(value: number): Record<GoodId, number> {
  return Object.fromEntries(GOOD_IDS.map((id) => [id, value])) as Record<
    GoodId,
    number
  >;
}

/**
 * Whether a value is a good id.
 *
 * @param value - anything
 * @returns true for a known good
 */
export function isGoodId(value: unknown): value is GoodId {
  return typeof value === "string" && GOOD_IDS.includes(value as GoodId);
}
