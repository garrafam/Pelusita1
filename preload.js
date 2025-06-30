// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Exponemos de forma segura un objeto llamado 'electronAPI' al
// contexto de la ventana del navegador (a tu scrip.js).
contextBridge.exposeInMainWorld('electronAPI', {
  // Creamos una función 'imprimirAPDF' que tu frontend podrá llamar.
  // Cuando se llame, enviará el mensaje 'imprimir-a-pdf' junto con el número
  // de remito al proceso principal (main.js).
  imprimirAPDF: (numeroRemito) => ipcRenderer.send('imprimir-a-pdf', numeroRemito)
});
