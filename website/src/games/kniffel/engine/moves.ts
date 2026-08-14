/**
 * The rules of Kniffel: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game or null when the move is not allowed right now, so an online
 * host can hand a guest's move straight to it without checking anything first.
 *
 * The first throw of a turn is not a move. Nobody chooses to make it - it is
 * what a turn *is* - so the referee makes it when the dice change hands, and
 * the player is asked only about the two that follow.
 */
import { createRandom, type Random } from "./random";
import {
  DICE_COUNT,
  DIE_FACES,
  ROLLS_PER_TURN,
  bonusOf,
  freeBoxes,
  isFinished,
  scoreOf,
  sheetTotal,
  type Category,
  type KniffelGame,
  type KniffelMove,
  type Player,
  type Sheet,
} from "./state";

/**
 * Whose turn it is.
 *
 * @param game - the current game
 * @returns the active seat, or null once every box is filled
 */
export function seatOnTurn(game: KniffelGame): number | null {
  return game.phase === "gameOver" ? null : game.active;
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
  game: KniffelGame,
  seat: number,
  move: KniffelMove,
): KniffelGame | null {
  let next: KniffelGame | null = null;
  if (seat === game.active && game.phase === "turn") {
    switch (move.kind) {
      case "hold":
        next = toggleHold(game, move.index);
        break;
      case "roll":
        next = game.rollsLeft > 0 ? throwAgain(game) : null;
        break;
      case "enter":
        next = writeDown(game, move.category);
        break;
    }
  }
  return next;
}

/**
 * Keeps a die back, or lets it go again.
 *
 * @remarks
 * Only while there is a throw left to make. Once the third throw is spent the
 * dice are what they are, and a sheet that still let you fiddle with them
 * would be telling a comfortable lie.
 */
function toggleHold(game: KniffelGame, index: number): KniffelGame | null {
  return index >= 0 && index < DICE_COUNT && game.rollsLeft > 0
    ? {
        ...game,
        held: game.held.map((keep, at) => (at === index ? !keep : keep)),
      }
    : null;
}

/** Throws everything that is not being kept. */
function throwAgain(game: KniffelGame): KniffelGame {
  const random = createRandom(game.rng);
  const dice = game.dice.map((die, index) =>
    game.held[index] ? die : face(random),
  );
  return {
    ...game,
    dice,
    rollsLeft: game.rollsLeft - 1,
    rng: random.state(),
    log: [
      ...game.log,
      `${game.players[game.active].name} würfelt: ${dice.join(" ")}.`,
    ],
  };
}

/**
 * Writes the roll into a box and hands the dice on.
 *
 * @remarks
 * Any free box will take it, including one it scores nothing in - that is not
 * a mistake to be prevented but the decision the game is made of. What the
 * referee will not allow is writing into a box that is already used.
 */
function writeDown(game: KniffelGame, category: Category): KniffelGame | null {
  const player = game.players[game.active];
  let next: KniffelGame | null = null;
  if (player.sheet[category] === null) {
    const points = scoreOf(game.dice, category);
    const sheet: Sheet = { ...player.sheet, [category]: points };
    const before = bonusOf(player.sheet);
    const written: KniffelGame = {
      ...game,
      players: withPlayer(game.players, game.active, { sheet }),
      log: [
        ...game.log,
        `${player.name} schreibt ${points} in ${category}.`,
        ...(bonusOf(sheet) > before
          ? [`${player.name} bekommt den Bonus von ${bonusOf(sheet)}.`]
          : []),
      ],
    };
    next = endTurn(written);
  }
  return next;
}

/** Hands the dice to the next player, or ends the game. */
function endTurn(game: KniffelGame): KniffelGame {
  const next = (game.active + 1) % game.players.length;
  return isFinished(game)
    ? {
        ...game,
        phase: "gameOver",
        log: [...game.log, `Alle Felder voll. ${best(game)}`],
      }
    : startTurn(
        { ...game, round: next === 0 ? game.round + 1 : game.round },
        next,
      );
}

/** The one line that says how it ended. */
function best(game: KniffelGame): string {
  const totals = game.players.map(
    (player) => `${player.name} ${sheetTotal(player.sheet)}`,
  );
  return totals.join(", ");
}

/**
 * Hands the dice to a seat and makes the first throw.
 *
 * @param game - the game as it stands
 * @param active - whose turn it is now
 * @returns the game with five dice on the table and two throws left
 */
export function startTurn(game: KniffelGame, active: number): KniffelGame {
  const random = createRandom(game.rng);
  const dice = Array.from({ length: DICE_COUNT }, () => face(random));
  return {
    ...game,
    phase: "turn",
    active,
    dice,
    held: dice.map(() => false),
    rollsLeft: ROLLS_PER_TURN - 1,
    rng: random.state(),
    log: [
      ...game.log,
      `${game.players[active].name} würfelt: ${dice.join(" ")}.`,
    ],
  };
}

/** One die. */
function face(random: Random): number {
  return 1 + Math.floor(random.next() * DIE_FACES);
}

/**
 * Every move the active player could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 */
export function legalMoves(
  game: KniffelGame,
  seat: number,
): readonly KniffelMove[] {
  const moves: KniffelMove[] = [];
  if (seat === game.active && game.phase === "turn") {
    if (game.rollsLeft > 0) {
      moves.push({ kind: "roll" });
      for (let index = 0; index < DICE_COUNT; index++) {
        moves.push({ kind: "hold", index });
      }
    }
    for (const category of freeBoxes(game.players[seat].sheet)) {
      moves.push({ kind: "enter", category });
    }
  }
  return moves;
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
