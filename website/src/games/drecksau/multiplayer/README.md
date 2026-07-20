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
gesetzt. Der erste Suchende eröffnet einen öffentlichen Raum, die nächsten
treten ihm bei; ist der Tisch voll oder nach kurzer Wartezeit genug Spieler da,
startet der Gastgeber die Partie automatisch. Auf dem Einstiegsbildschirm steht
zudem, **wie viele Spieler gerade online sind**.

Beides liegt in der geteilten Schicht und ist spielunabhängig:

| Datei                                            | Aufgabe                                                    |
| ------------------------------------------------ | ---------------------------------------------------------- |
| [presence.ts](../../../online/presence.ts)       | Präsenz-Markierung + Live-Zähler „wie viele online"        |
| [matchmaking.ts](../../../online/matchmaking.ts) | Öffentlichen Raum finden/eröffnen (ein Slot je Spiel, TTL) |

**Ohne Regeländerung:** Präsenz und Matchmaking liegen bewusst unter `rooms/`
(z. B. `rooms/drecksau-__presence`, `rooms/drecksau-__match`). Der doppelte
Unterstrich kann nie mit einem echten vierstelligen Raumcode kollidieren, und die
bestehende `rooms/$code`-Regel deckt sie mit ab - die Sicherheitsregeln aus
Schritt 4 müssen also nicht angefasst werden.

## Grenzen dieser Version

- **2-4 Spieler**, alle menschlich (KI-Sitze online sind noch nicht dabei).
- **Geht der Gastgeber, endet die Partie** - der Host hält den Zustand; es gibt
  noch keinen Host-Wechsel. Ein kurzer Reload eines Gasts ist unkritisch.
- **Kein Rematch-Knopf:** Für eine neue Runde verlässt man den Raum und erstellt
  einen neuen. (Lässt sich später als „Zurück in die Lobby" ergänzen.)
