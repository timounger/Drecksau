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
  BACK_SCENE,
  BOSS_SCENE,
  CABLE_PACE,
  CATCHES,
  GANG_SCENE,
  HOLE_NEAR,
  ERRAND_SECONDS,
  FIGHT_SECONDS,
  COUNT_EVERY,
  COUNT_WARN,
  SEARCH_EYES,
  SEARCH_SECONDS,
  RUN_WALK,
  GRACE_SECONDS,
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
  type PrisonScene,
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
 * **The yard and one wing**, which is all of a prison a prisoner ever sees.
 * North is the yard: a basketball court with the benches round it, the way
 * every exercise yard in the world is laid out, and the outer wall round the
 * lot. South of it the block one lives in - a corridor with five cells off it,
 * the westernmost one yours.
 *
 * The escape is the length of the plan and runs under it: the pan in the
 * corner of your cell (`w`) stands on loose stones (`X`), and behind those is
 * the crawl space (`~`) along the foot of the south wall. That one ends at
 * rock; the way out is the second hole, under the workshop table (`A`), and
 * the tunnel from it comes up in the sick bay (`N`). Its window (`O`) is in
 * the north wall, and from the window a power cable (`=`) runs over the wall.
 *
 * A route learned by heart, like every other plan in this game: a jail that
 * reshuffled itself between attempts would be a maze, and a maze is solved
 * once and never again.
 */
export const PLAN: readonly string[] = [
  "ooooooooooooooooooo===o",
  "#################T#O###",
  "##IIIIII#YYYYYYY#NNNNN#",
  "##IIIIII#YYYYYYY#NBNBN#",
  "##IAIII.#YYYYYYY#NNNNN#",
  "##IIIIII#YYYYYYY#NBNBN#",
  "####D####YYYYYYY###L###",
  "#YYYYYYYYYYKKKKKKKYYYY#",
  "#YYYYYYYYbYKKKKKKKYbYY#",
  "#YYYYYYYYYYKKKKKKKYYYY#",
  "#YYYYYYYYYYKKKKKKKYYYY#",
  "#YYYYYYYYbYKKKKKKKYbYY#",
  "#YYYYYYYYYYKKKKKKKYYYY#",
  "#YYYYYYYYYYKKKKKKKYYYY#",
  "#YYYYYYYYbYKKKKKKKYbYY#",
  "########.....##########",
  "#.....................#",
  "#|g||#|+||#|+||#|+||###",
  "#cccM#cccM#cccM#cccM###",
  "#wccc#Wccc#Wccc#Wccc###",
  "#X#####################",
  "#~~~~~~~~~~~~~~~~~Z~~~#",
  "#######################",
  "#S~~~~~~~~~~~~~~~~~~~S#",
  "#######################",
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
  g: "myGate",
  Y: "yard",
  K: "court",
  I: "worksFloor",
  A: "table",
  D: "door",
  L: "locked",
  N: "ward",
  B: "bed",
  b: "bench",
  W: "loo",
  w: "myLoo",
  M: "bunk",
  X: "stones",
  Z: "hardWall",
  "~": "tunnel",
  S: "shaft",
  O: "window",
  "=": "cable",
  T: "tower",
  o: "free",
};

/** The ladder of the escape, in the order it is climbed. */
const LADDER: readonly PrisonStage[] = [
  "screw",
  "gang",
  "loo",
  "dig",
  "moved",
  "dig2",
  "wall",
  "works",
  "ward",
  "window",
  "cable",
  "out",
];

/** How long each job takes with the mouse held down, in seconds. */
const WORK_SECONDS: Readonly<Record<string, number>> = {
  screw: 2.6,
  // Talking somebody into doing something about it: shorter than the jobs,
  // because the work is his.
  gang: 1.6,
  loo: 3.2,
  // **The long one.** Digging through a cell floor is the middle of this
  // story and it is supposed to take several rounds of the corridor - which
  // is the whole reason the pan has to keep going back over it.
  dig: 9,
  moved: FIGHT_SECONDS,
  dig2: 7,
  wall: 4,
  works: 8,
  window: 2,
};

/** What the bar under the picture says, one line per rung of the ladder. */
const SCENE_TASKS: Readonly<Record<PrisonScene["kind"], string>> = {
  gang: "Die Bande kommt rüber. Da ist nichts zu machen.",
  boss: "Der Direktor verlegt dich. Mitkommen.",
  back: "Der Wärter bringt dich zurück in deine alte Zelle.",
};

const TASKS: Readonly<Record<PrisonStage, string>> = {
  screw: "Im Hof: an einer Bank die Schraube abdrehen - Maus halten.",
  gang: "Die Bande hat die Schraube. Heuer den Großen am Block an - Maus halten.",
  loo: "In deiner Zelle: die Kloschüssel abschrauben - Maus halten.",
  dig: "Graben - Maus halten. Kommt ein Wärter: Leertaste, Schüssel drüber.",
  moved: "Neue Zelle. Streit mit dem Zellengenossen anfangen - Maus halten.",
  dig2: "Zurück in deiner Zelle: weitergraben - und zudecken, wenn einer kommt.",
  wall: "Im Kriechgang: die Wand am Ende durchbrechen - Maus halten.",
  works:
    "In der Prison Industry graben - kommt einer: Leertaste, Tisch drüber.",
  ward: "Durch den Tunnel nach Osten - hier unten ist kein Wärter.",
  window: "Fenster auf und das Kabel greifen - Maus halten.",
  cable: "Am Kabel über die Mauer hangeln.",
  out: "Draußen.",
};

/** What the ticker says when a job is done. */
const DONE_LINES: Readonly<Record<string, string>> = {
  screw: "Schraube ab - und die Bande im Hof hat genau hingesehen.",
  gang: "Er geht rüber. Die geben sie ihm, ohne ein Wort.",
  loo: "Die Schüssel ist ab. Darunter: Steine und Erde.",
  dig: "Das Loch ist tief genug - und der Direktor steht in der Tür.",
  moved: "Genug Blut für eine Verlegung.",
  dig2: "Der Boden ist durch. Unter dir liegt der Kriechgang.",
  wall:
    "Dahinter ist Fels. Der Gang ist eine Sackgasse - hier kommst du nie " +
    "raus. Bleibt der zweite Plan: rauf in die Prison Industry und von dort " +
    "einen Tunnel graben.",
  works: "Der Werkstattboden ist durch. Der Tunnel führt unter den Hof.",
  window: "Das Fenster ist auf. Das Kabel hält.",
};

/** How wide the player is, from the middle, in jail pixels. */
const HALF_BODY = 9;

/** How far apart two points of a sight line are checked, in jail pixels. */
const SIGHT_STEP = SLAB / 2;

/** How many points of the trail lie between one follower and the next. */
const MATE_GAP = 3;

/** The middle of a square, as a share of its width. */
const MIDDLE = 0.5;

/** How far into the gang scene they have reached one, as a share of it. */
const GANG_THERE = 0.42;

/** And when they turn round and go back to their wall. */
const GANG_BACK = 0.62;

/** How far into the governor's scene he has arrived at the cell door. */
const BOSS_THERE = 0.32;

/** How far ahead of the player the governor walks, as a share of the way. */
const BOSS_AHEAD = 0.07;

/** How far to one side of one the three of them line up, in jail pixels. */
const SCENE_APART = 22;

/** The shortest time a scene walk is given, so nobody teleports, in seconds. */
const MIN_REST = 0.25;

/** How long each scene runs. */
const SCENE_SECONDS: Readonly<Record<PrisonScene["kind"], number>> = {
  gang: GANG_SCENE,
  boss: BOSS_SCENE,
  back: BACK_SCENE,
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers below are
   places on the plan above: which square a bench is on, where a warder turns
   round. They are a map, not arithmetic. */

/** Where the player wakes up: the western cell. */
const CELL_HOME: Vec = { x: 2.5 * SLAB, y: 18.6 * SLAB };

/** Which columns and rows that cell covers, for the roll-call. */
const MY_CELL = { from: { col: 1, row: 18 }, to: { col: 4, row: 19 } };

/** The line the corridor runs down, in jail pixels. */
const CORRIDOR_Y = 16.5 * SLAB;

/** And the cell the governor moves one into, three doors along. */
const OTHER_CELL: Vec = { x: 12.5 * SLAB, y: 18.6 * SLAB };

/** Where the gang stand about in the yard, with their backs to the wall. */
const GANG: readonly Vec[] = [
  { x: 4.5, y: 12.5 },
  { x: 5.5, y: 13.5 },
  { x: 3.5, y: 13.5 },
];

/** And where the man one hires for the job leans on the block wall. */
const MUSCLE: Vec = { x: 19.5, y: 16.5 };

/** The rounds the warders walk, in squares of the plan. */
const ROUNDS: readonly {
  readonly from: Vec;
  readonly to: Vec;
  /** How far this one sees, in jail pixels - the default beat if left out. */
  readonly range?: number;
  /** Whether he walks the tower, looking over the walls. */
  readonly high?: boolean;
}[] = [
  // Up and down the corridor, past every cell door. This is the round the
  // digging is done between.
  { from: { x: 2, y: 16.5 }, to: { x: 20, y: 16.5 } },
  // Across the yard below the workshop, and back.
  { from: { x: 2, y: 7.5 }, to: { x: 20, y: 7.5 } },
  // Between the court and the door to the block, which everybody has to pass.
  { from: { x: 18.5, y: 8 }, to: { x: 18.5, y: 14 } },
  // **Nobody is posted in the workshop.** One of the yard's men walks up to
  // it and in through the door now and then, and that is what makes the
  // second hole a job of timing rather than of patience: one hears the door
  // rather than watching a man pace the room one is digging in.
  { from: { x: 4.5, y: 10.5 }, to: { x: 4.5, y: 4.5 } },
  // And the tower on the north wall, whose look lies along the cable.
  {
    from: { x: 17.5, y: 1.5 },
    to: { x: 18.9, y: 1.5 },
    range: TOWER_RANGE,
    high: true,
  },
];

/** Where the men who are not going anywhere stand about. */
const IDLERS: readonly Vec[] = [
  { x: 10.5, y: 8.5 },
  { x: 20.5, y: 11.5 },
  { x: 3.5, y: 9.5 },
  { x: 6.5, y: 16.5 },
  { x: 12.5, y: 16.5 },
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
    covered: true,
    liftHeld: false,
    gangHas: false,
    // **He is standing there from the first minute.** One hires the man one
    // can see: a yard that grows him the moment he is needed is a yard with
    // a vending machine in it.
    helper: {
      x: MUSCLE_SPOT.x,
      y: MUSCLE_SPOT.y,
      heading: -Math.PI / 2,
      walked: 0,
    },
    errand: "none",
    foe: null,
    scene: null,
    // The first count is a whole interval away: one gets a morning before the
    // day starts being counted.
    countAt: time + COUNT_EVERY,
    counts: 0,
    searchUntil: null,
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
  if (sceneOf(next) === null) {
    next = walkHero(next, input, slice);
    next = coverUp(next, input, lines);
    next = doWork(next, input, slice, lines);
  } else {
    // **The keys do nothing while a scene runs.** Somebody is taking
    // something off you or walking you down a corridor, and being able to
    // stroll away from either would make both of them suggestions.
    next = playScene(next, slice, lines);
  }
  next = runErrand(next, slice, lines);
  next = rollCall(next, lines);
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
  const due = prison.countAt - prison.time;
  const scene = sceneOf(prison);
  let line: string;
  if (scene !== null) {
    line = SCENE_TASKS[scene.kind];
  } else if (searching(prison)) {
    line = "Zählappell verpasst - sie durchsuchen den Bau. Versteck dich.";
  } else if (due <= COUNT_WARN) {
    line = `Zählappell in ${String(Math.max(0, Math.ceil(due)))} s - ab in deine Zelle.`;
  } else {
    line = TASKS[prison.stage];
  }
  return line;
}

/**
 * Where the gang are standing, for the picture.
 *
 * @param prison - the jail as it stands
 * @returns the three of them, or none once the screw is back
 * @remarks
 * They are only there while they matter: three men with their backs to the
 * wall of the yard, holding the one thing in this prison worth holding. Once
 * the hired man has walked over, the picture has no more use for them than
 * the escape has.
 */
export function gangOf(prison: PrisonState): readonly Inmate[] {
  const scene = sceneOf(prison);
  let three: readonly Inmate[];
  if (scene !== null && scene.kind === "gang") {
    // Mid-scene they are walking, so where they are is what the scene says.
    three = scene.folk;
  } else if (prison.gangHas) {
    three = GANG_SPOTS.map((spot) => ({
      x: spot.x,
      y: spot.y,
      heading: -Math.PI / 2,
      walked: 0,
    }));
  } else {
    three = [];
  }
  return three;
}

/**
 * Who is walking the player down the wing, for the picture.
 *
 * @param prison - the jail as it stands
 * @returns him and what he is, or nobody outside those two scenes
 * @remarks
 * The governor exists for five seconds in the whole escape, and that is
 * right: one who stood about the wing would be a warder with a better coat.
 * The man who walks one back after the fight is an ordinary warder, and has
 * to look like one, so which of the two it is travels with him.
 */
export function escortOf(
  prison: PrisonState,
): { readonly at: Inmate; readonly staff: "boss" | "warder" } | null {
  const scene = sceneOf(prison);
  const first = scene === null ? undefined : scene.folk[0];
  return scene === null || scene.kind === "gang" || first === undefined
    ? null
    : { at: first, staff: scene.kind === "boss" ? "boss" : "warder" };
}

/**
 * Whether the warders are turning the place over.
 *
 * @param prison - the jail as it stands
 * @returns true while the search after a missed count is running
 */
export function searching(prison: PrisonState): boolean {
  return prison.searchUntil !== null && prison.time < prison.searchUntil;
}

/**
 * How long until the next count, for the bar under the picture.
 *
 * @param prison - the jail as it stands
 * @returns seconds, never below nought
 */
export function untilCount(prison: PrisonState): number {
  return Math.max(0, prison.countAt - prison.time);
}

/**
 * Where the job in hand is, so the picture can ring it.
 *
 * @param prison - the jail as it stands
 * @returns the spot to walk to, or null while the task is a walk
 */
export function markOf(prison: PrisonState): Vec | null {
  let mark: Vec | null;
  if (sceneOf(prison) !== null) {
    // Nothing to go to while one is being talked to.
    return null;
  }
  switch (prison.stage) {
    case "screw":
      mark = nearestOf(BENCHES, prison.hero);
      break;
    case "gang":
      mark = prison.helper ?? MUSCLE_SPOT;
      break;
    case "loo":
      mark = MY_LOO;
      break;
    case "dig":
    case "dig2":
      mark = STONES;
      break;
    case "moved":
      mark = prison.foe;
      break;
    case "wall":
      mark = HARD_WALL;
      break;
    case "works":
      mark = TABLE;
      break;
    case "ward":
      // The hole in the workshop until one is down it, the ladder after.
      mark = prison.hero.y > TUNNEL_EAST.y - SLAB ? TUNNEL_EAST : TABLE;
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
 * Whether a warder looking at you would have anything on you.
 *
 * @param prison - the jail as it stands
 * @returns true while being seen would cost you
 * @remarks
 * **One rule: the open hole.** A prisoner walking about the yard, the
 * corridor or his own cell is doing what he is allowed to do, and a screw in
 * his pocket is not something anybody can see. What gets a hand on the collar
 * is being at a floor one has taken up - so covering it (Leertaste) is not a
 * trick but the whole of the defence.
 *
 * Two squares count as "at it", which is about the size of the cell: step out
 * into the corridor and the hole is somebody else's problem, kneel over it
 * while boots go past and it is yours.
 *
 * The one thing besides it is the count: while they are turning the place
 * over, standing anywhere but one's own cell is reason enough, because by
 * then nobody is looking for a reason.
 *
 * The picture asks this too, to colour the warders' looks: a cone one has to
 * fear is drawn differently from a cone one may walk through, and the player
 * should never have to guess which of the two he is looking at.
 */
export function hunting(prison: PrisonState): boolean {
  const hole = digging(prison.stage) ? markOf(prison) : null;
  return (
    (hole !== null && !prison.covered && away(prison.hero, hole) < HOLE_NEAR) ||
    (searching(prison) && !inMyCell(prison.hero))
  );
}

/** Whether somebody is standing in the player's own cell. */
function inMyCell(who: Vec): boolean {
  const col = Math.floor(who.x / SLAB);
  const row = Math.floor(who.y / SLAB);
  return (
    col >= MY_CELL.from.col &&
    col <= MY_CELL.to.col &&
    row >= MY_CELL.from.row &&
    row <= MY_CELL.to.row
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
    case "bed":
    // The sick bay door, which is locked from the far side of it. The way
    // into that room is the tunnel, and a door one could walk through would
    // make every hole in this jail a waste of a spoon.
    case "locked":
    case "loo":
    case "bunk":
    case "tower":
    case "works":
      shut = true;
      break;
    case "myLoo":
      // One's own pan, until it is off the floor - after that the corner it
      // stood in is where one kneels to dig.
      shut = rank(stage) <= rank("loo");
      break;
    case "stones":
      // The hole in the cell floor: a floor until it has been dug through,
      // and shut again whenever the pan is standing over it.
      shut = rank(stage) <= rank("dig2");
      break;
    case "myGate":
      // **The governor locks the door behind him.** Between being moved and
      // getting oneself moved back, one's own cell is a cell like any other:
      // shut. Otherwise the whole of that stretch would be a walk down the
      // corridor.
      shut = stage === "moved";
      break;
    case "hardWall":
      // The wall at the end of the crawl space, until it is broken through -
      // and behind it there is nothing, which is the point of it.
      shut = rank(stage) <= rank("wall");
      break;
    case "table":
      // The workshop table stands on the second hole. It is furniture until
      // the hole under it is dug, and then it is the way down.
      shut = rank(stage) <= rank("works");
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

/** The wall at the far end of the crawl space. */
const HARD_WALL = spotsOf("hardWall")[0];

/** The table in the workshop, and the floor under it. */
const TABLE = spotsOf("table")[0];

/** The window of the sick bay. */
const WINDOW = spotsOf("window")[0];

/**
 * The two ends of the long tunnel, west first.
 *
 * @remarks
 * **The tunnel is a place, not a cut.** One climbs into the hole in the
 * workshop floor and comes out at the west end of it; the walk east under the
 * yard is a walk, and the east end is the ladder up into the sick bay. Told
 * as a teleport - which is how it started - the longest job of the escape was
 * over in the frame it began.
 */
const SHAFTS = [...spotsOf("shaft")].sort((one, two) => one.x - two.x);

/** Where one comes down out of the workshop. */
const TUNNEL_WEST = SHAFTS[0];

/** And the ladder at the far end, under the sick bay. */
const TUNNEL_EAST = SHAFTS[SHAFTS.length - 1];

/** Where one comes up through the floor of the sick bay. */
const WARD_MIDDLE: Vec = middleOf(spotsOf("ward"));

/** The middle of a handful of squares. */
function middleOf(spots: readonly Vec[]): Vec {
  const sum = spots.reduce(
    (all, spot) => ({ x: all.x + spot.x, y: all.y + spot.y }),
    { x: 0, y: 0 },
  );
  const many = Math.max(1, spots.length);
  return { x: sum.x / many, y: sum.y / many };
}

/** Where the man one hires is standing before anybody has hired him. */
const MUSCLE_SPOT: Vec = { x: MUSCLE.x * SLAB, y: MUSCLE.y * SLAB };

/** And where the gang stand, in jail pixels. */
const GANG_SPOTS: readonly Vec[] = GANG.map((spot) => ({
  x: spot.x * SLAB,
  y: spot.y * SLAB,
}));

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
  // **One cannot dig through the lid.** The pan or the table has to be off the
  // hole first, which is exactly the moment one is in trouble if somebody
  // walks past - see {@link coverUp}.
  const open = !digging(prison.stage) || !prison.covered;
  const work =
    input.fire && near && open && takes > 0
      ? prison.work + dt / takes
      : prison.work;
  let next: PrisonState;
  if (work >= 1) {
    const line = DONE_LINES[prison.stage];
    if (line !== undefined) {
      lines.push(line);
    }
    const saw = witnesses(prison);
    if (saw.joined.length > prison.mates.length) {
      lines.push("Einer hat zugesehen - der kommt jetzt mit.");
    }
    next = afterJob(
      {
        ...prison,
        stage: nextStage(prison.stage),
        work: 0,
        mates: saw.joined,
        idle: saw.left,
      },
      prison.stage,
    );
  } else {
    next = { ...prison, work };
  }
  return next;
}

/**
 * What one finished job does besides moving the ladder on.
 *
 * @param prison - the jail, already on the next rung
 * @param done - the rung that was just finished
 * @returns the jail with whatever that job set in motion
 * @remarks
 * **This is the story.** The screw comes off the bench and the gang have it
 * before it is in a pocket; the man one hires walks over and gets it back;
 * the governor turns up the moment the hole is deep enough and moves one three
 * doors along; a fight gets one moved back. Each of those is one line here,
 * and each of them changes where somebody is standing - which is the only sort
 * of story this game can tell.
 */
function afterJob(prison: PrisonState, done: PrisonStage): PrisonState {
  let next = prison;
  if (done === "screw") {
    // **They watched it come off**, and now they come over for it. The screw
    // is still in your hand until the scene ends - see playScene.
    next = {
      ...next,
      screw: true,
      scene: {
        kind: "gang",
        left: GANG_SCENE,
        folk: GANG_SPOTS.map((spot) => ({
          x: spot.x,
          y: spot.y,
          heading: -Math.PI / 2,
          walked: 0,
        })),
      },
    };
  } else if (done === "gang") {
    // The hired man sets off. He has it when he gets back - see runErrand.
    next = {
      ...next,
      stage: "gang",
      errand: "going",
      helper: next.helper ?? {
        x: MUSCLE_SPOT.x,
        y: MUSCLE_SPOT.y,
        heading: -Math.PI / 2,
        walked: 0,
      },
    };
  } else if (done === "dig") {
    // **The governor.** Nobody digs half a floor away without somebody
    // noticing the dust, and what a prison does about it is move the man -
    // which one gets walked through rather than told.
    next = {
      ...next,
      covered: true,
      scene: {
        kind: "boss",
        left: BOSS_SCENE,
        folk: [
          {
            x: CELL_HOME.x,
            y: CORRIDOR_Y,
            heading: Math.PI / 2,
            walked: 0,
          },
        ],
      },
    };
  } else if (done === "wall") {
    // A new hole starts hidden: the table is standing on it when one walks in.
    next = { ...next, covered: true };
  } else if (done === "moved") {
    // The fight got one moved back, with a cut over the eye for it - and a
    // warder walking one down the wing, the same way one came.
    next = {
      ...next,
      scene: {
        kind: "back",
        left: BACK_SCENE,
        folk: [
          {
            x: OTHER_CELL.x + SLAB * MIDDLE,
            y: OTHER_CELL.y,
            heading: Math.PI,
            walked: 0,
          },
        ],
      },
    };
  }
  return next;
}

/**
 * The scene that is running, if one is.
 *
 * @param prison - the jail as it stands
 * @returns it, or null
 * @remarks
 * Through one door on purpose: a game saved before there were any scenes has
 * no such field at all, and a missing one has to read as "none" rather than
 * as "something is running that I cannot see".
 */
function sceneOf(prison: PrisonState): PrisonScene | null {
  return prison.scene ?? null;
}

/** Whether this rung is one of the two that are dug with a lid to hand. */
function digging(stage: PrisonStage): boolean {
  return stage === "dig" || stage === "dig2" || stage === "works";
}

/**
 * The lid over the hole: the pan in the cell, the table in the workshop.
 *
 * @param prison - the jail as it stands
 * @param input - the keys this frame
 * @param lines - what to say about it
 * @returns the jail with the hole covered or open
 * @remarks
 * **One key, and it is the whole of the middle of this escape.** Digging is
 * slow and the corridor is walked every half minute, so the question is never
 * "can I dig it" but "how much can I dig before the next pair of boots". The
 * space bar puts the thing back over the hole and takes it off again; one
 * cannot dig through it, and a warder who sees the hole open has found the
 * lot - see {@link hunting}.
 */
function coverUp(
  prison: PrisonState,
  input: Input,
  lines: string[],
): PrisonState {
  let next = prison;
  if (input.lift && digging(prison.stage) && !prison.liftHeld) {
    const lid = prison.stage === "works" ? "Der Tisch" : "Die Schüssel";
    lines.push(
      prison.covered
        ? `${lid} ist zur Seite. Das Loch liegt offen.`
        : `${lid} steht wieder drüber.`,
    );
    next = { ...next, covered: !prison.covered };
  }
  return { ...next, liftHeld: input.lift };
}

/**
 * The scene playing itself out, one step at a time.
 *
 * @param prison - the jail as it stands
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the jail one step further into the scene, or out the far side
 * @remarks
 * **What it costs is paid at the end, not at the start.** The gang have not
 * got the screw until the man with his hand out is standing in front of one;
 * the cell has not changed until the walk down the corridor is over. Setting
 * the state first and playing the walk afterwards is how one ends up watching
 * a scene whose result one already has.
 */
function playScene(
  prison: PrisonState,
  dt: number,
  lines: string[],
): PrisonState {
  const scene = sceneOf(prison);
  let next = prison;
  if (scene !== null) {
    const whole = SCENE_SECONDS[scene.kind];
    const left = scene.left - dt;
    const part = Math.min(1, Math.max(0, 1 - left / whole));
    const step =
      scene.kind === "gang"
        ? gangStep(prison, scene, part, dt)
        : walkStep(prison, scene, part);
    next = {
      ...prison,
      hero: step.hero,
      scene: { ...scene, left, folk: step.folk },
    };
    if (left <= 0) {
      next = endScene(next, scene.kind, lines);
    }
  }
  return next;
}

/** Where everybody is standing at one moment of a scene. */
type SceneStep = {
  readonly hero: Inmate;
  readonly folk: readonly Inmate[];
};

/**
 * The three of them coming over, taking it, and going back.
 *
 * @param prison - the jail as it stands
 * @param scene - the scene, for where they have got to
 * @param part - how far through it is, from nought to one
 * @param dt - seconds since the last step
 * @returns where everybody is standing now
 * @remarks
 * They line up in front of one rather than on top of one, which is what three
 * men doing this actually look like: one in the middle with his hand out and
 * one either side of him, close enough that walking off is not on offer. In
 * the middle of it they stand still - that pause is the moment the screw
 * changes hands, and without it the whole thing is a jog past.
 */
function gangStep(
  prison: PrisonState,
  scene: PrisonScene,
  part: number,
  dt: number,
): SceneStep {
  const folk = scene.folk.map((one, man) => {
    const home = GANG_SPOTS[man] ?? GANG_SPOTS[0];
    const goal =
      part < GANG_BACK
        ? {
            x: prison.hero.x + (man - 1) * SCENE_APART,
            y: prison.hero.y - SLAB * MIDDLE,
          }
        : home;
    // **They have to get there in the time the scene has.** How far they have
    // to come depends on where one was standing when the screw came off, so
    // the pace is worked out from the distance and the seconds left rather
    // than set once - a walk that runs out of scene stops in mid-yard.
    const rest = (part < GANG_BACK ? GANG_THERE - part : 1 - part) * GANG_SCENE;
    const pace = Math.max(
      WARDER_SPEED,
      away(one, goal) / Math.max(rest, MIN_REST),
    );
    return part >= GANG_THERE && part < GANG_BACK
      ? one
      : { ...one, ...toward(one, goal, pace, dt) };
  });
  const face = folk[1] ?? folk[0];
  return {
    hero:
      face === undefined
        ? prison.hero
        : { ...prison.hero, heading: headingTo(prison.hero, face) },
    folk,
  };
}

/**
 * Being walked down the wing: into the other cell, or back out of it.
 *
 * @param prison - the jail as it stands
 * @param scene - the scene, for which way round it is
 * @param part - how far through it is, from nought to one
 * @returns where the man with the keys and the player are standing now
 * @remarks
 * **The walk is the point**, and it is the same walk twice. The governor has
 * to come and fetch one first, so his scene starts with him coming down the
 * corridor to the cell door; the warder who breaks up the fight is already
 * standing there, so his starts moving at once. After that both are one line
 * of waypoints with the man a few steps ahead of the player - the whole of
 * what a transfer looks like from the inside.
 */
function walkStep(
  prison: PrisonState,
  scene: PrisonScene,
  part: number,
): SceneStep {
  const back = scene.kind === "back";
  const from = back ? OTHER_CELL : CELL_HOME;
  const to = back ? CELL_HOME : OTHER_CELL;
  const path: readonly Vec[] = [
    { x: from.x, y: from.y },
    { x: from.x, y: CORRIDOR_Y },
    { x: to.x, y: CORRIDOR_Y },
    { x: to.x, y: to.y },
  ];
  // Only the governor has to arrive before anybody walks anywhere.
  const fetch = back ? 0 : BOSS_THERE;
  const walk = part < fetch ? 0 : (part - fetch) / (1 - fetch);
  const him =
    part < fetch
      ? alongPath([path[2], path[1], path[0]], part / fetch)
      : alongPath(path, Math.min(1, walk + BOSS_AHEAD));
  const me = alongPath(path, walk);
  const first = scene.folk[0];
  return {
    hero: { ...prison.hero, x: me.x, y: me.y, heading: headingTo(me, him) },
    folk:
      first === undefined
        ? []
        : [{ ...first, x: him.x, y: him.y, heading: headingTo(him, me) }],
  };
}

/** Which way one thing looks, if it is looking at another. */
function headingTo(from: Vec, to: Vec): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * A point some way along a run of waypoints.
 *
 * @param path - the corners, in order
 * @param part - how far along, from nought to one
 * @returns the point that far along it, measured in real distance
 * @remarks
 * By length, not by leg: the corridor is several times the length of the bit
 * inside the cell, and splitting the clock evenly between them would have one
 * sprinting down the wing and then creeping through a doorway.
 */
function alongPath(path: readonly Vec[], part: number): Vec {
  const legs = path.slice(1).map((to, at) => away(path[at], to));
  const whole = legs.reduce((sum, leg) => sum + leg, 0);
  let want = Math.min(1, Math.max(0, part)) * whole;
  let spot = path[path.length - 1];
  for (let leg = 0; leg < legs.length; leg += 1) {
    const run = legs[leg];
    if (want <= run || leg === legs.length - 1) {
      const step = run === 0 ? 0 : Math.min(1, want / run);
      spot = {
        x: path[leg].x + (path[leg + 1].x - path[leg].x) * step,
        y: path[leg].y + (path[leg + 1].y - path[leg].y) * step,
      };
      break;
    }
    want -= run;
  }
  return spot;
}

/**
 * What the scene leaves behind when it is over.
 *
 * @param prison - the jail, with the scene run down to nought
 * @param kind - which scene it was
 * @param lines - what to say about it
 * @returns the jail with the scene's price paid and the scene cleared
 */
function endScene(
  prison: PrisonState,
  kind: PrisonScene["kind"],
  lines: string[],
): PrisonState {
  let next: PrisonState;
  if (kind === "gang") {
    lines.push("Der Mittlere nimmt sie dir aus der Hand. Keiner sagt etwas.");
    next = { ...prison, scene: null, screw: false, gangHas: true };
  } else if (kind === "back") {
    lines.push(
      "Zurück in deiner alten Zelle. Das Loch ist noch da, wo es war.",
    );
    next = {
      ...prison,
      scene: null,
      foe: null,
      covered: true,
      hero: { ...prison.hero, x: CELL_HOME.x, y: CELL_HOME.y },
    };
  } else {
    lines.push("Neue Zelle, neuer Mitbewohner. Die Tür geht hinter dir zu.");
    next = {
      ...prison,
      scene: null,
      hero: { ...prison.hero, x: OTHER_CELL.x, y: OTHER_CELL.y },
      foe: {
        x: OTHER_CELL.x + SLAB,
        y: OTHER_CELL.y - SLAB * MIDDLE,
        heading: Math.PI / 2,
        walked: 0,
      },
    };
  }
  return next;
}

/**
 * The man one hired, walking over and taking it back.
 *
 * @param prison - the jail as it stands
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the jail with him one step along his errand
 * @remarks
 * He does not fight them and nothing is drawn of it: three men who have taken
 * something off somebody hand it straight over to the one man in the yard
 * nobody argues with. What one sees is the walk there and the walk back, and
 * the screw is in one's pocket when he arrives.
 */
function runErrand(
  prison: PrisonState,
  dt: number,
  lines: string[],
): PrisonState {
  const man = prison.helper;
  let next = prison;
  if (man !== null && prison.errand !== "none") {
    const goal = prison.errand === "going" ? GANG_SPOTS[0] : { ...prison.hero };
    // He walks it in about {@link ERRAND_SECONDS}: fast enough not to be a
    // wait, slow enough that one watches him do it.
    const pace = away(man, goal) / ERRAND_SECONDS + WARDER_SPEED;
    const step = toward(man, goal, pace, dt);
    const there = away(step, goal) < REACH;
    if (!there) {
      next = { ...prison, helper: { ...man, ...step } };
    } else if (prison.errand === "going") {
      lines.push("Er nimmt sie ihnen ab. Keiner sagt etwas.");
      next = {
        ...prison,
        helper: { ...man, ...step },
        errand: "back",
        gangHas: false,
      };
    } else {
      lines.push("Da ist sie wieder. Jetzt in die Zelle.");
      next = {
        ...prison,
        helper: { ...man, ...step },
        errand: "none",
        screw: true,
        stage: "loo",
      };
    }
  }
  return next;
}

/**
 * Who saw that, and therefore comes along.
 *
 * @param prison - the jail as it stands
 * @returns the followers after this job, and the men still standing about
 * @remarks
 * **Only the ones who watched you do it.** Every prisoner in the yard tagging
 * along the moment a wall opened was a crowd, not a jailbreak: nobody knew
 * anything, they simply appeared. A man who has seen you kneeling over a
 * drain with a screw in your hand knows exactly one thing about you, and he
 * intends to come with you when you go.
 *
 * Seeing means the ordinary thing it means everywhere in this jail: close
 * enough, and nothing solid in between - see {@link clearLine}. It is worth
 * looking round before starting on something.
 */
function witnesses(prison: PrisonState): {
  readonly joined: readonly Inmate[];
  readonly left: readonly Inmate[];
} {
  const saw = prison.idle.filter(
    (man) =>
      away(man, prison.hero) < WATCH_RANGE && clearLine(man, prison.hero),
  );
  return {
    joined: [...prison.mates, ...saw],
    left: prison.idle.filter((man) => !saw.includes(man)),
  };
}

/**
 * The count, and what a missed one costs.
 *
 * @param prison - the jail as it stands
 * @param lines - what to say about it
 * @returns the jail after the count, if one was due
 * @remarks
 * **Twice a job and once a day is the shape of the thing.** The wing is
 * counted every {@link COUNT_EVERY} seconds, with the tannoy going
 * {@link COUNT_WARN} seconds before it, and standing in one's own cell with
 * empty hands is all that is asked. Miss it and nobody grabs you - they simply
 * start looking, everywhere, for half a minute, and *then* being in the wrong
 * place costs.
 *
 * Being in the cell is not enough on its own: a man kneeling over his drain
 * while they count is a man they are looking at. The work has to stop.
 */
function rollCall(prison: PrisonState, lines: string[]): PrisonState {
  let next = prison;
  if (prison.time >= prison.countAt) {
    const there = inMyCell(prison.hero) && prison.work === 0;
    lines.push(
      there
        ? "Zählappell. Du stehst in der Zelle - sie gehen weiter."
        : "Zählappell, und du fehlst. Sie durchsuchen den Bau.",
    );
    next = {
      ...prison,
      countAt: prison.time + COUNT_EVERY,
      counts: prison.counts + (there ? 1 : 0),
      searchUntil: there ? prison.searchUntil : prison.time + SEARCH_SECONDS,
    };
  } else if (prison.searchUntil !== null && prison.time >= prison.searchUntil) {
    lines.push("Die Durchsuchung ist vorbei. Es wird wieder ruhig.");
    next = { ...prison, searchUntil: null };
  }
  return next;
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
 * Being seen is not in itself a crime: out in the yard everybody is a
 * prisoner and a warder looking at one is a warder doing nothing. Only the
 * open hole turns a look into a hand on the collar - see {@link hunting} -
 * and what it costs is a catch and the walk back to the cell. The screw stays
 * in the pocket: a chain this long with a reset in it is a chain nobody
 * finishes.
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
    prison.warders.some((warder) =>
      sees(warder, prison.hero, searching(prison)),
    );
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
      // Whatever was open goes back under its lid on the way past, and the
      // work in hand is lost - that is the whole of the bill.
      covered: true,
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
function sees(warder: Warder, hero: Inmate, hunt: boolean): boolean {
  const gap = away(warder, hero);
  const towards = Math.atan2(hero.y - warder.y, hero.x - warder.x);
  const off = Math.abs(wrap(towards - warder.heading));
  // A search is not a round: they look further, and they look about them.
  const far = warder.range * (hunt ? SEARCH_EYES : 1);
  const wide = WATCH_WIDE * (hunt ? SEARCH_EYES : 1);
  return gap < far && off < wide && (warder.high || clearLine(warder, hero));
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

/** The rungs that are climbed by walking rather than by working. */
function arrive(prison: PrisonState, lines: string[]): PrisonState {
  const under = slabUnder(prison.hero.x, prison.hero.y);
  let next: PrisonState;
  if (prison.stage === "ward" && under === "table") {
    // **Down the hole.** One climbs in where one dug, and comes out at the
    // west end of the tunnel - from there it has to be walked.
    lines.push("Runter in das Loch. Von hier an geht es unter dem Hof weiter.");
    next = {
      ...prison,
      hero: { ...prison.hero, x: TUNNEL_WEST.x, y: TUNNEL_WEST.y },
    };
  } else if (
    prison.stage === "ward" &&
    under === "shaft" &&
    prison.hero.x > (PLAN_WIDE * SLAB) / 2
  ) {
    // And the ladder at the far end comes up through the floor of the sick
    // bay, which is the only way into that room from in here.
    lines.push(
      "Der Tunnel endet unter der Krankenstation. Da ist das Fenster.",
    );
    next = {
      ...prison,
      stage: "window",
      hero: { ...prison.hero, x: WARD_MIDDLE.x, y: WARD_MIDDLE.y },
    };
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

/**
 * One step of somebody walking somewhere.
 *
 * @param who - where he is now
 * @param spot - where he is going
 * @param pace - how fast, in pixels a second
 * @param dt - seconds since the last step
 * @returns his new place, heading and stride
 */
function toward(
  who: Vec,
  spot: Vec,
  pace: number,
  dt: number,
): { x: number; y: number; heading: number; walked: number } {
  const gap = away(spot, who);
  const heading = Math.atan2(spot.y - who.y, spot.x - who.x);
  const step = Math.min(gap, pace * dt);
  return {
    x: who.x + Math.cos(heading) * step,
    y: who.y + Math.sin(heading) * step,
    heading,
    walked: step,
  };
}

/** An angle brought back between -pi and pi. */
function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
