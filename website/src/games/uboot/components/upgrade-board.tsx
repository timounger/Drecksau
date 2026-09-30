/**
 * Die Werkstatt: eine Tafel voller Felder, daneben steht, was eines davon tut.
 *
 * @module
 * @remarks
 * Gebaut nach der Vorlage, die klassische Ausbaubäume benutzen: **unten die
 * Kategorien, darüber die Stufen, dazwischen Verbindungen**, rechts der
 * Punktestand und eine Tafel, die das erklärt, was man gerade angetippt hat.
 * Unten rechts die beiden einzigen Knöpfe, die es braucht - alles zurückholen
 * und fertig.
 *
 * Der Ablauf ist deshalb **antippen, dann freischalten** und nicht ein Klick
 * für beides: Was eine Stufe kostet, ist auf dem Feld zu sehen, was sie tut,
 * braucht einen Satz - und einen Satz liest niemand auf einem Feld von
 * siebzig Pixeln. Nebenbei kann man damit im Baum stöbern, ohne aus Versehen
 * Punkte auszugeben.
 *
 * Das Blatt hat **keinen eigenen Spielstand**: Profil und Änderung kommen von
 * oben herein. Damit gibt es nur eine Wahrheit darüber, was gekauft ist, und
 * die Seekarte im selben Fenster zeigt den neuen Punktestand, noch während man
 * kauft.
 */
"use client";

import { useState, type ReactElement } from "react";
import {
  UPGRADES,
  type Step,
  type Upgrade,
  type UpgradeId,
} from "@/games/uboot/engine/upgrades";
import { UpgradeIcon } from "@/games/uboot/components/upgrade-icons";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import {
  canBuyAll,
  free,
  restCost,
  withAll,
  withBought,
  withStripped,
  type Profile,
} from "@/games/uboot/settings/profile";

/** Props of {@link UpgradeBoard}. */
export type UpgradeBoardProps = {
  readonly profile: Profile;
  /** Hands the changed profile back up - saving is the caller's business. */
  readonly onChange: (profile: Profile) => void;
  /** The tick in the corner: done here, back to the chart. */
  readonly onDone: () => void;
};

/** Which field on the board is being looked at. */
type Picked = {
  readonly track: UpgradeId;
  /** Which step of it, counted from zero. */
  readonly step: number;
};

/** An eight-sided tile, the shape every such board has ever used. */
const OCTAGON =
  "[clip-path:polygon(28%_0,72%_0,100%_28%,100%_72%,72%_100%,28%_100%,0_72%,0_28%)]";

/**
 * Renders the workshop.
 *
 * @param props - the player, where changes go and the way out
 * @returns the workshop element
 */
export function UpgradeBoard({
  profile,
  onChange,
  onDone,
}: UpgradeBoardProps): ReactElement {
  const spare = free(profile);
  const [picked, setPicked] = useState<Picked | null>(null);

  return (
    <div className="flex h-full gap-3">
      {/* The board itself: a steel plate with the tiles riveted onto it. */}
      <div className="flex flex-1 items-end justify-around gap-1 rounded-xl border-4 border-amber-900/70 bg-gradient-to-b from-slate-700 to-slate-900 p-2 shadow-inner">
        {UPGRADES.map((track) => (
          <Column
            key={track.id}
            track={track}
            level={profile.upgrades[track.id] ?? 0}
            spare={spare}
            picked={picked}
            onPick={setPicked}
            onTake={() => onChange(withBought(profile, track.id))}
          />
        ))}
      </div>

      <div className="flex w-[15.5rem] shrink-0 flex-col gap-2">
        <div
          data-testid="uboot-spare"
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-amber-700 bg-gradient-to-b from-amber-200 to-amber-400 px-3 py-1.5 text-amber-950 shadow"
        >
          <span aria-hidden="true" className="text-lg">
            {"\u{1F48E}"}
          </span>
          <span className="text-xl font-extrabold">{spare}</span>
          <span className="text-xs font-semibold">
            {UBOOT_TEXTS.pointsFree}
          </span>
        </div>

        <Plate
          picked={picked}
          profile={profile}
          spare={spare}
          onBuy={(track) =>
            onChange(
              track === null ? withAll(profile) : withBought(profile, track),
            )
          }
        />

        <div className="flex gap-2">
          {/* No "are you sure": nothing is lost by it - every point comes
              straight back and can be spent again. A question here would only
              be in the way of the thing it is for, which is trying another
              boat. */}
          <button
            type="button"
            data-testid="uboot-reset"
            onClick={() => onChange(withStripped(profile))}
            title={UBOOT_TEXTS.resetHint}
            aria-label={UBOOT_TEXTS.reset}
            className="flex-1 cursor-pointer rounded-lg border-2 border-amber-900/70 bg-gradient-to-b from-slate-600 to-slate-800 py-2 text-xl text-amber-100 hover:from-slate-500 hover:to-slate-700"
          >
            {"↺"}
          </button>
          <button
            type="button"
            data-testid="uboot-done"
            onClick={onDone}
            title={UBOOT_TEXTS.done}
            aria-label={UBOOT_TEXTS.done}
            className="flex-1 cursor-pointer rounded-lg border-2 border-amber-900/70 bg-gradient-to-b from-emerald-600 to-emerald-800 py-2 text-xl text-white hover:from-emerald-500 hover:to-emerald-700"
          >
            {"✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Props of {@link Column}. */
type ColumnProps = {
  readonly track: Upgrade;
  readonly level: number;
  readonly spare: number;
  readonly picked: Picked | null;
  readonly onPick: (picked: Picked) => void;
  readonly onTake: () => void;
};

/**
 * One track, growing upwards from its category.
 *
 * @remarks
 * Bottom aligned and every tile the same size, so a short track simply has a
 * low head. Stretching each column to fill the board would make two steps look
 * like a bigger job than four.
 */
function Column({
  track,
  level,
  spare,
  picked,
  onPick,
  onTake,
}: ColumnProps): ReactElement {
  const steps = track.steps.map((step, index) => ({ step, index })).reverse();

  return (
    <div className="flex h-full flex-col items-center justify-end">
      {steps.map(({ step, index }) => (
        <div key={step.label} className="flex flex-col items-center">
          <Tile
            step={step}
            track={track}
            index={index}
            level={level}
            spare={spare}
            chosen={picked?.track === track.id && picked.step === index}
            onPick={() => onPick({ track: track.id, step: index })}
            onTake={onTake}
          />
          <Wire lit={index < level} />
        </div>
      ))}
      <Base track={track} />
    </div>
  );
}

/** The bit of cable between two fields. */
function Wire({ lit }: { readonly lit: boolean }): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`h-2.5 w-1.5 ${lit ? "bg-amber-400" : "bg-slate-600"}`}
    />
  );
}

/** Props of {@link Tile}. */
type TileProps = {
  readonly step: Step;
  readonly track: Upgrade;
  /** Which step this is, counted from zero. */
  readonly index: number;
  /** How far the track has been taken. */
  readonly level: number;
  readonly spare: number;
  readonly chosen: boolean;
  readonly onPick: () => void;
  /** Two clicks on a field that may be taken take it. */
  readonly onTake: () => void;
};

/** One field of the board: had, next, or still out of reach. */
function Tile({
  step,
  track,
  index,
  level,
  spare,
  chosen,
  onPick,
  onTake,
}: TileProps): ReactElement {
  const had = index < level;
  const next = index === level;
  const can = next && step.cost <= spare;
  // Messing für alles, was man hat oder haben kann, Stahl für den Rest - und
  // grün ist ausschließlich das, worauf man gerade getippt hat. Wäre auch das
  // Bezahlbare grün, könnte man das eine vom anderen nicht unterscheiden.
  const frame = had
    ? "bg-amber-400"
    : can
      ? "bg-amber-300"
      : next
        ? "bg-amber-800/70"
        : "bg-slate-600";
  const face = had
    ? "bg-gradient-to-b from-amber-100 to-amber-300"
    : can
      ? "bg-gradient-to-b from-white to-slate-300"
      : next
        ? "bg-gradient-to-b from-slate-500 to-slate-700"
        : "bg-gradient-to-b from-slate-700 to-slate-800";

  return (
    <button
      type="button"
      data-testid={`uboot-step-${track.id}-${index}`}
      onClick={onPick}
      // Nur das Feld, das wirklich als nächstes dran und bezahlbar ist, kauft
      // sich per Doppelklick. Sonst würde ein Doppelklick irgendwo oben im
      // Baum die unterste Stufe kaufen - gekauft wird ja immer die nächste.
      onDoubleClick={can ? onTake : undefined}
      title={step.label}
      aria-label={`${track.name}: ${step.label}`}
      className={`relative h-20 w-20 cursor-pointer p-[3px] select-none ${OCTAGON} ${frame} ${
        chosen ? "ring-4 ring-emerald-300" : ""
      }`}
    >
      <span
        className={`flex h-full w-full flex-col items-center justify-center ${OCTAGON} ${face}`}
      >
        <span className={had || next ? "" : "opacity-40 grayscale"}>
          <UpgradeIcon id={track.id} step={index} className="h-9 w-9" />
        </span>
        <span
          className={`text-xs leading-tight font-bold ${
            had
              ? "text-amber-800"
              : can
                ? "text-slate-800"
                : next
                  ? "text-slate-200"
                  : "text-slate-400"
          }`}
        >
          {had ? "✓" : step.cost}
        </span>
      </span>
    </button>
  );
}

/**
 * The foot of a column: which category it is.
 *
 * @remarks
 * Symbol und Name, mehr nicht. Was das Boot in dieser Bahn gerade hat, steht
 * auf der Tafel daneben, sobald man ein Feld antippt - hier unten wäre es eine
 * dritte Zeile in einer Spalte von achtzig Pixeln, also eine, die niemand
 * liest.
 */
function Base({ track }: { readonly track: Upgrade }): ReactElement {
  return (
    <div
      title={`${track.name} - ${track.hint}`}
      className="mt-1 flex w-20 flex-col items-center gap-0.5 rounded-lg border-2 border-slate-500 bg-gradient-to-b from-slate-600 to-slate-800 px-1 py-1.5 text-center"
    >
      <UpgradeIcon id={track.id} step={0} className="h-6 w-6" />
      <span className="text-[10px] leading-tight font-bold text-amber-100">
        {track.short}
      </span>
    </div>
  );
}

/** Props of {@link Plate}. */
type PlateProps = {
  readonly picked: Picked | null;
  readonly profile: Profile;
  readonly spare: number;
  /** Eine Bahn - oder null für alles auf einmal. */
  readonly onBuy: (track: UpgradeId | null) => void;
};

/**
 * Die Tafel neben dem Baum: was das angetippte Feld ist und was es tut.
 *
 * @param props - what is picked, and what may be done with it
 * @returns the plate
 */
function Plate({ picked, profile, spare, onBuy }: PlateProps): ReactElement {
  const track = UPGRADES.find((one) => one.id === picked?.track);
  const step =
    track !== undefined && picked !== null
      ? track.steps[picked.step]
      : undefined;
  let body: ReactElement;

  if (track === undefined || step === undefined || picked === null) {
    // **Wer alles bezahlen kann, soll nicht fünfzehnmal klicken müssen.**
    // Der Knopf erscheint nur, wenn die freien Punkte für sämtliche fehlenden
    // Stufen reichen - sonst wäre "alles" eine Behauptung, und man müsste
    // hinterher nachsehen, was davon wirklich eingebaut wurde.
    body = (
      <div className="m-auto flex flex-col items-center gap-3 text-center">
        <p className="max-w-[12rem] text-sm text-slate-500 dark:text-slate-400">
          {UBOOT_TEXTS.pickOne}
        </p>
        {canBuyAll(profile) && (
          <button
            type="button"
            data-testid="uboot-buy-all"
            onClick={() => onBuy(null)}
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            {UBOOT_TEXTS.buyAll} {"\u{1F48E}"} {restCost(profile)}
          </button>
        )}
      </div>
    );
  } else {
    const level = profile.upgrades[track.id] ?? 0;
    const had = picked.step < level;
    const next = picked.step === level;
    const can = next && step.cost <= spare;
    body = (
      <>
        <div className="flex items-center gap-2">
          <UpgradeIcon id={track.id} step={picked.step} className="h-10 w-10" />
          <span className="ml-auto flex items-center gap-1 text-sm font-bold text-amber-700 dark:text-amber-300">
            <span aria-hidden="true">{"\u{1F48E}"}</span>
            {step.cost}
          </span>
        </div>
        <p className="text-base leading-tight font-extrabold text-sky-800 dark:text-sky-300">
          {step.label}
        </p>
        <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-400">
          {step.note}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold">{UBOOT_TEXTS.nowHas}</span>{" "}
          {level > 0 ? track.steps[level - 1].label : track.base}
        </p>
        <div className="mt-auto">
          {had && (
            <p className="rounded-lg bg-emerald-100 px-3 py-1.5 text-center text-sm font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              {"✓"} {UBOOT_TEXTS.alreadyHad}
            </p>
          )}
          {!had && next && can && (
            // **Zwei Wege zum selben Einbau.** Der Knopf ist der, den man
            // findet, ohne ihn zu kennen; der Doppelklick ist der, den man
            // nimmt, wenn man den Baum schon kennt und zügig ausbauen will.
            <>
              <button
                type="button"
                data-testid="uboot-buy"
                onClick={() => onBuy(track.id)}
                className="w-full cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {UBOOT_TEXTS.install} {"\u{1F48E}"} {step.cost}
              </button>
              <p className="mt-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                {UBOOT_TEXTS.orDouble}
              </p>
            </>
          )}
          {!had && next && !can && (
            <p className="rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              {UBOOT_TEXTS.missing(step.cost - spare)}
            </p>
          )}
          {!had && !next && (
            <p className="rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              {UBOOT_TEXTS.firstBelow}
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-lg border-2 border-amber-700/60 bg-amber-50 p-3 shadow-inner dark:bg-zinc-900">
      {body}
    </div>
  );
}
