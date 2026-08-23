/**
 * What each phase of a turn is called on screen.
 *
 * @module
 */
import type { Phase } from "@/games/monopoly/engine/state";
import { MONOPOLY_TEXTS as T } from "./texts";

/** The name of each phase. */
export const PHASE_NAMES: Readonly<Record<Phase, string>> = {
  tokens: T.phaseTokens,
  jail: T.phaseJail,
  roll: T.phaseRoll,
  decide: T.phaseDecide,
  auction: T.phaseAuction,
  debt: T.phaseDebt,
  manage: T.phaseManage,
  gameOver: T.overNow,
};
