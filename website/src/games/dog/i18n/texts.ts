/**
 * Everything Dog says on screen, and the four colours it says it in.
 *
 * @module
 */

/** What one colour looks like on the board. */
export type SeatColour = {
  /** What it is called. */
  readonly name: string;
  /** The piece itself. */
  readonly solid: string;
  /** The quarter of the board it owns. */
  readonly pale: string;
  /** Its outlines and its writing. */
  readonly ink: string;
};

/**
 * The four colours, clockwise from the top.
 *
 * @remarks
 * Green and blue are one team, red and yellow the other - the two seats facing
 * each other, exactly as they sit at a table. The pairs are as far apart in hue
 * as four colours can be, because the one question the board has to answer at a
 * glance is "is that one of ours".
 */
export const SEAT_COLOURS: readonly SeatColour[] = [
  { name: "Grün", solid: "#16a34a", pale: "#bbf7d0", ink: "#14532d" },
  { name: "Rot", solid: "#dc2626", pale: "#fecaca", ink: "#7f1d1d" },
  { name: "Blau", solid: "#2563eb", pale: "#bfdbfe", ink: "#1e3a8a" },
  { name: "Gelb", solid: "#eab308", pale: "#fef08a", ink: "#713f12" },
  { name: "Lila", solid: "#9333ea", pale: "#e9d5ff", ink: "#581c87" },
  { name: "Orange", solid: "#ea580c", pale: "#fed7aa", ink: "#7c2d12" },
];

/** Every line the screen shows. */
export const DOG_TEXTS = {
  title: "Dog",
  tagline: "Den Letzten beißen die Hunde: zu zweit gegen zwei ins Ziel.",
  newGame: "Neues Spiel",
  online: "Online",
  yourTurn: "Du bist dran",
  waitingFor: (who: string): string => `${who} ist dran`,
  passing: "Schiebt eurem Partner eine Karte zu",
  passYours: "Wähle eine Karte für deinen Partner",
  passed: "Karte liegt bereit",
  round: (round: number, cards: number): string =>
    `Runde ${round} - ${cards} Karten`,
  team: (team: number): string => `Team ${team}`,
  teamOf: (a: string, b: string): string => `${a} und ${b}`,
  partner: "dein Partner",
  home: (done: number, all: number): string => `${done}/${all} im Ziel`,
  won: (team: string): string => `${team} hat gewonnen!`,
  gameOver: "Spiel vorbei",
  yourCards: "Deine Karten",
  pickCard: "Karte wählen",
  pickPiece: "Figur wählen",
  pickOther: "Mit welcher Figur tauschen?",
  cancel: "Zurück",
  fold: "Aussetzen - ich kann nichts spielen",
  redrawHint:
    "Keine deiner Karten lässt sich spielen. Wirf eine ab - du ziehst eine neue nach.",
  soloTable: "Jeder für sich",
  players: (count: number): string => `${count} Spieler`,
  teamTable: "Zu zweit gegen zwei - dein Partner sitzt gegenüber",
  fivePieces: "Fünf Figuren, eine steht schon auf dem Startfeld",
  foldHint:
    "Keine deiner Karten lässt sich spielen. Die Runde ist für dich vorbei.",
  jokerAs: "Der Joker gilt als",
  sevenLeft: (left: number): string => `Noch ${left} Schritte zu verteilen`,
  sevenUndo: "Sieben neu aufteilen",
  steps: (steps: number): string => `${steps} vor`,
  stepsBack: (steps: number): string => `${steps} zurück`,
  intoHome: (steps: number): string => `${steps} ins Ziel`,
  outOfKennel: "Aus dem Zwinger aufs Startfeld",
  swapWith: (who: string): string => `Tauschen mit ${who}`,
  nothing: "Ablegen, ohne dass etwas passiert",
  log: "Was passiert ist",
  controls: "So wird gespielt",
  waiting: "Die anderen überlegen …",
} as const;
