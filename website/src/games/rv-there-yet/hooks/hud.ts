/**
 * The heads-up facts the screen shows around the canvas.
 *
 * @module
 * @remarks
 * Shared by the solo game and the online co-op so both show the same things in
 * the same words. Everything here is read from **one player's** point of view:
 * two people on one drive stand in different places, carry different things and
 * are offered different jobs, so "am I at the door" is a question that only has
 * an answer once you say who "I" is.
 */
import {
  atTheLadder,
  atVehicle,
  canMend,
  jobAt,
  withinReach,
  type Job,
} from "@/games/rv-there-yet/engine/engine";
import { SECTION_COUNT } from "@/games/rv-there-yet/engine/map";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";
import { theMap } from "@/games/rv-there-yet/engine/setup";
import { slopeAt } from "@/games/rv-there-yet/engine/terrain";
import {
  BEAR_NOTICE,
  ROOF_HIGH,
  gearAt,
  MAUL_SECONDS,
  REPAIR_SECONDS,
  STILL_SECONDS,
  SPRAY_REACH,
  SPRAY_SECONDS,
  type GameState,
  type ItemKind,
  type Person,
  type Phase,
  type Route,
} from "@/games/rv-there-yet/engine/types";

/** How far before a bridge its warning goes up, in metres. */
const BRIDGE_WARN = 40;

/** Turning a share into whole percent, for comparing and showing. */
const PERCENT = 100;

/** The facts the screen shows around the canvas. */
export type Hud = {
  readonly phase: Phase;
  /** Which section was last reached, counted from zero. */
  readonly section: number;
  /** How many sections the map has. */
  readonly sections: number;
  /** What the section being driven is called. */
  readonly sectionName: string;
  /** What is left in the tank, from 0 to 1. */
  readonly fuel: number;
  /** How long this drive has taken, in seconds. */
  readonly time: number;
  /** The slope under the wheels, in metres per metre. */
  readonly slope: number;
  /** True while the rope is on a hook. */
  readonly hooked: boolean;
  /** True while this player stands at a tree and could put the rope on it. */
  readonly ready: boolean;
  /** True while a tree ahead is worth walking the rope to. */
  readonly candidate: boolean;
  /** True while this player sits in the cab. */
  readonly inside: boolean;
  /** True while this player is the one at the wheel. */
  readonly driving: boolean;
  /** True while somebody else is at the wheel and this player is a passenger. */
  readonly passenger: boolean;
  /** True while the motorhome is wrecked and will not drive. */
  readonly damaged: boolean;
  /** Everything in this player's bag, in the order they picked it up. */
  readonly carrying: readonly ItemKind[];
  /** What is in their hand out of the bag, or null. */
  readonly holding: ItemKind | null;
  /** What lies within reach and could be picked up, or null. */
  readonly pickUp: ItemKind | null;
  /** How the bear stands to this player, or null while none is about. */
  readonly bear: BearView | null;
  /** True once the off-road tyres are on. */
  readonly tyres: boolean;
  /** What holding the key at the motorhome would do, if anything. */
  readonly job: Job;
  /** How far the mending has got, from 0 to 1. */
  readonly repair: number;
  /** True while standing at the motorhome with the hammer, ready to mend. */
  readonly canMend: boolean;
  /** True while this player stands beside the motorhome and could get in. */
  readonly atDoor: boolean;
  /** Which gear is in: -1 reverse, 0 neutral, 1 to 5 forward. */
  readonly gear: number;
  /** How fast it is going, in metres per second; negative rolls backwards. */
  readonly speed: number;
  /** What that gear is called on the lever: "R", "N", "1" to "5". */
  readonly gearLabel: string;
  /** True once the player has started. */
  readonly running: boolean;
  /** True while the handbrake is pulled. */
  readonly brake: boolean;
  /** True while the motorhome is on or coming up to a bridge. */
  readonly bridge: boolean;
  /** True while the motorhome is in the mud. */
  readonly mud: boolean;
  /** True while a chasm is close ahead and still open. */
  readonly chasm: boolean;
  /** True while this player stands at the ladder and could climb it. */
  readonly ladder: boolean;
  /** True while this player is up on the roof. */
  readonly roof: boolean;
  /** True once the tree lies across the chasm. */
  readonly felled: boolean;
  /** How many people are sitting in the motorhome. */
  readonly aboard: number;
  /** How far the standing-still count in the fog has got, from 0 to 1. */
  readonly still: number;
};

/** How the bear stands to one player. */
export type BearView = {
  /** True while it has noticed somebody and is on its way. */
  readonly coming: boolean;
  /** True while this player is close enough for the spray to reach it. */
  readonly canSpray: boolean;
  /** True while this player has the can **in hand**. */
  readonly armed: boolean;
  /** True while the can is in their bag, held or not. */
  readonly inBag: boolean;
  /** How far the spraying has got, from 0 to 1. */
  readonly sprayed: number;
  /** How far it has got with whoever it has hold of, from 0 to 1. */
  readonly danger: number;
};

/** What {@link hudOf} needs to know beyond the world itself. */
export type HudView = {
  /** The anchor within reach, or -1. */
  readonly ready: number;
  /** The anchor worth walking to, or -1. */
  readonly candidate: number;
  /** True once the drive has begun. */
  readonly running: boolean;
  /** Which person this screen belongs to. */
  readonly me: number;
};

/**
 * Reads the heads-up facts out of a state, from one player's seat.
 *
 * @param state - the world as it is
 * @param view - who is looking and what their rope is near
 * @returns the facts to show
 */
export function hudOf(state: GameState, view: HudView): Hud {
  const route = theMap();
  const person = state.people[view.me] ?? state.people[0];
  return {
    phase: state.phase,
    section: state.section,
    sections: SECTION_COUNT,
    sectionName: RV_TEXTS.sectionNames[state.section] ?? "",
    fuel: state.fuel,
    time: state.time,
    slope: slopeAt(route, state.rv.x),
    hooked: state.hooked >= 0,
    ready: view.ready >= 0,
    candidate: view.candidate >= 0,
    inside: person.inside,
    driving: state.driver === view.me,
    passenger: person.inside && state.driver !== view.me,
    atDoor: atVehicle(person, state),
    gear: state.gear,
    gearLabel: gearAt(state.gear).label,
    damaged: state.damaged,
    carrying: person.carrying,
    holding: person.holding,
    pickUp: withinReach(person, state, route),
    bear: bearView(state, person),
    tyres: state.tyres,
    job: jobAt(person, state, person.inside, route),
    repair: Math.min(1, state.repair / REPAIR_SECONDS),
    canMend: canMend(person, state, person.inside, route),
    speed: state.rv.v,
    running: view.running,
    brake: state.brake,
    bridge: nearBridge(state, route),
    mud: route.mud.some(
      (patch) => state.rv.x >= patch.from && state.rv.x <= patch.to,
    ),
    chasm: nearChasm(state, route, person),
    ladder:
      !person.inside && person.lift <= 0 && atTheLadder(person.at, state.rv.x),
    roof: !person.inside && person.lift >= ROOF_HIGH,
    felled: state.felled,
    aboard: state.people.filter((each) => each.inside).length,
    still: Math.min(1, state.still / STILL_SECONDS),
  };
}

/**
 * Whether a bridge is close enough ahead to be worth warning about.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @returns true while the sign would be in sight, and while on the bridge
 * @remarks
 * From about the sign onwards, so the warning and the sign arrive together -
 * a line that only appeared once the wheels were on the timber would be a
 * report rather than a warning.
 */
function nearBridge(state: GameState, route: Route): boolean {
  return route.bridges.some(
    (bridge) =>
      state.rv.x >= bridge.from - BRIDGE_WARN && state.rv.x <= bridge.to,
  );
}

/**
 * Whether the chasm is close enough to be the thing on the screen.
 *
 * @param state - the world as it is
 * @param route - the route being driven
 * @param person - whose screen this is
 * @returns true while the gap still has to be dealt with
 * @remarks
 * From either the vehicle or the player: whoever is over there fetching the
 * axe is a long way from the motorhome, and the line has to keep talking to
 * them.
 */
function nearChasm(state: GameState, route: Route, person: Person): boolean {
  const near = (at: number) =>
    route.chasms.some(
      (chasm) => at > chasm.from - BRIDGE_WARN && at < chasm.to + BRIDGE_WARN,
    );
  return near(state.rv.x) || (!person.inside && near(person.at));
}

/**
 * How the bear stands to one player, or null when none is about any more.
 *
 * @param state - the world as it is
 * @param person - whose screen this is
 * @returns what the screen needs to say about the bear
 */
function bearView(state: GameState, person: Person): BearView | null {
  const bear = state.bear;
  if (bear === null || bear.gone) {
    return null;
  }
  const gap = Math.abs(person.at - bear.at);
  return {
    coming: !person.inside && gap <= BEAR_NOTICE,
    canSpray: !person.inside && gap <= SPRAY_REACH,
    // In the bag is not in the hand: a can you have not taken out sprays
    // nothing, and the line on screen has to be able to say so.
    armed: person.holding === "spray",
    inBag: person.carrying.includes("spray"),
    sprayed: Math.min(1, bear.sprayed / SPRAY_SECONDS),
    danger: Math.min(1, bear.hold / MAUL_SECONDS),
  };
}

/**
 * Whether two heads-up snapshots would look the same on screen.
 *
 * @param a - one of them
 * @param b - the other
 * @returns true when redrawing would change nothing
 * @remarks
 * The point of this is to keep React out of the animation loop: the world moves
 * sixty times a second, the numbers on screen do not, and only a change worth
 * seeing is worth a re-render. That is why the continuous values are compared
 * rounded - to whole seconds, whole metres, whole percent.
 */
export function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.phase === b.phase &&
    a.section === b.section &&
    a.sectionName === b.sectionName &&
    Math.round(a.speed) === Math.round(b.speed) &&
    a.hooked === b.hooked &&
    a.ready === b.ready &&
    a.candidate === b.candidate &&
    a.inside === b.inside &&
    a.driving === b.driving &&
    a.passenger === b.passenger &&
    a.atDoor === b.atDoor &&
    a.gear === b.gear &&
    a.damaged === b.damaged &&
    a.tyres === b.tyres &&
    a.job === b.job &&
    a.carrying.length === b.carrying.length &&
    a.holding === b.holding &&
    a.pickUp === b.pickUp &&
    a.bear?.coming === b.bear?.coming &&
    a.bear?.canSpray === b.bear?.canSpray &&
    Math.round((a.bear?.sprayed ?? 0) * PERCENT) ===
      Math.round((b.bear?.sprayed ?? 0) * PERCENT) &&
    Math.round((a.bear?.danger ?? 0) * PERCENT) ===
      Math.round((b.bear?.danger ?? 0) * PERCENT) &&
    a.canMend === b.canMend &&
    Math.round(a.repair * PERCENT) === Math.round(b.repair * PERCENT) &&
    a.running === b.running &&
    a.brake === b.brake &&
    a.bridge === b.bridge &&
    a.mud === b.mud &&
    a.chasm === b.chasm &&
    a.ladder === b.ladder &&
    a.roof === b.roof &&
    a.felled === b.felled &&
    a.aboard === b.aboard &&
    Math.round(a.still * PERCENT) === Math.round(b.still * PERCENT) &&
    Math.round(a.time) === Math.round(b.time) &&
    Math.round(a.fuel * PERCENT) === Math.round(b.fuel * PERCENT) &&
    Math.round(a.slope * PERCENT) === Math.round(b.slope * PERCENT)
  );
}
