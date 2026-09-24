/**
 * Inside the bank: the counter, the clerks, the alarm button and the vault.
 *
 * @module
 * @remarks
 * The fourth little world, after the jail and the printing works, and the
 * smallest of them. One room, one decision repeated: whoever is not being
 * watched walks towards the button under the counter.
 *
 * That is the whole game in here. Three clerks, one gun and one pair of eyes -
 * covering somebody means standing near them, so every second spent at a till
 * or at the vault is a second in which the two behind you are edging towards
 * the alarm. A robbery that goes quietly buys a long, quiet walk out of the
 * front door; one that does not buys two stars and a chase.
 */
import {
  ALARM_GRACE,
  BANK_COVER,
  BANK_GRACE,
  RUN_WALK,
  MAX_STEP,
  PANIC_AFTER,
  REACH,
  SLAB,
  TAKE_SECONDS,
  TILL_EACH,
  TILL_SECONDS,
  VAULT_RATE,
  VAULT_ROOM,
  VAULT_SECONDS,
  VAULT_TOTAL,
  WALK_SPEED,
  type BankState,
  type Clerk,
  type Input,
  type Till,
  type Vec,
} from "./types";

/**
 * The bank, one letter per square.
 *
 * @remarks
 * **South is the street**: one comes in at the bottom of the plan and works
 * *up* it. That is how a room one walks into reads - the door behind you, the
 * job in front of you - and it is the way round every top-down game puts a
 * building one enters on foot. The public half is the hall inside the door;
 * beyond the counter are the tills, the desks and - on the east wall, where
 * somebody has to cross the whole room to reach it - the alarm button. The
 * vault is through the door in the north wall, furthest from the street, and
 * what is in it is worth about four tills.
 */
export const PLAN: readonly string[] = [
  "oooooooooooooooooooooooooooooo",
  "##############################",
  "#vvvvvvvvvv###################",
  "#vvvvvvvvvv###################",
  "#vvvvvvvvvv###################",
  "######VV######################",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
  "#,,,,,dd,,,,,,,,,,,,,,dd,,,,,#",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,A",
  "#,T,,T,,T,,T,,,,,,,,,,,,,,,,,#",
  "#CCCCCCCCCCCCCCCCCCCCCC++CCCC#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#############DD###############",
  "oooooooooooooooooooooooooooooo",
  "oooooooooooooooooooooooooooooo",
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
  | "counter"
  | "gate"
  | "till"
  | "desk"
  | "door"
  | "vaultDoor"
  | "vault"
  | "alarm"
  | "free";

/** What each letter of the plan stands for. */
const LEGEND: Readonly<Record<string, Slot>> = {
  "#": "wall",
  ".": "hall",
  ",": "floor",
  C: "counter",
  "+": "gate",
  T: "till",
  d: "desk",
  D: "door",
  V: "vaultDoor",
  v: "vault",
  A: "alarm",
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

/**
 * How fast a clerk edges towards the button, in pixels a second.
 *
 * @remarks
 * Half the pace of a man who is not being shouted at. It is what decides how
 * long the room gives one: from the far end of the counter the button is about
 * fifteen seconds away, which is three people covered if one does not dawdle.
 */
const CLERK_PACE = 70;

/** How close behind the gun a hostage walks, in bank pixels. */
const CLERK_GAP = 56;

/* eslint-disable @typescript-eslint/no-magic-numbers -- what follows are places
   on the plan above: which square a till stands on, where the clerks are when
   the door goes. They are a map, not arithmetic. */

/** Where the player comes in: just inside the front door, at the south wall. */
const DOOR_IN: Vec = { x: 14 * SLAB, y: 14.4 * SLAB };

/** The four tills along the counter, and the square one stands at. */
const TILL_SPOTS: readonly Vec[] = [
  { x: 2.5 * SLAB, y: 9.5 * SLAB },
  { x: 5.5 * SLAB, y: 9.5 * SLAB },
  { x: 8.5 * SLAB, y: 9.5 * SLAB },
  { x: 11.5 * SLAB, y: 9.5 * SLAB },
];

/** Where the clerks are standing when somebody walks in with a gun. */
const CLERK_SPOTS: readonly Vec[] = [
  { x: 4.5 * SLAB, y: 8.5 * SLAB },
  { x: 10.5 * SLAB, y: 7.5 * SLAB },
  { x: 17.5 * SLAB, y: 8.5 * SLAB },
];

/** The button on the east wall. */
const BUTTON: Vec = { x: 29.5 * SLAB, y: 8.5 * SLAB };

/** The vault door in the north wall. */
const VAULT_DOOR: Vec = { x: 6.5 * SLAB, y: 5.5 * SLAB };

/** The middle of the vault room behind it. */
const VAULT_MIDDLE: Vec = { x: 5.5 * SLAB, y: 4 * SLAB };

/** The way out: the front door, back down at the street. */
const WAY_OUT: Vec = { x: 13.5 * SLAB, y: 15.5 * SLAB };

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The bank at the moment somebody points a gun over the counter.
 *
 * @param time - the simulation clock of the city, so the two agree
 * @returns a fresh hold-up: nothing taken, nobody covered, no alarm
 */
export function enterBank(time: number): BankState {
  return {
    time,
    // He comes in off the street, which is below: looking north, up the room.
    hero: { x: DOOR_IN.x, y: DOOR_IN.y, heading: -Math.PI / 2, walked: 0 },
    staff: CLERK_SPOTS.map((spot, at) => ({
      x: spot.x,
      y: spot.y,
      // And they are looking the other way: down the hall, at the door.
      heading: Math.PI / 2,
      walked: 0,
      held: false,
      // They do not all break for the button at once: the first one tries
      // almost at once, the last one takes a few seconds to find his nerve.
      panicAt: time + PANIC_AFTER * (at + 1),
    })),
    tills: TILL_SPOTS.map(() => ({ open: false, work: 0 })),
    taken: 0,
    vault: 0,
    alarm: false,
    raidAt: time + BANK_GRACE,
    work: 0,
  };
}

/**
 * One step of the hold-up.
 *
 * @param bank - the bank as it stands
 * @param input - the keys and the mouse this frame
 * @param dt - seconds since the last step
 * @returns the bank one step on, what to say about it, and how it ended
 */
export function advanceBank(
  bank: BankState,
  input: Input,
  dt: number,
): BankTurn {
  const slice = Math.min(dt, MAX_STEP);
  const lines: string[] = [];
  let next: BankState = { ...bank, time: bank.time + slice };
  next = walkHero(next, input, slice);
  next = doWork(next, input, slice, lines);
  next = loot(next, slice);
  next = runStaff(next, slice, lines);
  let done: BankTurn["done"] = "on";
  if (slotUnder(next.hero.x, next.hero.y) === "door") {
    done = "out";
  } else if (next.time >= next.raidAt) {
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
  const loose = bank.staff.filter((one) => !one.held).length;
  let line: string;
  if (loose > 0) {
    line = `${String(loose)} noch nicht unter Kontrolle - hin und Maus halten, sonst drücken sie den Knopf.`;
  } else if (bank.vault < 1) {
    line =
      "Einen Angestellten mit an die Tresortür nehmen und die Maus halten.";
  } else if (bank.taken < inTheHouse(bank)) {
    line = "Im Tresorraum stehen bleiben - und die Kassen nicht vergessen.";
  } else {
    line = "Alles drin. Raus durch die Vordertür.";
  }
  return line;
}

/**
 * How much there is to be had altogether, as it stands.
 *
 * @param bank - the bank as it stands
 * @returns what the vault holds plus whatever the open drawers held
 */
export function inTheHouse(bank: BankState): number {
  return (
    bank.tills.filter((till) => till.open).length * TILL_EACH + VAULT_TOTAL
  );
}

/**
 * Where the job in hand is, so the picture can ring it.
 *
 * @param bank - the bank as it stands
 * @returns the spot to walk to, or null when there is nothing to stand at
 */
export function markOf(bank: BankState): Vec | null {
  const loose = looseClerk(bank);
  let mark: Vec | null;
  if (loose !== null) {
    mark = { x: loose.x, y: loose.y };
  } else if (bank.vault < 1) {
    mark = VAULT_DOOR;
  } else {
    mark = VAULT_MIDDLE;
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
    case "till":
    case "desk":
    case "alarm":
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
 * Where the tills are, for the picture.
 *
 * @returns one spot per till, where whoever empties it stands
 */
export function tillSpots(): readonly Vec[] {
  return TILL_SPOTS;
}

/**
 * Where the alarm button is, for the picture.
 *
 * @returns the square on the east wall
 */
export function buttonSpot(): Vec {
  return BUTTON;
}

/**
 * Where the vault door is, for the picture.
 *
 * @returns the middle of the doorway in the north wall
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
 * @returns seconds, never below zero
 */
export function leftInBank(bank: BankState): number {
  return Math.max(0, bank.raidAt - bank.time);
}

/* -------------------------------------------------------------- the player */

/** The keys and the walls. */
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
  return {
    ...bank,
    hero: {
      x,
      y,
      heading: length === 0 ? hero.heading : Math.atan2(dy, dx),
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
 * The mouse held down on whatever is in front of the player.
 *
 * @remarks
 * Three jobs, one button, and which one it is doing is a question of where he
 * is standing: at a clerk it takes him out of the game, at a till it empties
 * the drawer, at the vault door it makes somebody open it. The vault needs a
 * clerk standing with him - a locked vault has a combination, and the man who
 * knows it is behind the counter with his hands up.
 */
function doWork(
  bank: BankState,
  input: Input,
  dt: number,
  lines: string[],
): BankState {
  let next = bank;
  if (input.fire) {
    const clerk = nearClerk(bank);
    const till = nearTill(bank);
    if (clerk !== null) {
      next = holdUp(bank, clerk, dt, lines);
    } else if (till !== null) {
      next = empty(bank, till, dt, lines);
    } else if (away(VAULT_DOOR, bank.hero) < REACH && bank.vault < 1) {
      next = crack(bank, dt, lines);
    }
  }
  return next;
}

/** One clerk, talked into putting his hands up. */
function holdUp(
  bank: BankState,
  clerk: Clerk,
  dt: number,
  lines: string[],
): BankState {
  const work = bank.work + dt / TAKE_SECONDS;
  let next: BankState;
  if (work >= 1) {
    lines.push("Hände hoch. Der macht jetzt keinen Ärger mehr.");
    next = {
      ...bank,
      work: 0,
      staff: bank.staff.map((one) =>
        one === clerk ? { ...one, held: true } : one,
      ),
    };
  } else {
    next = { ...bank, work };
  }
  return next;
}

/** One till, emptied into the bag. */
function empty(
  bank: BankState,
  at: number,
  dt: number,
  lines: string[],
): BankState {
  const till = bank.tills[at];
  const work = till.work + dt / TILL_SECONDS;
  let next: BankState;
  if (work >= 1) {
    lines.push(`Kasse leer: ${String(TILL_EACH)} €.`);
    next = {
      ...bank,
      taken: bank.taken + TILL_EACH,
      tills: bank.tills.map((each, index) =>
        index === at ? { open: true, work: 1 } : each,
      ),
    };
  } else {
    next = {
      ...bank,
      tills: bank.tills.map((each, index) =>
        index === at ? { ...each, work } : each,
      ),
    };
  }
  return next;
}

/**
 * The vault, opened by somebody who has the combination.
 *
 * @remarks
 * Only with a clerk at hand. That is the one rule that makes the first minute
 * of the job about people rather than about doors: whoever shoots his way in
 * without covering anybody stands in front of a steel door with nobody to
 * open it.
 */
function crack(bank: BankState, dt: number, lines: string[]): BankState {
  const helper = bank.staff.some(
    (one) => one.held && away(one, bank.hero) < VAULT_ROOM,
  );
  const vault = helper ? Math.min(1, bank.vault + dt / VAULT_SECONDS) : 0;
  if (bank.vault < 1 && vault >= 1) {
    lines.push("Der Tresor steht offen.");
  }
  if (!helper && bank.vault === 0) {
    lines.push("Ohne einen Angestellten geht die Tür nicht auf.");
  }
  return { ...bank, vault };
}

/**
 * What is lying in the open vault, into the bag.
 *
 * @remarks
 * The vault holds what the vault holds. Whatever came out of the drawers is
 * counted on top of it, so a robber who skipped the tills to save a minute has
 * exactly that much less in the bag - which is the point of having tills at
 * all.
 */
function loot(bank: BankState, dt: number): BankState {
  const inside =
    bank.vault >= 1 && slotUnder(bank.hero.x, bank.hero.y) === "vault";
  const drawers = bank.tills.filter((till) => till.open).length * TILL_EACH;
  return inside
    ? {
        ...bank,
        taken: Math.min(drawers + VAULT_TOTAL, bank.taken + VAULT_RATE * dt),
      }
    : bank;
}

/* --------------------------------------------------------------- the staff */

/**
 * The clerks, one step on.
 *
 * @remarks
 * Whoever has his hands up stays where he is. Everybody else walks for the
 * button on the east wall - unless the man with the gun is standing close
 * enough to see them, which is the whole of what covering somebody means.
 */
function runStaff(bank: BankState, dt: number, lines: string[]): BankState {
  let rung = bank.alarm;
  const staff = bank.staff.map((clerk) => {
    let next = clerk;
    const watched = away(clerk, bank.hero) < BANK_COVER;
    if (clerk.held && away(clerk, bank.hero) > CLERK_GAP) {
      // Whoever has his hands up walks where the gun walks. That is what
      // "make him open it" means: the man with the combination has to be
      // standing at the door, and he only gets there by being marched.
      next = { ...clerk, ...toward(clerk, bank.hero, CLERK_PACE, dt) };
    } else if (!clerk.held && !watched && bank.time >= clerk.panicAt) {
      next = { ...clerk, ...toward(clerk, BUTTON, CLERK_PACE, dt) };
      if (away(next, BUTTON) < REACH) {
        rung = true;
      }
    }
    return next;
  });
  if (rung && !bank.alarm) {
    lines.push("Einer hat den stillen Alarm gedrückt. Sie sind unterwegs.");
  }
  return {
    ...bank,
    staff,
    alarm: rung,
    // From the moment the button is pressed the clock is a different clock.
    raidAt:
      rung && !bank.alarm
        ? Math.min(bank.raidAt, bank.time + ALARM_GRACE)
        : bank.raidAt,
  };
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

/** The nearest clerk who has not given up yet, or null. */
function looseClerk(bank: BankState): Clerk | null {
  let best: Clerk | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const clerk of bank.staff) {
    const gap = away(clerk, bank.hero);
    if (!clerk.held && gap < bestAway) {
      best = clerk;
      bestAway = gap;
    }
  }
  return best;
}

/** The one within arm's reach, or null. */
function nearClerk(bank: BankState): Clerk | null {
  const clerk = looseClerk(bank);
  return clerk !== null && away(clerk, bank.hero) < REACH ? clerk : null;
}

/** Which till the player is standing at, or null. */
function nearTill(bank: BankState): number | null {
  const at = TILL_SPOTS.findIndex(
    (spot, index) =>
      !(bank.tills[index] ?? { open: true }).open &&
      away(spot, bank.hero) < REACH,
  );
  return at < 0 ? null : at;
}

/** How far apart two points are, in bank pixels. */
function away(one: Vec, two: Vec): number {
  return Math.hypot(one.x - two.x, one.y - two.y);
}

/** What a till is worth and how far it has been emptied. */
export type { Till };
