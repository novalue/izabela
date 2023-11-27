import { app, BrowserWindow, screen, Menu, MenuItem, nativeTheme } from 'electron'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { ipcMain } from 'electron-postman'
import { onIPCVoiceSpellcheckLocale, onIPCToggleDarkMode } from '@/electron/events/main'
import electronMessengerWindow from '@/teams/messenger/modules/electron-messenger-window'
import { useSettingsStore } from '@/features/settings/store'

let window: BrowserWindow
const createWindow = async (name: string): Promise<BrowserWindow> => {
  const settingsStore = useSettingsStore()
  await settingsStore.$whenReady()
  
  window = new BrowserWindow({
    show: false,
    fullscreen: true,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      sandbox: false,
      spellcheck: true
    },
  })

  {
    const primaryDisplay = screen.getPrimaryDisplay()
    window.setBounds(primaryDisplay.bounds)

    // https://github.com/electron/electron/issues/10078#issuecomment-331581160
    window.setAlwaysOnTop(true, 'screen-saver', 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    window.setMenu(null)
  }

  window.once('ready-to-show', () => {
    electronMessengerWindow.start(window)
  })

  ipcMain.registerBrowserWindow(name, window)

  window.webContents.session.setSpellCheckerLanguages([settingsStore.voiceLocale])

  onIPCVoiceSpellcheckLocale((process: string, locale: string) => {
    if (name == process)
    {
      window.webContents.session.setSpellCheckerEnabled(false)
      window.webContents.session.setSpellCheckerLanguages([locale])
      window.webContents.session.setSpellCheckerEnabled(true)

      settingsStore.$patch({voiceLocale: locale})
    }
  })

  nativeTheme.themeSource = (settingsStore.toggleDarkMode ? 'dark' : 'light')

  onIPCToggleDarkMode(() => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light'
    } else {
      nativeTheme.themeSource = 'dark'
    }
    settingsStore.$patch({toggleDarkMode: nativeTheme.shouldUseDarkColors})
  })

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

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await window.loadURL(path.join(process.env.WEBPACK_DEV_SERVER_URL as string, name))
    if (!process.env.IS_TEST) window.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    window.loadURL(`app://./${name}.html`)
  }

  return window
}

export default createWindow
