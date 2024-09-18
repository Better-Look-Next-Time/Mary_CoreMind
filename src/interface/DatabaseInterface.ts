export interface ContentResult {
  content: string | null
}

export interface CounterResult {
  counter: number | null
}

export interface TokenResult {
  tokens: number | null
}

export interface UserCharacterResult {
  userCharacter: string | null
}

export interface AvailabilityAIResult {
  is_active: boolean | null
}

export interface DataAvailabilityResult {
  next_available_date: string | null
}

export type UserMessageType = 'message' | 'character'
