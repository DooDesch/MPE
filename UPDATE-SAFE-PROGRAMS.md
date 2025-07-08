# Update-Sicheres Programm-Management

## Problem gelöst ✅

Das ursprüngliche Problem war, dass bei Updates der App alle User-Programme im `Programs`-Ordner überschrieben wurden. Das ist jetzt behoben!

## Wie es funktioniert

### In der Entwicklung

- Programme befinden sich im lokalen `Programs`-Ordner
- Änderungen werden direkt dort gemacht

### In der gebauten App (Production)

- **User-Programme**: Werden in `%APPDATA%\xAkiitoh Program Executor\Programs` gespeichert
- **Beispiel-Programme**: Werden als `Programs-Examples` in der App ausgeliefert
- **Erste Installation**: Beispiele werden automatisch in den User-Ordner kopiert
- **Updates**: User-Programme bleiben erhalten, nur die App wird aktualisiert

## Ordner-Struktur (Production)

```
Installation:
C:\Users\[User]\AppData\Local\Programs\xAkiitoh Program Executor\
└── resources\
    └── Programs-Examples\          ← Beispielprogramme (schreibgeschützt)
        ├── Example-InputTest\
        ├── Example-StreamStats\
        ├── Example-TwitchBot\
        └── Server\

User-Daten:
C:\Users\[User]\AppData\Roaming\xAkiitoh Program Executor\
└── Programs\                      ← User-Programme (persistent)
    ├── Example-InputTest\          ← Kopiert beim ersten Start
    ├── Example-StreamStats\
    ├── Example-TwitchBot\
    ├── Server\
    └── [Weitere User-Programme...]  ← Bleiben bei Updates erhalten!
```

## Features

### ✅ Update-Sicherheit

- User-Programme werden **niemals** überschrieben
- Neue App-Versionen können problemlos installiert werden
- Alle eigenen Programme und Änderungen bleiben erhalten

### ✅ Beispiel-Management

- Beispiele werden nur beim **ersten Start** kopiert
- Bestehende Programme werden nicht überschrieben
- Beispiele können über die App wiederhergestellt werden

### ✅ IPC-Handler

```javascript
// Programme-Ordner öffnen
ipcMain.handle("open-programs-folder", () => {
  shell.openPath(programManager.programsPath);
});

// Beispiele wiederherstellen
ipcMain.handle("restore-examples", () => {
  return programManager.restoreExamples();
});
```

## Code-Implementierung

### Initialisierung

```javascript
initializeProgramsFolder() {
  if (app.isPackaged) {
    // Production: AppData für User-Programme
    const userDataPath = app.getPath('userData')
    this.programsPath = path.join(userDataPath, 'Programs')
    this.examplesPath = path.join(process.resourcesPath, 'Programs-Examples')

    if (!fs.existsSync(this.programsPath)) {
      fs.mkdirSync(this.programsPath, { recursive: true })
      this.copyExamplesToUserFolder() // Nur beim ersten Mal
    }
  } else {
    // Development: Lokaler Ordner
    this.programsPath = path.join(__dirname, '../Programs')
  }
}
```

### Beispiele kopieren (sicher)

```javascript
copyExamplesToUserFolder() {
  const examples = fs.readdirSync(this.examplesPath, { withFileTypes: true })

  for (const example of examples) {
    const destPath = path.join(this.programsPath, example.name)

    // Nur kopieren wenn Ziel nicht existiert (User-Programme schützen!)
    if (!fs.existsSync(destPath)) {
      this.copyDirectoryRecursive(sourcePath, destPath)
    }
  }
}
```

### Build-Konfiguration

```json
{
  "extraResources": [
    {
      "from": "Programs",
      "to": "Programs-Examples",
      "filter": ["**/*"]
    }
  ]
}
```

## Testen

1. **Erstinstallation**: Beispiele werden automatisch kopiert
2. **Programme ändern**: Eigene Programme erstellen/bearbeiten
3. **Update installieren**: Neue Version installieren
4. **Prüfen**: Alle eigenen Programme sind noch da! ✅

## Vorteile

- 🛡️ **100% Update-sicher**: User-Programme gehen nie verloren
- 🔄 **Einfache Updates**: Einfach neue Version installieren
- 📁 **Saubere Trennung**: Beispiele vs. User-Programme
- 🎯 **Benutzerfreundlich**: Automatisches Setup beim ersten Start
- 🔧 **Wartbar**: Beispiele können wiederhergestellt werden

Das System ist jetzt produktionsreif und update-sicher! 🎉
