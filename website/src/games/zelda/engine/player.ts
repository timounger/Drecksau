/**
 * Link himself: walking with a soft start, rolling, the tools on A and B
 * (the sword and its spin among them), talking, reading, opening chests,
 * lifting rocks, pushing blocks, shrinking on the stump - and the boxes and
 * menus that pause the world.
 *
 * @module
 */
import { warpAt } from "./areas";
import { chestVisible, isCleared, tileFlag } from "./clearing";
import { stepDialog, stepHold, openDialog } from "./dialog";
import { addEffect } from "./effects";
import { PLAYER_HH, PLAYER_HW } from "./enemies";
import { isBottle, isHeld } from "./gear";
import {
  BODY_LIFT,
  CHARGE_TIME,
  SLASH_TIME,
  SPIN_TIME,
  fireArrow,
  placeBomb,
  throwBoomerang,
  throwRock,
} from "./items";
import { openMenu, stepMenu } from "./menu";
import {
  NPC_HH,
  NPC_HW,
  npcsHere,
  talkTo,
  waresHere,
  type NpcId,
  type Ware,
} from "./npcs";
import {
  DIR_VEC,
  LEAP_TIME,
  boxBlocked,
  dirOf,
  moveBody,
  overlaps,
} from "./physics";
import {
  TILE,
  TILE_CHARS,
  findTiles,
  isWarpTile,
  roomAt,
  tileAt,
  tileIndex,
} from "./tiles";
import {
  dig,
  drink,
  fireHook,
  shootFlame,
  startDash,
  startHop,
  stepDash,
  stepHop,
  shineLantern,
} from "./tools";
import {
  DIVE_SLOW,
  STROKE_BOOST,
  SWIM_SLOW,
  startDive,
  startStroke,
  stepSwim,
  updateSwim,
} from "./swim";
import { ITEM_FLAG, buy, openChest } from "./treasure";
import type {
  Block,
  Dir,
  EquipId,
  GameState,
  Input,
  StepReport,
} from "./types";
import { MESSAGES, SIGN_TEXTS } from "@/games/zelda/i18n/texts";

/** Walking speed, px/s - about a pixel and a quarter per frame, as on the GBA. */
const WALK_SPEED = 76;

/** How many times faster Link walks with the cheat on. */
const CHEAT_SPEED = 2;

/** How fast walking speed catches up with the stick, per second. */
const ACCEL = 26;

/** How fast Link comes to a stop once the stick is let go, per second. */
const DECEL = 38;

/** Below this speed a stopping Link stands still, px/s. */
const STOP_SPEED = 4;

/** Speed factor while holding the sword out to charge. */
const CHARGE_SLOW = 0.55;

/** Speed factor while holding the shield up. */
const SHIELD_SLOW = 0.5;

/** Speed factor while carrying a rock. */
const CARRY_SLOW = 0.8;

/** Speed factor of a shrunk Link out in the normal-sized world. */
const SMALL_SLOW = 0.7;

/** Roll speed, px/s. */
const ROLL_SPEED = 150;

/** Seconds a roll lasts. */
export const ROLL_TIME = 0.32;

/** Seconds between rolls. */
const ROLL_COOLDOWN = 0.18;

/** Seconds between dust puffs while rolling. */
const ROLL_DUST = 0.08;

/** Seconds the pose of a used tool holds Link still. */
const USE_TIME = 0.22;

/** Seconds the shrink or grow animation takes. */
export const SHRINK_TIME = 0.9;

/** Facing changes during the stump's spin. */
const SPIN_STEPS = 8;

/** The order Link turns in while spinning on the stump. */
const SPIN_FACINGS: readonly Dir[] = ["down", "left", "up", "right"];

/** Twinkles per second round the spinning Link. */
const TWINKLE_RATE = 20;

/** How far round Link the twinkles appear, px. */
const TWINKLE_SPREAD = 10;

/** How fast a twinkle rises, px/s. */
const TWINKLE_RISE = 20;

/** How far behind Link a roll's dust puffs up, px. */
const DUST_BEHIND = 6;

/** Seconds of leaning against a block before it moves. */
const PUSH_TIME = 0.38;

/** How far in front of Link things can be reached, px. */
const REACH = 10;

/** A stick this close to one axis counts as pushing straight. */
const STRAIGHT = 0.4;

/** Seconds of walking against a low ledge before Link hops down. */
const LEDGE_WAIT = 0.15;

/** Something Link can do with A or R right where he stands. */
export type Interaction =
  | { readonly kind: "sign"; readonly text: string }
  | { readonly kind: "npc"; readonly id: NpcId }
  | { readonly kind: "chest"; readonly tx: number; readonly ty: number }
  | { readonly kind: "ware"; readonly ware: Ware }
  | { readonly kind: "lift"; readonly tx: number; readonly ty: number }
  | { readonly kind: "stump" }
  | { readonly kind: "throw" };

/** Buttons that went down this step. */
type Pressed = {
  readonly a: boolean;
  readonly b: boolean;
  readonly r: boolean;
  readonly start: boolean;
};

/**
 * Handles one step of Link - or of the box, menu or animation that holds
 * the world still.
 *
 * @param state - the game
 * @param input - this step's buttons
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 * @returns true if the world should stand still this step
 */
export function stepPlayer(
  state: GameState,
  input: Input,
  report: StepReport,
  dt: number,
): boolean {
  const prev = state.prev;
  const pressed: Pressed = {
    a: input.a && !prev.a,
    b: input.b && !prev.b,
    r: input.r && !prev.r,
    start: input.start && !prev.start,
  };
  const confirm = pressed.a || pressed.b || pressed.r || pressed.start;
  let paused = true;
  if (state.dialog !== null) {
    stepDialog(state, confirm, report, dt);
    stepHold(state, dt);
  } else if (state.hold !== null) {
    stepHold(state, dt);
  } else if (state.menu !== null) {
    stepMenu(state, input, report, dt);
  } else if (state.player.shrinkT > 0) {
    stepShrink(state, report, dt);
  } else if (pressed.start) {
    openMenu(state, report);
  } else {
    paused = false;
    act(state, input, pressed, report, dt);
  }
  return paused;
}

/**
 * What A or R would do right now, if anything besides the tool on A or a
 * roll.
 *
 * @param state - the game
 * @returns the interaction, or null
 */
export function interaction(state: GameState): Interaction | null {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  const ax = player.x + v.x * REACH;
  const ay = player.y + v.y * REACH;
  const tx = Math.floor(ax / TILE);
  const ty = Math.floor(ay / TILE);
  const letter = tileAt(state.area, tx, ty);
  const here = tileAt(
    state.area,
    Math.floor(player.x / TILE),
    Math.floor(player.y / TILE),
  );
  // Across the counter the reach is one tile longer.
  const far = letter === TILE_CHARS.counter ? TILE : 0;
  const npc = npcsHere(state).find((one) =>
    overlaps(
      ax + v.x * far,
      ay + v.y * far,
      2,
      2,
      one.x,
      one.y,
      NPC_HW + 2,
      NPC_HH + 2,
    ),
  );
  const ware = waresHere(state).find((one) => one.tx === tx && one.ty === ty);
  let found: Interaction | null = null;
  if (player.swimming) {
    // Nothing to talk to or open out in the water.
    found = null;
  } else if (player.carrying) {
    found = { kind: "throw" };
  } else if (npc !== undefined) {
    found = { kind: "npc", id: npc.id };
  } else if (ware !== undefined && player.facing === "up") {
    found = { kind: "ware", ware };
  } else if (letter === TILE_CHARS.sign) {
    found = { kind: "sign", text: signText(state, tx, ty) };
  } else if (
    letter === TILE_CHARS.chest &&
    chestVisible(state, tx, ty) &&
    !state.flags.has(tileFlag("chest", state.area, tx, ty))
  ) {
    found = { kind: "chest", tx, ty };
  } else if (letter === TILE_CHARS.heavyRock && !isCleared(state, tx, ty)) {
    found = { kind: "lift", tx, ty };
  } else if (here === TILE_CHARS.stump) {
    found = { kind: "stump" };
  }
  return found;
}

/** The text of a sign, by its place in reading order on its map. */
function signText(state: GameState, tx: number, ty: number): string {
  const index = findTiles(state.area, TILE_CHARS.sign).findIndex(
    (sign) => sign.tx === tx && sign.ty === ty,
  );
  return SIGN_TEXTS[state.area][index] ?? "";
}

/** The stump's spell: Link spins, twinkles and changes size halfway. */
function stepShrink(state: GameState, report: StepReport, dt: number): void {
  const player = state.player;
  const before = player.shrinkT;
  player.shrinkT = Math.max(0, player.shrinkT - dt);
  if (before > SHRINK_TIME / 2 && player.shrinkT <= SHRINK_TIME / 2) {
    player.small = !player.small;
    addEffect(state, "poof", player.x, player.y - BODY_LIFT);
  }
  const turn =
    Math.floor((player.shrinkT / SHRINK_TIME) * SPIN_STEPS) %
    SPIN_FACINGS.length;
  player.facing = SPIN_FACINGS[turn];
  if (
    Math.floor(before * TWINKLE_RATE) !==
    Math.floor(player.shrinkT * TWINKLE_RATE)
  ) {
    addEffect(
      state,
      "twinkle",
      player.x + (Math.random() * 2 - 1) * TWINKLE_SPREAD,
      player.y - BODY_LIFT + (Math.random() * 2 - 1) * TWINKLE_SPREAD,
      0,
      -TWINKLE_RISE,
    );
  }
  if (player.shrinkT <= 0) {
    player.facing = "down";
    report.events.push("text");
  }
}

/** Link's own step: timers, knockback and whatever he is doing. */
function act(
  state: GameState,
  input: Input,
  pressed: Pressed,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  player.invuln = Math.max(0, player.invuln - dt);
  player.rollCooldown = Math.max(0, player.rollCooldown - dt);
  if (player.knockT > 0) {
    player.knockT -= dt;
    moveBody(
      state,
      player,
      player.knockX * dt,
      player.knockY * dt,
      PLAYER_HW,
      PLAYER_HH,
    );
  }
  const action = player.action;
  switch (action.kind) {
    case "slash":
      action.t += dt;
      if (action.t >= SLASH_TIME) {
        player.action = { kind: "idle" };
        // Still holding its button: the sword stays out and charges the spin.
        player.charge = isHeld(state, input, "sword") ? dt : 0;
      }
      break;
    case "spin":
      action.t += dt;
      if (action.t >= SPIN_TIME) {
        player.action = { kind: "idle" };
      }
      break;
    case "roll": {
      const before = action.t;
      action.t += dt;
      moveBody(
        state,
        player,
        action.dx * ROLL_SPEED * dt,
        action.dy * ROLL_SPEED * dt,
        PLAYER_HW,
        PLAYER_HH,
        true,
      );
      player.walk += dt * 2;
      if (Math.floor(before / ROLL_DUST) !== Math.floor(action.t / ROLL_DUST)) {
        addEffect(state, "dust", player.x - action.dx * DUST_BEHIND, player.y);
      }
      if (action.t >= ROLL_TIME) {
        player.action = { kind: "idle" };
        player.rollCooldown = ROLL_COOLDOWN;
        player.vx = action.dx * WALK_SPEED;
        player.vy = action.dy * WALK_SPEED;
      }
      break;
    }
    case "use":
      action.t += dt;
      if (action.t >= USE_TIME) {
        player.action = { kind: "idle" };
      }
      break;
    case "dash":
      stepDash(state, input, report, dt);
      break;
    case "hop":
      stepHop(state, report, dt);
      break;
    case "hook":
      // The chain is flown and reeled in by the tools' own step.
      action.t += dt;
      break;
    case "leap":
      stepLeap(state, report, dt);
      break;
    default:
      if (player.knockT <= 0 && player.swimming) {
        swim(state, input, pressed, report, dt);
      } else if (player.knockT <= 0) {
        idle(state, input, pressed, report, dt);
      }
  }
  stepSwim(state, report, dt);
  updateSwim(state, report);
  checkWarp(state, report);
}

/** Walking about, and starting whatever the buttons ask for. */
function idle(
  state: GameState,
  input: Input,
  pressed: Pressed,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const inv = state.inv;
  const charging = player.charge > 0;
  // Shrunk, Link can only use his tools down in the root world, where
  // everything is his size again.
  const armed = !player.carrying && (!player.small || state.area === "mini");
  player.shieldUp = armed && isHeld(state, input, "shield") && !charging;
  const length = Math.hypot(input.moveX, input.moveY);
  const mx = length > 1 ? input.moveX / length : input.moveX;
  const my = length > 1 ? input.moveY / length : input.moveY;
  walk(state, mx, my, charging, dt);
  if (player.moving && !charging && !player.shieldUp) {
    player.facing = faceFor(player.facing, mx, my);
  }
  if (player.moving) {
    tryDoor(state, report);
    tryPush(state, mx, my, report, dt);
    tryLedge(state, mx, my, report, dt);
  } else {
    player.pushT = 0;
    player.ledgeT = 0;
  }

  const thing = interaction(state);
  // A tool's button went down: A before B if both did.
  const button: "a" | "b" | null = pressed.a ? "a" : pressed.b ? "b" : null;
  if (charging) {
    chargeSword(state, input, report, dt);
  } else if ((pressed.a || pressed.r) && thing !== null) {
    interact(state, thing, report);
  } else if (pressed.r && player.rollCooldown <= 0 && !player.carrying) {
    const v = DIR_VEC[player.facing];
    const dx = player.moving ? mx / Math.max(length, 1) : v.x;
    const dy = player.moving ? my / Math.max(length, 1) : v.y;
    const norm = Math.hypot(dx, dy) || 1;
    player.action = { kind: "roll", t: 0, dx: dx / norm, dy: dy / norm };
    player.shieldUp = false;
    addEffect(state, "dust", player.x, player.y);
    report.events.push("roll");
  } else if (button !== null && player.carrying) {
    interact(state, { kind: "throw" }, report);
  } else if (button !== null && armed) {
    applyTool(state, button === "a" ? inv.aItem : inv.bItem, button, report, {
      x: mx,
      y: my,
    });
  }
}

/**
 * Swimming about: the stick paddles, A or B strokes ahead, R dives under -
 * no tools in the water.
 */
function swim(
  state: GameState,
  input: Input,
  pressed: Pressed,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const length = Math.hypot(input.moveX, input.moveY);
  // A stroke without the stick pushes Link on the way he faces.
  const ahead =
    player.strokeT > 0 && length === 0 ? DIR_VEC[player.facing] : null;
  const mx = ahead?.x ?? (length > 1 ? input.moveX / length : input.moveX);
  const my = ahead?.y ?? (length > 1 ? input.moveY / length : input.moveY);
  player.shieldUp = false;
  player.charge = 0;
  player.pushT = 0;
  walk(state, mx, my, false, dt);
  if (player.moving) {
    player.facing = faceFor(player.facing, mx, my);
  }
  if (pressed.r) {
    startDive(state, report);
  } else if (pressed.a || pressed.b) {
    startStroke(state, report);
  }
}

/** Eases Link's speed towards the stick and moves him. */
function walk(
  state: GameState,
  mx: number,
  my: number,
  charging: boolean,
  dt: number,
): void {
  const player = state.player;
  let slow = state.cheat ? CHEAT_SPEED : 1;
  if (charging) {
    slow *= CHARGE_SLOW;
  } else if (player.shieldUp) {
    slow *= SHIELD_SLOW;
  } else if (player.carrying) {
    slow *= CARRY_SLOW;
  }
  if (player.small && state.area !== "mini") {
    slow *= SMALL_SLOW;
  }
  if (player.swimming) {
    slow *= SWIM_SLOW;
    if (player.diveT > 0) {
      slow *= DIVE_SLOW;
    } else if (player.strokeT > 0) {
      slow *= STROKE_BOOST;
    }
  }
  const pushing = mx !== 0 || my !== 0;
  const rate = Math.min(1, (pushing ? ACCEL : DECEL) * dt);
  player.vx += (mx * WALK_SPEED * slow - player.vx) * rate;
  player.vy += (my * WALK_SPEED * slow - player.vy) * rate;
  if (!pushing && Math.hypot(player.vx, player.vy) < STOP_SPEED) {
    player.vx = 0;
    player.vy = 0;
  }
  player.moving = pushing;
  if (player.vx !== 0 || player.vy !== 0) {
    // No sliding round a push block - Link leans into it instead.
    const stopped = moveBody(
      state,
      player,
      player.vx * dt,
      player.vy * dt,
      PLAYER_HW,
      PLAYER_HH,
      blockAhead(state) === undefined,
    );
    if (stopped && !pushing) {
      player.vx = 0;
      player.vy = 0;
    }
  }
  player.walk = pushing ? player.walk + dt : 0;
}

/** Does what A or R asks for in front of Link. */
function interact(
  state: GameState,
  thing: Interaction,
  report: StepReport,
): void {
  const player = state.player;
  switch (thing.kind) {
    case "sign":
      openDialog(state, thing.text);
      report.events.push("text");
      break;
    case "npc":
      openDialog(state, talkTo(state, thing.id));
      report.events.push("text");
      break;
    case "chest":
      openChest(state, thing.tx, thing.ty, report);
      break;
    case "ware":
      buy(state, thing.ware, report);
      break;
    case "lift":
      if (state.inv.owned.has("gloves") && !player.small) {
        state.cut.set(tileIndex(state.area, thing.tx, thing.ty), state.time);
        player.carrying = true;
        player.action = { kind: "use", t: 0, item: null };
        report.events.push("lift");
      } else {
        openDialog(state, MESSAGES.tooHeavy);
        report.events.push("error");
      }
      break;
    case "stump":
      player.shrinkT = SHRINK_TIME;
      player.vx = 0;
      player.vy = 0;
      report.events.push(player.small ? "grow" : "shrink");
      break;
    default:
      throwRock(state, report);
      player.carrying = false;
      player.action = { kind: "use", t: 0, item: null };
  }
}

/** Opens a locked door Link walks into, if he has the key for it. */
function tryDoor(state: GameState, report: StepReport): void {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  const tx = Math.floor((player.x + v.x * (PLAYER_HW + 2)) / TILE);
  const ty = Math.floor((player.y + v.y * (PLAYER_HH + 2)) / TILE);
  const letter = tileAt(state.area, tx, ty);
  const locked =
    (letter === TILE_CHARS.lockedDoor || letter === TILE_CHARS.bossDoor) &&
    !isCleared(state, tx, ty);
  if (locked) {
    const boss = letter === TILE_CHARS.bossDoor;
    const hasKey = boss
      ? state.flags.has(ITEM_FLAG.bigKey)
      : state.inv.keys > 0;
    if (hasKey) {
      if (!boss) {
        state.inv.keys -= 1;
      }
      unlock(state, tx, ty, letter);
      report.events.push("door");
    } else if (state.banner === null) {
      state.banner = {
        text: boss ? MESSAGES.needBigKey : MESSAGES.needKey,
        t: 2,
      };
      report.events.push("error");
    }
  }
}

/** Unlocks a door and every tile of it, through both walls. */
function unlock(
  state: GameState,
  tx: number,
  ty: number,
  letter: string,
): void {
  const todo = [{ tx, ty }];
  while (todo.length > 0) {
    const tile = todo.pop();
    if (tile !== undefined) {
      const flag = tileFlag("door", state.area, tile.tx, tile.ty);
      if (
        tileAt(state.area, tile.tx, tile.ty) === letter &&
        !state.flags.has(flag)
      ) {
        state.flags.add(flag);
        addEffect(
          state,
          "poof",
          tile.tx * TILE + TILE / 2,
          tile.ty * TILE + TILE / 2,
        );
        for (const v of Object.values(DIR_VEC)) {
          todo.push({ tx: tile.tx + v.x, ty: tile.ty + v.y });
        }
      }
    }
  }
}

/** Leans against a block; after a moment it slides one tile on. */
function tryPush(
  state: GameState,
  mx: number,
  my: number,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  const straight =
    (v.x !== 0 && Math.abs(my) < STRAIGHT && Math.sign(mx) === v.x) ||
    (v.y !== 0 && Math.abs(mx) < STRAIGHT && Math.sign(my) === v.y);
  const block = blockAhead(state);
  if (straight && block !== undefined && !player.carrying) {
    player.pushT += dt;
    if (player.pushT >= PUSH_TIME) {
      player.pushT = 0;
      if (shove(state, block, v.x, v.y)) {
        report.events.push("push");
      }
    }
  } else {
    player.pushT = 0;
  }
}

/**
 * Walking down against a low ledge: after a moment Link hops down to the
 * first free spot below it. Never up - from below the ledge is a wall.
 */
function tryLedge(
  state: GameState,
  mx: number,
  my: number,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor((player.y + PLAYER_HH + 2) / TILE);
  const downward =
    my > 0 && Math.abs(mx) < STRAIGHT && player.facing === "down";
  const edge =
    downward &&
    !player.carrying &&
    !player.small &&
    tileAt(state.area, tx, ty) === TILE_CHARS.ledge;
  // The landing spot: the middle of the tile under the ledge, same column.
  const toY = (ty + 1) * TILE + TILE / 2;
  const free =
    edge && !boxBlocked(state, player.x, toY, PLAYER_HW, PLAYER_HH, true);
  if (free) {
    player.ledgeT += dt;
    if (player.ledgeT >= LEDGE_WAIT) {
      player.ledgeT = 0;
      player.action = {
        kind: "leap",
        t: 0,
        fromX: player.x,
        fromY: player.y,
        toX: player.x,
        toY,
      };
      player.vx = 0;
      player.vy = 0;
      player.shieldUp = false;
      report.events.push("hop");
    }
  } else {
    player.ledgeT = 0;
  }
}

/** Carries a hop down a ledge on and lands it with a puff of dust. */
function stepLeap(state: GameState, report: StepReport, dt: number): void {
  const player = state.player;
  const action = player.action;
  if (action.kind === "leap") {
    action.t += dt;
    const k = Math.min(1, action.t / LEAP_TIME);
    player.x = action.fromX + (action.toX - action.fromX) * k;
    player.y = action.fromY + (action.toY - action.fromY) * k;
    player.walk += dt;
    if (k >= 1) {
      player.action = { kind: "idle" };
      addEffect(state, "dust", player.x - PLAYER_HW, player.y);
      addEffect(state, "dust", player.x + PLAYER_HW, player.y);
      report.events.push("land");
    }
  }
}

/** The push block right in front of Link, if any. */
function blockAhead(state: GameState): Block | undefined {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  return state.blocks.find(
    (one) =>
      one.target === null &&
      overlaps(
        player.x + v.x * 2,
        player.y + v.y * 2,
        PLAYER_HW,
        PLAYER_HH,
        one.x + TILE / 2,
        one.y + TILE / 2,
        TILE / 2,
        TILE / 2,
      ),
  );
}

/** Starts a block sliding one tile, if the tile beyond is free floor. */
function shove(
  state: GameState,
  block: Block,
  dx: number,
  dy: number,
): boolean {
  const tx = block.x / TILE + dx;
  const ty = block.y / TILE + dy;
  const letter = tileAt(state.area, tx, ty);
  // A block resting on its plate stays there for good.
  const settled =
    tileAt(state.area, block.x / TILE, block.y / TILE) === TILE_CHARS.plate;
  const free =
    !settled &&
    (letter === "." ||
      letter === TILE_CHARS.plate ||
      letter === TILE_CHARS.block) &&
    roomAt(state.area, tx * TILE, ty * TILE) === block.room &&
    !state.blocks.some(
      (other) => other.x === tx * TILE && other.y === ty * TILE,
    );
  if (free) {
    block.target = { x: tx * TILE, y: ty * TILE };
  }
  return free;
}

/** Walking onto a door, hole or stair starts the fade to where it leads. */
function checkWarp(state: GameState, report: StepReport): void {
  const player = state.player;
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  if (isWarpTile(tileAt(state.area, tx, ty)) && state.transition === null) {
    const to = warpAt(state.area, tx, ty);
    if (to !== null) {
      state.transition = { kind: "fade", t: 0, to, swapped: false };
      report.events.push("stairs");
    }
  }
}

/** Holds the sword out; a full charge released becomes the spin. */
function chargeSword(
  state: GameState,
  input: Input,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  if (isHeld(state, input, "sword")) {
    const before = player.charge;
    player.charge += dt;
    if (before < CHARGE_TIME && player.charge >= CHARGE_TIME) {
      report.events.push("charged");
    }
  } else {
    if (player.charge >= CHARGE_TIME) {
      player.action = { kind: "spin", t: 0, hit: new Set() };
      report.events.push("spin");
    }
    player.charge = 0;
  }
}

/**
 * Uses the tool or bottle on the button that went down.
 *
 * @param state - the game
 * @param tool - what sits on that button
 * @param button - which button
 * @param report - where to note what happened
 * @param stick - the stick's direction, for the boomerang and the hop
 */
function applyTool(
  state: GameState,
  tool: EquipId,
  button: "a" | "b",
  report: StepReport,
  stick: { readonly x: number; readonly y: number },
): void {
  const player = state.player;
  // True when the tool was used and Link should strike its pose.
  let pose = false;
  if (isBottle(tool)) {
    pose = drink(state, tool, report);
  } else {
    switch (tool) {
      case "sword":
        player.action = { kind: "slash", t: 0, hit: new Set() };
        report.events.push("swing");
        break;
      case "bow":
        pose = fireArrow(state, report);
        break;
      case "bombs":
        pose = placeBomb(state, report);
        break;
      case "boomerang":
        pose = throwBoomerang(state, report, stick.x, stick.y);
        break;
      case "lantern":
        pose = shineLantern(state, report);
        break;
      case "fireRod":
        pose = shootFlame(state, report);
        break;
      case "shovel":
        pose = dig(state, report);
        break;
      case "hookshot":
        fireHook(state, report);
        break;
      case "feather":
        startHop(state, stick.x, stick.y, report);
        break;
      case "boots":
        startDash(state, button);
        break;
      default:
        // The shield is held, not pressed - handled with the walking; the
        // gloves work by themselves.
        pose = false;
    }
  }
  if (pose) {
    player.action = { kind: "use", t: 0, item: tool };
  }
}

/**
 * Which way to face for a stick direction.
 *
 * @remarks
 * Walking diagonally keeps the current facing if it is one of the two
 * directions being walked in - otherwise Link would flicker between two
 * facings on every diagonal, and his sword would swing the wrong way.
 */
function faceFor(current: Dir, mx: number, my: number): Dir {
  const v = DIR_VEC[current];
  const keeps =
    (v.x !== 0 && Math.sign(v.x) === Math.sign(mx) && mx !== 0) ||
    (v.y !== 0 && Math.sign(v.y) === Math.sign(my) && my !== 0);
  return keeps ? current : dirOf(mx, my, current);
}
