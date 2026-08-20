/**
 * The codenames, and what each of them is about.
 *
 * @module
 * @remarks
 * The four hundred words of the printed game are somebody else's property and
 * only exist in English, so this is a German list of its own. Nothing about it
 * is a reading of the rulebook - it is simply the deck this version plays with,
 * and it can be lengthened at any time without touching anything else.
 *
 * The **tags** are the interesting part. A clue in Codenames is an idea, which
 * is exactly what a machine without a sense of language does not have. So every
 * word here carries one to three categories, and the computer spymaster gives
 * one of those as its clue: "Tier: 3". That is a narrower space of clues than a
 * person has, but it sets the same puzzle - five animals on the table, three of
 * them yours, and one of them might be the assassin.
 *
 * Two things follow from that and are worth keeping true when the list grows:
 *
 * - **Every tag needs enough words**, or the computer runs out of clues. Say
 *   eight, spread over the list rather than clumped together.
 * - **Overlap is the point.** A word that sits in two categories is what makes
 *   a clue risky, and a list where every word belongs to exactly one obvious
 *   group would play itself.
 */

/** A category a word can belong to. */
export type Tag =
  | "tier"
  | "pflanze"
  | "essen"
  | "trinken"
  | "koerper"
  | "kleidung"
  | "haus"
  | "moebel"
  | "werkzeug"
  | "fahrzeug"
  | "wasser"
  | "himmel"
  | "wetter"
  | "musik"
  | "sport"
  | "schule"
  | "beruf"
  | "geld"
  | "technik"
  | "metall"
  | "zeit"
  | "maerchen"
  | "krieg"
  | "feuer"
  | "kaelte"
  | "natur"
  | "spiel";

/** What each category is called when the computer gives it as a clue. */
export const TAG_NAMES: Readonly<Record<Tag, string>> = {
  tier: "Tier",
  pflanze: "Pflanze",
  essen: "Essen",
  trinken: "Getränk",
  koerper: "Körper",
  kleidung: "Kleidung",
  haus: "Haus",
  moebel: "Möbel",
  werkzeug: "Werkzeug",
  fahrzeug: "Fahrzeug",
  wasser: "Wasser",
  himmel: "Himmel",
  wetter: "Wetter",
  musik: "Musik",
  sport: "Sport",
  schule: "Schule",
  beruf: "Beruf",
  geld: "Geld",
  technik: "Technik",
  metall: "Metall",
  zeit: "Zeit",
  maerchen: "Märchen",
  krieg: "Krieg",
  feuer: "Feuer",
  kaelte: "Kälte",
  natur: "Natur",
  spiel: "Spiel",
};

/** One codename and the categories it belongs to. */
export type WordEntry = {
  readonly word: string;
  readonly tags: readonly Tag[];
};

/**
 * The deck of codenames.
 *
 * @remarks
 * Written out rather than generated, because the tags are judgements and a
 * judgement has to be made one word at a time. A HAI is an animal and it is
 * water; a DRACHE is an animal and a fairy tale; a PINGUIN is an animal and the
 * cold. Those second tags are where the game lives.
 *
 * One rule holds the whole thing together and is easy to break by accident:
 * **no codename may be the name of a category.** A clue may not be a word
 * lying face up on the table, so a word that is its own category has exactly
 * one clue and it is illegal - the computer spymaster would be left with
 * nothing to say. That is why this list has FLAMME and no FEUER.
 */
export const WORDS: readonly WordEntry[] = [
  { word: "HUND", tags: ["tier"] },
  { word: "KATZE", tags: ["tier"] },
  { word: "PFERD", tags: ["tier", "sport"] },
  { word: "MAUS", tags: ["tier", "technik"] },
  { word: "ELEFANT", tags: ["tier"] },
  { word: "LÖWE", tags: ["tier", "krieg"] },
  { word: "ADLER", tags: ["tier", "himmel"] },
  { word: "HAI", tags: ["tier", "wasser"] },
  { word: "WAL", tags: ["tier", "wasser"] },
  { word: "BIENE", tags: ["tier", "essen"] },
  { word: "SPINNE", tags: ["tier"] },
  { word: "SCHLANGE", tags: ["tier"] },
  { word: "FROSCH", tags: ["tier", "maerchen"] },
  { word: "BÄR", tags: ["tier", "natur"] },
  { word: "WOLF", tags: ["tier", "maerchen"] },
  { word: "FUCHS", tags: ["tier", "natur"] },
  { word: "EULE", tags: ["tier", "schule"] },
  { word: "PINGUIN", tags: ["tier", "kaelte"] },
  { word: "KROKODIL", tags: ["tier", "wasser"] },
  { word: "AMEISE", tags: ["tier"] },
  { word: "KUH", tags: ["tier", "essen"] },
  { word: "HUHN", tags: ["tier", "essen"] },
  { word: "FISCH", tags: ["tier", "wasser", "essen"] },
  { word: "DRACHE", tags: ["tier", "maerchen", "feuer"] },
  { word: "EINHORN", tags: ["tier", "maerchen"] },
  { word: "TAUBE", tags: ["tier", "himmel"] },

  { word: "BAUM", tags: ["pflanze", "natur"] },
  { word: "BLUME", tags: ["pflanze"] },
  { word: "ROSE", tags: ["pflanze", "maerchen"] },
  { word: "GRAS", tags: ["pflanze", "sport"] },
  { word: "PILZ", tags: ["pflanze", "essen"] },
  { word: "KAKTUS", tags: ["pflanze", "natur"] },
  { word: "TANNE", tags: ["pflanze", "kaelte"] },
  { word: "EICHE", tags: ["pflanze", "natur"] },
  { word: "BLATT", tags: ["pflanze", "schule"] },
  { word: "WURZEL", tags: ["pflanze", "schule"] },
  { word: "WALD", tags: ["pflanze", "natur", "maerchen"] },

  { word: "BROT", tags: ["essen"] },
  { word: "KÄSE", tags: ["essen"] },
  { word: "APFEL", tags: ["essen", "pflanze"] },
  { word: "EI", tags: ["essen"] },
  { word: "SUPPE", tags: ["essen"] },
  { word: "KUCHEN", tags: ["essen", "beruf"] },
  { word: "ZUCKER", tags: ["essen"] },
  { word: "SALZ", tags: ["essen", "wasser"] },
  { word: "PFEFFER", tags: ["essen"] },
  { word: "HONIG", tags: ["essen", "tier"] },
  { word: "NUDEL", tags: ["essen"] },
  { word: "SCHOKOLADE", tags: ["essen"] },
  { word: "BUTTER", tags: ["essen"] },
  { word: "WURST", tags: ["essen"] },
  { word: "BANANE", tags: ["essen", "pflanze"] },
  { word: "ZITRONE", tags: ["essen", "pflanze"] },
  { word: "KIRSCHE", tags: ["essen", "pflanze"] },
  { word: "KARTOFFEL", tags: ["essen", "pflanze"] },

  { word: "KAFFEE", tags: ["trinken"] },
  { word: "TEE", tags: ["trinken"] },
  { word: "MILCH", tags: ["trinken", "tier"] },
  { word: "BIER", tags: ["trinken"] },
  { word: "WEIN", tags: ["trinken", "pflanze"] },
  { word: "SAFT", tags: ["trinken", "essen"] },
  { word: "BRUNNEN", tags: ["trinken", "wasser", "maerchen"] },
  { word: "FLASCHE", tags: ["trinken", "spiel"] },
  { word: "TASSE", tags: ["trinken", "haus"] },

  { word: "HAND", tags: ["koerper"] },
  { word: "FUSS", tags: ["koerper", "sport"] },
  { word: "AUGE", tags: ["koerper"] },
  { word: "OHR", tags: ["koerper", "musik"] },
  { word: "HERZ", tags: ["koerper", "spiel"] },
  { word: "KOPF", tags: ["koerper"] },
  { word: "ZAHN", tags: ["koerper", "werkzeug"] },
  { word: "HAAR", tags: ["koerper"] },
  { word: "KNOCHEN", tags: ["koerper", "tier"] },
  { word: "BLUT", tags: ["koerper"] },
  { word: "NASE", tags: ["koerper"] },
  { word: "RÜCKEN", tags: ["koerper", "natur"] },
  { word: "ARM", tags: ["koerper", "geld"] },
  { word: "FINGER", tags: ["koerper"] },

  { word: "HUT", tags: ["kleidung"] },
  { word: "SCHUH", tags: ["kleidung"] },
  { word: "MANTEL", tags: ["kleidung", "kaelte"] },
  { word: "HEMD", tags: ["kleidung"] },
  { word: "HOSE", tags: ["kleidung"] },
  { word: "SOCKE", tags: ["kleidung"] },
  { word: "KRAWATTE", tags: ["kleidung", "beruf"] },
  { word: "HANDSCHUH", tags: ["kleidung", "kaelte", "sport"] },
  { word: "GÜRTEL", tags: ["kleidung", "sport"] },
  { word: "KLEID", tags: ["kleidung", "maerchen"] },
  { word: "KNOPF", tags: ["kleidung", "technik"] },
  { word: "KRONE", tags: ["kleidung", "maerchen", "koerper"] },

  { word: "TÜR", tags: ["haus"] },
  { word: "FENSTER", tags: ["haus", "technik"] },
  { word: "DACH", tags: ["haus"] },
  { word: "TREPPE", tags: ["haus"] },
  { word: "KELLER", tags: ["haus", "kaelte"] },
  { word: "SCHLÜSSEL", tags: ["haus", "musik"] },
  { word: "SCHLOSS", tags: ["haus", "maerchen"] },
  { word: "MAUER", tags: ["haus", "krieg"] },
  { word: "GARTEN", tags: ["haus", "pflanze"] },
  { word: "ZAUN", tags: ["haus", "natur"] },
  { word: "BALKON", tags: ["haus"] },
  { word: "SCHORNSTEIN", tags: ["haus", "feuer"] },

  { word: "TISCH", tags: ["moebel", "essen"] },
  { word: "STUHL", tags: ["moebel"] },
  { word: "BETT", tags: ["moebel", "wasser"] },
  { word: "SCHRANK", tags: ["moebel"] },
  { word: "SOFA", tags: ["moebel"] },
  { word: "LAMPE", tags: ["moebel", "maerchen"] },
  { word: "SPIEGEL", tags: ["moebel", "maerchen"] },
  { word: "TEPPICH", tags: ["moebel", "maerchen"] },
  { word: "REGAL", tags: ["moebel", "schule"] },

  { word: "HAMMER", tags: ["werkzeug", "musik"] },
  { word: "NAGEL", tags: ["werkzeug", "koerper"] },
  { word: "SÄGE", tags: ["werkzeug"] },
  { word: "SCHRAUBE", tags: ["werkzeug", "metall"] },
  { word: "ZANGE", tags: ["werkzeug", "tier"] },
  { word: "LEITER", tags: ["werkzeug", "beruf"] },
  { word: "BOHRER", tags: ["werkzeug", "beruf"] },
  { word: "SCHERE", tags: ["werkzeug", "spiel"] },
  { word: "MESSER", tags: ["werkzeug", "essen", "krieg"] },
  { word: "PINSEL", tags: ["werkzeug", "beruf"] },
  { word: "SCHAUFEL", tags: ["werkzeug", "natur"] },
  { word: "AXT", tags: ["werkzeug", "krieg"] },

  { word: "AUTO", tags: ["fahrzeug"] },
  { word: "ZUG", tags: ["fahrzeug", "spiel"] },
  { word: "SCHIFF", tags: ["fahrzeug", "wasser"] },
  { word: "FLUGZEUG", tags: ["fahrzeug", "himmel"] },
  { word: "FAHRRAD", tags: ["fahrzeug", "sport"] },
  { word: "BUS", tags: ["fahrzeug"] },
  { word: "RAKETE", tags: ["fahrzeug", "himmel", "krieg"] },
  { word: "TRAKTOR", tags: ["fahrzeug", "natur"] },
  { word: "KUTSCHE", tags: ["fahrzeug", "maerchen"] },
  { word: "SCHLITTEN", tags: ["fahrzeug", "kaelte", "sport"] },

  { word: "MEER", tags: ["wasser", "natur"] },
  { word: "FLUSS", tags: ["wasser", "natur"] },
  { word: "SEE", tags: ["wasser", "natur"] },
  { word: "WELLE", tags: ["wasser", "technik"] },
  { word: "INSEL", tags: ["wasser", "natur"] },
  { word: "HAFEN", tags: ["wasser", "beruf"] },
  { word: "ANKER", tags: ["wasser", "metall"] },
  { word: "SEGEL", tags: ["wasser", "sport"] },
  { word: "TAUCHER", tags: ["wasser", "beruf"] },

  { word: "SONNE", tags: ["himmel", "wetter", "feuer"] },
  { word: "MOND", tags: ["himmel", "zeit"] },
  { word: "STERN", tags: ["himmel", "spiel"] },
  { word: "WOLKE", tags: ["himmel", "wetter"] },
  { word: "PLANET", tags: ["himmel", "natur"] },
  { word: "KOMET", tags: ["himmel", "feuer"] },
  { word: "SATELLIT", tags: ["himmel", "technik"] },

  { word: "REGEN", tags: ["wetter", "wasser"] },
  { word: "SCHNEE", tags: ["wetter", "kaelte"] },
  { word: "STURM", tags: ["wetter", "krieg"] },
  { word: "BLITZ", tags: ["wetter", "technik"] },
  { word: "DONNER", tags: ["wetter", "musik"] },
  { word: "NEBEL", tags: ["wetter", "natur"] },
  { word: "WIND", tags: ["wetter", "technik"] },
  { word: "HAGEL", tags: ["wetter", "kaelte"] },
  { word: "REGENBOGEN", tags: ["wetter", "himmel", "maerchen"] },

  { word: "GITARRE", tags: ["musik"] },
  { word: "KLAVIER", tags: ["musik", "moebel"] },
  { word: "TROMPETE", tags: ["musik", "metall", "krieg"] },
  { word: "TROMMEL", tags: ["musik", "krieg"] },
  { word: "NOTE", tags: ["musik", "schule"] },
  { word: "LIED", tags: ["musik"] },
  { word: "CHOR", tags: ["musik", "schule"] },
  { word: "GEIGE", tags: ["musik"] },
  { word: "FLÖTE", tags: ["musik", "maerchen"] },
  { word: "KONZERT", tags: ["musik", "geld"] },

  { word: "BALL", tags: ["sport", "spiel", "maerchen"] },
  { word: "TOR", tags: ["sport", "haus"] },
  { word: "NETZ", tags: ["sport", "technik", "tier"] },
  { word: "SKI", tags: ["sport", "kaelte"] },
  { word: "MEDAILLE", tags: ["sport", "metall", "krieg"] },
  { word: "STADION", tags: ["sport", "haus"] },
  { word: "RENNEN", tags: ["sport", "fahrzeug"] },
  { word: "POKAL", tags: ["sport", "metall", "trinken"] },
  { word: "TURNIER", tags: ["sport", "maerchen"] },

  { word: "TAFEL", tags: ["schule", "essen"] },
  { word: "KREIDE", tags: ["schule", "natur"] },
  { word: "BUCH", tags: ["schule", "maerchen"] },
  { word: "HEFT", tags: ["schule"] },
  { word: "STIFT", tags: ["schule", "beruf"] },
  { word: "ZEUGNIS", tags: ["schule"] },
  { word: "PAUSE", tags: ["schule", "zeit"] },
  { word: "LEHRER", tags: ["schule", "beruf"] },
  { word: "PRÜFUNG", tags: ["schule", "zeit"] },

  { word: "ARZT", tags: ["beruf", "koerper"] },
  { word: "KOCH", tags: ["beruf", "essen"] },
  { word: "RICHTER", tags: ["beruf", "sport"] },
  { word: "PILOT", tags: ["beruf", "himmel"] },
  { word: "GÄRTNER", tags: ["beruf", "pflanze"] },
  { word: "BÄCKER", tags: ["beruf", "essen"] },
  { word: "SOLDAT", tags: ["beruf", "krieg"] },
  { word: "SCHMIED", tags: ["beruf", "metall", "feuer"] },
  { word: "KAPITÄN", tags: ["beruf", "wasser", "sport"] },

  { word: "BANK", tags: ["geld", "moebel"] },
  { word: "MÜNZE", tags: ["geld", "metall"] },
  { word: "GOLD", tags: ["geld", "metall", "maerchen"] },
  { word: "TRESOR", tags: ["geld", "metall"] },
  { word: "RECHNUNG", tags: ["geld", "schule"] },
  { word: "KASSE", tags: ["geld"] },
  { word: "SCHATZ", tags: ["geld", "maerchen"] },
  { word: "DIAMANT", tags: ["geld", "natur"] },

  { word: "COMPUTER", tags: ["technik", "schule"] },
  { word: "ROBOTER", tags: ["technik", "metall"] },
  { word: "MOTOR", tags: ["technik", "fahrzeug"] },
  { word: "KABEL", tags: ["technik"] },
  { word: "ANTENNE", tags: ["technik", "tier"] },
  { word: "BATTERIE", tags: ["technik", "krieg"] },
  { word: "TELEFON", tags: ["technik"] },
  { word: "KAMERA", tags: ["technik"] },

  { word: "EISEN", tags: ["metall", "kleidung"] },
  { word: "SILBER", tags: ["metall", "geld"] },
  { word: "KUPFER", tags: ["metall"] },
  { word: "STAHL", tags: ["metall", "krieg"] },
  { word: "ROST", tags: ["metall", "wetter"] },
  { word: "MAGNET", tags: ["metall", "technik"] },

  { word: "UHR", tags: ["zeit", "technik"] },
  { word: "KALENDER", tags: ["zeit"] },
  { word: "MINUTE", tags: ["zeit"] },
  { word: "NACHT", tags: ["zeit", "himmel"] },
  { word: "WINTER", tags: ["zeit", "kaelte"] },
  { word: "SOMMER", tags: ["zeit", "wetter"] },
  { word: "HERBST", tags: ["zeit", "wetter"] },

  { word: "HEXE", tags: ["maerchen"] },
  { word: "ZAUBERER", tags: ["maerchen"] },
  { word: "RITTER", tags: ["maerchen", "krieg"] },
  { word: "PRINZESSIN", tags: ["maerchen"] },
  { word: "ZWERG", tags: ["maerchen"] },
  { word: "RIESE", tags: ["maerchen"] },
  { word: "GEIST", tags: ["maerchen", "koerper"] },

  { word: "SCHWERT", tags: ["krieg", "metall"] },
  { word: "SCHILD", tags: ["krieg", "technik"] },
  { word: "KANONE", tags: ["krieg", "metall"] },
  { word: "PANZER", tags: ["krieg", "fahrzeug", "tier"] },
  { word: "BOMBE", tags: ["krieg", "feuer"] },
  { word: "GENERAL", tags: ["krieg", "beruf"] },
  { word: "FESTUNG", tags: ["krieg", "haus"] },
  { word: "PFEIL", tags: ["krieg", "sport"] },
  { word: "BOGEN", tags: ["krieg", "schule", "musik"] },

  { word: "FLAMME", tags: ["feuer"] },
  { word: "RAUCH", tags: ["feuer", "wetter"] },
  { word: "ASCHE", tags: ["feuer", "pflanze"] },
  { word: "KERZE", tags: ["feuer", "haus"] },
  { word: "OFEN", tags: ["feuer", "haus", "essen"] },
  { word: "VULKAN", tags: ["feuer", "natur"] },
  { word: "FUNKE", tags: ["feuer", "technik"] },

  { word: "EIS", tags: ["kaelte", "essen", "wasser"] },
  { word: "GLETSCHER", tags: ["kaelte", "natur", "wasser"] },
  { word: "FROST", tags: ["kaelte", "wetter"] },
  { word: "IGLU", tags: ["kaelte", "haus"] },

  { word: "BERG", tags: ["natur", "sport"] },
  { word: "TAL", tags: ["natur"] },
  { word: "WÜSTE", tags: ["natur", "wetter"] },
  { word: "HÖHLE", tags: ["natur", "maerchen"] },
  { word: "STEIN", tags: ["natur", "spiel"] },
  { word: "SAND", tags: ["natur", "zeit"] },
  { word: "ERDE", tags: ["natur", "himmel"] },
  { word: "QUELLE", tags: ["natur", "wasser", "schule"] },

  { word: "KARTE", tags: ["spiel", "schule"] },
  { word: "WÜRFEL", tags: ["spiel", "essen"] },
  { word: "PUPPE", tags: ["spiel", "maerchen"] },
  { word: "SCHACH", tags: ["spiel", "krieg"] },
  { word: "BRETT", tags: ["spiel", "sport"] },
  { word: "PUZZLE", tags: ["spiel"] },
  { word: "ZIRKUS", tags: ["spiel", "tier"] },
  { word: "CLOWN", tags: ["spiel", "beruf"] },
  { word: "BALLON", tags: ["spiel", "himmel"] },
];

/** Every tag there is, in the order they are declared above. */
export const TAGS: readonly Tag[] = Object.keys(TAG_NAMES) as Tag[];

/**
 * The words carrying a tag.
 *
 * @param tag - the category
 * @returns every codename in it
 */
export function wordsWithTag(tag: Tag): readonly string[] {
  return WORDS.filter((entry) => entry.tags.includes(tag)).map(
    (entry) => entry.word,
  );
}

/**
 * What a word is about.
 *
 * @param word - the codename
 * @returns its categories, or nothing for a word not in the list
 */
export function tagsOf(word: string): readonly Tag[] {
  return WORDS.find((entry) => entry.word === word)?.tags ?? [];
}
