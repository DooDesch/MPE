# Audio WebSocket Server

Ein WebSocket-Server für Audio-Streaming und Lautstärke-Monitoring.

## Problem behoben: Encoding-Fehler

**Fehler:**

```
SyntaxError: Non-ASCII character '\xc3' in file server.py on line 10, but no encoding declared
```

**Lösung:**

- `server.py` hat jetzt UTF-8 Encoding-Deklaration
- `server_en.py` ist die englische Version ohne Umlaute

## Installation

### Dependencies installieren:

```bash
pip install -r requirements.txt
```

### Oder einzeln:

```bash
pip install websockets sounddevice numpy
```

## Programme

### `server.py` (Deutsch)

- Mit UTF-8 Encoding
- Deutsche Kommentare und Ausgaben
- **Behoben:** Encoding-Deklaration hinzugefügt

### `server_en.py` (English)

- Englische Version
- Keine Umlaute oder Sonderzeichen
- **Fallback:** Falls encoding Probleme bestehen

## Verwendung

1. **Starte Server:**

   ```bash
   python server.py
   # oder
   python server_en.py
   ```

2. **Wähle Mikrofon:** Aus der Liste auswählen

3. **WebSocket:** Läuft auf `ws://localhost:8765`

## Features

- ✅ Audio-Input von Mikrofon
- ✅ RMS-Lautstärke-Berechnung
- ✅ WebSocket-Streaming
- ✅ Geräte-Auswahl (Windows DirectSound)
- ✅ UTF-8 Encoding Support

## Encoding Fix

Die ursprüngliche Datei hatte deutsche Umlaute ohne Encoding-Deklaration:

```python
# VORHER: Fehler
# Queue für Audio-Daten  # ← 'ü' verursachte SyntaxError

# NACHHER: Behoben
# -*- coding: utf-8 -*-
# Queue für Audio-Daten  # ← Funktioniert jetzt
```

Das Problem ist jetzt behoben! 🎯✨
