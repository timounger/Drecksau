/**
 * The rules of Camel Up: which action is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game or null when the move is not allowed right now, so an online
 * host can hand a guest's move straight to it without checking anything first.
 *
 * A turn is **one** of four things: roll the pyramid, back a camel for the leg,
 * bet on how the whole race ends, or put your desert tile down. Three of them
 * are free; the fourth pays a coin. That is the whole tension of the game -
 * the only action that earns money is the one that also advances the race.
 */
import { createRandom, randomInt } from "./random";
import { nextLeg } from "./setup";
import { advance } from "./track";
import {
  CAMELS,
  LEG_SECOND,
  LEG_WRONG,
  MAX_PIPS,
  RACE_BET_PAYOUTS,
  RACE_WRONG,
  ROLL_REWARD,
  TILE_REWARD,
  canPlaceTile,
  isFinished,
  standings,
  type Camel,
  type CamelUpGame,
  type CamelUpMove,
  type LegResult,
  type Player,
  type RaceBet,
} from "./state";

/**
 * Whose turn it is.
 *
 * @param game - the current game
 * @returns the seat that may act, or null once the race is over
 */
export function seatOnTurn(game: CamelUpGame): number | null {
  return game.phase === "gameOver" ? null : game.turn;
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
  game: CamelUpGame,
  seat: number,
  move: CamelUpMove,
): CamelUpGame | null {
  let next: CamelUpGame | null = null;
  if (seat === game.turn && seat >= 0 && seat < game.players.length) {
    switch (move.kind) {
      case "nextLeg":
        next = game.phase === "legOver" ? nextLeg(game) : null;
        break;
      case "roll":
        next = game.phase === "racing" ? rollDie(game, seat) : null;
        break;
      case "legBet":
        next =
          game.phase === "racing" ? takeLegBet(game, seat, move.camel) : null;
        break;
      case "raceBet":
        next =
          game.phase === "racing"
            ? layRaceBet(game, seat, move.camel, move.side)
            : null;
        break;
      case "tile":
        next =
          game.phase === "racing"
            ? putTile(game, seat, move.space, move.tile)
            : null;
        break;
    }
  }
  return next;
}

/**
 * Takes a die out of the pyramid and moves the camel it belongs to.
 *
 * @remarks
 * The coin is the point: rolling is the one action that pays, so somebody has
 * to keep the race moving even when nobody wants to. Landing on a desert tile
 * pays its owner as well - which is why a tile in the right place earns money
 * from other people's dice all leg long.
 */
function rollDie(game: CamelUpGame, seat: number): CamelUpGame | null {
  let next: CamelUpGame | null = null;
  if (game.dice.length > 0) {
    const random = createRandom(game.rng);
    const which = randomInt(random, game.dice.length);
    const camel = game.dice[which];
    const pips = 1 + randomInt(random, MAX_PIPS);
    const moved = advance(game.track, game.tiles, camel, pips);
    const players = game.players.map((player, at) => {
      const rolled = at === seat ? ROLL_REWARD : 0;
      const landed =
        moved.tile !== null && moved.tile.seat === at ? TILE_REWARD : 0;
      return { ...player, coins: player.coins + rolled + landed };
    });
    const note =
      moved.tile === null
        ? ""
        : ` - ${moved.tile.kind === "oasis" ? "Oase" : "Fata Morgana"} von ${game.players[moved.tile.seat].name}`;
    const rolledGame: CamelUpGame = {
      ...game,
      players,
      track: moved.track,
      dice: game.dice.filter((entry, index) => index !== which),
      rolls: [...game.rolls, { camel, pips, seat }],
      rng: random.state(),
      log: [
        ...game.log,
        `${game.players[seat].name} würfelt ${camelName(camel)} ${pips}${note}.`,
      ],
    };
    next = afterRoll(rolledGame, seat);
  }
  return next;
}

/**
 * Closes a roll: the race may be over, the leg may be over, or play goes on.
 *
 * @remarks
 * A camel over the line ends everything at once, and the leg that was running
 * is paid out with it - the animals are where they are, and the bets on that
 * leg are just as decided as the race.
 */
function afterRoll(game: CamelUpGame, seat: number): CamelUpGame {
  let next: CamelUpGame;
  if (isFinished(game)) {
    next = finish(payLeg(game));
  } else if (game.dice.length === 0) {
    next = { ...payLeg(game), phase: "legOver", turn: nextSeat(game, seat) };
  } else {
    next = { ...game, turn: nextSeat(game, seat) };
  }
  return next;
}

/** Takes the best remaining card of one camel. */
function takeLegBet(
  game: CamelUpGame,
  seat: number,
  camel: Camel,
): CamelUpGame | null {
  const stack = game.legBets[camel];
  let next: CamelUpGame | null = null;
  if (stack.length > 0) {
    const value = stack[0];
    next = {
      ...game,
      legBets: { ...game.legBets, [camel]: stack.slice(1) },
      players: withPlayer(game.players, seat, {
        legCards: [...game.players[seat].legCards, { camel, value }],
      }),
      turn: nextSeat(game, seat),
      log: [
        ...game.log,
        `${game.players[seat].name} setzt auf ${camelName(camel)} für diese Etappe (${value}).`,
      ],
    };
  }
  return next;
}

/**
 * Lays one of your colour cards face down on the winner or the loser pile.
 *
 * @remarks
 * Face down and in order: the earlier a card goes on the pile, the more it
 * pays if it turns out right. Each player has one card per camel and never
 * gets it back, so an overall bet is a decision you only make once.
 */
function layRaceBet(
  game: CamelUpGame,
  seat: number,
  camel: Camel,
  side: "winner" | "loser",
): CamelUpGame | null {
  const player = game.players[seat];
  let next: CamelUpGame | null = null;
  if (player.raceCards.includes(camel)) {
    const bet: RaceBet = { camel, seat };
    next = {
      ...game,
      winnerBets:
        side === "winner" ? [...game.winnerBets, bet] : game.winnerBets,
      loserBets: side === "loser" ? [...game.loserBets, bet] : game.loserBets,
      players: withPlayer(game.players, seat, {
        raceCards: player.raceCards.filter((entry) => entry !== camel),
      }),
      turn: nextSeat(game, seat),
      log: [
        ...game.log,
        `${player.name} tippt verdeckt auf den ${side === "winner" ? "Gesamtsieg" : "letzten Platz"}.`,
      ],
    };
  }
  return next;
}

/** Puts a desert tile down, or picks it up and puts it somewhere else. */
function putTile(
  game: CamelUpGame,
  seat: number,
  space: number,
  kind: "oasis" | "mirage",
): CamelUpGame | null {
  let next: CamelUpGame | null = null;
  if (canPlaceTile(game, seat, space)) {
    next = {
      ...game,
      tiles: [
        ...game.tiles.filter((tile) => tile.seat !== seat),
        { space, seat, kind },
      ],
      players: withPlayer(game.players, seat, { tileAt: space }),
      turn: nextSeat(game, seat),
      log: [
        ...game.log,
        `${game.players[seat].name} legt ${kind === "oasis" ? "eine Oase" : "eine Fata Morgana"} auf Feld ${space + 1}.`,
      ],
    };
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Paying out                                                          *
 * ------------------------------------------------------------------ */

/**
 * Settles every leg bet on the table.
 *
 * @remarks
 * The card's own figure for the camel that leads the leg, one coin for the one
 * behind it, and a coin off for anything else. Nobody ever goes below nothing:
 * a player with an empty purse simply pays what they have.
 */
function payLeg(game: CamelUpGame): CamelUpGame {
  const order = standings(game.track);
  const first = order[0];
  const second = order[1];
  const gained = game.players.map((player) =>
    player.legCards.reduce(
      (sum, card) => sum + legPayout(card.camel, card.value, first, second),
      0,
    ),
  );
  const result: LegResult = { leg: game.leg, first, second, gained };
  return {
    ...game,
    players: game.players.map((player, seat) => ({
      ...player,
      coins: Math.max(0, player.coins + gained[seat]),
    })),
    lastLeg: result,
    log: [
      ...game.log,
      `Etappe ${game.leg}: ${camelName(first)} vorn, ${camelName(second)} dahinter.`,
    ],
  };
}

/** What one leg card is worth once the leg is over. */
function legPayout(
  camel: Camel,
  value: number,
  first: Camel,
  second: Camel,
): number {
  let paid: number;
  if (camel === first) {
    paid = value;
  } else if (camel === second) {
    paid = LEG_SECOND;
  } else {
    paid = -LEG_WRONG;
  }
  return paid;
}

/**
 * Counts the overall bets once a camel is over the line.
 *
 * @remarks
 * Only the cards on the right camel pay, and they pay by the order they were
 * laid: eight for the first person who saw it coming, then five, three, two,
 * and one for everybody after that. Every other card costs a coin, whenever it
 * was laid - the pile is not a lottery ticket, it is a claim.
 */
function finish(game: CamelUpGame): CamelUpGame {
  const order = standings(game.track);
  const winner = order[0];
  const loser = order[order.length - 1];
  const gains = game.players.map(() => 0);
  for (const [bets, right] of [
    [game.winnerBets, winner],
    [game.loserBets, loser],
  ] as const) {
    bets.forEach((bet, index) => {
      gains[bet.seat] += bet.camel === right ? payoutAt(index) : -RACE_WRONG;
    });
  }
  return {
    ...game,
    phase: "gameOver",
    players: game.players.map((player, seat) => ({
      ...player,
      coins: Math.max(0, player.coins + gains[seat]),
    })),
    log: [
      ...game.log,
      `${camelName(winner)} gewinnt das Rennen, ${camelName(loser)} wird letzter.`,
      "Das Rennen ist zu Ende.",
    ],
  };
}

/** What the n-th card on a pile pays if it turns out right. */
function payoutAt(index: number): number {
  return (
    RACE_BET_PAYOUTS[index] ?? RACE_BET_PAYOUTS[RACE_BET_PAYOUTS.length - 1]
  );
}

/* ------------------------------------------------------------------ *
 * Small helpers                                                       *
 * ------------------------------------------------------------------ */

/**
 * The moves a seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns every legal move, so the screen and the computer see the same game
 */
export function legalMoves(
  game: CamelUpGame,
  seat: number,
): readonly CamelUpMove[] {
  const moves: CamelUpMove[] = [];
  if (seat === game.turn) {
    if (game.phase === "legOver") {
      moves.push({ kind: "nextLeg" });
    } else if (game.phase === "racing") {
      if (game.dice.length > 0) {
        moves.push({ kind: "roll" });
      }
      for (const camel of CAMELS) {
        if (game.legBets[camel].length > 0) {
          moves.push({ kind: "legBet", camel });
        }
        if (game.players[seat].raceCards.includes(camel)) {
          moves.push({ kind: "raceBet", camel, side: "winner" });
          moves.push({ kind: "raceBet", camel, side: "loser" });
        }
      }
      for (let space = 0; space < game.track.length; space++) {
        if (canPlaceTile(game, seat, space)) {
          moves.push({ kind: "tile", space, tile: "oasis" });
          moves.push({ kind: "tile", space, tile: "mirage" });
        }
      }
    }
  }
  return moves;
}

/** German name of a camel, for the log. */
function camelName(camel: Camel): string {
  const names: Record<Camel, string> = {
    blau: "Blau",
    gruen: "Grün",
    gelb: "Gelb",
    orange: "Orange",
    weiss: "Weiß",
  };
  return names[camel];
}

/** The seat to the left. */
function nextSeat(game: CamelUpGame, seat: number): number {
  return (seat + 1) % game.players.length;
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
