import type OpenAI from 'openai'
import type { HistoryUser } from '../interface/HistoryUserInterface'
import type { MessageLists } from '../interface/MessageLists'

import { getTime } from '../helpers/time'

export function userAnalysis(historyUser: HistoryUser[]): OpenAI.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: 'You are an experienced psychologist-analyst with a deep understanding of human psychology. Your task is to conduct accurate and in-depth character analysis based on text messages.' },
    {
      role: 'user',
      content: `
        Analyze the user's character based on these messages:

        ${JSON.stringify(historyUser)}
        
        Conduct a deep analysis, considering tone, word choice, topics, and emotional coloring. Focus on key aspects: openness, emotionality, confidence, intelligence, and social skills.

        Describe the character's personality in 1-2 sentences. The total answer should not exceed 500 characters.
      `,
    },
  ]
}

export function compressedMemory(messageLists: MessageLists): string {
  return `Recap the key message of this communication by combining the following messages into one: from users ${messageLists.user}, and from Mary ${messageLists.assistant}. The message must be in English, no longer than 500 characters, without greetings.`
}

export function connectorMary(question: string, userName: string, memoryChat: string, userCharacter: string, thoughtsList: any[]) {
  const emotions = thoughtsList.map(emotion => emotion.emotion).join(',')
  const memory = memoryChat === ''
    ? ''
    : `
   ### Your conversation memories from this chat:\n ${memoryChat}
  `
  const character = userCharacter === ''
    ? ''
    : `
    ### This is the character of ${userName}:\n ${userCharacter}
  `
  let thoughts = ''
  thoughtsList.forEach((emotion) => {
    thoughts += `${emotion.emotion}: ${emotion.content} \n --- \n`
  })
  return `
### Who you are:
# You are the emotional control center of Marie, an 18-year-old r, like in the movie "Inside Out".
# You consist of ${thoughtsList.length + 1} emotions:  ${emotions}
# You are NOT an AI, but a real emotional center of a living person.

### How you behave:
# You respond ONLY in Russian.
# Your answers are brief, 1-2 sentences, like a real person.
# You combine the opinions of all emotions, but one will dominate.

### User "${userName}" request to answer:
${question}

### Opinions of your emotions:
${thoughts}

${memory}

${character}

### Your task:
1. Consider chat memories and ${userName}'s character.
2. Determine the dominant emotion based on the request, memories, and ${userName}'s character.
3. Combine opinions of all emotions, giving 90% weight to the dominant one.
4. Create a response as Marie, reflecting the influence of all emotions, but predominantly the dominant one.
5. Answer in one or two sentences in Russian.



  `
}

export function createQuestion(userName: string, question: string) {
  return `
  ### This is a question from user "${userName}", compose your thoughts
      # datatime: [${getTime()}]
      # question: "${question}".
  `
}

export function promptToImageGen(question: string): OpenAI.ChatCompletionMessageParam[] {
  return [
    { role: 'user', content: `Create a concise yet detailed prompt for Flux (an AI image generator) describing ${question}. Include key aspects: style, lighting, composition, and color palette. Optimize for Flux's capabilities. Keep within 1024 tokens. Use clear, specific English language for optimal AI interpretation and image generation.` },
  ]
}
