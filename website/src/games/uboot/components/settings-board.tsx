/**
 * Die Einstellungen hinter dem Zahnrad: Schwierigkeit, Lautstärke, Spielstand.
 *
 * @module
 * @remarks
 * Vier Dinge, die nichts miteinander zu tun haben, außer dass man sie selten
 * braucht und dann sofort finden will - deshalb stehen sie hinter **einem**
 * Zahnrad an der Stelle, an der jedes Spiel sein Zahnrad hat, und nicht als
 * drei Knöpfe in der Leiste.
 *
 * Die beiden gefährlichen fragen nach, die harmlosen nicht: Ein verstellter
 * Regler ist in zwei Sekunden zurückgedreht, ein gelöschter Spielstand nicht.
 */
"use client";

import { useState, type ReactElement } from "react";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import { musicVolume, soundVolume } from "@/games/uboot/settings/volume";
import { useVolumes } from "@/games/uboot/hooks/use-volumes";
import {
  NEW_PROFILE,
  withEverythingOpen,
  withGrade,
  type Profile,
} from "@/games/uboot/settings/profile";
import { GRADES } from "@/games/uboot/engine/grades";

/** Props of {@link SettingsBoard}. */
export type SettingsBoardProps = {
  readonly profile: Profile;
  readonly onChange: (profile: Profile) => void;
};

/** Wie fein die Regler laufen. */
const STEPS = 100;

/**
 * Renders the settings.
 *
 * @param props - der Spieler und wohin Änderungen gehen
 * @returns das Blatt
 */
export function SettingsBoard({
  profile,
  onChange,
}: SettingsBoardProps): ReactElement {
  const { music, sound } = useVolumes();
  const [asking, setAsking] = useState<"wipe" | "open" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-bold">{UBOOT_TEXTS.gradeTitle}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((grade, index) => {
            const on = index === profile.grade;
            return (
              <button
                key={grade.id}
                type="button"
                data-testid={`uboot-grade-${grade.id}`}
                data-on={on}
                onClick={() => onChange(withGrade(profile, index))}
                className={`flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-2 text-left ${
                  on
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950"
                    : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="text-sm font-bold">{grade.name}</span>
                <span className="text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  {grade.note}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {UBOOT_TEXTS.gradeHint}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <Knob
          label={UBOOT_TEXTS.musicVolume}
          testId="uboot-music"
          value={music}
          onChange={(next) => musicVolume.save(next)}
        />
        <Knob
          label={UBOOT_TEXTS.soundVolume}
          testId="uboot-sound"
          value={sound}
          onChange={(next) => soundVolume.save(next)}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {UBOOT_TEXTS.volumeHint}
        </p>
      </div>

      <Danger
        title={UBOOT_TEXTS.wipeTitle}
        hint={UBOOT_TEXTS.wipeHint}
        button={UBOOT_TEXTS.wipe}
        testId="uboot-wipe"
        asking={asking === "wipe"}
        onAsk={() => setAsking("wipe")}
        onNo={() => setAsking(null)}
        onYes={() => {
          onChange(NEW_PROFILE);
          setAsking(null);
        }}
      />

      <Danger
        title={UBOOT_TEXTS.openAllTitle}
        hint={UBOOT_TEXTS.openAllHint}
        button={UBOOT_TEXTS.openAll}
        testId="uboot-open-all"
        asking={asking === "open"}
        onAsk={() => setAsking("open")}
        onNo={() => setAsking(null)}
        onYes={() => {
          onChange(withEverythingOpen(profile));
          setAsking(null);
        }}
      />
    </div>
  );
}

/** Props of {@link Knob}. */
type KnobProps = {
  readonly label: string;
  readonly testId: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
};

/** Ein Regler mit seinem Prozentwert daneben. */
function Knob({ label, testId, value, onChange }: KnobProps): ReactElement {
  const percent = Math.round(value * STEPS);
  return (
    <label className="flex items-center gap-3 text-sm">
      <span aria-hidden="true" className="text-lg">
        {value === 0 ? "\u{1F507}" : "\u{1F50A}"}
      </span>
      <span className="w-40 font-medium">{label}</span>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={percent}
        data-testid={testId}
        onChange={(event) => onChange(Number(event.target.value) / STEPS)}
        className="h-2 flex-1 cursor-pointer accent-sky-600"
      />
      <span className="w-12 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
        {percent} %
      </span>
    </label>
  );
}

/** Props of {@link Danger}. */
type DangerProps = {
  readonly title: string;
  readonly hint: string;
  readonly button: string;
  readonly testId: string;
  readonly asking: boolean;
  readonly onAsk: () => void;
  readonly onNo: () => void;
  readonly onYes: () => void;
};

/** Ein Knopf, der erst nachfragt. */
function Danger({
  title,
  hint,
  button,
  testId,
  asking,
  onAsk,
  onNo,
  onYes,
}: DangerProps): ReactElement {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{hint}</p>
      {asking ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid={`${testId}-yes`}
            onClick={onYes}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            {UBOOT_TEXTS.sure}
          </button>
          <button
            type="button"
            onClick={onNo}
            className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {UBOOT_TEXTS.resetNo}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid={testId}
          onClick={onAsk}
          className="mt-3 cursor-pointer rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
        >
          {button}
        </button>
      )}
    </div>
  );
}
