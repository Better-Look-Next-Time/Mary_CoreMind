import { requestFromAi } from './openai'
import type { ModelRoleType } from './types'
import { systemPromot } from '../../assets/character'
interface ObjectDelimiter {
	user: []
	system: []
	assistant: []
}

interface ObjectHistory {
	content: string
	role: ModelRoleType
}

export async function compresed(history: ObjectHistory[]) {
	const obj: ObjectDelimiter = {
		user: [],
		system: [],
		assistant: [],
	}
  history = history.slice(1)
	console.log('Итсори для сэжаиия:')
	console.log(history)
	history.forEach((item: ObjectHistory) => {
		const mas = obj[item.role]
		mas.push(item.content)
	})

	const message = `Recap the key message of this communication by combining the following messages into one: from users ${obj.user}, and from Mary ${obj.assistant}. The message must be in English, no longer than 500 characters, without greetings.`

	const answer = await requestFromAi(
		[
			{
				role: 'user',
				content: message,
			},
		],
		'llama-2-70b-chat',
		0.3,
		500
	)

	return `[${new Date()}] ${answer}`
}
