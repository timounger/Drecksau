/**
 * The Camel Up rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const CAMEL_UP_RULES: GameRules = {
  title: "Camel Up",
  players: "2 bis 8 Spieler",
  intro:
    "Brettspiel von Steffen Bogen, Spiel des Jahres 2014. Wer am Ende das meiste Geld hat, gewinnt - nicht, wer auf das schnellste Kamel gesetzt hat.",
  sections: [
    {
      title: "Aufbau",
      list: [
        "Fünf Kamele: Blau, Grün, Gelb, Orange, Weiß.",
        "Eine Strecke aus 16 Feldern. Wer darüber hinauskommt, beendet das Rennen.",
        "Eine Pyramide mit fünf Würfeln, einer je Kamelfarbe, mit den Augen 1, 2 und 3.",
        "Jede und jeder bekommt 3 Münzen, je eine Farbkarte pro Kamel und ein Wüstenplättchen.",
      ],
    },
    {
      title: "Der Stapel - die eine Regel, die alles trägt",
      body: ["Kamele stehen aufeinander. Daraus folgt alles Weitere."],
      list: [
        "Ein Kamel, das zieht, nimmt alle Kamele auf seinem Rücken mit.",
        "Wer auf einem besetzten Feld landet, kommt oben drauf.",
        "Oben heißt vorn: Von zwei Kamelen auf einem Feld liegt das obere vorn - es wird getragen.",
        "Das unterste Kamel eines Haufens ist Letzter, egal wie weit vorn der Haufen steht.",
      ],
    },
    {
      title: "Ablauf",
      body: ["Reihum führt jede und jeder genau eine der vier Aktionen aus."],
    },
    {
      title: "1. Pyramide würfeln",
      body: [
        "Ein Würfel kommt heraus, das zugehörige Kamel zieht 1 bis 3 Felder - und du bekommst 1 Münze. Das ist die einzige Aktion, die Geld bringt, und gleichzeitig die einzige, die das Rennen bewegt.",
        "Sind alle fünf Würfel heraus, ist die Etappe zu Ende.",
      ],
    },
    {
      title: "2. Etappenwette",
      body: [
        "Nimm die oberste verbliebene Karte eines Kamels. Je Kamel liegen drei Karten: 5, 3, 2 - wer zuerst auf ein Kamel setzt, bekommt die 5.",
      ],
      table: [
        ["Das Kamel ist am Etappenende …", "Auszahlung"],
        ["Erster", "der Wert der Karte"],
        ["Zweiter", "1 Münze"],
        ["sonst", "-1 Münze"],
      ],
    },
    {
      title: "3. Gesamtwette",
      body: [
        'Lege verdeckt eine deiner Farbkarten auf den Stapel „Sieger" oder „Verlierer". Die Karte ist danach weg.',
        "Abgerechnet wird erst am Ende des Rennens, und zwar in der Reihenfolge, in der gelegt wurde: 8, 5, 3, 2, 1 - alle weiteren richtigen Tipps 1. Jede falsche Karte kostet 1 Münze, egal wann sie gelegt wurde.",
      ],
    },
    {
      title: "4. Wüstenplättchen",
      body: [
        "Lege dein Plättchen auf ein leeres Feld - nicht auf Feld 1 und nicht direkt neben ein fremdes Plättchen. Es hat zwei Seiten:",
      ],
      list: [
        "Oase (+1): Ein Kamel, das hier landet, zieht 1 Feld weiter und kommt oben auf den Stapel.",
        "Fata Morgana (-1): Es geht 1 Feld zurück und schiebt sich unten unter den Stapel.",
        "Beides bringt dir 1 Münze, jedes Mal.",
      ],
    },
    {
      title: "Etappenende",
      body: [
        "Ist der fünfte Würfel heraus, werden die Etappenwetten abgerechnet, die Würfel kommen zurück in die Pyramide, Etappenkarten und Wüstenplättchen zurück zu ihren Besitzern.",
        "Der Streckenstand bleibt, wie er ist - eine Etappe ist ein Abschnitt desselben Rennens.",
      ],
    },
    {
      title: "Rennende",
      body: [
        "Sobald ein Kamel über Feld 16 hinauskommt, endet alles sofort. Die laufende Etappe wird noch abgerechnet, dann die Gesamtwetten. Das meiste Geld gewinnt.",
      ],
    },
  ],
  note: "Gemeint ist die Originalausgabe von 2014, nicht Camel Up 2.0 von 2018 - dort laufen zwei verrückte Kamele rückwärts, die es hier bewusst nicht gibt.",
};
