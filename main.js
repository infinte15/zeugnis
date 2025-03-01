const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1500,
    height: 1000
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})
