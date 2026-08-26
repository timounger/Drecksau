/**
 * The German texts of Bohnanza.
 *
 * @module
 */

/** Every label the screens use. */
export const BZ_TEXTS = {
  title: "Bohnanza",
  tagline: "Anbauen, handeln, ernten - wer die meisten Taler hat, gewinnt.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Bohnanza - Einstellungen",
  settingsSubtitle: "Wie viele am Tisch sitzen.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und deine Computergegner, drei bis fünf am Tisch. Zu dritt hat jeder drei Bohnenfelder, zu viert und zu fünft nur zwei.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  turn: (n: number) => `Zug ${n}`,
  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  starter: "Start-Karte",
  deckLeft: (n: number) => `Nachziehstapel: ${n}`,
  discardLeft: (n: number) => `Ablage: ${n}`,
  emptied: (n: number, max: number) => `Stapel leer: ${n} von ${max}`,
  lastRounds: "Letzte Phase - danach wird abgerechnet.",

  phasePlant: "1. Anbauen",
  phaseTrade: "2. Aufdecken und handeln",
  phaseSettle: "3. Erhaltene Karten anbauen",
  phasePlantHint: "Die vorderste Handkarte muss auf ein Feld.",
  phasePlantHint2:
    "Du darfst noch eine zweite Karte anbauen - musst aber nicht.",
  phaseTradeHint:
    "Zwei Karten liegen offen. Sie gehören dir - handle damit oder baue sie an.",
  phaseSettleHint: "Was quer liegt, muss jetzt angebaut werden.",
  mustHarvestHint:
    "Kein Feld passt zu dieser Bohne - ernte zuerst ein Feld ab.",
  waitHint: "Warte, bis du an der Reihe bist.",

  plantHere: "Hier anbauen",
  donePlanting: "Anbau beenden",
  endTrade: "Handel beenden",
  harvest: "Ernten",
  harvestBlocked:
    "Bohnenschutzregel: eine einzelne Bohne darfst du nicht ernten, solange ein anderes Feld mehr als eine hat.",

  yourHand: "Deine Hand",
  handEmpty: "Deine Hand ist leer.",
  frontCard: "vorderste",
  handCount: (n: number) => (n === 1 ? "1 Handkarte" : `${n} Handkarten`),
  crosswise: "Quer daneben",
  revealed: "Aufgedeckt",
  emptyField: "Freies Feld",
  coins: (n: number) => (n === 1 ? "1 Taler" : `${n} Taler`),
  coinPile: "Talerstapel",
  toNext: (n: number) => `noch ${n} bis zum nächsten Taler`,
  ripe: "mehr geht nicht",

  tradeTitle: "Handel",
  tradeClosedHint: "Gehandelt wird nur in der 2. Phase.",
  tradeRuleHint:
    "Gehandelt wird nur mit der aktiven Person - untereinander nicht.",
  offerGive: "Du gibst",
  offerWant: "Du möchtest",
  offerGift: "Geschenk (du willst nichts dafür)",
  offerTo: "An",
  offerSend: "Angebot machen",
  offerPick: "Wähle Karten aus, die du hergibst.",
  offerLimit: "Für diesen Zug sind genug Angebote gemacht worden.",
  // An arrow and not "bietet X an": the seat you play yourself is called "Du",
  // and German wants a dative there that a name cannot know it needs.
  offerOpen: (from: string, to: string) => `${from} → ${to}:`,
  offerGives: "gibt",
  offerWants: "will dafür",
  offerIsGift: "als Geschenk",
  offerAccept: "Annehmen",
  offerDecline: "Ablehnen",
  offerWithdraw: "Angebot zurückziehen",
  offerWaiting: (name: string) => `Warte auf ${name} …`,
  offerChoose: (have: number, need: number) =>
    `Gib ab: ${have} von ${need} gewählt`,
  offerImpossible: "Du hast nicht, was verlangt wird.",
  interest: (hint: string) => `(${hint})`,

  gameOverTitle: "Spiel vorbei",
  winner: (name: string) => `Gewonnen: ${name}`,
  finalNote:
    "Am Ende erntet jeder seine Felder ab. Handkarten zählen nicht mehr.",
  tieNote:
    "Bei Gleichstand gewinnt, wer im Uhrzeigersinn am weitesten von der Start-Karte sitzt.",
  playAgain: "Neues Spiel",
} as const;
