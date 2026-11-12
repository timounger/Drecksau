/**
 * The research tree: what can be researched, what it needs and what it does.
 *
 * @module
 * @remarks
 * The effects themselves are read where they matter (see `modifiers.ts`);
 * this file only says what exists and in which order.
 */
import type { Cost, DefenseKind } from "./types";

/** The branches of the tree, as columns of the research screen. */
export type ResearchBranch =
  "weapons" | "firepower" | "armor" | "economy" | "sight";

/** One research project. */
export type ResearchDef = {
  readonly id: string;
  readonly branch: ResearchBranch;
  readonly cost: Cost;
  /** Research points needed (one lab at level one makes one per second). */
  readonly points: number;
  /** Projects that must be done first. */
  readonly needs: readonly string[];
  /** The defence it unlocks, if any. */
  readonly unlocks?: DefenseKind;
};

/** The branches in column order. */
export const BRANCHES: readonly ResearchBranch[] = [
  "weapons",
  "firepower",
  "armor",
  "economy",
  "sight",
];

/** Every project, in the order they are shown within their branch. */
export const RESEARCH: readonly ResearchDef[] = [
  {
    id: "ballistics",
    branch: "weapons",
    cost: { iron: 80, stone: 40 },
    points: 35,
    needs: [],
    unlocks: "cannon",
  },
  {
    id: "explosives",
    branch: "weapons",
    cost: { iron: 90, fuel: 20 },
    points: 45,
    needs: ["ballistics"],
    unlocks: "minefield",
  },
  {
    id: "optics",
    branch: "weapons",
    cost: { iron: 120, wood: 60 },
    points: 50,
    needs: [],
    unlocks: "sniper",
  },
  {
    id: "thermo",
    branch: "weapons",
    cost: { iron: 80, fuel: 40 },
    points: 50,
    needs: [],
    unlocks: "flamethrower",
  },
  {
    id: "highVoltage",
    branch: "weapons",
    cost: { iron: 140, energy: 120 },
    points: 60,
    needs: ["ballistics"],
    unlocks: "tesla",
  },
  {
    id: "ammo1",
    branch: "firepower",
    cost: { iron: 150 },
    points: 45,
    needs: [],
  },
  {
    id: "ammo2",
    branch: "firepower",
    cost: { iron: 300, fuel: 60 },
    points: 80,
    needs: ["ammo1"],
  },
  {
    id: "rapid",
    branch: "firepower",
    cost: { iron: 200, energy: 100 },
    points: 70,
    needs: ["ammo1"],
  },
  {
    id: "frostRounds",
    branch: "firepower",
    cost: { iron: 200, fuel: 80, energy: 150 },
    points: 90,
    needs: ["ammo2"],
  },
  {
    id: "armor1",
    branch: "armor",
    cost: { stone: 150, iron: 80 },
    points: 45,
    needs: [],
  },
  {
    id: "armor2",
    branch: "armor",
    cost: { stone: 300, iron: 200 },
    points: 80,
    needs: ["armor1"],
  },
  {
    id: "fortress",
    branch: "armor",
    cost: { stone: 500, iron: 300 },
    points: 100,
    needs: ["armor2"],
  },
  {
    id: "production",
    branch: "economy",
    cost: { wood: 120, iron: 80 },
    points: 45,
    needs: [],
  },
  {
    id: "insulation",
    branch: "economy",
    cost: { wood: 200, stone: 150 },
    points: 60,
    needs: ["production"],
  },
  {
    id: "machinery",
    branch: "economy",
    cost: { wood: 150, iron: 100 },
    points: 50,
    needs: [],
  },
  {
    id: "fieldRepair",
    branch: "economy",
    cost: { stone: 120, iron: 60 },
    points: 45,
    needs: ["machinery"],
  },
  {
    id: "outposts",
    branch: "economy",
    cost: { wood: 200, stone: 200 },
    points: 60,
    needs: ["machinery"],
  },
  {
    id: "floodlights",
    branch: "sight",
    cost: { energy: 100, iron: 80 },
    points: 40,
    needs: [],
  },
  {
    id: "thermal",
    branch: "sight",
    cost: { energy: 200, iron: 160 },
    points: 70,
    needs: ["floodlights"],
  },
];

/**
 * Looks a project up.
 *
 * @param id - its id
 * @returns the project, or undefined for an unknown id
 */
export function researchById(id: string): ResearchDef | undefined {
  return RESEARCH.find((entry) => entry.id === id);
}
