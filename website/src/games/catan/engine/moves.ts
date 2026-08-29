/**
 * The referee.
 *
 * @module
 * @remarks
 * One function decides everything: {@link applyMove} takes a game, the seat
 * trying to move, and the move, and hands back either the game that follows or
 * `null` for "no". Nothing else in the game changes state, so the board, the
 * computer and the online host all obey exactly the same rules.
 *
 * Three readings are worth stating outright, because a table does them at once
 * and a screen cannot:
 *
 * 1. **Discarding after a seven is one seat at a time.** At a table everybody
 *    counts their hand simultaneously; here `owing` is a queue and the game
 *    waits for each in turn. Nothing about the outcome changes, only the order.
 * 2. **An offer is answered one seat at a time**, for the same reason, and the
 *    player whose turn it is then picks which acceptance to take. The rulebook
 *    lets a table haggle freely; a queue of yes-or-no is the shape that fits a
 *    turn-based wire.
 * 3. **The supply is bottomless.** This edition of the rules never mentions
 *    running out of a resource, so the 19 cards per sort are a box constraint
 *    rather than a rule, and they are not modelled.
 *
 * Every line the referee writes to the log names the player and then a colon.
 * The seat you play yourself is called "Du", and "`${name} baut`" comes out as
 * "Du baut"; German conjugates, and the colon form fits a name and a pronoun
 * equally.
 */
import { islandOf } from "./board";
import { createRandom, randomInt, type Random } from "./random";
import {
  EVENT_ASK,
  EVENT_NAMES,
  anybodyHolding,
  buildEventCards,
  eventAsks,
  fromOwnHand,
  poorerThan,
  stackEvents,
  type EventCard,
  type EventKind,
} from "./events";
import {
  BARBARIAN_STEPS,
  EVENT_DIE,
  TRACKS,
  TRACK_NAMES,
  COMMODITIES,
  COMMODITY_NAMES,
  LEVEL_NAMES,
  SIMPLE,
  METRO_LEVEL,
  NO_GOODS,
  TOP_LEVEL,
  TRACK_GOODS,
  drawLimit,
  goodsSize,
  withGood,
  type Commodity,
  type Goods,
  type Knight,
  type Track,
} from "./knights";
import {
  PROGRESS_NAMES,
  isPointCard,
  isRealCard,
  trackOf,
  type HeldCard,
  type Progress,
} from "./progress";
import { shuffle } from "./random";
import {
  KNIGHT_CHIPS,
  SWAP_CARDS,
  canHandKnightIn,
  chipCost,
  chipsForTown,
  neutralSeats,
  owesRoll,
  rollStands,
  strangerAt,
  strangerSeat,
} from "./two";
import {
  BRIDGE_PRICE,
  BUYS_PER_TURN,
  GOLD_FOR_BRIDGE,
  GOLD_PER_BUY,
  bridgeSite,
  goldFor,
  goldTiles,
  rivers,
} from "./fluesse";
import {
  FISH_ACTION_NAMES,
  FISH_COST,
  targetFor,
  MAX_TILES,
  OFF_BOARD,
  OLD_SHOE,
  fishEarned,
  fishing,
  fishingSpots,
  type FishAction,
} from "./fischer";
import {
  EXTRA_STEPS,
  KNIGHT_STEPS,
  LOST_KNIGHT_GOLD,
  LOST_KNIGHT_TWO_CHIP,
  LOST_KNIGHT_TWO_GOLD,
  NO_PRISONER_GOLD,
  STRANGER_ROLL,
  RAID_CARD_NAMES,
  RAID_ROLLS,
  SEVEN,
  VERRAT_GOLD,
  VERRAT_MOVES,
  beaten,
  conquered,
  freeCrossing,
  freePath,
  guardsAt,
  knightsLeft as guardsLeft,
  lieOf,
  overrun,
  raidable,
  raiding,
  rideSpots,
  type RaidCard,
} from "./barbaren";
import {
  CAMP_GOLD,
  SELL_GOLD,
  besideVillage,
  chaseRolls,
  goldSales,
  laneVillage,
  spicing,
  villageSpots,
  type Cargo,
  type Spice,
  FISH_SIDES,
  bigCargo,
  canCast,
  catchSpots,
  fishField,
  landings,
  shoalAt,
  CAMP_UNITS,
  GOLD_YIELD,
  MISSION_STEPS,
  TRIBUTE,
  UNIT_COST,
  besideCamp,
  campAt,
  camping,
  campsFrom,
  chasers,
  HOLD_SMALL,
  holdRoom,
  laneCamp,
  pirateSeas,
  tributeDue,
} from "./entdecker";
import {
  BOAT_COST,
  BOOST_COST,
  DRY_GOLD,
  FIND_RATE,
  FIND_GOLD,
  PORT_COST,
  SCOUT_COST,
  besideUnknown,
  crowded,
  foundingShore,
  boatSpots,
  finding,
  findReward,
  landingSpots,
  laneCosts,
  lanesFrom,
  laneUnknown,
  pointsAt,
  portsOf,
  seaLane,
  unknown as faceDown,
} from "./entdecker";
import {
  CLOTH_LAST_VILLAGES,
  DUNE_MAIN,
  SHIP_COST,
  cloth,
  onClothIsle,
  WONDERS,
  WONDER_STAGES,
  atFort,
  corsairs,
  wonderFree,
  wonderOpen,
  wonderStage,
  wonders,
  onCorsairIsle,
  overrunByPirates,
  dunes,
  fleetRing,
  fortOf,
  shipLine,
  shipSpots,
  tradesOf,
  warshipsOf,
  foggy,
  reachedVillages,
  onTribeIsle,
  tribe,
  fogging,
  mainIsland,
  shores,
  canShip,
  landCrossing,
  landPath,
  looseShips,
  newIsland,
  paysGold,
  pirateSpots,
  pirateTargets,
  sailing,
  seaPath,
  islandAt,
  islandsOf,
} from "./seefahrer";
import {
  DRIVE_OFF,
  GRAIN_MOVE,
  HAUL_CARD_NAMES,
  HAUL_POINT_CARDS,
  MOVE_POINTS,
  REWARD_GOLD,
  TARGET_NAMES,
  WARE_GOES,
  WARE_NAMES,
  depotAt,
  driveSpots,
  edgeBetween,
  facingRaiders,
  hauling,
  raiderSpots,
  siteGate,
  siteShore,
  stepCost,
  stepPrice,
  type Depot,
  type HaulCard,
} from "./handel";
import {
  BALLOT,
  caravanFor,
  caravans,
  chosenSpot,
  loudest,
  roadWeight,
  soleVoice,
  wagonSpots,
  type Vote,
} from "./karawane";
import {
  ACTIVATE_COST,
  FIXED_CHIPS,
  KNIGHT_COST,
  MEDICINE_COST,
  WALL_COST,
  barbarianFight,
  barbariansLanding,
  canChase,
  canImprove,
  canKnight,
  canUpgrade,
  canWall,
  cityCount,
  cityYield,
  freeCityFor,
  hasBenefit,
  improvePrice,
  keepLimit,
  knightReady,
  knightsLeft,
  marchSpots,
  retreatSpots,
  robberLoose,
} from "./ritter";
import { awardHarbourTile, robbable, robberSpots } from "./variants";
import {
  ARMY_MIN,
  actingSeat,
  CITY_COST,
  DEV_COST,
  NO_CARDS,
  OFFER_LIMIT,
  REPAIR_COST,
  RESOURCES,
  ROAD_COST,
  ROUTE_MIN,
  TOWN_COST,
  YIELD,
  covers,
  handSize,
  playing,
  minus,
  plus,
  playingRitter,
  playingTwo,
  pointsOf,
  realSeats,
  seatAfter,
  sharesTurns,
  spread,
  withCard,
  type CatanGame,
  type Land,
  type CatanMove,
  type CatanPlayer,
  type DevKind,
  type Hand,
  type Phase,
  type Resource,
  type Wonder,
} from "./state";

/** How many sides each of the two dice has. */
const DIE_SIDES = 6;

/** What the log calls a landscape, for the barbarian battles. */
const LAND_LOG_NAMES: Readonly<Record<Land, string>> = {
  lehm: "Hügelland",
  holz: "Wald",
  wolle: "Weideland",
  getreide: "Ackerland",
  erz: "Gebirge",
  wueste: "Wüste",
  see: "See",
  sumpf: "Sumpf",
  wasserstelle: "Wasserstelle",
  burg: "Burgfeld",
  ziel: "Zielfeld",
  meer: "Meer",
  gold: "Goldfluss",
  fisch: "Fischfeld",
  gewuerz: "Gewürzfeld",
  unbekannt: "unentdecktes Feld",
};

/** One Getreide, for the two extra steps a knight may ride. */
const GRAIN_COST: Hand = { ...NO_CARDS, getreide: 1 };

/** The roll that wakes the robber. */
const ROBBER_ROLL = 7;

/** What a city takes in, against a settlement's one. */
const CITY_YIELD = 2;

/** What the bank charges without a harbour. */
const BANK_RATE = 4;

/** What the generic harbour charges. */
const ANY_HARBOUR_RATE = 3;

/** What a harbour of the matching sort charges. */
const OWN_HARBOUR_RATE = 2;

/**
 * What a Handelsware costs at the Gilde.
 *
 * @remarks
 * "Ab sofort darfst du Handelswaren im Verhältnis 2:1 tauschen!" - the third
 * step of Handel, and the only rate a Handelsware ever gets below the generic
 * harbour's three.
 */
const WARE_RATE = 2;

/** Roads a Straßenbau card pays for. */
const FREE_ROADS = 2;

/** Cards an Erfindung card fetches. */
const GIFTS = 2;

/** The German name of each resource, for the log. */
const SORT_NAMES: Readonly<Record<Resource, string>> = {
  lehm: "Lehm",
  holz: "Holz",
  wolle: "Wolle",
  getreide: "Getreide",
  erz: "Erz",
};

/** The German name of each development card, for the log. */
const CARD_NAMES: Readonly<Record<DevKind, string>> = {
  ritter: "Ritter",
  siegpunkt: "Siegpunkt",
  monopol: "Monopol",
  strassenbau: "Straßenbau",
  erfindung: "Erfindung",
};

/**
 * Whose move it is.
 *
 * @param game - the game as it stands
 * @returns the seat that has to act, or `null` when the game is over
 *
 * @remarks
 * Usually the player whose turn it is, but not always: a seven puts everybody
 * with a full hand into a queue, and an offer on the table puts everybody who
 * has not answered into one.
 */
export function seatOnTurn(game: CatanGame): number | null {
  let seat: number | null = actingSeat(game);
  if (game.phase === "gameOver") {
    seat = null;
  } else if (game.phase === "event") {
    seat = game.owed[0] ?? actingSeat(game);
  } else if (game.phase === "discard") {
    seat = game.owing[0] ?? actingSeat(game);
  } else if (game.phase === "displaced") {
    // The knight that was driven off is not the attacker's to move.
    seat =
      game.displaced === null
        ? actingSeat(game)
        : (game.garrison[game.displaced]?.owner ?? actingSeat(game));
  } else if (game.phase === "progress" && game.owed.length > 0) {
    // Hochzeit and Handelshafen are answered by the people being asked, in
    // turn - not by the person whose card it is.
    seat = game.owed[0];
  } else if (game.phase === "goldPick") {
    // Everybody at the gold river chooses, one after another.
    seat = goldSeat(game) ?? actingSeat(game);
  } else if (game.phase === "vote" && game.vote !== null) {
    // The voting round asks the whole table, one seat at a time, and then one
    // person to put the wagon down.
    seat =
      game.vote.stage === "place"
        ? game.vote.decider
        : (game.vote.order[game.vote.step] ?? actingSeat(game));
  } else if (game.phase === "neutral" || game.phase === "swap") {
    // Both are the acting player's own business: the free piece is theirs to
    // place and the two cards are theirs to choose.
    seat = actingSeat(game);
  } else if (game.offer !== null) {
    const waiting = game.offer.answers.findIndex((answer) => answer === null);
    seat = waiting === -1 ? actingSeat(game) : waiting;
  }
  return seat;
}

/**
 * Brings every player's public card count back in line with their hand.
 *
 * @remarks
 * Run once on the way out of {@link applyMove}, which is the only door a game
 * ever changes through. Doing it here rather than at each of the dozen places
 * that move a card means the count cannot be forgotten at one of them.
 */
function counted(game: CatanGame): CatanGame {
  return {
    ...game,
    players: game.players.map((player) => ({
      ...player,
      cards: handSize(player.hand),
    })),
  };
}

/**
 * The one move a seat has, when it is the only one it has.
 *
 * @param game - the game as it stands
 * @param seat - the seat asking
 * @returns that move, or `null` when there is a choice to make
 *
 * @remarks
 * Two moments in a game of Catan are not decisions at all. Before the roll,
 * the dice are the only thing on offer unless a development card is waiting to
 * be played - and holding no playable card is the common case, so most turns
 * open with a button whose only purpose is to be pressed. After the roll, a
 * player who took in nothing, holds nothing and has no free road left cannot
 * build, cannot trade with the supply, and cannot even make an offer, because
 * an offer needs a card to put on the table.
 *
 * This says which of the two it is. It deliberately does **not** try to
 * enumerate every legal move and count them: offers alone are an infinite set,
 * and a rule that says "there is nothing to decide" has to be readable to be
 * trusted. Anything short of certain returns `null` and leaves the turn alone.
 */
export function forcedMove(game: CatanGame, seat: number): CatanMove | null {
  const mine = seatOnTurn(game) === seat && actingSeat(game) === seat;
  // A Siegpunkt card is never played, so holding only those is holding none.
  const holdsCard =
    !game.playedDev &&
    game.players[seat].deck.some((card) => card !== "siegpunkt");
  const idle =
    game.offer === null &&
    game.freeRoads === 0 &&
    handSize(game.players[seat].hand) === 0;
  let only: CatanMove | null = null;
  if (
    game.phase === "sailing" &&
    mine &&
    !sailsLeft(game, seat) &&
    game.sailing === null
  ) {
    // Every ship has done what it can: the movement phase is over, and being
    // asked to press a button for that is noise.
    only = { kind: "endTurn" };
  } else if (
    game.phase === "vote" &&
    game.vote?.stage === "lay" &&
    game.vote.order[game.vote.step] === seat &&
    BALLOT.every((sort) => game.players[seat].hand[sort] === 0)
  ) {
    // Nothing to lay is not a decision: a seat holding neither wool nor grain
    // can only pass, and being asked to press a button for it is noise.
    only = { kind: "lay", cards: NO_CARDS };
  } else if (mine && !holdsCard && game.phase === "roll") {
    only = { kind: "roll" };
  } else if (mine && !holdsCard && game.phase === "trade" && idle) {
    only = { kind: "endTurn" };
  }
  return only;
}

/** Adds a line to the log. */
function note(game: CatanGame, line: string): CatanGame {
  return { ...game, log: [...game.log, line] };
}

/** A player's name, for a log line. */
function nameOf(game: CatanGame, seat: number): string {
  return game.players[seat].name;
}

/** Replaces one player. */
function withPlayer(
  game: CatanGame,
  seat: number,
  player: CatanPlayer,
): CatanGame {
  return {
    ...game,
    players: game.players.map((old, at) => (at === seat ? player : old)),
  };
}

/** Moves cards into or out of a hand. */
function withHand(game: CatanGame, seat: number, hand: Hand): CatanGame {
  return withPlayer(game, seat, { ...game.players[seat], hand });
}

/** Spends a cost out of a hand. */
function spend(game: CatanGame, seat: number, cost: Hand): CatanGame {
  return withHand(game, seat, minus(game.players[seat].hand, cost));
}

/** A hand as "2 Holz, 1 Erz". */
function spellOut(hand: Hand): string {
  const parts = RESOURCES.filter((sort) => hand[sort] > 0).map(
    (sort) => `${hand[sort]} ${SORT_NAMES[sort]}`,
  );
  return parts.length === 0 ? "nichts" : parts.join(", ");
}

/**
 * Whether a road may go on a path.
 *
 * @param game - the game as it stands
 * @param seat - who wants to build
 * @param at - the path
 * @returns whether the rules allow it
 *
 * @remarks
 * "Eine Straße darfst du nur an eine Kreuzung anlegen, an die eine deiner
 * eigenen Straßen, Siedlungen oder Städte grenzt und auf der keine fremde
 * Siedlung oder Stadt steht." Both halves matter: a foreign building at a
 * crossing does not merely fail to help, it seals that crossing off, which is
 * how a settlement cuts a rival's route in two.
 */
export function canRoad(game: CatanGame, seat: number, at: number): boolean {
  // "Eine Straße darf nicht auf den Bauplätzen der Brücken - also über einen
  // Fluss - gebaut werden. Dies gilt für das ganze Spiel."
  if (bridgeSite(game, at)) {
    return false;
  }
  // "Auf den Wegen, die an ein erobertes Küstenfeld angrenzen, darfst du keine
  // Straßen bauen."
  if (raiding(game) && !freePath(game, at)) {
    return false;
  }
  // "Auf den 3 Seiten eines Zielfeldes, die an das Meer grenzen, dürfen keine
  // Straßen gebaut werden."
  if (siteShore(game, at)) {
    return false;
  }
  // "Straßen dürfen nicht auf (Meer-)Wegen gebaut werden, die an unentdeckte
  // Sechseckfelder grenzen."
  if (finding(game) && (laneUnknown(game, at) || seaLane(game, at))) {
    return false;
  }
  // "Solange auf einem Landschaftsfeld ein Piratenlager existiert, darf keine
  // Strasse auf den Wegen dieses Feldes gebaut werden."
  if (laneCamp(game, at)) {
    return false;
  }
  // And the same for a village nobody of this colour has befriended yet.
  if (laneVillage(game, seat, at)) {
    return false;
  }
  // At sea a road wants land on one side at least, and a path with a ship on it
  // is taken: "auf Wegen an der Küste entweder 1 Schiff oder 1 Straße".
  if (!landPath(game, at) || game.ships[at] !== null) {
    return false;
  }
  const board = islandOf(game.land.length);
  // "Erst nach der Reparatur darfst du wieder neue Straßen bauen."
  const able = game.players[seat].damaged === null;
  const free = able && game.roads[at] === null && game.players[seat].roads > 0;
  const reaches = board.paths[at].ends.some((end) => {
    const town = game.towns[end];
    const blocked = town !== null && town.owner !== seat;
    const own = town !== null && town.owner === seat;
    const road = board.crossings[end].paths.some(
      (path) =>
        path !== at &&
        game.roads[path] === seat &&
        path !== game.players[seat].damaged,
    );
    return !blocked && (own || road);
  });
  return free && reaches;
}

/**
 * Whether a settlement may go on a crossing.
 *
 * @param game - the game as it stands
 * @param seat - who wants to build
 * @param at - the crossing
 * @param founding - whether this is the founding phase, where no road is needed
 * @returns whether the rules allow it
 */
export function canTown(
  game: CatanGame,
  seat: number,
  at: number,
  founding = false,
): boolean {
  const board = islandOf(game.land.length);
  const free = game.towns[at] === null && game.players[seat].settlements > 0;
  const apart = board.crossings[at].next.every(
    (next) => game.towns[next] === null,
  );
  // "An einer beschädigten Straße darf keine Siedlung gebaut werden": a road
  // lying on its side is no longer the connection a settlement needs.
  const reached =
    founding ||
    board.crossings[at].paths.some(
      (path) =>
        (game.roads[path] === seat && path !== game.players[seat].damaged) ||
        // "Wer mit seiner Schiffslinie, ausgehend von einer eigenen Siedlung,
        // wieder ein Landschaftsfeld erreicht, kann dort eine neue Siedlung
        // gründen."
        game.ships[path] === seat,
    );
  // "... und auf seinen Ecken keine Siedlungen."
  return (
    free &&
    apart &&
    reached &&
    (!raiding(game) || freeCrossing(game, at)) &&
    // "Auf der zentralen Kreuzung des Zielfeldes darf keine Siedlung errichtet
    // werden."
    !siteGate(game, at) &&
    // Nobody settles on open water.
    landCrossing(game, at) &&
    // "Ihr gruendet eure ersten beiden Siedlungen ... auf der grossen Insel":
    // in Zu neuen Ufern the small islands are what the ships are for, and a
    // colour that started on one would have skipped the whole scenario.
    (!founding || (!shores(game) && !dunes(game)) || onMainIsland(game, at)) &&
    // "... Siedlungen nicht auf Kreuzungen, die an unentdeckte Sechseckfelder
    // grenzen", and none on the crossings of a camp's field either.
    // "Auf den kleinen Inseln rundum darf niemals eine Siedlung gegründet
    // werden, sie werfen auch keine Erträge ab."
    !onTribeIsle(game, at) &&
    // "Ihr dürft nur auf markierten Kreuzungen auf den Pirateninseln bauen",
    // and the founding settlements go "auf der östlichen Insel" - so the west
    // is closed except for the one crossing that carries a colour's own chip.
    (!corsairs(game) || !onCorsairIsle(game, at) || game.marks.includes(at)) &&
    (!founding || !corsairs(game) || !onCorsairIsle(game, at)) &&
    // "Auf den 4 kleinen Inseln in der Mitte dürft ihr keine Siedlungen
    // gründen."
    !onClothIsle(game, at) &&
    // Beside a face-down field only when the founding phase has nowhere else
    // to go - see crowded.
    (!besideUnknown(game, at) ||
      (founding && crowded(game, (each) => !besideUnknown(game, each)))) &&
    !besideCamp(game, at) &&
    !besideVillage(game, seat, at)
  );
}

/** Whether a settlement may grow into a city. */
export function canCity(game: CatanGame, seat: number, at: number): boolean {
  const town = game.towns[at];
  return (
    town !== null &&
    town.owner === seat &&
    !town.city &&
    game.players[seat].cities > 0 &&
    // "Siedlungen dürfen nicht zu Städten ausgebaut werden" - at a conquered
    // coast field, and in Entdecker & Piraten never at all.
    !finding(game) &&
    (!raiding(game) || freeCrossing(game, at))
  );
}

/** Every path this seat could put a road on. */
export function roadSpots(game: CatanGame, seat: number): readonly number[] {
  return islandOf(game.land.length)
    .paths.filter((path) => canRoad(game, seat, path.id))
    .map((path) => path.id);
}

/**
 * Every bridge site this seat could build on.
 *
 * @param game - the game
 * @param seat - who is building
 * @returns the free bridge sites their network reaches
 * @remarks
 * Kept beside {@link roadSpots} rather than in the scenario file, because it is
 * the same question the board asks about a road - and a bridge site is
 * deliberately never a road spot.
 */
export function bridgeSpots(game: CatanGame, seat: number): readonly number[] {
  return game.players[seat].bridgesLeft <= 0
    ? []
    : game.rivers.bridges.filter(
        (at) =>
          bridgeSite(game, at) &&
          game.roads[at] === null &&
          touchesNetwork(game, seat, at),
      );
}

/** Every crossing this seat could put a settlement on. */
export function townSpots(
  game: CatanGame,
  seat: number,
  founding = false,
): readonly number[] {
  return islandOf(game.land.length)
    .crossings.filter((crossing) => canTown(game, seat, crossing.id, founding))
    .map((crossing) => crossing.id);
}

/** Every settlement of this seat's that could become a city. */
export function citySpots(game: CatanGame, seat: number): readonly number[] {
  return islandOf(game.land.length)
    .crossings.filter((crossing) => canCity(game, seat, crossing.id))
    .map((crossing) => crossing.id);
}

/**
 * What the bank charges this seat for a sort.
 *
 * @param game - the game as it stands
 * @param seat - who is trading
 * @param sort - the resource being handed over
 * @returns four, three or two
 *
 * @remarks
 * A harbour only counts if the seat has a settlement or a city standing at one
 * of the two crossings it docks at.
 */
export function tradeRate(
  game: CatanGame,
  seat: number,
  sort: Resource | Commodity,
): number {
  // A Handelsware has no harbour of its own - the special ones name a resource
  // - but the generic 3:1 does take it: "Mit einem 3:1-Hafen: 3 Münzen -> 1
  // Tuch". And the Gilde, the third step of Handel, halves it again: "Ab sofort
  // darfst du Handelswaren im Verhältnis 2:1 tauschen!"
  if ((COMMODITIES as readonly string[]).includes(sort)) {
    const board = islandOf(game.land.length);
    const generic = game.harbours.some(
      (harbour) =>
        harbour.want === null &&
        board.paths[harbour.path].ends.some(
          (end) => game.towns[end]?.owner === seat && !overrun(game, end),
        ),
    );
    return hasBenefit(game, seat, "handel")
      ? WARE_RATE
      : generic
        ? ANY_HARBOUR_RATE
        : BANK_RATE;
  }
  // "Es gibt in dieser Erweiterung keine Häfen. Stattdessen könnt ihr generell
  // Rohstoffe im Verhältnis 3:1 mit dem Vorrat tauschen."
  if (finding(game)) {
    return FIND_RATE;
  }
  const board = islandOf(game.land.length);
  return game.harbours.reduce((rate, harbour) => {
    // "Besitzt die Siedlung oder Stadt einen Hafen, darfst du diesen nicht mehr
    // nutzen" - a building on its side is a building that trades with nobody.
    const mine = board.paths[harbour.path].ends.some(
      (end) => game.towns[end]?.owner === seat && !overrun(game, end),
    );
    const price =
      harbour.want === null
        ? ANY_HARBOUR_RATE
        : harbour.want === sort
          ? OWN_HARBOUR_RATE
          : BANK_RATE;
    return mine ? Math.min(rate, price) : rate;
  }, BANK_RATE);
}

/** The harbours this seat has a building at. */
export function ownHarbours(
  game: CatanGame,
  seat: number,
): readonly (Resource | null)[] {
  const board = islandOf(game.land.length);
  return game.harbours
    .filter((harbour) =>
      board.paths[harbour.path].ends.some(
        (end) => game.towns[end]?.owner === seat,
      ),
    )
    .map((harbour) => harbour.want);
}

/**
 * The longest unbroken run of one seat's roads.
 *
 * @param game - the game as it stands
 * @param seat - whose roads to measure
 * @returns how many roads long the run is
 *
 * @remarks
 * A depth-first walk that may use each road once. Two things end a walk: no
 * unused road of this seat's leaving the crossing, and a foreign settlement or
 * city standing on it - "die Strecke darf nicht von einer fremden Siedlung oder
 * Stadt unterbrochen werden". Branches fall out for free, because a walk that
 * turns off has left the other branch behind.
 */
export function longestRoute(game: CatanGame, seat: number): number {
  const board = islandOf(game.land.length);
  // "Bei der Ermittlung der Längsten Handelsroute werden neben den Straßen
  // jetzt auch die Schiffe mitgezählt", and the two only join at a building:
  // "Schiffe gelten mit Straßen nur dann als verbunden, wenn eine Siedlung oder
  // Stadt dazwischensteht." So the walk carries what it last travelled on.
  const kindOf = (path: number): "road" | "ship" | null =>
    game.roads[path] === seat
      ? "road"
      : game.ships[path] === seat
        ? "ship"
        : null;
  const mine = board.paths
    .filter((path) => kindOf(path.id) !== null)
    .map((path) => path.id);
  const used = new Set<number>();
  let best = 0;
  const walk = (
    at: number,
    len: number,
    came: "road" | "ship" | null,
  ): void => {
    best = Math.max(best, len);
    const town = game.towns[at];
    const sealed = town !== null && town.owner !== seat;
    const mineHere = town !== null && town.owner === seat;
    if (!sealed) {
      board.crossings[at].paths.forEach((path) => {
        const kind = kindOf(path);
        const joins = came === null || came === kind || mineHere;
        if (kind !== null && joins && !used.has(path)) {
          used.add(path);
          const [a, b] = board.paths[path].ends;
          // A road with a wagon beside it counts as two - see roadWeight.
          walk(a === at ? b : a, len + roadWeight(game, path), kind);
          used.delete(path);
        }
      });
    }
  };
  mine.forEach((path) => {
    board.paths[path].ends.forEach((end) => walk(end, 0, null));
  });
  return best;
}

/**
 * Hands the two special tiles to whoever has earned them.
 *
 * @remarks
 * Both pass on the same terms: you take the tile by beating what its holder
 * has, not by tying it. The route tile also has to be given up when a rival
 * settlement cuts the holder's own run below five, which is why the holder's
 * length is remeasured first rather than remembered.
 */
function awardTiles(game: CatanGame): CatanGame {
  const lengths = game.players.map((unused, seat) => longestRoute(game, seat));
  const holder =
    game.longest !== null && lengths[game.longest] >= ROUTE_MIN
      ? game.longest
      : null;
  const beat = holder === null ? ROUTE_MIN - 1 : lengths[holder];
  const best = Math.max(...lengths);
  const leaders = lengths.reduce<number[]>(
    (list, len, seat) => (len === best ? [...list, seat] : list),
    [],
  );
  const route = best > beat && leaders.length === 1 ? leaders[0] : holder;

  const knights = game.players.map((player) => player.knights);
  const most = game.army === null ? ARMY_MIN - 1 : knights[game.army];
  const risen = knights.reduce<number | null>(
    (found, count, seat) => (count > most && found === null ? seat : found),
    null,
  );
  return goldTilesOf(
    awardHarbourTile({
      ...game,
      longest: route,
      longestLen: route === null ? 0 : lengths[route],
      army: risen ?? game.army,
    }),
  );
}

/**
 * Ends the game if whoever is acting has reached the target.
 *
 * @remarks
 * "Als 'an der Reihe' gelten hier beide, die in diesem Zug einen Stein vor sich
 * haben. Sollten beide im selben Spielzug die 10 Punkte erreichen, hat sofort
 * gewonnen, wer Stein 1 vor sich stehen hat." Checking the *acting* seat is
 * exactly that rule: Stein 1 acts first and wins the moment it gets there, so
 * Stein 2 never comes round.
 */
/**
 * Whether this seat may already win.
 *
 * @param game - the game
 * @param seat - whose points have just changed
 * @returns whether the scenario lets the points end it
 * @remarks
 * "Wer zuerst die Piratenfestung erobert **und** 10 Siegpunkte besitzt,
 * gewinnt" - the points alone are not enough in Die Pirateninseln.
 */
function mayWin(game: CatanGame, seat: number): boolean {
  return !corsairs(game) || fortOf(game, seat) === null;
}

function checkWinner(game: CatanGame): CatanGame {
  // "Oder sobald sich nur noch in 3 Dörfern Stoffballen-Chips befinden, endet
  // das Spiel. Es gewinnt, wer am meisten Siegpunkte erreicht hat."
  if (game.winner === null && clothRunOut(game)) {
    const won = clothWinner(game);
    return note(
      { ...game, phase: "gameOver", winner: won, offer: null },
      `${nameOf(game, won)}: gewinnt - in nur noch ${CLOTH_LAST_VILLAGES} Dörfern liegen Stoffballen.`,
    );
  }
  const seat = actingSeat(game);
  // targetFor rather than game.target: the Alter Schuh moves the finish line
  // for whoever is holding it, and only for them.
  const done =
    game.phase !== "founding" &&
    // Once, and only once: a conquest pays several seats one after the other,
    // and each of those steps used to announce the same winner again.
    game.winner === null &&
    mayWin(game, seat) &&
    (wonders(game)
      ? wonderWon(game, seat)
      : pointsOf(game, seat) >= targetFor(game, seat));
  return done
    ? note(
        { ...game, phase: "gameOver", winner: seat, offer: null },
        `${nameOf(game, seat)}: gewinnt mit ${pointsOf(game, seat)} Siegpunkten!`,
      )
    : game;
}

/** One payment out of one landscape to one seat. */
type Taking = {
  readonly seat: number;
  readonly sort: Resource;
  readonly count: number;
  /** The Handelsware a city adds, in Städte & Ritter only. */
  readonly commodity: Commodity | null;
};

/** What one landscape pays a seat for one building. */
function payout(game: CatanGame, hex: number): readonly Taking[] {
  const sort = YIELD[game.land[hex]];
  const takings: Taking[] = [];
  // "Es gibt nun keine Erträge mehr für diese Landschaft, wenn ihre Zahl
  // gewürfelt wird." The chip is turned over, and a turned chip pays nobody.
  if (
    sort !== null &&
    hex !== game.robber &&
    !conquered(game, hex) &&
    !faceDown(game, hex)
  ) {
    islandOf(game.land.length).hexes[hex].corners.forEach((corner) => {
      const town = game.towns[corner];
      // "Für die Siedlungen in den neutralen Farben werden keine Erträge
      // ausgeschüttet." They stand on the board and take up the crossing; they
      // do not earn.
      // "Ab jetzt erhältst du die Erträge ... für diese Siedlung" - not before
      // the fortress on it has fallen.
      if (
        town !== null &&
        !game.players[town.owner].neutral &&
        !overrunByPirates(game, corner)
      ) {
        // A city on Wald, Weideland or Gebirge pays one resource **and** one
        // Handelsware rather than two of the resource. Everywhere else, and in
        // the printed game, a city pays double as before.
        const city = town.city && playingRitter(game) ? cityYield(sort) : null;
        takings.push({
          seat: town.owner,
          sort,
          count: town.city ? (city?.resource ?? CITY_YIELD) : 1,
          commodity: town.city ? (city?.commodity ?? null) : null,
        });
      }
    });
  }
  return takings;
}

/**
 * Pays out every landscape carrying the rolled number.
 *
 * @param plague - whether a Seuche is on, which pays a city like a settlement
 */
function produce(game: CatanGame, rolled: number, plague = false): CatanGame {
  const hands = game.players.map((player) => player.hand);
  const goods = game.players.map((player) => player.goods);
  islandOf(game.land.length).hexes.forEach((hex) => {
    if (game.chips[hex.id] === rolled) {
      payout(game, hex.id).forEach((take) => {
        hands[take.seat] = withCard(
          hands[take.seat],
          take.sort,
          plague ? 1 : take.count,
        );
        // The Handelsware half of a city's yield. A Seuche cuts a yield to one
        // card, and the one card it leaves is the resource - the card the
        // rulebook's own wording keeps.
        if (take.commodity !== null && !plague) {
          goods[take.seat] = withGood(goods[take.seat], take.commodity);
        }
      });
    }
  });
  // A Goldfluss pays nothing by itself: it owes everybody at it a card of their
  // own choosing, and those choices are asked for one at a time.
  const owed = game.players.map(() => 0);
  islandOf(game.land.length).hexes.forEach((hex) => {
    if (
      game.chips[hex.id] === rolled &&
      paysGold(game, hex.id) &&
      hex.id !== game.robber
    ) {
      goldOwedBy(game, hex.id).forEach((count, seat) => {
        owed[seat] += plague ? Math.min(count, 1) : count;
      });
    }
  });
  // "Wird die Zahl eines Zahlenchips eines Goldflussfelds gewuerfelt, erhalten
  // alle Personen fuer jede ihrer Siedlungen oder Hafensiedlungen an diesem
  // Goldflussfeld 2 Gold."
  const purses = game.players.map(() => 0);
  if (camping(game)) {
    islandOf(game.land.length).hexes.forEach((hex) => {
      if (game.chips[hex.id] === rolled && game.land[hex.id] === "gold") {
        hex.corners.forEach((corner) => {
          const town = game.towns[corner];
          if (town !== null) {
            purses[town.owner] += GOLD_YIELD;
          }
        });
      }
    });
  }
  // "Wird eine Zahl gewürfelt, für die du keine Rohstoffe erhältst, bekommst du
  // als Ausgleich 1 Gold aus dem Vorrat. Dies gilt nicht, wenn eine '7'
  // gewürfelt wird." A seven never reaches this function, so the exception is
  // kept by where it is asked rather than by a condition.
  const dry = finding(game)
    ? game.players.map((player, seat) =>
        handSize(hands[seat]) === handSize(player.hand) ? DRY_GOLD : 0,
      )
    : game.players.map(() => 0);
  // "Ab sofort darfst du dir einen beliebigen Rohstoff nehmen, wenn du in der
  // Ertragsphase leer ausgehst! Ausnahme: '7' gewürfelt." That is the Aquädukt,
  // the third step of Wissenschaft - and it is asked for the same way a
  // Goldfluss asks, because it is the same question: which card do you want.
  // The seven never reaches this function, so its exception keeps itself.
  game.players.forEach((player, seat) => {
    const nothing =
      handSize(hands[seat]) === handSize(player.hand) &&
      goodsSize(goods[seat]) === goodsSize(player.goods);
    if (nothing && hasBenefit(game, seat, "wissenschaft")) {
      owed[seat] += 1;
    }
  });
  const paid: CatanGame = {
    ...game,
    players: game.players.map((player, seat) => ({
      ...player,
      hand: hands[seat],
      goods: goods[seat],
      gold: player.gold + dry[seat] + purses[seat],
    })),
  };
  return owed.some((count) => count > 0)
    ? { ...paid, goldOwed: owed, phase: "goldPick" }
    : paid;
}

/** Where a turn goes once the robber has finished its business. */
function afterRobber(game: CatanGame): CatanGame {
  const settled = { ...game, targets: [] };
  return game.dice === null
    ? { ...settled, phase: "roll" }
    : afterYield(settled);
}

/**
 * Hands a seat some Handelschips.
 *
 * @param game - the game
 * @param seat - who earns them
 * @param count - how many, possibly none
 * @returns the game with the chips added
 */
function withChips(game: CatanGame, seat: number, count: number): CatanGame {
  return count === 0
    ? game
    : withPlayer(game, seat, {
        ...game.players[seat],
        chips: game.players[seat].chips + count,
      });
}

/**
 * Puts the free neutral piece on the turn's bill.
 *
 * @param game - the game, with the real piece already built
 * @param seat - who built it
 * @param kind - what they built, which is what they owe
 * @returns the game, waiting for the neutral placement if one is owed
 * @remarks
 * "Baust du eine Straße oder Siedlung, baust du ebenfalls (kostenlos) 1 Straße
 * bzw. Siedlung in einer beliebigen der beiden neutralen Farben." Not for a
 * city and not for a development card, which the rulebook says in the same
 * breath - and not for the neutral colours themselves, or placing one would
 * owe another for ever.
 *
 * "Kann bei beiden Farben keine Siedlung gebaut werden, baust du stattdessen
 * eine Straße", and if even that is impossible the debt simply lapses: a rule
 * that cannot be carried out is not a rule that stops the game.
 */
function owedNeutral(
  game: CatanGame,
  seat: number,
  kind: "town" | "road",
): CatanGame {
  let next = game;
  if (
    playingTwo(game) &&
    !game.players[seat].neutral &&
    game.phase !== "gameOver" &&
    // Not during the founding phase. The rulebook counts the board once it is
    // over - "insgesamt 6 Siedlungen und 4 Straßen" - which is the two neutral
    // ones from the setup plus two each, and no free extras.
    game.founding === null
  ) {
    const wanted =
      kind === "town" && neutralSpots(game, "town").length === 0
        ? "road"
        : kind;
    next =
      neutralSpots(game, wanted).length === 0
        ? game
        : { ...game, phase: "neutral", neutralBuild: wanted };
  }
  return next;
}

/**
 * Where a free neutral piece could go.
 *
 * @param game - the game
 * @param kind - a settlement or a road
 * @returns one entry per colour and place that would be legal
 * @remarks
 * A neutral **settlement** needs no road of its own to hang off - the rulebook
 * only ever cites the Abstandsregel for it, and the two that start on the board
 * arrive with no roads at all. A neutral **road** is an ordinary road and has
 * to connect to that colour's network, which is what "anlegen" means in the
 * worked example.
 */
export function neutralSpots(
  game: CatanGame,
  kind: "town" | "road",
): readonly { readonly seat: number; readonly at: number }[] {
  const board = islandOf(game.land.length);
  const spots: { seat: number; at: number }[] = [];
  neutralSeats(game).forEach((seat) => {
    if (kind === "town") {
      if (game.players[seat].settlements > 0) {
        board.crossings.forEach((crossing) => {
          if (canTown(game, seat, crossing.id, true)) {
            spots.push({ seat, at: crossing.id });
          }
        });
      }
    } else if (game.players[seat].roads > 0) {
      board.paths.forEach((path) => {
        if (canRoad(game, seat, path.id)) {
          spots.push({ seat, at: path.id });
        }
      });
    }
  });
  return spots;
}

/** Puts the free neutral piece down and lets the turn go on. */
function doNeutral(
  game: CatanGame,
  at: number,
  colour: number,
): CatanGame | null {
  const kind = game.neutralBuild;
  const allowed =
    kind !== null &&
    neutralSpots(game, kind).some(
      (spot) => spot.seat === colour && spot.at === at,
    );
  let next: CatanGame | null = null;
  if (allowed) {
    const player = game.players[colour];
    const placed =
      kind === "town"
        ? withPlayer(
            {
              ...game,
              towns: game.towns.map((town, crossing) =>
                crossing === at ? { owner: colour, city: false } : town,
              ),
            },
            colour,
            { ...player, settlements: player.settlements - 1 },
          )
        : withPlayer(
            {
              ...game,
              roads: game.roads.map((owner, path) =>
                path === at ? colour : owner,
              ),
            },
            colour,
            { ...player, roads: player.roads - 1 },
          );
    // The neutral colours can take the Längste Handelsroute off a player, so
    // the tiles are re-awarded here exactly as after anybody else's road.
    next = awardTiles(
      note(
        { ...placed, phase: "trade" as Phase, neutralBuild: null },
        `${nameOf(game, colour)}: ${kind === "town" ? "Siedlung" : "Straße"} gesetzt.`,
      ),
    );
  }
  return next;
}

/**
 * A Handelschip action.
 *
 * @param game - the game
 * @param seat - who is acting
 * @param action - Zwangshandel, or the robber to the desert
 * @returns the game after it, or null if it is not allowed
 * @remarks
 * "In deinem Spielzug (auch **vor dem Würfeln**) darfst du 1 der folgenden 2
 * Aktionen durchführen" - so this is legal in the rolling phase as well as the
 * building one, which is why it is not gated on `rolled` like the rest.
 */
function doChip(
  game: CatanGame,
  seat: number,
  action: "swap" | "robber" | "barbarian",
): CatanGame | null {
  const price = chipCost(game, seat);
  const other = realSeats(game).find((at) => at !== seat);
  let next: CatanGame | null = null;
  if (
    playingTwo(game) &&
    game.players[seat].chips >= price &&
    other !== undefined &&
    // *Der Barbarenüberfall* has no robber, and every other table has no
    // barbarians: the two actions never stand side by side.
    (action !== "robber" || !raiding(game)) &&
    (action !== "barbarian" || canShiftBarbarian(game))
  ) {
    const paid = withPlayer(game, seat, {
      ...game.players[seat],
      chips: game.players[seat].chips - price,
    });
    next =
      action === "robber"
        ? chipRobber(paid, seat)
        : action === "barbarian"
          ? askBarbarians(paid, 1, 1)
          : chipSwap(paid, seat, other);
  }
  return next;
}

/**
 * Whether a Handelschip could move a barbarian right now.
 *
 * @param game - the game
 * @returns true when there is one to take and somewhere to put it
 * @remarks
 * "Da es keinen Räuber gibt, darf man mit 1 Handelschip ... einen Barbaren auf
 * ein anderes Küstenfeld versetzen." The chip is only spent when the move can
 * actually be made, and only in the building phase: taking and putting is a
 * little phase of its own, and it comes back to the table rather than to a roll
 * that has not happened yet.
 */
export function canShiftBarbarian(game: CatanGame): boolean {
  return (
    raiding(game) &&
    game.phase === "trade" &&
    takeSpots(game).length > 0 &&
    putSpots(game).length > 0
  );
}

/**
 * The robber action: straight to the desert, and nobody is robbed.
 *
 * @remarks
 * "Du darfst den Räuber auf die Wüste setzen. Auch wenn die gegnerische Person
 * eine Siedlung oder Stadt an der Wüste hat, darfst du keine Karte bei ihr
 * ziehen." So it is a way to get the robber **off** something of yours, not a
 * way to rob - which is why it does not go through the ordinary robber code at
 * all.
 */
function chipRobber(game: CatanGame, seat: number): CatanGame {
  const desert = game.land.findIndex((kind) => kind === "wueste");
  return desert < 0
    ? game
    : note(
        { ...game, robber: desert },
        `${nameOf(game, seat)}: setzt den Räuber mit einem Handelschip in die Wüste.`,
      );
}

/**
 * Zwangshandel: pull two cards blind, then hand two back.
 *
 * @remarks
 * "Du darfst 2 Karten aus der Hand der anderen Person ziehen. Dafür musst du
 * ihr 2 beliebige Karten zurückgeben. Hat die andere Person nur 1 Karte, ziehst
 * du diese, musst aber trotzdem 2 Karten zurückgeben." The pull is blind and so
 * happens here; the two going back are a choice and wait in the `swap` phase.
 *
 * Somebody who ends up with fewer than two cards of their own still owes two -
 * and having just been handed one or two, they always have them.
 */
function chipSwap(game: CatanGame, seat: number, other: number): CatanGame {
  const random = createRandom(game.seed);
  let pulled = game;
  let taken = 0;
  for (let card = 0; card < SWAP_CARDS; card++) {
    const cards = spread(pulled.players[other].hand);
    if (cards.length > 0) {
      const sort = cards[randomInt(random, cards.length)];
      pulled = withHand(
        withHand(pulled, other, withCard(pulled.players[other].hand, sort, -1)),
        seat,
        withCard(pulled.players[seat].hand, sort),
      );
      taken += 1;
    }
  }
  return note(
    { ...pulled, seed: random.state(), phase: "swap", swapWith: other },
    `${nameOf(game, seat)}: Zwangshandel - ${taken} Karte(n) gezogen.`,
  );
}

/**
 * Handing the two cards back that a Zwangshandel owes.
 *
 * @remarks
 * Two of anything the puller holds, their choice. If they hold fewer than two
 * in total - possible only if the other player was nearly empty too - they hand
 * over what they have, because a debt that cannot be paid must not stop the
 * turn.
 */
function doGiveBack(
  game: CatanGame,
  seat: number,
  cards: Hand,
): CatanGame | null {
  const owed = Math.min(SWAP_CARDS, handSize(game.players[seat].hand));
  const other = game.swapWith;
  let next: CatanGame | null = null;
  if (
    game.phase === "swap" &&
    other !== null &&
    handSize(cards) === owed &&
    covers(game.players[seat].hand, cards)
  ) {
    const moved = withHand(
      withHand(game, seat, minus(game.players[seat].hand, cards)),
      other,
      plus(game.players[other].hand, cards),
    );
    next = note(
      // Back to whichever phase the turn was interrupted in. Asking "has a
      // roll been made" was wrong: a Zwangshandel **between** the two rolls
      // then returned to the building phase and swallowed the second one.
      { ...moved, phase: owesRoll(game) ? "roll" : "trade", swapWith: null },
      `${nameOf(game, seat)}: gibt ${owed} Karte(n) zurück.`,
    );
  }
  return next;
}

/**
 * Handing a played knight back in for two Handelschips.
 *
 * @remarks
 * The Größte Rittermacht is not adjusted by hand afterwards. The rulebook
 * spells out at length when it changes - and every one of those cases is just
 * "award it again from the counts", which {@link awardTiles} already does.
 */
function doKnightIn(game: CatanGame, seat: number): CatanGame | null {
  return canHandKnightIn(game, seat)
    ? awardTiles(
        note(
          withChips(
            withPlayer({ ...game, knightGiven: true }, seat, {
              ...game.players[seat],
              knights: game.players[seat].knights - 1,
            }),
            seat,
            KNIGHT_CHIPS,
          ),
          `${nameOf(game, seat)}: gibt einen Ritter für ${KNIGHT_CHIPS} Handelschips ab.`,
        ),
      )
    : null;
}

/**
 * Puts the robber down and works out who can be robbed.
 *
 * @remarks
 * Only players with a building at that landscape and a card in hand, and never
 * the player moving it. No one to rob is a perfectly ordinary outcome - the
 * robber is often moved to block a number rather than to steal.
 */
function placeRobber(game: CatanGame, seat: number, at: number): CatanGame {
  const moved = note(
    { ...game, robber: at },
    `${nameOf(game, seat)}: setzt den Räuber auf ${landName(game, at)}.`,
  );
  const targets = islandOf(game.land.length).hexes[at].corners.reduce<number[]>(
    (list, corner) => {
      const town = moved.towns[corner];
      const worth =
        town !== null &&
        town.owner !== seat &&
        robbable(moved, town.owner) &&
        handSize(moved.players[town.owner].hand) > 0;
      return worth && !list.includes(town.owner) ? [...list, town.owner] : list;
    },
    [],
  );
  let next = moved;
  if (game.playing === "steuern") {
    // Steuern does not rob one person: it takes a card from **everybody** at
    // the new landscape, so the ordinary steal step is skipped entirely.
    next = done(taxAt(moved, seat));
  } else if (targets.length === 0) {
    next = afterRobber(moved);
  } else if (targets.length === 1) {
    next = afterRobber(rob(moved, seat, targets[0]));
  } else {
    next = { ...moved, phase: "steal", targets };
  }
  return next;
}

/** Takes one card at random out of a hand. */
function rob(game: CatanGame, thief: number, victim: number): CatanGame {
  // "Anschließend ziehst du eine verdeckte Karte aus der Kartenhand dieser
  // Person": in Städte & Ritter that hand holds Handelswaren too - they are
  // dealt into it and they count towards the seven, so they can be drawn out of
  // it as well. Without them a seat holding nothing but Papier und Tuch was
  // safe from the robber, and an event asking somebody to draw a card could
  // find no one to ask at all.
  const cards = spread(game.players[victim].hand);
  const goods = playingRitter(game)
    ? COMMODITIES.flatMap((sort) =>
        Array.from(
          { length: game.players[victim].goods[sort] },
          () => sort as Commodity,
        ),
      )
    : [];
  const pool: readonly (Resource | Commodity)[] = [...cards, ...goods];
  if (pool.length === 0) {
    return game;
  }
  const random = createRandom(game.seed);
  const taken = pool[randomInt(random, pool.length)];
  const ware = (COMMODITIES as readonly string[]).includes(taken);
  const moved = ware
    ? withPlayer(
        withPlayer(game, victim, {
          ...game.players[victim],
          goods: withGood(game.players[victim].goods, taken as Commodity, -1),
        }),
        thief,
        {
          ...game.players[thief],
          goods: withGood(game.players[thief].goods, taken as Commodity),
        },
      )
    : withHand(
        withHand(
          game,
          victim,
          withCard(game.players[victim].hand, taken as Resource, -1),
        ),
        thief,
        withCard(game.players[thief].hand, taken as Resource),
      );
  return note(
    { ...moved, seed: random.state() },
    `${nameOf(game, thief)}: zieht eine Karte von ${nameOf(game, victim)}.`,
  );
}

/** What a landscape is called, for the log. */
function landName(game: CatanGame, hex: number): string {
  const sort = YIELD[game.land[hex]];
  const chip = game.chips[hex] === 0 ? "" : ` ${game.chips[hex]}`;
  return sort === null ? "die Wüste" : `${SORT_NAMES[sort]}${chip}`;
}

/**
 * Hands the turn on.
 *
 * @remarks
 * On a three- or four-handed table that simply means the next seat. From five
 * players up a Spielzug has **two halves**: whoever holds Stein 1 rolls and
 * plays a full turn, then whoever holds Stein 2 gets a reduced one, and only
 * then do both stones pass one seat to the left.
 *
 * The dice are deliberately *not* cleared between the halves. Stein 2 does not
 * roll - the roll that fed the whole table was Stein 1's, and it stays on
 * screen because it is still the roll this Spielzug ran on.
 */
function nextTurn(game: CatanGame): CatanGame {
  const acting = actingSeat(game);
  const rested = game.players.map((player, at) =>
    at === acting
      ? { ...player, deck: [...player.deck, ...player.fresh], fresh: [] }
      : player,
  );
  const half = sharesTurns(game) && game.stone === 1;
  const carried = {
    ...game,
    players: rested,
    offer: null,
    owing: [],
    targets: [],
    freeRoads: 0,
    gifts: 0,
    // Each of the two acting players gets their own one-card-a-turn and their
    // own allowance of offers: two people, two turns' worth of decisions.
    playedDev: false,
    offers: 0,
    // The card is off the table once its Spielzug is over; the next one turns
    // over a fresh one.
    drawn: half ? game.drawn : null,
  };
  return half
    ? { ...carried, stone: 2, phase: "trade" }
    : {
        ...carried,
        active: seatAfter(game, game.active),
        stone: 1,
        phase: "roll",
        dice: null,
        // A fresh turn owes its rolls again, and the "must differ" only ever
        // holds within one turn.
        rolls: 0,
        firstRoll: null,
        knightGiven: false,
        goldBuys: 0,
        built: false,
        ridden: [],
        shoved: [],
        stormed: false,
        cast: false,
        sold: 0,
        tributes: [],
        chased: [],
        freshShips: [],
        shipMoved: false,
        // A knight roused last turn is ready now, and one that acted may act
        // again. Cleared for **everybody**, because a knight is roused on its
        // owner's turn and used on the same owner's next one.
        garrison: game.garrison.map((knight) =>
          knight === null ? null : { ...knight, fresh: false, spent: false },
        ),
        // Both last only for the turn that played them.
        crane: null,
        fleet: null,
        turn: game.turn + 1,
      };
}

/** Rolls both dice. */
function throwDice(random: Random): readonly [number, number] {
  return [randomInt(random, DIE_SIDES) + 1, randomInt(random, DIE_SIDES) + 1];
}

/** How many cards a seat has to lay down after a seven. */
export function discardCount(game: CatanGame, seat: number): number {
  // Both hands. "Handelswaren werden auf die Hand genommen und zählen mit,
  // wenn eine '7' gewürfelt wird." And the limit itself moves with the city
  // walls - see keepLimit.
  const held =
    handSize(game.players[seat].hand) + goodsSize(game.players[seat].goods);
  const limit = keepLimit(game, seat);
  return held > limit ? Math.floor(held / 2) : 0;
}

/** Puts a seven into motion: hands over the limit, then the robber. */
function seven(game: CatanGame): CatanGame {
  const owing = game.players.reduce<number[]>(
    (list, unused, seat) =>
      discardCount(game, seat) > 0 ? [...list, seat] : list,
    [],
  );
  // "Bei einer gewürfelten '7' wird bis dahin nur geprüft, ob jemand von euch
  // zu viele Karten auf der Hand hält. Der Räuber bleibt auf der Steinhalbinsel
  // stehen und niemand zieht eine Karte." So the discard still happens; only
  // the robber half of a seven is held back.
  // "Würfelst du eine '7', ziehst du einen Rohstoff (kein Gold) von einer
  // beliebigen anderen Person. Auch wenn der Räuber nicht mitspielt, gilt nach
  // wie vor die Regel, dass du ... die Hälfte deiner Rohstoffe abgeben musst."
  if (sailing(game) && owing.length === 0) {
    return seaSeven(game);
  }
  // "Es wird ohne Räuber gespielt. Beim Wurf einer '7' verliert jede Person,
  // die mehr als 7 Rohstoffkarten besitzt, die Hälfte ihrer Rohstoffe." That is
  // the whole of a seven here - scenario 1 has no Piratenschiff either.
  if (finding(game)) {
    // Scenario 2 adds the one thing a seven still does here: "befindet sich
    // dein Piratenschiff bereits auf dem Spielfeld, versetzt du es auf ein
    // anderes erlaubtes Meerfeld."
    // No open water yet means nowhere for a pirate ship to go: early on every
    // sea field of this board is still face down.
    const after: Phase =
      camping(game) && pirateSeas(game).length > 0 ? "corsair" : "trade";
    return owing.length === 0
      ? { ...game, phase: after }
      : { ...game, phase: "discard", owing };
  }
  // "Es gibt keinen Räuber. Wird eine '7' gewürfelt, müssen alle die Hälfte
  // ihrer Karten abgeben, die mehr als 7 Rohstoffkarten besitzen. Anschließend
  // darf die Person, die gewürfelt hat, bei einer beliebigen Person 1 Karte
  // stehlen."
  if (corsairs(game)) {
    const holders = anybodyHolding(game, actingSeat(game));
    return owing.length === 0
      ? {
          ...game,
          phase: holders.length > 0 ? "steal" : "trade",
          targets: holders,
        }
      : { ...game, phase: "discard", owing };
  }
  const targets = raiding(game) ? anybodyHolding(game, actingSeat(game)) : [];
  // Nobody to draw from is not a phase: the seven simply passes.
  const after: Phase = raiding(game)
    ? targets.length > 0
      ? "steal"
      : "trade"
    : robberLoose(game)
      ? "robber"
      : "trade";
  return owing.length === 0
    ? { ...game, phase: after, targets }
    : { ...game, phase: "discard", owing };
}

/** Rolls the dice and pays out, or wakes the robber. */
function doRoll(game: CatanGame): CatanGame {
  let next: CatanGame;
  if (playing(game, "ereignisse")) {
    // "Statt zu würfeln, deckt ihr eine Ereigniskarte auf": the card takes the
    // place of the **number**, and of nothing else. In Städte & Ritter the roll
    // carries a second job - the event die, which sails the barbarian ship and
    // hands out the Fortschrittskarten - and a variant that quietly switched
    // that off would take two of that game's three engines with it: a
    // self-played table sat at thirteen of fourteen points with every track
    // maxed, every piece built and a barbarian ship that had never moved.
    // So the die is rolled first and the card turned over after, in the order
    // the rulebook gives the three dice.
    const random = createRandom(game.seed);
    const before = playingRitter(game) ? eventDieStep(game, random) : game;
    next = drawEvent(before);
  } else {
    // In CATAN für Zwei the second roll may not repeat the first, and a repeat
    // is thrown away rather than reported: "wird er wiederholt - so lange, bis
    // zwei verschiedene Ergebnisse vorliegen." Bounded by the loop condition
    // itself, which can only spin while a result is being rejected.
    const random = createRandom(game.seed);
    let dice = throwDice(random);
    while (!rollStands(game, dice[0] + dice[1])) {
      dice = throwDice(random);
    }
    const rolled = dice[0] + dice[1];
    const thrown = note(
      {
        ...game,
        seed: random.state(),
        dice,
        rolls: game.rolls + 1,
        firstRoll: game.rolls === 0 ? rolled : game.firstRoll,
      },
      `${nameOf(game, actingSeat(game))}: würfelt ${rolled}.`,
    );
    // "Würfle mit allen 3 Würfeln und handle die einzelnen Ergebnisse... in
    // folgender Reihenfolge nacheinander ab" - the event die first, the yield
    // second. Not a detail: the barbarians land before the income, so a city
    // lost to them earns nothing that turn.
    const after = playingRitter(thrown) ? eventDieStep(thrown, random) : thrown;
    // The villages of Stoffe für Catan pay on their own number, and a seven is
    // not their business: they are no landscapes and no robber stands on them.
    const paid = payVillages(sailArmada(after, dice), rolled);
    next =
      rolled === ROBBER_ROLL
        ? seven(paid)
        : afterYield(fishOut(produce(paid, rolled), rolled));
  }
  return next;
}

/**
 * The barbarians are beaten, and somebody is thanked for it.
 *
 * @param game - the game
 * @param fight - the strengths, and who contributed what
 * @returns the game with the reward handed out
 * @remarks
 * "Hat eine Person **alleine** die meisten Fähnchenspitzen zum Sieg
 * beigesteuert, erhält sie 1 Siegpunkt-Chip. Haben zwei oder mehr Personen die
 * gleiche Anzahl beigesteuert, dürfen sich alle beteiligten Personen die
 * oberste Karte von einem beliebigen der Fortschrittskartenstapel ziehen.
 * Siegpunkt-Chips werden nicht vergeben." So a tie is not "nobody wins" - it is
 * a different prize, and one everybody tied gets.
 */
function barbariansBeaten(
  game: CatanGame,
  fight: ReturnType<typeof barbarianFight>,
): CatanGame {
  const best = Math.max(...fight.bySeat);
  const leaders = fight.bySeat
    .map((score, seat) => (score === best && best > 0 ? seat : -1))
    .filter((seat) => seat >= 0);
  let next = game;
  if (leaders.length === 1) {
    const seat = leaders[0];
    next = note(
      withPlayer(game, seat, {
        ...game.players[seat],
        victoryChips: game.players[seat].victoryChips + 1,
      }),
      `${nameOf(game, seat)}: führt die Verteidigung an und bekommt 1 Siegpunkt-Chip.`,
    );
  } else if (leaders.length > 1) {
    // Everybody tied draws, and they choose which deck - so it waits for them.
    next = note(
      { ...game, drawing: leaders },
      "Gleichstand bei der Verteidigung: alle Beteiligten ziehen eine Fortschrittskarte.",
    );
  }
  return next;
}

/**
 * The barbarians win, and the least defended cities burn.
 *
 * @param game - the game
 * @param fight - the strengths, and who contributed what
 * @returns the game with a city turned back into a settlement per loser
 * @remarks
 * "Überfallen werden nur diejenigen von euch, die eine oder mehrere Städte
 * besitzen... Die Person, die am wenigsten Fähnchenspitzen eingesetzt hat, muss
 * eine ihrer Städte in eine Siedlung umwandeln. Haben mehrere gleich wenig
 * beigesteuert, verlieren **alle**." And if the poorest defender has nothing to
 * lose, it moves on to the next poorest - which is why this walks the scores in
 * order rather than taking the minimum once.
 *
 * Metropolen sind immer geschützt, and a wall goes with the city it stood on.
 */
function citiesSacked(
  game: CatanGame,
  fight: ReturnType<typeof barbarianFight>,
): CatanGame {
  const canLose = (state: CatanGame, seat: number): boolean =>
    sackableCity(state, seat) !== null;
  const ordered = [
    ...new Set(fight.bySeat.filter((unused, seat) => canLose(game, seat))),
  ].sort((one, other) => one - other);
  let next = game;
  for (const score of ordered) {
    const hit = fight.bySeat
      .map((each, seat) => (each === score && canLose(next, seat) ? seat : -1))
      .filter((seat) => seat >= 0);
    if (hit.length > 0) {
      for (const seat of hit) {
        next = sackOne(next, seat);
      }
      break;
    }
  }
  return next;
}

/**
 * A city this seat could lose to the barbarians.
 *
 * @param game - the game
 * @param seat - whose city
 * @returns the crossing, or null when there is nothing to take
 * @remarks
 * Metropolen are never taken, so a seat whose only city carries one is as safe
 * as a seat with no cities at all.
 */
function sackableCity(game: CatanGame, seat: number): number | null {
  const metros = TRACKS.map((track) => game.metro[track])
    .filter((metro) => metro !== null)
    .map((metro) => metro.at);
  const at = game.towns.findIndex(
    (town, crossing) =>
      town !== null &&
      town.owner === seat &&
      town.city &&
      !metros.includes(crossing),
  );
  return at < 0 ? null : at;
}

/** Turns one city back into a settlement, and takes its wall with it. */
function sackOne(game: CatanGame, seat: number): CatanGame {
  const at = sackableCity(game, seat);
  let next = game;
  if (at !== null) {
    const player = game.players[seat];
    // "Wird eine Stadt mit Stadtmauer zur Siedlung reduziert, geht auch die
    // Stadtmauer verloren." Walls are counted rather than placed, so the count
    // comes down only while it would otherwise exceed the cities left.
    const cities = cityCount(game, seat) - 1;
    next = note(
      withPlayer(
        {
          ...game,
          towns: game.towns.map((town, crossing) =>
            crossing === at ? { owner: seat, city: false } : town,
          ),
        },
        seat,
        {
          ...player,
          cities: player.cities + 1,
          settlements: Math.max(0, player.settlements - 1),
          walls: Math.min(player.walls, cities),
        },
      ),
      `${nameOf(game, seat)}: verliert eine Stadt an die Barbaren.`,
    );
  }
  return next;
}

/**
 * Everybody who may draw a Fortschrittskarte on this roll.
 *
 * @param game - the game
 * @param track - the symbol the event die showed
 * @param red - what the red die showed
 * @returns the game with the draws made
 * @remarks
 * "Erfüllen mehrere von euch die Bedingungen? Dann dürfen alle... jeweils im
 * Uhrzeigersinn die oberste Fortschrittskarte vom Stapel ziehen, beginnend bei
 * der Person, die gewürfelt hat." The order matters when a deck is short, so
 * the seats are walked from the roller round the table rather than 0 upwards.
 */
function openDraw(game: CatanGame, track: Track, red: number): CatanGame {
  let next = game;
  const order = realSeats(game);
  const from = order.indexOf(actingSeat(game));
  for (let step = 0; step < order.length; step++) {
    const seat = order[(Math.max(0, from) + step) % order.length];
    if (red <= drawLimit(next.players[seat].tableau[track])) {
      next = drawCard(next, seat, track);
    }
  }
  return next;
}

/**
 * Takes the top card of one deck and gives it to a seat.
 *
 * @param game - the game
 * @param seat - who draws
 * @param track - which deck
 * @returns the game with the card moved
 * @remarks
 * A victory-point card is laid face up the moment it is drawn and never goes
 * back; every other card sits face down until it is played. Both live in the
 * same list, and {@link isPointCard} is what tells them apart.
 */
function drawCard(game: CatanGame, seat: number, track: Track): CatanGame {
  const deck = game.decks[track];
  let next = game;
  const card = deck[0];
  // A back can only be here in a redacted snapshot, which the referee never
  // works from - but the type says it could be, and saying "then nothing
  // happens" is cheaper than pretending it cannot.
  if (card !== undefined && isRealCard(card)) {
    next = note(
      withPlayer(
        { ...game, decks: { ...game.decks, [track]: deck.slice(1) } },
        seat,
        {
          ...game.players[seat],
          progress: [...game.players[seat].progress, card],
        },
      ),
      `${nameOf(game, seat)}: zieht eine Fortschrittskarte (${TRACK_NAMES[track]}).`,
    );
  }
  return next;
}

/**
 * Städte & Ritter: the event die, thrown and handled before the income.
 *
 * @param game - the game, with the two number dice already thrown
 * @param random - the generator, so the throw stays reproducible
 * @returns the game after the ship has moved or the decks have been drawn from
 * @remarks
 * Two outcomes and nothing else. A ship moves the barbarians one space closer
 * and, on the last one, lands them. Any other face is one of the three tracks,
 * and everybody who has built far enough in **that** track compares the red die
 * against their own level.
 */
function eventDieStep(game: CatanGame, random: Random): CatanGame {
  const face = EVENT_DIE[randomInt(random, EVENT_DIE.length)];
  const red = randomInt(random, DIE_SIDES) + 1;
  const shown: CatanGame = {
    ...game,
    seed: random.state(),
    eventDie: face,
    redDie: red,
  };
  return face === "schiff" ? sailBarbarians(shown) : openDraw(shown, face, red);
}

/**
 * Moves the barbarian ship, and fights it when it arrives.
 *
 * @param game - the game
 * @returns the game one space on, or after the raid
 */
function sailBarbarians(game: CatanGame): CatanGame {
  const moved = { ...game, barbarian: game.barbarian + 1 };
  return barbariansLanding(moved)
    ? raid(moved)
    : note(
        moved,
        `Das Barbarenschiff rückt vor (${moved.barbarian}/${BARBARIAN_STEPS}).`,
      );
}

/**
 * The barbarian raid, and everything it settles.
 *
 * @param game - the game, with the ship on the last space
 * @returns the game with the raid resolved and the ship back at the start
 * @remarks
 * The whole of "Das Heer der Barbaren bekämpfen" in one place, because it is
 * one moment: strengths compared, the loss or the reward handed out, every
 * knight stood down, the ship sent back, and - the first time only - the robber
 * let off its stone peninsula.
 */
function raid(game: CatanGame): CatanGame {
  const fight = barbarianFight(game);
  const won = fight.defence >= fight.attack;
  const told = note(
    game,
    `Die Barbaren landen: Ritter ${fight.defence} gegen Städte ${fight.attack}.`,
  );
  const settled = won
    ? barbariansBeaten(told, fight)
    : citiesSacked(told, fight);
  // "Nach dem Überfall müsst ihr alle eure aktivierten Ritter deaktivieren.
  // Setzt anschließend das Barbarenschiff wieder auf sein Startfeld zurück."
  return {
    ...settled,
    barbarian: 0,
    landed: true,
    garrison: settled.garrison.map((knight) =>
      knight === null ? null : { ...knight, active: false, fresh: false },
    ),
  };
}

/**
 * Where the turn goes once a roll has paid out.
 *
 * @param game - the game, with the income already handed out
 * @returns the game in whichever phase comes next
 * @remarks
 * The one place the two-handed turn differs in shape: it rolls again instead of
 * going on to build. Everywhere else a roll leads straight into the trading
 * phase, and this keeps that single answer in a single place.
 */
function afterYield(game: CatanGame): CatanGame {
  // A Goldfluss owes somebody a choice, and that comes before anything else -
  // otherwise the phase set here would quietly swallow the whole payout.
  return game.goldOwed.some((count) => count > 0)
    ? { ...game, phase: "goldPick" }
    : { ...game, phase: owesRoll(game) ? "roll" : "trade" };
}

/**
 * Turns the top event card over.
 *
 * @remarks
 * "Wer an der Reihe ist, deckt die oberste Karte des Stapels auf, anstatt zu
 * würfeln." The Jahreswechsel card is not a turn of its own: it rebuilds the
 * deck and a new card comes off it straight away, which is why this loops.
 */
function drawEvent(game: CatanGame): CatanGame {
  let deck = game.events;
  let card: EventCard | undefined = deck[0];
  let next = game;
  let guard = 0;
  while (card !== undefined && card.kind === "jahreswechsel" && guard < 2) {
    guard += 1;
    const random = createRandom(next.seed);
    deck = stackEvents(shuffle(random, buildEventCards()));
    next = note(
      { ...next, seed: random.state() },
      `${nameOf(next, next.active)}: Jahreswechsel - der Stapel wird neu gemischt.`,
    );
    card = deck[0];
  }
  return card === undefined
    ? next
    : startEvent({ ...next, events: deck.slice(1) }, card);
}

/** What an event does before anybody is asked anything. */
function openEvent(game: CatanGame, kind: EventKind): CatanGame {
  // "Stellt den Räuber sofort zurück auf die Wüste. Es wird bei niemandem
  // eine Handkarte gezogen."
  return kind === "rueckzug"
    ? { ...game, robber: game.land.indexOf("wueste") }
    : game;
}

/** Lays an event card out and works out who has to answer it. */
function startEvent(game: CatanGame, card: EventCard): CatanGame {
  const shown = note(
    openEvent({ ...game, drawn: card }, card.kind),
    `${nameOf(game, game.active)}: ${EVENT_NAMES[card.kind]}${
      card.number === null ? "" : ` (${card.number})`
    }.`,
  );
  // Only seats that could actually answer: "Kein Ritter frei - die Karte
  // verfällt" is the shape every ask in this game has, and an ask that waits
  // for an answer nobody can give waits for ever.
  const asks = eventAsks(shown, card.kind).filter((seat) =>
    canAnswer(shown, seat, card.kind),
  );
  let next: CatanGame;
  if (card.kind === "raeuberueberfall") {
    next = seven({ ...shown, after: null });
  } else if (asks.length > 0) {
    next = { ...shown, phase: "event", owed: asks, after: card.number };
  } else {
    next = closeEvent({ ...shown, owed: [], after: card.number });
  }
  return next;
}

/** Pays out the card's number once the event itself is done with. */
function closeEvent(game: CatanGame): CatanGame {
  const passed = handOn(game);
  const number = passed.after;
  const plague = passed.drawn?.kind === "seuche";
  return {
    ...(number === null ? passed : produce(passed, number, plague)),
    phase: "trade",
    owed: [],
    after: null,
    given: passed.players.map(() => null),
  };
}

/**
 * Moves every Gute Nachbarschaft card at once.
 *
 * @remarks
 * Buffered rather than passed one at a time, so nobody can hand on a card they
 * were given a moment ago - at a table this all happens together.
 */
function handOn(game: CatanGame): CatanGame {
  const moving = game.given.some((sort) => sort !== null);
  let next = game;
  if (moving) {
    const hands = game.players.map((player) => player.hand);
    game.given.forEach((sort, seat) => {
      if (sort !== null) {
        const left = (seat + 1) % game.players.length;
        hands[seat] = withCard(hands[seat], sort, -1);
        hands[left] = withCard(hands[left], sort);
      }
    });
    next = note(
      {
        ...game,
        players: game.players.map((player, at) => ({
          ...player,
          hand: hands[at],
        })),
      },
      "Gute Nachbarschaft: alle geben 1 Karte nach links.",
    );
  }
  return next;
}

/** Answers the card, for one seat. */
function doEvent(
  game: CatanGame,
  seat: number,
  move: CatanMove,
): CatanGame | null {
  const kind = game.drawn?.kind;
  const ask = kind === undefined ? null : EVENT_ASK[kind];
  let next: CatanGame | null = null;
  if (move.kind === "event" && kind !== undefined && ask !== null) {
    const answers: Readonly<Record<string, () => CatanGame | null>> = {
      sort: () => takeSort(game, seat, kind, move.sort),
      road: () => breakRoad(game, seat, move.at),
      victim: () =>
        move.seat === undefined ? null : drawFrom(game, seat, move.seat),
      gift: () => giveAway(game, seat, move.sort, move.seat),
    };
    const answered = answers[ask]();
    next = answered === null ? null : stepOn(answered, seat);
  }
  return next;
}

/** Drops a seat off the queue, and closes the card when the last one is in. */
function stepOn(game: CatanGame, seat: number): CatanGame {
  const kind = game.drawn?.kind;
  // Asked again after every answer: the answer itself can take the last card
  // out of somebody's hand, and then the next seat has nothing to draw either.
  const rest = game.owed.filter(
    (at) => at !== seat && (kind === undefined || canAnswer(game, at, kind)),
  );
  return rest.length === 0
    ? closeEvent({ ...game, owed: [] })
    : { ...game, owed: rest };
}

/**
 * Whether this seat could answer the card in front of it.
 *
 * @param game - the game
 * @param seat - the seat being asked
 * @param kind - the event card
 * @returns whether any answer to it exists
 * @remarks
 * Each of the four asks needs something: a card in one's own hand, a road on
 * the board, somebody holding a card to draw from, or both a card and somebody
 * poorer to give it to. Where that something is missing the card does nothing -
 * which is what every other ask in this game does too, rather than waiting.
 */
function canAnswer(game: CatanGame, seat: number, kind: EventKind): boolean {
  const ask = EVENT_ASK[kind];
  const holds = handSize(game.players[seat].hand) > 0;
  return ask === null
    ? false
    : ask === "sort"
      ? !fromOwnHand(kind) || holds
      : ask === "road"
        ? game.roads.some((owner) => owner === seat)
        : ask === "victim"
          ? anybodyHolding(game, seat).length > 0
          : holds && poorerThan(game, seat).length > 0;
}

/** Naming a resource - out of the supply, or out of your own hand. */
function takeSort(
  game: CatanGame,
  seat: number,
  kind: EventKind,
  sort: Resource | undefined,
): CatanGame | null {
  const own = fromOwnHand(kind);
  const held = sort !== undefined && game.players[seat].hand[sort] > 0;
  let next: CatanGame | null = null;
  if (sort !== undefined && (!own || held)) {
    next = own
      ? {
          ...game,
          given: game.given.map((old, at) => (at === seat ? sort : old)),
        }
      : note(
          withHand(game, seat, withCard(game.players[seat].hand, sort)),
          `${nameOf(game, seat)}: nimmt 1 ${SORT_NAMES[sort]} aus dem Vorrat.`,
        );
  }
  return next;
}

/** Turning one of your own roads sideways. */
function breakRoad(
  game: CatanGame,
  seat: number,
  at: number | undefined,
): CatanGame | null {
  const mine = at !== undefined && game.roads[at] === seat;
  return mine
    ? note(
        withPlayer(game, seat, { ...game.players[seat], damaged: at }),
        `${nameOf(game, seat)}: eine Straße muss repariert werden.`,
      )
    : null;
}

/** Drawing one card at random from somebody at the table. */
function drawFrom(
  game: CatanGame,
  seat: number,
  victim: number,
): CatanGame | null {
  return anybodyHolding(game, seat).includes(victim)
    ? rob(game, seat, victim)
    : null;
}

/** Handing one of your cards to somebody with fewer points. */
function giveAway(
  game: CatanGame,
  seat: number,
  sort: Resource | undefined,
  to: number | undefined,
): CatanGame | null {
  const holds = sort !== undefined && game.players[seat].hand[sort] > 0;
  const allowed = to !== undefined && poorerThan(game, seat).includes(to);
  return holds && allowed && sort !== undefined && to !== undefined
    ? note(
        withHand(
          withHand(game, seat, withCard(game.players[seat].hand, sort, -1)),
          to,
          withCard(game.players[to].hand, sort),
        ),
        `${nameOf(game, seat)}: schenkt ${nameOf(game, to)} 1 ${SORT_NAMES[sort]}.`,
      )
    : null;
}

/** Putting a damaged road back up. */
function doRepair(game: CatanGame, seat: number): CatanGame | null {
  const player = game.players[seat];
  const allowed = player.damaged !== null && covers(player.hand, REPAIR_COST);
  return allowed
    ? note(
        spend(
          withPlayer(game, seat, { ...player, damaged: null }),
          seat,
          REPAIR_COST,
        ),
        `${nameOf(game, seat)}: repariert eine Straße.`,
      )
    : null;
}

/** Lays cards down after a seven, and moves the queue on. */
function doDiscard(
  game: CatanGame,
  seat: number,
  cards: Hand,
  goods: Goods = NO_GOODS,
): CatanGame | null {
  const owed = discardCount(game, seat);
  const player = game.players[seat];
  const ok =
    handSize(cards) + goodsSize(goods) === owed &&
    covers(player.hand, cards) &&
    COMMODITIES.every((sort) => player.goods[sort] >= goods[sort]);
  const rest = game.owing.filter((at) => at !== seat);
  // The robber is still nailed down until the barbarians have landed once, and
  // in the barbarian scenario it never walks at all - there a seven only steals.
  const drawFrom = raiding(game) ? anybodyHolding(game, actingSeat(game)) : [];
  const after: Phase = raiding(game)
    ? drawFrom.length > 0
      ? "steal"
      : "trade"
    : finding(game)
      ? camping(game) && pirateSeas(game).length > 0
        ? "corsair"
        : "trade"
      : robberLoose(game)
        ? "robber"
        : "trade";
  const finished = rest.length === 0;
  const laid = ok
    ? note(
        {
          ...withPlayer(game, seat, {
            ...player,
            hand: minus(player.hand, cards),
            goods: COMMODITIES.reduce(
              (left, sort) => withGood(left, sort, -goods[sort]),
              player.goods,
            ),
          }),
          owing: rest,
          phase: finished ? after : "discard",
          targets: raiding(game) && finished ? drawFrom : game.targets,
        },
        `${nameOf(game, seat)}: legt ${owed} Karten ab.`,
      )
    : null;
  // A seven with no robber still shifts a barbarian in the hauling scenario,
  // and at sea it offers the choice of the two figures - both once the last
  // hand has been laid down.
  return laid === null || !finished
    ? laid
    : hauling(game)
      ? haulSeven(laid)
      : sailing(game)
        ? seaSeven(laid)
        : laid;
}

/** Builds a road, either for free or for its cost. */
function doRoad(game: CatanGame, seat: number, at: number): CatanGame | null {
  const founding = game.phase === "founding";
  const free = founding || game.freeRoads > 0;
  const paid = free || covers(game.players[seat].hand, ROAD_COST);
  const placed =
    founding &&
    game.founding !== null &&
    game.founding.placing === "road" &&
    game.founding.lastTown !== null
      ? islandOf(game.land.length).paths[at].ends.includes(
          game.founding.lastTown,
        ) &&
        game.roads[at] === null &&
        // Water, even at the founding: a river is crossed by a bridge or not
        // at all, and there are no bridges to be had before the first turn.
        !bridgeSite(game, at)
      : canRoad(game, seat, at);
  let next: CatanGame | null = null;
  if (placed && paid) {
    const player = game.players[seat];
    const built = withPlayer(
      {
        ...game,
        roads: game.roads.map((owner, path) => (path === at ? seat : owner)),
        freeRoads: free && !founding ? game.freeRoads - 1 : game.freeRoads,
      },
      seat,
      { ...player, roads: player.roads - 1 },
    );
    const charged = withGold(
      free ? built : spend(built, seat, ROAD_COST),
      seat,
      goldFor(game, "road", at),
    );
    next = owedNeutral(
      checkWinner(
        awardTiles(
          liftFog(
            note(charged, `${nameOf(game, seat)}: baut eine Straße.`),
            seat,
            at,
          ),
        ),
      ),
      seat,
      "road",
    );
  }
  return next;
}

/** Builds a settlement, in the founding phase or the building phase. */
function doTown(game: CatanGame, seat: number, at: number): CatanGame | null {
  const founding = game.phase === "founding";
  const allowed =
    canTown(game, seat, at, founding) &&
    (founding
      ? game.founding?.placing === "town"
      : covers(game.players[seat].hand, TOWN_COST));
  let next: CatanGame | null = null;
  if (allowed) {
    const player = game.players[seat];
    const built = withPlayer(
      {
        ...game,
        towns: game.towns.map((town, crossing) =>
          crossing === at ? { owner: seat, city: false } : town,
        ),
      },
      seat,
      { ...player, settlements: player.settlements - 1 },
    );
    // "Für die jeweils erste Siedlung, die du auf einer fremden Insel baust,
    // erhältst du 1 Siegpunkt-Chip zusätzlich." Asked of `game` rather than of
    // `built`, because the settlement now standing there is the one being asked
    // about - and never in the founding phase, where the islands being settled
    // are the home ones by definition.
    const settled =
      !founding && newIsland(game, seat, at)
        ? note(
            withPlayer(built, seat, {
              ...built.players[seat],
              islandChips: built.players[seat].islandChips + 1,
            }),
            `${nameOf(game, seat)}: siedelt zum ersten Mal auf einer fremden Insel (+1).`,
          )
        : built;
    const charged = founding ? settled : spend(settled, seat, TOWN_COST);
    const paidChips = withGold(
      withChips(charged, seat, chipsForTown(charged, at)),
      seat,
      // "Baust du deine Siedlung zu einer Stadt aus, erhältst du kein Gold."
      // Only a settlement pays, which is what this branch builds.
      goldFor(game, "town", at),
    );
    next = owedNeutral(
      checkWinner(
        awardTiles(
          // A harbour won as a gift and kept for want of a coast goes up as
          // soon as there is one: "bewahrst du ihn auf, bis du eine
          // Küstensiedlung baust, die noch keinen Hafen hat".
          layHeldPorts(
            note(
              founding ? paidChips : afterBuilding(withBuilt(paidChips), seat),
              `${nameOf(game, seat)}: baut eine Siedlung.`,
            ),
            seat,
          ),
        ),
      ),
      seat,
      "town",
    );
  }
  return next;
}

/** Grows a settlement into a city. */
function doCity(game: CatanGame, seat: number, at: number): CatanGame | null {
  const allowed =
    canCity(game, seat, at) && covers(game.players[seat].hand, CITY_COST);
  let next: CatanGame | null = null;
  if (allowed) {
    const player = game.players[seat];
    const built = withPlayer(
      {
        ...game,
        towns: game.towns.map((town, crossing) =>
          crossing === at ? { owner: seat, city: true } : town,
        ),
      },
      seat,
      {
        ...player,
        settlements: player.settlements + 1,
        cities: player.cities - 1,
      },
    );
    // Through awardTiles, which a city needs as much as a road does: it cannot
    // change the longest route, but it doubles a harbour point, and *Die Häfen
    // von Catan* hands out a tile for those.
    next = checkWinner(
      awardTiles(
        note(
          afterBuilding(withBuilt(spend(built, seat, CITY_COST)), seat),
          `${nameOf(game, seat)}: baut eine Stadt.`,
        ),
      ),
    );
  }
  return next;
}

/** Buys the top development card. */
function doBuy(game: CatanGame, seat: number): CatanGame | null {
  if (raiding(game)) {
    return drawRaidCard(game, seat);
  }
  if (hauling(game)) {
    return drawHaulCard(game, seat);
  }
  // "Es gibt keine Entwicklungskarten" - the very first line of what Entdecker
  // & Piraten takes away.
  if (finding(game)) {
    return null;
  }
  const allowed =
    game.stack.length > 0 && covers(game.players[seat].hand, DEV_COST);
  let next: CatanGame | null = null;
  if (allowed) {
    const card = game.stack[0];
    const player = game.players[seat];
    const bought = withPlayer({ ...game, stack: game.stack.slice(1) }, seat, {
      ...player,
      fresh: [...player.fresh, card],
    });
    next = checkWinner(
      note(
        spend(bought, seat, DEV_COST),
        `${nameOf(game, seat)}: kauft eine Entwicklungskarte.`,
      ),
    );
  }
  return next;
}

/**
 * Plays a development card.
 *
 * @remarks
 * Three guards, all from page 10: only one card a turn, never one bought this
 * turn - which is what `fresh` keeps separate from `deck` - and the Siegpunkt
 * cards are never played at all, they simply count.
 *
 * *Die Pirateninseln* turns both of those last two on their head: "Siegpunkt-
 * karten und Ritter aus dem Entwicklungskartenstapel bekommen in diesem
 * Szenario eine neue Funktion und können nicht als Siegpunkte bzw. Ritter
 * gespielt werden" - each of them arms one ship instead. So a Siegpunktkarte
 * **is** played there, and it stops being a point the moment it is; and a
 * knight played there is not a knight, so it counts for no Größte Rittermacht.
 */
function doPlay(
  game: CatanGame,
  seat: number,
  card: DevKind,
): CatanGame | null {
  const player = game.players[seat];
  const holds = player.deck.includes(card);
  const allowed =
    holds && !game.playedDev && (card !== "siegpunkt" || corsairs(game));
  let next: CatanGame | null = null;
  if (allowed) {
    const at = player.deck.indexOf(card);
    const played = note(
      withPlayer({ ...game, playedDev: true }, seat, {
        ...player,
        deck: player.deck.filter((unused, index) => index !== at),
        knights:
          player.knights + (card === "ritter" && !corsairs(game) ? 1 : 0),
      }),
      `${nameOf(game, seat)}: spielt ${CARD_NAMES[card]}.`,
    );
    next = checkWinner(awardTiles(startCard(played, card, seat)));
  }
  return next;
}

/** What each development card sets in motion. */
function startCard(game: CatanGame, card: DevKind, seat: number): CatanGame {
  const effects: Readonly<Record<DevKind, () => CatanGame>> = {
    // "Siegpunktkarten und Ritter aus dem Entwicklungskartenstapel bekommen in
    // diesem Szenario eine neue Funktion und können nicht als Siegpunkte bzw.
    // Ritter gespielt werden": in Die Pirateninseln a knight card arms a ship,
    // and there is no robber to move at all.
    ritter: () =>
      corsairs(game) ? armShip(game, seat) : { ...game, phase: "robber" },
    strassenbau: () => ({ ...game, freeRoads: FREE_ROADS }),
    monopol: () => ({ ...game, phase: "monopol" }),
    erfindung: () => ({ ...game, phase: "erfindung", gifts: GIFTS }),
    // "Deckst du eine Ritterkarte (im Spiel zu viert auch Siegpunktkarte) auf,
    // darfst du jeweils das hinterste 'normale' Schiff deiner Schiffslinie in
    // ein Kriegsschiff umwandeln." The rulebook names the table of four,
    // because that is the table this scenario is printed for - and the reason
    // is the same at every other one: the stack is the only source of warships
    // there is, and "ist der Stapel mit den Entwicklungskarten leer, können
    // keine neuen Entwicklungskarten mehr gekauft werden". Without the second
    // half a fortress can stand for ever behind a line of one warship.
    siegpunkt: () => (corsairs(game) ? armShip(game, seat) : game),
  };
  return effects[card]();
}

/** Answers a Monopol or an Erfindung card. */
function doChoose(
  game: CatanGame,
  seat: number,
  sort: Resource,
): CatanGame | null {
  let next: CatanGame | null = null;
  if (game.phase === "monopol") {
    const taken = game.players.reduce(
      (sum, player, at) => (at === seat ? sum : sum + player.hand[sort]),
      0,
    );
    const stripped = game.players.map((player, at) =>
      at === seat
        ? { ...player, hand: withCard(player.hand, sort, taken) }
        : { ...player, hand: withCard(player.hand, sort, -player.hand[sort]) },
    );
    next = note(
      { ...game, players: stripped, phase: "trade" },
      `${nameOf(game, seat)}: nimmt ${taken} ${SORT_NAMES[sort]} ein.`,
    );
  } else if (game.phase === "erfindung" && game.gifts > 0) {
    const left = game.gifts - 1;
    next = withHand(
      { ...game, gifts: left, phase: left === 0 ? "trade" : "erfindung" },
      seat,
      withCard(game.players[seat].hand, sort),
    );
    next = note(
      next,
      `${nameOf(game, seat)}: nimmt 1 ${SORT_NAMES[sort]} aus dem Vorrat.`,
    );
  }
  return next;
}

/** Trades with the bank or a harbour. */
function doBank(
  game: CatanGame,
  seat: number,
  give: Resource | Commodity,
  want: Resource | Commodity,
): CatanGame | null {
  const player = game.players[seat];
  const ware = (sort: Resource | Commodity): boolean =>
    (COMMODITIES as readonly string[]).includes(sort);
  // Handelswaren only exist in Städte & Ritter; anywhere else the two sides can
  // only be resources.
  if ((ware(give) || ware(want)) && !playingRitter(game)) {
    return null;
  }
  const rate = tradeRate(game, seat, give);
  const held = ware(give)
    ? player.goods[give as Commodity]
    : player.hand[give as Resource];
  if (give === want || held < rate) {
    return null;
  }
  const paid = ware(give)
    ? withPlayer(game, seat, {
        ...player,
        goods: withGood(player.goods, give as Commodity, -rate),
      })
    : withHand(game, seat, withCard(player.hand, give as Resource, -rate));
  const taken = ware(want)
    ? withPlayer(paid, seat, {
        ...paid.players[seat],
        goods: withGood(paid.players[seat].goods, want as Commodity),
      })
    : withHand(paid, seat, withCard(paid.players[seat].hand, want as Resource));
  const name = (sort: Resource | Commodity): string =>
    ware(sort)
      ? COMMODITY_NAMES[sort as Commodity]
      : SORT_NAMES[sort as Resource];
  return note(
    taken,
    `${nameOf(game, seat)}: tauscht ${rate} ${name(give)} gegen 1 ${name(want)}.`,
  );
}

/** Puts an offer on the table. */
function doOffer(
  game: CatanGame,
  seat: number,
  give: Hand,
  want: Hand,
): CatanGame | null {
  const sane =
    game.offers < OFFER_LIMIT &&
    handSize(give) > 0 &&
    handSize(want) > 0 &&
    covers(game.players[seat].hand, give) &&
    RESOURCES.every((sort) => give[sort] === 0 || want[sort] === 0);
  return sane
    ? note(
        {
          ...game,
          offers: game.offers + 1,
          offer: {
            from: seat,
            give,
            want,
            answers: game.players.map((unused, at) =>
              at === seat ? false : null,
            ),
          },
        },
        `${nameOf(game, seat)}: bietet ${spellOut(give)} für ${spellOut(want)}.`,
      )
    : null;
}

/** Says yes or no to an offer. */
function doAnswer(
  game: CatanGame,
  seat: number,
  yes: boolean,
): CatanGame | null {
  const offer = game.offer;
  let next: CatanGame | null = null;
  if (offer !== null && offer.answers[seat] === null) {
    const able = yes && covers(game.players[seat].hand, offer.want);
    const answers = offer.answers.map((old, at) => (at === seat ? able : old));
    const anyone = answers.some((answer) => answer === true);
    const open = answers.some((answer) => answer === null);
    next =
      !open && !anyone
        ? note(
            { ...game, offer: null },
            `${nameOf(game, offer.from)}: findet keinen Abnehmer.`,
          )
        : { ...game, offer: { ...offer, answers } };
  }
  return next;
}

/** Closes an offer with one of the players who accepted. */
function doDeal(
  game: CatanGame,
  seat: number,
  other: number,
): CatanGame | null {
  const offer = game.offer;
  const allowed =
    offer !== null &&
    offer.from === seat &&
    offer.answers[other] === true &&
    covers(game.players[other].hand, offer.want) &&
    covers(game.players[seat].hand, offer.give);
  let next: CatanGame | null = null;
  if (allowed && offer !== null) {
    const mine = plus(minus(game.players[seat].hand, offer.give), offer.want);
    const theirs = plus(
      minus(game.players[other].hand, offer.want),
      offer.give,
    );
    next = note(
      { ...withHand(withHand(game, seat, mine), other, theirs), offer: null },
      `${nameOf(game, seat)}: handelt mit ${nameOf(game, other)}.`,
    );
  }
  return next;
}

/** Moves the founding phase on by one step. */
function foundingOn(game: CatanGame): CatanGame {
  const founding = game.founding;
  let next = game;
  if (founding !== null) {
    const step = founding.step + 1;
    const done = step >= founding.order.length;
    next = done
      ? homeIslands({
          ...game,
          founding: null,
          phase: "roll",
          active: founding.order[0],
          turn: 1,
        })
      : {
          ...game,
          founding: { ...founding, step, placing: "town", lastTown: null },
          active: founding.order[step],
        };
  }
  return next;
}

/**
 * Writes down which islands everybody started on.
 *
 * @param game - the game, at the end of the founding phase
 * @returns the game with each seat's home islands recorded
 * @remarks
 * "Zu Beginn habt ihr also alle eine oder zwei Heimatinseln. Die anderen Inseln
 * sind fremde Inseln." Settled once, here, because the islands themselves never
 * change afterwards and a seat's own two founding settlements must not pay it
 * the foreign-island point.
 */
function homeIslands(game: CatanGame): CatanGame {
  if (!sailing(game)) {
    return game;
  }
  const islands = islandsOf(game);
  const home = game.players.map(() => new Set<number>());
  game.towns.forEach((town, at) => {
    const island = town === null ? null : islandAt(game, islands, at);
    if (town !== null && island !== null) {
      home[town.owner].add(island);
    }
  });
  return {
    ...game,
    players: game.players.map((player, seat) => ({
      ...player,
      homeIslands: [...home[seat]],
    })),
  };
}

/** The first income, taken for the second settlement only. */
function firstIncome(game: CatanGame, seat: number, at: number): CatanGame {
  const gained = islandOf(game.land.length).crossings[at].hexes.reduce(
    (hand, hex) => {
      const sort = YIELD[game.land[hex]];
      return sort === null ? hand : withCard(hand, sort);
    },
    game.players[seat].hand,
  );
  return note(
    withHand(game, seat, gained),
    `${nameOf(game, seat)}: erhält die ersten Rohstoffe.`,
  );
}

/** Places one of the two founding settlements and its road. */
function doFounding(
  game: CatanGame,
  seat: number,
  move: CatanMove,
): CatanGame | null {
  const founding = game.founding;
  let next: CatanGame | null = null;
  if (
    founding !== null &&
    move.kind === "town" &&
    founding.placing === "town"
  ) {
    const built = doTown(game, seat, move.at);
    // The last round of the founding phase - the second everywhere, the third
    // in Stoffe für Catan: "für eure 3. Siedlung erhaltet ihr die
    // Startrohstoffe".
    const second =
      founding.step >= founding.order.length - realSeats(game).length;
    // "Statt der zweiten Siedlung setzen alle eine Stadt ein." The opening
    // income is unchanged by it: "nehmt euch nun für jedes Landschaftsfeld, das
    // an eure Stadt grenzt, **einen** entsprechenden Rohstoff" - one card per
    // landscape, exactly as a settlement would have paid.
    // "Jede Person gründet zunächst eine Siedlung und dann eine Stadt." Städte
    // & Ritter says the same thing, so both take the same branch.
    const raised =
      built !== null &&
      second &&
      (playingRitter(game) || raiding(game) || hauling(game))
        ? cityAt(built, seat, move.at)
        : built;
    // "Hat eine Person ihre Stadt gegründet, stellt sie ihren Trosswagen neben
    // die Stadt."
    const wagoned =
      raised !== null && second && hauling(game)
        ? withPlayer(raised, seat, {
            ...raised.players[seat],
            wagon: move.at,
          })
        : raised;
    next =
      wagoned === null
        ? null
        : {
            // "Baust du in der Gründungsphase deine zweite Siedlung an einem
            // Fischgrund/dem See, erhältst du sofort 1 Fischplättchen."
            ...(second
              ? foundingFish(firstIncome(wagoned, seat, move.at), seat, move.at)
              : wagoned),
            founding: { ...founding, placing: "road", lastTown: move.at },
          };
    // The barbarian scenario founds with buildings only - no starting roads at
    // all - so its founding step is over as soon as the piece is down.
    next =
      next !== null && (raiding(game) || hauling(game))
        ? foundingOn(next)
        : next;
    // "Platziert zuerst eine Hafensiedlung und dann eine Siedlung - jeweils
    // ohne Straße. Die Person, die zuletzt eine Siedlung eingesetzt hat, legt
    // als Erstes eine Straße an ihre Siedlung an und setzt dann ein
    // Entdeckerschiff ein." So the first piece is a port and stands alone; the
    // second is a settlement and brings a road and a ship with it.
    if (finding(game)) {
      // The first piece is a Hafensiedlung and needs a shore; the second is an
      // ordinary settlement and brings a road and a ship with it.
      next =
        next === null || (!second && !foundingShore(game, move.at))
          ? null
          : second
            ? next
            : foundingOn(portAt(next, seat, move.at));
    }
  } else if (
    founding !== null &&
    move.kind === "road" &&
    founding.placing === "road"
  ) {
    const built = doRoad(game, seat, move.at);
    next =
      built === null
        ? null
        : finding(game)
          ? { ...built, founding: { ...founding, placing: "boat" } }
          : foundingOn(built);
  } else if (
    founding !== null &&
    move.kind === "boat" &&
    founding.placing === "boat"
  ) {
    next = foundingBoat(game, seat, move.at);
  } else if (
    founding !== null &&
    move.kind === "ship" &&
    founding.placing === "road"
  ) {
    // "Wer in der Gründungsphase eine Siedlung an die Küste setzt, darf statt
    // einer Straße auch ein Schiff an diese Siedlung setzen."
    const built = doShip(game, seat, move.at);
    next = built === null ? null : foundingOn(built);
  }
  return next;
}

/**
 * Turns a settlement just placed into a Hafensiedlung, without charging.
 *
 * @param game - the game
 * @param seat - whose settlement
 * @param at - the crossing
 * @returns the game with a port there instead
 * @remarks
 * Only the founding phase uses this; anywhere else a port is bought through
 * {@link doPort}, which checks and charges.
 */
function portAt(game: CatanGame, seat: number, at: number): CatanGame {
  const player = game.players[seat];
  return withPlayer(
    {
      ...game,
      towns: game.towns.map((town, crossing) =>
        crossing === at ? { owner: seat, city: false, port: true } : town,
      ),
    },
    seat,
    { ...player, portsLeft: player.portsLeft - 1 },
  );
}

/**
 * Puts the founding Entdeckerschiff on the water.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - a sea path beside one of their harbour settlements
 * @returns the game with the ship there, or null
 * @remarks
 * "Setzt dann ein Entdeckerschiff (Schiff + Entdecker) auf einem der zwei oder
 * drei an die Hafensiedlung angrenzenden Meerwege ein." Free, and with the
 * explorer already aboard.
 */
function foundingBoat(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  const player = game.players[seat];
  return boatSpots(game, seat).includes(at) && player.boatsLeft > 0
    ? foundingOn(
        note(
          withPlayer(
            {
              ...game,
              boats: [
                ...game.boats,
                {
                  owner: seat,
                  at,
                  hold: ["entdecker"],
                  spent: 0,
                  boosted: false,
                  done: false,
                },
              ],
            },
            seat,
            {
              ...player,
              boatsLeft: player.boatsLeft - 1,
              scoutsLeft: player.scoutsLeft - 1,
            },
          ),
          `${nameOf(game, seat)}: setzt ein Entdeckerschiff ein.`,
        ),
      )
    : null;
}

/**
 * Turns a settlement just placed into a city, without charging for it.
 *
 * @param game - the game
 * @param seat - whose settlement
 * @param at - the crossing
 * @returns the game with a city there instead
 * @remarks
 * Only the founding phase uses this. A city built in the ordinary way goes
 * through {@link doCity}, which checks and charges; here the rulebook simply
 * says the second piece **is** a city.
 */
function cityAt(game: CatanGame, seat: number, at: number): CatanGame {
  const player = game.players[seat];
  return withPlayer(
    {
      ...game,
      towns: game.towns.map((town, crossing) =>
        crossing === at ? { owner: seat, city: true } : town,
      ),
    },
    seat,
    {
      ...player,
      settlements: player.settlements + 1,
      cities: player.cities - 1,
    },
  );
}

/**
 * Takes the next step of a city track, and hands out what it wins.
 *
 * @param game - the game
 * @param seat - who is building
 * @param track - which of the three
 * @returns the game after it, or null if it was not allowed
 * @remarks
 * Two things can happen on top of the marker moving. The **fourth** step wins
 * the metropolis, if nobody holds it - and if somebody does, it takes it off
 * them, because reaching the **fifth** is the only way it changes hands:
 * "du kannst eine Metropole nur verlieren, wenn eine andere Person vor dir die
 * 5. Ausbaustufe im selben Bereich erreicht hat."
 */
function doImprove(
  game: CatanGame,
  seat: number,
  track: Track,
): CatanGame | null {
  let next: CatanGame | null = null;
  if (canImprove(game, seat, track)) {
    const player = game.players[seat];
    const level = player.tableau[track] + 1;
    const price = improvePrice(game, seat, track);
    const paid = withPlayer(
      // The Baukran is spent by the improvement that uses it.
      { ...game, crane: game.crane === seat ? null : game.crane },
      seat,
      {
        ...player,
        goods: withGood(player.goods, TRACK_GOODS[track], -price),
        tableau: { ...player.tableau, [track]: level },
      },
    );
    const told = note(
      paid,
      `${nameOf(game, seat)}: baut ${LEVEL_NAMES[track][level - 1]}.`,
    );
    next = checkWinner(awardTiles(metropolis(told, seat, track, level)));
  }
  return next;
}

/**
 * Moves a metropolis, if this step of the track has won one.
 *
 * @param game - the game, with the marker already moved
 * @param seat - who just built
 * @param track - which track
 * @param level - the step they have just reached
 * @returns the game with the metropolis where it now belongs
 * @remarks
 * Step four takes an empty metropolis; step five takes an occupied one and then
 * nails it down - "eine Metropole ist sicher, sobald du die 5. Ausbaustufe
 * erreicht hast". Which is why a fifth step by somebody who already holds it
 * changes nothing, and a fourth step is barred outright while it is held.
 */
function metropolis(
  game: CatanGame,
  seat: number,
  track: Track,
  level: number,
): CatanGame {
  const held = game.metro[track];
  const safe =
    held !== null && game.players[held.seat].tableau[track] >= TOP_LEVEL;
  const wins =
    (level === METRO_LEVEL && held === null) ||
    (level >= TOP_LEVEL && !safe && held?.seat !== seat);
  const at = wins ? freeCityFor(game, seat) : null;
  return at === null
    ? game
    : note(
        { ...game, metro: { ...game.metro, [track]: { seat, at } } },
        `${nameOf(game, seat)}: errichtet die Metropole ${TRACK_NAMES[track]}.`,
      );
}

/**
 * Puts a city wall up.
 *
 * @param game - the game
 * @param seat - whose city
 * @returns the game with one more wall, or null
 * @remarks
 * Counted rather than placed. The rulebook has a wall standing under a
 * particular city, but nothing ever asks **which** one - it raises the hand
 * limit and it is lost when a city is lost, and both of those are counts. What
 * is enforced is that there is a city without one to put it under.
 */
function doWall(game: CatanGame, seat: number): CatanGame | null {
  return canWall(game, seat) && covers(game.players[seat].hand, WALL_COST)
    ? note(
        spend(
          withPlayer(game, seat, {
            ...game.players[seat],
            walls: game.players[seat].walls + 1,
          }),
          seat,
          WALL_COST,
        ),
        `${nameOf(game, seat)}: baut eine Stadtmauer.`,
      )
    : null;
}

/** Puts a fresh knight on a crossing, passive and without a helmet. */
function doKnight(game: CatanGame, seat: number, at: number): CatanGame | null {
  return canKnight(game, seat, at) &&
    covers(game.players[seat].hand, KNIGHT_COST)
    ? checkWinner(
        awardTiles(
          note(
            spend(
              {
                ...game,
                garrison: game.garrison.map((knight, crossing) =>
                  crossing === at
                    ? {
                        owner: seat,
                        level: SIMPLE,
                        active: false,
                        fresh: false,
                        spent: false,
                      }
                    : knight,
                ),
              },
              seat,
              KNIGHT_COST,
            ),
            `${nameOf(game, seat)}: stellt einen Ritter auf.`,
          ),
        ),
      )
    : null;
}

/**
 * Gives a knight its helmet.
 *
 * @remarks
 * "Aktivierst du einen Ritter, darfst du diesen frühestens in deinem nächsten
 * Zug für eine Aktion einsetzen" - which is what `fresh` is for. It is cleared
 * when its owner's turn comes round again.
 */
function doActivate(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  const knight = game.garrison[at];
  return knight !== null &&
    knight.owner === seat &&
    !knight.active &&
    covers(game.players[seat].hand, ACTIVATE_COST)
    ? note(
        spend(
          {
            ...game,
            garrison: game.garrison.map((each, crossing) =>
              crossing === at && each !== null
                ? { ...each, active: true, fresh: true }
                : each,
            ),
          },
          seat,
          ACTIVATE_COST,
        ),
        `${nameOf(game, seat)}: aktiviert einen Ritter.`,
      )
    : null;
}

/**
 * Raises a knight a strength.
 *
 * @remarks
 * "Ritter dürfen sowohl in passivem wie auch in aktivem Zustand aufgewertet
 * werden. Ist ein Ritter vor dem Aufwerten aktiv, ist er es danach weiterhin."
 * So the state is carried over untouched and only the level changes.
 */
function doUpgrade(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  const knight = game.garrison[at];
  return knight !== null &&
    canUpgrade(game, seat, at) &&
    covers(game.players[seat].hand, KNIGHT_COST)
    ? note(
        spend(
          {
            ...game,
            garrison: game.garrison.map((each, crossing) =>
              crossing === at && each !== null
                ? { ...each, level: each.level + 1 }
                : each,
            ),
          },
          seat,
          KNIGHT_COST,
        ),
        `${nameOf(game, seat)}: wertet einen Ritter auf.`,
      )
    : null;
}

/**
 * Marches a knight, driving off whatever weaker knight was standing there.
 *
 * @param game - the game
 * @param seat - whose knight
 * @param from - where it stands
 * @param to - where it is going
 * @returns the game after the march, or null
 * @remarks
 * Both of the rulebook's actions in one, because the board cannot tell them
 * apart until it looks: Versetzen onto an empty crossing, Vertreiben onto an
 * occupied one. Either way the marching knight is stood down afterwards -
 * "hast du einen Ritter versetzt, musst du ihn deaktivieren".
 *
 * The knight driven off does **not** move here. Where it goes is its owner's
 * choice, so the turn stops and waits for them.
 */
function doMarch(
  game: CatanGame,
  seat: number,
  from: number,
  to: number,
): CatanGame | null {
  const knight = game.garrison[from];
  const answering = game.phase === "displaced" && game.displaced === from;
  const allowed =
    knight !== null &&
    knight.owner === seat &&
    (answering
      ? retreatSpots(game, from, seat).includes(to)
      : knightReady(game, from) && marchSpots(game, from).includes(to));
  let next: CatanGame | null = null;
  if (allowed && knight !== null) {
    const pushed = game.garrison[to];
    const moved = game.garrison.map((each, crossing) => {
      let there = each;
      if (crossing === from) {
        there = null;
      } else if (crossing === to) {
        // A knight answering a displacement keeps its state; one that marched
        // of its own accord is stood down by the march itself.
        there = answering ? knight : { ...knight, active: false, spent: true };
      }
      return there;
    });
    const told = note(
      { ...game, garrison: moved, displaced: null, phase: "trade" as Phase },
      `${nameOf(game, seat)}: ${
        answering ? "weicht aus" : "versetzt einen Ritter"
      }.`,
    );
    next = awardTiles(pushed === null ? told : driveOff(told, pushed, to));
  }
  return next;
}

/**
 * Hands a driven-off knight back to its owner to place.
 *
 * @param game - the game, with the attacker already on the crossing
 * @param pushed - the knight that was standing there
 * @param at - the crossing it was standing on
 * @returns the game waiting for its owner, or with it taken off the board
 * @remarks
 * "Gibt es keine freie Kreuzung, auf die der Ritter vertrieben werden kann,
 * muss er vom Spielplan genommen werden." So a knight with nowhere to go is
 * simply lost, and the turn carries on rather than stopping for a choice that
 * does not exist.
 */
function driveOff(game: CatanGame, pushed: Knight, at: number): CatanGame {
  const spots = retreatSpots(game, at, pushed.owner);
  return spots.length === 0
    ? note(
        game,
        `${nameOf(game, pushed.owner)}: verliert einen vertriebenen Ritter.`,
      )
    : note(
        {
          ...game,
          // Parked back on the crossing it was pushed from so its owner can
          // walk it out from there. The attacker took that crossing a moment
          // ago; both never count at once, because the phase says whose move
          // it is and the retreat is the only legal one.
          garrison: game.garrison.map((each, crossing) =>
            crossing === at ? { ...pushed, spent: true } : each,
          ),
          phase: "displaced",
          displaced: at,
        },
        `${nameOf(game, pushed.owner)}: muss einen vertriebenen Ritter versetzen.`,
      );
}

/**
 * Chases the robber off with a knight.
 *
 * @remarks
 * "Dies funktioniert so wie das Einsetzen einer Entwicklungskarte Ritter" - so
 * it hands over to the ordinary robber phase, and the knight is stood down.
 */
function doChase(game: CatanGame, seat: number, at: number): CatanGame | null {
  return canChase(game, at) && game.garrison[at]?.owner === seat
    ? note(
        {
          ...game,
          garrison: game.garrison.map((each, crossing) =>
            crossing === at && each !== null
              ? { ...each, active: false, spent: true }
              : each,
          ),
          phase: "robber",
        },
        `${nameOf(game, seat)}: verjagt mit einem Ritter den Räuber.`,
      )
    : null;
}

/**
 * Plays a Fortschrittskarte.
 *
 * @param game - the game
 * @param seat - who is playing it
 * @param card - which card
 * @returns the game after it, or null if it may not be played
 * @remarks
 * "In deinem Zug darfst du beliebig viele deiner Fortschrittskarten ausspielen,
 * aber erst **nachdem** du gewürfelt hast" - with Alchemie the one exception,
 * which is why that card is the only one allowed in the rolling phase.
 *
 * A card leaves the hand here whatever happens next, and goes back **under its
 * own deck** - "ausgespielte Karten legst du verdeckt unter den jeweiligen
 * Stapel zurück". The two Siegpunkt cards are never played at all: they lie
 * face up and are counted where they are.
 */
function doProgress(
  game: CatanGame,
  seat: number,
  card: Progress,
): CatanGame | null {
  const holds = game.players[seat].progress.includes(card);
  // Alchemie names the dice before they are thrown, so it belongs to the roll -
  // and at a table of five or six the second castle never rolls: "Fortschritts-
  // karten ausspielen (allerdings nicht die Karte Alchemie)."
  const timely =
    card === "alchemie"
      ? game.phase === "roll" && !(sharesTurns(game) && game.stone === 2)
      : game.phase === "trade";
  let next: CatanGame | null = null;
  if (playingRitter(game) && holds && timely && !isPointCard(card)) {
    const track = trackOf(card);
    const spent = withPlayer(
      {
        ...game,
        decks: {
          ...game.decks,
          [track]: [...game.decks[track], card],
        },
      },
      seat,
      {
        ...game.players[seat],
        progress: dropOne(game.players[seat].progress, card),
      },
    );
    next = cardEffect(
      note(spent, `${nameOf(game, seat)}: spielt ${PROGRESS_NAMES[card]}.`),
      seat,
      card,
    );
  }
  return next;
}

/** One copy of a card out of a list, leaving any others alone. */
function dropOne(
  cards: readonly HeldCard[],
  card: Progress,
): readonly HeldCard[] {
  const at = cards.indexOf(card);
  return at < 0 ? cards : [...cards.slice(0, at), ...cards.slice(at + 1)];
}

/**
 * What a Fortschrittskarte does.
 *
 * @param game - the game, with the card already back under its deck
 * @param seat - who played it
 * @param card - which card
 * @returns the game after it, or waiting for the choice the card asks for
 * @remarks
 * Split in two on one line: the cards that simply happen return a finished
 * game, and the cards that ask something park themselves in the `progress`
 * phase for {@link answerProgress} to finish. Which is which is decided here
 * and nowhere else.
 */
function cardEffect(game: CatanGame, seat: number, card: Progress): CatanGame {
  const waiting: CatanGame = { ...game, phase: "progress", playing: card };
  let next: CatanGame;
  switch (card) {
    case "bergbau":
      next = harvestFrom(game, seat, "erz", 2);
      break;
    case "bewaesserung":
      next = harvestFrom(game, seat, "getreide", 2);
      break;
    case "motivation":
      // "Wenn du diese Karte ausspielst, aktivierst du sofort kostenlos alle
      // eigenen Ritter." Roused this turn, so still not usable until the next.
      next = note(
        {
          ...game,
          garrison: game.garrison.map((knight) =>
            knight !== null && knight.owner === seat && !knight.active
              ? { ...knight, active: true, fresh: true }
              : knight,
          ),
        },
        `${nameOf(game, seat)}: aktiviert alle eigenen Ritter.`,
      );
      break;
    case "baukran":
      next = { ...game, crane: seat };
      break;
    case "strassenbau":
      next = { ...game, freeRoads: game.freeRoads + 2 };
      break;
    case "ingenieurwesen":
      next = canWall(game, seat)
        ? note(
            withPlayer(game, seat, {
              ...game.players[seat],
              walls: game.players[seat].walls + 1,
            }),
            `${nameOf(game, seat)}: baut eine Stadtmauer gratis.`,
          )
        : game;
      break;
    case "sabotage":
      next = sabotage(game, seat);
      break;
    case "steuern":
      next = taxes(game, seat) ?? game;
      break;
    case "hochzeit":
      next = wedding(game, seat) ?? game;
      break;
    case "handelshafen":
      next = tradePort(game, seat) ?? game;
      break;
    default:
      next = waiting;
  }
  return next;
}

/**
 * Bergbau and Bewässerung: two cards per landscape you have built on.
 *
 * @param game - the game
 * @param seat - who played it
 * @param sort - the resource being harvested
 * @param each - how many per landscape
 * @returns the game with the cards handed over
 * @remarks
 * "Es spielt keine Rolle, ob du eine Siedlung oder eine Stadt an dem Feld
 * besitzt, du erhältst in jedem Fall 2" - and two settlements on the same
 * landscape pay once, because the card counts **landscapes**, not buildings.
 */
function harvestFrom(
  game: CatanGame,
  seat: number,
  sort: Resource,
  each: number,
): CatanGame {
  const board = islandOf(game.land.length);
  const fields = new Set<number>();
  board.crossings.forEach((crossing) => {
    if (game.towns[crossing.id]?.owner === seat) {
      crossing.hexes.forEach((hex) => {
        if (game.land[hex] === sort) {
          fields.add(hex);
        }
      });
    }
  });
  const won = fields.size * each;
  return won === 0
    ? game
    : note(
        withHand(game, seat, withCard(game.players[seat].hand, sort, won)),
        `${nameOf(game, seat)}: erntet ${won} ${SORT_NAMES[sort]}.`,
      );
}

/**
 * Sabotage: everybody level with you or ahead loses half.
 *
 * @remarks
 * "Alle Personen, die gleich viele oder mehr Siegpunkte als du besitzen,
 * verlieren sofort die Hälfte ihrer Handkarten (Rohstoffe und Handelswaren)."
 * Which half is not asked - unlike a seven, this is not a choice - so the
 * referee takes the spare ones itself, the same way it would rob.
 */
function sabotage(game: CatanGame, seat: number): CatanGame {
  const mine = pointsOf(game, seat);
  let next = game;
  for (const at of realSeats(game)) {
    const held =
      handSize(next.players[at].hand) + goodsSize(next.players[at].goods);
    if (at !== seat && pointsOf(next, at) >= mine && held > 1) {
      next = burnHalf(next, at, Math.floor(held / 2));
    }
  }
  return note(next, `${nameOf(game, seat)}: sabotiert die Führenden.`);
}

/** Takes a number of cards off a seat, resources first, then Handelswaren. */
function burnHalf(game: CatanGame, seat: number, count: number): CatanGame {
  let hand = game.players[seat].hand;
  let goods = game.players[seat].goods;
  for (let gone = 0; gone < count; gone++) {
    const sort = RESOURCES.filter((each) => hand[each] > 0).sort(
      (one, other) => hand[other] - hand[one],
    )[0];
    if (sort === undefined) {
      const good = COMMODITIES.filter((each) => goods[each] > 0).sort(
        (one, other) => goods[other] - goods[one],
      )[0];
      if (good === undefined) {
        break;
      }
      goods = withGood(goods, good, -1);
    } else {
      hand = withCard(hand, sort, -1);
    }
  }
  return withPlayer(game, seat, { ...game.players[seat], hand, goods });
}

/**
 * The answer a Fortschrittskarte was waiting for.
 *
 * @param game - the game, parked in the progress phase
 * @param seat - who is answering
 * @param move - the answer
 * @returns the game after it, or null if the answer was not a legal one
 * @remarks
 * One function for sixteen cards, because they differ only in which field of
 * the answer they read. What they share is the shape: the card named by
 * {@link CatanGame.playing} asked something, this is the something, and
 * afterwards the turn goes back to building.
 */
function answerProgress(
  game: CatanGame,
  seat: number,
  move: Extract<CatanMove, { kind: "answerCard" }>,
): CatanGame | null {
  const card = game.playing;
  let next: CatanGame | null = null;
  if (card !== null && game.phase === "progress") {
    switch (card) {
      case "alchemie":
        next = alchemy(game, move.dice);
        break;
      case "erfindung":
        next = swapChips(game, seat, move.at, move.to);
        break;
      case "medizin":
        next = medicine(game, seat, move.at);
        break;
      case "schmiedekunst":
        next = forge(game, seat, move.at);
        break;
      case "haendler":
        next = placeTrader(game, seat, move.at);
        break;
      case "handelsflotte":
        next = charterFleet(game, seat, move.sort, move.good);
        break;
      case "warenmonopol":
        next = goodsMonopoly(game, seat, move.good);
        break;
      case "rohstoffmonopol":
        next = cardMonopoly(game, seat, move.sort);
        break;
      case "diplomatie":
        next = diplomacy(game, seat, move.at);
        break;
      case "intrige":
        next = intrigue(game, seat, move.at);
        break;
      case "spionage":
        next = espionage(game, seat, move.seat, move.card);
        break;
      case "abgaben":
        next = levy(game, seat, move.seat, move.cards, move.goods);
        break;
      case "verrat":
        next = treason(game, seat, move.seat, move.at);
        break;
      case "hochzeit":
      case "handelshafen":
        // Answered by somebody who is **not** on turn, and the queue decides
        // when it is over - so this one returns the game itself rather than
        // going through done().
        return giveToActive(game, seat, move);
      default:
        next = null;
    }
  }
  return next === null ? null : done(next);
}

/** Puts the turn back where a Fortschrittskarte interrupted it. */
function done(game: CatanGame): CatanGame {
  return checkWinner(awardTiles({ ...game, phase: "trade", playing: null }));
}

/**
 * Alchemie: name both number dice, then throw the event die as usual.
 *
 * @remarks
 * "Spiele diese Karte vor deinem Würfelwurf und bestimme das Ergebnis beider
 * Augenwürfel. Würfle danach wie üblich den Ereigniswürfel und führe **zuerst**
 * das Ereignis aus." So this is a whole roll, in the same order a rolled one
 * would take - which is why it goes through the same machinery rather than
 * just setting the dice and hoping.
 */
function alchemy(
  game: CatanGame,
  dice: readonly [number, number] | undefined,
): CatanGame | null {
  const ok =
    dice !== undefined &&
    dice.every((die) => Number.isInteger(die) && die >= 1 && die <= DIE_SIDES);
  let next: CatanGame | null = null;
  if (ok && dice !== undefined) {
    const random = createRandom(game.seed);
    const rolled = dice[0] + dice[1];
    const thrown = note(
      {
        ...game,
        dice,
        rolls: game.rolls + 1,
        firstRoll: game.rolls === 0 ? rolled : game.firstRoll,
        playing: null,
      },
      `${nameOf(game, actingSeat(game))}: bestimmt mit Alchemie eine ${rolled}.`,
    );
    const after = eventDieStep(thrown, random);
    // The villages of Stoffe für Catan pay on their own number, and a seven is
    // not their business: they are no landscapes and no robber stands on them.
    const paid = payVillages(sailArmada(after, dice), rolled);
    next =
      rolled === ROBBER_ROLL
        ? seven(paid)
        : afterYield(fishOut(produce(paid, rolled), rolled));
  }
  return next;
}

/**
 * Erfindung: swap two number chips.
 *
 * @remarks
 * "Vertausche 2 Zahlenchips miteinander, **niemals aber die Chips 2, 12, 6 und
 * 8**." The four barred numbers are the two rarest and the two commonest - the
 * ones a board is balanced around - and the desert's blank is not a chip at
 * all.
 */
function swapChips(
  game: CatanGame,
  seat: number,
  one: number | undefined,
  other: number | undefined,
): CatanGame | null {
  const movable = (hex: number | undefined): boolean =>
    hex !== undefined &&
    hex >= 0 &&
    hex < game.chips.length &&
    game.chips[hex] > 0 &&
    !FIXED_CHIPS.includes(game.chips[hex]);
  return movable(one) && movable(other) && one !== other
    ? note(
        {
          ...game,
          chips: game.chips.map((chip, hex) =>
            hex === one
              ? game.chips[other as number]
              : hex === other
                ? game.chips[one as number]
                : chip,
          ),
        },
        `${nameOf(game, seat)}: vertauscht zwei Zahlenchips.`,
      )
    : null;
}

/**
 * Medizin: a city for two Erz and one Getreide.
 *
 * @remarks
 * "Für 2 Erz und 1 Getreide wandelst du eine deiner Siedlungen in eine Stadt
 * um" - a discount of one of each on the printed price, and it still has to be
 * paid.
 */
function medicine(
  game: CatanGame,
  seat: number,
  at: number | undefined,
): CatanGame | null {
  return at !== undefined &&
    canCity(game, seat, at) &&
    covers(game.players[seat].hand, MEDICINE_COST)
    ? note(
        spend(cityAt(game, seat, at), seat, MEDICINE_COST),
        `${nameOf(game, seat)}: baut mit Medizin eine Stadt.`,
      )
    : null;
}

/**
 * Schmiedekunst: raise a knight for nothing.
 *
 * @remarks
 * The card raises **two**, and this raises one - the second answer comes back
 * through the same door, because the card stays on the table until both are
 * spent. What it does not do is bend the rules: "Bedingung für 3. Stufe
 * beachten" means the Festung is still needed, which {@link canUpgrade} knows.
 */
function forge(
  game: CatanGame,
  seat: number,
  at: number | undefined,
): CatanGame | null {
  return at !== undefined && canUpgrade(game, seat, at)
    ? note(
        {
          ...game,
          garrison: game.garrison.map((each, crossing) =>
            crossing === at && each !== null
              ? { ...each, level: each.level + 1 }
              : each,
          ),
        },
        `${nameOf(game, seat)}: wertet mit Schmiedekunst einen Ritter auf.`,
      )
    : null;
}

/**
 * Der Händler: stand the trader on one of your landscapes.
 *
 * @remarks
 * "Stelle den Händler auf ein Landschaftsfeld neben eine deiner Siedlungen oder
 * Städte." It is worth a victory point while it is yours, and only another
 * Händler card ever moves it - which is why it simply overwrites.
 */
function placeTrader(
  game: CatanGame,
  seat: number,
  at: number | undefined,
): CatanGame | null {
  const board = islandOf(game.land.length);
  const mine =
    at !== undefined &&
    at >= 0 &&
    at < game.land.length &&
    board.hexes[at].corners.some(
      (corner) => game.towns[corner]?.owner === seat,
    );
  return mine && at !== undefined
    ? note(
        { ...game, trader: at, traderOwner: seat },
        `${nameOf(game, seat)}: stellt den Händler auf.`,
      )
    : null;
}

/** Handelsflotte: one sort, traded two for one until the turn ends. */
function charterFleet(
  game: CatanGame,
  seat: number,
  sort: Resource | undefined,
  good: Commodity | undefined,
): CatanGame | null {
  const picked = sort ?? good;
  return picked === undefined
    ? null
    : note(
        { ...game, fleet: picked },
        `${nameOf(game, seat)}: chartert eine Handelsflotte.`,
      );
}

/** Handelswaren-Monopol: one of each from everybody who has one. */
function goodsMonopoly(
  game: CatanGame,
  seat: number,
  good: Commodity | undefined,
): CatanGame | null {
  let next: CatanGame | null = null;
  if (good !== undefined) {
    let taken = 0;
    let after = game;
    for (const at of realSeats(game)) {
      if (at !== seat && after.players[at].goods[good] > 0) {
        after = withPlayer(after, at, {
          ...after.players[at],
          goods: withGood(after.players[at].goods, good, -1),
        });
        taken += 1;
      }
    }
    next = note(
      withPlayer(after, seat, {
        ...after.players[seat],
        goods: withGood(after.players[seat].goods, good, taken),
      }),
      `${nameOf(game, seat)}: nimmt ${taken}x ${COMMODITY_NAMES[good]}.`,
    );
  }
  return next;
}

/**
 * Rohstoff-Monopol: two of a sort from everybody who has any.
 *
 * @remarks
 * "Besitzt eine Person nur 1 Rohstoff dieser Sorte, muss sie dir die Karte
 * trotzdem geben" - so this takes up to two rather than exactly two, which is
 * what makes it different from the printed Monopol card that takes the lot.
 */
function cardMonopoly(
  game: CatanGame,
  seat: number,
  sort: Resource | undefined,
): CatanGame | null {
  let next: CatanGame | null = null;
  if (sort !== undefined) {
    let taken = 0;
    let after = game;
    for (const at of realSeats(game)) {
      if (at !== seat) {
        const give = Math.min(2, after.players[at].hand[sort]);
        if (give > 0) {
          after = withHand(
            after,
            at,
            withCard(after.players[at].hand, sort, -give),
          );
          taken += give;
        }
      }
    }
    next = note(
      withHand(after, seat, withCard(after.players[seat].hand, sort, taken)),
      `${nameOf(game, seat)}: nimmt ${taken}x ${SORT_NAMES[sort]}.`,
    );
  }
  return next;
}

/**
 * Diplomatie: pull up an open road.
 *
 * @remarks
 * "Du darfst eine beliebige **offene** Straße (ohne Abschluss durch
 * gleichfarbige Straße oder Figur) entfernen." Open means a dead end: one of
 * its two crossings carries nothing of that colour - no road of theirs
 * continuing and no building of theirs standing on it.
 */
function diplomacy(
  game: CatanGame,
  seat: number,
  at: number | undefined,
): CatanGame | null {
  return at !== undefined && openRoads(game, seat).includes(at)
    ? note(
        {
          ...game,
          roads: game.roads.map((owner, path) => (path === at ? null : owner)),
          players: game.players.map((player, who) =>
            who === game.roads[at]
              ? { ...player, roads: player.roads + 1 }
              : player,
          ),
        },
        `${nameOf(game, seat)}: entfernt eine offene Straße.`,
      )
    : null;
}

/**
 * The roads Diplomatie could pull up.
 *
 * @param game - the game
 * @param seat - who is playing the card
 * @returns every road with a loose end
 */
export function openRoads(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  return game.roads
    .map((owner, path) => {
      const loose =
        owner !== null &&
        board.paths[path].ends.some(
          (end) =>
            game.towns[end]?.owner !== owner &&
            game.garrison[end]?.owner !== owner &&
            !board.crossings[end].paths.some(
              (other) => other !== path && game.roads[other] === owner,
            ),
        );
      return loose ? path : -1;
    })
    .filter((path) => path >= 0 && seat >= 0);
}

/**
 * Intrige: drive a knight off a crossing your roads reach.
 *
 * @remarks
 * "Du darfst einen beliebigen Ritter einer anderen Person von einer Kreuzung
 * vertreiben. Du musst aber mit einer eigenen Straße bzw. Schiffslinie diese
 * Kreuzung erreichen." No strength comparison - the card does what a knight
 * could not.
 */
function intrigue(
  game: CatanGame,
  seat: number,
  at: number | undefined,
): CatanGame | null {
  const board = islandOf(game.land.length);
  const knight = at === undefined ? null : game.garrison[at];
  const reaches =
    at !== undefined &&
    board.crossings[at].paths.some((path) => game.roads[path] === seat);
  return knight !== null && knight.owner !== seat && reaches && at !== undefined
    ? driveOff(
        note(
          {
            ...game,
            garrison: game.garrison.map((each, c) => (c === at ? null : each)),
          },
          `${nameOf(game, seat)}: vertreibt mit Intrige einen Ritter.`,
        ),
        knight,
        at,
      )
    : null;
}

/**
 * Spionage: look at somebody's Fortschrittskarten and take one.
 *
 * @remarks
 * A victory-point card cannot be taken: it is face up in front of them and not
 * among the cards being looked through.
 */
function espionage(
  game: CatanGame,
  seat: number,
  from: number | undefined,
  card: Progress | undefined,
): CatanGame | null {
  return from !== undefined &&
    card !== undefined &&
    from !== seat &&
    !isPointCard(card) &&
    game.players[from].progress.includes(card)
    ? note(
        withPlayer(
          withPlayer(game, from, {
            ...game.players[from],
            progress: dropOne(game.players[from].progress, card),
          }),
          seat,
          {
            ...game.players[seat],
            progress: [...game.players[seat].progress, card],
          },
        ),
        `${nameOf(game, seat)}: spioniert eine Fortschrittskarte aus.`,
      )
    : null;
}

/**
 * Abgaben: take two cards off somebody ahead of you.
 *
 * @remarks
 * "Wähle eine andere Person aus, die **mehr** Siegpunkte als du besitzt. Suche
 * dir aus ihren Handkarten 2 aus (Rohstoffe und/oder Handelswaren)." You see
 * the hand and choose, so both are named in the answer - and the target has to
 * be genuinely ahead.
 */
function levy(
  game: CatanGame,
  seat: number,
  from: number | undefined,
  cards: Hand | undefined,
  goods: Goods | undefined,
): CatanGame | null {
  const take = cards ?? NO_CARDS;
  const takeGoods = goods ?? NO_GOODS;
  const held =
    from === undefined
      ? 0
      : handSize(game.players[from].hand) + goodsSize(game.players[from].goods);
  const owed = Math.min(2, held);
  return from !== undefined &&
    from !== seat &&
    pointsOf(game, from) > pointsOf(game, seat) &&
    handSize(take) + goodsSize(takeGoods) === owed &&
    covers(game.players[from].hand, take) &&
    COMMODITIES.every(
      (sort) => game.players[from].goods[sort] >= takeGoods[sort],
    )
    ? note(
        withPlayer(
          withPlayer(game, from, {
            ...game.players[from],
            hand: minus(game.players[from].hand, take),
            goods: COMMODITIES.reduce(
              (left, sort) => withGood(left, sort, -takeGoods[sort]),
              game.players[from].goods,
            ),
          }),
          seat,
          {
            ...game.players[seat],
            hand: plus(game.players[seat].hand, take),
            goods: COMMODITIES.reduce(
              (mine, sort) => withGood(mine, sort, takeGoods[sort]),
              game.players[seat].goods,
            ),
          },
        ),
        `${nameOf(game, seat)}: erhebt Abgaben von ${nameOf(game, from)}.`,
      )
    : null;
}

/**
 * Verrat: take a knight off somebody and put one of your own up instead.
 *
 * @remarks
 * "Bestimme eine andere Person, die einen beliebigen ihrer Ritter vom Spielfeld
 * nehmen muss. Stelle dann einen eigenen Ritter **derselben Stufe mit demselben
 * Status** auf." The replacement copies the one it displaced exactly, which is
 * what makes the card worth its place - and it still needs a piece in the box.
 */
function treason(
  game: CatanGame,
  seat: number,
  from: number | undefined,
  at: number | undefined,
): CatanGame | null {
  const knight = at === undefined ? null : game.garrison[at];
  return knight !== null &&
    at !== undefined &&
    from !== undefined &&
    knight.owner === from &&
    from !== seat &&
    knightsLeft(game, seat, knight.level) > 0
    ? note(
        {
          ...game,
          garrison: game.garrison.map((each, crossing) =>
            crossing === at ? { ...knight, owner: seat, spent: true } : each,
          ),
        },
        `${nameOf(game, seat)}: übernimmt mit Verrat einen Ritter.`,
      )
    : null;
}

/**
 * Steuern: move the robber, then take one card off everybody it lands on.
 *
 * @param game - the game
 * @param seat - who played it
 * @returns the game in the robber phase, with the card still on the table
 * @remarks
 * "Versetze den Räuber. Ziehe von **jeder** Person, die mindestens 1
 * Siedlung/Stadt an dem neuen Räuberfeld besitzt, 1 Handkarte." Two steps, and
 * the first is the ordinary robber phase - so the card parks itself there and
 * {@link taxAt} finishes it when the robber lands.
 *
 * It obeys the lock like everything else: before the barbarians have landed
 * once the robber may not move at all, so the card does nothing.
 */
function taxes(game: CatanGame, seat: number): CatanGame | null {
  return robberLoose(game)
    ? note(
        { ...game, phase: "robber", playing: "steuern" },
        `${nameOf(game, seat)}: erhebt Steuern - versetze den Räuber.`,
      )
    : null;
}

/**
 * The half of Steuern that happens once the robber is down.
 *
 * @param game - the game, with the robber on its new landscape
 * @param seat - who played the card
 * @returns the game with one card taken from each neighbour
 * @remarks
 * "Hat eine Person an diesem Feld zweimal gebaut, darfst du trotzdem nur 1
 * Karte von ihr ziehen" - so the seats are collected into a set first.
 */
function taxAt(game: CatanGame, seat: number): CatanGame {
  const board = islandOf(game.land.length);
  const neighbours = new Set<number>();
  (board.hexes[game.robber]?.corners ?? []).forEach((corner) => {
    const owner = game.towns[corner]?.owner;
    if (owner !== undefined && owner !== seat && !game.players[owner].neutral) {
      neighbours.add(owner);
    }
  });
  let next = game;
  for (const at of neighbours) {
    if (
      handSize(next.players[at].hand) + goodsSize(next.players[at].goods) >
      0
    ) {
      next = rob(next, seat, at);
    }
  }
  return note(
    { ...next, playing: null },
    `${nameOf(game, seat)}: zieht die Steuern ein.`,
  );
}

/**
 * Hochzeit: everybody ahead of you hands you two cards of their choosing.
 *
 * @param game - the game
 * @param seat - who played it
 * @returns the game waiting for the first of them, or finished if nobody is
 * ahead
 * @remarks
 * "Jede andere Person, die mehr Siegpunkte als du besitzt, muss dir 2 Karten
 * **ihrer Wahl** schenken." Their choice, so each of them answers in turn -
 * which is what the queue in {@link CatanGame.owed} is for.
 */
function wedding(game: CatanGame, seat: number): CatanGame | null {
  const ahead = realSeats(game).filter(
    (at) => at !== seat && pointsOf(game, at) > pointsOf(game, seat),
  );
  return ahead.length === 0
    ? note(game, `${nameOf(game, seat)}: die Hochzeit bringt nichts ein.`)
    : note(
        { ...game, phase: "progress", playing: "hochzeit", owed: ahead },
        `${nameOf(game, seat)}: heiratet - die Führenden schenken je 2 Karten.`,
      );
}

/**
 * Handelshafen: offer everybody a resource for a Handelsware.
 *
 * @param game - the game
 * @param seat - who played it
 * @returns the game waiting for the others, or finished if nobody holds one
 * @remarks
 * "Du darfst einmal allen anderen 1 Rohstoffkarte anbieten. Im Austausch muss
 * die andere Person dir eine beliebige Handelsware geben, falls sie eine
 * besitzt... die von dir aufgeforderte Person wählt selbst die Karte aus."
 * Only the people who actually hold a Handelsware are asked - "wenn du einer
 * Person eine Karte zum Tausch anbietest, die keine Karte Handelsware besitzt,
 * entfällt der Tausch".
 */
function tradePort(game: CatanGame, seat: number): CatanGame | null {
  const holders = realSeats(game).filter(
    (at) => at !== seat && goodsSize(game.players[at].goods) > 0,
  );
  return holders.length === 0 || handSize(game.players[seat].hand) === 0
    ? note(
        game,
        `${nameOf(game, seat)}: der Handelshafen findet keinen Tausch.`,
      )
    : note(
        { ...game, phase: "progress", playing: "handelshafen", owed: holders },
        `${nameOf(game, seat)}: eröffnet einen Handelshafen.`,
      );
}

/**
 * One person's answer to Hochzeit or Handelshafen.
 *
 * @param game - the game, waiting on the queue
 * @param seat - who is answering
 * @param move - what they are handing over
 * @returns the game with the queue one shorter, or null
 * @remarks
 * Both cards ask other people for cards of their own choosing, so both queue
 * the same way and both end when the queue empties. The **player whose turn it
 * is** is the one who gets them, which is why the recipient is looked up from
 * {@link actingSeat} rather than carried in the answer.
 */
function giveToActive(
  game: CatanGame,
  seat: number,
  move: Extract<CatanMove, { kind: "answerCard" }>,
): CatanGame | null {
  const to = actingSeat(game);
  const card = game.playing;
  const cards = move.cards ?? NO_CARDS;
  const goods = move.goods ?? NO_GOODS;
  const owedNow = card === "hochzeit" ? weddingOwed(game, seat) : 1;
  const rightSort =
    card === "hochzeit"
      ? handSize(cards) + goodsSize(goods) === owedNow
      : handSize(cards) === 0 && goodsSize(goods) === 1;
  let next: CatanGame | null = null;
  if (
    game.owed[0] === seat &&
    rightSort &&
    covers(game.players[seat].hand, cards) &&
    COMMODITIES.every((sort) => game.players[seat].goods[sort] >= goods[sort])
  ) {
    const moved = handOver(game, seat, to, cards, goods);
    // The Handelshafen pays for what it takes: one resource of the offerer's
    // choosing goes back the other way. The referee picks their commonest,
    // because the card gives the choice to the *taker* and nothing turns on it.
    const paid = card === "handelshafen" ? payForGood(moved, to, seat) : moved;
    const rest = game.owed.slice(1);
    next =
      rest.length === 0 ? done({ ...paid, owed: [] }) : { ...paid, owed: rest };
  }
  return next;
}

/** How many cards a Hochzeit takes off one person - two, or all they have. */
function weddingOwed(game: CatanGame, seat: number): number {
  return Math.min(
    2,
    handSize(game.players[seat].hand) + goodsSize(game.players[seat].goods),
  );
}

/** Moves a bundle of cards from one seat to another. */
function handOver(
  game: CatanGame,
  from: number,
  to: number,
  cards: Hand,
  goods: Goods,
): CatanGame {
  return withPlayer(
    withPlayer(game, from, {
      ...game.players[from],
      hand: minus(game.players[from].hand, cards),
      goods: COMMODITIES.reduce(
        (left, sort) => withGood(left, sort, -goods[sort]),
        game.players[from].goods,
      ),
    }),
    to,
    {
      ...game.players[to],
      hand: plus(game.players[to].hand, cards),
      goods: COMMODITIES.reduce(
        (mine, sort) => withGood(mine, sort, goods[sort]),
        game.players[to].goods,
      ),
    },
  );
}

/** The resource a Handelshafen hands back for the Handelsware it took. */
function payForGood(game: CatanGame, from: number, to: number): CatanGame {
  const spare = RESOURCES.filter(
    (sort) => game.players[from].hand[sort] > 0,
  ).sort(
    (one, other) =>
      game.players[from].hand[other] - game.players[from].hand[one],
  )[0];
  return spare === undefined
    ? game
    : withHand(
        withHand(game, from, withCard(game.players[from].hand, spare, -1)),
        to,
        withCard(game.players[to].hand, spare),
      );
}

/**
 * Hands out the fish a roll has earned.
 *
 * @param game - the game, after the resources have been paid
 * @param rolled - the number that came up
 * @returns the game with the tiles drawn
 * @remarks
 * Drawn one at a time, because the pile can run out mid-draw and then has to
 * be made up again from what has been spent - "gibt es keine verdeckten
 * Fischplättchen mehr, dreht ihr die offen liegenden Plättchen um, mischt sie
 * und bildet damit den neuen Vorrat".
 */
function fishOut(game: CatanGame, rolled: number): CatanGame {
  let next = game;
  for (const seat of realSeats(game)) {
    const owed = fishEarned(next, seat, rolled);
    for (let tile = 0; tile < owed; tile++) {
      next = drawFish(next, seat);
    }
  }
  return next;
}

/**
 * Draws one fish tile for a seat.
 *
 * @param game - the game
 * @param seat - who is drawing
 * @returns the game with the tile in front of them
 * @remarks
 * Two rules meet here and both are in the rulebook. The Alter Schuh is turned
 * face up the moment it is drawn - "musst du es sofort aufdecken" - and it goes
 * to whoever drew it. And a seat already holding seven tiles takes nothing:
 * "hast du bereits 7 Fischplättchen... darfst du stattdessen eines deiner
 * Plättchen gegen ein anderes aus dem Vorrat austauschen", which comes to the
 * same thing as a swap and is drawn here as one.
 */
function drawFish(game: CatanGame, seat: number): CatanGame {
  const filled = refillFish(game);
  const tile = filled.fishPile[0];
  let next = filled;
  if (tile !== undefined) {
    const rest = filled.fishPile.slice(1);
    if (tile === OLD_SHOE) {
      next = note(
        { ...filled, fishPile: rest, shoe: seat },
        `${nameOf(filled, seat)}: zieht den Alten Schuh.`,
      );
    } else {
      const held = filled.players[seat].fish;
      // Seven is the ceiling. Over it the draw is a swap: the new tile comes
      // in and the smallest one goes back, which is the exchange the rulebook
      // offers in the only shape that has anything to choose from.
      const kept =
        held.length < MAX_TILES ? [...held, tile] : swapSmallest(held, tile);
      const shed = held.length < MAX_TILES ? [] : [smallestOf(held)];
      next = withPlayer(
        {
          ...filled,
          fishPile: rest,
          fishSpent: [...filled.fishSpent, ...shed],
        },
        seat,
        { ...filled.players[seat], fish: kept },
      );
    }
  }
  return next;
}

/** Puts the spent tiles back under the pile once it has run dry. */
function refillFish(game: CatanGame): CatanGame {
  const random = createRandom(game.seed);
  return game.fishPile.length > 0 || game.fishSpent.length === 0
    ? game
    : {
        ...game,
        seed: random.state(),
        fishPile: shuffle(random, game.fishSpent),
        fishSpent: [],
      };
}

/** The tile worth least, which is the one a full hand gives up. */
function smallestOf(tiles: readonly number[]): number {
  return tiles.reduce((least, tile) => (tile < least ? tile : least), tiles[0]);
}

/** A full hand with its smallest tile traded for a new one. */
function swapSmallest(
  tiles: readonly number[],
  incoming: number,
): readonly number[] {
  const gone = tiles.indexOf(smallestOf(tiles));
  return [...tiles.slice(0, gone), ...tiles.slice(gone + 1), incoming];
}

/**
 * Spends fish tiles on one of the five actions.
 *
 * @param game - the game
 * @param seat - who is spending
 * @param action - which action
 * @param tiles - the tiles being handed in, by index into their hand
 * @returns the game after it, or null if it was not allowed
 * @remarks
 * "Gibst du mehr Fische aus, als die Aktion kostet, verfallen die überzähligen
 * Fische" - so this checks the total is **enough** and never gives change. And
 * the actions are one at a time: "es ist nicht erlaubt, z. B. 2 Plättchen mit
 * je 3 Fischen abzugeben und damit den Räuber vom Spielfeld zu entfernen und 1
 * beliebigen Rohstoff aus dem Vorrat zu nehmen."
 */
function doFish(
  game: CatanGame,
  seat: number,
  action: FishAction,
  tiles: readonly number[],
): CatanGame | null {
  const held = game.players[seat].fish;
  const chosen = [...new Set(tiles)].filter(
    (at) => Number.isInteger(at) && at >= 0 && at < held.length,
  );
  const paid = chosen.reduce((sum, at) => sum + held[at], 0);
  let next: CatanGame | null = null;
  if (fishing(game) && game.phase === "trade" && paid >= FISH_COST[action]) {
    const spent = chosen.map((at) => held[at]);
    const left = held.filter((unused, at) => !chosen.includes(at));
    const after = withPlayer(
      { ...game, fishSpent: [...game.fishSpent, ...spent] },
      seat,
      { ...game.players[seat], fish: left },
    );
    next = fishAction(
      note(
        after,
        `${nameOf(game, seat)}: gibt ${paid} Fisch(e) für ${FISH_ACTION_NAMES[action]}.`,
      ),
      seat,
      action,
    );
  }
  return next;
}

/** What each of the five fish actions does. */
function fishAction(
  game: CatanGame,
  seat: number,
  action: FishAction,
): CatanGame {
  let next: CatanGame;
  switch (action) {
    case "robber":
      // "Entferne den Räuber vom Spielfeld. Mit der nächsten '7' kommt er
      // allerdings wieder ins Spiel."
      next = { ...game, robber: OFF_BOARD };
      break;
    case "steal":
      next = { ...game, phase: "steal", targets: anybodyHolding(game, seat) };
      break;
    case "take":
      next = { ...game, phase: "erfindung", gifts: 1 };
      break;
    case "road":
      next = { ...game, freeRoads: game.freeRoads + 1 };
      break;
    default:
      // "Nimm dir kostenlos 1 Entwicklungskarte." Fresh like a bought one, so
      // it cannot be played in the turn it arrives.
      next =
        game.stack.length === 0
          ? game
          : withPlayer({ ...game, stack: game.stack.slice(1) }, seat, {
              ...game.players[seat],
              fresh: [...game.players[seat].fresh, game.stack[0]],
            });
  }
  return next;
}

/**
 * Passes the Alter Schuh on.
 *
 * @param game - the game
 * @param seat - who is holding it
 * @param to - who is being given it
 * @returns the game with the tile moved, or null
 * @remarks
 * "Frühestens wenn du das nächste Mal an der Reihe bist, darfst du das
 * Plättchen an eine beliebige andere Person weitergeben, die gleich viele oder
 * **mehr** Siegpunkte als du besitzt." So it only ever travels upwards, which
 * is what stops it circling between two players for ever.
 */
function passShoe(game: CatanGame, seat: number, to: number): CatanGame | null {
  return fishing(game) &&
    game.shoe === seat &&
    game.phase === "trade" &&
    to !== seat &&
    realSeats(game).includes(to) &&
    pointsOf(game, to) >= pointsOf(game, seat)
    ? note(
        { ...game, shoe: to },
        `${nameOf(game, seat)}: reicht den Alten Schuh an ${nameOf(game, to)} weiter.`,
      )
    : null;
}

/**
 * The fish tile a second founding settlement on a fishing area earns.
 *
 * @param game - the game
 * @param seat - who founded
 * @param at - the crossing
 * @returns the game, with one tile drawn if the spot fishes
 */
function foundingFish(game: CatanGame, seat: number, at: number): CatanGame {
  const spots = fishingSpots(game);
  return fishing(game) && (spots[at]?.length ?? 0) > 0
    ? drawFish(game, seat)
    : game;
}

/**
 * Builds a bridge across a river.
 *
 * @param game - the game
 * @param seat - who is building
 * @param at - the bridge site
 * @returns the game after it, or null
 * @remarks
 * A bridge is written into `roads` as well as into `bridges`, and that is the
 * whole trick: "sie zählt innerhalb einer Längsten Handelsroute wie eine
 * Straße", and it is what a settlement may hang off. Every road rule then
 * applies to it unchanged, and `bridges` is only the record of **which** of a
 * seat's roads are bridges - for the drawing, and for counting the three each
 * player has.
 *
 * It earns three gold, which is why it is worth building even where a road
 * would do.
 */
function doBridge(game: CatanGame, seat: number, at: number): CatanGame | null {
  const player = game.players[seat];
  const allowed =
    bridgeSite(game, at) &&
    game.roads[at] === null &&
    player.bridgesLeft > 0 &&
    touchesNetwork(game, seat, at) &&
    covers(player.hand, BRIDGE_PRICE);
  return allowed
    ? goldTilesOf(
        checkWinner(
          awardTiles(
            note(
              spend(
                withGold(
                  withPlayer(
                    {
                      ...game,
                      roads: game.roads.map((owner, path) =>
                        path === at ? seat : owner,
                      ),
                      bridges: game.bridges.map((owner, path) =>
                        path === at ? seat : owner,
                      ),
                    },
                    seat,
                    { ...player, bridgesLeft: player.bridgesLeft - 1 },
                  ),
                  seat,
                  GOLD_FOR_BRIDGE,
                ),
                seat,
                BRIDGE_PRICE,
              ),
              `${nameOf(game, seat)}: baut eine Brücke und erhält ${GOLD_FOR_BRIDGE} Gold.`,
            ),
          ),
        ),
      )
    : null;
}

/**
 * Whether a bridge site touches something of this seat's.
 *
 * @remarks
 * "Eine Brücke muss an eine eigene Straße oder Siedlung angebaut werden." The
 * same connection an ordinary road needs, asked here because a bridge site is
 * never a legal road spot and so never goes through {@link canRoad}.
 */
function touchesNetwork(game: CatanGame, seat: number, at: number): boolean {
  const board = islandOf(game.land.length);
  return board.paths[at].ends.some(
    (end) =>
      game.towns[end]?.owner === seat ||
      board.crossings[end].paths.some(
        (path) => path !== at && game.roads[path] === seat,
      ),
  );
}

/** Hands a seat some gold, and re-decides the two tiles. */
function withGold(game: CatanGame, seat: number, count: number): CatanGame {
  return count === 0
    ? game
    : withPlayer(game, seat, {
        ...game.players[seat],
        gold: game.players[seat].gold + count,
      });
}

/**
 * Re-decides who holds *Reichster* and *Armer Cataner*.
 *
 * @param game - the game
 * @returns the game with both tiles where they belong
 * @remarks
 * Asked after every change to anybody's gold rather than tracked, because both
 * tiles are pure functions of the gold on the table - and because the rulebook
 * describes them that way: the richest tile "ist grundsätzlich immer im Besitz
 * der Person, die allein das meiste Gold besitzt", and the poorest goes to
 * everybody at the bottom, however many that is.
 */
function goldTilesOf(game: CatanGame): CatanGame {
  const seats = realSeats(game);
  const held = goldTiles(game, seats);
  return rivers(game)
    ? { ...game, richest: held.richest, poorest: held.poorest }
    : game;
}

/**
 * Buys a resource with gold.
 *
 * @param game - the game
 * @param seat - who is buying
 * @param sort - what they want
 * @returns the game after it, or null
 * @remarks
 * "Bist du an der Reihe, darfst du in deinem Zug für je 2 Gold **bis zu
 * zweimal** einen beliebigen Rohstoff vom Vorrat kaufen. Dabei darfst du auch
 * das Gold einsetzen, das du im selben Zug erhalten hast." So the allowance is
 * per turn and the gold may be brand new.
 */
function doGoldBuy(
  game: CatanGame,
  seat: number,
  sort: Resource,
): CatanGame | null {
  return (rivers(game) || raiding(game) || finding(game)) &&
    game.phase === "trade" &&
    game.goldBuys < BUYS_PER_TURN &&
    game.players[seat].gold >= GOLD_PER_BUY
    ? goldTilesOf(
        note(
          withHand(
            withGold(
              { ...game, goldBuys: game.goldBuys + 1 },
              seat,
              -GOLD_PER_BUY,
            ),
            seat,
            withCard(game.players[seat].hand, sort),
          ),
          `${nameOf(game, seat)}: kauft ${SORT_NAMES[sort]} für ${GOLD_PER_BUY} Gold.`,
        ),
      )
    : null;
}

/**
 * Sells resources to the bank for gold.
 *
 * @param game - the game
 * @param seat - who is selling
 * @param sort - what they are handing over
 * @returns the game after it, or null
 * @remarks
 * "Gold erhalten: 4:1-Tausch mit dem Vorrat, Handel an eigenen Häfen." So the
 * rate is the seat's ordinary trading rate for that sort - a harbour makes gold
 * cheaper exactly as it makes anything else cheaper.
 */
function doGoldSell(
  game: CatanGame,
  seat: number,
  sort: Resource,
): CatanGame | null {
  const rate = tradeRate(game, seat, sort);
  return (rivers(game) || raiding(game) || finding(game)) &&
    game.phase === "trade" &&
    game.players[seat].hand[sort] >= rate
    ? goldTilesOf(
        note(
          withGold(
            withHand(
              game,
              seat,
              withCard(game.players[seat].hand, sort, -rate),
            ),
            seat,
            1,
          ),
          `${nameOf(game, seat)}: tauscht ${rate} ${SORT_NAMES[sort]} gegen 1 Gold.`,
        ),
      )
    : null;
}

/** The moves the player whose turn it is may make while an offer is open. */
const OFFER_MOVES: readonly string[] = ["deal", "withdraw"];

/**
 * Applies a move.
 *
 * @param game - the game as it stands
 * @param seat - who is trying to move
 * @param move - what they are trying to do
 * @returns the game that follows, or `null` if the move is not allowed
 */
export function applyMove(
  game: CatanGame,
  seat: number,
  move: CatanMove,
): CatanGame | null {
  const turn = seatOnTurn(game);
  let next: CatanGame | null = null;
  if (turn !== seat) {
    next = null;
  } else if (game.phase === "founding") {
    next = doFounding(game, seat, move);
  } else if (game.phase === "event") {
    next = doEvent(game, seat, move);
  } else if (game.phase === "discard") {
    next =
      move.kind === "discard"
        ? doDiscard(game, seat, move.cards, move.goods)
        : null;
  } else if (game.offer !== null && move.kind === "answer") {
    next = doAnswer(game, seat, move.yes);
  } else if (game.offer !== null && !OFFER_MOVES.includes(move.kind)) {
    next = null;
  } else {
    next = applyTurnMove(game, seat, move);
  }
  return next === null ? null : counted(next);
}

/** The moves of an ordinary turn, once the queues are out of the way. */
function applyTurnMove(
  game: CatanGame,
  seat: number,
  move: CatanMove,
): CatanGame | null {
  const rolled = game.phase === "trade";
  const building = rolled || game.freeRoads > 0;
  const handlers: Readonly<Record<string, () => CatanGame | null>> = {
    roll: () => (game.phase === "roll" ? doRoll(game) : null),
    robber: () =>
      // "Eine der beiden Figuren muss versetzt werden": at sea the seven puts
      // both on offer, so the robber's own move is accepted in the pirate's
      // phase as well as in its own.
      (game.phase === "robber" || (game.phase === "pirate" && sailing(game))) &&
      move.kind === "robber" &&
      robberSpots(game, game.robber).includes(move.at)
        ? placeRobber(game, seat, move.at)
        : null,
    rob: () =>
      game.phase === "steal" &&
      move.kind === "rob" &&
      game.targets.includes(move.seat)
        ? afterRobber(rob(game, seat, move.seat))
        : null,
    road: () =>
      building && move.kind === "road" ? doRoad(game, seat, move.at) : null,
    town: () =>
      rolled && move.kind === "town" ? doTown(game, seat, move.at) : null,
    city: () =>
      rolled && move.kind === "city" ? doCity(game, seat, move.at) : null,
    buy: () => (rolled ? doBuy(game, seat) : null),
    play: () =>
      (game.phase === "roll" || rolled) && move.kind === "play"
        ? doPlay(game, seat, move.card)
        : null,
    choose: () =>
      move.kind === "choose" ? doChoose(game, seat, move.sort) : null,
    bank: () =>
      rolled && move.kind === "bank"
        ? doBank(game, seat, move.give, move.want)
        : null,
    // Stein 2 may not trade with the other players: "Du darfst Rohstoffe nur
    // mit dem Vorrat tauschen (nicht aber mit den anderen Personen)."
    offer: () =>
      rolled && game.stone === 1 && move.kind === "offer"
        ? doOffer(game, seat, move.give, move.want)
        : null,
    answer: () => null,
    deal: () => (move.kind === "deal" ? doDeal(game, seat, move.seat) : null),
    withdraw: () => (game.offer === null ? null : { ...game, offer: null }),
    repair: () => (rolled ? doRepair(game, seat) : null),
    event: () => null,
    neutral: () =>
      game.phase === "neutral" && move.kind === "neutral"
        ? doNeutral(game, move.at, move.seat)
        : null,
    // "auch vor dem Würfeln" - so a chip action is legal in the rolling phase
    // as well as the building one.
    chip: () =>
      (game.phase === "roll" || rolled) && move.kind === "chip"
        ? doChip(game, seat, move.action)
        : null,
    improve: () =>
      rolled && move.kind === "improve"
        ? doImprove(game, seat, move.track)
        : null,
    wall: () => (rolled ? doWall(game, seat) : null),
    knight: () =>
      rolled && move.kind === "knight" ? doKnight(game, seat, move.at) : null,
    activate: () =>
      rolled && move.kind === "activate"
        ? doActivate(game, seat, move.at)
        : null,
    upgrade: () =>
      rolled && move.kind === "upgrade" ? doUpgrade(game, seat, move.at) : null,
    march: () =>
      move.kind === "march" ? doMarch(game, seat, move.from, move.to) : null,
    progress: () =>
      move.kind === "progress" ? doProgress(game, seat, move.card) : null,
    answerCard: () =>
      move.kind === "answerCard" ? answerProgress(game, seat, move) : null,
    fish: () =>
      move.kind === "fish" ? doFish(game, seat, move.action, move.tiles) : null,
    shoe: () => (move.kind === "shoe" ? passShoe(game, seat, move.seat) : null),
    bridge: () =>
      rolled && move.kind === "bridge" ? doBridge(game, seat, move.at) : null,
    goldBuy: () =>
      rolled && move.kind === "goldBuy"
        ? doGoldBuy(game, seat, move.sort)
        : null,
    goldSell: () =>
      rolled && move.kind === "goldSell"
        ? doGoldSell(game, seat, move.sort)
        : null,
    chase: () =>
      rolled && move.kind === "chase" ? doChase(game, seat, move.at) : null,
    knightIn: () =>
      game.phase === "roll" || rolled ? doKnightIn(game, seat) : null,
    giveBack: () =>
      move.kind === "giveBack" ? doGiveBack(game, seat, move.cards) : null,
    endTurn: () => endOfTurn(game, seat, rolled),
    boat: () => (move.kind === "boat" ? doBoat(game, seat, move.at) : null),
    unload: () =>
      move.kind === "unload"
        ? doUnload(game, seat, move.boat, move.cargo)
        : null,
    recall: () =>
      move.kind === "recall" ? doRecall(game, seat, move.boat) : null,
    unit: () => (move.kind === "unit" ? doUnit(game, seat, move.at) : null),
    cast: () => (move.kind === "cast" ? doCast(game, seat) : null),
    assault: () => doAssault(game, seat),
    wonder: () =>
      move.kind === "wonder" ? doWonder(game, seat, move.which) : null,
    drop: () => (move.kind === "drop" ? doDrop(game, seat, move.at) : null),
    sell: () => (move.kind === "sell" ? doSell(game, seat, move.sort) : null),
    catch: () => (move.kind === "catch" ? doCatch(game, seat, move.at) : null),
    deliver: () =>
      move.kind === "deliver" ? doDeliver(game, seat, move.at) : null,
    storm: () => (move.kind === "storm" ? doStorm(game, seat, move.at) : null),
    hunt: () => (move.kind === "hunt" ? doHunt(game, seat, move.boat) : null),
    corsair: () =>
      move.kind === "corsair" ? doCorsair(game, seat, move.at) : null,
    scout: () => (move.kind === "scout" ? doScout(game, seat, move.at) : null),
    port: () => (move.kind === "port" ? doPort(game, seat, move.at) : null),
    helm: () => (move.kind === "helm" ? doHelm(game, seat, move.boat) : null),
    sail2: () => (move.kind === "sail2" ? doSail2(game, seat, move.at) : null),
    wind: () => doWind(game, seat),
    load: () => (move.kind === "load" ? doLoad(game, seat, move.at) : null),
    landfall: () =>
      move.kind === "landfall" ? doLandfall(game, seat, move.at) : null,
    ship: () =>
      (rolled || game.freeRoads > 0) && move.kind === "ship"
        ? doShip(game, seat, move.at)
        : null,
    sail: () =>
      rolled && move.kind === "sail"
        ? doSail(game, seat, move.from, move.to)
        : null,
    pirate: () =>
      move.kind === "pirate" ? doPirate(game, seat, move.at) : null,
    gold: () =>
      move.kind === "gold" ? doGoldPick(game, seat, move.sort) : null,
    drive: () => (move.kind === "drive" ? doDrive(game, seat, move.at) : null),
    boost: () => doBoost(game, seat),
    shove: () => (move.kind === "shove" ? doShove(game, seat, move.at) : null),
    shift: () => (move.kind === "shift" ? doShift(game, seat, move.at) : null),
    tableau: () => (rolled ? doTableau(game, seat) : null),
    haulCard: () =>
      move.kind === "haulCard" ? doHaulCard(game, seat, move.card) : null,
    post: () => (move.kind === "post" ? doPost(game, seat, move.at) : null),
    barb: () =>
      move.kind === "barb" ? doBarbarian(game, seat, move.at) : null,
    ride: () =>
      move.kind === "ride"
        ? doRide(game, seat, move.from, move.to, move.far === true)
        : null,
    lay: () => (move.kind === "lay" ? doLay(game, seat, move.cards) : null),
    vote: () => (move.kind === "vote" ? doVote(game, seat, move.at) : null),
    wagon: () => (move.kind === "wagon" ? doWagon(game, seat, move.at) : null),
  };
  return handlers[move.kind]?.() ?? null;
}

/**
 * Whether the turn that is ending owes the table a wagon.
 *
 * @param game - the game
 * @returns true when a settlement or city went up and there is still somewhere
 *   to put a wagon
 * @remarks
 * "Baust du in deinem Zug eine oder mehrere Siedlungen oder baust eine oder
 * mehrere Siedlungen zu einer Stadt aus, wird nach Beendigung deines Zuges
 * genau 1 Trosswagen eingesetzt." One wagon per turn, however much was built -
 * and none at all once the supply is empty or all three caravans are boxed in,
 * because then there is nothing to vote about.
 */
function owesWagon(game: CatanGame): boolean {
  return caravans(game) && game.built && wagonSpots(game).length > 0;
}

/** Notes that something went up that the nomads will want to follow. */
function withBuilt(game: CatanGame): CatanGame {
  return caravans(game) ? { ...game, built: true } : game;
}

/**
 * Opens the voting round.
 *
 * @param game - the game whose turn has just ended
 * @returns the game waiting for the first seat to lay cards down
 * @remarks
 * "Beginnend mit der Person, die gerade an der Reihe war und eine Siedlung bzw.
 * Stadt gebaut hat, dürfen alle nacheinander im Uhrzeigersinn offen eine oder
 * mehrere Wolle- oder Getreidekarten auslegen."
 */
function callVote(game: CatanGame): CatanGame {
  const caller = actingSeat(game);
  const seats = realSeats(game);
  const start = seats.indexOf(caller);
  return note(
    {
      ...game,
      phase: "vote",
      vote: {
        caller,
        order: seats.map(
          (unused, step) => seats[(start + step) % seats.length],
        ),
        laid: game.players.map(() => 0),
        picks: game.players.map(() => null),
        step: 0,
        stage: "lay",
        decider: null,
        queue: [],
        grown: [],
      },
    },
    "Die Nomaden schicken einen Trosswagen - es wird abgestimmt.",
  );
}

/**
 * Lays wool or grain down as votes.
 *
 * @param game - the game
 * @param seat - who is laying
 * @param cards - what they are putting on the table, possibly nothing
 * @returns the game after it, or null
 * @remarks
 * The cards are gone the moment they are laid: "anschließend geben alle ihre
 * eingesetzten Wolle- und Getreidekarten in den Vorrat ab", and taking them
 * away now rather than at the end of the round is the same outcome with one
 * less thing to remember. "Wichtig: Alle haben nur einmal die Möglichkeit,
 * Karten auszulegen" - which is why the round walks the seats once and never
 * comes back.
 */
function doLay(game: CatanGame, seat: number, cards: Hand): CatanGame | null {
  const vote = game.vote;
  const ballot = RESOURCES.every(
    (sort) => cards[sort] >= 0 && (BALLOT.includes(sort) || cards[sort] === 0),
  );
  const allowed =
    vote !== null &&
    vote.stage === "lay" &&
    vote.order[vote.step] === seat &&
    ballot &&
    covers(game.players[seat].hand, cards);
  let next: CatanGame | null = null;
  if (allowed && vote !== null) {
    const count = handSize(cards);
    const paid =
      count === 0
        ? game
        : note(
            spend(game, seat, cards),
            `${nameOf(game, seat)}: legt ${count} Karte(n) für die Abstimmung aus.`,
          );
    next = afterLay({
      ...paid,
      vote: {
        ...vote,
        laid: vote.laid.map((held, at) => (at === seat ? held + count : held)),
        step: vote.step + 1,
      },
    });
  }
  return next;
}

/**
 * What happens once everybody has had their one chance to lay cards.
 *
 * @param game - the game
 * @returns the game at whatever the round asks for next
 * @remarks
 * Two shortcuts before anybody assigns a vote. "Hat eine Person allein mehr
 * Stimmen als alle anderen Personen zusammen, entscheidet sie allein" - there
 * is nothing left to negotiate. And if nobody laid anything at all, rule three
 * applies straight away: the person whose turn it was decides, "auch wenn sie
 * keine Stimme abgegeben hat".
 */
function afterLay(game: CatanGame): CatanGame {
  const vote = game.vote;
  let next = game;
  if (vote !== null && vote.step >= vote.order.length) {
    const sole = soleVoice(vote.laid);
    const total = vote.laid.reduce((sum, count) => sum + count, 0);
    if (sole !== null) {
      const [first, ...rest] = placersFor(game, sole);
      next = toPlace(game, first, rest);
    } else if (total === 0) {
      const [first, ...rest] = placersFor(game, null);
      next = toPlace(game, first, rest);
    } else {
      next = {
        ...game,
        vote: {
          ...vote,
          stage: "assign",
          step: vote.order.findIndex((at) => vote.laid[at] > 0),
        },
      };
    }
  }
  return next;
}

/**
 * Puts one seat's votes on one position.
 *
 * @param game - the game
 * @param seat - who is voting
 * @param at - the path they want the wagon on
 * @returns the game after it, or null
 * @remarks
 * "Die Stimmen einer Person dürfen nicht auf mehrere Positionen verteilt
 * werden", so the move carries a place and not a count: whatever they laid goes
 * there, all of it.
 */
function doVote(game: CatanGame, seat: number, at: number): CatanGame | null {
  const vote = game.vote;
  const allowed =
    vote !== null &&
    vote.stage === "assign" &&
    vote.order[vote.step] === seat &&
    vote.laid[seat] > 0 &&
    wagonSpots(game).includes(at);
  let next: CatanGame | null = null;
  if (allowed && vote !== null) {
    const voted: Vote = {
      ...vote,
      picks: vote.picks.map((pick, who) => (who === seat ? at : pick)),
    };
    const ahead = voted.order.findIndex(
      (who, step) => step > voted.step && voted.laid[who] > 0,
    );
    next = note(
      ahead === -1
        ? afterAssign({ ...game, vote: voted })
        : { ...game, vote: { ...voted, step: ahead } },
      `${nameOf(game, seat)}: stimmt mit ${vote.laid[seat]} Stimme(n) ab.`,
    );
  }
  return next;
}

/**
 * What the assigned votes come to.
 *
 * @param game - the game
 * @returns the wagon placed, or the game waiting for whoever decides
 * @remarks
 * The rulebook's three steps in order: a position with the most votes wins
 * outright; failing that the person with the most votes chooses; failing that
 * the person whose turn it was chooses.
 */
function afterAssign(game: CatanGame): CatanGame {
  const vote = game.vote;
  let next = game;
  if (vote !== null) {
    const spot = chosenSpot(vote);
    const [first, ...rest] = placersFor(game, loudest(vote.laid));
    next =
      spot !== null
        ? // The table has said where the first one goes; a second one, if this
          // table owes one, is still somebody's to place.
          placeWagon(playingTwo(game) ? toPlace(game, first, rest) : game, spot)
        : toPlace(game, first, rest);
  }
  return next;
}

/**
 * Hands the decision to one person, and says who follows them.
 *
 * @param game - the game
 * @param decider - who puts the wagon down
 * @param after - who puts the next one down, at a table of two
 * @returns the game waiting for them
 */
function toPlace(
  game: CatanGame,
  decider: number,
  after: readonly number[] = [],
): CatanGame {
  const vote = game.vote;
  return vote === null
    ? game
    : {
        ...game,
        vote: { ...vote, stage: "place", decider, queue: after },
      };
}

/**
 * Who places the two wagons of a round at a table of two.
 *
 * @param game - the game
 * @param winner - who won the vote, or null when nobody did
 * @returns the placers in order, one entry per wagon
 * @remarks
 * "Wer die Abstimmung gewinnt, setzt 2 Trosswagen ein ... Bei einem
 * Unentschieden setzen beide 1 Trosswagen ein. Zuerst die Person, die an der
 * Reihe war, und anschließend die andere Person." At a bigger table a round is
 * one wagon and this is a list of one.
 */
function placersFor(game: CatanGame, winner: number | null): readonly number[] {
  const vote = game.vote;
  const caller = vote?.caller ?? actingSeat(game);
  const other = realSeats(game).find((seat) => seat !== caller) ?? caller;
  return !playingTwo(game)
    ? [winner ?? caller]
    : winner === null
      ? [caller, other]
      : [winner, winner];
}

/** Places the wagon the table has settled on. */
function doWagon(game: CatanGame, seat: number, at: number): CatanGame | null {
  const vote = game.vote;
  return vote !== null &&
    vote.stage === "place" &&
    vote.decider === seat &&
    wagonSpots(game).includes(at)
    ? placeWagon(game, at)
    : null;
}

/**
 * Puts a wagon on a path and ends the voting round.
 *
 * @param game - the game
 * @param at - the path
 * @returns the next player's turn, or the finished game
 * @remarks
 * Two caravans that have grown to the same crossing become one here: "treffen
 * sich zwei Handelstrosse an einer Kreuzung, wachsen sie mit dem nächsten
 * eingesetzten Trosswagen zusammen und werden als ein einziger Handelstross
 * fortgeführt." The swallowed one keeps its wagons on the board - they are what
 * makes the merged route long - and only stops growing on its own.
 *
 * The winner is checked before the turn passes, because a wagon can be what
 * puts a settlement between two of them and so hand the person who built it
 * their twelfth point.
 */
function placeWagon(game: CatanGame, at: number): CatanGame {
  const which = caravanFor(game, at);
  let next = game;
  if (which !== null) {
    const board = islandOf(game.land.length);
    const from = game.caravans[which].head;
    const [one, other] = board.paths[at].ends;
    const head = one === from ? other : one;
    next = note(
      {
        ...game,
        wagons: game.wagons.map((owner, path) => (path === at ? which : owner)),
        wagonsLeft: game.wagonsLeft - 1,
        caravans: game.caravans.map((caravan, index) =>
          index === which
            ? { ...caravan, paths: [...caravan.paths, at], head }
            : caravan.paths.length > 0 &&
                !caravan.merged &&
                caravan.head === from
              ? { ...caravan, merged: true }
              : caravan,
        ),
      },
      "Ein Trosswagen wird eingesetzt.",
    );
  }
  const grown =
    which === null || next.vote === null
      ? next
      : {
          ...next,
          vote: {
            ...next.vote,
            grown: [...next.vote.grown, which],
          },
        };
  return endVote(checkWinner(awardTiles(grown)));
}

/**
 * Closes the voting round, or hands it to the next placer.
 *
 * @param game - the game with the wagon down
 * @returns the next turn, the finished game, or the round waiting again
 * @remarks
 * A round is one wagon everywhere except at a table of two, where it is two -
 * and even there the second one is only placed if a **different** caravan can
 * still take it.
 */
function endVote(game: CatanGame): CatanGame {
  const vote = game.vote;
  const [next, ...rest] = vote?.queue ?? [];
  const more =
    game.winner === null &&
    vote !== null &&
    next !== undefined &&
    wagonSpots(game).length > 0;
  return more && vote !== null
    ? {
        ...game,
        vote: { ...vote, stage: "place", decider: next, queue: rest },
      }
    : game.winner === null
      ? nextTurn({ ...game, vote: null })
      : { ...game, vote: null };
}

/**
 * What "Zug beenden" does.
 *
 * @param game - the game
 * @param seat - who is ending
 * @param rolled - whether the dice have been thrown this turn
 * @returns the game after it, or null while something is still owed
 * @remarks
 * Three things can come between a player and the next turn, and they come in
 * this order: the knights ride, the table votes on a wagon, and the turn
 * passes. Each belongs to a different scenario, and none of them ever meet.
 */
function endOfTurn(
  game: CatanGame,
  seat: number,
  rolled: boolean,
): CatanGame | null {
  let next: CatanGame | null = null;
  if (game.phase === "knights") {
    // "Der Zug eines Ritters darf niemals auf einem Weg des Burgfeldes enden",
    // so one still standing there has to leave before the turn can.
    next = ridesOwed(game, seat) ? null : passTurn(holdCoast(game));
  } else if (game.phase === "sailing") {
    // "Setzt du die dritte Einheit auf ein Piratenlager, fuehrst du zunaechst
    // deine Bewegungsphase zu Ende durch" - so the conquests are settled here,
    // once every ship has finished.
    const after = takeCamps({ ...game, phase: "trade", sailing: null }, seat);
    next = after.winner === null ? passTurn(after) : after;
  } else if (game.phase === "driving") {
    // "Gute Reise" hands out a whole second drive, and the rulebook makes it
    // conditional on the first one having happened - which it has, here.
    next = endDrive(game, seat);
  } else if (rolled && game.neutralBuild === null && game.swapWith === null) {
    next = sailsLeft(game, seat)
      ? startSailing(game)
      : ridesLeft(game, seat)
        ? { ...game, phase: "knights" }
        : drivesLeft(game, seat)
          ? startDrive(game, seat)
          : raiding(game)
            ? passTurn(holdCoast(game))
            : passTurn(game);
  }
  return next;
}

/** Whether this seat has a knight of its own that could still ride. */
function ownRides(game: CatanGame, seat: number): boolean {
  return (
    raiding(game) &&
    game.guards.some(
      (owner, at) =>
        owner === seat &&
        !game.ridden.includes(at) &&
        rideSpots(game, at, KNIGHT_STEPS).length > 0,
    )
  );
}

/** Whether the Fremder Ritter still has a ride in him this turn. */
function strangerRides(game: CatanGame): boolean {
  const at = strangerAt(game);
  return (
    at !== null &&
    !game.ridden.includes(at) &&
    rideSpots(game, at, KNIGHT_STEPS).length > 0
  );
}

/** Whether a ride could still be made this turn - one's own or the stranger's. */
function ridesLeft(game: CatanGame, seat: number): boolean {
  return ownRides(game, seat) || strangerRides(game);
}

/** The turn passing, with whatever the scenario puts in its way. */
function passTurn(game: CatanGame): CatanGame {
  // Once a turn, not once a move: both questions walk the whole board for every
  // seat, and neither of them can become true in the middle of a turn without
  // becoming true at the end of it as well.
  const stuck = game.winner !== null ? null : deadEnd(game);
  if (stuck !== null) {
    const won = clothWinner(game);
    return note(
      { ...game, phase: "gameOver", winner: won, offer: null },
      `${nameOf(game, won)}: gewinnt - ${stuck}`,
    );
  }
  // "Nach Beendigung deines Zuges wird genau 1 Trosswagen eingesetzt." At a
  // table of two the Zug is both stones, so the vote waits for the second one
  // rather than coming between them.
  return game.winner !== null
    ? game
    : owesWagon(game) && !(sharesTurns(game) && game.stone === 1)
      ? callVote(game)
      : nextTurn(game);
}

/**
 * What follows a settlement or a city going up.
 *
 * @param game - the game with the building already up
 * @param seat - who built
 * @returns the game with the raid over, or unchanged outside this scenario
 * @remarks
 * "Jedes Mal, wenn jemand eine Siedlung oder Stadt gebaut hat, findet sofort
 * nach dem Bau ein Barbarenüberfall statt." Every time, so a turn that builds
 * three things brings three raids down - which is the price of building here.
 */
function afterBuilding(game: CatanGame, seat: number): CatanGame {
  return raiding(game) && game.phase !== "founding"
    ? raidCoast(game, seat)
    : game;
}

/**
 * The barbarian raid that follows a settlement or a city.
 *
 * @param game - the game, with the building already up
 * @param seat - who built
 * @returns the game with the raid resolved
 * @remarks
 * "Unterbrich deinen Zug und würfle mit beiden Augenwürfeln drei verschiedene
 * Zahlen aus. Würfelst du eine '7' oder eine Zahl, die du bereits gewürfelt
 * hast, würfelst du so lange noch einmal, bis du eine andere Zahl erhältst."
 *
 * Three numbers, not three barbarians: a field that is already full takes none
 * and the roll is **not** repeated for it - "es geschieht also nichts und der
 * Würfelwurf wird nicht wiederholt". The whole thing is a consequence and not a
 * decision, so it runs to the end here rather than becoming a phase.
 */
function raidCoast(game: CatanGame, seat: number): CatanGame {
  const random = createRandom(game.seed);
  const rolled: number[] = [];
  let next = game;
  while (rolled.length < RAID_ROLLS && next.barbariansLeft > 0) {
    const dice = throwDice(random);
    const number = dice[0] + dice[1];
    if (number !== SEVEN && !rolled.includes(number)) {
      rolled.push(number);
      next = landBarbarian(next, number);
    }
  }
  return note(
    { ...next, seed: random.state() },
    `${nameOf(game, seat)}: löst einen Barbarenüberfall aus (${rolled.join(", ")}).`,
  );
}

/**
 * One barbarian, onto the coast field with that number.
 *
 * @param game - the game
 * @param number - the number rolled
 * @returns the game with the barbarian down, or unchanged
 * @remarks
 * The third one takes the field: "sobald du den dritten Barbaren auf ein
 * Küstenfeld stellst, drehst du den Zahlenchip auf diesem Feld um." The chip
 * is not turned here - `barbarians` already says three, and everything that
 * asks whether a field has fallen asks {@link conquered}. One truth, one place.
 */
function landBarbarian(game: CatanGame, number: number): CatanGame {
  const hex = game.fort.coast.find(
    (at) => game.chips[at] === number && raidable(game, at),
  );
  return hex === undefined
    ? game
    : {
        ...game,
        barbarians: game.barbarians.map((count, at) =>
          at === hex ? count + 1 : count,
        ),
        barbariansLeft: game.barbariansLeft - 1,
      };
}

/**
 * Draws and plays the top card of this scenario's own deck.
 *
 * @param game - the game
 * @param seat - who is buying
 * @returns the game with the card in force, or waiting for its answer
 * @remarks
 * "Kaufst du eine Entwicklungskarte, musst du sie sofort aufdecken und die
 * Anweisungen der Karte ausführen." Nothing is held, so there is no hand of
 * development cards in this scenario at all - and "ist der Stapel aufgebraucht,
 * mischst du den Ablagestapel und bildest damit den neuen Stapel", so the deck
 * is a ring.
 */
function drawRaidCard(game: CatanGame, seat: number): CatanGame | null {
  const deck =
    game.raidDeck.length > 0
      ? game.raidDeck
      : shuffle(createRandom(game.seed), game.raidUsed);
  const used = game.raidDeck.length > 0 ? game.raidUsed : [];
  const card = deck[0];
  return card === undefined || !covers(game.players[seat].hand, DEV_COST)
    ? null
    : raidEffect(
        note(
          spend(
            {
              ...game,
              raidDeck: deck.slice(1),
              raidUsed: [...used, card],
              raidCard: card,
            },
            seat,
            DEV_COST,
          ),
          `${nameOf(game, seat)}: deckt ${RAID_CARD_NAMES[card]} auf.`,
        ),
        seat,
        card,
      );
}

/** What each of the four cards does. */
function raidEffect(game: CatanGame, seat: number, card: RaidCard): CatanGame {
  const effects: Readonly<Record<RaidCard, () => CatanGame>> = {
    // "Stelle 1 Ritter auf einem freien der 6 Wege des Burgfeldes auf."
    ritterweihe: () => askPost(game, "castle"),
    // "Du darfst 1 Ritter auf einem beliebigen freien Weg einsetzen."
    starkerRitter: () => askPost(game, "any"),
    // "Du erhältst 2 Gold. Entferne 2 Barbaren von 2 verschiedenen
    // Landschaftsfeldern und setze diese auf 2 anderen, noch nicht eroberten
    // wieder ein."
    verrat: () =>
      askBarbarians(
        withGold(game, seat, VERRAT_GOLD),
        VERRAT_MOVES,
        VERRAT_MOVES,
      ),
    // "Entferne 1 Barbaren von einem beliebigen Landschaftsfeld und lege ihn zu
    // deinen Gefangenen." Taken and not put back down anywhere.
    gefangen: () => askBarbarians(game, 1, 0),
  };
  return effects[card]();
}

/** Asks for a path to put a knight on, or skips the card if there is none. */
function askPost(game: CatanGame, where: "castle" | "any"): CatanGame {
  const seat = actingSeat(game);
  return guardsLeft(game, seat) > 0 && postSpots(game, where).length > 0
    ? { ...game, phase: "posting", posting: where }
    : note(game, "Kein Ritter frei - die Karte verfällt.");
}

/** Asks for the barbarians a card moves, or skips it if there are none. */
function askBarbarians(game: CatanGame, take: number, put: number): CatanGame {
  // "Sollte es keine Barbaren mehr auf dem Spielfeld geben, lege diese Karte ab
  // und ziehe eine neue" - which comes to the same thing as the card doing
  // nothing, since the next card is a purchase away.
  const asked = { ...game, barbTake: take, barbPut: put };
  return barbariansOwed(asked)
    ? { ...asked, phase: "barbarians" }
    : note(game, "Keine Barbaren zu versetzen - die Karte verfällt.");
}

/** Where a knight from a card may go. */
export function postSpots(
  game: CatanGame,
  where: "castle" | "any",
): readonly number[] {
  const board = islandOf(game.land.length);
  return where === "castle"
    ? game.fort.gates.filter((at) => game.guards[at] === null)
    : board.paths
        .filter(
          (path) =>
            game.guards[path.id] === null &&
            !game.fort.gates.includes(path.id) &&
            freePath(game, path.id),
        )
        .map((path) => path.id);
}

/** Puts a knight on a path. */
function doPost(game: CatanGame, seat: number, at: number): CatanGame | null {
  const where = game.posting;
  return where !== null &&
    game.phase === "posting" &&
    postSpots(game, where).includes(at)
    ? withStranger(
        note(
          {
            ...game,
            guards: game.guards.map((owner, path) =>
              path === at ? seat : owner,
            ),
            phase: "trade",
            posting: null,
            raidCard: null,
          },
          `${nameOf(game, seat)}: setzt einen Ritter ein.`,
        ),
      )
    : null;
}

/**
 * Puts the Fremder Ritter out, the first time anybody trains a knight.
 *
 * @param game - the game, with that knight already standing
 * @returns the game with the neutral knight beside it, or unchanged
 * @remarks
 * "Sobald eine Person ihren ersten Ritter baut, setzt sie den Fremden Ritter
 * auf einem Weg des Burgfelds ein." The rulebook lets that person choose the
 * path; here the referee takes the first free one, the way it places every
 * other piece that belongs to nobody. The choice is small - all six castle
 * paths lead into the same country, and whoever is on turn moves him off it
 * before the turn ends anyway.
 */
function withStranger(game: CatanGame): CatanGame {
  const seat = strangerSeat(game);
  const free = postSpots(game, "castle");
  return seat === null || strangerAt(game) !== null || free.length === 0
    ? game
    : note(
        {
          ...game,
          guards: game.guards.map((owner, path) =>
            path === free[0] ? seat : owner,
          ),
        },
        "Der Fremde Ritter kommt ins Spiel.",
      );
}

/** The fields a card may take a barbarian from. */
export function takeSpots(game: CatanGame): readonly number[] {
  return game.fort.coast.filter((hex) => (game.barbarians[hex] ?? 0) > 0);
}

/** The fields a card may put a barbarian on. */
export function putSpots(game: CatanGame): readonly number[] {
  return game.fort.coast.filter((hex) => raidable(game, hex));
}

/**
 * Takes a barbarian off a field, or puts one down.
 *
 * @param game - the game
 * @param seat - whose card it is
 * @param at - the field
 * @returns the game after it, or null
 * @remarks
 * "Wird ein Barbar von einem eroberten, also mit 3 Barbaren besetzten Feld
 * entfernt, wird eine angrenzende, eventuell eroberte Siedlung oder Stadt
 * wieder aufgerichtet. Der Zahlenchip wird auf die Zahlenseite gedreht." All of
 * that follows from the count going back to two, which is the only thing this
 * writes down.
 */
function doBarbarian(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  let next: CatanGame | null = null;
  if (game.phase !== "barbarians") {
    next = null;
  } else if (game.barbTake > 0 && takeSpots(game).includes(at)) {
    const caught = game.barbPut === 0;
    next = afterBarbarians(
      note(
        {
          ...game,
          barbarians: game.barbarians.map((count, hex) =>
            hex === at ? count - 1 : count,
          ),
          // Gefangen keeps the barbarian; Verrat hands it back to the supply
          // and takes one out again when it puts one down. Bookkeeping the
          // rulebook needs too: "gibt es nicht genug Barbaren, nimm sie vom
          // Vorrat" - which is exactly what a supply that has just grown does.
          barbariansLeft: caught
            ? game.barbariansLeft
            : game.barbariansLeft + 1,
          barbTake: game.barbTake - 1,
        },
        caught
          ? `${nameOf(game, seat)}: nimmt einen Barbaren gefangen.`
          : `${nameOf(game, seat)}: zieht einen Barbaren ab.`,
      ),
      seat,
      caught,
    );
  } else if (
    game.barbTake === 0 &&
    game.barbPut > 0 &&
    putSpots(game).includes(at)
  ) {
    next = afterBarbarians(
      note(
        {
          ...game,
          barbarians: game.barbarians.map((count, hex) =>
            hex === at ? count + 1 : count,
          ),
          barbariansLeft: Math.max(0, game.barbariansLeft - 1),
          barbPut: game.barbPut - 1,
        },
        `${nameOf(game, seat)}: setzt einen Barbaren um.`,
      ),
      seat,
      false,
    );
  }
  return next;
}

/** Hands a caught barbarian over, and ends the card when it is spent. */
function afterBarbarians(
  game: CatanGame,
  seat: number,
  caught: boolean,
): CatanGame {
  const held = caught
    ? withPlayer(game, seat, {
        ...game.players[seat],
        prisoners: game.players[seat].prisoners + 1,
      })
    : game;
  // The card is over when it has nothing left to do - which includes having
  // nowhere left to do it: the rulebook has Verrat put two barbarians back "auf
  // 2 anderen, noch nicht eroberten" fields, and if the coast has no such field
  // left then that is simply where the card stops.
  return barbariansOwed(held)
    ? held
    : checkWinner({
        ...held,
        phase: "trade",
        raidCard: null,
        barbTake: 0,
        barbPut: 0,
      });
}

/** Whether a card still has a barbarian to take or to put down. */
function barbariansOwed(game: CatanGame): boolean {
  return game.barbTake > 0
    ? takeSpots(game).length > 0
    : game.barbPut > 0 && putSpots(game).length > 0 && game.barbariansLeft > 0;
}

/**
 * Rides one knight.
 *
 * @param game - the game
 * @param seat - whose knight
 * @param from - where it stands
 * @param to - where it should come to rest
 * @param far - whether to pay a Getreide for two more steps
 * @returns the game after it, or null
 * @remarks
 * "Zahlst du 1 Getreide, darfst du 1 Ritter 2 Wege weiter ziehen (also bis zu 5
 * Wege insgesamt). Möchtest du mehrere Ritter 5 Wege weit ziehen, musst du für
 * jeden dieser Ritter 1 Getreide zahlen." Per knight, so the payment rides with
 * the move rather than being a thing bought beforehand.
 */
function doRide(
  game: CatanGame,
  seat: number,
  from: number,
  to: number,
  far: boolean,
): CatanGame | null {
  const steps = KNIGHT_STEPS + (far ? EXTRA_STEPS : 0);
  const rider = game.guards[from];
  // "Ein Ritter einer neutralen Farbe spielt als 'Fremder Ritter' mit und darf
  // von beiden Personen genutzt werden": whoever is on turn moves him, and he
  // keeps his own colour while they do.
  //
  // "Ist eine Person am Zug, zieht sie zuerst ihre(n) Ritter und anschließend
  // den Fremden Ritter" is an order and not a restriction - it decides nothing
  // that the rides themselves do not - so the referee does not hold him back
  // until the own knights are done. It would only ever be a deadlock: a knight
  // that does not want to move would keep the Fremder Ritter standing on the
  // castle path he has to leave.
  const stranger = rider !== null && rider === strangerSeat(game);
  const allowed =
    game.phase === "knights" &&
    (rider === seat || stranger) &&
    !game.ridden.includes(from) &&
    (!far || game.players[seat].hand.getreide > 0) &&
    rideSpots(game, from, steps).includes(to);
  return allowed
    ? note(
        {
          ...(far ? spend(game, seat, GRAIN_COST) : game),
          guards: game.guards.map((owner, path) =>
            path === from ? null : path === to ? rider : owner,
          ),
          ridden: [...game.ridden, to],
        },
        `${nameOf(game, seat)}: zieht ${stranger ? "den Fremden Ritter" : "einen Ritter"}${far ? " weit" : ""}.`,
      )
    : null;
}

/**
 * Whether the turn may end.
 *
 * @remarks
 * "Hast du in deinem Zug einen Ritter auf einen Weg des Burgfeldes gesetzt,
 * musst du ihn von dort wegziehen." A knight can never come to rest on a castle
 * path, so one standing there at the end of a turn is always one that was
 * trained this turn and has not left.
 */
function ridesOwed(game: CatanGame, seat: number): boolean {
  // The Fremder Ritter comes out onto a castle path as well, and the person on
  // turn is the one who has to take him off it. An empty path is nobody's, so
  // the neutral colour has to be asked for as a colour and not as "not mine":
  // at any table but the one of two there is none, and an empty castle path
  // would then have been owed for ever.
  const stranger = strangerSeat(game);
  const owed = (at: number): boolean =>
    game.guards[at] === seat ||
    (stranger !== null && game.guards[at] === stranger);
  return (
    raiding(game) &&
    game.fort.gates.some((at) => owed(at)) &&
    game.fort.gates.some(
      (at) => owed(at) && rideSpots(game, at, KNIGHT_STEPS).length > 0,
    )
  );
}

/**
 * Checks every coast field for a victory, in the printed order.
 *
 * @param game - the game at the end of a turn
 * @returns the game with the barbarians beaten wherever they are
 * @remarks
 * "Beginnt dafür bei dem Küstenfeld, das links an das Burgfeld angrenzt, und
 * überprüft dann im Uhrzeigersinn nacheinander alle anderen Felder." The order
 * is not decoration: a knight lost to the colour die after one victory is not
 * there for the next field, so which field is asked first can decide the other.
 */
function holdCoast(game: CatanGame): CatanGame {
  let next = game;
  for (const hex of game.fort.coast) {
    if (beaten(next, hex)) {
      next = winCoast(next, hex);
    }
  }
  return next;
}

/**
 * One victory: the prisoners, the field, and then the colour die.
 *
 * @param game - the game
 * @param hex - the coast field
 * @returns the game after the battle
 * @remarks
 * "Hat eine Person allein mit ihren Rittern die Barbaren vertrieben, erhält
 * diese alle Gefangenen. Haben sich mehrere Personen beteiligt, erhält jede
 * beteiligte Person 1 Gefangenen." And when there are not enough to go round,
 * the dice decide and whoever misses out gets three gold instead.
 */
function winCoast(game: CatanGame, hex: number): CatanGame {
  const owners = guardsAt(game, hex);
  const count = game.barbarians[hex] ?? 0;
  const helpers = [...new Set(owners)];
  const random = createRandom(game.seed);
  let next: CatanGame = {
    ...game,
    seed: random.state(),
    barbarians: game.barbarians.map((held, at) => (at === hex ? 0 : held)),
    // The beaten barbarians become prisoners and do not go back in the box.
    barbariansLeft: game.barbariansLeft,
  };
  const shared =
    helpers.length === 1
      ? helpers.map(() => count)
      : shareOut(random, helpers, count, owners, strangerSeat(game));
  helpers.forEach((seat, at) => {
    const won = shared[at];
    next = withPlayer(next, seat, {
      ...next.players[seat],
      prisoners: next.players[seat].prisoners + won,
    });
    // The Fremder Ritter takes his share of the prisoners and is paid nothing
    // for going without: the gold is a consolation, and he has no use for one.
    if (won === 0 && !next.players[seat].neutral) {
      next = withGold(next, seat, NO_PRISONER_GOLD);
    }
  });
  return colourDie(
    note(
      next,
      `Die Barbaren auf ${LAND_LOG_NAMES[game.land[hex]]} sind besiegt (${count} Gefangene).`,
    ),
    random,
  );
}

/**
 * How the prisoners are split when more than one colour helped.
 *
 * @param random - the generator, for the dice the rulebook rolls
 * @param helpers - who took part, without repeats
 * @param count - how many prisoners there are
 * @param owners - one entry per knight, so the biggest contributor can be found
 * @returns how many each helper gets, in the order of `helpers`
 * @remarks
 * One each while they last; a shortage is rolled for; and a single one left
 * over goes to "die Person, die allein mit den meisten Rittern zum Sieg
 * beigetragen hat", or is rolled for if nobody led alone.
 */
function shareOut(
  random: Random,
  helpers: readonly number[],
  count: number,
  owners: readonly number[],
  stranger: number | null = null,
): readonly number[] {
  const share = helpers.map(() => 0);
  let left = count;
  if (left >= helpers.length) {
    helpers.forEach((unused, at) => {
      share[at] = 1;
    });
    left -= helpers.length;
  } else {
    // Not enough for everybody: the dice pick who goes without, and the Fremder
    // Ritter is not rolled for - "gilt für den Fremden Ritter immer das
    // Würfelergebnis '3'".
    const drawn = [...helpers.keys()]
      .map((at) => ({
        at,
        roll:
          helpers[at] === stranger
            ? STRANGER_ROLL
            : randomInt(random, DIE_SIDES) + 1,
      }))
      .sort(
        (one, other) =>
          other.roll - one.roll ||
          randomInt(random, DIE_SIDES) - randomInt(random, DIE_SIDES),
      );
    drawn.slice(0, left).forEach(({ at }) => {
      share[at] = 1;
    });
    left = 0;
  }
  while (left > 0) {
    // Whoever brought the most knights takes what is over.
    const counts = helpers.map(
      (seat) => owners.filter((owner) => owner === seat).length,
    );
    const most = Math.max(...counts);
    const leaders = counts.reduce<number[]>(
      (list, held, at) => (held === most ? [...list, at] : list),
      [],
    );
    const at =
      leaders.length === 1
        ? leaders[0]
        : leaders[randomInt(random, leaders.length)];
    share[at] += 1;
    left -= 1;
  }
  return share;
}

/**
 * Rolls the colour die and takes the knights it names.
 *
 * @param game - the game just after a victory
 * @param random - the generator
 * @returns the game with those knights gone and their owners paid
 * @remarks
 * "Die Ausrichtung des Weges, dessen Farbe du gewürfelt hast, bestimmt, ob und
 * welche Ritter ihr alle verliert." Six colours on six castle paths, but a hex
 * has only three orientations - so the die comes down to one of three answers,
 * and every knight lying that way is lost, whoever it belongs to. "Für jeden
 * verlorenen Ritter erhält die betroffene Person 3 Gold als Entschädigung."
 */
function colourDie(game: CatanGame, random: Random): CatanGame {
  const board = islandOf(game.land.length);
  const gate = game.fort.gates[randomInt(random, game.fort.gates.length)];
  const lie = lieOf(board, gate);
  // "Ein Fremder Ritter bleibt während des ganzen Spiels auf dem Spielfeld. Er
  // geht nicht verloren, auch wenn bei einem Sieg über die Barbaren der Weg, auf
  // dem er steht, ausgewürfelt wird."
  const struck = (owner: number | null, at: number): boolean =>
    owner !== null && owner !== strangerSeat(game) && lieOf(board, at) === lie;
  const two = playingTwo(game);
  let next: CatanGame = {
    ...game,
    seed: random.state(),
    lastLie: lie,
    guards: game.guards.map((owner, at) => (struck(owner, at) ? null : owner)),
  };
  game.guards.forEach((owner, at) => {
    if (struck(owner, at) && owner !== null) {
      // "Als Entschädigung beim Verlust eines Ritters erhält man statt 3 Gold 2
      // Gold und 1 Handelschip."
      const paid = withGold(
        next,
        owner,
        two ? LOST_KNIGHT_TWO_GOLD : LOST_KNIGHT_GOLD,
      );
      next = two
        ? withPlayer(paid, owner, {
            ...paid.players[owner],
            chips: paid.players[owner].chips + LOST_KNIGHT_TWO_CHIP,
          })
        : paid;
    }
  });
  const lost = game.guards.filter((owner, at) => struck(owner, at)).length;
  return lost === 0
    ? next
    : note(
        next,
        `Der Farbwürfel kostet ${lost} Ritter (je ${two ? "2 Gold und 1 Handelschip" : "3 Gold"}).`,
      );
}

/**
 * Opens a drive, if this seat has a wagon that could move.
 *
 * @param game - the game whose building phase has just ended
 * @param seat - whose turn it is
 * @returns the game in the driving phase, with the points handed out
 * @remarks
 * "Zu Beginn des Spiels hast du 4 Bewegungspunkte zur Verfügung. Diese Anzahl
 * kannst du durch das Aufwerten deines Wagen-Tableaus steigern." The points are
 * a fresh allowance each drive rather than something saved up.
 */
function startDrive(game: CatanGame, seat: number): CatanGame {
  return withPlayer({ ...game, phase: "driving", shoved: [] }, seat, {
    ...game.players[seat],
    moves: MOVE_POINTS[game.players[seat].level],
    boosted: false,
  });
}

/** Whether this seat still has a drive owed to it. */
function drivesLeft(game: CatanGame, seat: number): boolean {
  return hauling(game) && game.players[seat].wagon !== null;
}

/**
 * Drives the wagon one crossing further.
 *
 * @param game - the game
 * @param seat - who is driving
 * @param to - the neighbouring crossing
 * @returns the game after the step, or null
 * @remarks
 * One step is one decision, because each has its own price: two points over a
 * bare path, one over a road, one **and a gold coin** over somebody else's, and
 * two more on top wherever a barbarian sits. "Hat eine Person mit ihrem
 * Trosswagen ein Zielfeld erreicht, endet die Bewegung" - so arriving stops the
 * drive whether the points are spent or not.
 */
function doDrive(game: CatanGame, seat: number, to: number): CatanGame | null {
  const board = islandOf(game.land.length);
  const player = game.players[seat];
  const from = player.wagon;
  const path =
    from === null || game.phase !== "driving"
      ? null
      : edgeBetween(board, from, to);
  const cost = path === null ? null : stepCost(game, seat, path);
  const allowed =
    cost !== null &&
    player.moves >= cost.moves &&
    player.gold >= cost.toll &&
    driveSpots(game, seat).includes(to);
  let next: CatanGame | null = null;
  if (allowed && cost !== null && path !== null) {
    const owner = game.roads[path];
    // The toll goes from one purse to the other; the bank is not in it.
    const paid =
      cost.toll > 0 && owner !== null
        ? withGold(withGold(game, seat, -cost.toll), owner, cost.toll)
        : game;
    const moved = withPlayer(paid, seat, {
      ...paid.players[seat],
      wagon: to,
      moves: player.moves - cost.moves,
    });
    next = arrive(
      note(
        moved,
        cost.toll > 0
          ? `${nameOf(game, seat)}: fährt weiter und zahlt ${cost.toll} Gold Wegzoll.`
          : `${nameOf(game, seat)}: fährt weiter.`,
      ),
      seat,
      to,
    );
  }
  return next;
}

/**
 * What happens when the wagon reaches a site.
 *
 * @param game - the game with the wagon already there
 * @param seat - whose wagon
 * @param at - the crossing it has reached
 * @returns the game with the load handed over or taken on
 * @remarks
 * Three things at once, and the rulebook has them in this order: the drive
 * ends, the load is delivered if this was the site it was going to, and "als
 * letzte Aktion in deinem Zug deckst du ein neues Warenplättchen des Zielfeldes
 * auf, das du gerade erreicht hast".
 *
 * The very first arrival pays nothing - "erreichst du zum ersten Mal ein
 * Zielfeld, erhältst du noch kein Gold, da du noch kein Warenplättchen hast" -
 * which falls out of there being no load to hand over.
 */
function arrive(game: CatanGame, seat: number, at: number): CatanGame {
  const depot = depotAt(game, at);
  let next = game;
  if (depot !== null) {
    const player = game.players[seat];
    const load = player.ware;
    const delivering = load !== null && WARE_GOES[load] === depot.target;
    if (delivering) {
      const reward = REWARD_GOLD[player.level];
      next = note(
        withGold(
          withPlayer(next, seat, {
            ...next.players[seat],
            ware: null,
            delivered: player.delivered + 1,
          }),
          seat,
          reward,
        ),
        `${nameOf(game, seat)}: liefert ${WARE_NAMES[load]} ab (+1 Siegpunkt, ${reward} Gold).`,
      );
    }
    // A new load only where there is room for one: the wagon carries one order
    // at a time, "erst wenn du diesen erledigt hast, darfst du ein neues
    // Warenplättchen ziehen".
    if (next.players[seat].ware === null) {
      next = takeLoad(next, seat, depot);
    }
    // "Hat eine Person mit ihrem Trosswagen ein Zielfeld erreicht, endet die
    // Bewegung", and the new load is drawn "als letzte Aktion in deinem Zug" -
    // so arriving ends the turn as well as the drive. Anything else would let a
    // wagon deliver again and again inside one turn, which is what it did
    // before this line: it came back to the building phase, and ending the turn
    // from there simply started a second drive.
    const arrived = checkWinner(
      withPlayer(next, seat, { ...next.players[seat], moves: 0 }),
    );
    next = arrived.winner === null ? endDrive(arrived, seat) : arrived;
  }
  return next;
}

/** What follows a drive: the second one Gute Reise pays for, or the turn. */
function endDrive(game: CatanGame, seat: number): CatanGame {
  return game.secondDrive
    ? startDrive({ ...game, secondDrive: false }, seat)
    : passTurn({ ...game, phase: "trade" });
}

/** Takes the top tile off a site's stack. */
function takeLoad(game: CatanGame, seat: number, depot: Depot): CatanGame {
  const ware = depot.stack[0];
  return ware === undefined
    ? game
    : note(
        withPlayer(
          {
            ...game,
            depots: game.depots.map((each) =>
              each.target === depot.target
                ? { ...each, stack: each.stack.slice(1) }
                : each,
            ),
          },
          seat,
          { ...game.players[seat], ware },
        ),
        `${nameOf(game, seat)}: lädt ${WARE_NAMES[ware]} für ${TARGET_NAMES[WARE_GOES[ware]]}.`,
      );
}

/**
 * Buys the two extra movement points.
 *
 * @remarks
 * "Einmal pro Zug möglich: Gibst du 1 Getreide aus, darfst du die Bewegung um 2
 * zusätzliche Bewegungspunkte verlängern. Die Verlängerung darfst du auch dann
 * vornehmen, wenn du deinen Trosswagen bereits regulär bewegt hast."
 */
function doBoost(game: CatanGame, seat: number): CatanGame | null {
  const player = game.players[seat];
  return hauling(game) &&
    game.phase === "driving" &&
    !player.boosted &&
    player.hand.getreide > 0
    ? note(
        spend(
          withPlayer(game, seat, {
            ...player,
            moves: player.moves + GRAIN_MOVE,
            boosted: true,
          }),
          seat,
          GRAIN_COST,
        ),
        `${nameOf(game, seat)}: kauft 2 Bewegungspunkte für 1 Getreide.`,
      )
    : null;
}

/**
 * Tries to drive a barbarian off the path in front of the wagon.
 *
 * @param game - the game
 * @param seat - who is trying
 * @param at - the path the barbarian sits on
 * @returns the game after the roll, or null
 * @remarks
 * "Würfelst du eine Zahl, die zu deiner Ausbaustufe passt, vertreibst du den
 * Barbaren ... Würfelst du eine andere Zahl, hast du den Barbaren nicht
 * vertrieben und musst entweder stehen bleiben oder in eine andere Richtung
 * weiterziehen." One die, one try, and the try itself costs nothing.
 */
function doShove(game: CatanGame, seat: number, at: number): CatanGame | null {
  const player = game.players[seat];
  const allowed =
    game.phase === "driving" &&
    // One try per barbarian and per stop; a failed roll stands.
    !game.shoved.includes(at) &&
    facingRaiders(game, seat).includes(at);
  let next: CatanGame | null = null;
  if (allowed) {
    const random = createRandom(game.seed);
    const die = randomInt(random, DIE_SIDES) + 1;
    const won = DRIVE_OFF[player.level].includes(die);
    const rolled = note(
      { ...game, seed: random.state(), shoved: [...game.shoved, at] },
      `${nameOf(game, seat)}: würfelt ${die} gegen den Barbaren.`,
    );
    next = won
      ? {
          ...rolled,
          raiders: rolled.raiders.map((held, path) =>
            path === at ? false : held,
          ),
          phase: "shifting",
          // "Darfst du, im Gegensatz zum Fall einer gewürfelten '7', keine
          // Rohstoffkarte von dieser ziehen."
          shiftDraws: false,
        }
      : rolled;
  }
  return next;
}

/**
 * Puts a barbarian back on the board.
 *
 * @param game - the game
 * @param seat - who is placing it
 * @param at - the path
 * @returns the game after it, or null
 * @remarks
 * "Versetzt du den Barbaren auf eine Straße, ziehst du 1 Rohstoffkarte (kein
 * Gold) von der Person, der die Straße gehört" - but only when the shift came
 * from a seven or a Ritter card, which is what {@link CatanGame.shiftDraws}
 * remembers.
 */
function doShift(game: CatanGame, seat: number, at: number): CatanGame | null {
  const owner = game.roads[at];
  const allowed =
    game.phase === "shifting" &&
    !game.raiders[at] &&
    raiderSpots(game).includes(at);
  let next: CatanGame | null = null;
  if (allowed) {
    const placed = note(
      {
        ...game,
        raiders: game.raiders.map((held, path) => (path === at ? true : held)),
      },
      `${nameOf(game, seat)}: versetzt einen Barbaren.`,
    );
    const robbing =
      game.shiftDraws && owner !== null && owner !== seat
        ? handSize(game.players[owner].hand) > 0
        : false;
    // Back to whatever was going on: a drive that was interrupted, or the turn.
    const after: CatanGame = {
      ...placed,
      shiftDraws: false,
      phase: game.players[seat].moves > 0 ? "driving" : "trade",
    };
    next = robbing
      ? { ...after, phase: "steal", targets: [owner as number] }
      : after;
  }
  return next;
}

/**
 * Takes the next step of the Wagen-Tableau.
 *
 * @remarks
 * "Möchtest du dein Wagen-Tableau aufwerten, zahlst du in deiner Handels- und
 * Bauphase die Kosten ... Hast du mit deinem Ritter die höchste Stufe erreicht,
 * zählt dein Wagen-Tableau 1 Siegpunkt."
 */
function doTableau(game: CatanGame, seat: number): CatanGame | null {
  const price = stepPrice(game, seat);
  return price !== null &&
    game.phase === "trade" &&
    covers(game.players[seat].hand, price)
    ? checkWinner(
        note(
          spend(
            withPlayer(game, seat, {
              ...game.players[seat],
              level: game.players[seat].level + 1,
            }),
            seat,
            price,
          ),
          `${nameOf(game, seat)}: baut den Trosswagen aus (Stufe ${game.players[seat].level + 2}).`,
        ),
      )
    : null;
}

/**
 * Buys a card of this scenario's own deck.
 *
 * @remarks
 * Held rather than played at once - unlike the barbarian scenario's deck - so
 * this is the ordinary purchase with a different pile behind it. "Ist der
 * Stapel aufgebraucht, mischt ihr den Ablagestapel": a ring again.
 */
function drawHaulCard(game: CatanGame, seat: number): CatanGame | null {
  const deck =
    game.haulDeck.length > 0
      ? game.haulDeck
      : shuffle(createRandom(game.seed), game.haulUsed);
  const used = game.haulDeck.length > 0 ? game.haulUsed : [];
  const card = deck[0];
  return card === undefined || !covers(game.players[seat].hand, DEV_COST)
    ? null
    : checkWinner(
        note(
          spend(
            withPlayer(
              { ...game, haulDeck: deck.slice(1), haulUsed: used },
              seat,
              {
                ...game.players[seat],
                haul: [...game.players[seat].haul, card],
              },
            ),
            seat,
            DEV_COST,
          ),
          `${nameOf(game, seat)}: kauft eine Entwicklungskarte.`,
        ),
      );
}

/**
 * Plays one of the held cards.
 *
 * @param game - the game
 * @param seat - whose card
 * @param card - which one
 * @returns the game after it, or null
 * @remarks
 * The three victory-point cards are never played - "decke diese Karte erst auf,
 * wenn du mit ihr die zum Sieg erforderliche Anzahl Siegpunkte besitzt" - so
 * they simply count, the way a Siegpunkt card does in the printed game.
 */
function doHaulCard(
  game: CatanGame,
  seat: number,
  card: HaulCard,
): CatanGame | null {
  const player = game.players[seat];
  const held = player.haul.includes(card);
  const usable =
    held &&
    game.phase === "trade" &&
    !game.playedDev &&
    !HAUL_POINT_CARDS.includes(card);
  let next: CatanGame | null = null;
  if (usable) {
    const spent = note(
      withPlayer(
        {
          ...game,
          playedDev: true,
          haulUsed: [...game.haulUsed, card],
        },
        seat,
        { ...player, haul: dropHaul(player.haul, card) },
      ),
      `${nameOf(game, seat)}: spielt ${HAUL_CARD_NAMES[card]}.`,
    );
    const effects: Readonly<Record<string, () => CatanGame | null>> = {
      // "Versetze 1 Barbaren auf eine andere Straße/Weg. Setzt du ihn auf eine
      // Straße, ziehe 1 Handkarte von der Person, der die Straße gehört."
      ritter: () => liftRaider(spent, true),
      strassenbau: () => ({ ...spent, freeRoads: FREE_ROADS }),
      // "Hast du mit deinem Trosswagen einen regulären Zug ausgeführt, erhältst
      // du einen kompletten zweiten Zug mit deinem Trosswagen."
      reise: () => ({ ...spent, secondDrive: true }),
    };
    next = effects[card]?.() ?? null;
  }
  return next;
}

/** One copy of a hauling card out of a hand of them. */
function dropHaul(
  cards: readonly HaulCard[],
  card: HaulCard,
): readonly HaulCard[] {
  const at = cards.indexOf(card);
  return at === -1 ? cards : [...cards.slice(0, at), ...cards.slice(at + 1)];
}

/**
 * The barbarian a seven shifts.
 *
 * @remarks
 * "Würfelst du eine '7', versetzt du 1 der 3 Barbaren auf einen Weg oder eine
 * Straße. Versetzt du den Barbaren auf eine Straße, ziehst du 1 Rohstoffkarte
 * von der Person, der die Straße gehört." There is no robber to move, so the
 * seven asks for a barbarian instead - and the taking of a card is the same
 * gesture, one step later.
 */
function haulSeven(game: CatanGame): CatanGame {
  return liftRaider(game, true);
}

/**
 * Takes one barbarian off the board so it can be put somewhere else.
 *
 * @param game - the game
 * @param draws - whether putting it on a road takes a card as well
 * @returns the game waiting for the placement
 * @remarks
 * Lifting one is not a choice the rulebook gives - it says "1 der 3", and which
 * one only matters through where it lands. The **placement** is the decision,
 * and that is what is asked for. Shared by the seven and by the Ritter card,
 * because both say the same sentence; forgetting to lift here once meant the
 * Ritter card conjured a fourth barbarian out of nothing.
 */
function liftRaider(game: CatanGame, draws: boolean): CatanGame {
  const lifted = game.raiders.findIndex((held) => held);
  return lifted === -1
    ? game
    : {
        ...game,
        raiders: game.raiders.map((held, path) =>
          path === lifted ? false : held,
        ),
        phase: "shifting",
        shiftDraws: draws,
      };
}

/**
 * Builds a ship.
 *
 * @param game - the game
 * @param seat - who is building
 * @param at - the water path
 * @returns the game after it, or null
 * @remarks
 * A ship is free in the founding phase and when a Straßenbau card is in force,
 * exactly as a road is - "wer eine dieser Karten ausspielt, darf anstelle der 2
 * kostenlosen Straßen auch 2 Schiffe bauen oder 1 Straße und 1 Schiff."
 */
function doShip(game: CatanGame, seat: number, at: number): CatanGame | null {
  const founding = game.phase === "founding";
  const free = founding || game.freeRoads > 0;
  const paid = free || covers(game.players[seat].hand, SHIP_COST);
  const placed = founding
    ? game.founding?.placing === "road" &&
      game.founding.lastTown !== null &&
      islandOf(game.land.length).paths[at].ends.includes(
        game.founding.lastTown,
      ) &&
      seaPath(game, at) &&
      game.ships[at] === null &&
      game.roads[at] === null
    : canShip(game, seat, at);
  let next: CatanGame | null = null;
  if (placed && paid) {
    const player = game.players[seat];
    const built = withPlayer(
      {
        ...game,
        ships: game.ships.map((owner, path) => (path === at ? seat : owner)),
        // "Es darf jedoch kein Schiff versetzt werden, das in der gleichen
        // Runde gebaut wurde."
        freshShips: [...game.freshShips, at],
        freeRoads: free && !founding ? game.freeRoads - 1 : game.freeRoads,
      },
      seat,
      { ...player, shipsLeft: player.shipsLeft - 1 },
    );
    next = checkWinner(
      awardTiles(
        openTrades(
          takeGift(
            liftFog(
              note(
                free ? built : spend(built, seat, SHIP_COST),
                `${nameOf(game, seat)}: baut ein Schiff.`,
              ),
              seat,
              at,
            ),
            seat,
            at,
          ),
          seat,
        ),
      ),
    );
  }
  return next;
}

/**
 * Picks a ship up and puts it down again.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param from - where it stands
 * @param to - where it should go
 * @returns the game after it, or null
 * @remarks
 * "Wer an der Reihe ist, darf pro Runde nur 1 eigenes Schiff versetzen." The
 * new place has to be one a new ship could have been built on, which is what
 * {@link canShip} answers - and the old ship is off the board while that is
 * asked, so a line may shuffle forward into its own wake.
 */
function doSail(
  game: CatanGame,
  seat: number,
  from: number,
  to: number,
): CatanGame | null {
  const lifted: CatanGame = {
    ...game,
    ships: game.ships.map((owner, path) => (path === from ? null : owner)),
    players: game.players.map((player, at) =>
      at === seat ? { ...player, shipsLeft: player.shipsLeft + 1 } : player,
    ),
  };
  const allowed =
    game.phase === "trade" &&
    !game.shipMoved &&
    looseShips(game, seat).includes(from) &&
    canShip(lifted, seat, to);
  return allowed
    ? checkWinner(
        awardTiles(
          openTrades(
            takeGift(
              note(
                withPlayer(
                  {
                    ...lifted,
                    ships: lifted.ships.map((owner, path) =>
                      path === to ? seat : owner,
                    ),
                    shipMoved: true,
                  },
                  seat,
                  {
                    ...lifted.players[seat],
                    shipsLeft: lifted.players[seat].shipsLeft - 1,
                  },
                ),
                `${nameOf(game, seat)}: versetzt ein Schiff.`,
              ),
              seat,
              to,
            ),
            seat,
          ),
        ),
      )
    : null;
}

/**
 * Whether this seat may send the Seeräuber anywhere at all.
 *
 * @param game - the game
 * @param seat - who wants to move it
 * @returns whether the scenario lets them
 * @remarks
 * "Der Seeräuber darf nur von Personen versetzt werden, die mindestens 1 Dorf
 * mit einer Schiffslinie erreicht haben." Only in *Stoffe für Catan*;
 * everywhere else anybody may move it.
 */
function mayPirate(game: CatanGame, seat: number): boolean {
  return !cloth(game) || tradesOf(game, seat).length > 0;
}

/**
 * Sends the Seeräuber to a sea field.
 *
 * @param game - the game
 * @param seat - who is moving it
 * @param at - the sea field
 * @returns the game after it, or null
 * @remarks
 * "Dann darf diese Person von jemandem mit mindestens einem Schiff auf einer
 * Kante dieses Meerfeldes eine Rohstoffkarte rauben." The same shape as the
 * robber: move first, then draw from somebody who is there.
 */
function doPirate(game: CatanGame, seat: number, at: number): CatanGame | null {
  const allowed =
    game.phase === "pirate" &&
    pirateSpots(game).includes(at) &&
    mayPirate(game, seat);
  let next: CatanGame | null = null;
  if (allowed) {
    const moved = note(
      { ...game, pirate: at },
      `${nameOf(game, seat)}: versetzt den Seeräuber.`,
    );
    // "Versetzt du den Seeräuber, darfst du wahlweise 1 Rohstoffkarte ziehen
    // oder einen Stoffballen von einer Person rauben, die an dem Feld mit dem
    // Seeräuber ein Schiff stehen hat." The bale is taken where there is one to
    // take - it is a victory point in the making and worth more than a card -
    // and otherwise the card is drawn.
    const robbed = cloth(moved) ? robBale(moved, seat) : moved;
    const targets = cloth(moved)
      ? []
      : pirateTargets(moved, seat).filter(
          (other) => handSize(game.players[other].hand) > 0,
        );
    next =
      targets.length === 0
        ? { ...robbed, phase: "trade", targets: [] }
        : { ...robbed, phase: "steal", targets };
  }
  return next;
}

/**
 * What moving the Seeräuber pays in *Stoffe für Catan*.
 *
 * @param game - the game, with the pirate already moved
 * @param seat - who moved it
 * @returns the game with a bale robbed, or a resource drawn
 */
function robBale(game: CatanGame, seat: number): CatanGame {
  const victim = pirateTargets(game, seat).find(
    (other) => game.players[other].bales > 0,
  );
  if (victim === undefined) {
    // A card from the supply instead, which is the other half of the choice.
    const random = createRandom(game.seed);
    const sort = RESOURCES[randomInt(random, RESOURCES.length)];
    return note(
      withHand(
        { ...game, seed: random.state() },
        seat,
        withCard(game.players[seat].hand, sort, 1),
      ),
      `${nameOf(game, seat)}: zieht dafür 1 ${SORT_NAMES[sort]}.`,
    );
  }
  return note(
    withPlayer(
      withPlayer(game, victim, {
        ...game.players[victim],
        bales: game.players[victim].bales - 1,
      }),
      seat,
      { ...game.players[seat], bales: game.players[seat].bales + 1 },
    ),
    `${nameOf(game, seat)}: raubt ${nameOf(game, victim)} einen Stoffballen.`,
  );
}

/**
 * What a seven does on the sea.
 *
 * @param game - the game, after the cards have been laid down
 * @returns the game asking which of the two figures moves
 * @remarks
 * "Würfelst du eine '7', kannst du wählen, ob du entweder den Seeräuber
 * versetzen willst oder den Räuber. Eine der beiden Figuren muss versetzt
 * werden." So the choice is offered as two lit boards at once: the sea fields
 * for the pirate, the landscapes for the robber, and the phase says the pirate
 * because the robber's own phase already exists.
 */
function seaSeven(game: CatanGame): CatanGame {
  return { ...game, phase: "pirate" };
}

/**
 * Who is owed a free resource by a Goldfluss, and how many.
 *
 * @param game - the game
 * @param hex - the gold river that has just come up
 * @returns one count per seat
 * @remarks
 * "Wird die Zahl auf einem Goldfluss-Feld gewürfelt, nehmen sich alle mit einer
 * Siedlung an diesem Feld 1 Rohstoffkarte pro eigene Siedlung ... Wer an einem
 * solchen Feld eine Stadt errichtet, erhält natürlich 2 Rohstoffkarten je
 * eigene Stadt. Dies dürfen auch 2 verschiedene sein." Two cards, chosen one at
 * a time, which is why this counts cards and not buildings.
 */
function goldOwedBy(game: CatanGame, hex: number): readonly number[] {
  const board = islandOf(game.land.length);
  const owed = game.players.map(() => 0);
  board.hexes[hex].corners.forEach((corner) => {
    const town = game.towns[corner];
    if (town !== null && !game.players[town.owner].neutral) {
      owed[town.owner] += town.city ? CITY_YIELD : 1;
    }
  });
  return owed;
}

/** Takes one card of the seat's own choosing from a Goldfluss. */
function doGoldPick(
  game: CatanGame,
  seat: number,
  sort: Resource,
): CatanGame | null {
  const owed = game.goldOwed[seat] ?? 0;
  return game.phase === "goldPick" && owed > 0
    ? afterGold(
        note(
          withHand(
            {
              ...game,
              goldOwed: game.goldOwed.map((count, at) =>
                at === seat ? count - 1 : count,
              ),
            },
            seat,
            withCard(game.players[seat].hand, sort),
          ),
          hasBenefit(game, seat, "wissenschaft") && !paysAnyGold(game)
            ? `${nameOf(game, seat)}: nimmt ${SORT_NAMES[sort]} aus dem Aquädukt.`
            : `${nameOf(game, seat)}: nimmt ${SORT_NAMES[sort]} vom Goldfluss.`,
        ),
      )
    : null;
}

/** Whether any Goldfluss lies on this board at all. */
function paysAnyGold(game: CatanGame): boolean {
  return islandOf(game.land.length).hexes.some((hex) => paysGold(game, hex.id));
}

/** Closes the gold river once nobody is owed anything. */
function afterGold(game: CatanGame): CatanGame {
  return game.goldOwed.some((count) => count > 0)
    ? game
    : { ...game, phase: owesRoll(game) ? "roll" : "trade", goldOwed: [] };
}

/** The seat a Goldfluss is waiting for. */
export function goldSeat(game: CatanGame): number | null {
  const found = game.goldOwed.findIndex((count) => count > 0);
  return found === -1 ? null : found;
}

/**
 * Builds a ship beside one of this seat's harbour settlements.
 *
 * @param game - the game
 * @param seat - who is building
 * @param at - the sea path
 * @returns the game after it, or null
 * @remarks
 * "Möchtest du ein neues Schiff bauen und alle deine Schiffe sind schon auf dem
 * Spielfeld, darfst du ein beliebiges deiner Schiffe vom Spielfeld entfernen
 * und an deiner Hafensiedlung neu bauen" - which this does not offer, because
 * it is a choice of *which* ship to scuttle and the fleet is only three. It is
 * noted in the docs rather than silently missing.
 */
function doBoat(game: CatanGame, seat: number, at: number): CatanGame | null {
  const player = game.players[seat];
  return finding(game) &&
    game.phase === "trade" &&
    player.boatsLeft > 0 &&
    covers(player.hand, BOAT_COST) &&
    boatSpots(game, seat).includes(at)
    ? note(
        spend(
          withPlayer(
            {
              ...game,
              boats: [
                ...game.boats,
                {
                  owner: seat,
                  at,
                  hold: [],
                  spent: 0,
                  boosted: false,
                  done: false,
                },
              ],
            },
            seat,
            { ...player, boatsLeft: player.boatsLeft - 1 },
          ),
          seat,
          BOAT_COST,
        ),
        `${nameOf(game, seat)}: baut ein Schiff.`,
      )
    : null;
}

/**
 * Puts an explorer into a harbour basin or into a waiting ship.
 *
 * @param game - the game
 * @param seat - whose explorer
 * @param at - the crossing of the harbour settlement, or the path of the ship
 * @returns the game after it, or null
 * @remarks
 * "Setzt du einen Entdecker ein, stellst du ihn entweder in das leere Becken
 * einer deiner Hafensiedlungen oder gleich in ein leeres Schiff, das auf einem
 * Meerweg neben einer Hafensiedlung steht." One move for both, because the
 * board tells them apart: a crossing is a harbour, a path is a ship.
 */
function doScout(game: CatanGame, seat: number, at: number): CatanGame | null {
  const player = game.players[seat];
  const board = islandOf(game.land.length);
  const ready =
    finding(game) &&
    game.phase === "trade" &&
    player.scoutsLeft > 0 &&
    covers(player.hand, SCOUT_COST);
  const port =
    ready && at < board.crossings.length && portsOf(game, seat).includes(at)
      ? at
      : null;
  const boat =
    ready && port === null
      ? game.boats.findIndex(
          (each) =>
            each.at === at &&
            each.owner === seat &&
            each.hold.length === 0 &&
            board.paths[at].ends.some((end) =>
              portsOf(game, seat).includes(end),
            ),
        )
      : -1;
  let next: CatanGame | null = null;
  if (port !== null && (game.docks[port] ?? []).length === 0) {
    next = withPlayer(
      { ...game, docks: { ...game.docks, [port]: ["entdecker"] } },
      seat,
      { ...player, scoutsLeft: player.scoutsLeft - 1 },
    );
  } else if (boat >= 0) {
    next = withPlayer(
      {
        ...game,
        boats: game.boats.map((each, index) =>
          index === boat ? { ...each, hold: ["entdecker"] } : each,
        ),
      },
      seat,
      { ...player, scoutsLeft: player.scoutsLeft - 1 },
    );
  }
  return next === null
    ? null
    : note(
        spend(next, seat, SCOUT_COST),
        `${nameOf(game, seat)}: setzt einen Entdecker ein.`,
      );
}

/**
 * Grows a settlement into a Hafensiedlung.
 *
 * @remarks
 * "Eine Hafensiedlung kannst du nur bauen, indem du eine Siedlung an der Küste
 * ... zu einer Hafensiedlung ausbaust." At the coast, so the crossing has to
 * touch water - and the discovered board is what says where water is.
 */
function doPort(game: CatanGame, seat: number, at: number): CatanGame | null {
  const board = islandOf(game.land.length);
  const town = game.towns[at];
  const coastal = board.crossings[at].paths.some((path) => seaLane(game, path));
  return finding(game) &&
    game.phase === "trade" &&
    town !== null &&
    town.owner === seat &&
    town.port !== true &&
    coastal &&
    game.players[seat].portsLeft > 0 &&
    covers(game.players[seat].hand, PORT_COST)
    ? checkWinner(
        note(
          spend(
            withPlayer(
              {
                ...game,
                towns: game.towns.map((each, crossing) =>
                  crossing === at && each !== null
                    ? { ...each, port: true }
                    : each,
                ),
              },
              seat,
              {
                ...game.players[seat],
                portsLeft: game.players[seat].portsLeft - 1,
                settlements: game.players[seat].settlements + 1,
              },
            ),
            seat,
            PORT_COST,
          ),
          `${nameOf(game, seat)}: baut eine Hafensiedlung.`,
        ),
      )
    : null;
}

/** Takes the helm of one of this seat's ships. */
function doHelm(game: CatanGame, seat: number, boat: number): CatanGame | null {
  return game.phase === "sailing" &&
    game.boats[boat]?.owner === seat &&
    !game.boats[boat].done
    ? { ...game, sailing: boat }
    : null;
}

/**
 * Sails the ship at the helm one sea path further.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the neighbouring sea path
 * @returns the game after the step, or null
 * @remarks
 * "Du musst die Bewegung eines Schiffes erst beenden, bevor du das nächste
 * Schiff bewegen darfst" - which is what {@link CatanGame.sailing} is for. And
 * a step that ends beside something face down turns it over, and with it ends
 * that ship's journey for good.
 */
function doSail2(game: CatanGame, seat: number, at: number): CatanGame | null {
  const which = game.sailing;
  const boat = which === null ? undefined : game.boats[which];
  return which === null ||
    boat === undefined ||
    boat.owner !== seat ||
    game.phase !== "sailing" ||
    !lanesFrom(game, boat).includes(at)
    ? null
    : sailStep(game, seat, which, at);
}

/**
 * Turns over what the ship has come to rest beside.
 *
 * @param game - the game with the ship already moved
 * @param seat - whose ship
 * @param which - which ship
 * @returns the game with the field face up, or unchanged
 * @remarks
 * "Ist es ein Landschaftsfeld, dann nimm einen Zahlenchip ... Anschließend
 * erhältst du als Belohnung einen Rohstoff dieser Landschaft. Ist es ein
 * beliebiges anderes Feld, erhältst du 2 Gold." And either way: "eine
 * Entdeckung beendet immer den Zug deines Schiffs."
 */
function discover(game: CatanGame, seat: number, which: number): CatanGame {
  const boat = game.boats[which];
  const hex = boat === undefined ? null : pointsAt(game, boat.at);
  let next = game;
  if (hex !== null) {
    const kind = game.hidden[hex];
    const reward = findReward(kind);
    const turned: CatanGame = {
      ...game,
      land: game.land.map((each, at) => (at === hex ? kind : each)),
      chips: game.chips.map((each, at) =>
        at === hex ? game.hiddenChips[hex] : each,
      ),
      boats: game.boats.map((each, index) =>
        index === which ? { ...each, done: true } : each,
      ),
      // "Entdeckst du ein Goldflussfeld mit einem Piratenlager ... nimmst du
      // ein Piratenlager aus dem Vorrat und legst es auf das Piratenlager."
      camps:
        camping(game) && kind === "gold"
          ? { ...game.camps, [hex]: { units: [], taken: false } }
          : game.camps,
      // "Anschliessend legst du so viele Gewuerzsaecke aus dem Vorrat auf das
      // Dorf des Gewuerzfelds, wie Personen am Spiel teilnehmen" - one for each
      // seat, because each seat may fetch exactly one. Six villages at four
      // seats is the whole supply of 24, so it never runs out.
      sacks:
        spicing(game) && kind === "gewuerz"
          ? { ...game.sacks, [hex]: game.players.length }
          : game.sacks,
    };
    next = note(
      reward === null
        ? withGold(turned, seat, FIND_GOLD)
        : withHand(turned, seat, withCard(turned.players[seat].hand, reward)),
      reward === null
        ? `${nameOf(game, seat)}: entdeckt Meer und erhält ${FIND_GOLD} Gold.`
        : `${nameOf(game, seat)}: entdeckt ${LAND_LOG_NAMES[kind]} und erhält 1 ${SORT_NAMES[reward]}.`,
    );
  }
  return next;
}

/** Buys two more movement points for the ship at the helm. */
function doWind(game: CatanGame, seat: number): CatanGame | null {
  const which = game.sailing;
  const boat = which === null ? undefined : game.boats[which];
  return which === null ||
    boat === undefined ||
    boat.owner !== seat ||
    boat.boosted ||
    game.phase !== "sailing" ||
    !covers(game.players[seat].hand, BOOST_COST)
    ? null
    : note(
        spend(
          {
            ...game,
            boats: game.boats.map((each, index) =>
              index === which ? { ...each, boosted: true } : each,
            ),
          },
          seat,
          BOOST_COST,
        ),
        `${nameOf(game, seat)}: kauft 2 Bewegungspunkte für 1 Wolle.`,
      );
}

/**
 * Takes an explorer aboard from a harbour, or sets one down in one.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the harbour settlement's crossing
 * @returns the game after it, or null
 * @remarks
 * "Zeigt eine Spitze eines deiner leeren Schiffe auf eine Hafensiedlung und
 * steht dort ein Entdecker, kannst du diesen in dein Schiff einladen ... Das
 * Beladen eines Schiffs mit einem Entdecker beendet nicht die Bewegung deines
 * Schiffs." Free, and either way round, which is the swap the rulebook draws.
 */
function doLoad(game: CatanGame, seat: number, at: number): CatanGame | null {
  const which = game.sailing;
  const boat = which === null ? undefined : game.boats[which];
  const board = islandOf(game.land.length);
  const reaches = boat !== undefined && board.paths[boat.at].ends.includes(at);
  const mine = portsOf(game, seat).includes(at);
  const dock = game.docks[at] ?? [];
  let next: CatanGame | null = null;
  if (which !== null && boat !== undefined && reaches && mine) {
    if (boat.hold.length === 0 && dock.length > 0) {
      // As much as fits: a hold takes "zwei kleine Spielfiguren oder eine
      // große", so two units go aboard together and an explorer alone.
      const taking = bigCargo(dock[0]) ? 1 : Math.min(dock.length, HOLD_SMALL);
      next = {
        ...game,
        boats: game.boats.map((each, index) =>
          index === which ? { ...each, hold: dock.slice(0, taking) } : each,
        ),
        docks: { ...game.docks, [at]: dock.slice(taking) },
      };
    } else if (boat.hold.length > 0 && dock.length === 0) {
      next = {
        ...game,
        boats: game.boats.map((each, index) =>
          index === which ? { ...each, hold: [] } : each,
        ),
        docks: { ...game.docks, [at]: [...boat.hold] },
      };
    }
  }
  return next === null ? null : note(next, `${nameOf(game, seat)}: lädt um.`);
}

/**
 * Founds a settlement from an explorer ship.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the crossing
 * @returns the game after it, or null
 * @remarks
 * "Nimm zum Gründen einer Siedlung dein Schiff zusammen mit dem Entdecker
 * zurück in deinen Vorrat und setze dann ohne weitere Kosten eine Siedlung auf
 * der Kreuzung des Landschaftsfeldes ein." Ship and explorer are both spent -
 * which is what makes an explorer voyage a decision and not a free settlement.
 */
function doLandfall(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  const which = game.sailing;
  const boat = which === null ? undefined : game.boats[which];
  const allowed =
    which !== null &&
    boat !== undefined &&
    boat.owner === seat &&
    game.phase === "sailing" &&
    boat.hold.includes("entdecker") &&
    landingSpots(game, seat, boat.at).includes(at);
  return allowed && which !== null
    ? checkWinner(
        note(
          withPlayer(
            {
              ...game,
              towns: game.towns.map((town, crossing) =>
                crossing === at ? { owner: seat, city: false } : town,
              ),
              boats: game.boats.filter((unused, index) => index !== which),
              sailing: null,
            },
            seat,
            {
              ...game.players[seat],
              settlements: game.players[seat].settlements - 1,
              // Ship and explorer are gone for good, back into the box.
              boatsLeft: game.players[seat].boatsLeft + 1,
              scoutsLeft: game.players[seat].scoutsLeft + 1,
            },
          ),
          `${nameOf(game, seat)}: gründet eine Siedlung mit einem Entdeckerschiff.`,
        ),
      )
    : null;
}

/** Whether this seat still has a ship that could sail. */
function sailsLeft(game: CatanGame, seat: number): boolean {
  return (
    finding(game) &&
    game.boats.some(
      (boat) =>
        boat.owner === seat &&
        !boat.done &&
        (lanesFrom(game, boat).length > 0 ||
          (boat.hold.includes("entdecker") &&
            landingSpots(game, seat, boat.at).length > 0)),
    )
  );
}

/** Opens the movement phase, with every ship rested. */
function startSailing(game: CatanGame): CatanGame {
  return {
    ...game,
    phase: "sailing",
    sailing: null,
    boats: game.boats.map((boat) => ({
      ...boat,
      spent: 0,
      boosted: false,
      done: false,
    })),
  };
}

/**
 * Builds a unit into a harbour basin or into a waiting ship.
 *
 * @param game - the game
 * @param seat - whose unit
 * @param at - the crossing of the harbour, or the path of the ship
 * @returns the game after it, or null
 * @remarks
 * "Wenn du eine Einheit baust, stellst du sie entweder auf einen freien Platz
 * im Becken einer deiner Hafensiedlungen oder auf einen freien Platz in einem
 * deiner Schiffe, das auf einem Meerweg neben deiner Hafensiedlung steht. In
 * einem leeren Hafenbecken oder in einem leeren Schiff finden bis zu 2
 * Einheiten Platz."
 */
function doUnit(game: CatanGame, seat: number, at: number): CatanGame | null {
  const player = game.players[seat];
  const board = islandOf(game.land.length);
  // Units are the mission's own figures: they storm the camps of scenario 2
  // and befriend the villages of scenario 4.
  const ready =
    (camping(game) || spicing(game)) &&
    game.phase === "trade" &&
    player.unitsLeft > 0 &&
    covers(player.hand, UNIT_COST);
  const port =
    ready && at < board.crossings.length && portsOf(game, seat).includes(at)
      ? at
      : null;
  const boat =
    ready && port === null
      ? game.boats.findIndex(
          (each) =>
            each.at === at &&
            each.owner === seat &&
            holdRoom(each.hold, false) &&
            board.paths[at].ends.some((end) =>
              portsOf(game, seat).includes(end),
            ),
        )
      : -1;
  let next: CatanGame | null = null;
  if (port !== null && holdRoom(game.docks[port] ?? [], false)) {
    next = {
      ...game,
      docks: {
        ...game.docks,
        [port]: [...(game.docks[port] ?? []), "einheit"],
      },
    };
  } else if (boat >= 0) {
    next = {
      ...game,
      boats: game.boats.map((each, index) =>
        index === boat ? { ...each, hold: [...each.hold, "einheit"] } : each,
      ),
    };
  }
  return next === null
    ? null
    : note(
        spend(
          withPlayer(next, seat, {
            ...player,
            unitsLeft: player.unitsLeft - 1,
          }),
          seat,
          UNIT_COST,
        ),
        `${nameOf(game, seat)}: baut eine Einheit.`,
      );
}

/**
 * Sets the ship's units down on a pirate camp.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the Goldflussfeld the camp sits on
 * @returns the game after it, or null
 * @remarks
 * "Auf einem Piratenlager duerfen maximal 3 Einheiten stehen", and the third
 * one takes it - but only once the whole movement phase is over: "setzt du die
 * dritte Einheit auf ein Piratenlager, fuehrst du zunaechst deine
 * Bewegungsphase zu Ende durch, bis du alle Schiffe bewegt hast."
 */
function doStorm(game: CatanGame, seat: number, at: number): CatanGame | null {
  const which = game.sailing;
  const boat = which === null ? undefined : game.boats[which];
  const camp = campAt(game, at);
  const units = boat?.hold.filter((cargo) => cargo === "einheit").length ?? 0;
  const room = camp === null ? 0 : CAMP_UNITS - camp.units.length;
  const landing = Math.min(units, room);
  return which === null ||
    boat === undefined ||
    boat.owner !== seat ||
    camp === null ||
    game.phase !== "sailing" ||
    landing <= 0 ||
    !campsFrom(game, boat.at).includes(at)
    ? null
    : note(
        {
          ...game,
          camps: {
            ...game.camps,
            [at]: {
              ...camp,
              units: [
                ...camp.units,
                ...Array.from({ length: landing }, () => seat),
              ],
            },
          },
          boats: game.boats.map((each, index) =>
            index === which
              ? {
                  ...each,
                  hold: each.hold.filter((cargo) => cargo !== "einheit"),
                }
              : each,
          ),
        },
        `${nameOf(game, seat)}: setzt ${landing} Einheit(en) auf einem Piratenlager ab.`,
      );
}

/**
 * Resolves every camp that has its three units, at the end of a movement phase.
 *
 * @param game - the game, once every ship has finished
 * @param seat - whose turn it is
 * @returns the game with the conquests settled
 * @remarks
 * "Alle, die an der Eroberung mit mindestens einer Einheit beteiligt sind,
 * erhalten 2 Gold als Belohnung und duerfen mit ihrem Markierungsstein 1 Feld
 * auf der Missionsleiste vorruecken." Then the hero: everybody rolls a die and
 * adds their own units, the highest moves one field further and loses a unit,
 * and a lone conqueror gets that step without rolling at all.
 */
function takeCamps(game: CatanGame, seat: number): CatanGame {
  let next = game;
  for (const [key, camp] of Object.entries(game.camps)) {
    const hex = Number(key);
    if (!camp.taken && camp.units.length >= CAMP_UNITS) {
      next = takeCamp(next, seat, hex);
    }
  }
  return next;
}

/** One camp falling. */
function takeCamp(game: CatanGame, seat: number, hex: number): CatanGame {
  const camp = game.camps[hex];
  const helpers = [...new Set(camp.units)];
  const random = createRandom(game.seed);
  let next: CatanGame = note(
    { ...game, seed: random.state() },
    `Ein Piratenlager ist erobert.`,
  );
  // Everybody with a unit on it: two gold and a step, starting with the seat
  // whose turn it is and going clockwise.
  const order = [
    ...helpers.filter((each) => each === seat),
    ...helpers.filter((each) => each !== seat),
  ];
  for (const helper of order) {
    next = missionStep(withGold(next, helper, CAMP_GOLD), helper);
  }
  // The hero. A lone conqueror needs no roll: "hat eine Person allein ein
  // Piratenlager erobert, rueckt sie automatisch ein weiteres Feld vor".
  const scores = order.map(
    (helper) =>
      camp.units.filter((each) => each === helper).length +
      (order.length === 1 ? 0 : randomInt(random, DIE_SIDES) + 1),
  );
  const best = Math.max(...scores);
  const front = order.filter((unused, at) => scores[at] === best);
  const hero =
    front.length === 1
      ? front[0]
      : // "Kommt es zu einem Gleichstand, gewinnt die Person, die mehr
        // Einheiten eingesetzt hat."
        [...front].sort(
          (one, other) =>
            camp.units.filter((each) => each === other).length -
            camp.units.filter((each) => each === one).length,
        )[0];
  next = note(
    missionStep({ ...next, seed: random.state() }, hero),
    `${nameOf(game, hero)}: ist Held der Eroberung (+1 Feld, -1 Einheit).`,
  );
  // The hero's unit goes home, and the rest stay beside the camp until a ship
  // fetches them - which is a rule about pieces on a table, so the units simply
  // go back to their owners here and the camp keeps none.
  const left = dropUnit(camp.units, hero);
  return {
    ...next,
    camps: { ...next.camps, [hex]: { units: [], taken: true } },
    players: next.players.map((player, at) => ({
      ...player,
      unitsLeft: player.unitsLeft + left.filter((each) => each === at).length,
    })),
  };
}

/** One unit of a seat out of a camp's garrison. */
function dropUnit(units: readonly number[], seat: number): readonly number[] {
  const at = units.indexOf(seat);
  return at === -1 ? units : [...units.slice(0, at), ...units.slice(at + 1)];
}

/** Moves one marker along the mission track. */
function missionStep(game: CatanGame, seat: number): CatanGame {
  return checkWinner({
    ...game,
    mission: game.mission.map((step, at) =>
      at === seat ? Math.min(step + 1, MISSION_STEPS.length - 1) : step,
    ),
  });
}

/**
 * Rolls one ship against a pirate ship.
 *
 * @param game - the game
 * @param seat - who is hunting
 * @param boat - which ship
 * @returns the game after the roll, or null
 * @remarks
 * "Um ein Piratenschiff zu verjagen, wuerfelst du fuer jedes deiner
 * kampffaehigen Schiffe mit einem Wuerfel. Wuerfelst du eine '6', hast du die
 * Piraten verjagt." One try per ship and turn.
 */
function doHunt(game: CatanGame, seat: number, boat: number): CatanGame | null {
  if (game.phase !== "sailing" || !chasers(game, seat).includes(boat)) {
    return null;
  }
  const random = createRandom(game.seed);
  const die = randomInt(random, DIE_SIDES) + 1;
  const rolled = note(
    { ...game, seed: random.state(), chased: [...game.chased, boat] },
    `${nameOf(game, seat)}: wuerfelt ${die} gegen das Piratenschiff.`,
  );
  const beaten: CatanGame = { ...rolled, pirateShip: null };
  return chaseRolls(game, seat).includes(die)
    ? // "Anschliessend setzt du dein eigenes Piratenschiff auf einem beliebigen
      // erlaubten Meerfeld ein." Unless there is none yet, and then the sea
      // simply stays free.
      pirateSeas(beaten).length > 0
      ? { ...beaten, phase: "corsair" }
      : beaten
    : rolled;
}

/**
 * Puts one's own pirate ship on a sea field, and takes a card for it.
 *
 * @remarks
 * "Setzt du dein Piratenschiff auf einem Meerfeld ein, musst du einen Rohstoff
 * aus der verdeckten Hand ziehen von einer Person, die ein Schiff auf einem
 * Meerweg dieses Meerfelds hat ... Besitzt eine Person keinen Rohstoff, darfst
 * du dir stattdessen 1 Gold von ihr nehmen."
 */
function doCorsair(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  if (game.phase !== "corsair" || !pirateSeas(game).includes(at)) {
    return null;
  }
  const board = islandOf(game.land.length);
  const rim = board.hexes[at].rim;
  const around = [
    ...new Set(
      game.boats
        .filter((boat) => rim.includes(boat.at) && boat.owner !== seat)
        .map((boat) => boat.owner),
    ),
  ];
  // "Wird ein Piratenschiff auf einem Fischfeld mit einem Fischschwarm
  // platziert, kommt der Fischschwarm zurück in den Vorrat."
  const scared = shoalAt(game, at);
  const placed = note(
    {
      ...game,
      pirateShip: { owner: seat, hex: at },
      shoals: game.shoals.filter((hex) => hex !== at),
      shoalsLeft: game.shoalsLeft + (scared ? 1 : 0),
    },
    scared
      ? `${nameOf(game, seat)}: setzt sein Piratenschiff ein und verscheucht einen Fischschwarm.`
      : `${nameOf(game, seat)}: setzt sein Piratenschiff ein.`,
  );
  const holding = around.filter(
    (other) => handSize(game.players[other].hand) > 0,
  );
  const broke = around.filter(
    (other) =>
      handSize(game.players[other].hand) === 0 && game.players[other].gold > 0,
  );
  // A purse instead of a card, where there is no card to take.
  const looted = broke.reduce(
    (state, other) =>
      note(
        withGold(withGold(state, other, -TRIBUTE), seat, TRIBUTE),
        `${nameOf(game, seat)}: nimmt ${nameOf(game, other)} 1 Gold ab.`,
      ),
    placed,
  );
  // Back where it came from: a seven interrupts the building phase, a
  // successful chase interrupts a voyage. The ship at the helm is what tells
  // the two apart.
  const back: Phase = game.sailing === null ? "trade" : "sailing";
  return holding.length === 0
    ? { ...looted, phase: back, targets: [] }
    : { ...looted, phase: "steal", targets: holding, after: null };
}

/**
 * One step of a voyage, with the pirate's toll paid if one is due.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param which - which ship
 * @param at - the sea path it moves to
 * @returns the game after the step, or null when the toll cannot be paid
 * @remarks
 * "Moechtest du mit einem Schiff die Meerwege eines Meerfeldes, das von einem
 * fremden Piratenschiff besetzt ist, zur Bewegung nutzen, musst du als Tribut 1
 * Gold in den Vorrat zahlen ... Hast du den Tribut fuer ein Schiff bezahlt,
 * darfst du mit diesem Schiff in deinem aktuellen Zug beliebig viele Meerwege
 * des Piratenfeldes zur Bewegung nutzen." Once a ship and a turn, and it goes
 * to the bank rather than to the pirate's owner.
 */
function sailStep(
  game: CatanGame,
  seat: number,
  which: number,
  at: number,
): CatanGame | null {
  const owed = tributeDue(game, seat, which, at);
  if (owed && game.players[seat].gold < TRIBUTE) {
    return null;
  }
  const paid = owed
    ? note(
        withGold(
          { ...game, tributes: [...game.tributes, which] },
          seat,
          -TRIBUTE,
        ),
        `${nameOf(game, seat)}: zahlt 1 Gold Tribut an die Piraten.`,
      )
    : game;
  // A step across a jam costs a point for every lane it crosses - see
  // laneCosts.
  const price = laneCosts(game, game.boats[which]).get(at) ?? 1;
  return discover(
    {
      ...paid,
      boats: paid.boats.map((each, index) =>
        index === which ? { ...each, at, spent: each.spent + price } : each,
      ),
    },
    seat,
    which,
  );
}

/**
 * Rolls one die for a shoal.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the game after the roll, or null when the try is not open
 * @remarks
 * "Würfle mit einem Würfel. Würfelst du die Zahl eines Fischfelds, nimmst du dir
 * einen Fischschwarm aus dem Vorrat und legst ihn auf dieses Feld." A miss is a
 * result too, and it uses the one try up all the same.
 */
function doCast(game: CatanGame, seat: number): CatanGame | null {
  if (!canCast(game)) {
    return null;
  }
  const random = createRandom(game.seed);
  const die = randomInt(random, FISH_SIDES) + 1;
  const hex = fishField(game, die);
  const rolled: CatanGame = { ...game, seed: random.state(), cast: true };
  return hex === null
    ? note(rolled, `${nameOf(game, seat)}: würfelt ${die} - kein Fischschwarm.`)
    : note(
        {
          ...rolled,
          shoals: [...rolled.shoals, hex],
          shoalsLeft: rolled.shoalsLeft - 1,
        },
        `${nameOf(game, seat)}: würfelt ${die} - ein Fischschwarm zieht auf.`,
      );
}

/**
 * Takes a shoal aboard.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the field the shoal is lying on
 * @returns the game after it, or null
 * @remarks
 * "Nimm den Fischschwarm vom Feld und lege ihn in dein Schiff ... Hast du ein
 * Schiff zu einem Fischschwarm gezogen und diesen gefangen, darfst du mit dem
 * Schiff weiterziehen" - lifting it costs no movement point and does not end
 * the voyage.
 */
function doCatch(game: CatanGame, seat: number, at: number): CatanGame | null {
  const spot = catchSpots(game, seat).find((each) => each.hex === at);
  return spot === undefined
    ? null
    : note(
        {
          ...game,
          shoals: game.shoals.filter((hex) => hex !== at),
          boats: game.boats.map((each, index) =>
            index === spot.boat ? { ...each, hold: ["fisch"] } : each,
          ),
        },
        `${nameOf(game, seat)}: fängt einen Fischschwarm.`,
      );
}

/**
 * Unloads a shoal at the Catanischer Rat.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the harbour of the council it points at
 * @returns the game after it, or null
 * @remarks
 * "Der Fischschwarm kommt zurück in den Vorrat. Anschließend rückst du mit
 * deinem Markierungsstein auf der Missionsleiste Fische für Catan 1 Feld vor."
 */
function doDeliver(
  game: CatanGame,
  seat: number,
  at: number,
): CatanGame | null {
  const spot = landings(game, seat).find((each) => each.at === at);
  const boat = spot === undefined ? undefined : game.boats[spot.boat];
  if (spot === undefined || boat === undefined) {
    return null;
  }
  const shoals = boat.hold.filter((cargo) => cargo === "fisch").length;
  const sacks = boat.hold.filter((cargo) => cargo === "gewuerz").length;
  const step = (track: readonly number[], by: number): readonly number[] =>
    track.map((each, who) =>
      who === seat ? Math.min(each + by, MISSION_STEPS.length - 1) : each,
    );
  return checkWinner(
    note(
      {
        ...game,
        shoalsLeft: game.shoalsLeft + shoals,
        boats: game.boats.map((each, index) =>
          index === spot.boat ? { ...each, hold: [] } : each,
        ),
        catches: step(game.catches, shoals),
        // "Anschliessend rueckst du deinen Markierungsstein fuer jeden
        // abgelieferten Gewuerzsack ein Feld ... weiter" - two sacks, two
        // fields, which is what makes carrying two worth the trip.
        spices: step(game.spices, sacks),
      },
      `${nameOf(game, seat)}: liefert beim Catanischen Rat ab (${shoals} Fisch, ${sacks} Gewürz).`,
    ),
  );
}

/**
 * Sets a unit down on a village and takes a sack of spices aboard.
 *
 * @param game - the game
 * @param seat - whose unit
 * @param at - the Gewürzfeld
 * @returns the game after it, or null
 * @remarks
 * "Im Gegenzug belädst du das Schiff mit einem Gewürzsack. Außerdem erhältst du
 * von da an einen permanenten Vorteil im Spiel." The unit stays for good: "eine
 * abgesetzte Einheit darf das Gewürzfeld nicht mehr verlassen."
 */
function doDrop(game: CatanGame, seat: number, at: number): CatanGame | null {
  const spot = villageSpots(game, seat).find((each) => each.hex === at);
  const boat = spot === undefined ? undefined : game.boats[spot.boat];
  if (spot === undefined || boat === undefined) {
    return null;
  }
  const hold: readonly Cargo[] = [
    ...boat.hold.filter((cargo) => cargo !== "einheit"),
    "gewuerz",
  ];
  // A hold takes two small figures, and a unit has just left it - so the sack
  // always fits, but a second sack from another village might not.
  return holdRoom(
    boat.hold.filter((cargo) => cargo !== "einheit"),
    false,
  )
    ? note(
        {
          ...game,
          villages: {
            ...game.villages,
            [at]: [...(game.villages[at] ?? []), seat],
          },
          sacks: { ...game.sacks, [at]: (game.sacks[at] ?? 0) - 1 },
          boats: game.boats.map((each, index) =>
            index === spot.boat ? { ...each, hold } : each,
          ),
        },
        `${nameOf(game, seat)}: setzt eine Einheit im Dorf ab und lädt einen Gewürzsack (${SPICE_NAMES[game.spice[at] ?? "gold"]}).`,
      )
    : null;
}

/**
 * Sells one resource to a Gutes-Gold village.
 *
 * @param game - the game
 * @param seat - who is selling
 * @param sort - which resource
 * @returns the game after it, or null
 * @remarks
 * "Bist du mit einem der beiden Dörfer befreundet, darfst du 1-mal in der
 * Handels- und Bauphase deines Zuges 1 beliebigen Rohstoff gegen 1 Gold
 * eintauschen. Bist du mit beiden Dörfern befreundet, ... 2-mal."
 */
function doSell(
  game: CatanGame,
  seat: number,
  sort: Resource,
): CatanGame | null {
  return game.phase === "trade" &&
    game.sold < goldSales(game, seat) &&
    game.players[seat].hand[sort] > 0
    ? note(
        withGold(
          withHand(
            { ...game, sold: game.sold + 1 },
            seat,
            withCard(game.players[seat].hand, sort, -1),
          ),
          seat,
          SELL_GOLD,
        ),
        `${nameOf(game, seat)}: verkauft 1 ${SORT_NAMES[sort]} für 1 Gold ins Dorf.`,
      )
    : null;
}

/** What each village advantage is called in the log. */
const SPICE_NAMES: Readonly<Record<Spice, string>> = {
  fahrt: "Schnelle Fahrt",
  pirat4: "Piratenbonus 4",
  pirat5: "Piratenbonus 5",
  gold: "Gutes Gold",
};

/**
 * Whether a crossing lies on the island the scenario founds on.
 *
 * @param game - the game
 * @param at - the crossing
 * @returns whether a founding settlement may go there
 * @remarks
 * *Zu neuen Ufern* founds "auf der großen Insel", *Durch die Wüste* "auf der
 * größeren Hauptinsel - rechts bzw. unterhalb des Wüstengürtels". Both keep the
 * rest of the board for the ships, and for the two victory-point chips a first
 * settlement out there is worth.
 */
function onMainIsland(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  const main = dunes(game) ? DUNE_MAIN : mainIsland(board);
  return board.crossings[at].hexes.some((hex) => main.includes(hex));
}

/**
 * Lifts the fog from every field at the ends of a path just built on.
 *
 * @param game - the game
 * @param seat - who built
 * @param at - the path the road or ship went on
 * @returns the game with whatever was under the fog turned face up
 * @remarks
 * "Setzt ihr ein Schiff oder eine Straße auf einen Weg, an dessen Ende ein
 * Nebelfeld liegt, dreht ihr es um und entdeckt, was darunter verborgen ist.
 * Handelt es sich um Meer, passiert nichts weiter. Verbirgt sich hier jedoch
 * ein Landschaftsfeld, legt ihr den obersten Zahlenchip vom verdeckten Stapel
 * darauf. Wer das Landschaftsfeld entdeckt hat, erhält sofort eine
 * Rohstoffkarte dieses Landschaftsfelds."
 */
function liftFog(game: CatanGame, seat: number, at: number): CatanGame {
  if (!fogging(game)) {
    return game;
  }
  const board = islandOf(game.land.length);
  const lifting = [
    ...new Set(
      board.paths[at].ends.flatMap((end) => board.crossings[end].hexes),
    ),
  ].filter((hex) => foggy(game, hex));
  return lifting.reduce((next, hex) => {
    const kind = next.hidden[hex];
    const turned: CatanGame = {
      ...next,
      land: next.land.map((each, index) => (index === hex ? kind : each)),
      chips: next.chips.map((each, index) =>
        index === hex ? next.hiddenChips[hex] : each,
      ),
    };
    const reward = YIELD[kind];
    return note(
      reward === null
        ? turned
        : withHand(
            turned,
            seat,
            withCard(turned.players[seat].hand, reward, 1),
          ),
      reward === null
        ? `${nameOf(next, seat)}: lichtet den Nebel - Meer.`
        : `${nameOf(next, seat)}: lichtet den Nebel - ${LAND_LOG_NAMES[kind]}, dafür 1 ${SORT_NAMES[reward]}.`,
    );
  }, game);
}

/**
 * Takes the gift a ship has just reached.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param at - the sea path it went on
 * @returns the game after the gift has changed hands
 * @remarks
 * "Wer zuerst eine kleine Insel erreicht und ein Schiff auf einer Kante mit
 * einem Siegpunkt-Chip baut oder an eine solche Kante versetzt, darf den Chip
 * nehmen ... Ist ein Chip erbeutet, wird er nicht nachgefüllt." The same for
 * the development cards - "sie zählt wie eine in diesem Zug erworbene
 * Entwicklungskarte" - and for the harbours.
 */
function takeGift(game: CatanGame, seat: number, at: number): CatanGame {
  const gift = game.presents[at];
  if (!tribe(game) || gift === undefined) {
    return game;
  }
  const taken: CatanGame = {
    ...game,
    presents: Object.fromEntries(
      Object.entries(game.presents).filter(([path]) => Number(path) !== at),
    ),
  };
  if (gift.kind === "chip") {
    return note(
      withPlayer(taken, seat, {
        ...taken.players[seat],
        islandChips: taken.players[seat].islandChips + 1,
      }),
      `${nameOf(game, seat)}: findet einen Siegpunkt-Chip.`,
    );
  }
  if (gift.kind === "card") {
    const card = taken.stack[0];
    return card === undefined
      ? taken
      : note(
          withPlayer({ ...taken, stack: taken.stack.slice(1) }, seat, {
            ...taken.players[seat],
            // "Sie zählt wie eine in diesem Zug erworbene Entwicklungskarte":
            // fresh, so it cannot be played before the next turn.
            fresh: [...taken.players[seat].fresh, card],
          }),
          `${nameOf(game, seat)}: findet eine Entwicklungskarte.`,
        );
  }
  return note(
    layPort(taken, seat, gift.want),
    `${nameOf(game, seat)}: findet einen Hafen.`,
  );
}

/**
 * Puts a harbour won as a gift beside one of this seat's settlements.
 *
 * @param game - the game
 * @param seat - who won it
 * @param want - what the harbour trades, or null for a 3:1
 * @returns the game with the harbour placed, or kept for later
 * @remarks
 * "Besitzt du eine Küstensiedlung ohne Hafen, musst du den Hafen sofort an
 * diese anlegen. Hast du mehrere eigene Küstensiedlungen, darfst du selbst
 * wählen ... An eine Küstensiedlung darf nur 1 Hafen angelegt werden. Besitzt
 * du keine Küstensiedlung, die für den Hafen in Frage kommt, bewahrst du ihn
 * auf." The choice between several own settlements is made here rather than
 * asked: the first one on the coast takes it, and which one that is changes
 * nothing about what the harbour does.
 */
function layPort(
  game: CatanGame,
  seat: number,
  want: Resource | null,
): CatanGame {
  const board = islandOf(game.land.length);
  const spot = board.crossings.find(
    (crossing) =>
      game.towns[crossing.id]?.owner === seat &&
      crossing.paths.some((path) => seaPath(game, path)) &&
      !game.harbours.some((harbour) =>
        board.paths[harbour.path].ends.includes(crossing.id),
      ),
  );
  return spot === undefined
    ? {
        ...game,
        heldPorts: game.heldPorts.map((held, who) =>
          who === seat ? [...held, want] : held,
        ),
      }
    : {
        ...game,
        harbours: [
          ...game.harbours,
          {
            path:
              spot.paths.find((path) => seaPath(game, path)) ?? spot.paths[0],
            want,
          },
        ],
      };
}

/** Lays out whatever harbours a seat is still carrying, if it now can. */
function layHeldPorts(game: CatanGame, seat: number): CatanGame {
  return game.heldPorts[seat].reduce((next, want) => {
    const placed = layPort(
      {
        ...next,
        heldPorts: next.heldPorts.map((held, who) =>
          who === seat ? held.slice(1) : held,
        ),
      },
      seat,
      want,
    );
    return placed;
  }, game);
}

/**
 * Opens the trade relations a ship has just made, and pays their first bale.
 *
 * @param game - the game
 * @param seat - whose ship
 * @returns the game with the new relations and their cloth
 * @remarks
 * "Sobald du eine Schiffslinie zwischen einer eigenen Siedlung und einem Dorf
 * des Vergessenen Stammes hergestellt hast, unterhältst du eine
 * Handelsbeziehung zu diesem Dorf ... darfst du dir sofort 1 Stoffballen vom
 * Vorrat dieses Dorfes nehmen." And the line is then shut: "aus dieser
 * Schiffslinie darf kein Schiff mehr versetzt werden."
 */
function openTrades(game: CatanGame, seat: number): CatanGame {
  if (!cloth(game)) {
    return game;
  }
  return reachedVillages(game, seat)
    .filter((each) => !(game.traders[each.at] ?? []).includes(seat))
    .reduce((next, each) => {
      const village = next.villagesOf[each.at];
      const opened: CatanGame = {
        ...next,
        traders: {
          ...next.traders,
          [each.at]: [...(next.traders[each.at] ?? []), seat],
        },
        lockedShips: [...new Set([...next.lockedShips, ...each.line])],
      };
      return note(
        village === undefined || village.bales === 0
          ? opened
          : takeBale(opened, seat, each.at),
        `${nameOf(next, seat)}: schließt eine Handelsbeziehung zu einem Dorf.`,
      );
    }, game);
}

/**
 * Hands one bale of cloth from a village to a seat.
 *
 * @param game - the game
 * @param seat - who takes it
 * @param at - the village
 * @returns the game after it
 * @remarks
 * "Reicht der Stoffballenvorrat eines Dorfes nicht für alle Beteiligten aus,
 * werden die fehlenden Stoffballen aus dem allgemeinen Vorrat entnommen. Wird
 * die Zahl eines Dorfes gewürfelt, dessen Stoffballen bereits aufgebraucht
 * sind, erhält niemand mehr Stoffballen von diesem Dorf - auch nicht aus dem
 * allgemeinen Vorrat."
 */
function takeBale(game: CatanGame, seat: number, at: number): CatanGame {
  const village = game.villagesOf[at];
  if (village === undefined || village.bales === 0) {
    return game;
  }
  return withPlayer(
    {
      ...game,
      villagesOf: {
        ...game.villagesOf,
        [at]: { ...village, bales: village.bales - 1 },
      },
    },
    seat,
    { ...game.players[seat], bales: game.players[seat].bales + 1 },
  );
}

/**
 * Pays out the villages whose number has just come up.
 *
 * @param game - the game
 * @param rolled - what the dice showed
 * @returns the game with the cloth handed out
 * @remarks
 * "Wird im weiteren Spielverlauf die Zahl des Dorfes gewürfelt, darfst du dir 1
 * weiteren Stoffballen nehmen. Haben 2 oder mehr Personen eine
 * Handelsbeziehung zum gleichen Dorf geschlossen, dürfen sich alle 1
 * Stoffballen nehmen, die an das Dorf angeschlossen sind."
 */
function payVillages(game: CatanGame, rolled: number): CatanGame {
  if (!cloth(game)) {
    return game;
  }
  return Object.entries(game.villagesOf)
    .filter(([, village]) => village.number === rolled)
    .reduce((next, [at]) => {
      const village = Number(at);
      return (next.traders[village] ?? []).reduce(
        (paid, seat) => takeBale(paid, seat, village),
        next,
      );
    }, game);
}

/**
 * Whether the cloth has run out in all but three villages.
 *
 * @param game - the game
 * @returns whether the second ending has come
 * @remarks
 * "Sobald sich nur noch in 3 Dörfern Stoffballen-Chips befinden, endet das
 * Spiel. Es gewinnt, wer am meisten Siegpunkte erreicht hat. Bei Gleichstand
 * gewinnt, wer mehr Stoffballen besitzt."
 */
function clothRunOut(game: CatanGame): boolean {
  return (
    cloth(game) &&
    Object.values(game.villagesOf).filter((village) => village.bales > 0)
      .length <= CLOTH_LAST_VILLAGES
  );
}

/** Who has won when the cloth runs out. */
function clothWinner(game: CatanGame): number {
  const best = Math.max(
    ...game.players.map((unused, at) => pointsOf(game, at)),
  );
  const front = game.players
    .map((unused, at) => at)
    .filter((at) => pointsOf(game, at) === best);
  return [...front].sort(
    (one, other) => game.players[other].bales - game.players[one].bales,
  )[0];
}

/**
 * The fewest warships that can win a fight.
 *
 * @remarks
 * "Ist die Anzahl deiner Kriegsschiffe größer als die gewürfelte Zahl, hast du
 * gewonnen" - and the die is at least a one, so one warship never wins.
 */
const FIGHT_LEAST = 2;

/**
 * Whether no fortress in *Die Pirateninseln* can ever be taken again.
 *
 * @param game - the game
 * @returns true when the scenario has run out of ways to end itself
 * @remarks
 * Winning here needs a conquered fortress, a fortress needs warships, and
 * warships come from one place only: "deckst du eine Ritterkarte (im Spiel zu
 * viert auch Siegpunktkarte) auf, darfst du ... ein Kriegsschiff umwandeln",
 * out of a stack that is not reshuffled - "ist der Stapel mit den
 * Entwicklungskarten leer, können keine neuen Entwicklungskarten mehr gekauft
 * werden".
 *
 * So once the stack is empty, nobody holds a card that arms a ship, and no
 * colour has the two warships a fight needs, the fortresses stand for ever and
 * the game cannot end at all. A table would stop there and count the points;
 * this does the same. Every part of that has to hold at once: one colour with
 * two warships, or one card still in a hand, and the game is alive.
 */
function fortsSafe(game: CatanGame): boolean {
  return (
    corsairs(game) &&
    game.stack.length === 0 &&
    !realSeats(game).some((seat) => canConquer(game, seat))
  );
}

/**
 * Whether this seat could still take its fortress.
 *
 * @param game - the game
 * @param seat - whose fortress
 * @returns whether any road to a conquest is left
 * @remarks
 * Asked cheapest first, because it walks the whole sea and is asked at the end
 * of every turn: a fortress already taken or two warships on the water answer
 * it without looking at anything else.
 */
function canConquer(game: CatanGame, seat: number): boolean {
  const player = game.players[seat];
  if (fortOf(game, seat) === null) {
    return false;
  }
  const holds = [...player.deck, ...player.fresh].some(
    (card) => card === "ritter" || card === "siegpunkt",
  );
  if (!holds && warshipsOf(game, seat) < FIGHT_LEAST) {
    return false;
  }
  if (warshipsOf(game, seat) >= FIGHT_LEAST) {
    // Strong enough to fight - so it is only over if the line can never reach
    // the fortress at all.
    return atFort(game, seat) || lineCanGrow(game, seat);
  }
  // A card only arms a ship that is there and still plain, and the line it
  // would come from cannot grow once it has reached the fortress: "die
  // Schiffslinie darf ... nicht über die Piratenfestung hinaus gebaut werden".
  // A hand full of knights beside a line of one armed ship is a hand that can
  // do nothing at all.
  return (
    shipLine(game, seat).some((path) => !game.warships.includes(path)) ||
    (!atFort(game, seat) &&
      player.shipsLeft > 0 &&
      shipSpots(game, seat).length > 0)
  );
}

/**
 * Why this game cannot go on, if it cannot.
 *
 * @param game - the game at the end of a turn
 * @returns what to say about it, or null while there is still something to do
 */
function deadEnd(game: CatanGame): string | null {
  if (fortsSafe(game)) {
    return "die Piratenfestungen sind nicht mehr zu erobern.";
  }
  // In Die Pirateninseln a colour that has taken its fortress can still win on
  // points alone - so there the built-out board only ends the game once nobody
  // can conquer anything either.
  const conquering =
    corsairs(game) && realSeats(game).some((seat) => canConquer(game, seat));
  return !conquering && boardSpent(game)
    ? "es ist alles gebaut, was zu bauen war."
    : null;
}

/**
 * Whether the board has nothing left to build and the table nothing left to buy.
 *
 * @param game - the game
 * @returns true when no move anybody makes could change the score again
 * @remarks
 * Catan ends when somebody reaches the target, and the rulebook never asks what
 * happens if nobody can. On a small board with many colours that does happen:
 * every crossing is taken or blocked, every road and every ship is placed or
 * has nowhere to go, and "ist der Stapel mit den Entwicklungskarten leer,
 * können keine neuen Entwicklungskarten mehr gekauft werden". From there the
 * dice can roll for ever and nothing moves - a self-played table sat at twelve
 * of thirteen points for nine thousand turns.
 *
 * So the referee counts the points and the game is over, which is what a table
 * would do. Every part has to hold at once, and all of it is asked of the same
 * lists the building itself uses: one free crossing, one road, one ship, one
 * card anywhere, and the game goes on.
 *
 * Only where this list is the **whole** list: the expansions bring their own
 * pieces - knights, wagons, ships with cargo, missions - and a game of theirs
 * that looks spent may still have a camp to storm or a fish to land. Those
 * scenarios end themselves; see the ships and the fortresses above.
 */
function boardSpent(game: CatanGame): boolean {
  return (
    game.phase !== "founding" &&
    !finding(game) &&
    !raiding(game) &&
    !hauling(game) &&
    game.mode !== "ritter" &&
    game.stack.length === 0 &&
    realSeats(game).every((seat) => {
      const player = game.players[seat];
      // A card counts only while it could still change something. Outside Die
      // Pirateninseln that is the knight, which carries the Größte Rittermacht;
      // a Siegpunktkarte is a point in the hand already, and Monopol,
      // Erfindung and Straßenbau only hand out what there is nowhere left to
      // build with. In Die Pirateninseln both knight and Siegpunktkarte arm a
      // ship - and neither is worth anything once that colour's fortress has
      // already fallen.
      const inHand = [...player.deck, ...player.fresh];
      const knights =
        player.knights + inHand.filter((card) => card === "ritter").length;
      const most =
        game.army === null ? ARMY_MIN - 1 : game.players[game.army].knights;
      const useful = corsairs(game)
        ? inHand.some(
            (card) =>
              (card === "ritter" || card === "siegpunkt") &&
              fortOf(game, seat) !== null,
          )
        : // A knight is only worth something while it could still take the
          // Größte Rittermacht: one card against seven played ones changes
          // nothing, and neither does another card for whoever already holds
          // the tile.
          game.army !== seat && knights > most;
      return (
        !useful &&
        townSpots(game, seat).length === 0 &&
        citySpots(game, seat).length === 0 &&
        roadSpots(game, seat).length === 0 &&
        (!sailing(game) || !shipHelps(game, seat))
      );
    })
  );
}

/**
 * Whether this seat's ship line could still be made any longer.
 *
 * @param game - the game
 * @param seat - whose line
 * @returns whether there is a place for one more ship
 * @remarks
 * "Sie muss auf dem kürzesten Weg gebaut werden und darf andere Schiffslinien
 * nicht blockieren" - and the other way round too: a line can be shut in by
 * everybody else's. Then it never reaches its fortress, and its colour can
 * never win however many points it has: one self-played table sat there with
 * fifteen ships, six warships and fifteen points.
 *
 * Only **building** lengthens a line. Versetzen does not: lifting the ship at
 * the front takes away the very thing the next place would have to connect to,
 * so a fleet with an empty supply can shuffle but never advance.
 */
function lineCanGrow(game: CatanGame, seat: number): boolean {
  return shipSpots(game, seat).length > 0;
}

/**
 * Whether moving one ship could still change anything for this seat.
 *
 * @param game - the game
 * @param seat - whose fleet
 * @returns whether one move would open a building spot or take a gift
 * @remarks
 * "Du darfst pro Zug 1 Schiff versetzen." With nothing left to build, that is
 * the last thing a fleet can do - and it is worth something only where the ship
 * lands on a crossing that opens a settlement, or on one of the gifts of *Der
 * vergessene Stamm*. Anything else is the same fleet in a different place.
 *
 * One move deep, and that is enough: without a supply the line cannot advance
 * (see {@link lineCanGrow}), so what one move cannot reach, ten cannot either.
 */
function shipHelps(game: CatanGame, seat: number): boolean {
  const opens = (before: CatanGame, at: number): boolean => {
    if (game.presents[at] !== undefined) {
      return true;
    }
    const built: CatanGame = {
      ...before,
      ships: before.ships.map((owner, path) => (path === at ? seat : owner)),
    };
    return townSpots(built, seat).length > 0;
  };
  // A ship out of the supply first: that is the ordinary way a line grows.
  if (shipSpots(game, seat).some((at) => opens(game, at))) {
    return true;
  }
  return looseShips(game, seat).some((from) => {
    const lifted: CatanGame = {
      ...game,
      ships: game.ships.map((owner, path) => (path === from ? null : owner)),
      players: game.players.map((player, at) =>
        at === seat ? { ...player, shipsLeft: player.shipsLeft + 1 } : player,
      ),
    };
    return shipSpots(lifted, seat).some(
      (to) => to !== from && opens(lifted, to),
    );
  });
}

/**
 * Sails the pirate fleet, and lets it raid what it comes to.
 *
 * @param game - the game, with the dice already thrown
 * @param dice - the two dice
 * @returns the game after the fleet has moved and raided
 * @remarks
 * "Immer, wenn jemand würfelt, wird zuerst die Piratenflotte bewegt. Die
 * Zugweite entspricht dem Würfel mit der niedrigeren Augenzahl ... Erst danach
 * nehmt ihr euch eure Rohstofferträge." And where it stops: "endet der Zug der
 * Piratenflotte auf einem Meerfeld, an das eine Siedlung/Stadt grenzt, wird
 * diese Siedlung/Stadt sofort überfallen."
 */
function sailArmada(game: CatanGame, dice: readonly number[]): CatanGame {
  if (!corsairs(game)) {
    return game;
  }
  const board = islandOf(game.land.length);
  const ring = fleetRing(board);
  const strength = Math.min(dice[0], dice[1]);
  const moved: CatanGame = {
    ...game,
    armada: (game.armada + strength) % ring.length,
  };
  const at = ring[moved.armada];
  const raided = board.hexes[at].corners
    .map((corner) => moved.towns[corner])
    .reduce<readonly number[]>(
      (list, town) =>
        town === null || list.includes(town.owner)
          ? list
          : [...list, town.owner],
      [],
    );
  return note(
    raided.reduce((next, seat) => plunder(next, seat, strength), moved),
    `Die Piratenflotte zieht ${strength} Felder weiter.`,
  );
}

/**
 * One raid of the pirate fleet on one seat.
 *
 * @param game - the game
 * @param seat - whose settlement is beside the fleet
 * @param strength - the lower die
 * @returns the game after the raid
 * @remarks
 * "Ist der Pirat stärker, verliert die Person 1 Rohstoffkarte und 1 weitere für
 * jede Stadt, die sie besitzt ... Ist die überfallene Person stärker, darf sie
 * sich eine beliebige Rohstoffkarte vom Vorrat nehmen. Bei Gleichstand
 * geschieht nichts."
 */
function plunder(game: CatanGame, seat: number, strength: number): CatanGame {
  const ships = warshipsOf(game, seat);
  if (ships === strength) {
    return game;
  }
  const random = createRandom(game.seed);
  if (ships > strength) {
    const sort = RESOURCES[randomInt(random, RESOURCES.length)];
    return note(
      withHand(
        { ...game, seed: random.state() },
        seat,
        withCard(game.players[seat].hand, sort, 1),
      ),
      `${nameOf(game, seat)}: schlägt die Piratenflotte zurück und nimmt 1 ${SORT_NAMES[sort]}.`,
    );
  }
  // One card, and one more for every city: "1 weitere für jede Stadt".
  const cities = game.towns.filter(
    (town) => town !== null && town.owner === seat && town.city,
  ).length;
  let next: CatanGame = { ...game, seed: random.state() };
  for (let taken = 0; taken <= cities; taken += 1) {
    const hand = next.players[seat].hand;
    const held = RESOURCES.filter((sort) => hand[sort] > 0);
    if (held.length === 0) {
      break;
    }
    const sort = held[randomInt(random, held.length)];
    next = withHand(
      { ...next, seed: random.state() },
      seat,
      withCard(hand, sort, -1),
    );
  }
  return note(
    next,
    `${nameOf(game, seat)}: wird von der Piratenflotte überfallen.`,
  );
}

/**
 * Turns the rearmost ordinary ship of a line into a warship.
 *
 * @param game - the game
 * @param seat - whose line
 * @returns the game with one more warship, or unchanged
 * @remarks
 * "Deckst du eine Ritterkarte auf, darfst du jeweils das hinterste 'normale'
 * Schiff deiner Schiffslinie in ein Kriegsschiff umwandeln. Die aufgedeckte
 * Entwicklungskarte kommt auf einen Ablagestapel."
 */
function armShip(game: CatanGame, seat: number): CatanGame {
  const plain = shipLine(game, seat).find(
    (path) => !game.warships.includes(path),
  );
  return plain === undefined
    ? game
    : note(
        { ...game, warships: [...game.warships, plain] },
        `${nameOf(game, seat)}: rüstet ein Schiff zum Kriegsschiff um.`,
      );
}

/**
 * Attacks the fortress of one's own colour.
 *
 * @param game - the game
 * @param seat - who is attacking
 * @returns the game after the fight, or null when there is nothing to attack
 * @remarks
 * "Ermittle mit einem Würfel die Stärke der Piraten. Ist die Anzahl deiner
 * Kriegsschiffe größer als die gewürfelte Zahl, hast du gewonnen und darfst
 * einen Chip unter der Piratenfestung entfernen. Ist die Anzahl deiner
 * Kriegsschiffe kleiner, verlierst du den Kampf und entfernst deine beiden
 * vordersten Schiffe. Bei einem Unentschieden verlierst du dein vorderstes
 * Schiff. Nach einem Kampf ist dein Zug beendet."
 */
function doAssault(game: CatanGame, seat: number): CatanGame | null {
  const fort = fortOf(game, seat);
  if (
    !corsairs(game) ||
    game.phase !== "trade" ||
    game.stormed ||
    fort === null ||
    !atFort(game, seat)
  ) {
    return null;
  }
  const random = createRandom(game.seed);
  const die = randomInt(random, DIE_SIDES) + 1;
  const ships = warshipsOf(game, seat);
  const rolled: CatanGame = { ...game, seed: random.state(), stormed: true };
  if (ships > die) {
    const left = game.forts[fort].chips - 1;
    const won: CatanGame = {
      ...rolled,
      forts: { ...rolled.forts, [fort]: { owner: seat, chips: left } },
    };
    return checkWinner(
      note(
        won,
        left === 0
          ? `${nameOf(game, seat)}: würfelt ${die} gegen ${ships} Kriegsschiffe - die Festung ist erobert!`
          : `${nameOf(game, seat)}: würfelt ${die} gegen ${ships} Kriegsschiffe und nimmt der Festung einen Chip.`,
      ),
    );
  }
  // The front of the line is its far end: the last ship the walk reaches.
  const line = [...shipLine(rolled, seat)].reverse();
  const lost = line.slice(0, ships < die ? 2 : 1);
  return note(
    withPlayer(
      {
        ...rolled,
        ships: rolled.ships.map((owner, path) =>
          lost.includes(path) ? null : owner,
        ),
        warships: rolled.warships.filter((path) => !lost.includes(path)),
      },
      seat,
      {
        ...rolled.players[seat],
        shipsLeft: rolled.players[seat].shipsLeft + lost.length,
      },
    ),
    `${nameOf(game, seat)}: würfelt ${die} gegen ${ships} Kriegsschiffe und verliert ${lost.length} Schiff(e).`,
  );
}

/**
 * Claims a wonder, or builds its next stage.
 *
 * @param game - the game
 * @param seat - who is building
 * @param which - the wonder
 * @returns the game after it, or null
 * @remarks
 * "Hast du die Bedingung für ein Wunder erfüllt, legst du den Chip in deiner
 * Spielfarbe auf das entsprechende Wunderplättchen ... Nun musst du dieses
 * Wunder auch bauen. Jedes Wunder gliedert sich in vier Stufen. Jede Stufe
 * kostet die auf dem entsprechenden Wunderplättchen angegebenen 5 Rohstoffe ...
 * Verfügst du über genügend Rohstoffe, kannst du während deines Zuges auch
 * mehrere Stufen deines Wunders bauen."
 */
function doWonder(
  game: CatanGame,
  seat: number,
  which: Wonder,
): CatanGame | null {
  const mine = game.wonders[seat];
  const tile = WONDERS[which];
  const allowed =
    wonders(game) &&
    game.phase === "trade" &&
    covers(game.players[seat].hand, tile.cost) &&
    (mine === null
      ? wonderFree(game, which) && wonderOpen(game, seat, which)
      : mine.kind === which && mine.stage < WONDER_STAGES);
  if (!allowed) {
    return null;
  }
  const stage = (mine?.stage ?? 0) + 1;
  return checkWinner(
    note(
      spend(
        {
          ...game,
          wonders: game.wonders.map((each, who) =>
            who === seat ? { kind: which, stage } : each,
          ),
        },
        seat,
        tile.cost,
      ),
      stage === WONDER_STAGES
        ? `${nameOf(game, seat)}: vollendet ${tile.name}!`
        : `${nameOf(game, seat)}: baut ${tile.name}, Stufe ${stage}.`,
    ),
  );
}

/**
 * Whether a seat has won *Die Catanischen Wunder*.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns whether either of the two endings has come
 * @remarks
 * "Sobald jemand ein Catanisches Wunder vollendet (Stufe 4 gebaut) oder wenn
 * jemand an der Reihe ist, 10 Siegpunkte besitzt und eine höhere Stufe beim Bau
 * des Catanischen Wunders erreicht hat als die anderen."
 */
function wonderWon(game: CatanGame, seat: number): boolean {
  const mine = wonderStage(game, seat);
  const best = Math.max(
    0,
    ...game.wonders.map((unused, who) =>
      who === seat ? 0 : wonderStage(game, who),
    ),
  );
  return (
    mine >= WONDER_STAGES ||
    (pointsOf(game, seat) >= targetFor(game, seat) && mine > best)
  );
}

/**
 * Takes one of this seat's ships off the water so it can be built again.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param which - the ship, by its place in {@link CatanGame.boats}
 * @returns the game without it, or null
 * @remarks
 * "Möchtest du ein neues Schiff bauen und alle deine Schiffe sind schon auf dem
 * Spielfeld, darfst du ein beliebiges deiner Schiffe vom Spielfeld entfernen
 * und an deiner Hafensiedlung für 1 Holz und 1 Wolle neu bauen. Sollte das
 * entfernte Schiff beladen gewesen sein, musst du die Ladung in den Vorrat
 * zurücklegen, sie ist verloren."
 *
 * Two moves rather than one, because taking it off and building it again are
 * two decisions: the ship comes back into the stock here, and the ordinary
 * {@link doBoat} then puts it wherever the harbour settlements allow. Only with
 * the stock empty, which is the whole condition the rule names.
 */
function doRecall(
  game: CatanGame,
  seat: number,
  which: number,
): CatanGame | null {
  const boat = game.boats[which];
  const player = game.players[seat];
  if (
    !finding(game) ||
    game.phase !== "trade" ||
    boat === undefined ||
    boat.owner !== seat ||
    player.boatsLeft > 0 ||
    !covers(player.hand, BOAT_COST)
  ) {
    return null;
  }
  // The cargo is lost, and the pieces go back where they came from - an
  // explorer to its stock, a unit to its own, and a shoal or a sack to the
  // supply they were taken from.
  const scouts = boat.hold.filter((cargo) => cargo === "entdecker").length;
  const units = boat.hold.filter((cargo) => cargo === "einheit").length;
  const shoals = boat.hold.filter((cargo) => cargo === "fisch").length;
  return note(
    withPlayer(
      {
        ...game,
        boats: game.boats.filter((unused, index) => index !== which),
        sailing: game.sailing === which ? null : game.sailing,
        shoalsLeft: game.shoalsLeft + shoals,
      },
      seat,
      {
        ...player,
        boatsLeft: player.boatsLeft + 1,
        scoutsLeft: player.scoutsLeft + scouts,
        unitsLeft: player.unitsLeft + units,
      },
    ),
    boat.hold.length === 0
      ? `${nameOf(game, seat)}: räumt ein Schiff ab.`
      : `${nameOf(game, seat)}: räumt ein beladenes Schiff ab - die Ladung ist verloren.`,
  );
}

/** What a ship can carry, for the log. */
const CARGO_LOG_NAMES: Readonly<Record<Cargo, string>> = {
  entdecker: "einen Entdecker",
  einheit: "eine Einheit",
  fisch: "einen Fischschwarm",
  gewuerz: "einen Gewürzsack",
};

/**
 * Puts one figure out of a ship's hold back in the box.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param which - the ship, by its place in {@link CatanGame.boats}
 * @param cargo - which figure to take out
 * @returns the game with the hold that much emptier, or null
 * @remarks
 * "Ihr dürft jederzeit Spielfiguren aus einem eurer Schiffe entfernen und zum
 * Vorrat zurücklegen. Dies kann zum Beispiel sinnvoll sein, wenn ihr Platz für
 * eine wertvollere Figur schaffen wollt." Free of movement points - "das Be-
 * und Entladen von Schiffen kostet keine Bewegungspunkte" - and free of a turn:
 * jederzeit means in the building phase as well as on the water.
 *
 * Where the figure goes is where it came from: an explorer and a unit back to
 * their own stock, a Fischschwarm to the supply of shoals. A Gewürzsack has no
 * supply to go back to - it was taken out of a village and is simply gone,
 * which is the price of the room it frees.
 *
 * Without this a fleet can strand itself: eleven ships each carrying an
 * explorer that no longer has a coast to found on, and not one hold free for
 * the fish that were still swimming. That game had no move left that changed
 * anything.
 */
function doUnload(
  game: CatanGame,
  seat: number,
  which: number,
  cargo: Cargo,
): CatanGame | null {
  const boat = game.boats[which];
  if (
    !finding(game) ||
    boat === undefined ||
    boat.owner !== seat ||
    !boat.hold.includes(cargo) ||
    (game.phase !== "trade" && game.phase !== "sailing")
  ) {
    return null;
  }
  const at = boat.hold.indexOf(cargo);
  const player = game.players[seat];
  return note(
    withPlayer(
      {
        ...game,
        boats: game.boats.map((each, index) =>
          index === which
            ? {
                ...each,
                hold: each.hold.filter((unused, spot) => spot !== at),
              }
            : each,
        ),
        shoalsLeft: game.shoalsLeft + (cargo === "fisch" ? 1 : 0),
      },
      seat,
      {
        ...player,
        scoutsLeft: player.scoutsLeft + (cargo === "entdecker" ? 1 : 0),
        unitsLeft: player.unitsLeft + (cargo === "einheit" ? 1 : 0),
      },
    ),
    `${nameOf(game, seat)}: räumt ${CARGO_LOG_NAMES[cargo]} aus einem Schiff.`,
  );
}
