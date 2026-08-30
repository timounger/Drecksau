/**
 * The referee: every move a seat can make, and what it does to the game.
 *
 * @module
 * @remarks
 * One entry point, {@link applyMove}, and one answer for an illegal move:
 * `null`. Nothing here reaches for a screen, a clock or a random number that is
 * not carried in the state, so the same move on the same game gives the same
 * result on every device in an online room.
 */
import { beats, sortHand, type Card, type Rank } from "./cards";
import { dealRound } from "./setup";
import {
  givesTo,
  isOut,
  owesCards,
  pointsFor,
  seatWith,
  stillIn,
  titleFor,
  type ArschlochGame,
  type ArschlochMove,
  type ArschlochPlayer,
  type Handover,
  type Title,
} from "./state";

/**
 * Whose turn it is.
 *
 * @param game - the game
 * @returns the seat to move, or null when the game is over
 */
export function seatOnTurn(game: ArschlochGame): number | null {
  let seat: number | null;
  if (game.phase === "gameOver") {
    seat = null;
  } else if (game.phase === "passing") {
    seat = game.owed.length > 0 ? game.owed[0].from : null;
  } else {
    seat = game.active;
  }
  return seat;
}

/**
 * Applies a move, if the rules allow it.
 *
 * @param game - the game
 * @param seat - who is moving
 * @param move - what they want to do
 * @returns the game afterwards, or null if the move was not allowed
 */
export function applyMove(
  game: ArschlochGame,
  seat: number,
  move: ArschlochMove,
): ArschlochGame | null {
  let next: ArschlochGame | null = null;
  // Dealing the next round is the one move that belongs to the table rather
  // than to a seat: the round is over, nobody is on turn in any real sense,
  // and whoever reaches for the cards first may deal them.
  const theirs =
    seatOnTurn(game) === seat ||
    (move.kind === "next" && game.phase === "roundOver");
  if (theirs) {
    switch (move.kind) {
      case "play":
        next = doPlay(game, seat, move.cards);
        break;
      case "pass":
        next = doPass(game, seat);
        break;
      case "give":
        next = doGive(game, seat, move.cards);
        break;
      case "next":
        next = doNext(game);
        break;
      default:
        next = null;
    }
  }
  return next;
}

/* ---------------------------------------------------------------- playing */

/**
 * Whether a set of cards may go on the table right now.
 *
 * @param game - the game
 * @param seat - who wants to play them
 * @param cards - the card ids
 * @returns true when the rules allow it
 * @remarks
 * Three conditions, and all three come out of one sentence: "Die folgenden
 * Spieler muessen gleichviele oder hoeherwertige Karten spielen oder passen."
 * The cards have to be equal in rank, there have to be as many as on the pile,
 * and they have to beat it. An empty table is the free choice of the leader,
 * who decides the rank and the count for everybody else.
 */
export function canPlay(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): boolean {
  const held = heldCards(game, seat, cards);
  const rank = held.length > 0 ? held[0].rank : null;
  return (
    game.phase === "playing" &&
    held.length === cards.length &&
    rank !== null &&
    held.every((card) => card.rank === rank) &&
    (game.pile.length === 0 ||
      (held.length === game.pile.length && beats(rank, game.pile[0].rank)))
  );
}

/**
 * Whether passing is allowed right now.
 *
 * @param game - the game
 * @returns true while there is a pile to pass on
 * @remarks
 * Passing on an empty table would hand the lead nowhere. Somebody has to open
 * a trick, and being the one who opens it is what leading means.
 */
export function canPass(game: ArschlochGame): boolean {
  return game.phase === "playing" && game.pile.length > 0;
}

/** The cards of a hand that carry these ids, if every id is held once. */
function heldCards(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): readonly Card[] {
  const ids = new Set(cards);
  return ids.size !== cards.length || cards.length === 0
    ? []
    : game.players[seat].hand.filter((card) => ids.has(card.id));
}

/** Puts cards on the table. */
function doPlay(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): ArschlochGame | null {
  let next: ArschlochGame | null = null;
  if (canPlay(game, seat, cards)) {
    const played = heldCards(game, seat, cards);
    const ids = new Set(cards);
    const withoutThem = withHand(
      game,
      seat,
      game.players[seat].hand.filter((card) => !ids.has(card.id)),
    );
    const laid = note(
      { ...withoutThem, pile: played, lead: seat },
      `${nameOf(game, seat)}: legt ${spell(played)}.`,
    );
    next = afterMove(finishIfEmpty(laid, seat));
  }
  return next;
}

/** Sits out the rest of this trick. */
function doPass(game: ArschlochGame, seat: number): ArschlochGame | null {
  return canPass(game)
    ? afterMove(
        note(
          withPlayer(game, seat, { passed: true }),
          `${nameOf(game, seat)}: passt.`,
        ),
      )
    : null;
}

/**
 * Books a seat as finished when their last card has gone.
 *
 * @remarks
 * The place is taken the moment the hand is empty, and the order those places
 * are taken in is the order of the titles.
 */
function finishIfEmpty(game: ArschlochGame, seat: number): ArschlochGame {
  return isOut(game, seat) && !game.out.includes(seat)
    ? note(
        { ...game, out: [...game.out, seat] },
        `${nameOf(game, seat)}: ist raus - Platz ${game.out.length + 1}.`,
      )
    : game;
}

/**
 * Hands the turn on, closes the trick, and ends the round when it is over.
 *
 * @param game - the game right after a play or a pass
 * @returns the game with the next seat to move
 * @remarks
 * A trick is over when nobody but the leader is left to answer it - which
 * covers both "everybody passed" and "everybody else has run out". The pile is
 * then cleared and whoever put it there leads again; if that player has just
 * gone out with it, the lead moves on to the next one still holding cards,
 * because a table cannot wait for somebody who has left it.
 */
function afterMove(game: ArschlochGame): ArschlochGame {
  const playing = game.players.filter((unused, seat) => !isOut(game, seat));
  let next: ArschlochGame;
  if (playing.length <= 1) {
    next = endRound(game);
  } else if (answerers(game) === 0) {
    // Clear the passes first, then look for the opener: who is still in is a
    // question about the new trick, not the old one. Read off the old trick,
    // everybody counts as out at the end of it, and the lead fell to the one
    // player who had just finished.
    const cleared = clearPasses({ ...game, pile: [], lead: null });
    const leader = game.lead;
    const opener =
      leader !== null && !isOut(cleared, leader)
        ? leader
        : nextSeat(cleared, leader);
    next = note(
      { ...cleared, active: opener },
      `${nameOf(game, opener)}: bekommt den Stich und spielt aus.`,
    );
  } else {
    next = { ...game, active: nextSeat(game, game.active) };
  }
  return next;
}

/** How many seats could still answer the pile on the table. */
function answerers(game: ArschlochGame): number {
  return game.players.filter(
    (unused, seat) => seat !== game.lead && stillIn(game, seat),
  ).length;
}

/** Everybody is in again once a new trick starts. */
function clearPasses(game: ArschlochGame): ArschlochGame {
  return {
    ...game,
    players: game.players.map((player) => ({ ...player, passed: false })),
  };
}

/**
 * The next seat that still has something to do.
 *
 * @param game - the game
 * @param from - the seat to start looking after, or null to start at zero
 * @returns the next seat still in the trick
 */
function nextSeat(game: ArschlochGame, from: number | null): number {
  const seats = game.players.length;
  const start = from === null ? 0 : from;
  let found = start;
  for (let step = 1; step <= seats; step += 1) {
    const at = (start + step) % seats;
    if (stillIn(game, at)) {
      found = at;
      break;
    }
  }
  return found;
}

/* ----------------------------------------------------------------- rounds */

/**
 * Ends the round: titles, points, and what the next round starts from.
 *
 * @remarks
 * "Das Spiel endet, wenn der vorletzte Spieler seine Karten losgeworden ist" -
 * the last one holding cards is the Arschloch and does not play on alone.
 */
function endRound(game: ArschlochGame): ArschlochGame {
  const seats = game.players.length;
  const order = [
    ...game.out,
    ...game.players
      .map((unused, seat) => seat)
      .filter((seat) => !game.out.includes(seat)),
  ];
  const players = game.players.map((player, seat) => {
    const place = order.indexOf(seat);
    return {
      ...player,
      title: titleFor(place, seats),
      score: player.score + pointsFor(place, seats),
      passed: false,
    };
  });
  const ranked: ArschlochGame = { ...game, players, pile: [], lead: null };
  const named = order
    .map(
      (seat, place) =>
        `${nameOf(ranked, seat)} (${TITLE_WORDS[titleFor(place, seats)]})`,
    )
    .join(", ");
  const done = game.round >= game.rounds;
  return note(
    done
      ? { ...ranked, phase: "gameOver", winners: bestScores(players) }
      : { ...ranked, phase: "roundOver" },
    `Runde ${game.round} vorbei: ${named}.`,
  );
}

/** The seats with the highest score - more than one when they are level. */
function bestScores(players: readonly ArschlochPlayer[]): readonly number[] {
  const best = Math.max(...players.map((player) => player.score));
  return players
    .map((unused, seat) => seat)
    .filter((seat) => players[seat].score === best);
}

/**
 * Deals the next round and works out who owes whom.
 *
 * @remarks
 * The low titles have no choice: their **highest** cards go, and the referee
 * takes them straight away. What comes back is a decision, so the Praesident
 * and the Vizepraesident are asked for it. That split is the whole exchange,
 * and it is why one half happens here and the other half is a move.
 */
function doNext(game: ArschlochGame): ArschlochGame | null {
  let next: ArschlochGame | null = null;
  if (game.phase === "roundOver") {
    const dealt = takeTribute(dealRound({ ...game, round: game.round + 1 }));
    next = { ...dealt, phase: dealt.owed.length > 0 ? "passing" : "playing" };
  }
  return next;
}

/** Moves the highest cards of the low titles to the high ones. */
function takeTribute(game: ArschlochGame): ArschlochGame {
  const owed: Handover[] = [];
  let next = game;
  for (const title of LOW_TITLES) {
    const from = seatWith(next, title);
    const toTitle = givesTo(title);
    const to = toTitle === null ? null : seatWith(next, toTitle);
    const count = owesCards(title);
    if (from !== null && to !== null && count > 0) {
      const hand = sortHand(next.players[from].hand);
      const best = hand.slice(hand.length - count);
      next = note(
        give(next, from, to, best),
        `${nameOf(next, from)}: gibt ${spell(best)} an ${nameOf(next, to)}.`,
      );
      owed.push({ from: to, to: from, count });
    }
  }
  return { ...next, owed };
}

/** The titles that owe cards, worst first. */
const LOW_TITLES: readonly Title[] = ["arschloch", "vizearsch"];

/** Hands cards from one seat to another. */
function give(
  game: ArschlochGame,
  from: number,
  to: number,
  cards: readonly Card[],
): ArschlochGame {
  const ids = new Set(cards.map((card) => card.id));
  const shrunk = withHand(
    game,
    from,
    game.players[from].hand.filter((card) => !ids.has(card.id)),
  );
  return withHand(shrunk, to, sortHand([...shrunk.players[to].hand, ...cards]));
}

/**
 * Whether these cards may be handed back.
 *
 * @param game - the game
 * @param seat - the seat handing them over
 * @param cards - the card ids
 * @returns true when they are held and there are as many as owed
 */
export function canGive(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): boolean {
  const owed = game.owed[0];
  const held = heldCards(game, seat, cards);
  return (
    game.phase === "passing" &&
    owed !== undefined &&
    owed.from === seat &&
    held.length === owed.count &&
    held.length === cards.length
  );
}

/** Hands the chosen cards back, and starts the round once nothing is owed. */
function doGive(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): ArschlochGame | null {
  let next: ArschlochGame | null = null;
  if (canGive(game, seat, cards)) {
    const owed = game.owed[0];
    const chosen = heldCards(game, seat, cards);
    const moved = note(
      give(game, seat, owed.to, chosen),
      `${nameOf(game, seat)}: gibt ${spell(chosen)} zurück an ${nameOf(game, owed.to)}.`,
    );
    const rest = game.owed.slice(1);
    next =
      rest.length > 0
        ? { ...moved, owed: rest }
        : { ...moved, owed: [], phase: "playing" };
  }
  return next;
}

/* ---------------------------------------------------------------- helpers */

/** What the five titles are called in the log. */
const TITLE_WORDS: Readonly<Record<Title, string>> = {
  praesident: "Präsident",
  vize: "Vizepräsident",
  buerger: "Bürger",
  vizearsch: "Vizearschloch",
  arschloch: "Arschloch",
};

/** What the eight ranks are called in the log. */
const RANK_WORDS: Readonly<Record<Rank, string>> = {
  sieben: "Sieben",
  acht: "Acht",
  neun: "Neun",
  bube: "Bube",
  dame: "Dame",
  koenig: "König",
  zehn: "Zehn",
  ass: "Ass",
};

/** A player with some fields changed. */
function withPlayer(
  game: ArschlochGame,
  seat: number,
  fields: Partial<ArschlochPlayer>,
): ArschlochGame {
  return {
    ...game,
    players: game.players.map((player, at) =>
      at === seat ? { ...player, ...fields } : player,
    ),
  };
}

/** A player with a new hand. */
function withHand(
  game: ArschlochGame,
  seat: number,
  hand: readonly Card[],
): ArschlochGame {
  return withPlayer(game, seat, { hand });
}

/** Adds a line to the log. */
function note(game: ArschlochGame, line: string): ArschlochGame {
  return { ...game, log: [...game.log, line] };
}

/** What a seat is called. */
function nameOf(game: ArschlochGame, seat: number): string {
  return game.players[seat].name;
}

/** Cards as words, for the log. */
function spell(cards: readonly Card[]): string {
  const rank = cards.length > 0 ? RANK_WORDS[cards[0].rank] : "";
  return cards.length === 1 ? rank : `${cards.length}x ${rank}`;
}

/**
 * Whether the game has been decided.
 *
 * @param game - the game
 * @returns true once the last round has been played
 */
export function isFinished(game: ArschlochGame): boolean {
  return game.phase === "gameOver";
}
