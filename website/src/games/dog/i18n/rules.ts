/**
 * The rules of Dog, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const DOG_RULES: GameRules = {
  title: "Dog",
  players: "2 bis 6 Spieler",
  intro:
    "Figuren vom Zwinger einmal rund um das Brett und ins Ziel - bewegt wird aber nicht mit Würfeln, sondern mit Karten. Zu viert und zu sechst sitzt dir dein Partner gegenüber: Gewonnen hat erst, wenn alle acht Figuren eures Teams im Ziel stehen. Zu zweit, zu dritt und zu fünft spielt jeder für sich. Die beste Karte ist oft die, mit der du deinem Partner hilfst, und der härteste Zug der, mit dem du eine eigene Figur schlagen musst.",
  sections: [
    {
      title: "Die Karten",
      body: [
        "110 Karten: von jedem Wert acht Stück und dazu sechs Joker. Blaue Karten sind schlicht Schritte vorwärts - 2, 3, 5, 6, 8, 9, 10 und die Dame als 12.",
        "Rot sind die Sonderkarten: Ass (1 oder 11, oder eine Figur aus dem Zwinger), König (13 oder eine Figur heraus), Vier (vier vor oder vier zurück), Sieben (beliebig auf eigene Figuren aufteilen), Bube (zwei Figuren tauschen) und der Joker, der jede andere Karte sein darf.",
        "In der ersten Runde bekommt jeder sechs Karten, dann fünf, vier, drei, zwei - und danach wieder sechs. Nachgezogen wird nie: Was ausgespielt ist, ist weg.",
      ],
    },
    {
      title: "Die Karte für den Partner",
      body: [
        "Vor jeder Runde schiebt jeder verdeckt eine Karte zu - im Teamspiel dem Partner, sonst dem linken Nachbarn. Das ist die einzige Hilfe, die erlaubt ist; über Karten oder Züge wird nicht gesprochen.",
        "Hat dein Partner keine Figur auf der Bahn, ist ein Ass, ein König oder ein Joker das Beste, was du ihm geben kannst.",
      ],
    },
    {
      title: "Ziehen und Schlagen",
      body: [
        "Auf einem Feld steht immer nur eine Figur. Wer auf ein besetztes Feld zieht, schlägt die Figur, die dort steht - auch die eigene oder die des Partners. Sie geht zurück in den Zwinger.",
        "Übersprungen werden darf jede Figur. Die einzige Ausnahme ist eine Figur auf ihrem eigenen Startfeld: Die ist geschützt, kann nicht geschlagen, nicht getauscht und nicht überholt werden - und blockiert damit alle anderen.",
        "Jede Karte muss vollständig ausgeführt werden. Wer mit zwei Schritten ins Ziel käme, aber nur eine Zehn auf der Hand hat, zieht eben am Ziel vorbei.",
        "Wer gar nichts spielen kann, legt im Teamspiel seine Karten ab und ist für diese Runde raus. Spielt jeder für sich, wirft er stattdessen eine Karte ab und zieht eine neue nach.",
      ],
    },
    {
      title: "Die Sieben",
      body: [
        "Die sieben Schritte dürfen auf beliebig viele eigene Figuren verteilt werden - das schließt Lücken im Ziel, die sonst nicht zu schließen sind.",
        "Dafür ist die Sieben die einzige Karte, die alles verbrennt, was sie überholt: Jede Figur auf den überquerten Feldern geht zurück, die eigene eingeschlossen.",
        "Alle sieben Punkte müssen weg. Geht das nicht, darf die Karte nicht gespielt werden.",
      ],
    },
    {
      title: "Das Ziel",
      body: [
        "Das Ziel wird immer vorwärts über das eigene Startfeld betreten - aber nie direkt vom Startfeld aus. Eine Figur, die gerade aus dem Zwinger gekommen ist, muss erst einmal herum.",
        "Im Ziel ist die Figur sicher: Dort wird weder geschlagen noch übersprungen. Innerhalb des Ziels darf sie aber weiter nach vorne rücken.",
        "Sind alle eigenen Figuren im Ziel, spielt man mit den Figuren des Partners weiter - bis alle acht drin sind. Ohne Partner ist die Partie dann für einen vorbei: Vier Figuren im Ziel gewinnen.",
      ],
    },
    {
      title: "Was diese Umsetzung anders macht",
      body: [
        "Zu viert und zu sechst wird in Teams gespielt, zu zweit, zu dritt und zu fünft jeder für sich - dann mit fünf Figuren, von denen eine schon auf dem Startfeld steht, und gewonnen hat, wer als Erster vier Figuren im Ziel hat. Wer dabei nichts ziehen kann, wirft eine Karte ab und zieht eine neue nach, statt auszusetzen.",
        "Das Brett ist dem gedruckten nachgebaut: ein Stern mit einem Arm je Farbe, das Ziel in der Mitte des Arms, der Zwinger außen daneben. Vorne vier Farben, hinten sechs - hier gibt es denselben Stern für zwei bis sechs Spieler.",
        "Die Mitspieler überlegen nicht lange: Der Computer zieht sofort. Online hat jeder 30 Sekunden Zeit, danach zieht der Computer für ihn.",
        "Die Laufrichtung ist im Uhrzeigersinn. Die in der Schweiz übliche Gegenrichtung ist Vereinbarungssache am Tisch - hier steht sie fest, damit die Regeln in der Anleitung und das, was auf dem Brett passiert, dasselbe sagen.",
      ],
    },
  ],
};
