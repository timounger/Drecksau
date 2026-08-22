/**
 * The computer in the other seat.
 *
 * @module
 * @remarks
 * It is handed the game, which contains both sets of dice - and it **never
 * looks at the other seat's**. Every function below reads `game.players[seat]`
 * and the cockpit, and nothing else. That is not politeness: a co-pilot who
 * could read your hand would have removed the only thing this game is about.
 *
 * How it decides: it scores each legal placement by how much it helps, using
 * the same numbers a player can see, and takes the best. Where two are equally
 * good it prefers the earlier one, which keeps it predictable - a partner whose
 * habits you can learn is a better partner than a clever one you cannot read.
 */
import { legalMoves } from "./moves";
import { AXIS_LIMIT } from "./spaces";
import { BRAKE_VALUES, DIE_FACES, PILOT, spaceById, type Seat } from "./spaces";
import {
  advanceFor,
  airportAt,
  blueMarker,
  brakeStrength,
  isFinalRound,
  orangeMarker,
  type SkyTeamGame,
  type SkyTeamMove,
} from "./state";

/** How long the computer waits before moving, so it can be followed. */
const MOVE_DELAY_MS = 850;

/** The things a die can be worth doing. */
type Worth =
  | "radio"
  | "deploy"
  | "brake"
  | "duty"
  | "open"
  | "coffee"
  | "level"
  | "thrust"
  | "blocking";

/**
 * Weights: what matters most when a die could go anywhere.
 *
 * @remarks
 * Keyed by a union rather than by `string`. A `Record<string, number>` hands
 * back `undefined` for a name that is not there, which turns into `NaN`, and a
 * `NaN` score is never greater than anything - so the move it belonged to is
 * simply never chosen and nothing anywhere says why. One missing key cost four
 * hundred landings out of four hundred before this type was written down.
 */
const WORTH: Readonly<Record<Worth, number>> = {
  /** Clearing the way further ahead, before it becomes a wall. */
  radio: 60,
  /** Clearing the plane you are standing behind - nothing moves until it goes. */
  blocking: 100,
  /** Both must be fully out to land; leaving them late loses games. */
  deploy: 45,
  /** Needed at the very end, and only the pilot can do it. */
  brake: 40,
  /**
   * Mandatory - and worth more than it looks, because of *when*.
   *
   * @remarks
   * Above the gear and the flaps on purpose. Whoever places second on the
   * rudder can level the plane exactly, so whoever places **first** hands that
   * gift over - and a seat that saves its rudder die for last hands it to
   * nobody, because by then neither of them has a choice left. The rulebook
   * says so in as many words, and an earlier version of this file proved it:
   * with the duty ranked below the gear, two hundred and sixty-seven landings
   * out of four hundred ended in a spin.
   */
  duty: 50,
  /**
   * Opening the rudder pair, before the partner has committed.
   *
   * @remarks
   * Above the radio and the switches, so the pair is settled in the first half
   * of the round: whoever answers it then still has three dice to choose from
   * instead of one.
   */
  open: 85,
  /** Useful, but every cup is a die not spent on the cockpit. */
  coffee: 8,
  /**
   * Levelling the rudder when the other side is already down.
   *
   * @remarks
   * The highest thing on the board, and it has to be. The rudder is the only
   * space that ends the game **this instant**; everything else merely leaves
   * you worse off next round. When the partner has committed and this seat can
   * settle the tilt exactly, nothing else is worth considering - and when the
   * engines were given the same weight, the spins went from a hundred and ten
   * to a hundred and seventy-five.
   */
  level: 120,
  /** Completing the engines, knowing exactly how far it moves the plane. */
  thrust: 80,
};

/**
 * The placement a hand has to beat before the tokens stay in the pot.
 *
 * @remarks
 * Set just under what a switch is worth: if the best this seat can do with
 * eight dice is worse than deploying a flap, the dice are the problem.
 */
const REROLL_WORTH = 44;

/** Where a reroll sits when nothing else is going on. */
const REROLL_FLOOR = -1;

/** A rudder pair this far apart is already dangerous. */
const AXIS_SAFE = 2;

/** A move that must not be made: flying into traffic, or landing too fast. */
const FORBIDDEN = -100;

/** A landing speed the brakes cannot hold - bad, but not as bad as a crash. */
const TOO_FAST = -50;

/** How hard a wrong number of steps counts against an engine die. */
const STEP_PENALTY = 20;

/** How hard a tilt counts against a rudder die. */
const TILT_PENALTY = 5;

/**
 * Picks the computer's move.
 *
 * @param game - the landing
 * @param seat - the seat the computer sits in
 * @returns the move, or null if there is nothing to do
 */
export function aiMove(game: SkyTeamGame, seat: Seat): SkyTeamMove | null {
  const moves = legalMoves(game, seat);
  let best: SkyTeamMove | null = null;
  let bestScore = -Infinity;
  let bestPlacement = -Infinity;
  for (const move of moves) {
    const score = scoreOf(game, seat, move);
    if (move.kind === "place" && score > bestPlacement) {
      bestPlacement = score;
    }
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  // A reroll is only ever worth it against what the hand can already do. It
  // costs nothing but the token, and it throws the partner's spare dice as
  // well, so a poor hand on either side is reason enough.
  if (best?.kind !== "place" || bestPlacement < REROLL_WORTH) {
    const throwAgain = moves.find((move) => move.kind === "reroll");
    if (throwAgain !== undefined) {
      best = throwAgain;
    }
  }
  return best;
}

/**
 * How long the computer pauses before moving.
 *
 * @returns the delay in milliseconds
 */
export function botWaitMs(): number {
  return MOVE_DELAY_MS;
}

/** What a move is worth to the computer. */
function scoreOf(game: SkyTeamGame, seat: Seat, move: SkyTeamMove): number {
  let score = 0;
  if (move.kind === "next") {
    score = 1;
  } else if (move.kind === "reroll") {
    // Worth exactly as much as the hand is bad. Scored against the best
    // placement available further down, in `aiMove` - a token kept to the end
    // of the game is a token wasted, and an earlier version of this file simply
    // forbade the move and threw both of them away every time.
    score = REROLL_FLOOR;
  } else {
    const space = spaceById(move.space);
    const value = game.players[seat].dice[move.die] + move.shift;
    const duty = space?.kind === "axis" || space?.kind === "engine";
    score =
      space === undefined
        ? 0
        : worthOf(game, seat, space.kind, space.slot, value);
    // Coffee spent is coffee the partner cannot use. Never free.
    score -= Math.abs(move.shift) * WORTH.coffee;
    // The rudder and the engines are not optional, and the dice run out. Once
    // there are only as many left as this seat still owes, nothing else is
    // worth anything at all - this is exactly the mistake the rulebook warns
    // about, and the one the first version of this file made four hundred
    // times out of four hundred.
    if (!duty && spareDice(game, seat) <= 0) {
      score = FORBIDDEN;
    }
    // Standing behind traffic, the engines must not carry the plane forward -
    // and the engine die is not optional. So the lowest die in hand is spoken
    // for, and spending it anywhere else is how a seat ends up forced into the
    // back of an aircraft with nothing but sixes left.
    if (!duty && reservedForEngines(game, seat, move.die)) {
      score = FORBIDDEN;
    }
  }
  return score;
}

/**
 * What brewing one more cup is worth.
 *
 * @remarks
 * The cup is what turns a near miss into an exact level, and the rudder has to
 * end exactly level. With none in the pot the pair is playing without the one
 * tool the game gives them for it, so the first cup is worth about as much as a
 * flap; the third is worth almost nothing, because a die spent here is a die
 * not spent in the cockpit.
 */
function brewWorth(game: SkyTeamGame): number {
  return game.coffee === 0
    ? WORTH.deploy
    : Math.max(WORTH.coffee, WORTH.deploy / (game.coffee + 1));
}

/**
 * Whether this die is the one being kept back for the engines.
 *
 * @param game - the landing
 * @param seat - whose hand to look at
 * @param die - the die being considered for something else
 * @returns true while the plane must not move and this is the lowest die left
 */
function reservedForEngines(
  game: SkyTeamGame,
  seat: Seat,
  die: number,
): boolean {
  const owed = game.placed[seat === PILOT ? "engine-p" : "engine-c"] === null;
  const mustHold =
    game.traffic[game.position] > 0 || game.position === airportAt(game);
  const dice = game.players[seat].dice;
  return owed && mustHold && dice[die] === Math.min(...dice);
}

/**
 * Dice this seat may spend on something other than its duties.
 *
 * @param game - the landing
 * @param seat - whose hand to count
 * @returns dice in hand, less the mandatory spaces still empty
 */
function spareDice(game: SkyTeamGame, seat: Seat): number {
  const mine = seat === PILOT ? ["axis-p", "engine-p"] : ["axis-c", "engine-c"];
  const owed = mine.filter((id) => game.placed[id] === null).length;
  return game.players[seat].dice.length - owed;
}

/** What putting `value` on that kind of space is worth. */
function worthOf(
  game: SkyTeamGame,
  seat: Seat,
  kind: string,
  slot: number,
  value: number,
): number {
  const byKind: Readonly<Record<string, () => number>> = {
    radio: () => radioWorth(game, value),
    gear: () => deployWorth(game),
    flaps: () => deployWorth(game),
    brake: () => brakeWorth(game, slot),
    axis: () => axisWorth(game, seat, value),
    engine: () => engineWorth(game, value),
    coffee: () => brewWorth(game),
  };
  return byKind[kind]?.() ?? 0;
}

/**
 * What clearing that space of the approach is worth.
 *
 * @remarks
 * A plane on the space you are **standing on** is not traffic, it is a wall:
 * the engines cannot move at all while it is there, and every round spent
 * waiting is a thousand feet you will not get back. So that one is worth more
 * than anything except levelling the rudder, and the further ahead a plane is,
 * the more it can wait.
 *
 * Hitting an empty space is worth nothing at all, which is exactly what the
 * rules say it does.
 */
function radioWorth(game: SkyTeamGame, value: number): number {
  const at = game.position + value - 1;
  const hit = at < game.traffic.length && game.traffic[at] > 0;
  const ahead = at - game.position;
  const toGo = airportAt(game) - game.position;
  const roundsLeft = Math.max(1, ALTITUDE_ROUNDS - game.round);
  let worth = 0;
  if (hit && ahead === 0) {
    // In the way right now. Urgent in proportion to how little room is left.
    worth = WORTH.blocking + (toGo > roundsLeft ? STEP_PENALTY : 0);
  } else if (hit) {
    worth = WORTH.radio - ahead * TILT_PENALTY;
  }
  return worth;
}

/**
 * What deploying one more switch is worth.
 *
 * @remarks
 * Every leg and every flap is **drag**, and drag cuts both ways. That is the
 * whole of it, and the rulebook gives both halves as tips on the same page:
 *
 * - _"Müsst ihr noch viele Felder vorankommen? Dann fahrt die Landeklappen
 *   nicht zu früh aus!"_ - drag is what stops you arriving.
 * - _"Ist der Luftraum vor dem Flughafen voller Flugzeuge und ihr wollt weniger
 *   Felder vorankommen? Dann fahrt das Fahrwerk aus!"_ - drag is also the only
 *   way to stand still, because with the marker at 4 any sum of five or more
 *   carries the plane forward, and five or more is five throws in six.
 *
 * So: deploy while the plane has to hold station, hold off while it has ground
 * to make up - and once there are more switches left than rounds to place them
 * in, deploy regardless, because a landing without them cannot be won.
 */
function deployWorth(game: SkyTeamGame): number {
  const left =
    game.gear.filter((on) => !on).length +
    game.flaps.filter((on) => !on).length;
  const rounds = Math.max(1, ALTITUDE_ROUNDS - game.round);
  const forced = Math.max(0, left - rounds) * STEP_PENALTY;
  const holding =
    game.traffic[game.position] > 0 || game.position === airportAt(game);
  let worth: number;
  if (forced > 0) {
    worth = WORTH.deploy + forced;
  } else if (holding) {
    worth = WORTH.deploy + STEP_PENALTY;
  } else {
    const slack = rounds - (airportAt(game) - game.position);
    worth = slack > 0 ? WORTH.deploy : WORTH.coffee;
  }
  return worth;
}

/** The brakes matter at the end, and more the higher they go. */
function brakeWorth(game: SkyTeamGame, slot: number): number {
  return brakeStrength(game) >= BRAKE_VALUES[slot] ? 0 : WORTH.brake;
}

/**
 * What this rudder die is worth.
 *
 * @remarks
 * Whoever places **second** on the rudder decides where the plane ends up: they
 * can see the other die and work out the exact tilt. So this asks the only
 * question worth asking - what would the indicator read afterwards - and
 * refuses anything that would spin.
 *
 * Placing **first** is a guess, but not a blind one. Whatever is played here
 * fixes what the partner needs in order to level: play `p`, and the co-pilot
 * needs `p - axis`. The best first die is therefore the one that leaves the
 * partner needing something near the middle of a die, where they are most
 * likely to have it.
 */
function axisWorth(game: SkyTeamGame, seat: Seat, value: number): number {
  const other = seat === PILOT ? game.placed["axis-c"] : game.placed["axis-p"];
  const centre = (1 + DIE_FACES) / 2;
  let worth: number;
  if (other === null || other === undefined) {
    const wanted = seat === PILOT ? centre + game.axis : centre - game.axis;
    worth = WORTH.open - Math.abs(value - wanted) * TILT_PENALTY;
  } else {
    // The signed tilt: towards whoever played higher.
    const after = game.axis + (seat === PILOT ? other - value : value - other);
    worth =
      Math.abs(after) >= AXIS_LIMIT
        ? FORBIDDEN
        : WORTH.level - Math.abs(after) * TILT_PENALTY * AXIS_SAFE;
  }
  return worth;
}

/**
 * What this engine die is worth.
 *
 * @remarks
 * Speed is never the point; arriving over the airport exactly as the height
 * runs out is. So this works out how far there still is to go, how many rounds
 * are left, and what sum would cover that - then scores the die by how close it
 * gets to it.
 *
 * Placing **second** is exact: the sum is known, so the number of spaces is
 * known, and a step into traffic can simply be refused. Placing **first** is
 * half a decision, so it aims at half the wanted sum and leaves the rest to the
 * partner. An earlier version scored the first die not at all, and the plane
 * kept running out of height a field short of the runway.
 */
function engineWorth(game: SkyTeamGame, value: number): number {
  const other = game.placed["engine-p"] ?? game.placed["engine-c"];
  let worth: number;
  if (isFinalRound(game)) {
    // On the runway: as slow as the brakes demand, and not one more.
    const speed =
      other === null || other === undefined ? value * 2 : other + value;
    worth = speed <= brakeStrength(game) ? WORTH.duty * 2 : TOO_FAST;
  } else if (other === null || other === undefined) {
    worth = WORTH.duty - Math.abs(value - wantedSpeed(game) / 2) * AXIS_SAFE;
  } else {
    const steps = advanceFor(game, other + value);
    const wall =
      game.traffic[game.position] > 0 || game.position === airportAt(game);
    worth =
      steps > 0 && wall
        ? FORBIDDEN
        : WORTH.thrust -
          Math.abs(steps - wantedSteps(game)) * STEP_PENALTY -
          parkingRisk(game, steps);
  }
  return worth;
}

/**
 * What it costs to end the round on the space this move leads to.
 *
 * @remarks
 * Flying **onto** a space full of aircraft is allowed - the rulebook says so.
 * Flying **off** one is the collision. So a move that parks the plane behind
 * traffic has not avoided anything, it has only postponed it to a round in
 * which there may be no radio die to spare. An earlier version looked only at
 * the space it was leaving and drove into the back of something a hundred and
 * sixty-nine times out of four hundred.
 */
function parkingRisk(game: SkyTeamGame, steps: number): number {
  const at = Math.min(airportAt(game), game.position + steps);
  const mustMoveAgain = at < airportAt(game);
  return game.traffic[at] > 0 && mustMoveAgain
    ? game.traffic[at] * STEP_PENALTY
    : 0;
}

/** How far the plane ought to move this round to arrive on time. */
function wantedSteps(game: SkyTeamGame): number {
  let steps: number;
  if (game.traffic[game.position] > 0) {
    // The way out is blocked: moving at all is a collision.
    steps = 0;
  } else {
    const toGo = airportAt(game) - game.position;
    const roundsLeft = Math.max(1, ALTITUDE_ROUNDS - game.round);
    steps = Math.min(2, Math.max(0, Math.round(toGo / roundsLeft)));
  }
  return steps;
}

/**
 * The sum of the two engine dice that would move the plane as far as wanted.
 *
 * @param game - the landing
 * @returns a speed in the middle of the band that gives {@link wantedSteps}
 */
function wantedSpeed(game: SkyTeamGame): number {
  const blue = blueMarker(game);
  const orange = orangeMarker(game);
  const bySteps: Readonly<Record<number, number>> = {
    0: Math.max(2, blue - 1),
    1: (blue + orange) / 2,
    2: orange + 2,
  };
  return bySteps[wantedSteps(game)];
}

/** Rounds a landing has, so the pace can be worked out. */
const ALTITUDE_ROUNDS = 7;
