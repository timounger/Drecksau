/**
 * *Ereignisse auf Catan* - the deck that replaces the dice.
 *
 * @module
 * @remarks
 * "Diese Karten ersetzen die Würfel! Wer an der Reihe ist, deckt die oberste
 * Karte des Stapels auf, anstatt zu würfeln." The number on the card says which
 * landscapes pay out; about half the cards also carry an event, and the event
 * happens **first**.
 *
 * The 37 numbers are not a shuffle of anything - they are the two dice written
 * out. One 2, two 3s, three 4s, four 5s, five 6s, six 7s, five 8s, four 9s,
 * three 10s, two 11s, one 12: the exact 36 outcomes of two dice, plus the
 * Jahreswechsel card that has no number. That is the whole point of the
 * variant, and it is why the counts here are transcribed rather than invented.
 *
 * The Jahreswechsel card is what keeps it from becoming solitaire. It is
 * shuffled in with **five cards below it**, so the deck runs out somewhere in
 * the last six - close enough to count cards, far enough that you cannot be
 * sure.
 */

/* eslint-disable @typescript-eslint/no-magic-numbers -- the deck is printed data */

import { islandOf } from "./board";
import { goodsSize } from "./knights";
import { openPoints, playingRitter, type CatanGame } from "./state";

/** The eleven events, and the card that carries none. */
export type EventKind =
  | "schoenerTag"
  | "raeuberueberfall"
  | "seuche"
  | "erdbeben"
  | "guteNachbarschaft"
  | "ritterturnier"
  | "handelsvorteil"
  | "ruhigeSee"
  | "rueckzug"
  | "nachbarschaftshilfe"
  | "konflikt"
  | "ertragreichesJahr"
  | "jahreswechsel";

/** One card of the deck. */
export type EventCard = {
  /** The number the landscapes pay out on; `null` on the Jahreswechsel card. */
  readonly number: number | null;
  readonly kind: EventKind;
};

/**
 * How the deck is stocked, card for card.
 *
 * @remarks
 * Straight off pages 4 and 5: each entry is one event with the dice numbers it
 * appears on. The 16 "Ein schöner Tag" cards are what fill the distribution out
 * to the real odds of two dice.
 */
const DECK: readonly (readonly [EventKind, readonly number[]])[] = [
  ["raeuberueberfall", [7, 7, 7, 7, 7, 7]],
  ["seuche", [6, 8]],
  ["erdbeben", [6]],
  ["guteNachbarschaft", [6]],
  ["ritterturnier", [5]],
  ["handelsvorteil", [5]],
  ["ruhigeSee", [9, 12]],
  ["rueckzug", [4, 4]],
  ["nachbarschaftshilfe", [10, 11]],
  ["konflikt", [3]],
  ["ertragreichesJahr", [2]],
  ["schoenerTag", [3, 4, 5, 5, 6, 6, 8, 8, 8, 8, 9, 9, 9, 10, 10, 11]],
];

/** How many cards sit below the Jahreswechsel card when the deck is built. */
export const UNDER_TURNING = 5;

/** Every card except the Jahreswechsel one. */
export function buildEventCards(): readonly EventCard[] {
  const cards: EventCard[] = [];
  DECK.forEach(([kind, numbers]) => {
    numbers.forEach((number) => cards.push({ number, kind }));
  });
  return cards;
}

/** The Jahreswechsel card itself. */
export const TURNING: EventCard = { number: null, kind: "jahreswechsel" };

/**
 * Builds the draw pile.
 *
 * @param shuffled - the 36 numbered cards, already shuffled
 * @returns the pile, top card first
 *
 * @remarks
 * "Sortiert die Karte Jahreswechsel aus. Mischt die restlichen Karten. Legt
 * verdeckt 5 Karten unter die Karte Jahreswechsel und die restlichen Karten
 * verdeckt oben auf die Karte."
 */
export function stackEvents(
  shuffled: readonly EventCard[],
): readonly EventCard[] {
  const below = shuffled.slice(0, UNDER_TURNING);
  const above = shuffled.slice(UNDER_TURNING);
  return [...above, TURNING, ...below];
}

/** Whether an event hands a choice to anybody at all. */
export function eventAsks(game: CatanGame, kind: EventKind): readonly number[] {
  const askers: Readonly<Record<EventKind, () => readonly number[]>> = {
    // Everybody with a card to give, in seat order starting left of the roller.
    guteNachbarschaft: () => holdingCards(game),
    ertragreichesJahr: () => everySeat(game),
    erdbeben: () => withRoads(game),
    ritterturnier: () => mostKnights(game),
    ruhigeSee: () => mostAtHarbours(game),
    handelsvorteil: () => (game.longest === null ? [] : [game.longest]),
    konflikt: () => soleKnightLeader(game),
    nachbarschaftshilfe: () => richestInPoints(game),
    // These need nobody: they either do nothing, or the referee does it.
    schoenerTag: () => [],
    raeuberueberfall: () => [],
    seuche: () => [],
    rueckzug: () => [],
    jahreswechsel: () => [],
  };
  return askers[kind]();
}

/** Everybody, in seat order. */
function everySeat(game: CatanGame): readonly number[] {
  return game.players.map((unused, seat) => seat);
}

/** Everybody holding at least one card. */
function holdingCards(game: CatanGame): readonly number[] {
  return everySeat(game).filter((seat) => holdsCards(game, seat));
}

/** Everybody with a road that is not already turned sideways. */
function withRoads(game: CatanGame): readonly number[] {
  return everySeat(game).filter(
    (seat) =>
      game.players[seat].damaged === null &&
      game.roads.some((owner) => owner === seat),
  );
}

/** Whoever has played the most knights - all of them on a tie. */
function mostKnights(game: CatanGame): readonly number[] {
  const best = Math.max(...game.players.map((player) => player.knights));
  return best === 0
    ? []
    : everySeat(game).filter((seat) => game.players[seat].knights === best);
}

/**
 * Whoever alone has the most played knights, or holds the Größte Rittermacht.
 *
 * @remarks
 * "Wer **alleine** die meisten Ritterkarten aufgedeckt hat oder die Größte
 * Rittermacht besitzt" - so a tie hands it to nobody unless the tile settles
 * it, which is what the tile is for.
 */
function soleKnightLeader(game: CatanGame): readonly number[] {
  const leaders = mostKnights(game);
  return leaders.length === 1 ? leaders : game.army === null ? [] : [game.army];
}

/** Whoever has the most buildings standing at a harbour - all of them on a tie. */
function mostAtHarbours(game: CatanGame): readonly number[] {
  const board = islandOf(game.land.length);
  const counts = game.players.map((unused, seat) =>
    game.harbours.reduce(
      (sum, harbour) =>
        sum +
        board.paths[harbour.path].ends.filter(
          (end) => game.towns[end]?.owner === seat,
        ).length,
      0,
    ),
  );
  const best = Math.max(...counts);
  return best === 0
    ? []
    : everySeat(game).filter((seat) => counts[seat] === best);
}

/** Whoever is furthest ahead on points anybody can see - all of them on a tie. */
function richestInPoints(game: CatanGame): readonly number[] {
  const points = game.players.map((unused, seat) => openPoints(game, seat));
  const best = Math.max(...points);
  // Only worth asking if there is somebody poorer to give to, and something to
  // give: "muss einer beliebigen Person mit weniger Siegpunkten 1 Handkarte
  // schenken."
  const poorer = points.some((count) => count < best);
  return !poorer
    ? []
    : everySeat(game).filter(
        (seat) => points[seat] === best && holdsCards(game, seat),
      );
}

/** Who a Nachbarschaftshilfe gift may go to. */
export function poorerThan(game: CatanGame, seat: number): readonly number[] {
  const mine = openPoints(game, seat);
  return everySeat(game).filter((other) => openPoints(game, other) < mine);
}

/** Who a card may be drawn from - anybody else holding one. */
export function anybodyHolding(
  game: CatanGame,
  seat: number,
): readonly number[] {
  return everySeat(game).filter(
    (other) => other !== seat && holdsCards(game, other),
  );
}

/**
 * Whether this seat holds a card that could be drawn from it.
 *
 * @param game - the game
 * @param seat - whose hand
 * @returns true while there is anything in it
 * @remarks
 * "Anschließend ziehst du eine verdeckte Karte aus der **Kartenhand** dieser
 * Person": in Städte & Ritter that hand holds Handelswaren as well as
 * resources - they are dealt into it, they count towards the seven, and they
 * are drawn from it like everything else. Counting only the resources made a
 * seat with nothing but Papier und Tuch untouchable, and worse: an event that
 * asks somebody to draw a card then had nobody to ask, and the card could never
 * be answered. Three of two hundred settings ran into exactly that.
 */
export function holdsCards(game: CatanGame, seat: number): boolean {
  const player = game.players[seat];
  return player.cards + (playingRitter(game) ? goodsSize(player.goods) : 0) > 0;
}

/** What kind of answer an event wants from the seat it is asking. */
export type EventAsk = "sort" | "road" | "victim" | "gift";

/** What each event asks for. */
export const EVENT_ASK: Readonly<Record<EventKind, EventAsk | null>> = {
  guteNachbarschaft: "sort",
  ertragreichesJahr: "sort",
  ritterturnier: "sort",
  ruhigeSee: "sort",
  erdbeben: "road",
  handelsvorteil: "victim",
  konflikt: "victim",
  nachbarschaftshilfe: "gift",
  schoenerTag: null,
  raeuberueberfall: null,
  seuche: null,
  rueckzug: null,
  jahreswechsel: null,
};

/** Whether a resource may be chosen freely, or only one already held. */
export function fromOwnHand(kind: EventKind): boolean {
  return kind === "guteNachbarschaft" || kind === "nachbarschaftshilfe";
}

/** What each card is called, for the log and the screen. */
export const EVENT_NAMES: Readonly<Record<EventKind, string>> = {
  schoenerTag: "Ein schöner Tag",
  raeuberueberfall: "Räuberüberfall",
  seuche: "Seuche",
  erdbeben: "Erdbeben",
  guteNachbarschaft: "Gute Nachbarschaft",
  ritterturnier: "Ritterturnier",
  handelsvorteil: "Handelsvorteil",
  ruhigeSee: "Ruhige See",
  rueckzug: "Rückzug des Räubers",
  nachbarschaftshilfe: "Nachbarschaftshilfe",
  konflikt: "Konflikt",
  ertragreichesJahr: "Ertragreiches Jahr",
  jahreswechsel: "Jahreswechsel",
};

/** What each card does, in one line. */
export const EVENT_TEXTS: Readonly<Record<EventKind, string>> = {
  schoenerTag: "Kein Ereignis. Die Rohstoffe werden normal ausgeschüttet.",
  raeuberueberfall:
    "Wie eine gewürfelte 7: abgeben, Räuber versetzen, 1 Karte ziehen.",
  seuche: "Alle erhalten für jede ihrer Städte nur 1 Rohstoff.",
  erdbeben: "Alle drehen 1 eigene Straße quer. Reparatur: 1 Holz + 1 Lehm.",
  guteNachbarschaft: "Alle geben der Person links neben sich 1 Handkarte.",
  ritterturnier:
    "Wer die meisten Ritter ausgespielt hat, nimmt 1 Rohstoff aus dem Vorrat.",
  handelsvorteil:
    "Wer die Längste Handelsroute hat, zieht bei jemandem 1 Karte.",
  ruhigeSee:
    "Wer die meisten Gebäude an Häfen hat, nimmt 1 Rohstoff aus dem Vorrat.",
  rueckzug: "Der Räuber geht zurück auf die Wüste. Es wird nichts gezogen.",
  nachbarschaftshilfe:
    "Wer die meisten Siegpunkte hat, schenkt jemandem mit weniger 1 Karte.",
  konflikt: "Wer alleine die meisten Ritter hat, zieht bei jemandem 1 Karte.",
  ertragreichesJahr: "Alle nehmen 1 Rohstoff ihrer Wahl aus dem Vorrat.",
  jahreswechsel: "Der Stapel wird neu gemischt.",
};
