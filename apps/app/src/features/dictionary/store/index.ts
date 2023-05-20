import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { DictionaryRule } from '@/modules/speech-engine-manager/types'

export const useDictionaryStore = defineStore(
  'dictionary',
  () => {
    const enableDictionary = ref(false)
    const matchExactWord = ref(true)
    const caseSensitive = ref(false)
    const definitions = ref<[string, string][]>([
      ['wyd', 'what are you doing'],
      ['hbu', 'how about you'],
      ['afaik', 'as far as I know'],
      ['b4', 'before'],
      ['bc', 'because'],
      ['bf', 'boyfriend'],
      ['bff', 'best friends forever'],
      ['brb', 'be right back'],
      ['btw', 'by the way'],
      ['dm', 'direct message'],
      ['fb', 'facebook'],
      ['ftw', 'for the win'],
      ['g2g', 'got to go'],
      ['gf', 'girlfriend'],
      ['gg', 'good game'],
      ['gtg', 'got to go'],
      ['gtr', 'got to run'],
      ['hmu', 'hit me up'],
      ['idc', "I don't care"],
      ['idk', "I don't know"],
      ['ig', 'instagram'],
      ['ikr', 'I know right'],
      ['ily', 'I love you'],
      ['imho', 'in my humble opinion'],
      ['imo', 'in my opinion'],
      ['irl', 'in real life'],
      ['isp', 'internet service provider'],
      ['jk', 'just kidding'],
      ['l8', 'late'],
      ['lmk', 'let me know'],
      ['mfw', 'my face when'],
      ['nsfw', 'not safe for work'],
      ['nvm', 'nevermind'],
      ['oan', 'on another note'],
      ['omg', 'oh my god'],
      ['omw', 'on my way'],
      ['sfw', 'safe for work'],
      ['smh', 'shake my head'],
      ['tbh', 'to be honest'],
      ['thx', 'thanks'],
      ['til', 'today I learned'],
      ['tl;dr', "too long; didn't read"],
      ['ttyl', 'talk to you later'],
      ['ttyn', 'talk to you never'],
      ['ttys', 'talk to you soon'],
      ['txt', 'text'],
      ['w/e', 'whatever'],
      ['w/u', 'with you'],
      ['wbu', 'what about you'],
      ['wdym', 'what do you mean'],
      ['yolo', 'you only live once'],
      ['ysk', 'you should know'],
      ['yt', 'YouTube'],
    ])
    const filteredDefinitions = computed(() =>
      definitions.value.filter((def) => Array.isArray(def)),
    )
    const translateText = (text: string) => {
      if (!enableDictionary.value) return text

      let newText = text
      filteredDefinitions.value.forEach(([word, definition]) => {
        const flags = caseSensitive.value ? 'g' : 'gi';
        const filterWord = word.replaceAll(/([^\s\w])/g, '\\$1')
        newText = newText.replaceAll(new RegExp(`(^|\\s|[-])(${filterWord})(?=([-=,?!]|\\s|$))`, flags), `$1${definition}`)
      })
      return newText
    }

    const elaborateRules = (text: string) => {
      const dictionaryRules: Array<DictionaryRule> = []
      if (!enableDictionary.value) return dictionaryRules

      let input = text;
      definitions.value.forEach(([word, definition]) => {
        const transform: DictionaryRule = {
          keyword: definition,
          replace: word,
          indices: []
        }

        let currentIndexOffset = 0;

        const filterWord = word.replaceAll(/([^\s\w])/gi, '\\$1')
        const rex = new RegExp(`(^|\\s|[-])(${filterWord})(?=([-=,?!]|\\s|$))`, 'gi')
        while (rex.test(input))
        {
          input = input.substring(rex.lastIndex)
          currentIndexOffset += (rex.lastIndex - word.length)
          transform.indices.push(currentIndexOffset);
          currentIndexOffset += definition.length
        }
        
        if (transform.indices.length > 0)
        {
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
      updateDefinition: (index: number, definition: [string, string]) => {
        definitions.value.splice(index, 1, definition)
      },
      addDefinition: (definition: (typeof definitions)['value'][number] = ['', '']) => {
        definitions.value.unshift(definition)
      },
      removeDefinition: (index: number) => {
        definitions.value.splice(index, 1)
      },
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
