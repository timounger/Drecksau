/**
 * The rules of CATAN, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const CATAN_RULES: GameRules = {
  title: "CATAN",
  players: "3 bis 6 Spieler",
  intro:
    "19 Landschaftsfelder, 5 Rohstoffe und 2 Würfel. Wer zuerst 10 Siegpunkte hat und selbst am Zug ist, gewinnt.",
  sections: [
    {
      title: "Gründungsphase",
      body: [
        "Reihum setzt jede:r 1 Siedlung und 1 angrenzende Straße. Danach geht es rückwärts wieder herum: noch 1 Siedlung und 1 Straße.",
        "Für die zweite Siedlung bekommst du sofort von jedem angrenzenden Feld 1 Rohstoff.",
      ],
    },
    {
      title: "Ein Zug",
      list: [
        "Ertragsphase: mit beiden Würfeln werfen",
        "Handels- und Bauphase: tauschen, bauen, Entwicklungskarten kaufen",
      ],
      body: [
        "Eine Entwicklungskarte darfst du zu jedem Zeitpunkt deines Zugs ausspielen, auch vor dem Würfeln - aber nur eine pro Zug, und keine, die du in diesem Zug gekauft hast.",
      ],
    },
    {
      title: "Erträge",
      body: [
        "Für jedes Feld mit der gewürfelten Zahl bekommt jede angrenzende Siedlung 1 Rohstoff und jede Stadt 2. Das Feld, auf dem der Räuber steht, bringt nichts.",
      ],
    },
    {
      title: "Die 7 und der Räuber",
      body: [
        "Bei einer 7 gibt es keine Erträge. Wer mehr als 7 Karten hat, gibt die Hälfte ab (abgerundet).",
        "Danach setzt die würfelnde Person den Räuber auf ein anderes Feld und zieht 1 zufällige Karte von jemandem, der dort ein Gebäude hat.",
      ],
    },
    {
      title: "Baukosten",
      table: [
        ["Was", "Kosten", "Punkte"],
        ["Straße", "1 Lehm + 1 Holz", "-"],
        ["Siedlung", "1 Lehm + 1 Holz + 1 Wolle + 1 Getreide", "1"],
        ["Stadt", "2 Getreide + 3 Erz", "2"],
        ["Entwicklungskarte", "1 Wolle + 1 Getreide + 1 Erz", "-"],
      ],
      body: [
        "Eine Stadt entsteht nur aus einer eigenen Siedlung. Die Siedlung kommt zurück in den Vorrat.",
      ],
    },
    {
      title: "Wohin darf gebaut werden?",
      body: [
        "Straße: auf einen freien Weg an einer Kreuzung, an der eine eigene Straße, Siedlung oder Stadt liegt - und an der keine fremde Siedlung oder Stadt steht.",
        "Siedlung: auf eine Kreuzung, zu der eine eigene Straße führt. Abstandsregel: Die 3 benachbarten Kreuzungen müssen frei sein, egal wem sie gehören würden.",
      ],
    },
    {
      title: "Handeln",
      body: [
        "Mit den anderen: nur mit der Person, die am Zug ist - die anderen tauschen nicht untereinander.",
        "Mit dem Vorrat: 4 gleiche gegen 1 beliebige.",
        "Mit einem Hafen, an dem du ein Gebäude hast: 3 gleiche gegen 1 beliebige, oder am passenden Hafen 2 gleiche der angegebenen Sorte gegen 1 beliebige.",
      ],
    },
    {
      title: "Entwicklungskarten",
      table: [
        ["Karte", "Anzahl", "Wirkung"],
        ["Ritter", "14", "Räuber versetzen und 1 Karte ziehen"],
        ["Siegpunkt", "5", "1 Siegpunkt, bleibt verdeckt"],
        ["Straßenbau", "2", "2 Straßen kostenlos"],
        ["Erfindung", "2", "2 Rohstoffe aus dem Vorrat"],
        ["Monopol", "2", "Alle geben dir jede Karte eines Rohstoffs"],
      ],
    },
    {
      title: "Die beiden Sondertafeln",
      body: [
        "Längste Handelsroute: 2 Siegpunkte für den ersten durchgehenden Straßenzug aus mindestens 5 Straßen. Abzweigungen zählen nicht, eine fremde Siedlung unterbricht. Wer länger baut, bekommt die Tafel sofort.",
        "Größte Rittermacht: 2 Siegpunkte für die ersten 3 ausgespielten Ritter. Wer mehr ausspielt, bekommt die Tafel sofort.",
      ],
    },
    {
      title: "Spielende",
      body: [
        "Das Spiel endet in dem Zug, in dem jemand 10 oder mehr Siegpunkte erreicht und selbst am Zug ist. Siegpunktkarten werden dabei aufgedeckt.",
      ],
    },
    {
      title: "Zu fünft und zu sechst",
      body: [
        "Mit der 5-6 Personen Erweiterung: 30 Landschaftsfelder statt 19, zwei Wüsten, 28 Zahlenchips und 34 Entwicklungskarten. Der Räuber startet auf einer der beiden Wüsten.",
        "An jedem Spielzug sind zwei Personen beteiligt. Wer Stein 1 hat, würfelt für alle und darf alles: handeln, bauen, 1 Entwicklungskarte spielen - auch vor dem Würfeln.",
        "Wer Stein 2 hat, spielt danach einen kürzeren Zug: bauen, mit dem Vorrat tauschen und 1 Entwicklungskarte ausspielen - aber nicht mit den anderen handeln. Danach wandern beide Steine einen Platz nach links.",
        "Stein 2 sitzt immer 3 Plätze links von Stein 1. Erreichen beide im selben Spielzug die Siegpunkte, gewinnt Stein 1 - Stein 2 kommt dann nicht mehr an die Reihe.",
      ],
    },
    {
      title: "Varianten aus Händler & Barbaren",
      body: [
        "In den Einstellungen zuschaltbar, einzeln oder zusammen - die Anleitung erlaubt jede Kombination ausdrücklich.",
        "Freundlicher Räuber: Der Räuber darf nicht auf ein Feld gesetzt werden, an dem jemand mit höchstens 2 Siegpunkten eine Siedlung hat, und bei so jemandem wird auch keine Karte gezogen. Ist dadurch kein Feld frei, bleibt der Räuber auf der Wüste.",
        "Die Häfen von Catan: Eine Siedlung am Hafen zählt 1 Hafenpunkt, eine Stadt 2. Wer zuerst 3 Hafenpunkte hat, bekommt die Tafel Stärkste Häfen für 2 Siegpunkte; wer mehr Hafenpunkte erreicht, bekommt sie sofort. Zum Sieg braucht es dann einen Siegpunkt mehr.",
        "Ereignisse auf Catan: 37 Karten ersetzen die Würfel. Statt zu würfeln deckst du die oberste Karte auf. Ihre Zahl schüttet die Erträge aus - die Verteilung ist exakt die zweier Würfel. Etwa die Hälfte der Karten löst zusätzlich ein Ereignis aus, und das Ereignis kommt zuerst.",
      ],
    },
    {
      title: "Die 11 Ereignisse",
      table: [
        ["Karte", "Wirkung"],
        ["Räuberüberfall (6x)", "wie eine gewürfelte 7"],
        ["Ein schöner Tag (16x)", "kein Ereignis, nur Erträge"],
        ["Seuche (2x)", "jede Stadt bringt nur 1 Rohstoff"],
        ["Erdbeben", "alle stellen 1 eigene Straße quer"],
        ["Gute Nachbarschaft", "alle geben 1 Karte nach links"],
        ["Ritterturnier", "meiste Ritter: 1 Rohstoff"],
        ["Handelsvorteil", "Längste Handelsroute zieht 1 Karte"],
        ["Ruhige See (2x)", "meiste Hafengebäude: 1 Rohstoff"],
        ["Rückzug des Räubers (2x)", "Räuber zurück auf die Wüste"],
        ["Nachbarschaftshilfe (2x)", "Führende schenken 1 Karte"],
        ["Konflikt", "alleiniger Ritterführer zieht 1 Karte"],
        ["Ertragreiches Jahr", "alle nehmen 1 Rohstoff"],
        ["Jahreswechsel", "Stapel wird neu gemischt"],
      ],
      body: [
        "Eine quergestellte Straße muss für 1 Holz + 1 Lehm repariert werden. Bis dahin kannst du keine neue Straße bauen und sie führt zu keiner neuen Siedlung - für die Längste Handelsroute zählt sie aber weiter.",
      ],
    },
  ],
  note: "CATAN - Das Spiel von Klaus Teuber, KOSMOS. Gespielt wird der variable Aufbau: gemischte Landschaften, Zahlenchips in alphabetischer Reihenfolge gegen den Uhrzeigersinn ab einem Eckfeld.",
};
