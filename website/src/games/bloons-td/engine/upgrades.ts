/**
 * Zwei Säulen je Turm, je zwei Stufen - und was sie an den Werten ändern.
 *
 * @module
 * @remarks
 * **Eine Stufe ist ein Unterschied zur Stufe davor, nicht zum Anfang.** Wer
 * die zweite kauft, hat die erste schon; beide wirken übereinander. Genau so
 * steht es auch in der Vorlage: "Spitze Pfeile" gibt +1 Durchschlag, und
 * "Rasiermesserscharf" noch einmal +2 - zusammen fünf statt zwei.
 *
 * Multipliziert wird, was ein Verhältnis ist (Nachladen, Reichweite), addiert,
 * was eine Anzahl ist (Durchschläge, Nägel, Sekunden). Ein Nachladefaktor von
 * 0,85 und dann 0,784 macht 0,667 - das ist die Zahl, die im Vorbild steht.
 *
 * **Alle Preise und Wirkungen stehen so in der Vorlage**, und zwar in der
 * mittleren der vier Preisspalten - derselben, aus der auch die Grundpreise
 * der Türme kommen. Wo die Vorlage etwas kann, das es hier nicht gibt (Tarnung,
 * MOAB-Klasse), steht in der Zeile, was stattdessen passiert; erfunden ist
 * nichts, umgedeutet an drei Stellen schon. Die stehen im README.
 */
import {
  TOWERS,
  type Monkey,
  type TowerKind,
} from "@/games/bloons-td/engine/towers";

/** Welche der beiden Säulen. */
export type Path = "one" | "two";

/** Wie weit ein Turm auf beiden Säulen schon ist. */
export type Tiers = {
  readonly one: number;
  readonly two: number;
};

/**
 * Wie viele Sekunden zwischen zwei Bissen ätzenden Klebstoffs liegen.
 *
 * @remarks
 * Steht hier und nicht in der Engine, weil dieselbe Zahl zweimal gebraucht
 * wird: Die Verbesserung verspricht sie, und der Ballon rechnet damit weiter,
 * wenn der Turm, der ihn beklebt hat, längst verkauft ist.
 */
export const BITE = 2;

/** Wie viele Stufen eine Säule hat. */
export const MOST = 2;

/** Ein frisch gebauter Turm steht auf null. */
export const NO_TIERS: Tiers = { one: 0, two: 0 };

/**
 * Eine Stufe.
 *
 * @remarks
 * Was fehlt, ändert nichts: Eine Stufe ohne `reload` lässt das Nachladen, wie
 * es war. Damit steht in jeder Zeile nur das, was sie wirklich tut.
 */
export type Upgrade = {
  readonly name: string;
  readonly cost: number;
  readonly note: string;
  /** Dazugezählt: erfasste Ballons, Schaden, Sekunden Bremse. */
  readonly pierce?: number;
  readonly damage?: number;
  readonly slow?: number;
  /** Malgenommen: Nachladen, Reichweite, Knall, Bremswirkung, Flugtempo. */
  readonly reload?: number;
  readonly range?: number;
  readonly blast?: number;
  readonly slowTo?: number;
  readonly afterTo?: number;
  readonly speed?: number;
  /** Umgelegt: zieht durch, trifft Immune, frisst Schichten. */
  readonly soak?: boolean;
  readonly cold?: boolean;
  readonly bite?: number;
};

/**
 * Die zwölf Säulen, zwei je Turm.
 *
 * @remarks
 * Jede Säule ist eine andere Art, besser zu werden - und nie zweimal dieselbe
 * beim selben Turm. Der Reißnagelwerfer wird auf der einen Säule dichter und
 * auf der anderen weiter; wer beides wollte, müsste beides kaufen, und genau
 * darum geht es.
 */
export const UPGRADES: Readonly<
  Record<TowerKind, Readonly<Record<Path, readonly Upgrade[]>>>
> = {
  dart: {
    one: [
      {
        name: "Sharp Shots",
        cost: 140,
        note: "Sticht einen Ballon mehr je Wurf auf.",
        pierce: 1,
      },
      {
        name: "Razor Sharp Shots",
        cost: 200,
        note: "Noch zwei Ballons mehr je Wurf - zusammen fünf.",
        pierce: 2,
      },
    ],
    two: [
      {
        name: "Quick Shots",
        cost: 100,
        note: "Wirft 15 % schneller.",
        reload: 0.85,
      },
      {
        name: "Very Quick Shots",
        cost: 190,
        note: "Wirft ein Drittel schneller als am Anfang.",
        reload: 0.784,
      },
    ],
  },
  boomerang: {
    one: [
      {
        name: "Improved Rangs",
        cost: 200,
        note: "Acht Ballons je Wurf statt vier.",
        pierce: 4,
      },
      {
        name: "Glaives",
        cost: 280,
        note: "Klingen statt Holz: dreizehn Ballons je Wurf.",
        pierce: 5,
      },
    ],
    two: [
      {
        name: "Faster Throwing",
        cost: 175,
        note: "Wirft ein Drittel schneller.",
        reload: 0.75,
      },
      {
        name: "Faster Rangs",
        cost: 250,
        note: "Noch ein Drittel schneller, und die Klinge fliegt schneller.",
        reload: 0.75,
        speed: 1.25,
      },
    ],
  },
  tack: {
    one: [
      {
        name: "Faster Shooting",
        cost: 150,
        note: "Wirft ein Drittel schneller.",
        reload: 0.75,
      },
      {
        name: "Even Faster Shooting",
        cost: 300,
        note: "Noch ein Drittel schneller - fast doppelt so oft wie am Anfang.",
        reload: 0.75,
      },
    ],
    two: [
      {
        name: "Long Range Tacks",
        cost: 100,
        note: "Die Nägel fliegen weiter und schneller.",
        range: 1.17,
        speed: 1.25,
      },
      {
        name: "Super Range Tacks",
        cost: 225,
        note: "Noch weiter, und drei Ballons mehr je Nagel.",
        range: 1.15,
        pierce: 3,
      },
    ],
  },
  bomb: {
    one: [
      {
        name: "Bigger Bombs",
        cost: 250,
        note: "Der Knall reicht halb so weit noch einmal und erfasst sechs Ballons mehr.",
        blast: 1.5,
        pierce: 6,
      },
      {
        name: "Heavy Bombs",
        cost: 650,
        note: "Jeder Knall nimmt zwei Schichten statt einer und erfasst zehn Ballons mehr.",
        damage: 1,
        pierce: 10,
      },
    ],
    two: [
      {
        name: "Faster Reload",
        cost: 250,
        note: "Lädt ein Drittel schneller nach.",
        reload: 0.75,
      },
      {
        name: "Missile Launcher",
        cost: 400,
        note: "Raketen statt Bomben: noch schneller, weiter und flinker unterwegs.",
        reload: 0.7333,
        range: 1.1,
        speed: 1.5,
      },
    ],
  },
  ice: {
    one: [
      {
        name: "Permafrost",
        cost: 150,
        note: "Aufgetaute Ballons laufen noch so lange halb so schnell, wie der Frost gedauert hat.",
        afterTo: 0.5,
      },
      {
        name: "Cold Snap",
        cost: 350,
        note: "Friert auch ein, was sonst kalt bleibt - Weiß und Zebra.",
        cold: true,
      },
    ],
    two: [
      {
        name: "Enhanced Freeze",
        cost: 200,
        note: "Ein Drittel schneller, und der Frost hält eine Viertelsekunde länger.",
        reload: 0.75,
        slow: 0.25,
      },
      {
        name: "Deep Freeze",
        cost: 300,
        note: "Noch länger, eine Schicht mehr und fünf Ballons mehr auf einmal.",
        slow: 0.45,
        damage: 1,
        pierce: 5,
      },
    ],
  },
  glue: {
    one: [
      {
        name: "Glue Soak",
        cost: 200,
        note: "Der Klebstoff zieht durch: Was aus einem beklebten Ballon kommt, klebt auch.",
        soak: true,
      },
      {
        name: "Corrosive Glue",
        cost: 300,
        note: "Ätzend: Ein beklebter Ballon verliert alle zwei Sekunden eine Schicht.",
        bite: BITE,
      },
    ],
    two: [
      {
        name: "Bigger Globs",
        cost: 100,
        note: "Zwei Ballons je Schuss statt einem.",
        pierce: 1,
      },
      {
        name: "Glue Splatter",
        cost: 970,
        note: "Der Klecks spritzt: fünf Ballons je Schuss.",
        pierce: 3,
      },
    ],
  },
};

/**
 * Die Stufe, die als Nächstes käme.
 *
 * @param kind - welcher Turm
 * @param path - welche Säule
 * @param tiers - wie weit er schon ist
 * @returns die nächste Stufe, oder null, wenn die Säule voll ist
 */
export function nextOf(
  kind: TowerKind,
  path: Path,
  tiers: Tiers,
): Upgrade | null {
  return UPGRADES[kind][path][tiers[path]] ?? null;
}

/**
 * Die Stufe, die zuletzt gekauft wurde.
 *
 * @param kind - welcher Turm
 * @param path - welche Säule
 * @param tiers - wie weit er ist
 * @returns die oberste gekaufte Stufe, oder null, wenn die Säule leer ist
 */
export function lastOf(
  kind: TowerKind,
  path: Path,
  tiers: Tiers,
): Upgrade | null {
  return UPGRADES[kind][path][tiers[path] - 1] ?? null;
}

/**
 * Was ein Turm an Verbesserungen schon gekostet hat.
 *
 * @param kind - welcher Turm
 * @param tiers - wie weit er ist
 * @returns die Summe aller gekauften Stufen
 */
export function spentOn(kind: TowerKind, tiers: Tiers): number {
  let sum = 0;

  for (const step of ownedOf(kind, tiers)) {
    sum += step.cost;
  }

  return sum;
}

/**
 * Was ein Turm beim Verkauf einbringt - samt allem, was in ihm steckt.
 *
 * @param kind - welcher Turm
 * @param tiers - wie weit er ist
 * @returns der Betrag, abgerundet
 * @remarks
 * Vier Fünftel von allem, auch von den Verbesserungen. Wer einen ausgebauten
 * Turm an der falschen Stelle stehen hat, soll ihn versetzen können, ohne
 * dabei eine halbe Runde zu verlieren.
 */
export function refundOfTower(kind: TowerKind, tiers: Tiers): number {
  return Math.floor((TOWERS[kind].cost + spentOn(kind, tiers)) * REFUND);
}

/** Wie viel ein Verkauf zurückbringt. */
const REFUND = 0.8;

/**
 * Die Werte eines Turms, wie er jetzt dasteht.
 *
 * @param kind - welcher Turm
 * @param tiers - wie weit er ausgebaut ist
 * @returns seine Zahlen samt allem, was gekauft wurde
 * @remarks
 * Die Engine fragt nie {@link TOWERS} direkt, sondern immer hier - sonst
 * schießt ein ausgebauter Turm mit den Werten vom Tag seines Baus.
 */
export function statsOf(kind: TowerKind, tiers: Tiers): Monkey {
  let made = TOWERS[kind];

  for (const step of ownedOf(kind, tiers)) {
    made = {
      ...made,
      pierce: made.pierce + (step.pierce ?? 0),
      damage: made.damage + (step.damage ?? 0),
      slow: made.slow + (step.slow ?? 0),
      reload: made.reload * (step.reload ?? 1),
      range: made.range * (step.range ?? 1),
      blast: made.blast === null ? null : made.blast * (step.blast ?? 1),
      slowTo: made.slowTo * (step.slowTo ?? 1),
      afterTo: made.afterTo * (step.afterTo ?? 1),
      speed: made.speed * (step.speed ?? 1),
      soak: made.soak || (step.soak ?? false),
      cold: made.cold || (step.cold ?? false),
      bite: step.bite ?? made.bite,
    };
  }

  return made;
}

/** Alle Stufen, die ein Turm schon hat - erst die eine Säule, dann die andere. */
function ownedOf(kind: TowerKind, tiers: Tiers): readonly Upgrade[] {
  return [
    ...UPGRADES[kind].one.slice(0, tiers.one),
    ...UPGRADES[kind].two.slice(0, tiers.two),
  ];
}
