/**
 * A small head-and-shoulders picture of a character or an animal, cut from
 * the portrait strip.
 *
 * @module
 */
import type { CSSProperties, ReactElement } from "react";
import portraits from "@/games/weihnachtsmann/assets/portraits-2x.png";
import type {
  AnimalId,
  CharacterId,
} from "@/games/weihnachtsmann/engine/types";
import { PORTRAIT_SIZE, PORTRAIT_SLOTS } from "./sprite-atlas";

/**
 * Renders one portrait at one CSS pixel per art pixel, so it stays sharp.
 *
 * @param props - whose portrait, and how much bigger
 * @returns the picture
 */
export function Portrait({
  who,
  zoom = 1,
}: {
  readonly who: CharacterId | AnimalId;
  /** Whole CSS pixels per art pixel. */
  readonly zoom?: number;
}): ReactElement {
  const size = PORTRAIT_SIZE * zoom;
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${portraits.src})`,
    backgroundSize: `${String(Object.keys(PORTRAIT_SLOTS).length * size)}px ${String(size)}px`,
    backgroundPosition: `-${String(PORTRAIT_SLOTS[who] * size)}px 0`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  };
  return <span aria-hidden="true" className="block shrink-0" style={style} />;
}
