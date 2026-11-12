/**
 * Wurfduell online: the entry screen, the waiting rooms and the duel itself.
 *
 * @module
 * @remarks
 * Turn-based, so it runs on the shared online layer like the card games:
 * {@link useOnlineRoom} keeps the room, elects a new host if the old one
 * leaves and plays a seat whose player dropped out. The host referees every
 * throw with the engine; this screen only shows what the room hands back and
 * replays each throw in the arena.
 *
 * Two ways in, as everywhere in the collection: "Gegner finden" pairs two
 * strangers automatically, and a private room has a four-letter code to pass
 * on. A room is always exactly two.
 */
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { RulesButton } from "@/components/rules-button";
import { characterById } from "@/games/wurfduell/engine/characters";
import type {
  CharacterId,
  DuelGame,
  DuelMove,
  ThrowInput,
} from "@/games/wurfduell/engine/types";
import {
  wurfduellAdapter,
  type DuelOptions,
} from "@/games/wurfduell/multiplayer/adapter";
import { WURFDUELL_RULES } from "@/games/wurfduell/i18n/rules";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import { lastCharacterSetting } from "@/games/wurfduell/settings/preferences";
import {
  updateDuelStats,
  withMatch,
  withThrow,
} from "@/games/wurfduell/stats/duel-stats";
import type { GameId } from "@/games/registry";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
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
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/online/room-code";
import { ShareRow, invitedCode } from "@/online/room-invite";
import { turnKeyOf } from "@/online/room";
import { TurnClock, useTurnClock } from "@/online/turn-clock";
import { useOnlineCount } from "@/online/use-online-presence";
import {
  useOnlineRoom,
  type OnlineRoom,
  type OnlineSession,
} from "@/online/use-online-room";
import { Avatar } from "@/online/avatar";
import { StoredAvatarFace } from "@/online/player-avatar";
import { VoiceChat } from "@/online/voice-chat";
import { ArenaView } from "./arena-view";
import { CharacterPicker } from "./character-picker";
import { MatchOverPanel } from "./match-over-panel";
import { FighterPortrait } from "./portraits";
import { useGameSound } from "./wurfduell-game";

/** German labels for the online screen. */
const L = {
  title: `${T.title} online`,
  subtitle: "Zwei Geräte, ein Duell - abwechselnd werfen",
  back: "Zurück",
  yourName: "Dein Name",
  namePlaceholder: "z. B. Alex",
  autoTitle: "Zufälliger Gegner",
  autoHint: "Wir suchen jemanden, der gerade auch ein Duell sucht.",
  autoMatch: "Gegner finden",
  searching: "Suche Gegner …",
  orDivider: "oder",
  createRoom: "Privaten Raum erstellen",
  roomCode: "Raumcode",
  codePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  connecting: "Verbinde …",
  lobbyTitle: "Privater Raum",
  shareHint: "Teile den Code mit deinem Gegner.",
  players: "Im Raum",
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  invitedHint: "Du wurdest herausgefordert - Namen eintragen und beitreten.",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Duell starten",
  needPlayers: "Warte auf deinen Gegner …",
  waitingForHost: "Warte, bis der Host das Duell startet …",
  cancelSearch: "Suche abbrechen",
  leaveRoom: "Raum verlassen",
  online: (n: number) => `${n} online`,
  startsNow: "Gegner gefunden - los geht's!",
  opponentGone:
    "Dein Gegner ist weg - der Computer wirft für ihn (schwach), bis er zurück ist.",
  opponentLeftOver: "Dein Gegner hat den Raum verlassen.",
  waitingPick: "Warte auf die Wahl deines Gegners …",
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

/** This game's id, for presence and matchmaking. */
const GAME_ID = wurfduellAdapter.gameId;

/** This game, for the shared statistics. */
const STATS_ID: GameId = "wurfduell";

/**
 * How long a player may aim before a weak throw is made for them.
 *
 * @remarks
 * Counted from the moment the turn begins, which includes the few seconds the
 * other side's throw is still flying on screen - so it is a little longer than
 * the twenty seconds a throw really needs.
 */
const AUTO_PLAY_MS = 25_000;

/** How often the open room's matchmaking entry is kept alive, in ms. */
const HEARTBEAT_MS = 10_000;

/** How often a lone waiting host looks for a room to merge into, in ms. */
const RELAX_TICK_MS = 4_000;

/** The size of a face beside a name. */
const AVATAR_SIZE = 22;

/** Two to a duel - there is nothing else to agree on. */
const DUEL_WISH: Wish = { count: 2, expansion: false, defense: false };

/** The type the room hook hands back. */
type Room = OnlineRoom<DuelGame, DuelMove, DuelOptions>;

/**
 * Renders the whole online mode.
 *
 * @returns the online element
 */
export function WurfduellOnlineScreen(): ReactElement {
  const onlineCount = useOnlineCount(GAME_ID);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [auto, setAuto] = useState<Match | null>(null);
  const room = useOnlineRoom(wurfduellAdapter, session);

  const leave = useCallback(() => {
    if (auto?.mode === "host") {
      void clearMatch(database(), GAME_ID, auto.code);
    }
    setAuto(null);
    setSession(null);
  }, [auto]);

  const startAuto = useCallback(async (name: string) => {
    const found = await findMatch(database(), GAME_ID, DUEL_WISH, Date.now());
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
        <SearchingLobby room={room} match={auto} onHop={hop} onCancel={leave} />
      ) : (
        <Lobby room={room} code={session.code} onLeave={leave} />
      );
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
          <RulesButton rules={WURFDUELL_RULES} />
          <Link
            href="/wurfduell"
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

/** The first screen: a name, then find a stranger, host or join. */
function Entry({
  onStart,
  onAutoMatch,
  onlineCount,
}: {
  readonly onStart: (session: OnlineSession) => void;
  readonly onAutoMatch: (name: string) => Promise<void>;
  readonly onlineCount: number | null;
}): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [invited, setInvited] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time prefill from storage and URL */
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

  const changeName = (value: string) => {
    setName(value);
    savePlayerName(value);
  };
  const host = () => {
    savePlayerName(name);
    onStart({ mode: "host", code: generateRoomCode(), name });
  };
  const join = () => {
    const clean = normalizeRoomCode(code);
    if (isValidRoomCode(clean)) {
      savePlayerName(name);
      onStart({ mode: "guest", code: clean, name });
    }
  };
  const autoMatch = () => {
    savePlayerName(name);
    setSearching(true);
    void onAutoMatch(name).catch(() => setSearching(false));
  };

  return (
    <div className="flex max-w-md flex-col gap-5">
      <OnlineCountBadge count={onlineCount} />
      <div className="flex items-end gap-3">
        <StoredAvatarFace />
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">{L.yourName}</span>
          <input
            type="text"
            data-testid="wd-online-name"
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
        <button
          type="button"
          data-testid="wd-auto-match"
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
        data-testid="wd-create-room"
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
        {invited && (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {L.invitedHint}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{L.roomCode}</span>
          <input
            type="text"
            data-testid="wd-room-code"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder={L.codePlaceholder}
            maxLength={4}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono tracking-widest uppercase dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="button"
          data-testid="wd-join-room"
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

/** The automatic search: waits for a second player, then starts by itself. */
function SearchingLobby({
  room,
  match,
  onHop,
  onCancel,
}: {
  readonly room: Room;
  readonly match: Match;
  readonly onHop: (code: string) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const isHost = room.isHost;
  const seats = room.room?.seats ?? [];
  const here = seats.length;
  const full = here >= wurfduellAdapter.maxPlayers;
  const startedRef = useRef(false);
  const start = room.start;

  // Advertise the open room and keep the entry alive while waiting.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isHost) {
      const db = database();
      const announce = () =>
        void hostEntry(db, GAME_ID, match.code, DUEL_WISH, Date.now());
      announce();
      timer = setInterval(announce, HEARTBEAT_MS);
    }
    return () => {
      clearInterval(timer);
      if (isHost) {
        void clearMatch(database(), GAME_ID, match.code);
      }
    };
  }, [isHost, match.code]);

  // Alone in the room: look for another open one to merge into.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isHost && here <= 1) {
      const db = database();
      const tick = async () => {
        const target = await relaxMatch(
          db,
          GAME_ID,
          DUEL_WISH,
          match.code,
          Date.now(),
          true,
        );
        if (target !== null && !startedRef.current) {
          await clearMatch(db, GAME_ID, match.code);
          onHop(target);
        }
      };
      void tick();
      timer = setInterval(() => void tick(), RELAX_TICK_MS);
    }
    return () => clearInterval(timer);
  }, [isHost, here, match.code, onHop]);

  useEffect(() => {
    if (isHost && full && !startedRef.current) {
      startedRef.current = true;
      void clearMatch(database(), GAME_ID, match.code);
      start({ autoPlayMs: AUTO_PLAY_MS });
    }
  }, [isHost, full, match.code, start]);

  return (
    <div className="flex max-w-md flex-col gap-5" data-testid="wd-searching">
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
        />
        <h2 className="text-lg font-semibold">{L.searching}</h2>
        <SeatList room={room} />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {full ? L.startsNow : L.needPlayers}
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

/** The private waiting room: share the code, then start. */
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
  const full = seats.length >= wurfduellAdapter.minPlayers;
  return (
    <div className="flex max-w-md flex-col gap-5" data-testid="wd-lobby">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{L.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {L.shareHint}
        </p>
        <ShareRow code={code} texts={L} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{L.players}</h2>
        <SeatList room={room} />
      </section>
      {room.isHost ? (
        <button
          type="button"
          data-testid="wd-start-duel"
          disabled={!full}
          onClick={() => room.start({ autoPlayMs: AUTO_PLAY_MS })}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {full ? L.startGame : L.needPlayers}
        </button>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {L.waitingForHost}
        </p>
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

/** Who is in the room. */
function SeatList({ room }: { readonly room: Room }): ReactElement {
  const seats = room.room?.seats ?? [];
  return (
    <ul className="flex flex-col gap-1 self-stretch">
      {seats.map((seat) => (
        <li
          key={seat.id}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
        >
          <Avatar id={seat.avatar} size={AVATAR_SIZE} />
          <span>{seat.name}</span>
          {seat.isHost && <Badge>{L.hostBadge}</Badge>}
          {seat.id === room.seatId && <Badge>{L.youBadge}</Badge>}
        </li>
      ))}
    </ul>
  );
}

/** The running duel: choosing, throwing, and the end. */
function Playing({
  room,
  onLeave,
}: {
  readonly room: Room;
  readonly onLeave: () => void;
}): ReactElement {
  const game = room.room?.game ?? null;
  const seats = room.room?.seats;
  const mySeat = (seats ?? []).findIndex((seat) => seat.id === room.seatId);
  const names = useMemo(() => (seats ?? []).map((seat) => seat.name), [seats]);
  const botSeatIds = room.room?.botSeatIds ?? [];
  const opponent = seats?.[1 - mySeat];
  const opponentGone =
    opponent !== undefined && botSeatIds.includes(opponent.id);
  const sound = useGameSound();
  const [settledId, setSettledId] = useState(0);
  const remainingMs = useTurnClock({
    autoPlayMs: room.room?.autoPlayMs ?? null,
    turn: room.room === null ? "" : turnKeyOf(room.room, wurfduellAdapter),
    running: game !== null && game.phase !== "over",
  });

  useOnlineStats(game, mySeat);

  const send = room.sendMove;
  const onThrow = useCallback(
    (input: ThrowInput) => send({ kind: "throw", ...input }),
    [send],
  );

  let body: ReactElement = <p className="text-sm">{L.connecting}</p>;
  if (game !== null && mySeat >= 0 && game.phase === "pick") {
    body = (
      <OnlinePick
        game={game}
        mySeat={mySeat}
        names={names}
        onPick={(character) => {
          sound.play("pick");
          send({ kind: "pick", character });
        }}
      />
    );
  } else if (game !== null && mySeat >= 0) {
    const settled = settledId === (game.lastThrow?.id ?? 0);
    const me = game.players[mySeat];
    const them = game.players[1 - mySeat];
    let note: string | null = null;
    if (opponentGone) {
      note = L.opponentLeftOver;
    } else if (them.rematch && !me.rematch) {
      note = T.rematchWanted(names[1 - mySeat] ?? "");
    }
    body = (
      <>
        <ArenaView
          game={game}
          names={names}
          controlSeat={mySeat}
          onThrow={onThrow}
          sound={sound}
          onSettled={setSettledId}
          onResign={() => send({ kind: "resign" })}
          extra={
            game.phase === "throw" ? (
              <TurnClock remainingMs={remainingMs} />
            ) : null
          }
          overlay={
            game.phase === "over" && settled ? (
              <MatchOverPanel
                game={game}
                names={names}
                viewer={mySeat}
                onRematch={() => send({ kind: "rematch" })}
                rematchLabel={me.rematch ? T.rematchWaiting : T.rematch}
                waiting={me.rematch || opponentGone}
                note={note}
                onLeave={onLeave}
                leaveLabel={L.leaveRoom}
              />
            ) : null
          }
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {opponentGone && game?.phase !== "over" && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            {L.opponentGone}
          </p>
        )}
        {body}
      </div>
      <aside className="flex w-full flex-col gap-3 lg:w-72">
        <LeaveButton onLeave={onLeave} />
        <VoiceChat
          gameId={GAME_ID}
          code={room.room?.code ?? ""}
          seatId={room.seatId}
          seats={seats ?? []}
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

/** Choosing a fighter, with the opponent's choice in sight. */
function OnlinePick({
  game,
  mySeat,
  names,
  onPick,
}: {
  readonly game: DuelGame;
  readonly mySeat: number;
  readonly names: readonly string[];
  readonly onPick: (character: CharacterId) => void;
}): ReactElement {
  const [chosen, setChosen] = useState<CharacterId | null>(null);
  const remembered = lastCharacterSetting.getSnapshot();
  const selected = chosen ?? remembered;
  const mine = game.players[mySeat].character;
  const theirs = game.players[1 - mySeat].character;
  const opponentName = names[1 - mySeat] ?? "";

  const opponent = (
    <div
      data-testid="wd-opponent-pick"
      className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-800"
    >
      <span className="font-medium">{opponentName}:</span>
      {theirs === null ? (
        <span className="text-zinc-500">{T.choosing}</span>
      ) : (
        <>
          <FighterPortrait
            character={theirs}
            facing={-1}
            className="h-10 w-8"
          />
          <span>{characterById(theirs).name}</span>
        </>
      )}
    </div>
  );

  return mine === null ? (
    <CharacterPicker
      title={T.pickTitle}
      selected={selected}
      onSelect={setChosen}
      onConfirm={() => {
        lastCharacterSetting.save(selected);
        onPick(selected);
      }}
      aside={opponent}
    />
  ) : (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <FighterPortrait character={mine} className="h-28 w-24" />
          <span className="text-sm font-semibold">
            {characterById(mine).name}
          </span>
        </div>
        <span className="text-2xl font-black">VS</span>
        {opponent}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {L.waitingPick}
      </p>
    </section>
  );
}

/**
 * Books this player's online throws and matches into the statistics.
 *
 * @remarks
 * Every client books only its own seat, once per throw and once per match -
 * the keys remember what was booked, so a re-render or a fresh snapshot of the
 * same state never counts anything twice.
 */
function useOnlineStats(game: DuelGame | null, mySeat: number): void {
  const booked = useRef(new Set<string>());
  const startedAt = useRef(0);
  useEffect(() => {
    if (game !== null && mySeat >= 0) {
      const now = Date.now();
      const round = `${game.seed}-${game.round}`;
      if (game.phase !== "pick" && !booked.current.has(`start-${round}`)) {
        booked.current.add(`start-${round}`);
        startedAt.current = now;
        recordGameStarted(STATS_ID, now);
      }
      const record = game.lastThrow;
      if (
        record !== null &&
        record.by === mySeat &&
        !booked.current.has(`throw-${round}-${record.id}`)
      ) {
        booked.current.add(`throw-${round}-${record.id}`);
        updateDuelStats((stats) =>
          withThrow(
            stats,
            record.damage,
            record.best === "head",
            record.input.ability,
          ),
        );
      }
      const me = game.players[mySeat];
      if (
        game.phase === "over" &&
        me.character !== null &&
        booked.current.has(`start-${round}`) &&
        !booked.current.has(`end-${round}`)
      ) {
        booked.current.add(`end-${round}`);
        const won = game.winner === mySeat;
        const character = me.character;
        recordGameFinished(STATS_ID, {
          won,
          durationMs: now - startedAt.current,
          finishedAt: now,
        });
        recordPlayTime(STATS_ID, now - startedAt.current, now);
        updateDuelStats((stats) =>
          withMatch(stats, character, won, me.hp === me.maxHp),
        );
      }
    }
  }, [game, mySeat]);
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
      data-testid="wd-leave-room"
      onClick={onLeave}
      className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {L.leaveRoom}
    </button>
  );
}
