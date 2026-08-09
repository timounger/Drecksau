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
  FUEL_SECONDS,
  BEAR_LEASH,
  BEAR_NOTICE,
  BEAR_REACH,
  BEAR_SPEED,
  JUMP_AGAIN,
  JUMP_FALL,
  JUMP_HIGH,
  BRIDGE_LOAD,
  CHASM_STOP,
  FELL_SECONDS,
  LADDER_REACH,
  LEAP_SPEED,
  ROOF_HALF,
  ROOF_HIGH,
  MAUL_SECONDS,
  MUD_SPEED,
  SPRAY_REACH,
  SPRAY_SECONDS,
  STILL_SECONDS,
  STILL_SPEED,
  FOG_GRACE,
  PICKUP_REACH,
  REPAIR_SECONDS,
  TYRE_FACTOR,
  WINCH_BURN,
  DRAG,
  BRAKE_ACCEL,
  HANDBRAKE,
  gearAt,
  FULL_GRIP_SLOPE,
  GOAL_MARGIN,
  GRAVITY,
  MAX_STEP,
  NO_GRIP_SLOPE,
  REMOTE,
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

/** How far onto the roof a climb steps, in metres past its back edge. */
const ROOF_STEP = 0.3;

/** How long each job takes, in seconds. */
const WORK_SECONDS: Readonly<Record<NonNullable<Job> | "mend", number>> = {
  mend: REPAIR_SECONDS,
  fit: REPAIR_SECONDS,
  fuel: FUEL_SECONDS,
  fell: FELL_SECONDS,
};

/**
 * What somebody is standing **on**, in metres above the ground.
 *
 * @param at - where they are along the route, in metres
 * @param lift - how high they were off the ground, in metres
 * @param rvX - where the motorhome stands, in metres
 * @returns 0 for the road, the height of the roof for the roof
 * @remarks
 * The roof of the motorhome is ground like any other: you walk along it, you
 * fall off the end of it, and a jump from up there carries further than one
 * from the road - which is the whole reason it is standable, because it is the
 * only way over the chasm.
 *
 * Being **over** the vehicle is not enough: you have to be up there already.
 * Otherwise standing beside it would count as standing on it, and the roof
 * would catch every jump taken anywhere near the thing.
 */
export function floorUnder(at: number, lift: number, rvX: number): number {
  const over = Math.abs(at - rvX) <= ROOF_HALF;
  return over && lift >= ROOF_HIGH ? ROOF_HIGH : 0;
}

/** Whether somebody is standing at the ladder on the back of the motorhome. */
export function atTheLadder(at: number, rvX: number): boolean {
  return Math.abs(at - (rvX - ROOF_HALF)) <= LADDER_REACH;
}

/**
 * Whether a place lies on a stretch of the route.
 *
 * @param span - the stretch, in metres
 * @param x - the place, in metres
 * @returns true while it is on it, ends included
 */
export function within(span: Pit, x: number): boolean {
  return x >= span.from && x <= span.to;
}

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
  // A drive that is over is over. The loop stops calling this the moment the
  // phase leaves "driving", so this only ever catches a caller that carries on
  // - and a motorhome that went on rolling out of a collapsed bridge would be
  // a strange thing to have left possible.
  if (state.phase !== "driving") {
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
  // The handbrake is the driver's alone, and it is on only while it is held -
  // `wheel` is already an idle input when nobody is at the wheel.
  const brake = wheel.brake;

  // Picking up has a key of its own, so it never competes with the rope. What
  // is left on the rope key is the rope and the hammer, and those two never
  // mean the same thing in the same spot: one happens at a tree, the other at
  // the motorhome. Mending wins where both would be possible - somebody
  // standing at their broken motorhome with a hammer is not reaching for a
  // rope.
  const taking = state.people.map((person, index) =>
    !aboard[index] && said(index).take
      ? withinReach(person, state, route)
      : null,
  );
  const tying = state.people.findIndex(
    (person, index) =>
      !aboard[index] &&
      said(index).hook &&
      jobAt(person, state, aboard[index], route) === null,
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
          // The remote only works in a hand, and hands are not in the cab.
          (most, person, index) =>
            aboard[index] || person.holding !== REMOTE || said(index).wind === 0
              ? most
              : said(index).wind,
          0,
        );
  const winding = reeling > 0 && state.fuel > 0;
  const rope = ropeAfter(out, winding, reeling < 0, span);
  const winch = winding ? 1 : reeling < 0 ? -1 : 0;

  const rv = whereTheVehicleGoes(
    state,
    route,
    wheel,
    gear,
    hooked,
    driver,
    brake,
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
      jobAt(person, state, false, route) !== null,
  );
  const job =
    working < 0 ? null : jobAt(state.people[working], state, false, route);
  const repair = job === null ? 0 : state.repair + span;
  const done = repair >= WORK_SECONDS[job ?? "mend"];

  // Fitted tyres are on the motorhome, not in a bag. Whoever bolted them on
  // is the one who no longer has them.
  const spent = (index: number): ItemKind | null => {
    if (!done || index !== working) {
      return null;
    }
    // Used up: fitted tyres are on the motorhome, an emptied can is empty.
    if (job === "fit") {
      return "tyres";
    }
    return job === "fuel" ? "can" : null;
  };
  const people = state.people.map((person, index) =>
    moved(
      person,
      state,
      route,
      said(index),
      aboard[index],
      span,
      x,
      hooked,
      taking[index],
      spent(index),
    ),
  );
  const bear = nextBear(state, route, people, aboard, said, span);
  const mauled = bear !== null && bear.hold >= MAUL_SECONDS;
  const still = nextStill(state, route, people, x, span);
  const taken = still >= STILL_SECONDS;
  const fell = tooHeavyForTheBridge(route, x, people);
  const plunged = intoTheChasm(route, state.felled, x, people);

  return {
    ...state,
    rv: { x, v: x === held.x ? held.v : 0 },
    people,
    bear,
    driver,
    gear,
    damaged: wrecked && !(done && job === "mend"),
    felled: state.felled || (done && job === "fell"),
    tyres: state.tyres || (done && job === "fit"),
    repair: done ? 0 : repair,
    section: Math.max(state.section, sectionAt(x)),
    hooked: releaseIf(hooked, rope, x, route),
    rope,
    winch,
    fuel:
      done && job === "fuel"
        ? 1
        : nextFuel(state.fuel, winding, wheel, driver >= 0, span),
    still,
    brake,
    phase: nextPhase(
      state.phase,
      x >= goal && driver >= 0,
      mauled,
      taken,
      fell,
      plunged,
    ),
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
 * @param hooked - the anchor the rope is on now, or -1
 * @param taken - what they just picked up, or null
 * @param spent - what they just used up, or null
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
  hooked: number,
  taken: ItemKind | null,
  spent: ItemKind | null,
): Person {
  const walked = whereTheyStand(
    person,
    route,
    input,
    span,
    inside,
    rvX,
    state.felled,
  );
  // Climbing the ladder is a step **onto** the roof, not only upwards: the
  // ladder can be reached from further back than the roof reaches, and
  // somebody put up there behind its back edge would drop straight off again.
  const climbing =
    !inside &&
    input.jump &&
    !offTheGround(person, floorUnder(walked, person.lift, rvX)) &&
    atTheLadder(walked, rvX);
  const at = climbing ? rvX - ROOF_HALF + ROOF_STEP : walked;
  const got = taken === null ? person.carrying : [...person.carrying, taken];
  const carrying = spent === null ? got : got.filter((kind) => kind !== spent);
  return {
    at,
    inside,
    stride: person.stride + (inside ? 0 : Math.abs(at - person.at)),
    facing: facingOf(person, input, inside),
    walking: !inside && input.drive !== 0,
    carrying,
    holding: stillHeld(
      // What the spot calls for beats what was last chosen off the list.
      neededAt(at, inside, carrying, state, route, hooked) ??
        heldAfter(person, input, carrying),
      carrying,
      hooked,
    ),
    ...jumped(
      person,
      input,
      inside,
      span,
      floorUnder(at, person.lift, rvX),
      climbing,
    ),
  };
}

/**
 * Whether somebody's feet have left the ground.
 *
 * @param person - them
 * @param floor - what they would be standing on, in metres above the ground
 * @returns true while they are in the air
 * @remarks
 * Both halves are needed. In the frame a jump starts they are still at the
 * height of whatever they are standing on and only carry the speed, and
 * counting that frame as standing would make the first frame of a jump look
 * like standing still.
 */
function offTheGround(person: Person, floor: number): boolean {
  return person.lift > floor || person.rise > 0;
}

/**
 * How high one person is off the ground after this frame.
 *
 * @param person - them, as they were
 * @param input - what they are doing
 * @param inside - whether they are in the cab now
 * @param span - how long the frame lasted
 * @returns their height, their upward speed and the time since take-off
 * @remarks
 * A plain throw: up at whatever speed reaches {@link JUMP_HIGH}, then gravity.
 * The **second** press is not a second jump - nobody leaves the ground twice -
 * but a push on the one already under way, and it is aimed rather than added:
 * the speed is set to whatever it now takes to peak at twice the height, so a
 * double tap comes out at twice the height whether the second press landed at
 * once or a moment later.
 *
 * Climbing into the cab puts the feet down wherever they were. A motorhome
 * driving off with somebody hanging in the air beside it is a stranger sight
 * than a jump cut short.
 */
function jumped(
  person: Person,
  input: Input,
  inside: boolean,
  span: number,
  floor: number,
  ladder: boolean,
): { readonly lift: number; readonly rise: number; readonly pop: number } {
  if (inside) {
    return { lift: 0, rise: 0, pop: -1 };
  }
  const standing = { lift: floor, rise: 0, pop: -1 };
  if (!offTheGround(person, floor)) {
    // At the ladder the key climbs instead of jumping. Nobody jumps three and
    // a half metres, and every motorhome has a ladder on its back door.
    if (input.jump && ladder) {
      return { lift: ROOF_HIGH, rise: 0, pop: -1 };
    }
    return input.jump
      ? { lift: floor, rise: Math.sqrt(2 * JUMP_FALL * JUMP_HIGH), pop: 0 }
      : standing;
  }
  // In the air: either the second press lands, or gravity has its way.
  if (input.jump && person.pop >= 0 && person.pop <= JUMP_AGAIN) {
    // One more jump's worth of push, added to whatever is left of the first.
    // Aiming at a **height** instead was wrong the moment the ground under
    // the jumper could change: leap off the roof and the floor drops away
    // mid-flight, and the second press came out weaker than no press at all.
    // Energy does not care where the ground went - and it comes out at
    // exactly twice the height either way, whenever the press lands.
    return {
      lift: person.lift,
      rise: Math.sqrt(person.rise ** 2 + 2 * JUMP_FALL * JUMP_HIGH),
      pop: -1,
    };
  }
  const rise = person.rise - JUMP_FALL * span;
  // The average of the two speeds, not the new one: over a frame the speed
  // changes steadily, so the middle of it is the distance actually covered.
  // Taking the end speed loses a little height every frame, and how much
  // depends on the frame rate - the same jump would come out lower on a
  // slower machine, which is a strange thing to let a browser decide.
  const lift = person.lift + ((person.rise + rise) / 2) * span;
  return lift <= floor
    ? standing
    : { lift, rise, pop: person.pop < 0 ? -1 : person.pop + span };
}

/**
 * The hand, once whatever was in it may have been used up.
 *
 * @param wanted - what they would be holding
 * @param carrying - the bag as it is now
 * @param hooked - the anchor the rope is on now, or -1
 * @returns the thing in hand, or null when the bag is empty
 * @remarks
 * Fitting the tyres takes them out of the bag, and a hand still holding them
 * would be holding something that no longer exists. What is left is empty
 * hands: the next thing worth holding comes to hand where it is wanted.
 */
function stillHeld(
  wanted: ItemKind | null,
  carrying: readonly ItemKind[],
  hooked: number,
): ItemKind | null {
  // The remote is the one tool whose use is a **state** of the world rather
  // than something done in a place: it works while the rope is on and at no
  // other time. So it is in the hand then and back in the bag the moment the
  // rope comes off, rather than staying there for the rest of the drive.
  if (wanted === REMOTE && hooked === UNHOOKED) {
    return null;
  }
  if (wanted !== null && carrying.includes(wanted)) {
    return wanted;
  }
  // Nothing wanted means empty hands. Falling back to the first thing in the
  // bag put the remote there for the whole drive - a tool held for hours in
  // case it might be needed, which is not how anybody carries anything.
  return null;
}

/**
 * What the place somebody is standing in calls for out of their bag.
 *
 * @param at - where they are now, in metres
 * @param inside - whether they are in the cab
 * @param carrying - their bag as it is now
 * @param state - the world as it was
 * @param route - the route being driven
 * @param hooked - the anchor the rope is on **now**, or -1
 * @returns the thing to put in their hand, or null to leave the hand alone
 * @remarks
 * The list on screen used to be a step of its own: pick the thing up, then
 * find it in the bag, then use it. Standing in front of a bear with the can
 * one keypress away is not an interesting decision, it is a fumble - and the
 * bear does not wait while you have it.
 *
 * So the hand follows the spot. At a tree or on the rope it is the remote, in
 * front of a bear the spray, at the motorhome whatever the motorhome needs.
 * The order is {@link jobAt}'s own, so the automatic choice can never be a job
 * the game would then refuse to do: a wreck with a set of tyres beside it is
 * still a wreck.
 *
 * Nothing is forced when the spot asks for nothing, so the list can still be
 * used by hand - and nothing is ever conjured out of thin air: only what is
 * already in the bag can be reached for.
 */
function neededAt(
  at: number,
  inside: boolean,
  carrying: readonly ItemKind[],
  state: GameState,
  route: Route,
  hooked: number,
): ItemKind | null {
  if (inside) {
    return null;
  }
  const has = (kind: ItemKind) => carrying.includes(kind);
  const bear = state.bear;
  // The bear first: it is the only thing here that comes to **you**, and the
  // one job where a moment spent in a menu is the difference.
  if (
    bear !== null &&
    !bear.gone &&
    Math.abs(at - bear.at) <= BEAR_NOTICE &&
    has("spray")
  ) {
    return "spray";
  }
  // The axe at the tree, before anything the motorhome might want: whoever is
  // standing at that tree with an axe in the bag is not there about tyres.
  const tree = route.fellTree;
  if (
    tree !== null &&
    !state.felled &&
    Math.abs(at - tree) <= ANCHOR_REACH &&
    has("axe")
  ) {
    return "axe";
  }
  if (Math.abs(at - state.rv.x) <= ENTER_REACH) {
    if (state.damaged && has("hammer")) {
      return "hammer";
    }
    if (!state.tyres && has("tyres")) {
      return "tyres";
    }
    if (state.fuel < 1 && has("can")) {
      return "can";
    }
  }
  // Only once the rope is actually **on**: that is the moment the remote does
  // anything. Standing at a tree with one in your hand is a picture of
  // somebody about to press a button that is not connected to a winch yet.
  return hooked !== UNHOOKED && has(REMOTE) ? REMOTE : null;
}

/**
 * What is in a person's hand after this frame.
 *
 * @param person - them, as they were
 * @param input - what they are doing
 * @param carrying - the bag as it is now
 * @returns the thing in hand, or null
 * @remarks
 * Picking a thing up does **not** put it in the hand: it goes into the bag and
 * waits to be chosen. Choosing is either a slot straight off the list on screen
 * or the "next one" key, which is what a hand on the keyboard reaches for.
 */
function heldAfter(
  person: Person,
  input: Input,
  carrying: readonly ItemKind[],
): ItemKind | null {
  if (input.pick !== null) {
    return carrying[input.pick] ?? person.holding;
  }
  if (input.cycle && carrying.length > 0) {
    const now = person.holding === null ? -1 : carrying.indexOf(person.holding);
    return carrying[(now + 1) % carrying.length];
  }
  return person.holding;
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
  brake: boolean,
  span: number,
) {
  if (driver >= 0) {
    return driven(state, route, input, gear, brake, span);
  }
  if (hooked !== UNHOOKED) {
    // On the rope the handbrake is off - that is what lets the winch lower it
    // as well as raise it, and nobody is in the cab to be holding a lever.
    return driven(state, route, { ...input, drive: 0 }, NEUTRAL, false, span);
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
  handbrake: boolean,
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
  // A pulled handbrake takes the drive away with it. Braking while the engine
  // is still pulling would leave the two arguing, and on a slope the engine
  // wins the argument at a walking pace - which reads as a handbrake that
  // does nothing, because that is very nearly what it would be.
  const push =
    pedal > 0 && revving && !wrongWay && !handbrake
      ? box.way * box.pull * hold
      : 0;
  const pedalBrake =
    pedal < 0 ? -Math.sign(state.rv.v) * BRAKE_ACCEL * hold : 0;
  const pull = -GRAVITY * Math.sin(angle);
  const otherwise =
    push + pedalBrake + pull + resistance(state.rv.v, push, span);
  const held = handbrakeAt(handbrake, state.rv.v, otherwise, hold);
  const v = state.rv.v + (otherwise + held) * span;

  // A brake stops a vehicle; it does not throw it into reverse. Only while it
  // was already rolling, though: from a standstill the handbrake is holding
  // rather than braking, and it has already said how much of that it can do.
  const braking = pedal < 0 || handbrake;
  const stopped =
    braking && state.rv.v !== 0 && Math.sign(v) !== Math.sign(state.rv.v);
  const speed = throughMud(route, state.rv.x, stopped ? 0 : v);
  return { x: state.rv.x + speed * Math.cos(angle) * span, v: speed };
}

/**
 * The same speed, with the mud taken out of it.
 *
 * @param route - the route being driven
 * @param x - where the motorhome is, in metres
 * @param v - how fast it would be going
 * @returns how fast it actually goes
 * @remarks
 * Mud is not a wall and not a ditch: it lets the motorhome through and keeps
 * the **speed**. A cap rather than a drag, because what it is there to stop is
 * exact - a run-up long enough to carry the vehicle over a climb the rope is
 * meant to win - and a cap is a promise that no approach, however long,
 * arrives at the far side with anything left.
 */
function throughMud(route: Route, x: number, v: number): number {
  if (!route.mud.some((patch) => within(patch, x))) {
    return v;
  }
  return Math.max(-MUD_SPEED, Math.min(MUD_SPEED, v));
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
  felled: boolean,
): number {
  if (inside) {
    return rvX;
  }
  const from = person.inside ? besideTheVehicle(rvX) : person.at;
  // In the air nobody runs: there is nothing to push against, and the one
  // jump that has to be measured stays a fixed distance rather than something
  // that depends on whether a key happened to be held.
  const flying = offTheGround(person, floorUnder(person.at, person.lift, rvX));
  const pace = flying
    ? LEAP_SPEED
    : WALK_SPEED * (input.sprint ? SPRINT_FACTOR : 1);
  const walked = person.inside ? from : from + input.drive * pace * span;
  const held = Math.min(routeLength(route) + GOAL_MARGIN, Math.max(0, walked));
  // Only at ground level. Up on the roof the gap is under the vehicle, not
  // under your boots, and being stopped by it up there would make the one
  // place you are meant to leap from the one place you cannot walk to.
  return flying || person.lift > 0
    ? held
    : shortOfTheChasm(route, felled, person.at, held);
}

/**
 * The same step, stopped at the lip of a chasm.
 *
 * @param route - the route being walked
 * @param felled - whether the tree has been dropped across it
 * @param was - where they were, in metres
 * @param wanted - where the step would take them
 * @returns where they actually get to
 * @remarks
 * On foot you stop at the edge rather than walking off it. Stepping off a
 * cliff is not a thing anybody does on purpose, and a game that let you would
 * spend its time killing people who were looking at the scenery.
 *
 * Only on the ground - in the air the gap is the whole point, and that is
 * what the leap off the roof is for.
 */
function shortOfTheChasm(
  route: Route,
  felled: boolean,
  was: number,
  wanted: number,
): number {
  if (felled) {
    return wanted;
  }
  let stopped = wanted;
  for (const chasm of route.chasms) {
    if (was <= chasm.from && stopped > chasm.from - CHASM_STOP) {
      stopped = chasm.from - CHASM_STOP;
    }
    if (was >= chasm.to && stopped < chasm.to + CHASM_STOP) {
      stopped = chasm.to + CHASM_STOP;
    }
  }
  return stopped;
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
 * @param person - them, as they were
 * @param state - the world as it is
 * @returns whether they are inside afterwards
 * @remarks
 * Only while it **stands**. Nobody steps out of a moving vehicle, and nobody
 * hops into one going past either - a door that worked at speed made the
 * handbrake optional and turned every hill into a place to bail out of.
 *
 * Standing is {@link STOP_SPEED}, the same barely-moving the pedals already
 * use to decide which way they are pushing: one idea of "it stands" for the
 * whole game rather than a second one nobody could keep in step.
 *
 * Getting in also needs them to be at the motorhome; getting out puts them
 * down just behind it.
 */
function throughTheDoor(person: Person, state: GameState): boolean {
  if (Math.abs(state.rv.v) > STOP_SPEED) {
    return person.inside;
  }
  if (person.inside) {
    return false;
  }
  return atVehicle(person, state);
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
export type Job = "mend" | "fit" | "fuel" | "fell" | null;

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
 * Whether the driver could get back in from where they stand.
 *
 * @param person - them
 * @param state - the world as it is
 * @returns true while the door is within reach and the motorhome stands still
 * @remarks
 * The speed matters as much as the distance: the screen offers "get in (E)"
 * off this, and offering it beside a rolling motorhome would be offering a
 * key that does nothing.
 */
export function atVehicle(person: Person, state: GameState): boolean {
  return (
    !person.inside &&
    Math.abs(state.rv.v) <= STOP_SPEED &&
    Math.abs(person.at - state.rv.x) <= ENTER_REACH
  );
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
 * What the handbrake does this frame, in metres per second squared.
 *
 * @param pulled - whether the driver has it pulled
 * @param v - how fast the motorhome is going, in metres per second
 * @param otherwise - everything else pushing on it this frame
 * @param hold - how much grip the tyres have here, from 0 to 1
 * @returns the acceleration it adds, against whatever is happening
 * @remarks
 * Two jobs in one lever, and they are the two halves of friction. **Rolling**,
 * it works against the direction of travel and always at full bite: that is
 * the braking. **Standing**, it works against whatever is trying to move the
 * vehicle - the hill, the engine, anything - up to what it can manage: that is
 * the holding, and it is why the thing can be parked on a slope at all.
 *
 * Both go through the grip, so it holds no better than the tyres do. On a wall
 * steep enough to have no grip left it holds nothing, and the rope stays the
 * only way up - a handbrake that parked anywhere would quietly make the rope
 * optional.
 */
function handbrakeAt(
  pulled: boolean,
  v: number,
  otherwise: number,
  hold: number,
): number {
  if (!pulled) {
    return 0;
  }
  const bite = HANDBRAKE * hold;
  if (v !== 0) {
    return -Math.sign(v) * bite;
  }
  return -Math.sign(otherwise) * Math.min(bite, Math.abs(otherwise));
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
  route: Route,
): boolean {
  return jobAt(person, state, inside, route) !== null;
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
export function withinReach(
  person: Person,
  state: GameState,
  route: Route,
): ItemKind | null {
  if (person.inside) {
    return null;
  }
  const found = route.items.find(
    (item) =>
      Math.abs(person.at - item.at) <= PICKUP_REACH &&
      // Nobody's, not merely not-mine: there is **one** hammer on this map,
      // and two people each holding it would be two hammers.
      !state.people.some((each) => each.carrying.includes(item.kind)),
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
export function jobAt(
  person: Person,
  state: GameState,
  inside: boolean,
  route: Route,
): Job {
  if (inside) {
    return null;
  }
  // The tree first: it is the only job that is not done at the motorhome, and
  // whoever is standing at it with an axe is not there about the motorhome.
  if (fellingHere(person, state, route)) {
    return "fell";
  }
  const atIt = Math.abs(person.at - state.rv.x) <= ENTER_REACH;
  if (!atIt) {
    return null;
  }
  // In the bag is not in the hand. A hammer you have not taken out mends
  // nothing, which is the whole point of having a bag at all.
  if (state.damaged && person.holding === "hammer") {
    return "mend";
  }
  if (person.holding === "tyres" && !state.tyres) {
    return "fit";
  }
  // A full tank takes no more, and offering the job anyway would have somebody
  // stand there holding a key for nothing.
  if (person.holding === "can" && state.fuel < 1) {
    return "fuel";
  }
  return null;
}

/**
 * Whether somebody is standing at the tree with the axe, ready to fell it.
 *
 * @param person - them
 * @param state - the world as it is
 * @param route - the route being driven
 * @returns true while swinging the axe would do something
 * @remarks
 * Once it is down there is nothing left to do there: a tree lying across a
 * chasm is a road, and chopping at a road achieves nothing.
 */
export function fellingHere(
  person: Person,
  state: GameState,
  route: Route,
): boolean {
  const tree = route.fellTree;
  return (
    tree !== null &&
    !state.felled &&
    person.holding === "axe" &&
    Math.abs(person.at - tree) <= ANCHOR_REACH
  );
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
  if (state.rv.x >= route.bear) {
    // Already beyond the post - which only happens by starting a later section
    // there. A bear behind the bumper is somebody else's problem, and pinning
    // the motorhome in place would leave that section unplayable.
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
      person.holding === "spray" &&
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
 * @param taken - whether the fog has had somebody standing still long enough
 * @param fell - whether the bridge has just given way
 * @param plunged - whether the motorhome has just driven into the chasm
 * @returns the phase now
 * @remarks
 * The bear wins over the flag: arriving with somebody under a bear is not
 * arriving. The fog is the same the other way about - it only ever takes
 * anybody while the drive is still running.
 */
function nextPhase(
  phase: Phase,
  home: boolean,
  mauled: boolean,
  taken: boolean,
  fell: boolean,
  plunged: boolean,
): Phase {
  if (phase !== "driving") {
    return phase;
  }
  if (mauled) {
    return "mauled";
  }
  if (taken) {
    return "taken";
  }
  if (fell) {
    return "fallen";
  }
  if (plunged) {
    return "plunged";
  }
  return home ? "arrived" : phase;
}

/**
 * Whether anything has just gone into the chasm.
 *
 * @param route - the route being driven
 * @param felled - whether the tree lies across it
 * @param x - where the motorhome is now, in metres
 * @param people - everybody, as they are now
 * @returns true if the drive ended down there this frame
 * @remarks
 * The motorhome for driving in, and anybody who **lands** in it on foot -
 * which can only happen by jumping, because walking into it is not offered.
 * The game protects nobody from a bad jump: that one is a decision.
 *
 * Once the tree is down the gap is road, and none of it applies any more.
 */
function intoTheChasm(
  route: Route,
  felled: boolean,
  x: number,
  people: readonly Person[],
): boolean {
  if (felled) {
    return false;
  }
  const over = (at: number) => route.chasms.some((chasm) => within(chasm, at));
  return (
    over(x) ||
    people.some(
      (person) => !person.inside && person.lift <= 0 && over(person.at),
    )
  );
}

/**
 * Whether the bridge has just gone through under the motorhome.
 *
 * @param route - the route being driven
 * @param x - where the motorhome is now, in metres
 * @param people - everybody, as they are now
 * @returns true if the timber gave way this frame
 * @remarks
 * The sign at the near end says it: old timber, and not much weight. It
 * carries the motorhome with **one** person in it and no more, so the pair
 * cannot both take the easy way across - one drives, one walks.
 *
 * Counted by who is **aboard**, not by who is on the bridge: somebody walking
 * over beside the motorhome is on their own two feet, and the plank under a
 * pair of boots is not the plank under three tonnes. Alone the question never
 * arises, which is why this asks something of co-op that solo is never asked.
 */
function tooHeavyForTheBridge(
  route: Route,
  x: number,
  people: readonly Person[],
): boolean {
  const aboard = people.filter((person) => person.inside).length;
  return (
    aboard > BRIDGE_LOAD && route.bridges.some((bridge) => within(bridge, x))
  );
}

/**
 * How long nothing has moved inside the fog, after this frame.
 *
 * @param state - the world as it was
 * @param route - the route being driven
 * @param people - where everybody is now
 * @param rvX - where the motorhome is now, in metres
 * @param span - how long the frame lasted
 * @returns the count in seconds, back to zero the moment anything moves
 * @remarks
 * **Anything**: the motorhome or anybody on foot. Two people in the fog are
 * not two chances to stand about - if one of them is walking, the pair of them
 * are moving, and that is the honest reading of "keep going".
 *
 * Outside the fog it stays at zero, so the count never carries over from the
 * clear stretch behind - and inside it, not until {@link FOG_GRACE} metres in,
 * because the section starts in the fog with everybody out of the cab.
 */
function nextStill(
  state: GameState,
  route: Route,
  people: readonly Person[],
  rvX: number,
  span: number,
): number {
  const fog = route.fog;
  if (fog === null) {
    return 0;
  }
  const inFog =
    within(fog, rvX) ||
    people.some((person) => !person.inside && within(fog, person.at));
  if (!inFog) {
    return 0;
  }
  // The first stretch of the grey is free ground. Measured on whoever has got
  // furthest into it, so that parking at the edge and wandering on ahead is
  // not a way of turning the rule off.
  const deepest = Math.max(
    rvX,
    ...people.filter((person) => !person.inside).map((person) => person.at),
  );
  if (deepest < fog.from + FOG_GRACE) {
    return 0;
  }
  const crept = STILL_SPEED * span;
  const rolled = Math.abs(rvX - state.rv.x) > crept;
  // Being off the ground counts as moving. Somebody who has just jumped has
  // plainly moved, whatever the metre count says, and being taken anyway
  // would read as the rule cheating rather than as the rule biting.
  const walked = people.some(
    (person, index) =>
      !person.inside &&
      (offTheGround(person, floorUnder(person.at, person.lift, rvX)) ||
        Math.abs(person.at - state.people[index].at) > crept),
  );
  return rolled || walked ? 0 : state.still + span;
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
