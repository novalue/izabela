import { RequestHandler } from 'express'
import {
  DescribeVoicesCommand,
  Polly,
  SynthesizeSpeechCommand,
} from '@aws-sdk/client-polly'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { handleError } from '../../utils/requests'
import { Readable } from 'stream'
import { WordBoundary, SpeechSynthesizerAnswer } from '../../utils/speech-apis/types'

function parseSpeechMarks(stream: Readable): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const result: any[] = []

    stream.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) result.push(JSON.parse(line))
      }
    })

    stream.on('end', () => resolve(result))
    stream.on('error', reject)
  })
}

const plugin: Izabela.Server.Plugin = ({ app }) => {
  const listVoicesHandler: RequestHandler = async (
    {
      body: {
        credentials: { identityPoolId, region },
      },
    },
    res,
  ) => {
    try {
      const client = new Polly({
        region,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: identityPoolId,
        }),
      })
      const command = new DescribeVoicesCommand({})
      const { Voices: voices } = await client.send(command)
      res.status(200).json(voices)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }

  const synthesizeSpeechHandler: RequestHandler = async (
    {
      body: {
        credentials: { identityPoolId, region },
        payload
      },
    },
    res,
  ) => {
    try {
      let timestamps: any[] = []
      const client = new Polly({
        region,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: identityPoolId,
        }),
      })

      const [audioRes, markRes] = await Promise.all(
        [
          client.send(
            new SynthesizeSpeechCommand({
              ...payload,
              OutputFormat: 'mp3',
            }),
          ),
          client.send(
            new SynthesizeSpeechCommand({
              ...payload,
              SpeechMarkTypes: ['word'],
              OutputFormat: 'json',
            }),
          ),
        ].filter(Boolean),
      )

      if (markRes) {
        timestamps = await parseSpeechMarks((markRes.AudioStream as any)!)
      }

      if (audioRes) {
        const answer: SpeechSynthesizerAnswer = { 
          available : true, 
          captions : [], 
          audio : Buffer.from(audioRes.AudioStream as Blob).toString('base64'), 
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
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  }
  app.post('/api/tts/amazon-polly/list-voices', listVoicesHandler)
  app.post('/api/tts/amazon-polly/synthesize-speech', synthesizeSpeechHandler)
}

export default plugin
