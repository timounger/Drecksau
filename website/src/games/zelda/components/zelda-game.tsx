/**
 * Zelda - the screen around the canvas: header, start and game-over screens,
 * the touch controls and the help line.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useRef, type ReactElement, type ReactNode } from "react";
import { GameHeader } from "@/components/game-header";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import {
  useZeldaGame,
  type ZeldaGame,
} from "@/games/zelda/hooks/use-zelda-game";
import { ZELDA_RULES } from "@/games/zelda/i18n/rules";
import { ZELDA_TEXTS } from "@/games/zelda/i18n/texts";
import { SCREEN_H, SCREEN_W } from "./render";
import { TouchPad } from "./touch-pad";

/** Classes of the plain header buttons. */
const BUTTON =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the game screen.
 *
 * @returns the screen
 */
export function ZeldaGameScreen(): ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(wrapRef);
  const game = useZeldaGame(fullscreen.active);
  const { canvasRef, setTouch } = game;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        title={ZELDA_TEXTS.title}
        subtitle={ZELDA_TEXTS.subtitle}
        rules={ZELDA_RULES}
      >
        <button
          type="button"
          data-testid="zelda-new-game"
          onClick={game.newGame}
          title={ZELDA_TEXTS.newGameTitle}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {ZELDA_TEXTS.newGame}
        </button>
        <button
          type="button"
          data-testid="zelda-cheat"
          aria-pressed={game.cheat}
          title={ZELDA_TEXTS.cheatTitle}
          onClick={(event) => {
            game.toggleCheat();
            // Off the button again, or Space would toggle it instead of
            // swinging the sword.
            event.currentTarget.blur();
          }}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
            game.cheat
              ? "border-pink-500 bg-pink-100 font-semibold text-pink-900 dark:bg-pink-900/40 dark:text-pink-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {ZELDA_TEXTS.cheat}
        </button>
        <button
          type="button"
          data-testid="zelda-mute"
          onClick={game.toggleMute}
          className={BUTTON}
        >
          {game.muted ? ZELDA_TEXTS.soundOn : ZELDA_TEXTS.soundOff}
        </button>
        <button
          type="button"
          data-testid="zelda-graphics"
          aria-pressed={!game.pixel}
          title={ZELDA_TEXTS.graphicsTitle}
          onClick={(event) => {
            game.toggleGraphics();
            event.currentTarget.blur();
          }}
          className={BUTTON}
        >
          {game.pixel ? ZELDA_TEXTS.graphicsPixel : ZELDA_TEXTS.graphicsHd}
        </button>
        {fullscreen.supported && (
          <button type="button" onClick={fullscreen.toggle} className={BUTTON}>
            {fullscreen.active
              ? ZELDA_TEXTS.fullscreenExit
              : ZELDA_TEXTS.fullscreen}
          </button>
        )}
        <Link href="/zelda/statistik" className={BUTTON}>
          {ZELDA_TEXTS.statistics}
        </Link>
      </GameHeader>

      <div
        ref={wrapRef}
        data-zelda-frame=""
        className="game-fullscreen flex flex-col items-center rounded-2xl bg-zinc-900 p-2 sm:p-3"
      >
        <div className="relative w-fit">
          <canvas
            ref={canvasRef}
            data-testid="zelda-canvas"
            width={SCREEN_W}
            height={SCREEN_H}
            className="block max-w-full touch-none [image-rendering:pixelated]"
          />
          <Overlay game={game} />
          {fullscreen.active && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className="absolute top-2 right-2 z-40 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-black/75"
            >
              {ZELDA_TEXTS.fullscreenExit}
            </button>
          )}
        </div>
        <TouchPad setTouch={setTouch} />
      </div>

      <div className="game-hint flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
          {ZELDA_TEXTS.controlsTitle}:
        </span>
        <span>{ZELDA_TEXTS.controlsMove}</span>
        <span>{ZELDA_TEXTS.controlsSword}</span>
        <span>{ZELDA_TEXTS.controlsItem}</span>
        <span>{ZELDA_TEXTS.controlsRoll}</span>
        <span>{ZELDA_TEXTS.controlsMenu}</span>
        <span>{ZELDA_TEXTS.controlsPause}</span>
        <span>{ZELDA_TEXTS.controlsTouch}</span>
      </div>
    </div>
  );
}

/** The start and game-over screens laid over the picture. */
function Overlay({ game }: { readonly game: ZeldaGame }): ReactElement | null {
  let content: ReactElement | null = null;
  if (game.screen === "title") {
    content = (
      <Panel>
        <p className="text-2xl font-bold tracking-wide text-yellow-300 [text-shadow:2px_2px_0_#282038]">
          {ZELDA_TEXTS.title}
        </p>
        <p className="max-w-xs text-sm text-zinc-100">
          {ZELDA_TEXTS.startHint}
        </p>
        {game.hasSave && (
          <p className="text-xs text-emerald-300">{ZELDA_TEXTS.savedHint}</p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <OverlayButton testId="zelda-start" onClick={game.start}>
            {game.hasSave ? ZELDA_TEXTS.resume : ZELDA_TEXTS.start}
          </OverlayButton>
          {game.slotAt !== null && (
            <OverlayButton testId="zelda-title-load" onClick={game.loadGame}>
              {ZELDA_TEXTS.loadGame}
            </OverlayButton>
          )}
        </div>
      </Panel>
    );
  } else if (game.screen === "confirm") {
    const load = game.question === "load";
    content = (
      <Panel>
        <div
          role="alertdialog"
          aria-labelledby="zelda-confirm-title"
          data-testid="zelda-confirm"
          className="flex max-w-xs flex-col items-center gap-3 rounded-xl border-4 border-[#f8f0d0] bg-[#283868] px-5 py-4 shadow-[0_0_0_3px_#282038,0_6px_0_#282038]"
        >
          <p
            id="zelda-confirm-title"
            className="text-xl font-bold text-yellow-300 [text-shadow:2px_2px_0_#282038]"
          >
            {load
              ? ZELDA_TEXTS.confirmLoadTitle
              : ZELDA_TEXTS.confirmNewGameTitle}
          </p>
          <p className="text-sm text-zinc-100">
            {load ? ZELDA_TEXTS.confirmLoad : ZELDA_TEXTS.confirmNewGame}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <OverlayButton testId="zelda-confirm-yes" onClick={game.confirm}>
              {load
                ? ZELDA_TEXTS.confirmLoadYes
                : ZELDA_TEXTS.confirmNewGameYes}
            </OverlayButton>
            <OverlayButton
              testId="zelda-confirm-no"
              onClick={game.cancel}
              quiet
            >
              {ZELDA_TEXTS.cancel}
            </OverlayButton>
          </div>
        </div>
      </Panel>
    );
  } else if (game.screen === "paused") {
    content = (
      <Panel>
        <p className="text-3xl font-bold tracking-wide text-yellow-300 [text-shadow:2px_2px_0_#282038]">
          {ZELDA_TEXTS.pause}
        </p>
        <div className="flex flex-col gap-2">
          <OverlayButton testId="zelda-resume" onClick={game.resumeGame}>
            {ZELDA_TEXTS.resume}
          </OverlayButton>
          <OverlayButton testId="zelda-save" onClick={game.saveGame}>
            {ZELDA_TEXTS.saveGame}
          </OverlayButton>
          <OverlayButton
            testId="zelda-load"
            onClick={game.loadGame}
            disabled={game.slotAt === null}
          >
            {ZELDA_TEXTS.loadGame}
          </OverlayButton>
          <OverlayButton testId="zelda-pause-restart" onClick={game.newGame}>
            {ZELDA_TEXTS.restart}
          </OverlayButton>
        </div>
        <p className="text-xs text-emerald-300">
          {game.slotAt === null
            ? ZELDA_TEXTS.noSlot
            : `${ZELDA_TEXTS.savedAt} ${new Date(game.slotAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}`}
        </p>
        <p className="max-w-xs text-xs text-zinc-300">
          {ZELDA_TEXTS.pauseHint}
        </p>
      </Panel>
    );
  } else if (game.screen === "gameover") {
    content = (
      <Panel>
        <p className="text-3xl font-bold text-red-400 [text-shadow:2px_2px_0_#282038]">
          {ZELDA_TEXTS.gameOver}
        </p>
        <p className="text-sm text-zinc-100">{ZELDA_TEXTS.gameOverHint}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <OverlayButton testId="zelda-continue" onClick={game.continueGame}>
            {ZELDA_TEXTS.continueGame}
          </OverlayButton>
          <OverlayButton testId="zelda-restart" onClick={game.newGame}>
            {ZELDA_TEXTS.restart}
          </OverlayButton>
        </div>
      </Panel>
    );
  }
  return content;
}

/** A dimmed panel over the picture. */
function Panel({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/60 p-4 text-center">
      {children}
    </div>
  );
}

/** A big button on an overlay. */
function OverlayButton({
  testId,
  onClick,
  disabled = false,
  quiet = false,
  children,
}: {
  readonly testId: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  /** A grey button for the harmless choice, like cancel. */
  readonly quiet?: boolean;
  readonly children: string;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${quiet ? "bg-zinc-600 shadow-[0_3px_0_#27272a] hover:bg-zinc-500" : "bg-emerald-600 shadow-[0_3px_0_#065f46] hover:bg-emerald-500 disabled:hover:bg-emerald-600"}`}
    >
      {children}
    </button>
  );
}
