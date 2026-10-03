/**
 * Was am Meeresgrund steht und wer dort wohnt - ihre Buchstaben im Kursplan.
 *
 * @module
 * @remarks
 * Jede Landmarke steht in genau einem Gewässer, in der Reihenfolge, in der sie
 * gebaut wurde. Die Namen stehen **hier** und nicht verteilt: Ein Buchstabe im
 * Kursplan sagt für sich genommen nichts, und `"L"` an fünf Stellen im Code
 * ist eine Verabredung, an die sich niemand erinnert.
 *
 * Die ersten sechs sind Häuser, die letzten vier sind Bewohner. Für den Kurs
 * macht das keinen Unterschied - beides ist ein Feld, durch das man fährt und
 * das einem nichts tut.
 *
 * Ein Buchstabe gehört entweder einem Feld oder einem Tier
 * ({@link ./beasts BEAST_LETTERS}) - nie beidem. Darüber wacht
 * {@link ./course}; passiert ist es trotzdem schon einmal.
 */
/** Die Ananas im Hafenbecken. */
export const HOUSE_SPONGEBOB = "H";

/** Die Steinkuppel mit der Antenne im seichten Wasser. */
export const HOUSE_PATRICK = "R";

/** Die Bude mit dem Schild am Riff. */
export const KROSSEN_KRABBE = "L";

/** Die Glaskuppel mit dem Baum darin, in der Höhle. */
export const HOUSE_SANDY = "D";

/** Der Eimer mit dem Schriftzug, im Schlund. */
export const ABFALLEIMER = "E";

/** Der Steinkopf im Labyrinth. */
export const HOUSE_THADDAEUS = "O";

/** Die beiden Fische in der Finsternis. */
export const NEMO = "N";

/** Der Delfin mit dem Reiter im Abgrund. */
export const FLIPPER = "P";

/** Die Meerjungfrau in ihrer Muschel in der Tiefe. */
export const ARIELLE = "V";

/** Und der grüne Geist, der vor dem Wächter wartet. */
export const HOLLAENDER = "G";

/** Alle, in der Reihenfolge ihrer Gewässer. */
export const LANDMARKS: readonly string[] = [
  HOUSE_SPONGEBOB,
  HOUSE_PATRICK,
  KROSSEN_KRABBE,
  HOUSE_SANDY,
  ABFALLEIMER,
  HOUSE_THADDAEUS,
  NEMO,
  FLIPPER,
  ARIELLE,
  HOLLAENDER,
];
