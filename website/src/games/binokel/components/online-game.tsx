/**
 * Binokel online multiplayer: the entry screen, the lobby and the running game.
 *
 * @module
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
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  TEAM_PLAYER_COUNTS,
} from "@/games/binokel/engine/setup";
import type { GameState } from "@/games/binokel/engine/state";
import {
  loadBinokelHostSettings,
  saveBinokelHostSettings,
} from "@/games/binokel/settings/online-host-settings";
import {
  loadPlayerName,
  savePlayerName,
} from "@/games/binokel/settings/player-name";
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
import type { RoomState } from "@/online/adapter";
import {
  useOnlineRoom,
  type OnlineRoom,
  type OnlineSession,
} from "@/games/binokel/hooks/use-online-room";
import { BINOKEL_ONLINE_TEXTS } from "@/games/binokel/i18n/binokel-texts";
import { OnlineBoard } from "./online-board";

/** This game's id, for presence and matchmaking namespacing. */
const GAME_ID = "binokel";

/** Query parameter that carries a room code in an invite link. */
const ROOM_QUERY_PARAM = "raum";

/** Points that end a match, as in the local game. */
const TARGET_SCORE = 1000;

/** How long the "copied!" confirmation stays up, in milliseconds. */
const COPIED_FEEDBACK_MS = 1500;

/** Milliseconds in a second, for the auto-play labels and countdowns. */
const MS_PER_SECOND = 1000;

/** How often the open room's matchmaking entry is kept alive, in ms. */
const HEARTBEAT_MS = 10_000;

/** Grace before an auto-matched game starts without reaching the wished size. */
const AUTO_START_MS = 20_000;

/** How long the search only merges exactly-matching tables before widening. */
const RELAX_MS = 15_000;

/** How often a lone waiting host looks for a table to merge into, in ms. */
const RELAX_TICK_MS = 4_000;

/** Auto-play timeout for matched games, so a stranger cannot stall the table. */
const AUTO_MATCH_AUTOPLAY_MS = 30_000;

/** The tick of the auto-start countdown, in milliseconds. */
const COUNTDOWN_TICK_MS = 250;

/** The wished table sizes a searcher can pick, e.g. [3, 4, 5, 6]. */
const MATCH_COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

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

/** Builds a matchmaking wish for Binokel: only the table size matters. */
function wishForCount(count: number): Wish {
  return { count, expansion: false, defense: false };
}

/** Label for one auto-play choice. */
function autoPlayLabel(ms: number | null): string {
  return ms === null
    ? BINOKEL_ONLINE_TEXTS.autoPlayOff
    : BINOKEL_ONLINE_TEXTS.autoPlaySeconds(ms / MS_PER_SECOND);
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
  const onlineCount = useOnlineCount(GAME_ID);
  const [session, setSession] = useState<OnlineSession | null>(null);
  // Set while the player is auto-matching, so the lobby knows to search and
  // auto-start rather than wait for a host to press start.
  const [auto, setAuto] = useState<{ match: Match; wish: Wish } | null>(null);

  const room = useOnlineRoom(session);

  // Leaving: an auto-match host also frees its open-room slot for the next wave.
  const leave = useCallback(() => {
    if (auto?.match.mode === "host") {
      void clearMatch(database(), GAME_ID, auto.match.code);
    }
    setAuto(null);
    setSession(null);
  }, [auto]);

  // Auto-match: find an open public room matching the wish, or open one to host,
  // then drop into the normal room flow with a searching lobby.
  const startAuto = useCallback(async (name: string, wish: Wish) => {
    const found = await findMatch(database(), GAME_ID, wish, Date.now());
    setAuto({ match: found, wish });
    setSession({ mode: found.mode, code: found.code, name });
  }, []);

  const startPrivate = useCallback((next: OnlineSession) => {
    setAuto(null);
    setSession(next);
  }, []);

  // Merge into another open room mid-search: keep the wish, become its guest.
  const hop = useCallback((targetCode: string) => {
    setAuto((prev) =>
      prev === null
        ? prev
        : { match: { code: targetCode, mode: "guest" }, wish: prev.wish },
    );
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
  } else if (room.status === "error") {
    body = <OnlineError onBack={leave} />;
  } else if (room.room === null || room.status === "connecting") {
    body = <p className="text-sm">{BINOKEL_ONLINE_TEXTS.connecting}</p>;
  } else if (room.status === "lobby") {
    body =
      auto !== null ? (
        <SearchingLobby
          room={room.room}
          online={room}
          match={auto.match}
          wish={auto.wish}
          onlineCount={onlineCount}
          onHop={hop}
          onCancel={leave}
        />
      ) : (
        <OnlineLobby room={room.room} online={room} onLeave={leave} />
      );
  } else {
    body = <PlayingArea room={room.room} online={room} onLeave={leave} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{BINOKEL_ONLINE_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {BINOKEL_ONLINE_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href="/binokel"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {BINOKEL_ONLINE_TEXTS.backToGame}
        </Link>
      </header>
      {body}
    </div>
  );
}

/** Props of {@link OnlineEntry}. */
type OnlineEntryProps = {
  readonly onStart: (session: OnlineSession) => void;
  readonly onAutoMatch: (name: string, wish: Wish) => Promise<void>;
  /** How many players are online right now, or null while still connecting. */
  readonly onlineCount: number | null;
};

/** The first screen: pick a name and wished table, then auto-match, host or join. */
function OnlineEntry({
  onStart,
  onAutoMatch,
  onlineCount,
}: OnlineEntryProps): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [count, setCount] = useState(MIN_PLAYERS);
  const [searching, setSearching] = useState(false);

  // Prefill the name, the invite code and the wished size, in the browser only
  // so the prerendered HTML stays stable.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time prefill from storage/URL */
    const saved = loadPlayerName();
    if (saved !== "") {
      setName(saved);
    }
    setCount(loadBinokelHostSettings().matchPlayerCount);
    const params = new URLSearchParams(window.location.search);
    const invited = params.get(ROOM_QUERY_PARAM);
    if (invited !== null) {
      setCode(normalizeRoomCode(invited));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Keep the entered name for next time (always the last one chosen).
  const changeName = (value: string) => {
    setName(value);
    savePlayerName(value);
  };

  // Remember the wished table size for next time.
  const chooseCount = (value: number) => {
    setCount(value);
    saveBinokelHostSettings({
      ...loadBinokelHostSettings(),
      matchPlayerCount: value,
    });
  };

  const host = () => onStart({ mode: "host", code: generateRoomCode(), name });
  const join = () => {
    const clean = normalizeRoomCode(code);
    if (isValidRoomCode(clean)) {
      onStart({ mode: "guest", code: clean, name });
    }
  };
  const autoMatch = () => {
    setSearching(true);
    // The parent swaps this screen out once the match resolves; on failure fall
    // back so the button is usable again.
    void onAutoMatch(name, wishForCount(count)).catch(() =>
      setSearching(false),
    );
  };

  return (
    <div className="flex max-w-md flex-col gap-6">
      <OnlineCountBadge count={onlineCount} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{BINOKEL_ONLINE_TEXTS.yourName}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => changeName(event.target.value)}
          placeholder={BINOKEL_ONLINE_TEXTS.yourNamePlaceholder}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div>
          <h2 className="text-sm font-semibold">
            {BINOKEL_ONLINE_TEXTS.matchWish}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {BINOKEL_ONLINE_TEXTS.matchWishHint}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {BINOKEL_ONLINE_TEXTS.matchCount}
          </span>
          {MATCH_COUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseCount(value)}
              data-testid={`match-count-${value}`}
              aria-pressed={count === value}
              className={[
                "cursor-pointer rounded-lg border px-3 py-1 text-sm font-medium",
                count === value
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                  : "border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={autoMatch}
          disabled={searching}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching
            ? BINOKEL_ONLINE_TEXTS.searching
            : BINOKEL_ONLINE_TEXTS.autoMatch}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        {BINOKEL_ONLINE_TEXTS.orDivider}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={host}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {BINOKEL_ONLINE_TEXTS.createRoom}
      </button>

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{BINOKEL_ONLINE_TEXTS.roomCode}</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder={BINOKEL_ONLINE_TEXTS.roomCodePlaceholder}
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
          {BINOKEL_ONLINE_TEXTS.joinRoom}
        </button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {BINOKEL_ONLINE_TEXTS.hostLeftNotice}
      </p>
    </div>
  );
}

/** Props shared by the lobby and the playing area. */
type RoomViewProps = {
  readonly room: RoomState<GameState>;
  readonly online: OnlineRoom;
  readonly onLeave: () => void;
};

/** The lobby: share the code, see who is in, and (host) start the game. */
function OnlineLobby({ room, online, onLeave }: RoomViewProps): ReactElement {
  // Start from the host's last choices. This component only mounts on the
  // client (after connecting), so reading storage here is safe.
  const [initial] = useState(loadBinokelHostSettings);
  const [withSevens, setWithSevens] = useState(initial.withSevens);
  const [withDabb, setWithDabb] = useState(initial.withDabb);
  const [teams, setTeams] = useState(initial.teams);
  const [autoPlayIndex, setAutoPlayIndex] = useState(() =>
    autoPlayIndexOf(initial.autoPlayMs),
  );
  const enoughPlayers = room.seats.length >= MIN_PLAYERS;
  const teamsAvailable = TEAM_PLAYER_COUNTS.includes(room.seats.length);

  // Remember the host's choices so the next room starts from them. Only the
  // host changes these, so a guest never overwrites its own saved settings.
  useEffect(() => {
    if (online.isHost) {
      saveBinokelHostSettings({
        withSevens,
        withDabb,
        teams,
        autoPlayMs: AUTO_PLAY_OPTIONS[autoPlayIndex].ms,
        matchPlayerCount: initial.matchPlayerCount,
      });
    }
  }, [online.isHost, withSevens, withDabb, teams, autoPlayIndex, initial]);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">
          {BINOKEL_ONLINE_TEXTS.lobbyTitle}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {BINOKEL_ONLINE_TEXTS.shareHint}
        </p>
        <div className="flex items-center gap-3">
          <span
            data-testid="room-code"
            className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-2xl font-bold tracking-widest dark:bg-zinc-800"
          >
            {room.code}
          </span>
          <CopyButton label={BINOKEL_ONLINE_TEXTS.copyCode} value={room.code} />
          <CopyButton
            label={BINOKEL_ONLINE_TEXTS.copyLink}
            value={inviteLink(room.code)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          {BINOKEL_ONLINE_TEXTS.players} ({room.seats.length})
        </h2>
        <ul className="flex flex-col gap-1">
          {room.seats.map((seat) => (
            <li
              key={seat.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span>{seat.name}</span>
              {seat.isHost && <Badge>{BINOKEL_ONLINE_TEXTS.hostBadge}</Badge>}
              {seat.id === online.seatId && (
                <Badge>{BINOKEL_ONLINE_TEXTS.youBadge}</Badge>
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
              checked={withSevens}
              onChange={(event) => setWithSevens(event.target.checked)}
            />
            {BINOKEL_ONLINE_TEXTS.withSevens}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withDabb}
              onChange={(event) => setWithDabb(event.target.checked)}
            />
            {BINOKEL_ONLINE_TEXTS.withDabb}
          </label>
          <label
            className={`flex items-center gap-2 text-sm ${teamsAvailable ? "" : "opacity-50"}`}
          >
            <input
              type="checkbox"
              disabled={!teamsAvailable}
              checked={teamsAvailable && teams}
              onChange={(event) => setTeams(event.target.checked)}
            />
            {BINOKEL_ONLINE_TEXTS.teams}
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="auto-play" className="text-sm font-medium">
              {BINOKEL_ONLINE_TEXTS.autoPlay}
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
              {BINOKEL_ONLINE_TEXTS.autoPlayHint}
            </span>
          </div>
          <button
            type="button"
            disabled={!enoughPlayers}
            onClick={() =>
              online.start({
                withSevens,
                withDabb,
                teams: teamsAvailable && teams,
                targetScore: TARGET_SCORE,
                autoPlayMs: AUTO_PLAY_OPTIONS[autoPlayIndex].ms,
              })
            }
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {BINOKEL_ONLINE_TEXTS.startGame}
          </button>
          {!enoughPlayers && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {BINOKEL_ONLINE_TEXTS.needMorePlayers}
            </p>
          )}
        </section>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {BINOKEL_ONLINE_TEXTS.waitingForHost}
        </p>
      )}

      <LeaveButton onLeave={onLeave} />
    </div>
  );
}

/** Props of {@link SearchingLobby}. */
type SearchingLobbyProps = {
  readonly room: RoomState<GameState>;
  readonly online: OnlineRoom;
  readonly match: Match;
  readonly wish: Wish;
  readonly onlineCount: number | null;
  readonly onHop: (code: string) => void;
  readonly onCancel: () => void;
};

/**
 * The auto-match waiting screen: shows who has gathered and starts on its own.
 *
 * @param props - the room, the match, the wish, the count and the callbacks
 * @returns the searching element
 * @remarks
 * The host advertises its wished table, keeps the entry alive, and - while still
 * waiting alone - merges into a matching open room (any room once the grace
 * passes). It starts the game once the wished size is reached, or after a longer
 * grace with at least {@link MIN_PLAYERS}. The table's deck options come from the
 * host's saved settings, since auto-match skips the lobby's option screen.
 */
function SearchingLobby({
  room,
  online,
  match,
  wish,
  onlineCount,
  onHop,
  onCancel,
}: SearchingLobbyProps): ReactElement {
  const seats = room.seats.length;
  const isHost = online.isHost;
  const enough = seats >= MIN_PLAYERS;
  const reachedTarget = seats >= wish.count;
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const startedRef = useRef(false);

  // `start` is a stable callback from the hook, so this stays stable too - the
  // auto-start timer below must not restart on every render.
  const start = online.start;
  const startNow = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void clearMatch(database(), GAME_ID, match.code);
    const settings = loadBinokelHostSettings();
    const teamsOk = TEAM_PLAYER_COUNTS.includes(seats);
    start({
      withSevens: settings.withSevens,
      withDabb: settings.withDabb,
      teams: teamsOk && settings.teams,
      targetScore: TARGET_SCORE,
      autoPlayMs: AUTO_MATCH_AUTOPLAY_MS,
    });
  }, [match.code, seats, start]);

  // Host keeps its own open-room entry alive while it waits for players.
  useEffect(() => {
    if (!isHost) {
      return;
    }
    const db = database();
    const timer = setInterval(
      () => void hostEntry(db, GAME_ID, match.code, wish, Date.now()),
      HEARTBEAT_MS,
    );
    return () => clearInterval(timer);
  }, [isHost, match.code, wish]);

  // Host frees its entry on any exit from the search (cancel, start, merge).
  useEffect(() => {
    if (!isHost) {
      return;
    }
    return () => void clearMatch(database(), GAME_ID, match.code);
  }, [isHost, match.code]);

  // While a lone host waits, merge into another open room: only exactly matching
  // ones at first, any of them once the grace has passed. Deterministic seniority
  // means only one of two waiting hosts moves. A room with a guest never merges.
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
        GAME_ID,
        wish,
        match.code,
        Date.now(),
        allowAny,
      );
      if (target !== null && !startedRef.current) {
        await clearMatch(db, GAME_ID, match.code);
        onHop(target);
      }
    };
    const timer = setInterval(() => void tick(), RELAX_TICK_MS);
    return () => clearInterval(timer);
  }, [isHost, seats, match.code, wish, onHop]);

  // Host auto-start: the wished size starts at once; enough players start after a
  // longer grace, so latecomers still make it in.
  useEffect(() => {
    if (!isHost || room.phase !== "lobby") {
      return;
    }
    if (reachedTarget) {
      startNow();
      return;
    }
    if (!enough) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the countdown
      setRemainingMs(null);
      return;
    }
    const deadline = Date.now() + AUTO_START_MS;
    setRemainingMs(AUTO_START_MS);
    const timer = setInterval(() => {
      const left = deadline - Date.now();
      setRemainingMs(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timer);
        startNow();
      }
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, [isHost, room.phase, enough, reachedTarget, startNow]);

  let statusLine: string;
  if (isHost && remainingMs !== null) {
    statusLine = BINOKEL_ONLINE_TEXTS.startingIn(
      Math.ceil(remainingMs / MS_PER_SECOND),
    );
  } else if (enough) {
    statusLine = BINOKEL_ONLINE_TEXTS.almostReady;
  } else {
    statusLine = BINOKEL_ONLINE_TEXTS.waitingForMore;
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <OnlineCountBadge count={onlineCount} />

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
        />
        <h2 className="text-lg font-semibold">
          {BINOKEL_ONLINE_TEXTS.searching}
        </h2>

        <div className="flex flex-wrap justify-center gap-1 text-xs">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
            {BINOKEL_ONLINE_TEXTS.matchCountValue(wish.count)}
          </span>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {BINOKEL_ONLINE_TEXTS.playersHere(seats)}
        </p>
        <ul className="flex flex-wrap justify-center gap-1">
          {room.seats.map((seat) => (
            <li
              key={seat.id}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
            >
              {seat.name}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {statusLine}
        </p>
      </section>

      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {BINOKEL_ONLINE_TEXTS.cancelSearch}
      </button>
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
          {BINOKEL_ONLINE_TEXTS.roomCode}:{" "}
          <span className="font-mono font-semibold">{room.code}</span>
        </span>
        <div className="flex items-center gap-2">
          {/* After a match the host can deal a fresh one with the same table. */}
          {isFinished && online.isHost && (
            <button
              type="button"
              onClick={online.newRound}
              className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {BINOKEL_ONLINE_TEXTS.newRound}
            </button>
          )}
          {isFinished && !online.isHost && (
            <span>{BINOKEL_ONLINE_TEXTS.waitingForRematch}</span>
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
      {BINOKEL_ONLINE_TEXTS.playersOnline(count)}
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
        {BINOKEL_ONLINE_TEXTS.errorRoomNotFound}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {BINOKEL_ONLINE_TEXTS.backToGame}
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
      {copied ? BINOKEL_ONLINE_TEXTS.copied : label}
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
      {BINOKEL_ONLINE_TEXTS.leaveRoom}
    </button>
  );
}

/** Builds the invite link for a room code from the current page URL. */
function inviteLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}?${ROOM_QUERY_PARAM}=${code}`;
}
