/**
 * The fields of research: what each costs, what it needs first and what it
 * opens - the data side of research.
 *
 * @module
 */
import type { BuildingKind, ResearchId, ShipKind } from "./types";

/** One field of research. */
export type ResearchDef = {
  readonly id: ResearchId;
  /** Research points it takes. */
  readonly cost: number;
  /** Fields that must be done first. */
  readonly needs: readonly ResearchId[];
  /** Buildings it opens. */
  readonly buildings: readonly BuildingKind[];
  /** Ships it opens. */
  readonly ships: readonly ShipKind[];
  /** The house tier it opens, or -1. */
  readonly tier: number;
  /** Extra output of producers it boosts, as a share (0.2 = +20 %). */
  readonly bonus: number;
  /** Which producers the bonus helps. */
  readonly boosts: "crop" | "craft" | null;
};

/** Every field, in the order the overview lists them. */
export const RESEARCH: readonly ResearchDef[] = [
  {
    id: "crops",
    cost: 120,
    needs: [],
    buildings: [],
    ships: [],
    tier: -1,
    bonus: 0.2,
    boosts: "crop",
  },
  {
    id: "glass",
    cost: 150,
    needs: [],
    buildings: ["sandPit", "glassworks"],
    ships: [],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "fortification",
    cost: 150,
    needs: [],
    buildings: ["battery"],
    ships: [],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "guilds",
    cost: 180,
    needs: [],
    buildings: [],
    ships: [],
    tier: -1,
    bonus: 0.15,
    boosts: "craft",
  },
  {
    id: "shipbuilding",
    cost: 200,
    needs: [],
    buildings: [],
    ships: ["galleon", "frigate"],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "engineering",
    cost: 250,
    needs: ["glass"],
    buildings: [],
    ships: [],
    tier: 4,
    bonus: 0,
    boosts: null,
  },
  {
    id: "optics",
    cost: 300,
    needs: ["engineering"],
    buildings: ["instrumentMaker"],
    ships: [],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "tobacco",
    cost: 200,
    needs: ["engineering"],
    buildings: ["tobaccoFarm", "tobacconist"],
    ships: [],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "society",
    cost: 400,
    needs: ["optics", "tobacco"],
    buildings: ["university"],
    ships: [],
    tier: 5,
    bonus: 0,
    boosts: null,
  },
  {
    id: "jewelry",
    cost: 350,
    needs: ["society"],
    buildings: ["pearlDiver", "goldsmith"],
    ships: [],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "wealth",
    cost: 500,
    needs: ["jewelry"],
    buildings: ["theatre"],
    ships: [],
    tier: 6,
    bonus: 0,
    boosts: null,
  },
  {
    id: "gunnery",
    cost: 220,
    needs: ["fortification"],
    buildings: ["foundry"],
    ships: ["lineShip"],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "tactics",
    cost: 240,
    needs: [],
    buildings: [],
    ships: [],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
  {
    id: "steam",
    cost: 450,
    needs: ["optics"],
    buildings: ["engineWorks"],
    ships: ["steamer", "cruiser"],
    tier: -1,
    bonus: 0,
    boosts: null,
  },
];

/** Looking a field up by id. */
export const RESEARCH_BY_ID: Readonly<Record<ResearchId, ResearchDef>> =
  Object.fromEntries(RESEARCH.map((def) => [def.id, def])) as Record<
    ResearchId,
    ResearchDef
  >;
