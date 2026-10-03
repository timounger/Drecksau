/**
 * Welche Landmarke von welchem Strich gezeichnet wird.
 *
 * @module
 * @remarks
 * Eine Tafel und keine Kette von Fällen: Die nächste Landmarke ist hier ein
 * Eintrag, und der Zeichner des Grundes muss von ihr nichts wissen. Die
 * Häuser stehen in {@link ./landmarks}, ihre Bewohner in {@link ./dwellers} -
 * zusammengeführt werden beide erst hier.
 */
import {
  drawArielle,
  drawFlipper,
  drawHollaender,
  drawNemo,
} from "@/games/uboot/components/dwellers";
import {
  drawAbfalleimer,
  drawKrosseKrabbe,
  drawPatrick,
  drawSandy,
  drawSpongebob,
  drawThaddaeus,
} from "@/games/uboot/components/landmarks";
import {
  ABFALLEIMER,
  ARIELLE,
  FLIPPER,
  HOLLAENDER,
  HOUSE_PATRICK,
  HOUSE_SANDY,
  HOUSE_SPONGEBOB,
  HOUSE_THADDAEUS,
  KROSSEN_KRABBE,
  NEMO,
} from "@/games/uboot/engine/landmarks";

/** Wer eine Landmarke zeichnet, bekommt die Ecke ihres Feldes und die Uhr. */
export type LandmarkArt = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) => void;

/** Die Tafel selbst. */
export const LANDMARK_ART: Readonly<Record<string, LandmarkArt>> = {
  [HOUSE_SPONGEBOB]: (ctx, x, y, time) => drawSpongebob(ctx, x, y, time),
  [HOUSE_PATRICK]: (ctx, x, y, time) => drawPatrick(ctx, x, y, time),
  [KROSSEN_KRABBE]: (ctx, x, y, time) => drawKrosseKrabbe(ctx, x, y, time),
  [HOUSE_SANDY]: (ctx, x, y, time) => drawSandy(ctx, x, y, time),
  [ABFALLEIMER]: (ctx, x, y) => drawAbfalleimer(ctx, x, y),
  [HOUSE_THADDAEUS]: (ctx, x, y) => drawThaddaeus(ctx, x, y),
  [NEMO]: (ctx, x, y, time) => drawNemo(ctx, x, y, time),
  [FLIPPER]: (ctx, x, y, time) => drawFlipper(ctx, x, y, time),
  [ARIELLE]: (ctx, x, y, time) => drawArielle(ctx, x, y, time),
  [HOLLAENDER]: (ctx, x, y, time) => drawHollaender(ctx, x, y, time),
};

/**
 * Und welche davon auch im Schwarzen zu sehen ist, und in welcher Farbe.
 *
 * @remarks
 * Die vier Bewohner stehen in Gewässern, in denen das Licht aus ist. Eine
 * Landmarke, die der Schleier verschluckt, ist keine Landmarke mehr - also
 * leuchten sie selbst, genau wie alles andere, was hier unten lebt. Die
 * Häuser stehen im Hellen und brauchen das nicht.
 */
export const LANDMARK_GLOW: Readonly<Record<string, string>> = {
  [NEMO]: "rgba(255,150,70,0.55)",
  [FLIPPER]: "rgba(140,210,245,0.55)",
  [ARIELLE]: "rgba(255,160,190,0.5)",
  [HOLLAENDER]: "rgba(120,255,120,0.75)",
};
