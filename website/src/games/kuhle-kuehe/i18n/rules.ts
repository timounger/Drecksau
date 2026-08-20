/**
 * The Kuhle Kühe rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const KUHLE_RULES: GameRules = {
  title: "Kuhle Kühe",
  players: "2 bis 5 Spieler",
  intro:
    "Kartenspiel von David Yakos. Baut aus Köpfen, Mittelteilen und Hinterteilen eine möglichst große Herde mit möglichst langen Kühen - und funkt euch dabei gegenseitig dazwischen. Wer am Ende die meisten Punkte hat, gewinnt.",
  sections: [
    {
      title: "Vorbereitung",
      body: [
        "Alle 90 Karten mischen, sechs Handkarten an jede und jeden. Der Rest ist der verdeckte Nachziehstapel.",
      ],
    },
    {
      title: "Phase 1: Neue Karten erhalten",
      body: ["Wer am Zug ist, macht genau eines davon:"],
      list: [
        "Zwei Karten vom Nachziehstapel ziehen.",
        "Eine Kuhkarte vom offenen Ablagestapel nehmen - der Stapel darf durchsucht werden. Kälber und Aktionskarten sind dort tabu.",
        "Einen Kuhhandel auslösen: Alle geben zwei beliebige Handkarten an den linken Nachbarn. In der allerletzten Runde nicht erlaubt.",
      ],
    },
    {
      title: "Phase 2: Karten ausspielen",
      body: [
        "So viele Kuh- und Aktionskarten, wie du möchtest, in beliebiger Reihenfolge - auch mehrere Kühe verschiedener Rassen.",
        "Jede ausgespielte Kuh muss mindestens aus einem Kopf und einem Hinterteil bestehen.",
        "Am Ende deines Zuges darfst du höchstens acht Karten auf der Hand haben; überzählige kommen auf den Ablagestapel.",
      ],
    },
    {
      title: "Kühe",
      body: [
        "Drei Rassen: Longhorn, Holstein und Hochland. Eine Kuh wird aus Teilen einer Rasse gebaut.",
        "Reinrassige Kühe sind am Spielende 2 Punkte je Karte wert - deshalb lohnt sich Warten auf das passende Hinterteil.",
      ],
    },
    {
      title: "Joker",
      body: [
        "Joker-Kuhteile passen zu jeder Rasse und dürfen als Mittelteil auch ohne Futterkarte in eine ausliegende Kuh eingebaut werden.",
        "Sie gehören zu keiner Rasse: Eine Kuh mit mindestens einem Joker zählt nur 1 Punkt je Karte.",
      ],
    },
    {
      title: "Kälber",
      body: [
        'Ein Kalb wird einzeln ausgespielt, aber erst, wenn schon eine erwachsene Kuh vor dir liegt. Es zählt 1 Punkt - und als eine ganze Kuh für die Auszeichnung „Größte Herde".',
      ],
    },
    {
      title: "Die Aktionskarten",
      table: [
        ["Karte", "Wirkung"],
        ["Futter", "Bau ein passendes Mittelteil in eine eigene Kuh ein"],
        ["Kuhliebe", "Leg eine Kuh aus zwei Rassen aus"],
        ["Verrückter Professor", "Leg eine Kuh aus drei Rassen aus"],
        ["Viehdieb", "Stiehl eine komplette Kuh"],
        ["Kuhschubser", "Entferne alle Mittelteile einer Kuh"],
        ["Mistgabel", "Entferne ein Mittelteil einer Kuh"],
        ["Kälberklau", "Entferne ein Kalb"],
        ["Herdenhund", "Wehre einen Angriff ab"],
        ["Brandeisen / Stall", "Beschütze eine eigene Kuh dauerhaft"],
        ["Lasso", "Stiehl eine Handkarte"],
      ],
      body: [
        "Gekreuzt wird nur beim Auslegen der Kuh - nachträglich geht es nicht. Eine Schutzkarte lässt sich nur durch die jeweils andere entfernen. Und das Lasso ist eine Spezialkarte: gegen die hilft der Herdenhund nicht.",
      ],
    },
    {
      title: "Auszeichnungen",
      table: [
        ["Auszeichnung", "Punkte", "Bedingung"],
        ["Die Erste Kuh", "1", "Wer als Erster eine Kuh auslegt - behält sie"],
        [
          "Die Größte Herde",
          "2",
          "Meiste Kühe, mindestens 3 (Kälber zählen mit)",
        ],
        ["Die Längste Kuh", "3", "Längste Kuh, mindestens 5 Karten"],
      ],
      body: [
        "Größte Herde und Längste Kuh wechseln erst, wenn jemand echt mehr hat - bei Gleichstand behält sie der bisherige Besitzer.",
      ],
    },
    {
      title: "Spielende und Wertung",
      body: [
        "Das Spiel endet, sobald jemand die letzte Karte vom Nachziehstapel nimmt. Die anderen sind dann noch jeweils einmal am Zug.",
      ],
      table: [
        ["Was", "Punkte"],
        ["Reinrassige Kühe", "2 je Karte"],
        ["Gemischte oder gekreuzte Kühe", "1 je Karte"],
        ["Kälber", "1 je Karte"],
        ["Auszeichnungen", "1 bis 3"],
      ],
    },
  ],
  note: "Die Anleitung verweist für die genaue Kartenaufteilung auf den Schachtelboden, der nicht vorlag. Die Gesamtzahlen stimmen (17 Köpfe, 22 Mittelteile, 17 Hinterteile, 7 Kälber, 27 Aktionskarten); wie sich Rassen, Joker und Aktionssorten darauf verteilen, ist hier festgelegt.",
};
