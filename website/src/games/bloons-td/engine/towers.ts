/**
 * Die Affen: was sie kosten, wie weit sie reichen und womit sie schießen.
 *
 * @module
 * @remarks
 * **Nur die Primär-Affen**, die sechs vom Anfang. Militär, Magie und
 * Unterstützung stehen im Vorbild daneben und kommen später; was hier steht,
 * reicht für die Entscheidung, um die es in diesem Spiel geht: Jeder von ihnen
 * kann etwas, das ein anderer nicht kann, und keiner kann alles.
 *
 * Die Schadensart ist dabei wichtiger als der Schaden. Ein Feld voller
 * Wurfpfeilaffen steht vor dem ersten Bleiballon still, und ein Feld voller
 * Bombenwerfer vor dem ersten schwarzen - siehe {@link ./bloons}.
 */
import type { Harm } from "@/games/bloons-td/engine/bloons";
import { CELL } from "@/games/bloons-td/engine/map";

/** Die sechs, die es gibt. */
export type TowerKind = "dart" | "boomerang" | "tack" | "bomb" | "ice" | "glue";

/** Wie ein Turm schießt. */
export type Shooting =
  /** Ein Geschoss auf das vorderste Ziel in Reichweite. */
  | "single"
  /** Ein Ring aus Geschossen in alle Richtungen. */
  | "ring"
  /** Kein Geschoss: alles in Reichweite bekommt sofort etwas ab. */
  | "pulse";

/**
 * Auf wen ein Turm zielt.
 *
 * @remarks
 * Der Klebstoffschütze ist der Einzige, der nicht einfach auf den Vordersten
 * schießt: Ein zweiter Klecks auf denselben Ballon verlängert nichts, er
 * ersetzt nur die Uhr, die ohnehin läuft. Er sucht sich deshalb den
 * vordersten, an dem noch nichts klebt - und schweigt, wenn alle kleben.
 */
export type Picking =
  /** Der vorderste Ballon in Reichweite. */
  | "front"
  /** Der vorderste, der gerade nicht gebremst ist. */
  | "fresh";

/** Alles, was einen Affen ausmacht. */
export type Monkey = {
  readonly name: string;
  readonly cost: number;
  /** Wie weit er reicht, in Bildpunkten. */
  readonly range: number;
  /** Wie lange er zwischen zwei Schüssen braucht, in Sekunden. */
  readonly reload: number;
  /**
   * Wie viel ein Treffer abzieht.
   *
   * @remarks
   * **Null ist erlaubt und bei zweien der Sechs der Normalfall.** Der Eisaffe
   * hält auf, der Klebstoffschütze bremst; zerstören können beide erst, wenn
   * man es ihnen kauft (Deep Freeze, Corrosive Glue). Ein Turm, der ohnehin
   * Schaden macht, bräuchte diese Verbesserungen nicht.
   */
  readonly damage: number;
  /**
   * Wie viele Ballons ein Geschoss hintereinander trifft.
   *
   * @remarks
   * Dieselbe Zahl heißt bei drei Türmen drei Dinge, weil es dreimal dieselbe
   * Frage ist - **wie viele Ballons erfasst eine Wirkung?** Beim Eisaffen,
   * der nichts wirft, sind es die vordersten so viele, die er einfriert; beim
   * Bombenwerfer die, die sein Knall erwischt; bei allen anderen die, durch
   * die ein Geschoss hindurchgeht. Ohne Grenze wäre der Frost bei vierzig
   * Ballons auf dem Bild kein Turm mehr, sondern ein Schalter.
   */
  readonly pierce: number;
  /** Was für ein Schaden das ist. */
  readonly harm: Harm;
  readonly shooting: Shooting;
  /** Auf wen er zielt. */
  readonly picks: Picking;
  /** Wie schnell das Geschoss fliegt und wie lange es lebt. */
  readonly speed: number;
  readonly life: number;
  /** Wie viele Geschosse ein Ring hat. */
  readonly spokes: number;
  /** Wie weit ein Knall um den Einschlag herum reicht, oder null. */
  readonly blast: number | null;
  /** Wie lange ein Treffer bremst, in Sekunden - und auf welchen Anteil. */
  readonly slow: number;
  readonly slowTo: number;
  /**
   * Auf welchen Anteil ein Ballon fällt, nachdem die Bremse abgelaufen ist.
   *
   * @remarks
   * Eins heißt: Danach läuft er wieder normal. Alles darunter ist Permafrost,
   * und der hält so lange an, wie der Frost selbst gedauert hat.
   */
  readonly afterTo: number;
  /** Ob seine Wirkung in die Ballons darin durchzieht. */
  readonly soak: boolean;
  /** Ob er auch trifft, was gegen seine Schadensart immun ist. */
  readonly cold: boolean;
  /** Alle wie viel Sekunden sein Belag eine Schicht frisst, oder 0. */
  readonly bite: number;
  /** Seine Farbe auf dem Feld. */
  readonly paint: string;
  /** Ein Satz, der sagt, wofür man ihn baut. */
  readonly note: string;
};

/**
 * Wie weit ein Affe reicht, in Feldbreiten.
 *
 * @remarks
 * In Feldern gedacht und nicht in Pixeln: Auf dieser Karte liegt die Straße
 * im Abstand von Feldern, und eine Reichweite von "zweieinhalb Feldern" sagt
 * sofort, welche Abschnitte ein Turm erwischt.
 */
const REACH = { ring: 1.6, frost: 1.8, dart: 2.5, arc: 2.6, lob: 3.2 } as const;

/** Und wie weit der Knall einer Bombe reicht, ebenfalls in Feldbreiten. */
const BLAST = 0.8;

/**
 * Die sechs Primär-Affen.
 *
 * @remarks
 * Preise und Verhältnisse sind die des Vorbilds, die Reichweiten in
 * Feldbreiten gedacht: Der Wurfpfeilaffe deckt zweieinhalb Felder ab, der
 * Reißnagelwerfer kaum anderthalb - dafür in alle Richtungen auf einmal. Wer
 * eine Zahl ändert, ändert damit, wo auf der Karte ein Turm Sinn ergibt.
 */
export const TOWERS: Readonly<Record<TowerKind, Monkey>> = {
  dart: {
    name: "Wurfpfeilaffe",
    cost: 200,
    range: CELL * REACH.dart,
    reload: 0.95,
    damage: 1,
    pierce: 2,
    harm: "sharp",
    shooting: "single",
    picks: "front",
    speed: 430,
    life: 1.2,
    spokes: 1,
    blast: null,
    slow: 0,
    slowTo: 1,
    afterTo: 1,
    soak: false,
    cold: false,
    bite: 0,
    paint: "#c88a3f",
    note: "Billig, schnell, trifft alles Weiche. Am Blei prallt er ab.",
  },
  boomerang: {
    name: "Bumerangaffe",
    cost: 325,
    range: CELL * REACH.arc,
    reload: 1.3,
    damage: 1,
    pierce: 4,
    harm: "sharp",
    shooting: "single",
    picks: "front",
    speed: 260,
    life: 2.4,
    spokes: 1,
    blast: null,
    slow: 0,
    slowTo: 1,
    afterTo: 1,
    soak: false,
    cold: false,
    bite: 0,
    paint: "#8f6b2f",
    note: "Sein Wurf kommt zurück und trifft dabei ein zweites Mal. An Kurven unbezahlbar.",
  },
  tack: {
    name: "Reißnagelwerfer",
    cost: 280,
    range: CELL * REACH.ring,
    reload: 1.4,
    damage: 1,
    pierce: 1,
    harm: "sharp",
    shooting: "ring",
    picks: "front",
    speed: 300,
    life: 0.45,
    spokes: 8,
    blast: null,
    slow: 0,
    slowTo: 1,
    afterTo: 1,
    soak: false,
    cold: false,
    bite: 0,
    paint: "#9aa3b2",
    note: "Acht Nägel in alle Richtungen. Nur direkt an der Straße etwas wert.",
  },
  bomb: {
    name: "Bombenwerfer",
    cost: 525,
    range: CELL * REACH.lob,
    reload: 1.6,
    damage: 1,
    pierce: 14,
    harm: "explosion",
    shooting: "single",
    picks: "front",
    speed: 300,
    life: 2,
    spokes: 1,
    blast: CELL * BLAST,
    slow: 0,
    slowTo: 1,
    afterTo: 1,
    soak: false,
    cold: false,
    bite: 0,
    paint: "#4b5563",
    note: "Der Einzige, der Blei knackt - und der Einzige, dem Schwarz nichts abnimmt.",
  },
  ice: {
    name: "Eisaffe",
    cost: 325,
    range: CELL * REACH.frost,
    reload: 2.2,
    damage: 0,
    pierce: 8,
    harm: "ice",
    shooting: "pulse",
    picks: "front",
    speed: 0,
    life: 0.35,
    spokes: 1,
    blast: null,
    slow: 1,
    slowTo: 0,
    afterTo: 1,
    soak: false,
    cold: false,
    bite: 0,
    paint: "#7dd3fc",
    note: "Friert die vordersten acht um sich herum eine Sekunde lang fest. Zerstört selbst nichts - dafür braucht er Deep Freeze.",
  },
  glue: {
    name: "Klebstoffschütze",
    cost: 270,
    range: CELL * REACH.arc,
    reload: 1.5,
    damage: 0,
    pierce: 1,
    harm: "glue",
    shooting: "single",
    picks: "fresh",
    speed: 340,
    life: 1.4,
    spokes: 1,
    blast: null,
    slow: 3,
    slowTo: 0.5,
    afterTo: 1,
    soak: false,
    cold: false,
    bite: 0,
    paint: "#facc15",
    note: "Drei Sekunden halb so schnell. Er tötet nichts, er verschafft Zeit - außer mit Corrosive Glue.",
  },
};

/** In welcher Reihenfolge sie im Laden stehen. */
export const TOWER_ORDER: readonly TowerKind[] = [
  "dart",
  "boomerang",
  "tack",
  "bomb",
  "ice",
  "glue",
];
