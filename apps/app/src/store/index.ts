import { decrypt, encrypt } from '@/utils/security'
import { createPinia, defineStore } from 'pinia'
import { createApp, h, onScopeDispose, ref, watch } from 'vue'
import { electronPiniaPlugin } from '@packages/electron-pinia/renderer'

export const pinia = createPinia().use(electronPiniaPlugin())
/* ensures pinia is always available */
createApp(h({})).use(pinia)

function useLocalStorage<T>(key: string, defaultValue: T) {
  const val = ref(defaultValue);

  const storageVal = window.localStorage.getItem(key);
  if (storageVal) {
    val.value = JSON.parse(storageVal);
  }

  function handleStorageEvent(event: StorageEvent) {
    if (event.key === key) {
      val.value = JSON.parse(event.newValue || "null");
    }
  }

  window.addEventListener("storage", handleStorageEvent);

  onScopeDispose(() => window.removeEventListener("storage", handleStorageEvent));

  watch(val, (newValue) => window.localStorage.setItem(key, JSON.stringify(newValue)), { deep: true});

  return val;
}

export const definePluginStore = <S extends Record<any, any>>(
  id: string,
  state: S,
) => {
  const usePluginLocalStore = useLocalStorage<Record<any, any>>(`plugin-${id}`, state);

  return {
    setProperty(property: keyof S, value: any, encryptValue = false) {
      const fn = encryptValue ? encrypt : (v: any) => v;
      usePluginLocalStore.value[property] = fn(value);
    },
    getProperty(property: keyof S, decryptValue = false) {
      const fn = decryptValue ? decrypt : (v: any) => v;
      return fn(usePluginLocalStore.value[property]);
    },
  }
}
