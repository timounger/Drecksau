/**
 * The wire model for Panzerkiste online co-op: a lean snapshot the host streams
 * and the guest renders, plus the untrusted-value guards for the transport.
 *
 * @module
 * @remarks
 * Panzerkiste is real-time, so it does not use the turn-based online core. The
 * host runs the authoritative simulation and publishes a {@link NetSnapshot}
 * many times a second; the guest is a thin client that renders the newest
 * snapshot and streams its own {@link PanzerMove} (its raw input) back.
 *
 * The snapshot carries only the moving parts. The static level grid is not
 * sent - the guest rebuilds it from the level index with
 * {@link loadLevel} and then applies the handful of wall cells a mine has
 * cleared ({@link NetSnapshot.cleared}), so a full walls array never crosses
 * the wire.
 */
import { createRandom } from "@/games/panzerkiste/engine/random";
import { loadLevel } from "@/games/panzerkiste/engine/setup";
import type {
  Bullet,
  Explosion,
  GameState,
  Input,
  Mine,
  Phase,
  Tank,
  Vec,
} from "@/games/panzerkiste/engine/types";
import { isChatPayload } from "@/online/online-state";
import type { RoomState, Seat } from "@/online/adapter";
import type { MoveIntent, WireGuards } from "@/online/transport";

/** Namespaces Panzerkiste's rooms in the shared database. */
export const PANZERKISTE_GAME_ID = "panzerkiste";

/** A fixed seed to rebuild a level's static grid on the guest (unused stream). */
const GUEST_GRID_SEED = 1;

/** A guest's raw input for its own tank, sent to the host each tick. */
export type PanzerMove = Input;

/**
 * The moving parts of the simulation at one instant, small enough to stream.
 *
 * @remarks
 * Everything static (walls, holes, the random stream, trails) is left out: the
 * guest rebuilds the grid from {@link NetSnapshot.level} and applies
 * {@link NetSnapshot.cleared}. Positions come straight from the host's
 * authoritative state.
 */
export type NetSnapshot = {
  readonly level: number;
  readonly phase: Phase;
  readonly lives: number;
  readonly time: number;
  readonly nextId: number;
  /** Indices of wall cells a blast has cleared on this level, over its base. */
  readonly cleared: readonly number[];
  readonly tanks: readonly Tank[];
  readonly bullets: readonly Bullet[];
  readonly mines: readonly Mine[];
  readonly explosions: readonly Explosion[];
  readonly marks: readonly Vec[];
};

/**
 * Reduces an authoritative game state to a wire snapshot.
 *
 * @param state - the host's authoritative state
 * @returns the lean snapshot to publish
 */
export function toSnapshot(state: GameState): NetSnapshot {
  const base = loadLevel(
    state.level,
    state.lives,
    createRandom(GUEST_GRID_SEED),
  );
  const cleared: number[] = [];
  for (let index = 0; index < state.walls.length; index++) {
    // A base wall that is now floor was blasted away by a mine this level.
    if (base.walls[index] && !state.walls[index]) {
      cleared.push(index);
    }
  }
  return {
    level: state.level,
    phase: state.phase,
    lives: state.lives,
    time: state.time,
    nextId: state.nextId,
    cleared,
    tanks: state.tanks,
    bullets: state.bullets,
    mines: state.mines,
    explosions: state.explosions,
    marks: state.marks,
  };
}

/**
 * Rebuilds a renderable game state from a wire snapshot.
 *
 * @param snap - the snapshot received from the host
 * @returns a state the renderer can draw (trails are not carried over the wire)
 */
export function fromSnapshot(snap: NetSnapshot): GameState {
  const base = loadLevel(snap.level, snap.lives, createRandom(GUEST_GRID_SEED));
  const walls = [...base.walls];
  const breakable = [...base.breakable];
  for (const index of snap.cleared) {
    walls[index] = false;
    breakable[index] = false;
  }
  return {
    ...base,
    walls,
    breakable,
    tanks: snap.tanks,
    bullets: snap.bullets,
    mines: snap.mines,
    explosions: snap.explosions,
    marks: snap.marks,
    trails: [],
    level: snap.level,
    lives: snap.lives,
    phase: snap.phase,
    time: snap.time,
    nextId: snap.nextId,
  };
}

/** The guards the Firebase transport uses to filter Panzerkiste wire data. */
export const PANZERKISTE_GUARDS: WireGuards<NetSnapshot, PanzerMove, null> = {
  isRoomState: isNetRoomState,
  isMoveIntent: isNetIntent,
  isHand: isNoHand,
  isChatPayload,
};

/** Whether a value is a two-number vector. */
function isVec(value: unknown): value is Vec {
  const vec = value as Vec;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof vec.x === "number" &&
    typeof vec.y === "number"
  );
}

/** Whether a value is a well-formed snapshot (loose: our own code writes it). */
function isNetSnapshot(value: unknown): value is NetSnapshot {
  const snap = value as NetSnapshot;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof snap.level === "number" &&
    typeof snap.phase === "string" &&
    typeof snap.lives === "number" &&
    typeof snap.time === "number" &&
    typeof snap.nextId === "number" &&
    Array.isArray(snap.cleared) &&
    Array.isArray(snap.tanks) &&
    Array.isArray(snap.bullets) &&
    Array.isArray(snap.mines) &&
    Array.isArray(snap.explosions) &&
    Array.isArray(snap.marks)
  );
}

/** Whether a value is a room state wrapping a snapshot (or an empty lobby). */
function isNetRoomState(value: unknown): value is RoomState<NetSnapshot> {
  const room = value as RoomState<NetSnapshot>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof room.code === "string" &&
    typeof room.hostId === "string" &&
    Array.isArray(room.seats) &&
    typeof room.phase === "string" &&
    typeof room.version === "number" &&
    (room.game === null || isNetSnapshot(room.game))
  );
}

/** Whether a value is a move (raw input) a guest sent. */
function isPanzerMove(value: unknown): value is PanzerMove {
  const move = value as PanzerMove;
  return (
    typeof value === "object" &&
    value !== null &&
    isVec(move.move) &&
    isVec(move.aim) &&
    typeof move.fire === "boolean" &&
    typeof move.layMine === "boolean"
  );
}

/** Whether a value is a move intent from a guest. */
function isNetIntent(value: unknown): value is MoveIntent<PanzerMove> {
  const intent = value as MoveIntent<PanzerMove>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof intent.seatId === "string" &&
    isPanzerMove(intent.move)
  );
}

/** Panzerkiste has no private per-seat data, so a hand is always null. */
function isNoHand(value: unknown): value is null {
  return value === null;
}

/** Builds a seat record for a player. */
export function makeSeat(id: string, name: string, isHost: boolean): Seat {
  return { id, name, isHost };
}
