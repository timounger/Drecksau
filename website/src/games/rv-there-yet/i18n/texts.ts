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
  gasKeys: "Fahren: W vorwärts · S rückwärts (bremst erst, dann rückwärts)",
  walkKeys: "Zu Fuß: A D oder ← → · Rennen: Umschalt",
  gearKeys:
    "Gänge 1-5 selbst einlegen · N Leerlauf · R kommt beim Rückwärts von allein",
  doorKeys: "Aus- und einsteigen: E (nur wenn das Wohnmobil steht)",
  takeKeys: "Aufheben und benutzen: F (halten zum Arbeiten)",
  hookKeys: "F: am Baum Seil an-/abmachen · am Wohnmobil halten zum Arbeiten",
  jumpKeys:
    "Leertaste: zu Fuß springen (zweimal kurz = doppelt so hoch) · im Fahrerhaus Handbremse (halten)",
  windKeys: "Seilwinde: W oder ↑ einziehen · S oder ↓ ausgeben (nur zu Fuß)",
  hint: "Zu steil zum Fahren? Aussteigen, zum leuchtenden Baum laufen, Seil dranmachen und mit der Seilwinde hochziehen - dann Seil ab und weiterfahren.",
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
  cycleKeys:
    "Das Passende kommt von selbst in die Hand · von Hand wechseln: Q (oder anklicken)",
  mended: "Wohnmobil wieder fahrtüchtig",
  wrongWay: "Rückwärtsgang - für vorwärts Gang 1-5 einlegen",
  noGear: "Leerlauf - Gang 1-5 einlegen",
  passenger: "Beifahrer - lenken darf, wer zuerst eingestiegen ist",
  parked: "Handbremse - bremst bis zum Stillstand",
  // Overlays
  start: "Los geht's",
  startHint: "Klick auf die Strecke, um zu starten.",
  arrived: "Angekommen!",
  arrivedIn: (seconds: string) => `Gebraucht: ${seconds} s`,
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
} as const;
