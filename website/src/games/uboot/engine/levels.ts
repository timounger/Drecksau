/**
 * The courses, drawn as ASCII maps - and the pieces they are built from.
 *
 * @module
 * @remarks
 * A course is read exactly as it is written: one character is one square of
 * water, the rows go from just under the surface down to the seabed, and the
 * columns run from the harbour on the left to the way out on the right.
 *
 * **Courses are made of pieces rather than typed out end to end.** A dive is
 * over a hundred squares long, and a hundred-character line is a line nobody
 * can count - one rock a column out and the map is wrong in a way that is
 * invisible on the screen it is edited in. A piece is
 * {@link PIECE_COLS} squares wide, which is half a screenful: short enough to
 * see all of at once, long enough to be a proper obstacle. Putting a new
 * course together is then a list of names, and a new obstacle is one more
 * entry in {@link PIECES} that every course can use.
 *
 * The characters, the size and the rules are written up in
 * `docs/games/uboot/levels.md`.
 */

/** How many squares wide every piece is. */
export const PIECE_COLS = 16;

/**
 * One piece of a course: {@link ROWS} rows of {@link PIECE_COLS} characters.
 *
 * @remarks
 * The bottom row is the seabed and is solid in every piece, so no course can
 * be dived under.
 */
export type Piece = readonly string[];

/** A course: a stretch of water on the map, and what is in it. */
export type Level = {
  /** Shown over the picture - German, like everything the player reads. */
  readonly name: string;
  /** One line about the water, for the map. */
  readonly hint: string;
  /** Left to right, in the order they are dived through. */
  readonly pieces: readonly PieceName[];
  /**
   * What mastering it is worth in experience points, the first time.
   *
   * @remarks
   * **Alle zehn zusammen bringen genau den Vollausbau** - nicht weniger und
   * nicht mehr. Wer jedes Gewässer einmal geschafft hat, kann jede Stufe jeder
   * Bahn kaufen; Wiederholungen sind dann nur noch für die Bestzeit da. Wer die
   * Preise in der Werkstatt ändert, muss diese Zahlen mitziehen.
   */
  readonly reward: number;
  /**
   * How dark this water is, from nought to one.
   *
   * @remarks
   * Nought is a sunny afternoon in the harbour and one is a trench where the
   * lamp is the only thing there is. The early waters are all nought on
   * purpose: darkness is a thing the game does to you **after** it has given
   * you the means to answer it, never before.
   */
  readonly dark: number;
  /** Where its marker sits on the map, in percent of the chart. */
  readonly at: { readonly x: number; readonly y: number };
  /** Which of the four sets of waters it belongs to. */
  readonly tier: Tier;
  /**
   * Whether the surface refills the air.
   *
   * @remarks
   * True für die ersten drei: Über einem ist offenes Wasser, und wer
   * auftaucht, holt Luft. Ab der Höhle ist über einem Fels - dort ist der
   * Tank, was man dabeihat, und genau das macht die zweite Stufe zu einer
   * zweiten Stufe.
   */
  readonly surfacing: boolean;
  /**
   * Über welchem Stück des Kurses das Licht ausgeht, in Stücken gezählt.
   *
   * @remarks
   * Nur die letzte Fahrt hat so etwas, und sie ist deshalb die einzige, die
   * drei Gewässer in einem ist: offenes Wasser, dann Höhle, dann Finsternis.
   * **Gezählt wird in Stücken und nicht in Prozent**, denn die Stelle, an der
   * es dunkel werden soll, ist eine Stelle im Kurs - schiebt man ein Stück
   * dazwischen, soll die Dämmerung mitwandern und nicht plötzlich in der
   * falschen Höhle liegen.
   *
   * Alle anderen Gewässer sind von der ersten Sekunde an so dunkel, wie sie
   * sind.
   */
  readonly dusk?: { readonly from: number; readonly to: number };
  /** Whether something is waiting at the end of it. */
  readonly boss?: boolean;
};

/** Die vier Sorten Gewässer. */
export type Tier = "easy" | "cave" | "deep" | "final";

/** The name of every piece there is. */
export type PieceName =
  | "start"
  | "open"
  | "home"
  | "rock"
  | "shack"
  | "spires"
  | "mines"
  | "narrow"
  | "shelf"
  | "tunnel"
  | "stairs"
  | "drop"
  | "kelp"
  | "wall"
  | "swarm"
  | "cave"
  | "caveDome"
  | "caveBucket"
  | "caveMoai"
  | "caveNemo"
  | "caveFlipper"
  | "caveArielle"
  | "caveGhost"
  | "caveWave"
  | "caveArch"
  | "caveNarrow"
  | "caveTeeth"
  | "caveMines"
  | "caveOut"
  | "arena"
  | "finish";

/**
 * Every piece, by name.
 *
 * @remarks
 * Rock grows from the seabed and hangs from a shelf; what floats in open water
 * is mines. That is not decoration but the whole shape of the game: down low
 * the danger is stone you can see, up high it is a ball of spikes you have to
 * look for, and the fast way through is usually neither.
 */
export const PIECES: Readonly<Record<PieceName, Piece>> = {
  // Where a dive begins: nothing to hit while the hand finds the keys.
  start: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "..S.............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..~..~......~...",
    "################",
  ],
  // Dasselbe offene Wasser, nur dass hier jemand wohnt. Nur im Hafenbecken:
  // Eine Landmarke, die überall steht, ist keine.
  home: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...~....H..~....",
    "################",
  ],
  // Und noch so ein Grundstück, eines Gewässers weiter: Unter dem Stein wohnt
  // auch jemand, man sieht es nur an der Antenne.
  rock: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..~......R..~...",
    "################",
  ],
  // Und das dritte Grundstück: die Bude mit dem Schild. Sie steht weiter rechts
  // im Stück, damit das Schild links davon noch Platz hat.
  shack: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..~.......L.~...",
    "################",
  ],
  // A breather. Every course needs them, or the whole thing reads as noise.
  open: [
    "................",
    "................",
    "....Q...........",
    "................",
    "................",
    "................",
    ".........F......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...~.......~....",
    "################",
  ],
  // Two rock towers - over the top or through the middle, both work.
  spires: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "...I............",
    "...BB...........",
    "...BB.......BB..",
    "...##.......BB..",
    "..####......##..",
    "..####.....####.",
    "..####.....####.",
    ".#####....#####.",
    "################",
  ],
  // Open water and nothing to hold on to: the mines are the map here.
  mines: [
    "................",
    "....M.......M...",
    "................",
    "................",
    "..M......M......",
    "................",
    "................",
    ".....M.....M....",
    "................",
    "................",
    "...M.......M....",
    "................",
    "................",
    "################",
  ],
  // A tower with a mine over it: the gap is real, and it is not where the
  // eye goes first.
  narrow: [
    "................",
    "................",
    "................",
    "......M.........",
    "................",
    "................",
    "......BB........",
    "......BB........",
    "......BB....M...",
    ".....####.......",
    ".....####.......",
    ".....####.......",
    "....######..K...",
    "################",
  ],
  // Rock overhead on the way in, rock underfoot on the way out.
  shelf: [
    "#####...........",
    "#####...........",
    "###.............",
    "................",
    "................",
    "........A.......",
    "................",
    "................",
    "................",
    "............###.",
    "...........####.",
    "..........#####.",
    ".........######.",
    "################",
  ],
  // Der Weg unter den Fels. Die Decke kommt herunter und bleibt dann oben -
  // ab hier ist über einem Stein und nicht mehr Luft.
  tunnel: [
    "..##############",
    "..##############",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".....###########",
    "################",
  ],
  // The seabed climbs. Nothing sudden, but it takes the lower half away.
  stairs: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "............K...",
    "............####",
    "............####",
    "........########",
    "........########",
    "....############",
    "....############",
    "################",
    "################",
  ],
  // And falls away again, with mines where the easy line would be.
  drop: [
    "................",
    "....M......M....",
    "................",
    "................",
    "................",
    "......Q.........",
    "................",
    "########........",
    "########........",
    "####............",
    "####............",
    "..#.............",
    "................",
    "################",
  ],
  // A weed forest: harmless, and the one place where what you see is not
  // what can hurt you.
  kelp: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "........M.......",
    "..........F.....",
    "................",
    "................",
    "..~....~....~...",
    "..~....~....~...",
    ".~~~..~~~..~~~..",
    ".~~~.K~~~..~~~..",
    "################",
  ],
  // Eine Wand mit genau einem Loch. Wer zu spät hinschaut, fährt dagegen.
  wall: [
    ".......##.......",
    ".......##.......",
    ".......BB.......",
    ".......BB.......",
    ".......BB.......",
    "................",
    "...........A....",
    "................",
    ".......BB.......",
    ".......BB.......",
    ".......BB.......",
    ".......##.......",
    ".......##.......",
    "################",
  ],
  // Ein Minenfeld, wie es im Buch steht: keine Wand, nur lauter Lücken, und
  // jede davon ist eine Entscheidung.
  swarm: [
    "................",
    "...M...M...M....",
    "................",
    "......M...M.....",
    "................",
    "..M...M...M.....",
    "................",
    "....M...M...M...",
    "................",
    "..M...M...M.....",
    "................",
    ".....M...M......",
    "................",
    "################",
  ],
  // Eine Höhle: Fels oben und unten, dazwischen ein Gang, der wandert. Hier
  // gibt es keine Ausweichbewegung mehr, nur noch eine Linie.
  cave: [
    "################",
    "################",
    "################",
    "################",
    "....############",
    "........########",
    "............####",
    "####............",
    "########........",
    "############....",
    "################",
    "################",
    "################",
    "################",
  ],
  // **Der Satz Höhlenbausteine.** Alle haben den Gang an beiden Rändern auf
  // denselben zehn Zeilen (2 bis 11) - damit passt jeder an jeden, und eine
  // Höhle ist eine Liste statt einer Rechenaufgabe.
  //
  // **Weit, nicht eng.** Was eine Höhle zur Höhle macht, ist nicht der schmale
  // Gang, sondern die Decke: In den obersten beiden Zeilen liegt immer Fels,
  // also kommt man nirgends an die Oberfläche und holt zwischendurch Luft. Der
  // Platz dazwischen ist Platz zum Fahren - eng wird es nur dort, wo es etwas
  // bedeuten soll.
  caveWave: [
    "################",
    "################",
    "................",
    "......BBBB......",
    "......BBBB......",
    "................",
    "........Q.......",
    "................",
    "................",
    "................",
    "....BBBBBBBB....",
    "..I.............",
    "################",
    "################",
  ],
  // Dasselbe weite Stück, nur dass hier unter einer Glocke ein Baum steht.
  caveDome: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......D........",
    "################",
    "################",
  ],
  // Der Eimer steht im Schlund, der Steinkopf im Labyrinth - jeder in seinem
  // eigenen Stück, damit er nur dort steht.
  caveBucket: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......E........",
    "################",
    "################",
  ],
  caveMoai: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "........O.......",
    "################",
    "################",
  ],
  // Die vier Bewohner der dunklen Gewässer: jeder in seinem eigenen Stück,
  // damit er nur in seinem Gewässer steht. Die drei Schwimmenden stehen im
  // Wasser, die Meerjungfrau sitzt auf dem Grund.
  caveNemo: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......N........",
    "................",
    "................",
    "................",
    "................",
    "################",
    "################",
  ],
  caveFlipper: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    ".......P........",
    "................",
    "................",
    "................",
    "................",
    "................",
    "################",
    "################",
  ],
  caveArielle: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......V........",
    "################",
    "################",
  ],
  caveGhost: [
    "################",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......G........",
    "................",
    "................",
    "................",
    "................",
    "################",
    "################",
  ],
  caveArch: [
    "################",
    "################",
    "................",
    "................",
    "......A.........",
    "......BBBB......",
    "......BBBB......",
    "......BBBB......",
    "......BBBB......",
    "................",
    "................",
    ".........K......",
    "################",
    "################",
  ],
  // Das eine Stück, bei dem es wirklich eng wird - und selbst hier gibt es
  // drei Wege: oben vorbei, mittendurch, unten herum.
  caveNarrow: [
    "################",
    "################",
    "..........I.....",
    "......BBBBBB....",
    "......BBBBBB....",
    "......BBBBBB....",
    "................",
    "................",
    "....########....",
    "....########....",
    "................",
    "................",
    "################",
    "################",
  ],
  caveTeeth: [
    "################",
    "################",
    "................",
    "..BB........BB..",
    "..BB........BB..",
    "................",
    "......T.........",
    "................",
    "................",
    ".......BB.......",
    ".......BB.......",
    "...K............",
    "################",
    "################",
  ],
  // Derselbe weite Gang, nur dass etwas darin treibt.
  caveMines: [
    "################",
    "################",
    "................",
    "......M.........",
    "................",
    "..........Q.....",
    "................",
    "................",
    "...M............",
    "................",
    "............M...",
    "................",
    "################",
    "################",
  ],
  // Und wieder hinaus: Der Boden fällt weg, die Decke bleibt, wo sie ist.
  caveOut: [
    "################",
    "################",
    "................",
    "................",
    "................",
    ".........F......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "###########.....",
    "################",
  ],
  // Die Arena: offen, hoch, und nichts darin außer dem, was einen erwartet.
  arena: [
    "################",
    "################",
    "####............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....############",
    "################",
  ],
  // The way out.
  finish: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "..........Z.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...~........~...",
    "################",
  ],
};

/**
 * The courses, in the order they are dived.
 *
 * @remarks
 * **Vier Sorten Wasser, und jede nimmt etwas weg.** Die ersten drei sind
 * offen: Über einem ist die Oberfläche, und wer auftaucht, holt Luft - dort
 * lernt man das Boot. Die nächsten drei sind Höhle: Fels über einem und Fels
 * unter einem, der Tank ist das, was man dabeihat. Die drei danach sind
 * dieselbe Höhle im Dunkeln, und dort entscheidet sich, ob die Punkte in
 * Scheinwerfer und Sonar gut angelegt waren. Die zehnte ist alle drei
 * nacheinander, mit dem Wächter am Ende.
 *
 * Jede Stufe nimmt genau eine Sicherheit weg, und jede hat ihre Antwort schon
 * im Laden liegen, bevor sie gebraucht wird.
 */
export const LEVELS: readonly Level[] = [
  {
    name: "Hafenbecken",
    hint: "Flach, hell und harmlos. Auftauchen füllt die Luft.",
    pieces: ["start", "open", "kelp", "spires", "home", "finish"],
    reward: 30,
    dark: 0,
    at: { x: 7, y: 18 },
    tier: "easy",
    surfacing: true,
  },
  {
    name: "Seichtes Wasser",
    hint: "Die ersten Minen. Alles davon sieht man kommen.",
    pieces: ["start", "open", "spires", "rock", "mines", "open", "finish"],
    reward: 45,
    dark: 0,
    at: { x: 17, y: 42 },
    tier: "easy",
    surfacing: true,
  },
  {
    name: "Das Riff",
    hint: "Fels von unten, Minen von oben - der schnelle Weg ist keiner.",
    pieces: [
      "start",
      "spires",
      "mines",
      "narrow",
      "shack",
      "shelf",
      "stairs",
      "mines",
      "finish",
    ],
    reward: 60,
    dark: 0,
    at: { x: 27, y: 20 },
    tier: "easy",
    surfacing: true,
  },
  {
    name: "Die Höhle",
    hint: "Fels über dir. Ab hier ist der Tank alles, was du hast.",
    pieces: [
      "start",
      "open",
      "tunnel",
      "caveWave",
      "caveDome",
      "caveTeeth",
      "caveOut",
      "finish",
    ],
    reward: 75,
    dark: 0,
    at: { x: 37, y: 48 },
    tier: "cave",
    surfacing: false,
  },
  {
    name: "Der Schlund",
    hint: "Hoch, runter, eng. Der Gang lässt dir kaum eine Wahl.",
    pieces: [
      "start",
      "tunnel",
      "caveArch",
      "caveBucket",
      "caveNarrow",
      "caveWave",
      "caveOut",
      "finish",
    ],
    reward: 85,
    dark: 0,
    at: { x: 47, y: 24 },
    tier: "cave",
    surfacing: false,
  },
  {
    name: "Das Labyrinth",
    hint: "Die längste Höhle - mit Zähnen an Decke und Boden.",
    pieces: [
      "start",
      "tunnel",
      "caveTeeth",
      "caveArch",
      "caveMoai",
      "caveWave",
      "caveNarrow",
      "caveOut",
      "finish",
    ],
    reward: 100,
    dark: 0,
    at: { x: 57, y: 54 },
    tier: "cave",
    surfacing: false,
  },
  {
    name: "Die Finsternis",
    hint: "Dieselbe Höhle, nur ohne Licht. Ein Scheinwerfer hilft sehr.",
    pieces: [
      "start",
      "tunnel",
      "caveWave",
      "caveNemo",
      "caveTeeth",
      "caveArch",
      "caveOut",
      "finish",
    ],
    reward: 110,
    dark: 1,
    at: { x: 67, y: 28 },
    tier: "deep",
    surfacing: false,
  },
  {
    name: "Der Abgrund",
    hint: "Minen im Schwarzen. Ohne Sonar tastet man sich durch.",
    pieces: [
      "start",
      "tunnel",
      "caveMines",
      "caveFlipper",
      "caveNarrow",
      "caveWave",
      "caveTeeth",
      "caveOut",
      "finish",
    ],
    reward: 125,
    dark: 1,
    at: { x: 76, y: 60 },
    tier: "deep",
    surfacing: false,
  },
  {
    name: "Die Tiefe",
    hint: "Die längste finstere Höhle. Hier zahlt sich jede Stufe aus.",
    pieces: [
      "start",
      "tunnel",
      "caveArch",
      "caveMines",
      "caveArielle",
      "caveWave",
      "caveNarrow",
      "caveTeeth",
      "caveOut",
      "finish",
    ],
    reward: 150,
    dark: 1,
    at: { x: 86, y: 32 },
    tier: "deep",
    surfacing: false,
  },
  {
    name: "Der Wächter",
    hint: "Offenes Wasser, dann die Höhle, dann die Finsternis - und am Ende wartet etwas. Ohne Waffe chancenlos.",
    // Drei Gewässer in einem, in genau der Reihenfolge, in der man sie gelernt
    // hat: vier Stücke offenes Wasser mit Luft über einem, drei Stücke Höhle,
    // in der man noch sieht, vier Stücke Finsternis - und dann er.
    pieces: [
      "start",
      "open",
      "kelp",
      "spires",
      "tunnel",
      "caveWave",
      "caveArch",
      "caveNarrow",
      "caveTeeth",
      "caveMines",
      "caveOut",
      "caveGhost",
      "arena",
      "finish",
    ],
    reward: 200,
    dark: 1,
    at: { x: 94, y: 68 },
    tier: "final",
    surfacing: true,
    // Das Licht geht über dem achten Stück aus, also genau dort, wo die Höhle
    // enger wird: Bis dahin ist es eine Höhle, ab da ist es die Tiefe.
    dusk: { from: 7, to: 8 },
    boss: true,
  },
];

/**
 * Wie dunkel es an einer Stelle des Kurses ist.
 *
 * @param level - das Gewässer
 * @param share - wie weit man durch ist, von null bis eins
 * @returns die Dunkelheit dort, von null bis eins
 * @remarks
 * Für neun der zehn Gewässer ist das eine Zahl, die überall gilt. Nur die
 * letzte Fahrt geht durch alle drei Sorten Wasser, und bei ihr sagt
 * {@link Level.dusk}, über welchem Stück das Licht ausgeht - nicht auf einen
 * Schlag, sondern über ein Stück hinweg, so wie man es beim echten Abtauchen
 * verliert.
 */
export function darkness(level: Level, share: number): number {
  const dusk = level.dusk;
  let dark = level.dark;

  if (dusk !== undefined) {
    const at = share * level.pieces.length;
    const grown = Math.max(
      0,
      Math.min(1, (at - dusk.from) / (dusk.to - dusk.from)),
    );
    dark = level.dark * grown;
  }

  return dark;
}

/** How many courses there are. */
export const LEVEL_COUNT = LEVELS.length;
