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
import { GameHeader } from "@/components/game-header";
import { PANZERKISTE_RULES } from "@/games/panzerkiste/i18n/rules";
import { useRef, type ReactElement } from "react";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";
import {
  usePanzerkiste,
  type Hud,
} from "@/games/panzerkiste/hooks/use-panzerkiste";
import {
  canvasHeight,
  canvasWidth,
} from "@/games/panzerkiste/components/projection";
import {
  FIELD_COLS,
  FIELD_ROWS,
  LEVELS_PER_BONUS,
  totalEnemiesThroughLevel,
} from "@/games/panzerkiste/engine/setup";
import { PANZERKISTE_TEXTS } from "@/games/panzerkiste/i18n/texts";
import { endlessNumber, isEndless } from "@/games/panzerkiste/engine/levels";
import { BannerView } from "@/games/panzerkiste/components/round-banner";
import { Leaderboard } from "@/games/panzerkiste/components/leaderboard";
import { VolumeSlider } from "@/games/panzerkiste/components/volume-slider";

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
    banner,
    start,
    next,
    newMission,
    levelBack,
    levelForward,
    toEndless,
  } = usePanzerkiste();

  const fieldRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(fieldRef);
  useShotRatio(canvasRef, fieldRef);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        rules={PANZERKISTE_RULES}
        title={PANZERKISTE_TEXTS.title}
        subtitle={PANZERKISTE_TEXTS.subtitle}
      >
        <button
          type="button"
          data-testid="pk-new-game"
          onClick={newMission}
          title={PANZERKISTE_TEXTS.newGameTitle}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {PANZERKISTE_TEXTS.newGame}
        </button>
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {fullscreen.active
              ? PANZERKISTE_TEXTS.fullscreenExit
              : PANZERKISTE_TEXTS.fullscreen}
          </button>
        )}
        <Link
          href="/panzerkiste/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {PANZERKISTE_TEXTS.online}
        </Link>
        <Link
          href="/panzerkiste/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {PANZERKISTE_TEXTS.statistics}
        </Link>
      </GameHeader>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Stat>
            {isEndless(hud.level)
              ? PANZERKISTE_TEXTS.arena(endlessNumber(hud.level))
              : PANZERKISTE_TEXTS.level(hud.level + 1)}
          </Stat>
          {hud.wave > 0 && <Stat>{PANZERKISTE_TEXTS.wave(hud.wave)}</Stat>}
          <Stat>{PANZERKISTE_TEXTS.enemiesLeft(hud.enemies)}</Stat>
          <Stat>{PANZERKISTE_TEXTS.lives(hud.lives)}</Stat>
          <Stat>{PANZERKISTE_TEXTS.minesLeft(hud.mines)}</Stat>
        </div>
        {/* Wraps: with the volume slider beside them these three no longer fit
            on one line on the narrowest phones. */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <VolumeSlider />
          <LevelJump
            onClick={levelBack}
            disabled={hud.level === 0}
            title={PANZERKISTE_TEXTS.levelBackTitle}
          >
            {PANZERKISTE_TEXTS.levelBack}
          </LevelJump>
          <LevelJump
            onClick={levelForward}
            disabled={false}
            title={PANZERKISTE_TEXTS.levelForwardTitle}
          >
            {PANZERKISTE_TEXTS.levelForward}
          </LevelJump>
        </div>
      </div>

      <div ref={fieldRef} className="game-fullscreen relative">
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
          onEndless={toEndless}
        />
        <BannerView banner={banner} />
        {fullscreen.active && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
          >
            {PANZERKISTE_TEXTS.fullscreenExit}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
          {PANZERKISTE_TEXTS.controlsTitle}:
        </span>
        <span>{PANZERKISTE_TEXTS.moveKeys}</span>
        <span>{PANZERKISTE_TEXTS.shootKeys}</span>
        <span>{PANZERKISTE_TEXTS.mineKeys}</span>
        <span>{PANZERKISTE_TEXTS.touchControls}</span>
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
  /** Steps past the campaign into the first endless arena. */
  readonly onEndless: () => void;
};

/** The screen shown over the canvas before starting or after a round ends. */
function Overlay({
  hud,
  onStart,
  onNext,
  onRestart,
  onEndless,
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
    // The next level's 1-based number; a multiple of it earns a bonus life.
    const nextNumber = hud.level + 2;
    const bonus = nextNumber % LEVELS_PER_BONUS === 0;
    content = (
      <Panel>
        <p className="text-lg font-semibold">
          {PANZERKISTE_TEXTS.levelCleared}
        </p>
        {bonus && (
          <p className="text-sm font-semibold text-emerald-300">
            {PANZERKISTE_TEXTS.bonusLife}
          </p>
        )}
        <OverlayButton onClick={onNext}>
          {PANZERKISTE_TEXTS.nextLevel}
        </OverlayButton>
      </Panel>
    );
  } else if (hud.phase === "won") {
    // Beating the last level ends the game: congratulate and show the grand total.
    content = (
      <Panel>
        <p className="text-2xl font-bold">
          {"\u{1F3C6}"} {PANZERKISTE_TEXTS.congratulations}
        </p>
        <p className="text-sm text-zinc-200">{PANZERKISTE_TEXTS.won}</p>
        <p className="text-base font-semibold text-emerald-300">
          {PANZERKISTE_TEXTS.destroyedTotal(
            totalEnemiesThroughLevel(hud.level),
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <OverlayButton onClick={onRestart}>
            {PANZERKISTE_TEXTS.playAgain}
          </OverlayButton>
          <OverlayButton onClick={onEndless}>
            {PANZERKISTE_TEXTS.toEndless}
          </OverlayButton>
        </div>
      </Panel>
    );
  } else if (hud.phase === "lost") {
    content = (
      <Panel>
        <p className="text-lg font-semibold">
          {"\u{1F4A5}"} {PANZERKISTE_TEXTS.lost}
        </p>
        {hud.runWave > 0 && (
          <Leaderboard run={{ wave: hud.runWave, fair: hud.fair }} />
        )}
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
