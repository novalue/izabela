import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import OpenAI from 'openai'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
      },
    },
    res,
  ) => {
    try {
      res
        .status(200)
        .json([
          'alloy',
          'ash',
          'ballad',
          'coral',
          'echo',
          'fable',
          'onyx',
          'nova',
          'sage',
          'shimmer',
          'verse',
        ])
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
        payload: { input, voice, instructions, userInstructions },
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      const openai = new OpenAI({ apiKey })

      const concatenatedInstructions = [
        instructions && `Follow these default instructions: "${instructions}"`,
        userInstructions &&
          `Follow these user provided instructions: "${userInstructions}"`,
      ]
        .filter(Boolean)
        .join('. ')
      const mp3 = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice,
        input,
        instructions: concatenatedInstructions,
        response_format: 'mp3',
      })

      const arrayBuffer = await mp3.arrayBuffer();

      let response = {
        available : true,
        captions : [],
        audio : Buffer.from(arrayBuffer).toString('base64'),
        type : 'audio/mp3'
      }

      res.status(200).json(response)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  app.post('/api/tts/openai/list-voices', listVoicesHandler)
  app.post('/api/tts/openai/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
