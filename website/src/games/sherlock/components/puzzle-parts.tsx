/**
 * The pieces a puzzle is shown with, on screen and on paper: its paragraphs
 * and its pictures.
 *
 * @module
 */
import type { ReactElement } from "react";
import type { PuzzleImage } from "@/games/sherlock/engine/types";

/** Sub path the site is served from - the pictures live under `public/`. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Paragraphs of text, one after the other.
 *
 * @param props - the paragraphs, and the look of each
 * @returns the paragraphs
 */
export function Paragraphs({
  lines,
  className,
  testId,
}: {
  readonly lines: readonly string[];
  readonly className?: string;
  readonly testId?: string;
}): ReactElement {
  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      {lines.map((line, index) => (
        <p key={`${String(index)}-${line}`} className={className}>
          {line}
        </p>
      ))}
    </div>
  );
}

/**
 * The pictures of a puzzle, each as wide as it may be and never wider than
 * the column.
 *
 * @param props - the pictures, how wide they may be at most, and which one
 *   is being read aloud
 * @returns the pictures
 */
export function PuzzleImages({
  images,
  maxWidth,
  reading = -1,
}: {
  readonly images: readonly PuzzleImage[];
  readonly maxWidth: string;
  /** The picture whose description is being read, -1 for none. */
  readonly reading?: number;
}): ReactElement {
  return (
    <div className="flex flex-col items-center gap-3">
      {images.map((image, at) => (
        // A plain picture: its size is not known up front, and the site is
        // exported without an image optimizer anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image.src}
          src={`${BASE_PATH}${image.src}`}
          alt={image.alt}
          data-testid="sherlock-image"
          data-reading={at === reading ? "true" : undefined}
          style={{ maxWidth }}
          className={`h-auto w-full rounded-lg border bg-white object-contain break-inside-avoid transition-shadow duration-150 ${
            at === reading
              ? "border-yellow-400 ring-4 ring-yellow-300"
              : "border-zinc-200 dark:border-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}
