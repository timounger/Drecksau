/**
 * The rules of a match: choosing fighters, taking turns at throwing, the
 * abilities, losing life points, the knockout and the rematch.
 *
 * @module
 * @remarks
 * One pure reducer, {@link applyMove}, used by the single-player screen and as
 * the online referee alike. It never reads a clock and never draws a random
 * number of its own - wind, scenery and every wobble come from the match
 * seed - so host and guest agree on everything without sending more than the
 * throw and the ability that went with it.
 *
 * **One ability per throw, and always with a throw.** An ability is chosen,
 * then the throw is made; healing and the like happen first, effects on the
 * opponent afterwards. So a turn always ends the same way - with something in
 * the air - and nobody has to learn which abilities cost a turn and which do
 * not.
 */
import { SCENERY_STYLES, WIND_MAX_STEPS } from "./arena";
import {
  ABILITIES,
  ABILITY_IDS,
  CHARACTER_IDS,
  characterById,
  itemFor,
} from "./characters";
import {
  ANGLE_MAX,
  ANGLE_MIN,
  simulateFlight,
  type Flight,
  type FlightSetup,
} from "./physics";
import { intAt, nextSeed, randomAt } from "./random";
import type {
  AbilityId,
  CharacterId,
  DuelGame,
  DuelMove,
  DuelPlayer,
  Statuses,
  ThrowInput,
  ThrowRecord,
} from "./types";

/** Always two: this is a duel. */
export const PLAYER_COUNT = 2;

/** Life points the hot sauce burns off per turn. */
export const BURN_DAMAGE = 10;

/** How many turns the hot sauce burns. */
export const BURN_TURNS = 2;

/** The most strength a tangled fighter can put into a throw. */
export const ROOTED_POWER = 0.7;

/** How far a wobbling throw strays: degrees and strength either way. */
const WOBBLE_ANGLE = 9;
const WOBBLE_POWER = 0.12;

/** Which draws of the seed decide what. */
const DRAW_SCENERY = 2;
const DRAW_WIND = 100;
const DRAW_WOBBLE = 3000;

/** No lingering effects at all. */
const CLEAR: Statuses = {
  shield: false,
  frozen: false,
  shaky: false,
  rooted: false,
  blind: false,
  burn: 0,
};

/** The throw made for a player who ran out of time: a feeble lob. */
export const WEAK_THROW: ThrowInput = {
  angle: 45,
  power: 0.3,
  ability: null,
};

/**
 * Sets up a new match, waiting for both to choose a fighter.
 *
 * @param names - the two players, left seat first
 * @param seed - where the match's wind and scenery come from
 * @param round - how many matches this table has played before
 * @param wins - each seat's wins so far at this table
 * @returns the match in its choosing phase
 * @remarks
 * Who starts alternates with the round, so a rematch is not won by the same
 * player always having the first throw.
 */
export function createGame(
  names: readonly string[],
  seed: number,
  round = 0,
  wins: readonly number[] = [0, 0],
): DuelGame {
  return {
    seed,
    round,
    phase: "pick",
    players: [0, 1].map((seat) => freshPlayer(names[seat] ?? "", wins[seat])),
    turn: round % PLAYER_COUNT,
    wind: windFor(seed, 0),
    scenery: intAt(seed, DRAW_SCENERY, SCENERY_STYLES),
    lastThrow: null,
    winner: null,
    endReason: null,
  };
}

/**
 * Applies one player's move, as the referee.
 *
 * @param game - the match
 * @param seat - who is moving
 * @param move - what they want to do
 * @returns the match after it, or null if the move is not allowed now
 */
export function applyMove(
  game: DuelGame,
  seat: number,
  move: DuelMove,
): DuelGame | null {
  let next: DuelGame | null = null;
  if (seat === 0 || seat === 1) {
    switch (move.kind) {
      case "pick":
        next = pick(game, seat, move.character);
        break;
      case "throw":
        next = throwAt(
          game,
          seat,
          { angle: move.angle, power: move.power, ability: move.ability },
          move.auto === true,
        );
        break;
      case "resign":
        next = resign(game, seat);
        break;
      case "rematch":
        next = rematch(game, seat);
        break;
    }
  }
  return next;
}

/**
 * The seat that has to act now, or null when nobody has to.
 *
 * @param game - the match
 * @returns the seat
 * @remarks
 * While choosing, both may choose at once; this names the first who has not,
 * so a clock has someone to wait for.
 */
export function seatOnTurn(game: DuelGame): number | null {
  let seat: number | null = null;
  if (game.phase === "pick") {
    const waiting = game.players.findIndex(
      (player) => player.character === null,
    );
    seat = waiting >= 0 ? waiting : null;
  } else if (game.phase === "throw") {
    seat = game.turn;
  }
  return seat;
}

/**
 * What one turn is, for a clock.
 *
 * @param game - the match
 * @returns a key that changes whenever a new turn begins
 */
export function turnKey(game: DuelGame): string {
  const picked = game.players.filter((p) => p.character !== null).length;
  return `${game.round}-${game.phase}-${picked}-${game.lastThrow?.id ?? 0}`;
}

/**
 * The wind of one throw of a match.
 *
 * @param seed - the match seed
 * @param throwNumber - how many throws were made before it
 * @returns the wind in steps, from -max to +max
 */
export function windFor(seed: number, throwNumber: number): number {
  return (
    intAt(seed, DRAW_WIND + throwNumber, WIND_MAX_STEPS * 2 + 1) -
    WIND_MAX_STEPS
  );
}

/**
 * Whether a seat may still use an ability.
 *
 * @param game - the match
 * @param seat - the seat
 * @param ability - the ability
 * @returns true when it is theirs and not spent yet
 */
export function canUseAbility(
  game: DuelGame,
  seat: number,
  ability: AbilityId,
): boolean {
  const player = game.players[seat];
  return (
    player.character !== null &&
    characterById(player.character).abilities.includes(ability) &&
    !player.used.includes(ability)
  );
}

/**
 * A fighter chosen at random, for a computer opponent or a player who
 * dithered too long.
 *
 * @param seed - where the choice comes from
 * @param salt - so the two seats do not draw the same
 * @returns a fighter
 */
export function randomCharacter(seed: number, salt: number): CharacterId {
  return CHARACTER_IDS[intAt(seed, salt, CHARACTER_IDS.length)];
}

/**
 * Everything a throw from a seat flies with - the same for the referee, the
 * replay on screen, the aiming help and the computer.
 *
 * @param game - the match
 * @param seat - who throws
 * @param input - the throw, as it leaves the hand
 * @param wind - the wind it meets
 * @returns the flight's setup
 */
export function flightSetup(
  game: DuelGame,
  seat: number,
  input: ThrowInput,
  wind: number,
): FlightSetup {
  const thrower = characterById(game.players[seat].character ?? "koch");
  const target = characterById(game.players[1 - seat].character ?? "koch");
  const ability = input.ability === null ? null : ABILITIES[input.ability];
  return {
    seat,
    thrower,
    target,
    angle: input.angle,
    power: input.power,
    item: itemFor(thrower, input.ability),
    volley: ability?.volley ?? [0],
    wind: ability?.calm === true ? 0 : wind,
  };
}

/**
 * Flies a recorded throw again, exactly as the referee did.
 *
 * @param game - the match the throw belongs to
 * @param record - the throw
 * @returns its flight
 */
export function flightOf(game: DuelGame, record: ThrowRecord): Flight {
  return simulateFlight(
    flightSetup(game, record.by, record.input, record.wind),
  );
}

/** A player before the match, without a fighter yet. */
function freshPlayer(name: string, wins = 0): DuelPlayer {
  return {
    name,
    character: null,
    hp: 0,
    maxHp: 0,
    used: [],
    status: CLEAR,
    throws: 0,
    hits: 0,
    wins,
    rematch: false,
  };
}

/** A seat chooses its fighter. */
function pick(
  game: DuelGame,
  seat: number,
  character: CharacterId,
): DuelGame | null {
  let next: DuelGame | null = null;
  const player = game.players[seat];
  if (
    game.phase === "pick" &&
    player.character === null &&
    CHARACTER_IDS.includes(character)
  ) {
    const hp = characterById(character).maxHp;
    const players = replace(game.players, seat, {
      ...player,
      character,
      hp,
      maxHp: hp,
    });
    const ready = players.every((p) => p.character !== null);
    next = { ...game, players, phase: ready ? "throw" : "pick" };
  }
  return next;
}

/** A seat throws, perhaps with an ability. */
function throwAt(
  game: DuelGame,
  seat: number,
  asked: ThrowInput,
  auto: boolean,
): DuelGame | null {
  let next: DuelGame | null = null;
  if (
    game.phase === "throw" &&
    game.turn === seat &&
    isThrowInput(asked) &&
    (asked.ability === null || canUseAbility(game, seat, asked.ability)) &&
    game.players.every((p) => p.character !== null)
  ) {
    next = resolveThrow(game, seat, asked, auto);
  }
  return next;
}

/** Works a legal throw out to the end, abilities and all. */
function resolveThrow(
  game: DuelGame,
  seat: number,
  asked: ThrowInput,
  auto: boolean,
): DuelGame {
  const id = (game.lastThrow?.id ?? 0) + 1;
  const ability = asked.ability === null ? null : ABILITIES[asked.ability];
  let thrower = game.players[seat];
  let other = game.players[1 - seat];

  // What lingers on the thrower acts on this throw, then is gone.
  const input = steadied(game.seed, id, asked, thrower.status, ability);
  const heal = Math.min(ability?.heal ?? 0, thrower.maxHp - thrower.hp);
  const setup = flightSetup(game, seat, input, game.wind);
  const flight = simulateFlight(setup);

  const shielded = other.status.shield && flight.damage > 0;
  const raw = shielded ? Math.ceil(flight.damage / 2) : flight.damage;
  const damage = Math.min(other.hp, raw);
  const hit = damage > 0;

  thrower = {
    ...thrower,
    hp: thrower.hp + heal,
    used: ability === null ? thrower.used : [...thrower.used, ability.id],
    throws: thrower.throws + 1,
    hits: thrower.hits + (hit ? 1 : 0),
    status: {
      ...thrower.status,
      shaky: false,
      rooted: false,
      blind: false,
      shield: thrower.status.shield || ability?.status === "shield",
    },
  };
  other = {
    ...other,
    hp: other.hp - damage,
    status: afflicted(other.status, ability, hit, shielded),
  };

  let players = replace(replace(game.players, seat, thrower), 1 - seat, other);
  let winner: number | null = other.hp <= 0 ? seat : null;

  // The opponent frozen: the thrower goes again, and the ice melts.
  const frozen = winner === null && other.status.frozen;
  let turn = 1 - seat;
  if (frozen) {
    turn = seat;
    players = replace(players, 1 - seat, {
      ...other,
      status: { ...other.status, frozen: false },
    });
  }

  // The hot sauce burns whoever is on turn now.
  let burn = 0;
  let burnSeat: number | null = null;
  const onTurn = players[turn];
  if (winner === null && onTurn.status.burn > 0) {
    burn = Math.min(onTurn.hp, BURN_DAMAGE);
    burnSeat = turn;
    players = replace(players, turn, {
      ...onTurn,
      hp: onTurn.hp - burn,
      status: { ...onTurn.status, burn: onTurn.status.burn - 1 },
    });
    winner = players[turn].hp <= 0 ? 1 - turn : null;
  }

  if (winner !== null) {
    players = replace(players, winner, {
      ...players[winner],
      wins: players[winner].wins + 1,
    });
  }

  return {
    ...game,
    players,
    phase: winner === null ? "throw" : "over",
    turn,
    wind: windFor(game.seed, id),
    lastThrow: {
      id,
      by: seat,
      input,
      wind: setup.wind,
      damage,
      shielded,
      heal,
      burn,
      burnSeat,
      frozen,
      knockout: winner !== null,
      best: hit ? flight.best : null,
      auto,
    },
    winner,
    endReason: winner === null ? null : "ko",
  };
}

/**
 * The throw as it really leaves the hand.
 *
 * @remarks
 * A shaken fighter (roared at, or after the rum) throws with a wobble drawn
 * from the seed; a tangled one cannot throw harder than {@link ROOTED_POWER}.
 */
function steadied(
  seed: number,
  id: number,
  asked: ThrowInput,
  status: Statuses,
  ability: (typeof ABILITIES)[AbilityId] | null,
): ThrowInput {
  let { angle, power } = asked;
  if (status.shaky || ability?.wobbleSelf === true) {
    angle += (randomAt(seed, DRAW_WOBBLE + id * 2) * 2 - 1) * WOBBLE_ANGLE;
    power += (randomAt(seed, DRAW_WOBBLE + id * 2 + 1) * 2 - 1) * WOBBLE_POWER;
  }
  if (status.rooted) {
    power = Math.min(power, ROOTED_POWER);
  }
  return {
    angle: Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle)),
    power: Math.min(1, Math.max(0, power)),
    ability: asked.ability,
  };
}

/** What the thrower's ability leaves on the opponent. */
function afflicted(
  status: Statuses,
  ability: (typeof ABILITIES)[AbilityId] | null,
  hit: boolean,
  shielded: boolean,
): Statuses {
  const effect = ability?.status;
  return {
    shield: status.shield && !shielded,
    frozen: status.frozen || effect === "freeze",
    shaky: status.shaky || effect === "shake",
    rooted: status.rooted || effect === "root",
    blind: status.blind || effect === "blind",
    burn: ability?.burnOnHit === true && hit ? BURN_TURNS : status.burn,
  };
}

/** A seat gives up; the other wins. */
function resign(game: DuelGame, seat: number): DuelGame | null {
  let next: DuelGame | null = null;
  if (game.phase !== "over") {
    const winner = 1 - seat;
    const champion = game.players[winner];
    next = {
      ...game,
      phase: "over",
      players: replace(game.players, winner, {
        ...champion,
        wins: champion.wins + 1,
      }),
      winner,
      endReason: "resign",
    };
  }
  return next;
}

/** A seat asks for another match; once both have, it begins. */
function rematch(game: DuelGame, seat: number): DuelGame | null {
  let next: DuelGame | null = null;
  if (game.phase === "over" && !game.players[seat].rematch) {
    const players = replace(game.players, seat, {
      ...game.players[seat],
      rematch: true,
    });
    next = players.every((p) => p.rematch)
      ? createGame(
          players.map((p) => p.name),
          nextSeed(game.seed),
          game.round + 1,
          players.map((p) => p.wins),
        )
      : { ...game, players };
  }
  return next;
}

/** Whether a throw's numbers are inside what is allowed. */
function isThrowInput(input: ThrowInput): boolean {
  return (
    Number.isFinite(input.angle) &&
    Number.isFinite(input.power) &&
    input.angle >= ANGLE_MIN &&
    input.angle <= ANGLE_MAX &&
    input.power >= 0 &&
    input.power <= 1 &&
    (input.ability === null || ABILITY_IDS.includes(input.ability))
  );
}

/** A copy of the list with one entry swapped. */
function replace(
  players: readonly DuelPlayer[],
  seat: number,
  player: DuelPlayer,
): DuelPlayer[] {
  return players.map((entry, index) => (index === seat ? player : entry));
}
