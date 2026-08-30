/**
 * The computer's play.
 *
 * @module
 * @remarks
 * Catan has no single best move, so this does not search - it ranks. Every
 * situation produces an ordered list of candidates, best first, and the first
 * one the referee accepts is played. That has a useful property: the computer
 * physically cannot make an illegal move, because {@link aiMove} never returns
 * anything {@link applyMove} has not just approved.
 *
 * What the ranking knows:
 *
 * - **A number chip is worth its dots.** A 6 or an 8 comes up five times as
 *   often as a 2, and the printed chips say so with pips. Everything that
 *   values a spot on the board - where to found, where to send the robber,
 *   which settlement to grow - counts dots, not numbers.
 * - **Variety beats volume.** Two landscapes yielding the same thing are worth
 *   less than two yielding different things, because every building cost in the
 *   game asks for a mixture. A founding spot is scored with that discount.
 * - **Build first, trade after.** A card in hand is worth nothing on its own;
 *   the computer spends before it hoards, and only trades with the bank when it
 *   is one sort short of something it wants to build.
 */
import { islandOf } from "./board";
import {
  applyMove,
  canRoad,
  canTown,
  citySpots,
  discardCount,
  openRoads,
  neutralSpots,
  canShiftBarbarian,
  postSpots,
  putSpots,
  takeSpots,
  roadSpots,
  townSpots,
  tradeRate,
} from "./moves";
import { EVENT_ASK, anybodyHolding, fromOwnHand, poorerThan } from "./events";
import {
  BARBARIAN_STEPS,
  COMMODITIES,
  METRO_LEVEL,
  TOP_LEVEL,
  goodsSize,
  type Commodity,
  NO_GOODS,
  TRACKS,
  TRACK_GOODS,
  withGood,
  type Goods,
  type Track,
} from "./knights";
import { FISH_ACTIONS, FISH_COST, fishing } from "./fischer";
import { BRIDGE_PRICE, BUYS_PER_TURN, GOLD_PER_BUY, rivers } from "./fluesse";
import {
  EXTRA_STEPS,
  FULL_FIELD,
  KNIGHT_STEPS,
  guardsAt,
  raiding,
  rideSpots,
} from "./barbaren";
import {
  GRAIN_MOVE,
  HAUL_POINT_CARDS,
  WARE_GOES,
  driveSpots,
  facingRaiders,
  hauling,
  raiderSpots,
  stepCost,
  stepPrice,
} from "./handel";
import {
  BOAT_COST,
  CAMP_UNITS,
  HOLD_SMALL,
  PORT_COST,
  SCOUT_COST,
  UNIT_COST,
  camping,
  type Cargo,
  campsFrom,
  chasers,
  pirateSeas,
  boatSpots,
  finding,
  portShore,
  landingSpots,
  canCast,
  councilDocks,
  MISSION_STEPS,
  holdRoom,
  lanesFrom,
  goldSales,
  reaches,
  shoaling,
  spicing,
  villageSpots,
  pointsAt,
  portsOf,
  seaLane as findLane,
} from "./entdecker";
import {
  SHIP_COST,
  WONDERS,
  WONDER_KINDS,
  atFort,
  cloth,
  corsairs,
  tribe,
  wonderFree,
  wonderOpen,
  wonders,
  fortOf,
  landCrossing,
  shipLine,
  warshipsOf,
  newIsland,
  pirateSpots,
  sailing,
  seaPath,
  shipSpots,
  looseShips,
} from "./seefahrer";
import { BALLOT, wagonSpots } from "./karawane";
import { isPointCard, isRealCard, type Progress } from "./progress";
import {
  ACTIVATE_COST,
  KNIGHT_COST,
  WALL_COST,
  canChase,
  canImprove,
  canKnight,
  canUpgrade,
  canWall,
  cityCount,
  improvePrice,
  knightReady,
  knightsLeft,
  marchSpots,
  retreatSpots,
} from "./ritter";
import { SWAP_CARDS, canHandKnightIn, chipCost, strangerAt } from "./two";
import { robberSpots as legalRobberSpots } from "./variants";
import {
  ARMY_MIN,
  CITY_COST,
  DEV_COST,
  NO_CARDS,
  RESOURCES,
  ROAD_COST,
  TOWN_COST,
  YIELD,
  covers,
  handSize,
  minus,
  openPoints,
  playingRitter,
  pointsOf,
  playingTwo,
  plus,
  realSeats,
  withCard,
  type CatanGame,
  type CatanMove,
  type Hand,
  type Resource,
} from "./state";

/** The middle of the two dice, which no chip carries. */
const NO_CHIP = 7;

/** The most dots a chip can have, on a 6 or an 8. */
const MOST_DOTS = 6;

/** What a second landscape of a sort already held is worth, against the first. */
const REPEAT_WORTH = 0.45;

/** What a harbour adds to a founding spot. */
const HARBOUR_WORTH = 1.5;

/** How many cards in hand before buying development cards looks sensible. */
const RICH = 8;

/** What each missing sort costs a founding spot, in variety. */
const VARIETY_STEP = 0.05;

/** How valuable each sort is when there is nothing better to say. */
const BASE_WORTH: Readonly<Record<Resource, number>> = {
  lehm: 1.1,
  holz: 1.1,
  wolle: 1,
  getreide: 1.15,
  erz: 1.2,
};

/**
 * How often a chip comes up, in pips.
 *
 * @param chip - the number on the landscape, or 0 for the desert
 * @returns nought to five
 */
export function dots(chip: number): number {
  return chip === 0 ? 0 : MOST_DOTS - Math.abs(NO_CHIP - chip);
}

/** What one crossing takes in each turn, sort by sort. */
function incomeAt(game: CatanGame, at: number): Hand {
  return islandOf(game.land.length).crossings[at].hexes.reduce(
    (hand: Hand, hex: number) => {
      const sort = YIELD[game.land[hex]];
      return sort === null ? hand : withCard(hand, sort, dots(game.chips[hex]));
    },
    NO_CARDS,
  );
}

/** What a seat takes in each turn, sort by sort, counting cities double. */
function incomeOf(game: CatanGame, seat: number): Hand {
  return game.towns.reduce((hand: Hand, town, at: number) => {
    let sum = hand;
    if (town !== null && town.owner === seat) {
      const share = incomeAt(game, at);
      sum = plus(hand, town.city ? plus(share, share) : share);
    }
    return sum;
  }, NO_CARDS);
}

/**
 * What a founding spot is worth.
 *
 * @remarks
 * Dots, discounted for repeating a sort the spot already has, plus something
 * for a harbour. The discount is what stops the computer piling onto a corner
 * of three wheat fields, which looks rich and cannot build a road.
 */
function spotWorth(game: CatanGame, at: number): number {
  const income = incomeAt(game, at);
  const kinds = RESOURCES.filter((sort) => income[sort] > 0).length;
  const raw = RESOURCES.reduce(
    (sum, sort) => sum + income[sort] * BASE_WORTH[sort],
    0,
  );
  const variety =
    kinds <= 1 ? REPEAT_WORTH : 1 - (RESOURCES.length - kinds) * VARIETY_STEP;
  const board = islandOf(game.land.length);
  const docks = game.harbours.some((harbour) =>
    board.paths[harbour.path].ends.includes(at),
  )
    ? HARBOUR_WORTH
    : 0;
  return raw * variety + docks;
}

/** Sorts a list of spots, best first. */
function bestFirst(
  game: CatanGame,
  spots: readonly number[],
): readonly number[] {
  return [...spots].sort((a, b) => spotWorth(game, b) - spotWorth(game, a));
}

/** How badly the seat wants one more of each sort, for building's sake. */
/**
 * What an ordinary game is saving up for.
 *
 * @param game - the game
 * @param seat - whose hand
 * @returns the price it is trying to reach
 * @remarks
 * A city where there is a settlement to raise, otherwise a settlement - and at
 * sea, where there is nowhere left to put one, the **ship** that would open a
 * new shore. Saving for a settlement with no crossing to build it on is saving
 * for nothing at all: two self-played Seefahrer tables traded through the bank
 * for ten thousand turns with their island built out and their fleet in the
 * box.
 */
function cityGoal(game: CatanGame, seat: number): Hand {
  if (citySpots(game, seat).length > 0) {
    return CITY_COST;
  }
  return sailing(game) &&
    game.players[seat].shipsLeft > 0 &&
    townSpots(game, seat).length === 0 &&
    shipSpots(game, seat).length > 0
    ? SHIP_COST
    : TOWN_COST;
}

/**
 * What *Entdecker & Piraten* is saving up for.
 *
 * @param game - the game
 * @param seat - whose hand
 * @returns the price it is trying to reach
 * @remarks
 * There are no cities here, and the settlement is not what a turn is spent on:
 * a **Hafensiedlung** is worth two points and holds cargo, a ship is what
 * reaches anything at all, and a unit is what a mission is made of. Asking for
 * a settlement regardless is what a self-played finale did - it bought Lehm
 * with its gold for a hundred turns while it needed Getreide and Erz.
 */
function findGoal(game: CatanGame, seat: number): Hand {
  const player = game.players[seat];
  const board = islandOf(game.land.length);
  // Only a settlement that could actually **become** a Hafensiedlung: one on
  // the coast. Asking for two Getreide and two Erz for an inland settlement is
  // a goal that never arrives - three of eight self-played games stopped with
  // every colour hoarding for a port it could not build and no wood for a ship.
  const grown = game.towns.some(
    (town, at) =>
      town !== null &&
      town.owner === seat &&
      town.port !== true &&
      board.crossings[at].paths.some((path) => findLane(game, path)),
  );
  const wantsUnit =
    player.unitsLeft > 0 &&
    ((camping(game) && Object.values(game.camps).some((camp) => !camp.taken)) ||
      villagesLeft(game, seat) > 0);
  return player.portsLeft > 0 && grown
    ? PORT_COST
    : player.boatsLeft > 0
      ? BOAT_COST
      : wantsUnit
        ? UNIT_COST
        : TOWN_COST;
}

function wants(game: CatanGame, seat: number): Hand {
  const hand = game.players[seat].hand;
  // In Die Pirateninseln the line comes first, then the cards that arm it, then
  // the buildings that make the points the win also needs - but only while a
  // ship is any use at all. With the fortress already taken, or with no place
  // left to put a ship, saving wood and wool is saving for nothing: one colour
  // sat at nine of ten points with four free building spots, traded fifteen
  // thousand cards through the bank for a ship it could not build, and never
  // once asked for the Lehm that would have won it the game.
  const sailingOn =
    corsairs(game) &&
    fortOf(game, seat) !== null &&
    game.players[seat].shipsLeft > 0 &&
    shipSpots(game, seat).length > 0;
  const goal = finding(game)
    ? findGoal(game, seat)
    : sailingOn
      ? !atFort(game, seat)
        ? SHIP_COST
        : shipLine(game, seat).length - warshipsOf(game, seat) < STORM_FODDER
          ? // The line is at the fortress but has nothing to lose in front:
            // ships again, and they are what a lost fight is paid with.
            SHIP_COST
          : warshipsOf(game, seat) < STORM_GUNS
            ? DEV_COST
            : cityGoal(game, seat)
      : cityGoal(game, seat);
  const short = RESOURCES.reduce(
    (need, sort) => withCard(need, sort, Math.max(0, goal[sort] - hand[sort])),
    NO_CARDS,
  );
  return short;
}

/** Which sort the seat can most easily spare. */
function sparest(game: CatanGame, seat: number): Resource {
  const hand = game.players[seat].hand;
  const need = wants(game, seat);
  return [...RESOURCES].sort(
    (a, b) => hand[b] - need[b] * MOST_DOTS - (hand[a] - need[a] * MOST_DOTS),
  )[0];
}

/**
 * A road worth building.
 *
 * @remarks
 * Roads are only ever built toward somewhere: the one chosen is the road whose
 * far end is the best settlement spot it opens, and if it opens none, the one
 * that at least reaches further out.
 */
function roadTowards(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  const spots = roadSpots(game, seat);
  const scored = spots.map((path) => {
    const worth = board.paths[path].ends.reduce((best: number, end: number) => {
      const free =
        game.towns[end] === null &&
        board.crossings[end].next.every((n: number) => game.towns[n] === null);
      return Math.max(best, free ? spotWorth(game, end) : 0);
    }, 0);
    return { path, worth };
  });
  return scored.sort((a, b) => b.worth - a.worth).map((entry) => entry.path);
}

/** Where the founding road should point. */
function foundingRoads(
  game: CatanGame,
  seat: number,
  from: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  return [...board.crossings[from].paths].sort((a, b) => {
    const far = (path: number): number => {
      const [x, y] = board.paths[path].ends;
      return spotWorth(game, x === from ? y : x);
    };
    return far(b) - far(a);
  });
}

/** Who is furthest ahead, the seat asking excepted. */
function leader(game: CatanGame, seat: number): number {
  return game.players.reduce(
    (best, unused, at) =>
      at !== seat && openPoints(game, at) > openPoints(game, best) ? at : best,
    seat === 0 ? 1 % game.players.length : 0,
  );
}

/**
 * Where to put the robber.
 *
 * @remarks
 * On the landscape that costs the other players most and the mover nothing:
 * every foreign building there is worth its dots, doubled for a city, and any
 * building of the mover's own rules the landscape out entirely.
 */
function robberSpots(game: CatanGame, seat: number): readonly number[] {
  const scored = islandOf(game.land.length).hexes.map((hex) => {
    const own = hex.corners.some(
      (at: number) => game.towns[at]?.owner === seat,
    );
    const hurt = hex.corners.reduce((sum: number, at: number) => {
      const town = game.towns[at];
      const worth =
        town === null || town.owner === seat ? 0 : dots(game.chips[hex.id]);
      return sum + (town?.city === true ? worth * 2 : worth);
    }, 0);
    const ahead = hex.corners.some(
      (at: number) => game.towns[at]?.owner === leader(game, seat),
    );
    return { hex: hex.id, worth: own ? -1 : hurt + (ahead ? 1 : 0) };
  });
  const allowed = new Set(legalRobberSpots(game, game.robber));
  return scored
    .filter((entry) => allowed.has(entry.hex))
    .sort((a, b) => b.worth - a.worth)
    .map((entry) => entry.hex);
}

/** What to lay down after a seven: whatever is furthest from a building cost. */
function discardChoice(
  game: CatanGame,
  seat: number,
): { readonly cards: Hand; readonly goods: Goods } {
  const owed = discardCount(game, seat);
  const need = wants(game, seat);
  let left = game.players[seat].hand;
  let spare = game.players[seat].goods;
  let cards = NO_CARDS;
  let goods = NO_GOODS;
  for (let i = 0; i < owed; i += 1) {
    const worst = [...RESOURCES]
      .filter((sort) => left[sort] > 0)
      .sort(
        (a, b) =>
          left[b] - need[b] * MOST_DOTS - (left[a] - need[a] * MOST_DOTS),
      )[0];
    if (worst === undefined) {
      // Handelswaren count towards the seven as well, so a hand that is all
      // Papier still owes - and still has something to pay with. Without this
      // the computer sat in the discard phase with no legal move at all.
      const sort = [...COMMODITIES]
        .filter((each) => spare[each] > 0)
        .sort((a, b) => spare[b] - spare[a])[0];
      if (sort === undefined) {
        break;
      }
      spare = withGood(spare, sort, -1);
      goods = withGood(goods, sort);
    } else {
      left = withCard(left, worst, -1);
      cards = withCard(cards, worst);
    }
  }
  return { cards, goods };
}

/** Bank trades that bring a build within reach, cheapest first. */
function bankTrades(game: CatanGame, seat: number): readonly CatanMove[] {
  const hand = game.players[seat].hand;
  const need = wants(game, seat);
  const short = RESOURCES.filter((sort) => need[sort] > 0);
  const moves: CatanMove[] = [];
  short.forEach((want) => {
    RESOURCES.forEach((give) => {
      const rate = tradeRate(game, seat, give);
      // Only pay for a card out of a genuine surplus: what is left has to still
      // cover everything the target already has covered.
      if (give !== want && hand[give] - rate >= need[give]) {
        moves.push({ kind: "bank", give, want });
      }
    });
  });
  // Städte & Ritter is paid for in Handelswaren, and the bank sells those too:
  // "Ihr könnt in jede Richtung tauschen." A track that is one Papier short is
  // the cheapest step on the board, so it is worth four Lehm.
  if (playingRitter(game)) {
    TRACKS.forEach((track) => {
      const player = game.players[seat];
      const ware = TRACK_GOODS[track];
      const missing =
        improvePrice(game, seat, track) > player.goods[ware] &&
        player.tableau[track] < TOP_LEVEL &&
        cityCount(game, seat) > 0;
      if (missing) {
        RESOURCES.forEach((give) => {
          const rate = tradeRate(game, seat, give);
          if (hand[give] - rate >= need[give]) {
            moves.push({ kind: "bank", give, want: ware });
          }
        });
      }
    });
  }
  return moves.sort(
    (a, b) =>
      tradeRate(game, seat, (a as { give: Resource }).give) -
      tradeRate(game, seat, (b as { give: Resource }).give),
  );
}

/**
 * An offer worth putting on the table.
 *
 * @remarks
 * Only ever one card for one card, and only when a single sort stands between
 * the computer and a building. Anything bigger is a negotiation, and a
 * negotiation needs a table.
 *
 * And only for a card somebody actually holds. At a real table you ask blindly
 * because you cannot see the other hands; the computer can, and an offer
 * nobody is able to take is a question asked for nothing - it spends the one
 * offer this turn allows and puts a dialogue in front of players whose only
 * answer is no.
 */
function offerMove(game: CatanGame, seat: number): readonly CatanMove[] {
  const hand = game.players[seat].hand;
  const need = wants(game, seat);
  const missing = RESOURCES.filter((sort) => need[sort] > 0);
  const spare = RESOURCES.filter((sort) => hand[sort] > need[sort] + 1);
  const anybodyHasIt =
    missing.length === 1 &&
    game.players.some(
      (player, at) => at !== seat && player.hand[missing[0]] > 0,
    );
  return anybodyHasIt && game.offers === 0 && spare.length > 0
    ? [
        {
          kind: "offer",
          give: withCard(NO_CARDS, spare[0]),
          want: withCard(NO_CARDS, missing[0]),
        },
      ]
    : [];
}

/** Whether an offer made to this seat is worth taking. */
function likesOffer(game: CatanGame, seat: number): boolean {
  const offer = game.offer;
  const hand = game.players[seat].hand;
  let yes = false;
  if (offer !== null && covers(hand, offer.want)) {
    const need = wants(game, seat);
    const after = plus(minus(hand, offer.want), offer.give);
    const worthOf = (cards: Hand): number =>
      RESOURCES.reduce(
        (sum, sort) =>
          sum + Math.min(cards[sort], need[sort]) * MOST_DOTS + cards[sort],
        0,
      );
    // Never hand the leader the card that finishes their turn.
    const helping = openPoints(game, offer.from) >= openPoints(game, seat);
    yes = worthOf(after) > worthOf(hand) && !helping;
  }
  return yes;
}

/** The candidates for a turn's building phase, best first. */
function buildingMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const hand = game.players[seat].hand;
  const moves: CatanMove[] = [];
  // In Die Pirateninseln a development card is not a side dish: the knights in
  // it are the only way to a warship, and warships are the only way to the
  // fortress. So the card comes before the buildings, as long as the fleet is
  // still too small to fight.
  if (
    corsairs(game) &&
    covers(hand, DEV_COST) &&
    atFort(game, seat) &&
    warshipsOf(game, seat) < STORM_GUNS
  ) {
    moves.push({ kind: "buy" });
  }
  if (covers(hand, CITY_COST)) {
    bestFirst(game, citySpots(game, seat)).forEach((at) =>
      moves.push({ kind: "city", at }),
    );
  }
  if (covers(hand, TOWN_COST)) {
    bestFirst(game, townSpots(game, seat)).forEach((at) =>
      moves.push({ kind: "town", at }),
    );
  }
  if (covers(hand, DEV_COST) && handSize(hand) >= RICH) {
    moves.push({ kind: "buy" });
  }
  if (covers(hand, ROAD_COST) && townSpots(game, seat).length === 0) {
    roadTowards(game, seat).forEach((at) => moves.push({ kind: "road", at }));
  }
  if (covers(hand, DEV_COST)) {
    moves.push({ kind: "buy" });
  }
  return moves;
}

/** The whole ordered list of what the computer would like to do. */
function candidates(game: CatanGame, seat: number): readonly CatanMove[] {
  const phase = game.phase;
  const moves: CatanMove[] = [];
  if (phase === "founding" && game.founding?.placing === "boat") {
    // The founding Entdeckerschiff, beside the harbour settlement just placed.
    boatSpots(game, seat).forEach((at) => moves.push({ kind: "boat", at }));
  } else if (phase === "founding" && game.founding?.placing === "town") {
    const spots = townSpots(game, seat, true).filter(
      (at) =>
        !finding(game) ||
        game.founding === null ||
        game.founding.step >= realSeats(game).length ||
        // The first piece becomes a Hafensiedlung, which wants a shore.
        portShore(game, at),
    );
    bestFirst(game, spots).forEach((at) => moves.push({ kind: "town", at }));
  } else if (phase === "founding") {
    foundingRoads(game, seat, game.founding?.lastTown ?? 0).forEach((at) =>
      moves.push({ kind: "road", at }),
    );
  } else if (phase === "discard") {
    moves.push({ kind: "discard", ...discardChoice(game, seat) });
  } else if (phase === "robber") {
    robberSpots(game, seat).forEach((at) => moves.push({ kind: "robber", at }));
  } else if (phase === "steal") {
    [...game.targets]
      .sort(
        (a, b) =>
          handSize(game.players[b].hand) - handSize(game.players[a].hand),
      )
      .forEach((at) => moves.push({ kind: "rob", seat: at }));
  } else if (phase === "event") {
    answerCard(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "monopol") {
    monopolPicks(game, seat).forEach((sort) =>
      moves.push({ kind: "choose", sort }),
    );
  } else if (phase === "erfindung") {
    giftPicks(game, seat).forEach((sort) =>
      moves.push({ kind: "choose", sort }),
    );
  } else if (phase === "progress" && game.owed.length > 0) {
    // Hochzeit and Handelshafen: somebody who is not on turn has to hand cards
    // over, and chooses which.
    moves.push(tributeAnswer(game, seat));
  } else if (phase === "progress") {
    const answer = answerFor(game, seat);
    if (answer !== null) {
      moves.push(answer);
    }
  } else if (phase === "corsair") {
    corsairMoves(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "sailing") {
    voyageMoves(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "endTurn" });
  } else if (phase === "pirate") {
    pirateMoves(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "goldPick") {
    moves.push({ kind: "gold", sort: wantedSort(game, seat) });
  } else if (phase === "driving") {
    driveMoves(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "endTurn" });
  } else if (phase === "shifting") {
    shiftMoves(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "posting") {
    postMoves(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "barbarians") {
    barbMoves(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "knights") {
    rideMoves(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "endTurn" });
  } else if (phase === "vote") {
    voteMoves(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "displaced") {
    retreatMoves(game).forEach((move) => moves.push(move));
  } else if (phase === "neutral") {
    neutralPicks(game).forEach((move) => moves.push(move));
  } else if (phase === "swap") {
    moves.push({ kind: "giveBack", cards: giveBackChoice(game, seat) });
  } else if (game.offer !== null && game.offer.from !== seat) {
    moves.push({ kind: "answer", yes: likesOffer(game, seat) });
  } else if (game.offer !== null) {
    closeOffer(game).forEach((move) => moves.push(move));
  } else if (phase === "roll") {
    knightFirst(game, seat).forEach((move) => moves.push(move));
    // "auch vor dem Würfeln" - and before is the better moment for the robber
    // one, because it clears a field before it can cost an income.
    chipMoves(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "roll" });
  } else if (phase === "trade") {
    // A road on its side blocks every other road, so it is worth more than
    // anything else that costs the same two cards.
    if (game.players[seat].damaged !== null) {
      moves.push({ kind: "repair" });
    }
    freeRoadMoves(game, seat).forEach((move) => moves.push(move));
    fishMoves(game, seat).forEach((move) => moves.push(move));
    haulMoves(game, seat).forEach((move) => moves.push(move));
    // A wonder is the shortest way to the end of Die Catanischen Wunder: one
    // that is finished wins on the spot, so it comes before the buildings.
    if (wonders(game)) {
      const mine = game.wonders[seat];
      const wanted =
        mine === null
          ? WONDER_KINDS.filter(
              (which) =>
                wonderFree(game, which) && wonderOpen(game, seat, which),
            )
          : [mine.kind];
      wanted
        .filter((which) => covers(game.players[seat].hand, WONDERS[which].cost))
        .forEach((which) => moves.push({ kind: "wonder", which }));
    }
    // "Erreichst du mit deiner Schiffslinie die Piratenfestung in deiner Farbe,
    // kannst du sie angreifen" - and there is no reason to wait: a fortress
    // with no chips left is what this scenario is won with.
    // Only with a fleet worth the risk: the pirates roll one die, and a fight
    // lost costs two ships. Four warships win half the time, and the last chip
    // of a fortress is worth taking a worse chance for.
    const guns = warshipsOf(game, seat);
    const fodder = shipLine(game, seat).length - guns;
    const fort = fortOf(game, seat);
    const left = fort === null ? 0 : game.forts[fort].chips;
    if (
      corsairs(game) &&
      !game.stormed &&
      atFort(game, seat) &&
      // A lost fight takes the two ships at the **front** of the line, and the
      // warships are made at its back - so a line wants a couple of ordinary
      // ships out in front to lose. Attacking without them burns the fleet
      // itself, which is how a self-played table ended with one warship each
      // and an empty card stack.
      // As many warships as the line can ever hold: a line that has reached the
      // fortress is as long as it will get, so waiting for a fourth ship on a
      // line of two is waiting for ever. Two is the fewest that can beat the
      // die at all, so that is the floor - and a lost fight sends the ships
      // back into the supply, which is more than standing still ever gives.
      guns >=
        Math.max(
          STORM_LEAST,
          Math.min(
            STORM_GUNS - (left === 1 || game.stack.length === 0 ? 1 : 0),
            shipLine(game, seat).length,
          ),
        ) &&
      // With nothing left to build the fleet is as big as it will get, and
      // waiting for fodder that cannot come only makes the game longer. A line
      // that has arrived cannot grow either: "die Schiffslinie darf ... nicht
      // über die Piratenfestung hinaus gebaut werden."
      (fodder >= STORM_FODDER ||
        atFort(game, seat) ||
        shipSpots(game, seat).length === 0)
    ) {
      moves.push({ kind: "assault" });
    }
    shipMoves(game, seat).forEach((move) => moves.push(move));
    findMoves(game, seat).forEach((move) => moves.push(move));
    goldMoves(game, seat).forEach((move) => moves.push(move));
    ritterBuilds(game, seat).forEach((move) => moves.push(move));
    knightMoves(game, seat).forEach((move) => moves.push(move));
    progressPlays(game, seat).forEach((move) => moves.push(move));
    chipMoves(game, seat).forEach((move) => moves.push(move));
    playableCards(game, seat).forEach((move) => moves.push(move));
    buildingMoves(game, seat).forEach((move) => moves.push(move));
    bankTrades(game, seat).forEach((move) => moves.push(move));
    offerMove(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "endTurn" });
  }
  return moves;
}

/**
 * Where the computer puts the free neutral piece.
 *
 * @param game - the game
 * @returns the placements it would consider, best first
 * @remarks
 * The free piece is a **gift to nobody**, so the only sensible aim is to make
 * it hurt: a neutral settlement is placed on the best crossing still open,
 * which is the one the opponent would otherwise take. The distance rule then
 * keeps the whole neighbourhood clear of them for the rest of the game, which
 * is what makes this the sharpest thing the variant offers.
 *
 * A neutral road is placed where it does the least for anybody, since it can
 * only ever extend a route that scores for a colour nobody plays - and that
 * colour taking the Längste Handelsroute takes it away from the opponent too.
 */
function neutralPicks(game: CatanGame): readonly CatanMove[] {
  const kind = game.neutralBuild;
  const spots = kind === null ? [] : neutralSpots(game, kind);
  const ranked =
    kind === "town"
      ? [...spots].sort(
          (one, other) => spotWorth(game, other.at) - spotWorth(game, one.at),
        )
      : spots;
  return ranked.map((spot) => ({
    kind: "neutral",
    seat: spot.seat,
    at: spot.at,
  }));
}

/**
 * Which two cards go back after a Zwangshandel.
 *
 * @param game - the game
 * @param seat - who owes them
 * @returns the two it would miss least
 * @remarks
 * The same judgement as discarding after a seven, and for the same reason: what
 * you hand over is what you were not going to use. Reusing
 * {@link discardChoice} would be wrong only in its count, so the count is what
 * is fixed here.
 */
function giveBackChoice(game: CatanGame, seat: number): Hand {
  const hand = game.players[seat].hand;
  const owed = Math.min(SWAP_CARDS, handSize(hand));
  let picked = NO_CARDS;
  let left = owed;
  // Spare sorts first, one card at a time, so a hand of one sort still pays.
  while (left > 0) {
    const sort = [...RESOURCES]
      .filter((each) => hand[each] - picked[each] > 0)
      .sort(
        (one, other) => wants(game, seat)[one] - wants(game, seat)[other],
      )[0];
    if (sort === undefined) {
      break;
    }
    picked = withCard(picked, sort);
    left -= 1;
  }
  return picked;
}

/**
 * What Städte & Ritter gives the computer to build, best first.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the moves, or nothing outside a game of Städte & Ritter
 * @remarks
 * City improvements come **before** anything else it could spend on, and the
 * cheapest track first. That is not greed, it is the shape of the expansion:
 * a track that is still on "Stadt" draws no Fortschrittskarte at all, and the
 * first step of a track is the single cheapest thing on the board that changes
 * that. Levels four and five are worth more again - a metropolis is two points
 * - and the referee has already refused them if there is no city to carry one.
 *
 * A city wall is worth building whenever it is legal: it is two clay for two
 * more cards kept after every seven for the rest of the game.
 */
function ritterBuilds(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (playingRitter(game)) {
    const worth = (track: Track): number => {
      const level = game.players[seat].tableau[track] + 1;
      return level >= METRO_LEVEL
        ? METRO_LEVEL + level
        : -improvePrice(game, seat, track);
    };
    [...TRACKS]
      .filter((track) => canImprove(game, seat, track))
      .sort((one, other) => worth(other) - worth(one))
      .forEach((track) => moves.push({ kind: "improve", track }));
    if (canWall(game, seat) && covers(game.players[seat].hand, WALL_COST)) {
      moves.push({ kind: "wall" });
    }
  }
  return moves;
}

/**
 * What the computer does with knights, best first.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the moves it would consider
 * @remarks
 * The order is the order of urgency, and it comes straight out of how the
 * expansion punishes you:
 *
 * 1. **Chase the robber** if a ready knight can reach it. Nothing else gets the
 *    robber off a landscape of yours between sevens.
 * 2. **Activate** while the barbarians are close. A passive knight counts for
 *    nothing in the fight, and one Getreide is far cheaper than a city.
 * 3. **Build** one while there is a slot free, since strength is what decides
 *    the raid and every knight is one point of it.
 * 4. **Upgrade**, which buys two points of defence for the price of one knight
 *    and, at the top, needs the Festung first - the referee enforces that.
 *
 * Marching is deliberately last and rare: it stands the knight down, so a
 * knight that marches is a knight missing from the next raid. It is only worth
 * it to drive somebody else's knight off, which costs them the same.
 */
function knightMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (playingRitter(game)) {
    const mine = game.garrison
      .map((knight, at) => (knight?.owner === seat ? at : -1))
      .filter((at) => at >= 0);
    const hand = game.players[seat].hand;
    const soon = game.barbarian >= BARBARIAN_STEPS - 2;

    mine
      .filter((at) => canChase(game, at))
      .forEach((at) => moves.push({ kind: "chase", at }));

    if (soon && covers(hand, ACTIVATE_COST)) {
      mine
        .filter((at) => game.garrison[at]?.active === false)
        .forEach((at) => moves.push({ kind: "activate", at }));
    }

    if (covers(hand, KNIGHT_COST)) {
      // Upgrading beats building when the pieces have run out anyway, and the
      // referee will only allow the ones that are legal.
      mine
        .filter((at) => canUpgrade(game, seat, at))
        .sort(
          (one, other) =>
            (game.garrison[other]?.level ?? 0) -
            (game.garrison[one]?.level ?? 0),
        )
        .forEach((at) => moves.push({ kind: "upgrade", at }));
      bestFirst(
        game,
        game.towns
          .map((unused, at) => at)
          .filter((at) => canKnight(game, seat, at)),
      ).forEach((at) => moves.push({ kind: "knight", at }));
    }

    if (!soon && covers(hand, ACTIVATE_COST)) {
      mine
        .filter((at) => game.garrison[at]?.active === false)
        .forEach((at) => moves.push({ kind: "activate", at }));
    }

    // Driving somebody else's knight off, and only that - an empty crossing is
    // not worth standing a knight down for.
    mine
      .filter((at) => knightReady(game, at))
      .forEach((at) =>
        marchSpots(game, at)
          .filter((to) => game.garrison[to] !== null)
          .forEach((to) => moves.push({ kind: "march", from: at, to })),
      );
  }
  return moves;
}

/**
 * Where the computer walks a knight that has been driven off.
 *
 * @param game - the game, waiting in the displaced phase
 * @returns the retreats it would consider, best first
 * @remarks
 * Toward the best crossing it can still reach, for want of anything better to
 * want: a knight has to stand somewhere, and where it stands decides what it
 * can reach next turn.
 */
function retreatMoves(game: CatanGame): readonly CatanMove[] {
  const from = game.displaced;
  const owner = from === null ? null : (game.garrison[from]?.owner ?? null);
  return from === null || owner === null
    ? []
    : bestFirst(game, retreatSpots(game, from, owner)).map((to) => ({
        kind: "march",
        from,
        to,
      }));
}

/**
 * The Fortschrittskarten the computer would play, best first.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the plays it would consider
 * @remarks
 * Only cards it can actually finish. Several of them ask a question with no
 * good answer on some boards - Abgaben needs somebody ahead of you, Verrat
 * needs a knight to steal and a piece in the box - and a card played into a
 * dead end would sit there blocking the turn. So the cards are filtered by
 * whether {@link answerFor} can produce an answer, which is the same question
 * asked in the same place.
 *
 * Alchemie is the odd one: it is the only card playable **before** the roll,
 * and the computer does not play it at all. Naming your own dice well needs a
 * plan for the turn, and a bot that picks a number at random is worse than one
 * that rolls - it would spend a card to get the same result.
 */
function progressPlays(game: CatanGame, seat: number): readonly CatanMove[] {
  // Only real cards: a back is somebody else's view of a card and never the
  // computer's own, but the type says it could be and the compiler is right.
  const held = [...new Set(game.players[seat].progress)].filter(isRealCard);
  return playingRitter(game) && game.phase === "trade"
    ? held
        .filter((card) => !isPointCard(card) && card !== "alchemie")
        .filter((card) => playable(game, seat, card))
        .map((card) => ({ kind: "progress", card }) as CatanMove)
    : [];
}

/**
 * Whether a card would find something to do if it were played.
 *
 * @param game - the game
 * @param seat - who would play it
 * @param card - the card
 * @returns true if it can be played **and** finished
 * @remarks
 * The answer is played through as well, not merely produced. Asking only
 * whether an answer exists was not enough: the computer would play Medizin with
 * a settlement to upgrade and no ore to do it with, and then sit in the
 * progress phase with a card it could not finish and no way back.
 */
function playable(game: CatanGame, seat: number, card: Progress): boolean {
  const after = applyMove(game, seat, { kind: "progress", card });
  let good = after !== null;
  if (after !== null && after.phase === "progress") {
    const answer = answerFor(after, seat);
    good = answer !== null && applyMove(after, seat, answer) !== null;
  }
  return good;
}

/**
 * The answer the computer gives a Fortschrittskarte.
 *
 * @param game - the game, parked in the progress phase
 * @param seat - who has to answer
 * @returns the move, or null if the card cannot be finished at all
 * @remarks
 * One judgement per card, and each is the obvious one rather than a clever one:
 * take from whoever holds most, put the trader on your best landscape, upgrade
 * the strongest knight you may. Where the rules leave a genuinely open choice -
 * which two chips to swap - it does the safe thing and declines to guess.
 */
function answerFor(game: CatanGame, seat: number): CatanMove | null {
  const card = game.playing;
  const others = realSeats(game).filter((at) => at !== seat);
  let move: CatanMove | null = null;
  if (card === "medizin") {
    const at = citySpots(game, seat)[0];
    move = at === undefined ? null : { kind: "answerCard", at };
  } else if (card === "schmiedekunst") {
    const at = game.garrison
      .map((knight, crossing) => (knight?.owner === seat ? crossing : -1))
      .filter((crossing) => crossing >= 0 && canUpgrade(game, seat, crossing))
      .sort(
        (one, other) =>
          (game.garrison[other]?.level ?? 0) - (game.garrison[one]?.level ?? 0),
      )[0];
    move = at === undefined ? null : { kind: "answerCard", at };
  } else if (card === "haendler") {
    const at = bestHex(game, seat);
    move = at === null ? null : { kind: "answerCard", at };
  } else if (card === "handelsflotte") {
    move = { kind: "answerCard", sort: sparest(game, seat) };
  } else if (card === "warenmonopol") {
    const good = [...COMMODITIES].sort(
      (one, other) => heldGood(game, seat, other) - heldGood(game, seat, one),
    )[0];
    move = { kind: "answerCard", good };
  } else if (card === "rohstoffmonopol") {
    move = { kind: "answerCard", sort: monopolPicks(game, seat)[0] };
  } else if (card === "diplomatie") {
    const at = openRoads(game, seat).find((path) => game.roads[path] !== seat);
    move = at === undefined ? null : { kind: "answerCard", at };
  } else if (card === "intrige") {
    const at = reachableKnights(game, seat)[0];
    move = at === undefined ? null : { kind: "answerCard", at };
  } else if (card === "spionage") {
    const from = others.find((at) =>
      game.players[at].progress
        .filter(isRealCard)
        .some((each) => !isPointCard(each)),
    );
    const take =
      from === undefined
        ? undefined
        : game.players[from].progress
            .filter(isRealCard)
            .find((each) => !isPointCard(each));
    move =
      from === undefined || take === undefined
        ? null
        : { kind: "answerCard", seat: from, card: take };
  } else if (card === "abgaben") {
    move = levyAnswer(game, seat, others);
  } else if (card === "verrat") {
    const at = game.garrison
      .map((knight, crossing) =>
        knight !== null &&
        knight.owner !== seat &&
        knightsLeft(game, seat, knight.level) > 0
          ? crossing
          : -1,
      )
      .filter((crossing) => crossing >= 0)
      .sort(
        (one, other) =>
          (game.garrison[other]?.level ?? 0) - (game.garrison[one]?.level ?? 0),
      )[0];
    move =
      at === undefined
        ? null
        : { kind: "answerCard", at, seat: game.garrison[at]?.owner };
  }
  return move;
}

/** How much of a Handelsware everybody else is holding. */
function heldGood(game: CatanGame, seat: number, good: Commodity): number {
  return game.players.reduce(
    (sum, player, at) => (at === seat ? sum : sum + player.goods[good]),
    0,
  );
}

/** The landscape the computer would most like the Händler on. */
function bestHex(game: CatanGame, seat: number): number | null {
  const board = islandOf(game.land.length);
  const mine = board.hexes
    .filter(
      (hex) =>
        game.land[hex.id] !== "wueste" &&
        hex.corners.some((corner) => game.towns[corner]?.owner === seat),
    )
    .sort(
      (one, other) => dots(game.chips[other.id]) - dots(game.chips[one.id]),
    );
  return mine[0]?.id ?? null;
}

/** The enemy knights a road of this seat's reaches. */
function reachableKnights(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  return game.garrison
    .map((knight, at) =>
      knight !== null &&
      knight.owner !== seat &&
      board.crossings[at].paths.some((path) => game.roads[path] === seat)
        ? at
        : -1,
    )
    .filter((at) => at >= 0);
}

/** Abgaben: two cards off whoever is ahead and holding most. */
function levyAnswer(
  game: CatanGame,
  seat: number,
  others: readonly number[],
): CatanMove | null {
  const ahead = others
    .filter((at) => pointsOf(game, at) > pointsOf(game, seat))
    .sort(
      (one, other) =>
        handSize(game.players[other].hand) - handSize(game.players[one].hand),
    )[0];
  let move: CatanMove | null = null;
  if (ahead !== undefined) {
    const hand = game.players[ahead].hand;
    const spare = game.players[ahead].goods;
    const owed = Math.min(2, handSize(hand) + goodsSize(spare));
    let cards = NO_CARDS;
    let goods = NO_GOODS;
    let left = hand;
    let leftGoods = spare;
    for (let taken = 0; taken < owed; taken++) {
      const sort = RESOURCES.filter((each) => left[each] > 0).sort(
        (one, other) => left[other] - left[one],
      )[0];
      if (sort === undefined) {
        const good = COMMODITIES.filter((each) => leftGoods[each] > 0)[0];
        if (good === undefined) {
          break;
        }
        leftGoods = withGood(leftGoods, good, -1);
        goods = withGood(goods, good);
      } else {
        left = withCard(left, sort, -1);
        cards = withCard(cards, sort);
      }
    }
    move = { kind: "answerCard", seat: ahead, cards, goods };
  }
  return move;
}

/**
 * What the computer hands over to a Hochzeit or a Handelshafen.
 *
 * @param game - the game, waiting on the queue
 * @param seat - who is being asked
 * @returns the cards it parts with
 * @remarks
 * A Handelshafen wants exactly one Handelsware and nothing else; a Hochzeit
 * wants two of anything. Both get the sorts this seat has most of, which is the
 * same judgement it makes when a seven forces a discard - what you can spare is
 * what you were not going to use.
 */
function tributeAnswer(game: CatanGame, seat: number): CatanMove {
  const player = game.players[seat];
  let move: CatanMove;
  if (game.playing === "handelshafen") {
    const good = [...COMMODITIES]
      .filter((sort) => player.goods[sort] > 0)
      .sort((one, other) => player.goods[other] - player.goods[one])[0];
    move = {
      kind: "answerCard",
      goods: good === undefined ? NO_GOODS : withGood(NO_GOODS, good),
    };
  } else {
    const owed = Math.min(2, handSize(player.hand) + goodsSize(player.goods));
    let cards = NO_CARDS;
    let goods = NO_GOODS;
    let left = player.hand;
    let spare = player.goods;
    for (let given = 0; given < owed; given++) {
      const sort = RESOURCES.filter((each) => left[each] > 0).sort(
        (one, other) => left[other] - left[one],
      )[0];
      if (sort === undefined) {
        const good = COMMODITIES.filter((each) => spare[each] > 0)[0];
        if (good === undefined) {
          break;
        }
        spare = withGood(spare, good, -1);
        goods = withGood(goods, good);
      } else {
        left = withCard(left, sort, -1);
        cards = withCard(cards, sort);
      }
    }
    move = { kind: "answerCard", cards, goods };
  }
  return move;
}

/**
 * What the computer does with its fish, best first.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the moves it would consider
 * @remarks
 * The dearest action it can afford, and only ever an exact-ish payment: the
 * rulebook gives no change - "gibst du mehr Fische aus, als die Aktion kostet,
 * verfallen die überzähligen Fische" - so paying seven fish for a two-fish
 * action is throwing five away. It therefore looks for the cheapest bundle
 * that covers each price and takes the most valuable action such a bundle
 * reaches.
 *
 * The Alter Schuh is passed on the first chance there is: it costs a victory
 * point and the only cost of moving it is the move.
 */
function fishMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (fishing(game)) {
    const held = game.players[seat].fish;
    for (const action of [...FISH_ACTIONS].reverse()) {
      const tiles = cheapestBundle(held, FISH_COST[action]);
      if (tiles !== null) {
        moves.push({ kind: "fish", action, tiles });
        break;
      }
    }
    if (game.shoe === seat) {
      const to = realSeats(game).find(
        (at) => at !== seat && pointsOf(game, at) >= pointsOf(game, seat),
      );
      if (to !== undefined) {
        moves.push({ kind: "shoe", seat: to });
      }
    }
  }
  return moves;
}

/** How the computer weighs Entdecker & Piraten. */
const PORT_WORTH = 2;

/**
 * What the computer builds in *Entdecker & Piraten*.
 *
 * @param game - the game
 * @param seat - whose turn
 * @returns the pieces it would buy, best first
 * @remarks
 * A Hafensiedlung is two points and a place to build ships from, so it comes
 * first; then an explorer to go and found with, then a ship to carry it.
 */
function findMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (finding(game)) {
    const player = game.players[seat];
    if (player.portsLeft > 0 && covers(player.hand, PORT_COST)) {
      game.towns.forEach((town, at) => {
        if (town !== null && town.owner === seat && town.port !== true) {
          moves.push({ kind: "port", at });
        }
      });
    }
    // An explorer only where there is a ship or a basin waiting for it.
    if (player.scoutsLeft > 0 && covers(player.hand, SCOUT_COST)) {
      portsOf(game, seat).forEach((at) => {
        if ((game.docks[at] ?? []).length === 0) {
          moves.push({ kind: "scout", at });
        }
      });
    }
    if (player.boatsLeft > 0 && covers(player.hand, BOAT_COST)) {
      boatSpots(game, seat).forEach((at) => moves.push({ kind: "boat", at }));
    }
    // "Möchtest du ein neues Schiff bauen und alle deine Schiffe sind schon auf
    // dem Spielfeld, darfst du ein beliebiges deiner Schiffe vom Spielfeld
    // entfernen und an deiner Hafensiedlung neu bauen." Worth it for a ship
    // that is stuck: one with nowhere left to sail and nothing in its hold.
    if (player.boatsLeft === 0 && covers(player.hand, BOAT_COST)) {
      game.boats.forEach((boat, which) => {
        // And only when it could then be built somewhere **else**: rebuilding
        // it on the same dead-end lane is the same ship in the same place, and
        // a self-played game did exactly that for tens of thousands of moves.
        const after = {
          ...game,
          boats: game.boats.filter((unused, index) => index !== which),
          players: game.players.map((each, at) =>
            at === seat ? { ...each, boatsLeft: 1 } : each,
          ),
        };
        if (
          boat.owner === seat &&
          boat.hold.length === 0 &&
          lanesFrom(game, boat).length === 0 &&
          landingSpots(game, seat, boat.at).length === 0 &&
          boatSpots(after, seat).some((spot) => spot !== boat.at)
        ) {
          moves.push({ kind: "recall", boat: which });
        }
      });
    }
    // A unit is worth building while there is a camp left to storm or a
    // village left to befriend - and worth nothing at all once there is not.
    const wanted =
      (camping(game) &&
        Object.values(game.camps).some((camp) => !camp.taken)) ||
      villagesLeft(game, seat) > 0;
    // And only while there is not already a shipload of them standing about:
    // a unit in a basin is a unit out of the box, and a self-played finale had
    // thirteen of them waiting in harbours while every colour had none left to
    // build and two camps stood half taken.
    const idle =
      portsOf(game, seat).reduce(
        (sum, at) =>
          sum + (game.docks[at] ?? []).filter((c) => c === "einheit").length,
        0,
      ) +
      game.boats.reduce(
        (sum, boat) =>
          sum +
          (boat.owner === seat
            ? boat.hold.filter((cargo) => cargo === "einheit").length
            : 0),
        0,
      );
    if (
      wanted &&
      idle < HOLD_SMALL &&
      player.unitsLeft > 0 &&
      covers(player.hand, UNIT_COST)
    ) {
      portsOf(game, seat).forEach((at) => moves.push({ kind: "unit", at }));
    }
  }
  // "1 beliebigen Rohstoff gegen 1 Gold" - worth doing with whatever there is
  // most of, and only ever after the building, which is why it comes last.
  if (game.sold < goldSales(game, seat)) {
    const hand = game.players[seat].hand;
    const spare = [...RESOURCES].sort(
      (one, other) => hand[other] - hand[one],
    )[0];
    if (hand[spare] > 0) {
      moves.push({ kind: "sell", sort: spare });
    }
  }
  return moves.slice(0, PORT_WORTH * 2);
}

/**
 * How far every crossing is from a village this seat does not yet trade with.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns steps over the water, for the crossings within reach
 */
function clothWanted(game: CatanGame, seat: number): Map<number, number> {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>();
  let edge: number[] = [];
  Object.keys(game.villagesOf)
    .map(Number)
    .filter((at) => !(game.traders[at] ?? []).includes(seat))
    .forEach((at) => {
      best.set(at, 0);
      edge.push(at);
    });
  for (let step = 1; step <= SEA_HORIZON && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const path of board.crossings[at].paths) {
        if (!seaPath(game, path)) {
          continue;
        }
        for (const end of board.paths[path].ends) {
          if (!best.has(end)) {
            best.set(end, step);
            next.push(end);
          }
        }
      }
    }
    edge = next;
  }
  return best;
}

/**
 * How far every crossing is from this seat's own pirate fortress.
 *
 * @param game - the game
 * @param seat - whose fortress
 * @returns steps over the water, for the crossings within reach
 * @remarks
 * The same backwards walk the other scenarios use, from the one crossing that
 * matters here: a line that does not head for the fortress is a line that
 * never fights.
 */
function fortWanted(game: CatanGame, seat: number): Map<number, number> {
  const board = islandOf(game.land.length);
  const fort = fortOf(game, seat);
  const best = new Map<number, number>();
  if (fort === null) {
    return best;
  }
  best.set(fort, 0);
  let edge = [fort];
  for (let step = 1; step <= SEA_HORIZON && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const path of board.crossings[at].paths) {
        if (!seaPath(game, path)) {
          continue;
        }
        for (const end of board.paths[path].ends) {
          if (!best.has(end)) {
            best.set(end, step);
            next.push(end);
          }
        }
      }
    }
    edge = next;
  }
  return best;
}

/**
 * How the computer sails.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns the one thing it does next in the movement phase
 * @remarks
 * One ship at a time, because the rulebook makes that a rule - "du musst die
 * Bewegung eines Schiffes erst beenden, bevor du das nächste bewegen darfst" -
 * and it goes where there is something to turn over: an unknown field is a
 * resource or two gold either way, and beyond it may be land to settle.
 */
function voyageMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const which = game.sailing;
  const boat = which === null ? undefined : game.boats[which];
  const moves: CatanMove[] = [];
  if (canCast(game)) {
    // One try a turn and it costs nothing, so there is never a reason to keep
    // it: more shoals on the water is more for everybody to fetch, and this
    // seat is the one whose ships are about to move.
    moves.push({ kind: "cast" });
  }
  // Only what the referee would actually allow: a move that is offered and
  // then refused would still count as something for this ship to do, and the
  // next ship would never get the helm.
  const helming =
    which !== null && boat !== undefined && boat.owner === seat && !boat.done
      ? boatMoves(game, seat, which).filter(
          (move) => applyMove(game, seat, move) !== null,
        )
      : [];
  helming.forEach((move) => moves.push(move));
  if (helming.length === 0) {
    // The ship at the helm has nothing left to do, so the next one may go:
    // "du musst die Bewegung eines Schiffes erst beenden, bevor du das nächste
    // bewegen darfst." Driving a pirate ship off is free, so it comes first.
    chasers(game, seat).forEach((each) =>
      moves.push({ kind: "hunt", boat: each }),
    );
    // A ship is worth taking the helm of exactly when it would have something
    // to do - asked of the same list that would then be played, so the two can
    // never disagree. They did once, and two spent ships passed the helm back
    // and forth between them until the game stopped.
    game.boats.forEach((each, index) => {
      if (
        each.owner === seat &&
        !each.done &&
        index !== which &&
        boatMoves(game, seat, index).some(
          (move) => applyMove({ ...game, sailing: index }, seat, move) !== null,
        )
      ) {
        moves.push({ kind: "helm", boat: index });
      }
    });
  }
  return moves;
}

/**
 * What one ship of this seat could do next.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param which - the ship, by its place in {@link CatanGame.boats}
 * @returns its moves, best first - empty when it is finished
 * @remarks
 * Loading, landing and fishing cost no movement points, so a ship with none
 * left is not finished: it can still put its explorer ashore, set units down on
 * a camp, take a shoal aboard or land one. Only sailing needs points.
 */
function boatMoves(
  game: CatanGame,
  seat: number,
  which: number,
): readonly CatanMove[] {
  const boat = game.boats[which];
  const board = islandOf(game.land.length);
  const moves: CatanMove[] = [];
  if (boat === undefined || boat.owner !== seat || boat.done) {
    return moves;
  }
  // A shoal in the hold is worth a point at the council and nothing anywhere
  // else, so landing it comes before everything.
  if (boat.hold.includes("fisch") || boat.hold.includes("gewuerz")) {
    councilDocks(game)
      .filter((at) => board.paths[boat.at].ends.includes(at))
      .forEach((at) => moves.push({ kind: "deliver", at }));
  }
  if (worthFishing(game, seat) && holdRoom(boat.hold, true)) {
    game.shoals
      .filter((hex) => reaches(board, boat.at, hex))
      .forEach((hex) => moves.push({ kind: "catch", at: hex }));
  }
  // Units go ashore on a camp the moment they can: that is what they are for.
  if (boat.hold.includes("einheit")) {
    // Only a camp this seat could actually finish. Units left on one that never
    // falls are gone for good, and so is everything they could have bought.
    const carried = boat.hold.filter((cargo) => cargo === "einheit").length;
    campsFrom(game, boat.at)
      .filter(
        (at) =>
          (game.camps[at]?.units.length ?? 0) +
            carried +
            game.players[seat].unitsLeft >=
          CAMP_UNITS,
      )
      .forEach((at) => moves.push({ kind: "storm", at }));
    // A unit set down in a village never comes back, and a camp needs three of
    // them at once. So the last three stay in the box while a camp still
    // stands: a finale played them all into villages and then sat forever with
    // two units on a camp and none left to send after them.
    if (sparesUnits(game, seat)) {
      villageSpots(game, seat)
        .filter((each) => each.boat === which)
        .forEach((each) => moves.push({ kind: "drop", at: each.hex }));
    }
  }
  // "Ihr dürft jederzeit Spielfiguren aus einem eurer Schiffe entfernen und zum
  // Vorrat zurücklegen. Dies kann zum Beispiel sinnvoll sein, wenn ihr Platz
  // für eine wertvollere Figur schaffen wollt." A figure with nowhere left to
  // go is worth less than the room it takes: eleven ships once carried an
  // explorer that had no coast left to found on, and not one hold was free for
  // the fish that were still swimming.
  if (
    worthFishing(game, seat) &&
    game.shoals.length > 0 &&
    !holdRoom(boat.hold, true)
  ) {
    [...new Set(boat.hold)].forEach((cargo) => {
      if (deadCargo(game, seat, cargo)) {
        moves.push({ kind: "unload", boat: which, cargo });
      }
    });
  }
  // An explorer that can land does so: that is the point of carrying one - and
  // only where it really can, or the ship counts as busy and its whole fleet
  // stands still. See landingSpots.
  if (boat.hold.includes("entdecker")) {
    landingSpots(game, seat, boat.at).forEach((at) =>
      moves.push({ kind: "landfall", at }),
    );
  }
  // Otherwise pick up what is waiting in a harbour.
  if (boat.hold.length === 0) {
    board.paths[boat.at].ends
      .filter((end) => (game.docks[end] ?? []).length > 0)
      .forEach((at) => moves.push({ kind: "load", at }));
  }
  // Four things a ship sails towards, and it wants the nearest of whichever
  // applies: the council with a shoal aboard, a camp with units aboard, a shoal
  // while the fish track still pays, its own harbour when cargo waits there -
  // and otherwise the unknown.
  const waiting = portsOf(game, seat).filter(
    (at) => (game.docks[at] ?? []).length > 0,
  );
  const fishy =
    worthFishing(game, seat) &&
    game.shoals.length > 0 &&
    boat.hold.length === 0;
  const fetching = boat.hold.length === 0 && waiting.length > 0;
  // A unit waiting in a basin is worth more than a shoal on the water: it is
  // what a camp and a village are taken with, and where it stands it does
  // nothing at all. Self-play left five colours with units in eight harbours
  // while every empty ship went fishing.
  const fetchFirst =
    fetching &&
    (villagesLeft(game, seat) > 0 ||
      (camping(game) &&
        Object.values(game.camps).some((camp) => !camp.taken))) &&
    waiting.some((at) =>
      (game.docks[at] ?? []).some((cargo) => cargo === "einheit"),
    );
  const homing = boat.hold.includes("fisch") || boat.hold.includes("gewuerz");
  const exploring = boat.hold.includes("entdecker");
  const wanted = homing
    ? fishWanted(game, true)
    : boat.hold.includes("einheit")
      ? // Both at once, by whichever is nearer: a camp is worth two gold and a
        // step on its track, a village a sack and an advantage, and which of
        // them a loaded ship should make for is a question of distance. Asking
        // for the villages first meant the camps were never stormed at all -
        // ten finales, one camp taken between them.
        nearest(campWanted(game), villageWanted(game, seat))
      : exploring
        ? // An explorer sails towards the unknown - and, once there is none
          // left, towards the nearest coast it could still found on. Without
          // the second half nine explorer ships rowed in circles on a board
          // that was turned up but not built up, and three colours sat on
          // fourteen of seventeen points for a thousand turns.
          nearest(seaWanted(game), landWanted(game, seat))
        : fetchFirst
          ? dockWanted(game, waiting)
          : fishy
            ? fishWanted(game, false)
            : fetching
              ? dockWanted(game, waiting)
              : seaWanted(game);
  // Nothing of that kind within reach: then the unknown will do. A map with no
  // entry at all is a flat one, and on a flat map every step looks the same -
  // which is how ships end up sailing back and forth on the spot.
  const near = wanted.size > 0 ? wanted : seaWanted(game);
  const docks = councilDocks(game);
  const worth = (at: number): number =>
    (homing
      ? board.paths[at].ends.filter((end) => docks.includes(end)).length *
        LANDFALL_WORTH
      : boat.hold.includes("einheit")
        ? (campsFrom(game, at).length + villagesFrom(game, seat, at).length) *
          LANDFALL_WORTH
        : exploring
          ? (landingSpots(game, seat, at).length > 0 ? LANDFALL_WORTH : 0) +
            (pointsAt(game, at) === null ? 0 : LANDFALL_WORTH)
          : fetchFirst
            ? board.paths[at].ends.some((end) => waiting.includes(end))
              ? LANDFALL_WORTH
              : 0
            : fishy
              ? game.shoals.filter((hex) => reaches(board, at, hex)).length *
                LANDFALL_WORTH
              : fetching
                ? board.paths[at].ends.some((end) => waiting.includes(end))
                  ? LANDFALL_WORTH
                  : 0
                : pointsAt(game, at) === null
                  ? 0
                  : LANDFALL_WORTH) - (near.get(at) ?? SEA_HORIZON);
  [...lanesFrom(game, boat)]
    .sort((one, other) => worth(other) - worth(one))
    .slice(0, 1)
    .forEach((at) => moves.push({ kind: "sail2", at }));
  return moves;
}

/**
 * Whether a figure in a hold has anywhere left to go.
 *
 * @param game - the game
 * @param seat - whose ship
 * @param cargo - what it is carrying
 * @returns true when nothing on the board could still use it
 * @remarks
 * An explorer wants a coast with room for a settlement, a unit wants a camp or
 * a village. A shoal and a sack always have the Catanischer Rat, so they are
 * never dead weight.
 */
function deadCargo(game: CatanGame, seat: number, cargo: Cargo): boolean {
  const board = islandOf(game.land.length);
  if (cargo === "entdecker") {
    return !board.paths.some(
      (path) => landingSpots(game, seat, path.id).length > 0,
    );
  }
  if (cargo === "einheit") {
    return (
      !(
        camping(game) && Object.values(game.camps).some((camp) => !camp.taken)
      ) && villagesLeft(game, seat) === 0
    );
  }
  return false;
}

/**
 * Whether a unit may be spent on a village without stranding the camps.
 *
 * @param game - the game
 * @param seat - whose units
 * @returns whether a village may have one
 * @remarks
 * Only once this seat has actually put a unit on a camp: from then on the three
 * that camp needs stay in the box. Reserving them from the start instead is
 * worse than the problem - the spice mission then never gets a unit at all, and
 * a self-played finale ran 2651 turns without one.
 */
function sparesUnits(game: CatanGame, seat: number): boolean {
  const invested =
    camping(game) &&
    Object.values(game.camps).some(
      (camp) => !camp.taken && camp.units.includes(seat),
    );
  return !invested || game.players[seat].unitsLeft > CAMP_UNITS;
}

/**
 * Whether a shoal is still worth fetching for this seat.
 *
 * @param game - the game
 * @param seat - whose track
 * @returns whether the fish track can still pay
 * @remarks
 * The track is finite, and a marker on its last field earns nothing more. A
 * self-played game found out what forgetting that costs: ships fished 907
 * shoals in and never sailed north again, so half the region stayed face down,
 * nobody had anywhere left to build, and three seats sat on 13 points of 15.
 */
function worthFishing(game: CatanGame, seat: number): boolean {
  return shoaling(game) && (game.catches[seat] ?? 0) < MISSION_STEPS.length - 1;
}

/**
 * How far every sea path is from one worth reaching.
 *
 * @param game - the game
 * @param wanted - which paths are the destination
 * @returns steps over the water, for the paths within reach
 * @remarks
 * A breadth-first walk backwards from the paths that are already there, so one
 * pass answers the question for every ship at once. The four things a ship
 * sails towards - the unknown, a camp, a shoal, its own loaded harbour - differ
 * only in that first step, so they share the walk.
 */
function wantedFrom(
  game: CatanGame,
  wanted: (path: number) => boolean,
): Map<number, number> {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>();
  let edge: number[] = [];
  // Occupied lanes count as water here, and rightly so: a ship may cross one -
  // "du darfst dein Schiff über ein oder zwei nebeneinanderstehende Schiffe
  // hinwegziehen" - and crossing costs exactly the point that walking it would.
  const open = (path: number): boolean => findLane(game, path);
  board.paths.forEach((path) => {
    if (open(path.id) && wanted(path.id)) {
      best.set(path.id, 0);
      edge.push(path.id);
    }
  });
  for (let step = 1; step <= SEA_HORIZON && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const end of board.paths[at].ends) {
        for (const near of board.crossings[end].paths) {
          if (open(near) && !best.has(near)) {
            best.set(near, step);
            next.push(near);
          }
        }
      }
    }
    edge = next;
  }
  return best;
}

/**
 * How far a ship of Entdecker & Piraten looks ahead.
 *
 * @remarks
 * Not a move budget - a horizon. It has to span the whole board, because what
 * it feeds is a gradient: a path that knows how far it is from the nearest
 * unknown field tells a ship which way to go. Where the gradient stops, every
 * step looks the same and ships wander on the spot - which is what happened
 * with a horizon of six on the wider board of scenario 3: half the northern
 * region was still face down after three and a half thousand turns.
 */
const SEA_HORIZON = 30;

/**
 * How far every sea path is from one of this seat's loaded harbours.
 *
 * @param game - the game
 * @param ports - the harbour settlements with something waiting in them
 * @returns steps over the water, for the paths within reach
 * @remarks
 * The missing third of the pipeline: units are built into a basin, a ship has
 * to fetch them, and a ship that only ever sails towards the unknown never
 * comes back for them.
 */
function dockWanted(
  game: CatanGame,
  ports: readonly number[],
): Map<number, number> {
  const board = islandOf(game.land.length);
  return wantedFrom(game, (path) =>
    board.paths[path].ends.some((end) => ports.includes(end)),
  );
}

/**
 * How far every sea path is from one that could land units on a camp.
 *
 * @param game - the game
 * @returns steps over the water, for the paths within reach
 * @remarks
 * Without it a loaded ship wanders: every single step looks the same, and a
 * landing is a run of them.
 */
function campWanted(game: CatanGame): Map<number, number> {
  return wantedFrom(game, (path) => campsFrom(game, path).length > 0);
}

/**
 * How far every sea path is from one that would turn a field over.
 *
 * @param game - the game
 * @returns steps over the water, for the paths within reach
 */
function seaWanted(game: CatanGame): Map<number, number> {
  return wantedFrom(game, (path) => pointsAt(game, path) !== null);
}

/**
 * How many villages this seat could still befriend.
 *
 * @param game - the game
 * @param seat - whose units
 * @returns the villages with a sack left that this seat has no unit on
 * @remarks
 * One unit each and one sack each: once a seat has visited every village that
 * has come to light, another unit buys it nothing.
 */
function villagesLeft(game: CatanGame, seat: number): number {
  return spicing(game)
    ? Object.entries(game.sacks).filter(
        ([hex, left]) =>
          left > 0 && !(game.villages[Number(hex)] ?? []).includes(seat),
      ).length
    : 0;
}

/** The villages a ship on this path could set a unit down on. */
function villagesFrom(
  game: CatanGame,
  seat: number,
  at: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  return Object.keys(game.sacks)
    .map(Number)
    .filter(
      (hex) =>
        (game.sacks[hex] ?? 0) > 0 &&
        !(game.villages[hex] ?? []).includes(seat) &&
        reaches(board, at, hex),
    );
}

/** The nearer of two goals, path by path. */
function nearest(
  one: Map<number, number>,
  other: Map<number, number>,
): Map<number, number> {
  const both = new Map(one);
  other.forEach((steps, path) => {
    const known = both.get(path);
    if (known === undefined || steps < known) {
      both.set(path, steps);
    }
  });
  return both;
}

/**
 * How far every sea path is from one an explorer could go ashore from.
 *
 * @param game - the game
 * @param seat - whose explorer
 * @returns steps over the water, for the paths within reach
 * @remarks
 * The unknown is what an explorer ship is for, but the unknown runs out - and
 * then the only thing left worth sailing to is a coast with room for a
 * settlement. See {@link landingSpots} for what "room" means.
 */
function landWanted(game: CatanGame, seat: number): Map<number, number> {
  return wantedFrom(game, (path) => landingSpots(game, seat, path).length > 0);
}

/** How far every sea path is from a village this seat has not visited. */
function villageWanted(game: CatanGame, seat: number): Map<number, number> {
  return wantedFrom(game, (path) => villagesFrom(game, seat, path).length > 0);
}

/**
 * How far every sea path is from a shoal, or from the Catanischer Rat.
 *
 * @param game - the game
 * @param home - whether the ship is carrying a shoal home
 * @returns steps over the water, for the paths within reach
 * @remarks
 * A shoal is only worth a point once it has been landed, so a loaded ship wants
 * the council and an empty one wants the water the fish are in.
 */
function fishWanted(game: CatanGame, home: boolean): Map<number, number> {
  const board = islandOf(game.land.length);
  const docks = councilDocks(game);
  return wantedFrom(game, (path) =>
    home
      ? board.paths[path].ends.some((end) => docks.includes(end))
      : game.shoals.some((hex) => reaches(board, path, hex)),
  );
}

/**
 * Where the computer puts its own pirate ship.
 *
 * @param game - the game
 * @param seat - whose ship
 * @returns the sea field it would pick
 * @remarks
 * Where somebody else's ships are: that is where it takes a card, and where its
 * toll costs them most.
 */
function corsairMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const board = islandOf(game.land.length);
  const worth = (hex: number): number =>
    board.hexes[hex].rim.reduce(
      (sum, path) =>
        sum +
        game.boats.filter((boat) => boat.at === path && boat.owner !== seat)
          .length,
      0,
    );
  return [...pirateSeas(game)]
    .sort((one, other) => worth(other) - worth(one))
    .slice(0, 1)
    .map((at) => ({ kind: "corsair", at }) as CatanMove);
}

/** How the computer weighs the sea. */
const SHIP_WORTH = 3;
const SHIP_REACH = 6;

/** How many warships the computer wants before it storms a fortress. */
const STORM_GUNS = 3;

/** How many ordinary ships stay in front of them, to be lost instead. */
const STORM_FODDER = 2;

/**
 * The fewest warships worth attacking with.
 *
 * @remarks
 * The pirates roll one die and win a tie: one warship can never take a chip, so
 * an attack with one is a ship thrown away. Two can.
 */
const STORM_LEAST = 2;
const LANDFALL_WORTH = 9;

/**
 * Where the computer sends the Seeräuber.
 *
 * @param game - the game
 * @param seat - who is moving it
 * @returns the sea fields it would pick, best first
 * @remarks
 * Onto the water where the leader's ships are, which is the same instinct the
 * robber follows on land - and if nobody is out there, anywhere at all, because
 * "eine der beiden Figuren muss versetzt werden".
 */
function pirateMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const board = islandOf(game.land.length);
  const worth = (hex: number): number =>
    board.hexes[hex].rim.reduce((sum, path) => {
      const owner = game.ships[path];
      return (
        sum + (owner === null || owner === seat ? 0 : 1 + pointsOf(game, owner))
      );
    }, 0);
  return [...pirateSpots(game)]
    .sort((one, other) => worth(other) - worth(one))
    .slice(0, 1)
    .map((at) => ({ kind: "pirate", at }) as CatanMove);
}

/** Which resource the computer takes from a Goldfluss. */
function wantedSort(game: CatanGame, seat: number): Resource {
  const hand = game.players[seat].hand;
  // The card that is missing from the next thing worth building: a city is the
  // dearest, so ore and grain first, then whatever is scarcest in hand.
  const wanted: readonly Resource[] = [
    "erz",
    "getreide",
    "lehm",
    "holz",
    "wolle",
  ];
  return (
    wanted.find((sort) => hand[sort] === 0) ??
    [...RESOURCES].sort((one, other) => hand[one] - hand[other])[0]
  );
}

/**
 * What the computer does at sea.
 *
 * @param game - the game
 * @param seat - whose turn
 * @returns the ships it would build or move, best first
 * @remarks
 * A ship is worth building where it brings a **new island** within reach, which
 * is what the free game pays a point for - and worth little in open water that
 * leads nowhere. Moving one is offered last, because a ship already on the
 * board is doing something.
 */
function shipMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (sailing(game)) {
    const board = islandOf(game.land.length);
    // In Die Pirateninseln a ship line has exactly one destination, and it is
    // not a shore: "diese beginnt an deiner Küstensiedlung ... und führt ...
    // zur Piratenfestung in deiner Farbe".
    // Only while there is a fortress left to reach: once it has fallen, the
    // line has done its work and the ships are worth what they are worth in
    // the free game - a new shore. A colour that had taken its fortress went on
    // steering for it, found no gradient anywhere, and stopped building at nine
    // of ten points.
    const chasing = corsairs(game) && fortOf(game, seat) !== null;
    const wanted = chasing
      ? fortWanted(game, seat)
      : tribe(game)
        ? // "Erreichst du mit deiner Schiffslinie eine der markierten
          // Kreuzungen, erhältst du das Geschenk": a Siegpunkt-Chip is a point,
          // and a point is the thing this game is about. Without it the gifts
          // were only ever found by accident on the way to a shore - a
          // self-played table of six sat on twelve of thirteen points with five
          // chips lying on the water.
          nearest(shoreWanted(game, seat), giftWanted(game))
        : cloth(game)
          ? // In Stoffe für Catan a ship line has one purpose: "sobald du eine
            // Schiffslinie zwischen einer eigenen Siedlung und einem Dorf ...
            // hergestellt hast, unterhältst du eine Handelsbeziehung". Aiming at
            // shores instead leaves the fleet at home once the coast is built up
            // - at five colours a self-played table made no single trade.
            clothWanted(game, seat)
          : shoreWanted(game, seat);
    // Two scenarios put their prize right across the board - the fortress and
    // the gifts - so their gradient has to reach that far.
    const far = chasing || tribe(game);
    const worth = (at: number): number =>
      (game.presents[at] === undefined ? 0 : LANDFALL_WORTH) +
      board.paths[at].ends.reduce((sum, end) => {
        const landing =
          landCrossing(game, end) &&
          game.towns[end] === null &&
          canTown({ ...game, ships: shipAt(game, seat, at) }, seat, end);
        // Reaching a foreign shore is what the free game pays for; getting
        // nearer to one is the next best thing, and open water that leads
        // nowhere is worth nothing at all.
        return (
          sum +
          (landing && newIsland(game, seat, end) ? LANDFALL_WORTH : 0) +
          (landing ? SHIP_WORTH : 0) +
          // The fortress is the length of the board away, so the gradient has
          // to reach that far: a horizon of six leaves a line stranded halfway
          // with nothing looking better than anything else.
          Math.max(
            0,
            (far ? SEA_HORIZON : SHIP_REACH) -
              (wanted.get(end) ?? (far ? SEA_HORIZON : SHIP_REACH)),
          )
        );
      }, 0);
    // "Du darfst in diesem Szenario nur 1 Schiffslinie zu den westlichen Inseln
    // bauen." So every ship goes on the one line: the first anywhere it may,
    // each later one on an end of what is already there. Building elsewhere is
    // how a colour ended up with fifteen ships in four little heaps, one of
    // them at its fortress, and no way to ever arm a second one.
    const attaches = (at: number): boolean => {
      if (!chasing) {
        return true;
      }
      const line = shipLine(game, seat);
      // On an end of the line, or at one of this seat's own settlements, which
      // is where a line starts: "diese beginnt an deiner Küstensiedlung".
      return board.paths[at].ends.some(
        (end) =>
          game.towns[end]?.owner === seat ||
          line.some((path) => board.paths[path].ends.includes(end)),
      );
    };
    const ranked = covers(game.players[seat].hand, SHIP_COST)
      ? [...shipSpots(game, seat)]
          .filter(attaches)
          .sort((one, other) => worth(other) - worth(one))
      : [];
    if (ranked.length > 0 && worth(ranked[0]) > 0) {
      moves.push({ kind: "ship", at: ranked[0] });
    }
    // "Du darfst pro Zug 1 Schiff versetzen." Only once the supply is empty:
    // while there is a ship left to build, building one is strictly better than
    // moving one, and moving is what the fleet has instead of growing.
    //
    // Without it a colour that had spread its ships over the wrong water was
    // finished for the rest of the game. Die Pirateninseln showed it worst:
    // fifteen ships on the board, one of them at the fortress, no way to ever
    // get a second one there - and the game cannot end at all until a fortress
    // falls, whatever anybody's points say.
    // Moving costs nothing, so it is not asked of the hand: a colour with no
    // wood and no wool still has a fleet, and a fleet that may not be moved is
    // a fleet that cannot answer anything the board does.
    if (
      !game.shipMoved &&
      (game.players[seat].shipsLeft === 0 || ranked.length === 0)
    ) {
      const best = looseShips(game, seat).reduce<{
        from: number;
        to: number;
        gain: number;
      } | null>((found, from) => {
        const lifted: CatanGame = {
          ...game,
          ships: game.ships.map((owner, path) =>
            path === from ? null : owner,
          ),
          players: game.players.map((player, at) =>
            at === seat
              ? { ...player, shipsLeft: player.shipsLeft + 1 }
              : player,
          ),
        };
        return shipSpots(lifted, seat).reduce((better, to) => {
          const gain = worth(to) - worth(from);
          return to !== from &&
            gain > 0 &&
            (better === null || gain > better.gain)
            ? { from, to, gain }
            : better;
        }, found);
      }, null);
      if (best !== null) {
        moves.push({ kind: "sail", from: best.from, to: best.to });
      }
    }
  }
  return moves;
}

/**
 * How far every crossing is from a gift still lying on the water.
 *
 * @param game - the game
 * @returns steps over the water, for the crossings within reach
 * @remarks
 * *Der vergessene Stamm* hangs its points on the crossings of the tribe's
 * island: "Erreichst du mit deiner Schiffslinie eine der markierten Kreuzungen,
 * erhältst du das Geschenk, das dort liegt." Five of the eight are
 * Siegpunkt-Chips, so a fleet that does not steer for them is a fleet that
 * leaves the game unwinnable once the coast is built up.
 */
function giftWanted(game: CatanGame): Map<number, number> {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>();
  let edge: number[] = [];
  Object.keys(game.presents).forEach((path) => {
    board.paths[Number(path)].ends.forEach((end) => {
      if (!best.has(end)) {
        best.set(end, 0);
        edge.push(end);
      }
    });
  });
  // As far as the board is wide, like the fortress in Die Pirateninseln: the
  // gifts lie on the little islands all around, and a horizon of six leaves a
  // fleet halfway there with nothing looking better than anything else.
  for (let step = 1; step <= SEA_HORIZON && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const path of board.crossings[at].paths) {
        if (seaPath(game, path)) {
          const ends = board.paths[path].ends;
          const to = ends[0] === at ? ends[1] : ends[0];
          if (!best.has(to)) {
            best.set(to, step);
            next.push(to);
          }
        }
      }
    }
    edge = next;
  }
  return best;
}

/** The board with one more ship of this seat's on it. */
function shipAt(
  game: CatanGame,
  seat: number,
  at: number,
): readonly (number | null)[] {
  return game.ships.map((owner, path) => (path === at ? seat : owner));
}

/**
 * How far every crossing is from the nearest foreign shore.
 *
 * @param game - the game
 * @param seat - whose voyage
 * @returns steps over water, for the crossings within reach
 * @remarks
 * A breadth-first walk **backwards** from the shores worth landing on, so one
 * pass answers the question for every candidate ship at once. Without it the
 * computer builds ships that go nowhere: each single ship looks the same as the
 * next, and a voyage is a run of them.
 */
function shoreWanted(game: CatanGame, seat: number): Map<number, number> {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>();
  let edge: number[] = [];
  board.crossings.forEach((crossing) => {
    if (
      landCrossing(game, crossing.id) &&
      game.towns[crossing.id] === null &&
      newIsland(game, seat, crossing.id)
    ) {
      best.set(crossing.id, 0);
      edge.push(crossing.id);
    }
  });
  for (let step = 1; step <= SHIP_REACH && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const path of board.crossings[at].paths) {
        if (seaPath(game, path)) {
          const ends = board.paths[path].ends;
          const to = ends[0] === at ? ends[1] : ends[0];
          if (!best.has(to)) {
            best.set(to, step);
            next.push(to);
          }
        }
      }
    }
    edge = next;
  }
  return best;
}

/** How far the computer looks along the roads for a site. */
const HAUL_REACH = 12;

/**
 * How far the wagon is from where it has to go.
 *
 * @param game - the game
 * @param seat - whose wagon
 * @param from - the crossing to measure from
 * @returns the cheapest run of movement points, or a large number
 * @remarks
 * Measured in **movement points** rather than in steps, because that is what a
 * drive spends: a rival's road is as far as one's own, but a bare path is twice
 * as far and a barbarian adds two on top. A plain breadth-first walk over the
 * crossings, stopped at a depth no board needs more than.
 */
function haulDistance(
  game: CatanGame,
  seat: number,
  from: number,
  goal: number,
): number {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>([[from, 0]]);
  let edge = [from];
  for (let step = 0; step < HAUL_REACH && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      const here = best.get(at) ?? 0;
      for (const path of board.crossings[at].paths) {
        const ends = board.paths[path].ends;
        const to = ends[0] === at ? ends[1] : ends[0];
        const cost = here + stepCost(game, seat, path).moves;
        if (cost < (best.get(to) ?? Number.MAX_SAFE_INTEGER)) {
          best.set(to, cost);
          next.push(to);
        }
      }
    }
    edge = next;
  }
  return best.get(goal) ?? Number.MAX_SAFE_INTEGER;
}

/** Where this seat's wagon is trying to get to. */
function haulGoal(game: CatanGame, seat: number): number | null {
  const player = game.players[seat];
  const target = player.ware === null ? null : WARE_GOES[player.ware];
  const depot =
    target === null
      ? // No load yet: any site will do, so the nearest one.
        [...game.depots].sort(
          (one, other) =>
            haulDistance(game, seat, player.wagon ?? 0, one.gate) -
            haulDistance(game, seat, player.wagon ?? 0, other.gate),
        )[0]
      : game.depots.find((each) => each.target === target);
  return depot?.gate ?? null;
}

/**
 * How the computer drives.
 *
 * @param game - the game
 * @param seat - whose wagon
 * @returns the step it would take, best first
 * @remarks
 * It drives towards its load's destination, one step at a time, and takes the
 * step that shortens the run most. A barbarian in the way is rolled against
 * first when the tableau allows it, because a successful roll is free and
 * shortens the same run by two.
 */
function driveMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  const goal = haulGoal(game, seat);
  const player = game.players[seat];
  if (goal !== null && player.wagon !== null) {
    facingRaiders(game, seat).forEach((at) =>
      moves.push({ kind: "shove", at }),
    );
    const here = haulDistance(game, seat, player.wagon, goal);
    const steps = [...driveSpots(game, seat)].sort(
      (one, other) =>
        haulDistance(game, seat, one, goal) -
        haulDistance(game, seat, other, goal),
    );
    steps.forEach((at) => {
      if (haulDistance(game, seat, at, goal) < here) {
        moves.push({ kind: "drive", at });
      }
    });
    // The Getreide is worth spending only when the last two points would
    // finish the run.
    if (!player.boosted && here <= player.moves + GRAIN_MOVE) {
      moves.push({ kind: "boost" });
    }
  }
  return moves;
}

/** Where the computer puts a barbarian it has lifted. */
function shiftMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const worth = (at: number): number => {
    const owner = game.roads[at];
    // On a rival's road first - that is where it costs them and may cost them
    // a card - and never back onto one's own.
    return owner === null ? 1 : owner === seat ? -1 : 2;
  };
  return [...raiderSpots(game)]
    .sort((one, other) => worth(other) - worth(one))
    .slice(0, 1)
    .map((at) => ({ kind: "shift", at }) as CatanMove);
}

/** What the computer does with the hauling cards and the tableau. */
function haulMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (hauling(game)) {
    const price = stepPrice(game, seat);
    if (price !== null && covers(game.players[seat].hand, price)) {
      moves.push({ kind: "tableau" });
    }
    for (const card of game.players[seat].haul) {
      if (!HAUL_POINT_CARDS.includes(card)) {
        moves.push({ kind: "haulCard", card });
      }
    }
  }
  return moves;
}

/** How the computer weighs the barbarian scenario. */
const OWN_COAST = 3;
const RIDE_FAR_GRAIN = 3;

/**
 * Where the computer puts a knight a card has just handed it.
 *
 * @param game - the game
 * @param seat - whose card it is
 * @returns the placements it would consider, best first
 * @remarks
 * A knight is worth most where it can finish a battle - "eure Ritter besiegen
 * die Barbaren, wenn sich auf den Wegen, die ein Küstenfeld umgeben, mehr
 * Ritter befinden als Barbaren" - and second-most beside a field this seat has
 * built at, because that is the field whose loss would cost it an income.
 */
function postMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const where = game.posting;
  return where === null
    ? []
    : [...postSpots(game, where)]
        .sort(
          (one, other) =>
            pathWorth(game, seat, other) - pathWorth(game, seat, one),
        )
        .map((at) => ({ kind: "post", at }) as CatanMove);
}

/** What a path is worth to a knight of this seat's. */
function pathWorth(game: CatanGame, seat: number, at: number): number {
  const board = islandOf(game.land.length);
  return board.paths[at].hexes.reduce((sum, hex) => {
    const barbarians = game.barbarians[hex] ?? 0;
    const mine = board.hexes[hex].corners.some(
      (corner) => game.towns[corner]?.owner === seat,
    );
    // A field one more knight would win outright is worth the most; after that,
    // any field with barbarians on it, and one of one's own above a stranger's.
    const nearly =
      barbarians > 0 && guardsAt(game, hex).length + 1 > barbarians;
    return (
      sum + (nearly ? OWN_COAST * 2 : 0) + barbarians + (mine ? OWN_COAST : 0)
    );
  }, 0);
}

/**
 * Which barbarian a card takes or puts down.
 *
 * @param game - the game
 * @param seat - whose card it is
 * @returns the fields it would pick, best first
 * @remarks
 * Taking, it clears the field nearest its own buildings; putting one back down,
 * it picks the field furthest from them, which is what "setze diese auf 2
 * anderen, noch nicht eroberten wieder ein" is for.
 */
function barbMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const taking = game.barbTake > 0;
  const spots = taking ? takeSpots(game) : putSpots(game);
  const worth = (hex: number): number => {
    const board = islandOf(game.land.length);
    const mine = board.hexes[hex].corners.filter(
      (corner) => game.towns[corner]?.owner === seat,
    ).length;
    return taking ? mine * OWN_COAST + (game.barbarians[hex] ?? 0) : -mine;
  };
  return [...spots]
    .sort((one, other) => worth(other) - worth(one))
    .map((at) => ({ kind: "barb", at }) as CatanMove);
}

/**
 * Where the computer rides its knights.
 *
 * @param game - the game
 * @param seat - whose knights
 * @returns one ride, the best it can see
 * @remarks
 * One at a time, because each ride changes what the next one is worth: a knight
 * that has just made a field winnable changes where the second one should go.
 */
function rideMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  const grain = game.players[seat].hand.getreide;
  game.guards.forEach((owner, from) => {
    if (owner === seat && !game.ridden.includes(from)) {
      // The far ride costs a Getreide, so it is only asked for when the near
      // one cannot reach anything better.
      const near = bestRide(game, seat, from, KNIGHT_STEPS);
      const far =
        grain > RIDE_FAR_GRAIN
          ? bestRide(game, seat, from, KNIGHT_STEPS + EXTRA_STEPS)
          : null;
      // A knight trained this turn has to leave the castle whatever the
      // ground outside is worth: "hast du in deinem Zug einen Ritter auf einen
      // Weg des Burgfeldes gesetzt, musst du ihn von dort wegziehen."
      const here = game.fort.gates.includes(from)
        ? -1
        : pathWorth(game, seat, from);
      if (far !== null && near !== null && far.worth > near.worth) {
        moves.push({ kind: "ride", from, to: far.at, far: true });
      } else if (near !== null && near.worth > here) {
        moves.push({ kind: "ride", from, to: near.at });
      }
    }
  });
  // "Ist eine Person am Zug, zieht sie zuerst ihre(n) Ritter und anschließend
  // den Fremden Ritter" - so his ride is looked for only once every knight of
  // one's own has moved, which is what the referee allows anyway.
  const stranger = strangerAt(game);
  const own = game.guards.some(
    (owner, at) =>
      owner === seat &&
      !game.ridden.includes(at) &&
      rideSpots(game, at, KNIGHT_STEPS).length > 0,
  );
  const owedHim = stranger !== null && game.fort.gates.includes(stranger);
  if (
    stranger !== null &&
    !game.ridden.includes(stranger) &&
    (!own || owedHim)
  ) {
    const near = bestRide(game, seat, stranger, KNIGHT_STEPS);
    // A knight on a castle path has to leave it whatever lies outside, and
    // that holds for the Fremder Ritter the turn he comes out.
    if (
      near !== null &&
      (owedHim || near.worth > pathWorth(game, seat, stranger))
    ) {
      moves.push({ kind: "ride", from: stranger, to: near.at });
    }
  }
  // The castle first: that ride is owed, the others are only worth making.
  const owed = moves.filter((move) =>
    move.kind === "ride" ? game.fort.gates.includes(move.from) : false,
  );
  return [...owed, ...moves].slice(0, 1);
}

/** The best place one knight could reach, and what it is worth there. */
function bestRide(
  game: CatanGame,
  seat: number,
  from: number,
  steps: number,
): { readonly at: number; readonly worth: number } | null {
  const spots = rideSpots(game, from, steps);
  const ranked = [...spots].sort(
    (one, other) => pathWorth(game, seat, other) - pathWorth(game, seat, one),
  );
  return ranked.length === 0
    ? null
    : { at: ranked[0], worth: pathWorth(game, seat, ranked[0]) };
}

/** How the computer weighs a wagon position, and its ballot. */
const WAGON_WORTH = 4;
const ROAD_WORTH = 1;
const LOUD_WORTH = 4;
const BALLOT_MAX = 2;

/**
 * How much this seat would like the wagon to go there.
 *
 * @param game - the game
 * @param seat - who is asking
 * @param at - the path
 * @returns higher where it helps this seat, lower where it helps a rival
 * @remarks
 * Asked of {@link pointsOf} on the board as it would be, rather than of a rule
 * of thumb: the wagon is worth a point where it puts one of this seat's
 * settlements between two of them, and worth exactly as much to a rival where
 * it does the same for theirs. A road of one's own underneath is worth a little
 * on top, because that road then counts double in a trade route.
 */
function wagonValue(game: CatanGame, seat: number, at: number): number {
  const after = {
    ...game,
    wagons: game.wagons.map((which, path) => (path === at ? 0 : which)),
  };
  const mine = pointsOf(after, seat) - pointsOf(game, seat);
  const theirs = Math.max(
    0,
    ...realSeats(game)
      .filter((other) => other !== seat)
      .map((other) => pointsOf(after, other) - pointsOf(game, other)),
  );
  return (
    (mine - theirs) * WAGON_WORTH + (game.roads[at] === seat ? ROAD_WORTH : 0)
  );
}

/**
 * What the computer does in a voting round.
 *
 * @param game - the game
 * @param seat - whose answer the round is waiting for
 * @returns the one move it owes
 * @remarks
 * It lays cards down only when the best position on offer is worth something to
 * it, and never its last wool or grain: "Getreide zählt bei einer Abstimmung
 * als Stimme, wird aber häufiger als Wolle für Bauaktionen benötigt", so wool
 * goes into the ballot first.
 */
function voteMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const vote = game.vote;
  const moves: CatanMove[] = [];
  if (vote !== null) {
    const best = [...wagonSpots(game)].sort(
      (one, other) =>
        wagonValue(game, seat, other) - wagonValue(game, seat, one),
    )[0];
    const worth = best === undefined ? 0 : wagonValue(game, seat, best);
    if (vote.stage === "lay") {
      moves.push({ kind: "lay", cards: ballotFor(game, seat, worth) });
    } else if (best !== undefined) {
      moves.push(
        vote.stage === "assign"
          ? { kind: "vote", at: best }
          : { kind: "wagon", at: best },
      );
    }
  }
  return moves;
}

/** How many spare wool and grain cards go into the ballot. */
function ballotFor(game: CatanGame, seat: number, worth: number): Hand {
  const hand = game.players[seat].hand;
  let want = worth >= LOUD_WORTH ? BALLOT_MAX : worth > 0 ? 1 : 0;
  let cards = NO_CARDS;
  for (const sort of BALLOT) {
    // Never the last one: a vote is not worth the settlement it was saved for.
    const spare = Math.min(want, Math.max(0, hand[sort] - 1));
    cards = withCard(cards, sort, spare);
    want -= spare;
  }
  return cards;
}

/**
 * The fewest fish that still cover a price.
 *
 * @param held - the tiles in hand, by their fish counts
 * @param price - what has to be covered
 * @returns the tiles' places in the hand, or null if they cannot cover it
 * @remarks
 * Biggest tiles first, which both reaches the price in the fewest tiles and
 * wastes the least - a hand of 3+3 paying a four-fish action loses two, where
 * 1+1+1+1 would lose none. Exhaustive search over seven tiles would be cheap
 * enough, but the greedy order is what a person does and the difference is one
 * fish at the margin.
 */
function cheapestBundle(
  held: readonly number[],
  price: number,
): readonly number[] | null {
  const order = held
    .map((fish, at) => ({ fish, at }))
    .sort((one, other) => other.fish - one.fish);
  const picked: number[] = [];
  let paid = 0;
  for (const tile of order) {
    if (paid >= price) {
      break;
    }
    picked.push(tile.at);
    paid += tile.fish;
  }
  return paid >= price ? picked : null;
}

/**
 * What the computer does with gold and bridges, best first.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the moves it would consider
 * @remarks
 * A **bridge** first whenever one is affordable and legal: it pays three gold
 * on the spot, counts towards the Längste Handelsroute like a road, and there
 * are only three for the whole game - so the reason not to build one is never
 * that it was not worth it.
 *
 * Then **buying** what it is short of, since two gold for a card is a better
 * rate than any harbour, and the allowance of two lapses at the end of the
 * turn. Selling four of a spare sort for one gold comes last, and only while
 * the seat is not already sitting on the Armer Cataner - the tile is minus two
 * points, and gold is exactly what lifts it.
 */
function goldMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  // Gold is spent the same way wherever it exists - Die Flüsse, Der
  // Barbarenüberfall, Händler & Barbaren, Entdecker & Piraten. Asking only
  // about the rivers left the others hoarding it: a self-played Piratenlager
  // ended with 1160 gold on one seat and nothing left to build.
  if (rivers(game) || raiding(game) || hauling(game) || finding(game)) {
    const hand = game.players[seat].hand;
    if (
      rivers(game) &&
      game.players[seat].bridgesLeft > 0 &&
      covers(hand, BRIDGE_PRICE)
    ) {
      game.rivers.bridges
        .filter((at) => game.roads[at] === null)
        .forEach((at) => moves.push({ kind: "bridge", at }));
    }
    if (
      game.goldBuys < BUYS_PER_TURN &&
      game.players[seat].gold >= GOLD_PER_BUY
    ) {
      const need = wants(game, seat);
      const sort = [...RESOURCES].sort(
        (one, other) => need[other] - need[one],
      )[0];
      moves.push({ kind: "goldBuy", sort });
    }
    // Only out of a genuine surplus, and never down to nothing.
    const spare = [...RESOURCES]
      .filter((sort) => hand[sort] >= tradeRate(game, seat, sort) + 2)
      .sort((one, other) => hand[other] - hand[one])[0];
    if (spare !== undefined) {
      moves.push({ kind: "goldSell", sort: spare });
    }
  }
  return moves;
}

/**
 * The Handelschip actions worth taking, best first.
 *
 * @param game - the game
 * @param seat - whose turn it is
 * @returns the moves, or nothing when this is not a two-handed table
 * @remarks
 * Three narrow judgements rather than a valuation, because chips are few and
 * each action answers one specific complaint:
 *
 * - the **robber** action is taken when the robber is sitting on a landscape
 *   this seat builds on, which is the one thing it can fix that nothing else
 *   can - the ordinary robber cannot be moved off except by a knight or a
 *   seven,
 * - the **Zwangshandel** when the other player is holding more cards, since
 *   two cards blind out of a big hand beats two out of a small one,
 * - handing a **knight** in when chips have run out, and only while it cannot
 *   cost the Größte Rittermacht - two victory points are worth more than two
 *   chips, every time.
 */
function chipMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  const moves: CatanMove[] = [];
  if (playingTwo(game) && !game.players[seat].neutral) {
    const price = chipCost(game, seat);
    const held = game.players[seat].chips;
    const other = realSeats(game).find((at) => at !== seat);
    // The robber can be off the board entirely - Fischfang auf Catan starts
    // that way, and a fish action puts it back there - so there is nothing to
    // be sitting on.
    const robbed = (
      islandOf(game.land.length).hexes[game.robber]?.corners ?? []
    ).some((corner) => game.towns[corner]?.owner === seat);
    if (held >= price && robbed && !raiding(game)) {
      moves.push({ kind: "chip", action: "robber" });
    }
    // The barbarians take the place of the robber in that scenario, and a
    // chip is worth spending on a field that is one barbarian from falling.
    if (held >= price && canShiftBarbarian(game)) {
      const board = islandOf(game.land.length);
      const nearly = game.fort.coast.some(
        (hex) =>
          (game.barbarians[hex] ?? 0) >= FULL_FIELD - 1 &&
          board.hexes[hex].corners.some(
            (corner) => game.towns[corner]?.owner === seat,
          ),
      );
      if (nearly) {
        moves.push({ kind: "chip", action: "barbarian" });
      }
    }
    if (
      held >= price &&
      other !== undefined &&
      handSize(game.players[other].hand) > handSize(game.players[seat].hand)
    ) {
      moves.push({ kind: "chip", action: "swap" });
    }
    if (held < price && canHandKnightIn(game, seat) && keepsArmy(game, seat)) {
      moves.push({ kind: "knightIn" });
    }
  }
  return moves;
}

/**
 * Whether handing a knight in would leave the Größte Rittermacht where it is.
 *
 * @param game - the game
 * @param seat - who would hand one in
 * @returns true if the tile is not this seat's, or would still be after
 * @remarks
 * The tile is two victory points and a chip is not, so the trade is only ever
 * worth making when it is free. Asked of the same numbers the referee awards
 * the tile from rather than of a copy of that rule.
 */
function keepsArmy(game: CatanGame, seat: number): boolean {
  const left = game.players[seat].knights - 1;
  const best = Math.max(
    0,
    ...game.players.map((player, at) => (at === seat ? 0 : player.knights)),
  );
  return game.army !== seat || (left >= ARMY_MIN && left > best);
}

/** Which sort a Monopol card should name. */
function monopolPicks(game: CatanGame, seat: number): readonly Resource[] {
  return [...RESOURCES].sort((a, b) => {
    const held = (sort: Resource): number =>
      game.players.reduce(
        (sum, player, at) => (at === seat ? sum : sum + player.hand[sort]),
        0,
      );
    return held(b) - held(a);
  });
}

/** Which sorts an Erfindung card should fetch. */
function giftPicks(game: CatanGame, seat: number): readonly Resource[] {
  const need = wants(game, seat);
  return [...RESOURCES].sort(
    (a, b) => need[b] - need[a] || BASE_WORTH[b] - BASE_WORTH[a],
  );
}

/** Spending the two roads a Straßenbau card paid for. */
function freeRoadMoves(game: CatanGame, seat: number): readonly CatanMove[] {
  return game.freeRoads > 0
    ? roadTowards(game, seat)
        .filter((at) => canRoad(game, seat, at))
        .map((at) => ({ kind: "road", at }) as CatanMove)
    : [];
}

/** Development cards worth playing this turn. */
function playableCards(game: CatanGame, seat: number): readonly CatanMove[] {
  const deck = game.players[seat].deck;
  const useful: CatanMove[] = [];
  if (!game.playedDev) {
    const hand = game.players[seat].hand;
    if (
      deck.includes("erfindung") &&
      !covers(hand, TOWN_COST) &&
      !covers(hand, CITY_COST)
    ) {
      useful.push({ kind: "play", card: "erfindung" });
    }
    if (deck.includes("monopol")) {
      useful.push({ kind: "play", card: "monopol" });
    }
    if (deck.includes("strassenbau") && roadSpots(game, seat).length > 0) {
      useful.push({ kind: "play", card: "strassenbau" });
    }
  }
  return useful;
}

/**
 * Playing a knight before the roll.
 *
 * @remarks
 * Worth doing for one reason above all: the robber is sitting on one of the
 * computer's own good landscapes, and a knight is the only way to shift it
 * without waiting for somebody else to roll a seven.
 */
function knightFirst(game: CatanGame, seat: number): readonly CatanMove[] {
  const blocked = (
    islandOf(game.land.length).hexes[game.robber]?.corners ?? []
  ).some((at: number) => game.towns[at]?.owner === seat);
  const holds = game.players[seat].deck.includes("ritter");
  // In Die Pirateninseln a knight is not a robber at all: it arms a ship, and
  // an unarmed line never takes a fortress. So it is played the moment there is
  // a ship to arm - a self-played table sat on twelve knight cards each with
  // the deck empty and one warship between them.
  // Armed while there is still something to lose in front: the two ships a
  // lost fight takes are the ones at the far end, and a line of nothing but
  // warships loses them instead.
  const line = corsairs(game) ? shipLine(game, seat) : [];
  const arming =
    corsairs(game) &&
    line.some((path) => !game.warships.includes(path)) &&
    // Fodder in front only while the line can still grow. It cannot grow once
    // it has arrived - "die Schiffslinie darf sich nicht verzweigen und auch
    // nicht über die Piratenfestung hinaus gebaut werden" - and it cannot grow
    // with nowhere left to build. Then an unarmed ship is worth nothing at all:
    // a self-played table sat at the fortress with a line of two, ten knight
    // cards in hand, and waited for a third ship that the rules forbid.
    (line.length - warshipsOf(game, seat) > STORM_FODDER ||
      atFort(game, seat) ||
      shipSpots(game, seat).length === 0);
  // A Siegpunktkarte arms a ship here as well, and that is worth a point when
  // the alternative is a fortress that can never fall: two warships are the
  // fewest that can ever beat the die, and once the stack is empty no knight
  // is ever coming.
  const spare =
    corsairs(game) &&
    !holds &&
    game.players[seat].deck.includes("siegpunkt") &&
    warshipsOf(game, seat) < STORM_GUNS - 1;
  // The Größte Rittermacht is two points, and two points win games: a knight is
  // worth playing the moment it would take the tile or keep it. Without this a
  // colour sat on nine knight cards at thirteen of fourteen points with nothing
  // left to build - the tile alone would have ended the game.
  // Counted over the whole hand, not the next card: the tile wants three, and a
  // rule that only plays the knight that takes it never plays the first two.
  const inHand = game.players[seat].deck.filter(
    (card) => card === "ritter",
  ).length;
  const reach = game.players[seat].knights + inHand;
  const most =
    game.army === null ? ARMY_MIN - 1 : game.players[game.army].knights;
  const army = holds && !raiding(game) && game.army !== seat && reach > most;
  return !game.playedDev &&
    (holds ? blocked || arming || army : spare && arming)
    ? [{ kind: "play", card: holds ? "ritter" : "siegpunkt" }]
    : [];
}

/** Taking or dropping an offer that has come back answered. */
function closeOffer(game: CatanGame): readonly CatanMove[] {
  const offer = game.offer;
  const takers =
    offer === null
      ? []
      : offer.answers.reduce<number[]>(
          (list, answer, at) => (answer === true ? [...list, at] : list),
          [],
        );
  return [
    ...takers.map((at) => ({ kind: "deal", seat: at }) as CatanMove),
    { kind: "withdraw" },
  ];
}

/**
 * Answering an event card.
 *
 * @remarks
 * Four shapes of answer, and each has an obvious best play: take what you are
 * short of, break the road you would miss least, draw from whoever is holding
 * most, and give away what you can spare to whoever is furthest behind.
 */
function answerCard(game: CatanGame, seat: number): readonly CatanMove[] {
  const kind = game.drawn?.kind;
  const ask = kind === undefined ? null : EVENT_ASK[kind];
  const moves: CatanMove[] = [];
  if (kind !== undefined && ask === "sort") {
    const hand = game.players[seat].hand;
    const wanted = fromOwnHand(kind)
      ? [...RESOURCES]
          .filter((sort) => hand[sort] > 0)
          .sort((a, b) => hand[b] - hand[a])
      : giftPicks(game, seat);
    wanted.forEach((sort) => moves.push({ kind: "event", sort }));
  } else if (ask === "road") {
    // The road furthest from the longest run: the last one built is the least
    // likely to be holding a route together.
    const mine = game.roads.reduce<number[]>(
      (list, owner, path) => (owner === seat ? [...list, path] : list),
      [],
    );
    [...mine].reverse().forEach((at) => moves.push({ kind: "event", at }));
  } else if (ask === "victim") {
    [...anybodyHolding(game, seat)]
      .sort((a, b) => game.players[b].cards - game.players[a].cards)
      .forEach((at) => moves.push({ kind: "event", seat: at }));
  } else if (ask === "gift") {
    const spare = sparest(game, seat);
    [...poorerThan(game, seat)]
      .sort((a, b) => openPoints(game, a) - openPoints(game, b))
      .forEach((at) => {
        moves.push({ kind: "event", sort: spare, seat: at });
        RESOURCES.forEach((sort) =>
          moves.push({ kind: "event", sort, seat: at }),
        );
      });
  }
  return moves;
}

/**
 * What the computer plays.
 *
 * @param game - the game as it stands
 * @param seat - the seat the computer is playing
 * @returns a move the referee will accept, or `null` if it is not this seat's move
 */
export function aiMove(game: CatanGame, seat: number): CatanMove | null {
  const wanted = candidates(game, seat);
  const legal = wanted.find((move) => applyMove(game, seat, move) !== null);
  return legal ?? fallback(game, seat);
}

/**
 * Something legal, when the ranking has come up empty.
 *
 * @remarks
 * This should not fire, and it is here because a computer that returns nothing
 * stops the game dead while a computer that plays a poor move does not. Any
 * move it finds here is worth a look at whatever ranked ahead of it.
 */
function fallback(game: CatanGame, seat: number): CatanMove | null {
  const board = islandOf(game.land.length);
  const everything: CatanMove[] = [
    { kind: "roll" },
    { kind: "endTurn" },
    { kind: "withdraw" },
    { kind: "answer", yes: false },
    ...RESOURCES.map((sort) => ({ kind: "choose", sort }) as CatanMove),
    ...board.hexes.map((hex) => ({ kind: "robber", at: hex.id }) as CatanMove),
    ...game.players.map(
      (unused, at) => ({ kind: "rob", seat: at }) as CatanMove,
    ),
    ...board.crossings.map((c) => ({ kind: "town", at: c.id }) as CatanMove),
    ...board.paths.map((p) => ({ kind: "road", at: p.id }) as CatanMove),
    { kind: "discard", ...discardChoice(game, seat) },
    { kind: "repair" },
    ...RESOURCES.map((sort) => ({ kind: "event", sort }) as CatanMove),
    ...board.paths.map((path) => ({ kind: "event", at: path.id }) as CatanMove),
    ...game.players.flatMap((unused, at) =>
      RESOURCES.map((sort) => ({ kind: "event", sort, seat: at }) as CatanMove),
    ),
    ...game.players.map(
      (unused, at) => ({ kind: "event", seat: at }) as CatanMove,
    ),
  ];
  return (
    everything.find((move) => applyMove(game, seat, move) !== null) ?? null
  );
}

/** How long a computer takes to answer somebody else's offer. */
const ANSWER_PAUSE_MS = 240;

/** How long a computer takes over anything not otherwise listed. */
const DEFAULT_PAUSE_MS = 350;

/**
 * How long the computer waits before its next move.
 *
 * @param game - the game as it stands
 * @returns a pause in milliseconds
 *
 * @remarks
 * A Catan turn is a dozen moves - roll, build, trade, build again, end - so the
 * pause is per move rather than per turn, and it has to be short enough that a
 * turn does not become a wait. The roll is the exception: it decides what
 * everybody at the table gets, so it is worth a beat to look at.
 */
export function botWaitMs(game: CatanGame): number {
  const pauses: Readonly<Record<string, number>> = {
    founding: 300,
    roll: 650,
    discard: 260,
    robber: 500,
    steal: 400,
    trade: 380,
    monopol: 400,
    erfindung: 300,
    gameOver: 0,
  };
  // Answering somebody else's offer is the one move that is not the active
  // player's, and a queue of them should go by quickly.
  const answering = game.offer !== null && game.offer.from !== game.active;
  return answering ? ANSWER_PAUSE_MS : (pauses[game.phase] ?? DEFAULT_PAUSE_MS);
}

/** What the computer would spare, for the panels to show. */
export { incomeOf, sparest, spotWorth };
