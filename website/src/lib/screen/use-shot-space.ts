/**
 * Tells CSS how much height is left for a canvas once the buttons have theirs.
 *
 * @module
 * @remarks
 * A game whose controls go fullscreen along with the picture has two things
 * sharing the screen, and only one of them may be scaled: the buttons have to
 * stay the size a thumb needs. So the picture gets whatever height is left
 * over - and how much that is, only the page can measure.
 *
 * The number is written onto the wrapper as a custom property and kept in step
 * with a resize observer, which fires both when the buttons wrap onto another
 * line and when going fullscreen changes the wrapper.
 */
"use client";

import { useEffect, type RefObject } from "react";

/** The custom property the stylesheet reads. */
const SPACE = "--shot-space";

/** The least of the screen the picture keeps, whatever the buttons need. */
const LEAST = 0.4;

/**
 * Keeps `--shot-space` on the wrapper at the height the canvas may have.
 *
 * @param stage - the wrapper that goes fullscreen
 * @param controls - the block of buttons under the picture
 */
export function useShotSpace(
  stage: RefObject<HTMLElement | null>,
  controls: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const wrapper = stage.current;
    const buttons = controls.current;
    if (wrapper === null || buttons === null) {
      return;
    }
    const sync = () => {
      const left = wrapper.clientHeight - buttons.offsetHeight;
      // Never less than a share of the screen: on a very short display the
      // buttons would otherwise leave nothing of the game to look at. What
      // does not fit can be scrolled to, which beats a picture of no height.
      const floor = wrapper.clientHeight * LEAST;
      wrapper.style.setProperty(SPACE, `${Math.max(floor, left)}px`);
    };
    sync();
    const watch = new ResizeObserver(sync);
    watch.observe(wrapper);
    watch.observe(buttons);
    return () => watch.disconnect();
  }, [stage, controls]);
}
