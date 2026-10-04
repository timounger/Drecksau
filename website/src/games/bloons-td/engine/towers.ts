/**
 * Die Affen: was sie kosten, wie weit sie reichen und womit sie schießen.
 *
 * @module
 * @remarks
 * **Vier Gruppen wie im Vorbild**: Primär, Militär, Magie und Unterstützung.
 * Jeder von ihnen kann etwas, das ein anderer nicht kann, und keiner kann
 * alles - die Primär-Affen schießen, das Militär reicht weit oder fliegt, die
 * Magie trifft, was andere nicht treffen, und die Unterstützung schießt kaum
 * und macht dafür die anderen besser oder bringt Geld.
 *
 * Die Schadensart ist dabei wichtiger als der Schaden. Ein Feld voller
 * Wurfpfeilaffen steht vor dem ersten Bleiballon still, und ein Feld voller
 * Bombenwerfer vor dem ersten schwarzen - siehe {@link ./bloons}.
 */
import type { Harm } from "@/games/bloons-td/engine/bloons";
import { CELL } from "@/games/bloons-td/engine/map";

/** Alle, die es gibt. */
export type TowerKind =
  | "dart"
  | "boomerang"
  | "tack"
  | "bomb"
  | "ice"
  | "glue"
  | "sniper"
  | "sub"
  | "dartling"
  | "heli"
  | "mortar"
  | "ace"
  | "boat"
  | "wizard"
  | "super"
  | "ninja"
  | "alchemist"
  | "druid"
  | "farm"
  | "village"
  | "spikeFactory"
  | "engineer"
  | "spiker";

/** Die vier Gruppen im Laden. */
export type Group = "primary" | "military" | "magic" | "support";

/** Wie ein Turm schießt. */
export type Shooting =
  /** Geschosse auf das vorderste Ziel in Reichweite - eines oder ein Fächer. */
  | "single"
  /** Ein Ring aus Geschossen in alle Richtungen. */
  | "ring"
  /** Kein Geschoss: alles in Reichweite bekommt sofort etwas ab. */
  | "pulse"
  /** Kein Geschoss: Der Treffer sitzt im selben Augenblick. */
  | "snipe"
  /** Eine Granate im Bogen, die dort hochgeht, wo sie landet. */
  | "lob"
  /** Ein Nagelhaufen, der auf der Straße liegen bleibt. */
  | "drop"
  /** Eine Kugel, die die Straße entlang den Ballons entgegenrollt. */
  | "roll"
  /** Gar nicht - der Turm tut etwas anderes. */
  | "none";

/** Ob und wie ein Turm sich bewegt. */
export type Moves =
  /** Er bleibt auf seinem Feld. */
  | "stay"
  /** Er fliegt dem vordersten Ballon in Reichweite hinterher. */
  | "hover"
  /** Er kreist um sein Feld. */
  | "orbit";

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
  readonly group: Group;
  readonly cost: number;
  /** Wie weit er reicht, in Bildpunkten. */
  readonly range: number;
  /** Wie lange er zwischen zwei Schüssen braucht, in Sekunden. */
  readonly reload: number;
  /**
   * Wie viel ein Treffer abzieht.
   *
   * @remarks
   * **Null ist erlaubt.** Der Eisaffe hält auf, der Klebstoffschütze bremst;
   * zerstören können beide erst, wenn man es ihnen kauft (Deep Freeze,
   * Corrosive Glue). Ein Turm, der ohnehin Schaden macht, bräuchte diese
   * Verbesserungen nicht.
   */
  readonly damage: number;
  /**
   * Wie viele Ballons ein Geschoss hintereinander trifft.
   *
   * @remarks
   * Dieselbe Zahl heißt bei mehreren Türmen verschiedene Dinge, weil es immer
   * dieselbe Frage ist - **wie viele Ballons erfasst eine Wirkung?** Beim
   * Eisaffen, der nichts wirft, sind es die vordersten so viele, die er
   * einfriert; bei allem, was knallt, die, die der Knall erwischt; beim
   * Nagelhaufen, wie viele darüberlaufen dürfen; bei allen anderen die, durch
   * die ein Geschoss hindurchgeht.
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
  /** Wie viele Geschosse ein Ring oder ein Fächer hat. */
  readonly spokes: number;
  /** Wie weit zwei Geschosse eines Fächers auseinanderliegen, in Bogenmaß. */
  readonly fan: number;
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
  /** Ob er auf Wasser steht statt auf der Wiese. */
  readonly water: boolean;
  /** Ob und wie er sich bewegt - und wie schnell, in Bildpunkten je Sekunde. */
  readonly moves: Moves;
  readonly fly: number;
  /** Ob er auch schießt, wenn kein Ballon in Reichweite ist. */
  readonly always: boolean;
  /** Ob seine Geschosse sich selbst ein Ziel suchen. */
  readonly seek: boolean;
  /**
   * Ob er getarnte Ballons sieht.
   *
   * @remarks
   * Wer sie nicht sieht, zielt nicht auf sie - trifft sie aber trotzdem, wenn
   * sein Geschoss zufällig durch sie hindurchfliegt oder sein Knall sie
   * erwischt. Wie im Vorbild.
   */
  readonly sees: boolean;
  /** Wie weit ein Treffer den Ballon zurückwirft, in Bildpunkten. */
  readonly push: number;
  /** Wie lange sein Trank einen Nachbarn antreibt, in Sekunden, oder 0. */
  readonly brew: number;
  /** Was er am Ende jeder Runde einbringt. */
  readonly income: number;
  /**
   * Was er den Türmen in seiner Reichweite gibt.
   *
   * @remarks
   * Reichweite und Nachladen als Faktor (eins heißt: nichts), ob sie damit
   * getarnte Ballons sehen und ob sie alles treffen, was ihnen sonst trotzt.
   */
  readonly auraRange: number;
  readonly auraReload: number;
  readonly auraSees: boolean;
  readonly auraAny: boolean;
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
 * sofort, welche Abschnitte ein Turm erwischt. `map` deckt die ganze Karte ab.
 */
const REACH = {
  ring: 1.6,
  frost: 1.8,
  short: 2.2,
  near: 2.4,
  dart: 2.5,
  arc: 2.6,
  long: 2.8,
  far: 3.2,
  lob: 3.2,
  wide: 4,
  map: 20,
} as const;

/** Wie weit ein Knall reicht, ebenfalls in Feldbreiten. */
const BLAST = { bomb: 0.8, shell: 0.75, potion: 0.5 } as const;

/**
 * Was jeder Affe hat, solange in seiner Zeile nichts anderes steht.
 *
 * @remarks
 * Ein Affe, der auf der Wiese steht, auf den Vordersten zielt, ein Geschoss
 * wirft und sonst nichts Besonderes kann. Jede Zeile in {@link TOWERS} sagt
 * nur, worin sie davon abweicht.
 */
const PLAIN = {
  picks: "front",
  spokes: 1,
  fan: 0,
  blast: null,
  slow: 0,
  slowTo: 1,
  afterTo: 1,
  soak: false,
  cold: false,
  bite: 0,
  water: false,
  moves: "stay",
  fly: 0,
  always: false,
  seek: false,
  sees: false,
  push: 0,
  brew: 0,
  income: 0,
  auraRange: 1,
  auraReload: 1,
  auraSees: false,
  auraAny: false,
} as const;

/**
 * Alle Affen.
 *
 * @remarks
 * Preise und Verhältnisse sind die des Vorbilds, die Reichweiten in
 * Feldbreiten gedacht: Der Wurfpfeilaffe deckt zweieinhalb Felder ab, der
 * Reißnagelwerfer kaum anderthalb - dafür in alle Richtungen auf einmal. Wer
 * eine Zahl ändert, ändert damit, wo auf der Karte ein Turm Sinn ergibt.
 */
export const TOWERS: Readonly<Record<TowerKind, Monkey>> = {
  dart: {
    ...PLAIN,
    name: "Wurfpfeilaffe",
    group: "primary",
    cost: 200,
    range: CELL * REACH.dart,
    reload: 0.95,
    damage: 1,
    pierce: 2,
    harm: "sharp",
    shooting: "single",
    speed: 430,
    life: 1.2,
    paint: "#c88a3f",
    note: "Billig, schnell, trifft alles Weiche. Am Blei prallt er ab.",
  },
  boomerang: {
    ...PLAIN,
    name: "Bumerangaffe",
    group: "primary",
    cost: 325,
    range: CELL * REACH.arc,
    reload: 1.3,
    damage: 1,
    pierce: 4,
    harm: "sharp",
    shooting: "single",
    speed: 260,
    life: 2.4,
    paint: "#8f6b2f",
    note: "Sein Wurf kommt zurück und trifft dabei ein zweites Mal. An Kurven unbezahlbar.",
  },
  tack: {
    ...PLAIN,
    name: "Reißnagelwerfer",
    group: "primary",
    cost: 280,
    range: CELL * REACH.ring,
    reload: 1.4,
    damage: 1,
    pierce: 1,
    harm: "sharp",
    shooting: "ring",
    speed: 300,
    life: 0.45,
    spokes: 8,
    paint: "#9aa3b2",
    note: "Acht Nägel in alle Richtungen. Nur direkt an der Straße etwas wert.",
  },
  bomb: {
    ...PLAIN,
    name: "Bombenwerfer",
    group: "primary",
    cost: 525,
    range: CELL * REACH.lob,
    reload: 1.6,
    damage: 1,
    pierce: 14,
    harm: "explosion",
    shooting: "single",
    speed: 300,
    life: 2,
    blast: CELL * BLAST.bomb,
    paint: "#4b5563",
    note: "Knackt Blei - und ist der Einzige, dem Schwarz nichts abnimmt.",
  },
  ice: {
    ...PLAIN,
    name: "Eisaffe",
    group: "primary",
    cost: 325,
    range: CELL * REACH.frost,
    reload: 2.2,
    damage: 0,
    pierce: 8,
    harm: "ice",
    shooting: "pulse",
    speed: 0,
    life: 0.35,
    slow: 1,
    slowTo: 0,
    paint: "#7dd3fc",
    note: "Friert die vordersten acht um sich herum eine Sekunde lang fest. Zerstört selbst nichts - dafür braucht er Deep Freeze.",
  },
  glue: {
    ...PLAIN,
    name: "Klebstoffschütze",
    group: "primary",
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
    slow: 3,
    slowTo: 0.5,
    paint: "#facc15",
    note: "Drei Sekunden halb so schnell. Er tötet nichts, er verschafft Zeit - außer mit Corrosive Glue.",
  },
  sniper: {
    ...PLAIN,
    name: "Scharfschützenaffe",
    group: "military",
    cost: 350,
    range: CELL * REACH.map,
    reload: 1.6,
    damage: 2,
    pierce: 1,
    harm: "sharp",
    shooting: "snipe",
    speed: 0,
    life: 0,
    paint: "#4d7c3a",
    note: "Trifft den Vordersten auf der ganzen Karte, sofort und mit zwei Schichten. Langsam - und am Blei machtlos, bis zum Stahlmantel.",
  },
  sub: {
    ...PLAIN,
    name: "Affen-U-Boot",
    group: "military",
    cost: 325,
    range: CELL * REACH.near,
    reload: 0.75,
    damage: 1,
    pierce: 2,
    harm: "sharp",
    shooting: "single",
    speed: 450,
    life: 1,
    water: true,
    paint: "#facc15",
    note: "Nur im Teich. Schießt schnell Pfeile auf beide Straßen, die am Wasser vorbeiführen.",
  },
  dartling: {
    ...PLAIN,
    name: "Pfeilschussschütze",
    group: "military",
    cost: 850,
    range: CELL * REACH.wide,
    reload: 0.2,
    damage: 1,
    pierce: 1,
    harm: "sharp",
    shooting: "single",
    speed: 620,
    life: 0.9,
    paint: "#7c8a5a",
    note: "Ein Pfeilhagel: fünf Schuss je Sekunde, vier Felder weit. Jeder einzelne ist schwach.",
  },
  heli: {
    ...PLAIN,
    name: "Hubschrauberpilot",
    group: "military",
    cost: 800,
    range: CELL * REACH.far,
    reload: 0.55,
    damage: 1,
    pierce: 3,
    harm: "sharp",
    shooting: "single",
    speed: 480,
    life: 0.5,
    spokes: 2,
    fan: 0.14,
    moves: "hover",
    fly: 150,
    paint: "#4f7f3a",
    note: "Fliegt dem vordersten Ballon hinterher und feuert zwei Pfeile auf einmal. Bleibt in der Nähe seines Landeplatzes.",
  },
  mortar: {
    ...PLAIN,
    name: "Mörseraffe",
    group: "military",
    cost: 625,
    range: CELL * REACH.map,
    reload: 2,
    damage: 1,
    pierce: 14,
    harm: "explosion",
    shooting: "lob",
    speed: 0,
    life: 1,
    blast: CELL * BLAST.shell,
    paint: "#5b6b4a",
    note: "Granaten im hohen Bogen, überall auf der Karte. Der Knall kommt eine Sekunde nach dem Abschuss - wer schnell ist, ist dann schon weiter.",
  },
  ace: {
    ...PLAIN,
    name: "Flugzeug",
    group: "military",
    cost: 800,
    range: CELL * REACH.far,
    reload: 1.2,
    damage: 1,
    pierce: 4,
    harm: "sharp",
    shooting: "ring",
    speed: 420,
    life: 0.55,
    spokes: 8,
    moves: "orbit",
    fly: 170,
    always: true,
    paint: "#b91c1c",
    note: "Kreist um sein Feld und wirft dabei ununterbrochen acht Pfeile in alle Richtungen - ob jemand da ist oder nicht.",
  },
  boat: {
    ...PLAIN,
    name: "Boot",
    group: "military",
    cost: 500,
    range: CELL * REACH.long,
    reload: 0.9,
    damage: 1,
    pierce: 3,
    harm: "sharp",
    shooting: "single",
    speed: 450,
    life: 1,
    spokes: 2,
    fan: 0.2,
    water: true,
    paint: "#8a5a2b",
    note: "Nur im Teich. Zwei Pfeile im Fächer, weiter als das U-Boot - und mit Hot Shot auch gegen Blei.",
  },
  wizard: {
    ...PLAIN,
    name: "Zauberer-Affe",
    group: "magic",
    cost: 400,
    range: CELL * REACH.arc,
    reload: 1.1,
    damage: 1,
    pierce: 3,
    harm: "energy",
    shooting: "single",
    speed: 380,
    life: 1.2,
    paint: "#7c3aed",
    note: "Magie sticht auch Blei auf. Nur der lila Ballon lacht darüber.",
  },
  super: {
    ...PLAIN,
    name: "Super-Affe",
    group: "magic",
    cost: 2500,
    range: CELL * REACH.lob,
    reload: 0.07,
    damage: 1,
    pierce: 1,
    harm: "sharp",
    shooting: "single",
    speed: 700,
    life: 0.7,
    paint: "#2563eb",
    note: "Vierzehn Pfeile je Sekunde. Teuer, und jeden Dollar wert - nur nicht gegen Blei, bis zum Laser.",
  },
  ninja: {
    ...PLAIN,
    name: "Ninja-Affe",
    group: "magic",
    cost: 500,
    range: CELL * REACH.arc,
    reload: 0.7,
    damage: 1,
    pierce: 2,
    harm: "sharp",
    shooting: "single",
    speed: 520,
    life: 1,
    sees: true,
    paint: "#b91c1c",
    note: "Schnelle Wurfsterne, die später ihr Ziel von selbst finden. Der Einzige, der von Anfang an getarnte Ballons sieht.",
  },
  alchemist: {
    ...PLAIN,
    name: "Alchemist",
    group: "magic",
    cost: 550,
    range: CELL * REACH.near,
    reload: 1.8,
    damage: 1,
    pierce: 8,
    harm: "normal",
    shooting: "single",
    speed: 320,
    life: 1.3,
    blast: CELL * BLAST.potion,
    paint: "#65a30d",
    note: "Säuretränke, gegen die keine Sorte gefeit ist. Mit Berserker Brew treibt er seine Nachbarn an.",
  },
  druid: {
    ...PLAIN,
    name: "Druide",
    group: "magic",
    cost: 400,
    range: CELL * REACH.short,
    reload: 1.1,
    damage: 1,
    pierce: 1,
    harm: "sharp",
    shooting: "single",
    speed: 380,
    life: 0.9,
    spokes: 5,
    fan: 0.16,
    paint: "#4d7c0f",
    note: "Fünf Dornen im Fächer. Als Druide des Sturms weht er Ballons ein Stück zurück.",
  },
  farm: {
    ...PLAIN,
    name: "Bananenplantage",
    group: "support",
    cost: 1250,
    range: CELL * REACH.ring,
    reload: 0,
    damage: 0,
    pierce: 0,
    harm: "sharp",
    shooting: "none",
    speed: 0,
    life: 0,
    income: 80,
    paint: "#facc15",
    note: "Schießt nicht. Bringt am Ende jeder Runde $80 - wer früh baut, hat später mehr.",
  },
  village: {
    ...PLAIN,
    name: "Affendorf",
    group: "support",
    cost: 1200,
    range: CELL * REACH.dart,
    reload: 0,
    damage: 0,
    pierce: 0,
    harm: "sharp",
    shooting: "none",
    speed: 0,
    life: 0,
    auraRange: 1.1,
    paint: "#a16207",
    note: "Schießt nicht. Alle Affen in seiner Reichweite reichen ein Zehntel weiter - und mit dem Ausbau noch viel mehr.",
  },
  spikeFactory: {
    ...PLAIN,
    name: "Nagelfabrik",
    group: "support",
    cost: 1000,
    range: CELL * REACH.short,
    reload: 1.9,
    damage: 1,
    pierce: 5,
    harm: "sharp",
    shooting: "drop",
    speed: 260,
    life: 25,
    always: true,
    paint: "#78716c",
    note: "Legt Nagelhaufen auf die Straße in ihrer Reichweite. Jeder Haufen sticht fünf Ballons, dann ist er weg.",
  },
  engineer: {
    ...PLAIN,
    name: "Affenpionier",
    group: "support",
    cost: 350,
    range: CELL * REACH.near,
    reload: 0.9,
    damage: 1,
    pierce: 3,
    harm: "sharp",
    shooting: "single",
    speed: 450,
    life: 1,
    paint: "#ea580c",
    note: "Eine Nagelpistole, billig und zuverlässig. Mit Pin nagelt er Ballons kurz fest.",
  },
  spiker: {
    ...PLAIN,
    name: "Stachelexperte",
    group: "support",
    cost: 600,
    range: CELL * REACH.short,
    reload: 3,
    damage: 1,
    pierce: 12,
    harm: "normal",
    shooting: "roll",
    speed: 70,
    life: 7,
    paint: "#57534e",
    note: "Rollt schwere Stachelkugeln die Straße hinunter, den Ballons entgegen. Zwölf Ballons je Kugel, auch Blei.",
  },
};

/** Die Gruppen in der Reihenfolge des Ladens, mit ihrem Namen. */
export const GROUPS: readonly {
  readonly group: Group;
  readonly name: string;
}[] = [
  { group: "primary", name: "Primär" },
  { group: "military", name: "Militär" },
  { group: "magic", name: "Magie" },
  { group: "support", name: "Unterstützung" },
];

/** In welcher Reihenfolge sie im Laden stehen. */
export const TOWER_ORDER: readonly TowerKind[] = [
  "dart",
  "boomerang",
  "tack",
  "bomb",
  "ice",
  "glue",
  "sniper",
  "sub",
  "dartling",
  "heli",
  "mortar",
  "ace",
  "boat",
  "wizard",
  "super",
  "ninja",
  "alchemist",
  "druid",
  "farm",
  "village",
  "spikeFactory",
  "engineer",
  "spiker",
];
