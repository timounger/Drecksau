/**
 * The rules of The Mind: which move is allowed, and what it does.
 *
 * @module
 * @remarks
 * Every function here is pure. {@link applyMove} is the one referee: it returns
 * the new game or null when the move is not allowed right now, so an online
 * host can hand a guest's move straight to it without checking anything first.
 *
 * There is **no turn**. Any seat may play at any moment, and the referee's job
 * is only to say what that costs - which is the entire game. A card that comes
 * down while somebody else still holds a lower one is not an illegal move, it
 * is a **mistake**, and mistakes are how this game talks to you.
 */
import { dealLevel } from "./setup";
import {
  MAX_LIVES,
  MAX_SHURIKENS,
  cardsLeft,
  rewardFor,
  shurikenAgreed,
  type MindGame,
  type MindMove,
  type Mistake,
  type Player,
} from "./state";

/**
 * Whose turn it is - nobody's, ever.
 *
 * @param game - the current game
 * @returns always null
 * @remarks
 * The online layer asks this to decide who to hurry along and whose seat to
 * play for them. Here the honest answer is "no one": everybody may play at any
 * time, and any other answer would be a broadcast of whose card is lowest -
 * which is the one thing nobody is allowed to know.
 */
export function seatOnTurn(): number | null {
  return null;
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
  game: MindGame,
  seat: number,
  move: MindMove,
): MindGame | null {
  let next: MindGame | null = null;
  if (seat >= 0 && seat < game.players.length) {
    switch (move.kind) {
      case "play":
        next = game.phase === "playing" ? playLowest(game, seat) : null;
        break;
      case "shuriken":
        next = game.phase === "playing" ? raiseHand(game, seat) : null;
        break;
      case "nextLevel":
        next = game.phase === "levelOver" ? dealLevel(game) : null;
        break;
    }
  }
  return next;
}

/**
 * Puts a seat's lowest card down and works out what it cost.
 *
 * @remarks
 * You always play the lowest card you hold. Any other choice is a worse
 * version of the same move - the higher card still has to come down later, and
 * holding the lower one back can only cost a life.
 */
function playLowest(game: MindGame, seat: number): MindGame | null {
  const player = game.players[seat];
  let next: MindGame | null = null;
  if (player.hand.length > 0) {
    const card = player.hand[0];
    // Every card anybody else still holds that should have come first. They
    // are gone either way; what matters is that they are counted once.
    const missed = game.players.flatMap((other, at) =>
      at === seat ? [] : other.hand.filter((held) => held < card),
    );
    const players = game.players.map((other, at) => ({
      ...other,
      hand:
        at === seat
          ? other.hand.slice(1)
          : other.hand.filter((held) => held > card),
      wantsShuriken: false,
    }));
    const mistake: Mistake | null =
      missed.length === 0
        ? null
        : { played: card, seat, lost: [...missed].sort((a, b) => a - b) };
    const played: MindGame = {
      ...game,
      players,
      pile: [...game.pile, card],
      lost:
        mistake === null
          ? game.lost
          : [...game.lost, ...mistake.lost].sort((a, b) => a - b),
      lives: mistake === null ? game.lives : game.lives - 1,
      lastMistake: mistake,
      log: [...game.log, playLine(game, seat, card, mistake)],
    };
    next = settle(played);
  }
  return next;
}

/**
 * Raises or lowers a hand for the shuriken, and throws it once all agree.
 *
 * @remarks
 * A shuriken is not a move somebody makes, it is one the table agrees on -
 * everybody still holding cards has to put a hand up. Thrown, it takes the
 * lowest card out of every hand, which is exactly the information the table
 * was missing.
 */
function raiseHand(game: MindGame, seat: number): MindGame | null {
  let next: MindGame | null = null;
  if (game.shurikens > 0 && game.players[seat].hand.length > 0) {
    const asked: MindGame = {
      ...game,
      players: game.players.map((player, at) =>
        at === seat
          ? { ...player, wantsShuriken: !player.wantsShuriken }
          : player,
      ),
    };
    next = shurikenAgreed(asked) ? throwShuriken(asked) : asked;
  }
  return next;
}

/** Takes the lowest card out of every hand and spends the star. */
function throwShuriken(game: MindGame): MindGame {
  const thrown = game.players.flatMap((player) =>
    player.hand.length === 0 ? [] : [player.hand[0]],
  );
  const shown: MindGame = {
    ...game,
    players: game.players.map((player) => ({
      ...player,
      hand: player.hand.slice(1),
      wantsShuriken: false,
    })),
    shurikens: game.shurikens - 1,
    lost: [...game.lost, ...thrown].sort((a, b) => a - b),
    log: [
      ...game.log,
      `Wurfstern: ${[...thrown].sort((a, b) => a - b).join(", ")} sind weg.`,
    ],
  };
  return settle(shown);
}

/**
 * Closes a move: the game may be lost, the level may be done, or play goes on.
 *
 * @remarks
 * Out of lives ends it at once, wherever the cards are. Otherwise an empty
 * table means the level is through - and if that was the last one, the whole
 * thing is won.
 */
function settle(game: MindGame): MindGame {
  let next: MindGame;
  if (game.lives <= 0) {
    next = {
      ...game,
      phase: "gameOver",
      lives: 0,
      log: [...game.log, "Kein Leben mehr - das war es."],
    };
  } else if (cardsLeft(game) > 0) {
    next = game;
  } else {
    next = finishLevel(game);
  }
  return next;
}

/** Hands out the level's reward, then either goes on or declares it won. */
function finishLevel(game: MindGame): MindGame {
  const reward = rewardFor(game.players.length, game.level);
  const paid: MindGame = {
    ...game,
    lives:
      reward?.gift === "life"
        ? Math.min(MAX_LIVES, game.lives + 1)
        : game.lives,
    shurikens:
      reward?.gift === "shuriken"
        ? Math.min(MAX_SHURIKENS, game.shurikens + 1)
        : game.shurikens,
    lastReward: reward,
    log: [
      ...game.log,
      `Level ${game.level} geschafft${reward === null ? "" : rewardLine(reward.gift)}.`,
    ],
  };
  return game.level >= game.levels
    ? {
        ...paid,
        phase: "gameOver",
        won: true,
        log: [...paid.log, "Alle Level geschafft - gewonnen!"],
      }
    : { ...paid, phase: "levelOver" };
}

/** What the log says about a card coming down. */
function playLine(
  game: MindGame,
  seat: number,
  card: number,
  mistake: Mistake | null,
): string {
  const who = game.players[seat].name;
  return mistake === null
    ? `${who} legt die ${card}.`
    : `${who} legt die ${card} - zu spät, ${mistake.lost.join(", ")} gehen verloren.`;
}

/** What the log says about a reward. */
function rewardLine(gift: "life" | "shuriken"): string {
  return gift === "life" ? " und ein Leben dazu" : " und ein Wurfstern dazu";
}

/**
 * The moves a seat could make right now.
 *
 * @param game - the current game
 * @param seat - the player asking
 * @returns every legal move, so the screen and the computer see the same game
 */
export function legalMoves(game: MindGame, seat: number): readonly MindMove[] {
  const moves: MindMove[] = [];
  const player: Player | undefined = game.players[seat];
  if (player !== undefined) {
    if (game.phase === "levelOver") {
      moves.push({ kind: "nextLevel" });
    } else if (game.phase === "playing" && player.hand.length > 0) {
      moves.push({ kind: "play" });
      if (game.shurikens > 0) {
        moves.push({ kind: "shuriken" });
      }
    }
  }
  return moves;
}
