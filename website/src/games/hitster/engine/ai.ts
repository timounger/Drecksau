/**
 * The computer at the table.
 *
 * @module
 * @remarks
 * A computer that simply read the year off the card would never miss. This
 * one guesses like a person: it has a feeling for when a song came out that
 * is off by a few years - more on easy, less on hard - and puts the card where
 * that feeling says. It names title and artist only some of the time, lays a
 * token on somebody else's timeline when its own feeling says they are clearly
 * wrong, and buys a card when its tokens pile up.
 */
import { freeSlots, playerOnTurn, yearOf } from "./rules";
import { SONGS } from "./songs";
import {
  BUY_COST,
  MAX_TOKENS,
  type Difficulty,
  type HitsterGame,
  type HitsterMove,
} from "./state";

/** How many years the computer's feeling is off, at most, by difficulty. */
const SPREAD: Readonly<Record<Difficulty, number>> = {
  easy: 9,
  medium: 5,
  hard: 2,
};

/** How often the computer can name a song, by difficulty. */
const NAMES: Readonly<Record<Difficulty, number>> = {
  easy: 0.2,
  medium: 0.4,
  hard: 0.65,
};

/** How sure the computer must be, in years, before it calls "HITSTER". */
const SURE: Readonly<Record<Difficulty, number>> = {
  easy: 8,
  medium: 5,
  hard: 3,
};

/** How long the computer seems to think, in ms. */
const BOT_WAIT_MS = 1200;

/**
 * The computer's move for whoever is on turn.
 *
 * @param game - the game
 * @returns the move, or null when nobody is to move
 */
export function aiMove(game: HitsterGame): HitsterMove | null {
  let move: HitsterMove | null = null;
  switch (game.phase) {
    case "place":
      move = placeMove(game);
      break;
    case "challenge":
      move = challengeMove(game);
      break;
    case "reveal":
      move = { kind: "next" };
      break;
    default:
      move = null;
  }
  return move;
}

/**
 * How long the computer waits before moving.
 *
 * @returns the pause in ms
 */
export function botWaitMs(): number {
  return BOT_WAIT_MS;
}

/** Placing the song - or buying a card first when the tokens pile up. */
function placeMove(game: HitsterGame): HitsterMove {
  const me = game.players[game.active];
  const tokens = me?.tokens ?? 0;
  let move: HitsterMove;
  if (tokens >= MAX_TOKENS && tokens >= BUY_COST && game.deck.length > 0) {
    move = { kind: "buy" };
  } else {
    const guess = feeling(game);
    const timeline = me?.timeline ?? [];
    const slot = timeline.filter((song) => yearOf(song) <= guess).length;
    const song = SONGS[game.song];
    const knows = Math.random() < NAMES[game.difficulty] && song !== undefined;
    move = {
      kind: "place",
      slot,
      title: knows ? song.title : "",
      artist: knows ? song.artist : "",
    };
  }
  return move;
}

/** Calling "HITSTER" when the active player's gap is clearly wrong. */
function challengeMove(game: HitsterGame): HitsterMove {
  const asking = playerOnTurn(game);
  const timeline = game.players[game.active]?.timeline ?? [];
  const guess = feeling(game);
  const mine = timeline.filter((song) => yearOf(song) <= guess).length;
  const theirs = game.slot ?? 0;
  // How far the active player's gap is from the year the computer feels.
  const low = timeline[theirs - 1];
  const high = timeline[theirs];
  const off = Math.max(
    low === undefined ? 0 : yearOf(low) - guess,
    high === undefined ? 0 : guess - yearOf(high),
  );
  const free = freeSlots(game);
  const call =
    asking !== null &&
    off >= SURE[game.difficulty] &&
    mine !== theirs &&
    free.includes(mine);
  return call ? { kind: "challenge", slot: mine } : { kind: "pass" };
}

/** The year the computer feels the song is from: the real one, give or take. */
function feeling(game: HitsterGame): number {
  const spread = SPREAD[game.difficulty];
  // Two dice rather than one: small errors are far more likely than big ones.
  const off = Math.round((Math.random() + Math.random() - 1) * spread);
  return yearOf(game.song) + off;
}
