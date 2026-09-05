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
import {
  RANKS,
  beats,
  sortHand,
  strengthOf,
  type Card,
  type Rank,
} from "./cards";
import { openRound, packFor } from "./setup";
import {
  isOut,
  pointsFor,
  wishableIds,
  stillIn,
  titleFor,
  type ArschlochGame,
  type ArschlochMove,
  type ArschlochPlayer,
  type HandoverKind,
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
      case "drop":
        next = doDrop(game, seat, move.cards);
        break;
      case "wish":
        next = doWish(game, seat, move.cards);
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
 * The cards of a hand that could go on the table right now.
 *
 * @param game - the game
 * @param seat - whose hand to look at
 * @returns the ids that are part of at least one legal play
 * @remarks
 * Two conditions, not one. A card has to **beat** the pile, and the hand has to
 * hold **as many of that rank** as the pile is deep: against a pair, a single
 * Koenig is as unplayable as a Sieben, and a screen that greys out only the low
 * cards tells half the rule.
 *
 * On an empty table everything is playable - that is what leading means.
 */
export function playableIds(
  game: ArschlochGame,
  seat: number,
): readonly string[] {
  const hand = game.players[seat].hand;
  const need = game.pile.length;
  const enough = (rank: Rank): boolean =>
    hand.filter((card) => card.rank === rank).length >= need;
  return (
    need === 0
      ? hand
      : hand.filter(
          (card) => beats(card.rank, game.pile[0].rank) && enough(card.rank),
        )
  ).map((card) => card.id);
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
      {
        ...withoutThem,
        pile: played,
        seen: [...(game.seen ?? []), ...played],
        lead: seat,
      },
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
function afterMove(before: ArschlochGame): ArschlochGame {
  const game = skipHopeless(before);
  const playing = game.players.filter((unused, seat) => !isOut(game, seat));
  let next: ArschlochGame;
  if (playing.length <= 1) {
    next = endRound(game);
  } else if (answerers(game) === 0 || !beatable(game)) {
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
      beatable(game)
        ? `${nameOf(game, opener)}: bekommt den Stich und spielt aus.`
        : `Das kann niemand mehr überbieten - ${nameOf(game, opener)} spielt aus.`,
    );
  } else {
    next = { ...game, active: nextSeat(game, game.active) };
  }
  return next;
}

/**
 * Whether anybody at all could still beat what lies on the table.
 *
 * @param game - the game
 * @returns true while a set that beats the pile could still be held
 * @remarks
 * Read off the played cards and nothing else. Four Damen are in the pack; if
 * three of them have been played, no pair of Damen exists any more, and a table
 * that has been paying attention knows it. Asking everybody to pass on a pile
 * that provably cannot be beaten is asking a question with one answer.
 *
 * What it deliberately does **not** do is look into anybody's hand. That would
 * skip a player for a reason the others cannot check, and the pass a player
 * makes is information the table is entitled to see them make.
 */
export function beatable(game: ArschlochGame): boolean {
  const pile = game.pile;
  const size = pile.length;
  return (
    size === 0 ||
    RANKS.slice(strengthOf(pile[0].rank) + 1).some(
      (rank) => unseenOf(game, rank) >= size,
    )
  );
}

/** How many cards of one rank nobody has seen yet. */
function unseenOf(game: ArschlochGame, rank: Rank): number {
  const inPack = packFor().filter((card) => card.rank === rank).length;
  const played = (game.seen ?? []).filter((card) => card.rank === rank).length;
  return inPack - played;
}

/**
 * Sits out everybody who provably cannot answer the pile.
 *
 * @param game - the game
 * @returns the game with those seats passed
 * @remarks
 * The one thing about a hand that is public is **its size**, and it decides
 * this on its own: a pair on the table cannot be answered by somebody holding a
 * single card, and everybody at the table can count that card. Being asked
 * anyway is a click for nothing.
 */
function skipHopeless(game: ArschlochGame): ArschlochGame {
  const size = game.pile.length;
  return size === 0
    ? game
    : game.players.reduce(
        (next, player, seat) =>
          stillIn(next, seat) && seat !== next.lead && player.hand.length < size
            ? note(
                withPlayer(next, seat, { passed: true }),
                `${nameOf(next, seat)}: kann nicht mithalten - ${cardsLeft(player.hand.length)}.`,
              )
            : next,
        game,
      );
}

/** How a hand size reads in the log. */
function cardsLeft(count: number): string {
  return count === 1 ? "nur noch 1 Karte" : `nur noch ${count} Karten`;
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
  return game.phase === "roundOver"
    ? openRound({ ...game, round: game.round + 1 })
    : null;
}

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
  return isStep(game, seat, "give") && holdsExactly(game, seat, cards);
}

/**
 * Whether these cards may be put away.
 *
 * @param game - the game
 * @param seat - the seat that was dealt the leftovers
 * @param cards - the card ids
 * @returns true when they are held and there are as many as were over
 */
export function canDrop(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): boolean {
  return isStep(game, seat, "drop") && holdsExactly(game, seat, cards);
}

/**
 * Whether these cards may be wished for.
 *
 * @param game - the game
 * @param seat - the seat doing the wishing
 * @param cards - the card ids, out of the other hand
 * @returns true when the other seat holds them and none of them is protected
 */
export function canWish(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): boolean {
  const owed = game.owed[0];
  const may = new Set(owed === undefined ? [] : wishableIds(game, owed.to));
  return (
    isStep(game, seat, "wish") &&
    owed !== undefined &&
    cards.length === owed.count &&
    new Set(cards).size === cards.length &&
    cards.every((id) => may.has(id))
  );
}

/** Whether the step the table is waiting for is this seat and this kind. */
function isStep(
  game: ArschlochGame,
  seat: number,
  kind: HandoverKind,
): boolean {
  const owed = game.owed[0];
  return (
    game.phase === "passing" &&
    owed !== undefined &&
    owed.kind === kind &&
    owed.from === seat
  );
}

/** Whether a seat holds exactly the cards the step asks for. */
function holdsExactly(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): boolean {
  const owed = game.owed[0];
  const held = heldCards(game, seat, cards);
  return (
    owed !== undefined &&
    held.length === owed.count &&
    held.length === cards.length
  );
}

/** Hands the chosen cards back. */
function doGive(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): ArschlochGame | null {
  const owed = game.owed[0];
  const chosen = heldCards(game, seat, cards);
  return canGive(game, seat, cards) && owed !== undefined
    ? afterStep(
        note(
          give(game, seat, owed.to, chosen),
          `${nameOf(game, seat)}: gibt ${spell(chosen)} zurück an ${nameOf(game, owed.to)}.`,
        ),
      )
    : null;
}

/** Puts the leftovers of the deal away, out of the round. */
function doDrop(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): ArschlochGame | null {
  let next: ArschlochGame | null = null;
  if (canDrop(game, seat, cards)) {
    const ids = new Set(cards);
    const dropped = withHand(
      game,
      seat,
      game.players[seat].hand.filter((card) => !ids.has(card.id)),
    );
    next = afterStep(
      note(
        dropped,
        `${nameOf(game, seat)}: legt ${cardCount(cards.length)} verdeckt ab.`,
      ),
    );
  }
  return next;
}

/** Takes the wished cards out of the other hand. */
function doWish(
  game: ArschlochGame,
  seat: number,
  cards: readonly string[],
): ArschlochGame | null {
  const owed = game.owed[0];
  let next: ArschlochGame | null = null;
  if (canWish(game, seat, cards) && owed !== undefined) {
    const ids = new Set(cards);
    const taken = game.players[owed.to].hand.filter((card) => ids.has(card.id));
    next = afterStep(
      note(
        give(game, owed.to, seat, taken),
        `${nameOf(game, seat)}: wünscht sich ${spell(taken)} von ${nameOf(game, owed.to)}.`,
      ),
    );
  }
  return next;
}

/** Moves on to the next step before the round, or starts playing. */
function afterStep(game: ArschlochGame): ArschlochGame {
  const rest = game.owed.slice(1);
  return rest.length > 0
    ? { ...game, owed: rest }
    : { ...game, owed: [], phase: "playing" };
}

/** How a number of cards reads in the log. */
function cardCount(count: number): string {
  return count === 1 ? "1 Karte" : `${count} Karten`;
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

/**
 * Cards as words, for the log.
 *
 * @remarks
 * A play is always one rank and reads as "2x Koenig". A wish need not be - two
 * cards taken out of a hand may be a Koenig and an Ass - so mixed cards are
 * named one by one rather than counted under the first one.
 */
function spell(cards: readonly Card[]): string {
  const first = cards[0];
  const alike =
    first !== undefined && cards.every((card) => card.rank === first.rank);
  let text: string;
  if (first === undefined) {
    text = "nichts";
  } else if (cards.length === 1) {
    text = RANK_WORDS[first.rank];
  } else if (alike) {
    text = `${cards.length}x ${RANK_WORDS[first.rank]}`;
  } else {
    text = cards.map((card) => RANK_WORDS[card.rank]).join(" und ");
  }
  return text;
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
