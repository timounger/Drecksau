/**
 * Murdoku online: one case, one map, everybody at the table writing on it.
 *
 * @module
 * @remarks
 * **Together, not in turns.** Nobody waits for anybody: every player marks,
 * crosses out and places on the same map at any moment, and everybody sees
 * it. The online layer hands the host every move in the order it arrived
 * and the host applies them one after another, so two moves never collide -
 * but two moves can still undo each other. That is why every move states the
 * result it wants ("this mark on", "this cross off") rather than toggling:
 * two players tapping the same field at once both get the field they meant.
 *
 * Nothing is hidden - everybody sees the whole map - so there are no hands
 * and nothing to redact. There are no turns, no computer players and no
 * timer; the case ends when somebody names the culprit correctly.
 */
import {
  crossSet,
  markSet,
  settled,
  stepped,
} from "@/games/murdoku/engine/actions";
import {
  EMPTY_BOARD,
  removed,
  wiped,
  type Board,
} from "@/games/murdoku/engine/board";
import { LEVELS } from "@/games/murdoku/engine/levels";
import { checked, culpritOf, solutionOf } from "@/games/murdoku/engine/rules";
import type { Cell, Level } from "@/games/murdoku/engine/types";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** The game's id - the prefix of its rooms. */
export const MURDOKU_GAME_ID = "murdoku";

/** How few may solve a case together, and how many. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/** How a case solved together ended, or was guessed at. */
export type OnlineOutcome = {
  readonly kind: "right";
  /** Who was named. */
  readonly who: string;
  /** The seat that named them. */
  readonly by: number;
  /** How long it took, for a right answer. */
  readonly ms: number;
};

/** A check of the map, as somebody asked for it with "Bestätigen". */
export type OnlineCheck = {
  /** Per suspect whether they stand right. */
  readonly results: Readonly<Record<string, boolean>>;
  /** The seat that asked. */
  readonly by: number;
  /** New with every check, so it is shown again even with the same answer. */
  readonly nonce: number;
};

/** One case being solved together. */
export type MurdokuOnlineGame = {
  readonly levelId: string;
  /** The notes everybody writes on. */
  readonly board: Board;
  /** How many steps of the way to the solution are showing. */
  readonly shown: number;
  /** Whether the solution lies on the map right now. */
  readonly peeking: boolean;
  /** Whether it has been looked at - then the case is no longer won fairly. */
  readonly peeked: boolean;
  readonly outcome: OnlineOutcome | null;
  /** The last check of the map, until it changes - or null. */
  readonly check: OnlineCheck | null;
  /** When the case began, as the host's clock had it. */
  readonly startedAt: number;
  /** Who is at the table, by seat. */
  readonly names: readonly string[];
};

/** What one player can do. */
export type MurdokuMove =
  | {
      readonly kind: "mark";
      readonly id: string;
      readonly cell: Cell;
      readonly on: boolean;
    }
  | { readonly kind: "cross"; readonly cell: Cell; readonly on: boolean }
  | { readonly kind: "place"; readonly id: string; readonly cell: Cell }
  | { readonly kind: "remove"; readonly id: string }
  | { readonly kind: "wipe"; readonly cell: Cell }
  | { readonly kind: "restart" }
  | { readonly kind: "hint" }
  | { readonly kind: "hideHints" }
  | { readonly kind: "allHints" }
  | { readonly kind: "step"; readonly index: number }
  | { readonly kind: "peek"; readonly on: boolean }
  | { readonly kind: "confirm"; readonly at: number };

/** What the host chooses before the start: the case, and the clock. */
export type MurdokuOptions = {
  readonly levelId: string;
  readonly startedAt: number;
};

/** Nobody holds anything secret. */
export type MurdokuHand = object;

/**
 * The case a game is about.
 *
 * @param game - the game
 * @returns its case
 */
export function levelOf(game: MurdokuOnlineGame): Level {
  return LEVELS.find((one) => one.id === game.levelId) ?? FIRST_LEVEL;
}

/** The case a game falls back to - there is always at least one. */
const FIRST_LEVEL: Level = LEVELS[0] as Level;

/** Murdoku, for the online layer. */
export const murdokuAdapter: OnlineAdapter<
  MurdokuOnlineGame,
  MurdokuMove,
  MurdokuHand,
  MurdokuOptions
> = {
  gameId: MURDOKU_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options): MurdokuOnlineGame {
    return {
      levelId: LEVELS.some((one) => one.id === options.levelId)
        ? options.levelId
        : FIRST_LEVEL.id,
      board: EMPTY_BOARD,
      shown: 0,
      peeking: false,
      peeked: false,
      outcome: null,
      check: null,
      startedAt: options.startedAt,
      names: seats.map((seat) => seat.name),
    };
  },

  seatIndexOnTurn(): number | null {
    // Nobody's turn - everybody's.
    return null;
  },

  applyMove(game, seatIndex, move): MurdokuOnlineGame | null {
    return game.outcome?.kind === "right"
      ? null
      : played(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.outcome?.kind === "right";
  },

  aiMove(): MurdokuMove | null {
    return null;
  },

  redact(game): MurdokuOnlineGame {
    return game;
  },

  privateHands(): readonly MurdokuHand[] {
    return [];
  },

  withOwnHand(game): MurdokuOnlineGame {
    return game;
  },

  withAllHands(game): MurdokuOnlineGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    return null;
  },

  isGameState(value): value is MurdokuOnlineGame {
    return isOnlineGame(value);
  },

  isHand(value): value is MurdokuHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is MurdokuMove {
    return isMurdokuMove(value);
  },
};

/** One move applied - the game after it. */
function played(
  game: MurdokuOnlineGame,
  seat: number,
  move: MurdokuMove,
): MurdokuOnlineGame {
  const level = levelOf(game);
  // While the solution is on the map, the notes underneath stay as they are.
  const write = (board: Board): MurdokuOnlineGame =>
    game.peeking ? game : { ...game, board, outcome: null, check: null };
  let next: MurdokuOnlineGame;
  switch (move.kind) {
    case "mark":
      next = write(markSet(level, game.board, move.id, move.cell, move.on));
      break;
    case "cross":
      next = write(crossSet(level, game.board, move.cell, move.on));
      break;
    case "place":
      next = write(settled(level, game.board, move.id, move.cell));
      break;
    case "remove":
      next = write(removed(game.board, move.id));
      break;
    case "wipe":
      next = write(wiped(game.board, move.cell));
      break;
    case "restart":
      next = write(EMPTY_BOARD);
      break;
    case "hint":
      next = { ...game, shown: Math.min(game.shown + 1, level.hints.length) };
      break;
    case "allHints": {
      const done = write(
        level.hints.reduce(
          (notes, step) => stepped(level, notes, step),
          game.board,
        ),
      );
      next = { ...done, shown: level.hints.length };
      break;
    }
    case "hideHints":
      next = { ...game, shown: 0 };
      break;
    case "step": {
      const step = level.hints[move.index];
      next =
        step === undefined ? game : write(stepped(level, game.board, step));
      break;
    }
    case "peek":
      next = {
        ...game,
        peeking: move.on,
        peeked: game.peeked || move.on,
        outcome: null,
      };
      break;
    default:
      next = confirmed(game, level, seat, move.at);
  }
  return next;
}

/**
 * Somebody presses "Bestätigen": the map is checked against the solution.
 *
 * @remarks
 * Only with everybody placed - the button is only there then, and a move
 * from an older screen is ignored. When all stand right the case is solved,
 * and the culprit follows from the map; nobody has to name him.
 */
function confirmed(
  game: MurdokuOnlineGame,
  level: Level,
  seat: number,
  at: number,
): MurdokuOnlineGame {
  const results = checked(level, game.board.placement);
  const solution = solutionOf(level);
  const complete = level.suspects.every(
    (one) => game.board.placement[one.id] !== undefined,
  );
  let next = game;
  if (results !== null && solution !== null && complete && !game.peeking) {
    const right = Object.values(results).every(Boolean);
    next = {
      ...game,
      check: { results, by: seat, nonce: at },
      outcome: right
        ? {
            kind: "right",
            who: culpritOf(level, solution) ?? "",
            by: seat,
            ms: Math.max(0, at - game.startedAt),
          }
        : null,
    };
  }
  return next;
}

/** Whether a value read off the wire is a field. */
function isCell(value: unknown): value is Cell {
  const cell = value as Cell;
  return (
    typeof value === "object" &&
    value !== null &&
    Number.isInteger(cell.row) &&
    Number.isInteger(cell.col)
  );
}

/** Whether a value read off the wire is the notes on a map. */
function isBoard(value: unknown): value is Board {
  const board = value as Board;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof board.placement === "object" &&
    board.placement !== null &&
    Object.values(board.placement).every(isCell) &&
    typeof board.notes === "object" &&
    board.notes !== null &&
    Object.values(board.notes).every(
      (marks) =>
        Array.isArray(marks) && marks.every((id) => typeof id === "string"),
    ) &&
    Array.isArray(board.crosses) &&
    board.crosses.every((key) => typeof key === "string")
  );
}

/** Whether a value read off the wire is a game of Murdoku. */
function isOnlineGame(value: unknown): value is MurdokuOnlineGame {
  const game = value as MurdokuOnlineGame;
  const outcome = game?.outcome;
  const check = game?.check;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof game.levelId === "string" &&
    isBoard(game.board) &&
    Number.isInteger(game.shown) &&
    typeof game.peeking === "boolean" &&
    typeof game.peeked === "boolean" &&
    Number.isFinite(game.startedAt) &&
    (check === null ||
      (typeof check === "object" &&
        Number.isInteger(check.by) &&
        Number.isFinite(check.nonce) &&
        typeof check.results === "object" &&
        check.results !== null &&
        Object.values(check.results).every(
          (one) => typeof one === "boolean",
        ))) &&
    Array.isArray(game.names) &&
    game.names.every((name) => typeof name === "string") &&
    (outcome === null ||
      (typeof outcome === "object" &&
        outcome.kind === "right" &&
        typeof outcome.who === "string" &&
        Number.isInteger(outcome.by) &&
        Number.isFinite(outcome.ms)))
  );
}

/** Whether a value read off the wire is a move. */
function isMurdokuMove(value: unknown): value is MurdokuMove {
  const move = value as Record<string, unknown>;
  let valid = false;
  if (typeof value === "object" && value !== null) {
    switch (move.kind) {
      case "mark":
        valid =
          typeof move.id === "string" &&
          isCell(move.cell) &&
          typeof move.on === "boolean";
        break;
      case "cross":
      case "peek":
        valid =
          (move.kind === "peek" || isCell(move.cell)) &&
          typeof move.on === "boolean";
        break;
      case "place":
        valid = typeof move.id === "string" && isCell(move.cell);
        break;
      case "remove":
        valid = typeof move.id === "string";
        break;
      case "wipe":
        valid = isCell(move.cell);
        break;
      case "restart":
      case "hint":
      case "allHints":
      case "hideHints":
        valid = true;
        break;
      case "step":
        valid = Number.isInteger(move.index);
        break;
      case "confirm":
        valid = Number.isFinite(move.at);
        break;
      default:
        valid = false;
    }
  }
  return valid;
}
