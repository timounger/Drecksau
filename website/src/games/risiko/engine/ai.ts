/**
 * The computer players.
 *
 * @module
 * @remarks
 * Risk is not a game a few lines of greed play well, because almost every
 * decision in it is about **where**, and the map is the only thing that says
 * which where is worth anything. So this bot reads the map rather than the
 * numbers: what it is worth holding, what is worth taking, and what is about to
 * be taken from it.
 *
 * Four ideas carry the whole thing:
 *
 * 1. **Continents are the income.** Three units a turn is nothing; Asien is
 *    seven and Australien is two for four territories behind one door. So the
 *    bot values a territory by how close it brings it to finishing a continent,
 *    and defends a finished one first.
 * 2. **Only the border matters.** Units on an interior territory are units
 *    doing nothing. Reinforcements go to the frontier and the one move of the
 *    turn drags the interior forward.
 * 3. **Attack from strength, not from anger.** An attack is worth making when
 *    the source can spare more than the target holds. Below that it is a way of
 *    losing an army one unit at a time, which is how humans lose this game too.
 * 4. **Take one territory, whatever else happens.** A turn with no conquest
 *    draws no card, and cards are the only reinforcement that scales. The bot
 *    will make a slightly bad attack rather than end a turn empty-handed.
 *
 * It sees only the board, which is public. It does **not** look at anybody's
 * hand - see {@link aiMove}.
 */
import { bestTrade } from "./cards";
import {
  CONTINENTS,
  continentOf,
  neighboursOf,
  territoriesIn,
  territoryOf,
} from "./map";
import { fortifyTargets, legalAttacks } from "./moves";
import {
  MAX_ATTACKERS,
  countHeld,
  heldBy,
  type RisikoGame,
  type RisikoMove,
} from "./state";

/** How much better than the defender a source has to be before attacking. */
const EDGE = 1;

/** Below this many cards, only a good trade is worth making. */
const HOARD_LIMIT = 5;

/** Units a trade has to be worth before cashing in early. */
const GOOD_TRADE = 10;

/** How much one point of continent progress is worth against one enemy unit. */
const CONTINENT_WEIGHT = 4;

/** Scales a continent's value per territory into the same range as unit counts. */
const DENSITY_SCALE = 10;

/** What a neighbour already held is worth when choosing where to start. */
const CHAIN_WEIGHT = 3;

/** What finishing a continent outright is worth on top of that. */
const FINISH_BONUS = 25;

/** How long the computer appears to think. */
const THINK_MS = 550;

/** Faster for the many small steps of a setup phase. */
const QUICK_MS = 180;

/**
 * The computer's next move for one seat.
 *
 * @param game - the game
 * @param seat - the seat the computer is playing
 * @returns the move, or null if there is nothing it may do
 * @remarks
 * One move per call, because a Risk turn is a dozen of them - place, place,
 * attack, attack, advance, fortify - and doing them one at a time is what lets
 * a person watch what the computer did instead of finding the board rearranged.
 */
export function aiMove(game: RisikoGame, seat: number): RisikoMove | null {
  let move: RisikoMove | null = null;
  switch (game.phase) {
    case "claim":
      move = pickClaim(game, seat);
      break;
    case "deploy":
      move = pickDeploy(game, seat);
      break;
    case "neutral":
      move = pickBoost(game, seat);
      break;
    case "reinforce":
      move = pickReinforce(game, seat);
      break;
    case "attack":
      move = game.advance === null ? pickAttack(game, seat) : pickAdvance(game);
      break;
    case "fortify":
      move = pickFortify(game, seat);
      break;
    default:
      move = null;
  }
  return move;
}

/**
 * How long to wait before the computer moves.
 *
 * @param game - the game
 * @returns a pause in milliseconds
 */
export function botWaitMs(game: RisikoGame): number {
  return game.phase === "claim" || game.phase === "deploy"
    ? QUICK_MS
    : THINK_MS;
}

/** Takes the free territory that does the most for a continent. */
function pickClaim(game: RisikoGame, seat: number): RisikoMove | null {
  const free = Object.keys(game.owner).filter((id) => game.owner[id] === -1);
  const best = [...free].sort(
    (left, right) =>
      claimWorth(game, seat, right) - claimWorth(game, seat, left),
  )[0];
  return best === undefined ? null : { kind: "claim", to: best };
}

/**
 * What an empty territory is worth to take.
 *
 * @remarks
 * Mostly: how far it gets a continent, weighted so that a small valuable one -
 * Australien, Südamerika - is worth more per territory than Asien. A neighbour
 * already held counts, because a chain is defensible and a scatter is not.
 */
function claimWorth(game: RisikoGame, seat: number, id: string): number {
  const place = territoryOf(id);
  const continent = place === null ? null : continentOf(place.continent);
  const size = place === null ? 1 : territoriesIn(place.continent).length;
  const density =
    continent === null ? 0 : (continent.bonus / size) * DENSITY_SCALE;
  const mine = neighboursOf(id).filter((n) => game.owner[n] === seat).length;
  const taken = territoriesIn(place?.continent ?? "asien").filter(
    (each) => game.owner[each] >= 0 && game.owner[each] !== seat,
  ).length;
  return density + mine * CHAIN_WEIGHT - taken;
}

/** Puts one starting unit where it is needed most. */
function pickDeploy(game: RisikoGame, seat: number): RisikoMove | null {
  const to = frontierChoice(game, seat);
  return to === null ? null : { kind: "place", to, count: 1 };
}

/**
 * Reinforces the neutral army that is most in the opponent's way.
 *
 * @remarks
 * The two-player game hands you three units a turn to spend on somebody else's
 * army, which reads like a chore and is really the sharpest tool in that
 * variant: a neutral army is a wall, and you get to choose whose door it stands
 * in front of. So the bot builds the wall facing the other player, on the
 * territories of that army which actually touch them.
 */
function pickBoost(game: RisikoGame, seat: number): RisikoMove | null {
  const foe = game.players.findIndex(
    (player, at) => at !== seat && !player.isNeutral && player.alive,
  );
  const armies = game.players
    .map((player, at) => (player.isNeutral && player.alive ? at : -1))
    .filter((at) => at >= 0)
    .filter((at) => game.boosting === null || at === game.boosting);
  const walls = armies
    .flatMap((army) => heldBy(game, army))
    .filter((id) => neighboursOf(id).some((n) => game.owner[n] === foe));
  const spots =
    walls.length > 0 ? walls : armies.flatMap((a) => heldBy(game, a));
  const to = [...spots].sort(
    (left, right) => game.units[left] - game.units[right],
  )[0];
  return to === undefined ? null : { kind: "boost", to, count: game.toPlace };
}

/** Trades if the price is right, then puts the units on the border. */
function pickReinforce(game: RisikoGame, seat: number): RisikoMove | null {
  const hand = game.players[seat].cards;
  const trade = bestTrade(hand);
  let move: RisikoMove | null = null;
  if (
    trade !== null &&
    (hand.length >= HOARD_LIMIT || trade.units >= GOOD_TRADE)
  ) {
    move = { kind: "trade", cards: trade.cards };
  } else {
    const to = frontierChoice(game, seat);
    move = to === null ? null : { kind: "place", to, count: game.toPlace };
  }
  return move;
}

/**
 * The territory of this seat's that most wants another unit.
 *
 * @remarks
 * Only frontier territories, and among those the one where the difference
 * between what stands there and what stands opposite is worst - with a heavy
 * thumb on the scale for a border of a continent the seat has finished, because
 * that is the income it would lose.
 */
function frontierChoice(game: RisikoGame, seat: number): string | null {
  const mine = heldBy(game, seat);
  const frontier = mine.filter((id) =>
    neighboursOf(id).some((n) => game.owner[n] !== seat),
  );
  const pool = frontier.length > 0 ? frontier : mine;
  return (
    [...pool].sort(
      (left, right) => needOf(game, seat, right) - needOf(game, seat, left),
    )[0] ?? null
  );
}

/** How badly one of this seat's territories wants another unit. */
function needOf(game: RisikoGame, seat: number, id: string): number {
  const against = neighboursOf(id)
    .filter((n) => game.owner[n] !== seat)
    .reduce((sum, n) => sum + game.units[n], 0);
  const place = territoryOf(id);
  const guarded =
    place !== null && holdsAll(game, seat, place.continent)
      ? (continentOf(place.continent)?.bonus ?? 0)
      : 0;
  return against - game.units[id] + guarded * 2;
}

/**
 * Picks an attack, or stops.
 *
 * @remarks
 * Two bars, not one. A **good** attack is one the source can afford: more
 * spare units than the target holds. Failing that, if nothing has been taken
 * this turn, the bot will take an **even** one, because a turn without a
 * conquest draws no card - and over a long game the cards are worth more than
 * one bad roll.
 */
function pickAttack(game: RisikoGame, seat: number): RisikoMove | null {
  const options = legalAttacks(game, seat).filter(
    (each) => game.units[each.from] - 1 >= game.units[each.to] + EDGE,
  );
  const desperate = game.conquered
    ? []
    : legalAttacks(game, seat).filter(
        (each) => game.units[each.from] - 1 >= game.units[each.to],
      );
  const pool = options.length > 0 ? options : desperate;
  const best = [...pool].sort(
    (left, right) =>
      attackWorth(game, seat, right) - attackWorth(game, seat, left),
  )[0];
  return best === undefined
    ? { kind: "done" }
    : {
        kind: "attack",
        from: best.from,
        to: best.to,
        units: Math.min(MAX_ATTACKERS, game.units[best.from] - 1),
      };
}

/** What taking one territory would be worth. */
function attackWorth(
  game: RisikoGame,
  seat: number,
  option: { readonly from: string; readonly to: string },
): number {
  const place = territoryOf(option.to);
  const continent = place === null ? null : continentOf(place.continent);
  const missing =
    place === null
      ? 0
      : territoriesIn(place.continent).filter((id) => game.owner[id] !== seat)
          .length;
  const progress =
    continent === null
      ? 0
      : (continent.bonus / Math.max(1, missing)) * CONTINENT_WEIGHT;
  const finishes = missing === 1 ? FINISH_BONUS : 0;
  const odds = game.units[option.from] - 1 - game.units[option.to];
  return progress + finishes + odds;
}

/**
 * How many units follow into a territory just taken.
 *
 * @remarks
 * Everything, unless the place they came from is itself on a border. A stack
 * left one square behind the front is a stack that is not defending anything.
 */
function pickAdvance(game: RisikoGame): RisikoMove | null {
  const pending = game.advance;
  let move: RisikoMove | null = null;
  if (pending !== null) {
    const seat = game.active;
    const exposed = neighboursOf(pending.from).some(
      (n) => game.owner[n] !== seat,
    );
    move = {
      kind: "advance",
      count: exposed ? Math.floor(pending.max / 2) : pending.max,
    };
  }
  return move;
}

/** Drags the biggest idle stack towards the nearest border. */
function pickFortify(game: RisikoGame, seat: number): RisikoMove | null {
  const mine = heldBy(game, seat);
  const idle = mine
    .filter(
      (id) =>
        game.units[id] > 1 &&
        neighboursOf(id).every((n) => game.owner[n] === seat),
    )
    .sort((left, right) => game.units[right] - game.units[left]);
  let move: RisikoMove | null = { kind: "endTurn" };
  for (const from of idle) {
    const to = [...fortifyTargets(game, seat, from)]
      .filter((id) => neighboursOf(id).some((n) => game.owner[n] !== seat))
      .sort(
        (left, right) => needOf(game, seat, right) - needOf(game, seat, left),
      )[0];
    if (to !== undefined && move.kind === "endTurn") {
      move = { kind: "fortify", from, to, count: game.units[from] - 1 };
    }
  }
  return move;
}

/** Whether one seat holds every territory of a continent. */
function holdsAll(game: RisikoGame, seat: number, continent: string): boolean {
  return territoriesIn(continent as never).every(
    (id) => game.owner[id] === seat,
  );
}

/**
 * How well one seat is doing, for the screen's standings.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns territories held, which is what both win conditions count
 */
export function standingOf(game: RisikoGame, seat: number): number {
  return countHeld(game, seat);
}

/** Every continent, for callers that want the list without a second import. */
export { CONTINENTS };
