import { trigerWords } from '../assets/trigerWords'

export function delitingTrigerWords(message: string): string {
  let retrunMesage = message
  trigerWords.forEach((word) => {
    retrunMesage = retrunMesage.replace(word, '')
  })
  return retrunMesage
}
