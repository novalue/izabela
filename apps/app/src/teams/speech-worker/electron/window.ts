import { BrowserWindow, Menu, MenuItem } from 'electron'
import { ipcMain } from 'electron-postman'
import path from 'path'
import { createProtocol, getTopLeftWindow } from '@/electron/utils'
import electronSpeechWorkerWindow from '@/teams/speech-worker/modules/electron-speech-worker-window'
import { windowHeight, windowWidth } from '@/teams/speech-worker/electron/const'
import { onIPCVoiceSpellcheckLocale } from '@/electron/events/main'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  const topLeftDisplay = getTopLeftWindow()

  window = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: (topLeftDisplay?.bounds.x ?? 0) - windowWidth,
    y: (topLeftDisplay?.bounds.y ?? 0) - windowHeight,
    show: true,
    transparent: true,
    frame: false,
    focusable: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: Boolean(
        Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      ),
      contextIsolation: !Number(import.meta.env.VITE_ELECTRON_NODE_INTEGRATION),
      backgroundThrottling: false,
      sandbox: false,
      spellcheck: true
    },
  })

  {
    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true, 'screen-saver', 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)

    window.webContents.setBackgroundThrottling(false)
  }

  window.once('ready-to-show', () => {
    electronSpeechWorkerWindow.start(window)
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
