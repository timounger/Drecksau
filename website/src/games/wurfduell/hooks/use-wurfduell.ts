/**
 * A match against the computer on this device.
 *
 * @module
 * @remarks
 * The match lives in React state and only changes through the engine's
 * reducer. The computer waits for the arena to report that the last throw has
 * settled before it throws back, so a throw is never answered while the first
 * one is still in the air.
 *
 * Statistics are booked as moves are made rather than by watching the state,
 * so nothing is ever counted twice by a re-render.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiThrow, type Difficulty } from "@/games/wurfduell/engine/ai";
import {
  applyMove,
  createGame,
  randomCharacter,
} from "@/games/wurfduell/engine/game";
import type {
  CharacterId,
  DuelGame,
  DuelMove,
  ThrowInput,
} from "@/games/wurfduell/engine/types";
import type { GameId } from "@/games/registry";
import {
  updateDuelStats,
  withMatch,
  withThrow,
} from "@/games/wurfduell/stats/duel-stats";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";

/** What the local screen gets. */
export type LocalDuel = {
  /** The match, or null before the first fighter is chosen. */
  readonly game: DuelGame | null;
  /** Takes the player's fighter; the computer picks right after. */
  readonly pick: (character: CharacterId) => void;
  readonly throwFor: (input: ThrowInput) => void;
  readonly resign: () => void;
  /**
   * Another match at the same table, keeping the score.
   *
   * @remarks
   * Given a fighter, the player keeps them and the computer picks again at
   * once; given null, the next match starts at the fighter choice.
   */
  readonly rematch: (keep: CharacterId | null) => void;
  /** Throws the table away and starts over from the fighter choice. */
  readonly reset: () => void;
  /** The arena reports a throw that has finished flying. */
  readonly settle: (throwId: number) => void;
  /** Whether the end of the match may be shown - the last throw has landed. */
  readonly settled: boolean;
};

/** This game, for the shared statistics. */
const GAME_ID: GameId = "wurfduell";

/** The computer's pause before throwing, so it looks like thinking. */
const AI_DELAY_MS = 900;

/** Salt for the computer's choice of fighter. */
const AI_PICK_SALT = 31;

/** The human's seat. */
const HUMAN = 0;
/** The computer's seat. */
const COMPUTER = 1;

/** Random seeds are 32-bit. */
const SEED_RANGE = 4_294_967_296;

/**
 * Runs a match against the computer.
 *
 * @param names - how the two seats are called
 * @param difficulty - how well the computer aims
 * @returns the match and what can be done with it
 */
export function useWurfduell(
  names: readonly string[],
  difficulty: Difficulty,
): LocalDuel {
  const [game, setGame] = useState<DuelGame | null>(null);
  const [settledId, setSettledId] = useState(0);
  const startedAt = useRef(0);

  const apply = useCallback(
    (current: DuelGame, seat: number, move: DuelMove): DuelGame => {
      const next = applyMove(current, seat, move) ?? current;
      if (next !== current) {
        book(current, next, seat, move, startedAt);
      }
      return next;
    },
    [],
  );

  const pickOn = useCallback(
    (table: DuelGame, character: CharacterId): DuelGame => {
      const mine = apply(table, HUMAN, { kind: "pick", character });
      return apply(mine, COMPUTER, {
        kind: "pick",
        character: randomCharacter(mine.seed, AI_PICK_SALT + mine.round),
      });
    },
    [apply],
  );

  const pick = useCallback(
    (character: CharacterId) => {
      const table =
        game ?? createGame(names, Math.floor(Math.random() * SEED_RANGE));
      if (table.phase === "pick") {
        setSettledId(0);
        setGame(pickOn(table, character));
      }
    },
    [game, names, pickOn],
  );

  const throwFor = useCallback(
    (input: ThrowInput) => {
      if (game !== null) {
        setGame(apply(game, HUMAN, { kind: "throw", ...input }));
      }
    },
    [apply, game],
  );

  const resign = useCallback(() => {
    if (game !== null) {
      setGame(apply(game, HUMAN, { kind: "resign" }));
    }
  }, [apply, game]);

  const rematch = useCallback(
    (keep: CharacterId | null) => {
      if (game !== null) {
        setSettledId(0);
        const next = apply(apply(game, HUMAN, { kind: "rematch" }), COMPUTER, {
          kind: "rematch",
        });
        setGame(keep === null ? next : pickOn(next, keep));
      }
    },
    [apply, game, pickOn],
  );

  const reset = useCallback(() => {
    setSettledId(0);
    setGame(null);
  }, []);

  // The computer's turn, once the last throw has come down.
  const currentId = game?.lastThrow?.id ?? 0;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (
      game !== null &&
      game.phase === "throw" &&
      game.turn === COMPUTER &&
      settledId === currentId
    ) {
      timer = setTimeout(() => {
        setGame(
          apply(game, COMPUTER, {
            kind: "throw",
            ...aiThrow(game, difficulty),
          }),
        );
      }, AI_DELAY_MS);
    }
    return () => clearTimeout(timer);
  }, [apply, currentId, difficulty, game, settledId]);

  return {
    game,
    pick,
    throwFor,
    resign,
    rematch,
    reset,
    settle: setSettledId,
    settled: settledId === currentId,
  };
}

/** Books a move into the statistics. */
function book(
  before: DuelGame,
  after: DuelGame,
  seat: number,
  move: DuelMove,
  startedAt: { current: number },
): void {
  const now = Date.now();
  if (before.phase === "pick" && after.phase === "throw") {
    startedAt.current = now;
    recordGameStarted(GAME_ID, now);
  }
  if (move.kind === "throw" && seat === HUMAN && after.lastThrow !== null) {
    const record = after.lastThrow;
    updateDuelStats((stats) =>
      withThrow(
        stats,
        record.damage,
        record.best === "head",
        record.input.ability,
      ),
    );
  }
  if (before.phase !== "over" && after.phase === "over") {
    const human = after.players[HUMAN];
    const won = after.winner === HUMAN;
    recordGameFinished(GAME_ID, {
      won,
      durationMs: now - startedAt.current,
      finishedAt: now,
    });
    recordPlayTime(GAME_ID, now - startedAt.current, now);
    if (human.character !== null) {
      const character = human.character;
      updateDuelStats((stats) =>
        withMatch(stats, character, won, human.hp === human.maxHp),
      );
    }
  }
}
