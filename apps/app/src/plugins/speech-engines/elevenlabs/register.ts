import { registerEngine } from '@/modules/speech-engine-manager'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { api } from '@/services'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
})

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload({ text, translatedText, voice: v, dictionaryRules }) {
    const voice = v || getSelectedVoice()
    return {
      text: translatedText || text,
      voice,
      dictionaryRules,
      stability: getProperty('stability'),
      similarity_boost: getProperty('similarity_boost'),
      style: getProperty('style'),
      use_speaker_boost: getProperty('use_speaker_boost'),
      model_id: getProperty('model_id'),
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  commands: (voice: any) => [],
  synthesizeSpeech({ credentials, payload }) {
    return api('local').post<Blob>(
      '/tts/elevenlabs/synthesize-speech',
      {
        credentials,
        payload,
      },
      {
        responseType: 'blob',
      },
    )
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
