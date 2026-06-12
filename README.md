# 🎬 CineBook – Kinobuchungssystem

**Systemanalyse | 2. Semester | Hochschulprojekt**

---

## 📋 Projektübersicht

CineBook ist ein vollständiges **webbasiertes Kinobuchungssystem**, das direkt im Browser ohne Server läuft. Es ermöglicht Kunden das Entdecken von Filmen, die Auswahl von Sitzplätzen und die Buchung von Tickets – inklusive echter E-Mail-Bestätigung mit QR-Code.

---

## 🚀 Schnellstart

1. Projektordner öffnen
2. `index.html` im Browser öffnen (Doppelklick oder Live Server)
3. Fertig! Keine Installation nötig.

---

## 👥 Demo-Zugangsdaten

| Rolle | Benutzername | Passwort | Bereich |
|-------|-------------|---------|---------|
| **Admin** | `admin` | `admin123` | admin/dashboard.html |
| **Clerk** | `clerk1` | `clerk123` | clerk/dashboard.html |
| **Kunde** | `user1` | `user123` | Alle Seiten |
| **Gast** | – | – | Ohne Login buchbar |

---

## 📁 Projektstruktur

```
CineBook/
│
├── index.html              → Startseite
├── movies.html             → Filmübersicht
├── movie-details.html      → Filmdetails + Trailer + Bewertungen
├── showtimes.html          → Spielzeiten mit Filtern
├── seat-selection.html     → Interaktiver Sitzplan
├── checkout.html           → Kasse + E-Mail-Pflichtfeld
├── confirmation.html       → Buchungsbestätigung + QR-Code
│
├── admin/
│   ├── dashboard.html      → Admin-Dashboard (Statistiken)
│   ├── movies.html         → Filmverwaltung (CRUD)
│   ├── showtimes.html      → Spielzeitenverwaltung (CRUD)
│   └── users.html          → Benutzerverwaltung (CRUD)
│
├── clerk/
│   ├── dashboard.html      → Clerk-Dashboard
│   └── reservations.html   → Reservierungsverwaltung
│
├── css/
│   ├── style.css           → Haupt-Stylesheet (Dark/Light Mode)
│   ├── movies.css          → Film-spezifische Styles
│   ├── admin.css           → Admin-Panel Styles
│   └── accessibility.css   → Barrierefreiheits-Styles
│
├── js/
│   ├── data.js             → Eingebettete Mock-Daten
│   ├── app.js              → Auth, Theme, Utilities
│   ├── movies.js           → Film-Logik, Filter, Bewertungen
│   ├── booking.js          → Sitzauswahl, Checkout, Bestätigung
│   ├── payment.js          → Zahlungsformular-Validierung
│   ├── emailjs.js          → E-Mail-Bestätigung via EmailJS
│   ├── admin.js            → Admin/Clerk Dashboard-Logik
│   └── accessibility.js    → Keyboard-Navigation, Focus-Trap
│
└── data/
    ├── movies.json         → 12 Filme (Mock-Daten)
    ├── showtimes.json      → 20 Vorstellungen
    └── users.json          → 8 Benutzer
```

---

## ✨ Features

### Für Kunden
- 🎬 Filmübersicht mit Suche, Genre-Filter, FSK-Filter, Sortierung
- ♿ Filter für barrierefreie Vorstellungen
- 📅 Spielzeiten-Übersicht mit Datum-, Sprach- und Format-Filter
- 💺 Interaktiver Sitzplan (Grün=frei, Rot=besetzt, Gold=VIP, Blau=Rollstuhl)
- 🎟️ VIP-Sitze werden automatisch zum VIP-Preis berechnet
- 🌟 Film-Bewertungen mit Sterne-System
- 👤 Gast-Buchung (kein Account erforderlich)
- 📧 E-Mail-Bestätigung mit QR-Code (via EmailJS)
- 🔲 QR-Code zum Vorzeigen an der Kasse

### Barrierefreiheit
- Skip-Navigation
- Vollständige ARIA-Labels
- Keyboard-Navigation im Sitzplan (Pfeiltasten)
- Focus-Trap in Modals
- Dark/Light Mode
- Schriftgröße anpassbar (A+)
- ♿ Rollstuhlplätze sichtbar und buchbar

### Admin
- 📊 Dashboard mit Statistiken
- 🎬 Filme verwalten (Hinzufügen, Bearbeiten, Löschen)
- 📅 Spielzeiten verwalten (Hinzufügen, Bearbeiten, Löschen)
- 👥 Benutzer verwalten (Rollen, Status)

### Clerk
- 🔍 Buchung nach ID nachschlagen
- 📋 Alle Reservierungen mit Filter
- ❌ Buchungen stornieren

---

## 🎭 Persona-Anforderungen

| Persona | Anforderung | Implementiert |
|---------|------------|---------------|
| **Tobias** (Gast) | Buchung ohne Account | ✅ Gast-Checkout |
| **Julia** (Rollstuhl) | Barrierefreie Plätze finden | ✅ ♿ Filter + blaue Sitze |
| **Markus** (Familie) | Mehrere Sitze, klare Preise | ✅ Beliebig viele Sitze |
| **Lena** (Film-Fan) | Film-Infos, Trailer, Bewertungen | ✅ Vollständige Detailseite |
| **Sarah** (Student) | Günstiger Preis, mobil | ✅ Studentenpreis |
| **Daniel** (Clerk) | Schnelle Reservierungsverwaltung | ✅ Clerk-Dashboard |
| **Thomas** (Admin) | Vollständige Systemkontrolle | ✅ Admin-CRUD |

---

## 🔧 Technologien

| Technologie | Verwendung |
|-------------|-----------|
| HTML5 | Struktur, semantische Elemente |
| CSS3 | Layout, Dark Mode, Responsive Design |
| Vanilla JavaScript (ES6+) | Logik, DOM-Manipulation |
| EmailJS | E-Mail-Versand ohne Backend |
| QR Server API | QR-Code-Generierung |
| localStorage | Buchungsdaten, Theme, Schriftgröße |
| sessionStorage | Buchungsflow zwischen Seiten |

---

## 📧 E-Mail-Konfiguration (EmailJS)

Die E-Mail-Bestätigung läuft über EmailJS:
- Service ID: `service_gcn7jqp`
- Template ID: `template_3i5yi2z`
- Enthält: QR-Code, Buchungsdetails, KINOPOLIS-Design

---

## 🎨 Design-Entscheidungen

- **Farbschema**: Rot (#e2000a) als Primärfarbe (Kino-typisch)
- **Dark Mode**: Standard für Kino-Atmosphäre
- **Responsive**: Mobile-first Design
- **Ticketdesign**: Inspiriert von echten Kinopolis-Tickets

---

## 📊 Mock-Daten

| Kategorie | Anzahl |
|-----------|--------|
| Filme | 12 |
| Vorstellungen | 20 (über 3 Tage) |
| Benutzer | 8 (Admin, 2 Clerks, 5 Kunden) |
| Buchungen | 6 (vordefiniert) |
| Barrierefreie Vorstellungen | 3 |

---

*CineBook – Systemanalyse Projekt 2026*