/**
 * Der Endlosmodus auf dem Bildschirm: Leinwand, Anzeige und die zwei Enden.
 *
 * @module
 * @remarks
 * Liegt im selben Fenster wie die Seekarte und der Tauchgang und sieht auch so
 * aus - nur dass hier nichts freigeschaltet werden muss und nichts zu Ende
 * geht. Gerechnet und gezeichnet wird in {@link ../hooks/use-endless}; hier
 * steht, was man liest und anklickt.
 */
"use client";

import type { ReactElement } from "react";
import { DEEP_VIEW_H, DEEP_VIEW_W } from "@/games/uboot/endless/render";
import { useEndless } from "@/games/uboot/hooks/use-endless";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";

/** Props of {@link DeepGame}. */
export type DeepGameProps = {
  /** Zurück zur Seekarte. */
  readonly onExit: () => void;
};

/** Wie breit der Luftbalken höchstens ist, in Prozent. */
const FULL = 100;

/**
 * Zeichnet den Endlosmodus samt allem, was darübersteht.
 *
 * @param props - der Weg zurück
 * @returns den Bildschirm
 */
export function DeepGame({ onExit }: DeepGameProps): ReactElement {
  const { canvasRef, hud, restart, pause } = useEndless(true);
  const air = Math.round((hud.air / hud.airMax) * FULL);

  return (
    <div className="game-shot relative">
      <canvas
        ref={canvasRef}
        data-testid="uboot-deep-canvas"
        width={DEEP_VIEW_W}
        height={DEEP_VIEW_H}
        className="block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700"
      />

      {/* Oben links alles, was man im Blick haben muss; oben rechts der Weg
          hinaus. Mehr steht nicht im Bild - der Rest ist Wasser. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="flex flex-col gap-1 rounded-lg bg-black/45 px-3 py-2 text-white backdrop-blur">
          <p className="text-sm font-bold" data-testid="uboot-deep-stage">
            {UBOOT_TEXTS.deepStage(hud.stage)}
          </p>
          <p className="text-xs">
            {UBOOT_TEXTS.deepLeft(hud.beasts)} ·{" "}
            {UBOOT_TEXTS.deepKills(hud.kills)}
          </p>
          <div className="flex items-center gap-1 text-xs">
            <span aria-hidden="true">{"\u{1F6E1}"}</span>
            <span data-testid="uboot-deep-hull">
              {hud.hull} / {hud.hullMax}
            </span>
          </div>
          <div className="h-1.5 w-28 overflow-hidden rounded bg-white/25">
            <div
              className="h-full rounded bg-sky-300"
              style={{ width: `${air}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          data-testid="uboot-deep-exit"
          onClick={onExit}
          className="pointer-events-auto cursor-pointer rounded-lg bg-black/55 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
        >
          {UBOOT_TEXTS.toMap}
        </button>
      </div>

      {hud.phase === "waiting" && (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white drop-shadow">
          {UBOOT_TEXTS.deepStart}
        </p>
      )}

      {hud.phase === "cleared" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center text-white">
          <p className="text-2xl font-bold drop-shadow">
            {UBOOT_TEXTS.deepCleared(hud.stage)}
          </p>
          <p className="text-sm drop-shadow">{UBOOT_TEXTS.deepDeeper}</p>
        </div>
      )}

      {hud.phase === "over" && (
        <div
          data-testid="uboot-deep-over"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl bg-red-950/70 p-4 text-center text-white"
        >
          <p className="text-2xl font-bold">{UBOOT_TEXTS.deepOver}</p>
          <p className="text-sm">
            {UBOOT_TEXTS.deepReached(hud.stage, hud.kills)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              data-testid="uboot-deep-again"
              onClick={() => {
                restart();
                pause(false);
              }}
              className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              {UBOOT_TEXTS.deepAgain}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="cursor-pointer rounded-lg border border-white/50 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              {UBOOT_TEXTS.toMap}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
