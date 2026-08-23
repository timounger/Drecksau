/**
 * The German the screens are written in.
 *
 * @module
 */

/** Everything the screens say. */
export const MONOPOLY_TEXTS = {
  title: "Monopoly",
  tagline: "Das berühmte Spiel um den großen Deal.",

  yourTurn: "Du bist dran",
  waitingFor: (name: string): string => `${name} ist dran`,
  overNow: "Spiel vorbei",

  phaseTokens: "Spielfiguren wählen",
  phaseJail: "Im Gefängnis",
  phaseRoll: "Würfeln",
  phaseDecide: "Kaufen oder versteigern",
  phaseAuction: "Versteigerung",
  phaseDebt: "Geld auftreiben",
  phaseManage: "Bauen, handeln, Zug beenden",

  pickToken: "Welche Figur nimmst du?",
  tokenTaken: (who: string): string => `${who} spielt sie`,
  waitingTokens: (who: string): string => `${who} sucht sich eine Figur aus …`,
  yourToken: "deine Figur",
  roll: "Würfeln",
  rolled: (a: number, b: number): string => `${a} und ${b}`,
  doublesAgain: "Pasch - du darfst nochmal",
  payBail: (amount: number): string => `${amount} € Kaution zahlen`,
  usePardon: "Freikarte ausspielen",
  tryDouble: "Auf Pasch würfeln",
  jailTurn: (turn: number, of: number): string => `Versuch ${turn} von ${of}`,

  buy: (name: string, price: number): string => `${name} für ${price} € kaufen`,
  decline: "Nicht kaufen - versteigern",
  buyHint:
    "Wer nicht kauft, muss versteigern lassen. Das steht so in der Anleitung.",

  auctionOf: (name: string): string => `${name} wird versteigert`,
  highest: (amount: number, who: string): string =>
    `Höchstgebot ${amount} € von ${who}`,
  noBidYet: (opening: number): string =>
    `Noch kein Gebot. Start bei ${opening} €.`,
  bidOf: (amount: number): string => `${amount} € bieten`,
  bidLeast: (amount: number): string => `Mindestgebot ${amount} €`,
  passBid: "Aussteigen",
  yourBid: "Dein Gebot",

  owes: (amount: number, reason: string): string =>
    `Du schuldest ${amount} € (${reason}).`,
  owesOther: (who: string, amount: number): string =>
    `${who} schuldet ${amount} € und treibt Geld auf.`,
  short: (amount: number): string => `Es fehlen noch ${amount} €.`,
  settle: (amount: number): string => `${amount} € zahlen`,
  resign: "Aufgeben",
  hopeless: "Das reicht nicht mehr - du musst aufgeben.",

  cardTitle: (deck: string): string =>
    deck === "ereignis" ? "Ereigniskarte" : "Gemeinschaftskarte",
  takeCard: "Karte umdrehen",

  build: (name: string, cost: number): string => `Haus auf ${name} (${cost} €)`,
  buildHotel: (name: string, cost: number): string =>
    `Hotel auf ${name} (${cost} €)`,
  sellHouse: (name: string, back: number): string =>
    `Haus auf ${name} verkaufen (+${back} €)`,
  sellHotel: (name: string, back: number): string =>
    `Hotel auf ${name} verkaufen (+${back} €)`,
  mortgage: (name: string, loan: number): string =>
    `${name} beleihen (+${loan} €)`,
  redeem: (name: string, due: number): string =>
    `Hypothek auf ${name} auflösen (${due} €)`,
  endTurn: "Zug beenden",

  yourStreets: "Dein Besitz",
  noStreets: "Noch nichts.",
  mortgaged: "Hypothek",
  houses: (count: number): string =>
    count === 1 ? "1 Haus" : `${count} Häuser`,
  hotel: "Hotel",
  rentNow: (amount: number): string => `Miete ${amount} €`,
  wholeGroup: "ganze Farbgruppe",

  players: "Spieler",
  cash: (amount: number): string => `${amount} €`,
  worth: (amount: number): string => `Vermögen ${amount} €`,
  inJail: "im Gefängnis",
  outOfGame: "raus",
  pardons: (count: number): string =>
    count === 1 ? "1 Freikarte" : `${count} Freikarten`,
  bankStock: (houses: number, hotels: number): string =>
    `Bank: ${houses} Häuser, ${hotels} Hotels`,

  tradeTitle: "Handeln",
  tradeWith: "Mit wem?",
  tradeGive: "Du gibst",
  tradeWant: "Du bekommst",
  tradeCash: "Geld von dir",
  tradeSend: "Angebot machen",
  tradeOpen: (from: string): string => `${from} bietet dir an:`,
  tradeAccept: "Annehmen",
  tradeReject: "Ablehnen",
  tradeWithdraw: "Angebot zurückziehen",
  tradeWaiting: (who: string): string => `Warte auf ${who} …`,
  tradeNothing: "Nichts ausgewählt.",
  tradeHint:
    "Straßen einer Farbgruppe mit Gebäuden lassen sich nicht handeln - erst alles verkaufen.",

  log: "Verlauf",
  won: (name: string): string => `${name} gewinnt!`,
  wonYou: "Gewonnen!",
  playAgain: "Neues Spiel",

  settingsTitle: "Monopoly - Einstellungen",
  playersLabel: "Wie viele spielen mit",
  playersHint: "Du und die Computergegner. Die Schachtel sagt 2 bis 6.",
} as const;
