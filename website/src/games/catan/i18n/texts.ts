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
  chipBarbarian: (price: number): string => `Barbar versetzen (${price})`,
  knightIn: "Ritter abgeben (+2 Chips)",
  giveBackHint: (count: number): string => `Gib ${count} Karte(n) zurück.`,
  giveBack: "Zurückgeben",
  scenarioTitle: "Szenario",
  scenarioHint:
    "Ein Szenario ändert das Brett: Fischfang legt einen See aus, die Flüsse ziehen Wasser über die Insel, der Handelstross setzt Nomaden in die Mitte, der Barbarenüberfall baut die Insel neu, die Neue Welt macht eine Inselwelt daraus, und Entdecker & Piraten legt zwei Drittel davon verdeckt aus - in den Piratenlagern mit sechs Lagern darin.",
  scenarioName: (scenario: string): string =>
    scenario === "fischer"
      ? "Fischfang auf Catan"
      : scenario === "fluesse"
        ? "Die Flüsse von Catan"
        : scenario === "karawane"
          ? "Der Handelstross"
          : scenario === "barbaren"
            ? "Der Barbarenüberfall"
            : scenario === "handel"
              ? "Händler & Barbaren"
              : scenario === "neuewelt"
                ? "Seefahrer: Neue Welt"
                : scenario === "entdecker"
                  ? "Entdecker & Piraten: Land in Sicht"
                  : scenario === "piraten"
                    ? "Entdecker & Piraten: Die Piratenlager"
                    : scenario === "fische"
                      ? "Entdecker & Piraten: Fische für Catan"
                      : scenario === "gewuerze"
                        ? "Entdecker & Piraten: Gewürze für Catan"
                        : scenario === "finale"
                          ? "Entdecker & Piraten: Das Finale"
                          : scenario === "ufer"
                            ? "Seefahrer: Zu neuen Ufern"
                            : scenario === "inseln"
                              ? "Seefahrer: Die vier Inseln"
                              : scenario === "ozeanien"
                                ? "Seefahrer: Ozeanien"
                                : scenario === "wuestengurt"
                                  ? "Seefahrer: Durch die Wüste"
                                  : scenario === "stamm"
                                    ? "Seefahrer: Der vergessene Stamm"
                                    : scenario === "stoffe"
                                      ? "Seefahrer: Stoffe für Catan"
                                      : scenario === "pirateninseln"
                                        ? "Seefahrer: Die Pirateninseln"
                                        : scenario === "wunder"
                                          ? "Seefahrer: Die Catanischen Wunder"
                                          : "Ohne Szenario",
  scenarioText: (scenario: string): string =>
    scenario === "fischer"
      ? "See, Fischgründe und Fischplättchen - und der Alte Schuh."
      : scenario === "fluesse"
        ? "Zwei Flüsse, Brücken und Gold - und die Plättchen für den Reichsten und die Armen."
        : scenario === "karawane"
          ? "Drei Handelstrosse, über die der Tisch abstimmt - bis 12 Siegpunkte."
          : scenario === "barbaren"
            ? "Barbaren an der Küste, Ritter aus der Burg, kein Räuber - bis 12 Siegpunkte."
            : scenario === "handel"
              ? "Trosswagen, Zielfelder und Wegzoll - bis 13 Siegpunkte."
              : scenario === "neuewelt"
                ? "Eine Inselwelt: Schiffe, Seeräuber und Goldflüsse - bis 12 Siegpunkte."
                : scenario === "entdecker"
                  ? "Fahrende Schiffe, ein unentdecktes Meer, Entdecker und Hafensiedlungen - bis 8 Siegpunkte."
                  : scenario === "piraten"
                    ? "Sechs Piratenlager, Einheiten, Piratenschiffe und die Missionsleiste - bis 12 Siegpunkte."
                    : scenario === "fische"
                      ? "Zwei Missionen: Piratenlager und Fischschwärme für den Catanischen Rat - bis 15 Siegpunkte."
                      : scenario === "gewuerze"
                        ? "Fische und Gewürze: sechs Dörfer mit dauerhaften Vorteilen - bis 15 Siegpunkte."
                        : scenario === "finale"
                          ? "Alle drei Missionen: Piratenlager, Fische und Gewürze - bis 17 Siegpunkte."
                          : scenario === "ufer"
                            ? "Eine große Insel, kleine Inseln mit Gold: die erste Siedlung auf jeder zählt 3 - bis 14 Siegpunkte."
                            : scenario === "inseln"
                              ? "Vier gleich große Inseln, überall gegründet: jede fremde Insel zählt 3 - bis 13 Siegpunkte."
                              : scenario === "ozeanien"
                                ? "Zwei Startinseln und ein Nebelmeer: Straßen und Schiffe lichten den Nebel - bis 12 Siegpunkte."
                                : scenario === "wuestengurt"
                                  ? "Ein Wüstengürtel trennt einen Landstreifen ab, im Osten warten Goldinseln - bis 14 Siegpunkte."
                                  : scenario === "stamm"
                                    ? "Bewohnte Inseln voller Geschenke: Chips, Karten und Häfen an ihren Küsten - bis 13 Siegpunkte."
                                    : scenario === "stoffe"
                                      ? "Acht Dörfer handeln Stoff: Schiffslinien hinschicken, je 2 Ballen sind 1 Punkt - bis 14 Siegpunkte."
                                      : scenario === "pirateninseln"
                                        ? "Eine Piratenflotte kreist, Ritterkarten werden Kriegsschiffe: Festung erobern und 10 Siegpunkte."
                                        : scenario === "wunder"
                                          ? "Fünf Bauwerke in je vier Stufen: wer eines vollendet, gewinnt sofort."
                                          : "Die Insel wie gedruckt.",
  findTitle: "Entdecker & Piraten",
  findGold: (count: number): string => `Gold: ${count}`,
  findFleet: (boats: number, scouts: number, ports: number): string =>
    `Vorrat: ${boats} Schiffe, ${scouts} Entdecker, ${ports} Hafensiedlungen`,
  findBuild:
    "Schiff 1 Holz + 1 Wolle · Entdecker 1 Lehm 1 Holz 1 Wolle 1 Getreide · Hafensiedlung 2 Getreide + 2 Erz",
  findHelm: "Wähle ein Schiff, das fahren soll.",
  findSail: (left: number): string =>
    `Noch ${left} Bewegungspunkte - tippe die nächste Kante an.`,
  findWind: "+2 Bewegungspunkte (1 Wolle)",
  findFound: "Ein Entdeckerschiff kann hier eine Siedlung gründen.",
  findNoBoat: "Keine Schiffe unterwegs.",
  huntPirate: (rolls: string): string =>
    `Piratenschiff verjagen (Würfel: ${rolls})`,
  corsairHint: "Setze dein Piratenschiff auf ein Meerfeld.",
  campTitle: "Piratenlager",
  campUnits: (left: number): string => `Einheiten im Vorrat: ${left}`,
  campTaken: (taken: number, all: number): string =>
    `Erobert: ${taken} von ${all} entdeckten Lagern`,
  campMission: (step: number, points: number): string =>
    `Missionsleiste: Feld ${step} (${points} Siegpunkte)`,
  campCost: "Einheit 1 Wolle + 1 Erz - je 3 erobern ein Lager.",
  assaultFort: (guns: number): string =>
    `Piratenfestung angreifen (${guns} Kriegsschiff${guns === 1 ? "" : "e"})`,
  wonderStart: (name: string): string => `${name} beginnen`,
  wonderNext: (name: string, stage: number): string =>
    `${name}: ${stage}. Stufe bauen`,
  unloadCargo: (cargo: string): string => `${cargo} abräumen`,
  cargoName: (cargo: string): string =>
    cargo === "entdecker"
      ? "Entdecker"
      : cargo === "einheit"
        ? "Einheit"
        : cargo === "fisch"
          ? "Fischschwarm"
          : "Gewürzsack",
  recallBoat: (loaded: boolean): string =>
    loaded
      ? "Beladenes Schiff abräumen (Ladung verloren)"
      : "Schiff abräumen und neu bauen",
  castFish: "Fischschwarm einwürfeln (1 Würfel)",
  shoalTitle: "Fische für Catan",
  shoalStock: (left: number, water: number): string =>
    `Fischschwärme: ${left} im Vorrat, ${water} auf dem Wasser`,
  shoalTrack: (step: number, points: number): string =>
    `Missionsleiste Fische: Feld ${step} (${points} Siegpunkte)`,
  sellSpice: (what: string): string => `${what} ins Dorf verkaufen (1 Gold)`,
  spiceTitle: "Gewürze für Catan",
  spiceTrack: (step: number, points: number): string =>
    `Missionsleiste Gewürze: Feld ${step} (${points} Siegpunkte)`,
  spiceFriends: (what: string): string => `Befreundete Dörfer: ${what}`,
  spiceNone: "Noch kein Dorf befreundet.",
  spiceHow:
    "Einheit mit einem Schiff an einem Dorf absetzen: dafür 1 Gewürzsack und den Vorteil des Dorfes - abliefern beim Catanischen Rat.",
  spiceGift: (gift: string): string =>
    gift === "fahrt"
      ? "Schnelle Fahrt (+1 Bewegungspunkt)"
      : gift === "pirat4"
        ? "Piratenbonus (verjagt auch mit 4)"
        : gift === "pirat5"
          ? "Piratenbonus (verjagt auch mit 5)"
          : "Gutes Gold (1 Rohstoff → 1 Gold je Zug)",
  shoalHow:
    "Schwarm mit einem Schiff aufnehmen (belegt das ganze Schiff) und an einem Anker des Catanischen Rats abliefern.",
  findAfloat: (count: number): string => `${count} Schiff(e) unterwegs.`,
  tableTitle: "Am Tisch",
  tableUnknown: "Die gastgebende Person hat noch nichts eingestellt.",
  seaTitle: "Seefahrt",
  seaShips: (left: number): string => `Schiffe im Vorrat: ${left}`,
  wonderNone: "Noch kein Catanisches Wunder begonnen.",
  wonderMine: (name: string, stage: number, all: number): string =>
    `${name}: Stufe ${stage} von ${all}`,
  wonderOpen: (list: string): string => `Noch frei: ${list}`,
  wonderHow:
    "Eine Stufe kostet 5 Rohstoffe; die vierte gewinnt sofort. Wer 10 Siegpunkte hat und weiter gebaut hat als alle anderen, gewinnt ebenfalls.",
  seaCloth: (count: number, points: number): string =>
    `Stoffballen: ${count} (${points} Siegpunkt${points === 1 ? "" : "e"})`,
  seaVillages: (mine: number, left: number): string =>
    `Handelsbeziehungen: ${mine} · Dörfer mit Ballen: ${left}`,
  seaClothHow:
    "Eine Schiffslinie von einer eigenen Siedlung zu einem Dorf bringt sofort 1 Ballen und bei jedem Wurf der Dorfzahl 1 weiteren.",
  seaChips: (count: number, worth: number): string =>
    `Insel-Chips: ${count} (je ${worth} Siegpunkt${worth === 1 ? "" : "e"})`,
  seaMoved: "Ein Schiff ist diese Runde schon versetzt worden.",
  seaPick: "Tippe eines deiner Schiffe an, um es zu versetzen.",
  seaTo:
    "Wohin? Überall dorthin, wo auch ein neues Schiff gebaut werden dürfte.",
  seaHint: "Schiff bauen (1 Holz + 1 Wolle): Tippe eine Wasserkante an.",
  pirateHint:
    "Versetze den Seeräuber auf ein Meerfeld - oder den Räuber auf eine Landschaft.",
  goldPickHint: "Goldfluss: Suche dir einen Rohstoff aus.",
  goldPickWho: (name: string): string => `${name} wählt am Goldfluss.`,
  haulTitle: "Trosswagen",
  haulGold: (count: number): string => `Gold: ${count}`,
  haulEmpty: "Keine Ladung - fahre zu einem Zielfeld.",
  haulLoad: (ware: string, target: string): string =>
    `Ladung: ${ware} → ${target}`,
  haulDelivered: (count: number): string =>
    `Abgeliefert: ${count} (je 1 Siegpunkt)`,
  haulMoves: (count: number): string => `${count} Bewegungspunkte`,
  haulBoost: "+2 für 1 Getreide",
  haulStep: (step: number, all: number): string =>
    `Wagen-Tableau: Stufe ${step} von ${all}`,
  haulTableau: (moves: number, gold: number): string =>
    `${moves} Bewegungspunkte, ${gold} Gold je Lieferung`,
  haulFight: (numbers: string): string => `Barbar vertreiben bei ${numbers}`,
  haulNoFight: "Barbaren vertreiben ab Stufe 2",
  haulUpgrade: (price: string): string => `Ausbauen (${price})`,
  haulCards: (count: number): string => `Entwicklungskarten (${count})`,
  haulNoCards: "Keine Karten.",
  driveHint: "Fahre den Trosswagen: Tippe eine Nachbarkreuzung an.",
  shiftHint: "Setze den Barbaren auf einen Weg oder eine Straße.",
  postCastle: "Setze einen Ritter auf einen freien Weg des Burgfeldes.",
  postAnywhere: "Setze einen Ritter auf einen beliebigen freien Weg.",
  barbTake: (count: number): string =>
    `Nimm ${count} Barbar(en) von einem Küstenfeld.`,
  barbPut: (count: number): string =>
    `Setze ${count} Barbar(en) auf ein noch freies Küstenfeld.`,
  rideHint: "Ritter bewegen: Wähle einen deiner Ritter.",
  rideTo: "Wohin? Bis 3 Wege weit - oder 5 für 1 Getreide.",
  rideFar: "Weit ziehen (1 Getreide)",
  raidTitle: "Barbaren",
  raidLeft: (count: number): string => `${count} Barbaren im Vorrat`,
  raidCard: (name: string): string => `Karte: ${name}`,
  knightsHeld: (count: number): string => `Ritter im Vorrat: ${count}`,
  prisonersHeld: (count: number): string =>
    `Gefangene: ${count} (je 2 = 1 Siegpunkt)`,
  coastLost: (count: number): string => `${count} erobertes/e Küstenfeld(er)`,
  voteTitle: "Abstimmung: Trosswagen",
  voteHint: (spots: number): string =>
    `Wolle und Getreide sind die Stimmen. ${spots} Position(en) stehen zur Wahl.`,
  voteCards: (count: number): string =>
    count === 0 ? "-" : `${count} Stimme(n)`,
  voteWaiting: "Die Abstimmung läuft.",
  voteWho: (name: string): string => `${name} ist an der Reihe.`,
  voteOnBoard: "Tippe auf dem Brett die Position an, die du willst.",
  wagonOnBoard: "Du entscheidest: Tippe an, wohin der Trosswagen kommt.",
  layCards: (count: number): string => `${count} Karte(n) auslegen`,
  layPass: "Nichts auslegen",
  goldTitle: (count: number): string => `Gold (${count})`,
  goldBuy: (what: string, price: number): string => `${what} (${price} Gold)`,
  goldSell: (what: string, rate: number): string => `${rate} ${what} → 1 Gold`,
  goldBuysLeft: (left: number): string =>
    `Noch ${left} Kauf/Käufe in diesem Zug.`,
  goldNone:
    "Noch kein Gold. Straßen und Siedlungen am Fluss bringen welches ein.",
  richestTile: "Reichster Cataner (+1)",
  poorestTile: "Armer Cataner (−2)",
  bridgeBuild: (left: number): string =>
    `Brücke (2 Lehm, 1 Holz) - noch ${left}`,
  bridgeHint:
    "Eine Brücke geht nur auf einen der 7 Brückenbauplätze, muss an dein Netz anschließen und bringt 3 Gold.",
  modeTitle: "Spiel",
  modeHint:
    "Städte & Ritter ersetzt die Entwicklungskarten, würfelt mit drei Würfeln und geht bis 13 Siegpunkte.",
  modeName: (mode: string): string =>
    mode === "ritter" ? "Städte & Ritter" : "CATAN - Das Spiel",
  modeText: (mode: string): string =>
    mode === "ritter"
      ? "Handelswaren, Stadtausbau, Ritter und die Barbaren."
      : "Das gedruckte Grundspiel.",
  fishTitle: (total: number): string => `Fische (${total})`,
  noFish: "Noch keine Fischplättchen.",
  fishBuy: (what: string, price: number): string => `${what} (${price})`,
  shoeHint: "Alten Schuh weitergeben an:",
  shoeStuck: "Niemand liegt gleichauf oder vorn.",
  faceDownCard: "verdeckt",
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
  see: "See",
  sumpf: "Sumpf",
  wasserstelle: "Wasserstelle",
  burg: "Burgfeld",
  ziel: "Zielfeld",
  meer: "Meer",
  gold: "Goldfluss",
  unbekannt: "Unentdecktes Feld",
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
