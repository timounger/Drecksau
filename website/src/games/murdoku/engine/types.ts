/**
 * What a Murdoku case is made of: a map, its areas, the things on it and the
 * people who were there.
 *
 * @module
 * @remarks
 * A case is pure data. The map is a square of fields, each belonging to one
 * area and carrying at most one thing; the suspects each bring one clue about
 * where they stood. Everything the game does - checking a clue, telling who was
 * alone with whom, solving the case - is worked out from this, in ./rules.
 */

/** What a field is underfoot - it only decides how it is drawn. */
export type Ground = "grass" | "water" | "sand";

/** Something standing on a field. */
export type Thing =
  "house" | "boat" | "tree" | "shrub" | "shark" | "boar" | "boulder" | "cactus";

/** One field of the map, counted from the top left, both from nought. */
export type Cell = { readonly row: number; readonly col: number };

/** One area of the map - an island, the sea, a room. */
export type Area = {
  /** The letter it has in the level's area map. */
  readonly key: string;
  /** What it is called, as on the map. */
  readonly name: string;
  /** Where somebody standing in it is, as a phrase - "auf der Vogelinsel". */
  readonly at: string;
  readonly ground: Ground;
  /** Whether it counts as an island, for clues that ask for one. */
  readonly island: boolean;
  /** Its colour on the map. */
  readonly tint: string;
  /** The field its name is printed on, at its bottom left. */
  readonly label: Cell;
};

/** What a clue says about where its suspect stood. */
export type Clue =
  /** On a field carrying this thing - in a house, on a boat. */
  | { readonly kind: "on"; readonly thing: Thing }
  /** Somewhere in this area. */
  | { readonly kind: "in"; readonly area: string }
  /** Next to this thing, in the same area. */
  | { readonly kind: "beside"; readonly thing: Thing }
  /** In this column, counted from nought. */
  | { readonly kind: "column"; readonly col: number }
  /** In this row, counted from nought. */
  | { readonly kind: "row"; readonly row: number }
  /** Next to some kind of thing that this other suspect is next to as well. */
  | { readonly kind: "besideSame"; readonly other: string }
  /** On an island with exactly so many other people. */
  | { readonly kind: "crowd"; readonly others: number }
  /** The victim: alone in its area with exactly one other - the culprit. */
  | { readonly kind: "victim" };

/** One person of the case. */
export type Suspect = {
  /** One letter, as on the pawn. */
  readonly id: string;
  readonly name: string;
  /** How the clue speaks of them. */
  readonly pronoun: "sie" | "er";
  readonly clue: Clue;
  /** The colour of the pawn and the portrait. */
  readonly colour: string;
  /** The face on the portrait. */
  readonly face: string;
};

/** How hard a case is, as printed on it. */
export type Difficulty = "easy" | "medium" | "hard";

/** One whole case. */
export type Level = {
  /** Stable, for the saved progress - never reuse one. */
  readonly id: string;
  readonly name: string;
  readonly difficulty: Difficulty;
  /** What happened, in a sentence or two. */
  readonly story: string;
  /** The word for the culprit, as subject and after "mit" - "der Dieb", "dem Dieb". */
  readonly culprit: { readonly name: string; readonly dative: string };
  /** How many fields a side has. */
  readonly size: number;
  readonly areas: readonly Area[];
  /** One string per row, one area key per field. */
  readonly areaMap: readonly string[];
  /** One string per row, one thing key per field, `.` for nothing. */
  readonly thingMap: readonly string[];
  readonly suspects: readonly Suspect[];
  /**
   * The way to the solution, one step per hint - as the solution sheet of the
   * printed case gives it. Shown one at a time, as reasoning rather than
   * positions; what a step concludes can then be carried out with a click.
   */
  readonly hints: readonly Hint[];
};

/** One step of the way to the solution. */
export type Hint = {
  /** The reasoning, as a sentence or two. */
  readonly text: string;
  /** Who this step puts down for certain, and where. */
  readonly place?: Placement;
  /** Which fields this step rules out. */
  readonly cross?: readonly Cell[];
};

/** Where each suspect stands - by id, or missing while not yet placed. */
export type Placement = Readonly<Record<string, Cell>>;
