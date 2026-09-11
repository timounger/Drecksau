/**
 * The referee: what a card may do, and what the board looks like afterwards.
 *
 * @module
 * @remarks
 * Every rule of Dog that is about *movement* lives here, and all of it is built
 * out of one walk: a piece goes field by field, and each field asks the same
 * three questions - is somebody standing on their own start field in the way,
 * is this the piece's own start field to turn off at, and is anybody standing
 * where it comes to rest. Hitting, burning, going home and being blocked all
 * fall out of that one loop rather than out of four special cases.
 *
 * The one card that is not a walk is the swap, and the one card that is several
 * walks is the seven. Both are laid out as {@link Act}s that a player picks
 * from, so that a move which reaches the state is always a move that was legal
 * when it was made - the screen and the computer opponent choose from the same
 * list.
 *
 * The size of the table is a number the game carries rather than a constant:
 * the ring is sixteen fields per colour, and a hand that cannot be played ends
 * the round for that seat at a table of four or six but swaps a card at a table
 * of two, three or five.
 */
import {
  HOME_DEPTH,
  coloursOf,
  forwardGap,
  giftSeat,
  homeOf,
  isHomeFull,
  isOnGuard,
  nextSeat,
  partnerOf,
  pieceInHome,
  pieceOnRing,
  ringSize,
  ringStep,
  startField,
  teamOf,
  teamPlay,
  type Piece,
} from "./board";
import {
  CARD_NAMES,
  POWERS,
  WILD_CHOICES,
  type Card,
  type Rank,
} from "./cards";
import { drawOne, nextRound, note } from "./setup";
import type { Act, DogGame, DogMove, Step } from "./state";

/** How many complete plans for a seven are worked out at most. */
const SEVEN_PLANS = 400;

/**
 * How many of them a list of moves offers.
 *
 * @remarks
 * Fewer than the referee will check, on purpose: a player choosing from a list
 * wants a handful of sensible splits rather than every permutation of the same
 * one, and the computer opponent judges every one it is handed.
 */
const PLAN_SAMPLE = 60;

/**
 * Whose turn it is.
 *
 * @param game - the game as it stands
 * @returns the seat the table is waiting for, or null once it is over
 * @remarks
 * While the cards are being pushed across, every seat that has not pushed one
 * is on turn at the same time - there is no order to it. The seat named here is
 * then the first one still to choose, which is what a screen needs.
 */
export function seatOnTurn(game: DogGame): number | null {
  let seat: number | null = null;
  if (game.phase === "passing") {
    const waiting = game.given.findIndex((card) => card === null);
    seat = waiting < 0 ? null : waiting;
  } else if (game.phase === "playing") {
    seat = game.turn;
  }
  return seat;
}

/**
 * Every move a seat may make right now.
 *
 * @param game - the game as it stands
 * @param seat - the seat in question
 * @returns all legal moves, the way out of a dead hand included
 */
export function legalMoves(game: DogGame, seat: number): readonly DogMove[] {
  let moves: readonly DogMove[] = [];
  if (game.phase === "passing") {
    moves =
      game.given[seat] === null
        ? (game.players[seat]?.hand ?? []).map((card) => ({
            kind: "give" as const,
            card: card.id,
          }))
        : [];
  } else if (game.phase === "playing" && game.turn === seat) {
    const plays = playsOf(game, seat, PLAN_SAMPLE);
    moves = plays.length > 0 ? plays : stuckMoves(game, seat);
  }
  return moves;
}

/**
 * What a seat does when nothing at all can be played.
 *
 * @remarks
 * Two different rules for two different tables. In a partner game the hand is
 * dropped and the round is over for that seat. Where everybody plays alone the
 * rulebook keeps them in it: one card away, one card back, and if that one is
 * no good either, one card away again.
 */
function stuckMoves(game: DogGame, seat: number): readonly DogMove[] {
  const hand = game.players[seat]?.hand ?? [];
  return teamPlay(game.seats)
    ? [{ kind: "fold" }]
    : hand.map((card) => ({ kind: "redraw" as const, card: card.id }));
}

/**
 * Every card of a hand that can be played at all.
 *
 * @param game - the game as it stands
 * @param seat - the seat in question
 * @returns the ids of the cards that have at least one legal act
 */
export function playableCards(game: DogGame, seat: number): readonly number[] {
  const hand = game.players[seat]?.hand ?? [];
  return hand
    .filter((card) =>
      ranksOf(card).some((as) => actsFor(game, seat, as, 1).length > 0),
    )
    .map((card) => card.id);
}

/**
 * What a card of this rank could do.
 *
 * @param game - the game as it stands
 * @param seat - the seat playing it
 * @param as - the rank the card counts as, the joker's choice included
 * @param cap - how many ways of splitting a seven to work out
 * @returns every act that rank allows, or nothing when it allows none
 */
export function actsFor(
  game: DogGame,
  seat: number,
  as: Rank,
  cap: number = SEVEN_PLANS,
): readonly Act[] {
  const power = POWERS[as];
  const ring = ringSize(game.seats);
  const acts: Act[] = [];
  const mine = ownPieces(game, seat);
  if (power.starts) {
    for (const piece of mine) {
      if (piece.spot.zone === "kennel" && canStart(game.pieces, piece.seat)) {
        acts.push({ kind: "start", piece: piece.id });
      }
    }
  }
  for (const steps of power.steps) {
    for (const piece of mine) {
      for (const home of [false, true]) {
        if (
          walked(game.pieces, piece.id, steps, false, home, false, ring) !==
          null
        ) {
          acts.push({
            kind: "walk",
            piece: piece.id,
            steps,
            backwards: false,
            home,
          });
        }
      }
      if (
        power.backwards &&
        walked(game.pieces, piece.id, steps, true, false, false, ring) !== null
      ) {
        acts.push({
          kind: "walk",
          piece: piece.id,
          steps,
          backwards: true,
          home: false,
        });
      }
    }
  }
  if (power.swaps) {
    acts.push(...swapsFor(game, seat));
  }
  if (power.splits) {
    acts.push(
      ...sevenPlans(game, seat, cap).map((parts) => ({
        kind: "seven" as const,
        parts,
      })),
    );
  }
  return acts;
}

/**
 * The parts a seven may still be split into, given what it has already done.
 *
 * @param game - the game as it stands
 * @param seat - the seat playing it
 * @param parts - the parts already chosen, in order
 * @returns every next part that still leaves the seven finishable
 * @remarks
 * What the screen asks while a seven is being laid out: pick a piece, pick how
 * many of the points it takes, and the offer shrinks to what can still be spent
 * in full. All seven points have to go somewhere, so a part that paints the
 * player into a corner is not offered in the first place.
 */
export function sevenChoices(
  game: DogGame,
  seat: number,
  parts: readonly Step[],
): readonly Step[] {
  const ring = ringSize(game.seats);
  const after = walkedParts(game.pieces, parts, ring);
  const left = (POWERS["7"].steps[0] ?? 0) - spent(parts);
  let choices: readonly Step[] = [];
  if (after !== null && left > 0) {
    for (const pool of sevenPools(game, seat)) {
      if (choices.length === 0) {
        choices = choicesFrom(pool, after, left, ring);
      }
    }
  }
  return choices;
}

/** The next parts that still leave the rest of a seven spendable. */
function choicesFrom(
  pieces: readonly Piece[],
  board: readonly Piece[],
  left: number,
  ring: number,
): readonly Step[] {
  const choices: Step[] = [];
  for (const piece of pieces) {
    for (let steps = 1; steps <= left; steps += 1) {
      for (const home of [false, true]) {
        const out = walked(board, piece.id, steps, false, home, true, ring);
        const rest = left - steps;
        if (
          out !== null &&
          (rest === 0 ||
            plansFrom(pieces, out.pieces, rest, 1, ring).length > 0)
        ) {
          choices.push({ piece: piece.id, steps, home });
        }
      }
    }
  }
  return choices;
}

/**
 * Plays a move.
 *
 * @param game - the game as it stands
 * @param seat - the seat making the move
 * @param move - what it does
 * @returns the game after it, or null when the move was not legal
 */
export function applyMove(
  game: DogGame,
  seat: number,
  move: DogMove,
): DogGame | null {
  let next: DogGame | null = null;
  switch (move.kind) {
    case "give":
      next = give(game, seat, move.card);
      break;
    case "fold":
      next = fold(game, seat);
      break;
    case "redraw":
      next = redraw(game, seat, move.card);
      break;
    default:
      next = play(game, seat, move);
  }
  return next;
}

/**
 * Whether a side has brought everything home.
 *
 * @param game - the game as it stands
 * @param seat - any seat of that side
 * @returns true once it has won
 * @remarks
 * At a table of four or six that means the partner too; where everybody plays
 * alone the partner is the seat itself, so one line answers both.
 */
export function hasWon(game: DogGame, seat: number): boolean {
  return (
    isHomeFull(game.pieces, seat) &&
    isHomeFull(game.pieces, partnerOf(seat, game.seats))
  );
}

/**
 * How many pieces of a colour are home.
 *
 * @param game - the game as it stands
 * @param seat - the colour in question
 * @returns how many are in
 */
export function homeCount(game: DogGame, seat: number): number {
  return homeOf(game.pieces, seat);
}

/**
 * How far a piece has come, counted from its own start field.
 *
 * @param piece - the piece in question
 * @param ring - how long the ring is
 * @returns nought in the kennel or on its own start field, and more the closer
 * it is to being home
 */
export function progressOf(piece: Piece, ring: number): number {
  let far = 0;
  if (piece.spot.zone === "ring") {
    far = ring - forwardGap(piece.spot.field, startField(piece.seat), ring);
  } else if (piece.spot.zone === "home") {
    far = ring + piece.spot.slot;
  }
  return far;
}

/* ------------------------------------------------------------ the phases */

/** One card pushed across. */
function give(game: DogGame, seat: number, card: number): DogGame | null {
  const hand = game.players[seat]?.hand ?? [];
  const has = hand.some((each) => each.id === card);
  let next: DogGame | null = null;
  if (game.phase === "passing" && game.given[seat] === null && has) {
    const given = game.given.map((each, at) => (at === seat ? card : each));
    const pushed: DogGame = { ...game, given };
    next = given.every((each) => each !== null) ? openRound(pushed) : pushed;
  }
  return next;
}

/** The cards change hands and the round begins. */
function openRound(game: DogGame): DogGame {
  const opened = handedOver(game);
  // Whoever begins may have nothing to play; the turn walks on until somebody
  // does, so the table never waits on a seat that cannot act.
  return rollOn(opened, opened.turn, false);
}

/**
 * The pushed cards, handed over all at once.
 *
 * @remarks
 * All of them together, because that is how it is done at the table: the card
 * goes over face down, and a player may only look at what they were given once
 * their own is out of their hand.
 */
function handedOver(game: DogGame): DogGame {
  const taken = game.players.map((player, seat) => {
    const id = game.given[seat];
    return {
      keep: player.hand.filter((card) => card.id !== id),
      gift: player.hand.find((card) => card.id === id) ?? null,
    };
  });
  const players = game.players.map((player, seat) => {
    // Whoever pushes to this seat: the partner, or the neighbour on the other
    // side at a table where everybody plays alone.
    const from = game.players.findIndex(
      (unused, at) => giftSeat(at, game.seats) === seat,
    );
    const gift = taken[from]?.gift ?? null;
    const keep = taken[seat]?.keep ?? player.hand;
    return { ...player, hand: gift === null ? keep : [...keep, gift] };
  });
  return {
    ...game,
    phase: "playing",
    players,
    given: Array.from({ length: game.seats }, () => null),
    turn: nextSeat(game.dealer, game.seats),
    redrew: false,
    log: note(game.log, "Die Karten sind getauscht - los geht die Runde."),
  };
}

/** A seat with nothing to play drops its hand and sits the round out. */
function fold(game: DogGame, seat: number): DogGame | null {
  const hand = game.players[seat]?.hand ?? [];
  let next: DogGame | null = null;
  if (
    game.phase === "playing" &&
    game.turn === seat &&
    teamPlay(game.seats) &&
    playableCards(game, seat).length === 0
  ) {
    const dropped: DogGame = {
      ...game,
      players: game.players.map((player, at) =>
        at === seat ? { ...player, hand: [] } : player,
      ),
      pile: [...game.pile, ...hand],
      out: game.out.map((each, at) => (at === seat ? true : each)),
      log: note(
        game.log,
        `${game.players[seat]?.name ?? "?"} kann nicht und ist für diese Runde raus.`,
      ),
    };
    next = rollOn(dropped, seat, true);
  }
  return next;
}

/**
 * One dead card away, one new card back.
 *
 * @remarks
 * The rule for a table where everybody plays alone. The first swap of a turn
 * draws a card; a second one is a plain discard, so that every hand keeps the
 * same number of cards - and then the turn moves on, whether it helped or not.
 */
function redraw(game: DogGame, seat: number, card: number): DogGame | null {
  const hand = game.players[seat]?.hand ?? [];
  const dropped = hand.find((each) => each.id === card) ?? null;
  let next: DogGame | null = null;
  if (
    game.phase === "playing" &&
    game.turn === seat &&
    !teamPlay(game.seats) &&
    dropped !== null &&
    playableCards(game, seat).length === 0
  ) {
    const short: DogGame = {
      ...game,
      players: game.players.map((player, at) =>
        at === seat
          ? { ...player, hand: player.hand.filter((each) => each.id !== card) }
          : player,
      ),
      pile: [...game.pile, dropped],
    };
    const drawn = game.redrew ? null : drawOne(short);
    const who = game.players[seat]?.name ?? "?";
    next =
      drawn === null
        ? rollOn(
            {
              ...short,
              log: note(short.log, `${who} wirft noch eine Karte ab.`),
            },
            seat,
            true,
          )
        : {
            ...drawn.game,
            redrew: true,
            players: drawn.game.players.map((player, at) =>
              at === seat
                ? { ...player, hand: [...player.hand, drawn.card] }
                : player,
            ),
            log: note(drawn.game.log, `${who} tauscht eine Karte.`),
          };
  }
  return next;
}

/** One card, played. */
function play(
  game: DogGame,
  seat: number,
  move: Extract<DogMove, { kind: "play" }>,
): DogGame | null {
  const hand = game.players[seat]?.hand ?? [];
  const card = hand.find((each) => each.id === move.card);
  let next: DogGame | null = null;
  if (game.phase === "playing" && game.turn === seat && card !== undefined) {
    const allowed =
      ranksOf(card).includes(move.as) && isLegal(game, seat, move.as, move.act);
    const board = allowed ? acted(game, seat, move.act) : null;
    if (board !== null) {
      const played: DogGame = {
        ...game,
        pieces: board.pieces,
        players: game.players.map((player, at) =>
          at === seat
            ? {
                ...player,
                hand: player.hand.filter((each) => each.id !== card.id),
              }
            : player,
        ),
        pile: [...game.pile, card],
        log: note(
          game.log,
          line(game, seat, card, move.as, move.act, board.hits),
        ),
      };
      next = hasWon(played, seat)
        ? {
            ...played,
            phase: "gameOver",
            winners: teamPlay(game.seats)
              ? [seat, partnerOf(seat, game.seats)]
              : [seat],
            log: note(played.log, wonLine(played, seat)),
          }
        : rollOn(played, seat, true);
    }
  }
  return next;
}

/** What the ticker says when it is over. */
function wonLine(game: DogGame, seat: number): string {
  const who = game.players[seat]?.name ?? "?";
  return teamPlay(game.seats)
    ? `Team ${String(teamOf(seat, game.seats) + 1)} hat alle Figuren im Ziel.`
    : `${who} hat vier Figuren im Ziel und gewinnt.`;
}

/**
 * Hands the turn on, and starts the next round when this one is played out.
 *
 * @param game - the game after a move
 * @param from - the seat that has just acted
 * @param move - whether the turn should leave that seat at all
 * @returns the game with somebody on turn who can actually act
 */
function rollOn(game: DogGame, from: number, move: boolean): DogGame {
  let seat = move ? nextSeat(from, game.seats) : from;
  let looked = 0;
  while (looked < game.seats && !canAct(game, seat)) {
    seat = nextSeat(seat, game.seats);
    looked += 1;
  }
  return canAct(game, seat)
    ? { ...game, turn: seat, redrew: false }
    : nextRound({ ...game, pile: [...game.pile, ...allHands(game)] });
}

/** Whether a seat still has something to do this round. */
function canAct(game: DogGame, seat: number): boolean {
  return !game.out[seat] && (game.players[seat]?.hand.length ?? 0) > 0;
}

/** Everything still in the hands, for the pile at the end of a round. */
function allHands(game: DogGame): readonly Card[] {
  return game.players.flatMap((player) => player.hand);
}

/* -------------------------------------------------------------- the cards */

/** What a card may count as: its own rank, or anything at all for a joker. */
function ranksOf(card: Card): readonly Rank[] {
  return POWERS[card.rank].wild ? WILD_CHOICES : [card.rank];
}

/**
 * Every play a seat could make, card by card.
 *
 * @param game - the game as it stands
 * @param seat - the seat in question
 * @param cap - how many ways of splitting a seven to work out per card
 * @returns the moves, which is what the computer player chooses from
 */
function playsOf(
  game: DogGame,
  seat: number,
  cap: number = SEVEN_PLANS,
): readonly DogMove[] {
  const hand = game.players[seat]?.hand ?? [];
  const moves: DogMove[] = [];
  for (const card of hand) {
    for (const as of ranksOf(card)) {
      for (const act of actsFor(game, seat, as, cap)) {
        moves.push({ kind: "play", card: card.id, as, act });
      }
    }
  }
  return moves;
}

/**
 * Whether this act is one the rank actually allows.
 *
 * @remarks
 * The seven is checked rather than looked up: listing every way of splitting it
 * only to find the one that was played would be the long way round to the same
 * answer, and on a full board a slow one.
 */
function isLegal(game: DogGame, seat: number, as: Rank, act: Act): boolean {
  const power = POWERS[as];
  let legal = false;
  if (act.kind === "seven") {
    const pools = sevenPools(game, seat);
    const allowed = pools[pools.length - 1] ?? [];
    legal =
      power.splits &&
      spent(act.parts) === (POWERS["7"].steps[0] ?? 0) &&
      act.parts.every((part) =>
        allowed.some((piece) => piece.id === part.piece),
      ) &&
      walkedParts(game.pieces, act.parts, ringSize(game.seats)) !== null;
  } else {
    legal = actsFor(game, seat, as, 1).some((each) => sameAct(each, act));
  }
  return legal;
}

/** Whether two acts say the same thing. */
function sameAct(a: Act, b: Act): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ------------------------------------------------------------ the pieces */

/** The pieces a seat is allowed to move: its own, or its partner's. */
function ownPieces(game: DogGame, seat: number): readonly Piece[] {
  const colours = coloursOf(game.pieces, seat, game.seats);
  return game.pieces.filter((piece) => colours.includes(piece.seat));
}

/** Whether a colour may fetch a piece onto its start field. */
function canStart(pieces: readonly Piece[], seat: number): boolean {
  const standing = pieceOnRing(pieces, startField(seat));
  return standing === null || standing.seat !== seat;
}

/** Every swap this seat could make with the card in hand. */
function swapsFor(game: DogGame, seat: number): readonly Act[] {
  const mine = ownPieces(game, seat).filter(swappable);
  const theirs = game.pieces.filter(
    (piece) => swappable(piece) && !mine.some((own) => own.seat === piece.seat),
  );
  const acts: Act[] = [];
  for (const piece of mine) {
    for (const other of theirs) {
      acts.push({ kind: "swap", piece: piece.id, other: other.id });
    }
  }
  // "Sind nur eigene bzw. geschützte Figuren auf dem Weg, wird die Karte ohne
  // Wirkung abgelegt." - so the card is always playable, even when it does
  // nothing at all.
  return acts.length > 0 ? acts : [{ kind: "none" }];
}

/** Whether a piece may take part in a swap at all. */
function swappable(piece: Piece): boolean {
  return piece.spot.zone === "ring" && !isOnGuard(piece);
}

/* --------------------------------------------------------------- the walk */

/** What a move did to the board. */
type Outcome = {
  readonly pieces: readonly Piece[];
  /** Whoever was sent back to their kennel by it. */
  readonly hits: readonly number[];
};

/** The board after an act, or null when the act was not possible. */
function acted(game: DogGame, seat: number, act: Act): Outcome | null {
  const ring = ringSize(game.seats);
  let out: Outcome | null = null;
  switch (act.kind) {
    case "start":
      out = started(game.pieces, act.piece);
      break;
    case "walk":
      out = walked(
        game.pieces,
        act.piece,
        act.steps,
        act.backwards,
        act.home,
        false,
        ring,
      );
      break;
    case "swap":
      out = swapped(game.pieces, act.piece, act.other);
      break;
    case "seven": {
      const board = walkedParts(game.pieces, act.parts, ring);
      out =
        board === null || spent(act.parts) !== (POWERS["7"].steps[0] ?? 0)
          ? null
          : { pieces: board, hits: hitsBetween(game.pieces, board) };
      break;
    }
    default:
      out = { pieces: game.pieces, hits: [] };
  }
  return out;
}

/** A piece out of the kennel and onto its start field. */
function started(pieces: readonly Piece[], id: number): Outcome | null {
  const piece = pieces.find((each) => each.id === id) ?? null;
  let out: Outcome | null = null;
  if (
    piece !== null &&
    piece.spot.zone === "kennel" &&
    canStart(pieces, piece.seat)
  ) {
    const field = startField(piece.seat);
    const standing = pieceOnRing(pieces, field);
    const cleared = standing === null ? pieces : sendHome(pieces, standing.id);
    out = {
      pieces: cleared.map((each) =>
        each.id === id ? { ...each, spot: { zone: "ring", field } } : each,
      ),
      hits: standing === null ? [] : [standing.id],
    };
  }
  return out;
}

/**
 * One piece, so many fields along.
 *
 * @param pieces - the board as it stands
 * @param id - the piece that walks
 * @param steps - how far
 * @param backwards - whether it walks the other way round
 * @param home - whether it turns off into its home at its own start field
 * @param burn - whether everything it passes is sent back, as a seven does
 * @param ring - how long the ring is
 * @returns the board afterwards, or null when the walk is not allowed
 */
function walked(
  pieces: readonly Piece[],
  id: number,
  steps: number,
  backwards: boolean,
  home: boolean,
  burn: boolean,
  ring: number,
): Outcome | null {
  const piece = pieces.find((each) => each.id === id) ?? null;
  let out: Outcome | null = null;
  if (piece === null || steps <= 0 || piece.spot.zone === "kennel") {
    out = null;
  } else if (piece.spot.zone === "home") {
    out = backwards || home ? null : slid(pieces, piece, steps);
  } else if (backwards) {
    out = home ? null : backed(pieces, piece, steps, ring);
  } else {
    out = home
      ? turnedIn(pieces, piece, steps, burn, ring)
      : rolled(pieces, piece, steps, burn, ring);
  }
  return out;
}

/** A piece already home, moving up inside it. */
function slid(
  pieces: readonly Piece[],
  piece: Piece,
  steps: number,
): Outcome | null {
  const from = piece.spot.zone === "home" ? piece.spot.slot : 0;
  const to = from + steps;
  let out: Outcome | null = null;
  if (to < HOME_DEPTH && freeHome(pieces, piece.seat, from + 1, to)) {
    out = {
      pieces: pieces.map((each) =>
        each.id === piece.id
          ? { ...each, spot: { zone: "home", slot: to } }
          : each,
      ),
      hits: [],
    };
  }
  return out;
}

/** Whether every field of a home between two slots is empty. */
function freeHome(
  pieces: readonly Piece[],
  seat: number,
  from: number,
  to: number,
): boolean {
  let free = true;
  for (let slot = from; slot <= to; slot += 1) {
    if (pieceInHome(pieces, seat, slot) !== null) {
      free = false;
    }
  }
  return free;
}

/** A piece walking the ring backwards, which only the four does. */
function backed(
  pieces: readonly Piece[],
  piece: Piece,
  steps: number,
  ring: number,
): Outcome | null {
  const from = piece.spot.zone === "ring" ? piece.spot.field : 0;
  let blocked = false;
  let field = from;
  for (let step = 1; step <= steps; step += 1) {
    field = ringStep(field, -1, ring);
    const standing = pieceOnRing(pieces, field);
    if (standing !== null && isOnGuard(standing)) {
      blocked = true;
    }
  }
  return blocked ? null : landed(pieces, piece, field, []);
}

/** A piece walking the ring forwards, and staying on it. */
function rolled(
  pieces: readonly Piece[],
  piece: Piece,
  steps: number,
  burn: boolean,
  ring: number,
): Outcome | null {
  const from = piece.spot.zone === "ring" ? piece.spot.field : 0;
  const burnt: number[] = [];
  let blocked = false;
  let field = from;
  for (let step = 1; step <= steps; step += 1) {
    field = ringStep(field, 1, ring);
    const standing = pieceOnRing(pieces, field);
    if (standing !== null && isOnGuard(standing)) {
      blocked = true;
    } else if (standing !== null && burn && step < steps) {
      burnt.push(standing.id);
    }
  }
  return blocked ? null : landed(pieces, piece, field, burnt);
}

/** A piece coming past its own start field and turning into its home. */
function turnedIn(
  pieces: readonly Piece[],
  piece: Piece,
  steps: number,
  burn: boolean,
  ring: number,
): Outcome | null {
  const from = piece.spot.zone === "ring" ? piece.spot.field : 0;
  const entry = startField(piece.seat);
  const gap = forwardGap(from, entry, ring);
  const slot = steps - gap - 1;
  let out: Outcome | null = null;
  if (
    steps > gap &&
    slot < HOME_DEPTH &&
    freeHome(pieces, piece.seat, 0, slot)
  ) {
    const burnt: number[] = [];
    let blocked = false;
    let field = from;
    for (let step = 1; step <= gap; step += 1) {
      field = ringStep(field, 1, ring);
      const standing = pieceOnRing(pieces, field);
      if (standing !== null && isOnGuard(standing)) {
        blocked = true;
      } else if (standing !== null && burn) {
        burnt.push(standing.id);
      }
    }
    if (!blocked) {
      const cleared = burnt.reduce(
        (board: readonly Piece[], hit) => sendHome(board, hit),
        pieces,
      );
      out = {
        pieces: cleared.map((each) =>
          each.id === piece.id
            ? { ...each, spot: { zone: "home", slot } }
            : each,
        ),
        hits: burnt,
      };
    }
  }
  return out;
}

/** A piece coming to rest on a field of the ring. */
function landed(
  pieces: readonly Piece[],
  piece: Piece,
  field: number,
  burnt: readonly number[],
): Outcome | null {
  const standing = pieceOnRing(pieces, field);
  let out: Outcome | null = null;
  if (standing === null || !isOnGuard(standing)) {
    const hits = standing === null ? burnt : [...burnt, standing.id];
    const cleared = hits.reduce(
      (board: readonly Piece[], hit) => sendHome(board, hit),
      pieces,
    );
    out = {
      pieces: cleared.map((each) =>
        each.id === piece.id
          ? { ...each, spot: { zone: "ring", field } }
          : each,
      ),
      hits,
    };
  }
  return out;
}

/** A piece back in its kennel. */
function sendHome(pieces: readonly Piece[], id: number): readonly Piece[] {
  return pieces.map((each) =>
    each.id === id ? { ...each, spot: { zone: "kennel" } } : each,
  );
}

/** One of ours for one of theirs. */
function swapped(
  pieces: readonly Piece[],
  id: number,
  otherId: number,
): Outcome | null {
  const piece = pieces.find((each) => each.id === id) ?? null;
  const other = pieces.find((each) => each.id === otherId) ?? null;
  let out: Outcome | null = null;
  if (
    piece !== null &&
    other !== null &&
    swappable(piece) &&
    swappable(other) &&
    piece.seat !== other.seat
  ) {
    out = {
      pieces: pieces.map((each) => {
        let moved = each;
        if (each.id === piece.id) {
          moved = { ...each, spot: other.spot };
        } else if (each.id === other.id) {
          moved = { ...each, spot: piece.spot };
        }
        return moved;
      }),
      hits: [],
    };
  }
  return out;
}

/* -------------------------------------------------------------- the seven */

/** How many of the seven's points a list of parts spends. */
function spent(parts: readonly Step[]): number {
  return parts.reduce((sum, part) => sum + part.steps, 0);
}

/**
 * The pieces a seven may be split over, in the order they may be used.
 *
 * @remarks
 * The own colour first, and the partner as a second pool only: "braucht ein
 * Spieler für seine letzte Figur noch Punkte ... so darf er die restlichen
 * Punkte bereits mit der Figur seines Partners ziehen". The partner is
 * therefore fair game exactly when the own colour cannot spend the seven, and
 * not a moment earlier - and at a table without partners there is only ever the
 * one pool.
 */
function sevenPools(
  game: DogGame,
  seat: number,
): readonly (readonly Piece[])[] {
  const mine = ownPieces(game, seat);
  const mate = partnerOf(seat, game.seats);
  const also =
    mate === seat
      ? []
      : game.pieces.filter(
          (piece) => piece.seat === mate && !mine.includes(piece),
        );
  return also.length === 0 ? [mine] : [mine, [...mine, ...also]];
}

/**
 * Every way of splitting a seven, from the board as it stands.
 *
 * @remarks
 * Bounded: with eight pieces on the board the number of ways to cut seven
 * points up runs into the thousands, and a computer player that looks at four
 * hundred of them plays no worse than one that looks at all of them.
 */
function sevenPlans(
  game: DogGame,
  seat: number,
  cap: number,
): readonly (readonly Step[])[] {
  const total = POWERS["7"].steps[0] ?? 0;
  const ring = ringSize(game.seats);
  let plans: readonly (readonly Step[])[] = [];
  for (const pool of sevenPools(game, seat)) {
    if (plans.length === 0) {
      plans = plansFrom(pool, game.pieces, total, cap, ring);
    }
  }
  return plans;
}

/** The search behind {@link sevenPlans}, which stops at a given number. */
function plansFrom(
  pieces: readonly Piece[],
  board: readonly Piece[],
  left: number,
  cap: number,
  ring: number,
): readonly (readonly Step[])[] {
  const found: (readonly Step[])[] = [];
  const walk = (at: readonly Piece[], rest: number, parts: readonly Step[]) => {
    if (rest === 0) {
      found.push(parts);
    } else {
      for (const piece of pieces) {
        // The biggest part first, so that the plans that come out are the ones
        // a player would think of: one piece walking the whole seven, then a
        // six and a one, and only much later seven single steps.
        for (let steps = rest; steps >= 1 && found.length < cap; steps -= 1) {
          for (const home of [false, true]) {
            const out = walked(at, piece.id, steps, false, home, true, ring);
            if (out !== null && found.length < cap) {
              walk(out.pieces, rest - steps, [
                ...parts,
                { piece: piece.id, steps, home },
              ]);
            }
          }
        }
      }
    }
  };
  walk(board, left, []);
  return found;
}

/** The board after a list of parts, or null when one of them is not allowed. */
function walkedParts(
  pieces: readonly Piece[],
  parts: readonly Step[],
  ring: number,
): readonly Piece[] | null {
  let board: readonly Piece[] | null = pieces;
  for (const part of parts) {
    const out: Outcome | null =
      board === null
        ? null
        : walked(board, part.piece, part.steps, false, part.home, true, ring);
    board = out === null ? null : out.pieces;
  }
  return board;
}

/** Whoever ended up back in their kennel between two boards. */
function hitsBetween(
  before: readonly Piece[],
  after: readonly Piece[],
): readonly number[] {
  return before
    .filter((piece) => piece.spot.zone !== "kennel")
    .filter((piece) => {
      const now = after.find((each) => each.id === piece.id);
      return now !== undefined && now.spot.zone === "kennel";
    })
    .map((piece) => piece.id);
}

/* ---------------------------------------------------------------- the log */

/** What the ticker says about a move. */
function line(
  game: DogGame,
  seat: number,
  card: Card,
  as: Rank,
  act: Act,
  hits: readonly number[],
): string {
  const who = game.players[seat]?.name ?? "?";
  const what =
    card.rank === "joker"
      ? `Joker als ${CARD_NAMES[as]}`
      : CARD_NAMES[card.rank];
  const beaten =
    hits.length === 0
      ? ""
      : ` ${hits.length === 1 ? "Eine Figur muss" : `${String(hits.length)} Figuren müssen`} zurück.`;
  return `${who} spielt ${what}: ${deed(act)}.${beaten}`;
}

/** What an act did, in one phrase. */
function deed(act: Act): string {
  let said = "nichts zu machen";
  switch (act.kind) {
    case "start":
      said = "eine Figur kommt raus";
      break;
    case "walk":
      said = act.home
        ? `${String(act.steps)} ins Ziel`
        : `${String(act.steps)} ${act.backwards ? "zurück" : "vor"}`;
      break;
    case "swap":
      said = "zwei Figuren getauscht";
      break;
    case "seven":
      said = `sieben auf ${String(act.parts.length)} ${act.parts.length === 1 ? "Figur" : "Figuren"} verteilt`;
      break;
    default:
      said = "nichts zu machen";
  }
  return said;
}
