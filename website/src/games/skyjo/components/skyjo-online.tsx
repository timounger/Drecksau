/**
 * Online Skyjo: the entry screen, the lobby and the running table.
 *
 * @module
 * @remarks
 * Skyjo is turn-based, so it runs on the shared online layer rather than a game
 * loop of its own: {@link useOnlineRoom} does the room, the host election and
 * the redaction, and this screen only has to render what it hands back.
 */
"use client";

import Link from "next/link";
import { useCallback, useState, type ReactElement } from "react";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/skyjo/engine/state";
import type { SkyjoGame, SkyjoMove } from "@/games/skyjo/engine/state";
import {
  skyjoAdapter,
  type SkyjoOptions,
} from "@/games/skyjo/multiplayer/adapter";
import { SkyjoScores } from "./skyjo-scores";
import { SkyjoTable } from "./skyjo-table";
import { OnlineChat, type OnlineChatTexts } from "@/online/online-chat";
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/online/room-code";
import { useOnlineCount } from "@/online/use-online-presence";
import {
  useOnlineRoom,
  type OnlineRoom,
  type OnlineSession,
} from "@/online/use-online-room";

/** German labels for the online screen. */
const L = {
  title: "Skyjo online",
  subtitle: "Am selben Tisch, jeder am eigenen Gerät",
  back: "Zurück",
  yourName: "Dein Name",
  namePlaceholder: "z. B. Alex",
  createRoom: "Raum erstellen",
  roomCode: "Raumcode",
  codePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  connecting: "Verbinde …",
  lobbyTitle: "Raum",
  shareHint: `Teile den Code mit deinen Mitspielern (${MIN_PLAYERS} bis ${MAX_PLAYERS}).`,
  players: "Spieler",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Spiel starten",
  needPlayers: "Warte auf mindestens einen Mitspieler …",
  waitingForHost: "Warte auf den Host …",
  leaveRoom: "Raum verlassen",
  online: (n: number) => `${n} online`,
  error: "Verbindung fehlgeschlagen oder Raum nicht gefunden.",
} as const;

/** Labels the shared chat needs. */
const CHAT_TEXTS: OnlineChatTexts = {
  chatTitle: "Chat",
  chatEmpty: "Sag hallo …",
  chatYou: "Du",
  chatPlaceholder: "Nachricht schreiben …",
  chatSend: "Senden",
  chatNewest: "neu",
};

/** How long a player may dither before the computer plays their turn. */
const AUTO_PLAY_MS = 60_000;

/**
 * Renders the whole online mode.
 *
 * @returns the online element
 */
export function SkyjoOnlineScreen(): ReactElement {
  const onlineCount = useOnlineCount(skyjoAdapter.gameId);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const room = useOnlineRoom(skyjoAdapter, session);

  const leave = useCallback(() => setSession(null), []);

  let body: ReactElement;
  if (session === null) {
    body = <Entry onStart={setSession} onlineCount={onlineCount} />;
  } else if (room.status === "error") {
    body = <ErrorPanel onBack={leave} />;
  } else if (room.status === "connecting" || room.status === "idle") {
    body = <p className="text-sm">{L.connecting}</p>;
  } else if (room.status === "lobby") {
    body = <Lobby room={room} code={session.code} onLeave={leave} />;
  } else {
    body = <Playing room={room} onLeave={leave} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {L.subtitle}
          </p>
        </div>
        <Link
          href="/skyjo"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {L.back}
        </Link>
      </header>
      {body}
    </div>
  );
}

/** The type the room hook hands back, for the panels below. */
type Room = OnlineRoom<SkyjoGame, SkyjoMove, SkyjoOptions>;

/** The first screen: pick a name, then host or join. */
function Entry({
  onStart,
  onlineCount,
}: {
  readonly onStart: (session: OnlineSession) => void;
  readonly onlineCount: number | null;
}): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="flex max-w-md flex-col gap-5">
      {onlineCount !== null && (
        <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {L.online(onlineCount)}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{L.yourName}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={L.namePlaceholder}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="button"
        onClick={() =>
          onStart({ mode: "host", code: generateRoomCode(), name })
        }
        className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {L.createRoom}
      </button>

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{L.roomCode}</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder={L.codePlaceholder}
            maxLength={4}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono tracking-widest uppercase dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="button"
          disabled={!isValidRoomCode(normalizeRoomCode(code))}
          onClick={() =>
            onStart({ mode: "guest", code: normalizeRoomCode(code), name })
          }
          className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {L.joinRoom}
        </button>
      </div>
    </div>
  );
}

/** The waiting room: share the code, see who is in, and start. */
function Lobby({
  room,
  code,
  onLeave,
}: {
  readonly room: Room;
  readonly code: string;
  readonly onLeave: () => void;
}): ReactElement {
  const seats = room.room?.seats ?? [];
  const enough = seats.length >= MIN_PLAYERS;

  return (
    <div className="flex max-w-md flex-col gap-5">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{L.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {L.shareHint}
        </p>
        <span
          data-testid="room-code"
          className="self-start rounded-lg bg-zinc-100 px-3 py-2 font-mono text-2xl font-bold tracking-widest dark:bg-zinc-800"
        >
          {code}
        </span>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          {L.players} ({seats.length})
        </h2>
        <ul className="flex flex-col gap-1">
          {seats.map((seat) => (
            <li
              key={seat.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span>{seat.name}</span>
              {seat.isHost && <Badge>{L.hostBadge}</Badge>}
              {seat.id === room.seatId && <Badge>{L.youBadge}</Badge>}
            </li>
          ))}
        </ul>
      </section>

      {room.isHost ? (
        <>
          <button
            type="button"
            disabled={!enough}
            onClick={() => room.start({ autoPlayMs: AUTO_PLAY_MS })}
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {L.startGame}
          </button>
          {!enough && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {L.needPlayers}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {L.waitingForHost}
        </p>
      )}

      <LeaveButton onLeave={onLeave} />
    </div>
  );
}

/** The running table. */
function Playing({
  room,
  onLeave,
}: {
  readonly room: Room;
  readonly onLeave: () => void;
}): ReactElement {
  const game = room.room?.game ?? null;
  const seats = room.room?.seats ?? [];
  const mySeat = seats.findIndex((seat) => seat.id === room.seatId);

  if (game === null) {
    return <p className="text-sm">{L.connecting}</p>;
  }

  const showScores = game.phase === "roundOver" || game.phase === "gameOver";
  const mayAdvance = game.phase === "roundOver" && game.turn === mySeat;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        {showScores && (
          <SkyjoScores
            game={game}
            onNext={
              mayAdvance ? () => room.sendMove({ kind: "nextRound" }) : null
            }
            onNewGame={null}
          />
        )}
        <SkyjoTable
          game={game}
          mySeat={mySeat >= 0 ? mySeat : null}
          onMove={room.sendMove}
        />
      </div>

      <aside className="flex w-full flex-col gap-3 lg:w-72">
        <LeaveButton onLeave={onLeave} />
        <OnlineChat
          messages={room.messages}
          ownSeatId={room.seatId}
          onSend={room.sendChat}
          texts={CHAT_TEXTS}
        />
      </aside>
    </div>
  );
}

/** Shown when the connection failed. */
function ErrorPanel({ onBack }: { readonly onBack: () => void }): ReactElement {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
        {L.error}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {L.back}
      </button>
    </div>
  );
}

/** A small pill label. */
function Badge({ children }: { readonly children: string }): ReactElement {
  return (
    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {children}
    </span>
  );
}

/** Leaves the room and returns to the entry screen. */
function LeaveButton({
  onLeave,
}: {
  readonly onLeave: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onLeave}
      className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {L.leaveRoom}
    </button>
  );
}
