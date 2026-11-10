"use strict";
/* HERE Desktop bridge. HERE's pages detect the desktop app
   via window.hereDesktop and (from Phase 2) open the native
   source picker for Studio screen/window sources. Nothing
   else about the page changes — it is the same HERE. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hereDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.0",
  getSources: () => ipcRenderer.invoke("here-desktop:get-sources"),
});
