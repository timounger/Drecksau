# Online-Multiplayer

Status: **einsatzbereit.** Freunde spielen per Raumcode/Link online zusammen,
gehostet auf GitHub Pages, mit Firebase als Echtzeit-Leitung. Dieser Ordner ist
der vendor-neutrale Kern; der Firebase-Teil ist als austauschbarer Adapter
angedockt.

## Wie es funktioniert

GitHub Pages liefert nur statische Dateien aus - **keinen Server**. Für echtes
Online-Spiel brauchen die Browser eine gemeinsame Leitung: die Firebase Realtime
Database. Das Spiel bleibt auf GitHub Pages, nur der geteilte Spielstand läuft
über Firebase.

- **Host als Schiedsrichter:** Ein Spieler ist Gastgeber, hält den echten
  Spielzustand und prüft **jeden** Zug mit derselben Engine wie das Einzelspiel
  ([room.ts](room.ts)). Ein Gast schickt nur seinen Wunsch-Zug; angenommen wird
  er nur, wenn der Gast wirklich dran ist und der Zug regelkonform ist. Niemand
  kann außer der Reihe ziehen oder schummeln.
- **Kein Hellsehen:** Der Host verteilt die Handkarten der Mitspieler **nicht im
  Klartext**. Der geteilte Zustand enthält nur die Kartenanzahl; die echte Hand
  bekommt jeder nur für sich ([online-state.ts](online-state.ts)). Das ist
  dieselbe Fairness, die auch der Computergegner einhalten muss.
- **Robuste Serialisierung:** Alle Daten liegen als JSON-String in der
  Datenbank. Die Realtime Database wirft sonst `null`-Werte und leere Arrays
  weg - das würde den Spielzustand (etwa `winnerId: null`) still zerstören.

## Bausteine

| Datei                                          | Aufgabe                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| [room.ts](room.ts)                             | Reiner Host-Reducer (Lobby, Sitze, Referee) - getestet |
| [transport.ts](transport.ts)                   | Netzwerk-Schnittstelle (Presence, Zustand, Intents)    |
| [online-state.ts](online-state.ts)             | Hände verdecken/zusammenführen, Wire-Validierung       |
| [firebase-transport.ts](firebase-transport.ts) | Firebase-Adapter der Schnittstelle                     |
| [firebase-app.ts](firebase-app.ts)             | Firebase starten + anonym anmelden                     |
| [firebase-config.ts](firebase-config.ts)       | Öffentliche Projekt-Config (committet)                 |
| [room-code.ts](room-code.ts)                   | Kurze, eindeutige Raumcodes                            |

Angesteuert wird das Ganze vom Hook
[use-online-room.ts](../hooks/use-online-room.ts) und der UI
[online-game.tsx](../components/online-game.tsx) /
[online-board.tsx](../components/online-board.tsx).

## Firebase-Einrichtung (bereits erledigt)

Das Firebase-Projekt ist eingerichtet und die Web-Config ist committet - der
Online-Modus funktioniert auf GitHub Pages **ohne weiteres CI-Setup**. Zur
Dokumentation, was dafür nötig war (falls das Projekt je neu aufgesetzt wird):

1. **Projekt** auf <https://console.firebase.google.com> anlegen.
2. **Realtime Database** aktivieren (nicht Firestore), Region europe-west1.
3. **Anonyme Anmeldung** aktivieren (Authentication → Sign-in method → Anonym).
4. **Sicherheitsregeln** setzen:

   ```json
   {
     "rules": {
       "rooms": {
         "$code": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
   }
   ```

   Nur angemeldete (anonyme) Spieler dürfen Räume lesen/schreiben. Für private
   Runden mit Freunden reicht das. (Ehrlich: Wer den Raumcode kennt, könnte
   theoretisch mitschreiben - für eine öffentliche Lobby würde man das später
   verschärfen.)

5. **Web-App** registrieren und die Config nach
   [firebase-config.ts](firebase-config.ts) übernehmen.

### Config ist kein Geheimnis

Die Firebase-Web-Config gehört bei Firebase absichtlich in den Browser-Code; die
Absicherung läuft über die Regeln aus Schritt 4, nicht über Geheimhaltung.
Deshalb ist sie committet. Wer für einen lokalen Build auf ein Wegwerf-Projekt
zeigen will, kann jeden Wert per `NEXT_PUBLIC_FIREBASE_*`-Umgebungsvariable
überschreiben (siehe [firebase-config.ts](firebase-config.ts)).

## Automatische Spielsuche und „wie viele online"

Neben privatem Raum-Erstellen und Beitreten gibt es die **automatische
Spielsuche**: Wer darauf klickt, wird ohne Code mit anderen an einen Tisch
gesetzt. Auf dem Einstiegsbildschirm steht zudem, **wie viele Spieler gerade
online sind**.

Man gibt einen **Wunsch-Tisch** an (Spieleranzahl, mit/ohne Erweiterung,
mit/ohne Zusatzkarten). Gesucht wird zuerst nur ein **exakt passender** offener
Tisch; passt keiner, eröffnet man selbst einen mit seinem Wunsch. Findet sich
nach einer **kurzen Wartezeit** kein passender, wird die Bedingung gelockert und
man wird mit einem beliebigen offenen Tisch zusammengeführt - **deterministisch**
(nur der „jüngere", höher codierte Gastgeber wechselt), damit sich zwei Wartende
nie gegenseitig verpassen. Gestartet wird, sobald die Wunschzahl erreicht ist,
sonst nach längerer Wartezeit mit den Vorhandenen (ab zwei).

Bewusst **eine gemeinsame Warteliste** statt getrennter Töpfe je Wunsch: Bei dem
geringen Andrang würden getrennte Töpfe die Spieler zersplittern und stranden
lassen. Die Lockerung führt sie stattdessen nach kurzer Zeit zusammen.

Beides liegt in der geteilten Schicht und ist spielunabhängig:

| Datei                                            | Aufgabe                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| [presence.ts](../../../online/presence.ts)       | Präsenz-Markierung + Live-Zähler „wie viele online"                     |
| [matchmaking.ts](../../../online/matchmaking.ts) | Offene Räume je Wunsch führen, passenden finden/eröffnen, Lockern (TTL) |

**Ohne Regeländerung:** Präsenz und Matchmaking liegen bewusst unter `rooms/`
(z. B. `rooms/drecksau-__presence`, `rooms/drecksau-__match`). Der doppelte
Unterstrich kann nie mit einem echten vierstelligen Raumcode kollidieren, und die
bestehende `rooms/$code`-Regel deckt sie mit ab - die Sicherheitsregeln aus
Schritt 4 müssen also nicht angefasst werden.

## Host-Wechsel und aussteigende Spieler

Die Partie ist gegen Aussteiger robust:

- **Verlässt ein Spieler** (Seite geschlossen oder Verbindung weg), **übernimmt
  der Computer seinen Sitz** und die Partie läuft weiter - dieselbe KI wie im
  Einzelspiel ([use-online-room.ts](../../../online/use-online-room.ts) →
  `markSeatsAsBots`).
- **Geht der Gastgeber**, wählt der erste verbliebene Spieler sich atomar zum
  neuen Host, baut den Spielzustand aus dem letzten Snapshot plus den privaten
  Händen neu auf und führt die Partie fort (`maybeTakeOverHost` / `claimHost`).
- Schließt der **letzte** verbliebene Spieler die Seite, endet die Partie - dann
  ist niemand mehr da, der übernehmen könnte.

## Grenzen dieser Version

- **2-4 Spieler** starten die Partie, alle menschlich - KI kommt nur beim
  Übernehmen eines frei gewordenen Sitzes ins Spiel (siehe oben).
- Nach dem Spielende kann der Gastgeber mit **„Neues Spiel"** dieselbe Runde neu
  starten, statt dass alle den Raum verlassen.
