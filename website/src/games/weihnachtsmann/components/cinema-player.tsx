/**
 * The cinema's screen: red curtains round a 4:3 picture, the film itself and
 * the cinema's own controls - play and pause, a gold time line, the sound and
 * the full screen.
 *
 * @module
 * @remarks
 * The episodes come from the official TOGGO channel, embedded from
 * youtube-nocookie.com and steered through the IFrame API's window messages,
 * as in Hitster: commands go in with `postMessage`, the time and the state
 * come back in `infoDelivery` and `onStateChange` once the player was asked
 * to be `listening`. Nothing of the player shows: its own controls are off,
 * a transparent layer over the picture takes every click and touch, and
 * whenever the film is not running - before it starts, while it loads, in a
 * pause and at the end - the curtains are shut over it. Every episode runs
 * only from {@link SHOW_FROM} to {@link SHOW_UNTIL}: past the intro, and
 * stopped before the credits; the time line and the clock count from there.
 * The player shows its title and buttons for a few seconds when it first
 * runs, so it warms up silently behind the shut curtains for
 * {@link PREROLL} seconds; the moment the part itself begins, the sound comes
 * on and the curtains glide open.
 *
 * Nothing of YouTube is loaded before an episode is picked: until then the
 * screen is a placeholder.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  SHOW_FROM,
  SHOW_LENGTH,
  SHOW_UNTIL,
  type Episode,
} from "@/games/weihnachtsmann/engine/cinema";
import { EPISODE_TITLES, WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";

/** Where the embedded player comes from. */
const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

/** How long the next episode waits at the end of one, ms. */
const NEXT_IN_MS = 5000;

/** How often the place in a running episode is kept, ms. */
const SAVE_EVERY_MS = 5000;

/** How far the arrow keys skip, seconds. */
const SKIP = 10;

/** Stop this much before the end, seconds, so the player never gets there. */
const END_MARGIN = 0.3;

/** How far before the start the film may drift before it is put back, seconds. */
const BEFORE_SLACK = 1;

/** Milliseconds per second. */
const MS = 1000;

/** How often the clock, the time line and the limits are looked at, ms. */
const TICK_MS = 200;

/**
 * How long the film warms up before its part, seconds: it runs silently
 * behind the shut curtains, so the player's own title and buttons - shown for
 * about three seconds whenever it first runs - are gone when they open.
 */
const PREROLL = 4;

/** Close enough to the start of the part to open the curtains, seconds. */
const OPEN_SLACK = 0.05;

/**
 * How long the strips over the picture's top and bottom edge stay after the
 * film runs on, jumps or changes its size, ms - the middle stays free. Measured in screenshot series every 150 ms: after playVideo,
 * after seekTo and after a long jump the player shows its title, buttons and
 * a small pause sign in the middle from about 0.3 s to about 4.3-4.6 s.
 */
const MASK_MS = 4800;

/** How quickly the masks go once the player's buttons have gone, ms. */
const UNMASK_MS = 200;

/** How long the curtains take to open, slowly, and to close again, ms. */
const OPEN_MS = 2300;
const CLOSE_MS = 800;

/** How often, and how many times, the player is asked to talk back. */
const LISTEN_EVERY_MS = 400;
const LISTEN_TRIES = 20;

/** The loudest the player goes, and where it starts. */
const FULL_VOLUME = 100;

/** Seconds in a minute, and the digits of the seconds on the clock. */
const MINUTE = 60;
const SECOND_DIGITS = 2;

/** A whole bar, in percent. */
const FULL = 100;

/** The player's states, from the IFrame API. */
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;

/** The heavy red velvet of the curtains, with its folds. */
export const VELVET =
  "repeating-linear-gradient(90deg, #7f1022 0px, #b81d34 7px, #d8344a 11px, #a3172c 16px, #6e0c1c 22px)";

/** The gold fringe along a curtain's hem. */
const FRINGE =
  "repeating-linear-gradient(90deg,#e8b830 0px,#e8b830 6px,#a87a20 6px,#a87a20 8px)";

/**
 * An episode to show, and where in it: seconds into the part shown. A new
 * token is a new request, even for the same episode.
 */
export type CinemaRequest = {
  readonly episode: Episode;
  readonly from: number;
  readonly token: number;
};

/** What the screen shows. */
type Phase = "loading" | "playing" | "paused" | "ended" | "failed";

/** How far each curtain is drawn across the screen, percent of its width. */
const CURTAIN_WIDTH: Readonly<Record<Phase, number>> = {
  loading: 50,
  playing: 0,
  paused: 34,
  ended: 50,
  failed: 50,
};

/** One of the player's messages, as far as it is read here. */
type PlayerMessage = {
  readonly event?: string;
  readonly info?: unknown;
};

/** What `infoDelivery` may tell. */
type PlayerInfo = {
  readonly currentTime?: unknown;
  readonly playerState?: unknown;
  readonly muted?: unknown;
};

/**
 * Renders the screen: a placeholder until an episode is picked - with a
 * button to go on where one left off - then the film with the cinema's
 * controls. The player stays while episodes change, so the next one can
 * follow on with sound.
 *
 * @param props - what to show, the episode after it, the way on and where
 *   places are kept
 * @returns the screen
 */
export function CinemaStage({
  request,
  next,
  onNext,
  onPosition,
  offer,
  onOffer,
}: {
  /** The episode to show, or null for the placeholder. */
  readonly request: CinemaRequest | null;
  /** The episode after the one shown, or null after the last. */
  readonly next: Episode | null;
  /** Starts the next episode from its beginning. */
  readonly onNext: () => void;
  /** Keeps where an episode was left off (seconds into its part). */
  readonly onPosition: (
    episode: number,
    shown: number,
    finished: boolean,
  ) => void;
  /** Where to go on, for the placeholder's button, or null. */
  readonly offer: { readonly episode: Episode; readonly from: number } | null;
  readonly onOffer: () => void;
}): ReactElement {
  return request === null ? (
    <Frame>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_center,#3a2a40_0%,#120a14_70%)] p-4 text-center">
        {offer !== null && (
          <button
            type="button"
            data-testid="wm-cinema-resume"
            onClick={onOffer}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-[0_3px_0_#a87a20,0_0_24px_rgba(255,200,80,0.45)] hover:bg-amber-300 sm:text-base"
          >
            <PlayIcon className="h-4 w-4 shrink-0" />
            {offerLabel(offer)}
          </button>
        )}
        <p className="max-w-xs text-sm text-amber-100/80">
          {WM_TEXTS.cinemaPick}
        </p>
      </div>
    </Frame>
  ) : (
    <Player
      request={request}
      next={next}
      onNext={onNext}
      onPosition={onPosition}
    />
  );
}

/**
 * Seconds as the clock shows them, "m:ss".
 *
 * @param seconds - seconds into the part shown
 * @returns the time
 */
export function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  const rest = String(whole % MINUTE).padStart(SECOND_DIGITS, "0");
  return `${String(Math.floor(whole / MINUTE))}:${rest}`;
}

/**
 * An episode's German title.
 *
 * @param episode - the episode
 * @returns its title
 */
export function episodeTitle(episode: Episode): string {
  return EPISODE_TITLES[episode.number - 1] ?? "";
}

/** The screen with its side curtains, and whatever plays on it. */
function Frame({
  children,
  full = false,
}: {
  readonly children: ReactNode;
  /** Filling the whole screen: the picture as tall as there is room. */
  readonly full?: boolean;
}): ReactElement {
  return (
    <div
      className={`flex items-stretch justify-center rounded-xl bg-black/60 p-1.5 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] ${full ? "w-full" : ""}`}
    >
      <SideCurtain side="left" />
      <div
        className={`relative aspect-[4/3] min-w-0 overflow-hidden rounded-sm bg-black ring-2 ring-amber-500/60 ${
          full
            ? "w-[min(100%,calc((100dvh-5.5rem)*4/3))]"
            : "w-full max-w-[calc((100dvh-17rem)*4/3)] md:max-w-[calc((94dvh-15rem)*4/3)]"
        }`}
      >
        {children}
      </div>
      <SideCurtain side="right" />
    </div>
  );
}

/** One of the drawn-back curtains beside the screen. */
function SideCurtain({
  side,
}: {
  readonly side: "left" | "right";
}): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={`w-3 shrink-0 sm:w-6 ${side === "left" ? "rounded-l-md" : "rounded-r-md"}`}
      style={{ background: VELVET }}
    />
  );
}

/** The film, with the cinema's controls; one player for every episode. */
function Player({
  request,
  next,
  onNext,
  onPosition,
}: {
  readonly request: CinemaRequest;
  readonly next: Episode | null;
  readonly onNext: () => void;
  readonly onPosition: (
    episode: number,
    shown: number,
    finished: boolean,
  ) => void;
}): ReactElement {
  const episode = request.episode;
  const frameRef = useRef<HTMLIFrameElement>(null);
  /** The player's address, from the first request; later ones load into it. */
  const [source] = useState(() => playerSource(request));
  const firstTokenRef = useRef(request.token);
  const episodeRef = useRef(episode);
  /** Where the curtains open: the place asked for, seconds into the video. */
  const openAtRef = useRef(SHOW_FROM + request.from);
  const nextRef = useRef(next);
  const onNextRef = useRef(onNext);
  const onPositionRef = useRef(onPosition);
  /** When the next episode starts by itself, or null. */
  const nextAtRef = useRef<number | null>(null);
  const savedAtRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const phaseRef = useRef<Phase>("loading");
  /** The film's time as last heard, when, and whether it runs. */
  const clockRef = useRef({
    time: warmStart(request.from),
    at: 0,
    running: false,
  });
  const readyRef = useRef<number | null>(null);
  /** Whether the warm-up is over and the part itself has begun. */
  const begunRef = useRef(false);
  /** Whether the sound was switched off on purpose. */
  const userMutedRef = useRef(false);
  const maskUntilRef = useRef<number | null>(null);
  const [view, setView] = useState<{
    time: number;
    masked: boolean;
    /** Whole seconds until the next episode starts by itself, or null. */
    countdown: number | null;
  }>({ time: request.from, masked: false, countdown: null });
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(FULL_VOLUME);
  const [nativeFull, setNativeFull] = useState(false);
  const [pseudoFull, setPseudoFull] = useState(false);
  const full = nativeFull || pseudoFull;

  const send = useCallback((func: string, args: readonly unknown[] = []) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func,
        args,
        id: 1,
        channel: "widget",
      }),
      PLAYER_ORIGIN,
    );
  }, []);

  /** Moves the screen on; the end and a failure stay until left on purpose. */
  const goTo = useCallback((next: Phase, force = false) => {
    const current = phaseRef.current;
    const stuck = current === "ended" || current === "failed";
    if (next !== current && (force || !stuck)) {
      phaseRef.current = next;
      setPhase(next);
    }
  }, []);

  const estimate = useCallback(() => {
    const clock = clockRef.current;
    return clock.running
      ? clock.time + (performance.now() - clock.at) / MS
      : clock.time;
  }, []);

  /** Hides the picture's edges for a moment, while the player shows its buttons. */
  const maskEdges = useCallback(() => {
    maskUntilRef.current = performance.now() + MASK_MS;
    setView((old) => ({ ...old, masked: true }));
  }, []);

  /** Keeps where the episode on screen is; only once its part has begun. */
  const report = useCallback(
    (finished: boolean) => {
      if (begunRef.current) {
        savedAtRef.current = performance.now();
        onPositionRef.current(
          episodeRef.current.number,
          finished
            ? SHOW_LENGTH
            : Math.min(Math.max(estimate() - SHOW_FROM, 0), SHOW_LENGTH),
          finished,
        );
      }
    },
    [estimate],
  );

  /** The end of the part: stop, keep it as seen, count down to the next. */
  const finish = useCallback(() => {
    const now = performance.now();
    send("pauseVideo");
    clockRef.current = { time: SHOW_UNTIL, at: now, running: false };
    goTo("ended", true);
    report(true);
    nextAtRef.current = nextRef.current === null ? null : now + NEXT_IN_MS;
  }, [send, goTo, report]);

  /** The countdown's "Jetzt abspielen" and "Abbrechen". */
  const playNext = useCallback(() => {
    nextAtRef.current = null;
    onNextRef.current();
  }, []);
  const stayHere = useCallback(() => {
    nextAtRef.current = null;
    setView((old) => ({ ...old, countdown: null }));
  }, []);

  const seek = useCallback(
    (shown: number) => {
      const into = Math.min(Math.max(shown, 0), SHOW_LENGTH - END_MARGIN * 2);
      const time = SHOW_FROM + into;
      // A jump shows the player's buttons too.
      maskEdges();
      send("seekTo", [time, true]);
      clockRef.current = { ...clockRef.current, time, at: performance.now() };
      if (phaseRef.current === "ended") {
        nextAtRef.current = null;
        send("pauseVideo");
        goTo("paused", true);
      }
      setView((old) => ({ ...old, time: into, countdown: null }));
    },
    [send, goTo, maskEdges],
  );

  const toggle = useCallback(() => {
    const current = phaseRef.current;
    if (current === "ended") {
      // Once more from the start.
      nextAtRef.current = null;
      maskEdges();
      send("seekTo", [SHOW_FROM, true]);
      send("playVideo");
      clockRef.current = {
        time: SHOW_FROM,
        at: performance.now(),
        running: false,
      };
      goTo("loading", true);
    } else if (current === "playing") {
      send("pauseVideo");
      goTo("paused");
      report(false);
    } else if (current !== "failed") {
      // The half drawn curtains stay until the film really runs again; the
      // player's buttons, shown at once, stay hidden.
      maskEdges();
      send("playVideo");
    }
  }, [send, goTo, maskEdges, report]);

  const toggleMute = useCallback(() => {
    send(muted ? "unMute" : "mute");
    userMutedRef.current = !muted;
    setMuted(!muted);
  }, [send, muted]);

  const changeVolume = useCallback(
    (next: number) => {
      send("setVolume", [next]);
      setVolume(next);
      if (muted && next > 0) {
        send("unMute");
        userMutedRef.current = false;
        setMuted(false);
      }
    },
    [send, muted],
  );

  const toggleFull = useCallback(() => {
    const box = boxRef.current;
    maskEdges();
    if (document.fullscreenElement !== null) {
      void document.exitFullscreen();
    } else if (pseudoFull) {
      setPseudoFull(false);
    } else if (box !== null && document.fullscreenEnabled) {
      void box.requestFullscreen().catch(() => {
        setPseudoFull(true);
      });
    } else {
      // No full screen for elements here (iPhone): fill the window instead.
      setPseudoFull(true);
    }
  }, [pseudoFull, maskEdges]);

  // What the player says: ready, the time, the state, trouble.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message =
        event.origin === PLAYER_ORIGIN &&
        event.source === frameRef.current?.contentWindow
          ? parseMessage(event.data)
          : null;
      switch (message?.event) {
        case "onReady":
          readyRef.current = performance.now();
          // The warm-up runs silently; without sound it may also start by
          // itself on phones.
          send("mute");
          send("setVolume", [FULL_VOLUME]);
          send("playVideo");
          break;
        case "infoDelivery":
          readInfo(message.info);
          break;
        case "onStateChange":
          applyState(message.info);
          break;
        case "onError":
          goTo("failed", true);
          break;
        default:
          break;
      }
    };
    const readInfo = (info: unknown) => {
      const data = (
        typeof info === "object" ? info : null
      ) as PlayerInfo | null;
      if (typeof data?.currentTime === "number") {
        clockRef.current = {
          ...clockRef.current,
          time: data.currentTime,
          at: performance.now(),
        };
      }
      if (typeof data?.muted === "boolean" && begunRef.current) {
        setMuted(data.muted);
      }
      applyState(data?.playerState);
    };
    const applyState = (state: unknown) => {
      if (typeof state === "number") {
        clockRef.current = {
          ...clockRef.current,
          time: estimate(),
          at: performance.now(),
          running: state === PLAYING,
        };
        switch (state) {
          case PLAYING:
            // No subtitles over the picture; the player brings them back
            // whenever it starts running.
            send("unloadModule", ["captions"]);
            send("unloadModule", ["cc"]);
            if (begunRef.current) {
              if (phaseRef.current !== "playing") {
                // Running on, the player shows its buttons for a moment.
                maskEdges();
              }
              goTo("playing");
            }
            break;
          case PAUSED:
            goTo("paused");
            break;
          case ENDED:
            if (phaseRef.current !== "ended" && phaseRef.current !== "failed") {
              finish();
            }
            break;
          case BUFFERING:
            // A short wait after a jump: the film stays on screen, our
            // sign covers the player's spinner and buttons meanwhile.
            maskEdges();
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send, goTo, estimate, maskEdges, finish]);

  // The clock: keeps the film inside its part, and the display up to date.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      const time = estimate();
      const running = clockRef.current.running;
      if (running && time >= SHOW_UNTIL - END_MARGIN) {
        finish();
      } else if (
        running &&
        !begunRef.current &&
        time >= openAtRef.current - OPEN_SLACK
      ) {
        // The warm-up is over: sound on, curtains up; the player's buttons
        // are long gone, so nothing needs hiding.
        begunRef.current = true;
        maskUntilRef.current = null;
        if (!userMutedRef.current) {
          send("unMute");
          setMuted(false);
        }
        goTo("playing");
      } else if (
        running &&
        begunRef.current &&
        time < SHOW_FROM - BEFORE_SLACK
      ) {
        send("seekTo", [SHOW_FROM, true]);
      }
      if (
        phaseRef.current === "playing" &&
        now - savedAtRef.current > SAVE_EVERY_MS
      ) {
        report(false);
      }
      const nextAt = nextAtRef.current;
      if (nextAt !== null && now >= nextAt) {
        nextAtRef.current = null;
        onNextRef.current();
      }
      setView({
        time:
          phaseRef.current === "ended"
            ? SHOW_LENGTH
            : Math.min(
                Math.max(
                  // While it warms up, the clock waits at the place asked for.
                  (begunRef.current ? estimate() : openAtRef.current) -
                    SHOW_FROM,
                  0,
                ),
                SHOW_LENGTH,
              ),
        masked: now < (maskUntilRef.current ?? -Infinity),
        countdown:
          nextAtRef.current === null
            ? null
            : Math.ceil((nextAtRef.current - performance.now()) / MS),
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [estimate, send, goTo, finish, report]);

  // The latest callbacks and the episode after this one, for the timers.
  useEffect(() => {
    nextRef.current = next;
    onNextRef.current = onNext;
    onPositionRef.current = onPosition;
  }, [next, onNext, onPosition]);

  // Another episode (or the same from another place): it loads into the same
  // player, so it may go on with sound; it warms up behind the curtains.
  useEffect(() => {
    if (request.token !== firstTokenRef.current) {
      if (phaseRef.current !== "ended") {
        report(false);
      }
      firstTokenRef.current = request.token;
      begunRef.current = false;
      nextAtRef.current = null;
      openAtRef.current = SHOW_FROM + request.from;
      const start = warmStart(request.from);
      clockRef.current = { time: start, at: performance.now(), running: false };
      goTo("loading", true);
      send("mute");
      send("loadVideoById", [
        {
          videoId: request.episode.video,
          startSeconds: start,
          endSeconds: SHOW_UNTIL,
        },
      ]);
    }
    episodeRef.current = request.episode;
  }, [request, report, goTo, send]);

  // The place is kept when the page goes away or into the background, and
  // when the cinema closes.
  useEffect(() => {
    const keep = () => {
      if (phaseRef.current !== "ended") {
        report(false);
      }
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        keep();
      }
    };
    window.addEventListener("pagehide", keep);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", keep);
      document.removeEventListener("visibilitychange", onHidden);
      keep();
    };
  }, [report]);

  // Space pauses, the arrows skip, Escape leaves a window-filling screen.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement;
      if (event.code === "Space" && !typing) {
        event.preventDefault();
        toggle();
      } else if (
        (event.code === "ArrowLeft" || event.code === "ArrowRight") &&
        !typing
      ) {
        event.preventDefault();
        seek(
          estimate() - SHOW_FROM + (event.code === "ArrowLeft" ? -SKIP : SKIP),
        );
      } else if (event.code === "Escape" && pseudoFull) {
        event.preventDefault();
        setPseudoFull(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seek, estimate, pseudoFull]);

  // The real full screen comes and goes with the browser.
  useEffect(() => {
    const onChange = () => {
      maskEdges();
      setNativeFull(
        document.fullscreenElement !== null &&
          document.fullscreenElement === boxRef.current,
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [maskEdges]);

  // Asks the player, until it answers, to report its time and state.
  const listen = useCallback(() => {
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      frameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        PLAYER_ORIGIN,
      );
      if (readyRef.current !== null || tries >= LISTEN_TRIES) {
        window.clearInterval(timer);
      }
    }, LISTEN_EVERY_MS);
  }, []);

  const title = episodeTitle(episode);

  return (
    <div
      ref={boxRef}
      data-testid="wm-cinema-screen"
      className={
        full
          ? "flex flex-col items-center justify-center gap-2 bg-black p-2 " +
            (pseudoFull ? "fixed inset-0 z-50" : "h-full w-full")
          : "flex flex-col gap-2"
      }
    >
      <Frame full={full}>
        {/* A little larger than the screen: the dark bars at the sides of
            the picture and anything at its very edge stay outside. */}
        <iframe
          ref={frameRef}
          data-testid="wm-cinema-player"
          title={`${WM_TEXTS.cinemaEpisode} ${String(episode.number)} - ${title}`}
          src={source}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
          onLoad={listen}
          className="pointer-events-none absolute top-[-3.5%] left-[-3.5%] h-[107%] w-[107%]"
        />
        {/* Takes every click and touch: the picture is play and pause. */}
        <button
          type="button"
          data-testid="wm-cinema-catcher"
          aria-label={
            phase === "playing" ? WM_TEXTS.cinemaPause : WM_TEXTS.cinemaPlay
          }
          onClick={(event) => {
            toggle();
            event.currentTarget.blur();
          }}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        />
        <Curtains
          phase={phase}
          masked={view.masked && phase === "playing"}
          title={title}
          number={episode.number}
          next={next}
          countdown={view.countdown}
          onNext={playNext}
          onCancel={stayHere}
          onAgain={toggle}
        />
      </Frame>
      <Controls
        phase={phase}
        time={view.time}
        muted={muted}
        volume={volume}
        full={full}
        onToggle={toggle}
        onSeek={seek}
        onMute={toggleMute}
        onVolume={changeVolume}
        onFull={toggleFull}
      />
    </div>
  );
}

/**
 * The curtains on the screen: shut while the film loads and at its end, half
 * drawn in a pause, open while it runs - with what to say in the middle.
 */
function Curtains({
  phase,
  masked,
  title,
  number,
  next,
  countdown,
  onNext,
  onCancel,
  onAgain,
}: {
  readonly phase: Phase;
  /** Hide the picture's top and bottom edge, while the player shows its buttons there. */
  readonly masked: boolean;
  readonly title: string;
  readonly number: number;
  readonly next: Episode | null;
  /** Seconds until the next episode starts by itself, or null. */
  readonly countdown: number | null;
  readonly onNext: () => void;
  readonly onCancel: () => void;
  readonly onAgain: () => void;
}): ReactElement {
  const width = CURTAIN_WIDTH[phase];
  const covered = phase !== "playing";
  // The masks come at once and go quickly - at once when the curtains close
  // over them.
  const fade = {
    transitionDuration: masked || covered ? "0ms" : `${String(UNMASK_MS)}ms`,
  };
  // Opening slowly, gliding out; closing quicker.
  const glide = covered
    ? {
        transitionDuration: `${String(CLOSE_MS)}ms`,
        transitionTimingFunction: "ease-in-out",
      }
    : {
        transitionDuration: `${String(OPEN_MS)}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      };
  return (
    <>
      {/* Dark behind the curtains, at once: nothing of the player shows
          while they still move. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,#2a1a30_0%,#0a050c_75%)] ${covered ? "opacity-100" : "opacity-0"}`}
      />
      {(["top", "bottom"] as const).map((edge) => (
        <div
          key={edge}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 z-20 transition-opacity ${
            edge === "top"
              ? // The player's buttons have a fixed size: on a small screen
                // they take more of the picture.
                "top-0 h-[max(17%,5.5rem)] bg-gradient-to-b"
              : "bottom-0 h-[max(21%,6rem)] bg-gradient-to-t"
          } from-[#0a050c] from-70% to-transparent ${masked ? "opacity-100" : "opacity-0"}`}
          style={fade}
        />
      ))}
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 z-20 shadow-[0_0_18px_rgba(0,0,0,0.8)] transition-[width] ${side === "left" ? "left-0" : "right-0"}`}
          style={{ width: `${String(width)}%`, background: VELVET, ...glide }}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-1.5"
            style={{ background: FRINGE }}
          />
        </div>
      ))}
      {covered && (
        <div
          data-testid={`wm-cinema-${phase}`}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <CurtainText
            phase={phase}
            title={title}
            number={number}
            next={next}
            countdown={countdown}
            onNext={onNext}
            onCancel={onCancel}
            onAgain={onAgain}
          />
        </div>
      )}
    </>
  );
}

/** What stands on the closed or half drawn curtains. */
function CurtainText({
  phase,
  title,
  number,
  next,
  countdown,
  onNext,
  onCancel,
  onAgain,
}: {
  readonly phase: Phase;
  readonly title: string;
  readonly number: number;
  readonly next: Episode | null;
  readonly countdown: number | null;
  readonly onNext: () => void;
  readonly onCancel: () => void;
  readonly onAgain: () => void;
}): ReactElement {
  const name = (
    <p className="rounded-lg bg-black/55 px-3 py-1 text-sm font-semibold text-amber-100 shadow sm:text-base">
      {WM_TEXTS.cinemaEpisode} {number}: {title}
    </p>
  );
  let body: ReactElement;
  const coming = phase === "ended" && countdown !== null && next !== null;
  switch (coming ? "coming" : phase) {
    case "coming":
      body = (
        <>
          <p className="text-sm font-semibold text-amber-100/90 sm:text-base">
            {WM_TEXTS.cinemaComing}
          </p>
          <p className="rounded-lg bg-black/55 px-3 py-1 text-base font-bold text-amber-200 shadow sm:text-lg">
            {next === null
              ? ""
              : `${WM_TEXTS.cinemaEpisode} ${String(next.number)} - ${episodeTitle(next)}`}
          </p>
          <span
            data-testid="wm-cinema-countdown"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300 bg-black/60 font-serif text-3xl font-black text-amber-300 shadow-[0_0_20px_rgba(255,200,80,0.5)]"
          >
            {countdown}
          </span>
          <div className="pointer-events-auto mt-1 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              data-testid="wm-cinema-play-now"
              onClick={onNext}
              className="cursor-pointer rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900 shadow-[0_3px_0_#a87a20] hover:bg-amber-300"
            >
              {WM_TEXTS.cinemaPlayNow}
            </button>
            <button
              type="button"
              data-testid="wm-cinema-cancel"
              onClick={onCancel}
              className="cursor-pointer rounded-lg border border-amber-300/70 bg-black/50 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-black/70"
            >
              {WM_TEXTS.cinemaCancel}
            </button>
          </div>
        </>
      );
      break;
    case "paused":
      body = (
        <>
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300 bg-black/60 text-amber-300 shadow-[0_0_20px_rgba(255,200,80,0.5)]"
          >
            <PlayIcon className="ml-1 h-7 w-7" />
          </span>
          {name}
          <p className="text-xs text-amber-100/80">{WM_TEXTS.cinemaPaused}</p>
        </>
      );
      break;
    case "ended":
      body = (
        <>
          <p className="font-serif text-4xl font-black tracking-widest text-amber-300 drop-shadow-[0_0_10px_rgba(255,200,80,0.7)] sm:text-6xl">
            {WM_TEXTS.cinemaEnd}
          </p>
          {name}
          <div className="pointer-events-auto mt-1 flex flex-wrap justify-center gap-2">
            {next !== null && (
              <button
                type="button"
                data-testid="wm-cinema-next"
                onClick={onNext}
                className="cursor-pointer rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900 shadow-[0_3px_0_#a87a20] hover:bg-amber-300"
              >
                {WM_TEXTS.cinemaNext}
              </button>
            )}
            <button
              type="button"
              onClick={onAgain}
              className="cursor-pointer rounded-lg border border-amber-300/70 bg-black/50 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-black/70"
            >
              {WM_TEXTS.cinemaAgain}
            </button>
          </div>
        </>
      );
      break;
    case "failed":
      body = (
        <>
          {name}
          <p
            role="status"
            className="rounded-lg bg-black/60 px-3 py-1 text-sm font-semibold text-rose-200"
          >
            {WM_TEXTS.cinemaBroken}
          </p>
        </>
      );
      break;
    default:
      body = (
        <>
          {name}
          <p className="animate-pulse text-xs text-amber-100/90">
            {WM_TEXTS.cinemaLoading}
          </p>
        </>
      );
  }
  return body;
}

/** The bar under the picture: play, clock, time line, sound, full screen. */
function Controls({
  phase,
  time,
  muted,
  volume,
  full,
  onToggle,
  onSeek,
  onMute,
  onVolume,
  onFull,
}: {
  readonly phase: Phase;
  /** Seconds into the part shown. */
  readonly time: number;
  readonly muted: boolean;
  readonly volume: number;
  readonly full: boolean;
  readonly onToggle: () => void;
  readonly onSeek: (time: number) => void;
  readonly onMute: () => void;
  readonly onVolume: (volume: number) => void;
  readonly onFull: () => void;
}): ReactElement {
  const running = phase === "playing" || phase === "loading";
  const button =
    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber-400/60 bg-gradient-to-b from-[#8a1a2c] to-[#4a0a16] text-amber-200 shadow-[0_2px_0_rgba(0,0,0,0.5)] hover:from-[#a82236] disabled:cursor-default disabled:opacity-40";
  return (
    <div
      data-testid="wm-cinema-controls"
      className={`flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#2a1420] to-[#160a12] px-2 py-1.5 ${full ? "w-full max-w-4xl" : ""}`}
    >
      <button
        type="button"
        data-testid="wm-cinema-play"
        aria-label={running ? WM_TEXTS.cinemaPause : WM_TEXTS.cinemaPlay}
        title={running ? WM_TEXTS.cinemaPause : WM_TEXTS.cinemaPlay}
        disabled={phase === "failed"}
        onClick={(event) => {
          onToggle();
          event.currentTarget.blur();
        }}
        className={button}
      >
        {running ? (
          <PauseIcon className="h-4 w-4" />
        ) : (
          <PlayIcon className="ml-0.5 h-4 w-4" />
        )}
      </button>
      <span
        data-testid="wm-cinema-clock"
        className="shrink-0 font-mono text-xs text-amber-100 tabular-nums"
      >
        {clock(time)} / {clock(SHOW_LENGTH)}
      </span>
      <TimeLine time={time} onSeek={onSeek} disabled={phase === "failed"} />
      <button
        type="button"
        data-testid="wm-cinema-mute"
        aria-label={muted ? WM_TEXTS.cinemaUnmute : WM_TEXTS.cinemaMute}
        title={muted ? WM_TEXTS.cinemaUnmute : WM_TEXTS.cinemaMute}
        onClick={(event) => {
          onMute();
          event.currentTarget.blur();
        }}
        className={`${button} ${muted ? "ring-2 ring-amber-300" : ""}`}
      >
        <SoundIcon muted={muted} className="h-4 w-4" />
      </button>
      <input
        type="range"
        min={0}
        max={FULL_VOLUME}
        value={muted ? 0 : volume}
        aria-label={WM_TEXTS.cinemaVolume}
        onChange={(event) => {
          onVolume(Number(event.currentTarget.value));
        }}
        className="hidden w-20 shrink-0 cursor-pointer accent-amber-400 sm:block"
      />
      <button
        type="button"
        data-testid="wm-cinema-full"
        aria-label={full ? WM_TEXTS.cinemaFullExit : WM_TEXTS.cinemaFull}
        title={full ? WM_TEXTS.cinemaFullExit : WM_TEXTS.cinemaFull}
        onClick={(event) => {
          onFull();
          event.currentTarget.blur();
        }}
        className={button}
      >
        <FullIcon exit={full} className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * The gold time line: click, drag or touch to go anywhere inside the part
 * shown; the arrow keys skip on it too.
 */
function TimeLine({
  time,
  onSeek,
  disabled,
}: {
  readonly time: number;
  readonly onSeek: (time: number) => void;
  readonly disabled: boolean;
}): ReactElement {
  const [drag, setDrag] = useState<number | null>(null);
  const at = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = (event.clientX - box.left) / Math.max(1, box.width);
    return Math.min(Math.max(share, 0), 1) * SHOW_LENGTH;
  };
  const shown = drag ?? time;
  const share = (shown / SHOW_LENGTH) * FULL;
  return (
    <div
      role="slider"
      data-testid="wm-cinema-seek"
      tabIndex={disabled ? -1 : 0}
      aria-label={WM_TEXTS.cinemaSeek}
      aria-valuemin={0}
      aria-valuemax={SHOW_LENGTH}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={`${clock(shown)} / ${clock(SHOW_LENGTH)}`}
      onPointerDown={(event) => {
        if (!disabled) {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag(at(event));
        }
      }}
      onPointerMove={(event) => {
        if (drag !== null) {
          setDrag(at(event));
        }
      }}
      onPointerUp={(event) => {
        if (drag !== null) {
          onSeek(at(event));
          setDrag(null);
        }
      }}
      onPointerCancel={() => {
        setDrag(null);
      }}
      className="group relative flex h-8 min-w-0 flex-1 cursor-pointer touch-none items-center"
    >
      <div className="h-2 w-full overflow-hidden rounded-full border border-amber-700/70 bg-[#3a0c18] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200"
          style={{ width: `${String(share)}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#5a1020] bg-amber-300 shadow-[0_0_8px_rgba(255,200,80,0.8)] group-hover:scale-110"
        style={{ left: `${String(share)}%` }}
      />
    </div>
  );
}

/** A play triangle. */
function PlayIcon({ className }: { readonly className: string }): ReactElement {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 1.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

/** Two pause bars. */
function PauseIcon({
  className,
}: {
  readonly className: string;
}): ReactElement {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z" fill="currentColor" />
    </svg>
  );
}

/** A loudspeaker, with waves or crossed out. */
function SoundIcon({
  muted,
  className,
}: {
  readonly muted: boolean;
  readonly className: string;
}): ReactElement {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M1.5 5.5h3L8.5 2v12l-4-3.5h-3z" fill="currentColor" />
      {muted ? (
        <path
          d="M10.5 5.5l4 5M14.5 5.5l-4 5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M10.5 5.2a3.5 3.5 0 0 1 0 5.6M12.4 3.2a6 6 0 0 1 0 9.6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/** Four corners, pointing out to fill the screen or in to leave it. */
function FullIcon({
  exit,
  className,
}: {
  readonly exit: boolean;
  readonly className: string;
}): ReactElement {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d={
          exit
            ? "M6 1.5V6H1.5M10 1.5V6h4.5M6 14.5V10H1.5M10 14.5V10h4.5"
            : "M1.5 6V1.5H6M14.5 6V1.5H10M1.5 10v4.5H6M14.5 10v4.5H10"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
    </svg>
  );
}

/**
 * Reads one of the player's messages.
 *
 * @param data - what came through the window
 * @returns the message, or null for anything else
 */
function parseMessage(data: unknown): PlayerMessage | null {
  let message: PlayerMessage | null = null;
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      message =
        typeof parsed === "object" && parsed !== null
          ? (parsed as PlayerMessage)
          : null;
    } catch {
      // Not one of the player's messages.
    }
  }
  return message;
}

/**
 * The placeholder's button: which episode, and from where.
 *
 * @param offer - the episode and the place, seconds into its part
 * @returns e.g. "Weiterschauen - Folge 3, ab 3:00"
 */
function offerLabel(offer: {
  readonly episode: Episode;
  readonly from: number;
}): string {
  const where =
    offer.from > 0 ? `, ${WM_TEXTS.cinemaFrom} ${clock(offer.from)}` : "";
  return `${WM_TEXTS.cinemaResume} - ${WM_TEXTS.cinemaEpisode} ${String(offer.episode.number)}${where}`;
}

/**
 * Where an episode warms up: a few seconds before the place asked for.
 *
 * @param from - seconds into the part shown
 * @returns seconds into the video
 */
function warmStart(from: number): number {
  // Whole seconds: the player ignores a start with a fraction.
  return Math.max(0, Math.floor(SHOW_FROM + from - PREROLL));
}

/**
 * The player's address for the first episode shown.
 *
 * @param request - the episode and the place
 * @returns the embed address with everything of the player switched off
 */
function playerSource(request: CinemaRequest): string {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    rel: "0",
    iv_load_policy: "3",
    cc_load_policy: "0",
    playsinline: "1",
    start: String(warmStart(request.from)),
    end: String(SHOW_UNTIL),
    enablejsapi: "1",
    origin: window.location.origin,
  });
  return `${PLAYER_ORIGIN}/embed/${request.episode.video}?${params.toString()}`;
}
