/**
 * The running Krakel Orakel board: my own canvas while everyone draws, then all
 * the open boards next to the word list the team strikes words off.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { OnlineChat, type OnlineChatTexts } from "@/online/online-chat";
import {
  DRAW_SECONDS,
  ELIMINATE_SECONDS,
  PALETTE,
  PEN_WIDTHS,
  REVEAL_SECONDS,
  type KrakelPhase,
} from "@/games/krakel/engine/types";
import { teamRating } from "@/games/krakel/engine/scoring";
import type {
  KrakelBoardView,
  KrakelOnline,
  KrakelPen,
  KrakelTools,
  KrakelView,
  KrakelWordView,
} from "@/games/krakel/hooks/use-krakel-online";

/** German labels for the board. */
const T = {
  round: (n: number, total: number) => `Runde ${n}/${total}`,
  loading: "Runde wird ausgeteilt …",
  yourWord: "Dein Begriff",
  drawHint: "Alle malen gleichzeitig - niemand sieht deine Tafel.",
  onlyOnLines: "Du kannst nur auf den vorgegebenen Linien zeichnen.",
  undo: "Zurück",
  clear: "Leeren",
  imDone: "Fertig",
  waitingReady: (a: number, b: number) => `${a}/${b} sind fertig`,
  doneHint: "Warte, bis die anderen fertig sind …",
  boardsTitle: "Alle Tafeln",
  wordsTitle: "Welches Wort wurde nicht gemalt?",
  yourTurn: "Du bist dran - streiche ein Wort!",
  othersTurn: (name: string) => `${name} ist dran …`,
  struckOf: (a: number, b: number) => `${a}/${b} gestrichen`,
  wasDecoy: (name: string) => `${name} - richtig, niemand hat es gemalt`,
  wasReal: (name: string) => `${name} - falsch, das wurde gemalt!`,
  myWordBadge: "dein Wort",
  teamScore: "Teampunkte",
  roundScore: "Diese Runde",
  revealTitle: "Auflösung",
  finalTitle: "Spiel vorbei!",
  finalScore: (score: number, best: number) => `${score} von ${best} Punkten`,
  newGame: "Neues Spiel",
  waitHost: "Warte auf den Host …",
  seconds: (n: number) => `${n}s`,
} as const;

/** Labels the shared feed needs, in German. */
const CHAT_TEXTS: OnlineChatTexts = {
  chatTitle: "Beratung",
  chatEmpty: "Besprecht euch - ihr spielt gemeinsam.",
  chatYou: "Du",
  chatPlaceholder: "Nachricht schreiben …",
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
 * @returns the board element, or a hint while the first round is dealt
 */
export function KrakelBoard({
  online,
}: {
  online: KrakelOnline;
}): ReactElement {
  const {
    view,
    drawCanvasRef,
    boardCanvasRef,
    pen,
    tools,
    messages,
    seatId,
    exclude,
    sendMessage,
    isHost,
    newGame,
  } = online;

  let stage: ReactElement;
  if (view === null) {
    stage = <p className="text-sm">{T.loading}</p>;
  } else if (view.phase === "drawing") {
    stage = (
      <DrawStage
        view={view}
        canvasRef={drawCanvasRef}
        pen={pen}
        tools={tools}
      />
    );
  } else {
    stage = (
      <OpenStage
        view={view}
        boardCanvasRef={boardCanvasRef}
        onExclude={exclude}
        isHost={isHost}
        onNewGame={newGame}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-3">{stage}</div>

      <aside className="flex w-full flex-col gap-3 lg:w-80">
        {view !== null && <Status view={view} />}
        {view !== null && <TeamScore view={view} />}
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

/** While everyone draws: my own canvas, my word and my pen. */
function DrawStage({
  view,
  canvasRef,
  pen,
  tools,
}: {
  readonly view: KrakelView;
  readonly canvasRef: KrakelOnline["drawCanvasRef"];
  readonly pen: KrakelPen;
  readonly tools: KrakelTools;
}): ReactElement {
  return (
    <>
      <WordBanner label={T.yourWord} word={view.myWord ?? "…"} />
      <canvas
        ref={canvasRef}
        data-testid="krakel-canvas"
        {...pen}
        className={`aspect-[960/669] w-full touch-none rounded-xl border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 ${
          view.iAmReady ? "opacity-60" : ""
        }`}
      />
      {view.iAmReady ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-center text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          {"✅"} {T.doneHint}
        </p>
      ) : (
        <Toolbar tools={tools} />
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.drawHint} {T.waitingReady(view.readyCount, view.boards.length)}
      </p>
    </>
  );
}

/** Once the boards are open: every drawing, plus the word list. */
function OpenStage({
  view,
  boardCanvasRef,
  onExclude,
  isHost,
  onNewGame,
}: {
  readonly view: KrakelView;
  readonly boardCanvasRef: KrakelOnline["boardCanvasRef"];
  readonly onExclude: (word: string) => void;
  readonly isHost: boolean;
  readonly onNewGame: () => void;
}): ReactElement {
  return (
    <div className="relative flex flex-col gap-3">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{T.boardsTitle}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {view.boards.map((board) => (
            <BoardCard
              key={board.seatId}
              board={board}
              canvasRef={boardCanvasRef}
            />
          ))}
        </div>
      </section>
      <WordList view={view} onExclude={onExclude} />
      {view.phase === "over" && (
        <OverPanel view={view} isHost={isHost} onNewGame={onNewGame} />
      )}
    </div>
  );
}

/** One player's open board. */
function BoardCard({
  board,
  canvasRef,
}: {
  readonly board: KrakelBoardView;
  readonly canvasRef: KrakelOnline["boardCanvasRef"];
}): ReactElement {
  return (
    <figure
      className={`flex flex-col gap-1 rounded-xl border p-2 ${
        board.isMe
          ? "border-indigo-400 dark:border-indigo-600"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <canvas
        ref={canvasRef}
        data-krakel-seat={board.seatId}
        data-testid={`krakel-board-${board.seatId}`}
        className="aspect-[960/669] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
      />
      <figcaption className="flex items-center gap-2 text-xs">
        <span className="flex-1 truncate font-medium">{board.name}</span>
        {board.term !== null && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
            {board.term}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** The round's word list, with the struck words marked right or wrong. */
function WordList({
  view,
  onExclude,
}: {
  readonly view: KrakelView;
  readonly onExclude: (word: string) => void;
}): ReactElement {
  const picking = view.phase === "eliminating";
  let turnLine: string;
  if (!picking) {
    turnLine = T.revealTitle;
  } else if (view.iAmPicker) {
    turnLine = T.yourTurn;
  } else {
    turnLine = T.othersTurn(view.pickerName ?? "");
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{T.wordsTitle}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.struckOf(view.struckCount, view.toStrike)}
        </span>
      </div>
      <p
        className={`text-sm font-medium ${
          view.iAmPicker && picking
            ? "text-indigo-700 dark:text-indigo-300"
            : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {turnLine}
      </p>
      <ul className="flex flex-wrap gap-2">
        {view.words.map((word) => (
          <li key={word.word}>
            <WordChip
              word={word}
              canPick={picking && view.iAmPicker}
              onExclude={onExclude}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One word on the list: strikeable, or struck and judged. */
function WordChip({
  word,
  canPick,
  onExclude,
}: {
  readonly word: KrakelWordView;
  readonly canPick: boolean;
  readonly onExclude: (word: string) => void;
}): ReactElement {
  let chip: ReactElement;
  if (word.struck) {
    const decoy = word.wasDecoy === true;
    chip = (
      <span
        title={
          decoy ? T.wasDecoy(word.byName ?? "") : T.wasReal(word.byName ?? "")
        }
        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm line-through ${
          decoy
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        }`}
      >
        <span aria-hidden>{decoy ? "✅" : "❌"}</span>
        {word.word}
      </span>
    );
  } else if (canPick) {
    chip = (
      <button
        type="button"
        onClick={() => onExclude(word.word)}
        className="cursor-pointer rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium hover:border-indigo-500 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-zinc-900 dark:hover:bg-indigo-950/40"
      >
        {word.word}
        {word.isMine && <MyWordBadge />}
      </button>
    );
  } else {
    chip = (
      <span className="flex items-center rounded-full border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
        {word.word}
        {word.isMine && <MyWordBadge />}
      </span>
    );
  }
  return chip;
}

/** Marks the word I drew myself - only ever shown in my own list. */
function MyWordBadge(): ReactElement {
  return (
    <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
      {T.myWordBadge}
    </span>
  );
}

/** The round number and the countdown bar for the current phase. */
function Status({ view }: { view: KrakelView }): ReactElement {
  const seconds = useCountdown(view.deadline);
  const full = phaseSeconds(view.phase);
  const fraction = Math.max(0, Math.min(1, seconds / full));

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">
          {T.round(view.round, view.totalRounds)}
        </span>
        {view.phase !== "over" && (
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
            {T.seconds(seconds)}
          </span>
        )}
      </div>
      {view.phase !== "over" && (
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-[width] duration-200"
            style={{ width: `${fraction * PERCENT}%` }}
          />
        </div>
      )}
    </section>
  );
}

/** The one score the whole team shares. */
function TeamScore({ view }: { view: KrakelView }): ReactElement {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 text-center dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
        {T.teamScore}
      </span>
      <p data-testid="krakel-score" className="text-3xl font-bold tabular-nums">
        {view.score}
      </p>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.roundScore}: {signed(view.roundScore)}
      </span>
    </section>
  );
}

/** My secret word, shown large while I draw it. */
function WordBanner({
  label,
  word,
}: {
  readonly label: string;
  readonly word: string;
}): ReactElement {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 text-center dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
        {label}
      </span>
      <p data-testid="krakel-word" className="text-2xl font-bold tracking-wide">
        {word}
      </p>
    </section>
  );
}

/** The player's colour, width, undo, clear and finished controls. */
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
        <button
          type="button"
          onClick={tools.ready}
          className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {T.imDone}
        </button>
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

/** The end-of-game overlay with the team's final score. */
function OverPanel({
  view,
  isHost,
  onNewGame,
}: {
  readonly view: KrakelView;
  readonly isHost: boolean;
  readonly onNewGame: () => void;
}): ReactElement {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/70 p-6 text-center text-white">
      <p className="text-2xl font-bold">{T.finalTitle}</p>
      <p className="text-4xl font-bold tabular-nums text-amber-300">
        {view.score}
      </p>
      <p className="text-sm text-zinc-200">
        {T.finalScore(view.score, view.bestPossible)}
      </p>
      <p className="text-lg font-semibold text-amber-200">
        {teamRating(view.score)}
      </p>
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

/** How long the current phase runs in full, for the countdown bar. */
function phaseSeconds(phase: KrakelPhase): number {
  let seconds: number;
  switch (phase) {
    case "drawing":
      seconds = DRAW_SECONDS;
      break;
    case "eliminating":
      seconds = ELIMINATE_SECONDS;
      break;
    default:
      seconds = REVEAL_SECONDS;
  }
  return seconds;
}

/** Formats a round score with an explicit sign, so a loss reads as one. */
function signed(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
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
