/**
 * Configurable German names for suits, the trump seven and the ace.
 *
 * @module
 * @remarks
 * Some regions call the suits and cards by different names (e.g. "Schellen" vs
 * "Bollen" vs "Karo"). The player picks one name per item in the settings; the
 * first option is always the default. These helpers turn the chosen
 * {@link BinokelNaming} into the label shown for a suit, rank or meld.
 */
import { RANK_LABELS, MELD_LABELS } from "@/games/binokel/i18n/binokel-texts";
import type { Rank, Suit } from "@/games/binokel/engine/cards";
import type { Meld } from "@/games/binokel/engine/melds";

/**
 * The names each suit can be shown under; the first entry is the default.
 */
export const SUIT_NAME_OPTIONS: Readonly<Record<Suit, readonly string[]>> = {
  eichel: ["Eichel", "Kreuz"],
  blatt: ["Blatt", "Schippen", "Pik", "Grün"],
  herz: ["Herz", "Rot"],
  schellen: ["Schellen", "Bollen", "Karo"],
};

/** The names the trump seven (Dix) can be shown under; first is the default. */
export const DIX_NAME_OPTIONS = ["Dix", "7er"] as const;

/** The names the ace can be shown under; first is the default. */
export const ACE_NAME_OPTIONS = ["Daus", "Ass"] as const;

/** The names the bidding process can be shown under; first is the default. */
export const BID_NAME_OPTIONS = ["Reizen", "Steigern"] as const;

/** The chosen display names for suits, the trump seven, the ace and bidding. */
export type BinokelNaming = {
  readonly suitNames: Readonly<Record<Suit, string>>;
  readonly dixName: string;
  readonly aceName: string;
  readonly bidName: string;
};

/** The naming before the player has changed anything (the first of each). */
export function defaultNaming(): BinokelNaming {
  return {
    suitNames: {
      eichel: SUIT_NAME_OPTIONS.eichel[0],
      blatt: SUIT_NAME_OPTIONS.blatt[0],
      herz: SUIT_NAME_OPTIONS.herz[0],
      schellen: SUIT_NAME_OPTIONS.schellen[0],
    },
    dixName: DIX_NAME_OPTIONS[0],
    aceName: ACE_NAME_OPTIONS[0],
    bidName: BID_NAME_OPTIONS[0],
  };
}

/** The chosen name of a suit. */
export function suitName(suit: Suit, naming: BinokelNaming): string {
  return naming.suitNames[suit];
}

/** The short label of a rank, using the chosen ace name for the ace. */
export function rankName(rank: Rank, naming: BinokelNaming): string {
  return rank === "daus" ? naming.aceName : RANK_LABELS[rank];
}

/**
 * A readable label for a meld, using the chosen suit, ace and Dix names.
 *
 * @param meld - the meld
 * @param naming - the chosen names
 * @returns e.g. "Familie Kreuz" or "Vier Gleiche (Ass)" or "Dix"/"7er"
 */
export function meldName(meld: Meld, naming: BinokelNaming): string {
  let label = meld.kind === "dix" ? naming.dixName : MELD_LABELS[meld.kind];
  if (meld.suit !== undefined) {
    label = `${label} ${suitName(meld.suit, naming)}`;
  }
  if (meld.rank !== undefined) {
    label = `${label} (${rankName(meld.rank, naming)})`;
  }
  return label;
}
