/**
 * The seven population tiers: what each wants, pays and needs to rise - the
 * data side of the PopulationManager.
 *
 * @module
 * @remarks
 * The first four tiers are open from the start. Engineers, the upper class
 * and the wealthy citizens each wait for a field of research and want the
 * goods of the chains that research opens: glass, instruments, tobacco goods
 * and jewellery.
 */
import type { TierDef } from "./types";

/** Farmers, workers, craftsmen, merchants, engineers, upper class, wealthy citizens. */
export const TIERS: readonly TierDef[] = [
  {
    index: 0,
    capacity: 8,
    tax: 0.9,
    goods: [{ good: "fish", rate: 0.05 }],
    services: ["market", "chapel"],
    upgradeCost: {},
    research: null,
  },
  {
    index: 1,
    capacity: 12,
    tax: 1.5,
    goods: [
      { good: "fish", rate: 0.05 },
      { good: "cloth", rate: 0.035 },
    ],
    services: ["market", "chapel", "tavern"],
    upgradeCost: { planks: 3 },
    research: null,
  },
  {
    index: 2,
    capacity: 16,
    tax: 2.4,
    goods: [
      { good: "bread", rate: 0.045 },
      { good: "clothing", rate: 0.03 },
      { good: "beer", rate: 0.03 },
    ],
    services: ["market", "chapel", "tavern", "school"],
    upgradeCost: { planks: 2, bricks: 4 },
    research: null,
  },
  {
    index: 3,
    capacity: 22,
    tax: 3.6,
    goods: [
      { good: "bread", rate: 0.045 },
      { good: "clothing", rate: 0.03 },
      { good: "beer", rate: 0.03 },
      { good: "wine", rate: 0.025 },
    ],
    services: ["market", "chapel", "tavern", "school", "bathhouse"],
    upgradeCost: { bricks: 6, tools: 2 },
    research: null,
  },
  {
    index: 4,
    capacity: 28,
    tax: 4.8,
    goods: [
      { good: "bread", rate: 0.045 },
      { good: "clothing", rate: 0.03 },
      { good: "beer", rate: 0.03 },
      { good: "wine", rate: 0.025 },
      { good: "glass", rate: 0.02 },
    ],
    services: ["market", "chapel", "tavern", "school", "bathhouse", "doctor"],
    upgradeCost: { bricks: 8, stone: 4, tools: 4 },
    research: "engineering",
  },
  {
    index: 5,
    capacity: 34,
    tax: 6.2,
    goods: [
      { good: "bread", rate: 0.05 },
      { good: "clothing", rate: 0.035 },
      { good: "wine", rate: 0.03 },
      { good: "instruments", rate: 0.015 },
      { good: "cigars", rate: 0.02 },
    ],
    services: [
      "market",
      "chapel",
      "tavern",
      "school",
      "bathhouse",
      "doctor",
      "university",
    ],
    upgradeCost: { bricks: 10, stone: 8, tools: 6, glass: 4 },
    research: "society",
  },
  {
    index: 6,
    capacity: 40,
    tax: 8,
    goods: [
      { good: "bread", rate: 0.05 },
      { good: "clothing", rate: 0.04 },
      { good: "wine", rate: 0.035 },
      { good: "instruments", rate: 0.02 },
      { good: "cigars", rate: 0.025 },
      { good: "jewelry", rate: 0.015 },
    ],
    services: [
      "market",
      "chapel",
      "tavern",
      "school",
      "bathhouse",
      "doctor",
      "university",
      "theatre",
    ],
    upgradeCost: { bricks: 12, stone: 12, tools: 8, glass: 6 },
    research: "wealth",
  },
];

/** The highest tier there is. */
export const TOP_TIER: number = TIERS.length - 1;

/**
 * How many needs a tier has (goods first, then services).
 *
 * @param tier - the tier index
 * @returns the count
 */
export function needCount(tier: number): number {
  return TIERS[tier].goods.length + TIERS[tier].services.length;
}
