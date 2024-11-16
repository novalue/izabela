// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { ref } from 'vue'
// eslint-disable-next-line import/no-cycle
import { useDictionaryStore } from '@/features/dictionary/store'

const SpeechEngineManager = () => {
  const engines = ref<SpeechEngine[]>([])

  const commands: SpeechEngine['commands'] = (voice) =>
    (voice.StyleList || []).map((style: string) => ({ name: style, value: style }))

  const checkIntonation = (options: any, speechEngine: SpeechEngine) => {
    const voice = options.voice || speechEngine.getSelectedVoice()
    const commandString = options.text.split(' ')[0] || ''
    if (commandString.startsWith('/')) {
      const command = commands(voice).find(({ name }) => commandString.startsWith(`/${name}`))
      options.text = options.text.replace(commandString, '')
      if (command) {
        options.intonation = command.value
      }
    }
  }

  const checkPhonemes = (options: any, speechEngine: SpeechEngine) =>
  {
    if (speechEngine.id == 'matts') {
      options.hasPhonemes = false;
    }
  }

  async function withDictionary(speechEngine: SpeechEngine): Promise<SpeechEngine> {
    const dictionaryStore = useDictionaryStore()
    await dictionaryStore.$whenReady()
    return {
      ...speechEngine,
      getPayload: (options) => {
        checkIntonation(options, speechEngine);
        checkPhonemes(options, speechEngine);

        options.text = options.text.replace(/^(\s*[>]\s*(\p{L}+\s*\(\w+\)|\w+)\s*):(.*)/gui, '$2 says:$3')

        dictionaryStore.translateText(options);
        dictionaryStore.elaborateRules(options)

        return speechEngine.getPayload(options)
      }
    }
  }

  async function registerEngine(speechEngine: SpeechEngine) {
    engines.value.push(await withDictionary(speechEngine))
  }

  function getEngineById(id: SpeechEngine['id']) {
    return engines.value.find((speechEngine) => speechEngine.id === id)
  }

  function getEngines() {
    return engines.value
  }

  const useSpeechEngineManager = () => ({
    getEngineById,
    getEngines,
    engines,
  })
  return {
    registerEngine,
    getEngineById,
    getEngines,
    useSpeechEngineManager,
  }
}
const instance = SpeechEngineManager()
export const { registerEngine, getEngineById, getEngines, useSpeechEngineManager } = instance
export default instance
