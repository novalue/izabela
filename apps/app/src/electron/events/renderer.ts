import { mainProcess, processes } from '@/types/electron'
import type { InputType } from '@/modules/izabela/utils'

const { ipc } = window

export const emitIPCProcessError = (payload: {
  name: string
  message: string
}) => {
  processes.forEach((process) => {
    ipc.sendTo(process, 'error', payload)
  })
}

export const emitIPCGameOverlayStartIntercept = () => {
  ipc.sendTo(mainProcess, 'game-overlay-start-intercept')
}

export const emitIPCGameOverlayStopIntercept = () => {
  ipc.sendTo(mainProcess, 'game-overlay-stop-intercept')
}

export const onIPCSay = (callback: (inputData: InputType) => any) => {
  processes.forEach((process) => {
    ipc.on(process, 'say', callback)
  })
}

export const emitIPCSay = (inputData: InputType) => {
  ipc.sendTo('speech-worker', 'say', inputData)
}

export const emitIPCVoiceSpellcheckLocale = (locale: string) => {
  processes.forEach((process) => {
    ipc.sendTo(process, 'voice-spellcheck-locale', locale)
  })
}

export const emitIPCSelectTheme = (theme : string) => {
  processes.forEach((process) => {
    ipc.sendTo(process, 'select-theme', theme)
  })
}

export const onIPCCancelCurrentMessage = (callback: () => any) => {
  processes.forEach((process) => {
    ipc.on(process, 'cancel-current-message', callback)
  })
}

export const onIPCCancelAllMessages = (callback: () => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'cancel-all-messages', callback)
  })
}

export const onIPCOverlayInputCharacter = (callback: (key: any) => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'overlay-input-character', callback)
  })
}

export const onIPCOverlayInputCommand = (callback: (args: any[]) => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'overlay-input-command', callback)
  })
}

export const onIPCGameOverlayResize = (
  callback: (size: { width: number; height: number }) => void,
) => {
  processes.forEach((process) => {
    ipc.on(process, 'resize', callback)
  })
}

export const onIPCApplyProfile = (callback: (id: string) => void) => {
  processes.forEach((process) => {
    ipc.on(process, 'apply-profile', callback)
  })
}
