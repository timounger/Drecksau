/**
 * The IMPERAVIS rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";
import {
  BUILDING,
  DECOR_BEAUTY,
  DECOR_CAP,
  DECOR_KINDS,
  LEVEL_COST,
} from "@/games/imperavis/engine/buildings-data";
import { INSTANT_REPAIR_GOLD } from "@/games/imperavis/engine/buildings";
import {
  BUILDING_REPAIR_GOLD,
  PLUNDER_SHARE,
  SHIP_REPAIR_GOLD,
} from "@/games/imperavis/engine/combat";
import { OFFER_SECONDS } from "@/games/imperavis/engine/diplomacy";
import {
  DIFFICULTIES,
  DIFFICULTY,
  type DifficultyFactors,
} from "@/games/imperavis/engine/difficulty-data";
import { START_GOLD } from "@/games/imperavis/engine/game";
import {
  EXTINGUISH_SECONDS,
  FIRE_SECONDS,
  PIRATES_FROM,
  PLAGUE_SECONDS,
} from "@/games/imperavis/engine/incidents";
import { MOST_ACTIVE } from "@/games/imperavis/engine/missions";
import {
  DISASTER_KINDS,
  DISASTER_SECONDS,
  DISASTERS_FROM,
  ISLAND_CALM,
  WARNING_SECONDS,
} from "@/games/imperavis/engine/disasters-data";
import type { DisasterKind } from "@/games/imperavis/engine/types";
import {
  BUILDABLE_SHIPS,
  RUNNING_REFUND,
  SHIP,
  YARD_ORDERS,
} from "@/games/imperavis/engine/ships-data";
import {
  DRILL_ORDERS,
  SCOUT_REVEAL,
  SKILL_RANGE,
  UNITS,
} from "@/games/imperavis/engine/units-data";
import {
  FOUND_RANGE,
  KONTOR_KIT,
  SETTLE_REACH,
} from "@/games/imperavis/engine/placement";
import { MAX_AI } from "@/games/imperavis/engine/players";
import {
  CULTURES,
  EXOTIC_MOOD,
  EXOTIC_RISE_NEED,
} from "@/games/imperavis/engine/factions-data";
import {
  BREACH_LIMIT,
  CONTRACT_EVERY,
  CONTRACTS_EACH,
  DEMAND_MET_MEMORY,
  DEMAND_REFUSED_MEMORY,
  GIFT_GOLD_PER_POINT,
  GIFT_MOST,
} from "@/games/imperavis/engine/factions";
import {
  ALLIANCE_OPINION,
  ALLIANCE_SUNK,
  ALLIANCE_TAKEN,
  INTEL_GOLD,
  LOOT_SHARE,
  MAP_PRICE,
  PROTECTION_EVERY,
  PROTECTION_SECONDS,
  STRUCK_SHARE,
} from "@/games/imperavis/engine/pirates";
import { PERK_TEXTS } from "./faction-texts";
import {
  DECLINE_SATISFACTION,
  DECLINE_SECONDS,
} from "@/games/imperavis/engine/population";
import { RESEARCH } from "@/games/imperavis/engine/research-data";
import { ROAD_COST } from "@/games/imperavis/engine/roads";
import { DAY_SECONDS, SEASON_DAYS } from "@/games/imperavis/engine/time";
import { TIERS } from "@/games/imperavis/engine/tiers";
import { TUTORIAL_STEPS } from "@/games/imperavis/engine/tutorial-data";
import { CONGESTION, FREE_FLOW } from "@/games/imperavis/engine/warehouse";
import {
  CART_SPEED,
  FOREST_SPEED,
  LAND_MARGIN,
  LAND_SPEED,
  PAVE_COST,
  PAVED_SPEED,
  ROAD_SPEED,
  ROCK_SPEED,
} from "@/games/imperavis/engine/logistics-data";
import { ROAD_GRACE } from "@/games/imperavis/engine/tutorial-data";
import {
  BUILDING_NAMES,
  DIFFICULTY_NAMES,
  GOOD_NAMES,
  RESEARCH_NAMES,
  SHIP_NAMES,
  TIER_NAMES,
} from "./texts";
import { CATEGORY_NAMES, UNIT_NAMES } from "./military-texts";
import { TUTORIAL_STEP_TEXTS } from "./tutorial-texts";

/** Seconds in a minute. */
const MINUTE = 60;

/** Percent of a share. */
const PERCENT = 100;

/** One line per tier: what it wants, and the research it waits for. */
const TIER_LINES: readonly string[] = TIERS.map(
  (tier) =>
    `${TIER_NAMES[tier.index]} (bis ${tier.capacity} je Haus, Steuer ${tier.tax} Gold je Kopf und Minute${tier.research === null ? "" : `, braucht die Forschung ${RESEARCH_NAMES[tier.research]}`}): ${[
      ...tier.goods.map((want) => GOOD_NAMES[want.good]),
      ...tier.services.map((kind) => BUILDING_NAMES[kind]),
    ].join(", ")}`,
);

/** One line per decoration: cost, reach and what it adds. */
const DECOR_LINES: readonly string[] = DECOR_KINDS.map(
  (kind) =>
    `${BUILDING_NAMES[kind]}: ${BUILDING[kind].cost.gold} Gold, Reichweite ${BUILDING[kind].radius}, +${Math.round((DECOR_BEAUTY[kind] ?? 0) * PERCENT)} Punkte`,
);

/** One line per task of the guided start: what it is and what it releases. */
const TUTORIAL_LINES: readonly string[] = TUTORIAL_STEPS.map(
  (step, index) =>
    `${index + 1}. ${TUTORIAL_STEP_TEXTS[step.id].title}${step.releases.length > 0 ? ` - gibt frei: ${step.releases.map((kind) => BUILDING_NAMES[kind]).join(", ")}` : ""}`,
);

/** What each factor of a difficulty level changes, in words. */
const FACTOR_NAMES: Readonly<Record<keyof DifficultyFactors, string>> = {
  startGold: "Startgold",
  startCargo: "Ladung des ersten Schiffs",
  aiThink: "Zeit zwischen zwei Gedanken der Rivalen",
  aiBudget: "Bauplatzprüfungen und Straßensuchen je Gedanke der Rivalen",
  aiGrowth:
    "Häuser je Insel der Rivalen (Schwelle für die nächste Insel geteilt)",
  aiIslands: "Inseln, die ein Rivale höchstens will",
  aiWork: "Arbeitstempo der Betriebe der Rivalen",
  aiUpkeep: "Unterhalt der Gebäude der Rivalen",
  aiWarLine: "Meinung, ab der ein Rivale dir den Krieg erklärt (Punkte dazu)",
  aiWarRatio: "Stärke, die ein Rivale vor dem Krieg über dir will",
  raidGap: "Pausen zwischen Piratenüberfällen",
  raiders: "Piraten gleichzeitig unterwegs",
  pirateBuild: "Bauzeit und Goldpreis der Piratenschiffe",
  hazardChance: "Wahrscheinlichkeit von Katastrophen, Feuer und Seuche",
  hazardImpact: "Dauer und Schaden von Katastrophen und Feuer",
  buyPrice: "Deine Einkaufspreise bei Händler und Völkern",
  sellPrice: "Deine Verkaufspreise bei Händler und Völkern",
};

/** Factors that add or take a number instead of multiplying. */
const OFFSETS: readonly (keyof DifficultyFactors)[] = [
  "aiIslands",
  "aiWarLine",
  "raiders",
];

/** One factor of one level in words: x1,5 or +1. */
function factorWords(key: keyof DifficultyFactors, value: number): string {
  const number = String(value).replace(".", ",");
  return OFFSETS.includes(key)
    ? value > 0
      ? `+${number}`
      : number
    : `x${number}`;
}

/** One line per factor: what it changes and its value on each level. */
const DIFFICULTY_LINES: readonly string[] = (
  Object.keys(FACTOR_NAMES) as (keyof DifficultyFactors)[]
).map(
  (key) =>
    `${FACTOR_NAMES[key]}: ${DIFFICULTIES.map((level) => `${DIFFICULTY_NAMES[level]} ${factorWords(key, DIFFICULTY[level][key])}`).join(", ")}`,
);

/** A price in words: gold first, then the goods. */
function priceWords(cost: Readonly<Record<string, number>>): string {
  return Object.entries(cost)
    .map(([good, amount]) =>
      good === "gold"
        ? `${amount} Gold`
        : `${amount} ${GOOD_NAMES[good as keyof typeof GOOD_NAMES]}`,
    )
    .join(", ");
}

/** One line per ship a shipyard builds: role, values, price and unlock. */
const SHIP_LINES: readonly string[] = BUILDABLE_SHIPS.map((kind) => {
  const def = SHIP[kind];
  const guns =
    def.guns === null
      ? "keine Geschütze"
      : `${def.cannons} Geschütze, ${def.guns.damage} Schaden, Reichweite ${def.guns.range}, alle ${def.guns.reload} s`;
  return `${SHIP_NAMES[kind]} (${def.role === "war" ? "Krieg" : "Handel"}): Tempo ${def.speed}, Laderaum ${def.slots} x ${def.slotSize}, ${def.hp} LP, Panzerung ${Math.round(def.armour * PERCENT)} %, ${guns}, ${def.troops} Truppenplätze, Unterhalt ${def.upkeep}/Min; ${priceWords(def.cost)}, ${def.buildSeconds} s; ab ${TIER_NAMES[def.tier]}${def.research === null ? "" : `, Forschung ${RESEARCH_NAMES[def.research]}`}`;
});

/** One line per kind of land unit: shelf, values, price and unlock. */
const UNIT_LINES: readonly string[] = UNITS.map(
  (def) =>
    `${UNIT_NAMES[def.kind]} (${CATEGORY_NAMES[def.category]}): ${def.hp} LP, ${def.damage} Schaden alle ${def.reload} s, Reichweite ${def.range}, Panzerung ${Math.round(def.armour * PERCENT)} %, Tempo ${def.speed}; ${priceWords(def.cost)}, ${def.train} s, Unterhalt ${def.upkeep}/Min; ab ${TIER_NAMES[def.tier]}${def.research === null ? "" : `, Forschung ${RESEARCH_NAMES[def.research]}`}${def.building === null ? "" : `, mit ${BUILDING_NAMES[def.building]}`}`,
);

/** What a kontor on a new island needs aboard, in words. */
const KIT_WORDS = priceWords(KONTOR_KIT as Record<string, number>);

/** One line per field of research. */
const RESEARCH_LINES: readonly string[] = RESEARCH.map(
  (def) =>
    `${RESEARCH_NAMES[def.id]} (${def.cost} Punkte${def.needs.length > 0 ? `, nach ${def.needs.map((need) => RESEARCH_NAMES[need]).join(" und ")}` : ""})`,
);

/** What each disaster does and what keeps it off, in one line. */
const DISASTER_WORDS: Readonly<Record<DisasterKind, string>> = {
  flood:
    "Überschwemmung: Ein Fluss tritt über die Ufer oder eine Sturmflut überspült die tiefe Küste einer Seite. Betriebe im Wasser stehen still, verlieren ihre Waren und nehmen Schaden, Karren kommen nicht durch. Ein Deich hält das Wasser in seiner Reichweite ab, eine Pumpstation legt das Land nach 25 Sekunden trocken.",
  drought:
    "Dürre (nur im Sommer bei klarem Wetter): Höfe und Plantagen tragen nur ein Drittel. Bewässerung bringt die volle Ernte zurück, ein Zierbrunnen hilft zum Teil.",
  locusts:
    "Heuschreckenplage: Die Hälfte der Höfe einer Insel ist vier Minuten kahl, der Schwarm frisst Getreide, Mehl und Brot im Lager an. Hier helfen nur Vorräte und Höfe auf anderen Inseln.",
  tsunami:
    "Tsunami (selten): Eine Flutwelle trifft eine Küste - Hafenanlagen, Kontor, Werft, Fischer und Häuser nehmen schweren Schaden, das Kontor verliert Waren, Schiffe am Kai werden beschädigt. Eine Hafenmauer fängt den größten Teil ab, ein Deich die Hälfte.",
  blizzard:
    "Schneesturm (nur im Winter, auf der ganzen Karte): Straßen verschneien, Karren fahren nur im Geländetempo, Schiffe langsamer, und die Häuser verbrennen Holz oder Kohle aus dem Lager - fehlt es, sinkt die Zufriedenheit.",
};

/** Each disaster with its warning time and how long it lasts. */
const DISASTER_LINES: readonly string[] = DISASTER_KINDS.map(
  (kind) =>
    `${DISASTER_WORDS[kind]} Vorwarnung ${WARNING_SECONDS[kind]} s, Dauer ${DISASTER_SECONDS[kind]} s.`,
);

/** What the rules button opens. */
export const IMPERAVIS_RULES: GameRules = {
  title: "IMPERAVIS",
  players: `1 Spieler gegen 0 bis ${MAX_AI} KI-Gegner`,
  intro:
    "Eine Inselwelt wartet. Gründe mit deinem ersten Schiff ein Handelskontor, baue Straßen, Betriebe und Wohnhäuser, versorge deine Bürger mit Waren und öffentlichen Gebäuden und lass sie von Bauern bis zu Kaufleuten aufsteigen. Weitere Inseln besiedelst du per Schiff und verbindest sie mit Handelsrouten. Rivalen bauen eigene Städte, schließen Verträge oder führen Krieg; Aufträge, Ereignisse und Forschung bringen Neues. Es gibt kein festes Ende - es zählt, wie groß und reich dein Reich wird.",
  sections: [
    {
      title: "Der Anfang",
      body: [
        `Du beginnst mit ${START_GOLD} Gold und einem Schoner voller Baustoffe vor deiner Heimatinsel. Wähle das Handelskontor und setze es an die Küste - ein eigenes Schiff mit ${KIT_WORDS} an Bord muss höchstens ${FOUND_RANGE} Felder entfernt liegen. Der Rest der Ladung kommt dann ins Kontor.`,
        `Weitere Inseln: Jede Insel gehört nur einer Partei - auf jeder freien Insel darfst du ein eigenes Kontor gründen. Weil die Ladung ins erste Kontor geht, lädt das Schiff vorher an einem eigenen Kontor nach: „Baustoffe für ein Kontor laden“ im Schiffsfenster holt ${KIT_WORDS} an Bord.`,
        `Das Kontor beansprucht ${BUILDING.kontor.influence} Felder ringsum als Baugebiet, jeder Marktplatz ${BUILDING.market.influence} und jedes Lagerhaus ${BUILDING.warehouse.influence} weitere. Nur dort darfst du bauen. Gebäude stehen sofort fertig, ohne Bauzeit; Zeit brauchen nur Schiffe in der Werft und Einheiten in der Kaserne. Je Insel steht ein Kontor - willst du weiter hinaus bauen, setze ein Lagerhaus oder einen Marktplatz an den Rand des Baugebiets.`,
        `Am schnellsten geht es über das Fenster deines Schiffs: Liegt es höchstens ${SETTLE_REACH} Felder vor einer freien Insel, setzt „Insel besiedeln“ das Kontor auf den nächsten erlaubten Küstenplatz.`,
      ],
    },
    {
      title: "Geführter Einstieg",
      body: [
        "Mit „Geführter Einstieg“ (beim neuen Spiel, Standard an) führt dich das Spiel Aufgabe für Aufgabe vom Schiff bis zu den Arbeitern. Das Aufgabenfenster zeigt immer nur die nächste Aufgabe mit Fortschritt; „Zeigen“ öffnet die passende Kategorie im Baumenü oder fährt die Kamera hin.",
        "Das Baumenü gibt die Gebäude dabei nach und nach frei: Empfohlene leuchten golden, gesperrte sagen, nach welcher Aufgabe sie frei werden. Die normale Freischaltung nach Einwohnern und Forschung gilt weiter - die Einführung hält nur zusätzlich zurück. Hast du etwas schon früher erledigt, springt sie weiter.",
        "„Einführung beenden“ im Aufgabenfenster oder im Pausenmenü beendet sie für diese Partie endgültig; danach und nach der letzten Aufgabe folgt alles den normalen Regeln.",
        `Die Straße zum Kontor ist eine Empfehlung: Sie gilt als erledigt, sobald der Holzfäller über Straßen am Lager hängt - oder ${ROAD_GRACE} s nach seinem Bau, wenn seine Karren das Holz schon übers Gelände holen.`,
        "Mit Cheat hält die Einführung nichts zurück; sie läuft aber weiter und greift wieder, sobald der Cheat aus ist.",
      ],
      list: TUTORIAL_LINES,
    },
    {
      title: "Schwierigkeit",
      body: [
        `Beim neuen Spiel wählst du Leicht, Normal oder Schwer (Standard Normal; das Menü merkt sich die letzte Wahl). Die Stufe ändert dein Startgold (${DIFFICULTIES.map((level) => `${DIFFICULTY_NAMES[level]} ${Math.round(START_GOLD * DIFFICULTY[level].startGold)}`).join(", ")}) und die Ladung, wie schnell und klug die Rivalen wachsen und wie leicht sie dir den Krieg erklären, wie oft und wie stark Piraten kommen, wie oft und wie hart Katastrophen treffen und deine Preise bei Händler und Völkern.`,
        "Normal ist das Spiel wie vorgesehen, alle Werte bleiben. Was dich betrifft (Start, Preise), gilt nur für dich, was die Rivalen betrifft, nur für sie; außer den hier genannten Abweichungen (Denk-Takt, Ehrgeiz, Arbeitstempo und Unterhalt) spielen die Rivalen nach denselben Regeln wie du. Piraten und Katastrophen treffen alle gleich. Die Schonzeit der Katastrophen gilt auf jeder Stufe. Das Pausenmenü und die Liste der Spielstände zeigen die Stufe.",
      ],
      list: DIFFICULTY_LINES,
    },
    {
      title: "Straßen und Lager",
      body: [
        `Straßen ziehst du mit gedrückter Maus; der Weg wird mit A* geplant und folgt vorhandenen Straßen. Jedes neue Feld kostet ${ROAD_COST} Gold.`,
        `Kontor (Reichweite ${BUILDING.kontor.radius}) und Lagerhäuser (Reichweite ${BUILDING.warehouse.radius}) schicken Karren aus: Sie holen fertige Waren aus den Betrieben und bringen ihnen Rohstoffe. Alle Lager einer Insel teilen einen Bestand; jedes Lager vergrößert den Platz je Ware (Kontor ${BUILDING.kontor.storage}, Lagerhaus ${BUILDING.warehouse.storage}).`,
        "Straßen sind ein Vorteil, keine Pflicht: Jeder Betrieb arbeitet auch ohne Straße in sein eigenes kleines Lager und hält erst an, wenn es voll ist. Die Karren kommen dann übers Gelände - nur langsamer.",
        `Tempo der Karren: ${CART_SPEED} Felder je Sekunde auf einer einfachen Straße (${Math.round(ROAD_SPEED * PERCENT)} %), auf gepflasterter Straße ${Math.round(PAVED_SPEED * PERCENT)} %, auf Wiese und Strand ${Math.round(LAND_SPEED * PERCENT)} %, auf Fels ${Math.round(ROCK_SPEED * PERCENT)} %, durch Wald ${Math.round(FOREST_SPEED * PERCENT)} %. Über Wasser, Flüsse, Gebirge und fremde Gebäude fährt kein Karren. Der Weg wird mit A* gesucht und bevorzugt Straßen.`,
        `Ein Lager erreicht die Betriebe in seiner Reichweite; übers Gelände fahren seine Karren bis ${LAND_MARGIN} Felder darüber hinaus, auf Straßen beliebig weit. Findet kein Karren einen Weg (etwa hinter einem Gebirge), ist der Betrieb rot und produziert nur, bis sein Lager voll ist.`,
        `Gepflasterte Straße: Werkzeug „Pflastern“ (Infrastruktur oder Umschalt plus T) über eine bestehende Straße ziehen. Je Feld ${PAVE_COST.gold} Gold und ${PAVE_COST.stone ?? 0} Steinquader aus dem Lager der Insel.`,
        "Im Baumodus zeigt ein farbiger Punkt über jedem deiner Betriebe die Anbindung: grün über Straßen, gelb übers Gelände, rot kein Weg. Das Objektfenster eines Betriebs zeigt unter „Logistik“ Produktion, lokalen Bestand, Transport, Entfernung und Fahrzeit zum Lager.",
        "Wohnhäuser und öffentliche Gebäude brauchen keine Straße: Ihre Versorgung folgt allein der Reichweite von Markt und öffentlichen Gebäuden.",
      ],
    },
    {
      title: "Produktion",
      body: [
        "Betriebe brauchen Arbeitskräfte der richtigen Schicht (höhere Schichten springen ein), ihre Rohstoffe und einen passenden Standort: Holzfäller Wald, Fischer offenes Wasser, Gruben und Minen ein Vorkommen, Höfe eine fruchtbare Insel. Fehlt etwas, stockt der Betrieb - das Infofenster sagt warum.",
        "Ketten: Getreide - Mühle - Mehl - Bäckerei - Brot. Schafe - Wolle - Weberei - Stoff - Schneiderei - Kleidung. Getreide - Mälzerei - Malz - Brauerei - Bier. Erz und Kohle - Schmelzhütte - Eisen - Werkzeugschmiede - Werkzeug. Holz - Sägewerk - Bretter. Lehm - Ziegelei - Ziegel. Trauben - Kelterei - Wein (Luxus).",
        "Jedes Gebäude kostet Unterhalt je Minute; angehaltene Betriebe die Hälfte.",
        "Im Objektfenster lässt sich ein Betrieb anhalten und fortsetzen und ihm „Vorrang beim Abholen“ geben: Die Lager schicken ihre Karren dann zuerst zu ihm, zum Bringen der Rohstoffe wie zum Abholen der Waren. Die Verwaltung zeigt unter „Produktion“ alle Betriebe nach Ware, Menge, Verbrauch und Engpässen.",
      ],
    },
    {
      title: "Bevölkerung",
      body: [
        "Wohnhäuser füllen sich, wenn ihre Bedürfnisse erfüllt sind; ohne alles wohnt ein Viertel der Plätze. Waren bekommt ein Haus nur in Reichweite eines Marktplatzes, öffentliche Gebäude wirken in ihrem Umkreis.",
        "Ist ein Haus voll und jedes Bedürfnis zu mindestens 75 % erfüllt, steigt es zur nächsten Schicht auf - wenn die Baustoffe dafür im Lager liegen. Fehlen Waren, sinkt die Zufriedenheit und Bewohner ziehen aus. Neue Gebäude werden freigeschaltet, sobald genug Einwohner einer Schicht da sind.",
        `Bleibt die Zufriedenheit eines Hauses ${DECLINE_SECONDS} Sekunden lang unter ${Math.round(DECLINE_SATISFACTION * PERCENT)} %, steigt es eine Schicht ab.`,
      ],
      list: TIER_LINES,
    },
    {
      title: "Dekoration",
      body: [
        `Bäume, Blumenbeete, Laternen, Plätze, Parks, Brunnen und Statuen machen die Häuser in ihrer Reichweite zufriedener. Verschiedene Zierden zählen zusammen, dieselbe Art zweimal nur einmal, höchstens +${Math.round(DECOR_CAP * PERCENT)} Punkte. Die größeren werden mit mehr Einwohnern freigeschaltet.`,
      ],
      list: DECOR_LINES,
    },
    {
      title: "Zeit, Jahreszeiten und Wetter",
      body: [
        `Ein Tag dauert ${DAY_SECONDS / MINUTE} Minuten, eine Jahreszeit ${SEASON_DAYS} Tage. Im Sommer wachsen Felder schneller, im Winter deutlich langsamer. Regen hilft den Feldern, Sturm bremst Fischer und Schiffe, Nebel verlangsamt die Schiffe.`,
      ],
    },
    {
      title: "Schiffe und Handel",
      body: [
        "Wähle ein Schiff und setze mit „Ziel setzen“ (oder Rechtsklick aufs Wasser) ein Ziel. Liegt es an einem Kontor, lädt und entlädt es über sein Infofenster. Mit einer Ladung Baustoffe gründest du so ein Kontor auf einer neuen Insel.",
        "Handelsrouten verbinden deine Kontore: Für jeden Halt legst du fest, welche Waren geladen (bis zu einer Menge, ohne das Lager unter eine Grenze zu leeren) oder entladen werden (bis das Lager eine Grenze erreicht). Im Schiffsfenster erstellt „Route erstellen“ eine Route zwischen zwei deiner Kontore mit diesem Schiff; „Route starten“ und „Route stoppen“ schalten sie.",
        "Der freie Händler besucht Kontore mit Aufträgen: Er kauft, was über deiner Verkaufsgrenze liegt, und verkauft, was unter deiner Kaufgrenze fehlt. Seine Preise steigen, wenn du viel kaufst, und fallen, wenn du viel verkaufst.",
      ],
    },
    {
      title: "Werft und Flotte",
      body: [
        `Ein Klick auf deine Werft öffnet ihr Fenster: Handels- und Kriegsschiffe auf eigenen Registerkarten, jedes mit Bild und allen Werten. Rot ist, was im Lager der Insel fehlt; ausgegraut ist, was noch gesperrt (Schicht, Forschung) oder zu teuer ist. Bezahlt wird beim Annehmen des Auftrags; höchstens ${YARD_ORDERS} Aufträge warten, sie werden nacheinander gebaut.`,
        `Gebaut wird nur mit Arbeitskräften (Arbeiter auf der Insel); ohne sie ruht der Bau. Das fertige Schiff legt auf freiem Wasser vor der Werft ab, ohne ein anderes Schiff zu berühren - ist dort kein Platz, wartet die Werft. Abbrechen gibt beim Schiff auf der Helling ${Math.round(RUNNING_REFUND * PERCENT)} % des noch nicht verbauten Anteils zurück, bei wartenden Aufträgen alles.`,
        "Kriegsschiffe greifen auf Rechtsklick ein feindliches Schiff oder Gebäude an und verfolgen es, bis es sinkt oder fällt. Im Schiffsfenster unter „Befehle“: Angreifen (Ziele in der Nähe), Patrouillieren (zweiten Punkt wählen, das Schiff fährt hin und her und stellt Feinde), Eskortieren (bleibt bei einem eigenen Schiff und wehrt Angreifer ab) und Flotte bilden. Eine Flotte fährt gemeinsam in Formation, im Tempo ihres langsamsten Schiffs.",
      ],
      list: SHIP_LINES,
    },
    {
      title: "Ausbau und Verkehr",
      body: [
        `Betriebe, Lagerhäuser, Kontore und Gelehrtenhäuser lassen sich auf Stufe 2 ausbauen (die Hälfte bis drei Viertel ihres Goldpreises, ${LEVEL_COST.bricks} Ziegel, ${LEVEL_COST.tools} Werkzeug): Betriebe arbeiten 50 % schneller, Lager fassen 50 % mehr und schicken einen Karren mehr; der Unterhalt steigt um die Hälfte.`,
        `Auf einem Straßenfeld fahren ${FREE_FLOW} Karren ungehindert; jeder weitere bremst alle dort um ${Math.round(CONGESTION * PERCENT)} %. Stark belastete Straßen leuchten gelb bis rot - eine zweite Straße oder ein weiteres Lager entlastet sie.`,
      ],
    },
    {
      title: "KI-Gegner und Diplomatie",
      body: [
        "Beim neuen Spiel wählst du bis zu drei Rivalen: einen Händler, einen kriegerischen und einen expansiven. Sie bauen mit denselben Regeln wie du, besiedeln Inseln, forschen, bauen gezielt Ziegel-, Stein- und Weinketten für den Aufstieg auf, handeln mit dem freien Händler, untereinander und mit dir und reagieren auf Mangel, Geldnot und Krieg.",
        "Auch untereinander leben die Rivalen Diplomatie: Sie schließen und kündigen Abkommen, Pakte und Bündnisse, beschenken einander, stellen Forderungen, tauschen Waren, streiten um freie Inseln und an ihren Grenzen, erklären Krieg und schließen wieder Frieden. Ein Krieg endet spätestens, wenn eine Seite des Krieges müde ist oder ihr Kriegsziel - eine eroberte Insel - erreicht hat.",
        "Im Fenster Diplomatie stehen alle Mächte zusammen: erst die Rivalen, dann die fremden Völker, dann die Piraten (ein Filter zeigt eine Art allein). Bei jeder siehst du, was sie von dir hält und warum (Charakter, dein Ruf, Verträge, Nachbarschaft, Geschenke, Angriffe ...), und ihren Status. Rivalen kannst du Handelsabkommen, Nichtangriffspakt und Bündnis vorschlagen, Frieden anbieten, Krieg erklären, Gold oder Waren schenken, Gold fordern und Waren gegen Gold oder Waren tauschen. Jede Antwort nennt ihren Grund.",
        `Ein Handelsabkommen bringt beiden laufend Gold. Ein Bündnis zieht die Partner mit in den Krieg: der Angegriffene ruft seine Verbündeten, und die Verbündeten des Angreifers folgen, wenn sie den Angegriffenen nicht mögen. Einen Pakt zu kündigen kostet Ruf. Angebote der Rivalen an dich stehen ${OFFER_SECONDS} Sekunden.`,
      ],
    },
    {
      title: "Fremde Völker und Piraten",
      body: [
        "Jede neue Welt hat vier fremde Völker und eine Piratenbande (auf der großen Karte zwei), jede auf einer kleinen, festen Heimatinsel weit vom Start. Niemand baut, landet oder siedelt dort; die Inseln sind nicht eroberbar. Ein Klick auf ihre Insel öffnet ihr Hafenfenster (Handel, Aufträge, bei Piraten Schwarzer Markt und Taverne); alles Diplomatische - Geschenke, Forderungen, Verträge, Hilfe, Bündnis, Schutzgeld - steht im Fenster Diplomatie, das jeden Eintrag auch mit „Hafen öffnen“ verbindet.",
        "Jedes Volk und jede Bande hat eigenes Lager und Gold. Ihre Waren kommen nur aus ihren eigenen Betrieben und aus dem Handel; die Preise folgen Bestand und Bedarf. Kaufen und verkaufen kannst du nur mit einem eigenen Schiff in ihrem Hafen (Rechtsklick auf die Insel), nachdem du Handelsbeziehungen aufgenommen hast; Handelsrouten können ihre Häfen anfahren.",
        `Völker behandelst du wie Rivalen: Ein Geschenk bringt 1 Punkt Meinung je ${GIFT_GOLD_PER_POINT} Gold, höchstens ${GIFT_MOST}, und etwas Ruf. Forderst du Gold, zahlt das Volk aus seinem eigenen Schatz, wenn du stark genug bist - wie stark, hängt von seinem Charakter ab (${CULTURES.filter(
          (def) => def.kind === "nation",
        )
          .map(
            (def) =>
              `${def.island} ${def.demandFear.toLocaleString("de-DE")}-mal`,
          )
          .join(
            ", ",
          )} so stark wie das Volk); Freunde zahlen eher, Feinde seltener, sonst lehnt es mit Grund ab. Eine erfüllte Forderung kostet ${-DEMAND_MET_MEMORY} Punkte Meinung, eine abgelehnte ${-DEMAND_REFUSED_MEMORY}.`,
        `Lieferverträge: alle ${CONTRACT_EVERY / MINUTE} Minuten eine feste Menge gegen festes Gold, höchstens ${CONTRACTS_EACH} je Volk. Ein Schiff des Volkes holt oder bringt die Ware an deinem Kontor. Fehlt dir Ware oder Gold, ist die Lieferung ausgesetzt und zählt als Bruch; nach ${BREACH_LIMIT} Brüchen kündigt das Volk.`,
        "Die Beziehung reicht von -100 bis 100: Feindselig, Misstrauisch, Neutral, Freundlich, Verbündet, Vertrauensvoll. Handel, Geschenke, erfüllte Aufträge, eingehaltene Verträge und versenkte Piraten heben sie; Angriffe, Brüche und gescheiterte Aufträge senken sie. Bessere Stufen bringen bessere Preise, größere Mengen, Bündnis und Hilfe: Shogunara und Skeld schicken ihren Freunden Kriegsschiffe.",
        `Die Waren der Völker sind Exotik für deine oberen Schichten: freiwillig, aber voll versorgt +${Math.round(EXOTIC_MOOD * PERCENT)} % Zufriedenheit, und der Aufstieg braucht dann nur ${Math.round(EXOTIC_RISE_NEED * PERCENT)} % je Bedürfnis.`,
        `Piraten lauern Handelsschiffen auf und greifen an, wenn Eskorte und Konvoi schwach sind. Ein Schiff unter ${Math.round(STRUCK_SHARE * PERCENT)} % LP streicht die Flagge, die Piraten nehmen ${Math.round(LOOT_SHARE * PERCENT)} % jeder Ware. Kriegsschiffe als Eskorte und größere Konvois schrecken ab. Nachrichten (${INTEL_GOLD} Gold) zeigen ihre Flotte, der Schwarze Markt wechselt und bietet manchmal Schatzkarten (${MAP_PRICE} Gold). Wer Piraten versenkt, muss mit Rache rechnen.`,
        `Mit Piraten herrscht von Beginn an Krieg - mit dir und mit jedem Rivalen; es gibt keinen Waffenstillstand und keinen Frieden. Schutzgeld (sofort und alle ${PROTECTION_EVERY / MINUTE} min, ${PROTECTION_SECONDS / MINUTE} min lang) ist bezahlter Schutz: Der Krieg bleibt, aber sie überfallen dich nicht, solange du zahlst. Im friedlichen Spiel gibt es weder Krieg noch Überfälle.`,
        `Ein Bündnis mit Piraten wird erst möglich, wenn du ${ALLIANCE_SUNK} Schiffe anderer Gegner (Rivalen oder Völker) versenkt oder ${ALLIANCE_TAKEN} Kontor eines Rivalen erobert oder zerstört hast; die Diplomatie zeigt den Fortschritt. Dann nehmen sie an, wenn ihre Meinung über dich mindestens ${ALLIANCE_OPINION} ist - versenkte Piratenschiffe drücken sie, Geschenke heben sie. Verbündete Piraten überfallen dich nicht mehr, Schutzgeld ist unnötig, und sie greifen deine Kriegsgegner an. Greifst du sie an, ist wieder Krieg, und die Bedingung zählt von vorn.`,
      ],
      list: CULTURES.map(
        (def) =>
          `${def.name} (${def.island}): ${def.perk === null ? "Piraten" : PERK_TEXTS[def.perk]}`,
      ),
    },
    {
      title: "Krieg",
      body: [
        "Gekämpft wird nur nach einer Kriegserklärung - und gegen Piraten. Kriegsschiffe (Werft), Wachtürme und Küstenbatterien schießen selbst auf Feinde in Reichweite; Rüstung schluckt einen Teil jedes Treffers.",
        `Ein Kontor mit 0 Lebenspunkten wird erobert: die Insel mit allen Gebäuden und Waren wechselt den Besitzer, die Hälfte der Bewohner flieht. Piraten erobern nicht, sondern plündern ${Math.round(PLUNDER_SHARE * PERCENT)} % der Waren. Andere Gebäude mit 0 Lebenspunkten sind zerstört.`,
        `Schiffe werden vor einer eigenen Werft schnell und an einem eigenen Kontor langsamer repariert (${SHIP_REPAIR_GOLD} Gold je Lebenspunkt), Gebäude reparieren sich nach einer Weile Ruhe selbst (${BUILDING_REPAIR_GOLD} Gold je Lebenspunkt) - oder sofort mit „Reparieren“ im Objektfenster für ${INSTANT_REPAIR_GOLD} Gold je Lebenspunkt, wenn es nicht brennt. Im friedlichen Spiel gibt es weder Krieg noch Piratenüberfälle.`,
      ],
    },
    {
      title: "Kaserne und Truppen",
      body: [
        `Die Kaserne bildet elf Arten von Einheiten aus, sortiert nach Infanterie, Fernkampf, schwerer Infanterie und Spezialisten. Jede Kachel zeigt Werte, Kosten und Voraussetzungen (Schicht, Forschung, Gebäude); bezahlt wird beim Start aus dem Lager der Insel. Höchstens ${DRILL_ORDERS} Einheiten stehen in der Ausbildungsschlange; sie lässt sich anhalten, und Abbrechen gibt wie bei der Werft ${Math.round(RUNNING_REFUND * PERCENT)} % des noch offenen Anteils der laufenden Ausbildung und alles für wartende zurück. Die fertige Einheit tritt auf einem freien Feld vor der Kaserne an.`,
        "Die Arten ergänzen sich: Fernkämpfer schießen von weitem, sind im Nahkampf aber schwach; Grenadiere und Artillerie zerlegen Gebäude und Stellungen, die Artillerie trifft alle nahe am Ziel; Kavallerie ist schnell, aber gegen haltende Truppen, Türme und Kontore schwach.",
        `Spezialisten: Pioniere reparieren eigene Gebäude im Umkreis von ${SKILL_RANGE} Feldern im Feld, Sanitäter heilen eigene Einheiten im selben Umkreis, Aufklärer sehen weit - Einheiten bei ihnen erkennen Feinde früher, und im Umkreis von ${SCOUT_REVEAL} Feldern zeigen Minimap und Weltkarte feindliche Truppen und Schiffe.`,
        "Steuerung: Linksklick oder Rechteck wählt Einheiten, Rechtsklick ins Gelände schickt sie hin, Rechtsklick auf eine feindliche Einheit, ein Gebäude oder ein Schiff am Ufer greift an. Im Fenster der Auswahl: Formation (Linie, Block, locker), Position halten (eingegraben, mehr Panzerung), Rückzug zur nächsten Kaserne oder zum Kontor und Patrouille; Strg plus Zahl speichert eine Steuergruppe.",
        `So geht ein Angriff über See: Fahre ein Schiff dicht an die Küste der Insel, auf der deine Truppen stehen (ein Kontor ist nicht nötig), und drücke „Einschiffen“ - die Einheiten der Insel gehen an Bord. Oder wähle Truppen und klicke mit rechts auf das Schiff (Truppenplätze: ${BUILDABLE_SHIPS.map((kind) => `${SHIP_NAMES[kind]} ${SHIP[kind].troops}`).join(", ")}). Dann im Reiter „Truppen“ des Schiffsfensters eine Insel wählen (oder mit dem gewählten Schiff mit rechts auf Land einer Insel klicken) und „Angriff: Insel“ für eine Insel eines Feindes im Krieg - oder „Absetzen“ auf jeder anderen Insel: einer eigenen, einer freien oder der eines Rivalen. Truppen auf dem Land eines Rivalen im Frieden verärgern ihn, solange sie dort stehen; im Extremfall erklärt er dir den Krieg (der Kriegerische am schnellsten, der Händler am spätesten). Das Schiff segelt vor das Kontor, die Einheiten gehen an Land und stürmen es; bei 0 Lebenspunkten wird die Insel erobert.`,
        "Verteidigt wird von selbst: Einheiten auf ihrer Insel gehen auf gelandete Feinde los, Wachtürme und Küstenbatterien schießen auch auf Einheiten, und die Wache jedes Kontors schlägt zu, wer an seinen Mauern steht. Nach einem Friedensschluss kehren Einheiten auf fremdem Boden heim.",
      ],
      list: UNIT_LINES,
    },
    {
      title: "Aufträge und Ereignisse",
      body: [
        `Die Krone und die Rivalen bieten laufend Aufträge an: Lieferung, Besiedlung, Produktionsziel, Handelsauftrag, Wirtschaftsziel, Diplomatie, Rettung von Schiffbrüchigen und Bauaufträge. Jeder hat Schwierigkeit, Zeitlimit und Belohnung; höchstens ${MOST_ACTIVE} laufen gleichzeitig. Erfüllte Aufträge bringen Gold, Ruf und Beziehung, gescheiterte kosten beides.`,
        "Aufträge der Krone (Lieferung, Besiedlung, Produktions-, Handels-, Wirtschafts- und Bauziel) nehmen auch die Rivalen an. Wer zuerst erfüllt, bekommt die Belohnung; für alle anderen ist der Auftrag verloren, ohne Strafe. Das Fenster Aufträge zeigt unter „Konkurrenz“, wer mitläuft und wie weit er ist.",
        `Feuer brennt bis zu ${FIRE_SECONDS} Sekunden; eine Feuerwache in Reichweite löscht nach ${EXTINGUISH_SECONDS} Sekunden. Eine Seuche dauert ${PLAGUE_SECONDS} Sekunden und kostet Häuser ohne Medikus Bewohner und Zufriedenheit. Stürme beschädigen Schiffe auf See, gute Ernten und Missernten verändern die Höfe einer Insel für eine Weile. Piraten kommen frühestens nach ${PIRATES_FROM / MINUTE} Minuten.`,
        "Welche Ereignisse und Katastrophen es gibt und welche Völker in der Welt leben, wählst du beim neuen Spiel unter „Ereignisse und Katastrophen“ und „Völker“; das Pausenmenü zeigt die Auswahl des laufenden Spiels.",
      ],
    },
    {
      title: "Katastrophen",
      body: [
        `Frühestens nach ${DISASTERS_FROM / MINUTE} Minuten und nie während des geführten Einstiegs können Katastrophen kommen. Jede wird angekündigt, und nach einer hat die Insel ${ISLAND_CALM / MINUTE} Minuten Ruhe.`,
      ],
      list: DISASTER_LINES,
    },
    {
      title: "Forschung",
      body: [
        "Gelehrtenhaus und Universität sammeln Forschungspunkte. Im Fenster Forschung wählst du, was erforscht wird: neue Schichten (Ingenieure, gehobene Schicht, wohlhabende Bürger) mit Glas, Instrumenten, Tabakwaren und Schmuck, bessere Schiffe, Festungsbau und schnellere Höfe und Werkstätten.",
      ],
      list: RESEARCH_LINES,
    },
    {
      title: "Steuerung",
      body: [
        "Oben stehen Gold (mit Einnahmen, Ausgaben und Trend), Einwohner nach Schicht, die wichtigsten Waren (alle im aufklappbaren Warenfenster), die Zufriedenheit und ganz rechts das Tempo: Pause, 1x, 2x, 3x (Plus und Minus wechseln es). Links die Inselübersicht (einklappbar), rechts das Fenster des gewählten Objekts mit Registerkarten, darunter die Minimap; ein Klick auf sie fährt die Kamera hin, ihr Knopf öffnet die große Weltkarte. Unten die acht Baukategorien, Abriss und die Verwaltung mit allen Übersichten.",
        "Bauen: Kategorie wählen (B öffnet die zuletzt benutzte), Gebäude-Kachel anklicken - die Vorschau zeigt grün (geht, mit Straße), gelb (geht, ohne Straße ist der Transport langsamer) oder rot mit dem Grund. Linksklick setzt das Gebäude, der Baumodus bleibt für das nächste aktiv (nur das Kontor nicht). Rechtsklick oder Esc bricht ab, R oder Umschalt plus Mausrad drehen; das Mausrad allein zoomt.",
        "Maus: Linksklick wählt aus, ein Klick ins Leere hebt die Auswahl auf, Umschalt plus Klick ergänzt sie. Linke Taste ziehen zieht ein Auswahlrechteck um eigene Schiffe und Soldaten. Rechtsklick gibt den gewählten Einheiten einen Befehl: Schiffe fahren aufs Wasser, legen an einem Kontor an oder greifen im Krieg ein feindliches Schiff an; Soldaten marschieren über das Land ihrer Insel. Mittlere Taste ziehen: Karte verschieben. Rechte Taste ziehen: drehen und neigen. Mausrad: zum Mauszeiger zoomen, mit Strg schneller; über Fenstern scrollt es das Fenster.",
        "Tasten: WASD oder Pfeile bewegen die Karte, ebenso die Maus am Rand der Spielfläche (abschaltbar), Q/E drehen. B Baumenü, R drehen, T Straße, Umschalt plus T Pflastern, X oder Entf Abreißen. Tab wählt die nächste eigene Einheit, Umschalt plus Tab die vorige. 1 bis 9 wählen eine Gruppe, Strg plus Zahl speichert die Auswahl als Gruppe, zweimal schnell fährt die Kamera hin. Plus und Minus ändern das Tempo, die Leertaste pausiert. Esc bricht erst das Werkzeug ab, schließt dann das offene Fenster, hebt dann die Auswahl auf und öffnet zuletzt das Menü. Alle Symbole und Knöpfe erklären sich nach kurzem Zeigen in einem Tooltip, Gebäude, Schiffe und Soldaten auf der Karte ebenso.",
        "Meldungen erscheinen oben rechts und verschwinden von selbst; wichtige (Krieg, Eroberung, leere Kasse, Angriff auf ein Kontor, gesunkenes Schiff) bleiben, bis du sie bestätigst. Neu sind Meldungen für volle Lager, blockierte Routen, stehende Betriebe, fertige Gebäude, Wachstum und Unzufriedenheit.",
        "Am Handy: Tippen wählt und baut, ein Finger verschiebt, zwei Finger zoomen und drehen; Schiffe steuert der Knopf „Ziel setzen“. Unten stehen die Kategorien als Symbole, daneben Abriss, Verwaltung und Weltkarte; es ist immer nur ein Fenster offen.",
        "Gespeichert wird automatisch alle zwei Minuten und beim Verlassen; im Menü gibt es drei Spielstände.",
        "In den Einstellungen wählst du die Grafikqualität: Niedrig (für Handys und schwache Grafik), Mittel (weiche Übergänge im Gelände, Wellen, Gras und Blumen, Wind, feinere Modelle, Leuchten bei Nacht) oder Hoch (zusätzlich Umgebungsschatten, Spiegelung des Himmels im Wasser, feinere Schatten und mehr Pflanzen). Ohne Auswahl entscheidet das Gerät: Handys und kleine Bildschirme beginnen auf Niedrig, sonst Mittel. Die Wahl wirkt sofort, auch mitten im Spiel. Schatten und Wettereffekte lassen sich dort zusätzlich abschalten.",
        "Der Knopf „Cheat-Modus“ oben gibt dir unendlich Gold und füllt die Lager deiner Inseln mit jeder Ware bis oben. Dazu ist sofort alles erforscht, jedes Gebäude ohne Voraussetzung baubar (auch die Sperren der Einführung entfallen), und alle deine Wohnhäuser stehen auf der höchsten Schicht, voll bewohnt und mit allen Bedürfnissen erfüllt - neue ebenso, sobald sie fertig sind. Im Hauptmenü lässt sich mit ihm auch der Startwert der Welt sehen und eingeben (gleicher Startwert, gleiche Welt). Beim Ausschalten bekommst du dein Gold von vorher zurück; die Waren bleiben, soweit die Lager sie fassen, die Forschung bleibt erledigt, gebaute Gebäude bleiben stehen, die Freischaltung folgt wieder den normalen Regeln, und die Häuser leben normal weiter (bei Mangel steigen sie ab). Eine Partie mit Cheat zählt nicht für die Bestwerte der Statistik. Mit Cheat gibt es zusätzlich die Tempi 10x und 100x.",
      ],
    },
  ],
};
