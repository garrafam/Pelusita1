// main.js (Versión Limpia y Corregida)

'use strict';

// --- MÓDULOS DE ELECTRON Y NODE ---
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
// Este bloque es el único que debe definir la ruta de la base de datos.
// Detecta si estamos en desarrollo o en producción para usar el archivo .sqlite correcto.
let dbPath;

if (!app.isPackaged) {
  // MODO DESARROLLO: Usa la base de datos en la carpeta del proyecto.
  // Asegúrate de que el nombre ('database.sqlite') coincida con el de tu config/database.js
  dbPath = path.join(app.getAppPath(), 'database.sqlite');
} else {
  // MODO PRODUCCIÓN (cuando la app esté instalada): Usa la carpeta de datos del usuario.
  dbPath = path.join(app.getPath('userData'), 'database.sqlite');
}

// Guardamos la ruta en una variable de entorno para que Sequelize la use.
process.env.DB_STORAGE_PATH = dbPath;
console.log(`<<<<< RUTA DE LA BASE DE DATOS ESTABLECIDA EN: ${dbPath} >>>>>`);

// --- INICIO DEL SERVIDOR BACKEND ---
// Arrancamos nuestro servidor Express. Debe hacerse después de definir la ruta de la BD.
require('./src/app.js');

// --- VENTANA PRINCIPAL DE ELECTRON ---
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Conecta el script "puente"
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Esperamos 2 segundos para dar tiempo al servidor Express a iniciarse antes de cargar la URL.
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001');
  }, 2000);
  
  // Descomenta la siguiente línea si quieres que las herramientas de desarrollador se abran al inicio.
  // mainWindow.webContents.openDevTools();
}

// --- COMUNICACIÓN ENTRE PROCESOS (IPC) ---
// Escucha el evento 'imprimir-a-pdf' que viene del frontend para generar el PDF.
ipcMain.on('imprimir-a-pdf', (event, numeroRemito) => {
  const ventana = BrowserWindow.fromWebContents(event.sender);

  dialog.showSaveDialog(ventana, {
    title: 'Guardar Remito como PDF',
    defaultPath: `Remito-${numeroRemito}.pdf`,
    filters: [{ name: 'Archivos PDF', extensions: ['pdf'] }]
  }).then(result => {
    if (!result.canceled) {
      const rutaPDF = result.filePath;
      ventana.webContents.printToPDF({
        marginsType: 0,
        pageSize: 'A4',
        printBackground: true
      }).then(data => {
        fs.writeFile(rutaPDF, data, (error) => {
          if (error) {
            dialog.showErrorBox('Error al Guardar', `No se pudo guardar el PDF: ${error.message}`);
            return;
          }
          dialog.showMessageBox(ventana, {
            title: 'Éxito',
            message: `El PDF del remito se guardó correctamente en:\n${rutaPDF}`
          });
        });
      }).catch(error => {
        dialog.showErrorBox('Error de Impresión', `No se pudo generar el PDF: ${error.message}`);
      });
    }
  }).catch(err => {
    console.error("Error en el diálogo de guardado:", err);
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