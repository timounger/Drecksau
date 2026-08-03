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
  checkpoint: (n: number, all: number) => `Checkpoint ${n} / ${all}`,
  checkpointReached: (n: number) => `Checkpoint ${n} erreicht`,
  checkpointSaved: "Hier geht es beim nächsten Mal weiter.",
  distance: (done: number, all: number) => `${done} / ${all} m`,
  battery: "Akku",
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
  hookKeys:
    "Leertaste: am Baum Seil an-/abmachen · am kaputten Wohnmobil halten zum Reparieren",
  windKeys:
    "Fernbedienung: W oder ↑ einziehen · S oder ↓ ausgeben (nur zu Fuß)",
  hint: "Zu steil zum Fahren? Aussteigen, zum leuchtenden Baum laufen, Seil dranmachen und mit der Fernbedienung hochziehen - dann Seil ab und weiterfahren.",
  // Touch buttons
  reverse: "◀",
  drive: "▶",
  door: "Tür",
  sprint: "Rennen",
  hook: "Seil",
  wind: "Seil ein",
  windOut: "Seil aus",
  // What the driver is doing
  atWheel: "Am Steuer",
  wrecked: "Wohnmobil kaputt - Hammer suchen (liegt weiter rechts)",
  needTyres: "Zu steil und kein Baum - Geländereifen suchen",
  fitTyres: "Am Fahrzeug - Leertaste halten und Reifen montieren",
  fitting: (share: number) => `Reifen montiert … ${share} %`,
  bear: "Ein Bär versperrt den Weg - Bärenspray suchen",
  bearGone: "Bärenspray dabei - der Bär macht Platz",
  wreckedWithHammer: "Wohnmobil kaputt - Leertaste halten und hämmern",
  mending: (share: number) => `Repariert … ${share} %`,
  gotHammer: "Hammer aufgehoben",
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
  nextCheckpoint: "Weiter",
  again: "Nochmal",
  allDone: "Die ganze Karte geschafft!",
  // Navigation
  checkpointBack: "◀ Checkpoint",
  checkpointForward: "Checkpoint ▶",
  checkpointBackTitle:
    "Zum vorigen Checkpoint - vom ersten aus zum letzten der Karte",
  checkpointForwardTitle:
    "Zum nächsten Checkpoint - vom letzten aus zurück zum ersten",
  statistics: "Statistik",
  online: "Online spielen",
} as const;
