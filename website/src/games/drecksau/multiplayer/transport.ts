/**
 * Drecksau-specific aliases for the shared online transport types.
 *
 * @module
 * @remarks
 * The transport interface is game-agnostic and lives in
 * {@link @/online/transport}; this module only pins the generic types to the
 * Drecksau game, so the Drecksau UI can keep importing plain names.
 */
import type { Card } from "@/games/drecksau/engine/cards";
import type { GameState, Move } from "@/games/drecksau/engine/state";
import type {
  MoveIntent as GenericMoveIntent,
  RoomTransport as GenericRoomTransport,
} from "@/online/transport";

export type { ChatMessage } from "@/online/transport";

/** A Drecksau move intent from a guest. */
export type MoveIntent = GenericMoveIntent<Move>;

/** A transport for a Drecksau room. */
export type RoomTransport = GenericRoomTransport<GameState, Move, Card[]>;
