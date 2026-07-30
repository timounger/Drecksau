/**
 * The authoritative Krakel Orakel game: rounds, every player's drawing and the
 * team's score.
 *
 * @module
 * @remarks
 * A pure, serialisable value the host advances and streams. Krakel Orakel is
 * cooperative and simultaneous: every player gets their own board, their own
 * squiggle and their own secret term, and all of them draw at the same time.
 * When the time is up every board is laid open next to a word list holding all
 * the real terms plus {@link DECOY_COUNT} words nobody drew. The players then
 * take turns striking a word they think was never drawn - striking a decoy
 * earns the team points, striking a real term costs them. Time is passed in
 * from outside so the whole thing stays pure and testable - nothing here reads
 * the clock.
 */
import { KRAKEL_BOARD_COUNT } from "./boards";
import { pickWords, shuffleWords } from "./words";
import { createRandom, randomInt, type Random } from "./random";
import { exclusionPoints } from "./scoring";
import {
  DECOY_COUNT,
  DRAW_SECONDS,
  ELIMINATE_SECONDS,
  MAX_STROKE_POINTS,
  MAX_STROKES,
  REVEAL_SECONDS,
  TOTAL_ROUNDS,
  type Difficulty,
  type KrakelPhase,
  type Stroke,
} from "./types";

/** A player's id (the online seat id), kept as a plain string in the engine. */
export type PlayerId = string;

/** One word struck off the list, and how it turned out. */
export type Exclusion = {
  readonly word: string;
  /** Who struck it. */
  readonly by: PlayerId;
  /** True if nobody had drawn it - the team scored. */
  readonly wasDecoy: boolean;
};

/** The whole game at one instant. */
export type KrakelGame = {
  readonly phase: KrakelPhase;
  /** The current round, 1-based. */
  readonly round: number;
  /** How many rounds the whole game runs. */
  readonly totalRounds: number;
  /** The players' ids, in the order they strike words. */
  readonly order: readonly PlayerId[];
  /** The base seed the per-round terms and squiggles are derived from. */
  readonly seed: number;
  /** Which word list this game is played with, chosen before it started. */
  readonly difficulty: Difficulty;
  /** Every player's own secret term this round. */
  readonly terms: Readonly<Record<PlayerId, string>>;
  /** Which printed board each player draws on, shared with every client. */
  readonly boardIds: Readonly<Record<PlayerId, number>>;
  /** Every player's finished strokes. */
  readonly boards: Readonly<Record<PlayerId, readonly Stroke[]>>;
  /** Who has declared their drawing finished. */
  readonly ready: readonly PlayerId[];
  /** Milliseconds since the epoch at which the current phase ends. */
  readonly deadline: number;
  /** The round's word list: every real term plus the decoys, shuffled. */
  readonly candidates: readonly string[];
  /** The words struck so far this round, in the order they went. */
  readonly excluded: readonly Exclusion[];
  /**
   * How many words have been struck over the whole game, not just this round.
   *
   * @remarks
   * This, and not the current round's count, is what picks whose turn it is. A
   * round only has {@link DECOY_COUNT} turns to give away, so restarting the
   * rotation every round would mean the players after the fourth never got one.
   * Letting it run on across rounds spreads the turns evenly over everybody.
   */
  readonly turn: number;
  /** The team's running score over the whole game. */
  readonly score: number;
  /** What the team scored in the current round. */
  readonly roundScore: number;
  /** Words already dealt, so a later round does not repeat them. */
  readonly used: readonly string[];
  /** Bumped on every exclusion, so the client can key an announcement. */
  readonly announce: number;
};

/** What striking a word did. */
export type ExcludeResult = "excluded" | "ignored";

/** Milliseconds in a second, for turning the tuning seconds into deadlines. */
const MS_PER_SECOND = 1000;

/** The 32-bit golden-ratio odd constant, for spreading a round into a seed. */
const GOLDEN_ODD_32 = 0x9e3779b1;

/**
 * Starts a fresh game for a set of players.
 *
 * @param order - the players' ids (at least two)
 * @param seed - the base seed for the terms, decoys and squiggles
 * @param now - the current time in milliseconds
 * @param difficulty - which word list to play with
 * @returns a game in its first drawing round, with the team on zero
 */
export function createGame(
  order: readonly PlayerId[],
  seed: number,
  now: number,
  difficulty: Difficulty,
): KrakelGame {
  const round = 1;
  const deal = dealRound(seed, round, order, [], now, difficulty);
  return {
    phase: "drawing",
    round,
    totalRounds: TOTAL_ROUNDS,
    order,
    seed,
    difficulty,
    terms: deal.terms,
    boardIds: deal.boardIds,
    boards: emptyBoards(order),
    ready: [],
    deadline: deal.deadline,
    candidates: deal.candidates,
    excluded: [],
    turn: 0,
    score: 0,
    roundScore: 0,
    used: deal.candidates,
    announce: 0,
  };
}

/**
 * Whose turn it is to strike a word.
 *
 * @param game - the current game
 * @returns the player on turn in the elimination phase
 * @remarks
 * The rotation follows {@link KrakelGame.turn}, which counts every word struck
 * in the whole game - so it carries on where the last round left off instead of
 * starting over at the first player.
 */
export function currentPickerId(game: KrakelGame): PlayerId {
  return game.order[game.turn % game.order.length];
}

/**
 * The words still on the list.
 *
 * @param game - the current game
 * @returns the candidates that have not been struck yet
 */
export function remainingWords(game: KrakelGame): readonly string[] {
  const struck = game.excluded.map((entry) => entry.word);
  return game.candidates.filter((word) => !struck.includes(word));
}

/**
 * Whether a word is one a player really drew.
 *
 * @param game - the current game
 * @param word - the word to check
 * @returns true if the word is somebody's term, false if it is a decoy
 */
export function isRealTerm(game: KrakelGame, word: string): boolean {
  return Object.values(game.terms).includes(word);
}

/** Whether every player has declared their drawing finished. */
export function allReady(game: KrakelGame): boolean {
  return game.order.every((id) => game.ready.includes(id));
}

/**
 * Marks a player's drawing as finished.
 *
 * @param game - the current game
 * @param id - the player who is done
 * @returns the game with that player marked ready
 */
export function readyUp(game: KrakelGame, id: PlayerId): KrakelGame {
  const idle = game.phase !== "drawing" || game.ready.includes(id);
  return idle || !game.order.includes(id)
    ? game
    : { ...game, ready: [...game.ready, id] };
}

/**
 * Adds a finished stroke to a player's board.
 *
 * @param game - the current game
 * @param id - the drawing player
 * @param stroke - the completed stroke
 * @returns the game with the stroke added, or unchanged outside the drawing phase
 */
export function addStroke(
  game: KrakelGame,
  id: PlayerId,
  stroke: Stroke,
): KrakelGame {
  let result = game;
  if (canDraw(game, id)) {
    const kept = [...boardOf(game, id), capStroke(stroke)].slice(-MAX_STROKES);
    result = {
      ...game,
      boards: { ...game.boards, [id]: kept },
    };
  }
  return result;
}

/**
 * Clears a player's whole drawing.
 *
 * @param game - the current game
 * @param id - the drawing player
 * @returns the game with that player's board empty
 */
export function clearStrokes(game: KrakelGame, id: PlayerId): KrakelGame {
  return canDraw(game, id)
    ? { ...game, boards: { ...game.boards, [id]: [] } }
    : game;
}

/**
 * Removes the last finished stroke from a player's board.
 *
 * @param game - the current game
 * @param id - the drawing player
 * @returns the game with that player's last stroke undone
 */
export function undoStroke(game: KrakelGame, id: PlayerId): KrakelGame {
  return canDraw(game, id)
    ? {
        ...game,
        boards: { ...game.boards, [id]: boardOf(game, id).slice(0, -1) },
      }
    : game;
}

/**
 * Strikes a word off the list on a player's turn.
 *
 * @param game - the current game
 * @param id - the player striking the word
 * @param word - the word they believe nobody drew
 * @param now - the current time in milliseconds, for the next turn's clock
 * @returns the game after the strike and whether it counted
 * @remarks
 * Only the player on turn may strike, only during the elimination phase, and
 * only a word still on the list. A decoy earns the team points, a real term
 * costs them; either way the word is gone and the turn passes on.
 */
export function excludeWord(
  game: KrakelGame,
  id: PlayerId,
  word: string,
  now: number,
): { readonly game: KrakelGame; readonly result: ExcludeResult } {
  let result: ExcludeResult;
  let next = game;
  if (
    game.phase !== "eliminating" ||
    id !== currentPickerId(game) ||
    !remainingWords(game).includes(word)
  ) {
    result = "ignored";
  } else {
    const wasDecoy = !isRealTerm(game, word);
    const points = exclusionPoints(wasDecoy);
    next = {
      ...game,
      excluded: [...game.excluded, { word, by: id, wasDecoy }],
      turn: game.turn + 1,
      score: game.score + points,
      roundScore: game.roundScore + points,
      deadline: now + ELIMINATE_SECONDS * MS_PER_SECOND,
      announce: game.announce + 1,
    };
    result = "excluded";
  }
  return { game: next, result };
}

/**
 * Advances the game as time passes: opens the boards when the drawing time is
 * up, moves the turn on when a player dithers, then rounds it off.
 *
 * @param game - the current game
 * @param now - the current time in milliseconds
 * @returns the game after any phase change the clock triggered
 */
export function tick(game: KrakelGame, now: number): KrakelGame {
  let result = game;
  if (game.phase === "drawing" && (now >= game.deadline || allReady(game))) {
    result = startEliminating(game, now);
  } else if (game.phase === "eliminating") {
    result = tickEliminating(game, now);
  } else if (game.phase === "reveal" && now >= game.deadline) {
    result =
      game.round >= game.totalRounds ? endGame(game) : nextRound(game, now);
  }
  return result;
}

/**
 * Starts a fresh game with the same players, for a rematch.
 *
 * @param game - the finished game
 * @param seed - the base seed for the new game
 * @param now - the current time in milliseconds
 * @returns a new game in its first round, at the same difficulty
 */
export function restartGame(
  game: KrakelGame,
  seed: number,
  now: number,
): KrakelGame {
  return createGame(game.order, seed, now, game.difficulty);
}

/** Mixes the base seed with a round number into a fresh 32-bit seed. */
function roundSeed(seed: number, round: number): number {
  return (seed ^ Math.imul(round, GOLDEN_ODD_32)) >>> 0;
}

/** Deals every player's term and squiggle, the decoys and the deadline. */
function dealRound(
  seed: number,
  round: number,
  order: readonly PlayerId[],
  used: readonly string[],
  now: number,
  difficulty: Difficulty,
): {
  readonly terms: Record<PlayerId, string>;
  readonly boardIds: Record<PlayerId, number>;
  readonly candidates: readonly string[];
  readonly deadline: number;
} {
  const random: Random = createRandom(roundSeed(seed, round));
  // One draw for everything, so no decoy can collide with somebody's term.
  const words = pickWords(random, order.length + DECOY_COUNT, used, difficulty);
  // Shuffled ids, so no two players share a board within the same round.
  const shuffled = shuffleBoardIds(random);
  const terms: Record<PlayerId, string> = {};
  const boardIds: Record<PlayerId, number> = {};
  order.forEach((id, index) => {
    terms[id] = words[index];
    boardIds[id] = shuffled[index % shuffled.length];
  });
  return {
    terms,
    boardIds,
    candidates: shuffleWords(random, words),
    deadline: now + DRAW_SECONDS * MS_PER_SECOND,
  };
}

/** The board ids in a seeded random order, so a round deals distinct boards. */
function shuffleBoardIds(random: Random): number[] {
  const ids = Array.from({ length: KRAKEL_BOARD_COUNT }, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randomInt(random, i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/** A board for every player, all empty. */
function emptyBoards(
  order: readonly PlayerId[],
): Record<PlayerId, readonly Stroke[]> {
  const boards: Record<PlayerId, readonly Stroke[]> = {};
  for (const id of order) {
    boards[id] = [];
  }
  return boards;
}

/** Whether this player may still put ink on their board. */
function canDraw(game: KrakelGame, id: PlayerId): boolean {
  return (
    game.phase === "drawing" &&
    game.order.includes(id) &&
    !game.ready.includes(id)
  );
}

/** A player's finished strokes, or an empty board if they have none yet. */
function boardOf(game: KrakelGame, id: PlayerId): readonly Stroke[] {
  return game.boards[id] ?? [];
}

/** Trims a stroke to the point cap, so one scribble cannot grow unbounded. */
function capStroke(stroke: Stroke): Stroke {
  return stroke.points.length <= MAX_STROKE_POINTS
    ? stroke
    : { ...stroke, points: stroke.points.slice(0, MAX_STROKE_POINTS) };
}

/** Lays every board open and hands the first player the word list. */
function startEliminating(game: KrakelGame, now: number): KrakelGame {
  return {
    ...game,
    phase: "eliminating",
    deadline: now + ELIMINATE_SECONDS * MS_PER_SECOND,
  };
}

/** Runs the elimination phase's clock: end it, or move a dithering turn on. */
function tickEliminating(game: KrakelGame, now: number): KrakelGame {
  let result = game;
  if (game.excluded.length >= DECOY_COUNT) {
    result = {
      ...game,
      phase: "reveal",
      deadline: now + REVEAL_SECONDS * MS_PER_SECOND,
    };
  } else if (now >= game.deadline) {
    result = timeoutExclude(game, now);
  }
  return result;
}

/** Strikes a word for a player who let their turn run out. */
function timeoutExclude(game: KrakelGame, now: number): KrakelGame {
  const remaining = remainingWords(game);
  const random = createRandom(
    (roundSeed(game.seed, game.round) ^ game.excluded.length) >>> 0,
  );
  const word = remaining[randomInt(random, remaining.length)];
  return excludeWord(game, currentPickerId(game), word, now).game;
}

/** Ends the game, leaving the final team score in place. */
function endGame(game: KrakelGame): KrakelGame {
  return { ...game, phase: "over" };
}

/** Opens the next round: fresh terms, fresh squiggles, empty boards. */
function nextRound(game: KrakelGame, now: number): KrakelGame {
  const round = game.round + 1;
  // `used` already holds this round's candidates, so only the new ones join it.
  const deal = dealRound(
    game.seed,
    round,
    game.order,
    game.used,
    now,
    game.difficulty,
  );
  return {
    ...game,
    phase: "drawing",
    round,
    terms: deal.terms,
    boardIds: deal.boardIds,
    boards: emptyBoards(game.order),
    ready: [],
    deadline: deal.deadline,
    candidates: deal.candidates,
    excluded: [],
    roundScore: 0,
    used: [...game.used, ...deal.candidates],
  };
}
