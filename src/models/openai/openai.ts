import type { ModelMaxTokensType, ModelNameType, ModelTemperatureType } from './types'
import { env } from 'bun'
import OpenAI from 'openai'
import { counterTokens } from '../../helpers/counterTokens'
import { getCounterChat, getDataAIAvailability, getHistoryChat, getStatusAI, getTokens, insertAIAvailability, insertChatMessages } from '../../helpers/db'

import { errorFilter } from '../../helpers/errorFilter'
import { requestToPhind } from '../phind/phind'

export class OpenAIModel {
  private chatId: string
  private modelName: ModelNameType
  private openai: OpenAI
  private temperature: ModelTemperatureType
  private max_tokens: ModelMaxTokensType

  constructor(chatId: string, modelName: ModelNameType, temperature: ModelTemperatureType, max_tokens: ModelMaxTokensType) {
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
    return getTokens(this.chatId, this.modelName) + counterTokens(question)
  }

  ChangeToStatus() {
    const dataStatus = getDataAIAvailability(this.modelName)
    console.log(dataStatus)
    const dataNow = new Date()
    if (dataStatus.getTime() <= dataNow.getTime()) {
      insertAIAvailability(this.modelName, true, dataNow)
    }
  }

  async Request(history: OpenAI.Chat.ChatCompletionMessageParam[]) {
    try {
      const status = getStatusAI(this.modelName)
      if (status) {
        const completion = await this.openai.chat.completions.create({
          messages: history,
          model: this.modelName,
          temperature: this.temperature,
          max_tokens: this.max_tokens,
          top_p: 1,
        })
        return completion.choices[0].message.content ?? 'Прости, мою сеть взламывают. Отвечу чуть позже.'
      }
      else {
        console.log('Использую  защиту')
        return requestToPhind(history)
      }
    }
    catch (error) {
      console.log(error)
      const data = new Date()
      const errorMessage = error instanceof Error ? error.message : String(error)
      const waitingTime = errorFilter(errorMessage)
      data.setHours(data.getHours() + waitingTime)
      insertAIAvailability(this.modelName, false, data)
      return requestToPhind(history)
    }
  }

  async ProcessResponse(question: string, system: string) {
    const tokens = this.GetTokens(question)
    insertChatMessages(this.chatId, system, 'system', this.modelName, tokens, this.GetCounter)
    insertChatMessages(this.chatId, question, 'user', this.modelName, tokens, this.GetCounter) // question for User
    const history = getHistoryChat(this.chatId, this.modelName, this.GetCounter)
    const response = await this.Request(history)
    console.log(response)
    this.ChangeToStatus()
    return response
  }

  private get GetCounter() {
    return getCounterChat(this.chatId, this.modelName)
  }
}
