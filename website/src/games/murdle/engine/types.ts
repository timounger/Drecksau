/**
 * What a Murdle case is made of: the suspects, the weapons, the places and
 * sometimes the motives, the clues and statements about them, and the
 * solution.
 *
 * @module
 * @remarks
 * **A clue is a small piece of code, not an entry in a list.** The printed
 * cases say things like "the other person just as tall as Mx. Tangerine had
 * the flare" or "whoever wanted to prove they're tough was outdoors". So a
 * clue carries its German sentence and a predicate over a {@link Scene} - one
 * way of handing out the weapons, places and motives. The solver tries every
 * way and keeps those for which every clue holds.
 */

/** The height of a suspect whose card blacks it out, like Mister Shadow's. */
export const REDACTED_HEIGHT = 0;

/** Which hand a suspect writes with. */
export type Handedness = "left" | "right";

/** The colours of eyes the cases print. */
export type EyeColour =
  | "hazel"
  | "lightBrown"
  | "darkBrown"
  | "green"
  | "blue"
  | "gray"
  | "black"
  /** Blacked out on the card, like Mister Shadow's in case 64. */
  | "redacted";

/** The colours of hair the cases print - or none at all. */
export type HairColour =
  | "lightBrown"
  | "darkBrown"
  | "blond"
  | "red"
  | "black"
  | "gray"
  | "silver"
  | "blue"
  | "white"
  | "bald"
  /** Blacked out on the card, like Mister Shadow's. */
  | "redacted";

/** The twelve signs of the zodiac, as Exhibit B lists them. */
export type StarSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

/** How heavy a weapon is. */
export type Weight = "light" | "medium" | "heavy";

/** How hard a case is - the four parts of the book, and the tutorial before them. */
export type Difficulty =
  "tutorial" | "elementary" | "occult" | "hardBoiled" | "impossible";

/** The books the cases come from - one category of the list each. */
export type Series = "volume1";

/** The kinds of things a case has, one block of the grid per pair. */
export type Category = "suspects" | "weapons" | "locations" | "motives";

/** The exhibits of the book a case may need. */
export type ExhibitId = "detectiveKit" | "astrology";

/** One suspect, as the case card prints them. */
export type Suspect = {
  /** Unique within the case, across every category. */
  readonly id: string;
  /** The name, with a German title where the book has a profession or rank. */
  readonly name: string;
  /** The picture on the card and in the grid. */
  readonly icon: string;
  readonly description: string;
  /**
   * The height, in centimetres - the book prints feet and inches.
   * {@link REDACTED_HEIGHT} where the card blacks it out.
   */
  readonly heightCm: number;
  readonly hand: Handedness;
  readonly eyes: EyeColour;
  readonly hair: HairColour;
  /** Only from the occult part of the book on. */
  readonly sign?: StarSign;
};

/** One weapon. */
export type Weapon = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly weight: Weight;
  /** What it is made of, in German - only from the hard boiled part on. */
  readonly material?: string;
};

/** One place. */
export type Location = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly indoors: boolean;
};

/** One motive - only in the hard boiled part and after. */
export type Motive = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
};

/** What one suspect had, where they were and why. */
export type Assignment = {
  readonly weapon: string;
  readonly location: string;
  readonly motive?: string;
};

/** One whole way it could have been: per suspect id, their assignment. */
export type World = Readonly<Record<string, Assignment>>;

/** One way it could have been, with questions a clue can ask of it. */
export type Scene = {
  readonly world: World;
  /** A suspect by id. */
  readonly suspect: (id: string) => Suspect;
  /** Who had this weapon. */
  readonly holder: (weapon: string) => Suspect;
  /** Who was at this place. */
  readonly at: (location: string) => Suspect;
  /** Who had this motive. */
  readonly driven: (motive: string) => Suspect;
  /** What this suspect had. */
  readonly weaponOf: (suspect: string) => Weapon;
  /** Where this suspect was. */
  readonly locationOf: (suspect: string) => Location;
  /** Why this suspect would have done it - null in a case without motives. */
  readonly motiveOf: (suspect: string) => Motive | null;
};

/** One line under "Hinweise & Beweise". */
export type Clue = {
  /** The German sentence, as printed. */
  readonly text: string;
  /** Whether it holds in a scene. */
  readonly holds: (scene: Scene) => boolean;
};

/** One statement of a suspect - true unless they are the murderer. */
export type Statement = {
  /** Who says it. */
  readonly by: string;
  /** What they say, in German. */
  readonly text: string;
  /** Whether what they say is so. */
  readonly holds: (scene: Scene) => boolean;
};

/**
 * The last clue, printed in bold: where the body was found - or what it was
 * killed with, when the clue names the weapon instead of the place.
 */
export type Body =
  | {
      readonly text: string;
      /** The place it means - the murderer is whoever was there. */
      readonly location: string;
    }
  | {
      readonly text: string;
      /** The weapon it means - the murderer is whoever had it. */
      readonly weapon: string;
    };

/**
 * One square a step of help concludes: the pairing of two items of different
 * categories - by their ids, in either order - and whether it holds.
 */
export type HintMark = {
  readonly a: string;
  readonly b: string;
  readonly value: "check" | "cross";
};

/** One step of help. */
export type Hint = {
  readonly text: string;
  /** Whether it is the book's own hint rather than a step of the solution path. */
  readonly book?: true;
  /**
   * The squares it concludes - then it can be carried out. Every one agrees
   * with the solution (scripts/murdle-check.ts), and all steps carried out in
   * order, with auto-cross, fill the whole grid.
   */
  readonly marks?: readonly HintMark[];
};

/** The answer to "Wer? Womit? Wo? (Warum?)". */
export type Accusation = {
  readonly suspect: string;
  readonly weapon: string;
  readonly location: string;
  readonly motive?: string;
};

/** What the accusation form has chosen so far - "" where nothing is. */
export type Draft = {
  readonly suspect: string;
  readonly weapon: string;
  readonly location: string;
  readonly motive: string;
};

/** One case. */
export type Case = {
  /** Unique, for storage - never change it. */
  readonly id: string;
  /** The number in the book, or null for the tutorial before the cases. */
  readonly number: number | null;
  readonly title: string;
  /** The lines under the title. */
  readonly story: string;
  /** The book it comes from. */
  readonly series: Series;
  readonly difficulty: Difficulty;
  readonly suspects: readonly Suspect[];
  readonly weapons: readonly Weapon[];
  readonly locations: readonly Location[];
  readonly motives?: readonly Motive[];
  readonly clues: readonly Clue[];
  /** Where the body was found - missing when the statements alone tell. */
  readonly body?: Body;
  /** The statements, where the case has them: the murderer lies, the others tell the truth. */
  readonly statements?: readonly Statement[];
  /** The exhibits its clues refer to. */
  readonly exhibits?: readonly ExhibitId[];
  /** Who had what where (and why) - the solver proves it is the only way. */
  readonly solution: World;
  /** The murderer's id. */
  readonly murderer: string;
  readonly hints: readonly Hint[];
  /** What the book says once the case is solved, where the sample prints it. */
  readonly outro?: string;
};
