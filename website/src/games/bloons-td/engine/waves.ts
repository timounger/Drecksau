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
 * bauen. Dasselbe gilt für die Eigenschaften: Nachwachsend, getarnt, mit
 * Schild und verstärkt kommen je einmal in kleiner Zahl, bevor die gerechneten
 * Runden sie unter alles mischen.
 *
 * Nach der Tabelle kommen die Zeppeline, ab Runde 30 alle zehn Runden ein
 * Boss - der Reihe nach, und bei jedem Durchgang stärker.
 */
import type { BloonKind } from "@/games/bloons-td/engine/bloons";
import type { Traits } from "@/games/bloons-td/engine/types";

/** Eine Gruppe gleicher Ballons in einer Welle. */
export type Group = {
  readonly kind: BloonKind;
  readonly count: number;
  /** Wie viele Sekunden zwischen zweien liegen. */
  readonly gap: number;
  /** Und wie lange die Gruppe nach dem Rundenstart wartet. */
  readonly delay: number;
  /** Was die Ballons mitbringen - fehlt etwas, haben sie es nicht. */
  readonly traits?: Partial<Traits>;
  /** Wie viel stärker ihre Hülle ist als in der Tabelle; fehlt es, eins. */
  readonly scale?: number;
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
    {
      kind: "blue",
      count: 10,
      gap: GAP.tight,
      delay: 15,
      traits: { regrow: true },
    },
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
    {
      kind: "green",
      count: 6,
      gap: GAP.loose,
      delay: 16,
      traits: { camo: true },
    },
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
    {
      kind: "pink",
      count: 6,
      gap: GAP.loose,
      delay: 17,
      traits: { shielded: true },
    },
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
    {
      kind: "lead",
      count: 2,
      gap: GAP.lazy,
      delay: 20,
      traits: { fortified: true },
    },
  ],
];

/**
 * Das Grundgerüst der gerechneten Runden: die letzte Handrunde ohne ihre
 * Lehrgruppe am Ende.
 */
const BASE: readonly Group[] = [
  { kind: "ceramic", count: 4, gap: GAP.lazy, delay: 0 },
  { kind: "rainbow", count: 8, gap: GAP.loose, delay: 7 },
  { kind: "lead", count: 8, gap: GAP.lazy, delay: 13 },
];

/**
 * Ab welcher Runde etwas kommt, alle wie viele Runden einer mehr dazukommt,
 * und wie viele es höchstens werden.
 */
const ARRIVAL = {
  moab: { first: 24, every: 4, most: 8 },
  ddt: { first: 32, every: 5, most: 6 },
  bfb: { first: 36, every: 6, most: 4 },
  zomg: { first: 50, every: 10, most: 3 },
  bad: { first: 70, every: 15, most: 2 },
} as const;

/** Wann der goldene Ballon kommt: ab dieser Runde, dann alle so viele. */
const GOLDEN = { first: 27, every: 10 } as const;

/**
 * Wann die Bosse kommen, und um wie viel stärker sie je Durchgang werden.
 *
 * @remarks
 * Ab Runde 30 alle zehn Runden einer, in der Reihenfolge von
 * {@link BOSS_ORDER}. Nach sechs Bossen fängt die Reihe von vorn an, und jeder
 * hat dann drei Viertel mehr Hülle als beim letzten Mal.
 */
const BOSS = { first: 30, every: 10, growth: 0.75 } as const;

/** Die Reihenfolge der Bosse. */
export const BOSS_ORDER: readonly BloonKind[] = [
  "bloonarius",
  "vortex",
  "lych",
  "dreadbloon",
  "phayze",
  "blastapopoulos",
];

/** Wann in einer gerechneten Runde die Zeppeline und der Boss loslaufen. */
const LATE = { golden: 8, boss: 10, blimps: 20, gap: 3 } as const;

/**
 * Ab wann die gerechneten Runden Eigenschaften mischen, und in welchem Takt.
 *
 * @remarks
 * Ein fester Takt statt Zufall: Wer verliert, soll beim nächsten Versuch
 * dieselbe Runde wieder bekommen.
 */
const MIX = {
  regrow: 2,
  camo: 3,
  shielded: 4,
  fortifyFrom: 30,
  blimpFortifyFrom: 40,
} as const;

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
    const over = round - ROUNDS.length;
    const grown = BASE.map((group) => ({
      ...group,
      count: Math.min(
        BEYOND.most,
        Math.round(group.count * (1 + over * BEYOND.growth)),
      ),
    }));
    wave = [...mixed(grown, round), ...late(round)];
  }

  return wave;
}

/**
 * Die Grundgruppen einer gerechneten Runde mit ihren Eigenschaften.
 *
 * @remarks
 * Regenbogen wächst jede zweite Runde nach, Keramik ist jede dritte getarnt
 * und jede vierte geschützt, und ab Runde 30 kommt Blei jede zweite Runde
 * verstärkt.
 */
function mixed(groups: readonly Group[], round: number): readonly Group[] {
  return groups.map((group) => {
    let traits: Partial<Traits> = {};
    switch (group.kind) {
      case "rainbow":
        traits = { regrow: round % MIX.regrow === 0 };
        break;
      case "ceramic":
        traits = {
          camo: round % MIX.camo === 0,
          shielded: round % MIX.shielded === 0,
        };
        break;
      case "lead":
        traits = {
          fortified: round >= MIX.fortifyFrom && round % MIX.regrow === 0,
        };
        break;
      default:
        break;
    }
    return { ...group, traits };
  });
}

/** Was nach den Grundgruppen kommt: Gold, Zeppeline und der Boss. */
function late(round: number): readonly Group[] {
  const groups: Group[] = [];
  const fortified = round >= MIX.blimpFortifyFrom && round % MIX.regrow === 0;

  if (round >= GOLDEN.first && (round - GOLDEN.first) % GOLDEN.every === 0) {
    groups.push({ kind: "golden", count: 1, gap: 0, delay: LATE.golden });
  }

  let delay = LATE.blimps;
  for (const [kind, plan] of Object.entries(ARRIVAL)) {
    const count =
      round < plan.first
        ? 0
        : Math.min(
            plan.most,
            1 + Math.floor((round - plan.first) / plan.every),
          );
    if (count > 0) {
      groups.push({
        kind: kind as BloonKind,
        count,
        gap: LATE.gap,
        delay,
        traits: { fortified },
      });
      delay += count * LATE.gap;
    }
  }

  if (round >= BOSS.first && (round - BOSS.first) % BOSS.every === 0) {
    const turn = (round - BOSS.first) / BOSS.every;
    const kind = BOSS_ORDER[turn % BOSS_ORDER.length] ?? "bloonarius";
    groups.push({
      kind,
      count: 1,
      gap: 0,
      delay: LATE.boss,
      scale: 1 + Math.floor(turn / BOSS_ORDER.length) * BOSS.growth,
    });
  }

  return groups;
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
