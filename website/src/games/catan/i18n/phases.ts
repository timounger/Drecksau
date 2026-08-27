/**
 * What each phase of a turn is called on screen.
 *
 * @module
 * @remarks
 * The rulebook names two phases - "1. Ertragsphase" and "2. Handels- und
 * Bauphase" - and everything else here is a moment inside one of them that
 * needs somebody to answer something. Those get the name of the thing being
 * answered, because that is what a player is looking for on the screen.
 */
import type { Phase } from "@/games/catan/engine/state";
import { CATAN_TEXTS as T } from "./texts";

/** The name of each phase. */
export const PHASE_NAMES: Readonly<Record<Phase, string>> = {
  founding: T.phaseFounding,
  roll: T.phaseRoll,
  discard: T.phaseDiscard,
  robber: T.phaseRobber,
  steal: T.phaseSteal,
  trade: T.phaseTrade,
  monopol: T.phaseMonopol,
  erfindung: T.phaseErfindung,
  event: T.phaseEvent,
  neutral: T.phaseNeutral,
  swap: T.phaseSwap,
  displaced: T.phaseDisplaced,
  progress: T.phaseProgress,
  vote: "Abstimmung",
  posting: "Ritter einsetzen",
  barbarians: "Barbaren versetzen",
  knights: "Ritter bewegen",
  driving: "Trosswagen fahren",
  shifting: "Barbar versetzen",
  pirate: "Seeräuber versetzen",
  sailing: "Schiffe fahren",
  corsair: "Piratenschiff einsetzen",
  goldPick: "Goldfluss: Rohstoff wählen",
  gameOver: T.overNow,
};
