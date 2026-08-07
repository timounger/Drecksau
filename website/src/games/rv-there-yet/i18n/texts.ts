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
    "Der Graben",
    "Am Seil hinauf",
    "Die steile Wand",
    "Der Bär",
    "Im Nebel",
    "Die Brücke",
    "Der Abgrund",
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
  windKeys:
    "Fernbedienung: W oder ↑ einziehen · S oder ↓ ausgeben (nur zu Fuß)",
  hint: "Zu steil zum Fahren? Aussteigen, zum leuchtenden Baum laufen, Seil dranmachen und mit der Fernbedienung hochziehen - dann Seil ab und weiterfahren.",
  // Touch buttons
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
  // What the driver is doing
  atWheel: "Am Steuer",
  wrecked: "Wohnmobil kaputt - Hammer suchen (liegt weiter rechts)",
  wreckedGotHammer: "Hammer dabei - zurück zum Wohnmobil und F halten",
  gotTyres: "Geländereifen dabei - zurück zum Wohnmobil und F halten",
  needTyres: "Zu steil und kein Baum - Geländereifen suchen",
  fitTyres: "Am Fahrzeug - F halten und Reifen montieren",
  fitting: (share: number) => `Reifen montiert … ${share} %`,
  fuelUp: "Am Fahrzeug - F halten und tanken",
  fuelling: (share: number) => `Tankt … ${share} %`,
  gotCan: "Benzinkanister dabei - zurück zum Wohnmobil und F halten",
  tankFull: "Tank ist voll",
  bear: "Ein Bär versperrt den Weg - Bärenspray suchen",
  bearComing:
    "Der Bär hat dich gesehen und kommt - Spray holen oder rein ins Wohnmobil!",
  bearComingArmed: "Der Bär kommt - näher ran und F halten",
  bearRun: "Bär direkt vor dir und kein Spray - weg hier!",
  bearSpray: "Bär in Reichweite - F halten und sprühen",
  bearSpraying: (share: number) => `Sprüht … ${share} %`,
  bearHolding: (share: number) => `Der Bär hat dich! ${share} %`,
  bearGone: "Der Bär ist abgezogen - der Weg ist frei",
  mauled: "Der Bär hat dich erwischt.",
  mauledHint: "Beim nächsten Mal: früher sprühen oder ins Wohnmobil.",
  // Der Abgrund
  chasm: "Abgrund voraus - dicht an die Kante fahren und aussteigen",
  chasmAxe: "Axt dabei - zum Baum am Abgrund und F halten",
  chasmNeedAxe: "Der Baum fällt den Abgrund zu - dafür braucht es die Axt",
  chasmLadder: "Leiter hinten am Wohnmobil - Leertaste zum Hochklettern",
  chasmRoof: "Auf dem Dach - mit Anlauf und Doppelsprung hinüber",
  felling: (share: number) => `Fällt den Baum … ${share} %`,
  fellHere: "Am Baum - F halten und fällen",
  felled: "Der Baum liegt über dem Abgrund - der Weg ist frei",
  plunged: "In den Abgrund gefahren.",
  plungedHint: "Der Baum am Abgrund muss erst fallen. Die Axt liegt drüben.",
  // Die Brücke
  bridgeSign: "Achtung: morsche Brücke - hält nur wenig Gewicht",
  bridgeAlone: "Nur einer im Wohnmobil - der andere geht zu Fuß hinüber",
  fallen: "Die Brücke ist eingebrochen.",
  fallenHint:
    "Zu zweit im Wohnmobil hält das alte Holz nicht. Einer fährt, einer geht.",
  // Im Nebel stehen bleiben
  standingStill: (share: number) => `Nicht stehen bleiben! ${share} %`,
  taken: "Etwas im Nebel hat dich geholt.",
  takenHint: "Im Nebel gilt: keine fünf Sekunden stehen bleiben.",
  wreckedWithHammer: "Wohnmobil kaputt - F halten und hämmern",
  mending: (share: number) => `Repariert … ${share} %`,
  gotHammer: "Hammer aufgehoben",
  // Inventar
  inventory: "Inventar",
  inventoryEmpty: "Nichts dabei",
  inHand: "in der Hand",
  itemRemote: "Fernbedienung",
  itemCan: "Benzinkanister",
  itemHammer: "Hammer",
  itemTyres: "Geländereifen",
  itemSpray: "Bärenspray",
  itemAxe: "Axt",
  cycleKeys:
    "Das Passende kommt von selbst in die Hand · von Hand wechseln: Q (oder anklicken)",
  // Aufheben - der Gegenstand liegt in Reichweite
  pickUpCan: "Benzinkanister liegt hier - F zum Aufheben",
  pickUpHammer: "Hammer liegt hier - F zum Aufheben",
  pickUpTyres: "Geländereifen liegen hier - F zum Aufheben",
  pickUpSpray: "Bärenspray liegt hier - F zum Aufheben",
  pickUpAxe: "Axt liegt hier - F zum Aufheben",
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
