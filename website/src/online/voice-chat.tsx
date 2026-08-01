/**
 * The voice-chat control: one microphone button and who can be heard.
 *
 * @module
 * @remarks
 * Shared by every online game, exactly like {@link ./online-chat}. Mounting it
 * beside the chat is all a game has to do.
 *
 * Muted is the state you start in, and the microphone is not even asked for
 * until the first press - so a player who never wants to talk is never shown a
 * permission dialog. Listening starts on its own, because a voice chat where
 * nobody hears anybody until everyone has pressed a button is no voice chat.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { database } from "@/online/firebase-app";
import {
  createVoiceRoom,
  type VoicePeer,
  type VoiceRoom,
} from "@/online/voice";
import type { Seat, SeatId } from "@/online/adapter";

/** German labels of the voice control. */
const T = {
  title: "Sprachchat",
  micOn: "Mikro an",
  micOff: "Mikro aus",
  muted: "Du bist stumm",
  live: "Du bist zu hören",
  denied: "Kein Zugriff aufs Mikrofon.",
  connecting: "verbindet …",
  connected: "verbunden",
  lost: "kein Ton",
  alone: "Noch niemand sonst da.",
  hint: "Der Ton läuft direkt zwischen euch, nicht über einen Server.",
} as const;

/** Props of {@link VoiceChat}. */
export type VoiceChatProps = {
  /** Namespaces the room, as the game transport does. */
  readonly gameId: string;
  readonly code: string;
  /** Own seat, or null before the room is joined. */
  readonly seatId: SeatId | null;
  /** The players in the room, for showing names beside the connection state. */
  readonly seats: readonly Seat[];
};

/**
 * Renders the microphone button and the state of every other player's line.
 *
 * @param props - room, own seat and the seat list
 * @returns the control, or nothing before a seat is taken
 */
export function VoiceChat({
  gameId,
  code,
  seatId,
  seats,
}: VoiceChatProps): ReactElement | null {
  const roomRef = useRef<VoiceRoom | null>(null);
  const [peers, setPeers] = useState<readonly VoicePeer[]>([]);
  const [micOn, setMicOn] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (seatId === null) {
      return;
    }
    const room = createVoiceRoom({
      database: database(),
      gameId,
      code,
      selfId: seatId,
      onPeers: setPeers,
    });
    roomRef.current = room;
    return () => {
      roomRef.current = null;
      room.close();
    };
  }, [gameId, code, seatId]);

  if (seatId === null) {
    return null;
  }

  const toggle = () => {
    const room = roomRef.current;
    if (room === null) {
      return;
    }
    const next = !micOn;
    setDenied(false);
    room
      .setMicOn(next)
      .then(() => setMicOn(next))
      // Refused, or no microphone at all: stay muted and say so, rather than
      // showing a live button that sends nothing.
      .catch(() => {
        setMicOn(false);
        setDenied(true);
      });
  };

  const nameOf = (id: SeatId) =>
    seats.find((seat) => seat.id === id)?.name ?? id;

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{T.title}</h2>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={micOn}
          className={
            micOn
              ? "cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              : "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }
        >
          {micOn ? T.micOff : T.micOn}
        </button>
      </div>

      <p
        data-testid="voice-own-state"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        {micOn ? T.live : T.muted}
      </p>
      {denied && (
        <p className="text-xs text-red-600 dark:text-red-400">{T.denied}</p>
      )}

      {peers.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{T.alone}</p>
      ) : (
        <ul className="flex flex-col gap-1" data-testid="voice-peers">
          {peers.map((peer) => (
            <li
              key={peer.seatId}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span>{nameOf(peer.seatId)}</span>
              <span className={stateClass(peer)}>{stateLabel(peer)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500">{T.hint}</p>
    </section>
  );
}

/** The words for one peer's line. */
function stateLabel(peer: VoicePeer): string {
  switch (peer.link) {
    case "live":
      return T.connected;
    case "lost":
      return T.lost;
    default:
      return T.connecting;
  }
}

/** The colour for one peer's line: green when it carries, red when it does not. */
function stateClass(peer: VoicePeer): string {
  switch (peer.link) {
    case "live":
      return "text-emerald-600 dark:text-emerald-400";
    case "lost":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
}
