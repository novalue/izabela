// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { ref } from 'vue'
// eslint-disable-next-line import/no-cycle
import { useDictionaryStore } from '@/features/dictionary/store'

const SpeechEngineManager = () => {
  const engines = ref<SpeechEngine[]>([])

  const commands: SpeechEngine['commands'] = (voice) =>
    (voice.StyleList || []).map((style: string) => ({ name: style, value: style }))

  async function withDictionary(speechEngine: SpeechEngine): Promise<SpeechEngine> {
    const dictionaryStore = useDictionaryStore()
    await dictionaryStore.$whenReady()
    return {
      ...speechEngine,
      getPayload: (options) => {
        const voice = options.voice || speechEngine.getSelectedVoice()
        let newText = options.text
        let intonation = null

        const commandString = newText.split(' ')[0] || ''
        if (commandString.startsWith('/')) {
          const command = commands(voice).find(({ name }) => commandString.startsWith(`/${name}`))
          newText = newText.replace(commandString, '')
          newText = newText.replace(/^(\s*[>]\s*(\p{L}+\s*\(\w+\)|\w+)\s*):(.*)/gi, '$2 says:$3')
          if (command) {
            intonation = command.value
          }
        } else {
          newText = newText.replace(/^(\s*[>]\s*(\p{L}+\s*\(\w+\)|\w+)\s*):(.*)/gi, '$2 says:$3')
        }

        return speechEngine.getPayload({
          ...options,
          expression: intonation,
          text: dictionaryStore.translateText(newText),
          dictionaryRules: dictionaryStore.elaborateRules(newText)
        })
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
