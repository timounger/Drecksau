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
import type { BuildingKind } from "./buildings";
import {
  atCrossing,
  cellUnder,
  districtAt,
  doorsOf,
  garageBay,
  garageMouth,
  isOpen,
  roofAt,
  isRoadAt,
  onMotorway,
  lightAt,
  lightColour,
  nearestCrossing,
  inCity,
  roadRun,
  routeHeading,
  setGarage,
  streetRun,
} from "./city";
import { advanceBank, enterBank } from "./bank";
import { advanceMint, enterMint } from "./mint";
import { atPlatform, rollTrain, trainCars } from "./train";
import { advance, enterPrison } from "./prison";
import { nextInt, nextRandom, type RandomState } from "./random";
import { DISTRICTS, far, jobDeadline, makePerson, pickJob } from "./setup";
import {
  ACK_DAMAGE,
  ACK_EVERY,
  ACK_FLOOR,
  ACK_HEALTH,
  ACK_RANGE,
  ACK_REPAIR,
  ACK_SIZE,
  ACK_SPEED,
  CYCLE_CAP,
  FOOT_TURN,
  GRIP_BRAKE,
  GRIP_PUSH,
  HAND_DRAG,
  HAND_GRIP,
  HAND_LOCK,
  HAND_TURN,
  MARK_EVERY,
  MARK_LIFE,
  TRACK_LIFE,
  TRAFFIC_TURN,
  TURN_DONE,
  MARK_MAX,
  SLIP_SMOKE,
  LIGHT_LOOK,
  LOOSE_DRAG,
  TANK_HITS,
  TOW_GAP,
  TOW_REACH,
  TOW_SNAP,
  BANK_STARS,
  BASE,
  CHOP_ACCEL,
  CHOP_CEILING,
  CHOP_FALL,
  CHOP_REACH,
  CHOP_RISE,
  CHOP_SPEED,
  CHOP_SPIN,
  CHOP_TURN,
  BLOCK_TILES,
  GUARD_REACH,
  RUN_DRIVE,
  RUN_WALK,
  BUSTED_COST,
  COUNTER_RANGE,
  CHARGE_FORCE,
  CREW_GAP,
  CREW_MAX,
  TANK_ARMOUR,
  TILE,
  TRAIN_HURT,
  TRAIN_LONG,
  TRAIN_WIDE,
  BOARD_REACH,
  HIRE_PRICE,
  HIRE_RANGE,
  JET_CEILING,
  JET_FALL,
  JET_PRICE,
  JET_RISE,
  ROOF_HEIGHT,
  MINT_CREW,
  MINT_MATES,
  CHARGE_MAX,
  ESCAPE_MATES,
  ESCAPE_STARS,
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
  COP_FORM,
  COP_OUT,
  COP_RING,
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
  LEAN_MOST,
  LEAN_RATE,
  LEAN_STIFF,
  PADDLE_BACK,
  PATROL_STARS,
  STICK_EASE,
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
  BOARD_GIVE_UP,
  BOARD_GRACE,
  BOARD_PATIENCE,
  DOOR_OPEN,
  DOOR_REACH,
  DOOR_STAND,
  ENTER_RANGE,
  GARAGE_SEEN,
  GARAGE_OPEN,
  GARAGE_RANGE,
  GARAGE_SHUT,
  HOSPITAL_COST,
  JOBS_PER_DISTRICT,
  JOB_RESPECT,
  LOG_LINES,
  MARKER_RANGE,
  MAX_STARS,
  MAX_STEP,
  NEAR_RANGE,
  PATROL_EVERY,
  POLICE_AGAIN,
  HELI_AGAIN,
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
  type Mark,
  type GameState,
  type Input,
  type Job,
  type Order,
  type Person,
  type Pickup,
  type Player,
  type BankState,
  type MintState,
  type PrisonState,
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
  PURSE,
  type Side,
} from "./people";
import { VEHICLES, bodyRadius, twoWheeled, type VehicleBody } from "./vehicles";
import {
  BLAST_RADIUS,
  GRENADE_FUSE,
  WEAPONS,
  carried,
  firedOne,
  fullBelt,
  PRICES,
  nextWeapon,
  refillPrice,
  slotOf,
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
    next = fly(next, input, slice);
    next = flyChopper(next, input, slice);
    next = drivePlayer(next, input, slice);
    next = switchWeapon(next, input);
    next = layCharge(next, input);
    next = shoot(next, input, slice);
    next = runTrain(next, slice);
    next = moveTraffic(next, slice);
    next = rollLoose(next, slice);
    next = layMarks(next, input);
    next = towAlong(next);
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
    next = onTheBase(next);
    next = runAck(next);
    next = coolDown(next);
    next = cashIn(next);
    next = runJob(next);
    next = runDoor(next);
    next = checkGarage(next);
    next = serveCounter(next, input);
    next = checkEnd(next);
  } else if (state.phase === "prison" && state.prison !== null) {
    next = doTime(state, state.prison, input, dt);
  } else if (state.phase === "mint" && state.mint !== null) {
    next = doJob(state, state.mint, input, dt);
  } else if (state.phase === "bank" && state.bank !== null) {
    next = doHoldUp(state, state.bank, input, dt);
  }
  return next;
}

/**
 * One step inside the jail, and what it means for the city.
 *
 * @remarks
 * The city itself does not move while this runs. Nothing out there is waiting
 * for the player - the traffic, the gangs and the search are exactly as they
 * were when the door shut, which is the point of keeping the escape in a world
 * of its own. What comes back is one of three answers, and two of them put the
 * player back on the pavement.
 */
function doTime(
  state: GameState,
  prison: PrisonState,
  input: Input,
  dt: number,
): GameState {
  const turn = advance(prison, input, dt);
  const told = turn.lines.reduce((log, line) => note(log, line), state.log);
  let next: GameState;
  switch (turn.done) {
    case "out":
      next = onTheRun(onStreet({ ...state, prison: null, log: told }, false));
      break;
    case "back":
      next = onStreet({ ...state, prison: null, log: told }, true);
      break;
    default:
      next = { ...state, prison: turn.prison, log: told };
  }
  return next;
}

/**
 * In through the door of the bank, with the gun out.
 *
 * @remarks
 * A weapon is the whole of the entry fee, as it always was: with bare fists a
 * cashier presses the button and goes on with his day. What is different is
 * where the robbery happens - not at a counter on the pavement any more, but
 * in the room, with the people who work there.
 */
function goIntoBank(state: GameState): GameState {
  const armed =
    state.player.weapon !== "fist" &&
    carried(state.player.ammo, state.player.weapon);
  return !armed
    ? state
    : {
        ...state,
        phase: "bank",
        bank: enterBank(state.time),
        player: { ...state.player, car: null, hooded: true },
        log: note(
          state.log,
          "Sturmhaube auf. Alle auf den Boden - und keiner an den Knopf.",
        ),
      };
}

/**
 * One step inside the bank, and what it means for the city.
 *
 * @remarks
 * Three answers, as with the jail and the works. Walking out of the front door
 * ends it with whatever is in the bag; staying too long ends it with a pair of
 * handcuffs, because the police do not knock.
 */
function doHoldUp(
  state: GameState,
  bank: BankState,
  input: Input,
  dt: number,
): GameState {
  const turn = advanceBank(bank, input, dt);
  const told = turn.lines.reduce((log, line) => note(log, line), state.log);
  let next: GameState;
  switch (turn.done) {
    case "out":
      next = outOfBank(
        { ...state, log: told },
        Math.round(turn.bank.taken),
        turn.bank.alarm,
      );
      break;
    case "caught":
      next = busted({
        ...state,
        bank: null,
        log: note(told, "Zu lange gebraucht. Sie stehen in der Tür."),
      });
      break;
    default:
      next = { ...state, bank: turn.bank, log: told };
  }
  return next;
}

/**
 * Out of the front door, with the bag and whatever the street knows.
 *
 * @remarks
 * The two endings of a bank job, and the difference between them is one
 * button. Nobody pressed it: one walks out into an ordinary morning and the
 * money is money as soon as one is round the corner. Somebody did: two stars,
 * and the cars are already coming.
 */
function outOfBank(state: GameState, taken: number, alarm: boolean): GameState {
  const door = nearest(doorsOf("bank"), state.player);
  return {
    ...state,
    phase: "playing",
    bank: null,
    player: {
      ...state.player,
      x: door.x,
      y: door.y + BANK_STEP,
      car: null,
      loot: state.player.loot + taken,
      stars: alarm
        ? Math.max(state.player.stars, BANK_STARS)
        : state.player.stars,
      heat: 0,
      coolAt: state.time + COOL_SECONDS,
      safeUntil: state.time + SAFE_SECONDS,
    },
    log: note(
      state.log,
      alarm
        ? `Raus mit ${String(taken)} € - und die halbe Stadt weiß es.`
        : `Raus mit ${String(taken)} €. Keiner hat etwas gemerkt.`,
    ),
  };
}

/** How far in front of the door one comes out, in pixels. */
const BANK_STEP = 28;

/**
 * One step inside the printing works, and what it means for the city.
 *
 * @remarks
 * The same bargain as the jail: the city stands still, the little world runs,
 * and what comes back is one of three answers. The difference is that this one
 * carries a number with it. Whatever the presses ran off is only worth anything
 * if it comes up the far end of the tunnel.
 */
function doJob(
  state: GameState,
  mint: MintState,
  input: Input,
  dt: number,
): GameState {
  const turn = advanceMint(mint, input, dt);
  const told = turn.lines.reduce((log, line) => note(log, line), state.log);
  let next: GameState;
  switch (turn.done) {
    case "out":
      next = upTheTunnel(
        { ...state, log: told },
        Math.round(turn.mint.printed),
      );
      break;
    case "stormed":
      next = busted({
        ...state,
        mint: null,
        log: note(told, "Sie sind drin. Hände hinter den Kopf."),
      });
      break;
    default:
      next = { ...state, mint: turn.mint, log: told };
  }
  return next;
}

/**
 * Up out of the earth two streets away, with the bag - and with nobody looking.
 *
 * @remarks
 * The tunnel comes up at the nearest crossing, which is the one thing about
 * this escape that has to be a street: a hole that opened inside a block would
 * put the player in a wall. The men who dug it come up behind him, still in the
 * red overalls they went in wearing.
 *
 * **And no wanted level.** This is the whole reason for digging: a job one
 * walks out of the front door of is a chase, and a job one leaves through the
 * ground is a job nobody can follow. Half the police force is still standing
 * round a building with three barricaded doors, watching a house that has
 * nobody in it. Whatever stars were already out stay out - the tunnel hides
 * where you went, not what you did before you went in.
 */
function upTheTunnel(state: GameState, printed: number): GameState {
  const out = tunnelMouth(state, nearest(doorsOf("mint"), state.player));
  const mates = Array.from({ length: MINT_MATES }, (unused, at) => {
    const way = (at / MINT_MATES) * Math.PI * 2;
    return robber(state, out, at, way);
  });
  return {
    ...state,
    phase: "playing",
    mint: null,
    crew: [],
    player: {
      ...state.player,
      x: out.x,
      y: out.y,
      car: null,
      loot: state.player.loot + printed,
      heat: 0,
      masked: true,
      // The search that is on outside the works is looking at the works. It
      // does not follow anybody through the ground, so the clock on whatever
      // stars were already out starts again here rather than being added to.
      coolAt: state.time + COOL_SECONDS,
      safeUntil: state.time + SAFE_SECONDS,
    },
    people: [...state.people, ...mates],
    log: note(
      state.log,
      `Raus aus dem Loch - mit ${String(printed)} €. Keiner hat gesehen, wo ihr rausgekommen seid.`,
    ),
  };
}

/** One of the hired men, up out of the tunnel and already running. */
function robber(state: GameState, out: Vec, at: number, way: number): Person {
  return {
    id:
      state.people.reduce((most, each) => Math.max(most, each.id), 0) + 1 + at,
    x: out.x + Math.cos(way) * ESCAPE_SPREAD,
    y: out.y + Math.sin(way) * ESCAPE_SPREAD,
    heading: way,
    turnAt: 0,
    mood: "walking",
    stillUntil: 0,
    scaredAt: state.time + ESCAPE_PANIC,
    look: at,
    walked: 0,
    pace: 0,
    kind: "robber",
    holds: null,
    health: KINDS.robber.health,
    reloadAt: 0,
    home: null,
  };
}

/**
 * Where the far end of the tunnel breaks the surface.
 *
 * @param state - the city, whose floor decides what is street and what is not
 * @param door - the door of the works the tunnel was dug from
 * @returns a crossing, on tarmac, a block or two away
 * @remarks
 * Two streets south, and then whatever is nearest to that which is a street at
 * all. The plain answer - a fixed distance south - puts one of the two
 * printing works in Los Santos under a block of flats, and coming up inside a
 * wall would be a worse ending than being caught.
 */
function tunnelMouth(state: GameState, door: Vec): Vec {
  const aim = { x: door.x, y: door.y + TUNNEL_RUN };
  let best = nearestCrossing(aim.x, aim.y);
  let found = isRoadAt(state.cells, best.x, best.y);
  for (let ring = 1; ring <= MOUTH_RINGS && !found; ring += 1) {
    for (const spot of aroundOf(aim, ring)) {
      const at = nearestCrossing(spot.x, spot.y);
      if (!found && isRoadAt(state.cells, at.x, at.y)) {
        best = at;
        found = true;
      }
    }
  }
  return best;
}

/** The square ring of blocks this far out from a point. */
function aroundOf(aim: Vec, ring: number): readonly Vec[] {
  const step = BLOCK_TILES * TILE;
  const spots: Vec[] = [];
  for (let down = -ring; down <= ring; down += 1) {
    for (let across = -ring; across <= ring; across += 1) {
      if (Math.max(Math.abs(down), Math.abs(across)) === ring) {
        spots.push({ x: aim.x + across * step, y: aim.y + down * step });
      }
    }
  }
  return spots;
}

/** How far from the works the search for a street gives up, in blocks. */
const MOUTH_RINGS = 4;

/** How far from the door of the works the tunnel comes up, in pixels. */
const TUNNEL_RUN = 260;

/**
 * Out of the wall and straight into a chase.
 *
 * @remarks
 * Getting over the wall is not the end of the escape. Nobody walks away from a
 * prison break: the search is on from the first step, and the men who came
 * through the hole scatter into the streets in the same striped suits, which
 * is what tells a passing patrol what it is looking at.
 */
function onTheRun(state: GameState): GameState {
  const runners = Array.from({ length: ESCAPE_MATES }, (unused, at) => {
    const way = (at / ESCAPE_MATES) * Math.PI * 2;
    return convict(state, at, way);
  });
  return {
    ...state,
    player: {
      ...state.player,
      stars: ESCAPE_STARS,
      heat: 0,
      // Still in what he came over the wall in, and that is half the reason
      // the city is looking at him.
      striped: true,
      // The clock for losing a star starts now. Without this it still holds
      // whatever time the last chase left in it, and the search one has just
      // earned would fall apart on the first frame outside.
      coolAt: state.time + COOL_SECONDS,
    },
    people: [...state.people, ...runners],
    log: note(
      state.log,
      `Draußen. ${ESCAPE_MATES} sind mit dir raus - und die Fahndung läuft.`,
    ),
  };
}

/** One escaped man, put down beside the player and already running. */
function convict(state: GameState, at: number, way: number): Person {
  const out = ESCAPE_SPREAD + (at % 2) * ESCAPE_SPREAD;
  return {
    id:
      state.people.reduce((most, each) => Math.max(most, each.id), 0) + 1 + at,
    x: state.player.x + Math.cos(way) * out,
    y: state.player.y + Math.sin(way) * out,
    heading: way,
    turnAt: 0,
    mood: "walking",
    stillUntil: 0,
    // Frightened from the first frame, which in this city is what running is.
    scaredAt: state.time + ESCAPE_PANIC,
    look: at,
    walked: 0,
    pace: 0,
    kind: "convict",
    holds: null,
    health: KINDS.convict.health,
    reloadAt: 0,
    home: null,
  };
}

/** How far from the player the others come out of the wall, in pixels. */
const ESCAPE_SPREAD = 26;

/** How long they keep running for, in seconds. */
const ESCAPE_PANIC = 30;

/**
 * Into the jail, with the day ahead and a plan.
 *
 * @param state - the game, just after an arrest
 * @returns the escape, at the moment the cell door is unlocked
 */
export function breakOut(state: GameState): GameState {
  return state.phase === "busted"
    ? {
        ...state,
        phase: "prison",
        prison: enterPrison(state.time),
        log: note(
          state.log,
          "Zelle 1. Der Hof ist offen - und an den Bänken sitzen Schrauben.",
        ),
      }
    : state;
}

/* ------------------------------------------------------------------ player */

/** The player, on foot or behind a wheel. */
function drivePlayer(state: GameState, input: Input, dt: number): GameState {
  const used = input.use ? swapSeat(state) : state;
  let next: GameState;
  if (used.player.flying) {
    // The stick is read in flyChopper, before this: at the controls of a
    // helicopter the walking keys are the flying keys.
    next = used;
  } else if (used.player.aboard) {
    // A passenger steers nothing: the carriage goes where the rails go, and
    // the keys do nothing at all until he gets off.
    next = used;
  } else if (used.player.car === null) {
    next =
      used.player.boarding === null
        ? walk(used, input, dt)
        : boardCar(used, input, dt);
  } else {
    next = drive(used, input, dt);
  }
  return next;
}

/** Getting in or out. */
function swapSeat(state: GameState): GameState {
  const near = nearestCar(state);
  let next: GameState;
  if (state.time < state.player.floorUntil) {
    next = state;
  } else if (state.player.flying) {
    next = landed(state);
  } else if (state.player.aboard) {
    next = getOff(state);
  } else if (state.player.car !== null) {
    next = leaveCar(state);
  } else if (onThePad(state)) {
    next = takeOff(state);
  } else if (canBoard(state)) {
    // The platform comes first: standing beside a waiting train with a parked
    // car behind one, the train is plainly what was meant.
    next = getOn(state);
  } else if (state.player.boarding !== null) {
    // Second press: he changes his mind and stands where he is.
    next = { ...state, player: { ...state.player, boarding: null } };
  } else if (
    near !== null &&
    (noDoor(near.body) || doorSpot(state, near) === null)
  ) {
    // **Nothing to walk round and nothing to open.** A motorbike has no
    // driver's door and no left-hand side worth the name: one stands next to
    // it, swings a leg over and is on it, and whichever side one happens to be
    // standing on is the right one. The same goes for a tank, which is entered
    // through a hatch on the deck.
    //
    // And the same for a car wedged so tightly that neither of its doors has a
    // pavement to stand on. Getting in has to **work**: where the walk cannot
    // be made, it is skipped rather than attempted and failed.
    next = enterCar(state, near);
  } else {
    // **Not in yet.** The key starts him walking round to the driver's door;
    // what actually puts him behind the wheel is arriving there.
    next =
      near === null
        ? state
        : {
            ...state,
            player: {
              ...state.player,
              boarding: { car: near.id, from: state.time, openAt: null },
            },
          };
  }
  return next;
}

/**
 * Whether one simply gets on this rather than walking round to a door.
 *
 * @param body - which sort of vehicle
 * @returns true where there is no door to walk to
 * @remarks
 * **A tank has no driver's door.** The driver climbs onto the deck and drops
 * through a hatch, from whichever side he happened to be standing on - and
 * that is not a detail, it is the difference between a vehicle one can take
 * and one one cannot. The walk-to-the-door routine aims at a spot
 * {@link DOOR_STAND} out from the middle, which on a machine forty-six pixels
 * wide is eleven pixels clear of the flank; a man walking at it runs into the
 * side of the tank and stands there pushing, for ever, because arriving means
 * getting within {@link DOOR_REACH} of a spot he cannot reach. One could not
 * get into the tank at all.
 *
 * The two-wheelers are here for the older reason: one does not open a
 * motorbike, one swings a leg over it.
 */
function noDoor(body: VehicleBody): boolean {
  return twoWheeled(body) || body === "tank";
}

/**
 * Where the driver's door of a vehicle is stood at.
 *
 * @param car - the vehicle
 * @returns the spot beside it, in city pixels
 * @remarks
 * **The left**, which is where the wheel is and where the man who is already in
 * it will be put out. Left of a nose pointing along `angle` is `angle` minus a
 * right angle: this picture has y running down it, so a driver heading east is
 * heading along positive x with north - negative y - out of his left window.
 * On two wheels there is no door and no left either, but one still mounts a
 * motorbike from that side, so the walk is the same walk.
 */
function doorSpot(state: GameState, car: Car): Vec | null {
  const left = car.angle - Math.PI / 2;
  const stand = (out: number): Vec => ({
    x: car.x + Math.cos(out) * DOOR_STAND,
    y: car.y + Math.sin(out) * DOOR_STAND,
  });
  const door = stand(left);
  const other = stand(left + Math.PI);
  // **Unless there is a wall where the door is.** A car parked hard against a
  // house has a driver's door one cannot stand at, and a man walking round to
  // a spot inside a building never gets there. In that case one gets in the
  // other side and slides across, which is what anybody does - and if that
  // side is in a wall as well, there is no spot to walk to at all and the
  // caller is told so.
  let spot: Vec | null = null;
  if (isOpen(state.cells, door.x, door.y)) {
    spot = door;
  } else if (isOpen(state.cells, other.x, other.y)) {
    spot = other;
  }
  return spot;
}

/**
 * Which way to walk to get to a spot beside a vehicle.
 *
 * @param state - the city
 * @param car - the vehicle in the way of itself
 * @param spot - where beside it he is trying to stand
 * @returns a heading, in radians
 * @remarks
 * **Round it, not through it.** The driver's door is on the far side as often
 * as the near one, and bodywork is solid: walking straight at it pressed the
 * man against the back wing and left him standing there pushing. So when the
 * line to the door runs into the car, he follows the car round instead - along
 * the tangent, the short way round, and leaning a little outwards as he goes.
 *
 * The lean outwards is not a flourish. A vehicle stops a step that ends no
 * further from it than it began, so a step exactly along the tangent - which
 * keeps the distance to the pixel - is a step that never happens.
 */
function wayRoundTo(state: GameState, car: Car, spot: Vec): number {
  const me = state.player;
  const straight = Math.atan2(spot.y - me.y, spot.x - me.x);
  const ahead = {
    x: me.x + Math.cos(straight) * DOOR_LOOK,
    y: me.y + Math.sin(straight) * DOOR_LOOK,
  };
  let way = straight;
  if (blocked(state, ahead, me)) {
    const out = Math.atan2(me.y - car.y, me.x - car.x);
    const round = turned(out, Math.atan2(spot.y - car.y, spot.x - car.x));
    way = out + Math.sign(round || 1) * (Math.PI / 2 - DOOR_SWERVE);
  }
  // And round the houses as well as round the car. A door on the far side can
  // have a wall behind it, and a man walking into that wall stands there
  // pushing at it for as long as one lets him.
  return steerRound(state.cells, me, way, DOOR_LOOK);
}

/** How far ahead the walk to a door looks for bodywork, in pixels. */
const DOOR_LOOK = 16;

/** How far outwards it leans while going round, in radians. */
const DOOR_SWERVE = 0.45;

/**
 * One step of walking up to a vehicle, opening it and getting in.
 *
 * @param state - the city, with somebody already on his way
 * @param input - the keys this frame
 * @param dt - seconds since the last step
 * @returns the city one step further into the door
 * @remarks
 * **Three things in order**, and any of the four walking keys calls the whole
 * thing off: a man who presses north while walking round a car wanted to go
 * north. So does the car driving away, being wrecked, or the player being put
 * on the tarmac - none of which is a reason to keep marching at a door that is
 * no longer there.
 */
function boardCar(state: GameState, input: Input, dt: number): GameState {
  const board = state.player.boarding;
  const car = state.cars.find((each) => each.id === board?.car) ?? null;
  const spot = car === null ? null : doorSpot(state, car);
  const away = spot === null ? 0 : far(spot, state.player);
  const steered =
    (input.left ? 1 : 0) +
    (input.right ? 1 : 0) +
    (input.up ? 1 : 0) +
    (input.down ? 1 : 0);
  let next: GameState;
  if (
    board === null ||
    car === null ||
    car.health <= 0 ||
    (steered > 0 && state.time > board.from + BOARD_GRACE) ||
    away > BOARD_GIVE_UP ||
    state.time < state.player.floorUntil
  ) {
    next = walk(
      { ...state, player: { ...state.player, boarding: null } },
      input,
      dt,
    );
  } else if (spot === null || state.time > board.from + BOARD_PATIENCE) {
    // **He gets in anyway.** Either the spot beside the door has gone - the
    // car has been shoved against a wall since he set off - or he has been
    // walking at it for {@link BOARD_PATIENCE} seconds without arriving, which
    // means there is no way to stand there. Standing outside a car one has
    // asked to get into is not an outcome; the walk is the nice version of
    // getting in, not a condition of it.
    next = enterCar(
      { ...state, player: { ...state.player, boarding: null } },
      car,
    );
  } else if (board.openAt === null) {
    // Walking round to it. He keeps facing where the mouse points - the door
    // is where his feet are going, not where his eyes are.
    const way = wayRoundTo(state, car, spot);
    const gone =
      away <= DOOR_REACH
        ? state
        : walk(state, input, dt, {
            x: Math.cos(way),
            y: Math.sin(way),
          });
    next =
      far(spot, gone.player) <= DOOR_REACH
        ? {
            ...gone,
            player: {
              ...gone.player,
              boarding: { ...board, openAt: gone.time },
            },
            log: note(gone.log, "Tür auf."),
          }
        : gone;
  } else if (state.time >= board.openAt + DOOR_OPEN) {
    next = enterCar(
      { ...state, player: { ...state.player, boarding: null } },
      car,
    );
  } else {
    // Standing at the open door while whoever was in it gets out of it. Still,
    // or the legs would go on walking on the spot for half a second.
    next = { ...state, player: { ...state.player, pace: 0 } };
  }
  return next;
}

/**
 * Whether the player is sitting in a tractor with a free tow bar.
 *
 * @param state - the city
 * @returns the vehicle it would hook up, or null
 * @remarks
 * Exported because the button row asks: the tow bar is offered only when there
 * is something behind the tractor to put on it.
 */
export function towable(state: GameState): Car | null {
  const seat = carOf(state);
  let found: Car | null = null;
  if (seat !== null && seat.body === "tractor" && seat.hitched === null) {
    for (const car of state.cars) {
      const near = far(car, seat) < TOW_REACH;
      if (car.id !== seat.id && car.health > 0 && near && found === null) {
        found = car;
      }
    }
  }
  return found;
}

/** Whether the tractor the player is in already has something on the back. */
export function towing(state: GameState): boolean {
  const seat = carOf(state);
  return seat !== null && seat.hitched !== null;
}

/** The tow bar: hook the nearest thing on, or let go of what is on it. */
function hitchOrder(state: GameState): GameState {
  const seat = carOf(state);
  const load = towable(state);
  let next = state;
  if (seat !== null && seat.hitched !== null) {
    next = {
      ...state,
      cars: state.cars.map((car) =>
        car.id === seat.id ? { ...car, hitched: null } : car,
      ),
      log: note(state.log, "Abgekuppelt."),
    };
  } else if (seat !== null && load !== null) {
    next = {
      ...state,
      cars: state.cars.map((car) =>
        car.id === seat.id ? { ...car, hitched: load.id } : car,
      ),
      log: note(state.log, `${VEHICLES[load.body].name} hängt am Haken.`),
    };
  }
  return next;
}

/**
 * The black marks a dragged tyre leaves on the road.
 *
 * @param state - the city
 * @returns it, with a fresh pair under every car that is sliding
 * @remarks
 * Laid by whatever is sliding, player or not - a patrol car that loses the
 * back end in a corner leaves the same two lines. Every twentieth of a second,
 * because that is close enough at road speed that the dots run into a line,
 * and the oldest are dropped once there are five hundred of them.
 *
 * They are the one thing in the game that outlives what made them, and they do
 * it the cheap way: a point, an angle and a time. Nothing owns them, nothing
 * updates them, and they fade out on the clock.
 */
function layMarks(state: GameState, input: Input): GameState {
  let next = state;
  if (state.time >= state.markAt) {
    const fresh: Mark[] = [];
    for (const car of state.cars) {
      const shape = VEHICLES[car.body];
      // Either the tyres are being dragged sideways, or they are locked and
      // being dragged forwards. Both leave the same line, and the second is
      // what the handbrake does in a straight line.
      const sliding = Math.abs(car.slip) > SLIP_SMOKE;
      const locked =
        car.id === state.player.car &&
        input.lift &&
        Math.abs(car.speed) > MARK_CRAWL;
      // **A tank marks the road by driving on it.** Nothing has to be sliding:
      // the whole weight of the thing stands on two strips of steel, and what
      // is under them is flattened whichever way it was going. So it lays its
      // pair every time it moves, and what is behind it is a trail rather than
      // the odd black line out of a fast corner.
      const churning = car.body === "tank" && Math.abs(car.speed) > MARK_CRAWL;
      if ((sliding || locked || churning) && car.health > 0) {
        const back = -shape.length * WHEEL_BACK;
        const side = shape.width * WHEEL_SIDE;
        for (const wheel of TYRE_TRACKS[car.body] ?? BOTH_TRACKS) {
          fresh.push({
            x:
              car.x +
              Math.cos(car.angle) * back -
              Math.sin(car.angle) * side * wheel,
            y:
              car.y +
              Math.sin(car.angle) * back +
              Math.cos(car.angle) * side * wheel,
            angle: car.angle,
            at: state.time,
            car: car.id,
            lane: wheel,
            tread: car.body === "tank" ? "track" : "rubber",
          });
        }
      }
    }
    const kept = [...state.marks, ...fresh].filter(
      (mark) =>
        state.time - mark.at <
        (mark.tread === "track" ? TRACK_LIFE : MARK_LIFE),
    );
    next = {
      ...state,
      marks: kept.slice(Math.max(0, kept.length - MARK_MAX)),
      markAt: state.time + MARK_EVERY,
    };
  }
  return next;
}

/**
 * Where a vehicle's back tyres are, across it, as shares of half its width.
 *
 * @remarks
 * Two lines is the usual answer and the default. The two that are not usual are
 * the two-wheelers: a motorbike drags one tyre down the middle of the lane, and
 * a bicycle drags nothing at all - there is not enough weight on a pushbike to
 * scrub rubber off it, and a bicycle leaving black lines out of a corner is the
 * sort of detail that makes everything around it look made up.
 */
const TYRE_TRACKS: Readonly<Partial<Record<VehicleBody, readonly number[]>>> = {
  // One line down the middle for anything on two wheels - it has one back
  // tyre and it leaves one mark. The patrol bike was missing from this list
  // and laid the pair a car lays, which is a motorbike with a rear axle.
  bike: [0],
  patrolbike: [0],
  cycle: [],
};

/** What everything else leaves: one line per rear wheel. */
const BOTH_TRACKS: readonly number[] = [-1, 1];

/** Below this, locked wheels only scuff rather than mark, in pixels a second. */
const MARK_CRAWL = 40;

/** How far back the rear wheels sit, as a share of the length. */
const WHEEL_BACK = 0.3;

/** And how far out to the side, as a share of the width. */
const WHEEL_SIDE = 0.42;

/**
 * Cars with nobody at the wheel, rolling to a stop.
 *
 * @param state - the city
 * @param dt - seconds since the last step
 * @returns it, with everything that was shoved that much further along
 * @remarks
 * A parked car knocked aside by a tank used to be given a speed that nothing
 * ever read: the traffic step moves traffic, the chase step moves patrol cars,
 * and a parked car was nobody's business. So it sat there at two hundred and
 * sixty pixels a second, in the same place, for ever. This is the step that
 * was missing - and it is also what makes the shove worth having, because a
 * car that is shoved ends up across the road rather than where it was.
 */
function rollLoose(state: GameState, dt: number): GameState {
  let touched = false;
  const cars = state.cars.map((car) => {
    const loose =
      !car.driven &&
      car.kind === "parked" &&
      car.hitched === null &&
      car.speed !== 0;
    let after = car;
    if (loose) {
      touched = true;
      const pace =
        Math.sign(car.speed) *
        Math.max(0, Math.abs(car.speed) - LOOSE_DRAG * dt);
      after = { ...car, ...slideCar(state.cells, car, car.angle, pace, dt) };
    }
    return after;
  });
  return touched ? { ...state, cars } : state;
}

/**
 * Whatever is on a tow bar, dragged along behind whatever is pulling it.
 *
 * @param state - the city
 * @returns it, with every towed vehicle put back behind its tractor
 * @remarks
 * A rigid bar rather than a rope: the load sits a fixed distance behind the
 * tractor, pointing the same way, and that is the whole simulation. A proper
 * hinge would be a second vehicle model for something one uses to move a wreck
 * out of a garage.
 *
 * The rope comes off by itself if the load ends up too far away - which is
 * what happens when something explodes, or when the load is picked up by
 * somebody else.
 */
function towAlong(state: GameState): GameState {
  let cars = state.cars;
  for (const tractor of state.cars) {
    const load =
      tractor.hitched === null
        ? undefined
        : cars.find((car) => car.id === tractor.hitched);
    if (load !== undefined) {
      const at = {
        x: tractor.x - Math.cos(tractor.angle) * TOW_GAP,
        y: tractor.y - Math.sin(tractor.angle) * TOW_GAP,
      };
      const gone = far(load, at) > TOW_SNAP || load.health <= 0;
      cars = cars.map((car) => {
        let after = car;
        if (car.id === load.id && !gone) {
          after = {
            ...car,
            ...at,
            angle: tractor.angle,
            speed: tractor.speed,
            driven: false,
          };
        } else if (car.id === tractor.id && gone) {
          after = { ...car, hitched: null };
        }
        return after;
      });
    }
  }
  return cars === state.cars ? state : { ...state, cars };
}

/**
 * The one button that gets on and off everything.
 *
 * @param state - the city
 * @returns it, one climb in or out further on
 * @remarks
 * The same key does it, so the same button does it: the train if one is
 * standing at a platform, the helicopter if one is standing at the pad, and
 * back out of whichever one is in.
 */
function boardOrder(state: GameState): GameState {
  let next: GameState;
  if (state.player.flying) {
    next = landed(state);
  } else if (state.player.aboard) {
    next = getOff(state);
  } else if (onThePad(state)) {
    next = takeOff(state);
  } else {
    next = getOn(state);
  }
  return next;
}

/**
 * Whether the player is standing at the helicopter with nothing in the way.
 *
 * @param state - the city
 * @returns true beside the machine, on foot, with it on the ground
 * @remarks
 * Exported for the button row, which offers Einsteigen for this as well.
 */
export function onThePad(state: GameState): boolean {
  return (
    state.player.car === null &&
    !state.player.aboard &&
    state.chopper.height <= 0 &&
    far(state.chopper, state.player) < CHOP_REACH
  );
}

/** Climbing in: the rotor starts and the walking keys become the stick. */
function takeOff(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      flying: true,
      x: state.chopper.x,
      y: state.chopper.y,
      height: state.chopper.height,
    },
    log: note(
      state.log,
      "Im Hubschrauber. Leertaste steigt, W fliegt, E steigt wieder aus.",
    ),
  };
}

/** And climbing out, which only works once the skids are down. */
function landed(state: GameState): GameState {
  const down = state.chopper.height <= LANDED;
  return !down
    ? {
        ...state,
        log: note(state.log, "Erst landen - Leertaste loslassen und sinken."),
      }
    : {
        ...state,
        player: {
          ...state.player,
          flying: false,
          height: 0,
          x:
            state.chopper.x +
            Math.cos(state.chopper.angle + Math.PI / 2) * OFF_PAD,
          y:
            state.chopper.y +
            Math.sin(state.chopper.angle + Math.PI / 2) * OFF_PAD,
        },
        log: note(state.log, "Ausgestiegen."),
      };
}

/** How near the ground counts as landed, in pixels. */
const LANDED = 3;

/** How far beside the machine one lands, in pixels. */
const OFF_PAD = 40;

/**
 * One step of the helicopter.
 *
 * @param state - the city
 * @param input - what the keys are doing
 * @param dt - seconds since the last step
 * @returns the city with the machine where it now is
 * @remarks
 * The keys are the ones one already has: left and right bring the nose round,
 * W is forward, S is the brake, and the space bar - the jetpack key - is the
 * collective. Below the roofs the walls are still walls; above them there is
 * nothing in the way at all, which is the whole reason for flying.
 *
 * With nobody in it the rotor stops and the machine sits on its pad. It is not
 * traffic, it is a thing standing in a yard.
 */
function flyChopper(state: GameState, input: Input, dt: number): GameState {
  const chopper = state.chopper;
  let next = state;
  if (state.player.flying) {
    const height = Math.max(
      0,
      Math.min(
        CHOP_CEILING,
        chopper.height + (input.lift ? CHOP_RISE : -CHOP_FALL) * dt,
      ),
    );
    const turn = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const angle = chopper.angle + turn * CHOP_TURN * dt;
    const push = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    const speed =
      push === 0
        ? Math.max(0, chopper.speed - CHOP_ACCEL * dt)
        : Math.max(
            0,
            Math.min(CHOP_SPEED, chopper.speed + push * CHOP_ACCEL * dt),
          );
    const want = {
      x: chopper.x + Math.cos(angle) * speed * dt,
      y: chopper.y + Math.sin(angle) * speed * dt,
    };
    // Down among the houses it is a vehicle like any other; over the roofs the
    // ground has no say.
    const moved =
      height >= ROOF_HEIGHT
        ? {
            x: Math.max(0, Math.min(CITY_SIZE, want.x)),
            y: Math.max(0, Math.min(CITY_SIZE, want.y)),
          }
        : slide(state.cells, chopper, want.x - chopper.x, want.y - chopper.y);
    next = {
      ...state,
      chopper: {
        ...chopper,
        ...moved,
        angle,
        height,
        speed,
        spin: chopper.spin + CHOP_SPIN * dt,
      },
      // The player is in it, so he is wherever it is - and his height is the
      // machine's, which is what the camera and the jetpack both read.
      player: { ...state.player, ...moved, height, angle, heading: angle },
    };
  } else if (chopper.spin !== 0) {
    next = { ...state, chopper: { ...chopper, spin: 0, speed: 0 } };
  }
  return next;
}

/**
 * The anti-aircraft guns round the base.
 *
 * @param state - the city
 * @returns the city, with a volley on its way if anything is up there
 * @remarks
 * They fire at height, not at people: walk past one and it does nothing, come
 * over it at a hundred pixels and every gun in range opens up at once. That is
 * what makes the helicopter worth taking off the base rather than flying over
 * it, and what the jetpack does not get one past.
 */
function runAck(state: GameState): GameState {
  const up = state.player.height >= ACK_FLOOR;
  const due = state.time >= state.ackAt;
  // A wreck is cleared and a new launcher put in its place. The army has more
  // of them; what shooting one up buys is a quarter of a minute of quiet.
  const mended = state.acks.map((site) =>
    site.backAt !== null && state.time >= site.backAt
      ? { ...site, health: ACK_HEALTH, backAt: null }
      : site,
  );
  let next: GameState = { ...state, acks: mended };
  if (up && due) {
    next = { ...state, ackAt: state.time + ACK_EVERY };
    for (const site of next.acks) {
      if (site.backAt === null && far(site, state.player) < ACK_RANGE) {
        next = ackShot(next, site);
      }
    }
  }
  return next;
}

/**
 * A launcher taking a hit.
 *
 * @param state - the city
 * @param at - which one, by where it stands
 * @param amount - what the round takes off
 * @returns the city, with the launcher damaged or in pieces
 */
function hurtAck(state: GameState, at: Vec, amount: number): GameState {
  let hit = false;
  const acks = state.acks.map((site) => {
    let after = site;
    if (site.backAt === null && far(site, at) < ACK_SIZE) {
      hit = true;
      const health = Math.max(0, site.health - amount);
      after = {
        ...site,
        health,
        backAt: health <= 0 ? state.time + ACK_REPAIR : null,
      };
    }
    return after;
  });
  return !hit
    ? state
    : {
        ...state,
        acks,
        log: acks.some((site) => site.backAt === state.time + ACK_REPAIR)
          ? note(state.log, "Flakstellung zerstört.")
          : state.log,
      };
}

/** One round, from one gun, at whatever is in the air. */
function ackShot(state: GameState, at: Vec): GameState {
  const angle = Math.atan2(state.player.y - at.y, state.player.x - at.x);
  return {
    ...state,
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: at.x + Math.cos(angle) * MUZZLE,
        y: at.y + Math.sin(angle) * MUZZLE,
        angle,
        left: ACK_RANGE,
        speed: ACK_SPEED,
        damage: ACK_DAMAGE,
        shape: "shot",
        from: "police",
        blowAt: null,
      },
    ],
  };
}

/**
 * Whether the player could step onto the train from where he stands.
 *
 * @param state - the city
 * @returns true beside a train that is standing at a platform
 * @remarks
 * Exported because the button row has to know whether to offer it: a button
 * for a train that is not there would be worse than no button at all.
 * @remarks
 * Only while it waits. Jumping onto a moving train at eighty is a stunt this
 * city does not do - what happens to somebody on the line while it moves is
 * {@link hitByTrain}, and that is the other kind of getting aboard.
 */
export function canBoard(state: GameState): boolean {
  return (
    state.player.car === null &&
    atPlatform(state.train, state.time) &&
    trainCars(state.train).some(
      (car) => far(car.at, state.player) < BOARD_REACH,
    )
  );
}

/** Stepping aboard: the carriage behind the engine. */
function getOn(state: GameState): GameState {
  const seat = trainCars(state.train)[RIDE_CAR];
  return seat === undefined
    ? state
    : {
        ...state,
        player: { ...state.player, aboard: true, x: seat.at.x, y: seat.at.y },
        log: note(state.log, "Eingestiegen. Die Bahn faehrt gleich weiter."),
      };
}

/** And stepping off, beside the line rather than on it. */
function getOff(state: GameState): GameState {
  const seat = trainCars(state.train)[RIDE_CAR];
  const angle = seat === undefined ? 0 : seat.angle + Math.PI / 2;
  return {
    ...state,
    player: {
      ...state.player,
      aboard: false,
      x: state.player.x + Math.cos(angle) * OFF_TRAIN,
      y: state.player.y + Math.sin(angle) * OFF_TRAIN,
    },
    log: note(state.log, "Ausgestiegen."),
  };
}

/** Which carriage one rides in: the first one behind the engine. */
const RIDE_CAR = 1;

/** How far from the middle of the track one lands getting off, in pixels. */
const OFF_TRAIN = 34;

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
  const took = jacked
    ? trouble(state, 1, "Autodiebstahl")
    : manned
      ? trouble(state, SHOT_STARS, "Einem Polizisten den Wagen weggenommen")
      : state;
  // **A police machine is wanted from the moment one sits on it**, whether it
  // was taken off a policeman or found standing at a kerb. Nobody has to see
  // it happen: the radio in it is theirs, and it stops answering the moment
  // somebody else is at the wheel.
  const stolen = car.kind === "police" || isPatrol(car.body);
  const withStar = stolen
    ? wanted(took, PATROL_STARS, "Polizeifahrzeug genommen", PATROL_STARS)
    : took;
  // Somebody still aboard is pulled out and left standing at the door. This
  // is the only way to a tank: they bring one at six stars, and taking it off
  // them is the whole of getting one.
  const thrown = manned ? throwOut(withStar, car) : withStar;
  const emptied = jacked ? tipOut(thrown, car) : thrown;
  const boarded = getIn(emptied);
  return {
    ...boarded,
    player: { ...boarded.player, car: car.id, angle: car.angle },
    // The paint stays what it was. A patrol car one has taken is still a
    // patrol car - taking one is the point of taking one - and what stops it
    // from behaving like the law is the empty crew, not a change of livery.
    cars: boarded.cars.map((each) =>
      each.id === car.id
        ? { ...each, driven: true, crew: 0, seats: 0, braking: false }
        : each,
    ),
    log: note(
      boarded.log,
      jacked ? "Wagen geklaut." : manned ? "Rausgezerrt." : "Eingestiegen.",
    ),
  };
}

/**
 * Whoever works for you and is standing near the car gets in with you.
 *
 * @param state - the city, at the moment the player takes a seat
 * @returns the city with those men off the street and in the car
 * @remarks
 * They are lifted out of {@link GameState.people} entirely rather than being
 * driven along as passengers with coordinates. A man in a car is not somewhere
 * else in the street, and the alternative - four gang members jogging after a
 * car at running pace - was the thing that made a crew useless the moment one
 * got behind a wheel.
 */
function getIn(state: GameState): GameState {
  const aboard = state.people.filter(
    (person) =>
      state.crew.includes(person.id) &&
      person.mood !== "down" &&
      far(person, state.player) < CREW_BOARD,
  );
  return aboard.length === 0
    ? state
    : {
        ...state,
        riders: [...state.riders, ...aboard],
        people: state.people.filter((person) => !aboard.includes(person)),
        log: note(
          state.log,
          `${String(aboard.length)} von deinen Leuten steigen mit ein.`,
        ),
      };
}

/**
 * And out again, at the door, when the driver gets out.
 *
 * @param state - the city, with the player already back on the pavement
 * @param car - the car they were all in
 * @returns the city with them standing round it
 */
function putDown(state: GameState, car: Car): GameState {
  const out = state.riders.map((person, at) => {
    const way = (at / Math.max(1, state.riders.length)) * Math.PI * 2;
    const spot = {
      x: car.x + Math.cos(way) * CREW_DOOR,
      y: car.y + Math.sin(way) * CREW_DOOR,
    };
    const room = isOpen(state.cells, spot.x, spot.y);
    return {
      ...person,
      x: room ? spot.x : car.x,
      y: room ? spot.y : car.y,
      heading: way,
      mood: "walking" as const,
    };
  });
  return state.riders.length === 0
    ? state
    : { ...state, riders: [], people: [...state.people, ...out] };
}

/** How near the car one of your men has to be to get in, in pixels. */
const CREW_BOARD = 150;

/** And how far from it they stand when they get out again. */
const CREW_DOOR = 34;

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
    // The driver out of his own door on the left, the rest out of the other.
    const side = seat === 0 ? -1 : 1;
    born.push({
      id,
      carId: car.id,
      x: car.x - Math.sin(car.angle) * CAR_WIDTH * side,
      y: car.y + Math.cos(car.angle) * CAR_WIDTH * side,
      angle: car.angle,
      walked: 0,
      pace: 0,
      health: COP_HEALTH,
      holds: COP_ARMS[(car.id + seat) % COP_ARMS.length] ?? "pistol",
      reloadAt: state.time + COP_RELOAD,
      // Out of the car, and then into position: a second of walking round
      // before anybody points anything at anybody, and each man to his own
      // place in the ring.
      readyAt: state.time + COP_FORM,
      guards: null,
      post: ((car.id + seat) * Math.PI * 2) / COP_POSTS,
      burst: COP_BURST,
      stillUntil: null,
      boardAt: null,
    });
  }
  return { ...state, cops: [...state.cops, ...born] };
}

/**
 * The people who were in a car, put out of it.
 *
 * @param state - the city, at the moment the door is opened
 * @param car - the car being taken
 * @returns the city with them standing in the road beside it
 * @remarks
 * The driver first, at his own door, and then whoever was sitting with him -
 * out of the other doors and away. They are frightened, which means they run,
 * which is the only sensible thing to do when somebody drags you out of your
 * own car in the middle of Los Santos.
 *
 * This is why a car in the traffic is worth taking rather than picking up: one
 * that is standing at the kerb is nobody. One with people in it leaves three
 * witnesses in the road behind you.
 */
function tipOut(state: GameState, car: Car): GameState {
  const born: Person[] = [];
  let rng = state.rng;
  let id = state.people.reduce((most, person) => Math.max(most, person.id), 0);
  for (let seat = 0; seat < car.seats; seat += 1) {
    // The driver out of the driver's door, which is the left one.
    const side = seat % 2 === 0 ? -1 : 1;
    const back = Math.floor(seat / 2) * DOOR_BACK;
    const at = {
      x:
        car.x -
        Math.sin(car.angle) * DOOR_OUT * side -
        Math.cos(car.angle) * back,
      y:
        car.y +
        Math.cos(car.angle) * DOOR_OUT * side -
        Math.sin(car.angle) * back,
    };
    id += 1;
    const made = makePerson(
      rng,
      id,
      isOpen(state.cells, at.x, at.y) ? at : car,
    );
    rng = made.rng;
    born.push({
      ...made.person,
      mood: "walking",
      scaredAt: state.time + SCARE_SECONDS,
      heading: car.angle + (Math.PI / 2) * side,
    });
  }
  return born.length === 0
    ? state
    : {
        ...state,
        rng,
        people: [...state.people, ...born],
        log: note(state.log, "Der Fahrer steht jetzt auf der Strasse."),
      };
}

/**
 * How far out of the car somebody lands, in pixels.
 *
 * @remarks
 * Clear of the bodywork, not against it. At twenty two the driver landed
 * inside the very car he had just been pulled out of and was promptly run
 * over by it, which is a thing that happened every single time.
 */
const DOOR_OUT = 34;

/** And how far back the second row of doors is. */
const DOOR_BACK = 16;

/** Getting out again, beside the car. */
function leaveCar(state: GameState): GameState {
  const car = carOf(state);
  return car === null
    ? state
    : {
        ...putDown(state, car),
        player: {
          ...state.player,
          car: null,
          // Out of the door he got in by, which is the one on the left.
          x: car.x + Math.cos(car.angle - Math.PI / 2) * bodyRadius(car.body),
          y: car.y + Math.sin(car.angle - Math.PI / 2) * bodyRadius(car.body),
        },
        cars: state.cars.map((each) =>
          // Left standing, and it stays standing. A car nobody is in is not
          // traffic any more: the traffic is the cars with somebody in them,
          // and this one has just had its driver thrown out and then walked
          // away from by the man who threw him out.
          each.id === car.id
            ? {
                ...each,
                kind: "parked",
                driven: false,
                speed: 0,
                braking: false,
                locked: false,
                wakeAt: 0,
                lean: 0,
              }
            : each,
        ),
      };
}

/**
 * Whether somebody has this car's driver's door open.
 *
 * @param state - the city
 * @param car - the car
 * @returns true while the player is standing in the open door of it
 * @remarks
 * A driver whose door has just been pulled open stops the car. It goes through
 * the same brake the traffic uses for a red light, so the brake lights come on
 * with it and there is nothing new to draw - and without it the driver simply
 * carried on, leaving the man who opened the door standing in the road and
 * then appearing inside the car half a second later, sixty pixels away.
 */
function beingOpened(state: GameState, car: Car): boolean {
  const board = state.player.boarding;
  return board !== null && board.openAt !== null && board.car === car.id;
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
 *
 * @param steer - a direction to walk in instead of the keys, or null for the
 *   keys. What {@link boardCar} steers with: the walk round to a door is the
 *   same walk in every other respect - the same pace, the same walls, the same
 *   bodywork in the way - and only the question of which way is answered
 *   somewhere else.
 */
function walk(
  state: GameState,
  input: Input,
  dt: number,
  steer: Vec | null = null,
): GameState {
  const dx =
    steer === null ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : steer.x;
  const dy =
    steer === null ? (input.down ? 1 : 0) - (input.up ? 1 : 0) : steer.y;
  const length = Math.hypot(dx, dy);
  const pace = WALK_SPEED * sprint(state.player.god, input.boost, false);
  const step = length === 0 ? 0 : (pace * dt) / length;
  // **Where a wall is depends on how high he is.** On the pavement a house is
  // a wall; on its roof it is the floor; over the top of everything there is
  // nothing in the way at all. One question, asked of the height - see
  // {@link clears} - which is also what lets somebody walk off the edge of a
  // roof and start falling instead of being stopped at it by nothing.
  const high = state.player.height;
  const want = slide(state.cells, state.player, dx * step, dy * step, high);
  // Bodywork is solid: neither the player nor anybody on the pavement walks
  // through a car. Once his feet are off the road it is not, for the same
  // reason - a man on a roof is not in anybody's boot.
  const moved =
    state.time < state.player.floorUntil ||
    (high <= 0 && blocked(state, want, state.player))
      ? { x: state.player.x, y: state.player.y }
      : want;
  const aimed = Math.atan2(input.aim.y - moved.y, input.aim.x - moved.x);
  const looking =
    input.aim.x === 0 && input.aim.y === 0 ? state.player.angle : aimed;
  const went = Math.hypot(moved.x - state.player.x, moved.y - state.player.y);
  // The feet turn towards the keys rather than onto them: eight directions
  // snapped through is a sprite changing, not somebody turning.
  const facing = length === 0 ? state.player.heading : Math.atan2(dy, dx);
  const swung = turnToward(state.player.heading, facing, FOOT_TURN * dt);
  const walked: GameState = {
    ...state,
    player: {
      ...state.player,
      ...moved,
      angle: looking,
      heading: swung,
      walked: stridden(state.player.walked, went, dt),
      pace: dt === 0 ? 0 : went / dt / WALK_SPEED,
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
  // The cheat takes the knock as well as the damage. Being flat on the tarmac
  // for two seconds is what being run over actually costs, and a cheat that
  // left that in would still let a bus stop somebody who cannot be hurt.
  const hit = player.god
    ? undefined
    : state.cars.find(
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
function turnToward(from: number, want: number, most: number): number {
  const away = angleTo(from, want);
  return from + Math.max(-most, Math.min(most, away));
}

/**
 * How far the cycle has run, which is a distance rather than a time.
 *
 * @param walked - how far it had walked before
 * @param went - how far it moved this step, in pixels
 * @param dt - how much time that took, in seconds
 * @returns the new reading of the cycle
 */
function stridden(walked: number, went: number, dt: number): number {
  let next: number;
  if (went > 0) {
    // Distance drives the cycle, but only up to a point - see CYCLE_CAP.
    next = walked + Math.min(went, CYCLE_CAP * dt);
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
    const boost = sprint(state.player.god, input.boost, true);
    const shape = VEHICLES[car.body];
    const top = shape.top * boost;
    // A wreck has no engine left. The brake still works, and so does the drag:
    // it rolls out and then stands there, which is the moment to get out.
    const dead = car.health <= 0;
    // The space bar: on foot it is the jetpack, behind a wheel it is the
    // handbrake. Locked back wheels slow the car and, more to the point, stop
    // holding it in line - see the grip below.
    const hand = input.lift && !dead;
    const held = hand
      ? Math.sign(car.speed) * Math.max(0, Math.abs(car.speed) - HAND_DRAG * dt)
      : car.speed;
    // **The thumb points where the car is to go.** With a stick down, up and
    // down stop meaning throttle and brake: the car drives, and it turns
    // itself towards the heading the thumb is pointing at. Pushing the stick
    // south used to reverse a car that was heading north, which is what the
    // key underneath it does and is not what one asked for.
    // Null-ish rather than null: an input built without the field at all is a
    // keyboard as far as this is concerned, not a stick pointing at nowhere.
    const stick = input.steer ?? null;
    const pointed = stick !== null && (stick.x !== 0 || stick.y !== 0);
    const off = pointed ? turned(car.angle, Math.atan2(stick.y, stick.x)) : 0;
    const gas = pointed || input.up;
    const slow = !pointed && input.down;
    const push =
      (gas && !dead ? shape.accel * boost : 0) - (slow ? CAR_BRAKE : 0);
    const drag = Math.sign(held) * CAR_DRAG;
    const raw = held + (push - (gas || slow ? 0 : drag)) * dt;
    // Backwards: half the top speed on four wheels, walking pace on two. A
    // motorbike has no reverse gear - the rider puts his feet down and paddles
    // it back, and that is as fast as paddling gets.
    const astern = twoWheeled(car.body) ? PADDLE_BACK : top / 2;
    const speed = Math.max(-astern, Math.min(top, raw));
    // A standing car does not steer: the wheel turns the tyres, and tyres that
    // are not rolling turn nothing.
    // With the back end locked the wheel works at a crawl and bites harder -
    // which is what lets a car turn on its own axle instead of driving a
    // circle around itself.
    const floor = CAR_TURN_FLOOR * (hand ? HAND_LOCK : 1);
    const rolling = Math.min(1, Math.abs(speed) / floor);
    // Eased rather than slammed: full lock while the nose is a long way off the
    // heading, tailing away as it comes round, so the car settles on the line
    // instead of hunting either side of it.
    const turn = pointed
      ? Math.max(-1, Math.min(1, off / STICK_EASE))
      : (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const rate = shape.turn * (hand ? HAND_TURN : 1);
    const swing = turn * rate * rolling * Math.sign(speed || 1) * dt;
    // What the tyres can hold sideways this step. On the brakes they bite; on
    // the throttle they let go a little, which is why one can bring the back
    // round by going faster and straighten it by braking.
    const bite =
      shape.grip * (hand ? HAND_GRIP : slow ? GRIP_BRAKE : gas ? GRIP_PUSH : 1);
    const moved = rollCar(state.cells, car, swing, speed, bite, dt);
    const angle = moved.angle;
    const lean = leaning(car, swing / dt, speed, dt);
    // Brake lights: the pedal while there is something to slow down, or the
    // handbrake whatever the car is doing. Standing still with a **foot** on
    // the brake lights nothing up, because a parked car with its brake lights
    // on looks like a car about to pull away - but a car standing on its
    // handbrake is a car that is staying put, and that is worth saying.
    // **Only while the pedal is still slowing it down.** Past nought the same
    // key is the reverse throttle, not the brake, and a car backing out of a
    // space with its brake lights on is a car doing two things at once.
    const braking = hand || (slow && car.speed > 1);
    // The turret looks where the mouse looks, not where the tracks point.
    // Straight away rather than swinging round: the shell is meant to land on
    // the crosshair, and a turret that lags puts it somewhere else.
    const turret = Math.atan2(input.aim.y - moved.y, input.aim.x - moved.x);
    next = {
      ...state,
      cars: state.cars.map((each) =>
        each.id === car.id
          ? { ...each, ...moved, angle, turret, braking, locked: hand, lean }
          : each,
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

/**
 * How far over a two-wheeler is, after this step.
 *
 * @param car - the vehicle as it stands
 * @param rate - how fast its nose is coming round, in radians a second
 * @param speed - what it is doing along its nose
 * @param dt - seconds since the last step
 * @returns the new lean, in pixels of offset
 * @remarks
 * Turn rate times speed is the sideways pull on it, and that is what a rider
 * leans against: hard corner, far over; walking pace, upright whatever the
 * bars are doing. Eased rather than set, because a bike that snapped from
 * upright to full lean in one frame would flick rather than lean.
 */
function leaning(car: Car, rate: number, speed: number, dt: number): number {
  const want = twoWheeled(car.body)
    ? Math.max(-LEAN_MOST, Math.min(LEAN_MOST, (rate * speed) / LEAN_STIFF))
    : 0;
  return car.lean + (want - car.lean) * Math.min(1, dt * LEAN_RATE);
}

/** Moves a car, stopping it dead against a wall. */
function slideCar(
  cells: readonly Cell[],
  car: Car,
  angle: number,
  speed: number,
  dt: number,
): { x: number; y: number; speed: number; rolled: number } {
  const dx = Math.cos(angle) * speed * dt;
  const dy = Math.sin(angle) * speed * dt;
  const moved = slide(cells, car, dx, dy);
  // Stopped dead, rather than merely scraping along a wall: a car that got
  // less than half the way it wanted hit something head on.
  const went = Math.hypot(moved.x - car.x, moved.y - car.y);
  const blocked = speed !== 0 && went < Math.hypot(dx, dy) / 2;
  return {
    ...moved,
    speed: blocked ? 0 : speed,
    // What the wheels have to show for it. Signed by the way the car is
    // going, so that one in reverse turns its wheels backwards - and taken
    // from how far it **actually** got, so that wheels do not spin against a
    // wall the car is stuck on.
    rolled: car.rolled + Math.sign(speed) * went,
  };
}

/**
 * One step of a vehicle that has tyres on it.
 *
 * @param cells - the city floor
 * @param car - the vehicle as it stands
 * @param swing - how far the nose turns this step, in radians
 * @param speed - what it is doing along its nose after the pedals
 * @param bite - how quickly the tyres pull a slide straight, in shares a
 *   second
 * @param dt - seconds since the last step
 * @returns where it ends up, which way it points, and what it is now doing
 *   along and across itself
 * @remarks
 * The whole driving model, and it is six lines of arithmetic.
 *
 * Turning the nose does **not** turn what the car is already doing. The same
 * movement, read in the new direction, has a sideways part - so every degree
 * of steering at speed feeds the slide. The tyres then eat that sideways part
 * at whatever the body grips at. Eat it faster than the wheel feeds it and the
 * car simply follows its nose, which is what happens at sensible speeds; eat
 * it slower and the thing is drifting.
 *
 * That is why nothing in here says "drift". A drift is what it looks like when
 * the second number wins.
 */
function rollCar(
  cells: readonly Cell[],
  car: Car,
  swing: number,
  speed: number,
  bite: number,
  dt: number,
): {
  x: number;
  y: number;
  angle: number;
  speed: number;
  slip: number;
  rolled: number;
} {
  const angle = car.angle + swing;
  const forward = speed * Math.cos(swing) + car.slip * Math.sin(swing);
  const across = -speed * Math.sin(swing) + car.slip * Math.cos(swing);
  // The tyres pull the slide straight at a rate, not by a fixed amount: how
  // far sideways the car ends up settles where the steering feeds it in as
  // fast as the tyres take it out. A fixed amount made it all or nothing -
  // one notch of grip either killed every slide or let the car spin.
  const slip = across * Math.exp(-bite * dt);
  const side = angle + Math.PI / 2;
  const dx = (Math.cos(angle) * forward + Math.cos(side) * slip) * dt;
  const dy = (Math.sin(angle) * forward + Math.sin(side) * slip) * dt;
  const moved = slide(cells, car, dx, dy);
  // Stopped dead rather than merely scraping along a wall: whatever got less
  // than half the way it wanted hit something head on, and a car that hits a
  // wall keeps neither its speed nor its slide.
  const went = Math.hypot(moved.x - car.x, moved.y - car.y);
  const hit = forward !== 0 && went < Math.hypot(dx, dy) / 2;
  return {
    ...moved,
    angle,
    speed: hit ? 0 : forward,
    slip: hit ? 0 : slip,
    rolled: car.rolled + Math.sign(forward) * went,
  };
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
  high = 0,
): { x: number; y: number } {
  const hops = Math.max(1, Math.ceil(Math.hypot(dx, dy) / HOP));
  let at = { x: body.x, y: body.y };
  for (let hop = 0; hop < hops; hop += 1) {
    at = nudge(cells, at, dx / hops, dy / hops, high);
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
  high = 0,
): { x: number; y: number } {
  const stepX = { x: body.x + dx, y: body.y };
  const okX = clears(cells, stepX, high) ? stepX.x : body.x;
  const stepY = { x: okX, y: body.y + dy };
  const okY = clears(cells, stepY, high) ? stepY.y : body.y;
  return {
    x: Math.max(0, Math.min(CITY_SIZE, okX)),
    y: Math.max(0, Math.min(CITY_SIZE, okY)),
  };
}

/**
 * Whether somebody at this height gets past whatever is at a point.
 *
 * @param cells - the city floor
 * @param at - the point
 * @param high - how far off the road they are, in pixels
 * @returns true where they may stand or pass
 * @remarks
 * Three answers in one, and the middle one is the new one:
 *
 * - **Open ground** is open to anybody, which is every case but a building,
 *   the water and the wire.
 * - **A roof one has reached** is ground. At or above the height of the
 *   building under a point, one walks onto it: that is what landing on a roof
 *   means, and it is also what makes walking off the far side of one a matter
 *   of walking off it rather than of being stopped by a handrail that is not
 *   there.
 * - **Above {@link ROOF_HEIGHT}** nothing is in the way at all, because that
 *   is above everything - including the water and the fence, which have no
 *   roof to land on and are solid at every height below it.
 */
function clears(cells: readonly Cell[], at: Vec, high: number): boolean {
  // Asked in this order because of what it costs. Every car in the city tests
  // every step it takes against this, and all of them are on the road: the two
  // cheap answers settle it for everything with tyres, and the height of the
  // building only has to be worked out for somebody who is actually off the
  // ground and up against one.
  let ok: boolean;
  if (isOpen(cells, at.x, at.y) || high >= ROOF_HEIGHT) {
    ok = true;
  } else if (high <= 0) {
    ok = false;
  } else {
    const roof = roofAt(cells, at.x, at.y);
    ok = roof > 0 && high >= roof;
  }
  return ok;
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
  // The detonator counts as loaded while anything of its is still lying about:
  // the last charge one puts down must not be the one that takes the button
  // out of one's hand.
  const armed = player.car === null && carried(beltOf(state), player.weapon);
  const ready =
    input.fire &&
    state.time >= player.reloadAt &&
    state.time >= player.floorUntil &&
    (armed || turret);
  // **The other trigger.** Held, not pressed, and it belongs to the tank: the
  // machine gun goes on for as long as the button is down. It is checked apart
  // from the chain below because both may fire in the same frame - that is
  // what having two weapons on one vehicle means.
  const rattling =
    turret &&
    seat !== null &&
    input.spray &&
    state.time >= player.gunAt &&
    state.time >= player.floorUntil;
  let next = state;
  if (ready && turret && seat !== null) {
    // The one thing that shoots from a seat, because the seat is a tank.
    next = fireShell(state, seat, input.aim);
    next = {
      ...next,
      player: { ...next.player, reloadAt: state.time + SHELL_RELOAD },
    };
  } else if (ready && gun.way === "planted") {
    // The left button on this one sets off what is already lying about, and
    // costs no round: the charges were paid for when they were put down.
    next = {
      ...setOff(state),
      player: { ...state.player, reloadAt: state.time + gun.reload },
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
  if (rattling && seat !== null) {
    next = fireCoax(next, seat, input.aim);
    next = {
      ...next,
      player: { ...next.player, gunAt: state.time + COAX_RELOAD },
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
    (each) =>
      each.mood !== "down" &&
      KINDS[each.kind].side !== "mine" &&
      far(each, tip) < gun.range,
  );
  const cop = state.cops.find(
    (each) => each.health > 0 && far(each, tip) < gun.range,
  );
  // And what one hits when there is nobody there: a car. The fist used to pass
  // straight through bodywork, so thumping a patrol car on the bonnet was the
  // one provocation in the city that provoked nothing at all.
  const car = state.cars.find(
    (each) =>
      each.health > 0 &&
      each.id !== player.car &&
      far(each, tip) < bodyRadius(each.body),
  );
  let next = state;
  if (cop !== undefined) {
    next = hurtCop(next, cop.id, gun.damage);
    next = wanted(next, SHOT_STARS, "Auf einen Polizisten losgegangen");
  } else if (person !== undefined) {
    next = hurtPerson(next, person.id, gun.damage);
    next = startFeud(next, KINDS[person.kind].side);
    next = trouble(next, 1, "Jemanden niedergeschlagen");
  } else if (car !== undefined) {
    next = damageCar(next, car.id, gun.damage);
    next =
      car.kind === "police" || isPatrol(car.body)
        ? wanted(next, PATROL_STARS, "Einen Streifenwagen angegriffen")
        : trouble(next, 1, "Sachbeschädigung");
  }
  // Only a blow that lands is worth running from. Shadow-boxing in the middle
  // of the pavement used to clear the street - which made the fist, the one
  // weapon everybody starts with, a way of emptying a city by accident.
  const landed = cop !== undefined || person !== undefined || car !== undefined;
  return landed ? startle(next, player, PUNCH_HEARD) : next;
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

/**
 * The machine gun mounted beside the tank's main gun.
 *
 * @param state - the city
 * @param tank - the machine it is bolted to
 * @param aim - where the crosshair is
 * @returns the city with one round of it in the air
 * @remarks
 * **A tank is two weapons, not one.** The cannon is for what is worth a shell;
 * everything else - a man in the road, a car that will not get out of the way,
 * a window - is what the coaxial is for, and a tank without one is a very slow
 * vehicle with a single-shot gun on it.
 *
 * It is bolted **beside the barrel**, so it points where the turret points and
 * not where the hull does, and it throws its rounds with a little spread on
 * them: a burst that all goes through the same hole is not a machine gun. It
 * is not part of the belt one carries and has no ammunition of its own - the
 * rounds are in the tank, and there are a great many of them.
 */
function fireCoax(state: GameState, tank: Car, aim: Vec): GameState {
  const drawn = nextRandom(state.rng);
  const angle = tank.turret + (drawn.value - HALF) * COAX_SPREAD * 2;
  return {
    ...state,
    rng: drawn.state,
    bullets: [
      ...state.bullets,
      {
        id: nextBulletId(state),
        x: state.player.x + Math.cos(angle) * COAX_MUZZLE,
        y: state.player.y + Math.sin(angle) * COAX_MUZZLE,
        angle,
        left: Math.min(
          COAX_RANGE,
          Math.max(0, far(state.player, aim) - COAX_MUZZLE),
        ),
        speed: COAX_SPEED,
        damage: COAX_DAMAGE,
        shape: "shot",
        from: "player",
        blowAt: null,
      },
    ],
  };
}

/** How long between two rounds of it, in seconds: about eleven a second. */
const COAX_RELOAD = 0.09;

/** What one round takes off, which is a machine gun round and no more. */
const COAX_DAMAGE = 11;

/** How far it carries, in pixels. */
const COAX_RANGE = 560;

/** How fast the round flies. */
const COAX_SPEED = 860;

/** How far off the barrel a round may go, in radians either way. */
const COAX_SPREAD = 0.045;

/** And where it appears: beside the barrel, clear of the turret. */
const COAX_MUZZLE = 30;

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
    // The player's shots hit the police, and so do his gang's: a crew that
    // fires at a patrol and cannot touch it is a crew firing blanks.
    const atPolice = mine || shot.from === "mine";
    const cop = atPolice
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
        // One's own bonnet stops one's own bullets, and nothing else does:
        // whoever sits in a car while the police stand round it has his
        // bodywork taken apart, which is what the bodywork is for.
        (each.id !== next.player.car || !mine) &&
        far(each, { x, y }) < bodyRadius(each.body),
    );
    // The launchers round the base are targets like anything else, and only
    // the player's own rounds count against them - a guard who put a burst
    // into his own air defence would be doing the raid a favour.
    const ack =
      mine || shot.from === "mine"
        ? next.acks.find(
            (site) => site.backAt === null && far(site, { x, y }) < ACK_SIZE,
          )
        : undefined;
    const struck =
      person !== undefined ||
      cop !== undefined ||
      heli !== null ||
      onPlayer ||
      ack !== undefined ||
      car !== undefined;
    const spent = left <= 0 || wall;
    if (shot.shape === "rocket" || shot.shape === "grenade") {
      // These two do not care what they touched, only that they stopped.
      if (struck || spent || fused) {
        // A rocket is a rocket; a grenade is only a bang. What the launcher
        // and the tank gun touch burns, and burning is what kills a car.
        next = blast(next, { x, y }, shot.damage, shot.shape === "rocket");
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
    } else if (ack !== undefined) {
      next = hurtAck(next, ack, shot.damage);
    } else if (cop !== undefined) {
      next = hurtCop(next, cop.id, shot.damage);
      // Only what the player fires himself is put on his account. What his
      // people do is their business - and if it were not, hiring a crew would
      // be a way of raising one's own wanted level.
      next = mine
        ? wanted(next, SHOT_STARS, "Auf einen Polizisten geschossen")
        : next;
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
    // Not his own. A stray round into a green shirt is an accident among
    // friends - see {@link startFeud} - and an accident that killed the man
    // would be an accident one could not take back.
    can = side !== "mine";
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
 * The pause the law takes after losing somebody.
 *
 * @param state - the city
 * @returns the city with the next patrol pushed back
 * @remarks
 * One place, because both halves of a unit count: the car and the two men in
 * it. Never brought forward - if they were already keeping their distance for
 * longer than this, they go on keeping it.
 */
function regroup(state: GameState): GameState {
  return {
    ...state,
    patrolAt: Math.max(state.patrolAt, state.time + POLICE_AGAIN),
  };
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
 *
 * **Only the orange ones ever turn on the player.** Hitting one of your own is
 * an accident among friends: they do not like it, and they go on working for
 * you anyway.
 */
function startFeud(state: GameState, side: Side): GameState {
  return side !== "rival" || state.feud
    ? state
    : {
        ...state,
        feud: true,
        log: note(
          state.log,
          "Die gegnerische Bande hat es auf dich abgesehen.",
        ),
      };
}

/** Damage on somebody in the street; at zero they go down for a while. */
function hurtPerson(state: GameState, id: number, amount: number): GameState {
  const dying = state.people.find(
    (person) =>
      person.id === id && person.mood !== "down" && person.health - amount <= 0,
  );
  const armed =
    dying === undefined ? state : dropArms(state, dying, dying.holds);
  const after =
    dying === undefined ? armed : dropCash(armed, dying, PURSE[dying.kind]);
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
 * What falls out of a dead man's pocket, lying where he fell.
 *
 * @param state - the city
 * @param at - where he went down
 * @param worth - what he was carrying, in euros
 * @returns the city with a fold of notes on the ground
 * @remarks
 * Nothing at all for the beggar - see PURSE in ./people - and nothing for the
 * police, who are not people in this game at all but {@link Cop}s and go down
 * by another road entirely.
 */
function dropCash(state: GameState, at: Vec, worth: number): GameState {
  return worth <= 0
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
            holds: "cash",
            worth,
            backAt: null,
            again: false,
          },
        ],
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
            worth: 0,
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
function blast(
  state: GameState,
  at: Vec,
  force: number,
  torch = false,
): GameState {
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
  for (const site of next.acks) {
    const hit = site.backAt === null ? share(site) : 0;
    if (hit > 0) {
      next = hurtAck(next, site, hit);
    }
  }
  for (const car of next.cars) {
    const hit = share(car);
    if (hit > 0) {
      next = damageCar(next, car.id, hit, torch);
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
    (each) =>
      each.mood !== "down" &&
      // Not your own, here either: a grenade that killed the crew standing
      // round it would make the whole gang a liability rather than a crew.
      KINDS[each.kind].side !== "mine" &&
      share(each) > 0,
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
    dying === undefined ? state : regroup(dropArms(state, dying, dying.holds));
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
function damageCar(
  state: GameState,
  id: number,
  amount: number,
  torch = false,
): GameState {
  // Nothing touches the car the cheat is driving. Being unkillable on foot and
  // then dying because the bodywork ran out is not being unkillable.
  if (state.player.god && id === state.player.car) {
    return state;
  }
  // Whatever hits a tank hits armour first.
  const hit = state.cars.find((car) => car.id === id);
  const took =
    hit !== undefined && hit.body === "tank" ? amount * TANK_ARMOUR : amount;
  const wrecked = state.cars.some(
    (car) =>
      car.id === id &&
      car.kind === "police" &&
      car.health > 0 &&
      car.health - took <= 0,
  );
  const from = wrecked ? regroup(state) : state;
  return {
    ...from,
    cars: from.cars.map((car) => {
      let after = car;
      if (car.id === id) {
        const health = Math.max(0, car.health - took);
        const shells = torch ? car.shells + 1 : car.shells;
        after = {
          ...car,
          health,
          // The clock starts when the bodywork is gone, not before: up to then
          // the bar in the corner is the whole warning. A rocket or a tank
          // shell is the exception - what they touch is alight at once,
          // whatever is left of the bodywork.
          shells,
          // A tank takes three: the first two are holes in it. Anything else
          // burns where the rocket touched it.
          fireAt:
            car.fireAt === null &&
            burns(car.body) &&
            (health <= 0 ||
              (torch && (car.body !== "tank" || shells >= TANK_HITS)))
              ? state.time
              : car.fireAt,
        };
      }
      return after;
    }),
  };
}

/**
 * Whether shooting this to pieces sets it alight.
 *
 * @param body - which sort of vehicle
 * @returns true for everything with a fuel tank in it
 * @remarks
 * **A bicycle has nothing to burn.** No tank, no fuel, no engine - what
 * happens when one shoots at it is that it stops being a bicycle: the frame
 * bends, the wheels go, and it lies in the road. So it never gets a
 * {@link Car.fireAt}, which in one go takes away the smoke, the flames, the
 * countdown and the bang at the end of it - all four of them ask this first.
 * What is left is the soot the picture puts on any wreck, which is exactly
 * what one wants: broken, not burnt.
 */
function burns(body: VehicleBody): boolean {
  return body !== "cycle";
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

/**
 * Traffic drives itself.
 *
 * @remarks
 * **A car on the road is going somewhere.** It used to pick one of the four
 * compass points every two and a half seconds and drive at it whatever was in
 * front; a third of the traffic was therefore standing with its nose in a wall
 * waiting for the timer, which read as a city where cars are parked in the
 * middle of the road. The rules now are the ones a driver has: keep to your
 * own side, only turn where there is something to turn into, stop for whatever
 * is in front of you, and stop at a red light.
 */
function moveTraffic(state: GameState, dt: number): GameState {
  let rng = state.rng;
  // How much traffic is about **in the streets one can see**, which is a much
  // smaller circle than the one that is simulated. Cars stop being stepped at
  // the edge of the simulated circle, so they silt up against the inside of it
  // - fifty of them out there and an empty street in the middle is exactly
  // what this count has to notice.
  let about = state.cars.filter(
    (car) =>
      car.kind === "traffic" &&
      !car.driven &&
      far(state.player, car) < TRAFFIC_ROUND,
  ).length;
  const cars = state.cars.map((car) => {
    let next = car;
    const mine = car.kind === "traffic" && !car.driven && car.health > 0;
    if (mine && near(state.player, car)) {
      const driven = driveTraffic(state, car, rng, dt);
      rng = driven.rng;
      next = driven.car;
    } else if (
      mine &&
      about < TRAFFIC_ABOUT &&
      state.time >= car.turnAt &&
      far(state.player, car) > COME_ROUND_AWAY
    ) {
      about += 1;
      const back = comeRound(state, car, rng);
      rng = back.rng;
      next = back.car;
    }
    return next;
  });
  return { ...state, cars: keepApart(state, cars, dt), rng };
}

/**
 * Cars that ended the step inside one another, pushed back out of it.
 *
 * @param state - the city, for the floor and where the player is
 * @param cars - the traffic as the driving step left it
 * @param dt - seconds since the last step
 * @returns the same list with the overlaps eased apart
 * @remarks
 * **A last resort, and it has to exist.** Everything upstream is a driver
 * making decisions - keep your distance, stop at a red, give way at a junction
 * - and every one of those can be beaten: two cars turn into the same gap from
 * different streets, a parked car is dropped where somebody is already
 * standing, one is shoved into another by a tank. A driver cannot un-crash;
 * what he can do is not sit inside somebody else's boot while it happens, and
 * that is all this does.
 *
 * Each car is taken as **two discs** rather than one, a wheel's distance
 * either side of its middle and as wide as the car is. One disc makes a
 * saloon a circle a car-length across, which would shove the whole kerb apart
 * and break every car park in the city; two give a shape that is long and
 * narrow the way the car is, at four distance checks a pair.
 *
 * Only computer-driven traffic is moved, and only near the player. Parked cars
 * stay where they were parked - a row at the kerb is a row at the kerb, and
 * something has to be the fixed thing for the rest to be pushed out of - and
 * the player's own car is nobody's to shove.
 */
function keepApart(
  state: GameState,
  cars: readonly Car[],
  dt: number,
): readonly Car[] {
  return cars.map((car) => {
    const mine =
      car.kind === "traffic" &&
      !car.driven &&
      car.health > 0 &&
      near(state.player, car);
    if (!mine) {
      return car;
    }
    let push = { x: 0, y: 0 };
    for (const other of cars) {
      if (other.id === car.id || other.health <= 0) {
        continue;
      }
      const span =
        (VEHICLES[car.body].length + VEHICLES[other.body].length) / 2;
      if (far(car, other) > span) {
        continue;
      }
      const out = wedged(car, other);
      push = { x: push.x + out.x, y: push.y + out.y };
    }
    const deep = Math.hypot(push.x, push.y);
    if (deep === 0) {
      return car;
    }
    // Half the overlap a frame, and never more than a car can be shoved in
    // one: a jam clears in three or four frames and nothing teleports.
    const most = Math.min(deep * UNJAM_SHARE, UNJAM_MOST * dt);
    const moved = slide(
      state.cells,
      car,
      (push.x / deep) * most,
      (push.y / deep) * most,
    );
    return { ...car, x: moved.x, y: moved.y };
  });
}

/**
 * How far one car has to move to stop being inside another, and which way.
 *
 * @param car - the one that will be moved
 * @param other - the one it is inside
 * @returns the shove, in pixels; zero where the two are clear of each other
 */
function wedged(car: Car, other: Car): Vec {
  const mine = discs(car);
  const theirs = discs(other);
  const room = (VEHICLES[car.body].width + VEHICLES[other.body].width) / 2;
  let worst = { x: 0, y: 0 };
  let deepest = 0;
  for (const one of mine) {
    for (const two of theirs) {
      const dx = one.x - two.x;
      const dy = one.y - two.y;
      const away = Math.hypot(dx, dy);
      const into = room - away;
      if (into > deepest) {
        deepest = into;
        // Dead centre on top of each other: any way out will do, and along
        // its own nose is the one that looks least like a shunt.
        worst =
          away === 0
            ? { x: Math.cos(car.angle) * into, y: Math.sin(car.angle) * into }
            : { x: (dx / away) * into, y: (dy / away) * into };
      }
    }
  }
  return worst;
}

/** The two discs a vehicle is taken as: one over each axle. */
function discs(car: Car): readonly Vec[] {
  const shape = VEHICLES[car.body];
  const reach = Math.max(0, (shape.length - shape.width) / 2);
  return [
    { x: car.x + Math.cos(car.angle) * reach, y: car.y + Math.sin(car.angle) * reach },
    { x: car.x - Math.cos(car.angle) * reach, y: car.y - Math.sin(car.angle) * reach },
  ];
}

/** How much of the overlap is taken out in one frame. */
const UNJAM_SHARE = 0.5;

/** And the most a car may be shoved in a second, in pixels. */
const UNJAM_MOST = 240;

/**
 * A car that has driven out of the world, brought back into it.
 *
 * @param state - the city
 * @param car - the car, somewhere out of sight
 * @param rng - the generator
 * @returns it on a road near the player again, and the generator afterwards
 * @remarks
 * The traffic is only simulated near the player, so a car that drives away
 * stops where it leaves that circle and stands there for ever. Do that for a
 * minute and the streets round the player are empty - not because the traffic
 * stopped, but because it all left and none of it came back.
 *
 * So it comes back. Far enough out to be off the screen, on a road, pointing
 * somewhere it can actually drive. This is the oldest trick there is in a game
 * with a scrolling city, and what it buys is a city that is as busy on the
 * tenth minute as on the first.
 */
function comeRound(
  state: GameState,
  car: Car,
  rng: RandomState,
): { car: Car; rng: RandomState } {
  let spin = rng;
  let found: Vec | null = null;
  for (let tries = 0; tries < COME_ROUND_TRIES && found === null; tries += 1) {
    const turn = nextRandom(spin);
    const out = nextRandom(turn.state);
    spin = out.state;
    const angle = turn.value * Math.PI * 2;
    const away = COME_ROUND_IN + out.value * (COME_ROUND_OUT - COME_ROUND_IN);
    const at = {
      x: state.player.x + Math.cos(angle) * away,
      y: state.player.y + Math.sin(angle) * away,
    };
    found = cellUnder(state.cells, at.x, at.y) === "road" ? at : null;
  }
  // Pointed inwards: of the ways it could go from there, the one that takes it
  // past the player. A car put down outside the screen and sent off in a random
  // direction is a car nobody ever sees.
  const spot = found;
  const ways =
    spot === null
      ? []
      : WAYS.filter(
          (way) =>
            cellUnder(
              state.cells,
              spot.x + Math.cos(way) * TILE * LOOK_TILES,
              spot.y + Math.sin(way) * TILE * LOOK_TILES,
            ) === "road",
        );
  const inwards = spot === null ? null : inward(ways, spot, state.player);
  return {
    car:
      spot === null
        ? { ...car, turnAt: state.time + COME_ROUND_HOLD }
        : {
            ...car,
            x: spot.x,
            y: spot.y,
            angle: inwards ?? car.angle,
            want: inwards ?? car.angle,
            speed: 0,
            slip: 0,
            braking: false,
            locked: false,
            wakeAt: 0,
            lean: 0,
            rolled: 0,
            turnAt: state.time,
          },
    rng: spin,
  };
}

/** Above this much of its own top speed a car has been hit, not driven. */
const SHOVED_OVER = 1.3;

/** The circle the traffic is counted in, a comfortable screen wide. */
const TRAFFIC_ROUND = 700;

/** How far outside that circle a car has to be to be brought round, in pixels. */
const COME_ROUND_PAST = 20;

/** Which puts the line here. */
const COME_ROUND_AWAY = TRAFFIC_ROUND + COME_ROUND_PAST;

/**
 * How many cars of traffic are kept within sight of the player.
 *
 * @remarks
 * Enough that every street has something on it and a junction is worth
 * looking at, few enough that they are not queueing nose to tail. The rest of
 * the fleet stands where it stopped, out in the city, and is drawn on when
 * this number falls.
 */
const TRAFFIC_ABOUT = 12;

/**
 * Where it comes back: past the corner of the screen, and no further.
 *
 * @remarks
 * The view is about six hundred and forty pixels across and four hundred down,
 * so four hundred and thirty from the middle is off the screen in every
 * direction - and near enough that a car pointed inwards is in the street in
 * front of you within two seconds.
 */
const COME_ROUND_IN = 430;

/** The far edge of that ring. */
const COME_ROUND_OUT = 620;

/** How many places are tried before giving up for now. */
const COME_ROUND_TRIES = 6;

/** How long a car that found nowhere waits before trying again, in seconds. */
const COME_ROUND_HOLD = 2;

/**
 * One computer driver, one step.
 *
 * @param state - the city
 * @param car - the car as it stands
 * @param rng - the generator, for the turns it takes
 * @param dt - seconds since the last step
 * @returns where it got to, and the generator afterwards
 */
function driveTraffic(
  state: GameState,
  car: Car,
  rng: RandomState,
  dt: number,
): { car: Car; rng: RandomState } {
  // A car that has just been shoved is not driving, it is rolling: it keeps
  // whatever speed it was given until the tyres have scrubbed it off, and only
  // then goes back to being traffic. Otherwise being rammed looked like the
  // other driver simply setting off again in a new direction.
  const shoved = Math.abs(car.speed) > TRAFFIC_SPEED * SHOVED_OVER;
  // **The driver decides, the car swings.** He is asked in compass points -
  // and asked from the heading he is *steering to*, not from wherever the nose
  // happens to have got round to, or a car halfway through a right hander
  // would be told there is no road that way and pick a fresh direction every
  // frame. What comes back is where he wants to be pointing; the machine gets
  // there at its own rate, and that arc is the corner.
  const picked = headingFor(state, { ...car, angle: car.want }, rng);
  const want = picked.angle;
  const off = turned(car.angle, want);
  const swing = TRAFFIC_TURN * dt;
  const angle =
    Math.abs(off) <= swing ? want : car.angle + Math.sign(off) * swing;
  // Anything at all in front: the player on foot, the car in the queue ahead,
  // or a junction showing red. All three come out as the same thing - a driver
  // with his foot on the brake - which is why the brake lights need no case of
  // their own.
  const shut =
    beingOpened(state, car) ||
    inTheWay(state, car, angle) ||
    queueAhead(state, car, angle) ||
    redAhead(state, car, angle);
  // **And then he has to notice.** A driver standing still keeps his own
  // clock running half a second ahead; when the road clears, that half second
  // still has to pass before he moves. One car in front of another therefore
  // sets off half a second earlier than it, and a queue unzips from the front
  // instead of pulling away in one piece.
  const stopped = Math.abs(car.speed) < QUEUE_CRAWL;
  const wakeAt = shut && stopped ? state.time + QUEUE_WAKE : car.wakeAt;
  const held = shut || state.time < car.wakeAt;
  // **A bicycle is not a car with thinner tyres.** Traffic all ran at the one
  // speed, so the man pedalling to work kept up with the Golf beside him -
  // which is the one thing about a bicycle in traffic that nobody has ever
  // seen. He does his own pace; everything with an engine does the other.
  const cruise =
    car.body === "cycle" ? TRAFFIC_SPEED * PEDAL_SHARE : TRAFFIC_SPEED;
  const pace = held ? 0 : cruise;
  // No lane pull while the nose is still coming round: a car being dragged
  // sideways towards a lane it is halfway out of crabs through the junction
  // instead of driving round it.
  const sideways =
    Math.abs(off) > TURN_DONE ? 0 : laneDrift(state.cells, car, angle, dt);
  const dx = Math.cos(angle) * pace * dt - Math.sin(angle) * sideways;
  const dy = Math.sin(angle) * pace * dt + Math.cos(angle) * sideways;
  const moved = slide(state.cells, car, dx, dy);
  const went = Math.hypot(moved.x - car.x, moved.y - car.y);
  const stuck = pace > 0 && went < Math.abs(pace * dt) / 2;
  const coast =
    Math.sign(car.speed) * Math.max(0, Math.abs(car.speed) - LOOSE_DRAG * dt);
  return {
    car: shoved
      ? {
          ...car,
          ...slideCar(state.cells, car, car.angle, coast, dt),
          braking: false,
          locked: false,
          wakeAt: 0,
          // Shoved out of line, he steers where he is now pointing: a driver
          // who has just been hit does not carry on towards the junction he
          // was aiming at.
          want: car.angle,
          lean: 0,
        }
      : {
          ...car,
          x: moved.x,
          y: moved.y,
          angle,
          want,
          speed: pace,
          braking: held,
          wakeAt,
          lean: leaning(car, turned(car.angle, angle) / dt, pace, dt),
          locked: false,
          // How far it actually got, which is what its wheels will show. A
          // computer driver never reverses, so this only ever counts up.
          rolled: car.rolled + Math.sign(pace) * went,
          // A driver who has just turned holds that heading for a moment; one
          // that has just been stopped by a wall looks for a way out at once.
          turnAt: stuck
            ? state.time
            : picked.turned
              ? state.time + TURN_HOLD
              : car.turnAt,
        },
    rng: picked.rng,
  };
}

/** The shortest way round from one heading to another, in radians. */
function turned(from: number, to: number): number {
  const round = Math.PI * 2;
  return ((((to - from) % round) + round + Math.PI) % round) - Math.PI;
}

/**
 * Which way a computer driver goes from here.
 *
 * @param state - the city
 * @param car - the car
 * @param rng - the generator
 * @returns the heading, whether it is a new one, and the generator afterwards
 * @remarks
 * Straight on unless there is a reason: a driver who turns at every junction
 * is a driver going nowhere. A turn is only taken **at a crossing**, because
 * anywhere else it is a turn into a front garden - which is what the old
 * timer did, four times a minute, to every car in the city.
 */
function headingFor(
  state: GameState,
  car: Car,
  rng: RandomState,
): { angle: number; turned: boolean; rng: RandomState } {
  const col = Math.floor(car.x / TILE);
  const row = Math.floor(car.y / TILE);
  // Anything but a U turn, and only where there is road to turn into.
  const open = WAYS.filter(
    (way) =>
      Math.cos(way - car.angle) > -HALF_WAY &&
      roadThatWay(state.cells, car, way, TURN_TILES),
  );
  // And if there is no road anywhere about - shoved into a field, wedged in a
  // yard - anything that is not a wall will do. Without this a car with no road
  // in reach turned round every single step and stood there shaking: the
  // fallback was a reverse, and a reverse every step is a car facing both ways
  // at once and going nowhere.
  const loose =
    open.length > 0
      ? open
      : WAYS.filter(
          (way) =>
            Math.cos(way - car.angle) > -HALF_WAY &&
            isOpen(
              state.cells,
              car.x + Math.cos(way) * TILE,
              car.y + Math.sin(way) * TILE,
            ),
        );
  // Out of town the road decides. A country road sweeps, and a driver who only
  // knows north, south, east and west drives a sweep as a zigzag - which is
  // exactly what it looked like. Out there he simply points along the tarmac,
  // forwards, whichever of the two ways along it he was already going.
  const along = atCrossing(col, row) ? null : routeHeading(car.x, car.y);
  const due = state.time >= car.turnAt && atCrossing(col, row);
  const ahead = roadThatWay(state.cells, car, car.angle, LOOK_TILES);
  let angle = car.angle;
  let turned = false;
  let after = rng;
  if (along !== null) {
    angle =
      Math.cos(along - car.angle) >= 0
        ? along
        : (along + Math.PI) % (Math.PI * 2);
  } else if (!ahead || (due && open.length > 0)) {
    const draw = nextRandom(rng);
    after = draw.state;
    const keep = ahead && draw.value < STRAIGHT_ON;
    if (!keep) {
      // A free choice, every time. Nobody is steered back towards the player:
      // a car that turns round whenever it gets a few streets away is a
      // shuttle service running past the window, and that is exactly what it
      // looked like - four thousand pixels of driving that ended three hundred
      // pixels from where it started. Drivers here are going somewhere. What
      // keeps the streets busy is not that they come back, it is that others
      // arrive - see {@link comeRound}.
      const which = nextInt(after, Math.max(1, loose.length));
      after = which.state;
      angle = loose[which.value] ?? car.angle + Math.PI;
      turned = true;
    }
  }
  return { angle, turned, rng: after };
}

/** Whichever of these ways points most nearly at a place. */
function inward(ways: readonly number[], from: Vec, to: Vec): number | null {
  const toward = (way: number): number =>
    Math.cos(way) * (to.x - from.x) + Math.sin(way) * (to.y - from.y);
  return ways.reduce<number | null>(
    (best, way) => (best === null || toward(way) > toward(best) ? way : best),
    null,
  );
}

/** The four ways a computer driver may point. */
const WAYS: readonly number[] = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

/** How long a driver holds a heading after taking a turning, in seconds. */
const TURN_HOLD = 1.4;

/**
 * How often a driver with a clear road ahead stays on it at a junction.
 *
 * @remarks
 * High, because a car that takes a turning at three junctions out of five is a
 * car going round the same four blocks all afternoon. Drivers are going
 * somewhere; a journey in this city should be streets long.
 */
const STRAIGHT_ON = 0.82;

/** Whether there is road that way, a square and a half off. */
function roadThatWay(
  cells: readonly Cell[],
  car: Car,
  way: number,
  tiles: number,
): boolean {
  const look = TILE * tiles;
  return (
    cellUnder(
      cells,
      car.x + Math.cos(way) * look,
      car.y + Math.sin(way) * look,
    ) === "road"
  );
}

/** How far ahead a driver looks for tarmac, in squares. */
const LOOK_TILES = 1.5;

/**
 * And how far to the side when he is looking for a turning, in squares.
 *
 * @remarks
 * It has to reach past the width of the road he is on. A motorway is five
 * squares across, so a square and a half to the left of the middle of one is
 * still motorway - and the traffic was turning left into its own carriageway
 * and driving across it into the oncoming lane, which is most of the reason
 * half the cars were found on the wrong side of the road.
 */
const TURN_TILES = 3.5;

/**
 * How far across the road a car moves this step to get into its lane.
 *
 * @param cells - the city floor
 * @param car - the car
 * @param angle - the way it is going
 * @param dt - seconds since the last step
 * @returns the distance to the right of its nose, in pixels
 * @remarks
 * **Right hand traffic.** The run of tarmac under the car is measured, the
 * right hand half of it belongs to this direction, and the car is drawn across
 * towards the middle of a lane in that half. On an ordinary street that is one
 * lane each way; on a motorway, five squares of tarmac, it is two - which is
 * what makes a motorway worth having, since the car in front can be passed
 * rather than queued behind.
 */
function laneDrift(
  cells: readonly Cell[],
  car: Car,
  angle: number,
  dt: number,
): number {
  const upright = Math.abs(Math.cos(angle)) < HALF_WAY;
  const col = Math.floor(car.x / TILE);
  const row = Math.floor(car.y / TILE);
  // Lanes are a town thing. Out in the country the road sweeps and the drivers
  // only know four directions, so a car chasing a lane down a diagonal road
  // wanders across it the whole way - twice the distance covered and a wobble
  // to look at. There it simply follows the road.
  const town = inCity(col, row);
  const run = town
    ? streetRun(upright ? col : row)
    : roadRun(cells, col, row, !upright);
  const wide = (run.to - run.from + 1) * TILE;
  const middle = ((run.from + run.to + 1) / 2) * TILE;
  // Which side of the middle is this car right hand side: east and south turn
  // out the opposite way round, which is the whole of the sign below.
  const hand = upright
    ? -Math.sign(Math.sin(angle))
    : Math.sign(Math.cos(angle));
  const now = upright ? car.x : car.y;
  // Whichever lane of its own half it is nearest. A car coming off a side
  // street lands somewhere across the road and is in somebody way until it is
  // in a lane; aiming for the near one rather than for one picked in advance
  // means it is in a lane within a car length instead of crossing the whole
  // carriageway to reach the one it was given.
  const slots =
    wide >= TILE * LANES_FROM ? [INNER_LANE, OUTER_LANE] : [ONE_LANE];
  const want = slots
    .map((slot) => middle + hand * (wide / 2) * slot)
    .reduce((best, one) =>
      Math.abs(one - now) < Math.abs(best - now) ? one : best,
    );
  const off = want - now;
  const most = town ? LANE_PULL * dt : 0;
  const pull = Math.max(-most, Math.min(most, off));
  // The drift is given in "to the right of the nose", so it needs the sign
  // that turns a movement across the world into a movement across the car.
  return upright
    ? -pull * Math.sign(Math.sin(angle))
    : pull * Math.sign(Math.cos(angle));
}

/**
 * Above how many squares of tarmac a direction gets two lanes.
 *
 * @remarks
 * Five, which is the motorway and nothing else. An ordinary street is three
 * squares wide - a comfortable lane each way, and nothing like enough for two.
 */
const LANES_FROM = 5;

/** Where the one lane of an ordinary street sits, as a share of half the road. */
const ONE_LANE = 0.42;

/** And the two lanes of a motorway. */
const INNER_LANE = 0.3;

/** The outer one, which is the one to pass in. */
const OUTER_LANE = 0.74;

/** How fast a car pulls across into its lane, in pixels a second. */
const LANE_PULL = 170;

/** Half a turn either way, for telling an upright heading from a flat one. */
const HALF_WAY = 0.5;

/**
 * Whether another car is close in front.
 *
 * @param state - the city
 * @param car - the car looking
 * @param angle - the way it is going
 * @returns true when it should be on the brakes
 * @remarks
 * This is the whole of a traffic jam, and it is the only place cars are
 * allowed to stand still on a road: behind another car that is standing still.
 */
function queueAhead(state: GameState, car: Car, angle: number): boolean {
  const gap = bodyRadius(car.body) + QUEUE_GAP;
  const closed = bodyRadius(car.body) + QUEUE_CLOSED;
  return state.cars.some((other) => {
    const dx = other.x - car.x;
    const dy = other.y - car.y;
    const ahead = dx * Math.cos(angle) + dy * Math.sin(angle);
    const aside = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
    // Whom one gives way to. Somebody going the same way is the car in front
    // and one queues behind him. Somebody crossing is dealt with by the
    // junction, not by braking - two cars that each stop for the other stop
    // for ever, and a grid city full of that is a grid city that never moves.
    // Where both are standing still the lower number goes first, which is an
    // arbitrary rule and is exactly what a right of way is.
    const along = Math.cos(other.angle - angle);
    const together = along > SAME_WAY;
    const oncoming = along < -SAME_WAY;
    const standing = Math.abs(other.speed) < QUEUE_CRAWL;
    const yields = together || (!oncoming && standing && other.id < car.id);
    return (
      other.id !== car.id &&
      yields &&
      ahead > 0 &&
      // Room to stop behind something that is moving; nose to tail behind
      // something that is not. That is how a queue at a red light closes up
      // and how the same queue opens out again when it pulls away.
      ahead < (standing ? closed : gap) + bodyRadius(other.body) &&
      aside < QUEUE_WIDE
    );
  });
}

/** How nearly two cars have to point the same way to be in one queue. */
const SAME_WAY = 0.2;

/** How much room a driver leaves to the car in front, in pixels. */
const QUEUE_GAP = 96;

/**
 * And how little he leaves once that car has stopped.
 *
 * @remarks
 * Less than while driving, but still a gap: bumper to bumper at a red light is
 * what a scrapyard looks like, not a queue. {@link bodyRadius} is the mean of
 * half the length and half the width, so it is a good bit less than the nose
 * of the car it stands for - which is why this number has to be bigger than it
 * looks to leave half a car length of daylight.
 */
const QUEUE_CLOSED = 42;

/** And how far off his own line a car has to be to count as in front. */
const QUEUE_WIDE = 16;

/** Below this a car counts as standing rather than driving, in pixels a second. */
const QUEUE_CRAWL = 12;

/** How long a stopped driver takes to notice that the road is clear. */
const QUEUE_WAKE = 0.5;

/**
 * How much of the traffic's pace somebody on a bicycle keeps up, as a share.
 *
 * @remarks
 * Just over half: at {@link TRAFFIC_SPEED} of 110 that is sixty pixels a
 * second, which against a city street is a man riding to work rather than a
 * man in a race. It also puts him firmly in the way, which is the point of
 * having him there.
 */
const PEDAL_SHARE = 0.55;

/**
 * Whether the junction ahead is showing red.
 *
 * @param state - the city
 * @param car - the car
 * @param angle - the way it is going
 * @returns true while it should wait
 * @remarks
 * Only where the car is still short of the line: once the nose is over it, the
 * light turning red behind you is not a reason to stop in the middle of a
 * junction, and a car that did would block the green wave for everybody.
 */
function redAhead(state: GameState, car: Car, angle: number): boolean {
  const here = lightAt(Math.floor(car.x / TILE), Math.floor(car.y / TILE));
  const look = {
    x: car.x + Math.cos(angle) * LIGHT_LOOK,
    y: car.y + Math.sin(angle) * LIGHT_LOOK,
  };
  const upright = Math.abs(Math.cos(angle)) < HALF_WAY;
  // Amber means stop as well. It lasts two seconds and the look ahead is under
  // a second of driving, so a car that sees amber has room to stop - which is
  // what amber is for.
  return (
    !here &&
    lightAt(Math.floor(look.x / TILE), Math.floor(look.y / TILE)) &&
    lightColour(state.time, upright) !== "green"
  );
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
    // Somebody who has been taken on walks after the player instead, and stops
    // at his shoulder. That is the whole of being hired: he is a corner that
    // moves.
    const hired = state.crew.includes(person.id);
    const behind = hired && far(person, state.player) > CREW_GAP;
    // Standing in a wall beats every other reason to walk somewhere.
    const wayOut = outOfWalls(state, person);
    // A gang member who has drifted off his corner heads back to it. It is the
    // only reason anybody in this city walks anywhere on purpose, and it is
    // what keeps a crew a crew.
    const home = person.home;
    const strayed =
      home !== null &&
      !hired &&
      foe === null &&
      !scare &&
      far(person, home) > GANG_ROAM;
    const heading = behind
      ? Math.atan2(state.player.y - person.y, state.player.x - person.x)
      : foe !== null
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
      wayOut !== null
        ? sort.walk
        : hired
          ? behind
            ? sort.walk *
              (far(person, state.player) > CREW_LOST ? CREW_CHASE : CREW_HURRY)
            : 0
          : foe !== null
            ? far(person, foe) > GANG_HOLD
              ? sort.walk
              : 0
            : scare
              ? sort.walk * PANIC
              : sort.walk;
    // A glance ahead before the step, the same one the police on foot take:
    // whoever is walking towards a wall turns along it instead of
    // standing there pushing at it. It matters most for the men who are
    // following somebody - a crew that walks into the side of a house
    // every time its leader turns a corner is a crew one leaves behind.
    //
    // Unless he is **in** the wall, in which case there is nothing to steer
    // round and only one thing worth doing: get out.
    const wandering =
      wayOut === null && !behind && !scare && foe === null && !strayed;
    const going = wayOut ?? steerRound(state.cells, person, heading, WALK_LOOK);
    // And then the pavement. Everybody who is merely out walking stays on it;
    // whoever is running for his life, going somewhere, or carrying a gun for
    // a living goes where he likes, which is the difference between a passer
    // by and everybody else in this city.
    const footed = wandering ? keepToPath(state, person, going) : going;
    const want = slide(
      state.cells,
      person,
      Math.cos(footed) * speed * dt,
      Math.sin(footed) * speed * dt,
    );
    const moved = blocked(state, want, person)
      ? { x: person.x, y: person.y }
      : want;
    const stuck = moved.x === person.x && moved.y === person.y;
    const went = Math.hypot(moved.x - person.x, moved.y - person.y);
    next = {
      ...person,
      ...moved,
      heading: footed,
      mood: foe === null && scare ? "fleeing" : "walking",
      turnAt: turning || stuck ? state.time + PERSON_TURN_EVERY : person.turnAt,
      walked: stridden(person.walked, went, dt),
      pace: dt === 0 ? 0 : went / dt / WALK_SPEED,
    };
  }
  return { person: next, rng: state2 };
}

/**
 * The way out for somebody who is standing inside a building.
 *
 * @param state - the city
 * @param who - whoever is stuck
 * @returns the direction to open ground, or null when they are not stuck
 * @remarks
 * It happens: a gang corner drawn a little too far into a block, a shove from
 * a car, a garage door coming down on somebody. Whatever the cause, the result
 * used to be a man in a wall for the rest of the game - and if he was one of
 * yours, a crew of three. The eight directions are tried at a growing radius
 * and the first open one wins, which in a city of square blocks is always the
 * short way out.
 */
function outOfWalls(state: GameState, who: Vec): number | null {
  let way: number | null = null;
  if (!isOpen(state.cells, who.x, who.y)) {
    for (let out = TILE; out <= WALL_WAY && way === null; out += TILE) {
      for (let step = 0; step < WAYS_OUT && way === null; step += 1) {
        const turn = (step / WAYS_OUT) * Math.PI * 2;
        if (
          isOpen(
            state.cells,
            who.x + Math.cos(turn) * out,
            who.y + Math.sin(turn) * out,
          )
        ) {
          way = turn;
        }
      }
    }
  }
  return way;
}

/** How far out the search for a way out of a building goes, in pixels. */
const WALL_WAY = 200;

/** How many directions it tries at each step of that search. */
const WAYS_OUT = 8;

/**
 * How much faster than a stroll a hired man walks.
 *
 * @remarks
 * A shade faster than the player on foot - he walks 130 pixels a second and a
 * gang member strolls 48 - because anything less is a line of men slowly losing
 * the man they work for.
 */
const CREW_HURRY = 2.9;

/** How far behind counts as having been left behind, in pixels. */
const CREW_LOST = 200;

/**
 * And how fast they come after him then.
 *
 * @remarks
 * Faster than anybody walks, because the alternative is worse: whoever takes
 * four men on and then drives two streets would arrive at the printing works
 * alone, and would have to walk the whole way back to collect them. They catch
 * up, and the game stays about the job rather than about shepherding.
 */
const CREW_CHASE = 3.8;

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
 *
 * Which is why they take the police on with you. Anybody of yours who is close
 * enough to see the man they work for being chased goes after the nearest
 * uniform - and so does anybody on the payroll, whatever shirt he started the
 * day in.
 */
function enemyOf(state: GameState, person: Person): Vec | null {
  const side = KINDS[person.kind].side;
  if (side === "none") {
    return null;
  }
  const foes: Vec[] = [];
  // The other gang, but only once the war is on. Nobody draws first: until the
  // player shoots a gang member, the shirts are just shirts.
  if (state.feud) {
    for (const each of state.people) {
      const other = KINDS[each.kind].side;
      if (
        each.mood !== "down" &&
        other !== "none" &&
        other !== side &&
        // Whoever is working for the player is out of the gang war for the
        // day: the man who hired him did not hire a target.
        !state.crew.includes(each.id)
      ) {
        foes.push({ x: each.x, y: each.y });
      }
    }
  }
  // And the player - but only the other side, and never somebody who is on
  // his payroll. A hired man shooting the man who hired him is not a feud, it
  // is a bug with a story attached.
  const hired = state.crew.includes(person.id);
  const afterPlayer = side === "rival" && state.feud && !hired;
  if (afterPlayer && state.player.car === null) {
    foes.push({ x: state.player.x, y: state.player.y });
  }
  // The police, once they are after the player and one of his own is standing
  // near enough to join in.
  const backing =
    (side === "mine" || hired) &&
    state.player.stars > 0 &&
    far(person, state.player) < BACK_UP;
  if (backing) {
    for (const cop of state.cops) {
      if (cop.health > 0) {
        foes.push({ x: cop.x, y: cop.y });
      }
    }
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

/** How near the player one of his own has to be to join his fight. */
const BACK_UP = 300;

/**
 * The train: round the loop, and through whatever is on the line.
 *
 * @remarks
 * It does not steer, it does not brake and nothing stops it. What it touches it
 * knocks flat - a person, a car, the player - which is the whole of what a
 * railway line means in a city one drives across at speed: it is a wall that
 * is only there twice a minute.
 */
function runTrain(state: GameState, dt: number): GameState {
  const rolled = rollTrain(state.train, dt, state.time);
  const seat = trainCars(rolled)[RIDE_CAR];
  // A passenger is carried: he is not walking, so his place is simply the
  // place of the carriage he got into.
  const riding =
    state.player.aboard && seat !== undefined
      ? { ...state.player, x: seat.at.x, y: seat.at.y }
      : state.player;
  let next: GameState = { ...state, train: rolled, player: riding };
  for (const car of trainCars(next.train)) {
    next = hitByTrain(next, car.at, car.angle);
  }
  return next;
}

/** What one carriage catches as it passes. */
function hitByTrain(state: GameState, at: Vec, angle: number): GameState {
  const caught = (thing: Vec) => onTheLine(thing, at, angle);
  let next = state;
  for (const person of state.people) {
    if (person.mood !== "down" && caught(person)) {
      next = hurtPerson(next, person.id, TRAIN_HURT);
    }
  }
  for (const car of state.cars) {
    if (car.health > 0 && caught(car)) {
      next = damageCar(next, car.id, TRAIN_HURT);
    }
  }
  if (
    state.player.car === null &&
    !state.player.aboard &&
    caught(state.player)
  ) {
    next = hurt(next, TRAIN_HURT, "Vom Zug erwischt.");
  }
  return next;
}

/** Whether something stands where a carriage is passing. */
function onTheLine(thing: Vec, at: Vec, angle: number): boolean {
  const dx = thing.x - at.x;
  const dy = thing.y - at.y;
  const along = Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle));
  const aside = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
  return along < TRAIN_LONG / 2 && aside < TRAIN_WIDE / 2;
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
      person.mood === "down" ||
      far(person, at) > range ||
      // Your own people do not run from gunfire. They are the gang, it is
      // their street, and a crew that scattered at the first shot would be no
      // use on the one job that needs four men.
      KINDS[person.kind].side === "mine"
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
  state = callOffPatrol(state);
  // Wrecks do not count as police: take one out and the next is sent, but only
  // after a while. That gap is the whole of "shake them off and drive away".
  // How much law is already on the scene. A patrol car counts only while
  // somebody can drive it - wrecked, or with its crew shot on the pavement, it
  // is scenery, and the next patrol is sent instead of it. **The men on the
  // pavement count too**: two who got out of a car are still two policemen,
  // and sending another car because their car no longer counts is how one ends
  // up surrounded by an endless supply of them.
  const want = policeWanted(state);
  // The tank is sent whether or not the six are already out. It is what turns
  // up **on top of** them at six stars, so it does not wait for a gap in the
  // count - and without this it never came at all, because six patrols out of
  // the traffic had already filled the quota before the station was asked.
  const noTank =
    state.player.stars >= TANK_STARS && !state.cars.some(isPoliceTank);
  let next = state;
  if ((noTank || onDuty(state) < want) && state.time >= state.patrolAt) {
    next = { ...callPolice(next), patrolAt: state.time + PATROL_EVERY };
  }
  // **Nobody in it, nobody driving it.** A patrol car whose men are out on the
  // pavement - or dead on it - is scenery, which is what the count already
  // says of it; letting it carry on chasing was how a chase one had fought off
  // ended up with more cars in it than the star count allows.
  const cars = next.cars.map((car) =>
    car.kind === "police" && !car.driven && car.crew > 0
      ? chase(next, car, dt)
      : car,
  );
  next = { ...next, cars };
  next = openDoors(next);
  return moveCops(next, dt);
}

/**
 * How much law is after the player at this moment.
 *
 * @param state - the city
 * @returns how many patrols that is worth
 * @remarks
 * A patrol car counts only while somebody can drive it - wrecked, or with its
 * crew shot on the pavement, it is scenery, and the next patrol is sent
 * instead of it. **The men on the pavement count too**: two who got out of a
 * car are still two policemen, and sending another car because their car no
 * longer counts is how one ends up surrounded by an endless supply of them.
 *
 * The **tank does not count**. It is the thing that turns up on top of the six
 * at six stars, not one of the six.
 */
function onDuty(state: GameState): number {
  const cars = state.cars.filter(
    (car) =>
      car.kind === "police" &&
      car.health > 0 &&
      car.crew > 0 &&
      !isPoliceTank(car),
  ).length;
  const men = state.cops.filter(
    (cop) => cop.health > 0 && (cop.guards ?? null) === null,
  ).length;
  return cars + Math.ceil(men / COPS_PER_CAR);
}

/**
 * How many patrols the star count is worth.
 *
 * @param state - the city
 * @returns one per star, and no more than {@link POLICE_MAX}
 * @remarks
 * **One star, one vehicle.** The ladder is that plain: a single machine at one
 * star, two at two, and so on up to six - with the helicopter joining in at
 * five and the tank at six, neither of which is counted here because both are
 * extra rather than instead.
 */
function policeWanted(state: GameState): number {
  return Math.min(POLICE_MAX, state.player.stars * POLICE_PER_STAR);
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
  const seat = carOf(state);
  // A man on foot is a man to surround; a car that has stopped is a car to
  // surround. What they will not do is get out while the chase is still on.
  const still = seat === null || Math.abs(seat.speed) < BUST_CRAWL;
  let next = state;
  if (state.player.stars > 0 && still) {
    for (const car of state.cars) {
      const pulled =
        car.kind === "police" &&
        car.crew > 0 &&
        !car.driven &&
        far(car, state.player) < COP_STOP;
      // The doors do not fly open the moment the handbrake goes on.
      const halted = pulled ? (car.haltAt ?? state.time) : null;
      next = {
        ...next,
        cars: next.cars.map((each) =>
          each.id === car.id ? { ...each, haltAt: halted } : each,
        ),
      };
      if (pulled && halted !== null && state.time >= halted + COP_OUT) {
        next = unload(next, car);
      }
    }
  }
  return next;
}

/**
 * How many places there are in the ring round a cornered man.
 *
 * @remarks
 * Six, so that three carloads stand round somebody rather than in a queue
 * behind him. Which man takes which place comes out of his car's number, so a
 * second car fills the gaps the first one left.
 */
const COP_POSTS = 6;

/** Two men out of one car, one at each door. */
function unload(state: GameState, car: Car): GameState {
  const born: Cop[] = [];
  let id = state.cops.reduce((most, cop) => Math.max(most, cop.id), 0);
  // As many men as the machine has seats: two out of a car, one off a bike -
  // a motorcycle with a crew of two that both climb off is not a motorcycle.
  for (let door = 0; door < VEHICLES[car.body].seats; door += 1) {
    id += 1;
    const side = door === 0 ? 1 : -1;
    born.push({
      id,
      carId: car.id,
      x: car.x - Math.sin(car.angle) * CAR_WIDTH * side,
      y: car.y + Math.cos(car.angle) * CAR_WIDTH * side,
      angle: car.angle,
      walked: 0,
      pace: 0,
      health: COP_HEALTH,
      holds: COP_ARMS[(car.id + door) % COP_ARMS.length] ?? "pistol",
      reloadAt: state.time + COP_RELOAD,
      // Out of the car, and then into position: a second of walking round
      // before anybody points anything at anybody, and each man to his own
      // place in the ring.
      readyAt: state.time + COP_FORM,
      guards: null,
      post: ((car.id * COPS_PER_CAR + door) * Math.PI * 2) / COP_POSTS,
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
      // A car is a target too: whoever sits in one and waits gets his
      // bodywork taken apart rather than being politely ignored.
      far(cop, next.player) < gun.range &&
      next.time >= cop.readyAt &&
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
  const guard = cop.guards ?? null;
  // A guard leaves the wire only for somebody who has come to it. Otherwise he
  // walks back to his spot, and a chase three cities away is not his business.
  const minding =
    guard !== null &&
    (state.player.stars === 0 || far(state.player, guard) > GUARD_REACH);
  const chasing = state.player.stars > 0 && !minding;
  // Whoever is chasing walks to his own place in the ring round the player
  // rather than at the player himself: six men in one spot is a scrum, six men
  // round a car is an arrest.
  const post = {
    x: state.player.x + Math.cos(cop.post) * COP_RING,
    y: state.player.y + Math.sin(cop.post) * COP_RING,
  };
  const ground = home === undefined || home.health <= 0 ? post : home;
  const goal = minding && guard !== null ? guard : chasing ? post : ground;
  const away = far(cop, goal);
  const gun = WEAPONS[cop.holds];
  const reach = gun.way === "swing" ? gun.range * SWING_ROOM : COP_STAND;
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
  // Only a man with a car of his own climbs into one: a guard who walked back
  // to his post and then vanished into a car that is not there would be a
  // guard who guards the base for ninety seconds and then stops existing.
  const atDoor =
    !chasing && !minding && home !== undefined && away <= BOARD_RANGE;
  return {
    ...cop,
    ...moved,
    angle,
    walked: cop.walked + step,
    pace: dt === 0 ? 0 : step / dt / WALK_SPEED,
    boardAt: atDoor ? (cop.boardAt ?? state.time + BOARD_SECONDS) : null,
  };
}

/** How near his post a policeman has to get before he stops walking. */
const COP_STAND = 18;

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
            : {
                ...car,
                crew: Math.min(VEHICLES[car.body].seats, car.crew + back),
              };
        }),
        cops: state.cops.filter((cop) => !who.includes(cop)),
      };
}

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

/**
 * A heading that keeps somebody on the pavement.
 *
 * @param state - the city
 * @param person - the one walking
 * @param going - where they were about to go
 * @returns the same heading, or one along the kerb instead
 * @remarks
 * Pavements are what pavements are for. Left to wander freely, half the people
 * in Los Santos were strolling down the middle of the carriageway, which makes
 * a road look like a pedestrian precinct and every car in it look lost.
 *
 * Three rules, and they are the ones anybody actually uses. Somebody already
 * on the road finishes crossing it - turning back half way is worse than
 * either. Somebody on the pavement steps into the road only while the fancy
 * takes him, which is {@link crossingMood} and is how a road gets crossed at
 * all. And nobody at all strolls on to a motorway: it is five lanes of traffic
 * doing seventy, and the people who go on it are the ones being chased across
 * it.
 */
function keepToPath(state: GameState, person: Person, going: number): number {
  const step = WALK_LOOK;
  const look = {
    x: person.x + Math.cos(going) * step,
    y: person.y + Math.sin(going) * step,
  };
  const ahead = cellUnder(state.cells, look.x, look.y);
  const fast = onMotorway(Math.floor(look.x / TILE), Math.floor(look.y / TILE));
  const crossing =
    !fast &&
    (cellUnder(state.cells, person.x, person.y) === "road" ||
      crossingMood(person, state.time));
  return ahead === "road" && !crossing
    ? alongPath(state.cells, person, going, step)
    : going;
}

/**
 * Whether somebody feels like crossing the road just now.
 *
 * @param person - the one walking
 * @param time - the clock
 * @returns true while the fancy takes them
 * @remarks
 * A dice roll that does not need a die: the person number and the clock, in
 * blocks of a few seconds, so the same person keeps the same mind about it for
 * long enough to actually get across - and so the whole street does not decide
 * to cross at the same moment.
 */
function crossingMood(person: Person, time: number): boolean {
  return (person.id + Math.floor(time / CROSS_HOLD)) % CROSS_ODDS === 0;
}

/** How long somebody stays of the same mind about crossing, in seconds. */
const CROSS_HOLD = 7;

/** And one in how many of them is of that mind. */
const CROSS_ODDS = 6;

/** Which way along the pavement lies nearest to where they were going. */
function alongPath(
  cells: readonly Cell[],
  person: Person,
  going: number,
  step: number,
): number {
  const paved = (way: number): boolean =>
    cellUnder(
      cells,
      person.x + Math.cos(way) * step,
      person.y + Math.sin(way) * step,
    ) === "walk";
  const right = going + Math.PI / 2;
  const left = going - Math.PI / 2;
  return paved(right) ? right : paved(left) ? left : going + Math.PI;
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
        want: angle,
        shells: 0,
        hitched: null,
        braking: false,
        locked: false,
        wakeAt: 0,
        lean: 0,
        rolled: 0,
        seats: 0,
        slip: 0,
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
        haltAt: null,
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
  if (state.heli === null && wanted && state.time >= state.heliAt) {
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
    next = { ...state, heli: null, heliAt: state.time + HELI_AGAIN };
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
    ? blast(
        { ...state, heli: null, heliAt: state.time + HELI_AGAIN },
        { x: flown.x, y: flown.y },
        HELI_BLAST,
      )
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
  let body: VehicleBody = "patrolbike";
  if (state.player.stars >= TANK_STARS && !state.cars.some(isPoliceTank)) {
    body = "tank";
  } else if (state.player.stars >= CAR_STARS && id % BIKE_EVERY !== 0) {
    // **Mostly cars.** It used to be every other one, which put as many men on
    // motorbikes as in patrol cars - and a motorbike is what they send to a
    // traffic offence, not what they send to a robbery.
    body = "patrol";
  }
  return body;
}

/** One patrol in this many is a motorbike; the rest come in cars. */
const BIKE_EVERY = 4;

/** Whether this body is a police machine whoever is at the wheel of it. */
function isPatrol(body: VehicleBody): boolean {
  return body === "patrol" || body === "patrolbike";
}

/**
 * Nobody is on patrol while somebody is wanted.
 *
 * @param state - the city
 * @returns the city with the patrols either called in or sent back out
 * @remarks
 * A patrol car rolling along in the traffic is scenery: it obeys the lights
 * and it does not chase anybody. The moment the player has a star that stops
 * being true - **every** patrol vehicle in sight is after him, not only the
 * ones the station has sent - and it starts being true again the moment he is
 * clean, which is what turns a chase back into a street.
 *
 * Done by changing what the car **is** rather than by teaching the traffic to
 * chase: traffic and police are driven by two different routines, and a car
 * that is both gets moved twice a frame.
 */
function callOffPatrol(state: GameState): GameState {
  const hunted = state.player.stars > 0;
  // **Only as many as the stars are worth.** Turning every patrol in the city
  // into a chaser is what one star used to mean, and with police in the
  // ordinary traffic that was half a dozen cars for a stolen handbag. What
  // joins in is the shortfall and no more: nearest first, so it is the ones
  // that were actually there - and at one star a motorbike before a car,
  // because one star is a traffic offence.
  const room = Math.max(0, policeWanted(state) - onDuty(state));
  const spare = state.cars.filter(
    (car) =>
      isPatrol(car.body) &&
      car.health > 0 &&
      !car.driven &&
      car.id !== state.player.car &&
      car.kind !== "police",
  );
  const bikesFirst = state.player.stars < CAR_STARS;
  const joining = new Set(
    [...spare]
      .sort((one, other) => {
        const kind = bikesFirst
          ? Number(one.body !== "patrolbike") -
            Number(other.body !== "patrolbike")
          : 0;
        return kind !== 0
          ? kind
          : far(one, state.player) - far(other, state.player);
      })
      .slice(0, room)
      .map((car) => car.id),
  );
  let turned = false;
  const cars = state.cars.map((car) => {
    const theirs =
      isPatrol(car.body) &&
      car.health > 0 &&
      !car.driven &&
      car.id !== state.player.car;
    if (theirs && hunted && car.kind !== "police" && joining.has(car.id)) {
      turned = true;
      return {
        ...car,
        kind: "police" as const,
        crew: VEHICLES[car.body].seats,
      };
    }
    // Back on the beat: an empty one stays where it is, because a patrol car
    // whose men are out on the pavement is not a patrol, it is a parked car.
    if (theirs && !hunted && car.kind === "police" && car.crew > 0) {
      turned = true;
      return { ...car, kind: "traffic" as const };
    }
    return car;
  });
  return turned ? { ...state, cars } : state;
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
    next =
      car.speed === 0
        ? car
        : {
            ...car,
            speed: car.speed * WRECK_ROLL,
            slip: car.slip * WRECK_ROLL,
          };
  } else if (car.crew === 0) {
    // Nobody at the wheel: the men are out on the pavement, or were shot
    // there. Either way this car waits for them.
    next = car.speed === 0 ? car : { ...car, speed: 0, slip: 0 };
  } else if (holding) {
    next = car.speed === 0 ? car : { ...car, speed: 0, slip: 0 };
  } else if (state.player.stars > 0 && near(state.player, car)) {
    const straight = Math.atan2(state.player.y - car.y, state.player.x - car.x);
    const want = steerRound(state.cells, car, straight, DRIVE_LOOK);
    const turn = Math.max(
      -CAR_TURN * dt,
      Math.min(CAR_TURN * dt, angleTo(car.angle, want)),
    );
    const speed = Math.min(POLICE_TOP_SPEED, car.speed + CAR_ACCEL * dt);
    // Their tyres are the same tyres: a patrol car that took a corner on rails
    // while the player's identical saloon slid would be two different games.
    const moved = rollCar(
      state.cells,
      car,
      turn,
      speed,
      VEHICLES[car.body].grip * GRIP_PUSH,
      dt,
    );
    next = { ...car, ...moved };
  } else if (car.speed !== 0) {
    next = { ...car, speed: 0, slip: 0 };
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
      // Whoever works for you gets shoved aside, not run down.
      KINDS[person.kind].side !== "mine" &&
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
  // Two ways through a car: the cheat, and sixty tonnes of tank. Both throw
  // whatever was in the way off along its own bonnet and carry on at the same
  // speed - a tank that is stopped by a parked hatchback is not a tank.
  const shoving = state.player.god || car.body === "tank";
  if (crashed.length > 0 && shoving) {
    next = fling(next, car, crashed);
    // The cheat answers to nobody; a tank still does. Shoving a patrol car
    // aside is ramming it, and the law counts it as such.
    next = state.player.god ? next : ramStar(next, state, car, crashed);
  } else if (crashed.length > 0) {
    // **The one driving shoves the other out of the way.** Two cars that stop
    // each other dead is what a wall does, not what a car does - and it made
    // every collision a full stop, in a game whose whole business is getting
    // somewhere. What changes hands here is momentum, not bodywork: driving is
    // how one gets about this city, and a game that writes the car off over a
    // few kerbs makes getting about the game. A wall still costs bodywork -
    // see {@link drive} - and so does gunfire.
    next = barge(next, car, crashed);
    next = {
      ...next,
      player: { ...next.player, crashUntil: state.time + CRASH_PAUSE },
    };
    next = ramStar(next, state, car, crashed);
  }
  return next;
}

/**
 * The star for ramming a patrol car.
 *
 * @param state - the city, with the crash already settled
 * @param before - the city as it was when the crash was found
 * @param car - the one the player is driving
 * @param crashed - what it ran into
 * @returns the city, one star worse off if that is what happened
 * @remarks
 * Only when the player was the faster of the two, and not again within a few
 * seconds. Without both, being surrounded by police was a machine for making
 * stars: they drove into the player, the player got the star, and the cool-off
 * never began.
 */
function ramStar(
  state: GameState,
  before: GameState,
  car: Car,
  crashed: readonly Car[],
): GameState {
  const rammed = crashed.some(
    (other) =>
      other.kind === "police" && Math.abs(car.speed) > Math.abs(other.speed),
  );
  const fresh = before.time >= before.player.rammedUntil;
  let next = state;
  if (rammed && fresh) {
    const booked = wanted(state, 1, "Streifenwagen gerammt");
    next = {
      ...booked,
      player: { ...booked.player, rammedUntil: before.time + RAM_PAUSE },
    };
  }
  return next;
}

/**
 * Everything that was in the way, shoved aside.
 *
 * @param state - the city
 * @param car - the one the player is driving
 * @param hit - whatever it just ran into
 * @returns the city with those cars going sideways and the player going on
 */
function fling(state: GameState, car: Car, hit: readonly Car[]): GameState {
  const ids = new Set(hit.map((other) => other.id));
  return {
    ...state,
    cars: state.cars.map((each) =>
      ids.has(each.id)
        ? {
            ...each,
            angle: Math.atan2(each.y - car.y, each.x - car.x),
            speed: RAM_FLING,
            slip: 0,
          }
        : each,
    ),
  };
}

/**
 * One car barging another aside.
 *
 * @param state - the city
 * @param car - the one being driven
 * @param hit - what it ran into
 * @returns the city with the others shoved off and the rammer slowed
 * @remarks
 * Whoever is doing the driving wins the exchange. The car that was hit goes off
 * along the line between the two - which is what makes a glancing blow push it
 * aside and a square hit push it straight on - at a share of the speed that hit
 * it, and the rammer keeps most of his own. He is slowed, not stopped: there is
 * a difference between hitting a car and hitting a house, and before this there
 * was not.
 *
 * The shove is worth more in something heavy. A tank does not appear here at
 * all - it goes through everything, see {@link fling} - but an off-roader
 * against a hatchback should still be the one that ends up further up the road.
 */
function barge(state: GameState, car: Car, hit: readonly Car[]): GameState {
  const ids = new Set(hit.map((other) => other.id));
  const mine = VEHICLES[car.body].health;
  const force = Math.abs(car.speed);
  return {
    ...state,
    cars: state.cars.map((each) => {
      let after = each;
      if (ids.has(each.id)) {
        const heft = mine / (mine + VEHICLES[each.body].health);
        after = {
          ...each,
          angle: Math.atan2(each.y - car.y, each.x - car.x),
          want: Math.atan2(each.y - car.y, each.x - car.x),
          speed: Math.min(RAM_FLING, force * heft * RAM_SHARE),
          slip: 0,
          braking: false,
          locked: false,
          wakeAt: 0,
          lean: 0,
        };
      } else if (each.id === car.id) {
        after = { ...each, speed: car.speed * RAM_KEEP, slip: 0 };
      }
      return after;
    }),
  };
}

/** How much of the speed that hit it a rammed car is sent off with. */
const RAM_SHARE = 1.7;

/** And how much of his own the one doing the ramming keeps. */
const RAM_KEEP = 0.55;

/** How fast a rammed car is thrown out of the way, in pixels per second. */
const RAM_FLING = 260;

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
  if (drop.holds === "cash") {
    next = {
      ...state,
      player: { ...state.player, money: state.player.money + drop.worth },
      log: note(state.log, `${String(drop.worth)} € eingesteckt.`),
    };
  } else if (drop.holds === "armour") {
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
 * The second cheat: nothing hurts, nothing stops you, nothing costs anything.
 *
 * @remarks
 * Held rather than toggled in the state, so that switching it off in the middle
 * of a firefight does what it looks like it does.
 *
 * The money is topped back up every frame rather than set once, so that buying
 * a rocket launcher leaves the wallet where it was. What the cheat is for is
 * looking at the city without it saying no - so it says no to nothing: not to
 * the damage, not to the price list, not to the patrol car in the way.
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
        // The cheat owns everything, and the jetpack is a thing one owns.
        jetpack: true,
        ammo: fullBelt(),
        armour: PLAYER_HEALTH,
        health: PLAYER_HEALTH,
        money: Math.max(state.player.money, GOD_MONEY),
      },
    };
  } else if (state.player.god) {
    next = { ...state, player: { ...state.player, god: false } };
  }
  return next;
}

/** What the wallet is held at while the cheat is on, in euros. */
const GOD_MONEY = 999999;

/** The wheel: the next weapon that is actually in the belt. */
function switchWeapon(state: GameState, input: Input): GameState {
  return input.wheel === 0
    ? state
    : {
        ...state,
        player: {
          ...state.player,
          weapon: nextWeapon(beltOf(state), state.player.weapon, input.wheel),
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
 * **Any patrol vehicle, not only the ones the station has sent.** Most of what
 * the police do is drive about, and one of those rolls in ordinary traffic - so
 * doing something in front of it is doing it in front of the police, and that
 * is a star on the spot rather than a point of heat nobody saw.
 *
 * Wrecked ones see nothing, and neither does the one the player has taken -
 * without that last part, driving a stolen patrol car would be a permanent
 * witness sitting in one's own seat.
 */
function onWatch(state: GameState, car: Car): boolean {
  return (
    (car.kind === "police" || isPatrol(car.body)) &&
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

/**
 * Being inside the wire, which is worth every star there is.
 *
 * @param state - the city
 * @returns it, with the alarm up if the player is on the base
 * @remarks
 * No warning shot and no countdown: the fence is the warning. Whoever is
 * inside it - on foot, in a car or coming over the wire on a jetpack - is at
 * six stars for as long as he stays, which means the helicopter, the police
 * tank and everything else the law owns. That is the price of the tank parked
 * in there, and the tank is worth it.
 */
function onTheBase(state: GameState): GameState {
  const col = state.player.x / TILE;
  const row = state.player.y / TILE;
  const inside =
    col > BASE.left &&
    col < BASE.right + 1 &&
    row > BASE.top &&
    row < BASE.bottom + 1;
  let next = state;
  if (inside && state.player.stars < MAX_STARS) {
    next = {
      ...state,
      // The clock that lets a star cool off is pushed back as well: standing
      // in the middle of a military base is not lying low.
      player: {
        ...state.player,
        stars: MAX_STARS,
        starAt: state.time,
        coolAt: state.time + COOL_SECONDS,
      },
      log: note(
        state.log,
        "Militärgelände! Alarm - die holen alles, was sie haben.",
      ),
    };
  } else if (inside) {
    next = {
      ...state,
      player: { ...state.player, coolAt: state.time + COOL_SECONDS },
    };
  }
  return next;
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
      player: {
        ...state.player,
        stars,
        coolAt: state.time + COOL_SECONDS,
        // With the last star the suit goes too: whoever is not being looked
        // for any more has had time to find a jacket. The overall and the mask
        // of the printing works go the same way, and for the same reason.
        striped: stars === 0 ? false : state.player.striped,
        masked: stars === 0 ? false : state.player.masked,
        hooded: stars === 0 ? false : state.player.hooded,
      },
      cars:
        stars === 0
          ? state.cars.filter((car) => car.kind !== "police")
          : state.cars,
      log:
        stars === 0
          ? note(
              state.log,
              state.player.striped
                ? "Die Luft ist rein - und die Sträflingskluft ist weg."
                : "Die Luft ist rein.",
            )
          : state.log,
    };
  }
  return next;
}

/** Being arrested: a night in the cells, a fine, and the car is gone. */
function busted(state: GameState): GameState {
  // What is lost is the bag plus whatever is still being carried out of the
  // bank: an arrest in the middle of a robbery takes both.
  const lost = state.player.loot + Math.round(state.bank?.taken ?? 0);
  return {
    ...state,
    phase: "busted",
    player: {
      ...state.player,
      stars: 0,
      heat: 0,
      car: null,
      // Whatever was in the bag goes into the evidence room.
      loot: 0,
      safeUntil: state.time + SAFE_SECONDS,
    },
    cops: [],
    bank: null,
    mint: null,
    // Whoever was working for him goes back to his own corner. Nobody waits
    // outside a police station for a man who owes them a day.
    crew: [],
    riders: [],
    // The fine is not taken here. What happens next is a choice - sit it out
    // and pay, or go through the wall and pay nothing - and a bill settled
    // before the choice is made would decide it in advance.
    log: note(
      state.log,
      lost > 0
        ? `Verhaftet - und die Beute von ${String(lost)} € ist weg. Absitzen oder ausbrechen?`
        : "Verhaftet. Absitzen oder ausbrechen?",
    ),
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
 * What Shift is worth this frame.
 *
 * @param god - whether the cheat is on
 * @param boost - whether Shift is down
 * @param wheels - true for a car, false on foot
 * @returns the factor to multiply the pace by
 * @remarks
 * Two speeds, because Shift is two different things. On its own it is a run -
 * useful, and still a city one travels through. With the cheat on it is the
 * old tenfold sprint, which is for looking at the far end of the map rather
 * than for playing.
 */
function sprint(god: boolean, boost: boolean, wheels: boolean): number {
  const fast = wheels ? CHEAT_DRIVE : CHEAT_WALK;
  const run = wheels ? RUN_DRIVE : RUN_WALK;
  return boost ? (god ? fast : run) : 1;
}

/**
 * The jetpack: up while the button is held, down when it is let go.
 *
 * @remarks
 * Only on foot. A man in a car has no use for it, and a jetpack that lifted a
 * car would be a helicopter with a steering wheel.
 *
 * Height is one number and it does two things: it lifts the figure up the
 * screen, and above {@link ROOF_HEIGHT} it takes him out of the walls - see
 * {@link walk}. There is no flight model, no fuel and no falling damage: this
 * is a way over the block, not an aeroplane.
 *
 * @param state - the city as it stands
 * @param input - what the keys are doing
 * @param dt - seconds since the last step
 * @returns the city with the player that much higher or lower
 */
function fly(state: GameState, input: Input, dt: number): GameState {
  const player = state.player;
  const lifting =
    player.jetpack && player.car === null && !player.flying && input.lift;
  // **What is under him is what he lands on.** It used to be the road,
  // always - so letting go of the button over the middle of a block sank him
  // through the roof, the flat and the shop below it and stood him in the
  // street. The floor is now whatever {@link roofAt} says is there, which
  // makes coming down on a roof landing on it, and walking off the edge of
  // one falling off it: the floor drops to nought under his next step and he
  // goes with it.
  const floor = roofAt(state.cells, player.x, player.y);
  const height = Math.max(
    floor,
    Math.min(
      JET_CEILING,
      player.height + (lifting ? JET_RISE : -JET_FALL) * dt,
    ),
  );
  return player.flying ||
    (height === player.height && lifting === player.thrust)
    ? state
    : { ...state, player: { ...player, height, thrust: lifting } };
}

/**
 * The garage door, which is a wall whenever it is down.
 *
 * @remarks
 * Up when the owner comes near, down while the work is being done, up again
 * when it is finished - and the square behind it opens and closes with it. The
 * flag and the floor are set in the same breath here, so that what one can see
 * and what one can drive through can never disagree.
 */
function runDoor(state: GameState): GameState {
  const working =
    state.garageAt !== null && state.time < state.garageAt + GARAGE_SHUT;
  // Measured from the doorway rather than from the apron, so that the same
  // number works from both sides of it: a car deep in the bay is as near the
  // door as one waiting outside, and one that had to be within reach of the
  // pavement to get out again would be locked in for good.
  const near = state.garages.findIndex(
    (garage) => far(state.player, garageMouth(garage)) < GARAGE_OPEN,
  );
  const want = working || near < 0 ? null : near;
  let next = state;
  if (want !== state.garageOpen) {
    // One at a time: whichever stood open is shut before the next one opens,
    // so driving from one city to another never leaves a door up behind you.
    let cells = state.cells;
    const was = state.garageOpen;
    if (was !== null) {
      cells = setGarage(cells, state.garages[was], false);
    }
    if (want !== null) {
      cells = setGarage(cells, state.garages[want], true);
    }
    next = { ...state, garageOpen: want, cells };
  }
  return next;
}

/**
 * Which of the three houses is yours right now.
 *
 * @param state - the city
 * @returns the nearest of them
 * @remarks
 * There is one in every city, and the one that counts is the one you can see.
 */
export function homeOf(state: GameState): Vec {
  return nearest(state.garages, state.player);
}

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
  // All the way in, not merely on the apron: the work starts when the car is
  // in the bay and the door can come down behind it.
  const inside =
    car !== null && far(car, garageBay(homeOf(state))) < GARAGE_RANGE;
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
  const near = (thing: Vec) => far(thing, homeOf(state)) < GARAGE_SEEN;
  return (
    state.cops.some((cop) => cop.health > 0 && near(cop)) ||
    state.cars.some(
      (car) => car.kind === "police" && car.health > 0 && near(car),
    )
  );
}

/**
 * The belt, with the charges on the ground counted in.
 *
 * @remarks
 * The pouch and the ground are one supply as far as the belt is concerned. Ten
 * charges put down empty the pouch, and a wheel that then skipped the
 * detonator - or a button that no longer worked - would leave ten live charges
 * in the street with nothing to set them off with.
 */
function beltOf(state: GameState): readonly number[] {
  const slot = slotOf("remote");
  return state.charges.length === 0
    ? state.player.ammo
    : state.player.ammo.map((left, at) =>
        at === slot && left === 0 ? state.charges.length : left,
      );
}

/**
 * The right button: one charge, put down where the player stands.
 *
 * @remarks
 * On foot only, and never more than {@link CHARGE_MAX} of them at once. Where
 * they go is where you are rather than where you point, which is what makes
 * this a trap rather than a gun: you walk the line, then you walk away from it.
 */
function layCharge(state: GameState, input: Input): GameState {
  const player = state.player;
  const enough =
    input.plant &&
    player.weapon === "remote" &&
    player.car === null &&
    state.time >= player.floorUntil &&
    carried(player.ammo, "remote") &&
    state.charges.length < CHARGE_MAX;
  return enough
    ? {
        ...state,
        charges: [
          ...state.charges,
          {
            id:
              state.charges.reduce((most, each) => Math.max(most, each.id), 0) +
              1,
            x: player.x,
            y: player.y,
            at: state.time,
          },
        ],
        player: { ...player, ammo: firedOne(player.ammo, "remote") },
        log: note(
          state.log,
          `Zünder gelegt (${String(state.charges.length + 1)}/${String(CHARGE_MAX)}).`,
        ),
      }
    : state;
}

/**
 * The left button: every charge at once, and the ground where they lay.
 *
 * @remarks
 * All of them together rather than one per press. A line of charges under a
 * tank is one decision, and pressing the button five times while the tank
 * drives on would only be a way of getting it wrong.
 */
function setOff(state: GameState): GameState {
  let next = state;
  for (const charge of state.charges) {
    next = blast(next, charge, CHARGE_FORCE);
  }
  return state.charges.length === 0
    ? next
    : {
        ...next,
        charges: [],
        log: note(
          next.log,
          state.charges.length === 1
            ? "Zünder ausgelöst."
            : `${String(state.charges.length)} Zünder ausgelöst.`,
        ),
      };
}

/**
 * The bag, counted, the moment nobody is looking for the man carrying it.
 *
 * @remarks
 * Its own step rather than a line inside {@link coolDown}, because there are
 * three different ways for a search to end and only one of them is a star
 * ticking off: a raid finished and walked out of before anybody pressed the
 * alarm never raised a star at all, and a trip through the spray shop takes
 * them all away at once. Both used to leave the money in the bag for ever -
 * the player had robbed a bank and was no richer for it.
 *
 * So the rule is the plain one it should always have been: no stars, no bag.
 */
function cashIn(state: GameState): GameState {
  const loot = state.player.loot;
  return loot <= 0 || state.player.stars > 0 || state.phase !== "playing"
    ? state
    : {
        ...state,
        player: {
          ...state.player,
          money: state.player.money + loot,
          loot: 0,
          // Counted means home and dry, and the working clothes go with it.
          // Without this line a man who came up out of a tunnel unseen would
          // wear the mask for the rest of the game: the overall is otherwise
          // taken off by the last star, and he never had one. The same goes
          // for the balaclava of a bank job that nobody noticed.
          masked: false,
          hooded: false,
        },
        log: note(state.log, `Beute gesichert: ${String(loot)} €.`),
      };
}

/**
 * Which counter the player is standing at, if any.
 *
 * @param state - the game as it stands
 * @returns the sort of shop whose door they are in, or null
 * @remarks
 * On foot only. Nobody is served through a car window, and a bank that could be
 * robbed from the driving seat would be a bank nobody ever walked into.
 */
export function counterAt(state: GameState): Counter {
  let where: Counter = null;
  if (state.phase === "playing" && state.player.car === null) {
    if (atDoor(state, "guns")) {
      where = "guns";
    } else if (atDoor(state, "bank")) {
      where = "bank";
    } else if (atDoor(state, "mint")) {
      where = "mint";
    }
  }
  return where;
}

/** Which of the three doors one can be standing in. */
export type Counter = "guns" | "bank" | "mint" | null;

/** Whether the player is standing in the door of a building of this sort. */
function atDoor(state: GameState, kind: BuildingKind): boolean {
  return doorsOf(kind).some((door) => far(door, state.player) < COUNTER_RANGE);
}

/**
 * What the player asked for at the counter.
 *
 * @remarks
 * Everything here is refused rather than argued with: a purchase without the
 * money, a refill of a weapon one does not carry, a robbery with bare fists.
 * The panel only offers what is possible, so a refusal means somebody walked
 * out of the door between pressing and being served.
 */
function serveCounter(state: GameState, input: Input): GameState {
  const order = input.order;
  const where = counterAt(state);
  let next = state;
  if (order !== null && where === "guns" && order.kind === "buy") {
    next = bought(state, order);
  } else if (order !== null && where === "guns" && order.kind === "refill") {
    next = filled(state, order);
  } else if (order !== null && where === "bank" && order.kind === "rob") {
    next = goIntoBank(state);
  }
  if (order !== null && where === "mint" && order.kind === "raid") {
    next = goIn(state);
  }
  if (order !== null && order.kind === "hire") {
    next = takeOn(next);
  }
  if (order !== null && order.kind === "board") {
    next = boardOrder(next);
  }
  if (order !== null && order.kind === "hitch") {
    next = hitchOrder(next);
  }
  return next;
}

/* ------------------------------------------------------------------- crew */

/**
 * The nearest of the player's own gang who is not already working for him.
 *
 * @param state - the city
 * @returns the man he would take on, or null if there is nobody to ask
 * @remarks
 * Exported because the panel has to know whether to offer it at all. Standing
 * next to somebody is the whole of the condition: a crew is hired on a corner,
 * not out of a menu.
 */
export function hireable(state: GameState): Person | null {
  let best: Person | null = null;
  let bestAway = HIRE_RANGE;
  const room = state.crew.length < CREW_MAX;
  for (const person of state.people) {
    const gap = far(person, state.player);
    const gang = person.kind === "mine" || person.kind === "rival";
    if (
      room &&
      gang &&
      person.mood !== "down" &&
      !state.crew.includes(person.id) &&
      gap < bestAway
    ) {
      best = person;
      bestAway = gap;
    }
  }
  return state.phase === "playing" && state.player.car === null ? best : null;
}

/**
 * What that man wants for the day.
 *
 * @param person - whoever is being asked
 * @returns nothing for your own, the going rate for anybody else
 * @remarks
 * Exported because the panel has to put a number on the button, and there must
 * be one answer to the question rather than two that can drift apart.
 */
export function hirePrice(person: Person): number {
  return person.kind === "mine" ? 0 : HIRE_PRICE;
}

/**
 * How many of the hired men are standing about the player right now.
 *
 * @param state - the city
 * @returns how many of his crew are close enough to walk in with him
 * @remarks
 * The list of ids is who works for him; this is who is actually there. A man
 * who was left on the other side of town, or shot on the way, is neither.
 */
export function crewHere(state: GameState): number {
  return (
    state.people.filter(
      (person) =>
        state.crew.includes(person.id) &&
        person.mood !== "down" &&
        far(person, state.player) < CREW_NEAR,
    ).length + state.riders.length
  );
}

/** One man taken on for the day, cash in hand. */
function takeOn(state: GameState): GameState {
  const man = hireable(state);
  const player = state.player;
  const price = man === null ? 0 : hirePrice(man);
  return man === null || player.money < price
    ? state
    : {
        ...state,
        crew: [...state.crew, man.id],
        player: { ...player, money: player.money - price },
        log: note(
          state.log,
          price === 0
            ? "Einer von deinen Leuten läuft mit."
            : `Angeheuert - ${String(price)} €. Er läuft jetzt mit.`,
        ),
      };
}

/**
 * Through the door of the printing works, with everybody who came along.
 *
 * @remarks
 * Two conditions, and both of them are the story: enough men, and something in
 * his hand. Four men walk into a building like that and it is a robbery; one
 * man walks in and it is a tour.
 */
function goIn(state: GameState): GameState {
  const crew = crewHere(state);
  const armed =
    state.player.weapon !== "fist" &&
    carried(state.player.ammo, state.player.weapon);
  return crew < MINT_CREW || !armed
    ? state
    : {
        ...state,
        phase: "mint",
        mint: enterMint(state.time, crew),
        // The men who went in are in the building now, not in the street.
        people: state.people.filter(
          (person) => !state.crew.includes(person.id),
        ),
        crew: [],
        riders: [],
        player: { ...state.player, car: null, masked: true },
        log: note(
          state.log,
          "Masken auf. Die Tür ist zu - ab hier zählt jede Sekunde.",
        ),
      };
}

/** How close a hired man has to be to count as standing with you. */
const CREW_NEAR = 150;

/** One thing off the wall of the gun shop. */
function bought(
  state: GameState,
  order: Extract<Order, { kind: "buy" }>,
): GameState {
  const price = order.what === "jetpack" ? JET_PRICE : PRICES[order.what];
  const player = state.player;
  let next = state;
  if (order.what === "jetpack") {
    next =
      player.money < price || player.jetpack
        ? state
        : {
            ...state,
            player: { ...player, money: player.money - price, jetpack: true },
            log: note(
              state.log,
              "Jetpack gekauft. Leertaste halten - und Vorsicht beim Landen.",
            ),
          };
  } else if (price > 0 && player.money >= price) {
    const armour = order.what === "armour";
    next = {
      ...state,
      player: {
        ...player,
        money: player.money - price,
        armour: armour ? PLAYER_HEALTH : player.armour,
        ammo: armour ? player.ammo : tookUp(player.ammo, order.what),
        weapon: armour ? player.weapon : order.what,
      },
      log: note(
        state.log,
        `Gekauft: ${armour ? "Rüstung" : WEAPONS[order.what].name} für ${String(price)} €.`,
      ),
    };
  }
  return next;
}

/** Rounds for something already in the belt. */
function filled(
  state: GameState,
  order: Extract<Order, { kind: "refill" }>,
): GameState {
  const price = refillPrice(order.what);
  const player = state.player;
  let next = state;
  if (price > 0 && player.money >= price && carried(player.ammo, order.what)) {
    next = {
      ...state,
      player: {
        ...player,
        money: player.money - price,
        ammo: tookUp(player.ammo, order.what),
      },
      log: note(
        state.log,
        `Munition für ${WEAPONS[order.what].name}: ${String(price)} €.`,
      ),
    };
  }
  return next;
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
  return state.phase === "busted" || state.phase === "wasted"
    ? onStreet(state, state.phase === "busted")
    : state;
}

/**
 * Back on the pavement, clean, outside whichever building let you go.
 *
 * @param state - the game, in whichever phase it ended
 * @param pays - whether this way out costs the bail
 * @returns the city playing again
 * @remarks
 * Out of the door of the building that took you in: the hospital after a
 * death, the prison after a stretch or a hole in a wall. Waking up on the spot
 * where it happened never said where you had been, and both buildings are on
 * the map already - this is what they are for.
 */
function onStreet(state: GameState, pays: boolean): GameState {
  const gate = doorsOf(state.phase === "wasted" ? "hospital" : "prison");
  const out = nearest(gate, state.player);
  return {
    ...state,
    phase: "playing",
    player: {
      ...state.player,
      x: out.x,
      y: out.y,
      health: PLAYER_HEALTH,
      // The vest does not survive the hospital, the guns do. Losing the belt
      // on every death would make the city's kit a chore to re-walk.
      armour: 0,
      stars: 0,
      heat: 0,
      striped: false,
      masked: false,
      hooded: false,
      loot: 0,
      money: pays
        ? Math.max(0, state.player.money - BUSTED_COST)
        : state.player.money,
      car: null,
      floorUntil: 0,
      safeUntil: state.time + SAFE_SECONDS,
    },
    cars: state.cars.filter((car) => car.kind !== "police"),
    cops: [],
    heli: null,
    bank: null,
    mint: null,
    crew: [],
    riders: [],
    feud: false,
    // Whatever was lying in the street waiting for a button stays where it
    // was in the story, but not in the game: coming back from the cells with
    // ten live charges scattered over town is a trap for the player himself.
    charges: [],
    log: leftBehind(state, pays),
  };
}

/**
 * The bill for waking up somewhere else.
 *
 * @param state - the game at the moment of waking up
 * @param pays - whether this was the cells, which cost bail
 * @returns the log with whatever there is to say about it
 * @remarks
 * Two things can be gone: the bail, and the bag. A robber who is carried into
 * the hospital wakes up without the money, and that is worth a line - money
 * that disappears without one reads as a bug.
 */
function leftBehind(state: GameState, pays: boolean): readonly string[] {
  let log = state.log;
  if (pays) {
    log = note(log, `Kaution: ${BUSTED_COST} €.`);
  }
  if (state.player.loot > 0) {
    log = note(log, `Die Beute von ${String(state.player.loot)} € ist weg.`);
  }
  return log;
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
