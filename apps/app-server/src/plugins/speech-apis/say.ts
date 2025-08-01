import { RequestHandler } from 'express'
import say from 'say'
import { handleError } from '../../utils/requests'
import { WordBoundary, SpeechSynthesizerAnswer, getWordBoundaryType } from '../../utils/speech-apis/types'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'

const plugin: Izabela.Server.Plugin = ({ app, config }) => {
  const listVoicesHandler: RequestHandler = async (_, res) => {
    // @ts-ignore
    try {
      const voices = await new Promise((resolve, reject) => {
        ;(say as any).getInstalledVoices((err: any, apiVoices: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(apiVoices)
        })
      })
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        payload: { text, voice, speed = 1 },
      },
    },
    res,
  ) => {
    const outputFile = path.join(config?.tempPath || '', uuid() + '.wav')
    try {
      fs.mkdirSync(path.parse(outputFile).dir, { recursive: true })
      fs.writeFileSync(outputFile, '')

      await new Promise<SpeechSynthesizerAnswer>((resolve, reject) => {
        const answer: SpeechSynthesizerAnswer = { available : false, captions : [], audio: '', type : '', note: '' }

        say.export(text, voice, speed, outputFile, (error) => {
          if (error) {
            let errorResponse = {
              error : 503,
              message : error
            }
            reject(errorResponse)
          } else {
            let textOffset = 0
            let textMoment = 0

            answer.available = true

            const textSplit: string[] = text.split(' ')
            textSplit.forEach((word) => {
              let wordOffset = word.indexOf(text, textOffset)
              let wordDuration = (10 * 1000) * 450    // 450 ms
              let wordMoment = textMoment

              const wordBoundary: WordBoundary = {
                type: getWordBoundaryType(word),
                text: word,
                offset: wordOffset,
                length: word.length,
                duration: wordDuration,
                moment: wordMoment
              }
              answer.captions.push(wordBoundary)

              textOffset = wordOffset + word.length
              textMoment = wordMoment + wordDuration
            })

            answer.audio = fs.readFileSync(outputFile).toString('base64')
            fs.unlinkSync(outputFile)

            answer.type = 'audio/wav'

            resolve(answer)
          }
        })
      }).then((response) => {
        res.status(200).json(response)
      }).catch((error) => {
        res.status(503).json(error)
      })
    } catch (e: any) {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
      }
      return handleError(res, 'Internal server error', e.message, 500)
    }
  }

  app.get('/api/tts/say/list-voices', listVoicesHandler)
  app.post('/api/tts/say/list-voices', listVoicesHandler)
  app.post('/api/tts/say/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
