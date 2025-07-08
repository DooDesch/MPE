# Versioned Release Structure

## Setup

Seit Version 1.0.3 werden alle Releases in ihren eigenen Versions-Unterordnern organisiert.

## Konfiguration

**File: `package.json`**

```json
{
  "build": {
    "directories": {
      "output": "release/${version}", // ✅ Versionierte Ausgabe
      "buildResources": "assets"
    }
  }
}
```

## Neue Release-Struktur

```
release/
├── 1.0.0/                                    # Alte Releases (root level)
│   ├── xAkiitoh Program Executor Setup 1.0.0.exe
│   └── ...
├── 1.0.1/
│   ├── xAkiitoh Program Executor Setup 1.0.1.exe
│   └── ...
├── 1.0.2/
│   ├── xAkiitoh Program Executor Setup 1.0.2.exe
│   └── ...
└── 1.0.3/                                    # ✅ Neue Struktur
    ├── xAkiitoh Program Executor Setup 1.0.3.exe
    ├── xAkiitoh Program Executor Setup 1.0.3.exe.blockmap
    ├── win-unpacked/                          # Entpackte App für Tests
    │   ├── xAkiitoh Program Executor.exe
    │   └── resources/
    │       ├── app.asar                       # App-Code
    │       └── Programs/                      # User-Programme
    │           ├── Example-InputTest/
    │           ├── Example-StreamStats/
    │           ├── Example-TwitchBot/
    │           └── Server/
    ├── builder-effective-config.yaml
    └── builder-debug.yml
```

## Vorteile

### ✅ Organisation

- **Übersichtlich**: Jede Version in eigenem Ordner
- **Archivierung**: Alle alten Versionen bleiben verfügbar
- **Vergleich**: Einfacher Vergleich zwischen Versionen

### ✅ Deployment

- **CI/CD**: Einfache Integration in Automation
- **Releases**: GitHub Releases können spezifische Versionen referenzieren
- **Rollback**: Schneller Wechsel zu vorherigen Versionen

### ✅ Development

- **Testing**: Verschiedene Versionen parallel testbar
- **Debug**: Bessere Nachverfolgung von Version-spezifischen Problemen
- **Distribution**: Klarere Datei-Organisation

## Build-Commands

### Neue Version erstellen

```bash
# 1. Version in package.json erhöhen
npm version patch  # 1.0.3 -> 1.0.4
npm version minor  # 1.0.3 -> 1.1.0
npm version major  # 1.0.3 -> 2.0.0

# 2. Build mit automatischer Versionierung
npm run dist:win
```

### Ergebnis

```
release/
└── 1.0.4/                                    # Neue Version
    ├── xAkiitoh Program Executor Setup 1.0.4.exe
    └── ...
```

## Release-Management

### Production Releases

- **Installer**: `release/{version}/xAkiitoh Program Executor Setup {version}.exe`
- **Entpackt**: `release/{version}/win-unpacked/` für direkte Tests
- **Metadaten**: `builder-*.y*ml` für Build-Informationen

### Development Testing

- **Schneller Test**: Direkt aus `win-unpacked/` ausführen
- **Full Test**: Installer verwenden für echte Installation
- **Vergleich**: Mehrere Versionen parallel installieren/testen

## Migration Bestehender Releases

Die alten Releases (1.0.0, 1.0.1, 1.0.2) befinden sich noch im `release/` Root.
Neue Releases ab 1.0.3 verwenden die versionierte Struktur.

Die neue Struktur ist ab sofort aktiv! 🎯✨
