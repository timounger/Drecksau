# Camel Up - Spielregeln

Umsetzung des Brettspiels von Steffen Bogen (Pegasus Spiele, **Spiel des Jahres
2014**). Gemeint ist die **Originalausgabe**, nicht Camel Up 2.0 von 2018 - dort
gibt es zwei verrückte Kamele, die rückwärts laufen, und die fehlen hier
bewusst.

> **Achtung, wichtig:** Zu diesem Spiel lag **keine Anleitung** vor. Die Regeln
> unten sind aus Spielkenntnis rekonstruiert. Der Ablauf ist sicher, einzelne
> **Zahlen** sind es nicht - siehe [Unsichere Werte](#unsichere-werte). Wer die
> Schachtel hat, sollte diese Handvoll Zahlen gegenprüfen; sie stehen alle an
> einer Stelle im Code und sind in einer Minute geändert.

2 bis 8 Spieler. Wer am Ende das meiste **Geld** hat, gewinnt - nicht wer auf
das schnellste Kamel gesetzt hat.

## Aufbau

- **5 Kamele**: Blau, Grün, Gelb, Orange, Weiß.
- **Strecke**: 16 Felder. Wer darüber hinauskommt, beendet das Rennen.
- **Pyramide**: 5 Würfel, einer je Kamelfarbe, mit den Augen 1, 2 und 3.
- Jedes Kamel wird einmal ausgewürfelt und auf das gezeigte Feld gestellt. Wer
  auf ein besetztes Feld kommt, steht **oben drauf**.
- Jede:r bekommt **3 Münzen**, **je 1 Farbkarte pro Kamel** und **1
  Wüstenplättchen**.

## Der Stapel - die eine Regel, die alles trägt

Kamele stehen aufeinander. Daraus folgt alles Weitere:

- Ein Kamel, das zieht, **nimmt alle Kamele auf seinem Rücken mit**.
- Wer auf einem besetzten Feld landet, kommt **oben drauf**.
- **Oben heißt vorn.** Von zwei Kamelen auf einem Feld liegt das obere vorn -
  es wird getragen.
- Das unterste Kamel eines Haufens ist Letzter, egal wie weit vorn der Haufen
  steht.

## Ablauf

Reihum führt jede:r **genau 1** der vier Aktionen aus.

### 1. Pyramide würfeln

Ein Würfel kommt heraus, das zugehörige Kamel zieht 1 bis 3 Felder - und du
bekommst **1 Münze**. Das ist die einzige Aktion, die Geld bringt, und
gleichzeitig die einzige, die das Rennen bewegt.

Sind alle 5 Würfel heraus, ist die **Etappe** zu Ende.

### 2. Etappenwette

Nimm die oberste verbliebene Karte eines Kamels. Je Kamel liegen drei Karten:
**5, 3, 2** - wer zuerst auf ein Kamel setzt, bekommt die 5.

Am Ende der Etappe:

| Das Kamel ist … | Auszahlung         |
| --------------- | ------------------ |
| Erster          | der Wert der Karte |
| Zweiter         | 1 Münze            |
| sonst           | -1 Münze           |

### 3. Gesamtwette

Lege **verdeckt** eine deiner Farbkarten auf den Stapel „Sieger" oder
„Verlierer". Die Karte ist danach weg.

Abgerechnet wird erst am Ende des Rennens, und zwar **in der Reihenfolge, in der
gelegt wurde**: **8, 5, 3, 2, 1** - alle weiteren richtigen Tipps 1. Jede
falsche Karte kostet **1 Münze**, egal wann sie gelegt wurde.

### 4. Wüstenplättchen

Lege dein Plättchen auf ein **leeres** Feld - nicht auf Feld 1 und nicht direkt
neben ein fremdes Plättchen. Es hat zwei Seiten:

- **Oase (+1)**: Ein Kamel, das hier landet, zieht 1 Feld weiter und kommt
  **oben** auf den Stapel.
- **Fata Morgana (-1)**: Es geht 1 Feld zurück und schiebt sich **unten** unter
  den Stapel.

Beides bringt dir **1 Münze**, jedes Mal.

### Etappenende

Ist der fünfte Würfel heraus: Etappenwetten abrechnen, Würfel zurück in die
Pyramide, Etappenkarten und Wüstenplättchen zurück. Der Streckenstand bleibt,
wie er ist - eine Etappe ist ein Abschnitt desselben Rennens.

### Rennende

Sobald ein Kamel über Feld 16 hinauskommt, endet alles sofort. Die laufende
Etappe wird noch abgerechnet, dann die Gesamtwetten. Das meiste Geld gewinnt.

## Unsichere Werte

Diese Zahlen stammen aus dem Gedächtnis und stehen alle in
[engine/state.ts](../../../website/src/games/camel-up/engine/state.ts):

1. **Etappenkarten 5 / 3 / 2 je Kamel.** Manche Quellen nennen vier Karten
   (5/3/2/2). Hier sind es drei.
2. **Gesamtwetten 8 / 5 / 3 / 2 / 1.** Die Reihenfolge ist sicher, die genauen
   Beträge sind es weniger.
3. **Startgeld 3 Münzen.**
4. **Strafe für falsche Wetten: je 1 Münze** - bei Etappen- und Gesamtwetten
   gleich.
5. **Kein Geld unter null.** Wer nicht zahlen kann, zahlt was da ist.

## Bewusste Abweichungen

- **Der Pyramidenchip** wird nicht als Plättchen ausgeteilt, sondern die Münze
  gibt es sofort beim Würfeln. Rechnerisch dasselbe, ein Handgriff weniger.
- **Die Strecke ist eine Gerade**, kein Rundkurs. Am Ablauf ändert das nichts -
  die Strecke ist auch im Original eine Linie von Feld 1 bis Feld 16.

## Umsetzung

- Regeln: [engine/moves.ts](../../../website/src/games/camel-up/engine/moves.ts)
  (`applyMove` ist der einzige Schiedsrichter)
- Der Stapel: [engine/track.ts](../../../website/src/games/camel-up/engine/track.ts)
- Wahrscheinlichkeiten: [engine/odds.ts](../../../website/src/games/camel-up/engine/odds.ts)
- Computergegner: [engine/ai.ts](../../../website/src/games/camel-up/engine/ai.ts)
- Online: [multiplayer/adapter.ts](../../../website/src/games/camel-up/multiplayer/adapter.ts)

Die Würfel laufen aus einem Generator, dessen Stand **im Spielzustand** liegt.
Derselbe Zug aus demselben Zustand liefert also immer dasselbe Ergebnis - die
Grundlage dafür, dass online ein Host für alle würfeln kann.
