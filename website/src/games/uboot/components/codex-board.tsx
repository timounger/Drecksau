/**
 * Die Enzyklopädie, wie sie im Spielfenster aufgeht.
 *
 * @module
 * @remarks
 * Vier Kapitel, eine Spalte, und oben eine Reihe Knöpfe, mit der man springt.
 * Kein Suchfeld und kein Register: Das Buch ist zwanzig Einträge lang, und wer
 * in zwanzig Einträgen sucht, scrollt schneller, als er tippt.
 *
 * **Die Tiere werden gezeichnet, nicht beschrieben.** Jeder Eintrag bekommt
 * dieselbe Zeichenfunktion wie das Spiel ({@link ../components/creatures
 * drawBeast}) - was im Buch steht, sieht deshalb genau so aus wie das, was
 * einen eben umgebracht hat.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { UBOOT_CODEX, type CodexEntry } from "@/games/uboot/i18n/codex";
import { drawBeast } from "@/games/uboot/components/creatures";
import { BREEDS } from "@/games/uboot/engine/beasts";
import type { Beast, BeastKind } from "@/games/uboot/engine/types";

/** Wie groß ein gezeichnetes Tier im Buch ist, in Bildpunkten. */
const ICON = { box: 72, scale: 1.25 } as const;

/**
 * Renders das Buch.
 *
 * @returns die Seite
 */
export function CodexBoard(): ReactElement {
  const [chapter, setChapter] = useState(UBOOT_CODEX[0].id);
  const open = UBOOT_CODEX.find((one) => one.id === chapter) ?? UBOOT_CODEX[0];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {UBOOT_CODEX.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`uboot-codex-tab-${one.id}`}
            onClick={() => setChapter(one.id)}
            className={`cursor-pointer rounded-lg border px-3 py-1 text-sm font-medium ${
              one.id === chapter
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {one.title}
          </button>
        ))}
      </div>

      {open.intro !== undefined && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{open.intro}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {open.entries.map((entry) => (
          <Entry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

/** Props of {@link Entry}. */
type EntryProps = {
  readonly entry: CodexEntry;
};

/** Ein Eintrag: Bild, Kurzangaben, Text. */
function Entry({ entry }: EntryProps): ReactElement {
  return (
    <article
      data-testid={`uboot-codex-${entry.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="flex items-center gap-3">
        {entry.beast === undefined ? (
          <span aria-hidden="true" className="text-4xl">
            {entry.icon}
          </span>
        ) : (
          <BeastPicture kind={entry.beast} />
        )}
        <h3 className="text-base font-bold">{entry.title}</h3>
      </header>

      {entry.facts !== undefined && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          {entry.facts.map(([what, how]) => (
            <div key={what} className="contents">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
                {what}
              </dt>
              <dd>{how}</dd>
            </div>
          ))}
        </dl>
      )}

      {entry.body.map((line) => (
        <p key={line} className="text-sm leading-snug">
          {line}
        </p>
      ))}
    </article>
  );
}

/** Props of {@link BeastPicture}. */
type BeastPictureProps = {
  readonly kind: BeastKind;
};

/**
 * Ein Tier, gezeichnet wie im Wasser - nur dass es hier stillhält.
 *
 * @param props - welche Art
 * @returns die kleine Zeichenfläche
 * @remarks
 * Ein einzelnes Bild und keine Schleife: Das Buch soll gelesen werden, und
 * sechs zappelnde Tiere nebeneinander lesen sich schlecht. Der Takt steht
 * trotzdem nicht auf null, sonst hinge jede Qualle mitten im Atemzug.
 */
function BeastPicture({ kind }: BeastPictureProps): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }
    const dots = window.devicePixelRatio || 1;
    canvas.width = ICON.box * dots;
    canvas.height = ICON.box * dots;
    ctx.setTransform(dots, 0, 0, dots, 0, 0);
    ctx.clearRect(0, 0, ICON.box, ICON.box);
    ctx.save();
    ctx.translate(ICON.box / 2, ICON.box / 2);
    ctx.scale(ICON.scale, ICON.scale);
    drawBeast(ctx, still(kind), 0, 0, POSE);
    ctx.restore();
  }, [kind]);

  return (
    <canvas
      ref={ref}
      data-testid={`uboot-codex-art-${kind}`}
      style={{ width: ICON.box, height: ICON.box }}
      className="shrink-0 rounded-lg bg-gradient-to-b from-sky-700 to-sky-950"
      aria-label={BREEDS[kind].name}
      role="img"
    />
  );
}

/** Die Stelle im Takt, an der jedes Tier am meisten nach sich aussieht. */
const POSE = 0.4;

/** Ein Tier, wie es für ein Bild stillhält. */
function still(kind: BeastKind): Beast {
  return {
    id: 0,
    kind,
    x: 0,
    y: 0,
    homeX: 0,
    homeY: 0,
    // Nach rechts, damit alle in dieselbe Richtung schauen.
    vx: 1,
    vy: 0,
    beat: 0,
    hull: BREEDS[kind].hull,
    hurt: 0,
  };
}
