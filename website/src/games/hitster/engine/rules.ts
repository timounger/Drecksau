/**
 * The rules of Hitster: setting up, where a card may go, playing a move, and
 * how a turn runs on until somebody has a full timeline.
 *
 * @module
 */
import { namesSong } from "./guess";
import { createRandom, randomInt, shuffle } from "./random";
import { SONGS } from "./songs";
import {
  BUY_COST,
  MAX_TOKENS,
  START_TOKENS,
  type Challenge,
  type Difficulty,
  type HitsterGame,
  type HistoryEntry,
  type HitsterMove,
  type Player,
} from "./state";

/** Somebody to seat at the table. */
export type Seat = { readonly name: string; readonly isBot: boolean };

/**
 * Sets up a new game.
 *
 * @param seats - everybody at the table
 * @param target - how many cards win
 * @param difficulty - how well the computer knows its music
 * @param seed - shuffles the deck
 * @returns the game, the first song playing
 * @remarks
 * Everybody gets a start card, year up. As in the box, whoever's start card
 * is the oldest goes first.
 */
export function createGame(
  seats: readonly Seat[],
  target: number,
  difficulty: Difficulty,
  seed: number,
): HitsterGame {
  const random = createRandom(seed);
  const order = shuffle(
    random,
    SONGS.map((unused, index) => index),
  );
  const players: Player[] = seats.map((seat, index) => ({
    name: seat.name,
    isBot: seat.isBot,
    timeline: [order[index] ?? 0],
    tokens: START_TOKENS,
  }));
  const deck = order.slice(seats.length);
  const oldest = players.reduce(
    (best, player, index) =>
      yearOf(player.timeline[0] ?? 0) < yearOf(players[best]?.timeline[0] ?? 0)
        ? index
        : best,
    randomInt(random, players.length),
  );
  return {
    players,
    deck: deck.slice(1),
    song: deck[0] ?? 0,
    active: oldest,
    phase: "place",
    slot: null,
    guess: null,
    challenges: [],
    asking: null,
    outcome: null,
    target,
    difficulty,
    winner: null,
    turns: 1,
    history: [],
  };
}

/**
 * The player the table is waiting for.
 *
 * @param game - the game
 * @returns their index, or null once the game is over
 */
export function playerOnTurn(game: HitsterGame): number | null {
  let player: number | null;
  switch (game.phase) {
    case "place":
    case "reveal":
      player = game.active;
      break;
    case "challenge":
      player = game.asking;
      break;
    default:
      player = null;
  }
  return player;
}

/**
 * Whether a song belongs in a gap of a timeline.
 *
 * @param timeline - the songs on it, oldest first
 * @param slot - the gap, 0 before the first card
 * @param song - the song
 * @returns true when its year fits between its neighbours; the same year as
 *   a neighbour fits on either side
 */
export function fits(
  timeline: readonly number[],
  slot: number,
  song: number,
): boolean {
  const year = yearOf(song);
  const before = timeline[slot - 1];
  const after = timeline[slot];
  return (
    slot >= 0 &&
    slot <= timeline.length &&
    (before === undefined || yearOf(before) <= year) &&
    (after === undefined || year <= yearOf(after))
  );
}

/**
 * The year a song came out.
 *
 * @param song - the song's index
 * @returns its year
 */
export function yearOf(song: number): number {
  return SONGS[song]?.year ?? 0;
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
  game: HitsterGame,
  player: number,
  move: HitsterMove,
): HitsterGame | null {
  let next: HitsterGame | null = null;
  if (playerOnTurn(game) === player) {
    switch (move.kind) {
      case "place":
        next = place(game, move.slot, move.title, move.artist);
        break;
      case "skip":
        next = skip(game, true);
        break;
      case "broken":
        next = skip(game, false);
        break;
      case "buy":
        next = buy(game);
        break;
      case "challenge":
        next = challenge(game, player, move.slot);
        break;
      case "pass":
        next = game.phase === "challenge" ? askNext(game) : null;
        break;
      default:
        next = game.phase === "reveal" ? nextTurn(game) : null;
    }
  }
  return next;
}

/**
 * The gaps of the active player's timeline still free for a challenge.
 *
 * @param game - the game
 * @returns every gap but the active player's own and those already taken
 */
export function freeSlots(game: HitsterGame): readonly number[] {
  const timeline = game.players[game.active]?.timeline ?? [];
  const taken = new Set([game.slot, ...game.challenges.map((one) => one.slot)]);
  return Array.from({ length: timeline.length + 1 }, (unused, at) => at).filter(
    (slot) => !taken.has(slot),
  );
}

/** The active player puts the song in a gap; then the others may challenge. */
function place(
  game: HitsterGame,
  slot: number,
  title: string,
  artist: string,
): HitsterGame | null {
  const timeline = game.players[game.active]?.timeline ?? [];
  const legal =
    game.phase === "place" &&
    Number.isInteger(slot) &&
    slot >= 0 &&
    slot <= timeline.length;
  return legal
    ? askNext({
        ...game,
        slot,
        guess: {
          title: title.slice(0, MAX_TEXT),
          artist: artist.slice(0, MAX_TEXT),
        },
        phase: "challenge",
        asking: game.active,
      })
    : null;
}

/** The longest title or artist a guess may have. */
const MAX_TEXT = 80;

/** Another song instead of this one - for a token, or free when it will not play. */
function skip(game: HitsterGame, paid: boolean): HitsterGame | null {
  const player = game.players[game.active];
  const legal =
    game.phase === "place" &&
    player !== undefined &&
    (!paid || player.tokens >= 1);
  let next: HitsterGame | null = null;
  if (legal) {
    const drawn = draw(game);
    next =
      drawn === null
        ? finish(game)
        : {
            ...drawn,
            players: game.players.map((one, index) =>
              index === game.active && paid
                ? { ...one, tokens: one.tokens - 1 }
                : one,
            ),
            history: [
              ...historyOf(game),
              { kind: "skipped", player: game.active, paid },
            ],
          };
  }
  return next;
}

/** Three tokens for the next card of the deck, laid straight on the timeline. */
function buy(game: HitsterGame): HitsterGame | null {
  const player = game.players[game.active];
  const card = game.deck[0];
  const legal =
    game.phase === "place" &&
    player !== undefined &&
    player.tokens >= BUY_COST &&
    card !== undefined;
  let next: HitsterGame | null = null;
  if (legal) {
    next = settleWinner({
      ...game,
      deck: game.deck.slice(1),
      history: [
        ...historyOf(game),
        { kind: "bought", player: game.active, song: card },
      ],
      players: game.players.map((one, index) =>
        index === game.active
          ? {
              ...one,
              tokens: one.tokens - BUY_COST,
              timeline: insert(one.timeline, card),
            }
          : one,
      ),
    });
  }
  return next;
}

/** Somebody lays a token in a free gap of the active player's timeline. */
function challenge(
  game: HitsterGame,
  player: number,
  slot: number,
): HitsterGame | null {
  const legal =
    game.phase === "challenge" &&
    (game.players[player]?.tokens ?? 0) >= 1 &&
    freeSlots(game).includes(slot);
  return legal
    ? askNext({
        ...game,
        challenges: [...game.challenges, { player, slot }],
      })
    : null;
}

/**
 * Hands the question on to the next player who could still challenge, or
 * turns the card over when nobody is left.
 */
function askNext(game: HitsterGame): HitsterGame {
  const count = game.players.length;
  // Each is asked once, in seat order from the player after the active one.
  const from = ((game.asking ?? game.active) - game.active + count) % count;
  let asking: number | null = null;
  for (let step = from + 1; step < count && asking === null; step++) {
    const index = (game.active + step) % count;
    const player = game.players[index];
    if (
      player !== undefined &&
      player.tokens >= 1 &&
      freeSlots(game).length > 0
    ) {
      asking = index;
    }
  }
  return asking === null
    ? reveal({ ...game, asking: null })
    : { ...game, asking };
}

/** Turns the card over: who keeps it, who takes it, who earns a token. */
function reveal(game: HitsterGame): HitsterGame {
  const active = game.players[game.active];
  const slot = game.slot ?? 0;
  const song = SONGS[game.song];
  const right = active !== undefined && fits(active.timeline, slot, game.song);
  const named =
    song !== undefined &&
    game.guess !== null &&
    namesSong(song, game.guess.title, game.guess.artist);
  const earned = named && (active?.tokens ?? MAX_TOKENS) < MAX_TOKENS;
  const thief: Challenge | undefined = right
    ? undefined
    : game.challenges.find((one) =>
        fits(active?.timeline ?? [], one.slot, game.song),
      );
  const players = game.players.map((player, index) => {
    let next = player;
    if (index === game.active) {
      next = {
        ...next,
        tokens: next.tokens + (earned ? 1 : 0),
        timeline: right ? insert(next.timeline, game.song) : next.timeline,
      };
    }
    if (game.challenges.some((one) => one.player === index)) {
      next = { ...next, tokens: next.tokens - 1 };
    }
    if (thief?.player === index) {
      next = { ...next, timeline: insert(next.timeline, game.song) };
    }
    return next;
  });
  const outcome = {
    song: game.song,
    player: game.active,
    slot,
    right,
    named,
    earned,
    stolenBy: thief?.player ?? null,
    challenges: game.challenges,
  };
  return settleWinner({
    ...game,
    players,
    phase: "reveal",
    outcome,
    history: [...historyOf(game), { kind: "placed", outcome }],
  });
}

/**
 * The history so far.
 *
 * @param game - the game
 * @returns its lines, oldest first - none for a game saved before there was
 *   a history
 */
export function historyOf(game: HitsterGame): readonly HistoryEntry[] {
  return game.history ?? [];
}

/** Ends the game when somebody has their full timeline. */
function settleWinner(game: HitsterGame): HitsterGame {
  const winner = game.players.findIndex(
    (player) => player.timeline.length >= game.target,
  );
  return winner < 0 ? game : { ...game, phase: "over", winner };
}

/** On to the next player, with a new song. */
function nextTurn(game: HitsterGame): HitsterGame {
  const drawn = draw({
    ...game,
    active: (game.active + 1) % game.players.length,
  });
  return drawn === null ? finish(game) : { ...drawn, turns: game.turns + 1 };
}

/** The next song from the deck, the turn reset; null when the deck is empty. */
function draw(game: HitsterGame): HitsterGame | null {
  const song = game.deck[0];
  return song === undefined
    ? null
    : {
        ...game,
        song,
        deck: game.deck.slice(1),
        phase: "place",
        slot: null,
        guess: null,
        challenges: [],
        asking: null,
        outcome: null,
      };
}

/** The deck ran out: whoever has the longest timeline wins. */
function finish(game: HitsterGame): HitsterGame {
  const winner = game.players.reduce(
    (best, player, index) =>
      player.timeline.length > (game.players[best]?.timeline.length ?? 0)
        ? index
        : best,
    0,
  );
  return { ...game, phase: "over", winner };
}

/** A timeline with a song put where its year belongs. */
function insert(timeline: readonly number[], song: number): readonly number[] {
  const year = yearOf(song);
  const at = timeline.findIndex((one) => yearOf(one) > year);
  return at < 0
    ? [...timeline, song]
    : [...timeline.slice(0, at), song, ...timeline.slice(at)];
}
