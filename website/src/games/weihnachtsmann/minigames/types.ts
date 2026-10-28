/**
 * The contract every Advent minigame fulfils: what it is called, how it is
 * explained, and how it runs - one step, one picture, won or lost.
 *
 * @module
 * @remarks
 * A minigame plays on a fixed field of {@link MINI_W} x {@link MINI_H}
 * logical pixels. The host (`kit/host.ts`) shows the title card, counts
 * down, steps the game sixty times a second, scales its picture onto the
 * canvas, and shows the result screen; the game itself only knows its field,
 * the input and the clock. See `MINIGAMES.md` in the game folder.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import type { Art } from "@/games/weihnachtsmann/components/sprites";
import type { MiniSoundId } from "./kit/sounds";

/** Width of a minigame's field, logical px. */
export const MINI_W = 320;

/** Height of a minigame's field, logical px. */
export const MINI_H = 180;

/** The buttons every minigame can read, whatever the device. */
export type MiniButton = "left" | "right" | "up" | "down" | "action" | "alt";

/** A point on the field, logical px. */
export type MiniPoint = { readonly x: number; readonly y: number };

/** What the player does, read once per step. */
export type MiniInput = {
  /** Buttons held: arrows / W A S D / stick / pad, Space or Enter for action, R or Shift for alt. */
  readonly held: ReadonlySet<MiniButton>;
  /** Buttons pressed since the last step - a short tap still counts once. */
  readonly pressed: ReadonlySet<MiniButton>;
  /** Left-right and up-down, each -1 to 1 (keys, stick or touch pad). */
  readonly axisX: number;
  readonly axisY: number;
  /** Raw keys held, by `KeyboardEvent.code`, for games that need more keys. */
  readonly keys: ReadonlySet<string>;
  /** Raw keys pressed since the last step. */
  readonly keysPressed: ReadonlySet<string>;
  /** Where the mouse or finger is on the field, or null when unknown. */
  readonly pointer: MiniPoint | null;
  /** Whether the mouse button or finger is down. */
  readonly pointerDown: boolean;
  /** Clicks and taps since the last step, on the field. */
  readonly taps: readonly MiniPoint[];
};

/** How a run stands after a step. */
export type MiniStatus = "running" | "won" | "lost";

/** How a text is set; sizes in logical px. */
export type TextStyle = {
  /** Height of the letters, logical px; 8 by default. */
  readonly size?: number;
  readonly color?: string;
  readonly align?: CanvasTextAlign;
  readonly baseline?: CanvasTextBaseline;
  readonly bold?: boolean;
  /** Colour of an outline round the letters, or null for none (the default). */
  readonly outline?: string | null;
  /** 0 to 1. */
  readonly alpha?: number;
};

/** What a minigame draws with, once per frame. */
export type MiniDraw = {
  /**
   * The picture, scaled to logical px of the field ({@link MINI_W} x
   * {@link MINI_H}); two art pixels per logical pixel, smoothing off.
   */
  readonly ctx: CanvasRenderingContext2D;
  /** The game's shared sheets: figures, effects, world objects. */
  readonly art: Art;
  /** Seconds since this run began (keeps going on the result screen). */
  readonly time: number;
  /**
   * Writes sharp text on top of the picture, at the canvas's full
   * resolution; drawn after the whole picture, so it always lies on top.
   */
  readonly text: (
    text: string,
    x: number,
    y: number,
    style?: TextStyle,
  ) => void;
};

/** What a minigame gets when a run starts. */
export type MiniEnv = {
  /** A fresh seed for this run, for `kit/random.ts`. */
  readonly seed: number;
  /** Plays one of the shared sounds or the game's own recipe. */
  readonly sound: (sound: MiniSoundId | Recipe) => void;
};

/** One run of a minigame. */
export type MiniGameInstance = {
  /**
   * Advances the run by one fixed step (a sixtieth of a second).
   *
   * @param input - what the player does
   * @param dt - seconds
   * @returns whether it goes on, is won or is lost
   */
  step(input: MiniInput, dt: number): MiniStatus;
  /** Draws the run; also called on the result screen, after it ended. */
  draw(g: MiniDraw): void;
  /** One German line for the result screen, such as "17 von 15 Geschenken". */
  summary?(): string;
  /** Lets go of anything held, such as timers; called when the run is left. */
  dispose?(): void;
};

/** One minigame behind an Advent gate. */
export type MiniGame = {
  /** The gate, 1 to 26. */
  readonly number: number;
  /** Short id, the folder name without its number, such as "geschenkeregen". */
  readonly id: string;
  /** German name, shown as "Türchen 7 - <title>". */
  readonly title: string;
  /** Two to four short German lines: what to do and how to win. */
  readonly instructions: readonly string[];
  /** One German line with the controls. */
  readonly controls: string;
  /** False for a gate whose minigame is not built yet; it cannot be won. */
  readonly ready: boolean;
  /** Starts a run. */
  create(env: MiniEnv): MiniGameInstance;
};
