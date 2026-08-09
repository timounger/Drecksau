/**
 * Hands a canvas's proportions to CSS, for scaling it without stretching it.
 *
 * @module
 * @remarks
 * A canvas that is told to fill the screen gets stretched, because CSS will
 * happily give a replaced element a width and a height that do not match its
 * picture. The way out is to compute one of the two from the other, and for
 * that the stylesheet needs to know the proportions - which only the canvas
 * knows, and which for some games change while the page is up.
 *
 * So: the ratio is written onto the wrapper as a custom property, and kept in
 * step with the canvas by watching its `width` and `height` attributes. Those
 * are exactly what changes when a game resizes its picture, and nothing else
 * has to be polled for it.
 */
"use client";

import { useEffect, type RefObject } from "react";

/** The custom property the stylesheet reads. */
const RATIO = "--shot-ratio";

/**
 * Keeps `--shot-ratio` on the wrapper equal to the canvas's proportions.
 *
 * @param canvas - the canvas whose picture is being scaled
 * @param stage - the wrapper the stylesheet works from
 */
export function useShotRatio(
  canvas: RefObject<HTMLCanvasElement | null>,
  stage: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const picture = canvas.current;
    const wrapper = stage.current;
    if (picture === null || wrapper === null) {
      return;
    }
    const sync = () => {
      if (picture.height > 0) {
        wrapper.style.setProperty(
          RATIO,
          String(picture.width / picture.height),
        );
      }
    };
    sync();
    const watch = new MutationObserver(sync);
    watch.observe(picture, {
      attributes: true,
      attributeFilter: ["width", "height"],
    });
    return () => watch.disconnect();
  }, [canvas, stage]);
}
