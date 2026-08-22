/**
 * The German the screens are written in.
 *
 * @module
 */

/** Everything the screens say. */
export const THE_GAME_TEXTS = {
  title: "The Game",
  tagline: "Vier Reihen, 98 Karten - und nur zwei Sätze, die ihr sagen dürft.",

  overNow: "Spiel vorbei",
  yourTurn: "Du bist dran",
  waitingFor: (name: string): string => `${name} ist dran`,
  owed: (count: number): string =>
    count === 1 ? "Noch 1 Karte ablegen" : `Noch ${count} Karten ablegen`,
  mayStop: "Du darfst aufhören",
  endTurn: "Zug beenden",
  drawPile: (count: number): string => `Nachziehstapel: ${count}`,
  drawEmpty: "Nachziehstapel leer - eine Karte pro Zug reicht",
  handOf: (name: string, count: number): string => `${name}: ${count} Karten`,
  yourHand: "Deine Karten",
  emptyHand: "Keine Karten mehr - du setzt aus",

  pickCard: "Wähle eine Karte, dann eine Reihe.",
  pickPile: (card: number): string => `${card} auf welche Reihe?`,
  trick: "Rückwärts-Trick",
  stepUp: (step: number): string => `+${step}`,
  stepDown: (step: number): string => `-${step}`,
  rowEmpty: "noch leer",
  onIt: (count: number): string =>
    count === 1 ? "1 Karte drauf" : `${count} Karten drauf`,

  hintsTitle: "Bitte an die anderen",
  hintKeep: "Nicht hier",
  hintSmall: "Nur klein",
  hintKeepLong: "Bitte nicht auf diese Reihe legen",
  hintSmallLong: "Hier bitte nur einen ganz kleinen Sprung",
  hintOff: "Bitte zurücknehmen",
  askedBy: (names: string): string => `Gewünscht von ${names}`,

  log: "Verlauf",
  won: "Das Spiel besiegt!",
  wonBody: "Alle 98 Karten liegen auf den Reihen. Mehr geht nicht.",
  lost: "Vorbei",
  lostBody: (name: string): string =>
    `${name} konnte die geforderten Karten nicht mehr ablegen.`,
  leftOver: (count: number): string =>
    count === 1 ? "1 Karte blieb liegen" : `${count} Karten blieben liegen`,
  placedOut: (count: number): string => `${count} von 98 abgelegt`,
  gradeBeaten: "Besiegt - das schafft fast niemand.",
  gradeSuper: "Unter zehn. Das ist super.",
  gradeGood: "Ordentlich. Da geht noch was.",
  gradeAgain: "Nochmal.",
  playAgain: "Neues Spiel",

  settingsTitle: "The Game - Einstellungen",
  playersLabel: "Wie viele spielen mit",
  playersHint: "Du und die Computerpartner. Alleine sind es 8 Handkarten.",
  solo: "Alleine",
  players: (count: number): string => `${count} Spieler`,
  variantLabel: "Schwierigkeit",
  variantNormal: "Normal",
  variantNormalHint: "Zwei Karten pro Zug - die Regeln aus der Schachtel.",
  variantProfi: "Profi",
  variantProfiHint: "Drei Karten pro Zug.",
  variantProfiPlus: "Profi hart",
  variantProfiPlusHint: "Drei Karten pro Zug und eine Handkarte weniger.",
  handSizeNote: (count: number): string => `Handkarten: ${count}`,
} as const;
