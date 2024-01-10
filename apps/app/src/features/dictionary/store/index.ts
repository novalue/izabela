import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { DictionaryRule } from '@/modules/speech-engine-manager/types'

export const useDictionaryStore = defineStore(
  'dictionary',
  () => {
    const enableDictionary = ref(true)
    const matchExactWord = ref(true)
    const caseSensitive = ref(false)
    const definitions = ref<[string, string, boolean][]>([
      ['wyd', 'what are you doing', false],
      ['hbu', 'how about you', false],
      ['afaik', 'as far as I know', false],
      ['b4', 'before', false],
      ['bc', 'because', false],
      ['bf', 'boyfriend', false],
      ['bff', 'best friends forever', false],
      ['brb', 'be right back', false],
      ['btw', 'by the way', false],
      ['dm', 'direct message', false],
      ['fb', 'facebook', false],
      ['ftw', 'for the win', false],
      ['g2g', 'got to go', false],
      ['gf', 'girlfriend', false],
      ['gg', 'good game', false],
      ['gtg', 'got to go', false],
      ['gtr', 'got to run', false],
      ['hmu', 'hit me up', false],
      ['idc', "I don't care", false],
      ['idk', "I don't know", false],
      ['ig', 'instagram', false],
      ['ikr', 'I know right', false],
      ['ily', 'I love you', false],
      ['imho', 'in my humble opinion', false],
      ['imo', 'in my opinion', false],
      ['irl', 'in real life', false],
      ['isp', 'internet service provider', false],
      ['jk', 'just kidding', false],
      ['l8', 'late', false],
      ['lmk', 'let me know', false],
      ['mfw', 'my face when', false],
      ['nsfw', 'not safe for work', false],
      ['nvm', 'nevermind', false],
      ['oan', 'on another note', false],
      ['omg', 'oh my god', false],
      ['omw', 'on my way', false],
      ['sfw', 'safe for work', false],
      ['smh', 'shake my head', false],
      ['tbh', 'to be honest', false],
      ['thx', 'thanks', false],
      ['til', 'today I learned', false],
      ['tl;dr', "too long; didn't read", false],
      ['ttyl', 'talk to you later', false],
      ['ttyn', 'talk to you never', false],
      ['ttys', 'talk to you soon', false],
      ['txt', 'text', false],
      ['w/e', 'whatever', false],
      ['w/u', 'with you', false],
      ['wbu', 'what about you', false],
      ['wdym', 'what do you mean', false],
      ['yolo', 'you only live once', false],
      ['ysk', 'you should know', false],
      ['yt', 'YouTube', false],
    ])
    const filteredDefinitions = computed(() =>
      definitions.value.filter((def) => Array.isArray(def)),
    )
    const translateText = (text: string) => {
      if (!enableDictionary.value) return text
      const flags = caseSensitive.value ? 'g' : 'gi';

      let newText = text
      filteredDefinitions.value.forEach(([word, definition]) => {
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
      definitions.value.forEach(([word, definition, flag]) => {
        const transform: DictionaryRule = {
          keyword: definition,
          replace: word,
          hacked: flag ?? false,
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
      updateDefinition: (index: number, definition: [string, string, boolean]) => {
        definitions.value.splice(index, 1, definition)
      },
      addDefinition: (definition: (typeof definitions)['value'][number] = ['', '', false]) => {
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
