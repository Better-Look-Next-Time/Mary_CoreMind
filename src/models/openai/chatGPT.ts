import { counterTokens } from '../../helpers/counterTokens'
import { addSystem, getCounter, getHistory, getTokens, insertInDateBase } from '../../helpers/db'
import { requestFromAi } from './openai'

export async function chatGPT(chatId: string, question: string, userName: string): Promise<string> {
  addSystem(chatId, 'gpt-3.5-turbo-1106')
  const counter = getCounter(chatId, 'gpt-3.5-turbo-1106')
  const tokens = getTokens(chatId, 'mixtral-8x7b-instruct') + counterTokens(question)
  insertInDateBase(chatId, question, 'user', 'gpt-3.5-turbo-1106', userName, counter, tokens)
  const history = getHistory(chatId, 'gpt-3.5-turbo-1106', counter)
  try {
    return (
      (await requestFromAi(history, 'gpt-3.5-turbo-1106', 0.7, 200))
      ?? 'Прости но я не могу выполнить твой запрос'
    )
  }
  catch (error) {
    return `Произошла ошибка: ${error}`
  }
}
