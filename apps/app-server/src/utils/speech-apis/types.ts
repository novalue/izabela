export type WordBoundary = {
    type: string
    text: string
    offset: number
    length: number
    duration: number
    moment: number
}

export type SpeechSynthesizerAnswer = {
    caption: WordBoundary[]
    audio: string
}

export const getWordBoundaryType = (word: string) =>  {
    let rex = new RegExp(`^\\w+$`, 'gi')
    if (rex.test(word))
    {
        return 'WordBoundary'
    }

    rex = new RegExp(`^\\W+$`, 'gi')
    if (rex.test(word))
    {
        return 'PunctuationBoundary'
    }

    rex = new RegExp(`^(\\w|\\W)+$`, 'gi')
    if (rex.test(word))
    {
        return 'MixedBoundary'
    }

    return 'Unknown'
}