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
        "Zu viert bekommt jeder acht Karten. Zu dritt, zu fünft und zu sechst bleiben zwei Siebenen im Karton, damit das Blatt aufgeht - alle bekommen gleich viele.",
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
        "Vor jeder weiteren Runde gibt das Arschloch seine zwei besten Karten an den Präsidenten, das Vizearschloch seine beste an den Vizepräsidenten.",
        "Zurück kommen genauso viele Karten - aber die dürfen sich Präsident und Vize aussuchen. Genau darin liegt der Unterschied: Abgeben muss man das Beste, zurückgeben darf man das Schlechteste.",
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
      title: "Was hier nicht gilt",
      body: [
        "Die Anleitung kennt eine Menge Hausregeln - Bomben, Revolution, gleiche Karte legt nach. Hier ist keine davon eingebaut: Das Grundspiel steht zuerst, und jede Sonderregel ändert es kräftig.",
      ],
    },
  ],
};
