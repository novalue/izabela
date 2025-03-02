import { PiniaPlugin, PiniaPluginContext } from 'pinia'
import debounce from 'lodash/debounce'
import defaults from 'lodash/defaults'
import cloneDeep from 'lodash/cloneDeep'
import type ElectronStore from 'electron-store'

import {
  ELECTRON_STORAGE_NAME,
  IPC_EVENT_STORE_DELETE,
  IPC_EVENT_STORE_GET,
  IPC_EVENT_STORE_SET,
} from './consts'
import { Deferred, purify } from '@packages/toolbox'
import { isMain } from './electron'

const electronStore =
  isMain &&
  new (require('electron-store'))({
    name: ELECTRON_STORAGE_NAME,
  })

function getStorage(): ElectronStore {
  return isMain ? electronStore : window.ElectronPiniaStorage
}

const storageSetState = isMain // debounce to prevent too many writes to the disk
  ? debounce((name: string, state: any) => getStorage().set(name, state), 1000)
  : (name: string, state: any) => getStorage().set(name, state)

if (isMain) {
  const { ipcMain } = require('electron')
  ipcMain.handle(IPC_EVENT_STORE_GET, (_, { name }) => {
    const storage = getStorage()
    return storage.get(name)
  })
  ipcMain.on(IPC_EVENT_STORE_SET, (_, { name, state }) => {
    storageSetState(name, state)
    return true
  })
  ipcMain.on(IPC_EVENT_STORE_DELETE, (_, { name }) => {
    const storage = getStorage()
    storage.delete(name)
    return true
  })
}

export const persistStatePlugin = ({ store }: Parameters<PiniaPlugin>[0]) => {
  const deferredIsReady = Deferred<boolean>()
  const storage = getStorage()

  const setState = debounce((state: any) => {
    const sanitizedState = purify(state)
    storageSetState(getStorageName(store.$id), sanitizedState)
  }, 1000)

  async function getState() {
    return (await storage.get(getStorageName(store.$id))) || {}
  }

  function getStorageName(storeId: PiniaPluginContext['store']['$id']) {
    return `electron-pinia-${storeId}`
  }

  async function loadInitialState() {
    const state = await getState()
    if (state) {
      const mergedState = defaults(cloneDeep(state), cloneDeep(store.$state))
      store.$patch(mergedState)
    }
    return true
  }

  loadInitialState()
    .then(() => {
      deferredIsReady.resolve(true)
      store.$subscribe((_, state) => setState(state))
    })
    .catch(() => {
      deferredIsReady.reject(false)
    })
  return deferredIsReady.promise
}
