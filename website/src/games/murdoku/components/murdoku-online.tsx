/**
 * Murdoku online: a room, a case, and everybody solving it on the same map.
 *
 * @module
 * @remarks
 * The shared online layer does the room, the host and the wire
 * ({@link useOnlineRoom}); the case itself is drawn by the same view as at
 * one screen ({@link CaseView}), fed by {@link useMurdokuOnline}. So the map,
 * the suspects, the tips and the accusation look and work exactly as they do
 * alone - only that every mark one player makes appears on everybody's map.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { RulesButton } from "@/components/rules-button";
import { EMPTY_BOARD } from "@/games/murdoku/engine/board";
import { LEVELS } from "@/games/murdoku/engine/levels";
import { CaseMap } from "@/games/murdoku/components/case-map";
import { CaseView } from "@/games/murdoku/components/murdoku-game";
import { useMurdokuOnline } from "@/games/murdoku/hooks/use-murdoku-online";
import { MURDOKU_RULES } from "@/games/murdoku/i18n/rules";
import { DIFFICULTY_NAMES } from "@/games/murdoku/i18n/texts";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  MURDOKU_GAME_ID,
  murdokuAdapter,
  type MurdokuMove,
  type MurdokuOnlineGame,
  type MurdokuOptions,
} from "@/games/murdoku/multiplayer/adapter";
import { Avatar } from "@/online/avatar";
import { OnlineChat, type OnlineChatTexts } from "@/online/online-chat";
import { loadPlayerName, savePlayerName } from "@/online/player-name";
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/online/room-code";
import { ShareRow, invitedCode } from "@/online/room-invite";
import {
  useOnlineRoom,
  type OnlineRoom,
  type OnlineSession,
} from "@/online/use-online-room";
import { VoiceChat } from "@/online/voice-chat";

/** The room, as the online layer hands it over. */
type Room = OnlineRoom<MurdokuOnlineGame, MurdokuMove, MurdokuOptions>;

/** How big a face is beside a name. */
const AVATAR_SEAT = 22;

/** German labels of the online screen. */
const L = {
  title: "Murdoku online",
  subtitle: "Ein Fall, eine Karte - gemeinsam lösen, jede:r am eigenen Gerät",
  back: "Zurück",
  yourName: "Dein Name",
  namePlaceholder: "z. B. Alex",
  createRoom: "Raum erstellen",
  roomCode: "Raumcode",
  codePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  invitedHint: "Du wurdest eingeladen - Namen eintragen und beitreten.",
  connecting: "Verbinde …",
  lobbyTitle: "Privater Raum",
  shareHint: `Teile den Code mit deinen Mitspielern (${String(MIN_PLAYERS)} bis ${String(MAX_PLAYERS)}). Alle lösen denselben Fall auf derselben Karte.`,
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  players: "Ermittler",
  hostBadge: "Host",
  youBadge: "Du",
  chooseCase: "Fall wählen",
  startGame: "Fall öffnen",
  needPlayers: `Warte auf mindestens ${String(MIN_PLAYERS)} Ermittler …`,
  waitingForHost: "Warte auf den Host - er wählt den Fall und öffnet ihn.",
  leaveRoom: "Raum verlassen",
  newCase: "Nächster Fall",
  waitingForNext: "Warte auf den Host - er kann den nächsten Fall öffnen.",
  solvedBy: (name: string) => `Gelöst von ${name}!`,
  guessedBy: (name: string, who: string) => `${name} hat ${who} angeklagt.`,
  watching:
    "Du bist dazugekommen, als der Fall schon offen war, und schaust zu. Beim nächsten Fall bist du dabei.",
  error:
    "Der Raum ist nicht erreichbar - gibt es den Code, und ist er nicht voll?",
} as const;

/** The chat's words. */
const CHAT_TEXTS: OnlineChatTexts = {
  chatTitle: "Chat",
  chatEmpty: "Sag hallo …",
  chatYou: "Du",
  chatPlaceholder: "Nachricht schreiben …",
  chatSend: "Senden",
  chatNewest: "neu",
};

/** The look of a secondary button. */
const BUTTON =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * The whole online mode.
 *
 * @returns the entry screen, the lobby or the shared case
 */
export function MurdokuOnlineScreen(): ReactElement {
  const [session, setSession] = useState<OnlineSession | null>(null);
  const room = useOnlineRoom(murdokuAdapter, session);
  const leave = useCallback(() => setSession(null), []);

  let body: ReactElement;
  if (session === null) {
    body = <Entry onStart={setSession} />;
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {L.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RulesButton rules={MURDOKU_RULES} />
          <Link href="/murdoku" className={BUTTON}>
            {L.back}
          </Link>
        </div>
      </header>
      {body}
    </div>
  );
}

/** Name, then a new room or a code to join. */
function Entry({
  onStart,
}: {
  readonly onStart: (session: OnlineSession) => void;
}): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [invited, setInvited] = useState(false);

  // Read once in the browser: the stored name and an invitation in the link.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Only into an empty field - never over what was typed in the meantime.
    const stored = loadPlayerName();
    setName((typed) => (typed === "" ? stored : typed));
    const fromLink = invitedCode();
    if (fromLink !== "") {
      setCode((typed) => (typed === "" ? fromLink : typed));
      setInvited(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const trimmed = name.trim();
  const go = (mode: "host" | "guest", roomCode: string) => {
    savePlayerName(trimmed);
    onStart({ mode, code: roomCode, name: trimmed });
  };

  return (
    <div className="flex max-w-md flex-col gap-4">
      {invited && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          {L.invitedHint}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        {L.yourName}
        <input
          data-testid="murdoku-online-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={L.namePlaceholder}
          maxLength={20}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <button
        type="button"
        data-testid="murdoku-online-create"
        disabled={trimmed === ""}
        onClick={() => go("host", generateRoomCode())}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {L.createRoom}
      </button>
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          {L.roomCode}
          <input
            data-testid="murdoku-online-code"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder={L.codePlaceholder}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono tracking-widest uppercase dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="button"
          data-testid="murdoku-online-join"
          disabled={trimmed === "" || !isValidRoomCode(code)}
          onClick={() => go("guest", code)}
          className={BUTTON}
        >
          {L.joinRoom}
        </button>
      </div>
    </div>
  );
}

/** The waiting room: share the code, see who is in, pick the case, open it. */
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
  const [levelId, setLevelId] = useState(LEVELS[0]?.id ?? "");

  return (
    <div className="flex max-w-3xl flex-col gap-5" data-testid="murdoku-lobby">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{L.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {L.shareHint}
        </p>
        <ShareRow code={code} texts={L} />
      </section>

      <SeatList room={room} />

      {room.isHost ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{L.chooseCase}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((level, at) => (
              <li key={level.id}>
                <button
                  type="button"
                  aria-pressed={level.id === levelId}
                  data-testid={`murdoku-online-case-${level.id}`}
                  onClick={() => setLevelId(level.id)}
                  className={`flex w-full cursor-pointer flex-col gap-2 rounded-2xl border-2 bg-white p-3 text-left dark:bg-zinc-900 ${
                    level.id === levelId
                      ? "border-sky-500"
                      : "border-zinc-200 hover:border-sky-300 dark:border-zinc-800"
                  }`}
                >
                  <span className="block overflow-hidden rounded-xl">
                    <CaseMap level={level} board={EMPTY_BOARD} preview />
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm font-bold">
                    {`${String(at + 1)}. ${level.name}`}
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                      {DIFFICULTY_NAMES[level.difficulty]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-testid="murdoku-online-start"
            disabled={!enough}
            onClick={() =>
              room.start({ levelId, startedAt: Date.now(), autoPlayMs: null })
            }
            className="cursor-pointer self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {L.startGame}
          </button>
          {!enough && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {L.needPlayers}
            </p>
          )}
        </section>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {L.waitingForHost}
        </p>
      )}

      <VoiceChat
        gameId={MURDOKU_GAME_ID}
        code={code}
        seatId={room.seatId}
        seats={seats}
      />
      <button
        type="button"
        onClick={onLeave}
        className={`${BUTTON} self-start`}
      >
        {L.leaveRoom}
      </button>
    </div>
  );
}

/** The shared case. */
function Playing({
  room,
  onLeave,
}: {
  readonly room: Room;
  readonly onLeave: () => void;
}): ReactElement {
  const game = room.room?.game ?? null;
  return game === null ? (
    <p className="text-sm">{L.connecting}</p>
  ) : (
    <SharedCase room={room} game={game} onLeave={onLeave} />
  );
}

/** The case on everybody's screen, with the people beside it. */
function SharedCase({
  room,
  game,
  onLeave,
}: {
  readonly room: Room;
  readonly game: MurdokuOnlineGame;
  readonly onLeave: () => void;
}): ReactElement {
  const api = useMurdokuOnline(game, room.sendMove);
  const seats = room.room?.seats ?? [];
  const seated = seats.some((seat) => seat.id === room.seatId);
  const solved = game.outcome?.kind === "right";
  const level = api.level ?? LEVELS[0];
  const nameOf = (id: string) =>
    level?.suspects.find((one) => one.id === id)?.name ?? "?";

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {!seated && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {L.watching}
          </p>
        )}
        {game.outcome !== null && (
          <p
            data-testid="murdoku-online-outcome"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              solved
                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {solved
              ? L.solvedBy(game.names[game.outcome.by] ?? "?")
              : L.guessedBy(
                  game.names[game.outcome.by] ?? "?",
                  nameOf(game.outcome.who),
                )}
          </p>
        )}
        {solved &&
          (room.isHost ? (
            <button
              type="button"
              data-testid="murdoku-online-next"
              onClick={room.newRound}
              className="cursor-pointer self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {L.newCase}
            </button>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {L.waitingForNext}
            </p>
          ))}
        {level !== undefined && <CaseView game={api} level={level} />}
      </div>

      <aside className="flex w-full flex-col gap-3 xl:w-72">
        <SeatList room={room} />
        <button
          type="button"
          onClick={onLeave}
          className={`${BUTTON} self-start`}
        >
          {L.leaveRoom}
        </button>
        <VoiceChat
          gameId={MURDOKU_GAME_ID}
          code={room.room?.code ?? ""}
          seatId={room.seatId}
          seats={seats}
        />
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

/** Who is in the room. */
function SeatList({ room }: { readonly room: Room }): ReactElement {
  const seats = room.room?.seats ?? [];
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {`${L.players} (${String(seats.length)})`}
      </h2>
      <ul className="flex flex-col gap-1" data-testid="murdoku-online-seats">
        {seats.map((seat) => (
          <li
            key={seat.id}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <Avatar id={seat.avatar} size={AVATAR_SEAT} />
            <span>{seat.name}</span>
            {seat.isHost && <Badge>{L.hostBadge}</Badge>}
            {seat.id === room.seatId && <Badge>{L.youBadge}</Badge>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shown when the connection failed. */
function ErrorPanel({ onBack }: { readonly onBack: () => void }): ReactElement {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
        {L.error}
      </p>
      <button type="button" onClick={onBack} className={`${BUTTON} self-start`}>
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
