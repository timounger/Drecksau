/**
 * Der Zustand einer Partie - alles, was eine Runde ausmacht.
 *
 * @module
 * @remarks
 * Ein einziges Objekt, aus dem sich das ganze Bild zeichnen lässt, und
 * niemand außer {@link ./engine step} verändert es. Damit ist eine Partie
 * jederzeit erklärbar: Was auf dem Feld passiert, steht hier und nirgends
 * sonst.
 */
import type { BloonKind, Harm } from "@/games/bloons-td/engine/bloons";
import type { TowerKind } from "@/games/bloons-td/engine/towers";
import type { Tiers } from "@/games/bloons-td/engine/upgrades";

/** Wie eine Partie gerade steht. */
export type Phase =
  /** Zwischen zwei Runden: bauen, verkaufen, losschicken. */
  | "ready"
  /** Eine Welle läuft. */
  | "running"
  /** Die Leben sind alle. */
  | "over";

/** Ein Ballon auf dem Weg. */
export type Bloon = {
  readonly id: number;
  readonly kind: BloonKind;
  /** Wie weit er schon ist, in Bildpunkten entlang des Weges. */
  readonly gone: number;
  /** Was seine eigene Hülle noch aushält. */
  readonly hull: number;
  /** Bis wann er gebremst ist, auf der Uhr der Partie - und wie stark. */
  readonly slowed: number;
  readonly slowTo: number;
  /**
   * Und bis wann er danach noch zäh läuft, auf welchen Anteil.
   *
   * @remarks
   * Das ist der Permafrost: Nach dem Auftauen bleibt der Ballon langsam. Zwei
   * Uhren statt einer, weil beides gleichzeitig gilt - erst steht er, dann
   * schleicht er.
   */
  readonly thawed: number;
  readonly thawTo: number;
  /**
   * Ob das, was ihn bremst, bis in die Ballons darin durchzieht.
   *
   * @remarks
   * Ohne das verliert ein Ballon seinen Klebstoff, sobald seine Hülle platzt -
   * das Innere kommt frisch heraus. Genau das kauft man beim Klebstoffschützen
   * mit "Glue Soak".
   */
  readonly soak: boolean;
  /** Wann ihm der ätzende Klebstoff die nächste Schicht nimmt, oder 0. */
  readonly bite: number;
};

/** Ein Geschoss. */
export type Shot = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly from: TowerKind;
  /** Von welchem Turm - damit sein Konto stimmt. */
  readonly by: number;
  readonly harm: Harm;
  readonly damage: number;
  /** Wie viele Ballons es noch trifft, bevor es weg ist. */
  readonly pierce: number;
  readonly age: number;
  readonly life: number;
  /** Wie weit sein Knall reicht, oder null für ein Geschoss ohne Knall. */
  readonly blast: number | null;
  /** Wie lange es bremst und auf welchen Anteil. */
  readonly slow: number;
  readonly slowTo: number;
  /** Ob sein Belag in die Ballons darin durchzieht. */
  readonly soak: boolean;
  /** Alle wie viel Sekunden sein Belag eine Schicht frisst, oder 0. */
  readonly bite: number;
  /** Wohin es zurückkommt, oder null - der Bumerang. */
  readonly back: { readonly x: number; readonly y: number } | null;
  /** Wen es schon erwischt hat, damit es niemanden zweimal trifft. */
  readonly hit: readonly number[];
};

/** Ein Turm auf der Wiese. */
export type Tower = {
  readonly id: number;
  readonly kind: TowerKind;
  readonly col: number;
  readonly row: number;
  /** Wie lange es noch dauert, bis er wieder schießt. */
  readonly loaded: number;
  /** Wohin er zuletzt geschossen hat, in Bogenmaß. */
  readonly aim: number;
  /**
   * Und wohin er gerade zeigt - das ist nicht dasselbe.
   *
   * @remarks
   * Ein Rohr dreht sich nicht in einem Bild von links nach rechts, es
   * schwenkt. `aim` ist die Richtung, in die geschossen wurde, `faced` die,
   * in die das Rohr gerade steht; gezeichnet wird `faced`, geschossen entlang
   * `aim`. Ein Turm, der beim Zielwechsel springt, sieht aus wie ein Fehler,
   * auch wenn er trifft.
   */
  readonly faced: number;
  /**
   * Wie frisch der letzte Schuss ist: 1 im Augenblick des Schusses, dann
   * fallend bis 0.
   *
   * @remarks
   * Daraus macht der Bildschirm den Rückstoß und das Mündungsfeuer. Es steht
   * hier und nicht dort, weil der Bildschirm nichts merken darf: Er zeichnet
   * den Zustand, er erfindet ihn nicht.
   */
  readonly kick: number;
  /** Wie weit er auf seinen beiden Säulen ausgebaut ist. */
  readonly tiers: Tiers;
  /**
   * Wie viele Schichten er schon zerstochen hat.
   *
   * @remarks
   * Gezählt wird, was durch *seinen* Treffer geplatzt ist - auch über den
   * Umweg eines Knalls. Zwei gleiche Affen an verschiedenen Ecken der Karte
   * sehen gleich aus; hieran sieht man, welcher von beiden sein Geld wert ist.
   */
  readonly pops: number;
};

/**
 * Was für ein Knall das war.
 *
 * @remarks
 * Drei Dinge sehen verschieden aus, weil sie verschiedene Dinge sind: ein
 * geplatzter Ballon, der Knall einer Bombe und die Frostwelle des Eisaffen.
 * Alle drei als derselbe Ring wären drei Ereignisse, die man nicht
 * auseinanderhält.
 */
export type BurstLook = "pop" | "blast" | "frost";

/** Ein geplatzter Ballon oder ein Knall, solange man ihn noch sieht. */
export type Burst = {
  readonly look: BurstLook;
  readonly x: number;
  readonly y: number;
  readonly reach: number;
  readonly age: number;
  readonly paint: string;
};

/** Ein Ballon, der noch auf seinen Auftritt wartet. */
export type Waiting = {
  readonly kind: BloonKind;
  /** Wann er loslaufen soll, auf der Uhr der Runde. */
  readonly at: number;
};

/** Eine ganze Partie. */
export type Game = {
  readonly phase: Phase;
  /** Die wievielte Runde gerade läuft oder als Nächstes kommt. */
  readonly round: number;
  readonly money: number;
  readonly lives: number;
  readonly towers: readonly Tower[];
  readonly bloons: readonly Bloon[];
  readonly shots: readonly Shot[];
  readonly bursts: readonly Burst[];
  readonly waiting: readonly Waiting[];
  /** Wie lange die laufende Runde schon geht, in Sekunden. */
  readonly clock: number;
  /** Wie viele Schichten in dieser Partie schon zerstochen wurden. */
  readonly popped: number;
  /** Und wie viele Ballons durchgekommen sind. */
  readonly leaked: number;
  readonly nextId: number;
};

/** Womit eine Partie anfängt. */
export const START = {
  /** Geld für zwei Türme und ein bisschen Mut. */
  money: 650,
  /** Und so viele Leben - jeder durchgekommene Treffer kostet eines. */
  lives: 150,
} as const;
