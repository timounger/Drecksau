# The Mind

Das Kartenspiel von Wolfgang Warsch. Ihr legt gemeinsam die Zahlen 1 bis 100 in
**aufsteigender Reihenfolge** ab - und dürft dabei kein Wort miteinander reden.

(Zur Einordnung: 2018 zum **Spiel des Jahres nominiert**, gewonnen hat Azul.)

**Es gibt keine Reihenfolge und keine Züge.** Jede:r legt, wann er glaubt, die
niedrigste Karte zu haben. Das Einzige, worauf man sich stützen kann, ist, wie
lange die anderen still sind.

## Spielen - nur online

The Mind lebt davon, herauszuspüren, wie lange die anderen zögern. Dafür braucht
es echte Mitspieler, deshalb gibt es **kein Spiel gegen den Computer**:

| Seite                 | Was dort passiert                     |
| --------------------- | ------------------------------------- |
| `/the-mind`           | Regeln und der Weg ins Spiel          |
| `/the-mind/online`    | automatische Suche oder privater Raum |
| `/the-mind/statistik` | gespielte Partien und Erfolge         |

Kooperativ heißt: Es gibt keine Rangliste und nichts zu vergleichen. Gewonnen
oder verloren wird gemeinsam, und die Statistik zählt es genauso - gezählt wird
im eigenen Browser, aus dem Online-Tisch heraus
([hooks/use-mind-stats.ts](hooks/use-mind-stats.ts)).

## Warum es keine Computerpartner gibt

Was gelegt wird, steht immer fest - die niedrigste Karte. Ein Computerpartner
hätte also **gar keine Wahl**; sein ganzer Beitrag wäre das _Wann_, und das Wann
ist das Spiel. Er könnte es nur auf zwei Arten bestimmen: Er kennt alle Hände -
dann ist es kein Spiel mehr - oder er wartet eine ausgedachte Zahl von Sekunden,
was auf dasselbe hinausläuft. Beides nimmt den Menschen am Tisch genau das weg,
wofür sie gekommen sind.

## Was auf dem Bildschirm steht - und was nicht

Nur zwei Dinge: was oben auf dem Stapel liegt, und was du selbst hältst. Von
den anderen sieht man die **Anzahl** ihrer Karten (die liegt am echten Tisch
auch offen) und sonst nichts. Es gibt keine Anzeige, wer als Nächstes dran
wäre, keinen Fortschrittsbalken, keinen Hinweis.

Das Einzige, was die anderen von sich geben können, ist die **erhobene Hand**
für einen Wurfstern - das ist im Original das einzige erlaubte Signal.

Kurz nach einem Zug kann eine eigene Karte als **… (verdeckt)** dastehen. Das
ist kein Fehler: Der Host schickt den Tisch mit lauter Platzhaltern und jedem
Sitz seine echten Karten getrennt daneben, und beide Wege kommen unabhängig an.
Solange sie nicht zusammenpassen, zeigt der Bildschirm lieber nichts als eine
Zahl, die er nicht kennt
([engine/state.ts](engine/state.ts), `UNKNOWN_CARD`). Legen kann man trotzdem -
welche Karte herunterkommt, entscheidet ohnehin der Schiedsrichter.

## Aufbau des Spielmoduls

```text
games/the-mind/
  engine/       Deck, Regeln, das Timing der Partner - ohne DOM
  components/   Tisch, Level- und Endtafel, Einstellungen, Online-Bildschirm
  hooks/        das Spiel mit Computerpartnern (Timer, Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

## Ein Spiel ohne Züge in einer Schicht mit Zügen

Die geteilte Online-Schicht fragt jedes Spiel, wer am Zug ist. Hier lautet die
ehrliche Antwort **niemand**, und das ist auch die einzig sichere: Jede andere
Antwort wäre eine Durchsage, wessen Karte die niedrigste ist - also genau die
eine Sache, um die das ganze Spiel gebaut ist.

Das geht, weil die Schicht den Zug gar nicht erzwingt: Sie reicht jeden
eingehenden Zug an den Schiedsrichter weiter und benutzt die Zugauskunft nur,
um jemanden anzutreiben oder für einen verlassenen Platz zu spielen.

**Das hat eine Folge, die man kennen muss:** Verlässt online jemand mitten im
Level das Spiel, springt für ihn _kein_ Computer ein - es gibt keinen Zug, an
dem er einspringen könnte, und eine Maschine mit perfektem Timing wäre ohnehin
das Gegenteil dieses Spiels. Seine Karten bleiben liegen. Der Ausweg ist der
**Wurfstern** (der räumt die niedrigste Karte aus _jeder_ Hand, auch aus seiner)
oder eine neue Runde aus der Lobby.

Verdeckt sind schlicht **die Karten**: Jede fremde Hand reist als Reihe von
Nullen der richtigen Länge, sodass die Anzahl sichtbar bleibt und sonst nichts
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

## Regeln im Detail

Die Spezifikation samt der Werte, die aus dem Gedächtnis stammen, steht in
[docs/games/the-mind/game-rules.md](../../../../docs/games/the-mind/game-rules.md).

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
