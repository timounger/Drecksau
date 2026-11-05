/**
 * The photo album: one small picture per photo point, kept apart from the
 * save so the save stays small.
 *
 * @module
 * @remarks
 * Every photo is a JPEG of 128 x 72 pixels as a data URL - a few kilobytes
 * each, ten at most; a newer photo of a place replaces the older one. Which
 * places have a photo is also in the save (`progress.photos`), for the
 * achievement; the pictures are only for looking at.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the album. */
const ALBUM_VERSION = 1;

/** Where the album lives. */
const ALBUM_KEY = storageKey("weihnachtsmann", "album");

/** The longest picture kept, characters of its data URL. */
const MAX_PICTURE = 24000;

/** The album: a picture (data URL) per photo point. */
export type Album = Readonly<Record<string, string>>;

/**
 * Reads the album.
 *
 * @returns the pictures by photo point, none when there is no album
 */
export function loadAlbum(): Album {
  return readStored(ALBUM_KEY, ALBUM_VERSION, isAlbum) ?? {};
}

/**
 * Keeps a photo in the album, replacing an older one of the same place.
 *
 * @param id - the photo point
 * @param picture - the photo as a data URL
 */
export function keepPhoto(id: string, picture: string): void {
  if (picture.length <= MAX_PICTURE && picture.startsWith("data:image/")) {
    writeStored(ALBUM_KEY, ALBUM_VERSION, { ...loadAlbum(), [id]: picture });
  }
}

/** Whether a stored value is an album. */
function isAlbum(value: unknown): value is Album {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (picture) =>
        typeof picture === "string" && picture.startsWith("data:image/"),
    )
  );
}
