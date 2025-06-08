// main.js - El punto de entrada de la aplicación de escritorio

const { app, BrowserWindow } = require('electron');
const path = require('path');
// 1. Obtenemos la ruta segura y persistente para los datos de la app.
const userDataPath = app.getPath('userData');
// 2. Creamos la ruta completa para nuestro archivo de base de datos.
const dbPath = path.join(userDataPath, 'database.sqlite');
// 3. La guardamos en una variable de entorno para que el backend la pueda leer.
process.env.DB_STORAGE_PATH = dbPath;

console.log('Ruta de la base de datos establecida en:', dbPath);
// Iniciamos el servidor de Express que ya funciona.
// Esta es la magia: tu backend se ejecuta en segundo plano.
require('./src/app.js');

const createWindow = () => {
  // Crea la ventana principal de la aplicación.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    // Puedes configurar un icono aquí si quieres
    // icon: path.join(__dirname, 'assets/icon.png'), 
    webPreferences: {
      // Por seguridad, es bueno mantener estas opciones así
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Hacemos que la ventana cargue la URL de tu servidor local.
  // Es importante que el puerto coincida con el de tu app.js (3001).
  // Damos un pequeño retardo para asegurar que el servidor Express haya arrancado.
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001');
  }, 2000); // 2 segundos de espera

  // Opcional: Abre las herramientas de desarrollo automáticamente
  // mainWindow.webContents.openDevTools();
};

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