<script lang="ts" setup>
import { v5 as uuid, NIL } from 'uuid'
import izabela from '@/modules/izabela'
import type {
  IzabelaMessage,
  IzabelaMessagePayload,
} from '@/modules/izabela/types'
import {
  onIPCCancelAllMessages,
  onIPCCancelCurrentMessage,
  onIPCSay,
} from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import speechEngineManager from '@/modules/speech-engine-manager'
import translationEngineManager from '@/modules/translation-engine-manager'
import type { InputType, IzabelaInput } from '@/modules/izabela/utils'
import { interpretMessage } from '@/modules/izabela/utils'
import { useSettingsStore } from '@/features/settings/store'
import { useDictionaryStore } from '@/features/dictionary/store'
import { io } from 'socket.io-client'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const dictionaryStore = useDictionaryStore()

const { addDefinition, removeDefinition, updateDefinition, findDefinition } = dictionaryStore

const socket = io(`ws://localhost:${import.meta.env.VITE_SERVER_WS_PORT}`, {})

const onMessage = async (inputData: InputType) => {
  console.log('Saying something:', inputData)

  let message: IzabelaMessagePayload | null = null
  if (inputData.type === 'IzabelaInput') {
    const inputMessage: IzabelaInput = inputData.input

    const speechEngine = speechStore.currentSpeechEngine
    const translationEngine = translationEngineManager.getEngineById(
      settingsStore.selectedTranslationEngine,
    )
    if (!speechEngine) return

    if (inputMessage.available) {
      const voice = speechEngine.getSelectedVoice()
      const voiceLanguageCode = speechEngine.getLanguageCode(voice)
      const translationOptions = translationEngine?.getTranslationOptions(voiceLanguageCode)
      const translatedMessage = settingsStore.enableTranslation && translationEngine ? 
        await translationEngine.translate(inputMessage.text, voiceLanguageCode) : null

      console.log('Translated message:', translatedMessage)

      message = {
        id: uuid(inputMessage.text, NIL),
        voice,
        message: inputMessage.text,
        originalMessage: inputMessage.text,
        translatedMessage,
        translatedFrom: translationOptions?.translateFrom || null,
        translatedTo: translationOptions?.translateTo || null,
        engine: speechEngine.id,
        credentials: speechEngine.getCredentials(),
        payload: speechEngine.getPayload({
          text: (settingsStore.enableTranslation ? (translatedMessage ? translatedMessage : inputMessage.text) : inputMessage.text),
          intonation: inputMessage.command,
          hasPhonemes: null,
          voice,
          translatedText: translatedMessage,
          dictionaryRules: []
        }),
        command: inputMessage.command,
        customCommand: speechStore.customCommands.find((e) => e.value === inputMessage.command),
      }
    }
  } else if (inputData.type === 'IzabelaMessage') {
    const inputMessage: IzabelaMessage = inputData.input

    const engine = speechEngineManager.getEngineById(inputMessage.engine)
    if (!engine) return

    message = {
      ...inputMessage,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        text: inputMessage.message,
        intonation: inputMessage.command,
        hasPhonemes: null,
        voice: inputMessage.voice,
        translatedText: inputMessage.translatedMessage,
        dictionaryRules: []
      }),
      command: inputMessage.command,
      customCommand: inputMessage.customCommand
    }
  } else {
    console.log('This message type is unhandled: ', inputData.type)
  }
  if (message) izabela.say(message)
}
const onAddDictionaryRule = async(jsonObj: any) => {
  if (typeof jsonObj.word === 'string' && typeof jsonObj.definition === 'string' && typeof jsonObj.hacked === 'boolean')
  {
    addDefinition([jsonObj.word, jsonObj.definition, jsonObj.hacked, jsonObj.reveal])
  }
}

const onUpdateDictionaryRule = async(jsonObj: any) => {
  if (typeof jsonObj.word === 'string' && typeof jsonObj.definition === 'string' && typeof jsonObj.hacked === 'boolean')
  {
    const index: number = findDefinition(jsonObj.word, jsonObj.hacked)
    if (index !== -1) {
      updateDefinition(index, [jsonObj.word, jsonObj.definition, jsonObj.hacked, jsonObj.reveal])
    }
  }
}

const onRemoveDictionaryRule = async(jsonObj: any) => {
  if (typeof jsonObj.word === 'string' && typeof jsonObj.hacked === 'boolean')
  {
    const index: number = findDefinition(jsonObj.word, jsonObj.hacked)
    if (index !== -1) {
      removeDefinition(index)
    }
  }
}

socket.on('say', (e) => {
  if (typeof e === 'string') {
    const inputMessage: IzabelaInput = interpretMessage(e, speechStore.engineCommands, speechStore.customCommands)
    if(inputMessage.available) {
      const inputData: InputType = {
        type: 'IzabelaInput',
        input: inputMessage
      }
      onMessage(inputData)
    }
  }
})
socket.on('add-dictionary-rule', (e) => {
  if (typeof e === 'object') onAddDictionaryRule(e)
})

socket.on('update-dictionary-rule', (e) => {
  if (typeof e === 'object') onUpdateDictionaryRule(e)
})

socket.on('remove-dictionary-rule', (e) => {
  if (typeof e === 'object') onRemoveDictionaryRule(e)
})

onIPCSay(onMessage)

onIPCCancelCurrentMessage(() => {
  izabela.endCurrentMessage()
})
onIPCCancelAllMessages(() => {
  izabela.endAllMessages()
})
</script>
