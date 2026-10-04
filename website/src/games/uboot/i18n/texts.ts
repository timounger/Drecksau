/**
 * German user-facing texts for "U-Boot".
 *
 * @module
 */

/** Everything the screens say. */
export const UBOOT_TEXTS = {
  title: "U-Boot",
  subtitle: "Journey to the Deep",
  // Header
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild beenden",
  statistics: "Statistik",
  settings: "Einstellungen",
  // Seekarte
  mapHint: "Wähle ein Gewässer. Freigetaucht wird eines nach dem anderen.",
  course: "Kurs",
  mastered: "geschafft",
  worth: (points: number) => `+${points} EP`,
  lockedHint: "Erst alle Gewässer davor abschließen.",
  points: (spare: number, all: number) =>
    `${spare} EP frei - ${all} EP gesammelt`,
  spendable: (spare: number) => `${spare} EP frei`,
  encyclopedia: "Enzyklopädie",
  upgrades: "Verbesserungen",
  trophies: "Erfolge",
  awardNew: "Erfolg freigeschaltet",
  comingSoon: "kommt noch",
  // Tauchgang
  startHint:
    "Vorwärts drücken zum Ablegen - D, Pfeil rechts, oder links ins Bild fassen und nach rechts ziehen.",
  startHintTouch:
    "Links ins Bild fassen: Dort geht das Steuerkreuz unter deinem Daumen auf. Ziehen steuert - nach rechts ziehen legt ab.",
  startHintTouchAim:
    "Rechts tippen schießt dorthin. Rechts halten oder der Knopf unten legt eine Seemine.",
  wrecked: "Hülle durchschlagen",
  wreckedHint: (share: number) =>
    `${share} % des Kurses geschafft. Der Affe hat es gesehen.`,
  drowned: "Luft alle",
  drownedHint: (share: number) =>
    `${share} % des Kurses geschafft. Ein größerer Tank hätte gereicht.`,
  again: "Noch einmal",
  arrived: "Durchgetaucht",
  arrivedIn: (time: string) => `${time} bis ans andere Ende.`,
  earned: (points: number) => `+${points} Erfahrungspunkte`,
  capped:
    "Dein Konto ist voll: Mehr Punkte, als das ganze Boot kostet, gibt es nicht.",
  earnedAgain: "Wiederholung - es gibt einen Teil der Punkte.",
  carryOnToMap: "Weiter",
  allDone: "Alle Gewässer getaucht. Der Affe nickt kurz.",
  toMap: "Zurück zur Seekarte",
  // Pause
  pause: "Pause",
  paused: "Pausiert",
  resume: "Weiter tauchen",
  repeat: "Kurs wiederholen",
  // Steuerung
  controls: "Steuerung",
  controlsHint:
    "W auftauchen - S abtauchen - A zurück - D vorwärts. Linksklick zielt und feuert, Rechtsklick legt eine Seemine. Auf dem Telefon: links im Bild ziehen zum Steuern, rechts tippen zum Feuern, rechts halten für eine Seemine.",
  up: "Auftauchen",
  down: "Abtauchen",
  back: "Zurück",
  forward: "Vorwärts",
  fire: "Feuern",
  layMine: "Seemine",
  // Endlosmodus
  deepName: "Der Schlund",
  deepTag: "ohne Boden",
  deepHint:
    "Immer offen, immer das beste Boot: eine große Karte, Gegner ohne Ende, und die Frage, wie tief du kommst.",
  deepPick: "Wie willst du tauchen?",
  deepSolo: "Einzelspieler",
  deepSoloHint: "Allein so weit wie möglich.",
  deepCoop: "Koop online",
  deepCoopHint:
    "Zu zweit per Raumcode - wer stirbt, ist in der nächsten Stufe wieder dabei.",
  deepStage: (stage: number) => `Stufe ${stage}`,
  deepLeft: (many: number) =>
    many === 1 ? "Noch 1 Bewohner" : `Noch ${many} Bewohner`,
  deepKills: (many: number) => `${many} erledigt`,
  deepStart:
    "Bewege dich, dann geht es los - W A S D, oder links ins Bild fassen.",
  deepCleared: (stage: number) => `Stufe ${stage} leergeräumt`,
  deepDeeper: "Eine Stufe tiefer …",
  deepOver: "Untergegangen",
  deepReached: (stage: number, kills: number) =>
    `Stufe ${stage} erreicht, ${kills} Bewohner erledigt.`,
  deepAgain: "Noch einmal",
  deepDown: "Dein Mitfahrer liegt unten - die nächste Stufe bringt ihn zurück.",
  deepWaitingPartner: "Warte auf den Mitfahrer …",
  deepBoons:
    "Gegner lassen manchmal etwas fallen: Schild, Schnellfeuer, Fächerschuss - und im Koop die Rettung.",
  // Einstellungen
  musicVolume: "Musiklautstärke",
  soundVolume: "Soundlautstärke",
  volumeHint:
    "Das Brummen der Tiefe und die Geräusche des Bootes lassen sich getrennt einstellen. Null ist stumm.",
  wipe: "Spielstand zurücksetzen",
  wipeTitle: "Von vorn anfangen",
  wipeHint:
    "Löscht Punkte, Verbesserungen und alle gemeisterten Gewässer. Das lässt sich nicht rückgängig machen.",
  openAll: "Alles freischalten",
  openAllTitle: "Abkürzung",
  openAllHint:
    "Öffnet jedes Gewässer, setzt jede Verbesserung auf die höchste Stufe und legt Punkte dazu. Zum Ausprobieren - der Weg dorthin entfällt damit.",
  sure: "Ja, machen",
  // Werkstatt
  back2: "Zurück",
  close: "Schließen",
  pointsFree: "EP frei",
  pickOne: "Tippe eine Verbesserung an, um zu sehen, was sie tut.",
  install: "Einbauen",
  tapAgain: "Nochmal tippen und es ist eingebaut",
  buyAll: "Alles freischalten",
  orDouble: "oder Doppelklick auf das Feld",
  missing: (points: number) => `Es fehlen noch ${points} EP`,
  done: "Fertig",
  alreadyHad: "schon freigeschaltet",
  firstBelow: "erst die Stufe darunter",
  workshopHint: "Punkte ausgeben - jederzeit umverteilbar.",
  backToMap: "Zurück zur Seekarte",
  nowHas: "Jetzt:",
  next: "Nächste Stufe:",
  buy: (cost: number) => `Für ${cost} EP freischalten`,
  maxed: "Voll ausgebaut",
  tooDear: "Dafür reichen die Punkte noch nicht.",
  reset: "Zurücksetzen",
  resetTitle: "Alles zurückholen",
  resetHint:
    "Setzt jede Stufe auf null und gibt dir sämtliche Punkte zurück. Gesammelte Punkte und gemeisterte Gewässer bleiben.",
  // Schwierigkeit
  gradeTitle: "Schwierigkeit",
  gradeHint:
    "Wirkt beim nächsten Tauchgang: Das Fenster läuft schneller, und es lebt mehr da unten. Die Karte bleibt dieselbe - und was du auf einer Stufe geschafft hast, bleibt dir.",
  gradeDone: (name: string) => `Geschafft auf ${name}`,
  gradeBest: (name: string) => `Bestleistung: ${name}`,
  gradeNew: "Neue Bestleistung!",
  gradeNever: "noch nie geschafft",
  // Bestenliste
  boardTitle: (name: string) => `Bestenliste - ${name}`,
  boardSubtitle:
    "Die zehn schnellsten Durchfahrten. Ein Platz je Name, und das ist die beste Fahrt.",
  boardEmpty: "Noch keine Zeit eingetragen - deine könnte die erste sein.",
  boardLoading: "Bestenliste wird geladen …",
  boardFailed: "Bestenliste nicht erreichbar.",
  boardYours: "Dein Tauchgang",
  boardMadeIt: (place: number) =>
    `Platz ${place} - trag deinen Namen ein und du stehst auf der Liste.`,
  boardMissed: "Diesmal nicht unter den besten zehn. Die aktuelle Liste:",
  boardKept: (best: string) =>
    `Deine Bestzeit ${best} steht schon auf der Liste - dieser Tauchgang war langsamer. Jeder Name hat einen Platz, und das ist seine beste Fahrt.`,
  boardPartial:
    "Nur durchgetauchte Gewässer kommen in die Liste - für diesen Versuch gibt es keine Zeit.",
  boardEnter: "Eintragen",
  boardEntering: "Wird eingetragen …",
  boardEntered: "Eingetragen!",
  boardNamePlaceholder: "Dein Name",
  boardStart: "Tauchgang starten",
  /** Wie die vier Sorten Wasser heißen, für das Blatt vor dem Tauchgang. */
  tierName: {
    easy: "Offenes Wasser",
    cave: "Höhle",
    deep: "Finstere Tiefe",
    final: "Die letzte Fahrt",
  },
  // Das Blatt vor dem Tauchgang
  briefBest: "Bisher geschafft auf",
  briefAwaits: "Dich erwarten",
  briefMines: "Treibminen",
  briefBrittle: "Bruchfels",
  briefPodium: "Die drei schnellsten",
  briefOpen: "noch frei",
  briefNoneYet: "Von dir steht hier noch keine Zeit.",
  briefAllTen: "Alle zehn Plätze zeigen",
  boardBack: "Zurück zur Seekarte",
  boardNote:
    "Auf höherer Schwierigkeit läuft das Wasser schneller - die besten Zeiten entstehen dort.",
  resetYes: "Ja, alles zurücksetzen",
  resetNo: "Doch nicht",
  awardsCount: (got: number, all: number) =>
    `${got} von ${all} Auszeichnungen freigeschaltet.`,
  awardGot: "geschafft",
  awardOpen: "noch offen",
  bossFight: "Der Wächter",
} as const;
