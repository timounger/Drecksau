/**
 * The rules of moving: what Mister X and each detective may do, playing a
 * move, and how a round runs on and the game ends.
 *
 * @module
 */
import {
  ALL_TRANSPORTS,
  LAND_TRANSPORTS,
  neighbours,
  type LandTransport,
  type Transport,
} from "./map";
import {
  INTRO_HIDDEN_MOVES,
  REVEAL_MOVES,
  ROUNDS,
  type Detective,
  type LogEntry,
  type ScotlandYardGame,
  type ScotlandYardMove,
  type Ticket,
  type Tickets,
} from "./state";

/** One way to move: where to, and on which ticket. */
export type MoveOption = { readonly to: number; readonly ticket: Ticket };

/** One way to move a detective piece: where to, and by what. */
export type DetectiveOption = {
  readonly to: number;
  readonly ticket: Transport;
};

/**
 * The player whose move the table is waiting for.
 *
 * @param game - the game
 * @returns the player's index, or null once the game is over
 */
export function playerOnTurn(game: ScotlandYardGame): number | null {
  let player: number | null;
  switch (game.phase) {
    case "misterX":
      player = game.misterX.controller;
      break;
    case "detectives":
      player = game.detectives[pieceOnTurn(game) ?? -1]?.controller ?? null;
      break;
    default:
      player = null;
  }
  return player;
}

/**
 * The detective piece to move next.
 *
 * @param game - the game
 * @returns its index, or null outside the detectives' half of a round
 * @remarks
 * The box lets the detectives move in any order they agree on. Here they go
 * round in a fixed order instead, so every screen and the online table agree
 * on whose move it is without anybody having to claim it.
 */
export function pieceOnTurn(game: ScotlandYardGame): number | null {
  const next = game.moved.findIndex((done) => !done);
  return game.phase === "detectives" && next >= 0 ? next : null;
}

/**
 * Where Mister X may move from where he stands.
 *
 * @param game - the game, with his real position
 * @returns every legal destination with each ticket that gets him there
 */
export function misterXOptions(game: ScotlandYardGame): readonly MoveOption[] {
  const from = game.misterX.position;
  const options: MoveOption[] = [];
  if (from !== null) {
    const taken = occupied(game.detectives);
    const allowed = transportsFor(game);
    for (const transport of allowed) {
      const affordable =
        transport !== "ferry" &&
        (game.variant === "intro" ||
          game.supply[transport as LandTransport] > 0);
      for (const to of neighbours(from, transport)) {
        if (!taken.has(to) && affordable) {
          options.push({ to, ticket: transport as Ticket });
        }
      }
    }
    if (game.misterX.black > 0) {
      // The black ticket goes anywhere one ride away, the ferry included.
      const reach = new Set<number>();
      for (const transport of allowed) {
        for (const to of neighbours(from, transport)) {
          if (!taken.has(to)) {
            reach.add(to);
          }
        }
      }
      for (const to of [...reach].toSorted((one, other) => one - other)) {
        options.push({ to, ticket: "black" });
      }
    }
  }
  return options;
}

/**
 * Where a detective piece may move.
 *
 * @param game - the game
 * @param piece - the piece's index
 * @returns every free station one ride away it has a ticket for
 * @remarks
 * Mister X's station counts as free - moving onto it is how he is caught - so
 * this needs no knowledge of where he is, and gives none away.
 */
export function detectiveOptions(
  game: ScotlandYardGame,
  piece: number,
): readonly DetectiveOption[] {
  const detective = game.detectives[piece];
  const options: DetectiveOption[] = [];
  if (detective !== undefined) {
    const taken = occupied(game.detectives);
    for (const transport of LAND_TRANSPORTS) {
      const usable =
        (game.variant === "standard" || transport !== "underground") &&
        (detective.tickets === null || detective.tickets[transport] > 0);
      for (const to of neighbours(detective.position, transport)) {
        if (usable && !taken.has(to)) {
          options.push({ to, ticket: transport });
        }
      }
    }
  }
  return options;
}

/**
 * Plays a move.
 *
 * @param game - the game as it stands
 * @param player - who sends the move
 * @param move - the move
 * @returns the game after it, or null when the move is not allowed
 */
export function applyMove(
  game: ScotlandYardGame,
  player: number,
  move: ScotlandYardMove,
): ScotlandYardGame | null {
  let next: ScotlandYardGame | null = null;
  if (playerOnTurn(game) === player && !game.hidden) {
    next =
      move.kind === "misterX"
        ? moveMisterX(game, move.to, move.ticket, move.double)
        : moveDetective(game, move.piece, move.to, move.ticket);
  }
  return next === null ? null : settle(next);
}

/**
 * Runs the game on past everything that needs no decision.
 *
 * @param game - the game after a move
 * @returns the game at the next real decision, or over
 * @remarks
 * A detective who cannot move sits the turn out; when every piece has moved
 * the round ends, and the last round ending sets Mister X free. Mister X
 * having nowhere to go ends the game the other way.
 */
export function settle(game: ScotlandYardGame): ScotlandYardGame {
  let state = game;
  let guard = state.detectives.length * 2 + 2;
  while (state.phase !== "over" && guard > 0) {
    guard -= 1;
    if (state.phase === "misterX") {
      state =
        misterXOptions(state).length === 0
          ? endGame(state, "detectives", "cornered")
          : state;
      guard = state.phase === "misterX" ? 0 : guard;
    } else {
      state = advanceDetectives(state);
      guard = pieceOnTurn(state) === null ? guard : 0;
    }
  }
  return state;
}

/**
 * Whether a move of Mister X shows where he is.
 *
 * @param game - the game, before the move is logged
 * @param ticket - the ticket he moves on
 * @returns true when the detectives get to see the station
 */
export function isShownMove(game: ScotlandYardGame, ticket: Ticket): boolean {
  const number = game.log.length + 1;
  return game.variant === "standard"
    ? REVEAL_MOVES.includes(number)
    : !INTRO_HIDDEN_MOVES.includes(number) && ticket !== "black";
}

/**
 * Whether a double move can still be played this round.
 *
 * @param game - the game
 * @returns true at the start of Mister X's move with a double ticket left
 */
export function canDouble(game: ScotlandYardGame): boolean {
  return (
    game.phase === "misterX" &&
    !game.doubling &&
    !game.doubledThisRound &&
    game.misterX.double > 0
  );
}

/**
 * The transports Mister X may use in a variant.
 *
 * @param game - the game
 * @returns the land lines, without the Underground in the introductory game
 *   and with the ferry in the standard one
 */
export function transportsFor(game: ScotlandYardGame): readonly Transport[] {
  return game.variant === "standard"
    ? ALL_TRANSPORTS
    : LAND_TRANSPORTS.filter((transport) => transport !== "underground");
}

/** Moves Mister X, or returns null when the move is not his to make. */
function moveMisterX(
  game: ScotlandYardGame,
  to: number,
  ticket: Ticket,
  double: boolean,
): ScotlandYardGame | null {
  const legal =
    game.phase === "misterX" &&
    misterXOptions(game).some(
      (option) => option.to === to && option.ticket === ticket,
    ) &&
    (!double || canDouble(game));
  let next: ScotlandYardGame | null = null;
  if (legal) {
    const shown = isShownMove(game, ticket);
    const entry: LogEntry = {
      ticket: game.variant === "intro" && !shown ? null : ticket,
      station: to,
      shown,
      round: game.round,
      double,
    };
    const supply =
      game.variant === "standard" && ticket !== "black"
        ? { ...game.supply, [ticket]: game.supply[ticket] - 1 }
        : game.supply;
    const secondHalf = game.doubling;
    next = {
      ...game,
      misterX: {
        ...game.misterX,
        position: to,
        black: game.misterX.black - (ticket === "black" ? 1 : 0),
        double: game.misterX.double - (double ? 1 : 0),
      },
      log: [...game.log, entry],
      supply,
      doubling: double,
      doubledThisRound: game.doubledThisRound || double,
      // A double move keeps the turn for its second half.
      phase: double && !secondHalf ? "misterX" : "detectives",
    };
  }
  return next;
}

/** Moves a detective piece, or returns null when it may not go there. */
function moveDetective(
  game: ScotlandYardGame,
  piece: number,
  to: number,
  ticket: Transport,
): ScotlandYardGame | null {
  const detective = game.detectives[piece];
  const legal =
    detective !== undefined &&
    pieceOnTurn(game) === piece &&
    detectiveOptions(game, piece).some(
      (option) => option.to === to && option.ticket === ticket,
    );
  let next: ScotlandYardGame | null = null;
  if (legal && ticket !== "ferry") {
    const pays = detective.tickets !== null;
    const detectives = game.detectives.map((one, index) =>
      index === piece
        ? {
            ...one,
            position: to,
            tickets:
              one.tickets === null
                ? null
                : { ...one.tickets, [ticket]: one.tickets[ticket] - 1 },
          }
        : one,
    );
    next = {
      ...game,
      detectives,
      // A detective's ticket goes back to the supply Mister X draws from.
      supply:
        pays && game.variant === "standard"
          ? { ...game.supply, [ticket]: game.supply[ticket] + 1 }
          : game.supply,
      moved: game.moved.map((done, index) => done || index === piece),
      lastTo: game.lastTo.map((last, index) => (index === piece ? to : last)),
    };
    if (to === game.misterX.position) {
      next = { ...endGame(next, "detectives", "caught"), caughtBy: piece };
    }
  }
  return next;
}

/**
 * Skips the pieces that cannot move and ends the round once all have had
 * their turn.
 */
function advanceDetectives(game: ScotlandYardGame): ScotlandYardGame {
  let state = game;
  let next = pieceOnTurn(state);
  while (next !== null && detectiveOptions(state, next).length === 0) {
    const skipped = next;
    state = {
      ...state,
      moved: state.moved.map((done, index) => done || index === skipped),
    };
    next = pieceOnTurn(state);
  }
  if (next === null && state.phase === "detectives") {
    const anyMoved = state.lastTo.some((to) => to !== null);
    if (!anyMoved) {
      state = endGame(state, "misterX", "stuck");
    } else if (state.round >= ROUNDS[state.variant]) {
      state = endGame(state, "misterX", "escaped");
    } else {
      state = {
        ...state,
        round: state.round + 1,
        phase: "misterX",
        doubling: false,
        doubledThisRound: false,
        moved: state.detectives.map(() => false),
        lastTo: state.detectives.map(() => null),
      };
    }
  }
  return state;
}

/** Ends the game for one side. */
function endGame(
  game: ScotlandYardGame,
  winner: "misterX" | "detectives",
  reason: ScotlandYardGame["endReason"],
): ScotlandYardGame {
  return { ...game, phase: "over", winner, endReason: reason };
}

/** The stations a detective piece stands on. */
function occupied(detectives: readonly Detective[]): ReadonlySet<number> {
  return new Set(detectives.map((detective) => detective.position));
}

/** The land tickets a board holds, for the screens. */
export function ticketCount(
  tickets: Tickets | null,
  transport: Transport,
): number | null {
  return tickets === null || transport === "ferry" ? null : tickets[transport];
}
