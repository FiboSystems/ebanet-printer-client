// Modules to control application life and create native browser window
const { app, BrowserWindow, nativeImage, Tray, Menu, ipcMain } = require('electron')
const path = require('path')
const api = require("./api");
const { autoUpdater } = require('electron-updater');

app.setLoginItemSettings({
  openAtLogin: true,
})

let tray = null
let mainWindow = null;

function createTray () {
  const icon = path.join(__dirname, '/icon.ico')
  const trayicon = nativeImage.createFromPath(icon)
  tray = new Tray(trayicon.resize({ width: 16 }))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar aplicación',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Cerrar',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    },
  ])

  tray.setContextMenu(contextMenu);
  tray.on('click', function () {
    mainWindow.show();
  })
}

function createWindow () {
  // Create the browser window.
  if (!tray) { // if tray hasn't been created already.
    createTray()
  }
  mainWindow = new BrowserWindow({
    width: 300,
    height: 300,
    icon: __dirname + '/icon.ico',
    skipTaskbar: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.hide();
  mainWindow.on('close', function (event) {
    if(!app.isQuiting){
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  })
  api(mainWindow);
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
