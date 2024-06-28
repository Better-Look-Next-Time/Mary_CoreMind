import { counterTokens } from '../../helpers/counterTokens'
import { addSystem, getCounter, getHistory, getTokens, insertInDateBase } from '../../helpers/db'
import { requestFromAi } from './openai'

export async function command(chatId: string, question: string, userName: string): Promise<string> {
  addSystem(chatId, 'command-r-plus')
  const counter = getCounter(chatId, 'command-r-plus')
  const tokens = getTokens(chatId, 'command-r-plus') + counterTokens(question)
  insertInDateBase(chatId, question, 'user', 'command-r-plus', userName, counter, tokens)
  const history = getHistory(chatId, 'command-r-plus', counter)
  try {
    return (await requestFromAi(history, 'command-r-plus', 0.5, 100)) ?? 'Прости я не смогу ответить на твой вопрос'
  }
  catch (error) {
    return `Произашла ошибка ${error}`
  }
}
