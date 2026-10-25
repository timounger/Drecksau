/**
 * The reader on screen: "Vorlesen", pause and resume, stop, the small
 * settings for voice and speed, and the text word by word - the word being
 * read highlighted, a word to start from picked by a click.
 *
 * @module
 */
"use client";

import type { MouseEvent, ReactElement } from "react";
import {
  RATES,
  isSolution,
  wordsOf,
  type Segment,
} from "@/games/sherlock/engine/read-aloud";
import type {
  ReadAloudApi,
  ReadTarget,
} from "@/games/sherlock/hooks/use-read-aloud";
import { SHERLOCK_TEXTS as T } from "@/games/sherlock/i18n/texts";

/** The look of a reader button. */
const BUTTON =
  "cursor-pointer rounded-lg border border-violet-300 px-3 py-1.5 text-sm font-semibold text-violet-800 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-200 dark:hover:bg-violet-950/50";

/** The look of a drop-down in the settings. */
const SELECT =
  "rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/** The look of a word that can be clicked. */
const WORD = "cursor-pointer rounded-sm transition-colors duration-150";

/** The word being read. */
const WORD_READING = "bg-yellow-200 dark:bg-yellow-600/60";

/** A word of the sentence being read, where the voice tells no words. */
const WORD_IN_PIECE = "bg-yellow-100 dark:bg-yellow-800/40";

/** The word picked to start from. */
const WORD_PICKED =
  "bg-violet-100 ring-2 ring-violet-400 dark:bg-violet-900/50";

/** A word nothing is happening to - it only reacts to the mouse. */
const WORD_PLAIN = "hover:bg-zinc-100 dark:hover:bg-zinc-800";

/** The name of each speed. */
const RATE_NAMES: Readonly<Record<keyof typeof RATES, string>> = {
  slow: "Langsam",
  normal: "Normal",
  fast: "Schnell",
};

/**
 * Start, or - while this is being read - pause, resume and stop.
 *
 * @param props - the reader, what this button reads, its label and the
 *   segments to speak
 * @returns the buttons, or nothing where the browser cannot speak
 */
export function SpeakButtons({
  reader,
  target,
  label,
  segments,
}: {
  readonly reader: ReadAloudApi;
  readonly target: ReadTarget;
  readonly label: string;
  readonly segments: () => readonly Segment[];
}): ReactElement | null {
  const mine = reader.target === target && reader.status !== "idle";
  const picked =
    reader.marker !== null &&
    isSolution(reader.marker.segment) === (target === "solution");
  const buttons = mine ? (
    <>
      {reader.status === "paused" ? (
        <button
          type="button"
          data-testid={`sherlock-speak-resume-${target}`}
          onClick={reader.resume}
          className={BUTTON}
        >
          {`▶ ${T.speakResume}`}
        </button>
      ) : (
        <button
          type="button"
          data-testid={`sherlock-speak-pause-${target}`}
          onClick={reader.pause}
          className={BUTTON}
        >
          {`⏸ ${T.speakPause}`}
        </button>
      )}
      <button
        type="button"
        data-testid={`sherlock-speak-stop-${target}`}
        onClick={reader.stop}
        className={BUTTON}
      >
        {`⏹ ${T.speakStop}`}
      </button>
    </>
  ) : (
    <button
      type="button"
      data-testid={`sherlock-speak-${target}`}
      onClick={() => reader.speak(target, segments())}
      className={BUTTON}
    >
      {`\u{1F50A} ${label}${picked ? ` ${T.speakFromMarker}` : ""}`}
    </button>
  );
  return reader.supported ? buttons : null;
}

/**
 * The reader's settings, folded away: the German voice and the speed.
 *
 * @param props - the reader
 * @returns the settings, or nothing where the browser cannot speak
 */
export function SpeechSettings({
  reader,
}: {
  readonly reader: ReadAloudApi;
}): ReactElement | null {
  return reader.supported ? (
    <details
      className="text-sm open:basis-full"
      data-testid="sherlock-speech-settings"
    >
      <summary
        className="inline-block cursor-pointer list-none rounded-lg border border-zinc-300 px-3 py-1.5 select-none hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        title={T.speechSettings}
      >
        {`⚙ ${T.speechSettings}`}
      </summary>
      <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold">{T.speechVoice}</span>
          <select
            value={reader.voice?.voiceURI ?? ""}
            onChange={(event) =>
              reader.setVoice(
                event.target.value === "" ? null : event.target.value,
              )
            }
            data-testid="sherlock-speech-voice"
            className={`${SELECT} max-w-[16rem]`}
          >
            {reader.voices.length === 0 && (
              <option value="">{T.speechNoVoice}</option>
            )}
            {reader.voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {`${voice.name} (${voice.lang})`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold">{T.speechRate}</span>
          <select
            value={String(reader.rate)}
            onChange={(event) => reader.setRate(Number(event.target.value))}
            data-testid="sherlock-speech-rate"
            className={SELECT}
          >
            {(Object.keys(RATES) as (keyof typeof RATES)[]).map((key) => (
              <option key={key} value={String(RATES[key])}>
                {`${RATE_NAMES[key]} (${String(RATES[key])}x)`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  ) : null;
}

/**
 * Paragraphs that can be read aloud: each word its own span, the word being
 * read (or its sentence) highlighted, and a click on a word picks it as the
 * start - or, while reading, jumps there. Dragging to select text still
 * selects: only a click without a selection counts.
 *
 * @param props - the reader, all segments of what is read (the clickable
 *   ones are those shown as words), and the look of a paragraph
 * @returns the paragraphs
 */
export function ReadableParagraphs({
  reader,
  segments,
  className,
  testId,
}: {
  readonly reader: ReadAloudApi;
  readonly segments: readonly Segment[];
  readonly className?: string;
  readonly testId?: string;
}): ReactElement {
  const click = (event: MouseEvent<HTMLElement>) => {
    const selection = window.getSelection();
    const word =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-word]")
        : null;
    if (
      reader.supported &&
      word !== null &&
      (selection === null || selection.isCollapsed)
    ) {
      reader.pickWord(segments, {
        segment: word.dataset.segment ?? "",
        word: Number(word.dataset.word),
      });
    }
  };
  return (
    <div className="flex flex-col gap-2" data-testid={testId} onClick={click}>
      {segments
        .filter((segment) => segment.spoken === undefined)
        .map((segment) => (
          <p
            key={segment.id}
            className={className}
            title={reader.supported ? T.readFromHere : undefined}
          >
            {reader.supported ? (
              <Words reader={reader} segment={segment} />
            ) : (
              segment.text
            )}
          </p>
        ))}
    </div>
  );
}

/**
 * Whether a block read whole (the title, a picture) is being read.
 *
 * @param reader - the reader
 * @param id - the block's segment id
 * @returns true while it is read
 */
export function isReadingWhole(reader: ReadAloudApi, id: string): boolean {
  return reader.position?.segment === id;
}

/** The words of one paragraph, with the spaces between them as they are. */
function Words({
  reader,
  segment,
}: {
  readonly reader: ReadAloudApi;
  readonly segment: Segment;
}): ReactElement {
  const words = wordsOf(segment.text);
  const here = reader.position?.segment === segment.id ? reader.position : null;
  return (
    <>
      {words.map((word, at) => {
        const reading =
          here !== null && reader.mode === "words" && here.word === at;
        const inPiece =
          here !== null &&
          reader.mode === "chunks" &&
          at >= here.from &&
          at <= here.to;
        const picked =
          reader.marker?.segment === segment.id && reader.marker.word === at;
        const before = segment.text.slice(
          at === 0 ? 0 : words[at - 1].end,
          word.start,
        );
        return (
          <span key={word.start}>
            {/* Inside a highlighted sentence the spaces are highlighted too,
                so it reads as one band. */}
            {inPiece && here !== null && at > here.from ? (
              <span className={WORD_IN_PIECE}>{before}</span>
            ) : (
              before
            )}
            <span
              data-word={at}
              data-segment={segment.id}
              data-reading={
                reading || (inPiece && at === here?.from) ? "true" : undefined
              }
              className={`${WORD} ${lookOf(reading, inPiece, picked)}`}
            >
              {segment.text.slice(word.start, word.end)}
            </span>
          </span>
        );
      })}
    </>
  );
}

/**
 * The look of a word: being read, picked as the start, in the sentence
 * being read, or plain.
 */
function lookOf(reading: boolean, inPiece: boolean, picked: boolean): string {
  let look = WORD_PLAIN;
  if (reading) {
    look = WORD_READING;
  } else if (picked) {
    look = WORD_PICKED;
  } else if (inPiece) {
    look = WORD_IN_PIECE;
  }
  return look;
}
