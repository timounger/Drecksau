/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so a round trip leaves it alone - but what comes
 * back may be from an older build, hand-edited, or simply broken. This guard is
 * the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A board where somebody has settlements on two
 * touching crossings is not this module's problem: the referee never produced
 * it, and no move will make it worse. What it does insist on is that the two
 * big boards are **exactly the right length**, because everything else indexes
 * them by number, and a short array reads as `undefined` for a whole crossing
 * rather than failing where the mistake happened.
 */
import { BOARD_SIZES, islandOf } from "./board";
import { OFF_BOARD } from "./fischer";
import { BRIDGES_EACH, NO_RIVERS } from "./fluesse";
import { NO_FORT, RAID_CARD_NAMES } from "./barbaren";
import {
  BOATS_EACH,
  CARGO_KINDS,
  FISH_SIDES,
  SPICE_KINDS,
  PORTS_EACH,
  SCOUTS_EACH,
  SHOALS,
  UNITS_EACH,
  type Cargo,
  type Spice,
} from "./entdecker";
import { CLOTH_SUPPLY, SHIPS_EACH, WONDER_KINDS } from "./seefahrer";
import { HAUL_CARD_NAMES, TARGETS, WARES } from "./handel";
import { MOST_CARAVANS, NO_TRAIL } from "./karawane";
import { COMMODITIES, NO_GOODS, NO_TABLEAU, type Knight } from "./knights";
import { PROGRESS_NAMES_LIST, TRACK_LIST, buildDecks } from "./progress";
import {
  LAND_KINDS,
  PHASES,
  RESOURCES,
  SCENARIOS,
  type CatanGame,
  type CatanPlayer,
  type Hand,
  type Land,
  type Phase,
  type Resource,
  type Scenario,
  type Wonder,
} from "./state";

/** The variants a stored game may claim to be playing. */
const VARIANT_NAMES: readonly string[] = ["raeuber", "ereignisse", "haefen"];

/** The cards of Der Barbarenüberfall, as strings. */
const RAID_CARD_LIST: readonly string[] = Object.keys(RAID_CARD_NAMES);

/** The sites, the wares and the cards of Händler & Barbaren, as strings. */
const TARGET_LIST: readonly string[] = TARGETS;
const WARE_LIST: readonly string[] = WARES;
const HAUL_CARD_LIST: readonly string[] = Object.keys(HAUL_CARD_NAMES);

/** The landscapes a stored game may claim to have. */

/** The development cards a stored game may claim to hold. */
const CARDS: readonly string[] = [
  "ritter",
  "siegpunkt",
  "monopol",
  "strassenbau",
  "erfindung",
];

/**
 * Checks an unknown value really is a game of Catan.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isCatanGame(value: unknown): value is CatanGame {
  const game = value as CatanGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase as Phase) &&
    seats > 0 &&
    game.players.every(isPlayer) &&
    isSeat(game.active, seats) &&
    (game.stone === 1 || game.stone === 2) &&
    isLand(game.land) &&
    isChips(game.chips, game.land.length) &&
    isHarbours(game.harbours, game.land.length) &&
    // -1 is a place too: Fischfang auf Catan starts with the robber beside the
    // board, and it goes on only at the first seven.
    (game.robber === OFF_BOARD || isHex(game.robber, game.land.length)) &&
    isTowns(game.towns, seats, game.land.length) &&
    isRoads(game.roads, seats, game.land.length) &&
    isCards(game.stack) &&
    isDice(game.dice) &&
    isFounding(game.founding, seats, game.land.length) &&
    isOffer(game.offer, seats) &&
    isSeats(game.owing, seats) &&
    isSeats(game.owed, seats) &&
    isEvents(game.events) &&
    (game.drawn === null || isEventCard(game.drawn)) &&
    (game.after === null || Number.isInteger(game.after)) &&
    Array.isArray(game.given) &&
    game.given.every(
      (sort) => sort === null || RESOURCES.includes(sort as never),
    ) &&
    isSeats(game.targets, seats) &&
    Number.isInteger(game.freeRoads) &&
    Number.isInteger(game.gifts) &&
    Number.isInteger(game.offers) &&
    Array.isArray(game.variants) &&
    game.variants.every((name) => VARIANT_NAMES.includes(name)) &&
    (game.harbourTile === null || isSeat(game.harbourTile, seats)) &&
    Number.isInteger(game.harbourBest) &&
    typeof game.playedDev === "boolean" &&
    (game.rolls === undefined || Number.isInteger(game.rolls)) &&
    (game.firstRoll === undefined ||
      game.firstRoll === null ||
      Number.isInteger(game.firstRoll)) &&
    (game.neutralBuild === undefined ||
      game.neutralBuild === null ||
      game.neutralBuild === "town" ||
      game.neutralBuild === "road") &&
    (game.swapWith === undefined ||
      game.swapWith === null ||
      Number.isInteger(game.swapWith)) &&
    (game.knightGiven === undefined || typeof game.knightGiven === "boolean") &&
    // Asked of the one list there is, rather than written out again here: a
    // scenario missing from a hand-written copy would throw away every session
    // saved in it, which is exactly what happened to the phases.
    (game.scenario === undefined ||
      SCENARIOS.includes(game.scenario as Scenario)) &&
    (game.grounds === undefined || isGrounds(game.grounds, game.land.length)) &&
    (game.fishPile === undefined || isFish(game.fishPile)) &&
    (game.fishSpent === undefined || isFish(game.fishSpent)) &&
    (game.shoe === undefined ||
      game.shoe === null ||
      isSeat(game.shoe, seats)) &&
    // Die Flüsse von Catan.
    (game.rivers === undefined || isRivers(game.rivers, game.land.length)) &&
    (game.bridges === undefined ||
      isRoads(game.bridges, seats, game.land.length)) &&
    (game.richest === undefined ||
      game.richest === null ||
      isSeat(game.richest, seats)) &&
    (game.poorest === undefined ||
      (Array.isArray(game.poorest) &&
        game.poorest.every((seat) => isSeat(seat, seats)))) &&
    (game.goldBuys === undefined || Number.isInteger(game.goldBuys)) &&
    // Der Handelstross.
    (game.trail === undefined || isTrail(game.trail, game.land.length)) &&
    (game.wagons === undefined || isWagons(game.wagons, game.land.length)) &&
    (game.caravans === undefined ||
      isCaravans(game.caravans, game.land.length)) &&
    (game.wagonsLeft === undefined || Number.isInteger(game.wagonsLeft)) &&
    (game.vote === undefined ||
      game.vote === null ||
      isVote(game.vote, seats, game.land.length)) &&
    (game.built === undefined || typeof game.built === "boolean") &&
    // Der Barbarenüberfall.
    (game.fort === undefined || isFort(game.fort, game.land.length)) &&
    (game.barbarians === undefined ||
      (Array.isArray(game.barbarians) &&
        game.barbarians.every((count) => Number.isInteger(count)))) &&
    (game.barbariansLeft === undefined ||
      Number.isInteger(game.barbariansLeft)) &&
    (game.guards === undefined ||
      isRoads(game.guards, seats, game.land.length)) &&
    (game.ridden === undefined ||
      within(game.ridden, islandOf(game.land.length).paths.length)) &&
    (game.raidDeck === undefined || isRaidCards(game.raidDeck)) &&
    (game.raidUsed === undefined || isRaidCards(game.raidUsed)) &&
    (game.raidCard === undefined ||
      game.raidCard === null ||
      isRaidCards([game.raidCard])) &&
    (game.posting === undefined ||
      game.posting === null ||
      game.posting === "castle" ||
      game.posting === "any") &&
    (game.barbTake === undefined || Number.isInteger(game.barbTake)) &&
    (game.barbPut === undefined || Number.isInteger(game.barbPut)) &&
    (game.lastLie === undefined ||
      game.lastLie === null ||
      Number.isInteger(game.lastLie)) &&
    // Händler & Barbaren.
    (game.depots === undefined || isDepots(game.depots, game.land.length)) &&
    (game.raiders === undefined ||
      (Array.isArray(game.raiders) &&
        game.raiders.every((held) => typeof held === "boolean"))) &&
    (game.haulDeck === undefined || isHaulCards(game.haulDeck)) &&
    (game.haulUsed === undefined || isHaulCards(game.haulUsed)) &&
    (game.shiftDraws === undefined || typeof game.shiftDraws === "boolean") &&
    (game.secondDrive === undefined || typeof game.secondDrive === "boolean") &&
    (game.shoved === undefined ||
      within(game.shoved, islandOf(game.land.length).paths.length)) &&
    // Seefahrer.
    (game.ships === undefined ||
      isRoads(game.ships, seats, game.land.length)) &&
    (game.freshShips === undefined ||
      within(game.freshShips, islandOf(game.land.length).paths.length)) &&
    (game.shipMoved === undefined || typeof game.shipMoved === "boolean") &&
    (game.pirate === undefined || Number.isInteger(game.pirate)) &&
    (game.goldOwed === undefined ||
      (Array.isArray(game.goldOwed) &&
        game.goldOwed.every((count) => Number.isInteger(count)))) &&
    // Entdecker & Piraten.
    (game.boats === undefined ||
      isBoats(game.boats, seats, game.land.length)) &&
    (game.hidden === undefined || isLand(game.hidden)) &&
    (game.hiddenChips === undefined ||
      isChips(game.hiddenChips, game.land.length)) &&
    (game.sailing === undefined ||
      game.sailing === null ||
      Number.isInteger(game.sailing)) &&
    (game.docks === undefined || isDocks(game.docks)) &&
    (game.camps === undefined || isCamps(game.camps, seats)) &&
    (game.pirateShip === undefined ||
      game.pirateShip === null ||
      (isObject(game.pirateShip) &&
        isSeat((game.pirateShip as { owner?: unknown }).owner, seats) &&
        Number.isInteger((game.pirateShip as { hex?: unknown }).hex))) &&
    (game.tributes === undefined ||
      (Array.isArray(game.tributes) &&
        game.tributes.every((boat) => Number.isInteger(boat)))) &&
    (game.chased === undefined ||
      (Array.isArray(game.chased) &&
        game.chased.every((boat) => Number.isInteger(boat)))) &&
    (game.mission === undefined ||
      (Array.isArray(game.mission) &&
        game.mission.every((step) => Number.isInteger(step)))) &&
    (game.catches === undefined ||
      (Array.isArray(game.catches) &&
        game.catches.every((step) => Number.isInteger(step)))) &&
    (game.fish === undefined || isFishFields(game.fish, game.land.length)) &&
    (game.spice === undefined || isVillages(game.spice, game.land.length)) &&
    (game.villages === undefined ||
      (isObject(game.villages) &&
        Object.values(game.villages as Record<string, unknown>).every(
          (list) =>
            Array.isArray(list) && list.every((who) => isSeat(who, seats)),
        ))) &&
    (game.sacks === undefined ||
      (isObject(game.sacks) &&
        Object.values(game.sacks as Record<string, unknown>).every((left) =>
          Number.isInteger(left),
        ))) &&
    (game.spices === undefined ||
      (Array.isArray(game.spices) &&
        game.spices.every((step) => Number.isInteger(step)))) &&
    (game.sold === undefined || Number.isInteger(game.sold)) &&
    (game.shoals === undefined ||
      (Array.isArray(game.shoals) &&
        game.shoals.every((hex) => isHex(hex, game.land.length)))) &&
    (game.shoalsLeft === undefined || Number.isInteger(game.shoalsLeft)) &&
    (game.cast === undefined || typeof game.cast === "boolean") &&
    (game.wonders === undefined ||
      (Array.isArray(game.wonders) &&
        game.wonders.every((each) => {
          const one = each as Record<string, unknown> | null;
          return (
            each === null ||
            (isObject(each) &&
              WONDER_KINDS.includes(one?.kind as Wonder) &&
              Number.isInteger(one?.stage))
          );
        }))) &&
    (game.forts === undefined ||
      (isObject(game.forts) &&
        Object.values(game.forts as Record<string, unknown>).every((fort) => {
          const one = fort as Record<string, unknown>;
          return (
            isObject(fort) &&
            isSeat(one.owner, seats) &&
            Number.isInteger(one.chips)
          );
        }))) &&
    (game.marks === undefined ||
      (Array.isArray(game.marks) &&
        game.marks.every((at) => Number.isInteger(at)))) &&
    (game.warships === undefined ||
      (Array.isArray(game.warships) &&
        game.warships.every((path) => Number.isInteger(path)))) &&
    (game.armada === undefined || Number.isInteger(game.armada)) &&
    (game.stormed === undefined || typeof game.stormed === "boolean") &&
    (game.villagesOf === undefined ||
      (isObject(game.villagesOf) &&
        Object.values(game.villagesOf as Record<string, unknown>).every(
          (village) =>
            isObject(village) &&
            Number.isInteger((village as { number?: unknown }).number) &&
            Number.isInteger((village as { bales?: unknown }).bales),
        ))) &&
    (game.traders === undefined ||
      (isObject(game.traders) &&
        Object.values(game.traders as Record<string, unknown>).every(
          (list) =>
            Array.isArray(list) && list.every((who) => isSeat(who, seats)),
        ))) &&
    (game.baleStock === undefined || Number.isInteger(game.baleStock)) &&
    (game.lockedShips === undefined ||
      (Array.isArray(game.lockedShips) &&
        game.lockedShips.every((path) => Number.isInteger(path)))) &&
    (game.presents === undefined ||
      isPresents(game.presents, game.land.length)) &&
    (game.heldPorts === undefined ||
      (Array.isArray(game.heldPorts) &&
        game.heldPorts.every(
          (held) =>
            Array.isArray(held) &&
            held.every((want) => want === null || RESOURCES.includes(want)),
        ))) &&
    (game.robberHome === undefined ||
      game.robberHome === null ||
      isHex(game.robberHome, game.land.length)) &&
    (game.council === undefined ||
      game.council === null ||
      isHex(game.council, game.land.length)) &&
    // Städte & Ritter. All optional, so a game stored before it existed still
    // loads; reviveCatanGame is what fills them in afterwards.
    (game.mode === undefined ||
      game.mode === "klassisch" ||
      game.mode === "ritter") &&
    (game.garrison === undefined ||
      isGarrison(game.garrison, seats, game.towns)) &&
    (game.decks === undefined || isDecks(game.decks)) &&
    (game.barbarian === undefined || Number.isInteger(game.barbarian)) &&
    (game.landed === undefined || typeof game.landed === "boolean") &&
    (game.metro === undefined || isMetro(game.metro, seats)) &&
    (game.trader === undefined ||
      game.trader === null ||
      isHex(game.trader, game.land.length)) &&
    (game.traderOwner === undefined ||
      game.traderOwner === null ||
      isSeat(game.traderOwner, seats)) &&
    (game.playing === undefined ||
      game.playing === null ||
      PROGRESS_NAMES_LIST.includes(game.playing)) &&
    (game.displaced === undefined ||
      game.displaced === null ||
      Number.isInteger(game.displaced)) &&
    (game.longest === null || isSeat(game.longest, seats)) &&
    Number.isInteger(game.longestLen) &&
    (game.army === null || isSeat(game.army, seats)) &&
    Number.isInteger(game.target) &&
    (game.winner === null || isSeat(game.winner, seats)) &&
    Number.isInteger(game.turn) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is CatanPlayer {
  const player = value as CatanPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.bot === "boolean" &&
    typeof player.colour === "string" &&
    // Optional, and staying optional: a game stored before CATAN für Zwei
    // existed has neither, and is a perfectly good three-handed game without
    // them. Read everywhere through the player, which defaults them.
    (player.neutral === undefined || typeof player.neutral === "boolean") &&
    (player.chips === undefined || Number.isInteger(player.chips)) &&
    (player.goods === undefined || isGoods(player.goods)) &&
    (player.tableau === undefined || isTableau(player.tableau)) &&
    (player.walls === undefined || Number.isInteger(player.walls)) &&
    (player.victoryChips === undefined ||
      Number.isInteger(player.victoryChips)) &&
    (player.fish === undefined || isFish(player.fish)) &&
    (player.gold === undefined || Number.isInteger(player.gold)) &&
    (player.prisoners === undefined || Number.isInteger(player.prisoners)) &&
    (player.wagon === undefined ||
      player.wagon === null ||
      Number.isInteger(player.wagon)) &&
    (player.level === undefined || Number.isInteger(player.level)) &&
    (player.ware === undefined ||
      player.ware === null ||
      WARE_LIST.includes(player.ware as string)) &&
    (player.delivered === undefined || Number.isInteger(player.delivered)) &&
    (player.moves === undefined || Number.isInteger(player.moves)) &&
    (player.boosted === undefined || typeof player.boosted === "boolean") &&
    (player.haul === undefined || isHaulCards(player.haul)) &&
    (player.shipsLeft === undefined || Number.isInteger(player.shipsLeft)) &&
    (player.homeIslands === undefined ||
      (Array.isArray(player.homeIslands) &&
        player.homeIslands.every((one) => Number.isInteger(one)))) &&
    (player.islandChips === undefined ||
      Number.isInteger(player.islandChips)) &&
    (player.boatsLeft === undefined || Number.isInteger(player.boatsLeft)) &&
    (player.scoutsLeft === undefined || Number.isInteger(player.scoutsLeft)) &&
    (player.portsLeft === undefined || Number.isInteger(player.portsLeft)) &&
    (player.unitsLeft === undefined || Number.isInteger(player.unitsLeft)) &&
    (player.bales === undefined || Number.isInteger(player.bales)) &&
    (player.bridgesLeft === undefined ||
      Number.isInteger(player.bridgesLeft)) &&
    (player.progress === undefined ||
      (Array.isArray(player.progress) &&
        player.progress.every((card) =>
          PROGRESS_NAMES_LIST.includes(card as string),
        ))) &&
    isHand(player.hand) &&
    Number.isInteger(player.cards) &&
    isCards(player.deck) &&
    isCards(player.fresh) &&
    Number.isInteger(player.knights) &&
    (player.damaged === null || Number.isInteger(player.damaged)) &&
    Number.isInteger(player.roads) &&
    Number.isInteger(player.settlements) &&
    Number.isInteger(player.cities)
  );
}

/** Whether these are fishing grounds on this board. */
function isGrounds(value: unknown, hexes: number): boolean {
  const crossings = islandOf(hexes).crossings.length;
  return (
    Array.isArray(value) &&
    value.every((ground) => {
      const one = ground as { number?: unknown; crossings?: unknown };
      return (
        isObject(ground) &&
        Number.isInteger(one.number) &&
        Array.isArray(one.crossings) &&
        one.crossings.every(
          (at) =>
            Number.isInteger(at) &&
            (at as number) >= 0 &&
            (at as number) < crossings,
        )
      );
    })
  );
}

/**
 * Whether this is a river layout on this board.
 *
 * @remarks
 * Every list is read back against the island the game claims to be played on,
 * because a river that points at a crossing the board has not got would crash
 * the drawing rather than fail to load.
 */
function isRivers(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  const one = value as Record<string, unknown>;
  return (
    isObject(value) &&
    within(one.hexes, hexes) &&
    within(one.bridges, board.paths.length) &&
    within(one.crossings, board.crossings.length) &&
    within(one.paths, board.paths.length) &&
    within(one.marshes, hexes)
  );
}

/**
 * Whether this is a caravan trail on this board.
 *
 * @remarks
 * Read back against the island for the same reason the rivers are: an arrow
 * pointing at a path the board has not got would crash the drawing rather than
 * fail to load.
 */
function isTrail(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  const one = value as Record<string, unknown>;
  return (
    isObject(value) &&
    within(one.holes, hexes) &&
    within(one.arrows, board.paths.length) &&
    within(one.gates, board.crossings.length)
  );
}

/** Whether these are the wagons on the board, one slot per path. */
function isWagons(value: unknown, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === islandOf(hexes).paths.length &&
    value.every(
      (which) =>
        which === null ||
        (Number.isInteger(which) &&
          (which as number) >= 0 &&
          (which as number) < MOST_CARAVANS),
    )
  );
}

/** Whether these are the three caravans. */
function isCaravans(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  return (
    Array.isArray(value) &&
    value.every((caravan) => {
      const one = caravan as Record<string, unknown>;
      return (
        isObject(caravan) &&
        within(one.paths, board.paths.length) &&
        Number.isInteger(one.head) &&
        (one.head as number) >= 0 &&
        (one.head as number) < board.crossings.length &&
        typeof one.merged === "boolean"
      );
    })
  );
}

/** Whether this is a voting round. */
function isVote(value: unknown, seats: number, hexes: number): boolean {
  const one = value as Record<string, unknown>;
  return (
    isObject(value) &&
    isSeat(one.caller, seats) &&
    isSeats(one.order, seats) &&
    Array.isArray(one.laid) &&
    one.laid.every((count) => Number.isInteger(count)) &&
    Array.isArray(one.picks) &&
    one.picks.every(
      (pick) =>
        pick === null ||
        (Number.isInteger(pick) &&
          (pick as number) >= 0 &&
          (pick as number) < islandOf(hexes).paths.length),
    ) &&
    Number.isInteger(one.step) &&
    (one.stage === "lay" || one.stage === "assign" || one.stage === "place") &&
    (one.decider === null || isSeat(one.decider, seats)) &&
    isSeats(one.queue, seats) &&
    Array.isArray(one.grown) &&
    one.grown.every(
      (which) =>
        Number.isInteger(which) &&
        (which as number) >= 0 &&
        (which as number) < MOST_CARAVANS,
    )
  );
}

/** Whether this is a castle layout on this board. */
function isFort(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  const one = value as Record<string, unknown>;
  return (
    isObject(value) &&
    within(one.castles, hexes) &&
    within(one.deserts, hexes) &&
    within(one.coast, hexes) &&
    within(one.gates, board.paths.length)
  );
}

/** Whether these are cards of this scenario's own deck. */
function isRaidCards(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((card) => RAID_CARD_LIST.includes(card as string))
  );
}

/** Whether these are the three sites of Händler & Barbaren. */
function isDepots(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  return (
    Array.isArray(value) &&
    value.every((depot) => {
      const one = depot as Record<string, unknown>;
      return (
        isObject(depot) &&
        TARGET_LIST.includes(one.target as string) &&
        Number.isInteger(one.hex) &&
        (one.hex as number) >= 0 &&
        (one.hex as number) < hexes &&
        Number.isInteger(one.gate) &&
        (one.gate as number) >= 0 &&
        (one.gate as number) < board.crossings.length &&
        Array.isArray(one.stack) &&
        one.stack.every((ware) => WARE_LIST.includes(ware as string))
      );
    })
  );
}

/** Whether these are cards of the hauling deck. */
function isHaulCards(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((card) => HAUL_CARD_LIST.includes(card as string))
  );
}

/** Whether these are the ships of Entdecker & Piraten. */
function isBoats(value: unknown, seats: number, hexes: number): boolean {
  const board = islandOf(hexes);
  return (
    Array.isArray(value) &&
    value.every((boat) => {
      const one = boat as Record<string, unknown>;
      return (
        isObject(boat) &&
        isSeat(one.owner, seats) &&
        Number.isInteger(one.at) &&
        (one.at as number) >= 0 &&
        (one.at as number) < board.paths.length &&
        Array.isArray(one.hold) &&
        one.hold.every((cargo) => CARGO_KINDS.includes(cargo as Cargo)) &&
        Number.isInteger(one.spent) &&
        typeof one.boosted === "boolean" &&
        typeof one.done === "boolean"
      );
    })
  );
}

/** Whether these are the die numbers of the fish fields, keyed by field. */
function isFishFields(value: unknown, hexes: number): boolean {
  return (
    isObject(value) &&
    Object.entries(value as Record<string, unknown>).every(
      ([hex, number]) =>
        isHex(Number(hex), hexes) &&
        Number.isInteger(number) &&
        (number as number) > 0 &&
        (number as number) <= FISH_SIDES,
    )
  );
}

/** Whether these are the gifts of the forgotten tribe, keyed by sea path. */
function isPresents(value: unknown, hexes: number): boolean {
  return (
    isObject(value) &&
    Object.entries(value as Record<string, unknown>).every(([path, gift]) => {
      const one = gift as Record<string, unknown>;
      return (
        Number.isInteger(Number(path)) &&
        Number(path) >= 0 &&
        // A path, not a field - there are more of them than of the fields, and
        // the exact count belongs to the board rather than to this check.
        Number(path) < hexes * PATHS_PER_HEX &&
        isObject(gift) &&
        (one.kind === "chip" ||
          one.kind === "card" ||
          (one.kind === "harbour" &&
            (one.want === null || RESOURCES.includes(one.want as Resource))))
      );
    })
  );
}

/** At most six paths to a field, which bounds their number. */
const PATHS_PER_HEX = 6;

/** Whether these are the village advantages, keyed by the field they sit on. */
function isVillages(value: unknown, hexes: number): boolean {
  return (
    isObject(value) &&
    Object.entries(value as Record<string, unknown>).every(
      ([hex, gift]) =>
        isHex(Number(hex), hexes) && SPICE_KINDS.includes(gift as Spice),
    )
  );
}

/** Whether these are the pirate camps, keyed by the field they sit on. */
function isCamps(value: unknown, seats: number): boolean {
  return (
    isObject(value) &&
    Object.values(value as Record<string, unknown>).every((camp) => {
      const one = camp as Record<string, unknown>;
      return (
        isObject(camp) &&
        Array.isArray(one.units) &&
        one.units.every((seat) => isSeat(seat, seats)) &&
        typeof one.taken === "boolean"
      );
    })
  );
}

/** Whether these are the harbour basins, keyed by crossing. */
function isDocks(value: unknown): boolean {
  return (
    isObject(value) &&
    Object.values(value as Record<string, unknown>).every(
      (hold) =>
        Array.isArray(hold) &&
        hold.every((cargo) => CARGO_KINDS.includes(cargo as Cargo)),
    )
  );
}

/** Whether every number in a list points at something the board has. */
function within(list: unknown, count: number): boolean {
  return (
    Array.isArray(list) &&
    list.every(
      (at) =>
        Number.isInteger(at) && (at as number) >= 0 && (at as number) < count,
    )
  );
}

/** Whether this is a pile of fish tiles. */
function isFish(value: unknown): boolean {
  return Array.isArray(value) && value.every((tile) => Number.isInteger(tile));
}

/** Whether this is a set of Handelswaren. */
function isGoods(value: unknown): boolean {
  const goods = value as Record<string, unknown>;
  return (
    isObject(value) &&
    COMMODITIES.every((sort) => Number.isInteger(goods[sort]))
  );
}

/** Whether this is a Fortschritt-Tableau. */
function isTableau(value: unknown): boolean {
  const tableau = value as Record<string, unknown>;
  return (
    isObject(value) &&
    TRACK_LIST.every((track) => Number.isInteger(tableau[track]))
  );
}

/** Whether this is a board of knights the right length. */
function isGarrison(value: unknown, seats: number, towns: unknown): boolean {
  const wanted = Array.isArray(towns) ? towns.length : -1;
  return (
    Array.isArray(value) &&
    value.length === wanted &&
    value.every(
      (knight) =>
        knight === null ||
        (isObject(knight) &&
          isSeat((knight as Knight).owner, seats) &&
          Number.isInteger((knight as Knight).level) &&
          typeof (knight as Knight).active === "boolean" &&
          typeof (knight as Knight).fresh === "boolean" &&
          typeof (knight as Knight).spent === "boolean"),
    )
  );
}

/** Whether these are the three Fortschritt piles. */
function isDecks(value: unknown): boolean {
  const decks = value as Record<string, unknown>;
  return (
    isObject(value) &&
    TRACK_LIST.every(
      (track) =>
        Array.isArray(decks[track]) &&
        (decks[track] as unknown[]).every((card) =>
          PROGRESS_NAMES_LIST.includes(card as string),
        ),
    )
  );
}

/** Whether these are the three metropolises. */
function isMetro(value: unknown, seats: number): boolean {
  const metro = value as Record<string, unknown>;
  return (
    isObject(value) &&
    TRACK_LIST.every((track) => {
      const one = metro[track] as { seat?: unknown; at?: unknown } | null;
      return (
        one === null ||
        (isObject(one) && isSeat(one.seat, seats) && Number.isInteger(one.at))
      );
    })
  );
}

/** Whether this is a hand of resource cards. */
function isHand(value: unknown): value is Hand {
  const hand = value as Hand;
  return (
    isObject(value) && RESOURCES.every((sort) => Number.isInteger(hand[sort]))
  );
}

/** The events a stored game may name. */
const EVENT_KINDS: readonly string[] = [
  "schoenerTag",
  "raeuberueberfall",
  "seuche",
  "erdbeben",
  "guteNachbarschaft",
  "ritterturnier",
  "handelsvorteil",
  "ruhigeSee",
  "rueckzug",
  "nachbarschaftshilfe",
  "konflikt",
  "ertragreichesJahr",
  "jahreswechsel",
];

/** Whether this is one event card. */
function isEventCard(value: unknown): boolean {
  const card = value as { number?: unknown; kind?: unknown };
  return (
    isObject(value) &&
    (card.number === null || Number.isInteger(card.number)) &&
    EVENT_KINDS.includes(card.kind as string)
  );
}

/** Whether this is a draw pile of event cards. */
function isEvents(value: unknown): boolean {
  return Array.isArray(value) && value.every(isEventCard);
}

/** Whether this is a list of development cards. */
function isCards(value: unknown): boolean {
  return Array.isArray(value) && value.every((card) => CARDS.includes(card));
}

/** Whether this names a seat at this table. */
function isSeat(value: unknown, seats: number): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is a list of seats. */
function isSeats(value: unknown, seats: number): boolean {
  return Array.isArray(value) && value.every((seat) => isSeat(seat, seats));
}

/** Whether this names a landscape. */
function isHex(value: unknown, hexes: number): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < hexes
  );
}

/**
 * Whether this is a full row of landscapes.
 *
 * @remarks
 * Two lengths are allowed and nothing between: the printed board's 19, and the
 * 30 of the 5-6 Personen Erweiterung. The length is what everything else reads
 * the board size off, so it has to be one of the two the code can build.
 */
function isLand(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    // Both lists are asked of the code that builds them - the boards of
    // board.ts and the field kinds of state.ts - rather than copied out here,
    // because a copy falls behind and a saved game is what pays for it.
    BOARD_SIZES.includes(value.length) &&
    value.every((land) => LAND_KINDS.includes(land as Land))
  );
}

/** Whether this is the full row of number chips. */
function isChips(value: unknown, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === hexes &&
    value.every((chip) => Number.isInteger(chip))
  );
}

/** Whether these are harbours on real paths. */
function isHarbours(value: unknown, hexes: number): boolean {
  const board = islandOf(hexes);
  return (
    Array.isArray(value) &&
    value.every((harbour) => {
      const dock = harbour as { path?: unknown; want?: unknown };
      return (
        isObject(harbour) &&
        Number.isInteger(dock.path) &&
        (dock.path as number) < board.paths.length &&
        (dock.want === null || RESOURCES.includes(dock.want as never))
      );
    })
  );
}

/** Whether this is the full row of crossings. */
function isTowns(value: unknown, seats: number, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === islandOf(hexes).crossings.length &&
    value.every((town) => {
      const built = town as { owner?: unknown; city?: unknown };
      return (
        town === null ||
        (isObject(town) &&
          isSeat(built.owner, seats) &&
          typeof built.city === "boolean")
      );
    })
  );
}

/** Whether this is the full row of paths. */
function isRoads(value: unknown, seats: number, hexes: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === islandOf(hexes).paths.length &&
    value.every((owner) => owner === null || isSeat(owner, seats))
  );
}

/** Whether this is a pair of dice or nothing. */
function isDice(value: unknown): boolean {
  return (
    value === null ||
    (Array.isArray(value) &&
      value.length === 2 &&
      value.every((die) => Number.isInteger(die)))
  );
}

/** Whether this is the founding phase's bookkeeping. */
function isFounding(value: unknown, seats: number, hexes: number): boolean {
  const founding = value as {
    order?: unknown;
    step?: unknown;
    placing?: unknown;
    lastTown?: unknown;
  };
  return (
    value === null ||
    (isObject(value) &&
      isSeats(founding.order, seats) &&
      Number.isInteger(founding.step) &&
      (founding.placing === "town" || founding.placing === "road") &&
      (founding.lastTown === null ||
        (Number.isInteger(founding.lastTown) &&
          (founding.lastTown as number) < islandOf(hexes).crossings.length)))
  );
}

/** Whether this is an offer on the table. */
function isOffer(value: unknown, seats: number): boolean {
  const offer = value as {
    from?: unknown;
    give?: unknown;
    want?: unknown;
    answers?: unknown;
  };
  return (
    value === null ||
    (isObject(value) &&
      isSeat(offer.from, seats) &&
      isHand(offer.give) &&
      isHand(offer.want) &&
      Array.isArray(offer.answers) &&
      offer.answers.length === seats &&
      offer.answers.every(
        (answer) => answer === null || typeof answer === "boolean",
      ))
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

/**
 * Fills in what a game stored before *CATAN für Zwei* has never heard of.
 *
 * @param game - a game that has passed {@link isCatanGame}
 * @returns the same game with every field the referee expects
 * @remarks
 * The guard accepts those fields missing on purpose - an old three-handed save
 * is a perfectly good game and throwing it away would cost somebody their
 * evening over a variant they were not playing. But the referee does arithmetic
 * on `rolls`, so "missing" has to become "zero" **once**, here, rather than at
 * every place that reads it.
 */
export function reviveCatanGame(game: CatanGame): CatanGame {
  return {
    ...game,
    rolls: game.rolls ?? 0,
    firstRoll: game.firstRoll ?? null,
    neutralBuild: game.neutralBuild ?? null,
    swapWith: game.swapWith ?? null,
    knightGiven: game.knightGiven ?? false,
    mode: game.mode ?? "klassisch",
    garrison: game.garrison ?? game.towns.map(() => null),
    decks: game.decks ?? buildDecks(),
    barbarian: game.barbarian ?? 0,
    landed: game.landed ?? false,
    metro: game.metro ?? { wissenschaft: null, handel: null, politik: null },
    eventDie: game.eventDie ?? null,
    redDie: game.redDie ?? null,
    trader: game.trader ?? null,
    traderOwner: game.traderOwner ?? null,
    drawing: game.drawing ?? [],
    playing: game.playing ?? null,
    displaced: game.displaced ?? null,
    crane: game.crane ?? null,
    scenario: game.scenario ?? "keins",
    grounds: game.grounds ?? [],
    fishPile: game.fishPile ?? [],
    fishSpent: game.fishSpent ?? [],
    shoe: game.shoe ?? null,
    rivers: game.rivers ?? NO_RIVERS,
    bridges: game.bridges ?? game.roads.map(() => null),
    richest: game.richest ?? null,
    poorest: game.poorest ?? [],
    goldBuys: game.goldBuys ?? 0,
    trail: game.trail ?? NO_TRAIL,
    wagons: game.wagons ?? game.roads.map(() => null),
    caravans: game.caravans ?? [],
    wagonsLeft: game.wagonsLeft ?? 0,
    vote: game.vote ?? null,
    built: game.built ?? false,
    fort: game.fort ?? NO_FORT,
    barbarians: game.barbarians ?? game.land.map(() => 0),
    barbariansLeft: game.barbariansLeft ?? 0,
    guards: game.guards ?? game.roads.map(() => null),
    ridden: game.ridden ?? [],
    raidDeck: game.raidDeck ?? [],
    raidUsed: game.raidUsed ?? [],
    raidCard: game.raidCard ?? null,
    posting: game.posting ?? null,
    barbTake: game.barbTake ?? 0,
    barbPut: game.barbPut ?? 0,
    lastLie: game.lastLie ?? null,
    depots: game.depots ?? [],
    raiders: game.raiders ?? game.roads.map(() => false),
    haulDeck: game.haulDeck ?? [],
    haulUsed: game.haulUsed ?? [],
    shiftDraws: game.shiftDraws ?? false,
    secondDrive: game.secondDrive ?? false,
    shoved: game.shoved ?? [],
    ships: game.ships ?? game.roads.map(() => null),
    freshShips: game.freshShips ?? [],
    shipMoved: game.shipMoved ?? false,
    pirate: game.pirate ?? OFF_BOARD,
    goldOwed: game.goldOwed ?? [],
    boats: game.boats ?? [],
    hidden: game.hidden ?? game.land.map(() => "unbekannt" as const),
    hiddenChips: game.hiddenChips ?? game.land.map(() => 0),
    sailing: game.sailing ?? null,
    docks: game.docks ?? {},
    camps: game.camps ?? {},
    pirateShip: game.pirateShip ?? null,
    tributes: game.tributes ?? [],
    chased: game.chased ?? [],
    mission: game.mission ?? game.players.map(() => 0),
    catches: game.catches ?? game.players.map(() => 0),
    fish: game.fish ?? {},
    spice: game.spice ?? {},
    villages: game.villages ?? {},
    sacks: game.sacks ?? {},
    spices: game.spices ?? game.players.map(() => 0),
    sold: game.sold ?? 0,
    shoals: game.shoals ?? [],
    shoalsLeft: game.shoalsLeft ?? SHOALS,
    cast: game.cast ?? false,
    council: game.council ?? null,
    presents: game.presents ?? {},
    villagesOf: game.villagesOf ?? {},
    wonders: game.wonders ?? game.players.map(() => null),
    forts: game.forts ?? {},
    marks: game.marks ?? [],
    warships: game.warships ?? [],
    armada: game.armada ?? 0,
    stormed: game.stormed ?? false,
    traders: game.traders ?? {},
    baleStock: game.baleStock ?? CLOTH_SUPPLY,
    lockedShips: game.lockedShips ?? [],
    heldPorts: game.heldPorts ?? game.players.map(() => []),
    robberHome: game.robberHome ?? null,
    fleet: game.fleet ?? null,
    players: game.players.map((player) => ({
      ...player,
      neutral: player.neutral ?? false,
      chips: player.chips ?? 0,
      goods: player.goods ?? NO_GOODS,
      goodsCount: player.goodsCount ?? 0,
      tableau: player.tableau ?? NO_TABLEAU,
      walls: player.walls ?? 0,
      progress: player.progress ?? [],
      victoryChips: player.victoryChips ?? 0,
      fish: player.fish ?? [],
      gold: player.gold ?? 0,
      prisoners: player.prisoners ?? 0,
      wagon: player.wagon ?? null,
      level: player.level ?? 0,
      ware: player.ware ?? null,
      delivered: player.delivered ?? 0,
      moves: player.moves ?? 0,
      boosted: player.boosted ?? false,
      haul: player.haul ?? [],
      shipsLeft: player.shipsLeft ?? SHIPS_EACH,
      homeIslands: player.homeIslands ?? [],
      islandChips: player.islandChips ?? 0,
      boatsLeft: player.boatsLeft ?? BOATS_EACH,
      scoutsLeft: player.scoutsLeft ?? SCOUTS_EACH,
      portsLeft: player.portsLeft ?? PORTS_EACH,
      unitsLeft: player.unitsLeft ?? UNITS_EACH,
      bridgesLeft: player.bridgesLeft ?? BRIDGES_EACH,
      bales: player.bales ?? 0,
    })),
  };
}
