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
 * **Four clocks run at once, and each of them belongs to somebody else.** The
 * willing hostages print, and only while one of one's own men is watching
 * them. The unwilling ones dig, for the same reason. The director walks
 * towards the telephone in his office. And the police outside take up their
 * positions, then lean on three doors, and in the end drive a tank up to the
 * front of the building. That is the whole design: every job needs a different
 * pair of hands, so the minute in which all four need doing is the minute the
 * job is decided in.
 *
 * North is up, and **one comes in from the south**, the same way one walks
 * into the bank: the shutter is in the near wall and opens into the hall, the
 * director's office is off the west side of it and the strongroom off the
 * east, the press room fills the middle, and past it the cellar with the
 * hatch. The tunnel runs north from the hatch and comes up in the street
 * behind the building - the far end from the way in, which is the shape of the
 * job: every step towards it is a step further from the door they are pushing.
 *
 * The plan is fixed, like the city and the jail. A job is a route learned by
 * heart, and a building that reshuffled itself between attempts would be a
 * maze instead of a plan.
 */
import {
  AT_WORK,
  BOSS_PACE,
  BUILD_RATE,
  CALL_SECONDS,
  CREW_LEAVE,
  CREW_PACE,
  CREW_THINK,
  DIG_SECONDS,
  COP_BEAT,
  COP_PACE,
  FADE,
  FOOD_AFTER,
  FOOD_WAIT,
  GIVE_UP,
  GUN_RANGE,
  GUN_SPOT,
  HALF_BODY,
  HERO_DIG,
  HOSTAGE_PACE,
  LED_GAP,
  MAX_STEP,
  OPEN_RATE,
  POWER_AGAIN,
  POWER_CALM,
  PRESS_RATE,
  PUSH_RATE,
  REACH,
  RELEASE_CALM,
  RETAKE,
  RUN_WALK,
  SETTLE_SECONDS,
  SHIELD,
  SHOT_GAP,
  SHUTTER_PUSH,
  SHY,
  SHY_HOLD,
  SHY_PACE,
  SLAB,
  SLACK_LEAST,
  SLACK_SPREAD,
  STORM_PUSH,
  STORM_SHOT,
  MINT_TANK_HITS,
  OPEN_GRACE,
  TANK_PACE,
  TANK_PUSH,
  TANK_SHELL,
  TANK_WAVE,
  WALK_SPEED,
  WAVE_EVERY,
  WAVE_FIRST,
  WEAR,
  WILLING_SHARE,
  type Boss,
  type BulletShape,
  type Gate,
  type GateKind,
  type Hostage,
  type Inmate,
  type Input,
  type MintState,
  type Siren,
  type Tile,
  type Vec,
} from "./types";
import { WEAPONS, type WeaponKind } from "./weapons";

/**
 * The works and the street round them, one letter per square.
 *
 * @remarks
 * The building stands in the middle with the road all the way round it, and
 * the road is drawn because **the siege is half of this job**: one has to be
 * able to see them arrive, see the tent go up across the street, and see the
 * tank come up the middle of it. A siege one only learns about from a bar
 * under the picture is a bar, not a siege.
 */
export const PLAN: readonly string[] = [
  "ssssssssssssssssssssssssss",
  "ssssssssssssssssssssssssss",
  "sssssEssssssssssssssssssss",
  "sss##~#################sss",
  "sss#cXcccccccccc#VVVVV#sss",
  "sss#ccccccccccccvVVVVV#sss",
  "sss#cccccccccccc#VVVVV#sss",
  "sss####...####...######sss",
  "sss#,,,,,,,,,,,,,,,,,,#sss",
  "sss#,,,,,,,,,,,,,,,,,,Gsss",
  "sssF,,,,,,,,,,,,,,,,,,#sss",
  "sss#,PPP,,PPP,,PPP,,,,#sss",
  "sss#,,,,,,,,,,,,,,,,,,#sss",
  "sss###...#######...####sss",
  "sss#BBBBB#............#sss",
  "sss#BHBBB.............#sss",
  "sss#BBBBB#............#sss",
  "sss#BBBBB#.......dd...#sss",
  "sss#########TTT########sss",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "ssssssssssssssssssssssssss",
  "ssssssssssssssssssssssssss",
  "ssssssssssttttttssssssssss",
  "ssssssssssssssssssssssssss",
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
  B: "office",
  H: "phone",
  V: "vault",
  v: "vaultDoor",
  "?": "vault",
  T: "shutter",
  G: "gate",
  F: "window",
  c: "cellar",
  X: "dig",
  "~": "tunnel",
  E: "out",
  s: "street",
  k: "kerb",
  t: "tent",
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

/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers below are
   places on the plan above: which square a press stands on, where the police
   line up, which wall a gate is in. They are a map, not arithmetic. */

/** Where the player comes in: just inside the shutter. */
const DOOR_IN: Vec = { x: 13 * SLAB, y: 16.6 * SLAB };

/** Where somebody stands who is running a press, one spot per machine. */
const PRESS_SPOTS: readonly Vec[] = [
  { x: 6.5 * SLAB, y: 12.5 * SLAB },
  { x: 11.5 * SLAB, y: 12.5 * SLAB },
  { x: 16.5 * SLAB, y: 12.5 * SLAB },
];

/** Where the people who work here are when the shutter comes down. */
const STAFF_SPOTS: readonly Vec[] = [
  { x: 6.5 * SLAB, y: 9.5 * SLAB },
  { x: 14.5 * SLAB, y: 8.5 * SLAB },
  { x: 19.5 * SLAB, y: 11.5 * SLAB },
  { x: 8.5 * SLAB, y: 12.5 * SLAB },
  { x: 12.5 * SLAB, y: 15.5 * SLAB },
  { x: 18.5 * SLAB, y: 16.5 * SLAB },
];

/** Where the director stands when the shutter comes down. */
const BOSS_SPOT: Vec = { x: 18.5 * SLAB, y: 9.5 * SLAB };

/** And the telephone in his office, which is what he is walking to. */
const PHONE: Vec = { x: 5.5 * SLAB, y: 15.5 * SLAB };

/** The hatch: the square of floor at the back left the tunnel goes into. */
const HATCH: Vec = { x: 5.5 * SLAB, y: 4.5 * SLAB };

/** Where a man put on the hatch stands, and where hostages dig. */
const DIG_SPOTS: readonly Vec[] = [
  { x: 4.5 * SLAB, y: 5.5 * SLAB },
  { x: 6.5 * SLAB, y: 5.5 * SLAB },
  { x: 5.5 * SLAB, y: 5.8 * SLAB },
  { x: 7.5 * SLAB, y: 5.5 * SLAB },
  { x: 6.5 * SLAB, y: 4.5 * SLAB },
  { x: 8.5 * SLAB, y: 5.5 * SLAB },
];

/** The three ways in, as they stand before anybody has touched them. */
const WAYS_IN: readonly { readonly kind: GateKind; readonly at: Vec }[] = [
  { kind: "door", at: { x: 13 * SLAB, y: 18.5 * SLAB } },
  { kind: "gate", at: { x: 22.5 * SLAB, y: 9.5 * SLAB } },
  { kind: "window", at: { x: 3.5 * SLAB, y: 10.5 * SLAB } },
];

/** Where the men outside stand once they have taken up their positions. */
const COP_SPOTS: readonly {
  readonly at: Vec;
  readonly kind: Siren["kind"];
}[] = [
  { at: { x: 9.5 * SLAB, y: 20.5 * SLAB }, kind: "line" },
  { at: { x: 12.5 * SLAB, y: 20.5 * SLAB }, kind: "line" },
  { at: { x: 15.5 * SLAB, y: 20.5 * SLAB }, kind: "line" },
  { at: { x: 12.5 * SLAB, y: 22.5 * SLAB }, kind: "command" },
  { at: { x: 14.5 * SLAB, y: 22.5 * SLAB }, kind: "command" },
  { at: { x: 24.5 * SLAB, y: 9.5 * SLAB }, kind: "assault" },
  { at: { x: 1.5 * SLAB, y: 10.5 * SLAB }, kind: "assault" },
];

/** Where the tank stops, square on to the shutter. */
const TANK_SPOT: Vec = { x: 13 * SLAB, y: 20.5 * SLAB };

/** And where it rolls in from. */
const TANK_START: Vec = { x: 25 * SLAB, y: 20.5 * SLAB };

/** Where they stand when they are working on a way in: just outside it. */
const OUTSIDE: Readonly<Record<GateKind, Vec>> = {
  door: { x: 12 * SLAB, y: 19.5 * SLAB },
  gate: { x: 23.5 * SLAB, y: 9.5 * SLAB },
  window: { x: 1.5 * SLAB, y: 10.5 * SLAB },
};

/** Where the van with the food pulls up. */
const FOOD_SPOT: Vec = { x: 13 * SLAB, y: 19.5 * SLAB };

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Every station a man can be put on: the five presses, then the hatch. */
const POSTS: readonly Vec[] = [...PRESS_SPOTS, HATCH];

/** Which post is the hatch. */
const HATCH_POST = PRESS_SPOTS.length;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the handful below are
   how far one has to stand from a thing to use it, in multiples of a square
   or of one's own reach. They are distances, not arithmetic. */

/** How far from a press one has to stand to put somebody at it. */
const PUT_REACH = REACH * 1.6;

/** And how far from the hatch, which is a bigger thing to stand at. */
const HATCH_REACH = REACH * 2.2;

/** How near a station a man counts as watching it, in works pixels. */
const WATCH_REACH = SLAB * 1.5;

/** How near one of one's own has to get to talk somebody onto a machine. */
const TALK_REACH = REACH * 1.5;

/** How far one may be from a station to leave a man on it. */
const POST_REACH = SLAB * 2;

/** Half way, which is where a shutter counts as open. */
const HALF_UP = 0.5;

/** How far apart the men who follow one about string out, in pixels. */
const CREW_STRING = 12;

/** How much the last of the three sorts of slack is spread, as a share. */
const SLACK_STEP = 3;

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What each way in is called, for the bar under the picture. */
const GATE_NAMES: Readonly<Record<GateKind, string>> = {
  door: "Tor",
  gate: "Ladetor",
  window: "Fenster",
};

/*
 * And the same three with their articles. German will not let a name be
 * dropped into a sentence the way English does - it is die Vordertür but das
 * Ladetor - so the sentence keeps the whole phrase rather than gluing a
 * preposition onto a noun and getting it wrong two times out of three.
 */

/** Where somebody is standing: "am Tor". */
const GATE_AT: Readonly<Record<GateKind, string>> = {
  door: "am Tor",
  gate: "am Ladetor",
  window: "am Fenster",
};

/** Where somebody is going: "ans Tor". */
const GATE_TO: Readonly<Record<GateKind, string>> = {
  door: "ans Tor",
  gate: "ans Ladetor",
  window: "ans Fenster",
};

/** And the thing itself, as the subject of a sentence: "Das Tor". */
const GATE_THE: Readonly<Record<GateKind, string>> = {
  door: "Das Tor",
  gate: "Das Ladetor",
  window: "Das Fenster",
};

/**
 * The works at the moment the shutter comes down behind the crew.
 *
 * @param time - the simulation clock of the city, so the two agree
 * @param crew - how many hired men came in
 * @param rng - a number between nought and one per person, for who will work
 * @returns a fresh job, nothing printed and nothing dug
 * @remarks
 * **Who is willing is decided here and never shown.** It has to be decided
 * once rather than when they are first asked, or a hostage would change his
 * mind depending on when one got round to him.
 */
export function enterMint(
  time: number,
  crew: number,
  rng: (at: number) => number = everyOther,
): MintState {
  return {
    time,
    hero: { x: DOOR_IN.x, y: DOOR_IN.y, heading: -Math.PI / 2, walked: 0 },
    aim: { x: DOOR_IN.x, y: DOOR_IN.y - SLAB * 2 },
    shotAt: 0,
    crew: Array.from({ length: crew }, (unused, at) => ({
      x: DOOR_IN.x,
      y: DOOR_IN.y,
      heading: -Math.PI / 2,
      walked: at * SLAB,
      post: null,
      errand: null,
    })),
    staff: STAFF_SPOTS.map((spot, at) => ({
      x: spot.x,
      y: spot.y,
      heading: Math.PI / 2,
      walked: 0,
      taken: false,
      led: false,
      press: null,
      digging: false,
      willing: rng(at) < WILLING_SHARE,
      slackAt: null,
      slacking: false,
      alive: true,
    })),
    boss: {
      x: BOSS_SPOT.x,
      y: BOSS_SPOT.y,
      heading: Math.PI / 2,
      walked: 0,
      taken: false,
      led: false,
      alive: true,
      called: false,
    },
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
    dark: false,
    powerAt: 0,
    shots: [],
    nextShot: 1,
    openAt: null,
    storming: false,
    waveAt: time + SETTLE_SECONDS + WAVE_FIRST,
    waves: 0,
    shutter: 0,
    opening: false,
    settleAt: time + SETTLE_SECONDS,
    cops: COP_SPOTS.map((spot) => ({
      // They come up the road from the east, which is where the city is.
      x: PLAN_WIDE * SLAB,
      y: spot.at.y,
      heading: Math.PI,
      walked: 0,
      spot: spot.at,
      kind: spot.kind,
    })),
    tank: null,
    foodAt: time + FOOD_AFTER,
    fed: false,
    phone: true,
  };
}

/** Half of them, and the same half every time: see {@link enterMint}. */
function everyOther(at: number): number {
  return at % 2 === 0 ? 0 : 1;
}

/**
 * One step of the job.
 *
 * @param mint - the works as they stand
 * @param input - the keys, the mouse and whatever was pressed in the panel
 * @param dt - seconds since the last step
 * @param weapon - what is in the player's hand
 * @returns the works one step on, what to say about it, and how it ended
 */
export function advanceMint(
  mint: MintState,
  input: Input,
  dt: number,
  weapon: WeaponKind,
): MintTurn {
  const slice = Math.min(dt, MAX_STEP);
  const lines: string[] = [];
  let next: MintState = { ...mint, time: mint.time + slice };
  next = obey(next, input, lines);
  next = walkHero(next, input, slice);
  next = pullTrigger(next, input, slice, weapon, lines);
  next = doWork(next, input, slice, lines);
  next = putToWork(next, lines);
  next = runShutter(next, slice, lines);
  next = runStaff(next, slice, lines);
  next = runBoss(next, slice, lines);
  next = mindCrew(next, lines);
  next = runCrew(next, slice);
  next = dig(next, slice, lines);
  next = police(next, slice, lines);
  next = theTank(next, slice, lines);
  next = theFood(next, lines);
  next = flyShots(next, slice);
  next = theOpenDoor(next, slice, lines);
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
 * find out who will print, put the rest in the cellar, and have the tunnel
 * finished by the time the tank turns up.
 */
export function taskLine(mint: MintState): string {
  const worst = worstGate(mint);
  const led = ledOne(mint);
  let line: string;
  if (mint.tank !== null && mint.tank.health > 0) {
    line = "Panzer vor dem Tor! Tor auf und die Panzerfaust drauf.";
  } else if (waiting(mint)) {
    line = "Essen ist am Tor. Tor auf, sonst werden sie drinnen unruhig.";
  } else if (worst !== null && worst.push > 0) {
    line = `Sie sind ${GATE_AT[worst.kind]}! Hin und Maus halten - verbarrikadieren.`;
  } else if (led !== null) {
    line = "Geisel im Schlepptau: an eine Presse oder runter an den Schacht.";
  } else if (!mint.boss.taken && mint.boss.alive && mint.phone) {
    line = "Der Direktor will ans Telefon. Waffe auf ihn richten.";
  } else if (freeOne(mint) !== null) {
    line = "Waffe auf die Leute richten - wer im Anschlag steht, kommt mit.";
  } else if (mint.tunnel < 1) {
    line = "Der Tunnel im Keller: Grabende bewachen lassen, selbst mitgraben.";
  } else {
    line = "Der Tunnel ist offen. Runter, durch - und raus mit allem.";
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
  const led = ledOne(mint);
  const free = freeOne(mint);
  let mark: Vec | null;
  if (waiting(mint) || (mint.tank !== null && mint.tank.health > 0)) {
    mark = { x: WAYS_IN[0].at.x, y: WAYS_IN[0].at.y };
  } else if (worst !== null && worst.push > 0) {
    mark = worst.at;
  } else if (led !== null) {
    mark = freePress(mint) === null ? HATCH : PRESS_SPOTS[freePress(mint) ?? 0];
  } else if (!mint.boss.taken && mint.boss.alive && mint.phone) {
    mark = { x: mint.boss.x, y: mint.boss.y };
  } else if (free !== null) {
    mark = { x: free.x, y: free.y };
  } else if (mint.tunnel < 1) {
    mark = HATCH;
  } else {
    mark = null;
  }
  return mark;
}

/* ---------------------------------------------------------------- the plan */

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
 * @param mint - the works as they stand
 * @param x - works pixels across
 * @param y - works pixels down
 * @returns true where nobody may walk
 * @remarks
 * **The street outside is shut to the player**, and that is the point of the
 * job rather than a fence: the way out is the tunnel. The shutter is shut to
 * him as well, whether it is up or down - one does not walk out of the front
 * of a building with four hundred policemen in front of it.
 */
export function solid(mint: MintState, x: number, y: number): boolean {
  const kind = tileUnder(x, y);
  let shut: boolean;
  switch (kind) {
    case "wall":
    case "press":
    case "pallet":
    case "desk":
    case "door":
    case "shutter":
    case "gate":
    case "window":
    case "street":
    case "kerb":
    case "tent":
    case "free":
      shut = true;
      break;
    case "phone":
      // The telephone table: furniture, and the reason the office has a shape.
      shut = true;
      break;
    case "dig":
    case "tunnel":
      // Earth until it is not: the hatch and the tunnel behind it open on the
      // same moment, because they are one hole.
      shut = mint.tunnel < 1;
      break;
    case "out":
      shut = mint.tunnel < 1;
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
 * Where a man may be posted.
 *
 * @returns the five presses and then the hatch
 */
export function postSpots(): readonly Vec[] {
  return POSTS;
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
 * Where the telephone stands.
 *
 * @returns the spot in the director's office
 */
export function phoneSpot(): Vec {
  return PHONE;
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
 * Whether one particular machine is running.
 *
 * @param mint - the works as they stand
 * @param press - which machine, counted from the west
 * @returns true when somebody is working it and the lights are on
 * @remarks
 * The picture asks this to put a green light on the machine. A press that is
 * manned and a press that is merely spoken for look the same from the door
 * otherwise, and the difference between them is the whole of the money.
 */
export function running(mint: MintState, press: number): boolean {
  return (
    lit(mint) &&
    mint.staff.some((one) => one.press === press && works(one, mint, press))
  );
}

/**
 * How many machines are actually earning.
 *
 * @param mint - the works as they stand
 * @returns the number of them with somebody working at them
 */
export function manned(mint: MintState): number {
  return PRESS_SPOTS.filter((unused, at) => running(mint, at)).length;
}

/**
 * Whether the presses are running at all.
 *
 * @param mint - the works as they stand
 * @returns false while the mains are cut
 */
export function lit(mint: MintState): boolean {
  return !mint.dark;
}

/**
 * Whether the police have finished taking up their positions.
 *
 * @param mint - the works as they stand
 * @returns false during the first minute, while they are still arriving
 * @remarks
 * **The quiet at the start is the plan.** A siege that begins the moment the
 * shutter comes down is a fight; a siege that begins a minute later is a job
 * with an opening in it, and the opening is where one sorts the staff out.
 */
export function ready(mint: MintState): boolean {
  return mint.time >= mint.settleAt;
}

/**
 * Whether the food is standing at the door right now.
 *
 * @param mint - the works as they stand
 * @returns true during the minute it is waiting outside
 */
export function waiting(mint: MintState): boolean {
  const due = mint.foodAt;
  return due !== null && mint.time >= due && mint.time < due + FOOD_WAIT;
}

/**
 * Who the crosshair is on, or null.
 *
 * @param mint - the works as they stand
 * @returns the person the gun has found, and null for the wall beside them
 * @remarks
 * Exported because the picture has to draw the ring: whether one is covering
 * the director or the filing cabinet behind him is the whole of the first
 * minute, and a player who cannot see which has been given a puzzle rather
 * than a robbery.
 */
export function underTheGun(mint: MintState): Hostage | Boss | null {
  let best: Hostage | Boss | null = null;
  let bestAway = GUN_SPOT;
  for (const one of [...mint.staff, mint.boss]) {
    const spot = away(one, mint.aim);
    if (
      one.alive &&
      spot < bestAway &&
      away(one, mint.hero) < GUN_RANGE &&
      inSight(mint, mint.hero, one)
    ) {
      best = one;
      bestAway = spot;
    }
  }
  return best;
}

/**
 * Whether one point can see another.
 *
 * @param mint - the works as they stand
 * @param from - where the gun is
 * @param to - and what it is pointed at
 * @returns true when nothing solid stands between them
 */
function inSight(mint: MintState, from: Vec, to: Vec): boolean {
  const gap = away(from, to);
  const steps = Math.ceil(gap / (SLAB / 2));
  let clear = true;
  for (let step = 1; step < steps; step += 1) {
    const part = step / steps;
    const kind = tileUnder(
      from.x + (to.x - from.x) * part,
      from.y + (to.y - from.y) * part,
    );
    if (kind === "wall" || kind === "press" || kind === "pallet") {
      clear = false;
    }
  }
  return clear && mint.tunnel >= 0;
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
  const x = clear(mint, wantX, hero.y) ? wantX : hero.x;
  const wantY = hero.y + dy * step;
  const y = clear(mint, x, wantY) ? wantY : hero.y;
  const went = Math.hypot(x - hero.x, y - hero.y);
  // **Where he walks and where he looks are two questions in here.** The mouse
  // is the gun, and the gun is how one takes a building full of people.
  const aim = input.aim;
  return {
    ...mint,
    aim,
    hero: {
      x,
      y,
      heading: Math.atan2(aim.y - y, aim.x - x),
      walked: hero.walked + went,
    },
  };
}

/** Whether a body may stand with its middle here. */
function clear(mint: MintState, x: number, y: number): boolean {
  return (
    !solid(mint, x - HALF_BODY, y - HALF_BODY) &&
    !solid(mint, x + HALF_BODY, y - HALF_BODY) &&
    !solid(mint, x - HALF_BODY, y + HALF_BODY) &&
    !solid(mint, x + HALF_BODY, y + HALF_BODY)
  );
}

/**
 * The gun: whoever is in the crosshair puts their hands up, and the trigger
 * takes them out of the job for good.
 *
 * @param mint - the works as they stand
 * @param input - the keys and the mouse this frame
 * @param dt - seconds since the last step
 * @param weapon - what is in the player's hand
 * @param lines - what to say about it
 * @returns the works one step on
 * @remarks
 * **Pointing is enough.** Holding a button down on somebody was a tool; a gun
 * is not a tool. Whoever is covered gives up on the spot and walks at one's
 * shoulder until one puts them somewhere - and the trigger is the other
 * decision, the one that cannot be taken back: a dead hostage prints nothing
 * and a dead director never opens anything.
 */
function pullTrigger(
  mint: MintState,
  input: Input,
  dt: number,
  weapon: WeaponKind,
  lines: string[],
): MintState {
  const held = underTheGun(mint);
  // **A fist is not a threat.** Whoever is covered gives up because there is
  // a barrel pointing at them; pointing a knife at a room full of people who
  // can walk away is not the same offer, and the door outside does not open
  // for anybody who has not got a gun anyway.
  const armed = WEAPONS[weapon].rounds !== 0;
  let next = mint;
  // Covering somebody is what takes them: no button, no clock.
  if (armed && held !== null && !held.taken) {
    next = cowed(next, held, lines);
  }
  if (input.fire && mint.time >= mint.shotAt && armed) {
    // **A shot one can see.** The line from the muzzle to whatever it went
    // into is drawn for a moment - see Flash - because a tank that falls over
    // with nothing in between looks like a bug rather than a rocket.
    next = fire(next, next.hero, next.aim, weapon);
    const tank = next.tank;
    if (
      weapon === "rpg" &&
      tank !== null &&
      tank.health > 0 &&
      next.shutter > HALF_UP
    ) {
      next = hitTank(next, lines);
    } else if (held !== null) {
      next = shoot(next, held, lines);
    } else if (
      next.phone &&
      away(next.aim, PHONE) < SLAB &&
      away(next.hero, PHONE) < GUN_RANGE &&
      inSight(next, next.hero, PHONE)
    ) {
      // **The other way to deal with the telephone**, and the loud one: a
      // shot through it ends that clock for good.
      lines.push(
        "Das Telefon ist Schrott. Der Direktor kann laufen, wohin er will.",
      );
      next = { ...next, phone: false };
    }
  }
  return next;
}

/**
 * One round on its way, drawn the way the street draws the same round.
 *
 * @param mint - the works as they stand
 * @param from - where it comes out
 * @param at - what it was aimed at
 * @param weapon - what fired it
 * @returns the works with it in the air
 * @remarks
 * **Nothing in here is hit by it.** What the shot did was decided the moment
 * the trigger went - see {@link pullTrigger} - so the round itself is only a
 * picture, and it is the city's picture: a tracer out of a pistol, a tongue of
 * flame out of the flamethrower, a rocket out of the launcher.
 */
function fire(
  mint: MintState,
  from: Vec,
  at: Vec,
  weapon: WeaponKind,
): MintState {
  const gun = WEAPONS[weapon];
  const shape: BulletShape =
    weapon === "flamer"
      ? "flame"
      : weapon === "rpg"
        ? "rocket"
        : weapon === "grenade"
          ? "grenade"
          : "shot";
  const angle = Math.atan2(at.y - from.y, at.x - from.x);
  const reach = Math.max(SLAB, Math.min(gun.range, away(from, at)));
  return {
    ...mint,
    shotAt: mint.time + SHOT_GAP,
    nextShot: mint.nextShot + 1,
    shots: [
      ...mint.shots,
      {
        id: mint.nextShot,
        x: from.x + Math.cos(angle) * MUZZLE,
        y: from.y + Math.sin(angle) * MUZZLE,
        angle,
        left: reach,
        reach,
        speed: gun.speed,
        damage: 0,
        shape,
        from: "player",
        blowAt: null,
      },
    ],
  };
}

/** How far in front of somebody a round leaves the barrel, in pixels. */
const MUZZLE = 15;

/**
 * Everything in the air, one step on.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @returns the works with the rounds moved and the spent ones gone
 */
function flyShots(mint: MintState, dt: number): MintState {
  return {
    ...mint,
    shots: mint.shots
      .map((shot) => ({
        ...shot,
        x: shot.x + Math.cos(shot.angle) * shot.speed * dt,
        y: shot.y + Math.sin(shot.angle) * shot.speed * dt,
        left: shot.left - shot.speed * dt,
      }))
      .filter((shot) => shot.left > 0),
  };
}

/** Whoever is under the gun gives up and comes along. */
function cowed(
  mint: MintState,
  who: Hostage | Boss,
  lines: string[],
): MintState {
  let next = mint;
  if (who === mint.boss) {
    lines.push("Der Direktor hebt die Hände. Der geht jetzt, wohin du sagst.");
    next = { ...next, boss: { ...next.boss, taken: true, led: true } };
  } else {
    next = {
      ...next,
      staff: next.staff.map((one) =>
        one === who ? { ...one, taken: true, led: true } : one,
      ),
    };
  }
  return next;
}

/** And the other decision: the one that cannot be taken back. */
function shoot(
  mint: MintState,
  who: Hostage | Boss,
  lines: string[],
): MintState {
  let next = mint;
  if (who === mint.boss) {
    lines.push("Der Direktor liegt. Ans Telefon geht er nicht mehr.");
    next = { ...next, boss: { ...next.boss, alive: false, taken: true } };
  } else {
    lines.push("Eine Geisel weniger. Die druckt jetzt gar nichts mehr.");
    next = {
      ...next,
      staff: next.staff.map((one) =>
        one === who
          ? { ...one, alive: false, led: false, press: null, digging: false }
          : one,
      ),
    };
  }
  // A shot inside is heard outside, and they stop waiting so politely.
  return {
    ...next,
    calmUntil: 0,
    waveAt: Math.min(next.waveAt, next.time + WAVE_FIRST),
  };
}

/**
 * The mouse held down on a door or on the earth.
 *
 * @param mint - the works as they stand
 * @param input - the keys and the mouse this frame
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works one step on
 * @remarks
 * What is left for the held button now that people are taken by pointing at
 * them: the two jobs that are work rather than threat - piling furniture
 * against a door one is standing at, and digging at the hatch oneself.
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
    if (gate !== null) {
      next = pileUp(mint, gate, dt, lines);
    } else if (away(HATCH, mint.hero) < REACH * 2 && mint.tunnel < 1) {
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

/**
 * Whoever is walking at one's shoulder, put down where one is standing.
 *
 * @param mint - the works as they stand
 * @param lines - what to say about it
 * @returns the works with them at a machine or in the cellar
 * @remarks
 * **Walking them there is the instruction.** One does not tell a hostage which
 * press to use; one takes them to it and lets go, and where one lets go is
 * what they do from then on. It also means the two halves of the job are two
 * walks - up to the machines, down to the hatch - which is what the building
 * is laid out for.
 */
function putToWork(mint: MintState, lines: string[]): MintState {
  const led = ledOne(mint);
  let next = mint;
  if (led !== null) {
    const press = PRESS_SPOTS.findIndex(
      (spot) => away(spot, mint.hero) < PUT_REACH && freeAt(mint, spot),
    );
    const atHatch = away(HATCH, mint.hero) < HATCH_REACH;
    if (press >= 0) {
      lines.push(`An Presse ${String(press + 1)}. Mal sehen, ob sie mitmacht.`);
      next = {
        ...next,
        staff: next.staff.map((one) =>
          one === led
            ? {
                ...one,
                led: false,
                press,
                digging: false,
                slacking: false,
                slackAt: one.willing
                  ? null
                  : mint.time +
                    SLACK_LEAST +
                    SLACK_SPREAD * ((press % SLACK_STEP) / SLACK_STEP),
              }
            : one,
        ),
      };
    } else if (atHatch) {
      lines.push("Runter in den Schacht. Graben kann jeder.");
      next = {
        ...next,
        staff: next.staff.map((one) =>
          one === led
            ? {
                ...one,
                led: false,
                press: null,
                digging: true,
                slacking: false,
              }
            : one,
        ),
      };
    }
  }
  const boss = mint.boss;
  if (boss.led && away(HATCH, mint.hero) < HATCH_REACH) {
    lines.push("Der Direktor gräbt jetzt mit. Sehr gut für die Moral.");
    next = { ...next, boss: { ...next.boss, led: false } };
  }
  return next;
}

/** Whether a press has nobody at it yet. */
function freeAt(mint: MintState, spot: Vec): boolean {
  const at = PRESS_SPOTS.indexOf(spot);
  return !mint.staff.some((one) => one.alive && one.press === at);
}

/**
 * Everybody who works here, one step on.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works with them all one step further on
 * @remarks
 * **The tell is that they stop.** An unwilling one stands at the machine and
 * runs it for a few seconds, exactly like a willing one, and then gives up -
 * and that is the only way the player ever finds out which is which. Putting
 * one of one's own men next to them is what stops it, which is what the hired
 * crew is for once the tunnel is dug.
 */
function runStaff(mint: MintState, dt: number, lines: string[]): MintState {
  const printers = manned(mint);
  const printed =
    lit(mint) && printers > 0
      ? mint.printed + printers * PRESS_RATE * dt
      : mint.printed;
  const staff = mint.staff.map((one) => stepStaff(one, mint, dt, lines));
  return { ...mint, printed, staff };
}

/** One of them, one step on: to a machine, at one's shoulder, or still. */
function stepStaff(
  one: Hostage,
  mint: MintState,
  dt: number,
  lines: string[],
): Hostage {
  let next = one;
  if (!one.alive) {
    next = one;
  } else if (one.led) {
    next = { ...one, ...walkRound(mint, one, behind(mint), HOSTAGE_PACE, dt) };
  } else if (one.press !== null) {
    next = atPress(one, mint, dt, lines);
  } else if (one.digging) {
    next = {
      ...one,
      ...walkRound(mint, one, digSpot(mint, one), HOSTAGE_PACE, dt),
    };
  } else if (one.taken) {
    next = one;
  } else {
    next = shyOf(one, mint, dt);
  }
  return next;
}

/** A hostage at a machine: working it, or deciding not to. */
function atPress(
  one: Hostage,
  mint: MintState,
  dt: number,
  lines: string[],
): Hostage {
  const spot = PRESS_SPOTS[one.press ?? 0];
  const moved = walkRound(mint, one, spot, HOSTAGE_PACE, dt);
  const due = one.slackAt;
  let next: Hostage = { ...one, ...moved };
  if (
    due !== null &&
    !one.slacking &&
    mint.time >= due &&
    !watched(mint, one.press ?? 0)
  ) {
    lines.push(
      `Die Geisel an Presse ${String((one.press ?? 0) + 1)} hört einfach auf. Die druckt nicht.`,
    );
    next = { ...next, slacking: true };
  }
  return next;
}

/** Where a digging hostage kneels: one corner of the hatch each. */
function digSpot(mint: MintState, one: Hostage): Vec {
  const at = mint.staff.indexOf(one);
  return DIG_SPOTS[(at + 2) % DIG_SPOTS.length];
}

/** Two paces behind the player's shoulder, which is where one walks them. */
function behind(mint: MintState): Vec {
  const hero = mint.hero;
  return {
    x: hero.x - Math.cos(hero.heading) * LED_GAP,
    y: hero.y - Math.sin(hero.heading) * LED_GAP,
  };
}

/** Somebody who has not been taken yet, keeping out of the way. */
function shyOf(one: Hostage, mint: MintState, dt: number): Hostage {
  const gap = away(mint.hero, one);
  let next = one;
  if (gap < SHY && gap > SHY_HOLD) {
    const heading = Math.atan2(one.y - mint.hero.y, one.x - mint.hero.x);
    const wantX = one.x + Math.cos(heading) * SHY_PACE * dt;
    const wantY = one.y + Math.sin(heading) * SHY_PACE * dt;
    const x = clear(mint, wantX, one.y) ? wantX : one.x;
    const y = clear(mint, x, wantY) ? wantY : one.y;
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

/**
 * The director, and the telephone he is walking towards.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works with him one step nearer it, or at it
 * @remarks
 * **He is the reason one cannot simply stand in the cellar.** Nothing else in
 * the building gets worse on its own while one's back is turned: the doors
 * hold, the presses run, the tunnel gets longer. He walks. Cover him and he
 * stops; walk him down to the hatch and he digs with the rest; shoot him and
 * the problem is solved in the way that costs the most.
 */
function runBoss(mint: MintState, dt: number, lines: string[]): MintState {
  const boss = mint.boss;
  let next = mint;
  if (boss.alive && !boss.taken && mint.phone) {
    // Through the doorway first: a man who walked through the wall of his own
    // press room would be a man one could not head off.
    const goal = PHONE;
    const step = walkRound(mint, boss, goal, BOSS_PACE, dt);
    const there = away(step, goal) < AT_WORK * 2;
    if (there && !boss.called) {
      lines.push(
        "Der Direktor hat telefoniert. Jetzt warten die draußen nicht mehr.",
      );
      next = {
        ...mint,
        boss: { ...boss, ...step, called: true },
        calmUntil: 0,
        waveAt: Math.min(mint.waveAt, mint.time + CALL_SECONDS),
        settleAt: Math.min(mint.settleAt, mint.time + CALL_SECONDS),
      };
    } else {
      next = { ...mint, boss: { ...boss, ...step } };
    }
  } else if (boss.alive && boss.led) {
    next = {
      ...mint,
      boss: {
        ...boss,
        ...walkRound(mint, boss, behind(mint), HOSTAGE_PACE, dt),
      },
    };
  } else if (boss.alive && boss.taken) {
    // Put down at the hatch, he goes to a corner of it like anybody else.
    next = {
      ...mint,
      boss: {
        ...boss,
        ...walkRound(mint, boss, DIG_SPOTS[5], HOSTAGE_PACE, dt),
      },
    };
  }
  return next;
}

/**
 * What the hired men decide to do with themselves.
 *
 * @param mint - the works as they stand
 * @param lines - what to say about it
 * @returns the works with one of them given a job
 * @remarks
 * **They are a crew, not a conga line.** A man with nothing to do looks for a
 * station that is working and nobody is watching, and stands over it; failing
 * that, he goes and puts somebody who is standing about at a free machine.
 * Only one of them takes that on at a time, and none of them touches anything
 * within {@link CREW_LEAVE} of the player - if one is already dealing with it,
 * they leave it alone.
 *
 * **And there is a line they do not cross.** Nobody barricades a door, walks
 * a hostage down to the hatch, deals with the director or looks at the tank.
 * A crew that could finish the job on its own would be a job one watches.
 */
function mindCrew(mint: MintState, lines: string[]): MintState {
  const idle = mint.crew.findIndex(
    (man) => man.post === null && man.errand === null,
  );
  let next = mint;
  if (idle >= 0 && mint.time >= CREW_THINK) {
    const guard = wantsWatching(mint);
    const fetch = mint.crew.some((man) => man.errand !== null)
      ? -1
      : wantsFetching(mint);
    if (guard >= 0) {
      lines.push(
        guard === HATCH_POST
          ? "Einer von deinen geht von selbst an den Schacht."
          : `Einer von deinen stellt sich an Presse ${String(guard + 1)}.`,
      );
      next = {
        ...mint,
        crew: mint.crew.map((man, at) =>
          at === idle ? { ...man, post: guard } : man,
        ),
      };
    } else if (fetch >= 0) {
      lines.push("Einer von deinen holt sich jemanden an eine Maschine.");
      next = {
        ...mint,
        crew: mint.crew.map((man, at) =>
          at === idle ? { ...man, errand: fetch } : man,
        ),
      };
    }
  }
  return next;
}

/** Which station has somebody working at it and nobody standing over it. */
function wantsWatching(mint: MintState): number {
  let want = -1;
  POSTS.forEach((spot, post) => {
    const working =
      post === HATCH_POST
        ? mint.staff.some((one) => one.alive && one.digging)
        : mint.staff.some((one) => one.alive && one.press === post);
    const mine = mint.crew.some((man) => man.post === post);
    if (want < 0 && working && !mine && away(spot, mint.hero) > CREW_LEAVE) {
      want = post;
    }
  });
  return want;
}

/** And which of the staff is standing about while a machine is free. */
function wantsFetching(mint: MintState): number {
  const press = freePress(mint);
  let want = -1;
  if (press !== null) {
    mint.staff.forEach((one, at) => {
      if (
        want < 0 &&
        one.alive &&
        !one.taken &&
        away(one, mint.hero) > CREW_LEAVE
      ) {
        want = at;
      }
    });
  }
  return want;
}

/**
 * The hired men: they follow, or they stand where they were put.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @returns the works with them one step on
 * @remarks
 * **They walk round the furniture, not through it.** Following used to be a
 * straight line to the player, which sent four men over a counter and through
 * a press. Now a man who is not posted walks the way the player walked - one
 * step at a time, sliding along whatever he bumps into - which is a path that
 * is known to work, because somebody just walked it.
 */
function runCrew(mint: MintState, dt: number): MintState {
  const spoken = mint.crew.findIndex(
    (man) =>
      man.errand !== null &&
      mint.staff[man.errand] !== undefined &&
      away(man, mint.staff[man.errand]) < TALK_REACH,
  );
  const said = spoken < 0 ? mint : talkedRound(mint, spoken);
  return {
    ...said,
    crew: said.crew.map((man, at) => {
      const post = man.post;
      const errand = man.errand;
      const mark = errand === null ? null : mint.staff[errand];
      const goal =
        post !== null
          ? (POSTS[post] ?? HATCH)
          : mark !== undefined && mark !== null
            ? { x: mark.x, y: mark.y }
            : { x: mint.hero.x, y: mint.hero.y };
      const wait =
        post !== null || mark != null ? AT_WORK : LED_GAP + at * CREW_STRING;
      return { ...man, ...walkRound(mint, man, goal, CREW_PACE, dt, wait) };
    }),
  };
}

/**
 * One of one's own men, standing over somebody, putting them at a machine.
 *
 * @param mint - the works as they stand
 * @param man - which of the crew has got there
 * @returns the works with that clerk on their way to a press
 * @remarks
 * The same thing the player does by pointing a gun and walking them over, in
 * one step and without the walk: what the hired man has that the player has
 * not is that nobody has to watch him do it.
 */
function talkedRound(mint: MintState, man: number): MintState {
  const errand = mint.crew[man].errand ?? 0;
  const press = freePress(mint);
  const clerk = mint.staff[errand];
  let next = mint;
  if (clerk !== undefined && press !== null && !clerk.taken) {
    next = {
      ...mint,
      staff: mint.staff.map((one, at) =>
        at === errand
          ? {
              ...one,
              taken: true,
              press,
              slacking: false,
              slackAt: one.willing
                ? null
                : mint.time +
                  SLACK_LEAST +
                  SLACK_SPREAD * ((press % SLACK_STEP) / SLACK_STEP),
            }
          : one,
      ),
    };
  }
  return {
    ...next,
    crew: next.crew.map((one, at) =>
      at === man ? { ...one, errand: null } : one,
    ),
  };
}

/**
 * The tunnel, and everybody with their hands in it.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works with the tunnel that much further on
 * @remarks
 * A hostage digs while somebody is watching the hatch and stands about when
 * nobody is; a hired man posted to the hatch digs whatever happens, because
 * that is what he was paid for. The player's own back is worth a man.
 */
function dig(mint: MintState, dt: number, lines: string[]): MintState {
  let next = mint;
  if (mint.tunnel < 1) {
    const guard = watched(mint, HATCH_POST);
    const hands =
      mint.staff.filter(
        (one) => one.alive && one.digging && standingNear(one, DIG_SPOTS),
      ).length *
        (guard ? 1 : 0) +
      mint.crew.filter((man) => man.post === HATCH_POST).length +
      // The director digs like everybody else once he has been walked down
      // there, and only while somebody is watching him: he is the last man in
      // the building who would do it out of goodwill.
      (mint.boss.alive &&
      mint.boss.taken &&
      !mint.boss.led &&
      guard &&
      standingNear(mint.boss, DIG_SPOTS)
        ? 1
        : 0);
    const tunnel = dug(mint, hands, dt);
    if (tunnel >= 1) {
      lines.push("Der Tunnel ist durch! Runter und raus, solange es geht.");
    }
    next = { ...mint, tunnel };
  }
  return next;
}

/** Whether somebody is standing at one of a handful of spots. */
function standingNear(who: Vec, spots: readonly Vec[]): boolean {
  return spots.some((spot) => away(spot, who) < SLAB);
}

/** How much of the tunnel this many pairs of hands get through. */
function dug(mint: MintState, men: number, dt: number): number {
  return Math.min(1, mint.tunnel + (men * dt) / DIG_SECONDS);
}

/** Whether one of one's own is standing over a station. */
function watched(mint: MintState, post: number): boolean {
  const spot = POSTS[post] ?? HATCH;
  return (
    mint.crew.some(
      (man) => man.post === post && away(man, spot) < WATCH_REACH,
    ) || away(mint.hero, spot) < WATCH_REACH
  );
}

/** Whether this one is actually working the machine they were put at. */
function works(one: Hostage, mint: MintState, press: number): boolean {
  return (
    one.alive &&
    !one.led &&
    one.press === press &&
    away(one, PRESS_SPOTS[press]) < SLAB &&
    (!one.slacking || watched(mint, press))
  );
}

/* -------------------------------------------------------------- the siege */

/**
 * The police: arriving, taking up positions, and then leaning on three doors.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works one step on
 * @remarks
 * **The first minute is theirs, not the player's.** They come up the road,
 * stop short of the building, put men behind their cars and pitch a tent
 * across the street - and until that is done nobody touches a door. What one
 * does with that minute is the difference between a job that works and one
 * that is a fight from the first second.
 */
function police(mint: MintState, dt: number, lines: string[]): MintState {
  const set = ready(mint);
  const cops = mint.cops.map((cop, at) => ({
    ...cop,
    ...walkTo(cop, standing(mint, cop, at), CREW_PACE, dt),
  }));
  const calm = mint.time < mint.calmUntil;
  const due = set && mint.time >= mint.waveAt && !calm;
  const target = due ? weakest(mint) : null;
  if (target !== null) {
    lines.push(`Sie gehen ${GATE_TO[target.kind]}!`);
  }
  // The shutter standing open is an invitation, and they take it.
  const open = mint.shutter > HALF_UP && set;
  return {
    ...mint,
    cops,
    waves: due ? mint.waves + 1 : mint.waves,
    waveAt: due ? mint.time + WAVE_EVERY : mint.waveAt,
    gates: mint.gates.map((gate) =>
      lean(
        gate,
        gate.kind === target?.kind,
        calm,
        open && gate.kind === "door",
        shelling(mint) && gate.kind === "door",
        dt,
      ),
    ),
  };
}

/**
 * Whether the tank is in position and putting shells into the front door.
 *
 * @param mint - the works as they stand
 * @returns false while it is still rolling up the road
 * @remarks
 * It has to arrive before it fires. A tank that starts shelling the moment it
 * turns the corner gives one no time at all to decide what to do about it,
 * and what to do about it is the whole of that minute.
 */
function shelling(mint: MintState): boolean {
  const tank = mint.tank;
  return (
    tank !== null &&
    tank.health > 0 &&
    Math.hypot(tank.x - TANK_SPOT.x, tank.y - TANK_SPOT.y) < SLAB
  );
}

/**
 * Where one of the men outside wants to be standing this second.
 *
 * @param mint - the works as they stand
 * @param cop - which of them
 * @param at - his number, so that they do not all pace in step
 * @returns the spot he is walking towards
 * @remarks
 * **Two distances, and the difference between them is the whole siege.**
 * While nothing is happening they stand back across the road and shift about;
 * the moment a squad is working on a way in, the men whose job that is go up
 * to it and stand at the wall. Seen from inside that is the warning: they are
 * suddenly close to the window.
 */
function standing(mint: MintState, cop: Siren, at: number): Vec {
  const busy = mint.gates.find((gate) => gate.busy) ?? null;
  let spot: Vec;
  if (busy !== null && cop.kind !== "command") {
    // Up against the wall, just outside whichever way in they are at.
    const out = OUTSIDE[busy.kind];
    spot = { x: out.x + (at % COP_ROW) * COP_PACE, y: out.y };
  } else {
    // Back behind the cars, and never quite still.
    const sway = Math.sin(mint.time / COP_BEAT + at) * COP_PACE;
    spot = { x: cop.spot.x + sway, y: cop.spot.y };
  }
  return spot;
}

/** One door, one step of whatever is happening to it. */
function lean(
  gate: Gate,
  joined: boolean,
  calm: boolean,
  open: boolean,
  shelled: boolean,
  dt: number,
): Gate {
  const busy = (gate.busy || joined || open || shelled) && !calm;
  const rate =
    PUSH_RATE * (1 - SHIELD * gate.barricade) +
    (open ? SHUTTER_PUSH : 0) +
    (shelled ? TANK_PUSH : 0);
  return {
    ...gate,
    busy,
    push: busy
      ? Math.min(1, gate.push + rate * dt)
      : Math.max(0, gate.push - FADE * dt),
    barricade: busy ? Math.max(0, gate.barricade - WEAR * dt) : gate.barricade,
  };
}

/**
 * The tank, once the doors have held long enough to annoy them.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works with it one step further up the road
 * @remarks
 * **The one thing in the game a barricade does nothing about.** It rolls up
 * the middle of the street, stops square on to the shutter and starts putting
 * shells into it, and the only answer is to wind the shutter up and put a
 * rocket into it - which means standing in the one doorway with four hundred
 * policemen in front of it. A fair trade for the noise it makes.
 */
function theTank(mint: MintState, dt: number, lines: string[]): MintState {
  let next = mint;
  if (mint.tank === null && mint.waves >= TANK_WAVE) {
    lines.push("Sie fahren einen Panzer auf. Panzerfaust in die Hand.");
    next = {
      ...mint,
      tank: {
        x: TANK_START.x,
        y: TANK_START.y,
        heading: Math.PI,
        spot: TANK_SPOT,
        health: 1,
        fireAt: mint.time + TANK_SHELL,
      },
    };
  } else if (mint.tank !== null && mint.tank.health > 0) {
    const tank = mint.tank;
    const gap = away(tank.spot, tank);
    const step = Math.min(gap, TANK_PACE * dt);
    const heading =
      gap < 1
        ? tank.heading
        : Math.atan2(tank.spot.y - tank.y, tank.spot.x - tank.x);
    next = {
      ...mint,
      tank: {
        ...tank,
        x: tank.x + Math.cos(heading) * step,
        y: tank.y + Math.sin(heading) * step,
        heading: gap < 1 ? -Math.PI / 2 : heading,
      },
    };
  }
  return next;
}

/** A rocket into it, which is the whole answer to a tank. */
function hitTank(mint: MintState, lines: string[]): MintState {
  const tank = mint.tank;
  let next = mint;
  if (tank !== null) {
    const health = Math.max(0, tank.health - 1 / MINT_TANK_HITS);
    lines.push(
      health <= 0
        ? "Der Panzer brennt. Die ziehen sich erst einmal zurück."
        : "Treffer auf dem Panzer. Noch einmal.",
    );
    next = {
      ...mint,
      tank: { ...tank, health },
      calmUntil: health <= 0 ? mint.time + RELEASE_CALM : mint.calmUntil,
    };
  }
  return next;
}

/**
 * The food they send up to the door, and what it is worth.
 *
 * @param mint - the works as they stand
 * @param lines - what to say about it
 * @returns the works with it taken in, or with the door shut in their faces
 * @remarks
 * **A siege is a negotiation, and this is the only round of it one can win.**
 * They send food up because the people inside are theirs to worry about; if
 * one takes it in, the hostages settle and the ones who were working go on
 * working. If one leaves it on the step, the whole room decides this is not
 * their problem, and the presses stop one by one.
 */
function theFood(mint: MintState, lines: string[]): MintState {
  const due = mint.foodAt;
  let next = mint;
  if (due !== null && mint.time >= due && !mint.fed) {
    if (mint.time < due + FOOD_WAIT && mint.shutter > HALF_UP) {
      lines.push("Das Essen ist drin. Die Geiseln beruhigen sich.");
      next = {
        ...mint,
        fed: true,
        foodAt: null,
        calmUntil: Math.max(mint.calmUntil, mint.time + RELEASE_CALM),
        staff: mint.staff.map((one) => ({
          ...one,
          slacking: false,
          slackAt: one.slackAt === null ? null : one.slackAt + SLACK_SPREAD,
        })),
      };
    } else if (mint.time >= due + FOOD_WAIT) {
      lines.push(
        "Das Essen steht draußen. Drinnen macht jetzt keiner mehr mit.",
      );
      next = {
        ...mint,
        foodAt: null,
        staff: mint.staff.map((one) => ({
          ...one,
          willing: false,
          slackAt: one.press === null ? one.slackAt : mint.time + SLACK_LEAST,
        })),
      };
    }
  }
  return next;
}

/**
 * What happens to somebody who leaves the shutter standing open.
 *
 * @param mint - the works as they stand
 * @param dt - seconds since the last step
 * @param lines - what to say about it
 * @returns the works with them shooting through it, or not yet
 * @remarks
 * **An open door in front of four hundred policemen is a decision with a
 * clock on it.** For {@link OPEN_GRACE} seconds it is a way of taking the
 * food in or putting a rocket into a tank; after that they start shooting
 * through it and walking at it, and the front door goes in seconds rather
 * than minutes. Shutting it stops all of that at once - which is the whole
 * point of its being a switch.
 */
function theOpenDoor(mint: MintState, dt: number, lines: string[]): MintState {
  const open = mint.shutter > HALF_UP && ready(mint);
  let next = mint;
  if (!open) {
    next =
      mint.openAt === null ? mint : { ...mint, openAt: null, storming: false };
  } else {
    const since = mint.openAt ?? mint.time;
    const held = mint.time - since;
    const warn =
      !mint.storming && held > OPEN_GRACE / 2 && mint.openAt !== null;
    next = { ...mint, openAt: since };
    if (warn && Math.floor(held) === Math.floor(OPEN_GRACE / 2)) {
      lines.push("Sie gehen auf das offene Tor zu. Zumachen wäre jetzt klug.");
    }
    if (held >= OPEN_GRACE) {
      if (!mint.storming) {
        lines.push("Sie schießen durch das Tor und kommen rein!");
      }
      next = {
        ...next,
        storming: true,
        gates: next.gates.map((gate) =>
          gate.kind === "door"
            ? {
                ...gate,
                busy: true,
                push: Math.min(1, gate.push + STORM_PUSH * dt),
              }
            : gate,
        ),
      };
      // And they fire through it, so that one sees what is happening.
      if (mint.time >= mint.shotAt) {
        const cop = next.cops[0];
        next = {
          ...fire(
            { ...next, shotAt: mint.time - SHOT_GAP + STORM_SHOT },
            cop === undefined ? WAYS_IN[0].at : { x: cop.x, y: cop.y },
            { x: next.hero.x, y: next.hero.y },
            "pistol",
          ),
          shotAt: mint.time + STORM_SHOT,
        };
      }
    }
  }
  return next;
}

/** The shutter, winding up or down. */
function runShutter(mint: MintState, dt: number, lines: string[]): MintState {
  const want = mint.opening ? 1 : 0;
  const shutter =
    mint.shutter < want
      ? Math.min(want, mint.shutter + OPEN_RATE * dt)
      : Math.max(want, mint.shutter - OPEN_RATE * dt);
  if (shutter >= 1 && mint.shutter < 1) {
    lines.push("Das Tor ist oben. Du stehst im Licht.");
  }
  if (shutter <= 0 && mint.shutter > 0) {
    lines.push("Das Tor ist wieder unten.");
  }
  return { ...mint, shutter };
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
 * The things that are pressed rather than walked to.
 *
 * @param mint - the works as they stand
 * @param input - the keys and whatever was pressed in the panel
 * @param lines - what to say about it
 * @returns the works with the order carried out
 * @remarks
 * Four now: the shutter up or down, a man put on the station one is standing
 * at or called back, a hostage out of the front door, and the mains. All of
 * them cost something - the shutter lets them lean on the one door that was
 * holding, a posted man is a man who is not following one about, a hostage
 * let go is a pair of hands gone for good, and the dark stops one's own
 * presses as well as their cameras.
 */
function obey(mint: MintState, input: Input, lines: string[]): MintState {
  const order = input.order;
  let next = mint;
  if (order?.kind === "release") {
    next = letGo(mint, lines);
  } else if (order?.kind === "shutter") {
    next = { ...mint, opening: !mint.opening };
  } else if (order?.kind === "post") {
    next = postMan(mint, lines);
  } else if (order?.kind === "power") {
    next = switchPower(mint, lines);
  }
  return next;
}

/**
 * One of one's own men left standing over the station one is at.
 *
 * @param mint - the works as they stand
 * @param lines - what to say about it
 * @returns the works with a man posted there, or called back off it
 * @remarks
 * The whole of what the hired crew is for, now that they do not dig by
 * themselves: somebody has to stand over the people who are working, or the
 * ones who never wanted to work stop the moment one's back is turned.
 */
function postMan(mint: MintState, lines: string[]): MintState {
  const post = POSTS.findIndex((spot) => away(spot, mint.hero) < POST_REACH);
  let next = mint;
  if (post >= 0) {
    const there = mint.crew.find((man) => man.post === post);
    if (there === undefined) {
      const free = mint.crew.find((man) => man.post === null);
      if (free === undefined) {
        lines.push("Keiner mehr frei. Erst irgendwo einen abziehen.");
      } else {
        lines.push(
          post === HATCH_POST
            ? "Einer bleibt am Schacht und passt auf."
            : `Einer bleibt an Presse ${String(post + 1)}.`,
        );
        next = {
          ...mint,
          crew: mint.crew.map((man) => (man === free ? { ...man, post } : man)),
        };
      }
    } else {
      lines.push("Der kommt wieder mit.");
      next = {
        ...mint,
        crew: mint.crew.map((man) =>
          man === there ? { ...man, post: null, errand: null } : man,
        ),
      };
    }
  }
  return next;
}

/**
 * The mains: off, or on again.
 *
 * @param mint - the works as they stand
 * @param lines - what to say about it
 * @returns the works in the dark, or with the lights back
 * @remarks
 * **Both halves of it are a decision.** In the dark nothing is printed and
 * nobody outside wants to walk into the building, so it buys the minutes in
 * which they are leaning on a door; in the light the machines earn and they
 * think again. Cutting it only buys that quiet once every {@link POWER_AGAIN}
 * seconds, or the switch would be an answer to everything.
 */
function switchPower(mint: MintState, lines: string[]): MintState {
  const fresh = mint.time >= mint.powerAt;
  let next: MintState;
  if (mint.dark) {
    lines.push("Licht an. Die Pressen laufen wieder.");
    next = { ...mint, dark: false };
  } else {
    lines.push(
      fresh
        ? "Der Strom ist weg. Draußen will so keiner rein."
        : "Wieder dunkel - aber die draußen fallen nicht zweimal darauf herein.",
    );
    next = {
      ...mint,
      dark: true,
      powerAt: fresh ? mint.time + POWER_AGAIN : mint.powerAt,
      calmUntil: fresh ? mint.time + POWER_CALM : mint.calmUntil,
      gates: fresh
        ? mint.gates.map((gate) => ({ ...gate, busy: false }))
        : mint.gates,
    };
  }
  return next;
}

/** One hostage out of the front door, and a quarter of an hour of quiet. */
function letGo(mint: MintState, lines: string[]): MintState {
  const going = mint.staff.find((one) => one.taken && one.alive) ?? null;
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

/** Whoever is walking at the player's shoulder, or null. */
function ledOne(mint: MintState): Hostage | null {
  return mint.staff.find((one) => one.led && one.alive) ?? null;
}

/** The nearest of them who has not been taken, or null once all are. */
function freeOne(mint: MintState): Hostage | null {
  let best: Hostage | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const one of mint.staff) {
    const gap = away(one, mint.hero);
    if (one.alive && !one.taken && gap < bestAway) {
      best = one;
      bestAway = gap;
    }
  }
  return best;
}

/** The lowest machine nobody is standing at, or null when all are taken. */
function freePress(mint: MintState): number | null {
  const at = PRESS_SPOTS.findIndex(
    (unused, index) =>
      !mint.staff.some((one) => one.alive && one.press === index),
  );
  return at < 0 ? null : at;
}

/**
 * The next square to walk to on the way from one place to another.
 *
 * @param mint - the works as they stand
 * @param from - where somebody is
 * @param goal - where they want to be
 * @returns the middle of the next square along, or the goal itself
 * @remarks
 * **A straight line is not a route inside a building.** Sliding along
 * whatever one bumps into gets a man round a machine and leaves him standing
 * in a corner for the rest of the job: the press room is reached through two
 * gaps in a wall, and a man who cannot see that walks into the wall between
 * them and stays there. So the way is worked out properly - a flood fill out
 * from the goal over the squares one may stand on, and then the neighbour
 * with the smallest number.
 *
 * Worked out fresh each time rather than remembered, because everything in
 * here moves: the goal is usually a person, and a path to where somebody was
 * is not a path.
 */
function wayTo(mint: MintState, from: Vec, goal: Vec): Vec {
  const fromCol = Math.floor(from.x / SLAB);
  const fromRow = Math.floor(from.y / SLAB);
  const goalCol = Math.floor(goal.x / SLAB);
  const goalRow = Math.floor(goal.y / SLAB);
  let next = goal;
  if (fromCol !== goalCol || fromRow !== goalRow) {
    const steps = flood(mint, goalCol, goalRow);
    const here = steps.get(mark(fromCol, fromRow)) ?? Number.POSITIVE_INFINITY;
    let best: { readonly col: number; readonly row: number } | null = null;
    let bestStep = here;
    for (const side of SIDES) {
      const col = fromCol + side.col;
      const row = fromRow + side.row;
      const step = steps.get(mark(col, row));
      if (step !== undefined && step < bestStep) {
        best = { col, row };
        bestStep = step;
      }
    }
    next = best === null ? goal : middleOf(best.col, best.row);
  }
  return next;
}

/** How far every square one may stand on is from one square. */
function flood(
  mint: MintState,
  col: number,
  row: number,
): ReadonlyMap<number, number> {
  const steps = new Map<number, number>();
  const queue: { readonly col: number; readonly row: number }[] = [
    { col, row },
  ];
  steps.set(mark(col, row), 0);
  for (let at = 0; at < queue.length; at += 1) {
    const here = queue[at];
    const step = steps.get(mark(here.col, here.row)) ?? 0;
    for (const side of SIDES) {
      const next = { col: here.col + side.col, row: here.row + side.row };
      const id = mark(next.col, next.row);
      if (!steps.has(id) && walkable(mint, next.col, next.row)) {
        steps.set(id, step + 1);
        queue.push(next);
      }
    }
  }
  return steps;
}

/** Whether a whole square is floor one may stand in the middle of. */
function walkable(mint: MintState, col: number, row: number): boolean {
  return (
    col >= 0 &&
    row >= 0 &&
    col < PLAN_WIDE &&
    row < PLAN_HIGH &&
    !solid(mint, (col + MIDDLE) * SLAB, (row + MIDDLE) * SLAB)
  );
}

/** The four sides of a square. */
const SIDES: readonly { readonly col: number; readonly row: number }[] = [
  { col: 1, row: 0 },
  { col: -1, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: -1 },
];

/** How many of them stand side by side at a way in. */
const COP_ROW = 3;

/** Half a square, which is where the middle of one is. */
const MIDDLE = 0.5;

/** One square as one number, so that a map can be keyed on it. */
function mark(col: number, row: number): number {
  return row * PLAN_WIDE + col;
}

/** The middle of one square, in works pixels. */
function middleOf(col: number, row: number): Vec {
  return { x: (col + MIDDLE) * SLAB, y: (row + MIDDLE) * SLAB };
}

/**
 * One figure, one step along the way to a spot, stopping when it is there.
 *
 * @param mint - the works as they stand
 * @param who - the figure
 * @param spot - where they are going
 * @param pace - how fast they walk, in pixels a second
 * @param dt - seconds since the last step
 * @param stop - how near counts as arrived
 * @returns them, one step further along
 */
function walkRound(
  mint: MintState,
  who: Vec,
  spot: Vec,
  pace: number,
  dt: number,
  stop: number = AT_WORK,
): Inmate {
  const from = who as Inmate;
  const gap = away(spot, who);
  let next: Inmate = {
    x: from.x,
    y: from.y,
    heading: from.heading ?? 0,
    walked: from.walked ?? 0,
  };
  if (gap > stop) {
    const corner = wayTo(mint, who, spot);
    const heading = Math.atan2(corner.y - who.y, corner.x - who.x);
    const step = Math.min(away(corner, who), pace * dt);
    const wantX = who.x + Math.cos(heading) * step;
    const wantY = who.y + Math.sin(heading) * step;
    const x = clear(mint, wantX, who.y) ? wantX : who.x;
    const y = clear(mint, x, wantY) ? wantY : who.y;
    next = {
      x,
      y,
      heading,
      walked: next.walked + Math.hypot(x - who.x, y - who.y),
    };
  }
  return next;
}

/** One figure, one step towards a spot, stopping when it is there. */
function walkTo(who: Vec, spot: Vec, pace: number, dt: number): Inmate {
  const gap = away(spot, who);
  const from = who as Inmate;
  let next: Inmate = {
    x: from.x,
    y: from.y,
    heading: from.heading ?? 0,
    walked: from.walked ?? 0,
  };
  if (gap > AT_WORK) {
    const heading = Math.atan2(spot.y - who.y, spot.x - who.x);
    const step = Math.min(gap, pace * dt);
    next = {
      x: who.x + Math.cos(heading) * step,
      y: who.y + Math.sin(heading) * step,
      heading,
      walked: next.walked + step,
    };
  }
  return next;
}

/** How far apart two points are, in works pixels. */
function away(one: Vec, two: Vec): number {
  return Math.hypot(one.x - two.x, one.y - two.y);
}

/** Where the food van stands while it waits. */
export function foodSpot(): Vec {
  return FOOD_SPOT;
}
