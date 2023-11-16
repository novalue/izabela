import { processes, rendererProcesses } from '@/types/electron'
import { ipcMain } from 'electron-postman'

export const onIPCProcessError = (callback: (error: Error, process: string) => any) => {
  processes.forEach((process) => {
    ipcMain.on(process, 'error', (payload: { name: string; message: string }) =>
      callback(payload, process),
    )
  })
}

export const emitIPCCancelCurrentMessage = () => {
  ipcMain.sendTo('speech-worker', 'cancel-current-message')
}

export const emitIPCCancelAllMessages = () => {
  ipcMain.sendTo('speech-worker', 'cancel-all-messages')
}

export const emitIPCOverlayInputCharacter = (character: string) => {
  ipcMain.sendTo('overlay', 'overlay-input-character', character)
}

export const emitIPCOverlayInputCommand = (command: string, args: any[] = []) => {
  ipcMain.sendTo('overlay', 'overlay-input-command', [command, ...args])
}

export const onIPCVoiceSpellcheckLocale = (callback: (process: string, locale: string) => void) => {
  rendererProcesses.forEach((process) => {
    ipcMain.on(process, 'voice-spellcheck-locale', (locale: string) =>
      callback(process, locale),
    )
  })
}