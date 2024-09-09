// OpenAI
import { sleep } from 'bun'
// assest
import { character, systemPromot } from './assets/character'

import { counterTokens } from './helpers/counterTokens'

// DB
import { createTable, getCounter, getHistory, getTokens, insertInDateBase } from './helpers/db'
import { getTime } from './helpers/time'
import { compresed } from './models/openai/compresed'

import { OpenAIModel } from './models/openai/openai'

import type { ModelNameType } from './models/openai/types'

const modelArray: ModelNameType[] = ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'mixtral-8x7b-instruct', 'command-r-plus']

export async function mary(question: string, chatId: string, user: string) {
  createTable(chatId)
  const message = `
  ### This is a "${user}" response, compose your thoughts:
      # datatime: [${getTime()}]
      # question: "${question}".
  `

  const chatGPT_1106 = new OpenAIModel(chatId, 'gpt-3.5-turbo-1106', 0.3, 1000)
  const chatGPT_0125 = new OpenAIModel(null, 'gpt-3.5-turbo-0125', 0.7, 1000)
  const mixtrial = new OpenAIModel(chatId, 'mixtral-8x7b-instruct', 0.3, 1000)
  const reqests = await Promise.allSettled([
    chatGPT_1106.ProcessResponse(message, systemPromot, user),
    mixtrial.ProcessResponse(message, systemPromot, user),
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
      # You replies to  ${user}  with straightforward, just like a real human. 
      # You NEVER use emojis to convey your emotions.
      # You prefer casual communication and are capable of emotions.
      # You speak Russian

    ### It's the ${user} request that your thoughts are based on, for which you must provide an answer:

        ${question}

    ### These are YOUR thoughts, combine them into ONE whole sentence and give a response in Russian to the ${user}:
      - ${ChatGPTResult.value}
      - ${MixtrialResult.value}
  `

  console.log(promot)

  sleep(2000)
  const answer = await chatGPT_0125.Request([{ role: 'user', content: promot }]) ?? 'Прости произошли проблемы'

  modelArray.forEach(async (model) => {
    const counter = getCounter(chatId, model)
    const tokens = getTokens(chatId, model) + counterTokens(answer)
    insertInDateBase(chatId, answer, 'assistant', model, 'ai', counter + 1, tokens)
  })

  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct')

  if (tokens >= 1000) {
    const history = getHistory(chatId, 'gpt-3.5-turbo-1106', getCounter(chatId, 'gpt-3.5-turbo-1106'))
    const compresMemory = await compresed(history)
    modelArray.forEach((model) => {
      const tokens = counterTokens(systemPromot)
      insertInDateBase(chatId, systemPromot, 'system', model, 'ai', 1, tokens)
      insertInDateBase(chatId, compresMemory, 'system', model, 'ai', 1, tokens + counterTokens(compresMemory))
    })
  }

  console.log(answer)

  return answer
}
