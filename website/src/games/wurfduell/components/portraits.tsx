/**
 * Small still pictures of a fighter and of a thrown thing, for the selection
 * cards and the item buttons.
 *
 * @module
 * @remarks
 * Drawn with the very functions the arena uses, so the card shows exactly the
 * fighter that will stand on the field.
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { BODY_HEIGHT } from "@/games/wurfduell/engine/arena";
import { characterById } from "@/games/wurfduell/engine/characters";
import type { CharacterId, ItemId } from "@/games/wurfduell/engine/types";
import { drawFighter } from "./draw-fighters";
import { drawItem } from "./draw-items";

/** Logical size of a fighter portrait. */
const PORTRAIT_WIDTH = 120;
const PORTRAIT_HEIGHT = 150;
/** Where the feet stand in a portrait. */
const PORTRAIT_FEET = 140;
/** Logical size of an item icon. */
const ICON_SIZE = 40;
/** How much of the icon the item fills. */
const ICON_FILL = 0.36;
/** Sharpest the small canvases are drawn. */
const MAX_DOTS = 3;

/**
 * A fighter standing still.
 *
 * @param props - who, and which way they face
 * @returns the canvas
 */
export function FighterPortrait({
  character,
  facing = 1,
  className,
}: {
  readonly character: CharacterId;
  readonly facing?: number;
  readonly className?: string;
}): ReactElement {
  const ref = useStill(
    PORTRAIT_WIDTH,
    PORTRAIT_HEIGHT,
    `${character}${facing}`,
    (ctx) => {
      const size = characterById(character).size;
      // Big fighters are drawn a touch smaller, so all of them fit the card.
      const fit = Math.min(
        1,
        (PORTRAIT_FEET - BODY_HEIGHT) / (BODY_HEIGHT * size),
      );
      ctx.translate(PORTRAIT_WIDTH / 2, PORTRAIT_FEET);
      ctx.scale(fit, fit);
      drawFighter(ctx, {
        character,
        x: 0,
        y: 0,
        facing,
        size,
        pose: { kind: "idle", t: 0, angle: 0 },
        clock: 1,
        held: null,
        stains: [],
      });
    },
  );
  return (
    <canvas
      ref={ref}
      width={PORTRAIT_WIDTH}
      height={PORTRAIT_HEIGHT}
      aria-hidden="true"
      className={className}
    />
  );
}

/**
 * A thrown thing, as an icon.
 *
 * @param props - which item
 * @returns the canvas
 */
export function ItemIcon({
  item,
  className,
}: {
  readonly item: ItemId;
  readonly className?: string;
}): ReactElement {
  const ref = useStill(ICON_SIZE, ICON_SIZE, item, (ctx) => {
    drawItem(ctx, item, ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE * ICON_FILL, 0);
  });
  return (
    <canvas
      ref={ref}
      width={ICON_SIZE}
      height={ICON_SIZE}
      aria-hidden="true"
      className={className}
    />
  );
}

/** Draws a canvas once per `what`, sharp on whatever screen it is on. */
function useStill(
  width: number,
  height: number,
  what: string,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const paintRef = useRef(paint);
  useEffect(() => {
    paintRef.current = paint;
  });
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas !== null && ctx !== null) {
      const dots = Math.min(
        MAX_DOTS,
        Math.max(1, window.devicePixelRatio || 1),
      );
      canvas.width = Math.round(width * dots);
      canvas.height = Math.round(height * dots);
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      ctx.clearRect(0, 0, width, height);
      paintRef.current(ctx);
    }
  }, [width, height, what]);
  return ref;
}
