/**
 * The German the cockpit speaks.
 *
 * @module
 * @remarks
 * The words are the box's own - Ruder, Triebwerke, Fahrwerk, Landeklappen,
 * Bremsen, Funk, Konzentration - so a player who has the game on the shelf
 * finds the same names here. Where the manual names a thing, that name wins
 * over anything shorter or cleverer.
 */
import type { Failure } from "@/games/sky-team/engine/state";

/** Everything the screen says. */
export const SKY_TEAM_TEXTS = {
  title: "Sky Team",
  tagline: "Landet gemeinsam - und schweigt dabei.",
  subtitleOnline: "Zu zweit, jede:r am eigenen Gerät",

  pilot: "Pilotin",
  copilot: "Co-Pilot",
  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,

  round: (round: number) => `Runde ${round} von 7`,
  altitude: "Höhe",
  feet: (feet: number) => `${feet} Fuß`,
  position: "Position",
  approach: "Entfernungsleiste",
  airport: "Flughafen",
  cloud: "Start",
  planesHere: (count: number) =>
    count === 1 ? "1 Flugzeug im Weg" : `${count} Flugzeuge im Weg`,
  clear: "frei",

  axis: "Ruder",
  axisHint:
    "Die Differenz kippt das Flugzeug. Am Ende muss es waagerecht sein.",
  engines: "Triebwerke",
  enginesHint: "Die Summe ist eure Geschwindigkeit.",
  gear: "Fahrwerk",
  flaps: "Landeklappen",
  brakes: "Bremsen",
  radio: "Funk",
  radioHint: "Zählt ab der Aktuellen Position und räumt ein Flugzeug weg.",
  coffee: "Konzentration",
  coffeeHint: "Eine Tasse verschiebt einen Würfel um 1.",

  speed: "Geschwindigkeit",
  markers: (blue: number, orange: number) => `Aerodynamik ${blue} / ${orange}`,
  brakeStrength: (value: number) =>
    value === 0 ? "Bremsen: noch keine" : `Bremskraft ${value}`,
  cups: (count: number) => `${count} Kaffee`,
  rerolls: (count: number) => `${count} Neuwurf`,
  reroll: "Neu würfeln",
  duty: "Pflicht",
  finalRound: "Letzte Runde - Landung!",

  yourDice: "Deine Würfel",
  behindScreen: "Hinter dem Sichtschirm",
  hidden: "verdeckt",
  pickDie: "Würfel wählen",
  pickSpace: "Feld wählen",
  cancel: "Abbrechen",
  useCoffee: "Kaffee einsetzen",
  placeHere: "Hierhin",

  nextRound: "Weiter",
  roundOver: "Runde vorbei - 1000 Fuß tiefer.",
  silence: "Ab jetzt wird geschwiegen.",
  talkNow: "Jetzt dürft ihr reden.",

  won: "Sicher gelandet!",
  wonLine: "Die Passagiere klatschen begeistert.",
  lost: "Vorbei",
  playAgain: "Nochmal",
  log: "Verlauf",
} as const;

/** What went wrong, in words - one line each, because each is its own rule. */
export const FAILURE_TEXTS: Readonly<Record<Failure, string>> = {
  spin: "Ins Trudeln geraten - das Ruder stand zu schief.",
  collision: "Kollision - auf eurer Position stand noch ein Flugzeug.",
  overshoot: "Über das Ziel hinaus - zu schnell für die Landebahn.",
  short: "Notlandung vor dem Flughafen - die Höhe war aufgebraucht.",
  duty: "Ruder oder Triebwerke blieben leer - das ist Pflicht.",
  landing: "Fahrwerk oder Landeklappen waren nicht ausgefahren.",
};
