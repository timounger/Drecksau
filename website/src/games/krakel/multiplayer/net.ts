/**
 * The wire model for online Krakel Orakel: the snapshot the host streams, the
 * moves a guest sends, the drawer's private term, and the transport guards.
 *
 * @module
 * @remarks
 * Krakel Orakel is real-time (a shared drawing), so it does not use the
 * turn-based online core. The host runs the authoritative {@link KrakelGame} and
 * publishes a {@link NetSnapshot} many times a second; every client renders the
 * newest snapshot and streams its own {@link KrakelMove} back (drawing strokes
 * from the drawer, guesses from the others).
 *
 * The secret is the term. It never rides in the public snapshot while the round
 * is live - it is written only to the drawer's private hand ({@link KrakelHand}),
 * which the transport's rules keep readable to that seat alone. Once the round
 * reveals, the answer is public in {@link NetSnapshot.revealTerm}.
 */
import { drawerId, type KrakelGame } from "@/games/krakel/engine/game";
import type { KrakelPhase, Stroke } from "@/games/krakel/engine/types";
import { isChatPayload } from "@/online/online-state";
import type { RoomState, Seat, SeatId } from "@/online/adapter";
import type { MoveIntent, WireGuards } from "@/online/transport";

/** Namespaces Krakel Orakel's rooms in the shared database. */
export const KRAKEL_GAME_ID = "krakel";

/** One player's public score line. */
export type ScoreLine = {
  readonly seatId: SeatId;
  readonly score: number;
};

/** The drawer's private data: the term to picture. */
export type KrakelHand = {
  readonly term: string;
};

/** A client's move to the host: a drawing action or a guess. */
export type KrakelMove =
  | { readonly kind: "live"; readonly stroke: Stroke }
  | { readonly kind: "stroke"; readonly stroke: Stroke }
  | { readonly kind: "clear" }
  | { readonly kind: "undo" }
  | { readonly kind: "guess"; readonly text: string };

/**
 * The public state of the game at one instant, small enough to stream.
 *
 * @remarks
 * Everything a client needs to draw the board - except the secret term, which is
 * omitted while the round is live and only appears in {@link revealTerm} once the
 * round is over.
 */
export type NetSnapshot = {
  readonly phase: KrakelPhase;
  readonly round: number;
  readonly totalRounds: number;
  readonly drawerId: SeatId;
  readonly krakelSeed: number;
  readonly strokes: readonly Stroke[];
  readonly live: Stroke | null;
  /** Milliseconds since the epoch at which the current phase ends. */
  readonly deadline: number;
  readonly scores: readonly ScoreLine[];
  readonly guessed: readonly SeatId[];
  /** How many letters the term has, for the masked hint. */
  readonly termLength: number;
  /** The answer, shown to everyone only once the round reveals; else null. */
  readonly revealTerm: string | null;
  /** Bumped on every correct guess, so the board can flash an announcement. */
  readonly announce: number;
};

/**
 * Reduces the authoritative game to a public wire snapshot.
 *
 * @param game - the host's authoritative game
 * @returns the snapshot to publish, with the term hidden while the round runs
 */
export function toSnapshot(game: KrakelGame): NetSnapshot {
  return {
    phase: game.phase,
    round: game.round,
    totalRounds: game.totalRounds,
    drawerId: drawerId(game),
    krakelSeed: game.krakelSeed,
    strokes: game.strokes,
    live: game.live,
    deadline: game.deadline,
    scores: game.order.map((seatId) => ({
      seatId,
      score: game.scores[seatId] ?? 0,
    })),
    guessed: game.guessed,
    termLength: game.term.length,
    revealTerm: game.phase === "drawing" ? null : game.term,
    announce: game.announce,
  };
}

/** Builds a seat record for a player. */
export function makeSeat(id: string, name: string, isHost: boolean): Seat {
  return { id, name, isHost };
}

/** The guards the Firebase transport uses to filter Krakel Orakel wire data. */
export const KRAKEL_GUARDS: WireGuards<NetSnapshot, KrakelMove, KrakelHand> = {
  isRoomState: isNetRoomState,
  isMoveIntent: isNetIntent,
  isHand: isKrakelHand,
  isChatPayload,
};

/** Whether a value looks like a stroke (shallow - our own code writes it). */
function isStroke(value: unknown): value is Stroke {
  const stroke = value as Stroke;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof stroke.color === "string" &&
    typeof stroke.width === "number" &&
    Array.isArray(stroke.points)
  );
}

/** Whether a value is a well-formed snapshot (loose: our own code writes it). */
function isNetSnapshot(value: unknown): value is NetSnapshot {
  const snap = value as NetSnapshot;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof snap.phase === "string" &&
    typeof snap.round === "number" &&
    typeof snap.totalRounds === "number" &&
    typeof snap.drawerId === "string" &&
    typeof snap.krakelSeed === "number" &&
    Array.isArray(snap.strokes) &&
    (snap.live === null || isStroke(snap.live)) &&
    typeof snap.deadline === "number" &&
    Array.isArray(snap.scores) &&
    Array.isArray(snap.guessed) &&
    typeof snap.termLength === "number" &&
    (snap.revealTerm === null || typeof snap.revealTerm === "string") &&
    typeof snap.announce === "number"
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

/** Whether a value is a well-formed move from a client. */
function isKrakelMove(value: unknown): value is KrakelMove {
  const move = value as KrakelMove;
  let ok: boolean;
  if (typeof value !== "object" || value === null) {
    ok = false;
  } else if (move.kind === "live" || move.kind === "stroke") {
    ok = isStroke(move.stroke);
  } else if (move.kind === "guess") {
    ok = typeof move.text === "string";
  } else {
    ok = move.kind === "clear" || move.kind === "undo";
  }
  return ok;
}

/** Whether a value is a move intent from a client. */
function isNetIntent(value: unknown): value is MoveIntent<KrakelMove> {
  const intent = value as MoveIntent<KrakelMove>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof intent.seatId === "string" &&
    isKrakelMove(intent.move)
  );
}

/** Whether a value is the drawer's private hand (the term). */
function isKrakelHand(value: unknown): value is KrakelHand {
  const hand = value as KrakelHand;
  return (
    typeof value === "object" && value !== null && typeof hand.term === "string"
  );
}
