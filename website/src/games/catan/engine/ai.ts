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
  citySpots,
  discardCount,
  openRoads,
  neutralSpots,
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
import { isPointCard, type Progress } from "./progress";
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
  if (phase === "founding" && game.founding?.placing === "town") {
    bestFirst(game, townSpots(game, seat, true)).forEach((at) =>
      moves.push({ kind: "town", at }),
    );
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
  const held = [...new Set(game.players[seat].progress)];
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
      game.players[at].progress.some((each) => !isPointCard(each)),
    );
    const take =
      from === undefined
        ? undefined
        : game.players[from].progress.find((each) => !isPointCard(each));
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
    const robbed = islandOf(game.land.length).hexes[game.robber].corners.some(
      (corner) => game.towns[corner]?.owner === seat,
    );
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
  const blocked = islandOf(game.land.length).hexes[game.robber].corners.some(
    (at: number) => game.towns[at]?.owner === seat,
  );
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
