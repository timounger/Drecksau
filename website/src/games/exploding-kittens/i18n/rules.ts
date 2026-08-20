/**
 * The Exploding Kittens rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const EK_RULES: GameRules = {
  title: "Exploding Kittens",
  players: "2 bis 5 Spieler",
  intro:
    "Im Deck stecken Explodierende Kätzchen. Reihum wird gezogen, bis jemand eines erwischt - dann ist er raus. Wer als Letzter übrig bleibt, gewinnt. Alle anderen Karten dienen nur dazu, das Ziehen zu überleben.",
  sections: [
    {
      title: "Vorbereitung",
      list: [
        "Alle 4 Kätzchen und alle 6 Entschärfungen kommen aus dem Deck.",
        "Jeder bekommt 1 Entschärfung, 2 übrige werden zurückgemischt, der Rest ist raus.",
        "Jeder bekommt 7 weitere Karten - also 8 auf der Hand.",
        "So viele Kätzchen zurückmischen, dass eines weniger als Spieler drin ist. So explodieren am Ende alle bis auf einen.",
      ],
    },
    {
      title: "Dein Zug",
      body: [
        "Spiel so viele Karten aus, wie du willst - oder gar keine. Danach ziehst du eine Karte vom Nachziehstapel, und dein Zug ist vorbei.",
        "Erst spielen oder passen, dann ziehen.",
      ],
    },
    {
      title: "Die Karten",
      table: [
        ["Karte", "Wirkung"],
        [
          "Explodierendes Kätzchen",
          "Sofort zeigen. Ohne Entschärfung bist du raus",
        ],
        [
          "Entschärfung",
          "Rettet dich - danach versteckst du das Kätzchen heimlich im Stapel",
        ],
        ["Nö!", "Stoppt jede Aktion außer Kätzchen und Entschärfung"],
        ["Angriff", "Zug beenden ohne zu ziehen, der Nächste macht 2 Züge"],
        ["Aussetzen", "Zug sofort beenden, ohne zu ziehen"],
        ["Gefallen", "Ein Mitspieler gibt dir eine Karte - er sucht sie aus"],
        ["Mischen", "Nachziehstapel mischen"],
        ["Blick in die Zukunft", "Die obersten 3 Karten heimlich ansehen"],
        ["Katzenkarten", "Allein wertlos - nur als Kombi zu gebrauchen"],
      ],
    },
    {
      title: "Kombis",
      list: [
        "Zwei gleiche Karten: Zieh einem Mitspieler eine zufällige Karte aus der Hand.",
        "Drei gleiche Karten: Nenn die Karte, die du willst. Hat er sie, bekommst du sie - sonst nichts.",
        "Die Wirkung der abgelegten Karten wird dabei ignoriert. Es geht mit jedem Paar gleichnamiger Karten, nicht nur mit Katzen.",
      ],
    },
    {
      title: "Nö!",
      body: [
        "Darf jederzeit gespielt werden, auch wenn du nicht dran bist. Die genöppte Karte ist weg und wirkt nicht - als hätte es sie nie gegeben.",
        'Auf ein Nö! darf ein weiteres Nö! folgen („Doch!"), und so weiter. Gegen ein Kätzchen und gegen eine Entschärfung hilft es nicht.',
      ],
    },
    {
      title: "Angriffe stapeln sich",
      body: [
        "Wer angegriffen wurde und selbst Angriff spielt, schiebt seine noch offenen Züge weiter - plus 2 obendrauf.",
        "Sofort zurückgeschlagen macht der Nächste 4 Züge. Erst einen Zug fertig gemacht und dann angegriffen: 3 Züge.",
        "Ein Aussetzen beendet immer nur einen Zug. Gegen einen Angriff braucht man also zwei davon.",
      ],
    },
    {
      title: "Spielende",
      body: [
        "Alle explodieren bis auf einen. Der gewinnt.",
        "Der Nachziehstapel geht nie aus: Es sind genau so viele Kätzchen darin, dass alle bis auf einen daran glauben müssen.",
      ],
    },
  ],
  note: "Original Edition, 56 Karten. Die fünf Katzenkarten sind in der Anleitung nur als Bilder abgebildet; hier heißen sie wie in der Originalausgabe.",
};
