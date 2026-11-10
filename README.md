# HERE Desktop

HERE for Mac + Windows — with HERE Studio (live stream studio).

HERE Desktop puts the HERE platform (https://joincomehere.com) in its own Mac and Windows app window, instead of a browser tab. It is the Phase 1 desktop shell for HERE.

## What it does

- Loads the live HERE site in the main app window.
- Opens HERE Studio in its own window at https://joincomehere.com/live, where HERE's own Studio and Live Connect compositing already lives.
- Adds what a browser tab cannot: a real app in the Dock / taskbar, its own window, native-grade screen and window source picking for Studio (via the `preload.js` IPC bridge), and media and display permission handling scoped to HERE's own origins.

## Run it

```bash
npm install
npm start
```

## Build installers

```bash
npm run dist
npm run dist:mac
npm run dist:win
```

The GitHub Actions workflow `.github/workflows/build.yml` ("Build HERE Desktop (Mac + Windows)") can also be run manually from the Actions tab. It builds the macOS DMG and the Windows installer with electron-builder and uploads them as artifacts.

## Files

- `main.js` — Electron main process
- `preload.js` — preload bridge for Studio source picking
- `package.json` — app manifest and electron-builder config
- `assets/icon.png` — HERE app icon

Requires Node.js 22.
