/**
 * The research tree: five branches side by side, each project with its
 * price, its time and what it needs.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { canResearch } from "@/games/frost-fortress/engine/engine";
import {
  hasResearch,
  researchSpeed,
} from "@/games/frost-fortress/engine/modifiers";
import {
  BRANCHES,
  RESEARCH,
  type ResearchDef,
} from "@/games/frost-fortress/engine/research";
import type { Game } from "@/games/frost-fortress/engine/types";
import {
  BRANCH_NAMES,
  FROST_TEXTS as T,
  RESEARCH_TEXTS,
  STRUCTURE_NAMES,
} from "@/games/frost-fortress/i18n/texts";
import { CostLine } from "./cost-line";

/** Hundred, for percent. */
const PERCENT = 100;

/**
 * Renders the research dialog.
 *
 * @param props - the game and what the buttons do
 * @returns the dialog
 */
export function ResearchDialog({
  game,
  onStart,
  onCancel,
  onClose,
}: {
  readonly game: Game;
  readonly onStart: (id: string) => void;
  readonly onCancel: () => void;
  readonly onClose: () => void;
}): ReactElement {
  const speed = researchSpeed(game);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={T.researchTitle}
      data-testid="ff-research"
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-2"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-5xl flex-col gap-3 overflow-hidden rounded-2xl bg-slate-900/95 p-3 text-slate-100 ring-1 ring-white/15"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{T.researchTitle}</h2>
            <p className="text-xs text-slate-400">
              {speed > 0 ? `${speed.toFixed(1)} Punkte/s` : T.researchNoLab}
            </p>
          </div>
          <button
            type="button"
            data-testid="ff-research-close"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold hover:bg-slate-600"
          >
            {T.close}
          </button>
        </header>
        <div className="grid min-h-0 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-5">
          {BRANCHES.map((branch) => (
            <section key={branch} className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-sky-300">
                {BRANCH_NAMES[branch]}
              </h3>
              {RESEARCH.filter((entry) => entry.branch === branch).map(
                (entry) => (
                  <Project
                    key={entry.id}
                    game={game}
                    def={entry}
                    onStart={onStart}
                    onCancel={onCancel}
                  />
                ),
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One project card. */
function Project({
  game,
  def,
  onStart,
  onCancel,
}: {
  readonly game: Game;
  readonly def: ResearchDef;
  readonly onStart: (id: string) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const done = hasResearch(game, def.id);
  const running = game.research.current === def.id;
  const missing = def.needs.filter((need) => !hasResearch(game, need));
  const startable = canResearch(game, def);
  const speed = researchSpeed(game);
  const text = RESEARCH_TEXTS[def.id];
  const seconds = speed > 0 ? Math.ceil(def.points / speed) : null;
  return (
    <article
      data-testid={`ff-research-${def.id}`}
      className={`flex flex-col gap-1 rounded-lg p-2 text-xs ring-1 ${
        done
          ? "bg-emerald-900/40 ring-emerald-500/50"
          : running
            ? "bg-sky-900/50 ring-sky-400/70"
            : missing.length > 0
              ? "bg-slate-800/50 opacity-60 ring-white/5"
              : "bg-slate-800/80 ring-white/10"
      }`}
    >
      <h4 className="font-bold text-white">{text?.name ?? def.id}</h4>
      <p className="text-slate-300">
        {text?.info}
        {def.unlocks !== undefined && ` (${STRUCTURE_NAMES[def.unlocks]})`}
      </p>
      {missing.length > 0 && (
        <p className="text-amber-300">
          {T.researchNeeds(
            missing
              .map((need) => RESEARCH_TEXTS[need]?.name ?? need)
              .join(", "),
          )}
        </p>
      )}
      {done ? (
        <span className="font-semibold text-emerald-300">
          {"✓"} {T.researchDone}
        </span>
      ) : running ? (
        <div className="flex flex-col gap-1">
          <span className="h-1.5 overflow-hidden rounded-full bg-slate-700">
            <span
              className="block h-full bg-sky-400"
              style={{
                width: `${(game.research.progress / def.points) * PERCENT}%`,
              }}
            />
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md bg-slate-700 px-2 py-1 font-semibold hover:bg-slate-600"
          >
            {T.researchCancel}
          </button>
        </div>
      ) : (
        <>
          <CostLine cost={def.cost} stock={game.res} />
          {seconds !== null && (
            <span className="text-slate-400">
              {"⏱"} {seconds} s
            </span>
          )}
          <button
            type="button"
            data-testid={`ff-research-start-${def.id}`}
            disabled={!startable}
            onClick={() => onStart(def.id)}
            className="cursor-pointer rounded-md bg-sky-600 px-2 py-1 font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {T.researchStart}
          </button>
        </>
      )}
    </article>
  );
}
