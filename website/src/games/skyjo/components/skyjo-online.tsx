/**
 * Online Skyjo: the entry screen, the lobby and the running table.
 *
 * @module
 * @remarks
 * Skyjo is turn-based, so it runs on the shared online layer rather than a game
 * loop of its own: {@link useOnlineRoom} does the room, the host election and
 * the redaction, and this screen only has to render what it hands back.
 *
 * Two ways in, like the other games: automatic matchmaking against strangers
 * (a wished table size, then {@link SearchingLobby} gathers players and starts
 * on its own) or a private room whose four-letter code you pass around.
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
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/skyjo/engine/state";
import type { SkyjoGame, SkyjoMove } from "@/games/skyjo/engine/state";
import {
  skyjoAdapter,
  type SkyjoOptions,
} from "@/games/skyjo/multiplayer/adapter";
import {
  DEFAULT_PLAYER_COUNT,
  PLAYER_COUNTS,
} from "@/games/skyjo/settings/app-settings";
import {
  loadMatchCount,
  loadPlayerName,
  saveMatchCount,
  savePlayerName,
} from "@/games/skyjo/settings/online-settings";
import { SkyjoScores } from "./skyjo-scores";
import { SkyjoTable } from "./skyjo-table";
import { database } from "@/online/firebase-app";
import {
  clearMatch,
  findMatch,
  hostEntry,
  relaxMatch,
  type Match,
  type Wish,
} from "@/online/matchmaking";
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
  autoTitle: "Automatisch matchen",
  autoHint:
    "Passt ein offener Tisch, geht es sofort los - sonst nach kurzer Wartezeit auch mit einer anderen Spielerzahl.",
  autoMatch: "Mitspieler finden",
  searching: "Suche Mitspieler …",
  tableSize: "Spieler:",
  orDivider: "oder",
  createRoom: "Raum erstellen",
  roomCode: "Raumcode",
  codePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  connecting: "Verbinde …",
  lobbyTitle: "Privater Raum",
  shareHint: `Teile den Code mit deinen Mitspielern (${MIN_PLAYERS} bis ${MAX_PLAYERS}).`,
  players: "Spieler",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Spiel starten",
  needPlayers: "Warte auf mindestens einen Mitspieler …",
  waitingForHost: "Warte auf den Host …",
  cancelSearch: "Suche abbrechen",
  leaveRoom: "Raum verlassen",
  online: (n: number) => `${n} online`,
  playersHere: (n: number, want: number) => `${n}/${want} im Raum`,
  waitingFor: (have: number, want: number) =>
    `Noch ${want - have} Mitspieler gesucht …`,
  startsNow: "Vollzählig - los geht's!",
  relaxHint: (s: number) =>
    `Noch ${s}s - danach starten wir auch mit einer anderen Spielerzahl.`,
  relaxedNow: "Wir starten jetzt auch mit weniger Spielern.",
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

/** This game's id, for presence and matchmaking namespacing. */
const GAME_ID = skyjoAdapter.gameId;

/**
 * How long a player may dither before the computer plays their turn.
 *
 * @remarks
 * The same in a private room as at a table of strangers: whoever you are
 * playing with, half a minute of nothing is enough to hold everyone up.
 */
const AUTO_PLAY_MS = 30_000;

/** How often the open room's matchmaking entry is kept alive, in ms. */
const HEARTBEAT_MS = 10_000;

/**
 * How long the search insists on the wished table size before widening.
 *
 * @remarks
 * Reaching the wished number of players starts the game at once; otherwise this
 * is the wait after which any table size will do, so a lone searcher is not
 * left hanging.
 */
const RELAX_MS = 20_000;

/** How often a lone waiting host looks for a room to merge into, in ms. */
const RELAX_TICK_MS = 4_000;

/** Milliseconds in a second, for showing the grace as seconds. */
const MS_PER_SECOND = 1000;

/**
 * The wish advertised while searching.
 *
 * @param count - the wished table size
 * @returns the wish two searchers must agree on to be put together
 * @remarks
 * Skyjo has nothing else to agree on - the difficulty only ever describes the
 * computer opponents, and there are none online - so the shared wish's deck
 * flags stay false and the game-specific `variant` slot is left out entirely.
 */
function matchWish(count: number): Wish {
  return { count, expansion: false, defense: false };
}

/**
 * Renders the whole online mode.
 *
 * @returns the online element
 */
export function SkyjoOnlineScreen(): ReactElement {
  const onlineCount = useOnlineCount(GAME_ID);
  const [session, setSession] = useState<OnlineSession | null>(null);
  // Set while auto-matching, so the lobby searches and starts on its own
  // instead of waiting for a host to press start.
  const [auto, setAuto] = useState<Match | null>(null);
  // The table size the search waits for, kept while the lobby is open.
  const [wanted, setWanted] = useState(DEFAULT_PLAYER_COUNT);
  const room = useOnlineRoom(skyjoAdapter, session);

  // Leaving: an auto-match host also frees its open-room slot for the next wave.
  const leave = useCallback(() => {
    if (auto?.mode === "host") {
      void clearMatch(database(), GAME_ID, auto.code);
    }
    setAuto(null);
    setSession(null);
  }, [auto]);

  // Auto-match: join an open public room matching the wish, or open one to
  // host, then drop into the normal room flow with a searching lobby.
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

  // Merge into another open room mid-search: keep the wish, become its guest.
  const hop = useCallback((targetCode: string) => {
    setAuto({ code: targetCode, mode: "guest" });
    setSession((prev) =>
      prev === null ? prev : { ...prev, mode: "guest", code: targetCode },
    );
  }, []);

  let body: ReactElement;
  if (session === null) {
    body = (
      <Entry
        onStart={startPrivate}
        onAutoMatch={startAuto}
        onlineCount={onlineCount}
      />
    );
  } else if (room.status === "error") {
    body = <ErrorPanel onBack={leave} />;
  } else if (room.status === "connecting" || room.status === "idle") {
    body = <p className="text-sm">{L.connecting}</p>;
  } else if (room.status === "lobby") {
    body =
      auto !== null ? (
        <SearchingLobby
          room={room}
          match={auto}
          wanted={wanted}
          onlineCount={onlineCount}
          onHop={hop}
          onCancel={leave}
        />
      ) : (
        <Lobby room={room} code={session.code} onLeave={leave} />
      );
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

/** The first screen: pick a name and table size, then match, host or join. */
function Entry({
  onStart,
  onAutoMatch,
  onlineCount,
}: {
  readonly onStart: (session: OnlineSession) => void;
  readonly onAutoMatch: (name: string, count: number) => Promise<void>;
  readonly onlineCount: number | null;
}): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [count, setCount] = useState(DEFAULT_PLAYER_COUNT);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time prefill from storage */
    const saved = loadPlayerName().trim();
    if (saved.length > 0) {
      setName(saved);
    }
    setCount(loadMatchCount());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Every choice is kept for next time, whichever way the player goes in.
  const remember = () => {
    savePlayerName(name);
    saveMatchCount(count);
  };
  const chooseCount = (next: number) => {
    setCount(next);
    saveMatchCount(next);
  };
  const host = () => {
    remember();
    onStart({ mode: "host", code: generateRoomCode(), name });
  };
  const join = () => {
    const clean = normalizeRoomCode(code);
    if (isValidRoomCode(clean)) {
      remember();
      onStart({ mode: "guest", code: clean, name });
    }
  };
  const autoMatch = () => {
    remember();
    setSearching(true);
    // The parent swaps this screen out once the match resolves; on failure fall
    // back to the entry screen rather than spinning for ever.
    void onAutoMatch(name, count).catch(() => setSearching(false));
  };

  return (
    <div className="flex max-w-md flex-col gap-5">
      <OnlineCountBadge count={onlineCount} />

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

      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div>
          <h2 className="text-sm font-semibold">{L.autoTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {L.autoHint}
          </p>
        </div>
        <PlayerCountPicker count={count} onChoose={chooseCount} />
        <button
          type="button"
          onClick={autoMatch}
          disabled={searching}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? L.searching : L.autoMatch}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        {L.orDivider}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={host}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
          onClick={join}
          className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {L.joinRoom}
        </button>
      </div>
    </div>
  );
}

/** Picks how many players the table should have, and remembers the choice. */
function PlayerCountPicker({
  count,
  onChoose,
}: {
  readonly count: number;
  readonly onChoose: (count: number) => void;
}): ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={L.tableSize}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {L.tableSize}
      </span>
      {PLAYER_COUNTS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === count}
          data-testid={`player-count-${option}`}
          onClick={() => onChoose(option)}
          className={
            option === count
              ? "cursor-pointer rounded-lg border border-emerald-500 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
              : "cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          }
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * The auto-match waiting screen: gathers players and starts on its own.
 *
 * @remarks
 * Reaching the wished table size starts the game at once. Waiting longer than
 * {@link RELAX_MS} without getting there settles for whoever did turn up, so a
 * player asking for a big table is never stuck for good.
 */
function SearchingLobby({
  room,
  match,
  wanted,
  onlineCount,
  onHop,
  onCancel,
}: {
  readonly room: Room;
  readonly match: Match;
  /** The table size the player asked for. */
  readonly wanted: number;
  readonly onlineCount: number | null;
  readonly onHop: (code: string) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const isHost = room.isHost;
  const seats = room.room?.seats ?? [];
  const here = seats.length;
  const [relaxed, setRelaxed] = useState(false);
  const enough = here >= wanted || (relaxed && here >= MIN_PLAYERS);
  const startedRef = useRef(false);

  // After the grace, any table size will do.
  useEffect(() => {
    const timer = setTimeout(() => setRelaxed(true), RELAX_MS);
    return () => clearTimeout(timer);
  }, []);

  const start = room.start;
  const startNow = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void clearMatch(database(), GAME_ID, match.code);
    start({ autoPlayMs: AUTO_PLAY_MS });
  }, [match.code, start]);

  // Advertise the open room, and keep the entry alive while waiting.
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

  // Waiting alone: look for another open room to merge into.
  useEffect(() => {
    if (!isHost || here > 1) {
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
  }, [isHost, here, match.code, onHop, wanted, relaxed]);

  useEffect(() => {
    if (isHost && enough) {
      startNow();
    }
  }, [isHost, enough, startNow]);

  return (
    <div className="flex max-w-md flex-col gap-5">
      <OnlineCountBadge count={onlineCount} />
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
        />
        <h2 className="text-lg font-semibold">{L.searching}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {L.playersHere(here, wanted)}
        </p>
        <ul className="flex flex-wrap justify-center gap-1">
          {seats.map((seat) => (
            <li
              key={seat.id}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
            >
              {seat.name}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {enough ? L.startsNow : L.waitingFor(here, wanted)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {relaxed ? L.relaxedNow : L.relaxHint(RELAX_MS / MS_PER_SECOND)}
        </p>
      </section>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {L.cancelSearch}
      </button>
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
  // Seats whose player left: the host plays them on, and the table says so.
  const botSeatIds = room.room?.botSeatIds ?? [];
  const botSeats = seats
    .map((seat, index) => (botSeatIds.includes(seat.id) ? index : -1))
    .filter((index) => index >= 0);

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
          botSeats={botSeats}
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

/** A small pill with the live count of players online, or nothing yet. */
function OnlineCountBadge({
  count,
}: {
  readonly count: number | null;
}): ReactElement | null {
  if (count === null) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {L.online(count)}
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
