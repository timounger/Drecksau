/**
 * The symbols of IMPERAVIS: one set of small line drawings for the screen,
 * the build categories, the buildings and the goods, plus the coat of arms
 * drawn in a player's colour. All drawn here as inline SVG, no image files.
 *
 * @module
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import type { BuildingKind, GoodId } from "@/games/imperavis/engine/types";
import { BUILDING } from "@/games/imperavis/engine/buildings-data";

/* eslint-disable @typescript-eslint/no-magic-numbers -- drawing coordinates on a 24 x 24 grid */

/** The names of the symbols. */
export type IconName =
  | "coin"
  | "people"
  | "mood"
  | "pause"
  | "play"
  | "close"
  | "search"
  | "rotate"
  | "hammer"
  | "wrench"
  | "arrowUp"
  | "stop"
  | "star"
  | "map"
  | "scroll"
  | "chevronLeft"
  | "chevronRight"
  | "chevronUp"
  | "chevronDown"
  | "road"
  | "move"
  | "anchor"
  | "eye"
  | "check"
  | "warning"
  | "info"
  | "flask"
  | "swords"
  | "gear"
  | "calendar"
  | "sun"
  | "rain"
  | "fog"
  | "storm"
  | "house"
  | "wheat"
  | "factory"
  | "townhall"
  | "cannon"
  | "decor"
  | "stall"
  | "church"
  | "book"
  | "drop"
  | "flame"
  | "cross"
  | "masks"
  | "crate"
  | "ship"
  | "tower"
  | "tree"
  | "flower"
  | "lantern"
  | "plaza"
  | "park"
  | "fountain"
  | "statue"
  | "crown"
  | "trendUp"
  | "trendDown"
  | "trendFlat"
  | "bars"
  | "coins"
  | "globe"
  | "handshake"
  | "fullscreen";

/** The drawing of each symbol, on a 24 x 24 grid. */
const ICONS: Readonly<Record<IconName, ReactNode>> = {
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.18" />
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 8.5v7M10 10h3a1.2 1.2 0 0 1 0 2.4h-2a1.2 1.2 0 0 0 0 2.4h3" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="16" rx="6" ry="2.5" />
      <path d="M3 16v2.5C3 19.9 5.7 21 9 21s6-1.1 6-2.5V16" />
      <ellipse cx="15" cy="8" rx="6" ry="2.5" />
      <path d="M9 8v3.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V8" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.3c3 .1 5.5 2.1 5.5 5.7" />
    </>
  ),
  mood: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.2c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2" />
      <circle cx="9" cy="10" r=".9" fill="currentColor" />
      <circle cx="15" cy="10" r=".9" fill="currentColor" />
    </>
  ),
  pause: (
    <>
      <rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" />
      <rect
        x="13.6"
        y="5.5"
        width="3.4"
        height="13"
        rx="1"
        fill="currentColor"
      />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  rotate: (
    <>
      <path d="M19 12a7 7 0 1 1-2.1-5" />
      <path d="M17.5 3.5v4h-4" />
    </>
  ),
  hammer: (
    <>
      <path d="M13.5 5.5l5 5-2 2-5-5z" fill="currentColor" fillOpacity="0.25" />
      <path d="M13.5 5.5l5 5-2 2-5-5zM12.5 9.5l-8 8 2 2 8-8M15 4l2-1.5 4 4L19.5 8.5" />
    </>
  ),
  wrench: (
    <path d="M14.5 3.5a5 5 0 0 0-4.6 6.9L3.5 16.8l3.7 3.7 6.4-6.4a5 5 0 0 0 6.9-4.6l-3 3-3.2-.8-.8-3.2z" />
  ),
  arrowUp: (
    <>
      <path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" />
      <path d="M6 21h12" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />,
  star: (
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z" />
  ),
  map: (
    <>
      <path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  scroll: (
    <>
      <path d="M7 4h11a2 2 0 0 1 2 2v1h-4" />
      <path d="M16 7v11a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18v-1H13v1a2.5 2.5 0 0 0 2.5 2.5" />
      <path d="M7 4a2 2 0 0 0-2 2v11M9 9h4M9 12.5h4" />
    </>
  ),
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  road: (
    <>
      <path d="M8 3.5L4 20.5M16 3.5l4 17" />
      <path d="M12 4.5v3M12 10.5v3M12 16.5v3" />
    </>
  ),
  move: (
    <>
      <path d="M12 3.5v17M3.5 12h17" />
      <path d="M9.5 6L12 3.5 14.5 6M9.5 18l2.5 2.5 2.5-2.5M6 9.5L3.5 12 6 14.5M18 9.5l2.5 2.5-2.5 2.5" />
    </>
  ),
  anchor: (
    <>
      <circle cx="12" cy="5.5" r="2" />
      <path d="M12 7.5V20M8 11h8" />
      <path d="M4.5 13.5c0 4 3.3 6.5 7.5 6.5s7.5-2.5 7.5-6.5M4.5 13.5l-1 1.5M19.5 13.5l1 1.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  warning: (
    <>
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 9.5v5M12 17.2v.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.3" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3.5h5M10.5 3.5v6L5 18.5A1.5 1.5 0 0 0 6.3 21h11.4a1.5 1.5 0 0 0 1.3-2.5l-5.5-9v-6" />
      <path d="M7.5 15h9" />
    </>
  ),
  swords: (
    <>
      <path d="M4 4l10 10M4 4h3.5L15 11.5M4 4v3.5L11.5 15" />
      <path d="M20 4L10 14M20 4h-3.5L9 11.5M20 4v3.5L12.5 15" />
      <path d="M7 17l-3 3M17 17l3 3M6 15l3 3M18 15l-3 3" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
      <circle cx="12" cy="12" r="6.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  rain: (
    <>
      <path d="M7 15.5a4.5 4.5 0 0 1-.4-9A5.5 5.5 0 0 1 17 7.5a4 4 0 0 1 0 8z" />
      <path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" />
    </>
  ),
  fog: (
    <>
      <path d="M7 12.5a4.5 4.5 0 0 1-.4-9A5.5 5.5 0 0 1 17 4.5a4 4 0 0 1 0 8z" />
      <path d="M4 16h16M6 19.5h12" />
    </>
  ),
  storm: (
    <>
      <path d="M7 14.5a4.5 4.5 0 0 1-.4-9A5.5 5.5 0 0 1 17 6.5a4 4 0 0 1 0 8z" />
      <path d="M12.5 13l-2.5 4h3.5l-2 4" />
    </>
  ),
  house: (
    <>
      <path d="M3.5 11L12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" fill="currentColor" fillOpacity="0.2" />
      <path d="M15.5 6.5V4.5h2V8" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V8" />
      <path d="M12 8c-2-.5-3-2-3-4 2 .3 3 1.8 3 4zM12 8c2-.5 3-2 3-4-2 .3-3 1.8-3 4z" />
      <path d="M12 12.5c-2-.5-3-2-3-4 2 .3 3 1.8 3 4zM12 12.5c2-.5 3-2 3-4-2 .3-3 1.8-3 4z" />
      <path d="M12 17c-2-.5-3-2-3-4 2 .3 3 1.8 3 4zM12 17c2-.5 3-2 3-4-2 .3-3 1.8-3 4z" />
    </>
  ),
  factory: (
    <>
      <path
        d="M3 20.5V10l5 3V10l5 3V10l5 3V4h3v16.5z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M3 20.5V10l5 3V10l5 3V10l5 3V4h3v16.5zM6 17h2M11 17h2M16 17h2" />
    </>
  ),
  townhall: (
    <>
      <path d="M3 9l9-5.5L21 9z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 9l9-5.5L21 9zM4.5 9v9M19.5 9v9M8.5 11v6M12 11v6M15.5 11v6M3 20.5h18M3.5 18h17" />
    </>
  ),
  cannon: (
    <>
      <path
        d="M4 12.5l12-5 2.5 4.5-12 5z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M4 12.5l12-5 2.5 4.5-12 5zM18.5 7.5l1.5 3" />
      <circle cx="9" cy="17" r="3" />
      <path d="M3 20.5h12" />
    </>
  ),
  decor: (
    <>
      <circle cx="8" cy="8.5" r="4.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="8" cy="8.5" r="4.5" />
      <path d="M8 13v7.5" />
      <path d="M15 20.5h6M16 20.5V12h4v8.5M18 12V9.5" />
      <circle cx="18" cy="7.5" r="2" />
    </>
  ),
  stall: (
    <>
      <path
        d="M3.5 9.5L5 4.5h14l1.5 5z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M3.5 9.5L5 4.5h14l1.5 5zM3.5 9.5c0 1.4 1.5 2.2 2.8 1.5M20.5 9.5c0 1.4-1.5 2.2-2.8 1.5M5 11v9.5h14V11M9 20.5v-5h6v5" />
    </>
  ),
  church: (
    <>
      <path d="M12 2.5v4M10.3 4.2h3.4" />
      <path d="M8 20.5V11l4-4.5 4 4.5v9.5zM4 20.5v-6l4-2M20 20.5v-6l-4-2M3 20.5h18" />
      <path d="M11 20.5v-4h2v4" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" />
      <path d="M12 6.5v13" />
    </>
  ),
  drop: (
    <>
      <path d="M12 3.5c3.5 4.5 6 7.8 6 10.8a6 6 0 0 1-12 0c0-3 2.5-6.3 6-10.8z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.4 1.3-3.8 2.5-5 .3 1.8 1 2.8 2 3.2C11 9 11 6 12 3z" />
    </>
  ),
  cross: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 7.5v9M7.5 12h9" />
    </>
  ),
  masks: (
    <>
      <path d="M3.5 5h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M6 8.5h.1M10 8.5h.1M6 11.5c1.2 1 2.8 1 4 0" />
      <path d="M12.5 10h8v5a4 4 0 0 1-8 0" />
      <path d="M15 13h.1M18 13h.1M15 17c1-.8 2-.8 3 0" />
    </>
  ),
  crate: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 5l16 14M20 5L4 19M4 12h16" />
    </>
  ),
  ship: (
    <>
      <path d="M12 3v13M12 4l6 8.5h-6M12 6L7.5 12.5H12" />
      <path d="M3 16h18l-2.5 4h-13z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 16h18l-2.5 4h-13z" />
    </>
  ),
  tower: (
    <>
      <path d="M7 20.5V9h10v11.5M5.5 9V5h2.5v2h2V5h4v2h2V5h2.5v4zM10.5 20.5v-4.5h3v4.5M4 20.5h16" />
      <path d="M11 11.5h2" />
    </>
  ),
  tree: (
    <>
      <path
        d="M12 3.5l5.5 7h-3l4 5.5h-13l4-5.5h-3z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M12 3.5l5.5 7h-3l4 5.5h-13l4-5.5h-3zM12 16v4.5" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="5.3" r="2.2" />
      <circle cx="8.8" cy="8.5" r="2.2" />
      <circle cx="15.2" cy="8.5" r="2.2" />
      <circle cx="12" cy="8.5" r="1.6" fill="currentColor" fillOpacity="0.5" />
      <path d="M12 10.5V20M12 15c-2-2.5-4.5-2.5-5.5-1.5 1.5 2 3.5 2 5.5 1.5zM12 17c2-2.5 4.5-2.5 5.5-1.5-1.5 2-3.5 2-5.5 1.5z" />
    </>
  ),
  lantern: (
    <>
      <path d="M12 2.5v2.5M9 5h6l1 2.5H8zM8.5 7.5h7v7h-7z" />
      <path d="M12 9.5v3" fill="currentColor" />
      <path d="M10 14.5h4l-1 2h-2zM12 16.5v4M9.5 20.5h5" />
    </>
  ),
  plaza: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
    </>
  ),
  park: (
    <>
      <circle cx="7.5" cy="9" r="3.5" />
      <circle cx="16.5" cy="8" r="4" />
      <path d="M7.5 12.5v5M16.5 12v5.5M3 20.5c5-2.5 13-2.5 18 0" />
    </>
  ),
  fountain: (
    <>
      <path d="M12 3.5v6M12 5c-2 0-3.5 1-4 2.5M12 5c2 0 3.5 1 4 2.5" />
      <path d="M8 10h8l-1 2.5H9z" />
      <path d="M12 12.5V16M4 16h16v2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18z" />
    </>
  ),
  statue: (
    <>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M9.5 13.5l1-6h3l1 6M13.5 8l3-2.5" />
      <path d="M8 13.5h8v3H8zM6.5 16.5h11v4h-11z" />
    </>
  ),
  crown: (
    <>
      <path
        d="M4 17.5l-1-10 5 4 4-6.5 4 6.5 5-4-1 10z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M4 17.5l-1-10 5 4 4-6.5 4 6.5 5-4-1 10zM4 20.5h16" />
    </>
  ),
  trendUp: <path d="M4 17l5.5-5.5 3.5 3.5 7-7M15 8h5v5" />,
  trendDown: <path d="M4 7l5.5 5.5 3.5-3.5 7 7M15 16h5v-5" />,
  trendFlat: <path d="M4 12h16M16 8l4 4-4 4" />,
  bars: (
    <>
      <path d="M4 20.5h16" />
      <rect x="5.5" y="12" width="3" height="6.5" />
      <rect x="10.5" y="7" width="3" height="11.5" />
      <rect x="15.5" y="10" width="3" height="8.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-2.5 2.5-3.5 5.5-3.5 8.5s1 6 3.5 8.5M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5" />
    </>
  ),
  handshake: (
    <>
      <path d="M2.5 11l3.5-4 4 1.5L13 7l4.5 1 4 3" />
      <path d="M6 14l3 3c.7.7 1.8.7 2.5 0l4.5-4.5M8 12.5l3 3M10.5 10.5l3.5 3.5M21.5 11L17 15.5" />
    </>
  ),
  fullscreen: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
};

/** Colour and drawing of each good. */
const GOODS: Readonly<Record<GoodId, { color: string; draw: ReactNode }>> = {
  wood: {
    color: "#b07b45",
    draw: (
      <>
        <rect
          x="3.5"
          y="9"
          width="15"
          height="7"
          rx="3.5"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <rect x="3.5" y="9" width="15" height="7" rx="3.5" />
        <ellipse cx="18" cy="12.5" rx="2.5" ry="3.5" />
        <path d="M17.5 12.5h1M7 11.5h5" />
      </>
    ),
  },
  planks: {
    color: "#d8a868",
    draw: (
      <>
        <path
          d="M3 8.5h18v3H3zM3 13h18v3H3zM5 17.5h16v3H5z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3 8.5h18v3H3zM3 13h18v3H3zM5 17.5h16v3H5zM8 8.5v3M15 13v3M11 17.5v3" />
      </>
    ),
  },
  stone: {
    color: "#b6b2a6",
    draw: (
      <>
        <path
          d="M4 10l8-4 8 4v7.5l-8 3-8-3z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M4 10l8-4 8 4-8 3.5zM4 10v7.5l8 3v-7M20 10v7.5l-8 3" />
      </>
    ),
  },
  clay: {
    color: "#c47a45",
    draw: (
      <>
        <path
          d="M4 17c0-5 3.5-9 8-9s8 4 8 9c0 2-3.5 3.5-8 3.5S4 19 4 17z"
          fill="currentColor"
          fillOpacity="0.35"
        />
        <path d="M4 17c0-5 3.5-9 8-9s8 4 8 9c0 2-3.5 3.5-8 3.5S4 19 4 17zM8.5 13.5c1 .8 2 .8 3 0" />
      </>
    ),
  },
  bricks: {
    color: "#c45a3c",
    draw: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          fill="currentColor"
          fillOpacity="0.25"
        />
        <path d="M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" />
      </>
    ),
  },
  ore: {
    color: "#a0766a",
    draw: (
      <>
        <path
          d="M3.5 18l3-8 5-3.5 6 2.5 3 9z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3.5 18l3-8 5-3.5 6 2.5 3 9zM3.5 18h17" />
        <circle cx="10" cy="13" r="1.2" fill="currentColor" />
        <circle cx="15" cy="14.5" r="1" fill="currentColor" />
        <circle cx="12.5" cy="10" r=".9" fill="currentColor" />
      </>
    ),
  },
  coal: {
    color: "#8c8a8f",
    draw: (
      <>
        <path
          d="M4 19l2.5-5 4.5-1 2 6zM11 19l2-7 5-1 2.5 8zM7 12l3-5 4 1.5-1.5 4z"
          fill="currentColor"
          fillOpacity="0.55"
        />
        <path d="M4 19l2.5-5 4.5-1 2 6zM11 19l2-7 5-1 2.5 8zM7 12l3-5 4 1.5-1.5 4z" />
      </>
    ),
  },
  iron: {
    color: "#9fb0bf",
    draw: (
      <>
        <path d="M3 16l3-6h12l3 6z" fill="currentColor" fillOpacity="0.3" />
        <path d="M3 16l3-6h12l3 6zM6 10l1.5 2.5h9L18 10M7.5 12.5L6 16M16.5 12.5L18 16" />
      </>
    ),
  },
  tools: {
    color: "#c9b28a",
    draw: (
      <>
        <path d="M5 19l9-9M12 5.5l2-2 6.5 6.5-2 2zM10.5 7l6.5 6.5" />
        <path d="M19 19L9.5 9.5a3.5 3.5 0 0 1-4.6-4.6l2 2 1.6-.4.4-1.6-2-2a3.5 3.5 0 0 1 4.6 4.6" />
      </>
    ),
  },
  fish: {
    color: "#7fb3d5",
    draw: (
      <>
        <path
          d="M3 12c3-4 8-5.5 13-3l4.5-3v12L16 15c-5 2.5-10 1-13-3z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3 12c3-4 8-5.5 13-3l4.5-3v12L16 15c-5 2.5-10 1-13-3z" />
        <circle cx="7.5" cy="11" r=".9" fill="currentColor" />
      </>
    ),
  },
  grain: {
    color: "#e2c05a",
    draw: ICONS.wheat,
  },
  flour: {
    color: "#efe6d2",
    draw: (
      <>
        <path
          d="M7 6.5h10l-1 2.5c3 2 4 5 4 8a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 17c0-3 1-6 4-8z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M7 6.5h10l-1 2.5c3 2 4 5 4 8a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 17c0-3 1-6 4-8zM8 9h8M7 4l2 2.5M17 4l-2 2.5" />
      </>
    ),
  },
  bread: {
    color: "#d39a52",
    draw: (
      <>
        <path
          d="M3 15c0-4.5 4-7.5 9-7.5s9 3 9 7.5c0 2-2 3.5-4 3.5H7c-2 0-4-1.5-4-3.5z"
          fill="currentColor"
          fillOpacity="0.35"
        />
        <path d="M3 15c0-4.5 4-7.5 9-7.5s9 3 9 7.5c0 2-2 3.5-4 3.5H7c-2 0-4-1.5-4-3.5zM8 10.5l1.5 3M12 9.5l1.5 3.5M16 10.5l1 3" />
      </>
    ),
  },
  wool: {
    color: "#ece6d8",
    draw: (
      <>
        <circle
          cx="12"
          cy="12.5"
          r="7.5"
          fill="currentColor"
          fillOpacity="0.25"
        />
        <circle cx="12" cy="12.5" r="7.5" />
        <path d="M6 9c4 0 9 3 11.5 8M5 13.5c4-.5 8 2 10 6.5M9 5.5c3 1 7 4.5 9.5 9" />
      </>
    ),
  },
  cloth: {
    color: "#9b8fc7",
    draw: (
      <>
        <path d="M5 5h10v14H5z" fill="currentColor" fillOpacity="0.3" />
        <path d="M5 5h10v14H5zM15 5c2.5 0 4 1.5 4 3.5v10.5c0-1.5-1.5-2.5-4-2.5M5 9h10M5 13h10" />
      </>
    ),
  },
  clothing: {
    color: "#6f9bd1",
    draw: (
      <>
        <path
          d="M8.5 3.5L3.5 7l2.5 4 2-1.2V20.5h8V9.8l2 1.2 2.5-4-5-3.5c-.5 1.5-1.8 2.5-3.5 2.5S9 5 8.5 3.5z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M8.5 3.5L3.5 7l2.5 4 2-1.2V20.5h8V9.8l2 1.2 2.5-4-5-3.5c-.5 1.5-1.8 2.5-3.5 2.5S9 5 8.5 3.5z" />
      </>
    ),
  },
  malt: {
    color: "#c9a25c",
    draw: (
      <>
        <path
          d="M3.5 13h17a8.5 8.5 0 0 1-17 0z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3.5 13h17a8.5 8.5 0 0 1-17 0z" />
        <ellipse cx="8" cy="10" rx="1.5" ry="2.3" />
        <ellipse cx="12" cy="8.5" rx="1.5" ry="2.3" />
        <ellipse cx="16" cy="10" rx="1.5" ry="2.3" />
      </>
    ),
  },
  beer: {
    color: "#e0b040",
    draw: (
      <>
        <path d="M5 8h10v12.5H5z" fill="currentColor" fillOpacity="0.4" />
        <path d="M5 8h10v12.5H5zM15 10.5h2.5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H15M5 8a2.5 2.5 0 0 1 2.5-4 3 3 0 0 1 5 0A2.5 2.5 0 0 1 15 8M8.5 11v6.5M11.5 11v6.5" />
      </>
    ),
  },
  grapes: {
    color: "#a26fc4",
    draw: (
      <>
        <path d="M12 3.5v3M12 5c2-1.5 4.5-1 5.5 0" />
        <g fill="currentColor" fillOpacity="0.35">
          <circle cx="9" cy="9" r="2.4" />
          <circle cx="15" cy="9" r="2.4" />
          <circle cx="12" cy="12.5" r="2.4" />
          <circle cx="7.8" cy="13.5" r="2.2" />
          <circle cx="16.2" cy="13.5" r="2.2" />
          <circle cx="12" cy="17.5" r="2.4" />
        </g>
        <circle cx="9" cy="9" r="2.4" />
        <circle cx="15" cy="9" r="2.4" />
        <circle cx="12" cy="12.5" r="2.4" />
        <circle cx="12" cy="17.5" r="2.4" />
      </>
    ),
  },
  wine: {
    color: "#b24a5a",
    draw: (
      <>
        <path
          d="M7 3.5h10l-.5 5a4.5 4.5 0 0 1-9 0z"
          fill="currentColor"
          fillOpacity="0.4"
        />
        <path d="M7 3.5h10l-.5 5a4.5 4.5 0 0 1-9 0zM12 13v7M8.5 20.5h7M7.3 7h9.4" />
      </>
    ),
  },
  quartz: {
    color: "#e6d6a4",
    draw: (
      <>
        <path
          d="M3 19.5c2-5 5.5-8 9-8s7 3 9 8z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3 19.5c2-5 5.5-8 9-8s7 3 9 8zM16 3.5v4M14 5.5h4M7 6l.1.1M9 15h.1M13 16.5h.1M16 15.5h.1" />
      </>
    ),
  },
  glass: {
    color: "#9fd3e0",
    draw: (
      <>
        <rect
          x="4.5"
          y="3.5"
          width="15"
          height="17"
          rx="1"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <path d="M4.5 3.5h15v17h-15zM12 3.5v17M4.5 12h15M7 6.5l2.5-1.5M14.5 14.5l2.5-1.5" />
      </>
    ),
  },
  instruments: {
    color: "#d4b062",
    draw: (
      <>
        <path
          d="M3 15.5l12-8 2 3-12 8z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3 15.5l12-8 2 3-12 8zM15 7.5l3-2 2 3-3 2M7.5 17.5L9 21M11 15.5L14 21" />
      </>
    ),
  },
  tobacco: {
    color: "#a8854a",
    draw: (
      <>
        <path
          d="M5 19C5 10 10 4.5 19 4.5 19 13.5 14 19 5 19z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M5 19C5 10 10 4.5 19 4.5 19 13.5 14 19 5 19zM5 19L15 9M9.5 14.5h3.5M12 12V8.5" />
      </>
    ),
  },
  cigars: {
    color: "#9c6a3e",
    draw: (
      <>
        <rect
          x="2.5"
          y="11"
          width="16"
          height="4.5"
          rx="2.2"
          fill="currentColor"
          fillOpacity="0.35"
        />
        <path d="M2.5 13.2a2.2 2.2 0 0 1 2.2-2.2h13.8v4.5H4.7a2.2 2.2 0 0 1-2.2-2.3zM12.5 11v4.5M18.5 11h2v4.5h-2M20.5 8c0-1.5 1-2 1-3.5" />
      </>
    ),
  },
  pearls: {
    color: "#efe8f2",
    draw: (
      <>
        <path d="M3 15a9 9 0 0 1 18 0z" fill="currentColor" fillOpacity="0.2" />
        <path d="M3 15a9 9 0 0 1 18 0zM12 6v9M7.5 7.3L9.5 15M16.5 7.3L14.5 15M3 15c1 3.5 4.5 5.5 9 5.5s8-2 9-5.5" />
        <circle cx="12" cy="17" r="2" fill="currentColor" />
      </>
    ),
  },
  jewelry: {
    color: "#e8c35c",
    draw: (
      <>
        <circle cx="12" cy="15" r="6" />
        <path d="M9 6.5l3-3 3 3-3 3z" fill="currentColor" fillOpacity="0.5" />
        <path d="M9 6.5l3-3 3 3-3 3zM10.2 8.8l-.7 1.2M13.8 8.8l.7 1.2" />
      </>
    ),
  },
  weapons: {
    color: "#a7a39a",
    draw: (
      <>
        <path
          d="M3 17.5l13-9.5 1.5 2-13 9.5z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M3 17.5l13-9.5 1.5 2-13 9.5zM16 8l4.5-4M7 15.5l1.5 3.5M5.5 20.5L4 18.5M21 7l-12.5 9" />
      </>
    ),
  },
  cannons: {
    color: "#6f7480",
    draw: (
      <>
        <path
          d="M4 12.5l13-4 1.5 4.5-13 4z"
          fill="currentColor"
          fillOpacity="0.35"
        />
        <path d="M4 12.5l13-4 1.5 4.5-13 4zM18.5 13l2-.6M3.2 13.2l.8 3" />
        <circle cx="9" cy="17.5" r="3" />
        <circle cx="9" cy="17.5" r="0.8" fill="currentColor" />
      </>
    ),
  },
  engines: {
    color: "#c48b4a",
    draw: (
      <>
        <circle cx="10" cy="13" r="6" fill="currentColor" fillOpacity="0.25" />
        <circle cx="10" cy="13" r="6" />
        <circle cx="10" cy="13" r="2" />
        <path d="M10 7v-2M10 21v-2M4 13H2M18 13h-2M5.8 8.8L4.4 7.4M15.6 18.6l-1.4-1.4M16 8l4-4M18 4h2.5v2.5" />
      </>
    ),
  },
};

/** The symbol of each building kind, for its tile and its window. */
const BUILDING_ICONS: Readonly<Partial<Record<BuildingKind, IconName>>> = {
  kontor: "anchor",
  warehouse: "crate",
  house: "house",
  market: "stall",
  chapel: "church",
  tavern: "stall",
  school: "book",
  bathhouse: "drop",
  fireStation: "flame",
  doctor: "cross",
  scholarHouse: "flask",
  university: "book",
  theatre: "masks",
  shipyard: "ship",
  watchtower: "tower",
  battery: "cannon",
  barracks: "swords",
  decorTree: "tree",
  flowerBed: "flower",
  lantern: "lantern",
  plaza: "plaza",
  park: "park",
  fountain: "fountain",
  statue: "statue",
};

/** Props of {@link Icon}. */
type IconProps = {
  readonly name: IconName;
  /** Edge length in px (default 20). */
  readonly size?: number;
  readonly className?: string;
};

/**
 * One symbol of the screen, drawn in the current text colour.
 *
 * @param props - which, how large and extra classes
 * @returns the symbol
 */
export function Icon({
  name,
  size = 20,
  className = "",
}: IconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {ICONS[name]}
    </svg>
  );
}

/**
 * The symbol of a good, in its own colour.
 *
 * @param props - the good and its size
 * @returns the symbol
 */
export function GoodIcon({
  good,
  size = 18,
  className = "",
}: {
  readonly good: GoodId;
  readonly size?: number;
  readonly className?: string;
}): ReactElement {
  const entry = GOODS[good];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: entry.color }}
      className={`shrink-0 ${className}`}
    >
      {entry.draw}
    </svg>
  );
}

/**
 * The illustration of a building kind: its symbol on a brass medallion,
 * for a producer the good it makes.
 *
 * @param props - the kind and the size of the medallion
 * @returns the illustration
 */
export function BuildingArt({
  kind,
  size = 56,
}: {
  readonly kind: BuildingKind;
  readonly size?: number;
}): ReactElement {
  const own = BUILDING_ICONS[kind];
  const recipe = BUILDING[kind].recipe;
  const inner = Math.round(size * 0.58);
  return (
    <span
      className="imp-medal"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {own !== undefined || recipe === null ? (
        <Icon
          name={own ?? "house"}
          size={inner}
          className="text-[var(--imp-gold)]"
        />
      ) : (
        <GoodIcon good={recipe.output} size={inner} />
      )}
    </span>
  );
}

/**
 * A coat of arms in a player's colour: a shield with a brass rim, a band
 * and a crown, or plain grey for an island nobody holds.
 *
 * @param props - the colour as 0xRRGGBB (null for nobody), the size and a seed for the band
 * @returns the shield
 */
export function Crest({
  color,
  size = 48,
  variant = 0,
}: {
  readonly color: number | null;
  readonly size?: number;
  readonly variant?: number;
}): ReactElement {
  const fill =
    color === null ? "#5b5850" : `#${color.toString(16).padStart(6, "0")}`;
  const band = variant % 3;
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={(size * 56) / 48}
      aria-hidden="true"
      className="shrink-0 drop-shadow"
    >
      <defs>
        <linearGradient id="imp-crest-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d58c" />
          <stop offset="0.5" stopColor="#b08d57" />
          <stop offset="1" stopColor="#6e5634" />
        </linearGradient>
        <linearGradient id="imp-crest-shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path
        d="M4 6h40v20c0 13-9 22-20 27C13 48 4 39 4 26z"
        fill="url(#imp-crest-rim)"
      />
      <path
        d="M7.5 9h33v17c0 11-7.5 18.5-16.5 23C15 44.5 7.5 37 7.5 26z"
        fill={fill}
      />
      {band === 0 && (
        <path d="M7.5 22h33v7h-33z" fill="#f3e6c4" fillOpacity="0.85" />
      )}
      {band === 1 && (
        <path d="M7.5 9L40.5 40v-8L15 9z" fill="#f3e6c4" fillOpacity="0.85" />
      )}
      {band === 2 && (
        <path d="M21 9h6v40l-3 1.5-3-1.5z" fill="#f3e6c4" fillOpacity="0.85" />
      )}
      <path
        d="M16 20l-1.5-7 5 3.5L24 11l4.5 5.5 5-3.5-1.5 7z"
        fill="#e3c27a"
        stroke="#5a4426"
        strokeWidth="0.8"
      />
      <path
        d="M7.5 9h33v17c0 11-7.5 18.5-16.5 23C15 44.5 7.5 37 7.5 26z"
        fill="url(#imp-crest-shade)"
      />
    </svg>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
