/**
 * The running Krakel Orakel board: the canvas, the drawer's tools, the word or
 * hint, the timer, the scoreboard and the guess/chat feed.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { OnlineChat, type OnlineChatTexts } from "@/online/online-chat";
import {
  DRAW_SECONDS,
  PALETTE,
  PEN_WIDTHS,
  REVEAL_SECONDS,
} from "@/games/krakel/engine/types";
import type {
  KrakelOnline,
  KrakelPlayer,
  KrakelTools,
  KrakelView,
} from "@/games/krakel/hooks/use-krakel-online";

/** German labels for the board. */
const T = {
  round: (n: number, total: number) => `Runde ${n}/${total}`,
  drawsYou: "Du zeichnest",
  draws: (name: string) => `${name} zeichnet`,
  yourWord: "Dein Begriff",
  solutionWas: "Die Lösung",
  guessedIt: "Erraten!",
  waitOthers: "Warte, bis die anderen geraten haben.",
  letters: (n: number) => `${n} Buchstaben`,
  guessedOf: (a: number, b: number) => `${a}/${b} erraten`,
  undo: "Zurück",
  clear: "Leeren",
  onlyOnLines: "Du kannst nur auf den vorgegebenen Linien zeichnen.",
  scoreboard: "Punkte",
  finalTitle: "Spiel vorbei!",
  winner: (name: string) => `${name} gewinnt!`,
  tie: "Unentschieden!",
  newGame: "Neues Spiel",
  waitHost: "Warte auf den Host …",
  seconds: (n: number) => `${n}s`,
} as const;

/** Labels the shared feed needs, in German. */
const CHAT_TEXTS: OnlineChatTexts = {
  chatTitle: "Raten & Chat",
  chatEmpty: "Tippe deinen Tipp ein …",
  chatYou: "Du",
  chatPlaceholder: "Begriff raten oder chatten …",
  chatSend: "Senden",
  chatNewest: "neu",
};

/** How often the countdown re-reads the clock, in milliseconds. */
const TICK_MS = 250;

/** Milliseconds in a second, for the countdown. */
const MS_PER_SECOND = 1000;

/** Scales a 0..1 fraction to a CSS percentage. */
const PERCENT = 100;

/** Pen-preview dot size: the smallest, and how much each step grows, in px. */
const DOT_BASE_PX = 6;
const DOT_STEP_PX = 4;

/**
 * Renders the playing board.
 *
 * @param props - the live online session
 * @returns the board element, or a hint while the first round loads
 */
export function KrakelBoard({
  online,
}: {
  online: KrakelOnline;
}): ReactElement {
  const {
    view,
    canvasRef,
    tools,
    messages,
    seatId,
    sendMessage,
    isHost,
    newGame,
  } = online;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            data-testid="krakel-canvas"
            className="aspect-[3/2] w-full touch-none rounded-xl border border-zinc-300 bg-white shadow-sm dark:border-zinc-700"
          />
          {view !== null && view.phase === "over" && (
            <OverPanel view={view} isHost={isHost} onNewGame={newGame} />
          )}
        </div>
        {view !== null && view.iAmDrawer && view.phase === "drawing" && (
          <Toolbar tools={tools} />
        )}
      </div>

      <aside className="flex w-full flex-col gap-3 lg:w-80">
        {view !== null && <Status view={view} />}
        {view !== null && <WordBar view={view} />}
        {view !== null && <Scoreboard players={view.players} />}
        <OnlineChat
          messages={messages}
          ownSeatId={seatId}
          onSend={sendMessage}
          texts={CHAT_TEXTS}
        />
      </aside>
    </div>
  );
}

/** The round number, who is drawing and the countdown bar. */
function Status({ view }: { view: KrakelView }): ReactElement {
  const seconds = useCountdown(view.deadline);
  const full = view.phase === "drawing" ? DRAW_SECONDS : REVEAL_SECONDS;
  const fraction = Math.max(0, Math.min(1, seconds / full));

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">
          {T.round(view.round, view.totalRounds)}
        </span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {T.seconds(seconds)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-[width] duration-200"
          style={{ width: `${fraction * PERCENT}%` }}
        />
      </div>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">
        {view.iAmDrawer ? T.drawsYou : T.draws(view.drawerName)}
      </span>
    </section>
  );
}

/** The drawer's word, the revealed answer, or the masked hint for guessers. */
function WordBar({ view }: { view: KrakelView }): ReactElement {
  let label: string;
  let value: ReactElement;
  if (view.phase === "reveal") {
    label = T.solutionWas;
    value = <BigWord text={view.word ?? ""} />;
  } else if (view.iAmDrawer) {
    label = T.yourWord;
    value = <BigWord text={view.word ?? "…"} />;
  } else if (view.canGuess) {
    label = T.letters(view.termLength);
    value = <Masked length={view.termLength} />;
  } else {
    label = T.guessedIt;
    value = (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
        {"✅"} {T.waitOthers}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 text-center dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
        {label}
      </span>
      {value}
      {(view.phase === "drawing" || view.phase === "reveal") && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.guessedOf(view.guessedCount, view.guessersTotal)}
        </span>
      )}
    </section>
  );
}

/** A word shown large. */
function BigWord({ text }: { text: string }): ReactElement {
  return (
    <p data-testid="krakel-word" className="text-2xl font-bold tracking-wide">
      {text}
    </p>
  );
}

/** A row of underscores standing in for the hidden word. */
function Masked({ length }: { length: number }): ReactElement {
  return (
    <p className="text-2xl font-bold tracking-[0.3em] text-zinc-400">
      {"_ ".repeat(length).trim()}
    </p>
  );
}

/** The drawer's colour, width, undo and clear controls. */
function Toolbar({ tools }: { tools: KrakelTools }): ReactElement {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            onClick={() => tools.setColor(swatch)}
            className={`h-7 w-7 rounded-full border-2 ${
              tools.color === swatch
                ? "border-indigo-500 ring-2 ring-indigo-300"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {PEN_WIDTHS.map((penWidth, index) => (
          <button
            key={penWidth}
            type="button"
            aria-label={`Stift ${index + 1}`}
            onClick={() => tools.setWidth(penWidth)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              tools.width === penWidth
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            <span
              className="rounded-full bg-zinc-800 dark:bg-zinc-200"
              style={{
                width: `${DOT_BASE_PX + index * DOT_STEP_PX}px`,
                height: `${DOT_BASE_PX + index * DOT_STEP_PX}px`,
              }}
            />
          </button>
        ))}
      </div>
      <div className="ml-auto flex gap-2">
        <ToolButton onClick={tools.undo}>{T.undo}</ToolButton>
        <ToolButton onClick={tools.clear}>{T.clear}</ToolButton>
      </div>
      <p className="w-full text-xs text-zinc-500 dark:text-zinc-400">
        {"✏️"} {T.onlyOnLines}
      </p>
    </section>
  );
}

/** A small secondary button in the toolbar. */
function ToolButton({
  onClick,
  children,
}: {
  readonly onClick: () => void;
  readonly children: string;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

/** The running scoreboard. */
function Scoreboard({
  players,
}: {
  players: readonly KrakelPlayer[];
}): ReactElement {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <h2 className="text-sm font-semibold">{T.scoreboard}</h2>
      <ul className="flex flex-col gap-1">
        {players.map((player) => (
          <li
            key={player.seatId}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
              player.isMe ? "bg-indigo-50 dark:bg-indigo-950/30" : ""
            }`}
          >
            <span>
              {player.isDrawer ? "✏️" : player.hasGuessed ? "✅" : "•"}
            </span>
            <span className="flex-1 truncate">{player.name}</span>
            <span className="font-semibold tabular-nums">{player.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The end-of-game overlay with the final standings. */
function OverPanel({
  view,
  isHost,
  onNewGame,
}: {
  readonly view: KrakelView;
  readonly isHost: boolean;
  readonly onNewGame: () => void;
}): ReactElement {
  const top = view.players[0];
  const tie = view.players.length > 1 && view.players[1].score === top?.score;
  const heading = top === undefined ? T.tie : tie ? T.tie : T.winner(top.name);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/60 p-6 text-center text-white">
      <p className="text-2xl font-bold">{T.finalTitle}</p>
      <p className="text-lg text-amber-300">{heading}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {view.players.map((player, index) => (
          <li key={player.seatId} className="tabular-nums">
            {index + 1}. {player.name} - {player.score}
          </li>
        ))}
      </ul>
      {isHost ? (
        <button
          type="button"
          onClick={onNewGame}
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
        >
          {T.newGame}
        </button>
      ) : (
        <p className="text-sm text-zinc-300">{T.waitHost}</p>
      )}
    </div>
  );
}

/** Seconds left until a deadline, refreshed a few times a second. */
function useCountdown(deadline: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.ceil((deadline - now) / MS_PER_SECOND));
}
