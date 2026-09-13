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
  /** The colour of the sign, if it has one. */
  readonly sign: string;
};

/** Every sort there is. */
export const BUILDINGS: Readonly<Record<BuildingKind, Building>> = {
  house: {
    kind: "house",
    name: "",
    roof: "#a8a29e",
    wall: "#78716c",
    shape: "one",
    rise: 1,
    sign: "#e2e8f0",
  },
  double: {
    kind: "double",
    name: "",
    roof: "#c4b5a0",
    wall: "#9a8c78",
    shape: "two",
    rise: 0.85,
    sign: "#e2e8f0",
  },
  terrace: {
    kind: "terrace",
    name: "",
    roof: "#b9a08f",
    wall: "#8d6e63",
    shape: "row",
    rise: 0.75,
    sign: "#e2e8f0",
  },
  tower: {
    kind: "tower",
    name: "",
    roof: "#94a3b8",
    wall: "#64748b",
    shape: "one",
    rise: 1.9,
    sign: "#e2e8f0",
  },
  bank: {
    kind: "bank",
    name: "BANK",
    roof: "#d6d3d1",
    wall: "#a8a29e",
    shape: "one",
    rise: 1.3,
    sign: "#facc15",
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
    sign: "#eab308",
  },
  guns: {
    kind: "guns",
    name: "WAFFEN",
    roof: "#44403c",
    wall: "#57534e",
    shape: "one",
    rise: 0.85,
    sign: "#b91c1c",
  },
  fire: {
    kind: "fire",
    name: "FEUERWEHR",
    roof: "#b91c1c",
    wall: "#7f1d1d",
    shape: "one",
    rise: 0.9,
    sign: "#fde047",
  },
  hospital: {
    kind: "hospital",
    name: "KRANKENHAUS",
    roof: "#e2e8f0",
    wall: "#cbd5e1",
    shape: "one",
    rise: 1.4,
    sign: "#ef4444",
  },
  police: {
    kind: "police",
    name: "POLIZEI",
    roof: "#1e3a8a",
    wall: "#1e293b",
    shape: "one",
    rise: 1.1,
    sign: "#93c5fd",
  },
  barber: {
    kind: "barber",
    name: "BARBER",
    roof: "#f1f5f9",
    wall: "#94a3b8",
    shape: "one",
    rise: 0.7,
    sign: "#ef4444",
  },
  restaurant: {
    kind: "restaurant",
    name: "RESTAURANT",
    roof: "#a16207",
    wall: "#78350f",
    shape: "one",
    rise: 0.8,
    sign: "#fde047",
  },
  casino: {
    kind: "casino",
    name: "CASINO",
    roof: "#7e22ce",
    wall: "#581c87",
    shape: "one",
    rise: 1.5,
    sign: "#fde047",
  },
  hall: {
    kind: "hall",
    name: "RATHAUS",
    roof: "#d6d3d1",
    wall: "#a8a29e",
    shape: "one",
    rise: 1.2,
    sign: "#0f172a",
  },
  market: {
    kind: "market",
    name: "SUPERMARKT",
    roof: "#0d9488",
    wall: "#115e59",
    shape: "one",
    rise: 0.65,
    sign: "#f8fafc",
  },
  club: {
    kind: "club",
    name: "NACHTCLUB",
    roof: "#1e1b4b",
    wall: "#312e81",
    shape: "one",
    rise: 0.9,
    sign: "#f472b6",
  },
  prison: {
    kind: "prison",
    name: "GEFÄNGNIS",
    roof: "#57534e",
    wall: "#44403c",
    shape: "one",
    rise: 1,
    sign: "#f97316",
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
