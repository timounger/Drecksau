/**
 * Die Auszeichnungen, alle nebeneinander - erreichte leuchten, der Rest wartet.
 *
 * @module
 * @remarks
 * Gebaut nach `game_instructions/UBoot/erfolge.png`: **breite Karten, drei
 * Reihen, und gerollt wird nach rechts.** Jede Karte ist gleich groß - links
 * das Zeichen, rechts der Name und der Text, unten ein Balken, der sagt, wie
 * weit man ist. Gleich große Karten sind kein Schönheitsfehler, sondern der
 * Sinn der Sache: Eine Tafel, auf der die geschafften Felder größer sind als
 * die offenen, liest sich als Rangliste und nicht als Ziel.
 *
 * **Auch das, was man noch nicht hat, steht da.** Eine Tafel, die nur zeigt,
 * was schon geschafft ist, ist eine Liste; eine, die alles zeigt, ist ein
 * Ziel. Deshalb steht auf jeder grauen Karte, wofür es die Auszeichnung gibt.
 *
 * Was man dort gesehen hat, steht aber **erst da, wenn sie leuchtet**: Die
 * zehn Landmarken sagen vorher nur, in welchem Gewässer sie stehen, und
 * erzählen hinterher, was man dort gesehen hat. Eine Entdeckung, die auf der
 * Tafel schon beschrieben ist, ist keine mehr.
 */
"use client";

import { useRef, type PointerEvent, type ReactElement } from "react";
import {
  AWARDS,
  earnedCount,
  isEarned,
  progressOf,
  type Award,
} from "@/games/uboot/settings/awards";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import type { Profile } from "@/games/uboot/settings/profile";

/** Props of {@link AwardBoard}. */
export type AwardBoardProps = {
  readonly profile: Profile;
};

/** Wie breit ein Balken voll ist, in Prozent. */
const FULL = 100;

/**
 * Wie hoch der Saum am unteren Rand ist, den wir nicht anfassen, in Pixeln.
 *
 * @remarks
 * Dort liegt die Rollleiste. Nimmt sie eigenen Platz ein, rechnen wir mit
 * ihrer wirklichen Höhe; **schwebt sie über dem Inhalt** - wie auf dem Mac,
 * auf dem Telefon und in neueren Browsern -, ist diese Höhe null, und ohne
 * einen festen Saum führen wir und der Browser dieselbe Tafel in zwei
 * Richtungen. Vierzehn Pixel sind ungefähr eine Leiste und kosten unten nur
 * den Rand, der ohnehin Luft ist.
 */
const BAR = 14;

/**
 * Renders the awards.
 *
 * @param props - der Spieler
 * @returns die Tafel
 */
export function AwardBoard({ profile }: AwardBoardProps): ReactElement {
  const got = earnedCount(profile);
  const stripRef = useRef<HTMLDivElement | null>(null);
  /** Wo der Zeiger aufgesetzt hat und wie weit der Streifen da stand. */
  const drag = useRef({ on: false, from: 0, at: 0 });

  /**
   * Mit der Maus anfassen und ziehen.
   *
   * @remarks
   * **Auf dem Telefon wischt man ohnehin** - dafür ist der Streifen gebaut.
   * Am Rechner gäbe es sonst nur die Rollleiste ganz unten, und das ist eine
   * Leiste, die man mit dem Zeiger suchen muss, statt die Tafel einfach
   * weiterzuschieben. Finger und Stift bleiben außen vor: Dort macht der
   * Browser das Wischen schon selbst, und zwei Hände am selben Streifen
   * ruckeln.
   */
  const grab = (event: PointerEvent<HTMLDivElement>) => {
    const strip = stripRef.current;
    // **Die Rollleiste gehört dem Browser.** Sie liegt unterhalb der sichtbaren
    // Höhe des Streifens; wer dort zufasst, zieht am Griff und erwartet dessen
    // gewohnte Richtung. Fassten wir mit an, zögen zwei an derselben Tafel -
    // und unsere Richtung gewänne, weil wir in jedem Bild neu setzen.
    const box = strip?.getBoundingClientRect();
    const high = Math.max(
      (strip?.offsetHeight ?? 0) - (strip?.clientHeight ?? 0),
      BAR,
    );
    const bar = box !== undefined && event.clientY > box.bottom - high;
    if (strip !== null && event.pointerType === "mouse" && !bar) {
      drag.current = { on: true, from: event.clientX, at: strip.scrollLeft };
      strip.setPointerCapture(event.pointerId);
    }
  };

  /**
   * Ziehen verschiebt die **Tafel**, nicht den Blick.
   *
   * @remarks
   * Die Karten folgen der Hand wie Papier unter dem Finger: nach links
   * gezogen laufen sie nach links, und von rechts kommen die nächsten
   * herein. **Die Rollleiste macht es andersherum**, und das ist kein
   * Widerspruch, sondern der Unterschied zwischen einem Griff und dem Blatt
   * selbst - wer am Griff zieht, verschiebt den Ausschnitt; wer aufs Blatt
   * fasst, verschiebt das Blatt.
   */
  const pull = (event: PointerEvent<HTMLDivElement>) => {
    const strip = stripRef.current;
    if (strip !== null && drag.current.on) {
      strip.scrollLeft = drag.current.at - (event.clientX - drag.current.from);
    }
  };

  const drop = (event: PointerEvent<HTMLDivElement>) => {
    const strip = stripRef.current;
    if (strip !== null && drag.current.on) {
      drag.current = { ...drag.current, on: false };
      strip.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p
        data-testid="uboot-awards-count"
        className="text-sm text-zinc-600 dark:text-zinc-400"
      >
        {UBOOT_TEXTS.awardsCount(got, AWARDS.length)}
      </p>
      {/* Drei Reihen, die nach rechts weiterlaufen: So bleibt jede Karte so
          groß wie die nächste, und die Tafel wächst in die Richtung, in die
          ein Daumen ohnehin wischt. Angefasst wird sie auch mit der Maus -
          und **nichts darauf lässt sich markieren**, sonst zöge man beim
          Schieben den halben Text blau. */}
      <div
        ref={stripRef}
        onPointerDown={grab}
        onPointerMove={pull}
        onPointerUp={drop}
        onPointerCancel={drop}
        className="min-h-0 flex-1 cursor-grab touch-pan-x overflow-x-auto overflow-y-hidden pb-2 select-none active:cursor-grabbing"
      >
        {/* Die Höhe ist gedeckelt: Auf dem Telefon nimmt das Blatt den ganzen
            Bildschirm, und drei Karten über neunhundert Pixel wären drei
            Plakate. So ist eine Karte überall ungefähr gleich groß. */}
        <div className="grid h-full max-h-[27rem] grid-flow-col grid-rows-3 gap-3 [grid-auto-columns:19rem] max-md:[grid-auto-columns:16rem]">
          {AWARDS.map((award) => (
            <Card key={award.id} award={award} profile={profile} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Props of {@link Card}. */
type CardProps = {
  readonly award: Award;
  readonly profile: Profile;
};

/** Eine Karte: Zeichen, Name, Text und ein Balken darunter. */
function Card({ award, profile }: CardProps): ReactElement {
  const lit = isEarned(profile, award);
  const step = progressOf(profile, award);
  const share = step.all === 0 ? 0 : (step.done / step.all) * FULL;

  return (
    <article
      data-testid={`uboot-award-${award.id}`}
      data-earned={lit}
      className={`flex h-full flex-col justify-between gap-1 overflow-hidden rounded-xl border-2 p-2 ${
        lit
          ? "border-amber-400 bg-gradient-to-b from-amber-100 to-amber-300 text-amber-950"
          : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      <div className="flex min-h-0 flex-1 gap-2">
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-sky-700 to-sky-950 text-3xl ${
            lit ? "" : "opacity-40 grayscale"
          }`}
        >
          {award.icon}
        </span>
        <div className="flex min-w-0 flex-col">
          <h3
            className={`text-sm leading-tight font-bold tracking-wide uppercase ${
              lit ? "text-amber-900" : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {award.name}
          </h3>
          {/* Vorher die Bedingung, hinterher die Entdeckung - beschnitten auf
              drei Zeilen, auf schmalen Fenstern auf vier: Dort ist eine Zeile
              kürzer, und die Karte hat die Höhe dafür. Beschnitten wird
              überhaupt, damit jede Karte gleich groß bleibt. */}
          <p className="line-clamp-4 text-xs leading-snug lg:line-clamp-3">
            {lit && award.note !== undefined ? award.note : award.hint}
          </p>
        </div>
      </div>

      {lit ? (
        <p className="rounded-lg bg-emerald-600 px-2 py-1 text-center text-xs font-bold text-white">
          {"✓"} {UBOOT_TEXTS.awardGot}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="relative h-4 flex-1 overflow-hidden rounded bg-zinc-300 dark:bg-zinc-800">
            <span
              className="absolute inset-y-0 left-0 rounded bg-sky-500/70"
              style={{ width: `${share}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
              {step.done} / {step.all}
            </span>
          </span>
          <span className="shrink-0 text-[10px] font-semibold">
            {UBOOT_TEXTS.awardOpen}
          </span>
        </div>
      )}
    </article>
  );
}
