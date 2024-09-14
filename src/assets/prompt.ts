import type OpenAI from 'openai'
import type { HistoryUser } from '../interface/HistoryUserInterface'

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
