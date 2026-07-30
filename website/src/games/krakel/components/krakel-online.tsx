/**
 * Online Krakel Orakel: the entry screen, the lobby and the running game.
 *
 * @module
 * @remarks
 * Two to six players draw at the same time and then puzzle it out together.
 * "Mitspieler finden" pairs strangers automatically; "Raum erstellen" /
 * "Raum beitreten" open or join a private room by code. Once enough players are
 * in, the host starts: everyone draws their own secret term along their own
 * squiggle, then the team strikes the words nobody drew off the list.
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
import {
  loadPlayerName,
  savePlayerName,
} from "@/games/krakel/settings/player-name";
import {
  DEFAULT_PLAYER_COUNT,
  PLAYER_COUNTS,
  loadPlayerCount,
  savePlayerCount,
} from "@/games/krakel/settings/player-count";
import { KRAKEL_GAME_ID } from "@/games/krakel/multiplayer/net";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/krakel/engine/types";
import { KrakelBoard } from "@/games/krakel/components/krakel-board";
import {
  useKrakelOnline,
  type KrakelOnline,
  type OnlineSession,
} from "@/games/krakel/hooks/use-krakel-online";

/** German labels for the whole online screen. */
const T = {
  title: "Krakel Orakel online",
  subtitle: "Gemeinsam malen und ausschließen - in Echtzeit",
  backToGame: "Zurück",
  yourName: "Dein Name",
  yourNamePlaceholder: "z. B. Picasso",
  autoTitle: "Automatisch matchen",
  autoHint: "Wir suchen dir Mitspieler für eine Runde.",
  autoMatch: "Mitspieler finden",
  searching: "Suche Mitspieler …",
  tableSize: "Wie viele Spieler?",
  tableSizeHint: "Wird für das nächste Mal gemerkt.",
  playersLabel: (n: number) => `${n} Spieler`,
  waitingFor: (have: number, want: number) => `${have} von ${want} da`,
  startsNow: "Vollzählig - los geht's!",
  relaxHint: (s: number) =>
    `Noch ${s}s - danach starten wir auch mit einer anderen Spielerzahl.`,
  relaxedNow: "Wir starten jetzt auch mit weniger Spielern.",
  orDivider: "oder",
  createRoom: "Raum erstellen",
  roomCode: "Raumcode",
  roomCodePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  connecting: "Verbinde …",
  lobbyTitle: "Privater Raum",
  shareHint: `Teile den Code mit deinen Mitspielern (${MIN_PLAYERS} bis ${MAX_PLAYERS}).`,
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  players: "Spieler",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Spiel starten",
  needPlayers: "Warte auf mindestens einen Mitspieler …",
  waitingForHost: "Warte auf den Host …",
  cancelSearch: "Suche abbrechen",
  leaveRoom: "Raum verlassen",
  playersOnline: (n: number) => `${n} online`,
  playersHere: (n: number, want: number) => `${n}/${want} im Raum`,
  errorRoomNotFound: "Verbindung fehlgeschlagen oder Raum nicht gefunden.",
  hostLeftNotice: "Verlässt der Host, endet die Runde.",
} as const;

/** This game's id, for presence and matchmaking namespacing. */
const GAME_ID = KRAKEL_GAME_ID;

/** The wish advertised while searching; only the table size varies. */
function matchWish(count: number): Wish {
  return { count, expansion: false, defense: false };
}

/** How often the open room's matchmaking entry is kept alive, in ms. */
const HEARTBEAT_MS = 10_000;

/**
 * How long the search insists on the wished table size before widening.
 *
 * @remarks
 * Reached the wished number of players and the round starts at once; otherwise
 * this is the wait after which any table size will do, so a lone searcher is
 * not left hanging.
 */
const RELAX_MS = 20_000;

/** How often a lone waiting host looks for a room to merge into, in ms. */
const RELAX_TICK_MS = 4_000;

/** Milliseconds in a second, for showing the grace as seconds. */
const MS_PER_SECOND = 1000;

/** Query parameter that carries a room code in an invite link. */
const ROOM_QUERY_PARAM = "raum";

/** How long the "copied!" confirmation stays up, in milliseconds. */
const COPIED_FEEDBACK_MS = 1500;

/**
 * Renders the whole online mode, from joining a room to playing.
 *
 * @returns the online element
 */
export function KrakelOnlineScreen(): ReactElement {
  const onlineCount = useOnlineCount(GAME_ID);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [auto, setAuto] = useState<Match | null>(null);
  // The table size the search is waiting for, kept while the lobby is open.
  const [wanted, setWanted] = useState(DEFAULT_PLAYER_COUNT);

  const online = useKrakelOnline(session);

  const leave = useCallback(() => {
    if (auto?.mode === "host") {
      void clearMatch(database(), GAME_ID, auto.code);
    }
    setAuto(null);
    setSession(null);
  }, [auto]);

  const startAuto = useCallback(async (name: string, count: number) => {
    setWanted(count);
    const found = await findMatch(
      database(),
      GAME_ID,
      matchWish(count),
      Date.now(),
    );
    setAuto(found);
    setSession({ mode: found.mode, code: found.code, name });
  }, []);

  const startPrivate = useCallback((next: OnlineSession) => {
    setAuto(null);
    setSession(next);
  }, []);

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
          wanted={wanted}
          onlineCount={onlineCount}
          onHop={hop}
          onCancel={leave}
        />
      ) : (
        <OnlineLobby online={online} code={session.code} onLeave={leave} />
      );
  } else {
    body = <PlayingArea online={online} onLeave={leave} />;
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
          href="/krakel"
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
  readonly onAutoMatch: (name: string, count: number) => Promise<void>;
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
  const [count, setCount] = useState(DEFAULT_PLAYER_COUNT);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time prefill from storage/URL */
    const saved = loadPlayerName().trim();
    if (saved.length > 0) {
      setName(saved);
    }
    setCount(loadPlayerCount());
    const params = new URLSearchParams(window.location.search);
    const invited = params.get(ROOM_QUERY_PARAM);
    if (invited !== null) {
      setCode(normalizeRoomCode(invited));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Both choices are kept for next time, whichever way the player goes in.
  const remember = (chosen: string) => {
    savePlayerName(chosen);
    savePlayerCount(count);
  };
  const chooseCount = (next: number) => {
    setCount(next);
    savePlayerCount(next);
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
    void onAutoMatch(name, count).catch(() => setSearching(false));
  };

  return (
    <div className="flex max-w-md flex-col gap-6">
      <OnlineCountBadge count={onlineCount} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{T.yourName}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={T.yourNamePlaceholder}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <PlayerCountPicker count={count} onChoose={chooseCount} />

      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
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
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

/** Picks how many players the round should have, and remembers the choice. */
function PlayerCountPicker({
  count,
  onChoose,
}: {
  readonly count: number;
  readonly onChoose: (count: number) => void;
}): ReactElement {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-medium">{T.tableSize}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.tableSizeHint}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={T.tableSize}
        className="flex flex-wrap gap-1.5"
      >
        {PLAYER_COUNTS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === count}
            data-testid={`player-count-${option}`}
            onClick={() => onChoose(option)}
            className={`h-10 w-10 cursor-pointer rounded-lg border text-sm font-semibold tabular-nums ${
              option === count
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Props of {@link OnlineLobby}. */
type OnlineLobbyProps = {
  readonly online: KrakelOnline;
  readonly code: string;
  readonly onLeave: () => void;
};

/** The private lobby: share the code, see who is in, and (host) start. */
function OnlineLobby({
  online,
  code,
  onLeave,
}: OnlineLobbyProps): ReactElement {
  const enough = online.seats.length >= MIN_PLAYERS;

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
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {T.startGame}
          </button>
          {!enough && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.needPlayers}
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
function SeatList({ online }: { online: KrakelOnline }): ReactElement {
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
  readonly online: KrakelOnline;
  readonly match: Match;
  /** The table size the player asked for. */
  readonly wanted: number;
  readonly onlineCount: number | null;
  readonly onHop: (code: string) => void;
  readonly onCancel: () => void;
};

/**
 * The auto-match waiting screen: gathers players and starts on its own.
 *
 * @remarks
 * Reaching the wished table size starts the round at once. Waiting longer than
 * {@link RELAX_MS} without getting there settles for whoever did turn up, so a
 * player asking for a big table is never stuck for good.
 */
function SearchingLobby({
  online,
  match,
  wanted,
  onlineCount,
  onHop,
  onCancel,
}: SearchingLobbyProps): ReactElement {
  const isHost = online.isHost;
  const seats = online.seats.length;
  const [relaxed, setRelaxed] = useState(false);
  const enough = seats >= wanted || (relaxed && seats >= MIN_PLAYERS);
  const startedRef = useRef(false);

  // After the grace, any table size will do.
  useEffect(() => {
    const timer = setTimeout(() => setRelaxed(true), RELAX_MS);
    return () => clearTimeout(timer);
  }, []);

  const start = online.start;
  const startNow = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void clearMatch(database(), GAME_ID, match.code);
    start();
  }, [match.code, start]);

  useEffect(() => {
    if (!isHost) {
      return;
    }
    const db = database();
    const announce = () =>
      void hostEntry(db, GAME_ID, match.code, matchWish(wanted), Date.now());
    // Advertise at once, not only when the first beat comes round: leaving the
    // room unlisted for a heartbeat would hide it from everyone searching in
    // that window. It also puts the entry back should anything have dropped it.
    announce();
    const timer = setInterval(announce, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [isHost, match.code, wanted]);

  useEffect(() => {
    if (!isHost) {
      return;
    }
    return () => void clearMatch(database(), GAME_ID, match.code);
  }, [isHost, match.code]);

  useEffect(() => {
    if (!isHost || seats > 1) {
      return;
    }
    const db = database();
    const tick = async () => {
      const target = await relaxMatch(
        db,
        GAME_ID,
        matchWish(wanted),
        match.code,
        Date.now(),
        relaxed,
      );
      if (target !== null && !startedRef.current) {
        await clearMatch(db, GAME_ID, match.code);
        onHop(target);
      }
    };
    // Look straight away, not only when the first interval elapses: two players
    // searching at the same moment both open a room, and waiting a full tick
    // before merging is the difference between "starts at once" and a pause.
    void tick();
    const timer = setInterval(() => void tick(), RELAX_TICK_MS);
    return () => clearInterval(timer);
  }, [isHost, seats, match.code, onHop, wanted, relaxed]);

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
          className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"
        />
        <h2 className="text-lg font-semibold">{T.searching}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {T.playersHere(seats, wanted)}
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
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {enough ? T.startsNow : T.waitingFor(seats, wanted)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {relaxed ? T.relaxedNow : T.relaxHint(RELAX_MS / MS_PER_SECOND)}
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

/** Props of {@link PlayingArea}. */
type PlayingAreaProps = {
  readonly online: KrakelOnline;
  readonly onLeave: () => void;
};

/** The running game: the board plus a leave button. */
function PlayingArea({ online, onLeave }: PlayingAreaProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <LeaveButton onLeave={onLeave} />
      </div>
      <KrakelBoard online={online} />
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
    <div className="flex items-center gap-2 self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
      <span className="h-2 w-2 rounded-full bg-indigo-500" />
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
  readonly label: string;
  readonly value: string;
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
