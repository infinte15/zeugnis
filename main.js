const { app, BrowserWindow } = require('electron');
const { updateElectronApp } = require('update-electron-app');
updateElectronApp();
if (require('electron-squirrel-startup')) app.quit();
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1500,
    height: 1000,
  })
  win.maximize();
  win.loadFile('Klasse/klasse.html')
}

app.whenReady().then(() => {
  createWindow()
})
