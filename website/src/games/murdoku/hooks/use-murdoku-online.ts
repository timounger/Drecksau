/**
 * A case solved together, dressed as the same interface as a case at one
 * screen - so the very same view draws both.
 *
 * @module
 * @remarks
 * What is shared lives in the room: the notes, the steps shown, the solution
 * on the map, the check. What is one's own stays here: which suspect one
 * has picked up to place. Every action turns into a move for the host, stated
 * as the result it wants (see ../multiplayer/adapter), and the map changes
 * when the host's answer comes back.
 */
"use client";

import { useState } from "react";
import { cellKey, standingOn } from "@/games/murdoku/engine/board";
import {
  culpritOf,
  isStandable,
  solutionOf,
} from "@/games/murdoku/engine/rules";
import type { Cell } from "@/games/murdoku/engine/types";
import type { MurdokuApi, Outcome } from "@/games/murdoku/hooks/use-murdoku";
import {
  levelOf,
  type MurdokuMove,
  type MurdokuOnlineGame,
} from "@/games/murdoku/multiplayer/adapter";

/** Nothing to do - for what the list of cases does offline. */
const IDLE = (): void => undefined;

/**
 * The shared case as the view's interface.
 *
 * @param game - the case as the room has it
 * @param send - hands a move to the host
 * @returns everything the case view needs
 */
export function useMurdokuOnline(
  game: MurdokuOnlineGame,
  send: (move: MurdokuMove) => void,
): MurdokuApi {
  const [selected, setSelected] = useState<string | null>(null);
  const level = levelOf(game);
  const solution = solutionOf(level);
  const over = game.outcome?.kind === "right" || game.peeking;
  const board = game.board;

  const tap = (cell: Cell) => {
    const key = cellKey(cell);
    const there = standingOn(board, cell);
    if (!over && isStandable(level, cell)) {
      if (selected !== null) {
        const has = (board.notes[key] ?? []).includes(selected);
        send({ kind: "mark", id: selected, cell, on: !has });
      } else if (there !== null) {
        send({ kind: "remove", id: there });
      } else {
        send({ kind: "cross", cell, on: !board.crosses.includes(key) });
      }
    }
  };

  const hold = (cell: Cell) => {
    const who = selected;
    if (!over && who !== null && isStandable(level, cell)) {
      send({ kind: "place", id: who, cell });
      setSelected(null);
    }
  };

  const outcome: Outcome | null =
    game.outcome === null
      ? null
      : game.outcome.kind === "right"
        ? { kind: "right", who: game.outcome.who, ms: game.outcome.ms }
        : { kind: "wrong", who: game.outcome.who };

  return {
    level,
    solved: new Set(),
    begun: new Set(),
    // While the solution is shown, it is what the map shows - for everybody.
    board:
      game.peeking && solution !== null
        ? { placement: solution, notes: {}, crosses: [] }
        : board,
    selected,
    outcome,
    hints: game.shown,
    shownHints: game.shown,
    canUndo: false,
    undoable: false,
    peeking: game.peeking,
    peeked: game.peeked,
    culprit:
      game.peeking && solution !== null ? culpritOf(level, solution) : null,
    open: IDLE,
    toList: IDLE,
    select: setSelected,
    tap,
    hold,
    clear: (cell) => {
      if (!over) {
        send({ kind: "wipe", cell });
      }
    },
    undo: IDLE,
    restart: () => send({ kind: "restart" }),
    hint: () => send({ kind: "hint" }),
    hideHints: () => send({ kind: "hideHints" }),
    allHints: () => {
      setSelected(null);
      send({ kind: "allHints" });
    },
    applyHint: (index) => send({ kind: "step", index }),
    reveal: () => {
      setSelected(null);
      send({ kind: "peek", on: true });
    },
    hideSolution: () => send({ kind: "peek", on: false }),
    check:
      game.check === null
        ? null
        : { results: game.check.results, nonce: game.check.nonce },
    confirm: () => {
      setSelected(null);
      send({ kind: "confirm", at: Date.now() });
    },
    // Once solved, the host opens the next case for everybody instead.
    canReplay: game.outcome?.kind !== "right",
    replay: () => send({ kind: "restart" }),
    // The clock of a case together runs from when the host opened it; once
    // solved, it shows how long that took.
    elapsed: () =>
      game.outcome?.kind === "right"
        ? game.outcome.ms
        : Math.max(0, Date.now() - game.startedAt),
    running: game.outcome?.kind !== "right",
    // The next case together is opened by the host, from the lobby.
    next: null,
  };
}
