/**
 * Pictures of the foreign peoples and pirate bands: a portrait of each
 * ruler in a medallion and a small coat of arms for lists, drawn as inline
 * SVG in the faction's own colours.
 *
 * @module
 */
"use client";

import { useId, type ReactElement, type ReactNode } from "react";
import type { CultureId } from "@/games/imperavis/engine/types";
import { CULTURE } from "@/games/imperavis/engine/factions-data";

/* eslint-disable @typescript-eslint/no-magic-numbers -- drawing coordinates */

/** Colours shared by the pictures. */
const GOLD = "#e3c27a";
const GOLD_DARK = "#8a6a32";
const BONE = "#ece4d2";
const INK = "#1b1714";
const LINE = "#241c16";

/** The two colours of a faction, as CSS colours. */
type Palette = { readonly main: string; readonly accent: string };

/** Draws the inside of a portrait (background, bust, headwear) in a palette. */
type Painter = (colors: Palette) => ReactNode;

/** The common bust: shoulders in a garment colour, neck and face in a skin tone. */
type BustProps = {
  readonly garment: string;
  readonly skin: string;
  /** Drawn behind the head (hair, a scarf, a collar). */
  readonly behind?: ReactNode;
  /** Drawn over the head and shoulders (headwear, trims, jewellery). */
  readonly over?: ReactNode;
};

/** The portrait of each ruler. */
const PORTRAIT: Readonly<Record<CultureId, Painter>> = {
  qasirah: ({ main, accent }) => (
    <>
      <path
        d="M14 30V24Q14 14 22 10Q20 16 22 20H42Q44 16 42 10Q50 14 50 24V30"
        fill={accent}
        fillOpacity="0.18"
      />
      <path d="M10 64V44h44v20z" fill={INK} fillOpacity="0.15" />
      {bust({
        garment: shade(main, -0.25),
        skin: "#c68e64",
        behind: (
          <path
            d="M21 46C18 34 20 17 32 15.5C44 17 46 34 43 46z"
            fill={main}
            stroke={LINE}
            strokeWidth="0.6"
          />
        ),
        over: (
          <>
            <path
              d="M22 40C20 46 16 50 14 58H24C25 52 26 46 26 42z"
              fill={main}
              stroke={LINE}
              strokeWidth="0.5"
            />
            <path
              d="M24.5 22.5Q32 18.5 39.5 22.5"
              fill="none"
              stroke={accent}
              strokeWidth="1.8"
            />
            <path d="M32 18l1.6 2.4L32 22.6 30.4 20.4z" fill={accent} />
            <circle cx="32" cy="20.4" r="0.7" fill="#c0392b" />
            <path
              d="M26 44Q32 50 38 44"
              fill="none"
              stroke={accent}
              strokeWidth="1.4"
            />
            <circle cx="32" cy="49" r="1.4" fill={accent} />
          </>
        ),
      })}
    </>
  ),
  shogunara: ({ main, accent }) => (
    <>
      <circle cx="32" cy="22" r="15" fill={accent} fillOpacity="0.85" />
      <path
        d="M8 16Q14 11 20 14Q15 14 13 18M10 22Q15 18 20 20"
        fill="none"
        stroke={shade(main, -0.3)}
        strokeWidth="1"
      />
      <path
        d="M44 12Q50 9 56 12Q51 12 49 15"
        fill="none"
        stroke={shade(main, -0.3)}
        strokeWidth="1"
      />
      {bust({
        garment: main,
        skin: "#e6c3a0",
        behind: (
          <>
            <ellipse cx="32" cy="13.5" rx="10" ry="6.5" fill="#1f1a1c" />
            <ellipse cx="23.5" cy="22" rx="3.5" ry="6" fill="#1f1a1c" />
            <ellipse cx="40.5" cy="22" rx="3.5" ry="6" fill="#1f1a1c" />
          </>
        ),
        over: (
          <>
            <path
              d="M24.5 23Q26 16 32 16.5Q38 16 39.5 23Q36 19 32 19.5Q28 19 24.5 23z"
              fill="#1f1a1c"
            />
            <path
              d="M20 9.5L44 17M44 9.5L20 17"
              stroke={GOLD}
              strokeWidth="0.9"
            />
            <circle cx="20" cy="9.5" r="1.3" fill={GOLD} />
            <circle cx="44" cy="9.5" r="1.3" fill={GOLD} />
            <circle
              cx="32"
              cy="9"
              r="1.6"
              fill={accent}
              stroke={GOLD}
              strokeWidth="0.5"
            />
            <path
              d="M25 41L32 53L39 41"
              fill="none"
              stroke={accent}
              strokeWidth="2.4"
            />
            <path
              d="M27.5 41L32 49L36.5 41"
              fill="none"
              stroke={GOLD}
              strokeWidth="1"
            />
            <path
              d="M14 58Q24 54 32 56Q40 54 50 58"
              fill="none"
              stroke={shade(main, 0.25)}
              strokeWidth="1.2"
            />
          </>
        ),
      })}
    </>
  ),
  valdoria: ({ main, accent }) => (
    <>
      <path
        d="M10 40V26a6 6 0 0 1 12 0v14M42 40V26a6 6 0 0 1 12 0v14"
        fill="none"
        stroke={BONE}
        strokeOpacity="0.35"
        strokeWidth="1.4"
      />
      {bust({
        garment: main,
        skin: "#e0b48a",
        behind: (
          <>
            <ellipse cx="25" cy="31" rx="2.6" ry="5" fill="#6b4a33" />
            <ellipse cx="39" cy="31" rx="2.6" ry="5" fill="#6b4a33" />
          </>
        ),
        over: (
          <>
            <path
              d="M24 24.5C23.5 15 29 10.5 36 11.5C41 12.5 42 18 40.5 24.5z"
              fill={accent}
              stroke={LINE}
              strokeWidth="0.6"
            />
            <path d="M23.8 24.5H40.6V22.6H23.8z" fill={BONE} />
            <path
              d="M24 22.6Q32 21 40.6 22.6"
              fill="none"
              stroke={GOLD}
              strokeWidth="0.8"
            />
            <path
              d="M18 46Q22 41 28 41L32 45L36 41Q42 41 46 46Q40 49 32 48Q24 49 18 46z"
              fill={BONE}
              stroke={LINE}
              strokeWidth="0.5"
            />
            <path
              d="M22 46.5Q32 58 42 46.5"
              fill="none"
              stroke={GOLD}
              strokeWidth="1.4"
              strokeDasharray="1.6 1"
            />
            <circle
              cx="32"
              cy="54"
              r="2.6"
              fill={GOLD}
              stroke={GOLD_DARK}
              strokeWidth="0.6"
            />
            <circle cx="32" cy="54" r="1" fill={accent} />
          </>
        ),
      })}
    </>
  ),
  skeld: ({ main, accent }) => (
    <>
      <path
        d="M4 44L16 30L24 38L34 26L46 38L52 32L62 44z"
        fill={accent}
        fillOpacity="0.25"
      />
      <path d="M16 30l-3 3.5M34 26l-3.5 4" stroke={BONE} strokeOpacity="0.6" />
      {bust({
        garment: main,
        skin: "#ecc9a8",
        behind: (
          <path
            d="M24 24C23 18 27 17 32 17S41 18 40 24L41 34H23z"
            fill="#b88a4a"
          />
        ),
        over: (
          <>
            {braid(24)}
            {braid(40)}
            <path
              d="M24 24C24 15 40 15 40 24z"
              fill="#9aa3ab"
              stroke={LINE}
              strokeWidth="0.6"
            />
            <path
              d="M23.6 24H40.4"
              stroke={shade(accent, -0.35)}
              strokeWidth="1.6"
            />
            <path
              d="M32 16.5V23.5"
              stroke={shade(accent, -0.2)}
              strokeWidth="1"
            />
            <path
              d="M14 52Q14 42 22 40Q24 44 28 43Q32 46 36 43Q40 44 42 40Q50 42 50 52Q46 49 42 51Q38 48 32 50Q26 48 22 51Q18 49 14 52z"
              fill="#8a7560"
              stroke={LINE}
              strokeWidth="0.5"
            />
            <path
              d="M20 45l1.5 2M26 46.5l1 2M38 46.5l-1 2M44 45l-1.5 2"
              stroke="#5e4e3e"
              strokeWidth="0.8"
            />
            <circle
              cx="32"
              cy="53"
              r="1.8"
              fill={accent}
              stroke={LINE}
              strokeWidth="0.5"
            />
          </>
        ),
      })}
    </>
  ),
  crows: ({ accent }) => (
    <>
      <path
        d="M4 56Q12 52 20 56T36 56T52 56T68 56"
        fill="none"
        stroke={accent}
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      <circle cx="16" cy="16" r="3" fill={accent} fillOpacity="0.5" />
      {bust({
        garment: "#2e2b28",
        skin: "#d4a27a",
        behind: <path d="M24 22V36H40V22z" fill="#2a211c" />,
        over: (
          <>
            <path d="M25 24.5L39 29.5" stroke={INK} strokeWidth="0.8" />
            <ellipse cx="35.5" cy="28" rx="2.4" ry="2" fill={INK} />
            <path
              d="M24 19C24.5 11 39.5 11 40 19z"
              fill="#111"
              stroke={accent}
              strokeWidth="0.5"
            />
            <path
              d="M17 20.5Q32 12.5 47 20.5Q40 17.5 32 22Q24 17.5 17 20.5z"
              fill="#111"
              stroke={accent}
              strokeWidth="0.9"
            />
            <path
              d="M40 15.5C44 11 48 9 52 8.5C49 11 46 14 41 17z"
              fill="#1d2230"
              stroke={accent}
              strokeWidth="0.5"
            />
            <path d="M41 16.6L51 9" stroke={accent} strokeWidth="0.4" />
            <path
              d="M27 41L32 52L37 41"
              fill={BONE}
              stroke={LINE}
              strokeWidth="0.5"
            />
            <path
              d="M22 42L28 41L32 56M42 42L36 41L32 56"
              fill="none"
              stroke={accent}
              strokeWidth="1.1"
            />
            <circle cx="25" cy="50" r="0.9" fill={GOLD} />
            <circle cx="39" cy="50" r="0.9" fill={GOLD} />
          </>
        ),
      })}
    </>
  ),
  blackreef: ({ main, accent }) => (
    <>
      <path
        d="M13 46V30M13 40l-4-5M9 35v-3M13 35l3-4M16 31l1-3M51 46V28M51 38l4-5M55 33v-3M51 33l-3-4M48 29l-1-3"
        fill="none"
        stroke={accent}
        strokeOpacity="0.7"
        strokeWidth="1.6"
      />
      <circle cx="9" cy="31" r="1" fill={accent} fillOpacity="0.7" />
      <circle cx="55" cy="29" r="1" fill={accent} fillOpacity="0.7" />
      {bust({
        garment: "#2b2422",
        skin: "#b9805a",
        behind: (
          <path
            d="M23 22C21 30 21 40 18 46H28V30H36V46H46C43 40 43 30 41 22z"
            fill="#4a2a1e"
          />
        ),
        over: (
          <>
            <path
              d="M23.5 25C23 16 28 14 32 14S41 16 40.5 25Q32 21 23.5 25z"
              fill={main}
              stroke={LINE}
              strokeWidth="0.6"
            />
            <path
              d="M24.5 21.5Q32 18.5 40 21.5"
              fill="none"
              stroke={accent}
              strokeWidth="0.7"
              strokeDasharray="1 1.2"
            />
            <path
              d="M40.5 23L45 26L44 30L41.5 26.5L43 32L39.5 26z"
              fill={main}
              stroke={LINE}
              strokeWidth="0.5"
            />
            <circle
              cx="24.4"
              cy="31"
              r="1"
              fill="none"
              stroke={GOLD}
              strokeWidth="0.7"
            />
            <path
              d="M22 42L28 41L32 54L36 41L42 42"
              fill="none"
              stroke={accent}
              strokeWidth="1.2"
            />
            <path
              d="M32 45V51M32 47l-2-2M32 48l2.2-2"
              fill="none"
              stroke="#e0705a"
              strokeWidth="1"
            />
          </>
        ),
      })}
    </>
  ),
};

/** The symbol on each faction's coat of arms, on a 48 x 56 shield. */
const CREST_SYMBOL: Readonly<Record<CultureId, Painter>> = {
  qasirah: ({ main, accent }) => (
    <g fill={accent}>
      <path d="M14 37h20v-7H14z" />
      <path d="M17.5 30Q17.5 22 24 19.5Q30.5 22 30.5 30z" />
      <path d="M11.5 37V24h2v13zM34.5 37V24h2v13z" />
      <circle cx="12.5" cy="23" r="1.2" />
      <circle cx="35.5" cy="23" r="1.2" />
      <path d="M22.5 37v-4a1.5 1.5 0 0 1 3 0v4z" fill={main} />
      <path d="M24 11.5a3.6 3.6 0 1 0 3.4 4.8a2.9 2.9 0 1 1-3.4-4.8z" />
    </g>
  ),
  shogunara: ({ main, accent }) => (
    <>
      <g fill={accent}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="24"
            cy="20.5"
            rx="3.6"
            ry="5.6"
            transform={`rotate(${angle} 24 27)`}
          />
        ))}
      </g>
      <circle cx="24" cy="27" r="2.6" fill={main} />
      <circle cx="24" cy="27" r="1.2" fill={GOLD} />
    </>
  ),
  valdoria: ({ accent }) => (
    <g fill="none" stroke={BONE} strokeWidth="1.4">
      <path d="M24 12.5V35M15 16.5H33" />
      <path
        d="M15 16.5L12 24M15 16.5L18 24M33 16.5L30 24M33 16.5L36 24"
        strokeWidth="0.8"
      />
      <path d="M11 24a4 2.5 0 0 0 8 0zM29 24a4 2.5 0 0 0 8 0z" fill={BONE} />
      <path
        d="M13 35h22l-3.5 5h-15z"
        fill={accent}
        stroke={BONE}
        strokeWidth="1"
      />
      <circle cx="24" cy="12" r="1.3" fill={GOLD} stroke="none" />
    </g>
  ),
  skeld: ({ accent }) => (
    <g fill="none" stroke={accent} strokeLinecap="round">
      <path
        d="M12 38Q26 39 30 29Q33 21 28 17Q24 15 22.5 18.5Q21.5 22 26 22"
        strokeWidth="2.6"
      />
      <path d="M10 38h22l-3 4H14z" fill={accent} strokeWidth="1" />
      <path d="M14 34.5h.1M18.5 35h.1M23 34h.1" strokeWidth="2.2" />
    </g>
  ),
  crows: ({ accent }) => (
    <>
      <g fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round">
        <path d="M13 41Q21 33 33 25M35 41Q27 33 15 25" />
        <path d="M14 37l3 3M34 37l-3 3" strokeWidth="1.2" />
      </g>
      <path
        d="M14 21Q18 15.5 25 16.5L29 13L28.6 17Q33.5 18.5 34 22L38 24.5L32 24.6Q26 27.5 19.5 24.5z"
        fill={accent}
      />
      <circle cx="29.6" cy="17.8" r="0.7" fill="#151515" />
    </>
  ),
  blackreef: ({ main, accent }) => (
    <>
      <path
        d="M24 44V34M24 37l-5-5M19 32v-3M24 39l5-5M29 34l2-3M19.5 40l-4-2"
        fill="none"
        stroke="#e0705a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="19.5" r="6.5" fill={accent} />
      <path d="M20.5 24h7v4.5h-7z" fill={accent} />
      <circle cx="21.6" cy="19.5" r="1.7" fill={main} />
      <circle cx="26.4" cy="19.5" r="1.7" fill={main} />
      <path d="M24 22l-.9 1.6h1.8z" fill={main} />
      <path
        d="M22.3 26.2v2.3M24 26.2v2.3M25.7 26.2v2.3"
        stroke={main}
        strokeWidth="0.6"
      />
    </>
  ),
};

/** Props of the faction pictures. */
type FactionArtProps = {
  readonly culture: CultureId;
  /** Width in px. */
  readonly size: number;
};

/**
 * The ruler of a faction as a bust in a medallion of the faction's colours.
 *
 * @param props - the faction and the width in px
 * @returns the portrait
 */
export function FactionPortrait({
  culture,
  size,
}: FactionArtProps): ReactElement {
  const colors = paletteOf(culture);
  const id = `imp-fp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 drop-shadow"
      data-testid="imp-faction-portrait"
      data-culture={culture}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx="32" cy="32" r="27.5" />
        </clipPath>
        <radialGradient id={`${id}-light`} cx="0.5" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31.5" fill={GOLD_DARK} />
      <circle cx="32" cy="32" r="30.5" fill={colors.accent} />
      <circle
        cx="32"
        cy="32"
        r="30.5"
        fill="none"
        stroke={GOLD}
        strokeWidth="0.6"
        strokeDasharray="0.8 2.2"
      />
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="64" height="64" fill={colors.main} />
        <rect width="64" height="64" fill={`url(#${id}-light)`} />
        {PORTRAIT[culture](colors)}
      </g>
      <circle
        cx="32"
        cy="32"
        r="27.5"
        fill="none"
        stroke={LINE}
        strokeWidth="0.8"
      />
    </svg>
  );
}

/**
 * The coat of arms of a faction: a shield in its colour with its symbol.
 *
 * @param props - the faction and the width in px
 * @returns the shield
 */
export function FactionCrest({ culture, size }: FactionArtProps): ReactElement {
  const colors = paletteOf(culture);
  const id = `imp-fc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={(size * 56) / 48}
      aria-hidden="true"
      className="shrink-0 drop-shadow"
      data-testid="imp-faction-crest"
      data-culture={culture}
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path
        d="M4 6h40v20c0 13-9 22-20 27C13 48 4 39 4 26z"
        fill={colors.accent}
        stroke={LINE}
        strokeWidth="0.8"
      />
      <path
        d="M7.5 9h33v17c0 11-7.5 18.5-16.5 23C15 44.5 7.5 37 7.5 26z"
        fill={colors.main}
      />
      {CREST_SYMBOL[culture](colors)}
      <path
        d="M7.5 9h33v17c0 11-7.5 18.5-16.5 23C15 44.5 7.5 37 7.5 26z"
        fill={`url(#${id}-shade)`}
      />
    </svg>
  );
}

/**
 * The head and shoulders every portrait shares.
 *
 * @param props - garment and skin colour, and what goes behind and over the head
 * @returns the bust
 */
function bust({ garment, skin, behind, over }: BustProps): ReactNode {
  return (
    <>
      {behind}
      <path
        d="M10 64C10 50 19 41 32 41S54 50 54 64z"
        fill={garment}
        stroke={LINE}
        strokeWidth="0.6"
      />
      <path d="M28.5 32h7v10h-7z" fill={shade(skin, -0.12)} />
      <ellipse cx="32" cy="28" rx="7" ry="8.4" fill={skin} />
      {over}
    </>
  );
}

/**
 * A braid hanging from the side of a head down to the shoulder.
 *
 * @param x - where it hangs, in portrait units
 * @returns the braid
 */
function braid(x: number): ReactNode {
  return (
    <g fill="#c8a060" stroke="#8a6a3a" strokeWidth="0.4">
      {[28, 32, 36, 40, 44].map((y) => (
        <ellipse key={y} cx={x} cy={y} rx="1.9" ry="2.4" />
      ))}
      <path d={`M${x - 1} 46.5h2l-1 2.5z`} fill="#8a6a3a" />
    </g>
  );
}

/**
 * The colours of a faction as CSS colours.
 *
 * @param culture - the faction
 * @returns its main and accent colour
 */
function paletteOf(culture: CultureId): Palette {
  const def = CULTURE[culture];
  return { main: hex(def.color), accent: hex(def.accent) };
}

/**
 * A colour number as CSS.
 *
 * @param color - the colour as 0xRRGGBB
 * @returns the colour as #rrggbb
 */
function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

/**
 * A colour lightened towards white or darkened towards black.
 *
 * @param color - the colour as #rrggbb
 * @param amount - from -1 (black) over 0 (unchanged) to 1 (white)
 * @returns the shaded colour as #rrggbb
 */
function shade(color: string, amount: number): string {
  const value = Number.parseInt(color.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const share = Math.abs(amount);
  const channel = (shift: number): number => {
    const own = (value >> shift) & 255;
    return Math.round(own + (target - own) * share);
  };
  return hex((channel(16) << 16) | (channel(8) << 8) | channel(0));
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
