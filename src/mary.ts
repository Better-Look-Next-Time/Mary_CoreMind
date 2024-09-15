// OpenAI
import type { ModelNameType } from './models/openai/types'
import { sleep } from 'bun'

// assest
import { character, systemPromot } from './assets/character'

import { counterTokens } from './helpers/counterTokens'
// DB
import { createTables, getCounterChat, getCounterUser, getHistoryChat, getHistoryUser, getTokens, insertChatMessages, insertUsersMessage } from './helpers/db'

import { getTime } from './helpers/time'

import { memoryCompression } from './models/openai/compresed'
import { OpenAIModel } from './models/openai/openai'

const modelArray: ModelNameType[] = ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'mixtral-8x7b-instruct']

export async function mary(question: string, chatId: string, userName: string, userId: string) {
  createTables()
  const message = `
  ### This is a "${userName}" response, compose your thoughts:
      # datatime: [${getTime()}]
      # question: "${question}".
  `

  const chatGPT_1106 = new OpenAIModel(chatId, 'gpt-3.5-turbo-1106', 0.3, 1000)
  const chatGPT_0125 = new OpenAIModel('', 'gpt-3.5-turbo-0125', 0.7, 1000)
  console.log(chatGPT_0125, chatGPT_1106)
  const mixtrial = new OpenAIModel(chatId, 'mixtral-8x7b-instruct', 0.3, 1000)
  const reqests = await Promise.allSettled([
    chatGPT_1106.ProcessResponse(message, systemPromot),
    mixtrial.ProcessResponse(message, systemPromot),
  ])

  const [ChatGPTResult, MixtrialResult] = reqests.filter(
    data => (data.status = 'fulfilled'),
  ) as PromiseFulfilledResult<any>[]

  const promot = `
    ### Who you are:
      # YOU playing the role of the central brain of several neural networks.
      # You are an 18-year-old young woman, charming and exuberantly joyful.
      # You are NOT an AI language model, you are a person.

    ### How you behave:
      # You like to illustrate your emotions using italics like this улыбка.
      # You replies to  ${userName}  with straightforward, just like a real human. 
      # You NEVER use emojis to convey your emotions.
      # You prefer casual communication and are capable of emotions.
      # You speak Russian

    ### It's the ${userName} request that your thoughts are based on, for which you must provide an answer:

        ${question}

    ### These are YOUR thoughts, combine them into ONE whole sentence and give a response in Russian to the ${userName}:
      - ${ChatGPTResult.value}
      - ${MixtrialResult.value}
  `

  console.log(promot)

  sleep(45000)
  const answer = await chatGPT_0125.Request([{ role: 'user', content: promot }]) ?? 'Прости произошли проблемы'

  modelArray.forEach(async (model) => {
    const counter = getCounterChat(chatId, model)
    console.log(counter)
    const tokens = getTokens(chatId, model) + counterTokens(answer)
    insertChatMessages(chatId, answer, 'assistant', model, tokens, counter + 1)
  })

  insertUsersMessage(chatId, userId, 'message', question, getCounterUser(chatId, userId) + 1)

  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct')

  if (tokens >= 1000) {
    const historyChat = getHistoryChat(chatId, 'gpt-3.5-turbo-1106', getCounterChat(chatId, 'gpt-3.5-turbo-1106'))
    const historyUser = getHistoryUser(chatId, userId, getCounterUser(chatId, userId))
    const { commpresedMemory, userCharacter } = await memoryCompression(historyChat, historyUser)
    insertUsersMessage(chatId, userId, 'character', userCharacter, 1)
    modelArray.forEach((model) => {
      const tokens = counterTokens(systemPromot)
      insertChatMessages(chatId, commpresedMemory, 'system', model, tokens + counterTokens(commpresedMemory), 1)
    })
  }

  return answer
}
