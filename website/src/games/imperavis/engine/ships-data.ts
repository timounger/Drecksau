/**
 * The kinds of ship: role, unlock, speed, hold, crew, hit points, armour,
 * cannons, troops, upkeep and what they cost to build.
 *
 * @module
 * @remarks
 * The ids stay those of older saves; what they are now shows in their role
 * and in the names of the interface: cog the schooner, hulk the clipper,
 * galleon the freighter, steamer the steamship (trade, unarmed), warship
 * the gunboat, frigate, lineShip the ship of the line and cruiser the
 * battlecruiser (war). The tier is the highest house tier the player must
 * have reached (0 farmers ... 6 wealthy citizens), the research is checked
 * as well. Every cost is paid from the shipyard's island when the order is
 * accepted.
 */
import type { ShipDef, ShipKind } from "./types";

/** Tiers, by name, for the unlocks below. */
const WORKERS = 1;
const CRAFTSMEN = 2;
const MERCHANTS = 3;
const ENGINEERS = 4;

/** Every kind of ship. */
export const SHIPS: readonly ShipDef[] = [
  {
    kind: "cog",
    role: "trade",
    tier: WORKERS,
    cannons: 0,
    speed: 3.2,
    turn: 1.6,
    slots: 3,
    slotSize: 30,
    crew: 12,
    hp: 300,
    upkeep: 10,
    cost: { gold: 600, planks: 20, cloth: 8, tools: 4 },
    buildSeconds: 30,
    armour: 0.1,
    guns: null,
    research: null,
    troops: 6,
  },
  {
    kind: "hulk",
    role: "trade",
    tier: CRAFTSMEN,
    cannons: 0,
    speed: 3.9,
    turn: 1.8,
    slots: 4,
    slotSize: 40,
    crew: 18,
    hp: 420,
    upkeep: 16,
    cost: { gold: 1400, planks: 30, cloth: 20, tools: 8 },
    buildSeconds: 50,
    armour: 0.1,
    guns: null,
    research: null,
    troops: 8,
  },
  {
    kind: "galleon",
    role: "trade",
    tier: MERCHANTS,
    cannons: 0,
    speed: 2.8,
    turn: 1,
    slots: 7,
    slotSize: 50,
    crew: 32,
    hp: 900,
    upkeep: 26,
    cost: { gold: 2400, planks: 44, cloth: 24, tools: 12, iron: 8 },
    buildSeconds: 75,
    armour: 0.2,
    guns: null,
    research: "shipbuilding",
    troops: 14,
  },
  {
    kind: "steamer",
    role: "trade",
    tier: ENGINEERS,
    cannons: 0,
    speed: 4.6,
    turn: 1.6,
    slots: 8,
    slotSize: 60,
    crew: 24,
    hp: 1100,
    upkeep: 40,
    cost: { gold: 4200, planks: 30, iron: 30, tools: 12, engines: 4 },
    buildSeconds: 90,
    armour: 0.25,
    guns: null,
    research: "steam",
    troops: 16,
  },
  {
    kind: "warship",
    role: "war",
    tier: WORKERS,
    cannons: 6,
    speed: 3.9,
    turn: 2.1,
    slots: 1,
    slotSize: 20,
    crew: 22,
    hp: 480,
    upkeep: 18,
    cost: { gold: 1200, planks: 24, cloth: 8, tools: 10 },
    buildSeconds: 50,
    armour: 0.15,
    guns: { damage: 18, range: 6, reload: 2.2 },
    research: null,
    troops: 4,
  },
  {
    kind: "frigate",
    role: "war",
    tier: CRAFTSMEN,
    cannons: 24,
    speed: 3.6,
    turn: 1.9,
    slots: 2,
    slotSize: 20,
    crew: 45,
    hp: 1100,
    upkeep: 40,
    cost: { gold: 3200, planks: 40, cloth: 20, tools: 16, iron: 10 },
    buildSeconds: 80,
    armour: 0.35,
    guns: { damage: 45, range: 8.5, reload: 2.6 },
    research: "shipbuilding",
    troops: 6,
  },
  {
    kind: "lineShip",
    role: "war",
    tier: MERCHANTS,
    cannons: 64,
    speed: 2.6,
    turn: 1,
    slots: 3,
    slotSize: 20,
    crew: 90,
    hp: 2200,
    upkeep: 60,
    cost: { gold: 5200, planks: 70, cloth: 30, tools: 20, cannons: 12 },
    buildSeconds: 110,
    armour: 0.4,
    guns: { damage: 72, range: 9, reload: 3.6 },
    research: "gunnery",
    troops: 10,
  },
  {
    kind: "cruiser",
    role: "war",
    tier: ENGINEERS,
    cannons: 8,
    speed: 4.3,
    turn: 1.6,
    slots: 2,
    slotSize: 20,
    crew: 60,
    hp: 2600,
    upkeep: 80,
    cost: { gold: 7800, iron: 50, tools: 20, cannons: 10, engines: 6 },
    buildSeconds: 130,
    armour: 0.5,
    guns: { damage: 96, range: 11, reload: 3 },
    research: "steam",
    troops: 8,
  },
  {
    kind: "trader",
    role: "other",
    tier: 0,
    cannons: 0,
    speed: 3,
    turn: 1.3,
    slots: 8,
    slotSize: 40,
    crew: 20,
    hp: 500,
    upkeep: 0,
    cost: { gold: 0 },
    buildSeconds: 0,
    armour: 0,
    guns: null,
    research: null,
    troops: 0,
  },
  {
    kind: "pirate",
    role: "other",
    tier: 0,
    cannons: 12,
    speed: 3.4,
    turn: 1.7,
    slots: 4,
    slotSize: 40,
    crew: 35,
    hp: 650,
    upkeep: 0,
    cost: { gold: 0 },
    buildSeconds: 0,
    armour: 0.2,
    guns: { damage: 26, range: 7, reload: 3 },
    research: null,
    troops: 0,
  },
];

/** Looking a ship kind up. */
export const SHIP: Readonly<Record<ShipKind, ShipDef>> = Object.fromEntries(
  SHIPS.map((def) => [def.kind, def]),
) as Record<ShipKind, ShipDef>;

/** The kinds a shipyard can build, trade ships first, each early to late. */
export const BUILDABLE_SHIPS: readonly ShipKind[] = SHIPS.filter(
  (def) => def.role !== "other",
).map((def) => def.kind);

/** The kinds that carry goods and no guns. */
export const TRADE_SHIPS: readonly ShipKind[] = SHIPS.filter(
  (def) => def.role === "trade",
).map((def) => def.kind);

/** The kinds that carry cannons and fight. */
export const WAR_SHIPS: readonly ShipKind[] = SHIPS.filter(
  (def) => def.guns !== null,
).map((def) => def.kind);

/** Ships a shipyard keeps on order at most, the one on the slip included. */
export const YARD_ORDERS = 5;

/** Share of what is not yet built that cancelling the ship on the slip gives back. */
export const RUNNING_REFUND = 0.5;
