/**
 * Online multiplayer: the entry screen, the lobby and the running game.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { loadSettings } from "@/games/drecksau/settings/app-settings";
import {
  loadOnlineHostSettings,
  saveOnlineHostSettings,
} from "@/games/drecksau/settings/online-host-settings";
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/online/room-code";
import type { RoomState } from "@/games/drecksau/multiplayer/room";
import {
  useOnlineRoom,
  type OnlineRoom,
  type OnlineSession,
} from "@/games/drecksau/hooks/use-online-room";
import { ONLINE_TEXTS } from "@/games/drecksau/i18n/translations";
import { OnlineBoard } from "./online-board";

/** Query parameter that carries a room code in an invite link. */
const ROOM_QUERY_PARAM = "raum";

/** How long the "copied!" confirmation stays up, in milliseconds. */
const COPIED_FEEDBACK_MS = 1500;

/** Milliseconds in a second, for the auto-play labels. */
const MS_PER_SECOND = 1000;
/** The auto-play timeouts the host can pick from, in milliseconds. */
const AUTO_PLAY_SHORT_MS = 15_000;
const AUTO_PLAY_MEDIUM_MS = 30_000;
const AUTO_PLAY_LONG_MS = 60_000;

/** Auto-play choices in the lobby: off, then a few sensible timeouts. */
const AUTO_PLAY_OPTIONS: readonly { readonly ms: number | null }[] = [
  { ms: null },
  { ms: AUTO_PLAY_SHORT_MS },
  { ms: AUTO_PLAY_MEDIUM_MS },
  { ms: AUTO_PLAY_LONG_MS },
];

/** Default selection: 30 seconds - the third option, a sensible middle. */
const DEFAULT_AUTO_PLAY_INDEX = 2;

/** Label for one auto-play choice. */
function autoPlayLabel(ms: number | null): string {
  return ms === null
    ? ONLINE_TEXTS.autoPlayOff
    : ONLINE_TEXTS.autoPlaySeconds(ms / MS_PER_SECOND);
}

/** The option index for a saved timeout, or the default if it is unknown. */
function autoPlayIndexOf(ms: number | null): number {
  const found = AUTO_PLAY_OPTIONS.findIndex((option) => option.ms === ms);
  return found >= 0 ? found : DEFAULT_AUTO_PLAY_INDEX;
}

/**
 * Renders the whole online mode, from joining a room to playing.
 *
 * @returns the online element
 */
export function OnlineGame(): ReactElement {
  const [session, setSession] = useState<OnlineSession | null>(null);
  const room = useOnlineRoom(session);

  let body: ReactElement;
  if (session === null) {
    body = <OnlineEntry onStart={setSession} />;
  } else if (room.status === "error") {
    body = <OnlineError onBack={() => setSession(null)} />;
  } else if (room.room === null || room.status === "connecting") {
    body = <p className="text-sm">{ONLINE_TEXTS.connecting}</p>;
  } else if (room.status === "lobby") {
    body = (
      <OnlineLobby
        room={room.room}
        online={room}
        onLeave={() => setSession(null)}
      />
    );
  } else {
    body = (
      <PlayingArea
        room={room.room}
        online={room}
        onLeave={() => setSession(null)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ONLINE_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {ONLINE_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href="/drecksau"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {ONLINE_TEXTS.backToGame}
        </Link>
      </header>
      {body}
    </div>
  );
}

/** Props of {@link OnlineEntry}. */
type OnlineEntryProps = {
  readonly onStart: (session: OnlineSession) => void;
};

/** The first screen: pick a name, then host or join a room. */
function OnlineEntry({ onStart }: OnlineEntryProps): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Prefill the name from the settings and the code from an invite link, both
  // only in the browser so the prerendered HTML stays stable. Reading storage
  // and the URL into state on mount is exactly the sync this effect is for.
  useEffect(() => {
    const savedName = loadSettings().playerName.trim();
    const params = new URLSearchParams(window.location.search);
    const invited = params.get(ROOM_QUERY_PARAM);
    if (savedName.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time prefill
      setName(savedName);
    }
    if (invited !== null) {
      setCode(normalizeRoomCode(invited));
    }
  }, []);

  const host = () => onStart({ mode: "host", code: generateRoomCode(), name });
  const join = () => {
    const clean = normalizeRoomCode(code);
    if (isValidRoomCode(clean)) {
      onStart({ mode: "guest", code: clean, name });
    }
  };

  return (
    <div className="flex max-w-md flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{ONLINE_TEXTS.yourName}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={ONLINE_TEXTS.yourNamePlaceholder}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="button"
        onClick={host}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {ONLINE_TEXTS.createRoom}
      </button>

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{ONLINE_TEXTS.roomCode}</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder={ONLINE_TEXTS.roomCodePlaceholder}
            maxLength={4}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono tracking-widest uppercase dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="button"
          onClick={join}
          disabled={!isValidRoomCode(normalizeRoomCode(code))}
          className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {ONLINE_TEXTS.joinRoom}
        </button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {ONLINE_TEXTS.hostLeftNotice}
      </p>
    </div>
  );
}

/** Props shared by the lobby and the playing area. */
type RoomViewProps = {
  readonly room: RoomState;
  readonly online: OnlineRoom;
  readonly onLeave: () => void;
};

/** The lobby: share the code, see who is in, and (host) start the game. */
function OnlineLobby({ room, online, onLeave }: RoomViewProps): ReactElement {
  // Start from the host's last choices. This component only ever mounts on the
  // client (after connecting), so reading storage here is safe.
  const [initial] = useState(loadOnlineHostSettings);
  const [withExpansion, setWithExpansion] = useState(initial.withExpansion);
  const [withDefense, setWithDefense] = useState(initial.withDefense);
  const [autoPlayIndex, setAutoPlayIndex] = useState(() =>
    autoPlayIndexOf(initial.autoPlayMs),
  );
  const enoughPlayers = room.seats.length >= 2;

  // Remember the host's choices so the next room starts from them. Only the
  // host changes these, so a guest never overwrites its own saved settings.
  useEffect(() => {
    if (online.isHost) {
      saveOnlineHostSettings({
        withExpansion,
        withDefense,
        autoPlayMs: AUTO_PLAY_OPTIONS[autoPlayIndex].ms,
      });
    }
  }, [online.isHost, withExpansion, withDefense, autoPlayIndex]);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{ONLINE_TEXTS.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {ONLINE_TEXTS.shareHint}
        </p>
        <div className="flex items-center gap-3">
          <span
            data-testid="room-code"
            className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-2xl font-bold tracking-widest dark:bg-zinc-800"
          >
            {room.code}
          </span>
          <CopyButton label={ONLINE_TEXTS.copyCode} value={room.code} />
          <CopyButton
            label={ONLINE_TEXTS.copyLink}
            value={inviteLink(room.code)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          {ONLINE_TEXTS.players} ({room.seats.length})
        </h2>
        <ul className="flex flex-col gap-1">
          {room.seats.map((seat) => (
            <li
              key={seat.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span>{seat.name}</span>
              {seat.isHost && <Badge>{ONLINE_TEXTS.hostBadge}</Badge>}
              {seat.id === online.seatId && (
                <Badge>{ONLINE_TEXTS.youBadge}</Badge>
              )}
            </li>
          ))}
        </ul>
      </section>

      {online.isHost ? (
        <section className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withExpansion}
              onChange={(event) => setWithExpansion(event.target.checked)}
            />
            {ONLINE_TEXTS.withExpansion}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withDefense}
              onChange={(event) => setWithDefense(event.target.checked)}
            />
            {ONLINE_TEXTS.withDefense}
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="auto-play" className="text-sm font-medium">
              {ONLINE_TEXTS.autoPlay}
            </label>
            <select
              id="auto-play"
              value={autoPlayIndex}
              onChange={(event) => setAutoPlayIndex(Number(event.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {AUTO_PLAY_OPTIONS.map((option, index) => (
                <option key={index} value={index}>
                  {autoPlayLabel(option.ms)}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {ONLINE_TEXTS.autoPlayHint}
            </span>
          </div>
          <button
            type="button"
            disabled={!enoughPlayers}
            onClick={() =>
              online.start({
                withExpansion,
                withDefense,
                autoPlayMs: AUTO_PLAY_OPTIONS[autoPlayIndex].ms,
              })
            }
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ONLINE_TEXTS.startGame}
          </button>
          {!enoughPlayers && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {ONLINE_TEXTS.needMorePlayers}
            </p>
          )}
        </section>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {ONLINE_TEXTS.waitingForHost}
        </p>
      )}

      <LeaveButton onLeave={onLeave} />
    </div>
  );
}

/** The running (or finished) game, with the code and a leave button. */
function PlayingArea({ room, online, onLeave }: RoomViewProps): ReactElement {
  const isFinished = room.phase === "finished";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {ONLINE_TEXTS.roomCode}:{" "}
          <span className="font-mono font-semibold">{room.code}</span>
        </span>
        <div className="flex items-center gap-2">
          {/* After a game the host can deal a fresh round with the same table
              instead of everyone leaving and making a new room. */}
          {isFinished && online.isHost && (
            <button
              type="button"
              onClick={online.newRound}
              className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {ONLINE_TEXTS.newRound}
            </button>
          )}
          {isFinished && !online.isHost && (
            <span>{ONLINE_TEXTS.waitingForRematch}</span>
          )}
          <LeaveButton onLeave={onLeave} />
        </div>
      </div>
      {online.seatId !== null && (
        <OnlineBoard
          room={room}
          seatId={online.seatId}
          sendMove={online.sendMove}
          messages={online.messages}
          sendChat={online.sendChat}
        />
      )}
    </div>
  );
}

/** Props of {@link OnlineError}. */
type OnlineErrorProps = {
  readonly onBack: () => void;
};

/** Shown when the connection failed or the room was not found. */
function OnlineError({ onBack }: OnlineErrorProps): ReactElement {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
        {ONLINE_TEXTS.errorRoomNotFound}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {ONLINE_TEXTS.backToGame}
      </button>
    </div>
  );
}

/** A small pill label. */
function Badge({ children }: { children: string }): ReactElement {
  return (
    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {children}
    </span>
  );
}

/** Props of {@link CopyButton}. */
type CopyButtonProps = {
  readonly label: string;
  readonly value: string;
};

/** Copies a value to the clipboard and briefly confirms it. */
function CopyButton({ label, value }: CopyButtonProps): ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {copied ? ONLINE_TEXTS.copied : label}
    </button>
  );
}

/** Props of {@link LeaveButton}. */
type LeaveButtonProps = {
  readonly onLeave: () => void;
};

/** Leaves the room and returns to the entry screen. */
function LeaveButton({ onLeave }: LeaveButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onLeave}
      className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {ONLINE_TEXTS.leaveRoom}
    </button>
  );
}

/** Builds the invite link for a room code from the current page URL. */
function inviteLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}?${ROOM_QUERY_PARAM}=${code}`;
}
