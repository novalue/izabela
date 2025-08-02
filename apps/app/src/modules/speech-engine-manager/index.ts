// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
// eslint-disable-next-line import/no-cycle
import { useDictionaryStore } from '@/features/dictionary/store'
import { createEngineManager } from '@/modules/engine-manager'

const SpeechEngineManager = () => {
  const engineManager = createEngineManager<SpeechEngine>()

  const checkPhonemes = (options: any, speechEngine: SpeechEngine) =>
  {
    if (speechEngine.id == 'matts') {
      options.hasPhonemes = false;
    }
  }

  function withDictionary(speechEngine: SpeechEngine): SpeechEngine {
    const dictionaryStore = useDictionaryStore()
    return {
      ...speechEngine,
      getPayload: (options) => {
        checkPhonemes(options, speechEngine);

        options.text = options.text.replace(/^(\s*[>]\s*(\p{L}+\s*\(\w+\)|\w+)\s*):(.*)/gui, '$2 says:$3')

        dictionaryStore.translateText(options);
        dictionaryStore.elaborateRules(options)

        return speechEngine.getPayload(options)
      }
    }
  }

  function registerEngine(speechEngine: SpeechEngine) {
    engineManager.registerEngine(speechEngine.id, withDictionary(speechEngine))
  }

  function getEngineById(id: SpeechEngine['id']) {
    return engineManager.getEngineById(id)
  }

  function getEngines() {
    return engineManager.getEngines()
  }

  return {
    registerEngine,
    getEngineById,
    getEngines,
  }
}
const instance = SpeechEngineManager()
export const { registerEngine, getEngineById, getEngines } = instance
export default instance
