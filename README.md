# Multi Program Executor

Ein moderner Programm-Launcher für Node.js, Python und HTML-Anwendungen mit integrierter Terminal-Ausgabe und HTTP-Server.

## Features

- **Multi-Language Support** - JavaScript/Node.js, Python, HTML/CSS/JS
- **Integrated Terminal** - Live Ausgabe und interaktive Eingaben
- **HTTP Server** - Automatischer Server für HTML-Projekte
- **Modern UI** - Vue 3 + TypeScript Interface
- **Auto-Discovery** - Erkennt Programme automatisch
- **Update System** - Automatische Updates verfügbar

## Installation

1. Lade die neueste Version aus dem Release-Bereich herunter
2. Führe das Setup aus: `xAkiitoh Program Executor Setup.exe`
3. Starte die Anwendung über das Desktop-Icon

## Programme hinzufügen

### JavaScript/Node.js

```
Programs/MeinBot/
├── package.json
├── index.js
└── node_modules/
```

### Python

```
Programs/StreamStats/
├── main.py (oder server.py, app.py)
├── requirements.txt
└── data/
```

### HTML/Web

```
Programs/Dashboard/
├── index.html
├── style.css
├── script.js
└── server.json (optional, für Port-Konfiguration)
```

## Entwicklung

```bash
# Dependencies installieren
npm install

# Development starten
npm run dev

# Build für Production
npm run build

# Windows Installer erstellen
npm run dist:win
```

## Technologie

- **Frontend**: Vue 3, TypeScript, Vite
- **Backend**: Electron, Node.js
- **UI**: Headless UI, Hero Icons
- **Build**: electron-builder

## Beispielprogramme

Das Projekt enthält fertige Beispiele:

- **Dashboard** - HTML-basiertes Stream-Dashboard
- **TwitchBot** - JavaScript Bot-Simulation
- **StreamStats** - Python Statistik-Analyzer
- **InputTest** - Terminal-Eingabe Demo

## Lizenz

Proprietäre Software - siehe [LICENSE.txt](LICENSE.txt)
