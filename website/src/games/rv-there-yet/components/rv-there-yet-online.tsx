/**
 * Online co-op "RV There Yet?": the entry screen, the lobby and the drive.
 *
 * @module
 * @remarks
 * Two players bring one motorhome over the mountain together. "Mitspieler
 * finden" pairs two strangers automatically; "Raum erstellen" / "Raum
 * beitreten" open or join a private room by code. Once both are in, the host
 * deals the drive at its own last section and the two of them share one
 * vehicle: whoever climbs in first steers, the other rides along - and, more
 * to the point, gets out to work the rope while the driver stays at the wheel.
 */
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { database } from "@/online/firebase-app";
import {
  clearMatch,
  findMatch,
  hostEntry,
  relaxMatch,
  type Match,
  type Wish,
} from "@/online/matchmaking";
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/online/room-code";
import { useOnlineCount } from "@/online/use-online-presence";
import { OnlineChat, type OnlineChatTexts } from "@/online/online-chat";
import { VoiceChat } from "@/online/voice-chat";
import { loadPlayerName, savePlayerName } from "@/online/player-name";
import { CANVAS_H, CANVAS_W } from "@/games/rv-there-yet/components/render";
import {
  Fuel,
  CLOCK_DIGITS,
  ControlsHint,
  Doing,
  GearStick,
  Inventory,
  Pill,
  TouchPad,
} from "@/games/rv-there-yet/components/board";
import { COOP_PLAYERS, RV_GAME_ID } from "@/games/rv-there-yet/multiplayer/net";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";
import {
  useRvThereYetOnline,
  type OnlineSession,
  type RvThereYetOnline,
} from "@/games/rv-there-yet/hooks/use-rv-there-yet-online";

/** German labels for the whole online screen. */
const T = {
  title: "RV There Yet? online",
  subtitle: "Zu zweit ein Wohnmobil über den Berg",
  backToGame: "Zurück zum Spiel",
  yourName: "Dein Name",
  yourNamePlaceholder: "z. B. Bergfuchs",
  autoTitle: "Automatisch matchen",
  autoHint: "Wir suchen dir einen Mitspieler für die Tour.",
  autoMatch: "Mitspieler finden",
  searching: "Suche Mitspieler …",
  orDivider: "oder",
  createRoom: "Raum erstellen",
  roomCode: "Raumcode",
  roomCodePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  connecting: "Verbinde …",
  lobbyTitle: "Privater Raum",
  shareHint: "Teile den Code mit deinem Mitspieler.",
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  players: "Spieler",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Losfahren",
  needPartner: "Warte auf den zweiten Spieler …",
  waitingForHost: "Warte auf den Host …",
  waitingForPartner: "Warte auf einen Mitspieler …",
  almostReady: "Gleich geht's los …",
  cancelSearch: "Suche abbrechen",
  leaveRoom: "Raum verlassen",
  playersOnline: (n: number) => `${n} online`,
  playersHere: (n: number) => `${n}/${COOP_PLAYERS} im Raum`,
  errorRoomNotFound: "Verbindung fehlgeschlagen oder Raum nicht gefunden.",
  hostLeftNotice: "Verlässt der Host, endet die Tour.",
  coopHint:
    "Lenken darf, wer zuerst einsteigt - der andere ist Beifahrer. Zu zweit lohnt sich das: Einer bleibt am Steuer, der andere steigt aus und bedient die Seilwinde.",
  driving: "Du lenkst",
  ridingAlong: "Beifahrer",
  onFootBadge: "Zu Fuß",
  again: "Nochmal von diesem Abschnitt",
  againFromStart: "Nochmal von vorne",
  newGame: "Neues Spiel",
  newGameTitle: "Von vorne anfangen: beide zurück zum ersten Abschnitt",
  waitingForRestart: "Warte auf den Host …",
} as const;

/** Labels the shared chat needs, in German. */
const CHAT_TEXTS: OnlineChatTexts = {
  chatTitle: "Chat",
  chatEmpty: "Noch keine Nachrichten.",
  chatYou: "Du",
  chatPlaceholder: "Nachricht …",
  chatSend: "Senden",
  chatNewest: "neu",
};

/** Co-op always wants exactly two players; the other flags stay off. */
const COOP_WISH: Wish = {
  count: COOP_PLAYERS,
  expansion: false,
  defense: false,
};

/** How often the open room's matchmaking entry is kept alive, in ms. */
const HEARTBEAT_MS = 10_000;

/** How long the search only merges exactly-matching rooms before widening. */
const RELAX_MS = 12_000;

/** How often a lone waiting host looks for a room to merge into, in ms. */
const RELAX_TICK_MS = 4_000;

/** Query parameter that carries a room code in an invite link. */
const ROOM_QUERY_PARAM = "raum";

/** How long the "copied!" confirmation stays up, in milliseconds. */
const COPIED_FEEDBACK_MS = 1500;

/**
 * Renders the whole online mode, from joining a room to driving.
 *
 * @returns the online element
 */
export function RvThereYetOnlineScreen(): ReactElement {
  const onlineCount = useOnlineCount(RV_GAME_ID);
  const [session, setSession] = useState<OnlineSession | null>(null);
  // Set while auto-matching, so the lobby knows to search and set off on its
  // own rather than wait for the host to press start.
  const [auto, setAuto] = useState<Match | null>(null);

  const online = useRvThereYetOnline(session);

  const leave = useCallback(() => {
    if (auto?.mode === "host") {
      void clearMatch(database(), RV_GAME_ID, auto.code);
    }
    setAuto(null);
    setSession(null);
  }, [auto]);

  const startAuto = useCallback(async (name: string) => {
    const found = await findMatch(
      database(),
      RV_GAME_ID,
      COOP_WISH,
      Date.now(),
    );
    setAuto(found);
    setSession({ mode: found.mode, code: found.code, name });
  }, []);

  const startPrivate = useCallback((next: OnlineSession) => {
    setAuto(null);
    setSession(next);
  }, []);

  // Merge into another open room mid-search: become its guest.
  const hop = useCallback((targetCode: string) => {
    setAuto({ code: targetCode, mode: "guest" });
    setSession((prev) =>
      prev === null ? prev : { ...prev, mode: "guest", code: targetCode },
    );
  }, []);

  let body: ReactElement;
  if (session === null) {
    body = (
      <OnlineEntry
        onStart={startPrivate}
        onAutoMatch={startAuto}
        onlineCount={onlineCount}
      />
    );
  } else if (online.status === "error") {
    body = <OnlineError onBack={leave} />;
  } else if (online.status === "connecting") {
    body = <p className="text-sm">{T.connecting}</p>;
  } else if (online.status === "lobby") {
    body =
      auto !== null ? (
        <SearchingLobby
          online={online}
          match={auto}
          onlineCount={onlineCount}
          onHop={hop}
          onCancel={leave}
        />
      ) : (
        <OnlineLobby online={online} code={session.code} onLeave={leave} />
      );
  } else {
    body = <DrivingArea online={online} code={session.code} onLeave={leave} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{T.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T.subtitle}
          </p>
        </div>
        <Link
          href="/rv-there-yet"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.backToGame}
        </Link>
      </header>
      {body}
    </div>
  );
}

/** Props of {@link OnlineEntry}. */
type OnlineEntryProps = {
  readonly onStart: (session: OnlineSession) => void;
  readonly onAutoMatch: (name: string) => Promise<void>;
  readonly onlineCount: number | null;
};

/** The first screen: pick a name, then auto-match, host or join. */
function OnlineEntry({
  onStart,
  onAutoMatch,
  onlineCount,
}: OnlineEntryProps): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);

  // Prefill the saved name and any invite code, in the browser only so the
  // prerendered HTML stays stable.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time prefill from storage/URL */
    const saved = loadPlayerName().trim();
    if (saved.length > 0) {
      setName(saved);
    }
    const params = new URLSearchParams(window.location.search);
    const invited = params.get(ROOM_QUERY_PARAM);
    if (invited !== null) {
      setCode(normalizeRoomCode(invited));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Kept as it is typed, so the field is filled in next time even for
  // somebody who looked at the screen and went away again.
  const changeName = (value: string) => {
    setName(value);
    savePlayerName(value);
  };

  const remember = (chosen: string) => {
    savePlayerName(chosen);
  };
  const host = () => {
    remember(name);
    onStart({ mode: "host", code: generateRoomCode(), name });
  };
  const join = () => {
    const clean = normalizeRoomCode(code);
    if (isValidRoomCode(clean)) {
      remember(name);
      onStart({ mode: "guest", code: clean, name });
    }
  };
  const autoMatch = () => {
    remember(name);
    setSearching(true);
    void onAutoMatch(name).catch(() => setSearching(false));
  };

  return (
    <div className="flex max-w-md flex-col gap-6">
      <OnlineCountBadge count={onlineCount} />

      <p className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm text-zinc-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-zinc-300">
        {T.coopHint}
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{T.yourName}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => changeName(event.target.value)}
          placeholder={T.yourNamePlaceholder}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div>
          <h2 className="text-sm font-semibold">{T.autoTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.autoHint}
          </p>
        </div>
        <button
          type="button"
          onClick={autoMatch}
          disabled={searching}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? T.searching : T.autoMatch}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        {T.orDivider}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={host}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {T.createRoom}
      </button>

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{T.roomCode}</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder={T.roomCodePlaceholder}
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
          {T.joinRoom}
        </button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.hostLeftNotice}
      </p>
    </div>
  );
}

/** Props of {@link OnlineLobby}. */
type OnlineLobbyProps = {
  readonly online: RvThereYetOnline;
  readonly code: string;
  readonly onLeave: () => void;
};

/** The private lobby: share the code, see who is in, and (host) set off. */
function OnlineLobby({
  online,
  code,
  onLeave,
}: OnlineLobbyProps): ReactElement {
  const enough = online.seats.length >= COOP_PLAYERS;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{T.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.shareHint}
        </p>
        <div className="flex items-center gap-3">
          <span
            data-testid="room-code"
            className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-2xl font-bold tracking-widest dark:bg-zinc-800"
          >
            {code}
          </span>
          <CopyButton label={T.copyCode} value={code} />
          <CopyButton label={T.copyLink} value={inviteLink(code)} />
        </div>
      </section>

      <SeatList online={online} />

      {online.isHost ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            disabled={!enough}
            onClick={online.start}
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {T.startGame}
          </button>
          {!enough && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.needPartner}
            </p>
          )}
        </section>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {T.waitingForHost}
        </p>
      )}

      <LeaveButton onLeave={onLeave} />
    </div>
  );
}

/** The list of players in the room, with host and "you" badges. */
function SeatList({ online }: { online: RvThereYetOnline }): ReactElement {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {T.players} ({online.seats.length})
      </h2>
      <ul className="flex flex-col gap-1">
        {online.seats.map((seat) => (
          <li
            key={seat.id}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <span>{seat.name}</span>
            {seat.isHost && <Badge>{T.hostBadge}</Badge>}
            {seat.id === online.seatId && <Badge>{T.youBadge}</Badge>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Props of {@link SearchingLobby}. */
type SearchingLobbyProps = {
  readonly online: RvThereYetOnline;
  readonly match: Match;
  readonly onlineCount: number | null;
  readonly onHop: (code: string) => void;
  readonly onCancel: () => void;
};

/** The auto-match waiting screen: pairs two players and sets off on its own. */
function SearchingLobby({
  online,
  match,
  onlineCount,
  onHop,
  onCancel,
}: SearchingLobbyProps): ReactElement {
  const isHost = online.isHost;
  const seats = online.seats.length;
  const enough = seats >= COOP_PLAYERS;
  const startedRef = useRef(false);

  const start = online.start;
  const startNow = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void clearMatch(database(), RV_GAME_ID, match.code);
    start();
  }, [match.code, start]);

  // Host keeps its open-room entry alive while it waits for a partner.
  useEffect(() => {
    if (!isHost) {
      return;
    }
    const db = database();
    const timer = setInterval(
      () => void hostEntry(db, RV_GAME_ID, match.code, COOP_WISH, Date.now()),
      HEARTBEAT_MS,
    );
    return () => clearInterval(timer);
  }, [isHost, match.code]);

  // Host frees its entry on any exit from the search.
  useEffect(() => {
    if (!isHost) {
      return;
    }
    return () => void clearMatch(database(), RV_GAME_ID, match.code);
  }, [isHost, match.code]);

  // While a lone host waits, merge into another open room so two solo searchers
  // find each other even if both opened a room at once.
  useEffect(() => {
    if (!isHost || seats > 1) {
      return;
    }
    const db = database();
    const started = Date.now();
    const tick = async () => {
      const allowAny = Date.now() - started > RELAX_MS;
      const target = await relaxMatch(
        db,
        RV_GAME_ID,
        COOP_WISH,
        match.code,
        Date.now(),
        allowAny,
      );
      if (target !== null && !startedRef.current) {
        await clearMatch(db, RV_GAME_ID, match.code);
        onHop(target);
      }
    };
    const timer = setInterval(() => void tick(), RELAX_TICK_MS);
    return () => clearInterval(timer);
  }, [isHost, seats, match.code, onHop]);

  // The host sets off the moment a partner has joined.
  useEffect(() => {
    if (isHost && enough) {
      startNow();
    }
  }, [isHost, enough, startNow]);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <OnlineCountBadge count={onlineCount} />
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
        />
        <h2 className="text-lg font-semibold">{T.searching}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {T.playersHere(seats)}
        </p>
        <ul className="flex flex-wrap justify-center gap-1">
          {online.seats.map((seat) => (
            <li
              key={seat.id}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
            >
              {seat.name}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {enough ? T.almostReady : T.waitingForPartner}
        </p>
      </section>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {T.cancelSearch}
      </button>
    </div>
  );
}

/** Props of {@link DrivingArea}. */
type DrivingAreaProps = {
  readonly online: RvThereYetOnline;
  /** The room code, for the voice chat's own corner of the room. */
  readonly code: string;
  readonly onLeave: () => void;
};

/** The running drive: the canvas, the heads-up row, voice, chat and leaving. */
function DrivingArea({
  online,
  code,
  onLeave,
}: DrivingAreaProps): ReactElement {
  const { hud, canvasRef, messages, seatId, seats, sendChat } = online;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            {RV_TEXTS.section(hud.section + 1, hud.sections, hud.sectionName)}
          </Pill>
          <Fuel share={hud.fuel} />
          <Doing hud={hud} />
        </div>
        <div className="flex items-center gap-2">
          <SeatBadge hud={hud} />
          {online.isHost && (
            <button
              type="button"
              data-testid="rv-new-game"
              onClick={online.newGame}
              title={T.newGameTitle}
              className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {T.newGame}
            </button>
          )}
          <LeaveButton onLeave={onLeave} />
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          data-testid="rv-canvas"
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700"
        />
        <ArrivedOverlay online={online} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <GearStick
          gear={hud.gear}
          onShift={online.shift}
          driving={hud.driving}
        />
      </div>

      <Inventory
        carrying={hud.carrying}
        holding={hud.holding}
        onPick={online.pick}
      />

      <TouchPad onPress={online.touch} hud={hud} />

      <ControlsHint />

      <VoiceChat
        gameId={RV_GAME_ID}
        code={code}
        seatId={seatId}
        seats={seats}
      />
      <OnlineChat
        messages={messages}
        ownSeatId={seatId}
        onSend={sendChat}
        texts={CHAT_TEXTS}
      />
    </div>
  );
}

/** Says whether this player is steering, riding along or on foot. */
function SeatBadge({
  hud,
}: {
  readonly hud: RvThereYetOnline["hud"];
}): ReactElement {
  let text: string;
  if (hud.driving) {
    text = T.driving;
  } else if (hud.passenger) {
    text = T.ridingAlong;
  } else {
    text = T.onFootBadge;
  }
  return (
    <span
      data-testid="rv-seat"
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
    >
      {text}
    </span>
  );
}

/** The screen over the canvas once the drive has ended, one way or another. */
function ArrivedOverlay({
  online,
}: {
  readonly online: RvThereYetOnline;
}): ReactElement | null {
  if (online.hud.phase === "plunged") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-950/90 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F573}"} {RV_TEXTS.plunged}
        </p>
        <p className="text-sm text-zinc-300">{RV_TEXTS.plungedHint}</p>
        {online.isHost ? (
          <button
            type="button"
            onClick={online.again}
            className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {T.again}
          </button>
        ) : (
          <p className="text-sm">{T.waitingForRestart}</p>
        )}
      </div>
    );
  }
  if (online.hud.phase === "fallen") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-950/90 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F6A7}"} {RV_TEXTS.fallen}
        </p>
        <p className="text-sm text-zinc-300">{RV_TEXTS.fallenHint}</p>
        {online.isHost ? (
          <button
            type="button"
            onClick={online.again}
            className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {T.again}
          </button>
        ) : (
          <p className="text-sm">{T.waitingForRestart}</p>
        )}
      </div>
    );
  }
  if (online.hud.phase === "taken") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-950/90 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F5A4}"} {RV_TEXTS.taken}
        </p>
        {online.isHost ? (
          <button
            type="button"
            onClick={online.again}
            className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {T.again}
          </button>
        ) : (
          <p className="text-sm">{T.waitingForRestart}</p>
        )}
      </div>
    );
  }
  if (online.hud.phase === "mauled") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-red-950/80 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F43B}"} {RV_TEXTS.mauled}
        </p>
        <p className="text-sm text-red-100">{RV_TEXTS.mauledHint}</p>
        {online.isHost ? (
          <button
            type="button"
            onClick={online.again}
            className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {T.again}
          </button>
        ) : (
          <p className="text-sm">{T.waitingForRestart}</p>
        )}
      </div>
    );
  }
  if (online.hud.phase !== "arrived") {
    return null;
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-900/70 p-4 text-center text-white">
      <p className="text-2xl font-bold">
        {"\u{1F3C1}"} {RV_TEXTS.arrived}
      </p>
      <p className="text-sm text-zinc-200">
        {RV_TEXTS.arrivedIn(online.hud.time.toFixed(CLOCK_DIGITS))}
      </p>
      <p className="text-base font-semibold text-emerald-300">
        {RV_TEXTS.allDone}
      </p>
      {online.isHost ? (
        <button
          type="button"
          onClick={online.newGame}
          className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {T.againFromStart}
        </button>
      ) : (
        <p className="text-sm">{T.waitingForRestart}</p>
      )}
    </div>
  );
}

/** A small pill with the live count of players online, or nothing yet. */
function OnlineCountBadge({
  count,
}: {
  count: number | null;
}): ReactElement | null {
  if (count === null) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {T.playersOnline(count)}
    </div>
  );
}

/** Shown when the connection failed or the room was not found. */
function OnlineError({ onBack }: { onBack: () => void }): ReactElement {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
        {T.errorRoomNotFound}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {T.backToGame}
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

/** Copies a value to the clipboard and briefly confirms it. */
function CopyButton({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
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
      {copied ? T.copied : label}
    </button>
  );
}

/** Leaves the room and returns to the entry screen. */
function LeaveButton({ onLeave }: { onLeave: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={onLeave}
      className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {T.leaveRoom}
    </button>
  );
}

/** Builds the invite link for a room code from the current page URL. */
function inviteLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}?${ROOM_QUERY_PARAM}=${code}`;
}
