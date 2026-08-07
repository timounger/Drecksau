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
      <Pedal onPress={onPress} button="take" lit={hud.pickUp !== null}>
        {RV_TEXTS.take}
      </Pedal>
      <Pedal onPress={onPress} button="use" lit={hud.ready || hud.hooked}>
        {RV_TEXTS.use}
      </Pedal>
      <Pedal
        onPress={onPress}
        button="jump"
        lit={hud.inside ? hud.brake : true}
      >
        {hud.inside ? RV_TEXTS.handbrake : RV_TEXTS.jump}
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
/**
 * What that line says, as a plain string.
 *
 * @param hud - the heads-up facts
 * @returns the sentence to show
 * @remarks
 * Pulled out of the component so the **order** can be tested. The order is the
 * whole substance here, and it has been wrong before: the line went on saying
 * "go and find the hammer" one frame after the hammer had been picked up, so a
 * player who read it went looking for a thing already in their hand.
 */
export function doingText(hud: Hud): string {
  // Order matters: what you can do **right now** beats what you are carrying.
  // A rope on the tree must not hide the fact that you are standing at the
  // open door and one key away from driving on.
  let text: string;
  const bear = hud.bear;
  // Standing in the fog beats even the bear: the bear you can see coming.
  if (hud.still > 0) {
    return RV_TEXTS.standingStill(Math.round(hud.still * PERCENT));
  }
  // While it is held there is nothing else the driver could be doing, and the
  // line saying so is what tells them the vehicle is being braked rather than
  // failing to pull away.
  if (hud.inside && hud.brake) {
    return RV_TEXTS.parked;
  }
  // The chasm before the bridge: it is the one that kills, and everything in
  // that section is about getting past it.
  if (hud.chasm && hud.felled) {
    return RV_TEXTS.felled;
  }
  if (hud.chasm) {
    if (hud.job === "fell" || hud.repair > 0) {
      return hud.repair > 0
        ? RV_TEXTS.felling(Math.round(hud.repair * PERCENT))
        : RV_TEXTS.fellHere;
    }
    if (hud.carrying.includes("axe")) {
      return RV_TEXTS.chasmAxe;
    }
    if (hud.pickUp === "axe") {
      return RV_TEXTS.pickUpAxe;
    }
    if (hud.roof) {
      return RV_TEXTS.chasmRoof;
    }
    if (hud.ladder) {
      return RV_TEXTS.chasmLadder;
    }
    return hud.inside ? RV_TEXTS.chasm : RV_TEXTS.chasmNeedAxe;
  }
  // The bridge before anything else about driving: by the time it matters the
  // wheels are already on it, and the one thing worth saying is who has to get
  // out. The second line only appears when there is somebody to get out.
  if (hud.bridge) {
    return hud.aboard > 1 ? RV_TEXTS.bridgeAlone : RV_TEXTS.bridgeSign;
  }
  // A bear beats everything else on the screen. It is the only thing here that
  // kills, and it is coming whether or not you were reading the line.
  if (bear !== null && bear.sprayed > 0) {
    // Ahead of the danger on purpose. The bear reaches you **while** you are
    // spraying - that is the nerve of the thing - and at that moment the one
    // number worth reading is the one that says "keep holding". That it has
    // hold of you needs no caption; the line is already red.
    text = RV_TEXTS.bearSpraying(Math.round(bear.sprayed * PERCENT));
  } else if (bear !== null && bear.danger > 0) {
    text = RV_TEXTS.bearHolding(Math.round(bear.danger * PERCENT));
  } else if (bear !== null && bear.canSpray && bear.armed) {
    text = RV_TEXTS.bearSpray;
  } else if (bear !== null && bear.canSpray) {
    text = RV_TEXTS.bearRun;
  } else if (bear !== null && bear.coming && bear.armed) {
    text = RV_TEXTS.bearComingArmed;
  } else if (bear !== null && bear.coming) {
    text = RV_TEXTS.bearComing;
  } else if (hud.repair > 0) {
    const share = Math.round(hud.repair * PERCENT);
    text = WORKING[hud.job ?? "mend"](share);
  } else if (hud.job === "fit") {
    text = RV_TEXTS.fitTyres;
  } else if (hud.job === "fuel") {
    text = RV_TEXTS.fuelUp;
  } else if (hud.pickUp !== null) {
    // Standing at a thing beats everything else the key could do there: it is
    // the one action that vanishes if you walk on without noticing it.
    text = PICK_UP[hud.pickUp];
  } else if (hud.canMend) {
    text = RV_TEXTS.wreckedWithHammer;
  } else if (hud.damaged && !hud.inside && hud.carrying.includes("hammer")) {
    // Carried is enough. Without this the line said "go and find the hammer"
    // one frame after picking the hammer up, and a player who reads that goes
    // looking for a thing already in their bag.
    text = RV_TEXTS.wreckedGotHammer;
  } else if (hud.damaged && !hud.inside) {
    text = RV_TEXTS.wrecked;
  } else if (!hud.inside && hud.carrying.includes("can") && hud.fuel < 1) {
    text = RV_TEXTS.gotCan;
  } else if (!hud.inside && !hud.tyres && hud.carrying.includes("tyres")) {
    text = RV_TEXTS.gotTyres;
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
  return text;
}

export function Doing({ hud }: { readonly hud: Hud }): ReactElement {
  return (
    <span data-testid="rv-doing" className={doingClass(hud)}>
      {doingText(hud)}
    </span>
  );
}

/** What the line says for each thing lying about. */
const PICK_UP: Readonly<Record<ItemKind, string>> = {
  // The remote never lies on the route, so it never needs picking up.
  remote: "",
  can: RV_TEXTS.pickUpCan,
  hammer: RV_TEXTS.pickUpHammer,
  tyres: RV_TEXTS.pickUpTyres,
  spray: RV_TEXTS.pickUpSpray,
  axe: RV_TEXTS.pickUpAxe,
};

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
      <span>{RV_TEXTS.takeKeys}</span>
      <span>{RV_TEXTS.cycleKeys}</span>
      <span>{RV_TEXTS.hookKeys}</span>
      <span>{RV_TEXTS.jumpKeys}</span>
      <span>{RV_TEXTS.windKeys}</span>
      <span className="w-full">{RV_TEXTS.hint}</span>
    </div>
  );
}
