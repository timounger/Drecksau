/**
 * The referee: what a firefighter may do, and what it costs.
 *
 * @module
 * @remarks
 * Every action goes through {@link applyMove}, and every cost is the rulebook's.
 * The one place this reads the book rather than quoting it is putting fires out:
 * the book lists three prices - one point to clear smoke, one to knock fire down
 * to smoke, two to clear fire outright. That is the same thing said twice, so
 * here it is one action costing one point that moves a square one step down the
 * scale. Two of them clear a fire, which is the book's two points exactly.
 */
import {
  ACTION_POINTS,
  POI_ON_BOARD,
  VICTIMS_TO_WIN,
  DEATHS_TO_LOSE,
  WALL_HEALTH,
  around,
  edgeBetween,
  edgeKey,
  isInside,
  onBoard,
  type Cell,
} from "./board";
import {
  advanceFire,
  damageWall,
  note,
  passable,
  rollCell,
  setBlaze,
} from "./fire";
import { createRandom } from "./random";
import {
  activePlayer,
  blazeAt,
  cellKey,
  isBroken,
  poiAt,
  sameCell,
  type FlashPointGame,
  type FlashPointMove,
  type Marker,
} from "./state";

/** What one step costs, by what is burning where you are going. */
const STEP_PLAIN = 1;
const STEP_INTO_FIRE = 2;
const STEP_CARRYING = 2;

/** What the other actions cost - from the rulebook. */
const COST_DOOR = 1;
const COST_EXTINGUISH = 1;
const COST_CHOP = 2;

/** Tries to make a move.
 *
 * @param game - the fire as it stands
 * @param seat - who is trying to move
 * @param move - what they want to do
 * @returns the fire afterwards, or null if the move was not legal
 */
export function applyMove(
  game: FlashPointGame,
  seat: number,
  move: FlashPointMove,
): FlashPointGame | null {
  let next: FlashPointGame | null = null;
  if (game.stage === "acting" && game.active === seat) {
    switch (move.kind) {
      case "move":
        next = walk(game, move.to);
        break;
      case "door":
        next = toggleDoor(game, move.to);
        break;
      case "extinguish":
        next = extinguish(game, move.at);
        break;
      case "chop":
        next = chop(game, move.to);
        break;
      case "carry":
        next = carry(game);
        break;
      case "endTurn":
        next = endTurn(game);
        break;
    }
  }
  return next === null ? null : autoEnd(finish(next));
}

/**
 * How many turns may end themselves in a row before something is wrong.
 *
 * @remarks
 * A guard, not a rule. Somebody starting a turn with four points always has
 * *something* they could do - walk, chop, hose - so a whole table with nothing
 * available cannot happen. If it somehow does, stopping is better than looping.
 */
const AUTO_END_LIMIT = 8;

/**
 * Ends a turn that has nothing left in it.
 *
 * @param game - the fire, just after a move
 * @returns the fire, with any spent-out turns already passed on
 * @remarks
 * Only when **stopping is the only legal move**. That is the whole condition,
 * and it is what makes this safe: a firefighter who could still do something is
 * never hurried, so nobody loses the choice to stop early and bank what is
 * left. Somebody with one point and nothing that costs one is simply finished,
 * and making them say so is a click that carries no decision.
 */
function autoEnd(game: FlashPointGame): FlashPointGame {
  let next = game;
  let guard = 0;
  while (
    next.stage === "acting" &&
    guard < AUTO_END_LIMIT &&
    onlyStopping(next)
  ) {
    guard += 1;
    next = finish(endTurn(next));
  }
  return next;
}

/** Whether the firefighter on turn has nothing left but to stop. */
function onlyStopping(game: FlashPointGame): boolean {
  return legalMoves(game, game.active).every((move) => move.kind === "endTurn");
}

/** The seat the table is waiting for. */
export function seatOnTurn(game: FlashPointGame): number | null {
  return game.stage === "acting" ? game.active : null;
}

/**
 * Every move the firefighter on turn could make.
 *
 * @param game - the fire
 * @param seat - whose options to list
 * @returns the legal moves
 */
export function legalMoves(
  game: FlashPointGame,
  seat: number,
): readonly FlashPointMove[] {
  const moves: FlashPointMove[] = [];
  if (game.stage === "acting" && game.active === seat) {
    const me = game.players[seat];
    moves.push({ kind: "endTurn" });
    for (const to of around(me.at)) {
      if (onBoard(to)) {
        if (
          stepCost(game, to) !== null &&
          affordable(game, stepCost(game, to))
        ) {
          moves.push({ kind: "move", to });
        }
        // A door that has been blown off its hinges is a hole, not a door.
        if (canUseDoor(game, to) && affordable(game, COST_DOOR)) {
          moves.push({ kind: "door", to });
        }
        if (canChop(game, to) && affordable(game, COST_CHOP)) {
          moves.push({ kind: "chop", to });
        }
      }
    }
    for (const at of [me.at, ...around(me.at)]) {
      if (canExtinguish(game, at) && affordable(game, COST_EXTINGUISH)) {
        moves.push({ kind: "extinguish", at });
      }
    }
    if (canCarry(game)) {
      moves.push({ kind: "carry" });
    }
  }
  return moves;
}

/**
 * What one step onto a square costs, or null where it is impossible.
 *
 * @param game - the fire
 * @param to - the square being stepped onto
 * @returns the cost in action points, or null
 * @remarks
 * Exported because the screen prices every square before the player commits, and
 * a price shown that the referee then refuses is the one thing a list of moves
 * must never do.
 */
export function stepCost(game: FlashPointGame, to: Cell): number | null {
  const me = activePlayer(game);
  const burning = blazeAt(game, to) === "fire";
  let cost: number | null;
  if (!passable(game, me.at, to)) {
    cost = null;
  } else if (me.carrying) {
    // A victim is never carried into fire - the rulebook is flat about it.
    cost = burning ? null : STEP_CARRYING;
  } else {
    cost = burning ? STEP_INTO_FIRE : STEP_PLAIN;
  }
  return cost;
}

/** Walks one square, and looks at whatever is lying there. */
function walk(game: FlashPointGame, to: Cell): FlashPointGame | null {
  const cost = stepCost(game, to);
  let next: FlashPointGame | null = null;
  if (cost !== null && affordable(game, cost)) {
    const me = activePlayer(game);
    next = spend(moveTo(game, game.active, to), cost);
    next = reveal(next, to);
    if (me.carrying && !isInside(to)) {
      next = rescue(next);
    }
  }
  return next;
}

/** Whether there is a working door on that edge. */
function canUseDoor(game: FlashPointGame, to: Cell): boolean {
  const me = activePlayer(game);
  return (
    edgeBetween(me.at, to) === "door" &&
    (game.doors[edgeKey(me.at, to)] ?? "closed") !== "gone"
  );
}

/** Opens or shuts a door on one of this square's edges. */
function toggleDoor(game: FlashPointGame, to: Cell): FlashPointGame | null {
  const me = activePlayer(game);
  const edge = edgeKey(me.at, to);
  let next: FlashPointGame | null = null;
  if (canUseDoor(game, to) && affordable(game, COST_DOOR)) {
    const was = game.doors[edge] ?? "closed";
    const now = was === "closed" ? "open" : "closed";
    next = spend(
      note(
        { ...game, doors: { ...game.doors, [edge]: now } },
        `${me.name}: Tür ${now === "open" ? "geöffnet" : "geschlossen"}.`,
      ),
      COST_DOOR,
    );
  }
  return next;
}

/** Whether there is anything to put out on that square. */
function canExtinguish(game: FlashPointGame, at: Cell): boolean {
  const me = activePlayer(game);
  return (
    blazeAt(game, at) !== null &&
    (sameCell(me.at, at) || passable(game, me.at, at))
  );
}

/** One step down the scale: fire to smoke, smoke to nothing. */
function extinguish(game: FlashPointGame, at: Cell): FlashPointGame | null {
  let next: FlashPointGame | null = null;
  if (canExtinguish(game, at) && affordable(game, COST_EXTINGUISH)) {
    const what = blazeAt(game, at);
    next = spend(
      note(
        setBlaze(game, at, what === "fire" ? "smoke" : null),
        `${activePlayer(game).name}: ${what === "fire" ? "Feuer eingedämmt" : "Rauch gelöscht"} auf ${at.row}/${at.col}.`,
      ),
      COST_EXTINGUISH,
    );
  }
  return next;
}

/** Whether the axe has anything to bite on in that direction. */
function canChop(game: FlashPointGame, to: Cell): boolean {
  const me = activePlayer(game);
  const edge = edgeKey(me.at, to);
  return (
    edgeBetween(me.at, to) === "wall" && !isBroken(game, edge) && game.cubes > 0
  );
}

/** Takes the axe to a wall. */
function chop(game: FlashPointGame, to: Cell): FlashPointGame | null {
  let next: FlashPointGame | null = null;
  if (canChop(game, to) && affordable(game, COST_CHOP)) {
    const me = activePlayer(game);
    const edge = edgeKey(me.at, to);
    const hit = damageWall(game, edge);
    next = spend(
      note(
        hit,
        `${me.name}: Wand eingeschlagen${
          (hit.damage[edge] ?? 0) >= WALL_HEALTH ? " - sie ist durch" : ""
        }.`,
      ),
      COST_CHOP,
    );
  }
  return next;
}

/** Whether there is somebody here to pick up, or to set down. */
function canCarry(game: FlashPointGame): boolean {
  const me = activePlayer(game);
  const here = poiAt(game, me.at);
  return (
    me.carrying || (here !== null && here.revealed && here.kind === "victim")
  );
}

/** Picks somebody up, or puts them down again. */
function carry(game: FlashPointGame): FlashPointGame | null {
  const me = activePlayer(game);
  let next: FlashPointGame | null = null;
  if (me.carrying) {
    const pois = {
      ...game.pois,
      [cellKey(me.at)]: { kind: "victim", revealed: true } as Marker,
    };
    next = note(
      {
        ...game,
        pois,
        players: withPlayer(game, game.active, { carrying: false }),
      },
      `${me.name}: Opfer abgesetzt.`,
    );
  } else if (canCarry(game)) {
    const pois = { ...game.pois };
    delete pois[cellKey(me.at)];
    next = note(
      {
        ...game,
        pois,
        players: withPlayer(game, game.active, { carrying: true }),
      },
      `${me.name}: Opfer aufgenommen.`,
    );
  }
  return next;
}

/** Somebody carried out of the building is safe. */
function rescue(game: FlashPointGame): FlashPointGame {
  return note(
    {
      ...game,
      rescued: game.rescued + 1,
      players: withPlayer(game, game.active, { carrying: false }),
    },
    `${activePlayer(game).name}: Opfer gerettet (${game.rescued + 1}).`,
  );
}

/**
 * Looks at what is lying on a square.
 *
 * @remarks
 * Free, and automatic: the rulebook charges nothing for turning a marker over,
 * and a player who could choose not to look would only be choosing to forget.
 */
function reveal(game: FlashPointGame, at: Cell): FlashPointGame {
  const here = poiAt(game, at);
  let next = game;
  if (here !== null && !here.revealed) {
    if (here.kind === "falseAlarm") {
      const pois = { ...game.pois };
      delete pois[cellKey(at)];
      next = note({ ...game, pois }, "Fehlalarm - hier ist niemand.");
    } else {
      next = note(
        {
          ...game,
          pois: { ...game.pois, [cellKey(at)]: { ...here, revealed: true } },
        },
        "Ein Opfer gefunden!",
      );
    }
  }
  return next;
}

/**
 * Ends the turn: the fire moves, the markers are topped up, the next one is on.
 *
 * @remarks
 * The rulebook forbids ending a turn on a burning square and leaves it there.
 * Somebody who has run out of points while standing in fire has to go
 * **somewhere**, so here they are knocked down to the ambulance like anyone
 * caught by the flames - which is the same outcome the fire would have given
 * them a moment later anyway.
 */
function endTurn(game: FlashPointGame): FlashPointGame {
  const me = activePlayer(game);
  let next = game;
  if (blazeAt(game, me.at) === "fire") {
    next = note(next, `${me.name} steht im Feuer und muss raus.`);
  }
  const saved = Math.min(ACTION_POINTS, next.players[next.active].ap);
  next = {
    ...next,
    players: withPlayer(next, next.active, { saved, ap: 0 }),
  };
  next = advanceFire(next);
  if (next.stage === "acting") {
    next = refill(next);
    const active = (next.active + 1) % next.players.length;
    next = {
      ...next,
      active,
      turn: next.turn + 1,
      players: next.players.map((player, at) =>
        at === active
          ? { ...player, ap: ACTION_POINTS + player.saved, saved: 0 }
          : player,
      ),
    };
  }
  return next;
}

/**
 * Tops the board back up to three points of interest.
 *
 * @remarks
 * Rolled for, exactly as the book says, and a square that already has one is
 * simply rolled again. The loop is bounded because a board with three markers on
 * it stops asking, and forty-eight squares cannot all be occupied by three
 * markers - but it is bounded anyway, because a die that never comes up right is
 * not a reason to hang.
 */
function refill(game: FlashPointGame): FlashPointGame {
  const random = createRandom(game.rng);
  let next = game;
  let guard = 0;
  const limit = 100;
  while (
    Object.keys(next.pois).length < POI_ON_BOARD &&
    next.bag.length > 0 &&
    guard < limit
  ) {
    guard += 1;
    const at = rollCell(random);
    if (poiAt(next, at) === null) {
      const [kind, ...rest] = next.bag;
      next = setBlaze(next, at, null);
      next = {
        ...next,
        bag: rest,
        pois: { ...next.pois, [cellKey(at)]: { kind, revealed: false } },
      };
      // Somebody standing there sees at once who it is.
      next = around(at).length > 0 ? next : next;
      if (next.players.some((player) => sameCell(player.at, at))) {
        next = reveal(next, at);
      }
    }
  }
  return { ...next, rng: random.state() };
}

/** Whether the firefighter on turn can pay for something. */
function affordable(game: FlashPointGame, cost: number | null): boolean {
  return cost !== null && activePlayer(game).ap >= cost;
}

/** Pays for an action. */
function spend(game: FlashPointGame, cost: number): FlashPointGame {
  return {
    ...game,
    players: withPlayer(game, game.active, {
      ap: game.players[game.active].ap - cost,
    }),
  };
}

/** Puts a firefighter on a square. */
function moveTo(game: FlashPointGame, seat: number, to: Cell): FlashPointGame {
  return note(
    { ...game, players: withPlayer(game, seat, { at: to }) },
    `${game.players[seat].name}: nach ${to.row}/${to.col}.`,
  );
}

/** One player changed, the rest left alone. */
function withPlayer(
  game: FlashPointGame,
  seat: number,
  change: Partial<FlashPointGame["players"][number]>,
): FlashPointGame["players"] {
  return game.players.map((player, at) =>
    at === seat ? { ...player, ...change } : player,
  );
}

/** Checks whether the fire is over, whichever way. */
function finish(game: FlashPointGame): FlashPointGame {
  let next = game;
  if (next.stage === "acting") {
    if (next.rescued >= VICTIMS_TO_WIN) {
      next = note({ ...next, stage: "won" }, "Alle draußen - geschafft!");
    } else if (next.dead >= DEATHS_TO_LOSE) {
      next = note(
        { ...next, stage: "lost", failure: "deaths" },
        "Zu viele Opfer.",
      );
    }
  }
  return next;
}
