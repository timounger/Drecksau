/**
 * Was in welcher Runde kommt.
 *
 * @module
 * @remarks
 * **Die ersten zwanzig Runden stehen hier als Tabelle**, und zwar absichtlich:
 * Eine Welle ist eine Ansage ("jetzt kommt zum ersten Mal Blei"), und eine
 * Ansage schreibt man auf, statt sie auszurechnen. Erst danach wird gerechnet,
 * weil nach zwanzig Runden keine Ansage mehr kommt, sondern nur noch mehr.
 *
 * Die Reihenfolge ist die Lehrstunde des Spiels: Jede neue Sorte taucht einmal
 * in kleiner Zahl auf, bevor sie in großer kommt - wer beim ersten schwarzen
 * Ballon merkt, dass seine Bomben nichts tun, hat noch Zeit, etwas anderes zu
 * bauen.
 */
import type { BloonKind } from "@/games/bloons-td/engine/bloons";

/** Eine Gruppe gleicher Ballons in einer Welle. */
export type Group = {
  readonly kind: BloonKind;
  readonly count: number;
  /** Wie viele Sekunden zwischen zweien liegen. */
  readonly gap: number;
  /** Und wie lange die Gruppe nach dem Rundenstart wartet. */
  readonly delay: number;
};

/** Wie dicht die Ballons einer Gruppe standardmäßig laufen. */
const GAP = { tight: 0.32, loose: 0.55, lazy: 0.9 } as const;

/** Die ersten zwanzig Runden, von Hand. */
const ROUNDS: readonly (readonly Group[])[] = [
  [{ kind: "red", count: 12, gap: GAP.loose, delay: 0 }],
  [{ kind: "red", count: 20, gap: GAP.tight, delay: 0 }],
  [
    { kind: "red", count: 10, gap: GAP.loose, delay: 0 },
    { kind: "blue", count: 6, gap: GAP.loose, delay: 6 },
  ],
  [
    { kind: "blue", count: 14, gap: GAP.tight, delay: 0 },
    { kind: "green", count: 4, gap: GAP.loose, delay: 6 },
  ],
  [
    { kind: "blue", count: 20, gap: GAP.tight, delay: 0 },
    { kind: "green", count: 8, gap: GAP.loose, delay: 7 },
  ],
  [
    { kind: "green", count: 12, gap: GAP.loose, delay: 0 },
    { kind: "yellow", count: 6, gap: GAP.loose, delay: 7 },
    { kind: "pink", count: 2, gap: GAP.lazy, delay: 12 },
  ],
  [
    { kind: "green", count: 16, gap: GAP.tight, delay: 0 },
    { kind: "yellow", count: 10, gap: GAP.loose, delay: 6 },
    { kind: "pink", count: 4, gap: GAP.loose, delay: 12 },
  ],
  [
    { kind: "yellow", count: 14, gap: GAP.loose, delay: 0 },
    { kind: "pink", count: 8, gap: GAP.loose, delay: 8 },
  ],
  [
    { kind: "yellow", count: 20, gap: GAP.tight, delay: 0 },
    { kind: "pink", count: 12, gap: GAP.loose, delay: 7 },
  ],
  [
    { kind: "black", count: 6, gap: GAP.lazy, delay: 0 },
    { kind: "pink", count: 10, gap: GAP.loose, delay: 5 },
  ],
  [
    { kind: "black", count: 8, gap: GAP.loose, delay: 0 },
    { kind: "white", count: 6, gap: GAP.loose, delay: 6 },
    { kind: "yellow", count: 10, gap: GAP.tight, delay: 10 },
  ],
  [
    { kind: "white", count: 10, gap: GAP.loose, delay: 0 },
    { kind: "black", count: 8, gap: GAP.loose, delay: 5 },
    { kind: "pink", count: 12, gap: GAP.tight, delay: 10 },
  ],
  [
    { kind: "purple", count: 6, gap: GAP.lazy, delay: 0 },
    { kind: "black", count: 10, gap: GAP.loose, delay: 5 },
    { kind: "white", count: 8, gap: GAP.loose, delay: 10 },
  ],
  [
    { kind: "lead", count: 4, gap: GAP.lazy, delay: 0 },
    { kind: "purple", count: 8, gap: GAP.loose, delay: 6 },
    { kind: "pink", count: 14, gap: GAP.tight, delay: 11 },
  ],
  [
    { kind: "lead", count: 6, gap: GAP.lazy, delay: 0 },
    { kind: "black", count: 12, gap: GAP.loose, delay: 6 },
    { kind: "white", count: 10, gap: GAP.loose, delay: 11 },
  ],
  [
    { kind: "zebra", count: 6, gap: GAP.lazy, delay: 0 },
    { kind: "lead", count: 6, gap: GAP.lazy, delay: 6 },
    { kind: "purple", count: 8, gap: GAP.loose, delay: 12 },
  ],
  [
    { kind: "zebra", count: 10, gap: GAP.loose, delay: 0 },
    { kind: "lead", count: 8, gap: GAP.lazy, delay: 6 },
    { kind: "black", count: 12, gap: GAP.tight, delay: 12 },
  ],
  [
    { kind: "rainbow", count: 4, gap: GAP.lazy, delay: 0 },
    { kind: "zebra", count: 8, gap: GAP.loose, delay: 6 },
    { kind: "lead", count: 6, gap: GAP.lazy, delay: 12 },
  ],
  [
    { kind: "rainbow", count: 8, gap: GAP.loose, delay: 0 },
    { kind: "zebra", count: 10, gap: GAP.loose, delay: 7 },
    { kind: "white", count: 12, gap: GAP.tight, delay: 13 },
  ],
  [
    { kind: "ceramic", count: 4, gap: GAP.lazy, delay: 0 },
    { kind: "rainbow", count: 8, gap: GAP.loose, delay: 7 },
    { kind: "lead", count: 8, gap: GAP.lazy, delay: 13 },
  ],
];

/** Wie stark die Zahlen nach der Tabelle je Runde zulegen. */
const BEYOND = { growth: 0.22, most: 60 } as const;

/**
 * Wie viele Runden von Hand geschrieben sind.
 *
 * @remarks
 * Danach geht es weiter, nur eben gerechnet - ein Ende hat dieses Spiel nicht.
 */
export const WRITTEN_ROUNDS = ROUNDS.length;

/**
 * Was in einer Runde kommt.
 *
 * @param round - die wievielte Runde, von eins an
 * @returns die Gruppen, aus denen die Welle besteht
 * @remarks
 * Hinter der Tabelle wächst die letzte Welle weiter: mehr von allem, und mit
 * jeder Runde ein Stück dichter. Das ist keine neue Ansage mehr, sondern die
 * Frage, wie lange das hält, was man gebaut hat.
 */
export function waveOf(round: number): readonly Group[] {
  const written = ROUNDS[round - 1];
  let wave: readonly Group[] = written ?? [];

  if (written === undefined) {
    const last = ROUNDS[ROUNDS.length - 1] ?? [];
    const over = round - ROUNDS.length;
    wave = last.map((group) => ({
      ...group,
      count: Math.min(
        BEYOND.most,
        Math.round(group.count * (1 + over * BEYOND.growth)),
      ),
    }));
  }

  return wave;
}

/**
 * Wie viele Treffer in einer ganzen Welle stecken.
 *
 * @param groups - die Welle
 * @param rbeOf - wie viele Treffer eine Sorte wert ist
 * @returns die Summe
 */
export function weightOf(
  groups: readonly Group[],
  rbeOf: (kind: BloonKind) => number,
): number {
  return groups.reduce((sum, one) => sum + one.count * rbeOf(one.kind), 0);
}
