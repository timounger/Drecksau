/**
 * The build menu on the left: buildings, production and defences, each with
 * its picture, price and what still locks it - and the level to build it at,
 * paying for the upgrades on the way.
 *
 * @module
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { isUnlocked } from "@/games/frost-fortress/engine/build";
import { levelCap } from "@/games/frost-fortress/engine/modifiers";
import {
  levelCost,
  MENU,
  STRUCTURES,
} from "@/games/frost-fortress/engine/structures";
import { TILE } from "@/games/frost-fortress/engine/map";
import type {
  Game,
  MenuGroup,
  StructureKind,
} from "@/games/frost-fortress/engine/types";
import {
  FROST_TEXTS as T,
  GROUP_NAMES,
  RESEARCH_TEXTS,
  STRUCTURE_INFO,
  STRUCTURE_NAMES,
} from "@/games/frost-fortress/i18n/texts";
import { CostLine } from "./cost-line";
import { drawKind } from "./render-structures";

/** The tabs in order. */
const GROUPS: readonly MenuGroup[] = ["base", "production", "defense"];

/** Margin around an icon's drawing, world units. */
const ICON_PAD_SHARE = 0.25;
const ICON_PAD = TILE * ICON_PAD_SHARE;

/** Where the turrets of the icons point (up and to the right). */
const ICON_AIM_SHARE = -0.25;
const ICON_AIM = Math.PI * ICON_AIM_SHARE;

/** Pixel size of a menu icon. */
const ICON_SIZE = 40;

/**
 * Renders the build menu.
 *
 * @param props - the game, what is chosen and how to choose
 * @returns the panel
 */
export function BuildMenu({
  game,
  placing,
  placingLevel,
  onChoose,
}: {
  readonly game: Game;
  readonly placing: StructureKind | null;
  readonly placingLevel: number;
  readonly onChoose: (kind: StructureKind | null, level: number) => void;
}): ReactElement {
  const [group, setGroup] = useState<MenuGroup>("production");
  const [levels, setLevels] = useState<Partial<Record<StructureKind, number>>>(
    {},
  );
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" className="flex gap-1 p-1.5">
        {GROUPS.map((entry) => (
          <button
            key={entry}
            type="button"
            role="tab"
            aria-selected={entry === group}
            data-testid={`ff-tab-${entry}`}
            onClick={() => setGroup(entry)}
            className={`flex-1 cursor-pointer rounded-md px-1.5 py-1 text-[11px] font-semibold ${
              entry === group
                ? "bg-sky-600 text-white"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {GROUP_NAMES[entry]}
          </button>
        ))}
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5 pb-1.5">
        {MENU[group].map((kind) => {
          const level = Math.min(levels[kind] ?? 1, levelCap(game, kind));
          return (
            <li key={kind}>
              <BuildButton
                game={game}
                kind={kind}
                level={level}
                active={placing === kind && placingLevel === level}
                onChoose={onChoose}
                onLevel={(next) => {
                  setLevels((old) => ({ ...old, [kind]: next }));
                  if (!(placing === kind && placingLevel === next)) {
                    onChoose(kind, next);
                  }
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One entry of the menu. */
function BuildButton({
  game,
  kind,
  level,
  active,
  onChoose,
  onLevel,
}: {
  readonly game: Game;
  readonly kind: StructureKind;
  readonly level: number;
  readonly active: boolean;
  readonly onChoose: (kind: StructureKind | null, level: number) => void;
  readonly onLevel: (level: number) => void;
}): ReactElement {
  const def = STRUCTURES[kind];
  const unlocked = isUnlocked(game, kind);
  const cap = unlocked ? levelCap(game, kind) : 1;
  const lock =
    def.needsResearch !== undefined &&
    !game.research.done.includes(def.needsResearch)
      ? T.needsResearch(RESEARCH_TEXTS[def.needsResearch]?.name ?? "")
      : T.needsHq(def.needsHq);
  return (
    <div
      className={`rounded-lg border ${
        active
          ? "border-amber-400 bg-amber-500/20"
          : "border-slate-700/80 bg-slate-800/70 hover:border-sky-500 hover:bg-slate-700/80"
      } ${unlocked ? "" : "opacity-45"}`}
    >
      <button
        type="button"
        data-testid={`ff-build-${kind}`}
        disabled={!unlocked}
        aria-pressed={active}
        title={STRUCTURE_INFO[kind]}
        onClick={() => onChoose(kind, level)}
        className="flex w-full cursor-pointer items-center gap-2 p-1.5 text-left disabled:cursor-not-allowed"
      >
        <StructureIcon kind={kind} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-100">
            {STRUCTURE_NAMES[kind]}
            {level > 1 && (
              <span className="ml-1 text-amber-300">{T.level(level)}</span>
            )}
          </span>
          {unlocked ? (
            <CostLine cost={levelCost(kind, level)} stock={game.res} />
          ) : (
            <span className="block text-[11px] text-amber-300">
              {"\u{1F512}"} {lock}
            </span>
          )}
        </span>
      </button>
      {cap > 1 && (
        <div
          role="group"
          aria-label={T.buildLevel}
          className="flex flex-wrap items-center gap-1 px-1.5 pb-1.5"
        >
          <span className="text-[10px] text-slate-400">{T.buildLevel}</span>
          {Array.from({ length: cap }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              data-testid={`ff-build-${kind}-level-${value}`}
              aria-pressed={value === level}
              onClick={() => onLevel(value)}
              className={`min-w-6 cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-bold ${
                value === level
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-900/80 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A small picture of a structure, drawn with the same code as the map.
 *
 * @param props - which structure
 * @returns the icon
 */
export function StructureIcon({
  kind,
}: {
  readonly kind: StructureKind;
}): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (canvas !== null && ctx !== null && ctx !== undefined) {
      const dots = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = ICON_SIZE * dots;
      canvas.height = ICON_SIZE * dots;
      const def = STRUCTURES[kind];
      const span = Math.max(def.width, def.height) * TILE;
      const scale = (ICON_SIZE * dots) / (span + TILE / 2);
      ctx.setTransform(scale, 0, 0, scale, ICON_PAD * scale, ICON_PAD * scale);
      ctx.clearRect(-TILE, -TILE, span * 2, span * 2);
      drawKind(
        ctx,
        kind,
        (span - def.width * TILE) / 2,
        (span - def.height * TILE) / 2,
        {
          level: 1,
          aim: ICON_AIM,
          clock: 0.5,
          firing: 0,
          health: 1,
          charges: 3,
          dark: 0,
          hitAgo: 9,
        },
      );
    }
  }, [kind]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-b from-slate-200 to-slate-300"
    />
  );
}
