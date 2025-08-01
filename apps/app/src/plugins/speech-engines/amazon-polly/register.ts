import { fetchApi } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'

const getCredentials = () => {
  const speechStore = useSpeechStore()
  return speechStore.hasUniversalApiCredentials &&
    !getProperty('useLocalCredentials')
    ? {}
    : {
        identityPoolId: getProperty('identityPoolId', true),
        region: getProperty('region'),
      }
}

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return (
      speechStore.hasUniversalApiCredentials ||
      Object.values(getCredentials()).every(Boolean)
    )
  },
  getPayload({ text, translatedText, voice, dictionaryRules }) {
    return {
      Text: translatedText || text,
      VoiceId: (voice || getSelectedVoice()).Id,
      dictionaryRules
    }
  },
  getLanguageCode(voice) {
    return (voice || getSelectedVoice()).LanguageCode
  },
  commands: (voice: any) => [],
  synthesizeSpeech({ credentials, payload }) {
    return fetchApi(
      getProperty('useLocalCredentials') ? 'local' : 'remote', 
      `/tts/amazon-polly/synthesize-speech`,
      {
        method: 'POST',
        body: JSON.stringify({
          credentials,
          payload
        }),
      },
    )
  },
  getUseCacheOnEveryRequest() {
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store,
})
