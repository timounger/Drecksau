/**
 * Auszeichnungen: was man geschafft hat, und was noch fehlt.
 *
 * @module
 * @remarks
 * **Nichts davon wird gespeichert.** Eine Auszeichnung ist kein Besitz,
 * sondern eine Feststellung über die gemeisterten Gewässer - und deshalb wird
 * sie aus ihnen ausgerechnet statt nebenher mitgeschrieben. Ein Haken, der
 * beim Speichern verlorengeht, kann so nicht entstehen; und wer ein Gewässer
 * nachholt, bekommt die zugehörige Auszeichnung im selben Moment.
 *
 * Welche Gewässer zu welcher Stufe gehören, steht in {@link ../engine/levels}
 * und nirgends sonst: Ein elftes Gewässer in der Höhlenstufe verlängert die
 * Bedingung von allein.
 *
 * **Eine Ausnahme gibt es doch**, und sie ist der Grund für
 * {@link ../settings/profile Profile.seen}: An einer Landmarke vorbeigefahren
 * zu sein, lässt sich aus den gemeisterten Gewässern nicht ausrechnen. Wer am
 * Ananashaus vorbei ist und zwei Felder später auf eine Mine fährt, war
 * trotzdem dort - und genau das soll die Tafel auch sagen.
 */
import { LEVELS, type Tier } from "@/games/uboot/engine/levels";
import { GRADES, TOP_GRADE } from "@/games/uboot/engine/grades";
import {
  bestOf,
  hasSeen,
  isDone,
  type Profile,
} from "@/games/uboot/settings/profile";
import {
  ABFALLEIMER,
  ARIELLE,
  FLIPPER,
  HOLLAENDER,
  HOUSE_PATRICK,
  HOUSE_SANDY,
  HOUSE_SPONGEBOB,
  HOUSE_THADDAEUS,
  KROSSEN_KRABBE,
  NEMO,
} from "@/games/uboot/engine/landmarks";

/** Eine Auszeichnung. */
export type Award = {
  readonly id: string;
  readonly name: string;
  /** Wofür es sie gibt - steht auch dann da, wenn sie noch grau ist. */
  readonly hint: string;
  /** Ein Zeichen für die Tafel. */
  readonly icon: string;
  /**
   * Welche Stufe dafür vollständig sein muss, oder null.
   *
   * @remarks
   * Für die drei Stufenauszeichnungen. Der Wächter ist ein einzelnes
   * Gewässer und steht deshalb als "final" hier - was auf dasselbe
   * hinausläuft, weil es nur eines davon gibt.
   */
  readonly tier: Tier | null;
  /**
   * Oder: welche Schwierigkeit in **jedem** Gewässer geschafft sein muss.
   *
   * @remarks
   * Die andere Art, eine Auszeichnung zu verdienen. Steht hier eine Zahl, ist
   * die Stufe egal und es zählt nur, wie schwer es war - das ist die einzige
   * Bedingung im Spiel, die sich nicht aus "durchgekommen" ergibt.
   */
  readonly grade?: number;
  /**
   * Oder: an welcher Landmarke man vorbeigefahren sein muss.
   *
   * @remarks
   * Der Buchstabe aus {@link ../engine/landmarks}. Die dritte Art, eine
   * Auszeichnung zu verdienen - und die einzige, die nichts damit zu tun hat,
   * ob man angekommen ist.
   */
  readonly mark?: string;
  /**
   * Was man dort gesehen hat.
   *
   * @remarks
   * Steht **erst da, wenn sie leuchtet**. Der {@link hint} sagt vorher, wo man
   * hinfahren muss; was dort steht, erzählt die Auszeichnung hinterher. Eine
   * Landmarke, die auf der Tafel beschrieben ist, bevor man sie gesehen hat,
   * ist keine Entdeckung mehr.
   */
  readonly note?: string;
};

/**
 * Zehn Landmarken, zehn Haken - eine je Gewässer.
 *
 * @remarks
 * In der Reihenfolge ihrer Gewässer, und jede mit zwei Sätzen: Der erste sagt,
 * wo sie steht, der zweite, was dort steht. Der zweite ist der Lohn.
 */
const SIGHTS: readonly Award[] = [
  {
    id: "ananas",
    name: "Goldene Ananas",
    hint: "Im Hafenbecken an ihr vorbeigefahren.",
    note: "Ein Haus aus einer Ananas, mit Blätterkrone, Rundbogentür, zwei Bullaugen und einem Kamin an der rechten Flanke. Es tut niemandem etwas - man fährt einfach daran vorbei.",
    icon: "\u{1F34D}",
    tier: null,
    mark: HOUSE_SPONGEBOB,
  },
  {
    id: "antenne",
    name: "The Rock",
    hint: "Im seichten Wasser an ihm vorbeigefahren.",
    note: "Von außen nichts als ein Felsbrocken. Dass darunter jemand wohnt, verrät einzig die Fernsehantenne obendrauf - und die ist gelb.",
    icon: "\u{1FAA8}",
    tier: null,
    mark: HOUSE_PATRICK,
  },
  {
    id: "bude",
    name: "Krosse Krabbe",
    hint: "Am Riff an ihr vorbeigefahren.",
    note: "Ein Bretterbau wie eine umgedrehte Reuse, Wimpelkette davor, daneben auf einem Mast die Tafel. Die Schrift darauf sind drei rote Striche: lesen soll man das nicht, erkennen schon.",
    icon: "\u{1F980}",
    tier: null,
    mark: KROSSEN_KRABBE,
  },
  {
    id: "kuppel",
    name: "Sandys Baumhaus",
    hint: "In der Höhle an ihr vorbeigefahren.",
    note: "Ein Stück Land unter einer Glasglocke: Gras, ein Baum und eine überdachte Schleuse an der Seite. Das einzige Haus, in das man hineinsieht - draußen Wasser, drinnen Luft.",
    icon: "\u{1F333}",
    tier: null,
    mark: HOUSE_SANDY,
  },
  {
    id: "eimer",
    name: "Abfalleimer",
    hint: "Im Schlund an ihm vorbeigefahren.",
    note: "Ein Blecheimer, oben breiter als unten, mit Henkel, einem Sack obendrauf und einem roten Schriftband quer über dem Bauch. Dass er bewohnt ist, verraten die beiden runden Fenster.",
    icon: "\u{1FAA3}",
    tier: null,
    mark: ABFALLEIMER,
  },
  {
    id: "steinkopf",
    name: "Tiki-Kopf",
    hint: "Im Labyrinth an ihm vorbeigefahren.",
    note: "Schmal oben, breit unten, mit Krempe, zwei Ohren und einer langen Nase. Dass es ein Haus ist und kein Felsen, verraten die Augen: Es sind Fenster.",
    icon: "\u{1F5FF}",
    tier: null,
    mark: HOUSE_THADDAEUS,
  },
  {
    id: "fische",
    name: "Findet Nemo",
    hint: "In der Finsternis an ihnen vorbeigefahren.",
    note: "Ein kleiner oranger mit drei weißen Binden und eine größere blaue mit gelbem Schwanz, einander zugewandt. Ein einzelner Fisch wäre ein Fisch; zwei, die voreinander stehen, sind eine Begegnung.",
    icon: "\u{1F420}",
    tier: null,
    mark: NEMO,
  },
  {
    id: "delfin",
    name: "Flipper & Lopaka",
    hint: "Im Abgrund an ihm vorbeigefahren.",
    note: "Ein Delfin, und auf seinem Rücken ein Junge: eine Hand an der Rückenflosse, die andere hochgerissen. Ohne ihn wäre es ein Tier wie die anderen hier unten.",
    icon: "\u{1F42C}",
    tier: null,
    mark: FLIPPER,
  },
  {
    id: "muschel",
    name: "Little Mermaid",
    hint: "In der Tiefe an ihr vorbeigefahren.",
    note: "Rotes Haar, grüner Schwanz, und hinter ihr die aufgeklappte Muschel wie eine Lehne. Sie sitzt dort, wo sonst nichts mehr ist, und sieht dich vorbeifahren.",
    icon: "\u{1F9DC}",
    tier: null,
    mark: ARIELLE,
  },
  {
    id: "geist",
    name: "Fliegende Holländer",
    hint: "Vor dem Wächter an ihm vorbeigefahren.",
    note: "Dreispitz, Bart, Schnurrbartlocken, erhobener Säbel, Klaue - und unten statt Beinen ein Schweif. Er leuchtet und tut trotzdem nichts: Der eigentliche Gegner kommt erst danach.",
    icon: "\u{1F47B}",
    tier: null,
    mark: HOLLAENDER,
  },
];

/**
 * Alle, die es gibt - in der Reihenfolge, in der sie erreichbar sind.
 *
 * @remarks
 * **Die zehn Landmarken zuerst**, Gewässer für Gewässer: An der Ananas ist man
 * nach einer Minute vorbei, und die erste Stufenauszeichnung kostet drei ganze
 * Gewässer. Eine Tafel, die mit dem anfängt, was zuletzt kommt, ist von oben
 * nach unten gelesen eine Liste von Dingen, die man noch nicht hat.
 */
export const AWARDS: readonly Award[] = [
  ...SIGHTS,
  {
    id: "easy",
    name: "Hafenmeister",
    hint: "Alle drei leichten Gewässer durchgetaucht.",
    icon: "\u{1F949}",
    tier: "easy",
  },
  {
    id: "cave",
    name: "Höhlengänger",
    hint: "Alle drei Höhlen durchgetaucht - ohne einmal Luft zu holen.",
    icon: "\u{1F948}",
    tier: "cave",
  },
  {
    id: "deep",
    name: "Tiefenkundig",
    hint: "Alle drei finsteren Höhlen durchgetaucht.",
    icon: "\u{1F947}",
    tier: "deep",
  },
  {
    id: "boss",
    name: "Wächterbezwinger",
    hint: "Den Wächter in der Tiefe besiegt.",
    icon: "\u{1F991}",
    tier: "final",
  },
  {
    id: "brutal",
    name: "Unmöglich gemacht",
    hint: `Alle zehn Gewässer auf ${GRADES[TOP_GRADE].name} durchgetaucht.`,
    icon: "\u{1F480}",
    tier: null,
    grade: TOP_GRADE,
  },
];

/**
 * Ob eine Auszeichnung verdient ist.
 *
 * @param profile - der Spieler
 * @param award - die Auszeichnung
 * @returns true, wenn ihre Bedingung erfüllt ist
 * @remarks
 * Drei Arten, dieselbe Frage zu stellen: Steht an der Auszeichnung eine
 * Landmarke, zählt nur, ob man an ihr vorbeigefahren ist. Steht dort eine
 * Schwierigkeit, zählt jedes Gewässer und wie schwer es war. Sonst zählt eine
 * Stufe und ob man durchgekommen ist.
 */
export function isEarned(profile: Profile, award: Award): boolean {
  const sight = award.mark;
  const hard = award.grade;
  let all = true;

  if (sight === undefined) {
    LEVELS.forEach((level, index) => {
      const mine = hard === undefined ? level.tier === award.tier : true;
      const got =
        hard === undefined
          ? isDone(profile, index)
          : bestOf(profile, index) >= hard;
      if (mine && !got) {
        all = false;
      }
    });
  } else {
    // Hier zählt kein Gewässer, sondern eine Stelle darin: Gefahren sein,
    // nicht angekommen sein.
    all = hasSeen(profile, sight);
  }

  return all;
}

/** Wie weit eine Auszeichnung gediehen ist. */
export type Progress = {
  /** Wie viel davon schon steht. */
  readonly done: number;
  /** Und wie viel es im Ganzen braucht. */
  readonly all: number;
};

/**
 * Wie weit man bei einer Auszeichnung ist.
 *
 * @param profile - der Spieler
 * @param award - die Auszeichnung
 * @returns wie viel von wie viel
 * @remarks
 * **Eine Zahl sagt mehr als ein graues Feld.** "Noch offen" ist dasselbe für
 * den, dem ein Gewässer fehlt, und für den, der noch nie getaucht ist - und
 * genau der Unterschied ist das, was jemanden noch einmal hinunterschickt.
 *
 * Eine Landmarke kennt nur null oder eins: Man ist vorbeigefahren oder nicht.
 */
export function progressOf(profile: Profile, award: Award): Progress {
  const sight = award.mark;
  const hard = award.grade;
  let done = 0;
  let all = 0;

  if (sight !== undefined) {
    all = 1;
    done = hasSeen(profile, sight) ? 1 : 0;
  } else if (hard !== undefined) {
    all = LEVELS.length;
    done = LEVELS.filter((_, level) => bestOf(profile, level) >= hard).length;
  } else {
    LEVELS.forEach((level, index) => {
      if (level.tier === award.tier) {
        all += 1;
        done += isDone(profile, index) ? 1 : 0;
      }
    });
  }

  return { done, all };
}

/**
 * Wie viele davon leuchten.
 *
 * @param profile - der Spieler
 * @returns die Anzahl der verdienten Auszeichnungen
 */
export function earnedCount(profile: Profile): number {
  return AWARDS.filter((award) => isEarned(profile, award)).length;
}
