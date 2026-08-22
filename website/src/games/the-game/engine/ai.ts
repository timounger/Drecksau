/**
 * The computer partner.
 *
 * @module
 * @remarks
 * **It cannot see your hand, and that is the point.** This game is cooperative
 * and its whole tension comes from not being allowed to say what you hold; a
 * partner that peeked would not be playing the same game, and every turn it
 * took would quietly be better than a person could manage. So it reads exactly
 * what you read: the four rows, and the requests standing on them.
 *
 * What it does with that is the strategy every table arrives at within one
 * game:
 *
 * 1. **Take the backwards trick whenever it is there.** Ten cards back is worth
 *    more than any ordinary play, and it never gets cheaper by waiting.
 * 2. **Keep jumps small.** A row carried from 12 to 70 has eaten fifty-eight
 *    numbers nobody will ever play.
 * 3. **Plan the whole obligation at once**, not one card at a time - see
 *    {@link plan}. This is what separates it from an obvious player.
 * 4. **Stop at the minimum** unless the next card is nearly free. Cards held can
 *    still be aimed; cards played are spent.
 * 5. **Never play into a dead end.** Owing two and laying the wrong first card
 *    loses outright, so every opening card is run past the referee first.
 *
 * It also listens: a row somebody has asked it to leave alone gets a heavy
 * penalty rather than a ban, because a ban would let one marker end the game.
 * And it asks - see {@link sayingSomething}.
 */
import { BACKWARD, canPlace, gain, topOf, type Pile } from "./cards";
import { applyMove, canEndTurn, legalPlays, type Play } from "./moves";
import {
  hintKey,
  stillOwed,
  type Hint,
  type TheGame,
  type TheGameMove,
} from "./state";

/** A jump this small is close enough to free to be worth taking anyway. */
const CHEAP_STEP = 5;

/** What the computer takes "nur ein ganz kleiner Sprung" to mean. */
const SMALL_LIMIT = 5;

/** Worth more than any small jump: laying this card sets up the trick. */
const CHAIN_BONUS = 12;

/** What a "bitte nicht hier" costs a row in the computer's eyes. */
const KEEP_PENALTY = 40;

/** What ignoring a "nur kleine Sprünge" costs. */
const SMALL_PENALTY = 30;

/** How many candidates each level of the plan looks at. */
const BRANCH = 8;

/** The cost of a turn that cannot be finished at all. */
const DEAD_END = 1000;

/** How long the computer appears to think, per card. */
const THINK_MS = 700;

/** Faster once it is mid-turn, so a long turn does not drag. */
const QUICK_MS = 350;

/** What one seat is asked to do with each row, by row index. */
type Asked = readonly (Hint | null)[];

/**
 * The computer's next move for one seat.
 *
 * @param game - the game
 * @param seat - the seat the computer is playing
 * @returns the move, or null if there is nothing it may do
 */
export function aiMove(game: TheGame, seat: number): TheGameMove | null {
  const owed = stillOwed(game);
  const chosen = owed > 0 ? owedPlay(game, seat, owed) : extraPlay(game, seat);
  let move: TheGameMove | null = null;
  if (chosen !== null) {
    move = { kind: "play", card: chosen.card, pile: chosen.pile };
  } else if (canEndTurn(game, seat)) {
    move = sayingSomething(game, seat) ?? { kind: "endTurn" };
  }
  return move;
}

/**
 * How long to wait before the computer moves.
 *
 * @param game - the game
 * @returns a pause in milliseconds
 */
export function botWaitMs(game: TheGame): number {
  return game.placed > 0 ? QUICK_MS : THINK_MS;
}

/**
 * The card to lay when the turn still owes some.
 *
 * @remarks
 * Dead ends are ruled out first, by the referee rather than by a second opinion
 * about the rules: a candidate is played and the resulting game asked whether it
 * is lost. Only if **every** candidate loses does the list come back unfiltered,
 * because at that point the game is over whatever it does.
 */
function owedPlay(game: TheGame, seat: number, owed: number): Play | null {
  const plays = legalPlays(game, seat);
  const alive = plays.filter(
    (play) =>
      applyMove(game, seat, { kind: "play", card: play.card, pile: play.pile })
        ?.phase !== "lost",
  );
  const usable = alive.length > 0 ? alive : plays;
  return usable.length === 0
    ? null
    : plan(
        game.piles,
        game.players[seat].hand,
        askedOf(game, seat),
        owed,
        usable,
      ).first;
}

/**
 * The best sequence of cards that satisfies an obligation, as its first card.
 *
 * @param piles - the rows as they stand
 * @param hand - the cards held
 * @param asked - what the others have asked of each row
 * @param depth - how many cards still have to go down
 * @param only - the candidates for this level, or null to take them all
 * @returns the total cost of the best sequence, and the card it starts with
 * @remarks
 * **This is the whole difference between a partner and a card-shovel.** Owing
 * two or three cards, the cheap-looking first card is regularly the wrong one:
 * laying 34 on a row showing 33 costs one, but if the hand also holds 35 and 36
 * the right opening is the one that lets all three go down a step at a time. A
 * player picking each card on its own merits plays the 34 and then throws the
 * other two somewhere expensive.
 *
 * Measured over 40 deals per table size, planning the obligation instead of
 * the card is worth three to four cards a game: solo 22 left becomes 18, two
 * players 12 becomes 7, five players 8 becomes 6. The **pro variant barely
 * moves** (30 to 28) - three forced cards a turn leave so little choice that
 * there is not much of a plan left to make, which is presumably why the box
 * calls it the hard one.
 *
 * It costs nothing anybody would feel: the search is at most {@link BRANCH}
 * wide and three deep.
 *
 * It simulates rows and hand directly rather than going through the referee.
 * The referee re-checks the whole position on every move, which is right for a
 * referee and far too slow to do a few hundred times per decision - and the
 * only judgement it adds here, "is this a dead end", has already been asked of
 * it by {@link owedPlay} for the card actually being chosen.
 */
function plan(
  piles: readonly Pile[],
  hand: readonly number[],
  asked: Asked,
  depth: number,
  only: readonly Play[] | null,
): { readonly cost: number; readonly first: Play | null } {
  let best: { cost: number; first: Play | null } = { cost: 0, first: null };
  if (depth > 0) {
    const options = (only ?? movesOn(piles, hand))
      .map((play) => ({ play, cost: costOf(piles, hand, asked, play, depth) }))
      .sort((left, right) => left.cost - right.cost)
      .slice(0, BRANCH);
    best = { cost: DEAD_END * depth, first: options[0]?.play ?? null };
    for (const option of options) {
      const rest = plan(
        after(piles, option.play.pile, option.play.card),
        hand.filter((card) => card !== option.play.card),
        asked,
        depth - 1,
        null,
      );
      const total = option.cost + rest.cost;
      if (total < best.cost) {
        best = { cost: total, first: option.play };
      }
    }
  }
  return best;
}

/**
 * A card to lay beyond the minimum, if one is nearly free.
 *
 * @remarks
 * The other half of the strategy, and the half that is easy to get wrong in the
 * greedy direction. A card kept can still be aimed at whatever the rows turn
 * into; a card laid is spent. So beyond what the turn demands, only bargains.
 */
function extraPlay(game: TheGame, seat: number): Play | null {
  const asked = askedOf(game, seat);
  const hand = game.players[seat].hand;
  const best = legalPlays(game, seat)
    .map((play) => ({ play, cost: costOf(game.piles, hand, asked, play, 1) }))
    .sort((left, right) => left.cost - right.cost)[0];
  return best !== undefined && best.play.step <= CHEAP_STEP ? best.play : null;
}

/** Every card that could go on every row, unranked. */
function movesOn(piles: readonly Pile[], hand: readonly number[]): Play[] {
  const plays: Play[] = [];
  for (const card of hand) {
    piles.forEach((pile, at) => {
      if (canPlace(pile, card)) {
        plays.push({ card, pile: at, step: gain(pile, card) });
      }
    });
  }
  return plays;
}

/**
 * What one play costs, all things considered. Lower is better.
 *
 * @param piles - the rows as they stand
 * @param hand - the cards held, this card included
 * @param asked - what the others have asked of each row
 * @param play - the card and row being priced
 * @param depth - how many cards, this one included, the plan still simulates
 * @returns the cost; the backwards trick is naturally the cheapest at -10
 * @remarks
 * The base is how far the card carries the row. On top of that, penalties for
 * walking over what somebody has asked - and the one term that has to know
 * where it sits in a plan.
 *
 * **The chain bonus only counts on the last card the plan looks at.** It stands
 * for a good thing that has not happened yet: the trick partner is still in
 * hand, so the row stays worth something. Deeper in a plan that future is not a
 * guess any more, it is the next line of the plan and it is already priced at
 * its own -10. Counted in both places the same ten cards were worth twenty-two,
 * and the computer would happily set a trick up and burn it immediately rather
 * than lay two genuinely cheap cards. That cost the solo game about six cards a
 * deal, and it looked like planning being a bad idea rather than like a bug.
 */
function costOf(
  piles: readonly Pile[],
  hand: readonly number[],
  asked: Asked,
  play: Play,
  depth: number,
): number {
  const pile = piles[play.pile];
  const rest = hand.filter((card) => card !== play.card);
  const chains = depth <= 1 && rest.includes(partnerOf(pile, play.card));
  const wish = asked[play.pile];
  return (
    play.step -
    (chains ? CHAIN_BONUS : 0) +
    (wish === "keep" ? KEEP_PENALTY : 0) +
    (wish === "small" && play.step > SMALL_LIMIT ? SMALL_PENALTY : 0)
  );
}

/** The rows with one more card on one of them. */
function after(
  piles: readonly Pile[],
  pile: number,
  card: number,
): readonly Pile[] {
  return piles.map((each, at) =>
    at === pile ? { ...each, cards: [...each.cards, card] } : each,
  );
}

/**
 * The card that would be the backwards trick once this one is on top.
 *
 * @remarks
 * Ten below on an ascending row, ten above on a descending one - the two ends
 * of the same move, which is why {@link ./cards.gain} measures them alike.
 */
function partnerOf(pile: Pile, top: number): number {
  return pile.kind === "up" ? top - BACKWARD : top + BACKWARD;
}

/** What everybody else has asked of each row, from this seat's point of view. */
function askedOf(game: TheGame, seat: number): Asked {
  return game.piles.map((unused, pile) => {
    const others = game.players
      .map((ignored, at) => at)
      .filter((at) => at !== seat)
      .map((at) => game.hints[hintKey(at, pile)])
      .filter((hint): hint is Hint => hint !== undefined);
    return others.includes("keep") ? "keep" : (others[0] ?? null);
  });
}

/**
 * The one thing the computer says out loud, if it has something to say.
 *
 * @returns a move that puts a request on a row, or takes a stale one off
 * @remarks
 * The rules allow talking as long as no number is named, and a partner who
 * never says anything is only half a partner. So before it passes, it marks the
 * row it is holding something close to: **"hier bitte nur einen kleinen
 * Sprung"**. That is the honest form of the sentence the rulebook itself gives
 * as an example, and it gives away no more than a person would.
 *
 * One marker at a time, and the stale one comes off first - a table with every
 * row marked says nothing at all.
 */
function sayingSomething(game: TheGame, seat: number): TheGameMove | null {
  const wanted = wantedHint(game, seat);
  const stale = game.piles
    .map((unused, pile) => pile)
    .find(
      (pile) =>
        game.hints[hintKey(seat, pile)] !== undefined && pile !== wanted,
    );
  let move: TheGameMove | null = null;
  if (stale !== undefined) {
    move = { kind: "hint", pile: stale, hint: null };
  } else if (wanted !== null && game.hints[hintKey(seat, wanted)] !== "small") {
    move = { kind: "hint", pile: wanted, hint: "small" };
  }
  return move;
}

/** The row the computer is holding something close to, if any. */
function wantedHint(game: TheGame, seat: number): number | null {
  const hand = game.players[seat].hand;
  let best: number | null = null;
  let closest = SMALL_LIMIT + 1;
  game.piles.forEach((pile, at) => {
    for (const card of hand) {
      const step = pile.kind === "up" ? card - topOf(pile) : topOf(pile) - card;
      if (step > 0 && step < closest) {
        closest = step;
        best = at;
      }
    }
  });
  return best;
}
