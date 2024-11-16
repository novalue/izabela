<script lang="ts" setup>
import { v5 as uuid, NIL } from 'uuid'
import izabela from '@/modules/izabela'
import type { IzabelaMessage } from '@/modules/izabela/types'
import {
  onIPCCancelAllMessages,
  onIPCCancelCurrentMessage,
  onIPCSay,
} from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { getEngineById } from '@/modules/speech-engine-manager'
import {
  getCleanMessage,
  getMessageCommand,
  removeCommandFromMessage,
} from '@/modules/izabela/utils'
import { useSettingsStore } from '@/features/settings/store'
import { useDictionaryStore } from '@/features/dictionary/store'
import { io } from 'socket.io-client'


const { ElectronTranslation } = window
const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const dictionaryStore = useDictionaryStore()

const { addDefinition, removeDefinition, updateDefinition, findDefinition } = dictionaryStore

const socket = io(`ws://localhost:${import.meta.env.VITE_SERVER_WS_PORT}`, {})
const onMessage = async (payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message = null
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    const voice = engine.getSelectedVoice()
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload, engineCommands)
    const translatedMessage = settingsStore.enableTranslation
      ? await ElectronTranslation.translate(removeCommandFromMessage(payload), {
          from: settingsStore.textInputLanguage || undefined,
          to: settingsStore.textOutputLanguage || engine.getLanguageCode(voice),
        })
      : null
    console.log('Translated message:', translatedMessage)

    message = {
      id: uuid(payload, NIL),
      voice,
      message: cleanMessage,
      originalMessage: payload,
      translatedMessage,
      translatedFrom: settingsStore.textInputLanguage,
      translatedTo: settingsStore.textOutputLanguage,
      engine: engine.id,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        text: cleanMessage,
        intonation: null,
        hasPhonemes: null,
        voice,
        translatedText: translatedMessage,
        dictionaryRules: []
      }),
      command: getMessageCommand(payload),
    }
  } else {
    const engine = getEngineById(payload.engine)
    if (!engine) return
    const { voice } = payload
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload.message, engineCommands)
    message = {
      ...payload,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        text: cleanMessage,
        intonation: null,
        hasPhonemes: null,
        voice,
        translatedText: payload.translatedMessage,
        dictionaryRules: []
      }),
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
