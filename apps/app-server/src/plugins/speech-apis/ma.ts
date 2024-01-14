import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '@/utils/requests'
import { WordBoundary, SpeechSynthesizerAnswer } from '@/utils/speech-apis/types'

import {
  PropertyId,
  SpeechConfig,
  SpeechSynthesisOutputFormat,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, region },
      },
    },
    res,
  ) => {
    try {
      const endpoint = `https://${region}.tts.speech.${
        region.startsWith('china') ? 'azure.cn' : 'microsoft.com'
      }/cognitiveservices/voices/list`
      const { data: voices } = await axios.get(endpoint, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
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
        credentials: { apiKey, region },
        payload,
      },
    },
    res,
  ) => {
    try {
      const speechConfig = SpeechConfig.fromSubscription(apiKey, region)
      speechConfig.speechSynthesisLanguage = payload.voice.Locale
      speechConfig.speechSynthesisVoiceName = payload.voice.ShortName
      speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3
      speechConfig.setProperty(PropertyId.SpeechServiceResponse_RequestWordBoundary, "true")
	  
      const synthesizer = new SpeechSynthesizer(speechConfig)

      await new Promise<SpeechSynthesizerAnswer>((resolve, reject) => {
        const answer: SpeechSynthesizerAnswer = { caption: [], audio: '', note: '' }

        synthesizer.wordBoundary = function(_, event) {
          const wordBoundary: WordBoundary = {
            type: event.boundaryType,
            text: event.text,
            offset: event.textOffset,
            length: event.wordLength,
            duration: event.duration,
            moment: event.audioOffset
          }
          answer.caption.push(wordBoundary)
        }

        if (payload.ssml) {
          synthesizer.speakSsmlAsync(
            payload.ssml,
            (result) => {
              answer.audio = Buffer.from(result.audioData).toString('base64')
              resolve(answer)
              synthesizer.close()
            },
            (error) => {
              answer.note = error
              reject(answer)
              synthesizer.close()
            },
          )
        } else {
          synthesizer.speakTextAsync(
            payload.text,
            (result) => {
              answer.audio = Buffer.from(result.audioData).toString('base64')
              resolve(answer)
              synthesizer.close()
            },
            (error) => {
              answer.note = error
              reject(answer)
              synthesizer.close()
            },
          )
        }
      }).then((response) => {
          res.status(200).json(response)
      }).catch((error) => {
        res.status(503).json(error)
      })
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/microsoft-azure/list-voices', listVoicesHandler)
  app.post('/api/tts/microsoft-azure/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
