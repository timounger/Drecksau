/**
 * Start page: an overview of the games in the collection.
 *
 * @module
 * @remarks
 * Shelves rather than one long list: seventeen cards in alphabetical order is a
 * catalogue, and a catalogue answers no question anybody actually arrives with.
 * The two shelves at the top answer the two that come up first - what is
 * everyone playing, and what is new - and the rest sort by what kind of evening
 * a game is.
 *
 * A game sits on exactly one category shelf, but may also appear on "Beliebt"
 * and "Neu" above it. Those two are the answer to a question, not a filing
 * place, so seeing a card there and again below is the point rather than a
 * repetition. The two of them do not repeat each other, though: what is on
 * "Beliebt" is left out of "Neu" before its three are counted out.
 *
 * Searching drops the shelves and shows one flat list. Somebody typing a name
 * knows what they are looking for, and putting the hits back into sections
 * would only make them hunt through the sections as well.
 *
 * **One markup, three looks.** Shop window, console tiles or a quiet reading
 * list: which one is on is an attribute on the root element, written before the
 * first paint, and everything after that is CSS - see ../lib/look/look-boot and
 * the `look-*` variants in ../app/globals.css. Nothing here asks which look is
 * in force, which is exactly why switching it cannot make the page flash.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import {
  CATEGORIES,
  GAMES,
  NEW_WINDOW_DAYS,
  gamesIn,
  newGames,
  type GameDefinition,
} from "@/games/registry";
import { GAME_LOGOS } from "@/games/game-logos";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";
import { AccountButton } from "@/components/account-button";
import { ShelfIcon } from "@/components/shelf-icons";
import {
  ORDER_APART,
  POPULAR_DAYS,
  loadPlayTimes,
  rememberRanking,
  rememberedOrder,
} from "@/online/popularity";
import {
  getServerStatsSnapshot,
  getStatsSnapshot,
  subscribeStats,
} from "@/lib/stats/stats-store";
import { useReady } from "@/lib/storage/use-ready";

/** How many games the popular shelf holds. */
const POPULAR_LIMIT = 6;

/**
 * How many blank cards stand in for it until the first answer.
 *
 * @remarks
 * One row of three rather than the full six, because the row height is what
 * the rest of the page is standing on: the shelf holds at most six but in
 * practice a handful, and guessing high means the page shrinks by a whole row
 * once the real cards arrive. Guessing one row is wrong by a row at worst, and
 * only ever on the first visit - after that the remembered order fills the
 * shelf and nothing is guessed at all.
 */
const GHOST_GUESS = 3;

/** What a card may be marked with, beyond its own name. */
type Mark = "popular" | "new" | null;

/** Which games carry which mark, worked out once for the whole page. */
type Marks = {
  readonly popular: ReadonlySet<string>;
  readonly fresh: ReadonlySet<string>;
};

/**
 * Renders the collection start page.
 *
 * @returns the overview element
 */
export function GameCollection(): ReactElement {
  const [query, setQuery] = useState("");
  const popular = usePopularGames();
  // **The clock is a thing outside React**, like the storage below, and is
  // read the same way: `Date.now()` in the middle of a render is a value that
  // changes under the renderer's feet, and the compiler says so. What this
  // page needs of it is the date and nothing finer.
  const today = useSyncExternalStore(NEVER_CHANGES, TODAY, NO_TODAY);
  // **"Neu" waits for "Beliebt".** What already stands up there does not count
  // as news down here - and which games those are is the database's business.
  // Until it has answered, that shelf is "not known yet" as well and holds its
  // place with grey cards.
  const fresh =
    popular === null || today === ""
      ? null
      : newGames(
          noonOf(today),
          popular.map((game) => game.id),
        );
  const marks: Marks = {
    popular: new Set((popular ?? []).map((game) => game.id)),
    fresh: new Set((fresh ?? []).map((game) => game.id)),
  };
  const needle = query.trim().toLowerCase();
  const matches =
    needle === ""
      ? GAMES
      : GAMES.filter((game) => game.name.toLowerCase().includes(needle));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-4">
      <Banner query={query} onQuery={setQuery} />

      {needle !== "" ? (
        <Found matches={matches} marks={marks} />
      ) : (
        <>
          <Hero />
          <Shelves popular={popular} fresh={fresh} marks={marks} />
        </>
      )}
    </div>
  );
}

/**
 * The head of the page: who one is, what one is looking for, where to jump.
 *
 * @param props - the search text and how to change it
 * @returns the banner
 * @remarks
 * A panel rather than three loose rows. The page is a wall of pictures, and
 * without something to start it the first shelf simply begins in mid-air. The
 * colours are a wash rather than a fill, so the same panel works in both
 * themes and neither shouts.
 */
function Banner({
  query,
  onQuery,
}: {
  readonly query: string;
  readonly onQuery: (next: string) => void;
}): ReactElement {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-fuchsia-500/10 p-5 dark:border-zinc-800">
      <div className="flex items-start gap-3">
        <h1 className="mr-auto min-w-0 text-3xl font-bold">
          {COLLECTION_TEXTS.title}
        </h1>
        {/* The one place the name and the face are set. Here rather than on
            every online screen: the same choice in seventeen places is a
            choice with no home. */}
        <AccountButton />
      </div>
      <input
        type="search"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder={COLLECTION_TEXTS.searchPlaceholder}
        aria-label={COLLECTION_TEXTS.searchPlaceholder}
        data-testid="game-search"
        className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/80"
      />
      {/* Only the categories, because only they are always there: "Beliebt"
          and "Neu" come and go with the data, and a link to a shelf that is
          not on the page is a link that does nothing. */}
      <nav aria-label={COLLECTION_TEXTS.jump} className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <a
            key={category.id}
            href={`#regal-${category.id}`}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ShelfIcon id={category.id} size="h-4 w-4" />
            {category.name}
          </a>
        ))}
      </nav>
    </header>
  );
}

/**
 * The game one was last at, given the whole width.
 *
 * @returns the banner, or nothing when this browser has played nothing yet
 * @remarks
 * **A different question from the shelf below it.** The banner used to show
 * the game at the top of the charts, which is what "Beliebt" says three
 * centimetres further down - the same card twice, with two headings that mean
 * the same thing. This one is about the reader instead: what *they* last had
 * open, and a button that goes straight back into it. Local against global,
 * and the one thing a game library is actually for.
 *
 * It comes out of this browser's own statistics (`lastPlayedAt` per game), so
 * there is nothing to fetch and nothing shared: what nobody has played, nobody
 * sees.
 *
 * Only in the shop window - hidden everywhere else, so the other two looks
 * never pay for it. The picture behind it is the game's own artwork, blown up
 * and blurred: a cheap way to give each game its own colour without asking
 * anybody to write one down.
 */
function Hero(): ReactElement | null {
  const stats = useSyncExternalStore(
    subscribeStats,
    getStatsSnapshot,
    getServerStatsSnapshot,
  );
  // **"Nothing played" and "not asked yet" look identical here**, because the
  // prerender's statistics are empty ones. Without this the banner would be
  // absent in the HTML and drop in after hydration, shoving the shelves down -
  // so the space is held until the browser has answered.
  const ready = useReady();
  const game = lastPlayed(stats);
  const waiting = !ready;
  if (game === null && !waiting) {
    return null;
  }
  return (
    <section
      data-testid="hero"
      aria-busy={waiting ? true : undefined}
      className="look-showcase:block relative hidden h-52 overflow-hidden rounded-3xl border border-zinc-200 shadow-sm dark:border-zinc-800"
    >
      {game !== null && (
        <Image
          src={GAME_LOGOS[game.id]}
          alt=""
          fill
          sizes="56rem"
          aria-hidden
          className="scale-125 object-cover blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-zinc-950/90 dark:via-zinc-950/70" />
      <div className="relative flex h-full items-center gap-5 p-6">
        {game === null ? (
          <GhostHero />
        ) : (
          <>
            <span className="relative hidden h-32 w-32 shrink-0 overflow-hidden rounded-2xl shadow-md sm:block">
              <Image
                src={GAME_LOGOS[game.id]}
                alt=""
                fill
                sizes="8rem"
                className="object-cover"
              />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                {COLLECTION_TEXTS.heroEyebrow}
              </span>
              <h2 className="truncate text-3xl font-bold">{game.name}</h2>
              <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                {game.tagline}
              </p>
              <Link
                href={game.href}
                data-testid="hero-play"
                className="mt-1 w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {COLLECTION_TEXTS.heroPlay}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Which game this browser had open most recently.
 *
 * @param stats - what is stored per game
 * @returns that game, or null if nothing has been played here
 */
function lastPlayed(
  stats: Readonly<Record<string, { readonly lastPlayedAt: number | null }>>,
): GameDefinition | null {
  let best: GameDefinition | null = null;
  let seen = 0;
  for (const game of GAMES) {
    const at = stats[game.id]?.lastPlayedAt ?? 0;
    if (at > seen) {
      seen = at;
      best = game;
    }
  }
  return best;
}

/** The same banner with nothing in it yet. */
function GhostHero(): ReactElement {
  return (
    <div aria-hidden className="flex w-full animate-pulse items-center gap-5">
      <span className="hidden h-32 w-32 shrink-0 rounded-2xl bg-zinc-200 sm:block dark:bg-zinc-800" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="block h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <span className="block h-8 w-56 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <span className="block h-3 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        <span className="mt-1 block h-9 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

/** What a search turned up, as one flat list. */
function Found({
  matches,
  marks,
}: {
  readonly matches: readonly GameDefinition[];
  readonly marks: Marks;
}): ReactElement {
  return matches.length === 0 ? (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      {COLLECTION_TEXTS.noResults}
    </p>
  ) : (
    <Grid games={matches} marks={marks} />
  );
}

/** The whole collection, sorted onto its shelves. */
function Shelves({
  popular,
  fresh,
  marks,
}: {
  readonly popular: readonly GameDefinition[] | null;
  readonly fresh: readonly GameDefinition[] | null;
  readonly marks: Marks;
}): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      {/* **The shelf keeps its place while it is being fetched.** Its order
          comes from the shared database and takes a second or two to arrive;
          left out until then, it used to drop in afterwards and shove the
          whole page down, which reads as the site sorting itself in front of
          one's eyes. So `null` - not known yet - is a case of its own and
          holds the space with grey cards.

          Only an answer of "nobody has played anything" takes the shelf away:
          an empty shelf headed "Beliebt" says nothing, and one filled with a
          stand-in would be a lie. */}
      {popular?.length !== 0 && (
        <Shelf
          id="beliebt"
          title={COLLECTION_TEXTS.popular}
          hint={COLLECTION_TEXTS.popularHint(POPULAR_DAYS)}
          games={popular ?? []}
          marks={marks}
          ghosts={popular === null ? GHOST_GUESS : 0}
        />
      )}
      {fresh?.length !== 0 && (
        <Shelf
          id="neu"
          title={COLLECTION_TEXTS.newest}
          hint={COLLECTION_TEXTS.newestHint(NEW_WINDOW_DAYS)}
          games={fresh ?? []}
          marks={marks}
          ghosts={fresh === null ? GHOST_GUESS : 0}
        />
      )}
      {CATEGORIES.map((category) => (
        <Shelf
          key={category.id}
          id={category.id}
          title={category.name}
          games={gamesIn(category.id)}
          marks={marks}
        />
      ))}
    </div>
  );
}

/** One headed row of game cards. */
function Shelf({
  id,
  title,
  hint,
  games,
  marks,
  ghosts = 0,
}: {
  readonly id: string;
  readonly title: string;
  /** A line under the heading saying what the shelf means, where that helps. */
  readonly hint?: string;
  readonly games: readonly GameDefinition[];
  readonly marks: Marks;
  /** How many blank cards to hold the space with while the games are fetched. */
  readonly ghosts?: number;
}): ReactElement {
  return (
    <section
      id={`regal-${id}`}
      data-testid={`shelf-${id}`}
      aria-busy={ghosts > 0 ? true : undefined}
      className="flex scroll-mt-4 flex-col gap-3"
    >
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ShelfIcon id={id} size="h-5 w-5" />
          {title}
        </h2>
        {hint !== undefined && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
      </div>
      {ghosts > 0 ? (
        <GhostGrid many={ghosts} />
      ) : (
        <Grid games={games} marks={marks} />
      )}
    </section>
  );
}

/**
 * Cards, three across where there is room - and five in the tiled look.
 *
 * @param props - the games and what they are marked with
 * @returns the grid
 */
function Grid({
  games,
  marks,
}: {
  readonly games: readonly GameDefinition[];
  readonly marks: Marks;
}): ReactElement {
  return (
    <ul className={GRID}>
      {games.map((game) => (
        <li key={game.id}>
          <GameCard game={game} mark={markOf(game, marks)} />
        </li>
      ))}
    </ul>
  );
}

/** What a mark is called on screen. */
function markName(mark: Exclude<Mark, null>): string {
  return mark === "popular"
    ? COLLECTION_TEXTS.popular
    : COLLECTION_TEXTS.newest;
}

/** How a mark is drawn, wherever it ends up. */
const BADGE =
  "rounded-full bg-zinc-900/80 px-2 py-0.5 align-middle text-[10px] font-semibold text-white backdrop-blur dark:bg-zinc-100/80 dark:text-zinc-900";

/** Which of the two marks a card gets, or neither. */
function markOf(game: GameDefinition, marks: Marks): Mark {
  if (marks.popular.has(game.id)) {
    return "popular";
  }
  return marks.fresh.has(game.id) ? "new" : null;
}

/**
 * How the cards are laid out, in every look.
 *
 * @remarks
 * Kept in one place because the blank cards have to use the very same line: a
 * grid of ghosts three across followed by real cards five across is the jump
 * this whole arrangement exists to avoid.
 */
const GRID =
  "look-dashboard:grid-cols-2 look-dashboard:gap-3 look-dashboard:sm:grid-cols-3 look-dashboard:lg:grid-cols-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** The box a card is drawn in, in every look. */
const CARD =
  "look-plain:p-5 look-dashboard:min-h-0 look-dashboard:gap-2 look-dashboard:border-0 look-dashboard:bg-transparent look-dashboard:p-0 look-dashboard:shadow-none group flex h-full min-h-40 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50";

/**
 * The picture on a card.
 *
 * @remarks
 * Three shapes of the same thing: a small square icon in the quiet look, a
 * wide band of cover art in the shop window, and a big square tile on the
 * dashboard. `relative`, because both images inside it are laid over it.
 */
const ART =
  "look-showcase:h-28 look-showcase:w-full look-dashboard:aspect-square look-dashboard:h-auto look-dashboard:w-full look-dashboard:rounded-2xl relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl";

/** One clickable card leading into a game. */
function GameCard({
  game,
  mark,
}: {
  readonly game: GameDefinition;
  readonly mark: Mark;
}): ReactElement {
  return (
    <Link
      href={game.href}
      data-testid={`game-card-${game.id}`}
      className={CARD}
    >
      <span className={ART}>
        {/* The artwork twice: once blown up and blurred to fill the band
            behind, once sharp and whole in front of it. That is what gives
            every game its own colour without anybody picking one. Only the
            shop window shows the blurred one; the other looks crop the sharp
            one to their square. */}
        <Image
          src={GAME_LOGOS[game.id]}
          alt=""
          fill
          sizes="(min-width: 1024px) 18rem, 50vw"
          aria-hidden
          className="look-showcase:block hidden scale-125 object-cover blur-xl"
        />
        <Image
          src={GAME_LOGOS[game.id]}
          alt=""
          fill
          sizes="(min-width: 1024px) 18rem, 50vw"
          className="look-showcase:object-contain look-showcase:p-2 object-cover"
        />
        {mark !== null && (
          <span
            className={`${BADGE} look-plain:hidden absolute top-1.5 right-1.5`}
          >
            {markName(mark)}
          </span>
        )}
      </span>
      <div className="look-dashboard:flex-none flex flex-1 flex-col">
        <h3 className="look-dashboard:truncate look-dashboard:text-center look-dashboard:text-sm text-lg font-semibold">
          {game.name}
          {/* In the quiet look the picture is a thumbnail the size of a
              thumb, and a pill laid over it hides the game. There the mark
              goes beside the name instead, where there is room for it. */}
          {mark !== null && (
            <span className={`${BADGE} look-plain:inline-block ml-2 hidden`}>
              {markName(mark)}
            </span>
          )}
        </h3>
        {/* **Two lines, whether it needs them or not.** A tagline that fits
            on one leaves a card twenty pixels shorter than its neighbours -
            and twenty pixels shorter than the blank card standing in for it,
            which is a shelf that shrinks the moment it fills. */}
        <p className="look-dashboard:hidden line-clamp-2 min-h-10 text-sm text-zinc-500 dark:text-zinc-400">
          {game.tagline}
        </p>
      </div>
      <span className="look-dashboard:hidden text-sm font-medium text-emerald-700 group-hover:underline dark:text-emerald-400">
        {COLLECTION_TEXTS.play} {"\u{2192}"}
      </span>
    </Link>
  );
}

/**
 * The most played games of the last days.
 *
 * @returns the popular games, longest played first, or null while unknown
 * @remarks
 * Fetched after the page is up rather than before it: this is the start page,
 * and it must not wait on a network round trip to show a list it already has.
 *
 * **Three answers, not two.** `null` means nobody has asked yet, an empty list
 * means the database says nothing has been played, and anything else is the
 * order to show. The shelf treats them differently - see {@link Shelves} -
 * because "not yet" and "nothing" look the same in a list and must not look
 * the same on the page.
 *
 * The order this browser saw **last** time is put up at once, before the
 * database is asked at all, so that on every visit after the first the shelf
 * is there from the first paint. It is replaced the moment the real answer
 * arrives, which for a ranking of whole days is hardly ever a different one.
 *
 * A failure keeps whatever was remembered and otherwise leaves the shelf
 * absent - a shelf that cannot say what is popular should not claim to.
 */
function usePopularGames(): readonly GameDefinition[] | null {
  const [fetched, setFetched] = useState<readonly GameDefinition[] | null>(
    null,
  );
  // Read the way React reads anything outside itself: the server knows
  // nothing, the browser knows what it kept, and the swap from one to the
  // other happens with hydration rather than as a second render afterwards.
  const remembered = useSyncExternalStore(
    NEVER_CHANGES,
    rememberedOrder,
    NOTHING_REMEMBERED,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stale = false;
    void loadPlayTimes().then(
      (times) => {
        if (!stale) {
          const fresh = [...GAMES]
            .filter((game) => (times.get(game.id) ?? 0) > 0)
            .sort(
              (left, right) =>
                (times.get(right.id) ?? 0) - (times.get(left.id) ?? 0),
            )
            .slice(0, POPULAR_LIMIT);
          setFetched(fresh);
          rememberRanking(fresh.map((game) => game.id));
        }
      },
      () => {
        if (!stale) {
          setFailed(true);
        }
      },
    );
    return () => {
      stale = true;
    };
  }, []);

  const kept = remembered === "" ? null : byIds(remembered.split(ORDER_APART));
  return fetched ?? kept ?? (failed ? [] : null);
}

/**
 * Today's date, as `YYYY-MM-DD` in UTC.
 *
 * @returns the day, which is all the clock is asked for here
 * @remarks
 * A **day** rather than a moment, for the same reason the remembered order is
 * a line rather than a list: what is read through `useSyncExternalStore` has
 * to compare equal to what was read last time, and `Date.now()` never does.
 * The shelf measures ages in whole days anyway.
 */
const TODAY = (): string =>
  new Date().toISOString().slice(0, "YYYY-MM-DD".length);

/**
 * And what the server knows of today, which is nothing.
 *
 * @returns an empty day
 * @remarks
 * Not because the server has no clock, but because nothing it could say would
 * survive: the page is built once and read for weeks. The shelf it renders is
 * therefore the "not known yet" one, and the browser works out the rest.
 */
const NO_TODAY = (): string => "";

/**
 * Midday on a given date, in UTC.
 *
 * @param day - the date, as `YYYY-MM-DD`
 * @returns that moment in epoch milliseconds
 * @remarks
 * Midday rather than midnight so that an hour either way - a clock that is
 * slightly off, a timezone read differently - cannot move the answer by a
 * whole day.
 */
function noonOf(day: string): number {
  return Date.parse(`${day}T12:00:00Z`);
}

/**
 * How one subscribes to the remembered order: one does not.
 *
 * @returns the way to unsubscribe again, which is also nothing
 * @remarks
 * It is written once, when the answer from the database arrives, and by that
 * time the page is showing that answer and not this. Nothing else in the tab
 * ever changes it, so there is nothing to listen to.
 */
const NEVER_CHANGES = () => () => undefined;

/** And what the server knows about it, which is nothing. */
const NOTHING_REMEMBERED = () => "";

/**
 * The games behind a remembered list of ids, in that order.
 *
 * @param ids - what was stored
 * @returns the games that still exist, in the order given
 * @remarks
 * Anything unknown is dropped rather than trusted: the list comes out of this
 * browser's storage and may name a game that has since been renamed or
 * removed.
 */
function byIds(ids: readonly string[]): readonly GameDefinition[] {
  return ids
    .map((id) => GAMES.find((game) => game.id === id))
    .filter((game): game is GameDefinition => game !== undefined);
}

/**
 * Blank cards that hold the space until the real ones arrive.
 *
 * @param many - how many to draw
 * @returns the grid of them
 * @remarks
 * The same box and the same classes as a real card, down to the grid it sits
 * in, so that swapping one for the other moves nothing on the page - in any of
 * the three looks. Each bar is a space with a background on it, so every line
 * takes the height its typeface gives it; bars measured by hand came out forty
 * pixels short, and forty pixels is exactly how far the page then jumped.
 *
 * Hidden from screen readers: there is nothing here to read out, and "loading"
 * is what `aria-busy` on the shelf already says.
 */
function GhostGrid({ many }: { readonly many: number }): ReactElement {
  return (
    <ul aria-hidden className={`${GRID} animate-pulse`}>
      {Array.from({ length: many }, (unused, at) => (
        <li key={at}>
          <div className={CARD}>
            <span className={`${ART} bg-zinc-200 dark:bg-zinc-800`} />
            <div className="look-dashboard:flex-none flex flex-1 flex-col">
              <h3 className="look-dashboard:text-center look-dashboard:text-sm text-lg font-semibold">
                <span className="inline-block w-2/3 rounded bg-zinc-200 text-transparent dark:bg-zinc-800">
                  {"\u{00A0}"}
                </span>
              </h3>
              <p className="look-dashboard:hidden min-h-10 text-sm">
                <span className="inline-block w-full rounded bg-zinc-100 text-transparent dark:bg-zinc-800/60">
                  {"\u{00A0}"}
                </span>
                <span className="inline-block w-4/5 rounded bg-zinc-100 text-transparent dark:bg-zinc-800/60">
                  {"\u{00A0}"}
                </span>
              </p>
            </div>
            <span className="look-dashboard:hidden text-sm font-medium">
              <span className="inline-block w-20 rounded bg-zinc-100 text-transparent dark:bg-zinc-800/60">
                {"\u{00A0}"}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
