/**
 * What stands in the blocks: houses to live in, and places with a name.
 *
 * @module
 * @remarks
 * Fifteen sorts, one row each - the colour of the roof, the colour of the wall,
 * how tall it builds, whether it is one house or several, and the sign over the
 * door. The city plan decides which block gets which, always the same way for
 * the same block, so that after an hour you know where the hospital is.
 *
 * The ordinary houses come first and often; a city of nothing but landmarks is
 * a theme park. The named places appear once or twice each and are what turns a
 * grid of blocks into somewhere you can give directions in.
 */

/** What kind of building fills a block. */
export type BuildingKind =
  | "house"
  | "double"
  | "terrace"
  | "tower"
  | "bank"
  | "guns"
  | "mint"
  | "fire"
  | "hospital"
  | "police"
  | "barber"
  | "restaurant"
  | "casino"
  | "hall"
  | "market"
  | "club"
  | "prison";

/** How the houses of a block are cut up. */
export type BuildingShape = "one" | "two" | "row";

/** One sort of building, as numbers and colours. */
export type Building = {
  readonly kind: BuildingKind;
  /** What is written over the door, or empty for the plain ones. */
  readonly name: string;
  /** The roof. */
  readonly roof: string;
  /** The wall you see. */
  readonly wall: string;
  /** How the block is divided: one house, two, or a row of them. */
  readonly shape: BuildingShape;
  /** How tall it builds, against the height the block would have anyway. */
  readonly rise: number;
  /**
   * How tall it builds whatever the block, in pixels, or null for {@link rise}.
   *
   * @remarks
   * **Some buildings are a height rather than a share of one.** A tower block
   * downtown ought to be taller than one on the edge of town, and `rise` gives
   * it that. A single-storey shop ought not: a barber's is one room with a
   * window and a door in front of it, and it is that whether it stands between
   * two office blocks or out in the suburbs. Where this is set, the block's
   * own dice are simply not asked. See {@link wallHeight}.
   */
  readonly flat: number | null;
  /** The colour of the sign, if it has one. */
  readonly sign: string;
  /**
   * Whether the ground floor is a shop window rather than a wall with panes.
   *
   * @remarks
   * **A shop shows what it sells.** A barber's, a gun shop, a restaurant and a
   * supermarket all have the same thing at street level: one sheet of glass
   * either side of the door, floor to lintel, with the mullions between the
   * panes and nothing else. Two small windows with sills and glazing bars is
   * what a **house** has - on a shop it reads as somebody's front room with a
   * sign screwed over it.
   *
   * Only the ground floor. Whatever is above a shop is flats, and flats have
   * windows.
   */
  readonly glass: boolean;
};

/**
 * How tall a fire station is, in pixels.
 *
 * @remarks
 * Sixty-eight: the bay itself is four metres to the lintel, and what stands on
 * top of it is the rest of the building.
 */
const FIRE_HIGH = 68;

/**
 * How tall a hospital is, in pixels.
 *
 * @remarks
 * Eighty-four: three storeys of {@link STOREY} - three metres each at eight
 * and a half pixels to the metre - and a parapet over them for the sign and
 * the edge of the landing pad.
 */
const HOSPITAL_HIGH = 84;

/**
 * How tall the town hall is, in pixels.
 *
 * @remarks
 * Fifty-six: two storeys of {@link STOREY}, which is what a town hall has -
 * the hall and the offices over it - and a fixed number rather than the
 * block's own dice, because it is that building whether it stands downtown or
 * at the end of the last street before the beach. The pitched roof goes on top
 * of this; see `hallBox` in the renderer.
 */
const HALL_HIGH = 56;

/**
 * How tall a barber's shop is, in pixels.
 *
 * @remarks
 * Thirty-four, which at eight and a half pixels to the metre is four metres:
 * a shopfront of about two and a half and a band of wall over it for the name.
 */
const BARBER_HIGH = 34;

/**
 * How tall one of these stands, in pixels.
 *
 * @param sort - what is built there
 * @param blockHigh - what the block's own dice rolled for it
 * @returns the height of its front wall
 * @remarks
 * Asked by the picture and by the floor - the roof one lands a jetpack on has
 * to be the roof one can see - so the two read the same sentence rather than
 * each multiplying the same two numbers and one of them forgetting.
 */
export function wallHeight(sort: Building, blockHigh: number): number {
  return sort.flat ?? blockHigh * sort.rise;
}

/** Every sort there is. */
export const BUILDINGS: Readonly<Record<BuildingKind, Building>> = {
  house: {
    kind: "house",
    name: "",
    roof: "#a8a29e",
    wall: "#78716c",
    shape: "one",
    rise: 1,
    flat: null,
    sign: "#e2e8f0",
    glass: false,
  },
  double: {
    kind: "double",
    name: "",
    roof: "#c4b5a0",
    wall: "#9a8c78",
    shape: "two",
    rise: 0.85,
    flat: null,
    sign: "#e2e8f0",
    glass: false,
  },
  terrace: {
    kind: "terrace",
    name: "",
    roof: "#b9a08f",
    wall: "#8d6e63",
    shape: "row",
    rise: 0.75,
    flat: null,
    sign: "#e2e8f0",
    glass: false,
  },
  tower: {
    kind: "tower",
    name: "",
    roof: "#94a3b8",
    wall: "#64748b",
    shape: "one",
    rise: 1.9,
    flat: null,
    sign: "#e2e8f0",
    glass: false,
  },
  bank: {
    kind: "bank",
    name: "BANK",
    roof: "#d6d3d1",
    wall: "#a8a29e",
    shape: "one",
    rise: 1.3,
    flat: null,
    sign: "#facc15",
    glass: false,
  },
  mint: {
    kind: "mint",
    // The one building in Los Santos that makes money instead of keeping it:
    // grey walls, a long hall, and gold over the door. The sign is long enough
    // that {@link signOver} shrinks it, which is the point of that loop.
    name: "LA CASA DE PAPEL",
    roof: "#3f3f46",
    wall: "#52525b",
    shape: "one",
    rise: 1.15,
    flat: null,
    sign: "#eab308",
    glass: false,
  },
  guns: {
    kind: "guns",
    name: "WAFFEN",
    roof: "#44403c",
    wall: "#57534e",
    shape: "one",
    rise: 0.85,
    flat: null,
    sign: "#b91c1c",
    glass: true,
  },
  fire: {
    kind: "fire",
    name: "FEUERWEHR",
    roof: "#b91c1c",
    wall: "#7f1d1d",
    shape: "one",
    rise: 0.9,
    // **Two storeys and the drill tower behind them.** An engine bay is high
    // before it is anything else - a ladder truck has to get in under the
    // lintel - and over it go the dormitory and the hose tower. At the height
    // the block rolled it was a garage with a sign on it.
    flat: FIRE_HIGH,
    sign: "#fde047",
    glass: false,
  },
  hospital: {
    kind: "hospital",
    name: "KRANKENHAUS",
    roof: "#e2e8f0",
    wall: "#cbd5e1",
    shape: "one",
    rise: 1.4,
    // **Three floors and a landing pad, the same in all four quarters.** A
    // hospital that is a bungalow on the edge of town and a tower downtown is
    // two different buildings with the same sign; this is the one the
    // ambulance and the helicopter both come to, so it is a height rather
    // than a share of one.
    flat: HOSPITAL_HIGH,
    sign: "#ef4444",
    glass: false,
  },
  police: {
    kind: "police",
    name: "POLIZEI",
    roof: "#1e3a8a",
    wall: "#1e293b",
    shape: "one",
    rise: 1.1,
    flat: null,
    sign: "#93c5fd",
    glass: false,
  },
  barber: {
    kind: "barber",
    name: "BARBER",
    roof: "#f1f5f9",
    wall: "#94a3b8",
    shape: "one",
    rise: 0.7,
    // **One storey, and the same one everywhere.** Four metres to the eaves:
    // room for a shop window, a door a person walks through without ducking
    // and a band of wall over them for the name. At the block's own height it
    // was under three metres, which is a wall with a letterbox in it, and
    // downtown it would have been a barber's shop in a tower.
    flat: BARBER_HIGH,
    sign: "#ef4444",
    glass: true,
  },
  restaurant: {
    kind: "restaurant",
    name: "RESTAURANT",
    roof: "#a16207",
    wall: "#78350f",
    shape: "one",
    rise: 0.8,
    flat: null,
    sign: "#fde047",
    glass: true,
  },
  casino: {
    kind: "casino",
    name: "CASINO",
    roof: "#7e22ce",
    wall: "#581c87",
    shape: "one",
    rise: 1.5,
    flat: null,
    sign: "#fde047",
    glass: false,
  },
  // **The one building in this city made of brick.** A town hall is the
  // oldest thing on the street and looks it: red brick, stone at the foot and
  // under the eaves, and shutters at the windows. See `hallBox` in the
  // renderer, which is what actually lays the courses.
  hall: {
    kind: "hall",
    name: "RATHAUS",
    roof: "#57534e",
    wall: "#9a3412",
    shape: "one",
    rise: 1.2,
    flat: HALL_HIGH,
    sign: "#fef3c7",
    glass: false,
  },
  market: {
    kind: "market",
    name: "SUPERMARKT",
    roof: "#0d9488",
    wall: "#115e59",
    shape: "one",
    rise: 0.65,
    flat: null,
    sign: "#f8fafc",
    glass: true,
  },
  club: {
    kind: "club",
    name: "NACHTCLUB",
    roof: "#1e1b4b",
    wall: "#312e81",
    shape: "one",
    rise: 0.9,
    flat: null,
    sign: "#f472b6",
    glass: false,
  },
  prison: {
    kind: "prison",
    name: "GEFÄNGNIS",
    roof: "#57534e",
    wall: "#44403c",
    shape: "one",
    rise: 1,
    flat: null,
    sign: "#f97316",
    glass: false,
  },
};

/**
 * What goes where, drawn from evenly.
 *
 * @remarks
 * Two thirds ordinary housing, one third places with a name. The list is the
 * mix: the more often a sort appears in it, the more of them the city has.
 *
 * The place in the row counts too. The block hash is quick rather than perfectly
 * flat - some rows come up four times as often as others - so the named places
 * are sorted into it on purpose: the barber in a thin row, the gun shops in a
 * fat one. A rare barber is a curiosity; a gun shop nobody can find is a shop
 * that is not there.
 *
 * Two of them are not drawn from this at all. See {@link ONE_ONLY}.
 */
export const THE_BLOCKS: readonly BuildingKind[] = [
  "house",
  "house",
  "house",
  "house",
  "house",
  "house",
  "double",
  "double",
  "double",
  "terrace",
  "terrace",
  "terrace",
  "tower",
  "tower",
  "hall",
  "mint",
  "police",
  "barber",
  "restaurant",
  "casino",
  "club",
  "fire",
  "guns",
  "bank",
  "hospital",
  "prison",
  "market",
];
