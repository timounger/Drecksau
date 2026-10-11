/**
 * What a Murdoku case is made of: a map, its areas, the things and the ground
 * on it, the people who were there and what each of them says.
 *
 * @module
 * @remarks
 * **A clue is a small piece of code, not an entry in a list.** The printed
 * cases say things like "exactly one row north of Ivan", "the only man on
 * Desert Island" or "a woman in his room was beside the camera" - far too
 * many kinds to name each one. So a clue carries its German sentence and the
 * check behind it, written against a {@link Context} that knows the map and
 * where everybody stands. Whatever depends on the suspect's own field alone
 * goes into `unary`, which the solver uses to rule fields out early; whatever
 * needs other people goes into `check`, run once the people it names stand
 * somewhere (`uses`), or once everybody does (`global`).
 */

/** One field of the map, counted from the top left, both from nought. */
export type Cell = { readonly row: number; readonly col: number };

/** Where each suspect stands - by id, or missing while not yet placed. */
export type Placement = Readonly<Record<string, Cell>>;

/** Something that can stand on a field. */
export type ThingDef = {
  /** Its German name, as the legend shows it. */
  readonly name: string;
  /** How it is drawn. */
  readonly emoji: string;
  /** Whether a person can stand on it - a chair, a car, a boat. */
  readonly standable: boolean;
  /** What it counts as, for clues like "beside an animal": "animal", "seat", "plant" … */
  readonly kinds?: readonly string[];
};

/** What a field is underfoot. */
export type GroundDef = {
  /** Its German name, as the legend shows it. */
  readonly name: string;
  /** Its colour. */
  readonly colour: string;
  /** Its texture. */
  readonly pattern: "waves" | "grass" | "sand" | "floor" | "none";
  /** False for ground nobody can stand on - a pond on a golf course. */
  readonly standable?: boolean;
};

/** One area of the map - an island, the sea, a room. */
export type Area = {
  /** The letter it has in the case's area map. */
  readonly key: string;
  /** What it is called, as on the map. */
  readonly name: string;
  /** Where somebody standing in it is, as a phrase - "auf der Vogelinsel". */
  readonly at: string;
  /** Its ground, where the case has no ground map of its own. */
  readonly ground: string;
  /** Whether it counts as an island, for clues that ask for one. */
  readonly island?: boolean;
  /** Its colour on the map, over the ground's own. */
  readonly tint?: string;
  /** The field its name is printed on, at its bottom left. */
  readonly label: Cell;
  /** The sign ends at the label field\'s right edge and reaches to the left, where the field to its right is taken. */
  readonly labelEnd?: true;
  /** The sign keeps its full size and may reach past the area, even past the map's edge - as the book prints it. */
  readonly labelOverhang?: true;
};

/** What the clues are checked against. */
export type Context = {
  readonly level: Level;
  /** Where people stand - the suspect's own field always among them. */
  readonly placement: Placement;
  /** Whose clue this is, and where they stand. */
  readonly self: string;
  readonly cell: Cell;
  /** How many rows and columns the map has. */
  readonly rows: number;
  readonly cols: number;
  /** Whether a field is part of the map. */
  readonly inside: (cell: Cell) => boolean;
  /** The key of a field's area, or null off the map. */
  readonly areaOf: (cell: Cell) => string | null;
  /** The thing on a field, by id, or null. */
  readonly thingAt: (cell: Cell) => string | null;
  /** Whether the thing on a field is of this id or this kind. */
  readonly is: (cell: Cell, what: string) => boolean;
  /** A field's ground, by id. */
  readonly groundAt: (cell: Cell) => string;
  /** Whether a person could stand on a field. */
  readonly standable: (cell: Cell) => boolean;
  /** The fields next to one - left, right, above, below - in the same area. */
  readonly neighbours: (cell: Cell) => readonly Cell[];
  /** How many fields next to one, in its area, hold a thing of this id or kind. */
  readonly besideCount: (cell: Cell, what: string) => number;
  /** Whether a field has a thing of this id or kind next to it, in its area. */
  readonly beside: (cell: Cell, what: string) => boolean;
  /** Whether a field has this ground next to it, in its area. */
  readonly besideGround: (cell: Cell, ground: string) => boolean;
  /** Where somebody stands, or undefined. */
  readonly cellOf: (id: string) => Cell | undefined;
  /** Who stands on a field, or null. */
  readonly personAt: (cell: Cell) => string | null;
  /** Everybody standing in an area. */
  readonly peopleIn: (area: string) => readonly string[];
  /** Everybody placed. */
  readonly people: () => readonly string[];
  /** Whether somebody has a trait - "woman", "man", "cap", "zookeeper" … */
  readonly has: (id: string, trait: string) => boolean;
  /** Every field of an area. */
  readonly cellsOf: (area: string) => readonly Cell[];
};

/** What a suspect says about where they stood. */
export type Clue = {
  /** The clue as printed, in German. */
  readonly text: string;
  /** The victim: alone in its area with exactly one other - the culprit. */
  readonly victim?: boolean;
  /** What the suspect's own field must be like - checked first, and early. */
  readonly unary?: (context: Context) => boolean;
  /** What else must hold, once the people in `uses` stand somewhere. */
  readonly check?: (context: Context) => boolean;
  /** Whose places the check needs, besides the suspect's own. */
  readonly uses?: readonly string[];
  /** Whether the check needs everybody placed - for counts of people. */
  readonly global?: boolean;
  /** The fields that light up while the suspect is picked. */
  readonly glow?: (level: Level) => readonly Cell[];
};

/** A rule of the whole case, printed under the suspects. */
export type Rule = {
  /** The rule as printed, in German. */
  readonly text: string;
  /**
   * A note stuck on the page (the detective's post-it) rather than a rule
   * under the magnifier: shown as a note, and never checked.
   */
  readonly note?: true;
  /** The areas this rule is about, marked with a crown on their signs - the nobles' rooms. */
  readonly crowned?: readonly string[];
  /** What a suspect's own field must be like under this rule. */
  readonly unary?: (suspect: Suspect, context: Context) => boolean;
  /** What must hold once everybody stands. */
  readonly check?: (context: Context) => boolean;
  /**
   * For the solver only: whether a partial placement can still lead to a
   * solution - a lookahead that makes large cases fast. Never shown to the
   * player: a placement that cannot be finished is not one that breaks a clue.
   * The context's suspect is the one placed last.
   */
  readonly prune?: (context: Context) => boolean;
};

/** The side of a field a window is on. */
export type Side = "top" | "bottom" | "left" | "right";

/** A window in the wall beside a field: the field in front of it, and the side. */
export type WallWindow = {
  readonly at: Cell;
  readonly side: Side;
  /** A chalkboard on the wall instead of a window - only the look. */
  readonly board?: true;
  /** How many fields along the wall it reaches, from `at` to the right or down; one if left out. */
  readonly length?: number;
  /** What is written in chalk on a board. */
  readonly text?: string;
};

/** One thing over a block of fields, from its top left field. */
export type Piece = {
  readonly at: Cell;
  readonly rows: number;
  readonly cols: number;
  /** A rug drawn as a plain mat - the red mat in a boxing ring - without border pattern or fringe. */
  readonly plain?: true;
  /**
   * What the piece shows, when its fields carry different things - a car
   * whose back field is a thing of its own, or a rug whose top left field has
   * a plant on it. Fields of that thing or kind give way to the piece; any
   * other thing on it is drawn on top.
   */
  readonly thing?: string;
};

/** One person of the case. */
export type Suspect = {
  /** One letter, as on the pawn. */
  readonly id: string;
  readonly name: string;
  /** How the clue speaks of them - and whether they count as a woman or a man. */
  readonly pronoun: "sie" | "er";
  /** What else is true of them, as the portraits show: "cap", "glasses", "zookeeper" … */
  readonly traits?: readonly string[];
  /**
   * Whether the piece can lie anywhere on the map, even under a thing nobody
   * can stand on - a buried treasure. People never can.
   */
  readonly buried?: boolean;
  readonly clue: Clue;
  /** The colour of the pawn and the portrait. */
  readonly colour: string;
  /** The face on the portrait. */
  readonly face: string;
};

/** How hard a case is, as printed on it. */
/** The collection a case comes from: a book, or the puzzles published online. */
export type Series =
  | "original"
  | "timeTravel"
  | "worldTravel"
  | "beyondGrave"
  | "family"
  | "online"
  | "contest";

export type Difficulty = "veryEasy" | "easy" | "medium" | "hard" | "expert";

/** One step of the way to the solution. */
export type Hint = {
  /** The reasoning, as a sentence or two. */
  readonly text: string;
  /** Who this step puts down for certain, and where. */
  readonly place?: Placement;
  /** Which fields this step rules out. */
  readonly cross?: readonly Cell[];
};

/** One whole case. */
export type Level = {
  /** Stable, for the saved progress - never reuse one. */
  readonly id: string;
  readonly name: string;
  /** How hard the case is - not for a case from a book, which has its series instead. */
  readonly difficulty?: Difficulty;
  /** Where the case comes from, and for a book its number in it. */
  readonly series?: { readonly book: Series; readonly number?: number };
  /** What happened, in a sentence or two. */
  readonly story: string;
  /** The word for the culprit, as subject and after "mit" - "der Dieb", "dem Dieb". */
  readonly culprit: { readonly name: string; readonly dative: string };
  readonly areas: readonly Area[];
  /** One string per row, one area key per field; `.` is off the map. */
  readonly areaMap: readonly string[];
  /** One string per row, one ground key per field - or nothing, then each area's ground. */
  readonly groundMap?: readonly string[];
  /** What the letters of the ground map stand for. */
  readonly grounds?: Readonly<Record<string, string>>;
  /** One string per row, one thing key per field; `.` is nothing. */
  readonly thingMap: readonly string[];
  /** What the letters of the thing map stand for, as ids of the catalog. */
  readonly things: Readonly<Record<string, string>>;
  /** Things this case needs that the catalog does not have. */
  readonly extraThings?: Readonly<Record<string, ThingDef>>;
  /**
   * Things that stretch over several fields - one bed over two - drawn as one
   * piece. Each field keeps its letter in the thing map; this is only how the
   * map looks. A field in the block with another thing on it (a chair on the
   * rug) shows that thing on top.
   */
  readonly pieces?: readonly Piece[];
  /**
   * Things whose fields make one object of another shape than a block - a
   * table round a corner. Each list is the fields of one; only the look.
   */
  readonly shapes?: readonly (readonly Cell[])[];
  /**
   * Fields with carpet underfoot (a ground) drawn as one rug over them, like
   * the rugs that are things - only the look, the ground stays as it is.
   */
  readonly carpets?: readonly (readonly Cell[])[];
  /**
   * Windows drawn in the wall at the side of their field, rather than as a
   * sign on it. The field keeps its window in the thing map for the clues.
   */
  readonly windows?: readonly WallWindow[];
  readonly suspects: readonly Suspect[];
  /** Rules of the whole case, printed under the suspects. */
  readonly rules?: readonly Rule[];
  /** The way to the solution, one step per hint. */
  readonly hints: readonly Hint[];
  /** Where everybody stood, as the solution sheet has it. */
  readonly solution: Placement;
  /**
   * Who the culprit is, for a case without a victim - "whoever stood in the
   * top row drew the caricature". Without it, the culprit is whoever was
   * alone with the victim.
   */
  readonly findCulprit?: (context: Context) => string | null;
  /**
   * The piece whose field is the answer, for a case without a crime - a
   * treasure hunt. Then nobody is named: the case is solved by where it lies.
   */
  readonly treasure?: string;
  /**
   * A lookahead for the solver only, never shown: false when the partial
   * placement can no longer be completed. For a case without printed rules.
   */
  readonly prune?: (context: Context) => boolean;
};
