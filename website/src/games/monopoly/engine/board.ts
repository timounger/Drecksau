/**
 * The forty fields of the board, in the order you walk them.
 *
 * @module
 * @remarks
 * **Where this came from.** The rulebook has the rules and not the board - it
 * prints four title deeds as examples and names four fields. But those four are
 * enough to identify which board this is: Chausseestraße at a rent of 6 with
 * houses at 50, Poststraße at 8, Opernplatz at 240 and Südbahnhof at 200 are the
 * German Monopoly board and no other. The rest is written out here, and every
 * figure the rulebook does print is checked against it in the module's tests.
 *
 * The order matters and is the board's own, clockwise from LOS. Everything else
 * in the game is an index into it: a token's position, a card that says "go to
 * the next station", the colour groups that decide rent.
 *
 * Rents are a **list of six**: bare, one house, two, three, four, hotel. Not a
 * formula - there is none. The jump from three houses to four is the point at
 * which Monopoly stops being about luck, and it is a different jump on every
 * street.
 */

/** What kind of field this is. */
export type FieldKind =
  | "go"
  | "street"
  | "station"
  | "utility"
  | "tax"
  | "chance"
  | "chest"
  | "jail"
  | "parking"
  | "goToJail";

/** The eight colour groups, in board order. */
export type GroupId =
  "braun" | "hellblau" | "pink" | "orange" | "rot" | "gelb" | "gruen" | "blau";

/** One field of the board. */
export type Field = {
  /** Where it sits, 0 for LOS to 39. */
  readonly at: number;
  readonly name: string;
  readonly kind: FieldKind;
  /** The colour group, for a street. */
  readonly group?: GroupId;
  /** What the bank charges for it, for anything ownable. */
  readonly price?: number;
  /** Bare rent, then one to four houses, then the hotel. */
  readonly rent?: readonly number[];
  /** What one house costs here; a hotel costs the same plus four houses. */
  readonly houseCost?: number;
  /** What the bank lends against it. */
  readonly mortgage?: number;
  /** What a tax field takes. */
  readonly tax?: number;
  /**
   * A shorter name, for the board itself.
   *
   * @remarks
   * A field on the drawn board is about a centimetre wide. "Gefängnis / Nur zu
   * Besuch" does not go in it, and shrinking the type until it does makes the
   * whole board unreadable to fix one corner. Only the handful that need it
   * have one.
   */
  readonly short?: string;
};

/** One colour group and how it looks. */
export type Group = {
  readonly id: GroupId;
  readonly name: string;
  readonly colour: string;
  /** What a number written on that colour has to be. */
  readonly ink: string;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- board data: every
   number below is printed on the board or on a title deed. */

/** The eight colour groups. */
export const GROUPS: readonly Group[] = [
  { id: "braun", name: "Braun", colour: "#955436", ink: "#ffffff" },
  { id: "hellblau", name: "Hellblau", colour: "#aae0fa", ink: "#1b2a33" },
  { id: "pink", name: "Pink", colour: "#d93a96", ink: "#ffffff" },
  { id: "orange", name: "Orange", colour: "#f7941d", ink: "#2b1a00" },
  { id: "rot", name: "Rot", colour: "#ed1b24", ink: "#ffffff" },
  { id: "gelb", name: "Gelb", colour: "#fef200", ink: "#2b2600" },
  { id: "gruen", name: "Grün", colour: "#1fb25a", ink: "#ffffff" },
  { id: "blau", name: "Blau", colour: "#0072bb", ink: "#ffffff" },
];

/** The board, clockwise from LOS. */
export const FIELDS: readonly Field[] = [
  { at: 0, name: "LOS", kind: "go" },
  {
    at: 1,
    name: "Badstraße",
    kind: "street",
    group: "braun",
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    houseCost: 50,
    mortgage: 30,
  },
  { at: 2, name: "Gemeinschaftsfeld", kind: "chest", short: "Gemeinschaft" },
  {
    at: 3,
    name: "Turmstraße",
    kind: "street",
    group: "braun",
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    houseCost: 50,
    mortgage: 30,
  },
  {
    at: 4,
    name: "Einkommensteuer",
    kind: "tax",
    tax: 200,
    short: "Einkommensteuer",
  },
  {
    at: 5,
    name: "Südbahnhof",
    kind: "station",
    price: 200,
    mortgage: 100,
  },
  {
    at: 6,
    name: "Chausseestraße",
    kind: "street",
    group: "hellblau",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  { at: 7, name: "Ereignisfeld", kind: "chance", short: "Ereignis" },
  {
    at: 8,
    name: "Elisenstraße",
    kind: "street",
    group: "hellblau",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  {
    at: 9,
    name: "Poststraße",
    kind: "street",
    group: "hellblau",
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgage: 60,
  },
  {
    at: 10,
    name: "Gefängnis / Nur zu Besuch",
    kind: "jail",
    short: "Gefängnis",
  },
  {
    at: 11,
    name: "Seestraße",
    kind: "street",
    group: "pink",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    at: 12,
    name: "Elektrizitätswerk",
    kind: "utility",
    price: 150,
    mortgage: 75,
    short: "E-Werk",
  },
  {
    at: 13,
    name: "Hafenstraße",
    kind: "street",
    group: "pink",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    at: 14,
    name: "Neue Straße",
    kind: "street",
    group: "pink",
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgage: 80,
  },
  { at: 15, name: "Westbahnhof", kind: "station", price: 200, mortgage: 100 },
  {
    at: 16,
    short: "Münchener Str.",
    name: "Münchener Straße",
    kind: "street",
    group: "orange",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  { at: 17, name: "Gemeinschaftsfeld", kind: "chest", short: "Gemeinschaft" },
  {
    at: 18,
    name: "Wiener Straße",
    kind: "street",
    group: "orange",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  {
    at: 19,
    name: "Berliner Straße",
    kind: "street",
    group: "orange",
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgage: 100,
  },
  { at: 20, name: "Frei Parken", kind: "parking" },
  {
    at: 21,
    name: "Theaterstraße",
    kind: "street",
    group: "rot",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  { at: 22, name: "Ereignisfeld", kind: "chance", short: "Ereignis" },
  {
    at: 23,
    name: "Museumstraße",
    kind: "street",
    group: "rot",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  {
    at: 24,
    name: "Opernplatz",
    kind: "street",
    group: "rot",
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    houseCost: 150,
    mortgage: 120,
  },
  { at: 25, name: "Nordbahnhof", kind: "station", price: 200, mortgage: 100 },
  {
    at: 26,
    name: "Lessingstraße",
    kind: "street",
    group: "gelb",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    at: 27,
    name: "Schillerstraße",
    kind: "street",
    group: "gelb",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  { at: 28, name: "Wasserwerk", kind: "utility", price: 150, mortgage: 75 },
  {
    at: 29,
    name: "Goethestraße",
    kind: "street",
    group: "gelb",
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    houseCost: 150,
    mortgage: 140,
  },
  {
    at: 30,
    name: "Gehen Sie in das Gefängnis",
    kind: "goToJail",
    short: "Ins Gefängnis",
  },
  {
    at: 31,
    name: "Rathausplatz",
    kind: "street",
    group: "gruen",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  {
    at: 32,
    name: "Hauptstraße",
    kind: "street",
    group: "gruen",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  { at: 33, name: "Gemeinschaftsfeld", kind: "chest", short: "Gemeinschaft" },
  {
    at: 34,
    name: "Bahnhofstraße",
    kind: "street",
    group: "gruen",
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    houseCost: 200,
    mortgage: 160,
  },
  { at: 35, name: "Hauptbahnhof", kind: "station", price: 200, mortgage: 100 },
  { at: 36, name: "Ereignisfeld", kind: "chance", short: "Ereignis" },
  {
    at: 37,
    name: "Parkstraße",
    kind: "street",
    group: "blau",
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    houseCost: 200,
    mortgage: 175,
  },
  { at: 38, name: "Zusatzsteuer", kind: "tax", tax: 100 },
  {
    at: 39,
    name: "Schlossallee",
    kind: "street",
    group: "blau",
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    houseCost: 200,
    mortgage: 200,
  },
];

/** What a station charges, by how many its owner holds. */
export const STATION_RENT: readonly number[] = [0, 25, 50, 100, 200];

/** What a utility multiplies the dice by, by how many its owner holds. */
export const UTILITY_FACTOR: readonly number[] = [0, 4, 10];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How many fields there are - once round the board. */
export const BOARD_SIZE = FIELDS.length;

/** Where the jail is, and where "just visiting" stands. */
export const JAIL_AT = 10;

/** Where LOS is. */
export const GO_AT = 0;

/** Where Frei Parken is - the corner opposite LOS. */
export const PARKING_AT = 20;

/** Where the corner that sends you to jail is. */
export const TO_JAIL_AT = 30;

/** Fields by index, for the lookups the referee does constantly. */
const BY_GROUP: Readonly<Record<string, readonly number[]>> =
  Object.fromEntries(
    GROUPS.map((group) => [
      group.id,
      FIELDS.filter((field) => field.group === group.id).map(
        (field) => field.at,
      ),
    ]),
  );

/**
 * What a field is called on the board itself.
 *
 * @param at - the position
 * @returns the short name if it has one, else the full one
 */
export function labelOf(at: number): string {
  const field = fieldAt(at);
  return field.short ?? field.name;
}

/**
 * One field by position.
 *
 * @param at - the position, 0 to 39
 * @returns the field
 */
export function fieldAt(at: number): Field {
  return FIELDS[((at % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE];
}

/**
 * One colour group.
 *
 * @param id - the group's id
 * @returns the group, or null if nothing has that id
 */
export function groupOf(id: string): Group | null {
  return GROUPS.find((group) => group.id === id) ?? null;
}

/**
 * The fields of one colour group.
 *
 * @param id - the group's id
 * @returns their positions, in board order
 */
export function fieldsIn(id: GroupId): readonly number[] {
  return BY_GROUP[id] ?? [];
}

/**
 * Whether a field can be owned at all.
 *
 * @param at - the position
 * @returns true for a street, a station or a utility
 */
export function isOwnable(at: number): boolean {
  const kind = fieldAt(at).kind;
  return kind === "street" || kind === "station" || kind === "utility";
}

/** Every field somebody could own, in board order. */
export const OWNABLE: readonly number[] = FIELDS.filter((field) =>
  isOwnable(field.at),
).map((field) => field.at);

/** Every station's position. */
export const STATIONS: readonly number[] = FIELDS.filter(
  (field) => field.kind === "station",
).map((field) => field.at);

/** Every utility's position. */
export const UTILITIES: readonly number[] = FIELDS.filter(
  (field) => field.kind === "utility",
).map((field) => field.at);

/**
 * How far it is from one field to another, going clockwise.
 *
 * @param from - where the token stands
 * @param to - where it is going
 * @returns the number of steps, always forwards
 * @remarks
 * Forwards only, because that is the only way round this board: a card that
 * sends you to Südbahnhof from Schlossallee sends you past LOS, and the salary
 * is the whole reason it matters which way the counting goes.
 */
export function stepsTo(from: number, to: number): number {
  return (to - from + BOARD_SIZE) % BOARD_SIZE;
}

/**
 * The next station clockwise from a field.
 *
 * @param from - where the token stands
 * @returns the position of the next station
 */
export function nextStation(from: number): number {
  return nextOf(from, STATIONS);
}

/**
 * The next utility clockwise from a field.
 *
 * @param from - where the token stands
 * @returns the position of the next utility
 */
export function nextUtility(from: number): number {
  return nextOf(from, UTILITIES);
}

/** The next of a set of fields, clockwise and never standing still. */
function nextOf(from: number, among: readonly number[]): number {
  return [...among].sort(
    (left, right) => nonZeroSteps(from, left) - nonZeroSteps(from, right),
  )[0];
}

/** Steps clockwise, counting standing still as a whole lap. */
function nonZeroSteps(from: number, to: number): number {
  const steps = stepsTo(from, to);
  return steps === 0 ? BOARD_SIZE : steps;
}
