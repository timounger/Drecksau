/**
 * Der Endlosmodus: wie seine Welt aussieht und was darin steht.
 *
 * @module
 * @remarks
 * **Das Gegenteil der Kampagne.** Dort ist das Fenster das Spiel: Es läuft
 * nach rechts, man kommt nicht dahinter zurück, und der Kurs ist vierzehn
 * Reihen tief. Hier gibt es kein Fenster. Die Karte ist groß, man schwimmt
 * frei darin herum, und nach unten geht es so weit, dass das Licht lange
 * vorher aufhört.
 *
 * Deshalb steht der Modus **neben** der Kampagne und nicht in ihr: Ein
 * Weltzustand, der beides kann, könnte am Ende keines von beidem richtig, und
 * die zehn Gewässer sind fertig.
 *
 * Eine Stufe ist eine Karte voller Gegner. Wer sie leerräumt, kommt eine Stufe
 * tiefer, und dort sind es mehr und zähere. Ein Ende ist nicht vorgesehen -
 * die Frage ist nur, wie weit man kommt.
 */
import { CELL, type Beast } from "@/games/uboot/engine/types";
import type { WeaponKind } from "@/games/uboot/engine/upgrades";

/** Wie breit die Karte ist, in Feldern. */
export const DEEP_COLS = 72;

/** Und wie tief - die Hälfte davon sieht man nur mit Sonar. */
export const DEEP_ROWS = 46;

/** Wie viele Reihen davon über Wasser liegen. */
export const SKY_ROWS = 2;

/** Wo die Wasseroberfläche liegt, in Weltpixeln. */
export const WATER_LINE = SKY_ROWS * CELL;

/** Wie breit und wie hoch die ganze Karte ist, in Weltpixeln. */
export const DEEP_W = DEEP_COLS * CELL;
export const DEEP_H = DEEP_ROWS * CELL;

/**
 * Wer mitfährt.
 *
 * @remarks
 * Zwei Plätze, weil der Koop zwei hat: `one` ist im Netz immer der Host,
 * `two` immer der Gast. Allein fährt nur `one`.
 */
export type DiverId = "one" | "two";

/** Beide Plätze, in der Reihenfolge, in der sie vergeben werden. */
export const DIVER_IDS: readonly DiverId[] = ["one", "two"];

/**
 * Was ein Gegner fallen lassen kann.
 *
 * @remarks
 * Dieselben vier wie in der Panzerkiste, und aus demselben Grund: Sie sind
 * dort erprobt, und wer beide Spiele spielt, muss nichts Neues lernen.
 * `revive` fällt nur, solange wirklich jemand unten liegt - ein Gegenstand,
 * den niemand gebrauchen kann, ist Müll auf dem Meeresgrund.
 */
export type DropKind = "shield" | "rapid" | "scatter" | "revive";

/** Ein Ding, das im Wasser schwebt und auf jemanden wartet. */
export type Drop = {
  readonly id: number;
  readonly kind: DropKind;
  readonly x: number;
  readonly y: number;
  /** Wie lange es schon da liegt, in Sekunden - danach löst es sich auf. */
  readonly age: number;
};

/** Ein Schuss, samt dem, der ihn abgefeuert hat. */
export type DeepShot = {
  readonly id: number;
  readonly kind: WeaponKind;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly age: number;
  /** Wessen Schuss das ist - eine Seemine darf den eigenen Leger verschonen. */
  readonly ownerId: DiverId;
};

/** Ein Knall, solange er noch zu sehen ist. */
export type DeepBlast = {
  readonly x: number;
  readonly y: number;
  readonly reach: number;
  readonly age: number;
};

/** Ein Boot und der Mensch daran. */
export type Diver = {
  readonly id: DiverId;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  /**
   * Wohin die Nase zeigt: 1 nach rechts, -1 nach links.
   *
   * @remarks
   * **Gespiegelt und nicht gedreht.** Ein Boot, das sich beim Rückwärtsfahren
   * um die eigene Achse wälzt, sieht aus wie ein Spielzeug an einer Schnur;
   * eines, das die Nase dorthin hält, wo es hinfährt, sieht aus wie ein Boot.
   * Steht hier und nicht im Zeichner, damit auch der Gast es sieht.
   */
  readonly facing: number;
  /** Was die Hülle noch aushält. Null ist kein Boot mehr. */
  readonly hull: number;
  /** Wie viel Luft noch da ist, in Sekunden. */
  readonly air: number;
  /** Wie lange ein Treffer noch nachleuchtet - solange ist man unberührbar. */
  readonly hurt: number;
  /** Der Schub, wie er sich aufbaut, und die Schraube, die daran hängt. */
  readonly wash: number;
  readonly spin: number;
  /** Wann wieder geschossen und wann wieder gelegt werden darf, in Sekunden. */
  readonly loaded: number;
  readonly laid: number;
  /**
   * Ob dieses Boot in dieser Stufe unten liegt.
   *
   * @remarks
   * **Wer stirbt, ist in der nächsten Stufe wieder dabei.** Also wird er nicht
   * aus der Liste genommen, sondern umgelegt: Er bleibt im Bild, bleibt
   * ansprechbar, und wenn die Stufe wechselt, steht er wieder.
   */
  readonly down: boolean;
  /** Bis wann der Schild hält, wann das schnelle Nachladen aufhört, und der
   * Fächerschuss - alles als Zeitpunkt auf der Uhr des Laufs. */
  readonly shieldUntil: number;
  readonly rapidUntil: number;
  readonly scatterUntil: number;
};

/** Wie ein Lauf gerade steht. */
export type DeepPhase = "waiting" | "diving" | "cleared" | "over";

/** Ein ganzer Lauf durch die Tiefe. */
export type DeepState = {
  /** Die wievielte Stufe, von eins an. */
  readonly stage: number;
  /** Woraus ihre Karte gebaut ist - damit der Gast dieselbe bauen kann. */
  readonly seed: number;
  readonly phase: DeepPhase;
  readonly divers: readonly Diver[];
  readonly beasts: readonly Beast[];
  readonly shots: readonly DeepShot[];
  readonly blasts: readonly DeepBlast[];
  readonly drops: readonly Drop[];
  /** Felder, die aus dem Fels gesprengt wurden, nach ihrem Platz in der Karte. */
  readonly gone: readonly number[];
  /** Wie viele Bewohner in diesem Lauf schon erwischt wurden. */
  readonly kills: number;
  /** Wie lange der Lauf schon geht, in Sekunden. */
  readonly time: number;
  /** Und wie lange die jetzige Phase - für die Pause zwischen zwei Stufen. */
  readonly since: number;
  /** Die Nummer, die das nächste Ding bekommt. */
  readonly nextId: number;
};

/** Was ein Boot in diesem Bild tun will. */
export type DeepInput = {
  readonly up: boolean;
  readonly down: boolean;
  readonly back: boolean;
  readonly forward: boolean;
  readonly fire: boolean;
  readonly drop: boolean;
  /** Wohin gezielt wird, in Weltpixeln - oder null für geradeaus. */
  readonly aim: { readonly x: number; readonly y: number } | null;
};

/** Ein Boot, das nichts tut. */
export const DEEP_IDLE: DeepInput = {
  up: false,
  down: false,
  back: false,
  forward: false,
  fire: false,
  drop: false,
  aim: null,
};
