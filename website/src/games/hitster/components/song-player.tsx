/**
 * The song: a YouTube video playing behind a cover, so the ears get it and
 * the eyes do not.
 *
 * @module
 * @remarks
 * The box plays a QR code through the Hitster app. Here it is the video
 * itself, embedded from youtube-nocookie.com and covered by a spinning record
 * - the title, the picture and the year all stay hidden. It starts a little
 * way in, where most songs have got going.
 *
 * A browser only plays sound after somebody pressed something, so the song
 * waits for the play button. Should a video refuse to play (taken down, or not
 * allowed in the country), the player says so through its JavaScript
 * messages, and {@link SongPlayer} offers a new song for free.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { HITSTER_TEXTS as T } from "@/games/hitster/i18n/texts";

/** Where in the video the song starts, in seconds. */
const START_SECONDS = 40;

/** Where the player's messages come from. */
const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

/**
 * Renders the player.
 *
 * @param props - the video, which song of the game it is, and what to do when
 *   it will not play
 * @returns the covered player and its buttons
 */
export function SongPlayer({
  video,
  turn,
  onBroken,
}: {
  /** The YouTube video id. */
  readonly video: string;
  /** Which song of the game this is - a new one stops the old. */
  readonly turn: number;
  /** Called when the video will not play; null when nobody may skip it now. */
  readonly onBroken: (() => void) | null;
}): ReactElement {
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const [failed, setFailed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  // A new song stops the old one.
  /* eslint-disable react-hooks/set-state-in-effect -- reset when the song changes */
  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [turn, video]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // The player reports trouble through window messages once asked to.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === PLAYER_ORIGIN && typeof event.data === "string") {
        try {
          const data = JSON.parse(event.data) as { event?: string };
          if (data.event === "onError") {
            setFailed(true);
          }
        } catch {
          // Not one of the player's messages.
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const listen = () => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: turn }),
      PLAYER_ORIGIN,
    );
  };

  const params = new URLSearchParams({
    autoplay: "1",
    start: String(START_SECONDS),
    controls: "0",
    disablekb: "1",
    enablejsapi: "1",
    playsinline: "1",
    rel: "0",
  });

  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-40 w-40 overflow-hidden rounded-full">
        {playing && (
          <iframe
            key={`${video}-${String(round)}`}
            ref={frame}
            title="Song"
            src={`${PLAYER_ORIGIN}/embed/${video}?${params.toString()}`}
            allow="autoplay; encrypted-media"
            onLoad={listen}
            className="absolute inset-0 h-full w-full"
          />
        )}
        {/* The cover: a record, spinning while the song plays. */}
        <div
          aria-hidden
          className={`absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,#18181b_0px,#18181b_3px,#27272a_4px,#18181b_5px)] ${
            playing ? "animate-[spin_3s_linear_infinite]" : ""
          }`}
        >
          <div className="absolute inset-[34%] rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-400" />
          <div className="absolute inset-[47%] rounded-full bg-zinc-900" />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {playing ? (
          <>
            <button
              type="button"
              data-testid="hit-stop"
              onClick={() => setPlaying(false)}
              className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {T.stop}
            </button>
            <button
              type="button"
              onClick={() => setRound((one) => one + 1)}
              className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {T.replay}
            </button>
          </>
        ) : (
          <button
            type="button"
            data-testid="hit-play"
            onClick={() => {
              setPlaying(true);
              setRound((one) => one + 1);
            }}
            className="cursor-pointer rounded-lg bg-fuchsia-600 px-5 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
          >
            {T.play}
          </button>
        )}
      </div>
      {onBroken !== null && (
        <button
          type="button"
          onClick={onBroken}
          className={`cursor-pointer text-xs underline ${
            failed
              ? "font-semibold text-rose-700 dark:text-rose-300"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {T.broken}
        </button>
      )}
    </section>
  );
}
