/**
 * One card, drawn the way the printed one is laid out.
 *
 * @module
 * @remarks
 * Portrait, about two to three, which is the shape of the card in the box - and
 * the same shape the Bohnanza cards use, because a collection where a card is a
 * card everywhere is one less thing to learn per game.
 *
 * The drawing is the point of this game and not decoration. A cow is built from
 * a **Kopf, some Mittelteile and a Hinterteil laid left to right**, so the three
 * pictures are three slices of one animal and they are drawn to **join up**:
 * the body runs at the same height on every card and reaches the edge flat
 * where the next card continues it. Three cards side by side read as a cow,
 * which is the whole thing the rules are about.
 *
 * Breeds are told apart by **markings and horns** before colour - Holstein
 * patches and stubby horns, the Longhorn's long straight pair, the Hochland's
 * shaggy fringe - because three hides that differ only in hue is a herd some
 * people cannot read.
 *
 * The pictures are drawn here rather than taken from the box: that artwork is
 * somebody's.
 */
"use client";

import type { ReactElement } from "react";
import {
  ACTION_CLASS,
  ACTION_NAMES,
  ACTION_PAINT,
  BREED_NAMES,
  BREED_PAINT,
  CALF_PAINT,
  CARD_EDGE,
  CARD_STOCK,
  JOKER_NAME,
  PART_NAMES,
  type Breed,
  type Card,
  type Part,
} from "@/games/kuhle-kuehe/engine/cards";

/** How big a card is drawn. */
export type CardSize =
  /** In your hand, or face up on the table - the whole thing. */
  | "md"
  /** Inside a cow, or in a row of choices, where a full card would not fit. */
  | "sm";

/** The pixel sizes of the two cards, two to three. */
const SIZES: Readonly<Record<CardSize, { w: number; h: number }>> = {
  md: { w: 64, h: 96 },
  sm: { w: 44, h: 64 },
};

/** Props of {@link KuhCard}. */
export type KuhCardProps = {
  readonly card: Card;
  readonly size?: CardSize;
  /** Marked as chosen. */
  readonly picked?: boolean;
  /** Pressable - a card you may act on right now. */
  readonly open?: boolean;
  readonly onClick?: () => void;
  /** What the card says when hovered or read aloud. */
  readonly title: string;
};

/**
 * Renders one card.
 *
 * @param props - the card, how big, and whether it can be pressed
 * @returns the card element
 * @remarks
 * A button only while it can be pressed. The cards inside a cow sit in a row
 * that is itself pressable - you aim an attack at the whole animal, not at one
 * of its legs - and a button inside a button is invalid HTML that React will
 * not render the same way twice.
 */
export function KuhCard({
  card,
  size = "md",
  picked = false,
  open = false,
  onClick,
  title,
}: KuhCardProps): ReactElement {
  const box = SIZES[size];
  const face = faceOf(card);
  const chrome = `inline-flex shrink-0 flex-col overflow-hidden rounded-md border-2 text-center shadow-sm select-none ${
    open ? "cursor-pointer hover:brightness-95" : ""
  }`;
  const style = {
    width: box.w,
    height: box.h,
    background: CARD_STOCK,
    borderColor: picked ? "#4f46e5" : CARD_EDGE,
  };
  const inside = (
    <>
      <span
        style={{ background: face.band, color: face.ink }}
        className={`px-0.5 leading-tight font-bold ${
          size === "md" ? "text-[9px]" : "text-[8px]"
        }`}
      >
        {face.top}
      </span>
      <span className="flex flex-1 items-center justify-center overflow-hidden">
        <CardArt card={card} />
      </span>
      <span
        style={{ background: face.band, color: face.ink }}
        className={`px-0.5 leading-tight font-bold ${
          size === "md" ? "text-[9px]" : "text-[7px]"
        }`}
      >
        {face.bottom}
      </span>
    </>
  );

  return open ? (
    <button
      type="button"
      data-testid={`kuhle-card-${card.id}`}
      onClick={onClick}
      title={title}
      style={style}
      className={chrome}
    >
      {inside}
    </button>
  ) : (
    <span
      data-testid={`kuhle-card-${card.id}`}
      title={title}
      style={style}
      className={chrome}
    >
      {inside}
    </span>
  );
}

/** What the two bands of a card say, and what colour they are. */
function faceOf(card: Card): {
  readonly top: string;
  readonly bottom: string;
  readonly band: string;
  readonly ink: string;
} {
  let face: {
    top: string;
    bottom: string;
    band: string;
    ink: string;
  };
  switch (card.kind) {
    case "cow": {
      const paint = BREED_PAINT[card.breed ?? "joker"];
      face = {
        top: PART_NAMES[card.part],
        bottom: card.breed === null ? JOKER_NAME : BREED_NAMES[card.breed],
        band: paint.band,
        ink: paint.ink,
      };
      break;
    }
    case "calf":
      face = {
        top: "Kalb",
        bottom: "Kalb",
        band: CALF_PAINT.band,
        ink: CALF_PAINT.ink,
      };
      break;
    case "action": {
      const paint = ACTION_PAINT[ACTION_CLASS[card.action]];
      face = {
        top: "Aktion",
        bottom: ACTION_NAMES[card.action],
        band: paint.band,
        ink: paint.ink,
      };
      break;
    }
    default:
      face = {
        top: "",
        bottom: "",
        band: "#6b7280",
        ink: "#ffffff",
      };
  }
  return face;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here down the
   numbers are coordinates on a 48 by 40 canvas: drawing, not arithmetic. */

/**
 * Where the barrel of the cow sits.
 *
 * @remarks
 * The same two lines on **every** part card, and that is the whole trick: a
 * Kopf, a Mittelteil and a Hinterteil laid side by side line up into one animal
 * because their bodies start and end at the same height. Change one of these
 * and the herd stops joining up.
 */
const BODY_TOP = 8;
const BODY_BOTTOM = 26;

/** What is drawn in the middle of a card. */
function CardArt({ card }: { readonly card: Card }): ReactElement {
  let art: ReactElement;
  switch (card.kind) {
    case "cow":
      art = <CowPart part={card.part} breed={card.breed} />;
      break;
    case "calf":
      art = <CalfArt />;
      break;
    case "action":
      art = <ActionArt card={card} />;
      break;
    default:
      art = <BackArt />;
  }
  return (
    <svg
      viewBox="0 0 48 40"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      {art}
    </svg>
  );
}

/** One slice of a cow, in its breed's hide. */
function CowPart({
  part,
  breed,
}: {
  readonly part: Part;
  readonly breed: Breed | null;
}): ReactElement {
  const paint = BREED_PAINT[breed ?? "joker"];
  const skin = {
    fill: paint.hide,
    stroke: paint.mark,
    strokeWidth: 1.3,
  } as const;
  let body: ReactElement;
  switch (part) {
    case "head":
      body = <Head paint={paint} skin={skin} breed={breed} />;
      break;
    case "middle":
      body = <Middle paint={paint} skin={skin} breed={breed} />;
      break;
    default:
      body = <Rear paint={paint} skin={skin} breed={breed} />;
  }
  return body;
}

/** The paint of one breed, as the drawings take it. */
type Paint = (typeof BREED_PAINT)[keyof typeof BREED_PAINT];

/** The hide, as an SVG prop bundle. */
type Skin = {
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
};

/**
 * The head end: the animal's head, its front leg, and the neck running off the
 * right edge into whatever card comes next.
 */
function Head({
  paint,
  skin,
  breed,
}: {
  readonly paint: Paint;
  readonly skin: Skin;
  readonly breed: Breed | null;
}): ReactElement {
  return (
    <g>
      {/* The neck and shoulder, flat where the next card takes over. */}
      <path
        d={`M22 ${BODY_TOP}H48v${BODY_BOTTOM - BODY_TOP}H22z`}
        {...skin}
        strokeLinejoin="round"
      />
      <Leg x={31} paint={paint} skin={skin} />
      <Horns breed={breed} paint={paint} />
      {/* The head, muzzle to the left. */}
      <ellipse cx="15" cy="19" rx="12" ry="10" {...skin} />
      <ellipse
        cx="6.5"
        cy="22.5"
        rx="5"
        ry="4"
        fill={paint.horn}
        stroke={paint.mark}
        strokeWidth="1.1"
      />
      <circle cx="5" cy="22" r="1" fill={paint.mark} />
      <circle cx="8.5" cy="22.5" r="1" fill={paint.mark} />
      {/* An ear, and one eye - a head in profile only ever shows one. */}
      <ellipse
        cx="24"
        cy="12"
        rx="4"
        ry="2.5"
        {...skin}
        transform="rotate(-25 24 12)"
      />
      <circle cx="15" cy="15" r="1.8" fill={paint.mark} />
      {breed === "hochland" && (
        // The fringe it is known for, hanging over the eyes.
        <path
          d="M5 14c4-4 9-6 15-5M7 11.5c4-3 9-4 14-3"
          stroke={paint.mark}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      )}
      <Markings
        breed={breed}
        paint={paint}
        spots={[
          [33, 13],
          [42, 21],
        ]}
      />
    </g>
  );
}

/**
 * The barrel: flat at both edges, so it continues whatever is on either side.
 *
 * @remarks
 * This is the card the game is really about - a cow may hold any number of them
 * and each is worth a point, so the picture has to survive being repeated four
 * times in a row without looking like a mistake. Hence a plain barrel with an
 * udder, and the markings placed the same way every time.
 */
function Middle({
  paint,
  skin,
  breed,
}: {
  readonly paint: Paint;
  readonly skin: Skin;
  readonly breed: Breed | null;
}): ReactElement {
  return (
    <g>
      <path
        d={`M0 ${BODY_TOP}H48v${BODY_BOTTOM - BODY_TOP}H0z`}
        {...skin}
        strokeLinejoin="round"
      />
      {/* The udder, which is what tells this slice from a plain block. */}
      <ellipse
        cx="24"
        cy="28"
        rx="8.5"
        ry="5"
        fill={paint.hide}
        stroke={paint.mark}
        strokeWidth="1.2"
      />
      <path
        d="M20 32v3M28 32v3"
        stroke={paint.mark}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Markings
        breed={breed}
        paint={paint}
        spots={[
          [12, 13],
          [35, 19],
        ]}
      />
    </g>
  );
}

/** The back end: the rump, a hind leg and the tail. */
function Rear({
  paint,
  skin,
  breed,
}: {
  readonly paint: Paint;
  readonly skin: Skin;
  readonly breed: Breed | null;
}): ReactElement {
  return (
    <g>
      <path
        d={`M0 ${BODY_TOP}h27a9 9 0 0 1 0 ${BODY_BOTTOM - BODY_TOP}H0z`}
        {...skin}
        strokeLinejoin="round"
      />
      <Leg x={13} paint={paint} skin={skin} />
      {/* The tail, with the tuft on the end. */}
      <path
        d="M37 10c5 3 6 10 4 15"
        stroke={paint.mark}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="40.5" cy="27" rx="2.3" ry="3.2" fill={paint.mark} />
      <Markings
        breed={breed}
        paint={paint}
        spots={[
          [10, 13],
          [24, 20],
        ]}
      />
    </g>
  );
}

/** One leg with a hoof, hanging below the barrel. */
function Leg({
  x,
  paint,
  skin,
}: {
  readonly x: number;
  readonly paint: Paint;
  readonly skin: Skin;
}): ReactElement {
  return (
    <g>
      <rect x={x} y={BODY_BOTTOM - 2} width="6" height="10" rx="2" {...skin} />
      <rect
        x={x}
        y={BODY_BOTTOM + 5.5}
        width="6"
        height="3"
        rx="1.2"
        fill={paint.horn}
        stroke={paint.mark}
        strokeWidth="1"
      />
    </g>
  );
}

/**
 * What is drawn on the hide.
 *
 * @remarks
 * The Holstein gets its patches, the Hochland the shaggy strokes of its coat,
 * the Longhorn a plain hide, and a joker gets three dots - one per breed,
 * because a joker is a card that will be any of them.
 */
function Markings({
  breed,
  paint,
  spots,
}: {
  readonly breed: Breed | null;
  readonly paint: Paint;
  /** Where the markings go on this particular slice. */
  readonly spots: readonly (readonly [number, number])[];
}): ReactElement | null {
  let marks: ReactElement | null = null;
  if (breed === "holstein") {
    marks = (
      <g>
        {spots.map(([cx, cy], at) => (
          <ellipse
            key={at}
            cx={cx}
            cy={cy}
            rx="6"
            ry="4.2"
            fill={paint.mark}
            transform={`rotate(${at % 2 === 0 ? -18 : 14} ${cx} ${cy})`}
          />
        ))}
      </g>
    );
  } else if (breed === "hochland") {
    marks = (
      <g
        stroke={paint.mark}
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      >
        {spots.map(([cx, cy], at) => (
          <path key={at} d={`M${cx - 7} ${cy}q3.5 4 7 0t7 0`} />
        ))}
      </g>
    );
  } else if (breed === null) {
    marks = (
      <g>
        {spots.slice(0, 1).map(([cx, cy], at) => (
          <g key={at}>
            <circle cx={cx - 5} cy={cy} r="1.8" fill={paint.mark} />
            <circle cx={cx} cy={cy} r="1.8" fill={paint.mark} />
            <circle cx={cx + 5} cy={cy} r="1.8" fill={paint.mark} />
          </g>
        ))}
      </g>
    );
  }
  return marks;
}

/** The horns, which are half of how a breed is recognised. */
function Horns({
  breed,
  paint,
}: {
  readonly breed: Breed | null;
  readonly paint: Paint;
}): ReactElement {
  const stroke = {
    stroke: paint.mark,
    fill: paint.horn,
    strokeWidth: 1.1,
  } as const;
  let horns: ReactElement;
  if (breed === "longhorn") {
    // The pair it is named for: long, straight and far too wide.
    horns = (
      <g>
        <path d="M12 10C6 7 2 6 0 7c2 2 6 4 11 6z" {...stroke} />
        <path d="M19 10c6-3 11-4 13-3-2 2-6 4-11 6z" {...stroke} />
      </g>
    );
  } else if (breed === "hochland") {
    horns = (
      <g>
        <path d="M11 10C5 8 2 3 4 1c2 1 6 5 9 8z" {...stroke} />
        <path d="M20 10c6-2 10-7 8-9-2 1-6 5-9 8z" {...stroke} />
      </g>
    );
  } else {
    // Stubby - what a Holstein has, and what stands in for a joker.
    horns = (
      <g>
        <ellipse
          cx="9"
          cy="9"
          rx="2.5"
          ry="3.4"
          {...stroke}
          transform="rotate(-25 9 9)"
        />
        <ellipse
          cx="21"
          cy="9"
          rx="2.5"
          ry="3.4"
          {...stroke}
          transform="rotate(25 21 9)"
        />
      </g>
    );
  }
  return horns;
}

/** A calf: the same animal, smaller and without the horns. */
function CalfArt(): ReactElement {
  const paint = CALF_PAINT;
  return (
    <g>
      <rect
        x="12"
        y="15"
        width="26"
        height="10"
        rx="4"
        fill={paint.hide}
        stroke={paint.mark}
        strokeWidth="1.3"
      />
      <ellipse
        cx="13"
        cy="17"
        rx="7.5"
        ry="6"
        fill={paint.hide}
        stroke={paint.mark}
        strokeWidth="1.3"
      />
      <ellipse
        cx="8"
        cy="19"
        rx="3.2"
        ry="2.5"
        fill={paint.horn}
        stroke={paint.mark}
        strokeWidth="1"
      />
      <circle cx="13" cy="15" r="1.2" fill={paint.mark} />
      <ellipse
        cx="17.5"
        cy="12"
        rx="2.6"
        ry="1.7"
        fill={paint.hide}
        stroke={paint.mark}
        strokeWidth="1.1"
        transform="rotate(-25 17.5 12)"
      />
      <rect
        x="17"
        y="24"
        width="4"
        height="6"
        rx="1.4"
        fill={paint.hide}
        stroke={paint.mark}
        strokeWidth="1.2"
      />
      <rect
        x="30"
        y="24"
        width="4"
        height="6"
        rx="1.4"
        fill={paint.hide}
        stroke={paint.mark}
        strokeWidth="1.2"
      />
      <path
        d="M38 16c3 2 3 6 1 8"
        stroke={paint.mark}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * An action card's emblem.
 *
 * @remarks
 * One per **group**, not one per card, and that is a decision rather than a
 * shortcut. Twelve emblems is more than anybody wants to learn, and the name
 * printed under it is what actually identifies the card. What the picture and
 * the colour are for is the question asked across a table at a glance - is that
 * one coming for me? - and there are only four answers to that.
 */
function ActionArt({
  card,
}: {
  readonly card: Extract<Card, { kind: "action" }>;
}): ReactElement {
  const group = ACTION_CLASS[card.action];
  const paint = ACTION_PAINT[group];
  const stroke = {
    stroke: paint.band,
    strokeWidth: 2.4,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  let mark: ReactElement;
  if (group === "build") {
    // A plus: something is being added.
    mark = <path d="M24 9v18M15 18h18" {...stroke} />;
  } else if (group === "attack") {
    // An arrow going out of the frame: something is being taken away.
    mark = <path d="M12 18h22M26 10l8 8-8 8" {...stroke} />;
  } else if (group === "guard") {
    // A shield.
    mark = (
      <path d="M24 8l11 4v7c0 6-5 10-11 12-6-2-11-6-11-12v-7z" {...stroke} />
    );
  } else {
    // A loop: the odd ones out, which bend the turn rather than the herd.
    mark = <path d="M31 13a9 9 0 1 0 2 6M33 8v7h-7" {...stroke} />;
  }
  return mark;
}

/** The back of a card - somebody else's hand, or the draw pile. */
function BackArt(): ReactElement {
  return (
    <g>
      <rect x="4" y="4" width="40" height="28" rx="4" fill="#6b7280" />
      <path
        d="M10 26c4-8 10-12 14-12s10 4 14 12"
        stroke="#e5e7eb"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
