/**
 * The German terms a player may be asked to picture.
 *
 * @module
 * @remarks
 * A hand-picked list: mostly concrete, drawable things, plus a handful of
 * deliberately harder prompts - activities ("tauchen"), properties ("rund") and
 * ideas ("Trauer") - so not every round is a still life. Kept as one flat list
 * the round draws from with the seeded generator, so a game replays identically
 * from its seed and the rules stay testable.
 *
 * The seeding is not what keeps the words secret - the candidate list is public
 * by design, and each player's own term travels in their private hand. What
 * keeps the rest hidden is simply that the base seed never leaves the host.
 *
 * Every entry must be unique: a round deals the terms and the decoys in one
 * draw, and a word listed twice could be dealt twice - handing two players the
 * same term, or making a decoy somebody's real term. {@link words.test.ts}
 * guards this.
 */
import { randomInt, type Random } from "./random";

/** All terms, in no particular order. */
export const KRAKEL_WORDS: readonly string[] = [
  "Surfbrett",
  "Schneeflocke",
  "Wein",
  "Säge",
  "Riesenrad",
  "Hammer",
  "Einkaufswagen",
  "Schreibtisch",
  "Korkenzieher",
  "Skateboard",
  "Textmarker",
  "Dorf",
  "Bär",
  "lesen",
  "Zebra",
  "Raupe",
  "wandern",
  "Ostern",
  "Wasserhahn",
  "Flasche",
  "Pinguin",
  "Kamel",
  "Ernte",
  "Regenwurm",
  "Wahlplakat",
  "Boot",
  "Klavier",
  "Mumie",
  "Leuchtturm",
  "Kopfhörer",
  "Golf",
  "Jagd",
  "Fledermaus",
  "Baumwipfel",
  "Frosch",
  "Terrarium",
  "Badminton",
  "Auge",
  "Tischtennis",
  "Buch",
  "Blume",
  "Tannenbaum",
  "Clown",
  "Flöte",
  "Axt",
  "Palme",
  "Dach",
  "Ratte",
  "Blitzschlag",
  "Harfe",
  "Eule",
  "Obst",
  "Wald",
  "Spaghetti",
  "Trommel",
  "Löwe",
  "Großstadt",
  "Mülleimer",
  "Schornstein",
  "Kastanie",
  "Hängematte",
  "Toaster",
  "Fahrrad",
  "Kaulquappe",
  "Segelboot",
  "Badezimmer",
  "Schaumbad",
  "Kälbchen",
  "Casino",
  "Nudelsieb",
  "Burg",
  "Ski",
  "Tornado",
  "Brille",
  "Planet",
  "Schaukelpferd",
  "Laubhaufen",
  "Hai",
  "Schlagzeug",
  "Mond",
  "Laptop",
  "Augenklappe",
  "Kolibri",
  "Bohrmaschine",
  "Verkehrsschild",
  "Bart",
  "Trauer",
  "Igel",
  "Nachos",
  "Nase",
  "Krankenhaus",
  "Planschbecken",
  "Fußball",
  "Stifte",
  "Ladekabel",
  "Orangensaft",
  "Brot",
  "Eisenbahn",
  "Entfernung",
  "Ampel",
  "Hochzeitstorte",
  "Schatzkarte",
  "tauchen",
  "Zirkus",
  "Erste Hilfe",
  "Schlange",
  "Wolle",
  "Gemüse",
  "Wippe",
  "lachen",
  "Jacke",
  "Getreide",
  "Chilischote",
  "Computer",
  "Rakete",
  "Schere",
  "Sonnenschirm",
  "Vorhänge",
  "Würfelzucker",
  "Apfel",
  "Kirchturmuhr",
  "Koffer",
  "Sonnenblume",
  "Sterne",
  "Käse",
  "Tennis",
  "Feuerwehr",
  "Eisdiele",
  "Zimmerpflanze",
  "Sessellift",
  "Basketball",
  "Radiergummi",
  "Halloween",
  "Blatt",
  "Säule",
  "Tischdecke",
  "Balkon",
  "Weihnachtsbaumkugel",
  "Turm",
  "Lasso",
  "Wäschekorb",
  "Tastatur",
  "spielen",
  "Flamingo",
  "LKW",
  "Mixer",
  "Lavalampe",
  "Eiffelturm",
  "Schatz",
  "Geld",
  "Pasta",
  "Motorrad",
  "Fotografie",
  "Alkohol",
  "Notenschlüssel",
  "Wetter",
  "Taschenmesser",
  "Kajak",
  "Busch",
  "Auto",
  "Vogelscheuche",
  "Zug",
  "Luftballon",
  "Schmetterling",
  "Schrank",
  "Urlaub",
  "Schlamm",
  "Seepferdchen",
  "Wurm",
  "Lesezeichen",
  "Standuhr",
  "Jetski",
  "Postkarte",
  "Strandkorb",
  "Malerei",
  "Seerose",
  "Oase",
  "Krawatte",
  "England",
  "Nordpol",
  "Musik",
  "Papagei",
  "Teppich",
  "Kuhglocke",
  "Heißluftballon",
  "Nachtisch",
  "Himmel",
  "Hubschrauber",
  "Herz",
  "Hund",
  "Babybett",
  "Schwimmbad",
  "Abendkleid",
  "Körper",
  "Deutschland",
  "Statue",
  "Skelett",
  "Waschmaschine",
  "Berggipfel",
  "Winter",
  "Aquarium",
  "Theater",
  "Euter",
  "Geschenk",
  "Teetasse",
  "Laterne",
  "Rucksack",
  "Angel",
  "Schal",
  "Handball",
  "Stempel",
  "Netz",
  "Schlittschuh",
  "Hornisse",
  "Müllhalde",
  "Schokolade",
  "Flugzeug",
  "Strudel",
  "Pizza",
  "Tausendfüßler",
  "rund",
  "Fallschirm",
  "Kran",
  "Geist",
  "Strauß",
  "Wüste",
  "behaart",
  "Gitarre",
  "hüpfen",
  "Wegweiser",
  "Seifenblase",
  "Hampelmann",
  "Kaffee",
  "Fackel",
  "fliegen",
  "Karte",
  "Tür",
  "Essen",
];

/**
 * Draws a number of distinct terms, avoiding the already used ones.
 *
 * @param random - the seeded generator to draw from
 * @param count - how many terms to deal
 * @param used - the terms already played this game
 * @returns that many distinct terms
 * @remarks
 * Draws from the still-unused terms; once those run out (a long game) it falls
 * back to the full list, so the round is always dealt in full. The terms within
 * one draw are always distinct - two players never share a word, and a decoy is
 * never also somebody's term.
 */
export function pickWords(
  random: Random,
  count: number,
  used: readonly string[],
): string[] {
  const fresh = KRAKEL_WORDS.filter((word) => !used.includes(word));
  const pool = fresh.length >= count ? [...fresh] : [...KRAKEL_WORDS];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(...pool.splice(randomInt(random, pool.length), 1));
  }
  return picked;
}

/**
 * Shuffles a list with the seeded generator (Fisher-Yates).
 *
 * @param random - the seeded generator to draw from
 * @param words - the words to shuffle
 * @returns a new list in a shuffled order
 * @remarks
 * The candidate list must not betray which words are the real ones, so the
 * terms and the decoys are mixed before anybody sees them.
 */
export function shuffleWords(
  random: Random,
  words: readonly string[],
): string[] {
  const result = [...words];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
