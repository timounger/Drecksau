/**
 * Die vier Schwierigkeiten - und woran man sie merkt.
 *
 * @module
 * @remarks
 * **Zwei Stellschrauben, mehr nicht:** wie schnell das Wasser nachläuft und
 * wie viel da unten lebt. Beides ist etwas, das man im Bild sieht, und keine
 * Zahl, die im Verborgenen am Schaden dreht. Wer auf "Unmöglich" stirbt, soll
 * wissen, woran - und nicht ahnen, dass irgendwo ein Multiplikator steht.
 *
 * Die Kurse selbst bleiben, wie sie geschrieben sind. Ein Gewässer auf
 * "Leicht" ist dasselbe Gewässer wie auf "Unmöglich", nur mit mehr Luft und
 * weniger Gesellschaft - sonst wäre die Bestleistung keine Aussage über den
 * Spieler, sondern über zwei verschiedene Spiele.
 */

/** Wie die Stufen heißen, intern. */
export type GradeId = "easy" | "middle" | "hard" | "brutal";

/** Eine Stufe. */
export type Grade = {
  readonly id: GradeId;
  /** Wie sie im Spiel heißt. */
  readonly name: string;
  /** Und was sie bedeutet, in einem Satz. */
  readonly note: string;
  /** Wie schnell das Fenster läuft, als Vielfaches. */
  readonly pace: number;
  /** Und wie viel im Wasser lebt, ebenso. */
  readonly swarm: number;
  /** Eine Farbe für die Anzeige - von ruhig nach laut. */
  readonly tone: string;
};

/**
 * Alle vier, von harmlos nach aussichtslos.
 *
 * @remarks
 * "Mittel" ist genau das Spiel, wie es vorher war: Faktor eins auf beiden
 * Schrauben. Damit ist jeder gespeicherte Erfolg von früher weiterhin genau
 * das, was er war.
 */
export const GRADES: readonly Grade[] = [
  {
    id: "easy",
    name: "Leicht",
    note: "Das Wasser lässt dir Zeit, und unten ist weniger los.",
    pace: 0.75,
    swarm: 0.6,
    tone: "emerald",
  },
  {
    id: "middle",
    name: "Mittel",
    note: "So ist das Gewässer gemeint.",
    pace: 1,
    swarm: 1,
    tone: "sky",
  },
  {
    id: "hard",
    name: "Schwer",
    note: "Das Wasser drängt, und es kommt mehr auf dich zu.",
    pace: 1.35,
    swarm: 1.6,
    tone: "amber",
  },
  {
    id: "brutal",
    name: "Unmöglich",
    note: "Beides so weit hochgedreht, wie es noch fahrbar ist. Fast.",
    pace: 1.75,
    swarm: 2.3,
    tone: "rose",
  },
];

/** Die Stufe, auf der das Spiel steht, wenn niemand etwas verstellt. */
export const DEFAULT_GRADE = 1;

/** Die höchste es gibt - für die Auszeichnung am Ende. */
export const TOP_GRADE = GRADES.length - 1;

/**
 * Eine Stufe, sicher.
 *
 * @param index - welche, von null an
 * @returns die Stufe - außerhalb der Liste die mittlere
 */
export function gradeAt(index: number): Grade {
  return GRADES[heldGrade(index)];
}

/**
 * Eine Nummer, die es auch wirklich gibt.
 *
 * @param index - was gespeichert war oder angeklickt wurde
 * @returns eine Nummer innerhalb der Liste
 */
export function heldGrade(index: number): number {
  const whole = Math.floor(index);
  return Number.isFinite(whole)
    ? Math.max(0, Math.min(TOP_GRADE, whole))
    : DEFAULT_GRADE;
}
