/**
 * The computer players.
 *
 * @module
 * @remarks
 * Two jobs, and they are as different here as they are at the table.
 *
 * The **spymaster** knows the key and has to find a word that ties some of its
 * own together. That is an idea, and a machine without a sense of language does
 * not have ideas - so it works from the categories every codename carries in
 * `words.ts` and says one of those: "Tier: 3". It weighs each category by what
 * it would hit, and it will not touch one that could point at the assassin.
 *
 * The **operative** does not know the key. That is not a simplification, it is
 * the rule, and it is kept honestly: nothing in this file lets a guesser look
 * at {@link Card.owner}. It knows which category its own spymaster meant - it
 * understands the clue perfectly - and picks among the words in that category,
 * which is precisely the position a person is in when they hear "Tier: 3" and
 * count five animals on the table.
 *
 * A seat online whose player has left is guessing without even that, since a
 * person's clue is a word and not a category. It then does the least harm it
 * can: one guess, because the rules demand one, and then it stops.
 */
import { isCluePlayable } from "./moves";
import { createRandom, randomInt, shuffle } from "./random";
import {
  MAX_CLUE,
  agentsLeft,
  other,
  type CodenamesGame,
  type CodenamesMove,
  type Team,
} from "./state";
import { TAGS, TAG_NAMES, tagsOf, type Tag } from "./words";

/** What one of its own words is worth in a clue. */
const MINE = 1;

/** What one of the other side's words costs, if the clue could point at it. */
const THEIRS = 1.2;

/** What a bystander costs - a wasted turn, not a disaster. */
const BYSTANDER = 0.6;

/** How often the operative reaches past the category, the way people do. */
const STRAY_ONE_IN = 7;

/** How far behind it has to be before it risks the one extra guess. */
const LOSING_BY = 2;

/** The shortest the computer ever pauses before acting, in milliseconds. */
const MIN_WAIT_MS = 900;

/** How much longer it may take, so two moves never look mechanical. */
const WAIT_SPREAD_MS = 350;

/** How many pauses it picks between. */
const WAIT_STEPS = 4;

/**
 * The move the computer makes for the seat it is asked about.
 *
 * @param game - the current game
 * @param seat - the seat to play
 * @returns a move, or null when there is nothing for that seat to do
 */
export function aiMove(
  game: CodenamesGame,
  seat: number,
): CodenamesMove | null {
  const player = game.seats[seat];
  let move: CodenamesMove | null = null;
  if (player === undefined || player.team !== game.turn) {
    move = null;
  } else if (game.phase === "clue" && player.role === "spymaster") {
    move = findClue(game, player.team);
  } else if (game.phase === "guess" && player.role === "operative") {
    move = takeGuess(game, player.team);
  }
  return move;
}

/**
 * The spymaster's clue: the category that pays best.
 *
 * @remarks
 * Every category is scored by what it would point at - its own words are worth
 * having, the other side's and the bystanders cost something, and one that
 * could point at the assassin is not scored at all. The rulebook's own tip,
 * turned into the one hard rule the machine keeps: "Before saying your clue out
 * loud, make sure it doesn't relate to the assassin."
 */
function findClue(game: CodenamesGame, team: Team): CodenamesMove | null {
  const open = game.board.filter((card) => !card.revealed);
  const hits = (tag: Tag, owner: string) =>
    open.filter(
      (card) => card.owner === owner && tagsOf(card.word).includes(tag),
    ).length;

  let best: { tag: Tag; count: number; score: number } | null = null;
  for (const tag of TAGS) {
    const mine = hits(tag, team);
    const deadly = hits(tag, "assassin");
    // A category whose own name is still lying on the table is not a clue the
    // referee would take, so the machine is held to the same rule as everybody
    // else. The word list is kept free of such collisions on purpose; this
    // check is what makes that a guarantee rather than a hope.
    if (mine > 0 && deadly === 0 && isCluePlayable(game, TAG_NAMES[tag])) {
      const score =
        mine * MINE -
        hits(tag, other(team)) * THEIRS -
        hits(tag, "bystander") * BYSTANDER;
      if (best === null || score > best.score) {
        best = { tag, count: Math.min(mine, MAX_CLUE), score };
      }
    }
  }

  // Every category left points at the assassin, or at nothing of ours.
  return best === null
    ? lastResort(game, team)
    : {
        kind: "clue",
        word: TAG_NAMES[best.tag],
        count: best.count,
        tag: best.tag,
      };
}

/**
 * A clue when no category is safe.
 *
 * @remarks
 * A spymaster is not allowed to pass, so this never comes back empty. It tries
 * the categories of its own words first - one of those may well point at the
 * assassin too, and then the machine has made the mistake a person makes - and
 * failing even that, it says any category it is allowed to say and hopes.
 *
 * The last step cannot fail. There are more categories than there are words on
 * the table, so at least two labels are always legal, whatever the word list
 * grows into.
 */
function lastResort(game: CodenamesGame, team: Team): CodenamesMove | null {
  const random = createRandom(game.rng + game.log.length);
  const mine = shuffle(
    random,
    game.board.filter((card) => !card.revealed && card.owner === team),
  );
  const sayable = (entry: Tag) => isCluePlayable(game, TAG_NAMES[entry]);
  const tag =
    mine.flatMap((card) => tagsOf(card.word)).find(sayable) ??
    shuffle(random, TAGS).find(sayable) ??
    null;
  return tag === null
    ? null
    : { kind: "clue", word: TAG_NAMES[tag], count: 1, tag };
}

/**
 * The operative's guess.
 *
 * @remarks
 * Among the words carrying the clue's category, and nowhere else - unless the
 * dice say otherwise, which is what {@link STRAY_ONE_IN} is for. People reach
 * past the clue too, usually for a word left over from last time.
 *
 * It stops once it has used up the number it was given, so the extra guess the
 * rules allow is one a person takes and a machine does not.
 */
function takeGuess(game: CodenamesGame, team: Team): CodenamesMove | null {
  const clue = game.clue;
  const random = createRandom(game.rng + game.log.length);
  const open = game.board
    .map((card, at) => ({ card, at }))
    .filter((entry) => !entry.card.revealed);
  let move: CodenamesMove | null = null;
  if (clue === null || open.length === 0) {
    move = null;
  } else {
    const tag = clue.tag;
    const onClue =
      tag === null
        ? []
        : open.filter((entry) => tagsOf(entry.card.word).includes(tag));
    const stray = randomInt(random, STRAY_ONE_IN) === 0;
    const pool = onClue.length > 0 && !stray ? onClue : open;
    const done = clue.guessesMade >= clue.count && clue.count > 0;
    // The number is used up, or nothing that fits the clue is left. Stop - if
    // the rules allow it, and they only do once one guess has been made.
    const wouldStop = clue.guessesMade > 0 && (done || onClue.length === 0);
    move =
      wouldStop && !worthOneMore(game, team, clue)
        ? { kind: "stop" }
        : { kind: "guess", at: shuffle(random, pool)[0].at };
  }
  return move;
}

/**
 * Whether to spend the one extra guess the rules allow.
 *
 * @remarks
 * Only when behind, and only once - "You are allowed only one extra guess."
 * This is the single place a computer player looks at the score, and the score
 * is public: how many of each colour are already face up. It never looks at the
 * key, which is the whole reason a computer operative can be trusted to play.
 */
function worthOneMore(
  game: CodenamesGame,
  team: Team,
  clue: NonNullable<CodenamesGame["clue"]>,
): boolean {
  const behind = agentsLeft(game, team) - agentsLeft(game, other(team));
  return (
    // Never on a clue it does not understand - see the module note. A seat the
    // computer took over online guesses once because it must, and then stops.
    clue.tag !== null &&
    clue.count > 0 &&
    clue.guessesMade <= clue.count &&
    behind >= LOSING_BY
  );
}

/**
 * How long the computer waits before acting, in milliseconds.
 *
 * @param game - the game
 * @returns the pause, so a watcher can follow what happened
 * @remarks
 * Longer than in the other games of the collection, and on purpose: what the
 * machine does here is read a word out and turn a card over, and both of those
 * are things the table needs a moment to take in.
 */
export function botWaitMs(game: CodenamesGame): number {
  const random = createRandom(game.rng + game.log.length);
  return MIN_WAIT_MS + randomInt(random, WAIT_STEPS) * WAIT_SPREAD_MS;
}
