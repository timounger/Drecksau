/**
 * Die Enzyklopädie, wie sie im Spielfenster aufgeht.
 *
 * @module
 * @remarks
 * **Zwei Tafeln nebeneinander**, nach dem Vorbild aus
 * `game_instructions/UBoot/enzyklodädie.png`: links ein Gitter aus Bildern,
 * rechts das eine, das gerade offen ist - groß, mit Namen, Text und seinen
 * Kurzangaben. Was angewählt ist, trägt einen gelben Rahmen.
 *
 * Der Unterschied zu einer Liste ist nicht die Hübschheit, sondern das
 * Suchen: In einer Liste liest man Überschriften, bis die richtige kommt; in
 * einem Gitter sieht man das Tier, das einen eben umgebracht hat, und klickt
 * darauf. Deshalb stehen in den Kacheln auch keine Namen.
 *
 * **Die Tiere werden gezeichnet, nicht beschrieben.** Kachel wie Tafel bekommen
 * dieselbe Zeichenfunktion wie das Spiel ({@link ../components/creatures
 * drawBeast}) - was im Buch steht, sieht deshalb genau so aus wie das, was
 * draußen schwimmt.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { UBOOT_CODEX, type CodexEntry } from "@/games/uboot/i18n/codex";
import { drawBeast } from "@/games/uboot/components/creatures";
import { BREEDS } from "@/games/uboot/engine/beasts";
import type { Beast, BeastKind } from "@/games/uboot/engine/types";

/**
 * Wie groß ein gezeichnetes Tier ist: in der Kachel und auf der Tafel.
 *
 * @remarks
 * Die Tafel ist **breiter als hoch**, und das ist kein Zufall: Der
 * Anglerfisch trägt seine Rute weit vor sich her, und auf einer quadratischen
 * Fläche wäre entweder die Rute abgeschnitten oder der Fisch eine Briefmarke.
 */
const ICON = {
  tile: 64,
  tileScale: 1.15,
  bigWide: 300,
  bigHigh: 150,
  bigScale: 2.6,
} as const;

/**
 * Renders das Buch.
 *
 * @returns die Seite
 */
export function CodexBoard(): ReactElement {
  const [at, setAt] = useState({
    chapter: UBOOT_CODEX[0].id,
    entry: UBOOT_CODEX[0].entries[0]?.id ?? "",
  });
  const open =
    UBOOT_CODEX.find((one) => one.id === at.chapter) ?? UBOOT_CODEX[0];
  const entry =
    open.entries.find((one) => one.id === at.entry) ?? open.entries[0];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Die vier Kapitel als Reiter über beiden Tafeln: Sie wechseln, was
          im Gitter liegt, und nicht, wie es aussieht. */}
      <div className="flex flex-wrap gap-2">
        {UBOOT_CODEX.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`uboot-codex-tab-${one.id}`}
            onClick={() =>
              setAt({ chapter: one.id, entry: one.entries[0]?.id ?? "" })
            }
            className={`cursor-pointer rounded-lg border px-3 py-1 text-sm font-medium ${
              one.id === at.chapter
                ? "border-sky-400 bg-sky-600 text-white"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {one.title}
          </button>
        ))}
      </div>

      {/* Das Vorwort gehört dem Kapitel und nicht dem Eintrag - also steht
          es über beiden Tafeln und nicht in einer davon. */}
      {open.intro !== undefined && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{open.intro}</p>
      )}

      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Links: das Gitter. Es scrollt für sich, damit die Tafel rechts
            stehen bleibt, während man darin sucht. */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-sky-900/60 bg-gradient-to-b from-sky-900 to-slate-950">
          <h3 className="border-b border-sky-900/60 bg-sky-950/80 px-3 py-2 text-center text-sm font-bold tracking-widest text-sky-100 uppercase">
            {open.title}
          </h3>
          <div className="grid min-h-0 grid-cols-4 gap-2 overflow-y-auto p-2">
            {open.entries.map((one) => (
              <Tile
                key={one.id}
                entry={one}
                lit={one.id === entry?.id}
                onPick={() => setAt({ chapter: open.id, entry: one.id })}
              />
            ))}
          </div>
        </section>

        {/* Rechts: das eine, das offen ist. */}
        {entry !== undefined && <Sheet entry={entry} />}
      </div>
    </div>
  );
}

/** Props of {@link Tile}. */
type TileProps = {
  readonly entry: CodexEntry;
  /** Ob dieser Eintrag gerade offen ist. */
  readonly lit: boolean;
  readonly onPick: () => void;
};

/** Eine Kachel im Gitter: nur das Bild, kein Name. */
function Tile({ entry, lit, onPick }: TileProps): ReactElement {
  return (
    <button
      type="button"
      data-testid={`uboot-codex-tile-${entry.id}`}
      data-open={lit}
      onClick={onPick}
      title={entry.title}
      aria-label={entry.title}
      aria-pressed={lit}
      className={`flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 bg-gradient-to-b from-sky-700 to-sky-950 ${
        lit
          ? "border-amber-300 shadow-[0_0_0_2px_rgba(252,211,77,0.45)]"
          : "border-sky-950/80 hover:border-sky-400"
      }`}
    >
      {entry.beast === undefined ? (
        <span aria-hidden="true" className="text-3xl">
          {entry.icon}
        </span>
      ) : (
        <BeastPicture
          kind={entry.beast}
          wide={ICON.tile}
          high={ICON.tile}
          scale={ICON.tileScale}
        />
      )}
    </button>
  );
}

/** Props of {@link Sheet}. */
type SheetProps = {
  readonly entry: CodexEntry;
};

/** Die Tafel rechts: Bild, Name, Text, Kurzangaben. */
function Sheet({ entry }: SheetProps): ReactElement {
  return (
    <section
      data-testid={`uboot-codex-${entry.id}`}
      className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-sky-900/60 bg-gradient-to-b from-slate-900 to-slate-950 p-3 text-sky-50"
    >
      {/* Das Bild in einem hellen Rahmen - wie ein Foto, das jemand
          mitgebracht hat. */}
      <div className="flex items-center justify-center rounded-xl border-4 border-sky-100/80 bg-gradient-to-b from-sky-700 to-sky-950 p-2">
        {entry.beast === undefined ? (
          <span
            aria-hidden="true"
            className="flex h-[150px] items-center text-7xl"
          >
            {entry.icon}
          </span>
        ) : (
          <BeastPicture
            kind={entry.beast}
            wide={ICON.bigWide}
            high={ICON.bigHigh}
            scale={ICON.bigScale}
          />
        )}
      </div>

      <h3 className="text-center text-xl font-bold tracking-wide text-amber-300 uppercase">
        {entry.title}
      </h3>

      {entry.body.map((line) => (
        <p key={line} className="text-sm leading-snug text-sky-100">
          {line}
        </p>
      ))}

      {/* Die Kurzangaben unten, zwei nebeneinander wie im Vorbild. */}
      {entry.facts !== undefined && (
        <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-sky-800/70 pt-3">
          {entry.facts.map(([what, how]) => (
            <div
              key={what}
              className="flex flex-col rounded-lg bg-sky-950/60 px-2 py-1"
            >
              <dt className="text-[0.65rem] font-semibold tracking-wider text-sky-300 uppercase">
                {what}
              </dt>
              <dd className="text-sm font-medium">{how}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** Props of {@link BeastPicture}. */
type BeastPictureProps = {
  readonly kind: BeastKind;
  /** Wie breit und wie hoch die Zeichenfläche ist, in Bildpunkten. */
  readonly wide: number;
  readonly high: number;
  /** Und wie groß das Tier darin. */
  readonly scale: number;
};

/**
 * Ein Tier, gezeichnet wie im Wasser - nur dass es hier stillhält.
 *
 * @param props - welche Art, wie groß
 * @returns die Zeichenfläche
 * @remarks
 * Ein einzelnes Bild und keine Schleife: Das Buch soll gelesen werden, und ein
 * Gitter aus zappelnden Tieren liest sich schlecht. Der Takt steht trotzdem
 * nicht auf null, sonst hinge jede Qualle mitten im Atemzug.
 */
function BeastPicture({
  kind,
  wide,
  high,
  scale,
}: BeastPictureProps): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }
    const dots = window.devicePixelRatio || 1;
    canvas.width = wide * dots;
    canvas.height = high * dots;
    ctx.setTransform(dots, 0, 0, dots, 0, 0);
    ctx.clearRect(0, 0, wide, high);
    ctx.save();
    ctx.translate(wide / 2, high / 2);
    ctx.scale(scale, scale);
    drawBeast(ctx, still(kind), 0, 0, POSE);
    ctx.restore();
  }, [kind, wide, high, scale]);

  return (
    <canvas
      ref={ref}
      data-testid={`uboot-codex-art-${kind}`}
      style={{ width: wide, height: high }}
      className="max-w-full shrink-0"
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
