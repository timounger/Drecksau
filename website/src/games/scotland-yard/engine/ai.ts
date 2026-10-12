/**
 * The computer at the table: Mister X running, and the detectives closing in.
 *
 * @module
 * @remarks
 * **The computer's detectives do not cheat.** Before they choose, the game is
 * passed through {@link redact}, so they never see more than a player at the
 * table: the travel log, the tickets on it and where Mister X last showed
 * himself. From that they work out every station he can be at
 * ({@link hidingPlaces}) and close in on those - nearest first, and onto one
 * of them when they can, because that is how he is caught.
 *
 * Mister X looks one move ahead. He keeps away from the stations the
 * detectives can reach next, likes stations with many ways out, and keeps
 * the detectives guessing: a move that leaves them many places to search
 * scores better than one that gives him away. He spends a black ticket where
 * it hides most - just after showing himself, or on the ferry - and a double
 * move when a detective is about to catch him.
 */
import { distance, neighbours, LAND_TRANSPORTS } from "./map";
import {
  canDouble,
  detectiveOptions,
  isShownMove,
  misterXOptions,
  pieceOnTurn,
  type MoveOption,
} from "./moves";
import {
  REVEAL_MOVES,
  ROUNDS,
  type ScotlandYardGame,
  type ScotlandYardMove,
} from "./state";
import { hidingPlaces, redact } from "./view";

/** How long the computer seems to think before a move, in ms. */
const BOT_WAIT_MS = 700;

/** Distances beyond this count as "far enough" - no better for being further. */
const SAFE_DISTANCE = 4;

/** What one step of distance from the nearest detective is worth to Mister X. */
const DANGER_WEIGHT = 10;

/** What each way out of a station is worth to Mister X. */
const EXIT_WEIGHT = 0.6;

/** What each extra hiding place in the detectives' eyes is worth to Mister X. */
const DOUBT_WEIGHT = 0.15;

/** Hiding places beyond this many make no difference any more. */
const DOUBT_CAP = 40;

/** What a black ticket costs to spend, before its uses are counted. */
const BLACK_COST = 3;

/** The most a little chance adds to a score, so equal moves are not always the same. */
const JITTER = 0.8;

/** What the nearest hiding place weighs for a detective, against the average. */
const NEAREST_WEIGHT = 3;

/** A bonus for a detective moving onto a station Mister X can be at. */
const ON_TARGET_BONUS = 4;

/** What spending a scarce ticket costs a detective, scaled by how few are left. */
const SCARCITY_WEIGHT = 2;

/**
 * The computer's move for whoever is on turn.
 *
 * @param game - the full game; a detective only ever reads the redacted copy
 * @returns the move, or null when nobody is to move
 */
export function aiMove(game: ScotlandYardGame): ScotlandYardMove | null {
  let move: ScotlandYardMove | null = null;
  if (game.phase === "misterX" && !game.hidden) {
    move = misterXMove(game);
  } else if (game.phase === "detectives") {
    move = detectiveMove(redact(game));
  }
  return move;
}

/**
 * How long the computer waits before moving.
 *
 * @returns the pause in ms
 */
export function botWaitMs(): number {
  return BOT_WAIT_MS;
}

/** Mister X's choice, from the full game. */
function misterXMove(game: ScotlandYardGame): ScotlandYardMove | null {
  const options = misterXOptions(game);
  const scored = options.map((option) => ({
    option,
    score: scoreEscape(game, option) + Math.random() * JITTER,
  }));
  const best = scored.reduce<(typeof scored)[number] | null>(
    (top, one) => (top === null || one.score > top.score ? one : top),
    null,
  );
  let move: ScotlandYardMove | null = null;
  if (best !== null) {
    // In danger and a double left: go now and move again before they can.
    const danger = nearestHunter(game, best.option.to);
    const double =
      canDouble(game) &&
      (danger <= 1 || (justShown(game) && danger <= 2)) &&
      game.round < ROUNDS[game.variant];
    move = {
      kind: "misterX",
      to: best.option.to,
      ticket: best.option.ticket,
      double,
    };
  }
  return move;
}

/** How good a move is for Mister X. */
function scoreEscape(game: ScotlandYardGame, option: MoveOption): number {
  const danger = Math.min(nearestHunter(game, option.to), SAFE_DISTANCE);
  const exits = LAND_TRANSPORTS.reduce(
    (count, transport) => count + neighbours(option.to, transport).length,
    0,
  );
  const shown = isShownMove(game, option.ticket);
  // How many places the detectives would have to search after this move.
  const after = hidingPlaces(redact(withMove(game, option, shown)));
  const doubt = shown ? 0 : Math.min(after.length, DOUBT_CAP);
  let score =
    danger * DANGER_WEIGHT + exits * EXIT_WEIGHT + doubt * DOUBT_WEIGHT;
  if (option.ticket === "black") {
    const worth =
      justShown(game) || neighbours(option.to, "ferry").length > 0
        ? 0
        : BLACK_COST;
    // Black tickets left over at the end are wasted - spend them more freely late.
    const left = ROUNDS[game.variant] - game.round;
    score -= left < game.misterX.black * 2 ? worth / 2 : worth;
    score -= shown ? BLACK_COST : 0;
  }
  return score;
}

/** The game as it would be after Mister X takes an option - for scoring only. */
function withMove(
  game: ScotlandYardGame,
  option: MoveOption,
  shown: boolean,
): ScotlandYardGame {
  return {
    ...game,
    misterX: { ...game.misterX, position: option.to },
    log: [
      ...game.log,
      {
        ticket: game.variant === "intro" && !shown ? null : option.ticket,
        station: option.to,
        shown,
        round: game.round,
        double: false,
      },
    ],
  };
}

/** Whether Mister X has just shown himself, so the detectives know where he was. */
function justShown(game: ScotlandYardGame): boolean {
  return (
    game.log.at(-1)?.shown === true ||
    REVEAL_MOVES.includes(game.log.length + 1)
  );
}

/** How many moves the nearest detective piece is from a station. */
function nearestHunter(game: ScotlandYardGame, station: number): number {
  return game.detectives.reduce(
    (nearest, piece) => Math.min(nearest, distance(piece.position, station)),
    Number.POSITIVE_INFINITY,
  );
}

/** A detective piece's choice, from the redacted game. */
function detectiveMove(view: ScotlandYardGame): ScotlandYardMove | null {
  const piece = pieceOnTurn(view);
  let move: ScotlandYardMove | null = null;
  if (piece !== null) {
    const places = hidingPlaces(view);
    const targets =
      places.length > 0 ? places : view.detectives.map((one) => one.position);
    const detective = view.detectives[piece];
    let best: {
      readonly score: number;
      readonly to: number;
      readonly ticket: "taxi" | "bus" | "underground";
    } | null = null;
    for (const option of detectiveOptions(view, piece)) {
      if (option.ticket === "ferry") {
        continue;
      }
      const nearest = targets.reduce(
        (low, target) => Math.min(low, distance(option.to, target)),
        Number.POSITIVE_INFINITY,
      );
      const average =
        targets.reduce((sum, target) => sum + distance(option.to, target), 0) /
        targets.length;
      const left = detective?.tickets?.[option.ticket] ?? null;
      const scarcity = left === null ? 0 : SCARCITY_WEIGHT / Math.max(left, 1);
      const onTarget = places.includes(option.to) ? ON_TARGET_BONUS : 0;
      const score =
        -(nearest * NEAREST_WEIGHT + average) -
        scarcity +
        onTarget +
        Math.random() * JITTER;
      if (best === null || score > best.score) {
        best = { score, to: option.to, ticket: option.ticket };
      }
    }
    move =
      best === null
        ? null
        : { kind: "detective", piece, to: best.to, ticket: best.ticket };
  }
  return move;
}
