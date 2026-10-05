/**
 * Leicht, Mittel, Schwer - und was das an einer Partie ändert.
 *
 * @module
 * @remarks
 * **Wie im Vorbild ändert die Schwierigkeit vier Dinge**: wie viele Leben man
 * hat, was ein Affe kostet, bis zu welcher Runde man durchhalten muss, und
 * damit, wie viel Erfahrung eine Partie bringt. Die Ballons selbst sind auf
 * allen dreien dieselben - schwerer wird es, weil man weniger bauen kann und
 * länger durchhalten muss.
 */

/** Die drei Schwierigkeiten. */
export type Difficulty = "easy" | "medium" | "hard";

/** Was eine Schwierigkeit ausmacht. */
export type Setting = {
  readonly name: string;
  /** Womit man anfängt. */
  readonly money: number;
  readonly lives: number;
  /** Womit alle Preise malgenommen werden. */
  readonly price: number;
  /** Welche Runde man überstehen muss, um zu gewinnen. */
  readonly goal: number;
  /** Womit die Erfahrung je Runde malgenommen wird. */
  readonly xp: number;
};

/**
 * Die drei Schwierigkeiten, mit den Zahlen des Vorbilds.
 *
 * @remarks
 * Leicht: 200 Leben, alles 15 % billiger, Ziel Runde 40. Mittel: 150 Leben,
 * Listenpreis, Ziel Runde 60. Schwer: 100 Leben, alles 8 % teurer, Ziel
 * Runde 80.
 */
export const DIFFICULTIES: Readonly<Record<Difficulty, Setting>> = {
  easy: {
    name: "Leicht",
    money: 650,
    lives: 200,
    price: 0.85,
    goal: 40,
    xp: 1,
  },
  medium: {
    name: "Mittel",
    money: 650,
    lives: 150,
    price: 1,
    goal: 60,
    xp: 1.1,
  },
  hard: {
    name: "Schwer",
    money: 650,
    lives: 100,
    price: 1.08,
    goal: 80,
    xp: 1.2,
  },
};

/** In welcher Reihenfolge sie zur Wahl stehen. */
export const DIFFICULTY_ORDER: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
];

/** Auf wie viel ein Preis gerundet wird, wie im Vorbild. */
const ROUND_TO = 5;

/**
 * Was etwas auf dieser Schwierigkeit kostet.
 *
 * @param cost - der Listenpreis
 * @param difficulty - die Schwierigkeit
 * @returns der Preis, auf fünf Dollar gerundet
 */
export function priceOf(cost: number, difficulty: Difficulty): number {
  return (
    Math.round((cost * DIFFICULTIES[difficulty].price) / ROUND_TO) * ROUND_TO
  );
}
