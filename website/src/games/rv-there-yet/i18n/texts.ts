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
  section: (n: number, all: number) => `Abschnitt ${n} / ${all}`,
  sectionDone: (n: number) => `Abschnitt ${n} geschafft`,
  sectionSaved: "Gespeichert - hier geht es beim nächsten Mal weiter.",
  speedKmh: (kmh: number) => `${kmh} km/h`,
  fuel: "Tank",
  gear: "Gang",
  gearNeutral: "Leerlauf",
  gearReverse: "Rückwärts",
  gearHint: "Kleiner Gang zieht stärker, großer läuft schneller.",
  time: (seconds: string) => `${seconds} s`,
  slopeUp: "Steigung",
  slopeDown: "Gefälle",
  // Controls
  controlsTitle: "Steuerung",
  gasKeys: "Fahren: W vorwärts · S rückwärts (bremst erst, dann rückwärts)",
  walkKeys: "Zu Fuß: A D oder ← → · Rennen: Umschalt",
  gearKeys:
    "Gänge 1-5 selbst einlegen · N Leerlauf · R kommt beim Rückwärts von allein",
  doorKeys: "Aus- und einsteigen: E",
  takeKeys: "Gegenstand aufheben: F",
  hookKeys:
    "Leertaste: am Baum Seil an-/abmachen · am Wohnmobil halten zum Arbeiten",
  windKeys:
    "Fernbedienung: W oder ↑ einziehen · S oder ↓ ausgeben (nur zu Fuß)",
  hint: "Zu steil zum Fahren? Aussteigen, zum leuchtenden Baum laufen, Seil dranmachen und mit der Fernbedienung hochziehen - dann Seil ab und weiterfahren.",
  // Touch buttons
  reverse: "◀",
  drive: "▶",
  door: "Tür",
  sprint: "Rennen",
  hook: "Seil",
  take: "Aufheben",
  wind: "Seil ein",
  windOut: "Seil aus",
  // What the driver is doing
  atWheel: "Am Steuer",
  wrecked: "Wohnmobil kaputt - Hammer suchen (liegt weiter rechts)",
  wreckedGotHammer: "Hammer dabei - zurück zum Wohnmobil und Leertaste halten",
  gotTyres: "Geländereifen dabei - zurück zum Wohnmobil und Leertaste halten",
  needTyres: "Zu steil und kein Baum - Geländereifen suchen",
  fitTyres: "Am Fahrzeug - Leertaste halten und Reifen montieren",
  fitting: (share: number) => `Reifen montiert … ${share} %`,
  bear: "Ein Bär versperrt den Weg - Bärenspray suchen",
  bearComing:
    "Der Bär hat dich gesehen und kommt - Spray holen oder rein ins Wohnmobil!",
  bearComingArmed: "Der Bär kommt - näher ran und Leertaste halten",
  bearRun: "Bär direkt vor dir und kein Spray - weg hier!",
  bearSpray: "Bär in Reichweite - Leertaste halten und sprühen",
  bearSpraying: (share: number) => `Sprüht … ${share} %`,
  bearHolding: (share: number) => `Der Bär hat dich! ${share} %`,
  bearGone: "Der Bär ist abgezogen - der Weg ist frei",
  mauled: "Der Bär hat dich erwischt.",
  mauledHint: "Beim nächsten Mal: früher sprühen oder ins Wohnmobil.",
  wreckedWithHammer: "Wohnmobil kaputt - Leertaste halten und hämmern",
  mending: (share: number) => `Repariert … ${share} %`,
  gotHammer: "Hammer aufgehoben",
  // Aufheben - der Gegenstand liegt in Reichweite
  pickUpHammer: "Hammer liegt hier - F zum Aufheben",
  pickUpTyres: "Geländereifen liegen hier - F zum Aufheben",
  pickUpSpray: "Bärenspray liegt hier - F zum Aufheben",
  mended: "Wohnmobil wieder fahrtüchtig",
  wrongWay: "Rückwärtsgang - für vorwärts Gang 1-5 einlegen",
  noGear: "Leerlauf - Gang 1-5 einlegen",
  onFoot: "Zu Fuß",
  passenger: "Beifahrer - lenken darf, wer zuerst eingestiegen ist",
  ropeRemote: "Fernbedienung: W einziehen, S ausgeben",
  ropeGetOut: "Seil hängt - zum Winden aussteigen",
  atDoor: "Am Fahrzeug - einsteigen (E)",
  ropeAtTree: "Am Baum - Seil dranmachen",
  ropeWalk: "Baum voraus - hinlaufen",
  parked: "Handbremse angezogen",
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
