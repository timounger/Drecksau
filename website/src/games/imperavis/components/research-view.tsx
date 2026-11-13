/**
 * The research window: points per minute, the field in work, and every
 * field with its cost, what it needs first and what it opens.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { HUMAN } from "@/games/imperavis/engine/players";
import {
  RESEARCH,
  RESEARCH_BY_ID,
} from "@/games/imperavis/engine/research-data";
import { canResearch } from "@/games/imperavis/engine/research";
import type { ResearchDef } from "@/games/imperavis/engine/research-data";
import { UNITS } from "@/games/imperavis/engine/units-data";
import { UNIT_NAMES } from "@/games/imperavis/i18n/military-texts";
import {
  BUILDING_NAMES,
  RESEARCH_NAMES,
  SHIP_NAMES,
  TEXTS as T,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import type { OverviewProps } from "./overviews";
import { Bar, Btn } from "./ui";

/** Percent of a share. */
const PERCENT = 100;

/**
 * Renders the research window.
 *
 * @param props - the game and the command door
 * @returns the panel
 */
export function Research({ game, onCommand }: OverviewProps): ReactElement {
  const state = game.players[HUMAN].research;
  const human = game.players[HUMAN];
  const current = state.current === null ? null : RESEARCH_BY_ID[state.current];
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-research">
      <p data-testid="imp-research-rate">
        {state.rate > 0 ? T.researchRate(state.rate) : T.noScholars}
      </p>
      {current !== null && (
        <div className="rounded-lg border border-emerald-400 p-2">
          <p className="font-semibold">
            {T.studying}: {RESEARCH_NAMES[current.id]}
          </p>
          <div className="flex items-center gap-2">
            <Bar value={state.progress / current.cost} />
            <span
              className="text-xs tabular-nums"
              data-testid="imp-research-progress"
            >
              {T.points(state.progress, current.cost)}
            </span>
          </div>
          <Btn
            small
            onClick={() => onCommand({ type: "research", research: null })}
          >
            {T.stopResearch}
          </Btn>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {RESEARCH.map((def) => {
          const done = state.done.includes(def.id);
          const open = canResearch(human, def.id);
          return (
            <li
              key={def.id}
              className={`rounded-lg border p-2 ${done ? "border-emerald-500/50 opacity-70" : "border-zinc-200 dark:border-zinc-700"}`}
              data-testid={`imp-field-${def.id}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <b>{RESEARCH_NAMES[def.id]}</b>
                <span className="text-xs imp-muted">
                  {T.fieldCost(def.cost)}
                </span>
                {done ? (
                  <span className="ml-auto text-xs text-[var(--imp-good)]">
                    {T.researched}
                  </span>
                ) : (
                  <Btn
                    small
                    disabled={!open || state.current === def.id}
                    onClick={() =>
                      onCommand({ type: "research", research: def.id })
                    }
                    testId={`imp-research-${def.id}`}
                  >
                    {T.startResearch}
                  </Btn>
                )}
              </div>
              <p className="text-xs">
                {T.opens}: {opens(def)}
              </p>
              {def.needs.length > 0 && !done && (
                <p className="text-xs imp-muted">
                  {T.needsFirst(
                    def.needs.map((need) => RESEARCH_NAMES[need]).join(", "),
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** What a field opens, in words. */
function opens(def: ResearchDef): string {
  const parts = [
    ...(def.tier >= 0 ? [T.opensTier(TIER_NAMES[def.tier])] : []),
    ...def.buildings.map((kind) => BUILDING_NAMES[kind]),
    ...def.ships.map((kind) => SHIP_NAMES[kind]),
    ...UNITS.filter((unit) => unit.research === def.id).map(
      (unit) => UNIT_NAMES[unit.kind],
    ),
    ...(def.bonus > 0
      ? [
          T.bonus(
            Math.round(def.bonus * PERCENT),
            def.boosts === "crop" ? T.bonusCrop : T.bonusCraft,
          ),
        ]
      : []),
  ];
  return parts.join(", ");
}
