/**
 * "RV There Yet?" - bring the motorhome over the mountain, from the side.
 *
 * @module
 * @remarks
 * The driving and the drawing live in the engine and {@link ./render}; this
 * component only lays out the canvas, the heads-up display and the overlays,
 * and wires them to {@link useRvThereYet}.
 */
"use client";

import Link from "next/link";
import { useRef, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";
import { useShotSpace } from "@/lib/screen/use-shot-space";
import { CANVAS_H, CANVAS_W } from "@/games/rv-there-yet/components/render";
import {
  Action,
  Fuel,
  CLOCK_DIGITS,
  ControlsHint,
  Doing,
  GearStick,
  Inventory,
  Pill,
  TouchPad,
} from "@/games/rv-there-yet/components/board";
import {
  useRvThereYet,
  type Hud,
  type Note,
} from "@/games/rv-there-yet/hooks/use-rv-there-yet";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";
import { Leaderboard } from "@/games/rv-there-yet/components/leaderboard";

import type { Run } from "@/games/rv-there-yet/stats/run-clock";

/** Milliseconds in a second, for handing the drive's clock to the board. */
const MS_PER_SECOND = 1000;

/**
 * Renders the "RV There Yet?" game screen.
 *
 * @returns the game element
 */
export function RvThereYetGame(): ReactElement {
  const {
    canvasRef,
    hud,
    run,
    note,
    start,
    again,
    newGame,
    next,
    back,
    touch,
    shift,
    pick,
  } = useRvThereYet();

  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  useShotRatio(canvasRef, stageRef);
  // The buttons go fullscreen with the picture, so it only gets the rest.
  useShotSpace(stageRef, controlsRef);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={RV_TEXTS.title} subtitle={RV_TEXTS.subtitle}>
        <button
          type="button"
          data-testid="rv-new-game"
          onClick={newGame}
          title={RV_TEXTS.newGameTitle}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {RV_TEXTS.newGame}
        </button>
        {fullscreen.supported && (
          <button
            type="button"
            data-testid="rv-fullscreen"
            onClick={fullscreen.toggle}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {fullscreen.active ? RV_TEXTS.fullscreenExit : RV_TEXTS.fullscreen}
          </button>
        )}
        <Link
          href="/rv-there-yet/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {RV_TEXTS.online}
        </Link>
        <Link
          href="/rv-there-yet/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {RV_TEXTS.statistics}
        </Link>
      </GameHeader>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            {RV_TEXTS.section(hud.section + 1, hud.sections, hud.sectionName)}
          </Pill>
          <Fuel share={hud.fuel} />
          <Doing hud={hud} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Jump onClick={back} title={RV_TEXTS.sectionBackTitle}>
            {RV_TEXTS.sectionBack}
          </Jump>
          <Jump onClick={next} title={RV_TEXTS.sectionForwardTitle}>
            {RV_TEXTS.sectionForward}
          </Jump>
        </div>
      </div>

      <div ref={stageRef} className="game-fullscreen flex flex-col gap-4">
        <div className="game-shot relative">
          <canvas
            ref={canvasRef}
            data-testid="rv-canvas"
            width={CANVAS_W}
            height={CANVAS_H}
            className="block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700"
          />
          <NoteView note={note} />
          <Overlay
            hud={hud}
            run={run}
            onStart={start}
            onAgain={again}
            onFromStart={newGame}
          />
          {fullscreen.active && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
            >
              {RV_TEXTS.fullscreenExit}
            </button>
          )}
        </div>

        {/* Inside the part that goes fullscreen, so the game can still be
            played with a thumb up there: the picture gives up the height
            these need rather than the other way round. */}
        <div ref={controlsRef} className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <GearStick gear={hud.gear} onShift={shift} driving={hud.driving} />
          </div>

          <Inventory
            carrying={hud.carrying}
            holding={hud.holding}
            onPick={pick}
          />

          <TouchPad onPress={touch} hud={hud} />

          <ControlsHint inside={hud.inside} />
        </div>
      </div>
    </div>
  );
}

/**
 * The short note that a section has been reached.
 *
 * @remarks
 * Over the canvas rather than in the row of pills: the number up there changes
 * quietly, and quietly is exactly how you miss that the game just saved your
 * evening's progress.
 */
function NoteView({
  note,
}: {
  readonly note: Note | null;
}): ReactElement | null {
  if (note === null) {
    return null;
  }
  return (
    <div
      key={note.id}
      data-testid="rv-note"
      className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"
    >
      <span className="rounded-xl bg-blue-600/90 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
        {"\u{1F6A9}"} {RV_TEXTS.sectionDone(note.section)}
        <span className="block text-xs font-normal text-blue-100">
          {RV_TEXTS.sectionSaved}
        </span>
      </span>
    </div>
  );
}

/** Props of {@link Jump}. */
type JumpProps = {
  readonly onClick: () => void;
  readonly title: string;
  readonly children: string;
};

/**
 * A button that jumps to another section.
 *
 * @remarks
 * Never disabled: both ends wrap around, so there is no dead button at the
 * start or the end of the map.
 */
function Jump({ onClick, title, children }: JumpProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

/** Props of {@link Overlay}. */
type OverlayProps = {
  readonly hud: Hud;
  /** The drive as a whole, for the board of best times. */
  readonly run: Run;
  readonly onStart: () => void;
  /** Starts the section that is being played over. */
  readonly onAgain: () => void;
  /** Starts the whole map over at the first section. */
  readonly onFromStart: () => void;
};

/**
 * The screen over the canvas before the start and after the drive ends.
 *
 * @param props - the world, the drive as a whole, and what the buttons do
 * @returns the overlay, or nothing while the drive is running
 * @remarks
 * Exported for the tests: which screen comes up when, and what is on it, is
 * worth pinning and is nothing a canvas test can see.
 */
export function Overlay({
  hud,
  run,
  onStart,
  onAgain,
  onFromStart,
}: OverlayProps): ReactElement | null {
  if (!hud.running) {
    return (
      <button
        type="button"
        onClick={onStart}
        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-900/70 p-4 text-center text-white"
      >
        <span className="text-lg font-semibold">{RV_TEXTS.title}</span>
        <span className="text-sm text-zinc-200">{RV_TEXTS.startHint}</span>
        <span className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold">
          {RV_TEXTS.start}
        </span>
      </button>
    );
  }
  if (hud.phase === "plunged") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-950/90 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F573}"} {RV_TEXTS.plunged}
        </p>
        <p className="text-sm text-zinc-300">{RV_TEXTS.plungedHint}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Action onClick={onAgain}>{RV_TEXTS.again}</Action>
        </div>
      </div>
    );
  }
  if (hud.phase === "fallen") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-950/90 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F6A7}"} {RV_TEXTS.fallen}
        </p>
        <p className="text-sm text-zinc-300">{RV_TEXTS.fallenHint}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Action onClick={onAgain}>{RV_TEXTS.again}</Action>
        </div>
      </div>
    );
  }
  if (hud.phase === "taken") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-950/90 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F5A4}"} {RV_TEXTS.taken}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Action onClick={onAgain}>{RV_TEXTS.again}</Action>
        </div>
      </div>
    );
  }
  if (hud.phase === "mauled") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-red-950/80 p-4 text-center text-white">
        <p className="text-2xl font-bold">
          {"\u{1F43B}"} {RV_TEXTS.mauled}
        </p>
        <p className="text-sm text-red-100">{RV_TEXTS.mauledHint}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Action onClick={onAgain}>{RV_TEXTS.again}</Action>
        </div>
      </div>
    );
  }
  if (hud.phase !== "arrived") {
    return null;
  }
  // Arriving at the flag is the end of the whole map, so there is no "on" -
  // and no going back to the last section either. Playing again means playing
  // the map, from the plateau.
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-2xl bg-zinc-900/85 p-4 text-center text-white">
      <p className="text-2xl font-bold">
        {"\u{1F3C1}"} {RV_TEXTS.arrived}
      </p>
      <p className="text-sm text-zinc-200">
        {RV_TEXTS.arrivedIn(hud.time.toFixed(CLOCK_DIGITS))}
      </p>
      <p className="text-base font-semibold text-emerald-300">
        {RV_TEXTS.allDone}
      </p>
      <Leaderboard
        run={{ ms: run.seconds * MS_PER_SECOND, whole: run.whole }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Action onClick={onFromStart}>{RV_TEXTS.againFromStart}</Action>
      </div>
    </div>
  );
}
