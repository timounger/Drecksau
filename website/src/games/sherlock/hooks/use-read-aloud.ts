/**
 * Reading aloud with the browser's own speech (Web Speech API): one piece
 * after the other, with pause, resume and stop, the word being spoken (or
 * at least the sentence) to highlight, a start word to pick, and the voice
 * and speed kept in the browser.
 *
 * @module
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_RATE,
  RATES,
  germanVoices,
  isSolution,
  pickVoice,
  piecesFrom,
  wordAt,
  wordsOf,
  type Segment,
  type Spot,
} from "@/games/sherlock/engine/read-aloud";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Where the voice and speed are kept, and their version. */
const SETTINGS_KEY = storageKey("sherlock", "speech");
const SETTINGS_VERSION = 1;

/** The language asked for when no German voice is known. */
const GERMAN = "de-DE";

/**
 * How long a piece may run without a word boundary before the voice counts
 * as one that sends none - then the sentence is highlighted, in milliseconds.
 */
const NO_BOUNDARY_MS = 1000;

/** Where the highlighted word may be before the page scrolls it back, in pixels from the edge. */
const VIEW_MARGIN = 48;

/** What is being read: the puzzle, or its solution. */
export type ReadTarget = "puzzle" | "solution";

/** Whether anything is being read, and whether it is paused. */
export type ReadStatus = "idle" | "speaking" | "paused";

/**
 * How the position is shown: not known yet, word by word (the voice sends
 * word boundaries), or by sentence (it sends none).
 */
export type FollowMode = "unknown" | "words" | "chunks";

/** Where reading stands: the piece being spoken and, when known, its word. */
export type ReadPosition = {
  readonly segment: string;
  /** The piece's first and last word, -1 for a block read whole. */
  readonly from: number;
  readonly to: number;
  /** The word being spoken, or null while not known. */
  readonly word: number | null;
};

/** The reader's settings. */
type SpeechSettings = {
  /** The chosen voice's voiceURI, or null for the best German one. */
  readonly voice: string | null;
  readonly rate: number;
};

/** What the screen gets from {@link useReadAloud}. */
export type ReadAloudApi = {
  /** Whether this browser can speak at all - without it, no buttons. */
  readonly supported: boolean;
  readonly status: ReadStatus;
  /** What is being read, or null while idle. */
  readonly target: ReadTarget | null;
  /** Where reading stands, or null while idle. */
  readonly position: ReadPosition | null;
  readonly mode: FollowMode;
  /** The word picked to start from, or null. */
  readonly marker: Spot | null;
  /** Reads the segments - from the picked word, if one of them is picked. */
  speak: (target: ReadTarget, segments: readonly Segment[]) => void;
  /**
   * A word was clicked: while reading, reading jumps there; otherwise it is
   * picked as the start (clicked again, it is let go).
   */
  pickWord: (segments: readonly Segment[], spot: Spot) => void;
  pause: () => void;
  /** Reads on - or from the picked word, if one was picked while paused. */
  resume: () => void;
  stop: () => void;
  /** The German voices to choose from, best first. */
  readonly voices: readonly SpeechSynthesisVoice[];
  /** The voice that reads, or null when the browser picks one. */
  readonly voice: SpeechSynthesisVoice | null;
  setVoice: (voiceURI: string | null) => void;
  readonly rate: number;
  setRate: (rate: number) => void;
};

/** Nothing chosen yet. */
const NO_SETTINGS: SpeechSettings = { voice: null, rate: DEFAULT_RATE };

/**
 * The reader. It stops by itself when the component that uses it goes away
 * (another puzzle, back to the list) and when the page is left.
 *
 * @returns what is being read and how to control it
 */
export function useReadAloud(): ReadAloudApi {
  const supported = useSyncExternalStore(
    subscribeNothing,
    canSpeak,
    () => false,
  );
  const [status, setStatus] = useState<ReadStatus>("idle");
  const [target, setTarget] = useState<ReadTarget | null>(null);
  const [position, setPosition] = useState<ReadPosition | null>(null);
  const [mode, setMode] = useState<FollowMode>("unknown");
  const [marker, setMarker] = useState<Spot | null>(null);
  const [all, setAll] = useState<readonly SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<SpeechSettings>(NO_SETTINGS);
  // Raised by every start and stop: an utterance of an older round that
  // ends late (cancel ends it too) must not start the next piece.
  const round = useRef(0);
  // The timer that switches to sentences when a piece sends no boundary.
  const silence = useRef<number | null>(null);
  // What was learnt about the voice: whether it sends word boundaries.
  const learnt = useRef<{ voice: string | null; mode: FollowMode }>({
    voice: null,
    mode: "unknown",
  });
  // The segments last read or clicked, by target - for resuming at a pick.
  const known = useRef<Partial<Record<ReadTarget, readonly Segment[]>>>({});

  // The voices come late in some browsers - "voiceschanged" says when.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (supported) {
      const load = () => setAll(window.speechSynthesis.getVoices());
      load();
      window.speechSynthesis.addEventListener("voiceschanged", load);
      cleanup = () =>
        window.speechSynthesis.removeEventListener("voiceschanged", load);
    }
    return cleanup;
  }, [supported]);

  useEffect(() => {
    const read = readStored(SETTINGS_KEY, SETTINGS_VERSION, isSettings);
    if (read !== null) {
      setSettings(read);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const quiet = useCallback(() => {
    if (silence.current !== null) {
      window.clearTimeout(silence.current);
      silence.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    round.current += 1;
    quiet();
    if (canSpeak()) {
      window.speechSynthesis.cancel();
    }
    setStatus("idle");
    setTarget(null);
    setPosition(null);
    setMarker(null);
  }, [quiet]);

  // Silence when the puzzle is closed and when the page is left.
  useEffect(() => {
    window.addEventListener("pagehide", stop);
    window.addEventListener("beforeunload", stop);
    return () => {
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("beforeunload", stop);
      stop();
    };
  }, [stop]);

  // The word being read stays in sight - scrolled back gently only when it
  // leaves the screen.
  useEffect(() => {
    const shown = document.querySelector("[data-reading='true']");
    if (shown !== null) {
      const box = shown.getBoundingClientRect();
      if (
        box.top < VIEW_MARGIN ||
        box.bottom > window.innerHeight - VIEW_MARGIN
      ) {
        shown.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [position, mode]);

  const voice = pickVoice(all, settings.voice);

  const start = useCallback(
    (what: ReadTarget, segments: readonly Segment[], from: Spot | null) => {
      if (canSpeak()) {
        window.speechSynthesis.cancel();
        quiet();
        round.current += 1;
        const mine = round.current;
        const pieces = piecesFrom(segments, from);
        const voiceId = voice?.voiceURI ?? null;
        if (learnt.current.voice !== voiceId) {
          learnt.current = { voice: voiceId, mode: "unknown" };
        }
        const say = (at: number): void => {
          const piece = pieces[at];
          if (round.current !== mine) {
            // An older round - it has been stopped or replaced.
          } else if (piece === undefined) {
            quiet();
            setStatus("idle");
            setTarget(null);
            setPosition(null);
          } else {
            const text =
              segments.find((one) => one.id === piece.segment)?.text ?? "";
            const words = wordsOf(text);
            let heard = false;
            const utterance = new SpeechSynthesisUtterance(piece.text);
            utterance.lang = voice?.lang ?? GERMAN;
            utterance.voice = voice;
            utterance.rate = settings.rate;
            utterance.onstart = () => {
              if (round.current === mine) {
                // Word by word, the piece's first word until the first boundary.
                setPosition({
                  segment: piece.segment,
                  from: piece.from,
                  to: piece.to,
                  word:
                    learnt.current.mode === "words" && piece.from !== -1
                      ? piece.from
                      : null,
                });
                quiet();
                silence.current = window.setTimeout(() => {
                  if (
                    round.current === mine &&
                    !heard &&
                    learnt.current.mode !== "words"
                  ) {
                    learnt.current = { ...learnt.current, mode: "chunks" };
                    setMode("chunks");
                  }
                }, NO_BOUNDARY_MS);
              }
            };
            utterance.onboundary = (event) => {
              if (
                round.current === mine &&
                piece.from !== -1 &&
                (event.name === undefined || event.name === "word")
              ) {
                heard = true;
                learnt.current = { ...learnt.current, mode: "words" };
                setMode("words");
                const word = wordAt(words, piece.offset + event.charIndex);
                setPosition({
                  segment: piece.segment,
                  from: piece.from,
                  to: piece.to,
                  word: Math.min(Math.max(word, piece.from), piece.to),
                });
              }
            };
            utterance.onend = () => say(at + 1);
            utterance.onerror = () => say(at + 1);
            window.speechSynthesis.speak(utterance);
          }
        };
        known.current = { ...known.current, [what]: segments };
        setMode(learnt.current.mode);
        setMarker(null);
        setPosition(null);
        setStatus("speaking");
        setTarget(what);
        say(0);
      }
    },
    [quiet, settings.rate, voice],
  );

  const speak = useCallback(
    (what: ReadTarget, segments: readonly Segment[]) => {
      const fromPick =
        marker !== null && targetOf(marker) === what ? marker : null;
      start(what, segments, fromPick);
    },
    [marker, start],
  );

  const pickWord = useCallback(
    (segments: readonly Segment[], spot: Spot) => {
      const what = targetOf(spot);
      known.current = { ...known.current, [what]: segments };
      if (status === "speaking") {
        start(what, segments, spot);
      } else {
        setMarker((before) =>
          before?.segment === spot.segment && before.word === spot.word
            ? null
            : spot,
        );
      }
    },
    [start, status],
  );

  const pause = useCallback(() => {
    if (canSpeak()) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    const segments =
      marker === null ? undefined : known.current[targetOf(marker)];
    if (marker !== null && segments !== undefined) {
      start(targetOf(marker), segments, marker);
    } else if (canSpeak()) {
      window.speechSynthesis.resume();
      setStatus("speaking");
    }
  }, [marker, start]);

  const keep = useCallback((next: SpeechSettings) => {
    setSettings(next);
    writeStored(SETTINGS_KEY, SETTINGS_VERSION, next);
  }, []);

  return {
    supported,
    status,
    target,
    position,
    mode,
    marker,
    speak,
    pickWord,
    pause,
    resume,
    stop,
    voices: germanVoices(all),
    voice,
    setVoice: (voiceURI) => keep({ ...settings, voice: voiceURI }),
    rate: settings.rate,
    setRate: (rate) => keep({ ...settings, rate }),
  };
}

/**
 * What a word belongs to: the puzzle or its solution.
 */
function targetOf(spot: Spot): ReadTarget {
  return isSolution(spot.segment) ? "solution" : "puzzle";
}

/**
 * Whether this browser can speak.
 *
 * @returns true when speechSynthesis and utterances exist
 */
function canSpeak(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis === "object" &&
    window.speechSynthesis !== null &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

/**
 * Subscribes to nothing - whether the browser can speak never changes.
 *
 * @returns how to unsubscribe again
 */
function subscribeNothing(): () => void {
  return () => undefined;
}

/** Whether a value read back is the reader's settings. */
function isSettings(value: unknown): value is SpeechSettings {
  const one = value as SpeechSettings;
  return (
    typeof value === "object" &&
    value !== null &&
    (one.voice === null || typeof one.voice === "string") &&
    Object.values(RATES).some((rate) => rate === one.rate)
  );
}
