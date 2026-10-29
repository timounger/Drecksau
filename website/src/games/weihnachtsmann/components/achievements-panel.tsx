/**
 * The achievements on screen: a small button with the count, and the panel it
 * opens with a card for every achievement - unlocked ones with badge, what
 * was done and when, locked ones greyed with a hint (secret ones as "???")
 * and how far they have come.
 *
 * @module
 * @remarks
 * Built on the browser's own `<dialog>` like the rules: Escape closes it, a
 * click beside the panel too, and while it is open the game ignores the keys.
 */
"use client";

import {
  useCallback,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from "react";
import figuresImage from "@/games/weihnachtsmann/assets/figures-2x.png";
import { ACHIEVEMENTS } from "@/games/weihnachtsmann/engine/achievements";
import type { AchievementId } from "@/games/weihnachtsmann/engine/types";
import type { Hud } from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import {
  ACHIEVEMENT_TEXTS,
  CHARACTER_TEXTS,
  WM_TEXTS,
} from "@/games/weihnachtsmann/i18n/texts";
import { BADGES } from "./render-world";
import { EFFECTS, SHEET_DENSITY } from "./sprite-atlas";

/** Badge size on screen, CSS px per art px. */
const BADGE_ZOOM = 1;

/** A whole bar, in percent. */
const FULL = 100;

/**
 * Renders the button that opens the achievements, with "x / N".
 *
 * @param props - what the screen shows, how to open the panel, and its size
 * @returns the button
 */
export function AchievementsButton({
  hud,
  onOpen,
  compact = false,
  short = false,
}: {
  readonly hud: Hud;
  readonly onOpen: () => void;
  /** A small chip for the strip under the picture, instead of a header button. */
  readonly compact?: boolean;
  /** Only the star and the count, where room is tight (on a phone). */
  readonly short?: boolean;
}): ReactElement {
  const count = `${String(hud.achieved.length)}/${String(ACHIEVEMENTS.length)}`;
  return (
    <button
      type="button"
      data-testid={compact ? "wm-achievements-chip" : "wm-achievements"}
      title={WM_TEXTS.achievementsOpen}
      aria-label={`${WM_TEXTS.achievementsOpen} (${count})`}
      onClick={(event) => {
        onOpen();
        event.currentTarget.blur();
      }}
      className={
        compact
          ? "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-amber-300/60 bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-200 hover:bg-amber-400/25"
          : "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }
    >
      <span aria-hidden="true">★</span>{" "}
      {short ? count : `${WM_TEXTS.achievements} ${count}`}
    </button>
  );
}

/**
 * Renders the achievements panel, closed until opened through its ref.
 *
 * @param props - what the screen shows, and the dialog's ref
 * @returns the dialog
 */
export function AchievementsDialog({
  hud,
  dialogRef,
}: {
  readonly hud: Hud;
  readonly dialogRef: RefObject<HTMLDialogElement | null>;
}): ReactElement {
  const close = useCallback(() => dialogRef.current?.close(), [dialogRef]);
  const onBackdrop = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === dialogRef.current) {
        dialogRef.current.close();
      }
    },
    [dialogRef],
  );
  const unlocked = new Map(hud.achieved);
  return (
    <dialog
      ref={dialogRef}
      data-testid="wm-achievements-dialog"
      onClick={onBackdrop}
      className="m-auto w-[min(52rem,94vw)] rounded-2xl bg-zinc-900 p-0 text-zinc-100 backdrop:bg-black/60"
    >
      <div className="flex max-h-[88vh] flex-col">
        <header className="flex items-start gap-3 border-b border-zinc-800 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-amber-200">
              {WM_TEXTS.achievementsTitle}{" "}
              <span
                data-testid="wm-achievements-count"
                className="text-zinc-100"
              >
                {hud.achieved.length} / {ACHIEVEMENTS.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {WM_TEXTS.achievementsIntro}
            </p>
          </div>
          <button
            type="button"
            data-testid="wm-achievements-close"
            onClick={close}
            className="shrink-0 cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            {WM_TEXTS.achievementsClose}
          </button>
        </header>
        <ul className="grid grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((def, index) => (
            <AchievementCard
              key={def.id}
              id={def.id}
              hidden={def.hidden}
              who={def.who.map((id) => CHARACTER_TEXTS[id].name)}
              goal={def.goal}
              done={hud.progress[index] ?? 0}
              at={unlocked.get(def.id) ?? null}
            />
          ))}
        </ul>
      </div>
    </dialog>
  );
}

/** One card: unlocked with date, or locked with hint and progress. */
function AchievementCard({
  id,
  hidden,
  who,
  goal,
  done,
  at,
}: {
  readonly id: AchievementId;
  readonly hidden: boolean;
  readonly who: readonly string[];
  readonly goal: number;
  readonly done: number;
  /** When it was unlocked, epoch ms, or null while locked. */
  readonly at: number | null;
}): ReactElement {
  const texts = ACHIEVEMENT_TEXTS[id];
  const open = at !== null;
  const secret = hidden && !open;
  let line = texts.hint;
  if (open) {
    line = texts.done;
  } else if (secret) {
    line = WM_TEXTS.achievementSecretHint;
  }
  return (
    <li
      data-testid={`wm-achievement-${id}`}
      data-unlocked={open ? "" : undefined}
      className={`flex gap-3 rounded-xl border p-2.5 ${
        open
          ? "border-amber-300/70 bg-amber-300/10"
          : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <Badge id={id} locked={!open} secret={secret} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`text-sm leading-tight font-bold ${open ? "text-amber-200" : "text-zinc-300"}`}
        >
          {secret ? WM_TEXTS.achievementSecret : texts.title}
        </span>
        <span
          className={`text-xs leading-snug ${open ? "text-zinc-200" : "text-zinc-500"}`}
        >
          {line}
        </span>
        {!secret && (
          <span className="text-[10px] text-zinc-500">
            {WM_TEXTS.achievementFor}{" "}
            {who.length > 0 ? who.join(", ") : WM_TEXTS.achievementAnybody}
          </span>
        )}
        {open && (
          <span className="text-[10px] font-semibold text-amber-300/80">
            {WM_TEXTS.achievementOn} {new Date(at).toLocaleDateString("de-DE")}
          </span>
        )}
        {!open && !secret && goal > 1 && (
          <span className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-400">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <span
                className="block h-full rounded-full bg-amber-400/70"
                style={{ width: `${String((done / goal) * FULL)}%` }}
              />
            </span>
            {done}/{goal}
          </span>
        )}
      </div>
    </li>
  );
}

/** An achievement's badge from the figures sheet, sharp; greyed while locked. */
function Badge({
  id,
  locked,
  secret,
}: {
  readonly id: AchievementId;
  readonly locked: boolean;
  readonly secret: boolean;
}): ReactElement {
  const [x, y, w, h] = EFFECTS[BADGES[id]];
  const k = SHEET_DENSITY * BADGE_ZOOM;
  const picture: CSSProperties = {
    backgroundImage: `url(${figuresImage.src})`,
    backgroundSize: `${String(figuresImage.width * BADGE_ZOOM)}px ${String(figuresImage.height * BADGE_ZOOM)}px`,
    backgroundPosition: `-${String(x * k)}px -${String(y * k)}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    filter: locked ? "grayscale(1) brightness(0.55)" : undefined,
  };
  // A secret one shows no picture at all, only a question mark.
  const style: CSSProperties = {
    width: w * k,
    height: h * k,
    ...(secret ? {} : picture),
  };
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center self-start ${secret ? "rounded-full border-2 border-zinc-700 bg-zinc-800" : ""}`}
      style={style}
    >
      {secret && <span className="text-sm font-black text-zinc-400">?</span>}
    </span>
  );
}
