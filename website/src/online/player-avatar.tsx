/**
 * The face a player goes by online, remembered and chosen.
 *
 * @module
 * @remarks
 * Stored beside the name and for the same reason: nobody thinks of themselves
 * as a different person per game. One key for all of them.
 *
 * It rides along on the seat, so no game has to carry it anywhere - the room
 * builds a seat once, and every screen that already shows a name can show the
 * face beside it.
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import {
  AVATARS,
  Avatar,
  DEFAULT_AVATAR,
  type AvatarId,
} from "@/online/avatar";
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** Schema version of the stored face - raise it on breaking changes. */
const AVATAR_VERSION = 1;

/** Storage key for the chosen face, shared by every game. */
const AVATAR_KEY = storageKey("online", "player-avatar");

/** German labels of the picker. */
const T = {
  heading: "Dein Gesicht",
  hint: "Die anderen sehen es neben deinem Namen.",
  whereChanged: "Dein Gesicht - änderbar im Konto auf der Startseite",
} as const;

/**
 * The chosen face, as a store React may read while rendering.
 *
 * @remarks
 * A store rather than a plain read: this is looked at during the first render
 * of the account button and of every online entry screen, and a prerendered
 * page has no storage to read. See `lib/storage/stored-value.ts`.
 */
export const playerAvatarStore: StoredValue<AvatarId> = createStoredValue(
  AVATAR_KEY,
  AVATAR_VERSION,
  DEFAULT_AVATAR,
  isAvatarId,
);

/**
 * The face this player last chose.
 *
 * @returns the stored id, or the default one
 */
export function loadPlayerAvatar(): AvatarId {
  return playerAvatarStore.load();
}

/**
 * Stores the face to use next time, in every game.
 *
 * @param id - the face the player picked
 */
export function savePlayerAvatar(id: AvatarId): void {
  playerAvatarStore.save(id);
}

/**
 * The chosen face, following any change to it.
 *
 * @returns the id, as it is right now
 */
export function useChosenAvatar(): AvatarId {
  return useSyncExternalStore(
    playerAvatarStore.subscribe,
    playerAvatarStore.getSnapshot,
    playerAvatarStore.getServerSnapshot,
  );
}

/**
 * The row of faces to pick from.
 *
 * @param props - the chosen face and what to do when another is picked
 * @returns the picker
 * @remarks
 * A scrolling row rather than a dialog behind a button: a face nobody sees is
 * a face nobody changes, and the whole point is that the others recognise you.
 */
export function AvatarPicker({
  value,
  onPick,
}: {
  readonly value: AvatarId;
  readonly onPick: (id: AvatarId) => void;
}): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{T.heading}</span>
      <ul
        data-testid="avatar-picker"
        className="flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200 p-2 dark:border-zinc-800"
      >
        {AVATARS.map((face) => (
          <li key={face.id}>
            <button
              type="button"
              title={face.label}
              aria-label={face.label}
              aria-pressed={face.id === value}
              data-testid={`pick-avatar-${face.id}`}
              onClick={() => onPick(face.id)}
              className="flex cursor-pointer rounded-full"
            >
              <Avatar
                id={face.id}
                size={AVATAR_SIZE}
                picked={face.id === value}
              />
            </button>
          </li>
        ))}
      </ul>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{T.hint}</span>
    </div>
  );
}

/** How big the faces are in the picker. */
const AVATAR_SIZE = 40;

/**
 * The picker wired to storage.
 *
 * @param props - an optional listener, for a screen that shows the face too
 * @returns the picker, remembering what is picked
 */
export function StoredAvatarPicker({
  onPick,
}: {
  readonly onPick?: (id: AvatarId) => void;
} = {}): ReactElement {
  const id = useChosenAvatar();

  const pick = (next: AvatarId) => {
    savePlayerAvatar(next);
    onPick?.(next);
  };

  return <AvatarPicker value={id} onPick={pick} />;
}

/** How big the face is beside the name field. */
const FACE_SIZE = 34;

/**
 * The chosen face, shown but not offered.
 *
 * @returns the face, with a word on where it is changed
 * @remarks
 * For the online screens. The face is picked in one place - the account on the
 * start page - but it still has to be visible where you are about to be seen
 * in it, or nobody would ever discover they had one.
 */
export function StoredAvatarFace(): ReactElement {
  const id = useChosenAvatar();
  return (
    <span
      title={T.whereChanged}
      data-testid="own-face"
      className="flex items-center"
    >
      <Avatar id={id} size={FACE_SIZE} />
    </span>
  );
}

/** Whether a stored value is something this build can use as an id. */
function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string";
}
