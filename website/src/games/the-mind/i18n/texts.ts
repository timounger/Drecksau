/**
 * The German texts of The Mind.
 *
 * @module
 */

/** Every label the screens use. */
export const MIND_TEXTS = {
  title: "The Mind",
  tagline: "Gemeinsam aufsteigend ablegen - ohne ein Wort.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "The Mind - Einstellungen",
  settingsSubtitle: "Wie viele gemeinsam schweigen.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und deine Mitspieler. Zu zweit gibt es 12 Level, zu dritt 10, zu viert 8 - und so viele Leben, wie ihr seid.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  level: (n: number, of: number) => `Level ${n} von ${of}`,
  lives: "Leben",
  shurikens: "Wurfsterne",
  pileTop: "Oben liegt",
  pileEmpty: "Noch nichts gelegt",
  cardsLeft: (n: number) => (n === 1 ? "1 Karte offen" : `${n} Karten offen`),

  yourHand: "Deine Karten",
  handEmpty: "Du hast abgelegt.",
  playLowest: "Niedrigste legen",
  playCard: (card: number) => `Die ${card} legen`,
  shurikenAsk: "Wurfstern vorschlagen",
  shurikenWithdraw: "Vorschlag zurückziehen",
  shurikenWaiting: (n: number) => `${n} noch nicht dafür`,
  shurikenNone: "Kein Wurfstern mehr",
  handsUp: "Hand oben",
  cardsInHand: (n: number) => (n === 1 ? "1 Karte" : `${n} Karten`),
  done: "fertig",

  mistakeTitle: "Zu spät!",
  mistakeLine: (played: number, lost: string) =>
    `Die ${played} kam, aber ${lost} lagen noch in Händen.`,
  lifeLost: "Ein Leben weg.",

  levelDone: (n: number) => `Level ${n} geschafft`,
  rewardLife: "Ein Leben dazu!",
  rewardShuriken: "Ein Wurfstern dazu!",
  nextLevel: "Nächstes Level",

  wonTitle: "Geschafft!",
  wonLine: (n: number) => `Alle ${n} Level - gemeinsam und ohne ein Wort.`,
  lostTitle: "Vorbei",
  lostLine: (n: number) => `Bis Level ${n} seid ihr gekommen.`,
  playAgain: "Nochmal",

  silenceTitle: "Die einzige Regel",
  silenceHint:
    "Nicht reden, nicht zwinkern, nicht auf die Uhr tippen. Nur warten - und wissen, wann.",
} as const;
