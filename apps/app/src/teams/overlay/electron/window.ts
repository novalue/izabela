import { app, BrowserWindow, screen, Menu, MenuItem } from 'electron'
import path from 'path'
import { createProtocol } from '@/electron/utils'
import { ipcMain } from 'electron-postman'
import electronOverlayWindow from '@/teams/overlay/modules/electron-overlay-window'
import { onIPCVoiceSpellcheckLocale } from '@/electron/events/main'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  window = new BrowserWindow({
    show: false,
    fullscreen: true,
    transparent: true,
    frame: false,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: Boolean(
        Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      ),
      contextIsolation: !Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      sandbox: false,
      spellcheck: true
    },
  })

  {
    const primaryDisplay = screen.getPrimaryDisplay()
    window.setBounds(primaryDisplay.bounds)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    window.setIgnoreMouseEvents(true)
  }

  window.once('ready-to-show', () => {
    electronOverlayWindow.start(window)
  })

  ipcMain.registerBrowserWindow(name, window)
  onIPCVoiceSpellcheckLocale((process: string, locale: string) => {
    if (name == process)
    {
      window.webContents.session.setSpellCheckerEnabled(false)
      window.webContents.session.setSpellCheckerLanguages([locale])
      window.webContents.session.setSpellCheckerEnabled(true)
    }
  })
  
  window.webContents.session.setSpellCheckerLanguages(['en-US'])
  window.webContents.on('context-menu', (event, params) => {
    const menu = new Menu()

    // Add each spelling suggestion
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => window.webContents.replaceMisspelling(suggestion)
      }))
    }

    menu.append(new MenuItem({
      type: "separator"
    }))

    // Allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () => window.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      )
    }

    menu.popup()
  })

  ipcMain.registerBrowserWindow(name, window)

  const filePath = `./src/teams/${name}/index.html`

  if (import.meta.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(
      path.join(import.meta.env.VITE_DEV_SERVER_URL as string, filePath),
    )
    if (import.meta.env.DEV)
      window.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    window.loadURL(`app://${filePath}`)
  }

  return window
}

export default createWindow
