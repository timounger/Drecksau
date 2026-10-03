/**
 * Was man sieht, bevor man ablegt: das Gewässer, die Liste, der Knopf.
 *
 * @module
 * @remarks
 * Die Anordnung kommt aus der Vorlage, die Farben aus dem Wasser: **links,
 * was es ist** - ein Blick durchs Bullauge auf das Gewässer und darunter die
 * drei besten Zeiten -, **rechts, was man damit tut** - der Text zur Karte,
 * die eigene Bestmarke, die Schwierigkeit und der Knopf.
 *
 * Der Blick durchs Bullauge ist kein gemaltes Bild, sondern **ein Bild des
 * Spiels**: Derselbe Zeichner, der den Tauchgang zeichnet, malt hier den
 * ersten Augenblick davon. Damit kann die Vorschau nie etwas anderes zeigen
 * als das, was dann wirklich kommt - und sie ändert sich mit der
 * Schwierigkeit, weil sich das Gewässer mit ihr ändert.
 */
"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  CANVAS_H,
  CANVAS_W,
  draw,
  type Scene,
} from "@/games/uboot/components/render";
import { drawBeast } from "@/games/uboot/components/creatures";
import {
  Leaderboard,
  asClock,
  boardFor,
} from "@/games/uboot/components/leaderboard";
import { BREEDS } from "@/games/uboot/engine/beasts";
import { courseFor, startDive } from "@/games/uboot/engine/setup";
import { cellAt, type Course } from "@/games/uboot/engine/course";
import { LEVELS, LEVEL_COUNT, darkness } from "@/games/uboot/engine/levels";
import { GRADES, gradeAt } from "@/games/uboot/engine/grades";
import {
  CELL,
  ROWS,
  SURFACE,
  type Beast,
  type BeastKind,
} from "@/games/uboot/engine/types";
import {
  bestOf as bestGrade,
  gearOf,
  type Profile,
} from "@/games/uboot/settings/profile";
import { bestOf, loadScores, type Score } from "@/online/leaderboard";
import { loadPlayerName } from "@/online/player-name";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";

/**
 * Wie groß das Bullauge ist, wie weit es heranholt und wo es hinschaut.
 *
 * @remarks
 * `into` ist der Anteil des Kurses, an dem die Vorschau steht, wenn nichts
 * Auffälliges näher liegt: ein Stück hinein und nicht ganz am Anfang. Die
 * ersten Meter jedes Gewässers sind absichtlich leer - man soll die Hände an
 * den Tasten finden können -, und ein Vorschaubild von leerem Wasser sagt
 * nichts.
 */
const PORT = {
  size: 250,
  zoom: 0.5,
  into: 0.25,
  ahead: 150,
  back: 120,
  /** Wie viele Leinwände weit die Tiefe hinter dem Bild gefüllt wird. */
  fill: 3,
} as const;

/** Wie groß ein Tier in der Zeile "was dich erwartet" gezeichnet wird. */
const CHIP = { box: 34, scale: 0.62 } as const;

/** Wie viele Plätze hier stehen - der Rest steht auf der vollen Liste. */
const PODIUM = 3;

/** Die Farben der drei Pokale. */
const CUPS = ["#f6c343", "#cfd6de", "#cd7f32"] as const;

/** Props of {@link CourseBrief}. */
export type CourseBriefProps = {
  /** Welches Gewässer, von null an. */
  readonly level: number;
  readonly profile: Profile;
  /** Eine andere Schwierigkeit wählen. */
  readonly onGrade: (grade: number) => void;
  /** Ablegen. */
  readonly onStart: () => void;
  /** Zurück zur Seekarte. */
  readonly onClose: () => void;
};

/**
 * Das Blatt vor dem Tauchgang.
 *
 * @param props - das Gewässer, der Spieler und was die Knöpfe tun
 * @returns das Blatt
 */
export function CourseBrief({
  level,
  profile,
  onGrade,
  onStart,
  onClose,
}: CourseBriefProps): ReactElement {
  const course = LEVELS[level];
  const best = bestGrade(profile, level);
  const [full, setFull] = useState(false);

  return (
    <div
      data-testid="uboot-brief"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-b from-sky-800 via-sky-900 to-slate-950 text-sky-50 md:absolute md:z-40 md:rounded-2xl"
    >
      <div className="flex items-center gap-2 border-b border-sky-400/20 px-3 py-2">
        <button
          type="button"
          data-testid="uboot-brief-close"
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-sky-300/40 px-3 py-1 text-sm font-medium hover:bg-sky-100/10"
        >
          {"←"} {UBOOT_TEXTS.boardBack}
        </button>
        <span className="text-sm text-sky-200/80">
          {UBOOT_TEXTS.course} {level + 1}/{LEVEL_COUNT}
        </span>
      </div>

      <div className="grid gap-3 p-3 md:min-h-0 md:flex-1 md:grid-cols-[250px_1fr]">
        <div className="flex flex-col items-center gap-3 md:h-full md:min-h-0 md:overflow-y-auto">
          <Porthole level={level} profile={profile} />
          {full ? (
            <Leaderboard level={level} name={course.name} />
          ) : (
            <Podium level={level} onMore={() => setFull(true)} />
          )}
        </div>

        {/* **Unten bleibt unten.** Die Beschreibung oben wird länger, sobald
            eine höhere Schwierigkeit mehr Bewohner in den Kurs setzt - und
            vorher wanderten damit auch die Schwierigkeitsknöpfe und der
            Startknopf nach unten. Jetzt nimmt sich der obere Kasten den Platz,
            der übrig ist, und scrollt in sich selbst; alles darunter steht
            fest. Ein Knopf, der unter dem Finger wegrutscht, weil über ihm
            eine Zeile umgebrochen ist, wird irgendwann danebengedrückt. */}
        <div className="flex flex-col gap-3 md:h-full md:min-h-0">
          <div className="rounded-2xl border border-sky-300/25 bg-sky-950/40 p-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
            <h2 className="text-xl font-black tracking-tight">{course.name}</h2>
            <p className="mt-0.5 text-sm font-semibold text-sky-300">
              {UBOOT_TEXTS.tierName[course.tier]}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sky-100/90">
              {course.hint}
            </p>
            <Awaits level={level} profile={profile} />
          </div>

          <div className="shrink-0 rounded-2xl border border-sky-300/25 bg-sky-950/40 px-3 py-2">
            <p className="text-xs font-semibold tracking-wide text-sky-300 uppercase">
              {UBOOT_TEXTS.briefBest}
            </p>
            <p data-testid="uboot-brief-best" className="text-lg font-bold">
              {best < 0 ? UBOOT_TEXTS.gradeNever : gradeAt(best).name}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-sky-300/25 bg-sky-950/40 p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-sky-300 uppercase">
              {UBOOT_TEXTS.gradeTitle}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((grade, index) => (
                <button
                  key={grade.id}
                  type="button"
                  data-testid={`uboot-brief-grade-${grade.id}`}
                  data-on={index === profile.grade}
                  onClick={() => onGrade(index)}
                  title={grade.note}
                  className={`cursor-pointer rounded-xl border-2 px-2 py-2 text-sm font-bold ${
                    index === profile.grade
                      ? "border-amber-300 bg-amber-300 text-amber-950"
                      : "border-sky-300/30 hover:bg-sky-100/10"
                  }`}
                >
                  {grade.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-sky-200/70">
              {gradeAt(profile.grade).note}
            </p>
          </div>

          <button
            type="button"
            data-testid="uboot-start-dive"
            onClick={onStart}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-black text-emerald-950 shadow-lg hover:bg-emerald-400"
          >
            <span aria-hidden="true" className="text-2xl">
              {"▶"}
            </span>
            {UBOOT_TEXTS.boardStart}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Props of {@link Porthole}. */
type PortholeProps = {
  readonly level: number;
  readonly profile: Profile;
};

/**
 * Der Blick durchs Bullauge auf den Anfang des Gewässers.
 *
 * @param props - welches Gewässer und mit welchem Boot
 * @returns das runde Fenster
 * @remarks
 * Gezeichnet wird ein einzelnes Bild des echten Spiels - ohne Anzeigen, denn
 * es läuft ja noch nichts. Ein gemaltes Vorschaubild würde altern, sobald
 * jemand am Kurs etwas ändert; dieses hier kann das nicht.
 */
function Porthole({ level, profile }: PortholeProps): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const grade = profile.grade;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }
    const course = courseFor(level, grade);
    const fresh = startDive(level, gearOf(profile), grade);
    const peek = peekAt(course);
    // Das Boot in die gezeigte Stelle gesetzt: Die Vorschau ist ein Standbild
    // und kein Spielstand - sie soll zeigen, wie es dort aussieht, wenn man
    // dort ist.
    const state = {
      ...fresh,
      window: peek.window,
      sub: { ...fresh.sub, x: peek.x, y: peek.y },
    };
    const dots = window.devicePixelRatio || 1;
    canvas.width = PORT.size * dots;
    canvas.height = PORT.size * dots;
    ctx.setTransform(dots, 0, 0, dots, 0, 0);
    ctx.clearRect(0, 0, PORT.size, PORT.size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(PORT.size / 2, PORT.size / 2, PORT.size / 2, 0, Math.PI * 2);
    ctx.clip();
    // Auf das Boot zentriert, ein Stück nach vorn verschoben: Man soll sehen,
    // wo man steht, und ahnen, was kommt.
    ctx.translate(PORT.size / 2, PORT.size / 2);
    ctx.scale(PORT.zoom, PORT.zoom);
    ctx.translate(
      -(state.sub.x - state.window + PORT.ahead),
      -(SURFACE + state.sub.y),
    );
    const scene: Scene = {
      since: 0,
      level: level + 1,
      levels: LEVEL_COUNT,
      name: course.name,
      dark: darkness(LEVELS[level], 0),
      bare: true,
    };
    // Der Hintergrund des Bildes reicht nur so weit wie die Leinwand des
    // Spiels - der Rest des Bullauges bekommt dieselbe Tiefe.
    ctx.fillStyle = DEEP;
    ctx.fillRect(
      -CANVAS_W,
      -CANVAS_H,
      CANVAS_W * PORT.fill,
      CANVAS_H * PORT.fill,
    );
    draw(ctx, state, course, scene);
    ctx.restore();
  }, [level, grade, profile]);

  return (
    <div className="relative">
      <canvas
        ref={ref}
        data-testid="uboot-porthole"
        style={{ width: PORT.size, height: PORT.size }}
        className="rounded-full border-8 border-sky-200/20 shadow-2xl ring-4 ring-sky-950"
        role="img"
        aria-label={LEVELS[level].name}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent"
      />
    </div>
  );
}

/** Die Farbe der Tiefe, für alles im Bullauge außerhalb des Bildes. */
const DEEP = "#04203a";

/**
 * Welche Stelle des Kurses die Vorschau zeigt.
 *
 * @param course - der gebaute Kurs
 * @returns wo das Fenster steht und wo das Boot hineingezeichnet wird
 * @remarks
 * Das erste Tier oder die erste Mine, sonst ein Viertel hinein. Gesucht wird
 * im Kurs selbst und nichts aufgeschrieben: Ein Gewässer, das umgebaut wird,
 * zeigt dann von allein seine neue Stelle.
 */
function peekAt(course: Course): {
  readonly window: number;
  readonly x: number;
  readonly y: number;
} {
  const first = course.beasts[0];
  const spot = first?.homeX ?? course.goal * PORT.into;
  const window = Math.max(
    0,
    Math.min(course.length - CANVAS_W, spot - PORT.back - PORT.ahead),
  );
  const x = window + PORT.back;
  // Eine freie Zeile in dieser Spalte, von der Mitte aus gesucht - sonst
  // steckt das Boot der Vorschau im Fels.
  const col = Math.floor(x / CELL);
  const middle = Math.floor(ROWS / 2);
  let row = middle;
  for (let step = 0; step <= middle; step += 1) {
    const up = middle - step;
    const down = middle + step;
    if (cellAt(course, col, up) === ".") {
      row = up;
      break;
    }
    if (down < ROWS && cellAt(course, col, down) === ".") {
      row = down;
      break;
    }
  }
  return { window, x, y: row * CELL + CELL / 2 };
}

/** Props of {@link Awaits}. */
type AwaitsProps = {
  readonly level: number;
  readonly profile: Profile;
};

/**
 * Was in diesem Gewässer wartet, gezählt.
 *
 * @param props - welches Gewässer und auf welcher Stufe
 * @returns die Zeile mit Tieren und Minen
 * @remarks
 * Aus dem gebauten Kurs gezählt und nicht aufgeschrieben: Wer die
 * Schwierigkeit umstellt, sieht die Zahlen mitgehen - und genau deshalb steht
 * die Zeile hier und nicht in einer Tabelle.
 */
function Awaits({ level, profile }: AwaitsProps): ReactElement {
  const grade = profile.grade;
  const found = useMemo(() => {
    const course = courseFor(level, grade);
    const counted = new Map<BeastKind, number>();
    for (const beast of course.beasts) {
      counted.set(beast.kind, (counted.get(beast.kind) ?? 0) + 1);
    }
    const mines = course.cells.filter((cell) => cell === "M").length;
    const brittle = course.cells.some((cell) => cell === "B");
    return {
      counted: [...counted.entries()],
      mines,
      brittle,
      boss: course.boss,
    };
  }, [level, grade]);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold tracking-wide text-sky-300 uppercase">
        {UBOOT_TEXTS.briefAwaits}
      </span>
      {found.mines > 0 && (
        <Chip
          label={`${found.mines}× ${UBOOT_TEXTS.briefMines}`}
          icon={"\u{1F4A3}"}
        />
      )}
      {found.brittle && (
        <Chip label={UBOOT_TEXTS.briefBrittle} icon={"\u{1F9F1}"} />
      )}
      {found.boss && (
        <span className="flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-900/50 px-2 py-0.5 text-xs font-bold">
          <span aria-hidden="true">{"\u{1F991}"}</span>
          {UBOOT_TEXTS.bossFight}
        </span>
      )}
      {found.counted.map(([kind, many]) => (
        <span
          key={kind}
          data-testid={`uboot-awaits-${kind}`}
          className="flex items-center gap-1 rounded-full border border-sky-300/25 bg-sky-900/60 py-0.5 pr-2 pl-0.5 text-xs font-medium"
        >
          <BeastChip kind={kind} />
          {many}
          {"× "}
          {BREEDS[kind].name}
        </span>
      ))}
    </div>
  );
}

/** Ein Merkmal, das kein Tier ist. */
function Chip({
  label,
  icon,
}: {
  readonly label: string;
  readonly icon: string;
}): ReactElement {
  return (
    <span className="flex items-center gap-1 rounded-full border border-sky-300/25 bg-sky-900/60 px-2 py-0.5 text-xs font-medium">
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

/** Ein Tier, klein, als Zeichen in der Zeile. */
function BeastChip({ kind }: { readonly kind: BeastKind }): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }
    const dots = window.devicePixelRatio || 1;
    canvas.width = CHIP.box * dots;
    canvas.height = CHIP.box * dots;
    ctx.setTransform(dots, 0, 0, dots, 0, 0);
    ctx.clearRect(0, 0, CHIP.box, CHIP.box);
    ctx.save();
    ctx.translate(CHIP.box / 2, CHIP.box / 2);
    ctx.scale(CHIP.scale, CHIP.scale);
    drawBeast(ctx, posed(kind), 0, 0, 0);
    ctx.restore();
  }, [kind]);

  return (
    <canvas
      ref={ref}
      style={{ width: CHIP.box, height: CHIP.box }}
      className="shrink-0"
      role="img"
      aria-label={BREEDS[kind].name}
    />
  );
}

/** Ein Tier, wie es für ein Zeichen stillhält. */
function posed(kind: BeastKind): Beast {
  return {
    id: 0,
    kind,
    x: 0,
    y: 0,
    homeX: 0,
    homeY: 0,
    vx: 1,
    vy: 0,
    beat: 0,
    hull: BREEDS[kind].hull,
    hurt: 0,
  };
}

/** Props of {@link Podium}. */
type PodiumProps = {
  readonly level: number;
  readonly onMore: () => void;
};

/**
 * Die drei besten Zeiten, mit Gold, Silber und Bronze.
 *
 * @param props - welches Gewässer und der Weg zur vollen Liste
 * @returns das Treppchen
 * @remarks
 * Drei und nicht zehn: Vor dem Ablegen will man wissen, was zu schlagen ist,
 * und das sind die ersten drei. Die ganze Liste ist einen Klick entfernt und
 * steht ohnehin am Ende jedes Tauchgangs.
 */
function Podium({ level, onMore }: PodiumProps): ReactElement {
  const [ranked, setRanked] = useState<readonly Score[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [me, setMe] = useState("");

  useEffect(() => {
    let alive = true;
    const board = boardFor(level);
    loadScores(board)
      .then((found) => {
        if (alive) {
          // Die ganze Rangfolge und nicht nur die ersten drei: Um zu sagen,
          // auf welchem Platz die eigene Zeit steht, muss man zählen können.
          setRanked(bestOf(board, found, found.length));
        }
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
        }
      })
      .finally(() => {
        // Der Name, unter dem man zuletzt online war - hier gelesen und nicht
        // beim ersten Zeichnen, weil Speicher eine Sache des Browsers ist.
        if (alive) {
          setMe(loadPlayerName());
        }
      });
    return () => {
      alive = false;
    };
  }, [level]);

  const key = me.trim().toLowerCase();
  const scores = ranked === null ? null : ranked.slice(0, PODIUM);
  const at = ranked === null ? -1 : ranked.findIndex((one) => same(one, key));
  // Nur, wenn man nicht ohnehin oben steht: Zweimal dieselbe Zeile wäre keine
  // Auskunft, sondern ein Fehler.
  const mine = at >= PODIUM && ranked !== null ? ranked[at] : null;

  return (
    <section
      data-testid="uboot-podium"
      className="w-full max-w-[250px] rounded-2xl border border-sky-300/25 bg-sky-950/40 p-2"
    >
      <h3 className="mb-2 text-sm font-bold">{UBOOT_TEXTS.briefPodium}</h3>
      {failed && (
        <p className="text-xs text-rose-300">{UBOOT_TEXTS.boardFailed}</p>
      )}
      {!failed && scores === null && (
        <p className="text-xs text-sky-200/70">{UBOOT_TEXTS.boardLoading}</p>
      )}
      {scores !== null && (
        <ol className="flex flex-col gap-1">
          {CUPS.map((tone, place) => {
            const score = scores[place];
            return (
              <li
                key={tone}
                data-testid={`uboot-podium-${place + 1}`}
                className="flex items-center gap-2 rounded-lg bg-sky-900/50 px-2 py-1 text-sm"
              >
                <Cup tone={tone} />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {score === undefined ? UBOOT_TEXTS.briefOpen : score.name}
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {score === undefined ? "–" : asClock(score.value)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {mine !== null && (
        <div
          data-testid="uboot-podium-mine"
          className="mt-1 flex items-center gap-2 rounded-lg bg-emerald-900/50 px-2 py-1 text-sm ring-1 ring-emerald-400/60"
        >
          <span className="w-5 shrink-0 text-right font-bold tabular-nums">
            {at + 1}.
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {mine.name}
          </span>
          <span className="shrink-0 font-mono tabular-nums">
            {asClock(mine.value)}
          </span>
        </div>
      )}
      {ranked !== null && at < 0 && (
        <p
          data-testid="uboot-podium-none"
          className="mt-1 rounded-lg bg-sky-900/40 px-2 py-1 text-xs text-sky-200/70"
        >
          {UBOOT_TEXTS.briefNoneYet}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-snug text-sky-200/60">
        {UBOOT_TEXTS.boardNote}
      </p>
      <button
        type="button"
        data-testid="uboot-podium-more"
        onClick={onMore}
        className="mt-2 cursor-pointer text-xs font-semibold text-sky-300 underline underline-offset-2 hover:text-sky-100"
      >
        {UBOOT_TEXTS.briefAllTen}
      </button>
    </section>
  );
}

/** Ob dieser Eintrag dem gehört, der hier spielt. */
function same(score: Score, key: string): boolean {
  return key !== "" && score.name.trim().toLowerCase() === key;
}

/** Ein Pokal in seiner Farbe. */
function Cup({ tone }: { readonly tone: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M7 3h10v5a5 5 0 0 1-10 0V3Z"
        fill={tone}
        stroke="rgba(0,0,0,0.35)"
      />
      <path
        d="M7 4H4v2a4 4 0 0 0 4 4"
        fill="none"
        stroke={tone}
        strokeWidth="2"
      />
      <path
        d="M17 4h3v2a4 4 0 0 1-4 4"
        fill="none"
        stroke={tone}
        strokeWidth="2"
      />
      <path d="M11 13h2v4h-2z" fill={tone} />
      <path d="M8 19h8v2H8z" fill={tone} stroke="rgba(0,0,0,0.35)" />
    </svg>
  );
}
