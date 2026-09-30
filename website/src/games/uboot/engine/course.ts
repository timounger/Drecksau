/**
 * Turning a written course into the grid the engine dives through.
 *
 * @module
 * @remarks
 * Done once, when a dive begins, rather than per frame: the map is text, and
 * text is for people. What the engine wants is a flat array it can index by
 * column and row, plus the two points a course is defined by - where the boat
 * starts and where the way out is.
 */
import { BEAST_LETTERS, spawn } from "./beasts";
import { DEFAULT_GRADE, gradeAt } from "./grades";
import { PIECES, PIECE_COLS, type Level } from "./levels";
import { CELL, ROWS, type Beast, type Cell, type Vec } from "./types";

/** A course, laid out and ready to dive. */
export type Course = {
  /** What it is called, for the top of the screen. */
  readonly name: string;
  /** How many squares wide it is. */
  readonly cols: number;
  /** Every square, row by row from the surface down. */
  readonly cells: readonly Cell[];
  /** Where the middle of the boat sits when the dive begins, in pixels. */
  readonly start: Vec;
  /** How far right the way out is, in pixels. */
  readonly goal: number;
  /** And how long the whole course is. */
  readonly length: number;
  /**
   * Ob die Oberfläche hier Luft gibt.
   *
   * @remarks
   * Steht am Kurs und nicht in der Engine, weil es eine Eigenschaft des
   * Gewässers ist: Über den ersten dreien ist offenes Wasser, über einer Höhle
   * ist Fels. Die Engine fragt nur nach.
   */
  readonly surfacing: boolean;
  /**
   * Was in diesem Gewässer lebt, dort wo es zu Hause ist.
   *
   * @remarks
   * Im Kurs und nicht im Weltzustand, weil es zum Gewässer gehört wie der
   * Fels: Ein Tauchgang nimmt sich diese Liste als Startaufstellung und macht
   * damit, was er will - der Kurs selbst bleibt unangetastet.
   */
  readonly beasts: readonly Beast[];
  /**
   * Wie schnell das Wasser hier nachläuft, als Vielfaches.
   *
   * @remarks
   * Am Kurs und nicht in der Engine, weil er für genau einen Tauchgang gebaut
   * wird und die gewählte Schwierigkeit dazugehört wie die Bewohner. Die
   * Engine fragt nur nach, so wie sie bei {@link surfacing} nachfragt.
   */
  readonly pace: number;
  /** Ob am Ende etwas wartet. */
  readonly boss: boolean;
};

/**
 * Lays a written course out as a grid.
 *
 * @param level - the course, as a list of pieces
 * @param grade - welche Schwierigkeit, von null an
 * @returns the grid, the starting point and the way out
 * @remarks
 * A character the map format does not know becomes open water. A course that
 * forgot its `S` or its `Z` still works - it starts near the top left and ends
 * at the last column - because half a map is worth more than a crash.
 *
 * **Der Fels bleibt, wie er geschrieben ist.** Die Schwierigkeit ändert nur,
 * wie schnell das Wasser nachläuft und wie viel darin lebt - sonst wäre eine
 * Bestleistung keine Aussage über den Spieler, sondern über zwei verschiedene
 * Karten.
 */
export function buildCourse(level: Level, grade = DEFAULT_GRADE): Course {
  const cols = level.pieces.length * PIECE_COLS;
  const cells: Cell[] = new Array<Cell>(cols * ROWS).fill(".");
  const beasts: Beast[] = [];
  let start: Vec = { x: CELL, y: CELL * 2 };
  let goal = cols * CELL;

  level.pieces.forEach((name, piece) => {
    const rows = PIECES[name];
    const left = piece * PIECE_COLS;
    for (let row = 0; row < ROWS; row += 1) {
      const line = rows[row] ?? "";
      for (let col = 0; col < PIECE_COLS; col += 1) {
        const char = line.charAt(col);
        const cell = asCell(char);
        const at = middleOf(left + col, row);
        if (cell === "S") {
          start = at;
        }
        if (cell === "Z") {
          goal = at.x;
        }
        // **Ein Tier ist kein Feld.** Sein Buchstabe sagt nur, wo es zu Hause
        // ist; das Quadrat selbst bleibt Wasser, denn es schwimmt ja davon.
        const kind = BEAST_LETTERS[char];
        if (kind !== undefined) {
          beasts.push(spawn(beasts.length, kind, at));
        }
        cells[row * cols + left + col] = cell;
      }
    }
  });

  const hard = gradeAt(grade);
  return {
    name: level.name,
    cols,
    cells,
    start,
    goal,
    length: cols * CELL,
    surfacing: level.surfacing,
    beasts: peopled(beasts, hard.swarm, (col, row) =>
      insideWater(cells, cols, col, row),
    ),
    pace: hard.pace,
    boss: level.boss === true,
  };
}

/**
 * Die Bewohner, so viele wie die Schwierigkeit verlangt.
 *
 * @param base - was auf der Karte steht
 * @param swarm - das Vielfache davon
 * @param water - ob ein Quadrat offenes Wasser ist
 * @returns die Besatzung dieses Tauchgangs
 * @remarks
 * Weniger wird gleichmäßig ausgedünnt und nicht zufällig: Auf "Leicht" soll
 * überall etwas weniger los sein und nicht die halbe Strecke leer.
 *
 * Mehr wird **neben die vorhandenen gesetzt**, nicht irgendwohin. Wer auf der
 * Karte einen Platz für eine Krabbe gesucht hat, hat auch den Platz daneben
 * gemeint; ein Tier, das frei im Fels hängt, hätte niemand so aufgeschrieben.
 */
function peopled(
  base: readonly Beast[],
  swarm: number,
  water: (col: number, row: number) => boolean,
): readonly Beast[] {
  const thin = Math.min(1, swarm);
  const kept: Beast[] = [];

  base.forEach((one, at) => {
    if (Math.floor((at + 1) * thin) > Math.floor(at * thin)) {
      kept.push(one);
    }
  });

  const extra = Math.round(base.length * Math.max(0, swarm - 1));
  for (let more = 0; more < extra; more += 1) {
    const parent = base[more % base.length];
    const spot = beside(parent, more, water);
    if (spot !== null) {
      kept.push(spawn(base.length + more, parent.kind, spot));
    }
  }

  return kept;
}

/** Wie weit ein zusätzliches Tier danebenrückt, in Quadraten. */
const STEP = { near: 2, far: 3 } as const;

/** Wohin es ausweichen darf, der Reihe nach. */
const ASIDE: readonly (readonly [number, number])[] = [
  [STEP.near, 0],
  [-STEP.near, 0],
  [0, STEP.near],
  [0, -STEP.near],
  [STEP.far, 1],
  [-STEP.far, -1],
  [1, -STEP.far],
  [-1, STEP.far],
];

/** Ein freier Platz neben einem Tier, oder null, wenn ringsum Fels steht. */
function beside(
  parent: Beast,
  seed: number,
  water: (col: number, row: number) => boolean,
): Vec | null {
  const col = Math.floor(parent.homeX / CELL);
  const row = Math.floor(parent.homeY / CELL);
  let found: Vec | null = null;

  for (let try_ = 0; try_ < ASIDE.length && found === null; try_ += 1) {
    const [dx, dy] = ASIDE[(seed + try_) % ASIDE.length];
    if (water(col + dx, row + dy)) {
      found = middleOf(col + dx, row + dy);
    }
  }

  return found;
}

/** Ob dieses Quadrat offenes Wasser ist - Tang zählt mit, Fels nicht. */
function insideWater(
  cells: readonly Cell[],
  cols: number,
  col: number,
  row: number,
): boolean {
  const inside = col >= 0 && col < cols && row >= 0 && row < ROWS;
  const cell = inside ? cells[row * cols + col] : "#";
  return cell === "." || cell === "~";
}

/**
 * What is in one square.
 *
 * @param course - the course being dived
 * @param col - the column, counted from the start
 * @param row - the row, counted from the surface
 * @returns the square, or open water outside the course
 * @remarks
 * Off the map is water, not rock: a boat that has been shoved past the last
 * column has arrived, and arriving must never be the same as hitting
 * something.
 */
export function cellAt(course: Course, col: number, row: number): Cell {
  const inside = col >= 0 && col < course.cols && row >= 0 && row < ROWS;
  return inside ? (course.cells[row * course.cols + col] ?? ".") : ".";
}

/** The middle of a square, in course pixels. */
function middleOf(col: number, row: number): Vec {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

/** The character as a cell, or open water if it means nothing here. */
function asCell(char: string): Cell {
  const known: readonly string[] = ["#", "B", "M", "~", "S", "Z"];
  return known.includes(char) ? (char as Cell) : ".";
}
