import { v4 as uuid } from 'uuid'
import { Buffer } from 'buffer'
import mitt from 'mitt'
import { Promise } from 'bluebird'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import { Deferred } from '@packages/toolbox'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import hash from 'object-hash'
import { IzabelaWordBoundary, IzabelaMessageEvent, IzabelaMessagePayload } from './types'

type AudioResponse = {
  available : boolean,
  captions : IzabelaWordBoundary[],
  audio : string,
  type : string
}

export default (messagePayload: IzabelaMessagePayload) => {
  const {
    id: existingId,
    engine: engineName,
    excludeFromHistory,
    disableAutoplay,
    credentials,
    payload,
  } = messagePayload

  const id = existingId || uuid()
  const caption: IzabelaWordBoundary[] = []
  const audio = new Audio()
  const emitter = mitt()
  const audioDownloaded = Deferred()
  const captionLoaded = Deferred()
  const audioLoaded = Deferred()
  const playingMessageStore = usePlayingMessageStore()
  let audioElements: (HTMLAudioElement | null)[] = []
  let cancelled = false
  if (!excludeFromHistory) {
    const messageStore = useMessagesStore()
    messageStore.$whenReady().then(() => {
      messageStore.addToHistory(id, messagePayload)
    })
  }

  function getEngine() {
    return getEngineById(engineName)
  }

  function getCacheId() {
    const engine = getEngine()
    const useCacheOnEveryRequest = !!engine?.getUseCacheOnEveryRequest()
    return `${useCacheOnEveryRequest ? 'cache' : id}-${hash(payload)}`
  }

  function on(
    event: IzabelaMessageEvent,
    callback: (...args: any[]) => void,
  ): void {
    emitter.on(event, callback)
  }

  function pause() {
    audio.pause()
  }

  function resume() {
    audio.play()
  }

  function cancel() {
    cancelled = true
    audio.pause()
    audioElements.forEach((audioEl) => audioEl?.pause())
    playingMessageStore.$patch({
      id: null,
      isPlaying: false,
      progress: 0,
    })
    emitter.emit('ended')
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  async function prepareAudioElements() {
    const settingsStore = useSettingsStore()
    return settingsStore
      .$whenReady()
      .then(() => {
        return Promise.map(
          settingsStore.audioOutputs,
          async (deviceLabel: string) => {
            try {
              let mediaDevice = await getMediaDeviceByLabel(deviceLabel)
              if (mediaDevice) {
                const audioElement: any = document.createElement('audio')
                await audioElement.setSinkId(mediaDevice.deviceId)
                return audioElement
              }
            } catch (error) {
              console.error(error)
            }
            return null
          },
        )
      })
      .then((resolvedAudioElements) => {
        audioElements = resolvedAudioElements
        return audioElements
      })
  }

  async function play() {
    const settingsStore = useSettingsStore()
    return settingsStore
      .$whenReady()
      .then(() => {
        if (cancelled) return
        if (!settingsStore.playSpeechOnDefaultPlaybackDevice) {
          audio.volume = 0
        }
        audio.play()
        audioElements.forEach((audioEl) => audioEl && audioEl.play())
      })
      .catch(console.error)
  }

  function isReady() {
    return Promise.all([audioDownloaded.promise, captionLoaded.promise, audioLoaded.promise])
  }

  async function downloadAudio(): Promise<AudioResponse> {
    if (typeof window) {
      const { ElectronFilesystem } = window

      const cachedAudio = await ElectronFilesystem.getCachedAudio(getCacheId())
      if (cachedAudio) {
        const data : AudioResponse = JSON.parse(cachedAudio);
        if (data) {
          audioDownloaded.resolve(true)
          return Promise.resolve(data)
        }
      }
    }

    const engine = getEngine()
    if (!engine) return Promise.reject(new Error('Izabela Message: Selected engine was not found'))

    return engine.synthesizeSpeech({
      credentials,
      payload
    }).then(async (resource) => {
      audioDownloaded.resolve(true)

      let audioResponse : AudioResponse = {
        available : false,
        captions : [],
        audio : '',
        type : 'audio/mp3'
      }

      if (resource.status === 200) {
        let jsonData = await resource.json()
        
        audioResponse = {
          available : jsonData.available,
          captions : jsonData.captions,
          audio : jsonData.audio,
          type : jsonData.type
        }

        cacheAudio(audioResponse)
      }

      return Promise.resolve(audioResponse)
    }).catch(async (error) => {
      if (error instanceof Response) {
        let jsonData = await error.json()
        try {
          return Promise.reject(new Error(jsonData.message))
        } catch {
          return Promise.reject(new Error(JSON.stringify(jsonData)))
        }
      }
      return Promise.reject(new Error(JSON.stringify(error)))
    })
  }

  async function cacheAudio(resource: AudioResponse) {
    if (typeof window !== 'undefined') {
      const { ElectronFilesystem } = window

      ElectronFilesystem.cacheAudio(getCacheId(), JSON.stringify(resource))
    }
  }

  function loadCaption(resource: AudioResponse) {
    
    resource.captions.forEach((item) => {
      caption.push(item)
    })

    captionLoaded.resolve(true)
  }

  async function loadAudio(resource: AudioResponse, audioEls = audioElements) {
    if (!resource || !resource.available) return;

    const rawAudioData = Buffer.from(resource.audio, "base64")
    const audioBuffer : ArrayBufferLike = rawAudioData.buffer.slice(rawAudioData.byteOffset, rawAudioData.byteOffset + rawAudioData.byteLength)
    
    let blobSource : ArrayBuffer = new ArrayBuffer();
    if (audioBuffer instanceof ArrayBuffer) {
      blobSource = audioBuffer
    } else if (audioBuffer instanceof SharedArrayBuffer) {
      blobSource = new ArrayBuffer(audioBuffer.byteLength)
      new Uint8Array(blobSource).set(new Uint8Array(audioBuffer))
    } else {
      return;
    }

    const audioData = new Blob(
      [blobSource], 
      {
        type: resource.type,
      }
    )
    audio.src = URL.createObjectURL(audioData)
    audio.load()

    for (const audioElement of audioEls) {
      if (!audioElement) continue
      audioElement.src = audio.src
      audioElement.load()
    }
  }

  function getCaption() {
    return caption
  }

  function getAudioProgress() {
    return audio.currentTime / audio.duration || 0
  }

  function addEventListeners() {
    audio.addEventListener('timeupdate', () => {
      if (cancelled) return
      emitter.emit('timeupdate', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        progress: getAudioProgress(),
      })
      playingMessageStore.$patch({
        progress: getAudioProgress(),
      })
    })
    audio.addEventListener('ended', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        id: null,
        isPlaying: false,
        progress: 0,
      })
    })
    audio.addEventListener('play', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        id,
        isPlaying: true,
      })
    })
    audio.addEventListener('pause', () => {
      if (cancelled) return
      playingMessageStore.$patch({
        id,
        isPlaying: false,
      })
    })
    audio.addEventListener('canplaythrough', () => {
      emitter.emit('canplaythrough')
      audioLoaded.resolve(true)
    })
    audio.addEventListener('started', () => emitter.emit('started'))
    audio.addEventListener('ended', () => emitter.emit('ended'))
    audio.addEventListener('error', (e) => onError(e))
  }

  function onError(e: ErrorEvent) {
    emitter.emit('error')
    audioDownloaded.reject(e)
    captionLoaded.reject(e)
    audioLoaded.reject(e)
  }

  function prepare() {
    addEventListeners()

    // Fetch both at the same time for efficiency
    Promise.all([downloadAudio(), prepareAudioElements()])
      .then(([resource, audioEls]) => {
        loadCaption(resource)
        loadAudio(resource, audioEls)
        
      })
      .catch((reason) => onError(reason))
  }

  if (!disableAutoplay) {
    prepare()
  }

  return {
    id,
    isReady,
    play,
    on,
    getCaption,
    downloadAudio,
    pause,
    resume,
    cancel,
    togglePlay,
    getSocketPayload: () => {
      const { credentials: _, ...rest } = messagePayload
      return {
        ...rest,
        id,
        timestamp: new Date().toISOString(),
        cancelled
      }
    },
  }
}
