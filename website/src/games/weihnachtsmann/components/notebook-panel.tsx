/**
 * The notebook: a small button with today's tasks done, and the panel it
 * opens - today's three tasks, the friendships of the character steered,
 * the photo album and the bests of the new activities.
 *
 * @module
 * @remarks
 * Built on the browser's own `<dialog>` like the achievements: Escape closes
 * it, a click beside the panel too, and while it is open the game ignores
 * the keys. The photos come from their own store, read when the panel opens
 * or a new photo was taken.
 */
"use client";

import {
  useCallback,
  useSyncExternalStore,
  type ReactElement,
  type RefObject,
} from "react";
import { PHOTO_POINTS } from "@/games/weihnachtsmann/engine/extras-data";
import {
  BEST_FRIENDS,
  friendLevel,
  pairKey,
} from "@/games/weihnachtsmann/engine/friends";
import { NIGHT_STARS } from "@/games/weihnachtsmann/engine/extras-data";
import { CHARACTER_IDS } from "@/games/weihnachtsmann/engine/types";
import type { Hud } from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import {
  CHARACTER_TEXTS,
  EXTRA_TEXTS,
  FRIEND_TEXTS,
} from "@/games/weihnachtsmann/i18n/texts";
import {
  loadAlbum,
  type Album,
} from "@/games/weihnachtsmann/storage/album-store";
import { Portrait } from "./portrait";

/** A whole bar, in percent. */
const FULL = 100;

/** Tenths in a second, for the air mail's best time. */
const TENTHS = 10;

/** The size of a photo in the album, px. */
const PHOTO_W = 128;
const PHOTO_H = 72;

/** No album: before the page has loaded, or on the server. */
const NO_ALBUM: Album = {};

/** The album as last read, and after how many photos it was read. */
let albumCache: { readonly shots: number; readonly album: Album } | null = null;

/**
 * Renders the button that opens the notebook, with today's tasks done.
 *
 * @param props - what the screen shows, how to open the panel, and its size
 * @returns the button
 */
export function NotebookButton({
  hud,
  onOpen,
  compact = false,
}: {
  readonly hud: Hud;
  readonly onOpen: () => void;
  /** A small chip for the strip under the picture, instead of a header button. */
  readonly compact?: boolean;
}): ReactElement {
  const done = hud.daily.filter((task) => task.done >= task.goal).length;
  const count = `${String(done)}/${String(hud.daily.length)}`;
  return (
    <button
      type="button"
      data-testid={compact ? "wm-notebook-chip" : "wm-notebook"}
      title={EXTRA_TEXTS.notebookOpen}
      aria-label={`${EXTRA_TEXTS.notebookOpen} (${count})`}
      onClick={(event) => {
        onOpen();
        event.currentTarget.blur();
      }}
      className={
        compact
          ? "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-sky-300/60 bg-sky-400/15 px-1.5 py-0.5 text-[11px] font-bold text-sky-200 hover:bg-sky-400/25"
          : "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }
    >
      {EXTRA_TEXTS.notebook} {count}
    </button>
  );
}

/**
 * Renders the notebook, closed until opened through its ref.
 *
 * @param props - what the screen shows, and the dialog's ref
 * @returns the dialog
 */
export function NotebookDialog({
  hud,
  dialogRef,
}: {
  readonly hud: Hud;
  readonly dialogRef: RefObject<HTMLDialogElement | null>;
}): ReactElement {
  const album = useSyncExternalStore(
    stayQuiet,
    () => albumAfter(hud.shots),
    () => NO_ALBUM,
  );
  const close = useCallback(() => dialogRef.current?.close(), [dialogRef]);
  const onBackdrop = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === dialogRef.current) {
        dialogRef.current.close();
      }
    },
    [dialogRef],
  );
  const steered = CHARACTER_IDS[hud.active];
  const friends = new Map(hud.friends);
  const allDone =
    hud.daily.length > 0 && hud.daily.every((task) => task.done >= task.goal);
  const post = hud.bests.postBest ?? 0;
  return (
    <dialog
      ref={dialogRef}
      data-testid="wm-notebook-dialog"
      onClick={onBackdrop}
      className="m-auto w-[min(52rem,94vw)] rounded-2xl bg-zinc-900 p-0 text-zinc-100 backdrop:bg-black/60"
    >
      <div className="flex max-h-[88vh] flex-col">
        <header className="flex items-start gap-3 border-b border-zinc-800 p-4">
          <h2 className="min-w-0 flex-1 text-lg font-bold text-sky-200">
            {EXTRA_TEXTS.notebookTitle}
          </h2>
          <button
            type="button"
            data-testid="wm-notebook-close"
            onClick={close}
            className="shrink-0 cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            {EXTRA_TEXTS.notebookClose}
          </button>
        </header>
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          <section data-testid="wm-daily">
            <h3 className="font-bold text-amber-200">
              {EXTRA_TEXTS.dailyTitle}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              {EXTRA_TEXTS.dailyIntro}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {hud.daily.length === 0 && (
                <li className="text-sm text-zinc-400">
                  {EXTRA_TEXTS.dailyNone}
                </li>
              )}
              {hud.daily.map((task) => {
                const done = task.done >= task.goal;
                return (
                  <li
                    key={task.kind}
                    data-testid={`wm-task-${task.kind}`}
                    data-done={done ? "" : undefined}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${done ? "border-emerald-400/60 bg-emerald-400/10" : "border-zinc-800 bg-zinc-950/60"}`}
                  >
                    <span aria-hidden="true" className="w-4 text-center">
                      {done ? "✓" : "○"}
                    </span>
                    <span className="min-w-0 flex-1">
                      {EXTRA_TEXTS.tasks[task.kind].replace(
                        "{n}",
                        String(task.goal),
                      )}
                    </span>
                    <span className="flex w-24 items-center gap-2 text-xs text-zinc-400">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <span
                          className="block h-full rounded-full bg-emerald-400/80"
                          style={{
                            width: `${String((task.done / task.goal) * FULL)}%`,
                          }}
                        />
                      </span>
                      {task.done}/{task.goal}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-zinc-300">
              {allDone && (
                <span className="mr-3 font-semibold text-emerald-300">
                  {EXTRA_TEXTS.dailyAll}
                </span>
              )}
              {EXTRA_TEXTS.dailyDays} {hud.bests.dailyDays ?? 0}
            </p>
          </section>

          <section data-testid="wm-friends">
            <h3 className="font-bold text-amber-200">
              {EXTRA_TEXTS.friendsTitle} - {CHARACTER_TEXTS[steered].name}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              {EXTRA_TEXTS.friendsIntro}
            </p>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {CHARACTER_IDS.filter((id) => id !== steered).map((id) => {
                const level = friendLevel(
                  friends.get(pairKey(steered, id)) ?? 0,
                );
                return (
                  <li
                    key={id}
                    data-testid={`wm-friend-${id}`}
                    data-level={level}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm"
                  >
                    <Portrait who={id} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {CHARACTER_TEXTS[id].name}
                      </span>
                      <span className="block text-xs text-zinc-400">
                        {FRIEND_TEXTS.steps[level]}
                      </span>
                    </span>
                    <span
                      className="text-base tracking-wider text-rose-400"
                      aria-label={`${String(level)}/${String(BEST_FRIENDS)}`}
                    >
                      {"♥".repeat(level)}
                      <span className="text-zinc-600">
                        {"♥".repeat(BEST_FRIENDS - level)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section data-testid="wm-album">
            <h3 className="font-bold text-amber-200">
              {EXTRA_TEXTS.albumTitle} {hud.photos.length}/{PHOTO_POINTS.length}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              {EXTRA_TEXTS.albumIntro}
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PHOTO_POINTS.map((point) => {
                const picture = album[point.id];
                const taken = hud.photos.includes(point.id);
                return (
                  <li
                    key={point.id}
                    data-testid={`wm-photo-${point.id}`}
                    data-taken={taken ? "" : undefined}
                    className="flex flex-col gap-1"
                  >
                    {picture !== undefined ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a photo kept in the browser as a data URL
                      <img
                        src={picture}
                        alt={EXTRA_TEXTS.photoNames[point.id]}
                        width={PHOTO_W}
                        height={PHOTO_H}
                        className="aspect-video w-full rounded-md border border-amber-300/50 object-cover"
                      />
                    ) : (
                      <span className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-zinc-700 bg-zinc-950/60 text-center text-[10px] text-zinc-500">
                        {EXTRA_TEXTS.albumMissing}
                      </span>
                    )}
                    <span className="text-center text-[11px] text-zinc-300">
                      {EXTRA_TEXTS.photoNames[point.id]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section data-testid="wm-bests">
            <h3 className="font-bold text-amber-200">
              {EXTRA_TEXTS.bestsTitle}
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              <Best
                label={EXTRA_TEXTS.bestPost}
                value={
                  post > 0
                    ? `${(post / TENTHS).toFixed(1)} s`
                    : EXTRA_TEXTS.noTime
                }
              />
              <Best
                label={EXTRA_TEXTS.bestSchool}
                value={`${String(hud.bests.schoolBest ?? 0)} ${EXTRA_TEXTS.hits}`}
              />
              <Best
                label={EXTRA_TEXTS.bestSnowman}
                value={`${String(hud.bests.snowmanBest ?? 0)} ${EXTRA_TEXTS.stars}`}
              />
              <Best
                label={EXTRA_TEXTS.bestPile}
                value={String(hud.bests.wrapped ?? 0)}
              />
              <Best
                label={EXTRA_TEXTS.bestKids}
                value={String(hud.bests.kids ?? 0)}
              />
              <Best
                label={EXTRA_TEXTS.bestWishes}
                value={String(hud.bests.starWishes ?? 0)}
              />
              <Best
                label={EXTRA_TEXTS.bestStars}
                value={`${String(hud.bests.nightStars ?? 0)}/${String(NIGHT_STARS.length)}`}
              />
            </dl>
          </section>
        </div>
      </div>
    </dialog>
  );
}

/**
 * The album, read again only after a new photo.
 *
 * @param shots - photos taken this visit
 * @returns the pictures by photo point
 */
function albumAfter(shots: number): Album {
  if (albumCache === null || albumCache.shots !== shots) {
    albumCache = { shots, album: loadAlbum() };
  }
  return albumCache.album;
}

/**
 * The album tells of no changes by itself: the screen's count of photos
 * makes it read again.
 *
 * @returns how to stop listening
 */
function stayQuiet(): () => void {
  return () => undefined;
}

/** One best or count: a label and its value. */
function Best({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className="font-semibold text-zinc-100">{value}</dd>
    </div>
  );
}
