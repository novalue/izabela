import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { registerEngine } from '@/modules/speech-engine-manager'
import animalese from '@packages/animalese'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'

function dataURItoUint8Array(dataURI: string) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1])
  else byteString = unescape(dataURI.split(',')[1])

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length)
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return ia
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
    const audio = animalese.getAudio(
      payload.text,
      payload.voice.shortened,
      payload.voice.pitch,
    )
    const audioData = dataURItoUint8Array(audio.dataURI)

    let response : Promise<Response> = new Promise<Response>((resolve, reject) => {
      if (audioData.length == 0) {
        const errorResponse = {
          error : 503,
          message : "Cannot generate Animalese's speech."
        }
        
        const body = new Blob([JSON.stringify(errorResponse)], { type: "application/json" });
        let options: ResponseInit = { status: 503, statusText: 'Service Unavailable'}
        reject(new Response(body, options))
      } else {
        const audioResponse = {
          available : true,
          captions : [],
          audio : Buffer.from(audioData).toString('base64'),
          type : 'audio/wav'
        }

        const body = new Blob([JSON.stringify(audioResponse)], { type: "application/json" });
        let options: ResponseInit = { status: 200, statusText: 'OK'}
        resolve(new Response(body, options))
      }
    })

    return response
  },
  getUseCacheOnEveryRequest() {
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store,
})
