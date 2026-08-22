/**
 * The board: 42 territories, six continents, and who borders whom.
 *
 * @module
 * @remarks
 * **Where this came from.** The rulebook has all the rules and none of the map -
 * its picture of the board is a low-resolution photograph in which the
 * territory names are unreadable at any magnification. What *is* readable is
 * the example maps it draws for the attack and movement rules, and those
 * confirm the German names and a dozen borders: Russland lies in Europe and
 * borders Ural and Afghanistan, Südeuropa borders the Mittlerer Osten, China
 * borders Indien and the Mongolei. The continent values Südamerika 2 and Afrika
 * 3 are legible on the pages too.
 *
 * The rest is the standard Risk world, unchanged since 1959 and the same on
 * this edition's board. It is written out here in full rather than derived,
 * because every one of these borders is a decision somebody made about the game
 * and none of them follows from geography - Grönland borders Island, Brasilien
 * borders Nordafrika, and Alaska borders Kamtschatka right across the date
 * line.
 *
 * **The adjacency is checked, not trusted**: {@link BORDERS} is written once per
 * pair and the graph is built from it, so a border cannot exist in one
 * direction only. See {@link neighboursOf}.
 */

/** The six continents, in the order the board colours them. */
export type ContinentId =
  "nordamerika" | "suedamerika" | "europa" | "afrika" | "asien" | "australien";

/** One continent, with what holding all of it is worth. */
export type Continent = {
  readonly id: ContinentId;
  readonly name: string;
  /** Extra units per turn for holding every territory of it. */
  readonly bonus: number;
  /**
   * The colour the board prints it in.
   *
   * @remarks
   * One colour, not a light and a dark one. The map keeps its own colours in
   * both themes for the same reason the Sky Team panel does: it is printed
   * board, and a printed board does not get darker in the evening.
   */
  readonly colour: string;
  /**
   * Where the continent's name is written, in the drawn map's units.
   *
   * @remarks
   * Placed by hand, six times, and that is the right way round. Two rules were
   * tried first - above the topmost territory, then "above unless something is
   * standing there, else below" - and both of them put Afrika's name in the
   * middle of Asien or on top of Südafrika. Six labels on a map that will never
   * gain a seventh continent is cartography, not a case for an algorithm.
   */
  readonly labelX: number;
  readonly labelY: number;
};

/** One territory. */
export type Territory = {
  readonly id: string;
  readonly name: string;
  readonly continent: ContinentId;
  /** Where it sits on the drawn map, in the SVG's own units. */
  readonly x: number;
  readonly y: number;
  /**
   * Stars on its card: one or two.
   *
   * @remarks
   * This edition's cards carry stars instead of the old infantry, cavalry and
   * artillery symbols, and stars are what the trade-in table is priced in. The
   * printed distribution is **not** in the rulebook and is not legible on its
   * photograph of the cards, so it is assigned here: every second territory in
   * the order below gets two. Recorded as a decision rather than a fact in
   * `docs/games/risiko/game-rules.md`.
   */
  readonly stars: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- map data: every number
   below is a coordinate on the drawn board or a continent's printed value. */

/** The continents and what each is worth. */
export const CONTINENTS: readonly Continent[] = [
  {
    id: "nordamerika",
    labelX: 120,
    labelY: 26,
    name: "Nordamerika",
    bonus: 5,
    colour: "#e0a423",
  },
  {
    id: "suedamerika",
    labelX: 146,
    labelY: 402,
    name: "Südamerika",
    bonus: 2,
    colour: "#cf4436",
  },
  {
    id: "europa",
    labelX: 330,
    labelY: 102,
    name: "Europa",
    bonus: 5,
    colour: "#2f6fb5",
  },
  {
    id: "afrika",
    labelX: 386,
    labelY: 402,
    name: "Afrika",
    bonus: 3,
    colour: "#8a5122",
  },
  {
    id: "asien",
    labelX: 700,
    labelY: 24,
    name: "Asien",
    bonus: 7,
    colour: "#3d9b4a",
  },
  {
    id: "australien",
    labelX: 670,
    labelY: 440,
    name: "Australien",
    bonus: 2,
    colour: "#8250a8",
  },
];

/**
 * Every territory, grouped by continent, in the board's reading order.
 *
 * @remarks
 * The order matters twice: the star assignment alternates along it, and the
 * cards are built from it, so shuffling this list would silently change every
 * deal. New territories are not a thing that happens to this game.
 */
const PLACES: readonly (readonly [
  string,
  string,
  ContinentId,
  number,
  number,
])[] = [
  ["alaska", "Alaska", "nordamerika", 58, 76],
  ["nordwest", "Nordwest-Territorium", "nordamerika", 148, 70],
  ["groenland", "Grönland", "nordamerika", 286, 44],
  ["alberta", "Alberta", "nordamerika", 143, 133],
  ["ontario", "Ontario", "nordamerika", 214, 131],
  ["quebec", "Quebec", "nordamerika", 285, 131],
  ["weststaaten", "Weststaaten", "nordamerika", 148, 196],
  ["oststaaten", "Oststaaten", "nordamerika", 226, 203],
  ["mittelamerika", "Mittelamerika", "nordamerika", 163, 258],

  ["venezuela", "Venezuela", "suedamerika", 211, 320],
  ["brasilien", "Brasilien", "suedamerika", 277, 377],
  ["peru", "Peru", "suedamerika", 208, 387],
  ["argentinien", "Argentinien", "suedamerika", 231, 462],

  ["island", "Island", "europa", 386, 94],
  ["skandinavien", "Skandinavien", "europa", 457, 84],
  ["grossbritannien", "Großbritannien", "europa", 374, 161],
  ["nordeuropa", "Nordeuropa", "europa", 447, 154],
  ["russland", "Russland", "europa", 531, 128],
  ["westeuropa", "Westeuropa", "europa", 383, 222],
  ["suedeuropa", "Südeuropa", "europa", 456, 212],

  ["nordafrika", "Nordafrika", "afrika", 419, 302],
  ["aegypten", "Ägypten", "afrika", 491, 291],
  ["kongo", "Kongo", "afrika", 459, 377],
  ["ostafrika", "Ostafrika", "afrika", 521, 356],
  ["suedafrika", "Südafrika", "afrika", 469, 447],
  ["madagaskar", "Madagaskar", "afrika", 546, 432],

  ["ural", "Ural", "asien", 611, 104],
  ["sibirien", "Sibirien", "asien", 668, 78],
  ["jakutsk", "Jakutsk", "asien", 748, 58],
  ["irkutsk", "Irkutsk", "asien", 722, 126],
  ["kamtschatka", "Kamtschatka", "asien", 833, 84],
  ["mongolei", "Mongolei", "asien", 762, 176],
  ["japan", "Japan", "asien", 858, 177],
  ["afghanistan", "Afghanistan", "asien", 601, 186],
  ["china", "China", "asien", 717, 241],
  ["mittlererosten", "Mittlerer Osten", "asien", 546, 271],
  ["indien", "Indien", "asien", 646, 287],
  ["siam", "Siam", "asien", 727, 311],

  ["indonesien", "Indonesien", "australien", 747, 387],
  ["neuguinea", "Neuguinea", "australien", 837, 376],
  ["westaustralien", "Westaustralien", "australien", 777, 467],
  ["ostaustralien", "Ostaustralien", "australien", 862, 462],
];

/**
 * Every border, written once.
 *
 * @remarks
 * One entry per pair, not two. Written both ways it would be forty-two lists
 * that have to agree with each other, and the first one to stop agreeing would
 * make a territory attackable from a place it could not be attacked back from -
 * a bug that looks like bad luck for a very long time.
 */
const BORDERS: readonly (readonly [string, string])[] = [
  // Nordamerika
  ["alaska", "nordwest"],
  ["alaska", "alberta"],
  ["nordwest", "alberta"],
  ["nordwest", "ontario"],
  ["nordwest", "groenland"],
  ["groenland", "ontario"],
  ["groenland", "quebec"],
  ["alberta", "ontario"],
  ["alberta", "weststaaten"],
  ["ontario", "quebec"],
  ["ontario", "weststaaten"],
  ["ontario", "oststaaten"],
  ["quebec", "oststaaten"],
  ["weststaaten", "oststaaten"],
  ["weststaaten", "mittelamerika"],
  ["oststaaten", "mittelamerika"],
  // Nordamerika to elsewhere
  ["groenland", "island"],
  ["alaska", "kamtschatka"],
  ["mittelamerika", "venezuela"],
  // Südamerika
  ["venezuela", "brasilien"],
  ["venezuela", "peru"],
  ["brasilien", "peru"],
  ["brasilien", "argentinien"],
  ["peru", "argentinien"],
  ["brasilien", "nordafrika"],
  // Europa
  ["island", "grossbritannien"],
  ["island", "skandinavien"],
  ["skandinavien", "grossbritannien"],
  ["skandinavien", "nordeuropa"],
  ["skandinavien", "russland"],
  ["grossbritannien", "nordeuropa"],
  ["grossbritannien", "westeuropa"],
  ["nordeuropa", "westeuropa"],
  ["nordeuropa", "suedeuropa"],
  ["nordeuropa", "russland"],
  ["westeuropa", "suedeuropa"],
  ["suedeuropa", "russland"],
  // Europa to elsewhere
  ["westeuropa", "nordafrika"],
  ["suedeuropa", "nordafrika"],
  ["suedeuropa", "aegypten"],
  ["suedeuropa", "mittlererosten"],
  ["russland", "ural"],
  ["russland", "afghanistan"],
  ["russland", "mittlererosten"],
  // Afrika
  ["nordafrika", "aegypten"],
  ["nordafrika", "ostafrika"],
  ["nordafrika", "kongo"],
  ["aegypten", "ostafrika"],
  ["kongo", "ostafrika"],
  ["kongo", "suedafrika"],
  ["ostafrika", "suedafrika"],
  ["ostafrika", "madagaskar"],
  ["suedafrika", "madagaskar"],
  // Afrika to elsewhere
  ["aegypten", "mittlererosten"],
  ["ostafrika", "mittlererosten"],
  // Asien
  ["ural", "sibirien"],
  ["ural", "china"],
  ["ural", "afghanistan"],
  ["sibirien", "jakutsk"],
  ["sibirien", "irkutsk"],
  ["sibirien", "mongolei"],
  ["sibirien", "china"],
  ["jakutsk", "irkutsk"],
  ["jakutsk", "kamtschatka"],
  ["irkutsk", "kamtschatka"],
  ["irkutsk", "mongolei"],
  ["kamtschatka", "mongolei"],
  ["kamtschatka", "japan"],
  ["mongolei", "japan"],
  ["mongolei", "china"],
  ["afghanistan", "china"],
  ["afghanistan", "indien"],
  ["afghanistan", "mittlererosten"],
  ["china", "indien"],
  ["china", "siam"],
  ["mittlererosten", "indien"],
  ["indien", "siam"],
  // Asien to elsewhere
  ["siam", "indonesien"],
  // Australien
  ["indonesien", "neuguinea"],
  ["indonesien", "westaustralien"],
  ["neuguinea", "westaustralien"],
  ["neuguinea", "ostaustralien"],
  ["westaustralien", "ostaustralien"],
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The border that runs off one edge of the map and back on at the other.
 *
 * @remarks
 * Alaska and Kamtschatka face each other across the date line, so the drawn map
 * cannot join them with a line without dragging it across the whole world. The
 * board prints two stubs at its edges; so does this one, and it needs to know
 * which pair to treat that way.
 */
export const WRAP_BORDER: readonly [string, string] = ["alaska", "kamtschatka"];

/** Every territory, in board order. */
export const TERRITORIES: readonly Territory[] = PLACES.map(
  ([id, name, continent, x, y], index) => ({
    id,
    name,
    continent,
    x,
    y,
    // Alternating, and see the note on Territory.stars: an assignment, not a
    // reading. Written as a rule rather than a list so it cannot drift.
    stars: index % 2 === 0 ? 1 : 2,
  }),
);

/** How many territories there are - the rulebook's 42. */
export const TERRITORY_COUNT = TERRITORIES.length;

/** Territories by id, for the lookups the referee does constantly. */
const BY_ID: Readonly<Record<string, Territory>> = Object.fromEntries(
  TERRITORIES.map((each) => [each.id, each]),
);

/** Continents by id. */
const CONTINENT_BY_ID: Readonly<Record<string, Continent>> = Object.fromEntries(
  CONTINENTS.map((each) => [each.id, each]),
);

/** The neighbour graph, built once from {@link BORDERS} in both directions. */
const NEIGHBOURS: Readonly<Record<string, readonly string[]>> = buildGraph();

/**
 * One territory by id.
 *
 * @param id - the territory's id
 * @returns the territory, or null if nothing has that id
 */
export function territoryOf(id: string): Territory | null {
  return BY_ID[id] ?? null;
}

/**
 * One continent by id.
 *
 * @param id - the continent's id
 * @returns the continent, or null if nothing has that id
 */
export function continentOf(id: string): Continent | null {
  return CONTINENT_BY_ID[id] ?? null;
}

/**
 * Everything one territory borders.
 *
 * @param id - the territory's id
 * @returns the neighbouring ids, or an empty list for an unknown id
 */
export function neighboursOf(id: string): readonly string[] {
  return NEIGHBOURS[id] ?? [];
}

/**
 * Whether two territories border each other.
 *
 * @param from - one territory's id
 * @param to - the other's
 * @returns true if an attack could cross between them
 */
export function borders(from: string, to: string): boolean {
  return neighboursOf(from).includes(to);
}

/**
 * The territories of one continent.
 *
 * @param continent - the continent's id
 * @returns its territory ids, in board order
 */
export function territoriesIn(continent: ContinentId): readonly string[] {
  return TERRITORIES.filter((each) => each.continent === continent).map(
    (each) => each.id,
  );
}

/** Builds the two-way neighbour graph from the one-way border list. */
function buildGraph(): Readonly<Record<string, readonly string[]>> {
  const graph: Record<string, string[]> = Object.fromEntries(
    TERRITORIES.map((each) => [each.id, [] as string[]]),
  );
  for (const [left, right] of BORDERS) {
    graph[left].push(right);
    graph[right].push(left);
  }
  return graph;
}
