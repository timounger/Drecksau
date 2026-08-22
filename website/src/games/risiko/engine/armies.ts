/**
 * The five armies, and the three that belong to nobody.
 *
 * @module
 * @remarks
 * "Es gibt 5 Armeen in verschiedenen Farben." The colours are what players
 * actually call each other across a table - "der Rote greift an" - so they are
 * names here rather than a palette, and the seat you sit in decides which you
 * are.
 *
 * The colours have to work on a map whose background is already six continent
 * colours, and they must be told apart at the size of a counter. So they are
 * strong and far apart in hue, each with a matching ink for the number written
 * on top of it, and the number is drawn in that ink rather than always in white:
 * white on yellow is unreadable at six pixels.
 */

/** One army's colour and what it is called. */
export type Army = {
  readonly name: string;
  /** The counter's fill. */
  readonly colour: string;
  /** What a number on that counter is written in. */
  readonly ink: string;
};

/**
 * The five armies, in seat order.
 *
 * @remarks
 * Not the continent colours. Those are the map; these stand on top of it, and
 * an army the colour of the ground it stands on is an army nobody can see.
 */
export const PLAYER_COLOURS: readonly Army[] = [
  { name: "Rot", colour: "#e02c26", ink: "#ffffff" },
  { name: "Blau", colour: "#1666d0", ink: "#ffffff" },
  { name: "Gelb", colour: "#f2c012", ink: "#3a2c00" },
  { name: "Schwarz", colour: "#22252b", ink: "#ffffff" },
  { name: "Weiß", colour: "#f4f2ee", ink: "#22252b" },
];

/**
 * What the two-player game's neutral armies are called.
 *
 * @remarks
 * Named rather than numbered, because they are things you talk about: you do
 * not walk round the third neutral army, you walk round Weiß. They take the
 * three colours the two players did not, which is what the box does with the
 * spare boxes of pieces.
 *
 * The colour alone, without a "(neutral)" hung on it: the standings already
 * mark them as neutral in their own column, and the longer name wrapped onto
 * two lines there and dragged the numbers beside it apart. In the log it reads
 * better too - "Du: Weiß verstärkt" is what somebody would actually say.
 */
export const NEUTRAL_NAMES: readonly string[] = ["Gelb", "Schwarz", "Weiß"];

/**
 * The army one seat plays.
 *
 * @param seat - the seat index
 * @returns its colour and name; seats past the fifth wrap, which cannot happen
 */
export function armyOf(seat: number): Army {
  return PLAYER_COLOURS[seat % PLAYER_COLOURS.length];
}
