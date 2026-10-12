/**
 * The German words of Scotland Yard's screens.
 *
 * @module
 */
import type { Transport } from "@/games/scotland-yard/engine/map";
import type {
  EndReason,
  Role,
  Ticket,
  Variant,
} from "@/games/scotland-yard/engine/state";

/** What each ticket is called. */
export const TICKET_NAMES: Readonly<Record<Ticket | Transport, string>> = {
  taxi: "Taxi",
  bus: "Bus",
  underground: "Underground",
  ferry: "Fähre",
  black: "Black-Ticket",
};

/** The colour of each ticket, as on the board. */
export const TICKET_COLOURS: Readonly<Record<Ticket | Transport, string>> = {
  taxi: "#facc15",
  bus: "#14b8a6",
  underground: "#dc2626",
  ferry: "#18181b",
  black: "#18181b",
};

/** What each variant is called. */
export const VARIANT_NAMES: Readonly<Record<Variant, string>> = {
  standard: "Standardspiel",
  intro: "Einsteigerspiel",
};

/** A line about each variant, for the settings and the lobby. */
export const VARIANT_HINTS: Readonly<Record<Variant, string>> = {
  standard:
    "22 Runden, Taxi, Bus und Underground mit Tickets, Mister X zeigt sich nach dem 3., 8., 13., 18. und 24. Zug.",
  intro:
    "13 Runden ohne Underground und ohne Tickets, feste Startfelder - Mister X ist sichtbar und taucht nur dreimal ab.",
};

/** What each side is called. */
export const ROLE_NAMES: Readonly<Record<Role, string>> = {
  misterX: "Mister X",
  detectives: "Detektive",
};

/** The fixed words of the screens. */
export const SCOTLAND_YARD_TEXTS = {
  title: "Scotland Yard",
  tagline: "Auf der Jagd nach Mister X quer durch London",
  newGame: "Neues Spiel",
  round: (round: number, of: number) => `Runde ${round} von ${of}`,
  yourMoveX: (name: string) => `Du bist ${name} - wohin geht die Flucht?`,
  yourSecondMove: "Doppelzug: dein zweiter Zug.",
  yourMoveDetective: (name: string) => `Zieh mit ${name}.`,
  waitingX: (name: string) => `${name} ist unterwegs …`,
  waitingDetective: (name: string, player: string) =>
    `${name} ist am Zug (${player}).`,
  computerThinks: "Der Computer überlegt …",
  pickStation: "Tippe auf eine markierte Station.",
  pickTicket: (station: number) => `Womit nach ${station}?`,
  cancel: "Abbrechen",
  double: "Doppelzug",
  doubleHint: "Gleich zweimal hintereinander ziehen",
  doubleOn: "Doppelzug an - erst der erste Zug",
  log: "Fahrtentafel",
  logEmpty: "Noch kein Zug.",
  logReveal: "zeigt sich",
  logHidden: "?",
  supply: "Vorrat",
  black: "Black",
  doubleTickets: "Doppel",
  bobby: "Bobby",
  noTickets: "frei",
  lastSeen: (station: number) => `Zuletzt gesehen: ${station}`,
  neverSeen: "Noch nicht gesehen",
  visibleAt: (station: number) => `Sichtbar auf ${station}`,
  hidingPlaces: (count: number) =>
    count === 1 ? "1 mögliches Versteck" : `${count} mögliche Verstecke`,
  showHiding: "Mögliche Verstecke zeigen",
  zoomIn: "Größer",
  zoomOut: "Kleiner",
  you: "Du",
  computer: "Computer",
  won: "Gewonnen!",
  lost: "Verloren!",
  winner: (role: Role, name: string) =>
    role === "misterX"
      ? `${name} ist entkommen!`
      : "Die Detektive haben gewonnen!",
  end: (reason: EndReason, name: string, by: string) =>
    END_LINES[reason](name, by),
  wasAt: (name: string, station: number) =>
    `${name} war auf Station ${station}.`,
  piece: "Figur",
  tickets: "Tickets",
  position: "Station",
  movedTo: (station: number) => `→ ${station}`,
} as const;

/** How each ending is told. */
const END_LINES: Readonly<
  Record<EndReason, (name: string, by: string) => string>
> = {
  caught: (name, by) => `${by} hat ${name} gestellt!`,
  cornered: (name) => `${name} sitzt in der Falle - keine freie Station mehr.`,
  escaped: (name) => `${name} hat bis zum Schluss durchgehalten.`,
  stuck: (name) => `Kein Detektiv kann mehr ziehen - ${name} ist entkommen.`,
};
