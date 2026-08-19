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
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  rulesTitle: "So wird gespielt",
  rules: [
    "Alle bekommen Handkarten mit Zahlen von 1 bis 100. Niemand zeigt sie her.",
    "Gemeinsam werden alle Karten aufsteigend in die Tischmitte gelegt - ohne zu reden, ohne Zeichen, ohne Absprache.",
    "Wer glaubt, die kleinste Karte zu haben, legt sie. Kommt jemand mit einer kleineren zu spät, kostet das ein Leben.",
    "Jedes Level gibt es eine Karte mehr. Sind alle Leben weg, ist das Spiel vorbei.",
    "Der Wurfstern wird nur einstimmig geworfen: dann legt jede und jeder die kleinste Handkarte offen ab.",
  ],
  needPlayers:
    "Zu zweit bis zu viert. Zu zweit gibt es 12 Level, zu dritt 10, zu viert 8 - und so viele Leben, wie ihr seid.",
  onlineOnly:
    "The Mind lebt vom gemeinsamen Zögern, und das gibt es nur mit echten Mitspielern - deshalb wird es hier ausschließlich online gespielt.",

  level: (n: number, of: number) => `Level ${n} von ${of}`,
  lives: "Leben",
  shurikens: "Wurfsterne",
  pileTop: "Oben liegt",
  pileEmpty: "Noch nichts gelegt",
  cardsLeft: (n: number) => (n === 1 ? "1 Karte offen" : `${n} Karten offen`),

  yourHand: "Deine Karten",
  handEmpty: "Du hast abgelegt.",
  playLowest: "Niedrigste legen",
  cardUnknown: "…",
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
