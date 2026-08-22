/**
 * The faces a player can go by online.
 *
 * @module
 * @remarks
 * Drawn here as SVG rather than picked from the emoji font, for the reason the
 * microphone icon is: an emoji looks like a different person on every operating
 * system, and a face somebody chose as themselves must not turn into somebody
 * else on their friend's phone.
 *
 * The set is meant to cover the room rather than to be complete - short hair
 * and long, beards and buns, young faces and grey ones, and the range of skin
 * that a family and its friends actually come in. Enough that most people find
 * something they are content to be, few enough to pick from in one glance.
 *
 * The labels describe what is drawn - "Zopf", "Grauer Bart" - rather than
 * declaring who it is for. The variety is what was asked for; telling somebody
 * which of these they are is not this module's business.
 *
 * An {@link AvatarId} travels on the wire and sits in storage, so **never
 * reuse one**: an id that changes meaning turns an old player into a stranger.
 * Adding to the catalogue is safe, renumbering it is not.
 */
"use client";

import type { ReactElement } from "react";

/** Identifies one face. Stable forever - see the module note. */
export type AvatarId = string;

/** How a face is put together. */
type Face = {
  readonly id: AvatarId;
  /** German, shown under the face in the picker. */
  readonly label: string;
  /** The ring behind the head, so a face is told apart even when tiny. */
  readonly ring: string;
  readonly skin: string;
  readonly hair: string;
  readonly style: "short" | "long" | "bun" | "curly" | "bald" | "fringe";
  /** A beard, in the hair colour. */
  readonly beard?: boolean;
  readonly glasses?: boolean;
  /** Rounder face and cheeks. */
  readonly young?: boolean;
  /** A pair of lines by the eyes. */
  readonly old?: boolean;
};

/** Skin tones, light to dark. */
const SKIN = {
  light: "#f6d3b6",
  fair: "#eec091",
  tan: "#d59d6f",
  olive: "#c68642",
  brown: "#a3673a",
  deep: "#7a4a24",
} as const;

/** Hair colours. */
const HAIR = {
  black: "#2f2a28",
  brown: "#6b4423",
  auburn: "#a8452f",
  blond: "#d8b45c",
  grey: "#a9a6a3",
  white: "#e6e4e1",
} as const;

/** The ring colours, chosen to stay apart at sixteen pixels. */
const RING = {
  green: "#a7dfc0",
  blue: "#a9c8ee",
  amber: "#f3d69b",
  rose: "#f2bcc4",
  violet: "#cebcee",
  teal: "#a5dcd8",
  clay: "#e8bfa0",
  slate: "#c3cad2",
} as const;

/**
 * Every face there is.
 *
 * @remarks
 * New ones go on the end with a fresh id; nothing here is ever renumbered.
 */
export const AVATARS: readonly Face[] = [
  // Young.
  {
    id: "a01",
    label: "Kurzhaar, jung",
    ring: RING.green,
    skin: SKIN.light,
    hair: HAIR.brown,
    style: "short",
    young: true,
  },
  {
    id: "a02",
    label: "Zöpfe, jung",
    ring: RING.rose,
    skin: SKIN.fair,
    hair: HAIR.blond,
    style: "long",
    young: true,
  },
  {
    id: "a03",
    label: "Lockenkopf, jung",
    ring: RING.amber,
    skin: SKIN.brown,
    hair: HAIR.black,
    style: "curly",
    young: true,
  },
  {
    id: "a04",
    label: "Pony, jung",
    ring: RING.teal,
    skin: SKIN.tan,
    hair: HAIR.black,
    style: "fringe",
    young: true,
  },
  // Short hair.
  {
    id: "a05",
    label: "Kurze Haare",
    ring: RING.blue,
    skin: SKIN.fair,
    hair: HAIR.black,
    style: "short",
  },
  {
    id: "a06",
    label: "Kurze Haare, rot",
    ring: RING.clay,
    skin: SKIN.light,
    hair: HAIR.auburn,
    style: "short",
  },
  {
    id: "a07",
    label: "Kurze Haare, dunkel",
    ring: RING.violet,
    skin: SKIN.deep,
    hair: HAIR.black,
    style: "short",
  },
  {
    id: "a08",
    label: "Brille",
    ring: RING.slate,
    skin: SKIN.fair,
    hair: HAIR.blond,
    style: "short",
    glasses: true,
  },
  // Long hair.
  {
    id: "a09",
    label: "Langes Haar",
    ring: RING.rose,
    skin: SKIN.light,
    hair: HAIR.brown,
    style: "long",
  },
  {
    id: "a10",
    label: "Langes Haar, dunkel",
    ring: RING.teal,
    skin: SKIN.deep,
    hair: HAIR.black,
    style: "long",
  },
  {
    id: "a11",
    label: "Zopf",
    ring: RING.amber,
    skin: SKIN.tan,
    hair: HAIR.brown,
    style: "bun",
  },
  {
    id: "a12",
    label: "Locken",
    ring: RING.green,
    skin: SKIN.olive,
    hair: HAIR.auburn,
    style: "curly",
  },
  // Beards.
  {
    id: "a13",
    label: "Bart",
    ring: RING.blue,
    skin: SKIN.fair,
    hair: HAIR.brown,
    style: "short",
    beard: true,
  },
  {
    id: "a14",
    label: "Glatze und Bart",
    ring: RING.clay,
    skin: SKIN.olive,
    hair: HAIR.black,
    style: "bald",
    beard: true,
  },
  // Older.
  {
    id: "a15",
    label: "Grauer Bart",
    ring: RING.blue,
    skin: SKIN.tan,
    hair: HAIR.grey,
    style: "short",
    beard: true,
    old: true,
  },
  {
    id: "a16",
    label: "Graues Haar",
    ring: RING.violet,
    skin: SKIN.fair,
    hair: HAIR.grey,
    style: "bun",
    old: true,
  },
  {
    id: "a17",
    label: "Weißes Haar",
    ring: RING.clay,
    skin: SKIN.tan,
    hair: HAIR.white,
    style: "long",
    old: true,
  },
  {
    id: "a18",
    label: "Glatze und Brille",
    ring: RING.green,
    skin: SKIN.brown,
    hair: HAIR.grey,
    style: "bald",
    glasses: true,
    old: true,
  },
];

/** The face used for anybody who never picked one. */
export const DEFAULT_AVATAR: AvatarId = AVATARS[0].id;

/**
 * Looks up a face, falling back to the first.
 *
 * @param id - the stored or received id, whatever it is
 * @returns a face, always
 * @remarks
 * Never throws. The id arrives from storage and from other players' browsers,
 * which may be older or newer than this one - an unknown face is a stranger
 * with a plain face, not a crash.
 */
export function faceOf(id: AvatarId | undefined): Face {
  return AVATARS.find((face) => face.id === id) ?? AVATARS[0];
}

/** Props of {@link Avatar}. */
export type AvatarProps = {
  readonly id: AvatarId | undefined;
  /** Edge length in pixels. */
  readonly size?: number;
  /** Ringed and highlighted, for the one that is currently chosen. */
  readonly picked?: boolean;
};

/** How big a face is when nobody says. */
const DEFAULT_SIZE = 28;

/** A young face is a little rounder, and its eyes sit a little lower. */
const FACE_HEIGHT = 19;
const FACE_HEIGHT_YOUNG = 17;
const EYE_LINE = 33;
const EYE_LINE_YOUNG = 34;

/**
 * Draws one face.
 *
 * @param props - which face, how big, and whether it is the chosen one
 * @returns the picture
 */
export function Avatar({
  id,
  size = DEFAULT_SIZE,
  picked = false,
}: AvatarProps): ReactElement {
  const face = faceOf(id);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={face.label}
      data-testid={`avatar-${face.id}`}
      className={`shrink-0 rounded-full ${
        picked ? "ring-2 ring-emerald-500" : ""
      }`}
    >
      <circle cx="32" cy="32" r="32" fill={face.ring} />
      <Head face={face} />
      <Hair face={face} />
      {face.beard === true && <Beard face={face} />}
      <Mouth />
      <Eyes face={face} />
      {face.glasses === true && <Glasses />}
      {face.old === true && <Wrinkles />}
    </svg>
  );
}

/** The head, ears and mouth - rounder and rosier on a young face. */
function Head({ face }: { readonly face: Face }): ReactElement {
  const height = face.young === true ? FACE_HEIGHT_YOUNG : FACE_HEIGHT;
  return (
    <g>
      <circle cx="15" cy="36" r="3.5" fill={face.skin} />
      <circle cx="49" cy="36" r="3.5" fill={face.skin} />
      <ellipse cx="32" cy="35" rx="16" ry={height} fill={face.skin} />
      {face.young === true && (
        <g fill="#e79a97" opacity="0.55">
          <circle cx="21" cy="39" r="3.2" />
          <circle cx="43" cy="39" r="3.2" />
        </g>
      )}
    </g>
  );
}

/**
 * The mouth.
 *
 * @param props - nothing; it is the same on every face
 * @returns the smile
 * @remarks
 * Drawn after the beard rather than with the head. A beard covers the jaw, and
 * the first version painted the mouth away with it - eighteen faces, five of
 * them with nothing to smile with.
 */
function Mouth(): ReactElement {
  return (
    <path
      d="M26 45 q6 5 12 0"
      fill="none"
      stroke="#8a5a45"
      strokeWidth="2"
      strokeLinecap="round"
    />
  );
}

/** Whatever is on top, by style. */
function Hair({ face }: { readonly face: Face }): ReactElement | null {
  // Traced along the skull: up the left temple, over the crown, down the right,
  // then back along the hairline. The first version drew an arc whose lower
  // edge landed at y=33 - which is exactly where the eyes are, so every face
  // wore its hair like a helmet pulled down over its eyebrows.
  const cap = (
    <path
      d="M17 30 Q17 15 32 15 Q47 15 47 30 Q32 23 17 30 Z"
      fill={face.hair}
    />
  );
  const styles: Readonly<Record<Face["style"], ReactElement | null>> = {
    bald: null,
    fringe: (
      <path
        d="M17 30 Q17 15 32 15 Q47 15 47 30 Q32 31 17 30 Z"
        fill={face.hair}
      />
    ),
    short: cap,
    long: (
      <path
        d="M17 30 Q17 15 32 15 Q47 15 47 30 L47 51 Q44 54 42 50 L42 30 Q32 24 22 30 L22 50 Q20 54 17 51 Z"
        fill={face.hair}
      />
    ),
    bun: (
      <g fill={face.hair}>
        {cap}
        <circle cx="32" cy="12" r="7" />
      </g>
    ),
    curly: (
      <g fill={face.hair}>
        {cap}
        <circle cx="19" cy="23" r="8" />
        <circle cx="32" cy="16" r="9" />
        <circle cx="45" cy="23" r="8" />
      </g>
    ),
  };
  return styles[face.style];
}

/** A beard around the jaw. */
function Beard({ face }: { readonly face: Face }): ReactElement {
  return (
    <path
      d="M16 36 Q17 54 32 54 Q47 54 48 36 Q45 47 32 47 Q19 47 16 36 Z"
      fill={face.hair}
    />
  );
}

/** Two eyes. */
function Eyes({ face }: { readonly face: Face }): ReactElement {
  const y = face.young === true ? EYE_LINE_YOUNG : EYE_LINE;
  return (
    <g fill="#3a3330">
      <circle cx="25" cy={y} r="2.4" />
      <circle cx="39" cy={y} r="2.4" />
    </g>
  );
}

/** A pair of round spectacles. */
function Glasses(): ReactElement {
  return (
    <g fill="none" stroke="#4a4a4a" strokeWidth="2">
      <circle cx="25" cy="33" r="6" />
      <circle cx="39" cy="33" r="6" />
      <path d="M31 33 h2" />
    </g>
  );
}

/** Two lines by the eyes, the cheapest way to add thirty years. */
function Wrinkles(): ReactElement {
  return (
    <g stroke="#a8734e" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
      <path d="M18 34 l4 1" />
      <path d="M46 34 l-4 1" />
      <path d="M19 38 l3 1" />
      <path d="M45 38 l-3 1" />
    </g>
  );
}
