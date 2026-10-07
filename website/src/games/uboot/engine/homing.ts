/**
 * Die Lenkrakete: wie sie ihr Ziel findet und darauf zudreht.
 *
 * @module
 * @remarks
 * **Sie nimmt das Ziel, auf das du gezielt hast - nicht das nächste.** Jedes
 * Bild schaut sie in einem Kegel um ihre Flugrichtung ({@link SEEK}) und nimmt
 * das Ziel, das am genauesten vor ihr liegt; die Entfernung entscheidet nur,
 * wenn zwei fast gleich genau vor ihr liegen. Ein Tier, das nah, aber schräg
 * daneben schwimmt, lenkt sie also nicht von dem weiter hinten ab, auf das du
 * geschossen hast.
 *
 * **Sie lenkt nach, sie springt nicht.** Auf ihr Ziel dreht sie in einer
 * Kurve, so scharf, wie {@link SEEK} es zulässt. Wer knapp daneben zielt,
 * trifft damit trotzdem; wer in die völlig falsche Richtung schießt, nicht.
 * Ihr Tempo bleibt dabei, wie es war.
 *
 * Welche Ziele es gibt, weiß die Engine, die sie fliegen lässt - in der
 * Kampagne Tiere, der Wächter und die Minen im Fels, unten im Endlosen nur die
 * Tiere. Hier wird nur gelenkt.
 */
import type { Shot, Vec } from "./types";

/**
 * Wie die Lenkrakete sucht und lenkt.
 *
 * @remarks
 * `reach`: wie weit sie schaut, in Pixeln. `cone`: wie weit neben ihrer
 * Flugrichtung ein Ziel noch zählt, in Bogenmaß (gut 40 Grad zu jeder
 * Seite). `turn`: wie scharf sie einlenken kann, in Bogenmaß je Sekunde.
 * `near`: wie viel die Entfernung beim Wählen zählt - so wenig, dass sie nur
 * bei fast gleichem Winkel den Ausschlag gibt.
 */
export const SEEK = { reach: 260, cone: 0.7, turn: 4.5, near: 0.15 } as const;

/**
 * Die Lenkraketen, einen Augenblick später auf ihr Ziel gedreht.
 *
 * @param shots - alles, was fliegt - nur die Lenkraketen werden gelenkt
 * @param targets - wo Ziele sind
 * @param dt - wie lange das Bild gedauert hat, in Sekunden
 * @returns dieselben Schüsse, die Lenkraketen nachgedreht
 */
export function steered<T extends Shot>(
  shots: readonly T[],
  targets: readonly Vec[],
  dt: number,
): readonly T[] {
  return shots.map((shot) => {
    const goal = shot.kind === "homing" ? aimedAt(shot, targets) : null;
    return goal === null ? shot : turnedTo(shot, goal, dt);
  });
}

/**
 * Das Ziel, auf das die Lenkrakete am ehesten zufliegt, oder null.
 *
 * @remarks
 * Gezählt wird, wie weit ein Ziel neben der Flugrichtung liegt, plus ein
 * kleiner Zuschlag für die Entfernung. Was außerhalb des Kegels oder der
 * Reichweite liegt, zählt gar nicht.
 */
function aimedAt(shot: Shot, targets: readonly Vec[]): Vec | null {
  const heading = Math.atan2(shot.vy, shot.vx);
  let best: Vec | null = null;
  let bestScore = Infinity;

  for (const target of targets) {
    const gap = Math.hypot(target.x - shot.x, target.y - shot.y);
    const off = Math.abs(
      between(heading, Math.atan2(target.y - shot.y, target.x - shot.x)),
    );
    const score = off + (gap / SEEK.reach) * SEEK.near;
    if (gap <= SEEK.reach && off <= SEEK.cone && score < bestScore) {
      best = target;
      bestScore = score;
    }
  }

  return best;
}

/** Ein Schuss, um höchstens so viel zum Ziel gedreht, wie er in diesem Bild kann. */
function turnedTo<T extends Shot>(shot: T, goal: Vec, dt: number): T {
  const pace = Math.hypot(shot.vx, shot.vy);
  const now = Math.atan2(shot.vy, shot.vx);
  const want = Math.atan2(goal.y - shot.y, goal.x - shot.x);
  const gap = between(now, want);
  const most = SEEK.turn * dt;
  const turn = Math.abs(gap) <= most ? want : now + Math.sign(gap) * most;
  return { ...shot, vx: Math.cos(turn) * pace, vy: Math.sin(turn) * pace };
}

/** Wie weit eine Richtung von einer anderen weg ist, über den kürzeren Weg. */
function between(from: number, to: number): number {
  const full = Math.PI * 2;
  return ((((to - from) % full) + full + Math.PI) % full) - Math.PI;
}
