/**
 * The German the screens are written in.
 *
 * @module
 */

/** Everything the screens say. */
export const RISIKO_TEXTS = {
  title: "Risiko",
  tagline: "Gebiet für Gebiet die Welt erobern.",

  yourTurn: "Du bist dran",
  waitingFor: (name: string): string => `${name} ist dran`,
  overNow: "Spiel vorbei",

  phaseClaim: "Gebiete besetzen",
  phaseDeploy: "Starteinheiten verteilen",
  phaseNeutral: "Neutrale Armee verstärken",
  phaseReinforce: "Einheiten platzieren",
  phaseAttack: "Erobern",
  phaseFortify: "Truppen bewegen",

  hintClaim: "Tipp auf ein freies Gebiet.",
  hintDeploy: "Tipp auf eines deiner Gebiete.",
  hintNeutral:
    "Drei Einheiten auf eine neutrale Armee - alle drei auf dieselbe.",
  hintReinforce: "Tipp auf eines deiner Gebiete, um Einheiten zu stellen.",
  hintAttackFrom: "Tipp auf ein Gebiet, von dem aus du angreifen willst.",
  hintAttackTo: (from: string): string => `Von ${from} aus: welches Gebiet?`,
  hintAdvance: "Wie viele Einheiten rücken nach?",
  hintFortifyFrom: "Tipp auf das Gebiet, aus dem du Truppen wegnimmst.",
  hintFortifyTo: (from: string): string => `Von ${from} nach wohin?`,
  nothingToDo: "Hier ist gerade nichts zu tun.",

  left: (count: number): string => `Noch ${count} zu verteilen`,
  place: (count: number): string => `${count} stellen`,
  placeAll: "Alle",
  attackWith: (count: number): string => `Mit ${count} angreifen`,
  advanceCount: (count: number): string => `${count} nachziehen`,
  advanceNone: "Keine",
  moveCount: (count: number): string => `${count} bewegen`,
  cancel: "Abbrechen",
  doneAttacking: "Erobern beenden",
  endTurn: "Zug beenden",
  skipMove: "Nicht bewegen",

  income: (units: number): string => `${units} Einheiten Verstärkung`,
  incomeParts: (land: number, continents: number): string =>
    `3 Grundeinheiten${land > 0 ? ` + ${land} für Gebiete` : ""}${
      continents > 0 ? ` + ${continents} für Kontinente` : ""
    }`,

  cardsTitle: "Deine Karten",
  cardsNone: "Noch keine Karten.",
  cardsCount: (count: number): string =>
    count === 1 ? "1 Karte" : `${count} Karten`,
  stars: (count: number): string =>
    count === 1 ? "1 Stern" : `${count} Sterne`,
  tradeFor: (units: number): string => `Eintauschen: ${units} Einheiten`,
  tradeHint:
    "Karten mit zusammen 2 bis 10 Sternen eintauschen. Nur beim Platzieren.",
  tradeNothing: "Diese Auswahl steht nicht in der Tabelle.",
  deckLeft: (count: number): string => `Nachziehstapel: ${count}`,

  battle: "Letzter Angriff",
  battleDice: (attack: string, defence: string): string =>
    `Schwarz ${attack} gegen Rot ${defence}`,
  battleCost: (mine: number, theirs: number): string =>
    `Verluste: du ${mine}, Gegner ${theirs}`,
  battleTaken: "Erobert!",
  battleHeld: "Gehalten.",

  standings: "Stand",
  held: (count: number): string => `${count} Gebiete`,
  unitsOnBoard: (count: number): string => `${count} Einheiten`,
  targetIs: (count: number): string => `Ziel: ${count} Gebiete`,
  targetWorld: "Ziel: die ganze Welt",
  beaten: "besiegt",
  neutral: "neutral",
  yourContinents: (names: string): string => `Kontinente: ${names}`,

  log: "Verlauf",
  wonYou: "Gewonnen!",
  won: (name: string): string => `${name} gewinnt!`,
  wonMany: (names: string): string => `${names} gewinnen gemeinsam!`,
  wonTruce: "Waffenstillstand - gezählt wird, wer am meisten hält.",
  playAgain: "Neues Spiel",

  settingsTitle: "Risiko - Einstellungen",
  variantLabel: "Spielvariante",
  variantBasic: "Grundspiel",
  variantBasicHint:
    "3 bis 5 Spieler. Die Karten verteilen die Welt, ein Ziel an Gebieten gewinnt, und die Waffenstillstandskarte kann jederzeit Schluss machen.",
  variantClassic: "Klassisches Risiko",
  variantClassicHint:
    "3 bis 5 Spieler. Gebiete werden reihum besetzt, und gewonnen hat, wer alle 42 hält. Dauert deutlich länger.",
  variantTwo: "Risiko für 2 Spieler",
  variantTwoHint:
    "Zu zweit, mit drei neutralen Armeen als Hindernis. 30 Gebiete oder den Gegner besiegen.",
  playersLabel: "Wie viele spielen mit",
  playersHint: "Du und die Computergegner.",
  playersFixed: "Die 2-Spieler-Variante wird immer zu zweit gespielt.",
  players: (count: number): string => `${count} Spieler`,
} as const;
