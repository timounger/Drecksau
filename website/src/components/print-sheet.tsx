/**
 * The frame of a printed page: an A4 sheet on screen with a print button
 * above it, and on paper nothing but the sheet. Used by the games that print
 * a case (Murdoku, Murdle) - to print, or to save as a PDF from the browser's
 * print dialog.
 *
 * @module
 */
"use client";

import {
  useEffect,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";

/** German labels of the bar above the sheet. */
const T = {
  printNow: "Drucken / Als PDF speichern",
  printHelp:
    'Im Druckdialog als Ziel "Als PDF speichern" wählen, um eine PDF-Datei zu erhalten.',
} as const;

/** An A4 page and the margin the printer leaves around it, in millimetres. */
export const PAGE = { width: 210, margin: 12 } as const;

/** How long the page waits before the print dialog, in milliseconds - for the fonts. */
const PRINT_DELAY_MS = 400;

/**
 * The rules of the printed page: A4 with its margin, nothing but the sheet on
 * paper, and its colours printed as they are - backgrounds included, which a
 * browser leaves out by default. The light/dark switch has no say here: the
 * sheet is always light.
 */
const PRINT_CSS = `
@page { size: A4; margin: ${String(PAGE.margin)}mm; }
[data-testid="theme-toggle"] { display: none !important; }
[data-print-sheet] { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.print-sheet { width: ${String(PAGE.width)}mm; padding: ${String(PAGE.margin)}mm; }
@media print {
  body > :not([data-print-sheet]) { display: none !important; }
  .print-sheet { width: auto; padding: 0; box-shadow: none; }
}
`;

/**
 * The printed page around a game's content. Opens the print dialog once it is
 * drawn, and is drawn in the browser only: some drawings compute their curves
 * with sines, and the server rounds the last digit differently.
 *
 * @param props - the content, and the test id of the page
 * @returns the page, empty until the browser draws it
 */
export function PrintSheet({
  testId,
  children,
}: {
  readonly testId: string;
  readonly children: ReactNode;
}): ReactElement | null {
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  useLightTheme();
  useEffect(() => {
    // A timer rather than a flag: in development the effect runs twice, and
    // the first timer is cleared before it fires.
    const timer = window.setTimeout(() => window.print(), PRINT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return inBrowser ? (
    <main
      data-print-sheet=""
      data-testid={testId}
      className="flex min-h-screen flex-col items-center gap-4 bg-zinc-200 py-6 text-zinc-900 print:block print:bg-white print:py-0"
    >
      <style>{PRINT_CSS}</style>
      <div className="flex flex-col items-center gap-1 px-4 text-center print:hidden">
        <button
          type="button"
          data-testid="print-now"
          onClick={() => window.print()}
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          {T.printNow}
        </button>
        <span className="text-xs text-zinc-600">{T.printHelp}</span>
      </div>
      <article className="print-sheet flex max-w-full flex-col gap-4 bg-white shadow-lg print:gap-3">
        {children}
      </article>
    </main>
  ) : null;
}

/**
 * The head of a printed case: the game and where the case comes from, the
 * title and the story.
 *
 * @param props - the game's name, the case's label, title and story
 * @returns the header
 */
export function PrintHeader({
  game,
  label,
  title,
  story,
}: {
  readonly game: string;
  readonly label: string;
  readonly title: string;
  readonly story: string;
}): ReactElement {
  return (
    <header className="flex flex-col gap-1 border-b-2 border-zinc-900 pb-2">
      <span className="flex items-baseline justify-between gap-3 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
        <span>{game}</span>
        {label !== "" && <span>{label}</span>}
      </span>
      <h1 className="text-2xl leading-tight font-extrabold">{title}</h1>
      <p className="text-sm text-zinc-700 italic">{story}</p>
    </header>
  );
}

/**
 * Lines to write on.
 *
 * @param props - how many
 * @returns the dashed lines
 */
export function NoteLines({ count }: { readonly count: number }): ReactElement {
  return (
    <>
      {Array.from({ length: count }, (unused, at) => (
        <span
          key={`note-${String(at)}`}
          className="block h-5 border-b border-dashed border-zinc-400"
        />
      ))}
    </>
  );
}

/**
 * Subscribes to nothing - whether this is the browser never changes.
 *
 * @returns how to unsubscribe again
 */
function subscribeNothing(): () => void {
  return () => undefined;
}

/**
 * Forces the light colours while the sheet is open, whatever was chosen -
 * paper is white. The choice itself is left alone and comes back on leaving.
 */
function useLightTheme(): void {
  useEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (before === null) {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", before);
      }
    };
  }, []);
}
