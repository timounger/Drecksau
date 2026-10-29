/**
 * Weihnachtsmann & Co. KG - the screen around the canvas: header, the animal
 * choice, the Advent calendar, the achievements, the selection bar, the touch
 * controls and the help line.
 *
 * @module
 * @remarks
 * Played by finger, the screen changes shape: upright, the picture spans the
 * width with the stick and the buttons under it; on its side, the stick and
 * the buttons stand left and right of the picture. The canvas element stays
 * the same in every shape - the loop holds on to it.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import {
  useWeihnachtsmannGame,
  type Layout,
} from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import { WM_RULES } from "@/games/weihnachtsmann/i18n/rules";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { AchievementsButton, AchievementsDialog } from "./achievements-panel";
import { AdventProgress } from "./advent-progress";
import { AnimalPicker } from "./animal-picker";
import { CharacterBar } from "./character-bar";
import { VIEW_H, VIEW_W } from "@/games/weihnachtsmann/engine/engine";
import { EnterButton, TouchButtons, TouchStick } from "./touch-pad";

/** Classes of the plain header buttons. */
const BUTTON =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the game screen.
 *
 * @returns the screen
 */
export function WeihnachtsmannGameScreen(): ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(wrapRef);
  const game = useWeihnachtsmannGame(fullscreen.active);
  const { canvasRef, hud, dispatch, layout } = game;
  const touch = layout !== "desktop";
  const landscape = layout === "landscape";
  const scrolledRef = useRef(false);
  const achievementsRef = useRef<HTMLDialogElement>(null);
  const openAchievements = useCallback(() => {
    achievementsRef.current?.showModal();
  }, []);
  const achievementsChip = (
    <AchievementsButton
      hud={hud}
      onOpen={openAchievements}
      compact
      short={touch}
    />
  );

  useEffect(() => {
    // Played by finger, the game should fill the screen from the start; the
    // header stays one swipe up.
    if (touch && !scrolledRef.current && window.scrollY === 0) {
      scrolledRef.current = true;
      // Two frames on, once the loop has given the canvas its new size.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          wrapRef.current?.scrollIntoView({ block: "start" });
        });
      });
    }
  }, [touch]);

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col ${touch ? "max-w-6xl gap-2 px-0 py-2" : "gap-4 p-4"}`}
    >
      <div className={touch ? "px-3" : "contents"}>
        <GameHeader
          title={WM_TEXTS.title}
          subtitle={WM_TEXTS.subtitle}
          rules={WM_RULES}
        >
          <AchievementsButton hud={hud} onOpen={openAchievements} />
          <button
            type="button"
            data-testid="wm-reset"
            title={WM_TEXTS.resetTitle}
            onClick={(event) => {
              game.reset();
              event.currentTarget.blur();
            }}
            className={BUTTON}
          >
            {WM_TEXTS.reset}
          </button>
          {fullscreen.supported && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className={BUTTON}
            >
              {fullscreen.active
                ? WM_TEXTS.fullscreenExit
                : WM_TEXTS.fullscreen}
            </button>
          )}
          <Link href="/weihnachtsmann/statistik" className={BUTTON}>
            {WM_TEXTS.statistics}
          </Link>
        </GameHeader>
      </div>

      <div
        ref={wrapRef}
        data-wm-frame=""
        data-wm-layout={layout}
        onContextMenu={(event) => {
          if (touch) {
            event.preventDefault();
          }
        }}
        className={
          touch
            ? "game-fullscreen flex touch-manipulation flex-col items-center bg-zinc-900 p-1 select-none [-webkit-touch-callout:none] sm:rounded-2xl"
            : "game-fullscreen flex flex-col items-center rounded-2xl bg-zinc-900 p-2 sm:p-3"
        }
      >
        <div className={rowClass(layout)}>
          <div className={`relative w-fit ${rowItemClass(layout, "canvas")}`}>
            <canvas
              ref={canvasRef}
              data-testid="wm-canvas"
              width={VIEW_W}
              height={VIEW_H}
              className="block max-w-full cursor-pointer touch-none [image-rendering:pixelated]"
            />
            {hud.menuCursor !== null && (
              <AnimalPicker
                cursor={hud.menuCursor}
                dispatch={dispatch}
                compact={touch}
              />
            )}
            {touch && hud.entry !== null && hud.inGate === null && (
              <EnterButton entry={hud.entry} onEnter={game.enter} />
            )}
            {fullscreen.active && (
              <button
                type="button"
                onClick={fullscreen.toggle}
                className={`absolute z-40 cursor-pointer rounded-lg bg-black/60 font-medium text-white hover:bg-black/75 ${touch ? "top-1 right-1 px-2 py-1 text-xs" : "top-2 right-2 px-3 py-1.5 text-sm"}`}
              >
                {WM_TEXTS.fullscreenExit}
              </button>
            )}
          </div>
          {touch && (
            <TouchStick
              setTouch={game.setTouch}
              side={landscape}
              below={!landscape}
              className={rowItemClass(layout, "stick")}
            />
          )}
          {touch && (
            <TouchButtons
              hud={hud}
              dispatch={dispatch}
              setTouch={game.setTouch}
              side={landscape}
            />
          )}
        </div>
        {touch ? (
          <>
            {!landscape && hud.inGate !== null && (
              <p className="w-full px-1 pt-1 text-center text-[11px] text-amber-200/80">
                {WM_TEXTS.touchRotate}
              </p>
            )}
            <CharacterBar hud={hud} dispatch={dispatch} compact />
            <AdventProgress hud={hud} compact below={!landscape}>
              {achievementsChip}
            </AdventProgress>
          </>
        ) : (
          <>
            {hud.inGate !== null && (
              <div className="flex w-full items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  data-testid="wm-leave-gate"
                  onClick={(event) => {
                    game.quitGate();
                    // Off the button, or Space would press it again.
                    event.currentTarget.blur();
                  }}
                  className="cursor-pointer rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_3px_0_#7f1d1d] hover:bg-red-500"
                >
                  {WM_TEXTS.leaveGate}
                </button>
                <span className="text-xs text-zinc-400">
                  {WM_TEXTS.leaveGateHint}
                </span>
              </div>
            )}
            <AdventProgress hud={hud}>{achievementsChip}</AdventProgress>
            <CharacterBar hud={hud} dispatch={dispatch} />
          </>
        )}
      </div>

      <AchievementsDialog hud={hud} dialogRef={achievementsRef} />

      <div
        className={`game-hint flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 ${touch ? "mx-3" : ""}`}
      >
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
          {WM_TEXTS.controlsTitle}:
        </span>
        {touch ? (
          <span>{WM_TEXTS.touchHelp}</span>
        ) : (
          <>
            <span>{WM_TEXTS.controlsMove}</span>
            <span>{WM_TEXTS.controlsSwitch}</span>
            <span>{WM_TEXTS.controlsAbility}</span>
            <span>{WM_TEXTS.controlsTransform}</span>
            <span>{WM_TEXTS.controlsTalk}</span>
            <span>{WM_TEXTS.controlsDoor}</span>
            <span>{WM_TEXTS.controlsGate}</span>
            <span>{WM_TEXTS.controlsTouch}</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Classes of the row that holds the picture and, by finger, the controls.
 *
 * @param layout - how the screen is laid out
 * @returns the classes
 */
function rowClass(layout: Layout): string {
  let result: string;
  switch (layout) {
    case "portrait":
      result = "grid w-full grid-cols-2 items-center";
      break;
    case "landscape":
      result = "flex w-full items-stretch justify-center";
      break;
    default:
      // Not there at all: the canvas sits in the frame as it always did.
      result = "contents";
  }
  return result;
}

/**
 * Classes that place one part of the row.
 *
 * @param layout - how the screen is laid out
 * @param part - the picture or the stick
 * @returns the classes
 */
function rowItemClass(layout: Layout, part: "canvas" | "stick"): string {
  let result = "";
  if (layout === "portrait") {
    result =
      part === "canvas"
        ? "col-span-2 justify-self-center"
        : "h-40 w-full rounded-xl bg-zinc-950/40";
  } else if (layout === "landscape") {
    result =
      part === "canvas"
        ? "order-2 self-center"
        : "order-1 w-32 shrink-0 rounded-xl bg-zinc-950/40";
  }
  return result;
}
