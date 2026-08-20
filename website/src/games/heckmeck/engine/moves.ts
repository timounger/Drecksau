/**
 * The rules of Heckmeck: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game or null when the move is not allowed right now, so an online
 * host can hand a guest's move straight to it without checking anything first.
 *
 * The bust is not a move anybody makes - it is what happens when there is
 * nothing left to do, and the referee declares it. That is why it is checked
 * after a roll and after a set-aside rather than offered as a button.
 */
import { createRandom, type Random } from "./random";
import {
  DICE_COUNT,
  WORM,
  canStop,
  grillOffer,
  hasWorm,
  pickable,
  stealable,
  topTile,
  total,
  type HeckmeckGame,
  type HeckmeckMove,
  type Outcome,
  type Player,
} from "./state";

/**
 * Whose turn it is.
 *
 * @param game - the current game
 * @returns the active seat, or null once the grill is empty
 */
export function seatOnTurn(game: HeckmeckGame): number | null {
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
  game: HeckmeckGame,
  seat: number,
  move: HeckmeckMove,
): HeckmeckGame | null {
  let next: HeckmeckGame | null = null;
  if (seat === game.active && game.phase !== "gameOver") {
    switch (move.kind) {
      case "pick":
        next = game.phase === "pick" ? setAside(game, move.face) : null;
        break;
      case "roll":
        next = game.phase === "decide" ? rollOn(game) : null;
        break;
      case "take":
        next = game.phase === "decide" ? takeFromGrill(game) : null;
        break;
      case "steal":
        next = game.phase === "decide" ? stealFrom(game, move.seat) : null;
        break;
    }
  }
  return next;
}

/**
 * Sets every die of one face aside.
 *
 * @remarks
 * Every die showing it, not one - that is the rule that makes a lucky roll of
 * five twos a real decision rather than a gift. And the face is spent: it can
 * never be set aside again this turn.
 *
 * What is set aside is kept in order, for the same reason the roll is
 * ({@link throwDice}): the row is there to be added up at a glance, and it
 * grows in the order the faces happened to be picked, which is no order at all.
 * The worms end up last, where the eye looks for them.
 */
function setAside(game: HeckmeckGame, face: number): HeckmeckGame | null {
  let next: HeckmeckGame | null = null;
  if (pickable(game).includes(face)) {
    const taken = game.dice.filter((die) => die === face);
    const rest = game.dice.filter((die) => die !== face);
    const kept = [...game.kept, ...taken].sort((left, right) => left - right);
    next = afterPick({
      ...game,
      phase: "decide",
      dice: rest,
      kept,
      log: [
        ...game.log,
        `${game.players[game.active].name}: ${taken.length}× ${faceName(face)} beiseite (${total(kept)}).`,
      ],
    });
  }
  return next;
}

/**
 * What the table looks like once a value has been set aside.
 *
 * @remarks
 * Three ways on: stop, roll again, or - if neither is possible - bust. The
 * last one is the whole game: dice all gone, no worm among them, and nothing
 * on the grill low enough.
 */
function afterPick(game: HeckmeckGame): HeckmeckGame {
  return game.dice.length === 0 && !canStop(game) ? bust(game) : game;
}

/**
 * Throws whatever is left.
 *
 * @remarks
 * A roll that produces nothing new is the classic way to lose a turn: every
 * face on the table has already been set aside, so there is nothing to take
 * and the turn is over.
 */
function rollOn(game: HeckmeckGame): HeckmeckGame | null {
  let next: HeckmeckGame | null = null;
  if (game.dice.length > 0) {
    const random = createRandom(game.rng);
    const dice = throwDice(random, game.dice.length);
    const rolled: HeckmeckGame = {
      ...game,
      phase: "pick",
      dice,
      rng: random.state(),
      log: [
        ...game.log,
        `${game.players[game.active].name}: ${dice.map(faceName).join(" ")} gewürfelt.`,
      ],
    };
    next = pickable(rolled).length === 0 ? bust(rolled) : rolled;
  }
  return next;
}

/** Stops and takes what the grill offers. */
function takeFromGrill(game: HeckmeckGame): HeckmeckGame | null {
  const tile = grillOffer(game);
  let next: HeckmeckGame | null = null;
  if (tile !== null && hasWorm(game.kept)) {
    next = endTurn(
      {
        ...game,
        grill: game.grill.filter((entry) => entry !== tile),
        players: withPlayer(game.players, game.active, {
          stack: [...game.players[game.active].stack, tile],
        }),
        log: [
          ...game.log,
          `${game.players[game.active].name}: Chip ${tile} genommen.`,
        ],
      },
      { seat: game.active, tile, from: null, bust: false, burnt: null },
    );
  }
  return next;
}

/** Stops and takes the top tile off somebody else's pile. */
function stealFrom(game: HeckmeckGame, victim: number): HeckmeckGame | null {
  let next: HeckmeckGame | null = null;
  if (stealable(game).includes(victim) && hasWorm(game.kept)) {
    const tile = topTile(game.players[victim]) as number;
    const players = withPlayer(game.players, victim, {
      stack: game.players[victim].stack.slice(0, -1),
    });
    next = endTurn(
      {
        ...game,
        players: withPlayer(players, game.active, {
          stack: [...players[game.active].stack, tile],
        }),
        log: [
          ...game.log,
          `${game.players[game.active].name}: Chip ${tile} geklaut von ${game.players[victim].name}.`,
        ],
      },
      { seat: game.active, tile, from: victim, bust: false, burnt: null },
    );
  }
  return next;
}

/**
 * A turn that came to nothing.
 *
 * @remarks
 * Two things happen, and the second one is what makes busting hurt everybody:
 * the player puts their top tile back on the grill, and then the **highest**
 * tile on the grill is turned over and out of the game. So a bust shortens the
 * game for the whole table, and the tiles that go first are the fat ones.
 */
function bust(game: HeckmeckGame): HeckmeckGame {
  const player = game.players[game.active];
  const returned = topTile(player);
  const players =
    returned === null
      ? game.players
      : withPlayer(game.players, game.active, {
          stack: player.stack.slice(0, -1),
        });
  const grill =
    returned === null
      ? game.grill
      : [...game.grill, returned].sort((a, b) => a - b);
  const burnt = grill.length === 0 ? null : grill[grill.length - 1];
  return endTurn(
    {
      ...game,
      players,
      grill: burnt === null ? grill : grill.slice(0, -1),
      burnt:
        burnt === null
          ? game.burnt
          : [...game.burnt, burnt].sort((a, b) => a - b),
      log: [
        ...game.log,
        `${player.name}: verspekuliert${returned === null ? "" : `, Chip ${returned} zurück`}${burnt === null ? "" : `; Chip ${burnt} fliegt raus`}.`,
      ],
    },
    {
      seat: game.active,
      tile: null,
      from: null,
      bust: true,
      burnt,
    },
  );
}

/** Hands the dice on, or ends the game if the grill has run out. */
function endTurn(game: HeckmeckGame, outcome: Outcome): HeckmeckGame {
  const noted: HeckmeckGame = { ...game, lastOutcome: outcome };
  return noted.grill.length === 0
    ? {
        ...noted,
        phase: "gameOver",
        dice: [],
        kept: [],
        log: [...noted.log, "Der Grill ist leer - Schluss."],
      }
    : startTurn(noted, (noted.active + 1) % noted.players.length);
}

/**
 * Hands the dice to a seat and throws all eight.
 *
 * @param game - the game as it stands
 * @param active - who rolls
 * @returns the game waiting for a value to be set aside
 */
export function startTurn(game: HeckmeckGame, active: number): HeckmeckGame {
  const random = createRandom(game.rng);
  const dice = throwDice(random, DICE_COUNT);
  return {
    ...game,
    phase: "pick",
    active,
    dice,
    kept: [],
    rng: random.state(),
    log: [
      ...game.log,
      `${game.players[active].name}: ${dice.map(faceName).join(" ")} gewürfelt.`,
    ],
  };
}

/**
 * Throws a handful of dice and lays them out in order.
 *
 * @param random - the generator, advanced once per die
 * @param count - how many dice to throw
 * @returns the faces, ascending, with the worms at the end
 * @remarks
 * Sorting is for reading, not for the rules: which face you take is decided by
 * counting how many of each are lying there, and eight dice in a jumble have to
 * be counted one by one. In order they are seen at a glance.
 *
 * The worms come last by themselves, because {@link WORM} is the sixth face -
 * the one worth more than the five. That is also the order the dice sit in on
 * the box, so it is what a player expects.
 *
 * Nothing else depends on the order: a face is picked by its value, and `kept`
 * is only ever summed or searched. It is sorted the same way, in
 * {@link setAside}.
 */
function throwDice(random: Random, count: number): readonly number[] {
  const thrown = Array.from(
    { length: count },
    () => 1 + Math.floor(random.next() * WORM),
  );
  return thrown.sort((left, right) => left - right);
}

/**
 * Every move the active player could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns the legal moves, so the screen and the computer see the same game
 */
export function legalMoves(
  game: HeckmeckGame,
  seat: number,
): readonly HeckmeckMove[] {
  const moves: HeckmeckMove[] = [];
  if (seat === game.active && game.phase !== "gameOver") {
    if (game.phase === "pick") {
      for (const face of pickable(game)) {
        moves.push({ kind: "pick", face });
      }
    } else {
      if (game.dice.length > 0) {
        moves.push({ kind: "roll" });
      }
      if (hasWorm(game.kept) && grillOffer(game) !== null) {
        moves.push({ kind: "take" });
      }
      // The worm gates stealing exactly as it gates taking: without one the
      // dice are worth nothing, so they cannot match anybody's tile either.
      // Leaving it off here put a button on screen that the referee then
      // refused - the one thing a list of legal moves must never do.
      if (hasWorm(game.kept)) {
        for (const victim of stealable(game)) {
          moves.push({ kind: "steal", seat: victim });
        }
      }
    }
  }
  return moves;
}

/** What a face is called, for the log and the screen. */
export function faceName(face: number): string {
  return face === WORM ? "🐛" : String(face);
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
