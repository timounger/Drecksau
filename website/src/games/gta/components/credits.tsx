/**
 * Who the music and the noises are by.
 *
 * @module
 * @remarks
 * **This is not decoration, it is the licence.** Every song in this game and a
 * good half of its noises are CC BY or CC BY-NC, and both of those allow the
 * use only if the author is named where the work is used. Deleting this block
 * would make the game a licence breach, and naming them only in the repository
 * would not do either: nobody hears the music there.
 *
 * *Where* it stands is another question, and the licence leaves it open - it
 * asks for a naming "reasonable to the medium", which for a game is the
 * credits. So this lives on the settings page rather than under the picture,
 * one click from the game and in the text of the site.
 */
import type { ReactElement } from "react";
import { creditOf } from "@/games/gta/audio/radio";
import { SOUND_CREDITS } from "@/games/gta/audio/sounds";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";

/**
 * Who the music is by, which the licence asks for in so many words.
 *
 * @param music - every song the page found, radio and loading screen
 * @returns the block, or a note where there is no music at all
 * @remarks
 * **CC BY means one has to say four things**: the title, the artist, where it
 * came from and which licence it is under. All four are here, and the first
 * two come out of the file name (`creditOf`) - so a song added to the folder
 * credits itself and nobody has to remember to edit a list. The folder's own
 * README says the same thing for whoever fills it.
 */
export function MusicCredits({
  music,
}: {
  readonly music: readonly string[];
}): ReactElement {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 text-xs dark:border-zinc-800">
      <h2 className="text-sm font-semibold">{T.musicTitle}</h2>
      {music.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{T.musicNone}</p>
      ) : (
        <>
          <p className="text-zinc-500 dark:text-zinc-400">{T.musicLead}</p>
          <ul className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-400">
            {music.map((url) => {
              const credit = creditOf(url);
              return (
                <li key={url}>
                  <b>{credit.title}</b>
                  {credit.artist === null ? null : <> - {credit.artist}</>} (
                  <a
                    href="https://freemusicarchive.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {T.musicSource}
                  </a>
                  ,{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {T.musicLicence}
                  </a>
                  )
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/**
 * Who the noises are by, for the ones whose licence asks.
 *
 * @returns the block, or nothing where none of them ask
 * @remarks
 * **Not every sound needs this.** A CC0 file asks for nothing and would only
 * make the list longer; the ones that are CC BY or CC BY-NC have to be named
 * where the game is heard. So the list is the table in `SOUND_CREDITS`, and a
 * sound that is not in it is a sound that does not need to be.
 */
export function SoundCredits(): ReactElement | null {
  if (SOUND_CREDITS.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 text-xs dark:border-zinc-800">
      <h2 className="text-sm font-semibold">{T.soundTitle}</h2>
      <p className="text-zinc-500 dark:text-zinc-400">{T.soundLead}</p>
      <ul className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-400">
        {SOUND_CREDITS.map((one) => (
          <li key={one.file}>
            <b>{one.title}</b> - {one.author} (
            <a
              href={one.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              freesound.org
            </a>
            , {one.licence}
            {one.edited === null ? null : <>, {T.soundEdited}</>})
          </li>
        ))}
      </ul>
    </section>
  );
}
