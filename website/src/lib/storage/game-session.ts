/**
 * Persists the game currently in progress, so a reload resumes it.
 *
 * @module
 * @remarks
 * Generic over the state type: a new game supplies its own state and its own
 * guard, nothing here needs to change.
 */
import type { GameId } from "@/games/registry";
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "./local-store";

/** Schema version of a stored session - raise it on breaking changes. */
const SESSION_VERSION = 1;

/** Key part identifying the session entry. */
const SESSION_KEY = "session";

/** The game in progress, plus what the statistics need to know about it. */
export type GameSession<TState> = {
  /** The engine state, exactly as the game defines it. */
  readonly state: TState;
  /** When this game was begun. */
  readonly startedAt: number;
  /** Time actually spent in this game so far. */
  readonly playTimeMs: number;
  /** True once the outcome has been counted, so a reload cannot count twice. */
  readonly isOutcomeRecorded: boolean;
};

/**
 * Loads the session of a game.
 *
 * @param gameId - which game
 * @param isValidState - guard for the engine state of that game
 * @returns the session, or null if none is stored or it is unusable
 */
export function loadSession<TState>(
  gameId: GameId,
  isValidState: (value: unknown) => value is TState,
): GameSession<TState> | null {
  return readStored(
    storageKey(gameId, SESSION_KEY),
    SESSION_VERSION,
    (value): value is GameSession<TState> => isSession(value, isValidState),
  );
}

/**
 * Stores the session of a game.
 *
 * @param gameId - which game
 * @param session - the session to store
 */
export function saveSession<TState>(
  gameId: GameId,
  session: GameSession<TState>,
): void {
  writeStored(storageKey(gameId, SESSION_KEY), SESSION_VERSION, session);
}

/**
 * Deletes the session of a game.
 *
 * @param gameId - which game
 */
export function clearSession(gameId: GameId): void {
  removeStored(storageKey(gameId, SESSION_KEY));
}

/** Checks the session envelope, then hands the state to the game's guard. */
function isSession<TState>(
  value: unknown,
  isValidState: (candidate: unknown) => candidate is TState,
): value is GameSession<TState> {
  const session = value as GameSession<TState>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof session.startedAt === "number" &&
    typeof session.playTimeMs === "number" &&
    typeof session.isOutcomeRecorded === "boolean" &&
    isValidState(session.state)
  );
}
