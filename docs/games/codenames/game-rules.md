# Codenames - Spielregeln

Umsetzung des Partyspiels von Vlaada Chvátil (Czech Games Edition, 2015). Die
Regeln stammen aus der offiziellen englischen Anleitung
([codenames-rule.pdf](https://cdn.1j1ju.com/medias/89/5e/99-codenames-rule.pdf),
Stand Juli 2015). Die Umsetzung ist deutsch.

**25 Wortkarten, 2 Teams, ab 4 Spielern.**

## Ziel

Jedes Team hat Agenten unter den 25 Wörtern. Wer zuerst alle eigenen Agenten
kontaktiert hat, gewinnt. Wer den **Attentäter** erwischt, verliert sofort.

## Aufbau

- 25 Wörter liegen in einem **5x5-Raster**.
- Ein **Schlüssel** sagt, welches Wort wem gehört. Nur die beiden
  Geheimdienstchefs sehen ihn.
- Verteilung: **9** Wörter für das beginnende Team, **8** für das andere,
  **7 Unbeteiligte**, **1 Attentäter**. (Zusammen 25.)
- Jedes Team hat einen **Geheimdienstchef** und mindestens einen **Ermittler**.
- Das beginnende Team gibt den ersten Hinweis.

## Ein Zug

### Hinweis geben

Der Geheimdienstchef sagt **ein Wort und eine Zahl**. Die Zahl sagt, wie viele
Wörter auf dem Tisch zu diesem Hinweis passen.

Verbindliche Regeln der Anleitung:

- Der Hinweis muss sich auf die **Bedeutung** der Wörter beziehen, nicht auf
  Buchstaben oder die Position im Raster.
- Der Hinweis darf **kein Wort sein, das noch offen auf dem Tisch liegt** - und
  auch keine Form davon und kein Teil eines zusammengesetzten Wortes. Ist ein
  Wort erst einmal abgedeckt, darf sein Hinweis wieder benutzt werden.
- Die Zahl selbst darf kein Hinweis sein.
- Nur **ein** Wort, keine Zusatzbemerkungen.

### Raten

Die Ermittler zeigen auf ein Wort. Der Geheimdienstchef deckt es auf:

| Getroffen                   | Was passiert                                |
| --------------------------- | ------------------------------------------- |
| **eigener Agent**           | richtig - ihr dürft weiterraten             |
| **Unbeteiligter**           | Zug vorbei                                  |
| **Agent des anderen Teams** | Zug vorbei - und das andere Team ist weiter |
| **Attentäter**              | Das ratende Team **verliert sofort**        |

### Wie oft geraten werden darf

- **Mindestens einmal** muss geraten werden.
- Höchstens **Zahl + 1** Mal. Der eine Extra-Tipp ist für ein Wort aus einer
  früheren Runde gedacht.
- Aufhören ist jederzeit erlaubt - nach dem ersten Tipp.

### Zahl 0 und „unbegrenzt"

- **0** heißt: „Keines unserer Wörter passt dazu." Die übliche Obergrenze fällt
  weg, es darf beliebig oft geraten werden - mindestens aber einmal.
- **unbegrenzt** heißt dasselbe ohne Aussage über die Zahl.

## Spielende

Das Spiel endet, wenn ein Team alle eigenen Wörter abgedeckt hat - auch dann,
wenn das andere Team das letzte Wort für es aufdeckt. Oder sofort, wenn jemand
den Attentäter erwischt; dann verliert das ratende Team.

## Was hier anders ist als am Tisch

### 1. Die Wörterliste

Die 400 Wörter der Originalausgabe sind urheberrechtlich geschützt und liegen
ohnehin nur auf Englisch vor. Umgesetzt ist deshalb eine **eigene deutsche
Liste** aus rund 270 Substantiven. Sie steht an einer Stelle
(`engine/words.ts`) und ist beliebig erweiterbar - solange **kein Wort so heißt
wie eine Kategorie**. Ein solches Wort hätte genau einen möglichen Hinweis, und
der wäre nach der Regel oben verboten; der Computer-Chef stünde ohne Hinweis da.
Deshalb steht in der Liste FLAMME und kein FEUER.

### 2. Der Computer-Geheimdienstchef gibt Oberbegriffe

Ein Hinweis in Codenames ist ein Einfall - genau das, was eine Maschine ohne
Sprachverständnis nicht hat. Damit das Spiel **allein gegen den Computer**
trotzdem funktioniert, trägt jedes Wort der Liste ein bis drei **Kategorien**
(Tier, Wasser, Werkzeug, Märchen, …). Der Computer-Geheimdienstchef sucht die
Kategorie, die möglichst viele eigene und möglichst wenige fremde Wörter trifft,
und nennt sie als Hinweis: _„Tier: 3"_.

Das ist ein engerer Hinweisraum als am echten Tisch, aber dieselbe Aufgabe: Auf
dem Raster liegen fünf Tiere, drei davon sind deine - und eines könnte der
Attentäter sein.

**Online spielen Menschen gegeneinander und tippen ihre Hinweise frei ein.** Da
gibt es keine Kategorien.

### 3. Wer allein spielt, ist immer Ermittler

Gegen den Computer übernimmt der Mensch die Rolle, die sich ohne
Sprachverständnis der Gegenseite spielen lässt: **Ermittler**. Beide
Geheimdienstchefs und das gegnerische Ermittlerteam sind Computer.

Der Computer-Ermittler weiß dabei **nicht mehr als ein Mensch**: Er kennt den
Schlüssel nicht. Er weiß nur, welche Kategorie sein Chef gemeint hat, und rät
unter den Wörtern dieser Kategorie - genau wie ein Mensch, der „Tier: 3" hört
und fünf Tiere sieht.

### 4. Ungültige Hinweise werden nicht bestraft

Die Anleitung kennt eine Strafe für ungültige Hinweise („die andere Seite deckt
ein eigenes Wort auf"), stellt aber auch klar: „But if no one notices that a clue
is invalid, it counts as valid." Umgesetzt ist deshalb nur das, was sich
maschinell prüfen lässt und was die Anleitung als **feste** Regel führt: Ein
Hinweis, der ein noch offenes Wort auf dem Tisch ist, wird abgelehnt. Alles
Weitere - Wortformen, zusammengesetzte Wörter, Reime - bleibt beim Tisch, so wie
es die Anleitung selbst will.

### 5. Die Rollen online

Die Anleitung lässt die Teams sich selbst einteilen. Online wird zugeteilt, und
zwar vorhersagbar: **abwechselnd Rot und Blau in Beitrittsreihenfolge**, und der
jeweils Erste eines Teams ist sein Geheimdienstchef. Es braucht also mindestens
vier Spieler, wie die Anleitung es auch verlangt.

### 6. Die Varianten für zwei und drei Spieler

Die kooperative Variante (ein Team gegen einen simulierten Gegner, mit
Punktwertung) und die Drei-Spieler-Variante (ein Ermittler für beide Seiten) sind
**nicht** umgesetzt. Das Spiel gegen den Computer deckt den Fall „allein" bereits
ab, und zwar mit einem echten Gegner statt einem simulierten.
