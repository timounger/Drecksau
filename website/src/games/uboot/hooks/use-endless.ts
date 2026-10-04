/**
 * Der Endlosmodus allein: eine Schleife, eine Leinwand, eine Stufe nach der
 * anderen.
 *
 * @module
 * @remarks
 * Dieselbe Bauart wie {@link ./use-uboot-game}: Welt und Karte liegen in Refs,
 * damit die enge Schleife nie auf React wartet, und nach außen geht nur das,
 * was auch wirklich auf dem Blatt steht. Was den Modus ausmacht, steht
 * trotzdem nicht hier, sondern in {@link ../endless/engine} - hier wird nur
 * gekurbelt.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { play } from "@/games/uboot/audio/sounds";
import { createControls } from "@/games/uboot/hooks/controls";
import { createTouch, type PadView } from "@/games/uboot/hooks/touch-controls";
import {
  STAGE_PAUSE,
  advanceDeep,
  startDeep,
  stepDeep,
  DEEP_GEAR,
} from "@/games/uboot/endless/engine";
import {
  DEEP_VIEW_H,
  DEEP_VIEW_W,
  deepCamera,
  drawDeep,
} from "@/games/uboot/endless/render";
import type {
  DeepInput,
  DeepPhase,
  DeepState,
  DiverId,
} from "@/games/uboot/endless/types";
import { buildDeep, type DeepWorld } from "@/games/uboot/endless/world";
import { fitCanvas } from "@/lib/screen/fit-canvas";

/** Millisekunden in einer Sekunde. */
const MS_PER_SECOND = 1000;

/** Was über dem Bild steht. */
export type DeepHud = {
  readonly stage: number;
  readonly phase: DeepPhase;
  /** Was die Hülle noch aushält, und wie viel es im Ganzen war. */
  readonly hull: number;
  readonly hullMax: number;
  /** Die Luft, in Sekunden, und wie viel hineinpasst. */
  readonly air: number;
  readonly airMax: number;
  /** Wie viele Bewohner die Stufe noch hat. */
  readonly beasts: number;
  /** Wie viele man im ganzen Lauf erwischt hat. */
  readonly kills: number;
  /** Ob gerade pausiert wird. */
  readonly paused: boolean;
};

/** Was der Bildschirm vom Endlosmodus braucht. */
export type EndlessGame = {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly hud: DeepHud;
  /** Das Steuerkreuz unter dem Daumen, oder null. */
  readonly pad: PadView | null;
  /** Noch einmal von vorn, auf Stufe eins. */
  readonly restart: () => void;
  readonly pause: (on: boolean) => void;
  /** Legt eine Seemine - der Knopf am Bild, für Finger ohne rechte Maustaste. */
  readonly lay: () => void;
};

/** Der Anfangszustand der Anzeige. */
const EMPTY_HUD: DeepHud = {
  stage: 1,
  phase: "waiting",
  hull: DEEP_GEAR.hull,
  hullMax: DEEP_GEAR.hull,
  air: DEEP_GEAR.air,
  airMax: DEEP_GEAR.air,
  beasts: 0,
  kills: 0,
  paused: false,
};

/**
 * Fährt einen Lauf durch die Tiefe.
 *
 * @param active - ob der Modus gerade auf dem Bildschirm ist
 * @returns die Leinwand, die Anzeige und die beiden Knöpfe
 */
export function useEndless(active: boolean): EndlessGame {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Welt und Karte zusammen in einem Ref: Sie gehören zur selben Stufe, und
  // getrennt könnte eine von beiden einmal eine andere sein als die andere.
  const runRef = useRef<Run>(freshRun());
  const pausedRef = useRef(false);
  const controlsRef = useRef(createControls());
  const touchRef = useRef(createTouch());

  const [hud, setHud] = useState<DeepHud>(EMPTY_HUD);
  const [pad, setPad] = useState<PadView | null>(null);
  const hudRef = useRef(hud);

  const syncHud = useCallback((state: DeepState) => {
    const mine = state.divers[0];
    const next: DeepHud = {
      stage: state.stage,
      phase: state.phase,
      hull: Math.max(0, mine?.hull ?? 0),
      hullMax: DEEP_GEAR.hull,
      air: Math.max(0, mine?.air ?? 0),
      airMax: DEEP_GEAR.air,
      beasts: state.beasts.length,
      kills: state.kills,
      paused: pausedRef.current,
    };
    if (!sameHud(next, hudRef.current)) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  const restart = useCallback(() => {
    runRef.current = freshRun();
    pausedRef.current = false;
    syncHud(runRef.current.state);
  }, [syncHud]);

  const lay = useCallback(() => {
    touchRef.current.lay();
  }, []);

  const pause = useCallback(
    (on: boolean) => {
      pausedRef.current = on;
      syncHud(runRef.current.state);
    },
    [syncHud],
  );

  // **Ein frischer Lauf, sobald der Modus aufgeht.** Wer die Seekarte
  // verlässt und wiederkommt, fängt von vorn an - eine halbe Stufe von
  // vorhin wäre kein Lauf, sondern ein Rest.
  useEffect(() => {
    if (active) {
      restart();
    }
  }, [active, restart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!active || canvas === null || ctx === null) {
      return;
    }

    const controls = controlsRef.current;
    const thumb = touchRef.current;
    const stopKeys = controls.listen(window);
    const stopTouch = thumb.listen(canvas);

    /** Was dieses Bild gewollt wird - Tasten, Daumen und Zielpunkt. */
    const asked = (): DeepInput => {
      const keys = controls.read();
      const point = thumb.read();
      const at = point.aim;
      const camera = deepCamera(runRef.current.state, ME);
      return {
        up: keys.up || point.up,
        down: keys.down || point.down,
        back: keys.back || point.back,
        forward: keys.forward || point.forward,
        fire: keys.fire || point.fire,
        drop: keys.drop || point.drop,
        // Der Zielpunkt steht auf der Leinwand; die Welt liegt darunter.
        aim: at === null ? null : { x: at.x + camera.x, y: at.y + camera.y },
      };
    };

    /** Was man hört, aus dem Unterschied zweier Welten. */
    const sing = (was: DeepState, now: DeepState) => {
      if (now.shots.length > was.shots.length) {
        play("launch");
      }
      if (now.blasts.length > was.blasts.length) {
        play("boom");
      }
      if (now.beasts.length < was.beasts.length) {
        play("critter");
      }
      const mine = now.divers[0];
      const before = was.divers[0];
      if (
        mine !== undefined &&
        before !== undefined &&
        mine.hull < before.hull
      ) {
        play("hit");
      }
      if (was.phase !== "over" && now.phase === "over") {
        play("lose");
      }
      if (was.phase !== "cleared" && now.phase === "cleared") {
        play("win");
      }
    };

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;

      if (!pausedRef.current) {
        const run = runRef.current;
        const next = stepDeep(run.state, run.world, { one: asked() }, dt);
        sing(run.state, next);
        // Stufe leer: eine Atempause, dann eine neue Karte, eine tiefer.
        if (next.phase === "cleared" && next.since >= STAGE_PAUSE) {
          const world = buildDeep(next.stage + 1, next.seed);
          runRef.current = { state: advanceDeep(next, world), world };
        } else {
          runRef.current = { state: next, world: run.world };
        }
      }

      const run = runRef.current;
      syncHud(run.state);
      setPad(thumb.view());
      const dots = fitCanvas(canvas, DEEP_VIEW_W, DEEP_VIEW_H);
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      drawDeep(ctx, run.state, run.world, {
        me: ME,
        aim: thumb.read().aim,
        pad: thumb.view(),
      });
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      stopKeys();
      stopTouch();
      controls.forget();
      thumb.forget();
    };
  }, [active, syncHud]);

  return { canvasRef, hud, pad, restart, pause, lay };
}

/** Allein fährt immer der erste Platz. */
const ME: DiverId = "one";

/** Ein Lauf: die Welt und die Karte, auf der sie steht. */
type Run = { readonly state: DeepState; readonly world: DeepWorld };

/** Ein frischer Lauf auf einer frischen Karte. */
function freshRun(): Run {
  const seed = Date.now();
  return { state: startDeep(seed), world: buildDeep(1, seed) };
}

/** Ob zwei Anzeigen dasselbe sagen. */
function sameHud(a: DeepHud, b: DeepHud): boolean {
  return (
    a.stage === b.stage &&
    a.phase === b.phase &&
    a.hull === b.hull &&
    Math.round(a.air) === Math.round(b.air) &&
    a.beasts === b.beasts &&
    a.kills === b.kills &&
    a.paused === b.paused
  );
}
