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
  goodsSize,
  type Commodity,
  NO_GOODS,
  TRACKS,
  withGood,
  type Goods,
  type Track,
} from "./knights";
import { FISH_ACTIONS, FISH_COST, fishing } from "./fischer";
import { BRIDGE_PRICE, BUYS_PER_TURN, GOLD_PER_BUY, rivers } from "./fluesse";
import {
  EXTRA_STEPS,
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
  PORT_COST,
  SCOUT_COST,
  UNIT_COST,
  camping,
  campsFrom,
  chasers,
  pirateSeas,
  boatSpots,
  finding,
  portShore,
  landfall,
  lanesFrom,
  pointsAt,
  portsOf,
  seaLane as findLane,
} from "./entdecker";
import {
  SHIP_COST,
  landCrossing,
  newIsland,
  pirateSpots,
  sailing,
  seaPath,
  shipSpots,
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
  improvePrice,
  knightReady,
  knightsLeft,
  marchSpots,
  retreatSpots,
} from "./ritter";
import { SWAP_CARDS, canHandKnightIn, chipCost } from "./two";
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
function wants(game: CatanGame, seat: number): Hand {
  const hand = game.players[seat].hand;
  const goal = citySpots(game, seat).length > 0 ? CITY_COST : TOWN_COST;
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
 */
function offerMove(game: CatanGame, seat: number): readonly CatanMove[] {
  const hand = game.players[seat].hand;
  const need = wants(game, seat);
  const missing = RESOURCES.filter((sort) => need[sort] > 0);
  const spare = RESOURCES.filter((sort) => hand[sort] > need[sort] + 1);
  return game.offers === 0 && missing.length === 1 && spare.length > 0
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
    // A unit is only worth building while there is a camp left to storm.
    if (
      camping(game) &&
      player.unitsLeft > 0 &&
      covers(player.hand, UNIT_COST) &&
      Object.values(game.camps).some((camp) => !camp.taken)
    ) {
      portsOf(game, seat).forEach((at) => moves.push({ kind: "unit", at }));
    }
  }
  return moves.slice(0, PORT_WORTH * 2);
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
  if (boat === undefined || boat.owner !== seat) {
    // Nobody at the helm: take one.
    // Driving a pirate ship off is free and only ever helps, so it comes first.
    chasers(game, seat).forEach((which) =>
      moves.push({ kind: "hunt", boat: which }),
    );
    game.boats.forEach((each, index) => {
      if (
        each.owner === seat &&
        !each.done &&
        (lanesFrom(game, each).length > 0 || landfall(game, each.at).length > 0)
      ) {
        moves.push({ kind: "helm", boat: index });
      }
    });
  } else {
    const board = islandOf(game.land.length);
    // Units go ashore on a camp the moment they can: that is what they are for.
    if (boat.hold.includes("einheit")) {
      campsFrom(game, boat.at).forEach((at) =>
        moves.push({ kind: "storm", at }),
      );
    }
    // An explorer that can land does so: that is the point of carrying one.
    if (boat.hold.includes("entdecker")) {
      landfall(game, boat.at).forEach((at) =>
        moves.push({ kind: "landfall", at }),
      );
    }
    // Otherwise pick up an explorer that is waiting in a harbour.
    if (boat.hold.length === 0) {
      islandOf(game.land.length)
        .paths[boat.at].ends.filter((end) => (game.docks[end] ?? []).length > 0)
        .forEach((at) => moves.push({ kind: "load", at }));
    }
    // Three things a ship can be sailing towards, and it wants the nearest of
    // whichever applies: a camp with units aboard, its own harbour when there
    // is cargo waiting there, and otherwise the unknown.
    const waiting = portsOf(game, seat).filter(
      (at) => (game.docks[at] ?? []).length > 0,
    );
    const near = boat.hold.includes("einheit")
      ? campWanted(game)
      : boat.hold.length === 0 && waiting.length > 0
        ? dockWanted(game, waiting)
        : seaWanted(game);
    const worth = (at: number): number =>
      (boat.hold.includes("einheit")
        ? campsFrom(game, at).length * LANDFALL_WORTH
        : boat.hold.length === 0 && waiting.length > 0
          ? board.paths[at].ends.some((end) => waiting.includes(end))
            ? LANDFALL_WORTH
            : 0
          : pointsAt(game, at) === null
            ? 0
            : LANDFALL_WORTH) - (near.get(at) ?? SHIP_REACH);
    [...lanesFrom(game, boat)]
      .sort((one, other) => worth(other) - worth(one))
      .slice(0, 1)
      .forEach((at) => moves.push({ kind: "sail2", at }));
  }
  return moves;
}

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
  const best = new Map<number, number>();
  let edge: number[] = [];
  board.paths.forEach((path) => {
    if (
      findLane(game, path.id) &&
      path.ends.some((end) => ports.includes(end))
    ) {
      best.set(path.id, 0);
      edge.push(path.id);
    }
  });
  for (let step = 1; step <= SHIP_REACH && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const end of board.paths[at].ends) {
        for (const near of board.crossings[end].paths) {
          if (findLane(game, near) && !best.has(near)) {
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
 * How far every sea path is from one that could land units on a camp.
 *
 * @param game - the game
 * @returns steps over the water, for the paths within reach
 * @remarks
 * The same backwards walk as {@link seaWanted}, from the paths that already
 * touch a camp still standing. Without it a loaded ship wanders: every single
 * step looks the same, and a landing is a run of them.
 */
function campWanted(game: CatanGame): Map<number, number> {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>();
  let edge: number[] = [];
  board.paths.forEach((path) => {
    if (findLane(game, path.id) && campsFrom(game, path.id).length > 0) {
      best.set(path.id, 0);
      edge.push(path.id);
    }
  });
  for (let step = 1; step <= SHIP_REACH && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const end of board.paths[at].ends) {
        for (const near of board.crossings[end].paths) {
          if (findLane(game, near) && !best.has(near)) {
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
 * How far every sea path is from one that would turn a field over.
 *
 * @param game - the game
 * @returns steps over the water, for the paths within reach
 * @remarks
 * A breadth-first walk backwards from the paths that already point at something
 * face down, so one pass answers the question for every ship at once.
 */
function seaWanted(game: CatanGame): Map<number, number> {
  const board = islandOf(game.land.length);
  const best = new Map<number, number>();
  let edge: number[] = [];
  board.paths.forEach((path) => {
    if (findLane(game, path.id) && pointsAt(game, path.id) !== null) {
      best.set(path.id, 0);
      edge.push(path.id);
    }
  });
  for (let step = 1; step <= SHIP_REACH && edge.length > 0; step++) {
    const next: number[] = [];
    for (const at of edge) {
      for (const end of board.paths[at].ends) {
        for (const near of board.crossings[end].paths) {
          if (findLane(game, near) && !best.has(near)) {
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
  if (sailing(game) && covers(game.players[seat].hand, SHIP_COST)) {
    const board = islandOf(game.land.length);
    const wanted = shoreWanted(game, seat);
    const worth = (at: number): number =>
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
          Math.max(0, SHIP_REACH - (wanted.get(end) ?? SHIP_REACH))
        );
      }, 0);
    const ranked = [...shipSpots(game, seat)].sort(
      (one, other) => worth(other) - worth(one),
    );
    if (ranked.length > 0 && worth(ranked[0]) > 0) {
      moves.push({ kind: "ship", at: ranked[0] });
    }
  }
  return moves;
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
    if (held >= price && robbed) {
      moves.push({ kind: "chip", action: "robber" });
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
  return holds && !game.playedDev && blocked
    ? [{ kind: "play", card: "ritter" }]
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
