/**
 * The whole game at one instant, and who is winning it.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state travels to storage and over the wire, and
 * the referee in `moves.ts` is the only thing that changes it.
 *
 * Two fields carry the parts of Bohnanza that a screen makes harder than a
 * table does, and they are worth reading together. {@link Player.hand} is an
 * **ordered list and never a set** - "die Reihenfolge der Karten auf deiner
 * Hand darfst du während des gesamten Spiels nicht ändern" is the rule the
 * whole game hangs on, and a structure that allowed sorting would be a
 * structure that had already broken it. {@link BohnanzaGame.offer} is the one
 * proposal lying on the table; at most one at a time, because several at once
 * is everybody talking over each other.
 *
 * The cards themselves are conserved. All 104 are always somewhere: the deck,
 * the discard, a hand, a field, the crosswise pile, the two face-up cards, or
 * {@link BohnanzaGame.spent} - the ones turned onto their Taler side, which is
 * how a deck that keeps being reshuffled can still run out a third time.
 */
import { coinsFor, type Bean, type Card } from "./beans";

/** Where a turn has got to. */
export type Phase =
  /** 1. Phase: the front hand card must be planted, and a second one may be. */
  | "plant"
  /** 2. Phase: two cards lie face up and the table may trade. */
  | "trade"
  /** 3. Phase: everybody with cards lying crosswise plants them. */
  | "settle"
  | "gameOver";

/** A player. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  /**
   * The hand, front card first, and never reordered.
   *
   * @remarks
   * Index 0 is "die vorderste Karte" - the one Phase 1 forces you to plant.
   * Drawn cards go on the end. Nothing in this game may sort this list.
   */
  readonly hand: readonly Card[];
  /** Two or three fields, each a stack of one sort; empty means bare earth. */
  readonly fields: readonly (readonly Card[])[];
  /** Cards taken in a trade, lying crosswise until Phase 3 plants them. */
  readonly pending: readonly Card[];
  /** How many cards are on the Talerstapel - one Taler each. */
  readonly coins: number;
};

/**
 * A proposal lying on the table.
 *
 * @remarks
 * Asymmetric on purpose, and the asymmetry is the table's own: what you offer
 * you are holding, so you can name the exact cards; what you want is in someone
 * else's hand, which you cannot see, so you can only name **sorts**. That is
 * what "Möchte jemand die Sojabohne? Am liebsten hätte ich dafür eine Rote
 * Bohne" is, written down.
 *
 * An empty {@link Offer.want} is a gift - which still has to be accepted,
 * because the rulebook says so outright.
 */
export type Offer = {
  /** Who is proposing. Either the active player, or somebody asking them. */
  readonly from: number;
  readonly to: number;
  /**
   * The cards offered - the whole cards, not their ids.
   *
   * @remarks
   * Because putting a card into an offer is showing it: "Ich biete neben der
   * aufgedeckten Sojabohne zusätzlich eine Feuerbohne aus meiner Hand." Online
   * that matters twice over - a hand is blanked out on its way to the other
   * players, and an offer that named only ids would arrive at their screens as
   * two cards nobody could see.
   *
   * The card stays in its owner's hand until the trade is done, which is the
   * rulebook's own advice: "Ziehe eine Karte erst aus der Hand, sobald der
   * Handel auch wirklich zustande kommt."
   */
  readonly give: readonly Card[];
  /** The sorts asked for in return; empty for a gift. */
  readonly want: readonly Bean[];
};

/** A move a seat can make. */
export type BohnanzaMove =
  /** Plant the front hand card on one of your fields. */
  | { readonly kind: "plant"; readonly field: number }
  /** Stop planting from the hand and turn the two cards up. */
  | { readonly kind: "done" }
  /** Harvest one of your fields - allowed at any moment of the game. */
  | { readonly kind: "harvest"; readonly field: number }
  /** Put a proposal on the table. */
  | {
      readonly kind: "offer";
      readonly to: number;
      readonly give: readonly string[];
      readonly want: readonly Bean[];
    }
  /**
   * Answer the proposal.
   *
   * @remarks
   * `cards` names what the answering seat hands over. Cards of one sort are
   * interchangeable, but their **place in the hand** is not, so which one goes
   * is a real decision and belongs to whoever is giving it away.
   */
  | {
      readonly kind: "answer";
      readonly yes: boolean;
      readonly cards?: readonly string[];
    }
  /** Take back your own proposal. */
  | { readonly kind: "withdraw" }
  /** End the trading phase. Only the active player may. */
  | { readonly kind: "endTrade" }
  /** Plant one of the cards lying crosswise in front of you. */
  | { readonly kind: "settle"; readonly card: string; readonly field: number };

/** The whole game. */
export type BohnanzaGame = {
  readonly players: readonly Player[];
  readonly deck: readonly Card[];
  readonly discard: readonly Card[];
  /**
   * Cards turned onto their Taler side, and so out of the game for good.
   *
   * @remarks
   * Kept as cards rather than thrown away, so all 104 can always be accounted
   * for. Which ones they are is nobody's business - at a table they lie face
   * down - so this is a table-level pile and not part of any player.
   */
  readonly spent: readonly Card[];
  /** The two face-up cards of Phase 2; they belong to the active player. */
  readonly revealed: readonly Card[];
  readonly active: number;
  readonly phase: Phase;
  /** Cards planted from the hand this turn: 0, 1 or 2. */
  readonly planted: number;
  /** The one proposal on the table, or null. */
  readonly offer: Offer | null;
  /** Proposals made this turn, which {@link OFFER_LIMIT} bounds. */
  readonly offers: number;
  /** Who holds the Start-Karte - only the tie-break ever asks. */
  readonly starter: number;
  /** How often the draw pile has run out. The third time ends the game. */
  readonly emptied: number;
  /**
   * True once the last card has been drawn for the third time.
   *
   * @remarks
   * Not the same as being over. "Sollte dies beim Aufdecken der Karten in der
   * 2. Phase passieren (auch wenn nur eine Karte aufgedeckt werden konnte),
   * werden die 2. und die 3. Phase noch zu Ende gespielt." The end is something
   * the game is carrying, not something that has happened yet.
   */
  readonly ending: boolean;
  readonly turn: number;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/**
 * What the seat you play yourself is called when it has no other name.
 *
 * @remarks
 * Offline there is nobody to tell your name to, so the seat is simply "Du".
 * Online every seat has a real name and this never comes up.
 */
export const SELF_NAME = "Du";

/** Fewest players - the box says three. */
export const MIN_PLAYERS = 3;

/** Most players - the box says five. */
export const MAX_PLAYERS = 5;

/** Hand cards each player is dealt at the start. */
export const START_HAND = 5;

/** Cards the active player draws in the fourth phase. */
export const DRAW_PER_TURN = 3;

/** Cards turned face up in the second phase. */
export const REVEAL_COUNT = 2;

/** Cards the first phase may plant from the hand. */
export const MAX_PLANTS = 2;

/** Times the draw pile may run out before the game is over. */
export const EMPTY_LIMIT = 3;

/** Fields at a three-handed table - the board's three-bean side. */
export const FIELDS_SMALL_TABLE = 3;

/** Fields at four or five - the board's two-bean side. */
export const FIELDS_BIG_TABLE = 2;

/** From this many players the board is turned to its two-field side. */
const BIG_TABLE_FROM = 4;

/**
 * How many proposals one turn may carry.
 *
 * @remarks
 * The rulebook puts no number on haggling, and at a table it needs none,
 * because a table gets bored. Online a turn that is a loop of proposals cannot
 * be allowed to run for ever, so there is a ceiling - far past what anybody
 * actually offers, and short enough to end a turn that has stopped going
 * anywhere.
 */
export const OFFER_LIMIT = 24;

/**
 * How many fields each player gets.
 *
 * @param players - how many are at the table
 * @returns three at a three-handed table, two above that
 * @remarks
 * "Spielt ihr zu dritt, legt ihr die Seite mit den drei Bohnenfeldern vor euch
 * ab. Spielt ihr zu viert oder zu fünft, legt ihr die Seite mit den zwei
 * Bohnenfeldern vor euch ab."
 */
export function fieldsFor(players: number): number {
  return players >= BIG_TABLE_FROM ? FIELDS_BIG_TABLE : FIELDS_SMALL_TABLE;
}

/** Which sort is growing on a field, or null if it is bare. */
export function fieldBean(field: readonly Card[]): Bean | null {
  return field[0]?.bean ?? null;
}

/** What a field would pay if it were harvested right now. */
export function fieldCoins(field: readonly Card[]): number {
  const bean = fieldBean(field);
  return bean === null ? 0 : coinsFor(bean, field.length);
}

/**
 * Whether this player may harvest this field.
 *
 * @param player - the player
 * @param field - which of their fields
 * @returns true if the Bohnenschutzregel allows it
 * @remarks
 * "Du darfst auf einem Feld keine einzelne Bohnenkarte ernten, wenn auf
 * mindestens einem deiner Felder mehr als eine Bohnenkarte liegt." This can
 * never lock anybody in: if it forbids a field, then some other field holds
 * more than one card by definition - and that one may be harvested.
 */
export function canHarvest(player: Player, field: number): boolean {
  const cards = player.fields[field];
  const hasBigger = player.fields.some((other) => other.length > 1);
  return (
    cards !== undefined &&
    cards.length > 0 &&
    !(cards.length === 1 && hasBigger)
  );
}

/**
 * The fields a card of this sort may be planted on.
 *
 * @param player - whose fields
 * @param bean - the sort being planted
 * @returns the field indexes that would take it
 * @remarks
 * "Auf einem Feld darfst du nur Bohnen der gleichen Sorte anbauen. Es ist dir
 * aber erlaubt, dieselbe Sorte auf mehreren Feldern zur gleichen Zeit
 * anzubauen." So a bare field always works and a planted one only for its own
 * sort - and both may be on offer at the same moment.
 */
export function plantableFields(player: Player, bean: Bean): readonly number[] {
  return player.fields
    .map((field, at) => {
      const growing = fieldBean(field);
      return growing === null || growing === bean ? at : -1;
    })
    .filter((at) => at >= 0);
}

/** The cards a seat may put into a proposal right now. */
export function tradeable(game: BohnanzaGame, seat: number): readonly Card[] {
  // The two face-up cards belong to the active player and may be traded with;
  // what lies crosswise may not - "mit Karten, die ihr nach einem Handel
  // bekommt, dürft ihr nicht weiterhandeln".
  return seat === game.active
    ? [...game.players[seat].hand, ...game.revealed]
    : game.players[seat].hand;
}

/** The seats that still owe Phase 3 a planting, the active player first. */
export function settlers(game: BohnanzaGame): readonly number[] {
  const count = game.players.length;
  return Array.from(
    { length: count },
    (unused, step) => (game.active + step) % count,
  ).filter((seat) => game.players[seat].pending.length > 0);
}

/**
 * What a player would be worth if the game ended now.
 *
 * @param player - the player
 * @returns their Taler, with the standing fields harvested in
 * @remarks
 * For the closing table and for the computer's judgement, not for the running
 * score: during the game only the Talerstapel counts, and a field is worth
 * nothing at all until somebody actually harvests it.
 */
export function finalScore(player: Player): number {
  return player.fields.reduce(
    (sum, field) => sum + fieldCoins(field),
    player.coins,
  );
}

/**
 * Who won.
 *
 * @param game - the finished game
 * @returns the winning seat, in a list of one
 * @remarks
 * "Bei einem Gleichstand gewinnt die Person, die im Uhrzeigersinn am weitesten
 * weg von der Person mit der Start-Karte sitzt." Seats run clockwise, so the
 * furthest away is the largest step from the Start-Karte - which always picks
 * exactly one player, and that is the whole point of the rule. The list is
 * still a list, because every other game's closing table takes one.
 */
export function leaders(game: BohnanzaGame): readonly number[] {
  const best = game.players.reduce(
    (most, player) => Math.max(most, player.coins),
    0,
  );
  const count = game.players.length;
  const tied = game.players
    .map((player, seat) => (player.coins === best ? seat : -1))
    .filter((seat) => seat >= 0);
  const stepAway = (seat: number) => (seat - game.starter + count) % count;
  return tied.length <= 1
    ? tied
    : [
        tied.reduce(
          (far, seat) => (stepAway(seat) > stepAway(far) ? seat : far),
          tied[0],
        ),
      ];
}
