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
  type Job,
} from "@/games/rv-there-yet/engine/engine";
import { CHECKPOINT_COUNT } from "@/games/rv-there-yet/engine/map";
import { theMap } from "@/games/rv-there-yet/engine/setup";
import { routeLength, slopeAt } from "@/games/rv-there-yet/engine/terrain";
import {
  gearAt,
  REPAIR_SECONDS,
  type GameState,
  type Phase,
} from "@/games/rv-there-yet/engine/types";

/** Turning a share into whole percent, for comparing and showing. */
const PERCENT = 100;

/** The facts the screen shows around the canvas. */
export type Hud = {
  readonly phase: Phase;
  /** Which checkpoint was last reached, counted from zero. */
  readonly checkpoint: number;
  /** How many checkpoints the map has. */
  readonly checkpoints: number;
  /** How far along, in whole metres. */
  readonly done: number;
  /** How long the route is, in whole metres. */
  readonly total: number;
  /** What is left of the battery, from 0 to 1. */
  readonly battery: number;
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
    checkpoint: state.checkpoint,
    checkpoints: CHECKPOINT_COUNT,
    done: Math.round(state.rv.x),
    total: Math.round(routeLength(route)),
    battery: state.battery,
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
    tyres: state.tyres,
    job: jobAt(person, state, person.inside),
    repair: Math.min(1, state.repair / REPAIR_SECONDS),
    canMend: canMend(person, state, person.inside),
    speed: state.rv.v,
    running: view.running,
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
    a.checkpoint === b.checkpoint &&
    a.done === b.done &&
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
    a.canMend === b.canMend &&
    Math.round(a.repair * PERCENT) === Math.round(b.repair * PERCENT) &&
    a.running === b.running &&
    Math.round(a.time) === Math.round(b.time) &&
    Math.round(a.battery * PERCENT) === Math.round(b.battery * PERCENT) &&
    Math.round(a.slope * PERCENT) === Math.round(b.slope * PERCENT)
  );
}
