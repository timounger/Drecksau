/**
 * The open voice chat, held outside React so it survives a screen change.
 *
 * @module
 * @remarks
 * A voice chat is not a piece of user interface, it is a connection - and the
 * connection belongs to the room, not to whatever screen happens to be showing
 * it. Tied to a component it died at every transition the room makes: the lobby
 * gives way to the table, the table gives way to the lobby again for a rematch,
 * and each time the microphone was silently switched off mid-sentence.
 *
 * So the room lives here, keyed by which room it is. The same key means the
 * same connection, however often the screen around it is rebuilt.
 *
 * A **different** key starts over with the microphone off. That is not an
 * oversight: joining another table is not the same as walking back into your
 * own, and nobody should find themselves live in a room they have only just
 * entered.
 */
import { voiceVolume } from "@/online/voice-volume";
import {
  createVoiceRoom,
  type VoicePeer,
  type VoiceRoom,
} from "@/online/voice";
import type { SeatId } from "@/online/adapter";
import type { Database } from "firebase/database";

/** What the screen needs to draw the voice chat. */
export type VoiceState = {
  /** Whether this player is currently being heard. */
  readonly micOn: boolean;
  /** Whether the browser refused the microphone. */
  readonly denied: boolean;
  /** The other players in the voice room, with their connection states. */
  readonly peers: readonly VoicePeer[];
};

/** Which room to be in. */
export type VoiceTarget = {
  readonly database: Database;
  /** Namespaces the room, exactly as the game transport does. */
  readonly gameId: string;
  readonly code: string;
  readonly selfId: SeatId;
};

/**
 * How long a released room waits before hanging up.
 *
 * @remarks
 * React tears the old screen down before it builds the new one, so between the
 * lobby and the table there is a moment with no voice chat mounted at all.
 * Hanging up in that moment would drop a call that is about to be asked for
 * again. Long enough to bridge the gap, short enough that leaving really does
 * leave.
 */
const RECONNECT_GRACE_MS = 250;

/** Nothing open: also what the server renders, where there is no connection. */
const SILENT: VoiceState = { micOn: false, denied: false, peers: [] };

/** The room currently open, and which one it is. */
let openKey: string | null = null;
let openRoom: VoiceRoom | null = null;
let state: VoiceState = SILENT;

/** Set while a released room is waiting to see whether it is wanted again. */
let hangUpTimer: ReturnType<typeof setTimeout> | null = null;

/** Everyone currently drawing the voice chat. */
const listeners = new Set<() => void>();

/**
 * Opens the voice room, or keeps the one already open if it is the same room.
 *
 * @param target - which room to be in and how to reach it
 * @remarks
 * Safe to call on every render pass of an effect: asking for the room you are
 * already in does nothing at all, which is what lets the screen change
 * underneath a running call.
 */
export function openVoice(target: VoiceTarget): void {
  const key = `${target.gameId}|${target.code}|${target.selfId}`;
  cancelHangUp();
  if (key !== openKey) {
    hangUp();
    openKey = key;
    openRoom = createVoiceRoom({
      database: target.database,
      gameId: target.gameId,
      code: target.code,
      selfId: target.selfId,
      onPeers: (peers) => publish({ ...state, peers }),
      // The slider is remembered between visits, so a room opened later starts
      // where it was left rather than at full.
      volume: voiceVolume.load(),
    });
    publish(SILENT);
  }
}

/**
 * Says this screen no longer needs the voice room.
 *
 * @remarks
 * Not a hang-up: the call only ends if nobody asks for the same room again
 * within {@link RECONNECT_GRACE_MS}.
 */
export function releaseVoice(): void {
  cancelHangUp();
  hangUpTimer = setTimeout(() => {
    hangUpTimer = null;
    hangUp();
    publish(SILENT);
  }, RECONNECT_GRACE_MS);
}

/**
 * Turns the microphone on or off.
 *
 * @param on - whether to be heard
 * @remarks
 * Refused, or no microphone at all, leaves the player muted and says so, rather
 * than showing a live button that sends nothing.
 */
export function setVoiceMic(on: boolean): void {
  const room = openRoom;
  if (room !== null) {
    void room.setMicOn(on).then(
      () => publish({ ...state, micOn: on, denied: false }),
      () => publish({ ...state, micOn: false, denied: true }),
    );
  }
}

/**
 * Sets how loud the other players are, from 0 to 1.
 *
 * @param volume - the new level
 */
export function setVoiceVolume(volume: number): void {
  openRoom?.setVolume(volume);
}

/**
 * Subscribes to the voice state, for `useSyncExternalStore`.
 *
 * @param listener - called whenever anything below changes
 * @returns the unsubscribe function
 */
export function subscribeVoice(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The current voice state.
 *
 * @returns microphone, permission and peers
 */
export function voiceState(): VoiceState {
  return state;
}

/**
 * What the prerendered page shows.
 *
 * @returns a silent, empty voice chat
 * @remarks
 * There is no connection on a server, and the markup has to match what the
 * browser draws before the room is open.
 */
export function serverVoiceState(): VoiceState {
  return SILENT;
}

/** Replaces the state and tells everyone drawing it. */
function publish(next: VoiceState): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

/** Closes the open room, if there is one. */
function hangUp(): void {
  openRoom?.close();
  openRoom = null;
  openKey = null;
}

/** Calls off a pending hang-up, because the room is wanted after all. */
function cancelHangUp(): void {
  if (hangUpTimer !== null) {
    clearTimeout(hangUpTimer);
    hangUpTimer = null;
  }
}
