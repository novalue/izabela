import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getSelectedVoice,
  getVoiceName,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return speechStore.hasUniversalApiCredentials
  },
  getCredentials() {
    return {}
  },
  getPayload({ text, translatedText, voice: v, dictionaryRules }) {
    const voice = v || getSelectedVoice()
    return {
      text: translatedText || text,
      voice,
      dictionaryRules
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  commands: (voice: any) => [],
  synthesizeSpeech({ payload }) {
    return api().post<Blob>(
      '/tts/izabela/synthesize-speech',
      {
        payload,
      },
      { responseType: 'blob' },
    )
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
