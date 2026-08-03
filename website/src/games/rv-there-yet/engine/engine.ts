/**
 * The rules of one drive: engine, gravity, grip and the winch.
 *
 * @module
 * @remarks
 * One pure function moves the world: {@link step} takes a state, what the
 * player is doing and how much time has passed, and returns the next state. No
 * canvas, no clock, no randomness - the same drive replays identically, which
 * is what makes a route testable without a browser.
 *
 * The driver is a person, not a fixture of the vehicle. Driving only happens
 * from the cab; the rope can only be put on a tree by somebody standing at that
 * tree. So a wall is a little errand: stop, get out, walk the rope up, come
 * back, get in, wind. Getting out puts the handbrake on - a motorhome that
 * rolled away while you were at the tree would be a joke that stops being funny
 * the first time.
 *
 * With the rope on a tree the vehicle is worked from **outside**: the winch has
 * a remote, and the handbrake comes off - the motorhome hangs on the rope, not
 * on the brake. Reeling in pulls it up, paying out lets it down, and both
 * happen while you stand where you can see the rope. Let the rope go and the
 * handbrake is back on.
 *
 * The winch is modelled as a **rope, not a force**. Winding shortens the rope,
 * and the motorhome simply cannot be further from the anchor than the rope is
 * long. That is why the winch always works while the battery lasts: it does not
 * fight gravity for grip, it takes grip out of the question.
 */
import { checkpointAt } from "./map";
import { heightAt, routeLength, slopeAt } from "./terrain";
import {
  ANCHOR_REACH,
  BATTERY_CHARGE,
  BEAR_REACH,
  PICKUP_REACH,
  REPAIR_SECONDS,
  TYRE_FACTOR,
  BATTERY_DRAIN,
  DRAG,
  BRAKE_ACCEL,
  gearAt,
  FULL_GRIP_SLOPE,
  GOAL_MARGIN,
  GRAVITY,
  MAX_STEP,
  NO_GRIP_SLOPE,
  ENTER_REACH,
  EXIT_GAP,
  NEUTRAL,
  REVERSE,
  ROLL_FRICTION,
  SPRINT_FACTOR,
  STOP_SPEED,
  TOP_GEAR,
  WALK_SPEED,
  WINCH_MIN,
  WINCH_RANGE,
  WINCH_SPEED,
  IDLE_INPUT,
  type GameState,
  type Input,
  type ItemKind,
  type Person,
  type Pit,
  type Route,
} from "./types";

/** Nothing is hooked. */
const UNHOOKED = -1;

/**
 * Moves the world on by one frame.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @param input - what the player is doing
 * @param dt - how much time has passed, in seconds
 * @returns the world one frame later
 */
export function step(
  state: GameState,
  route: Route,
  inputs: readonly Input[],
  dt: number,
): GameState {
  if (state.phase === "arrived") {
    return state;
  }
  const span = Math.min(MAX_STEP, Math.max(0, dt));
  const said = (index: number) => inputs[index] ?? IDLE_INPUT;

  // Doors first: everything after this depends on who is aboard.
  const aboard = state.people.map((person, index) =>
    said(index).door ? throughTheDoor(person, state) : person.inside,
  );
  const driver = nextDriver(state, aboard);
  const wheel = driver < 0 ? IDLE_INPUT : said(driver);

  // The gearbox is in the cab, so that is the only place it can be worked -
  // except for reverse, which puts itself in when the backwards pedal is held
  // on a standing vehicle.
  const gear = nextGear(state, wheel, driver >= 0);

  // The rope and the hammer answer to whoever is standing in the right place.
  // The same key does both, and the two never mean the same thing in the same
  // spot: one happens at the vehicle, the other at a tree. Mending wins where
  // both would be possible - somebody standing at their broken motorhome with
  // a hammer is not reaching for a rope.
  const tying = state.people.findIndex(
    (person, index) =>
      !aboard[index] &&
      said(index).hook &&
      jobAt(person, state, aboard[index]) === null,
  );
  const hooked =
    tying < 0 ? state.hooked : toggleHook(state.people[tying], state, route);
  // A fresh hook pays out exactly as much rope as there is distance. Forgetting
  // this once meant a rope of length zero, and a rope of length zero does not
  // pull the motorhome to the anchor - it teleports it there.
  const out =
    hooked !== state.hooked && hooked !== UNHOOKED
      ? route.anchors[hooked].x - state.rv.x
      : state.rope;
  // The remote only works in a hand, and hands are not in the cab.
  const reeling =
    hooked === UNHOOKED
      ? 0
      : state.people.reduce(
          (most, _person, index) =>
            aboard[index] || said(index).wind === 0 ? most : said(index).wind,
          0,
        );
  const winding = reeling > 0 && state.battery > 0;
  const rope = ropeAfter(out, winding, reeling < 0, span);

  const rv = whereTheVehicleGoes(
    state,
    route,
    wheel,
    gear,
    hooked,
    driver,
    span,
  );
  const held = holdOnRope(rv.x, rv.v, hooked, rope, route);
  const goal = routeLength(route) + GOAL_MARGIN;
  const stop = barrier(state, route);
  const x = Math.min(goal, stop, Math.max(0, held.x));
  const wrecked =
    state.damaged || drivenIntoAPit(state, route, x, hooked, driver);

  // One job at a time on one motorhome: the first pair of hands wins.
  const working = state.people.findIndex(
    (person, index) =>
      !aboard[index] &&
      said(index).work &&
      jobAt(person, state, false) !== null,
  );
  const job = working < 0 ? null : jobAt(state.people[working], state, false);
  const repair = job === null ? 0 : state.repair + span;
  const done = repair >= REPAIR_SECONDS;

  return {
    ...state,
    rv: { x, v: x === held.x ? held.v : 0 },
    people: state.people.map((person, index) =>
      moved(person, state, route, said(index), aboard[index], span, x),
    ),
    driver,
    gear,
    damaged: wrecked && !(done && job === "mend"),
    tyres: state.tyres || (done && job === "fit"),
    repair: done ? 0 : repair,
    checkpoint: Math.max(state.checkpoint, checkpointAt(x)),
    hooked: releaseIf(hooked, rope, x, route),
    rope,
    battery: nextBattery(state.battery, winding, wheel, driver >= 0, span),
    phase: x >= goal && driver >= 0 ? "arrived" : state.phase,
    time: state.time + span,
    reached: Math.max(state.reached, x),
  };
}

/**
 * Who is at the wheel after the doors have been worked.
 *
 * @param state - the world as it is
 * @param aboard - who is in the cab now
 * @returns the index of the driver, or -1 if nobody is
 * @remarks
 * Whoever got in **first** drives, and keeps driving for as long as they stay
 * aboard - so a passenger climbing in never takes the wheel out of somebody's
 * hands. When the driver climbs out, a passenger left in the cab takes over;
 * somebody has to be able to move the thing.
 */
function nextDriver(state: GameState, aboard: readonly boolean[]): number {
  if (state.driver >= 0 && aboard[state.driver]) {
    return state.driver;
  }
  return aboard.indexOf(true);
}

/**
 * Where one person is after this frame, and what they are carrying.
 *
 * @param person - them, as they were
 * @param state - the world as it was
 * @param route - the route being driven
 * @param input - what they are doing
 * @param inside - whether they are in the cab now
 * @param span - how long the frame lasted
 * @param rvX - where the motorhome is now, in metres
 * @returns them, one frame later
 */
function moved(
  person: Person,
  state: GameState,
  route: Route,
  input: Input,
  inside: boolean,
  span: number,
  rvX: number,
): Person {
  const at = whereTheyStand(person, route, input, span, inside, rvX);
  return {
    at,
    inside,
    stride: person.stride + (inside ? 0 : Math.abs(at - person.at)),
    facing: facingOf(person, input, inside),
    walking: !inside && input.drive !== 0,
    carrying: carriedAfter(person, route, at, inside),
  };
}

/**
 * How much rope is out after one frame.
 *
 * @param out - how much was out before
 * @param winding - true while the remote reels in
 * @param paying - true while the remote pays out
 * @param span - how long the frame lasted
 * @returns the new length, never shorter than the hook allows and never longer
 * than the drum holds
 */
function ropeAfter(
  out: number,
  winding: boolean,
  paying: boolean,
  span: number,
): number {
  if (winding) {
    return Math.max(WINCH_MIN, out - WINCH_SPEED * span);
  }
  if (paying) {
    return Math.min(WINCH_RANGE, out + WINCH_SPEED * span);
  }
  return out;
}

/**
 * Where the motorhome ends up after one frame.
 *
 * @remarks
 * Three cases. In the cab it is driven. On the rope it **rolls** - the
 * handbrake is off, the vehicle hangs on the rope, and that is what lets the
 * winch lower it as well as raise it. Otherwise it is parked, and a parked
 * motorhome stays where it was put.
 */
function whereTheVehicleGoes(
  state: GameState,
  route: Route,
  input: Input,
  gear: number,
  hooked: number,
  driver: number,
  span: number,
) {
  if (driver >= 0) {
    return driven(state, route, input, gear, span);
  }
  if (hooked !== UNHOOKED) {
    return driven(state, route, { ...input, drive: 0 }, NEUTRAL, span);
  }
  return { x: state.rv.x, v: 0 };
}

/**
 * Where the motorhome ends up after one frame of being driven.
 *
 * @remarks
 * The gear decides both how hard the engine pulls and which way; the pedal only
 * says how much. Past the gear's top speed the engine stops helping - that, and
 * not a global speed limit, is why fifth is no use on a climb and first is no
 * use on the flat.
 */
function driven(
  state: GameState,
  route: Route,
  input: Input,
  gear: number,
  span: number,
) {
  const slope = slopeAt(route, state.rv.x);
  const angle = Math.atan(slope);
  const hold = grip(slope, state.tyres);
  const box = gearAt(gear);

  // A wrecked motorhome does not drive. It still rolls, and it can still be
  // pulled: that is the only way it leaves the ditch.
  const pedal = state.damaged ? 0 : pedalOf(input.drive, state.rv.v);
  const revving = box.way > 0 ? state.rv.v < box.top : state.rv.v > -box.top;
  // Pressing forwards with reverse engaged does nothing at all: the forward
  // gears are the driver's to choose, and guessing one for them would be the
  // gearbox driving the vehicle.
  const wrongWay = input.drive > 0 && box.way < 0;
  const push =
    pedal > 0 && revving && !wrongWay ? box.way * box.pull * hold : 0;
  const brake = pedal < 0 ? -Math.sign(state.rv.v) * BRAKE_ACCEL * hold : 0;
  const pull = -GRAVITY * Math.sin(angle);
  const v =
    state.rv.v +
    (push + brake + pull + resistance(state.rv.v, push, span)) * span;

  // A brake stops a vehicle; it does not throw it into reverse.
  const stopped = pedal < 0 && Math.sign(v) !== Math.sign(state.rv.v);
  const speed = stopped ? 0 : v;
  return { x: state.rv.x + speed * Math.cos(angle) * span, v: speed };
}

/**
 * Where somebody standing beside the motorhome stands.
 *
 * @param x - where the motorhome is, in metres
 * @returns where the driver has room to stand
 * @remarks
 * Behind it by choice, in front of it where behind would be off the start of
 * the map. Getting out at the very first metre and finding yourself standing
 * in the middle of your own motorhome is a poor way to begin.
 */
export function besideTheVehicle(x: number): number {
  return x - EXIT_GAP >= 0 ? x - EXIT_GAP : x + EXIT_GAP;
}

/**
 * Where the driver stands after one frame.
 *
 * @remarks
 * Three cases, and the middle one is the one worth naming: the frame in which
 * somebody steps out puts them down **behind** the motorhome, not inside it,
 * so the next step already walks from beside the door.
 *
 * On foot no grip is asked for. A person walks up ground no motorhome could
 * hold, and the errand to the tree must never be the thing that fails.
 */
function whereTheyStand(
  person: Person,
  route: Route,
  input: Input,
  span: number,
  inside: boolean,
  rvX: number,
): number {
  if (inside) {
    return rvX;
  }
  const from = person.inside ? besideTheVehicle(rvX) : person.at;
  const pace = WALK_SPEED * (input.sprint ? SPRINT_FACTOR : 1);
  const walked = person.inside ? from : from + input.drive * pace * span;
  return Math.min(routeLength(route) + GOAL_MARGIN, Math.max(0, walked));
}

/**
 * Which way the driver looks.
 *
 * @remarks
 * Kept from the last step taken rather than reset to the front: somebody who
 * stops walking keeps looking where they were going.
 */
function facingOf(person: Person, input: Input, inside: boolean): number {
  if (inside || input.drive === 0) {
    return person.facing;
  }
  return input.drive > 0 ? 1 : -1;
}

/**
 * Steps out of the cab, or back into it.
 *
 * @remarks
 * Getting in needs the driver to be standing at the motorhome; getting out
 * always works and puts them down just behind it.
 */
function throughTheDoor(person: Person, state: GameState): boolean {
  if (person.inside) {
    return false;
  }
  return Math.abs(person.at - state.rv.x) <= ENTER_REACH;
}

/**
 * How much of the engine's force the tyres can still put on the ground.
 *
 * @param slope - metres of rise per metre travelled
 * @returns 1 with full grip, 0 where only the winch helps
 * @remarks
 * This is the whole point of the game: past {@link NO_GRIP_SLOPE} no amount of
 * throttle moves the motorhome uphill, so a steep ramp is not a driving problem
 * but a winching problem.
 */
export function grip(slope: number, tyres = false): number {
  const stretch = tyres ? TYRE_FACTOR : 1;
  const full = FULL_GRIP_SLOPE * stretch;
  const none = NO_GRIP_SLOPE * stretch;
  const steep = Math.abs(slope);
  if (steep <= full) {
    return 1;
  }
  if (steep >= none) {
    return 0;
  }
  return (none - steep) / (none - full);
}

/** What somebody standing at the motorhome with the right thing can do to it. */
export type Job = "mend" | "fit" | null;

/**
 * The anchor the rope would reach right now.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @returns the anchor's index, or -1 if none is in reach
 * @remarks
 * Only anchors **ahead** count. The winch is there to get the motorhome up the
 * next climb, and a rope to something already passed would only ever hold it
 * back.
 */
export function reachableAnchor(
  person: Person,
  state: GameState,
  route: Route,
): number {
  const candidate = ropeCandidate(state, route);
  if (candidate === UNHOOKED || person.inside) {
    return UNHOOKED;
  }
  const standing =
    Math.abs(route.anchors[candidate].x - person.at) <= ANCHOR_REACH;
  return standing ? candidate : UNHOOKED;
}

/**
 * The anchor the rope would be long enough for, whoever is standing where.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @returns the anchor's index, or -1 if the rope reaches none
 * @remarks
 * Only anchors **ahead** count. The winch is there to get the motorhome up the
 * next climb, and a rope to something already passed would only ever hold it
 * back. This is what the screen lights up: it says "that one is worth walking
 * to", not "you may hook it from here".
 */
export function ropeCandidate(state: GameState, route: Route): number {
  let best = UNHOOKED;
  let nearest = Number.POSITIVE_INFINITY;
  route.anchors.forEach((anchor, index) => {
    const gap = anchor.x - state.rv.x;
    if (gap > WINCH_MIN && gap <= WINCH_RANGE && gap < nearest) {
      nearest = gap;
      best = index;
    }
  });
  return best;
}

/**
 * Whether the driver stands close enough to the motorhome to get back in.
 *
 * @param state - the world as it is
 * @returns true while the door is within reach
 */
export function atVehicle(person: Person, state: GameState): boolean {
  return !person.inside && Math.abs(person.at - state.rv.x) <= ENTER_REACH;
}

/**
 * How high the motorhome stands right now.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @returns the ground height under it, in metres
 */
export function rvHeight(state: GameState, route: Route): number {
  return heightAt(route, state.rv.x);
}

/**
 * Puts the rope on the tree the driver is standing at, or takes it off again.
 *
 * @remarks
 * Both only from outside: nobody hooks a rope onto a tree through a windscreen.
 *
 * The check for `inside` cannot be observed today - a tree is always more than
 * {@link WINCH_MIN} ahead and {@link ANCHOR_REACH} is shorter than that, so
 * somebody in the cab is never within touching distance of one anyway. It stays
 * because the rule should not quietly depend on that coincidence between two
 * unrelated numbers.
 */
function toggleHook(person: Person, state: GameState, route: Route): number {
  if (state.hooked !== UNHOOKED) {
    return atAnchor(person, route, state.hooked) ? UNHOOKED : state.hooked;
  }
  return reachableAnchor(person, state, route);
}

/** Whether the driver stands close enough to a given anchor to touch it. */
function atAnchor(person: Person, route: Route, index: number): boolean {
  return Math.abs(route.anchors[index].x - person.at) <= ANCHOR_REACH;
}

/**
 * Rolling friction and air resistance, both against the direction of travel.
 *
 * @param v - how fast the motorhome is going
 * @param push - what the engine is putting in right now
 * @returns the deceleration
 * @remarks
 * Friction is decided by whether the engine is **pulling**, not by whether a
 * pedal is down. Holding the accelerator with reverse engaged puts nothing on
 * the road, and a motorhome that then rolled on for ever because a key was held
 * would be a very odd thing to have to explain.
 *
 * @param span - how long the frame lasted, so the bite can be capped
 */
function resistance(v: number, push: number, span: number): number {
  // Never more than it takes to stop: friction that overshoots zero would have
  // the motorhome shivering back and forth on level ground for ever.
  const bite = span > 0 ? Math.min(ROLL_FRICTION, Math.abs(v) / span) : 0;
  const rolling = push === 0 ? bite * -Math.sign(v) : 0;
  return rolling - v * DRAG;
}

/**
 * Whether the motorhome has just been driven into a ditch.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @param x - where the motorhome is now, in metres
 * @param hooked - the anchor the rope is on, or -1
 * @returns true if it is wrecked by this
 * @remarks
 * On the rope it does not count. Being pulled through a hole and out the other
 * side is a recovery; driving over the edge is an accident, and the difference
 * is the whole reason to look at a ditch before putting a foot down.
 */
function drivenIntoAPit(
  state: GameState,
  route: Route,
  x: number,
  hooked: number,
  driver: number,
): boolean {
  if (hooked !== UNHOOKED || driver < 0) {
    return false;
  }
  // Driving **in** means crossing the edge. Standing in the hole and giving it
  // some throttle is not a second accident, and treating it as one would leave
  // a motorhome that was mended down there impossible to get out.
  const inside = (at: number) => (pit: Pit) => at >= pit.from && at <= pit.to;
  return route.pits.some(inside(x)) && !route.pits.some(inside(state.rv.x));
}

/**
 * Whether the driver is standing at the motorhome ready to mend it.
 *
 * @param state - the world as it is
 * @param inside - whether they are in the cab
 * @returns true if holding the key would hammer
 */
export function canMend(
  person: Person,
  state: GameState,
  inside: boolean,
): boolean {
  return jobAt(person, state, inside) !== null;
}

/**
 * What the driver is carrying after this frame.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @param walker - where they stand now, in metres
 * @param inside - whether they are in the cab
 * @returns the list of things carried
 * @remarks
 * Picked up by walking over them, and never put down again. Reaching out of a
 * cab window for a set of tyres is not a thing that happens.
 */
function carriedAfter(
  person: Person,
  route: Route,
  at: number,
  inside: boolean,
): readonly ItemKind[] {
  if (inside) {
    return person.carrying;
  }
  const found = route.items.filter(
    (item) =>
      Math.abs(at - item.at) <= PICKUP_REACH &&
      !person.carrying.includes(item.kind),
  );
  return found.length === 0
    ? person.carrying
    : [...person.carrying, ...found.map((item) => item.kind)];
}

/**
 * The job the driver could do standing at the motorhome, if any.
 *
 * @param state - the world as it is
 * @param inside - whether they are in the cab
 * @returns what holding the key would do
 * @remarks
 * Mending first: a wreck with a set of tyres beside it is still a wreck, and
 * fitting wheels to something that will not drive helps nobody.
 */
export function jobAt(person: Person, state: GameState, inside: boolean): Job {
  const atIt = !inside && Math.abs(person.at - state.rv.x) <= ENTER_REACH;
  if (!atIt) {
    return null;
  }
  if (state.damaged) {
    return person.carrying.includes("hammer") ? "mend" : null;
  }
  return !state.tyres && person.carrying.includes("tyres") ? "fit" : null;
}

/** Whether a bear is standing in the way of somebody without the spray. */
function barrier(state: GameState, route: Route): number {
  // One can of spray is enough for the party: whoever is holding it is the one
  // walking up to the bear.
  const clear =
    route.bear === null ||
    state.people.some((person) => person.carrying.includes("spray"));
  return clear ? Number.POSITIVE_INFINITY : route.bear - BEAR_REACH;
}

/**
 * Which gear is engaged after this frame.
 *
 * @param state - the world as it is
 * @param input - what the player is doing
 * @param inside - whether the driver is in the cab
 * @returns the gear
 */
function nextGear(state: GameState, input: Input, inside: boolean): number {
  if (!inside) {
    return state.gear;
  }
  if (input.shift !== null) {
    return input.shift;
  }
  const standing = Math.abs(state.rv.v) <= STOP_SPEED;
  return input.drive < 0 && standing ? REVERSE : state.gear;
}

/**
 * Which way the pedal being held is working: 1 drives, -1 brakes, 0 coasts.
 *
 * @param drive - the pedal: 1 forwards, -1 backwards
 * @param v - how fast the motorhome is going
 * @returns what the pedal does right now
 * @remarks
 * A pedal against the direction of travel is a brake until the motorhome is
 * standing, and only then the accelerator of the other direction. Anything else
 * would have a vehicle at speed changing direction on the spot.
 */
export function pedalOf(drive: number, v: number): number {
  if (drive > 0) {
    return v < -STOP_SPEED ? -1 : 1;
  }
  if (drive < 0) {
    return v > STOP_SPEED ? -1 : 1;
  }
  return 0;
}

/**
 * Whether a gear can be selected at all.
 *
 * @param gear - the wanted gear
 * @returns true if the box has it
 */
export function isGear(gear: number): boolean {
  return Number.isInteger(gear) && gear >= REVERSE && gear <= TOP_GEAR;
}

/** Keeps the motorhome no further from the anchor than the rope is long. */
function holdOnRope(
  x: number,
  v: number,
  hooked: number,
  rope: number,
  route: Route,
) {
  if (hooked === UNHOOKED) {
    return { x, v };
  }
  const limit = route.anchors[hooked].x - rope;
  // Winding drags it up; a slide back stops dead at the rope's length.
  return x < limit ? { x: limit, v: Math.max(0, v) } : { x, v };
}

/** Takes the hook off once the rope is wound in or has been driven past. */
function releaseIf(
  hooked: number,
  rope: number,
  x: number,
  route: Route,
): number {
  if (hooked === UNHOOKED) {
    return UNHOOKED;
  }
  const gap = route.anchors[hooked].x - x;
  return rope <= WINCH_MIN || gap <= WINCH_MIN ? UNHOOKED : hooked;
}

/** Drains the battery while winding, and fills it while the engine runs. */
function nextBattery(
  battery: number,
  winding: boolean,
  wheel: Input,
  driving: boolean,
  span: number,
): number {
  const used = winding ? BATTERY_DRAIN * span : 0;
  const made = driving && wheel.drive !== 0 ? BATTERY_CHARGE * span : 0;
  return Math.min(1, Math.max(0, battery - used + made));
}
