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
import { shuffle } from "./random";
import { awardHarbourTile, robbable, robberSpots } from "./variants";
import {
  ARMY_MIN,
  actingSeat,
  CITY_COST,
  DEV_COST,
  HAND_LIMIT,
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
  pointsOf,
  sharesTurns,
  spread,
  withCard,
  type CatanGame,
  type CatanMove,
  type CatanPlayer,
  type DevKind,
  type Hand,
  type Resource,
} from "./state";

/** How many sides each of the two dice has. */
const DIE_SIDES = 6;

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
    players: game.players.map((player) => ({ ...player, cards: handSize(player.hand) })),
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
    !game.playedDev && game.players[seat].deck.some((card) => card !== "siegpunkt");
  const idle =
    game.offer === null && game.freeRoads === 0 && handSize(game.players[seat].hand) === 0;
  let only: CatanMove | null = null;
  if (mine && !holdsCard && game.phase === "roll") {
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
function withPlayer(game: CatanGame, seat: number, player: CatanPlayer): CatanGame {
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
  const board = islandOf(game.land.length);
  // "Erst nach der Reparatur darfst du wieder neue Straßen bauen."
  const able = game.players[seat].damaged === null;
  const free = able && game.roads[at] === null && game.players[seat].roads > 0;
  const reaches = board.paths[at].ends.some((end) => {
    const town = game.towns[end];
    const blocked = town !== null && town.owner !== seat;
    const own = town !== null && town.owner === seat;
    const road = board.crossings[end].paths.some(
      (path) => path !== at && game.roads[path] === seat && path !== game.players[seat].damaged,
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
  const apart = board.crossings[at].next.every((next) => game.towns[next] === null);
  // "An einer beschädigten Straße darf keine Siedlung gebaut werden": a road
  // lying on its side is no longer the connection a settlement needs.
  const reached =
    founding ||
    board.crossings[at].paths.some(
      (path) => game.roads[path] === seat && path !== game.players[seat].damaged,
    );
  return free && apart && reached;
}

/** Whether a settlement may grow into a city. */
export function canCity(game: CatanGame, seat: number, at: number): boolean {
  const town = game.towns[at];
  return town !== null && town.owner === seat && !town.city && game.players[seat].cities > 0;
}

/** Every path this seat could put a road on. */
export function roadSpots(game: CatanGame, seat: number): readonly number[] {
  return islandOf(game.land.length)
    .paths.filter((path) => canRoad(game, seat, path.id))
    .map((path) => path.id);
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
export function tradeRate(game: CatanGame, seat: number, sort: Resource): number {
  const board = islandOf(game.land.length);
  return game.harbours.reduce((rate, harbour) => {
    const mine = board.paths[harbour.path].ends.some((end) => game.towns[end]?.owner === seat);
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
export function ownHarbours(game: CatanGame, seat: number): readonly (Resource | null)[] {
  const board = islandOf(game.land.length);
  return game.harbours
    .filter((harbour) =>
      board.paths[harbour.path].ends.some((end) => game.towns[end]?.owner === seat),
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
  const mine = game.roads.reduce<number[]>(
    (list, owner, path) => (owner === seat ? [...list, path] : list),
    [],
  );
  const used = new Set<number>();
  let best = 0;
  const walk = (at: number, len: number): void => {
    best = Math.max(best, len);
    const town = game.towns[at];
    const sealed = town !== null && town.owner !== seat;
    if (!sealed) {
      board.crossings[at].paths.forEach((path) => {
        if (game.roads[path] === seat && !used.has(path)) {
          used.add(path);
          const [a, b] = board.paths[path].ends;
          walk(a === at ? b : a, len + 1);
          used.delete(path);
        }
      });
    }
  };
  mine.forEach((path) => {
    board.paths[path].ends.forEach((end) => walk(end, 0));
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
  const holder = game.longest !== null && lengths[game.longest] >= ROUTE_MIN ? game.longest : null;
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
  return awardHarbourTile({
    ...game,
    longest: route,
    longestLen: route === null ? 0 : lengths[route],
    army: risen ?? game.army,
  });
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
function checkWinner(game: CatanGame): CatanGame {
  const seat = actingSeat(game);
  const done = game.phase !== "founding" && pointsOf(game, seat) >= game.target;
  return done
    ? note(
        { ...game, phase: "gameOver", winner: seat, offer: null },
        `${nameOf(game, seat)}: gewinnt mit ${pointsOf(game, seat)} Siegpunkten!`,
      )
    : game;
}

/** What one landscape pays a seat for one building. */
function payout(game: CatanGame, hex: number): readonly { seat: number; sort: Resource; count: number }[] {
  const sort = YIELD[game.land[hex]];
  const takings: { seat: number; sort: Resource; count: number }[] = [];
  if (sort !== null && hex !== game.robber) {
    islandOf(game.land.length).hexes[hex].corners.forEach((corner) => {
      const town = game.towns[corner];
      if (town !== null) {
        takings.push({ seat: town.owner, sort, count: town.city ? CITY_YIELD : 1 });
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
  islandOf(game.land.length).hexes.forEach((hex) => {
    if (game.chips[hex.id] === rolled) {
      payout(game, hex.id).forEach((take) => {
        hands[take.seat] = withCard(hands[take.seat], take.sort, plague ? 1 : take.count);
      });
    }
  });
  return {
    ...game,
    players: game.players.map((player, seat) => ({ ...player, hand: hands[seat] })),
  };
}

/** Where a turn goes once the robber has finished its business. */
function afterRobber(game: CatanGame): CatanGame {
  return { ...game, phase: game.dice === null ? "roll" : "trade", targets: [] };
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
  const targets = islandOf(game.land.length).hexes[at].corners.reduce<number[]>((list, corner) => {
    const town = moved.towns[corner];
    const worth =
      town !== null &&
      town.owner !== seat &&
      robbable(moved, town.owner) &&
      handSize(moved.players[town.owner].hand) > 0;
    return worth && !list.includes(town.owner) ? [...list, town.owner] : list;
  }, []);
  let next = moved;
  if (targets.length === 0) {
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
  const cards = spread(game.players[victim].hand);
  const random = createRandom(game.seed);
  const taken = cards[randomInt(random, cards.length)];
  const moved = withHand(
    withHand(game, victim, withCard(game.players[victim].hand, taken, -1)),
    thief,
    withCard(game.players[thief].hand, taken),
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
    at === acting ? { ...player, deck: [...player.deck, ...player.fresh], fresh: [] } : player,
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
        active: (game.active + 1) % game.players.length,
        stone: 1,
        phase: "roll",
        dice: null,
        turn: game.turn + 1,
      };
}

/** Rolls both dice. */
function throwDice(random: Random): readonly [number, number] {
  return [randomInt(random, DIE_SIDES) + 1, randomInt(random, DIE_SIDES) + 1];
}

/** How many cards a seat has to lay down after a seven. */
export function discardCount(game: CatanGame, seat: number): number {
  const held = handSize(game.players[seat].hand);
  return held > HAND_LIMIT ? Math.floor(held / 2) : 0;
}

/** Puts a seven into motion: hands over the limit, then the robber. */
function seven(game: CatanGame): CatanGame {
  const owing = game.players.reduce<number[]>(
    (list, unused, seat) => (discardCount(game, seat) > 0 ? [...list, seat] : list),
    [],
  );
  return owing.length === 0
    ? { ...game, phase: "robber" }
    : { ...game, phase: "discard", owing };
}

/** Rolls the dice and pays out, or wakes the robber. */
function doRoll(game: CatanGame): CatanGame {
  let next: CatanGame;
  if (playing(game, "ereignisse")) {
    next = drawEvent(game);
  } else {
    const random = createRandom(game.seed);
    const dice = throwDice(random);
    const rolled = dice[0] + dice[1];
    const thrown = note(
      { ...game, seed: random.state(), dice },
      `${nameOf(game, game.active)}: würfelt ${rolled}.`,
    );
    next =
      rolled === ROBBER_ROLL ? seven(thrown) : { ...produce(thrown, rolled), phase: "trade" };
  }
  return next;
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
  return card === undefined ? next : startEvent({ ...next, events: deck.slice(1) }, card);
}

/** What an event does before anybody is asked anything. */
function openEvent(game: CatanGame, kind: EventKind): CatanGame {
  // "Stellt den Räuber sofort zurück auf die Wüste. Es wird bei niemandem
  // eine Handkarte gezogen."
  return kind === "rueckzug" ? { ...game, robber: game.land.indexOf("wueste") } : game;
}

/** Lays an event card out and works out who has to answer it. */
function startEvent(game: CatanGame, card: EventCard): CatanGame {
  const shown = note(
    openEvent({ ...game, drawn: card }, card.kind),
    `${nameOf(game, game.active)}: ${EVENT_NAMES[card.kind]}${
      card.number === null ? "" : ` (${card.number})`
    }.`,
  );
  const asks = eventAsks(shown, card.kind);
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
      { ...game, players: game.players.map((player, at) => ({ ...player, hand: hands[at] })) },
      "Gute Nachbarschaft: alle geben 1 Karte nach links.",
    );
  }
  return next;
}

/** Answers the card, for one seat. */
function doEvent(game: CatanGame, seat: number, move: CatanMove): CatanGame | null {
  const kind = game.drawn?.kind;
  const ask = kind === undefined ? null : EVENT_ASK[kind];
  let next: CatanGame | null = null;
  if (move.kind === "event" && kind !== undefined && ask !== null) {
    const answers: Readonly<Record<string, () => CatanGame | null>> = {
      sort: () => takeSort(game, seat, kind, move.sort),
      road: () => breakRoad(game, seat, move.at),
      victim: () => (move.seat === undefined ? null : drawFrom(game, seat, move.seat)),
      gift: () => giveAway(game, seat, move.sort, move.seat),
    };
    const answered = answers[ask]();
    next = answered === null ? null : stepOn(answered, seat);
  }
  return next;
}

/** Drops a seat off the queue, and closes the card when the last one is in. */
function stepOn(game: CatanGame, seat: number): CatanGame {
  const rest = game.owed.filter((at) => at !== seat);
  return rest.length === 0 ? closeEvent({ ...game, owed: [] }) : { ...game, owed: rest };
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
      ? { ...game, given: game.given.map((old, at) => (at === seat ? sort : old)) }
      : note(
          withHand(game, seat, withCard(game.players[seat].hand, sort)),
          `${nameOf(game, seat)}: nimmt 1 ${SORT_NAMES[sort]} aus dem Vorrat.`,
        );
  }
  return next;
}

/** Turning one of your own roads sideways. */
function breakRoad(game: CatanGame, seat: number, at: number | undefined): CatanGame | null {
  const mine = at !== undefined && game.roads[at] === seat;
  return mine
    ? note(
        withPlayer(game, seat, { ...game.players[seat], damaged: at }),
        `${nameOf(game, seat)}: eine Straße muss repariert werden.`,
      )
    : null;
}

/** Drawing one card at random from somebody at the table. */
function drawFrom(game: CatanGame, seat: number, victim: number): CatanGame | null {
  return anybodyHolding(game, seat).includes(victim) ? rob(game, seat, victim) : null;
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
        spend(withPlayer(game, seat, { ...player, damaged: null }), seat, REPAIR_COST),
        `${nameOf(game, seat)}: repariert eine Straße.`,
      )
    : null;
}

/** Lays cards down after a seven, and moves the queue on. */
function doDiscard(game: CatanGame, seat: number, cards: Hand): CatanGame | null {
  const owed = discardCount(game, seat);
  const hand = game.players[seat].hand;
  const ok = handSize(cards) === owed && covers(hand, cards);
  const rest = game.owing.filter((at) => at !== seat);
  return ok
    ? note(
        {
          ...withHand(game, seat, minus(hand, cards)),
          owing: rest,
          phase: rest.length === 0 ? "robber" : "discard",
        },
        `${nameOf(game, seat)}: legt ${owed} Karten ab.`,
      )
    : null;
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
      ? islandOf(game.land.length).paths[at].ends.includes(game.founding.lastTown) &&
        game.roads[at] === null
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
    const charged = free ? built : spend(built, seat, ROAD_COST);
    next = checkWinner(awardTiles(note(charged, `${nameOf(game, seat)}: baut eine Straße.`)));
  }
  return next;
}

/** Builds a settlement, in the founding phase or the building phase. */
function doTown(game: CatanGame, seat: number, at: number): CatanGame | null {
  const founding = game.phase === "founding";
  const allowed =
    canTown(game, seat, at, founding) &&
    (founding ? game.founding?.placing === "town" : covers(game.players[seat].hand, TOWN_COST));
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
    const charged = founding ? built : spend(built, seat, TOWN_COST);
    next = checkWinner(awardTiles(note(charged, `${nameOf(game, seat)}: baut eine Siedlung.`)));
  }
  return next;
}

/** Grows a settlement into a city. */
function doCity(game: CatanGame, seat: number, at: number): CatanGame | null {
  const allowed = canCity(game, seat, at) && covers(game.players[seat].hand, CITY_COST);
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
      { ...player, settlements: player.settlements + 1, cities: player.cities - 1 },
    );
    // Through awardTiles, which a city needs as much as a road does: it cannot
    // change the longest route, but it doubles a harbour point, and *Die Häfen
    // von Catan* hands out a tile for those.
    next = checkWinner(
      awardTiles(note(spend(built, seat, CITY_COST), `${nameOf(game, seat)}: baut eine Stadt.`)),
    );
  }
  return next;
}

/** Buys the top development card. */
function doBuy(game: CatanGame, seat: number): CatanGame | null {
  const allowed = game.stack.length > 0 && covers(game.players[seat].hand, DEV_COST);
  let next: CatanGame | null = null;
  if (allowed) {
    const card = game.stack[0];
    const player = game.players[seat];
    const bought = withPlayer({ ...game, stack: game.stack.slice(1) }, seat, {
      ...player,
      fresh: [...player.fresh, card],
    });
    next = checkWinner(
      note(spend(bought, seat, DEV_COST), `${nameOf(game, seat)}: kauft eine Entwicklungskarte.`),
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
 */
function doPlay(game: CatanGame, seat: number, card: DevKind): CatanGame | null {
  const player = game.players[seat];
  const holds = player.deck.includes(card);
  const allowed = holds && !game.playedDev && card !== "siegpunkt";
  let next: CatanGame | null = null;
  if (allowed) {
    const at = player.deck.indexOf(card);
    const played = note(
      withPlayer({ ...game, playedDev: true }, seat, {
        ...player,
        deck: player.deck.filter((unused, index) => index !== at),
        knights: player.knights + (card === "ritter" ? 1 : 0),
      }),
      `${nameOf(game, seat)}: spielt ${CARD_NAMES[card]}.`,
    );
    next = checkWinner(awardTiles(startCard(played, card)));
  }
  return next;
}

/** What each development card sets in motion. */
function startCard(game: CatanGame, card: DevKind): CatanGame {
  const effects: Readonly<Record<DevKind, () => CatanGame>> = {
    ritter: () => ({ ...game, phase: "robber" }),
    strassenbau: () => ({ ...game, freeRoads: FREE_ROADS }),
    monopol: () => ({ ...game, phase: "monopol" }),
    erfindung: () => ({ ...game, phase: "erfindung", gifts: GIFTS }),
    siegpunkt: () => game,
  };
  return effects[card]();
}

/** Answers a Monopol or an Erfindung card. */
function doChoose(game: CatanGame, seat: number, sort: Resource): CatanGame | null {
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
    next = note(next, `${nameOf(game, seat)}: nimmt 1 ${SORT_NAMES[sort]} aus dem Vorrat.`);
  }
  return next;
}

/** Trades with the bank or a harbour. */
function doBank(game: CatanGame, seat: number, give: Resource, want: Resource): CatanGame | null {
  const rate = tradeRate(game, seat, give);
  const allowed = give !== want && game.players[seat].hand[give] >= rate;
  return allowed
    ? note(
        withHand(game, seat, withCard(withCard(game.players[seat].hand, give, -rate), want)),
        `${nameOf(game, seat)}: tauscht ${rate} ${SORT_NAMES[give]} gegen 1 ${SORT_NAMES[want]}.`,
      )
    : null;
}

/** Puts an offer on the table. */
function doOffer(game: CatanGame, seat: number, give: Hand, want: Hand): CatanGame | null {
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
            answers: game.players.map((unused, at) => (at === seat ? false : null)),
          },
        },
        `${nameOf(game, seat)}: bietet ${spellOut(give)} für ${spellOut(want)}.`,
      )
    : null;
}

/** Says yes or no to an offer. */
function doAnswer(game: CatanGame, seat: number, yes: boolean): CatanGame | null {
  const offer = game.offer;
  let next: CatanGame | null = null;
  if (offer !== null && offer.answers[seat] === null) {
    const able = yes && covers(game.players[seat].hand, offer.want);
    const answers = offer.answers.map((old, at) => (at === seat ? able : old));
    const anyone = answers.some((answer) => answer === true);
    const open = answers.some((answer) => answer === null);
    next =
      !open && !anyone
        ? note({ ...game, offer: null }, `${nameOf(game, offer.from)}: findet keinen Abnehmer.`)
        : { ...game, offer: { ...offer, answers } };
  }
  return next;
}

/** Closes an offer with one of the players who accepted. */
function doDeal(game: CatanGame, seat: number, other: number): CatanGame | null {
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
    const theirs = plus(minus(game.players[other].hand, offer.want), offer.give);
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
      ? { ...game, founding: null, phase: "roll", active: founding.order[0], turn: 1 }
      : {
          ...game,
          founding: { ...founding, step, placing: "town", lastTown: null },
          active: founding.order[step],
        };
  }
  return next;
}

/** The first income, taken for the second settlement only. */
function firstIncome(game: CatanGame, seat: number, at: number): CatanGame {
  const gained = islandOf(game.land.length).crossings[at].hexes.reduce((hand, hex) => {
    const sort = YIELD[game.land[hex]];
    return sort === null ? hand : withCard(hand, sort);
  }, game.players[seat].hand);
  return note(
    withHand(game, seat, gained),
    `${nameOf(game, seat)}: erhält die ersten Rohstoffe.`,
  );
}

/** Places one of the two founding settlements and its road. */
function doFounding(game: CatanGame, seat: number, move: CatanMove): CatanGame | null {
  const founding = game.founding;
  let next: CatanGame | null = null;
  if (founding !== null && move.kind === "town" && founding.placing === "town") {
    const built = doTown(game, seat, move.at);
    const second = founding.step >= game.players.length;
    next =
      built === null
        ? null
        : {
            ...(second ? firstIncome(built, seat, move.at) : built),
            founding: { ...founding, placing: "road", lastTown: move.at },
          };
  } else if (founding !== null && move.kind === "road" && founding.placing === "road") {
    const built = doRoad(game, seat, move.at);
    next = built === null ? null : foundingOn(built);
  }
  return next;
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
    next = move.kind === "discard" ? doDiscard(game, seat, move.cards) : null;
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
      game.phase === "robber" &&
      move.kind === "robber" &&
      robberSpots(game, game.robber).includes(move.at)
        ? placeRobber(game, seat, move.at)
        : null,
    rob: () =>
      game.phase === "steal" && move.kind === "rob" && game.targets.includes(move.seat)
        ? afterRobber(rob(game, seat, move.seat))
        : null,
    road: () => (building && move.kind === "road" ? doRoad(game, seat, move.at) : null),
    town: () => (rolled && move.kind === "town" ? doTown(game, seat, move.at) : null),
    city: () => (rolled && move.kind === "city" ? doCity(game, seat, move.at) : null),
    buy: () => (rolled ? doBuy(game, seat) : null),
    play: () =>
      (game.phase === "roll" || rolled) && move.kind === "play"
        ? doPlay(game, seat, move.card)
        : null,
    choose: () => (move.kind === "choose" ? doChoose(game, seat, move.sort) : null),
    bank: () => (rolled && move.kind === "bank" ? doBank(game, seat, move.give, move.want) : null),
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
    endTurn: () => (rolled ? nextTurn(game) : null),
  };
  return handlers[move.kind]?.() ?? null;
}
