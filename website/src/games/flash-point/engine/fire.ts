/**
 * What the fire does when it is its turn.
 *
 * @module
 * @remarks
 * Three things happen in order, and the order is the rulebook's: the roll puts
 * smoke somewhere, whatever that sets off is resolved, and only then does the
 * **flashover** sweep the house - every wisp of smoke touching fire becomes
 * fire, over and over until none is left touching.
 *
 * Doing the flashover last rather than as each piece lands is not a detail. A
 * single explosion can lay smoke three rooms apart, and resolving each one where
 * it fell would let the order of the four directions decide how much of the
 * house burns.
 */
import {
  AMBULANCE,
  WALL_HEALTH,
  around,
  edgeBetween,
  edgeKey,
  isInside,
  onBoard,
  type Cell,
} from "./board";
import { createRandom, type Random } from "./random";
import {
  blazeAt,
  cellKey,
  cellOf,
  damageOn,
  isBroken,
  playersOn,
  sameCell,
  type Blaze,
  type FlashPointGame,
} from "./state";

/** Sides of the red die: the row. */
const ROW_DIE = 6;

/** Sides of the black die: the column. */
const COL_DIE = 8;

/**
 * Rolls both dice and lets the fire have its turn.
 *
 * @param game - the fire as it stands
 * @returns the fire afterwards, including anything it destroyed
 */
export function advanceFire(game: FlashPointGame): FlashPointGame {
  const random = createRandom(game.rng);
  const target: Cell = {
    row: 1 + Math.floor(random.next() * ROW_DIE),
    col: 1 + Math.floor(random.next() * COL_DIE),
  };
  const rolled = note(
    { ...game, rng: random.state() },
    `Feuer breitet sich aus: ${target.row}/${target.col}.`,
  );
  return settle(place(rolled, target));
}

/**
 * Puts smoke on a square and resolves what that means.
 *
 * @remarks
 * The three cases are the rulebook's, and they are checked in its order:
 * smoke on smoke makes fire, smoke touching fire makes fire, and smoke on fire
 * is an explosion.
 */
function place(game: FlashPointGame, cell: Cell): FlashPointGame {
  const there = blazeAt(game, cell);
  let next: FlashPointGame;
  if (there === "fire") {
    next = explode(note(game, "Explosion!"), cell);
  } else if (there === "smoke") {
    next = setBlaze(game, cell, "fire");
  } else {
    next = setBlaze(game, cell, "smoke");
  }
  return next;
}

/**
 * An explosion: outward in all four directions at once.
 *
 * @remarks
 * Each direction is independent, and each does one of two things. If the
 * neighbour is not already burning, the explosion simply reaches it - fire on an
 * empty square, smoke turned to fire, a cube on a wall, a door blown off its
 * hinges. If the neighbour **is** already burning, the pressure has nowhere to
 * go and runs on as a blast wave until something stops it.
 */
function explode(game: FlashPointGame, centre: Cell): FlashPointGame {
  let next = game;
  for (const step of around(centre)) {
    next = blast(next, centre, step);
  }
  return next;
}

/** One arm of an explosion. */
function blast(game: FlashPointGame, from: Cell, to: Cell): FlashPointGame {
  const edge = edgeKey(from, to);
  const kind = edgeBetween(from, to);
  let next = game;

  if (kind === "wall" && !isBroken(game, edge)) {
    next = damageWall(game, edge);
  } else if (kind === "door" && game.doors[edge] !== "gone") {
    next = note(
      { ...game, doors: { ...game.doors, [edge]: "gone" } },
      `Tür zerstört: ${to.row}/${to.col}.`,
    );
  } else if (onBoard(to)) {
    next =
      blazeAt(game, to) === "fire"
        ? wave(game, from, to)
        : setBlaze(game, to, "fire");
  }
  return next;
}

/**
 * A blast wave, running in one direction until something stops it.
 *
 * @remarks
 * Bounded by the board rather than by a counter: it can only ever leave the
 * building, and the ring outside is the last thing it can reach.
 */
function wave(game: FlashPointGame, from: Cell, through: Cell): FlashPointGame {
  const step: Cell = {
    row: through.row - from.row,
    col: through.col - from.col,
  };
  let at = through;
  let next = game;
  let running = true;
  while (running) {
    const beyond: Cell = { row: at.row + step.row, col: at.col + step.col };
    const edge = edgeKey(at, beyond);
    const kind = edgeBetween(at, beyond);
    if (!onBoard(beyond)) {
      running = false;
    } else if (kind === "wall" && !isBroken(next, edge)) {
      next = damageWall(next, edge);
      running = false;
    } else if (kind === "door" && next.doors[edge] !== "gone") {
      // Shut or open, a door in the way of a blast wave stops being a door -
      // and stops the wave with it.
      next = { ...next, doors: { ...next.doors, [edge]: "gone" } };
      running = false;
    } else if (blazeAt(next, beyond) === "fire") {
      at = beyond;
    } else {
      next = setBlaze(next, beyond, "fire");
      running = false;
    }
  }
  return next;
}

/**
 * Everything that happens once the fire has finished moving.
 *
 * @remarks
 * The flashover first, because it can put fire under somebody who was safe a
 * moment ago; then the people, then the victims, and last the ground outside,
 * which never keeps burning.
 */
function settle(game: FlashPointGame): FlashPointGame {
  return outsideOut(burnVictims(knockDown(flashover(game))));
}

/** Every wisp of smoke touching fire becomes fire, until none is left. */
function flashover(game: FlashPointGame): FlashPointGame {
  let next = game;
  let changed = true;
  while (changed) {
    changed = false;
    for (const [key, what] of Object.entries(next.blaze)) {
      const cell = cellOf(key);
      if (what === "smoke" && touchesFire(next, cell)) {
        next = setBlaze(next, cell, "fire");
        changed = true;
      }
    }
  }
  return next;
}

/** Whether a square has fire next to it that can reach it. */
function touchesFire(game: FlashPointGame, cell: Cell): boolean {
  return around(cell).some(
    (side) => passable(game, cell, side) && blazeAt(game, side) === "fire",
  );
}

/**
 * Whether fire and people can pass between two squares.
 *
 * @param game - the fire
 * @param a - one square
 * @param b - the square next to it
 * @returns true when nothing stands in the way
 * @remarks
 * Exported because the referee asks exactly the same question about a
 * firefighter's step, and two answers to one question is how a wall ends up
 * stopping a person but not a flame.
 */
export function passable(game: FlashPointGame, a: Cell, b: Cell): boolean {
  const edge = edgeKey(a, b);
  const kind = edgeBetween(a, b);
  let open: boolean;
  if (kind === null) {
    open = true;
  } else if (kind === "wall") {
    open = isBroken(game, edge);
  } else {
    open = game.doors[edge] !== "closed";
  }
  return open && onBoard(b);
}

/** Anybody standing in fire is carried out to the ambulance. */
function knockDown(game: FlashPointGame): FlashPointGame {
  let next = game;
  for (let index = 0; index < next.players.length; index++) {
    const player = next.players[index];
    if (blazeAt(next, player.at) === "fire") {
      const to = nearestAmbulance(player.at);
      const lost = player.carrying;
      next = note(
        {
          ...next,
          dead: next.dead + (lost ? 1 : 0),
          players: next.players.map((each, at) =>
            at === index ? { ...each, at: to, carrying: false } : each,
          ),
        },
        `${player.name} wird zu Boden geworfen${lost ? " - das Opfer stirbt" : ""}.`,
      );
    }
  }
  return next;
}

/** The closest of the four ambulance squares, as the crow flies. */
function nearestAmbulance(from: Cell): Cell {
  return [...AMBULANCE].sort(
    (a, b) => distance(from, a) - distance(from, b),
  )[0];
}

/** Straight-line steps between two squares, ignoring walls. */
function distance(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/** Anybody left lying in fire does not survive it. */
function burnVictims(game: FlashPointGame): FlashPointGame {
  let next = game;
  for (const [key, marker] of Object.entries(next.pois)) {
    if (blazeAt(next, cellOf(key)) === "fire") {
      const pois = { ...next.pois };
      delete pois[key];
      next = note(
        {
          ...next,
          pois,
          dead: next.dead + (marker.kind === "victim" ? 1 : 0),
        },
        marker.kind === "victim"
          ? "Ein Opfer ist im Feuer umgekommen."
          : "Ein Fehlalarm ist verbrannt.",
      );
    }
  }
  return next;
}

/** Fire never keeps burning on the ground outside the house. */
function outsideOut(game: FlashPointGame): FlashPointGame {
  const blaze: Record<string, Blaze> = {};
  for (const [key, what] of Object.entries(game.blaze)) {
    if (isInside(cellOf(key))) {
      blaze[key] = what;
    }
  }
  return { ...game, blaze };
}

/**
 * Puts a cube on a wall, and brings the house down if that was the last one.
 *
 * @remarks
 * Exported because the axe does exactly the same thing, and the count of cubes
 * left is the building's health however they get used up.
 */
export function damageWall(game: FlashPointGame, edge: string): FlashPointGame {
  const was = damageOn(game, edge);
  let next = game;
  if (was < WALL_HEALTH && game.cubes > 0) {
    next = {
      ...game,
      damage: { ...game.damage, [edge]: was + 1 },
      cubes: game.cubes - 1,
    };
    if (next.cubes <= 0) {
      next = note(
        { ...next, stage: "lost", failure: "collapse" },
        "Keine Schadenszähler mehr - das Gebäude stürzt ein!",
      );
    }
  }
  return next;
}

/** Sets what is burning on a square, or clears it. */
export function setBlaze(
  game: FlashPointGame,
  cell: Cell,
  what: Blaze | null,
): FlashPointGame {
  const blaze = { ...game.blaze };
  const key = cellKey(cell);
  if (what === null) {
    delete blaze[key];
  } else {
    blaze[key] = what;
  }
  return { ...game, blaze };
}

/** Adds a line to the log. */
export function note(game: FlashPointGame, line: string): FlashPointGame {
  return { ...game, log: [...game.log, line] };
}

/** Where the ambulance is, for anybody who needs to know. */
export { AMBULANCE };

/** So the referee can roll the same two dice for a new point of interest. */
export function rollCell(random: Random): Cell {
  return {
    row: 1 + Math.floor(random.next() * ROW_DIE),
    col: 1 + Math.floor(random.next() * COL_DIE),
  };
}

/** Whether anybody is standing on a square, for the refill rule. */
export function occupied(game: FlashPointGame, cell: Cell): boolean {
  return playersOn(game, cell).length > 0;
}

/** Whether two squares are one and the same, re-exported for the referee. */
export { sameCell };
