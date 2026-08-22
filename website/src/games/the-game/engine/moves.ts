/**
 * The referee: the only thing in the game that changes a game.
 *
 * @module
 * @remarks
 * One entry point, {@link applyMove}, and it returns `null` for anything it
 * will not allow. Every screen and the online layer go through it, so a client
 * that asks for something impossible is simply not answered.
 *
 * The hard part of this rulebook is not placing a card - it is knowing when the
 * game is over. "Das Spiel endet sofort, wenn ein Spieler, der gerade am Zug
 * ist, nicht mehr die geforderte Mindestanzahl an Karten ablegen kann." Not
 * "has no legal card": **cannot reach the minimum**, which is a different and
 * much more awkward question, because laying the first card changes the row and
 * may open the second. {@link canReach} answers it by actually trying, which is
 * the only way to be right about it.
 */
import { canPlace, gain, isBackward, pileLabel, type Pile } from "./cards";
import {
  cardsLeft,
  isPileIndex,
  requiredThisTurn,
  stillOwed,
  type Hint,
  type TheGame,
  type TheGameMove,
} from "./state";

/** One card that could go on one row. */
export type Play = {
  readonly card: number;
  readonly pile: number;
  /** How far it carries the row: small is good, -10 is the trick. */
  readonly step: number;
};

/** The requests a seat may put on a row. */
const HINTS: readonly Hint[] = ["keep", "small"];

/**
 * Applies a move, or refuses it.
 *
 * @param game - the game as it stands
 * @param seat - the seat asking to move
 * @param move - what they want to do
 * @returns the new game, or null if the move is not allowed now
 */
export function applyMove(
  game: TheGame,
  seat: number,
  move: TheGameMove,
): TheGame | null {
  let next: TheGame | null = null;
  const seated =
    Number.isInteger(seat) && seat >= 0 && seat < game.players.length;
  if (game.phase === "playing" && seated) {
    switch (move.kind) {
      case "play":
        next =
          seat === game.active
            ? playCard(game, seat, move.card, move.pile)
            : null;
        break;
      case "endTurn":
        next = seat === game.active ? finishTurn(game, seat) : null;
        break;
      case "hint":
        // Deliberately not gated on whose turn it is. Asking somebody not to
        // use a row is the one thing this game lets you do while waiting, and
        // it is worth nothing if it only arrives once you are on turn.
        next = setHint(game, seat, move.pile, move.hint);
        break;
      default:
        next = null;
    }
  }
  return next;
}

/**
 * The seat the table is waiting for.
 *
 * @param game - the game
 * @returns the seat on turn, or null once the game is over
 */
export function seatOnTurn(game: TheGame): number | null {
  return game.phase === "playing" ? game.active : null;
}

/**
 * Every card this seat could lay right now, and where.
 *
 * @param game - the game
 * @param seat - the seat asking
 * @returns each playable card and row, cheapest first
 * @remarks
 * Sorted by {@link Play.step}, so the backwards trick comes first and the
 * wasteful jumps last. Both the screen and the computer read this, which is
 * what keeps them agreeing about what is possible.
 */
export function legalPlays(game: TheGame, seat: number): readonly Play[] {
  const plays: Play[] = [];
  if (game.phase === "playing" && seat === game.active) {
    for (const card of game.players[seat].hand) {
      game.piles.forEach((pile, at) => {
        if (canPlace(pile, card)) {
          plays.push({ card, pile: at, step: gain(pile, card) });
        }
      });
    }
  }
  return plays.sort((left, right) => left.step - right.step);
}

/**
 * Whether this seat may stop now.
 *
 * @param game - the game
 * @param seat - the seat asking
 * @returns true once the minimum for this turn is down
 */
export function canEndTurn(game: TheGame, seat: number): boolean {
  return (
    game.phase === "playing" &&
    seat === game.active &&
    game.placed >= requiredThisTurn(game)
  );
}

/**
 * Decides whether the game has just been won or lost.
 *
 * @param game - the game, right after something changed
 * @returns the game, with its phase settled and a closing line in the log
 * @remarks
 * Exported because {@link ./setup} needs it too: a fresh deal is a position
 * like any other, and nothing says it cannot already be hopeless.
 */
export function settle(game: TheGame): TheGame {
  const owed = stillOwed(game);
  const player = game.players[game.active];
  let next = game;
  if (cardsLeft(game) === 0) {
    next = {
      ...note(game, "Alle 98 Karten liegen. Ihr habt Das Spiel besiegt!"),
      phase: "won",
    };
  } else if (owed > 0 && !canReach(game.piles, player.hand, owed)) {
    const left = cardsLeft(game);
    next = {
      ...note(
        game,
        `${player.name} kann nicht mehr ablegen. Vorbei - ${left} Karten bleiben liegen.`,
      ),
      phase: "lost",
    };
  }
  return next;
}

/**
 * Whether a hand can still reach a number of cards on these rows.
 *
 * @param piles - the rows as they stand
 * @param hand - the cards held
 * @param need - how many still have to go down
 * @returns true if some order of plays gets there
 * @remarks
 * A plain search, and it has to be one. Laying a card changes the row it lands
 * on, so "can I lay two" is not "are there two playable cards" - a hand holding
 * 34 and 24 against a row showing 33 can lay both, in that order and only in
 * that order. Counting playable cards would call that hand stuck and end the
 * game a turn early, which is the sort of wrong nobody would ever notice.
 *
 * The search is tiny: at most eight cards, four rows and a depth of three.
 */
function canReach(
  piles: readonly Pile[],
  hand: readonly number[],
  need: number,
): boolean {
  let reached = need <= 0;
  for (let at = 0; at < hand.length && !reached; at += 1) {
    for (let pile = 0; pile < piles.length && !reached; pile += 1) {
      if (canPlace(piles[pile], hand[at])) {
        reached =
          need === 1 ||
          canReach(after(piles, pile, hand[at]), without(hand, at), need - 1);
      }
    }
  }
  return reached;
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

/** The hand without the card at one position. */
function without(hand: readonly number[], at: number): readonly number[] {
  return hand.filter((unused, index) => index !== at);
}

/** Lays one card on one row, if that is a thing this seat may do. */
function playCard(
  game: TheGame,
  seat: number,
  card: number,
  pile: number,
): TheGame | null {
  const player = game.players[seat];
  const row = isPileIndex(pile) ? game.piles[pile] : null;
  let next: TheGame | null = null;
  if (row !== null && player.hand.includes(card) && canPlace(row, card)) {
    const trick = isBackward(row, card);
    next = settle(
      note(
        {
          ...game,
          piles: after(game.piles, pile, card),
          players: game.players.map((each, at) =>
            at === seat ? { ...each, hand: drop(each.hand, card) } : each,
          ),
          placed: game.placed + 1,
        },
        `${player.name}: ${card} auf ${pileLabel(pile)}${
          trick ? " - Rückwärts-Trick!" : "."
        }`,
      ),
    );
  }
  return next;
}

/** Stops the turn, draws back up and passes on - once the minimum is down. */
function finishTurn(game: TheGame, seat: number): TheGame | null {
  let next: TheGame | null = null;
  if (canEndTurn(game, seat)) {
    const filled = refill(game, seat);
    next = settle({
      ...filled,
      active: nextSeat(filled, seat),
      placed: 0,
    });
  }
  return next;
}

/**
 * Draws this seat back up to a full hand.
 *
 * @remarks
 * "Zieht er so viele Karten vom Zugstapel nach, wie er gerade abgelegt hat" -
 * which is the same as filling the hand back up, except at the very end, where
 * the pile runs out mid-draw and hands simply start shrinking.
 */
function refill(game: TheGame, seat: number): TheGame {
  const player = game.players[seat];
  const wanted = Math.max(0, game.handSize - player.hand.length);
  const taken = game.draw.slice(0, Math.min(wanted, game.draw.length));
  return {
    ...game,
    draw: game.draw.slice(taken.length),
    players: game.players.map((each, at) =>
      at === seat ? { ...each, hand: sorted([...each.hand, ...taken]) } : each,
    ),
  };
}

/**
 * Who plays next.
 *
 * @remarks
 * Empty hands are skipped: "sollte ein Spieler im weiteren Verlauf alle seine
 * Karten abgelegt haben, spielen die anderen Spieler ohne ihn weiter." That can
 * only happen once the draw pile is gone; before that everybody fills back up.
 * If nobody holds a card the seat is left where it was, and {@link settle} calls
 * the game won a moment later.
 */
function nextSeat(game: TheGame, from: number): number {
  const count = game.players.length;
  let at = from;
  let found = from;
  let steps = 0;
  while (steps < count && found === from) {
    steps += 1;
    at = (at + 1) % count;
    if (game.players[at].hand.length > 0) {
      found = at;
    }
  }
  return found;
}

/** Puts one seat's request on one row, or takes it off again. */
function setHint(
  game: TheGame,
  seat: number,
  pile: number,
  hint: Hint | null,
): TheGame | null {
  let next: TheGame | null = null;
  if (isPileIndex(pile) && (hint === null || HINTS.includes(hint))) {
    const hints: Record<string, Hint> = { ...game.hints };
    const key = `${seat}:${pile}`;
    if (hint === null) {
      delete hints[key];
    } else {
      hints[key] = hint;
    }
    next = { ...game, hints };
  }
  return next;
}

/** A hand without one card. Values are unique, so this removes exactly one. */
function drop(hand: readonly number[], card: number): readonly number[] {
  return hand.filter((held) => held !== card);
}

/** A hand in reading order. */
function sorted(hand: readonly number[]): readonly number[] {
  return [...hand].sort((left, right) => left - right);
}

/** Adds a line to the log. */
function note(game: TheGame, line: string): TheGame {
  return { ...game, log: [...game.log, line] };
}
