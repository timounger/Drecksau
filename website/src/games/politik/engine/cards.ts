/**
 * Everything printed on the cards: themes, candidates, scandals, promises,
 * opposition cards and the government offices.
 *
 * @module
 * @remarks
 * Pure data, looked up by id. The game state only ever stores **ids**, never a
 * whole card: that keeps a saved game and a snapshot on the wire small, and it
 * means a card's wording can be fixed without invalidating anything already
 * stored.
 *
 * Ids start at 1 on purpose. Zero is the placeholder a redacted snapshot shows
 * where a card is none of the reader's business
 * ({@link ../multiplayer/adapter}), so it must never be a real card.
 */

/** The six policy fields the whole game turns on. */
export type Theme =
  "gesundheit" | "sicherheit" | "wirtschaft" | "umwelt" | "bildung" | "arbeit";

/** What a candidate is good at; every dice check names one of these. */
export type Ability = "manipulation" | "medien" | "popularitaet";

/** A ministry that pays victory points at the end of every Spielrunde. */
export type Office = "kanzleramt" | "finanzen" | "inneres" | "justiz";

/** One of the 22 people who can run for a party. */
export type Candidate = {
  readonly id: number;
  readonly name: string;
  /** Base strength in a campaign duel, before bonus, malus and scandals. */
  readonly campaignPoints: number;
  /** Three points spread over the abilities; added to a dice check. */
  readonly abilities: Readonly<Record<Ability, number>>;
};

/** A skeleton in a candidate's cupboard. */
export type Scandal = {
  readonly id: number;
  readonly title: string;
  /** Campaign points the candidate loses while this scandal is uncovered. */
  readonly penalty: number;
};

/** An election promise, worth victory points once a majority passes it. */
export type Promise = {
  readonly id: number;
  readonly theme: Theme;
  readonly title: string;
  readonly points: number;
};

/** What playing an opposition card does. */
export type OppositionEffect =
  /** The government scores nothing at the end of this Spielrunde. */
  | "noGovernmentPoints"
  /** One government member of your choice loses victory points. */
  | "drainPoints"
  /** Uncover one scandal of a player of your choice. */
  | "revealScandal"
  /** Uncover one scandal of every government member. */
  | "revealGovernmentScandals"
  /** Take seats from whoever holds the most. */
  | "seatsFromLeader"
  /** Take seats from a player of your choice. */
  | "seatsFromTarget"
  /** Put a malus on a candidate of your choice. */
  | "malusOnTarget"
  /** Put a bonus on your own candidate. */
  | "bonusOnSelf"
  /** Change the current theme. */
  | "changeTheme"
  /** A player of your choice has to give up their candidate. */
  | "forceResign"
  /** Everyone outside the government scores. */
  | "pointsForOpposition"
  /** You score for the size of your own party. */
  | "pointsPerSeats";

/** What an opposition card needs before it can be played. */
export type OppositionTargeting =
  "none" | "player" | "governmentMember" | "theme";

/** One of the twelve opposition cards. */
export type OppositionCard = {
  readonly id: number;
  readonly title: string;
  readonly text: string;
  readonly effect: OppositionEffect;
  readonly targeting: OppositionTargeting;
  /** How much the effect moves - seats, points or malus, depending on it. */
  readonly amount: number;
};

/** One of the orientation cards: the themes a party campaigns on. */
export type Orientation = {
  readonly id: number;
  readonly themes: readonly Theme[];
};

/** A government office and what it is worth. */
export type OfficeCard = {
  readonly office: Office;
  readonly title: string;
  /** Victory points at the end of every Spielrunde. */
  readonly points: number;
  /** From this table size on, the office is in the game. */
  readonly minPlayers: number;
};

/** The themes in the order they are shown. */
export const THEMES: readonly Theme[] = [
  "gesundheit",
  "sicherheit",
  "wirtschaft",
  "umwelt",
  "bildung",
  "arbeit",
];

/** German label of every theme. */
export const THEME_LABELS: Readonly<Record<Theme, string>> = {
  gesundheit: "Gesundheit",
  sicherheit: "Sicherheit",
  wirtschaft: "Wirtschaft",
  umwelt: "Umwelt",
  bildung: "Bildung",
  arbeit: "Arbeit",
};

/** A small picture per theme, so a card is recognised without reading it. */
export const THEME_ICONS: Readonly<Record<Theme, string>> = {
  gesundheit: "\u{1FA7A}",
  sicherheit: "\u{1F6E1}\u{FE0F}",
  wirtschaft: "\u{1F4B6}",
  umwelt: "\u{1F33F}",
  bildung: "\u{1F393}",
  arbeit: "\u{1F477}",
};

/** The abilities in the order the candidate card lists them. */
export const ABILITIES: readonly Ability[] = [
  "manipulation",
  "medien",
  "popularitaet",
];

/** German label of every ability. */
export const ABILITY_LABELS: Readonly<Record<Ability, string>> = {
  manipulation: "Manipulation",
  medien: "Medien",
  popularitaet: "Popularität",
};

/** The government offices, best paid first. */
export const OFFICES: readonly OfficeCard[] = [
  {
    office: "kanzleramt",
    title: "Bundeskanzleramt",
    points: 3,
    minPlayers: 3,
  },
  { office: "finanzen", title: "Finanzministerium", points: 2, minPlayers: 3 },
  { office: "inneres", title: "Innenministerium", points: 2, minPlayers: 4 },
  { office: "justiz", title: "Justizministerium", points: 1, minPlayers: 5 },
];

/**
 * The offices in play at a given table size.
 *
 * @param playerCount - how many players sit at the table
 * @returns the office cards that are dealt, the rest leaves the game
 */
export function officesFor(playerCount: number): readonly OfficeCard[] {
  return OFFICES.filter((entry) => playerCount >= entry.minPlayers);
}

/**
 * Looks up one office card.
 *
 * @param office - the office to look up
 * @returns its card
 * @throws if the office does not exist
 */
export function officeCard(office: Office): OfficeCard {
  const found = OFFICES.find((entry) => entry.office === office);
  if (found === undefined) {
    throw new Error(`unknown office: ${office}`);
  }
  return found;
}

/** The orientation cards used from three players on - three themes each. */
const ORIENTATIONS_THREE: readonly Orientation[] = [
  { id: 1, themes: ["gesundheit", "sicherheit", "wirtschaft"] },
  { id: 2, themes: ["umwelt", "bildung", "arbeit"] },
  { id: 3, themes: ["arbeit", "umwelt", "sicherheit"] },
  { id: 4, themes: ["wirtschaft", "bildung", "gesundheit"] },
  { id: 5, themes: ["sicherheit", "bildung", "umwelt"] },
  { id: 6, themes: ["arbeit", "wirtschaft", "gesundheit"] },
];

/** The orientation cards for a full table of six - four themes each. */
const ORIENTATIONS_SIX: readonly Orientation[] = [
  { id: 7, themes: ["sicherheit", "arbeit", "wirtschaft", "umwelt"] },
  { id: 8, themes: ["gesundheit", "bildung", "umwelt", "arbeit"] },
  { id: 9, themes: ["wirtschaft", "gesundheit", "sicherheit", "bildung"] },
  { id: 10, themes: ["umwelt", "arbeit", "gesundheit", "wirtschaft"] },
  { id: 11, themes: ["bildung", "sicherheit", "umwelt", "gesundheit"] },
  { id: 12, themes: ["arbeit", "wirtschaft", "bildung", "sicherheit"] },
];

/** The table size from which the wider orientation cards are used. */
const WIDE_ORIENTATION_PLAYERS = 6;

/**
 * The orientation deck for a table size.
 *
 * @param playerCount - how many players sit at the table
 * @returns the six orientation cards that are shuffled and dealt
 * @remarks
 * A full table of six gets the four-theme cards, so a theme still comes up
 * often enough to be worth campaigning on when six parties share six fields.
 */
export function orientationsFor(playerCount: number): readonly Orientation[] {
  return playerCount >= WIDE_ORIENTATION_PLAYERS
    ? ORIENTATIONS_SIX
    : ORIENTATIONS_THREE;
}

/** The 22 candidates. */
export const CANDIDATES: readonly Candidate[] = [
  {
    id: 1,
    name: "Sascha van der Wuff",
    campaignPoints: 5,
    abilities: { manipulation: 1, medien: 1, popularitaet: 1 },
  },
  {
    id: 2,
    name: "Doris Feldmann",
    campaignPoints: 4,
    abilities: { manipulation: 0, medien: 2, popularitaet: 1 },
  },
  {
    id: 3,
    name: "Bruno Kettner",
    campaignPoints: 6,
    abilities: { manipulation: 2, medien: 1, popularitaet: 0 },
  },
  {
    id: 4,
    name: "Ines Waldegg",
    campaignPoints: 3,
    abilities: { manipulation: 0, medien: 1, popularitaet: 2 },
  },
  {
    id: 5,
    name: "Hannes Pribil",
    campaignPoints: 5,
    abilities: { manipulation: 2, medien: 0, popularitaet: 1 },
  },
  {
    id: 6,
    name: "Marlies Grubauer",
    campaignPoints: 4,
    abilities: { manipulation: 1, medien: 2, popularitaet: 0 },
  },
  {
    id: 7,
    name: "Toni Hafenscher",
    campaignPoints: 6,
    abilities: { manipulation: 1, medien: 0, popularitaet: 2 },
  },
  {
    id: 8,
    name: "Elif Aydin",
    campaignPoints: 4,
    abilities: { manipulation: 1, medien: 1, popularitaet: 1 },
  },
  {
    id: 9,
    name: "Rudi Stangl",
    campaignPoints: 3,
    abilities: { manipulation: 3, medien: 0, popularitaet: 0 },
  },
  {
    id: 10,
    name: "Verena Lohmayr",
    campaignPoints: 5,
    abilities: { manipulation: 0, medien: 3, popularitaet: 0 },
  },
  {
    id: 11,
    name: "Kurt Zischka",
    campaignPoints: 4,
    abilities: { manipulation: 0, medien: 0, popularitaet: 3 },
  },
  {
    id: 12,
    name: "Nadja Brenner",
    campaignPoints: 6,
    abilities: { manipulation: 2, medien: 1, popularitaet: 0 },
  },
  {
    id: 13,
    name: "Ferdinand Ostermann",
    campaignPoints: 3,
    abilities: { manipulation: 1, medien: 1, popularitaet: 1 },
  },
  {
    id: 14,
    name: "Sibylle Kranz",
    campaignPoints: 5,
    abilities: { manipulation: 1, medien: 2, popularitaet: 0 },
  },
  {
    id: 15,
    name: "Milan Petrovic",
    campaignPoints: 4,
    abilities: { manipulation: 2, medien: 1, popularitaet: 0 },
  },
  {
    id: 16,
    name: "Gerti Aumayr",
    campaignPoints: 6,
    abilities: { manipulation: 0, medien: 1, popularitaet: 2 },
  },
  {
    id: 17,
    name: "Leo Wimmer",
    campaignPoints: 3,
    abilities: { manipulation: 2, medien: 0, popularitaet: 1 },
  },
  {
    id: 18,
    name: "Anneliese Storch",
    campaignPoints: 5,
    abilities: { manipulation: 0, medien: 2, popularitaet: 1 },
  },
  {
    id: 19,
    name: "Piet Vogelsang",
    campaignPoints: 4,
    abilities: { manipulation: 1, medien: 0, popularitaet: 2 },
  },
  {
    id: 20,
    name: "Zeynep Kilic",
    campaignPoints: 6,
    abilities: { manipulation: 1, medien: 1, popularitaet: 1 },
  },
  {
    id: 21,
    name: "Otto Riedler",
    campaignPoints: 3,
    abilities: { manipulation: 0, medien: 3, popularitaet: 0 },
  },
  {
    id: 22,
    name: "Franziska Habermayr",
    campaignPoints: 5,
    abilities: { manipulation: 2, medien: 1, popularitaet: 0 },
  },
];

/** The 24 scandals. */
export const SCANDALS: readonly Scandal[] = [
  { id: 1, title: "Dienstwagen privat genutzt", penalty: 1 },
  { id: 2, title: "Doktorarbeit abgeschrieben", penalty: 2 },
  { id: 3, title: "Spendenaffäre", penalty: 3 },
  { id: 4, title: "Steuern hinterzogen", penalty: 3 },
  { id: 5, title: "Peinliches Interview", penalty: 1 },
  { id: 6, title: "Alte Chatprotokolle", penalty: 2 },
  { id: 7, title: "Nebenjob verschwiegen", penalty: 2 },
  { id: 8, title: "Urlaub beim Lobbyisten", penalty: 3 },
  { id: 9, title: "Zitat frei erfunden", penalty: 1 },
  { id: 10, title: "Postenschacher", penalty: 3 },
  { id: 11, title: "Wahlkampfkosten überzogen", penalty: 2 },
  { id: 12, title: "Fotos vom Betriebsfest", penalty: 1 },
  { id: 13, title: "Beraterverträge an Freunde", penalty: 3 },
  { id: 14, title: "Vergessene Immobilie", penalty: 2 },
  { id: 15, title: "Parkstrafen nicht bezahlt", penalty: 1 },
  { id: 16, title: "Falsche Reisekosten", penalty: 2 },
  { id: 17, title: "Geheimes Tonband", penalty: 3 },
  { id: 18, title: "Handy im Plenum", penalty: 1 },
  { id: 19, title: "Ghostwriter für Reden", penalty: 2 },
  { id: 20, title: "Aktien im Ministerium", penalty: 3 },
  { id: 21, title: "Abstimmung verschlafen", penalty: 1 },
  { id: 22, title: "Streit im Parteivorstand", penalty: 2 },
  { id: 23, title: "Inserate gegen Berichte", penalty: 3 },
  { id: 24, title: "Unbedachter Kurznachrichten-Post", penalty: 1 },
];

/**
 * The election promises, eight per theme.
 *
 * @remarks
 * The printed game has six per theme. Eight is a deliberate deviation: at a
 * full table of six every theme sits on four orientation cards, so eight copies
 * are needed for everyone to be dealt their two per theme. See
 * `docs/games/politik/game-rules.md`.
 */
export const PROMISES: readonly Promise[] = [
  { id: 1, theme: "gesundheit", title: "Pflegereform", points: 4 },
  { id: 2, theme: "gesundheit", title: "Mehr Kassenärzte", points: 3 },
  { id: 3, theme: "gesundheit", title: "Kürzere Wartezeiten", points: 2 },
  { id: 4, theme: "gesundheit", title: "Gratis Zahnspange", points: 2 },
  { id: 5, theme: "gesundheit", title: "Neues Landeskrankenhaus", points: 4 },
  {
    id: 6,
    theme: "gesundheit",
    title: "Therapie auf Krankenschein",
    points: 3,
  },
  { id: 7, theme: "gesundheit", title: "Hausapotheken am Land", points: 2 },
  { id: 8, theme: "gesundheit", title: "Vorsorge für alle", points: 3 },

  {
    id: 9,
    theme: "sicherheit",
    title: "Mehr Polizei auf der Straße",
    points: 3,
  },
  { id: 10, theme: "sicherheit", title: "Kameras am Bahnhof", points: 2 },
  {
    id: 11,
    theme: "sicherheit",
    title: "Katastrophenschutz ausbauen",
    points: 3,
  },
  {
    id: 12,
    theme: "sicherheit",
    title: "Zentrum für Cybersicherheit",
    points: 4,
  },
  { id: 13, theme: "sicherheit", title: "Feuerwehr-Offensive", points: 2 },
  {
    id: 14,
    theme: "sicherheit",
    title: "Grenzkontrollen verstärken",
    points: 4,
  },
  { id: 15, theme: "sicherheit", title: "Sicheres Heimwegtelefon", points: 2 },
  { id: 16, theme: "sicherheit", title: "Neue Einsatzleitstelle", points: 3 },

  { id: 17, theme: "wirtschaft", title: "Lohnnebenkosten senken", points: 4 },
  { id: 18, theme: "wirtschaft", title: "Gründerfonds", points: 3 },
  { id: 19, theme: "wirtschaft", title: "Bürokratie abbauen", points: 2 },
  { id: 20, theme: "wirtschaft", title: "Industrie ansiedeln", points: 4 },
  { id: 21, theme: "wirtschaft", title: "Handwerksbonus", points: 2 },
  { id: 22, theme: "wirtschaft", title: "Digitalsteuer", points: 3 },
  { id: 23, theme: "wirtschaft", title: "Breitband bis ins Dorf", points: 3 },
  { id: 24, theme: "wirtschaft", title: "Messehalle sanieren", points: 2 },

  { id: 25, theme: "umwelt", title: "Nationalpark erweitern", points: 3 },
  { id: 26, theme: "umwelt", title: "Solaroffensive", points: 4 },
  { id: 27, theme: "umwelt", title: "Pfandsystem einführen", points: 2 },
  { id: 28, theme: "umwelt", title: "Bahnausbau", points: 4 },
  { id: 29, theme: "umwelt", title: "Flüsse renaturieren", points: 3 },
  { id: 30, theme: "umwelt", title: "Öffi-Ticket für alle", points: 2 },
  { id: 31, theme: "umwelt", title: "Moore wiedervernässen", points: 3 },
  { id: 32, theme: "umwelt", title: "Bäume in der Innenstadt", points: 2 },

  { id: 33, theme: "bildung", title: "Kleinere Klassen", points: 4 },
  { id: 34, theme: "bildung", title: "Ganztagsschulen", points: 3 },
  { id: 35, theme: "bildung", title: "Studium ohne Gebühren", points: 4 },
  { id: 36, theme: "bildung", title: "Digitale Klassenzimmer", points: 2 },
  { id: 37, theme: "bildung", title: "Lehrlingsoffensive", points: 3 },
  { id: 38, theme: "bildung", title: "Schulen sanieren", points: 2 },
  { id: 39, theme: "bildung", title: "Sommerkurse gegen Lücken", points: 2 },
  { id: 40, theme: "bildung", title: "Mehr Schulpsychologie", points: 3 },

  { id: 41, theme: "arbeit", title: "Mindestlohn anheben", points: 4 },
  { id: 42, theme: "arbeit", title: "Vier-Tage-Woche", points: 4 },
  { id: 43, theme: "arbeit", title: "Umschulung für Arbeitslose", points: 3 },
  { id: 44, theme: "arbeit", title: "Kinderbetreuung ausbauen", points: 3 },
  { id: 45, theme: "arbeit", title: "Pensionsreform", points: 2 },
  { id: 46, theme: "arbeit", title: "Recht auf Homeoffice", points: 2 },
  { id: 47, theme: "arbeit", title: "Pflegekräfte besser bezahlen", points: 3 },
  { id: 48, theme: "arbeit", title: "Betriebliche Weiterbildung", points: 2 },
];

/** The twelve opposition cards. */
export const OPPOSITION_CARDS: readonly OppositionCard[] = [
  {
    id: 1,
    title: "Misstrauensvotum",
    text: "Die Regierung erhält am Ende dieser Spielrunde keine Siegpunkte.",
    effect: "noGovernmentPoints",
    targeting: "none",
    amount: 0,
  },
  {
    id: 2,
    title: "Untersuchungsausschuss",
    text: "1 Regierungsmitglied deiner Wahl verliert 2 Siegpunkte.",
    effect: "drainPoints",
    targeting: "governmentMember",
    amount: 2,
  },
  {
    id: 3,
    title: "Enthüllung",
    text: "Decke 1 Skandal bei 1 Spieler:in deiner Wahl auf.",
    effect: "revealScandal",
    targeting: "player",
    amount: 1,
  },
  {
    id: 4,
    title: "Medienoffensive",
    text: "Decke bei jedem Regierungsmitglied 1 Skandal auf.",
    effect: "revealGovernmentScandals",
    targeting: "none",
    amount: 1,
  },
  {
    id: 5,
    title: "Protestwelle",
    text: "Nimm 2 Sitze von der Partei mit den meisten Sitzen.",
    effect: "seatsFromLeader",
    targeting: "none",
    amount: 2,
  },
  {
    id: 6,
    title: "Bürgerinitiative",
    text: "Nimm 2 Sitze von 1 Spieler:in deiner Wahl.",
    effect: "seatsFromTarget",
    targeting: "player",
    amount: 2,
  },
  {
    id: 7,
    title: "Skandalisierung",
    text: "1 Kandidat:in deiner Wahl erhält 2 Malus auf Wahlkampfpunkte.",
    effect: "malusOnTarget",
    targeting: "player",
    amount: 2,
  },
  {
    id: 8,
    title: "Basiskampagne",
    text: "Deine Kandidat:in erhält 2 Bonus auf Wahlkampfpunkte.",
    effect: "bonusOnSelf",
    targeting: "none",
    amount: 2,
  },
  {
    id: 9,
    title: "Themenwechsel",
    text: "Ändere das aktuelle Thema auf ein beliebiges anderes.",
    effect: "changeTheme",
    targeting: "theme",
    amount: 0,
  },
  {
    id: 10,
    title: "Rücktrittsforderung",
    text: "1 Spieler:in deiner Wahl muss die Kandidat:in ablegen.",
    effect: "forceResign",
    targeting: "player",
    amount: 0,
  },
  {
    id: 11,
    title: "Sammelbewegung",
    text: "Jede:r ohne Regierung-Karte erhält 2 Siegpunkte.",
    effect: "pointsForOpposition",
    targeting: "none",
    amount: 2,
  },
  {
    id: 12,
    title: "Populismus",
    text: "Du erhältst 1 Siegpunkt je 10 Sitze deiner Partei.",
    effect: "pointsPerSeats",
    targeting: "none",
    amount: 10,
  },
];

/**
 * Looks up a candidate.
 *
 * @param id - the card id
 * @returns the candidate, or null for the redaction placeholder
 */
export function candidateById(id: number): Candidate | null {
  return CANDIDATES.find((card) => card.id === id) ?? null;
}

/**
 * Looks up a scandal.
 *
 * @param id - the card id
 * @returns the scandal, or null for the redaction placeholder
 */
export function scandalById(id: number): Scandal | null {
  return SCANDALS.find((card) => card.id === id) ?? null;
}

/**
 * Looks up an election promise.
 *
 * @param id - the card id
 * @returns the promise, or null if there is no such card
 */
export function promiseById(id: number): Promise | null {
  return PROMISES.find((card) => card.id === id) ?? null;
}

/**
 * Looks up an opposition card.
 *
 * @param id - the card id
 * @returns the card, or null for the redaction placeholder
 */
export function oppositionById(id: number): OppositionCard | null {
  return OPPOSITION_CARDS.find((card) => card.id === id) ?? null;
}

/**
 * Looks up an orientation card.
 *
 * @param id - the card id
 * @returns the orientation, or null if there is no such card
 */
export function orientationById(id: number): Orientation | null {
  return (
    [...ORIENTATIONS_THREE, ...ORIENTATIONS_SIX].find(
      (card) => card.id === id,
    ) ?? null
  );
}
