/**
 * German user-facing texts for "RV There Yet?".
 *
 * @module
 */

/** Everything the screen says. */
export const RV_TEXTS = {
  title: "RV There Yet?",
  subtitle: "Bring das Wohnmobil über den Berg - notfalls mit der Seilwinde.",
  // Heads-up display
  section: (n: number, all: number, name: string) =>
    `Abschnitt ${n} / ${all} - ${name}`,
  /**
   * What each section is called, in the order they are driven.
   *
   * @remarks
   * One per section mark on the map, and `texts.test.ts` holds them to that:
   * a name too few would leave a stretch of road nameless, one too many is a
   * section somebody deleted and forgot to say so.
   */
  sectionNames: [
    "Bergab, bergauf",
    "Am Seil hinauf",
    "Der Graben",
    "Die steile Wand",
    "Der Bär",
    "Im Nebel",
    "Die Brücke",
    "Der Abgrund",
  ] as readonly string[],
  /**
   * What there is to do in each section, on a sign at the start of it.
   *
   * @remarks
   * One per section, in the same order as {@link sectionNames}. A section with
   * nothing written for it gets no board at all rather than a blank one, which
   * is what carried the later sections while their wording was being decided.
   */
  sectionHints: [
    "Wähle den passenden Gang, um die Steigung zu meistern.",
    "Befestige die Seilwinde an Bäumen, um das Fahrzeug hochzuziehen.",
    "Beschädigte Fahrzeuge können mit dem passenden Werkzeug repariert werden.",
    "Die richtige Bereifung sorgt für besseren Grip.",
    "Halte dich von wilden Tieren fern und versuche sie zu vertreiben.",
    "Nicht anhalten!",
    "Manchmal ist man alleine besser dran.",
    "Ein Wohnmobil bietet ausreichend Platz. Nicht nur im Inneren.",
  ] as readonly string[],
  sectionDone: (n: number) => `Abschnitt ${n} geschafft`,
  sectionSaved: "Gespeichert - hier geht es beim nächsten Mal weiter.",
  fuel: "Tank",
  gear: "Gang",
  gearNeutral: "Leerlauf",
  gearReverse: "Rückwärts",
  gearHint: "Kleiner Gang zieht stärker, großer läuft schneller.",
  slopeUp: "Steigung",
  slopeDown: "Gefälle",
  // Controls
  controlsTitle: "Steuerung",
  /**
   * Die Tastenzeile unter dem Bild - je Sitzplatz nur das, was dort gilt.
   *
   * @remarks
   * Vorher standen alle zehn Zeilen immer da, die halbe Steuerung also für den
   * anderen Sitzplatz. Wer im Fahrerhaus sitzt, braucht nichts über das
   * Aufheben zu lesen, und wer draußen steht, nichts über die Gänge.
   */
  drivingKeys: [
    "Fahren: W · S",
    "Gänge: 1-5 · N · R",
    "Handbremse: Leertaste halten",
    "Aussteigen: E (im Stand)",
  ] as readonly string[],
  walkingKeys: [
    "Laufen: A · D",
    "Rennen: Umschalt",
    "Springen: Leertaste",
    "Nehmen und arbeiten: F halten",
    "Seilwinde: W ein · S aus",
    "Einsteigen: E",
  ] as readonly string[],
  // Touch buttons
  /** What the keys are called where a letter will not do. */
  keySpace: "Leertaste",
  keyShift: "Umschalt",
  reverse: "◀",
  drive: "▶",
  door: "Tür",
  sprint: "Rennen",
  use: "Benutzen",
  take: "Aufheben",
  jump: "Springen",
  handbrake: "Handbremse",
  wind: "Seil ein",
  windOut: "Seil aus",
  // What the driver is doing right now
  needTyres: "Zu steil und kein Baum - Geländereifen suchen",
  fitting: (share: number) => `Reifen montiert … ${share} %`,
  fuelling: (share: number) => `Tankt … ${share} %`,
  tankFull: "Tank ist voll",
  bear: "Ein Bär versperrt den Weg - Bärenspray suchen",
  bearSpraying: (share: number) => `Sprüht … ${share} %`,
  bearGone: "Der Bär ist abgezogen - der Weg ist frei",
  mauled: "Der Bär hat dich erwischt.",
  mauledHint: "Beim nächsten Mal: früher sprühen oder ins Wohnmobil.",
  // Der Matsch
  mud: "Matsch - hier kommt das Wohnmobil nicht in Fahrt",
  // Der Abgrund
  felling: (share: number) => `Fällt den Baum … ${share} %`,
  plunged: "In den Abgrund gefahren.",
  plungedHint: "Der Baum am Abgrund muss erst fallen. Die Axt liegt drüben.",
  // Die Brücke
  fallen: "Die Brücke ist eingebrochen.",
  /**
   * Warum, aber nicht wie es besser geht.
   *
   * @remarks
   * Absichtlich ohne Lösung: „Einer fährt, einer geht" stand vorher hier und
   * hat die Aufgabe des Abschnitts auf dem Verlustbildschirm verraten. Woran
   * es lag, muss dastehen - was man daraus macht, ist die Aufgabe.
   */
  fallenHint: "Das vollbeladene Wohnmobil war zu schwer für das alte Holz.",
  /**
   * Was passiert ist - und ausdrücklich **nicht**, woran es lag.
   *
   * @remarks
   * „Keine fünf Sekunden stehen bleiben" stand hier und hat die Regel des
   * Abschnitts auf dem Verlustbildschirm ausgeschrieben. Wer im Nebel stirbt,
   * hat gestanden; das herauszufinden ist der Abschnitt.
   */
  taken: "Etwas im Nebel hat dich geholt.",
  mending: (share: number) => `Repariert … ${share} %`,
  gotHammer: "Hammer aufgehoben",
  // Inventar
  inventory: "Inventar",
  inventoryEmpty: "Nichts dabei",
  inHand: "in der Hand",
  itemRemote: "Seilwinde",
  itemCan: "Benzinkanister",
  itemHammer: "Hammer",
  itemTyres: "Geländereifen",
  itemSpray: "Bärenspray",
  itemAxe: "Axt",
  mended: "Wohnmobil wieder fahrtüchtig",
  wrongWay: "Rückwärtsgang - für vorwärts Gang 1-5 einlegen",
  noGear: "Leerlauf - Gang 1-5 einlegen",
  passenger: "Beifahrer - lenken darf, wer zuerst eingestiegen ist",
  parked: "Handbremse - bremst bis zum Stillstand",
  // Bestenliste
  boardTitle: "Bestenliste",
  boardSubtitle: "Schnellste Fahrten von Abschnitt 1 bis ans Ziel",
  boardEmpty: "Noch keine Fahrt eingetragen - deine könnte die erste sein.",
  boardLoading: "Bestenliste wird geladen …",
  boardFailed: "Bestenliste nicht erreichbar.",
  boardPlace: "Platz",
  boardName: "Name",
  boardTime: "Zeit",
  boardYours: "Deine Fahrt",
  boardMadeIt: (place: number) =>
    `Platz ${place} - trag deinen Namen ein und du stehst auf der Liste.`,
  boardMissed: "Diesmal nicht unter den besten zehn. Die aktuelle Liste:",
  boardKept: (best: string) =>
    `Deine Bestzeit ${best} steht schon auf der Liste - diese Fahrt war langsamer. Jeder Name hat einen Platz, und das ist seine beste Fahrt.`,
  boardPartial:
    "Nur durchgehende Fahrten ab Abschnitt 1 kommen in die Liste - diese hier fing später an.",
  boardEnter: "Eintragen",
  boardEntering: "Wird eingetragen …",
  boardEntered: "Eingetragen!",
  boardNamePlaceholder: "Dein Name",
  // Overlays
  start: "Los geht's",
  startHint: "Klick auf die Strecke, um zu starten.",
  arrived: "Angekommen!",
  /**
   * Wie lange die ganze Fahrt gedauert hat.
   *
   * @remarks
   * Die **ganze** Fahrt, nicht der letzte Abschnitt: Genau diese Zeit wertet
   * die Bestenliste, und zwei verschiedene Zahlen übereinander lesen sich als
   * Fehler in der Liste.
   */
  arrivedIn: (clock: string) => `Gebraucht: ${clock}`,
  arrivedSection: (seconds: string) => `Letzter Abschnitt: ${seconds} s`,
  again: "Nochmal",
  againFromStart: "Nochmal von vorne",
  newGame: "Neues Spiel",
  newGameTitle: "Von vorne anfangen: zurück zum ersten Abschnitt",
  allDone: "Die ganze Karte geschafft!",
  // Navigation
  sectionBack: "◀ Abschnitt",
  sectionForward: "Abschnitt ▶",
  sectionBackTitle:
    "Zum vorigen Abschnitt - vom ersten aus zum letzten der Karte",
  sectionForwardTitle:
    "Zum nächsten Abschnitt - vom letzten aus zurück zum ersten",
  statistics: "Statistik",
  online: "Online spielen",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild verlassen",
} as const;
