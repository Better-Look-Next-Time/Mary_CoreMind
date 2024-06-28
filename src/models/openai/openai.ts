import { env } from 'bun'
import OpenAI from 'openai'
import type { ModelMaxTokensType, ModelNameType, ModelTemperatureType } from './types'

const openai = new OpenAI({
  baseURL: env.OPENAI_BASE_URL,
  apiKey: env.NAGA_KEY,
})

export async function requestFromAi(
  history: OpenAI.Chat.ChatCompletionMessageParam[],
  model: ModelNameType,
  temperature: ModelTemperatureType,
  tokens: ModelMaxTokensType,
): Promise<string | null> {
  const porams: OpenAI.Chat.CompletionCreateParamsNonStreaming = {
    model,
    messages: history,
    temperature,
    max_tokens: tokens,
  }

  const ai = await openai.chat.completions.create(porams)
  const answer = ai.choices[0]?.message?.content
  return answer
}
