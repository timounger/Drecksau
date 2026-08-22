/**
 * The referee: what a die does where, and every way a landing can end.
 *
 * @module
 * @remarks
 * All eight dice of a round go through one door, {@link place}, and each kind
 * of space resolves in its own small function below it. The rudder and the
 * engines are the only spaces that do anything on the **second** die rather
 * than the first, because both are a comparison between the two seats.
 *
 * Six ways to lose, and they are worth naming rather than folding into one
 * "crashed": spinning, colliding, overshooting, coming down short, forgetting a
 * mandatory space, and landing too fast. Which one it was is the whole story of
 * the round, and a player told only "verloren" learns nothing from it.
 */
import { createRandom } from "./random";
import {
  BRAKE_VALUES,
  COFFEE_SPACES,
  DICE_PER_PLAYER,
  DIE_FACES,
  SPACES,
  accepts,
  spaceById,
  type Seat,
  type Space,
} from "./spaces";
import {
  ALTITUDES,
  advanceFor,
  airportAt,
  allDeployed,
  brakeStrength,
  coffeeRoom,
  dutyDone,
  isFinalRound,
  isSpinning,
  planesLeft,
  seatWaiting,
  type Failure,
  type Player,
  type SkyTeamGame,
  type SkyTeamMove,
} from "./state";

/** The spaces each seat may reach, worked out once. */
const SEAT_SPACES: readonly (readonly Space[])[] = [0, 1].map((seat) =>
  SPACES.filter((space) => space.seat === null || space.seat === seat),
);

/**
 * Plays one move, or refuses it.
 *
 * @param game - the landing as it stands
 * @param seat - who is trying to move
 * @param move - what they want to do
 * @returns the landing afterwards, or null if the move was not legal
 * @remarks
 * The single door every move comes through - the screen, the computer opponent
 * and the network all end up here, so an illegal move has exactly one place to
 * be turned away.
 */
export function applyMove(
  game: SkyTeamGame,
  seat: Seat,
  move: SkyTeamMove,
): SkyTeamGame | null {
  let next: SkyTeamGame | null = null;
  switch (move.kind) {
    case "place":
      next =
        game.stage === "placing" && game.active === seat
          ? place(game, seat, move.space, move.die, move.shift)
          : null;
      break;
    case "reroll":
      next = game.stage === "placing" ? reroll(game) : null;
      break;
    case "next":
      next = game.stage === "roundEnd" ? nextRound(game) : null;
      break;
  }
  return next;
}

/**
 * The seat the table is waiting for.
 *
 * @param game - the landing
 * @returns the seat, or null when the game is over
 */
export function seatOnTurn(game: SkyTeamGame): Seat | null {
  return seatWaiting(game);
}

/**
 * Every move this seat could make right now.
 *
 * @param game - the landing
 * @param seat - whose options to list
 * @returns the legal moves
 * @remarks
 * The screen draws its buttons from this and the referee checks against the
 * same rules, so a button that cannot be pressed is impossible by construction.
 */
export function legalMoves(
  game: SkyTeamGame,
  seat: Seat,
): readonly SkyTeamMove[] {
  const moves: SkyTeamMove[] = [];
  if (game.stage === "roundEnd" && seat === game.opener) {
    moves.push({ kind: "next" });
  } else if (game.stage === "placing" && game.active === seat) {
    if (game.rerolls > 0) {
      moves.push({ kind: "reroll" });
    }
    const dice = game.players[seat].dice;
    for (let die = 0; die < dice.length; die++) {
      for (const space of openSpaces(game, seat)) {
        for (const shift of shifts(game, dice[die])) {
          if (accepts(space, seat, dice[die] + shift)) {
            moves.push({ kind: "place", space: space.id, die, shift });
          }
        }
      }
    }
  }
  return moves;
}

/**
 * The spaces a seat could still use, ignoring die values.
 *
 * @param game - the landing
 * @param seat - whose side to look at
 * @returns the free spaces this seat is allowed to reach
 */
export function openSpaces(game: SkyTeamGame, seat: Seat): readonly Space[] {
  return SEAT_SPACES[seat].filter(
    (space) => game.placed[space.id] === null && ordered(game, space),
  );
}

/**
 * The value shifts the coffee in hand allows for a die.
 *
 * @param game - the landing
 * @param value - what the die shows
 * @returns every shift that lands inside 1 to 6, no shift first
 */
export function shifts(game: SkyTeamGame, value: number): readonly number[] {
  const room: number[] = [0];
  for (let spend = 1; spend <= game.coffee; spend++) {
    if (value - spend >= 1) {
      room.push(-spend);
    }
    if (value + spend <= DIE_FACES) {
      room.push(spend);
    }
  }
  return room;
}

/** An empty cockpit, every space free. */
export function emptyCockpit(): Record<string, number | null> {
  return Object.fromEntries(SPACES.map((space) => [space.id, null]));
}

/**
 * Rolls both sets of dice and collects any reroll token at this altitude.
 *
 * @param game - the landing, already moved to the new round
 * @returns the landing with eight fresh dice behind the screens
 * @remarks
 * Exported because setup deals the first round with it, and a first round dealt
 * differently from the rest is a bug waiting to be written.
 */
export function deal(game: SkyTeamGame): SkyTeamGame {
  const random = createRandom(game.rng);
  const roll = (): readonly number[] =>
    Array.from(
      { length: DICE_PER_PLAYER },
      () => 1 + Math.floor(random.next() * DIE_FACES),
    );
  const height = ALTITUDES[game.altitude];
  const token = game.rerollLeft.includes(height);
  const dealt: SkyTeamGame = {
    ...game,
    players: [
      { ...game.players[0], dice: roll() },
      { ...game.players[1], dice: roll() },
    ],
    rerolls: game.rerolls + (token ? 1 : 0),
    rerollLeft: game.rerollLeft.filter((each) => each !== height),
    rng: random.state(),
  };
  return note(
    dealt,
    `Runde ${dealt.round} - ${height} Fuß${token ? ", Neuwurf-Plättchen dazu" : ""}.`,
  );
}

/** Puts one die down and resolves whatever that sets off. */
function place(
  game: SkyTeamGame,
  seat: Seat,
  spaceId: string,
  die: number,
  shift: number,
): SkyTeamGame | null {
  const space = spaceById(spaceId);
  const raw = game.players[seat].dice[die];
  let next: SkyTeamGame | null = null;

  if (
    space !== undefined &&
    raw !== undefined &&
    game.placed[spaceId] === null &&
    ordered(game, space) &&
    shifts(game, raw).includes(shift) &&
    accepts(space, seat, raw + shift)
  ) {
    const value = raw + shift;
    const spent = Math.abs(shift);
    const laid = note(
      {
        ...game,
        coffee: game.coffee - spent,
        players: withoutDie(game, seat, die),
        placed: { ...game.placed, [spaceId]: value },
      },
      `${game.players[seat].name}: ${value} auf ${spaceId}${
        spent === 0 ? "" : ` (${spent}x Kaffee)`
      }.`,
    );
    const done = resolve(laid, space, value);
    next = done.stage === "placing" ? afterPlacing(done) : done;
  }
  return next;
}

/** What a die on that kind of space sets off. */
function resolve(game: SkyTeamGame, space: Space, value: number): SkyTeamGame {
  const byKind: Readonly<Record<string, () => SkyTeamGame>> = {
    axis: () => resolveAxis(game),
    engine: () => resolveEngines(game),
    gear: () => deployGear(game, space.slot),
    flaps: () => deployFlaps(game, space.slot),
    brake: () => deployBrake(game, space.slot),
    radio: () => callTower(game, value),
    coffee: () => brew(game),
  };
  return byKind[space.kind]();
}

/**
 * The rudder, once both sides have committed.
 *
 * @remarks
 * The difference, turned towards whoever played higher. Nothing at all until
 * the second die lands - which is why holding your rudder die back is both the
 * strongest and the most dangerous thing you can do.
 */
function resolveAxis(game: SkyTeamGame): SkyTeamGame {
  const pilot = game.placed["axis-p"];
  const copilot = game.placed["axis-c"];
  let next = game;
  if (pilot !== null && copilot !== null) {
    next = note(
      { ...game, axis: game.axis + (copilot - pilot) },
      `Ruder: ${pilot} gegen ${copilot}.`,
    );
    if (isSpinning(next)) {
      next = lose(next, "spin");
    }
  }
  return next;
}

/**
 * The engines, once both sides have committed.
 *
 * @remarks
 * In the landing round the plane is already on the runway: the speed is held
 * against the brakes instead of the aerodynamics markers, and nothing moves any
 * more. Same space, same comparison, different thing compared against - which
 * is why it is one function and not two.
 */
function resolveEngines(game: SkyTeamGame): SkyTeamGame {
  const pilot = game.placed["engine-p"];
  const copilot = game.placed["engine-c"];
  let next = game;
  if (pilot !== null && copilot !== null) {
    const speed = pilot + copilot;
    next = note({ ...game, speed }, `Triebwerke: Geschwindigkeit ${speed}.`);
    if (!isFinalRound(game)) {
      next = fly(next, advanceFor(next, speed));
    }
  }
  return next;
}

/**
 * Moves the plane along the approach, one space at a time.
 *
 * @remarks
 * One at a time on purpose: a space still carrying a plane and a space carrying
 * the airport are both checked **before** moving off them, so a jump of two
 * cannot hop over a collision that a jump of one would have hit.
 */
function fly(game: SkyTeamGame, spaces: number): SkyTeamGame {
  let next = game;
  for (let step = 0; step < spaces && next.stage === "placing"; step++) {
    if (next.traffic[next.position] > 0) {
      next = lose(next, "collision");
    } else if (next.position === airportAt(next)) {
      next = lose(next, "overshoot");
    } else {
      next = note(
        { ...next, position: next.position + 1 },
        `Ein Feld weiter: Position ${next.position + 1}.`,
      );
    }
  }
  return next;
}

/** The radio: counts up from the current position and clears one plane. */
function callTower(game: SkyTeamGame, value: number): SkyTeamGame {
  const at = game.position + value - 1;
  return at < game.traffic.length && game.traffic[at] > 0
    ? note(
        {
          ...game,
          traffic: game.traffic.map((count, index) =>
            index === at ? count - 1 : count,
          ),
        },
        `Funk: ein Flugzeug weg von Feld ${at}.`,
      )
    : note(game, "Funk: dort war nichts.");
}

/** One leg of landing gear, in any order. */
function deployGear(game: SkyTeamGame, slot: number): SkyTeamGame {
  return note(
    { ...game, gear: game.gear.map((on, at) => (at === slot ? true : on)) },
    `Fahrwerk ${slot + 1} ausgefahren.`,
  );
}

/** One flap, top to bottom. */
function deployFlaps(game: SkyTeamGame, slot: number): SkyTeamGame {
  return note(
    { ...game, flaps: game.flaps.map((on, at) => (at === slot ? true : on)) },
    `Landeklappe ${slot + 1} ausgefahren.`,
  );
}

/** One brake, left to right. */
function deployBrake(game: SkyTeamGame, slot: number): SkyTeamGame {
  return note(
    { ...game, brakes: game.brakes.map((on, at) => (at === slot ? true : on)) },
    `Bremse ${BRAKE_VALUES[slot]} aktiviert.`,
  );
}

/** Concentration: one cup, never more than the three spaces allow. */
function brew(game: SkyTeamGame): SkyTeamGame {
  return note(
    { ...game, coffee: Math.min(COFFEE_SPACES, game.coffee + 1) },
    "Konzentration: eine Tasse Kaffee.",
  );
}

/**
 * Whether the spaces before this one are already done.
 *
 * @remarks
 * The flaps run top to bottom and the brakes left to right; the landing gear
 * has no order at all. The rulebook says so in three separate places, and this
 * is the one place it is written down.
 */
function ordered(game: SkyTeamGame, space: Space): boolean {
  let ok = true;
  if (space.kind === "flaps") {
    ok = game.flaps.slice(0, space.slot).every(Boolean);
  } else if (space.kind === "brake") {
    ok = game.brakes.slice(0, space.slot).every(Boolean);
  } else if (space.kind === "coffee") {
    ok = coffeeRoom(game) > 0;
  }
  return ok;
}

/** Hands the turn over, or ends the round once all eight dice are down. */
function afterPlacing(game: SkyTeamGame): SkyTeamGame {
  const other = (game.active === 0 ? 1 : 0) as Seat;
  const mine = game.players[game.active].dice.length;
  const theirs = game.players[other].dice.length;
  let next: SkyTeamGame;
  if (mine === 0 && theirs === 0) {
    next = endRound(game);
  } else {
    // Alternating - but a seat with nothing left is skipped rather than asked.
    next = { ...game, active: theirs > 0 ? other : game.active };
  }
  return next;
}

/** Everything that happens once the eighth die is down. */
function endRound(game: SkyTeamGame): SkyTeamGame {
  let next: SkyTeamGame;
  if (!dutyDone(game)) {
    next = lose(game, "duty");
  } else if (isFinalRound(game)) {
    next = land(game);
  } else {
    next = note({ ...game, stage: "roundEnd" }, "Runde vorbei.");
  }
  return next;
}

/**
 * The landing itself: four conditions, all of them.
 *
 * @remarks
 * Checked in the order the rulebook lists them, so the reason given is the
 * first thing that was actually wrong rather than whichever check ran first.
 */
function land(game: SkyTeamGame): SkyTeamGame {
  const speed = game.speed ?? 0;
  let next: SkyTeamGame;
  if (planesLeft(game) > 0) {
    next = lose(game, "collision");
  } else if (!allDeployed(game)) {
    next = lose(game, "landing");
  } else if (game.axis !== 0) {
    next = lose(game, "spin");
  } else if (speed > brakeStrength(game)) {
    next = lose(game, "overshoot");
  } else {
    next = note({ ...game, stage: "won" }, "Sicher gelandet!");
  }
  return next;
}

/** Descends, clears the cockpit and deals the next round. */
function nextRound(game: SkyTeamGame): SkyTeamGame {
  const altitude = game.altitude + 1;
  const last = ALTITUDES.length - 1;
  let next: SkyTeamGame;
  if (altitude > last) {
    next = lose(game, "short");
  } else if (altitude === last && game.position !== airportAt(game)) {
    // Height used up somewhere other than over the airport: a field, a motorway,
    // anywhere but the runway.
    next = lose(game, "short");
  } else {
    const opener = (game.opener === 0 ? 1 : 0) as Seat;
    next = deal({
      ...game,
      stage: "placing",
      altitude,
      round: game.round + 1,
      opener,
      active: opener,
      speed: null,
      placed: emptyCockpit(),
    });
  }
  return next;
}

/** Spends a token: every die still behind a screen is thrown again. */
function reroll(game: SkyTeamGame): SkyTeamGame | null {
  let next: SkyTeamGame | null = null;
  if (game.rerolls > 0) {
    const random = createRandom(game.rng);
    const again = (dice: readonly number[]): readonly number[] =>
      dice.map(() => 1 + Math.floor(random.next() * DIE_FACES));
    next = note(
      {
        ...game,
        rerolls: game.rerolls - 1,
        players: [
          { ...game.players[0], dice: again(game.players[0].dice) },
          { ...game.players[1], dice: again(game.players[1].dice) },
        ],
        rng: random.state(),
      },
      "Neuwurf: alle übrigen Würfel noch einmal.",
    );
  }
  return next;
}

/** Ends the landing badly, and says which way. */
function lose(game: SkyTeamGame, failure: Failure): SkyTeamGame {
  return note({ ...game, stage: "lost", failure }, `Vorbei: ${failure}.`);
}

/** Takes one die out of a player's hand. */
function withoutDie(
  game: SkyTeamGame,
  seat: Seat,
  die: number,
): readonly [Player, Player] {
  const kept = (index: Seat): readonly number[] =>
    index === seat
      ? game.players[index].dice.filter((unused, at) => at !== die)
      : game.players[index].dice;
  return [
    { ...game.players[0], dice: kept(0) },
    { ...game.players[1], dice: kept(1) },
  ];
}

/**
 * Adds a line to the log.
 *
 * @remarks
 * Name, colon, what happened - never a sentence with a verb in it. The seat you
 * play yourself is called "Du" when it has no other name, and "Du legt" is not
 * German.
 */
function note(game: SkyTeamGame, line: string): SkyTeamGame {
  return { ...game, log: [...game.log, line] };
}
