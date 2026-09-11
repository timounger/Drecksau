/**
 * The printing works: the plan of it, and the whole job inside.
 *
 * @module
 * @remarks
 * The third little world beside the city, after the jail - and the busiest.
 * Nothing in here has a car or a district; nothing in the city has a press or a
 * hostage. What passes between the two is two things: how much was printed, and
 * whether it came out through the tunnel.
 *
 * Three clocks run at once, and each of them belongs to somebody else. The
 * hostages print, and they only print while somebody stands them at a machine.
 * The hired men dig, and they dig faster the more of them came in. The police
 * lean on three doors, and the player is the only one who can hold one. That is
 * the whole design: every job needs a different pair of hands, so the minute in
 * which all three need doing is the minute the job is decided in.
 *
 * The plan is fixed, like the city and the jail. A job is a route learned by
 * heart - the presses along the north wall, the stairs in the west corner, the
 * hatch in the cellar - and a building that reshuffled itself between attempts
 * would be a maze instead of a plan.
 */
import {
  BUILD_RATE,
  RUN_WALK,
  DIG_SECONDS,
  HERO_DIG,
  MAX_STEP,
  POWER_CALM,
  PRESS_RATE,
  PUSH_RATE,
  REACH,
  RELEASE_CALM,
  SHIELD,
  SLAB,
  TAKE_SECONDS,
  WALK_SPEED,
  WAVE_EVERY,
  WAVE_FIRST,
  type Gate,
  type GateKind,
  type Hostage,
  type Inmate,
  type Input,
  type MintState,
  type Tile,
  type Vec,
} from "./types";

/**
 * The works, one letter per square.
 *
 * @remarks
 * North is up. The front door is in the north wall and opens into the hall; the
 * press room fills the middle; the stairs in the west corner go down to the
 * cellar, and under the south wall of the cellar is the earth the tunnel is dug
 * through. The two other ways in are a loading gate in the east wall and a
 * window in the west one - both of them in the press room, which is why holding
 * all three means running.
 */
export const PLAN: readonly string[] = [
  "oooooooooooooooooooooooooooooooooooooooo",
  "oooooooooooooooooooooooooooooooooooooooo",
  "##################DD####################",
  "#......................................#",
  "#...dd....................dd...........#",
  "#......................................#",
  "#####.....########################.....#",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
  "#,PPP,,,,PPP,,,,PPP,,,,PPP,,,,PPP,,,,,,#",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,SSS,G",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,SSS,#",
  "F,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
  "########.....###########################",
  "#cccccccccccccccccccccccccccccccccccccc#",
  "#cccccccccccccccccccccccccccccccccccccc#",
  "#cccccccccccccccccccccccccccccccccccccc#",
  "#cccccccccccccccccccccccccccccccccccccc#",
  "#####################X##################",
  "#####################~##################",
  "#####################~##################",
  "#####################~##################",
  "#####################~##################",
  "#####################E##################",
  "oooooooooooooooooooooooooooooooooooooooo",
];

/** How many squares across the plan is. */
export const PLAN_WIDE = PLAN[0].length;

/** How many squares down. */
export const PLAN_HIGH = PLAN.length;

/** What each letter of the plan stands for. */
const LEGEND: Readonly<Record<string, Tile>> = {
  "#": "wall",
  ".": "hall",
  ",": "works",
  P: "press",
  S: "pallet",
  d: "desk",
  D: "door",
  G: "gate",
  F: "window",
  c: "cellar",
  X: "dig",
  "~": "tunnel",
  E: "out",
  o: "free",
};

/** What one turn inside the works comes to. */
export type MintTurn = {
  /** The works, one step on. */
  readonly mint: MintState;
  /** What to add to the ticker, oldest first. */
  readonly lines: readonly string[];
  /** Whether the job is still running, out through the tunnel, or over. */
  readonly done: "on" | "out" | "stormed";
};

/** How wide a body is, from the middle, in works pixels. */
const HALF_BODY = 9;

/** How fast a hostage walks to the machine he is sent to. */
const HOSTAGE_PACE = 46;

/** How fast the hired men walk to the hatch. */
const CREW_PACE = 58;

/** How close counts as standing at a machine or a hatch, in works pixels. */
const AT_WORK = 30;

/**
 * How fast a squad eats what is piled against a door, in shares a second.
 *
 * @remarks
 * Slow enough that a pile is worth building before anybody is at the door. A
 * barricade that went in ten seconds would make the whole job a chase between
 * three doors, with no way of getting ahead of them.
 */
const WEAR = 0.04;

/** How fast what they gained slips away once they stop, in shares a second. */
const FADE = 0.045;

/**
 * And how fast the man on the other side of it pushes them back.
 *
 * @remarks
 * Piling things against a door is not only a wall for later: it is shoving,
 * now. Without this a door they had got three quarters through would stay three
 * quarters open for the rest of the job however long one stood at it, and the
 * last minute of every job would be lost to a door nobody could ever close.
 */
const RETAKE = 0.075;

/** How high a barricade has to be before a squad gives the door up. */
const GIVE_UP = 0.9;

/** How far a frightened clerk keeps away from an armed man, in pixels. */
const SHY = 120;

/**
 * And how close he gives up at, in pixels.
 *
 * @remarks
 * Inside this he stops backing away and stands still with his hands where
 * everybody can see them. Without it a clerk would back away for ever and
 * taking a hostage would be a footrace round the press room.
 */
const SHY_HOLD = 58;

/** How fast they back away, in pixels a second. */
const SHY_PACE = 30;

/* eslint-disable @typescript-eslint/no-magic-numbers -- what follows are
   places on the plan above: which square a press stands on, where the hired men
   line up, which wall a gate is in. They are a map, not arithmetic. */

/** Where the player comes in: just inside the front door. */
const DOOR_IN: Vec = { x: 19 * SLAB, y: 3.6 * SLAB };

/** Where somebody stands who is running a press, one spot per machine. */
const PRESS_SPOTS: readonly Vec[] = [
  { x: 3.5 * SLAB, y: 9.5 * SLAB },
  { x: 10.5 * SLAB, y: 9.5 * SLAB },
  { x: 17.5 * SLAB, y: 9.5 * SLAB },
  { x: 24.5 * SLAB, y: 9.5 * SLAB },
  { x: 31.5 * SLAB, y: 9.5 * SLAB },
];

/** Where the people who work here are when the door goes. */
const STAFF_SPOTS: readonly Vec[] = [
  { x: 6.5 * SLAB, y: 4.5 * SLAB },
  { x: 30.5 * SLAB, y: 4.5 * SLAB },
  { x: 12.5 * SLAB, y: 7.5 * SLAB },
  { x: 20.5 * SLAB, y: 12.5 * SLAB },
  { x: 33.5 * SLAB, y: 12.5 * SLAB },
  { x: 5.5 * SLAB, y: 11.5 * SLAB },
  { x: 26.5 * SLAB, y: 10.5 * SLAB },
];

/** Where the hired men stand while they wait their turn at the hatch. */
const DIG_SPOTS: readonly Vec[] = [
  { x: 20.5 * SLAB, y: 18.4 * SLAB },
  { x: 22.5 * SLAB, y: 18.4 * SLAB },
  { x: 19.5 * SLAB, y: 17.6 * SLAB },
  { x: 23.5 * SLAB, y: 17.6 * SLAB },
  { x: 21.5 * SLAB, y: 17.4 * SLAB },
  { x: 18.5 * SLAB, y: 18.4 * SLAB },
];

/** Which corner of the hatch the nth hired man kneels at. */
function spotOf(index: number): Vec {
  return DIG_SPOTS[index % DIG_SPOTS.length];
}

/** The hatch itself: the square of earth the tunnel goes into. */
const HATCH: Vec = { x: 21.5 * SLAB, y: 19.5 * SLAB };

/** The three ways in, as they stand before anybody has touched them. */
const WAYS_IN: readonly { readonly kind: GateKind; readonly at: Vec }[] = [
  { kind: "door", at: { x: 19 * SLAB, y: 2.5 * SLAB } },
  { kind: "gate", at: { x: 39.5 * SLAB, y: 9.5 * SLAB } },
  { kind: "window", at: { x: 0.5 * SLAB, y: 11.5 * SLAB } },
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What each way in is called, for the bar under the picture. */
const GATE_NAMES: Readonly<Record<GateKind, string>> = {
  door: "Vordertür",
  gate: "Ladetor",
  window: "Fenster",
};

/*
 * And the same three with their articles. German will not let a name be
 * dropped into a sentence the way English does - it is die Vordertür but das
 * Ladetor - so the sentence keeps the whole phrase rather than gluing a
 * preposition onto a noun and getting it wrong two times out of three.
 */

/** Where somebody is standing: "an der Vordertür". */
const GATE_AT: Readonly<Record<GateKind, string>> = {
  door: "an der Vordertür",
  gate: "am Ladetor",
  window: "am Fenster",
};

/** Where somebody is going: "an die Vordertür". */
const GATE_TO: Readonly<Record<GateKind, string>> = {
  door: "an die Vordertür",
  gate: "ans Ladetor",
  window: "ans Fenster",
};

/** And the thing itself, as the subject of a sentence: "Die Vordertür". */
const GATE_THE: Readonly<Record<GateKind, string>> = {
  door: "Die Vordertür",
  gate: "Das Ladetor",
  window: "Das Fenster",
};

/**
 * The works at the moment the front door shuts behind the crew.
 *
 * @param time - the simulation clock of the city, so the two agree
 * @param crew - how many hired men came in
 * @returns a fresh job, nothing printed and nothing dug
 */
export function enterMint(time: number, crew: number): MintState {
  return {
    time,
    hero: { x: DOOR_IN.x, y: DOOR_IN.y, heading: Math.PI / 2, walked: 0 },
    crew: Array.from({ length: crew }, (unused, at) => ({
      x: DOOR_IN.x,
      y: DOOR_IN.y,
      heading: Math.PI / 2,
      walked: at * SLAB,
    })),
    staff: STAFF_SPOTS.map((spot) => ({
      x: spot.x,
      y: spot.y,
      heading: Math.PI / 2,
      walked: 0,
      taken: false,
      press: null,
    })),
    gates: WAYS_IN.map((way) => ({
      kind: way.kind,
      at: way.at,
      barricade: 0,
      push: 0,
      busy: false,
    })),
    printed: 0,
    tunnel: 0,
    work: 0,
    calmUntil: 0,
    darkUntil: 0,
    cut: false,
    waveAt: time + WAVE_FIRST,
    waves: 0,
  };
}

/**
 * One step of the job.
 *
 * @param mint - the works as they stand
 * @param input - the keys, the mouse and whatever was pressed in the panel
 * @param dt - seconds since the last step
 * @returns the works one step on, what to say about it, and how it ended
 */
export function advanceMint(
  mint: MintState,
  input: Input,
  dt: number,
): MintTurn {
  const slice = Math.min(dt, MAX_STEP);
  const lines: string[] = [];
  let next: MintState = { ...mint, time: mint.time + slice };
  next = obey(next, input, lines);
  next = walkHero(next, input, slice);
  next = doWork(next, input, slice, lines);
  next = digCrew(next, slice, lines);
  next = runStaff(next, slice);
  next = siege(next, slice, lines);
  let done: MintTurn["done"] = "on";
  if (tileUnder(next.hero.x, next.hero.y) === "out") {
    done = "out";
  } else if (next.gates.some((gate) => gate.push >= 1)) {
    done = "stormed";
  }
  return { mint: next, lines, done };
}

/**
 * What the player is meant to be doing, in one line.
 *
 * @param mint - the works as they stand
 * @returns the task, for the bar under the picture
 * @remarks
 * Whatever is most urgent, and a door somebody is coming through is always the
 * most urgent thing there is. Below that the order is the order of the job:
 * nobody prints until they are told to, and nothing is worth printing if the
 * tunnel is not finished by the time it matters.
 */
export function taskLine(mint: MintState): string {
  const worst = worstGate(mint);
  const printing = sent(mint);
  let line: string;
  if (worst !== null && worst.push > 0) {
    line = `Sie sind ${GATE_AT[worst.kind]}! Hin und Maus halten - verbarrikadieren.`;
  } else if (printing < PRESS_SPOTS.length && free(mint) > 0) {
    line =
      "Geiseln nehmen: hingehen, Maus halten - sie stellen sich an die Pressen.";
  } else if (mint.tunnel < 1) {
    line =
      "Der Tunnel im Keller: die Crew gräbt, mit gehaltener Maus grabt ihr schneller.";
  } else {
    line =
      "Der Tunnel ist offen. Runter, durch - und raus mit allem, was gedruckt ist.";
  }
  return line;
}

/**
 * Where the job in hand is, so the picture can ring it.
 *
 * @param mint - the works as they stand
 * @returns the spot to walk to, or null when there is nothing to stand at
 */
export function markOf(mint: MintState): Vec | null {
  const worst = worstGate(mint);
  const clerk = freeClerk(mint);
  let mark: Vec | null;
  if (worst !== null && worst.push > 0) {
    mark = worst.at;
  } else if (clerk !== null && sent(mint) < PRESS_SPOTS.length) {
    mark = { x: clerk.x, y: clerk.y };
  } else if (mint.tunnel < 1) {
    mark = HATCH;
  } else {
    mark = null;
  }
  return mark;
}

/**
 * What one square of the plan is.
 *
 * @param col - square across, from the west
 * @param row - square down, from the north
 * @returns what stands there, and open ground beyond the edge
 */
export function tileAt(col: number, row: number): Tile {
  const letter =
    col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH
      ? PLAN[row][col]
      : "o";
  return LEGEND[letter] ?? "free";
}

/**
 * What is under a point.
 *
 * @param x - works pixels across
 * @param y - works pixels down
 * @returns what stands there
 */
export function tileUnder(x: number, y: number): Tile {
  return tileAt(Math.floor(x / SLAB), Math.floor(y / SLAB));
}

/**
 * Whether the way through a point is shut.
 *
 * @param tunnel - how far the tunnel has got, which opens the way down
 * @param x - works pixels across
 * @param y - works pixels down
 * @returns true where nobody may walk
 */
export function solid(tunnel: number, x: number, y: number): boolean {
  const kind = tileUnder(x, y);
  let shut: boolean;
  switch (kind) {
    case "wall":
    case "press":
    case "pallet":
    case "desk":
    case "door":
    case "gate":
    case "window":
      shut = true;
      break;
    case "dig":
    case "tunnel":
    case "out":
      // Earth until it is not: the hatch, the tunnel behind it and the way up
      // at the far end all open on the same moment, because they are one hole.
      shut = tunnel < 1;
      break;
    default:
      shut = false;
  }
  return shut;
}

/**
 * Where the presses are, for the picture and for the panel.
 *
 * @returns one spot per machine, where whoever runs it stands
 */
export function pressSpots(): readonly Vec[] {
  return PRESS_SPOTS;
}

/**
 * Where the tunnel is dug.
 *
 * @returns the hatch in the cellar floor
 */
export function hatch(): Vec {
  return HATCH;
}

/**
 * What one of the ways in is called.
 *
 * @param kind - which way in
 * @returns its name, in German, for the ticker and the panel
 */
export function gateName(kind: GateKind): string {
  return GATE_NAMES[kind];
}

/**
 * How many hostages are standing at a machine.
 *
 * @param mint - the works as they stand
 * @returns how many of the presses are running
 */
export function manned(mint: MintState): number {
  return mint.staff.filter(
    (one) => one.press !== null && standingAt(one, PRESS_SPOTS[one.press]),
  ).length;
}

/**
 * Whether one particular machine is running.
 *
 * @param mint - the works as they stand
 * @param press - which machine, counted from the west
 * @returns true when somebody is standing at it and the lights are on
 * @remarks
 * The picture asks this to put a green light on the machine. A press that is
 * manned and a press that is merely spoken for look the same from the door
 * otherwise, and the difference between them is the whole of the money.
 */
export function running(mint: MintState, press: number): boolean {
  return (
    lit(mint) &&
    mint.staff.some(
      (one) => one.press === press && standingAt(one, PRESS_SPOTS[press]),
    )
  );
}

/**
 * Whether the presses are running at all.
 *
 * @param mint - the works as they stand
 * @returns false while the mains are cut
 * @remarks
 * Cutting the power is the strongest thing the player has against the police
 * and it stops his own machines while it lasts. That is the point of it: every
 * way of buying time in here costs money, and this one costs the most.
 */
export function lit(mint: MintState): boolean {
  return mint.time >= mint.darkUntil;
}

/* ------------------------------------------------------------- the people */

/** The keys and the walls. */
function walkHero(mint: MintState, input: Input, dt: number): MintState {
  const hero = mint.hero;
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const length = Math.hypot(dx, dy);
  const pace = WALK_SPEED * (input.boost ? RUN_WALK : 1);
  const step = length === 0 ? 0 : (pace * dt) / length;
  // One axis at a time, so a shoulder against a wall slides along it instead
  // of stopping the whole walk.
  const wantX = hero.x + dx * step;
  const x = clear(mint.tunnel, wantX, hero.y) ? wantX : hero.x;
  const wantY = hero.y + dy * step;
  const y = clear(mint.tunnel, x, wantY) ? wantY : hero.y;
  const went = Math.hypot(x - hero.x, y - hero.y);
  return {
    ...mint,
    hero: {
      x,
      y,
      heading: length === 0 ? hero.heading : Math.atan2(dy, dx),
      walked: hero.walked + went,
    },
  };
}

/** Whether a body may stand with its middle here. */
function clear(tunnel: number, x: number, y: number): boolean {
  return (
    !solid(tunnel, x - HALF_BODY, y - HALF_BODY) &&
    !solid(tunnel, x + HALF_BODY, y - HALF_BODY) &&
    !solid(tunnel, x - HALF_BODY, y + HALF_BODY) &&
    !solid(tunnel, x + HALF_BODY, y + HALF_BODY)
  );
}

/**
 * The mouse held down on whatever is in front of the player.
 *
 * @remarks
 * One button, three jobs, and which one it is doing is a question of where he
 * is standing: at a door it piles things against it, at a clerk it talks him
 * onto a machine, at the hatch it digs. Nothing here is a menu, because the
 * whole difficulty of the job is that the three places are far apart.
 */
function doWork(
  mint: MintState,
  input: Input,
  dt: number,
  lines: string[],
): MintState {
  let next = mint;
  if (input.fire) {
    const gate = nearGate(mint);
    const clerk = freeClerk(mint);
    if (gate !== null) {
      next = pileUp(mint, gate, dt, lines);
    } else if (clerk !== null && away(clerk, mint.hero) < REACH) {
      next = takeHostage(mint, clerk, dt, lines);
    } else if (away(HATCH, mint.hero) < REACH && mint.tunnel < 1) {
      next = { ...mint, tunnel: dug(mint, HERO_DIG, dt) };
    }
  }
  return next;
}

/** Whatever is to hand, piled against the door they are leaning on. */
function pileUp(
  mint: MintState,
  gate: Gate,
  dt: number,
  lines: string[],
): MintState {
  const barricade = Math.min(1, gate.barricade + BUILD_RATE * dt);
  const held = gate.busy && barricade >= GIVE_UP;
  if (held) {
    lines.push(`${GATE_THE[gate.kind]} hält. Sie ziehen sich zurück.`);
  }
  return {
    ...mint,
    gates: mint.gates.map((each) =>
      each.kind === gate.kind
        ? {
            ...each,
            barricade,
            push: Math.max(0, each.push - RETAKE * dt),
            busy: held ? false : each.busy,
          }
        : each,
    ),
  };
}

/** One clerk talked onto a machine, a second and a half at a time. */
function takeHostage(
  mint: MintState,
  clerk: Hostage,
  dt: number,
  lines: string[],
): MintState {
  const work = mint.work + dt / TAKE_SECONDS;
  let next: MintState;
  if (work >= 1) {
    const press = freePress(mint);
    lines.push(
      press === null
        ? "Noch eine Geisel - die Pressen sind aber alle besetzt."
        : "Geisel genommen. Sie geht an die Presse.",
    );
    next = {
      ...mint,
      work: 0,
      staff: mint.staff.map((one) =>
        one === clerk ? { ...one, taken: true, press } : one,
      ),
    };
  } else {
    next = { ...mint, work };
  }
  return next;
}

/** How much of the tunnel this many men get through in this much time. */
function dug(mint: MintState, men: number, dt: number): number {
  return Math.min(1, mint.tunnel + (men * dt) / DIG_SECONDS);
}

/**
 * The hired men: down the stairs, and then they dig.
 *
 * @remarks
 * They need no telling. That is what the money at the door was for, and it is
 * what makes hiring a fifth man worth five hundred euros: the tunnel is the
 * one clock in here that nobody has to stand over.
 */
function digCrew(mint: MintState, dt: number, lines: string[]): MintState {
  const crew = mint.crew.map((man, index) =>
    walkTo(man, spotOf(index), CREW_PACE, dt),
  );
  const diggers = crew.filter((man, index) =>
    standingAt(man, spotOf(index)),
  ).length;
  const tunnel = mint.tunnel < 1 ? dug(mint, diggers, dt) : mint.tunnel;
  if (mint.tunnel < 1 && tunnel >= 1) {
    lines.push("Der Tunnel ist durch! Runter und raus, solange es geht.");
  }
  return { ...mint, crew, tunnel };
}

/**
 * Everybody who works here, one step on.
 *
 * @remarks
 * Two lives in one list. Whoever has been taken walks to the machine he was
 * given and stays at it; whoever has not backs away from the man with the gun
 * and otherwise stands very still.
 */
function runStaff(mint: MintState, dt: number): MintState {
  const printers = manned(mint);
  const printed =
    lit(mint) && printers > 0
      ? mint.printed + printers * PRESS_RATE * dt
      : mint.printed;
  return {
    ...mint,
    printed,
    staff: mint.staff.map((one) => stepStaff(one, mint, dt)),
  };
}

/** One of them, one step on: to a machine, out of the way, or still. */
function stepStaff(one: Hostage, mint: MintState, dt: number): Hostage {
  let next: Hostage;
  if (one.press !== null) {
    next = toPress(one, dt);
  } else if (one.taken) {
    // Taken while every machine was busy: hands up, and no further trouble.
    next = one;
  } else {
    next = shyOf(one, mint, dt);
  }
  return next;
}

/** A hostage on his way to the machine he was sent to, or standing at it. */
function toPress(one: Hostage, dt: number): Hostage {
  const spot = PRESS_SPOTS[one.press ?? 0];
  const moved = walkTo(one, spot, HOSTAGE_PACE, dt);
  return { ...one, ...moved };
}

/** Somebody who has not been taken yet, keeping out of the way. */
function shyOf(one: Hostage, mint: MintState, dt: number): Hostage {
  const gap = away(mint.hero, one);
  let next = one;
  if (gap < SHY && gap > SHY_HOLD) {
    const heading = Math.atan2(one.y - mint.hero.y, one.x - mint.hero.x);
    const wantX = one.x + Math.cos(heading) * SHY_PACE * dt;
    const wantY = one.y + Math.sin(heading) * SHY_PACE * dt;
    const x = clear(mint.tunnel, wantX, one.y) ? wantX : one.x;
    const y = clear(mint.tunnel, x, wantY) ? wantY : one.y;
    next = {
      ...one,
      x,
      y,
      heading,
      walked: one.walked + Math.hypot(x - one.x, y - one.y),
    };
  }
  return next;
}

/** One figure, one step towards a spot, stopping when it is there. */
function walkTo(who: Inmate, spot: Vec, pace: number, dt: number): Inmate {
  const gap = away(spot, who);
  let next = who;
  if (gap > AT_WORK) {
    const heading = Math.atan2(spot.y - who.y, spot.x - who.x);
    const step = Math.min(gap, pace * dt);
    next = {
      x: who.x + Math.cos(heading) * step,
      y: who.y + Math.sin(heading) * step,
      heading,
      walked: who.walked + step,
    };
  }
  return next;
}

/* -------------------------------------------------------------- the siege */

/**
 * The police, at three doors, for as long as this takes.
 *
 * @remarks
 * A squad turns up every so often at whichever way in is the least defended,
 * and from then on it is arithmetic: what they get through a door is what the
 * pile against it does not stop, and the pile goes down while they work on it.
 * Nothing here ever finishes on its own - a squad that is left alone comes
 * through, a door that is held long enough sends them away - which is why the
 * player spends the whole job walking from one end of the building to the
 * other.
 */
function siege(mint: MintState, dt: number, lines: string[]): MintState {
  const calm = mint.time < mint.calmUntil;
  const due = mint.time >= mint.waveAt && !calm;
  const target = due ? weakest(mint) : null;
  if (target !== null) {
    lines.push(`Sie gehen ${GATE_TO[target.kind]}!`);
  }
  return {
    ...mint,
    waves: due ? mint.waves + 1 : mint.waves,
    waveAt: due ? mint.time + WAVE_EVERY : mint.waveAt,
    gates: mint.gates.map((gate) =>
      lean(gate, gate.kind === target?.kind, calm, dt),
    ),
  };
}

/** One door, one step of whatever is happening to it. */
function lean(gate: Gate, joined: boolean, calm: boolean, dt: number): Gate {
  const busy = (gate.busy || joined) && !calm;
  const rate = PUSH_RATE * (1 - SHIELD * gate.barricade);
  return {
    ...gate,
    busy,
    push: busy
      ? Math.min(1, gate.push + rate * dt)
      : Math.max(0, gate.push - FADE * dt),
    barricade: busy ? Math.max(0, gate.barricade - WEAR * dt) : gate.barricade,
  };
}

/** Which way in they will try next: whichever is the least trouble. */
function weakest(mint: MintState): Gate {
  return mint.gates.reduce((worst, gate) =>
    gate.barricade + gate.push * 2 < worst.barricade + worst.push * 2
      ? gate
      : worst,
  );
}

/** Whichever door is furthest through, or null while all three are quiet. */
function worstGate(mint: MintState): Gate | null {
  const worst = mint.gates.reduce((most, gate) =>
    gate.push > most.push ? gate : most,
  );
  return worst.push > 0 || worst.busy ? worst : null;
}

/** The door the player is standing at, or null. */
function nearGate(mint: MintState): Gate | null {
  return (
    mint.gates.find((gate) => away(gate.at, mint.hero) < REACH + SLAB) ?? null
  );
}

/* ------------------------------------------------------------ the buttons */

/**
 * The two things that are pressed rather than walked to.
 *
 * @remarks
 * Both buy quiet and both cost something. Letting somebody out of the front
 * door costs a pair of hands at a machine for the rest of the job; cutting the
 * mains costs every machine for as long as the dark lasts, and it can only be
 * done once. A third way of buying time that cost nothing would make the other
 * two pointless.
 */
function obey(mint: MintState, input: Input, lines: string[]): MintState {
  const order = input.order;
  let next = mint;
  if (order?.kind === "release") {
    next = letGo(mint, lines);
  } else if (order?.kind === "power" && !mint.cut) {
    lines.push(
      "Der Strom ist weg. Drinnen und draußen tappt alles im Dunkeln.",
    );
    next = {
      ...mint,
      cut: true,
      darkUntil: mint.time + POWER_CALM,
      calmUntil: mint.time + POWER_CALM,
      gates: mint.gates.map((gate) => ({ ...gate, busy: false })),
    };
  }
  return next;
}

/** One hostage out of the front door, and a quarter of an hour of quiet. */
function letGo(mint: MintState, lines: string[]): MintState {
  const going = mint.staff.find((one) => one.taken) ?? null;
  let next = mint;
  if (going !== null) {
    lines.push("Eine Geisel ist raus. Sie warten erst mal ab.");
    next = {
      ...mint,
      calmUntil: mint.time + RELEASE_CALM,
      staff: mint.staff.filter((one) => one !== going),
      gates: mint.gates.map((gate) => ({ ...gate, busy: false })),
    };
  }
  return next;
}

/* --------------------------------------------------------------- counting */

/** How many of them have been sent to a machine. */
function sent(mint: MintState): number {
  return mint.staff.filter((one) => one.press !== null).length;
}

/** How many of the people in here have not been taken yet. */
function free(mint: MintState): number {
  return mint.staff.filter((one) => !one.taken).length;
}

/** The nearest of them to the player, or null once they are all taken. */
function freeClerk(mint: MintState): Hostage | null {
  let best: Hostage | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const one of mint.staff) {
    const gap = away(one, mint.hero);
    if (!one.taken && gap < bestAway) {
      best = one;
      bestAway = gap;
    }
  }
  return best;
}

/** The lowest machine nobody has been sent to, or null when all are taken. */
function freePress(mint: MintState): number | null {
  const taken = mint.staff.map((one) => one.press);
  const at = PRESS_SPOTS.findIndex((unused, index) => !taken.includes(index));
  return at < 0 ? null : at;
}

/** How far apart two points are, in works pixels. */
function away(one: Vec, two: Vec): number {
  return Math.hypot(one.x - two.x, one.y - two.y);
}

/** Whether somebody is standing at a spot. */
function standingAt(who: Vec, spot: Vec): boolean {
  return away(who, spot) <= AT_WORK;
}
