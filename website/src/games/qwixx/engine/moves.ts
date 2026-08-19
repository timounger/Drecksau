/**
 * The rules of Qwixx: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game or null when the move is not allowed right now, so an online
 * host can hand a guest's move straight to it without checking anything first.
 *
 * A turn has two steps and they belong to different people. The **white** step
 * is everybody's: each player takes the sum of the two white dice or lets it
 * go, in whatever order they get round to it. The **colour** step belongs to
 * the active player alone. Only they can be punished for doing nothing, which
 * is why the penalty is checked at the end of the second step and not the
 * first.
 */
import { createRandom, type Random } from "./random";
import {
  CROSSES_BEFORE_LOCK,
  DIE_FACES,
  LOCK_AT,
  ROWS,
  canCross,
  isOver,
  lastCross,
  numberAt,
  placeOf,
  whiteSum,
  type Dice,
  type Player,
  type QwixxGame,
  type QwixxMove,
  type Row,
  type Sheet,
} from "./state";

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat holding things up, or null once the game is over
 * @remarks
 * Public knowledge, exactly as at a real table. In the colour step that is the
 * active player, who rolled and must answer alone.
 *
 * The white step is the awkward one, because it is not a turn: **everybody**
 * answers, in no particular order, and the step ends when the last of them has.
 * So the seat named here is the first one that still owes an answer. Naming the
 * active player instead would be true to the turn but useless to the online
 * layer, which asks this question for one reason - whom to hurry along, and
 * whom to play for when they never answer. A player who has already decided
 * cannot be hurried, and a step that waits on somebody nobody is watching is a
 * game that stops.
 */
export function seatOnTurn(game: QwixxGame): number | null {
  let seat: number | null = null;
  if (game.phase !== "gameOver") {
    const owing = game.decided.findIndex((done) => !done);
    seat = game.phase === "white" && owing >= 0 ? owing : game.active;
  }
  return seat;
}

/**
 * Plays a move as the referee.
 *
 * @param game - the current game
 * @param seat - the player making the move
 * @param move - what they want to do
 * @returns the game after the move, or null if it was not allowed
 */
export function applyMove(
  game: QwixxGame,
  seat: number,
  move: QwixxMove,
): QwixxGame | null {
  let next: QwixxGame | null = null;
  if (seat >= 0 && seat < game.players.length) {
    if (game.phase === "white") {
      next = whiteStep(game, seat, move);
    } else if (game.phase === "colour" && seat === game.active) {
      next = colourStep(game, move);
    }
  }
  return next;
}

/**
 * The white dice, which belong to the whole table.
 *
 * @remarks
 * One answer per seat and no going back. The order does not matter - at a real
 * table everybody marks their own sheet at once - so the step is over when the
 * last person has answered rather than when a particular one has.
 */
function whiteStep(
  game: QwixxGame,
  seat: number,
  move: QwixxMove,
): QwixxGame | null {
  let next: QwixxGame | null = null;
  if (!game.decided[seat]) {
    const decided = game.decided.map((done, at) => (at === seat ? true : done));
    if (move.kind === "pass") {
      next = { ...game, decided };
    } else if (move.kind === "white") {
      const place = placeOf(move.row, whiteSum(game.dice));
      if (canCross(game.players[seat].sheet, move.row, place, game.locked)) {
        next = {
          ...cross(game, seat, move.row, place),
          decided,
          activeCrossed: game.activeCrossed || seat === game.active,
        };
      }
    }
    next = next === null ? null : afterWhite(next);
  }
  return next;
}

/** Moves on to the colour step once everybody has answered the white dice. */
function afterWhite(game: QwixxGame): QwixxGame {
  return game.decided.every((done) => done)
    ? { ...game, phase: "colour" }
    : game;
}

/**
 * The colour step, which belongs to the active player alone.
 *
 * @remarks
 * One white die plus one colour die, crossed in that colour's row. Passing
 * here is allowed - but a player who has now done nothing at all this turn
 * takes a penalty for it, and that is the whole tension of a bad roll.
 */
function colourStep(game: QwixxGame, move: QwixxMove): QwixxGame | null {
  const seat = game.active;
  let next: QwixxGame | null = null;
  if (move.kind === "pass") {
    next = game.activeCrossed ? game : takePenalty(game, seat);
  } else if (move.kind === "colour") {
    const die = game.dice.colours[move.row];
    const white = game.dice.white[move.white];
    if (die !== null && white !== undefined) {
      const place = placeOf(move.row, die + white);
      if (canCross(game.players[seat].sheet, move.row, place, game.locked)) {
        next = cross(game, seat, move.row, place);
      }
    }
  }
  return next === null ? null : endTurn(next);
}

/**
 * Marks one cross, and shuts the row if it was the last place.
 *
 * @remarks
 * A lock is not private: the die leaves the table, so nobody can take that
 * colour again - including players who never got near the end of the row.
 */
function cross(
  game: QwixxGame,
  seat: number,
  row: Row,
  place: number,
): QwixxGame {
  const player = game.players[seat];
  const sheet: Sheet = {
    ...player.sheet,
    crosses: {
      ...player.sheet.crosses,
      [row]: [...player.sheet.crosses[row], place],
    },
  };
  const shuts = place === LOCK_AT;
  return {
    ...game,
    players: withPlayer(game.players, seat, { sheet }),
    locked: shuts ? { ...game.locked, [row]: true } : game.locked,
    dice: shuts
      ? { ...game.dice, colours: { ...game.dice.colours, [row]: null } }
      : game.dice,
    log: [
      ...game.log,
      `${player.name} streicht ${numberAt(row, place)} in ${row}${shuts ? " und schließt die Reihe" : ""}.`,
    ],
  };
}

/** Books a penalty on the active player. */
function takePenalty(game: QwixxGame, seat: number): QwixxGame {
  const player = game.players[seat];
  return {
    ...game,
    players: withPlayer(game.players, seat, {
      sheet: { ...player.sheet, penalties: player.sheet.penalties + 1 },
    }),
    log: [...game.log, `${player.name} muss einen Fehlwurf nehmen.`],
  };
}

/**
 * Closes a turn: either the game is out, or the next player rolls.
 *
 * @remarks
 * Both endings are checked here and nowhere else - two shut rows or a fourth
 * penalty, whichever came of the turn just played.
 */
function endTurn(game: QwixxGame): QwixxGame {
  return isOver(game)
    ? { ...game, phase: "gameOver", log: [...game.log, "Das Spiel ist aus."] }
    : startTurn(game, (game.active + 1) % game.players.length);
}

/**
 * Hands the dice to a seat and rolls them.
 *
 * @param game - the game as it stands
 * @param active - who rolls
 * @returns the game waiting on the white dice
 * @remarks
 * The roll is not a decision, so it is not a move: taking the dice and
 * throwing them is one thing, and a screen that asked you to press "roll"
 * first would be asking about nothing.
 */
export function startTurn(game: QwixxGame, active: number): QwixxGame {
  const random = createRandom(game.rng);
  const dice = roll(random, game.locked);
  return {
    ...game,
    phase: "white",
    active,
    dice,
    decided: game.players.map(() => false),
    activeCrossed: false,
    rng: random.state(),
    log: [
      ...game.log,
      `${game.players[active].name} würfelt: ${dice.white.join(" + ")} weiß.`,
    ],
  };
}

/** Throws every die still on the table. */
function roll(random: Random, locked: Readonly<Record<Row, boolean>>): Dice {
  const face = () => 1 + Math.floor(random.next() * DIE_FACES);
  const colours = {} as Record<Row, number | null>;
  for (const row of ROWS) {
    colours[row] = locked[row] ? null : face();
  }
  return { white: [face(), face()], colours };
}

/**
 * Every move a seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 */
export function legalMoves(
  game: QwixxGame,
  seat: number,
): readonly QwixxMove[] {
  const moves: QwixxMove[] = [];
  const sheet = game.players[seat]?.sheet;
  if (sheet !== undefined && game.phase !== "gameOver") {
    if (game.phase === "white" && !game.decided[seat]) {
      for (const row of ROWS) {
        const place = placeOf(row, whiteSum(game.dice));
        if (canCross(sheet, row, place, game.locked)) {
          moves.push({ kind: "white", row });
        }
      }
      moves.push({ kind: "pass" });
    } else if (game.phase === "colour" && seat === game.active) {
      for (const row of ROWS) {
        const die = game.dice.colours[row];
        game.dice.white.forEach((white, index) => {
          const place = die === null ? -1 : placeOf(row, die + white);
          if (die !== null && canCross(sheet, row, place, game.locked)) {
            moves.push({ kind: "colour", row, white: index });
          }
        });
      }
      moves.push({ kind: "pass" });
    }
  }
  return moves;
}

/**
 * How many numbers a cross would burn.
 *
 * @param sheet - the player's sheet
 * @param row - the row
 * @param place - where they would cross
 * @returns how many places between the last cross and this one are given up
 * @remarks
 * The one number worth thinking about in this game. Taking the 9 in a row that
 * stands at 4 does not cost you the 9 - it costs you the 5, 6, 7 and 8, and
 * they are gone for the rest of the game.
 */
export function skipped(sheet: Sheet, row: Row, place: number): number {
  return Math.max(0, place - lastCross(sheet, row) - 1);
}

/** How many crosses a row still needs before its lock may be taken. */
export function untilLock(sheet: Sheet, row: Row): number {
  return Math.max(0, CROSSES_BEFORE_LOCK - sheet.crosses[row].length);
}

/** A player list with one player changed. */
function withPlayer(
  players: readonly Player[],
  index: number,
  change: Partial<Player>,
): readonly Player[] {
  return players.map((player, at) =>
    at === index ? { ...player, ...change } : player,
  );
}
