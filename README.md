# HERE Desktop — HERE for Mac + Windows, with HERE Studio

Ken's order (Nov 10, 2026): do for HERE what 2X Studio Go did —
a real computer app for Mac + Windows — with a live stream
studio like TikTok LIVE Studio inside it.

## What Phase 1 is (this code)

- **The HERE app**: HERE (joincomehere.com) in its own app
  window — dock/taskbar presence, its own icon (the HERE
  wordmark), an app menu (Home / Peeps / Platforms / Messages),
  and outside links handed to the system browser. Google
  sign-in stays in-app so HERE's Google login works.
- **HERE Studio window** (menu → Studio → *Open HERE Studio*,
  or Ctrl/Cmd+Shift+S): a second, bigger window on HERE's live
  pages, where the platform's existing Studio + Live Connect
  compositing already runs (scenes on a canvas, camera /
  capture-card / screen sources). The desktop shell adds the
  parts a browser tab can't do well:
  - camera/microphone/display permissions granted to HERE's
    origins only;
  - a display-capture handler so screen sharing works in-app;
  - a **native source bridge** (`window.hereDesktop.getSources()`)
    that lists real windows + screens with thumbnails via
    Electron's desktopCapturer — the picker UI that consumes
    it lands with the Studio page in Phase 2.
- Session and data are the user's own HERE account, exactly as
  in a browser — the app signs in the same way.

## Run it (dev)

```sh
npm install
npm start
```

## Build installers

Installers are built on real Mac/Windows machines (or the
GitHub Actions workflow in `.github/workflows/build.yml`,
which mirrors the 2X Studio Go pipeline):

```sh
npm run dist:mac   # .dmg
npm run dist:win   # .exe (NSIS)
```

Unsigned for now — like 2X Studio Go, first open on Mac is
right-click → Open, until signing certificates are bought.

## Roadmap (from the TikTok LIVE Studio feature map)

- **Phase 1** — this: app shell + Studio window + capture
  permissions + native source bridge. ✅ foundation
- **Phase 2** — the dedicated Studio page: scenes rail,
  canvas editor, audio mixer, portrait + dual layout, live
  chat/gifts/data panel, native source-picker UI.
- **Phase 3** — local recording + Highlight clips, polls and
  goal widgets, background removal/beauty, templates/themes.

No follower gates, no locked sources, no trial — that's
TikTok's model, not HERE's.
