/**
 * Erfahrung, Level und was man damit freischaltet - über alle Partien hinweg.
 *
 * @module
 * @remarks
 * **Wie im Vorbild fängt man mit dem Wurfpfeilaffen an.** Jede überstandene
 * Runde bringt Erfahrung, Erfahrung bringt Level, und jedes Level schaltet den
 * nächsten Affen frei - in der Reihenfolge, in der das Vorbild sie hergibt.
 * Wer viel spielt, hat irgendwann alle; wer neu ist, lernt einen nach dem
 * anderen kennen statt dreiundzwanzig auf einmal.
 *
 * Dazu kommen die Medaillen: eine je Karte und Schwierigkeit, die man
 * geschafft hat. Beides lebt im Browser, wie die Statistik auch.
 */
import type { Difficulty } from "@/games/bloons-td/engine/difficulty";
import { DIFFICULTIES } from "@/games/bloons-td/engine/difficulty";
import type { MapId } from "@/games/bloons-td/engine/map";
import type { TowerKind } from "@/games/bloons-td/engine/towers";

/** Was man über alle Partien hinweg erreicht hat. */
export type Progress = {
  /** Alle Erfahrung, die je gesammelt wurde. */
  readonly xp: number;
  /** Welche Schwierigkeiten auf welcher Karte geschafft sind. */
  readonly medals: Readonly<Partial<Record<MapId, readonly Difficulty[]>>>;
};

/** Wer noch nie gespielt hat. */
export const NO_PROGRESS: Progress = { xp: 0, medals: {} };

/**
 * Ab welchem Level ein Affe zu haben ist.
 *
 * @remarks
 * Die Reihenfolge ist die des Vorbilds: erst die Primär-Affen, dann Militär,
 * dann Magie, zuletzt die Unterstützung. Der Stachelexperte, den es dort
 * nicht gibt, kommt ganz am Schluss.
 */
export const UNLOCK: Readonly<Record<TowerKind, number>> = {
  dart: 1,
  boomerang: 2,
  bomb: 3,
  tack: 4,
  ice: 5,
  glue: 6,
  sniper: 7,
  sub: 8,
  boat: 9,
  ace: 10,
  heli: 11,
  mortar: 12,
  dartling: 13,
  wizard: 14,
  super: 15,
  ninja: 16,
  alchemist: 17,
  druid: 18,
  farm: 19,
  spikeFactory: 20,
  village: 21,
  engineer: 22,
  spiker: 23,
};

/**
 * Wie viel Erfahrung es braucht, und wie viel eine Runde bringt.
 *
 * @remarks
 * Von Level zu Level braucht es jedes Mal `step` mehr als beim letzten: Level
 * 2 bei 150, Level 3 bei 450, Level 4 bei 900. Eine Runde bringt eine
 * Grundzahl plus etwas je Runde, malgenommen mit der Schwierigkeit - eine
 * ganze Partie auf Leicht bis Runde 40 reicht für etwa sechs Level, alle drei
 * Schwierigkeiten auf einer Karte für gut achtzehn.
 */
const XP = { step: 150, base: 20, perRound: 3 } as const;

/** Wo der Fortschritt im Browser liegt. */
const STORE_KEY = "bloons-td-progress";

/**
 * Welches Level zu so viel Erfahrung gehört.
 *
 * @param xp - alle gesammelte Erfahrung
 * @returns das Level, von eins an
 */
export function levelOf(xp: number): number {
  let level = 1;
  while (xpFor(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

/**
 * Wie viel Erfahrung man für ein Level insgesamt braucht.
 *
 * @param level - das Level
 * @returns die Erfahrung, ab der man es hat
 */
export function xpFor(level: number): number {
  return (XP.step * (level - 1) * level) / 2;
}

/**
 * Was eine überstandene Runde an Erfahrung bringt.
 *
 * @param round - die wievielte Runde
 * @param difficulty - wie schwer
 * @returns die Erfahrung, abgerundet
 */
export function xpOfRound(round: number, difficulty: Difficulty): number {
  return Math.floor(
    (XP.base + round * XP.perRound) * DIFFICULTIES[difficulty].xp,
  );
}

/**
 * Ob ein Affe auf diesem Level schon zu haben ist.
 *
 * @param kind - welcher
 * @param level - das Level des Spielers
 * @returns true, wenn er freigeschaltet ist
 */
export function isUnlocked(kind: TowerKind, level: number): boolean {
  return level >= UNLOCK[kind];
}

/**
 * Welche Affen auf genau diesem Level dazukommen.
 *
 * @param level - das neue Level
 * @returns die Affen, die man jetzt erst bekommt
 */
export function unlockedAt(level: number): readonly TowerKind[] {
  return (Object.keys(UNLOCK) as TowerKind[]).filter(
    (kind) => UNLOCK[kind] === level,
  );
}

/**
 * Der Fortschritt mit einer Medaille mehr.
 *
 * @param progress - wie es bisher steht
 * @param map - welche Karte
 * @param difficulty - welche Schwierigkeit geschafft ist
 * @returns der neue Fortschritt
 */
export function withMedal(
  progress: Progress,
  map: MapId,
  difficulty: Difficulty,
): Progress {
  const had = progress.medals[map] ?? [];
  return had.includes(difficulty)
    ? progress
    : {
        ...progress,
        medals: { ...progress.medals, [map]: [...had, difficulty] },
      };
}

/**
 * Den Fortschritt aus dem Browser lesen.
 *
 * @returns was gespeichert ist, oder den Anfang, wenn nichts da ist oder der
 *   Speicher nicht mitspielt
 */
export function loadProgress(): Progress {
  let progress = NO_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    if (isProgress(parsed)) {
      progress = parsed;
    }
  } catch {
    // Kein Speicher oder Unsinn darin: Dann fängt man eben von vorn an.
  }
  return progress;
}

/**
 * Den Fortschritt im Browser ablegen.
 *
 * @param progress - was gespeichert werden soll
 */
export function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(progress));
  } catch {
    // Ohne Speicher geht der Fortschritt mit dem Tab verloren - mehr nicht.
  }
}

/**
 * Den Fortschritt aus dem Browser löschen.
 *
 * @remarks
 * Danach ist man wieder auf Level 1 mit nur dem Wurfpfeilaffen, und alle
 * Medaillen sind weg. Statistik und Bestenliste bleiben, wie sie sind - sie
 * sagen, was gespielt wurde, nicht, was man freigeschaltet hat.
 */
export function clearProgress(): void {
  try {
    window.localStorage.removeItem(STORE_KEY);
  } catch {
    // Ohne Speicher war ohnehin nichts gespeichert.
  }
}

/** Ob etwas aus dem Speicher wie ein Fortschritt aussieht. */
function isProgress(value: unknown): value is Progress {
  const shaped =
    typeof value === "object" &&
    value !== null &&
    "xp" in value &&
    "medals" in value;
  return (
    shaped &&
    typeof value.xp === "number" &&
    Number.isFinite(value.xp) &&
    typeof value.medals === "object" &&
    value.medals !== null
  );
}
