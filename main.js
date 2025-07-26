'use strict';
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Configuración de la base de datos (sin cambios)
if (!app.isPackaged) {
  const dbPath = path.join(app.getAppPath(), 'database.sqlite');
  process.env.DB_STORAGE_PATH = dbPath;
  console.log(`<<<<< RUTA DE LA BASE DE DATOS ESTABLECIDA EN: ${dbPath} >>>>>`);
}

// Importamos la función para iniciar el servidor
const { startServer } = require('./src/app.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Carga la URL inmediatamente (ya no necesita la pausa)
  mainWindow.loadURL('http://localhost:3001/login.html');
}

// Lógica para imprimir PDF (sin cambios)
ipcMain.on('imprimir-a-pdf', (event, numeroRemito) => {
    // ... (tu código para imprimir a PDF se mantiene igual)
});

// Ciclo de vida de la app (CON EL CAMBIO CLAVE)
app.whenReady().then(() => {
  // 1. Primero, iniciamos el servidor
  startServer()
    .then(() => {
      // 2. SOLO CUANDO el servidor confirma que está listo, creamos la ventana
      createWindow();
    })
    .catch(err => {
      dialog.showErrorBox('Error Crítico del Servidor', `No se pudo iniciar el servidor backend:\n\n${err.message}`);
      app.quit();
    });
});

// --- CICLO DE VIDA DE LA APLICACIÓN ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});