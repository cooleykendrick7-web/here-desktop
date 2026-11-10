"use strict";
/* HERE Desktop — Phase 1 (Ken's order, Nov 10, 2026).
   HERE in its own Mac + Windows app window, modelled on the
   2X Studio Go packaging route. The app loads the live HERE
   site; the Studio window loads HERE's live pages, where the
   platform's own Studio + Live Connect compositing already
   lives — the desktop shell adds what a browser tab can't:
   a real app (dock/taskbar, its own window), native-grade
   screen/window source picking for the Studio (IPC bridge in
   preload.js), and media/display permission handling scoped
   to HERE's own origins. */
const { app, BrowserWindow, Menu, ipcMain, desktopCapturer,
        session, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const START_URL = process.env.HERE_DESKTOP_URL ||
  "https://joincomehere.com";
const STUDIO_URL = process.env.HERE_DESKTOP_STUDIO_URL ||
  "https://joincomehere.com/live";

/* Origins allowed to navigate inside the app. Everything
   else opens in the system browser. Google sign-in stays
   in-app so the HERE Google login keeps working. */
const IN_APP_HOSTS = new Set([
  "joincomehere.com",
  "here-19yl.onrender.com",
  "accounts.google.com",
]);

function inApp(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && IN_APP_HOSTS.has(u.hostname);
  } catch (e) {
    return false;
  }
}

/* Test/CI egress (this dev VM reaches the web via a local
   relay): HERE_DESKTOP_PROXY=http://127.0.0.1:18080. Real
   user machines leave it unset — direct connection. */
if (process.env.HERE_DESKTOP_PROXY) {
  app.commandLine.appendSwitch(
    "proxy-server", process.env.HERE_DESKTOP_PROXY);
}

/* Dev-VM self-test ONLY: this machine's egress proxy presents
   its own TLS CA, which Chromium's verifier rejects. Setting
   HERE_DESKTOP_INSECURE_TEST=1 (never set on a real user's
   machine — direct connections need no such thing) lets the
   screenshot self-test run behind that proxy. */
if (process.env.HERE_DESKTOP_INSECURE_TEST === "1") {
  app.commandLine.appendSwitch("ignore-certificate-errors");
}

let mainWin = null;
let studioWin = null;

function wireWindow(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (inApp(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!inApp(url) && /^https?:/.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    title: "HERE",
    icon: path.join(__dirname, "assets", "icon.png"),
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  wireWindow(mainWin);
  mainWin.loadURL(START_URL);
  mainWin.on("closed", () => { mainWin = null; });
  return mainWin;
}

function createStudioWindow() {
  if (studioWin) {
    studioWin.focus();
    return studioWin;
  }
  studioWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0a0a0a",
    title: "HERE Studio",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  wireWindow(studioWin);
  studioWin.loadURL(STUDIO_URL);
  studioWin.on("closed", () => { studioWin = null; });
  return studioWin;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const go = (url) => () => {
    const w = mainWin || createMainWindow();
    w.loadURL(url);
    w.focus();
  };
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "HERE",
      submenu: [
        { label: "Home", click: go("https://joincomehere.com/home") },
        { label: "🎬 Peeps", click: go("https://joincomehere.com/views") },
        { label: "Platforms (Live)", click: go("https://joincomehere.com/live") },
        { label: "Messages", click: go("https://joincomehere.com/messages") },
        { type: "separator" },
        { label: "Reload", role: "reload" },
        { role: "quit" },
      ],
    },
    {
      label: "Studio",
      submenu: [
        {
          label: "🎬 Open HERE Studio",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => createStudioWindow(),
        },
      ],
    },
    { role: "editMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* Media: HERE's live needs camera + microphone, and the
   Studio needs display capture. Grant them only to HERE's
   own origins; everything else is denied. */
function wirePermissions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    const ok = inApp(details.requestingUrl || wc.getURL());
    const allowed = ["media", "display-capture", "fullscreen"];
    callback(ok && allowed.includes(permission));
  });
  ses.setPermissionCheckHandler((wc, permission, requestingOrigin) => {
    if (!wc) return false;
    const url = requestingOrigin || wc.getURL();
    const allowed = ["media", "display-capture", "fullscreen"];
    return inApp(url) && allowed.includes(permission);
  });
  /* getDisplayMedia inside the Studio page: hand it the
     primary screen for Phase 1 (the source-picker UI that
     lists every window/screen rides the bridge in
     preload.js and lands with the Studio page in Phase 2). */
  ses.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources(
        { types: ["screen"] });
      const audio = request.audioRequested ? "loopback" : undefined;
      if (sources.length) {
        callback({ video: sources[0], audio });
      } else {
        callback({});
      }
    } catch (e) {
      callback({});
    }
  });
}

/* The Studio page's native picker bridge: real window/screen
   sources with thumbnails, the desktopCapturer way. */
ipcMain.handle("here-desktop:get-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true,
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail ? s.thumbnail.toDataURL() : "",
  }));
});

app.whenReady().then(() => {
  wirePermissions();
  buildMenu();
  const win = createMainWindow();

  /* Self-test hook (dev/CI only): HERE_DESKTOP_SHOT=path.png
     captures the loaded app window, then quits — the same
     "prove it with a picture" rule as every other build. */
  const shot = process.env.HERE_DESKTOP_SHOT;
  if (shot) {
    win.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        try {
          const img = await win.capturePage();
          fs.writeFileSync(shot, img.toPNG());
        } catch (e) { /* reported by the missing file */ }
        app.quit();
      }, 3500);
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
