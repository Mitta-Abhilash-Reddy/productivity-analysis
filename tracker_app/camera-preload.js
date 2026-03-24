const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cameraCapture", {
  success: (dataUrl) => ipcRenderer.send("camera-capture-success", dataUrl),
  failure: (message) => ipcRenderer.send("camera-capture-failure", message),
});
