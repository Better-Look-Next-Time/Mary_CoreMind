import type { Emotion } from './src/interface/emotionsInterface'
import type { ModelNameType } from './src/models/openai/types'
import { systemPromot } from './src/assets/character'
import { connectorMary, createQuestion, promptToImageGen } from './src/assets/prompt'
import { counterTokens } from './src/helpers/counterTokens'
import { createTables, getCounterChat, getCounterUser, getHistoryChat, getHistoryUser, getMemoryChat, getTokens, getUserCharacter, insertChatMemory, insertChatMessages, insertUsersMessage } from './src/helpers/db'
import { memoryCompression } from './src/models/openai/compresed'
import { OpenAIModel } from './src/models/openai/openai'

export interface MaryConfig {
  emotionsArray: Emotion[]
  chapter: ModelNameType
  creatorImagePrompt: ModelNameType
  character?: string
}

export class Mary {
  // Config
  config: MaryConfig
  emotionsArray: Emotion[]
  chapter: ModelNameType
  creatorImagePrompt: ModelNameType
  character: string
  // User
  question: string
  message: string
  chatId: string
  userName: string
  userId: string

  constructor(config: MaryConfig) {
    this.config = config
    this.emotionsArray = this.config.emotionsArray
    this.chapter = this.config.chapter
    this.creatorImagePrompt = this.config.creatorImagePrompt
    this.character = config.character || systemPromot
    this.question = ''
    this.userName = ''
    this.message = ''
    this.chatId = ''
    this.userId = ''
    createTables()
  }

  private async RequestForThoughts() {
    const thoughts: any[] = []
    const thoughtsInstance: any[] = []
    this.emotionsArray.forEach(({ emotion, request, model }: Emotion) => {
      const modelInstance = new OpenAIModel(this.chatId, model, 0.3, 1000, emotion)
      thoughtsInstance.push(modelInstance.ProcessResponse(`${request} \n ${this.message}`, this.character))
    })
    console.log(thoughtsInstance)
    const requset = await Promise.allSettled(thoughtsInstance)
    const result = requset.filter(data => data.status === 'fulfilled')
    result.forEach((answer, index) => {
      thoughts.push({ emotion: this.emotionsArray[index].emotion, content: answer.value })
    })

    insertUsersMessage(this.chatId, this.userId, 'message', this.question, getCounterUser(this.chatId, this.userId) + 1)
    return thoughts
  }

  private async Compressed() {
    const { emotion } = this.emotionsArray[0]
    const historyChat = getHistoryChat(this.chatId, emotion, getCounterChat(this.chatId, emotion))
    const historyUser = getHistoryUser(this.chatId, this.userId, getCounterUser(this.chatId, this.userId))
    const { commpresedMemory, userCharacter } = await memoryCompression(historyChat, historyUser)
    insertUsersMessage(this.chatId, this.userId, 'character', userCharacter, 1)
    insertChatMemory(this.chatId, commpresedMemory, 1)
  }

  private async Connector(thoughtsList: string[]) {
    const chapterModel = new OpenAIModel('', this.chapter, 0.7, 1000, '')
    const memeoryChat = getMemoryChat(this.chatId)
    const userCharacter = getUserCharacter(this.chatId, this.userId)
    const prompt = connectorMary(this.question, this.userName, memeoryChat, userCharacter, thoughtsList)
    console.log(prompt)
    const answer = await chapterModel.Request([{ role: 'system', content: this.character }, { role: 'user', content: prompt }]) ?? 'Прости произошла ошибка'
    chapterModel.ChangeToStatus()
    const tokens = getTokens(this.chatId, this.emotionsArray[0].emotion)
    console.log(tokens)
    if (tokens >= 300) {
      await this.Compressed()
      this.SaveAnswer(answer, true)
    }
    else {
      this.SaveAnswer(answer, false)
    }
    return answer
  }

  async Request(question: string, chatId: string, userName: string, userId: string) {
    this.question = question
    this.chatId = chatId
    this.userName = userName
    this.userId = userId
    this.message = createQuestion(this.userName, this.question)
    console.log(this)
    console.log('Я работаю')
    const thoughtsArray = await this.RequestForThoughts()
    const answer = await this.Connector(thoughtsArray)
    return answer
  }

  async ImageGenerator(question: string, chatId: string, userName: string, userId: string) {
    const ai = new OpenAIModel('', this.creatorImagePrompt, 0.5, 100, '')
    const prompt = await ai.Request(promptToImageGen(question)) ?? 'pixel art Error'
    console.log(prompt)
    const image_url = await ai.ImageGenerator(prompt) ?? 'Прости я не чего сделать не смогла'
    const answer = await this.Request(question, chatId, userName, userId)
    return `${answer} \n ${image_url} `
  }

  private SaveAnswer(answer: string, compresed: boolean) {
    this.emotionsArray.forEach(({ emotion, model }) => {
      const counter = getCounterChat(this.chatId, emotion)
      const tokens = getTokens(this.chatId, emotion) + counterTokens(answer)
      insertChatMessages(this.chatId, answer, 'assistant', model, emotion, compresed === true ? 0 : tokens, compresed === true ? 1 : counter + 1)
    })
  }
}
