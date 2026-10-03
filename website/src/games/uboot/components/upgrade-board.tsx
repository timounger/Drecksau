/**
 * Die Werkstatt: ein Baum aus Feldern, und am Feld steht, was es tut.
 *
 * @module
 * @remarks
 * Gebaut nach `game_instructions/UBoot/verbesserungen.png`: **der Baum füllt
 * das Blatt**, links oben führt der Weg zurück, rechts oben stehen die freien
 * Punkte und daneben der Knopf, der alles wieder herausholt. Keine Tafel an
 * der Seite mehr - was ein Feld bedeutet, steht in einer Sprechblase am Feld
 * selbst.
 *
 * **Einmal tippen zeigt, zweimal tippen baut ein.** Das ist der ganze Ablauf.
 * Ein Klick für beides wäre eine Falle: Was eine Stufe kostet, sieht man auf
 * dem Feld, was sie tut, braucht einen Satz - und wer stöbert, soll dabei
 * keine Punkte ausgeben. Zwei Klicks sind der kürzeste Weg, der beides kann.
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
import { ChartLife, SHOAL_SWIMMERS } from "@/games/uboot/components/chart-life";
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
};

/** Props of {@link UpgradeTools}. */
export type UpgradeToolsProps = {
  readonly profile: Profile;
  readonly onChange: (profile: Profile) => void;
};

/** Which field on the board is being looked at. */
type Picked = {
  readonly track: UpgradeId;
  /** Which step of it, counted from zero. */
  readonly step: number;
};

/** Ob eine Bahn ganz links, ganz rechts oder mittendrin steht. */
type Edge = "start" | "end" | null;

/** An eight-sided tile, the shape every such board has ever used. */
const OCTAGON =
  "[clip-path:polygon(28%_0,72%_0,100%_28%,100%_72%,72%_100%,28%_100%,0_72%,0_28%)]";

/**
 * Der Punktestand und der Knopf daneben - für die Kopfzeile des Blattes.
 *
 * @param props - der Spieler und wohin die Änderung geht
 * @returns die beiden Werkzeuge
 * @remarks
 * **Oben rechts, wo auch sonst die Werkzeuge eines Blattes liegen.** Die Zahl
 * und das Zurückholen gehören zusammen: Beides handelt von denselben Punkten,
 * und wer sieht, dass ihm welche fehlen, greift als Nächstes genau daneben.
 *
 * Keine Rückfrage vor dem Zurückholen: Es geht nichts verloren - jeder Punkt
 * kommt zurück und kann sofort wieder ausgegeben werden. Eine Frage stünde nur
 * dem im Weg, wofür der Knopf da ist, nämlich ein anderes Boot auszuprobieren.
 *
 * **Daneben steht "alles freischalten", aber nur, wenn es reicht.** Wer alles
 * bezahlen kann, soll nicht fünfzehnmal tippen müssen - und solange die Punkte
 * nicht für sämtliche fehlenden Stufen langen, wäre "alles" eine Behauptung,
 * nach der man hinterher nachsehen müsste.
 */
export function UpgradeTools({
  profile,
  onChange,
}: UpgradeToolsProps): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span
        data-testid="uboot-spare"
        className="flex items-center gap-1.5 rounded-full border-2 border-amber-700 bg-gradient-to-b from-amber-200 to-amber-400 px-3 py-1 text-amber-950 shadow"
      >
        <span aria-hidden="true">{"\u{1F48E}"}</span>
        <span className="text-lg leading-none font-extrabold">
          {free(profile)}
        </span>
        <span className="text-[11px] font-semibold">
          {UBOOT_TEXTS.pointsFree}
        </span>
      </span>
      {canBuyAll(profile) && (
        <button
          type="button"
          data-testid="uboot-buy-all"
          onClick={() => onChange(withAll(profile))}
          title={UBOOT_TEXTS.openAllHint}
          className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {UBOOT_TEXTS.buyAll} {"\u{1F48E}"} {restCost(profile)}
        </button>
      )}
      <button
        type="button"
        data-testid="uboot-reset"
        onClick={() => onChange(withStripped(profile))}
        title={UBOOT_TEXTS.resetHint}
        aria-label={UBOOT_TEXTS.reset}
        className="cursor-pointer rounded-lg border-2 border-amber-900/70 bg-gradient-to-b from-slate-600 to-slate-800 px-2.5 py-1 text-lg leading-none text-amber-100 hover:from-slate-500 hover:to-slate-700"
      >
        {"↺"}
      </button>
    </div>
  );
}

/**
 * Renders the workshop.
 *
 * @param props - the player and where changes go
 * @returns the workshop element
 */
export function UpgradeBoard({
  profile,
  onChange,
}: UpgradeBoardProps): ReactElement {
  const spare = free(profile);
  const [picked, setPicked] = useState<Picked | null>(null);

  /**
   * Was ein Tippen auf ein Feld bedeutet.
   *
   * @remarks
   * Dasselbe Feld ein zweites Mal, und es ist gekauft - aber nur, wenn es
   * wirklich dran und bezahlt ist. Sonst bleibt es beim Zeigen, und die
   * Sprechblase sagt, woran es liegt.
   */
  const tap = (track: UpgradeId, step: number, can: boolean) => {
    const again = picked?.track === track && picked.step === step;
    if (again && can) {
      onChange(withBought(profile, track));
    } else {
      setPicked({ track, step });
    }
  };

  return (
    // **Ein Klick daneben schließt die Blase.** Sie gehört zu einem Feld, und
    // wer woandershin fasst, meint sie nicht mehr. Die Felder selbst halten
    // ihren Klick auf (siehe {@link Tile}), sonst ginge er hier wieder auf.
    <div
      className="flex h-full flex-col"
      onClick={() => setPicked(null)}
      role="presentation"
    >
      {/* Der Baum: unten die Bahnen, darüber ihre Stufen. **Er rollt nicht** -
          eine Tafel, von der man die Hälfte erst herunterziehen muss, ist
          keine Übersicht. Deshalb sind die Felder eine Nummer kleiner,
          solange das Fenster schmal ist. */}
      <div className="relative flex flex-1 overflow-hidden rounded-2xl border-2 border-sky-900/60 bg-gradient-to-b from-sky-900 via-sky-950 to-slate-950 px-1 pt-2 pb-2 max-md:flex-none">
        {/* Hinter dem Baum zieht Wasser mit Bewegung darin vorbei - nur
            Schwärme, nichts, was einen anschaut. */}
        <ChartLife swimmers={SHOAL_SWIMMERS} />

        {/* Der Baum liegt darüber: Die Felder sind eigene Ebenen, der Fuß
            einer Bahn wäre sonst hinter der Leinwand. */}
        <div className="relative z-10 flex w-full items-end justify-around gap-1 max-md:gap-0">
          {UPGRADES.map((track, column) => (
            <Column
              key={track.id}
              track={track}
              edge={
                column === 0
                  ? "start"
                  : column === UPGRADES.length - 1
                    ? "end"
                    : null
              }
              level={profile.upgrades[track.id] ?? 0}
              spare={spare}
              picked={picked}
              onTap={tap}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Props of {@link Column}. */
type ColumnProps = {
  readonly track: Upgrade;
  /** Ob diese Bahn ganz außen steht - dann kippt die Sprechblase nach innen. */
  readonly edge: Edge;
  readonly level: number;
  readonly spare: number;
  readonly picked: Picked | null;
  readonly onTap: (track: UpgradeId, step: number, can: boolean) => void;
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
  edge,
  level,
  spare,
  picked,
  onTap,
}: ColumnProps): ReactElement {
  const steps = track.steps.map((step, index) => ({ step, index })).reverse();

  return (
    <div className="flex h-full flex-col items-center justify-end">
      {steps.map(({ step, index }) => (
        <div key={step.label} className="flex flex-col items-center">
          <Tile
            step={step}
            track={track}
            edge={edge}
            // Das oberste Feld einer Bahn kippt seine Blase nach unten: Über
            // ihm ist der Rand der Tafel, und eine abgeschnittene Erklärung
            // erklärt nichts.
            flip={index === track.steps.length - 1}
            index={index}
            level={level}
            spare={spare}
            chosen={picked?.track === track.id && picked.step === index}
            onTap={onTap}
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
  readonly edge: Edge;
  /** Ob die Blase nach unten statt nach oben aufgeht. */
  readonly flip: boolean;
  /** Which step this is, counted from zero. */
  readonly index: number;
  /** How far the track has been taken. */
  readonly level: number;
  readonly spare: number;
  readonly chosen: boolean;
  readonly onTap: (track: UpgradeId, step: number, can: boolean) => void;
};

/** One field of the board: had, next, or still out of reach. */
function Tile({
  step,
  track,
  edge,
  flip,
  index,
  level,
  spare,
  chosen,
  onTap,
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
    <span className="relative flex flex-col items-center">
      {chosen && (
        <Bubble
          step={step}
          track={track}
          edge={edge}
          flip={flip}
          had={had}
          next={next}
          can={can}
        />
      )}
      <button
        type="button"
        data-testid={`uboot-step-${track.id}-${index}`}
        onClick={(event) => {
          // Nicht bis zum Blatt durchlassen: Dort schließt jeder Klick die
          // Blase, und sie ginge im selben Augenblick wieder zu.
          event.stopPropagation();
          onTap(track.id, index, can);
        }}
        title={step.label}
        aria-label={`${track.name}: ${step.label}`}
        className={`relative h-14 w-14 cursor-pointer p-[3px] select-none lg:h-20 lg:w-20 ${OCTAGON} ${frame} ${
          chosen ? "ring-4 ring-emerald-300" : ""
        }`}
      >
        <span
          className={`flex h-full w-full flex-col items-center justify-center ${OCTAGON} ${face}`}
        >
          <span className={had || next ? "" : "opacity-40 grayscale"}>
            <UpgradeIcon
              id={track.id}
              step={index}
              className="h-6 w-6 lg:h-9 lg:w-9"
            />
          </span>
          <span
            className={`text-[9px] leading-tight font-bold lg:text-xs ${
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
    </span>
  );
}

/** Props of {@link Bubble}. */
type BubbleProps = {
  readonly step: Step;
  readonly track: Upgrade;
  readonly edge: Edge;
  readonly flip: boolean;
  /** Schon eingebaut, als Nächstes dran, und ob es bezahlt ist. */
  readonly had: boolean;
  readonly next: boolean;
  readonly can: boolean;
};

/**
 * Die Sprechblase über dem angetippten Feld.
 *
 * @param props - das Feld und wie es dasteht
 * @returns die Blase
 * @remarks
 * Name, Beschreibung, und eine letzte Zeile, die sagt, was ein zweites Tippen
 * bewirkt - oder warum es nichts bewirkt. **Am Feld und nicht an der Seite:**
 * Eine Erklärung, die drei Handbreit neben dem steht, was sie erklärt, liest
 * man beim dritten Mal nicht mehr.
 */
function Bubble({
  step,
  track,
  edge,
  flip,
  had,
  next,
  can,
}: BubbleProps): ReactElement {
  // **Am Rand kippt sie nach innen.** Eine Blase, die zur Hälfte neben dem
  // Blatt hängt, erklärt die Hälfte - und auf dem Telefon ist die äußerste
  // Bahn nur einen Daumen vom Rand entfernt.
  const where =
    edge === "start"
      ? "left-0"
      : edge === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";
  const point =
    edge === "start" ? "left-7" : edge === "end" ? "right-7" : "left-1/2 -ml-2";
  // Nach oben oder nach unten - und die Spitze sitzt jeweils auf der anderen
  // Seite der Blase.
  const side = flip ? "top-full mt-2" : "bottom-full mb-2";
  const nib = flip
    ? "bottom-full border-b-8 border-b-sky-200"
    : "top-full border-t-8 border-t-sky-200";
  const tail = had
    ? `✓ ${UBOOT_TEXTS.alreadyHad}`
    : can
      ? UBOOT_TEXTS.tapAgain
      : next
        ? UBOOT_TEXTS.tooDear
        : UBOOT_TEXTS.firstBelow;

  return (
    <span
      data-testid="uboot-bubble"
      // **Sie fängt keine Klicks ab.** Die Blase deckt die Nachbarfelder
      // halb zu; ein Klick darauf soll das Feld darunter treffen und nicht
      // ins Leere gehen.
      className={`pointer-events-none absolute z-20 w-56 rounded-xl border-2 border-sky-200 bg-white p-2 text-left shadow-xl max-md:w-44 dark:bg-zinc-100 ${where} ${side}`}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm leading-tight font-extrabold tracking-wide text-sky-800 uppercase">
          {step.label}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-amber-700">
          <span aria-hidden="true">{"\u{1F48E}"}</span>
          {step.cost}
        </span>
      </span>
      <span className="mt-1 block text-xs leading-snug text-zinc-700">
        {step.note}
      </span>
      <span className="mt-1 block text-[11px] leading-snug font-semibold text-zinc-500">
        {track.short} · {tail}
      </span>
      {/* Die Spitze der Blase, die auf das Feld darunter zeigt. */}
      <span
        aria-hidden="true"
        className={`absolute h-0 w-0 border-x-8 border-x-transparent ${nib} ${point}`}
      />
    </span>
  );
}

/**
 * The foot of a column: which category it is.
 *
 * @remarks
 * Symbol und Name, mehr nicht. Was das Boot in dieser Bahn gerade hat, steht
 * in der Sprechblase, sobald man ein Feld antippt - hier unten wäre es eine
 * dritte Zeile in einer Spalte von achtzig Pixeln, also eine, die niemand
 * liest.
 */
function Base({ track }: { readonly track: Upgrade }): ReactElement {
  return (
    <div
      title={`${track.name} - ${track.hint}`}
      className="mt-1 flex w-14 flex-col items-center gap-0.5 rounded-lg border-2 border-slate-500 bg-gradient-to-b from-slate-600 to-slate-800 px-1 py-1 text-center lg:w-20 lg:py-1.5"
    >
      <UpgradeIcon id={track.id} step={0} className="h-4 w-4 lg:h-6 lg:w-6" />
      <span className="text-[8px] leading-tight font-bold text-amber-100 lg:text-[10px]">
        {track.short}
      </span>
    </div>
  );
}
