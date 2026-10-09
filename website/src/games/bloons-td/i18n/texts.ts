/**
 * Was der Bildschirm von Bloons TD sagt.
 *
 * @module
 */

/** Hundert, für Prozent. */
const PERCENT = 100;

/** Alle Beschriftungen, an einer Stelle. */
export const BLOONS_TEXTS = {
  title: "Bloons TD",
  subtitle: "Türme bauen, Ballons zerstechen",
  statistics: "Statistik",
  newGame: "Neue Partie",
  newGameTitle: "Alles abreißen und von vorn anfangen",
  // Anzeige
  round: (round: number) => `Runde ${round}`,
  roundOf: (round: number, goal: number, freeplay: boolean) =>
    freeplay ? `Runde ${round} · Freispiel` : `Runde ${round} / ${goal}`,
  roundNext: (round: number) => `Runde ${round} starten`,
  money: (money: number) => (Number.isFinite(money) ? `$${money}` : "$∞"),
  lives: (lives: number) =>
    Number.isFinite(lives) ? `${lives} Leben` : "∞ Leben",
  left: (many: number) => `${many} in der Luft`,
  popped: (many: number) => `${many} zerstochen`,
  payout: (money: number) =>
    `Wer die laufende Runde übersteht, bekommt $${money} dazu.`,
  speed: "Tempo",
  fast: "Schnell",
  normal: "Normal",
  turbo: "Turbo",
  auto: "Auto-Start",
  autoHint: "Die nächste Runde startet von selbst",
  pause: "Pause",
  resume: "Weiter",
  restart: "Neustart",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild beenden",
  // Laden
  shop: "Affen",
  shopHint: "Einen Affen anklicken - hier steht dann, was er kann.",
  cost: (cost: number) => `$${cost}`,
  tooDear: "zu teuer",
  pickedHint:
    "Jetzt auf eine Wiese klicken. Noch einmal auf den Affen: abwählen.",
  pickedWaterHint:
    "Jetzt auf ein Wasserfeld im Teich klicken. Noch einmal auf den Affen: abwählen.",
  // Angetippter Turm
  tower: "Angetippter Affe",
  towerPops: (many: number) =>
    many === 1 ? "1 Schicht zerstochen" : `${many} Schichten zerstochen`,
  sell: (money: number) => `Verkaufen für $${money}`,
  target: "Zielt auf",
  targets: { first: "Erster", last: "Letzter", strong: "Stärkster" },
  // Verbesserungen
  upgrades: "Verbesserungen",
  path: (nr: number) => `Säule ${nr}`,
  tierOf: (have: number, all: number) => `${have}/${all}`,
  buy: (cost: number) => `$${cost}`,
  full: "Ausgebaut",
  deselect: "Schließen",
  // Ende
  over: "Durchgekommen",
  overHint: (round: number) =>
    `Bis Runde ${round} gehalten. Die Ballons sind durch.`,
  again: "Noch einmal",
  // Ziel geschafft
  won: "Gewonnen!",
  wonHint: (map: string, difficulty: string, goal: number) =>
    `${map} auf ${difficulty} - Runde ${goal} überstanden. Die Medaille ist deine. Weiterspielen, solange es hält?`,
  keepGoing: "Weiterspielen",
  wonBossHint: (boss: string) =>
    `${boss} in allen fünf Stufen besiegt - Runde 120 überstanden! Weiterspielen, solange es hält?`,
  bossMode: (boss: string) => `Boss: ${boss}`,
  bossChallenge: "Boss-Herausforderung",
  bossChallengeInfo: (rounds: readonly number[]) =>
    `Auf Mittel. Der Boss kommt in den Runden ${rounds.join(", ")} - jedes Mal stärker.`,
  toMaps: "Zur Kartenauswahl",
  maps: "Karten",
  // Freischalten
  lockedAt: (level: number) => `ab Level ${level}`,
  levelShort: (level: number) => `Lv ${level}`,
  // Kartenübersicht
  mapsTitle: "Karte wählen",
  level: (level: number) => `Level ${level}`,
  xpProgress: (have: number, need: number) => `${have} / ${need} Erfahrung`,
  xpMax: "Alle Affen freigeschaltet",
  nextUnlock: (name: string, level: number) =>
    `Als Nächstes: ${name} auf Level ${level}`,
  unlockedCount: (have: number, all: number) =>
    `${have} von ${all} Affen freigeschaltet`,
  mapLevels: {
    beginner: "Anfänger",
    intermediate: "Mittel",
    advanced: "Fortgeschritten",
    expert: "Experte",
  },
  difficultyInfo: (lives: number, goal: number, price: number) =>
    `${lives} Leben · bis Runde ${goal} · Preise ${price === 1 ? "normal" : price < 1 ? `${Math.round((1 - price) * PERCENT)} % billiger` : `${Math.round((price - 1) * PERCENT)} % teurer`}`,
  play: "Spielen",
  reset: "Fortschritt zurücksetzen",
  resetQuestion:
    "Wirklich? Level, freigeschaltete Affen und alle Medaillen sind dann weg.",
  resetYes: "Ja, zurücksetzen",
  resetNo: "Abbrechen",
  medal: (difficulty: string) => `Medaille: ${difficulty} geschafft`,
  // Bestenliste
  boardTitle: "Bestenliste",
  boardSubtitle: "Die zehn, die am längsten durchgehalten haben",
  boardEmpty: "Noch niemand eingetragen - deine Runde könnte die erste sein.",
  boardLoading: "Bestenliste wird geladen …",
  boardFailed: "Bestenliste nicht erreichbar.",
  boardYours: "Deine Partie",
  boardMadeIt: (place: number) =>
    `Platz ${place} - trag deinen Namen ein und du stehst auf der Liste.`,
  boardMissed: "Diesmal nicht unter den besten zehn. Die aktuelle Liste:",
  boardKept: (best: string) =>
    `Dein Rekord ${best} steht schon auf der Liste - diesmal kamst du nicht so weit. Jeder Name hat einen Platz, und das ist seine beste Partie.`,
  boardPartial:
    "Nur Partien ohne Schummeln kommen in die Liste - hier wurde geschummelt.",
  boardEnter: "Eintragen",
  boardEntering: "Wird eingetragen …",
  boardEntered: "Eingetragen!",
  boardNamePlaceholder: "Dein Name",
  boardRound: (round: number) => `Runde ${round}`,
  boardMap: "Karte",
  boardDifficulty: "Schwierigkeit",
  // Steuerung
  controls: "Steuerung",
  controlsHint:
    "Affe im Laden wählen, auf eine Wiese klicken - dort steht er. U-Boot und Boot kommen in den Teich. Ein Klick auf einen fertigen Affen zeigt seine Reichweite und den Verkaufspreis. Auf die Straße lässt sich nicht bauen.",
} as const;
