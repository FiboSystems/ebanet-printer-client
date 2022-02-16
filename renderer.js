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
ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    restartSection.style.display = 'block'
    checkUpdatesButton.style.display = 'none'
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
    console.log('click on check updates')
    ipcRenderer.send('check_updates');
}
checkUpdatesButton.addEventListener('click', () => checkUpdates())
