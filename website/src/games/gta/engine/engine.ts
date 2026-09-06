/**
 * The simulation: one {@link step} moves Los Santos on by a slice of time.
 *
 * @module
 * @remarks
 * Pure, like the rest of the collection: it never touches the DOM, the canvas
 * or the clock. React hands it the elapsed time and what the keys are doing,
 * and the same seed with the same keys plays out identically twice.
 *
 * The order inside a step is the order a street works in: the player first,
 * then the traffic and the people, then the police who react to all of it, and
 * only then the paperwork - stars cooling off, jobs paying out, districts
 * changing hands.
 */
import { districtAt, doorsOf, isOpen, isRoadAt, nearestCrossing } from "./city";
import { nextInt, nextRandom, type RandomState } from "./random";
import { DISTRICTS, far, jobDeadline, pickJob } from "./setup";
import {
  BUSTED_COST,
  CAR_ACCEL,
  CAR_BRAKE,
  CAR_DRAG,
  CAR_HEALTH,
  CAR_TURN,
  CAR_TURN_FLOOR,
  CAR_WIDTH,
  ANIMAL_TURN,
  BLAST_SECONDS,
  BRAKE_RANGE,
  BUST_CRAWL,
  BUST_SECONDS,
  BRAKE_WIDTH,
  BURN_SECONDS,
  CAT_WALK,
  CHEAT_DRIVE,
  CHEAT_WALK,
  CITY_SIZE,
  COOL_SECONDS,
  COPS_PER_CAR,
  COP_HEALTH,
  COP_RELOAD,
  COP_STOP,
  COP_WALK,
  CRASH_DAMAGE,
  CRASH_FLOOR,
  CRASH_PAUSE,
  DISTRICT_RESPECT,
  DOG_LEASH,
  HEAT_COOLS,
  HEAT_PER_STAR,
  DOG_WALK,
  BODY_SECONDS,
  CAR_STARS,
  CIVIL_STARS,
  FOE_DAMAGE,
  HELI_LOOK,
  TANK_STARS,
  HELI_DAMAGE,
  HELI_FALL,
  HELI_GLIDE,
  HELI_HEALTH,
  HELI_HOLD,
  HELI_RANGE,
  HELI_RELOAD,
  HELI_SPEED,
  HELI_STARS,
  BUMP_RANGE,
  FLOOR_SECONDS,
  KNOCK_SPEED,
  RUN_OVER_DAMAGE,
  BOARD_RANGE,
  BOARD_SECONDS,
  ENTER_RANGE,
  GARAGE_SEEN,
  GARAGE_RANGE,
  HOSPITAL_COST,
  JOBS_PER_DISTRICT,
  JOB_RESPECT,
  LOG_LINES,
  MARKER_RANGE,
  MAX_STARS,
  MAX_STEP,
  NEAR_RANGE,
  PATROL_EVERY,
  PERSON_RADIUS,
  PICKUP_BACK,
  PICKUP_RANGE,
  PLAYER_HEALTH,
  POLICE_MAX,
  POLICE_PER_STAR,
  POLICE_SPAWN_RANGE,
  POLICE_TOP_SPEED,
  REGEN_AFTER,
  REGEN_RATE,
  SAFE_SECONDS,
  SETTLE,
  SHOT_STARS,
  STRIDE,
  TRAFFIC_SPEED,
  WALK_SPEED,
  WITNESS_RANGE,
  type Bullet,
  type BulletFrom,
  type BulletShape,
  type Car,
  type Cell,
  type Cop,
  type GameState,
  type Input,
  type Job,
  type Person,
  type Pickup,
  type Player,
  type Heli,
  type Vec,
} from "./types";
import {
  GANG_HOLD,
  GANG_ROAM,
  GANG_RANGE,
  GANG_RELOAD,
  GANG_SPEED,
  COP_ARMS,
  KINDS,
  PANIC,
  type Side,
} from "./people";
import { VEHICLES, bodyRadius, type VehicleBody } from "./vehicles";
import {
  BLAST_RADIUS,
  GRENADE_FUSE,
  WEAPONS,
  carried,
  firedOne,
  fullBelt,
  nextWeapon,
  tookUp,
  type Weapon,
  type WeaponKind,
} from "./weapons";

/**
 * Moves the city on.
 *
 * @param state - where everything is now
 * @param input - what the keys are doing this frame
 * @param dt - how much time has passed, in seconds
 * @returns the city a moment later
 */
export function step(state: GameState, input: Input, dt: number): GameState {
  let next = state;
  if (state.phase === "playing") {
    const time = state.time + Math.min(dt, MAX_STEP);
    const slice = Math.min(dt, MAX_STEP);
    next = godMode({ ...state, time }, input);
    next = drivePlayer(next, input, slice);
    next = switchWeapon(next, input);
    next = shoot(next, input, slice);
    next = moveTraffic(next, slice);
    next = movePeople(next, slice);
    next = gangFire(next);
    next = moveAnimals(next, slice);
    next = runPolice(next, slice);
    next = flyHeli(next, slice);
    next = burnCars(next);
    next = hitThings(next);
    next = cornered(next, slice);
    next = takePickups(next);
    next = mend(next, slice);
    next = forget(next, slice);
    next = fadeBlasts(next);
    next = clearBodies(next);
    next = coolDown(next);
    next = runJob(next);
    next = checkGarage(next);
    next = checkEnd(next);
  }
  return next;
}

/* ------------------------------------------------------------------ player */

/** The player, on foot or behind a wheel. */
function drivePlayer(state: GameState, input: Input, dt: number): GameState {
  const used = input.use ? swapSeat(state) : state;
  return used.player.car === null
    ? walk(used, input, dt)
    : drive(used, input, dt);
}

/** Getting in or out. */
function swapSeat(state: GameState): GameState {
  let next: GameState;
  if (state.time < state.player.floorUntil) {
    next = state;
  } else if (state.player.car !== null) {
    next = leaveCar(state);
  } else {
    const near = nearestCar(state);
    next = near === null ? state : enterCar(state, near);
  }
  return next;
}

/** The closest car within reach, or null. */
function nearestCar(state: GameState): Car | null {
  let best: Car | null = null;
  let bestAway = ENTER_RANGE;
  for (const car of state.cars) {
    const away =
      far({ x: car.x, y: car.y }, state.player) - bodyRadius(car.body);
    if (away < bestAway && car.health > 0) {
      best = car;
      bestAway = away;
    }
  }
  return best;
}

/**
 * Taking a car.
 *
 * @remarks
 * A car standing at the kerb is nobody's business. One with somebody in it is a
 * carjacking, and the police take an interest at once - which is the whole
 * bargain of this game: the fast way of getting anywhere is the one that costs
 * you a star.
 */
function enterCar(state: GameState, car: Car): GameState {
  const jacked = car.kind === "traffic";
  const manned = car.kind === "police" && car.crew > 0;
  const withStar = jacked
    ? trouble(state, 1, "Autodiebstahl")
    : manned
      ? trouble(state, SHOT_STARS, "Einem Polizisten den Wagen weggenommen")
      : state;
  // Somebody still aboard is pulled out and left standing at the door. This
  // is the only way to a tank: they bring one at six stars, and taking it off
  // them is the whole of getting one.
  const thrown = manned ? throwOut(withStar, car) : withStar;
  return {
    ...thrown,
    player: { ...thrown.player, car: car.id, angle: car.angle },
    // The paint stays what it was. A patrol car one has taken is still a
    // patrol car - taking one is the point of taking one - and what stops it
    // from behaving like the law is the empty crew, not a change of livery.
    cars: thrown.cars.map((each) =>
      each.id === car.id ? { ...each, driven: true, crew: 0 } : each,
    ),
    log: note(
      thrown.log,
      jacked ? "Wagen geklaut." : manned ? "Rausgezerrt." : "Eingestiegen.",
    ),
  };
}

/**
 * Puts the crew of a vehicle out on the road beside it.
 *
 * @remarks
 * They land on their feet and angry rather than hurt: dragging a man out of a
 * car is not a way of killing him, and a policeman who appears already dead
 * would take the sting out of doing it.
 */
function throwOut(state: GameState, car: Car): GameState {
  const born: Cop[] = [];
  let id = state.cops.reduce((most, cop) => Math.max(most, cop.id), 0);
  for (let seat = 0; seat < car.crew; seat += 1) {
    id += 1;
    const side = seat === 0 ? 1 : -1;
    born.push({
      id,
      carId: car.id,
      x: car.x - Math.sin(car.angle) * CAR_WIDTH * side,
      y: car.y + Math.cos(car.angle) * CAR_WIDTH * side,
      angle: car.angle,
      walked: 0,
      health: COP_HEALTH,
      holds: COP_ARMS[(car.id + seat) % COP_ARMS.length] ?? "pistol",
      reloadAt: state.time + COP_RELOAD,
      burst: COP_BURST,
      stillUntil: null,
      boardAt: null,
    });
  }
  return { ...state, cops: [...state.cops, ...born] };
}

/** Getting out again, beside the car. */
function leaveCar(state: GameState): GameState {
  const car = carOf(state);
  return car === null
    ? state
    : {
        ...state,
        player: {
          ...state.player,
          car: null,
          x: car.x + Math.cos(car.angle + Math.PI / 2) * bodyRadius(car.body),
          y: car.y + Math.sin(car.angle + Math.PI / 2) * bodyRadius(car.body),
        },
        cars: state.cars.map((each) =>
          each.id === car.id ? { ...each, driven: false, speed: 0 } : each,
        ),
      };
}

/** The car the player is in, if any. */
export function carOf(state: GameState): Car | null {
  return state.cars.find((car) => car.id === state.player.car) ?? null;
}

/**
 * Walking: the four keys are the four directions, and the mouse is the face.
 *
 * @remarks
 * Where you go and where you look are two different questions on foot, and
 * splitting them is what lets somebody back away from a patrol car while still
 * pointing at it. Diagonals are normalised, or north-east would be a third
 * faster than north.
 */
function walk(state: GameState, input: Input, dt: number): GameState {
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const length = Math.hypot(dx, dy);
  const pace = WALK_SPEED * (input.boost ? CHEAT_WALK : 1);
  const step = length === 0 ? 0 : (pace * dt) / length;
  const want = slide(state.cells, state.player, dx * step, dy * step);
  // Bodywork is solid: neither the player nor anybody on the pavement walks
  // through a car. And whoever is flat on the tarmac is not walking at all.
  const moved =
    state.time < state.player.floorUntil || blocked(state, want, state.player)
      ? { x: state.player.x, y: state.player.y }
      : want;
  const aimed = Math.atan2(input.aim.y - moved.y, input.aim.x - moved.x);
  const looking =
    input.aim.x === 0 && input.aim.y === 0 ? state.player.angle : aimed;
  const went = Math.hypot(moved.x - state.player.x, moved.y - state.player.y);
  const walked: GameState = {
    ...state,
    player: {
      ...state.player,
      ...moved,
      angle: looking,
      heading: length === 0 ? state.player.heading : Math.atan2(dy, dx),
      walked: stridden(state.player.walked, went, dt),
      movedAt: went > 0 ? state.time : state.player.movedAt,
    },
  };
  const speed = dt === 0 ? 0 : went / dt;
  return runOver(shovePeople(walked, speed), speed);
}

/**
 * Walking into bodywork: a bump, unless somebody is going fast enough.
 *
 * @param pace - how fast the player is actually moving, in pixels a second
 * @remarks
 * Traffic brakes for people in the road, so standing in front of a car is
 * safe and walking into one is a bump - {@link blocked} has already stopped
 * the step. What is not safe is **running at it**, or being where a car is
 * already going too fast to stop: either way the player ends up on the tarmac
 * with a hole in their health and has to get back up.
 */
function runOver(state: GameState, pace: number): GameState {
  const player = state.player;
  const hit = state.cars.find(
    (car) =>
      car.id !== player.car &&
      (Math.abs(car.speed) > KNOCK_SPEED || pace > KNOCK_SPEED) &&
      far(player, car) < bodyRadius(car.body) + PERSON_RADIUS,
  );
  return hit === undefined || state.time < player.floorUntil
    ? state
    : hurt(
        {
          ...state,
          player: { ...player, floorUntil: state.time + FLOOR_SECONDS },
        },
        RUN_OVER_DAMAGE,
        "Angefahren worden.",
      );
}

/**
 * Whether a car stands where somebody wants to put their feet.
 *
 * @param want - where they mean to step
 * @param from - where they are now
 * @returns true if a car is in the way
 * @remarks
 * Whoever is already inside a car's outline - shoved there by a crash, or
 * standing where one parked - may still move, as long as the move takes them
 * further out. Otherwise a badly parked car would pin somebody for good.
 */
function blocked(state: GameState, want: Vec, from: Vec): boolean {
  let hit = false;
  for (const car of state.cars) {
    if (car.id !== state.player.car) {
      const reach = bodyRadius(car.body) + BUMP_RANGE / 2;
      if (far(want, car) < reach && far(want, car) <= far(from, car)) {
        hit = true;
      }
    }
  }
  return hit;
}

/**
 * People the player has walked into: they step aside, or they go over.
 *
 * @param pace - how fast the player is actually moving, in pixels a second
 * @remarks
 * Two different things, and the pace decides which. At a walk they are shoved
 * a little to one side, the way one is shouldered on a crowded pavement. Above
 * {@link KNOCK_SPEED} they are knocked off their feet and have to get up
 * again. Neither costs them any health: this is a shoulder, not a weapon.
 */
function shovePeople(state: GameState, pace: number): GameState {
  const player = state.player;
  let touched = false;
  const people = state.people.map((person) => {
    let after = person;
    const inTheWay =
      person.mood !== "down" &&
      person.mood !== "floored" &&
      far(person, player) < BUMP_RANGE;
    if (inTheWay) {
      touched = true;
      const away = Math.atan2(person.y - player.y, person.x - player.x);
      const hard = pace > KNOCK_SPEED;
      const pushed = slide(
        state.cells,
        person,
        Math.cos(away) * (hard ? KNOCK_BACK : SHOVE_BACK),
        Math.sin(away) * (hard ? KNOCK_BACK : SHOVE_BACK),
      );
      after = hard
        ? {
            ...person,
            ...pushed,
            mood: "floored",
            stillUntil: state.time + FLOOR_SECONDS,
          }
        : { ...person, ...pushed };
    }
    return after;
  });
  return touched ? { ...state, people } : state;
}

/** How far a shoulder moves somebody standing in the way, in pixels. */
const SHOVE_BACK = 3;

/** And how far being run at throws them. */
const KNOCK_BACK = 9;

/**
 * The walk cycle, carried on by however far a figure actually moved.
 *
 * @param walked - how far it had walked before
 * @param went - how far it moved this step, in pixels
 * @param dt - how much time that took, in seconds
 * @returns the new reading of the cycle
 * @remarks
 * Standing still does not freeze the cycle where it is: it runs on to the next
 * point where the feet are together and stops there. Walking into a wall counts
 * as standing, because the feet are not going anywhere either.
 */
function stridden(walked: number, went: number, dt: number): number {
  let next: number;
  if (went > 0) {
    next = walked + went;
  } else {
    const half = STRIDE / 2;
    const rest = Math.round(walked / half) * half;
    const close = SETTLE * dt;
    next =
      Math.abs(rest - walked) <= close
        ? rest
        : walked + Math.sign(rest - walked) * close;
  }
  return next;
}

/** Driving: the pedals move the car, the wheel only bites above walking pace. */
function drive(state: GameState, input: Input, dt: number): GameState {
  const car = carOf(state);
  let next = state;
  if (car !== null) {
    // Shift lifts both the ceiling and the pedal: a car that accelerates as
    // slowly as before would spend the whole street getting up to the cheat.
    const boost = input.boost ? CHEAT_DRIVE : 1;
    const shape = VEHICLES[car.body];
    const top = shape.top * boost;
    // A wreck has no engine left. The brake still works, and so does the drag:
    // it rolls out and then stands there, which is the moment to get out.
    const dead = car.health <= 0;
    const push =
      (input.up && !dead ? shape.accel * boost : 0) -
      (input.down ? CAR_BRAKE : 0);
    const drag = Math.sign(car.speed) * CAR_DRAG;
    const raw = car.speed + (push - (input.up || input.down ? 0 : drag)) * dt;
    const speed = Math.max(-top / 2, Math.min(top, raw));
    const grip = Math.min(1, Math.abs(speed) / CAR_TURN_FLOOR);
    const turn = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const angle =
      car.angle + turn * shape.turn * grip * Math.sign(speed || 1) * dt;
    const moved = slideCar(state.cells, car, angle, speed, dt);
    // The turret looks where the mouse looks, not where the tracks point.
    // Straight away rather than swinging round: the shell is meant to land on
    // the crosshair, and a turret that lags puts it somewhere else.
    const turret = Math.atan2(input.aim.y - moved.y, input.aim.x - moved.x);
    next = {
      ...state,
      cars: state.cars.map((each) =>
        each.id === car.id ? { ...each, ...moved, angle, turret } : each,
      ),
      player: {
        ...state.player,
        x: moved.x,
        y: moved.y,
        angle,
      },
    };
    // A wall costs bodywork too. With the driver safe in his seat, driving into
    // a house has to cost something, or the shortest way anywhere would be
    // through one.
    const smacked =
      moved.speed === 0 &&
      Math.abs(speed) > CRASH_FLOOR &&
      state.time >= state.player.crashUntil;
    if (smacked) {
      next = damageCar(
        next,
        car.id,
        Math.min(Math.abs(speed), shape.top) * CRASH_DAMAGE * WALL_SHARE,
      );
      next = {
        ...next,
        player: { ...next.player, crashUntil: state.time + CRASH_PAUSE },
      };
    }
  }
  return next;
}

/** How much of a car-to-car crash a wall does - it does not hit back. */
const WALL_SHARE = 0.6;

/** Moves a car, stopping it dead against a wall. */
function slideCar(
  cells: readonly Cell[],
  car: Car,
  angle: number,
  speed: number,
  dt: number,
): { x: number; y: number; speed: number } {
  const dx = Math.cos(angle) * speed * dt;
  const dy = Math.sin(angle) * speed * dt;
  const moved = slide(cells, car, dx, dy);
  // Stopped dead, rather than merely scraping along a wall: a car that got
  // less than half the way it wanted hit something head on.
  const went = Math.hypot(moved.x - car.x, moved.y - car.y);
  const blocked = speed !== 0 && went < Math.hypot(dx, dy) / 2;
  return { ...moved, speed: blocked ? 0 : speed };
}

/**
 * Moves a body, one axis at a time and in short hops.
 *
 * @remarks
 * Axis by axis, so a car that clips a corner slides along the wall instead of
 * stopping dead. Anybody who has driven a corner too fast in this sort of game
 * knows the difference between the two.
 *
 * In hops of at most {@link HOP} pixels, because only the end of a move is
 * tested against the city: one long jump would step clean over a wall and put
 * the player inside a block, where every way out is blocked as well. At walking
 * and driving pace one hop is enough - with Shift held it is a dozen.
 */
function slide(
  cells: readonly Cell[],
  body: Vec,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const hops = Math.max(1, Math.ceil(Math.hypot(dx, dy) / HOP));
  let at = { x: body.x, y: body.y };
  for (let hop = 0; hop < hops; hop += 1) {
    at = nudge(cells, at, dx / hops, dy / hops);
  }
  return at;
}

/**
 * A way to head that does not walk into the side of a house.
 *
 * @param from - where the walker is
 * @param want - the direction they would take if the city were empty
 * @param reach - how far ahead to look, in pixels
 * @returns the direction to take instead
 * @remarks
 * Not a route: a glance. The straight line is tried first, then the same line
 * turned a little to one side, then the other, and so on out to a right angle.
 * The first one that is clear for `reach` pixels wins.
 *
 * That is enough for this city, because the city is a grid: whatever is in the
 * way is one block, and hugging its wall gets you round the corner. It is also
 * why the offsets are tried **left first, always** - a walker who picks a side
 * consistently goes round; one who picks the nearer side each frame stands in
 * front of the wall shuffling.
 */
function steerRound(
  cells: readonly Cell[],
  from: Vec,
  want: number,
  reach: number,
): number {
  let best = want;
  let found = false;
  for (const off of LOOKS) {
    if (!found) {
      const turned = want + off;
      let clear = true;
      for (let out = LOOK_STEP; out <= reach; out += LOOK_STEP) {
        if (
          !isOpen(
            cells,
            from.x + Math.cos(turned) * out,
            from.y + Math.sin(turned) * out,
          )
        ) {
          clear = false;
        }
      }
      if (clear) {
        best = turned;
        found = true;
      }
    }
  }
  return best;
}

/**
 * How many steps to either side of straight ahead a walker will look.
 *
 * @remarks
 * Straight ahead first, then out to a right angle either side. Nothing beyond
 * that: somebody who would have to turn round to get closer is better off
 * pressing at the wall until the chase moves on.
 */
const LOOK_WIDE = 3;

/** The offsets themselves, straight ahead first and then out either side. */
const LOOKS: readonly number[] = Array.from(
  { length: LOOK_WIDE * 2 + 1 },
  (unused, at) => {
    // 0, +1, -1, +2, -2 ... in eighths of a half turn.
    const step = Math.ceil(at / 2) * (at % 2 === 0 ? -1 : 1);
    return (step * Math.PI) / (LOOK_WIDE * 2);
  },
);

/** How finely the look-ahead is sampled, in pixels. */
const LOOK_STEP = 10;

/** How far one hop of a {@link slide} may carry, in pixels. */
const HOP = 12;

/** One hop of a {@link slide}, kept inside the city. */
function nudge(
  cells: readonly Cell[],
  body: Vec,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const stepX = { x: body.x + dx, y: body.y };
  const okX = isOpen(cells, stepX.x, stepX.y) ? stepX.x : body.x;
  const stepY = { x: okX, y: body.y + dy };
  const okY = isOpen(cells, stepY.x, stepY.y) ? stepY.y : body.y;
  return {
    x: Math.max(0, Math.min(CITY_SIZE, okX)),
    y: Math.max(0, Math.min(CITY_SIZE, okY)),
  };
}

/* ----------------------------------------------------------------- shots */

/**
 * Pulling the trigger, and what is already in the air.
 *
 * @remarks
 * On foot only. A drive-by is a different game: it wants a second hand on the
 * wheel, and a car that shoots while it drives turns every chase into target
 * practice.
 *
 * What leaves the hand depends only on the row in {@link WEAPONS}: a swing
 * reaches out and touches whatever is in front, everything else is put in the
 * air and left to fly.
 */
function shoot(state: GameState, input: Input, dt: number): GameState {
  const player = state.player;
  const gun = WEAPONS[player.weapon];
  const seat = carOf(state);
  const turret = seat !== null && VEHICLES[seat.body].gun;
  const armed = player.car === null && carried(player.ammo, player.weapon);
  const ready =
    input.fire &&
    state.time >= player.reloadAt &&
    state.time >= player.floorUntil &&
    (armed || turret);
  let next = state;
  if (ready && turret && seat !== null) {
    // The one thing that shoots from a seat, because the seat is a tank.
    next = fireShell(state, seat, input.aim);
    next = {
      ...next,
      player: { ...next.player, reloadAt: state.time + SHELL_RELOAD },
    };
  } else if (ready) {
    next =
      gun.way === "swing" ? swing(state, gun) : launch(state, gun, input.aim);
    next = {
      ...next,
      player: {
        ...next.player,
        reloadAt: state.time + gun.reload,
        ammo: firedOne(next.player.ammo, player.weapon),
      },
    };
  }
  return flyBullets(next, dt);
}

/**
 * A fist or a knife: whatever is in front, within arm's length.
 *
 * @param state - the city
 * @param gun - the weapon in the hand
 * @returns the city with the nearest thing in front hit
 */
function swing(state: GameState, gun: Weapon): GameState {
  const player = state.player;
  state = {
    ...state,
    player: { ...player, punches: player.punches + 1 },
  };
  const tip = {
    x: player.x + Math.cos(player.angle) * gun.range,
    y: player.y + Math.sin(player.angle) * gun.range,
  };
  const person = state.people.find(
    (each) => each.mood !== "down" && far(each, tip) < gun.range,
  );
  const cop = state.cops.find(
    (each) => each.health > 0 && far(each, tip) < gun.range,
  );
  let next = state;
  if (cop !== undefined) {
    next = hurtCop(next, cop.id, gun.damage);
    next = wanted(next, SHOT_STARS, "Auf einen Polizisten losgegangen");
  } else if (person !== undefined) {
    next = hurtPerson(next, person.id, gun.damage);
    next = startFeud(next, KINDS[person.kind].side);
    next = trouble(next, 1, "Jemanden niedergeschlagen");
  }
  return startle(next, player, PUNCH_HEARD);
}

/**
 * Everything that is not a swing: a bullet, a lick of fire, a rocket, a
 * grenade.
 *
 * @param state - the city
 * @param gun - the weapon in the hand
 * @returns the city with one more thing in the air
 */
function launch(state: GameState, gun: Weapon, aim: Vec): GameState {
  const player = state.player;
  const draw = nextRandom(state.rng);
  const off = (draw.value - HALF) * gun.spread * 2;
  const angle = player.angle + off;
  const shape: BulletShape =
    gun.kind === "flamer"
      ? "flame"
      : gun.kind === "rpg"
        ? "rocket"
        : gun.kind === "grenade"
          ? "grenade"
          : "shot";
  const fired: GameState = {
    ...state,
    rng: draw.state,
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: player.x + Math.cos(angle) * MUZZLE,
        y: player.y + Math.sin(angle) * MUZZLE,
        angle,
        // A grenade lands where it was thrown at, not as far as the arm
        // reaches: whatever is nearer, the crosshair or the end of the throw.
        left:
          shape === "grenade"
            ? Math.min(gun.range, Math.max(0, far(player, aim) - MUZZLE))
            : gun.range,
        speed: gun.speed,
        damage: gun.damage,
        shape,
        from: "player",
        blowAt: shape === "grenade" ? state.time + GRENADE_FUSE : null,
      },
    ],
  };
  return startle(fired, player, EARSHOT);
}

/** Seconds between two rounds from the tank. */
const SHELL_RELOAD = 1.6;

/** What a tank round takes off at the middle of the blast. */
const SHELL_FORCE = 120;

/** How fast a shell travels, and how far it goes. */
const SHELL_SPEED = 540;

/**
 * How far a shell carries, in pixels.
 *
 * @remarks
 * Further than the screen is wide at any zoom, which is what "a tank reaches
 * everything you can see" means in numbers. It is a ceiling and no more: the
 * shell goes off where the crosshair is, not out here.
 */
const SHELL_RANGE = 2400;

/**
 * The tank's gun.
 *
 * @remarks
 * It fires where the tank points, not where the mouse does. There is no turret
 * that turns on its own here - lining the whole thing up is what a tank asks
 * of you, and it is what makes a tank feel like a tank rather than a heavy car.
 */
function fireShell(state: GameState, tank: Car, aim: Vec): GameState {
  const angle = tank.turret;
  const fired: GameState = {
    ...state,
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: state.player.x + Math.cos(angle) * SHELL_MUZZLE,
        y: state.player.y + Math.sin(angle) * SHELL_MUZZLE,
        angle,
        // It goes off on the crosshair. The range is only the ceiling, and it
        // is set high enough that a tank shoots as far as one can see.
        left: Math.min(
          SHELL_RANGE,
          Math.max(0, far(state.player, aim) - SHELL_MUZZLE),
        ),
        speed: SHELL_SPEED,
        damage: SHELL_FORCE,
        shape: "rocket",
        from: "player",
        blowAt: null,
      },
    ],
    log: state.log,
  };
  return startle(fired, state.player, BLAST_HEARD);
}

/** How far in front of the tank a shell appears - clear of its own nose. */
const SHELL_MUZZLE = 44;

/** The id the next shot gets. */
function nextBulletId(state: GameState): number {
  return state.bullets.reduce((most, shot) => Math.max(most, shot.id), 0) + 1;
}

/** How far in front of the shooter a shot is born, in pixels. */
const MUZZLE = 12;

/** The middle of a draw between zero and one: spread goes both ways from it. */
const HALF = 0.5;

/** How close a shot has to pass to count as a hit, in pixels. */
const SHOT_HIT = 12;

/** And how close for the helicopter, which is a good deal bigger. */
const HELI_HIT = 30;

/**
 * The spot on the road a shot has to cross to hit the helicopter.
 *
 * @remarks
 * Not where it is - where it **looks**. The machine is painted its own height
 * above the point it hovers over, so the crosshair one lays on it lands that
 * far north of that point, and a shot fired at the crosshair passed harmlessly
 * underneath. Aiming at what one can see is the only rule a player will ever
 * guess at, so the hit is tested there instead.
 */
function heliAim(heli: Heli): Vec {
  return { x: heli.x, y: heli.y - HELI_LOOK };
}

/**
 * Moves everything in the air, and lets it hit what it runs into.
 *
 * @remarks
 * One loop for four kinds of thing, because they differ in three numbers and
 * one question: what happens where they stop. A bullet takes its damage off
 * whatever it touched; a rocket or a grenade goes off instead, and the blast
 * does the rest.
 */
function flyBullets(state: GameState, dt: number): GameState {
  let next = state;
  const alive: Bullet[] = [];
  for (const shot of state.bullets) {
    const step = shot.speed * dt;
    const x = shot.x + Math.cos(shot.angle) * step;
    const y = shot.y + Math.sin(shot.angle) * step;
    const left = shot.left - step;
    const mine = shot.from === "player";
    const wall = !isOpen(next.cells, x, y);
    const fused = shot.blowAt !== null && next.time >= shot.blowAt;
    const person = next.people.find(
      (each) =>
        each.mood !== "down" &&
        hits(shot.from, KINDS[each.kind].side) &&
        far(each, { x, y }) < SHOT_HIT,
    );
    const cop = mine
      ? next.cops.find(
          (each) => each.health > 0 && far(each, { x, y }) < SHOT_HIT,
        )
      : undefined;
    const heli =
      mine &&
      next.heli !== null &&
      next.heli.fallAt === null &&
      far(heliAim(next.heli), { x, y }) < HELI_HIT
        ? next.heli
        : null;
    const onPlayer =
      shot.from !== "player" &&
      shot.from !== "mine" &&
      next.player.car === null &&
      far(next.player, { x, y }) < SHOT_HIT;
    const car = next.cars.find(
      (each) =>
        each.id !== next.player.car &&
        far(each, { x, y }) < bodyRadius(each.body),
    );
    const struck =
      person !== undefined ||
      cop !== undefined ||
      heli !== null ||
      onPlayer ||
      car !== undefined;
    const spent = left <= 0 || wall;
    if (shot.shape === "rocket" || shot.shape === "grenade") {
      // These two do not care what they touched, only that they stopped.
      if (struck || spent || fused) {
        next = blast(next, { x, y }, shot.damage);
      } else {
        alive.push({ ...shot, x, y, left });
      }
    } else if (heli !== null) {
      const left = heli.health - shot.damage;
      next = {
        ...next,
        heli: { ...heli, health: left },
        log:
          left > 0 ? next.log : note(next.log, "Der Hubschrauber geht runter."),
      };
    } else if (cop !== undefined) {
      next = hurtCop(next, cop.id, shot.damage);
      next = wanted(next, SHOT_STARS, "Auf einen Polizisten geschossen");
    } else if (person !== undefined) {
      next = hurtPerson(next, person.id, shot.damage);
      if (mine) {
        next = startFeud(next, KINDS[person.kind].side);
        next = trouble(
          next,
          KINDS[person.kind].side === "rival" ? 1 : SHOT_STARS,
          `Auf ${KINDS[person.kind].name} geschossen`,
        );
      }
    } else if (onPlayer) {
      next = hurt(next, shot.damage, "Getroffen worden.");
    } else if (car !== undefined) {
      next = damageCar(next, car.id, shot.damage * CAR_TOUGHNESS);
      next =
        car.kind === "police" && mine
          ? wanted(next, 1, "Auf die Polizei geschossen")
          : next;
    } else if (!spent) {
      alive.push({ ...shot, x, y, left });
    }
  }
  return { ...next, bullets: alive };
}

/**
 * Whether a shot from one side may hit somebody on another.
 *
 * @param from - who fired
 * @param side - whose side the person in the way is on
 * @returns true when that shot can hurt that person
 * @remarks
 * The player hits anybody - that is his business. The gangs hit each other and
 * nobody else, which is what makes a gang war something you can walk past.
 * The police shoot only at the player.
 */
function hits(from: BulletFrom, side: Side): boolean {
  let can: boolean;
  if (from === "player") {
    can = true;
  } else if (from === "mine") {
    can = side === "rival";
  } else if (from === "rival") {
    can = side === "mine";
  } else {
    can = false;
  }
  return can;
}

/**
 * The moment a gang decides the player is a problem.
 *
 * @param state - the city
 * @param side - whose member was just shot
 * @returns the city with that gang at war, if it was not already
 * @remarks
 * One shot is enough, and it is the player's shot: nothing else starts this.
 * The green shirts come in on your side as soon as the orange ones are at war
 * with you - not because they are told to, but because their enemy now has
 * something to do.
 */
function startFeud(state: GameState, side: Side): GameState {
  let next = state;
  if (side !== "none" && !state.feud[side]) {
    next = {
      ...state,
      feud: { ...state.feud, [side]: true },
      log: note(
        state.log,
        side === "rival"
          ? "Die gegnerische Bande hat es auf dich abgesehen."
          : "Deine eigene Bande dreht durch.",
      ),
    };
  }
  return next;
}

/** Damage on somebody in the street; at zero they go down for a while. */
function hurtPerson(state: GameState, id: number, amount: number): GameState {
  const dying = state.people.find(
    (person) =>
      person.id === id && person.mood !== "down" && person.health - amount <= 0,
  );
  const after =
    dying === undefined ? state : dropArms(state, dying, dying.holds);
  return {
    ...after,
    people: after.people.map((person) => {
      let after = person;
      if (person.id === id) {
        const health = person.health - amount;
        after =
          health > 0
            ? { ...person, health }
            : {
                ...person,
                mood: "down",
                stillUntil: state.time + BODY_SECONDS,
                holds: null,
                health: KINDS[person.kind].health,
              };
      }
      return after;
    }),
  };
}

/**
 * What falls out of a dead man's hand, lying where he fell.
 *
 * @param state - the city
 * @param at - where he went down
 * @param holds - what he was carrying, or null for somebody unarmed
 * @returns the city with that on the ground
 * @remarks
 * It does not come back once taken - it was his, not the city's. This is where
 * most of the heavy weaponry comes from now that so little of it lies about:
 * whoever wants a machine gun takes it off somebody who had one.
 */
function dropArms(
  state: GameState,
  at: Vec,
  holds: WeaponKind | null,
): GameState {
  return holds === null || WEAPONS[holds].rounds === 0
    ? state
    : {
        ...state,
        pickups: [
          ...state.pickups,
          {
            id:
              state.pickups.reduce((most, drop) => Math.max(most, drop.id), 0) +
              1,
            x: at.x,
            y: at.y,
            holds,
            backAt: null,
            again: false,
          },
        ],
      };
}

/** How much of a shot's damage a car's bodywork feels. */
const CAR_TOUGHNESS = 1.2;

/**
 * An explosion: everything close to it takes something, the nearer the more.
 *
 * @param state - the city
 * @param at - where it went off
 * @param force - what the very centre of it takes off
 * @returns the city afterwards, with the flash left to be drawn
 */
function blast(state: GameState, at: Vec, force: number): GameState {
  let next: GameState = startle(state, at, BLAST_HEARD);
  next = {
    ...next,
    blasts: [
      ...state.blasts,
      {
        id: state.blasts.reduce((most, each) => Math.max(most, each.id), 0) + 1,
        x: at.x,
        y: at.y,
        at: state.time,
      },
    ],
  };
  const share = (thing: Vec) =>
    Math.max(0, 1 - far(thing, at) / BLAST_RADIUS) * force;
  for (const car of next.cars) {
    const hit = share(car);
    if (hit > 0) {
      next = damageCar(next, car.id, hit);
    }
  }
  for (const cop of next.cops) {
    const hit = share(cop);
    if (hit > 0 && cop.health > 0) {
      next = hurtCop(next, cop.id, hit);
    }
  }
  const flying = next.heli;
  if (flying !== null && share(heliAim(flying)) > 0) {
    next = {
      ...next,
      heli: { ...flying, health: flying.health - share(heliAim(flying)) },
    };
  }
  const knocked = next.people.filter(
    (each) => each.mood !== "down" && share(each) > 0,
  );
  for (const each of knocked) {
    next = hurtPerson(next, each.id, share(each));
  }
  next =
    knocked.length > 0 ? trouble(next, SHOT_STARS, "Es hat gekracht") : next;
  const own = share(next.player);
  return own > 0 ? hurt(next, own, "In eine Explosion geraten.") : next;
}

/** Explosions are kept only long enough to be drawn, then dropped. */
function fadeBlasts(state: GameState): GameState {
  const alive = state.blasts.filter(
    (each) => state.time - each.at < BLAST_SECONDS,
  );
  return alive.length === state.blasts.length
    ? state
    : { ...state, blasts: alive };
}

/**
 * Damage on the player: the vest takes it first, then the health.
 *
 * @param state - the city
 * @param amount - how much
 * @param why - the line for the log, or null to say nothing
 * @returns the city with the player a little worse off
 * @remarks
 * The cheat is checked here rather than at every one of the dozen places that
 * can hurt somebody. One door in, one guard on it.
 */
function hurt(state: GameState, amount: number, why: string | null): GameState {
  if (state.player.god || amount <= 0) {
    return state;
  }
  const onVest = Math.min(state.player.armour, amount);
  const onSelf = amount - onVest;
  return {
    ...state,
    player: {
      ...state.player,
      armour: state.player.armour - onVest,
      health: Math.max(0, state.player.health - onSelf),
      hurtAt: state.time,
    },
    log: why === null ? state.log : note(state.log, why),
  };
}

/** Damage on a policeman, who leaves when he has had enough. */
function hurtCop(state: GameState, id: number, amount: number): GameState {
  const dying = state.cops.find(
    (cop) => cop.id === id && cop.health > 0 && cop.health - amount <= 0,
  );
  const after =
    dying === undefined ? state : dropArms(state, dying, dying.holds);
  return {
    ...after,
    cops: after.cops.map((cop) => {
      let after = cop;
      if (cop.id === id && cop.health > 0) {
        const health = cop.health - amount;
        after =
          health > 0
            ? { ...cop, health }
            : {
                ...cop,
                health: 0,
                stillUntil: state.time + BODY_SECONDS,
                boardAt: null,
              };
      }
      return after;
    }),
  };
}

/**
 * Damage on a car, and the fire it starts.
 *
 * @param state - the city
 * @param id - which car
 * @param amount - how much bodywork it costs
 * @returns the city with that car worse off, and alight if it is far enough
 *   gone
 */
function damageCar(state: GameState, id: number, amount: number): GameState {
  // Nothing touches the car the cheat is driving. Being unkillable on foot and
  // then dying because the bodywork ran out is not being unkillable.
  if (state.player.god && id === state.player.car) {
    return state;
  }
  return {
    ...state,
    cars: state.cars.map((car) => {
      let after = car;
      if (car.id === id) {
        const health = Math.max(0, car.health - amount);
        after = {
          ...car,
          health,
          // The clock starts when the bodywork is gone, not before: up to then
          // the bar in the corner is the whole warning.
          fireAt: car.fireAt === null && health <= 0 ? state.time : car.fireAt,
        };
      }
      return after;
    }),
  };
}

/**
 * Burning cars, and what they do when the fire reaches the tank.
 *
 * @remarks
 * The one thing in this game that kills the player in a car. Crashes take the
 * bodywork, not the driver - but a car alight is a clock, and the answer to a
 * clock is a door handle.
 */
function burnCars(state: GameState): GameState {
  let next = state;
  for (const car of state.cars) {
    if (car.fireAt !== null && next.time >= car.fireAt + BURN_SECONDS) {
      const driving = next.player.car === car.id;
      next = {
        ...next,
        cars: next.cars.filter((each) => each.id !== car.id),
        player: driving ? { ...next.player, car: null } : next.player,
      };
      next = blast(next, car, BLAST_FORCE);
      next = driving
        ? {
            ...next,
            player: { ...next.player, health: 0 },
            log: note(next.log, "Der Wagen ist explodiert."),
          }
        : { ...next, log: note(next.log, "Ein Wagen ist explodiert.") };
    }
  }
  return next;
}

/** What a car takes with it when it goes off. */
const BLAST_FORCE = 85;

/* ----------------------------------------------------------------- traffic */

/** Traffic drives itself: straight on, and a new heading at the crossings. */
function moveTraffic(state: GameState, dt: number): GameState {
  let rng = state.rng;
  const cars = state.cars.map((car) => {
    let next = car;
    const rolling = car.health > 0;
    if (
      !car.driven &&
      rolling &&
      car.kind === "traffic" &&
      near(state.player, car)
    ) {
      const turning = state.time >= car.turnAt;
      const draw = turning ? nextInt(rng, HEADINGS) : { value: 0, state: rng };
      rng = draw.state;
      const angle = turning ? (draw.value * Math.PI) / 2 : car.angle;
      // They brake for you. A city where crossing the road is a coin toss is a
      // city you drive through rather than walk in - and being run over by
      // somebody else's Sunday driver is not a death anybody learns from.
      const pace = inTheWay(state, car, angle) ? 0 : TRAFFIC_SPEED;
      const moved = slideCar(state.cells, car, angle, pace, dt);
      const stuck = moved.speed === 0;
      next = {
        ...car,
        ...moved,
        angle,
        turnAt: turning || stuck ? state.time + TURN_EVERY : car.turnAt,
      };
    }
    return next;
  });
  return { ...state, cars, rng };
}

/**
 * Whether the player is standing in front of a moving car.
 *
 * @param state - the city
 * @param car - the car
 * @param angle - the way it is about to go
 * @returns true when it should stop rather than drive on
 * @remarks
 * A corridor, not a circle: what matters is what is *ahead* of the bonnet.
 * Somebody walking along the pavement beside the car is not in the way.
 */
function inTheWay(state: GameState, car: Car, angle: number): boolean {
  if (state.player.car !== null) {
    return false;
  }
  const dx = state.player.x - car.x;
  const dy = state.player.y - car.y;
  const ahead = dx * Math.cos(angle) + dy * Math.sin(angle);
  const aside = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
  return ahead > 0 && ahead < BRAKE_RANGE && aside < BRAKE_WIDTH;
}

/** How long a computer driver holds a heading, in seconds. */
const TURN_EVERY = 2.5;

/** How many ways a car can turn at a crossing: the four points of the compass. */
const HEADINGS = 4;

/** Whether something is close enough to bother simulating. */
function near(player: Player, thing: Vec): boolean {
  return far(player, thing) < NEAR_RANGE;
}

/* ------------------------------------------------------------------ people */

/** People wander, flee what frightens them, and get up again. */
function movePeople(state: GameState, dt: number): GameState {
  let rng = state.rng;
  const people = state.people.map((person) => {
    let next = person;
    if (near(state.player, person)) {
      const walked = walkPerson(person, state, rng, dt);
      rng = walked.rng;
      next = walked.person;
    }
    return next;
  });
  return { ...state, people, rng };
}

/**
 * One person's step: a stroll, a run, a nap, or a gang fight.
 *
 * @remarks
 * Four different lives out of one function, because they differ only in where
 * the feet are pointed. Somebody sitting against a wall stays there; a gang
 * member walks towards whoever is on the other side and stops to shoot;
 * everybody else wanders and runs when it gets loud.
 */
function walkPerson(
  person: Person,
  state: GameState,
  rng: RandomState,
  dt: number,
): { person: Person; rng: RandomState } {
  let next = person;
  let state2 = rng;
  const sort = KINDS[person.kind];
  if (person.mood === "down") {
    // Whoever is down stays down. Clearing the body away is somebody else's
    // job - see {@link clearBodies} - and it happens to the whole list at once
    // rather than one person at a time.
    next = person;
  } else if (person.mood === "floored") {
    // Knocked over rather than killed: they get back up.
    next =
      state.time >= person.stillUntil ? { ...person, mood: "walking" } : person;
  } else if (person.mood === "sitting") {
    // They stay where they are. That is the whole point of them.
    next = person;
  } else {
    const foe = sort.armed ? enemyOf(state, person) : null;
    const scare = state.time < person.scaredAt;
    const away = Math.atan2(
      person.y - state.player.y,
      person.x - state.player.x,
    );
    const turning = state.time >= person.turnAt;
    const draw = turning ? nextRandom(state2) : { value: 0, state: state2 };
    state2 = draw.state;
    // A gang member who has drifted off his corner heads back to it. It is the
    // only reason anybody in this city walks anywhere on purpose, and it is
    // what keeps a crew a crew.
    const home = person.home;
    const strayed =
      home !== null && foe === null && !scare && far(person, home) > GANG_ROAM;
    const heading =
      foe !== null
        ? Math.atan2(foe.y - person.y, foe.x - person.x)
        : scare
          ? away
          : strayed
            ? Math.atan2(home.y - person.y, home.x - person.x)
            : turning
              ? draw.value * Math.PI * 2
              : person.heading;
    // A gang member closes in and then stands still to shoot; the frightened
    // run; everybody else strolls.
    const speed =
      foe !== null
        ? far(person, foe) > GANG_HOLD
          ? sort.walk
          : 0
        : scare
          ? sort.walk * PANIC
          : sort.walk;
    const want = slide(
      state.cells,
      person,
      Math.cos(heading) * speed * dt,
      Math.sin(heading) * speed * dt,
    );
    const moved = blocked(state, want, person)
      ? { x: person.x, y: person.y }
      : want;
    const stuck = moved.x === person.x && moved.y === person.y;
    const went = Math.hypot(moved.x - person.x, moved.y - person.y);
    next = {
      ...person,
      ...moved,
      heading,
      mood: foe === null && scare ? "fleeing" : "walking",
      turnAt: turning || stuck ? state.time + PERSON_TURN_EVERY : person.turnAt,
      walked: stridden(person.walked, went, dt),
    };
  }
  return { person: next, rng: state2 };
}

/**
 * Who an armed person is currently interested in.
 *
 * @param state - the city
 * @param person - the one holding the gun
 * @returns the nearest thing on the other side, or null if nothing is close
 * @remarks
 * The rival gang counts the player as one of the other side; your own gang does
 * not. That is what "my gang" means here - not that they follow you about, but
 * that their fight and your fight point the same way.
 */
function enemyOf(state: GameState, person: Person): Vec | null {
  const side = KINDS[person.kind].side;
  if (side === "none") {
    return null;
  }
  const foes: Vec[] = [];
  // The other gang, but only once the war is on. Nobody draws first: until the
  // player shoots a gang member, the shirts are just shirts.
  if (state.feud.rival) {
    for (const each of state.people) {
      const other = KINDS[each.kind].side;
      if (each.mood !== "down" && other !== "none" && other !== side) {
        foes.push({ x: each.x, y: each.y });
      }
    }
  }
  // And the player, if this side has a quarrel with him in particular.
  const afterPlayer = side === "rival" ? state.feud.rival : state.feud.mine;
  if (afterPlayer && state.player.car === null) {
    foes.push({ x: state.player.x, y: state.player.y });
  }
  let best: Vec | null = null;
  let bestAway = GANG_RANGE;
  for (const foe of foes) {
    const away = far(person, foe);
    if (away < bestAway) {
      best = foe;
      bestAway = away;
    }
  }
  return best;
}

/** Every gang member who has somebody in front of them takes a shot. */
function gangFire(state: GameState): GameState {
  let next = state;
  for (const person of state.people) {
    const sort = KINDS[person.kind];
    if (
      sort.armed &&
      person.mood === "walking" &&
      next.time >= person.reloadAt
    ) {
      const foe = enemyOf(next, person);
      const gun = WEAPONS[person.holds ?? "pistol"];
      if (foe !== null && far(person, foe) < gun.range) {
        // A knuckleduster is not fired: whoever carries one has to be close
        // enough to reach, and then he simply hits.
        next =
          gun.way === "swing"
            ? gangHit(next, person, foe, gun)
            : gangShot(next, person, foe, gun);
      }
    }
  }
  return next;
}

/**
 * One blow from a gang member with something in his fist.
 *
 * @remarks
 * No bullet: the man he is standing next to takes it there and then. Only the
 * player can be hit this way - a brawl between two gangs at arm's length is a
 * thing nobody would see the end of.
 */
function gangHit(
  state: GameState,
  person: Person,
  foe: Vec,
  gun: Weapon,
): GameState {
  const angle = Math.atan2(foe.y - person.y, foe.x - person.x);
  const swung: GameState = {
    ...state,
    people: state.people.map((each) =>
      each.id === person.id
        ? { ...each, reloadAt: state.time + GANG_RELOAD, heading: angle }
        : each,
    ),
  };
  const onPlayer =
    swung.player.car === null && far(swung.player, foe) < SHOT_HIT;
  return onPlayer
    ? hurt(swung, gun.damage * FOE_DAMAGE, "Getroffen worden.")
    : startle(swung, person, PUNCH_HEARD);
}

/** One shot from one gang member. */
function gangShot(
  state: GameState,
  person: Person,
  foe: Vec,
  gun: Weapon,
): GameState {
  const draw = nextRandom(state.rng);
  const angle =
    Math.atan2(foe.y - person.y, foe.x - person.x) +
    (draw.value - HALF) * GANG_SPREAD;
  const side = KINDS[person.kind].side;
  const fired: GameState = {
    ...state,
    rng: draw.state,
    people: state.people.map((each) =>
      each.id === person.id
        ? { ...each, reloadAt: state.time + GANG_RELOAD, heading: angle }
        : each,
    ),
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: person.x + Math.cos(angle) * MUZZLE,
        y: person.y + Math.sin(angle) * MUZZLE,
        angle,
        left: gun.range,
        speed: GANG_SPEED,
        damage: gun.damage * FOE_DAMAGE,
        shape: "shot",
        from: side === "mine" ? "mine" : "rival",
        blowAt: null,
      },
    ],
  };
  return startle(fired, person, EARSHOT);
}

/** How wide a gang member misses by, in radians. */
const GANG_SPREAD = 0.18;

/* ------------------------------------------------------------------ animals */

/**
 * Cats and dogs.
 *
 * @remarks
 * The difference between the two is one line: a dog has somebody it belongs to
 * and heads back to them, a cat has nobody and heads wherever it just decided.
 * Neither can be hurt and neither hurts anybody - they are the part of the city
 * that is simply alive.
 */
function moveAnimals(state: GameState, dt: number): GameState {
  let rng = state.rng;
  const animals = state.animals.map((beast) => {
    let next = beast;
    if (near(state.player, beast)) {
      const owner =
        beast.ownerId === null
          ? undefined
          : state.people.find((each) => each.id === beast.ownerId);
      const turning = state.time >= beast.turnAt;
      const draw = turning ? nextRandom(rng) : { value: 0, state: rng };
      rng = draw.state;
      let heading = beast.heading;
      let pace = 0;
      if (owner !== undefined) {
        const away = far(beast, owner);
        heading =
          away > DOG_LEASH
            ? Math.atan2(owner.y - beast.y, owner.x - beast.x)
            : turning
              ? draw.value * Math.PI * 2
              : beast.heading;
        pace =
          away > DOG_LEASH ? DOG_WALK : away > DOG_LEASH / 2 ? 0 : CAT_WALK;
      } else {
        heading = turning ? draw.value * Math.PI * 2 : beast.heading;
        pace = CAT_WALK;
      }
      const moved = slide(
        state.cells,
        beast,
        Math.cos(heading) * pace * dt,
        Math.sin(heading) * pace * dt,
      );
      const stuck = moved.x === beast.x && moved.y === beast.y;
      next = {
        ...beast,
        ...moved,
        heading,
        walked: beast.walked + far(moved, beast),
        turnAt: turning || stuck ? state.time + ANIMAL_TURN : beast.turnAt,
      };
    }
    return next;
  });
  return { ...state, animals, rng };
}

/**
 * Everybody near enough to have noticed something loud runs for a while.
 *
 * @param state - the city
 * @param at - where the noise came from
 * @param range - how far it carried, in pixels
 * @returns the city with those people frightened
 * @remarks
 * This is the whole of what a witness is. Fear used to be read off the player -
 * near him and he has a star, so run - which meant that a man who had been
 * shopping two streets away bolted the moment the player walked past him with
 * an old star. Now the noise marks whoever was there, they keep the mark for
 * {@link SCARE_SECONDS}, and everybody else never learns of it.
 *
 * Whoever is sitting against a wall gets up for this. Somebody staying
 * cross-legged through a shooting is the same bug the other way round.
 */
function startle(state: GameState, at: Vec, range: number): GameState {
  const until = state.time + SCARE_SECONDS;
  return {
    ...state,
    people: state.people.map((person) =>
      person.mood === "down" || far(person, at) > range
        ? person
        : { ...person, mood: "walking", scaredAt: until },
    ),
  };
}

/**
 * How far a shot is noticed, in pixels.
 *
 * @remarks
 * About a screenful. Further would have people running from something they
 * cannot see, which is the very thing this is meant to stop.
 */
const EARSHOT = 300;

/** How far a fist fight is noticed - it is a good deal quieter than a gun. */
const PUNCH_HEARD = 120;

/** And an explosion, which the whole street hears. */
const BLAST_HEARD = 520;

/** How long somebody runs after being frightened, in seconds. */
const SCARE_SECONDS = 6;

/** How long somebody holds a direction, in seconds. */
const PERSON_TURN_EVERY = 3;

/* ------------------------------------------------------------------ police */

/** The law: cars that come out per star, and give chase. */
function runPolice(state: GameState, dt: number): GameState {
  // Wrecks do not count as police: take one out and the next is sent, but only
  // after a while. That gap is the whole of "shake them off and drive away".
  // How much law is already on the scene. A patrol car counts only while
  // somebody can drive it - wrecked, or with its crew shot on the pavement, it
  // is scenery, and the next patrol is sent instead of it. **The men on the
  // pavement count too**: two who got out of a car are still two policemen,
  // and sending another car because their car no longer counts is how one ends
  // up surrounded by an endless supply of them.
  const onDuty =
    state.cars.filter(
      (car) => car.kind === "police" && car.health > 0 && car.crew > 0,
    ).length +
    Math.ceil(state.cops.filter((cop) => cop.health > 0).length / COPS_PER_CAR);
  const want = Math.min(POLICE_MAX, state.player.stars * POLICE_PER_STAR);
  let next = state;
  if (onDuty < want && state.time >= state.patrolAt) {
    next = { ...callPolice(next), patrolAt: state.time + PATROL_EVERY };
  }
  const cars = next.cars.map((car) =>
    car.kind === "police" && !car.driven ? chase(next, car, dt) : car,
  );
  next = { ...next, cars };
  next = openDoors(next);
  return moveCops(next, dt);
}

/**
 * Patrol cars that have pulled up beside a player on foot let their men out.
 *
 * @remarks
 * This is the whole difference between the police here and a bad driver. On
 * foot they do not run you down: they park, get out and shoot. In a car they
 * never get out - a chase is a chase.
 */
function openDoors(state: GameState): GameState {
  let next = state;
  if (state.player.car === null && state.player.stars > 0) {
    for (const car of state.cars) {
      const parked =
        car.kind === "police" &&
        car.crew > 0 &&
        !car.driven &&
        far(car, state.player) < COP_STOP;
      if (parked) {
        next = unload(next, car);
      }
    }
  }
  return next;
}

/** Two men out of one car, one at each door. */
function unload(state: GameState, car: Car): GameState {
  const born: Cop[] = [];
  let id = state.cops.reduce((most, cop) => Math.max(most, cop.id), 0);
  for (let door = 0; door < COPS_PER_CAR; door += 1) {
    id += 1;
    const side = door === 0 ? 1 : -1;
    born.push({
      id,
      carId: car.id,
      x: car.x - Math.sin(car.angle) * CAR_WIDTH * side,
      y: car.y + Math.cos(car.angle) * CAR_WIDTH * side,
      angle: car.angle,
      walked: 0,
      health: COP_HEALTH,
      holds: COP_ARMS[(car.id + door) % COP_ARMS.length] ?? "pistol",
      reloadAt: state.time + COP_RELOAD,
      burst: COP_BURST,
      stillUntil: null,
      boardAt: null,
    });
  }
  return {
    ...state,
    cars: state.cars.map((each) =>
      each.id === car.id ? { ...each, crew: 0 } : each,
    ),
    cops: [...state.cops, ...born],
    log: note(state.log, "Die Polizei steigt aus."),
  };
}

/**
 * Policemen on foot: they close in, then stand and shoot.
 *
 * @remarks
 * They stop short rather than walking into the player, because a man standing
 * on your toes cannot be aimed at, and being surrounded by men who shove is not
 * a gunfight.
 */
function moveCops(state: GameState, dt: number): GameState {
  let next = state;
  const cops = state.cops.map((cop) =>
    cop.health > 0 ? walkCop(next, cop, dt) : cop,
  );
  next = { ...next, cops };
  for (const cop of next.cops) {
    const gun = WEAPONS[cop.holds];
    const canShoot =
      cop.health > 0 &&
      next.player.car === null &&
      far(cop, next.player) < gun.range &&
      next.time >= cop.reloadAt;
    if (canShoot) {
      // A baton is swung, not fired: the man with one has to walk right up.
      next =
        gun.way === "swing" ? copHit(next, cop, gun) : copShot(next, cop, gun);
    }
  }
  next = boardCars(next);
  // Nobody stands about once the search is over: whoever is still on his feet
  // gets back into the car he came out of, so that car is on duty again rather
  // than left standing empty for good. A body stays where it fell until
  // {@link clearBodies} takes it.
  return next.player.stars === 0
    ? putAboard(
        next,
        next.cops.filter((cop) => cop.health > 0),
      )
    : next;
}

/**
 * One policeman's step: after the player, or back to his own car.
 *
 * @remarks
 * Two jobs, and which one it is depends only on where the player is. On foot
 * he is chased on foot - a man running down the street is caught by men running
 * after him, not by a car parked round the corner. The moment the player is
 * behind a wheel the men are useless on foot, so they turn round, walk back to
 * their car and get in; the car takes over from there.
 */
function walkCop(state: GameState, cop: Cop, dt: number): Cop {
  const home = state.cars.find((car) => car.id === cop.carId);
  const chasing = state.player.car === null && state.player.stars > 0;
  const goal =
    chasing || home === undefined || home.health <= 0 ? state.player : home;
  const away = far(cop, goal);
  const gun = WEAPONS[cop.holds];
  const reach = gun.way === "swing" ? gun.range * SWING_ROOM : COP_HOLD;
  const hold = chasing ? reach : BOARD_RANGE;
  const straight = Math.atan2(goal.y - cop.y, goal.x - cop.x);
  const angle = steerRound(state.cells, cop, straight, WALK_LOOK);
  const step = away > hold ? COP_WALK * dt : 0;
  const moved = slide(
    state.cells,
    cop,
    Math.cos(angle) * step,
    Math.sin(angle) * step,
  );
  // Standing at the door of his own car with nobody to chase on foot: that is
  // when the clock for climbing in starts.
  const atDoor = !chasing && goal !== state.player && away <= BOARD_RANGE;
  return {
    ...cop,
    ...moved,
    angle,
    walked: cop.walked + step,
    boardAt: atDoor ? (cop.boardAt ?? state.time + BOARD_SECONDS) : null,
  };
}

/** Whoever has finished climbing in is aboard, and off the pavement. */
function boardCars(state: GameState): GameState {
  return putAboard(
    state,
    state.cops.filter(
      (cop) =>
        cop.health > 0 && cop.boardAt !== null && state.time >= cop.boardAt,
    ),
  );
}

/**
 * Puts these men back in their cars and takes them off the street.
 *
 * @param who - the ones going aboard, all of them alive
 * @returns the city with those cars crewed again
 * @remarks
 * Two ways in - climbing in at the door, and the whole search being called off
 * - and both mean the same thing to the car, so they share this.
 */
function putAboard(state: GameState, who: readonly Cop[]): GameState {
  return who.length === 0
    ? state
    : {
        ...state,
        cars: state.cars.map((car) => {
          const back = who.filter((cop) => cop.carId === car.id).length;
          return back === 0
            ? car
            : { ...car, crew: Math.min(COPS_PER_CAR, car.crew + back) };
        }),
        cops: state.cops.filter((cop) => !who.includes(cop)),
      };
}

/** How close a policeman comes before he stops and takes aim, in pixels. */
const COP_HOLD = 110;

/**
 * How much of a swung weapon's reach the man carrying it stops at.
 *
 * @remarks
 * Inside it rather than at the very edge: standing at exactly arm's length
 * means every step the player takes puts him out of it again.
 */
const SWING_ROOM = 0.7;

/** One blow from a policeman with a baton, close enough to land it. */
function copHit(state: GameState, cop: Cop, gun: Weapon): GameState {
  const angle = Math.atan2(state.player.y - cop.y, state.player.x - cop.x);
  const swung: GameState = {
    ...state,
    cops: state.cops.map((each) =>
      each.id === cop.id
        ? { ...each, reloadAt: state.time + COP_RELOAD, angle }
        : each,
    ),
  };
  return hurt(swung, gun.damage * FOE_DAMAGE, "Der Schlagstock hat gesessen.");
}

/** One shot from one policeman. */
function copShot(state: GameState, cop: Cop, gun: Weapon): GameState {
  const draw = nextRandom(state.rng);
  const angle =
    Math.atan2(state.player.y - cop.y, state.player.x - cop.x) +
    (draw.value - HALF) * COP_SPREAD;
  // Three shots and then a pause: a policeman who never stops firing is a
  // hose, and there is no crossing a street against a hose.
  const left = cop.burst - 1;
  const fired: GameState = {
    ...state,
    rng: draw.state,
    cops: state.cops.map((each) =>
      each.id === cop.id
        ? {
            ...each,
            reloadAt: state.time + (left > 0 ? COP_RELOAD : COP_PAUSE),
            burst: left > 0 ? left : COP_BURST,
            angle,
          }
        : each,
    ),
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: cop.x + Math.cos(angle) * MUZZLE,
        y: cop.y + Math.sin(angle) * MUZZLE,
        angle,
        left: gun.range,
        speed: COP_BULLET_SPEED,
        damage: gun.damage * FOE_DAMAGE,
        shape: "shot",
        from: "police",
        blowAt: null,
      },
    ],
  };
  return startle(fired, cop, EARSHOT);
}

/** How far ahead somebody on foot looks for a wall, in pixels. */
const WALK_LOOK = 40;

/** And a car, which needs longer to do anything about it. */
const DRIVE_LOOK = 120;

/** How many shots a policeman fires before he has to reload. */
const COP_BURST = 3;

/** And how long that reload takes, in seconds. */
const COP_PAUSE = 1.7;

/** How wide a policeman misses by, in radians. */
const COP_SPREAD = 0.12;

/** How fast a police bullet travels. */
const COP_BULLET_SPEED = 620;

/** One more patrol car, out of sight of the player. */
function callPolice(state: GameState): GameState {
  const draw = nextRandom(state.rng);
  const angle = draw.value * Math.PI * 2;
  const at = {
    x: state.player.x + Math.cos(angle) * POLICE_SPAWN_RANGE,
    y: state.player.y + Math.sin(angle) * POLICE_SPAWN_RANGE,
  };
  const spot = isRoadAt(state.cells, at.x, at.y)
    ? at
    : nearestCrossing(at.x, at.y);
  const id = state.cars.reduce((most, car) => Math.max(most, car.id), 0) + 1;
  // What they send goes up with the stars. One star is a traffic offence and
  // gets a man on a motorbike; from two on the cars come out as well; at six
  // they send the tank, which is also the only tank in the game.
  const body = pickPatrol(state, id);
  return {
    ...state,
    rng: draw.state,
    cars: [
      ...state.cars,
      {
        id,
        kind: "police",
        body,
        x: spot.x,
        y: spot.y,
        angle,
        speed: 0,
        colour: 0,
        crew: VEHICLES[body].seats,
        turret: 0,
        health: CAR_HEALTH,
        driven: false,
        turnAt: 0,
        fireAt: null,
      },
    ],
  };
}

/**
 * The helicopter: sent at five stars, gone when the search is over.
 *
 * @remarks
 * It ignores the city altogether - no wall, no road, no traffic - which is the
 * whole point of it: the one thing in this game that cannot be shaken off by
 * turning a corner. What it cannot do is stop you, only wear you down, so it
 * hovers at a distance and fires down rather than trying to land on you.
 */
function flyHeli(state: GameState, dt: number): GameState {
  let next = state;
  const wanted = state.player.stars >= HELI_STARS;
  if (state.heli === null && wanted) {
    next = {
      ...state,
      heli: {
        // In from the side of the picture, so that it is seen arriving.
        x: state.player.x + HELI_COMES,
        y: state.player.y - HELI_COMES,
        angle: 0,
        spin: 0,
        health: HELI_HEALTH,
        reloadAt: state.time + HELI_RELOAD,
        fallAt: null,
      },
      log: note(state.log, "Ein Hubschrauber ist in der Luft."),
    };
  } else if (state.heli !== null && state.heli.fallAt !== null) {
    next = fallHeli(state, state.heli, dt);
  } else if (state.heli !== null && state.heli.health <= 0) {
    // Hit: it does not blink out, it catches fire and starts down.
    next = {
      ...state,
      heli: { ...state.heli, fallAt: state.time },
      log: note(state.log, "Der Hubschrauber brennt und geht runter."),
    };
  } else if (state.heli !== null && !wanted) {
    next = { ...state, heli: null };
  } else if (state.heli !== null) {
    next = steerHeli({ ...state, heli: state.heli }, state.heli, dt);
  }
  return next;
}

/**
 * A burning helicopter on its way down.
 *
 * @remarks
 * It keeps the heading it was hit on and carries on at a glide, so the fall is
 * a diagonal across the sky rather than a stone dropping. How far down it has
 * come is read out of the clock by the renderer; here it only travels, spins
 * ever slower, and goes off where it arrives.
 */
function fallHeli(state: GameState, heli: Heli, dt: number): GameState {
  const gone = heli.fallAt === null ? 0 : state.time - heli.fallAt;
  const step = HELI_GLIDE * dt;
  const flown: Heli = {
    ...heli,
    x: heli.x + Math.cos(heli.angle) * step,
    y: heli.y + Math.sin(heli.angle) * step,
    // The rotor winds down as it falls, which is most of what says "burning"
    // at this size.
    spin: heli.spin + ROTOR_SPIN * dt * Math.max(0, 1 - gone / HELI_FALL),
  };
  return gone >= HELI_FALL
    ? blast({ ...state, heli: null }, { x: flown.x, y: flown.y }, HELI_BLAST)
    : { ...state, heli: flown };
}

/** One step of the helicopter: closing in, turning, and firing down. */
function steerHeli(state: GameState, heli: Heli, dt: number): GameState {
  const away = far(heli, state.player);
  const angle = Math.atan2(state.player.y - heli.y, state.player.x - heli.x);
  const step = away > HELI_HOLD ? HELI_SPEED * dt : 0;
  const flown: Heli = {
    ...heli,
    x: heli.x + Math.cos(angle) * step,
    y: heli.y + Math.sin(angle) * step,
    angle,
    spin: heli.spin + ROTOR_SPIN * dt,
  };
  const shooting =
    state.player.car === null &&
    away < HELI_RANGE &&
    state.time >= heli.reloadAt;
  return shooting
    ? heliShot({ ...state, heli: flown }, flown)
    : { ...state, heli: flown };
}

/** One shot down from the helicopter. */
function heliShot(state: GameState, heli: Heli): GameState {
  const draw = nextRandom(state.rng);
  const angle =
    Math.atan2(state.player.y - heli.y, state.player.x - heli.x) +
    (draw.value - HALF) * COP_SPREAD;
  const fired: GameState = {
    ...state,
    rng: draw.state,
    heli: { ...heli, reloadAt: state.time + HELI_RELOAD },
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: heli.x + Math.cos(angle) * MUZZLE,
        y: heli.y + Math.sin(angle) * MUZZLE,
        angle,
        left: HELI_RANGE,
        speed: COP_BULLET_SPEED,
        damage: HELI_DAMAGE * FOE_DAMAGE,
        shape: "shot",
        from: "police",
        blowAt: null,
      },
    ],
  };
  return startle(fired, heli, EARSHOT);
}

/** What the helicopter takes with it when it comes down. */
const HELI_BLAST = 70;

/** How far out the helicopter comes in from, in pixels. */
const HELI_COMES = 420;

/** How fast the rotor turns, in radians a second. */
const ROTOR_SPIN = 26;

/**
 * Which sort of vehicle the next patrol arrives in.
 *
 * @param id - the id it will have, which is what makes the choice vary
 * @returns the body to send
 * @remarks
 * A ladder rather than a dice roll, so that the star count reads off the
 * street: a bike alone, then bikes and cars together, and at the top of the
 * scale the tank. Every second patrol from two stars up is a bike, because a
 * chase made only of saloons all handling alike is one chase repeated.
 */
function pickPatrol(state: GameState, id: number): VehicleBody {
  let body: VehicleBody = "bike";
  if (state.player.stars >= TANK_STARS && !state.cars.some(isPoliceTank)) {
    body = "tank";
  } else if (state.player.stars >= CAR_STARS && id % 2 === 0) {
    body = "car";
  }
  return body;
}

/** Whether this is a patrol tank still in the hands of the police. */
function isPoliceTank(car: Car): boolean {
  return car.kind === "police" && car.body === "tank" && car.health > 0;
}

/**
 * A patrol car going after the player.
 *
 * @remarks
 * It steers towards the player rather than following the streets: a chase that
 * obeyed the road grid would be a chase that never catches anybody, and a car that
 * mounts the kerb is what the source material does too.
 */
function chase(state: GameState, car: Car, dt: number): Car {
  let next = car;
  // Beside the player on foot, not on top of him: close enough for the doors,
  // and then the handbrake.
  const holding =
    state.player.car === null && far(car, state.player) < COP_STOP;
  if (car.health <= 0) {
    // A wrecked patrol car chases nobody; it rolls to a stop like any other.
    next = car.speed === 0 ? car : { ...car, speed: car.speed * WRECK_ROLL };
  } else if (car.crew === 0) {
    // Nobody at the wheel: the men are out on the pavement, or were shot
    // there. Either way this car waits for them.
    next = car.speed === 0 ? car : { ...car, speed: 0 };
  } else if (holding) {
    next = car.speed === 0 ? car : { ...car, speed: 0 };
  } else if (state.player.stars > 0 && near(state.player, car)) {
    const straight = Math.atan2(state.player.y - car.y, state.player.x - car.x);
    const want = steerRound(state.cells, car, straight, DRIVE_LOOK);
    const turn = Math.max(
      -CAR_TURN * dt,
      Math.min(CAR_TURN * dt, angleTo(car.angle, want)),
    );
    const angle = car.angle + turn;
    const speed = Math.min(POLICE_TOP_SPEED, car.speed + CAR_ACCEL * dt);
    const moved = slideCar(state.cells, car, angle, speed, dt);
    next = { ...car, ...moved, angle };
  } else if (car.speed !== 0) {
    next = { ...car, speed: 0 };
  }
  return next;
}

/** How much of its speed a wrecked car keeps each frame as it rolls out. */
const WRECK_ROLL = 0.9;

/** The shortest way round from one angle to another. */
function angleTo(from: number, to: number): number {
  const raw = (to - from) % (Math.PI * 2);
  return raw > Math.PI
    ? raw - Math.PI * 2
    : raw < -Math.PI
      ? raw + Math.PI * 2
      : raw;
}

/* ------------------------------------------------------------------ crashes */

/** Everything that touches something else this frame. */
function hitThings(state: GameState): GameState {
  const car = carOf(state);
  return car === null ? onFoot(state) : inCar(state, car);
}

/** Running people over, and crashing into cars. */
function inCar(state: GameState, car: Car): GameState {
  let next = state;
  const hitting = Math.abs(car.speed) > CRASH_FLOOR;
  // People first: they are the reason the police come.
  const runOver = state.people.filter(
    (person) =>
      person.mood !== "down" &&
      far(person, car) < bodyRadius(car.body) + PERSON_RADIUS,
  );
  if (runOver.length > 0) {
    const ids = new Set(runOver.map((person) => person.id));
    next = {
      ...next,
      people: next.people.map((person) =>
        ids.has(person.id)
          ? { ...person, mood: "down", stillUntil: state.time + BODY_SECONDS }
          : person,
      ),
    };
    next = trouble(next, 1, "Passant angefahren");
  }
  // Then metal on metal: both cars take it, and the player's own bodywork too.
  // Either side may be the fast one - a patrol car ramming a parked player is
  // a crash as much as the other way round, and without that a chase could be
  // sat out with the handbrake on.
  const crashed =
    state.time < state.player.crashUntil
      ? []
      : next.cars.filter(
          (other) =>
            other.id !== car.id &&
            far(other, car) < bodyRadius(car.body) + bodyRadius(other.body) &&
            (hitting || Math.abs(other.speed) > CRASH_FLOOR),
        );
  if (crashed.length > 0) {
    const police = crashed.some((other) => other.kind === "police");
    // **No bodywork changes hands.** Cars stop each other and bounce apart,
    // and that is all: driving is how one gets about this city, and a game
    // that writes the car off over a few kerbs makes getting about the game.
    // What still costs bodywork is a wall - see {@link drive} - and gunfire.
    for (const other of crashed) {
      next = {
        ...next,
        cars: next.cars.map((each) =>
          each.id === other.id ? { ...each, speed: 0 } : each,
        ),
      };
    }
    next = {
      ...next,
      cars: next.cars.map((each) =>
        each.id === car.id
          ? { ...each, speed: -Math.sign(car.speed) * CRASH_BOUNCE }
          : each,
      ),
      player: { ...next.player, crashUntil: state.time + CRASH_PAUSE },
    };
    // A star for ramming a patrol car - but only when the player was the
    // faster of the two, and not again within a few seconds. Without both,
    // being surrounded by police was a machine for making stars: they drove
    // into the player, the player got the star, and the cool-off never began.
    const rammed = crashed.some(
      (other) =>
        other.kind === "police" && Math.abs(car.speed) > Math.abs(other.speed),
    );
    next =
      police && rammed && state.time >= state.player.rammedUntil
        ? {
            ...wanted(next, 1, "Streifenwagen gerammt"),
            player: {
              ...wanted(next, 1, "Streifenwagen gerammt").player,
              rammedUntil: state.time + RAM_PAUSE,
            },
          }
        : next;
  }
  return next;
}

/** How hard a crash throws a car back, in pixels per second. */
const CRASH_BOUNCE = 60;

/** How long after ramming a patrol car the next ram is free, in seconds. */
const RAM_PAUSE = 6;

/** How close a patrol car has to be to keep the search alive, in pixels. */
const SEEN_RANGE = 480;

/**
 * On foot: nothing takes you in.
 *
 * @remarks
 * Traffic brakes for you (see {@link inTheWay}) and a policeman beside you
 * reaches for his gun, not for handcuffs. Walking past the law is dangerous,
 * but it is not an arrest - being run to a standstill in a car is, and that is
 * {@link cornered}.
 */
function onFoot(state: GameState): GameState {
  return state;
}

/** How close the law has to be to a stopped car to be holding it, in pixels. */
const BUST_RANGE = 110;

/** How long somebody on foot has to stand still before it counts, in seconds. */
const BUST_STILL = 0.6;

/**
 * The one road into the cells: a car brought to a stop and held there.
 *
 * @param state - the city
 * @param dt - how much time has passed
 * @returns the city, and the cell if they have held the car long enough
 * @remarks
 * The clock only runs while three things are true at once - wanted, standing
 * still, and the law right there. Drive off, shake them, or simply walk, and it
 * resets. That makes an arrest something you can see coming and do something
 * about, which an arrest by proximity never was.
 *
 * On foot as well as in a car now: somebody who stands in a ring of policemen
 * doing nothing gets taken, the same as somebody boxed in at the kerb. The
 * cheat is never taken - being unarrestable is part of being untouchable.
 */
function cornered(state: GameState, dt: number): GameState {
  const car = carOf(state);
  const at = car ?? { x: state.player.x, y: state.player.y };
  // Standing still is the whole condition: in a car that means below a crawl,
  // on foot it means not walking. Somebody who keeps moving is never taken,
  // however many of them are round him.
  const still =
    car === null
      ? state.time >= state.player.movedAt + BUST_STILL
      : Math.abs(car.speed) < BUST_CRAWL;
  const held =
    state.player.stars > 0 &&
    !state.player.god &&
    state.time >= state.player.safeUntil &&
    still &&
    (state.cars.some(
      (each) => onWatch(state, each) && far(each, at) < BUST_RANGE,
    ) ||
      state.cops.some(
        (cop) => cop.health > 0 && far(cop, at) < BUST_RANGE / 2,
      ));
  const pinned = held ? state.player.pinned + dt : 0;
  let next: GameState = { ...state, player: { ...state.player, pinned } };
  if (pinned >= BUST_SECONDS) {
    next = busted({ ...next, player: { ...next.player, pinned: 0 } });
  } else if (held && state.player.pinned === 0) {
    next = { ...next, log: note(next.log, "Sie haben dich eingekesselt.") };
  }
  return next;
}

/**
 * Weapons and vests lying about, and the health that comes back on its own.
 *
 * @remarks
 * The city puts its own kit out. Nothing is bought, everything is found - which
 * is what makes a walk down a side street worth taking. What is taken comes
 * back after a while in the same place, so the map stays worth knowing.
 */
function takePickups(state: GameState): GameState {
  let next = state;
  const taken: number[] = [];
  if (state.player.car === null) {
    for (const drop of state.pickups) {
      if (drop.backAt === null && far(drop, state.player) < PICKUP_RANGE) {
        taken.push(drop.id);
        next = pickUp(next, drop);
      }
    }
  }
  const pickups = next.pickups
    // Whatever does not come back is gone for good the moment it is taken.
    .filter((drop) => drop.again || !taken.includes(drop.id))
    .map((drop) => {
      let after = drop;
      if (taken.includes(drop.id)) {
        after = { ...drop, backAt: next.time + PICKUP_BACK };
      } else if (drop.backAt !== null && next.time >= drop.backAt) {
        after = { ...drop, backAt: null };
      }
      return after;
    });
  return { ...next, pickups };
}

/** What one pickup does for the player. */
function pickUp(state: GameState, drop: Pickup): GameState {
  let next: GameState;
  if (drop.holds === "armour") {
    next = {
      ...state,
      player: { ...state.player, armour: PLAYER_HEALTH },
      log: note(state.log, "Rüstung aufgenommen."),
    };
  } else {
    next = {
      ...state,
      player: {
        ...state.player,
        ammo: tookUp(state.player.ammo, drop.holds),
        // Straight into the hand: nobody picks a rocket launcher up in order
        // to carry on punching.
        weapon: drop.holds,
      },
      log: note(state.log, `${WEAPONS[drop.holds].name} aufgenommen.`),
    };
  }
  return next;
}

/**
 * Health growing back once nothing has hit the player for a while.
 *
 * @remarks
 * The vest does not grow back - that one has to be found again. Health does,
 * because the alternative in a game with no shops is a slow bleed to death
 * from a fight won half an hour ago.
 */
function mend(state: GameState, dt: number): GameState {
  const rest = state.time - state.player.hurtAt;
  const hurt = state.player.health < PLAYER_HEALTH;
  return rest > REGEN_AFTER && hurt
    ? {
        ...state,
        player: {
          ...state.player,
          health: Math.min(
            PLAYER_HEALTH,
            state.player.health + REGEN_RATE * dt,
          ),
        },
      }
    : state;
}

/**
 * The second cheat: nothing hurts, and the belt is full.
 *
 * @remarks
 * Held rather than toggled in the state, so that switching it off in the middle
 * of a firefight does what it looks like it does.
 */
function godMode(state: GameState, input: Input): GameState {
  const on = input.god;
  let next = state;
  if (on) {
    next = {
      ...state,
      player: {
        ...state.player,
        god: true,
        ammo: fullBelt(),
        armour: PLAYER_HEALTH,
        health: PLAYER_HEALTH,
      },
    };
  } else if (state.player.god) {
    next = { ...state, player: { ...state.player, god: false } };
  }
  return next;
}

/** The wheel: the next weapon that is actually in the belt. */
function switchWeapon(state: GameState, input: Input): GameState {
  return input.wheel === 0
    ? state
    : {
        ...state,
        player: {
          ...state.player,
          weapon: nextWeapon(
            state.player.ammo,
            state.player.weapon,
            input.wheel,
          ),
        },
      };
}

/* -------------------------------------------------------------- the ledger */

/** Raising the wanted level, and saying why. */
/**
 * Trouble that nobody in uniform has necessarily seen.
 *
 * @param state - the city
 * @param weight - how loud it was, in points of heat
 * @param why - the line for the log, when it turns into a star
 * @returns the city, with either a star or a little more heat
 * @remarks
 * The whole of the new wanted level. Hitting somebody in an empty street is not
 * a police matter: it adds heat, and only {@link HEAT_PER_STAR} points of it
 * bring a star. But if a patrol car or a policeman is close enough to see it,
 * the first one counts - and so does anything done to the police themselves,
 * which goes through {@link wanted} directly.
 *
 * Everything through here stops at {@link CIVIL_STARS}. The helicopter and the
 * tank are answers to somebody shooting at policemen, not to somebody being a
 * menace on the pavement - and a top of the scale one can wander into by
 * running people over is not a top of the scale.
 */
function trouble(state: GameState, weight: number, why: string): GameState {
  if (witnessed(state)) {
    return wanted(state, 1, why, CIVIL_STARS);
  }
  const heat = state.player.heat + weight;
  if (heat >= HEAT_PER_STAR) {
    return wanted(
      { ...state, player: { ...state.player, heat: 0 } },
      1,
      why,
      CIVIL_STARS,
    );
  }
  // Said out loud even when nothing comes of it, so that "no star" reads as a
  // rule of the city rather than as a bug.
  return {
    ...state,
    player: { ...state.player, heat },
    log: note(state.log, `${why} - niemand hat es gesehen.`),
  };
}

/** Whether anybody in uniform is close enough to see what just happened. */
function witnessed(state: GameState): boolean {
  const near = (thing: Vec) => far(thing, state.player) < WITNESS_RANGE;
  return (
    state.cars.some((car) => onWatch(state, car) && near(car)) ||
    state.cops.some((cop) => cop.health > 0 && near(cop))
  );
}

/**
 * Whether this car is a patrol car that is actually watching anything.
 *
 * @remarks
 * Wrecked ones see nothing, and neither does the one the player has taken -
 * without that last part, driving a stolen patrol car would be a permanent
 * witness sitting in one's own seat.
 */
function onWatch(state: GameState, car: Car): boolean {
  return (
    car.kind === "police" &&
    car.health > 0 &&
    !car.driven &&
    car.id !== state.player.car
  );
}

/**
 * Bodies are taken off the street once their five seconds are up.
 *
 * @remarks
 * One pass over both lists rather than a timer per body, and the same clock
 * for a passer-by and a policeman: they die the same way and they are cleared
 * away the same way. Nobody gets up again - a man who has been shot and then
 * strolls off is worse than no body at all.
 */
function clearBodies(state: GameState): GameState {
  const people = state.people.filter(
    (person) => person.mood !== "down" || state.time < person.stillUntil,
  );
  const cops = state.cops.filter(
    (cop) => cop.stillUntil === null || state.time < cop.stillUntil,
  );
  return people.length === state.people.length &&
    cops.length === state.cops.length
    ? state
    : { ...state, people, cops };
}

/** Heat is forgotten slowly, so an old fight does not add to a new one. */
function forget(state: GameState, dt: number): GameState {
  const heat = Math.max(0, state.player.heat - HEAT_COOLS * dt);
  return heat === state.player.heat
    ? state
    : { ...state, player: { ...state.player, heat } };
}

function wanted(
  state: GameState,
  by: number,
  why: string,
  most = MAX_STARS,
): GameState {
  // Never takes a star away: somebody already at five for shooting at the
  // police does not drop to four for knocking a passer-by over.
  const stars = Math.max(
    state.player.stars,
    Math.min(most, state.player.stars + by),
  );
  return stars === state.player.stars
    ? state
    : {
        ...state,
        player: {
          ...state.player,
          stars,
          coolAt: state.time + COOL_SECONDS,
          starAt: state.time,
        },
        log: note(
          state.log,
          `${why}: ${stars} Stern${stars === 1 ? "" : "e"}.`,
        ),
      };
}

/**
 * Stars fall off one at a time once nothing new happens.
 *
 * @remarks
 * And only out of sight: a patrol car beside you keeps the search alive, which
 * is what turns "wait it out" into "drive away". Losing them is the game, not
 * a timer.
 */
function coolDown(state: GameState): GameState {
  // A wrecked patrol car watches nobody. Neither does one three streets away -
  // and that is how a chase is shaken off: out of sight, and the clock runs.
  const seen =
    state.cars.some(
      (car) => onWatch(state, car) && far(car, state.player) < SEEN_RANGE,
    ) ||
    state.cops.some(
      (cop) => cop.health > 0 && far(cop, state.player) < SEEN_RANGE,
    );
  const cooling =
    state.player.stars > 0 && !seen && state.time >= state.player.coolAt;
  let next = state;
  if (seen && state.player.stars > 0) {
    next = {
      ...state,
      player: { ...state.player, coolAt: state.time + COOL_SECONDS },
    };
  }
  if (cooling) {
    const stars = state.player.stars - 1;
    next = {
      ...state,
      player: { ...state.player, stars, coolAt: state.time + COOL_SECONDS },
      cars:
        stars === 0
          ? state.cars.filter((car) => car.kind !== "police")
          : state.cars,
      log: stars === 0 ? note(state.log, "Die Luft ist rein.") : state.log,
    };
  }
  return next;
}

/** Being arrested: a night in the cells, a fine, and the car is gone. */
function busted(state: GameState): GameState {
  return {
    ...state,
    phase: "busted",
    player: {
      ...state.player,
      stars: 0,
      heat: 0,
      money: Math.max(0, state.player.money - BUSTED_COST),
      car: null,
      safeUntil: state.time + SAFE_SECONDS,
    },
    cops: [],
    log: note(state.log, `Verhaftet. ${BUSTED_COST} € Kaution.`),
  };
}

/* -------------------------------------------------------------------- jobs */

/** Picking a job up, delivering it, or running out of time. */
function runJob(state: GameState): GameState {
  const job = state.job;
  let next = state;
  if (job !== null) {
    const here = { x: state.player.x, y: state.player.y };
    const driving = state.player.car !== null;
    if (!job.loaded && far(here, job.from) < MARKER_RANGE) {
      next = {
        ...state,
        job: { ...job, loaded: true, until: jobDeadline(state.time) },
        log: note(state.log, `${jobWord(job)} geladen - los.`),
      };
    } else if (job.loaded && far(here, job.to) < MARKER_RANGE && !driving) {
      next = payJob(state, job);
    } else if (job.loaded && far(here, job.to) < MARKER_RANGE && driving) {
      next = payJob(state, job);
    } else if (job.until !== null && state.time > job.until) {
      const fresh = pickJob(state.cells, state.rng);
      next = {
        ...state,
        rng: fresh.rng,
        job: fresh.job,
        log: note(state.log, "Zu spät. Der Auftrag ist weg."),
      };
    }
  }
  return next;
}

/** The money, the respect, and whether a district has changed hands. */
function payJob(state: GameState, job: Job): GameState {
  const paid: GameState = {
    ...state,
    player: {
      ...state.player,
      money: state.player.money + job.pay,
      respect: state.player.respect + JOB_RESPECT,
    },
    log: note(state.log, `Abgeliefert. ${job.pay} € verdient.`),
  };
  const done = paid.districts[job.district].done + 1;
  const taken =
    done >= JOBS_PER_DISTRICT && !paid.districts[job.district].owned;
  const districts = {
    ...paid.districts,
    [job.district]: {
      done,
      owned: taken || paid.districts[job.district].owned,
    },
  };
  const withTake: GameState = taken
    ? {
        ...paid,
        districts,
        player: {
          ...paid.player,
          respect: paid.player.respect + DISTRICT_RESPECT,
        },
        log: note(paid.log, `${districtName(job.district)} gehört jetzt dir.`),
      }
    : { ...paid, districts };
  const fresh = pickJob(withTake.cells, withTake.rng);
  return { ...withTake, rng: fresh.rng, job: fresh.job };
}

/** What a job carries, in German. */
function jobWord(job: Job): string {
  const words: Readonly<Record<Job["kind"], string>> = {
    courier: "Paket",
    taxi: "Fahrgast",
    steal: "Wagen",
  };
  return words[job.kind];
}

/** What a district is called. */
export function districtName(
  district: GameState["job"] extends null ? never : string,
): string {
  const names: Readonly<Record<string, string>> = {
    grove: "Grove Street",
    ballas: "Idlewood",
    vagos: "East Beach",
    beach: "Santa Maria",
  };
  return names[district] ?? district;
}

/* ------------------------------------------------------------- spray shop */

/**
 * Driving into your own garage: the door shuts, and the car comes out new.
 *
 * @remarks
 * Your house, so no bill. What it costs instead is the risk of being followed
 * in: if a policeman is close enough to see which car went through the door,
 * he knows what colour it is now, and the search goes on.
 */
function checkGarage(state: GameState): GameState {
  const car = carOf(state);
  const inside = car !== null && far(car, state.garage) < GARAGE_RANGE;
  const worthIt =
    inside &&
    (state.player.stars > 0 ||
      car.health < VEHICLES[car.body].health ||
      state.garageAt === null);
  let next = state;
  if (inside && worthIt && car !== null) {
    const seen = watched(state);
    next = {
      ...state,
      garageAt: state.time,
      player: { ...state.player, stars: seen ? state.player.stars : 0 },
      cars: state.cars.map((each) =>
        each.id === car.id
          ? {
              ...each,
              health: VEHICLES[each.body].health,
              colour: each.colour + 1,
            }
          : each,
      ),
      log: note(
        state.log,
        seen
          ? "Umlackiert - aber sie haben dich reinfahren sehen."
          : "Umlackiert und repariert. Fahndung weg.",
      ),
    };
  }
  return next;
}

/** Whether anybody in uniform is close enough to see who went through. */
function watched(state: GameState): boolean {
  const near = (thing: Vec) => far(thing, state.garage) < GARAGE_SEEN;
  return (
    state.cops.some((cop) => cop.health > 0 && near(cop)) ||
    state.cars.some(
      (car) => car.kind === "police" && car.health > 0 && near(car),
    )
  );
}

/* -------------------------------------------------------------------- ends */

/** Whether the day is over, one way or the other. */
function checkEnd(state: GameState): GameState {
  const all = DISTRICTS.every((district) => state.districts[district].owned);
  const car = carOf(state);
  const dead = state.player.health <= 0 || (car !== null && car.health <= 0);
  let next = state;
  if (all) {
    next = {
      ...state,
      phase: "won",
      log: note(state.log, "Los Santos gehört dir."),
    };
  } else if (dead) {
    next = {
      ...state,
      phase: "wasted",
      player: {
        ...state.player,
        money: Math.max(0, state.player.money - HOSPITAL_COST),
        car: null,
      },
      log: note(state.log, `Krankenhaus. ${HOSPITAL_COST} € weg.`),
    };
  }
  return next;
}

/**
 * Back on the street after hospital or the cells.
 *
 * @param state - the game, ended one way or the other
 * @returns the game playing again, the player on foot and clean
 */
export function respawn(state: GameState): GameState {
  // Out of the door of whichever building took you in: the hospital after a
  // death, the prison after a stretch. Waking up on the spot where it happened
  // never said where you had been, and the two buildings are on the map
  // already - this is what they are for.
  const gate = doorsOf(state.phase === "busted" ? "prison" : "hospital");
  const out = nearest(gate, state.player);
  return state.phase === "busted" || state.phase === "wasted"
    ? {
        ...state,
        phase: "playing",
        player: {
          ...state.player,
          x: out.x,
          y: out.y,
          health: PLAYER_HEALTH,
          // The vest does not survive the hospital, the guns do. Losing the
          // belt on every death would make the city's kit a chore to re-walk.
          armour: 0,
          stars: 0,
          heat: 0,
          car: null,
          floorUntil: 0,
          safeUntil: state.time + SAFE_SECONDS,
        },
        cars: state.cars.filter((car) => car.kind !== "police"),
        cops: [],
        heli: null,
        feud: { mine: false, rival: false },
      }
    : state;
}

/**
 * The closest of a list of doors.
 *
 * @param doors - one point per building of that sort
 * @param to - where the player went down
 * @returns the nearest of them, or where they are if the city has none
 * @remarks
 * Nearest rather than fixed, so that being taken in on the far side of town
 * does not put one back at the same corner every time. Which hospital picked
 * you up is a thing the city can answer.
 */
function nearest(doors: readonly Vec[], to: Vec): Vec {
  let best: Vec = { x: to.x, y: to.y };
  let bestAway = Number.POSITIVE_INFINITY;
  for (const door of doors) {
    const away = far(door, to);
    if (away < bestAway) {
      best = door;
      bestAway = away;
    }
  }
  return best;
}

/* ----------------------------------------------------------------- helpers */

/** Adds a line to the ticker, keeping the last few. */
function note(log: readonly string[], line: string): readonly string[] {
  return [...log, line].slice(-LOG_LINES);
}

/**
 * Which district the player is standing in.
 *
 * @param state - the game
 * @returns the quarter under their feet
 */
export function playerDistrict(state: GameState): string {
  return districtAt(state.player.x, state.player.y);
}
