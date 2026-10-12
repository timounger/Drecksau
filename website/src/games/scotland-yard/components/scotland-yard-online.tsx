/**
 * Scotland Yard online: the entry screen, the lobby and the table.
 *
 * @module
 * @remarks
 * Turn-based, so it runs on the shared online layer: {@link useOnlineRoom}
 * does the room, the host election and the redaction, and this screen only
 * renders what it hands back. Every seat looks at the game through `viewFor`,
 * so a detective never sees where Mister X is - not even the host, whose
 * device holds the whole game.
 *
 * Two ways in, like the other games: automatic matchmaking against strangers
 * (Mister X is drawn at random there) or a private room whose four-letter
 * code you pass around, where the host decides who runs.
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
import { RulesButton } from "@/components/rules-button";
import {
  GameResultOverlay,
  type GameOutcome,
} from "@/components/game-result-overlay";
import { ScotlandYardResult } from "@/games/scotland-yard/components/scotland-yard-result";
import { ScotlandYardTable } from "@/games/scotland-yard/components/scotland-yard-table";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  MISTER_X_NAMES,
  type ScotlandYardGame,
  type ScotlandYardMove,
  type Variant,
} from "@/games/scotland-yard/engine/state";
import { viewFor } from "@/games/scotland-yard/engine/view";
import { SCOTLAND_YARD_RULES } from "@/games/scotland-yard/i18n/rules";
import {
  SCOTLAND_YARD_TEXTS as T,
  VARIANT_HINTS,
  VARIANT_NAMES,
} from "@/games/scotland-yard/i18n/texts";
import {
  scotlandYardAdapter,
  type MisterXSeat,
  type ScotlandYardOptions,
} from "@/games/scotland-yard/multiplayer/adapter";
import { Avatar } from "@/online/avatar";
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
import { loadPlayerName, savePlayerName } from "@/online/player-name";
import { StoredAvatarFace } from "@/online/player-avatar";
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
import { useOnlineCount } from "@/online/use-online-presence";
import { VoiceChat } from "@/online/voice-chat";

/** The table size the entry screen starts on. */
const DEFAULT_SEATS = 4;

/** How big a face is beside a seat name, and in a waiting-room pill. */
const AVATAR_SEAT = 22;
const AVATAR_TINY = 16;

/** German labels for the online screen. */
const L = {
  title: `${T.title} online`,
  subtitle: "Mister X gegen die Detektive, jede:r am eigenen Gerät",
  back: "Zurück",
  yourName: "Dein Name",
  namePlaceholder: "z. B. Alex",
  autoTitle: "Automatisch matchen",
  autoHint:
    "Passt ein offener Tisch, geht es sofort los - sonst nach kurzer Wartezeit auch mit einer anderen Spielerzahl. Wer Mister X spielt, entscheidet das Los.",
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
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  invitedHint: "Du wurdest eingeladen - Namen eintragen und beitreten.",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Spiel starten",
  needPlayers: `Warte auf mindestens ${MIN_PLAYERS} Spieler …`,
  needPlayersComputer:
    "Mit dem Computer als Mister X reicht schon ein Spieler.",
  waitingForHost: "Warte auf den Host …",
  waitingForRematch:
    "Warte auf den Host - er kann direkt eine neue Jagd starten.",
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
  variant: "Variante",
  misterX: "Wer ist Mister X?",
  misterXHost: "Ich (Host)",
  misterXRandom: "Zufall",
  misterXComputer: "Computer",
  misterXHint:
    "Als Host sieht dein Gerät das ganze Spiel - darum ist Mister X am besten der Host oder der Computer.",
  fullForComputer:
    "Bei 6 Spielern ist kein Platz für den Computer - dann spielt der Host Mister X.",
  name: "Name",
  showHiding: "Mögliche Verstecke zeigen",
  notice: (variant: Variant, who: string, name: string) =>
    `${VARIANT_NAMES[variant]} - ${name}: ${who}`,
} as const;

/** The big word the end animation puts on the screen. */
const RESULT_WORDS: Readonly<Record<GameOutcome, string>> = {
  won: T.won,
  lost: T.lost,
};

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
const GAME_ID = scotlandYardAdapter.gameId;

/**
 * How long a player may think before the computer moves for them.
 *
 * @remarks
 * A move is a station and a ticket, but Mister X may well want to think - so
 * this is generous. It only applies to somebody present; a seat whose player
 * left is played at once.
 */
const AUTO_PLAY_MS = 90_000;

/** How often the open room's matchmaking entry is kept alive, in ms. */
const HEARTBEAT_MS = 10_000;

/** How long the search insists on the wished table size before widening. */
const RELAX_MS = 20_000;

/** How often a lone waiting host looks for a room to merge into, in ms. */
const RELAX_TICK_MS = 4_000;

/** Milliseconds in a second, for showing the grace as seconds. */
const MS_PER_SECOND = 1000;

/** What a table found by matchmaking plays: the standard game, Mister X drawn. */
const AUTO_MATCH_OPTIONS: ScotlandYardOptions = {
  variant: "standard",
  misterX: "random",
  misterXName: MISTER_X_NAMES[0],
};

/** Who can play Mister X, in the order the lobby offers it. */
const MISTER_X_SEATS: readonly MisterXSeat[] = ["host", "random", "computer"];

/**
 * The wish advertised while searching.
 *
 * @param count - the wished table size
 * @returns the wish two searchers must agree on to be put together
 */
function matchWish(count: number): Wish {
  return { count, expansion: false, defense: false };
}

/**
 * Renders the whole online mode.
 *
 * @returns the online element
 */
export function ScotlandYardOnlineScreen(): ReactElement {
  const onlineCount = useOnlineCount(GAME_ID);
  const [session, setSession] = useState<OnlineSession | null>(null);
  // Set while auto-matching, so the lobby searches and starts on its own.
  const [auto, setAuto] = useState<Match | null>(null);
  // The table size the search waits for, kept while the lobby is open.
  const [wanted, setWanted] = useState(DEFAULT_SEATS);
  const room = useOnlineRoom(scotlandYardAdapter, session);

  // Leaving: an auto-match host also frees its open-room slot for the next wave.
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
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {L.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RulesButton rules={SCOTLAND_YARD_RULES} />
          <Link
            href="/scotland-yard"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {L.back}
          </Link>
        </div>
      </header>
      {body}
    </div>
  );
}

/** The type the room hook hands back, for the panels below. */
type Room = OnlineRoom<ScotlandYardGame, ScotlandYardMove, ScotlandYardOptions>;

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
  // True when the code came from an invite link rather than being typed.
  const [invited, setInvited] = useState(false);
  const [count, setCount] = useState(DEFAULT_SEATS);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time prefill from storage and URL */
    // An invite link fills the field in; joining still needs a name, and
    // whoever followed the link from a chat has not been asked for one yet.
    const fromLink = invitedCode();
    if (fromLink !== "") {
      setCode(fromLink);
      setInvited(true);
    }
    const saved = loadPlayerName().trim();
    if (saved.length > 0) {
      setName(saved);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Kept as it is typed, so the field is filled in next time even for
  // somebody who looked at the screen and went away again.
  const changeName = (value: string) => {
    setName(value);
    savePlayerName(value);
  };

  // Every choice is kept for next time, whichever way the player goes in.
  const remember = () => {
    savePlayerName(name);
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

      {/* Shown, not offered: the face is picked in the account on the
          start page, but it belongs beside the name you are about to
          join under. */}
      <div className="flex items-end gap-3">
        <StoredAvatarFace />
        {/* Takes the rest of the row, so the field is as wide as it was. */}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">{L.yourName}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => changeName(event.target.value)}
            placeholder={L.namePlaceholder}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div>
          <h2 className="text-sm font-semibold">{L.autoTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {L.autoHint}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {L.tableSize}
          </span>
          {Array.from(
            { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
            (unused, index) => MIN_PLAYERS + index,
          ).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setCount(size)}
              aria-pressed={count === size}
              className={`cursor-pointer rounded-lg border px-3 py-1 font-semibold ${
                count === size
                  ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-950/60"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
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

      <div
        className={`flex flex-col gap-2 rounded-2xl border p-4 ${
          invited
            ? "border-emerald-400 dark:border-emerald-600"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        {/* Somebody who followed a link lands on a screen offering three
            different ways in. This says which one is theirs. */}
        {invited && (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {L.invitedHint}
          </p>
        )}
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
    start({ ...AUTO_MATCH_OPTIONS, autoPlayMs: AUTO_PLAY_MS });
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
              className="flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 pr-2 pl-0.5 text-xs dark:bg-zinc-800"
            >
              <Avatar id={seat.avatar} size={AVATAR_TINY} />
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

/** The waiting room: share the code, see who is in, set the game up and start. */
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
  const [variant, setVariant] = useState<Variant>("standard");
  const [misterX, setMisterX] = useState<MisterXSeat>("host");
  const [name, setName] = useState(MISTER_X_NAMES[0]);
  const computer = misterX === "computer" && seats.length < MAX_PLAYERS;
  const enough = seats.length >= (computer ? 1 : MIN_PLAYERS);
  const setNotice = room.setNotice;
  const who =
    misterX === "computer"
      ? computer
        ? L.misterXComputer
        : (seats[0]?.name ?? "")
      : misterX === "random"
        ? L.misterXRandom
        : (seats[0]?.name ?? "");

  // Tell the guests what the host has set up.
  useEffect(() => {
    if (room.isHost) {
      setNotice(L.notice(variant, who, name));
    }
  }, [room.isHost, setNotice, variant, who, name]);

  return (
    <div className="flex max-w-md flex-col gap-5">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{L.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {L.shareHint}
        </p>
        <ShareRow code={code} texts={L} />
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
              <Avatar id={seat.avatar} size={AVATAR_SEAT} />
              <span>{seat.name}</span>
              {seat.isHost && <Badge>{L.hostBadge}</Badge>}
              {seat.id === room.seatId && <Badge>{L.youBadge}</Badge>}
            </li>
          ))}
        </ul>
      </section>

      {room.isHost ? (
        <>
          <Choices
            title={L.variant}
            hint={VARIANT_HINTS[variant]}
            options={(["standard", "intro"] as const).map((one) => ({
              key: one,
              label: VARIANT_NAMES[one],
              chosen: variant === one,
              onClick: () => setVariant(one),
            }))}
          />
          <Choices
            title={L.misterX}
            hint={
              misterX === "computer" && !computer
                ? L.fullForComputer
                : L.misterXHint
            }
            options={MISTER_X_SEATS.map((one) => ({
              key: one,
              label:
                one === "host"
                  ? L.misterXHost
                  : one === "random"
                    ? L.misterXRandom
                    : L.misterXComputer,
              chosen: misterX === one,
              onClick: () => setMisterX(one),
            }))}
          />
          <Choices
            title={L.name}
            hint=""
            options={MISTER_X_NAMES.map((one) => ({
              key: one,
              label: one,
              chosen: name === one,
              onClick: () => setName(one),
            }))}
          />
          <button
            type="button"
            disabled={!enough}
            data-testid="sy-start"
            onClick={() =>
              room.start({
                variant,
                misterX,
                misterXName: name,
                autoPlayMs: AUTO_PLAY_MS,
              })
            }
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {L.startGame}
          </button>
          {!enough && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {L.needPlayers} {L.needPlayersComputer}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          {room.room?.notice !== undefined && (
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              {room.room.notice}
            </p>
          )}
          <p>{L.waitingForHost}</p>
        </div>
      )}

      <VoiceChat
        gameId={GAME_ID}
        code={code}
        seatId={room.seatId}
        seats={seats}
      />

      <LeaveButton onLeave={onLeave} />
    </div>
  );
}

/** A titled row of option buttons, for the host's setup. */
function Choices({
  title,
  hint,
  options,
}: {
  readonly title: string;
  readonly hint: string;
  readonly options: readonly {
    readonly key: string;
    readonly label: string;
    readonly chosen: boolean;
    readonly onClick: () => void;
  }[];
}): ReactElement {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={option.onClick}
            aria-pressed={option.chosen}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              option.chosen
                ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint !== "" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </section>
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
  const [showHiding, setShowHiding] = useState(false);
  const role = game?.players[mySeat]?.role ?? null;
  const outcome: GameOutcome | null =
    game === null || game.phase !== "over" || role === null
      ? null
      : game.winner === role
        ? "won"
        : "lost";

  return game === null ? (
    <p className="text-sm">{L.connecting}</p>
  ) : (
    <div className="flex flex-col gap-4 2xl:flex-row">
      <GameResultOverlay outcome={outcome} words={RESULT_WORDS} />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {game.phase === "over" && (
          <>
            <ScotlandYardResult
              game={game}
              onNewGame={room.isHost ? room.newRound : null}
            />
            {!room.isHost && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {L.waitingForRematch}
              </p>
            )}
          </>
        )}
        {role === "detectives" && (
          <label className="flex cursor-pointer items-center gap-2 self-start text-xs">
            <input
              type="checkbox"
              checked={showHiding}
              onChange={(event) => setShowHiding(event.target.checked)}
              className="h-4 w-4 accent-purple-600"
            />
            {L.showHiding}
          </label>
        )}
        <ScotlandYardTable
          view={viewFor(game, mySeat >= 0 ? mySeat : null)}
          mine={mySeat >= 0 ? [mySeat] : []}
          showHiding={showHiding}
          onMove={room.sendMove}
        />
      </div>

      <aside className="flex w-full flex-col gap-3 2xl:w-72">
        <LeaveButton onLeave={onLeave} />
        <VoiceChat
          gameId={GAME_ID}
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
  return count === null ? null : (
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
