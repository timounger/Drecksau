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
 * **Bei den sechs Primär-Affen stehen Preise und Wirkungen so in der
 * Vorlage**, und zwar in der mittleren der vier Preisspalten - derselben, aus
 * der auch die Grundpreise der Türme kommen. Bei Militär, Magie und
 * Unterstützung tragen die Stufen die Namen des Vorbilds, die Zahlen sind aber
 * an zwei Stufen je Säule angepasst; das steht im README.
 */
import type { Harm } from "@/games/bloons-td/engine/bloons";
import { CELL } from "@/games/bloons-td/engine/map";
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
  readonly fly?: number;
  readonly auraReload?: number;
  /** Umgelegt: zieht durch, trifft Immune, frisst Schichten. */
  readonly soak?: boolean;
  readonly cold?: boolean;
  readonly bite?: number;
  /** Dazugezählt: Geschosse, Rückstoß, Sekunden Trank, Einnahmen, Durchschlag der Nachbarn. */
  readonly spokes?: number;
  readonly push?: number;
  readonly brew?: number;
  readonly income?: number;
  /** Gesetzt: Fächerwinkel, Schadensart, und ein Knall, wo vorher keiner war (in Feldbreiten). */
  readonly fan?: number;
  readonly harm?: Harm;
  readonly boom?: number;
  /** Umgelegt: Geschosse suchen ihr Ziel, er sieht Getarnte, Nachbarn sehen Getarnte, Nachbarn treffen alles. */
  readonly seek?: boolean;
  readonly sees?: boolean;
  readonly auraSees?: boolean;
  readonly auraAny?: boolean;
};

/**
 * Die Säulen, zwei je Turm.
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
        // **Die erste Antwort auf Tarnung**, wie im Vorbild: Der Wurfpfeilaffe
        // ist von Anfang an da, und ohne diese Stufe sieht bis Level 7
        // niemand die getarnten Ballons, die ab Runde 24 kommen.
        name: "Enhanced Eyesight",
        cost: 200,
        note: "Sieht getarnte Ballons, reicht ein Fünftel weiter und wirft noch etwas schneller.",
        reload: 0.9,
        range: 1.2,
        sees: true,
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
  sniper: {
    one: [
      {
        name: "Full Metal Jacket",
        cost: 350,
        note: "Stahlmantel: trifft jetzt auch Blei, und zwei Schichten mehr je Schuss.",
        harm: "normal",
        damage: 2,
      },
      {
        name: "Large Calibre",
        cost: 1200,
        note: "Noch drei Schichten mehr - sieben je Schuss.",
        damage: 3,
      },
    ],
    two: [
      {
        name: "Fast Firing",
        cost: 400,
        note: "Schießt ein Drittel schneller.",
        reload: 0.7,
      },
      {
        name: "Night Vision Goggles",
        cost: 400,
        note: "Sieht getarnte Ballons und schießt noch einmal ein Drittel schneller.",
        reload: 0.7,
        sees: true,
      },
    ],
  },
  sub: {
    one: [
      {
        name: "Barbed Darts",
        cost: 450,
        note: "Widerhaken: zwei Ballons mehr je Pfeil.",
        pierce: 2,
      },
      {
        name: "Heat-tipped Darts",
        cost: 450,
        note: "Glühende Spitzen schmelzen sich auch durch Blei.",
        harm: "normal",
      },
    ],
    two: [
      {
        name: "Twin Guns",
        cost: 450,
        note: "Zwei Rohre: schießt halb so oft noch einmal.",
        reload: 0.67,
      },
      {
        name: "Airburst Darts",
        cost: 1000,
        note: "Jeder Schuss zerplatzt in drei Pfeile.",
        spokes: 2,
        fan: 0.2,
      },
    ],
  },
  dartling: {
    one: [
      {
        name: "Focused Firing",
        cost: 250,
        note: "Reicht ein gutes Stück weiter.",
        range: 1.15,
      },
      {
        name: "Laser Shock",
        cost: 1100,
        note: "Laser statt Pfeile: trifft auch Blei, aber nicht Lila, und nimmt zwei Schichten.",
        harm: "energy",
        damage: 1,
      },
    ],
    two: [
      {
        name: "Faster Barrel Spin",
        cost: 950,
        note: "Die Trommel dreht schneller - fast halb so oft noch einmal.",
        reload: 0.7,
      },
      {
        name: "Hydra Rocket Pods",
        cost: 2500,
        note: "Kleine Raketen statt Pfeile: jede mit einem Knall, aber Schwarz trotzt ihnen.",
        harm: "explosion",
        boom: 0.45,
        pierce: 3,
      },
    ],
  },
  heli: {
    one: [
      {
        name: "Quad Darts",
        cost: 800,
        note: "Vier Pfeile auf einmal statt zwei.",
        spokes: 2,
      },
      {
        name: "Pursuit",
        cost: 500,
        note: "Fliegt schneller hinterher und weiter weg vom Landeplatz.",
        fly: 1.6,
        range: 1.15,
      },
    ],
    two: [
      {
        name: "Faster Darts",
        cost: 300,
        note: "Schießt ein Drittel schneller.",
        reload: 0.75,
      },
      {
        name: "Downdraft",
        cost: 1500,
        note: "Der Rotorwind: Jeder Treffer weht den Ballon ein Stück zurück.",
        push: 30,
      },
    ],
  },
  mortar: {
    one: [
      {
        name: "Bigger Blast",
        cost: 500,
        note: "Der Knall reicht weiter und erfasst sechs Ballons mehr.",
        blast: 1.4,
        pierce: 6,
      },
      {
        name: "Bloon Buster",
        cost: 650,
        note: "Jeder Knall nimmt zwei Schichten statt einer.",
        damage: 1,
      },
    ],
    two: [
      {
        name: "Faster Reload",
        cost: 300,
        note: "Lädt ein Drittel schneller nach.",
        reload: 0.75,
      },
      {
        name: "Shell Shock",
        cost: 900,
        note: "Wer im Knall steht, ist eine halbe Sekunde betäubt.",
        slow: 0.5,
        slowTo: 0,
      },
    ],
  },
  ace: {
    one: [
      {
        name: "Rapid Fire",
        cost: 650,
        note: "Wirft ein Drittel öfter.",
        reload: 0.7,
      },
      {
        name: "Sharper Darts",
        cost: 650,
        note: "Jeder Pfeil sticht vier Ballons mehr.",
        pierce: 4,
      },
    ],
    two: [
      {
        name: "Neva-Miss Targeting",
        cost: 900,
        note: "Die Pfeile suchen sich ihr Ziel selbst.",
        seek: true,
      },
      {
        name: "Fighter Plane",
        cost: 1500,
        note: "Zwölf Pfeile je Ring statt acht.",
        spokes: 4,
      },
    ],
  },
  boat: {
    one: [
      {
        name: "Grape Shot",
        cost: 550,
        note: "Ein Fächer aus fünf Kugeln statt zwei Pfeilen.",
        spokes: 3,
      },
      {
        name: "Hot Shot",
        cost: 500,
        note: "Glühende Kugeln - auch gegen Blei.",
        harm: "normal",
      },
    ],
    two: [
      {
        name: "Long Range",
        cost: 180,
        note: "Ein Fünftel mehr Reichweite.",
        range: 1.2,
      },
      {
        name: "Faster Shooting",
        cost: 300,
        note: "Schießt ein Drittel schneller.",
        reload: 0.75,
      },
    ],
  },
  wizard: {
    one: [
      {
        name: "Guided Magic",
        cost: 300,
        note: "Die Blitze suchen sich ihr Ziel selbst, er sieht weiter - und getarnte Ballons.",
        seek: true,
        range: 1.1,
        sees: true,
      },
      {
        name: "Arcane Blast",
        cost: 600,
        note: "Jeder Blitz nimmt zwei Schichten.",
        damage: 1,
      },
    ],
    two: [
      {
        name: "Fireball",
        cost: 300,
        note: "Feuerbälle statt Blitze: Jeder geht beim ersten Treffer mit einem Knall hoch.",
        boom: 0.55,
        pierce: 5,
      },
      {
        name: "Intense Magic",
        cost: 1300,
        note: "Zaubert ein Drittel schneller, und der Knall erfasst mehr.",
        reload: 0.7,
        pierce: 3,
      },
    ],
  },
  super: {
    one: [
      {
        name: "Laser Blasts",
        cost: 2500,
        note: "Laser statt Pfeile: auch gegen Blei, nur nicht gegen Lila, und ein Ballon mehr je Schuss.",
        harm: "energy",
        pierce: 1,
      },
      {
        name: "Plasma Blasts",
        cost: 4000,
        note: "Plasma: fast doppelt so schnell.",
        reload: 0.6,
        pierce: 1,
      },
    ],
    two: [
      {
        name: "Super Range",
        cost: 1000,
        note: "Ein Fünftel mehr Reichweite.",
        range: 1.2,
      },
      {
        name: "Epic Range",
        cost: 1200,
        note: "Noch ein Fünftel weiter, und die Schüsse fliegen schneller.",
        range: 1.2,
        speed: 1.2,
      },
    ],
  },
  ninja: {
    one: [
      {
        name: "Ninja Discipline",
        cost: 300,
        note: "Wirft schneller und sieht weiter.",
        range: 1.1,
        reload: 0.8,
      },
      {
        name: "Sharp Shurikens",
        cost: 350,
        note: "Jeder Stern sticht zwei Ballons mehr.",
        pierce: 2,
      },
    ],
    two: [
      {
        name: "Seeking Shuriken",
        cost: 250,
        note: "Die Sterne suchen sich ihr Ziel selbst.",
        seek: true,
      },
      {
        name: "Double Shot",
        cost: 850,
        note: "Zwei Sterne auf einmal.",
        spokes: 1,
        fan: 0.15,
      },
    ],
  },
  alchemist: {
    one: [
      {
        name: "Larger Potions",
        cost: 250,
        note: "Größere Flaschen: Der Spritzer reicht weiter und erfasst vier Ballons mehr.",
        blast: 1.3,
        pierce: 4,
      },
      {
        name: "Acid Bath",
        cost: 350,
        note: "Stärkere Säure: zwei Schichten je Treffer.",
        damage: 1,
      },
    ],
    two: [
      {
        name: "Berserker Brew",
        cost: 1200,
        note: "Bei jedem Wurf bekommt ein Nachbar acht Sekunden lang einen Trank: schneller, weiter, schärfer.",
        brew: 8,
      },
      {
        name: "Stronger Stimulant",
        cost: 1000,
        note: "Der Trank hält sechs Sekunden länger.",
        brew: 6,
      },
    ],
  },
  druid: {
    one: [
      {
        name: "Hard Thorns",
        cost: 250,
        note: "Harte Dornen: ein Ballon mehr je Dorn, auch Blei.",
        pierce: 1,
        harm: "normal",
      },
      {
        name: "Thorn Swarm",
        cost: 950,
        note: "Acht Dornen statt fünf.",
        spokes: 3,
      },
    ],
    two: [
      {
        name: "Druid of the Storm",
        cost: 900,
        note: "Sturm: Jeder Treffer weht den Ballon ein Stück zurück.",
        push: 30,
      },
      {
        name: "Heart of Thunder",
        cost: 1000,
        note: "Wirft fast doppelt so schnell.",
        reload: 0.6,
      },
    ],
  },
  farm: {
    one: [
      {
        name: "Increased Production",
        cost: 500,
        note: "Mehr Bananen: $40 mehr je Runde.",
        income: 40,
      },
      {
        name: "Greater Production",
        cost: 600,
        note: "Noch einmal $40 mehr je Runde.",
        income: 40,
      },
    ],
    two: [
      {
        name: "Valuable Bananas",
        cost: 250,
        note: "Wertvollere Bananen: $20 mehr je Runde.",
        income: 20,
      },
      {
        name: "Monkey Bank",
        cost: 1500,
        note: "Eine Bank mit Zinsen: $100 mehr je Runde.",
        income: 100,
      },
    ],
  },
  village: {
    one: [
      {
        name: "Bigger Radius",
        cost: 400,
        note: "Das Dorf reicht weiter und erfasst mehr Affen.",
        range: 1.4,
      },
      {
        name: "Jungle Drums",
        cost: 1500,
        note: "Trommeln: Alle Affen in Reichweite schießen 15 % schneller.",
        auraReload: 0.85,
      },
    ],
    two: [
      {
        name: "Radar Scanner",
        cost: 500,
        note: "Alle Affen in Reichweite sehen getarnte Ballons.",
        auraSees: true,
      },
      {
        name: "Monkey Intelligence Bureau",
        cost: 2000,
        note: "Der Geheimdienst: Alle Affen in Reichweite treffen jede Sorte, auch Blei, Schwarz und Lila.",
        auraAny: true,
      },
    ],
  },
  spikeFactory: {
    one: [
      {
        name: "Bigger Stacks",
        cost: 800,
        note: "Größere Haufen: zehn Ballons statt fünf.",
        pierce: 5,
      },
      {
        name: "White Hot Spikes",
        cost: 600,
        note: "Glühende Nägel - auch gegen Blei.",
        harm: "normal",
      },
    ],
    two: [
      {
        name: "Faster Production",
        cost: 600,
        note: "Ein Drittel mehr Haufen.",
        reload: 0.75,
      },
      {
        name: "Even Faster Production",
        cost: 800,
        note: "Noch ein Drittel mehr.",
        reload: 0.75,
      },
    ],
  },
  engineer: {
    one: [
      {
        name: "Larger Service Area",
        cost: 250,
        note: "Ein Fünftel mehr Reichweite.",
        range: 1.2,
      },
      {
        name: "Deconstruction",
        cost: 350,
        note: "Jeder Nagel nimmt zwei Schichten.",
        damage: 1,
      },
    ],
    two: [
      {
        name: "Oversize Nails",
        cost: 450,
        note: "Riesennägel: fünf Ballons mehr je Nagel, auch Blei.",
        pierce: 5,
        harm: "normal",
      },
      {
        name: "Pin",
        cost: 450,
        note: "Wer getroffen wird, ist eine Sekunde festgenagelt.",
        slow: 1,
        slowTo: 0,
      },
    ],
  },
  spiker: {
    one: [
      {
        name: "Heavier Balls",
        cost: 400,
        note: "Schwerere Kugeln: acht Ballons mehr je Kugel.",
        pierce: 8,
      },
      {
        name: "Spikier Balls",
        cost: 700,
        note: "Längere Stacheln: zwei Schichten je Treffer.",
        damage: 1,
      },
    ],
    two: [
      {
        name: "Faster Rolling",
        cost: 350,
        note: "Die Kugeln rollen halb so schnell noch einmal.",
        speed: 1.5,
      },
      {
        name: "Ball Factory",
        cost: 900,
        note: "Fast doppelt so viele Kugeln.",
        reload: 0.6,
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
      spokes: made.spokes + (step.spokes ?? 0),
      fan: Math.max(made.fan, step.fan ?? 0),
      harm: step.harm ?? made.harm,
      seek: made.seek || (step.seek ?? false),
      push: made.push + (step.push ?? 0),
      brew: made.brew + (step.brew ?? 0),
      income: made.income + (step.income ?? 0),
      fly: made.fly * (step.fly ?? 1),
      auraReload: made.auraReload * (step.auraReload ?? 1),
      sees: made.sees || (step.sees ?? false),
      auraSees: made.auraSees || (step.auraSees ?? false),
      auraAny: made.auraAny || (step.auraAny ?? false),
    };
    // Ein Knall, wo vorher keiner war: Feuerball, Raketen.
    if (made.blast === null && step.boom !== undefined) {
      made = { ...made, blast: CELL * step.boom };
    }
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
