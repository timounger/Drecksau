/**
 * The bar along the top: the six resources with their rates, the wave, how
 * the base is holding up and the energy supply.
 *
 * @module
 */
import type { ReactElement } from "react";
import { RESOURCE_IDS } from "@/games/frost-fortress/engine/economy";
import {
  headquarters,
  maxHp,
  storageLimit,
} from "@/games/frost-fortress/engine/modifiers";
import { runtimeOf } from "@/games/frost-fortress/engine/runtime";
import type { Game } from "@/games/frost-fortress/engine/types";
import { isBossWave } from "@/games/frost-fortress/engine/waves";
import {
  FROST_TEXTS as T,
  RESOURCE_ICONS,
  RESOURCE_NAMES,
} from "@/games/frost-fortress/i18n/texts";

/** Share of the limit from which a stock counts as nearly full. */
const NEARLY_FULL = 0.95;

/** Hundred, for percent. */
const PERCENT = 100;

/** Health shares that turn the bar amber and red. */
const WARN = 0.5;
const DANGER = 0.25;

/** Rates smaller than this are shown as standing still. */
const STILL = 0.05;

/**
 * Renders the top bar.
 *
 * @param props - the game
 * @returns the bar
 */
export function TopBar({ game }: { readonly game: Game }): ReactElement {
  const runtime = runtimeOf(game);
  const limit = storageLimit(game);
  const hq = headquarters(game);
  const hqShare = hq === undefined ? 0 : hq.hp / maxHp(game, hq);
  const built = game.structures.filter((entry) => entry.built);
  const baseShare =
    built.length === 0
      ? 0
      : built.reduce((sum, entry) => sum + entry.hp / maxHp(game, entry), 0) /
        built.length;
  const alive =
    game.enemies.filter((enemy) => enemy.alive).length + game.wave.queue.length;
  const boss = isBossWave(
    game.wave.active ? game.wave.number : game.wave.number + 1,
  );
  return (
    <div className="flex items-stretch gap-1.5 overflow-x-auto px-1.5 py-1.5 [scrollbar-width:none]">
      {RESOURCE_IDS.map((id) => {
        const rate = runtime.rates[id] ?? 0;
        const full = game.res[id] >= limit * NEARLY_FULL;
        return (
          <div
            key={id}
            data-testid={`ff-res-${id}`}
            data-value={Math.floor(game.res[id])}
            title={`${RESOURCE_NAMES[id]} - ${T.storage(limit)}`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900/80 px-2 py-1 ring-1 ring-white/10"
          >
            <span className="text-base leading-none" aria-hidden="true">
              {RESOURCE_ICONS[id]}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] text-slate-400">
                {RESOURCE_NAMES[id]}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${full ? "text-amber-300" : "text-white"}`}
              >
                {game.cheat ? T.endless : Math.floor(game.res[id])}
                <span
                  className={`ml-1 text-[10px] font-medium ${
                    rate > STILL
                      ? "text-emerald-400"
                      : rate < -STILL
                        ? "text-red-400"
                        : "text-slate-500"
                  }`}
                >
                  {T.perSecond(rate)}
                </span>
              </span>
            </span>
          </div>
        );
      })}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div
          data-testid="ff-wave"
          className={`flex flex-col justify-center rounded-lg px-2.5 py-1 leading-tight ring-1 ${
            game.wave.active
              ? "bg-red-900/80 ring-red-400/50"
              : "bg-slate-900/80 ring-white/10"
          }`}
        >
          <span className="text-[10px] text-slate-300">
            {game.wave.active ? T.waveRunning(alive) : T.nextWave}
            {boss && (
              <span className="ml-1 font-bold text-fuchsia-300">
                {T.bossWarning}
              </span>
            )}
          </span>
          <span className="text-sm font-bold tabular-nums">
            {game.wave.number === 0 && !game.wave.active
              ? T.noWaveYet
              : T.wave(game.wave.number)}
          </span>
        </div>
        <Meter
          testId="ff-base"
          label={T.base}
          share={hqShare}
          detail={`HQ ${Math.round(hqShare * PERCENT)} % · ⌀ ${Math.round(baseShare * PERCENT)} %`}
        />
        <Meter
          testId="ff-power"
          label={T.power}
          share={runtime.power}
          detail={T.powerShort(runtime.energyIn, runtime.energyOut)}
        />
      </div>
    </div>
  );
}

/** A labelled bar for a share. */
function Meter({
  testId,
  label,
  share,
  detail,
}: {
  readonly testId: string;
  readonly label: string;
  readonly share: number;
  readonly detail: string;
}): ReactElement {
  const color =
    share > WARN
      ? "bg-emerald-500"
      : share > DANGER
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div
      data-testid={testId}
      className="flex min-w-32 shrink-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-900/80 px-2 py-1 ring-1 ring-white/10"
    >
      <span className="flex justify-between gap-2 text-[10px] text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums">{detail}</span>
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-slate-700">
        <span
          className={`block h-full ${color}`}
          style={{ width: `${Math.max(0, Math.min(1, share)) * PERCENT}%` }}
        />
      </span>
    </div>
  );
}
