/**
 * Chat for an online game: newest line on top, with a quick emoji bar.
 *
 * @module
 * @remarks
 * On a phone the normal keyboard already offers emojis; the quick bar is just a
 * shortcut for the most common ones. Messages are shown newest first so the
 * latest is visible without scrolling. The labels come from the game, so the
 * chat itself carries no game-specific text.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import type { SeatId } from "./adapter";
import type { ChatMessage } from "./transport";

/** A handful of emojis for one tap on mobile. */
const QUICK_EMOJIS = [
  "\u{1F600}", // grin
  "\u{1F602}", // laughing
  "\u{1F609}", // wink
  "\u{1F44D}", // thumbs up
  "\u{1F389}", // party
  "\u{1F525}", // fire
  "\u{1F62E}", // surprised
  "\u{1F622}", // crying
  "\u{1F937}", // shrug
  "\u{1F44F}", // clapping
  "\u{2764}\u{FE0F}", // heart
];

/** How close to the top counts as "following", in pixels. */
const STICK_TO_TOP_TOLERANCE_PX = 24;

/** The labels the chat needs, supplied by the game. */
export type OnlineChatTexts = {
  readonly chatTitle: string;
  readonly chatEmpty: string;
  readonly chatYou: string;
  readonly chatPlaceholder: string;
  readonly chatSend: string;
  /** Tag on the most recent line, so the top of the list reads as newest. */
  readonly chatNewest: string;
};

/** Props of {@link OnlineChat}. */
export type OnlineChatProps = {
  readonly messages: readonly ChatMessage[];
  /** The viewer's seat, so their own lines can be marked. */
  readonly ownSeatId: SeatId | null;
  readonly onSend: (text: string) => void;
  readonly texts: OnlineChatTexts;
};

/**
 * Renders the room chat with an input and quick emojis.
 *
 * @param props - the messages, the viewer's seat, the send handler and labels
 * @returns the chat element
 */
export function OnlineChat({
  messages,
  ownSeatId,
  onSend,
  texts,
}: OnlineChatProps): ReactElement {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const isFollowing = useRef(true);

  // Keep the newest line (top) in view unless the player scrolled down to read.
  useEffect(() => {
    const list = listRef.current;
    if (list !== null && isFollowing.current) {
      list.scrollTop = 0;
    }
  }, [messages]);

  const handleScroll = () => {
    const list = listRef.current;
    if (list !== null) {
      isFollowing.current = list.scrollTop <= STICK_TO_TOP_TOLERANCE_PX;
    }
  };

  const submit = () => {
    onSend(draft);
    setDraft("");
  };

  const newestFirst = messages.slice().reverse();

  return (
    <section className="mt-3 flex flex-col rounded-2xl border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="mb-2 text-sm font-semibold">{texts.chatTitle}</h2>

      {/* The input sits above the history, so you write where you look; the
          newest line then appears directly below it, marked as newest. */}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={texts.chatPlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {texts.chatSend}
        </button>
      </form>

      {/* Quick emojis: one tap appends to the message being written. */}
      <div className="mt-2 flex flex-wrap gap-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setDraft((current) => current + emoji)}
            className="cursor-pointer rounded-md px-1.5 py-0.5 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <ol
        ref={listRef}
        onScroll={handleScroll}
        className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto text-sm"
      >
        {newestFirst.length === 0 ? (
          <li className="text-xs text-zinc-400">{texts.chatEmpty}</li>
        ) : (
          newestFirst.map((message, index) => {
            const mine = message.seatId === ownSeatId;
            const isNewest = index === 0;
            return (
              <li
                key={message.id}
                className={`leading-snug ${isNewest ? "rounded-md bg-emerald-50/70 px-1.5 py-0.5 dark:bg-emerald-950/30" : ""}`}
              >
                {isNewest && (
                  <span className="mr-1 rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {texts.chatNewest}
                  </span>
                )}
                <span
                  className={`font-semibold ${mine ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
                >
                  {mine ? texts.chatYou : message.name}:
                </span>{" "}
                <span className="break-words text-zinc-700 dark:text-zinc-200">
                  {message.text}
                </span>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}
