/**
 * The board: one ring, one kennel and one home per colour - and the arithmetic.
 *
 * @module
 * @remarks
 * Sixteen fields of the ring per colour, so the board grows with the table: at
 * four players it is the printed board with its sixty-four fields, at six the
 * ninety-six of the board's other side, and at two, three or five it is the
 * same idea with as many quarters as there are people.
 *
 * A piece walks the ring in one direction, comes past its own start field once
 * round, and turns off into its home - four fields where nothing can reach it
 * any more.
 *
 * **Two kinds of table, and the rules of the pack tell them apart.** At four
 * and at six it is a partner game: whoever sits opposite is on your side, and
 * the team wins together. At two, three and five the rulebook has everybody
 * play for themselves with a fifth piece, one of which starts on the board -
 * see {@link teamPlay} and {@link piecesPerSeat}.
 *
 * Everything in here is arithmetic on field numbers and nothing else: no
 * pictures, no state, no rules about whose turn it is. What a piece **may** do
 * is in ./moves; what the board **is** is here, so that both the referee and
 * the picture ask the same source about where a field lies.
 */

/** How few may sit at the table. */
export const MIN_SEATS = 2;

/** And how many. */
export const MAX_SEATS = 6;

/** The table sizes this game deals for. */
export const SEAT_COUNTS: readonly number[] = Array.from(
  { length: MAX_SEATS - MIN_SEATS + 1 },
  (unused, at) => MIN_SEATS + at,
);

/** The usual table, and the one the rulebook is written for. */
export const DEFAULT_SEATS = 4;

/** How many fields of the ring belong to one colour. */
export const FIELDS_PER_SEAT = 16;

/** How many fields deep a home is. */
export const HOME_DEPTH = 4;

/** How many pieces a colour has in a partner game. */
export const TEAM_PIECES = 4;

/**
 * And how many when everybody plays for themselves.
 *
 * @remarks
 * Five, of which one starts on the board: "Jeder Spieler spielt mit 5 Figuren,
 * wobei 4 Figuren in den Start gestellt werden und eine Figur sofort auf das
 * Startfeld." Only four of them ever get home - the home is four fields deep -
 * so the fifth is the one that keeps the board busy.
 */
export const SOLO_PIECES = 5;

/** Where a piece is standing. */
export type Spot =
  /** In the kennel, waiting for a start card. */
  | { readonly zone: "kennel" }
  /** On the ring, on this field. */
  | { readonly zone: "ring"; readonly field: number }
  /** In its own home, on this field of it - zero is the one nearest the ring. */
  | { readonly zone: "home"; readonly slot: number };

/** One piece on the board. */
export type Piece = {
  /** Unique across the board. */
  readonly id: number;
  /** Which colour it belongs to, which is also which seat plays it. */
  readonly seat: number;
  readonly spot: Spot;
};

/**
 * Whether a table of this size plays in teams.
 *
 * @param seats - how many sit at it
 * @returns true at four and at six, which are the partner games
 * @remarks
 * Two is not a team game even though the number divides: the rulebook sends
 * two, three and five players down the same road, each for themselves.
 */
export function teamPlay(seats: number): boolean {
  return seats === DEFAULT_SEATS || seats === MAX_SEATS;
}

/**
 * How many pieces each colour has.
 *
 * @param seats - how many sit at the table
 * @returns four in a partner game, five when everybody plays alone
 */
export function piecesPerSeat(seats: number): number {
  return teamPlay(seats) ? TEAM_PIECES : SOLO_PIECES;
}

/**
 * How many pieces one side has to bring home to win.
 *
 * @param seats - how many sit at the table
 * @returns eight for a team, and four for a player on their own
 */
export function piecesToWin(seats: number): number {
  return teamPlay(seats) ? TEAM_PIECES * 2 : HOME_DEPTH;
}

/**
 * How long the ring is.
 *
 * @param seats - how many sit at the table
 * @returns the number of fields all the way round
 */
export function ringSize(seats: number): number {
  return seats * FIELDS_PER_SEAT;
}

/**
 * The start field of a colour.
 *
 * @param seat - the colour in question
 * @returns its field on the ring
 * @remarks
 * Also the field a piece has to come past to turn into its home, which is why
 * it is one number and not two.
 */
export function startField(seat: number): number {
  return seat * FIELDS_PER_SEAT;
}

/**
 * Which colour a field of the ring belongs to, as a start field.
 *
 * @param field - a field of the ring
 * @returns the colour whose start field this is, or null for every other field
 */
export function ownerOfStart(field: number): number | null {
  return field % FIELDS_PER_SEAT === 0 ? field / FIELDS_PER_SEAT : null;
}

/**
 * One field further round.
 *
 * @param field - where the piece stands
 * @param steps - how many fields, negative to go backwards
 * @param ring - how long the ring is
 * @returns the field it lands on
 */
export function ringStep(field: number, steps: number, ring: number): number {
  return (((field + steps) % ring) + ring) % ring;
}

/**
 * How far it is from one field to another, going forwards.
 *
 * @param from - where the piece stands
 * @param to - the field asked about
 * @param ring - how long the ring is
 * @returns the number of steps, and a whole lap rather than nought when the two
 * are the same - a piece standing on its own start field is a lap away from it,
 * which is exactly the rule that stops it turning straight into its home
 */
export function forwardGap(from: number, to: number, ring: number): number {
  const gap = (((to - from) % ring) + ring) % ring;
  return gap === 0 ? ring : gap;
}

/**
 * The team a seat plays for.
 *
 * @param seat - the seat in question
 * @param seats - how many sit at the table
 * @returns the team, or the seat itself where everybody plays alone
 */
export function teamOf(seat: number, seats: number): number {
  return teamPlay(seats) ? seat % (seats / 2) : seat;
}

/**
 * The seat across the table.
 *
 * @param seat - the seat in question
 * @param seats - how many sit at the table
 * @returns the partner's seat, or the seat itself when there are no partners
 */
export function partnerOf(seat: number, seats: number): number {
  return teamPlay(seats) ? (seat + seats / 2) % seats : seat;
}

/**
 * Who gets the card pushed across at the top of a round.
 *
 * @param seat - the seat pushing it
 * @param seats - how many sit at the table
 * @returns the partner in a partner game, otherwise the left-hand neighbour
 * @remarks
 * The rulebook's own answer to "there is nobody opposite me": at two, three and
 * five the card goes to the left instead, so that the one piece of help the
 * rules allow exists at every table size.
 */
export function giftSeat(seat: number, seats: number): number {
  return teamPlay(seats) ? partnerOf(seat, seats) : nextSeat(seat, seats);
}

/**
 * The seat to the left, which is where the turn goes next.
 *
 * @param seat - the seat in question
 * @param seats - how many sit at the table
 * @returns the next seat clockwise
 */
export function nextSeat(seat: number, seats: number): number {
  return (seat + 1) % seats;
}

/**
 * A fresh set of pieces.
 *
 * @param seats - how many sit at the table
 * @returns every piece of every colour, in its kennel - except, where everybody
 * plays alone, the one piece per colour that starts out on the board
 */
export function freshPieces(seats: number): readonly Piece[] {
  const each = piecesPerSeat(seats);
  const pieces: Piece[] = [];
  for (let seat = 0; seat < seats; seat += 1) {
    for (let at = 0; at < each; at += 1) {
      const out = !teamPlay(seats) && at === 0;
      pieces.push({
        id: seat * each + at,
        seat,
        spot: out
          ? { zone: "ring", field: startField(seat) }
          : { zone: "kennel" },
      });
    }
  }
  return pieces;
}

/**
 * Whether a piece is standing on the start field of its own colour.
 *
 * @param piece - the piece in question
 * @returns true while it is protected there
 * @remarks
 * The one protected field on the board: while a piece stands on its own start
 * field it cannot be hit, swapped or passed - not even by its own side. It is
 * also the only thing that blocks a walk, which is why this question is asked
 * on every single step of one.
 */
export function isOnGuard(piece: Piece): boolean {
  return (
    piece.spot.zone === "ring" && piece.spot.field === startField(piece.seat)
  );
}

/**
 * The piece standing on a field of the ring, if any.
 *
 * @param pieces - every piece on the board
 * @param field - the field in question
 * @returns the piece standing there, or null
 */
export function pieceOnRing(
  pieces: readonly Piece[],
  field: number,
): Piece | null {
  return (
    pieces.find(
      (piece) => piece.spot.zone === "ring" && piece.spot.field === field,
    ) ?? null
  );
}

/**
 * The piece on one field of one home, if any.
 *
 * @param pieces - every piece on the board
 * @param seat - whose home
 * @param slot - which field of it
 * @returns the piece standing there, or null
 */
export function pieceInHome(
  pieces: readonly Piece[],
  seat: number,
  slot: number,
): Piece | null {
  return (
    pieces.find(
      (piece) =>
        piece.seat === seat &&
        piece.spot.zone === "home" &&
        piece.spot.slot === slot,
    ) ?? null
  );
}

/**
 * How many pieces of a colour are home.
 *
 * @param pieces - every piece on the board
 * @param seat - the colour in question
 * @returns how many of them are in
 */
export function homeOf(pieces: readonly Piece[], seat: number): number {
  return pieces.filter(
    (piece) => piece.seat === seat && piece.spot.zone === "home",
  ).length;
}

/**
 * Whether a colour has nothing left to play for itself.
 *
 * @param pieces - every piece on the board
 * @param seat - the colour in question
 * @returns true once its home is as full as it can get
 * @remarks
 * The moment a player stops playing their own colour and starts playing their
 * partner's - see the partner rule in ./moves. A home is four fields deep, so
 * a colour with five pieces is finished with four of them in.
 */
export function isHomeFull(pieces: readonly Piece[], seat: number): boolean {
  return homeOf(pieces, seat) >= HOME_DEPTH;
}

/**
 * Which colours a seat is allowed to move.
 *
 * @param pieces - every piece on the board
 * @param seat - the seat on turn
 * @param seats - how many sit at the table
 * @returns its own colour, or the partner's once its own home is full
 */
export function coloursOf(
  pieces: readonly Piece[],
  seat: number,
  seats: number,
): readonly number[] {
  const mate = partnerOf(seat, seats);
  return isHomeFull(pieces, seat) && mate !== seat ? [mate] : [seat];
}
