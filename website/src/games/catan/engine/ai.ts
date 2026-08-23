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
  roadSpots,
  townSpots,
  tradeRate,
} from "./moves";
import {
  EVENT_ASK,
  anybodyHolding,
  fromOwnHand,
  poorerThan,
} from "./events";
import { robberSpots as legalRobberSpots } from "./variants";
import {
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
  plus,
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
  return islandOf(game.land.length).crossings[at].hexes.reduce((hand: Hand, hex: number) => {
    const sort = YIELD[game.land[hex]];
    return sort === null ? hand : withCard(hand, sort, dots(game.chips[hex]));
  }, NO_CARDS);
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
  const raw = RESOURCES.reduce((sum, sort) => sum + income[sort] * BASE_WORTH[sort], 0);
  const variety = kinds <= 1 ? REPEAT_WORTH : 1 - (RESOURCES.length - kinds) * VARIETY_STEP;
  const board = islandOf(game.land.length);
  const docks = game.harbours.some((harbour) => board.paths[harbour.path].ends.includes(at))
    ? HARBOUR_WORTH
    : 0;
  return raw * variety + docks;
}

/** Sorts a list of spots, best first. */
function bestFirst(game: CatanGame, spots: readonly number[]): readonly number[] {
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
function foundingRoads(game: CatanGame, seat: number, from: number): readonly number[] {
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
    const own = hex.corners.some((at: number) => game.towns[at]?.owner === seat);
    const hurt = hex.corners.reduce((sum: number, at: number) => {
      const town = game.towns[at];
      const worth = town === null || town.owner === seat ? 0 : dots(game.chips[hex.id]);
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
function discardChoice(game: CatanGame, seat: number): Hand {
  const owed = discardCount(game, seat);
  const need = wants(game, seat);
  let left = game.players[seat].hand;
  let laid = NO_CARDS;
  for (let i = 0; i < owed; i += 1) {
    const worst = [...RESOURCES]
      .filter((sort) => left[sort] > 0)
      .sort((a, b) => left[b] - need[b] * MOST_DOTS - (left[a] - need[a] * MOST_DOTS))[0];
    left = withCard(left, worst, -1);
    laid = withCard(laid, worst);
  }
  return laid;
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
        (sum, sort) => sum + Math.min(cards[sort], need[sort]) * MOST_DOTS + cards[sort],
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
    bestFirst(game, citySpots(game, seat)).forEach((at) => moves.push({ kind: "city", at }));
  }
  if (covers(hand, TOWN_COST)) {
    bestFirst(game, townSpots(game, seat)).forEach((at) => moves.push({ kind: "town", at }));
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
    bestFirst(game, townSpots(game, seat, true)).forEach((at) => moves.push({ kind: "town", at }));
  } else if (phase === "founding") {
    foundingRoads(game, seat, game.founding?.lastTown ?? 0).forEach((at) =>
      moves.push({ kind: "road", at }),
    );
  } else if (phase === "discard") {
    moves.push({ kind: "discard", cards: discardChoice(game, seat) });
  } else if (phase === "robber") {
    robberSpots(game, seat).forEach((at) => moves.push({ kind: "robber", at }));
  } else if (phase === "steal") {
    [...game.targets]
      .sort((a, b) => handSize(game.players[b].hand) - handSize(game.players[a].hand))
      .forEach((at) => moves.push({ kind: "rob", seat: at }));
  } else if (phase === "event") {
    answerCard(game, seat).forEach((move) => moves.push(move));
  } else if (phase === "monopol") {
    monopolPicks(game, seat).forEach((sort) => moves.push({ kind: "choose", sort }));
  } else if (phase === "erfindung") {
    giftPicks(game, seat).forEach((sort) => moves.push({ kind: "choose", sort }));
  } else if (game.offer !== null && game.offer.from !== seat) {
    moves.push({ kind: "answer", yes: likesOffer(game, seat) });
  } else if (game.offer !== null) {
    closeOffer(game).forEach((move) => moves.push(move));
  } else if (phase === "roll") {
    knightFirst(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "roll" });
  } else if (phase === "trade") {
    // A road on its side blocks every other road, so it is worth more than
    // anything else that costs the same two cards.
    if (game.players[seat].damaged !== null) {
      moves.push({ kind: "repair" });
    }
    freeRoadMoves(game, seat).forEach((move) => moves.push(move));
    playableCards(game, seat).forEach((move) => moves.push(move));
    buildingMoves(game, seat).forEach((move) => moves.push(move));
    bankTrades(game, seat).forEach((move) => moves.push(move));
    offerMove(game, seat).forEach((move) => moves.push(move));
    moves.push({ kind: "endTurn" });
  }
  return moves;
}

/** Which sort a Monopol card should name. */
function monopolPicks(game: CatanGame, seat: number): readonly Resource[] {
  return [...RESOURCES].sort((a, b) => {
    const held = (sort: Resource): number =>
      game.players.reduce((sum, player, at) => (at === seat ? sum : sum + player.hand[sort]), 0);
    return held(b) - held(a);
  });
}

/** Which sorts an Erfindung card should fetch. */
function giftPicks(game: CatanGame, seat: number): readonly Resource[] {
  const need = wants(game, seat);
  return [...RESOURCES].sort((a, b) => need[b] - need[a] || BASE_WORTH[b] - BASE_WORTH[a]);
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
    if (deck.includes("erfindung") && !covers(hand, TOWN_COST) && !covers(hand, CITY_COST)) {
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
  return holds && !game.playedDev && blocked ? [{ kind: "play", card: "ritter" }] : [];
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
  return [...takers.map((at) => ({ kind: "deal", seat: at }) as CatanMove), { kind: "withdraw" }];
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
      ? [...RESOURCES].filter((sort) => hand[sort] > 0).sort((a, b) => hand[b] - hand[a])
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
        RESOURCES.forEach((sort) => moves.push({ kind: "event", sort, seat: at }));
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
    ...game.players.map((unused, at) => ({ kind: "rob", seat: at }) as CatanMove),
    ...board.crossings.map((c) => ({ kind: "town", at: c.id }) as CatanMove),
    ...board.paths.map((p) => ({ kind: "road", at: p.id }) as CatanMove),
    { kind: "discard", cards: discardChoice(game, seat) },
    { kind: "repair" },
    ...RESOURCES.map((sort) => ({ kind: "event", sort }) as CatanMove),
    ...board.paths.map((path) => ({ kind: "event", at: path.id }) as CatanMove),
    ...game.players.flatMap((unused, at) =>
      RESOURCES.map((sort) => ({ kind: "event", sort, seat: at }) as CatanMove),
    ),
    ...game.players.map((unused, at) => ({ kind: "event", seat: at }) as CatanMove),
  ];
  return everything.find((move) => applyMove(game, seat, move) !== null) ?? null;
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
