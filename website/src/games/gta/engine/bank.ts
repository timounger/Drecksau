/**
 * Inside the bank: the counter, the staff, the vault and the man with the key.
 *
 * @module
 * @remarks
 * The fourth little world, after the jail and the printing works, and the one
 * with people in it rather than obstacles. One room, four questions, and all
 * four of them are about the people:
 *
 * - **Who has seen you.** Everybody in here starts `loose` and goes `held` the
 *   moment the gun points at them; look away and their nerve comes back. One
 *   of the three windows has the alarm button under it, and the woman standing
 *   at that one has four seconds. That is the opening of the job.
 * - **Who is out of it for good.** Somebody tied up is out of it; somebody
 *   dead is out of it and cannot be untied. Everybody else is a clock.
 * - **Who can open the vault.** The director, and only the director. Shoot him
 *   and the money stays where it is - which is the one thing in this room that
 *   cannot be undone.
 * - **Who is still loose behind you.** The vault is a room with no view of the
 *   hall. Anybody left standing while you are in there walks to the button, and
 *   a customer with free hands unties the staff so that they can.
 *
 * Nobody presses it, nobody comes: a bank that has not been reported has no
 * clock on it at all. That is what the rope is for.
 */
import {
  ALARM_GRACE,
  HELD_NERVE,
  BOX_LEAST,
  BOX_SPREAD,
  CUSTOMERS_MOST,
  FIRST_FUSE,
  FREE_SECONDS,
  GUN_RANGE,
  GUN_SPOT,
  HANDS_UP,
  MAX_STEP,
  NERVE_APART,
  NERVE_BACK,
  LIE_STILL,
  PICK_UP,
  REACH,
  RUN_WALK,
  SHOT_GAP,
  SLAB,
  DOOR_RITUAL,
  TIE_SECONDS,
  VAULT_ROOM,
  WALK_SPEED,
  type BankBox,
  type BankFolk,
  type BankState,
  type Input,
  type Vec,
} from "./types";
import { nextInt, nextRandom, type RandomState } from "./random";
import { WEAPONS, type WeaponKind } from "./weapons";

/**
 * The bank, one letter per square.
 *
 * @remarks
 * **South is the street**: one comes in at the bottom of the plan and works
 * *up* it, which is how a room one walks into reads - the door behind you, the
 * job in front of you.
 *
 * The hall is the public half, and it is **two squares deep**: one walks in
 * and the counter is there. Across it three teller windows and a gate; behind
 * it the staff floor, and off that the two rooms that matter - **the vault on
 * the left and the director's office on the right, with one wall between
 * them**. Nothing else: the corridor that used to run between them was a
 * corridor nothing ever happened in, and every square of a room one crosses
 * under a clock has to earn itself.
 *
 * The vault is lined with safe-deposit boxes on every wall, the shared one
 * included - but **not in the corners**, where a box would have no side facing
 * the room: it could be neither seen nor shot at, and a lock-up one cannot
 * reach is a lock-up that is not there.
 */
export const PLAN: readonly string[] = [
  "ooooooooooooooo",
  "###############",
  "#LLLLL#bbbbbbb#",
  "LvvvvvLbbDDDbb#",
  "#LLvvL#bbbbbbb#",
  "###VV#####BB###",
  "#,,,,,,,,,,,,,#",
  "#,,,,,,,,,,,,,#",
  "#CTCCCTC++CTCC#",
  "#.............#",
  "#.............#",
  "######EE#######",
  "ooooooooooooooo",
];

/** How many squares across the plan is. */
export const PLAN_WIDE = PLAN[0].length;

/** How many squares down. */
export const PLAN_HIGH = PLAN.length;

/** What one square of the bank is. */
export type Slot =
  | "wall"
  | "hall"
  | "floor"
  | "vaultFloor"
  | "office"
  | "counter"
  | "teller"
  | "gate"
  | "desk"
  | "door"
  | "officeDoor"
  | "vaultDoor"
  | "box"
  | "free";

/** What each letter of the plan stands for. */
const LEGEND: Readonly<Record<string, Slot>> = {
  "#": "wall",
  ".": "hall",
  ",": "floor",
  v: "vaultFloor",
  b: "office",
  C: "counter",
  T: "teller",
  "+": "gate",
  D: "desk",
  E: "door",
  B: "officeDoor",
  V: "vaultDoor",
  L: "box",
  o: "free",
};

/** What one turn inside the bank comes to. */
export type BankTurn = {
  /** The bank, one step on. */
  readonly bank: BankState;
  /** What to add to the ticker, oldest first. */
  readonly lines: readonly string[];
  /** Whether the job is still running, out of the door, or over. */
  readonly done: "on" | "out" | "caught";
};

/** How wide a body is, from the middle, in bank pixels. */
const HALF_BODY = 9;

/** How fast somebody walks who is not being shouted at, in pixels a second. */
const FOLK_PACE = 66;

/** How close behind the gun a hostage walks, in bank pixels. */
const CLERK_GAP = 52;

/* eslint-disable @typescript-eslint/no-magic-numbers -- what follows are places
   on the plan above: which square a teller window is, where the director
   stands, where a customer waits. They are a map, not arithmetic. */

/** Which column each teller window is in. */
const TELLERS: readonly number[] = [2, 6, 11];

/** Half a square, which is where the middle of one is. */
const MIDDLE = 0.5;

/** Which row of the plan the counter stands on. */
const COUNTER_ROW = 8;

/** And which row the staff stand on, behind it. */
const STAFF_ROW = 7;

/** Where under the counter the button sits, in rows from the north. */
const BUTTON_ROW = 7.7;

/** How far out in front of a box its contents land, as a share of a square. */
const SPILL = 0.8;

/** And how much further than that, at most. */
const SPILL_MORE = 0.5;

/** How wide the money scatters, in radians. */
const SCATTER = 1.1;

/** Half of one, for splitting a draw about nought. */
const HALF = 0.5;

/** And how far out its door counts as standing, which is clear of the wall. */
const FACE_OUT = 0.62;

/** Where the player comes in: just inside the front door. */
const DOOR_IN: Vec = { x: 7 * SLAB, y: 10.6 * SLAB };

/** The way out: the front door itself. */
const WAY_OUT: Vec = { x: 7 * SLAB, y: 11.5 * SLAB };

/** Where the director stands when the door goes: behind his desk. */
const BOSS_SPOT: Vec = { x: 10.5 * SLAB, y: 4.4 * SLAB };

/** Where the vault door is. */
const VAULT_DOOR: Vec = { x: 4 * SLAB, y: 5.5 * SLAB };

/** Where he stands to work the lock: just outside the doorway. */
const VAULT_KEY: Vec = { x: 4 * SLAB, y: 6.4 * SLAB };

/** And the middle of the room behind it. */
const VAULT_MIDDLE: Vec = { x: 3 * SLAB, y: 3.5 * SLAB };

/** Where a customer may be standing, if there is one. */
const QUEUE: readonly Vec[] = [
  { x: 3.5 * SLAB, y: 9.6 * SLAB },
  { x: 7.5 * SLAB, y: 10.4 * SLAB },
  { x: 11.5 * SLAB, y: 9.6 * SLAB },
  { x: 5.5 * SLAB, y: 10.5 * SLAB },
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The bank at the moment somebody walks in with a gun.
 *
 * @param time - the simulation clock of the city, so the two agree
 * @param rng - the city's random state
 * @returns a fresh hold-up, and the random state to carry on with
 */
export function enterBank(
  time: number,
  rng: RandomState,
): { readonly bank: BankState; readonly rng: RandomState } {
  // Which window the button is under, and how many customers are in.
  const pick = nextInt(rng, TELLERS.length);
  const crowd = nextInt(pick.state, CUSTOMERS_MOST + 1);
  const staff = TELLERS.map((col, at) =>
    person(col, at, pick.value, time, at + 1),
  );
  const boss: BankFolk = {
    x: BOSS_SPOT.x,
    y: BOSS_SPOT.y,
    heading: Math.PI / 2,
    walked: 0,
    role: "boss",
    mood: "loose",
    // He is behind a door and cannot see the hall: he only starts counting
    // once somebody has been in to see him.
    panicAt: Number.POSITIVE_INFINITY,
    post: -1,
    work: 0,
    undo: 0,
    opens: 0,
    look: 0,
  };
  const guests = QUEUE.slice(0, crowd.value).map((spot, at) => ({
    x: spot.x,
    y: spot.y,
    heading: -Math.PI / 2,
    walked: 0,
    role: "customer" as const,
    mood: "loose" as const,
    // A customer does nothing at first. It is only when nobody is watching
    // him that he goes to untie somebody - see {@link runFolk}.
    panicAt: time + FIRST_FUSE + NERVE_APART * (at + 2),
    post: -1,
    work: 0,
    undo: 0,
    opens: 0,
    look: at,
  }));
  const filled = fillBoxes(crowd.state);
  return {
    bank: {
      time,
      hero: { x: DOOR_IN.x, y: DOOR_IN.y, heading: -Math.PI / 2, walked: 0 },
      aim: { x: DOOR_IN.x, y: DOOR_IN.y - SLAB * 2 },
      folk: [...staff, boss, ...guests],
      boxes: filled.boxes,
      loot: [],
      button: pick.value,
      taken: 0,
      vault: 0,
      alarm: false,
      raidAt: null,
      work: 0,
      shotAt: 0,
      rng: filled.rng,
    },
    rng: filled.rng,
  };
}

/**
 * One step of the hold-up.
 *
 * @param bank - the bank as it stands
 * @param input - the keys, the mouse and where it points this frame
 * @param dt - seconds since the last step
 * @param weapon - what is in the player's hand, which is what opens a box
 * @returns the bank one step on, what to say about it, and how it ended
 */
export function advanceBank(
  bank: BankState,
  input: Input,
  dt: number,
  weapon: WeaponKind,
): BankTurn {
  const slice = Math.min(dt, MAX_STEP);
  const lines: string[] = [];
  let next: BankState = { ...bank, time: bank.time + slice };
  next = walkHero(next, input, slice);
  next = coverFolk(next, slice);
  next = pullTrigger(next, input, slice, weapon, lines);
  next = doWork(next, input, slice, lines);
  next = pickUp(next);
  next = runFolk(next, slice, lines);
  let done: BankTurn["done"] = "on";
  if (slotUnder(next.hero.x, next.hero.y) === "door") {
    done = "out";
  } else if (next.raidAt !== null && next.time >= next.raidAt) {
    done = "caught";
  }
  return { bank: next, lines, done };
}

/**
 * What the player is meant to be doing, in one line.
 *
 * @param bank - the bank as it stands
 * @returns the task, for the bar under the picture
 */
export function taskLine(bank: BankState): string {
  const loose = bank.folk.filter(
    (one) => one.role !== "boss" && awake(one) && one.mood !== "held",
  ).length;
  const held = bank.folk.filter(
    (one) => one.role !== "boss" && one.mood === "held",
  ).length;
  const boss = bank.folk.find((one) => one.role === "boss");
  const bossGone = boss === undefined || boss.mood === "dead";
  let line: string;
  if (loose > 0) {
    line = `${String(loose)} noch ohne Fesseln - Maus drauf halten, dann mit Leertaste fesseln.`;
  } else if (held > 0) {
    line = "Die Hände sind oben. Hingehen und mit Leertaste fesseln.";
  } else if (bank.vault < 1 && bossGone) {
    line = "Den Tresor bekommt jetzt niemand mehr auf. Raus durch die Tür.";
  } else if (bank.vault < 1 && boss !== undefined && boss.mood !== "held") {
    line =
      "Der Direktor sitzt im Büro rechts. Ohne ihn geht der Tresor nicht auf.";
  } else if (bank.vault < 1 && boss !== undefined && boss.opens > 0) {
    line = "Er macht auf - stehen bleiben, sonst hört er wieder auf.";
  } else if (bank.vault < 1) {
    line = "Ihn mit zur Tresortür nehmen. Den Rest macht er selbst.";
  } else if (bank.boxes.some((box) => !box.open)) {
    line =
      "Fächer aufschießen - je größer die Waffe, desto schneller. Das Geld fällt heraus und muss aufgehoben werden.";
  } else {
    line = "Alles offen. Geld einsammeln und raus durch die Vordertür.";
  }
  return line;
}

/**
 * How much money is still lying about in here, for the bar.
 *
 * @param bank - the bank as it stands
 * @returns what is in the boxes plus what is on the floor
 */
export function stillInTheHouse(bank: BankState): number {
  const shut = bank.boxes.reduce(
    (sum, box) => sum + (box.open ? 0 : box.cash),
    0,
  );
  return shut + bank.loot.reduce((sum, drop) => sum + drop.cash, 0);
}

/**
 * Where the job in hand is, so the picture can ring it.
 *
 * @param bank - the bank as it stands
 * @returns the spot to walk to, or null when there is nothing to stand at
 */
export function markOf(bank: BankState): Vec | null {
  const loose = nearestFolk(bank, (one) => awake(one) && one.mood !== "held");
  const held = nearestFolk(
    bank,
    (one) => one.mood === "held" && one.role !== "boss",
  );
  const boss = bank.folk.find((one) => one.role === "boss");
  let mark: Vec | null;
  if (loose !== null) {
    mark = { x: loose.x, y: loose.y };
  } else if (held !== null) {
    mark = { x: held.x, y: held.y };
  } else if (bank.vault < 1 && boss !== undefined && boss.mood === "held") {
    mark = VAULT_DOOR;
  } else if (bank.vault < 1 && boss !== undefined && boss.mood !== "dead") {
    mark = { x: boss.x, y: boss.y };
  } else if (bank.vault >= 1 && bank.boxes.some((box) => !box.open)) {
    mark = VAULT_MIDDLE;
  } else {
    mark = null;
  }
  return mark;
}

/**
 * What is on one square of the plan.
 *
 * @param col - square across, from the west
 * @param row - square down, from the north
 * @returns what stands there, and open ground beyond the edge
 */
export function slotAt(col: number, row: number): Slot {
  const letter =
    col >= 0 && row >= 0 && col < PLAN_WIDE && row < PLAN_HIGH
      ? PLAN[row][col]
      : "o";
  return LEGEND[letter] ?? "free";
}

/**
 * What is under a point.
 *
 * @param x - bank pixels across
 * @param y - bank pixels down
 * @returns what stands there
 */
export function slotUnder(x: number, y: number): Slot {
  return slotAt(Math.floor(x / SLAB), Math.floor(y / SLAB));
}

/**
 * Whether the way through a point is shut.
 *
 * @param vault - how far the vault door is open
 * @param x - bank pixels across
 * @param y - bank pixels down
 * @returns true where nobody may walk
 */
export function solid(vault: number, x: number, y: number): boolean {
  const kind = slotUnder(x, y);
  let shut: boolean;
  switch (kind) {
    case "wall":
    case "counter":
    case "teller":
    case "desk":
    case "box":
      shut = true;
      break;
    case "vaultDoor":
      shut = vault < 1;
      break;
    default:
      shut = false;
  }
  return shut;
}

/**
 * Whether one point can see another.
 *
 * @param vault - how far the vault door is open
 * @param from - one end of the line
 * @param to - the other
 * @returns true where nothing solid stands between them
 * @remarks
 * Walked along in half-square steps, which is as fine as it needs to be for a
 * room built out of whole squares. This is what makes the vault a hiding place
 * rather than a corner: the gun cannot hold a room it cannot see into.
 */
export function inSight(vault: number, from: Vec, to: Vec): boolean {
  const gap = away(from, to);
  const steps = Math.ceil(gap / (SLAB / 2));
  let clear = true;
  for (let step = 1; step < steps && clear; step += 1) {
    const share = step / steps;
    clear = !blocksSight(
      vault,
      from.x + (to.x - from.x) * share,
      from.y + (to.y - from.y) * share,
    );
  }
  return clear;
}

/**
 * Whether what stands at a point is too tall to see over.
 *
 * @param vault - how far the vault door is open
 * @param x - bank pixels across
 * @param y - bank pixels down
 * @returns true for a wall, a box front or a shut vault door
 * @remarks
 * **Not the same question as {@link solid}.** A counter stops a man walking
 * and does not stop him looking: it is chest high, which is the entire point
 * of a counter. Asked the wrong way round, a gun could never be pointed at the
 * woman standing behind one - which is to say, at anybody who works here.
 */
function blocksSight(vault: number, x: number, y: number): boolean {
  const kind = slotUnder(x, y);
  let blind: boolean;
  switch (kind) {
    case "wall":
    case "box":
      blind = true;
      break;
    case "vaultDoor":
      blind = vault < 1;
      break;
    default:
      blind = false;
  }
  return blind;
}

/**
 * Where a teller window stands, for the picture.
 *
 * @param at - which of the three
 * @returns the middle of that window, in bank pixels
 */
export function tellerSpot(at: number): Vec {
  const col = TELLERS[at] ?? TELLERS[0];
  return { x: (col + MIDDLE) * SLAB, y: (COUNTER_ROW + MIDDLE) * SLAB };
}

/**
 * Where the alarm button is, for the picture and for whoever runs at it.
 *
 * @param bank - the bank as it stands
 * @returns the spot behind the counter it is under
 */
export function buttonSpot(bank: BankState): Vec {
  const teller = tellerSpot(bank.button);
  return { x: teller.x, y: BUTTON_ROW * SLAB };
}

/**
 * Where the vault door is, for the picture.
 *
 * @returns the middle of the doorway in the vault's south wall
 */
export function vaultDoor(): Vec {
  return VAULT_DOOR;
}

/**
 * Where the way out is, for the picture.
 *
 * @returns the front door
 */
export function wayOut(): Vec {
  return WAY_OUT;
}

/**
 * How long is left before the police walk in.
 *
 * @param bank - the bank as it stands
 * @returns seconds, or null while nobody has rung
 */
export function leftInBank(bank: BankState): number | null {
  return bank.raidAt === null ? null : Math.max(0, bank.raidAt - bank.time);
}

/* --------------------------------------------------------------- the boxes */

/**
 * The safe-deposit boxes, filled by chance.
 *
 * @param rng - where the randomness stands
 * @returns one box per square of the vault's walls, and the state after
 * @remarks
 * **Every wall of the vault is boxes**, which is what a vault room looks like
 * and what makes the last part of the job a circuit rather than a button. What
 * is in each of them is drawn there and then: a few hundred in most, a couple
 * of thousand in a good one, and no way to tell which from the outside. That
 * is the gamble the clock is spent on.
 */
function fillBoxes(rng: RandomState): {
  readonly boxes: readonly BankBox[];
  readonly rng: RandomState;
} {
  const boxes: BankBox[] = [];
  let state = rng;
  for (let row = 0; row < PLAN_HIGH; row += 1) {
    for (let col = 0; col < PLAN_WIDE; col += 1) {
      if (slotAt(col, row) === "box") {
        const draw = nextRandom(state);
        state = draw.state;
        boxes.push({
          col,
          row,
          facing: boxFacing(col, row),
          cash: Math.round(BOX_LEAST + draw.value * draw.value * BOX_SPREAD),
          work: 0,
          open: false,
        });
      }
    }
  }
  return { boxes, rng: state };
}

/** Which way a box door faces: towards whichever side the room is on. */
function boxFacing(col: number, row: number): number {
  const room = [
    { at: { col, row: row + 1 }, turn: Math.PI / 2 },
    { at: { col, row: row - 1 }, turn: -Math.PI / 2 },
    { at: { col: col + 1, row }, turn: 0 },
    { at: { col: col - 1, row }, turn: Math.PI },
  ].find((side) => slotAt(side.at.col, side.at.row) === "vaultFloor");
  return room?.turn ?? Math.PI / 2;
}

/** The middle of a box's square, in bank pixels. */
function boxSpot(box: BankBox): Vec {
  return { x: (box.col + MIDDLE) * SLAB, y: (box.row + MIDDLE) * SLAB };
}

/**
 * And the face of its door, which stands in the room rather than in the wall.
 *
 * @param box - which box
 * @returns a point just clear of it, on the side the room is
 * @remarks
 * **Just clear of it, not exactly on the edge of it.** Half a square lands on
 * the line between two squares, and a point on a line belongs to whichever of
 * them the arithmetic rounds to - which for a box is the box itself. So it is
 * a little further out, where the floor unambiguously is.
 */
function boxFace(box: BankBox): Vec {
  const spot = boxSpot(box);
  return {
    x: spot.x + Math.cos(box.facing) * SLAB * FACE_OUT,
    y: spot.y + Math.sin(box.facing) * SLAB * FACE_OUT,
  };
}

/* -------------------------------------------------------------- the player */

/** The keys, the mouse and the walls. */
function walkHero(bank: BankState, input: Input, dt: number): BankState {
  const hero = bank.hero;
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const length = Math.hypot(dx, dy);
  const pace = WALK_SPEED * (input.boost ? RUN_WALK : 1);
  const step = length === 0 ? 0 : (pace * dt) / length;
  const wantX = hero.x + dx * step;
  const x = clear(bank.vault, wantX, hero.y) ? wantX : hero.x;
  const wantY = hero.y + dy * step;
  const y = clear(bank.vault, x, wantY) ? wantY : hero.y;
  // **The gun points at the mouse, not at the feet.** Which way he walks and
  // which way he aims are two questions in here, and the whole opening of the
  // job is the second one: whoever has to turn his whole body to cover the
  // third window has already lost the first four seconds.
  const aim = input.aim;
  const facing = Math.atan2(aim.y - y, aim.x - x);
  return {
    ...bank,
    aim,
    hero: {
      x,
      y,
      heading: facing,
      walked: hero.walked + Math.hypot(x - hero.x, y - hero.y),
    },
  };
}

/** Whether a body may stand with its middle here. */
function clear(vault: number, x: number, y: number): boolean {
  return (
    !solid(vault, x - HALF_BODY, y - HALF_BODY) &&
    !solid(vault, x + HALF_BODY, y - HALF_BODY) &&
    !solid(vault, x - HALF_BODY, y + HALF_BODY) &&
    !solid(vault, x + HALF_BODY, y + HALF_BODY)
  );
}

/**
 * Whoever the gun is pointing at, and what it does to them.
 *
 * @remarks
 * Three things have to be true at once: the crosshair is on them, they are
 * within {@link GUN_RANGE}, and there is nothing between. Then their hands go
 * up after {@link HANDS_UP} and stay up while the gun stays on them; the
 * moment it leaves, their nerve starts coming back - see {@link NERVE_BACK}.
 */
function coverFolk(bank: BankState, dt: number): BankState {
  const under = underTheGun(bank);
  return {
    ...bank,
    folk: bank.folk.map((one) => {
      let next = one;
      if (one === under && awake(one)) {
        const work = one.mood === "held" ? 1 : one.work + dt / HANDS_UP;
        next = {
          ...one,
          work: Math.min(1, work),
          mood: work >= 1 ? "held" : one.mood,
          // Under the gun his clock does not run at all, and once his hands
          // are up it is wound further back: somebody who has been cowed
          // stays cowed a while after the gun goes elsewhere.
          panicAt: bank.time + (work >= 1 ? HELD_NERVE : NERVE_BACK),
          heading: Math.atan2(bank.hero.y - one.y, bank.hero.x - one.x),
        };
      } else if (awake(one) && one.mood !== "held" && one.work > 0) {
        next = { ...one, work: Math.max(0, one.work - dt / HANDS_UP) };
      }
      return next;
    }),
  };
}

/**
 * Who the crosshair is on, or null.
 *
 * @param bank - the bank as it stands
 * @returns the person the gun has found, and null for the wall beside her
 * @remarks
 * Exported because the picture has to draw the ring: whether one is covering
 * the woman at the button or the panelling behind her is the whole of the
 * first four seconds, and a player who cannot see which has been given a
 * puzzle rather than a robbery.
 */
export function underTheGun(bank: BankState): BankFolk | null {
  let best: BankFolk | null = null;
  let bestAway = GUN_SPOT;
  for (const one of bank.folk) {
    const spot = away(one, bank.aim);
    if (
      awake(one) &&
      spot < bestAway &&
      away(one, bank.hero) < GUN_RANGE &&
      inSight(bank.vault, bank.hero, one)
    ) {
      best = one;
      bestAway = spot;
    }
  }
  return best;
}

/**
 * The mouse button: a shot at whatever the crosshair is on.
 *
 * @param bank - the bank as it stands
 * @param input - the keys and the mouse this frame
 * @param dt - seconds since the last step
 * @param weapon - what is in the player's hand
 * @param lines - what to say about it
 * @returns the bank one step on
 * @remarks
 * **One trigger, two jobs**, and the crosshair decides which. On a person it
 * is a decision rather than a tool: it works, it is the fastest way to take
 * somebody out of the game, and it is silent as far as the street is concerned
 * because nobody in here has pressed anything. It costs the money a hostage
 * would have been worth in time saved - and, if the man on the floor is the
 * director, the vault, for good.
 *
 * On a **deposit box** it is the way in. Those doors are steel, and what opens
 * one is not skill but whatever one is carrying: see {@link BOX_TIME}.
 */
function pullTrigger(
  bank: BankState,
  input: Input,
  dt: number,
  weapon: WeaponKind,
  lines: string[],
): BankState {
  const hit = underTheGun(bank);
  let next = bank;
  if (!input.fire) {
    return next;
  }
  if (hit !== null) {
    if (bank.time - bank.shotAt >= SHOT_GAP) {
      next = { ...bank, shotAt: bank.time };
      if (hit.role === "boss") {
        lines.push(
          "Der Direktor liegt. Den Tresor macht jetzt keiner mehr auf.",
        );
      } else if (hit.role === "clerk") {
        lines.push("Eine der Angestellten liegt hinter dem Tresen.");
      } else {
        lines.push("Ein Kunde liegt am Boden.");
      }
      next = {
        ...next,
        folk: next.folk.map((one) =>
          one === hit ? { ...one, mood: "dead", work: 0 } : one,
        ),
      };
    }
  } else {
    const box = boxUnderGun(bank, weapon);
    const rate = boxRate(weapon);
    if (box !== null && rate > 0) {
      next = { ...bank, shotAt: bank.time };
      next = breakOpen(next, box, Math.min(1, box.work + dt * rate), lines);
    }
  }
  return next;
}

/**
 * How long each weapon needs on one box door, in seconds.
 *
 * @remarks
 * **Not the damage table.** What a steel door cares about is not how much a
 * weapon hurts a man: a knife is the deadliest thing in the city at arm's
 * length and it is the slowest thing here, because prising a lock with a blade
 * is prising a lock with a blade. A pistol shoots the lock off, a machine gun
 * takes the door with it, and anything that goes off takes the whole box.
 *
 * A **fist** is not in the table at all, and that is the point of it: bare
 * hands do not open a bank's deposit boxes, and a room one can clear with
 * nothing in one's hands is a room with nothing to decide in it.
 */
const BOX_TIME: Readonly<Partial<Record<WeaponKind, number>>> = {
  knuckles: 9,
  baton: 8,
  knife: 6,
  pistol: 2.5,
  flamer: 3.5,
  mg: 0.8,
  rpg: 0,
  grenade: 0,
  remote: 0,
};

/** How much of a box one second of this weapon opens. */
function boxRate(weapon: WeaponKind): number {
  const seconds = BOX_TIME[weapon];
  let rate: number;
  if (seconds === undefined) {
    rate = 0;
  } else if (seconds <= 0) {
    rate = Number.POSITIVE_INFINITY;
  } else {
    rate = 1 / seconds;
  }
  return rate;
}

/**
 * Which box the crosshair is on, or null.
 *
 * @param bank - the bank as it stands
 * @param weapon - what is in the player's hand
 * @returns the box being worked on
 * @remarks
 * A gun reaches across the room and a blade reaches as far as an arm: what one
 * is holding decides how close one has to stand, the same way it does to a
 * person.
 */
function boxUnderGun(bank: BankState, weapon: WeaponKind): BankBox | null {
  const kit = WEAPONS[weapon];
  const arm = kit.way === "shot" || kit.way === "blast" || kit.way === "flame";
  const far = arm ? GUN_RANGE : Math.max(kit.range, REACH) + HALF_BODY;
  let best: BankBox | null = null;
  let bestAway = GUN_SPOT;
  for (const box of bank.boxes) {
    const spot = boxSpot(box);
    const gap = away(spot, bank.aim);
    if (
      !box.open &&
      gap < bestAway &&
      away(spot, bank.hero) < far &&
      // **To the face of it, not to the middle of it.** A box is set into the
      // wall, and a wall is the one thing that stops a shot - so asked whether
      // it can see the *square* the box is in, the answer is always no. What
      // one shoots at is the door, which stands in the room.
      inSight(bank.vault, bank.hero, boxFace(box))
    ) {
      best = box;
      bestAway = gap;
    }
  }
  return best;
}

/**
 * The space bar held down on whoever is in front of the player.
 *
 * @remarks
 * **One key, one job, now that the other two have found their own.** The vault
 * door belongs to the director - see {@link runFolk} - and a deposit box
 * belongs to whatever is in one's hands. What is left for the space bar is the
 * rope, and picking money up off the floor needs no key at all: one walks over
 * it.
 */
function doWork(
  bank: BankState,
  input: Input,
  dt: number,
  lines: string[],
): BankState {
  let next = bank;
  if (input.lift) {
    // The director is not tied while the vault is shut: a man with his hands
    // behind his back cannot work a wheel.
    const folk = nearestFolk(
      bank,
      (one) =>
        one.mood === "held" &&
        away(one, bank.hero) < REACH + HALF_BODY &&
        (one.role !== "boss" || bank.vault >= 1),
    );
    next = folk === null ? { ...bank, work: 0 } : tieUp(bank, folk, dt, lines);
  } else if (bank.work > 0) {
    next = { ...bank, work: 0 };
  }
  return next;
}

/** One person, tied at the wrists and out of the job. */
function tieUp(
  bank: BankState,
  folk: BankFolk,
  dt: number,
  lines: string[],
): BankState {
  const work = bank.work + dt / TIE_SECONDS;
  let next: BankState;
  if (work >= 1) {
    lines.push(
      folk.role === "boss"
        ? "Der Direktor ist gefesselt."
        : "Gefesselt. Die geht nirgendwo mehr hin.",
    );
    next = {
      ...bank,
      work: 0,
      folk: bank.folk.map((one) =>
        one === folk ? { ...one, mood: "tied", work: 1 } : one,
      ),
    };
  } else {
    next = { ...bank, work };
  }
  return next;
}

/**
 * One box, open, and what falls out of it.
 *
 * @param bank - the bank as it stands
 * @param box - which box
 * @param work - how far it has got now, from nought to one
 * @param lines - what to say about it
 * @returns the bank with the box that much further open
 * @remarks
 * What is inside lands **on the floor in front of the door**, the way a
 * passer-by drops his wallet when he goes down in the street - and it is
 * picked up the same way, by walking over it. Money in a box one has opened
 * but not walked past is money one has not got.
 */
function breakOpen(
  bank: BankState,
  box: BankBox,
  work: number,
  lines: string[],
): BankState {
  let next: BankState;
  if (work >= 1) {
    lines.push(`Fach auf: ${String(box.cash)} € fallen heraus.`);
    const spot = boxSpot(box);
    // Where it lands: out of the box and a little to one side, so that two
    // boxes next to each other do not drop their money on the same square.
    const swing = nextRandom(bank.rng);
    const cast = nextRandom(swing.state);
    const turn = box.facing + (swing.value - HALF) * SCATTER;
    const far = SLAB * (SPILL + cast.value * SPILL_MORE);
    next = {
      ...bank,
      rng: cast.state,
      boxes: bank.boxes.map((each) =>
        each === box ? { ...each, work: 1, open: true } : each,
      ),
      loot: [
        ...bank.loot,
        {
          ...clearOfHim(bank.hero, {
            x: spot.x + Math.cos(turn) * far,
            y: spot.y + Math.sin(turn) * far,
          }),
          cash: box.cash,
          dropAt: bank.time,
        },
      ],
    };
  } else {
    next = {
      ...bank,
      boxes: bank.boxes.map((each) =>
        each === box ? { ...each, work } : each,
      ),
    };
  }
  return next;
}

/**
 * The bundle, pushed out of the robber's own feet.
 *
 * @param hero - where he is standing
 * @param spot - where the money would have landed
 * @returns that spot, or the nearest one he is not already on
 * @remarks
 * He is standing at the box he has just opened, and money scatters: sooner or
 * later a bundle lands under him and goes straight into the bag, which is the
 * one thing it is not supposed to do. So it bounces clear of him - out along
 * the line from him to where it fell, far enough that he has to take a step.
 */
function clearOfHim(hero: Vec, spot: Vec): Vec {
  const gap = away(hero, spot);
  let out: Vec;
  if (gap >= PUSH_CLEAR) {
    out = spot;
  } else if (gap < 1) {
    out = { x: hero.x, y: hero.y + PUSH_CLEAR };
  } else {
    out = {
      x: hero.x + ((spot.x - hero.x) / gap) * PUSH_CLEAR,
      y: hero.y + ((spot.y - hero.y) / gap) * PUSH_CLEAR,
    };
  }
  return out;
}

/** How far clear of the robber a bundle always lands, in pixels. */
const PUSH_CLEAR = 34;

/** Whatever one walks over, into the bag. */
function pickUp(bank: BankState): BankState {
  const took = bank.loot.filter(
    (drop) =>
      away(drop, bank.hero) < PICK_UP && bank.time - drop.dropAt >= LIE_STILL,
  );
  return took.length === 0
    ? bank
    : {
        ...bank,
        taken: bank.taken + took.reduce((sum, drop) => sum + drop.cash, 0),
        loot: bank.loot.filter((drop) => !took.includes(drop)),
      };
}

/**
 * Whether the man with the combination has been brought to the door.
 *
 * @param bank - the bank as it stands
 * @returns true while the robber is standing at the vault with him in tow
 * @remarks
 * Two things, and the player only does one of them: he stands at the door, and
 * the director is close enough behind him to have come along. What happens
 * next is not a key press - see {@link workTheDoor}.
 */
function atTheDoorWithHim(bank: BankState, boss: BankFolk): boolean {
  return (
    boss.mood === "held" &&
    away(VAULT_DOOR, bank.hero) < VAULT_ROOM &&
    away(boss, bank.hero) < VAULT_ROOM
  );
}

/* ---------------------------------------------------------------- the room */

/**
 * Everybody else, one step on.
 *
 * @remarks
 * One rule, three uses of it: **whoever is not being watched and has run out
 * of nerve does the worst thing they can do to you.** For a clerk that is the
 * button under her own window; for a customer it is the knot round the wrists
 * of whichever clerk is nearest. Somebody with their hands up walks where the
 * gun walks, which is how the director gets to the vault door.
 */
function runFolk(bank: BankState, dt: number, lines: string[]): BankState {
  let rung = bank.alarm;
  const button = buttonSpot(bank);
  const folk = bank.folk.map((one) => {
    let next = one;
    if (one.mood === "held" && one.role === "boss") {
      next = walkTheBoss(bank, one, dt);
    } else if (
      one.mood === "held" &&
      one.role !== "boss" &&
      bank.time >= one.panicAt
    ) {
      // **Hands do not stay up by themselves.** Only the rope keeps somebody
      // out of the job; everybody else works out, sooner or later, that the
      // gun is pointing somewhere else now. The director is the exception:
      // he has been told what happens to him and he believes it.
      lines.push("Die Hände gehen wieder runter.");
      next = { ...one, mood: "loose", work: 0, panicAt: bank.time };
    } else if (one.mood === "loose" && bank.time >= one.panicAt) {
      if (one.role === "customer") {
        next = freeSomebody(bank, one, dt);
      } else if (one.role === "clerk") {
        next = { ...one, ...toward(one, button, FOLK_PACE, dt) };
        if (away(next, button) < REACH) {
          rung = true;
        }
      }
    }
    return next;
  });
  // A customer who has been working at a knot may have finished it.
  const loosened = untied(bank, folk, dt, lines);
  // And the director may have finished the door.
  const boss = loosened.find((one) => one.role === "boss");
  const vault =
    boss !== undefined && boss.opens >= 1 ? 1 : Math.min(1, bank.vault);
  if (vault >= 1 && bank.vault < 1) {
    lines.push("Das Rad dreht sich, der Tresor steht offen.");
  }
  if (rung && !bank.alarm) {
    lines.push("Der stille Alarm ist raus. Sie sind unterwegs.");
  }
  return {
    ...bank,
    folk: loosened,
    vault,
    alarm: rung,
    raidAt: rung && !bank.alarm ? bank.time + ALARM_GRACE : bank.raidAt,
  };
}

/**
 * The director, who is either being marched or working.
 *
 * @param bank - the bank as it stands
 * @param boss - the man himself
 * @param dt - seconds since the last step
 * @returns him, one step on
 * @remarks
 * **Standing him at the door is the whole of the player's part.** From there
 * it is his job and one watches him do it: he peels off towards the lock,
 * takes the key out, turns it, and then leans on the wheel until the door
 * comes open. Asking for a key press on top of that would be asking the player
 * to do the one thing in this room he cannot do - he has not got the key.
 *
 * He only works while the gun is in the room with him. Walk off and he stops
 * where he is, with the key still in the lock, and starts again when the
 * robber comes back: which is exactly what a man at gunpoint does.
 */
function walkTheBoss(bank: BankState, boss: BankFolk, dt: number): BankFolk {
  let next: BankFolk;
  if (bank.vault >= 1) {
    // Nothing left to open: he goes where he is told, like everybody else.
    next =
      away(boss, bank.hero) > CLERK_GAP
        ? { ...boss, ...toward(boss, bank.hero, FOLK_PACE, dt) }
        : boss;
  } else if (atTheDoorWithHim(bank, boss)) {
    next = workTheDoor(boss, dt);
  } else {
    next =
      away(boss, bank.hero) > CLERK_GAP
        ? { ...boss, ...toward(boss, bank.hero, FOLK_PACE, dt) }
        : boss;
  }
  return next;
}

/**
 * Him at the lock: first the walk to it, then the key, then the wheel.
 *
 * @param boss - the man himself
 * @param dt - seconds since the last step
 * @returns him, that much further through it
 */
function workTheDoor(boss: BankFolk, dt: number): BankFolk {
  const there = away(boss, VAULT_KEY) < HALF_BODY;
  return there
    ? {
        ...boss,
        heading: -Math.PI / 2,
        opens: Math.min(1, boss.opens + dt / DOOR_RITUAL),
      }
    : { ...boss, ...toward(boss, VAULT_KEY, FOLK_PACE, dt) };
}

/** One customer, on his way to whoever is tied up nearest him. */
function freeSomebody(bank: BankState, who: BankFolk, dt: number): BankFolk {
  const tied = nearestTo(
    who,
    bank.folk.filter((one) => one.mood === "tied" && one.role === "clerk"),
  );
  let next = who;
  if (tied !== null) {
    next =
      away(who, tied) > REACH
        ? { ...who, ...toward(who, tied, FOLK_PACE, dt) }
        : { ...who, undo: who.undo + dt / FREE_SECONDS };
  }
  return next;
}

/** Whoever a customer has got the rope off, and what that costs. */
function untied(
  bank: BankState,
  folk: readonly BankFolk[],
  dt: number,
  lines: string[],
): readonly BankFolk[] {
  const done = folk.find(
    (one) => one.role === "customer" && one.mood === "loose" && one.undo >= 1,
  );
  let next = folk;
  if (done !== undefined) {
    const freed = nearestTo(
      done,
      folk.filter((one) => one.mood === "tied" && one.role === "clerk"),
    );
    if (freed !== null) {
      lines.push("Ein Kunde hat eine der Angestellten losgebunden.");
      next = folk.map((one) => {
        let after = one;
        if (one === freed) {
          after = { ...one, mood: "loose", work: 0, panicAt: bank.time + dt };
        } else if (one === done) {
          after = { ...one, undo: 0, panicAt: bank.time + NERVE_BACK };
        }
        return after;
      });
    }
  }
  return next;
}

/** One step of somebody walking somewhere. */
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

/* --------------------------------------------------------------- counting */

/** Whether this one can still do anything about anything. */
function awake(one: BankFolk): boolean {
  return one.mood !== "dead" && one.mood !== "tied";
}

/** The nearest person to the player that the test lets through, or null. */
function nearestFolk(
  bank: BankState,
  test: (one: BankFolk) => boolean,
): BankFolk | null {
  let best: BankFolk | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const one of bank.folk) {
    const gap = away(one, bank.hero);
    if (test(one) && gap < bestAway) {
      best = one;
      bestAway = gap;
    }
  }
  return best;
}

/** The nearest of a handful of people to a point. */
function nearestTo(from: Vec, folk: readonly BankFolk[]): BankFolk | null {
  let best: BankFolk | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const one of folk) {
    const gap = away(from, one);
    if (gap < bestAway) {
      best = one;
      bestAway = gap;
    }
  }
  return best;
}

/** One of the three women behind the counter. */
function person(
  col: number,
  at: number,
  button: number,
  time: number,
  look: number,
): BankFolk {
  return {
    x: (col + MIDDLE) * SLAB,
    y: (STAFF_ROW + MIDDLE) * SLAB,
    // They are looking down the hall, at the door.
    heading: Math.PI / 2,
    walked: 0,
    role: "clerk",
    mood: "loose",
    // **The one at the button goes first.** She has only to reach down, so
    // she is the four seconds the opening of the job is made of; the other
    // two have to walk the length of the counter to get there.
    panicAt: time + FIRST_FUSE + (at === button ? 0 : NERVE_APART * at + 2),
    post: at,
    work: 0,
    undo: 0,
    opens: 0,
    look,
  };
}

/** How far apart two points are, in bank pixels. */
function away(one: Vec, two: Vec): number {
  return Math.hypot(one.x - two.x, one.y - two.y);
}
