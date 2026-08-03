/**
 * The pieces around the canvas: the heads-up pills, the gear lever and the
 * buttons a phone gets instead of a keyboard.
 *
 * @module
 * @remarks
 * Shared by the solo screen and the online co-op screen. Both show the same
 * drive with the same controls - only who is at the wheel differs - so the
 * parts live here rather than being kept in step by hand in two files.
 */
"use client";

import { type ReactElement } from "react";
import { GEARS, NEUTRAL, REVERSE } from "@/games/rv-there-yet/engine/types";
import type { Hud } from "@/games/rv-there-yet/hooks/hud";
import type { TouchButton } from "@/games/rv-there-yet/hooks/controls";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";

/** Turning a share into whole percent. */
const PERCENT = 100;

/** How many decimals the clock shows. */
export const CLOCK_DIGITS = 1;

/**
 * One heads-up value.
 *
 * @param props - the text to show
 * @returns the pill element
 */
export function Pill({ children }: { children: string }): ReactElement {
  return (
    <span className="rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 font-medium tabular-nums dark:border-zinc-800 dark:bg-zinc-900/40">
      {children}
    </span>
  );
}

/**
 * The winch battery as a little bar.
 *
 * @param props - how full it is, from 0 to 1
 * @returns the battery element
 */
export function Battery({ share }: { share: number }): ReactElement {
  const percent = Math.round(share * PERCENT);
  return (
    <span
      data-testid="rv-battery"
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="text-zinc-500 dark:text-zinc-400">
        {RV_TEXTS.battery}
      </span>
      <span className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <span
          className={
            percent > 0
              ? "block h-full rounded-full bg-emerald-500"
              : "block h-full rounded-full bg-red-500"
          }
          style={{ width: `${Math.max(percent, percent > 0 ? 1 : 0)}%` }}
        />
      </span>
      <span className="w-9 text-right tabular-nums">{percent} %</span>
    </span>
  );
}

/**
 * The gear lever: reverse, neutral and the five forward gears.
 *
 * @param props - the gear that is in and what to do about a new one
 * @returns the lever element
 * @remarks
 * All of them side by side rather than a plus/minus pair. A gearbox is not a
 * dial you wind through - you reach for the gear you want, and on a slope with
 * a stalling engine you want it now.
 */
export function GearStick({
  gear,
  onShift,
}: {
  readonly gear: number;
  readonly onShift: (gear: number) => void;
}): ReactElement {
  return (
    <div
      data-testid="rv-gears"
      className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white/60 px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="px-1 text-xs text-zinc-500 dark:text-zinc-400">
        {RV_TEXTS.gear}
      </span>
      {GEARS.map((entry, index) => {
        const value = index + REVERSE;
        return (
          <button
            key={entry.label}
            type="button"
            data-testid={`rv-gear-${entry.label}`}
            onClick={() => onShift(value)}
            title={gearTitle(value)}
            className={
              value === gear
                ? "min-w-9 cursor-pointer rounded-lg bg-zinc-900 px-2 py-1 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "min-w-9 cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}

/** What a gear button says when hovered. */
function gearTitle(gear: number): string {
  if (gear === REVERSE) {
    return RV_TEXTS.gearReverse;
  }
  if (gear === NEUTRAL) {
    return RV_TEXTS.gearNeutral;
  }
  return RV_TEXTS.gearHint;
}

/**
 * The buttons a phone gets instead of a keyboard.
 *
 * @param props - what to do on a press, and the facts that light a button up
 * @returns the row of buttons
 */
export function TouchPad({
  onPress,
  hud,
}: {
  readonly onPress: (button: TouchButton, down: boolean) => void;
  readonly hud: Hud;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Pedal onPress={onPress} button="back">
        {RV_TEXTS.reverse}
      </Pedal>
      <Pedal onPress={onPress} button="forward">
        {RV_TEXTS.drive}
      </Pedal>
      <Pedal onPress={onPress} button="sprint" lit={!hud.inside}>
        {RV_TEXTS.sprint}
      </Pedal>
      <Pedal onPress={onPress} button="door">
        {RV_TEXTS.door}
      </Pedal>
      <Pedal onPress={onPress} button="hook" lit={hud.ready || hud.hooked}>
        {RV_TEXTS.hook}
      </Pedal>
      <Pedal onPress={onPress} button="wind" lit={hud.hooked && !hud.inside}>
        {RV_TEXTS.wind}
      </Pedal>
      <Pedal onPress={onPress} button="windOut" lit={hud.hooked && !hud.inside}>
        {RV_TEXTS.windOut}
      </Pedal>
    </div>
  );
}

/**
 * What this player is doing, and what the game is waiting for.
 *
 * @param props - the heads-up facts
 * @returns the one line that carries the whole loop
 * @remarks
 * Without it a player who gets out has no idea why the throttle suddenly walks
 * a little man instead of driving. In co-op it says one more thing: that you
 * are in the passenger seat and the pedals are not yours.
 */
export function Doing({ hud }: { readonly hud: Hud }): ReactElement {
  // Order matters: what you can do **right now** beats what you are carrying.
  // A rope on the tree must not hide the fact that you are standing at the
  // open door and one key away from driving on.
  let text: string;
  if (hud.repair > 0) {
    const share = Math.round(hud.repair * PERCENT);
    text =
      hud.job === "fit" ? RV_TEXTS.fitting(share) : RV_TEXTS.mending(share);
  } else if (hud.job === "fit") {
    text = RV_TEXTS.fitTyres;
  } else if (hud.canMend) {
    text = RV_TEXTS.wreckedWithHammer;
  } else if (hud.damaged && !hud.inside) {
    text = RV_TEXTS.wrecked;
  } else if (hud.passenger) {
    text = RV_TEXTS.passenger;
  } else if (hud.atDoor) {
    text = RV_TEXTS.atDoor;
  } else if (!hud.inside && hud.ready && !hud.hooked) {
    text = RV_TEXTS.ropeAtTree;
  } else if (hud.hooked) {
    text = hud.inside ? RV_TEXTS.ropeGetOut : RV_TEXTS.ropeRemote;
  } else if (!hud.inside && hud.candidate) {
    text = RV_TEXTS.ropeWalk;
  } else {
    text = hud.inside ? RV_TEXTS.atWheel : RV_TEXTS.onFoot;
  }

  return (
    <span data-testid="rv-doing" className={doingClass(hud)}>
      {text}
    </span>
  );
}

/** How the line looks: plain at the wheel, green on foot, red when wrecked. */
function doingClass(hud: Hud): string {
  if (hud.damaged) {
    return "rounded-lg border border-red-400 bg-red-50 px-3 py-1 font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200";
  }
  if (hud.inside) {
    return "rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 font-medium dark:border-zinc-800 dark:bg-zinc-900/40";
  }
  return "rounded-lg border border-emerald-400 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
}

/**
 * One held-down button.
 *
 * @param props - which button it is and what to do while it is down
 * @returns the button element
 */
export function Pedal({
  onPress,
  button,
  lit = false,
  children,
}: {
  readonly onPress: (button: TouchButton, down: boolean) => void;
  readonly button: TouchButton;
  readonly lit?: boolean;
  readonly children: string;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid={`rv-${button}`}
      onPointerDown={() => onPress(button, true)}
      onPointerUp={() => onPress(button, false)}
      onPointerLeave={() => onPress(button, false)}
      onPointerCancel={() => onPress(button, false)}
      className={
        lit
          ? "cursor-pointer touch-none rounded-lg border border-emerald-500 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 select-none dark:bg-emerald-950/40 dark:text-emerald-300"
          : "cursor-pointer touch-none rounded-lg border border-zinc-300 px-5 py-2 text-sm font-semibold select-none hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }
    >
      {children}
    </button>
  );
}

/**
 * A prominent button on an overlay.
 *
 * @param props - what to do when it is pressed
 * @returns the button element
 */
export function Action({
  onClick,
  children,
}: {
  readonly onClick: () => void;
  readonly children: string;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      {children}
    </button>
  );
}

/**
 * The row of keyboard hints under the canvas.
 *
 * @returns the hint element
 */
export function ControlsHint(): ReactElement {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
      <span className="font-semibold text-zinc-600 dark:text-zinc-300">
        {RV_TEXTS.controlsTitle}:
      </span>
      <span>{RV_TEXTS.gasKeys}</span>
      <span>{RV_TEXTS.gearKeys}</span>
      <span>{RV_TEXTS.walkKeys}</span>
      <span>{RV_TEXTS.doorKeys}</span>
      <span>{RV_TEXTS.hookKeys}</span>
      <span>{RV_TEXTS.windKeys}</span>
      <span className="w-full">{RV_TEXTS.hint}</span>
    </div>
  );
}
