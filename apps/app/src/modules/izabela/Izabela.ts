import { IzabelaMessagePayload } from '@/modules/izabela/types'
import { socket } from '@/services'
import IzabelaMessage from './IzabelaMessage'

export default () => {
  let currentlyPlayingMessage: ReturnType<typeof IzabelaMessage> | null = null

  let messageQueue: ReturnType<typeof IzabelaMessage>[] = []

  function clearQueue() {
    if (messageQueue.length > 0) {
      messageQueue = []
    }
  }

  function onMessageEnd() {
    playNextMessage()
  }

  function endCurrentMessage() {
    currentlyPlayingMessage?.cancel()
  }

  function endAllMessages() {
    clearQueue()
    endCurrentMessage()
  }

  function playMessage(message: ReturnType<typeof IzabelaMessage>) {
    currentlyPlayingMessage = message

    socket.emit('message:load', message.getSocketPayload())
    
    const onEnd = (hasError?: boolean) => {
      if (hasError) socket.emit('message:error', message.getSocketPayload())
      socket.emit('message:end', message.getSocketPayload())
      onMessageEnd()
    }

    message.isReady()
      .then(() => {
        socket.emit('message:caption', message.getCaption());

        message.on('ended', () => onEnd())
        message.on('error', () => onEnd(true))
        return message.play().then(() => { 
          socket.emit('message:start', message.getSocketPayload())
        })
        .catch(console.error)
      })
      .catch(() => onEnd(true))
    return message
  }

  function playNextMessage() {
    currentlyPlayingMessage = null;
    if (messageQueue.length > 0) {
      playMessage(messageQueue[0])
      messageQueue.splice(0, 1)
    }
  }

  function createMessage(messagePayload: IzabelaMessagePayload) {
    return IzabelaMessage(messagePayload)
  }

  function queueMessage(message: ReturnType<typeof IzabelaMessage>) {
    messageQueue.push(message)
    return message
  }

  function say(messagePayload: IzabelaMessagePayload): ReturnType<typeof IzabelaMessage> {
    const message = createMessage(messagePayload)
    if (currentlyPlayingMessage) {
      return queueMessage(message)
    }
    return playMessage(message)
  }

  return {
    say,
    endCurrentMessage,
    endAllMessages,
  }
}
