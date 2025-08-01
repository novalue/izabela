import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '../../utils/requests'
import { Readable } from 'stream'
import { WordBoundary, SpeechSynthesizerAnswer } from '../../utils/speech-apis/types'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
      },
    },
    res,
  ) => {
    try {
      const {
        data: { voices },
      } = await axios.get(
        `https://texttospeech.googleapis.com/v1beta1/voices?key=${apiKey}`,
      )
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: (stream?: boolean) => RequestHandler = (
    streamAudio,
  ) => {
    return async (
      {
        body: {
          credentials: { apiKey },
          payload,
        },
      },
      res,
    ) => {
      try {
        const {
          data: { audioContent },
        } = await axios.post(
          `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
          {
            ...payload,
            audioConfig: {
              ...payload.audioConfig,

              audioEncoding: streamAudio ? 'MP3' : 'LINEAR16',
            },
          },
        )

        if (audioContent) {
          const answer: SpeechSynthesizerAnswer = { 
            available : true, 
            captions : [], 
            audio : audioContent, 
            type : streamAudio ? 'audio/mp3' : 'audio/wav', 
            note : '' 
          }

          res.status(200).json(answer);
        } else {
          let errorResponse = {
            error : 503,
            message: "Could not synthesize the message."
          }

          res.status(503).json(errorResponse);
        }
      } catch (e: any) {
        handleError(res, 'Internal server error', e.message, 500)
      }
    }
  }
  app.post('/api/tts/google-cloud/list-voices', listVoicesHandler)
  app.post('/api/tts/google-cloud/synthesize-speech', synthesizeSpeechHandler())
}

export default plugin
