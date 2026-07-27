/**
 * The authoritative Krakel Orakel game: rounds, the shared drawing and scores.
 *
 * @module
 * @remarks
 * A pure, serialisable value the host advances and streams. One player is the
 * drawer of the round and pictures a secret term starting from the round's
 * krakel squiggle; the others guess. Guessing early scores more; the drawer
 * scores per player who gets it. After every player has drawn (twice) the game
 * is over. Time is passed in from outside so the whole thing stays pure and
 * testable - nothing here reads the clock.
 */
import { isCorrectGuess } from "./guess";
import { pickWord } from "./words";
import { createRandom, randomInt, type Random } from "./random";
import { drawerPointsPerGuess, guesserPoints } from "./scoring";
import {
  DRAW_SECONDS,
  MAX_STROKE_POINTS,
  MAX_STROKES,
  REVEAL_SECONDS,
  ROUNDS_PER_PLAYER,
  type KrakelPhase,
  type Stroke,
} from "./types";

/** A player's id (the online seat id), kept as a plain string in the engine. */
export type PlayerId = string;

/** The whole game at one instant. */
export type KrakelGame = {
  readonly phase: KrakelPhase;
  /** The current round, 1-based. */
  readonly round: number;
  /** How many rounds the whole game runs. */
  readonly totalRounds: number;
  /** The players' ids in draw order. */
  readonly order: readonly PlayerId[];
  /** The base seed the per-round term and squiggle are derived from. */
  readonly seed: number;
  /** The round's secret term. */
  readonly term: string;
  /** The round's squiggle seed, shared with every client. */
  readonly krakelSeed: number;
  readonly strokes: readonly Stroke[];
  /** The drawer's in-progress stroke, or null between strokes. */
  readonly live: Stroke | null;
  /** Milliseconds since the epoch at which the current phase ends. */
  readonly deadline: number;
  /** Every player's running score. */
  readonly scores: Readonly<Record<PlayerId, number>>;
  /** Who has guessed the term this round, in the order they got it. */
  readonly guessed: readonly PlayerId[];
  /** Terms already played, so they do not repeat. */
  readonly used: readonly string[];
  /** Bumped on every correct guess, so the client can key an announcement. */
  readonly announce: number;
};

/** What submitting a guess did. */
export type GuessResult = "correct" | "already" | "wrong" | "ignored";

/** Milliseconds in a second, for turning the tuning seconds into deadlines. */
const MS_PER_SECOND = 1000;

/** The 32-bit golden-ratio odd constant, for spreading a round into a seed. */
const GOLDEN_ODD_32 = 0x9e3779b1;

/** Largest 32-bit unsigned value, the range a krakel seed is drawn from. */
const UINT32_RANGE = 0xffffffff;

/** Mixes the base seed with a round number into a fresh 32-bit seed. */
function roundSeed(seed: number, round: number): number {
  return (seed ^ Math.imul(round, GOLDEN_ODD_32)) >>> 0;
}

/** Deals the term, squiggle and deadline for a round. */
function dealRound(
  seed: number,
  round: number,
  used: readonly string[],
  now: number,
): {
  readonly term: string;
  readonly krakelSeed: number;
  readonly deadline: number;
} {
  const random: Random = createRandom(roundSeed(seed, round));
  const term = pickWord(random, used);
  const krakelSeed = randomInt(random, UINT32_RANGE);
  const deadline = now + DRAW_SECONDS * MS_PER_SECOND;
  return { term, krakelSeed, deadline };
}

/**
 * Starts a fresh game for a set of players.
 *
 * @param order - the players' ids in draw order (at least two)
 * @param seed - the base seed for the terms and squiggles
 * @param now - the current time in milliseconds
 * @returns a game in its first drawing round
 */
export function createGame(
  order: readonly PlayerId[],
  seed: number,
  now: number,
): KrakelGame {
  const round = 1;
  const deal = dealRound(seed, round, [], now);
  const scores: Record<PlayerId, number> = {};
  for (const id of order) {
    scores[id] = 0;
  }
  return {
    phase: "drawing",
    round,
    totalRounds: order.length * ROUNDS_PER_PLAYER,
    order,
    seed,
    term: deal.term,
    krakelSeed: deal.krakelSeed,
    strokes: [],
    live: null,
    deadline: deal.deadline,
    scores,
    guessed: [],
    used: [],
    announce: 0,
  };
}

/** The id of the player drawing this round. */
export function drawerId(game: KrakelGame): PlayerId {
  return game.order[(game.round - 1) % game.order.length];
}

/** How many players (everyone but the drawer) still need to guess. */
export function guessersCount(game: KrakelGame): number {
  return game.order.length - 1;
}

/** Whether every guesser has already guessed the term this round. */
export function allGuessed(game: KrakelGame): boolean {
  return game.guessed.length >= guessersCount(game);
}

/** Trims a stroke to the point cap, so one scribble cannot grow unbounded. */
function capStroke(stroke: Stroke): Stroke {
  return stroke.points.length <= MAX_STROKE_POINTS
    ? stroke
    : { ...stroke, points: stroke.points.slice(0, MAX_STROKE_POINTS) };
}

/**
 * Adds a finished stroke to the drawing.
 *
 * @param game - the current game
 * @param stroke - the completed stroke
 * @returns the game with the stroke added, or unchanged outside the drawing phase
 */
export function addStroke(game: KrakelGame, stroke: Stroke): KrakelGame {
  let result = game;
  if (game.phase === "drawing") {
    const kept = [...game.strokes, capStroke(stroke)].slice(-MAX_STROKES);
    result = { ...game, strokes: kept, live: null };
  }
  return result;
}

/**
 * Sets or clears the drawer's in-progress stroke.
 *
 * @param game - the current game
 * @param stroke - the live stroke, or null to clear it
 * @returns the game with the live stroke updated
 */
export function setLive(game: KrakelGame, stroke: Stroke | null): KrakelGame {
  let result = game;
  if (game.phase === "drawing") {
    result = { ...game, live: stroke === null ? null : capStroke(stroke) };
  }
  return result;
}

/**
 * Clears the whole drawing.
 *
 * @param game - the current game
 * @returns the game with an empty drawing
 */
export function clearStrokes(game: KrakelGame): KrakelGame {
  return game.phase === "drawing" ? { ...game, strokes: [], live: null } : game;
}

/**
 * Removes the last finished stroke.
 *
 * @param game - the current game
 * @returns the game with the last stroke undone
 */
export function undoStroke(game: KrakelGame): KrakelGame {
  return game.phase === "drawing"
    ? { ...game, strokes: game.strokes.slice(0, -1), live: null }
    : game;
}

/** Adds points to a player's score, returning a fresh scores record. */
function withScore(
  scores: Readonly<Record<PlayerId, number>>,
  id: PlayerId,
  points: number,
): Record<PlayerId, number> {
  return { ...scores, [id]: (scores[id] ?? 0) + points };
}

/**
 * Handles a player's guess.
 *
 * @param game - the current game
 * @param id - the guessing player's id
 * @param text - the raw text they typed
 * @returns the game after the guess and what the guess did
 * @remarks
 * A correct guess scores the guesser (more the earlier it lands) and the drawer,
 * and remembers the guesser so they cannot score twice. The drawer's own text,
 * a guess after the round, or a repeat all do nothing to the score.
 */
export function submitGuess(
  game: KrakelGame,
  id: PlayerId,
  text: string,
): { readonly game: KrakelGame; readonly result: GuessResult } {
  let result: GuessResult;
  let next = game;
  if (
    game.phase !== "drawing" ||
    id === drawerId(game) ||
    !game.order.includes(id)
  ) {
    result = "ignored";
  } else if (game.guessed.includes(id)) {
    result = "already";
  } else if (isCorrectGuess(text, game.term)) {
    const scores = withScore(
      withScore(game.scores, id, guesserPoints(game.guessed.length)),
      drawerId(game),
      drawerPointsPerGuess(),
    );
    next = {
      ...game,
      scores,
      guessed: [...game.guessed, id],
      announce: game.announce + 1,
    };
    result = "correct";
  } else {
    result = "wrong";
  }
  return { game: next, result };
}

/**
 * Advances the game as time passes: ends the round on time or a clean sweep,
 * then moves on to the next round or to the final scores.
 *
 * @param game - the current game
 * @param now - the current time in milliseconds
 * @returns the game after any phase change the clock triggered
 */
export function tick(game: KrakelGame, now: number): KrakelGame {
  let result = game;
  if (game.phase === "drawing" && (now >= game.deadline || allGuessed(game))) {
    result = {
      ...game,
      phase: "reveal",
      live: null,
      deadline: now + REVEAL_SECONDS * MS_PER_SECOND,
    };
  } else if (game.phase === "reveal" && now >= game.deadline) {
    result =
      game.round >= game.totalRounds ? endGame(game) : nextRound(game, now);
  }
  return result;
}

/** Ends the game, leaving the final scores in place. */
function endGame(game: KrakelGame): KrakelGame {
  return { ...game, phase: "over", live: null };
}

/** Opens the next round: rotates the drawer and deals a new term and squiggle. */
function nextRound(game: KrakelGame, now: number): KrakelGame {
  const round = game.round + 1;
  const used = [...game.used, game.term];
  const deal = dealRound(game.seed, round, used, now);
  return {
    ...game,
    phase: "drawing",
    round,
    term: deal.term,
    krakelSeed: deal.krakelSeed,
    strokes: [],
    live: null,
    deadline: deal.deadline,
    guessed: [],
    used,
    announce: game.announce,
  };
}

/**
 * Starts a fresh game with the same players, for a rematch.
 *
 * @param game - the finished game
 * @param seed - the base seed for the new game
 * @param now - the current time in milliseconds
 * @returns a new game in its first round
 */
export function restartGame(
  game: KrakelGame,
  seed: number,
  now: number,
): KrakelGame {
  return createGame(game.order, seed, now);
}
