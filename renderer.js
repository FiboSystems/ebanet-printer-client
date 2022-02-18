// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { ipcRenderer } = require('electron');
// const {autoUpdater} = require("electron-updater");
const version = document.getElementById('version');

//ipcRenderer.send('app_version');
//ipcRenderer.on('app_version', (event, arg) => {
  //  ipcRenderer.removeAllListeners('app_version');
   // version.innerText = 'Version ' + arg.version;
//});

const restartSection = document.getElementById('restartSection')
const restartButton = document.getElementById('restartBtn')
const checkUpdatesButton = document.getElementById('checkUpdatesBtn')
const updatesSection = document.getElementById('updatesSection')
const status = document.getElementById('status')
const error = document.getElementById('error')
ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    updatesSection.style.display = 'block'
    restartSection.style.display = 'block'
    checkUpdatesButton.style.display = 'none'
    status.style.display = 'none'
    error.style.display = 'none'
});

ipcRenderer.on('searching_updates', () => {
    ipcRenderer.removeAllListeners('searching_updates');
    updatesSection.style.display = 'none'
    status.style.display = "block"
    error.style.display = 'none'
});

ipcRenderer.on('update_error', () => {
    ipcRenderer.removeAllListeners('update_error');
    updatesSection.style.display = 'block'
    restartSection.style.display = 'none'
    checkUpdatesButton.style.display = 'block'
    status.style.display = 'none'
    error.style.display = 'block'
});
// ipcRenderer.on('update_downloaded', () => {
//     ipcRenderer.removeAllListeners('update_downloaded');
//     message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
//     restartButton.classList.remove('hidden');
//     notification.classList.remove('hidden');
// });

// ipcRenderer.on('update_downloaded', () => {
//     ipcRenderer.removeAllListeners('update_downloaded');
//     message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
//     restartButton.classList.remove('hidden');
//     notification.classList.remove('hidden');
// });
//
// function closeNotification() {
//     notification.classList.add('hidden');
// }
// function restartApp() {
//     ipcRenderer.send('restart_app');
// }

function checkUpdates() {
    ipcRenderer.send('check_updates');
}
checkUpdatesButton.addEventListener('click', () => checkUpdates())

function restart() {
    ipcRenderer.send('restart');
}
restartButton.addEventListener('click', () => restart())

