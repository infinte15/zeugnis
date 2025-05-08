const { app, BrowserWindow } = require('electron');
const { updateElectronApp } = require('update-electron-app');

updateElectronApp();

if (require('electron-squirrel-startup')) app.quit();

const createWindow = () => {
  const win = new BrowserWindow({
    show: false, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.maximize(); 
  win.show();     

  win.loadFile('blume.html');
}

app.whenReady().then(() => {
  createWindow();
});
