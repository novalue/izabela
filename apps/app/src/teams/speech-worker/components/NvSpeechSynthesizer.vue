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
import { interpretMessage } from '@/modules/izabela/utils'
import { useSettingsStore } from '@/features/settings/store'
import { useDictionaryStore } from '@/features/dictionary/store'
import { io } from 'socket.io-client'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const dictionaryStore = useDictionaryStore()

const { addDefinition, removeDefinition, updateDefinition, findDefinition } = dictionaryStore

const socket = io(`ws://localhost:${import.meta.env.VITE_SERVER_WS_PORT}`, {})

const onMessage = async (payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message: IzabelaMessagePayload | null = null
  if (typeof payload === 'string') {
    const speechEngine = speechStore.currentSpeechEngine
    const translationEngine = translationEngineManager.getEngineById(
      settingsStore.selectedTranslationEngine,
    )
    if (!speechEngine) return

    const voice = speechEngine.getSelectedVoice()
    const messageData = interpretMessage(payload, speechStore.engineCommands, speechStore.customCommands)
    if (messageData.available) {
      const voiceLanguageCode = speechEngine.getLanguageCode(voice)
      const translationOptions = translationEngine?.getTranslationOptions(voiceLanguageCode)
      const translatedMessage = settingsStore.enableTranslation && translationEngine ? 
        await translationEngine.translate(messageData.text, voiceLanguageCode) : null

      console.log('Translated message:', translatedMessage)

      message = {
        id: uuid(payload, NIL),
        voice,
        message: messageData.text,
        originalMessage: payload,
        translatedMessage,
        translatedFrom: translationOptions?.translateFrom || null,
        translatedTo: translationOptions?.translateTo || null,
        engine: speechEngine.id,
        credentials: speechEngine.getCredentials(),
        payload: speechEngine.getPayload({
          text: (settingsStore.enableTranslation ? (translatedMessage ? translatedMessage : messageData.text) : messageData.text),
          intonation: messageData.command,
          hasPhonemes: null,
          voice,
          translatedText: translatedMessage,
          dictionaryRules: []
        }),
        command: messageData.command,
        customCommand: speechStore.customCommands.find((e) => e.value === messageData.command),
      }
    }
  } else {
    const engine = speechEngineManager.getEngineById(payload.engine)
    if (!engine) return

    message = {
      ...payload,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        text: payload.message,
        intonation: payload.command,
        hasPhonemes: null,
        voice: payload.voice,
        translatedText: payload.translatedMessage,
        dictionaryRules: []
      }),
      command: payload.command,
      customCommand: payload.customCommand
    }
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
  if (typeof e === 'string') onMessage(e)
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
