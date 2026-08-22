/**
 * Inviting somebody into a private room by a link.
 *
 * @module
 * @remarks
 * A room code is four characters so it can be read out over the phone. A link
 * is for the other way round - pasted into whatever the players already talk
 * in - and it carries the code so nobody has to type anything at all.
 *
 * The link **fills the field in, it does not join**. Joining needs a name, and
 * somebody arriving from a chat message has not been asked for one yet. So the
 * entry screen opens with the code already there and one button left to press,
 * which is also the moment they can see which game they have been invited to
 * before committing to it.
 *
 * The code travels as a query parameter rather than a path segment because the
 * site is exported as static files: `?raum=WFB2` needs no route of its own,
 * while `/raum/WFB2` would need one page per code.
 */
"use client";

import { useState, type ReactElement } from "react";
import { normalizeRoomCode } from "@/online/room-code";

/** The query parameter an invite link carries the room code in. */
export const ROOM_QUERY_PARAM = "raum";

/** How long the copy button confirms before going back to its label. */
const COPIED_FEEDBACK_MS = 1500;

/** Labels the copy row needs, so each game keeps its own wording. */
export type CopyTexts = {
  readonly copyCode: string;
  readonly copyLink: string;
  readonly copied: string;
};

/**
 * The link that invites somebody into this room.
 *
 * @param code - the room code
 * @returns the absolute URL of this page with the code attached
 * @remarks
 * Built from the page the host is standing on, so it works the same on the
 * deployed site, on a preview and on `localhost` without knowing any of them.
 */
export function inviteLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}?${ROOM_QUERY_PARAM}=${code}`;
}

/**
 * The room code an invite link brought, if there is one.
 *
 * @returns the normalized code, or an empty string
 * @remarks
 * Read from `window.location` rather than through the router's hooks: on a
 * statically exported page those force the whole screen behind a suspense
 * boundary, and this is wanted once on mount and never again.
 */
export function invitedCode(): string {
  const invited = new URLSearchParams(window.location.search).get(
    ROOM_QUERY_PARAM,
  );
  return invited === null ? "" : normalizeRoomCode(invited);
}

/** Props of {@link CopyButton}. */
export type CopyButtonProps = {
  readonly label: string;
  readonly value: string;
  /** What it says while it is confirming. */
  readonly copied: string;
};

/**
 * Copies a value to the clipboard and briefly confirms it.
 *
 * @param props - the label, the value and the confirmation word
 * @returns the button
 */
export function CopyButton({
  label,
  value,
  copied,
}: CopyButtonProps): ReactElement {
  const [done, setDone] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setDone(true);
      window.setTimeout(() => setDone(false), COPIED_FEEDBACK_MS);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-testid={`copy-${label}`}
      className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {done ? copied : label}
    </button>
  );
}

/**
 * The room code with a button for it and one for the invite link.
 *
 * @param props - the code and the three labels
 * @returns the row shown in a private room's lobby
 */
export function ShareRow({
  code,
  texts,
}: {
  readonly code: string;
  readonly texts: CopyTexts;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        data-testid="room-code"
        className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-2xl font-bold tracking-widest dark:bg-zinc-800"
      >
        {code}
      </span>
      <CopyButton label={texts.copyCode} value={code} copied={texts.copied} />
      <CopyButton
        label={texts.copyLink}
        value={inviteLink(code)}
        copied={texts.copied}
      />
    </div>
  );
}
