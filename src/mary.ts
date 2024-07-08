// OpenAI
import { sleep } from 'bun'
import { requestFromAi } from './models/openai/openai'

import { chatGPT } from './models/openai/chatGPT'
import { mixtrial } from './models/openai/7x8b'

// DB
import { createTable, getCounter, getHistory, getTokens, insertInDateBase } from './helpers/db'

// assest
import { character, systemPromot } from './assets/character'

import type { ModelNameType } from './models/openai/types'
import { compresed } from './models/openai/compresed'
import { counterTokens } from './helpers/counterTokens'

import { getTime } from './helpers/time'

const modelArray: ModelNameType[] = ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106',  'mixtral-8x7b-instruct', 'command-r-plus']

export async function mary(question: string, chatId: string, user: string) {
  createTable(chatId)
  const message = `
  ### This is a "${user}" response, compose your thoughts:
      # datatime: [${getTime()}]
      # question: "${question}".
  `

  const reqests = await Promise.allSettled([
    chatGPT(chatId, message, user),
    mixtrial(chatId, message, user),
  ])

  const [ChatGPTResult, MixtrialResult] = reqests.filter(
    data => (data.status = 'fulfilled'),
  ) as PromiseFulfilledResult<any>[]

  console.log(`ChatGPT:${ChatGPTResult.value}\n` + `7x8b${MixtrialResult.value}`)
  
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
  const answer = (await requestFromAi(
    [
      { role: 'user', content: promot },
    ],
    'gpt-3.5-turbo-0125',
    0.7,
    1000,
  )) ?? 'Прости мою сеть взламывают и возможно отвечу через некоторое время'

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
