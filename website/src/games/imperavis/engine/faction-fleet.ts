/**
 * The ships of the foreign peoples: merchants that carry contract goods
 * and trade with the AI rivals' kontors, guards that patrol home, fight
 * pirates near it and sail out to help friends, repairs in the home
 * harbour, new ships for lost ones, and the guns of every faction's towers.
 *
 * @module
 * @remarks
 * Faction ships are ordinary ships with the faction's id as owner: they
 * sail with the same paths, dock at kontors like the free trader (where
 * the faction trades) and fight with the same combat rules. A ship sunk is
 * gone with its cargo; a people builds a new one from its gold after a
 * while.
 */
import { hitShip, nearestEnemyShip, seaNear } from "./combat";
import { relationOf } from "./diplomacy";
import { earn, spend } from "./economy";
import { factionLayout, siteCentre } from "./faction-layout";
import { NATION_SHIP_GOLD } from "./factions-data";
import {
  askPrice,
  bidPrice,
  cultureOf,
  factionHostile,
  factionOpinion,
  feel,
  forSale,
  homeOf,
  inHarbour,
  note,
  offerOf,
  settleDelivery,
  wantedUnits,
  FACTION_CAPACITY,
  SUPPORT_SECONDS,
} from "./factions";
import {
  kontorOf,
  berthOf,
  createShip,
  roomFor,
  sailTo,
  searchAllowed,
} from "./ships";
import { SHIP } from "./ships-data";
import { inBounds, isSea, TILE_CENTER } from "./terrain";
import { TICK } from "./time";
import {
  Terrain,
  type Faction,
  type FactionShip,
  type FactionShipRole,
  type Game,
  type GoodId,
  type Ship,
  type ShipKind,
} from "./types";

/** Seconds between two looks of a faction at its ships. */
const FLEET_EVERY = 1;

/** Steps between two such looks. */
const FLEET_STEPS = Math.round(FLEET_EVERY / TICK);

/** Seconds between two volleys of a faction's towers. */
const TOWER_EVERY = 3;

/** Steps between two volleys. */
const TOWER_STEPS = Math.round(TOWER_EVERY / TICK);

/** The guns of a people's tower and of a pirate fort's cannon tower. */
const NATION_TOWER = { damage: 30, range: 9 };
const PIRATE_TOWER = { damage: 42, range: 10 };

/** Hits vary between these shares of a tower's damage. */
const TOWER_LOW = 0.8;
const TOWER_HIGH = 1.2;

/** A guard goes for enemies this close to home or to its merchants, tiles. */
const DEFEND_RANGE = 22;

/** A guard breaks off a chase this far from home, tiles. */
const LEASH = 30;

/** A guard's patrol reaches this far out from the harbour, tiles. */
const PATROL_OUT = 12;

/** Guards on a hunt keep this far off the pirates' harbour, tiles. */
const HUNT_OFF = 15;

/** A ship counts as at home this close to the berth, tiles. */
const HOME_REACH = 6;

/** What a guard's target marks: home duty and a hunt (players count up from 0). */
const HOME_DUTY = -1;
const HUNT_DUTY = -2;

/** A ship mends this share of its hit points per second at home... */
const REPAIR_RATE = 0.03;

/** ...for this much of its owner's gold per hit point. */
const REPAIR_GOLD = 0.3;

/** Seconds after a hit before mending starts. */
const REPAIR_CALM = 6;

/** A people builds a new ship this long after it lost one, seconds. */
export const REBUILD_SECONDS = 300;

/** Seconds between two deals of a people with the rivals' kontors. */
const DEAL_EVERY = 240;

/** Units of a good in one such deal, at most. */
const DEAL_UNITS = 20;

/** Goods a merchant takes along to sell in one deal. */
const DEAL_GOODS = 2;

/** A rival keeps this much gold back when buying from a people. */
const RIVAL_GOLD_RESERVE = 1500;

/** A rival sells only what lies above this in its stores. */
const RIVAL_SURPLUS = 60;

/** A rival buys an exotic good while it holds less than this. */
const RIVAL_WANTS_BELOW = 30;

/** Rings searched for free water when a ship is launched. */
const LAUNCH_RINGS = 6;

/** A new ship keeps at least this far from other ships, tiles. */
const LAUNCH_CLEARANCE = 1.6;

/** Seconds a merchant may take for one voyage before it gives up. */
const VOYAGE_SECONDS = 600;

/** An allied people helps when a friend's ship was hit this recently, seconds. */
const HELP_RECENT = 10;

/** ...by an enemy this close to it, tiles. */
const HELP_REACH = 12;

/**
 * Puts a faction's first ships on the water at its harbour.
 *
 * @param game - the game
 * @param faction - the faction
 */
export function spawnFleet(game: Game, faction: Faction): void {
  const def = cultureOf(faction);
  for (let k = 0; k < def.merchants; k += 1) {
    launch(game, faction, def.merchantKind, "merchant");
  }
  for (let k = 0; k < def.guards; k += 1) {
    launch(
      game,
      faction,
      def.guardKind,
      faction.kind === "pirates" ? "raider" : "guard",
    );
  }
}

/**
 * Launches a ship for a faction at its harbour.
 *
 * @param game - the game
 * @param faction - the faction
 * @param kind - the ship
 * @param role - what it is for
 * @returns the ship, or null when there was no water free
 */
export function launch(
  game: Game,
  faction: Faction,
  kind: ShipKind,
  role: FactionShipRole,
): Ship | null {
  const spot = freeWater(game, homeOf(game, faction).berth);
  const n = game.world.n;
  let ship: Ship | null = null;
  if (spot >= 0) {
    ship = createShip(game, faction.id, kind, spot % n, Math.floor(spot / n));
    faction.fleet.push({
      ship: ship.id,
      role,
      state: "idle",
      target: -1,
      x: 0,
      y: 0,
      since: game.time,
    });
  }
  return ship;
}

/**
 * One step of the factions' ships: every second each faction looks at its
 * fleet (one after another), every few seconds the towers fire.
 *
 * @param game - the game
 */
export function stepFactionFleets(game: Game): void {
  game.factions.forEach((faction, index) => {
    if (game.tick % FLEET_STEPS === index % FLEET_STEPS) {
      prune(game, faction);
      repair(game, faction);
      if (faction.kind === "nation") {
        replace(game, faction);
        merchants(game, faction);
        guards(game, faction);
        helpAllies(game, faction);
        dealWithRivals(game, faction);
      }
    }
    if (game.tick % TOWER_STEPS === index % TOWER_STEPS) {
      towers(game, faction);
    }
  });
}

/**
 * The ship of a faction's fleet entry, if it still floats.
 *
 * @param game - the game
 * @param entry - the fleet entry
 * @returns the ship, or null
 */
export function shipOf(game: Game, entry: FactionShip): Ship | null {
  return game.ships.find((ship) => ship.id === entry.ship) ?? null;
}

/**
 * Sends a ship home to its harbour.
 *
 * @param game - the game
 * @param faction - its faction
 * @param ship - the ship
 * @returns true when a way was found
 */
export function sailHome(game: Game, faction: Faction, ship: Ship): boolean {
  ship.order = { type: "idle" };
  // Without a search allowed this step it tries again at the next think.
  return (
    !searchAllowed(game, ship) ||
    sailTo(game, ship, homeOf(game, faction).berth)
  );
}

/**
 * Whether a ship lies at its faction's home.
 *
 * @param game - the game
 * @param faction - its faction
 * @param ship - the ship
 * @param reach - how far from the berth still counts, tiles
 * @returns true within reach of the berth
 */
export function atHome(
  game: Game,
  faction: Faction,
  ship: Ship,
  reach = HOME_REACH,
): boolean {
  const berth = homeOf(game, faction).berth;
  const n = game.world.n;
  return (
    Math.hypot(
      (berth % n) + TILE_CENTER - ship.x,
      Math.floor(berth / n) + TILE_CENTER - ship.y,
    ) <= reach
  );
}

/**
 * Unloads all a ship carries into its faction's warehouse.
 *
 * @param faction - the faction
 * @param ship - the ship
 * @returns units put in store
 */
export function unload(faction: Faction, ship: Ship): number {
  let units = 0;
  for (const [good, amount] of Object.entries(ship.cargo) as [
    GoodId,
    number,
  ][]) {
    const put = Math.max(
      0,
      Math.min(amount, FACTION_CAPACITY - faction.stock[good]),
    );
    faction.stock[good] += put;
    units += put;
  }
  ship.cargo = {};
  return units;
}

/** Fleet entries of sunk ships drop out, and the faction notes the loss. */
function prune(game: Game, faction: Faction): void {
  const lost = faction.fleet.filter((entry) => shipOf(game, entry) === null);
  if (lost.length > 0) {
    faction.fleet = faction.fleet.filter((entry) => !lost.includes(entry));
    faction.nextShip = Math.max(faction.nextShip, game.time + REBUILD_SECONDS);
    for (const entry of lost) {
      note(game, faction, "lostShip", -1, null, entry.ship);
    }
  }
}

/** Ships at home mend, at the faction's cost. */
function repair(game: Game, faction: Faction): void {
  for (const entry of faction.fleet) {
    const ship = shipOf(game, entry);
    const max = ship === null ? 0 : SHIP[ship.kind].hp;
    if (
      ship !== null &&
      ship.hp < max &&
      game.time - ship.hitAt > REPAIR_CALM &&
      faction.gold > 0 &&
      atHome(game, faction, ship)
    ) {
      const amount = Math.min(max - ship.hp, max * REPAIR_RATE * FLEET_EVERY);
      ship.hp += amount;
      faction.gold -= amount * REPAIR_GOLD;
    }
  }
}

/** A people replaces lost ships from its gold after a while. */
function replace(game: Game, faction: Faction): void {
  const def = cultureOf(faction);
  const merchants = faction.fleet.filter((s) => s.role === "merchant").length;
  const guards = faction.fleet.filter((s) => s.role === "guard").length;
  const missing = merchants < def.merchants || guards < def.guards;
  if (
    missing &&
    game.time >= faction.nextShip &&
    faction.gold >= NATION_SHIP_GOLD
  ) {
    const role: FactionShipRole = guards < def.guards ? "guard" : "merchant";
    const ship = launch(
      game,
      faction,
      role === "guard" ? def.guardKind : def.merchantKind,
      role,
    );
    if (ship !== null) {
      faction.gold -= NATION_SHIP_GOLD;
      faction.nextShip = game.time + REBUILD_SECONDS;
      note(game, faction, "newShip", -1, null, ship.id);
    }
  }
}

/**
 * Merchants on their voyages: out to a kontor (a contract or a deal with
 * a rival), the business there, and home again to unload.
 */
function merchants(game: Game, faction: Faction): void {
  for (const entry of faction.fleet) {
    const ship = shipOf(game, entry);
    if (entry.role === "merchant" && ship !== null) {
      const kontor = entry.state === "trading" ? kontorOf(game, entry.x) : null;
      if (entry.state === "trading") {
        if (kontor === null || game.time - entry.since > VOYAGE_SECONDS) {
          goHome(game, faction, entry, ship);
        } else if (ship.docked === kontor.id) {
          business(game, faction, entry, ship, kontor.island);
          goHome(game, faction, entry, ship);
        } else if (
          ship.path.length === 0 &&
          !sailTo(game, ship, berthOf(game, kontor))
        ) {
          goHome(game, faction, entry, ship);
        }
      } else if (entry.state === "returning") {
        if (inHarbour(game, faction, ship) || atHome(game, faction, ship)) {
          unload(faction, ship);
          entry.state = "idle";
          entry.since = game.time;
        } else if (ship.path.length === 0 && !sailHome(game, faction, ship)) {
          // Stranded: it gives up its load where it is.
          ship.cargo = {};
          entry.state = "idle";
        }
      } else if (!atHome(game, faction, ship) && ship.path.length === 0) {
        sailHome(game, faction, ship);
      }
    }
  }
}

/** A merchant turns home. */
function goHome(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
): void {
  entry.state = "returning";
  entry.since = game.time;
  ship.docked = -1;
  sailHome(game, faction, ship);
}

/** What a merchant does at a kontor: a contract's delivery or a deal. */
function business(
  game: Game,
  faction: Faction,
  entry: FactionShip,
  ship: Ship,
  island: number,
): void {
  const contract = faction.contracts.find((c) => c.id === entry.target);
  if (contract !== undefined) {
    settleDelivery(game, faction, contract, island, ship);
  } else if (entry.target === 0) {
    rivalDeal(game, faction, ship, island);
  }
}

/**
 * Every few minutes a people's idle merchant sails to a rival's kontor
 * with goods to sell and buys its surplus there; the rival opens trade
 * with the people as soon as it may.
 */
function dealWithRivals(game: Game, faction: Faction): void {
  if (game.time >= faction.nextDeal) {
    faction.nextDeal = game.time + DEAL_EVERY;
    const merchant = faction.fleet.find(
      (s) => s.role === "merchant" && s.state === "idle",
    );
    const ship = merchant === undefined ? null : shipOf(game, merchant);
    const rivals = game.players.filter(
      (p) =>
        p.ai !== null &&
        p.alive &&
        game.islands.some(
          (i) => i.owner === p.id && kontorOf(game, i.id) !== null,
        ) &&
        relationOf(game, faction.id, p.id)?.war === false &&
        factionOpinion(game, faction, p.id) >= cultureOf(faction).tradeFloor,
    );
    // Rivals take turns, by the time.
    const rival =
      rivals.length === 0
        ? null
        : rivals[Math.floor(game.time / DEAL_EVERY) % rivals.length];
    const island =
      rival === null
        ? -1
        : (game.islands.find(
            (i) => i.owner === rival.id && kontorOf(game, i.id) !== null,
          )?.id ?? -1);
    if (
      merchant !== undefined &&
      ship !== null &&
      rival !== null &&
      island >= 0
    ) {
      const relation = relationOf(game, faction.id, rival.id);
      if (relation !== null) {
        relation.trade = true;
      }
      // Load what may sell there.
      const goods = offerOf(faction)
        .filter((good) => game.islands[island].stock[good] < RIVAL_WANTS_BELOW)
        .sort((a, b) => faction.stock[b] - faction.stock[a])
        .slice(0, DEAL_GOODS);
      for (const good of goods) {
        const units = Math.min(
          DEAL_UNITS,
          forSale(game, faction, rival.id, good),
          roomFor(ship, good),
        );
        if (units > 0) {
          faction.stock[good] -= units;
          ship.cargo[good] = (ship.cargo[good] ?? 0) + units;
        }
      }
      merchant.state = "trading";
      merchant.target = 0;
      merchant.x = island;
      merchant.since = game.time;
    }
  }
}

/** A merchant's deal at a rival's kontor: it sells its load and buys surplus. */
function rivalDeal(
  game: Game,
  faction: Faction,
  ship: Ship,
  island: number,
): void {
  const owner = game.players[game.islands[island].owner];
  const stock = game.islands[island].stock;
  if (owner !== undefined && owner.ai !== null) {
    let gold = 0;
    for (const [good, amount] of Object.entries(ship.cargo) as [
      GoodId,
      number,
    ][]) {
      const price = askPrice(game, faction, owner.id, good);
      const units = Math.floor(
        Math.min(amount, Math.max(0, owner.gold - RIVAL_GOLD_RESERVE) / price),
      );
      if (units > 0) {
        stock[good] += units;
        ship.cargo[good] = amount - units;
        spend(owner, units * price, "purchases");
        faction.gold += units * price;
        owner.stats.traded += units;
        gold += units * price;
      }
    }
    for (const good of cultureOf(faction).wants) {
      const price = bidPrice(game, faction, owner.id, good);
      const units = Math.floor(
        Math.min(
          DEAL_UNITS,
          stock[good] - RIVAL_SURPLUS,
          wantedUnits(game, faction, owner.id, good),
          roomFor(ship, good),
        ),
      );
      if (units > 0) {
        stock[good] -= units;
        ship.cargo[good] = (ship.cargo[good] ?? 0) + units;
        faction.gold -= units * price;
        earn(owner, units * price, "sales");
        owner.stats.traded += units;
        gold += units * price;
      }
    }
    if (gold > 0) {
      feel(game, faction, owner.id, "trade", 1);
      note(game, faction, "aiTrade", owner.id, null, gold);
    }
  }
}

/**
 * Guards patrol home, go for pirates and other enemies near home or its
 * merchants, and while the people helps a friend they patrol off the
 * friend's home or hunt near the pirates' island.
 */
function guards(game: Game, faction: Faction): void {
  const support =
    faction.support !== null && faction.support.until > game.time
      ? faction.support
      : null;
  const list = faction.fleet.filter((entry) => entry.role === "guard");
  list.forEach((entry, index) => {
    const ship = shipOf(game, entry);
    if (ship !== null) {
      // One guard always stays home when there are more.
      const sent = support !== null && (index > 0 || list.length === 1);
      const threat = threatNear(game, faction);
      if (threat !== null && entry.state !== "defending") {
        entry.state = "defending";
        entry.since = game.time;
        ship.order = { type: "attack", target: threat.id, building: false };
        ship.path = [];
      } else if (
        entry.state === "defending" &&
        (ship.order.type !== "attack" ||
          (support === null && !atHome(game, faction, ship, LEASH)))
      ) {
        // The chase is over, or it leads too far from home.
        entry.state = "idle";
        sailHome(game, faction, ship);
      } else if (entry.state !== "defending") {
        const duty = sent
          ? (support as { player: number; hunt: boolean })
          : null;
        const key =
          duty === null ? HOME_DUTY : duty.hunt ? HUNT_DUTY : duty.player;
        if (entry.target !== key || ship.order.type !== "patrol") {
          entry.target = key;
          patrolFor(game, faction, ship, duty);
        }
      }
    }
  });
  if (faction.support !== null && faction.support.until <= game.time) {
    // Help is over: the guards come home.
    faction.support = {
      ...faction.support,
      until: Math.min(faction.support.until, game.time),
    };
  }
}

/** The nearest enemy close to a people's home, its merchants or its guard. */
function threatNear(game: Game, faction: Faction): Ship | null {
  const home = game.world.islands[faction.island];
  let threat = nearestEnemyShip(
    game,
    faction.id,
    home.cx,
    home.cy,
    DEFEND_RANGE,
  );
  for (const entry of faction.fleet) {
    const ship =
      threat === null && entry.role === "merchant" ? shipOf(game, entry) : null;
    if (ship !== null) {
      threat = nearestEnemyShip(
        game,
        faction.id,
        ship.x,
        ship.y,
        DEFEND_RANGE / 2,
      );
    }
  }
  return threat;
}

/** Sets a guard's patrol: off home, off a friend's home, or near the pirates. */
function patrolFor(
  game: Game,
  faction: Faction,
  ship: Ship,
  duty: { player: number; hunt: boolean } | null,
): void {
  const n = game.world.n;
  const home = homeOf(game, faction).berth;
  let from = home;
  let to = -1;
  if (duty === null) {
    const info = game.world.islands[faction.island];
    const bx = home % n;
    const by = Math.floor(home / n);
    // Out across the island's far side.
    to = seaNear(game, 2 * info.cx - bx, 2 * info.cy - by, PATROL_OUT);
  } else if (duty.hunt) {
    const pirates = game.factions.find((f) => f.kind === "pirates");
    const target = pirates === undefined ? -1 : homeOf(game, pirates).berth;
    from =
      target < 0
        ? home
        : seaNear(
            game,
            target % n,
            Math.floor(target / n) + HUNT_OFF,
            PATROL_OUT,
          );
    to =
      target < 0
        ? -1
        : seaNear(
            game,
            (target % n) + HUNT_OFF,
            Math.floor(target / n),
            PATROL_OUT,
          );
  } else {
    const island = game.islands.find(
      (i) => i.owner === duty.player && kontorOf(game, i.id) !== null,
    );
    const kontor = island === undefined ? null : kontorOf(game, island.id);
    from = kontor === null ? home : berthOf(game, kontor);
    to =
      from < 0
        ? -1
        : seaNear(
            game,
            (from % n) + PATROL_OUT,
            Math.floor(from / n),
            PATROL_OUT,
          );
  }
  if (from >= 0 && to >= 0) {
    ship.order = {
      type: "patrol",
      ax: from % n,
      ay: Math.floor(from / n),
      bx: to % n,
      by: Math.floor(to / n),
      leg: 0,
    };
    if (!sailTo(game, ship, to)) {
      ship.order = { type: "idle" };
    }
  }
}

/**
 * An allied people sends help unasked when its friend is at war or its
 * ships are being shot at by pirates nearby.
 */
function helpAllies(game: Game, faction: Faction): void {
  const busy =
    faction.support !== null &&
    faction.support.until + SUPPORT_SECONDS > game.time;
  if (cultureOf(faction).helps && !busy && !game.settings.peaceful) {
    for (const player of game.players) {
      const relation = relationOf(game, faction.id, player.id);
      const atWar = game.diplomacy.relations.some(
        (r) => r.war && r.a >= 0 && (r.a === player.id || r.b === player.id),
      );
      const raided =
        relation?.alliance === true &&
        game.ships.some(
          (ship) =>
            ship.owner === player.id &&
            game.time - ship.hitAt < HELP_RECENT &&
            ship.hitAt > 0 &&
            nearestEnemyShip(game, player.id, ship.x, ship.y, HELP_REACH) !==
              null,
        );
      if (
        relation?.alliance === true &&
        (atWar || raided) &&
        (faction.support === null ||
          faction.support.until + SUPPORT_SECONDS <= game.time)
      ) {
        faction.support = {
          player: player.id,
          until: game.time + SUPPORT_SECONDS,
          hunt: false,
        };
        note(game, faction, "support", player.id, null, 0);
      }
    }
  }
}

/** A faction's towers fire at the nearest enemy ship in reach. */
function towers(game: Game, faction: Faction): void {
  const guns = faction.kind === "pirates" ? PIRATE_TOWER : NATION_TOWER;
  for (const site of factionLayout(game.world, homeOf(game, faction))) {
    if (site.kind === "tower") {
      const at = siteCentre(site);
      const enemy = nearestEnemyShip(game, faction.id, at.x, at.y, guns.range);
      if (enemy !== null && factionHostile(game, faction.id, enemy.owner)) {
        game.events.push({
          type: "shot",
          x1: at.x,
          y1: at.y,
          x2: enemy.x,
          y2: enemy.y,
        });
        const share =
          TOWER_LOW +
          (TOWER_HIGH - TOWER_LOW) * ((game.tick % TOWER_STEPS) / TOWER_STEPS);
        hitShip(game, enemy, guns.damage * share, faction.id);
      }
    }
  }
}

/** The free sea tile nearest a berth, clear of other ships, or -1. */
function freeWater(game: Game, berth: number): number {
  const world = game.world;
  const n = world.n;
  const bx = berth % n;
  const by = Math.floor(berth / n);
  let best = -1;
  for (let r = 0; r <= LAUNCH_RINGS && best < 0 && berth >= 0; r += 1) {
    for (let dy = -r; dy <= r && best < 0; dy += 1) {
      for (let dx = -r; dx <= r && best < 0; dx += 1) {
        const x = bx + dx;
        const y = by + dy;
        if (
          inBounds(world, x, y) &&
          isSea(world.terrain[y * n + x] as Terrain) &&
          game.ships.every(
            (ship) =>
              Math.hypot(ship.x - x - TILE_CENTER, ship.y - y - TILE_CENTER) >=
              LAUNCH_CLEARANCE,
          )
        ) {
          best = y * n + x;
        }
      }
    }
  }
  return best;
}
