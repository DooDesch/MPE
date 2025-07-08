# Security Configuration

## Electron Security Settings

### Development Mode

In development mode, certain security features are relaxed to enable proper functionality with Vite's development server:

- `webSecurity: false` - Allows loading content from `localhost:5176`
- `allowRunningInsecureContent: true` - Permits loading scripts/styles from development server
- `ELECTRON_DISABLE_SECURITY_WARNINGS: true` - Suppresses security warnings in development

### Production Mode

In production mode, full security is enabled:

- `webSecurity: true` - Full web security enabled
- `allowRunningInsecureContent: false` - No insecure content allowed
- `contextIsolation: true` - Context isolation between main and renderer
- `nodeIntegration: false` - Node.js APIs not available in renderer

## Content Security Policy (CSP)

The `index.html` includes a Content Security Policy that:

- Allows scripts and styles from self and inline (required for Vite)
- Restricts image sources to self and data URIs
- Restricts font sources to self only
- Blocks all other external resources

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
/>
```

## IPC Security

All communication between main and renderer processes uses secure IPC:

- `contextIsolation: true` ensures isolated contexts
- `preload.js` exposes only necessary APIs via `contextBridge`
- No direct Node.js access in renderer process

## File System Access

The application only accesses:

- The `Programs` folder for scanning and running programs
- Standard Electron directories for app data
- No arbitrary file system access from renderer

## Process Isolation

Each spawned program runs in its own child process with:

- Limited environment variables
- Proper process cleanup on termination
- Isolated stdout/stderr handling

## Security Warnings

The security warnings you may see in development are:

1. "Disabled webSecurity" - Normal for development with Vite
2. "allowRunningInsecureContent" - Required for development server

These warnings will NOT appear in the packaged production app.
