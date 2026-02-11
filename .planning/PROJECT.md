# Kniff — Deutsche Spieleseite

## What This Is

Eine deutschsprachige Online-Spieleplattform für traditionelle und klassische Spiele. Spieler treten in Echtzeit gegeneinander an oder spielen gegen das Haus, mit virtuellem Guthaben als Spielwährung. Die Plattform ist einladungsbasiert — der erste Nutzer wird Admin, alle weiteren werden per Einladung hinzugefügt.

## Core Value

Spieler können in Echtzeit gemeinsam klassische deutsche Spiele spielen — wie an einem echten Stammtisch, nur online.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Einladungsbasiertes Nutzersystem mit Admin-Erstellung beim ersten Zugriff
- [ ] Virtuelles Guthaben-System (Standard: 1000, Admin kann überschreiben)
- [ ] Admin kann Guthaben hinzufügen/entfernen
- [ ] Echtzeit-Multiplayer über Spielräume (Tische erstellen & beitreten)
- [ ] Optionale Einsätze pro Raum (Ersteller entscheidet)
- [ ] Kniffel (Würfelspiel)
- [ ] Blackjack (gegen Haus oder Multiplayer)
- [ ] Texas Hold'em Poker
- [ ] Roulette (gegen Haus oder Multiplayer)
- [ ] Mehrere Themes (Nutzer wählt selbst)
- [ ] Gesamte Oberfläche auf Deutsch

### Out of Scope

- Watten — v2 (Bavarian card game, complex rules)
- Uno — v2 (deferred to later version)
- Schach — v2 (deferred, chess engines are complex)
- Schiffe Versenken — v2 (deferred to later version)
- Echtes Geld / Glücksspiel — kein reales Geld, nur virtuelle Spielwährung
- Mobile App — Web-first, mobile later
- Öffentliche Registrierung — nur Einladung durch Admin

## Context

- Zielgruppe: Kleine bis mittlere Community (20-100 Spieler), Freunde, Familie, Vereine
- Alle Spiele in Echtzeit — Spieler müssen gleichzeitig online sein
- Casino-Spiele (Blackjack, Roulette) funktionieren auch solo gegen das Haus
- Multiplayer-Spiele brauchen mindestens 2 Spieler am Tisch
- Themes: Nutzer können zwischen verschiedenen visuellen Stilen wählen (z.B. klassisch/Wirtshaus, modern/dunkel, verspielt/bunt)
- Admin-Einladungssystem: Erster Nutzer wird Admin → lädt weitere per E-Mail ein → Eingeladene erhalten Registrierungslink

## Constraints

- **Sprache**: Gesamte UI auf Deutsch — alle Labels, Meldungen, Spielbegriffe
- **Spieleranzahl**: Ausgelegt für 20-100 gleichzeitige Nutzer
- **Währung**: Nur virtuelles Guthaben, kein echtes Geld

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Einladungsbasiert statt offene Registrierung | Kontrolle über Nutzerkreis, Community-Charakter | — Pending |
| Virtuelles Guthaben statt echtes Geld | Kein Glücksspiel-Recht, Spaß im Vordergrund | — Pending |
| Kniffel + Casino als v1, Rest als v2 | Machbarer Umfang für erste Version | — Pending |
| Echtzeit statt rundenbasiert | Stammtisch-Gefühl, gemeinsames Erleben | — Pending |
| Multiple Themes mit Nutzerauswahl | Personalisierung, verschiedene Geschmäcker | — Pending |

---
*Last updated: 2026-02-11 after initialization*
