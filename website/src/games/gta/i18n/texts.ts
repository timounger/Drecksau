/**
 * Everything GTA says on screen.
 *
 * @module
 */

/** The four quarters of town, by name. */
export const DISTRICT_NAMES: Readonly<Record<string, string>> = {
  grove: "Grove Street",
  ballas: "Idlewood",
  vagos: "East Beach",
  beach: "Santa Maria",
};

/** A share written out of a hundred. */
const PERCENT = 100;

/** Every line the screen shows. */
export const GTA_TEXTS = {
  title: "GTA",
  tagline: "Los Santos von schräg oben: fahren, liefern, überfallen, abhauen.",
  newGame: "Neues Spiel",
  god: "Cheat-Modus",
  dayLabel: "Tag und Nacht",
  dayHint:
    "Uhrzeit oben rechts, und die Stadt wird abends dunkel. Standardmäßig aus.",
  dayOn: "An",
  dayOff: "Aus",
  dayHours: "Ein ganzer Tag dauert 24 Minuten.",
  settingsTitle: "GTA - Einstellungen",
  backToGame: "Zurück zum Spiel",
  zoomLabel: "Wie nah die Kamera steht",
  zoomHint:
    "Je näher, desto größer sind Figur, Autos und Häuser - und desto weniger Straße siehst du kommen. Die Geschwindigkeiten bleiben gleich.",
  zoomBlocks: (blocks: number): string =>
    `${String(blocks).replace(".", ",")} Blöcke breit`,
  loadingTitle: "Los Santos wird aufgebaut",
  loadingDone: (part: number): string => `${Math.round(part * PERCENT)} %`,
  /**
   * What the loading screen claims to be doing, by the piece of work it is on.
   *
   * @remarks
   * **All of it true, none of it serious.** The pieces are the real ones -
   * `buildGame` hands over which one it has just finished - and every line
   * under a key describes that piece; which of them one gets is drawn fresh
   * each time the screen comes up, so the wait is not the same joke twice.
   */
  loadingLines: {
    floor: [
      "Straßen werden betoniert",
      "Meer wird eingelassen",
      "Palmen werden eingepflanzt",
      "Häuser werden hochgezogen",
      "Bordsteine werden abgesenkt",
      "Der Bucht wird Wasser nachgefüllt",
      "Brücke wird zweimal gestrichen",
      "Der Berg wird aufgeschüttet",
      "Schlaglöcher werden vorgebohrt",
    ],
    traffic: [
      "Ampeln werden auf Rot gestellt",
      "Blinker werden eingebaut (und nie benutzt)",
      "Schlaglöcher werden verteilt",
      "Die Rechts-vor-links-Regel wird abgeschafft",
      "Jemand parkt in zweiter Reihe",
      "Die Hupe wird lauter gedreht",
      "Der Stau wird vorgewärmt",
      "Die letzte Parklücke wird vergeben",
    ],
    parked: [
      "Parkplätze werden zugeparkt",
      "Handbremsen werden angezogen",
      "Falschparker werden ausgewählt",
      "Zündschlüssel werden steckengelassen",
      "Die Alarmanlagen werden ausgeschaltet",
      "Ein DeLorean wird poliert",
      "Autoschlüssel unter die Matte",
    ],
    service: [
      "Streifenwagen holen noch Kaffee",
      "Krankenwagen wird aufgetankt",
      "Blaulichter werden eingeschraubt",
      "Die Feuerwehr wäscht den Wagen",
      "Funkgeräte werden auf Rauschen gestellt",
      "Die Wache bestellt Pizza",
      "Der Löschzug wird rückwärts eingeparkt",
    ],
    people: [
      "Hunde werden angeleint",
      "Sonnenbrillen werden verteilt",
      "Penner suchen sich eine Bank",
      "Jogger laufen sich warm",
      "Möwen werden auf den Steg gesetzt",
      "Touristen werden falsch eingewiesen",
      "Jemand sucht sein Auto",
      "Die Katzen werden ausgesetzt",
    ],
    crowds: [
      "Gangs teilen die Ecken auf",
      "Vor dem Club wird Schlange gestanden",
      "Supermarkt füllt die Regale",
      "Der Türsteher übt sein Kopfschütteln",
      "Die Einkaufswagen werden verknotet",
      "Am Hafen wird angelegt",
      "Der DJ sucht das Kabel",
    ],
    gaol: [
      "Die Gitter werden angefeilt",
      "Im Gefängnishof wird der Sand geharkt",
      "Der Wärter sucht seinen Schlüsselbund",
      "Ein Löffel wird unter der Matratze versteckt",
      "Die Scheinwerfer auf den Türmen werden geputzt",
      "Der Fluchtwagen parkt schon mal vor dem Tor",
      "Die Zellentür wird geölt (leise)",
      "Die Hofrunde wird eingeübt",
    ],
    bank: [
      "Der Tresor wird zugeschlossen",
      "Die Scheine werden gebündelt",
      "Die Kamera in der Schalterhalle schaut weg",
      "Die Alarmanlage bekommt eine Pause",
      "Der Filialleiter zählt noch einmal nach",
      "Die Geiseln werden geduzt",
      "Jemand füllt die Beutel mit dem Dollarzeichen",
      "Die Zeitschaltuhr am Tresor wird gestellt",
    ],
    mint: [
      "Die Farbe wird angerührt",
      "Die Scheine kommen frisch von der Walze",
      "Die Wasserzeichen werden vergessen",
      "Der Papiervorrat wird aufgefüllt",
      "Die Nachtschicht in der Notendruckerei fängt an",
    ],
    ready: [
      "Schlüssel steckt, Motor läuft",
      "Letzter Schliff",
      "Fahndung wird zurückgesetzt",
      "Der Tank wird vollgemacht",
      "Die Sterne werden abgewischt",
      "Die Boote werden losgemacht",
      "Alles Gute, und fahr vorsichtig",
    ],
  } as Readonly<Record<string, readonly string[]>>,
  money: (amount: number): string => `${amount} €`,
  respect: (amount: number): string => `Respekt ${amount}`,
  health: (amount: number): string => `${amount} %`,
  wanted: "Fahndung",
  onFoot: "zu Fuß",
  driving: "am Steuer",
  jobLeft: (seconds: number): string => `noch ${seconds} s`,
  noJob: "Kein Auftrag",
  busted: "Verhaftet",
  bustedText:
    "Die Streife hatte dich. Jetzt hast du die Wahl: die Strafe absitzen und die Kaution zahlen - oder ausbrechen.",
  serve: "Strafe absitzen",
  breakOut: "Ausbrechen",
  escapeTitle: "Ausbruch",
  escapeTask: "Auftrag",
  escapeCaught: (left: number): string => `${left} Versuche übrig`,
  escapeMates: (count: number): string =>
    count === 1
      ? "1 Mitgefangener folgt dir"
      : `${count} Mitgefangene folgen dir`,
  wasted: "Krankenhaus",
  wastedText:
    "Das war zu viel. Die Rechnung ist bezahlt, und du stehst wieder auf der Straße.",
  won: "Los Santos gehört dir",
  wonText:
    "Alle vier Viertel übernommen. Mehr Respekt geht in dieser Stadt nicht.",
  carryOn: "Weiter",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild verlassen",
  loot: (amount: number): string => `Beute ${amount} €`,
  worksTitle: "Casa de Papel",
  crew: (crew: number): string => `Crew ${crew}`,
  savesTitle: "Spielstände",
  savesName: "Name des Spielstands",
  save: "Speichern",
  load: "Laden",
  forget: "Löschen",
  savesRoom: (used: number, room: number): string =>
    `${used} von ${room} Plätzen belegt - das Spiel speichert sich nebenher von selbst.`,
  controls: "Steuerung",
  log: "Was passiert ist",
} as const;
