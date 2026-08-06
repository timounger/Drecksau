/**
 * The world of one drive: the route, the vehicle and the winch.
 *
 * @module
 * @remarks
 * Everything here is plain data. The rules that move it live in
 * {@link ./engine} and {@link ./terrain}, and neither knows about a canvas, a
 * clock or React - the same route driven with the same inputs plays out
 * identically every time.
 *
 * Distances are metres, speeds metres per second, times seconds. The route runs
 * from left to right: `x` is how far along it the motorhome stands, `y` how high
 * the ground is there.
 */

/** How far apart the height points of a route stand, in metres. */
export const ROUTE_STEP = 8;

/** How many metres one step of the height scale is worth. */
export const HEIGHT_UNIT = 1.5;

/** Downhill pull, in metres per second squared. */
export const GRAVITY = 9.81;

/** How hard the brake bites on ground with full grip, in m/s^2. */
export const BRAKE_ACCEL = 7;

/**
 * Below this speed the motorhome counts as standing, in metres per second.
 *
 * @remarks
 * The threshold at which the pedal you are on stops being a brake and becomes
 * the accelerator of the other direction - and, for the reverse pedal, the
 * moment reverse is engaged for you.
 */
export const STOP_SPEED = 0.4;

/** The gear the reverse gear is. */
export const REVERSE = -1;

/** The gear that drives nothing: neutral. */
export const NEUTRAL = 0;

/** The highest gear the box has. */
export const TOP_GEAR = 5;

/**
 * The gearbox: reverse, neutral and five forward gears.
 *
 * @remarks
 * The trade is the one every gearbox makes: a low gear pulls hard and runs out
 * of breath early, a high gear pulls feebly and runs on. That is what makes the
 * choice of gear a decision rather than a formality - fifth is useless on a
 * climb, first is useless on the flat.
 *
 * `way` is which direction the gear drives in, so reverse needs no special case
 * anywhere else. Neutral pulls nothing at all: gravity has the vehicle to
 * itself, which on a slope is exactly as alarming as it sounds.
 */
export const GEARS = [
  { label: "R", pull: 5.2, top: 4.5, way: -1 },
  { label: "N", pull: 0, top: 0, way: 0 },
  { label: "1", pull: 7.2, top: 4.5, way: 1 },
  { label: "2", pull: 5.2, top: 7.5, way: 1 },
  { label: "3", pull: 3.8, top: 10.5, way: 1 },
  { label: "4", pull: 2.8, top: 13.5, way: 1 },
  { label: "5", pull: 2, top: 16.5, way: 1 },
] as const;

/** What one gear does. */
export type GearData = (typeof GEARS)[number];

/**
 * The gearbox entry of a gear.
 *
 * @param gear - -1 for reverse, 0 for neutral, 1 to 5 for the forward gears
 * @returns what that gear pulls and how fast it runs
 */
export function gearAt(gear: number): GearData {
  const index = Math.min(TOP_GEAR, Math.max(REVERSE, Math.round(gear)));
  return GEARS[index - REVERSE];
}

/** How hard rolling to a stop is when nothing is pressed, in m/s^2. */
export const ROLL_FRICTION = 1.4;

/**
 * Air resistance.
 *
 * @remarks
 * Small on purpose. With a gearbox the top speed is the **gear's** business,
 * so the air must not be the thing that decides it - too much drag and fifth
 * would run no faster than second, which would make the whole box pointless.
 */
export const DRAG = 0.08;

/** Up to this slope the tyres hold everything the engine gives. */
export const FULL_GRIP_SLOPE = 0.22;

/** From this slope on the wheels only spin - here the winch takes over. */
export const NO_GRIP_SLOPE = 0.55;

/** How far the rope reaches, in metres. */
export const WINCH_RANGE = 46;

/** How short the rope can be wound before the hook has to come off. */
export const WINCH_MIN = 5;

/** How fast the rope winds in, in metres per second. */
export const WINCH_SPEED = 4;

/**
 * Share of a full tank the engine burns per second while it pulls.
 *
 * @remarks
 * Sized against the map rather than guessed: driving the whole route takes
 * about 143 seconds of engine and 16 of winch, so a full tank is a little over
 * twice what the drive needs. The gauge visibly falls - roughly half a tank
 * from the plateau to the flag - without anybody being stranded for taking the
 * scenic route.
 *
 * Idling costs nothing. It is the pulling that drinks.
 */
export const FUEL_BURN = 0.003;

/**
 * Share of a full tank the winch eats per second while winding.
 *
 * @remarks
 * Twice what driving costs: hauling three tonnes up a wall on a steel rope is
 * the hardest thing this engine ever does.
 */
export const WINCH_BURN = 0.006;

/** Kilometres per hour in one metre per second. */
export const KMH_PER_MS = 3.6;

/** Longest span a single step may cover, in seconds.
 * A tab that was in the background comes back with one huge frame; without
 * this cap the motorhome would be teleported through half a mountain. */
export const MAX_STEP = 0.03;

/** How fast the driver walks once out of the cab, in metres per second. */
export const WALK_SPEED = 4;

/**
 * How much faster a sprint is than a walk.
 *
 * @remarks
 * Absurdly fast on purpose - this is a **debugging aid** at the moment, so that
 * a long map can be crossed on foot in seconds while it is being built. Turn it
 * down to something human (about two) when the map stops changing; nothing else
 * depends on the number.
 */
export const SPRINT_FACTOR = 10;

/** How far behind the motorhome the driver lands when getting out, in metres.
 * Enough to stand clear of it - the vehicle is over seven metres long. */
export const EXIT_GAP = 5.5;

/**
 * How close to the motorhome you have to stand to get back in, in metres.
 *
 * @remarks
 * Deliberately more than {@link EXIT_GAP}: where you can get out, you can get
 * back in. Anything else means stepping out of your own vehicle and finding the
 * door already out of reach.
 */
export const ENTER_REACH = 6;

/** How close to a tree you have to stand to put the rope on it, in metres. */
export const ANCHOR_REACH = 3;

/**
 * How close to a thing you have to walk to pick it up, in metres.
 *
 * @remarks
 * Wider than a tree's reach on purpose. A rope goes on a **particular** tree,
 * so being exact there is the point; a hammer lying in the road is not a
 * precision task, and three metres on a screen this wide is about thirty
 * pixels - close enough to walk straight past something you are standing on.
 */
export const PICKUP_REACH = 5;

/**
 * How much more slope the off-road tyres hold.
 *
 * @remarks
 * Twice as much, which turns the one wall on the map that has no tree beside it
 * from impossible into first-gear work. That wall is the reason the tyres exist:
 * no anchor, no rope, no way up - until they are on.
 */
export const TYRE_FACTOR = 2;

/**
 * How close a bear lets anybody come, in metres.
 *
 * @remarks
 * It blocks the way as surely as a wall - nobody edges past a bear - and it is
 * also the distance at which it has you: closer than this and
 * {@link MAUL_SECONDS} starts counting.
 */
export const BEAR_REACH = 6;

/**
 * How far off a resting bear notices somebody on foot, in metres.
 *
 * @remarks
 * Generous, because a bear you can creep up on is scenery. From here on it is
 * coming, and the only two answers are the spray or the door of the cab.
 */
export const BEAR_NOTICE = 30;

/**
 * How fast a bear comes at you, in metres per second.
 *
 * @remarks
 * A little slower than a walk ({@link WALK_SPEED}), so backing off works - but
 * only just, and only for as long as there is somewhere to back off to. Faster
 * than that and the spray would not be a choice but the only move.
 */
export const BEAR_SPEED = 3.2;

/**
 * How far a bear will follow somebody from its own spot, in metres.
 *
 * @remarks
 * It is guarding a place, not hunting across the map. The leash keeps the
 * animal near the stretch of road it closes, so what you see and what blocks
 * the way are never far apart - and so that luring it aside is not a way past.
 */
export const BEAR_LEASH = 24;

/**
 * How long a bear needs at arm's length before it has you, in seconds.
 *
 * @remarks
 * The one thing on this map that kills. Long enough to notice and run, short
 * enough that standing there thinking about it is the wrong answer.
 */
export const MAUL_SECONDS = 4;

/**
 * How far the spray carries, in metres.
 *
 * @remarks
 * Further than the bear's own reach, which is the whole point: you can start
 * spraying before it is on you. It still closes while you spray, so the can is
 * a nerve test rather than a button.
 */
export const SPRAY_REACH = 10;

/**
 * How long the spray has to be held on a bear before it turns and goes.
 *
 * @remarks
 * Held, not tapped - the same bargain as mending. Let go and it starts over,
 * which is what makes the closing distance matter.
 */
export const SPRAY_SECONDS = 2;

/**
 * How long a job at the motorhome takes, in seconds - mending or fitting.
 *
 * @remarks
 * Long enough to be a job rather than a keypress: you stand there, you hold it,
 * and the motorhome is worth the wait. Short enough that a wrong turn into the
 * ditch is not the end of the evening.
 */
export const REPAIR_SECONDS = 3;

/**
 * Where the snow begins, in metres above the valley floor.
 *
 * @remarks
 * A property of the world rather than of a drawing, so both views agree on it
 * without being told twice: the plateau the drive starts on is white, the high
 * passes are white, and the valleys in between are not. Between
 * {@link SNOW_FROM} and {@link SNOW_FULL} the ground fades from grass to snow,
 * because a hard line at one height looks painted on.
 */
export const SNOW_FROM = 14;
export const SNOW_FULL = 18;

/** How far past the last height point the goal flag stands, in metres. */
export const GOAL_MARGIN = 4;

/** Where a drive currently is. */
export type Phase = "driving" | "arrived" | "mauled";

/**
 * A stretch of ground that wrecks a motorhome driven into it.
 *
 * @remarks
 * The ditch. Driving in breaks the vehicle; being **on the rope** while
 * crossing it does not - a controlled pull is not a fall, and the difference is
 * the whole reason to think before driving at a hole.
 */
export type Pit = {
  /** Where it begins, in metres. */
  readonly from: number;
  /** Where it ends, in metres. */
  readonly to: number;
};

/** The things that lie about on the route waiting to be picked up. */
export type ItemKind = "hammer" | "tyres" | "spray";

/** One of them, where it lies. */
export type Item = {
  readonly at: number;
  readonly kind: ItemKind;
};

/** One anchor point the rope can be hooked to. */
export type Anchor = {
  /** Where it stands along the route, in metres. */
  readonly x: number;
  /** How high the ground is under it, in metres. */
  readonly y: number;
};

/** One route, from the start to the goal flag. */
export type Route = {
  /** Shown to the player. */
  readonly name: string;
  /** Ground height every {@link ROUTE_STEP} metres, in metres. */
  readonly heights: readonly number[];
  /** The trees and rocks the rope can be hooked to, left to right. */
  readonly anchors: readonly Anchor[];
  /** The stretches of ground that wreck a vehicle driven into them. */
  readonly pits: readonly Pit[];
  /** What lies about on the route, left to right. */
  readonly items: readonly Item[];
  /** Where the bear starts out, in metres, or null if the map has none. */
  readonly bear: number | null;
  /**
   * Where the sections stand, in metres, left to right.
   *
   * @remarks
   * Part of the map rather than a list kept beside it, so whoever draws the
   * world can put a flag on each one without having to be told where they are.
   */
  readonly sections: readonly number[];
};

/** The motorhome itself. */
export type Rv = {
  /** How far along the route it stands, in metres. */
  readonly x: number;
  /** How fast it moves along the ground; negative rolls back. */
  readonly v: number;
};

/**
 * One person: the driver, or in co-op the other one as well.
 *
 * @remarks
 * There is one motorhome and up to two people, and everything that is
 * **theirs** lives here: where they stand, whether they are aboard, what they
 * are carrying. What belongs to the vehicle - the gear, the rope, the damage -
 * stays in the state around them, because there is only one of it.
 */
/**
 * A bear, as the drive finds it.
 *
 * @remarks
 * It rests where the map put it until somebody on foot comes inside
 * {@link BEAR_NOTICE}, then it comes for them at {@link BEAR_SPEED}. Holding
 * the spray on it for {@link SPRAY_SECONDS} sends it off for good; letting it
 * stand over you for {@link MAUL_SECONDS} ends the drive.
 */
export type Bear = {
  /** Where it is now, in metres. */
  readonly at: number;
  /** How long it has had somebody within {@link BEAR_REACH}, in seconds. */
  readonly hold: number;
  /** How much spray it has taken without a break, in seconds. */
  readonly sprayed: number;
  /** True once it has been driven off for good. */
  readonly gone: boolean;
};

export type Person = {
  /** Where they are, in metres; the same as the motorhome while aboard. */
  readonly at: number;
  /** True while sitting in the cab, driving or riding along. */
  readonly inside: boolean;
  /** Which way they face: 1 to the right, -1 to the left. */
  readonly facing: number;
  /** How far they have walked in total, in metres - the legs are drawn from it. */
  readonly stride: number;
  /** True while actually walking, not just standing outside. */
  readonly walking: boolean;
  /** What they carry; picked-up things are never put down. */
  readonly carrying: readonly ItemKind[];
};

/** Everything one drive consists of. */
export type GameState = {
  readonly rv: Rv;
  /** The anchor the rope is on, or -1 while the rope is free. */
  readonly hooked: number;
  /** How much rope is out, in metres; meaningless while unhooked. */
  readonly rope: number;
  /** What is left in the tank, from 0 to 1. */
  readonly fuel: number;
  readonly phase: Phase;
  /** How long this drive has been going, in seconds. */
  readonly time: number;
  /** The furthest the motorhome has been, in metres - it never falls back. */
  readonly reached: number;
  /**
   * Everybody on this drive: one alone, two in co-op.
   *
   * @remarks
   * The order is fixed for the whole drive - person zero is the host's, person
   * one the guest's - so an index is a stable way to say "you".
   */
  readonly people: readonly Person[];
  /**
   * The bear, as it is right now - or null on a map that has none.
   *
   * @remarks
   * Where it **starts** is a property of the map; where it is, whether it has
   * somebody, and how much spray it has taken belong to the drive.
   */
  readonly bear: Bear | null;
  /**
   * Which of them is at the wheel, or -1 while nobody is.
   *
   * @remarks
   * Whoever got in **first** drives; anybody else aboard is a passenger and the
   * pedals do not answer to them. When the driver climbs out, a passenger left
   * aboard takes over - somebody has to be able to move the thing.
   */
  readonly driver: number;
  /** Which gear is engaged: -1 reverse, 0 neutral, 1 to 5 forward. */
  readonly gear: number;
  /** True once the motorhome has been driven into a ditch: it will not drive. */
  readonly damaged: boolean;
  /** True once the off-road tyres are fitted to the motorhome. */
  readonly tyres: boolean;
  /** How many seconds of hammering are done, from 0 to {@link REPAIR_SECONDS}. */
  readonly repair: number;
  /**
   * The last section the motorhome was at.
   *
   * @remarks
   * Set by driving past one **and** by jumping to one with the buttons - it is
   * "where I was", not "how far I got", because that is what a player expects
   * to find when they come back tomorrow.
   */
  readonly section: number;
};

/** What the player is doing right now. */
export type Input = {
  /**
   * In the cab: 1 is forwards, -1 is backwards. On foot: which way to walk.
   *
   * @remarks
   * Two pedals, and each one brakes before it drives: press backwards while
   * still rolling forwards and you slow down first, exactly as a car does. Once
   * stopped, the **reverse gear engages by itself** - it is the one gear nobody
   * wants to hunt for. The forward gears stay yours to choose.
   */
  readonly drive: number;
  /**
   * The remote control: 1 reels the rope in, -1 pays it out, 0 does nothing.
   *
   * @remarks
   * Only works on foot. With the rope on a tree the vehicle is worked from
   * **outside**, remote in hand - which is also the only place from which you
   * can see what the rope is doing.
   */
  readonly wind: number;
  /** True in the frame the hook key was pressed. */
  readonly hook: boolean;
  /**
   * True in the frame the pick-up key was pressed.
   *
   * @remarks
   * Its own key rather than a second meaning for the rope: two jobs on one
   * button need a rule for which one wins, and a rule like that is something
   * the player has to learn instead of simply pressing.
   */
  readonly take: boolean;
  /** True in the frame the door key was pressed. */
  readonly door: boolean;
  /** True while the driver is running rather than walking; only on foot. */
  readonly sprint: boolean;
  /** True while the rope-and-hammer key is **held**, not merely pressed. */
  readonly work: boolean;
  /**
   * The gear to engage this frame, or null to leave the box alone.
   *
   * @remarks
   * Only from the cab. Nobody shifts gear standing at a tree forty metres away.
   */
  readonly shift: number | null;
};

/** Hands off the wheel. */
export const IDLE_INPUT: Input = {
  drive: 0,
  wind: 0,
  hook: false,
  take: false,
  work: false,
  door: false,
  sprint: false,
  shift: null,
};
