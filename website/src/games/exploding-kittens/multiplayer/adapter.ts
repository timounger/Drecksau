/**
 * Plugs Exploding Kittens into the shared online layer.
 *
 * @module
 * @remarks
 * Three things are secret here and all three are secret in the same direction -
 * from the others, not from their owner: your **hand**, your **Blick in die
 * Zukunft**, and the **draw pile** (which is nobody's). So the host publishes a
 * table with every hand and the whole pile blanked out, and sends each seat its
 * own cards and its own peek down a private channel.
 *
 * The pile needs no vault of its own, unlike the face-down rows in
 * Jammerlappen. Nobody owns it, so nobody has to have it restored - but a host
 * that quits would take the order of the cards with it, and with it the one
 * kitten everybody is walking around. {@link vault} keeps that order for
 * whoever takes over.
 *
 * What stays public is what lies face up at a real table: the discard pile, how
 * many cards each seat holds, how deep the draw pile is, and who has exploded.
 */
import { aiMove } from "@/games/exploding-kittens/engine/ai";
import { hiddenCard, type Card } from "@/games/exploding-kittens/engine/cards";
import { applyMove, seatOnTurn } from "@/games/exploding-kittens/engine/moves";
import { isExplodingKittensGame } from "@/games/exploding-kittens/engine/serialization";
import {
  createGame,
  type ExplodingKittensOptions,
  type ExplodingKittensSeat,
} from "@/games/exploding-kittens/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type ExplodingKittensGame,
  type ExplodingKittensMove,
} from "@/games/exploding-kittens/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const EK_GAME_ID = "exploding-kittens";

/** What travels off the public snapshot. */
export type ExplodingKittensHand = {
  /** One seat's own cards, on that seat's private channel. */
  readonly cards?: readonly Card[];
  /** What that seat last saw on top of the pile, if anything. */
  readonly peek?: readonly Card[] | null;
  /** The draw pile in order - the host-only vault, owned by no seat. */
  readonly draw?: readonly Card[];
};

/** The adapter the online layer drives the game through. */
export const explodingKittensAdapter: OnlineAdapter<
  ExplodingKittensGame,
  ExplodingKittensMove,
  ExplodingKittensHand,
  ExplodingKittensOptions
> = {
  gameId: EK_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], options, seed): ExplodingKittensGame {
    const table: ExplodingKittensSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, { fastGame: options?.fastGame === true }, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  turnKey(game): string {
    // The phase belongs in the key. A turn here can be interrupted by a window
    // anybody may answer and by a Gefallen somebody else has to settle; keyed
    // on the seat alone, a player who dithered over one of those would eat the
    // clock meant for the turn it interrupted.
    return `${game.phase}-${seatOnTurn(game) ?? -1}-${game.pending?.nopes ?? 0}`;
  },

  applyMove(game, seatIndex, move): ExplodingKittensGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): ExplodingKittensMove | null {
    // Must be the seat seatIndexOnTurn names - that is the seat the layer
    // applies the move as, and here it is often not the active player.
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): ExplodingKittensGame {
    // Hands become the right number of card backs and the pile becomes its own
    // depth. Both counts are public at a real table; neither set of faces is.
    //
    // The kitten held in mid-air stays as it is on purpose: everybody watched
    // it get drawn and defused. Where it goes back is the secret, and that is
    // a move nobody else is told about, not a field to blank out.
    return {
      ...game,
      players: game.players.map((player, seat) => ({
        ...player,
        hand: player.hand.map((unused, at) => hiddenCard(`h${seat}-${at}`)),
        peek: null,
      })),
      draw: game.draw.map((unused, at) => hiddenCard(`d${at}`)),
    };
  },

  privateHands(game): readonly ExplodingKittensHand[] {
    return game.players.map((player) => ({
      cards: player.hand,
      peek: player.peek,
    }));
  },

  vault(game): ExplodingKittensHand | null {
    return { draw: game.draw };
  },

  applyVault(game, vault): ExplodingKittensGame {
    const draw = vault.draw;
    return draw === undefined || draw.length !== game.draw.length
      ? game
      : { ...game, draw: [...draw] };
  },

  withOwnHand(game, seatIndex, hand): ExplodingKittensGame {
    return restore(game, seatIndex, hand);
  },

  withAllHands(game, hands): ExplodingKittensGame {
    return hands.reduce<ExplodingKittensGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restore(state, seat, hand),
      game,
    );
  },

  effectFor(): { readonly type: string } | null {
    // A card landing on the discard pile is already the loudest thing on
    // screen, and the loudest thing of all announces itself in the log.
    return null;
  },

  isGameState(value): value is ExplodingKittensGame {
    return isExplodingKittensGame(value);
  },

  isHand(value): value is ExplodingKittensHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is ExplodingKittensMove {
    return isExplodingKittensMove(value);
  },
};

/**
 * Puts one seat's own cards and its own peek back into a redacted snapshot.
 *
 * @remarks
 * Only where the count still matches. A hand that has changed since the private
 * copy was sent - somebody stole from it while it was in flight - is left face
 * down rather than filled with stale cards; the next snapshot fixes it, and a
 * card back is honest about not knowing.
 */
function restore(
  game: ExplodingKittensGame,
  seat: number,
  hand: ExplodingKittensHand,
): ExplodingKittensGame {
  const own = hand.cards;
  const player = game.players[seat];
  return player === undefined ||
    own === undefined ||
    own.length !== player.hand.length
    ? game
    : {
        ...game,
        players: game.players.map((entry, at) =>
          at === seat
            ? { ...entry, hand: [...own], peek: hand.peek ?? null }
            : entry,
        ),
      };
}

/** The move kinds a client may send - this game's own, and no others. */
const MOVE_KINDS: readonly string[] = [
  "play",
  "combo",
  "draw",
  "nope",
  "letThrough",
  "give",
  "insert",
];

/** Checks an untrusted value is a move. */
function isExplodingKittensMove(value: unknown): value is ExplodingKittensMove {
  const move = value as {
    kind?: unknown;
    cardId?: unknown;
    cardIds?: unknown;
    target?: unknown;
    want?: unknown;
    at?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.cardId === undefined || typeof move.cardId === "string") &&
    (move.want === undefined || typeof move.want === "string") &&
    (move.target === undefined || Number.isInteger(move.target)) &&
    (move.at === undefined || Number.isInteger(move.at)) &&
    (move.cardIds === undefined ||
      (Array.isArray(move.cardIds) &&
        move.cardIds.every((id) => typeof id === "string")))
  );
}
