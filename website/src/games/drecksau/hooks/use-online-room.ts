/**
 * The Drecksau online room hook: the shared hook bound to the Drecksau adapter.
 *
 * @module
 * @remarks
 * All the room orchestration lives in {@link @/online/use-online-room}; this
 * module only supplies the Drecksau adapter and pins the exposed types to the
 * Drecksau game, so the Drecksau UI can keep importing a plain `useOnlineRoom`.
 */
"use client";

import { useOnlineRoom as useSharedRoom } from "@/online/use-online-room";
import type {
  OnlineRoom as GenericOnlineRoom,
  OnlineSession,
  StartChoices as GenericStartChoices,
} from "@/online/use-online-room";
import {
  drecksauAdapter,
  type DrecksauOptions,
} from "@/games/drecksau/multiplayer/adapter";
import type { GameState, Move } from "@/games/drecksau/engine/state";

export type { OnlineSession, OnlineStatus } from "@/online/use-online-room";

/** The choices a Drecksau host makes when starting a game. */
export type StartChoices = GenericStartChoices<DrecksauOptions>;

/** What the Drecksau online UI gets from the hook. */
export type OnlineRoom = GenericOnlineRoom<GameState, Move, DrecksauOptions>;

/**
 * Connects to a Drecksau room and drives it.
 *
 * @param session - what to do, or null to stay idle until the player chooses
 * @returns the room state and the actions the UI needs
 */
export function useOnlineRoom(session: OnlineSession | null): OnlineRoom {
  return useSharedRoom(drecksauAdapter, session);
}
