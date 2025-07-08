# 🐛 Debug-Tipps für xAkiitoh Program Executor

## Häufige Probleme und Lösungen:

### ✅ Sicherheitswarnungen behoben:

- Content Security Policy hinzugefügt
- WebSecurity für Development konfiguriert

### ✅ Klonierungsfehler behoben:

- Programme werden jetzt sauber serialisiert
- Keine "An object could not be cloned" Fehler mehr

### 🔧 Development-Tipps:

1. **Console öffnen:** `Ctrl+Shift+I` in der Electron-App
2. **Hot Reload:** Vue-Änderungen werden automatisch geladen
3. **Electron-Neustart:** Bei Electron-Änderungen `Ctrl+C` und `npm run dev`

### 📝 Logs verstehen:

```
[0] = Vite (Vue Frontend)
[1] = Electron (Desktop App)
```

### 🚫 Normale Warnungen (ignorieren):

- GPU process warnings (normal in Development)
- CJS build warnings (Vite-intern)
- Deprecation warnings (Node.js-intern)

### 🔥 Critical Errors (beheben):

- Content Security Policy ✅ BEHOBEN
- Object cloning ✅ BEHOBEN
- Module not found → npm install
- Port 5173 busy → anderen Port verwenden

### 💡 Performance-Tipps:

- Nur benötigte Programme im Programs-Ordner
- Terminal-Output wird automatisch begrenzt
- Background-Prozesse werden sauber beendet
