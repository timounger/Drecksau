/**
 * The panel on the right: what the selected structure is and does, its
 * upgrade, repair, moving and tearing down - or, with nothing selected, the
 * log and the base's errands.
 *
 * @module
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import {
  busySites,
  needsRepair,
  nextLevel,
  repairCost,
} from "@/games/frost-fortress/engine/build";
import { ALLY_LIMIT, soldierHp } from "@/games/frost-fortress/engine/combat";
import { ENEMY_KINDS } from "@/games/frost-fortress/engine/enemies";
import { SUMMON_GROUP } from "@/games/frost-fortress/engine/waves";
import {
  addCost,
  canAfford,
  siteYield,
} from "@/games/frost-fortress/engine/economy";
import { EXPEDITION_COST } from "@/games/frost-fortress/engine/happenings";
import {
  energyDraw,
  maxHp,
  maxLevelOf,
  outputMultiplier,
  weaponStats,
} from "@/games/frost-fortress/engine/modifiers";
import {
  BARRACKS_SOLDIERS,
  MINE_CHARGES,
  outputFactor,
  STRUCTURES,
} from "@/games/frost-fortress/engine/structures";
import type {
  Cost,
  EnemyKind,
  Game,
  ResourceId,
  Structure,
} from "@/games/frost-fortress/engine/types";
import {
  ENEMY_NAMES,
  FROST_TEXTS as T,
  RESOURCE_ICONS,
  STRUCTURE_INFO,
  STRUCTURE_NAMES,
} from "@/games/frost-fortress/i18n/texts";
import { StructureIcon } from "./build-menu";
import { CostLine } from "./cost-line";

/** Hundred, for percent. */
const PERCENT = 100;

/** Health shares that turn the bar amber and red. */
const WARN = 0.5;
const DANGER = 0.25;

/** Log lines shown. */
const LOG_LINES = 8;

/** Decimals of rates. */
const RATE_DIGITS = 1;

/** What the panel can do. */
export type InfoActions = {
  readonly upgrade: (id: number) => void;
  readonly repair: (id: number) => void;
  readonly repairAll: () => void;
  readonly remove: (id: number) => void;
  readonly move: (id: number) => void;
  readonly explore: () => void;
  readonly autoExplore: () => void;
  readonly openResearch: () => void;
  readonly callEnemies: (kind: EnemyKind) => void;
  readonly callAllies: () => void;
};

/**
 * Renders the info panel.
 *
 * @param props - the game, the selection and the actions
 * @returns the panel
 */
export function InfoPanel({
  game,
  selected,
  moving,
  actions,
}: {
  readonly game: Game;
  readonly selected: number;
  readonly moving: number;
  readonly actions: InfoActions;
}): ReactElement {
  const structure = game.structures.find((entry) => entry.id === selected);
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-2 text-xs text-slate-200">
      {structure === undefined ? (
        <Overview game={game} actions={actions} />
      ) : (
        <Details
          game={game}
          structure={structure}
          moving={moving === structure.id}
          actions={actions}
        />
      )}
    </div>
  );
}

/** The selected structure. */
function Details({
  game,
  structure,
  moving,
  actions,
}: {
  readonly game: Game;
  readonly structure: Structure;
  readonly moving: boolean;
  readonly actions: InfoActions;
}): ReactElement {
  const top = maxHp(game, structure);
  const share = structure.hp / top;
  const next = nextLevel(game, structure);
  const repairPrice = repairCost(game, structure);
  const damaged = needsRepair(game, structure);
  const busy = busySites(game).has(structure.id);
  let state: string | null = null;
  if (!structure.built) {
    state = busy
      ? `${T.underConstruction} - ${Math.floor(structure.progress * PERCENT)} %`
      : T.waitingBuilder;
  } else if (structure.upgrading) {
    state = busy
      ? `${T.upgrading} - ${Math.floor(structure.progress * PERCENT)} %`
      : T.waitingBuilder;
  } else if (structure.repairing > 0) {
    state = T.repairing;
  }
  return (
    <>
      <div className="flex items-center gap-2">
        <StructureIcon kind={structure.kind} />
        <div className="min-w-0">
          <h3
            data-testid="ff-info-name"
            className="truncate text-sm font-bold text-white"
          >
            {STRUCTURE_NAMES[structure.kind]}
          </h3>
          <p data-testid="ff-info-level" className="text-slate-400">
            {T.levelOf(structure.level, maxLevelOf(game, structure.kind))}
          </p>
        </div>
      </div>
      {state !== null && (
        <p className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-200">
          {state}
        </p>
      )}
      <div>
        <div className="flex justify-between text-slate-400">
          <span>{T.hp}</span>
          <span
            data-testid="ff-info-hp"
            className="tabular-nums text-slate-200"
          >
            {Math.ceil(structure.hp)} / {top}
          </span>
        </div>
        <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full ${share > WARN ? "bg-emerald-500" : share > DANGER ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${share * PERCENT}%` }}
          />
        </div>
      </div>
      <Stats game={game} structure={structure} />
      <p className="text-slate-400">{STRUCTURE_INFO[structure.kind]}</p>
      <div className="flex flex-col gap-1.5">
        {structure.built && (
          <ActionButton
            testId="ff-upgrade"
            disabled={
              structure.upgrading ||
              typeof next !== "object" ||
              !canAfford(game.res, next)
            }
            onClick={() => actions.upgrade(structure.id)}
            label={
              next === "max"
                ? T.upgradeMax
                : next === "capped"
                  ? T.upgradeCapped
                  : `${T.upgrade} → ${T.level(structure.level + 1)}`
            }
            cost={
              typeof next === "object" && !structure.upgrading
                ? next
                : undefined
            }
            game={game}
            tone="primary"
          />
        )}
        {structure.built && (
          <ActionButton
            testId="ff-repair"
            disabled={!damaged || !canAfford(game.res, repairPrice)}
            onClick={() => actions.repair(structure.id)}
            label={
              damaged
                ? structure.kind === "minefield" &&
                  structure.charges < MINE_CHARGES + structure.level - 1
                  ? T.rearm
                  : T.repair
                : T.repairNothing
            }
            cost={damaged ? repairPrice : undefined}
            game={game}
            tone="repair"
          />
        )}
        {!structure.built && (
          <ActionButton
            testId="ff-move"
            disabled={moving}
            onClick={() => actions.move(structure.id)}
            label={moving ? T.moveHint : T.move}
            game={game}
            tone="plain"
          />
        )}
        {structure.kind === "hq" && (
          <Expedition
            game={game}
            onExplore={actions.explore}
            onAuto={actions.autoExplore}
          />
        )}
        {structure.kind === "lab" && structure.built && (
          <ActionButton
            testId="ff-open-research"
            onClick={actions.openResearch}
            label={T.researchOpen}
            game={game}
            tone="plain"
          />
        )}
        {structure.kind !== "hq" && (
          <ActionButton
            testId="ff-demolish"
            onClick={() => {
              if (!structure.built || window.confirm(T.demolishConfirm)) {
                actions.remove(structure.id);
              }
            }}
            label={structure.built ? T.demolish : T.cancelBuild}
            game={game}
            tone="danger"
          />
        )}
      </div>
    </>
  );
}

/** Numbers of a structure. */
function Stats({
  game,
  structure,
}: {
  readonly game: Game;
  readonly structure: Structure;
}): ReactElement {
  const def = STRUCTURES[structure.kind];
  const rows: { label: string; value: ReactNode }[] = [];
  if (def.weapon !== undefined) {
    const stats = weaponStats(game, structure);
    rows.push({ label: T.damage, value: Math.round(stats.damage) });
    rows.push({ label: T.range, value: T.tiles(stats.range) });
    rows.push({
      label: T.rate,
      value: (1 / stats.interval).toFixed(RATE_DIGITS),
    });
  }
  if (structure.kind === "minefield") {
    rows.push({
      label: T.charges,
      value: `${structure.charges} / ${MINE_CHARGES + structure.level - 1}`,
    });
  }
  if (structure.kind === "barracks") {
    const own = game.defenders.filter((unit) => unit.home === structure.id);
    const health = own.reduce(
      (sum, unit) => sum + unit.hp / soldierHp(structure),
      0,
    );
    rows.push({
      label: T.soldiers,
      value: `${own.length} / ${BARRACKS_SOLDIERS + structure.level - 1}${own.length > 0 ? ` (${Math.round((health / own.length) * PERCENT)} %)` : ""}`,
    });
  }
  const made = madePerSecond(game, structure);
  if (made !== null) {
    rows.push({ label: T.produces, value: <Rates cost={made} /> });
  }
  const used = usedPerSecond(structure);
  if (used !== null) {
    rows.push({ label: T.consumes, value: <Rates cost={used} /> });
  }
  if (def.storage !== undefined) {
    rows.push({ label: T.storage(def.storage * structure.level), value: "" });
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-slate-400">{row.label}</dt>
          <dd className="text-right tabular-nums text-slate-100">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Amounts per second. */
function Rates({ cost }: { readonly cost: Cost }): ReactElement {
  return (
    <span className="inline-flex flex-wrap justify-end gap-x-2">
      {(Object.entries(cost) as [ResourceId, number][]).map(([id, amount]) => (
        <span key={id}>
          {RESOURCE_ICONS[id]} {amount.toFixed(RATE_DIGITS)}/s
        </span>
      ))}
    </span>
  );
}

/** What a building makes per second right now. */
function madePerSecond(game: Game, structure: Structure): Cost | null {
  const def = STRUCTURES[structure.kind];
  let result: Cost | null = null;
  if (def.produce !== undefined && structure.built) {
    const site = siteYield(
      game.seed,
      structure.kind,
      structure.col,
      structure.row,
    );
    const factor = outputFactor(structure.level) * outputMultiplier(game);
    const made: Partial<Record<ResourceId, number>> = {};
    for (const [id, amount] of Object.entries(def.produce) as [
      ResourceId,
      number,
    ][]) {
      const place =
        id === "wood" || id === "iron" || id === "stone" ? site[id] : 1;
      const value = amount * factor * place;
      if (value > 0) {
        made[id] = value;
      }
    }
    result = made;
  }
  return result;
}

/** What a building uses per second. */
function usedPerSecond(structure: Structure): Cost | null {
  const def = STRUCTURES[structure.kind];
  const energy = energyDraw(structure);
  const wood = (def.consume?.wood ?? 0) * outputFactor(structure.level);
  let result: Cost | null = null;
  if (structure.built && (energy > 0 || wood > 0)) {
    result = addCost(energy > 0 ? { energy } : {}, wood > 0 ? { wood } : {});
  }
  return result;
}

/** The expedition from the headquarters. */
function Expedition({
  game,
  onExplore,
  onAuto,
}: {
  readonly game: Game;
  readonly onExplore: () => void;
  readonly onAuto: () => void;
}): ReactElement {
  const out = game.expedition > 0;
  return (
    <div className="flex flex-col gap-1">
      <ActionButton
        testId="ff-expedition"
        disabled={out || !canAfford(game.res, EXPEDITION_COST)}
        onClick={onExplore}
        label={out ? T.expeditionOut(game.expedition) : T.expedition}
        cost={out ? undefined : EXPEDITION_COST}
        hint={T.expeditionHint}
        game={game}
        tone="plain"
      />
      <label
        title={T.expeditionAutoHint}
        className="flex cursor-pointer items-center gap-2 px-1 text-[11px] text-slate-300"
      >
        <input
          type="checkbox"
          data-testid="ff-expedition-auto"
          checked={game.autoExplore}
          onChange={onAuto}
          className="h-3.5 w-3.5 cursor-pointer accent-sky-500"
        />
        {T.expeditionAuto}
        {game.autoExplore && !out && !canAfford(game.res, EXPEDITION_COST) && (
          <span className="text-amber-300">{T.expeditionWaiting}</span>
        )}
      </label>
    </div>
  );
}

/** Nothing selected: errands of the base and the log. */
function Overview({
  game,
  actions,
}: {
  readonly game: Game;
  readonly actions: InfoActions;
}): ReactElement {
  const damaged = game.structures.filter((entry) => needsRepair(game, entry));
  const total = damaged.reduce<Cost>(
    (sum, entry) => addCost(sum, repairCost(game, entry)),
    {},
  );
  return (
    <>
      <p className="text-slate-400">{T.selectHint}</p>
      <ActionButton
        testId="ff-repair-all"
        disabled={damaged.length === 0}
        onClick={actions.repairAll}
        label={
          damaged.length === 0
            ? T.repairNothing
            : `${T.repairAll} (${damaged.length})`
        }
        cost={damaged.length === 0 ? undefined : total}
        game={game}
        tone="repair"
      />
      <Expedition
        game={game}
        onExplore={actions.explore}
        onAuto={actions.autoExplore}
      />
      {game.freeBuild && <Summons game={game} actions={actions} />}
      <ActionButton
        testId="ff-research-overview"
        onClick={actions.openResearch}
        label={T.researchOpen}
        game={game}
        tone="plain"
      />
      <ol data-testid="ff-log" className="flex flex-col gap-1">
        {game.messages
          .slice(-LOG_LINES)
          .reverse()
          .map((message, index) => (
            <li
              key={`${message.at}-${index}`}
              className={`rounded-md px-2 py-1 ${
                message.tone === "bad"
                  ? "bg-red-500/15 text-red-200"
                  : message.tone === "good"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-slate-800/80 text-slate-300"
              }`}
            >
              {message.text}
            </li>
          ))}
      </ol>
    </>
  );
}

/** Building freely: enemies and allies on call. */
function Summons({
  game,
  actions,
}: {
  readonly game: Game;
  readonly actions: InfoActions;
}): ReactElement {
  const hq = game.structures.find((entry) => entry.kind === "hq");
  const allies =
    hq === undefined
      ? 0
      : game.defenders.filter((unit) => unit.home === hq.id).length;
  return (
    <section
      data-testid="ff-summons"
      className="flex flex-col gap-1.5 rounded-lg bg-slate-800/70 p-2 ring-1 ring-white/10"
    >
      <h3 className="text-[11px] font-bold text-slate-100">
        {T.freeBuildTitle}
      </h3>
      <p className="text-[10px] text-slate-400">{T.freeBuildHint}</p>
      <div className="grid grid-cols-2 gap-1">
        {ENEMY_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            data-testid={`ff-summon-${kind}`}
            onClick={() => actions.callEnemies(kind)}
            className="cursor-pointer rounded-md bg-red-900/70 px-1.5 py-1 text-left text-[11px] font-semibold [overflow-wrap:anywhere] text-red-50 hover:bg-red-800"
          >
            {SUMMON_GROUP[kind]}x {ENEMY_NAMES[kind]}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-testid="ff-summon-allies"
        disabled={allies >= ALLY_LIMIT}
        onClick={actions.callAllies}
        className="cursor-pointer rounded-md bg-emerald-700 px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {T.callAllies} ({allies} / {ALLY_LIMIT})
      </button>
    </section>
  );
}

/** A full-width action with an optional price under the label. */
function ActionButton({
  testId,
  label,
  onClick,
  disabled = false,
  cost,
  hint,
  game,
  tone,
}: {
  readonly testId: string;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly cost?: Cost;
  readonly hint?: string;
  readonly game: Game;
  readonly tone: "primary" | "repair" | "plain" | "danger";
}): ReactElement {
  const tones = {
    primary: "bg-sky-600 hover:bg-sky-500",
    repair: "bg-emerald-700 hover:bg-emerald-600",
    plain: "bg-slate-700 hover:bg-slate-600",
    danger: "bg-red-900/80 hover:bg-red-800",
  };
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      title={hint}
      onClick={onClick}
      className={`flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`}
    >
      <span>{label}</span>
      {cost !== undefined && <CostLine cost={cost} stock={game.res} />}
    </button>
  );
}
