/**
 * Every German text of the Zelda game - screen, signs, villagers, finds,
 * inventory, map and the statistics card.
 *
 * @module
 * @remarks
 * Texts for the text box are split into pages with "|". A page holds three
 * lines of about forty-five letters - keep each page under 110 letters.
 */
import type {
  AreaId,
  Bottle,
  ItemId,
  Treasure,
} from "@/games/zelda/engine/types";

/** Texts of the game screen. */
export const ZELDA_TEXTS = {
  title: "Zelda",
  subtitle: "Ein kleines Abenteuer im Stil des Game Boy Advance.",
  newGame: "Neues Spiel",
  newGameTitle: "Fängt mit drei Herzen am Dorf neu an",
  confirmNewGameTitle: "Neues Spiel?",
  confirmNewGame:
    "Du fängst mit drei Herzen in Grünau neu an. Der automatisch gespeicherte Fortschritt wird überschrieben.",
  confirmNewGameYes: "Ja, neu anfangen",
  confirmLoadTitle: "Spielstand laden?",
  confirmLoadYes: "Ja, laden",
  cancel: "Abbrechen",
  statistics: "Statistik",
  cheat: "Cheat-Modus",
  cheatTitle:
    "Unverwundbar, zehn Herzen, alle Gegenstände, volle Flaschen, 999 Rubine und doppelt so schnell",
  fullscreen: "Vollbild",
  fullscreenExit: "Vollbild beenden",
  soundOn: "Ton an",
  soundOff: "Ton aus",
  graphicsHd: "Grafik: HD",
  graphicsPixel: "Grafik: Pixel",
  graphicsTitle:
    "HD zeichnet alles mit doppelter (oder dreifacher) Pixeldichte, Pixel zeigt die ursprüngliche Grafik in groben Pixeln.",
  start: "Abenteuer starten",
  resume: "Weiterspielen",
  startHint:
    "Der Schattenmagier Vorgrim hat den Sonnenstein geraubt. Sprich mit der Ältesten in Grünau!",
  savedHint: "Dein Spielstand ist gespeichert.",
  gameOver: "Game Over",
  gameOverHint: "Link ist ohnmächtig geworden.",
  continueGame: "Weiter",
  restart: "Neu starten",
  pause: "Pause",
  pauseHint:
    "Esc: weiterspielen. Automatisch gespeichert wird trotzdem laufend.",
  saveGame: "Spielstand speichern",
  loadGame: "Spielstand laden",
  savedAt: "Gespeichert am",
  noSlot: "Noch kein Spielstand gespeichert.",
  confirmLoad: "Was du seit dem Speichern geschafft hast, geht verloren.",
  inventory: "Gegenstände",
  map: "Karte",
  inventoryHintA: "Linksklick oder A: auf A legen",
  inventoryHintB: "Rechtsklick oder B: auf B legen",
  mapHint: "R oder Pfeil: Gegenstände - I, Esc oder X: schließen",
  saveButton: "SPEICHERN",
  saveHint: "Speichert deinen Spielstand von Hand (wie Esc - Speichern).",
  saved: "Gespeichert!",
  emptySlot: "Hier fehlt noch etwas ...",
  roll: "Rollen",
  read: "Lesen",
  talk: "Reden",
  open: "Öffnen",
  buy: "Kaufen",
  lift: "Heben",
  throw: "Werfen",
  shrink: "Klein",
  dive: "Tauchen",
  grow: "Groß",
  overworldName: "Grünau und Umgebung",
  templeName: "Moostempel",
  rootName: "Wurzelreich",
  noMap: "Ohne Karte siehst du nur die Räume, die du betreten hast.",
  keys: "Schlüssel",
  pieces: "Herzteile",
  victory: "Der Steinwächter ist besiegt!",
  controlsTitle: "Steuerung",
  controlsMove: "Bewegen: Pfeiltasten / WASD",
  controlsSword:
    "A: linke Maustaste, J oder Leertaste - benutzt, was auf A liegt (anfangs das Schwert); A auch zum Reden, Öffnen, Heben",
  controlsItem: "B: rechte Maustaste oder K - benutzt, was auf B liegt",
  controlsRoll:
    "Rollen (R): L oder Umschalt - im Wasser taucht R, A schwimmt schneller",
  controlsMenu:
    "Gegenstände (I): Linksklick legt auf A, Rechtsklick auf B; R blättert zur Karte",
  controlsPause: "Pause, Speichern, Laden: Esc",
  controlsTouch: "Am Handy: Steuerkreuz und Tasten unter dem Bild",
} as const;

/** The names of the tools in the inventory. */
export const ITEM_NAMES: Readonly<Record<ItemId, string>> = {
  sword: "Schwert",
  shield: "Schild",
  bow: "Bogen",
  bombs: "Bomben",
  boomerang: "Bumerang",
  lantern: "Laterne",
  boots: "Sprintstiefel",
  fireRod: "Feuerstab",
  hookshot: "Enterhaken",
  shovel: "Schaufel",
  feather: "Sprungfeder",
  gloves: "Krafthandschuhe",
};

/** What each tool does, shown in the inventory's name bar. */
export const ITEM_HINTS: Readonly<Record<ItemId, string>> = {
  sword: "Schlägt zu - halten lädt die Wirbelattacke",
  shield: "Halten: hebt ihn und blockt Angriffe von vorn",
  bow: "Schießt Pfeile - braucht Munition",
  bombs: "Sprengt rissige Felsen und Wände",
  boomerang: "Betäubt Gegner, holt Rubine",
  lantern: "Entzündet Fackeln direkt vor dir",
  boots: "Halten: losrennen - das Schwert voran",
  fireRod: "Feuerball: brennt Gras ab, zündet Fackeln",
  hookshot: "Zieht dich zu Pfosten und Truhen, betäubt",
  shovel: "Gräbt weichen Boden um - was liegt darunter?",
  feather: "Hüpft über Zäune, Pfützen und Schüsse",
  gloves: "Hebt schwere Felsen - wirkt von selbst",
};

/** The names of a bottle, by what it holds. */
export const BOTTLE_NAMES: Readonly<Record<Bottle, string>> = {
  empty: "Flasche (leer)",
  potion: "Heiltrank",
};

/** What a bottle does, by what it holds. */
export const BOTTLE_HINTS: Readonly<Record<Bottle, string>> = {
  empty: "Bodo füllt sie mit Heiltrank",
  potion: "Trinken füllt alle Herzen",
};

/** Names of the finds shown in the inventory. */
export const TREASURE_NAMES = {
  gloves: "Krafthandschuhe",
  bigKey: "Großer Schlüssel",
  map: "Karte",
  compass: "Kompass",
  sunstone: "Sonnenstein",
} as const;

/**
 * What the signs and stone tablets say, per map, in the order they stand on
 * it (row by row).
 *
 * @remarks
 * Each map has exactly as many signs as its list has lines; a sign without a
 * line here would say nothing at all, so the two are kept in step.
 */
export const SIGN_TEXTS: Readonly<Record<AreaId, readonly string[]>> = {
  overworld: [
    "Seltsame Risse im Fels ... Vielleicht hilft hier eine Bombe weiter?",
    "Der Moostempel. Seit Vorgrim hier war, grollt es tief unten im Fels.",
    "Alte Ruinen. Ein Ritter in schwarzer Rüstung bewacht sie. Von vorn hält sein Schild alles ab!",
    "Norden: das Hügelland. Vorsicht vor springenden Tektiten!",
    "Osten: die Moblin-Weide. Moblins stürmen los, sobald sie dich sehen.",
    "Die alte Brücke. Hinter dem Fluss liegen die Weiden, im Süden der Spiegelsee.",
    "Bodos Laden - Herzen, Pfeile, Bomben. Immer hereinspaziert!",
    "Willkommen in Grünau! Schneide Büsche und Gras - manchmal liegen Rubine darunter.",
    "Der Dunkelwald. Hier flattern Keese durch die Bäume.",
    "Westen: der Dunkelwald. Tief im Wald soll ein Herzcontainer liegen.",
    "Der Wichtelstumpf. Stell dich darauf und drück R - dann bist du so klein wie ein Käfer.",
  ],
  dungeon: [
    "Das ewige Feuer brennt in der Mitte. Ein Pfeil, der hindurchfliegt, fängt Feuer.",
    "Eine schwere Bodenplatte. Sie gibt nur unter einem Steinblock nach. Schieb ihn hin!",
    "Die Wächterkammer liegt im Norden. Nur der große Schlüssel öffnet ihr Tor.",
    "Moostempel. Verschlossene Türen brauchen kleine Schlüssel - und rissige Wände mögen Bomben.",
  ],
  houses: [],
  mini: [],
};

/** What the villagers say, depending on how far the story has got. */
export const NPC_TEXTS = {
  elderQuest:
    "Link! Gut, dass du kommst. Heute Nacht hat der Schattenmagier Vorgrim den Sonnenstein aus unserem Brunnen geraubt.|Ohne sein Licht verdorren die Felder. Vorgrim hat ihn in den Moostempel in der Klippe gebracht.|Dort hat er einen steinernen Wächter geweckt. Bitte hol den Sonnenstein zurück!|Ich sage Tamo am Tempeltor Bescheid. Und nimm genug Pfeile mit - Bodo im Laden hat welche.",
  elderAgain:
    "Der Moostempel liegt in der Klippe nördlich des Dorfes, östlich der Treppe. Tamo lässt dich jetzt hinein.|Verschlossene Türen brauchen kleine Schlüssel. Sei vorsichtig, Link!",
  elderReturn:
    "Der Sonnenstein! Spürst du, wie warm er leuchtet? Grünau ist gerettet!|Vorgrim ist geflohen, aber sein schwarzer Ritter wacht noch in den Ruinen im Nordosten.|Mit den Krafthandschuhen kannst du schwere Felsen heben. Am Spiegelsee soll hinter so einem Felsen etwas liegen.",
  elderDone: "Danke, Link. Ohne dich wäre Grünau verloren.",
  shopkeeper:
    "Willkommen in Bodos Laden! Stell dich vor eine Ware und drück A, um sie zu kaufen.|Heiltrank fülle ich dir in eine leere Flasche. Eine Flasche hätte ich auch noch.",
  guardClosed:
    "Halt! Hinter mir liegt der Moostempel. Seit Vorgrim dort war, kommt Gebrüll aus der Tiefe.|Ohne Erlaubnis der Ältesten lasse ich niemanden hinein. Sie wohnt im Haus im Westen des Dorfes.",
  guardOpen:
    "Die Älteste schickt dich? Dann tritt ein, Link. Pass auf dich auf!",
  guardAfter:
    "Du hast den Wächter besiegt? Unglaublich! Grünau ist stolz auf dich.",
  kid: "Hast du den alten Stumpf ganz im Süden gesehen? Wer sich draufstellt und R drückt, wird so klein wie ein Käfer!|Zwischen den Steinen daneben ist ein Mauseloch. Da passt aber nur ein Käfer durch ...",
  farmer:
    "Seit der Sonnenstein fort ist, wächst auf meinem Feld nichts mehr. So ein Elend!|Mein Großvater hat mitten im Feld etwas vergraben. Eine Schaufel müsste man haben ...",
  farmerAfter: "Sieh nur, die Sprossen kommen wieder! Danke, Link!",
} as const;

/** What the text box says about a find held up. */
export const TREASURE_TEXTS: Readonly<Record<Treasure, string>> = {
  key: "Du hast einen kleinen Schlüssel gefunden! Er öffnet eine verschlossene Tür in diesem Tempel.",
  bigKey: "Der große Schlüssel! Damit öffnest du das Tor zur Wächterkammer.",
  map: "Du hast die Tempelkarte gefunden!|Drück I und dann R, um sie anzusehen.",
  compass:
    "Der Kompass! Auf der Karte zeigt er jetzt die Truhen und den Wächter.",
  gloves:
    "Du hast die Krafthandschuhe!|Stell dich vor einen schweren Felsen und drück A, um ihn hochzuheben. Mit A wirfst du ihn wieder.",
  piece: "Du hast ein Herzteil gefunden!",
  container:
    "Du hast einen Herzcontainer gefunden! Deine Lebensenergie steigt um ein Herz.",
  rupees: "50 Rubine! Die kann man im Laden gut gebrauchen.",
  sunstone:
    "Du hast den Sonnenstein zurückerobert!|Bring ihn der Ältesten nach Grünau.",
  lantern:
    "Du hast die Laterne gefunden!|Leg sie im Menü auf A oder B. Vor einer kalten Fackel entzündet sie das Feuer.",
  boots:
    "Du hast die Sprintstiefel gefunden!|Halte ihre Taste gedrückt: Link rennt mit dem Schwert voran los. Bäume schüttelt er dabei kräftig durch.",
  fireRod:
    "Du hast den Feuerstab gefunden!|Er schießt Feuerbälle, die Gras und Büsche abbrennen, Fackeln entzünden und Monster verbrennen.",
  hookshot:
    "Du hast den Enterhaken gefunden!|Er hakt sich in Holzpfosten und Truhen und zieht dich hinüber - auch über reißende Strömung, in der niemand schwimmen kann.",
  shovel:
    "Du hast die Schaufel gefunden!|Grab weichen Boden um. Wo die Erde aufgewühlt aussieht, liegt bestimmt etwas.",
  feather:
    "Du hast die Sprungfeder gefunden!|Damit hüpfst du über Zäune, Pfützen und feindliche Schüsse.",
  bottle:
    "Du hast eine leere Flasche gefunden!|In Bodos Laden füllst du sie mit Heiltrank. Leg sie auf A oder B und trink, wenn es knapp wird.",
};

/** Messages the game shows by itself. */
export const MESSAGES = {
  noArrows: "Keine Pfeile mehr!",
  noBombs: "Keine Bomben mehr!",
  needKey: "Verschlossen - ein kleiner Schlüssel fehlt.",
  needBigKey: "Nur der große Schlüssel öffnet dieses Tor.",
  tooHeavy:
    "Der Felsen ist viel zu schwer. Mit Krafthandschuhen ginge es vielleicht.",
  pieceFull:
    "Du hast ein Herzteil gefunden! Vier Teile ergeben ein ganzes Herz - deine Lebensenergie steigt!",
  pieceCount: [
    "",
    "Noch drei, dann wächst deine Lebensenergie.",
    "Das zweite! Noch zwei fehlen.",
    "Das dritte! Nur noch eins.",
  ],
  shopFull: "Davon hast du schon genug.",
  shopPoor: "Dafür hast du nicht genug Rubine.",
  boughtHeart: "Danke! Ein Herz für dich.",
  boughtArrows: "Danke! Zehn Pfeile für deinen Köcher.",
  boughtBombs: "Danke! Fünf Bomben - aber Vorsicht damit!",
  boughtPotion:
    "Danke! Ein Heiltrank in deiner Flasche. Trink ihn, wenn es knapp wird.",
  shopNoBottle: "Heiltrank verkaufe ich nur in eine Flasche. Du hast keine.",
  tooHard: "Hier ist der Boden zu hart.",
  bottleEmpty: "Die Flasche ist leer.",
} as const;

/** Labels of the adventure card on the statistics page. */
export const ZELDA_STATS_TEXTS = {
  title: "Abenteuer",
  monsters: "Besiegte Monster",
  rupees: "Gesammelte Rubine",
  deaths: "Ohnmachten",
  cuts: "Geschnittene Büsche",
  darknuts: "Darknuts besiegt",
  favourite: "Häufigste Beute",
  none: "-",
} as const;

/** Monster names, as the statistics card shows them. */
export const MONSTER_NAMES = {
  octorok: "Oktorok",
  chuchu: "Schleim",
  keese: "Keese",
  moblin: "Moblin",
  tektite: "Tektit",
  darknut: "Darknut",
} as const;
