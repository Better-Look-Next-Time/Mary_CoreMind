import type { OpenAI } from 'openai'
import type { HistoryUser } from '../../interface/HistoryUserInterface'
import type { MessageLists } from '../../interface/MessageLists'
import { sleep } from 'bun'
import { compressedMemory, userAnalysis } from '../../assets/prompt'
import { OpenAIModel } from './openai'

const Llama = new OpenAIModel('', 'llama-2-7b-chat', 0.3, 400)

export async function memoryCompression(historyChat: OpenAI.Chat.ChatCompletionMessageParam[], historyUser: HistoryUser[]) {
  const messageLists: MessageLists = {
    user: [],
    assistant: [],
  }
  const filteredHistory = historyChat.filter(message => message.role === 'assistant' || message.role === 'user')
  filteredHistory.forEach((message) => {
    if (message.role === 'assistant' || message.role === 'user') {
      messageLists[message.role].push(message.content as string)
    }
  })
  const commpresedMemory = await Llama.Request([{ role: 'user', content: compressedMemory(messageLists) }]) ?? ''
  await sleep(1000)
  const userCharacter = await Llama.Request(userAnalysis(historyUser)) ?? ''

  return { commpresedMemory, userCharacter }
}
