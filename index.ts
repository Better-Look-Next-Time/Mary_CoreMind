import type { ModelNameType } from './src/models/openai/types'
import { systemPromot } from './src/assets/character'
import { connectorMary, createQuestion, promptToImageGen } from './src/assets/prompt'
import { counterTokens } from './src/helpers/counterTokens'
import { createTables, getCounterChat, getCounterUser, getHashQuery, getHistoryChat, getHistoryUser, getMemoryChat, getTokens, getUserCharacter, insertAiHash, insertChatMemory, insertChatMessages, insertUsersMessage } from './src/helpers/db'
import { memoryCompression } from './src/models/openai/compresed'
import { OpenAIModel } from './src/models/openai/openai'

interface MaryConfig {
  thoughtsArray: ModelNameType[]
  chapter: ModelNameType
  creatorImagePrompt: ModelNameType
}

export class Mary {
  // Config
  config: MaryConfig
  thoughtsArray: ModelNameType[]
  chapter: ModelNameType
  creatorImagePrompt: ModelNameType
  // User
  question: string
  message: string
  chatId: string
  userName: string
  userId: string

  constructor(config: MaryConfig, question: string, chatId: string, userName: string, userId: string) {
    this.config = config
    this.thoughtsArray = this.config.thoughtsArray
    this.chapter = this.config.chapter
    this.creatorImagePrompt = this.config.creatorImagePrompt
    this.question = question
    this.userName = userName
    this.message = createQuestion(this.userName, this.question)
    this.chatId = chatId
    this.userId = userId
    createTables()
  }

  private async RequestForThoughts() {
    const thoughts: any[] = []
    const thoughtsInstance: any[] = []
    this.thoughtsArray.forEach((model) => {
      const modelInstance = new OpenAIModel(this.chatId, model, 0.3, 1000)
      thoughtsInstance.push(modelInstance.ProcessResponse(this.message, systemPromot))
    })
    console.log(thoughtsInstance)
    const requset = await Promise.allSettled(thoughtsInstance)
    const result = requset.filter(data => data.status === 'fulfilled')
    result.forEach((model) => {
      thoughts.push(model.value)
    })

    this.thoughtsArray.forEach((modelName, index) => {
      this.SaveHash(modelName, thoughts[index])
    })
    insertUsersMessage(this.chatId, this.userId, 'message', this.question, getCounterUser(this.chatId, this.userId) + 1)
    return thoughts
  }

  private async Compressed(tokens: number) {
    if (tokens >= 1000) {
      const model = this.thoughtsArray[0]
      const historyChat = getHistoryChat(this.chatId, model, getCounterChat(this.chatId, model))
      const historyUser = getHistoryUser(this.chatId, this.userId, getCounterUser(this.chatId, this.userId))
      const { commpresedMemory, userCharacter } = await memoryCompression(historyChat, historyUser)
      insertUsersMessage(this.chatId, this.userId, 'character', userCharacter, 1)
      insertChatMemory(this.chatId, commpresedMemory, 1)
    }
  }

  private async Connector(thoughtsList: string[]) {
    const chapterModel = new OpenAIModel('', this.chapter, 0.7, 1000)
    const memeoryChat = getMemoryChat(this.chatId)
    const userCharacter = getUserCharacter(this.chatId, this.userId)
    const prompt = connectorMary(this.question, this.userName, memeoryChat, userCharacter, thoughtsList)
    const answer = await chapterModel.Request([{ role: 'system', content: systemPromot }, { role: 'user', content: prompt }]) ?? 'Прости произошла ошибка'
    chapterModel.ChangeToStatus()
    this.SaveAnswer(answer)
    const tokens = getTokens(this.chatId, this.thoughtsArray[0])
    await this.Compressed(tokens)
    return answer
  }

  async Request() {
    console.log('Я работаю')
    const hashList = this.getHash
    if (hashList.length !== 0) {
      console.log('hash activated')
      const answer = await this.Connector(hashList)
      return answer
    }
    else {
      console.log('hash diactivate')
      const thoughtsArray = await this.RequestForThoughts()
      const answer = await this.Connector(thoughtsArray)
      return answer
    }
  }

  async ImageGenerator() {
    const ai = new OpenAIModel('', this.creatorImagePrompt, 0.5, 100)
    const prompt = await ai.Request(promptToImageGen(this.question)) ?? 'pixel art Error'
    console.log(prompt)
    const image_url = await ai.ImageGenerator(prompt) ?? 'Прости я не чего сделать не смогла'
    const answer = await this.Request()
    return `${answer} \n ${image_url} `
  }

  private SaveHash(modelName: ModelNameType, thoughts: string) {
    insertAiHash(this.chatId, modelName, this.question, thoughts)
  }

  private SaveAnswer(answer: string) {
    this.thoughtsArray.forEach((model) => {
      const counter = getCounterChat(this.chatId, model)
      const tokens = getTokens(this.chatId, model) + counterTokens(answer)
      insertChatMessages(this.chatId, answer, 'assistant', model, tokens, counter + 1)
    })
  }

  get getHash() {
    const hashList: any[] = []
    this.thoughtsArray.forEach((model) => {
      const hash = getHashQuery(this.chatId, model, this.question)
      if (hash !== null) {
        hashList.push(hash)
      }
    })
    return hashList
  }
}
