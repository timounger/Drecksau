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
 * long. That is why the winch always works while there is fuel: it does not
 * fight gravity for grip, it takes grip out of the question.
 */
import { sectionAt } from "./map";
import { heightAt, routeLength, slopeAt } from "./terrain";
import {
  ANCHOR_REACH,
  FUEL_BURN,
  BEAR_LEASH,
  BEAR_NOTICE,
  BEAR_REACH,
  BEAR_SPEED,
  MAUL_SECONDS,
  SPRAY_REACH,
  SPRAY_SECONDS,
  PICKUP_REACH,
  REPAIR_SECONDS,
  TYRE_FACTOR,
  WINCH_BURN,
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
  type Bear,
  type GameState,
  type Input,
  type ItemKind,
  type Person,
  type Phase,
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

  // Picking up has a key of its own, so it never competes with the rope. What
  // is left on the rope key is the rope and the hammer, and those two never
  // mean the same thing in the same spot: one happens at a tree, the other at
  // the motorhome. Mending wins where both would be possible - somebody
  // standing at their broken motorhome with a hammer is not reaching for a
  // rope.
  const taking = state.people.map((person, index) =>
    !aboard[index] && said(index).take ? withinReach(person, route) : null,
  );
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
  const winding = reeling > 0 && state.fuel > 0;
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

  const people = state.people.map((person, index) =>
    moved(
      person,
      state,
      route,
      said(index),
      aboard[index],
      span,
      x,
      taking[index],
    ),
  );
  const bear = nextBear(state, route, people, aboard, said, span);
  const mauled = bear !== null && bear.hold >= MAUL_SECONDS;

  return {
    ...state,
    rv: { x, v: x === held.x ? held.v : 0 },
    people,
    bear,
    driver,
    gear,
    damaged: wrecked && !(done && job === "mend"),
    tyres: state.tyres || (done && job === "fit"),
    repair: done ? 0 : repair,
    section: Math.max(state.section, sectionAt(x)),
    hooked: releaseIf(hooked, rope, x, route),
    rope,
    fuel: nextFuel(state.fuel, winding, wheel, driver >= 0, span),
    phase: nextPhase(state.phase, x >= goal && driver >= 0, mauled),
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
 * @param taken - what they just picked up, or null
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
  taken: ItemKind | null,
): Person {
  const at = whereTheyStand(person, route, input, span, inside, rvX);
  return {
    at,
    inside,
    stride: person.stride + (inside ? 0 : Math.abs(at - person.at)),
    facing: facingOf(person, input, inside),
    walking: !inside && input.drive !== 0,
    carrying: taken === null ? person.carrying : [...person.carrying, taken],
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
 * What a person standing here could pick up, if anything.
 *
 * @param person - them, as they were
 * @param route - the route being driven
 * @returns the kind of thing in reach, or null
 * @remarks
 * Picking up is a **decision**, not something that happens to you: you stand at
 * the thing and press the key. Sweeping items up by walking over them meant
 * arriving at a wrecked motorhome with a hammer nobody remembered collecting -
 * and worse, walking past one without noticing that you now had it.
 *
 * Once picked up, a thing is never put down again. Reaching out of a cab window
 * for a set of tyres is not a thing that happens either, so this only answers
 * for somebody on foot.
 */
export function withinReach(person: Person, route: Route): ItemKind | null {
  if (person.inside) {
    return null;
  }
  const found = route.items.find(
    (item) =>
      Math.abs(person.at - item.at) <= PICKUP_REACH &&
      !person.carrying.includes(item.kind),
  );
  return found === undefined ? null : found.kind;
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

/**
 * How far the motorhome may go before the bear stops it.
 *
 * @param state - the world as it is
 * @returns the metre it may not pass, or infinity when nothing bars the way
 * @remarks
 * Carrying the spray is not enough - the can has to be **used**. Only a bear
 * that has actually been driven off opens the road.
 *
 * The line only counts while the bear is still **ahead**. A bear that has
 * walked past the motorhome chasing somebody must not drag it backwards, and
 * the driver who got past it while it was busy has earned that.
 */
function barrier(state: GameState, route: Route): number {
  const bear = state.bear;
  if (bear === null || bear.gone || route.bear === null) {
    return Number.POSITIVE_INFINITY;
  }
  // The line sits at the bear's **post**, not at the animal. It guards that
  // stretch of road, and walking a few metres aside after somebody does not
  // open it - otherwise luring it past the bumper would be a way through, and
  // the can of spray would be decoration.
  //
  // Never behind where the motorhome already is, so a bear can under no
  // circumstances drag one backwards.
  return Math.max(state.rv.x, route.bear - BEAR_REACH);
}

/**
 * The bear after this frame: resting, coming, sprayed or gone.
 *
 * @param state - the world as it was
 * @param people - where everybody is now
 * @param aboard - who is in the cab
 * @param said - what each of them is doing
 * @param span - how long the frame lasted
 * @returns the bear, one frame on
 * @remarks
 * It only ever wants somebody **on foot**. Whoever is in the cab is not there
 * as far as a bear is concerned, which is also the cheapest way out of a bad
 * situation: get in and shut the door.
 */
function nextBear(
  state: GameState,
  route: Route,
  people: readonly Person[],
  aboard: readonly boolean[],
  said: (index: number) => Input,
  span: number,
): Bear | null {
  const bear = state.bear;
  if (bear === null || bear.gone || route.bear === null) {
    return bear;
  }
  const post = route.bear;
  // The spray only works in a hand, held, and from close enough.
  const spraying = people.some(
    (person, index) =>
      !aboard[index] &&
      said(index).work &&
      person.carrying.includes("spray") &&
      Math.abs(person.at - bear.at) <= SPRAY_REACH,
  );
  const sprayed = spraying ? bear.sprayed + span : 0;
  if (sprayed >= SPRAY_SECONDS) {
    return { ...bear, sprayed: 0, hold: 0, gone: true };
  }

  // It follows whoever is on foot, but only to the end of its leash - and once
  // nobody is out any more it walks back to the spot it was guarding.
  const prey = nearestOnFoot(people, aboard, bear.at);
  const chasing = prey !== null && Math.abs(prey - bear.at) <= BEAR_NOTICE;
  const target = chasing && prey !== null ? prey : post;
  const at = leashed(towards(bear.at, target, BEAR_SPEED * span), post);
  const over = prey !== null && Math.abs(prey - at) <= BEAR_REACH;
  return { at, hold: over ? bear.hold + span : 0, sprayed, gone: false };
}

/**
 * Holds a place inside the bear's leash.
 *
 * @param at - where it would go
 * @param post - the spot it is guarding
 * @returns the place, pulled back to the end of the leash if need be
 */
function leashed(at: number, post: number): number {
  return Math.min(post + BEAR_LEASH, Math.max(post - BEAR_LEASH, at));
}

/**
 * Where the nearest person on foot stands, or null if everybody is aboard.
 *
 * @param people - everybody on the drive
 * @param aboard - who is in the cab
 * @param at - where the bear is
 * @returns the metre the nearest of them stands at, or null
 */
function nearestOnFoot(
  people: readonly Person[],
  aboard: readonly boolean[],
  at: number,
): number | null {
  let found: number | null = null;
  people.forEach((person, index) => {
    if (aboard[index]) {
      return;
    }
    if (found === null || Math.abs(person.at - at) < Math.abs(found - at)) {
      found = person.at;
    }
  });
  return found;
}

/**
 * Moves a number towards another, by at most one step.
 *
 * @param from - where it is
 * @param to - where it is heading
 * @param step - how far it may go this frame
 * @returns the new place, never overshooting the target
 */
function towards(from: number, to: number, step: number): number {
  const gap = to - from;
  return Math.abs(gap) <= step ? to : from + Math.sign(gap) * step;
}

/**
 * The phase after this frame.
 *
 * @param phase - the phase as it was
 * @param home - whether the motorhome has reached the flag
 * @param mauled - whether the bear has had somebody long enough
 * @returns the phase now
 * @remarks
 * The bear wins over the flag: arriving with somebody under a bear is not
 * arriving.
 */
function nextPhase(phase: Phase, home: boolean, mauled: boolean): Phase {
  if (phase !== "driving") {
    return phase;
  }
  if (mauled) {
    return "mauled";
  }
  return home ? "arrived" : phase;
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

/**
 * What is left in the tank after this frame.
 *
 * @param fuel - what was in it
 * @param winding - true while the winch is pulling
 * @param wheel - what the driver is doing
 * @param driving - true while somebody is at the wheel
 * @param span - how long the frame lasted
 * @returns the level now, never below empty
 * @remarks
 * Only work costs fuel: a motorhome standing with the engine idling burns
 * nothing here, because a gauge that falls while you think about a hill would
 * punish exactly the thinking this game is about.
 */
function nextFuel(
  fuel: number,
  winding: boolean,
  wheel: Input,
  driving: boolean,
  span: number,
): number {
  const engine = driving && wheel.drive !== 0 ? FUEL_BURN * span : 0;
  const winch = winding ? WINCH_BURN * span : 0;
  return Math.max(0, fuel - engine - winch);
}
