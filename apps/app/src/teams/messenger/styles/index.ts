import { injectGlobal } from 'vue3-styled-components'

import { tokens } from '@packages/ui'
import { rem } from 'polished'

const { colors, borderRadius, spacing } = tokens

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  #vjt-tooltip {
    background-color: ${colors.black} !important;
    color: inherit !important;
    border-radius: ${rem(borderRadius.md)} !important;
    font-size: inherit !important;
    padding: ${rem(spacing['5'])} !important;
    display: flex;
    flex-direction: column;
    gap: ${rem(spacing['5'])};

    &[data-hidden] {
      display: none !important;
    }
  }

  #vjt-arrow {
    &::before {
      background-color: ${colors.black} !important;
    }
  }

  .vjt-highlight {
    outline: ${rem(2)} solid ${colors.black} !important;
    border-radius: inherit !important;
  }

  @media (prefers-color-scheme: dark) {
    .messenger { background-color: #000000cf; color: #ccc; border-width: 1px; border-color: #ffffff9f }
    .messenger div div { background-color: #00000000; }
    .messenger div div span a button { background-color: #111; border-width: 0px; color: #fff }
    .messenger div div div button { background-color: #111; border-width: 0px }
    .messenger div div div button:active { background-color: #111 }
    .messenger div div div button:hover { background-color: #000000df; border-width: 0px }
    .messenger div div div button:focus { box-shadow: none }
    .messenger div div div div span div span div { background-color: #111; border-width: 0px; box-shadow: none; color: #fff  }
    .messenger div div div div span div span div:hover { background-color: #000000df }
    .messenger div div div div span div span div div div div input { background-color: #111; border-width: 0px; box-shadow: none }
    .messenger div div div div span div span div div div div input:hover { background-color: #000000df }
    .messenger div div div div span button { background-color: #111; border-width: 0px; color: #fff }
    .messenger div div div div span button:active { background-color: #111 }
    .messenger div div div div span button:hover { background-color: #000000df }
    .messenger div div div div span button:focus { box-shadow: none }
    .messenger div div div div span a button { background-color: #111; border-width: 0px; color: #fff }
    .messenger div div div div span a button:active { background-color: #111 }
    .messenger div div div div span a button:hover { background-color: #000000df }
    .messenger div div div div span a button:focus { box-shadow: none  }

    input[data-v-step="messenger-text-input"] { background-color: #111; border-color: #ffffff1f !important; color: #888 !important }
    input[data-v-step="messenger-text-input"]:focus { box-shadow: 0 0 0 0.1rem #8080809f !important; color: #fff !important }

    div[data-v-step="messenger-text-input"] .autocomplete { border-color: #111 !important }

    .autocomplete .autocomplete__list { background-color: #101010df }
    .autocomplete .autocomplete__list .selected div { background-color: #555 !important; color: #fff}
    .autocomplete .autocomplete__list .deselected div { background-color: transparent !important; color: #ccc}
    .autocomplete .autocomplete__list .deselected div:hover { background-color: #444 !important}
  }
`
