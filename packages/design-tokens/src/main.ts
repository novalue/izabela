import { rem } from 'polished'

export const tokens = {
  fontFamily: {
    sans: [
      'Nunito',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"',
    ],
    serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
    mono: [
      'Menlo',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace',
    ],
  },
  colors: {
    white: '#ffffff',
    black: '#0E0E2C',
    gray: {
      100: '#0E0E2C',
      90: '#2B2B2C',
      80: '#444444',
      /* Generated with: https://coolors.co/gradient-palette/444444-DCDCDC?number=6 */
      70: '#626262',
      60: '#818181',
      50: '#9F9F9F',
      40: '#BEBEBE',
      /* --------- */
      30: '#DCDCDC',
      20: '#EBEBEB',
      10: '#F9F9FC',
      0: '#ffffff',
    },
  },
  // Follows: https://www.carbondesignsystem.com/guidelines/spacing/overview/
  spacing: {
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    10: 64,
    11: 80,
    12: 96,
    13: 112,
    14: 128,
    15: 144,
    16: 160,
  },
  // Follows: https://www.carbondesignsystem.com/guidelines/typography/overview/
  fontSize: {
    1: [12, { lineHeight: 1.4, letterSpacing: 0.32 }],
    2: [14, { lineHeight: 1.4, letterSpacing: 0.32 }],
    3: [16, { lineHeight: 1.4, letterSpacing: 0.32 }],
    4: [18, { lineHeight: 1.4, letterSpacing: 0.32 }],
    5: [24, { lineHeight: 1.4, letterSpacing: 0.32 }],
    6: [28, { lineHeight: 1.4, letterSpacing: 0.32 }],
    7: [32, { lineHeight: 1.4, letterSpacing: 0.32 }],
    8: [36, { lineHeight: 1.4, letterSpacing: 0.32 }],
    9: [42, { lineHeight: 1.4, letterSpacing: 0.32 }],
    10: [48, { lineHeight: 1.4, letterSpacing: 0.32 }],
    11: [54, { lineHeight: 1.4, letterSpacing: 0.32 }],
    12: [60, { lineHeight: 1.4, letterSpacing: 0.32 }],
    13: [68, { lineHeight: 1.4, letterSpacing: 0.32 }],
    14: [76, { lineHeight: 1.4, letterSpacing: 0.32 }],
    15: [84, { lineHeight: 1.4, letterSpacing: 0.32 }],
    16: [92, { lineHeight: 1.4, letterSpacing: 0.32 }],
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    DEFAULT: 8,
  },
  borderWidth: {
    DEFAULT: 1,
    lg: 4,
  },
  boxShadow: {
    DEFAULT: '0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)',
    lg: '0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)',
  },
  transition: {
    DEFAULT: 'all .3s',
  },
  motion: {
    visible: {
      opacity: 1,
      transition: { duration: 300 },
    },
    hidden: {
      opacity: 0,
      transition: { duration: 300 },
    },
  },
} as const

export const tailwindTheme = {
  ...tokens,
  spacing: Object.fromEntries(
    Object.entries(tokens.spacing).map(([key, value]) => [key, rem(value)]),
  ),
  borderRadius: Object.fromEntries(
    Object.entries(tokens.borderRadius).map(([key, value]) => [
      key,
      rem(value),
    ]),
  ),
  borderWidth: Object.fromEntries(
    Object.entries(tokens.borderWidth).map(([key, value]) => [key, rem(value)]),
  ),
  fontSize: Object.fromEntries(
    Object.entries(tokens.fontSize).map(
      ([key, [fontSize, { lineHeight, letterSpacing }]]) => [
        key,
        [rem(fontSize), { lineHeight, letterSpacing: rem(letterSpacing) }],
      ],
    ),
  ),
}
