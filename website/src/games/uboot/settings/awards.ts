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
 */
import { LEVELS, type Tier } from "@/games/uboot/engine/levels";
import { GRADES, TOP_GRADE } from "@/games/uboot/engine/grades";
import { bestOf, isDone, type Profile } from "@/games/uboot/settings/profile";

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
};

/** Alle, die es gibt - in der Reihenfolge, in der sie erreichbar sind. */
export const AWARDS: readonly Award[] = [
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
 * @returns true, wenn jedes Gewässer ihrer Stufe geschafft ist
 * @remarks
 * Zwei Arten, dieselbe Frage zu stellen: Steht an der Auszeichnung eine
 * Schwierigkeit, zählt jedes Gewässer und wie schwer es war; sonst zählt eine
 * Stufe und ob man durchgekommen ist.
 */
export function isEarned(profile: Profile, award: Award): boolean {
  const hard = award.grade;
  let all = true;

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

  return all;
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
