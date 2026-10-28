/**
 * Jordi's animal choice, laid over the picture.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { ANIMAL_IDS, type Action } from "@/games/weihnachtsmann/engine/types";
import { ANIMAL_TEXTS, WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { Portrait } from "./portrait";

/**
 * Renders the six animals to pick from.
 *
 * @param props - the highlighted animal and how to send the choice
 * @returns the panel
 */
export function AnimalPicker({
  cursor,
  dispatch,
  compact = false,
}: {
  readonly cursor: number;
  readonly dispatch: (action: Action) => void;
  /** Small portraits and no traits, to fit over the picture on a phone. */
  readonly compact?: boolean;
}): ReactElement {
  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/45 ${compact ? "overflow-auto p-1" : "p-2"}`}
    >
      <div
        role="dialog"
        aria-label={WM_TEXTS.animalTitle}
        data-testid="wm-animals"
        className={`flex max-w-xl flex-col rounded-xl border-4 border-[#f8f0d0] bg-[#7a1f2b] shadow-[0_0_0_3px_#2a1218,0_6px_0_#2a1218] ${compact ? "gap-1 p-2" : "gap-2 p-3"}`}
      >
        <p
          className={`text-center font-bold text-amber-100 ${compact ? "text-xs" : "text-sm"}`}
        >
          {WM_TEXTS.animalTitle}
        </p>
        <div
          className={`grid grid-cols-3 gap-1.5 ${compact ? "landscape:grid-cols-6" : "sm:grid-cols-6"}`}
        >
          {ANIMAL_IDS.map((id, index) => (
            <button
              key={id}
              type="button"
              data-testid={`wm-animal-${id}`}
              aria-pressed={index === cursor}
              onClick={() => {
                dispatch({ kind: "menuPick", index });
              }}
              className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border-2 px-1 py-1.5 text-center ${
                index === cursor
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-transparent bg-black/20 hover:bg-black/35"
              }`}
            >
              <Portrait who={id} zoom={compact ? 1 : 2} />
              <span className="text-xs font-bold text-white">
                {compact ? "" : `${String(index + 1)}. `}
                {ANIMAL_TEXTS[id].name}
              </span>
              {!compact && (
                <span className="text-[10px] leading-tight text-amber-100/80">
                  {ANIMAL_TEXTS[id].trait}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-amber-100/70">
            {compact ? WM_TEXTS.animalHintTouch : WM_TEXTS.animalHint}
          </span>
          <button
            type="button"
            data-testid="wm-animal-cancel"
            onClick={() => {
              dispatch({ kind: "menuClose" });
            }}
            className={`cursor-pointer rounded-md bg-zinc-700 font-semibold text-white hover:bg-zinc-600 ${compact ? "min-h-11 px-4 text-sm" : "px-3 py-1 text-xs"}`}
          >
            {WM_TEXTS.animalCancel}
          </button>
        </div>
      </div>
    </div>
  );
}
