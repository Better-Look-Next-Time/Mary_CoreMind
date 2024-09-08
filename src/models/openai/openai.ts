import { env } from 'bun'
import OpenAI from 'openai'
import { counterTokens } from '../../helpers/counterTokens'
import { addSystem, getCounter, getHistory, getTokens, insertInDateBase } from './../../helpers/db.ts'
import type { ModelMaxTokensType, ModelNameType, ModelTemperatureType } from './types'

export class OpenAIModel {
  private chatId: string | null
  private modelName: ModelNameType
  private openai: OpenAI
  private temperature: ModelTemperatureType
  private max_tokens: ModelMaxTokensType

  constructor(chatId: any, modelName: ModelNameType, temperature: ModelTemperatureType, max_tokens: ModelMaxTokensType) {
    this.openai = new OpenAI({
      baseURL: env.NAGA_BASE_URL,
      apiKey: env.NAGA_KEY,
    })
    this.chatId = chatId
    this.modelName = modelName
    this.temperature = temperature
    this.max_tokens = max_tokens
  }

  private GetTokens(question: string) {
    if (this.chatId) {
      return getTokens(this.chatId, this.modelName) + counterTokens(question)
    }
  }

  async Request(histiry: OpenAI.Chat.ChatCompletionMessageParam[]) {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: histiry,
        model: this.modelName,
        temperature: this.temperature,
        max_tokens: this.max_tokens,
        top_p: 1,
      })
      return completion.choices[0].message.content
    }
    catch (error) {
      console.log(error)
      throw new Error('Прости, мою сеть взламывают. Отвечу чуть позже.')
    }
  }

  async ProcessResponse(question: string, userName: string) {
    if (this.chatId) {
      addSystem(this.chatId, this.modelName)
      insertInDateBase(this.chatId, question, 'user', this.modelName, userName, this.GetCounter, this.GetTokens(question))
      const history = getHistory(this.chatId, this.modelName, this.GetCounter)
      const response = await this.Request(history)
      console.log(response)
      return response
    }
  }

  private get GetCounter() {
    if (this.chatId) {
      return getCounter(this.chatId, this.modelName)
    }
  }
}
