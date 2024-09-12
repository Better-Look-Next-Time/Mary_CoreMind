import type { OpenAI } from 'openai'
import { OpenAIModel } from './openai'

const Llama = new OpenAIModel('', 'llama-2-7b-chat', 0.3, 500)

interface MessageLists {
  user: string[]
  assistant: string[]
}

export async function memoryCompression(history: OpenAI.Chat.ChatCompletionMessageParam[]) {
  const messageLists: MessageLists = {
    user: [],
    assistant: [],
  }
  const filteredHistory = history.filter(message => message.role === 'assistant' || message.role === 'user')
  console.log(filteredHistory)
  filteredHistory.forEach((message) => {
    if (message.role === 'assistant' || message.role === 'user') {
      messageLists[message.role].push(message.content as string)
    }
  })
  console.log(messageLists)
  const promot = `Recap the key message of this communication by combining the following messages into one: from users ${messageLists.user}, and from Mary ${messageLists.assistant}. The message must be in English, no longer than 500 characters, without greetings.`
  return await Llama.Request([{ role: 'user', content: promot }])
}
