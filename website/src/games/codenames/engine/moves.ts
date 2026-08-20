/**
 * The rules: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure and {@link applyMove} is the one referee: it
 * returns the new game, or null when the move is not allowed right now. An
 * online host can hand a guest's move straight to it without checking anything
 * first, which is why nothing else in the game is allowed to change state.
 *
 * Almost every rule in Codenames is a rule about **people** - keep a straight
 * face, do not point, no extra hints - and a referee cannot enforce any of
 * those. What it can enforce is the handful the rulebook itself calls firm, and
 * exactly one of those is mechanical: a clue may not be a word still lying face
 * up on the table. That one is checked here. The rest stays where the rulebook
 * leaves it: "if no one notices that a clue is invalid, it counts as valid."
 */
import {
  BOARD_SIZE,
  MAX_CLUE,
  TEAM_NAMES,
  agentsLeft,
  other,
  seatsOf,
  type Card,
  type CodenamesGame,
  type CodenamesMove,
  type Team,
} from "./state";
import type { Tag } from "./words";

/**
 * Who the table is waiting for.
 *
 * @param game - the current game
 * @returns the seat that has to act, or null once the game is over
 * @remarks
 * Guessing belongs to a whole team rather than to one person, so the seat named
 * during a guess is the **first** operative of the side on turn. It is a name
 * for the clock to shout at, not a permission: {@link applyMove} accepts a
 * guess from any operative of that side, the way a real table accepts whoever
 * reaches out first.
 */
export function seatOnTurn(game: CodenamesGame): number | null {
  const role = game.phase === "clue" ? "spymaster" : "operative";
  const waiting = seatsOf(game, game.turn, role);
  return game.phase === "gameOver" ? null : (waiting[0] ?? null);
}

/**
 * Whether a clue may be given as it stands.
 *
 * @param game - the current game
 * @param word - the clue
 * @returns true if the referee would let it through
 * @remarks
 * The one firm rule that can be checked without a human in the room: "Your clue
 * cannot be any of the codenames visible on the table." Covered words do not
 * count - the rulebook says so, and a clue that was illegal earlier becomes
 * legal later.
 */
export function isCluePlayable(game: CodenamesGame, word: string): boolean {
  const clean = word.trim();
  return (
    clean.length > 0 &&
    !/\s/.test(clean) &&
    !game.board.some(
      (card) =>
        !card.revealed && card.word.toLowerCase() === clean.toLowerCase(),
    )
  );
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
  game: CodenamesGame,
  seat: number,
  move: CodenamesMove,
): CodenamesGame | null {
  let next: CodenamesGame | null = null;
  if (seat >= 0 && seat < game.seats.length && game.phase !== "gameOver") {
    switch (move.kind) {
      case "clue":
        next = giveClue(game, seat, move.word, move.count, move.tag);
        break;
      case "guess":
        next = guessAt(game, seat, move.at);
        break;
      case "stop":
        next = stopGuessing(game, seat);
        break;
    }
  }
  return next;
}

/**
 * The spymaster says a word and a number.
 *
 * @remarks
 * The number becomes a budget of **number + 1** guesses - the extra one is for
 * a word left over from an earlier clue. Zero is the exception the rulebook
 * calls an expert clue: it means "none of ours", the limit falls away
 * altogether, and the team may go on guessing as long as it dares.
 */
function giveClue(
  game: CodenamesGame,
  seat: number,
  word: string,
  count: number,
  tag: Tag | undefined,
): CodenamesGame | null {
  const player = game.seats[seat];
  const clean = word.trim();
  let next: CodenamesGame | null = null;
  if (
    game.phase === "clue" &&
    player.team === game.turn &&
    player.role === "spymaster" &&
    Number.isInteger(count) &&
    count >= 0 &&
    count <= MAX_CLUE &&
    isCluePlayable(game, clean)
  ) {
    next = note(
      {
        ...game,
        phase: "guess",
        clue: {
          word: clean,
          count,
          tag: tag ?? null,
          guessesLeft: count === 0 ? null : count + 1,
          guessesMade: 0,
        },
      },
      `${TEAM_NAMES[game.turn]}: ${clean} - ${count === 0 ? "unbegrenzt" : count}`,
    );
  }
  return next;
}

/**
 * Somebody touches a word.
 *
 * @remarks
 * Four outcomes and only one of them lets the team carry on. The assassin does
 * not merely end the turn - it ends the game, for the side that reached out.
 */
function guessAt(
  game: CodenamesGame,
  seat: number,
  at: number,
): CodenamesGame | null {
  const player = game.seats[seat];
  const clue = game.clue;
  const card = game.board[at];
  let next: CodenamesGame | null = null;
  if (
    game.phase === "guess" &&
    clue !== null &&
    player.team === game.turn &&
    player.role === "operative" &&
    Number.isInteger(at) &&
    at >= 0 &&
    at < BOARD_SIZE &&
    card !== undefined &&
    !card.revealed
  ) {
    const turned = note(
      {
        ...game,
        board: game.board.map((entry, index) =>
          index === at ? { ...entry, revealed: true } : entry,
        ),
        clue: {
          ...clue,
          guessesMade: clue.guessesMade + 1,
          guessesLeft: clue.guessesLeft === null ? null : clue.guessesLeft - 1,
        },
      },
      `${TEAM_NAMES[game.turn]} tippt auf ${card.word} - ${describe(card.owner)}.`,
    );
    next = settle(turned, card.owner);
  }
  return next;
}

/** What a revealed card turns out to be, for the log. */
function describe(owner: Card["owner"]): string {
  let text: string;
  if (owner === "assassin") {
    text = "der Attentäter";
  } else if (owner === "bystander") {
    text = "unbeteiligt";
  } else if (owner === null) {
    text = "?";
  } else {
    text = `Agent ${TEAM_NAMES[owner]}`;
  }
  return text;
}

/**
 * What the table does with the card that was just turned over.
 *
 * @remarks
 * Whether either side has finished is asked **before** anything else, because
 * the rulebook allows the one thing that sounds impossible: "It is possible to
 * win on the other team's turn if they guess your last word."
 */
function settle(game: CodenamesGame, owner: Card["owner"]): CodenamesGame {
  let next: CodenamesGame;
  if (owner === "assassin") {
    next = finish(game, other(game.turn), true);
  } else if (agentsLeft(game, "red") === 0) {
    next = finish(game, "red", false);
  } else if (agentsLeft(game, "blue") === 0) {
    next = finish(game, "blue", false);
  } else if (owner === game.turn) {
    // Right so far. Carry on, unless the budget for this clue has run out.
    next =
      game.clue?.guessesLeft === 0 ? handOver(game, "Keine Tipps mehr.") : game;
  } else {
    next = handOver(game, "Daneben - Zug vorbei.");
  }
  return next;
}

/** A team stops guessing of its own accord. */
function stopGuessing(game: CodenamesGame, seat: number): CodenamesGame | null {
  const player = game.seats[seat];
  // "The field operatives must always make at least one guess." So stopping is
  // a decision that can only be taken after the first card has been touched.
  return game.phase === "guess" &&
    player.team === game.turn &&
    player.role === "operative" &&
    (game.clue?.guessesMade ?? 0) > 0
    ? handOver(game, `${TEAM_NAMES[game.turn]} hört auf.`)
    : null;
}

/** Hands the turn to the other side. */
function handOver(game: CodenamesGame, line: string): CodenamesGame {
  return note(
    { ...game, phase: "clue", turn: other(game.turn), clue: null },
    line,
  );
}

/** Ends the game. */
function finish(
  game: CodenamesGame,
  winner: Team,
  byAssassin: boolean,
): CodenamesGame {
  return note(
    { ...game, phase: "gameOver", winner, byAssassin, clue: null },
    byAssassin
      ? `Der Attentäter! ${TEAM_NAMES[other(winner)]} verliert sofort.`
      : `${TEAM_NAMES[winner]} hat alle Agenten - gewonnen!`,
  );
}

/** Adds a line to the log. */
function note(game: CodenamesGame, line: string): CodenamesGame {
  return { ...game, log: [...game.log, line] };
}

/**
 * Every move a seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 * @remarks
 * The clues are left out on purpose: a clue is a word somebody thinks of, and
 * the list of words there are is not a list this function can write. What it
 * does say is whether a clue is owed at all.
 */
export function legalMoves(
  game: CodenamesGame,
  seat: number,
): readonly CodenamesMove[] {
  const moves: CodenamesMove[] = [];
  const player = game.seats[seat];
  if (player !== undefined && player.team === game.turn) {
    if (game.phase === "guess" && player.role === "operative") {
      game.board.forEach((card, at) => {
        if (!card.revealed) {
          moves.push({ kind: "guess", at });
        }
      });
      if ((game.clue?.guessesMade ?? 0) > 0) {
        moves.push({ kind: "stop" });
      }
    }
  }
  return moves;
}
