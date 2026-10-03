/**
 * Die Karte einer Stufe - und wer darauf wartet.
 *
 * @module
 * @remarks
 * **Aus zwei Zahlen gebaut und sonst nichts:** Stufe und Saat. Dieselben zwei
 * Zahlen ergeben überall dieselbe Karte, und genau deshalb muss im Koop keine
 * Karte über die Leitung - der Gast baut sie sich aus der Stufe und der Saat
 * selbst, so wie es die Panzerkiste mit ihrem Gitter auch macht.
 *
 * Gewachsen wird nach unten: Je tiefer ein Feld liegt, desto wahrscheinlicher
 * ist dort Fels, und je höher die Stufe, desto mehr und desto zähere Bewohner
 * stehen darin.
 */
import { BREEDS, spawn } from "@/games/uboot/engine/beasts";
import {
  CELL,
  type Beast,
  type BeastKind,
  type Vec,
} from "@/games/uboot/engine/types";
import {
  DEEP_COLS,
  DEEP_ROWS,
  SKY_ROWS,
  WATER_LINE,
} from "@/games/uboot/endless/types";

/** Eine fertig ausgelegte Stufe. */
export type DeepWorld = {
  readonly stage: number;
  readonly seed: number;
  readonly cols: number;
  readonly rows: number;
  /** Jedes Feld: ob dort Fels steht. */
  readonly rock: readonly boolean[];
  /** Wo die Boote auftauchen - oben links, über Wasser. */
  readonly start: Vec;
};

/** Wie der Fels verteilt wird. */
const STONE = {
  /** Wie viele Reihen unten ganz zugemauert sind. */
  floor: 2,
  /** Wie viele Brocken die erste Stufe hat und wie viele je Stufe dazukommen. */
  blobs: 54,
  perStage: 3,
  mostBlobs: 120,
  /** Wie groß ein Brocken wird, in Feldern. */
  small: 1,
  grow: 3,
  /** Ab welchem Anteil der Tiefe es enger wird, und wie stark. */
  thickFrom: 0.45,
  thickness: 1.6,
  /** Wie viele Felder um den Start herum frei bleiben. */
  clear: 7,
  /** Wie weit rechts vom Rand das Boot auftaucht, in Feldern. */
  startCol: 3,
} as const;

/** Wie viele Bewohner eine Stufe hat und wie zäh sie sind. */
const CROWD = {
  /** So viele in der ersten Stufe, so viele je weiterer, höchstens so viele. */
  base: 8,
  perStage: 3,
  most: 36,
  /** Ab jeder wievielten Stufe alles einen Treffer mehr aushält. */
  tougher: 3,
  /** Wie weit ein Bewohner mindestens vom Start weg steht, in Feldern. */
  away: 9,
  /** Wie oft höchstens nach einem freien Platz gesucht wird. */
  tries: 40,
  /** Wie viele Reihen unten für die Suche gesperrt sind. */
  below: 3,
} as const;

/**
 * Ab welcher Stufe welche Art mitspielt.
 *
 * @remarks
 * Die Reihenfolge ist die der Kampagne: Was man dort unten erst spät trifft,
 * kommt hier erst spät dazu. So wird eine Stufe nicht nur voller, sondern
 * auch anders.
 */
const LADDER: readonly { readonly from: number; readonly kind: BeastKind }[] = [
  { from: 1, kind: "shoal" },
  { from: 1, kind: "jelly" },
  { from: 2, kind: "crab" },
  { from: 3, kind: "urchin" },
  { from: 4, kind: "eel" },
  { from: 5, kind: "angler" },
];

/** Die Zahlen des Zufallsgenerators - ein klassischer linearer Kongruenzschritt. */
const DICE = {
  mul: 1664525,
  add: 1013904223,
  mod: 4294967296,
} as const;

/**
 * Ein Würfel, der immer dieselbe Folge wirft.
 *
 * @param seed - womit er anfängt
 * @returns eine Funktion, die bei jedem Aufruf die nächste Zahl von 0 bis 1 gibt
 * @remarks
 * Klein und selbstgebaut, weil genau das hier gebraucht wird: dieselbe Karte
 * auf zwei Rechnern. `Math.random` kann das nicht.
 */
export function createDice(seed: number): () => number {
  let value = Math.abs(Math.floor(seed)) % DICE.mod;
  return () => {
    value = (value * DICE.mul + DICE.add) % DICE.mod;
    return value / DICE.mod;
  };
}

/**
 * Baut die Karte einer Stufe.
 *
 * @param stage - die wievielte Stufe, von eins an
 * @param seed - die Saat des Laufs
 * @returns die Karte, fertig zum Tauchen
 */
export function buildDeep(stage: number, seed: number): DeepWorld {
  const rock: boolean[] = new Array<boolean>(DEEP_COLS * DEEP_ROWS).fill(false);
  const dice = createDice(seed + stage * DICE.add);
  const start: Vec = { x: CELL * STONE.startCol, y: CELL };

  // Der Grund und die beiden Wände: eine Karte ohne Rand wäre ein Loch.
  for (let col = 0; col < DEEP_COLS; col += 1) {
    for (let row = DEEP_ROWS - STONE.floor; row < DEEP_ROWS; row += 1) {
      rock[row * DEEP_COLS + col] = true;
    }
  }
  for (let row = SKY_ROWS; row < DEEP_ROWS; row += 1) {
    rock[row * DEEP_COLS] = true;
    rock[row * DEEP_COLS + DEEP_COLS - 1] = true;
  }

  // Und dazwischen die Brocken, nach unten hin immer mehr.
  const blobs = Math.min(
    STONE.mostBlobs,
    STONE.blobs + (stage - 1) * STONE.perStage,
  );
  for (let blob = 0; blob < blobs; blob += 1) {
    const col = Math.floor(dice() * DEEP_COLS);
    const deep = dice();
    const row =
      SKY_ROWS + Math.floor(deep * deep * (DEEP_ROWS - SKY_ROWS - STONE.floor));
    const share = (row - SKY_ROWS) / (DEEP_ROWS - SKY_ROWS);
    const fat =
      share < STONE.thickFrom
        ? 1
        : 1 + (share - STONE.thickFrom) * STONE.thickness;
    const wide = Math.max(STONE.small, Math.round(dice() * STONE.grow * fat));
    const high = Math.max(STONE.small, Math.round(dice() * STONE.grow));
    blot(rock, col, row, wide, high);
  }

  // Der Startplatz bleibt frei, sonst steckt man schon im ersten Bild fest.
  const home = { col: Math.round(start.x / CELL), row: SKY_ROWS };
  for (let col = 0; col < home.col + STONE.clear; col += 1) {
    for (let row = 0; row < home.row + STONE.clear; row += 1) {
      if (col > 0 && col < DEEP_COLS - 1 && row < DEEP_ROWS - STONE.floor) {
        rock[row * DEEP_COLS + col] = false;
      }
    }
  }

  return { stage, seed, cols: DEEP_COLS, rows: DEEP_ROWS, rock, start };
}

/** Malt einen Brocken ins Gitter. */
function blot(
  rock: boolean[],
  col: number,
  row: number,
  wide: number,
  high: number,
): void {
  for (let x = col - wide; x <= col + wide; x += 1) {
    for (let y = row - high; y <= row + high; y += 1) {
      const inside =
        x >= 0 && x < DEEP_COLS && y >= SKY_ROWS && y < DEEP_ROWS - 1;
      const round =
        (x - col) * (x - col) * high * high +
          (y - row) * (y - row) * wide * wide <=
        wide * wide * high * high;
      if (inside && round) {
        rock[y * DEEP_COLS + x] = true;
      }
    }
  }
}

/**
 * Wer auf dieser Stufe wartet.
 *
 * @param world - die Karte
 * @param stage - die wievielte Stufe
 * @returns die Bewohner, fertig gesetzt
 * @remarks
 * Mehr und zäher mit jeder Stufe, und tiefer: Wer nach dreißig Stufen noch
 * lebt, hat es mit Anglerfischen zu tun, die mehr aushalten als der Wächter.
 */
export function populate(world: DeepWorld, stage: number): readonly Beast[] {
  const dice = createDice(world.seed + stage);
  const many = Math.min(CROWD.most, CROWD.base + (stage - 1) * CROWD.perStage);
  const kinds = LADDER.filter((rung) => rung.from <= stage).map(
    (rung) => rung.kind,
  );
  const extra = Math.floor((stage - 1) / CROWD.tougher);
  const crowd: Beast[] = [];

  for (let one = 0; one < many; one += 1) {
    const kind = kinds[Math.floor(dice() * kinds.length)] ?? "shoal";
    const spot = freeSpot(world, dice, kind);
    if (spot !== null) {
      const beast = spawn(crowd.length, kind, spot);
      crowd.push({ ...beast, hull: beast.hull + extra });
    }
  }

  return crowd;
}

/** Ein freier Platz, weit genug vom Start weg. */
function freeSpot(
  world: DeepWorld,
  dice: () => number,
  kind: BeastKind,
): Vec | null {
  const breed = BREEDS[kind];
  // Was auf dem Grund läuft, wird auch dort gesetzt; alles andere schwimmt.
  const floored = breed.gait === "floor" || breed.gait === "still";
  let found: Vec | null = null;

  for (let tries = 0; tries < CROWD.tries && found === null; tries += 1) {
    const col = 1 + Math.floor(dice() * (world.cols - 2));
    const row =
      SKY_ROWS + 1 + Math.floor(dice() * (world.rows - SKY_ROWS - CROWD.below));
    const at = { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
    const near =
      Math.abs(col - world.start.x / CELL) < CROWD.away &&
      Math.abs(row - world.start.y / CELL) < CROWD.away;
    const sits = floored ? isRock(world, col, row + 1) : true;
    if (!near && sits && !isRock(world, col, row) && at.y > WATER_LINE) {
      found = at;
    }
  }

  return found;
}

/**
 * Ob in einem Feld Fels steht.
 *
 * @param world - die Karte
 * @param col - die Spalte
 * @param row - die Reihe
 * @returns true, wenn dort Fels ist - außerhalb der Karte gilt alles als Fels
 */
export function isRock(world: DeepWorld, col: number, row: number): boolean {
  const inside = col >= 0 && col < world.cols && row >= 0 && row < world.rows;
  return inside ? (world.rock[row * world.cols + col] ?? false) : true;
}

/**
 * Ob an einer Stelle Fels steht, mit allem, was schon weggesprengt wurde.
 *
 * @param world - die Karte
 * @param gone - die Felder, die ein Torpedo geöffnet hat
 * @param x - die Stelle in Weltpixeln
 * @param y - und ihre Tiefe
 * @returns true, wenn dort noch Fels steht
 */
export function solidAt(
  world: DeepWorld,
  gone: ReadonlySet<number>,
  x: number,
  y: number,
): boolean {
  const col = Math.floor(x / CELL);
  const row = Math.floor(y / CELL);
  // Über Wasser ist nie Fels, links und rechts der Karte immer.
  const open = gone.has(row * world.cols + col);
  return !open && isRock(world, col, row);
}
