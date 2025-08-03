import { SpeechCommand } from '@/features/speech/types'

const getMessageCommand = (message: string) => {
  const command = message.split(' ')[0]
  if (command.startsWith('/')) return command.replace('/', '')
  return null
}

export const interpretMessage = (message: string, engineCommands: SpeechCommand[], customCommands: SpeechCommand[]) => {
  const result = {
    available: true,
    text: '',
    command: '',
    isCustom: false
  }

  const command = getMessageCommand(message)
  if (command) {
    if (engineCommands.find((refCommand) => refCommand.value === command)) {
      result.command = command
    } else if (customCommands.find((refCommand) => refCommand.value === command)) {
      result.command = command
      result.isCustom = true
    } else {
      result.available = false
    }

    // sizeof ('/') + sizeof (' ') = 2
    result.text = message.substring(command.length + 2)
  } else {
    result.text = message
  }

  return result
}