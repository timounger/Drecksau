/**
 * Plugs Skyjo into the shared online layer.
 *
 * @module
 * @remarks
 * Skyjo hides its cards differently from a normal card game: the face-down
 * values are secret from **everyone**, their owner included. So there is no
 * private hand to hand out - the values are stripped for every client and kept
 * only by the host.
 *
 * That leaves one thing to arrange: a host who drops out would take the secret
 * with them. The values and the draw pile therefore travel in the host vault,
 * which the online layer keeps on a channel a taking-over host can read but a
 * player cannot. {@link vault} packs them, {@link applyVault} puts them back.
 */
import { aiMove } from "@/games/skyjo/engine/ai";
import { applyMove, seatOnTurn } from "@/games/skyjo/engine/moves";
import { isSkyjoGame } from "@/games/skyjo/engine/serialization";
import { createGame, type SkyjoSeat } from "@/games/skyjo/engine/setup";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type SkyjoGame,
  type SkyjoMove,
} from "@/games/skyjo/engine/state";
import type { OnlineAdapter, SeatSetup } from "@/online/adapter";

/** Namespaces Skyjo's rooms in the shared database. */
export const SKYJO_GAME_ID = "skyjo";

/** The value a hidden card is published as; the real one stays with the host. */
const HIDDEN = 0;

/**
 * Skyjo has nothing to choose before a game.
 *
 * @remarks
 * Deliberately `object` and not `Record<string, never>`: the online layer adds
 * its own auto-play setting on top of a game's options, which an empty index
 * signature would forbid.
 */
export type SkyjoOptions = object;

/**
 * What travels on the private channel.
 *
 * @remarks
 * The online layer uses one type for both a seat's own data and the host
 * vault, so this covers both cases. For a **seat** it is always empty: in Skyjo
 * a player knows no more about their own cards than anybody else. For the
 * **vault** every field is filled, and that copy only ever reaches a client
 * that is taking over as host.
 */
export type SkyjoHand = {
  /** Vault only: every player's real card values, seat by seat. */
  readonly values?: readonly (readonly number[])[];
  /** Vault only: the face-down draw pile. */
  readonly deck?: readonly number[];
  /** Vault only: the card in the current player's hand. */
  readonly drawn?: number | null;
};

/** The filled-in form of {@link SkyjoHand}, as the host stashes it. */
export type SkyjoVault = Required<SkyjoHand>;

/** The adapter the online layer drives Skyjo through. */
export const skyjoAdapter: OnlineAdapter<
  SkyjoGame,
  SkyjoMove,
  SkyjoHand,
  SkyjoOptions
> = {
  gameId: SKYJO_GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(seats: readonly SeatSetup[], _options, seed): SkyjoGame {
    const table: SkyjoSeat[] = seats.map((seat) => ({
      name: seat.name,
      isBot: false,
    }));
    return createGame(table, seed);
  },

  seatIndexOnTurn(game): number | null {
    return seatOnTurn(game);
  },

  applyMove(game, seatIndex, move): SkyjoGame | null {
    return applyMove(game, seatIndex, move);
  },

  isFinished(game): boolean {
    return game.phase === "gameOver";
  },

  aiMove(game): SkyjoMove | null {
    return aiMove(game);
  },

  /**
   * Hides every card nobody may see yet.
   *
   * @remarks
   * Face-down cards, the draw pile and a card in somebody's hand all go out
   * blanked. What stays is exactly what a player at the table can see.
   */
  redact(game): SkyjoGame {
    return {
      ...game,
      players: game.players.map((player) => ({
        ...player,
        grid: player.grid.map((slot) =>
          slot.state === "down" ? { ...slot, value: HIDDEN } : slot,
        ),
      })),
      deck: game.deck.map(() => HIDDEN),
      drawn: game.drawn === null ? null : HIDDEN,
    };
  },

  privateHands(game): readonly SkyjoHand[] {
    return game.players.map(() => ({}));
  },

  withOwnHand(game): SkyjoGame {
    // Nothing to put back: a player's own face-down cards stay secret to them.
    return game;
  },

  withAllHands(game): SkyjoGame {
    return game;
  },

  vault(game): SkyjoHand {
    return {
      values: game.players.map((player) => player.grid.map((s) => s.value)),
      deck: game.deck,
      drawn: game.drawn,
    };
  },

  applyVault(game, vault): SkyjoGame {
    return isSkyjoVault(vault, game)
      ? {
          ...game,
          players: game.players.map((player, seat) => ({
            ...player,
            grid: player.grid.map((slot, index) => ({
              ...slot,
              value: vault.values[seat][index],
            })),
          })),
          deck: [...vault.deck],
          drawn: vault.drawn,
        }
      : game;
  },

  effectFor(): { readonly type: string } | null {
    // Skyjo animates nothing the board does not already show for itself.
    return null;
  },

  isGameState(value): value is SkyjoGame {
    return isSkyjoGame(value);
  },

  isHand(value): value is SkyjoHand {
    return typeof value === "object" && value !== null;
  },

  isMove(value): value is SkyjoMove {
    return isSkyjoMove(value);
  },
};

/** The move kinds a client may send. */
const MOVE_KINDS: readonly string[] = [
  "flip",
  "takeDiscard",
  "draw",
  "swapDrawn",
  "discardDrawn",
  "nextRound",
];

/** Checks an untrusted value is a move. */
function isSkyjoMove(value: unknown): value is SkyjoMove {
  const move = value as { kind?: unknown; index?: unknown };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.kind === "string" &&
    MOVE_KINDS.includes(move.kind) &&
    (move.index === undefined || Number.isInteger(move.index))
  );
}

/** Checks a vault read back off the wire fits the table it belongs to. */
function isSkyjoVault(value: unknown, game: SkyjoGame): value is SkyjoVault {
  const vault = value as SkyjoVault;
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray(vault.values) &&
    vault.values.length === game.players.length &&
    vault.values.every(
      (row, seat) =>
        Array.isArray(row) &&
        row.length === game.players[seat].grid.length &&
        row.every((card) => Number.isInteger(card)),
    ) &&
    Array.isArray(vault.deck) &&
    vault.deck.every((card) => Number.isInteger(card)) &&
    (vault.drawn === null || Number.isInteger(vault.drawn))
  );
}
