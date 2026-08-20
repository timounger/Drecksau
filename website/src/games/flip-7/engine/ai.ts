/**
 * The computer opponent.
 *
 * @module
 * @remarks
 * Flip 7 asks one question over and over - **another card, or stop?** - and the
 * good news is that it has an arithmetic answer. The deck is public knowledge:
 * twelve twelves, one one, and so on. Every card anybody has taken is lying face
 * up. So the chance of busting is a count, not a guess, and the machine does the
 * count a careful player would do.
 *
 * It never looks at the deck. It looks at what is on the table and at what a
 * full deck contains, and subtracts - which is exactly what a person can do, and
 * the reason this opponent is fair rather than merely hard.
 */
import { FLIP_SEVEN, HIGHEST, buildDeck, type Card } from "./cards";
import { targetsFor } from "./moves";
import { createRandom, randomInt } from "./random";
import {
  activeSeats,
  cardCount,
  hasNumber,
  roundValue,
  type Flip7Game,
  type Flip7Move,
  type Player,
} from "./state";

/** Above this chance of busting it stops, if it is allowed to. */
const SCARY = 0.36;

/** How close to the bonus it has to be before it starts taking real risks. */
const NEARLY_SEVEN = FLIP_SEVEN - 2;

/** The bust chance it will still accept when the bonus is within reach. */
const GREEDY = 0.55;

/** Points behind the leader at which it stops playing safe. */
const DESPERATE = 40;

/** The shortest the computer ever pauses before acting, in milliseconds. */
const MIN_WAIT_MS = 650;

/** How much longer it may take, so two moves never look mechanical. */
const WAIT_SPREAD_MS = 220;

/** How many pauses it picks between. */
const WAIT_STEPS = 4;

/**
 * The move the computer makes for the seat it is asked about.
 *
 * @param game - the current game
 * @param seat - the seat to play
 * @returns a move, or null when there is nothing for that seat to do
 */
export function aiMove(game: Flip7Game, seat: number): Flip7Move | null {
  let move: Flip7Move | null = null;
  if (game.pending !== null && game.pending.by === seat) {
    move = point(game, seat);
  } else if (game.forced !== null && game.forced.at === seat) {
    // There is no decision here, only nerve.
    move = { kind: "flip" };
  } else if (game.stage === "roundEnd") {
    move = { kind: "next" };
  } else if (game.stage === "turn" && game.active === seat) {
    move = decide(game, seat);
  }
  return move;
}

/**
 * Another card, or stop?
 *
 * @remarks
 * Three things push the answer around. The plain one is the odds. The second is
 * the bonus: at five numbers the fifteen points and the round-ending are worth a
 * much worse bet than usual. The third is the score - a player forty points
 * behind the leader cannot afford to bank eight points and call it a round.
 */
function decide(game: Flip7Game, seat: number): Flip7Move {
  const player = game.players[seat];
  const risk = bustChance(game, player);
  const nearly = player.numbers.length >= NEARLY_SEVEN;
  const behind = leaderScore(game) - player.score >= DESPERATE;
  const limit = nearly || behind ? GREEDY : SCARY;
  // With nothing in front of you there is nothing to bank, so the rules do not
  // even offer the choice.
  return cardCount(player) === 0 || risk < limit
    ? { kind: "hit" }
    : { kind: "stay" };
}

/**
 * How likely the next card is one this player already has.
 *
 * @param game - the current game
 * @param player - the player about to decide
 * @returns a chance between 0 and 1
 * @remarks
 * Counted the way a person at the table counts: a full deck holds as many copies
 * of a number as the number is worth, so subtract the ones already face up
 * somewhere and you know what is left. The discard pile is counted too - those
 * cards are gone from this deck until it is reshuffled, and everybody watched
 * them go.
 */
function bustChance(game: Flip7Game, player: Player): number {
  const seen = seenCounts(game);
  const total = buildDeck().length;
  let unseen = total;
  for (const count of seen.values()) {
    unseen -= count;
  }
  let deadly = 0;
  for (const card of player.numbers) {
    deadly += Math.max(0, copiesOf(card.value) - (seen.get(card.value) ?? 0));
  }
  return unseen <= 0 ? 0 : Math.min(1, deadly / unseen);
}

/** How many copies of a number a full deck holds. */
function copiesOf(value: number): number {
  return value === 0 ? 1 : value;
}

/**
 * How many of each number are already out of the deck, as far as anyone can see.
 *
 * @remarks
 * Everything in front of a player is face up, whether that player is still in
 * the round or not, and so is the discard pile. Nothing here reads
 * {@link Flip7Game.deck}.
 */
function seenCounts(game: Flip7Game): Map<number, number> {
  const seen = new Map<number, number>();
  const count = (card: Card) => {
    if (card.kind === "number") {
      seen.set(card.value, (seen.get(card.value) ?? 0) + 1);
    }
  };
  for (const player of game.players) {
    player.numbers.forEach(count);
  }
  game.discard.forEach(count);
  return seen;
}

/** The best total anybody has, for working out how far behind it is. */
function leaderScore(game: Flip7Game): number {
  return game.players.reduce((best, player) => Math.max(best, player.score), 0);
}

/**
 * Who to point an action card at.
 *
 * @remarks
 * An Einfrieren goes to whoever has the most to lose - stopping the leader is
 * the whole point of the card. A Dreimal goes to whoever is likeliest to fall
 * over: the player with the most numbers already down. And a Zweite Chance,
 * which is being handed on rather than played, goes to whoever needs it least.
 */
function point(game: Flip7Game, seat: number): Flip7Move | null {
  const pending = game.pending;
  const targets = targetsFor(game);
  let move: Flip7Move | null = null;
  if (pending !== null && targets.length > 0) {
    const others = targets.filter((at) => at !== seat);
    const pool = others.length > 0 ? others : targets;
    const worth = (at: number) => value(game, at, pending.card, seat);
    const best = pool.reduce((pick, at) =>
      worth(at) > worth(pick) ? at : pick,
    );
    move = { kind: "target", at: best };
  }
  return move;
}

/** How badly this seat wants that card to land on that player. */
function value(game: Flip7Game, at: number, card: Card, seat: number): number {
  const victim = game.players[at];
  let score: number;
  if (card.kind === "freeze") {
    // Never on yourself while there is anybody else - it ends your round.
    score = at === seat ? -1 : roundValue(victim, false);
  } else if (card.kind === "flip3") {
    // The more numbers somebody has down, the likelier three more finish them.
    // On yourself it is the opposite: a thin row is a cheap gamble worth taking.
    score =
      at === seat
        ? Math.max(0, NEARLY_SEVEN - victim.numbers.length)
        : victim.numbers.length + (victim.second === null ? 1 : 0);
  } else {
    // Handing a Zweite Chance on: the least dangerous player gets it.
    score = -victim.score;
  }
  return score;
}

/**
 * How long the computer waits before acting, in milliseconds.
 *
 * @param game - the game
 * @returns the pause, so a watcher can follow what happened
 */
export function botWaitMs(game: Flip7Game): number {
  const random = createRandom(game.rng + game.log.length);
  return MIN_WAIT_MS + randomInt(random, WAIT_STEPS) * WAIT_SPREAD_MS;
}

/**
 * The chance the seat on turn busts if it takes another card.
 *
 * @param game - the current game
 * @param seat - the seat asking
 * @returns a chance between 0 and 1
 * @remarks
 * Exported because the screen shows it too. It is public information - anybody
 * at the table could work it out - and a game whose whole tension is one number
 * should say what that number is rather than making people count face-up cards.
 */
export function riskFor(game: Flip7Game, seat: number): number {
  return bustChance(game, game.players[seat]);
}

/**
 * Whether a seat is one number away from the bonus.
 *
 * @param game - the current game
 * @param seat - the seat asking
 * @returns true at six numbers down
 */
export function nearlyThere(game: Flip7Game, seat: number): boolean {
  return game.players[seat].numbers.length === FLIP_SEVEN - 1;
}

/**
 * The numbers that would finish this player off.
 *
 * @param game - the current game
 * @param seat - the seat asking
 * @returns the values already in front of them, ascending
 * @remarks
 * The screen shows these under the row. They are lying face up anyway; putting
 * them in a line only saves the reader from reading their own cards twice.
 */
export function deadlyNumbers(
  game: Flip7Game,
  seat: number,
): readonly number[] {
  const player = game.players[seat];
  return Array.from({ length: HIGHEST + 1 }, (unused, value) => value).filter(
    (value) => hasNumber(player, value),
  );
}

/** Whether anybody else is still in the round - the screen says so too. */
export function othersIn(game: Flip7Game, seat: number): boolean {
  return activeSeats(game).some((at) => at !== seat);
}
