/**
 * The shapes of part B: the concert, the magic school, the air mail, the
 * snow angels, the visiting children, the snowman contest, the photo points,
 * the night sky's shooting stars and fireworks, the gathering of everybody,
 * the presents and Christmas Eve - and what of it is kept between visits.
 *
 * @module
 */
import type { Dir } from "./types";

/** A point on the outdoor map, map px. */
export type Point = { x: number; y: number };

/** Grantelbart rocking the stage. */
export type Concert = {
  /** Index of Grantelbart. */
  readonly who: number;
  /** Seconds since it began. */
  elapsed: number;
  /** Seconds until the next riff. */
  riffIn: number;
};

/** Why everybody gathers: the concert or Christmas Eve. */
export type GatherKind = "concert" | "eve";

/** Everybody nobody steers walking to a place and staying there. */
export type Gather = {
  readonly kind: GatherKind;
  /** Where each one goes, by index of the character. */
  readonly spots: Map<number, Point>;
  /** Who has arrived. */
  readonly arrived: Set<number>;
  /** Where everybody looks once there. */
  readonly look: Point;
  /** Seconds since the call. */
  elapsed: number;
};

/** A thing Gilfi throws towards the baskets, flying. */
export type SchoolThrow = {
  /** Where it is over the ground, map px. */
  x: number;
  y: number;
  /** Which way it flies, a unit step. */
  readonly dx: number;
  readonly dy: number;
  /** Map px flown so far. */
  flown: number;
};

/** A round at the magic school. */
export type SchoolRound = {
  /** Index of Gilfi. */
  readonly who: number;
  /** Seconds left. */
  left: number;
  /** Baskets hit this round. */
  hits: number;
  /** Which toy floats next to Gilfi (index into the toys), and is thrown. */
  item: number;
  /** The throw in the air, or null while the toy floats beside Gilfi. */
  flight: SchoolThrow | null;
  /** The basket last hit and seconds left of its sparkle. */
  flash: number;
  flashBasket: number;
};

/** Trixi's air mail: three roofs to deliver to, against the clock. */
export type AirMail = {
  /** Index of Trixi. */
  readonly who: number;
  /** The roofs to deliver to, index into the roof list, in any order. */
  readonly roofs: readonly number[];
  /** Which of them have their parcel. */
  readonly done: Set<number>;
  /** Seconds since the order. */
  time: number;
};

/** What a visiting child does right now. */
export type KidMode = "wait" | "happy" | "leave";

/** A child come to bring a wish. */
export type Kid = {
  /** Which of the four looks. */
  readonly look: number;
  /** Which waiting place. */
  readonly spot: number;
  /** The toy wished for, index into the toys. */
  readonly wish: number;
  /** Whether Santa has seen the wish. */
  known: boolean;
  x: number;
  y: number;
  dir: Dir;
  mode: KidMode;
  /** Seconds in this mode. */
  time: number;
  /** A speech bubble, or null. */
  say: string | null;
  sayLeft: number;
};

/** The snowman of the contest on its plot. */
export type ContestSnowman = {
  /** Balls stacked, 0 to 3. */
  balls: number;
  nose: boolean;
  /** The hat: 0 none, otherwise the part's number (2 top hat, 3 bucket). */
  hat: number;
  /** The scarf: 0 none, otherwise the part's number (4 red, 5 green). */
  scarf: number;
  /** Which hat and scarf the stands hand out next. */
  nextHat: number;
  nextScarf: number;
  /** Stars the jury gave, 0 while not judged. */
  stars: number;
  /** Seconds the jury still holds up its card. */
  card: number;
  /** Seconds until the snowman melts away. */
  meltIn: number;
};

/** A request to take a photo of the view, taken by the screen. */
export type PhotoShot = { readonly id: string };

/** A shooting star across the night sky, in view px. */
export type ShootingStar = {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
  /** Seconds since it appeared. */
  time: number;
  /** Whether a wish has been made on it. */
  wished: boolean;
};

/** A firework rocket, rising or burst, in view px. */
export type Rocket = {
  x: number;
  y: number;
  readonly vy: number;
  /** Height at which it bursts. */
  readonly top: number;
  /** Colour, index into the firework colours. */
  readonly tint: number;
};

/** One spark of a burst rocket, in view px. */
export type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  readonly tint: number;
};

/** The fireworks of New Year's Eve. */
export type Fireworks = {
  readonly rockets: Rocket[];
  readonly sparks: Spark[];
  /** Seconds until the next rocket goes up. */
  nextIn: number;
  /** Bursts seen outside this visit. */
  seen: number;
};

/** Somebody wrapping a toy at the packing table. */
export type Wrapping = {
  readonly who: number;
  /** Seconds left. */
  left: number;
  /** The toy, index into the toys. */
  readonly toy: number;
};

/** A present on its way from the pile to somebody on Christmas Eve. */
export type EveGift = {
  /** Index of who receives it. */
  readonly to: number;
  /** Seconds since it left the pile. */
  age: number;
  /** The wrapping paper, 0 to 3. */
  readonly paper: number;
};

/** Christmas Eve under the gift tree. */
export type Eve = {
  /** Seconds since it began. */
  elapsed: number;
  /** Who still waits for a present, in order. */
  readonly queue: number[];
  /** Presents in the air. */
  readonly gifts: EveGift[];
  /** Seconds until the next present flies. */
  nextIn: number;
};

/** Everything of part B that changes and mends itself; none of it is saved. */
export type ExtrasState = {
  concert: Concert | null;
  gather: Gather | null;
  school: SchoolRound | null;
  airMail: AirMail | null;
  /** Per angel place: seconds the imprint still lies in the snow; 0 for none. */
  readonly angels: number[];
  /** Whether Balbo's current fall has already left its imprint. */
  stamped: boolean;
  readonly kids: Kid[];
  /** Seconds until the next child may come. */
  kidIn: number;
  readonly snowman: ContestSnowman;
  /** The photo the screen should take, or null. */
  shot: PhotoShot | null;
  /** Seconds the camera's flash still shows. */
  flash: number;
  shooting: ShootingStar | null;
  /** Seconds until the next shooting star, at night. */
  shootIn: number;
  readonly fireworks: Fireworks;
  wrapping: Wrapping | null;
  eve: Eve | null;
  /** Whether Christmas Eve has been celebrated this visit. */
  eveDone: boolean;
  /** Seconds before two characters can chat again, by pair. */
  readonly chats: Map<string, number>;
};

/** Today's three little tasks and how far they are. */
export type DailyTasks = {
  /** The day they are for, "2026-12-24"; empty before the first. */
  day: string;
  /** How far each of the three tasks has come. */
  readonly done: number[];
};

/** What part B keeps between visits. */
export type ExtrasKeep = {
  /** Friendship points by pair of characters ("balbo+santa", sorted). */
  readonly friends: Map<string, number>;
  readonly daily: DailyTasks;
};

/** Part B as saved. */
export type SavedExtras = {
  readonly friends?: Readonly<Record<string, number>>;
  readonly daily?: { readonly day: string; readonly done: readonly number[] };
};
