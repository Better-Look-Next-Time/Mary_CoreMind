import { counterTokens } from '../../helpers/counterTokens'
import { addSystem, getCounter, getHistory, getTokens, insertInDateBase } from '../../helpers/db'
import { requestFromAi } from './openai'

export async function mixtrial(chatId: string, question: string, userName: string): Promise<string> {
  addSystem(chatId, 'mixtral-8x7b-instruct')
  const counter = getCounter(chatId, 'mixtral-8x7b-instruct')
  const message = `${question}`
  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct') + counterTokens(message)
  insertInDateBase(chatId, message, 'user', 'mixtral-8x7b-instruct', userName, counter, tokens)
  const history = getHistory(chatId, 'mixtral-8x7b-instruct', counter)
  try {
    return (
      (await requestFromAi(history, 'mixtral-8x7b-instruct', 0.7, 200))
      ?? 'Прости я не смогу ответить на твой вопрос'
    )
  }
  catch (error) {
    return `Произашла ошибка ${error}`
  }
}
