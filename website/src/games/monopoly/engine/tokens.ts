/**
 * The eight playing pieces, and the colours they are told apart by.
 *
 * @module
 * @remarks
 * "8 Spielfiguren" says the box, and they are the thing people call each other
 * by across a table - the dog, the top hat, the ship. So they are the seat
 * names here rather than "Spieler 2", and they carry a colour because a token
 * on a board has to be findable at a glance among forty fields.
 *
 * The colours are deliberately not the board's eight colour groups. A token the
 * colour of the street it stands on is a token nobody can see.
 */

/** One playing piece. */
export type Token = {
  readonly name: string;
  /** The piece, as the one character that stands for it. */
  readonly emoji: string;
  readonly colour: string;
  /** What a number written on that colour has to be. */
  readonly ink: string;
};

/** The eight pieces, in seat order. */
export const TOKENS: readonly Token[] = [
  { name: "Hund", emoji: "\u{1F415}", colour: "#d92b2b", ink: "#ffffff" },
  { name: "Schiff", emoji: "\u{1F6A2}", colour: "#1264c4", ink: "#ffffff" },
  { name: "Zylinder", emoji: "\u{1F3A9}", colour: "#1f1f24", ink: "#ffffff" },
  { name: "Auto", emoji: "\u{1F697}", colour: "#e08b00", ink: "#241500" },
  { name: "Katze", emoji: "\u{1F408}", colour: "#7b3fb5", ink: "#ffffff" },
  { name: "Fingerhut", emoji: "\u{1F9F5}", colour: "#0f8f6c", ink: "#ffffff" },
  { name: "Schubkarre", emoji: "\u{1F6D2}", colour: "#b5306e", ink: "#ffffff" },
  { name: "Stiefel", emoji: "\u{1F462}", colour: "#5a6b7a", ink: "#ffffff" },
];

/** How many pieces the box holds. */
export const TOKEN_COUNT = TOKENS.length;

/** What a player's token is before they have chosen one. */
export const NO_TOKEN = -1;

/**
 * One piece by its number.
 *
 * @param token - the piece's index, or -1 for one not yet chosen
 * @returns the piece; an unchosen one gets the first, so the board never
 *   renders a hole while the table is still picking
 */
export function tokenOf(token: number): Token {
  return TOKENS[((token % TOKEN_COUNT) + TOKEN_COUNT) % TOKEN_COUNT];
}
