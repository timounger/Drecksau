/**
 * The cinema on screen: a little picture palace with red curtains round a 4:3
 * screen and the list of all 26 episodes of the series; picking one plays it
 * from the official TOGGO channel.
 *
 * @module
 * @remarks
 * Built on the browser's own `<dialog>` like the achievements: Escape closes
 * it, and while it is open the game ignores the keys and the map waits. The
 * screen with the film and its controls is `cinema-player.tsx`; nothing is
 * loaded from outside before an episode is picked.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  EPISODES,
  SHOW_LENGTH,
  type Episode,
} from "@/games/weihnachtsmann/engine/cinema";
import type { Hud } from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import {
  NO_MEMORY,
  loadCinema,
  positionOf,
  rememberPosition,
  saveCinema,
  type CinemaMemory,
} from "@/games/weihnachtsmann/storage/cinema-store";
import {
  CinemaStage,
  VELVET,
  episodeTitle,
  type CinemaRequest,
} from "./cinema-player";

/** A whole bar, in percent. */
const FULL = 100;

/**
 * Renders the cinema, closed until the game opens it.
 *
 * @param props - what the screen shows, and what to do on leaving and on
 *   starting an episode
 * @returns the dialog
 */
export function CinemaDialog({
  hud,
  onLeave,
  onWatch,
}: {
  readonly hud: Hud;
  /** Called once the cinema has closed, by its button or by Escape. */
  readonly onLeave: () => void;
  /** Called when an episode is started. */
  readonly onWatch: () => void;
}): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [request, setRequest] = useState<CinemaRequest | null>(null);
  const [memory, setMemory] = useState<CinemaMemory>(NO_MEMORY);
  const memoryRef = useRef<CinemaMemory>(NO_MEMORY);
  const tokenRef = useRef(0);
  const open = hud.inCinema;

  // The game opens the cinema; it is closed from here. Nothing plays before
  // a click: the episode watched last only waits behind its button.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog !== null && !dialog.open) {
      const remembered = loadCinema();
      memoryRef.current = remembered;
      setMemory(remembered);
      dialog.showModal();
    }
  }, [open]);

  const onClose = useCallback(() => {
    // The film stops with the doors shut: the player goes away (and keeps
    // its place on the way).
    setRequest(null);
    onLeave();
  }, [onLeave]);

  const leave = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const keepPosition = useCallback(
    (episode: number, shown: number, finished: boolean) => {
      const next = rememberPosition(
        memoryRef.current,
        episode,
        shown,
        finished,
      );
      memoryRef.current = next;
      saveCinema(next);
      setMemory(next);
    },
    [],
  );

  const start = useCallback(
    (episode: Episode, from: number) => {
      tokenRef.current += 1;
      setRequest({ episode, from, token: tokenRef.current });
      const next = { ...memoryRef.current, last: episode.number };
      memoryRef.current = next;
      saveCinema(next);
      setMemory(next);
      onWatch();
    },
    [onWatch],
  );

  const pick = useCallback(
    (episode: Episode) => {
      start(episode, positionOf(memoryRef.current, episode.number));
    },
    [start],
  );

  const playing = request?.episode ?? null;
  const next =
    playing === null
      ? null
      : (EPISODES.find((episode) => episode.number === playing.number + 1) ??
        null);
  const offer = resumeOffer(memory);

  return (
    <dialog
      ref={dialogRef}
      data-testid="wm-cinema"
      onClose={onClose}
      aria-label={WM_TEXTS.cinemaTitle}
      className="m-auto h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-[#140a14] p-0 text-zinc-100 backdrop:bg-black/80 sm:h-auto sm:max-h-[94dvh] sm:w-[min(68rem,96vw)] sm:rounded-2xl"
    >
      <div className="flex h-full max-h-[100dvh] flex-col sm:max-h-[94dvh]">
        <Valance />
        <header className="flex items-center gap-3 px-3 pt-2 pb-2 sm:px-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black tracking-widest text-amber-300 drop-shadow-[0_0_6px_rgba(255,200,80,0.6)] sm:text-xl">
              {WM_TEXTS.cinemaTitle}
            </h2>
            <p className="truncate text-xs text-amber-100/70">
              {WM_TEXTS.cinemaSubtitle}
            </p>
          </div>
          <span className="hidden text-xs text-zinc-400 sm:inline">
            {WM_TEXTS.cinemaLeaveHint}
          </span>
          <button
            type="button"
            data-testid="wm-cinema-leave"
            onClick={leave}
            className="shrink-0 cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#7f1d1d] hover:bg-red-500"
          >
            {WM_TEXTS.cinemaLeave}
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-2 pb-2 sm:px-4 md:grid md:grid-cols-[minmax(0,1fr)_19rem] md:pb-3">
          <section
            aria-label={WM_TEXTS.cinemaPlayer}
            className="flex shrink-0 flex-col gap-2"
          >
            <CinemaStage
              request={request}
              next={next}
              onNext={() => {
                if (next !== null) {
                  start(next, 0);
                }
              }}
              onPosition={keepPosition}
              offer={offer}
              onOffer={() => {
                if (offer !== null) {
                  start(offer.episode, offer.from);
                }
              }}
            />
          </section>
          <EpisodeList
            memory={memory}
            current={playing?.number ?? offer?.episode.number ?? null}
            onPick={pick}
          />
        </div>
        <p
          data-testid="wm-cinema-privacy"
          className="border-t border-white/10 px-3 py-2 text-center text-[11px] text-zinc-400 sm:px-4"
        >
          {WM_TEXTS.cinemaPrivacy}
        </p>
      </div>
    </dialog>
  );
}

/**
 * Where to go on when the cinema opens: the episode watched last at its
 * place, or - if it was watched to the end - the one after it.
 *
 * @param memory - what the cinema remembers
 * @returns the episode and the place, or null when there is nothing to go on
 */
function resumeOffer(
  memory: CinemaMemory,
): { readonly episode: Episode; readonly from: number } | null {
  const last = memory.last;
  const finished = last !== null && memory.seen.includes(last);
  const number = finished && positionOf(memory, last) === 0 ? last + 1 : last;
  const episode =
    number === null
      ? undefined
      : EPISODES.find((candidate) => candidate.number === number);
  return episode === undefined
    ? null
    : { episode, from: positionOf(memory, episode.number) };
}

/** The pelmet across the top: red velvet with a gold fringe. */
function Valance(): ReactElement {
  return (
    <div aria-hidden="true" className="relative h-5 shrink-0 sm:h-7">
      <div className="absolute inset-0" style={{ background: VELVET }} />
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[repeating-linear-gradient(90deg,#e8b830_0px,#e8b830_6px,#a87a20_6px,#a87a20_8px)]" />
    </div>
  );
}

/**
 * The programme: every episode, a thin bar where one was left off, and
 * "gesehen" for those watched to the end.
 */
function EpisodeList({
  memory,
  current,
  onPick,
}: {
  readonly memory: CinemaMemory;
  /** The episode on screen or waiting to go on, or null. */
  readonly current: number | null;
  readonly onPick: (episode: Episode) => void;
}): ReactElement {
  return (
    <nav
      aria-label={WM_TEXTS.cinemaList}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-black/30"
    >
      <ol
        data-testid="wm-cinema-list"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
      >
        {EPISODES.map((episode) => {
          const chosen = current === episode.number;
          const at = positionOf(memory, episode.number);
          const seen = memory.seen.includes(episode.number);
          return (
            <li key={episode.number}>
              <button
                type="button"
                data-testid={`wm-cinema-episode-${String(episode.number)}`}
                aria-current={chosen ? "true" : undefined}
                onClick={(event) => {
                  onPick(episode);
                  event.currentTarget.blur();
                }}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-amber-400/15 ${
                  chosen ? "bg-amber-400/20 ring-1 ring-amber-300/70" : ""
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-800 text-xs font-bold text-amber-100 shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)]">
                  {episode.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 leading-tight text-zinc-100">
                      {episodeTitle(episode)}
                    </span>
                    {seen && (
                      <span
                        data-testid={`wm-cinema-seen-${String(episode.number)}`}
                        className="shrink-0 text-[10px] text-zinc-400"
                      >
                        {WM_TEXTS.cinemaSeen}
                      </span>
                    )}
                  </span>
                  {at > 0 && (
                    <span
                      data-testid={`wm-cinema-progress-${String(episode.number)}`}
                      className="mt-1 block h-1 overflow-hidden rounded-full bg-zinc-700/70"
                    >
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{
                          width: `${String((at / SHOW_LENGTH) * FULL)}%`,
                        }}
                      />
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
