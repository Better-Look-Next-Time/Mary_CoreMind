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

const modelArray: ModelNameType[] = ['gpt-3.5-turbo-0125', 'mixtral-8x7b-instruct', 'command-r-plus']

export async function mary(question: string, chatId: string, user: string) {
  createTable(chatId)
  const message = `
    [${getTime()}]  A user named "${user}" writes in a new post: "${question}".

    Write your thoughts according to your character
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
    New user message: 
      ${question}

    Your thoughts on the user's message:
      - ${ChatGPTResult.value} 
      - ${MixtrialResult.value} 
  
    Write in Russian. According to your thoughts and the user's message, write a message in your own name addressing the user. 
    Try to convey as much of your thoughts in your reply as possible.
    Be as energetic and cheerful as possible.
    Depict your lively non-verbal reaction in the *reaction* format in Russian. 
    Use simple sentences
    You have 900 tokens to respond. 
  `
  sleep(2000)
  const answer = (await requestFromAi(
    [
      { role: 'system', content: character },
      { role: 'user', content: promot },
    ],
    'mixtral-8x7b-instruct',
    0.5,
    1000,
  )) ?? 'Прости мою сеть взламывают и возможно отвечу через некоторое время'

  modelArray.forEach(async (model) => {
    const counter = getCounter(chatId, model)
    const tokens = getTokens(chatId, model) + counterTokens(answer)
    insertInDateBase(chatId, answer, 'assistant', model, 'ai', counter + 1, tokens)
  })

  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct')

  if (tokens >= 1000) {
    const history = getHistory(chatId, 'gpt-3.5-turbo-0125', getCounter(chatId, 'gpt-3.5-turbo-0125'))
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
