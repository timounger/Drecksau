# The Mind

Das Kartenspiel von Wolfgang Warsch. Ihr legt gemeinsam die Zahlen 1 bis 100 in
**aufsteigender Reihenfolge** ab - und dürft dabei kein Wort miteinander reden.

(Zur Einordnung: 2018 zum **Spiel des Jahres nominiert**, gewonnen hat Azul.)

**Es gibt keine Reihenfolge und keine Züge.** Jede:r legt, wann er glaubt, die
niedrigste Karte zu haben. Das Einzige, worauf man sich stützen kann, ist, wie
lange die anderen still sind.

## Spielen

`/the-mind` teilt sofort ein Spiel mit Computerpartnern aus:

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/the-mind`               | Spiel mit Computerpartnern            |
| `/the-mind/einstellungen` | Spielerzahl (2 bis 4)                 |
| `/the-mind/online`        | automatische Suche oder privater Raum |
| `/the-mind/statistik`     | gespielte Partien und Erfolge         |

Kooperativ heißt: Es gibt keine Rangliste und nichts zu vergleichen. Gewonnen
oder verloren wird gemeinsam, und die Statistik zählt es genauso.

## Die Computerpartner sind eine Uhr, kein Gegner

Was gelegt wird, steht immer fest - die niedrigste Karte. Ein Computerpartner
hat also **gar keine Wahl**; sein ganzer Beitrag ist das _Wann_, und das Wann
ist das Spiel.

Er wartet im Verhältnis zum **Abstand** zwischen seiner niedrigsten Karte und
der obersten auf dem Stapel - rund eine Sekunde je zehn Punkte, also genau die
Faustregel, die das Spiel einem selbst beibringt. Wer die 12 über einer 9 hält,
legt fast sofort; wer die 80 hält, sitzt auf den Händen.

Und die Uhr läuft **nicht** einmal ab, sondern wird bei jeder Änderung neu
gestellt ([hooks/use-the-mind-game.ts](hooks/use-the-mind-game.ts)). Das ist
keine Abkürzung, sondern richtig: Kommt die 40 herunter, muss der mit der 44
nicht mehr lange warten. Genau das macht ein Mensch am Tisch auch.

## Was auf dem Bildschirm steht - und was nicht

Nur zwei Dinge: was oben auf dem Stapel liegt, und was du selbst hältst. Von
den anderen sieht man die **Anzahl** ihrer Karten (die liegt am echten Tisch
auch offen) und sonst nichts. Es gibt keine Anzeige, wer als Nächstes dran
wäre, keinen Fortschrittsbalken, keinen Hinweis.

Das Einzige, was die anderen von sich geben können, ist die **erhobene Hand**
für einen Wurfstern - das ist im Original das einzige erlaubte Signal.

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
