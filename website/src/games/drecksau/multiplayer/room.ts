/**
 * Drecksau-specific aliases for the shared online room types.
 *
 * @module
 * @remarks
 * The room model itself is game-agnostic and lives in {@link @/online/room};
 * this module only pins the generic {@link RoomState} to the Drecksau game
 * state, so the Drecksau UI can keep importing a plain `RoomState`.
 */
import type { GameState } from "@/games/drecksau/engine/state";
import type { RoomState as GenericRoomState } from "@/online/adapter";

export type { RoomPhase, RoomEffect, Seat, SeatId } from "@/online/adapter";

/** A Drecksau room: the shared room specialised to the Drecksau game state. */
export type RoomState = GenericRoomState<GameState>;
