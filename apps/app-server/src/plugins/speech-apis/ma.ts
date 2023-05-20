import { RequestHandler } from 'express'
import axios from 'axios'
import { handleError } from '@/utils/requests'
import { WordBoundary, SpeechSynthesizerAnswer } from '@/utils/speech-apis/types'
import path from 'path'
import izabelaServer from '@/server'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import {
  AudioConfig,
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
    const outputFile = path.join(
      izabelaServer.getConfig().tempPath,
      uuid() + '.mp3',
    )
    try {
      fs.mkdirSync(path.parse(outputFile).dir, { recursive: true })
      fs.writeFileSync(outputFile, '')

      const speechConfig = SpeechConfig.fromSubscription(apiKey, region)
      speechConfig.speechSynthesisLanguage = payload.voice.Locale
      speechConfig.speechSynthesisVoiceName = payload.voice.ShortName
      speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3
      speechConfig.setProperty(PropertyId.SpeechServiceResponse_RequestWordBoundary, "true")
	  
      const audioConfig = AudioConfig.fromAudioFileOutput(outputFile)
      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)

      const speechSynthesizerContent: SpeechSynthesizerAnswer = await new Promise<SpeechSynthesizerAnswer>((resolve, reject) => {
        const answer: SpeechSynthesizerAnswer = {
          caption: [],
          audio: ''
        }

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
              try {
                fs.writeFileSync(outputFile, Buffer.from(result.audioData))
                answer.audio = fs.readFileSync(outputFile).toString('base64')
                fs.unlinkSync(outputFile)
              } catch(_) {}

              resolve(answer)
              synthesizer.close()
            },
            (error) => {
              reject(error)
              synthesizer.close()
            },
          )
        } else {
          synthesizer.speakTextAsync(
            payload.text,
            (result) => {
              try {
                fs.writeFileSync(outputFile, Buffer.from(result.audioData))
                answer.audio = fs.readFileSync(outputFile).toString('base64')
                fs.unlinkSync(outputFile)
              } catch(_) {}

              resolve(answer)
              synthesizer.close()
            },
            (error) => {
              reject(error)
              synthesizer.close()
            },
          )
        }
      }).catch(() => {
        const answer : SpeechSynthesizerAnswer = {caption: [], audio: ''}
        try {
          answer.audio = fs.readFileSync(outputFile).toString('base64')
          fs.unlinkSync(outputFile)
        } catch(_) {}
        return answer
      })

      res.status(200).json(speechSynthesizerContent)
    } catch (e: any) {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
      }
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/microsoft-azure/list-voices', listVoicesHandler)
  app.post(
    '/api/tts/microsoft-azure/synthesize-speech',
    synthesizeSpeechHandler,
  )
}

export default plugin
