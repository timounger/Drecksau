/**
 * Die Symbole der Werkstatt - gezeichnet, nicht aus der Emoji-Tabelle.
 *
 * @module
 * @remarks
 * **Eine Stufe muss man sehen können, ohne zu lesen.** Genau das kann eine
 * Emoji-Tabelle nicht: Es gibt keine zwei Blasen, keine größere Schraube und
 * kein dickeres Schild - es gibt nur immer dasselbe Zeichen. Also sind es
 * hier ein paar Pfade in SVG, und die wachsen mit: eine Blase mehr, ein Blatt
 * mehr an der Schraube, eine Platte mehr auf dem Schild.
 *
 * So trägt das Feld selbst schon die halbe Erklärung, und der Satz auf der
 * Tafel daneben ist nur noch die Bestätigung.
 */
"use client";

import type { ReactElement } from "react";
import type { UpgradeId } from "@/games/uboot/engine/upgrades";

/**
 * Die Maße der Zeichnungen, im Raster 24 x 24.
 *
 * @remarks
 * Alles, was eine Form ausmacht, steht hier und nicht zwischen den Pfaden -
 * so kann man eine Schraube größer machen, ohne sechs Zahlen in drei Zeilen
 * zu suchen.
 */
const SIZE = {
  /** Die Mitte des Rasters. */
  middle: 12,
  /** Wie groß das Glanzlicht einer Blase ist, als Teil von ihr. */
  gloss: 3,
  /** Schild: Strichstärke dünn und dick, ab welcher Stufe der Stern kommt. */
  thin: 1.2,
  thick: 2,
  star: 3,
  /** Wo die Panzerplatten quer über dem Schild liegen. */
  plates: { low: 16.5, middle: 13, high: 9.5 },
  /** Seemine: Stachelzahl, Ballgröße und wie weit die Stacheln reichen. */
  spikes: 8,
  ball: 6.5,
  spike: 10.5,
  /** Ein voller Kreis in Grad. */
  turn: 360,
  half: 180,
  /** Tiefenruder: wie weit ein Winkel ausholt und wie weit die Reihen stehen. */
  wing: 5,
  peak: 4.4,
  tip: 19.6,
  upper: 9,
  lower: 15,
  apart: 2.6,
  rows: 3,
  /**
   * Wie schräg ein Blatt in der Schraube steht, in Grad.
   *
   * @remarks
   * Fünfundzwanzig. Gerade Blätter sind Blütenblätter; erst die Steigung macht
   * aus dem Stern eine Schraube, die Wasser nach hinten wirft.
   */
  pitch: 25,
  /** Schraube: Grundgröße, Zuwachs je Blatt, Nabe. */
  reach: 5.5,
  perBlade: 1.4,
  hub: 2.6,
  /**
   * Wie schmal ein Blatt ist, als Teiler seiner Länge.
   *
   * @remarks
   * Knapp vier: Breitere Blätter sehen bei fünf Stück nach Blüte aus und nicht
   * nach Schraube - das ist der Unterschied zwischen einem Antrieb und einer
   * Dekoration.
   */
  slim: 3.9,
} as const;

/** Props of {@link UpgradeIcon}. */
export type UpgradeIconProps = {
  /** Which track it belongs to. */
  readonly id: UpgradeId;
  /** Which step of it, counted from zero. */
  readonly step: number;
  /** How big it is drawn, as a Tailwind size class pair. */
  readonly className?: string;
};

/**
 * Mit wie vielen Blättern die kleinste Schraube anfängt.
 *
 * @remarks
 * Drei. Zwei Blätter ergeben zwei Ellipsen auf einer Linie - das liest sich
 * als Stab und nicht als Propeller, und damit wäre die erste Stufe die
 * einzige, die man nicht erkennt.
 */
const SCREW_FROM = 3;

/** The colours, so all six tracks look like one set. */
const INK = {
  air: "#7fd8f5",
  airLight: "#dff6ff",
  steel: "#9fb2c4",
  steelDark: "#5b6b7c",
  brass: "#f0b429",
  warm: "#ffd97a",
  hot: "#ff6b3d",
  deep: "#24323f",
} as const;

/**
 * Renders one upgrade symbol.
 *
 * @param props - which track, which step and how big
 * @returns the drawing
 */
export function UpgradeIcon({
  id,
  step,
  className = "h-8 w-8",
}: UpgradeIconProps): ReactElement {
  let art: ReactElement;

  switch (id) {
    case "oxygen":
      art = <Bubbles count={step + 1} />;
      break;
    case "armour":
      art = <Shield plates={step + 1} />;
      break;
    case "weapon":
      art = <Arms kind={step} />;
      break;
    case "light":
      art = step > 0 ? <Sonar /> : <Lamp />;
      break;
    case "dive":
      art = <Planes count={step + 1} />;
      break;
    default:
      art = <Screw blades={step + SCREW_FROM} />;
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {art}
    </svg>
  );
}

/** Where the bubbles sit, from the biggest to the smallest. */
const BUBBLES = [
  { x: 8, y: 16, r: 5.4 },
  { x: 15, y: 11, r: 4.1 },
  { x: 18.5, y: 5.5, r: 3 },
  { x: 11.5, y: 4.5, r: 2.2 },
] as const;

/** Luft: je Stufe eine Blase mehr. */
function Bubbles({ count }: { readonly count: number }): ReactElement {
  return (
    <g>
      {BUBBLES.slice(0, count).map((one) => (
        <g key={`${one.x}-${one.y}`}>
          <circle cx={one.x} cy={one.y} r={one.r} fill={INK.air} />
          <circle
            cx={one.x - one.r / SIZE.gloss}
            cy={one.y - one.r / SIZE.gloss}
            r={one.r / SIZE.gloss}
            fill={INK.airLight}
          />
        </g>
      ))}
    </g>
  );
}

/** Die Panzerplatten, von unten nach oben. */
const PLATES: readonly number[] = [
  SIZE.plates.low,
  SIZE.plates.middle,
  SIZE.plates.high,
];

/** Rüstung: je Stufe eine Platte mehr auf dem Schild. */
function Shield({ plates }: { readonly plates: number }): ReactElement {
  return (
    <g>
      <path
        d="M12 1.6 20.5 4.8 V12 C20.5 17.2 16.6 20.8 12 22.4 7.4 20.8 3.5 17.2 3.5 12 V4.8 Z"
        fill={INK.steel}
        stroke={INK.steelDark}
        strokeWidth={plates > SIZE.thick ? SIZE.thick : SIZE.thin}
      />
      {PLATES.slice(0, plates - 1).map((y) => (
        <rect
          key={y}
          x="5.2"
          y={y}
          width="13.6"
          height="1.8"
          rx="0.9"
          fill={INK.steelDark}
        />
      ))}
      {plates > SIZE.star && (
        <path
          d="M12 6 13.6 9.6 17.4 10 14.6 12.6 15.4 16.4 12 14.5 8.6 16.4 9.4 12.6 6.6 10 10.4 9.6 Z"
          fill={INK.brass}
        />
      )}
    </g>
  );
}

/** Bewaffnung: Harpune, Torpedo, Seemine - drei Dinge, drei Formen. */
function Arms({ kind }: { readonly kind: number }): ReactElement {
  let art: ReactElement;

  if (kind === 0) {
    // Harpune: Schaft, Widerhaken, Spitze.
    art = (
      <g stroke={INK.steel} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M3 20 L16.5 6.5" />
        <path d="M11 7.5 L16.5 6.5 L15.5 12" strokeWidth="1.6" />
        <path d="M16.5 6.5 L21 2" stroke={INK.brass} />
      </g>
    );
  } else if (kind === 1) {
    // Torpedo: Nase, Körper, Leitwerk.
    art = (
      <g>
        <path
          d="M3.5 12 C3.5 9.5 7 8 12 8 c4.5 0 7.5 1.6 8.5 4 -1 2.4 -4 4 -8.5 4 -5 0 -8.5 -1.5 -8.5 -4 Z"
          fill={INK.steel}
          stroke={INK.steelDark}
          strokeWidth="1"
        />
        <path d="M3.5 12 L1 8 L1 16 Z" fill={INK.steelDark} />
        <circle cx="18" cy="12" r="1.6" fill={INK.hot} />
      </g>
    );
  } else {
    // Seemine: Kugel mit Stacheln, wie die im Wasser.
    art = (
      <g>
        {Array.from({ length: SIZE.spikes }, (_, spike) => {
          const turn =
            ((spike * SIZE.turn) / SIZE.spikes / SIZE.half) * Math.PI;
          return (
            <line
              key={spike}
              x1={SIZE.middle + Math.cos(turn) * SIZE.ball}
              y1={SIZE.middle + Math.sin(turn) * SIZE.ball}
              x2={SIZE.middle + Math.cos(turn) * SIZE.spike}
              y2={SIZE.middle + Math.sin(turn) * SIZE.spike}
              stroke={INK.steelDark}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="12" cy="12" r="6.5" fill={INK.deep} />
        <circle cx="14.4" cy="9.6" r="1.5" fill={INK.hot} />
      </g>
    );
  }

  return art;
}

/** Licht, erste Stufe: der Scheinwerfer mit seinem Kegel. */
function Lamp(): ReactElement {
  return (
    <g>
      <path d="M9 12 L22 5.5 V18.5 Z" fill={INK.warm} opacity="0.75" />
      <rect
        x="2.5"
        y="8.5"
        width="7"
        height="7"
        rx="1.6"
        fill={INK.steel}
        stroke={INK.steelDark}
        strokeWidth="1"
      />
      <circle cx="9" cy="12" r="2.2" fill={INK.warm} />
    </g>
  );
}

/** Und zweite Stufe: das Sonar, das weiter reicht als jedes Licht. */
function Sonar(): ReactElement {
  return (
    <g fill="none" stroke={INK.air} strokeWidth="2" strokeLinecap="round">
      <path d="M8 4.5 A 9.5 9.5 0 0 1 8 19.5" />
      <path d="M6 8 A 5.5 5.5 0 0 1 6 16" opacity="0.8" />
      <path d="M4 11 A 2 2 0 0 1 4 13" opacity="0.6" />
      <circle cx="4" cy="12" r="2" fill={INK.steel} stroke="none" />
    </g>
  );
}

/** Tiefenruder: je Stufe ein Winkel mehr, nach oben und nach unten. */
function Planes({ count }: { readonly count: number }): ReactElement {
  return (
    <g stroke={INK.brass} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <line x1="12" y1="5" x2="12" y2="19" stroke={INK.steel} />
      {Array.from({ length: Math.min(count, SIZE.rows) }, (_, row) => {
        const left = SIZE.middle - SIZE.wing - row;
        const right = SIZE.middle + SIZE.wing + row;
        const up = SIZE.upper - row * SIZE.apart;
        const down = SIZE.lower + row * SIZE.apart;
        return (
          <g key={row}>
            <path
              d={`M${left} ${up} L${SIZE.middle} ${SIZE.peak - row * SIZE.apart} L${right} ${up}`}
            />
            <path
              d={`M${left} ${down} L${SIZE.middle} ${SIZE.tip + row * SIZE.apart} L${right} ${down}`}
            />
          </g>
        );
      })}
    </g>
  );
}

/** Antrieb: je Stufe ein Blatt mehr an der Schraube - und eine größere. */
function Screw({ blades }: { readonly blades: number }): ReactElement {
  const reach = SIZE.reach + blades * SIZE.perBlade;
  return (
    <g>
      {Array.from({ length: blades }, (_, blade) => {
        const turn = (blade * SIZE.turn) / blades;
        return (
          <ellipse
            key={blade}
            cx="12"
            cy={SIZE.middle - reach / 2}
            rx={reach / SIZE.slim}
            ry={reach / 2}
            fill={INK.steel}
            stroke={INK.steelDark}
            strokeWidth="0.8"
            transform={`rotate(${turn} ${SIZE.middle} ${SIZE.middle}) rotate(${SIZE.pitch} ${SIZE.middle} ${SIZE.middle - reach / 2})`}
          />
        );
      })}
      <circle
        cx="12"
        cy="12"
        r={SIZE.hub}
        fill={INK.brass}
        stroke={INK.steelDark}
        strokeWidth="0.8"
      />
    </g>
  );
}
