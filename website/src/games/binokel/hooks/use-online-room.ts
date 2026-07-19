/**
 * The Binokel online room hook: the shared hook bound to the Binokel adapter.
 *
 * @module
 * @remarks
 * All the room orchestration lives in {@link @/online/use-online-room}; this
 * module only supplies the Binokel adapter and pins the exposed types to the
 * Binokel game, so the Binokel UI can import a plain `useOnlineRoom`.
 */
"use client";

import { useOnlineRoom as useSharedRoom } from "@/online/use-online-room";
import type {
  OnlineRoom as GenericOnlineRoom,
  OnlineSession,
  StartChoices as GenericStartChoices,
} from "@/online/use-online-room";
import {
  binokelAdapter,
  type BinokelMove,
  type BinokelOptions,
} from "@/games/binokel/multiplayer/adapter";
import type { GameState } from "@/games/binokel/engine/state";

export type { OnlineSession, OnlineStatus } from "@/online/use-online-room";

/** The choices a Binokel host makes when starting a game. */
export type StartChoices = GenericStartChoices<BinokelOptions>;

/** What the Binokel online UI gets from the hook. */
export type OnlineRoom = GenericOnlineRoom<
  GameState,
  BinokelMove,
  BinokelOptions
>;

/**
 * Connects to a Binokel room and drives it.
 *
 * @param session - what to do, or null to stay idle until the player chooses
 * @returns the room state and the actions the UI needs
 */
export function useOnlineRoom(session: OnlineSession | null): OnlineRoom {
  return useSharedRoom(binokelAdapter, session);
}
