/**
 * Der Auftakt eines neuen Spiels: Der Hund bricht durch die Leinwand.
 *
 * @module
 * @remarks
 * Über dem Brett ist eine helle Leinwand gespannt. Zweimal beult sie sich, als
 * stieße von hinten etwas dagegen, dann reißt sie von der Mitte aus ein, die
 * Fetzen fliegen davon - und aus dem Loch springt der Hund des Logos. Danach
 * blendet alles aus, und das Brett liegt frei.
 *
 * Nur CSS und ein Bild, kein Takt in JavaScript: Die Zeiten stehen in
 * {@link TIMING}, die Bewegungen in den Keyframes unten. Ein Klick überspringt
 * den Auftakt, und wer Bewegung im System abgeschaltet hat, bekommt ihn gar
 * nicht erst zu sehen.
 */
"use client";

import { useEffect, type CSSProperties, type ReactElement } from "react";

/** Wo die Seite liegt, wenn sie nicht an der Wurzel ausgeliefert wird. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Der Hund, der durchbricht - das Logo des Spiels. */
const LOGO = `${BASE_PATH}/dog/logo.webp`;

/** Wann was geschieht, in Millisekunden ab dem Anfang. */
const TIMING = {
  /** Die Risse laufen los. */
  crack: 220,
  /** Der Hund setzt an, einen Hauch vor dem Riss. */
  pop: 470,
  /** Die Leinwand reißt, der Hund springt durch. */
  burst: 500,
  /** Alles blendet aus. */
  fade: 1650,
  /** Und ist vorbei. */
  done: 2050,
} as const;

/** In wie viele Fetzen die Leinwand reißt. */
const SHARDS = 11;

/** Wie weit und wie wild die Fetzen fliegen. */
const FLY = {
  /** Wie weit, in Hundertsteln des Bretts. */
  reach: 85,
  /** Wie sehr sie sich dabei drehen, in Grad. */
  spin: 140,
  /** Wie ungleich die Fetzen geschnitten sind, als Teil eines Fetzens. */
  jitter: 0.35,
  /** Wie weit ein Riss an einem Knick zur Seite weicht, als Winkel. */
  kink: 0.06,
  /** Wie oft er auf dem Weg zum Rand knickt. */
  knees: 4,
} as const;

/** Die halbe Leinwand, in Hundertsteln - von der Mitte bis zum Rand. */
const HALF = 50;

/** Ein voller Kreis. */
const TURN = Math.PI * 2;

/** Die vier Ecken der Leinwand, als Winkel von der Mitte aus. */
const CORNERS: readonly {
  readonly angle: number;
  readonly x: number;
  readonly y: number;
}[] = [
  { x: HALF * 2, y: HALF * 2 },
  { x: 0, y: HALF * 2 },
  { x: 0, y: 0 },
  { x: HALF * 2, y: 0 },
].map((corner) => ({
  ...corner,
  angle: (Math.atan2(corner.y - HALF, corner.x - HALF) + TURN) % TURN,
}));

/** Ein Punkt auf der Leinwand, in Hundertsteln. */
type Point = { readonly x: number; readonly y: number };

/** Ein Fetzen: sein Umriss und wohin er fliegt. */
type Shard = { readonly clip: string; readonly style: CSSProperties };

/**
 * Der Auftakt.
 *
 * @param props - was geschieht, wenn er vorbei ist
 * @returns die Leinwand über dem Brett
 */
export function DogIntro({
  onDone,
}: {
  /** Wenn der Auftakt vorbei ist oder übersprungen wurde. */
  readonly onDone: () => void;
}): ReactElement {
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onDone, still ? 0 : TIMING.done);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  const cuts = cutsOf(SHARDS);
  return (
    <div
      data-testid="dog-intro"
      aria-hidden="true"
      onClick={onDone}
      className="dog-intro absolute inset-0 z-20 cursor-pointer overflow-hidden rounded-2xl bg-[#0b0b0b]"
    >
      <style>{KEYFRAMES}</style>
      <div className="dog-intro-shake absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- ein festes
            Bild in einer Animation, ohne Größenwechsel */}
        <img
          src={LOGO}
          alt=""
          draggable={false}
          className="dog-intro-dog absolute inset-0 h-full w-full select-none"
        />
        <div className="dog-intro-cloth absolute inset-0">
          {/* Die ganze Leinwand, bis sie reißt - darüber liegen die Fetzen
              schon zugeschnitten, und ohne sie schienen ihre Nähte durch. */}
          <div className="dog-intro-whole dog-intro-weave absolute inset-0" />
          {shardsOf(cuts).map((shard, index) => (
            <div
              key={index}
              className="dog-intro-shard dog-intro-weave absolute inset-0"
              style={{ clipPath: shard.clip, ...shard.style }}
            />
          ))}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="dog-intro-cracks absolute inset-0 h-full w-full"
          >
            {cuts.map((angle, index) => (
              <polyline
                key={index}
                points={crackOf(angle, index)}
                pathLength={100}
                fill="none"
                stroke="#3b342b"
                strokeWidth={0.45}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="dog-intro-crack"
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Wo die Leinwand reißt: die Winkel der Risse, von der Mitte aus.
 *
 * @param count - wie viele Fetzen es werden
 * @returns die Winkel, aufsteigend, ungleich verteilt
 * @remarks
 * Gleich bei jedem Mal - der Zufall ist ein fester Wurf je Riss -, damit der
 * Auftakt nicht bei jedem Spiel anders aussieht und nichts zu würfeln hat.
 */
function cutsOf(count: number): readonly number[] {
  const each = TURN / count;
  return Array.from(
    { length: count },
    (unused, index) => index * each + wobble(index) * each * FLY.jitter,
  );
}

/** Ein fester Wurf zwischen -1 und 1, je nach Nummer. */
function wobble(index: number): number {
  const raw = Math.sin((index + 1) * HASH.step) * HASH.spread;
  return (raw - Math.floor(raw)) * 2 - 1;
}

/** Die Zahlen des festen Wurfs - ein bekannter kleiner Hash aus dem Sinus. */
const HASH = { step: 12.9898, spread: 43758.5453 } as const;

/** Wo ein Strahl aus der Mitte den Rand der Leinwand trifft. */
function edgeAt(angle: number): Point {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const reach = HALF / Math.max(Math.abs(dx), Math.abs(dy));
  return { x: HALF + dx * reach, y: HALF + dy * reach };
}

/** Ein Punkt als Teil eines CSS-Umrisses. */
function percent(point: Point): string {
  return `${point.x.toFixed(2)}% ${point.y.toFixed(2)}%`;
}

/**
 * Die Fetzen: Keile von der Mitte bis zum Rand, samt den Ecken dazwischen.
 *
 * @param cuts - die Winkel der Risse
 * @returns je Fetzen sein Umriss und sein Flug, weg von der Mitte
 */
function shardsOf(cuts: readonly number[]): readonly Shard[] {
  return cuts.map((from, index) => {
    const to = cuts[index + 1] ?? (cuts[0] ?? 0) + TURN;
    const corners = [
      ...CORNERS,
      ...CORNERS.map((corner) => ({ ...corner, angle: corner.angle + TURN })),
    ]
      .filter((corner) => corner.angle > from && corner.angle < to)
      .map((corner) => ({ x: corner.x, y: corner.y }));
    const outline = [
      { x: HALF, y: HALF },
      edgeAt(from),
      ...corners,
      edgeAt(to),
    ];
    const middle = (from + to) / 2;
    return {
      clip: `polygon(${outline.map(percent).join(", ")})`,
      style: {
        "--dx": `${(Math.cos(middle) * FLY.reach).toFixed(1)}%`,
        "--dy": `${(Math.sin(middle) * FLY.reach).toFixed(1)}%`,
        "--rot": `${(wobble(index + SHARDS) * FLY.spin).toFixed(0)}deg`,
      } as CSSProperties,
    };
  });
}

/** Ein Riss: von der Mitte zum Rand, in der Mitte leicht geknickt. */
function crackOf(angle: number, index: number): string {
  const end = edgeAt(angle);
  const reach = Math.hypot(end.x - HALF, end.y - HALF);
  const knees = Array.from({ length: FLY.knees }, (unused, at) => {
    const bent = angle + wobble(index * FLY.knees + at + SHARDS * 2) * FLY.kink;
    const part = (at + 1) / (FLY.knees + 1);
    return {
      x: HALF + Math.cos(bent) * reach * part,
      y: HALF + Math.sin(bent) * reach * part,
    };
  });
  return [{ x: HALF, y: HALF }, ...knees, end]
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

/**
 * Die Bewegungen, als Keyframes.
 *
 * @remarks
 * Die Leinwand: hell, mit feinem Gewebe aus zwei gekreuzten Streifenmustern.
 * Sie beult sich zweimal (`thump`), die Risse laufen von der Mitte aus los
 * (`crack`), beim Durchbruch fliegen die Fetzen weg (`fly`), der Hund springt
 * mit einem Überschwinger heraus (`pop`), das Brett ruckt (`shake`), und am
 * Ende blendet alles aus (`out`).
 */
const KEYFRAMES = `
.dog-intro { animation: dog-intro-out ${TIMING.done - TIMING.fade}ms ease-in ${TIMING.fade}ms forwards; }
.dog-intro-weave {
  background-color: #efe6d2;
  background-image:
    repeating-linear-gradient(0deg, rgba(60, 45, 20, 0.07) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgba(60, 45, 20, 0.06) 0 1px, transparent 1px 3px),
    radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.12), transparent 70%);
}
.dog-intro-cloth { animation: dog-intro-thump ${TIMING.burst}ms ease-in-out forwards; }
.dog-intro-shard {
  transform-origin: 50% 50%;
  animation: dog-intro-fly 600ms cubic-bezier(0.2, 0.7, 0.3, 1) ${TIMING.burst}ms forwards;
}
.dog-intro-crack {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: dog-intro-crack ${TIMING.burst - TIMING.crack}ms ease-out ${TIMING.crack}ms forwards;
}
.dog-intro-cracks, .dog-intro-whole { animation: dog-intro-gone 1ms linear ${TIMING.burst}ms forwards; }
.dog-intro-dog {
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 58%, transparent 71%);
  mask-image: radial-gradient(circle at 50% 50%, #000 58%, transparent 71%);
}
.dog-intro-dog {
  opacity: 0;
  transform: scale(0.25);
  animation: dog-intro-pop 450ms cubic-bezier(0.2, 1.6, 0.4, 1) ${TIMING.pop}ms forwards;
}
.dog-intro-shake { animation: dog-intro-shake 250ms linear ${TIMING.burst}ms; }
@keyframes dog-intro-thump {
  0%, 30%, 60%, 100% { transform: scale(1); }
  20% { transform: scale(1.035); }
  50% { transform: scale(1.055); }
  85% { transform: scale(1.02); }
}
@keyframes dog-intro-crack { to { stroke-dashoffset: 0; } }
@keyframes dog-intro-gone { to { opacity: 0; } }
@keyframes dog-intro-fly {
  to {
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.6);
    opacity: 0;
  }
}
@keyframes dog-intro-pop { to { opacity: 1; transform: scale(1); } }
@keyframes dog-intro-shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1.2%, 0.8%); }
  50% { transform: translate(1%, -1%); }
  75% { transform: translate(-0.6%, 0.5%); }
}
@keyframes dog-intro-out { to { opacity: 0; } }
`;
