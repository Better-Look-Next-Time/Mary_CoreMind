// OpenAI
import { requestFromAi } from './models/openai/openai'

import { chatGPT } from './models/openai/chatGPT'
import { mixtrial } from './models/openai/7x8b'
import { command } from './models/openai/commandR'
// DB
import { createTable, getCounter, getHistory, getTokens, insertInDateBase } from './helpers/db'

// assest
import { character, systemPromot } from './assets/character'

import type { ModelNmaeType } from './models/openai/types'
import { compresed } from './models/openai/compresed'
import { counterTokens } from './helpers/counterTokens'
import { sleep } from 'bun'


const modelArray: ModelNmaeType[] = ['gpt-3.5-turbo-0125', 'mixtral-8x7b-instruct', 'command-r-plus']


export async function mary(question: string, chatId: string, user: string) {
	createTable(chatId)
	const message = `[${new Date()}] user "${user}": ${question}.`



	const reqests = await Promise.allSettled([
    chatGPT(chatId, message, user),
    mixtrial(chatId, message, user),
    command(chatId, message, user)
	])

  console.log(reqests[2].reason)

	const [ChatGPTResult, MixtrialResult, CommandResult] = reqests.filter(
		(data) => (data.status = 'fulfilled')
	) as PromiseFulfilledResult<any>[]

	console.log( 'ChatGPT:' + ChatGPTResult.value + '\n' + '7x8b' +  MixtrialResult.value, '\n command' + CommandResult.value)

	const promot = ` Form a single message from these texts that answers the question ${question}. Sources: 1. ${ChatGPTResult.value}; 2. ${MixtrialResult.value}; 3. ${CommandResult.value} You are required to submit an answer in Russian with a maximum of 1000 characters.`
  sleep(2000)
	const answer =
		(await requestFromAi(
			[
				{
					role: 'system',
					content: systemPromot,
				},
				{
					role: 'user',
					content: promot,
				},
			],
			'mixtral-8x7b-instruct',
			0.6,
			1000
		)) ?? 'Прости мою сеть взламывают и возможно отвечу через некоторое время'

	modelArray.forEach(async (model) => {
		const counter = getCounter(chatId, model)
    const tokens = getTokens(chatId, model) + counterTokens(answer)
		insertInDateBase(chatId, answer, 'assistant', model, 'ai', counter + 1, tokens)
	})

  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct')


	if (tokens >= 1000) {
		console.log('Пришло время сжимать')
		const history = getHistory(chatId, 'mixtral-8x7b-instruct', getCounter(chatId, 'mixtral-8x7b-instruct') )
 		const compresMemory = await compresed(history)
    modelArray.forEach((model) => {
      let tokens = counterTokens(systemPromot)
		  insertInDateBase(chatId, systemPromot, 'system', model, 'ai', 1, tokens)
		  insertInDateBase(chatId, compresMemory, 'system', model, 'ai', 1, tokens + counterTokens(compresMemory))
    })
	}


  console.log(answer)

	return answer
}
