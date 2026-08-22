/**
 * The German the fireground speaks.
 *
 * @module
 * @remarks
 * The words are the rulebook's own - Aktionspunkte, Rauch, Feuer, Einsatzsymbol,
 * Schadenszähler - so somebody who has the box on the shelf reads the same names
 * here.
 */
import type { Failure } from "@/games/flash-point/engine/state";

/** Everything the screen says. */
export const FLASH_POINT_TEXTS = {
  title: "Flash Point",
  tagline: "Rettet die Opfer, bevor das Haus einstürzt.",
  subtitleOnline: "Gemeinsam löschen, jede:r am eigenen Gerät",

  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  turn: (n: number) => `Zug ${n}`,
  ap: (n: number) => `${n} AP`,
  apLeft: "Aktionspunkte",
  rescued: (n: number) => `${n} gerettet`,
  dead: (n: number) => `${n} verloren`,
  cubes: (left: number, all: number) => `${left} von ${all} Schadenszählern`,
  carrying: "trägt ein Opfer",

  actMove: "Hingehen",
  actExtinguish: "Löschen",
  actDoorOpen: "Tür öffnen",
  actDoorClose: "Tür schließen",
  actChop: "Wand einschlagen",
  pickTarget: "Feld antippen",
  carry: "Opfer aufnehmen",
  drop: "Opfer absetzen",
  endTurn: "Zug beenden",

  fire: "Feuer",
  smoke: "Rauch",
  poi: "Einsatzsymbol",
  victim: "Opfer",
  outside: "draußen",
  saved: "Gerettete",
  graveyard: "Friedhof",

  hintTap:
    "Tipp auf ein helles Feld - meistens ist klar, was gemeint ist, und es passiert sofort. Nur wenn dort zweierlei möglich ist, wird gefragt.",
  choose: (where: string): string => `Auf ${where}:`,
  cancel: "Abbrechen",

  won: "Alle draußen!",
  wonLine: "Sieben Menschen sind in Sicherheit. Gut gemacht.",
  lost: "Einsatz gescheitert",
  playAgain: "Nochmal",
  log: "Funkverkehr",
} as const;

/** What went wrong, in words. */
export const FAILURE_TEXTS: Readonly<Record<Failure, string>> = {
  deaths: "Zu viele Menschen sind im Feuer umgekommen.",
  collapse: "Die Schadenszähler sind aufgebraucht - das Haus ist eingestürzt.",
};
