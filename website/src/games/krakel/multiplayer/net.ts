/**
 * The wire model for online Krakel Orakel: the snapshot the host streams, the
 * moves a guest sends, each player's private term, and the transport guards.
 *
 * @module
 * @remarks
 * Krakel Orakel is real-time (everyone draws at once), so it does not use the
 * turn-based online core. The host runs the authoritative {@link KrakelGame} and
 * publishes a {@link NetSnapshot} many times a second; every client renders the
 * newest snapshot and streams its own {@link KrakelMove} back.
 *
 * Two things are secret, and each is hidden for as long as the rules need:
 *
 * - A player's term rides only in their own private hand ({@link KrakelHand}),
 *   which the transport's rules keep readable to that seat alone. From the
 *   reveal on it is public in {@link BoardLine.term}.
 * - The other players' drawings. While the round is being drawn every board goes
 *   out empty, so nobody can peek at a neighbour's board; the strokes only join
 *   the snapshot once the boards are laid open for the elimination phase.
 */
import {
  currentPickerId,
  type KrakelGame,
  type PlayerId,
} from "@/games/krakel/engine/game";
import type { KrakelPhase, Stroke } from "@/games/krakel/engine/types";
import { isChatPayload } from "@/online/online-state";
import type { RoomState, Seat, SeatId } from "@/online/adapter";
import type { MoveIntent, WireGuards } from "@/online/transport";

/** Namespaces Krakel Orakel's rooms in the shared database. */
export const KRAKEL_GAME_ID = "krakel";

/** One player's board as everybody else sees it. */
export type BoardLine = {
  readonly seatId: SeatId;
  /** Which printed board this player had to draw on. */
  readonly boardId: number;
  /** The finished strokes - empty for other players while the round is drawn. */
  readonly strokes: readonly Stroke[];
  /** Whether this player has declared their drawing finished. */
  readonly ready: boolean;
  /** The term this board pictured - only from the reveal on, else null. */
  readonly term: string | null;
};

/** One word struck off the list, as everybody sees it. */
export type ExclusionLine = {
  readonly word: string;
  /** Who struck it. */
  readonly seatId: SeatId;
  /** True if nobody had drawn it - the team scored. */
  readonly wasDecoy: boolean;
};

/** A player's private data: the term only they may see. */
export type KrakelHand = {
  readonly term: string;
};

/** A client's move to the host: a drawing action or a word to strike. */
export type KrakelMove =
  | { readonly kind: "stroke"; readonly stroke: Stroke }
  | { readonly kind: "clear" }
  | { readonly kind: "undo" }
  | { readonly kind: "ready" }
  | { readonly kind: "exclude"; readonly word: string };

/**
 * The public state of the game at one instant, small enough to stream.
 *
 * @remarks
 * Everything a client needs to draw the screen - minus whatever the rules still
 * keep hidden; see the module remarks.
 */
export type NetSnapshot = {
  readonly phase: KrakelPhase;
  readonly round: number;
  readonly totalRounds: number;
  /** Every player's board, in the order they strike words. */
  readonly boards: readonly BoardLine[];
  /** Milliseconds since the epoch at which the current phase ends. */
  readonly deadline: number;
  /** The round's word list: every real term plus the decoys, shuffled. */
  readonly candidates: readonly string[];
  /** The words struck so far, in the order they went. */
  readonly excluded: readonly ExclusionLine[];
  /** Whose turn it is to strike a word, or null outside that phase. */
  readonly pickerId: SeatId | null;
  /** The team's running score over the whole game. */
  readonly score: number;
  /** What the team scored in the current round. */
  readonly roundScore: number;
  /** Bumped on every exclusion, so the board can flash an announcement. */
  readonly announce: number;
};

/**
 * Reduces the authoritative game to a public wire snapshot.
 *
 * @param game - the host's authoritative game
 * @returns the snapshot to publish, with the terms and the still-secret
 * drawings held back
 */
export function toSnapshot(game: KrakelGame): NetSnapshot {
  const drawing = game.phase === "drawing";
  const revealed = game.phase === "reveal" || game.phase === "over";
  return {
    phase: game.phase,
    round: game.round,
    totalRounds: game.totalRounds,
    boards: game.order.map((seatId) => ({
      seatId,
      boardId: game.boardIds[seatId] ?? 0,
      // While the round runs a board is nobody else's business; each client
      // renders its own drawing from its own local copy.
      strokes: drawing ? [] : (game.boards[seatId] ?? []),
      ready: game.ready.includes(seatId),
      term: revealed ? (game.terms[seatId] ?? null) : null,
    })),
    deadline: game.deadline,
    candidates: drawing ? [] : game.candidates,
    excluded: game.excluded.map((entry) => ({
      word: entry.word,
      seatId: entry.by,
      wasDecoy: entry.wasDecoy,
    })),
    pickerId: game.phase === "eliminating" ? currentPickerId(game) : null,
    score: game.score,
    roundScore: game.roundScore,
    announce: game.announce,
  };
}

/**
 * Every player's private hand for a round: their own term.
 *
 * @param game - the host's authoritative game
 * @returns the hand to deliver to each seat
 */
export function toHands(game: KrakelGame): Map<PlayerId, KrakelHand> {
  const hands = new Map<PlayerId, KrakelHand>();
  for (const id of game.order) {
    const term = game.terms[id];
    if (term !== undefined) {
      hands.set(id, { term });
    }
  }
  return hands;
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

/** Whether a value is a board line (loose: our own code writes it). */
function isBoardLine(value: unknown): value is BoardLine {
  const board = value as BoardLine;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof board.seatId === "string" &&
    typeof board.boardId === "number" &&
    Array.isArray(board.strokes) &&
    typeof board.ready === "boolean" &&
    (board.term === null || typeof board.term === "string")
  );
}

/** Whether a value is a struck-word line. */
function isExclusionLine(value: unknown): value is ExclusionLine {
  const entry = value as ExclusionLine;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof entry.word === "string" &&
    typeof entry.seatId === "string" &&
    typeof entry.wasDecoy === "boolean"
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
    Array.isArray(snap.boards) &&
    snap.boards.every(isBoardLine) &&
    typeof snap.deadline === "number" &&
    Array.isArray(snap.candidates) &&
    Array.isArray(snap.excluded) &&
    snap.excluded.every(isExclusionLine) &&
    (snap.pickerId === null || typeof snap.pickerId === "string") &&
    typeof snap.score === "number" &&
    typeof snap.roundScore === "number" &&
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
  } else if (move.kind === "stroke") {
    ok = isStroke(move.stroke);
  } else if (move.kind === "exclude") {
    ok = typeof move.word === "string";
  } else {
    ok = move.kind === "clear" || move.kind === "undo" || move.kind === "ready";
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

/** Whether a value is a player's private hand (their term). */
function isKrakelHand(value: unknown): value is KrakelHand {
  const hand = value as KrakelHand;
  return (
    typeof value === "object" && value !== null && typeof hand.term === "string"
  );
}
