// main.js - El cerebro de la aplicación de escritorio

// --- AÑADIMOS LAS IMPORTACIONES NECESARIAS ---
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Creamos una variable global para acceder a la ventana principal
let mainWindow;

// Establecemos la ruta de la base de datos (tu código original, está perfecto)
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');
process.env.DB_STORAGE_PATH = dbPath;
console.log('Ruta de la base de datos establecida en:', dbPath);

// Iniciamos el servidor de Express
require('./src/app.js');


// --- MODIFICAMOS TU FUNCIÓN createWindow ---
const createWindow = () => {
  // Asignamos la nueva ventana a nuestra variable global
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      // --- ESTE ES EL CAMBIO MÁS IMPORTANTE ---
      // Conectamos nuestro script "puente" (preload.js)
      preload: path.join(__dirname, 'preload.js'),

      // Tus opciones de seguridad están perfectas
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // El resto de tu función se mantiene igual
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001');
  }, 2000);
  
  // mainWindow.webContents.openDevTools();
};


// --- AÑADIMOS EL "ESCUCHADOR" PARA GENERAR EL PDF ---
// Este bloque escucha los mensajes que vienen desde el frontend
ipcMain.on('imprimir-a-pdf', (event, numeroRemito) => {
    console.log(`Petición recibida para generar PDF para el Remito N° ${numeroRemito}`);
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


// --- CICLO DE VIDA DE LA APP (Tu código original, está perfecto) ---
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
