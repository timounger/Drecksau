/**
 * Every word CATAN puts on screen.
 *
 * @module
 * @remarks
 * German throughout, and the rulebook's own German where it has one: a
 * crossing is a *Kreuzung*, an edge is a *Weg*, the pieces are *Siedlung*,
 * *Stadt* and *Straße*, and the two tiles are *Längste Handelsroute* and
 * *Größte Rittermacht*. A player who has read the booklet should not have to
 * translate anything.
 */
import type { DevKind, Resource } from "@/games/catan/engine/state";

/** The texts. */
export const CATAN_TEXTS = {
  title: "CATAN",
  tagline: "Siedeln, handeln, bauen - und die Insel unter euch aufteilen.",

  yourTurn: "Du bist am Zug",
  waitingFor: (name: string): string => `${name} ist am Zug`,
  overNow: "Spiel beendet",
  playAgain: "Neues Spiel",
  log: "Verlauf",

  phaseFounding: "Gründungsphase",
  phaseRoll: "Würfeln",
  phaseDiscard: "Karten abgeben",
  phaseRobber: "Räuber versetzen",
  phaseSteal: "Karte ziehen",
  phaseTrade: "Handeln und Bauen",
  phaseMonopol: "Monopol",
  phaseErfindung: "Erfindung",
  neutralSeat: "neutrale Farbe",
  neutralTown: "Siedlung",
  neutralRoad: "Straße",
  neutralHint: (what: string): string =>
    `Gratis: 1 ${what} in einer neutralen Farbe - Farbe wählen, dann auf dem Brett tippen.`,
  chipsHeld: (count: number): string => `Handelschips: ${count}`,
  chipSwap: (price: number): string => `Zwangshandel (${price})`,
  chipRobber: (price: number): string => `Räuber in die Wüste (${price})`,
  knightIn: "Ritter abgeben (+2 Chips)",
  giveBackHint: (count: number): string => `Gib ${count} Karte(n) zurück.`,
  giveBack: "Zurückgeben",
  modeTitle: "Spiel",
  modeHint:
    "Städte & Ritter ersetzt die Entwicklungskarten, würfelt mit drei Würfeln und geht bis 13 Siegpunkte.",
  modeName: (mode: string): string =>
    mode === "ritter" ? "Städte & Ritter" : "CATAN - Das Spiel",
  modeText: (mode: string): string =>
    mode === "ritter"
      ? "Handelswaren, Stadtausbau, Ritter und die Barbaren."
      : "Das gedruckte Grundspiel.",
  buildWall: "Stadtmauer (2 Lehm)",
  wakeKnight: "Aktivieren",
  raiseKnight: "Aufwerten",
  chaseRobber: "Räuber verjagen",
  marchKnight: "Versetzen",
  marchCancel: "Abbrechen",
  retreatHint: "Setze deinen vertriebenen Ritter auf eine freie Kreuzung.",
  tapTheBoard: "Wähle auf dem Brett.",
  tableau: "Stadtausbau",
  barbarians: "Barbaren",
  progressCards: "Fortschrittskarten",
  noProgress: "Keine Fortschrittskarten.",
  knights: "Ritter:",
  knightAwake: "wach",
  knightAsleep: "passiv",
  improveFor: (price: number): string => `Ausbauen (${price})`,
  drawsNever: "Zieht keine Karten.",
  drawsAt: (limit: number): string => `Zieht bei rot 1-${limit}.`,
  metroHeld: (name: string): string => `Metropole: ${name}`,
  metroHint: "Stufe 4 gewinnt die Metropole (2 Siegpunkte).",
  benefitOf: (track: string): string =>
    track === "wissenschaft"
      ? "Aquädukt: gehst du leer aus, nimm dir einen Rohstoff."
      : track === "handel"
        ? "Gilde: Handelswaren 2:1 tauschen."
        : "Festung: Starke Ritter zu Mächtigen aufwerten.",
  barbarianOdds: (defence: number, attack: number): string =>
    `Ritter ${defence} gegen Städte ${attack}`,
  wouldHold: "hält",
  wouldFall: "fällt",
  robberPinned: "Der Räuber bleibt, bis die Barbaren zum ersten Mal landen.",
  phaseNeutral: "Neutrale Figur setzen",
  phaseSwap: "Karten zurückgeben",
  phaseDisplaced: "Vertriebenen Ritter versetzen",
  phaseProgress: "Fortschrittskarte",
  phaseEvent: "Ereignis",
  drawCard: "Karte aufdecken",
  eventCard: "Ereigniskarte",
  pickOwnCard: "Welche Karte gibst du ab?",
  pickFreeCard: "Welchen Rohstoff nimmst du aus dem Vorrat?",
  pickBreakRoad: "Welche deiner Straßen wird quergestellt?",
  pickDrawFrom: "Bei wem ziehst du eine Karte?",
  pickGiftTo: "Wem schenkst du sie?",
  repair: "Straße reparieren",
  repairHint:
    "Eine deiner Straßen liegt quer. Bis sie repariert ist, kannst du keine neue Straße bauen.",
  eventWaiting: (name: string): string => `${name} beantwortet die Karte.`,

  roll: "Würfeln",
  rolled: (sum: number, a: number, b: number): string => `${sum} (${a} + ${b})`,
  endTurn: "Zug beenden",

  placeTown: "Setze eine Siedlung auf eine freie Kreuzung.",
  placeRoad: "Lege eine Straße an deine neue Siedlung.",
  pickRobber: "Setze den Räuber auf ein anderes Feld.",
  pickVictim: "Von wem ziehst du eine Karte?",
  pickMonopol: "Welchen Rohstoff nimmst du allen ab?",
  pickGift: (left: number): string =>
    left === 1
      ? "Nimm noch 1 Rohstoff aus dem Vorrat."
      : `Nimm ${left} Rohstoffe aus dem Vorrat.`,
  freeRoads: (left: number): string =>
    left === 1
      ? "Noch 1 kostenlose Straße."
      : `Noch ${left} kostenlose Straßen.`,

  discardHead: (count: number): string => `Du musst ${count} Karten abgeben.`,
  discardHint:
    "Mehr als 7 Karten auf der Hand - die Hälfte geht zurück in den Vorrat.",
  discardDo: (count: number): string => `${count} Karten abgeben`,
  discardWaiting: (name: string): string => `${name} gibt Karten ab.`,

  build: "Bauen",
  buildRoad: "Straße",
  buildTown: "Siedlung",
  buildCity: "Stadt",
  buyCard: "Entwicklungskarte",
  buildHint:
    "Tippe direkt auf das Spielfeld: Weg für eine Straße, Kreuzung für eine Siedlung, eigene Siedlung für eine Stadt.",
  cardsLeft: (count: number): string => `${count} Karten im Stapel`,

  hand: "Deine Rohstoffe",
  cards: "Deine Entwicklungskarten",
  noCards: "Noch keine Entwicklungskarten.",
  freshCard: "Diesen Zug gekauft",
  play: "Ausspielen",

  bank: "Vorrat und Häfen",
  bankGive: "Abgeben",
  bankWant: "Dafür nehmen",
  bankDo: (rate: number): string => `${rate}:1 tauschen`,
  bankRate: (rate: number): string => `${rate}:1`,
  harbours: "Deine Häfen",
  noHarbours: "Noch kein Hafen.",
  harbourAny: "3:1 beliebig",
  harbourOf: (sort: string): string => `2:1 ${sort}`,

  offer: "Angebot an die anderen",
  offerGive: "Du gibst",
  offerWant: "Du bekommst",
  offerSend: "Anbieten",
  offerOpen: (name: string): string => `${name} bietet:`,
  offerFor: (give: string, want: string): string => `${give} gegen ${want}`,
  offerYes: "Annehmen",
  offerNo: "Ablehnen",
  offerWithdraw: "Zurückziehen",
  offerWaiting: (name: string): string => `Warte auf ${name}.`,
  offerTakers: "Angenommen von:",
  offerNobody: "Niemand nimmt an.",
  offerDeal: (name: string): string => `Mit ${name} tauschen`,
  offerLimit: "Für diesen Zug sind genug Angebote gemacht.",

  standings: "Spieler",
  points: (count: number): string =>
    count === 1 ? "1 Siegpunkt" : `${count} Siegpunkte`,
  handCount: (count: number): string =>
    count === 1 ? "1 Karte" : `${count} Karten`,
  devCount: (count: number): string =>
    count === 1 ? "1 Entwicklungskarte" : `${count} Entwicklungskarten`,
  knightCount: (count: number): string =>
    count === 1 ? "1 Ritter" : `${count} Ritter`,
  routeTile: "Längste Handelsroute",
  armyTile: "Größte Rittermacht",
  routeLength: (count: number): string => `${count} Straßen`,
  hiddenPoints: "Verdeckte Siegpunkte zählen erst beim Sieg.",

  won: (name: string): string => `${name} gewinnt!`,
  youWon: "Du gewinnst!",
  finalPoints: "Endstand",

  target: "Siegpunkte zum Sieg",
  variants: "Varianten",
  variantsHint:
    "Aus Händler & Barbaren. Sie lassen sich beliebig miteinander kombinieren - die Anleitung sagt das ausdrücklich.",
  harbourTile: "Stärkste Häfen",
  harbourPoints: (count: number): string =>
    count === 1 ? "1 Hafenpunkt" : `${count} Hafenpunkte`,
  robberSpared: "Wer höchstens 2 Siegpunkte hat, wird vom Räuber verschont.",
  players: "Spieler",
  crewHint:
    "Ab 5 Personen kommt die 5-6 Personen Erweiterung dazu: 30 Landschaftsfelder, zwei Wüsten - und ein Spielzug, den sich zwei teilen.",
  stoneOne: "Stein 1",
  stoneTwo: "Stein 2",
  stoneTwoHint:
    "Mit Stein 2: bauen, mit dem Vorrat tauschen und 1 Entwicklungskarte - aber nicht mit den anderen handeln.",
  settingsSaved: "Gespeichert.",
  online: "Online spielen",
  onlineIntro: "Siedeln, handeln, bauen - jede:r am eigenen Gerät.",
} as const;

/** What each resource is called. */
export const SORT_NAMES: Readonly<Record<Resource, string>> = {
  lehm: "Lehm",
  holz: "Holz",
  wolle: "Wolle",
  getreide: "Getreide",
  erz: "Erz",
};

/** What each landscape is called. */
export const LAND_NAMES: Readonly<Record<string, string>> = {
  lehm: "Hügelland",
  holz: "Wald",
  wolle: "Weideland",
  getreide: "Ackerland",
  erz: "Gebirge",
  wueste: "Wüste",
};

/** What each development card is called. */
export const CARD_NAMES: Readonly<Record<DevKind, string>> = {
  ritter: "Ritter",
  siegpunkt: "Siegpunkt",
  monopol: "Monopol",
  strassenbau: "Straßenbau",
  erfindung: "Erfindung",
};

/** What each development card does, in one line. */
export const CARD_TEXTS: Readonly<Record<DevKind, string>> = {
  ritter: "Versetze den Räuber und ziehe eine Karte.",
  siegpunkt: "1 Siegpunkt - zählt am Ende von selbst.",
  monopol: "Alle geben dir jede Karte eines Rohstoffs.",
  strassenbau: "Baue zwei Straßen kostenlos.",
  erfindung: "Nimm zwei Rohstoffe aus dem Vorrat.",
};

/** What each variant is called, and what it changes. */
export const VARIANT_TEXTS: Readonly<
  Record<string, { readonly label: string; readonly hint: string }>
> = {
  raeuber: {
    label: "Freundlicher Räuber",
    hint: "Der Räuber verschont alle, die höchstens 2 Siegpunkte haben. Gut mit Kindern.",
  },
  ereignisse: {
    label: "Ereignisse auf Catan",
    hint: "37 Karten ersetzen die Würfel - genau die Wahrscheinlichkeiten zweier Würfel, dazu 11 Ereignisse von Seuche bis Erdbeben.",
  },
  haefen: {
    label: "Die Häfen von Catan",
    hint: "Siedlung am Hafen 1 Punkt, Stadt 2. Ab 3 Punkten gibt es die Tafel Stärkste Häfen (2 Siegpunkte) - und ein Siegpunkt mehr zum Sieg.",
  },
};

/** What each colour is called. */
export const COLOUR_NAMES: Readonly<Record<string, string>> = {
  rot: "Rot",
  blau: "Blau",
  orange: "Orange",
  weiss: "Weiß",
};
