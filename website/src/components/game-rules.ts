/**
 * The shape a game's rules take, so every game reads the same way.
 *
 * @module
 * @remarks
 * Structured rather than one blob of text, for two reasons. A reader at the
 * table is not reading - they are **looking something up**, and headings are
 * what makes that possible. And a shared shape means the rules of the twelfth
 * game look exactly like the rules of the first, which is one less thing to
 * learn each time.
 *
 * The text lives beside the game it belongs to (`games/<id>/i18n/rules.ts`),
 * because rules and code go out of step the moment they live apart.
 */

/** One block of a rules page: a heading and what it says. */
export type RulesSection = {
  readonly title: string;
  /** Paragraphs, in order. May be empty when the section is only a list. */
  readonly body?: readonly string[];
  /** Points, drawn as a list - for anything that is really an enumeration. */
  readonly list?: readonly string[];
  /**
   * A small table, first row being the headings.
   *
   * @remarks
   * For the handful of things that genuinely are a table - what a row of five
   * scores, what each tile is worth. Prose would only be a worse table.
   */
  readonly table?: readonly (readonly string[])[];
};

/** A game's whole rules page. */
export type GameRules = {
  /** The game's name, as the dialog's heading. */
  readonly title: string;
  /** One or two sentences: what this game is and how it is won. */
  readonly intro: string;
  /** How many can play, in words - e.g. "2 bis 5 Spieler". */
  readonly players: string;
  readonly sections: readonly RulesSection[];
  /**
   * A closing line of background, when there is one worth having.
   *
   * @remarks
   * The prize a game won, which edition is meant, where its name comes from -
   * the things somebody might want to know once, having read the rules.
   *
   * **Not a disclaimer.** Where a game was built without the printed rulebook
   * to hand, that is recorded in `docs/games/` for whoever maintains it. On the
   * page it would only make a player doubt rules that are, in fact, the rules
   * this table plays by.
   */
  readonly note?: string;
};
