/**
 * Was in welcher Runde kommt.
 *
 * @module
 * @remarks
 * **Die ersten vierzig Runden stehen hier als Tabelle**, angelehnt an die des
 * Vorbilds: Jede Sorte und jede Eigenschaft taucht in derselben Runde zum
 * ersten Mal auf wie dort - nachwachsend in 17, Schwarz in 20, Weiß in 22,
 * getarnt und Zebra in 24, Lila in 25, Regenbogen in 26, Blei in 28, Keramik
 * in 38 und der erste M.O.A.B. in 40. Die Mengen sind an dieses Spiel
 * angepasst, nicht abgeschrieben.
 *
 * Danach wird gerechnet, und die Zeppeline kommen in den Runden des Vorbilds:
 * B.F.B. ab 60, Z.O.M.G. ab 80, D.D.T. ab 90, B.A.D. ab 100.
 *
 * **Bosse gibt es in den normalen Runden nicht** - auch das wie im Vorbild.
 * Sie kommen nur in der Boss-Herausforderung, und dort in fünf Stufen in den
 * Runden 40, 60, 80, 100 und 120 ({@link bossOf}).
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

/** Wie dicht die Ballons einer Gruppe laufen. */
const GAP = {
  swarm: 0.18,
  tight: 0.32,
  loose: 0.55,
  lazy: 0.9,
  slow: 1.6,
} as const;

/** Die ersten vierzig Runden, von Hand. */
const ROUNDS: readonly (readonly Group[])[] = [
  /* 1 */ [{ kind: "red", count: 20, gap: GAP.loose, delay: 0 }],
  /* 2 */ [{ kind: "red", count: 35, gap: GAP.tight, delay: 0 }],
  /* 3 */ [
    { kind: "red", count: 25, gap: GAP.tight, delay: 0 },
    { kind: "blue", count: 5, gap: GAP.loose, delay: 8 },
  ],
  /* 4 */ [
    { kind: "red", count: 35, gap: GAP.tight, delay: 0 },
    { kind: "blue", count: 18, gap: GAP.loose, delay: 6 },
  ],
  /* 5 */ [
    { kind: "red", count: 5, gap: GAP.loose, delay: 0 },
    { kind: "blue", count: 27, gap: GAP.tight, delay: 3 },
  ],
  /* 6 */ [
    { kind: "red", count: 15, gap: GAP.tight, delay: 0 },
    { kind: "blue", count: 15, gap: GAP.tight, delay: 5 },
    { kind: "green", count: 4, gap: GAP.lazy, delay: 10 },
  ],
  /* 7 */ [
    { kind: "red", count: 20, gap: GAP.tight, delay: 0 },
    { kind: "blue", count: 20, gap: GAP.tight, delay: 5 },
    { kind: "green", count: 5, gap: GAP.lazy, delay: 11 },
  ],
  /* 8 */ [
    { kind: "red", count: 10, gap: GAP.tight, delay: 0 },
    { kind: "blue", count: 20, gap: GAP.tight, delay: 3 },
    { kind: "green", count: 14, gap: GAP.loose, delay: 9 },
  ],
  /* 9 */ [{ kind: "green", count: 30, gap: GAP.loose, delay: 0 }],
  /* 10 */ [{ kind: "blue", count: 80, gap: GAP.swarm, delay: 0 }],
  /* 11 */ [
    { kind: "red", count: 10, gap: GAP.tight, delay: 0 },
    { kind: "blue", count: 10, gap: GAP.tight, delay: 3 },
    { kind: "green", count: 12, gap: GAP.loose, delay: 6 },
    { kind: "yellow", count: 3, gap: GAP.lazy, delay: 12 },
  ],
  /* 12 */ [
    { kind: "blue", count: 15, gap: GAP.tight, delay: 0 },
    { kind: "green", count: 10, gap: GAP.loose, delay: 5 },
    { kind: "yellow", count: 5, gap: GAP.lazy, delay: 11 },
  ],
  /* 13 */ [
    { kind: "blue", count: 50, gap: GAP.swarm, delay: 0 },
    { kind: "green", count: 23, gap: GAP.tight, delay: 9 },
  ],
  /* 14 */ [
    { kind: "red", count: 30, gap: GAP.swarm, delay: 0 },
    { kind: "blue", count: 15, gap: GAP.tight, delay: 5 },
    { kind: "green", count: 10, gap: GAP.loose, delay: 10 },
    { kind: "yellow", count: 9, gap: GAP.loose, delay: 15 },
  ],
  /* 15 */ [
    { kind: "red", count: 20, gap: GAP.tight, delay: 0 },
    { kind: "green", count: 12, gap: GAP.loose, delay: 6 },
    { kind: "yellow", count: 5, gap: GAP.loose, delay: 12 },
    { kind: "pink", count: 3, gap: GAP.lazy, delay: 16 },
  ],
  /* 16 */ [
    { kind: "green", count: 20, gap: GAP.tight, delay: 0 },
    { kind: "yellow", count: 8, gap: GAP.loose, delay: 7 },
  ],
  /* 17 */ [
    {
      kind: "yellow",
      count: 8,
      gap: GAP.lazy,
      delay: 0,
      traits: { regrow: true },
    },
  ],
  /* 18 */ [{ kind: "green", count: 50, gap: GAP.swarm, delay: 0 }],
  /* 19 */ [
    { kind: "green", count: 10, gap: GAP.tight, delay: 0 },
    { kind: "yellow", count: 4, gap: GAP.loose, delay: 4 },
    {
      kind: "yellow",
      count: 4,
      gap: GAP.loose,
      delay: 8,
      traits: { regrow: true },
    },
    { kind: "pink", count: 5, gap: GAP.loose, delay: 12 },
  ],
  /* 20 */ [{ kind: "black", count: 6, gap: GAP.lazy, delay: 0 }],
  /* 21 */ [{ kind: "pink", count: 14, gap: GAP.loose, delay: 0 }],
  /* 22 */ [{ kind: "white", count: 16, gap: GAP.loose, delay: 0 }],
  /* 23 */ [
    { kind: "black", count: 7, gap: GAP.loose, delay: 0 },
    { kind: "white", count: 7, gap: GAP.loose, delay: 6 },
  ],
  /* 24 */ [
    { kind: "blue", count: 20, gap: GAP.tight, delay: 0 },
    {
      kind: "green",
      count: 1,
      gap: GAP.lazy,
      delay: 7,
      traits: { camo: true },
    },
    { kind: "zebra", count: 1, gap: GAP.lazy, delay: 9 },
  ],
  /* 25 */ [
    {
      kind: "yellow",
      count: 25,
      gap: GAP.tight,
      delay: 0,
      traits: { regrow: true },
    },
    { kind: "purple", count: 10, gap: GAP.loose, delay: 10 },
  ],
  /* 26 */ [
    { kind: "pink", count: 23, gap: GAP.tight, delay: 0 },
    { kind: "zebra", count: 4, gap: GAP.lazy, delay: 9 },
    { kind: "rainbow", count: 2, gap: GAP.slow, delay: 15 },
  ],
  /* 27 */ [
    { kind: "red", count: 60, gap: GAP.swarm, delay: 0 },
    { kind: "blue", count: 40, gap: GAP.swarm, delay: 6 },
    { kind: "green", count: 30, gap: GAP.swarm, delay: 12 },
    { kind: "yellow", count: 30, gap: GAP.swarm, delay: 18 },
  ],
  /* 28 */ [{ kind: "lead", count: 6, gap: GAP.slow, delay: 0 }],
  /* 29 */ [
    {
      kind: "yellow",
      count: 30,
      gap: GAP.tight,
      delay: 0,
      traits: { regrow: true },
    },
    { kind: "pink", count: 20, gap: GAP.tight, delay: 10 },
  ],
  /* 30 */ [{ kind: "lead", count: 9, gap: GAP.lazy, delay: 0 }],
  /* 31 */ [
    { kind: "black", count: 8, gap: GAP.loose, delay: 0 },
    { kind: "white", count: 8, gap: GAP.loose, delay: 4 },
    { kind: "zebra", count: 8, gap: GAP.loose, delay: 8 },
    {
      kind: "pink",
      count: 10,
      gap: GAP.tight,
      delay: 12,
      traits: { regrow: true },
    },
  ],
  /* 32 */ [
    { kind: "black", count: 25, gap: GAP.tight, delay: 0 },
    { kind: "white", count: 28, gap: GAP.tight, delay: 8 },
    { kind: "purple", count: 10, gap: GAP.loose, delay: 17 },
  ],
  /* 33 */ [
    {
      kind: "yellow",
      count: 20,
      gap: GAP.tight,
      delay: 0,
      traits: { camo: true },
    },
    { kind: "pink", count: 13, gap: GAP.loose, delay: 7 },
  ],
  /* 34 */ [
    { kind: "yellow", count: 80, gap: GAP.swarm, delay: 0 },
    { kind: "zebra", count: 6, gap: GAP.lazy, delay: 15 },
  ],
  /* 35 */ [
    { kind: "pink", count: 35, gap: GAP.tight, delay: 0 },
    { kind: "black", count: 30, gap: GAP.tight, delay: 11 },
    { kind: "white", count: 25, gap: GAP.tight, delay: 20 },
    { kind: "rainbow", count: 5, gap: GAP.lazy, delay: 28 },
  ],
  /* 36 */ [
    { kind: "pink", count: 60, gap: GAP.swarm, delay: 0 },
    {
      kind: "green",
      count: 20,
      gap: GAP.tight,
      delay: 11,
      traits: { camo: true, regrow: true },
    },
  ],
  /* 37 */ [
    { kind: "black", count: 20, gap: GAP.tight, delay: 0 },
    {
      kind: "white",
      count: 20,
      gap: GAP.tight,
      delay: 6,
      traits: { camo: true },
    },
    { kind: "lead", count: 7, gap: GAP.lazy, delay: 13 },
    { kind: "zebra", count: 15, gap: GAP.loose, delay: 19 },
  ],
  /* 38 */ [
    { kind: "pink", count: 42, gap: GAP.tight, delay: 0 },
    { kind: "white", count: 17, gap: GAP.loose, delay: 13 },
    { kind: "lead", count: 10, gap: GAP.lazy, delay: 21 },
    { kind: "ceramic", count: 2, gap: GAP.slow, delay: 30 },
  ],
  /* 39 */ [
    { kind: "black", count: 10, gap: GAP.loose, delay: 0 },
    { kind: "white", count: 10, gap: GAP.loose, delay: 5 },
    { kind: "rainbow", count: 20, gap: GAP.loose, delay: 10 },
    { kind: "zebra", count: 20, gap: GAP.loose, delay: 21 },
    { kind: "lead", count: 18, gap: GAP.lazy, delay: 32 },
  ],
  /* 40 */ [{ kind: "moab", count: 1, gap: GAP.slow, delay: 0 }],
];

/**
 * Wie viele Runden von Hand geschrieben sind.
 *
 * @remarks
 * Danach geht es weiter, nur eben gerechnet - ein Ende hat dieses Spiel nicht.
 */
export const WRITTEN_ROUNDS = ROUNDS.length;

/**
 * Das Grundgerüst der gerechneten Runden.
 *
 * @remarks
 * Keramik, Regenbogen und Blei - die Sorten, die nach Runde 40 im Vorbild den
 * Rücken jeder Welle bilden. Jede Runde kommt ein Stück mehr, bis zu einer
 * Obergrenze je Gruppe.
 */
const BASE: readonly Group[] = [
  { kind: "ceramic", count: 4, gap: GAP.lazy, delay: 0 },
  { kind: "rainbow", count: 8, gap: GAP.loose, delay: 7 },
  { kind: "lead", count: 6, gap: GAP.lazy, delay: 13 },
];

/** Wie stark das Grundgerüst je Runde nach der Tabelle zulegt. */
const BEYOND = { growth: 0.12, most: 60 } as const;

/**
 * Ab welcher Runde ein Zeppelin kommt, alle wie viele Runden einer mehr
 * dazukommt, wie viele es höchstens werden und in welchem Takt er kommt.
 *
 * @remarks
 * Die ersten Runden sind die des Vorbilds: M.O.A.B. 40 (aus der Tabelle),
 * B.F.B. 60, Z.O.M.G. 80, D.D.T. 90, B.A.D. 100. Zwischen 41 und 59 kommen
 * M.O.A.B. nur jede zweite Runde, B.A.D. danach nur jede fünfte.
 */
const ARRIVAL = {
  moab: { first: 42, every: 4, most: 8, step: 2 },
  bfb: { first: 60, every: 6, most: 4, step: 1 },
  zomg: { first: 80, every: 8, most: 3, step: 1 },
  ddt: { first: 90, every: 5, most: 6, step: 1 },
  bad: { first: 100, every: 10, most: 2, step: 5 },
} as const;

/**
 * Ab wann die gerechneten Runden Eigenschaften mischen, und in welchem Takt.
 *
 * @remarks
 * Ein fester Takt statt Zufall: Wer verliert, soll beim nächsten Versuch
 * dieselbe Runde wieder bekommen. **Ab wann verstärkte Ballons kommen, ist
 * geschätzt** - die Runden 45 und 70 sind nicht aus dem Vorbild.
 */
const MIX = {
  regrow: 2,
  camo: 3,
  shielded: 4,
  fortifyFrom: 45,
  blimpFortifyFrom: 70,
} as const;

/** Wann in einer gerechneten Runde die Zeppeline und der Boss loslaufen. */
const LATE = { boss: 10, blimps: 20, gap: 3 } as const;

/**
 * In welchen Runden der Boss der Boss-Herausforderung kommt, und wie stark.
 *
 * @remarks
 * Wie im Vorbild fünf Stufen, alle zwanzig Runden eine, von Runde 40 bis 120.
 * Jede Stufe hat mehr Hülle als die davor; wer die fünfte übersteht, hat die
 * Herausforderung geschafft.
 */
export const BOSS_TIERS: readonly {
  readonly round: number;
  readonly scale: number;
}[] = [
  { round: 40, scale: 1 },
  { round: 60, scale: 2 },
  { round: 80, scale: 3.5 },
  { round: 100, scale: 6 },
  { round: 120, scale: 10 },
];

/**
 * Was in einer Runde kommt.
 *
 * @param round - die wievielte Runde, von eins an
 * @param boss - der Boss der Boss-Herausforderung, oder null im normalen Spiel
 * @returns die Gruppen, aus denen die Welle besteht
 */
export function waveOf(
  round: number,
  boss: BloonKind | null = null,
): readonly Group[] {
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
    wave = [...mixed(grown, round), ...blimps(round)];
  }

  const big = boss === null ? null : bossOf(round, boss);
  return big === null ? wave : [...wave, big];
}

/**
 * Der Boss in dieser Runde, wenn einer kommt.
 *
 * @param round - die wievielte Runde
 * @param boss - welcher Boss
 * @returns die Gruppe mit dem Boss, oder null
 */
export function bossOf(round: number, boss: BloonKind): Group | null {
  const tier = BOSS_TIERS.find((one) => one.round === round);
  return tier === undefined
    ? null
    : { kind: boss, count: 1, gap: 0, delay: LATE.boss, scale: tier.scale };
}

/**
 * Die Grundgruppen einer gerechneten Runde mit ihren Eigenschaften.
 *
 * @remarks
 * Regenbogen wächst jede zweite Runde nach, Keramik ist jede dritte getarnt
 * und jede vierte geschützt, und ab Runde 45 kommen Blei und Keramik jede
 * zweite Runde verstärkt.
 */
function mixed(groups: readonly Group[], round: number): readonly Group[] {
  const fortified = round >= MIX.fortifyFrom && round % MIX.regrow === 0;
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
          fortified,
        };
        break;
      case "lead":
        traits = { fortified };
        break;
      default:
        break;
    }
    return { ...group, traits };
  });
}

/** Die Zeppeline einer gerechneten Runde. */
function blimps(round: number): readonly Group[] {
  const groups: Group[] = [];
  const fortified = round >= MIX.blimpFortifyFrom && round % MIX.regrow === 0;
  let delay = LATE.blimps;

  for (const [kind, plan] of Object.entries(ARRIVAL)) {
    const due = round >= plan.first && (round - plan.first) % plan.step === 0;
    const count = due
      ? Math.min(plan.most, 1 + Math.floor((round - plan.first) / plan.every))
      : 0;
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

  return groups;
}
