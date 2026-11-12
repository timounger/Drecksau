/**
 * The field and everything around it: the canvas, the line saying whose turn
 * it is, the ability bar and the hold-to-throw button.
 *
 * @module
 * @remarks
 * Shared by both modes. The owner hands in the match and says which seat this
 * screen throws for - the single-player screen the left one, the online screen
 * its own.
 */
"use client";

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { ABILITIES, characterById } from "@/games/wurfduell/engine/characters";
import type { DuelGame, ThrowInput } from "@/games/wurfduell/engine/types";
import type { SoundPlayer } from "@/games/wurfduell/audio/sounds";
import { useArena, type Arena } from "@/games/wurfduell/hooks/use-arena";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";
import { VIEW_HEIGHT_TALL, VIEW_HEIGHT_WIDE, VIEW_WIDTH } from "./render";
import {
  aimDotsSetting,
  cameraSetting,
} from "@/games/wurfduell/settings/preferences";

/** The media query of an upright phone, which gets a taller picture. */
const UPRIGHT_QUERY = "(orientation: portrait) and (max-width: 700px)";

/** Props of {@link ArenaView}. */
export type ArenaViewProps = {
  readonly game: DuelGame;
  readonly names: readonly string[];
  /** The seat this screen throws for. */
  readonly controlSeat: number;
  readonly onThrow: (input: ThrowInput) => void;
  readonly sound: SoundPlayer;
  /** Told whenever a throw's animation has finished. */
  readonly onSettled?: (throwId: number) => void;
  /** Gives up the match for this screen's player. */
  readonly onResign?: () => void;
  /** Something laid over the field - the end-of-match panel. */
  readonly overlay?: ReactNode;
  /** Something beside the status line - an online turn clock. */
  readonly extra?: ReactNode;
};

/**
 * Renders the field and its controls.
 *
 * @param props - the match and what this screen may do
 * @returns the arena
 */
export function ArenaView({
  game,
  names,
  controlSeat,
  onThrow,
  sound,
  onSettled,
  onResign,
  overlay,
  extra,
}: ArenaViewProps): ReactElement {
  const upright = useUpright();
  const viewHeight = upright ? VIEW_HEIGHT_TALL : VIEW_HEIGHT_WIDE;
  const cameraMode = useSyncExternalStore(
    cameraSetting.subscribe,
    cameraSetting.getSnapshot,
    cameraSetting.getServerSnapshot,
  );
  const aimDots = useSyncExternalStore(
    aimDotsSetting.subscribe,
    aimDotsSetting.getSnapshot,
    aimDotsSetting.getServerSnapshot,
  );
  const { canvasRef, pointer, ...arena } = useArena({
    game,
    names,
    controlSeat,
    onThrow,
    sound,
    cameraMode,
    aimDots,
    viewHeight,
  });
  // As wide as fits the screen's height, so the feet are never cut off on a
  // phone held sideways.
  const fitHeight = `calc((100svh - 1rem) * ${VIEW_WIDTH} / ${viewHeight})`;
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  useShotRatio(canvasRef, stageRef);

  const settledId = arena.settledId;
  useEffect(() => {
    onSettled?.(settledId);
  }, [onSettled, settledId]);

  const seat = game.turn;
  const animating = settledId !== (game.lastThrow?.id ?? 0);

  let status: string = T.turnOf(names[seat] ?? "");
  if (game.phase === "over") {
    status = T.winnerIs(names[game.winner ?? 0] ?? "");
  } else if (animating) {
    status = T.watching;
  } else if (arena.canAim) {
    status = T.yourTurn;
  }
  const autoNote = !animating && game.lastThrow?.auto === true;
  const controls = (
    <Controls arena={arena} game={game} controlSeat={controlSeat} />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p
          data-testid="wd-status"
          className={`rounded-lg px-3 py-1 font-semibold ${
            arena.canAim
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          {status}
        </p>
        <div className="flex items-center gap-2">
          {extra}
          {fullscreen.supported && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {fullscreen.active ? T.fullscreenExit : T.fullscreen}
            </button>
          )}
        </div>
      </div>
      {autoNote && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.autoThrow}
        </p>
      )}

      <div ref={stageRef} className="game-fullscreen relative">
        <canvas
          ref={canvasRef}
          data-testid="wd-canvas"
          width={VIEW_WIDTH}
          height={viewHeight}
          {...pointer}
          style={{ maxWidth: fitHeight }}
          className={`mx-auto block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm select-none dark:border-zinc-700 ${
            arena.canAim ? "cursor-crosshair" : "cursor-default"
          }`}
        />
        {overlay}
        {fullscreen.active && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white"
          >
            {T.fullscreenExit}
          </button>
        )}
        {fullscreen.active && (
          <div className="game-controls flex justify-center">{controls}</div>
        )}
      </div>

      {!fullscreen.active && controls}

      <div className="game-hint flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.controlsPointer} {T.controlsHint}
          <span className="hidden sm:inline"> {T.controlsKeys}</span>
        </p>
        {onResign !== undefined && game.phase !== "over" && (
          <button
            type="button"
            data-testid="wd-resign"
            onClick={() => {
              if (window.confirm(T.resignConfirm)) {
                onResign();
              }
            }}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {T.resign}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Whether the screen is an upright phone.
 *
 * @returns true on a narrow screen held upright
 */
function useUpright(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(UPRIGHT_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(UPRIGHT_QUERY).matches,
    () => false,
  );
}

/** The ability bar, the angle read-out and the hold-to-throw button. */
function Controls({
  arena,
  game,
  controlSeat,
}: {
  readonly arena: Omit<Arena, "canvasRef" | "pointer">;
  readonly game: DuelGame;
  readonly controlSeat: number;
}): ReactElement {
  const own = game.players[controlSeat];
  const abilities =
    own.character === null ? [] : characterById(own.character).abilities;
  const armed = arena.armed === null ? null : ABILITIES[arena.armed];
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="group"
        aria-label={T.abilitiesTitle}
        className="flex flex-wrap justify-center gap-2"
      >
        {abilities.map((id, index) => {
          const ability = ABILITIES[id];
          const spent = own.used.includes(id);
          const active = arena.armed === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`wd-ability-${id}`}
              aria-pressed={active}
              title={ability.description}
              disabled={!arena.canAim || spent}
              onClick={() => arena.toggleAbility(id)}
              className={`flex min-h-11 max-w-[11rem] cursor-pointer items-center gap-2 rounded-xl border-2 px-2 py-1 text-left text-xs disabled:cursor-default ${
                active
                  ? "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
                  : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              } ${spent ? "opacity-35 grayscale" : arena.canAim ? "" : "opacity-60"}`}
            >
              <span className="text-xl" aria-hidden="true">
                {ability.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-bold">
                  <span className="hidden text-zinc-400 sm:inline">
                    {index + 1}{" "}
                  </span>
                  {ability.name}
                </span>
                <span className="leading-tight text-zinc-500 dark:text-zinc-400">
                  {spent ? T.used : ability.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {armed !== null && (
          <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            {T.abilityArmed(armed.name)}
          </span>
        )}
        <span
          data-testid="wd-angle"
          className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium tabular-nums dark:bg-zinc-800"
        >
          {T.angle(arena.angle)}
        </span>
        <button
          type="button"
          data-testid="wd-throw"
          disabled={!arena.canAim}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            arena.startCharge();
          }}
          onPointerUp={arena.release}
          onContextMenu={(event) => event.preventDefault()}
          className="cursor-pointer touch-none rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow select-none hover:bg-red-700 disabled:cursor-default disabled:opacity-40"
        >
          {arena.charging ? T.releaseToThrow : T.holdToThrow}
        </button>
      </div>
    </div>
  );
}
