/**
 * The screen you play GTA on: the canvas, the heads-up display, the overlays.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useRef, useState, type ReactElement } from "react";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";
import { GameHeader } from "@/components/game-header";
import { useGtaGame, type Heads } from "@/games/gta/hooks/use-gta-game";
import { MAX_SAVES, type SaveSlot } from "@/games/gta/storage/saves";
import { GTA_RULES } from "@/games/gta/i18n/rules";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";
import { CATCHES, MAX_STARS } from "@/games/gta/engine/types";
import { VIEW_HEIGHT, VIEW_WIDTH } from "@/games/gta/components/projection";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** Which mouse button puts a charge down. */
const RIGHT_BUTTON = 2;

/** The look of a link in the header. */
const LINK =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the game.
 *
 * @returns the screen
 */
export function GtaScreen(): ReactElement {
  const {
    heads,
    attach,
    onPointer,
    onPress,
    onFire,
    onPlant,
    god,
    toggleGod,
    restart,
    carryOn,
    escape,
    saves,
    save,
    load,
    forget,
  } = useGtaGame();

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

      <HeadsUp heads={heads} />

      <div
        ref={stage}
        className="game-fullscreen relative overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-700"
      >
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
              onPlant();
            } else {
              onFire(true);
            }
          }}
          onPointerUp={() => onFire(false)}
          onPointerLeave={() => onFire(false)}
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
              <b>Mausrad</b>: Waffe wechseln. Zu Beginn nur die Faust - alles
              andere liegt in der Stadt herum
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
    </div>
  );
}

/** Money, respect, stars, health, and what the job wants. */
function HeadsUp({ heads }: { readonly heads: Heads }): ReactElement {
  return (
    <div
      data-testid="gta-heads"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Money, health and the weapon are drawn in the corner of the picture
          itself - see drawStatus. What is left here is what does not fit in a
          corner: the search, the seat, the job and the quarters. */}
      <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
        {T.respect(heads.respect)}
      </span>
      <span className="flex items-center gap-1">
        <span className="text-zinc-500 dark:text-zinc-400">{T.wanted}</span>
        <span data-testid="gta-stars" className="tracking-tight">
          {Array.from({ length: MAX_STARS }, (unused, at) =>
            at < heads.stars ? "★" : "☆",
          ).join("")}
        </span>
      </span>
      <span className="text-zinc-500 dark:text-zinc-400">
        {heads.inCar ? T.driving : T.onFoot}
      </span>
      {heads.crew > 0 && (
        <span
          data-testid="gta-crew"
          className="font-semibold text-lime-700 dark:text-lime-300"
        >
          {T.crew(heads.crew)}
        </span>
      )}
      {heads.loot > 0 && (
        <span
          data-testid="gta-bag"
          className="font-semibold text-rose-700 dark:text-rose-300"
        >
          {T.loot(heads.loot)}
        </span>
      )}
      {heads.escape !== null && (
        <span
          data-testid="gta-escape"
          className="flex flex-wrap items-center gap-2 text-amber-700 dark:text-amber-300"
        >
          <b>{T.escapeTitle}:</b>
          <span>{heads.escape.task}</span>
          <span>{T.escapeCaught(CATCHES - heads.escape.caught)}</span>
          {heads.escape.mates > 0 && (
            <span>{T.escapeMates(heads.escape.mates)}</span>
          )}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2">
        <span data-testid="gta-job" className="font-semibold">
          {heads.jobText === "" ? T.noJob : heads.jobText}
        </span>
        {heads.jobLeft !== null && (
          <span className="tabular-nums text-amber-700 dark:text-amber-300">
            {T.jobLeft(heads.jobLeft)}
          </span>
        )}
      </span>
    </div>
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
