/**
 * Plugs Sky Team into the shared online layer.
 *
 * @module
 * @remarks
 * This is the mode the game was designed for, and the one piece of it that
 * software does better than cardboard: at the table the screen between you is a
 * bit of plastic and an agreement, here the other side's dice **are not sent**.
 * There is nothing to peek at, because nothing arrives.
 *
 * What travels instead is a row of zeros of the right length, so each of you
 * can see how many dice are still behind the other's screen - which is public
 * at a real table, and is most of what the rhythm of the game is read from.
 *
 * The talking is left alone. The text chat stays open and the voice chat with
 * it, because the silence is a rule between two people, not something a program
 * should enforce - exactly as it is at the table, where nothing stops you
 * either.
 */
import { aiMove } from "@/games/sky-team/engine/ai";
import { applyMove, seatOnTurn } from "@/games/sky-team/engine/moves";
import { isSkyTeamGame } from "@/games/sky-team/engine/serialization";
import { createGame, type SkyTeamSeat } from "@/games/sky-team/engine/setup";
import type { Seat } from "@/games/sky-team/engine/spaces";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type SkyTeamGame,
  type SkyTeamMove,
} from "@/games/sky-team/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const SKY_TEAM_GAME_ID = "sky-team";

/**
 * Sky Team has nothing to choose before a landing.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type SkyTeamOptions = object;

/** What travels on a seat's private channel: that seat's own dice. */
export type SkyTeamHand = {
  readonly dice?: readonly number[];
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = ["place", "reroll", "next"];

/** The adapter the online layer drives Sky Team through. */
export const skyTeamAdapter: OnlineAdapter<
  SkyTeamGame,
  SkyTeamMove,
  SkyTeamHand,
  SkyTeamOptions
> = {
  gameId: SKY_TEAM_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], unusedOptions, seed): SkyTeamGame {
    const table: SkyTeamSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): SkyTeamGame | null {
    return seatIndex === 0 || seatIndex === 1
      ? applyMove(game, seatIndex as Seat, move)
      : null;
  },

  isFinished(game): boolean {
    return game.stage === "won" || game.stage === "lost";
  },

  aiMove(game): SkyTeamMove | null {
    // The shared layer asks only "what would you do", so the seat has to come
    // from the game - which is the same seat it would have taken over anyway.
    const seat = seatOnTurn(game);
    return seat === null ? null : aiMove(game, seat);
  },

  redact(game): SkyTeamGame {
    return {
      ...game,
      players: [
        { ...game.players[0], dice: game.players[0].dice.map(() => 0) },
        { ...game.players[1], dice: game.players[1].dice.map(() => 0) },
      ],
    };
  },

  privateHands(game): readonly SkyTeamHand[] {
    return game.players.map((player) => ({ dice: player.dice }));
  },

  withOwnHand(game, seatIndex, hand): SkyTeamGame {
    return restore(game, seatIndex, hand);
  },

  withAllHands(game, hands): SkyTeamGame {
    return hands.reduce<SkyTeamGame>(
      (state, hand, seat) =>
        hand === undefined ? state : restore(state, seat, hand),
      game,
    );
  },

  effectFor(): { readonly type: string } | null {
    // A die landing on a space is already the loudest thing on the screen.
    return null;
  },

  isGameState(value): value is SkyTeamGame {
    return isSkyTeamGame(value);
  },

  isHand(value): value is SkyTeamHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is SkyTeamMove {
    return isSkyTeamMove(value);
  },
};

/**
 * Puts one seat's own dice back into a redacted snapshot.
 *
 * @remarks
 * Only where the count still matches. A hand that has changed since the private
 * copy was sent - the seat placed a die while it was in flight - is left blank
 * rather than filled with stale numbers; the next snapshot fixes it.
 */
function restore(
  game: SkyTeamGame,
  seat: number,
  hand: SkyTeamHand,
): SkyTeamGame {
  const own = hand.dice;
  const player = game.players[seat];
  return player === undefined ||
    own === undefined ||
    own.length !== player.dice.length
    ? game
    : {
        ...game,
        players: [
          seat === 0 ? { ...game.players[0], dice: [...own] } : game.players[0],
          seat === 1 ? { ...game.players[1], dice: [...own] } : game.players[1],
        ],
      };
}

/** Checks an untrusted value is a move. */
function isSkyTeamMove(value: unknown): value is SkyTeamMove {
  const move = value as { kind?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind)
  );
}
