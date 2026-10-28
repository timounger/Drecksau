/**
 * The row of eight portrait buttons under the picture: who is steered, who
 * can do what, and a click to switch.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type { Hud } from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import {
  CHARACTER_IDS,
  type Action,
} from "@/games/weihnachtsmann/engine/types";
import {
  ANIMAL_TEXTS,
  CHARACTER_TEXTS,
  PLACE_TEXTS,
  WM_TEXTS,
} from "@/games/weihnachtsmann/i18n/texts";
import { Portrait } from "./portrait";

/**
 * Renders the selection bar.
 *
 * @param props - what the screen shows and how to send a switch
 * @returns the bar
 */
export function CharacterBar({
  hud,
  dispatch,
  compact = false,
}: {
  readonly hud: Hud;
  readonly dispatch: (action: Action) => void;
  /** A single row of portraits for a phone, instead of named buttons. */
  readonly compact?: boolean;
}): ReactElement {
  return compact ? (
    <CompactBar hud={hud} dispatch={dispatch} />
  ) : (
    <div
      role="group"
      aria-label={WM_TEXTS.barLabel}
      data-testid="wm-bar"
      className="grid w-full grid-cols-4 gap-1.5 pt-2 lg:grid-cols-8"
    >
      {CHARACTER_IDS.map((id, index) => {
        const active = index === hud.active;
        const texts = CHARACTER_TEXTS[id];
        const animal = id === "jordi" ? hud.form : null;
        const place = hud.places[index];
        const where = place === undefined ? null : PLACE_TEXTS[place];
        return (
          <button
            key={id}
            type="button"
            data-testid={`wm-pick-${id}`}
            aria-pressed={active}
            title={`${WM_TEXTS.barHint} ${String(index + 1)}`}
            onClick={(event) => {
              dispatch({ kind: "select", index });
              event.currentTarget.blur();
            }}
            className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-1 text-center transition-colors sm:flex-row sm:gap-1.5 sm:text-left ${
              active
                ? "border-amber-300 bg-amber-100/15 shadow-[0_0_0_1px_#fcd34d]"
                : "border-zinc-700 bg-zinc-800/70 hover:border-zinc-500 hover:bg-zinc-800"
            }`}
          >
            <span className="absolute top-0.5 left-1 text-[10px] font-bold text-zinc-400">
              {index + 1}
            </span>
            <Portrait who={animal ?? id} />
            <span className="flex min-w-0 flex-col">
              <span
                className={`text-[11px] leading-tight font-bold hyphens-auto break-words ${active ? "text-amber-200" : "text-zinc-100"}`}
              >
                {texts.name}
              </span>
              <span className="hidden text-[10px] leading-tight text-zinc-400 sm:block">
                {animal === null
                  ? texts.ability
                  : `${WM_TEXTS.asAnimal} ${ANIMAL_TEXTS[animal].name}`}
              </span>
              {hud.flying[index] === true && (
                <span className="text-[10px] font-semibold text-sky-300">
                  {WM_TEXTS.flying}
                </span>
              )}
              {where !== null && (
                <span className="text-[10px] font-semibold text-amber-300/80">
                  {where}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The bar on a phone: the active character's name and ability in one line,
 * and the eight portraits in a row that scrolls sideways if it must.
 */
function CompactBar({
  hud,
  dispatch,
}: {
  readonly hud: Hud;
  readonly dispatch: (action: Action) => void;
}): ReactElement {
  const activeId = CHARACTER_IDS[hud.active];
  const animal = activeId === "jordi" ? hud.form : null;
  const where = hud.places[hud.active];
  const notes = [
    animal === null
      ? CHARACTER_TEXTS[activeId].ability
      : `${WM_TEXTS.asAnimal} ${ANIMAL_TEXTS[animal].name}`,
    hud.flying[hud.active] === true ? WM_TEXTS.flying : null,
    where === undefined ? null : PLACE_TEXTS[where],
  ].filter((note) => note !== null);
  return (
    <div
      role="group"
      aria-label={WM_TEXTS.barLabel}
      data-testid="wm-bar"
      data-wm-below=""
      className="flex w-full flex-col gap-1 pt-1"
    >
      <p className="truncate px-1 text-xs text-zinc-300">
        <span className="font-bold text-amber-200">
          {CHARACTER_TEXTS[activeId].name}
        </span>{" "}
        - {notes.join(", ")}
      </p>
      <div className="flex w-full justify-between gap-1 overflow-x-auto px-0.5 pt-0.5 pb-1">
        {CHARACTER_IDS.map((id, index) => {
          const active = index === hud.active;
          const form = id === "jordi" ? hud.form : null;
          return (
            <button
              key={id}
              type="button"
              data-testid={`wm-pick-${id}`}
              aria-pressed={active}
              aria-label={CHARACTER_TEXTS[id].name}
              onClick={(event) => {
                dispatch({ kind: "select", index });
                event.currentTarget.blur();
              }}
              className={`relative shrink-0 cursor-pointer overflow-hidden rounded-md ${
                active
                  ? "bg-amber-100/20 ring-2 ring-amber-300"
                  : "bg-zinc-800/80 ring-1 ring-zinc-700"
              }`}
            >
              <Portrait who={form ?? id} />
              {hud.flying[index] === true && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-sky-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
