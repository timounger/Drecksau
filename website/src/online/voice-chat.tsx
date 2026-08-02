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

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { database } from "@/online/firebase-app";
import {
  createVoiceRoom,
  type VoicePeer,
  type VoiceRoom,
} from "@/online/voice";
import { voiceVolume } from "@/online/voice-volume";
import type { Seat, SeatId } from "@/online/adapter";

/** German labels of the voice control. */
const T = {
  title: "Sprachchat",
  micOn: "Mikro an",
  micOff: "Mikro aus",
  muted: "Du bist stumm",
  live: "Du bist zu hören",
  denied: "Kein Zugriff aufs Mikrofon.",
  volumeLabel: "Lautstärke der anderen",
  volumeTitle: "Wie laut du die anderen hörst (nicht die Geräusche des Spiels)",
  volumePercent: (n: number) => `${n} %`,
  volumeMuted: "Stumm",
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
  const volume = useSyncExternalStore(
    voiceVolume.subscribe,
    voiceVolume.getSnapshot,
    voiceVolume.getServerSnapshot,
  );

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
      // Read here rather than passed in: a room opened after the slider was
      // moved has to start where it was left, not at full.
      volume: voiceVolume.load(),
    });
    roomRef.current = room;
    return () => {
      roomRef.current = null;
      room.close();
    };
  }, [gameId, code, seatId]);

  // Follow the slider while the room is open. Runs after the effect above, so
  // the room is already there on the first pass.
  useEffect(() => {
    roomRef.current?.setVolume(volume);
  }, [volume]);

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
            // Red while live, nothing while muted: the button must not say
            // green where the state above says red.
            micOn
              ? "cursor-pointer rounded-lg border border-red-500 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
              : "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }
        >
          {micOn ? T.micOff : T.micOn}
        </button>
      </div>

      <p
        data-testid="voice-own-state"
        className={
          micOn
            ? "flex items-center gap-2 font-semibold text-red-600 dark:text-red-400"
            : "flex items-center gap-2 text-zinc-400 dark:text-zinc-500"
        }
      >
        <MicIcon live={micOn} />
        {micOn ? T.live : T.muted}
      </p>

      <VoiceVolume volume={volume} />
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

/**
 * A microphone, red when it is live and greyed out with a stroke when it is not.
 *
 * @param props - whether the microphone is currently sending
 * @returns the icon
 * @remarks
 * Drawn rather than taken from the emoji font: an emoji cannot be recoloured,
 * and the colour is the whole point here. Red is what a recording light looks
 * like everywhere else, and the stroke says "off" even to somebody who cannot
 * tell the two colours apart.
 */
function MicIcon({ live }: { live: boolean }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="voice-mic-icon"
      data-state={live ? "live" : "muted"}
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <path d="M12 19v3" />
      {!live && <path d="m3 3 18 18" />}
    </svg>
  );
}

/** Steps the slider offers between silence and full, so it lands on round numbers. */
const STEPS = 20;

/** Turning 0..1 into whole percent for the label. */
const PERCENT = 100;

/**
 * The slider for how loud everybody else is.
 *
 * @param props - the current volume, from the shared store
 * @returns the slider row
 */
function VoiceVolume({ volume }: { volume: number }): ReactElement {
  return (
    <label
      title={T.volumeTitle}
      className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
    >
      <span aria-hidden="true">{volume === 0 ? "\u{1F507}" : "\u{1F50A}"}</span>
      <span className="sr-only">{T.volumeLabel}</span>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(volume * STEPS)}
        data-testid="voice-volume"
        onChange={(event) =>
          voiceVolume.save(Number(event.target.value) / STEPS)
        }
        className="h-1 w-28 cursor-pointer accent-emerald-600"
      />
      <span className="w-10 text-right tabular-nums">
        {volume === 0
          ? T.volumeMuted
          : T.volumePercent(Math.round(volume * PERCENT))}
      </span>
    </label>
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
