/**
 * A case solved together, dressed as the same interface as a case at one
 * screen - so the very same view draws both.
 *
 * @module
 * @remarks
 * What is shared lives in the room: the grid, the accusation form, the steps
 * of help, the solution, the verdict. What is one's own stays here: the
 * setting whether a tick crosses out its row and column. Every action turns
 * into a move for the host, stated as the result it wants (see
 * ../multiplayer/adapter), and the grid changes when the host's answer comes
 * back. Nothing here touches the statistics of the browser.
 */
"use client";

import { useEffect, useRef } from "react";
import {
  cellKey,
  nextMark,
  solvedMarks,
  type Mark,
} from "@/games/murdle/engine/grid";
import { useAutoCross, type MurdleApi } from "@/games/murdle/hooks/use-murdle";
import {
  caseOf,
  type MurdleMove,
  type MurdleOnlineGame,
} from "@/games/murdle/multiplayer/adapter";

/** Nothing to do - for what only the game at one screen does. */
const IDLE = (): void => undefined;

/**
 * The shared case as the view's interface.
 *
 * @param game - the case as the room has it
 * @param send - hands a move to the host
 * @returns everything the case view needs
 */
export function useMurdleOnline(
  game: MurdleOnlineGame,
  send: (move: MurdleMove) => void,
): MurdleApi {
  const [autoCross, setAutoCross] = useAutoCross();
  const kase = caseOf(game);
  const over = game.solvedMs !== null || game.peeking;
  const solved = game.solvedMs !== null;
  // **What this player has sent and not yet seen come back.** A move states
  // its result, so a quick second tap must build on the first one, not on
  // the grid as it was before the host answered.
  const pending = useRef<Record<string, Mark | null>>({});
  useEffect(() => {
    pending.current = {};
  }, [game.marks]);
  return {
    kase,
    solved: new Set(),
    begun: new Set(),
    // While the solution is shown, it is what the grid shows - for everybody.
    marks: game.peeking ? solvedMarks(kase, kase.solution) : game.marks,
    autoCross,
    setAutoCross,
    open: IDLE,
    toList: IDLE,
    tap: (square) => {
      if (!over) {
        const key = cellKey(square.row, square.col);
        const mark = nextMark(
          key in pending.current
            ? (pending.current[key] ?? undefined)
            : game.marks[key],
        );
        pending.current = { ...pending.current, [key]: mark };
        send({
          kind: "mark",
          rows: square.block.rows,
          cols: square.block.cols,
          row: square.row,
          col: square.col,
          mark,
          autoCross,
        });
      }
    },
    // With several writers nobody would know whose step went back.
    undo: IDLE,
    canUndo: false,
    restart: () => send({ kind: "restart" }),
    hints: game.shown,
    shownHints: game.shown,
    hint: () => send({ kind: "hint" }),
    hideHints: () => send({ kind: "hideHints" }),
    allHints: () => send({ kind: "allHints" }),
    applyHint: (index) => {
      if (!over) {
        send({ kind: "step", index, autoCross });
      }
    },
    peeking: game.peeking,
    peeked: game.peeked,
    reveal: () => send({ kind: "peek", on: true }),
    hideSolution: () => send({ kind: "peek", on: false }),
    draft: game.draft,
    setDraft: (field, value) => send({ kind: "draft", field, value }),
    // Once solved, the host opens the next case for everybody instead.
    canReplay: false,
    accuse: () => send({ kind: "accuse", at: Date.now() }),
    verdict:
      game.verdict === null
        ? null
        : { right: game.verdict.right, nonce: game.verdict.nonce },
    wrong: game.wrong,
    solvedMs: game.solvedMs,
    // The clock runs from when the host opened the case.
    elapsed: () => Math.max(0, Date.now() - game.startedAt),
    running: !solved,
    next: null,
    replay: IDLE,
  };
}
