/**
 * The bar along the bottom: game speed, the next wave, research progress,
 * time of day and weather - and the menu.
 *
 * @module
 */
import type { ReactElement } from "react";
import {
  darkness,
  researchSpeed,
  sightFactor,
} from "@/games/frost-fortress/engine/modifiers";
import { RESEARCH, researchById } from "@/games/frost-fortress/engine/research";
import type { Game } from "@/games/frost-fortress/engine/types";
import { isBossWave } from "@/games/frost-fortress/engine/waves";
import {
  FROST_TEXTS as T,
  RESEARCH_TEXTS,
} from "@/games/frost-fortress/i18n/texts";
import {
  CHEAT_SPEEDS,
  SPEEDS,
} from "@/games/frost-fortress/settings/preferences";

/** Hundred, for percent. */
const PERCENT = 100;

/** Darkness from which it counts as dusk, and as night. */
const DUSK_FROM = 0.05;
const NIGHT_FROM = 0.95;

/** Blizzard strength from which it counts. */
const STORM_FROM = 0.15;

/** Countdown seconds from which the wave box turns urgent. */
const URGENT = 20;

/** What the bar can do. */
export type BottomActions = {
  readonly setSpeed: (speed: number) => void;
  readonly togglePause: () => void;
  readonly sendWave: () => void;
  readonly openResearch: () => void;
  readonly openMenu: () => void;
};

/**
 * Renders the bottom bar.
 *
 * @param props - the game, speed and actions
 * @returns the bar
 */
export function BottomBar({
  game,
  speed,
  paused,
  actions,
}: {
  readonly game: Game;
  readonly speed: number;
  readonly paused: boolean;
  readonly actions: BottomActions;
}): ReactElement {
  const project =
    game.research.current === null
      ? undefined
      : researchById(game.research.current);
  const share =
    project === undefined ? 0 : game.research.progress / project.points;
  const labs = researchSpeed(game) > 0;
  const dark = darkness(game);
  const storm = game.weather.storm > STORM_FROM;
  const time = dark >= NIGHT_FROM ? T.night : dark > DUSK_FROM ? T.dusk : T.day;
  const nextBoss = isBossWave(game.wave.number + 1);
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1.5 py-1.5">
      <div
        className="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-900/85 p-0.5 ring-1 ring-white/10"
        role="group"
        aria-label={T.speed}
      >
        <button
          type="button"
          data-testid="ff-pause"
          aria-pressed={paused}
          onClick={actions.togglePause}
          className={`cursor-pointer rounded-md px-2 py-1 text-xs font-bold ${paused ? "bg-amber-500 text-slate-900" : "text-slate-200 hover:bg-slate-700"}`}
          title={T.pause}
        >
          {"⏸"}
        </button>
        {[...SPEEDS, ...(game.cheat ? CHEAT_SPEEDS : [])].map((value) => (
          <button
            key={value}
            type="button"
            data-testid={`ff-speed-${value}`}
            aria-pressed={!paused && speed === value}
            onClick={() => actions.setSpeed(value)}
            className={`cursor-pointer rounded-md px-2 py-1 text-xs font-bold ${!paused && speed === value ? "bg-sky-600 text-white" : "text-slate-200 hover:bg-slate-700"}`}
          >
            {value}x
          </button>
        ))}
      </div>
      <div
        data-testid="ff-next-wave"
        className={`flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 ring-1 ${
          !game.wave.active && !game.freeBuild && game.wave.countdown < URGENT
            ? "bg-red-900/85 ring-red-400/60"
            : "bg-slate-900/85 ring-white/10"
        }`}
      >
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] text-slate-400">
            {T.nextWave} ({T.wave(game.wave.number + 1)})
            {nextBoss && (
              <span className="ml-1 font-bold text-fuchsia-300">
                {T.bossWarning}
              </span>
            )}
          </span>
          <span
            data-testid="ff-countdown"
            className="text-sm font-bold tabular-nums text-white"
          >
            {game.wave.active
              ? T.waveRunning(game.enemies.length + game.wave.queue.length)
              : game.freeBuild
                ? T.freeBuildWaiting
                : T.countdown(Math.max(0, game.wave.countdown))}
          </span>
        </span>
        <button
          type="button"
          data-testid="ff-call-wave"
          disabled={game.wave.active || game.over}
          onClick={actions.sendWave}
          title={T.callWaveHint}
          className="cursor-pointer rounded-md bg-red-700 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {T.callWave}
        </button>
      </div>
      <button
        type="button"
        data-testid="ff-research-bar"
        onClick={actions.openResearch}
        className="flex min-w-36 flex-1 cursor-pointer flex-col gap-0.5 rounded-lg bg-slate-900/85 px-2 py-1 text-left ring-1 ring-white/10 hover:ring-sky-400/60 sm:max-w-72"
      >
        <span className="flex justify-between gap-2 text-[10px] text-slate-400">
          <span>{T.research}</span>
          {project !== undefined && (
            <span className="tabular-nums">
              {Math.floor(share * PERCENT)} %
            </span>
          )}
        </span>
        <span className="truncate text-xs font-semibold text-white">
          {project !== undefined
            ? RESEARCH_TEXTS[project.id]?.name
            : game.research.done.length === RESEARCH.length
              ? T.researchAll
              : labs
                ? T.researchNone
                : T.researchNoLab}
        </span>
        <span className="h-1 overflow-hidden rounded-full bg-slate-700">
          <span
            className="block h-full bg-sky-400"
            style={{ width: `${share * PERCENT}%` }}
          />
        </span>
      </button>
      <div
        data-testid="ff-weather"
        className="flex shrink-0 flex-col rounded-lg bg-slate-900/85 px-2 py-1 leading-tight ring-1 ring-white/10"
      >
        <span className="text-[10px] text-slate-400">
          {dark >= NIGHT_FROM
            ? "\u{1F319}"
            : dark > DUSK_FROM
              ? "\u{1F306}"
              : "☀️"}{" "}
          {time}
          {" · "}
          {storm ? `\u{1F328}️ ${T.storm}` : T.clear}
        </span>
        <span className="text-xs font-semibold tabular-nums text-white">
          {T.sight(Math.round(sightFactor(game) * PERCENT))}
        </span>
      </div>
      {game.effects.map((effect) => (
        <span
          key={effect.kind}
          className="shrink-0 rounded-lg bg-indigo-900/85 px-2 py-1 text-[11px] font-semibold text-indigo-100 ring-1 ring-indigo-400/40"
        >
          {T.effects[effect.kind]} {Math.ceil(effect.left)} s
        </span>
      ))}
      <button
        type="button"
        data-testid="ff-menu"
        onClick={actions.openMenu}
        className="ml-auto shrink-0 cursor-pointer rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-slate-600"
      >
        {"☰"} {T.menu}
      </button>
    </div>
  );
}
