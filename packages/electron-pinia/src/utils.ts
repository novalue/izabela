import { ShareStatePayload } from './types'

export function purify(o?: object | [] | null) {
  if (typeof o === 'object') {
    /** TODO: replace by structuredClone
     * https://developer.mozilla.org/en-US/docs/Web/API/structuredClone */
    return JSON.parse(JSON.stringify(o))
  }
  return o
}
export const getIssuer = (args: ShareStatePayload['args']): string | number | undefined => {
  return args.find((arg) => typeof arg === 'object' && arg.issuer)?.issuer
}
export function useArgs(args: ShareStatePayload['args']) {
  const issuer = getIssuer(args) || 'main'

  const newArgs = [
    ...args.filter((o) => typeof o !== 'object' || !o.issuer),
    { issuer },
  ]

  return {
    issuer,
    args: newArgs,
  }
}
