import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'fs/promises'
import path from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import ElectronWindowManager from '@/modules/electron-window-manager'
import { useSettingsStore } from '@/features/settings/store'
import pkg from '@root/package.json'

export const ElectronFilesystem = () => ({
  importGoogleCloudSpeechCredentials(credentialsPath: string): Promise<string> {
    const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
    const googleCloudSpeechCredentialsFilePath = path.join(
      credentialsDirPath,
      'google-cloud-speech-credentials.json',
    )
    // NOTE: need to secure this one day somehow
    return mkdir(credentialsDirPath, { recursive: true })
      .then(() =>
        copyFile(credentialsPath, googleCloudSpeechCredentialsFilePath),
      )
      .then(() => Promise.resolve(googleCloudSpeechCredentialsFilePath))
  },
  getGoogleCloudSpeechCredentialsPath(): Promise<string> {
    const credentialsDirPath = path.join(app.getPath('userData'), 'credentials')
    const googleCloudSpeechCredentialsFilePath = path.join(
      credentialsDirPath,
      'google-cloud-speech-credentials.json',
    )
    return stat(googleCloudSpeechCredentialsFilePath)
      .then(() => googleCloudSpeechCredentialsFilePath)
      .catch(() => '')
  },
  async downloadMessagePrompt(
    filename: string,
    content: ArrayBuffer | null,
  ): Promise<string> {
    if (!content) return Promise.reject(Error('The buffer is empty'))

    const settingsStore = useSettingsStore()
    await settingsStore.$whenReady()
    const extension = "mp3"
    const directory =
      settingsStore.preferredSavDir &&
      (await stat(settingsStore.preferredSavDir))
        ? settingsStore.preferredSavDir
        : app.getPath('downloads')
    const options = {
      title: 'Save file',
      defaultPath: path.join(directory, `${filename}.${extension}`),
      filters: [
        {
          name: 'Audio',
          extensions: [
            'mp3',
            'wav',
            'ogg',
            'flac',
            'aac',
            'm4a',
            'opus',
            'webm',
            'wma',
          ],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    }

    const res = await dialog.showSaveDialog(
      ElectronWindowManager.getInstanceByName('messenger')
        ?.window as BrowserWindow,
      options,
    )
    if (!res.filePath) return Promise.reject(Error('No file selected'))

    await writeFile(res.filePath, Buffer.from(content))
    settingsStore.preferredSavDir = path.dirname(res.filePath)
    return Promise.resolve(res.filePath)
  },
  async cacheAudio(id: string, content: string): Promise<boolean> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, id), content, 'ascii')
    return Promise.resolve(true)
  },
  async getCachedAudio(id: string): Promise<string | null> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    const files = await readdir(directory)
    const file = files.find((f) => f.startsWith(id))
    if (file) {
      return Promise.resolve(readFile(path.join(directory, file), {encoding : 'ascii'}))
    }
    return Promise.resolve(null)
  },
  async deleteCachedAudio(id: string): Promise<boolean> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await mkdir(directory, { recursive: true })
    const files = await readdir(directory)
    const file = files.find((f) => f.startsWith(id))
    if (file) {
      await rm(path.join(directory, file))
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  },
  async clearCache(): Promise<boolean> {
    const directory = path.join(app.getPath('temp'), pkg.productName, 'cache')
    await rm(directory, { recursive: true, force: true })
    await mkdir(directory, { recursive: true })
    return Promise.resolve(true)
  },
})

export default ElectronFilesystem()
