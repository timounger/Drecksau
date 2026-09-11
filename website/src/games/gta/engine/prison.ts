/**
 * The jail: the plan of it, and everything that happens inside.
 *
 * @module
 * @remarks
 * A second little world beside the city, and deliberately not a part of it.
 * Nothing in here has a car, a wanted level or a district; nothing in the city
 * has a cell door. What passes between the two is one answer - whether the
 * player got out - which is why this module knows nothing about the city state
 * and hands its result back as a {@link PrisonTurn}.
 *
 * The plan is fixed, like the city. An escape is a route learned by heart: the
 * bench in the yard, the pan in the corner of your own cell, the passage
 * behind the wall, the window of the sick bay, the cable over the wall. A jail
 * that reshuffled itself between attempts would be a maze, and a maze is
 * solved once and never again.
 */
import {
  CABLE_PACE,
  CATCHES,
  RUN_WALK,
  GRACE_SECONDS,
  MATE_COUNT,
  MAX_STEP,
  REACH,
  SLAB,
  TOWER_RANGE,
  TRAIL_GAP,
  TRAIL_STEPS,
  WALK_SPEED,
  WARDER_SPEED,
  WARDER_TURN,
  WATCH_RANGE,
  WATCH_WIDE,
  type Input,
  type Inmate,
  type PrisonStage,
  type PrisonState,
  type Slab,
  type Vec,
  type Warder,
} from "./types";

/**
 * The jail, one letter per square.
 *
 * @remarks
 * North is up. The yard is the top half, the cell block the middle, and the
 * outer wall the line across the bottom - everything under it is the world
 * outside. The one cell that matters is the western one: the pan in its
 * south-west corner (`w`) sits over the loose stones (`X`), and behind those
 * runs the passage (`~`) to the sick bay (`I`) in the south-east.
 */
export const PLAN: readonly string[] = [
  "########################################",
  "#YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#",
  "#YYYYbbbYYYYYYYYYYYYYYYYYYbbbYYYYYYYYYY#",
  "#YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#",
  "#YYYYYYYYYYYYbbbYYYYYYYYYYYYYYYYYYYYYYY#",
  "#YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#",
  "#YYYYYYYYYYYYYYYYYYYbbbYYYYYYYYYYYYYYYY#",
  "#YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#",
  "##################....##################",
  "#......................................#",
  "#......................................#",
  "#||+|||#||+|||#||+|||#||+|||#||+|||#.###",
  "#Mccccc#WccccM#WccccM#WccccM#WccccM#...#",
  "#cccccc#cccccc#cccccc#cccccc#cccccc#...#",
  "#cwcccc#cccccc#cccccc#cccccc#cccccc#...#",
  "##X#####################################",
  "#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###",
  "####################################~###",
  "############################IIIIIIIIIII#",
  "############################IIIIIIIIIII#",
  "############################IIIIIIIIIII#",
  "#################################O######",
  "#YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY=YYYYY#",
  "#################################=##TT##",
  "ooooooooooooooooooooooooooooooooo=oooooo",
  "oooooooooooooooooooooooooooooooooooooooo",
  "oooooooooooooooooooooooooooooooooooooooo",
  "oooooooooooooooooooooooooooooooooooooooo",
];

/** How many squares across the plan is. */
export const PLAN_WIDE = PLAN[0].length;

/** How many squares down. */
export const PLAN_HIGH = PLAN.length;

/** What each letter of the plan stands for. */
const LEGEND: Readonly<Record<string, Slab>> = {
  "#": "wall",
  ".": "floor",
  c: "cell",
  "|": "bars",
  "+": "gate",
  Y: "yard",
  b: "bench",
  W: "loo",
  w: "myLoo",
  M: "bunk",
  X: "stones",
  "~": "tunnel",
  I: "ward",
  O: "window",
  "=": "cable",
  T: "tower",
  o: "free",
};

/** The ladder of the escape, in the order it is climbed. */
const LADDER: readonly PrisonStage[] = [
  "screw",
  "loo",
  "stones",
  "tunnel",
  "window",
  "cable",
  "out",
];

/** How long each job takes with the mouse held down, in seconds. */
const WORK_SECONDS: Readonly<Record<string, number>> = {
  screw: 2.6,
  loo: 3.2,
  stones: 4.5,
  window: 2,
};

/** What the bar under the picture says, one line per rung of the ladder. */
const TASKS: Readonly<Record<PrisonStage, string>> = {
  screw: "Im Hof: an einer Bank die Schraube abdrehen - Maus halten.",
  loo: "In deiner Zelle: die Kloschüssel abschrauben - Maus halten.",
  stones: "Die Steine um den Abfluss lösen - Maus halten.",
  tunnel: "Durch die Wand und den Gang entlang.",
  window: "Krankenstation: Fenster auf und Kabel greifen - Maus halten.",
  cable: "Am Kabel über die Mauer hangeln.",
  out: "Draußen.",
};

/** What the ticker says when a job is done. */
const DONE_LINES: Readonly<Record<string, string>> = {
  screw: "Schraube ab. Die steckst du ein.",
  loo: "Die Schüssel ist ab. Darunter: Steine.",
  stones: "Die Steine sind lose - die Wand ist offen. Ein paar kommen mit.",
  window: "Fenster auf. Das Kabel hält.",
};

/** How wide the player is, from the middle, in jail pixels. */
const HALF_BODY = 9;

/** How far apart two points of a sight line are checked, in jail pixels. */
const SIGHT_STEP = SLAB / 2;

/** How many points of the trail lie between one follower and the next. */
const MATE_GAP = 3;

/** The middle of a square, as a share of its width. */
const MIDDLE = 0.5;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers below are
   places on the plan above: which square a bench is on, where a warder turns
   round. They are a map, not arithmetic. */

/** Where the player wakes up: the western cell. */
const CELL_HOME: Vec = { x: 4.5 * SLAB, y: 13.5 * SLAB };

/** The rounds the warders walk, in squares of the plan. */
const ROUNDS: readonly {
  readonly from: Vec;
  readonly to: Vec;
  /** How far this one sees, in jail pixels - the default beat if left out. */
  readonly range?: number;
  /** Whether he walks the tower, looking over the walls. */
  readonly high?: boolean;
}[] = [
  // Up and down the corridor, past every cell door.
  { from: { x: 2.5, y: 9.5 }, to: { x: 37, y: 9.5 } },
  // Across the yard, and back.
  { from: { x: 4, y: 3.5 }, to: { x: 35, y: 3.5 } },
  // In front of the door to the block, where everybody has to pass.
  { from: { x: 19.5, y: 1.5 }, to: { x: 19.5, y: 7 } },
  // One in the sick bay, which is the difficulty of the second-last stretch.
  { from: { x: 29, y: 19.5 }, to: { x: 37.5, y: 19.5 } },
  // And the tower on the outer wall. He paces its platform east and west, and
  // while he faces west his look lies straight along the cable.
  {
    from: { x: 36.4, y: 23.5 },
    to: { x: 37.7, y: 23.5 },
    range: TOWER_RANGE,
    high: true,
  },
];

/** Where the men who are not going anywhere stand about. */
const IDLERS: readonly Vec[] = [
  { x: 10.5, y: 3.5 },
  { x: 25.5, y: 5.5 },
  { x: 31.5, y: 2.5 },
  { x: 8.5, y: 6.5 },
  { x: 17.5, y: 13.5 },
  { x: 31.5, y: 13.5 },
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What one turn inside the jail comes to. */
export type PrisonTurn = {
  /** The jail, one step on. */
  readonly prison: PrisonState;
  /** What to add to the ticker, oldest first. */
  readonly lines: readonly string[];
  /** Whether the escape is still running, over the wall, or over. */
  readonly done: "on" | "out" | "back";
};

/**
 * The jail at the moment the cell door is unlocked for the day.
 *
 * @param time - the simulation clock of the city, so the two agree
 * @returns a fresh escape, nothing done yet
 */
export function enterPrison(time: number): PrisonState {
  return {
    time,
    stage: "screw",
    hero: { x: CELL_HOME.x, y: CELL_HOME.y, heading: -Math.PI / 2, walked: 0 },
    warders: ROUNDS.map((round) => ({
      x: round.from.x * SLAB,
      y: round.from.y * SLAB,
      heading: Math.atan2(round.to.y - round.from.y, round.to.x - round.from.x),
      walked: 0,
      from: { x: round.from.x * SLAB, y: round.from.y * SLAB },
      to: { x: round.to.x * SLAB, y: round.to.y * SLAB },
      onward: true,
      waitUntil: 0,
      range: round.range ?? WATCH_RANGE,
      high: round.high ?? false,
    })),
    mates: [],
    trail: [],
    idle: IDLERS.map((spot) => ({
      x: spot.x * SLAB,
      y: spot.y * SLAB,
      heading: Math.PI / 2,
      walked: 0,
    })),
    work: 0,
    screw: false,
    caught: 0,
    graceUntil: 0,
  };
}

/**
 * One step of the escape.
 *
 * @param prison - the jail as it stands
 * @param input - the keys and the mouse this frame
 * @param dt - seconds since the last step
 * @returns the jail one step on, what to say about it, and how it ended
 */
export function advance(
  prison: PrisonState,
  input: Input,
  dt: number,
): PrisonTurn {
  const slice = Math.min(dt, MAX_STEP);
  const lines: string[] = [];
  let next: PrisonState = { ...prison, time: prison.time + slice };
  next = walkHero(next, input, slice);
  next = doWork(next, input, slice, lines);
  next = patrol(next, slice);
  next = follow(next);
  next = watchOut(next, input, lines);
  next = arrive(next, lines);
  let done: PrisonTurn["done"] = "on";
  if (next.stage === "out") {
    done = "out";
  } else if (next.caught >= CATCHES) {
    done = "back";
  }
  return { prison: next, lines, done };
}

/**
 * What the player is meant to be doing, in one line.
 *
 * @param prison - the jail as it stands
 * @returns the task, for the bar under the picture
 */
export function taskLine(prison: PrisonState): string {
  return TASKS[prison.stage];
}

/**
 * Where the job in hand is, so the picture can ring it.
 *
 * @param prison - the jail as it stands
 * @returns the spot to walk to, or null while the task is a walk
 */
export function markOf(prison: PrisonState): Vec | null {
  let mark: Vec | null;
  switch (prison.stage) {
    case "screw":
      mark = nearestOf(BENCHES, prison.hero);
      break;
    case "loo":
      mark = MY_LOO;
      break;
    case "stones":
      mark = STONES;
      break;
    case "window":
      mark = WINDOW;
      break;
    default:
      mark = null;
  }
  return mark;
}

/**
 * Whether the escape is past one of the rungs of its ladder.
 *
 * @param stage - how far it has got
 * @param mark - the rung to compare it with
 * @returns true once that rung is behind it
 * @remarks
 * The picture asks the same question the walls do - a hole is a hole once the
 * stones are out, and it has to be drawn as one - so the order of the ladder
 * lives here and nowhere else.
 */
export function past(stage: PrisonStage, mark: PrisonStage): boolean {
  return rank(stage) > rank(mark);
}

/**
 * Whether the player has something on him that a warder would take an
 * interest in.
 *
 * @param prison - the jail as it stands
 * @returns true while being seen would cost you
 * @remarks
 * The picture asks this too, to colour the warders' looks: a cone one has to
 * fear is drawn differently from a cone one may walk through, and the player
 * should never have to guess which of the two he is looking at.
 */
export function hunting(prison: PrisonState): boolean {
  return (
    prison.screw || prison.work > 0 || rank(prison.stage) >= rank("tunnel")
  );
}

/**
 * What is on one square of the plan.
 *
 * @param col - square across, from the west
 * @param row - square down, from the north
 * @returns what stands there, and open ground beyond the edge
 */
export function slabAt(col: number, row: number): Slab {
  const letter =
    col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH
      ? PLAN[row][col]
      : "o";
  return LEGEND[letter] ?? "free";
}

/**
 * What is under a point.
 *
 * @param x - jail pixels across
 * @param y - jail pixels down
 * @returns what stands there
 */
export function slabUnder(x: number, y: number): Slab {
  return slabAt(Math.floor(x / SLAB), Math.floor(y / SLAB));
}

/**
 * Whether the way through a point is shut.
 *
 * @param stage - how far the escape has got, which opens three of the squares
 * @param x - jail pixels across
 * @param y - jail pixels down
 * @returns true where nobody may walk
 */
export function solid(stage: PrisonStage, x: number, y: number): boolean {
  const kind = slabUnder(x, y);
  let shut: boolean;
  switch (kind) {
    case "wall":
    case "bars":
    case "bench":
    case "loo":
    case "bunk":
    case "tower":
      shut = true;
      break;
    case "myLoo":
      // One's own pan, until it is off the floor - after that the corner it
      // stood in is where one kneels to get at the stones.
      shut = rank(stage) <= rank("loo");
      break;
    case "stones":
      // The hole in the wall - a wall until the stones are out of it.
      shut = rank(stage) <= rank("stones");
      break;
    case "window":
    case "cable":
      // Both open at the same moment: the window one climbs through and the
      // cable one hangs from are the same decision.
      shut = rank(stage) < rank("cable");
      break;
    default:
      shut = false;
  }
  return shut;
}

/* --------------------------------------------------------------- the plan */

/** Every square of a kind, as points in the middle of them. */
function spotsOf(want: Slab): readonly Vec[] {
  const spots: Vec[] = [];
  for (let row = 0; row < PLAN_HIGH; row += 1) {
    for (let col = 0; col < PLAN_WIDE; col += 1) {
      if (slabAt(col, row) === want) {
        spots.push({ x: (col + MIDDLE) * SLAB, y: (row + MIDDLE) * SLAB });
      }
    }
  }
  return spots;
}

/** The benches in the yard, one screw each. */
const BENCHES = spotsOf("bench");

/** The pan in the player's own cell. */
const MY_LOO = spotsOf("myLoo")[0];

/** The stones under it. */
const STONES = spotsOf("stones")[0];

/** The window of the sick bay. */
const WINDOW = spotsOf("window")[0];

/* --------------------------------------------------------------- the step */

/** Where a rung sits on the ladder. */
function rank(stage: PrisonStage): number {
  return LADDER.indexOf(stage);
}

/** The rung after this one. */
function nextStage(stage: PrisonStage): PrisonStage {
  return LADDER[Math.min(LADDER.length - 1, rank(stage) + 1)];
}

/** The keys, the walls, and the slow shuffle along the cable. */
function walkHero(prison: PrisonState, input: Input, dt: number): PrisonState {
  const hero = prison.hero;
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const length = Math.hypot(dx, dy);
  const hanging = slabUnder(hero.x, hero.y) === "cable";
  const pace =
    WALK_SPEED * (input.boost ? RUN_WALK : 1) * (hanging ? CABLE_PACE : 1);
  const step = length === 0 ? 0 : (pace * dt) / length;
  // One axis at a time, so a shoulder against a wall slides along it instead
  // of stopping the whole walk.
  const wantX = hero.x + dx * step;
  const x = free(prison.stage, wantX, hero.y) ? wantX : hero.x;
  const wantY = hero.y + dy * step;
  const y = free(prison.stage, x, wantY) ? wantY : hero.y;
  const went = Math.hypot(x - hero.x, y - hero.y);
  return {
    ...prison,
    hero: {
      x,
      y,
      heading: length === 0 ? hero.heading : Math.atan2(dy, dx),
      walked: hero.walked + went,
    },
  };
}

/** Whether a body may stand with its middle here. */
function free(stage: PrisonStage, x: number, y: number): boolean {
  return (
    !solid(stage, x - HALF_BODY, y - HALF_BODY) &&
    !solid(stage, x + HALF_BODY, y - HALF_BODY) &&
    !solid(stage, x - HALF_BODY, y + HALF_BODY) &&
    !solid(stage, x + HALF_BODY, y + HALF_BODY)
  );
}

/**
 * The mouse held down on whatever the task is.
 *
 * @remarks
 * Held, not tapped, and the progress stays where it got to when the hand comes
 * off. Everything in here is quiet work with a screw: a bar that fills while
 * one listens for boots is the whole tension of the thing, and a bar that fell
 * back to nothing every time would only be a punishment for listening.
 */
function doWork(
  prison: PrisonState,
  input: Input,
  dt: number,
  lines: string[],
): PrisonState {
  const mark = markOf(prison);
  const takes = WORK_SECONDS[prison.stage] ?? 0;
  const near = mark !== null && away(mark, prison.hero) < REACH;
  const work =
    input.fire && near && takes > 0 ? prison.work + dt / takes : prison.work;
  let next: PrisonState;
  if (work >= 1) {
    const line = DONE_LINES[prison.stage];
    if (line !== undefined) {
      lines.push(line);
    }
    next = {
      ...prison,
      stage: nextStage(prison.stage),
      work: 0,
      screw: prison.stage === "screw" ? true : prison.screw,
      mates: prison.stage === "stones" ? mateLine(prison) : prison.mates,
    };
  } else {
    next = { ...prison, work };
  }
  return next;
}

/** The men who come along, lined up behind the player in the cell. */
function mateLine(prison: PrisonState): readonly Inmate[] {
  return Array.from({ length: MATE_COUNT }, () => ({
    x: prison.hero.x,
    y: prison.hero.y,
    heading: prison.hero.heading,
    walked: 0,
  }));
}

/** Every warder, one step along his round. */
function patrol(prison: PrisonState, dt: number): PrisonState {
  return {
    ...prison,
    warders: prison.warders.map((warder) => march(warder, dt, prison.time)),
  };
}

/** One warder, walking to the end of his line and turning round. */
function march(warder: Warder, dt: number, time: number): Warder {
  const goal = warder.onward ? warder.to : warder.from;
  const gap = Math.hypot(goal.x - warder.x, goal.y - warder.y);
  const step = WARDER_SPEED * dt;
  let moved: Warder;
  if (time < warder.waitUntil) {
    moved = warder;
  } else if (gap <= step) {
    const back = warder.onward ? warder.from : warder.to;
    moved = {
      ...warder,
      x: goal.x,
      y: goal.y,
      // He turns on the spot and stands there a moment - and that moment is
      // the window the player is waiting for.
      heading: Math.atan2(back.y - goal.y, back.x - goal.x),
      onward: !warder.onward,
      waitUntil: time + WARDER_TURN,
    };
  } else {
    moved = {
      ...warder,
      x: warder.x + ((goal.x - warder.x) / gap) * step,
      y: warder.y + ((goal.y - warder.y) / gap) * step,
      heading: Math.atan2(goal.y - warder.y, goal.x - warder.x),
      walked: warder.walked + step,
    };
  }
  return moved;
}

/**
 * The men behind you, walking where you walked.
 *
 * @remarks
 * A trail of breadcrumbs rather than three more sets of legs finding their own
 * way: what they have to do is follow somebody who already knows the way, and
 * a queue through a hole in a wall is exactly what that looks like.
 */
function follow(prison: PrisonState): PrisonState {
  const head = prison.trail[0];
  const trail =
    head === undefined || away(head, prison.hero) > TRAIL_GAP
      ? [{ x: prison.hero.x, y: prison.hero.y }, ...prison.trail].slice(
          0,
          TRAIL_STEPS,
        )
      : prison.trail;
  return {
    ...prison,
    trail,
    mates: prison.mates.map((mate, at) => {
      const spot = trail[(at + 1) * MATE_GAP] ?? prison.hero;
      const went = Math.hypot(spot.x - mate.x, spot.y - mate.y);
      return {
        x: spot.x,
        y: spot.y,
        heading:
          went > 0
            ? Math.atan2(spot.y - mate.y, spot.x - mate.x)
            : mate.heading,
        walked: mate.walked + went,
      };
    }),
  };
}

/**
 * Whether a warder has you, and what that costs.
 *
 * @remarks
 * Being seen is not in itself a crime: out in the yard everybody is a prisoner
 * and a warder looking at one is a warder doing nothing. It is having the
 * screw in your pocket, working on something, or being somewhere no prisoner
 * can be that turns a look into a hand on your collar.
 */
function watchOut(
  prison: PrisonState,
  input: Input,
  lines: string[],
): PrisonState {
  const seen =
    hunting(prison) &&
    !input.god &&
    prison.time >= prison.graceUntil &&
    prison.warders.some((warder) => sees(warder, prison.hero));
  let next: PrisonState;
  if (seen) {
    const last = prison.caught + 1;
    lines.push(
      last >= CATCHES
        ? "Dreimal erwischt. Du sitzt die Strafe ab."
        : "Ein Wärter hat dich gesehen. Zurück in die Zelle.",
    );
    next = {
      ...prison,
      // The screw is taken off you; the hole in the wall they never find.
      stage: prison.screw ? "screw" : prison.stage,
      screw: false,
      hero: { ...prison.hero, x: CELL_HOME.x, y: CELL_HOME.y },
      mates: prison.mates.map((mate) => ({
        ...mate,
        x: CELL_HOME.x,
        y: CELL_HOME.y,
      })),
      trail: [],
      work: 0,
      caught: last,
      graceUntil: prison.time + GRACE_SECONDS,
    };
  } else {
    next = prison;
  }
  return next;
}

/**
 * Whether this warder has the player in his look.
 *
 * @remarks
 * The man on the tower is the exception to the wall: he stands over it and
 * sees across, which is what makes the last stretch a matter of timing rather
 * than of walking.
 */
function sees(warder: Warder, hero: Inmate): boolean {
  const gap = away(warder, hero);
  const towards = Math.atan2(hero.y - warder.y, hero.x - warder.x);
  const off = Math.abs(wrap(towards - warder.heading));
  return (
    gap < warder.range &&
    off < WATCH_WIDE &&
    (warder.high || clearLine(warder, hero))
  );
}

/** Whether anything solid stands between the two - bars do not. */
function clearLine(from: Vec, to: Vec): boolean {
  const steps = Math.ceil(away(from, to) / SIGHT_STEP);
  let clear = true;
  for (let at = 1; at < steps; at += 1) {
    const part = at / steps;
    const kind = slabUnder(
      from.x + (to.x - from.x) * part,
      from.y + (to.y - from.y) * part,
    );
    if (kind === "wall" || kind === "stones") {
      clear = false;
    }
  }
  return clear;
}

/** The two rungs that are climbed by walking rather than by working. */
function arrive(prison: PrisonState, lines: string[]): PrisonState {
  const under = slabUnder(prison.hero.x, prison.hero.y);
  let next: PrisonState;
  if (prison.stage === "tunnel" && under === "ward") {
    lines.push("Der Gang endet in der Krankenstation.");
    next = { ...prison, stage: "window" };
  } else if (prison.stage === "cable" && under === "free") {
    lines.push("Über die Mauer. Du bist draußen.");
    next = { ...prison, stage: "out" };
  } else {
    next = prison;
  }
  return next;
}

/* ------------------------------------------------------------ small tools */

/** How far apart two points are. */
function away(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The nearest of a list of points. */
function nearestOf(spots: readonly Vec[], to: Vec): Vec | null {
  let best: Vec | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const spot of spots) {
    const gap = away(spot, to);
    if (gap < bestAway) {
      best = spot;
      bestAway = gap;
    }
  }
  return best;
}

/** An angle brought back between -pi and pi. */
function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
