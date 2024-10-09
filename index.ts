// OpenAI
import type { ModelNameType } from './src/models/openai/types'
import { hash, sleep } from 'bun'

// assest
import { systemPromot } from './src/assets/character'

import { connectorMary } from './src/assets/prompt'
import { counterTokens } from './src/helpers/counterTokens'

// DB
import { createTables, getCounterChat, getCounterUser, getHashQuery, getHistoryChat, getHistoryUser, getMemoryChat, getTokens, getUserCharacter, insertAiHash, insertChatMemory, insertChatMessages, insertUsersMessage } from './src/helpers/db'

import { getTime } from './src/helpers/time'
import { memoryCompression } from './src/models/openai/compresed'
import { OpenAIModel } from './src/models/openai/openai'

const modelArray: ModelNameType[] = ['llama-3.1-8b-instruct', 'mixtral-8x7b-instruct']

export async function mary(question: string, chatId: string, userName: string, userId: string) {
  createTables()
  const message = `
  ### This is a "${userName}" response, compose your thoughts:
      # datatime: [${getTime()}]
      # question: "${question}".
  `

  const hashList: string[] = []
  modelArray.forEach((model: ModelNameType) => {
    const hash = getHashQuery(chatId, model, question)
    console.log(hash)
    if (hash !== null) {
      hashList.push(hash)
    }
  })

  console.log(hashList)

  const llama_31_8B = new OpenAIModel(chatId, 'llama-3.1-8b-instruct', 0.3, 1000)
  const chatGPT_4 = new OpenAIModel('', 'gpt-4o-mini', 0.7, 1000)
  const mixtrial = new OpenAIModel(chatId, 'mixtral-8x7b-instruct', 0.3, 1000)
  const memoryChat = getMemoryChat(chatId)
  const userCharacter = getUserCharacter(chatId, userId)

  let prompt = ''

  if (hashList.length !== 0) {
    console.log('Хеш есть')
    const [ChatGPTResult, MixtrialResult] = hashList
    prompt = connectorMary(question, userName, ChatGPTResult, MixtrialResult, memoryChat, userCharacter)
  }
  else {
    const reqests = await Promise.allSettled([
      llama_31_8B.ProcessResponse(message, systemPromot),
      mixtrial.ProcessResponse(message, systemPromot),
    ])

    const [ChatGPTResult, MixtrialResult] = reqests.filter(
      data => (data.status = 'fulfilled'),
    ) as PromiseFulfilledResult<any>[]
    prompt = connectorMary(question, userName, ChatGPTResult.value, MixtrialResult.value, memoryChat, userCharacter)
    insertAiHash(chatId, 'llama-3.1-8b-instruct', question, ChatGPTResult.value)
    insertAiHash(chatId, 'mixtral-8x7b-instruct', question, MixtrialResult.value)
  }

  console.log(prompt)

  const answer = await chatGPT_4.Request([{ role: 'system', content: systemPromot }, { role: 'user', content: prompt }]) ?? 'Прости произошли проблемы'
  chatGPT_4.ChangeToStatus()
  modelArray.forEach(async (model) => {
    const counter = getCounterChat(chatId, model)
    const tokens = getTokens(chatId, model) + counterTokens(answer)
    insertChatMessages(chatId, answer, 'assistant', model, tokens, counter + 1)
  })

  insertUsersMessage(chatId, userId, 'message', question, getCounterUser(chatId, userId) + 1)

  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct')

  if (tokens >= 1000) {
    const historyChat = getHistoryChat(chatId, 'llama-3.1-8b-instruct', getCounterChat(chatId, 'llama-3.1-8b-instruct'))
    const historyUser = getHistoryUser(chatId, userId, getCounterUser(chatId, userId))
    const { commpresedMemory, userCharacter } = await memoryCompression(historyChat, historyUser)
    insertUsersMessage(chatId, userId, 'character', userCharacter, 1)
    insertChatMemory(chatId, commpresedMemory, 1)
  }
  return answer
}
