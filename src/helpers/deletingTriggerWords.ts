import { triggerWords } from '../assets/triggerWords'

export function deletingTriggerWords(message: string): string {
  let retrunMessage = message
  triggerWords.forEach((word) => {
    retrunMessage = retrunMessage.replace(word, '')
  })
  return retrunMessage
}
