/**
 * The Skyjo rules: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game, or null when the move is not allowed right now - so an online
 * host can hand a guest's move straight to it without checking anything first.
 */
import { GRID_COLUMNS, columnIndexes, shuffle } from "./cards";
import { createRandom } from "./random";
import { scoreRound } from "./scoring";
import { dealNextRound } from "./setup";
import {
  OPENING_FLIPS,
  isLayoutComplete,
  topOf,
  visibleValue,
  type Player,
  type SkyjoGame,
  type SkyjoMove,
  type Slot,
} from "./state";

/**
 * Whose turn it is.
 *
 * @param game - the current game
 * @returns the player index on turn, or null once the game is over
 * @remarks
 * Between rounds the seat that ended the last one is "on turn": it is theirs to
 * deal the next, and the turn-based online layer always needs exactly one seat
 * that may act.
 */
export function seatOnTurn(game: SkyjoGame): number | null {
  return game.phase === "gameOver" ? null : game.turn;
}

/**
 * Every move a seat may make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, empty if it is not their turn
 * @remarks
 * The user interface uses this to grey out what cannot be done, and the
 * computer player to pick from.
 */
export function legalMoves(
  game: SkyjoGame,
  seat: number,
): readonly SkyjoMove[] {
  let moves: SkyjoMove[] = [];
  if (seat === game.turn) {
    if (game.phase === "roundOver") {
      moves = [{ kind: "nextRound" }];
    } else if (game.phase === "flip") {
      moves = downIndexes(game.players[seat]).map((index) => ({
        kind: "flip",
        index,
      }));
    } else if (game.phase === "turn" && game.drawn === null) {
      moves = [{ kind: "draw" }];
      if (topOf(game.discard) !== null) {
        for (const index of placeableIndexes(game.players[seat])) {
          moves.push({ kind: "takeDiscard", index });
        }
      }
    } else if (game.phase === "turn") {
      for (const index of placeableIndexes(game.players[seat])) {
        moves.push({ kind: "swapDrawn", index });
      }
      for (const index of downIndexes(game.players[seat])) {
        moves.push({ kind: "discardDrawn", index });
      }
    }
  }
  return moves;
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
  game: SkyjoGame,
  seat: number,
  move: SkyjoMove,
): SkyjoGame | null {
  let next: SkyjoGame | null = null;
  if (seat !== game.turn || seat < 0 || seat >= game.players.length) {
    next = null;
  } else if (move.kind === "nextRound") {
    next = game.phase === "roundOver" ? dealNextRound(game) : null;
  } else if (game.phase === "flip" && move.kind === "flip") {
    next = openingFlip(game, seat, move.index);
  } else if (game.phase === "turn") {
    next = playTurn(game, seat, move);
  }
  return next;
}

/** The indexes a card may be put onto: anything not cleared. */
function placeableIndexes(player: Player): number[] {
  return indexesWhere(player, (slot) => slot.state !== "gone");
}

/** The indexes still lying face down. */
function downIndexes(player: Player): number[] {
  return indexesWhere(player, (slot) => slot.state === "down");
}

/** The grid indexes whose slot passes a test. */
function indexesWhere(
  player: Player,
  matches: (slot: Slot) => boolean,
): number[] {
  const found: number[] = [];
  player.grid.forEach((slot, index) => {
    if (matches(slot)) {
      found.push(index);
    }
  });
  return found;
}

/** Turns one card up during the opening, and moves on when the seat is done. */
function openingFlip(
  game: SkyjoGame,
  seat: number,
  index: number,
): SkyjoGame | null {
  let next: SkyjoGame | null = null;
  const player = game.players[seat];
  const alreadyUp = player.grid.filter((slot) => slot.state === "up").length;
  if (
    index >= 0 &&
    index < player.grid.length &&
    player.grid[index].state === "down" &&
    alreadyUp < OPENING_FLIPS
  ) {
    const grid = withSlot(player.grid, index, { state: "up" });
    const players = withPlayer(game.players, seat, { grid });
    const done = alreadyUp + 1 >= OPENING_FLIPS;
    next = {
      ...game,
      players,
      turn: done ? (seat + 1) % players.length : seat,
      log: [...game.log, `${player.name} deckt eine Karte auf.`],
    };
    next = openingDone(next) ? beginPlay(next) : next;
  }
  return next;
}

/** Whether every player has turned their opening cards up. */
function openingDone(game: SkyjoGame): boolean {
  return game.players.every(
    (player) =>
      player.grid.filter((slot) => slot.state === "up").length >= OPENING_FLIPS,
  );
}

/**
 * Starts the play after the opening.
 *
 * @remarks
 * The player showing the highest total opens, as the rules say. A tie goes to
 * whoever sits earlier, which only decides who starts and nothing else.
 */
function beginPlay(game: SkyjoGame): SkyjoGame {
  let best = 0;
  game.players.forEach((player, index) => {
    if (visibleValue(player) > visibleValue(game.players[best])) {
      best = index;
    }
  });
  return {
    ...game,
    phase: "turn",
    turn: best,
    log: [...game.log, `${game.players[best].name} beginnt.`],
  };
}

/** Plays one move of the normal turn phase. */
function playTurn(
  game: SkyjoGame,
  seat: number,
  move: SkyjoMove,
): SkyjoGame | null {
  let next: SkyjoGame | null = null;
  if (game.drawn === null && move.kind === "draw") {
    next = drawFromDeck(game);
  } else if (game.drawn === null && move.kind === "takeDiscard") {
    next = takeDiscard(game, seat, move.index);
  } else if (game.drawn !== null && move.kind === "swapDrawn") {
    next = swapDrawn(game, seat, move.index);
  } else if (game.drawn !== null && move.kind === "discardDrawn") {
    next = discardDrawn(game, seat, move.index);
  }
  return next;
}

/**
 * Takes the top card of the deck into the hand.
 *
 * @remarks
 * An empty deck is refilled from the discard pile, all but its top card, which
 * stays lying so there is always something to take instead.
 */
function drawFromDeck(game: SkyjoGame): SkyjoGame {
  const refilled = game.deck.length === 0 ? refillDeck(game) : game;
  const deck = [...refilled.deck];
  const drawn = deck.pop() ?? null;
  return drawn === null
    ? refilled
    : {
        ...refilled,
        deck,
        drawn,
        log: [...refilled.log, `${current(refilled).name} zieht verdeckt.`],
      };
}

/** Shuffles the discard pile back into the deck, keeping its top card. */
function refillDeck(game: SkyjoGame): SkyjoGame {
  const top = topOf(game.discard);
  const rest = game.discard.slice(0, -1);
  return top === null || rest.length === 0
    ? game
    : {
        ...game,
        deck: shuffle(createRandom(game.seed ^ game.round), rest),
        discard: [top],
        log: [...game.log, "Der Ablagestapel wird neu gemischt."],
      };
}

/** Swaps the top discard card into a slot. */
function takeDiscard(
  game: SkyjoGame,
  seat: number,
  index: number,
): SkyjoGame | null {
  const card = topOf(game.discard);
  let next: SkyjoGame | null = null;
  if (card !== null && canPlace(game.players[seat], index)) {
    const replaced = game.players[seat].grid[index].value;
    next = place(
      { ...game, discard: game.discard.slice(0, -1) },
      seat,
      index,
      card,
      replaced,
      `${game.players[seat].name} nimmt die ${card} vom Ablagestapel.`,
    );
  }
  return next;
}

/** Puts the drawn card into a slot. */
function swapDrawn(
  game: SkyjoGame,
  seat: number,
  index: number,
): SkyjoGame | null {
  const card = game.drawn;
  let next: SkyjoGame | null = null;
  if (card !== null && canPlace(game.players[seat], index)) {
    const replaced = game.players[seat].grid[index].value;
    next = place(
      { ...game, drawn: null },
      seat,
      index,
      card,
      replaced,
      `${game.players[seat].name} legt die ${card} ab.`,
    );
  }
  return next;
}

/** Throws the drawn card away and turns a face-down card up instead. */
function discardDrawn(
  game: SkyjoGame,
  seat: number,
  index: number,
): SkyjoGame | null {
  const card = game.drawn;
  const player = game.players[seat];
  let next: SkyjoGame | null = null;
  if (card !== null && index >= 0 && index < player.grid.length) {
    if (player.grid[index].state === "down") {
      const grid = withSlot(player.grid, index, { state: "up" });
      next = endTurn(
        {
          ...game,
          drawn: null,
          discard: [...game.discard, card],
          players: withPlayer(game.players, seat, { grid }),
          log: [
            ...game.log,
            `${player.name} wirft die ${card} weg und deckt auf.`,
          ],
        },
        seat,
      );
    }
  }
  return next;
}

/** Whether a slot can take a card. */
function canPlace(player: Player, index: number): boolean {
  return (
    index >= 0 &&
    index < player.grid.length &&
    player.grid[index].state !== "gone"
  );
}

/** Puts a card face up into a slot and sends the replaced card to the pile. */
function place(
  game: SkyjoGame,
  seat: number,
  index: number,
  card: number,
  replaced: number,
  note: string,
): SkyjoGame {
  const grid = withSlot(game.players[seat].grid, index, {
    state: "up",
    value: card,
  });
  return endTurn(
    {
      ...game,
      players: withPlayer(game.players, seat, { grid }),
      discard: [...game.discard, replaced],
      log: [...game.log, note],
    },
    seat,
  );
}

/**
 * Closes a turn: clears a full column, notes a finished layout, moves on.
 *
 * @remarks
 * The round does not end the moment somebody turns their last card up - every
 * other player gets one more turn. That is why the round is only scored when
 * the turn comes back round to whoever finished.
 */
function endTurn(game: SkyjoGame, seat: number): SkyjoGame {
  const cleared = clearColumns(game, seat);
  const finished =
    cleared.endedBy === null && isLayoutComplete(cleared.players[seat])
      ? {
          ...cleared,
          endedBy: seat,
          log: [
            ...cleared.log,
            `${cleared.players[seat].name} ist fertig - letzte Runde!`,
          ],
        }
      : cleared;
  const turn = (seat + 1) % finished.players.length;
  const next = { ...finished, turn };
  return finished.endedBy !== null && turn === finished.endedBy
    ? scoreRound(next)
    : next;
}

/** Clears every column of a layout whose three cards match. */
function clearColumns(game: SkyjoGame, seat: number): SkyjoGame {
  let grid = game.players[seat].grid;
  let discard = game.discard;
  let log = game.log;
  for (let column = 0; column < GRID_COLUMNS; column++) {
    const indexes = columnIndexes(column);
    const slots = indexes.map((index) => grid[index]);
    const matches =
      slots.every((slot) => slot.state === "up") &&
      slots.every((slot) => slot.value === slots[0].value);
    if (matches) {
      // The three cards leave the game on the discard pile.
      discard = [...discard, ...slots.map((slot) => slot.value)];
      for (const index of indexes) {
        grid = withSlot(grid, index, { state: "gone" });
      }
      log = [
        ...log,
        `${game.players[seat].name} raeumt eine Spalte mit ${slots[0].value} ab.`,
      ];
    }
  }
  return {
    ...game,
    players: withPlayer(game.players, seat, { grid }),
    discard,
    log,
  };
}

/** The player whose turn it is. */
function current(game: SkyjoGame): Player {
  return game.players[game.turn];
}

/** A grid with one slot changed. */
function withSlot(
  grid: readonly Slot[],
  index: number,
  change: Partial<Slot>,
): readonly Slot[] {
  return grid.map((slot, at) => (at === index ? { ...slot, ...change } : slot));
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
