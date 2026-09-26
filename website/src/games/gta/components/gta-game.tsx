/**
 * The screen you play GTA on: the canvas, the heads-up display, the overlays.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useRef, useState, type ReactElement } from "react";
import { creditOf } from "@/games/gta/audio/radio";
import { VolumeSlider } from "@/games/gta/components/volume-slider";
import { SOUND_CREDITS } from "@/games/gta/audio/sounds";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";
import { GameHeader } from "@/components/game-header";
import { useGtaGame, type Heads } from "@/games/gta/hooks/use-gta-game";
import { MAX_SAVES, type SaveSlot } from "@/games/gta/storage/saves";
import { GTA_RULES } from "@/games/gta/i18n/rules";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";
import { VIEW_HEIGHT, VIEW_WIDTH } from "@/games/gta/components/projection";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/**
 * The screen one looks at while the city is being laid out.
 *
 * @param part - how much of the work is done, from nought to one
 * @param roll - which line to show, thrown in the hook
 * @param art - the picture behind it, or null while there is none
 * @returns the overlay
 * @remarks
 * **Over the canvas, not instead of it.** The canvas has to be in the page
 * from the first render - the loop hands it the picture the moment there is
 * one - so this sits on top of it and goes away when there is a city to look
 * at instead.
 *
 * The picture behind it is one of the files in `public/gta/splash/` rather
 * than anything drawn here - see {@link pick}. If there are none, the
 * background is the dark ground underneath and nothing looks broken.
 */
function LoadingScreen({
  part,
  roll,
  art,
}: {
  readonly part: number;
  readonly roll: number;
  readonly art: string | null;
}): ReactElement {
  // One line per piece of work, drawn once when that piece begins: picked on
  // every render it would flicker through the list while the bar moves.
  const line = loadingLine(roll);
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-start justify-end bg-zinc-950 bg-cover bg-center pb-[9%] pl-[9%]"
      style={art === null ? undefined : { backgroundImage: `url(${art})` }}
      data-testid="gta-loading"
      aria-label={`${T.loadingTitle} - ${T.loadingDone(part)}`}
    >
      {/* **The picture is the picture.** No dark sheet over it: what one is
          looking at while the city is laid out is the artwork, and all this
          screen adds is a bar and a line of nonsense about what is supposedly
          going on. Both stand low and to the left, out of the middle of the
          picture; the bar has a dark track and a ring round it and the words
          a shadow, so that they read on a bright picture as well as on a dark
          one. */}
      <p className="mb-2 text-sm font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]">
        {line}
      </p>
      <div className="h-3 w-[42%] overflow-hidden rounded-full bg-black/60 ring-1 ring-white/30">
        {/* **Kein Übergang auf der Breite.** Eine CSS-Animation auf `width`
            läuft auf demselben Faden wie der Aufbau, und der Aufbau lässt ihn
            nicht los: Der Balken stand gemessen bei 0 Pixeln, während der Wert
            darüber schon auf 85 % stand - die Animation begann und kam nie
            weiter. Ohne sie steht die Breite sofort da, wo sie hingehört. */}
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${String(Math.round(part * WHOLE))}%` }}
          data-testid="gta-loading-bar"
        />
      </div>
    </div>
  );
}

/**
 * Which line the loading screen shows for a given throw.
 *
 * @param roll - the throw, from the hook
 * @returns one of the lines in the table of them
 * @remarks
 * **The line has nothing to do with the piece of work any more.** It used to:
 * each stage of the build had its own lines and one of those was shown while
 * that stage ran. The trouble is that the stages are not the same length -
 * the traffic is laid in two hundredths of a second and the crowds take a
 * second and a half - so most of the jokes went past too fast to read, and two
 * of the seven were on screen for the whole wait.
 *
 * Now a **category is drawn** and then a line out of it, both from the same
 * throw. The lines are still grouped, because a group is how one writes them
 * and what keeps them varied, but which group comes up next is chance. Every
 * line in the file gets its turn, and none of them depends on how quick the
 * machine is.
 *
 * The two numbers come out of one throw so that the hook has one thing to
 * roll: the low part picks the group, the high part picks the line in it.
 */
function loadingLine(roll: number): string {
  const groups = Object.values(T.loadingLines);
  const group = groups[roll % Math.max(1, groups.length)] ?? [];
  const at = Math.floor(roll / Math.max(1, groups.length));
  return group[at % Math.max(1, group.length)] ?? T.loadingTitle;
}

/**
 * Which picture a throw lands on.
 *
 * @param splashes - every file in the splash folder, as the page found them
 * @param art - the throw, or below nought while none has been made
 * @returns the picture's URL, or null for no picture
 * @remarks
 * **The throw is bigger than the folder**, on purpose: the hook does not know
 * how many pictures there are, so it throws a large die and the folder is
 * wrapped round it. Adding a picture is therefore adding a file and nothing
 * else - no count anywhere in the code to keep in step with it.
 */
function pick(splashes: readonly string[], art: number): string | null {
  if (art < 0 || splashes.length === 0) {
    return null;
  }
  return splashes[art % splashes.length] ?? null;
}

/** A share written as a percentage. */
const WHOLE = 100;

/** Which mouse button puts a charge down - and works the tank's machine gun. */
const RIGHT_BUTTON = 2;

/** The look of a link in the header. */
const LINK =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the game.
 *
 * @param splashes - the pictures the loading screen may show, from the page
 * @param stations - the songs the car radio may play, from the same page
 * @returns the screen
 */
export function GtaScreen({
  splashes,
  stations,
}: {
  readonly splashes: readonly string[];
  readonly stations: readonly string[];
}): ReactElement {
  const {
    heads,
    loading,
    attach,
    onPointer,
    onPress,
    onFire,
    onPlant,
    onSpray,
    god,
    toggleGod,
    restart,
    carryOn,
    escape,
    saves,
    save,
    load,
    forget,
  } = useGtaGame(stations);

  // The picture, on its own, is what fills the screen: the ticker and the
  // list of keys underneath are of no use to a thumb.
  const stage = useRef<HTMLDivElement>(null);
  const shot = useRef<HTMLCanvasElement>(null);
  const fullscreen = useFullscreen(stage);
  useShotRatio(shot, stage);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={GTA_RULES}>
        <button
          type="button"
          data-testid="gta-new"
          onClick={restart}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.newGame}
        </button>
        <button
          type="button"
          data-testid="gta-god"
          aria-pressed={god}
          onClick={(event) => {
            toggleGod();
            // Off the button again, or Enter would toggle it instead of
            // getting the player out of the car.
            event.currentTarget.blur();
          }}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
            god
              ? "border-pink-500 bg-pink-100 font-semibold text-pink-900 dark:bg-pink-900/40 dark:text-pink-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {T.god}
        </button>
        <VolumeSlider />
        {fullscreen.supported && (
          <button
            type="button"
            data-testid="gta-fullscreen"
            onClick={fullscreen.toggle}
            className={LINK}
          >
            {fullscreen.active ? T.fullscreenExit : T.fullscreen}
          </button>
        )}
        <Link href="/gta/einstellungen" className={LINK}>
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link href="/gta/statistik" className={LINK}>
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      <div
        ref={stage}
        className="game-fullscreen relative overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-700"
      >
        {loading !== null && (
          <LoadingScreen
            part={loading.done}
            roll={loading.roll}
            art={pick(splashes, loading.art)}
          />
        )}
        <canvas
          ref={(box) => {
            shot.current = box;
            attach(box);
          }}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          data-testid="gta-canvas"
          onPointerMove={onPointer}
          onPointerDown={(event) => {
            onPointer(event);
            // A button drawn into the picture takes the press first: buying a
            // pistol must not also swing a fist at the shopkeeper.
            if (onPress(event)) {
              return;
            }
            // Left sets things off, right puts them down. The context menu is
            // already off below, or the second half of the Fernzünder would be
            // a browser menu.
            if (event.button === RIGHT_BUTTON) {
              // Both readings of the right button at once: the press puts a
              // charge down, and holding it works the machine gun on the tank.
              // Only one of the two can be meant at a time - the charge asks to
              // be on foot, the gun asks to be in a tank - so the engine sorts
              // out which, and this end simply reports what the hand did.
              onPlant();
              onSpray(true);
            } else {
              onFire(true);
            }
          }}
          onPointerUp={() => {
            onFire(false);
            onSpray(false);
          }}
          onPointerLeave={() => {
            onFire(false);
            onSpray(false);
          }}
          onContextMenu={(event) => event.preventDefault()}
          // touch-none: a thumb on the stick must drive the game, not scroll
          // the page out from under it.
          className="block w-full touch-none cursor-crosshair bg-zinc-900"
          style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
        />
        {fullscreen.active && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="absolute top-3 left-3 z-50 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
          >
            {T.fullscreenExit}
          </button>
        )}
        {heads.phase !== "playing" &&
          heads.phase !== "prison" &&
          heads.phase !== "mint" &&
          heads.phase !== "bank" && (
            <Overlay
              heads={heads}
              onCarryOn={carryOn}
              onRestart={restart}
              onEscape={escape}
            />
          )}
      </div>

      <Saves saves={saves} onSave={save} onLoad={load} onForget={forget} />

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">{T.controls}</h2>
          <ul className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-400">
            <li>
              <b>W A S D</b> oder Pfeiltasten: zu Fuß in alle vier Richtungen,
              im Auto Gas, Bremse und Lenkung
            </li>
            <li>
              <b>Maus</b>: zu Fuß schaust du dorthin - <b>Klick</b> schießt
            </li>
            <li>
              <b>Fernzünder</b>: <b>Rechtsklick</b> legt einen Zünder ab (bis zu
              zehn), <b>Linksklick</b> jagt alle auf einmal hoch
            </li>
            <li>
              <b>Am Handy</b>: linke Bildhälfte ist der Stick zum Laufen und
              Fahren, rechte Bildhälfte zielt und schießt. Die drei Knöpfe unten
              rechts sind <b>Auto</b> (ein- und aussteigen), <b>Waffe</b>{" "}
              (wechseln) und <b>Zünder</b> (ablegen).
            </li>
            <li>
              <b>Mausrad</b>: zu Fuß die Waffe wechseln - zu Beginn nur die
              Faust, alles andere liegt in der Stadt herum. Im Auto schaltet
              dasselbe Rad den Radiosender weiter
            </li>
            <li>
              <b>E</b> oder <b>Enter</b>: ein- und aussteigen
            </li>
            <li>Gelber Ring: abholen. Grüner Ring: abliefern.</li>
            <li>Blauer Ring: Lackiererei - Fahndung weg, kostet Geld.</li>
            <li>
              <b>Shift</b> halten: rennen (dreifach), im Auto anderthalbfach.
              Mit <b>{T.god}</b> wird daraus zehnfach zu Fuß und dreifach im
              Auto
            </li>
            <li>
              Im <b>{T.escapeTitle}</b>: laufen mit W A S D, und die{" "}
              <b>Maus gedrückt halten</b>, um zu schrauben, zu lösen und das
              Fenster zu öffnen. Den Kegeln der Wärter aus dem Weg gehen.
            </li>
            <li>
              In der <b>{T.worksTitle}</b>: dieselbe <b>gehaltene Maus</b> nimmt
              Geiseln, schaufelt am Tunnel und verbarrikadiert die Türen - je
              nachdem, wovor du stehst.
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold">{T.log}</h2>
          <ul data-testid="gta-log" className="flex flex-col gap-0.5">
            {heads.log.map((line, at) => (
              <li
                key={`${at}-${line}`}
                className="text-zinc-600 dark:text-zinc-400"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Credits stations={stations} />
        <SoundCredits />
      </div>
    </div>
  );
}

/**
 * Who the music is by, which the licence asks for in so many words.
 *
 * @param stations - the songs the page found in the folder
 * @returns the block under the picture, or nothing at all without music
 * @remarks
 * **CC BY means one has to say four things**: the title, the artist, where it
 * came from and which licence it is under. All four are here, and the first
 * two come out of the file name (`creditOf`) - so a song added to the folder
 * credits itself and nobody has to remember to edit a list. The folder's own
 * README says the same thing for whoever fills it.
 */
function Credits({
  stations,
}: {
  readonly stations: readonly string[];
}): ReactElement {
  return (
    <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
      <h2 className="mb-1 text-sm font-semibold">{T.musicTitle}</h2>
      {stations.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{T.musicNone}</p>
      ) : (
        <>
          <p className="mb-1 text-zinc-600 dark:text-zinc-400">{T.musicLead}</p>
          <ul className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-400">
            {stations.map((url) => {
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
 * @returns the block under the picture, or nothing where none of them ask
 * @remarks
 * **Not every sound needs this.** A CC0 file asks for nothing and would only
 * make the list longer; the ones that are CC BY have to be named where the
 * game is heard. So the list is the table in `SOUND_CREDITS`, and a sound that
 * is not in it is a sound that does not need to be.
 */
function SoundCredits(): ReactElement | null {
  if (SOUND_CREDITS.length === 0) {
    return null;
  }
  return (
    <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
      <h2 className="mb-1 text-sm font-semibold">{T.soundTitle}</h2>
      <p className="mb-1 text-zinc-600 dark:text-zinc-400">{T.soundLead}</p>
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

/**
 * The saved games: one line to write a new one, and the ten that are there.
 *
 * @param props - the list and the three things one can do to it
 * @returns the panel
 * @remarks
 * On the page rather than in the picture, unlike every other button in this
 * game, and for one reason: naming a save needs a keyboard, and a keyboard
 * over the city would eat the W A S D.
 *
 * The game keeps itself anyway - it is written every few seconds and picked up
 * when the page opens - so this is for the saves one wants to come **back** to.
 */
function Saves({
  saves,
  onSave,
  onLoad,
  onForget,
}: {
  readonly saves: readonly SaveSlot[];
  readonly onSave: (name: string) => void;
  readonly onLoad: (at: number) => void;
  readonly onForget: (at: number) => void;
}): ReactElement {
  const [name, setName] = useState("");
  return (
    <section
      data-testid="gta-saves"
      className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800"
    >
      <h2 className="mb-2 text-sm font-semibold">{T.savesTitle}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={T.savesName}
          maxLength={NAME_MAX}
          data-testid="gta-save-name"
          className="w-48 rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          data-testid="gta-save"
          onClick={() => {
            onSave(name);
            setName("");
          }}
          className={LINK}
        >
          {T.save}
        </button>
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.savesRoom(saves.length, MAX_SAVES)}
        </span>
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {saves.map((slot) => (
          <li
            key={slot.at}
            className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-1 dark:border-zinc-800"
          >
            <b className="min-w-24">{slot.name}</b>
            <span className="text-zinc-500 dark:text-zinc-400">
              {when(slot.savedAt)}
            </span>
            <button
              type="button"
              onClick={() => onLoad(slot.at)}
              className={`${LINK} ml-auto`}
            >
              {T.load}
            </button>
            <button
              type="button"
              onClick={() => onForget(slot.at)}
              className={LINK}
            >
              {T.forget}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The day and the time a save was written, as this country writes them. */
function when(at: number): string {
  return new Date(at).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** How long a name may be. */
const NAME_MAX = 24;

/** What is shown over the city when the day ends one way or the other. */
function Overlay({
  heads,
  onCarryOn,
  onRestart,
  onEscape,
}: {
  readonly heads: Heads;
  readonly onCarryOn: () => void;
  readonly onRestart: () => void;
  readonly onEscape: () => void;
}): ReactElement {
  const won = heads.phase === "won";
  const jailed = heads.phase === "busted";
  const title = won ? T.won : jailed ? T.busted : T.wasted;
  const text = won ? T.wonText : jailed ? T.bustedText : T.wastedText;
  return (
    <div
      data-testid="gta-overlay"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center text-white"
    >
      <h2 className="text-3xl font-black tracking-wide">{title}</h2>
      <p className="max-w-md text-sm">{text}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          data-testid="gta-carry-on"
          onClick={won ? onRestart : onCarryOn}
          className="cursor-pointer rounded-lg bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
        >
          {won ? T.newGame : jailed ? T.serve : T.carryOn}
        </button>
        {jailed && (
          <button
            type="button"
            data-testid="gta-break-out"
            onClick={onEscape}
            className="cursor-pointer rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-300"
          >
            {T.breakOut}
          </button>
        )}
      </div>
    </div>
  );
}
