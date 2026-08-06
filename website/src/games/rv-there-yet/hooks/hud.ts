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
  atVehicle,
  canMend,
  jobAt,
  withinReach,
  type Job,
} from "@/games/rv-there-yet/engine/engine";
import { SECTION_COUNT } from "@/games/rv-there-yet/engine/map";
import { theMap } from "@/games/rv-there-yet/engine/setup";
import { slopeAt } from "@/games/rv-there-yet/engine/terrain";
import {
  BEAR_NOTICE,
  gearAt,
  KMH_PER_MS,
  MAUL_SECONDS,
  REPAIR_SECONDS,
  SPRAY_REACH,
  SPRAY_SECONDS,
  type GameState,
  type ItemKind,
  type Person,
  type Phase,
} from "@/games/rv-there-yet/engine/types";

/** Turning a share into whole percent, for comparing and showing. */
const PERCENT = 100;

/** The facts the screen shows around the canvas. */
export type Hud = {
  readonly phase: Phase;
  /** Which section was last reached, counted from zero. */
  readonly section: number;
  /** How many sections the map has. */
  readonly sections: number;
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
  /** What this player is carrying. */
  readonly carrying: readonly string[];
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
  /** How fast it is going in whole km/h, whichever way it rolls. */
  readonly speedKmh: number;
  /** What that gear is called on the lever: "R", "N", "1" to "5". */
  readonly gearLabel: string;
  /** True once the player has started. */
  readonly running: boolean;
};

/** How the bear stands to one player. */
export type BearView = {
  /** True while it has noticed somebody and is on its way. */
  readonly coming: boolean;
  /** True while this player is close enough for the spray to reach it. */
  readonly canSpray: boolean;
  /** True while this player is carrying the can. */
  readonly armed: boolean;
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
    pickUp: withinReach(person, route),
    bear: bearView(state, person),
    tyres: state.tyres,
    job: jobAt(person, state, person.inside),
    repair: Math.min(1, state.repair / REPAIR_SECONDS),
    canMend: canMend(person, state, person.inside),
    speed: state.rv.v,
    speedKmh: Math.round(Math.abs(state.rv.v) * KMH_PER_MS),
    running: view.running,
  };
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
    armed: person.carrying.includes("spray"),
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
    a.speedKmh === b.speedKmh &&
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
    Math.round(a.time) === Math.round(b.time) &&
    Math.round(a.fuel * PERCENT) === Math.round(b.fuel * PERCENT) &&
    Math.round(a.slope * PERCENT) === Math.round(b.slope * PERCENT)
  );
}
