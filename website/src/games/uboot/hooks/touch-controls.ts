/**
 * Zeigen, zielen, legen: alles, was am Bild selbst passiert.
 *
 * @module
 * @remarks
 * Ein Regler für zwei Geräte, weil beide dieselbe Frage beantworten: **wohin**.
 *
 * - **Maus.** Der Zeiger ist der Zielpunkt, links schießt, rechts legt eine
 *   Seemine. Gesteuert wird mit der Tastatur; ein Kreuz braucht hier niemand.
 * - **Finger.** Links ins Bild fassen lässt ein Steuerkreuz unter dem Daumen
 *   aufgehen. Rechts tippen schießt dorthin, rechts **halten** legt eine
 *   Seemine - dasselbe lange Drücken, das die Panzerkiste für ihre Minen
 *   benutzt.
 *
 * Der Regler hört nur zu und merkt sich. Gerechnet wird damit anderswo, und
 * die Engine erfährt nie, ob ein Daumen oder eine Maus dahintersteckt.
 */
"use client";

import { CANVAS_H, CANVAS_W } from "@/games/uboot/components/render";

/** Wie weit der Daumen vom Anfasspunkt weg muss, damit es als Richtung zählt. */
const DEAD = 14;

/** Und wie weit das Kreuz höchstens ausschlägt, in Bildpunkten. */
const REACH = 58;

/** Ab wann ein Druck auf die rechte Seite als Halten gilt, in Millisekunden. */
const LONG_MS = 300;

/** Welche Maustaste was tut. */
const BUTTON = { left: 0, right: 2 } as const;

/** Das Steuerkreuz, wie es gezeichnet wird - oder null, wenn niemand hinfasst. */
export type PadView = {
  /** Wo der Daumen aufgesetzt hat. */
  readonly baseX: number;
  readonly baseY: number;
  /** Und wo er jetzt ist, schon auf {@link REACH} begrenzt. */
  readonly tipX: number;
  readonly tipY: number;
};

/** Was Maus und Finger gerade sagen, noch in den Maßen des Bildes. */
export type Pointing = {
  readonly up: boolean;
  readonly down: boolean;
  readonly back: boolean;
  readonly forward: boolean;
  readonly fire: boolean;
  readonly drop: boolean;
  /** Der Zielpunkt auf der Leinwand, oder null. */
  readonly aim: { readonly x: number; readonly y: number } | null;
};

/** Der Regler selbst. */
export type TouchControls = {
  /** Hängt sich an die Zeichenfläche und gibt zurück, wie man wieder loskommt. */
  readonly listen: (canvas: HTMLCanvasElement) => () => void;
  /** Was dieses Bild anliegt. */
  readonly read: () => Pointing;
  /** Das Kreuz zum Zeichnen, oder null. */
  readonly view: () => PadView | null;
  /**
   * Legt beim nächsten Lesen eine Seemine.
   *
   * @remarks
   * Für den Knopf auf dem Telefon. Dort gibt es keine rechte Maustaste, und
   * das lange Halten auf der rechten Seite ist zwar da, aber es ist nichts,
   * worauf man von allein kommt.
   */
  readonly lay: () => void;
  /** Lässt alles los. */
  readonly forget: () => void;
};

/**
 * Baut einen Zeigeregler.
 *
 * @returns den Regler, der noch an nichts hängt
 */
export function createTouch(): TouchControls {
  let pad: {
    id: number;
    baseX: number;
    baseY: number;
    x: number;
    y: number;
  } | null = null;
  /** Der Zielpunkt: beim Zeiger die letzte Position, beim Finger der Druck. */
  let aim: { x: number; y: number } | null = null;
  let shooting = false;
  let laying = false;
  /** Ein Druck auf den Minenknopf, der beim nächsten Lesen abgeholt wird. */
  let pending = false;
  /** Der Finger auf der rechten Seite, mit dem Zeitpunkt seines Aufsetzens. */
  let held: { id: number; since: number } | null = null;

  const spot = (canvas: HTMLCanvasElement, event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * CANVAS_W,
      y: ((event.clientY - box.top) / box.height) * CANVAS_H,
    };
  };

  const forget = () => {
    pad = null;
    shooting = false;
    laying = false;
    held = null;
    aim = null;
  };

  return {
    listen: (canvas: HTMLCanvasElement) => {
      const down = (event: PointerEvent) => {
        const at = spot(canvas, event);
        if (event.pointerType === "mouse") {
          aim = at;
          if (event.button === BUTTON.left) {
            shooting = true;
          }
          if (event.button === BUTTON.right) {
            laying = true;
          }
        } else if (at.x < CANVAS_W / 2 && pad === null) {
          pad = { id: event.pointerId, baseX: at.x, baseY: at.y, ...at };
        } else {
          // **Ein Kreuz, das schon steht, bleibt stehen.** Der zweite Finger
          // zielt - auch links, denn dort schwimmt genauso viel herum wie
          // rechts. Sonst spränge das Kreuz unter dem Daumen weg, sobald man
          // nach links schießt.
          aim = at;
          held = { id: event.pointerId, since: performance.now() };
        }
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
      };
      const move = (event: PointerEvent) => {
        const at = spot(canvas, event);
        if (event.pointerType === "mouse") {
          aim = at;
        } else if (pad !== null && event.pointerId === pad.id) {
          pad = { ...pad, x: at.x, y: at.y };
        } else if (held !== null && event.pointerId === held.id) {
          aim = at;
        }
      };
      const up = (event: PointerEvent) => {
        if (event.pointerType === "mouse") {
          if (event.button === BUTTON.left) {
            shooting = false;
          }
          if (event.button === BUTTON.right) {
            laying = false;
          }
        }
        if (pad !== null && event.pointerId === pad.id) {
          pad = null;
        }
        if (held !== null && event.pointerId === held.id) {
          held = null;
          // Der Finger ist weg, also ist auch das Ziel weg. Nur der Mauszeiger
          // bleibt, wo er ist - der zeigt ja weiter hin.
          aim = null;
        }
      };
      const gone = () => {
        shooting = false;
        laying = false;
        held = null;
        aim = null;
      };
      // Ohne das kommt beim Minenlegen das Kontextmenü des Browsers.
      const menu = (event: Event) => event.preventDefault();

      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      canvas.addEventListener("pointerleave", gone);
      canvas.addEventListener("contextmenu", menu);
      return () => {
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("pointerleave", gone);
        canvas.removeEventListener("contextmenu", menu);
        forget();
      };
    },
    read: () => {
      const dx = pad === null ? 0 : pad.x - pad.baseX;
      const dy = pad === null ? 0 : pad.y - pad.baseY;
      // Kurz getippt heißt schießen, lange gehalten heißt legen - und niemals
      // beides, sonst legt jeder Schuss aus Versehen eine Mine mit.
      const long = held !== null && performance.now() - held.since > LONG_MS;
      // Der Knopf zählt für genau ein Bild: Gelegt wird eine Mine, nicht eine
      // je Bild, solange der Finger noch auf dem Knopf liegt.
      const pressed = pending;
      pending = false;
      return {
        up: dy < -DEAD,
        down: dy > DEAD,
        back: dx < -DEAD,
        forward: dx > DEAD,
        fire: shooting || (held !== null && !long),
        drop: laying || long || pressed,
        aim,
      };
    },
    view: () => {
      let seen: PadView | null = null;
      if (pad !== null) {
        const dx = pad.x - pad.baseX;
        const dy = pad.y - pad.baseY;
        const away = Math.hypot(dx, dy);
        const kept = away > REACH ? REACH / away : 1;
        seen = {
          baseX: pad.baseX,
          baseY: pad.baseY,
          tipX: pad.baseX + dx * kept,
          tipY: pad.baseY + dy * kept,
        };
      }
      return seen;
    },
    lay: () => {
      pending = true;
    },
    forget,
  };
}
