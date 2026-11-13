/**
 * Pictures of every kind of ship and land unit, in the style of the other
 * symbols: a side view of the ship (masts, sails, funnels, gun ports) and a
 * figure with the unit's gear, drawn in code.
 *
 * @module
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import type { ShipKind, UnitKind } from "@/games/imperavis/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- drawing coordinates */

/** Colours of the pictures. */
const HULL = "#7a5434";
const HULL_DARK = "#3e2c20";
const STEEL = "#5f6670";
const SAIL = "#efe6cf";
const GOLD = "#d6b04c";
const SMOKE = "#9a948a";
const SKIN = "#e0b48a";
const COAT = "#b33b2e";
const METAL = "#a9aeb6";
const WOOD = "#8a6239";

/** A sail on a mast at x, from top to bottom, this wide. */
function sail(
  x: number,
  top: number,
  bottom: number,
  width: number,
): ReactNode {
  return (
    <>
      <path d={`M${x} ${top - 2}V${bottom + 2}`} stroke={HULL_DARK} />
      <path
        d={`M${x - width / 2} ${top}Q${x} ${top + 1.5} ${x + width / 2} ${top}L${x + width / 2 + 1} ${bottom}Q${x} ${bottom + 2} ${x - width / 2 - 1} ${bottom}z`}
        fill={SAIL}
        stroke="#b9ad90"
        strokeWidth="0.6"
      />
    </>
  );
}

/** Gun ports along a hull at a height, from x1 to x2. */
function ports(y: number, x1: number, x2: number, count: number): ReactNode {
  const step = (x2 - x1) / Math.max(1, count - 1);
  return (
    <>
      {Array.from({ length: count }, (_, k) => (
        <rect
          key={k}
          x={x1 + k * step - 0.8}
          y={y - 0.8}
          width="1.6"
          height="1.6"
          fill="#141414"
        />
      ))}
    </>
  );
}

/** A hull from x1 to x2 at the waterline, this high, with a raised stern. */
function hull(
  x1: number,
  x2: number,
  depth: number,
  color: string,
  stern = 0,
): ReactNode {
  return (
    <path
      d={`M${x1} ${24 - depth - stern}L${x1 + 2} 26H${x2 - 4}L${x2} ${24 - depth}H${x1 + 6}V${24 - depth - stern}z`}
      fill={color}
      stroke={HULL_DARK}
      strokeWidth="0.8"
    />
  );
}

/** The drawing of each ship kind. */
const SHIP_DRAW: Readonly<Record<ShipKind, ReactNode>> = {
  cog: (
    <>
      {sail(24, 6, 18, 11)}
      {hull(12, 36, 4, HULL)}
    </>
  ),
  hulk: (
    <>
      {sail(17, 4, 18, 8)}
      {sail(25, 2, 18, 9)}
      {sail(32, 5, 18, 7)}
      <path d="M36 20L44 17" stroke={HULL_DARK} />
      {hull(8, 40, 3.5, "#9a6a3c")}
    </>
  ),
  galleon: (
    <>
      {sail(18, 5, 16, 9)}
      {sail(28, 3, 16, 11)}
      <rect x="12" y="17" width="5" height="3" fill={WOOD} />
      <rect x="31" y="17" width="5" height="3" fill={WOOD} />
      {hull(5, 43, 5, HULL, 3)}
      <path d="M7 21H41" stroke={GOLD} strokeWidth="0.8" />
    </>
  ),
  steamer: (
    <>
      {sail(14, 7, 15, 6)}
      <rect x="22" y="8" width="4" height="10" fill="#2b2b2e" />
      <path d="M22 11h4" stroke={COAT} />
      <circle cx="25" cy="5" r="2.5" fill={SMOKE} opacity="0.7" />
      <circle cx="29" cy="3" r="2" fill={SMOKE} opacity="0.5" />
      <rect
        x="27"
        y="15"
        width="9"
        height="4"
        fill="#e9e2d0"
        stroke={HULL_DARK}
        strokeWidth="0.5"
      />
      {hull(5, 43, 5, "#3d3a37")}
      <circle
        cx="20"
        cy="22"
        r="3.4"
        fill="none"
        stroke={HULL_DARK}
        strokeWidth="1"
      />
    </>
  ),
  warship: (
    <>
      {sail(24, 7, 18, 9)}
      {hull(14, 36, 4, HULL_DARK)}
      <path d="M15 21.5H35" stroke={COAT} strokeWidth="1" />
      {ports(23.5, 19, 31, 3)}
    </>
  ),
  frigate: (
    <>
      {sail(19, 4, 16, 9)}
      {sail(29, 6, 16, 8)}
      {hull(8, 42, 4.5, "#4a3a2c")}
      <path d="M10 21H40" stroke="#5a7184" strokeWidth="1" />
      {ports(23.4, 13, 37, 6)}
    </>
  ),
  lineShip: (
    <>
      {sail(15, 4, 14, 8)}
      {sail(24, 2, 14, 10)}
      {sail(33, 4, 14, 8)}
      {hull(4, 44, 7, HULL_DARK, 2)}
      <path d="M6 19.5H42M6 22.5H42" stroke={GOLD} strokeWidth="0.6" />
      {ports(21, 9, 39, 8)}
      {ports(24, 9, 39, 8)}
    </>
  ),
  cruiser: (
    <>
      <rect x="19" y="9" width="3.5" height="8" fill="#2b2b2e" />
      <rect x="25" y="9" width="3.5" height="8" fill="#2b2b2e" />
      <circle cx="22" cy="6" r="2.4" fill={SMOKE} opacity="0.65" />
      <rect
        x="14"
        y="14"
        width="18"
        height="4"
        fill={STEEL}
        stroke="#30343a"
        strokeWidth="0.5"
      />
      <rect x="8" y="16" width="5" height="2.5" fill={STEEL} />
      <path d="M8 17.2H3" stroke="#30343a" strokeWidth="1.2" />
      <rect x="34" y="16" width="5" height="2.5" fill={STEEL} />
      <path d="M39 17.2H45" stroke="#30343a" strokeWidth="1.2" />
      <path
        d="M2 18.5L5 26H40L46 18.5z"
        fill={STEEL}
        stroke="#30343a"
        strokeWidth="0.8"
      />
      <path d="M33 14V5M31 7h4" stroke="#30343a" />
    </>
  ),
  trader: (
    <>
      {sail(18, 5, 17, 9)}
      {sail(28, 4, 17, 10)}
      {hull(7, 41, 4.5, "#5d3f2a")}
    </>
  ),
  pirate: (
    <>
      {sail(24, 5, 17, 11)}
      {hull(10, 38, 4, "#2b2420")}
      <rect x="24" y="1" width="6" height="3.5" fill="#111" />
    </>
  ),
};

/** A standing figure in a coat, with what it holds. */
function figure(gear: ReactNode, coat = COAT, hat?: ReactNode): ReactNode {
  return (
    <>
      <path d="M13 27l1.2-8M19 27l-1.2-8" stroke="#2a2a2a" strokeWidth="1.6" />
      <path
        d="M12 19l1-8h6l1 8z"
        fill={coat}
        stroke="#4a1a14"
        strokeWidth="0.6"
      />
      <circle cx="16" cy="8" r="2.6" fill={SKIN} />
      {hat ?? <path d="M13 6.5h6l-.6-2.4h-4.8z" fill="#222" />}
      {gear}
    </>
  );
}

/** A horse with a rider in a coat. */
function rider(gear: ReactNode, coat = COAT): ReactNode {
  return (
    <>
      <path
        d="M5 18c2-3 14-3.5 18-1.5l4-4 2 1-3 6c0 2-1 3-3 3H8c-2 0-3-1.5-3-4.5z"
        fill="#6b4a2f"
      />
      <path
        d="M8 22l-1 6M12 22.5l-.5 5.5M20 22.5l1 5.5M23 21.5l2 6"
        stroke="#4a3322"
        strokeWidth="1.4"
      />
      <path d="M13 17l1-6h4l1 6z" fill={coat} />
      <circle cx="16" cy="8.5" r="2.3" fill={SKIN} />
      <path d="M13.5 7h5l-.5-2h-4z" fill="#222" />
      {gear}
    </>
  );
}

/** The drawing of each unit kind. */
const UNIT_DRAW: Readonly<Record<UnitKind, ReactNode>> = {
  militia: figure(
    <path d="M22 4L21 27M22 4l-1.4 3h2.8z" stroke={WOOD} fill={METAL} />,
    "#7d6a4a",
    <path d="M12.8 7c1-2.6 5.4-2.6 6.4 0z" fill="#5a4a30" />,
  ),
  line: figure(
    <path
      d="M21.5 3.5L20.5 26M21.5 3.5l-.6-2"
      stroke={WOOD}
      strokeWidth="1.3"
    />,
  ),
  grenadier: figure(
    <>
      <circle cx="23" cy="15" r="2.4" fill="#222" />
      <path d="M23 12.6l1-1.6" stroke={GOLD} />
    </>,
    COAT,
    <path d="M13.2 6.5L16 1.5l2.8 5z" fill="#2c2c3a" />,
  ),
  elite: figure(
    <path
      d="M21.5 3L20.5 26M21.5 3l-.5-2.5M9 12l-3 7 3 1"
      stroke={WOOD}
      strokeWidth="1.3"
    />,
    "#2f3f78",
    <path d="M12.8 6.6h6.4l-.4-3.4-2.8-1.4-2.8 1.4z" fill={GOLD} />,
  ),
  musketeer: figure(
    <path d="M10 13L27 9" stroke={WOOD} strokeWidth="1.6" />,
    "#3e6a3a",
  ),
  sharpshooter: figure(
    <>
      <path d="M9 13.5L29 10" stroke={WOOD} strokeWidth="1.4" />
      <rect x="19" y="10" width="4" height="1.6" fill="#333" />
    </>,
    "#4e5b3a",
    <path d="M12.5 6.6c.5-3 6.5-3 7 0l2 .4h-11z" fill="#3a3a2a" />,
  ),
  artillery: (
    <>
      <path d="M6 18l18-6 1.6 3.6-18 6z" fill="#2f3036" />
      <circle
        cx="11"
        cy="22"
        r="5"
        fill="none"
        stroke={WOOD}
        strokeWidth="1.6"
      />
      <path d="M11 17v10M6 22h10" stroke={WOOD} />
      <path d="M17 23l9 4" stroke={WOOD} strokeWidth="1.6" />
      <circle cx="26" cy="6" r="2.2" fill={SKIN} />
      <path d="M24.5 9l-1 7h5l-1-7z" fill={COAT} />
    </>
  ),
  cavalry: rider(<path d="M20 4L27 16" stroke={METAL} strokeWidth="1.3" />),
  pioneer: figure(
    <>
      <path d="M22 6L21 26" stroke={WOOD} strokeWidth="1.4" />
      <path d="M19.5 5.5c1.5-1.5 4-1.5 5 0z" fill={METAL} />
    </>,
    "#7a5a2a",
  ),
  medic: figure(
    <>
      <rect
        x="20"
        y="13"
        width="6"
        height="5"
        fill="#f1ede2"
        stroke="#8a8478"
        strokeWidth="0.5"
      />
      <path d="M23 14v3M21.5 15.5h3" stroke="#c0392b" strokeWidth="1.1" />
    </>,
    "#e9e2d0",
  ),
  scout: rider(
    <path d="M18 9l7-2" stroke="#3a3a3a" strokeWidth="1.6" />,
    "#5c7a5c",
  ),
};

/**
 * The picture of a ship kind, seen from the side.
 *
 * @param props - the kind and the width in px
 * @returns the picture
 */
export function ShipArt({
  kind,
  size = 48,
}: {
  readonly kind: ShipKind;
  readonly size?: number;
}): ReactElement {
  return (
    <svg
      viewBox="0 0 48 30"
      width={size}
      height={(size * 30) / 48}
      fill="none"
      stroke="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
      data-ship-art={kind}
    >
      <path
        d="M0 26.5Q6 25 12 26.5T24 26.5T36 26.5T48 26.5V30H0z"
        fill="#2e5d78"
      />
      <g stroke={HULL_DARK} strokeWidth="0.8">
        {SHIP_DRAW[kind]}
      </g>
    </svg>
  );
}

/**
 * The picture of a kind of land unit.
 *
 * @param props - the kind and the size in px
 * @returns the picture
 */
export function UnitArt({
  kind,
  size = 40,
}: {
  readonly kind: UnitKind;
  readonly size?: number;
}): ReactElement {
  return (
    <svg
      viewBox="0 0 32 30"
      width={size}
      height={(size * 30) / 32}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
      data-unit-art={kind}
    >
      <ellipse cx="16" cy="28" rx="11" ry="1.6" fill="#000" opacity="0.25" />
      {UNIT_DRAW[kind]}
    </svg>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
