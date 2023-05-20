import { SpeechEngine } from '@/modules/speech-engine-manager/types'

export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export type IzabelaWordBoundary = {
  type: string
  text: string
  offset: number
  length: number
  duration: number
  moment: number
}

export interface IzabelaMessage {
  id?: string
  message: string
  originalMessage: string
  translatedMessage: string | null
  translatedFrom: string | null
  translatedTo: string | null
  command: string | null
  engine: SpeechEngine['id']
  voice: any
  excludeFromHistory?: boolean
  disableAutoplay?: boolean
}

export interface IzabelaMessagePayload extends IzabelaMessage {
  credentials: {
    [key: string]: any
  }
  payload: {
    [key: string]: any
  }
}

export interface IzabelaHistoryMessage extends Omit<IzabelaMessagePayload, 'credentials'> {
  id: string
  createdAt: string
}
