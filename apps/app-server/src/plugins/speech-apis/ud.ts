import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import axios, { AxiosResponse } from 'axios'
import { Readable } from 'stream'
import { WordBoundary, SpeechSynthesizerAnswer } from '../../utils/speech-apis/types'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
  const listVoicesHandler: RequestHandler = async (
    { body: { payload: { mode } = { mode: 'tts-all' } } },
    res,
  ) => {
    try {
      const { data: voices }: AxiosResponse = await axios({
        url: 'https://api.uberduck.ai/voices',
        method: 'GET',
        params: {
          mode,
        },
      })
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { publicKey, privateKey },
        payload,
      },
    },
    res,
  ) => {
    try {
      const { data }: AxiosResponse<ArrayBuffer> = await axios({
        url: 'https://api.uberduck.ai/speak-synchronous',
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${publicKey}:${privateKey}`,
          ).toString('base64')}`,
        },
        data: payload,
        responseType: 'arraybuffer',
      })

      if (data.byteLength > 0) {
        const answer: SpeechSynthesizerAnswer = { 
          available : true, 
          captions : [], 
          audio : Buffer.from(data).toString('base64'), 
          type : 'audio/mp3', 
          note : '' 
        }

        res.status(200).json(answer)
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
  app.post('/api/tts/uberduck/list-voices', listVoicesHandler)
  app.post('/api/tts/uberduck/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
