import { sleep } from 'bun'
import type { OpenAI } from 'openai'
import { userAnalysis } from '../../assets/prompt'
import { OpenAIModel } from './openai'
import type { HistoryUser } from '../../interface/HistoryUserInterface'

const Llama = new OpenAIModel('', 'llama-2-7b-chat', 0.3, 500)

interface MessageLists {
  user: string[]
  assistant: string[]
}

export async function memoryCompression(historyChat: OpenAI.Chat.ChatCompletionMessageParam[], historyUser: HistoryUser[]) {
  const messageLists: MessageLists = {
    user: [],
    assistant: [],
  }
  const filteredHistory = historyChat.filter(message => message.role === 'assistant' || message.role === 'user')
  console.log(filteredHistory)
  filteredHistory.forEach((message) => {
    if (message.role === 'assistant' || message.role === 'user') {
      messageLists[message.role].push(message.content as string)
    }
  })
  console.log(messageLists)
  const promot = `Recap the key message of this communication by combining the following messages into one: from users ${messageLists.user}, and from Mary ${messageLists.assistant}. The message must be in English, no longer than 500 characters, without greetings.`
  const commpresedMemory = await Llama.Request([{ role: 'user', content: promot }])
  await sleep(1000)
  const userCharacter = await Llama.Request(userAnalysis(historyUser))

  return { commpresedMemory, userCharacter }
}
