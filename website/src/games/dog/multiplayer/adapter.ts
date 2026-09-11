/**
 * Plugs Dog into the shared online layer.
 *
 * @module
 * @remarks
 * Three things on this table are secret, and they are secret in three different
 * ways.
 *
 * **The hands** belong to a seat, so they ride that seat's private channel and
 * the public snapshot keeps only their length - which is the one thing everyone
 * watches, because a player down to their last card is about to be out of the
 * round.
 *
 * **The pack** belongs to nobody. It is the deal of every round still to come,
 * so it goes into the host-only vault rather than into the snapshot: a client
 * that could read it would know what it is about to be dealt.
 *
 * **The card pushed to the partner** is the odd one. It is face down on the
 * table, so it may not be published - but its owner has to keep seeing which of
 * their own cards it was, so it travels back to that one seat with their hand.
 *
 * Everything else is face up on a real table and stays public here: where every
 * piece stands, what has been played, whose turn it is and how far each team
 * has got.
 */
import { aiMove } from "@/games/dog/engine/ai";
import type { Card } from "@/games/dog/engine/cards";
import { applyMove, seatOnTurn } from "@/games/dog/engine/moves";
import { isDogGame, isDogMove } from "@/games/dog/engine/serialization";
import { createGame, type DogSeat } from "@/games/dog/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type DogGame,
  type DogMove,
} from "@/games/dog/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const DOG_GAME_ID = "dog";

/**
 * What the host chose before dealing.
 *
 * @remarks
 * Nothing yet, and there is a reason: Dog is two against two over four seats,
 * and the only thing a host could set is something the rules do not have.
 */
export type DogOptions = object;

/** What travels off the public snapshot: one seat's cards. */
export type DogHand = {
  /** This seat's own cards. */
  readonly cards?: readonly Card[];
  /** Which of them it has pushed to its partner, while that is open. */
  readonly given?: number | null;
  /** The rest of the pack - the vault's copy, which belongs to no seat. */
  readonly deck?: readonly Card[];
};

/**
 * The card a hidden card is shown as.
 *
 * @remarks
 * A card of the pack in shape and of no pack in fact: the id is below zero, so
 * a snapshot that ever reached a screen unredacted would be obvious rather than
 * subtle. The screens only ever count these.
 */
const HIDDEN: Card = { id: -1, rank: "joker" };

/** How Dog plugs into the online layer. */
export const dogAdapter: OnlineAdapter<DogGame, DogMove, DogHand, DogOptions> =
  {
    gameId: DOG_GAME_ID,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,

    createGame(seats: readonly SeatSetup[], options: DogOptions, seed: number) {
      void options;
      const table: readonly DogSeat[] = seats.map((seat) => ({
        name: seat.name,
        isBot: false,
      }));
      return createGame(table, seed);
    },

    seatIndexOnTurn(game: DogGame) {
      return seatOnTurn(game);
    },

    applyMove(game: DogGame, seatIndex: number, move: DogMove) {
      return applyMove(game, seatIndex, move);
    },

    isFinished(game: DogGame) {
      return game.phase === "gameOver";
    },

    aiMove(game: DogGame) {
      const seat = seatOnTurn(game);
      return seat === null ? null : aiMove(game, seat);
    },

    /**
     * What one turn is, for the clock.
     *
     * @remarks
     * While the cards are pushed across, all four seats act at once and none of
     * them is "on turn" - so the phase is part of the key, or the clock would
     * think the table had hung while four people were choosing at the same time.
     */
    turnKey(game: DogGame) {
      return `${game.phase}:${String(game.round)}:${String(game.turn)}`;
    },

    redact(game: DogGame) {
      return {
        ...game,
        players: game.players.map((player) => ({
          ...player,
          hand: player.hand.map(() => HIDDEN),
        })),
        // The rest of the pack is the next few deals; nobody may read it.
        deck: [],
        // Face down on the table means face down in the snapshot, own seat
        // included - that one gets it back through its own channel.
        given: game.given.map((card) => (card === null ? null : -1)),
      };
    },

    privateHands(game: DogGame) {
      return game.players.map((player, seat) => ({
        cards: player.hand,
        given: game.given[seat] ?? null,
      }));
    },

    withOwnHand(game: DogGame, seatIndex: number, hand: DogHand) {
      return {
        ...game,
        players: game.players.map((player, seat) =>
          seat === seatIndex ? { ...player, hand: hand.cards ?? [] } : player,
        ),
        given: game.given.map((card, seat) =>
          seat === seatIndex ? (hand.given ?? null) : card,
        ),
      };
    },

    withAllHands(game: DogGame, hands: readonly (DogHand | undefined)[]) {
      return {
        ...game,
        players: game.players.map((player, seat) => ({
          ...player,
          hand: hands[seat]?.cards ?? player.hand,
        })),
        given: game.given.map((card, seat) => hands[seat]?.given ?? card),
      };
    },

    vault(game: DogGame) {
      return { deck: game.deck };
    },

    applyVault(game: DogGame, vault: DogHand) {
      return { ...game, deck: vault.deck ?? [] };
    },

    effectFor(pre: DogGame, seatIndex: number, move: DogMove) {
      void pre;
      void seatIndex;
      let type = move.kind;
      if (move.kind === "play") {
        type = move.act.kind as typeof type;
      }
      return { type };
    },

    isGameState(value: unknown): value is DogGame {
      return isDogGame(value);
    },

    isMove(value: unknown): value is DogMove {
      return isDogMove(value);
    },

    isHand(value: unknown): value is DogHand {
      const hand = value as DogHand;
      return (
        typeof value === "object" &&
        value !== null &&
        (hand.cards === undefined || Array.isArray(hand.cards)) &&
        (hand.deck === undefined || Array.isArray(hand.deck)) &&
        (hand.given === undefined ||
          hand.given === null ||
          Number.isInteger(hand.given))
      );
    },
  };
