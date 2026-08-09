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
import {
  GEARS,
  NEUTRAL,
  REVERSE,
  STOP_SPEED,
  type ItemKind,
} from "@/games/rv-there-yet/engine/types";
import type { Hud } from "@/games/rv-there-yet/hooks/hud";
import type { TouchButton } from "@/games/rv-there-yet/hooks/controls";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";

/** Turning a share into whole percent. */
const PERCENT = 100;

/** Below this share of a tank the gauge turns red. */
const LOW_FUEL = 0.2;

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
 * The fuel tank as a little bar.
 *
 * @param props - how full it is, from 0 to 1
 * @returns the gauge element
 * @remarks
 * Red below a fifth, the way a real one lights up: a bar that only ever shrinks
 * quietly is a bar nobody looks at until the engine stops.
 */
export function Fuel({ share }: { share: number }): ReactElement {
  const percent = Math.round(share * PERCENT);
  const low = share <= LOW_FUEL;
  return (
    <span
      data-testid="rv-fuel"
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="text-zinc-500 dark:text-zinc-400">{RV_TEXTS.fuel}</span>
      <span className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <span
          className={
            low
              ? "block h-full rounded-full bg-red-500"
              : "block h-full rounded-full bg-emerald-500"
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
  driving,
}: {
  readonly gear: number;
  readonly onShift: (gear: number) => void;
  readonly driving: boolean;
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
            disabled={!driving}
            className={gearClass(value === gear, driving)}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * How a gear button looks: the one in, one that could be, or none of yours.
 *
 * @param on - whether this is the gear that is in
 * @param driving - whether this player is the one at the wheel
 * @returns the classes for it
 * @remarks
 * Dead unless you are steering. Out on the verge there is no gear to change,
 * and in the passenger seat the gearbox belongs to somebody else.
 */
function gearClass(on: boolean, driving: boolean): string {
  const shape = "min-w-9 rounded-lg px-2 py-1 text-sm";
  if (!driving) {
    return `${shape} cursor-not-allowed border border-zinc-200 font-semibold text-zinc-300 dark:border-zinc-800 dark:text-zinc-700`;
  }
  if (on) {
    return `${shape} cursor-pointer bg-zinc-900 font-bold text-white dark:bg-zinc-100 dark:text-zinc-900`;
  }
  return `${shape} cursor-pointer border border-zinc-300 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`;
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
 * The bag: everything picked up, with the one in hand marked.
 *
 * @param props - what is in the bag, what is held, and what a click means
 * @returns the list element
 * @remarks
 * A list rather than a line of text, because choosing is the point: only what
 * is **in the hand** can be used, so the list has to say which one that is and
 * let you change it in one click.
 */
export function Inventory({
  carrying,
  holding,
  onPick,
}: {
  readonly carrying: readonly ItemKind[];
  readonly holding: ItemKind | null;
  readonly onPick: (slot: number) => void;
}): ReactElement {
  return (
    <div
      data-testid="rv-inventory"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {RV_TEXTS.inventory}
      </span>
      {carrying.length === 0 && (
        <span className="text-xs text-zinc-400">{RV_TEXTS.inventoryEmpty}</span>
      )}
      {carrying.map((kind, slot) => (
        <button
          key={kind}
          type="button"
          data-testid={`rv-slot-${kind}`}
          onClick={() => onPick(slot)}
          title={kind === holding ? RV_TEXTS.inHand : ITEM_NAME[kind]}
          className={
            kind === holding
              ? "cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white"
              : "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }
        >
          {ITEM_NAME[kind]}
        </button>
      ))}
    </div>
  );
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
      <Pedal onPress={onPress} button="back" hud={hud}>
        {RV_TEXTS.reverse}
      </Pedal>
      <Pedal onPress={onPress} button="forward" hud={hud}>
        {RV_TEXTS.drive}
      </Pedal>
      <Pedal onPress={onPress} button="sprint" hud={hud}>
        {RV_TEXTS.sprint}
      </Pedal>
      <Pedal onPress={onPress} button="door" hud={hud}>
        {RV_TEXTS.door}
      </Pedal>
      <Pedal onPress={onPress} button="take" hud={hud}>
        {RV_TEXTS.take}
      </Pedal>
      <Pedal onPress={onPress} button="use" hud={hud}>
        {RV_TEXTS.use}
      </Pedal>
      <Pedal onPress={onPress} button="jump" hud={hud}>
        {hud.inside ? RV_TEXTS.handbrake : RV_TEXTS.jump}
      </Pedal>
      <Pedal onPress={onPress} button="wind" hud={hud}>
        {RV_TEXTS.wind}
      </Pedal>
      <Pedal onPress={onPress} button="windOut" hud={hud}>
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
/**
 * What that line says, as a plain string.
 *
 * @param hud - the heads-up facts
 * @returns the sentence to show, or nothing at all
 * @remarks
 * It speaks only while the player is **doing** something: a job with a key held
 * down, the spray, the brake, the mud under the wheels. What there is to do in
 * a section is on the board at the start of it, and a line that keeps saying it
 * as well turns every puzzle into a set of instructions - "go and find the
 * hammer", "put the rope on that tree", "get out and walk". Read them once and
 * there is nothing left to work out.
 *
 * What is being **done to you** is not on it either. A percentage counting up
 * while the bear has hold of you, or while the fog is deciding it has waited
 * long enough, turns a fright into a progress bar: the picture already says
 * both, in claws and in a shape coming out of the grey.
 *
 * Pulled out of the component so the **order** can be tested, which is where
 * this has gone wrong before: the spray has to beat everything else, because
 * the bear reaches you while you are still holding the key down.
 */
export function doingText(hud: Hud): string {
  const bear = hud.bear;
  // The brake is held down by a hand on a key, and without a word the vehicle
  // reads as one that has stopped working rather than one being braked.
  if (hud.inside && hud.brake) {
    return RV_TEXTS.parked;
  }
  // Throttle down and going nowhere is the moment somebody starts wondering
  // whether the game is broken.
  if (hud.inside && hud.mud) {
    return RV_TEXTS.mud;
  }
  // It reaches you **while** you spray - that is the nerve of the thing - and
  // the number that says "keep holding" beats the one that says "it has you".
  if (bear !== null && bear.sprayed > 0) {
    return RV_TEXTS.bearSpraying(Math.round(bear.sprayed * PERCENT));
  }
  // Hammering, fitting, fuelling, felling: a job with a key held down and a
  // count that has to be watched, because letting go loses it.
  if (hud.repair > 0) {
    return WORKING[hud.job ?? "mend"](Math.round(hud.repair * PERCENT));
  }
  // Not a hint but a fact about the controls: a passenger pressing the pedals
  // and seeing nothing happen has no other way of finding out why.
  if (hud.passenger) {
    return RV_TEXTS.passenger;
  }
  return "";
}

export function Doing({ hud }: { readonly hud: Hud }): ReactElement | null {
  const text = doingText(hud);
  // Nothing going on, nothing on the screen: an empty box with a border round
  // it is worse than the sentence it lost.
  if (text === "") {
    return null;
  }
  return (
    <span data-testid="rv-doing" className={doingClass(hud)}>
      {text}
    </span>
  );
}

/** What the line counts up while each job is being done. */
const WORKING: Readonly<
  Record<"mend" | "fit" | "fuel" | "fell", (share: number) => string>
> = {
  mend: RV_TEXTS.mending,
  fit: RV_TEXTS.fitting,
  fuel: RV_TEXTS.fuelling,
  fell: RV_TEXTS.felling,
};

/** What each thing is called in the bag. */
export const ITEM_NAME: Readonly<Record<ItemKind, string>> = {
  remote: RV_TEXTS.itemRemote,
  can: RV_TEXTS.itemCan,
  hammer: RV_TEXTS.itemHammer,
  tyres: RV_TEXTS.itemTyres,
  spray: RV_TEXTS.itemSpray,
  axe: RV_TEXTS.itemAxe,
};

/** How the line looks: plain at the wheel, green on foot, red when wrecked. */
function doingClass(hud: Hud): string {
  if (hud.still > 0) {
    return "rounded-lg border border-red-500 bg-red-100 px-3 py-1 font-semibold text-red-900 dark:bg-red-950/60 dark:text-red-100";
  }
  if (hud.bear !== null && (hud.bear.coming || hud.bear.danger > 0)) {
    return "rounded-lg border border-red-500 bg-red-100 px-3 py-1 font-semibold text-red-900 dark:bg-red-950/60 dark:text-red-100";
  }
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
  hud,
  children,
}: {
  readonly onPress: (button: TouchButton, down: boolean) => void;
  readonly button: TouchButton;
  readonly hud: Hud;
  readonly children: string;
}): ReactElement {
  const now = pedalNow(hud, button);
  return (
    <button
      type="button"
      data-testid={`rv-${button}`}
      disabled={!now.on}
      onPointerDown={() => onPress(button, true)}
      onPointerUp={() => onPress(button, false)}
      onPointerLeave={() => onPress(button, false)}
      onPointerCancel={() => onPress(button, false)}
      className={pedalClass(now)}
    >
      {children} <span className="font-normal opacity-60">({now.keys})</span>
    </button>
  );
}

/** How a button looks: dead, plain, or lit up because it is the one to press. */
function pedalClass(now: PedalNow): string {
  const shape =
    "touch-none rounded-lg border px-5 py-2 text-sm font-semibold select-none";
  if (!now.on) {
    return `${shape} cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700`;
  }
  if (now.lit) {
    return `${shape} cursor-pointer border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300`;
  }
  return `${shape} cursor-pointer border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`;
}

/** What a button is worth pressing for at this moment. */
export type PedalNow = {
  /** The key on a keyboard that does the same thing. */
  readonly keys: string;
  /** Whether pressing it would do anything at all here. */
  readonly on: boolean;
  /** Whether it is the one thing to press right now. */
  readonly lit: boolean;
};

/**
 * Which key a button stands for, and whether it does anything here.
 *
 * @param hud - the heads-up facts
 * @param button - which button
 * @returns its key, whether it is live, and whether it is lit up
 * @remarks
 * Two jobs, one place. The key is on the button because somebody who has found
 * the button once should not have to find it again - the row is a keyboard
 * lesson as much as it is a control. And a button that cannot do anything is
 * **dead**: nine buttons of which four do something is a row you have to think
 * about, and the pedals are not where the thinking belongs.
 *
 * `W`/`S` and `A`/`D` are the same two buttons in both seats, so the key on
 * them changes with the seat, which is exactly what the keyboard does too.
 */
export function pedalNow(hud: Hud, button: TouchButton): PedalNow {
  const bear = hud.bear;
  const onFoot = !hud.inside;
  switch (button) {
    case "forward":
      return { keys: hud.inside ? "W" : "D", on: !hud.passenger, lit: false };
    case "back":
      return { keys: hud.inside ? "S" : "A", on: !hud.passenger, lit: false };
    case "sprint":
      return { keys: RV_TEXTS.keyShift, on: onFoot, lit: false };
    case "door":
      // In: only once it has stopped rolling. Out: only at the door.
      return {
        keys: "E",
        on: hud.inside ? Math.abs(hud.speed) <= STOP_SPEED : hud.atDoor,
        lit: onFoot && hud.atDoor,
      };
    case "take":
      return {
        keys: "F",
        on: onFoot && hud.pickUp !== null,
        lit: hud.pickUp !== null,
      };
    case "use": {
      // The same key, and everything it does other than picking a thing up:
      // the rope on or off a tree, a job at the motorhome, the spray.
      const useful =
        hud.ready ||
        hud.hooked ||
        hud.job !== null ||
        (bear !== null && bear.canSpray && bear.inBag);
      return { keys: "F", on: onFoot && useful, lit: onFoot && useful };
    }
    case "jump":
      // One button, two seats: a jump out there, the handbrake at the wheel -
      // and the handbrake belongs to whoever is steering.
      return {
        keys: RV_TEXTS.keySpace,
        on: onFoot || hud.driving,
        lit: hud.inside && hud.brake,
      };
    default:
      // Reeling in and paying out: the remote only works in a hand, and only
      // while the rope is on something.
      return {
        keys: button === "wind" ? "W" : "S",
        on: onFoot && hud.hooked,
        lit: onFoot && hud.hooked,
      };
  }
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
      <span>{RV_TEXTS.takeKeys}</span>
      <span>{RV_TEXTS.cycleKeys}</span>
      <span>{RV_TEXTS.hookKeys}</span>
      <span>{RV_TEXTS.jumpKeys}</span>
      <span>{RV_TEXTS.windKeys}</span>
      <span className="w-full">{RV_TEXTS.hint}</span>
    </div>
  );
}
