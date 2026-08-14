/**
 * Plugs Camel Up into the shared online layer.
 *
 * @module
 * @remarks
 * Almost nothing here is secret, and that is worth saying out loud: the track,
 * the money, the leg bets and the dice still in the pyramid are all on the
 * table in the real game, so they travel in the shared snapshot untouched.
 *
 * Exactly **one** thing is hidden - the overall bets. Those cards go face down
 * on the winner and loser piles, and the whole endgame turns on nobody knowing
 * which camel the others have committed to. So each pile is published as a
 * **count** with the camel struck out, and the real colours ride on the private
 * channel of the seat that laid them. The seat is left in: everybody can see
 * *that* you have bet, and how early, because that is what sets the payout.
 */
import { aiMove } from "@/games/camel-up/engine/ai";
import { applyMove, seatOnTurn } from "@/games/camel-up/engine/moves";
import { isCamelUpGame } from "@/games/camel-up/engine/serialization";
import { createGame, type CamelUpSeat } from "@/games/camel-up/engine/setup";
import {
  CAMELS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Camel,
  type CamelUpGame,
  type CamelUpMove,
  type RaceBet,
} from "@/games/camel-up/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const CAMEL_UP_GAME_ID = "camel-up";

/**
 * The camel a hidden bet is published as.
 *
 * @remarks
 * A real colour, because the state guard has to accept it - but always the
 * same one, so it carries no information. Which camel it is does not matter;
 * that it is never the true one does.
 */
const HIDDEN: Camel = "blau";

/**
 * Camel Up has nothing to choose before a race.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type CamelUpOptions = object;

/** What travels on a seat's private channel. */
export type CamelUpHand = {
  /** The camels this seat laid on the winner pile, in the order laid. */
  readonly winner?: readonly Camel[];
  /** The camels this seat laid on the loser pile, in the order laid. */
  readonly loser?: readonly Camel[];
  /**
   * The colour cards still in this seat's hand.
   *
   * @remarks
   * Sent because the shared snapshot only carries how **many** there are: the
   * five colours minus the ones still held is exactly the list of camels this
   * player has bet on, so publishing them would undo the whole redaction.
   */
  readonly cards?: readonly Camel[];
};

/** The adapter the online layer drives Camel Up through. */
export const camelUpAdapter: OnlineAdapter<
  CamelUpGame,
  CamelUpMove,
  CamelUpHand,
  CamelUpOptions
> = {
  gameId: CAMEL_UP_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): CamelUpGame {
    const table: CamelUpSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): CamelUpGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): CamelUpMove | null {
    return aiMove(game);
  },

  redact(game): CamelUpGame {
    return {
      ...game,
      winnerBets: game.winnerBets.map(hide),
      loserBets: game.loserBets.map(hide),
      // The colour cards left in somebody's hand would give the same thing
      // away by subtraction: five minus what they hold is what they have bet.
      players: game.players.map((player) => ({
        ...player,
        raceCards: player.raceCards.map(() => HIDDEN),
      })),
    };
  },

  privateHands(game): readonly CamelUpHand[] {
    return game.players.map((player, seat) => ({
      winner: mine(game.winnerBets, seat),
      loser: mine(game.loserBets, seat),
      // Sent along so a seat sees its own remaining colours; the shared
      // snapshot only carries how many there are.
      cards: player.raceCards,
    }));
  },

  withOwnHand(game, seatIndex, hand): CamelUpGame {
    return restore(game, seatIndex, hand);
  },

  withAllHands(game, hands): CamelUpGame {
    return hands.reduce<CamelUpGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restore(state, seat, hand),
      game,
    );
  },

  effectFor(): { readonly type: string } | null {
    // The dice and the payouts are already on screen with their result; there
    // is nothing left for a separate animation to announce.
    return null;
  },

  isGameState(value): value is CamelUpGame {
    return isCamelUpGame(value);
  },

  isHand(value): value is CamelUpHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is CamelUpMove {
    return isCamelUpMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = [
  "roll",
  "legBet",
  "raceBet",
  "tile",
  "nextLeg",
];

/** One bet with its camel struck out, its seat and its place left in. */
function hide(bet: RaceBet): RaceBet {
  return { camel: HIDDEN, seat: bet.seat };
}

/** The camels one seat laid on a pile, in the order they were laid. */
function mine(bets: readonly RaceBet[], seat: number): readonly Camel[] {
  return bets.filter((bet) => bet.seat === seat).map((bet) => bet.camel);
}

/**
 * Puts one seat's own bets back into a redacted snapshot.
 *
 * @remarks
 * The piles keep their order, so the n-th card of this seat goes back into the
 * n-th place this seat holds on the pile - which is what its payout depends on.
 */
function restore(
  game: CamelUpGame,
  seat: number,
  hand: CamelUpHand,
): CamelUpGame {
  return {
    ...game,
    winnerBets: refill(game.winnerBets, seat, hand.winner),
    loserBets: refill(game.loserBets, seat, hand.loser),
    players: game.players.map((player, at) =>
      at === seat && Array.isArray(hand.cards)
        ? { ...player, raceCards: [...hand.cards] }
        : player,
    ),
  };
}

/** Writes a seat's own camels back over the blanked ones on a pile. */
function refill(
  bets: readonly RaceBet[],
  seat: number,
  own: readonly Camel[] | undefined,
): readonly RaceBet[] {
  let taken = 0;
  return own === undefined
    ? bets
    : bets.map((bet) => {
        if (bet.seat !== seat) {
          return bet;
        }
        const camel = own[taken] ?? bet.camel;
        taken += 1;
        return { camel, seat };
      });
}

/** Checks an untrusted value is a move. */
function isCamelUpMove(value: unknown): value is CamelUpMove {
  const move = value as { kind?: unknown; camel?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.camel === undefined || CAMELS.includes(move.camel as Camel))
  );
}
