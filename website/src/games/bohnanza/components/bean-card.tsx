/**
 * One bean card, drawn the way the printed one is laid out.
 *
 * @module
 * @remarks
 * Portrait, about two to three, which is the shape of the card in the box - and
 * the shape matters here more than in most games, because you hold a **row** of
 * them in a fixed order and read them left to right. Chips of text all the same
 * height read as a list; cards read as a hand.
 *
 * The printed card puts four things on it and every one of them earns its
 * place, so this one keeps all four in the same order:
 *
 * - the **count**, top right: how many of that sort are in the deck, which is
 *   the whole economy of the game on one card,
 * - the **bean**, drawn,
 * - the **name**, on a coloured band,
 * - the **Bohnometer**, a row of coins with the cards each one costs.
 *
 * The pictures are drawn here rather than taken from the rulebook - that
 * artwork is somebody's - and they are told apart by **shape** before colour: a
 * pod, a kidney, an eye, a pair, a snapped pod, a flat disc, speckles, a plain
 * round bean. Eight colours is more than a palette can keep apart for
 * everybody, and a hand read by colour alone is a hand somebody cannot read.
 *
 * Cards keep their printed colours in both themes, like the Monopoly board and
 * for the same reason: a real card does not get darker in the evening, and the
 * page around it carries the theme.
 */
"use client";

import type { ReactElement } from "react";
import {
  BEAN_INFO,
  BEAN_PAINT,
  BEAN_SHORT,
  CARD_EDGE,
  CARD_STOCK,
  COIN_GOLD,
  beanName,
  type Bean,
} from "@/games/bohnanza/engine/beans";

/** How big a card is drawn. */
export type CardSize =
  /** A card in your hand or face up on the table - the whole thing. */
  | "md"
  /** In a row of chips, where the Bohnometer would not be readable anyway. */
  | "sm";

/** Props of {@link BeanCard}. */
export type BeanCardProps = {
  readonly bean: Bean;
  readonly size?: CardSize;
  /** Dims the card, for one that is being named rather than held. */
  readonly muted?: boolean;
  /**
   * Draws the back instead of the face - a card the reader may not see yet.
   *
   * @remarks
   * Online only, and only for a moment: your own hand travels on a private
   * channel that lands just after the shared snapshot, and the blanked hand in
   * that snapshot is what there is until it does. Drawing those as real cards
   * would tell you that you hold beans you do not.
   */
  readonly faceDown?: boolean;
};

/** How far a card is faded when it is being named rather than held. */
const MUTED = 0.55;

/** The back of a card - one flat colour, so it reads as "not a card yet". */
const CARD_BACK = "#5b6b4a";

/** What a card back says when hovered or read aloud. */
const FACE_DOWN_TITLE = "Noch nicht sichtbar";

/** The pixel sizes of the two cards, two to three. */
const SIZES: Readonly<Record<CardSize, { w: number; h: number }>> = {
  md: { w: 64, h: 96 },
  sm: { w: 44, h: 64 },
};

/**
 * Renders one bean card.
 *
 * @param props - which sort, how big, and whether it is only being named
 * @returns the card element
 */
export function BeanCard({
  bean,
  size = "md",
  muted = false,
  faceDown = false,
}: BeanCardProps): ReactElement {
  const info = BEAN_INFO[bean];
  const paint = BEAN_PAINT[bean];
  const box = SIZES[size];
  const full = size === "md";

  return faceDown ? (
    <CardBack size={size} />
  ) : (
    <span
      data-testid={`bean-${bean}`}
      title={`${info.name} - ${info.count}x im Spiel, Bohnometer ${info.meter.join("/")}`}
      style={{
        width: box.w,
        height: box.h,
        background: CARD_STOCK,
        borderColor: CARD_EDGE,
        opacity: muted ? MUTED : 1,
      }}
      className="inline-flex shrink-0 flex-col overflow-hidden rounded-md border shadow-sm select-none"
    >
      {/* The big number of the printed card: how many of this sort exist. */}
      <span
        style={{ background: paint.band, color: paint.ink }}
        className={`flex items-center justify-end px-1 font-bold tabular-nums ${
          full ? "text-[10px]" : "text-[8px]"
        }`}
      >
        {info.count}
      </span>

      <span className="flex flex-1 items-center justify-center px-0.5">
        <BeanArt bean={bean} />
      </span>

      <span
        style={{ background: paint.band, color: paint.ink }}
        className={`px-0.5 text-center leading-tight font-bold ${
          full ? "text-[9px]" : "text-[8px]"
        }`}
      >
        {BEAN_SHORT[bean]}
      </span>

      {full && <Bohnometer bean={bean} />}
    </span>
  );
}

/**
 * The back of a card.
 *
 * @param props - how big to draw it
 * @returns the card back
 * @remarks
 * Deliberately nothing like a bean card: no band, no name, no Bohnometer. It
 * should be impossible to mistake for a card somebody is holding, because the
 * one moment it appears is the moment somebody might.
 */
function CardBack({ size }: { readonly size: CardSize }): ReactElement {
  const box = SIZES[size];
  return (
    <span
      data-testid="bean-verdeckt"
      title={FACE_DOWN_TITLE}
      style={{
        width: box.w,
        height: box.h,
        background: CARD_BACK,
        borderColor: CARD_EDGE,
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-md border shadow-sm select-none"
    >
      <span
        aria-hidden
        style={{ color: CARD_STOCK }}
        className={`font-bold ${size === "md" ? "text-lg" : "text-sm"}`}
      >
        ?
      </span>
    </span>
  );
}

/**
 * The Bohnometer strip: a coin for each Taler, over the cards it takes.
 *
 * @remarks
 * The one number a player looks at every turn - "how many more do I need?" - so
 * it is on the front of the card and not behind a tooltip. Coins rather than a
 * bare list, because what the row is counting is Taler.
 */
function Bohnometer({ bean }: { readonly bean: Bean }): ReactElement {
  return (
    <span className="flex items-end justify-center gap-[2px] px-0.5 pb-[3px]">
      {BEAN_INFO[bean].meter.map((needed, at) => (
        <span
          key={at}
          style={{ background: COIN_GOLD, color: "#3d2b00" }}
          className="flex h-[13px] w-[13px] items-center justify-center rounded-full text-[8px] leading-none font-bold tabular-nums"
        >
          {needed}
        </span>
      ))}
    </span>
  );
}

/**
 * The bean itself.
 *
 * @param props - which sort to draw
 * @returns the drawing
 * @remarks
 * One picture per sort, and each is meant to be recognisable **as a silhouette**
 * - which is how somebody scanning a row of twelve cards actually reads them.
 * The names are the real ones and so are the shapes: an Augenbohne has an eye
 * on it, a Brechbohne is a pod that snaps, a Saubohne is the big flat one.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- from here down the
   numbers are coordinates on a 48 by 36 canvas: drawing, not arithmetic. */
function BeanArt({ bean }: { readonly bean: Bean }): ReactElement {
  const paint = BEAN_PAINT[bean];
  const line = { stroke: paint.mark, strokeWidth: 1.4, fill: "none" } as const;

  return (
    <svg
      viewBox="0 0 48 36"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      {bean === "garten" && (
        <g>
          {/* A pod, with the beans showing through it. */}
          <rect
            x="6"
            y="12"
            width="36"
            height="13"
            rx="6.5"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
            transform="rotate(-12 24 18)"
          />
          {[15, 24, 33].map((cx, at) => (
            <circle
              key={at}
              cx={cx}
              cy={20.5 - at * 1.9}
              r="3"
              fill={paint.mark}
              opacity="0.45"
            />
          ))}
        </g>
      )}

      {bean === "rot" && (
        <g>
          {/* A kidney, in one outline: two shoulders with the hilum notch
              dipping between them, and one long sweep round the bottom. Drawn
              as a single path on purpose - built from an oval with a second
              shape bitten out of it, the notch disappeared the moment both were
              filled in the same colour. */}
          <path
            d="M8 20C8 13 12 9.5 17 10c2.5 0.3 4 2 5.5 3C24 11.5 26 9.5 29 9.5c7 0 12 3.5 12 10C41 27 34 31 24 31S8 27 8 20z"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M14 24c4 3 14 3 19 0" {...line} opacity="0.55" />
        </g>
      )}

      {bean === "augen" && (
        <g>
          <ellipse
            cx="24"
            cy="18"
            rx="16"
            ry="10.5"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          {/* The eye it is named after. */}
          <ellipse cx="24" cy="18" rx="6" ry="4" fill={paint.mark} />
          <circle cx="22.3" cy="16.6" r="1.2" fill={paint.body} />
        </g>
      )}

      {bean === "soja" && (
        <g>
          {/* Two in a pod, which is how soy grows. */}
          <circle
            cx="17"
            cy="18"
            r="9"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          <circle
            cx="31"
            cy="18"
            r="9"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          <path d="M17 12v12" {...line} opacity="0.55" />
          <path d="M31 12v12" {...line} opacity="0.55" />
        </g>
      )}

      {bean === "brech" && (
        <g>
          {/* A pod snapped in two - what "brechen" means. */}
          <path
            d="M4 20c0-5 4-8 9-8h7l-2 6 3 6h-8c-5 0-9-2-9-4z"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          <path
            d="M44 16c0 5-4 8-9 8h-7l2-6-3-6h8c5 0 9 2 9 4z"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
        </g>
      )}

      {bean === "sau" && (
        <g>
          {/* The big flat one. */}
          <ellipse
            cx="24"
            cy="18"
            rx="17"
            ry="11.5"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          <ellipse cx="24" cy="18" rx="11" ry="6.5" {...line} opacity="0.7" />
        </g>
      )}

      {bean === "feuer" && (
        <g>
          {/* Speckled, the way a runner bean is. */}
          <ellipse
            cx="24"
            cy="18"
            rx="16"
            ry="10.5"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          {[
            [17, 14],
            [24, 20],
            [30, 14],
            [21, 24],
            [32, 22],
          ].map(([cx, cy], at) => (
            <ellipse
              key={at}
              cx={cx}
              cy={cy}
              rx="3"
              ry="2.2"
              fill={paint.mark}
              transform={`rotate(-20 ${cx} ${cy})`}
            />
          ))}
        </g>
      )}

      {bean === "blau" && (
        <g>
          <ellipse
            cx="24"
            cy="18"
            rx="15"
            ry="11"
            fill={paint.body}
            stroke={paint.mark}
            strokeWidth="1.4"
          />
          <path
            d="M14 13c3-3 9-4 13-2"
            stroke="#ffffff"
            strokeWidth="2"
            fill="none"
            opacity="0.75"
          />
        </g>
      )}
    </svg>
  );
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * A whole sort's name, for a sentence rather than a card.
 *
 * @param bean - the sort
 * @returns its printed name
 */
export function longName(bean: Bean): string {
  return beanName(bean);
}
