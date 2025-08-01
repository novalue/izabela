import { RequestHandler } from 'express'
import { handleError } from '../../utils/requests'
import { ElevenLabsClient } from 'elevenlabs'
import { WordBoundary, SpeechSynthesizerAnswer } from '../../utils/speech-apis/types'

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
      const client = new ElevenLabsClient({ apiKey })
      const { voices } = await client.voices.getAll({
        show_legacy: true,
      })
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const listModelsHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
      },
    },
    res,
  ) => {
    try {
      const client = new ElevenLabsClient({ apiKey })
      const models = await client.models.getAll()
      res.status(200).json(models)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { apiKey },
        payload: {
          text,
          voice,
          stability,
          similarity_boost,
          use_speaker_boost,
          style,
          model_id,
        },
        includeTimestamps,
      },
    },
    res,
  ) => {
    try {
      const client = new ElevenLabsClient({ apiKey })
      const payload = {
        text,
        model_id,
        voice_settings: {
          stability,
          similarity_boost,
          use_speaker_boost,
          style,
        },
      }
      /*
      if (includeTimestamps) {
        const response = await client.textToSpeech.streamWithTimestamps(
          voice.voice_id,
          payload,
        )
        let index = 0
        for await (const item of response) {
          const { audio_base64, alignment, normalized_alignment } = item
          if (index === 0) {
            res.setHeader(
              'Data',
              JSON.stringify({
                timestamps: {
                  alignment,
                  normalized_alignment,
                },
              }),
            )
          }
          index++

          res.write(Buffer.from(audio_base64, 'base64'))
        }
        return res.end()
      }
      */

      const stream = await client.textToSpeech.convertAsStream(
        voice.voice_id,
        payload,
      )

      let audioBuffer : Buffer
      const audioChunks: Uint8Array[] = []
    
      // 'readable' may be triggered multiple times as data is buffered in
      stream.on('readable', () => {
        let chunk;
        while (null !== (chunk = stream.read())) {
          if (chunk instanceof Buffer) {
            audioChunks.push(new Uint8Array(chunk as Buffer))
          }
        }
      });

      // 'end' will be triggered once when there is no more data available
      stream.on('end', () => {
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

      stream.pipe(res)
      stream.on('finish', () => {})
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  app.post('/api/tts/elevenlabs/list-voices', listVoicesHandler)
  app.post('/api/tts/elevenlabs/list-models', listModelsHandler)
  app.post('/api/tts/elevenlabs/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
