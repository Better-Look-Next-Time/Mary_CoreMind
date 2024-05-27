import { env } from 'bun'
import OpenAI from 'openai'
import type { ModelNmaeType, ModelTemperatureType, ModelMaxTokenType } from './types'

const openai = new OpenAI({
	baseURL: env.OPENAI_BASE_URL,
	apiKey: env.NAGA_KEY,
})

export async function requestFromAi(
	history: OpenAI.Chat.ChatCompletionMessageParam[],
	model: ModelNmaeType,
	temperature: ModelTemperatureType,
	tokens: ModelMaxTokenType
): Promise<string | null> {
	const porams: OpenAI.Chat.CompletionCreateParamsNonStreaming = {
		model: model,
		messages: history,
		temperature: temperature,
		max_tokens: tokens,
	}

	const ai = await openai.chat.completions.create(porams)
	const answer = ai.choices[0]?.message?.content
	return answer
}
