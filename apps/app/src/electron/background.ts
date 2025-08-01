/* eslint global-require: 0 */
import { autoUpdater } from 'electron-updater'
import { app } from 'electron'

const fallback = async (...args: unknown[]) => {
  let shouldUpdate = false;
  const { BrowserWindow } = require('electron')
  const window = new BrowserWindow({
    frame: false,
    resizable: false,
    transparent: true
  })

  window.on("closed", () => {
    if (shouldUpdate) {
      autoUpdater.quitAndInstall()
    }
  })
  
  window.setFullScreenable(false)
  window.setMenu(null)
  window.webContents.openDevTools()
  window.loadFile("./src/index.html")
  window.webContents.executeJavaScript("document.getElementById('error_container').innerHTML='" + [...args].join("<br>") + "';")

  const version = app.getVersion()
  const channelPart = version.split('-')[1]
  const channel = channelPart ? channelPart.split('.')[0] : 'latest'
  autoUpdater.channel = channel
  autoUpdater.on('update-downloaded', () => {
    shouldUpdate = true;
  })
  console.log(
    `[system] A critical error occurred. Proceeding to update the application on the "${channel}" channel.`,
  )
  return autoUpdater.checkForUpdates()
}

;(async () => {
  try {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      console.log('App is already running, check the system tray.')
      return app.quit()
    }
    import('./plugins')
      .then(() => import('./app'))
      .then((module) => module.default.start())
      .catch(fallback)
  } catch (e) {
    console.error(e)
    await fallback()
  }
  return null
})()
