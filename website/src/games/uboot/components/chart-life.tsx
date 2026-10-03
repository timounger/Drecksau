/**
 * Was im Hintergrund eines Blattes vorbeizieht.
 *
 * @module
 * @remarks
 * **Dieselben Tiere wie im Wasser** ({@link ./creatures drawBeast}), nur
 * langsamer, blasser und ohne jede Wirkung: Sie schwimmen quer durch das
 * Blatt, verschwinden an der einen Kante und kommen an der anderen wieder.
 * Anklicken kann man sie nicht, treffen können sie einen nicht - die Karte
 * ist kein Tauchgang.
 *
 * Gezeichnet statt gebaut, weil die Tiere schon gezeichnet sind: Ein zweiter
 * Satz Hintergrundfische wäre ein zweiter Satz, der beim nächsten Umbau einer
 * Qualle vergessen wird.
 *
 * Wer darin schwimmt, sagt das Blatt: Auf der Seekarte alles, was man unten
 * trifft, in der Werkstatt nur Schwärme. Dort steht man zwischen zwei
 * Tauchgängen, und das ist kein Ort für einen Anglerfisch.
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { drawBeast } from "@/games/uboot/components/creatures";
import { BREEDS } from "@/games/uboot/engine/beasts";
import type { Beast, BeastKind } from "@/games/uboot/engine/types";

/** Die Maße des Blattes, in denen hier gerechnet wird. */
const LIFE = {
  /** Wie groß die gedachte Fläche ist - das Bild wird darauf gestreckt. */
  wide: 960,
  high: 540,
  /** Wie weit ein Tier über den Rand hinaus muss, bevor es neu anfängt. */
  margin: 90,
  /** Wie blass sie sind: Hintergrund heißt hinten. */
  fade: 0.42,
  /** Wie weit sie dabei auf und ab gehen, in Pixeln, und wie schnell. */
  bob: 14,
  bobPace: 0.5,
  /** Millisekunden in einer Sekunde. */
  second: 1000,
} as const;

/** Ein Tier auf seiner Bahn: wo es anfängt, wie schnell und wie groß. */
export type Swimmer = {
  readonly kind: BeastKind;
  /** Wo es startet, als Anteil der Breite, und auf welcher Höhe. */
  readonly from: number;
  readonly deep: number;
  /** Wie schnell es zieht, in Pixeln je Sekunde - minus heißt nach links. */
  readonly pace: number;
  /** Wie groß es gezeichnet wird. */
  readonly size: number;
};

/**
 * Wer über die Karte zieht.
 *
 * @remarks
 * Oben die, die man zuerst trifft, unten die aus der Tiefe - die Karte liest
 * sich von oben nach unten wie die Reise selbst. Und keine zwei gleich
 * schnell, sonst zögen sie als Reihe vorbei.
 */
export const CHART_SWIMMERS: readonly Swimmer[] = [
  { kind: "shoal", from: 0.1, deep: 0.17, pace: 26, size: 1.1 },
  { kind: "jelly", from: 0.55, deep: 0.3, pace: -17, size: 1.3 },
  { kind: "shoal", from: 0.8, deep: 0.46, pace: 33, size: 0.8 },
  { kind: "eel", from: 0.35, deep: 0.58, pace: -29, size: 1.2 },
  { kind: "jelly", from: 0.05, deep: 0.72, pace: 14, size: 1.6 },
  { kind: "angler", from: 0.68, deep: 0.85, pace: -21, size: 1.4 },
];

/**
 * Und wer in der Werkstatt vorbeizieht: nur Schwärme.
 *
 * @remarks
 * **Nichts, was einen anschaut.** Die Werkstatt ist der Ort zwischen zwei
 * Tauchgängen; ein Anglerfisch, der dort durchs Bild zieht, erinnert an das
 * Gefecht, statt an das Boot denken zu lassen. Ein Schwarm ist Wasser mit
 * Bewegung darin.
 */
export const SHOAL_SWIMMERS: readonly Swimmer[] = [
  { kind: "shoal", from: 0.15, deep: 0.22, pace: 24, size: 1 },
  { kind: "shoal", from: 0.6, deep: 0.4, pace: -18, size: 1.4 },
  { kind: "shoal", from: 0.85, deep: 0.62, pace: 31, size: 0.8 },
  { kind: "shoal", from: 0.35, deep: 0.8, pace: -26, size: 1.2 },
];

/** Props of {@link ChartLife}. */
export type ChartLifeProps = {
  /** Wer hier vorbeizieht - ohne Angabe die Mischung der Seekarte. */
  readonly swimmers?: readonly Swimmer[];
};

/**
 * Zeichnet das Leben im Hintergrund eines Blattes.
 *
 * @param props - wer vorbeizieht
 * @returns die Leinwand, die hinter allem liegt
 */
export function ChartLife({
  swimmers = CHART_SWIMMERS,
}: ChartLifeProps): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }

    let raf = 0;
    const began = performance.now();
    const frame = (now: number) => {
      const time = (now - began) / LIFE.second;
      ctx.clearRect(0, 0, LIFE.wide, LIFE.high);
      ctx.globalAlpha = LIFE.fade;
      for (const [at, one] of swimmers.entries()) {
        const lane = LIFE.wide + LIFE.margin * 2;
        // Von Kante zu Kante und wieder herein: Der Rest der Teilung ist der
        // ganze Kreislauf, und er braucht keinen Zustand.
        const run = (one.from * lane + one.pace * time) % lane;
        const x = ((run + lane) % lane) - LIFE.margin;
        const y =
          one.deep * LIFE.high + Math.sin(time * LIFE.bobPace + at) * LIFE.bob;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(one.size, one.size);
        drawBeast(ctx, drifting(one, at), 0, 0, time);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => window.cancelAnimationFrame(raf);
  }, [swimmers]);

  return (
    <canvas
      ref={ref}
      data-testid="uboot-chart-life"
      width={LIFE.wide}
      height={LIFE.high}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/** Ein Tier, wie es für das Vorbeiziehen aussieht. */
function drifting(swimmer: Swimmer, id: number): Beast {
  return {
    id,
    kind: swimmer.kind,
    x: 0,
    y: 0,
    homeX: 0,
    homeY: 0,
    // Die Richtung steckt im Tempo: Daran dreht der Zeichner das Tier.
    vx: swimmer.pace,
    vy: 0,
    beat: 0,
    hull: BREEDS[swimmer.kind].hull,
    hurt: 0,
  };
}
