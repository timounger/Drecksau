/**
 * Die Karten: Wiese, Straße, Teich und der Weg, den die Ballons nehmen.
 *
 * @module
 * @remarks
 * **Die Karte ist Text.** Ein Punkt ist Wiese, auf der ein Turm stehen darf,
 * ein Gleichheitszeichen ist Straße, das `S` ist der Anfang der Straße und
 * eine Tilde ist Wasser - dort stehen nur U-Boot und Boot. Mehr Zeichen gibt
 * es nicht - wer eine neue Karte bauen will, schreibt zehn Zeilen in
 * {@link MAPS} und ist fertig.
 *
 * **Je kürzer der Weg, desto schwerer die Karte**: Auf einem kurzen Weg sind
 * die Ballons schneller durch, und es gibt weniger Stellen, an denen ein Turm
 * zwei Abschnitte auf einmal erreicht.
 *
 * **Der Weg wird abgelaufen, nicht aufgeschrieben.** Jedes Straßenfeld hat
 * genau zwei Nachbarn, die auch Straße sind (der Anfang und das Ende haben
 * einen), und damit ist die Reihenfolge eindeutig: Man läuft vom `S` los und
 * geht nie dorthin zurück, wo man herkam. Eine zweite Liste mit denselben
 * Feldern in Reihenfolge wäre eine Liste, die man beim nächsten Umbau vergisst.
 */

/** Ein Feld der Karte. */
export type Cell = "." | "=" | "S" | "~";

/** Wie breit ein Feld ist, in Bildpunkten. */
export const CELL = 64;

/** Welche Karten es gibt. */
export type MapId = "meadow" | "bends" | "snake" | "short";

/** Wie schwer eine Karte im Vorbild hieße. */
export type MapLevel = "beginner" | "intermediate" | "advanced" | "expert";

/** Eine Karte: ihr Name, wie schwer sie ist, und ihre zehn Zeilen. */
export type MapDef = {
  readonly name: string;
  readonly level: MapLevel;
  /** Ein Satz für die Kartenübersicht. */
  readonly note: string;
  readonly rows: readonly string[];
};

/**
 * Alle Karten, zehn mal zehn Felder.
 *
 * @remarks
 * Die erste ist die alte und einzige Karte von früher: Der Weg läuft von links
 * in der Mitte einmal quer durch alles und oben wieder hinaus. Die anderen
 * werden der Reihe nach kürzer - beim "kurzen Prozess" sind es kaum zwölf
 * Felder vom Eingang bis zum Ausgang.
 */
export const MAPS: Readonly<Record<MapId, MapDef>> = {
  meadow: {
    name: "Affenwiese",
    level: "beginner",
    note: "Ein langer Weg in Schleifen, mit einem Teich zwischen zwei Straßen.",
    rows: [
      "......=...",
      "......=...",
      "..===.===.",
      "..=.=...=.",
      "S==.=.===.",
      "....=.=...",
      ".====.===.",
      ".=.~~~~.=.",
      ".========.",
      "..........",
    ],
  },
  bends: {
    name: "Kurvenland",
    level: "intermediate",
    note: "Weite Kurven und zwei kleine Teiche - etwas kürzer als die Wiese.",
    rows: [
      "S=====....",
      ".....=....",
      ".~~..=....",
      ".~~..=====",
      ".........=",
      ".=========",
      ".=........",
      ".=...~~...",
      ".======...",
      "......=...",
    ],
  },
  snake: {
    name: "Schlangenpfad",
    level: "advanced",
    note: "Hinunter, hinauf, hinüber und wieder hinunter. Kurz und eng.",
    rows: [
      ".S........",
      ".=..=====.",
      ".=..=...=.",
      ".=..=.~.=.",
      ".=..=.~.=.",
      ".====...=.",
      "........=.",
      "..~~....=.",
      "..~~....=.",
      "........=.",
    ],
  },
  short: {
    name: "Kurzer Prozess",
    level: "expert",
    note: "Zwölf Felder vom Eingang zum Ausgang. Hier zählt jeder Turm.",
    rows: [
      "..........",
      "..........",
      ".~~.......",
      ".~~.......",
      "S=====....",
      ".....=....",
      ".....=====",
      "..........",
      "..~~......",
      "..........",
    ],
  },
};

/** In welcher Reihenfolge die Karten in der Übersicht stehen. */
export const MAP_ORDER: readonly MapId[] = [
  "meadow",
  "bends",
  "snake",
  "short",
];

/** Wie viele Felder jede Karte breit und hoch ist. */
export const COLS = 10;
export const ROWS = 10;

/** Und wie groß das Feld damit in Bildpunkten ist. */
export const FIELD_W = COLS * CELL;
export const FIELD_H = ROWS * CELL;

/** Ein Punkt auf dem Feld, in Bildpunkten. */
export type Spot = {
  readonly x: number;
  readonly y: number;
};

/**
 * Was auf einem Feld liegt.
 *
 * @param map - welche Karte
 * @param col - die Spalte
 * @param row - die Reihe
 * @returns das Zeichen - außerhalb der Karte zählt alles als Wiese
 */
export function cellAt(map: MapId, col: number, row: number): Cell {
  const line = MAPS[map].rows[row] ?? "";
  const sign = line.charAt(col);
  return sign === "=" || sign === "S" || sign === "~" ? sign : ".";
}

/**
 * Ob auf diesem Feld ein Turm stehen darf.
 *
 * @param map - welche Karte
 * @param col - die Spalte
 * @param row - die Reihe
 * @returns true, wenn es Wiese innerhalb der Karte ist
 */
export function isGrass(map: MapId, col: number, row: number): boolean {
  const inside = col >= 0 && col < COLS && row >= 0 && row < ROWS;
  return inside && cellAt(map, col, row) === ".";
}

/**
 * Ob dieses Feld Wasser ist.
 *
 * @param map - welche Karte
 * @param col - die Spalte
 * @param row - die Reihe
 * @returns true, wenn dort ein U-Boot oder Boot stehen darf
 */
export function isWater(map: MapId, col: number, row: number): boolean {
  return cellAt(map, col, row) === "~";
}

/** Die Mitte eines Feldes, in Bildpunkten. */
export function middleOf(col: number, row: number): Spot {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

/** Die vier Nachbarn eines Feldes. */
const STEPS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Der Weg, den die Ballons nehmen - von `S` bis hinaus aus dem Bild.
 *
 * @param map - welche Karte
 * @returns die Mitten aller Straßenfelder in der Reihenfolge des Weges, und
 *   dahinter ein Punkt außerhalb der Karte
 * @remarks
 * Am Ende steht ein Punkt **neben** der Karte: Ein Ballon, der auf dem letzten
 * Feld verschwindet, verschwindet mitten im Bild. Er soll hinauslaufen.
 */
export function trackOf(map: MapId): readonly Spot[] {
  const way: Spot[] = [];
  let here: { col: number; row: number } | null = findStart(map);
  let came = { col: -1, row: -1 };

  while (here !== null) {
    const step: { col: number; row: number } = here;
    way.push(middleOf(step.col, step.row));
    here = onwards(map, step, came);
    came = step;
  }

  // **Vorn und hinten ein Punkt außerhalb der Karte.** Ein Ballon, der auf
  // dem Startfeld erscheint, erscheint aus dem Nichts mitten im Bild; er soll
  // von draußen hereinlaufen - und am anderen Ende hinaus.
  return [before(way), ...way, beyond(way)];
}

/** Wo das `S` steht. */
function findStart(map: MapId): { col: number; row: number } {
  let found = { col: 0, row: 0 };

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (cellAt(map, col, row) === "S") {
        found = { col, row };
      }
    }
  }

  return found;
}

/** Das nächste Straßenfeld, das nicht das vorige ist. */
function onwards(
  map: MapId,
  here: { col: number; row: number },
  came: { col: number; row: number },
): { col: number; row: number } | null {
  let next: { col: number; row: number } | null = null;

  for (const [dx, dy] of STEPS) {
    const col = here.col + dx;
    const row = here.row + dy;
    const road = col >= 0 && col < COLS && row >= 0 && row < ROWS;
    const cell = cellAt(map, col, row);
    const open = road && (cell === "=" || cell === "S");
    if (open && !(col === came.col && row === came.row) && next === null) {
      next = { col, row };
    }
  }

  return next;
}

/** Ein Punkt eine Feldbreite vor dem ersten, aus derselben Richtung. */
function before(way: readonly Spot[]): Spot {
  const first = way[0] ?? { x: 0, y: 0 };
  const second = way[1] ?? first;
  return {
    x: first.x - (second.x - first.x),
    y: first.y - (second.y - first.y),
  };
}

/** Ein Punkt eine Feldbreite hinter dem letzten, in derselben Richtung. */
function beyond(way: readonly Spot[]): Spot {
  const last = way[way.length - 1] ?? { x: 0, y: 0 };
  const before = way[way.length - 2] ?? last;
  return {
    x: last.x + (last.x - before.x),
    y: last.y + (last.y - before.y),
  };
}

/**
 * Wie lang der Weg insgesamt ist, in Bildpunkten.
 *
 * @param track - der Weg
 * @returns die Summe aller Teilstücke
 */
export function lengthOf(track: readonly Spot[]): number {
  let sum = 0;

  for (let at = 1; at < track.length; at += 1) {
    const from = track[at - 1];
    const to = track[at];
    if (from !== undefined && to !== undefined) {
      sum += Math.hypot(to.x - from.x, to.y - from.y);
    }
  }

  return sum;
}

/**
 * Wo man nach einer Strecke auf dem Weg steht.
 *
 * @param track - der Weg
 * @param gone - wie weit man schon ist, in Bildpunkten
 * @returns der Punkt dort - hinter dem Ende der letzte Punkt
 */
export function spotAt(track: readonly Spot[], gone: number): Spot {
  let left = Math.max(0, gone);
  let found = track[0] ?? { x: 0, y: 0 };
  // **Gefunden heißt fertig.** Ohne diesen Haken liefe die Schleife weiter und
  // rechnete jedes folgende Teilstück noch einmal mit einer negativen Strecke
  // durch - der Punkt landete dann irgendwo hinter dem Ende, und kein Turm
  // hätte je etwas in Reichweite gehabt.
  let done = false;

  for (let at = 1; at < track.length; at += 1) {
    const from = track[at - 1];
    const to = track[at];
    if (!done && from !== undefined && to !== undefined) {
      const span = Math.hypot(to.x - from.x, to.y - from.y);
      if (left <= span) {
        const share = span === 0 ? 0 : left / span;
        found = {
          x: from.x + (to.x - from.x) * share,
          y: from.y + (to.y - from.y) * share,
        };
        done = true;
      } else {
        left -= span;
        found = to;
      }
    }
  }

  return found;
}
