/**
 * Murdle online: one case, one deduction grid, everybody at the table
 * writing on it.
 *
 * @module
 * @remarks
 * **Together, not in turns.** Every player marks the same grid at any moment,
 * and everybody sees it. The online layer hands the host every move in the
 * order it arrived and the host applies them one after another - but two
 * moves can still undo each other. That is why every move states the result
 * it wants ("this square a tick") rather than toggling: two players tapping
 * the same square at once both get the square they meant.
 *
 * The accusation form is shared too: what one player chooses, everybody sees,
 * and anybody can press "Anklagen". Nothing is hidden, so there are no hands
 * and nothing to redact; there are no turns and no computer players.
 */
import { CASES } from "@/games/murdle/engine/cases";
import {
  markSet,
  solvedMarks,
  stepped,
  type Mark,
  type Marks,
} from "@/games/murdle/engine/grid";
import { NO_DRAFT, isRight, solvedDraft } from "@/games/murdle/engine/solver";
import type { Case, Category, Draft } from "@/games/murdle/engine/types";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** The game's id - the prefix of its rooms. */
export const MURDLE_GAME_ID = "murdle";

/** How few may solve a case together, and how many. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/** The answer to the last accusation, and who made it. */
export type OnlineVerdict = {
  readonly right: boolean;
  /** The seat that accused. */
  readonly by: number;
  /** New with every accusation, so it is shown again with the same answer. */
  readonly nonce: number;
};

/** One case being solved together. */
export type MurdleOnlineGame = {
  readonly caseId: string;
  /** The grid everybody writes on. */
  readonly marks: Marks;
  /** The accusation form everybody fills in. */
  readonly draft: Draft;
  /** How many steps of help are showing. */
  readonly shown: number;
  /** Whether the solution is shown right now. */
  readonly peeking: boolean;
  /** Whether it has been looked at. */
  readonly peeked: boolean;
  /** How many accusations were wrong. */
  readonly wrong: number;
  readonly verdict: OnlineVerdict | null;
  /** How long the solve took, once a right accusation was made - else null. */
  readonly solvedMs: number | null;
  /** When the case was opened, as the host's clock had it. */
  readonly startedAt: number;
  /** Who is at the table, by seat. */
  readonly names: readonly string[];
};

/** What one player can do. */
export type MurdleMove =
  | {
      readonly kind: "mark";
      readonly rows: Category;
      readonly cols: Category;
      readonly row: string;
      readonly col: string;
      /** What the square should hold, or null for empty. */
      readonly mark: Mark | null;
      /** The player's own setting: whether a tick crosses out its lines. */
      readonly autoCross: boolean;
    }
  | { readonly kind: "restart" }
  | { readonly kind: "hint" }
  | { readonly kind: "hideHints" }
  | { readonly kind: "allHints" }
  | {
      readonly kind: "step";
      readonly index: number;
      /** The player's own setting: whether a tick crosses out its lines. */
      readonly autoCross: boolean;
    }
  | { readonly kind: "peek"; readonly on: boolean }
  | {
      readonly kind: "draft";
      readonly field: keyof Draft;
      readonly value: string;
    }
  | { readonly kind: "accuse"; readonly at: number };

/** What the host chooses before the start: the case, and the clock. */
export type MurdleOptions = {
  readonly caseId: string;
  readonly startedAt: number;
};

/** Nobody holds anything secret. */
export type MurdleHand = object;

/** The case a game falls back to - there is always at least one. */
const FIRST_CASE: Case = CASES[0] as Case;

/** The categories a grid block can have, for checking moves off the wire. */
const CATEGORIES: readonly string[] = [
  "suspects",
  "weapons",
  "locations",
  "motives",
];

/** The fields of the accusation form, for checking moves off the wire. */
const DRAFT_FIELDS: readonly string[] = Object.keys(NO_DRAFT);

/**
 * The case a game is about.
 *
 * @param game - the game
 * @returns its case
 */
export function caseOf(game: MurdleOnlineGame): Case {
  return CASES.find((one) => one.id === game.caseId) ?? FIRST_CASE;
}

/** Murdle, for the online layer. */
export const murdleAdapter: OnlineAdapter<
  MurdleOnlineGame,
  MurdleMove,
  MurdleHand,
  MurdleOptions
> = {
  gameId: MURDLE_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options): MurdleOnlineGame {
    return {
      caseId: CASES.some((one) => one.id === options.caseId)
        ? options.caseId
        : FIRST_CASE.id,
      marks: {},
      draft: NO_DRAFT,
      shown: 0,
      peeking: false,
      peeked: false,
      wrong: 0,
      verdict: null,
      solvedMs: null,
      startedAt: options.startedAt,
      names: seats.map((seat) => seat.name),
    };
  },

  seatIndexOnTurn(): number | null {
    // Nobody's turn - everybody's.
    return null;
  },

  applyMove(game, seatIndex, move): MurdleOnlineGame | null {
    return game.solvedMs === null ? played(game, seatIndex, move) : null;
  },

  isFinished(game): boolean {
    return game.solvedMs !== null;
  },

  aiMove(): MurdleMove | null {
    return null;
  },

  redact(game): MurdleOnlineGame {
    return game;
  },

  privateHands(): readonly MurdleHand[] {
    return [];
  },

  withOwnHand(game): MurdleOnlineGame {
    return game;
  },

  withAllHands(game): MurdleOnlineGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    return null;
  },

  isGameState(value): value is MurdleOnlineGame {
    return isOnlineGame(value);
  },

  isHand(value): value is MurdleHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is MurdleMove {
    return isMurdleMove(value);
  },
};

/** One move applied - the game after it. */
function played(
  game: MurdleOnlineGame,
  seat: number,
  move: MurdleMove,
): MurdleOnlineGame {
  const kase = caseOf(game);
  let next: MurdleOnlineGame;
  switch (move.kind) {
    case "mark":
      // While the solution is shown, the notes underneath stay as they are.
      next = game.peeking
        ? game
        : {
            ...game,
            marks: markSet(
              kase,
              game.marks,
              {
                block: { rows: move.rows, cols: move.cols },
                row: move.row,
                col: move.col,
              },
              move.mark,
              move.autoCross,
            ),
          };
      break;
    case "restart":
      next = game.peeking ? game : { ...game, marks: {} };
      break;
    case "hint":
      next = { ...game, shown: Math.min(game.shown + 1, kase.hints.length) };
      break;
    case "hideHints":
      next = { ...game, shown: 0 };
      break;
    case "allHints":
      // Every step shown, the whole grid and the form filled in - for
      // everybody. Pressing "Anklagen" is still left to the players.
      next = game.peeking
        ? { ...game, shown: kase.hints.length }
        : {
            ...game,
            shown: kase.hints.length,
            marks: solvedMarks(kase, kase.solution),
            draft: solvedDraft(kase),
          };
      break;
    case "step": {
      const step = kase.hints[move.index];
      next =
        game.peeking || step?.marks === undefined
          ? game
          : {
              ...game,
              marks: stepped(kase, game.marks, step.marks, move.autoCross),
            };
      break;
    }
    case "peek":
      next = { ...game, peeking: move.on, peeked: game.peeked || move.on };
      break;
    case "draft":
      next = { ...game, draft: { ...game.draft, [move.field]: move.value } };
      break;
    default:
      next = accused(game, kase, seat, move.at);
  }
  return next;
}

/**
 * Somebody presses "Anklagen": the shared form is checked against the
 * solution. A right answer solves the case for everybody.
 */
function accused(
  game: MurdleOnlineGame,
  kase: Case,
  seat: number,
  at: number,
): MurdleOnlineGame {
  const draft = game.draft;
  const right = isRight(kase, {
    suspect: draft.suspect,
    weapon: draft.weapon,
    location: draft.location,
    ...(kase.motives === undefined ? {} : { motive: draft.motive }),
  });
  return game.peeking
    ? game
    : {
        ...game,
        verdict: { right, by: seat, nonce: at },
        wrong: right ? game.wrong : game.wrong + 1,
        solvedMs: right ? Math.max(0, at - game.startedAt) : null,
      };
}

/** Whether a value read off the wire is the accusation form. */
function isDraft(value: unknown): value is Draft {
  const draft = value as Record<string, unknown>;
  return (
    typeof value === "object" &&
    value !== null &&
    DRAFT_FIELDS.every((field) => typeof draft[field] === "string")
  );
}

/** Whether a value read off the wire is a game of Murdle. */
function isOnlineGame(value: unknown): value is MurdleOnlineGame {
  const game = value as MurdleOnlineGame;
  const verdict = game?.verdict;
  // The database drops empty objects, so an empty grid may come back missing.
  const marks: unknown = game?.marks ?? {};
  return (
    typeof value === "object" &&
    value !== null &&
    typeof game.caseId === "string" &&
    typeof marks === "object" &&
    marks !== null &&
    Object.values(marks).every((one) => one === "x" || one === "check") &&
    isDraft(game.draft) &&
    Number.isInteger(game.shown) &&
    Number.isInteger(game.wrong) &&
    typeof game.peeking === "boolean" &&
    typeof game.peeked === "boolean" &&
    (game.solvedMs === null || Number.isFinite(game.solvedMs)) &&
    Number.isFinite(game.startedAt) &&
    (verdict === null ||
      (typeof verdict === "object" &&
        typeof verdict.right === "boolean" &&
        Number.isInteger(verdict.by) &&
        Number.isFinite(verdict.nonce))) &&
    Array.isArray(game.names) &&
    game.names.every((name) => typeof name === "string")
  );
}

/** Whether a value read off the wire is a move. */
function isMurdleMove(value: unknown): value is MurdleMove {
  const move = value as Record<string, unknown>;
  let valid = false;
  if (typeof value === "object" && value !== null) {
    switch (move.kind) {
      case "mark":
        valid =
          CATEGORIES.includes(String(move.rows)) &&
          CATEGORIES.includes(String(move.cols)) &&
          typeof move.row === "string" &&
          typeof move.col === "string" &&
          (move.mark === null || move.mark === "x" || move.mark === "check") &&
          typeof move.autoCross === "boolean";
        break;
      case "restart":
      case "hint":
      case "hideHints":
      case "allHints":
        valid = true;
        break;
      case "peek":
        valid = typeof move.on === "boolean";
        break;
      case "draft":
        valid =
          DRAFT_FIELDS.includes(String(move.field)) &&
          typeof move.value === "string";
        break;
      case "step":
        valid =
          Number.isInteger(move.index) && typeof move.autoCross === "boolean";
        break;
      case "accuse":
        valid = Number.isFinite(move.at);
        break;
      default:
        valid = false;
    }
  }
  return valid;
}
