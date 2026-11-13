/**
 * Frost Fortress on screen: the map in the middle, resources on top, the
 * build menu on the left, the info panel on the right and time, waves and
 * research at the bottom.
 *
 * @module
 * @remarks
 * The map is a canvas; everything one reads or clicks is DOM laid over it.
 * On a narrow screen the two side panels fold away behind buttons, so the
 * map keeps most of the room.
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactElement } from "react";
import type { StructureKind } from "@/games/frost-fortress/engine/types";
import { GameHeader } from "@/components/game-header";
import {
  RESOURCE_NAMES,
  FROST_TEXTS as T,
} from "@/games/frost-fortress/i18n/texts";
import { FROST_RULES } from "@/games/frost-fortress/i18n/rules";
import { useFrostGame } from "@/games/frost-fortress/hooks/use-frost-game";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { BottomBar } from "./bottom-bar";
import { BuildMenu } from "./build-menu";
import { InfoPanel } from "./info-panel";
import { ResearchDialog } from "./research-dialog";
import { TopBar } from "./top-bar";

/** Below this width (px) the side panels start folded. */
const NARROW = 900;

/** Milliseconds a toast stays. */
const TOAST_MS = 2200;

/**
 * Renders the game.
 *
 * @returns the screen
 */
export function FrostGame(): ReactElement {
  const {
    autoExplore,
    beginMove,
    callAllies,
    callEnemies,
    cancel,
    canvasRef,
    choose,
    explore,
    game,
    load,
    manualSavedAt,
    moving,
    newGame,
    paused,
    placing,
    placingLevel,
    remove,
    repairEverything,
    repairOne,
    research,
    save,
    selected,
    sendWave,
    setSpeed,
    toggleCheat,
    speed,
    stopResearch,
    toast,
    togglePause,
    trade,
    upgrade,
  } = useFrostGame();
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [researchOpen, setResearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the kind of pointer is only known in the browser
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    if (window.innerWidth < NARROW) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (toast !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a toast shows and hides itself
      setToastVisible(true);
      const timer = window.setTimeout(() => setToastVisible(false), TOAST_MS);
      cleanup = () => window.clearTimeout(timer);
    }
    return cleanup;
  }, [toast]);

  // On a phone, choosing something to build folds the menu so the map is free.
  const pick = (kind: StructureKind | null, level: number) => {
    choose(kind, level);
    if (window.innerWidth < NARROW) {
      setLeftOpen(false);
    }
  };

  const toastText =
    toast?.text === "saved"
      ? T.saved
      : toast?.text === "loaded"
        ? T.loaded
        : (toast?.text ?? "");

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-3 p-3">
      <GameHeader rules={FROST_RULES} title={T.title} subtitle={T.tagline}>
        <button
          type="button"
          data-testid="ff-cheat"
          aria-pressed={game?.cheat === true}
          disabled={game === null || game.over}
          title={game?.cheat === true ? T.cheatOff : T.cheatOn}
          onClick={(event) => {
            toggleCheat();
            // Off the button again, or Space would toggle it instead of pausing.
            event.currentTarget.blur();
          }}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
            game?.cheat === true
              ? "border-pink-500 bg-pink-100 font-semibold text-pink-900 dark:bg-pink-900/40 dark:text-pink-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {T.cheat}
        </button>
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {T.fullscreen}
          </button>
        )}
        <Link
          href="/frost-fortress/einstellungen"
          data-testid="ff-settings-link"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.settings}
        </Link>
        <Link
          href="/frost-fortress/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.statistics}
        </Link>
      </GameHeader>

      <div
        ref={stageRef}
        data-testid="ff-stage"
        data-structures={game?.structures.length ?? 0}
        className={`relative select-none overflow-hidden bg-slate-900 text-slate-100 ${
          fullscreen.active
            ? "h-dvh w-full"
            : "h-[calc(100dvh-14.5rem)] min-h-[440px] rounded-2xl ring-1 ring-slate-700 sm:h-[calc(100dvh-8.5rem)]"
        }`}
      >
        <canvas
          ref={canvasRef}
          data-testid="ff-canvas"
          className={`absolute inset-0 h-full w-full touch-none ${placing !== null || moving !== 0 ? "cursor-crosshair" : "cursor-default"}`}
        />
        {game !== null && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950/70 to-transparent [&>*]:pointer-events-auto">
              <TopBar game={game} />
            </div>

            <aside
              data-testid="ff-build-panel"
              className={`absolute bottom-[146px] left-1.5 top-[58px] z-10 w-60 max-w-[calc(100%-12px)] overflow-hidden rounded-xl bg-slate-950/90 ring-1 ring-white/10 transition-transform sm:bottom-[52px] ${
                leftOpen ? "translate-x-0" : "-translate-x-[110%]"
              }`}
            >
              <BuildMenu
                game={game}
                placing={placing}
                placingLevel={placingLevel}
                onChoose={pick}
              />
            </aside>
            <button
              type="button"
              data-testid="ff-toggle-build"
              onClick={() => setLeftOpen((open) => !open)}
              aria-expanded={leftOpen}
              className={`absolute top-[64px] z-20 cursor-pointer rounded-r-lg bg-slate-800/90 px-1.5 py-3 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-slate-700 ${
                leftOpen ? "left-[246px]" : "left-0"
              }`}
              title={T.basePanel}
            >
              {leftOpen ? "◀" : `\u{1F3D7}️ ${T.basePanel}`}
            </button>

            <aside
              data-testid="ff-info-panel"
              className={`absolute bottom-[146px] right-1.5 top-[58px] z-10 w-64 max-w-[calc(100%-12px)] overflow-hidden rounded-xl bg-slate-950/90 ring-1 ring-white/10 transition-transform sm:bottom-[52px] ${
                rightOpen || selected !== 0
                  ? "translate-x-0"
                  : "translate-x-[110%]"
              }`}
            >
              <InfoPanel
                game={game}
                selected={selected}
                moving={moving}
                actions={{
                  upgrade: upgrade,
                  repair: repairOne,
                  repairAll: repairEverything,
                  remove: remove,
                  move: beginMove,
                  explore: explore,
                  autoExplore: autoExplore,
                  openResearch: () => setResearchOpen(true),
                  callEnemies: callEnemies,
                  callAllies: callAllies,
                }}
              />
            </aside>
            <button
              type="button"
              data-testid="ff-toggle-info"
              onClick={() => {
                if (selected !== 0) {
                  cancel();
                  setRightOpen(false);
                } else {
                  setRightOpen((open) => !open);
                }
              }}
              className={`absolute top-[64px] z-20 cursor-pointer rounded-l-lg bg-slate-800/90 px-1.5 py-3 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-slate-700 ${
                rightOpen || selected !== 0 ? "right-[262px]" : "right-0"
              }`}
              title={T.infoPanel}
            >
              {rightOpen || selected !== 0 ? "▶" : `ℹ️ ${T.infoPanel}`}
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/70 to-transparent [&>*]:pointer-events-auto">
              <BottomBar
                game={game}
                speed={speed}
                paused={paused}
                actions={{
                  setSpeed: setSpeed,
                  togglePause: togglePause,
                  sendWave: sendWave,
                  openResearch: () => setResearchOpen(true),
                  openMenu: () => setMenuOpen(true),
                }}
              />
            </div>

            {(placing !== null || moving !== 0) && (
              <div className="absolute left-1/2 top-[62px] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/85 px-3 py-1 text-xs text-slate-100 ring-1 ring-amber-400/50">
                <span>
                  {moving !== 0
                    ? T.moveHint
                    : coarse
                      ? T.touchHint
                      : T.controlsHint}
                </span>
                <button
                  type="button"
                  data-testid="ff-cancel"
                  onClick={cancel}
                  className="cursor-pointer rounded-full bg-slate-700 px-2 py-0.5 font-bold hover:bg-slate-600"
                >
                  {"✕"}
                </button>
              </div>
            )}

            {game.offer !== null && (
              <div
                data-testid="ff-offer"
                className="absolute left-1/2 top-[100px] z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-xl bg-amber-950/90 px-4 py-2 text-xs text-amber-50 ring-1 ring-amber-400/60"
              >
                <strong>
                  {T.offerTitle} ({Math.ceil(game.offer.left)} s)
                </strong>
                <span>
                  {T.offer(
                    `${game.offer.giveAmount} ${RESOURCE_NAMES[game.offer.give]}`,
                    `${game.offer.getAmount} ${RESOURCE_NAMES[game.offer.get]}`,
                  )}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    data-testid="ff-offer-accept"
                    disabled={game.res[game.offer.give] < game.offer.giveAmount}
                    onClick={() => trade(true)}
                    className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1 font-bold hover:bg-emerald-500 disabled:opacity-40"
                  >
                    {T.accept}
                  </button>
                  <button
                    type="button"
                    data-testid="ff-offer-decline"
                    onClick={() => trade(false)}
                    className="cursor-pointer rounded-md bg-slate-700 px-3 py-1 font-bold hover:bg-slate-600"
                  >
                    {T.decline}
                  </button>
                </span>
              </div>
            )}

            {toastVisible && toastText !== "" && (
              <div
                data-testid="ff-toast"
                className="absolute left-1/2 top-1/3 z-30 -translate-x-1/2 rounded-xl bg-emerald-700/95 px-4 py-2 text-sm font-bold text-white shadow-lg"
              >
                {toastText}
              </div>
            )}

            {researchOpen && (
              <ResearchDialog
                game={game}
                onStart={research}
                onCancel={stopResearch}
                onClose={() => setResearchOpen(false)}
              />
            )}

            {menuOpen && (
              <GameMenu
                savedAt={manualSavedAt}
                onSave={() => {
                  save();
                  setMenuOpen(false);
                }}
                onLoad={() => {
                  load();
                  setMenuOpen(false);
                }}
                onNew={() => {
                  if (window.confirm(T.newGameConfirm)) {
                    newGame();
                    setMenuOpen(false);
                  }
                }}
                onClose={() => setMenuOpen(false)}
              />
            )}

            {game.over && (
              <div
                data-testid="ff-game-over"
                className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4"
              >
                <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-slate-900 p-5 text-center ring-1 ring-red-500/50">
                  <span className="text-4xl" aria-hidden="true">
                    {"❄️"}
                  </span>
                  <h2 className="text-lg font-bold text-red-300">
                    {T.gameOverTitle}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {T.gameOverText(game.wave.number, game.stats.kills)}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      data-testid="ff-game-over-new"
                      onClick={newGame}
                      className="cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500"
                    >
                      {T.gameOverNew}
                    </button>
                    {manualSavedAt !== null && (
                      <button
                        type="button"
                        onClick={load}
                        className="cursor-pointer rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-600"
                      >
                        {T.gameOverLoad}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** The menu: save, load, new game. */
function GameMenu({
  savedAt,
  onSave,
  onLoad,
  onNew,
  onClose,
}: {
  readonly savedAt: number | null;
  readonly onSave: () => void;
  readonly onLoad: () => void;
  readonly onNew: () => void;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={T.menu}
      data-testid="ff-menu-dialog"
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-slate-900 p-4 ring-1 ring-white/15"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-bold">{T.menu}</h2>
        <p className="text-xs text-slate-400">
          {savedAt === null
            ? T.noSave
            : T.savedAt(new Date(savedAt).toLocaleString("de-DE"))}
        </p>
        <button
          type="button"
          data-testid="ff-save"
          onClick={onSave}
          className="cursor-pointer rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-500"
        >
          {T.save}
        </button>
        <button
          type="button"
          data-testid="ff-load"
          disabled={savedAt === null}
          onClick={onLoad}
          className="cursor-pointer rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {T.load}
        </button>
        <button
          type="button"
          data-testid="ff-new"
          onClick={onNew}
          className="cursor-pointer rounded-lg bg-red-900/80 px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
        >
          {T.newGame}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          {T.close}
        </button>
      </div>
    </div>
  );
}
