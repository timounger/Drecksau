/**
 * Panzerkiste - a top-down tank game on a canvas.
 *
 * @module
 * @remarks
 * The simulation and rendering live in the engine and {@link ./render}; this
 * component only lays out the canvas, the heads-up display and the overlays, and
 * wires them to {@link usePanzerkiste}.
 */
"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import {
  usePanzerkiste,
  type Hud,
} from "@/games/panzerkiste/hooks/use-panzerkiste";
import {
  canvasHeight,
  canvasWidth,
} from "@/games/panzerkiste/components/projection";
import { FIELD_COLS, FIELD_ROWS } from "@/games/panzerkiste/engine/setup";
import { PANZERKISTE_TEXTS } from "@/games/panzerkiste/i18n/texts";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** Intrinsic canvas size of the tilted field (fixed, so it prerenders stable). */
const CANVAS_W = Math.round(canvasWidth(FIELD_COLS + 2));
const CANVAS_H = Math.round(canvasHeight(FIELD_ROWS + 2));

/**
 * Renders the Panzerkiste game screen.
 *
 * @returns the game element
 */
export function PanzerkisteGame(): ReactElement {
  const {
    canvasRef,
    hud,
    start,
    next,
    newMission,
    levelBack,
    levelForward,
    levelCount,
  } = usePanzerkiste();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{PANZERKISTE_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {PANZERKISTE_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.title}
        </Link>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Stat>{PANZERKISTE_TEXTS.level(hud.level + 1)}</Stat>
          <Stat>{PANZERKISTE_TEXTS.enemiesLeft(hud.enemies)}</Stat>
          <Stat>{PANZERKISTE_TEXTS.lives(hud.lives)}</Stat>
          <Stat>{PANZERKISTE_TEXTS.minesLeft(hud.mines)}</Stat>
        </div>
        <div className="flex items-center gap-2">
          <LevelJump
            onClick={levelBack}
            disabled={hud.level === 0}
            title={PANZERKISTE_TEXTS.levelBackTitle}
          >
            {PANZERKISTE_TEXTS.levelBack}
          </LevelJump>
          <LevelJump
            onClick={levelForward}
            disabled={hud.level >= levelCount - 1}
            title={PANZERKISTE_TEXTS.levelForwardTitle}
          >
            {PANZERKISTE_TEXTS.levelForward}
          </LevelJump>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          data-testid="panzerkiste-canvas"
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full cursor-none touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700"
        />
        <Overlay
          hud={hud}
          onStart={start}
          onNext={next}
          onRestart={newMission}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
          {PANZERKISTE_TEXTS.controlsTitle}:
        </span>
        <span>{PANZERKISTE_TEXTS.moveKeys}</span>
        <span>{PANZERKISTE_TEXTS.shootKeys}</span>
        <span>{PANZERKISTE_TEXTS.mineKeys}</span>
      </div>
    </div>
  );
}

/** One heads-up value pill. */
function Stat({ children }: { children: string }): ReactElement {
  return (
    <span className="rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 font-medium tabular-nums dark:border-zinc-800 dark:bg-zinc-900/40">
      {children}
    </span>
  );
}

/** Props of {@link LevelJump}. */
type LevelJumpProps = {
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly title: string;
  readonly children: string;
};

/** A button above the field that jumps straight to an adjacent level. */
function LevelJump({
  onClick,
  disabled,
  title,
  children,
}: LevelJumpProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-lg border border-zinc-300 px-3 py-1 font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

/** Props of {@link Overlay}. */
type OverlayProps = {
  readonly hud: Hud;
  readonly onStart: () => void;
  readonly onNext: () => void;
  readonly onRestart: () => void;
};

/** The screen shown over the canvas before starting or after a round ends. */
function Overlay({
  hud,
  onStart,
  onNext,
  onRestart,
}: OverlayProps): ReactElement | null {
  let content: ReactElement | null = null;

  if (!hud.running && hud.phase === "playing") {
    // The whole overlay starts the game, so a click anywhere on the field works.
    content = (
      <button
        type="button"
        onClick={onStart}
        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-900/70 p-4 text-center text-white"
      >
        <span className="text-lg font-semibold">{PANZERKISTE_TEXTS.title}</span>
        <span className="text-sm text-zinc-200">
          {PANZERKISTE_TEXTS.startHint}
        </span>
        <span className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold">
          {PANZERKISTE_TEXTS.start}
        </span>
      </button>
    );
  } else if (hud.phase === "cleared") {
    content = (
      <Panel>
        <p className="text-lg font-semibold">
          {PANZERKISTE_TEXTS.levelCleared}
        </p>
        <OverlayButton onClick={onNext}>
          {PANZERKISTE_TEXTS.nextLevel}
        </OverlayButton>
      </Panel>
    );
  } else if (hud.phase === "won") {
    content = (
      <Panel>
        <p className="text-lg font-semibold">
          {"\u{1F3C6}"} {PANZERKISTE_TEXTS.won}
        </p>
        <OverlayButton onClick={onRestart}>
          {PANZERKISTE_TEXTS.playAgain}
        </OverlayButton>
      </Panel>
    );
  } else if (hud.phase === "lost") {
    content = (
      <Panel>
        <p className="text-lg font-semibold">
          {"\u{1F4A5}"} {PANZERKISTE_TEXTS.lost}
        </p>
        <OverlayButton onClick={onRestart}>
          {PANZERKISTE_TEXTS.playAgain}
        </OverlayButton>
      </Panel>
    );
  }

  return content;
}

/** A centred, dimmed panel over the canvas. */
function Panel({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-900/70 p-4 text-center text-white">
      {children}
    </div>
  );
}

/** A prominent overlay action button. */
function OverlayButton({
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
      className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      {children}
    </button>
  );
}
