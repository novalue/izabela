import { RequestHandler } from 'express'
import TextToSpeechV1 from 'ibm-watson/text-to-speech/v1'
import { IamAuthenticator, IamTokenManager } from 'ibm-watson/auth'
import { handleError } from '../../utils/requests'
import WebSocket from 'ws'
import { WordBoundary, SpeechSynthesizerAnswer } from '../../utils/speech-apis/types'

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, url },
      },
    },
    res,
  ) => {
    try {
      const textToSpeech = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: apiKey,
        }),
        serviceUrl: url,
      })
      const {
        result: { voices },
      } = await textToSpeech.listVoices()
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey, url },
        payload
      },
    },
    res,
  ) => {
    try {
      /*let includeTimestamps = false
      if (includeTimestamps) {
        const tokenManager = new IamTokenManager({ apikey: apiKey || '' })
        const accessToken = await tokenManager.getToken()
        const sanitizedUrl = url.replace(/^(http[s]?:\/\/)/, '')
        const wsURI = `wss://${sanitizedUrl}/v1/synthesize?voice=${payload.voice}&rate_percentage=${payload.ratePercentage}&pitch_percentage=${payload.pitchPercentage}`
        const websocket = new WebSocket(wsURI, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const audioChunks: any[] = []
        const timestamps: any[] = []

        await new Promise<void>((resolve, reject) => {
          websocket.onopen = function () {
            const message = {
              text: payload.text,
              accept: 'audio/mpeg',
              timings: ['words'],
            }
            websocket.send(JSON.stringify(message))
          }

          websocket.onmessage = function (e: any) {
            if (typeof e.data === 'string') {
              const data = JSON.parse(e.data)
              if (data.words) timestamps.push(data.words.flat(1))
            } else {
              const chunk = Buffer.from(e.data, 'binary')
              audioChunks.push(chunk)
            }
          }

          websocket.onclose = function () {
            resolve()
          }

          websocket.onerror = function () {
            reject()
          }
        })

        res.setHeader(
          'Data',
          JSON.stringify({
            timestamps,
          }),
        )
        res.write(Buffer.concat(audioChunks))
        return res.end()
      }
      */

      const textToSpeech = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: apiKey,
        }),
        serviceUrl: url,
      })
      const { result } = await textToSpeech.synthesize({
        ...payload,
        accept: 'audio/mpeg',
      })

      let audioBuffer : Buffer
      const audioChunks: Uint8Array[] = []

      // 'readable' may be triggered multiple times as data is buffered in
      result.on('readable', () => {
        let chunk;
        while (null !== (chunk = result.read())) {
          if (chunk instanceof Buffer) {
            audioChunks.push(new Uint8Array(chunk as Buffer))
          }
        }
      });

      // 'end' will be triggered once when there is no more data available
      result.on('end', () => {
        audioBuffer = Buffer.concat(audioChunks)

        if (audioBuffer.length > 0) {
          const answer: SpeechSynthesizerAnswer = { 
            available : true, 
            captions : [], 
            audio : Buffer.from(audioBuffer).toString('base64'), 
            type : 'audio/mp3', 
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
      }); 

      const stream = result.pipe(res)
      stream.on('finish', () => {})
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/ibm-watson/list-voices', listVoicesHandler)
  app.post('/api/tts/ibm-watson/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
