/**
 * The clock that runs over a whole drive rather than over one section.
 *
 * @module
 * @remarks
 * The world's own clock starts again at every section, which is what the
 * section screen wants and exactly what a board of best times must not use:
 * whoever jumped straight to the last section would hold the record.
 *
 * So the run has a clock of its own. It starts at nought when somebody sets
 * off at the **first** section, keeps counting through every section after
 * that, and keeps counting through a section begun again after a crash - dying
 * costs time, which is the whole of the penalty and quite enough of one. Only
 * a drive that began at the first section counts as a whole one; anybody
 * carrying on from a saved section or stepping through the sections sees the
 * board but does not go on it.
 */
/** The section every whole drive begins at. */
const FIRST_SECTION = 0;

/** How far a drive has got, and whether it is a whole one. */
export type Run = {
  /** How long it has been going, in seconds. */
  readonly seconds: number;
  /** True while it began at the first section and has run on ever since. */
  readonly whole: boolean;
};

/** Before anybody has set off. */
export const NO_RUN: Run = { seconds: 0, whole: false };

/**
 * The run that begins when somebody sets off at a section.
 *
 * @param section - which section they set off at, counted from zero
 * @returns the fresh run
 */
export function runFrom(section: number): Run {
  return { seconds: 0, whole: section === FIRST_SECTION };
}

/**
 * The same run, with a section begun again after a crash.
 *
 * @param run - the run so far
 * @returns the run, still counting
 * @remarks
 * The clock is **not** put back. A section driven twice took twice as long,
 * and a board that forgave that would reward crashing on purpose - it is
 * quicker to take a run at the wall and reset than to be careful.
 */
export function runAgain(run: Run): Run {
  return run;
}

/**
 * The run a moment later.
 *
 * @param run - the run so far
 * @param seconds - how long that moment was
 * @returns the run with the time added
 */
export function runOn(run: Run, seconds: number): Run {
  return { ...run, seconds: run.seconds + seconds };
}
