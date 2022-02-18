// Modules to control application life and create native browser window
const {
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  app,
  autoUpdater,
  dialog,
  ipcMain,
  nativeImage,
} = require('electron')
const path = require('path')
const api = require("./api");
if (require('electron-squirrel-startup')) return;

let tray = null
let mainWindow = null;

///////////// Window and try creation

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
    isManualUpdateCheck = false
    autoUpdater.checkForUpdates();
  });
}

//////// Updates handling

// Setup Hazel server for updates
const server = 'https://hazel-eba.vercel.app';
const url = `${server}/update/${process.platform}/${app.getVersion()}`;
autoUpdater.setFeedURL({ url })

let isManualUpdateCheck = false;

// Set interval to check for updates.
const UPDATE_CHECK_INTERVAL = 500 * 60 * 1000
setInterval(() => {
  isManualUpdateCheck = false;
  autoUpdater.checkForUpdates();
}, UPDATE_CHECK_INTERVAL)

if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

// Squirrel installer behavior
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', "EBANET - Cliente de impresión"]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {

  // User clicked the check updates button.
  if (isManualUpdateCheck) {
    const dialogOpts = {
      type: 'info',
      buttons: ['Reiniciar', 'Ignorar'],
      title: 'Actualización disponible',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'Una nueva actualización se encuentra disponible. Reinicia la aplicación para aplicarla.'
    }
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        app.isQuiting = true;
        autoUpdater.quitAndInstall()
      }
    })
  } else {
    sendUpdateDownloaded()
    const NOTIFICATION_TITLE = 'EBANET Printer Client'
    const NOTIFICATION_BODY = 'Nueva actualización disponible.'
    const notification = new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY })
    notification.show()
    notification.on('click', (event, arg)=>{
      mainWindow.show()
    })
  }
})

autoUpdater.on('update-not-available', (e) => {
  if (isManualUpdateCheck) {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'No hay actualizaciones disponibles.',
      detail: 'Tienes la última versión instalada.'
    }
    dialog.showMessageBox(dialogOpts);
  } else {
    sendUpdateNotAvailable()
  }
})

autoUpdater.on('error', (e) => {
  if (isManualUpdateCheck) {
    dialog.showErrorBox("Error al descargar actualizaciones.", e.message);
  } else {
    sendUpdateError()
  }
})

ipcMain.on('check_updates', () => {
  isManualUpdateCheck = true;
  autoUpdater.checkForUpdates();
});

ipcMain.on('restart', () => {
  app.isQuiting = true;
  autoUpdater.quitAndInstall()
});


//////////// Application configuration

// Start at login
app.setLoginItemSettings({
  openAtLogin: true,
})

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
/*ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});*/

sendUpdateDownloaded = () => {
  mainWindow.webContents.send('update_available');
}

sendUpdateError = () => {
  mainWindow.webContents.send('update_error');
}

sendUpdateNotAvailable = () => {
  mainWindow.webContents.send('update_not_available');
}
