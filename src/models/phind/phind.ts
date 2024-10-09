import type OpenAI from 'openai'
import axios from 'axios'

function createMessage(answerList: string[]) {
  let answer = ''
  answerList.forEach((line) => {
    const word = JSON.parse(line).choices[0].delta.content
    answer += word
  })
  return answer
}

export async function requestToPhind(history: OpenAI.Chat.ChatCompletionMessageParam[]) {
  const data = {
    additional_extension_context: '',
    allow_magic_buttons: true,
    is_vscode_extension: true,
    message_history: [
      ...history,
    ],
    requested_model: 'llama3-8b-phind-8b-v2-checkpoint-5500',
    user_input: `[INST]The text must contain no more than 500 tokens[/INST]  ${history[history.length - 1].content}`,
  }
  try {
    const response = await axios.post('https://https.extension.phind.com/agent/', data, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '',
        'Accept': '*/*',
        'Accept-Encoding': 'Identity',
      },
    })

    const answerAI = response.data
    const answerList = answerAI.split('data: ')
    answerList.splice(0, 2)
    answerList.pop()
    return createMessage(answerList)
  }
  catch (error) {
    console.log(`error${error}`)
  }
}
