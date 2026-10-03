/**
 * Der Endlosmodus zu zweit: Eingang, Warteraum und der Lauf selbst.
 *
 * @module
 * @remarks
 * Derselbe Weg hinein wie bei der Panzerkiste, weil er dort funktioniert:
 * "Mitspieler finden" stellt zwei Fremde zusammen, "Raum erstellen" und
 * "Raum beitreten" machen einen privaten Raum mit Code auf. Sind beide da,
 * beginnt der Host den Lauf, und von da an fahren zwei Boote auf derselben
 * Karte.
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
import { UBOOT_RULES } from "@/games/uboot/i18n/rules";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import { DEEP_VIEW_H, DEEP_VIEW_W } from "@/games/uboot/endless/render";
import { UBOOT_GAME_ID } from "@/games/uboot/multiplayer/net";
import {
  useUbootOnline,
  type DeepSession,
  type UbootOnline as DeepRoom,
} from "@/games/uboot/hooks/use-uboot-online";
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
import { StoredAvatarFace } from "@/online/player-avatar";
import { loadPlayerName, savePlayerName } from "@/online/player-name";
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/online/room-code";
import { ShareRow, invitedCode } from "@/online/room-invite";
import { useOnlineCount } from "@/online/use-online-presence";
import { VoiceChat } from "@/online/voice-chat";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";

/** Alles, was dieser Bildschirm sagt. */
const T = {
  title: "U-Boot online",
  subtitle: "Zu zweit in den Schlund, so tief wie es geht",
  backToGame: "Zurück zum Spiel",
  yourName: "Dein Name",
  yourNamePlaceholder: "z. B. Tiefseetaucher",
  autoTitle: "Automatisch matchen",
  autoHint: "Wir suchen dir jemanden, der mit hinunter will.",
  autoMatch: "Mitspieler finden",
  searching: "Suche Mitspieler …",
  orDivider: "oder",
  createRoom: "Raum erstellen",
  roomCode: "Raumcode",
  invitedHint: "Du wurdest eingeladen - Namen eintragen und beitreten.",
  roomCodePlaceholder: "ABCD",
  joinRoom: "Raum beitreten",
  connecting: "Verbinde …",
  lobbyTitle: "Privater Raum",
  shareHint: "Teile den Code mit deinem Mitfahrer.",
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  players: "Spieler",
  hostBadge: "Host",
  youBadge: "Du",
  startGame: "Ablegen",
  needPartner: "Warte auf den zweiten Spieler …",
  waitingForHost: "Warte auf den Host …",
  waitingForPartner: "Warte auf einen Mitfahrer …",
  almostReady: "Gleich geht's los …",
  cancelSearch: "Suche abbrechen",
  playersHere: (many: number) => `${many} im Raum`,
  leave: "Raum verlassen",
  failed: "Verbindung fehlgeschlagen.",
  hostLeftNotice:
    "Verlässt der Host den Raum, endet der Lauf - der Rechner des Hosts führt ihn.",
  onlineNow: (many: number) => `${many} gerade online`,
  controlsHint:
    "W A S D steuern - links ist links, das Boot dreht sich. Linksklick zielt und feuert, Rechtsklick legt eine Seemine.",
  newRun: "Neuer Lauf",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild beenden",
} as const;

/** Die Texte des Chats. */
const CHAT_TEXTS: OnlineChatTexts = {
  chatTitle: "Chat",
  chatEmpty: "Noch keine Nachrichten.",
  chatYou: "Du",
  chatPlaceholder: "Nachricht …",
  chatSend: "Senden",
  chatNewest: "neu",
};

/** Koop will genau zwei; alles andere bleibt aus. */
const COOP_WISH: Wish = { count: 2, expansion: false, defense: false };

/** Wie oft ein offener Raum sich am Leben hält, in Millisekunden. */
const HEARTBEAT_MS = 10_000;

/** Wie lange nur genau passende Räume zusammengelegt werden. */
const RELAX_MS = 12_000;

/** Und wie oft ein wartender Host sich nach einem anderen Raum umsieht. */
const RELAX_TICK_MS = 4_000;

/** Wie groß ein Gesicht neben einem Namen ist. */
const AVATAR_SEAT = 22;
const AVATAR_TINY = 16;

/** Wie breit der Luftbalken höchstens ist. */
const FULL = 100;

/**
 * Zeichnet den ganzen Onlinemodus, vom Eintreten bis zum Tauchen.
 *
 * @returns den Bildschirm
 */
export function UbootOnline(): ReactElement {
  const onlineCount = useOnlineCount(UBOOT_GAME_ID);
  const [session, setSession] = useState<DeepSession | null>(null);
  const [auto, setAuto] = useState<Match | null>(null);
  const room = useUbootOnline(session);

  const leave = useCallback(() => {
    if (auto?.mode === "host") {
      void clearMatch(database(), UBOOT_GAME_ID, auto.code);
    }
    setAuto(null);
    setSession(null);
  }, [auto]);

  const startAuto = useCallback(async (name: string) => {
    const found = await findMatch(
      database(),
      UBOOT_GAME_ID,
      COOP_WISH,
      Date.now(),
    );
    setAuto(found);
    setSession({ mode: found.mode, code: found.code, name });
  }, []);

  const startPrivate = useCallback((next: DeepSession) => {
    setAuto(null);
    setSession(next);
  }, []);

  const hop = useCallback((code: string) => {
    setAuto({ code, mode: "guest" });
    setSession((prev) =>
      prev === null ? prev : { ...prev, mode: "guest", code },
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
    body = (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{T.failed}</p>
        <LeaveButton onLeave={leave} />
      </div>
    );
  } else if (room.status === "connecting") {
    body = <p className="text-sm">{T.connecting}</p>;
  } else if (room.status === "lobby") {
    body =
      auto !== null ? (
        <Searching
          room={room}
          match={auto}
          onlineCount={onlineCount}
          onHop={hop}
          onCancel={leave}
        />
      ) : (
        <Lobby room={room} code={session.code} onLeave={leave} />
      );
  } else {
    body = <Diving room={room} code={session.code} onLeave={leave} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{T.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RulesButton rules={UBOOT_RULES} />
          <Link
            href="/uboot"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {T.backToGame}
          </Link>
        </div>
      </header>
      {body}
    </div>
  );
}

/** Props of {@link Entry}. */
type EntryProps = {
  readonly onStart: (session: DeepSession) => void;
  readonly onAutoMatch: (name: string) => Promise<void>;
  readonly onlineCount: number | null;
};

/** Der erste Bildschirm: Name, dann matchen, aufmachen oder beitreten. */
function Entry({
  onStart,
  onAutoMatch,
  onlineCount,
}: EntryProps): ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [invited, setInvited] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Vorbelegung aus Speicher und Link */
    const saved = loadPlayerName().trim();
    if (saved.length > 0) {
      setName(saved);
    }
    const fromLink = invitedCode();
    if (fromLink !== "") {
      setCode(fromLink);
      setInvited(true);
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
    <div className="flex max-w-md flex-col gap-6">
      {onlineCount !== null && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.onlineNow(onlineCount)}
        </p>
      )}

      <div className="flex items-end gap-3">
        <StoredAvatarFace />
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">{T.yourName}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => changeName(event.target.value)}
            placeholder={T.yourNamePlaceholder}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div>
          <h2 className="text-sm font-semibold">{T.autoTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.autoHint}
          </p>
        </div>
        <button
          type="button"
          data-testid="uboot-online-auto"
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
        data-testid="uboot-online-host"
        onClick={host}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {T.createRoom}
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
            {T.invitedHint}
          </p>
        )}
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
          data-testid="uboot-online-join"
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

/** Props of {@link Lobby}. */
type LobbyProps = {
  readonly room: DeepRoom;
  readonly code: string;
  readonly onLeave: () => void;
};

/** Der private Warteraum: Code teilen, sehen wer da ist, ablegen. */
function Lobby({ room, code, onLeave }: LobbyProps): ReactElement {
  const enough = room.seats.length >= 2;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{T.lobbyTitle}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.shareHint}
        </p>
        <div className="flex items-center gap-3">
          <ShareRow code={code} texts={T} />
        </div>
      </section>

      <SeatList room={room} />

      {room.isHost ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            data-testid="uboot-online-start"
            disabled={!enough}
            onClick={room.start}
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

      <VoiceChat
        gameId={UBOOT_GAME_ID}
        code={code}
        seatId={room.seatId}
        seats={room.seats}
      />
      <LeaveButton onLeave={onLeave} />
    </div>
  );
}

/** Wer im Raum ist. */
function SeatList({ room }: { readonly room: DeepRoom }): ReactElement {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {T.players} ({room.seats.length})
      </h2>
      <ul className="flex flex-col gap-1">
        {room.seats.map((seat) => (
          <li
            key={seat.id}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <Avatar id={seat.avatar} size={AVATAR_SEAT} />
            <span>{seat.name}</span>
            {seat.isHost && <Badge>{T.hostBadge}</Badge>}
            {seat.id === room.seatId && <Badge>{T.youBadge}</Badge>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Props of {@link Searching}. */
type SearchingProps = {
  readonly room: DeepRoom;
  readonly match: Match;
  readonly onlineCount: number | null;
  readonly onHop: (code: string) => void;
  readonly onCancel: () => void;
};

/** Die Suche: stellt zwei zusammen und legt von allein ab. */
function Searching({
  room,
  match,
  onlineCount,
  onHop,
  onCancel,
}: SearchingProps): ReactElement {
  const isHost = room.isHost;
  const seats = room.seats.length;
  const enough = seats >= 2;
  const startedRef = useRef(false);
  const start = room.start;

  const startNow = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void clearMatch(database(), UBOOT_GAME_ID, match.code);
    start();
  }, [match.code, start]);

  // Der Host hält seinen offenen Raum am Leben, solange er wartet.
  useEffect(() => {
    if (!isHost) {
      return;
    }
    const db = database();
    const timer = setInterval(
      () => void hostEntry(db, UBOOT_GAME_ID, match.code, COOP_WISH, Date.now()),
      HEARTBEAT_MS,
    );
    return () => clearInterval(timer);
  }, [isHost, match.code]);

  useEffect(() => {
    if (!isHost) {
      return;
    }
    return () => void clearMatch(database(), UBOOT_GAME_ID, match.code);
  }, [isHost, match.code]);

  // Zwei, die gleichzeitig einen Raum aufmachen, finden sich sonst nie.
  useEffect(() => {
    if (!isHost || seats > 1) {
      return;
    }
    const db = database();
    const started = Date.now();
    const tick = async () => {
      const target = await relaxMatch(
        db,
        UBOOT_GAME_ID,
        COOP_WISH,
        match.code,
        Date.now(),
        Date.now() - started > RELAX_MS,
      );
      if (target !== null && !startedRef.current) {
        await clearMatch(db, UBOOT_GAME_ID, match.code);
        onHop(target);
      }
    };
    const timer = setInterval(() => void tick(), RELAX_TICK_MS);
    return () => clearInterval(timer);
  }, [isHost, seats, match.code, onHop]);

  useEffect(() => {
    if (isHost && enough) {
      startNow();
    }
  }, [isHost, enough, startNow]);

  return (
    <div className="flex max-w-md flex-col gap-6">
      {onlineCount !== null && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.onlineNow(onlineCount)}
        </p>
      )}
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
          {room.seats.map((seat) => (
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

/** Props of {@link Diving}. */
type DivingProps = {
  readonly room: DeepRoom;
  readonly code: string;
  readonly onLeave: () => void;
};

/** Der laufende Tauchgang: Leinwand, Anzeige, Chat. */
function Diving({ room, code, onLeave }: DivingProps): ReactElement {
  const { hud, canvasRef, messages, seatId, seats, sendChat } = room;
  const fieldRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(fieldRef);
  useShotRatio(canvasRef, fieldRef);
  const air = Math.round((hud.air / hud.airMax) * FULL);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-zinc-600 dark:text-zinc-300">
          <span data-testid="uboot-online-stage">
            {UBOOT_TEXTS.deepStage(hud.stage)}
          </span>
          <span>{UBOOT_TEXTS.deepLeft(hud.beasts)}</span>
          <span>{UBOOT_TEXTS.deepKills(hud.kills)}</span>
          <span>
            {"\u{1F6E1}"} {hud.hull} / {hud.hullMax}
          </span>
          <span className="inline-block h-1.5 w-20 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-700">
            <span
              className="block h-full rounded bg-sky-400"
              style={{ width: `${air}%` }}
            />
          </span>
        </div>
        <div className="flex items-center gap-2">
          {room.isHost && hud.phase === "over" && (
            <button
              type="button"
              data-testid="uboot-online-again"
              onClick={room.again}
              className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              {T.newRun}
            </button>
          )}
          {fullscreen.supported && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {fullscreen.active ? T.fullscreenExit : T.fullscreen}
            </button>
          )}
          <LeaveButton onLeave={onLeave} />
        </div>
      </div>

      <div ref={fieldRef} className="game-fullscreen relative w-full">
        <canvas
          ref={canvasRef}
          data-testid="uboot-online-canvas"
          width={DEEP_VIEW_W}
          height={DEEP_VIEW_H}
          className="w-full touch-none rounded-xl border border-zinc-300 dark:border-zinc-700"
        />
        {hud.phase === "waiting" && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white drop-shadow">
            {UBOOT_TEXTS.deepStart}
          </p>
        )}
        {hud.phase === "cleared" && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-bold text-white drop-shadow">
            {UBOOT_TEXTS.deepCleared(hud.stage)}
          </p>
        )}
        {hud.imDown && hud.phase !== "over" && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-lg font-semibold text-white drop-shadow">
            {UBOOT_TEXTS.deepWaitingPartner}
          </p>
        )}
        {!hud.imDown && hud.partnerDown && hud.phase !== "over" && (
          <p className="pointer-events-none absolute inset-x-0 top-14 text-center text-sm font-medium text-amber-200 drop-shadow">
            {UBOOT_TEXTS.deepDown}
          </p>
        )}
        {hud.phase === "over" && (
          <div
            data-testid="uboot-online-over"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-xl bg-red-950/70 text-center text-white"
          >
            <p className="text-2xl font-bold">{UBOOT_TEXTS.deepOver}</p>
            <p className="text-sm">
              {UBOOT_TEXTS.deepReached(hud.stage, hud.kills)}
            </p>
          </div>
        )}
        {fullscreen.active && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
          >
            {T.fullscreenExit}
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.controlsHint}
      </p>

      <VoiceChat
        gameId={UBOOT_GAME_ID}
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

/** Ein kleiner Aufkleber an einem Namen. */
function Badge({ children }: { readonly children: string }): ReactElement {
  return (
    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
      {children}
    </span>
  );
}

/** Der Knopf, der aus dem Raum führt. */
function LeaveButton({
  onLeave,
}: {
  readonly onLeave: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onLeave}
      className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {T.leave}
    </button>
  );
}
