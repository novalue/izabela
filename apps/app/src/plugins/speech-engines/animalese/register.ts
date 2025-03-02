import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { registerEngine } from '@/modules/speech-engine-manager'
import { AxiosResponse } from 'axios'
import animalese from '@packages/animalese'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

function dataURItoBlob(dataURI: string) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString
  if (dataURI.split(',')[0].indexOf('base64') >= 0) byteString = atob(dataURI.split(',')[1])
  else byteString = unescape(dataURI.split(',')[1])

  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length)
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return new Blob([ia], { type: mimeString })
}

const getSelectedVoice = () => {
  const voice = getProperty('selectedVoice')
  return voice.name === 'Custom'
    ? {
        ...voice,
        pitch: getProperty('pitch'),
        shortened: getProperty('shortened'),
      }
    : voice
}
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'local',
  getSelectedVoice,
  getVoiceName,
  getCredentials() {
    return {}
  },
  getPayload({ text, translatedText, voice, dictionaryRules }) {
    return {
      text: translatedText || text,
      voice: voice || getSelectedVoice(),
      dictionaryRules
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  commands: (voice: any) => [],
  synthesizeSpeech({ payload }) {
    const audio = animalese.getAudio(payload.text, payload.voice.shortened, payload.voice.pitch)
    const blob = dataURItoBlob(audio.dataURI)
    
    const response : AxiosResponse<Blob, any> = {
      data: blob,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    }

    return Promise.resolve(response)
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
