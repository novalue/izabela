import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { DictionaryRule } from '@/modules/speech-engine-manager/types'

export const useDictionaryStore = defineStore(
  'dictionary',
  () => {
    const enableDictionary = ref(true)
    const matchExactWord = ref(true)
    const caseSensitive = ref(false)
    const definitions = ref<[string, string, boolean, boolean][]>([
      ['wyd', 'what are you doing', false, false],
      ['hbu', 'how about you', false, false],
      ['afaik', 'as far as I know', false, false],
      ['b4', 'before', false, false],
      ['bc', 'because', false, false],
      ['bf', 'boyfriend', false, false],
      ['bff', 'best friends forever', false, false],
      ['brb', 'be right back', false, false],
      ['btw', 'by the way', false, false],
      ['dm', 'direct message', false, false],
      ['fb', 'facebook', false, false],
      ['ftw', 'for the win', false, false],
      ['g2g', 'got to go', false, false],
      ['gf', 'girlfriend', false, false],
      ['gg', 'good game', false, false],
      ['gtg', 'got to go', false, false],
      ['gtr', 'got to run', false, false],
      ['hmu', 'hit me up', false, false],
      ['idc', "I don't care", false, false],
      ['idk', "I don't know", false, false],
      ['ig', 'instagram', false, false],
      ['ikr', 'I know right', false, false],
      ['ily', 'I love you', false, false],
      ['imho', 'in my humble opinion', false, false],
      ['imo', 'in my opinion', false, false],
      ['irl', 'in real life', false, false],
      ['isp', 'internet service provider', false, false],
      ['jk', 'just kidding', false, false],
      ['l8', 'late', false, false],
      ['lmk', 'let me know', false, false],
      ['mfw', 'my face when', false, false],
      ['nsfw', 'not safe for work', false, false],
      ['nvm', 'nevermind', false, false],
      ['oan', 'on another note', false, false],
      ['omg', 'oh my god', false, false],
      ['omw', 'on my way', false, false],
      ['sfw', 'safe for work', false, false],
      ['smh', 'shake my head', false, false],
      ['tbh', 'to be honest', false, false],
      ['thx', 'thanks', false, false],
      ['til', 'today I learned', false, false],
      ['tl;dr', "too long; didn't read", false, false],
      ['ttyl', 'talk to you later', false, false],
      ['ttyn', 'talk to you never', false, false],
      ['ttys', 'talk to you soon', false, false],
      ['txt', 'text', false, false],
      ['w/e', 'whatever', false, false],
      ['w/u', 'with you', false, false],
      ['wbu', 'what about you', false, false],
      ['wdym', 'what do you mean', false, false],
      ['yolo', 'you only live once', false, false],
      ['ysk', 'you should know', false, false],
      ['yt', 'YouTube', false, false],
    ])
    
    const translateText = (text: string) => {
      if (!enableDictionary.value) return text
      const flags = caseSensitive.value ? 'g' : 'gi';

      let newText = text
      definitions.value.slice().reverse().forEach(([word, definition]) => {
        const filterWord = word.replaceAll(/([^\s\w])/g, '\\$1')
        newText = newText.replaceAll(new RegExp(`((?<r1>[^\\w]|[_]|(?=^${filterWord}(\\W+|$))))(${filterWord})(?=\\k<r1>(?<![<[({])|\\s|[:,.?!']|(?<=\\<${filterWord})\\>|(?<=\\(${filterWord})\\)|(?<=\\[${filterWord})\\]|(?<=\\{${filterWord})\\}|$)`, flags), `$1${definition}`)
      })

      return newText
    }

    const elaborateRules = (text: string) => {
      const dictionaryRules: Array<DictionaryRule> = []
      if (!enableDictionary.value) return dictionaryRules

      const flags = caseSensitive.value ? 'g' : 'gi';

      let input = text;
      definitions.value.slice().reverse().forEach(([word, definition, hacked, reveal]) => {
        const transform: DictionaryRule = {
          keyword: definition,
          replace: word,
          hacked: hacked ?? false,
          reveal: reveal ?? false,
          indices: []
        }

        let currentIndexOffset = 0;
        let previousIndexEnd = 0;

        const filterWord = word.replaceAll(/([^\s\w])/gi, '\\$1')
        const rex = new RegExp(`((?<r1>[^\\w]|[_]|(?=^${filterWord}(\\W+|$))))(${filterWord})(?=\\k<r1>(?<![<[({])|\\s|[:,.?!']|(?<=\\<${filterWord})\\>|(?<=\\(${filterWord})\\)|(?<=\\[${filterWord})\\]|(?<=\\{${filterWord})\\}|$)`, 'gi')
        while (rex.test(input))
        {
          currentIndexOffset += (rex.lastIndex - word.length - previousIndexEnd)
          transform.indices.push(currentIndexOffset);

          const gap = (definition.length - word.length);
          for (let t = 0; t < dictionaryRules.length; t += 1)
          {
            const rule = dictionaryRules[t];
            for (let i = 0; i < rule.indices.length; i += 1)
            {
              if (rule.indices[i] > currentIndexOffset)
              {
                rule.indices[i] += gap;
              }
            }
          }

          currentIndexOffset += definition.length;
          previousIndexEnd = rex.lastIndex;
        }

        if (transform.indices.length > 0)
        {
          input = input.replaceAll(new RegExp(`((?<r1>[^\\w]|[_]|(?=^${filterWord}(\\W+|$))))(${filterWord})(?=\\k<r1>(?<![<[({])|\\s|[:,.?!']|(?<=\\<${filterWord})\\>|(?<=\\(${filterWord})\\)|(?<=\\[${filterWord})\\]|(?<=\\{${filterWord})\\}|$)`, flags), `$1${definition}`)
          dictionaryRules.push(transform);
        }
      })
      return dictionaryRules
    }

    return {
      enableDictionary,
      matchExactWord,
      caseSensitive,
      definitions,
      translateText,
      elaborateRules,
      updateDefinition: (index: number, definition: [string, string, boolean, boolean]) => {
        definitions.value.splice(index, 1, definition)
      },
      addDefinition: (definition: (typeof definitions)['value'][number] = ['', '', false, false]) => {
        definitions.value.unshift(definition)
      },
      removeDefinition: (index: number) => {
        definitions.value.splice(index, 1)
      },
      findDefinition: (word: string, hacked: boolean) => {
        for(let i = definitions.value.length - 1; i >= 0; i -= 1)
        {
          const definition = definitions.value[i];
          if (definition[0].trim().toLowerCase() === word.trim().toLowerCase() && (definition[2] === hacked || definition[2] === undefined))
          {
            return i;
          }
        }
        return -1;
      }
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
