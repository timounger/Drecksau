/**
 * The rules of Arschloch, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const ARSCHLOCH_RULES: GameRules = {
  title: "Arschloch",
  players: "3 bis 6 Spieler",
  intro:
    "Alle Karten werden verteilt, und alle wollen sie als Erste wieder loswerden. Wer zuerst leer ist, wird Präsident, wer als Letzter noch Karten hält, ist das Arschloch - und muss in der nächsten Runde seine besten Karten abgeben. Genau das macht das Spiel: Der Rückstand wird größer, bis es jemandem gelingt, ihn zu drehen.",
  sections: [
    {
      title: "Die Karten",
      body: [
        "Ein Skatblatt mit 32 Karten. Von schwach nach stark: 7, 8, 9, Bube, Dame, König, 10, Ass - die Zehn steht also zwischen König und Ass, wie beim Skat.",
        "Die Farbe zählt nie. Sie ist nur dazu da, zwei Damen auseinanderzuhalten.",
        "Alle 32 Karten werden verteilt. Zu viert sind das acht je Person; sonst geht das Blatt nicht auf, und die übrigen Karten bekommt der mittlere Spieler - der Bürger aus der Runde davor. Er sieht sie an und legt genauso viele wieder verdeckt ab, bevor gespielt wird.",
      ],
    },
    {
      title: "Ein Stich",
      body: [
        "Wer ausspielt, entscheidet alles: eine einzelne Karte, ein Paar, ein Drilling oder ein Vierling. Diese Anzahl gilt für den ganzen Stich.",
        "Reihum muss man dieselbe Anzahl gleicher Karten legen, und zwar höher als das, was liegt - oder passen. Wer einmal gepasst hat, ist bis zum Ende des Stichs draußen.",
        "Haben alle anderen gepasst, gewinnt die oberste Karte den Stich. Der Tisch wird abgeräumt, und wer ihn gewonnen hat, spielt neu aus.",
      ],
    },
    {
      title: "Titel",
      body: [
        "Wer als Erster keine Karten mehr hat, ist Präsident, dann Vizepräsident, in der Mitte Bürger, dann Vizearschloch - und wer als Letzter noch Karten hält, ist das Arschloch.",
        "Die Runde endet, sobald der Vorletzte fertig ist. Der Letzte spielt nicht allein weiter.",
      ],
    },
    {
      title: "Der Kartentausch",
      body: [
        "Vor jeder weiteren Runde darf sich der Präsident zwei Karten aus der Hand des Arschlochs wünschen, der Vizepräsident eine aus der Hand des Vizearschlochs. Dafür wird ihm diese Hand gezeigt - nur ihm.",
        "Geschützt ist, was dreimal oder öfter da ist: Einen Drilling muss niemand hergeben. Hat der Verlierer nichts anderes, fällt der Tausch ganz aus.",
        "Zurück kommen genauso viele Karten - die dürfen sich Präsident und Vize aussuchen. Darin liegt die Härte: Wünschen darf man sich das Beste, zurückgeben das Schlechteste.",
        "Das Arschloch spielt die nächste Runde aus.",
      ],
    },
    {
      title: "Punkte",
      body: [
        "Pro Runde gibt es einen Punkt für jede Person, die man hinter sich lässt: Der Präsident bekommt am Tisch zu viert drei Punkte, das Arschloch keinen.",
        "Nach der eingestellten Rundenzahl gewinnt, wer die meisten Punkte hat.",
      ],
    },
    {
      title: "Was diese Umsetzung anders macht",
      body: [
        "Die Anleitung kennt eine Menge Hausregeln - Bomben, Revolution, gleiche Karte legt nach. Hier ist keine davon eingebaut: Das Grundspiel steht zuerst, und jede Sonderregel ändert es kräftig.",
        "Und einen Klick spart sich das Spiel: Wer nachweislich nicht antworten kann, wird übersprungen, statt passen zu müssen - weil er weniger Karten hält, als der Stapel verlangt, oder weil nach den gespielten Karten niemand mehr überbieten kann. Am Tisch würde man auch diese Runde fragen; hier steht im Spielverlauf, warum sie ausfiel.",
      ],
    },
  ],
};
