/**
 * Plugs Wurfduell into the shared online layer.
 *
 * @module
 * @remarks
 * Nothing is secret: both fighters, both hearts and the wind are on screen for
 * everyone. So the shared snapshot is simply the match, and the only thing that
 * travels from a player is the throw itself - angle, strength and ability. The
 * host flies it with the same engine and publishes what it hit; both screens
 * then fly it again for the animation and land in the same place.
 *
 * **The match never counts as finished for the room.** A finished room takes
 * no more moves, and the rematch is a move: both press the button, and the
 * engine deals the next match in place, keeping the score. So the end of a
 * match is a phase of the game, not of the room.
 *
 * When a player runs out of time - or drops out and the computer takes over
 * their seat - the move made for them is deliberately feeble: a fighter
 * chosen at random and a weak lob. Sitting still must never be the best
 * tactic.
 */
import {
  WEAK_THROW,
  applyMove,
  createGame,
  randomCharacter,
  seatOnTurn,
  turnKey,
  PLAYER_COUNT,
} from "@/games/wurfduell/engine/game";
import { isDuelGame, isDuelMove } from "@/games/wurfduell/engine/serialization";
import type { DuelGame, DuelMove } from "@/games/wurfduell/engine/types";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces this game's rooms in the shared database. */
export const WURFDUELL_GAME_ID = "wurfduell";

/** Nothing to choose before a match - the fighters are chosen inside it. */
export type DuelOptions = object;

/** Nothing travels privately. */
export type DuelHand = object;

/** Salt for the fighter picked for a player who did not choose in time. */
const AUTO_PICK_SALT = 77;

/** The adapter the online layer drives Wurfduell through. */
export const wurfduellAdapter: OnlineAdapter<
  DuelGame,
  DuelMove,
  DuelHand,
  DuelOptions
> = {
  gameId: WURFDUELL_GAME_ID,
  minPlayers: PLAYER_COUNT,
  maxPlayers: PLAYER_COUNT,

  createGame(seats: readonly SeatSetup[], _options, seed): DuelGame {
    return createGame(
      seats.map((seat) => seat.name),
      seed >>> 0,
    );
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): DuelGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(): boolean {
    // See the module notes: the rematch is played inside the same room.
    return false;
  },

  aiMove(game): DuelMove | null {
    let move: DuelMove | null = null;
    const seat = seatOnTurn(game);
    if (game.phase === "pick" && seat !== null) {
      move = {
        kind: "pick",
        character: randomCharacter(game.seed, AUTO_PICK_SALT + seat),
      };
    } else if (game.phase === "throw") {
      move = { kind: "throw", ...WEAK_THROW, auto: true };
    }
    return move;
  },

  turnKey(game): string {
    return turnKey(game);
  },

  redact(game): DuelGame {
    return game;
  },

  privateHands(game): readonly DuelHand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): DuelGame {
    return game;
  },

  withAllHands(game): DuelGame {
    return game;
  },

  effectFor(): { readonly type: string } | null {
    // The flight itself is the animation; every screen replays it.
    return null;
  },

  isGameState(value): value is DuelGame {
    return isDuelGame(value);
  },

  isHand(value): value is DuelHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is DuelMove {
    return isDuelMove(value);
  },
};
