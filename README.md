# xAkiitoh Program Executor

Ein moderner Programm-Launcher für xAkiitoh's Stream Tools, entwickelt mit Electron, Vue 3 und TypeScript.

## ✨ Features

- 🚀 **Moderne Benutzeroberfläche** - Schönes, dunkles Design mit Gradient-Effekten
- 📁 **Automatische Programm-Erkennung** - Scannt automatisch den Programs-Ordner
- 🖥️ **Multi-Terminal Support** - Jedes Programm läuft in einem eigenen Terminal
- ⌨️ **Interaktive Eingabe** - Unterstützt Benutzereingaben in laufende Programme
- 🔄 **Echtzeit-Status** - Live-Updates für Programm-Status und Ausgaben
- 🎮 **Streamer-Optimiert** - Perfekt für Live-Streaming und Content-Creation

## 🛠️ Unterstützte Programmtypen

### Node.js Programme

- Automatische Erkennung durch `package.json`
- Unterstützt `npm start`, `npm run dev` und direkte Ausführung
- Beispiel: Twitch-Bots, Web-Server, Chat-Tools

### Python Programme

- Automatische Erkennung von `main.py`, `server.py`, `app.py`, `run.py`
- Direkte Python-Ausführung
- Beispiel: Stream-Analytics, Chat-Moderation, APIs

### HTML/Static Websites

- Automatische Erkennung von `index.html`
- Integrierter HTTP-Server für lokales Hosting
- Öffnet automatisch im Browser
- Beispiel: Web-Apps, Dashboards, Dokumentation

## 🚀 Installation

1. **Dependencies installieren:**

   ```bash
   npm install
   ```

2. **Entwicklung starten:**

   ```bash
   npm run dev
   ```

3. **Für Windows kompilieren:**
   ```bash
   npm run dist:win
   ```

## 📁 Projekt-Struktur

```
xAkiitohsMultipleProgramExecutor/
├── Programs/                    # Deine Stream-Programme
│   ├── Example-TwitchBot/      # Beispiel Node.js Programm
│   ├── Example-StreamStats/    # Beispiel Python Programm
│   └── Example-InputTest/      # Beispiel interaktives Programm
├── src/                        # Vue.js Frontend
│   ├── components/            # Vue Komponenten
│   ├── types/                 # TypeScript Definitionen
│   └── style.css             # Globale Styles
├── electron/                   # Electron Backend
│   ├── main.ts               # Haupt-Prozess
│   └── preload.ts            # Preload-Skript
└── dist/                      # Kompilierte Anwendung
```

## 🎯 Verwendung

### Programme hinzufügen

1. **Node.js Programm:**

   ```
   Programs/MeinBot/
   ├── package.json          # Mit start/dev Script
   ├── index.js             # Hauptdatei
   └── node_modules/        # Dependencies
   ```

2. **Python Programm:**

   ```
   Programs/MeinScript/
   ├── main.py              # Hauptdatei
   ├── requirements.txt     # Optional
   └── config/              # Weitere Dateien
   ```

3. **HTML/Static Website:**
   ```
   Programs/MeinWebsite/
   ├── index.html           # Startseite
   ├── style.css            # Stylesheets
   ├── script.js            # JavaScript
   ├── server.json          # Optional: Port-Konfiguration
   └── assets/              # Bilder, Fonts, etc.
   ```

#### Port-Konfiguration für HTML-Projekte

Es gibt mehrere Möglichkeiten, einen festen Port zu definieren:

1. **server.json** (empfohlen):

   ```json
   {
     "port": 8080,
     "description": "My web app on fixed port"
   }
   ```

2. **package.json**:

   ```json
   {
     "name": "my-web-app",
     "server": {
       "port": 8080
     }
   }
   ```

3. **Automatisch**: Ohne Konfiguration wird ein konsistenter Port basierend auf dem Projektnamen generiert (8000-8999)

### Funktionen

- **Programm starten:** Klicke auf "Starten" bei verfügbaren Programmen
- **Terminal auswählen:** Klicke auf laufende Programme in der Seitenleiste
- **Eingaben senden:** Nutze das Eingabefeld im Terminal-Bereich
- **Programm stoppen:** Klicke auf den Stop-Button bei laufenden Programmen
- **Ordner öffnen:** Nutze "Programme Ordner" um neue Programme hinzuzufügen

## 🎨 Design-Features

- **Gradient-Farbschema:** Lila/Blau Gradients für moderne Optik
- **Glasmorphism-Effekte:** Transparente Bereiche mit Blur-Effekten
- **Animationen:** Smooth Übergänge und Hover-Effekte
- **Responsive Layout:** Optimiert für verschiedene Bildschirmgrößen
- **Dunkles Theme:** Augenfreundlich für lange Streaming-Sessions

## ⚡ Performance

- **Schnelle Startup-Zeit:** Optimierte Electron-Konfiguration
- **Memory-Effizient:** Intelligente Prozess-Verwaltung
- **Real-time Updates:** WebSocket-ähnliche IPC-Kommunikation

## 🔧 Entwicklung

### Technologie-Stack

- **Electron 27** - Desktop-Framework
- **Vue 3** - Frontend-Framework
- **TypeScript** - Typisierte Entwicklung
- **Vite** - Build-Tool und Dev-Server

### Scripts

```bash
npm run dev          # Entwicklung starten
npm run build        # Für Produktion kompilieren
npm run dist         # Installer erstellen
npm run dist:win     # Windows-spezifischer Build
```

## � Troubleshooting

### Release-Build Probleme

Wenn der Release-Build (`npm run dist:win`) nach längerer Zeit nicht mehr funktioniert, können folgende Ursachen vorliegen:

#### 1. Veraltete Dependencies

```bash
# Dependencies aktualisieren
npm update

# Oder komplett neu installieren
rm -rf node_modules package-lock.json
npm install
```

#### 2. Electron-Builder Cache leeren

```bash
# Windows
rmdir /s "%APPDATA%\electron-builder"
# Oder in PowerShell
Remove-Item -Recurse -Force "$env:APPDATA\electron-builder"
```

#### 3. Node.js Version prüfen

```bash
# Aktuelle Node.js Version anzeigen
node --version

# Empfohlen: Node.js 18.x oder 20.x LTS
```

#### 4. Build-Dateien bereinigen

```bash
# Alte Build-Dateien löschen
rm -rf dist release
npm run build:vue
npm run build:electron
npm run dist:win
```

#### 5. Häufige Fehlermeldungen

**"Cannot resolve dependency":**

- `npm install --legacy-peer-deps`
- Oder Dependencies in `package.json` aktualisieren

**"Application entry file does not exist":**

- `npm run build:electron` vor dem Dist-Build ausführen
- Prüfen ob `electron/main.js` existiert

**"NSIS error" oder "Code signing failed":**

- Windows Defender/Antivirus temporär deaktivieren
- Als Administrator ausführen

#### 6. Komplette Neuinstallation

```bash
# Falls alles andere fehlschlägt
rm -rf node_modules package-lock.json dist release
npm cache clean --force
npm install
npm run dist:win
```

### Development Probleme

#### Port bereits belegt

```bash
# Andere Prozesse auf Port 5176 beenden
netstat -ano | findstr :5176
taskkill /PID <PID> /F
```

#### Electron startet nicht

```bash
# Electron neu installieren
npm uninstall electron
npm install electron --save-dev
```

## �📝 Lizenz

MIT License - Entwickelt für xAkiitoh's Stream

## 🤝 Support

Bei Fragen oder Problemen, kontaktiere den Entwickler oder erstelle ein Issue im Repository.

---

**Perfekt für Streamer, die ihre Tools professionell verwalten möchten! 🎮✨**
