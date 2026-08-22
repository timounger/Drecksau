/**
 * What each phase of a turn is called on screen.
 *
 * @module
 * @remarks
 * The rulebook numbers the steps of a turn - "1. Einheiten platzieren, 2.
 * Erobern, 3. Truppen bewegen, 4. Karte ziehen" - and a player who has read it
 * once looks for those words. So these are the rulebook's own, not a paraphrase.
 * Drawing a card is not among them because nobody has to do it: it happens by
 * itself at the end of a turn that took something.
 */
import type { Phase } from "@/games/risiko/engine/state";
import { RISIKO_TEXTS as T } from "./texts";

/** The name of each phase. */
export const PHASE_NAMES: Readonly<Record<Phase, string>> = {
  claim: T.phaseClaim,
  deploy: T.phaseDeploy,
  neutral: T.phaseNeutral,
  reinforce: T.phaseReinforce,
  attack: T.phaseAttack,
  fortify: T.phaseFortify,
  gameOver: T.overNow,
};
